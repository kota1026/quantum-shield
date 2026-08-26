//! SLH-DSA-SHAKE-128s parameters (FIPS 205, Table 2).
//!
//! This is the parameter set Quantum Shield's Prover signatures use — the
//! 7,856-byte signature size referenced throughout the L1 contracts comes
//! from here.

/// Security parameter (bytes).
pub const N: usize = 16;

/// Total hypertree height.
pub const H: usize = 63;

/// Hypertree layers.
pub const D: usize = 7;

/// Height of each XMSS tree (`h/d`).
pub const H_PRIME: usize = 9;

/// FORS tree height.
pub const A: usize = 12;

/// Number of FORS trees.
pub const K: usize = 14;

/// log2 of the Winternitz parameter.
pub const LG_W: usize = 4;

/// Winternitz parameter.
pub const W: u32 = 1 << LG_W;

/// Message digest length (bytes).
pub const M: usize = 30;

/// WOTS+ message chain count.
pub const LEN1: usize = (8 * N) / LG_W;

/// WOTS+ checksum chain count.
pub const LEN2: usize = 3;

/// Total WOTS+ chains.
pub const LEN: usize = LEN1 + LEN2;

/// Public key length: `PK.seed ‖ PK.root`.
pub const PK_BYTES: usize = 2 * N;

/// FORS signature length.
pub const SIG_FORS_BYTES: usize = K * (A + 1) * N;

/// Hypertree signature length.
pub const SIG_HT_BYTES: usize = D * (H_PRIME + LEN) * N;

/// Total signature length (7,856 bytes for this parameter set).
pub const SIG_BYTES: usize = N + SIG_FORS_BYTES + SIG_HT_BYTES;

/// Digest bytes carrying the FORS message indices: `ceil(k*a/8)`.
pub const MD_BYTES: usize = (K * A).div_ceil(8);

/// Digest bytes carrying the tree index: `ceil((h - h/d)/8)`.
pub const IDX_TREE_BYTES: usize = (H - H_PRIME).div_ceil(8);

/// Digest bytes carrying the leaf index: `ceil(h/(8d))`.
pub const IDX_LEAF_BYTES: usize = H_PRIME.div_ceil(8);

#[cfg(test)]
mod tests {
    use super::*;

    /// The parameter set must reproduce the FIPS 205 Table 2 sizes; the
    /// signature size in particular is load-bearing for the L1 contracts.
    #[test]
    fn sizes_match_fips205_table2() {
        assert_eq!(LEN1, 32);
        assert_eq!(LEN, 35);
        assert_eq!(PK_BYTES, 32);
        assert_eq!(SIG_BYTES, 7856);
        assert_eq!(MD_BYTES + IDX_TREE_BYTES + IDX_LEAF_BYTES, M);
    }
}
