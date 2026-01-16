//! SPHINCS+ Trace Generation
//!
//! This module implements trace generation for SPHINCS+ STARK proofs.
//! The trace combines Merkle path verification and hash chain computation.
//!
//! # Trace Layout
//!
//! The trace is organized as:
//! 1. Hash chain rows (WOTS+ chain computation)
//! 2. Merkle path rows (authentication path verification)
//! 3. FORS tree rows (message compression)
//!
//! # Example Trace (simplified)
//!
//! ```text
//! Row | H_IN | H_OUT | H_SIBL | C_COUNT | S_CHAIN | S_MERKLE | I_SELECT |
//! ----|------|-------|--------|---------|---------|----------|----------|
//! 0   | seed | hash0 | 0      | 0       | 1       | 0        | 0        |
//! 1   | hash0| hash1 | 0      | 1       | 1       | 0        | 0        |
//! ... | ...  | ...   | ...    | ...     | 1       | 0        | 0        |
//! n   | node | parent| sibl0  | 0       | 0       | 1        | 0        |
//! n+1 | parent| root | sibl1  | 0       | 0       | 1        | 1        |
//! ```

use winterfell::math::fields::f128::BaseElement;
use winterfell::math::FieldElement;
use winterfell::matrix::ColMatrix;

use super::constants::{sphincs_columns, TRACE_WIDTH_SPHINCS};
use super::merkle::{MerklePathTraceRow, generate_merkle_path_trace, test_hash_fn};
use super::hash_chain::{HashChainTraceRow, generate_hash_chain_trace, test_chain_hash_fn};

// ============================================================================
// Unified Trace Row
// ============================================================================

/// A unified trace row that can represent either a Merkle path step or hash chain step
#[derive(Debug, Clone)]
pub struct SphincsTraceRow {
    /// Hash input (4 × 64-bit)
    pub h_in: [u64; 4],
    /// Hash output (4 × 64-bit)
    pub h_out: [u64; 4],
    /// Sibling hash for Merkle (4 × 64-bit)
    pub h_sibl: [u64; 4],
    /// Counter for hash chain
    pub c_count: u64,
    /// Merkle active selector
    pub s_merkle: u64,
    /// Chain active selector
    pub s_chain: u64,
    /// Left/right selector for Merkle
    pub i_select: u64,
    /// General operation selector
    pub s_op: u64,
}

impl SphincsTraceRow {
    /// Create a row from a Merkle path trace row
    pub fn from_merkle(merkle_row: &MerklePathTraceRow) -> Self {
        Self {
            h_in: merkle_row.h_in,
            h_out: merkle_row.h_out,
            h_sibl: merkle_row.h_sibl,
            c_count: 0,
            s_merkle: merkle_row.s_merkle,
            s_chain: 0,
            i_select: merkle_row.i_select,
            s_op: 1,
        }
    }

    /// Create a row from a hash chain trace row
    pub fn from_chain(chain_row: &HashChainTraceRow) -> Self {
        Self {
            h_in: chain_row.h_prev,
            h_out: chain_row.h_next,
            h_sibl: [0; 4], // Not used in chain mode
            c_count: chain_row.c_count,
            s_merkle: 0,
            s_chain: chain_row.s_chain,
            i_select: 0,
            s_op: 1,
        }
    }

    /// Create a padding row
    pub fn padding() -> Self {
        Self {
            h_in: [0; 4],
            h_out: [0; 4],
            h_sibl: [0; 4],
            c_count: 0,
            s_merkle: 0,
            s_chain: 0,
            i_select: 0,
            s_op: 0,
        }
    }
}

// ============================================================================
// Trace Builder
// ============================================================================

/// Builder for SPHINCS+ execution traces
pub struct SphincsTraceBuilder {
    rows: Vec<SphincsTraceRow>,
}

impl SphincsTraceBuilder {
    /// Create a new trace builder
    pub fn new() -> Self {
        Self { rows: Vec::new() }
    }

    /// Add hash chain rows to the trace
    pub fn add_hash_chain(&mut self, chain_rows: &[HashChainTraceRow]) {
        for row in chain_rows {
            self.rows.push(SphincsTraceRow::from_chain(row));
        }
    }

    /// Add Merkle path rows to the trace
    pub fn add_merkle_path(&mut self, merkle_rows: &[MerklePathTraceRow]) {
        for row in merkle_rows {
            self.rows.push(SphincsTraceRow::from_merkle(row));
        }
    }

    /// Add a single unified row
    pub fn add_row(&mut self, row: SphincsTraceRow) {
        self.rows.push(row);
    }

    /// Pad the trace to a power of 2 length
    pub fn pad_to_power_of_two(&mut self) {
        let current_len = self.rows.len();
        if current_len == 0 {
            return;
        }

        let next_power = current_len.next_power_of_two();
        let padding_needed = next_power - current_len;

        // Get the last row's h_out for continuity
        let last_h_out = self.rows.last().map(|r| r.h_out).unwrap_or([0; 4]);

        for _ in 0..padding_needed {
            let mut padding = SphincsTraceRow::padding();
            // Set h_in to maintain transition constraint validity
            padding.h_in = last_h_out;
            padding.h_out = last_h_out;
            self.rows.push(padding);
        }
    }

    /// Build the trace as a ColMatrix
    pub fn build(&self) -> ColMatrix<BaseElement> {
        let num_rows = self.rows.len();
        let mut columns: Vec<Vec<BaseElement>> = vec![vec![BaseElement::ZERO; num_rows]; TRACE_WIDTH_SPHINCS];

        for (row_idx, row) in self.rows.iter().enumerate() {
            // H_IN columns (0-3)
            columns[sphincs_columns::H_IN_0][row_idx] = BaseElement::from(row.h_in[0]);
            columns[sphincs_columns::H_IN_1][row_idx] = BaseElement::from(row.h_in[1]);
            columns[sphincs_columns::H_IN_2][row_idx] = BaseElement::from(row.h_in[2]);
            columns[sphincs_columns::H_IN_3][row_idx] = BaseElement::from(row.h_in[3]);

            // H_OUT columns (4-7)
            columns[sphincs_columns::H_OUT_0][row_idx] = BaseElement::from(row.h_out[0]);
            columns[sphincs_columns::H_OUT_1][row_idx] = BaseElement::from(row.h_out[1]);
            columns[sphincs_columns::H_OUT_2][row_idx] = BaseElement::from(row.h_out[2]);
            columns[sphincs_columns::H_OUT_3][row_idx] = BaseElement::from(row.h_out[3]);

            // H_SIBL columns (8-11)
            columns[sphincs_columns::H_SIBL_0][row_idx] = BaseElement::from(row.h_sibl[0]);
            columns[sphincs_columns::H_SIBL_1][row_idx] = BaseElement::from(row.h_sibl[1]);
            columns[sphincs_columns::H_SIBL_2][row_idx] = BaseElement::from(row.h_sibl[2]);
            columns[sphincs_columns::H_SIBL_3][row_idx] = BaseElement::from(row.h_sibl[3]);

            // Counter and selectors
            columns[sphincs_columns::C_COUNT][row_idx] = BaseElement::from(row.c_count);
            columns[sphincs_columns::S_MERKLE][row_idx] = BaseElement::from(row.s_merkle);
            columns[sphincs_columns::S_CHAIN][row_idx] = BaseElement::from(row.s_chain);
            columns[sphincs_columns::I_SELECT][row_idx] = BaseElement::from(row.i_select);
            columns[sphincs_columns::S_OP][row_idx] = BaseElement::from(row.s_op);
        }

        ColMatrix::new(columns)
    }

    /// Get the number of rows
    pub fn len(&self) -> usize {
        self.rows.len()
    }

    /// Check if empty
    pub fn is_empty(&self) -> bool {
        self.rows.is_empty()
    }
}

impl Default for SphincsTraceBuilder {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Trace Generation Functions
// ============================================================================

/// Generate a test trace for SPHINCS+ with hash chains and Merkle paths
pub fn build_sphincs_test_trace() -> ColMatrix<BaseElement> {
    let mut builder = SphincsTraceBuilder::new();

    // 1. Generate hash chain (simulating WOTS+ chain)
    let seed = [0x12345678u64, 0, 0, 0];
    let chain_length = 15; // w - 1 for WOTS+
    let address = [0, 0];

    let chain_trace = generate_hash_chain_trace(
        seed,
        chain_length,
        0, // chain_id
        address,
        test_chain_hash_fn,
    );
    builder.add_hash_chain(&chain_trace);

    // 2. Generate Merkle path (simulating tree verification)
    let leaf_hash = chain_trace.last().unwrap().h_next;
    let siblings = [
        [0xAAAAu64, 0xBBBB, 0xCCCC, 0xDDDD],
        [0x1111u64, 0x2222, 0x3333, 0x4444],
        [0x5555u64, 0x6666, 0x7777, 0x8888],
        [0x9999u64, 0xAAAA, 0xBBBB, 0xCCCC],
    ];
    let path_bits = [0, 1, 0, 1];

    let merkle_trace = generate_merkle_path_trace(
        leaf_hash,
        &siblings,
        &path_bits,
        test_hash_fn,
    );
    builder.add_merkle_path(&merkle_trace);

    // 3. Pad to power of 2
    builder.pad_to_power_of_two();

    builder.build()
}

/// Generate a more comprehensive trace with multiple WOTS+ chains
pub fn build_sphincs_wots_trace(
    seeds: &[[u64; 4]],
    chain_lengths: &[usize],
) -> ColMatrix<BaseElement> {
    let mut builder = SphincsTraceBuilder::new();

    // Generate all WOTS+ chains
    for (chain_id, (seed, &length)) in seeds.iter().zip(chain_lengths.iter()).enumerate() {
        let address = [0, chain_id as u64];
        let chain_trace = generate_hash_chain_trace(
            *seed,
            length,
            chain_id as u64,
            address,
            test_chain_hash_fn,
        );
        builder.add_hash_chain(&chain_trace);
    }

    builder.pad_to_power_of_two();
    builder.build()
}

/// Generate a trace with Merkle tree verification only
pub fn build_sphincs_merkle_trace(
    leaf: [u64; 4],
    siblings: &[[u64; 4]],
    path_bits: &[u64],
) -> ColMatrix<BaseElement> {
    let mut builder = SphincsTraceBuilder::new();

    let merkle_trace = generate_merkle_path_trace(
        leaf,
        siblings,
        path_bits,
        test_hash_fn,
    );
    builder.add_merkle_path(&merkle_trace);

    builder.pad_to_power_of_two();
    builder.build()
}

/// Generate a full SPHINCS+ signature verification trace
/// This combines FORS, WOTS+, and Merkle tree operations
pub fn build_sphincs_full_trace(
    message_hash: [u64; 4],
    fors_depth: usize,
    wots_chains: usize,
    wots_chain_length: usize,
    hypertree_depth: usize,
) -> ColMatrix<BaseElement> {
    let mut builder = SphincsTraceBuilder::new();

    // 1. FORS tree (simplified - just one path for demo)
    let fors_leaf = message_hash;
    let fors_siblings: Vec<[u64; 4]> = (0..fors_depth)
        .map(|i| [i as u64 + 1000, i as u64 + 2000, i as u64 + 3000, i as u64 + 4000])
        .collect();
    let fors_path_bits: Vec<u64> = (0..fors_depth)
        .map(|i| (i % 2) as u64)
        .collect();

    let fors_trace = generate_merkle_path_trace(
        fors_leaf,
        &fors_siblings,
        &fors_path_bits,
        test_hash_fn,
    );
    builder.add_merkle_path(&fors_trace);

    // Get FORS root as input to WOTS+
    let fors_root = if !fors_trace.is_empty() {
        fors_trace.last().unwrap().h_out
    } else {
        message_hash
    };

    // 2. WOTS+ chains
    for chain_id in 0..wots_chains {
        let seed = [
            fors_root[0].wrapping_add(chain_id as u64),
            fors_root[1],
            fors_root[2],
            fors_root[3],
        ];
        let address = [1, chain_id as u64];

        let chain_trace = generate_hash_chain_trace(
            seed,
            wots_chain_length,
            chain_id as u64,
            address,
            test_chain_hash_fn,
        );
        builder.add_hash_chain(&chain_trace);
    }

    // 3. Hypertree (Merkle path from WOTS+ public key to root)
    // Use a simplified representation
    let wots_pk_hash = [0xDEAD_u64.wrapping_add(1), 0, 0, 0]; // Placeholder
    let hypertree_siblings: Vec<[u64; 4]> = (0..hypertree_depth)
        .map(|i| [i as u64 + 5000, i as u64 + 6000, i as u64 + 7000, i as u64 + 8000])
        .collect();
    let hypertree_path_bits: Vec<u64> = (0..hypertree_depth)
        .map(|i| ((i + 1) % 2) as u64)
        .collect();

    let hypertree_trace = generate_merkle_path_trace(
        wots_pk_hash,
        &hypertree_siblings,
        &hypertree_path_bits,
        test_hash_fn,
    );
    builder.add_merkle_path(&hypertree_trace);

    builder.pad_to_power_of_two();
    builder.build()
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sphincs_trace_row_from_merkle() {
        let merkle_row = MerklePathTraceRow::new(
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            0,
            0,
        );

        let trace_row = SphincsTraceRow::from_merkle(&merkle_row);
        assert_eq!(trace_row.s_merkle, 1);
        assert_eq!(trace_row.s_chain, 0);
        assert_eq!(trace_row.h_in, [1, 2, 3, 4]);
    }

    #[test]
    fn test_sphincs_trace_row_from_chain() {
        let chain_row = HashChainTraceRow::new(
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            5,
            0,
            [0, 0],
        );

        let trace_row = SphincsTraceRow::from_chain(&chain_row);
        assert_eq!(trace_row.s_merkle, 0);
        assert_eq!(trace_row.s_chain, 1);
        assert_eq!(trace_row.c_count, 5);
    }

    #[test]
    fn test_trace_builder_basic() {
        let mut builder = SphincsTraceBuilder::new();

        // Add a chain row
        let chain_row = HashChainTraceRow::new(
            [1, 0, 0, 0],
            [2, 0, 0, 0],
            0,
            0,
            [0, 0],
        );
        builder.add_hash_chain(&[chain_row]);

        assert_eq!(builder.len(), 1);
    }

    #[test]
    fn test_trace_builder_padding() {
        let mut builder = SphincsTraceBuilder::new();

        // Add 5 rows
        for i in 0..5 {
            let row = SphincsTraceRow {
                h_in: [i as u64, 0, 0, 0],
                h_out: [(i + 1) as u64, 0, 0, 0],
                h_sibl: [0; 4],
                c_count: i as u64,
                s_merkle: 0,
                s_chain: 1,
                i_select: 0,
                s_op: 1,
            };
            builder.add_row(row);
        }

        builder.pad_to_power_of_two();

        // Should be padded to 8 (next power of 2)
        assert_eq!(builder.len(), 8);
    }

    #[test]
    fn test_build_sphincs_test_trace() {
        let trace = build_sphincs_test_trace();

        // Should be power of 2
        let num_rows = trace.num_rows();
        assert!(num_rows.is_power_of_two());

        // Should have correct width
        assert_eq!(trace.num_cols(), TRACE_WIDTH_SPHINCS);
    }

    #[test]
    fn test_build_sphincs_wots_trace() {
        let seeds = [
            [1, 0, 0, 0],
            [2, 0, 0, 0],
            [3, 0, 0, 0],
        ];
        let chain_lengths = [5, 10, 7];

        let trace = build_sphincs_wots_trace(&seeds, &chain_lengths);

        assert!(trace.num_rows().is_power_of_two());
        assert_eq!(trace.num_cols(), TRACE_WIDTH_SPHINCS);
    }

    #[test]
    fn test_build_sphincs_merkle_trace() {
        let leaf = [42, 0, 0, 0];
        let siblings = [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
        ];
        let path_bits = [0, 1, 0];

        let trace = build_sphincs_merkle_trace(leaf, &siblings, &path_bits);

        assert!(trace.num_rows().is_power_of_two());
        assert_eq!(trace.num_cols(), TRACE_WIDTH_SPHINCS);

        // Check that Merkle rows have s_merkle = 1
        assert_eq!(trace.get(sphincs_columns::S_MERKLE, 0), BaseElement::ONE);
    }

    #[test]
    fn test_build_sphincs_full_trace() {
        let message_hash = [0xDEADBEEF, 0xCAFEBABE, 0, 0];
        let fors_depth = 4;
        let wots_chains = 3;
        let wots_chain_length = 5;
        let hypertree_depth = 3;

        let trace = build_sphincs_full_trace(
            message_hash,
            fors_depth,
            wots_chains,
            wots_chain_length,
            hypertree_depth,
        );

        assert!(trace.num_rows().is_power_of_two());
        assert_eq!(trace.num_cols(), TRACE_WIDTH_SPHINCS);

        // Verify first row has message hash
        assert_eq!(trace.get(sphincs_columns::H_IN_0, 0), BaseElement::from(message_hash[0]));
    }

    #[test]
    fn test_trace_column_values() {
        let trace = build_sphincs_test_trace();

        // Check that selectors are binary (0 or 1)
        for row in 0..trace.num_rows() {
            let s_merkle = trace.get(sphincs_columns::S_MERKLE, row);
            let s_chain = trace.get(sphincs_columns::S_CHAIN, row);

            assert!(
                s_merkle == BaseElement::ZERO || s_merkle == BaseElement::ONE,
                "S_MERKLE not binary at row {}", row
            );
            assert!(
                s_chain == BaseElement::ZERO || s_chain == BaseElement::ONE,
                "S_CHAIN not binary at row {}", row
            );

            // Verify exclusive selector (at most one active)
            assert!(
                s_merkle == BaseElement::ZERO || s_chain == BaseElement::ZERO,
                "Both S_MERKLE and S_CHAIN active at row {}", row
            );
        }
    }

    #[test]
    fn test_chain_continuity_in_trace() {
        let seed = [100, 200, 300, 400];
        let chain_length = 10;

        let chain_trace = generate_hash_chain_trace(
            seed,
            chain_length,
            0,
            [0, 0],
            test_chain_hash_fn,
        );

        let mut builder = SphincsTraceBuilder::new();
        builder.add_hash_chain(&chain_trace);
        builder.pad_to_power_of_two();
        let trace = builder.build();

        // Verify chain continuity: h_out[i] = h_in[i+1] for chain rows
        for i in 0..chain_length - 1 {
            let h_out_0 = trace.get(sphincs_columns::H_OUT_0, i);
            let h_in_next_0 = trace.get(sphincs_columns::H_IN_0, i + 1);

            assert_eq!(h_out_0, h_in_next_0, "Chain continuity broken at row {}", i);
        }
    }
}
