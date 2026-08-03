//! Prover-registry set commitment (FR-THRESH-5, circuit side): a SHA3-256
//! Merkle tree over the provers' SLH-DSA public keys, and the membership
//! pipeline proof — leaf = SHA3-256(PK.seed || PK.root), then a 32-byte
//! Merkle climb bound to the public registry root.
//!
//! SHA3-256 shares Keccak-f[1600] and the 136-byte rate with SHAKE256 (only
//! the 0x06 domain padding differs), so membership proofs run through the
//! same generalized pipeline AIR as the signature stages, using the 32-byte
//! chain groups (lanes 0-3 / 4-7).

use sha3::{Digest, Sha3_256};

use crate::pipeline::{Side, StageBuilder, PAD_SHA3};

/// Registered provers (demo registry: N=5, padded to 8 leaves).
pub const REG_N: usize = 5;
pub const REG_LEAVES: usize = 8;
pub const REG_H: usize = 3;

pub fn sha3_256(data: &[u8]) -> [u8; 32] {
    let mut h = Sha3_256::new();
    h.update(data);
    h.finalize().into()
}

pub fn leaf_hash(pk_seed: &[u8; 16], pk_root: &[u8; 16]) -> [u8; 32] {
    let mut d = [0u8; 32];
    d[..16].copy_from_slice(pk_seed);
    d[16..].copy_from_slice(pk_root);
    sha3_256(&d)
}

pub struct Registry {
    /// levels[0] = leaves (REG_LEAVES), levels[REG_H] = [root].
    pub levels: Vec<Vec<[u8; 32]>>,
}

impl Registry {
    /// Build the commitment over the provers' public keys; unused leaf
    /// positions hold the zero leaf.
    pub fn new(pks: &[([u8; 16], [u8; 16])]) -> Self {
        assert!(pks.len() <= REG_LEAVES);
        let mut leaves = vec![[0u8; 32]; REG_LEAVES];
        for (i, (seed, root)) in pks.iter().enumerate() {
            leaves[i] = leaf_hash(seed, root);
        }
        let mut levels = vec![leaves];
        for _ in 0..REG_H {
            let prev = levels.last().unwrap();
            let mut next = Vec::with_capacity(prev.len() / 2);
            for pair in prev.chunks(2) {
                let mut d = [0u8; 64];
                d[..32].copy_from_slice(&pair[0]);
                d[32..].copy_from_slice(&pair[1]);
                next.push(sha3_256(&d));
            }
            levels.push(next);
        }
        Registry { levels }
    }

    pub fn root(&self) -> [u8; 32] {
        self.levels[REG_H][0]
    }

    pub fn path(&self, index: usize) -> [[u8; 32]; REG_H] {
        core::array::from_fn(|j| self.levels[j][(index >> j) ^ 1])
    }

    /// Native reference: recompute the root from a leaf and path.
    pub fn climb(leaf: [u8; 32], index: usize, path: &[[u8; 32]; REG_H]) -> [u8; 32] {
        let mut node = leaf;
        for (j, sib) in path.iter().enumerate() {
            let mut d = [0u8; 64];
            if (index >> j) & 1 == 0 {
                d[..32].copy_from_slice(&node);
                d[32..].copy_from_slice(sib);
            } else {
                d[..32].copy_from_slice(sib);
                d[32..].copy_from_slice(&node);
            }
            node = sha3_256(&d);
        }
        node
    }
}

/// Membership pipeline: 1 leaf-hash slot + REG_H climb slots, output bound
/// to the claimed registry root.
pub fn plan_membership(
    pk_seed: &[u8; 16],
    pk_root: &[u8; 16],
    index: usize,
    path: &[[u8; 32]; REG_H],
    root_claim: &[u8; 32],
) -> StageBuilder {
    let mut b = StageBuilder::default();
    let mut input = [0u8; 32];
    input[..16].copy_from_slice(pk_seed);
    input[16..].copy_from_slice(pk_root);
    b.fresh_public(&input, PAD_SHA3);

    for (j, sib) in path.iter().enumerate() {
        let bit = (index >> j) & 1;
        let zero = [0u8; 32];
        let (left, right, side) = if bit == 0 {
            (&zero[..], &sib[..], Side::Left32)
        } else {
            (&sib[..], &zero[..], Side::Right32)
        };
        let mut input = Vec::with_capacity(64);
        input.extend_from_slice(left);
        input.extend_from_slice(right);
        b.fresh_chained(&input, side, PAD_SHA3);
    }
    b.bind_out(root_claim);
    b
}
