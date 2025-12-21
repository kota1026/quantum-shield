//! Consensus Message Types
//!
//! Defines all message types used in the PBFT consensus protocol.

use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};

/// Node identifier (0-3 for 4-node network)
pub type NodeId = u8;

/// Block height
pub type Height = u64;

/// View number (increments on view change)
pub type View = u64;

/// 32-byte hash
pub type Hash256 = [u8; 32];

/// Consensus message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    /// Pre-prepare phase (sent by primary)
    PrePrepare,
    /// Prepare phase (sent by all nodes)
    Prepare,
    /// Commit phase (sent by all nodes)
    Commit,
    /// View change request
    ViewChange,
    /// New view announcement
    NewView,
}

/// Full consensus message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusMessage {
    /// Message type
    pub msg_type: MessageType,
    /// Current view number
    pub view: View,
    /// Block height (sequence number)
    pub height: Height,
    /// Block digest
    pub digest: Hash256,
    /// Sender node ID
    pub sender: NodeId,
    /// Sender's signature over the message
    pub signature: Vec<u8>,
    /// Optional block data (only in PrePrepare)
    pub block: Option<Block>,
}

impl ConsensusMessage {
    /// Create a new message
    pub fn new(
        msg_type: MessageType,
        view: View,
        height: Height,
        digest: Hash256,
        sender: NodeId,
    ) -> Self {
        Self {
            msg_type,
            view,
            height,
            digest,
            sender,
            signature: Vec::new(),
            block: None,
        }
    }

    /// Create a PrePrepare message with block
    pub fn pre_prepare(view: View, height: Height, block: Block, sender: NodeId) -> Self {
        let digest = block.compute_hash();
        Self {
            msg_type: MessageType::PrePrepare,
            view,
            height,
            digest,
            sender,
            signature: Vec::new(),
            block: Some(block),
        }
    }

    /// Create a Prepare message
    pub fn prepare(view: View, height: Height, digest: Hash256, sender: NodeId) -> Self {
        Self::new(MessageType::Prepare, view, height, digest, sender)
    }

    /// Create a Commit message
    pub fn commit(view: View, height: Height, digest: Hash256, sender: NodeId) -> Self {
        Self::new(MessageType::Commit, view, height, digest, sender)
    }

    /// Compute message hash for signing
    pub fn compute_hash(&self) -> Hash256 {
        let mut hasher = Sha3_256::new();
        hasher.update(&[self.msg_type.as_byte()]);
        hasher.update(&self.view.to_le_bytes());
        hasher.update(&self.height.to_le_bytes());
        hasher.update(&self.digest);
        hasher.update(&[self.sender]);
        hasher.finalize().into()
    }

    /// Verify the message signature
    pub fn verify_signature(&self, _public_key: &[u8]) -> bool {
        // TODO: Implement Ed25519 signature verification
        !self.signature.is_empty()
    }
}

impl MessageType {
    /// Convert to single byte
    pub fn as_byte(&self) -> u8 {
        match self {
            MessageType::PrePrepare => 0,
            MessageType::Prepare => 1,
            MessageType::Commit => 2,
            MessageType::ViewChange => 3,
            MessageType::NewView => 4,
        }
    }
}

/// Block structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    /// Block height
    pub height: Height,
    /// Timestamp (Unix epoch)
    pub timestamp: u64,
    /// Previous block hash
    pub prev_hash: Hash256,
    /// State root after applying transactions
    pub state_root: Hash256,
    /// Transactions in this block
    pub transactions: Vec<Transaction>,
    /// Proposer node ID
    pub proposer: NodeId,
}

impl Block {
    /// Create a new block
    pub fn new(
        height: Height,
        timestamp: u64,
        prev_hash: Hash256,
        state_root: Hash256,
        transactions: Vec<Transaction>,
        proposer: NodeId,
    ) -> Self {
        Self {
            height,
            timestamp,
            prev_hash,
            state_root,
            transactions,
            proposer,
        }
    }

    /// Compute block hash
    pub fn compute_hash(&self) -> Hash256 {
        let mut hasher = Sha3_256::new();
        hasher.update(&self.height.to_le_bytes());
        hasher.update(&self.timestamp.to_le_bytes());
        hasher.update(&self.prev_hash);
        hasher.update(&self.state_root);
        hasher.update(&[self.proposer]);
        
        // Hash all transactions
        for tx in &self.transactions {
            hasher.update(&tx.compute_hash());
        }
        
        hasher.finalize().into()
    }
}

/// Transaction types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Transaction {
    /// Lock event from L1
    Lock(LockTx),
    /// Unlock request
    Unlock(UnlockTx),
    /// State root update
    StateRootUpdate(StateRootUpdateTx),
}

impl Transaction {
    /// Compute transaction hash
    pub fn compute_hash(&self) -> Hash256 {
        let mut hasher = Sha3_256::new();
        match self {
            Transaction::Lock(tx) => {
                hasher.update(&[0u8]); // Type discriminator
                hasher.update(&tx.lock_id);
                hasher.update(&tx.amount.to_le_bytes());
            }
            Transaction::Unlock(tx) => {
                hasher.update(&[1u8]);
                hasher.update(&tx.lock_id);
                hasher.update(&tx.amount.to_le_bytes());
            }
            Transaction::StateRootUpdate(tx) => {
                hasher.update(&[2u8]);
                hasher.update(&tx.new_root);
            }
        }
        hasher.finalize().into()
    }
}

/// Lock transaction (from L1)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockTx {
    /// Lock ID
    pub lock_id: Hash256,
    /// Sender address (20 bytes)
    pub sender: [u8; 20],
    /// Recipient address
    pub recipient: [u8; 20],
    /// Amount in wei
    pub amount: u128,
    /// Dilithium public key hash
    pub pubkey_hash: Hash256,
    /// L1 block number
    pub l1_block: u64,
}

/// Unlock transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnlockTx {
    /// Lock ID to unlock
    pub lock_id: Hash256,
    /// Recipient address
    pub recipient: [u8; 20],
    /// Amount to unlock
    pub amount: u128,
    /// Dilithium signature
    pub signature: Vec<u8>,
    /// Prover signatures (SPHINCS+)
    pub prover_signatures: Vec<ProverSignature>,
}

/// State root update transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateRootUpdateTx {
    /// New state root
    pub new_root: Hash256,
    /// Previous state root
    pub prev_root: Hash256,
    /// Block height
    pub height: Height,
}

/// Prover signature
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProverSignature {
    /// Prover ID
    pub prover_id: u8,
    /// SPHINCS+ signature
    pub signature: Vec<u8>,
}

/// View change message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewChangeMessage {
    /// New view number
    pub new_view: View,
    /// Last committed height
    pub last_height: Height,
    /// Last committed block hash
    pub last_hash: Hash256,
    /// Sender node ID
    pub sender: NodeId,
    /// Signature
    pub signature: Vec<u8>,
}

impl ViewChangeMessage {
    /// Create a new view change message
    pub fn new(new_view: View, last_height: Height, last_hash: Hash256, sender: NodeId) -> Self {
        Self {
            new_view,
            last_height,
            last_hash,
            sender,
            signature: Vec::new(),
        }
    }

    /// Compute message hash
    pub fn compute_hash(&self) -> Hash256 {
        let mut hasher = Sha3_256::new();
        hasher.update(&self.new_view.to_le_bytes());
        hasher.update(&self.last_height.to_le_bytes());
        hasher.update(&self.last_hash);
        hasher.update(&[self.sender]);
        hasher.finalize().into()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_block_hash() {
        let block = Block::new(
            1,
            1234567890,
            [0u8; 32],
            [1u8; 32],
            vec![],
            0,
        );
        
        let hash1 = block.compute_hash();
        let hash2 = block.compute_hash();
        
        assert_eq!(hash1, hash2);
        assert_ne!(hash1, [0u8; 32]);
    }

    #[test]
    fn test_message_hash() {
        let msg = ConsensusMessage::prepare(1, 100, [0u8; 32], 0);
        let hash = msg.compute_hash();
        
        assert_ne!(hash, [0u8; 32]);
    }
}
