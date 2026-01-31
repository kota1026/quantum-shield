//! Sequencer error types

use thiserror::Error;

/// Sequencer error type
#[derive(Debug, Error)]
pub enum SequencerError {
    /// Transaction validation failed
    #[error("Transaction validation failed: {0}")]
    ValidationError(String),

    /// Transaction already in mempool
    #[error("Transaction already exists: {0}")]
    DuplicateTransaction(String),

    /// Mempool full
    #[error("Mempool full: max capacity {max_capacity}")]
    MempoolFull { max_capacity: usize },

    /// Transaction not found
    #[error("Transaction not found: {0}")]
    TransactionNotFound(String),

    /// Invalid nonce
    #[error("Invalid nonce: expected {expected}, got {actual}")]
    InvalidNonce { expected: u64, actual: u64 },

    /// Insufficient balance for gas
    #[error("Insufficient balance: required {required}, available {available}")]
    InsufficientBalance { required: u128, available: u128 },

    /// Gas limit exceeded
    #[error("Gas limit exceeded: limit {limit}, required {required}")]
    GasLimitExceeded { limit: u64, required: u64 },

    /// Gas price too high
    #[error("Gas price too high: current {current}, max {max}")]
    GasPriceTooHigh { current: u128, max: u128 },

    /// Batch construction failed
    #[error("Batch construction failed: {0}")]
    BatchError(String),

    /// Sequencer not active
    #[error("Sequencer not active for current epoch")]
    NotActiveSequencer,

    /// Invalid signature
    #[error("Invalid signature: {0}")]
    InvalidSignature(String),

    /// State access error
    #[error("State access error: {0}")]
    StateError(String),

    /// Network error
    #[error("Network error: {0}")]
    NetworkError(String),

    /// L1 submission failed
    #[error("L1 submission failed: {0}")]
    L1SubmissionFailed(String),

    /// Insufficient stake
    #[error("Insufficient stake: required {required}, available {available}")]
    InsufficientStake { required: u128, available: u128 },

    /// Slashing error
    #[error("Slashing error: {0}")]
    SlashingError(String),

    /// Consensus error
    #[error("Consensus error: {0}")]
    ConsensusError(String),

    /// Timeout error
    #[error("Timeout: {0}")]
    Timeout(String),

    /// Internal error
    #[error("Internal error: {0}")]
    InternalError(String),
}

/// Result type alias for sequencer operations
pub type SequencerResult<T> = Result<T, SequencerError>;
