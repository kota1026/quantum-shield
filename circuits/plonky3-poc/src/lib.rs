//! Plonky3 STARK PoC for Dilithium Verification
//!
//! This crate implements a proof-of-concept STARK circuit for Dilithium
//! signature verification using the Plonky3 framework.
//!
//! # Phase 0.5 Goals
//! - Verify Plonky3 can handle Dilithium's Montgomery arithmetic
//! - Benchmark native STARK vs SP1 zkVM
//! - Target: < 1M constraints, < 1s proof time

pub mod constants;
pub mod air;
pub mod trace;
pub mod prover;

pub use constants::*;
pub use air::{DilithiumAir, SimpleNttAir};
pub use trace::{DilithiumTrace, generate_random_coefficients, generate_dilithium_polynomial};
pub use prover::{prove_dilithium, benchmark_all_sizes, compare_with_sp1, ProofResult, FriConfig};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_montgomery_multiply() {
        let a = 1234567u64;
        let b = 7654321u64;
        let result = constants::montgomery_multiply(a, b);
        assert!(result < Q);
    }

    #[test]
    fn test_ntt_butterfly() {
        let a = 1000000u64;
        let b = 2000000u64;
        let omega = ZETAS[1];
        let (sum, diff) = constants::ntt_butterfly(a, b, omega);
        assert!(sum < Q);
        assert!(diff < Q);
    }

    #[test]
    fn test_full_benchmark() {
        let result = prove_dilithium(256);
        assert!(result.verified);
        assert!(result.estimated_cycles() < 1_000_000);
    }
}
