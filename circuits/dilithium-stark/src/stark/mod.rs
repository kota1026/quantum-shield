//! STARK proving system for Dilithium signature verification
//!
//! This module provides a complete STARK implementation using Winterfell for
//! proving Dilithium (FIPS 204) signature verification.
//!
//! # Components
//!
//! - `constants`: Dilithium and STARK parameters
//! - `air`: AIR (Algebraic Intermediate Representation) with transition constraints
//! - `trace`: Execution trace generation
//! - `prover`: STARK prover implementation
//!
//! # Example
//!
//! ```ignore
//! use dilithium_stark::stark::{
//!     prover::DilithiumNttProver,
//!     trace::{build_ntt_trace, generate_test_coefficients},
//! };
//! use winterfell::Prover;
//!
//! // Generate test coefficients
//! let coeffs = generate_test_coefficients(128);
//!
//! // Build execution trace
//! let trace = build_ntt_trace(64, &coeffs);
//!
//! // Create prover and generate proof
//! let prover = DilithiumNttProver::with_default_options();
//! let proof = prover.prove(trace).unwrap();
//! ```

pub mod constants;
pub mod air;
pub mod trace;
pub mod prover;

// Re-export commonly used types
pub use air::{DilithiumNttAir, DilithiumNttPublicInputs, columns};
pub use constants::*;
pub use prover::DilithiumNttProver;
pub use trace::{build_ntt_trace, generate_test_coefficients, truncate, montgomery_fma};
