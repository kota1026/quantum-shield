//! Emit a 2-of-4 threshold vector for the zkVM guest.
//!
//! Four registered provers, the first two signing an unlock. Signatures come
//! from the independent RustCrypto implementation, so the guest verifies the
//! real thing rather than something this repo also produced.

use core::convert::Infallible;
use std::fs;

use slh_dsa::{Shake128s, SigningKey, VerifyingKey};
use sphincs_m2::hash::shake256_parts;
use sphincs_m2::public_values::unlock_message;
use sphincs_m2::registry::{commit_members, compute_leaf, merkle_path, pubkey_hash, Member};
use sphincs_m2::threshold::{evaluate, SignerClaim, ThresholdInput};

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

fn main() {
    let dir = std::env::args().nth(1).expect("usage: emit_threshold_vector <out-dir>");

    let lock_id = [0x11u8; 32];
    let state_root = [0x22u8; 32];
    let message = unlock_message(&lock_id, &state_root);

    let provers: Vec<([u8; 20], Vec<u8>, Vec<u8>)> = (0..4u8)
        .map(|i| {
            let mut rng = ShakeRng::new(i as u64 + 1);
            let sk = SigningKey::<Shake128s>::new(&mut rng);
            let vk: VerifyingKey<Shake128s> = sk.as_ref().clone();
            let sig = signature::Signer::sign(&sk, message.as_slice());
            let mut address = [0u8; 20];
            address[19] = i + 1;
            (address, vk.to_bytes().to_vec(), sig.to_bytes().to_vec())
        })
        .collect();

    let members: Vec<Member> = provers
        .iter()
        .map(|(a, pk, _)| Member { address: *a, pubkey_hash: pubkey_hash(pk, None) })
        .collect();
    let leaves: Vec<_> = members.iter().map(|m| compute_leaf(m, None)).collect();
    let (_, set_commitment) = commit_members(&members);

    let input = ThresholdInput {
        lock_id,
        state_root,
        set_commitment,
        member_count: members.len() as u32,
        claims: (0..2)
            .map(|i| SignerClaim {
                address: provers[i].0,
                public_key: provers[i].1.clone(),
                signature: provers[i].2.clone(),
                index: i as u32,
                path: merkle_path(&leaves, i),
            })
            .collect(),
    };

    let pv = evaluate(&input).expect("the emitted vector must evaluate");
    assert_eq!(pv.valid_count, 2, "2-of-4 must yield a count of two");

    let bytes = input.encode();
    fs::write(format!("{dir}/threshold_input.bin"), &bytes).unwrap();
    println!("members: {}  signers: {}", members.len(), input.claims.len());
    println!("valid_count: {}", pv.valid_count);
    println!("wrote threshold_input.bin ({} bytes)", bytes.len());
}
