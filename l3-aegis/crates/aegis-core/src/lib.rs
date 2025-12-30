//! # aegis-core
//!
//! Core types and execution logic for L3 Aegis Chain.
//!
//! ## CP-1 Compliance
//!
//! All cryptographic operations use:
//! - SHA3-256 (FIPS 202) for hashing
//! - Dilithium-III (FIPS 204) for user signatures
//! - SPHINCS+-128s (FIPS 205) for prover signatures

pub mod error;
pub mod state;
pub mod executor;
pub mod types;

pub use error::*;
pub use state::{StateManager, StateError, LockState, UnlockState};
pub use executor::{Executor, ExecutorError};

// Re-export commonly used types for convenience
pub use types::{Hash256, Address, LockData, LockStatus, NodeId, Block};
