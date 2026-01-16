//! Sequencer type definitions
//!
//! ## CP-1 Compliance
//!
//! All hashes use SHA3-256 (FIPS 202).
//! No keccak256, SHA-256, or other prohibited algorithms.

use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};

/// Transaction hash (32 bytes, SHA3-256)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TxHash(pub [u8; 32]);

impl TxHash {
    /// Create from bytes
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Create from data using SHA3-256
    pub fn hash(data: &[u8]) -> Self {
        let mut hasher = Sha3_256::new();
        hasher.update(data);
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        Self(hash)
    }

    /// Get as bytes
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// Convert to hex string
    pub fn to_hex(&self) -> String {
        hex::encode(self.0)
    }
}

impl std::fmt::Display for TxHash {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "0x{}", hex::encode(&self.0[..8]))
    }
}

/// Batch hash (32 bytes, SHA3-256)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct BatchHash(pub [u8; 32]);

impl BatchHash {
    /// Create from bytes
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Create from transaction hashes
    pub fn from_txs(tx_hashes: &[TxHash]) -> Self {
        let mut hasher = Sha3_256::new();
        for tx_hash in tx_hashes {
            hasher.update(tx_hash.as_bytes());
        }
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        Self(hash)
    }

    /// Get as bytes
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// Convert to hex string
    pub fn to_hex(&self) -> String {
        hex::encode(self.0)
    }
}

/// Transaction priority
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum TxPriority {
    /// Low priority
    Low = 0,
    /// Normal priority
    Normal = 1,
    /// High priority
    High = 2,
    /// Urgent (emergency operations)
    Urgent = 3,
}

impl Default for TxPriority {
    fn default() -> Self {
        Self::Normal
    }
}

/// Transaction type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TxType {
    /// Bridge lock request
    BridgeLock,
    /// Bridge unlock request (normal)
    BridgeUnlockNormal,
    /// Bridge unlock request (emergency)
    BridgeUnlockEmergency,
    /// State update
    StateUpdate,
    /// Governance action
    Governance,
    /// Prover registration
    ProverRegistration,
    /// Slashing
    Slashing,
}

/// Pending transaction in mempool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingTx {
    /// Transaction hash
    pub hash: TxHash,
    /// Transaction type
    pub tx_type: TxType,
    /// Sender address (Dilithium public key hash)
    pub sender: [u8; 32],
    /// Nonce
    pub nonce: u64,
    /// Gas price
    pub gas_price: u128,
    /// Gas limit
    pub gas_limit: u64,
    /// Transaction data
    pub data: Vec<u8>,
    /// Dilithium signature
    pub signature: Vec<u8>,
    /// Priority
    pub priority: TxPriority,
    /// Timestamp received
    pub received_at: u64,
}

impl PendingTx {
    /// Calculate transaction hash
    pub fn calculate_hash(&self) -> TxHash {
        let mut hasher = Sha3_256::new();
        hasher.update(&self.sender);
        hasher.update(self.nonce.to_be_bytes());
        hasher.update(self.gas_price.to_be_bytes());
        hasher.update(self.gas_limit.to_be_bytes());
        hasher.update(&self.data);
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        TxHash(hash)
    }

    /// Get effective gas price (for ordering)
    pub fn effective_gas_price(&self) -> u128 {
        // Priority multiplier
        let multiplier = match self.priority {
            TxPriority::Low => 1,
            TxPriority::Normal => 2,
            TxPriority::High => 4,
            TxPriority::Urgent => 8,
        };
        self.gas_price * multiplier as u128
    }
}

/// Batch for L1 submission
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Batch {
    /// Batch number
    pub number: u64,
    /// Batch hash
    pub hash: BatchHash,
    /// Parent batch hash
    pub parent_hash: BatchHash,
    /// Sequencer address
    pub sequencer: [u8; 32],
    /// Transactions in batch
    pub transactions: Vec<TxHash>,
    /// State root after batch
    pub state_root: [u8; 32],
    /// Timestamp
    pub timestamp: u64,
    /// Gas used
    pub gas_used: u64,
    /// Sequencer signature (Dilithium)
    pub signature: Vec<u8>,
}

/// Batch status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BatchStatus {
    /// Pending (building)
    Pending,
    /// Built (ready for submission)
    Built,
    /// Submitted to L1
    Submitted,
    /// Confirmed on L1
    Confirmed,
    /// Failed
    Failed,
}

/// Sequencer epoch info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpochInfo {
    /// Epoch number
    pub number: u64,
    /// Active sequencer
    pub sequencer: [u8; 32],
    /// Start timestamp
    pub start_time: u64,
    /// End timestamp
    pub end_time: u64,
}
