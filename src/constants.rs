//! Dilithium NTT and FMA constants for STARK proof system
//!
//! These constants are used in the Montgomery NTT and FMA custom gate constraints.

/// Dilithium prime modulus Q = 2^23 - 2^13 + 1 = 8380417
pub const Q: u64 = 8380417;

/// Montgomery constant R = 2^32
pub const R: u64 = 1u64 << 32;

/// Square root of R for chunk decomposition: R_sqrt = 2^16
pub const R_SQRT: u64 = 1u64 << 16;

/// Number of NTT coefficients in Dilithium polynomial
pub const N: usize = 256;

/// Extended trace width for NTT + FMA + Truncation + Keccak + Norm proof (37 columns)
/// NTT Columns (0-14):
/// 0: A (input coefficient)
/// 1: B (input coefficient)
/// 2: M_NTT (Montgomery quotient for NTT)
/// 3: B' (output after butterfly)
/// 4: M_H (high chunk of M_NTT)
/// 5: M_L (low chunk of M_NTT)
/// 6: Z (permutation accumulator)
/// 7: T_16 (reference table value)
/// 8-14: b_0 to b_6 (7 bits for B'_H range check)
///
/// FMA Columns (15-19):
/// 15: C (accumulator input for FMA)
/// 16: M_FMA (Montgomery quotient for FMA)
/// 17: R_FMA (result of A*B + C mod Q)
/// 18: M_FMA_H (high chunk of M_FMA)
/// 19: M_FMA_L (low chunk of M_FMA)
///
/// Truncation Columns (20-24):
/// 20: W_IN (input value for truncation)
/// 21: W_1 (upper bits after truncation)
/// 22: W_0 (lower bits / remainder)
/// 23: W_0_H (high chunk of W_0 for PRC)
/// 24: W_0_L (low chunk of W_0 for PRC)
///
/// Operation Selector Columns (25-26):
/// 25: S_OP (1 if operation row, 0 if padding)
/// 26: OP_TYPE (0=NTT, 1=FMA, 2=TRUNC, 3=KECCAK, 4=NORM)
///
/// Keccak χ Step Columns (27-32):
/// 27: K_A (χ step input A, binary)
/// 28: K_B (χ step input B, binary)
/// 29: K_C (χ step input C, binary)
/// 30: K_AND (intermediate value: (1 - B) * C)
/// 31: K_OUT (χ step output: A XOR ((1-B) AND C))
/// 32: S_KECCAK (Keccak operation selector)
///
/// Norm Check Columns (33-36):
/// 33: Z_NORM (signature coefficient for norm check)
/// 34: Z_NORM_H (high chunk of Z_NORM, must be 0 for ||z||_∞ < 2^16)
/// 35: Z_NORM_L (low chunk of Z_NORM for PRC)
/// 36: S_NORM (norm check selector)
pub const TRACE_WIDTH: usize = 37;

/// Number of auxiliary columns for PRC
pub const AUX_COLUMNS: usize = 8;

/// Truncation parameter k for Dilithium (number of bits to truncate)
/// In Dilithium, rounding uses 2*gamma2 which is 2^19 for level 2/3
pub const TRUNCATION_K: u32 = 13;

/// 2^k for truncation decomposition
pub const TWO_POW_K: u64 = 1u64 << TRUNCATION_K;

/// Security level in bits (post-quantum)
pub const SECURITY_BITS: usize = 128;

/// Primitive root of unity for NTT (mod Q)
/// zeta = 1753 is a primitive 512-th root of unity mod Q
pub const ZETA: u64 = 1753;

/// Precomputed twiddle factors for NTT (first 8 for testing)
pub const TWIDDLE_FACTORS: [u64; 8] = [
    1,        // zeta^0
    1753,     // zeta^1
    3073009,  // zeta^2
    6074001,  // zeta^3
    2306399,  // zeta^4
    5765016,  // zeta^5
    2615408,  // zeta^6
    8345316,  // zeta^7
];

/// Number of Keccak rounds (SHAKE256 uses 24 rounds)
pub const KECCAK_ROUNDS: usize = 24;

/// Keccak state size in bits (1600 for SHA-3/SHAKE)
pub const KECCAK_STATE_BITS: usize = 1600;

/// Keccak lane size in bits (64 for SHA-3/SHAKE)
pub const KECCAK_LANE_BITS: usize = 64;

/// Dilithium norm bound β for signature vector z
/// For Dilithium2: β = γ1 - β = 2^17 - 78
/// For simplified version: we use 2^16 as upper bound
pub const NORM_BOUND: u64 = 1u64 << 16;

/// Dilithium γ1 parameter (coefficient range for y)
/// For Dilithium2: γ1 = 2^17
pub const GAMMA1: u64 = 1u64 << 17;

/// Dilithium γ2 parameter (low-order rounding range)
/// For Dilithium2: γ2 = (Q-1)/88 = 95232
pub const GAMMA2: u64 = 95232;

// ============================================================================
// Phase II Extension: Sampler Gate and Hint Gate Constants
// ============================================================================

/// Extended trace width for Phase II (37 + 8 = 45 columns)
/// New columns for Sampler Gate and Hint Gate:
/// 37: CHALLENGE_C - Challenge coefficient c_i ∈ {-1, 0, 1}
/// 38: C_INDICATOR - Indicator I_i ∈ {0, 1} for non-zero c_i
/// 39: C_SIGN - Sign bit for c_i: 0 = +1, 1 = -1
/// 40: KECCAK_BIT - Keccak output bit for position selection
/// 41: S_SAMPLE - Sampler operation selector
/// 42: HINT_H - Hint value h_i ∈ {0, 1}
/// 43: HINT_ACC - Accumulated hint sum
/// 44: S_HINT - Hint operation selector
pub const TRACE_WIDTH_EXTENDED: usize = 45;

/// Number of non-zero coefficients in challenge polynomial c
/// For Dilithium Level 3: τ = 49
pub const TAU: usize = 49;

/// Dilithium parameter τ (number of ±1 coefficients in challenge c)
/// For Dilithium2: τ = 39
/// For Dilithium3: τ = 49
/// For Dilithium5: τ = 60
pub const CHALLENGE_WEIGHT: u64 = 49;

/// Maximum hint weight (number of 1s in hint vector)
/// For Dilithium Level 3: ω = 55
pub const OMEGA: u64 = 55;
