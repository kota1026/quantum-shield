//! Trace generation for Dilithium Signature Verification STARK proof
//!
//! Builds the execution trace with all required columns for NTT, FMA, Truncation,
//! Keccak chi step, and Norm Check operations.

use winterfell::math::fields::f128::BaseElement;
use winterfell::math::FieldElement;
use winterfell::TraceTable;

use super::air::columns;
use super::constants::{Q, TRACE_WIDTH, TRUNCATION_K, TWIDDLE_FACTORS, NORM_BOUND};

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

    let mut trace = TraceTable::new(TRACE_WIDTH, num_rows);

    trace.fill(
        |state| {
            // Initial state (row 0)
            let a = if !input_coeffs.is_empty() { input_coeffs[0] } else { 0 };
            let b = if input_coeffs.len() > 1 { input_coeffs[1] } else { 0 };
            let c = if input_coeffs.len() > 2 { input_coeffs[2] } else { 0 };
            let omega = TWIDDLE_FACTORS[0];

            let (b_prime, m_ntt) = montgomery_butterfly(a, b, omega);
            let (r_fma, m_fma) = montgomery_fma(a, b, c);

            let m_h = m_ntt >> 16;
            let m_l = m_ntt & 0xFFFF;
            let m_fma_h = m_fma >> 16;
            let m_fma_l = m_fma & 0xFFFF;
            let b_prime_h = (b_prime >> 16) & 0x7F;
            let t16 = m_h;

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
            state[columns::Z] = BaseElement::ONE;
            state[columns::T_16] = BaseElement::from(t16);

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
            state[columns::S_OP] = BaseElement::ONE;
            state[columns::OP_TYPE] = BaseElement::ZERO;

            // Fill Keccak chi step columns (27-32)
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

            // Fill Norm Check columns (33-36)
            let z_norm = (a % NORM_BOUND) as u64;
            let (z_norm_h, z_norm_l) = norm_decompose(z_norm);

            state[columns::Z_NORM] = BaseElement::from(z_norm);
            state[columns::Z_NORM_H] = BaseElement::from(z_norm_h);
            state[columns::Z_NORM_L] = BaseElement::from(z_norm_l);
            state[columns::S_NORM] = BaseElement::ZERO;
        },
        |step, state| {
            let row_idx = step + 1;
            let coeff_idx = (row_idx * 2) % input_coeffs.len().max(2);

            let a = if coeff_idx < input_coeffs.len() { input_coeffs[coeff_idx] } else { 0 };
            let b = if coeff_idx + 1 < input_coeffs.len() { input_coeffs[coeff_idx + 1] } else { 0 };
            let c = if coeff_idx + 2 < input_coeffs.len() { input_coeffs[(coeff_idx + 2) % input_coeffs.len()] } else { 0 };

            let omega_idx = row_idx % TWIDDLE_FACTORS.len();
            let omega = TWIDDLE_FACTORS[omega_idx];

            let (b_prime, m_ntt) = montgomery_butterfly(a, b, omega);
            let (r_fma, m_fma) = montgomery_fma(a, b, c);

            let m_h = m_ntt >> 16;
            let m_l = m_ntt & 0xFFFF;
            let m_fma_h = m_fma >> 16;
            let m_fma_l = m_fma & 0xFFFF;
            let b_prime_h = (b_prime >> 16) & 0x7F;
            let t16 = m_h;

            let w_in = r_fma;
            let (w_1, w_0) = truncate(w_in);
            let w_0_h = w_0 >> 16;
            let w_0_l = w_0 & 0xFFFF;

            // Fill all columns
            state[columns::A] = BaseElement::from(a);
            state[columns::B] = BaseElement::from(b);
            state[columns::M_NTT] = BaseElement::from(m_ntt);
            state[columns::B_PRIME] = BaseElement::from(b_prime);
            state[columns::M_H] = BaseElement::from(m_h);
            state[columns::M_L] = BaseElement::from(m_l);
            state[columns::Z] = BaseElement::ONE;
            state[columns::T_16] = BaseElement::from(t16);

            for i in 0..7 {
                state[columns::BITS_START + i] = BaseElement::from(((b_prime_h >> i) & 1) as u64);
            }

            state[columns::C] = BaseElement::from(c);
            state[columns::M_FMA] = BaseElement::from(m_fma);
            state[columns::R_FMA] = BaseElement::from(r_fma);
            state[columns::M_FMA_H] = BaseElement::from(m_fma_h);
            state[columns::M_FMA_L] = BaseElement::from(m_fma_l);

            state[columns::W_IN] = BaseElement::from(w_in);
            state[columns::W_1] = BaseElement::from(w_1);
            state[columns::W_0] = BaseElement::from(w_0);
            state[columns::W_0_H] = BaseElement::from(w_0_h);
            state[columns::W_0_L] = BaseElement::from(w_0_l);

            state[columns::S_OP] = BaseElement::ONE;
            state[columns::OP_TYPE] = BaseElement::ZERO;

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

            let z_norm = (a % NORM_BOUND) as u64;
            let (z_norm_h, z_norm_l) = norm_decompose(z_norm);

            state[columns::Z_NORM] = BaseElement::from(z_norm);
            state[columns::Z_NORM_H] = BaseElement::from(z_norm_h);
            state[columns::Z_NORM_L] = BaseElement::from(z_norm_l);
            state[columns::S_NORM] = BaseElement::ZERO;
        },
    );

    trace
}

/// Compute truncation operation
pub fn truncate(w_in: u64) -> (u64, u64) {
    let w_0 = w_in & ((1u64 << TRUNCATION_K) - 1);
    let w_1 = w_in >> TRUNCATION_K;
    (w_1, w_0)
}

/// Decompose a norm value into high and low 16-bit chunks
pub fn norm_decompose(z_norm: u64) -> (u64, u64) {
    let z_norm_l = z_norm & 0xFFFF;
    let z_norm_h = z_norm >> 16;
    (z_norm_h, z_norm_l)
}

/// Compute Keccak chi step for a single bit position
pub fn keccak_chi_step(a: u64, b: u64, c: u64) -> (u64, u64) {
    debug_assert!(a <= 1, "a must be binary");
    debug_assert!(b <= 1, "b must be binary");
    debug_assert!(c <= 1, "c must be binary");

    let k_and = (1 - b) * c;
    let k_out = a ^ k_and;
    (k_and, k_out)
}

/// Compute Montgomery butterfly operation for NTT
fn montgomery_butterfly(a: u64, b: u64, omega: u64) -> (u64, u64) {
    let diff = if a >= b { a - b } else { Q - (b - a) % Q };
    let product = (diff as u128) * (omega as u128);
    let neg_q_inv_mod_r: u128 = 4236238847;
    let m = ((product * neg_q_inv_mod_r) & ((1u128 << 32) - 1)) as u64;
    let b_prime = ((product + (m as u128) * (Q as u128)) >> 32) as u64;
    (b_prime, m)
}

/// Compute Montgomery FMA (Fused Multiply-Add) operation
pub fn montgomery_fma(a: u64, b: u64, c: u64) -> (u64, u64) {
    let product = (a as u128) * (b as u128) + (c as u128);
    let neg_q_inv_mod_r: u128 = 4236238847;
    let m = ((product * neg_q_inv_mod_r) & ((1u128 << 32) - 1)) as u64;
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

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::constants::{R_SQRT, TWO_POW_K};
    use winterfell::Trace;

    #[test]
    fn test_montgomery_butterfly() {
        let a = 1234567u64;
        let b = 7654321u64;
        let omega = TWIDDLE_FACTORS[1];

        let (result, m) = montgomery_butterfly(a, b, omega);
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
    fn test_truncation() {
        let w_in = 123456789u64;
        let (w_1, w_0) = truncate(w_in);
        let reconstructed = w_1 * TWO_POW_K + w_0;
        assert_eq!(w_in, reconstructed, "Truncation should be reversible");
        assert!(w_0 < TWO_POW_K, "W_0 should be less than 2^k");
    }

    #[test]
    fn test_fma_constraint_in_field() {
        let coeffs = generate_test_coefficients(16);
        let trace = build_ntt_trace(8, &coeffs);

        let q = BaseElement::from(Q);
        let r = BaseElement::from(super::super::constants::R);

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
                "FMA constraint should be zero at row {}",
                row
            );
        }
    }

    #[test]
    fn test_truncation_constraint_in_field() {
        let coeffs = generate_test_coefficients(16);
        let trace = build_ntt_trace(8, &coeffs);

        let two_pow_k = BaseElement::from(TWO_POW_K);
        let r_sqrt = BaseElement::from(R_SQRT);

        for row in 0..8 {
            let w_in = trace.get(columns::W_IN, row);
            let w_1 = trace.get(columns::W_1, row);
            let w_0 = trace.get(columns::W_0, row);
            let w_0_h = trace.get(columns::W_0_H, row);
            let w_0_l = trace.get(columns::W_0_L, row);

            let c_trunc = w_in - (w_1 * two_pow_k + w_0);
            assert_eq!(c_trunc, BaseElement::ZERO, "C_Trunc failed at row {}", row);

            let c_decomp_w0 = w_0 - (w_0_h * r_sqrt + w_0_l);
            assert_eq!(c_decomp_w0, BaseElement::ZERO, "C_Decomp_W0 failed at row {}", row);
        }
    }

    #[test]
    fn test_keccak_chi_step() {
        let test_cases: [(u64, u64, u64, u64, u64); 8] = [
            (0, 0, 0, 0, 0),
            (0, 0, 1, 1, 1),
            (0, 1, 0, 0, 0),
            (0, 1, 1, 0, 0),
            (1, 0, 0, 0, 1),
            (1, 0, 1, 1, 0),
            (1, 1, 0, 0, 1),
            (1, 1, 1, 0, 1),
        ];

        for (a, b, c, expected_and, expected_out) in test_cases {
            let (k_and, k_out) = keccak_chi_step(a, b, c);
            assert_eq!(k_and, expected_and);
            assert_eq!(k_out, expected_out);
        }
    }
}
