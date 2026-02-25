//! # aegis-storage
//!
//! Persistent storage for L3 Aegis node using RocksDB.
//!
//! ## Overview
//!
//! This crate provides storage abstractions for:
//! - Block storage and indexing
//! - State storage (account balances, nonces)
//! - Transaction pool persistence
//!
//! ## CP-1 Compliance
//!
//! All hash operations use SHA3-256 (FIPS 202) via aegis-types::Hash256.
//! No keccak256, SHA-256, or other non-quantum-resistant hashes are used.

mod error;
mod store;
mod config;

pub use error::StorageError;
pub use store::{Storage, BlockStore, StateStore};
pub use config::StorageConfig;

/// Storage version for migration support
pub const STORAGE_VERSION: u32 = 1;

/// Column family names for RocksDB
pub mod cf {
    /// Block headers by hash
    pub const BLOCK_HEADERS: &str = "block_headers";
    /// Block bodies by hash
    pub const BLOCK_BODIES: &str = "block_bodies";
    /// Block hash by height index
    pub const BLOCK_HEIGHT_INDEX: &str = "block_height_index";
    /// Account state by address
    pub const ACCOUNTS: &str = "accounts";
    /// Pending transactions
    pub const TX_POOL: &str = "tx_pool";
    /// Metadata (chain tip, etc.)
    pub const METADATA: &str = "metadata";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_storage_version() {
        assert_eq!(STORAGE_VERSION, 1);
    }

    #[test]
    fn test_column_families_defined() {
        assert!(!cf::BLOCK_HEADERS.is_empty());
        assert!(!cf::BLOCK_BODIES.is_empty());
        assert!(!cf::ACCOUNTS.is_empty());
    }
}
