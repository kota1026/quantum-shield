//! SP1 Host Script for Dilithium STARK Verification Benchmark
//!
//! This script runs on the host machine and:
//! 1. Compiles the guest program to RISC-V
//! 2. Executes it in the SP1 VM (measuring cycles)
//! 3. Optionally generates a ZK proof
//! 4. Reports performance metrics

use serde::{Deserialize, Serialize};
use sp1_sdk::{ProverClient, SP1Stdin};
use std::time::Instant;

/// Input structure matching the guest program
#[derive(Serialize, Deserialize, Clone)]
pub struct BenchmarkInput {
    pub trace_size: usize,
    pub iterations: u32,
    pub proof_data: Option<Vec<u8>>,
}

/// Result structure from guest program
#[derive(Serialize, Deserialize, Debug)]
pub struct BenchmarkResult {
    pub success: bool,
    pub trace_size: usize,
    pub iterations_completed: u32,
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
            // Test with increasing trace sizes
            trace_sizes: vec![256, 512, 1024, 2048, 4096],
            iterations: 1,
            generate_proof: false, // Set to true for full ZK proof generation
        }
    }
}

fn main() {
    println!("╔══════════════════════════════════════════════════════════════╗");
    println!("║     SP1 Dilithium STARK Verification Benchmark               ║");
    println!("║     Phase 1: Recursive Proof Technology Evaluation           ║");
    println!("╚══════════════════════════════════════════════════════════════╝");
    println!();

    // Initialize SP1 prover client
    println!("[1/4] Initializing SP1 Prover Client...");
    let client = ProverClient::from_env();

    // Load the ELF (compiled guest program)
    println!("[2/4] Loading compiled guest program (ELF)...");
    let elf = include_bytes!("../../program/elf/riscv32im-succinct-zkvm-elf");

    let config = BenchmarkConfig::default();

    println!("[3/4] Running benchmarks...");
    println!();
    println!("┌────────────┬────────────────┬────────────────┬──────────────┐");
    println!("│ Trace Size │ Total Cycles   │ Exec Time (ms) │ Status       │");
    println!("├────────────┼────────────────┼────────────────┼──────────────┤");

    let mut results: Vec<(usize, u64, u128, bool)> = Vec::new();

    for trace_size in &config.trace_sizes {
        // Prepare input
        let input = BenchmarkInput {
            trace_size: *trace_size,
            iterations: config.iterations,
            proof_data: None,
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

        println!(
            "│ {:>10} │ {:>14} │ {:>14} │ {:>12} │",
            trace_size,
            format_cycles(total_cycles),
            exec_time,
            if result.success { "✓ Success" } else { "✗ Failed" }
        );

        results.push((*trace_size, total_cycles, exec_time, result.success));
    }

    println!("└────────────┴────────────────┴────────────────┴──────────────┘");
    println!();

    // Analysis
    println!("[4/4] Analysis");
    println!("═══════════════════════════════════════════════════════════════");

    if results.len() >= 2 {
        let (size1, cycles1, _, _) = results[0];
        let (size2, cycles2, _, _) = results[results.len() - 1];

        let size_ratio = size2 as f64 / size1 as f64;
        let cycle_ratio = cycles2 as f64 / cycles1 as f64;

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
    if let Some((_, cycles, _, _)) = results.iter().find(|(s, _, _, _)| *s == 4096) {
        // Approximate cost: $0.001 per 1M cycles (this is an estimate)
        let cost_per_million = 0.001;
        let estimated_cost = (*cycles as f64 / 1_000_000.0) * cost_per_million;
        println!("  N=4096 verification: ~{} cycles", format_cycles(*cycles));
        println!("  Estimated proof cost: ${:.4}", estimated_cost);
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
        println!("✓ SP1 is RECOMMENDED for this workload");
        println!("  - Cycle efficiency is acceptable");
        println!("  - Direct Rust code reuse achieved");
        println!("  - Succinct Network integration available");
    } else if avg_cycles_per_trace_element < 50000.0 {
        println!("◐ SP1 is VIABLE but consider optimization");
        println!("  - Some cycle overhead observed");
        println!("  - Consider precompiles for heavy operations");
    } else {
        println!("✗ SP1 may NOT be optimal for this workload");
        println!("  - High cycle count indicates inefficiency");
        println!("  - Consider Plonky2 or native circuits");
    }

    // Optional: Generate actual ZK proof
    if config.generate_proof {
        println!();
        println!("Generating ZK Proof (this may take a while)...");

        let input = BenchmarkInput {
            trace_size: 256, // Start small
            iterations: 1,
            proof_data: None,
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
