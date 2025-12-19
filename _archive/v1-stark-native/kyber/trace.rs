//! Kyber Trace Generation
//!
//! This module generates execution traces for Kyber KEM operations.
//! The trace captures all intermediate values needed for STARK verification.
//!
//! # Kyber-768 Parameters
//!
//! - n = 256 (polynomial degree)
//! - k = 3 (number of polynomials)
//! - η₁ = η₂ = 2 (CBD parameter)
//! - Q = 3329 (modulus)
//!
//! # Trace Structure
//!
//! The trace includes:
//! 1. CBD sampling for error polynomials (e, e₁, e₂)
//! 2. NTT operations for polynomial conversion
//! 3. FMA operations for matrix-vector multiplication

use winterfell::math::fields::f128::BaseElement;
use winterfell::math::{FieldElement, StarkField};
use winterfell::matrix::ColMatrix;

use super::constants::{Q_KYBER, N_KYBER, ETA_DEFAULT};
use super::cbd::{CBDSample, generate_test_cbd_samples, generate_cbd_trace_for_sample};
use super::ntt::{kyber_ntt_butterfly, generate_kyber_twiddle_factors};
use super::fma::kyber_fma;
use super::air::{kyber_columns, KYBER_TRACE_WIDTH};

// ============================================================================
// Kyber Trace Row
// ============================================================================

/// A complete trace row for Kyber STARK
#[derive(Debug, Clone)]
pub struct KyberTraceRow {
    /// All column values for this row
    pub values: [BaseElement; KYBER_TRACE_WIDTH],
}

impl KyberTraceRow {
    /// Create a new empty trace row
    pub fn new() -> Self {
        Self {
            values: [BaseElement::ZERO; KYBER_TRACE_WIDTH],
        }
    }

    /// Create a trace row from values
    pub fn from_values(values: [BaseElement; KYBER_TRACE_WIDTH]) -> Self {
        Self { values }
    }

    /// Set NTT operation values
    pub fn set_ntt(
        &mut self,
        a: u64,
        b: u64,
        zeta: u64,
        t: u64,
        m_ntt: u64,
        a_prime: u64,
        b_prime: u64,
    ) {
        self.values[kyber_columns::A] = BaseElement::from(a);
        self.values[kyber_columns::B] = BaseElement::from(b);
        self.values[kyber_columns::ZETA] = BaseElement::from(zeta);
        self.values[kyber_columns::T] = BaseElement::from(t);
        self.values[kyber_columns::M_NTT] = BaseElement::from(m_ntt);
        self.values[kyber_columns::A_PRIME] = BaseElement::from(a_prime);
        self.values[kyber_columns::B_PRIME] = BaseElement::from(b_prime);
        self.values[kyber_columns::M_H] = BaseElement::from(m_ntt >> 16);
        self.values[kyber_columns::M_L] = BaseElement::from(m_ntt & 0xFFFF);
        self.values[kyber_columns::S_NTT] = BaseElement::ONE;
    }

    /// Set FMA operation values
    pub fn set_fma(
        &mut self,
        a: u64,
        b: u64,
        c: u64,
        m_fma: u64,
        r_fma: u64,
    ) {
        self.values[kyber_columns::A_FMA] = BaseElement::from(a);
        self.values[kyber_columns::B_FMA] = BaseElement::from(b);
        self.values[kyber_columns::C_FMA] = BaseElement::from(c);
        self.values[kyber_columns::M_FMA] = BaseElement::from(m_fma);
        self.values[kyber_columns::R_FMA] = BaseElement::from(r_fma);
        self.values[kyber_columns::M_FMA_H] = BaseElement::from(m_fma >> 16);
        self.values[kyber_columns::M_FMA_L] = BaseElement::from(m_fma & 0xFFFF);
        self.values[kyber_columns::S_FMA] = BaseElement::ONE;
    }

    /// Set CBD operation values
    pub fn set_cbd(
        &mut self,
        b_cbd: u8,
        c_b1: u64,
        c_b2: u64,
        e_cbd: i8,
        s_b1: bool,
        s_b2: bool,
    ) {
        self.values[kyber_columns::B_CBD] = BaseElement::from(b_cbd as u64);
        self.values[kyber_columns::C_B1] = BaseElement::from(c_b1);
        self.values[kyber_columns::C_B2] = BaseElement::from(c_b2);

        // Handle negative e_cbd
        if e_cbd >= 0 {
            self.values[kyber_columns::E_CBD] = BaseElement::from(e_cbd as u64);
        } else {
            self.values[kyber_columns::E_CBD] =
                BaseElement::ZERO - BaseElement::from((-e_cbd) as u64);
        }

        self.values[kyber_columns::S_B1] = if s_b1 { BaseElement::ONE } else { BaseElement::ZERO };
        self.values[kyber_columns::S_B2] = if s_b2 { BaseElement::ONE } else { BaseElement::ZERO };
    }

    /// Set operation selector
    pub fn set_s_op(&mut self, active: bool) {
        self.values[kyber_columns::S_OP] = if active { BaseElement::ONE } else { BaseElement::ZERO };
    }
}

impl Default for KyberTraceRow {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Kyber Trace Builder
// ============================================================================

/// Builder for Kyber execution traces
pub struct KyberTraceBuilder {
    /// Collected trace rows
    rows: Vec<KyberTraceRow>,
    /// CBD samples for error polynomials
    cbd_samples: Vec<CBDSample>,
    /// Twiddle factors for NTT
    twiddles: Vec<u64>,
}

impl KyberTraceBuilder {
    /// Create a new trace builder
    pub fn new() -> Self {
        Self {
            rows: Vec::new(),
            cbd_samples: Vec::new(),
            twiddles: generate_kyber_twiddle_factors(),
        }
    }

    /// Add CBD sampling rows to the trace
    pub fn add_cbd_samples(&mut self, samples: &[CBDSample], eta: usize) {
        for sample in samples {
            let cbd_rows = generate_cbd_trace_for_sample(sample, eta);

            for (i, cbd_row) in cbd_rows.iter().enumerate() {
                let mut row = KyberTraceRow::new();

                // Extract values from CBD trace row
                let b_val = if cbd_row.b_cbd == BaseElement::ONE { 1u8 } else { 0u8 };
                let c_b1_val = Self::base_element_to_u64(cbd_row.c_b1);
                let c_b2_val = Self::base_element_to_u64(cbd_row.c_b2);
                let e_val = if i == 2 * eta - 1 { sample.coefficient } else { 0 };
                let s_b1 = cbd_row.s_b1 == BaseElement::ONE;
                let s_b2 = cbd_row.s_b2 == BaseElement::ONE;

                row.set_cbd(b_val, c_b1_val, c_b2_val, e_val, s_b1, s_b2);
                row.set_s_op(true);

                self.rows.push(row);
            }
        }

        self.cbd_samples.extend_from_slice(samples);
    }

    /// Add NTT butterfly operations to the trace
    pub fn add_ntt_butterflies(&mut self, coeffs: &[u64], num_butterflies: usize) {
        let mut working_coeffs = coeffs.to_vec();

        for i in 0..num_butterflies.min(self.twiddles.len()) {
            let idx_a = (i * 2) % working_coeffs.len();
            let idx_b = (i * 2 + 1) % working_coeffs.len();

            let a = working_coeffs[idx_a];
            let b = working_coeffs[idx_b];
            let zeta = self.twiddles[i % self.twiddles.len()];

            let (a_prime, b_prime, t, m) = kyber_ntt_butterfly(a, b, zeta);

            let mut row = KyberTraceRow::new();
            row.set_ntt(a, b, zeta, t, m, a_prime, b_prime);
            row.set_s_op(true);

            self.rows.push(row);

            // Update coefficients for next iteration
            working_coeffs[idx_a] = a_prime;
            working_coeffs[idx_b] = b_prime;
        }
    }

    /// Add FMA operations to the trace
    pub fn add_fma_operations(&mut self, a_coeffs: &[u64], b_coeffs: &[u64], c_coeffs: &[u64]) {
        let len = a_coeffs.len().min(b_coeffs.len()).min(c_coeffs.len());

        for i in 0..len {
            let a = a_coeffs[i];
            let b = b_coeffs[i];
            let c = c_coeffs[i];

            let (r_fma, m_fma) = kyber_fma(a, b, c);

            let mut row = KyberTraceRow::new();
            row.set_fma(a, b, c, m_fma, r_fma);
            row.set_s_op(true);

            self.rows.push(row);
        }
    }

    /// Pad the trace to a power of 2
    pub fn pad_to_power_of_two(&mut self) {
        let current_len = self.rows.len();
        if current_len == 0 {
            // Minimum trace length
            for _ in 0..64 {
                let mut row = KyberTraceRow::new();
                row.set_s_op(false);
                self.rows.push(row);
            }
            return;
        }

        // Find next power of 2
        let target_len = current_len.next_power_of_two().max(64);

        // Add padding rows
        while self.rows.len() < target_len {
            let mut row = KyberTraceRow::new();
            row.set_s_op(false);
            self.rows.push(row);
        }
    }

    /// Build the final trace matrix
    pub fn build(mut self) -> ColMatrix<BaseElement> {
        self.pad_to_power_of_two();

        let num_rows = self.rows.len();

        // Create column vectors
        let mut columns: Vec<Vec<BaseElement>> = vec![Vec::with_capacity(num_rows); KYBER_TRACE_WIDTH];

        for row in &self.rows {
            for (col_idx, &value) in row.values.iter().enumerate() {
                columns[col_idx].push(value);
            }
        }

        ColMatrix::new(columns)
    }

    /// Get current number of rows
    pub fn num_rows(&self) -> usize {
        self.rows.len()
    }

    /// Helper to convert BaseElement to u64 (for small values)
    fn base_element_to_u64(elem: BaseElement) -> u64 {
        // For small values, the field element equals the integer
        // This is safe for Kyber values which are all < Q = 3329
        let bytes = elem.as_int().to_le_bytes();
        u64::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7]])
    }
}

impl Default for KyberTraceBuilder {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Kyber-768 Trace Generation
// ============================================================================

/// Generate a complete Kyber-768 trace for STARK proof
///
/// This simulates the key encapsulation process:
/// 1. Generate error polynomials using CBD
/// 2. Perform NTT on polynomials
/// 3. Perform matrix-vector multiplication using FMA
pub fn build_kyber768_trace(seed: u64) -> ColMatrix<BaseElement> {
    let mut builder = KyberTraceBuilder::new();

    // 1. Generate CBD samples for error polynomials
    // Kyber-768: k=3 polynomials, n=256 coefficients each, η=2
    let eta = ETA_DEFAULT;
    let num_error_coeffs = 3 * N_KYBER; // 768 coefficients total

    let cbd_samples = generate_test_cbd_samples(num_error_coeffs, eta, seed);
    builder.add_cbd_samples(&cbd_samples, eta);

    // 2. Generate polynomial coefficients for NTT
    // Simulate public key and message polynomials
    let poly_a: Vec<u64> = (0..N_KYBER)
        .map(|i| ((seed + i as u64) * 17) % Q_KYBER)
        .collect();

    builder.add_ntt_butterflies(&poly_a, N_KYBER / 2);

    // 3. Generate FMA operations for matrix-vector multiplication
    // Simulate A * s + e computation
    let poly_s: Vec<u64> = cbd_samples.iter()
        .take(N_KYBER)
        .map(|s| s.to_kyber_field())
        .collect();

    let poly_e: Vec<u64> = cbd_samples.iter()
        .skip(N_KYBER)
        .take(N_KYBER)
        .map(|s| s.to_kyber_field())
        .collect();

    // Extend if needed
    let poly_s: Vec<u64> = if poly_s.len() < N_KYBER {
        let mut extended = poly_s;
        extended.resize(N_KYBER, 0);
        extended
    } else {
        poly_s
    };

    let poly_e: Vec<u64> = if poly_e.len() < N_KYBER {
        let mut extended = poly_e;
        extended.resize(N_KYBER, 0);
        extended
    } else {
        poly_e
    };

    builder.add_fma_operations(&poly_a, &poly_s, &poly_e);

    builder.build()
}

/// Generate a minimal Kyber trace for testing
pub fn build_kyber_test_trace() -> ColMatrix<BaseElement> {
    let mut builder = KyberTraceBuilder::new();

    // Add some CBD samples
    let cbd_samples = generate_test_cbd_samples(16, ETA_DEFAULT, 12345);
    builder.add_cbd_samples(&cbd_samples, ETA_DEFAULT);

    // Add some NTT butterflies
    let coeffs: Vec<u64> = (0..32).map(|i| (i * 100) % Q_KYBER).collect();
    builder.add_ntt_butterflies(&coeffs, 16);

    // Add some FMA operations
    let a_coeffs: Vec<u64> = (0..16).map(|i| (i * 100) % Q_KYBER).collect();
    let b_coeffs: Vec<u64> = (0..16).map(|i| (i * 200 + 50) % Q_KYBER).collect();
    let c_coeffs: Vec<u64> = (0..16).map(|i| (i * 50) % Q_KYBER).collect();
    builder.add_fma_operations(&a_coeffs, &b_coeffs, &c_coeffs);

    builder.build()
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kyber_trace_row_creation() {
        let row = KyberTraceRow::new();
        assert_eq!(row.values.len(), KYBER_TRACE_WIDTH);
        for &val in &row.values {
            assert_eq!(val, BaseElement::ZERO);
        }
    }

    #[test]
    fn test_kyber_trace_row_set_ntt() {
        let mut row = KyberTraceRow::new();
        row.set_ntt(100, 200, 17, 3400, 1234, 150, 250);

        assert_eq!(row.values[kyber_columns::A], BaseElement::from(100u64));
        assert_eq!(row.values[kyber_columns::B], BaseElement::from(200u64));
        assert_eq!(row.values[kyber_columns::ZETA], BaseElement::from(17u64));
        assert_eq!(row.values[kyber_columns::S_NTT], BaseElement::ONE);
    }

    #[test]
    fn test_kyber_trace_row_set_fma() {
        let mut row = KyberTraceRow::new();
        row.set_fma(100, 200, 50, 5678, 999);

        assert_eq!(row.values[kyber_columns::A_FMA], BaseElement::from(100u64));
        assert_eq!(row.values[kyber_columns::B_FMA], BaseElement::from(200u64));
        assert_eq!(row.values[kyber_columns::C_FMA], BaseElement::from(50u64));
        assert_eq!(row.values[kyber_columns::S_FMA], BaseElement::ONE);
    }

    #[test]
    fn test_kyber_trace_row_set_cbd() {
        let mut row = KyberTraceRow::new();
        row.set_cbd(1, 2, 1, 1, true, false);

        assert_eq!(row.values[kyber_columns::B_CBD], BaseElement::ONE);
        assert_eq!(row.values[kyber_columns::C_B1], BaseElement::from(2u64));
        assert_eq!(row.values[kyber_columns::S_B1], BaseElement::ONE);
        assert_eq!(row.values[kyber_columns::S_B2], BaseElement::ZERO);
    }

    #[test]
    fn test_kyber_trace_builder() {
        let mut builder = KyberTraceBuilder::new();

        let cbd_samples = generate_test_cbd_samples(4, 2, 12345);
        builder.add_cbd_samples(&cbd_samples, 2);

        // 4 samples * 4 rows per sample = 16 rows
        assert_eq!(builder.num_rows(), 16);
    }

    #[test]
    fn test_kyber_trace_builder_ntt() {
        let mut builder = KyberTraceBuilder::new();

        let coeffs: Vec<u64> = (0..16).map(|i| i * 100).collect();
        builder.add_ntt_butterflies(&coeffs, 8);

        assert_eq!(builder.num_rows(), 8);
    }

    #[test]
    fn test_kyber_trace_builder_fma() {
        let mut builder = KyberTraceBuilder::new();

        let a: Vec<u64> = vec![100, 200, 300, 400];
        let b: Vec<u64> = vec![10, 20, 30, 40];
        let c: Vec<u64> = vec![1, 2, 3, 4];

        builder.add_fma_operations(&a, &b, &c);

        assert_eq!(builder.num_rows(), 4);
    }

    #[test]
    fn test_kyber_trace_pad_to_power_of_two() {
        let mut builder = KyberTraceBuilder::new();

        let cbd_samples = generate_test_cbd_samples(4, 2, 12345);
        builder.add_cbd_samples(&cbd_samples, 2);

        builder.pad_to_power_of_two();

        // Should pad to 64 (minimum)
        assert!(builder.num_rows().is_power_of_two());
        assert!(builder.num_rows() >= 64);
    }

    #[test]
    fn test_build_kyber_test_trace() {
        let trace = build_kyber_test_trace();

        // Verify trace dimensions
        assert!(trace.num_rows().is_power_of_two());
        assert_eq!(trace.num_cols(), KYBER_TRACE_WIDTH);
        println!("Test trace: {} rows x {} cols", trace.num_rows(), trace.num_cols());
    }

    #[test]
    fn test_build_kyber768_trace() {
        let trace = build_kyber768_trace(42);

        // Verify trace dimensions
        assert!(trace.num_rows().is_power_of_two());
        assert_eq!(trace.num_cols(), KYBER_TRACE_WIDTH);
        println!("Kyber-768 trace: {} rows x {} cols", trace.num_rows(), trace.num_cols());
    }

    #[test]
    fn test_trace_cbd_constraints() {
        // Build a trace with just CBD operations
        let mut builder = KyberTraceBuilder::new();

        let cbd_samples = generate_test_cbd_samples(8, 2, 54321);
        builder.add_cbd_samples(&cbd_samples, 2);

        let trace = builder.build();

        // Verify CBD bit binary constraint: B * (1 - B) = 0
        for row in 0..32 { // First 32 rows are CBD
            let b_cbd = trace.get(kyber_columns::B_CBD, row);
            let constraint = b_cbd * (BaseElement::ONE - b_cbd);
            assert_eq!(constraint, BaseElement::ZERO,
                "CBD bit binary constraint failed at row {}", row);
        }
    }

    #[test]
    fn test_trace_ntt_constraints() {
        let mut builder = KyberTraceBuilder::new();

        let coeffs: Vec<u64> = (0..32).map(|i| (i * 100) % Q_KYBER).collect();
        builder.add_ntt_butterflies(&coeffs, 16);

        let trace = builder.build();

        // Verify M_NTT decomposition: M_NTT = M_H * 2^16 + M_L
        let r_sqrt = BaseElement::from(1u64 << 16);
        for row in 0..16 {
            let m_ntt = trace.get(kyber_columns::M_NTT, row);
            let m_h = trace.get(kyber_columns::M_H, row);
            let m_l = trace.get(kyber_columns::M_L, row);

            let reconstructed = m_h * r_sqrt + m_l;
            assert_eq!(m_ntt, reconstructed,
                "NTT M decomposition failed at row {}", row);
        }
    }

    #[test]
    fn test_trace_fma_constraints() {
        let mut builder = KyberTraceBuilder::new();

        let a: Vec<u64> = (0..8).map(|i| (i * 100) % Q_KYBER).collect();
        let b: Vec<u64> = (0..8).map(|i| (i * 200 + 1) % Q_KYBER).collect();
        let c: Vec<u64> = (0..8).map(|i| (i * 50) % Q_KYBER).collect();

        builder.add_fma_operations(&a, &b, &c);

        let trace = builder.build();

        // Verify M_FMA decomposition
        let r_sqrt = BaseElement::from(1u64 << 16);
        for row in 0..8 {
            let m_fma = trace.get(kyber_columns::M_FMA, row);
            let m_fma_h = trace.get(kyber_columns::M_FMA_H, row);
            let m_fma_l = trace.get(kyber_columns::M_FMA_L, row);

            let reconstructed = m_fma_h * r_sqrt + m_fma_l;
            assert_eq!(m_fma, reconstructed,
                "FMA M decomposition failed at row {}", row);
        }
    }
}
