//! SPHINCS+ Constants
//!
//! This module defines constants for SPHINCS+ hash-based signature scheme.
//! Constants are based on NIST FIPS 205.
//!
//! # SPHINCS+ Overview
//!
//! SPHINCS+ is a stateless hash-based signature scheme that combines:
//! - WOTS+ (Winternitz One-Time Signature)
//! - FORS (Forest of Random Subsets)
//! - Hypertree structure
//!
//! # Security Levels
//!
//! | Variant | Security | Hash | n (bytes) | h | d | w |
//! |---------|----------|------|-----------|---|---|---|
//! | SPHINCS+-128s | 128-bit | SHAKE256 | 16 | 63 | 7 | 16 |
//! | SPHINCS+-128f | 128-bit | SHAKE256 | 16 | 66 | 22 | 16 |
//! | SPHINCS+-192s | 192-bit | SHAKE256 | 24 | 63 | 7 | 16 |
//! | SPHINCS+-192f | 192-bit | SHAKE256 | 24 | 66 | 22 | 16 |
//! | SPHINCS+-256s | 256-bit | SHAKE256 | 32 | 64 | 8 | 16 |
//! | SPHINCS+-256f | 256-bit | SHAKE256 | 32 | 68 | 17 | 16 |

// ============================================================================
// Hash Parameters
// ============================================================================

/// Hash output size in bytes (SPHINCS+-128)
pub const N_128: usize = 16;

/// Hash output size in bytes (SPHINCS+-192)
pub const N_192: usize = 24;

/// Hash output size in bytes (SPHINCS+-256)
pub const N_256: usize = 32;

/// Default hash output size (128-bit security)
pub const N_DEFAULT: usize = N_128;

/// Number of bits per hash word (for STARK field encoding)
/// We use 64-bit chunks for field element representation
pub const HASH_WORD_BITS: usize = 64;

/// Number of field elements needed to represent N_128 bytes hash
/// 16 bytes = 128 bits = 2 × 64-bit field elements
pub const HASH_FIELD_ELEMENTS_128: usize = 2;

/// Number of field elements needed to represent N_256 bytes hash
/// 32 bytes = 256 bits = 4 × 64-bit field elements
pub const HASH_FIELD_ELEMENTS_256: usize = 4;

// ============================================================================
// WOTS+ Parameters
// ============================================================================

/// Winternitz parameter w (base of representation)
/// w = 16 means 4 bits per digit, 2^w - 1 hash iterations per chain
pub const W_DEFAULT: usize = 16;

/// Number of bits per WOTS+ digit
/// log2(w) = 4 for w = 16
pub const WOTS_LOG_W: usize = 4;

/// Length of WOTS+ signature (number of chains)
/// len = len1 + len2
/// len1 = ceil(8n/log2(w)) = ceil(128/4) = 32 for n=16
/// len2 = floor(log2(len1 * (w-1)) / log2(w)) + 1 = 3 for typical params
pub const WOTS_LEN1_128: usize = 32;
pub const WOTS_LEN2_128: usize = 3;
pub const WOTS_LEN_128: usize = WOTS_LEN1_128 + WOTS_LEN2_128; // 35

/// WOTS+ chain length (number of hash iterations per chain)
/// Each chain needs w - 1 = 15 hash operations for w = 16
pub const WOTS_CHAIN_LENGTH: usize = W_DEFAULT - 1; // 15

// ============================================================================
// FORS Parameters
// ============================================================================

/// FORS parameter k (number of trees)
/// Typical values: k = 14 for SPHINCS+-128s
pub const FORS_K_DEFAULT: usize = 14;

/// FORS parameter a (tree height, determines leaves per tree = 2^a)
/// Typical values: a = 12 for SPHINCS+-128s
pub const FORS_A_DEFAULT: usize = 12;

/// Number of leaves per FORS tree
pub const FORS_LEAVES_DEFAULT: usize = 1 << FORS_A_DEFAULT; // 4096

// ============================================================================
// Hypertree Parameters
// ============================================================================

/// Total hypertree height for SPHINCS+-128s
pub const H_128S: usize = 63;

/// Number of tree layers (depth) for SPHINCS+-128s
pub const D_128S: usize = 7;

/// Height of each subtree in hypertree
/// h' = h / d = 63 / 7 = 9
pub const SUBTREE_HEIGHT_128S: usize = H_128S / D_128S;

/// Total hypertree height for SPHINCS+-128f (fast)
pub const H_128F: usize = 66;

/// Number of tree layers for SPHINCS+-128f
pub const D_128F: usize = 22;

/// Height of each subtree for SPHINCS+-128f
pub const SUBTREE_HEIGHT_128F: usize = H_128F / D_128F; // 3

// ============================================================================
// Merkle Tree Parameters
// ============================================================================

/// Maximum Merkle tree depth we support in STARK proofs
pub const MAX_MERKLE_DEPTH: usize = 16;

/// Maximum hash chain length we support in STARK proofs
pub const MAX_CHAIN_LENGTH: usize = 256; // 2^8 for w up to 256

// ============================================================================
// STARK Trace Parameters
// ============================================================================

/// Base trace width for SPHINCS+
/// - Hash input (4 field elements for 256-bit)
/// - Hash output (4 field elements)
/// - Merkle path sibling (4 field elements)
/// - Chain counter (1 field element)
/// - Selectors (4 field elements)
pub const TRACE_WIDTH_SPHINCS: usize = 17;

/// Column indices for SPHINCS+ STARK trace
pub mod sphincs_columns {
    // Hash input H_IN (4 columns for 256-bit hash)
    pub const H_IN_0: usize = 0;
    pub const H_IN_1: usize = 1;
    pub const H_IN_2: usize = 2;
    pub const H_IN_3: usize = 3;

    // Hash output H_OUT (4 columns)
    pub const H_OUT_0: usize = 4;
    pub const H_OUT_1: usize = 5;
    pub const H_OUT_2: usize = 6;
    pub const H_OUT_3: usize = 7;

    // Merkle sibling hash H_SIBL (4 columns)
    pub const H_SIBL_0: usize = 8;
    pub const H_SIBL_1: usize = 9;
    pub const H_SIBL_2: usize = 10;
    pub const H_SIBL_3: usize = 11;

    // Chain/path counter
    pub const C_COUNT: usize = 12;

    // Selectors
    /// S_MERKLE: Active during Merkle path verification (binary)
    pub const S_MERKLE: usize = 13;
    /// S_CHAIN: Active during hash chain computation (binary)
    pub const S_CHAIN: usize = 14;
    /// I_SELECT: Left/right selector for Merkle concatenation (binary)
    pub const I_SELECT: usize = 15;
    /// S_OP: General operation selector (binary)
    pub const S_OP: usize = 16;
}

// ============================================================================
// Security Levels
// ============================================================================

/// SPHINCS+ security levels
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SphincsSecurityLevel {
    /// SPHINCS+-128s: 128-bit security, small signature
    Sphincs128s,
    /// SPHINCS+-128f: 128-bit security, fast signing
    Sphincs128f,
    /// SPHINCS+-192s: 192-bit security, small signature
    Sphincs192s,
    /// SPHINCS+-192f: 192-bit security, fast signing
    Sphincs192f,
    /// SPHINCS+-256s: 256-bit security, small signature
    Sphincs256s,
    /// SPHINCS+-256f: 256-bit security, fast signing
    Sphincs256f,
}

impl SphincsSecurityLevel {
    /// Get hash output size n in bytes
    pub fn n(&self) -> usize {
        match self {
            SphincsSecurityLevel::Sphincs128s | SphincsSecurityLevel::Sphincs128f => N_128,
            SphincsSecurityLevel::Sphincs192s | SphincsSecurityLevel::Sphincs192f => N_192,
            SphincsSecurityLevel::Sphincs256s | SphincsSecurityLevel::Sphincs256f => N_256,
        }
    }

    /// Get total hypertree height h
    pub fn h(&self) -> usize {
        match self {
            SphincsSecurityLevel::Sphincs128s => 63,
            SphincsSecurityLevel::Sphincs128f => 66,
            SphincsSecurityLevel::Sphincs192s => 63,
            SphincsSecurityLevel::Sphincs192f => 66,
            SphincsSecurityLevel::Sphincs256s => 64,
            SphincsSecurityLevel::Sphincs256f => 68,
        }
    }

    /// Get number of tree layers d
    pub fn d(&self) -> usize {
        match self {
            SphincsSecurityLevel::Sphincs128s => 7,
            SphincsSecurityLevel::Sphincs128f => 22,
            SphincsSecurityLevel::Sphincs192s => 7,
            SphincsSecurityLevel::Sphincs192f => 22,
            SphincsSecurityLevel::Sphincs256s => 8,
            SphincsSecurityLevel::Sphincs256f => 17,
        }
    }

    /// Get Winternitz parameter w
    pub fn w(&self) -> usize {
        W_DEFAULT // All variants use w = 16
    }

    /// Get FORS parameter k
    pub fn fors_k(&self) -> usize {
        match self {
            SphincsSecurityLevel::Sphincs128s => 14,
            SphincsSecurityLevel::Sphincs128f => 33,
            SphincsSecurityLevel::Sphincs192s => 17,
            SphincsSecurityLevel::Sphincs192f => 33,
            SphincsSecurityLevel::Sphincs256s => 22,
            SphincsSecurityLevel::Sphincs256f => 35,
        }
    }

    /// Get FORS parameter a (tree height)
    pub fn fors_a(&self) -> usize {
        match self {
            SphincsSecurityLevel::Sphincs128s => 12,
            SphincsSecurityLevel::Sphincs128f => 6,
            SphincsSecurityLevel::Sphincs192s => 14,
            SphincsSecurityLevel::Sphincs192f => 8,
            SphincsSecurityLevel::Sphincs256s => 14,
            SphincsSecurityLevel::Sphincs256f => 9,
        }
    }

    /// Get subtree height h' = h / d
    pub fn subtree_height(&self) -> usize {
        self.h() / self.d()
    }

    /// Get WOTS+ length (number of chains)
    pub fn wots_len(&self) -> usize {
        let n = self.n();
        let w = self.w();
        let log_w = (w as f64).log2() as usize;
        let len1 = (8 * n + log_w - 1) / log_w; // ceil division
        let len2 = (((len1 * (w - 1)) as f64).log2() / (w as f64).log2()).floor() as usize + 1;
        len1 + len2
    }
}

impl Default for SphincsSecurityLevel {
    fn default() -> Self {
        SphincsSecurityLevel::Sphincs128s
    }
}

// ============================================================================
// Address Types (for domain separation in hashing)
// ============================================================================

/// SPHINCS+ address types for domain separation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AddressType {
    /// WOTS+ hash address
    WotsHash = 0,
    /// WOTS+ public key compression
    WotsPk = 1,
    /// Hash tree
    Tree = 2,
    /// FORS tree
    ForsTree = 3,
    /// FORS roots
    ForsRoots = 4,
    /// WOTS+ key generation
    WotsKeyGen = 5,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_security_level_params() {
        let level = SphincsSecurityLevel::Sphincs128s;
        assert_eq!(level.n(), 16);
        assert_eq!(level.h(), 63);
        assert_eq!(level.d(), 7);
        assert_eq!(level.w(), 16);
        assert_eq!(level.subtree_height(), 9);

        let level_f = SphincsSecurityLevel::Sphincs128f;
        assert_eq!(level_f.h(), 66);
        assert_eq!(level_f.d(), 22);
        assert_eq!(level_f.subtree_height(), 3);
    }

    #[test]
    fn test_wots_len() {
        let level = SphincsSecurityLevel::Sphincs128s;
        let wots_len = level.wots_len();
        // For n=16, w=16: len1 = 32, len2 = 3, total = 35
        assert_eq!(wots_len, 35);

        let level_256 = SphincsSecurityLevel::Sphincs256s;
        let wots_len_256 = level_256.wots_len();
        // For n=32, w=16: len1 = 64, len2 = 3, total = 67
        assert_eq!(wots_len_256, 67);
    }

    #[test]
    fn test_trace_width() {
        assert_eq!(TRACE_WIDTH_SPHINCS, 17);
        assert_eq!(sphincs_columns::S_OP, 16);
    }

    #[test]
    fn test_fors_params() {
        let level = SphincsSecurityLevel::Sphincs128s;
        assert_eq!(level.fors_k(), 14);
        assert_eq!(level.fors_a(), 12);

        // 2^a leaves per tree
        let leaves = 1 << level.fors_a();
        assert_eq!(leaves, 4096);
    }

    #[test]
    fn test_hash_field_elements() {
        // 128-bit hash (16 bytes) needs 2 field elements (64 bits each)
        assert_eq!(HASH_FIELD_ELEMENTS_128, 2);

        // 256-bit hash (32 bytes) needs 4 field elements
        assert_eq!(HASH_FIELD_ELEMENTS_256, 4);
    }
}
