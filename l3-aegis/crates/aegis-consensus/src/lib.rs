//! BFT Consensus Engine for L3 Aegis
//!
//! Implements a PBFT-variant consensus protocol for the 4-node Aegis network.
//! Provides Byzantine fault tolerance of f = 1 (tolerates 1 malicious node out of 4).
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                     Consensus Engine                         │
//! ├─────────────────────────────────────────────────────────────┤
//! │                                                              │
//! │    ┌─────────┐      Pre-Prepare       ┌─────────┐           │
//! │    │ Primary │─────────────────────▶ │ Backup1 │           │
//! │    │  (P)    │                        │  (B1)   │           │
//! │    └────┬────┘                        └────┬────┘           │
//! │         │ Prepare                          │ Prepare        │
//! │         │◀─────────────────────────────────▶│                │
//! │    ┌────┴────┐                        ┌────┴────┐           │
//! │    │ Backup2 │                        │ Backup3 │           │
//! │    │  (B2)   │                        │  (B3)   │           │
//! │    └─────────┘                        └─────────┘           │
//! │                                                              │
//! │         Commit Phase: 3/4 agreement required                 │
//! │                                                              │
//! └─────────────────────────────────────────────────────────────┘
//! ```
//!
//! # CP-1 Compliance (Quantum Resistance)
//!
//! All signatures use Dilithium-III (FIPS 204):
//! - Pre-prepare, Prepare, Commit messages are signed
//! - Block validation requires 3/4 validator signatures
//! - ~3KB signature size per message
//!
//! # Configuration
//!
//! | Parameter | Production | Development |
//! |-----------|------------|-------------|
//! | Block interval | 5 seconds | 1 second |
//! | View change timeout | 10 seconds | 3 seconds |
//! | Quorum | 3/4 (75%) | 3/4 (75%) |
//!
//! Reference: L3_CHAIN_SPECIFICATION.md

pub mod config;
pub mod engine;
pub mod message;
pub mod signature;
pub mod state;
pub mod view_change;

// Re-exports for convenience
pub use config::{ConsensusConfig, ConfigError};
pub use engine::ConsensusEngine;
pub use message::{Block, ConsensusMessage, MessageType, Transaction};
pub use signature::{
    ConsensusVerifier, DilithiumSignature, NodeKeyPair, SignatureError, ValidatorSignatures,
};
pub use state::{ConsensusState, Phase, StateError};
pub use view_change::{ViewChangeManager, ViewChangeState};

/// Consensus crate version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Check if the consensus module is CP-1 compliant
/// Returns true if using quantum-resistant algorithms
pub fn is_cp1_compliant() -> bool {
    // Verify Dilithium-III parameters match FIPS 204
    signature::params::SECURITY_LEVEL == 3
        && signature::params::PUBLIC_KEY_SIZE == 1952
        && signature::params::SIGNATURE_SIZE == 3309
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cp1_compliance() {
        assert!(is_cp1_compliant(), "Consensus must be CP-1 compliant");
    }

    #[test]
    fn test_module_exports() {
        // Verify all public types are accessible
        let _config = ConsensusConfig::production(0);
        let _phase = Phase::Idle;
        let _msg_type = MessageType::PrePrepare;
    }
}
