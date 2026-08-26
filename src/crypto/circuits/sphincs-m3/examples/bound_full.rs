//! Full-scale bound measurement: the whole Keccak table of one real
//! SLH-DSA-SHAKE-128s verification, publishing its digests into the
//! `HASH_DAG` interaction, batched with the consumer table.
//!
//! Run: `cargo run --release --example bound_full`

use core::convert::Infallible;
use std::time::Instant;

use slh_dsa::{Shake128s, SigningKey, VerifyingKey};

use sphincs_m2::dag::build_dag;
use sphincs_m2::hash::shake256_parts;
use sphincs_m2::verify::slh_verify;
use sphincs_m3::bound::{prove_bound, verify_bound};
use sphincs_m3::stark::FriSettings;
use sphincs_m3::tables::build_bound_tables;

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

    let out = slh_verify(msg, &sig.to_bytes(), b"", &vk.to_bytes());
    assert!(out.valid);
    let dag = build_dag(&out.trace);

    let settings = FriSettings::production();
    let tables = build_bound_tables(&out.trace, &dag, settings.log_blowup);
    let s = tables.stats;

    println!("# M3 bound: Keccak table publishes digests into HASH_DAG");
    println!("# hash calls: {}  internal edges: {}  external inputs: {}", s.calls, s.edges, s.external_inputs);
    println!("# keccak table: {} rows x {} cols", s.producer_rows, sphincs_m3::keccak_link::WIDTH);
    println!("# consumer table: {} rows x {} cols", s.consumer_rows, sphincs_m3::link::WIDTH);
    println!("# FRI: log_blowup=3 queries=100 pow=16");

    let t0 = Instant::now();
    let linked = prove_bound(tables.keccak, tables.consumer, settings);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;

    let t1 = Instant::now();
    let result = verify_bound(&linked);
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;

    println!();
    println!("{:>12} | {:>12} | {:>7}", "prove_ms", "verify_ms", "ok");
    println!("{:>12.1} | {:>12.1} | {:>7}", prove_ms, verify_ms, result.is_ok());
    if let Err(e) = result { println!("verify error: {e}"); }
}
