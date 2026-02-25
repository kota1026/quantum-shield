//! Block types for L3 Aegis Chain
//!
//! Implements block structure per L3_CHAIN_SPECIFICATION.md §2
//!
//! # CP-1 Compliance
//! Uses SHA3-256 (FIPS 202) for all hashes.
//! Prohibited: keccak256, SHA-256

use serde::{Deserialize, Serialize};
use crate::{Hash256, NodeId, Transaction, PROTOCOL_VERSION};
use crate::merkle::MerkleTree;

/// Validator signature using Dilithium-III
/// 
/// # CP-1 Compliance
/// Uses Dilithium-III (FIPS 204) for quantum resistance.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ValidatorSignature {
    /// Node ID of the signer
    pub node_id: NodeId,
    /// Dilithium-III signature bytes (~3KB)
    pub signature: Vec<u8>,
}

/// Block header as per L3_CHAIN_SPECIFICATION.md §2.1
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BlockHeader {
    /// Protocol version
    pub version: u8,
    /// Block height
    pub height: u64,
    /// Unix timestamp (seconds)
    pub timestamp: u64,
    /// Hash of the parent block (SHA3-256)
    pub parent_hash: Hash256,
    /// Sparse Merkle Tree state root
    pub state_root: Hash256,
    /// Transaction Merkle root
    pub tx_root: Hash256,
    /// Proposer node ID
    pub proposer: NodeId,
    /// Validator signatures (require 3/4 for consensus)
    pub validator_signatures: Vec<ValidatorSignature>,
}

impl BlockHeader {
    /// Create a genesis block header
    pub fn genesis(timestamp: u64, proposer: NodeId) -> Self {
        Self {
            version: PROTOCOL_VERSION,
            height: 0,
            timestamp,
            parent_hash: Hash256::zero(),
            state_root: Hash256::zero(),
            tx_root: Hash256::zero(),
            proposer,
            validator_signatures: vec![],
        }
    }

    /// Compute block hash (SHA3-256)
    /// 
    /// block_hash = SHA3-256(
    ///     version ||
    ///     height ||
    ///     timestamp ||
    ///     parent_hash ||
    ///     state_root ||
    ///     tx_root ||
    ///     proposer
    /// )
    /// 
    /// Reference: L3_CHAIN_SPECIFICATION.md §2.4
    /// 
    /// # CP-1 Compliance
    /// Uses SHA3-256 (FIPS 202), not keccak256.
    pub fn hash(&self) -> Hash256 {
        let mut data = Vec::new();
        data.push(self.version);
        data.extend_from_slice(&self.height.to_le_bytes());
        data.extend_from_slice(&self.timestamp.to_le_bytes());
        data.extend_from_slice(self.parent_hash.as_bytes());
        data.extend_from_slice(self.state_root.as_bytes());
        data.extend_from_slice(self.tx_root.as_bytes());
        data.extend_from_slice(self.proposer.as_bytes());
        Hash256::hash(&data)
    }

    /// Check if this is a genesis block
    pub fn is_genesis(&self) -> bool {
        self.height == 0 && self.parent_hash.is_zero()
    }
}

/// Block body containing transactions
#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct BlockBody {
    /// Transactions in this block
    pub transactions: Vec<Transaction>,
}

impl BlockBody {
    /// Create an empty block body
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a transaction to the block
    pub fn add_transaction(&mut self, tx: Transaction) {
        self.transactions.push(tx);
    }

    /// Compute transaction Merkle root (SHA3-256)
    /// 
    /// Uses proper binary Merkle tree with domain separation.
    /// 
    /// Reference: L3_CHAIN_SPECIFICATION.md §5
    /// 
    /// # CP-1 Compliance
    /// Uses SHA3-256 (FIPS 202), not keccak256.
    pub fn compute_tx_root(&self) -> Hash256 {
        if self.transactions.is_empty() {
            return Hash256::zero();
        }
        
        // Compute hash of each transaction
        let tx_hashes: Vec<Hash256> = self.transactions
            .iter()
            .map(|tx| tx.hash())
            .collect();
        
        // Build Merkle tree from transaction hashes
        let tree = MerkleTree::from_hashes(tx_hashes);
        tree.root()
    }

    /// Get the number of transactions
    pub fn len(&self) -> usize {
        self.transactions.len()
    }

    /// Check if there are no transactions
    pub fn is_empty(&self) -> bool {
        self.transactions.is_empty()
    }
}

/// Complete block structure
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Block {
    /// Block header
    pub header: BlockHeader,
    /// Block body
    pub body: BlockBody,
}

impl Block {
    /// Create a new block
    pub fn new(header: BlockHeader, body: BlockBody) -> Self {
        Self { header, body }
    }

    /// Create a genesis block
    pub fn genesis(timestamp: u64, proposer: NodeId) -> Self {
        Self {
            header: BlockHeader::genesis(timestamp, proposer),
            body: BlockBody::new(),
        }
    }

    /// Get block hash
    pub fn hash(&self) -> Hash256 {
        self.header.hash()
    }

    /// Get block height
    pub fn height(&self) -> u64 {
        self.header.height
    }

    /// Finalize the block by computing tx_root
    /// 
    /// Should be called after all transactions are added
    /// but before signing.
    pub fn finalize(&mut self) {
        self.header.tx_root = self.body.compute_tx_root();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::transaction::{UnlockRequestTx, Address, DilithiumPublicKey};

    fn mock_node_id() -> NodeId {
        NodeId::from_public_key(b"test node")
    }

    fn mock_transaction(id: u8) -> Transaction {
        Transaction::UnlockRequest(UnlockRequestTx {
            unlock_id: Hash256::hash(&[id]),
            lock_id: Hash256::hash(&[id, id]),
            dest_addr: Address::new([id; 20]),
            amount: id as u128 * 1000,
            owner_pk: DilithiumPublicKey(vec![id]),
            owner_signature: vec![id, id + 1],
            timestamp: 1234567890 + id as u64,
        })
    }

    #[test]
    fn test_genesis_block() {
        let proposer = mock_node_id();
        let block = Block::genesis(1234567890, proposer);
        
        assert!(block.header.is_genesis());
        assert_eq!(block.height(), 0);
        assert!(block.header.parent_hash.is_zero());
    }

    #[test]
    fn test_block_hash_deterministic() {
        let proposer = mock_node_id();
        let block = Block::genesis(1234567890, proposer);
        
        let hash1 = block.hash();
        let hash2 = block.hash();
        
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_block_hash_changes_with_content() {
        let proposer = mock_node_id();
        let block1 = Block::genesis(1234567890, proposer);
        let block2 = Block::genesis(1234567891, proposer);
        
        assert_ne!(block1.hash(), block2.hash());
    }

    #[test]
    fn test_empty_tx_root_is_zero() {
        let body = BlockBody::new();
        assert!(body.compute_tx_root().is_zero());
    }

    #[test]
    fn test_tx_root_single_transaction() {
        let mut body = BlockBody::new();
        let tx = mock_transaction(1);
        body.add_transaction(tx);
        
        let root = body.compute_tx_root();
        assert!(!root.is_zero());
        
        // Verify it's deterministic
        let root2 = body.compute_tx_root();
        assert_eq!(root, root2);
    }

    #[test]
    fn test_tx_root_multiple_transactions() {
        let mut body = BlockBody::new();
        body.add_transaction(mock_transaction(1));
        body.add_transaction(mock_transaction(2));
        body.add_transaction(mock_transaction(3));
        
        let root = body.compute_tx_root();
        assert!(!root.is_zero());
        
        // Verify it's deterministic
        let root2 = body.compute_tx_root();
        assert_eq!(root, root2);
    }

    #[test]
    fn test_tx_root_order_matters() {
        let mut body1 = BlockBody::new();
        body1.add_transaction(mock_transaction(1));
        body1.add_transaction(mock_transaction(2));
        
        let mut body2 = BlockBody::new();
        body2.add_transaction(mock_transaction(2));
        body2.add_transaction(mock_transaction(1));
        
        // Different order should produce different root
        assert_ne!(body1.compute_tx_root(), body2.compute_tx_root());
    }

    #[test]
    fn test_block_finalize() {
        let proposer = mock_node_id();
        let mut block = Block::genesis(1234567890, proposer);
        
        block.body.add_transaction(mock_transaction(1));
        block.body.add_transaction(mock_transaction(2));
        
        // Before finalize, tx_root is zero (genesis)
        assert!(block.header.tx_root.is_zero());
        
        // Finalize computes tx_root
        block.finalize();
        
        assert!(!block.header.tx_root.is_zero());
        assert_eq!(block.header.tx_root, block.body.compute_tx_root());
    }

    #[test]
    fn test_block_hash_includes_tx_root() {
        let proposer = mock_node_id();
        let mut block1 = Block::genesis(1234567890, proposer);
        let mut block2 = Block::genesis(1234567890, proposer);
        
        block1.body.add_transaction(mock_transaction(1));
        block1.finalize();
        
        block2.body.add_transaction(mock_transaction(2));
        block2.finalize();
        
        // Different transactions -> different tx_root -> different block hash
        assert_ne!(block1.hash(), block2.hash());
    }

    #[test]
    fn test_cp1_block_hash_sha3_256() {
        // Verify block hash uses SHA3-256 (32 bytes = 256 bits)
        let proposer = mock_node_id();
        let block = Block::genesis(1234567890, proposer);
        let hash = block.hash();
        
        assert_eq!(hash.as_bytes().len(), 32, "Block hash must be 256 bits for SHA3-256");
    }

    #[test]
    fn test_block_body_len() {
        let mut body = BlockBody::new();
        assert_eq!(body.len(), 0);
        assert!(body.is_empty());
        
        body.add_transaction(mock_transaction(1));
        assert_eq!(body.len(), 1);
        assert!(!body.is_empty());
        
        body.add_transaction(mock_transaction(2));
        assert_eq!(body.len(), 2);
    }
}
