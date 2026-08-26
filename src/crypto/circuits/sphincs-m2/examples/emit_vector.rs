//! Emit a fixed SLH-DSA-SHAKE-128s test vector for the zkVM guest.
//!
//! The guest embeds these bytes so its cycle count is reproducible and does
//! not depend on zkVM I/O plumbing.

use core::convert::Infallible;
use std::fs;

use slh_dsa::{Shake128s, SigningKey, VerifyingKey};
use sphincs_m2::hash::shake256_parts;
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
    let dir = std::env::args().nth(1).expect("usage: emit_vector <out-dir>");
    let msg = b"quantum shield prover attestation".to_vec();

    let mut rng = ShakeRng::new(1);
    let sk = SigningKey::<Shake128s>::new(&mut rng);
    let vk: VerifyingKey<Shake128s> = sk.as_ref().clone();
    let sig = signature::Signer::sign(&sk, msg.as_slice());

    let pk = vk.to_bytes().to_vec();
    let sig = sig.to_bytes().to_vec();

    let out = slh_verify(&msg, &sig, b"", &pk);
    assert!(out.valid, "the emitted vector must verify");
    println!("permutations: {}", out.trace.len());

    fs::write(format!("{dir}/msg.bin"), &msg).unwrap();
    fs::write(format!("{dir}/sig.bin"), &sig).unwrap();
    fs::write(format!("{dir}/pk.bin"), &pk).unwrap();
    println!("wrote msg.bin ({}), sig.bin ({}), pk.bin ({})", msg.len(), sig.len(), pk.len());
}
