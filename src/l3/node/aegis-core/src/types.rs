//! Core types for L3 Aegis
//!
//! Reference: docs/design/L3_AEGIS_ARCHITECTURE.md
//! Reference: docs/aegis/SEQUENCES_v2.0.md

use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};
use std::fmt;

// ============================================================================
// Hash Types
// ============================================================================

/// 256-bit hash type (SHA3-256)
#[derive(Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
pub struct Hash256(pub [u8; 32]);

impl Hash256 {
    pub const ZERO: Self = Self([0u8; 32]);

    pub fn from_slice(data: &[u8]) -> Self {
        let mut arr = [0u8; 32];
        let len = std::cmp::min(data.len(), 32);
        arr[..len].copy_from_slice(&data[..len]);
        Self(arr)
    }

    pub fn as_bytes(&self) -> &[u8] {
        &self.0
    }

    /// Get bit at position (for SMT path computation)
    pub fn bit(&self, index: usize) -> bool {
        let byte_index = index / 8;
        let bit_index = index % 8;
        if byte_index >= 32 {
            return false;
        }
        (self.0[byte_index] >> (7 - bit_index)) & 1 == 1
    }

    /// Compute SHA3-256 hash of data
    pub fn hash(data: &[u8]) -> Self {
        let mut hasher = Sha3_256::new();
        hasher.update(data);
        Self::from_slice(&hasher.finalize())
    }

    /// Hash two nodes together (for SMT)
    pub fn hash_nodes(left: &Self, right: &Self) -> Self {
        let mut hasher = Sha3_256::new();
        hasher.update(&left.0);
        hasher.update(&right.0);
        Self::from_slice(&hasher.finalize())
    }
}

impl fmt::Debug for Hash256 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "0x{}...", hex::encode(&self.0[..4]))
    }
}

impl fmt::Display for Hash256 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "0x{}", hex::encode(&self.0))
    }
}

// ============================================================================
// Address Types
// ============================================================================

/// Ethereum address (20 bytes)
#[derive(Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
pub struct Address(pub [u8; 20]);

impl Address {
    pub const ZERO: Self = Self([0u8; 20]);

    pub fn from_slice(data: &[u8]) -> Self {
        let mut arr = [0u8; 20];
        let len = std::cmp::min(data.len(), 20);
        arr[..len].copy_from_slice(&data[..len]);
        Self(arr)
    }
}

impl fmt::Debug for Address {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "0x{}", hex::encode(&self.0))
    }
}

impl fmt::Display for Address {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "0x{}", hex::encode(&self.0))
    }
}

// ============================================================================
// Lock/Unlock Types
// ============================================================================

/// Lock status enumeration
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum LockStatus {
    /// Lock is active and can be unlocked
    Active,
    /// Unlock has been requested, waiting for time lock
    PendingUnlock { requested_at: u64 },
    /// Funds have been released
    Released { released_at: u64 },
    /// Lock is under challenge
    Challenged { challenged_at: u64 },
}

/// Lock data structure
/// 
/// Represents a locked asset in the bridge.
/// Reference: SEQUENCES_v2.0.md - Lock Flow (L1 → L3)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LockData {
    /// Unique lock identifier
    pub lock_id: Hash256,
    /// Original sender on L1
    pub sender: Address,
    /// Recipient address
    pub recipient: Address,
    /// Amount locked in wei
    pub amount: u128,
    /// Hash of Dilithium public key (SHA3-256)
    pub dilithium_pubkey_hash: Hash256,
    /// L1 block number when locked
    pub locked_at: u64,
    /// Current status
    pub status: LockStatus,
}

impl LockData {
    /// Compute the leaf hash for SMT
    /// Uses domain separation per UNIFIED_SPEC_v2.0
    pub fn compute_leaf_hash(&self) -> Hash256 {
        let mut data = Vec::new();
        // Domain separator
        data.extend_from_slice(b"QS_LOCK_V1");
        data.extend_from_slice(&self.lock_id.0);
        data.extend_from_slice(&self.amount.to_be_bytes());
        data.extend_from_slice(&self.recipient.0);
        data.extend_from_slice(&self.dilithium_pubkey_hash.0);
        Hash256::hash(&data)
    }
}

/// Unlock request from user
/// Reference: SEQUENCES_v2.0.md - Normal Unlock Flow
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UnlockRequest {
    pub lock_id: Hash256,
    pub recipient: Address,
    pub amount: u128,
    /// Dilithium signature over the request (3293 bytes for Level 3)
    pub dilithium_signature: Vec<u8>,
    /// Dilithium public key (1952 bytes for Level 3)
    pub dilithium_pubkey: Vec<u8>,
}

/// Unlock response from L3
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UnlockResponse {
    pub success: bool,
    pub state_root: Hash256,
    pub proof: Vec<Hash256>,
    pub error: Option<String>,
}

/// Unlock data for consensus and L1 submission
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UnlockData {
    pub lock_id: Hash256,
    pub recipient: Address,
    pub amount: u128,
    pub state_root: Hash256,
    pub proof: Vec<Hash256>,
    /// SPHINCS+ signatures from provers (8KB each)
    pub sphincs_signatures: Vec<Vec<u8>>,
    pub prover_ids: Vec<u32>,
}

// ============================================================================
// Transaction Types
// ============================================================================

/// Transaction types in L3 Aegis
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum Transaction {
    /// Lock event from L1
    Lock(LockData),
    /// Unlock request processed
    Unlock(UnlockData),
    /// State root update for L1
    StateRootUpdate(StateRootUpdate),
}

/// State root update for L1 submission
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StateRootUpdate {
    pub old_root: Hash256,
    pub new_root: Hash256,
    pub height: u64,
    pub timestamp: u64,
}

// ============================================================================
// Consensus Types
// ============================================================================

/// Node identifier (4 nodes in Phase 1)
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NodeId(pub u32);

impl NodeId {
    pub const US_EAST: Self = Self(0);
    pub const EU_WEST: Self = Self(1);
    pub const ASIA_SG: Self = Self(2);
    pub const RESERVE: Self = Self(3);
}

/// Block structure
/// Reference: L3_AEGIS_ARCHITECTURE.md Section 6.3
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Block {
    pub height: u64,
    pub timestamp: u64,
    pub prev_hash: Hash256,
    pub state_root: Hash256,
    pub transactions: Vec<Transaction>,
    pub proposer: NodeId,
    pub signatures: Vec<NodeSignature>,
}

impl Block {
    /// Compute block hash
    pub fn hash(&self) -> Hash256 {
        let mut data = Vec::new();
        data.extend_from_slice(&self.height.to_be_bytes());
        data.extend_from_slice(&self.timestamp.to_be_bytes());
        data.extend_from_slice(&self.prev_hash.0);
        data.extend_from_slice(&self.state_root.0);
        data.extend_from_slice(&self.proposer.0.to_be_bytes());
        Hash256::hash(&data)
    }

    /// Create genesis block
    pub fn genesis() -> Self {
        Self {
            height: 0,
            timestamp: 0,
            prev_hash: Hash256::ZERO,
            state_root: Hash256::ZERO,
            transactions: vec![],
            proposer: NodeId(0),
            signatures: vec![],
        }
    }
}

/// Node signature for consensus
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeSignature {
    pub node_id: NodeId,
    pub signature: Vec<u8>,
}

/// Consensus message types (PBFT)
/// Reference: L3_AEGIS_ARCHITECTURE.md Section 4
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ConsensusMessage {
    PrePrepare {
        view: u64,
        sequence: u64,
        digest: Hash256,
        block: Block,
    },
    Prepare {
        view: u64,
        sequence: u64,
        digest: Hash256,
        node_id: NodeId,
        signature: Vec<u8>,
    },
    Commit {
        view: u64,
        sequence: u64,
        digest: Hash256,
        node_id: NodeId,
        signature: Vec<u8>,
    },
    ViewChange {
        new_view: u64,
        last_sequence: u64,
        node_id: NodeId,
        proof: Vec<u8>,
    },
}

// ============================================================================
// Prover Types
// ============================================================================

/// Prover information
/// Reference: UNIFIED_SPEC_v2.0 - 5 Provers (3 internal + 2 partners)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProverInfo {
    pub id: u32,
    pub name: String,
    pub endpoint: String,
    /// SPHINCS+ public key
    pub sphincs_pubkey: Vec<u8>,
    /// Stake amount in wei
    pub stake: u128,
    pub active: bool,
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash256_bit() {
        // 10000000 in first byte
        let hash = Hash256([0x80; 32]);
        assert!(hash.bit(0));
        assert!(!hash.bit(1));
        assert!(!hash.bit(7));
        
        // 01000000 in first byte
        let hash2 = Hash256([0x40; 32]);
        assert!(!hash2.bit(0));
        assert!(hash2.bit(1));
    }

    #[test]
    fn test_hash256_hash_nodes() {
        let left = Hash256::hash(b"left");
        let right = Hash256::hash(b"right");
        let parent = Hash256::hash_nodes(&left, &right);
        assert_ne!(parent, Hash256::ZERO);
        assert_ne!(parent, left);
        assert_ne!(parent, right);
    }

    #[test]
    fn test_lock_data_leaf_hash() {
        let lock = LockData {
            lock_id: Hash256::hash(b"lock1"),
            sender: Address::ZERO,
            recipient: Address::ZERO,
            amount: 1_000_000_000_000_000_000, // 1 ETH
            dilithium_pubkey_hash: Hash256::ZERO,
            locked_at: 12345678,
            status: LockStatus::Active,
        };
        let hash = lock.compute_leaf_hash();
        assert_ne!(hash, Hash256::ZERO);
    }

    #[test]
    fn test_block_genesis() {
        let genesis = Block::genesis();
        assert_eq!(genesis.height, 0);
        assert_eq!(genesis.prev_hash, Hash256::ZERO);
        let hash = genesis.hash();
        assert_ne!(hash, Hash256::ZERO);
    }

    #[test]
    fn test_node_ids() {
        assert_eq!(NodeId::US_EAST.0, 0);
        assert_eq!(NodeId::EU_WEST.0, 1);
        assert_eq!(NodeId::ASIA_SG.0, 2);
        assert_eq!(NodeId::RESERVE.0, 3);
    }
}
