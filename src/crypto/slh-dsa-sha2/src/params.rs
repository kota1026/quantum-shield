//! SLH-DSA-SHA2-128s parameters (FIPS 205 Table 2, security category 1).
//!
//! Identical structure to the SHAKE-128s set used by `sphincs-m2`; only the
//! hash constructions differ (`crate::hash`). Chosen over SHAKE because the EVM
//! has a SHA-256 precompile and none for SHAKE256 — see
//! `docs/core/STARK_AIR_GAP_ANALYSIS.md` §28.

/// Security parameter: hash output and key element size, in bytes.
pub const N: usize = 16;
/// Total hypertree height.
pub const H: usize = 63;
/// Hypertree layers.
pub const D: usize = 7;
/// Height of each XMSS tree.
pub const H_PRIME: usize = 9;
/// FORS tree height.
pub const A: usize = 12;
/// Number of FORS trees.
pub const K: usize = 14;
/// log2 of the Winternitz parameter.
pub const LG_W: usize = 4;
/// Winternitz parameter.
pub const W: u32 = 16;
/// Message digest length, in bytes.
pub const M: usize = 30;

/// WOTS+ message chains.
pub const LEN1: usize = (8 * N) / LG_W;
/// WOTS+ checksum chains.
pub const LEN2: usize = 3;
/// Total WOTS+ chains.
pub const LEN: usize = LEN1 + LEN2;

/// Bytes of the digest that select FORS indices.
pub const MD_BYTES: usize = (K * A).div_ceil(8);
/// Bytes of the digest that select the hypertree leaf.
pub const TREE_BYTES: usize = (H - H / D).div_ceil(8);
/// Bytes of the digest that select the XMSS leaf.
pub const LEAF_BYTES: usize = (H / D).div_ceil(8);

/// `PK.seed ‖ PK.root`.
pub const PK_BYTES: usize = 2 * N;
/// FORS signature length.
pub const SIG_FORS_BYTES: usize = K * (1 + A) * N;
/// Hypertree signature length.
pub const SIG_HT_BYTES: usize = (H + D * LEN) * N;
/// `R ‖ SIG_FORS ‖ SIG_HT`.
pub const SIG_BYTES: usize = N + SIG_FORS_BYTES + SIG_HT_BYTES;
