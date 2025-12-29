//! Aegis Network - P2P networking for L3 Aegis Chain
//!
//! Implements networking layer per L3_CHAIN_SPECIFICATION.md §4
//! Uses custom TCP + TLS 1.3 + mTLS for 4-node BFT network.

pub mod peer;
pub mod transport;
pub mod config;
pub mod message;

pub use peer::{Peer, PeerManager};
pub use transport::Transport;
pub use config::NetworkConfig;
pub use message::NetworkMessage;

/// Network result type
pub type Result<T> = std::result::Result<T, NetworkError>;

/// Network error types
#[derive(Debug, thiserror::Error)]
pub enum NetworkError {
    #[error("Connection error: {0}")]
    Connection(String),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Serialization error: {0}")]
    Serialization(String),
    
    #[error("TLS error: {0}")]
    Tls(String),
    
    #[error("Peer not found: {0}")]
    PeerNotFound(String),
    
    #[error("Message validation failed: {0}")]
    Validation(String),
}
