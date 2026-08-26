//! Host-side tests for the statement the zkVM guest proves.
//!
//! Signatures come from the independent RustCrypto `slh-dsa` implementation,
//! and the registry commitment is built the way `ProverRegistry.sol` builds
//! it, so a pass here means the guest is checking the real thing.

use core::convert::Infallible;

use slh_dsa::{Shake128s, SigningKey, VerifyingKey};
use sphincs_m2::hash::shake256_parts;
use sphincs_m2::public_values::unlock_message;
use sphincs_m2::registry::{commit_members, compute_leaf, merkle_path, pubkey_hash, Member};
use sphincs_m2::threshold::{evaluate, SignerClaim, ThresholdError, ThresholdInput};

struct ShakeRng { seed: u64, counter: u64, buf: Vec<u8>, pos: usize }

impl ShakeRng {
    fn new(seed: u64) -> Self { Self { seed, counter: 0, buf: Vec::new(), pos: 0 } }
    fn next_byte(&mut self) -> u8 {
        if self.pos >= self.buf.len() {
            self.buf = shake256_parts(&[&self.seed.to_le_bytes(), &self.counter.to_le_bytes()], 128, None);
            self.counter += 1;
            self.pos = 0;
        }
        let b = self.buf[self.pos];
        self.pos += 1;
        b
    }
}

impl rand_core::TryRng for ShakeRng {
    type Error = Infallible;
    fn try_next_u32(&mut self) -> Result<u32, Infallible> {
        let mut b = [0u8; 4]; self.try_fill_bytes(&mut b)?; Ok(u32::from_le_bytes(b))
    }
    fn try_next_u64(&mut self) -> Result<u64, Infallible> {
        let mut b = [0u8; 8]; self.try_fill_bytes(&mut b)?; Ok(u64::from_le_bytes(b))
    }
    fn try_fill_bytes(&mut self, dst: &mut [u8]) -> Result<(), Infallible> {
        for s in dst.iter_mut() { *s = self.next_byte(); }
        Ok(())
    }
}

impl rand_core::TryCryptoRng for ShakeRng {}

const LOCK_ID: [u8; 32] = [0x11; 32];
const STATE_ROOT: [u8; 32] = [0x22; 32];

/// Four registered provers; the first `signing` of them sign the unlock.
fn fixture(signing: usize) -> ThresholdInput {
    let message = unlock_message(&LOCK_ID, &STATE_ROOT);

    let provers: Vec<([u8; 20], Vec<u8>, Vec<u8>)> = (0..4u8)
        .map(|i| {
            let mut rng = ShakeRng::new(i as u64 + 1);
            let sk = SigningKey::<Shake128s>::new(&mut rng);
            let vk: VerifyingKey<Shake128s> = sk.as_ref().clone();
            let sig = signature::Signer::sign(&sk, message.as_slice());

            let mut address = [0u8; 20];
            address[19] = i + 1; // strictly increasing
            (address, vk.to_bytes().to_vec(), sig.to_bytes().to_vec())
        })
        .collect();

    let members: Vec<Member> = provers
        .iter()
        .map(|(addr, pk, _)| Member { address: *addr, pubkey_hash: pubkey_hash(pk, None) })
        .collect();
    let leaves: Vec<_> = members.iter().map(|m| compute_leaf(m, None)).collect();
    let (_, set_commitment) = commit_members(&members);

    let claims = (0..signing)
        .map(|i| SignerClaim {
            address: provers[i].0,
            public_key: provers[i].1.clone(),
            signature: provers[i].2.clone(),
            index: i as u32,
            path: merkle_path(&leaves, i),
        })
        .collect();

    ThresholdInput {
        lock_id: LOCK_ID,
        state_root: STATE_ROOT,
        set_commitment,
        member_count: members.len() as u32,
        claims,
    }
}

/// Two registered provers signing the unlock give a count of two.
#[test]
fn counts_two_registered_signers() {
    let input = fixture(2);
    let pv = evaluate(&input).expect("well-formed input");

    assert_eq!(pv.valid_count, 2);
    assert_eq!(pv.lock_id, LOCK_ID);
    assert_eq!(pv.state_root, STATE_ROOT);
    assert_eq!(pv.set_commitment, input.set_commitment);
}

/// A signature over a different unlock must not count — this is what stops a
/// proof for one lock being reused for another.
#[test]
fn rejects_a_signature_over_another_unlock() {
    let mut input = fixture(2);
    input.lock_id = [0x99; 32];
    assert_eq!(evaluate(&input).unwrap().valid_count, 0);
}

/// A signer who is not in the registry set does not count, however valid the
/// signature is (FR-THRESH-1(b)).
#[test]
fn rejects_a_valid_signature_from_a_non_member() {
    let mut input = fixture(2);
    // Change the *last* signer so the addresses stay strictly increasing —
    // otherwise the dedup check fires first and we would not reach membership.
    input.claims[1].address[19] = 0xFF; // never registered
    assert_eq!(evaluate(&input).unwrap().valid_count, 1);
}

/// Claiming a different member's position must not count.
#[test]
fn rejects_a_wrong_merkle_position() {
    let mut input = fixture(2);
    input.claims[1].index = 0;
    assert_eq!(evaluate(&input).unwrap().valid_count, 1);
}

/// A tampered signature does not count.
#[test]
fn rejects_a_tampered_signature() {
    let mut input = fixture(2);
    let last = input.claims[0].signature.len() - 1;
    input.claims[0].signature[last] ^= 1;
    assert_eq!(evaluate(&input).unwrap().valid_count, 1);
}

/// Deduplication: the same prover twice is not two signers. Repeats break the
/// strictly-increasing order, so the input is rejected outright rather than
/// silently counted twice.
#[test]
fn rejects_a_repeated_signer() {
    let mut input = fixture(2);
    input.claims[1] = input.claims[0].clone();
    assert_eq!(evaluate(&input), Err(ThresholdError::SignersNotStrictlyIncreasing));
}

/// Out-of-order signers are rejected for the same reason.
#[test]
fn rejects_unordered_signers() {
    let mut input = fixture(2);
    input.claims.swap(0, 1);
    assert_eq!(evaluate(&input), Err(ThresholdError::SignersNotStrictlyIncreasing));
}

/// A commitment the registry never published must yield nothing, even with
/// genuine signatures.
#[test]
fn rejects_a_fabricated_set_commitment() {
    let mut input = fixture(2);
    input.set_commitment[0] ^= 1;
    assert_eq!(evaluate(&input).unwrap().valid_count, 0);
}

/// The wire format the guest reads must round-trip exactly.
#[test]
fn wire_format_roundtrips() {
    let input = fixture(2);
    let bytes = input.encode();
    let decoded = ThresholdInput::decode(&bytes).expect("must decode");

    assert_eq!(decoded.lock_id, input.lock_id);
    assert_eq!(decoded.set_commitment, input.set_commitment);
    assert_eq!(decoded.claims.len(), 2);
    assert_eq!(evaluate(&decoded).unwrap(), evaluate(&input).unwrap());
}

/// Truncated input must fail to parse rather than prove a smaller claim.
#[test]
fn truncated_wire_format_is_rejected() {
    let input = fixture(2);
    let bytes = input.encode();
    assert!(ThresholdInput::decode(&bytes[..bytes.len() - 1]).is_none());
    assert!(ThresholdInput::decode(&[]).is_none());
}
