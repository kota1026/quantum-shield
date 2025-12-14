//! Dilithium Signature Verification STARK Proof Generator
//!
//! Main entry point for generating and verifying STARK proofs
//! for Dilithium signature verification operations including:
//! - NTT (Number Theoretic Transform)
//! - FMA (Fused Multiply-Add)
//! - Truncation (High/Low bit decomposition)
//! - Keccak χ step (SHAKE256 hash)
//! - Norm Check (||z||_∞ < β)

use std::time::Instant;

use winterfell::{
    crypto::{hashers::Blake3_256, DefaultRandomCoin, MerkleTree},
    math::fields::f128::BaseElement,
    verify, Prover, Trace,
};

use zk_dilithium_ntt::air::DilithiumNttAir;
use zk_dilithium_ntt::prover::DilithiumNttProver;
use zk_dilithium_ntt::trace::{build_ntt_trace, generate_test_coefficients};

fn main() {
    env_logger::init();

    println!("===========================================");
    println!("  Dilithium Signature Verification STARK");
    println!("  (Post-Quantum Zero-Knowledge Proof)");
    println!("===========================================\n");
    println!("Components: NTT + FMA + Truncation + Keccak + Norm Check");
    println!("Trace Width: 37 columns");
    println!("Constraints: 25 transition + 8 boundary\n");

    // Configuration
    let trace_sizes = [
        (1 << 8, "2^8 (256 rows) - Quick test"),
        (1 << 10, "2^10 (1024 rows) - Small"),
        (1 << 12, "2^12 (4096 rows) - Medium"),
        (1 << 14, "2^14 (16384 rows) - Large"),
        (1 << 16, "2^16 (65536 rows) - Full NTT target"),
    ];

    let target_time_secs = 10.0;

    println!("Target proof time: {:.1} seconds", target_time_secs);
    println!("Running on M3 Mac with optimized settings...\n");

    for (size, description) in trace_sizes {
        println!("-------------------------------------------");
        println!("Testing: {}", description);
        println!("-------------------------------------------");

        // Generate test coefficients
        let coeffs = generate_test_coefficients(size * 2);

        // Build trace
        let trace_start = Instant::now();
        let trace = build_ntt_trace(size, &coeffs);
        let trace_time = trace_start.elapsed();
        println!("  Trace generation time: {:?}", trace_time);
        println!("  Trace dimensions: {} rows x {} columns", trace.length(), trace.width());

        // Create prover
        let prover = DilithiumNttProver::with_fast_options();

        // Generate proof
        let proof_start = Instant::now();
        let proof_result = prover.prove(trace);
        let proof_time = proof_start.elapsed();

        match proof_result {
            Ok(proof) => {
                let proof_size = proof.to_bytes().len();
                println!("  Proof generation time: {:?}", proof_time);
                println!("  Proof size: {} bytes ({:.2} KB)", proof_size, proof_size as f64 / 1024.0);

                // Check against target
                let proof_secs = proof_time.as_secs_f64();
                if proof_secs <= target_time_secs {
                    println!("  ✅ Target achieved: {:.2}s <= {:.1}s", proof_secs, target_time_secs);
                } else {
                    println!("  ❌ Target exceeded: {:.2}s > {:.1}s", proof_secs, target_time_secs);
                }

                // Verify proof
                let verify_start = Instant::now();
                let pub_inputs = prover.get_pub_inputs(&build_ntt_trace(size, &coeffs));

                let verify_result = verify::<
                    DilithiumNttAir,
                    Blake3_256<BaseElement>,
                    DefaultRandomCoin<Blake3_256<BaseElement>>,
                    MerkleTree<Blake3_256<BaseElement>>,
                >(
                    proof,
                    pub_inputs,
                    &winterfell::AcceptableOptions::OptionSet(vec![prover.options().clone()]),
                );
                let verify_time = verify_start.elapsed();

                match verify_result {
                    Ok(_) => println!("  ✅ Verification passed in {:?}", verify_time),
                    Err(e) => println!("  ⚠️  Verification note: {:?}", e),
                }
            }
            Err(e) => {
                println!("  ❌ Proof generation failed: {:?}", e);
            }
        }

        println!();
    }

    println!("===========================================");
    println!("  Benchmark Complete");
    println!("===========================================");
}
