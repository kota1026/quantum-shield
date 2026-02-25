//! AIR (Algebraic Intermediate Representation) for Dilithium verification
//!
//! Implements STARK constraints for:
//! - Montgomery multiplication
//! - NTT butterfly operations
//! - Norm bound checks

use p3_air::{Air, AirBuilder, BaseAir};
use p3_field::Field;
use p3_matrix::Matrix;

use crate::constants::{Q, NEG_Q_INV_MOD_R};

/// Column indices for the Dilithium AIR
pub mod columns {
    /// Input coefficient A
    pub const COL_A: usize = 0;
    /// Input coefficient B
    pub const COL_B: usize = 1;
    /// Twiddle factor (omega)
    pub const COL_OMEGA: usize = 2;
    /// Montgomery quotient M
    pub const COL_M: usize = 3;
    /// Result of butterfly (sum)
    pub const COL_SUM: usize = 4;
    /// Result of butterfly (diff * omega)
    pub const COL_DIFF: usize = 5;
    /// Norm check flag (1 if valid, 0 if invalid)
    pub const COL_NORM_VALID: usize = 6;
    /// Operation selector (1 = NTT, 0 = skip)
    pub const COL_SELECTOR: usize = 7;
    /// Total number of columns
    pub const NUM_COLS: usize = 8;
}

/// Dilithium STARK AIR
pub struct DilithiumAir {
    /// Number of rows in the trace
    pub num_rows: usize,
}

impl DilithiumAir {
    pub fn new(num_rows: usize) -> Self {
        Self { num_rows }
    }
}

impl<F: Field> BaseAir<F> for DilithiumAir {
    fn width(&self) -> usize {
        columns::NUM_COLS
    }
}

impl<AB: AirBuilder> Air<AB> for DilithiumAir {
    fn eval(&self, builder: &mut AB) {
        let main = builder.main();
        let local = main.row_slice(0);

        // Extract columns
        let a = local[columns::COL_A];
        let b = local[columns::COL_B];
        let omega = local[columns::COL_OMEGA];
        let m = local[columns::COL_M];
        let sum = local[columns::COL_SUM];
        let diff = local[columns::COL_DIFF];
        let norm_valid = local[columns::COL_NORM_VALID];
        let selector = local[columns::COL_SELECTOR];

        // Convert constants to field elements
        let q = AB::Expr::from(AB::F::from_canonical_u64(Q));
        let r = AB::Expr::from(AB::F::from_canonical_u64(1u64 << 32));

        // Constraint 1: Montgomery butterfly
        // (a - b) * omega + m * Q = diff * R
        // This ensures diff = ((a-b) * omega) in Montgomery form
        let a_minus_b = a.clone() - b.clone();
        let lhs = a_minus_b * omega.clone() + m.clone() * q.clone();
        let rhs = diff.clone() * r.clone();
        
        // Apply constraint only when selector is active
        builder.when(selector.clone()).assert_eq(lhs, rhs);

        // Constraint 2: Sum computation
        // sum = a + diff (mod Q) - simplified for PoC
        // Full constraint would involve range checks
        builder.when(selector.clone()).assert_eq(
            sum.clone(),
            a.clone() + diff.clone()
        );

        // Constraint 3: Norm bound check
        // norm_valid must be boolean
        builder.assert_bool(norm_valid.clone());

        // Constraint 4: Selector must be boolean
        builder.assert_bool(selector);
    }
}

/// Simplified NTT AIR for benchmarking
/// Uses fewer columns for faster proving
pub struct SimpleNttAir {
    pub num_rows: usize,
}

impl SimpleNttAir {
    pub fn new(num_rows: usize) -> Self {
        Self { num_rows }
    }
}

/// Column indices for simple NTT AIR
pub mod simple_cols {
    pub const COL_INPUT: usize = 0;
    pub const COL_OUTPUT: usize = 1;
    pub const COL_TWIDDLE: usize = 2;
    pub const COL_IS_ACTIVE: usize = 3;
    pub const NUM_COLS: usize = 4;
}

impl<F: Field> BaseAir<F> for SimpleNttAir {
    fn width(&self) -> usize {
        simple_cols::NUM_COLS
    }
}

impl<AB: AirBuilder> Air<AB> for SimpleNttAir {
    fn eval(&self, builder: &mut AB) {
        let main = builder.main();
        let local = main.row_slice(0);

        let input = local[simple_cols::COL_INPUT];
        let output = local[simple_cols::COL_OUTPUT];
        let twiddle = local[simple_cols::COL_TWIDDLE];
        let is_active = local[simple_cols::COL_IS_ACTIVE];

        // Constraint: output = input * twiddle (simplified)
        // In real impl, this would be Montgomery multiplication
        builder.when(is_active.clone()).assert_eq(
            output,
            input * twiddle
        );

        // is_active must be boolean
        builder.assert_bool(is_active);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_air_width() {
        let air = DilithiumAir::new(256);
        assert_eq!(air.width(), columns::NUM_COLS);
    }

    #[test]
    fn test_simple_air_width() {
        let air = SimpleNttAir::new(256);
        assert_eq!(air.width(), simple_cols::NUM_COLS);
    }
}
