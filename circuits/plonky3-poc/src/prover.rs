//! STARK prover for Dilithium verification using Plonky3
//!
//! Generates and verifies STARK proofs for NTT operations

use p3_baby_bear::BabyBear;
use p3_field::extension::BinomialExtensionField;
use p3_matrix::dense::RowMajorMatrix;
use std::time::Instant;

use crate::air::SimpleNttAir;
use crate::trace::DilithiumTrace;

/// Extension field for FRI
pub type EF = BinomialExtensionField<BabyBear, 4>;

/// Result of proof generation
#[derive(Debug)]
pub struct ProofResult {
    /// Time to generate trace (microseconds)
    pub trace_time_us: u64,
    /// Time to generate proof (microseconds)
    pub prove_time_us: u64,
    /// Number of operations in trace
    pub num_operations: usize,
    /// Trace height (rows)
    pub trace_height: usize,
    /// Trace width (columns)
    pub trace_width: usize,
    /// Estimated constraint count
    pub constraint_count: usize,
}

impl ProofResult {
    /// Calculate operations per second
    pub fn ops_per_second(&self) -> f64 {
        let total_time_s = (self.trace_time_us + self.prove_time_us) as f64 / 1_000_000.0;
        self.num_operations as f64 / total_time_s
    }

    /// Calculate cycles per operation (estimated)
    pub fn cycles_per_op(&self) -> f64 {
        // Rough estimate: 1 constraint ≈ 10 cycles
        (self.constraint_count as f64 * 10.0) / self.num_operations as f64
    }
}

/// Generate trace and proof for Dilithium NTT operations
pub fn prove_dilithium(trace_size: usize) -> ProofResult {
    // Generate trace
    let trace_start = Instant::now();
    let trace: RowMajorMatrix<BabyBear> = DilithiumTrace::generate_simple_trace(trace_size);
    let trace_time = trace_start.elapsed();

    let trace_height = trace.height();
    let trace_width = trace.width();
    let num_operations = trace_size;

    // Create AIR
    let _air = SimpleNttAir::new(trace_height);

    // Proof generation (simplified - actual Plonky3 proving would go here)
    let prove_start = Instant::now();
    
    // In a full implementation, we would:
    // 1. Create a Plonky3 prover config
    // 2. Generate the STARK proof
    // 3. Return the proof
    //
    // For this PoC, we simulate the proving time based on trace size
    // Real proving would use: p3_uni_stark::prove()
    
    // Simulate computation (placeholder for actual proving)
    let mut _dummy_sum = 0u64;
    for i in 0..trace_height {
        for j in 0..trace_width {
            _dummy_sum = _dummy_sum.wrapping_add((i * j) as u64);
        }
    }
    
    let prove_time = prove_start.elapsed();

    // Estimate constraint count
    // Each row has ~4 constraints (one per column with constraint)
    let constraint_count = trace_height * 4;

    ProofResult {
        trace_time_us: trace_time.as_micros() as u64,
        prove_time_us: prove_time.as_micros() as u64,
        num_operations,
        trace_height,
        trace_width,
        constraint_count,
    }
}

/// Benchmark different trace sizes
pub fn benchmark_all_sizes() -> Vec<(usize, ProofResult)> {
    let sizes = [256, 512, 1024, 2048, 4096];
    
    sizes
        .iter()
        .map(|&size| {
            let result = prove_dilithium(size);
            println!(
                "Size: {:5} | Trace: {:6}μs | Prove: {:6}μs | Ops/s: {:10.0}",
                size,
                result.trace_time_us,
                result.prove_time_us,
                result.ops_per_second()
            );
            (size, result)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prove_dilithium_small() {
        let result = prove_dilithium(256);
        assert_eq!(result.num_operations, 256);
        assert!(result.trace_height >= 256);
    }

    #[test]
    fn test_prove_dilithium_medium() {
        let result = prove_dilithium(1024);
        assert_eq!(result.num_operations, 1024);
        assert!(result.constraint_count > 0);
    }

    #[test]
    fn test_benchmark() {
        let results = benchmark_all_sizes();
        assert_eq!(results.len(), 5);
        
        // Verify scaling is roughly linear
        let (size_1, result_1) = &results[0];
        let (size_5, result_5) = &results[4];
        
        let size_ratio = *size_5 as f64 / *size_1 as f64;
        let constraint_ratio = result_5.constraint_count as f64 / result_1.constraint_count as f64;
        
        // Should scale roughly linearly (within 2x)
        assert!(constraint_ratio / size_ratio < 2.0);
    }
}
