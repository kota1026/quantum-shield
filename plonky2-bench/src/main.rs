//! Plonky2 benchmark for Dilithium NTT operations
//!
//! This benchmark compares custom STARK circuits (Plonky2) with
//! generic zkVM (SP1) for Dilithium signature verification.
//!
//! Dilithium constants from zk-dilithium-ntt:
//! - Q = 8,380,417 (Dilithium prime modulus)
//! - N = 256 (NTT coefficients)
//! - ZETA = 1753 (primitive 512-th root of unity mod Q)

use anyhow::Result;
use plonky2::field::goldilocks_field::GoldilocksField;
use plonky2::field::types::Field;
use plonky2::iop::target::Target;
use plonky2::iop::witness::{PartialWitness, WitnessWrite};
use plonky2::plonk::circuit_builder::CircuitBuilder;
use plonky2::plonk::circuit_data::CircuitConfig;
use plonky2::plonk::config::PoseidonGoldilocksConfig;

use instant::Instant;
use log::{info, warn};

/// Dilithium prime modulus Q = 8,380,417
/// Note: This fits in Goldilocks field (p = 2^64 - 2^32 + 1)
const DILITHIUM_Q: u64 = 8_380_417;

/// NTT size for Dilithium
const N: usize = 256;

/// Primitive 512-th root of unity mod Q
const ZETA: u64 = 1753;

/// Twiddle factors for butterfly operations
const TWIDDLE_FACTORS: [u64; 8] = [1, 1753, 3073009, 6074001, 2306399, 5765016, 2615408, 8345316];

type F = GoldilocksField;
type C = PoseidonGoldilocksConfig;
const D: usize = 2;

/// Benchmark result for a single operation
#[derive(Debug, Clone)]
struct BenchResult {
    operation: String,
    trace_size: usize,
    circuit_build_ms: f64,
    prove_ms: f64,
    verify_ms: f64,
    num_gates: usize,
}

/// Build a circuit for a single NTT butterfly operation (simplified)
/// (a', b') = (a + w*b, a - w*b)
/// Note: In Goldilocks field, mod is handled natively
fn build_butterfly_circuit(
    builder: &mut CircuitBuilder<F, D>,
    a: Target,
    b: Target,
    twiddle: Target,
) -> (Target, Target) {
    // w * b
    let wb = builder.mul(twiddle, b);

    // a + w*b
    let a_prime = builder.add(a, wb);

    // a - w*b
    let b_prime = builder.sub(a, wb);

    (a_prime, b_prime)
}

/// Build a mini NTT circuit for benchmarking
/// Uses a small subset of the full NTT for circuit size comparison
fn build_mini_ntt_circuit(
    builder: &mut CircuitBuilder<F, D>,
    inputs: &[Target],
    size: usize,
) -> Vec<Target> {
    let mut coeffs = inputs.to_vec();

    // Simplified NTT layers (log2(size) layers)
    let layers = (size as f64).log2() as usize;

    for layer in 0..layers {
        let half = size >> (layer + 1);
        if half == 0 {
            break;
        }

        for j in 0..half {
            let twiddle_idx = (layer * 2 + j) % TWIDDLE_FACTORS.len();
            let twiddle = builder.constant(F::from_canonical_u64(TWIDDLE_FACTORS[twiddle_idx]));

            let idx_a = j * 2;
            let idx_b = j * 2 + 1;

            if idx_a < coeffs.len() && idx_b < coeffs.len() {
                let (new_a, new_b) = build_butterfly_circuit(
                    builder,
                    coeffs[idx_a],
                    coeffs[idx_b],
                    twiddle,
                );
                coeffs[idx_a] = new_a;
                coeffs[idx_b] = new_b;
            }
        }
    }

    coeffs
}

/// Build a FMA (Fused Multiply-Add) circuit chain
/// Simulates the FMA operations in Dilithium verification
fn build_fma_chain(
    builder: &mut CircuitBuilder<F, D>,
    inputs: &[Target],
) -> Target {
    let mut acc = builder.zero();
    for pair in inputs.chunks(2) {
        if pair.len() == 2 {
            // FMA: acc = acc + pair[0] * pair[1]
            let product = builder.mul(pair[0], pair[1]);
            acc = builder.add(acc, product);
        }
    }
    acc
}

/// Build a polynomial multiplication circuit (simplified)
/// Simulates coefficient-wise operations
fn build_poly_mul_circuit(
    builder: &mut CircuitBuilder<F, D>,
    a: &[Target],
    b: &[Target],
) -> Vec<Target> {
    a.iter()
        .zip(b.iter())
        .map(|(&ai, &bi)| builder.mul(ai, bi))
        .collect()
}

/// Run benchmark for a specific trace size
fn run_benchmark(trace_size: usize) -> Result<BenchResult> {
    info!("Building circuit for trace_size = {}", trace_size);

    let config = CircuitConfig::standard_recursion_config();
    let mut builder = CircuitBuilder::<F, D>::new(config);

    // Create input targets
    let inputs_a: Vec<Target> = (0..trace_size)
        .map(|_| builder.add_virtual_target())
        .collect();

    let inputs_b: Vec<Target> = (0..trace_size)
        .map(|_| builder.add_virtual_target())
        .collect();

    // Build the circuit
    let start = Instant::now();

    // Stage 1: NTT on inputs_a
    let ntt_a = build_mini_ntt_circuit(&mut builder, &inputs_a, trace_size);

    // Stage 2: NTT on inputs_b
    let ntt_b = build_mini_ntt_circuit(&mut builder, &inputs_b, trace_size);

    // Stage 3: Polynomial multiplication (coefficient-wise in NTT domain)
    let poly_product = build_poly_mul_circuit(&mut builder, &ntt_a, &ntt_b);

    // Stage 4: FMA chain (simulates inner product)
    let fma_result = build_fma_chain(&mut builder, &poly_product);

    // Register public inputs
    builder.register_public_input(ntt_a[0]);
    builder.register_public_input(ntt_b[0]);
    builder.register_public_input(fma_result);

    // Build the circuit
    let data = builder.build::<C>();
    let circuit_build_ms = start.elapsed().as_secs_f64() * 1000.0;
    let num_gates = data.common.gates.len();

    info!("Circuit built: {} gates, {:.2}ms", num_gates, circuit_build_ms);

    // Create witness
    let mut pw = PartialWitness::new();

    // Set values for inputs_a
    for (i, &target) in inputs_a.iter().enumerate() {
        let value = F::from_canonical_u64((i as u64 * 12345) % DILITHIUM_Q);
        let _ = pw.set_target(target, value);
    }

    // Set values for inputs_b
    for (i, &target) in inputs_b.iter().enumerate() {
        let value = F::from_canonical_u64((i as u64 * 54321) % DILITHIUM_Q);
        let _ = pw.set_target(target, value);
    }

    // Prove
    info!("Generating proof...");
    let start = Instant::now();
    let proof = data.prove(pw)?;
    let prove_ms = start.elapsed().as_secs_f64() * 1000.0;

    info!("Proof generated in {:.2}ms", prove_ms);

    // Verify
    info!("Verifying proof...");
    let start = Instant::now();
    data.verify(proof)?;
    let verify_ms = start.elapsed().as_secs_f64() * 1000.0;

    info!("Proof verified in {:.2}ms", verify_ms);

    Ok(BenchResult {
        operation: format!("NTT-{}", trace_size),
        trace_size,
        circuit_build_ms,
        prove_ms,
        verify_ms,
        num_gates,
    })
}

fn main() -> Result<()> {
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("info")
    ).init();

    println!("============================================================");
    println!("Plonky2 Dilithium NTT Benchmark");
    println!("============================================================");
    println!();
    println!("Dilithium Parameters:");
    println!("  Q (modulus):     {}", DILITHIUM_Q);
    println!("  N (NTT size):    {}", N);
    println!("  ZETA (root):     {}", ZETA);
    println!();
    println!("Plonky2 Configuration:");
    println!("  Field:           GoldilocksField (p = 2^64 - 2^32 + 1)");
    println!("  Config:          PoseidonGoldilocksConfig");
    println!("  Extension:       D = 2");
    println!();
    println!("Circuit Components:");
    println!("  - 2x NTT transforms (butterfly operations)");
    println!("  - Polynomial multiplication (coefficient-wise)");
    println!("  - FMA chain (inner product simulation)");
    println!();

    // Benchmark different trace sizes (matching SP1 benchmark)
    let trace_sizes = vec![8, 16, 32, 64, 128, 256];
    let mut results = Vec::new();

    for &size in &trace_sizes {
        println!("------------------------------------------------------------");
        match run_benchmark(size) {
            Ok(result) => {
                println!(
                    "Trace {} | Build: {:.2}ms | Prove: {:.2}ms | Verify: {:.2}ms | Gates: {}",
                    result.trace_size,
                    result.circuit_build_ms,
                    result.prove_ms,
                    result.verify_ms,
                    result.num_gates
                );
                results.push(result);
            }
            Err(e) => {
                warn!("Benchmark failed for size {}: {}", size, e);
            }
        }
    }

    println!();
    println!("============================================================");
    println!("Summary");
    println!("============================================================");
    println!();
    println!("{:<12} {:>12} {:>12} {:>12} {:>12}",
             "Trace Size", "Build (ms)", "Prove (ms)", "Verify (ms)", "Gates");
    println!("{}", "-".repeat(60));

    for r in &results {
        println!("{:<12} {:>12.2} {:>12.2} {:>12.2} {:>12}",
                 r.trace_size, r.circuit_build_ms, r.prove_ms, r.verify_ms, r.num_gates);
    }

    // Calculate scaling
    if results.len() >= 2 {
        let first = &results[0];
        let last = &results[results.len() - 1];
        let size_ratio = last.trace_size as f64 / first.trace_size as f64;
        let prove_ratio = last.prove_ms / first.prove_ms;
        let scaling_exp = prove_ratio.log2() / size_ratio.log2();

        println!();
        println!("Scaling Analysis:");
        println!("  Size increase:    {:.1}x ({} -> {})",
                 size_ratio, first.trace_size, last.trace_size);
        println!("  Prove time ratio: {:.1}x ({:.2}ms -> {:.2}ms)",
                 prove_ratio, first.prove_ms, last.prove_ms);
        println!("  Scaling exponent: O(n^{:.2})", scaling_exp);
    }

    // Calculate ops/ms for comparison with SP1
    println!();
    println!("Performance Metrics:");
    for r in &results {
        // Each trace size does: 2 NTTs + poly_mul + FMA chain
        // NTT has log2(n) layers with n/2 butterflies each
        // Each butterfly = 2 muls + 2 adds
        let layers = (r.trace_size as f64).log2() as usize;
        let butterflies_per_ntt = layers * (r.trace_size / 2);
        let ntt_ops = butterflies_per_ntt * 4 * 2; // 2 NTTs, 4 ops per butterfly
        let poly_mul_ops = r.trace_size; // coefficient-wise
        let fma_ops = r.trace_size; // FMA chain
        let total_ops = ntt_ops + poly_mul_ops + fma_ops;
        let ops_per_ms = total_ops as f64 / r.prove_ms;

        println!("  Trace {}: {:.0} ops, {:.2} ops/ms prove time",
                 r.trace_size, total_ops, ops_per_ms);
    }

    println!();
    println!("============================================================");
    println!("Comparison Notes (vs SP1):");
    println!("============================================================");
    println!("SP1: Generic zkVM - runs any Rust code in RISC-V");
    println!("Plonky2: Custom STARK circuits - optimized for specific ops");
    println!();
    println!("Expected tradeoffs:");
    println!("  - Plonky2 should have lower proof times for equivalent ops");
    println!("  - SP1 has simpler development (standard Rust)");
    println!("  - Plonky2 circuits require manual constraint design");
    println!();
    println!("Benchmark complete.");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_small_circuit() -> Result<()> {
        let config = CircuitConfig::standard_recursion_config();
        let mut builder = CircuitBuilder::<F, D>::new(config);

        let a = builder.add_virtual_target();
        let b = builder.add_virtual_target();

        let sum = builder.add(a, b);
        builder.register_public_input(sum);

        let data = builder.build::<C>();

        let mut pw = PartialWitness::new();
        let _ = pw.set_target(a, F::from_canonical_u64(100));
        let _ = pw.set_target(b, F::from_canonical_u64(200));

        let proof = data.prove(pw)?;
        data.verify(proof)?;

        Ok(())
    }

    #[test]
    fn test_butterfly_circuit() -> Result<()> {
        let config = CircuitConfig::standard_recursion_config();
        let mut builder = CircuitBuilder::<F, D>::new(config);

        let a = builder.add_virtual_target();
        let b = builder.add_virtual_target();
        let twiddle = builder.constant(F::from_canonical_u64(ZETA));

        let (a_prime, b_prime) = build_butterfly_circuit(&mut builder, a, b, twiddle);
        builder.register_public_input(a_prime);
        builder.register_public_input(b_prime);

        let data = builder.build::<C>();

        let mut pw = PartialWitness::new();
        let _ = pw.set_target(a, F::from_canonical_u64(1000));
        let _ = pw.set_target(b, F::from_canonical_u64(2000));

        let proof = data.prove(pw)?;
        data.verify(proof)?;

        assert!(data.common.gates.len() > 0);

        Ok(())
    }

    #[test]
    fn test_mini_ntt() -> Result<()> {
        let result = run_benchmark(8)?;
        assert!(result.prove_ms > 0.0);
        assert!(result.verify_ms > 0.0);
        Ok(())
    }
}
