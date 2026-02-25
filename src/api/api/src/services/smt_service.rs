//! Sparse Merkle Tree (SMT) Service
//!
//! Implements the SMT state management for Quantum Shield's L3 layer.
//! Uses SHA3-256 for all hashing (CP-1 compliant).
//!
//! ## L3 SMT Specification (L3_CHAIN_SPECIFICATION.md §5.1)
//! - Hash: SHA3-256
//! - Depth: 256-bit
//! - Proof: Merkle Proof (sibling hashes from leaf to root)
//!
//! ## BE Rules Compliance
//! - BE-001: No stubs - real SMT proof generation
//! - BE-003: Full logging of all SMT operations

use sha3::{Digest, Sha3_256};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tracing::{info, instrument};

use crate::error::ApiError;

/// SMT tree depth (256-bit keys)
const SMT_DEPTH: usize = 256;

/// Empty leaf hash (SHA3-256 of empty string)
fn empty_leaf_hash() -> [u8; 32] {
    let mut hasher = Sha3_256::new();
    hasher.update(b"");
    hasher.finalize().into()
}

/// Compute SHA3-256 hash of two nodes
fn hash_nodes(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Sha3_256::new();
    hasher.update(left);
    hasher.update(right);
    hasher.finalize().into()
}

/// SMT Leaf representing a lock state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmtLeaf {
    /// Lock ID (256-bit key)
    pub lock_id: String,
    /// State root (SR_0)
    pub state_root: String,
    /// Leaf index in the tree
    pub leaf_index: u64,
    /// Timestamp of insertion
    pub inserted_at: u64,
}

/// SMT Proof containing the path from leaf to root
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmtProof {
    /// The leaf being proven
    pub leaf: SmtLeaf,
    /// Sibling hashes from leaf to root
    /// Each element is (sibling_hash, is_left) where is_left indicates
    /// if the sibling is on the left (true) or right (false)
    pub siblings: Vec<(String, bool)>,
    /// The root hash at the time of proof generation
    pub root: String,
}

/// Sparse Merkle Tree implementation
///
/// Uses a simple representation that stores:
/// - Non-empty leaves with their hashes
/// - Pre-computed empty subtree hashes for efficient proof generation
pub struct SparseMerkleTree {
    /// Non-empty leaves: key (256-bit) -> leaf hash
    leaves: HashMap<[u8; 32], [u8; 32]>,
    /// Leaf data: lock_id -> SmtLeaf
    leaf_data: HashMap<String, SmtLeaf>,
    /// Current root hash
    root: [u8; 32],
    /// Total leaves inserted
    leaf_count: u64,
    /// Pre-computed empty subtree hashes for each level
    /// empty_hashes[0] = hash of empty leaf
    /// empty_hashes[i] = hash(empty_hashes[i-1], empty_hashes[i-1])
    empty_hashes: Vec<[u8; 32]>,
}

impl SparseMerkleTree {
    /// Create a new empty SMT
    pub fn new() -> Self {
        // Pre-compute empty subtree hashes for all levels
        let mut empty_hashes = vec![[0u8; 32]; SMT_DEPTH + 1];
        empty_hashes[0] = empty_leaf_hash();

        for i in 1..=SMT_DEPTH {
            empty_hashes[i] = hash_nodes(&empty_hashes[i - 1], &empty_hashes[i - 1]);
        }

        Self {
            leaves: HashMap::new(),
            leaf_data: HashMap::new(),
            root: empty_hashes[SMT_DEPTH],
            leaf_count: 0,
            empty_hashes,
        }
    }

    /// Convert lock_id to 256-bit key
    fn lock_id_to_key(lock_id: &str) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        hasher.update(lock_id.as_bytes());
        hasher.finalize().into()
    }

    /// Compute leaf hash from lock_id and state_root
    fn compute_leaf_hash(lock_id: &str, state_root: &str) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        hasher.update(b"QS_SMT_LEAF_V1");
        hasher.update(lock_id.as_bytes());
        hasher.update(state_root.as_bytes());
        hasher.finalize().into()
    }

    /// Get bit at position (0 = MSB) from key
    fn get_bit(key: &[u8; 32], position: usize) -> bool {
        let byte_index = position / 8;
        let bit_index = 7 - (position % 8);
        (key[byte_index] >> bit_index) & 1 == 1
    }

    /// Insert a leaf into the tree
    pub fn insert(&mut self, lock_id: &str, state_root: &str) -> u64 {
        let key = Self::lock_id_to_key(lock_id);
        let leaf_hash = Self::compute_leaf_hash(lock_id, state_root);

        // Store leaf
        self.leaves.insert(key, leaf_hash);
        self.leaf_count += 1;

        let leaf_index = self.leaf_count;
        let leaf = SmtLeaf {
            lock_id: lock_id.to_string(),
            state_root: state_root.to_string(),
            leaf_index,
            inserted_at: chrono::Utc::now().timestamp() as u64,
        };
        self.leaf_data.insert(lock_id.to_string(), leaf);

        // Recompute root
        self.root = self.compute_root();

        leaf_index
    }

    /// Compute root hash from all leaves
    fn compute_root(&self) -> [u8; 32] {
        if self.leaves.is_empty() {
            return self.empty_hashes[SMT_DEPTH];
        }

        // Collect all leaf keys
        let keys: Vec<[u8; 32]> = self.leaves.keys().cloned().collect();

        // Recursively compute subtree hash
        self.compute_subtree_hash(&keys, 0)
    }

    /// Compute hash of a subtree containing the given keys at the given depth
    fn compute_subtree_hash(&self, keys: &[[u8; 32]], depth: usize) -> [u8; 32] {
        if keys.is_empty() {
            return self.empty_hashes[SMT_DEPTH - depth];
        }

        if depth == SMT_DEPTH {
            // At leaf level
            if keys.len() == 1 {
                return *self.leaves.get(&keys[0]).unwrap_or(&self.empty_hashes[0]);
            }
            // Multiple keys at same position shouldn't happen with proper hashing
            return self.empty_hashes[0];
        }

        // Split keys into left and right subtrees
        let (left_keys, right_keys): (Vec<_>, Vec<_>) = keys.iter()
            .partition(|k| !Self::get_bit(k, depth));

        let left_hash = self.compute_subtree_hash(&left_keys, depth + 1);
        let right_hash = self.compute_subtree_hash(&right_keys, depth + 1);

        hash_nodes(&left_hash, &right_hash)
    }

    /// Get sibling hash at given depth for a key (used in proof generation)
    fn get_sibling_hash(&self, key: &[u8; 32], depth: usize) -> [u8; 32] {
        let is_right = Self::get_bit(key, depth);

        // Find all keys in the sibling subtree
        let sibling_keys: Vec<[u8; 32]> = self.leaves.keys()
            .filter(|k| {
                // Must match path up to depth
                for d in 0..depth {
                    if Self::get_bit(k, d) != Self::get_bit(key, d) {
                        return false;
                    }
                }
                // At depth, must be on opposite side
                Self::get_bit(k, depth) != is_right
            })
            .cloned()
            .collect();

        if sibling_keys.is_empty() {
            self.empty_hashes[SMT_DEPTH - depth - 1]
        } else {
            self.compute_subtree_hash(&sibling_keys, depth + 1)
        }
    }

    /// Generate Merkle proof for a leaf
    pub fn generate_proof(&self, lock_id: &str) -> Option<SmtProof> {
        let key = Self::lock_id_to_key(lock_id);

        // Check if leaf exists
        let leaf_data = self.leaf_data.get(lock_id)?;
        let _leaf_hash = self.leaves.get(&key)?;

        // Generate sibling hashes for path from leaf to root
        let mut siblings = Vec::with_capacity(SMT_DEPTH);

        for depth in (0..SMT_DEPTH).rev() {
            let is_right = Self::get_bit(&key, depth);
            let sibling_hash = self.get_sibling_hash(&key, depth);
            siblings.push((format!("0x{}", hex::encode(sibling_hash)), !is_right));
        }

        Some(SmtProof {
            leaf: leaf_data.clone(),
            siblings,
            root: format!("0x{}", hex::encode(self.root)),
        })
    }

    /// Verify a proof
    pub fn verify_proof(proof: &SmtProof) -> bool {
        // Compute leaf hash
        let mut current_hash = Self::compute_leaf_hash(&proof.leaf.lock_id, &proof.leaf.state_root);
        let key = Self::lock_id_to_key(&proof.leaf.lock_id);

        // Walk up the tree
        for (i, (sibling_hex, is_left)) in proof.siblings.iter().enumerate() {
            let depth = SMT_DEPTH - 1 - i;

            // Parse sibling hash
            let sibling_hex = sibling_hex.trim_start_matches("0x");
            let sibling: [u8; 32] = match hex::decode(sibling_hex) {
                Ok(bytes) if bytes.len() == 32 => {
                    let mut arr = [0u8; 32];
                    arr.copy_from_slice(&bytes);
                    arr
                }
                _ => return false,
            };

            // Hash with sibling in correct order
            let is_right = Self::get_bit(&key, depth);
            current_hash = if is_right {
                hash_nodes(&sibling, &current_hash)
            } else {
                hash_nodes(&current_hash, &sibling)
            };
        }

        // Compare with claimed root
        let root_hex = proof.root.trim_start_matches("0x");
        if let Ok(root_bytes) = hex::decode(root_hex) {
            if root_bytes.len() == 32 {
                return current_hash[..] == root_bytes[..];
            }
        }

        false
    }

    /// Get current root hash
    pub fn root(&self) -> String {
        format!("0x{}", hex::encode(self.root))
    }

    /// Get leaf count
    pub fn leaf_count(&self) -> u64 {
        self.leaf_count
    }

    /// Get leaf data by lock_id
    pub fn get_leaf(&self, lock_id: &str) -> Option<&SmtLeaf> {
        self.leaf_data.get(lock_id)
    }
}

impl Default for SparseMerkleTree {
    fn default() -> Self {
        Self::new()
    }
}

/// SMT Service for API integration
///
/// Thread-safe wrapper around SparseMerkleTree
pub struct SmtService {
    tree: RwLock<SparseMerkleTree>,
}

impl SmtService {
    /// Create a new SMT service
    pub fn new() -> Self {
        Self {
            tree: RwLock::new(SparseMerkleTree::new()),
        }
    }

    /// Insert a lock into the SMT and return the leaf index
    #[instrument(skip(self), fields(lock_id = %lock_id))]
    pub fn insert_lock(&self, lock_id: &str, state_root: &str) -> Result<u64, ApiError> {
        info!("Inserting lock into SMT: lock_id={}, sr_0={}", lock_id, state_root);

        let mut tree = self.tree.write().map_err(|e| {
            ApiError::Internal(format!("SMT lock error: {}", e))
        })?;

        let leaf_index = tree.insert(lock_id, state_root);

        info!(
            "Lock inserted into SMT: lock_id={}, leaf_index={}, new_root={}",
            lock_id,
            leaf_index,
            tree.root()
        );

        Ok(leaf_index)
    }

    /// Generate SMT proof for a lock
    #[instrument(skip(self), fields(lock_id = %lock_id))]
    pub fn generate_proof(&self, lock_id: &str) -> Result<SmtProof, ApiError> {
        info!("Generating SMT proof for lock: {}", lock_id);

        let tree = self.tree.read().map_err(|e| {
            ApiError::Internal(format!("SMT lock error: {}", e))
        })?;

        let proof = tree.generate_proof(lock_id).ok_or_else(|| {
            ApiError::NotFound(format!("Lock not found in SMT: {}", lock_id))
        })?;

        info!(
            "SMT proof generated: lock_id={}, root={}, siblings_count={}",
            lock_id,
            proof.root,
            proof.siblings.len()
        );

        Ok(proof)
    }

    /// Verify an SMT proof
    pub fn verify_proof(&self, proof: &SmtProof) -> bool {
        SparseMerkleTree::verify_proof(proof)
    }

    /// Get current SMT root
    pub fn get_root(&self) -> Result<String, ApiError> {
        let tree = self.tree.read().map_err(|e| {
            ApiError::Internal(format!("SMT lock error: {}", e))
        })?;
        Ok(tree.root())
    }

    /// Get leaf count
    pub fn get_leaf_count(&self) -> Result<u64, ApiError> {
        let tree = self.tree.read().map_err(|e| {
            ApiError::Internal(format!("SMT lock error: {}", e))
        })?;
        Ok(tree.leaf_count())
    }

    /// Get leaf by lock_id
    pub fn get_leaf(&self, lock_id: &str) -> Result<Option<SmtLeaf>, ApiError> {
        let tree = self.tree.read().map_err(|e| {
            ApiError::Internal(format!("SMT lock error: {}", e))
        })?;
        Ok(tree.get_leaf(lock_id).cloned())
    }

    /// Serialize proof to hex string for API response
    pub fn proof_to_hex(proof: &SmtProof) -> String {
        // Format: leaf_hash || root || sibling_count || siblings
        let leaf_hash = SparseMerkleTree::compute_leaf_hash(&proof.leaf.lock_id, &proof.leaf.state_root);

        let mut data = Vec::new();
        data.extend_from_slice(&leaf_hash);

        // Add root
        let root_bytes = hex::decode(proof.root.trim_start_matches("0x")).unwrap_or_default();
        data.extend_from_slice(&root_bytes);

        // Add siblings count (2 bytes)
        let count = proof.siblings.len() as u16;
        data.extend_from_slice(&count.to_be_bytes());

        // Add each sibling with direction flag
        for (sibling_hex, is_left) in &proof.siblings {
            let sibling_bytes = hex::decode(sibling_hex.trim_start_matches("0x")).unwrap_or_default();
            data.extend_from_slice(&sibling_bytes);
            data.push(if *is_left { 1 } else { 0 });
        }

        format!("0x{}", hex::encode(data))
    }
}

impl Default for SmtService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_tree() {
        let tree = SparseMerkleTree::new();
        assert_eq!(tree.leaf_count(), 0);
        // Empty tree should have a deterministic root
        let root = tree.root();
        assert!(root.starts_with("0x"));
        assert_eq!(root.len(), 66); // 0x + 64 hex chars
    }

    #[test]
    fn test_insert_and_proof() {
        let mut tree = SparseMerkleTree::new();

        let lock_id = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        let sr_0 = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

        let leaf_index = tree.insert(lock_id, sr_0);
        assert_eq!(leaf_index, 1);

        // Generate proof
        let proof = tree.generate_proof(lock_id).expect("Proof should exist");
        assert_eq!(proof.leaf.lock_id, lock_id);
        assert_eq!(proof.leaf.state_root, sr_0);
        assert_eq!(proof.siblings.len(), SMT_DEPTH);

        // Verify proof
        assert!(SparseMerkleTree::verify_proof(&proof));
    }

    #[test]
    fn test_multiple_inserts() {
        let mut tree = SparseMerkleTree::new();

        let lock_ids = vec![
            "0x1111111111111111111111111111111111111111111111111111111111111111",
            "0x2222222222222222222222222222222222222222222222222222222222222222",
            "0x3333333333333333333333333333333333333333333333333333333333333333",
        ];

        for (i, lock_id) in lock_ids.iter().enumerate() {
            let sr_0 = format!("0x{:064}", i + 1);
            tree.insert(lock_id, &sr_0);
        }

        assert_eq!(tree.leaf_count(), 3);

        // All proofs should be valid
        for (i, lock_id) in lock_ids.iter().enumerate() {
            let proof = tree.generate_proof(lock_id).expect("Proof should exist");
            assert!(SparseMerkleTree::verify_proof(&proof), "Proof {} should be valid", i);
        }
    }

    #[test]
    fn test_proof_serialization() {
        let mut tree = SparseMerkleTree::new();
        let lock_id = "0xtest_lock_id";
        let sr_0 = "0xtest_sr_0";

        tree.insert(lock_id, sr_0);
        let proof = tree.generate_proof(lock_id).unwrap();

        let hex_proof = SmtService::proof_to_hex(&proof);
        assert!(hex_proof.starts_with("0x"));
    }

    #[test]
    fn test_smt_service() {
        let service = SmtService::new();

        let lock_id = "0xtest_lock";
        let sr_0 = "0xtest_state_root";

        // Insert
        let leaf_index = service.insert_lock(lock_id, sr_0).unwrap();
        assert_eq!(leaf_index, 1);

        // Get leaf
        let leaf = service.get_leaf(lock_id).unwrap();
        assert!(leaf.is_some());
        assert_eq!(leaf.unwrap().lock_id, lock_id);

        // Generate proof
        let proof = service.generate_proof(lock_id).unwrap();
        assert!(service.verify_proof(&proof));

        // Root should change after insert
        let root = service.get_root().unwrap();
        assert!(root.starts_with("0x"));
    }

    #[test]
    fn test_root_changes_with_inserts() {
        let mut tree = SparseMerkleTree::new();
        let root_empty = tree.root();

        tree.insert("lock1", "sr1");
        let root_1 = tree.root();
        assert_ne!(root_empty, root_1);

        tree.insert("lock2", "sr2");
        let root_2 = tree.root();
        assert_ne!(root_1, root_2);
    }
}
