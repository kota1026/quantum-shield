//! Aegis Crypto - Quantum-resistant cryptography
//!
//! Implements:
//! - Dilithium signature verification (FIPS 204)
//! - Key management utilities
//!
//! Reference: UNIFIED_SPEC_v2.0.md - User署名: Dilithium-III

pub mod dilithium;

pub use dilithium::DilithiumVerifier;
