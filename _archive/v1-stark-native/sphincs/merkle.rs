//! Merkle Path Gate for SPHINCS+ STARK
//!
//! This module implements STARK constraints for verifying Merkle authentication paths.
//! The Merkle Path Gate proves that a leaf node hashes correctly to the root through
//! a sequence of sibling concatenations.
//!
//! # Overview
//!
//! In SPHINCS+, Merkle trees are used in:
//! - FORS (Forest of Random Subsets) for message compression
//! - Hypertree for WOTS+ public key aggregation
//!
//! # Constraint Logic
//!
//! For each level of the Merkle path:
//! 1. **Left/Right Selection**: Based on I_SELECT bit:
//!    - I_SELECT = 0: Hash(A || H_SIBL)
//!    - I_SELECT = 1: Hash(H_SIBL || A)
//! 2. **Hash Transition**: H_OUT_NEXT = Hash(concatenated input)
//!
//! # Trace Structure
//!
//! Each row represents one level of the Merkle path:
//! ```text
//! | H_IN[0..3] | H_OUT[0..3] | H_SIBL[0..3] | I_SELECT | S_MERKLE |
//! |------------|-------------|--------------|----------|----------|
//! | leaf       | hash(...)   | sibling_0    | 0        | 1        |
//! | prev_out   | hash(...)   | sibling_1    | 1        | 1        |
//! | ...        | ...         | ...          | ...      | 1        |
//! | prev_out   | root        | sibling_d    | 0        | 1        |
//! ```

use std::fmt;

use super::constants::MAX_MERKLE_DEPTH;

// ============================================================================
// Merkle Path Trace Row
// ============================================================================

/// A single row in the Merkle path verification trace
#[derive(Debug, Clone)]
pub struct MerklePathTraceRow {
    /// Current node hash (input to this level)
    /// Represented as 4 × 64-bit field elements for 256-bit hash
    pub h_in: [u64; 4],

    /// Output hash after concatenation and hashing
    pub h_out: [u64; 4],

    /// Sibling hash for this level
    pub h_sibl: [u64; 4],

    /// Left/right selector (0 = node is left child, 1 = node is right child)
    pub i_select: u64,

    /// Merkle path active selector (1 = active, 0 = inactive)
    pub s_merkle: u64,

    /// Level index in the Merkle tree (0 = leaf level)
    pub level: usize,
}

impl MerklePathTraceRow {
    /// Create a new Merkle path trace row
    pub fn new(
        h_in: [u64; 4],
        h_out: [u64; 4],
        h_sibl: [u64; 4],
        i_select: u64,
        level: usize,
    ) -> Self {
        assert!(i_select <= 1, "i_select must be 0 or 1");
        Self {
            h_in,
            h_out,
            h_sibl,
            i_select,
            s_merkle: 1,
            level,
        }
    }

    /// Create an inactive (padding) row
    pub fn padding() -> Self {
        Self {
            h_in: [0; 4],
            h_out: [0; 4],
            h_sibl: [0; 4],
            i_select: 0,
            s_merkle: 0,
            level: 0,
        }
    }

    /// Get the concatenated hash input based on i_select
    /// Returns (left_hash, right_hash)
    pub fn get_concatenation_order(&self) -> ([u64; 4], [u64; 4]) {
        if self.i_select == 0 {
            // Node is left child: Hash(node || sibling)
            (self.h_in, self.h_sibl)
        } else {
            // Node is right child: Hash(sibling || node)
            (self.h_sibl, self.h_in)
        }
    }
}

// ============================================================================
// Merkle Path Verification Result
// ============================================================================

/// Result of Merkle path constraint verification
#[derive(Debug, Clone)]
pub struct MerklePathVerificationResult {
    /// Whether the selector constraint is satisfied (i_select ∈ {0, 1})
    pub selector_valid: bool,

    /// Whether the s_merkle selector is binary
    pub s_merkle_binary: bool,

    /// Whether the concatenation order is correct
    pub concatenation_valid: bool,

    /// Whether hash transition is valid
    pub hash_transition_valid: bool,

    /// Overall validity
    pub is_valid: bool,

    /// Computed constraint values (for debugging)
    pub constraint_values: Vec<i128>,
}

impl MerklePathVerificationResult {
    /// Check if all constraints are satisfied
    pub fn all_satisfied(&self) -> bool {
        self.is_valid
    }
}

impl fmt::Display for MerklePathVerificationResult {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "Merkle Path Verification Result:")?;
        writeln!(f, "  Selector valid (i_select binary): {}", self.selector_valid)?;
        writeln!(f, "  S_merkle binary: {}", self.s_merkle_binary)?;
        writeln!(f, "  Concatenation order valid: {}", self.concatenation_valid)?;
        writeln!(f, "  Hash transition valid: {}", self.hash_transition_valid)?;
        writeln!(f, "  Overall valid: {}", self.is_valid)?;
        Ok(())
    }
}

// ============================================================================
// Merkle Path Constraint Verifier
// ============================================================================

/// Verifier for Merkle Path Gate constraints
pub struct MerklePathConstraintVerifier;

impl MerklePathConstraintVerifier {
    /// Verify constraints for a Merkle path trace row
    ///
    /// # Constraints
    ///
    /// 1. **I_SELECT binary**: i_select * (1 - i_select) = 0
    /// 2. **S_MERKLE binary**: s_merkle * (1 - s_merkle) = 0
    /// 3. **Concatenation constraint**: Enforced by hash input mapping
    /// 4. **Hash transition**: H_OUT_current = H_IN_next (for active rows)
    pub fn verify(current: &MerklePathTraceRow, next: Option<&MerklePathTraceRow>) -> MerklePathVerificationResult {
        let mut constraint_values = Vec::new();

        // Constraint 1: i_select ∈ {0, 1}
        let i_sel = current.i_select as i128;
        let selector_constraint = i_sel * (1 - i_sel);
        constraint_values.push(selector_constraint);
        let selector_valid = selector_constraint == 0;

        // Constraint 2: s_merkle ∈ {0, 1}
        let s_merkle = current.s_merkle as i128;
        let s_merkle_constraint = s_merkle * (1 - s_merkle);
        constraint_values.push(s_merkle_constraint);
        let s_merkle_binary = s_merkle_constraint == 0;

        // Constraint 3: Concatenation order check (always valid if selector is binary)
        let concatenation_valid = selector_valid;

        // Constraint 4: Hash transition (H_OUT_current = H_IN_next)
        // Only check if both rows are active and next exists
        let hash_transition_valid = if let Some(next_row) = next {
            if current.s_merkle == 1 && next_row.s_merkle == 1 {
                current.h_out == next_row.h_in
            } else {
                true // Skip check for inactive rows
            }
        } else {
            true // Last row, no next to check
        };

        let is_valid = selector_valid && s_merkle_binary && concatenation_valid && hash_transition_valid;

        MerklePathVerificationResult {
            selector_valid,
            s_merkle_binary,
            concatenation_valid,
            hash_transition_valid,
            is_valid,
            constraint_values,
        }
    }

    /// Verify an entire Merkle path
    pub fn verify_path(
        path: &[MerklePathTraceRow],
        expected_root: &[u64; 4],
    ) -> MerklePathVerificationResult {
        if path.is_empty() {
            return MerklePathVerificationResult {
                selector_valid: false,
                s_merkle_binary: false,
                concatenation_valid: false,
                hash_transition_valid: false,
                is_valid: false,
                constraint_values: vec![],
            };
        }

        let mut all_valid = true;
        let mut all_constraints = Vec::new();

        // Verify each row transition
        for i in 0..path.len() {
            let next = if i + 1 < path.len() {
                Some(&path[i + 1])
            } else {
                None
            };

            let result = Self::verify(&path[i], next);
            all_valid = all_valid && result.is_valid;
            all_constraints.extend(result.constraint_values);
        }

        // Verify root matches
        let last_row = path.last().unwrap();
        let root_matches = last_row.h_out == *expected_root;
        all_valid = all_valid && root_matches;

        MerklePathVerificationResult {
            selector_valid: all_valid,
            s_merkle_binary: all_valid,
            concatenation_valid: all_valid,
            hash_transition_valid: all_valid && root_matches,
            is_valid: all_valid,
            constraint_values: all_constraints,
        }
    }
}

// ============================================================================
// Merkle Path Trace Generation
// ============================================================================

/// Generate a trace row for one level of Merkle path verification
///
/// # Arguments
/// * `node_hash` - Current node hash (leaf or intermediate)
/// * `sibling_hash` - Sibling hash at this level
/// * `direction` - 0 if node is left child, 1 if right child
/// * `hash_fn` - Hash function to compute parent hash
/// * `level` - Level index in the tree
pub fn generate_merkle_trace_row<F>(
    node_hash: [u64; 4],
    sibling_hash: [u64; 4],
    direction: u64,
    hash_fn: F,
    level: usize,
) -> MerklePathTraceRow
where
    F: Fn(&[u64; 4], &[u64; 4]) -> [u64; 4],
{
    assert!(direction <= 1, "Direction must be 0 or 1");

    // Compute concatenation order
    let (left, right) = if direction == 0 {
        (node_hash, sibling_hash)
    } else {
        (sibling_hash, node_hash)
    };

    // Compute output hash
    let h_out = hash_fn(&left, &right);

    MerklePathTraceRow::new(node_hash, h_out, sibling_hash, direction, level)
}

/// Generate a complete Merkle path trace
///
/// # Arguments
/// * `leaf_hash` - Starting leaf hash
/// * `siblings` - Sibling hashes from leaf to root
/// * `path_bits` - Direction bits (0 = left, 1 = right) from leaf to root
/// * `hash_fn` - Hash function for computing parent nodes
pub fn generate_merkle_path_trace<F>(
    leaf_hash: [u64; 4],
    siblings: &[[u64; 4]],
    path_bits: &[u64],
    hash_fn: F,
) -> Vec<MerklePathTraceRow>
where
    F: Fn(&[u64; 4], &[u64; 4]) -> [u64; 4],
{
    assert_eq!(siblings.len(), path_bits.len(), "Siblings and path bits must have same length");
    assert!(siblings.len() <= MAX_MERKLE_DEPTH, "Path exceeds maximum depth");

    let mut trace = Vec::with_capacity(siblings.len());
    let mut current_hash = leaf_hash;

    for (level, (sibling, &direction)) in siblings.iter().zip(path_bits.iter()).enumerate() {
        let row = generate_merkle_trace_row(
            current_hash,
            *sibling,
            direction,
            &hash_fn,
            level,
        );
        current_hash = row.h_out;
        trace.push(row);
    }

    trace
}

/// Simple test hash function (XOR-based, NOT cryptographically secure)
/// Only for testing purposes
pub fn test_hash_fn(left: &[u64; 4], right: &[u64; 4]) -> [u64; 4] {
    [
        left[0].wrapping_add(right[0]).rotate_left(17) ^ right[0],
        left[1].wrapping_add(right[1]).rotate_left(23) ^ right[1],
        left[2].wrapping_add(right[2]).rotate_left(31) ^ right[2],
        left[3].wrapping_add(right[3]).rotate_left(47) ^ right[3],
    ]
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_trace_row_creation() {
        let h_in = [1, 2, 3, 4];
        let h_out = [5, 6, 7, 8];
        let h_sibl = [9, 10, 11, 12];

        let row = MerklePathTraceRow::new(h_in, h_out, h_sibl, 0, 0);
        assert_eq!(row.i_select, 0);
        assert_eq!(row.s_merkle, 1);
        assert_eq!(row.level, 0);

        let row_right = MerklePathTraceRow::new(h_in, h_out, h_sibl, 1, 1);
        assert_eq!(row_right.i_select, 1);
    }

    #[test]
    fn test_concatenation_order() {
        let h_in = [1, 2, 3, 4];
        let h_sibl = [5, 6, 7, 8];

        // i_select = 0: node is left child
        let row_left = MerklePathTraceRow::new(h_in, [0; 4], h_sibl, 0, 0);
        let (left, right) = row_left.get_concatenation_order();
        assert_eq!(left, h_in);
        assert_eq!(right, h_sibl);

        // i_select = 1: node is right child
        let row_right = MerklePathTraceRow::new(h_in, [0; 4], h_sibl, 1, 0);
        let (left, right) = row_right.get_concatenation_order();
        assert_eq!(left, h_sibl);
        assert_eq!(right, h_in);
    }

    #[test]
    fn test_constraint_verification() {
        let h_in = [1, 2, 3, 4];
        let h_out = [5, 6, 7, 8];
        let h_sibl = [9, 10, 11, 12];

        let row = MerklePathTraceRow::new(h_in, h_out, h_sibl, 0, 0);
        let result = MerklePathConstraintVerifier::verify(&row, None);

        assert!(result.selector_valid);
        assert!(result.s_merkle_binary);
        assert!(result.is_valid);
    }

    #[test]
    fn test_hash_transition() {
        let h1_in = [1, 2, 3, 4];
        let h1_out = [5, 6, 7, 8];
        let h1_sibl = [9, 10, 11, 12];

        let h2_in = [5, 6, 7, 8]; // Same as h1_out
        let h2_out = [13, 14, 15, 16];
        let h2_sibl = [17, 18, 19, 20];

        let row1 = MerklePathTraceRow::new(h1_in, h1_out, h1_sibl, 0, 0);
        let row2 = MerklePathTraceRow::new(h2_in, h2_out, h2_sibl, 1, 1);

        let result = MerklePathConstraintVerifier::verify(&row1, Some(&row2));
        assert!(result.hash_transition_valid);
        assert!(result.is_valid);
    }

    #[test]
    fn test_generate_merkle_trace_row() {
        let node = [1, 2, 3, 4];
        let sibling = [5, 6, 7, 8];

        let row = generate_merkle_trace_row(node, sibling, 0, test_hash_fn, 0);

        assert_eq!(row.h_in, node);
        assert_eq!(row.h_sibl, sibling);
        assert_eq!(row.i_select, 0);

        // Verify hash output is computed correctly
        let expected_out = test_hash_fn(&node, &sibling);
        assert_eq!(row.h_out, expected_out);
    }

    #[test]
    fn test_generate_merkle_path_trace() {
        let leaf = [1, 2, 3, 4];
        let siblings = [
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 16],
        ];
        let path_bits = [0, 1, 0]; // left, right, left

        let trace = generate_merkle_path_trace(leaf, &siblings, &path_bits, test_hash_fn);

        assert_eq!(trace.len(), 3);
        assert_eq!(trace[0].level, 0);
        assert_eq!(trace[1].level, 1);
        assert_eq!(trace[2].level, 2);

        // Verify chain: h_out[i] = h_in[i+1]
        assert_eq!(trace[0].h_out, trace[1].h_in);
        assert_eq!(trace[1].h_out, trace[2].h_in);

        // Verify path bits
        assert_eq!(trace[0].i_select, 0);
        assert_eq!(trace[1].i_select, 1);
        assert_eq!(trace[2].i_select, 0);
    }

    #[test]
    fn test_verify_complete_path() {
        let leaf = [1, 2, 3, 4];
        let siblings = [
            [5, 6, 7, 8],
            [9, 10, 11, 12],
        ];
        let path_bits = [0, 1];

        let trace = generate_merkle_path_trace(leaf, &siblings, &path_bits, test_hash_fn);

        // Get the computed root
        let computed_root = trace.last().unwrap().h_out;

        // Verify with correct root
        let result = MerklePathConstraintVerifier::verify_path(&trace, &computed_root);
        assert!(result.is_valid);

        // Verify with wrong root fails
        let wrong_root = [0, 0, 0, 0];
        let result_wrong = MerklePathConstraintVerifier::verify_path(&trace, &wrong_root);
        assert!(!result_wrong.is_valid);
    }

    #[test]
    fn test_padding_row() {
        let padding = MerklePathTraceRow::padding();
        assert_eq!(padding.s_merkle, 0);
        assert_eq!(padding.i_select, 0);
        assert_eq!(padding.h_in, [0; 4]);
    }

    #[test]
    fn test_deep_merkle_path() {
        // Test with 10-level deep tree
        let leaf = [42, 0, 0, 0];
        let mut siblings = Vec::new();
        let mut path_bits = Vec::new();

        for i in 0..10 {
            siblings.push([i as u64, i as u64 + 100, i as u64 + 200, i as u64 + 300]);
            path_bits.push(i as u64 % 2); // Alternating left/right
        }

        let trace = generate_merkle_path_trace(
            leaf,
            &siblings,
            &path_bits,
            test_hash_fn,
        );

        assert_eq!(trace.len(), 10);

        // Verify all transitions
        for i in 0..trace.len() - 1 {
            assert_eq!(trace[i].h_out, trace[i + 1].h_in);
        }

        // Verify with computed root
        let root = trace.last().unwrap().h_out;
        let result = MerklePathConstraintVerifier::verify_path(&trace, &root);
        assert!(result.is_valid);
    }
}
