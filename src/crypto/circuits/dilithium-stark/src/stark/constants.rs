//! Constants for Dilithium STARK proof system
//!
//! Defines all constants used by the AIR, trace generation, and prover.

/// Dilithium modulus Q = 8380417 (2^23 - 2^13 + 1)
pub const Q: u64 = 8380417;

/// Montgomery constant R = 2^32 for 32-bit Montgomery reduction
pub const R: u64 = 1u64 << 32;

/// Square root of R: R_SQRT = 2^16
pub const R_SQRT: u64 = 1u64 << 16;

/// Truncation parameter k (for High/Low decomposition)
pub const TRUNCATION_K: u32 = 13;

/// 2^k for truncation operations
pub const TWO_POW_K: u64 = 1u64 << TRUNCATION_K;

/// Trace width for base AIR (37 columns)
/// Columns: NTT(0-14), FMA(15-19), Truncation(20-24), Selector(25-26),
///          Keccak(27-32), NormCheck(33-36)
pub const TRACE_WIDTH: usize = 37;

/// Extended trace width for Phase II AIR (45 columns)
/// Base(37) + Sampler(37-41) + Hint(42-44)
pub const TRACE_WIDTH_EXTENDED: usize = 45;

/// Norm bound for coefficient range check
/// For simplified version: coefficients must be < 2^16
pub const NORM_BOUND: u64 = 1u64 << 16;

/// Challenge weight tau for Dilithium Level 3
/// Number of non-zero coefficients in challenge polynomial c
pub const CHALLENGE_WEIGHT: u64 = 49;

/// Maximum hint weight omega for Dilithium Level 3
/// Maximum number of 1s allowed in hint vector
pub const OMEGA: u64 = 55;

/// Twiddle factors for NTT (precomputed powers of primitive root)
/// These are roots of unity for the NTT over Z_Q
/// omega = 1753 is a primitive 512th root of unity mod Q
pub const TWIDDLE_FACTORS: [u64; 256] = [
    // First 8 twiddle factors for demonstration
    // Full implementation would include all 256 factors
    1, 1753, 3073009, 2580926, 2298217, 2062947, 4010531, 3023009,
    // Remaining factors initialized to 1 for compilation
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, // Extra 8 elements to make 256
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dilithium_modulus() {
        // Q = 2^23 - 2^13 + 1 = 8388608 - 8192 + 1 = 8380417
        assert_eq!(Q, (1u64 << 23) - (1u64 << 13) + 1);
    }

    #[test]
    fn test_montgomery_constants() {
        assert_eq!(R, 4294967296); // 2^32
        assert_eq!(R_SQRT, 65536);  // 2^16
        assert_eq!(R_SQRT * R_SQRT, R);
    }

    #[test]
    fn test_trace_widths() {
        assert_eq!(TRACE_WIDTH, 37);
        assert_eq!(TRACE_WIDTH_EXTENDED, 45);
        assert_eq!(TRACE_WIDTH_EXTENDED - TRACE_WIDTH, 8); // Phase II columns
    }

    #[test]
    fn test_truncation() {
        assert_eq!(TWO_POW_K, 8192); // 2^13
    }

    #[test]
    fn test_dilithium_level3_params() {
        // Dilithium Level 3 parameters
        assert_eq!(CHALLENGE_WEIGHT, 49); // tau
        assert_eq!(OMEGA, 55);            // max hint weight
    }
}
