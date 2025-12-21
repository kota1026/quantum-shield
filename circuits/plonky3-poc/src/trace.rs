//! Execution trace generation for Dilithium verification
//!
//! Generates the witness (execution trace) for STARK proving

use p3_field::Field;
use p3_matrix::dense::RowMajorMatrix;

use crate::constants::{Q, N, ZETAS, montgomery_multiply, ntt_butterfly, check_norm_bound};
use crate::air::{columns, simple_cols};

/// Dilithium execution trace
pub struct DilithiumTrace<F: Field> {
    /// The trace matrix
    pub matrix: RowMajorMatrix<F>,
    /// Number of NTT operations performed
    pub num_operations: usize,
}

impl<F: Field> DilithiumTrace<F> {
    /// Generate trace for NTT butterfly operations
    pub fn generate_ntt_trace(coefficients: &[u64]) -> Self {
        let num_rows = coefficients.len().next_power_of_two();
        let mut values = vec![F::zero(); num_rows * columns::NUM_COLS];

        let mut num_ops = 0;
        for (i, &coeff) in coefficients.iter().enumerate() {
            let row_offset = i * columns::NUM_COLS;
            
            // Get twiddle factor
            let omega = ZETAS[i % 256];
            
            // Compute Montgomery product
            let a = coeff;
            let b = coefficients.get(i + 1).copied().unwrap_or(0);
            
            // Compute butterfly
            let (sum, diff) = ntt_butterfly(a, b, omega);
            
            // Compute Montgomery quotient (simplified)
            let product = (a as u128) * (omega as u128);
            let m = ((product * 4236238847u128) & ((1u128 << 32) - 1)) as u64;
            
            // Fill trace row
            values[row_offset + columns::COL_A] = F::from_canonical_u64(a);
            values[row_offset + columns::COL_B] = F::from_canonical_u64(b);
            values[row_offset + columns::COL_OMEGA] = F::from_canonical_u64(omega);
            values[row_offset + columns::COL_M] = F::from_canonical_u64(m);
            values[row_offset + columns::COL_SUM] = F::from_canonical_u64(sum);
            values[row_offset + columns::COL_DIFF] = F::from_canonical_u64(diff);
            values[row_offset + columns::COL_NORM_VALID] = if check_norm_bound(coeff) {
                F::one()
            } else {
                F::zero()
            };
            values[row_offset + columns::COL_SELECTOR] = F::one();
            
            num_ops += 1;
        }

        // Pad remaining rows with zeros
        for i in coefficients.len()..num_rows {
            let row_offset = i * columns::NUM_COLS;
            values[row_offset + columns::COL_SELECTOR] = F::zero();
        }

        Self {
            matrix: RowMajorMatrix::new(values, columns::NUM_COLS),
            num_operations: num_ops,
        }
    }

    /// Generate simple trace for benchmarking
    pub fn generate_simple_trace(size: usize) -> RowMajorMatrix<F> {
        let num_rows = size.next_power_of_two();
        let mut values = vec![F::zero(); num_rows * simple_cols::NUM_COLS];

        for i in 0..size {
            let row_offset = i * simple_cols::NUM_COLS;
            let input = (i as u64 + 1) % Q;
            let twiddle = ZETAS[i % 256];
            let output = montgomery_multiply(input, twiddle);

            values[row_offset + simple_cols::COL_INPUT] = F::from_canonical_u64(input);
            values[row_offset + simple_cols::COL_OUTPUT] = F::from_canonical_u64(output);
            values[row_offset + simple_cols::COL_TWIDDLE] = F::from_canonical_u64(twiddle);
            values[row_offset + simple_cols::COL_IS_ACTIVE] = F::one();
        }

        // Pad with inactive rows
        for i in size..num_rows {
            let row_offset = i * simple_cols::NUM_COLS;
            values[row_offset + simple_cols::COL_IS_ACTIVE] = F::zero();
        }

        RowMajorMatrix::new(values, simple_cols::NUM_COLS)
    }
}

/// Generate random coefficients for testing
pub fn generate_random_coefficients(count: usize) -> Vec<u64> {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..count).map(|_| rng.gen::<u64>() % Q).collect()
}

/// Generate coefficients matching Dilithium polynomial (N=256)
pub fn generate_dilithium_polynomial() -> Vec<u64> {
    generate_random_coefficients(N)
}

#[cfg(test)]
mod tests {
    use super::*;
    use p3_baby_bear::BabyBear;

    type F = BabyBear;

    #[test]
    fn test_generate_simple_trace() {
        let trace = DilithiumTrace::<F>::generate_simple_trace(256);
        assert_eq!(trace.width(), simple_cols::NUM_COLS);
        assert!(trace.height() >= 256);
    }

    #[test]
    fn test_random_coefficients() {
        let coeffs = generate_random_coefficients(256);
        assert_eq!(coeffs.len(), 256);
        for c in coeffs {
            assert!(c < Q);
        }
    }

    #[test]
    fn test_ntt_trace_generation() {
        let coeffs = generate_random_coefficients(256);
        let trace = DilithiumTrace::<F>::generate_ntt_trace(&coeffs);
        assert_eq!(trace.matrix.width(), columns::NUM_COLS);
        assert_eq!(trace.num_operations, 256);
    }
}
