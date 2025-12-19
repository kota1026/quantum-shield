//! Kyber KEM Constants
//!
//! This module defines constants for Kyber Key Encapsulation Mechanism.
//! Constants are based on NIST FIPS 203.

// ============================================================================
// Kyber Modulus and Field Parameters
// ============================================================================

/// Kyber modulus Q = 3329
/// This is a prime number: 3329 = 13 * 256 + 1
pub const Q_KYBER: u64 = 3329;

/// Montgomery constant R = 2^16 for Kyber
/// Used for Montgomery multiplication
pub const R_KYBER: u64 = 1u64 << 16;

/// R^2 mod Q for Montgomery conversion
/// R^2 mod 3329 = 65536^2 mod 3329 = 1353
/// Calculation: 65536^2 = 4294967296, 4294967296 mod 3329 = 1353
pub const R_SQUARED_KYBER: u64 = 1353;

/// R^(-1) mod Q for Montgomery reduction
/// 65536^(-1) mod 3329 = 169
/// Verified: 65536 * 169 = 11075584, 11075584 mod 3329 = 1
pub const R_INV_KYBER: u64 = 169;

/// -Q^(-1) mod R for Montgomery reduction
/// Q^(-1) mod R = 62209 (since 3329 * 62209 mod 65536 = 1)
/// -Q^(-1) mod R = 65536 - 62209 = 3327
pub const NEG_Q_INV_KYBER: u64 = 3327;

// ============================================================================
// NTT Parameters for Kyber
// ============================================================================

/// Polynomial degree N = 256
pub const N_KYBER: usize = 256;

/// Primitive 512th root of unity mod Q
/// ζ = 17 (since 17^256 ≡ -1 mod 3329)
pub const ZETA_KYBER: u64 = 17;

/// First few twiddle factors for Kyber NTT
/// ζ^(bit_reverse(i)) for i = 0..128
pub const TWIDDLE_FACTORS_KYBER: [u64; 16] = [
    1, 1729, 2580, 3289, 2642, 630, 1897, 848,
    1062, 1919, 193, 797, 2786, 3260, 569, 1746,
];

// ============================================================================
// CBD (Centered Binomial Distribution) Parameters
// ============================================================================

/// CBD parameter η₁ for Kyber-768 (security level 3)
/// Coefficients are sampled from [-η₁, η₁]
pub const ETA1_KYBER768: usize = 2;

/// CBD parameter η₂ for Kyber-768
pub const ETA2_KYBER768: usize = 2;

/// CBD parameter η₁ for Kyber-512 (security level 1)
pub const ETA1_KYBER512: usize = 3;

/// CBD parameter η₂ for Kyber-512
pub const ETA2_KYBER512: usize = 2;

/// CBD parameter η₁ for Kyber-1024 (security level 5)
pub const ETA1_KYBER1024: usize = 2;

/// CBD parameter η₂ for Kyber-1024
pub const ETA2_KYBER1024: usize = 2;

/// Default η for testing (Kyber-768)
pub const ETA_DEFAULT: usize = 2;

/// Number of bits needed for one CBD sample = 2 * η
pub const CBD_BITS_PER_SAMPLE: usize = 2 * ETA_DEFAULT;

// ============================================================================
// Trace Width for Kyber STARK
// ============================================================================

/// Base trace width for Kyber (reusing Dilithium structure)
/// Base columns (37) + CBD columns (6) = 43
pub const TRACE_WIDTH_KYBER: usize = 43;

/// CBD-specific column indices
pub mod cbd_columns {
    /// Input bit from SHAKE output
    pub const B_CBD: usize = 37;

    /// Accumulator for first η bits (b₁ sum)
    pub const C_B1: usize = 38;

    /// Accumulator for second η bits (b₂ sum)
    pub const C_B2: usize = 39;

    /// Final CBD coefficient e = C_B1 - C_B2
    pub const E_CBD: usize = 40;

    /// Selector for b₁ accumulation phase
    pub const S_B1: usize = 41;

    /// Selector for b₂ accumulation phase
    pub const S_B2: usize = 42;
}

// ============================================================================
// Security Levels
// ============================================================================

/// Kyber security levels
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum KyberSecurityLevel {
    /// Kyber-512: NIST Level 1 (AES-128 equivalent)
    Kyber512,
    /// Kyber-768: NIST Level 3 (AES-192 equivalent)
    Kyber768,
    /// Kyber-1024: NIST Level 5 (AES-256 equivalent)
    Kyber1024,
}

impl KyberSecurityLevel {
    /// Get k parameter (number of polynomials)
    pub fn k(&self) -> usize {
        match self {
            KyberSecurityLevel::Kyber512 => 2,
            KyberSecurityLevel::Kyber768 => 3,
            KyberSecurityLevel::Kyber1024 => 4,
        }
    }

    /// Get η₁ parameter
    pub fn eta1(&self) -> usize {
        match self {
            KyberSecurityLevel::Kyber512 => 3,
            KyberSecurityLevel::Kyber768 => 2,
            KyberSecurityLevel::Kyber1024 => 2,
        }
    }

    /// Get η₂ parameter
    pub fn eta2(&self) -> usize {
        match self {
            KyberSecurityLevel::Kyber512 => 2,
            KyberSecurityLevel::Kyber768 => 2,
            KyberSecurityLevel::Kyber1024 => 2,
        }
    }
}

// ============================================================================
// Montgomery Arithmetic Helpers for Kyber
// ============================================================================

/// Montgomery reduction for Kyber: compute a * R^(-1) mod Q
#[inline]
pub fn montgomery_reduce_kyber(a: u64) -> u64 {
    // t = a * (-Q^(-1)) mod R
    let t = ((a as u128) * (NEG_Q_INV_KYBER as u128)) as u64 & (R_KYBER - 1);
    // (a + t * Q) / R
    let result = ((a as u128 + (t as u128) * (Q_KYBER as u128)) >> 16) as u64;
    if result >= Q_KYBER {
        result - Q_KYBER
    } else {
        result
    }
}

/// Montgomery multiplication for Kyber: compute a * b * R^(-1) mod Q
#[inline]
pub fn montgomery_multiply_kyber(a: u64, b: u64) -> u64 {
    montgomery_reduce_kyber(a * b)
}

/// Convert to Montgomery form: a -> a * R mod Q
#[inline]
pub fn to_montgomery_kyber(a: u64) -> u64 {
    montgomery_multiply_kyber(a, R_SQUARED_KYBER)
}

/// Convert from Montgomery form: a * R -> a mod Q
#[inline]
pub fn from_montgomery_kyber(a: u64) -> u64 {
    montgomery_reduce_kyber(a)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kyber_constants() {
        // Verify Q is prime (simple check)
        assert_eq!(Q_KYBER, 3329);
        assert_eq!(Q_KYBER % 256, 1); // Q ≡ 1 (mod 256) for NTT

        // Verify R
        assert_eq!(R_KYBER, 65536);
    }

    #[test]
    fn test_montgomery_reduce_kyber() {
        // Test: 0 * R^(-1) mod Q = 0
        assert_eq!(montgomery_reduce_kyber(0), 0);

        // Test: R * R^(-1) mod Q = 1
        let r_reduced = montgomery_reduce_kyber(R_KYBER);
        assert_eq!(r_reduced, 1);
    }

    #[test]
    fn test_montgomery_multiply_kyber() {
        // Test: 1 * 1 in Montgomery form
        let one_mont = to_montgomery_kyber(1);
        let result = montgomery_multiply_kyber(one_mont, one_mont);
        assert_eq!(from_montgomery_kyber(result), 1);

        // Test: 2 * 3 = 6
        let two_mont = to_montgomery_kyber(2);
        let three_mont = to_montgomery_kyber(3);
        let product = montgomery_multiply_kyber(two_mont, three_mont);
        assert_eq!(from_montgomery_kyber(product), 6);
    }

    #[test]
    fn test_montgomery_roundtrip_kyber() {
        for a in [0, 1, 100, 1000, 3328] {
            let mont = to_montgomery_kyber(a);
            let back = from_montgomery_kyber(mont);
            assert_eq!(back, a, "Roundtrip failed for {}", a);
        }
    }

    #[test]
    fn test_security_levels() {
        assert_eq!(KyberSecurityLevel::Kyber512.k(), 2);
        assert_eq!(KyberSecurityLevel::Kyber768.k(), 3);
        assert_eq!(KyberSecurityLevel::Kyber1024.k(), 4);

        assert_eq!(KyberSecurityLevel::Kyber512.eta1(), 3);
        assert_eq!(KyberSecurityLevel::Kyber768.eta1(), 2);
        assert_eq!(KyberSecurityLevel::Kyber1024.eta1(), 2);
    }

    #[test]
    fn test_cbd_parameters() {
        // For Kyber-768, η = 2, so CBD uses 4 bits per coefficient
        assert_eq!(CBD_BITS_PER_SAMPLE, 4);
        assert_eq!(ETA_DEFAULT, 2);
    }
}
