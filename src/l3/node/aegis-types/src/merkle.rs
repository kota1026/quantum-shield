//! Binary Merkle Tree with SHA3-256
//!
//! Implements a proper binary Merkle tree for L3 Aegis Chain.
//! Used for transaction root calculation and state proofs.
//!
//! # CP-1 Compliance
//! Uses SHA3-256 (FIPS 202) with domain separation for quantum resistance.
//! Prohibited: keccak256, SHA-256
//!
//! # References
//! - L3_CHAIN_SPECIFICATION.md §5: State Management
//! - CORE_PRINCIPLES.md CP-1: Complete quantum resistance

use crate::Hash256;
use serde::{Deserialize, Serialize};

/// Domain separator for leaf nodes
const DOMAIN_LEAF: &[u8] = b"AEGIS_MERKLE_LEAF_V1";
/// Domain separator for internal nodes
const DOMAIN_NODE: &[u8] = b"AEGIS_MERKLE_NODE_V1";

/// Binary Merkle Tree with SHA3-256
///
/// Provides:
/// - Deterministic root calculation
/// - Domain-separated hashing (leaf vs internal nodes)
/// - Proof generation and verification
///
/// # CP-1 Compliance
/// Uses SHA3-256 (FIPS 202), not keccak256.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MerkleTree {
    /// All nodes in the tree, level by level (leaves first)
    nodes: Vec<Vec<Hash256>>,
}

impl MerkleTree {
    /// Create a Merkle tree from raw data items
    pub fn from_data<T: AsRef<[u8]>>(data: &[T]) -> Self {
        let leaves: Vec<Hash256> = data.iter().map(|d| Self::hash_leaf(d.as_ref())).collect();
        Self::from_hashes(leaves)
    }

    /// Create a Merkle tree from pre-computed hashes
    pub fn from_hashes(hashes: Vec<Hash256>) -> Self {
        if hashes.is_empty() {
            return Self { nodes: vec![] };
        }

        let mut nodes = vec![hashes];

        // Build tree bottom-up
        while nodes.last().unwrap().len() > 1 {
            let current_level = nodes.last().unwrap();
            let mut next_level = Vec::new();

            let mut i = 0;
            while i < current_level.len() {
                let left = &current_level[i];
                // If odd number of nodes, duplicate the last one
                let right = if i + 1 < current_level.len() {
                    &current_level[i + 1]
                } else {
                    left
                };
                next_level.push(Self::hash_node(left, right));
                i += 2;
            }

            nodes.push(next_level);
        }

        Self { nodes }
    }

    /// Hash a leaf node with domain separation
    pub fn hash_leaf(data: &[u8]) -> Hash256 {
        let mut input = Vec::with_capacity(DOMAIN_LEAF.len() + data.len());
        input.extend_from_slice(DOMAIN_LEAF);
        input.extend_from_slice(data);
        Hash256::hash(&input)
    }

    /// Hash an internal node with domain separation
    pub fn hash_node(left: &Hash256, right: &Hash256) -> Hash256 {
        let mut input = Vec::with_capacity(DOMAIN_NODE.len() + 64);
        input.extend_from_slice(DOMAIN_NODE);
        input.extend_from_slice(left.as_bytes());
        input.extend_from_slice(right.as_bytes());
        Hash256::hash(&input)
    }

    /// Get the Merkle root
    pub fn root(&self) -> Hash256 {
        if self.nodes.is_empty() {
            return Hash256::zero();
        }
        self.nodes.last().unwrap()[0]
    }

    /// Get the number of leaves in the tree
    pub fn leaf_count(&self) -> usize {
        if self.nodes.is_empty() { 0 } else { self.nodes[0].len() }
    }

    /// Generate a Merkle proof for a leaf at the given index
    pub fn proof(&self, index: usize) -> Option<MerkleProof> {
        if self.nodes.is_empty() || index >= self.nodes[0].len() {
            return None;
        }

        let mut siblings = Vec::new();
        let mut current_index = index;

        for level in 0..self.nodes.len() - 1 {
            let is_left = current_index % 2 == 0;
            let sibling_index = if is_left { current_index + 1 } else { current_index - 1 };

            let sibling = if sibling_index < self.nodes[level].len() {
                self.nodes[level][sibling_index]
            } else {
                self.nodes[level][current_index]
            };

            siblings.push(ProofNode { hash: sibling, is_left: !is_left });
            current_index /= 2;
        }

        Some(MerkleProof { leaf: self.nodes[0][index], siblings, root: self.root() })
    }
}

/// A node in a Merkle proof
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProofNode {
    pub hash: Hash256,
    pub is_left: bool,
}

/// Merkle inclusion proof
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MerkleProof {
    pub leaf: Hash256,
    pub siblings: Vec<ProofNode>,
    pub root: Hash256,
}

impl MerkleProof {
    /// Verify the proof
    pub fn verify(&self) -> bool {
        let mut current = self.leaf;
        for node in &self.siblings {
            current = if node.is_left {
                MerkleTree::hash_node(&node.hash, &current)
            } else {
                MerkleTree::hash_node(&current, &node.hash)
            };
        }
        current == self.root
    }

    /// Verify the proof against a specific root
    pub fn verify_against(&self, expected_root: &Hash256) -> bool {
        let mut current = self.leaf;
        for node in &self.siblings {
            current = if node.is_left {
                MerkleTree::hash_node(&node.hash, &current)
            } else {
                MerkleTree::hash_node(&current, &node.hash)
            };
        }
        current == *expected_root
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_tree() {
        let tree = MerkleTree::from_hashes(vec![]);
        assert!(tree.root().is_zero());
        assert_eq!(tree.leaf_count(), 0);
    }

    #[test]
    fn test_single_leaf() {
        let data = b"hello world";
        let tree = MerkleTree::from_data(&[data]);
        assert_eq!(tree.leaf_count(), 1);
        assert!(!tree.root().is_zero());
        let expected = MerkleTree::hash_leaf(data);
        assert_eq!(tree.root(), expected);
    }

    #[test]
    fn test_two_leaves() {
        let data = [b"hello".as_slice(), b"world".as_slice()];
        let tree = MerkleTree::from_data(&data);
        assert_eq!(tree.leaf_count(), 2);
        let left = MerkleTree::hash_leaf(b"hello");
        let right = MerkleTree::hash_leaf(b"world");
        let expected = MerkleTree::hash_node(&left, &right);
        assert_eq!(tree.root(), expected);
    }

    #[test]
    fn test_three_leaves_odd() {
        let data = [b"a".as_slice(), b"b".as_slice(), b"c".as_slice()];
        let tree = MerkleTree::from_data(&data);
        assert_eq!(tree.leaf_count(), 3);
        let a = MerkleTree::hash_leaf(b"a");
        let b = MerkleTree::hash_leaf(b"b");
        let c = MerkleTree::hash_leaf(b"c");
        let ab = MerkleTree::hash_node(&a, &b);
        let cc = MerkleTree::hash_node(&c, &c);
        let expected = MerkleTree::hash_node(&ab, &cc);
        assert_eq!(tree.root(), expected);
    }

    #[test]
    fn test_four_leaves() {
        let data = [b"a".as_slice(), b"b".as_slice(), b"c".as_slice(), b"d".as_slice()];
        let tree = MerkleTree::from_data(&data);
        assert_eq!(tree.leaf_count(), 4);
        let a = MerkleTree::hash_leaf(b"a");
        let b = MerkleTree::hash_leaf(b"b");
        let c = MerkleTree::hash_leaf(b"c");
        let d = MerkleTree::hash_leaf(b"d");
        let ab = MerkleTree::hash_node(&a, &b);
        let cd = MerkleTree::hash_node(&c, &d);
        let expected = MerkleTree::hash_node(&ab, &cd);
        assert_eq!(tree.root(), expected);
    }

    #[test]
    fn test_deterministic() {
        let data = [b"hello".as_slice(), b"world".as_slice()];
        let tree1 = MerkleTree::from_data(&data);
        let tree2 = MerkleTree::from_data(&data);
        assert_eq!(tree1.root(), tree2.root());
    }

    #[test]
    fn test_order_matters() {
        let tree1 = MerkleTree::from_data(&[b"a".as_slice(), b"b".as_slice()]);
        let tree2 = MerkleTree::from_data(&[b"b".as_slice(), b"a".as_slice()]);
        assert_ne!(tree1.root(), tree2.root());
    }

    #[test]
    fn test_domain_separation() {
        let data = [0u8; 64];
        let leaf_hash = MerkleTree::hash_leaf(&data);
        let left = Hash256::hash(&data[..32]);
        let right = Hash256::hash(&data[32..]);
        let node_hash = MerkleTree::hash_node(&left, &right);
        assert_ne!(leaf_hash, node_hash);
    }

    #[test]
    fn test_proof_single_leaf() {
        let data = b"hello";
        let tree = MerkleTree::from_data(&[data]);
        let proof = tree.proof(0).unwrap();
        assert!(proof.verify());
        assert!(proof.siblings.is_empty());
    }

    #[test]
    fn test_proof_two_leaves() {
        let data = [b"hello".as_slice(), b"world".as_slice()];
        let tree = MerkleTree::from_data(&data);
        let proof0 = tree.proof(0).unwrap();
        assert!(proof0.verify());
        assert_eq!(proof0.siblings.len(), 1);
        let proof1 = tree.proof(1).unwrap();
        assert!(proof1.verify());
        assert_eq!(proof1.siblings.len(), 1);
    }

    #[test]
    fn test_proof_four_leaves() {
        let data = [b"a".as_slice(), b"b".as_slice(), b"c".as_slice(), b"d".as_slice()];
        let tree = MerkleTree::from_data(&data);
        for i in 0..4 {
            let proof = tree.proof(i).unwrap();
            assert!(proof.verify(), "Proof for index {} failed", i);
            assert_eq!(proof.siblings.len(), 2);
        }
    }

    #[test]
    fn test_proof_invalid_index() {
        let data = [b"hello".as_slice(), b"world".as_slice()];
        let tree = MerkleTree::from_data(&data);
        assert!(tree.proof(5).is_none());
    }

    #[test]
    fn test_proof_verify_against() {
        let data = [b"hello".as_slice(), b"world".as_slice()];
        let tree = MerkleTree::from_data(&data);
        let proof = tree.proof(0).unwrap();
        assert!(proof.verify_against(&tree.root()));
        let fake_root = Hash256::hash(b"fake");
        assert!(!proof.verify_against(&fake_root));
    }

    #[test]
    fn test_cp1_sha3_256_output() {
        let data = b"test data";
        let tree = MerkleTree::from_data(&[data]);
        assert_eq!(tree.root().as_bytes().len(), 32);
    }

    #[test]
    fn test_from_hashes() {
        let hashes = vec![Hash256::hash(b"a"), Hash256::hash(b"b"), Hash256::hash(b"c")];
        let tree = MerkleTree::from_hashes(hashes.clone());
        assert_eq!(tree.leaf_count(), 3);
        assert!(!tree.root().is_zero());
        let tree2 = MerkleTree::from_hashes(hashes);
        assert_eq!(tree.root(), tree2.root());
    }
}
