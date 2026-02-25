//! Error types for L3 Aegis

use thiserror::Error;

/// Core error types
#[derive(Error, Debug)]
pub enum AegisError {
    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Lock not found: {0}")]
    LockNotFound(String),

    #[error("Amount mismatch: expected {expected}, got {actual}")]
    AmountMismatch { expected: u128, actual: u128 },

    #[error("Invalid public key")]
    InvalidPublicKey,

    #[error("Invalid proof")]
    InvalidProof,

    #[error("Consensus error: {0}")]
    ConsensusError(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Prover error: {0}")]
    ProverError(String),

    #[error("Crypto error: {0}")]
    CryptoError(String),

    #[error("L1 sync error: {0}")]
    L1SyncError(String),

    #[error("State mismatch")]
    StateMismatch,

    #[error("Insufficient signatures: required {required}, got {got}")]
    InsufficientSignatures { required: usize, got: usize },

    #[error("Timeout")]
    Timeout,

    #[error("View change in progress")]
    ViewChangeInProgress,

    #[error("Not leader")]
    NotLeader,

    #[error("Duplicate transaction")]
    DuplicateTransaction,

    #[error("Invalid block")]
    InvalidBlock,

    #[error("Internal error: {0}")]
    Internal(String),
}

pub type Result<T> = std::result::Result<T, AegisError>;
