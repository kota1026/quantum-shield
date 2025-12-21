//! Aegis Core - Core types and utilities for L3 Aegis
//!
//! This crate provides fundamental types used across all Aegis components:
//! - Hash types (Hash256)
//! - Address types
//! - Lock/Unlock data structures
//! - Transaction types
//! - Block structures
//!
//! Reference: docs/design/L3_AEGIS_ARCHITECTURE.md

pub mod types;
pub mod error;

pub use types::*;
pub use error::*;
