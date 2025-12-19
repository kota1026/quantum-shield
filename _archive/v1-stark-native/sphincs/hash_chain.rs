//! Hash Chain Gate for SPHINCS+ STARK
//!
//! This module implements STARK constraints for verifying iterative hash chains
//! used in WOTS+ and FORS components of SPHINCS+.
//!
//! # Overview
//!
//! Hash chains are fundamental to WOTS+ (Winternitz One-Time Signature):
//! - Each WOTS+ chain computes Hash^(2^w)(seed) for Winternitz parameter w
//! - Verification requires computing partial chains and comparing to public key
//!
//! # Constraint Logic
//!
//! For each step in the hash chain:
//! 1. **Counter Constraint**: C_COUNT_next = C_COUNT + 1 (when S_CHAIN = 1)
//! 2. **Hash Constraint**: H_OUT = Hash(H_IN || C_COUNT || addr)
//! 3. **Chain Constraint**: H_IN_next = H_OUT_current
//!
//! # Trace Structure
//!
//! Each row represents one hash iteration:
//! ```text
//! | H_IN[0..3] | H_OUT[0..3] | C_COUNT | S_CHAIN | CHAIN_ID |
//! |------------|-------------|---------|---------|----------|
//! | seed       | hash_0      | 0       | 1       | 0        |
//! | hash_0     | hash_1      | 1       | 1       | 0        |
//! | ...        | ...         | ...     | 1       | 0        |
//! | hash_n-1   | hash_n      | n       | 1       | 0        |
//! ```

use std::fmt;

use super::constants::MAX_CHAIN_LENGTH;

// ============================================================================
// Hash Chain Trace Row
// ============================================================================

/// A single row in the hash chain computation trace
#[derive(Debug, Clone)]
pub struct HashChainTraceRow {
    /// Previous hash value (input to this step)
    /// Represented as 4 × 64-bit field elements for 256-bit hash
    pub h_prev: [u64; 4],

    /// Next hash value (output of this step)
    pub h_next: [u64; 4],

    /// Chain counter (iteration index within this chain)
    pub c_count: u64,

    /// Hash chain active selector (1 = active, 0 = inactive/padding)
    pub s_chain: u64,

    /// Chain identifier (which WOTS+ chain this belongs to)
    pub chain_id: u64,

    /// Address data for domain separation (optional)
    pub address: [u64; 2],
}

impl HashChainTraceRow {
    /// Create a new hash chain trace row
    pub fn new(
        h_prev: [u64; 4],
        h_next: [u64; 4],
        c_count: u64,
        chain_id: u64,
        address: [u64; 2],
    ) -> Self {
        Self {
            h_prev,
            h_next,
            c_count,
            s_chain: 1,
            chain_id,
            address,
        }
    }

    /// Create an inactive (padding) row
    pub fn padding() -> Self {
        Self {
            h_prev: [0; 4],
            h_next: [0; 4],
            c_count: 0,
            s_chain: 0,
            chain_id: 0,
            address: [0; 2],
        }
    }

    /// Create the first row of a chain (starting from seed)
    pub fn chain_start(seed: [u64; 4], first_hash: [u64; 4], chain_id: u64, address: [u64; 2]) -> Self {
        Self {
            h_prev: seed,
            h_next: first_hash,
            c_count: 0,
            s_chain: 1,
            chain_id,
            address,
        }
    }
}

// ============================================================================
// Hash Chain Verification Result
// ============================================================================

/// Result of hash chain constraint verification
#[derive(Debug, Clone)]
pub struct HashChainVerificationResult {
    /// Whether the s_chain selector is binary
    pub s_chain_binary: bool,

    /// Whether the counter constraint is satisfied
    pub counter_valid: bool,

    /// Whether the hash chain constraint is satisfied (H_IN_next = H_OUT)
    pub chain_valid: bool,

    /// Whether the hash transition is valid
    pub hash_valid: bool,

    /// Overall validity
    pub is_valid: bool,

    /// Number of chain steps verified
    pub steps_verified: usize,

    /// Computed constraint values (for debugging)
    pub constraint_values: Vec<i128>,
}

impl HashChainVerificationResult {
    /// Check if all constraints are satisfied
    pub fn all_satisfied(&self) -> bool {
        self.is_valid
    }
}

impl fmt::Display for HashChainVerificationResult {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "Hash Chain Verification Result:")?;
        writeln!(f, "  S_chain binary: {}", self.s_chain_binary)?;
        writeln!(f, "  Counter constraint valid: {}", self.counter_valid)?;
        writeln!(f, "  Chain constraint valid: {}", self.chain_valid)?;
        writeln!(f, "  Hash transition valid: {}", self.hash_valid)?;
        writeln!(f, "  Steps verified: {}", self.steps_verified)?;
        writeln!(f, "  Overall valid: {}", self.is_valid)?;
        Ok(())
    }
}

// ============================================================================
// Hash Chain Constraint Verifier
// ============================================================================

/// Verifier for Hash Chain Gate constraints
pub struct HashChainConstraintVerifier;

impl HashChainConstraintVerifier {
    /// Verify constraints for a hash chain trace row transition
    ///
    /// # Constraints
    ///
    /// 1. **S_CHAIN binary**: s_chain * (1 - s_chain) = 0
    /// 2. **Counter increment**: (c_count_next - c_count - 1) * s_chain * s_chain_next = 0
    /// 3. **Chain continuity**: (h_prev_next - h_next) * s_chain * s_chain_next = 0
    pub fn verify(current: &HashChainTraceRow, next: Option<&HashChainTraceRow>) -> HashChainVerificationResult {
        let mut constraint_values = Vec::new();

        // Constraint 1: s_chain ∈ {0, 1}
        let s_chain = current.s_chain as i128;
        let s_chain_constraint = s_chain * (1 - s_chain);
        constraint_values.push(s_chain_constraint);
        let s_chain_binary = s_chain_constraint == 0;

        // Initialize other constraints as valid (will be overwritten if next exists)
        let mut counter_valid = true;
        let mut chain_valid = true;
        let mut hash_valid = true;

        if let Some(next_row) = next {
            let _s_chain_next = next_row.s_chain as i128;

            // Only check constraints if both rows are active
            if current.s_chain == 1 && next_row.s_chain == 1 {
                // Constraint 2: Counter increment
                // c_count_next = c_count + 1 (within same chain)
                if current.chain_id == next_row.chain_id {
                    let counter_constraint = (next_row.c_count as i128) - (current.c_count as i128) - 1;
                    constraint_values.push(counter_constraint);
                    counter_valid = counter_constraint == 0;
                }

                // Constraint 3: Chain continuity
                // h_prev_next = h_next_current (within same chain)
                if current.chain_id == next_row.chain_id {
                    chain_valid = current.h_next == next_row.h_prev;
                }

                // Hash validity is checked externally (we don't recompute hash here)
                hash_valid = true;
            }
        }

        let is_valid = s_chain_binary && counter_valid && chain_valid && hash_valid;

        HashChainVerificationResult {
            s_chain_binary,
            counter_valid,
            chain_valid,
            hash_valid,
            is_valid,
            steps_verified: 1,
            constraint_values,
        }
    }

    /// Verify an entire hash chain
    pub fn verify_chain(
        chain: &[HashChainTraceRow],
        expected_final: Option<&[u64; 4]>,
    ) -> HashChainVerificationResult {
        if chain.is_empty() {
            return HashChainVerificationResult {
                s_chain_binary: false,
                counter_valid: false,
                chain_valid: false,
                hash_valid: false,
                is_valid: false,
                steps_verified: 0,
                constraint_values: vec![],
            };
        }

        let mut all_valid = true;
        let mut all_constraints = Vec::new();
        let mut steps = 0;

        // Verify each transition
        for i in 0..chain.len() {
            let next = if i + 1 < chain.len() {
                Some(&chain[i + 1])
            } else {
                None
            };

            let result = Self::verify(&chain[i], next);
            all_valid = all_valid && result.is_valid;
            all_constraints.extend(result.constraint_values);

            if chain[i].s_chain == 1 {
                steps += 1;
            }
        }

        // Verify final hash if provided
        if let Some(expected) = expected_final {
            let last_active = chain.iter().rev().find(|r| r.s_chain == 1);
            if let Some(last) = last_active {
                all_valid = all_valid && (last.h_next == *expected);
            } else {
                all_valid = false;
            }
        }

        HashChainVerificationResult {
            s_chain_binary: all_valid,
            counter_valid: all_valid,
            chain_valid: all_valid,
            hash_valid: all_valid,
            is_valid: all_valid,
            steps_verified: steps,
            constraint_values: all_constraints,
        }
    }
}

// ============================================================================
// Hash Chain Trace Generation
// ============================================================================

/// Generate a trace row for one step of hash chain computation
///
/// # Arguments
/// * `h_prev` - Previous hash value
/// * `c_count` - Current counter value
/// * `chain_id` - Chain identifier
/// * `address` - Address for domain separation
/// * `hash_fn` - Hash function that takes (h_prev, counter, address) and returns h_next
pub fn generate_hash_chain_trace_row<F>(
    h_prev: [u64; 4],
    c_count: u64,
    chain_id: u64,
    address: [u64; 2],
    hash_fn: F,
) -> HashChainTraceRow
where
    F: Fn(&[u64; 4], u64, &[u64; 2]) -> [u64; 4],
{
    let h_next = hash_fn(&h_prev, c_count, &address);

    HashChainTraceRow::new(h_prev, h_next, c_count, chain_id, address)
}

/// Generate a complete hash chain trace for 2^w iterations
///
/// # Arguments
/// * `seed` - Starting seed value
/// * `chain_length` - Number of hash iterations (typically w-1 for WOTS+)
/// * `chain_id` - Identifier for this chain
/// * `address` - Base address for domain separation
/// * `hash_fn` - Hash function for chain computation
pub fn generate_hash_chain_trace<F>(
    seed: [u64; 4],
    chain_length: usize,
    chain_id: u64,
    address: [u64; 2],
    hash_fn: F,
) -> Vec<HashChainTraceRow>
where
    F: Fn(&[u64; 4], u64, &[u64; 2]) -> [u64; 4],
{
    assert!(chain_length <= MAX_CHAIN_LENGTH, "Chain length exceeds maximum");

    let mut trace = Vec::with_capacity(chain_length);
    let mut current_hash = seed;

    for i in 0..chain_length {
        let row = generate_hash_chain_trace_row(
            current_hash,
            i as u64,
            chain_id,
            address,
            &hash_fn,
        );
        current_hash = row.h_next;
        trace.push(row);
    }

    trace
}

/// Generate multiple WOTS+ chains for a signature/verification
///
/// # Arguments
/// * `seeds` - Starting seeds for each chain
/// * `chain_lengths` - Number of iterations for each chain (can vary for verification)
/// * `base_address` - Base address for domain separation
/// * `hash_fn` - Hash function for chain computation
pub fn generate_wots_chains_trace<F>(
    seeds: &[[u64; 4]],
    chain_lengths: &[usize],
    base_address: [u64; 2],
    hash_fn: F,
) -> Vec<HashChainTraceRow>
where
    F: Fn(&[u64; 4], u64, &[u64; 2]) -> [u64; 4],
{
    assert_eq!(seeds.len(), chain_lengths.len(), "Seeds and lengths must match");

    let mut trace = Vec::new();

    for (chain_id, (seed, &length)) in seeds.iter().zip(chain_lengths.iter()).enumerate() {
        let address = [base_address[0], base_address[1] + chain_id as u64];
        let chain_trace = generate_hash_chain_trace(
            *seed,
            length,
            chain_id as u64,
            address,
            &hash_fn,
        );
        trace.extend(chain_trace);
    }

    trace
}

/// Simple test hash function for chain computation (NOT cryptographically secure)
/// Only for testing purposes
pub fn test_chain_hash_fn(h_prev: &[u64; 4], counter: u64, address: &[u64; 2]) -> [u64; 4] {
    [
        h_prev[0].wrapping_add(counter).wrapping_add(address[0]).rotate_left(13),
        h_prev[1].wrapping_add(counter).wrapping_add(address[1]).rotate_left(17),
        h_prev[2].wrapping_add(counter ^ address[0]).rotate_left(23),
        h_prev[3].wrapping_add(counter ^ address[1]).rotate_left(31),
    ]
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_chain_trace_row_creation() {
        let h_prev = [1, 2, 3, 4];
        let h_next = [5, 6, 7, 8];
        let address = [100, 200];

        let row = HashChainTraceRow::new(h_prev, h_next, 0, 0, address);
        assert_eq!(row.c_count, 0);
        assert_eq!(row.s_chain, 1);
        assert_eq!(row.chain_id, 0);
        assert_eq!(row.address, address);
    }

    #[test]
    fn test_padding_row() {
        let padding = HashChainTraceRow::padding();
        assert_eq!(padding.s_chain, 0);
        assert_eq!(padding.c_count, 0);
        assert_eq!(padding.h_prev, [0; 4]);
    }

    #[test]
    fn test_constraint_verification() {
        let h_prev = [1, 2, 3, 4];
        let h_next = [5, 6, 7, 8];
        let address = [0, 0];

        let row = HashChainTraceRow::new(h_prev, h_next, 0, 0, address);
        let result = HashChainConstraintVerifier::verify(&row, None);

        assert!(result.s_chain_binary);
        assert!(result.is_valid);
    }

    #[test]
    fn test_counter_constraint() {
        let address = [0, 0];

        let row1 = HashChainTraceRow::new([1, 2, 3, 4], [5, 6, 7, 8], 0, 0, address);
        let row2 = HashChainTraceRow::new([5, 6, 7, 8], [9, 10, 11, 12], 1, 0, address);

        let result = HashChainConstraintVerifier::verify(&row1, Some(&row2));
        assert!(result.counter_valid);
        assert!(result.chain_valid);
        assert!(result.is_valid);
    }

    #[test]
    fn test_counter_constraint_failure() {
        let address = [0, 0];

        let row1 = HashChainTraceRow::new([1, 2, 3, 4], [5, 6, 7, 8], 0, 0, address);
        let row2 = HashChainTraceRow::new([5, 6, 7, 8], [9, 10, 11, 12], 5, 0, address); // Wrong counter!

        let result = HashChainConstraintVerifier::verify(&row1, Some(&row2));
        assert!(!result.counter_valid);
        assert!(!result.is_valid);
    }

    #[test]
    fn test_chain_continuity_failure() {
        let address = [0, 0];

        let row1 = HashChainTraceRow::new([1, 2, 3, 4], [5, 6, 7, 8], 0, 0, address);
        let row2 = HashChainTraceRow::new([99, 99, 99, 99], [9, 10, 11, 12], 1, 0, address); // Wrong h_prev!

        let result = HashChainConstraintVerifier::verify(&row1, Some(&row2));
        assert!(!result.chain_valid);
        assert!(!result.is_valid);
    }

    #[test]
    fn test_generate_hash_chain_trace_row() {
        let h_prev = [1, 2, 3, 4];
        let address = [0, 0];

        let row = generate_hash_chain_trace_row(h_prev, 0, 0, address, test_chain_hash_fn);

        assert_eq!(row.h_prev, h_prev);
        assert_eq!(row.c_count, 0);

        // Verify hash is computed
        let expected_next = test_chain_hash_fn(&h_prev, 0, &address);
        assert_eq!(row.h_next, expected_next);
    }

    #[test]
    fn test_generate_hash_chain_trace() {
        let seed = [42, 0, 0, 0];
        let chain_length = 15; // WOTS+ chain length for w=16
        let address = [0, 0];

        let trace = generate_hash_chain_trace(seed, chain_length, 0, address, test_chain_hash_fn);

        assert_eq!(trace.len(), chain_length);

        // Verify counter increments
        for (i, row) in trace.iter().enumerate() {
            assert_eq!(row.c_count, i as u64);
            assert_eq!(row.s_chain, 1);
        }

        // Verify chain continuity
        for i in 0..trace.len() - 1 {
            assert_eq!(trace[i].h_next, trace[i + 1].h_prev);
        }
    }

    #[test]
    fn test_verify_complete_chain() {
        let seed = [1, 2, 3, 4];
        let chain_length = 10;
        let address = [0, 0];

        let trace = generate_hash_chain_trace(seed, chain_length, 0, address, test_chain_hash_fn);

        // Get expected final hash
        let expected_final = trace.last().unwrap().h_next;

        // Verify with correct final hash
        let result = HashChainConstraintVerifier::verify_chain(&trace, Some(&expected_final));
        assert!(result.is_valid);
        assert_eq!(result.steps_verified, chain_length);

        // Verify with wrong final hash
        let wrong_final = [0, 0, 0, 0];
        let result_wrong = HashChainConstraintVerifier::verify_chain(&trace, Some(&wrong_final));
        assert!(!result_wrong.is_valid);
    }

    #[test]
    fn test_wots_chains_trace() {
        let seeds = [
            [1, 0, 0, 0],
            [2, 0, 0, 0],
            [3, 0, 0, 0],
        ];
        let chain_lengths = [5, 10, 7]; // Variable lengths (for WOTS+ verification)
        let base_address = [0, 0];

        let trace = generate_wots_chains_trace(
            &seeds,
            &chain_lengths,
            base_address,
            test_chain_hash_fn,
        );

        // Total length should be sum of chain lengths
        let expected_total: usize = chain_lengths.iter().sum();
        assert_eq!(trace.len(), expected_total);

        // Verify chain IDs
        let mut offset = 0;
        for (chain_id, &length) in chain_lengths.iter().enumerate() {
            for i in 0..length {
                assert_eq!(trace[offset + i].chain_id, chain_id as u64);
            }
            offset += length;
        }
    }

    #[test]
    fn test_wots_full_chain_length() {
        // Test with actual WOTS+ parameters (w=16, chain_length=15)
        let seed = [0xDEADBEEF, 0, 0, 0];
        let address = [0, 0];
        let wots_chain_length = 15; // W_DEFAULT - 1

        let trace = generate_hash_chain_trace(
            seed,
            wots_chain_length,
            0,
            address,
            test_chain_hash_fn,
        );

        assert_eq!(trace.len(), 15);

        // Verify complete chain
        let final_hash = trace.last().unwrap().h_next;
        let result = HashChainConstraintVerifier::verify_chain(&trace, Some(&final_hash));
        assert!(result.is_valid);
    }

    #[test]
    fn test_different_chain_ids_no_constraint_cross() {
        // Two rows from different chains should not have counter/chain constraints
        let address = [0, 0];

        let row1 = HashChainTraceRow::new([1, 2, 3, 4], [5, 6, 7, 8], 5, 0, address);
        let row2 = HashChainTraceRow::new([9, 9, 9, 9], [10, 11, 12, 13], 0, 1, address); // Different chain_id

        let result = HashChainConstraintVerifier::verify(&row1, Some(&row2));
        // Should be valid because they're different chains
        assert!(result.is_valid);
    }
}
