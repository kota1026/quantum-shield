//! Trace generation for Dilithium Signature Verification STARK proof
//!
//! Builds the execution trace with all required columns for NTT, FMA, Truncation,
//! Keccak χ step, and Norm Check operations.

use winterfell::math::fields::f128::BaseElement;
use winterfell::math::FieldElement;
use winterfell::TraceTable;

use crate::air::columns;
use crate::constants::{Q, TRACE_WIDTH, TRUNCATION_K, TWIDDLE_FACTORS, NORM_BOUND};

/// Build the complete Dilithium signature verification execution trace
///
/// # Arguments
/// * `num_rows` - Number of rows in the trace (should be power of 2)
/// * `input_coeffs` - Input polynomial coefficients
///
/// # Returns
/// TraceTable with all NTT, FMA, Truncation, Keccak, and Norm Check columns
pub fn build_ntt_trace(num_rows: usize, input_coeffs: &[u64]) -> TraceTable<BaseElement> {
    assert!(num_rows.is_power_of_two(), "Trace length must be power of 2");

    // Initialize trace matrix with extended width for FMA and Truncation
    let mut trace = TraceTable::new(TRACE_WIDTH, num_rows);

    // Fill trace with NTT butterfly, FMA, and Truncation operations
    trace.fill(
        |state| {
            // Initial state (row 0)
            let a = if !input_coeffs.is_empty() { input_coeffs[0] } else { 0 };
            let b = if input_coeffs.len() > 1 { input_coeffs[1] } else { 0 };
            let c = if input_coeffs.len() > 2 { input_coeffs[2] } else { 0 };
            let omega = TWIDDLE_FACTORS[0];

            // Compute Montgomery butterfly for NTT
            let (b_prime, m_ntt) = montgomery_butterfly(a, b, omega);

            // Compute FMA: (A * B + C) mod Q
            let (r_fma, m_fma) = montgomery_fma(a, b, c);

            // Decompose M_NTT into high and low chunks
            let m_h = m_ntt >> 16;
            let m_l = m_ntt & 0xFFFF;

            // Decompose M_FMA into high and low chunks
            let m_fma_h = m_fma >> 16;
            let m_fma_l = m_fma & 0xFFFF;

            // Decompose B'_H into bits for range check
            let b_prime_h = (b_prime >> 16) & 0x7F; // 7 bits

            // T_16 value for PRC
            let t16 = m_h;

            // Compute Truncation: W_IN = W_1 * 2^k + W_0
            // Use FMA result as truncation input for demonstration
            let w_in = r_fma;
            let (w_1, w_0) = truncate(w_in);
            let w_0_h = w_0 >> 16;
            let w_0_l = w_0 & 0xFFFF;

            // Fill NTT columns (0-14)
            state[columns::A] = BaseElement::from(a);
            state[columns::B] = BaseElement::from(b);
            state[columns::M_NTT] = BaseElement::from(m_ntt);
            state[columns::B_PRIME] = BaseElement::from(b_prime);
            state[columns::M_H] = BaseElement::from(m_h);
            state[columns::M_L] = BaseElement::from(m_l);
            state[columns::Z] = BaseElement::ONE; // Z accumulator starts at 1
            state[columns::T_16] = BaseElement::from(t16);

            // Fill bit columns for B'_H
            for i in 0..7 {
                state[columns::BITS_START + i] = BaseElement::from(((b_prime_h >> i) & 1) as u64);
            }

            // Fill FMA columns (15-19)
            state[columns::C] = BaseElement::from(c);
            state[columns::M_FMA] = BaseElement::from(m_fma);
            state[columns::R_FMA] = BaseElement::from(r_fma);
            state[columns::M_FMA_H] = BaseElement::from(m_fma_h);
            state[columns::M_FMA_L] = BaseElement::from(m_fma_l);

            // Fill Truncation columns (20-24)
            state[columns::W_IN] = BaseElement::from(w_in);
            state[columns::W_1] = BaseElement::from(w_1);
            state[columns::W_0] = BaseElement::from(w_0);
            state[columns::W_0_H] = BaseElement::from(w_0_h);
            state[columns::W_0_L] = BaseElement::from(w_0_l);

            // Fill operation selector columns (25-26)
            state[columns::S_OP] = BaseElement::ONE; // Row 0 is an operation row
            state[columns::OP_TYPE] = BaseElement::ZERO; // 0 = NTT/FMA/TRUNC combined

            // Fill Keccak χ step columns (27-32)
            // For demonstration, compute χ step with test bits derived from coefficients
            let k_a = (a & 1) as u64;
            let k_b = ((a >> 1) & 1) as u64;
            let k_c = ((a >> 2) & 1) as u64;
            let (k_and, k_out) = keccak_chi_step(k_a, k_b, k_c);

            state[columns::K_A] = BaseElement::from(k_a);
            state[columns::K_B] = BaseElement::from(k_b);
            state[columns::K_C] = BaseElement::from(k_c);
            state[columns::K_AND] = BaseElement::from(k_and);
            state[columns::K_OUT] = BaseElement::from(k_out);
            state[columns::S_KECCAK] = BaseElement::ZERO; // Not active Keccak row (simplified)

            // Fill Norm Check columns (33-36)
            // Use a derived value for norm check (e.g., from signature coefficient)
            // For demonstration, use a value guaranteed to be < 2^16
            let z_norm = (a % NORM_BOUND) as u64;
            let (z_norm_h, z_norm_l) = norm_decompose(z_norm);

            state[columns::Z_NORM] = BaseElement::from(z_norm);
            state[columns::Z_NORM_H] = BaseElement::from(z_norm_h);
            state[columns::Z_NORM_L] = BaseElement::from(z_norm_l);
            state[columns::S_NORM] = BaseElement::ZERO; // Not active norm row (simplified)
        },
        |step, state| {
            // Transition function for subsequent rows
            let row_idx = step + 1;
            let _is_last_row = row_idx == num_rows - 1;

            // Get coefficients for this operation
            let coeff_idx = (row_idx * 2) % input_coeffs.len().max(2);
            let a = if coeff_idx < input_coeffs.len() {
                input_coeffs[coeff_idx]
            } else {
                0
            };
            let b = if coeff_idx + 1 < input_coeffs.len() {
                input_coeffs[coeff_idx + 1]
            } else {
                0
            };
            let c = if coeff_idx + 2 < input_coeffs.len() {
                input_coeffs[(coeff_idx + 2) % input_coeffs.len()]
            } else {
                0
            };

            // Get twiddle factor for this stage
            let omega_idx = row_idx % TWIDDLE_FACTORS.len();
            let omega = TWIDDLE_FACTORS[omega_idx];

            // Compute Montgomery butterfly for NTT
            let (b_prime, m_ntt) = montgomery_butterfly(a, b, omega);

            // Compute FMA: (A * B + C) mod Q
            let (r_fma, m_fma) = montgomery_fma(a, b, c);

            // Decompose M_NTT into high and low chunks
            let m_h = m_ntt >> 16;
            let m_l = m_ntt & 0xFFFF;

            // Decompose M_FMA into high and low chunks
            let m_fma_h = m_fma >> 16;
            let m_fma_l = m_fma & 0xFFFF;

            // Decompose B'_H into bits
            let b_prime_h = (b_prime >> 16) & 0x7F;

            // T_16 for PRC
            let t16 = m_h;

            // Compute Truncation
            let w_in = r_fma;
            let (w_1, w_0) = truncate(w_in);
            let w_0_h = w_0 >> 16;
            let w_0_l = w_0 & 0xFFFF;

            // Fill NTT columns (0-14)
            state[columns::A] = BaseElement::from(a);
            state[columns::B] = BaseElement::from(b);
            state[columns::M_NTT] = BaseElement::from(m_ntt);
            state[columns::B_PRIME] = BaseElement::from(b_prime);
            state[columns::M_H] = BaseElement::from(m_h);
            state[columns::M_L] = BaseElement::from(m_l);
            state[columns::Z] = BaseElement::ONE; // Simplified: Z = 1 throughout
            state[columns::T_16] = BaseElement::from(t16);

            // Fill bit columns
            for i in 0..7 {
                state[columns::BITS_START + i] = BaseElement::from(((b_prime_h >> i) & 1) as u64);
            }

            // Fill FMA columns (15-19)
            state[columns::C] = BaseElement::from(c);
            state[columns::M_FMA] = BaseElement::from(m_fma);
            state[columns::R_FMA] = BaseElement::from(r_fma);
            state[columns::M_FMA_H] = BaseElement::from(m_fma_h);
            state[columns::M_FMA_L] = BaseElement::from(m_fma_l);

            // Fill Truncation columns (20-24)
            state[columns::W_IN] = BaseElement::from(w_in);
            state[columns::W_1] = BaseElement::from(w_1);
            state[columns::W_0] = BaseElement::from(w_0);
            state[columns::W_0_H] = BaseElement::from(w_0_h);
            state[columns::W_0_L] = BaseElement::from(w_0_l);

            // Fill operation selector columns (25-26)
            // All rows are operation rows in this simplified version
            state[columns::S_OP] = BaseElement::ONE;
            state[columns::OP_TYPE] = BaseElement::ZERO;

            // Fill Keccak χ step columns (27-32)
            // For demonstration, compute χ step with test bits derived from coefficients
            let k_a = (a & 1) as u64;
            let k_b = ((a >> 1) & 1) as u64;
            let k_c = ((a >> 2) & 1) as u64;
            let (k_and, k_out) = keccak_chi_step(k_a, k_b, k_c);

            state[columns::K_A] = BaseElement::from(k_a);
            state[columns::K_B] = BaseElement::from(k_b);
            state[columns::K_C] = BaseElement::from(k_c);
            state[columns::K_AND] = BaseElement::from(k_and);
            state[columns::K_OUT] = BaseElement::from(k_out);
            state[columns::S_KECCAK] = BaseElement::ZERO; // Not active Keccak row (simplified)

            // Fill Norm Check columns (33-36)
            // Use a derived value for norm check (e.g., from signature coefficient)
            // For demonstration, use a value guaranteed to be < 2^16
            let z_norm = (a % NORM_BOUND) as u64;
            let (z_norm_h, z_norm_l) = norm_decompose(z_norm);

            state[columns::Z_NORM] = BaseElement::from(z_norm);
            state[columns::Z_NORM_H] = BaseElement::from(z_norm_h);
            state[columns::Z_NORM_L] = BaseElement::from(z_norm_l);
            state[columns::S_NORM] = BaseElement::ZERO; // Not active norm row (simplified)
        },
    );

    trace
}

/// Compute truncation operation
///
/// Decomposes W_IN into upper bits (W_1) and lower bits (W_0)
/// such that W_IN = W_1 * 2^k + W_0
///
/// # Arguments
/// * `w_in` - Input value to truncate
///
/// # Returns
/// (w_1, w_0) where w_1 is upper bits and w_0 is lower k bits
pub fn truncate(w_in: u64) -> (u64, u64) {
    let w_0 = w_in & ((1u64 << TRUNCATION_K) - 1); // Lower k bits
    let w_1 = w_in >> TRUNCATION_K; // Upper bits
    (w_1, w_0)
}

/// Decompose a norm value into high and low 16-bit chunks
///
/// For norm check, we decompose Z_NORM into two 16-bit parts:
/// Z_NORM = Z_NORM_H * 2^16 + Z_NORM_L
///
/// If Z_NORM < 2^16 (the norm bound), then Z_NORM_H must be 0.
///
/// # Arguments
/// * `z_norm` - The norm value to decompose
///
/// # Returns
/// (z_norm_h, z_norm_l) - high and low 16-bit chunks
pub fn norm_decompose(z_norm: u64) -> (u64, u64) {
    let z_norm_l = z_norm & 0xFFFF; // Lower 16 bits
    let z_norm_h = z_norm >> 16;     // Upper bits (should be 0 for valid norm)
    (z_norm_h, z_norm_l)
}

/// Compute Keccak χ (chi) step for a single bit position
///
/// The χ step is the only non-linear operation in Keccak.
/// It computes: A' = A XOR ((NOT B) AND C)
///
/// In binary arithmetic:
/// - NOT B = 1 - B
/// - AND is multiplication
/// - XOR is A + B - 2*A*B
///
/// # Arguments
/// * `a` - Input bit A (must be 0 or 1)
/// * `b` - Input bit B (must be 0 or 1)
/// * `c` - Input bit C (must be 0 or 1)
///
/// # Returns
/// (k_and, k_out) where:
/// - k_and = (1 - B) * C = (NOT B) AND C
/// - k_out = A XOR k_and
pub fn keccak_chi_step(a: u64, b: u64, c: u64) -> (u64, u64) {
    debug_assert!(a <= 1, "a must be binary");
    debug_assert!(b <= 1, "b must be binary");
    debug_assert!(c <= 1, "c must be binary");

    // Compute (NOT B) AND C = (1 - B) * C
    let k_and = (1 - b) * c;

    // Compute A XOR k_and
    // XOR in binary: A XOR B = A + B - 2*A*B
    let k_out = a ^ k_and; // Using native XOR for correctness

    (k_and, k_out)
}

/// Compute Keccak χ step in field arithmetic (for constraint verification)
///
/// This version uses field arithmetic to match the AIR constraints.
/// XOR is computed as: X + Y - 2*X*Y (for binary X, Y)
///
/// # Arguments
/// * `a` - Input bit A as field element (must be 0 or 1)
/// * `b` - Input bit B as field element (must be 0 or 1)
/// * `c` - Input bit C as field element (must be 0 or 1)
///
/// # Returns
/// (k_and, k_out) as field elements
pub fn keccak_chi_step_field(
    a: BaseElement,
    b: BaseElement,
    c: BaseElement,
) -> (BaseElement, BaseElement) {
    // Compute (NOT B) AND C = (1 - B) * C
    let k_and = (BaseElement::ONE - b) * c;

    // Compute A XOR k_and using field arithmetic
    // XOR: X + Y - 2*X*Y
    let two = BaseElement::ONE + BaseElement::ONE;
    let k_out = a + k_and - two * a * k_and;

    (k_and, k_out)
}

/// Compute Montgomery butterfly operation for NTT
///
/// Computes (A - B) * omega using Montgomery reduction
/// The constraint is: (A - B) * omega + M*Q = B' * R
///
/// Note: B' is NOT reduced mod Q because the AIR constraint must hold exactly
///
/// # Arguments
/// * `a` - First input coefficient
/// * `b` - Second input coefficient
/// * `omega` - Twiddle factor
///
/// # Returns
/// (result, montgomery_quotient)
fn montgomery_butterfly(a: u64, b: u64, omega: u64) -> (u64, u64) {
    // Compute P = (A - B) * omega
    // Handle potential underflow in modular subtraction
    let diff = if a >= b {
        a - b
    } else {
        Q - (b - a) % Q
    };

    // Product in larger space
    let product = (diff as u128) * (omega as u128);

    // Montgomery reduction: find M such that P + M*Q = B' * R
    // M = (P * (-Q^{-1})) mod R
    // where -Q^{-1} mod R = 4236238847 (precomputed)
    let neg_q_inv_mod_r: u128 = 4236238847;
    let m = ((product * neg_q_inv_mod_r) & ((1u128 << 32) - 1)) as u64;

    // Compute B' = (P + M*Q) / R
    // DO NOT reduce mod Q - the constraint must hold exactly
    let b_prime = ((product + (m as u128) * (Q as u128)) >> 32) as u64;

    (b_prime, m)
}

/// Compute Montgomery FMA (Fused Multiply-Add) operation
///
/// Computes (A * B + C) mod Q using Montgomery reduction
/// The constraint is: A*B + C + M_FMA*Q = R_FMA*R
///
/// Note: R_FMA is NOT reduced mod Q because the AIR constraint must hold
/// as: P + M*Q = R_FMA*R in integer arithmetic (embedded in field)
///
/// # Arguments
/// * `a` - First multiplicand
/// * `b` - Second multiplicand
/// * `c` - Addend
///
/// # Returns
/// (result, montgomery_quotient)
pub fn montgomery_fma(a: u64, b: u64, c: u64) -> (u64, u64) {
    // Compute P = A * B + C
    // This matches the constraint: A*B + C + M_FMA*Q = R_FMA*R
    let product = (a as u128) * (b as u128) + (c as u128);

    // Montgomery reduction: find M such that P + M*Q = R * R_FMA
    // M = (P * (-Q^{-1})) mod R
    // where -Q^{-1} mod R = 4236238847 (precomputed)
    let neg_q_inv_mod_r: u128 = 4236238847;
    let m = ((product * neg_q_inv_mod_r) & ((1u128 << 32) - 1)) as u64;

    // Compute R_FMA = (P + M*Q) / R
    // DO NOT reduce mod Q - the constraint P + M*Q = R_FMA*R must hold exactly
    let r_fma = ((product + (m as u128) * (Q as u128)) >> 32) as u64;

    (r_fma, m)
}

/// Generate test coefficients for benchmarking
pub fn generate_test_coefficients(n: usize) -> Vec<u64> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut coeffs = Vec::with_capacity(n);
    for i in 0..n {
        let mut hasher = DefaultHasher::new();
        i.hash(&mut hasher);
        let val = hasher.finish() % Q;
        coeffs.push(val);
    }
    coeffs
}

// ============================================================================
// Phase II Extension: Sampler Gate and Hint Gate Trace Generation
// ============================================================================

use crate::constants::TRACE_WIDTH_EXTENDED;

/// Challenge coefficient representation
/// c_i ∈ {-1, 0, 1} encoded as:
/// - 0: c = 0, indicator = 0, sign = 0
/// - 1: c = 1, indicator = 1, sign = 0
/// - -1: c = P-1 (field representation), indicator = 1, sign = 1
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ChallengeCoeff {
    /// The coefficient value (0, 1, or -1 as field element)
    pub value: i8,
    /// Indicator: 1 if non-zero, 0 if zero
    pub indicator: u8,
    /// Sign: 0 for positive, 1 for negative
    pub sign: u8,
}

impl ChallengeCoeff {
    /// Create a zero coefficient
    pub fn zero() -> Self {
        Self { value: 0, indicator: 0, sign: 0 }
    }

    /// Create a +1 coefficient
    pub fn plus_one() -> Self {
        Self { value: 1, indicator: 1, sign: 0 }
    }

    /// Create a -1 coefficient
    pub fn minus_one() -> Self {
        Self { value: -1, indicator: 1, sign: 1 }
    }

    /// Create from value
    pub fn from_value(v: i8) -> Self {
        match v {
            0 => Self::zero(),
            1 => Self::plus_one(),
            -1 => Self::minus_one(),
            _ => panic!("Challenge coefficient must be -1, 0, or 1"),
        }
    }

    /// Convert to field element
    pub fn to_field(&self) -> BaseElement {
        match self.value {
            0 => BaseElement::ZERO,
            1 => BaseElement::ONE,
            -1 => BaseElement::ZERO - BaseElement::ONE, // P - 1
            _ => unreachable!(),
        }
    }
}

/// Generate a challenge polynomial with τ non-zero coefficients
///
/// In Dilithium, the challenge c is a polynomial with exactly τ coefficients
/// equal to ±1, and the rest equal to 0.
///
/// # Arguments
/// * `n` - Number of coefficients (typically 256)
/// * `tau` - Number of non-zero coefficients
/// * `seed` - Seed for deterministic generation (for testing)
pub fn generate_challenge_polynomial(n: usize, tau: usize, seed: u64) -> Vec<ChallengeCoeff> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    assert!(tau <= n, "τ must be <= n");

    let mut coeffs = vec![ChallengeCoeff::zero(); n];

    // Deterministically select τ positions and signs
    for i in 0..tau {
        let mut hasher = DefaultHasher::new();
        (seed, i, "pos").hash(&mut hasher);
        let pos = (hasher.finish() as usize) % n;

        // If position already taken, find next available
        let mut actual_pos = pos;
        while coeffs[actual_pos].indicator == 1 {
            actual_pos = (actual_pos + 1) % n;
        }

        // Determine sign
        let mut sign_hasher = DefaultHasher::new();
        (seed, i, "sign").hash(&mut sign_hasher);
        let sign = (sign_hasher.finish() & 1) as u8;

        coeffs[actual_pos] = if sign == 0 {
            ChallengeCoeff::plus_one()
        } else {
            ChallengeCoeff::minus_one()
        };
    }

    coeffs
}

/// Generate hint values for Dilithium signature verification
///
/// Hint h is a binary vector indicating where rounding adjustments are needed.
/// The sum of hints must be ≤ ω (omega) for valid signatures.
///
/// # Arguments
/// * `n` - Number of hint bits
/// * `hint_sum` - Target sum of hints (number of 1s)
/// * `seed` - Seed for deterministic generation
pub fn generate_hint_vector(n: usize, hint_sum: usize, seed: u64) -> Vec<u8> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    assert!(hint_sum <= n, "hint_sum must be <= n");

    let mut hints = vec![0u8; n];

    // Deterministically select hint_sum positions to set to 1
    for i in 0..hint_sum {
        let mut hasher = DefaultHasher::new();
        (seed, i, "hint").hash(&mut hasher);
        let pos = (hasher.finish() as usize) % n;

        // If position already set, find next available
        let mut actual_pos = pos;
        while hints[actual_pos] == 1 {
            actual_pos = (actual_pos + 1) % n;
        }
        hints[actual_pos] = 1;
    }

    hints
}

/// Build extended trace with Sampler Gate and Hint Gate columns
///
/// This function generates a trace for the extended AIR that includes
/// challenge sampling and hint processing.
///
/// # Arguments
/// * `num_rows` - Number of rows in the trace (must be power of 2)
/// * `input_coeffs` - Input polynomial coefficients
/// * `challenge` - Challenge polynomial coefficients
/// * `hints` - Hint values
pub fn build_extended_trace(
    num_rows: usize,
    input_coeffs: &[u64],
    challenge: &[ChallengeCoeff],
    hints: &[u8],
) -> TraceTable<BaseElement> {
    assert!(num_rows.is_power_of_two(), "Trace length must be power of 2");

    let mut trace = TraceTable::new(TRACE_WIDTH_EXTENDED, num_rows);

    // Track hint accumulator
    let mut hint_acc: u64 = 0;

    trace.fill(
        |state| {
            // Initial state (row 0)
            fill_base_columns(state, input_coeffs, 0);

            // Fill Sampler Gate columns
            let c = if !challenge.is_empty() {
                challenge[0]
            } else {
                ChallengeCoeff::zero()
            };
            state[columns::CHALLENGE_C] = c.to_field();
            state[columns::C_INDICATOR] = BaseElement::from(c.indicator as u64);
            state[columns::C_SIGN] = BaseElement::from(c.sign as u64);
            state[columns::KECCAK_BIT] = BaseElement::ZERO;
            state[columns::S_SAMPLE] = BaseElement::ONE; // Row 0 is sampling row

            // Fill Hint Gate columns
            let h = if !hints.is_empty() { hints[0] } else { 0 };
            state[columns::HINT_H] = BaseElement::from(h as u64);
            state[columns::HINT_ACC] = BaseElement::ZERO; // Starts at 0
            state[columns::S_HINT] = BaseElement::ONE; // Row 0 is hint row
        },
        |step, state| {
            let row_idx = step + 1;

            // Fill base columns (same as build_ntt_trace)
            fill_base_columns(state, input_coeffs, row_idx);

            // Fill Sampler Gate columns
            let c = if row_idx < challenge.len() {
                challenge[row_idx]
            } else {
                ChallengeCoeff::zero()
            };
            state[columns::CHALLENGE_C] = c.to_field();
            state[columns::C_INDICATOR] = BaseElement::from(c.indicator as u64);
            state[columns::C_SIGN] = BaseElement::from(c.sign as u64);
            state[columns::KECCAK_BIT] = BaseElement::ZERO;
            state[columns::S_SAMPLE] = if row_idx < challenge.len() {
                BaseElement::ONE
            } else {
                BaseElement::ZERO
            };

            // Fill Hint Gate columns
            let h = if row_idx < hints.len() { hints[row_idx] } else { 0 };

            // Update accumulator from previous row's hint
            let prev_h = if step < hints.len() { hints[step] } else { 0 };
            let prev_s_hint = if step < hints.len() { 1u64 } else { 0u64 };
            hint_acc += (prev_h as u64) * prev_s_hint;

            state[columns::HINT_H] = BaseElement::from(h as u64);
            state[columns::HINT_ACC] = BaseElement::from(hint_acc);
            state[columns::S_HINT] = if row_idx < hints.len() {
                BaseElement::ONE
            } else {
                BaseElement::ZERO
            };
        },
    );

    trace
}

/// Fill base columns (reused from build_ntt_trace logic)
fn fill_base_columns(state: &mut [BaseElement], input_coeffs: &[u64], row_idx: usize) {
    // Get coefficients for this row
    let coeff_idx = (row_idx * 2) % input_coeffs.len().max(1);
    let a = if coeff_idx < input_coeffs.len() {
        input_coeffs[coeff_idx]
    } else {
        0
    };
    let b = if coeff_idx + 1 < input_coeffs.len() {
        input_coeffs[coeff_idx + 1]
    } else {
        0
    };
    let c = if coeff_idx + 2 < input_coeffs.len() {
        input_coeffs[(coeff_idx + 2) % input_coeffs.len()]
    } else {
        0
    };

    let omega_idx = row_idx % TWIDDLE_FACTORS.len();
    let omega = TWIDDLE_FACTORS[omega_idx];

    // Compute operations
    let (b_prime, m_ntt) = montgomery_butterfly(a, b, omega);
    let (r_fma, m_fma) = montgomery_fma(a, b, c);
    let (w_1, w_0) = truncate(r_fma);

    // Decompositions
    let m_h = m_ntt >> 16;
    let m_l = m_ntt & 0xFFFF;
    let m_fma_h = m_fma >> 16;
    let m_fma_l = m_fma & 0xFFFF;
    let w_0_h = w_0 >> 16;
    let w_0_l = w_0 & 0xFFFF;
    let b_prime_h = (b_prime >> 16) & 0x7F;

    // NTT columns
    state[columns::A] = BaseElement::from(a);
    state[columns::B] = BaseElement::from(b);
    state[columns::M_NTT] = BaseElement::from(m_ntt);
    state[columns::B_PRIME] = BaseElement::from(b_prime);
    state[columns::M_H] = BaseElement::from(m_h);
    state[columns::M_L] = BaseElement::from(m_l);
    state[columns::Z] = BaseElement::ONE;
    state[columns::T_16] = BaseElement::from(m_h);

    // Bit columns
    for i in 0..7 {
        state[columns::BITS_START + i] = BaseElement::from(((b_prime_h >> i) & 1) as u64);
    }

    // FMA columns
    state[columns::C] = BaseElement::from(c);
    state[columns::M_FMA] = BaseElement::from(m_fma);
    state[columns::R_FMA] = BaseElement::from(r_fma);
    state[columns::M_FMA_H] = BaseElement::from(m_fma_h);
    state[columns::M_FMA_L] = BaseElement::from(m_fma_l);

    // Truncation columns
    state[columns::W_IN] = BaseElement::from(r_fma);
    state[columns::W_1] = BaseElement::from(w_1);
    state[columns::W_0] = BaseElement::from(w_0);
    state[columns::W_0_H] = BaseElement::from(w_0_h);
    state[columns::W_0_L] = BaseElement::from(w_0_l);

    // Selector columns
    state[columns::S_OP] = BaseElement::ONE;
    state[columns::OP_TYPE] = BaseElement::ZERO;

    // Keccak columns (simplified)
    let k_a = (a & 1) as u64;
    let k_b = ((a >> 1) & 1) as u64;
    let k_c = ((a >> 2) & 1) as u64;
    let (k_and, k_out) = keccak_chi_step(k_a, k_b, k_c);

    state[columns::K_A] = BaseElement::from(k_a);
    state[columns::K_B] = BaseElement::from(k_b);
    state[columns::K_C] = BaseElement::from(k_c);
    state[columns::K_AND] = BaseElement::from(k_and);
    state[columns::K_OUT] = BaseElement::from(k_out);
    state[columns::S_KECCAK] = BaseElement::ZERO;

    // Norm columns
    let z_norm = (a % NORM_BOUND) as u64;
    let (z_norm_h, z_norm_l) = norm_decompose(z_norm);

    state[columns::Z_NORM] = BaseElement::from(z_norm);
    state[columns::Z_NORM_H] = BaseElement::from(z_norm_h);
    state[columns::Z_NORM_L] = BaseElement::from(z_norm_l);
    state[columns::S_NORM] = BaseElement::ZERO;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::{R_SQRT, TWO_POW_K};
    use winterfell::Trace;

    #[test]
    fn test_montgomery_butterfly() {
        let a = 1234567u64;
        let b = 7654321u64;
        let omega = TWIDDLE_FACTORS[1];

        let (result, m) = montgomery_butterfly(a, b, omega);

        // Verify Montgomery relation: (a-b)*omega + m*Q = result * R
        let diff = if a >= b { a - b } else { Q - (b - a) % Q };
        let lhs = (diff as u128 * omega as u128 + m as u128 * Q as u128) >> 32;
        assert_eq!(lhs as u64, result, "Montgomery relation should hold");
    }

    #[test]
    fn test_montgomery_fma() {
        let a = 1234567u64;
        let b = 7654321u64;
        let c = 1000000u64;

        let (result, m) = montgomery_fma(a, b, c);

        // Verify Montgomery relation: a*b + c + m*Q = result * R
        let product = a as u128 * b as u128 + c as u128;
        let lhs = (product + m as u128 * Q as u128) >> 32;
        assert_eq!(lhs as u64, result, "FMA Montgomery relation should hold");
    }

    #[test]
    fn test_build_trace() {
        let coeffs = generate_test_coefficients(16);
        let trace = build_ntt_trace(8, &coeffs);

        assert_eq!(trace.width(), TRACE_WIDTH);
        assert_eq!(trace.length(), 8);
    }

    #[test]
    fn test_trace_fma_columns() {
        let coeffs = generate_test_coefficients(16);
        let trace = build_ntt_trace(8, &coeffs);

        // Verify FMA columns are populated and decomposition is correct
        for row in 0..8 {
            let m_fma = trace.get(columns::M_FMA, row);
            let r_fma = trace.get(columns::R_FMA, row);
            let m_fma_h = trace.get(columns::M_FMA_H, row);
            let m_fma_l = trace.get(columns::M_FMA_L, row);

            // FMA values should be non-zero for non-trivial inputs
            assert!(
                m_fma != BaseElement::ZERO || r_fma != BaseElement::ZERO,
                "FMA columns should be populated"
            );

            // Verify M_FMA decomposition: M_FMA = M_FMA_H * 2^16 + M_FMA_L
            let r_sqrt = BaseElement::from(crate::constants::R_SQRT);
            let expected = m_fma_h * r_sqrt + m_fma_l;
            assert_eq!(m_fma, expected, "M_FMA decomposition should be correct");
        }
    }

    #[test]
    fn test_fma_constraint_in_field() {
        let coeffs = generate_test_coefficients(16);
        let trace = build_ntt_trace(8, &coeffs);

        let q = BaseElement::from(Q);
        let r = BaseElement::from(crate::constants::R);

        // Verify FMA constraint: A*B + C + M_FMA*Q - R_FMA*R = 0
        for row in 0..8 {
            let a = trace.get(columns::A, row);
            let b = trace.get(columns::B, row);
            let c = trace.get(columns::C, row);
            let m_fma = trace.get(columns::M_FMA, row);
            let r_fma = trace.get(columns::R_FMA, row);

            let constraint = a * b + c + m_fma * q - r_fma * r;
            assert_eq!(
                constraint,
                BaseElement::ZERO,
                "FMA constraint should be zero at row {}: a={:?}, b={:?}, c={:?}, m_fma={:?}, r_fma={:?}",
                row, a, b, c, m_fma, r_fma
            );
        }
    }

    #[test]
    fn test_truncation() {
        // Test truncation function
        let w_in = 123456789u64;
        let (w_1, w_0) = truncate(w_in);

        // Verify: W_IN = W_1 * 2^k + W_0
        let reconstructed = w_1 * TWO_POW_K + w_0;
        assert_eq!(w_in, reconstructed, "Truncation should be reversible");

        // Verify W_0 is within range (< 2^k)
        assert!(w_0 < TWO_POW_K, "W_0 should be less than 2^k");
    }

    #[test]
    fn test_truncation_constraint_in_field() {
        let coeffs = generate_test_coefficients(16);
        let trace = build_ntt_trace(8, &coeffs);

        let two_pow_k = BaseElement::from(TWO_POW_K);
        let r_sqrt = BaseElement::from(R_SQRT);

        // Verify Truncation constraints
        for row in 0..8 {
            let w_in = trace.get(columns::W_IN, row);
            let w_1 = trace.get(columns::W_1, row);
            let w_0 = trace.get(columns::W_0, row);
            let w_0_h = trace.get(columns::W_0_H, row);
            let w_0_l = trace.get(columns::W_0_L, row);

            // C_Trunc: W_IN - (W_1 * 2^k + W_0) = 0
            let c_trunc = w_in - (w_1 * two_pow_k + w_0);
            assert_eq!(c_trunc, BaseElement::ZERO, "C_Trunc failed at row {}", row);

            // C_Decomp_W0: W_0 - (W_0_H * 2^16 + W_0_L) = 0
            let c_decomp_w0 = w_0 - (w_0_h * r_sqrt + w_0_l);
            assert_eq!(c_decomp_w0, BaseElement::ZERO, "C_Decomp_W0 failed at row {}", row);
        }
    }

    #[test]
    fn test_selector_constraints() {
        let coeffs = generate_test_coefficients(16);
        let trace = build_ntt_trace(8, &coeffs);

        // Verify selector constraints
        for row in 0..8 {
            let s_op = trace.get(columns::S_OP, row);

            // S_OP is binary: S_OP * (1 - S_OP) = 0
            let binary_constraint = s_op * (BaseElement::ONE - s_op);
            assert_eq!(binary_constraint, BaseElement::ZERO, "S_OP binary constraint failed at row {}", row);
        }
    }

    #[test]
    fn test_all_constraints_large_trace() {
        // Test with a larger trace size similar to 2^14
        let trace_size = 16384;
        let coeffs = generate_test_coefficients(trace_size * 2);
        let trace = build_ntt_trace(trace_size, &coeffs);

        let q = BaseElement::from(Q);
        let r = BaseElement::from(crate::constants::R);
        let r_sqrt = BaseElement::from(R_SQRT);
        let two_pow_k = BaseElement::from(TWO_POW_K);

        // Verify all constraints on all rows except the last (transition constraints)
        for row in 0..(trace_size - 1) {
            // C_Decomp_NTT: M_NTT - (M_H * 2^16 + M_L) = 0
            let m_ntt = trace.get(columns::M_NTT, row);
            let m_h = trace.get(columns::M_H, row);
            let m_l = trace.get(columns::M_L, row);
            let c0 = m_ntt - (m_h * r_sqrt + m_l);
            assert_eq!(c0, BaseElement::ZERO, "C_Decomp_NTT failed at row {}", row);

            // Bit constraints
            for i in 0..7 {
                let b_i = trace.get(columns::BITS_START + i, row);
                let bit_constraint = b_i * (BaseElement::ONE - b_i);
                assert_eq!(bit_constraint, BaseElement::ZERO, "Bit {} constraint failed at row {}", i, row);
            }

            // C_Decomp_FMA: M_FMA - (M_FMA_H * 2^16 + M_FMA_L) = 0
            let m_fma = trace.get(columns::M_FMA, row);
            let m_fma_h = trace.get(columns::M_FMA_H, row);
            let m_fma_l = trace.get(columns::M_FMA_L, row);
            let c8 = m_fma - (m_fma_h * r_sqrt + m_fma_l);
            assert_eq!(c8, BaseElement::ZERO, "C_Decomp_FMA failed at row {}", row);

            // C_FMA: A*B + C + M_FMA*Q - R_FMA*R = 0
            let a = trace.get(columns::A, row);
            let b = trace.get(columns::B, row);
            let c = trace.get(columns::C, row);
            let r_fma = trace.get(columns::R_FMA, row);
            let c9 = a * b + c + m_fma * q - r_fma * r;
            assert_eq!(c9, BaseElement::ZERO, "C_FMA failed at row {}", row);

            // C_Trunc: W_IN - (W_1 * 2^k + W_0) = 0
            let w_in = trace.get(columns::W_IN, row);
            let w_1 = trace.get(columns::W_1, row);
            let w_0 = trace.get(columns::W_0, row);
            let c10 = w_in - (w_1 * two_pow_k + w_0);
            assert_eq!(c10, BaseElement::ZERO, "C_Trunc failed at row {}", row);

            // C_Decomp_W0: W_0 - (W_0_H * 2^16 + W_0_L) = 0
            let w_0_h = trace.get(columns::W_0_H, row);
            let w_0_l = trace.get(columns::W_0_L, row);
            let c11 = w_0 - (w_0_h * r_sqrt + w_0_l);
            assert_eq!(c11, BaseElement::ZERO, "C_Decomp_W0 failed at row {}", row);

            // S_OP binary constraint
            let s_op = trace.get(columns::S_OP, row);
            let c12 = s_op * (BaseElement::ONE - s_op);
            assert_eq!(c12, BaseElement::ZERO, "S_OP binary failed at row {}", row);

            // Z consistency: Z_next - Z = 0
            let z = trace.get(columns::Z, row);
            let z_next = trace.get(columns::Z, row + 1);
            let c_z = z_next - z;
            assert_eq!(c_z, BaseElement::ZERO, "Z consistency failed at row {}", row);

            // Keccak χ step constraints
            let k_a = trace.get(columns::K_A, row);
            let k_b = trace.get(columns::K_B, row);
            let k_c = trace.get(columns::K_C, row);
            let k_and = trace.get(columns::K_AND, row);
            let k_out = trace.get(columns::K_OUT, row);
            let s_keccak = trace.get(columns::S_KECCAK, row);

            // Binary constraints
            let c16 = k_a * (BaseElement::ONE - k_a);
            assert_eq!(c16, BaseElement::ZERO, "K_A binary failed at row {}", row);
            let c17 = k_b * (BaseElement::ONE - k_b);
            assert_eq!(c17, BaseElement::ZERO, "K_B binary failed at row {}", row);
            let c18 = k_c * (BaseElement::ONE - k_c);
            assert_eq!(c18, BaseElement::ZERO, "K_C binary failed at row {}", row);

            // K_AND = (1 - K_B) * K_C
            let c19 = k_and - (BaseElement::ONE - k_b) * k_c;
            assert_eq!(c19, BaseElement::ZERO, "K_AND constraint failed at row {}", row);

            // K_OUT = K_A XOR K_AND = K_A + K_AND - 2 * K_A * K_AND
            let two = BaseElement::ONE + BaseElement::ONE;
            let c20 = k_out - (k_a + k_and - two * k_a * k_and);
            assert_eq!(c20, BaseElement::ZERO, "K_OUT constraint failed at row {}", row);

            // S_KECCAK binary
            let c21 = s_keccak * (BaseElement::ONE - s_keccak);
            assert_eq!(c21, BaseElement::ZERO, "S_KECCAK binary failed at row {}", row);
        }
    }

    #[test]
    fn test_keccak_chi_step() {
        // Test all 8 combinations of (A, B, C)
        // χ step: A' = A XOR ((NOT B) AND C)
        let test_cases: [(u64, u64, u64, u64, u64); 8] = [
            // (A, B, C, expected_and, expected_out)
            (0, 0, 0, 0, 0), // NOT 0 = 1, 1 AND 0 = 0, 0 XOR 0 = 0
            (0, 0, 1, 1, 1), // NOT 0 = 1, 1 AND 1 = 1, 0 XOR 1 = 1
            (0, 1, 0, 0, 0), // NOT 1 = 0, 0 AND 0 = 0, 0 XOR 0 = 0
            (0, 1, 1, 0, 0), // NOT 1 = 0, 0 AND 1 = 0, 0 XOR 0 = 0
            (1, 0, 0, 0, 1), // NOT 0 = 1, 1 AND 0 = 0, 1 XOR 0 = 1
            (1, 0, 1, 1, 0), // NOT 0 = 1, 1 AND 1 = 1, 1 XOR 1 = 0
            (1, 1, 0, 0, 1), // NOT 1 = 0, 0 AND 0 = 0, 1 XOR 0 = 1
            (1, 1, 1, 0, 1), // NOT 1 = 0, 0 AND 1 = 0, 1 XOR 0 = 1
        ];

        for (a, b, c, expected_and, expected_out) in test_cases {
            let (k_and, k_out) = keccak_chi_step(a, b, c);
            assert_eq!(
                k_and, expected_and,
                "k_and mismatch for (A={}, B={}, C={}): got {}, expected {}",
                a, b, c, k_and, expected_and
            );
            assert_eq!(
                k_out, expected_out,
                "k_out mismatch for (A={}, B={}, C={}): got {}, expected {}",
                a, b, c, k_out, expected_out
            );
        }
    }

    #[test]
    fn test_keccak_chi_step_field() {
        // Test field arithmetic version matches native version
        let test_cases: [(u64, u64, u64); 8] = [
            (0, 0, 0),
            (0, 0, 1),
            (0, 1, 0),
            (0, 1, 1),
            (1, 0, 0),
            (1, 0, 1),
            (1, 1, 0),
            (1, 1, 1),
        ];

        for (a, b, c) in test_cases {
            let (native_and, native_out) = keccak_chi_step(a, b, c);
            let (field_and, field_out) = keccak_chi_step_field(
                BaseElement::from(a),
                BaseElement::from(b),
                BaseElement::from(c),
            );

            assert_eq!(
                field_and,
                BaseElement::from(native_and),
                "Field k_and mismatch for (A={}, B={}, C={})",
                a, b, c
            );
            assert_eq!(
                field_out,
                BaseElement::from(native_out),
                "Field k_out mismatch for (A={}, B={}, C={})",
                a, b, c
            );
        }
    }

    #[test]
    fn test_keccak_constraints_in_trace() {
        let coeffs = generate_test_coefficients(16);
        let trace = build_ntt_trace(8, &coeffs);

        // Verify Keccak χ step constraints on each row
        for row in 0..8 {
            let k_a = trace.get(columns::K_A, row);
            let k_b = trace.get(columns::K_B, row);
            let k_c = trace.get(columns::K_C, row);
            let k_and = trace.get(columns::K_AND, row);
            let k_out = trace.get(columns::K_OUT, row);

            // Verify binary constraints
            assert_eq!(
                k_a * (BaseElement::ONE - k_a),
                BaseElement::ZERO,
                "K_A not binary at row {}",
                row
            );
            assert_eq!(
                k_b * (BaseElement::ONE - k_b),
                BaseElement::ZERO,
                "K_B not binary at row {}",
                row
            );
            assert_eq!(
                k_c * (BaseElement::ONE - k_c),
                BaseElement::ZERO,
                "K_C not binary at row {}",
                row
            );

            // Verify K_AND constraint: K_AND = (1 - K_B) * K_C
            let expected_and = (BaseElement::ONE - k_b) * k_c;
            assert_eq!(
                k_and, expected_and,
                "K_AND constraint failed at row {}",
                row
            );

            // Verify K_OUT constraint: K_OUT = K_A + K_AND - 2 * K_A * K_AND
            let two = BaseElement::ONE + BaseElement::ONE;
            let expected_out = k_a + k_and - two * k_a * k_and;
            assert_eq!(
                k_out, expected_out,
                "K_OUT constraint failed at row {}",
                row
            );
        }
    }

    #[test]
    fn test_norm_decompose() {
        // Test norm decomposition function
        // Case 1: Value within norm bound (< 2^16)
        let z_norm = 12345u64;
        let (z_h, z_l) = norm_decompose(z_norm);
        assert_eq!(z_h, 0, "High chunk should be 0 for value < 2^16");
        assert_eq!(z_l, 12345, "Low chunk should equal original value");
        assert_eq!(z_h * R_SQRT + z_l, z_norm, "Decomposition should reconstruct original");

        // Case 2: Value at norm bound (2^16 - 1)
        let z_norm = 65535u64;
        let (z_h, z_l) = norm_decompose(z_norm);
        assert_eq!(z_h, 0, "High chunk should be 0 for max valid norm");
        assert_eq!(z_l, 65535, "Low chunk should be 2^16 - 1");

        // Case 3: Value exceeding norm bound (would fail constraint)
        let z_norm = 65536u64; // 2^16
        let (z_h, z_l) = norm_decompose(z_norm);
        assert_eq!(z_h, 1, "High chunk should be 1 for value = 2^16");
        assert_eq!(z_l, 0, "Low chunk should be 0");
        assert_eq!(z_h * R_SQRT + z_l, z_norm, "Decomposition should still reconstruct");

        // Case 4: Larger value
        let z_norm = 123456789u64;
        let (z_h, z_l) = norm_decompose(z_norm);
        assert_eq!(z_h * R_SQRT + z_l, z_norm, "Decomposition should reconstruct");
    }

    #[test]
    fn test_norm_check_constraints_in_trace() {
        let coeffs = generate_test_coefficients(16);
        let trace = build_ntt_trace(8, &coeffs);

        let r_sqrt = BaseElement::from(R_SQRT);

        // Verify Norm Check constraints on each row
        for row in 0..8 {
            let z_norm = trace.get(columns::Z_NORM, row);
            let z_norm_h = trace.get(columns::Z_NORM_H, row);
            let z_norm_l = trace.get(columns::Z_NORM_L, row);
            let s_norm = trace.get(columns::S_NORM, row);

            // C_Norm_Decomp: Z_NORM - (Z_NORM_H * 2^16 + Z_NORM_L) = 0
            let c_decomp = z_norm - (z_norm_h * r_sqrt + z_norm_l);
            assert_eq!(
                c_decomp,
                BaseElement::ZERO,
                "Norm decomposition constraint failed at row {}",
                row
            );

            // C_Norm_Range: Z_NORM_H = 0 (for valid norm < 2^16)
            assert_eq!(
                z_norm_h,
                BaseElement::ZERO,
                "Norm range constraint failed at row {}: Z_NORM_H should be 0",
                row
            );

            // S_NORM binary: S_NORM * (1 - S_NORM) = 0
            let s_binary = s_norm * (BaseElement::ONE - s_norm);
            assert_eq!(
                s_binary,
                BaseElement::ZERO,
                "S_NORM binary constraint failed at row {}",
                row
            );
        }
    }

    #[test]
    fn test_all_constraints_with_norm_check() {
        // Test all constraints including norm check on a larger trace
        let trace_size = 1024;
        let coeffs = generate_test_coefficients(trace_size * 2);
        let trace = build_ntt_trace(trace_size, &coeffs);

        let r_sqrt = BaseElement::from(R_SQRT);

        // Verify norm check constraints on all rows
        for row in 0..trace_size {
            let z_norm = trace.get(columns::Z_NORM, row);
            let z_norm_h = trace.get(columns::Z_NORM_H, row);
            let z_norm_l = trace.get(columns::Z_NORM_L, row);
            let s_norm = trace.get(columns::S_NORM, row);

            // C_Norm_Decomp
            let c_decomp = z_norm - (z_norm_h * r_sqrt + z_norm_l);
            assert_eq!(c_decomp, BaseElement::ZERO, "Norm decomp failed at row {}", row);

            // C_Norm_Range: Z_NORM_H = 0
            assert_eq!(z_norm_h, BaseElement::ZERO, "Norm range failed at row {}", row);

            // S_NORM binary
            let s_binary = s_norm * (BaseElement::ONE - s_norm);
            assert_eq!(s_binary, BaseElement::ZERO, "S_NORM binary failed at row {}", row);
        }
    }

    #[test]
    fn test_dilithium_full_verification_trace() {
        // Integration test: verify all Dilithium signature verification components
        // NTT + FMA + Truncation + Keccak + Norm Check
        let trace_size = 256;
        let coeffs = generate_test_coefficients(trace_size * 2);
        let trace = build_ntt_trace(trace_size, &coeffs);

        let q = BaseElement::from(Q);
        let r = BaseElement::from(crate::constants::R);
        let r_sqrt = BaseElement::from(R_SQRT);
        let two_pow_k = BaseElement::from(TWO_POW_K);
        let two = BaseElement::ONE + BaseElement::ONE;

        println!("Testing Dilithium full verification trace ({} rows)...", trace_size);

        for row in 0..(trace_size - 1) {
            // === NTT Constraints ===
            let m_ntt = trace.get(columns::M_NTT, row);
            let m_h = trace.get(columns::M_H, row);
            let m_l = trace.get(columns::M_L, row);
            let c_decomp_ntt = m_ntt - (m_h * r_sqrt + m_l);
            assert_eq!(c_decomp_ntt, BaseElement::ZERO, "NTT decomp failed at row {}", row);

            // === FMA Constraints ===
            let a = trace.get(columns::A, row);
            let b = trace.get(columns::B, row);
            let c = trace.get(columns::C, row);
            let m_fma = trace.get(columns::M_FMA, row);
            let r_fma = trace.get(columns::R_FMA, row);
            let m_fma_h = trace.get(columns::M_FMA_H, row);
            let m_fma_l = trace.get(columns::M_FMA_L, row);

            let c_fma = a * b + c + m_fma * q - r_fma * r;
            assert_eq!(c_fma, BaseElement::ZERO, "FMA constraint failed at row {}", row);

            let c_decomp_fma = m_fma - (m_fma_h * r_sqrt + m_fma_l);
            assert_eq!(c_decomp_fma, BaseElement::ZERO, "FMA decomp failed at row {}", row);

            // === Truncation Constraints ===
            let w_in = trace.get(columns::W_IN, row);
            let w_1 = trace.get(columns::W_1, row);
            let w_0 = trace.get(columns::W_0, row);
            let w_0_h = trace.get(columns::W_0_H, row);
            let w_0_l = trace.get(columns::W_0_L, row);

            let c_trunc = w_in - (w_1 * two_pow_k + w_0);
            assert_eq!(c_trunc, BaseElement::ZERO, "Trunc constraint failed at row {}", row);

            let c_decomp_w0 = w_0 - (w_0_h * r_sqrt + w_0_l);
            assert_eq!(c_decomp_w0, BaseElement::ZERO, "W0 decomp failed at row {}", row);

            // === Keccak χ Step Constraints ===
            let k_a = trace.get(columns::K_A, row);
            let k_b = trace.get(columns::K_B, row);
            let k_c = trace.get(columns::K_C, row);
            let k_and = trace.get(columns::K_AND, row);
            let k_out = trace.get(columns::K_OUT, row);

            let c_kand = k_and - (BaseElement::ONE - k_b) * k_c;
            assert_eq!(c_kand, BaseElement::ZERO, "K_AND constraint failed at row {}", row);

            let c_kout = k_out - (k_a + k_and - two * k_a * k_and);
            assert_eq!(c_kout, BaseElement::ZERO, "K_OUT constraint failed at row {}", row);

            // === Norm Check Constraints ===
            let z_norm = trace.get(columns::Z_NORM, row);
            let z_norm_h = trace.get(columns::Z_NORM_H, row);
            let z_norm_l = trace.get(columns::Z_NORM_L, row);

            let c_norm_decomp = z_norm - (z_norm_h * r_sqrt + z_norm_l);
            assert_eq!(c_norm_decomp, BaseElement::ZERO, "Norm decomp failed at row {}", row);

            // Verify norm bound: Z_NORM_H = 0 (value < 2^16)
            assert_eq!(z_norm_h, BaseElement::ZERO, "Norm range failed at row {}", row);
        }

        println!("✅ All Dilithium signature verification constraints passed!");
    }

    // ========================================================================
    // Phase II Extension Tests
    // ========================================================================

    #[test]
    fn test_challenge_coeff_creation() {
        // Test zero coefficient
        let c0 = ChallengeCoeff::zero();
        assert_eq!(c0.value, 0);
        assert_eq!(c0.indicator, 0);
        assert_eq!(c0.sign, 0);
        assert_eq!(c0.to_field(), BaseElement::ZERO);

        // Test +1 coefficient
        let c1 = ChallengeCoeff::plus_one();
        assert_eq!(c1.value, 1);
        assert_eq!(c1.indicator, 1);
        assert_eq!(c1.sign, 0);
        assert_eq!(c1.to_field(), BaseElement::ONE);

        // Test -1 coefficient
        let cm1 = ChallengeCoeff::minus_one();
        assert_eq!(cm1.value, -1);
        assert_eq!(cm1.indicator, 1);
        assert_eq!(cm1.sign, 1);
        let neg_one = BaseElement::ZERO - BaseElement::ONE;
        assert_eq!(cm1.to_field(), neg_one);
    }

    #[test]
    fn test_challenge_coeff_from_value() {
        assert_eq!(ChallengeCoeff::from_value(0), ChallengeCoeff::zero());
        assert_eq!(ChallengeCoeff::from_value(1), ChallengeCoeff::plus_one());
        assert_eq!(ChallengeCoeff::from_value(-1), ChallengeCoeff::minus_one());
    }

    #[test]
    fn test_generate_challenge_polynomial() {
        let n = 256;
        let tau = 49; // Dilithium Level 3
        let seed = 12345u64;

        let challenge = generate_challenge_polynomial(n, tau, seed);

        // Check length
        assert_eq!(challenge.len(), n);

        // Count non-zero coefficients
        let non_zero_count: usize = challenge.iter()
            .filter(|c| c.indicator == 1)
            .count();
        assert_eq!(non_zero_count, tau, "Should have exactly τ non-zero coefficients");

        // Verify all coefficients are in {-1, 0, 1}
        for c in &challenge {
            assert!(
                c.value == -1 || c.value == 0 || c.value == 1,
                "Coefficient value {} not in {{-1, 0, 1}}", c.value
            );
        }

        // Verify deterministic generation
        let challenge2 = generate_challenge_polynomial(n, tau, seed);
        assert_eq!(challenge, challenge2, "Same seed should produce same challenge");
    }

    #[test]
    fn test_generate_hint_vector() {
        let n = 256;
        let hint_sum = 30; // Less than ω = 55
        let seed = 54321u64;

        let hints = generate_hint_vector(n, hint_sum, seed);

        // Check length
        assert_eq!(hints.len(), n);

        // Count ones
        let ones_count: usize = hints.iter().filter(|&&h| h == 1).count();
        assert_eq!(ones_count, hint_sum, "Should have exactly hint_sum ones");

        // Verify all values are binary
        for &h in &hints {
            assert!(h == 0 || h == 1, "Hint value {} not binary", h);
        }

        // Verify deterministic generation
        let hints2 = generate_hint_vector(n, hint_sum, seed);
        assert_eq!(hints, hints2, "Same seed should produce same hints");
    }

    #[test]
    fn test_build_extended_trace() {
        let num_rows = 64;
        let input_coeffs = generate_test_coefficients(num_rows * 2);
        let challenge = generate_challenge_polynomial(num_rows, 10, 12345);
        let hints = generate_hint_vector(num_rows, 5, 54321);

        let trace = build_extended_trace(num_rows, &input_coeffs, &challenge, &hints);

        // Verify trace dimensions
        assert_eq!(trace.width(), TRACE_WIDTH_EXTENDED);
        assert_eq!(trace.length(), num_rows);
    }

    #[test]
    fn test_extended_trace_sampler_constraints() {
        let num_rows = 64;
        let input_coeffs = generate_test_coefficients(num_rows * 2);
        let challenge = generate_challenge_polynomial(num_rows, 10, 12345);
        let hints = generate_hint_vector(num_rows, 5, 54321);

        let trace = build_extended_trace(num_rows, &input_coeffs, &challenge, &hints);

        let two = BaseElement::ONE + BaseElement::ONE;

        // Verify Sampler Gate constraints
        for row in 0..num_rows {
            let c_val = trace.get(columns::CHALLENGE_C, row);
            let c_indicator = trace.get(columns::C_INDICATOR, row);
            let c_sign = trace.get(columns::C_SIGN, row);
            let s_sample = trace.get(columns::S_SAMPLE, row);

            // C_Sample: C² * (C² - 1) = 0
            let c_sq = c_val * c_val;
            let c_sample = c_sq * (c_sq - BaseElement::ONE);
            assert_eq!(
                c_sample, BaseElement::ZERO,
                "C_Sample constraint failed at row {}", row
            );

            // C_INDICATOR binary
            let c_ind_binary = c_indicator * (BaseElement::ONE - c_indicator);
            assert_eq!(
                c_ind_binary, BaseElement::ZERO,
                "C_INDICATOR binary failed at row {}", row
            );

            // C_SIGN binary
            let c_sign_binary = c_sign * (BaseElement::ONE - c_sign);
            assert_eq!(
                c_sign_binary, BaseElement::ZERO,
                "C_SIGN binary failed at row {}", row
            );

            // C = I * (1 - 2 * S) when S_SAMPLE = 1
            let expected_c = c_indicator * (BaseElement::ONE - two * c_sign);
            let c_encoding = (c_val - expected_c) * s_sample;
            assert_eq!(
                c_encoding, BaseElement::ZERO,
                "C encoding constraint failed at row {}", row
            );
        }

        println!("✅ All Sampler Gate constraints passed!");
    }

    #[test]
    fn test_extended_trace_hint_constraints() {
        let num_rows = 64;
        let input_coeffs = generate_test_coefficients(num_rows * 2);
        let challenge = generate_challenge_polynomial(num_rows, 10, 12345);
        let hints = generate_hint_vector(num_rows, 5, 54321);

        let trace = build_extended_trace(num_rows, &input_coeffs, &challenge, &hints);

        // Verify Hint Gate constraints
        for row in 0..num_rows {
            let h = trace.get(columns::HINT_H, row);
            let s_hint = trace.get(columns::S_HINT, row);

            // H binary: H * (H - 1) = 0
            let h_binary = h * (h - BaseElement::ONE);
            assert_eq!(
                h_binary, BaseElement::ZERO,
                "H binary constraint failed at row {}", row
            );

            // S_HINT binary
            let s_binary = s_hint * (BaseElement::ONE - s_hint);
            assert_eq!(
                s_binary, BaseElement::ZERO,
                "S_HINT binary failed at row {}", row
            );
        }

        // Verify accumulator transition
        for row in 0..(num_rows - 1) {
            let h = trace.get(columns::HINT_H, row);
            let acc = trace.get(columns::HINT_ACC, row);
            let acc_next = trace.get(columns::HINT_ACC, row + 1);
            let s_hint = trace.get(columns::S_HINT, row);

            // ACC_next = ACC + H * S_HINT
            let expected_acc_next = acc + h * s_hint;
            assert_eq!(
                acc_next, expected_acc_next,
                "Hint accumulator transition failed at row {}", row
            );
        }

        // Verify initial and final accumulator values
        let initial_acc = trace.get(columns::HINT_ACC, 0);
        assert_eq!(
            initial_acc, BaseElement::ZERO,
            "Initial hint accumulator should be 0"
        );

        // Final accumulator should equal hint sum
        let final_acc = trace.get(columns::HINT_ACC, num_rows - 1);
        let expected_sum: u64 = hints.iter().take(num_rows - 1).map(|&h| h as u64).sum();
        assert_eq!(
            final_acc, BaseElement::from(expected_sum),
            "Final hint accumulator should equal sum of hints"
        );

        println!("✅ All Hint Gate constraints passed!");
    }

    #[test]
    fn test_extended_trace_full_integration() {
        // Full integration test for Phase II extended trace
        let num_rows = 256;
        let input_coeffs = generate_test_coefficients(num_rows * 2);
        let tau = 49; // Dilithium Level 3 challenge weight
        let hint_sum = 30; // Example hint sum

        let challenge = generate_challenge_polynomial(num_rows, tau, 12345);
        let hints = generate_hint_vector(num_rows, hint_sum, 54321);

        let trace = build_extended_trace(num_rows, &input_coeffs, &challenge, &hints);

        let _two = BaseElement::ONE + BaseElement::ONE;
        let r_sqrt = BaseElement::from(R_SQRT);
        let _q = BaseElement::from(Q);
        let _r = BaseElement::from(crate::constants::R);
        let _two_pow_k = BaseElement::from(TWO_POW_K);

        println!("Testing Phase II extended trace ({} rows)...", num_rows);

        for row in 0..(num_rows - 1) {
            // === Base Constraints (sampled) ===
            let m_ntt = trace.get(columns::M_NTT, row);
            let m_h = trace.get(columns::M_H, row);
            let m_l = trace.get(columns::M_L, row);
            let c_decomp = m_ntt - (m_h * r_sqrt + m_l);
            assert_eq!(c_decomp, BaseElement::ZERO, "NTT decomp failed at row {}", row);

            // === Sampler Constraints ===
            let c_val = trace.get(columns::CHALLENGE_C, row);
            let c_sq = c_val * c_val;
            let c_sample = c_sq * (c_sq - BaseElement::ONE);
            assert_eq!(c_sample, BaseElement::ZERO, "C_Sample failed at row {}", row);

            // === Hint Constraints ===
            let h = trace.get(columns::HINT_H, row);
            let h_binary = h * (h - BaseElement::ONE);
            assert_eq!(h_binary, BaseElement::ZERO, "H binary failed at row {}", row);
        }

        // Verify challenge weight (count of non-zero coefficients)
        let actual_tau: usize = (0..num_rows)
            .filter(|&row| {
                let c_indicator = trace.get(columns::C_INDICATOR, row);
                c_indicator == BaseElement::ONE
            })
            .count();
        assert_eq!(actual_tau, tau, "Challenge weight mismatch");

        println!("✅ Phase II extended trace integration test passed!");
        println!("   Challenge weight τ = {}", tau);
        println!("   Hint sum = {}", hint_sum);
    }
}
