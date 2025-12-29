//! Block types for L3 Aegis Chain
//!
//! Implements block structure per L3_CHAIN_SPECIFICATION.md §2

use serde::{Deserialize, Serialize};
use crate::{Hash256, NodeId, Transaction, PROTOCOL_VERSION};

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
    pub fn compute_tx_root(&self) -> Hash256 {
        if self.transactions.is_empty() {
            return Hash256::zero();
        }
        
        // Simple Merkle root: hash of concatenated tx hashes
        // TODO: Implement proper binary Merkle tree
        let mut data = Vec::new();
        for tx in &self.transactions {
            let tx_bytes = serde_json::to_vec(tx).unwrap_or_default();
            let tx_hash = Hash256::hash(&tx_bytes);
            data.extend_from_slice(tx_hash.as_bytes());
        }
        Hash256::hash(&data)
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
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mock_node_id() -> NodeId {
        NodeId::from_public_key(b"test node")
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
        let block2 = Block::genesis(1234567891, proposer); // Different timestamp
        
        assert_ne!(block1.hash(), block2.hash());
    }

    #[test]
    fn test_empty_tx_root_is_zero() {
        let body = BlockBody::new();
        assert!(body.compute_tx_root().is_zero());
    }
}
