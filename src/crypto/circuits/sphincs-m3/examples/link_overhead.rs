//! M3 PoC measurement: what does the LogUp DAG-linking argument cost?
//!
//! Proves the two linked tables of a real SLH-DSA-SHAKE-128s verification's
//! hash DAG, with and without the global lookup, and reports the difference.
//!
//! Run: `cargo run --release --example link_overhead`

use core::convert::Infallible;
use std::time::Instant;

use p3_batch_stark::prover::prove_batch_no_lookups;
use p3_lookup::lookup_traits::AirNoLookup;
use p3_batch_stark::{CommonData, StarkInstance};
use p3_util::log2_strict_usize;
use slh_dsa::{Shake128s, SigningKey, VerifyingKey};

use sphincs_m2::dag::build_dag;
use sphincs_m2::hash::shake256_parts;
use sphincs_m2::verify::slh_verify;
use sphincs_m3::link::{LinkAir, Side, WIDTH};
use sphincs_m3::stark::{make_config, prove_linked, verify_linked, FriSettings, MyConfig};
use sphincs_m3::tables::build_tables;

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
    let tables = build_tables(&out.trace, &dag);
    let s = tables.stats;

    println!("# M3 PoC: LogUp DAG linking over a real SLH-DSA-SHAKE-128s verification");
    println!("# hash calls (produced digests): {}", s.calls);
    println!("# internal edges (consumed):     {}", s.edges);
    println!("# external inputs (sig/pk):      {}", s.external_inputs);
    println!("# table rows: producer={} consumer={} (width {})", s.producer_rows, s.consumer_rows, WIDTH);
    println!("# FRI: log_blowup=3 queries=100 pow=16");

    let settings = FriSettings::production();

    // --- with the global LogUp lookup ---
    let t0 = Instant::now();
    let linked = prove_linked(tables.producer.clone(), tables.consumer.clone(), settings);
    let prove_lookup_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let t1 = Instant::now();
    let ok = verify_linked(&linked).is_ok();
    let verify_lookup_ms = t1.elapsed().as_secs_f64() * 1000.0;

    // --- same tables, no lookup registered (baseline) ---
    let config = make_config(settings);
    let log_degrees = [
        log2_strict_usize(tables.producer.values.len() / WIDTH),
        log2_strict_usize(tables.consumer.values.len() / WIDTH),
    ];
    // AirNoLookup strips the lookup registration, so the baseline proves the
    // very same traces and row constraints with no linking argument at all.
    let mut plain = [
        AirNoLookup::new(LinkAir::new(Side::Producer)),
        AirNoLookup::new(LinkAir::new(Side::Consumer)),
    ];
    let common = CommonData::<MyConfig>::from_airs_and_degrees(&config, &mut plain, &log_degrees);
    let instances = StarkInstance::new_multiple(
        &plain,
        &[tables.producer, tables.consumer],
        &[vec![], vec![]],
        &common,
    );
    let t2 = Instant::now();
    let _base = prove_batch_no_lookups(&config, &instances, &common);
    let prove_base_ms = t2.elapsed().as_secs_f64() * 1000.0;

    println!();
    println!("{:>22} | {:>12} | {:>12} | {:>6}", "configuration", "prove_ms", "verify_ms", "ok");
    println!("{:>22} | {:>12.1} | {:>12.1} | {:>6}", "with LogUp linking", prove_lookup_ms, verify_lookup_ms, ok);
    println!("{:>22} | {:>12.1} | {:>12} | {:>6}", "baseline (no lookup)", prove_base_ms, "-", "-");
    println!();
    println!("# linking overhead: {:.1}x prove time", prove_lookup_ms / prove_base_ms);
}
