//! ZK-STARK implementation for Dilithium NTT (Montgomery form)
//!
//! This crate implements a quantum-resistant STARK proof system for
//! verifying Dilithium signature NTT operations.
//!
//! # Components
//!
//! - **NTT Gate**: Montgomery butterfly operations for Number Theoretic Transform
//! - **FMA Gate**: Fused Multiply-Add with Montgomery reduction
//! - **Truncation Gate**: High/Low bit decomposition for Dilithium verification
//! - **Keccak χ Gate**: Non-linear step of SHAKE256 hash
//! - **Norm Check Gate**: ||z||_∞ < β bound verification
//! - **PRC**: Permutation Range Check for 16-bit chunk validation
//!
//! # Formal Verification
//!
//! The `formal_verification` module provides logical specifications
//! suitable for formal verification tools (Coq, Lean, Isabelle/HOL).

pub mod air;
pub mod constants;
pub mod formal_verification;
pub mod prover;
pub mod trace;

pub use air::DilithiumNttAir;
pub use prover::DilithiumNttProver;
pub use trace::build_ntt_trace;
pub use formal_verification::{
    MontgomeryFMASpec,
    PRCAccumulatorSpec,
    NormBoundSpec,
    BoundaryConstraintsSpec,
    generate_verification_report,
    FMASoundnessProof,
    verify_proof_bounds,
    PRCSoundnessProof,
    RowChunks,
    ZTransition,
    verify_decomposition_implies_t16,
};
