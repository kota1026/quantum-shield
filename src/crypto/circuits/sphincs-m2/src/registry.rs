//! FR-THRESH-5 active-set commitment — the parts a verifier needs.
//!
//! Mirrors `ProverRegistry.sol`. Lives here rather than in the circuit crate
//! because it is protocol logic, not circuit logic: the zkVM guest has to
//! recompute the commitment to prove a signer belongs to the registry's active
//! set, and the guest is `no_std` with no dependencies (§20).
//!
//! ```text
//! leaf = keccak256(LEAF_DOMAIN ‖ proverAddress(20B) ‖ sphincsPubKeyHash(32B))
//! node = keccak256(NODE_DOMAIN ‖ left ‖ right)
//! root = dense tree over the active list, zero-padded to a power of two
//!        (bytes32(0) for the empty set)
//! commitment = keccak256(SET_DOMAIN ‖ root ‖ uint256(count))
//! ```
//!
//! `sphincsPubKeyHash` is SHA3-256 of the public key (CP-1); the tree itself is
//! keccak256, the documented EVM-native exception. Correctness is pinned
//! against the contract's own vectors — see `sphincs-m3`'s tests, which drive
//! this module.

use alloc::vec::Vec;

use crate::hash::{keccak256_parts, sha3_256_parts, PermTrace};

/// A 32-byte tree digest.
pub type Digest = [u8; 32];

/// `keccak256("QS_PROVER_SET_LEAF_V1")`
pub fn leaf_domain() -> Digest {
    keccak256_parts(&[b"QS_PROVER_SET_LEAF_V1"], None)
}

/// `keccak256("QS_PROVER_SET_NODE_V1")`
pub fn node_domain() -> Digest {
    keccak256_parts(&[b"QS_PROVER_SET_NODE_V1"], None)
}

/// `keccak256("QS_PROVER_SET_V1")`
pub fn set_domain() -> Digest {
    keccak256_parts(&[b"QS_PROVER_SET_V1"], None)
}

/// `sphincsPubKeyHash` — SHA3-256 of the SPHINCS+ public key (CP-1).
pub fn pubkey_hash(public_key: &[u8], trace: Option<&mut PermTrace>) -> Digest {
    match trace {
        None => sha3_256_parts(&[public_key], None),
        Some(t) => {
            let start = t.states.len();
            let out = sha3_256_parts(&[public_key], Some(&mut *t));
            t.record_node_call(Vec::new(), out, start);
            out
        }
    }
}

/// One active prover as the commitment sees it.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Member {
    pub address: [u8; 20],
    pub pubkey_hash: Digest,
}

/// `computeSetLeaf(proverAddress, sphincsPubKeyHash)`
pub fn compute_leaf(member: &Member, trace: Option<&mut PermTrace>) -> Digest {
    let parts: [&[u8]; 3] = [&leaf_domain(), &member.address, &member.pubkey_hash];
    match trace {
        None => keccak256_parts(&parts, None),
        Some(t) => {
            let start = t.states.len();
            let out = keccak256_parts(&parts, Some(&mut *t));
            t.record_node_call(alloc::vec![member.pubkey_hash], out, start);
            out
        }
    }
}

/// `keccak256(NODE_DOMAIN ‖ left ‖ right)`
pub fn hash_node(left: &Digest, right: &Digest, trace: Option<&mut PermTrace>) -> Digest {
    match trace {
        None => keccak256_parts(&[&node_domain(), left, right], None),
        Some(t) => {
            let start = t.states.len();
            let out = keccak256_parts(&[&node_domain(), left, right], Some(&mut *t));
            t.record_node_call(alloc::vec![*left, *right], out, start);
            out
        }
    }
}

/// Width the dense tree is padded to (1 for the empty set).
pub fn tree_width(count: usize) -> usize {
    let mut width = 1;
    while width < count {
        width <<= 1;
    }
    width
}

/// Root of the dense, zero-padded tree over `leaves`.
pub fn compute_root(leaves: &[Digest]) -> Digest {
    if leaves.is_empty() {
        return [0u8; 32];
    }
    let mut level = leaves.to_vec();
    level.resize(tree_width(leaves.len()), [0u8; 32]);
    while level.len() > 1 {
        level = level
            .chunks(2)
            .map(|pair| hash_node(&pair[0], &pair[1], None))
            .collect();
    }
    level[0]
}

/// `keccak256(SET_DOMAIN ‖ root ‖ uint256(count))`
pub fn compute_commitment(root: &Digest, count: usize) -> Digest {
    compute_commitment_traced(root, count, None)
}

/// As [`compute_commitment`], recording the permutation and node call.
pub fn compute_commitment_traced(
    root: &Digest,
    count: usize,
    trace: Option<&mut PermTrace>,
) -> Digest {
    let mut count_be = [0u8; 32];
    count_be[24..].copy_from_slice(&(count as u64).to_be_bytes());
    let parts: [&[u8]; 3] = [&set_domain(), root, &count_be];
    match trace {
        None => keccak256_parts(&parts, None),
        Some(t) => {
            let start = t.states.len();
            let out = keccak256_parts(&parts, Some(&mut *t));
            t.record_node_call(alloc::vec![*root], out, start);
            out
        }
    }
}

/// Root and commitment for a member list, as the contract would report them.
pub fn commit_members(members: &[Member]) -> (Digest, Digest) {
    let leaves: Vec<Digest> = members.iter().map(|m| compute_leaf(m, None)).collect();
    let root = compute_root(&leaves);
    (root, compute_commitment(&root, members.len()))
}

/// Sibling hashes from `index`'s leaf up to the root.
pub fn merkle_path(leaves: &[Digest], index: usize) -> Vec<Digest> {
    assert!(index < leaves.len(), "index outside the active set");
    let mut level = leaves.to_vec();
    level.resize(tree_width(leaves.len()), [0u8; 32]);

    let mut path = Vec::new();
    let mut idx = index;
    while level.len() > 1 {
        path.push(level[idx ^ 1]);
        level = level
            .chunks(2)
            .map(|pair| hash_node(&pair[0], &pair[1], None))
            .collect();
        idx >>= 1;
    }
    path
}

/// Recompute the root from a leaf and its path.
pub fn root_from_path(
    leaf: &Digest,
    index: usize,
    path: &[Digest],
    mut trace: Option<&mut PermTrace>,
) -> Digest {
    let mut node = *leaf;
    let mut idx = index;
    for sibling in path {
        node = if idx & 1 == 0 {
            hash_node(&node, sibling, trace.as_deref_mut())
        } else {
            hash_node(sibling, &node, trace.as_deref_mut())
        };
        idx >>= 1;
    }
    node
}

/// Full membership check against a published commitment.
pub fn verify_membership(
    member: &Member,
    index: usize,
    path: &[Digest],
    count: usize,
    commitment: &Digest,
    mut trace: Option<&mut PermTrace>,
) -> bool {
    let leaf = compute_leaf(member, trace.as_deref_mut());
    let root = root_from_path(&leaf, index, path, trace.as_deref_mut());
    compute_commitment_traced(&root, count, trace) == *commitment
}
