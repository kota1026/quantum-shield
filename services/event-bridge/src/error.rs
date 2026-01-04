//! Error types for Event Bridge

use thiserror::Error;

/// Result type for Event Bridge operations
pub type Result<T> = std::result::Result<T, Error>;

/// Event Bridge Error Types
#[derive(Error, Debug)]
pub enum Error {
    /// Configuration error
    #[error("Configuration error: {0}")]
    Config(#[from] config::ConfigError),

    /// Redis error
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),

    /// Ethereum provider error
    #[error("Ethereum provider error: {0}")]
    Provider(String),

    /// Event validation error
    #[error("Event validation error: {0}")]
    Validation(String),

    /// State Root mismatch
    #[error("Invalid SR0: computed={computed}, received={received}")]
    InvalidSR0 {
        computed: String,
        received: String,
    },

    /// State inconsistency between L1 and L3
    #[error("State inconsistency: L1 root={l1_root}, L3 root={l3_root}")]
    InconsistentState {
        l1_root: String,
        l3_root: String,
    },

    /// Rate limit exceeded
    #[error("Rate limit exceeded: {0} events/second")]
    RateLimitExceeded(u32),

    /// Event already processed (idempotency)
    #[error("Event already processed: {0}")]
    DuplicateEvent(String),

    /// Connection error
    #[error("Connection error: {0}")]
    Connection(String),

    /// Timeout error
    #[error("Timeout: {0}")]
    Timeout(String),

    /// Signature verification error
    #[error("Signature verification failed: {0}")]
    SignatureVerification(String),

    /// HSM communication error
    #[error("HSM communication error: {0}")]
    HsmError(String),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Max retries exceeded
    #[error("Max retries exceeded after {attempts} attempts")]
    MaxRetriesExceeded { attempts: u32 },

    /// Internal error
    #[error("Internal error: {0}")]
    Internal(String),
}
