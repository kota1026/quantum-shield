//! Kyber KEM STARK Module
//!
//! This module implements STARK constraints for Kyber Key Encapsulation Mechanism.
//! Kyber is a lattice-based KEM standardized by NIST (FIPS 203).
//!
//! # Key Components
//!
//! - **CBD Gate**: Centered Binomial Distribution sampling for error polynomials
//! - **NTT Gate**: Number Theoretic Transform with Montgomery butterflies
//! - **FMA Gate**: Fused Multiply-Add for polynomial arithmetic
//! - **AIR**: Algebraic Intermediate Representation for constraint system
//!
//! # Kyber Parameters
//!
//! | Parameter | Kyber-512 | Kyber-768 | Kyber-1024 |
//! |-----------|-----------|-----------|------------|
//! | n         | 256       | 256       | 256        |
//! | k         | 2         | 3         | 4          |
//! | η₁        | 3         | 2         | 2          |
//! | η₂        | 2         | 2         | 2          |
//! | Q         | 3329      | 3329      | 3329       |
//!
//! # Montgomery Arithmetic
//!
//! - R = 2^16 = 65536
//! - R^(-1) mod Q = 169
//! - -Q^(-1) mod R = 3327
//!
//! # Usage
//!
//! ```rust,ignore
//! use zk_dilithium_ntt::kyber::*;
//!
//! // Generate CBD samples for error polynomial
//! let samples = generate_test_cbd_samples(256, 2, 12345);
//!
//! // Perform NTT butterfly
//! let (a_prime, b_prime, t, m) = kyber_ntt_butterfly(100, 200, 17);
//!
//! // Perform FMA operation
//! let (r_fma, m_fma) = kyber_fma(100, 200, 50);
//! ```

pub mod constants;
pub mod cbd;
pub mod ntt;
pub mod fma;
pub mod air;
pub mod trace;
pub mod prover;

pub use constants::*;
pub use cbd::*;
pub use ntt::*;
pub use fma::*;
pub use air::*;
pub use trace::*;
pub use prover::*;
