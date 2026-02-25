//! Repository modules for database operations
//!
//! Each repository handles database operations for a specific domain.
//! All operations follow BE-001~003 rules:
//! - BE-001: No stub responses - real DB queries
//! - BE-002: No test-specific modifications
//! - BE-003: Mandatory logging
//!
//! Storage Migration (Phase 0): Added signing_queue, vrf, token_hub repositories
//! These enable the dual-write pattern (PG first → Redis cache) across all entities.

mod admin;
mod prover;
mod observer;
mod user;
mod lock;
mod challenge;
mod governance;
mod treasury;
mod support;
mod signing_queue;
mod vrf;
mod token_hub;
mod insurance;
mod council;
mod enterprise;
mod system;
pub mod document;

pub use admin::*;
pub use prover::*;
pub use observer::*;
pub use user::*;
pub use lock::*;
pub use challenge::*;
pub use governance::*;
pub use treasury::*;
pub use support::*;
pub use signing_queue::*;
pub use vrf::*;
pub use token_hub::*;
pub use insurance::*;
pub use council::*;
pub use enterprise::*;
pub use system::*;
