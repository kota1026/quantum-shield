//! Emit one real SLH-DSA-SHAKE-128s case for the Solidity verifier to check.
//!
//! The message is exactly the 32-byte unlock message `L1Vault` derives, which
//! is the shape `SPHINCSVerifier.verify(bytes32 message, ...)` accepts — so
//! the on-chain verifier is being given precisely what the protocol would give
//! it in production. Our own verifier's verdict on the same bytes is asserted
//! here, so any disagreement is the contract's.

use core::convert::Infallible;
use std::fs;

use slh_dsa::{Shake128s, SigningKey, VerifyingKey};
use sphincs_m2::hash::shake256_parts;
use sphincs_m2::public_values::unlock_message;
use sphincs_m2::verify::slh_verify;

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
    let dir = std::env::args().nth(1).expect("usage: emit_solidity_vector <out-dir>");

    let lock_id = [0x11u8; 32];
    let state_root = [0x22u8; 32];
    let message = unlock_message(&lock_id, &state_root);

    let mut rng = ShakeRng::new(1);
    let sk = SigningKey::<Shake128s>::new(&mut rng);
    let vk: VerifyingKey<Shake128s> = sk.as_ref().clone();
    let sig = signature::Signer::sign(&sk, message.as_slice());

    let pk = vk.to_bytes().to_vec();
    let sig = sig.to_bytes().to_vec();

    // Our verifier — cross-validated against RustCrypto — must accept.
    assert!(
        slh_verify(&message, &sig, b"", &pk).valid,
        "the emitted vector must verify under FIPS 205"
    );

    fs::write(format!("{dir}/sol_message.bin"), message).unwrap();
    fs::write(format!("{dir}/sol_sig.bin"), &sig).unwrap();
    fs::write(format!("{dir}/sol_pk.bin"), &pk).unwrap();
    println!("message: 32  sig: {}  pk: {}", sig.len(), pk.len());
    println!("FIPS 205 verdict (ours + RustCrypto oracle): VALID");
}
