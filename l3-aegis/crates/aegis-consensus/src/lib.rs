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

pub mod engine;
pub mod message;
pub mod state;
pub mod view_change;

pub use engine::ConsensusEngine;
pub use message::{ConsensusMessage, MessageType};
pub use state::{ConsensusState, Phase};
