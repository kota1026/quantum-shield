//! # Aegis Sequencer
//!
//! Transaction ordering and batching for L3 Aegis chain.
//!
//! ## Components
//!
//! - `Sequencer`: Core sequencer trait and implementation
//! - `MempoolManager`: Transaction pool management
//! - `BatchBuilder`: Batch construction for L1 submission
//!
//! ## Reference
//!
//! - UNIFIED_SPEC_v2.0.md §Sequencer
//! - PHASE3_PLAN.md IC-3
//! - L3_CHAIN_SPECIFICATION.md §Sequencer

pub mod error;
pub mod mempool;
pub mod sequencer;
pub mod types;

pub use error::{SequencerError, SequencerResult};
pub use mempool::MempoolManager;
pub use sequencer::{Sequencer, SequencerConfig, SequencerState};
pub use types::*;
