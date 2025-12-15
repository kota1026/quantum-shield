//! ZK-STARK implementation for Post-Quantum Cryptography
//!
//! This crate implements quantum-resistant STARK proof systems for
//! verifying PQC signature and KEM operations.
//!
//! # Supported Algorithms
//!
//! ## Dilithium (FIPS 204)
//! - **NTT Gate**: Montgomery butterfly operations for Number Theoretic Transform
//! - **FMA Gate**: Fused Multiply-Add with Montgomery reduction
//! - **Truncation Gate**: High/Low bit decomposition for signature verification
//! - **Keccak χ Gate**: Non-linear step of SHAKE256 hash
//! - **Norm Check Gate**: ||z||_∞ < β bound verification
//! - **PRC**: Permutation Range Check for 16-bit chunk validation
//! - **Sampler Gate**: Challenge polynomial c ∈ {-1, 0, 1}^N sampling
//! - **Hint Gate**: Binary hint vector h ∈ {0, 1}^N with accumulation
//!
//! ## Kyber (FIPS 203) - Phase IV-A
//! - **CBD Gate**: Centered Binomial Distribution sampling for error polynomials
//! - **NTT/FMA Gates**: Reused from Dilithium with Q=3329
//!
//! # Formal Verification
//!
//! The `formal_verification` module provides logical specifications
//! suitable for formal verification tools (Coq, Lean, Isabelle/HOL).

pub mod air;
pub mod constants;
pub mod formal_verification;
pub mod kyber;
pub mod prover;
pub mod trace;

// Phase I exports
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

// Phase II exports (Extended AIR and Trace)
pub use air::{ExtendedDilithiumAir, ExtendedPublicInputs};
pub use trace::{
    ChallengeCoeff,
    generate_challenge_polynomial,
    generate_hint_vector,
    build_extended_trace,
};

// Phase II Formal Verification exports
pub use formal_verification::{
    SamplerGateSpec,
    SamplerSoundnessProof,
    HintGateSpec,
    HintSoundnessProof,
    HintAccumulatorProof,
    ExtendedVerificationReport,
    generate_extended_verification_report,
};

// Phase IV-A: Kyber Formal Verification exports
pub use formal_verification::{
    KyberNttGateSpec,
    KyberNttSoundnessProof,
    KyberFmaGateSpec,
    KyberFmaSoundnessProof,
    KyberCbdGateSpec,
    KyberCbdSoundnessProof,
    KyberVerificationReport,
    generate_kyber_verification_report,
};

// Phase IV-B: Kyber End-to-End Formal Verification exports
pub use formal_verification::{
    // STARK Soundness Theorem
    KyberSTARKSoundnessTheorem,
    // End-to-End Verification Report
    KyberEndToEndVerificationReport,
    generate_kyber_complete_verification_report,
    // Security Analysis
    KyberSecurityAnalysis,
    // Coq/Lean Formal Specifications
    generate_kyber_ntt_coq_spec,
    generate_kyber_fma_coq_spec,
    generate_kyber_cbd_coq_spec,
    generate_kyber_lean4_spec,
};

// Phase IV-A: Kyber KEM exports
pub use kyber::{
    // Constants
    Q_KYBER,
    R_KYBER,
    N_KYBER,
    ETA_DEFAULT,
    ZETA_KYBER,
    KyberSecurityLevel,
    cbd_columns,
    // CBD Gate
    CBDSample,
    CBDTraceRow,
    CBDConstraintVerifier,
    CBDVerificationResult,
    generate_cbd_samples,
    generate_test_cbd_samples,
    generate_cbd_trace,
    generate_cbd_trace_for_sample,
    // Montgomery arithmetic
    montgomery_reduce_kyber,
    montgomery_multiply_kyber,
    to_montgomery_kyber,
    from_montgomery_kyber,
    // NTT Gate
    KyberNttTraceRow,
    KyberNttConstraintVerifier,
    KyberNttVerificationResult,
    generate_kyber_twiddle_factors,
    kyber_ntt_butterfly,
    generate_kyber_ntt_trace_row,
    kyber_ntt,
    // FMA Gate
    KyberFmaTraceRow,
    KyberFmaConstraintVerifier,
    KyberFmaVerificationResult,
    kyber_fma,
    generate_kyber_fma_trace_row,
    kyber_pointwise_multiply,
    kyber_pointwise_mac,
    generate_pointwise_multiply_trace,
    // AIR
    KyberAir,
    KyberPublicInputs,
    kyber_columns,
    KYBER_TRACE_WIDTH,
    // Trace generation
    KyberTraceRow,
    KyberTraceBuilder,
    build_kyber768_trace,
    build_kyber_test_trace,
    // Prover
    KyberProver,
    build_kyber_trace_table,
};
