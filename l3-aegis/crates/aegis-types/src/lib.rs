//! Aegis Types - Shared type definitions for L3 Aegis Chain
//!
//! This crate provides core types used across the L3 Aegis system.
//! All types are designed to be CP-1 compliant (quantum-resistant).

pub mod hash;
pub mod block;
pub mod transaction;
pub mod node;
pub mod error;

pub use hash::Hash256;
pub use block::{Block, BlockHeader, BlockBody};
pub use transaction::Transaction;
pub use node::NodeId;
pub use error::AegisError;

/// Protocol version
pub const PROTOCOL_VERSION: u8 = 1;
