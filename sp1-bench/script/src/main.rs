//! SP1 Host Script for Dilithium STARK Verification Benchmark
//!
//! This script runs on the host machine and:
//! 1. Generates real Dilithium polynomial coefficients
//! 2. Compiles the guest program to RISC-V
//! 3. Executes it in the SP1 VM (measuring cycles)
//! 4. Optionally generates a ZK proof
//! 5. Reports detailed performance metrics

use serde::{Deserialize, Serialize};
use sp1_sdk::{include_elf, ProverClient, SP1Stdin};
use std::time::Instant;

/// The ELF we want to execute inside the zkVM.
pub const GUEST_ELF: &[u8] = include_elf!("dilithium-sp1-program");

/// Dilithium prime modulus Q = 2^23 - 2^13 + 1 = 8380417
const Q: u64 = 8380417;

/// Input structure matching the guest program
#[derive(Serialize, Deserialize, Clone)]
pub struct BenchmarkInput {
    pub trace_size: usize,
    pub iterations: u32,
    pub coefficients: Vec<u64>,
}

/// Result structure from guest program
#[derive(Serialize, Deserialize, Debug)]
pub struct BenchmarkResult {
    pub success: bool,
    pub trace_size: usize,
    pub iterations_completed: u32,
    pub total_ntt_ops: u32,
    pub total_fma_ops: u32,
    pub total_truncations: u32,
    pub total_norm_checks: u32,
}

/// Benchmark configuration
struct BenchmarkConfig {
    trace_sizes: Vec<usize>,
    iterations: u32,
    generate_proof: bool,
}

impl Default for BenchmarkConfig {
    fn default() -> Self {
        Self {
            // Test with increasing trace sizes (Dilithium uses N=256)
            trace_sizes: vec![256, 512, 1024, 2048, 4096],
            iterations: 1,
            generate_proof: false,
        }
    }
}

/// Generate realistic Dilithium polynomial coefficients
///
/// Uses a deterministic PRNG to generate coefficients mod Q
fn generate_dilithium_coefficients(n: usize, seed: u64) -> Vec<u64> {
    let mut coeffs = Vec::with_capacity(n);
    let mut state = seed;

    for _ in 0..n {
        // splitmix64-like PRNG
        state = state.wrapping_add(0x9E3779B97F4A7C15);
        let mut z = state;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D049BB133111EB);
        z = z ^ (z >> 31);

        coeffs.push(z % Q);
    }

    coeffs
}

fn main() {
    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║     SP1 Dilithium STARK Verification Benchmark               ║");
    println!("║     Phase 1: Real Dilithium NTT Operations                   ║");
    println!("╚══════════════════════════════════════════════════════════════╝");
    println!();

    // Initialize SP1 prover client
    println!("[1/4] Initializing SP1 Prover Client...");
    let client = ProverClient::from_env();

    // Load the ELF (compiled guest program)
    println!("[2/4] Loading compiled guest program (ELF)...");
    let elf = GUEST_ELF;

    let config = BenchmarkConfig::default();

    println!("[3/4] Running benchmarks with REAL Dilithium operations...");
    println!();
    println!("Operations performed in zkVM:");
    println!("  - Montgomery multiplication (mod Q = 8380417)");
    println!("  - NTT butterfly with twiddle factors");
    println!("  - FMA (Fused Multiply-Add) for matrix ops");
    println!("  - Truncation for rounding operations");
    println!("  - Norm checks for signature bounds");
    println!("  - Keccak chi step for SHAKE256");
    println!();
    println!("┌────────────┬────────────────┬────────────────┬──────────────┬──────────────┐");
    println!("│ Trace Size │ Total Cycles   │ Exec Time (ms) │ Operations   │ Status       │");
    println!("├────────────┼────────────────┼────────────────┼──────────────┼──────────────┤");

    let mut results: Vec<(usize, u64, u128, BenchmarkResult)> = Vec::new();

    for trace_size in &config.trace_sizes {
        // Generate realistic Dilithium coefficients
        let coefficients = generate_dilithium_coefficients(*trace_size, 0x12345678);

        let input = BenchmarkInput {
            trace_size: *trace_size,
            iterations: config.iterations,
            coefficients,
        };

        let mut stdin = SP1Stdin::new();
        stdin.write(&input);

        // Execute (without proof generation) to measure cycles
        let start = Instant::now();
        let (mut output, report) = client
            .execute(elf, &stdin)
            .run()
            .expect("Execution failed");
        let exec_time = start.elapsed().as_millis();

        // Read result from guest
        let result: BenchmarkResult = output.read();
        let total_cycles = report.total_instruction_count();

        // Calculate total operations
        let total_ops = result.total_ntt_ops
            + result.total_fma_ops
            + result.total_truncations
            + result.total_norm_checks;

        println!(
            "│ {:>10} │ {:>14} │ {:>14} │ {:>12} │ {:>12} │",
            trace_size,
            format_cycles(total_cycles),
            exec_time,
            total_ops,
            if result.success { "✓ Success" } else { "✗ Failed" }
        );

        results.push((*trace_size, total_cycles, exec_time, result));
    }

    println!("└────────────┴────────────────┴────────────────┴──────────────┴──────────────┘");
    println!();

    // Detailed operation breakdown
    println!("[4/4] Detailed Analysis");
    println!("═══════════════════════════════════════════════════════════════");
    println!();
    println!("Operation Breakdown per Trace Size:");
    println!("┌────────────┬──────────┬──────────┬──────────┬──────────┐");
    println!("│ Trace Size │ NTT Ops  │ FMA Ops  │ Truncate │ Norm Chk │");
    println!("├────────────┼──────────┼──────────┼──────────┼──────────┤");

    for (size, _, _, result) in &results {
        println!(
            "│ {:>10} │ {:>8} │ {:>8} │ {:>8} │ {:>8} │",
            size,
            result.total_ntt_ops,
            result.total_fma_ops,
            result.total_truncations,
            result.total_norm_checks
        );
    }
    println!("└────────────┴──────────┴──────────┴──────────┴──────────┘");
    println!();

    // Scaling analysis
    if results.len() >= 2 {
        let (size1, cycles1, _, _) = &results[0];
        let (size2, cycles2, _, _) = &results[results.len() - 1];

        let size_ratio = *size2 as f64 / *size1 as f64;
        let cycle_ratio = *cycles2 as f64 / *cycles1 as f64;

        println!("Scaling Analysis:");
        println!("  Trace size increase: {:.1}x ({} → {})", size_ratio, size1, size2);
        println!("  Cycle count increase: {:.1}x", cycle_ratio);
        println!(
            "  Scaling factor: O(n^{:.2})",
            cycle_ratio.log2() / size_ratio.log2()
        );
    }

    // Cost estimation
    println!();
    println!("Cost Estimation (Succinct Network):");
    if let Some((_, cycles, _, result)) = results.iter().find(|(s, _, _, _)| *s == 4096) {
        // Approximate cost: $0.001 per 1M cycles
        let cost_per_million = 0.001;
        let estimated_cost = (*cycles as f64 / 1_000_000.0) * cost_per_million;
        println!("  N=4096 verification: ~{} cycles", format_cycles(*cycles));
        println!("  Total operations: {} (NTT: {}, FMA: {}, Trunc: {}, Norm: {})",
            result.total_ntt_ops + result.total_fma_ops + result.total_truncations + result.total_norm_checks,
            result.total_ntt_ops,
            result.total_fma_ops,
            result.total_truncations,
            result.total_norm_checks
        );
        println!("  Estimated proof cost: ${:.4}", estimated_cost);
    }

    // Cycles per operation analysis
    println!();
    println!("Cycles per Operation:");
    for (size, cycles, _, result) in &results {
        let total_ops = result.total_ntt_ops
            + result.total_fma_ops
            + result.total_truncations
            + result.total_norm_checks;

        if total_ops > 0 {
            let cycles_per_op = *cycles as f64 / total_ops as f64;
            println!("  N={}: {:.1} cycles/op", size, cycles_per_op);
        }
    }

    // Recommendations
    println!();
    println!("Recommendations:");
    println!("═══════════════════════════════════════════════════════════════");

    let avg_cycles_per_trace_element: f64 = results
        .iter()
        .map(|(size, cycles, _, _)| *cycles as f64 / *size as f64)
        .sum::<f64>()
        / results.len() as f64;

    if avg_cycles_per_trace_element < 10000.0 {
        println!("✓ SP1 is RECOMMENDED for Dilithium verification");
        println!("  - Real Montgomery arithmetic runs efficiently");
        println!("  - NTT/FMA operations scale well");
        println!("  - Succinct Network integration ready");
    } else if avg_cycles_per_trace_element < 50000.0 {
        println!("◐ SP1 is VIABLE but consider optimization");
        println!("  - Some cycle overhead observed");
        println!("  - Consider SP1 precompiles for heavy operations");
    } else {
        println!("✗ SP1 may NOT be optimal for this workload");
        println!("  - High cycle count per element");
        println!("  - Consider native STARK circuits");
    }

    // Optional: Generate actual ZK proof
    if config.generate_proof {
        println!();
        println!("Generating ZK Proof (this may take a while)...");

        let coefficients = generate_dilithium_coefficients(256, 0x12345678);
        let input = BenchmarkInput {
            trace_size: 256,
            iterations: 1,
            coefficients,
        };

        let mut stdin = SP1Stdin::new();
        stdin.write(&input);

        let (pk, vk) = client.setup(elf);

        let start = Instant::now();
        let proof = client
            .prove(&pk, &stdin)
            .run()
            .expect("Proof generation failed");
        let prove_time = start.elapsed();

        println!("Proof generated in: {:?}", prove_time);
        println!("Proof size: {} bytes", proof.bytes().len());

        // Verify the proof
        client.verify(&proof, &vk).expect("Verification failed");
        println!("Proof verified successfully!");
    }

    println!();
    println!("Benchmark complete.");
    println!();
    println!("Summary: Real Dilithium NTT operations executed in SP1 zkVM");
    println!("  - Montgomery arithmetic: Q = 8,380,417");
    println!("  - Twiddle factors: zeta = 1753 (primitive 512-th root)");
    println!("  - Constraints verified: NTT, FMA, Truncation, Norm, Keccak χ");
}

/// Format large cycle counts with K/M suffixes
fn format_cycles(cycles: u64) -> String {
    if cycles >= 1_000_000 {
        format!("{:.2}M", cycles as f64 / 1_000_000.0)
    } else if cycles >= 1_000 {
        format!("{:.2}K", cycles as f64 / 1_000.0)
    } else {
        cycles.to_string()
    }
}
