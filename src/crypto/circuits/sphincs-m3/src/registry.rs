//! FR-THRESH-5 active-set commitment, circuit side.
//!
//! `ProverRegistry.sol` maintains a commitment to the active prover set so a
//! threshold proof can attest FR-THRESH-1(b) — "the signer's public key is in
//! the active set as of some epoch". This module recomputes that commitment
//! and verifies Merkle inclusion **with permutation recording**, so the
//! membership check becomes part of the same Keccak witness as the SPHINCS+
//! verification itself.
//!
//! ```text
//! leaf = keccak256(LEAF_DOMAIN ‖ proverAddress(20B) ‖ sphincsPubKeyHash(32B))
//! node = keccak256(NODE_DOMAIN ‖ left ‖ right)
//! root = dense tree over the active list, zero-padded to a power of two
//!        (bytes32(0) for the empty set)
//! commitment = keccak256(SET_DOMAIN ‖ root ‖ uint256(count))
//! ```
//!
//! `sphincsPubKeyHash` is SHA3-256 of the public key (CP-1); the tree itself
//! is keccak256, the documented EVM-native exception — see
//! `docs/core/STARK_AIR_GAP_ANALYSIS.md` §6.2. Both are the same permutation,
//! so both land in the same Keccak table.
//!
//! Correctness is pinned against the **contract**: the vectors in the tests
//! come from `ProverSetCommitmentVectors.t.sol`, not from this code.

use std::collections::HashMap;

use sphincs_m2::hash::{keccak256_parts, sha3_256_parts, PermTrace};

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
///
/// Recorded as a node call so that the leaf's consumption of this digest is
/// an *internal* edge: the leaf cannot name a public-key hash the witness
/// never computed.
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
///
/// The leaf consumes `pubkey_hash`, which the same witness produced (it is
/// SHA3-256 of the registered public key), so the call is recorded as a node
/// call and takes part in the `MERKLE_DAG` interaction.
pub fn compute_leaf(member: &Member, trace: Option<&mut PermTrace>) -> Digest {
    let parts: [&[u8]; 3] = [&leaf_domain(), &member.address, &member.pubkey_hash];
    match trace {
        None => keccak256_parts(&parts, None),
        Some(t) => {
            let start = t.states.len();
            let out = keccak256_parts(&parts, Some(&mut *t));
            t.record_node_call(vec![member.pubkey_hash], out, start);
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
            t.record_node_call(vec![*left, *right], out, start);
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
///
/// The empty set has root `bytes32(0)`, matching the contract's special case.
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
    let mut count_be = [0u8; 32];
    count_be[24..].copy_from_slice(&(count as u64).to_be_bytes());
    keccak256_parts(&[&set_domain(), root, &count_be], None)
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

/// Recompute the root from a leaf and its path, recording every permutation.
///
/// This is the in-circuit membership check: the hashes it performs become
/// part of the Keccak witness, and the resulting root is what a proof binds
/// to the public `commitment`.
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
    let root = root_from_path(&leaf, index, path, trace);
    compute_commitment(&root, count) == *commitment
}

/// Internal edges of the registry Merkle chain: a 32-byte input that an
/// earlier node call produced must be proven, not taken on trust. Siblings
/// from the authentication path are external, as is the leaf's `pubkey_hash`
/// when the SHA3 call that produced it is not part of the same witness.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct NodeEdge {
    pub producer: usize,
    pub consumer: usize,
}

/// The registry Merkle DAG extracted from a recorded verification.
#[derive(Clone, Debug)]
pub struct NodeDag {
    pub edges: Vec<NodeEdge>,
    pub external_inputs: usize,
    pub calls: usize,
}

impl NodeDag {
    /// How many times each node call's output is consumed.
    pub fn usage_counts(&self) -> Vec<u32> {
        let mut counts = vec![0u32; self.calls];
        for e in &self.edges {
            counts[e.producer] += 1;
        }
        counts
    }
}

/// Extract the 32-byte hash DAG, in evaluation order — so it is acyclic by
/// construction, exactly as [`sphincs_m2::dag::build_dag`] is for the 16-byte
/// SPHINCS+ side.
pub fn build_node_dag(trace: &PermTrace) -> NodeDag {
    let mut produced: HashMap<Digest, usize> = HashMap::with_capacity(trace.node_calls.len());
    let mut edges = Vec::new();
    let mut external_inputs = 0usize;

    for (consumer, call) in trace.node_calls.iter().enumerate() {
        for input in &call.inputs {
            match produced.get(input) {
                Some(&producer) => edges.push(NodeEdge { producer, consumer }),
                None => external_inputs += 1,
            }
        }
        produced.entry(call.output).or_insert(consumer);
    }

    NodeDag { edges, external_inputs, calls: trace.node_calls.len() }
}

/// Split a 32-byte digest into eight 32-bit limbs (little-endian), the form
/// the `MERKLE_DAG` tuples use.
pub fn node_limbs(digest: &Digest) -> [u32; 8] {
    let mut limbs = [0u32; 8];
    for (i, limb) in limbs.iter_mut().enumerate() {
        *limb = u32::from_le_bytes(digest[i * 4..(i + 1) * 4].try_into().unwrap());
    }
    limbs
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hex32(s: &str) -> Digest {
        let s = s.strip_prefix("0x").unwrap_or(s);
        let mut out = [0u8; 32];
        for (i, b) in out.iter_mut().enumerate() {
            *b = u8::from_str_radix(&s[i * 2..i * 2 + 2], 16).unwrap();
        }
        out
    }

    /// Deterministic member i, matching `ProverSetCommitmentVectors.t.sol`.
    fn member(i: usize) -> Member {
        let mut address = [0u8; 20];
        address[18..].copy_from_slice(&((0x1000 + i) as u16).to_be_bytes());

        let mut key = [0u8; 32];
        for (j, b) in key.iter_mut().enumerate() {
            *b = (i as u8 + 1) ^ (j as u8);
        }
        Member { address, pubkey_hash: pubkey_hash(&key, None) }
    }

    /// Domain separators must equal the contract's.
    /// Source: `forge test --match-contract ProverSetCommitmentVectors -vv`
    #[test]
    fn domains_match_the_contract() {
        assert_eq!(
            leaf_domain(),
            hex32("0xa81ca5017fc4ea3d0bceacea03978cfcbb02ffdffba16edde349c78f3e249972")
        );
        assert_eq!(
            node_domain(),
            hex32("0x4a1fe442c38bb4e2e0b50c1840c5c72406e0ac023ee3af5c3e3cfb7479523f53")
        );
        assert_eq!(
            set_domain(),
            hex32("0x967d0cd465d86986efdb4be0cff96ef378ec67452cf202d46b90dd34931a3e9f")
        );
    }

    /// Leaf encoding (address packing, hash order) must match the contract.
    #[test]
    fn leaf_encoding_matches_the_contract() {
        let zero = Member { address: [0u8; 20], pubkey_hash: [0u8; 32] };
        assert_eq!(
            compute_leaf(&zero, None),
            hex32("0xc5d94d28ee0ef6b9693e741bdfcce40ce6691ac1701b8f68dc2e19d99239773e")
        );

        let m = Member {
            address: member(0).address,
            pubkey_hash: hex32(
                "0x1122334455667788990011223344556677889900112233445566778899001122",
            ),
        };
        assert_eq!(
            compute_leaf(&m, None),
            hex32("0xc9e549d07da9a3d9177aa9a6b4faef5b41a704bbc6a5cc4ba2dd8dcfc759a15f")
        );
    }

    /// Roots and commitments for sets of 0..5 members, straight from the
    /// contract. This covers the empty set, the no-node single-leaf case, an
    /// exact power of two, and two zero-padded sizes.
    #[test]
    fn commitments_match_the_contract() {
        let expected: [(&str, &str); 6] = [
            (
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0xa9b72b68ed5df37c65e1f8ec7e619dd2a3b3feced8b279a9f7afd365ab841fe3",
            ),
            (
                "0x81766200bd69a562c3c22cede28a039d7de31acbeb36c92f1bc3f3331c8c88ab",
                "0xeba0e7d3acd601ad05e81cd845707d005282c9767184d7926dcd94c77d3a6ef1",
            ),
            (
                "0x8793445f7d948dea573500f4bf89d33c127bfb66f06f136058c1e7afbcd12f74",
                "0x8183636e54dd3a6a23662416b2ee1497b06764686b100b1c5309c792611687fd",
            ),
            (
                "0x7151514b9efee5dda9fe55bd5cab90713e65b2b8feb13be676466857574078f6",
                "0x8b48a5b270967e0b4deb8955eac6b416c485e2d3ba79b3c424c8703b2e77e796",
            ),
            (
                "0xac1b7d31c1693a5fda1e99b87585e38f965659ef521add882027cd5d67750466",
                "0x5c75ddd52f2d53023868e225b93eb4c768c7e2f7d079cc6768afb9e4b2e22c26",
            ),
            (
                "0xdbafe4edc8660ec819e8ebc0323a897d09241ca0da88bac5e685cfa412578fd5",
                "0xe7c67d12267e2870aaed6aa34460322d19722af0808f10d9107b91394f969987",
            ),
        ];

        for (count, (root_hex, commitment_hex)) in expected.iter().enumerate() {
            let members: Vec<Member> = (0..count).map(member).collect();
            let (root, commitment) = commit_members(&members);
            assert_eq!(root, hex32(root_hex), "root mismatch at count {count}");
            assert_eq!(
                commitment,
                hex32(commitment_hex),
                "commitment mismatch at count {count}"
            );
        }
    }

    /// Every member of a set must prove membership against the commitment.
    #[test]
    fn membership_verifies_for_every_index() {
        for count in 1..=5usize {
            let members: Vec<Member> = (0..count).map(member).collect();
            let leaves: Vec<Digest> = members.iter().map(|m| compute_leaf(m, None)).collect();
            let (_, commitment) = commit_members(&members);

            for index in 0..count {
                let path = merkle_path(&leaves, index);
                assert!(
                    verify_membership(&members[index], index, &path, count, &commitment, None),
                    "count {count} index {index} must verify"
                );
            }
        }
    }

    /// A non-member must not verify, and neither must a wrong index.
    #[test]
    fn membership_rejects_outsiders_and_wrong_positions() {
        let members: Vec<Member> = (0..5).map(member).collect();
        let leaves: Vec<Digest> = members.iter().map(|m| compute_leaf(m, None)).collect();
        let (_, commitment) = commit_members(&members);
        let path = merkle_path(&leaves, 2);

        assert!(verify_membership(&members[2], 2, &path, 5, &commitment, None));

        // Someone who was never registered.
        let outsider = member(99);
        assert!(!verify_membership(&outsider, 2, &path, 5, &commitment, None));

        // A real member, but claiming a different position.
        assert!(!verify_membership(&members[2], 3, &path, 5, &commitment, None));

        // A real member and position, but a stale member count.
        assert!(!verify_membership(&members[2], 2, &path, 4, &commitment, None));
    }

    /// The membership check must record its permutations, so the same Keccak
    /// table proves it alongside the signature verification.
    #[test]
    fn membership_records_permutations() {
        let members: Vec<Member> = (0..5).map(member).collect();
        let leaves: Vec<Digest> = members.iter().map(|m| compute_leaf(m, None)).collect();
        let (_, commitment) = commit_members(&members);
        let path = merkle_path(&leaves, 1);

        let mut trace = PermTrace::default();
        assert!(verify_membership(
            &members[1],
            1,
            &path,
            5,
            &commitment,
            Some(&mut trace)
        ));

        // 1 leaf hash + one node hash per tree level (width 8 -> 3 levels);
        // each input is a single rate block, so one permutation apiece.
        assert_eq!(path.len(), 3);
        assert_eq!(trace.len(), 1 + 3);
    }
}
