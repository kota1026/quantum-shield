//! M1 benchmark: prove/verify a single WOTS+ chain (SPHINCS+-SHAKE-128s)
//! with production FRI settings and report timing + proof size.

use std::time::Instant;

use sphincs_m1::stark::{prove_chain, verify_chain, FriSettings};
use sphincs_m1::wots::{chain_witness, Adrs, N};

fn main() {
    let mut adrs = Adrs::new();
    adrs.set_type(Adrs::TYPE_WOTS_HASH);
    adrs.set_key_pair(1);

    let pk_seed = [0xA7u8; N];
    let x = [0x5Cu8; N];

    println!("# M1: WOTS+ chain proof (SPHINCS+-SHAKE-128s F chain)");
    println!("# field=Goldilocks ext=2  FRI: log_blowup=3 queries=100 pow=16");
    println!(
        "{:>6} | {:>10} | {:>12} | {:>12} | {:>14} | {:>7}",
        "steps", "rows", "prove_ms", "verify_ms", "proof_bytes", "ok"
    );

    for steps in [7usize, 15] {
        let witness = chain_witness(&pk_seed, &adrs, &x, 0, steps);
        let rows = (steps * 24).next_power_of_two();
        let settings = FriSettings::production();

        let t0 = Instant::now();
        let (proof, pvs) = prove_chain(&witness, settings);
        let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;

        let proof_size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);

        let t1 = Instant::now();
        let ok = verify_chain(&proof, &pvs, settings).is_ok();
        let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;

        println!(
            "{:>6} | {:>10} | {:>12.1} | {:>12.1} | {:>14} | {:>7}",
            steps, rows, prove_ms, verify_ms, proof_size, ok
        );
    }
}
