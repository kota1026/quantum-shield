//! Aegis SMT - Sparse Merkle Tree for L3 state management
//!
//! Implements SMT with:
//! - SHA3-256 hashing (FIPS 202)
//! - 256-bit depth
//! - Proof generation/verification
//! - RocksDB persistence
//!
//! Reference: L3_AEGIS_ARCHITECTURE.md Section 5.3

mod tree;

pub use tree::{SparseMerkleTree, MerkleProof};
