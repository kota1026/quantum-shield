//! Aegis Types - Shared type definitions for L3 Aegis Chain
//!
//! This crate provides core types used across the L3 Aegis system.
//! All types are designed to be CP-1 compliant (quantum-resistant).
//!
//! # CP-1 Compliance
//! - All hashes use SHA3-256 (FIPS 202)
//! - All signatures use Dilithium-III (FIPS 204) or SPHINCS+ (FIPS 205)
//! - Prohibited algorithms: keccak256, SHA-256, ECDSA, RSA, secp256k1

pub mod hash;
pub mod block;
pub mod transaction;
pub mod node;
pub mod error;
pub mod merkle;

pub use hash::Hash256;
pub use block::{Block, BlockHeader, BlockBody};
pub use transaction::Transaction;
pub use node::NodeId;
pub use error::AegisError;
pub use merkle::{MerkleTree, MerkleProof};

/// Protocol version
pub const PROTOCOL_VERSION: u8 = 1;
