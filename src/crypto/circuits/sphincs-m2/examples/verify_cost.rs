//! How expensive is SLH-DSA verification natively?
//!
//! Feeds the wrap-strategy decision (gap analysis §19): if a wrapped proof is
//! produced by running a verifier inside a zkVM, the relevant comparison is
//! "cost of verifying our STARK" against "cost of just verifying the
//! signature", both measured in the same currency — Keccak permutations.

use core::convert::Infallible;
use std::time::Instant;

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
    let msg = b"quantum shield prover attestation";
    let mut rng = ShakeRng::new(1);
    let sk = SigningKey::<Shake128s>::new(&mut rng);
    let vk: VerifyingKey<Shake128s> = sk.as_ref().clone();
    let sig = signature::Signer::sign(&sk, msg.as_slice());
    let sig_bytes = sig.to_bytes();
    let vk_bytes = vk.to_bytes();

    // Warm up, and get the permutation count.
    let out = slh_verify(msg, &sig_bytes, b"", &vk_bytes);
    assert!(out.valid);
    let perms = out.trace.len();

    const ROUNDS: usize = 200;
    let t0 = Instant::now();
    for _ in 0..ROUNDS {
        let r = slh_verify(msg, &sig_bytes, b"", &vk_bytes);
        std::hint::black_box(&r.valid);
    }
    let per_verify_us = t0.elapsed().as_secs_f64() * 1e6 / ROUNDS as f64;

    println!("# SLH-DSA-SHAKE-128s native verification cost");
    println!("keccak permutations : {perms}");
    println!("wall clock          : {per_verify_us:.0} us");
    println!("us per permutation  : {:.3}", per_verify_us / perms as f64);
}
