//! Error types for L3 Aegis

use thiserror::Error;

/// Main error type for Aegis operations
#[derive(Error, Debug)]
pub enum AegisError {
    /// Hash-related errors
    #[error("Hash error: {0}")]
    Hash(String),

    /// Signature verification failed
    #[error("Signature verification failed: {0}")]
    SignatureVerification(String),

    /// Invalid block
    #[error("Invalid block: {0}")]
    InvalidBlock(String),

    /// Invalid transaction
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),

    /// Consensus error
    #[error("Consensus error: {0}")]
    Consensus(String),

    /// Storage error
    #[error("Storage error: {0}")]
    Storage(String),

    /// Network error
    #[error("Network error: {0}")]
    Network(String),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(String),

    /// Configuration error
    #[error("Configuration error: {0}")]
    Config(String),

    /// Internal error
    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<serde_json::Error> for AegisError {
    fn from(e: serde_json::Error) -> Self {
        AegisError::Serialization(e.to_string())
    }
}

impl From<hex::FromHexError> for AegisError {
    fn from(e: hex::FromHexError) -> Self {
        AegisError::Hash(e.to_string())
    }
}

impl From<std::io::Error> for AegisError {
    fn from(e: std::io::Error) -> Self {
        AegisError::Internal(e.to_string())
    }
}
