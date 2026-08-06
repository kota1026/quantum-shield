//! M0.5 input data: how far can FRI parameter tuning alone shrink the
//! proof, at a roughly constant conjectured security budget
//! (num_queries × log_blowup ≈ 300, + 16 PoW bits — the M0 baseline)?
//!
//! Answers whether proof wrapping is avoidable (spoiler from M0: no) and
//! quantifies the best-case raw-STARK size for the gap analysis.

use std::time::Instant;

use sphincs_m1::stark::{prove_chain, verify_chain, FriSettings};
use sphincs_m1::wots::{chain_witness, Adrs, N};

fn main() {
    let mut adrs = Adrs::new();
    adrs.set_type(Adrs::TYPE_WOTS_HASH);
    adrs.set_key_pair(1);
    let pk_seed = [0xA7u8; N];
    let x = [0x5Cu8; N];
    let witness = chain_witness(&pk_seed, &adrs, &x, 0, 15);

    // Constant budget: log_blowup * num_queries = 300, pow = 16.
    let scan: &[(usize, usize)] = &[(2, 150), (3, 100), (4, 75), (5, 60), (6, 50), (8, 38)];

    println!("# M0.5 FRI parameter scan — WOTS+ full chain (15 steps, 512 rows)");
    println!("# constant budget: log_blowup x queries ~ 300, pow=16");
    println!(
        "{:>10} | {:>8} | {:>12} | {:>12} | {:>14} | {:>7}",
        "log_blowup", "queries", "prove_ms", "verify_ms", "proof_bytes", "ok"
    );

    for &(log_blowup, num_queries) in scan {
        let settings = FriSettings { log_blowup, num_queries, proof_of_work_bits: 16 };

        let t0 = Instant::now();
        let (proof, pvs) = prove_chain(&witness, settings);
        let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;

        let size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);

        let t1 = Instant::now();
        let ok = verify_chain(&proof, &pvs, settings).is_ok();
        let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;

        println!(
            "{:>10} | {:>8} | {:>12.1} | {:>12.1} | {:>14} | {:>7}",
            log_blowup, num_queries, prove_ms, verify_ms, size, ok
        );
    }
}
