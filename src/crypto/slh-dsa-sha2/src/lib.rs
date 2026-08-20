//! Reference verifier for FIPS 205 SLH-DSA-SHA2-128s.
//!
//! Exists to be the thing the Solidity verifier is tested against. The SHA2
//! parameter set is chosen because the EVM has a SHA-256 precompile and none
//! for SHAKE256, which is what lets an on-chain verifier stay strictly FIPS 205
//! conformant — see `docs/core/STARK_AIR_GAP_ANALYSIS.md` §28.
//!
//! Correctness is pinned against the independent RustCrypto `slh-dsa`
//! implementation, the same oracle `sphincs-m2` uses.

pub mod adrs;
pub mod hash;
pub mod params;
pub mod verify;
