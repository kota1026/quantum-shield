//! Sparse Merkle Tree Implementation
//!
//! Reference: L3_AEGIS_ARCHITECTURE.md Section 5.3
//! Reference: contracts/src/libraries/SparseMerkleTree.sol

use aegis_core::{AegisError, Hash256, LockData, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Tree depth (256 bits for full SHA3-256 key space)
pub const TREE_DEPTH: usize = 256;

/// Domain separator for node hashing
const NODE_DOMAIN: &[u8] = b"QS_SMT_NODE_V1";

/// Domain separator for leaf hashing
const LEAF_DOMAIN: &[u8] = b"QS_SMT_LEAF_V1";

/// Merkle proof for inclusion verification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MerkleProof {
    /// Sibling hashes from leaf to root
    pub siblings: Vec<Hash256>,
    /// Whether each sibling is on the left
    pub is_left: Vec<bool>,
    /// The leaf value
    pub leaf: Hash256,
    /// Key (path) for this leaf
    pub key: Hash256,
}

impl MerkleProof {
    /// Verify proof against expected root
    pub fn verify(&self, root: &Hash256) -> bool {
        if self.siblings.len() != self.is_left.len() {
            return false;
        }

        let mut current = self.leaf;
        
        for (sibling, is_left) in self.siblings.iter().zip(self.is_left.iter()) {
            current = if *is_left {
                hash_nodes(sibling, &current)
            } else {
                hash_nodes(&current, sibling)
            };
        }

        current == *root
    }

    /// Compute the root from this proof
    pub fn compute_root(&self) -> Hash256 {
        let mut current = self.leaf;
        
        for (sibling, is_left) in self.siblings.iter().zip(self.is_left.iter()) {
            current = if *is_left {
                hash_nodes(sibling, &current)
            } else {
                hash_nodes(&current, sibling)
            };
        }

        current
    }
}

/// Hash two nodes together with domain separation
fn hash_nodes(left: &Hash256, right: &Hash256) -> Hash256 {
    let mut data = Vec::with_capacity(32 + 64);
    data.extend_from_slice(NODE_DOMAIN);
    data.extend_from_slice(&left.0);
    data.extend_from_slice(&right.0);
    Hash256::hash(&data)
}

/// Compute leaf hash with domain separation
fn compute_leaf_hash(key: &Hash256, value: &Hash256) -> Hash256 {
    let mut data = Vec::with_capacity(32 + 64);
    data.extend_from_slice(LEAF_DOMAIN);
    data.extend_from_slice(&key.0);
    data.extend_from_slice(&value.0);
    Hash256::hash(&data)
}

/// Get default hash for empty subtree at given depth
/// depth 0 = leaf level, depth TREE_DEPTH = root level
fn default_hash(depth: usize) -> Hash256 {
    static DEFAULTS: std::sync::OnceLock<Vec<Hash256>> = std::sync::OnceLock::new();
    
    let defaults = DEFAULTS.get_or_init(|| {
        let mut hashes = vec![Hash256::ZERO; TREE_DEPTH + 1];
        hashes[0] = Hash256::hash(b"EMPTY_LEAF");
        
        for i in 1..=TREE_DEPTH {
            hashes[i] = hash_nodes(&hashes[i - 1], &hashes[i - 1]);
        }
        
        hashes
    });
    
    defaults[depth]
}

/// Sparse Merkle Tree
/// 
/// In-memory implementation with optional persistence.
/// Reference: L3_AEGIS_ARCHITECTURE.md Section 5.3
/// 
/// Tree structure:
/// - Root is at depth TREE_DEPTH (256)
/// - Leaves are at depth 0
/// - At depth d, we split on bit (TREE_DEPTH - d) of the key
/// - So root splits on bit 0, depth 255 splits on bit 1, ..., depth 1 splits on bit 255
#[derive(Clone)]
pub struct SparseMerkleTree {
    /// Current root hash
    root: Hash256,
    /// Stored leaves: key -> value
    leaves: HashMap<Hash256, Hash256>,
    /// Internal nodes cache: node_hash -> (left, right)
    #[allow(dead_code)]
    nodes: HashMap<Hash256, (Hash256, Hash256)>,
    /// Lock data storage: lock_id -> LockData
    locks: HashMap<Hash256, LockData>,
}

impl SparseMerkleTree {
    /// Create new empty SMT
    pub fn new() -> Self {
        Self {
            root: default_hash(TREE_DEPTH),
            leaves: HashMap::new(),
            nodes: HashMap::new(),
            locks: HashMap::new(),
        }
    }

    /// Get current root hash
    pub fn root(&self) -> Hash256 {
        self.root
    }

    /// Check if tree is empty
    pub fn is_empty(&self) -> bool {
        self.leaves.is_empty()
    }

    /// Get number of leaves
    pub fn len(&self) -> usize {
        self.leaves.len()
    }

    /// Insert a lock into the tree
    pub fn insert_lock(&mut self, lock: &LockData) -> Result<Hash256> {
        let key = lock.lock_id;
        let value = lock.compute_leaf_hash();
        
        self.insert(key, value)?;
        self.locks.insert(key, lock.clone());
        
        Ok(self.root)
    }

    /// Get a lock by ID
    pub fn get_lock(&self, lock_id: &Hash256) -> Option<&LockData> {
        self.locks.get(lock_id)
    }

    /// Remove a lock from the tree
    pub fn remove_lock(&mut self, lock_id: &Hash256) -> Result<Hash256> {
        if !self.leaves.contains_key(lock_id) {
            return Err(AegisError::LockNotFound(format!("{}", lock_id)));
        }
        
        self.remove(lock_id)?;
        self.locks.remove(lock_id);
        
        Ok(self.root)
    }

    /// Insert key-value pair
    pub fn insert(&mut self, key: Hash256, value: Hash256) -> Result<Hash256> {
        self.leaves.insert(key, value);
        self.recompute_root();
        Ok(self.root)
    }

    /// Remove a key
    pub fn remove(&mut self, key: &Hash256) -> Result<Hash256> {
        self.leaves.remove(key);
        self.recompute_root();
        Ok(self.root)
    }

    /// Get value for key
    pub fn get(&self, key: &Hash256) -> Option<Hash256> {
        self.leaves.get(key).copied()
    }

    /// Generate proof for key
    /// 
    /// The proof is built from leaf (depth 0) to root (depth TREE_DEPTH).
    /// At each step d going from depth d to d+1:
    /// - The parent at depth d+1 splits on bit (TREE_DEPTH - 1 - d)
    /// - Sibling is the subtree with that bit flipped
    pub fn prove(&self, key: &Hash256) -> Result<MerkleProof> {
        let leaf_hash = if let Some(value) = self.leaves.get(key) {
            compute_leaf_hash(key, value)
        } else {
            default_hash(0)
        };

        let mut siblings = Vec::with_capacity(TREE_DEPTH);
        let mut is_left = Vec::with_capacity(TREE_DEPTH);

        // For each level from leaf (depth 0) to just below root
        for depth in 0..TREE_DEPTH {
            // At depth d, parent at depth d+1 splits on bit (TREE_DEPTH - 1 - d)
            // e.g., depth 0 -> parent splits on bit 255
            //       depth 255 -> parent splits on bit 0
            let bit_pos = TREE_DEPTH - 1 - depth;
            let bit = key.bit(bit_pos);
            
            // Get sibling: flip the bit at this position
            let mut sibling_prefix = *key;
            Self::flip_bit(&mut sibling_prefix, bit_pos);
            
            let sibling_hash = self.get_subtree_hash(&sibling_prefix, depth);
            
            siblings.push(sibling_hash);
            // bit=false (0) means we're on left, sibling is on right -> is_left=false
            // bit=true (1) means we're on right, sibling is on left -> is_left=true
            is_left.push(bit);
        }

        Ok(MerkleProof {
            siblings,
            is_left,
            leaf: leaf_hash,
            key: *key,
        })
    }

    /// Verify proof
    pub fn verify_proof(&self, proof: &MerkleProof) -> bool {
        proof.verify(&self.root)
    }

    /// Recompute root from all leaves
    fn recompute_root(&mut self) {
        if self.leaves.is_empty() {
            self.root = default_hash(TREE_DEPTH);
            return;
        }
        
        // Use any key as starting point (doesn't matter which)
        let any_key = *self.leaves.keys().next().unwrap();
        self.root = self.get_subtree_hash(&any_key, TREE_DEPTH);
    }

    /// Get hash of subtree rooted at the node identified by (prefix, depth)
    /// - prefix: a key whose first (TREE_DEPTH - depth) bits identify the path to this node
    /// - depth: height of this subtree (0 = leaf, TREE_DEPTH = root)
    fn get_subtree_hash(&self, prefix: &Hash256, depth: usize) -> Hash256 {
        if depth == 0 {
            // Leaf level - find exact match
            if let Some(value) = self.leaves.get(prefix) {
                return compute_leaf_hash(prefix, value);
            }
            return default_hash(0);
        }

        // Check if any leaves exist in this subtree
        // A leaf is in this subtree if its first (TREE_DEPTH - depth) bits match prefix
        let prefix_len = TREE_DEPTH - depth;
        let has_leaves = self.leaves.keys().any(|k| {
            (0..prefix_len).all(|i| k.bit(i) == prefix.bit(i))
        });

        if !has_leaves {
            return default_hash(depth);
        }

        // At this depth, we split on bit at position prefix_len
        // Get left child (bit at position prefix_len is 0)
        let mut left_prefix = *prefix;
        Self::set_bit(&mut left_prefix, prefix_len, false);
        let left_hash = self.get_subtree_hash(&left_prefix, depth - 1);

        // Get right child (bit at position prefix_len is 1)
        let mut right_prefix = *prefix;
        Self::set_bit(&mut right_prefix, prefix_len, true);
        let right_hash = self.get_subtree_hash(&right_prefix, depth - 1);

        hash_nodes(&left_hash, &right_hash)
    }

    /// Flip bit at position in key
    fn flip_bit(key: &mut Hash256, pos: usize) {
        let byte_idx = pos / 8;
        let bit_idx = 7 - (pos % 8);
        key.0[byte_idx] ^= 1 << bit_idx;
    }

    /// Set bit at position in key
    fn set_bit(key: &mut Hash256, pos: usize, value: bool) {
        let byte_idx = pos / 8;
        let bit_idx = 7 - (pos % 8);
        if value {
            key.0[byte_idx] |= 1 << bit_idx;
        } else {
            key.0[byte_idx] &= !(1 << bit_idx);
        }
    }
}

impl Default for SparseMerkleTree {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aegis_core::{Address, LockStatus};

    fn create_test_lock(id: &[u8]) -> LockData {
        LockData {
            lock_id: Hash256::hash(id),
            sender: Address::ZERO,
            recipient: Address::ZERO,
            amount: 1_000_000_000_000_000_000,
            dilithium_pubkey_hash: Hash256::ZERO,
            locked_at: 12345678,
            status: LockStatus::Active,
        }
    }

    #[test]
    fn test_new_tree_empty() {
        let smt = SparseMerkleTree::new();
        assert!(smt.is_empty());
        assert_eq!(smt.len(), 0);
    }

    #[test]
    fn test_insert_and_get() {
        let mut smt = SparseMerkleTree::new();
        let lock = create_test_lock(b"lock1");
        
        let root = smt.insert_lock(&lock).unwrap();
        assert_ne!(root, Hash256::ZERO);
        assert!(!smt.is_empty());
        
        let retrieved = smt.get_lock(&lock.lock_id);
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().amount, lock.amount);
    }

    #[test]
    fn test_proof_verification() {
        let mut smt = SparseMerkleTree::new();
        let lock = create_test_lock(b"lock1");
        
        smt.insert_lock(&lock).unwrap();
        
        let proof = smt.prove(&lock.lock_id).unwrap();
        assert!(smt.verify_proof(&proof), "Proof verification failed");
        assert_eq!(proof.compute_root(), smt.root(), "Computed root mismatch");
    }

    #[test]
    fn test_multiple_inserts() {
        let mut smt = SparseMerkleTree::new();
        
        let lock1 = create_test_lock(b"lock1");
        let lock2 = create_test_lock(b"lock2");
        let lock3 = create_test_lock(b"lock3");
        
        smt.insert_lock(&lock1).unwrap();
        let root1 = smt.root();
        
        smt.insert_lock(&lock2).unwrap();
        let root2 = smt.root();
        
        smt.insert_lock(&lock3).unwrap();
        let root3 = smt.root();
        
        // All roots should be different
        assert_ne!(root1, root2);
        assert_ne!(root2, root3);
        assert_ne!(root1, root3);
        
        // All proofs should verify
        assert!(smt.verify_proof(&smt.prove(&lock1.lock_id).unwrap()), "lock1 proof failed");
        assert!(smt.verify_proof(&smt.prove(&lock2.lock_id).unwrap()), "lock2 proof failed");
        assert!(smt.verify_proof(&smt.prove(&lock3.lock_id).unwrap()), "lock3 proof failed");
    }

    #[test]
    fn test_remove_lock() {
        let mut smt = SparseMerkleTree::new();
        let lock = create_test_lock(b"lock1");
        
        smt.insert_lock(&lock).unwrap();
        assert!(smt.get_lock(&lock.lock_id).is_some());
        
        smt.remove_lock(&lock.lock_id).unwrap();
        assert!(smt.get_lock(&lock.lock_id).is_none());
        assert!(smt.is_empty());
    }

    #[test]
    fn test_default_hash_consistency() {
        let h0 = default_hash(0);
        let h1 = default_hash(1);
        let h2 = default_hash(2);
        
        // h1 should be hash of (h0, h0)
        assert_eq!(h1, hash_nodes(&h0, &h0));
        // h2 should be hash of (h1, h1)
        assert_eq!(h2, hash_nodes(&h1, &h1));
    }
}
