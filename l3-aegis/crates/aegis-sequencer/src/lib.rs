//! # Aegis Sequencer
//!
//! Transaction ordering and batching for L3 Aegis chain.
//!
//! ## Components
//!
//! - `Sequencer`: Core sequencer trait and implementation
//! - `MempoolManager`: Transaction pool management
//! - `BatchBuilder`: Batch construction for L1 submission
//! - `L1Submitter`: State root submission to L1
//! - `RotationManager`: Round-robin sequencer rotation
//! - `StakingManager`: veQS staking integration
//! - `MultiSequencerCoordinator`: Multi-sequencer coordination
//! - `FailoverManager`: Sequencer failover and health monitoring
//!
//! ## Reference
//!
//! - UNIFIED_SPEC_v2.0.md §Sequencer
//! - PHASE3_PLAN.md IC-3
//! - L3_CHAIN_SPECIFICATION.md §Sequencer

pub mod batch_builder;
pub mod error;
pub mod failover;
pub mod l1_submitter;
pub mod mempool;
pub mod multi_sequencer;
pub mod rotation;
pub mod sequencer;
pub mod staking;
pub mod types;

#[cfg(test)]
mod e2e_tests;

// Re-exports
pub use batch_builder::{BatchBuilder, BatchBuilderConfig};
pub use error::{SequencerError, SequencerResult};
pub use failover::{FailoverManager, FailoverConfig, HealthStatus, SequencerHealth, FailoverEvent};
pub use l1_submitter::{L1Submitter, L1SubmitterConfig, L1Submission, SubmissionStatus};
pub use mempool::MempoolManager;
pub use multi_sequencer::{MultiSequencerCoordinator, MultiSequencerConfig, ConflictStrategy};
pub use rotation::{RotationManager, RotationConfig, NodeInfo, ViewChangeMessage};
pub use sequencer::{Sequencer, SequencerConfig, SequencerState};
pub use staking::{StakingManager, StakingConfig, StakeInfo, StakeCurrency};
pub use types::*;
