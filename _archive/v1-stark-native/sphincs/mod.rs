//! SPHINCS+ Hash-Based Signature STARK Module
//!
//! This module implements STARK constraints for SPHINCS+ signature verification.
//! SPHINCS+ is a stateless hash-based signature scheme standardized by NIST (FIPS 205).
//!
//! # Overview
//!
//! SPHINCS+ combines several cryptographic constructions:
//! - **FORS** (Forest of Random Subsets): Few-time signature for message compression
//! - **WOTS+** (Winternitz One-Time Signature): One-time signature with hash chains
//! - **Hypertree**: Merkle tree structure for WOTS+ public key aggregation
//!
//! # Key Components
//!
//! - **Merkle Path Gate**: Verifies authentication paths in Merkle trees
//! - **Hash Chain Gate**: Verifies iterative hash computations for WOTS+
//! - **AIR**: Algebraic Intermediate Representation for constraint system
//!
//! # SPHINCS+ Parameters
//!
//! | Variant | Security | n (bytes) | h | d | w | FORS k | FORS a |
//! |---------|----------|-----------|---|---|---|--------|--------|
//! | SPHINCS+-128s | 128-bit | 16 | 63 | 7 | 16 | 14 | 12 |
//! | SPHINCS+-128f | 128-bit | 16 | 66 | 22 | 16 | 33 | 6 |
//! | SPHINCS+-256s | 256-bit | 32 | 64 | 8 | 16 | 22 | 14 |
//! | SPHINCS+-256f | 256-bit | 32 | 68 | 17 | 16 | 35 | 9 |
//!
//! # STARK Constraints
//!
//! The STARK proof system verifies:
//! 1. **Hash chain correctness**: H_next = Hash(H_prev || counter || address)
//! 2. **Merkle path validity**: Parent = Hash(left_child || right_child)
//! 3. **Selector constraints**: Binary selectors for operation type
//!
//! # Usage
//!
//! ```rust,ignore
//! use zk_dilithium_ntt::sphincs::*;
//!
//! // Generate Merkle path trace
//! let leaf = [1, 2, 3, 4];
//! let siblings = [[5, 6, 7, 8], [9, 10, 11, 12]];
//! let path_bits = [0, 1];
//! let merkle_trace = generate_merkle_path_trace(leaf, &siblings, &path_bits, test_hash_fn);
//!
//! // Generate hash chain trace
//! let seed = [42, 0, 0, 0];
//! let chain_trace = generate_hash_chain_trace(seed, 15, 0, [0, 0], test_chain_hash_fn);
//!
//! // Build and prove
//! let trace = build_sphincs_test_trace();
//! let prover = SphincsProver::with_fast_options();
//! let proof = prover.prove(trace).unwrap();
//! ```
//!
//! # Security Analysis
//!
//! - **STARK Soundness**: ε ≤ (d / (ρ × N))^q where d=3, ρ=8
//! - **Hash Security**: Blake3-256 provides 128-bit collision resistance
//! - **Overall Security**: min(STARK, Hash, SPHINCS+) = 128 bits

pub mod constants;
pub mod merkle;
pub mod hash_chain;
pub mod air;
pub mod trace;
pub mod prover;

// Re-export constants
pub use constants::*;

// Re-export Merkle Path Gate
pub use merkle::{
    MerklePathTraceRow,
    MerklePathVerificationResult,
    MerklePathConstraintVerifier,
    generate_merkle_trace_row,
    generate_merkle_path_trace,
    test_hash_fn,
};

// Re-export Hash Chain Gate
pub use hash_chain::{
    HashChainTraceRow,
    HashChainVerificationResult,
    HashChainConstraintVerifier,
    generate_hash_chain_trace_row,
    generate_hash_chain_trace,
    generate_wots_chains_trace,
    test_chain_hash_fn,
};

// Re-export AIR
pub use air::{
    SphincsAir,
    SphincsPublicInputs,
};

// Re-export trace generation
pub use trace::{
    SphincsTraceRow,
    SphincsTraceBuilder,
    build_sphincs_test_trace,
    build_sphincs_wots_trace,
    build_sphincs_merkle_trace,
    build_sphincs_full_trace,
};

// Re-export prover
pub use prover::{
    SphincsProver,
    build_sphincs_trace_table,
};
