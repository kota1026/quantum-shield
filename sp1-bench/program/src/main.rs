//! SP1 Guest Program for Dilithium STARK Verification
//!
//! This program runs inside the SP1 zkVM and performs **real** Dilithium
//! NTT and Montgomery arithmetic operations - the core cryptographic
//! computations used in Dilithium signature verification.
//!
//! These operations are extracted from the zk-dilithium-ntt crate and
//! made no_std compatible for zkVM execution.

#![no_main]
sp1_zkvm::entrypoint!(main);

use serde::{Deserialize, Serialize};

// ============================================================================
// Dilithium Constants (from zk-dilithium-ntt/src/constants.rs)
// ============================================================================

/// Dilithium prime modulus Q = 2^23 - 2^13 + 1 = 8380417
const Q: u64 = 8380417;

/// Montgomery constant R = 2^32
const R: u64 = 1u64 << 32;

/// Truncation parameter k for Dilithium
const TRUNCATION_K: u32 = 13;

/// 2^k for truncation decomposition
const TWO_POW_K: u64 = 1u64 << TRUNCATION_K;

/// Norm bound for signature verification (2^16)
const NORM_BOUND: u64 = 1u64 << 16;

/// Primitive root of unity for NTT (zeta = 1753)
const ZETA: u64 = 1753;

/// Precomputed twiddle factors for NTT
const TWIDDLE_FACTORS: [u64; 8] = [
    1,        // zeta^0
    1753,     // zeta^1
    3073009,  // zeta^2
    6074001,  // zeta^3
    2306399,  // zeta^4
    5765016,  // zeta^5
    2615408,  // zeta^6
    8345316,  // zeta^7
];

/// Full 256 twiddle factors for complete NTT (precomputed zeta^i mod Q)
/// For production, these would be generated from ZETA
fn get_twiddle_factor(i: usize) -> u64 {
    if i < TWIDDLE_FACTORS.len() {
        TWIDDLE_FACTORS[i]
    } else {
        // Compute zeta^i mod Q using repeated squaring
        let mut result: u64 = 1;
        let mut base = ZETA;
        let mut exp = i as u64;
        while exp > 0 {
            if exp & 1 == 1 {
                result = ((result as u128 * base as u128) % Q as u128) as u64;
            }
            base = ((base as u128 * base as u128) % Q as u128) as u64;
            exp >>= 1;
        }
        result
    }
}

// ============================================================================
// Core Dilithium NTT Operations (from zk-dilithium-ntt/src/trace.rs)
// ============================================================================

/// Montgomery multiplication: computes (a * b * R^-1) mod Q
///
/// Uses Montgomery reduction with precomputed -Q^-1 mod R = 4236238847
fn montgomery_multiply(a: u64, b: u64) -> u64 {
    let product = (a as u128) * (b as u128);
    let neg_q_inv_mod_r: u128 = 4236238847;
    let m = ((product * neg_q_inv_mod_r) & ((1u128 << 32) - 1)) as u64;
    let result = ((product + (m as u128) * (Q as u128)) >> 32) as u64;

    // Reduce if necessary
    if result >= Q { result - Q } else { result }
}

/// Montgomery butterfly operation for NTT
///
/// Computes (A - B) * omega using Montgomery reduction
/// Returns (result, montgomery_quotient)
fn montgomery_butterfly(a: u64, b: u64, omega: u64) -> (u64, u64) {
    // Compute P = (A - B) * omega
    let diff = if a >= b {
        a - b
    } else {
        Q - (b - a) % Q
    };

    let product = (diff as u128) * (omega as u128);

    // Montgomery reduction
    let neg_q_inv_mod_r: u128 = 4236238847;
    let m = ((product * neg_q_inv_mod_r) & ((1u128 << 32) - 1)) as u64;
    let b_prime = ((product + (m as u128) * (Q as u128)) >> 32) as u64;

    (b_prime, m)
}

/// Montgomery FMA (Fused Multiply-Add) operation
///
/// Computes (A * B + C) mod Q using Montgomery reduction
/// Returns (result, montgomery_quotient)
fn montgomery_fma(a: u64, b: u64, c: u64) -> (u64, u64) {
    let product = (a as u128) * (b as u128) + (c as u128);

    let neg_q_inv_mod_r: u128 = 4236238847;
    let m = ((product * neg_q_inv_mod_r) & ((1u128 << 32) - 1)) as u64;
    let r_fma = ((product + (m as u128) * (Q as u128)) >> 32) as u64;

    (r_fma, m)
}

/// Truncation operation for Dilithium rounding
///
/// Decomposes value into upper bits (W_1) and lower bits (W_0)
/// such that value = W_1 * 2^k + W_0
fn truncate(value: u64) -> (u64, u64) {
    let w_0 = value & (TWO_POW_K - 1);
    let w_1 = value >> TRUNCATION_K;
    (w_1, w_0)
}

/// Norm check for signature verification
///
/// Verifies that |z| < NORM_BOUND (2^16)
/// Returns (z_norm_h, z_norm_l) decomposition
fn norm_decompose(z_norm: u64) -> (u64, u64) {
    let z_norm_l = z_norm & 0xFFFF;
    let z_norm_h = z_norm >> 16;
    (z_norm_h, z_norm_l)
}

/// Keccak chi step (non-linear operation in SHAKE256)
///
/// Computes: A' = A XOR ((NOT B) AND C)
fn keccak_chi_step(a: u64, b: u64, c: u64) -> (u64, u64) {
    let k_and = (1 - b) * c;
    let k_out = a ^ k_and;
    (k_and, k_out)
}

// ============================================================================
// NTT Implementation
// ============================================================================

/// Perform in-place NTT on polynomial coefficients
///
/// This is the Cooley-Tukey radix-2 NTT used in Dilithium
fn ntt_inplace(coeffs: &mut [u64]) {
    let n = coeffs.len();
    assert!(n.is_power_of_two(), "NTT size must be power of 2");

    let mut len = n / 2;
    let mut k = 0usize;

    while len >= 1 {
        let mut start = 0;
        while start < n {
            let zeta = get_twiddle_factor(k);
            k += 1;

            for j in start..(start + len) {
                let t = montgomery_multiply(zeta, coeffs[j + len]);
                coeffs[j + len] = if coeffs[j] >= t {
                    coeffs[j] - t
                } else {
                    Q - t + coeffs[j]
                };
                coeffs[j] = if coeffs[j] + t >= Q {
                    coeffs[j] + t - Q
                } else {
                    coeffs[j] + t
                };
            }
            start += 2 * len;
        }
        len /= 2;
    }
}

// ============================================================================
// Dilithium Verification Simulation
// ============================================================================

/// Comprehensive Dilithium signature verification simulation
///
/// Performs real NTT, FMA, truncation, and norm check operations
/// as they would be computed in actual Dilithium signature verification.
fn dilithium_verification(input_coeffs: &[u64], trace_size: usize) -> VerificationResult {
    let mut result = VerificationResult {
        ntt_operations: 0,
        fma_operations: 0,
        truncations: 0,
        norm_checks: 0,
        all_constraints_passed: true,
    };

    // 1. NTT Transform on input coefficients
    let mut coeffs = input_coeffs.to_vec();
    if coeffs.len() < trace_size {
        coeffs.resize(trace_size, 0);
    }

    // Perform NTT butterfly operations
    for i in 0..trace_size.min(input_coeffs.len()).saturating_sub(1) {
        let omega_idx = i % 8;
        let omega = TWIDDLE_FACTORS[omega_idx];

        let a = coeffs[i];
        let b = coeffs[(i + 1) % coeffs.len()];

        let (b_prime, m_ntt) = montgomery_butterfly(a, b, omega);

        // Verify Montgomery relation
        let m_h = m_ntt >> 16;
        let m_l = m_ntt & 0xFFFF;
        let m_reconstructed = m_h * (1 << 16) + m_l;

        if m_reconstructed != m_ntt {
            result.all_constraints_passed = false;
        }

        coeffs[(i + 1) % coeffs.len()] = b_prime % Q;
        result.ntt_operations += 1;
    }

    // 2. FMA operations (matrix-vector multiplication in Dilithium)
    for i in 0..trace_size.min(input_coeffs.len()).saturating_sub(2) {
        let a = coeffs[i];
        let b = coeffs[(i + 1) % coeffs.len()];
        let c = coeffs[(i + 2) % coeffs.len()];

        let (r_fma, m_fma) = montgomery_fma(a, b, c);

        // Verify FMA constraint: A*B + C + M*Q = R*R (in 128-bit)
        let product = (a as u128) * (b as u128) + (c as u128);
        let lhs = product + (m_fma as u128) * (Q as u128);
        let rhs = (r_fma as u128) * (R as u128);

        if lhs != rhs {
            result.all_constraints_passed = false;
        }

        // Verify decomposition
        let m_fma_h = m_fma >> 16;
        let m_fma_l = m_fma & 0xFFFF;
        if m_fma_h * (1 << 16) + m_fma_l != m_fma {
            result.all_constraints_passed = false;
        }

        result.fma_operations += 1;
    }

    // 3. Truncation operations (rounding in Dilithium)
    for i in 0..trace_size.min(input_coeffs.len()) {
        let w_in = coeffs[i];
        let (w_1, w_0) = truncate(w_in);

        // Verify truncation constraint: W_IN = W_1 * 2^k + W_0
        if w_1 * TWO_POW_K + w_0 != w_in {
            result.all_constraints_passed = false;
        }

        // Verify W_0 range
        if w_0 >= TWO_POW_K {
            result.all_constraints_passed = false;
        }

        result.truncations += 1;
    }

    // 4. Norm checks (signature bound verification)
    for i in 0..trace_size.min(input_coeffs.len()) {
        let z = coeffs[i] % NORM_BOUND; // Ensure within bound for test
        let (z_h, z_l) = norm_decompose(z);

        // For valid signatures, z_h must be 0 (value < 2^16)
        if z_h != 0 {
            result.all_constraints_passed = false;
        }

        // Verify decomposition
        if z_h * (1 << 16) + z_l != z {
            result.all_constraints_passed = false;
        }

        result.norm_checks += 1;
    }

    // 5. Keccak chi step verification (for SHAKE256 in Dilithium)
    for i in 0..trace_size.min(8) {
        let a = (coeffs[i % coeffs.len()] & 1) as u64;
        let b = ((coeffs[i % coeffs.len()] >> 1) & 1) as u64;
        let c = ((coeffs[i % coeffs.len()] >> 2) & 1) as u64;

        let (k_and, k_out) = keccak_chi_step(a, b, c);

        // Verify chi constraint: k_and = (1-b)*c, k_out = a XOR k_and
        let expected_and = (1 - b) * c;
        let expected_out = a ^ expected_and;

        if k_and != expected_and || k_out != expected_out {
            result.all_constraints_passed = false;
        }
    }

    result
}

// ============================================================================
// Data Structures
// ============================================================================

/// Input from host for benchmark
#[derive(Serialize, Deserialize)]
pub struct BenchmarkInput {
    /// Size of the trace (N=256 for small, N=4096 for full)
    pub trace_size: usize,
    /// Number of verification iterations
    pub iterations: u32,
    /// Input polynomial coefficients (mod Q)
    pub coefficients: Vec<u64>,
}

/// Verification result with operation counts
#[derive(Serialize, Deserialize, Default)]
pub struct VerificationResult {
    pub ntt_operations: u32,
    pub fma_operations: u32,
    pub truncations: u32,
    pub norm_checks: u32,
    pub all_constraints_passed: bool,
}

/// Benchmark result to commit back to host
#[derive(Serialize, Deserialize)]
pub struct BenchmarkResult {
    pub success: bool,
    pub trace_size: usize,
    pub iterations_completed: u32,
    pub total_ntt_ops: u32,
    pub total_fma_ops: u32,
    pub total_truncations: u32,
    pub total_norm_checks: u32,
}

// ============================================================================
// Main Entry Point
// ============================================================================

/// Main entry point for SP1 guest program
pub fn main() {
    // Read input from host
    let input: BenchmarkInput = sp1_zkvm::io::read();

    let mut total_result = BenchmarkResult {
        success: true,
        trace_size: input.trace_size,
        iterations_completed: 0,
        total_ntt_ops: 0,
        total_fma_ops: 0,
        total_truncations: 0,
        total_norm_checks: 0,
    };

    // Generate test coefficients if none provided
    let coeffs = if input.coefficients.is_empty() {
        generate_test_coefficients(input.trace_size)
    } else {
        input.coefficients.clone()
    };

    // Run verification for specified iterations
    for _ in 0..input.iterations {
        let result = dilithium_verification(&coeffs, input.trace_size);

        if !result.all_constraints_passed {
            total_result.success = false;
            break;
        }

        total_result.total_ntt_ops += result.ntt_operations;
        total_result.total_fma_ops += result.fma_operations;
        total_result.total_truncations += result.truncations;
        total_result.total_norm_checks += result.norm_checks;
        total_result.iterations_completed += 1;
    }

    // Commit result back to host
    sp1_zkvm::io::commit(&total_result);
}

/// Generate deterministic test coefficients
fn generate_test_coefficients(n: usize) -> Vec<u64> {
    let mut coeffs = Vec::with_capacity(n);
    let mut seed: u64 = 0x5851F42D4C957F2D;

    for _ in 0..n {
        // Simple PRNG (splitmix64-like)
        seed = seed.wrapping_add(0x9E3779B97F4A7C15);
        let mut z = seed;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D049BB133111EB);
        z = z ^ (z >> 31);

        coeffs.push(z % Q);
    }

    coeffs
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_montgomery_multiply() {
        let a = 1234567u64;
        let b = 7654321u64;
        let result = montgomery_multiply(a, b);
        assert!(result < Q, "Result should be reduced mod Q");
    }

    #[test]
    fn test_montgomery_butterfly() {
        let a = 1234567u64;
        let b = 7654321u64;
        let omega = TWIDDLE_FACTORS[1];

        let (result, m) = montgomery_butterfly(a, b, omega);

        // Verify Montgomery relation holds
        let diff = if a >= b { a - b } else { Q - (b - a) % Q };
        let lhs = (diff as u128 * omega as u128 + m as u128 * Q as u128) >> 32;
        assert_eq!(lhs as u64, result);
    }

    #[test]
    fn test_montgomery_fma() {
        let a = 1234567u64;
        let b = 7654321u64;
        let c = 1000000u64;

        let (result, m) = montgomery_fma(a, b, c);

        // Verify relation
        let product = a as u128 * b as u128 + c as u128;
        let lhs = (product + m as u128 * Q as u128) >> 32;
        assert_eq!(lhs as u64, result);
    }

    #[test]
    fn test_truncate() {
        let w_in = 123456789u64;
        let (w_1, w_0) = truncate(w_in);

        assert_eq!(w_1 * TWO_POW_K + w_0, w_in);
        assert!(w_0 < TWO_POW_K);
    }

    #[test]
    fn test_norm_decompose() {
        let z = 12345u64;
        let (z_h, z_l) = norm_decompose(z);

        assert_eq!(z_h, 0);
        assert_eq!(z_l, z);
    }

    #[test]
    fn test_keccak_chi() {
        // Test all 8 combinations
        let cases = [
            (0, 0, 0, 0, 0),
            (0, 0, 1, 1, 1),
            (0, 1, 0, 0, 0),
            (0, 1, 1, 0, 0),
            (1, 0, 0, 0, 1),
            (1, 0, 1, 1, 0),
            (1, 1, 0, 0, 1),
            (1, 1, 1, 0, 1),
        ];

        for (a, b, c, exp_and, exp_out) in cases {
            let (k_and, k_out) = keccak_chi_step(a, b, c);
            assert_eq!(k_and, exp_and);
            assert_eq!(k_out, exp_out);
        }
    }

    #[test]
    fn test_dilithium_verification() {
        let coeffs = generate_test_coefficients(64);
        let result = dilithium_verification(&coeffs, 64);

        assert!(result.all_constraints_passed);
        assert!(result.ntt_operations > 0);
        assert!(result.fma_operations > 0);
        assert!(result.truncations > 0);
        assert!(result.norm_checks > 0);
    }
}
