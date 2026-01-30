//! Repository modules for database operations
//!
//! Each repository handles database operations for a specific domain.
//! All operations follow BE-001~003 rules:
//! - BE-001: No stub responses - real DB queries
//! - BE-002: No test-specific modifications
//! - BE-003: Mandatory logging

mod admin;
mod prover;
mod observer;
mod user;
mod lock;
mod challenge;
mod governance;
mod treasury;

pub use admin::*;
pub use prover::*;
pub use observer::*;
pub use user::*;
pub use lock::*;
pub use challenge::*;
pub use governance::*;
pub use treasury::*;
