//! Storage error types for aegis-storage.

use thiserror::Error;

/// Errors that can occur during storage operations.
#[derive(Error, Debug)]
pub enum StorageError {
    /// RocksDB error
    #[error("RocksDB error: {0}")]
    RocksDb(#[from] rocksdb::Error),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] bincode::Error),

    /// Block not found
    #[error("Block not found: {hash}")]
    BlockNotFound { hash: String },

    /// Block at height not found
    #[error("Block at height {height} not found")]
    BlockHeightNotFound { height: u64 },

    /// Account not found
    #[error("Account not found: {address}")]
    AccountNotFound { address: String },

    /// Transaction not found
    #[error("Transaction not found: {hash}")]
    TransactionNotFound { hash: String },

    /// Invalid data format
    #[error("Invalid data format: {msg}")]
    InvalidData { msg: String },

    /// Storage not initialized
    #[error("Storage not initialized")]
    NotInitialized,

    /// Duplicate block
    #[error("Duplicate block: {hash}")]
    DuplicateBlock { hash: String },

    /// Chain reorganization error
    #[error("Chain reorganization failed: {msg}")]
    ReorgFailed { msg: String },

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Result type for storage operations.
pub type StorageResult<T> = Result<T, StorageError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = StorageError::BlockNotFound {
            hash: "abc123".to_string(),
        };
        assert!(err.to_string().contains("Block not found"));
        assert!(err.to_string().contains("abc123"));
    }

    #[test]
    fn test_block_height_error() {
        let err = StorageError::BlockHeightNotFound { height: 42 };
        assert!(err.to_string().contains("42"));
    }

    #[test]
    fn test_invalid_data_error() {
        let err = StorageError::InvalidData {
            msg: "corrupted header".to_string(),
        };
        assert!(err.to_string().contains("corrupted header"));
    }
}
