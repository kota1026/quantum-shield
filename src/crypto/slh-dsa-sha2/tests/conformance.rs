//! Cross-validation against the independent RustCrypto `slh-dsa`
//! implementation.
//!
//! A self-consistency test would not catch a shared misreading of FIPS 205, so
//! every signature here is produced by code this repository did not write.

use core::convert::Infallible;

use sha2::{Digest, Sha256};
use slh_dsa::{Sha2_128s, SigningKey, VerifyingKey};
use slh_dsa_sha2::params::*;
use slh_dsa_sha2::verify::{base_2b, slh_verify};

/// Deterministic RNG so key generation is reproducible across runs.
struct CountRng {
    state: [u8; 32],
    buf: Vec<u8>,
    pos: usize,
}

impl CountRng {
    fn new(seed: u64) -> Self {
        let mut state = [0u8; 32];
        state[..8].copy_from_slice(&seed.to_le_bytes());
        Self { state, buf: Vec::new(), pos: 0 }
    }

    fn next_byte(&mut self) -> u8 {
        if self.pos >= self.buf.len() {
            let mut hasher = Sha256::new();
            hasher.update(self.state);
            self.state = hasher.finalize().into();
            self.buf = self.state.to_vec();
            self.pos = 0;
        }
        let b = self.buf[self.pos];
        self.pos += 1;
        b
    }
}

impl rand_core::TryRng for CountRng {
    type Error = Infallible;
    fn try_next_u32(&mut self) -> Result<u32, Infallible> {
        let mut b = [0u8; 4];
        self.try_fill_bytes(&mut b)?;
        Ok(u32::from_le_bytes(b))
    }
    fn try_next_u64(&mut self) -> Result<u64, Infallible> {
        let mut b = [0u8; 8];
        self.try_fill_bytes(&mut b)?;
        Ok(u64::from_le_bytes(b))
    }
    fn try_fill_bytes(&mut self, dst: &mut [u8]) -> Result<(), Infallible> {
        for s in dst.iter_mut() {
            *s = self.next_byte();
        }
        Ok(())
    }
}

impl rand_core::TryCryptoRng for CountRng {}

fn oracle_case(seed: u64, msg: &[u8]) -> (Vec<u8>, Vec<u8>) {
    let mut rng = CountRng::new(seed);
    let sk = SigningKey::<Sha2_128s>::new(&mut rng);
    let vk: VerifyingKey<Sha2_128s> = sk.as_ref().clone();
    let sig = signature::Signer::sign(&sk, msg);
    (vk.to_bytes().to_vec(), sig.to_bytes().to_vec())
}

/// The parameter set must be the one FIPS 205 Table 2 specifies, so a later
/// failure cannot be a size mismatch in disguise.
#[test]
fn sizes_match_fips205_table2() {
    let (pk, sig) = oracle_case(1, b"quantum shield");
    assert_eq!(pk.len(), PK_BYTES, "PK.seed || PK.root = 32 bytes");
    assert_eq!(sig.len(), SIG_BYTES, "SLH-DSA-SHA2-128s signature is 7856 bytes");
    assert_eq!(SIG_BYTES, 7856);
    assert_eq!(M, 30);
    assert_eq!(LEN, 35);
}

/// The load-bearing test: our verifier must accept signatures from an
/// independently written FIPS 205 implementation.
#[test]
fn accepts_independent_implementation_signatures() {
    for seed in 0..3u64 {
        let msg = format!("message {seed}");
        let (pk, sig) = oracle_case(seed, msg.as_bytes());
        assert!(
            slh_verify(msg.as_bytes(), &sig, b"", &pk),
            "seed {seed}: a valid signature must verify"
        );
    }
}

/// Empty and multi-block messages exercise the H_msg boundary.
#[test]
fn accepts_empty_and_long_messages() {
    for msg in [vec![], vec![0xABu8; 5000]] {
        let (pk, sig) = oracle_case(9, &msg);
        assert!(slh_verify(&msg, &sig, b"", &pk));
    }
}

/// Every tampering class must be rejected.
#[test]
fn rejects_tampered_inputs() {
    let msg = b"quantum shield";
    let (pk, sig) = oracle_case(7, msg);
    assert!(slh_verify(msg, &sig, b"", &pk));

    assert!(!slh_verify(b"quantum shielc", &sig, b"", &pk), "tampered message");

    let mut bad = sig.clone();
    bad[0] ^= 1;
    assert!(!slh_verify(msg, &bad, b"", &pk), "tampered randomizer R");

    let mut bad = sig.clone();
    bad[N + 5] ^= 1;
    assert!(!slh_verify(msg, &bad, b"", &pk), "tampered FORS signature");

    let mut bad = sig.clone();
    let last = bad.len() - 1;
    bad[last] ^= 1;
    assert!(!slh_verify(msg, &bad, b"", &pk), "tampered hypertree auth path");

    let mut bad_pk = pk.clone();
    bad_pk[PK_BYTES - 1] ^= 1;
    assert!(!slh_verify(msg, &sig, b"", &bad_pk), "tampered public key root");

    assert!(!slh_verify(msg, &sig, b"ctx", &pk), "wrong context");
}

/// `base_2b` is shared with the Solidity side and is easy to get subtly wrong.
#[test]
fn base_2b_matches_worked_examples() {
    assert_eq!(base_2b(&[0x12, 0x34], 4, 4), vec![1, 2, 3, 4]);
    assert_eq!(base_2b(&[0xFF, 0xFF], 4, 4), vec![15, 15, 15, 15]);
    assert_eq!(base_2b(&[0b1010_1010], 1, 8), vec![1, 0, 1, 0, 1, 0, 1, 0]);
}
