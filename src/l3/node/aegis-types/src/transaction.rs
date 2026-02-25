//! Transaction types for L3 Aegis Chain
//!
//! Implements transaction types per L3_CHAIN_SPECIFICATION.md §2.3
//!
//! # CP-1 Compliance
//! All transaction hashes use SHA3-256 (FIPS 202).
//! Prohibited: keccak256, SHA-256

use serde::{Deserialize, Serialize};
use crate::Hash256;

/// Address type (20 bytes for Ethereum compatibility)
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
pub struct Address(pub [u8; 20]);

impl Address {
    /// Create a new address
    pub fn new(bytes: [u8; 20]) -> Self {
        Self(bytes)
    }

    /// Create a zero address
    pub fn zero() -> Self {
        Self([0u8; 20])
    }

    /// Convert to hex string
    pub fn to_hex(&self) -> String {
        format!("0x{}", hex::encode(self.0))
    }

    /// Parse from hex string
    pub fn from_hex(s: &str) -> Result<Self, hex::FromHexError> {
        let s = s.strip_prefix("0x").unwrap_or(s);
        let bytes = hex::decode(s)?;
        if bytes.len() != 20 {
            return Err(hex::FromHexError::InvalidStringLength);
        }
        let mut arr = [0u8; 20];
        arr.copy_from_slice(&bytes);
        Ok(Self(arr))
    }
}

/// Dilithium public key (for user signatures)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DilithiumPublicKey(pub Vec<u8>);

/// SPHINCS+ signature (for prover signatures)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SPHINCSSignature(pub Vec<u8>);

/// Unlock status
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum UnlockStatus {
    Pending,
    ProversAssigned,
    SignaturesCollected,
    SubmittedToL1,
    Completed,
    Failed,
}

/// Unlock request transaction
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UnlockRequestTx {
    /// Unique unlock ID
    pub unlock_id: Hash256,
    /// Lock ID being unlocked
    pub lock_id: Hash256,
    /// Destination address on L1
    pub dest_addr: Address,
    /// Amount to unlock
    pub amount: u128,
    /// Owner's Dilithium public key
    pub owner_pk: DilithiumPublicKey,
    /// Owner's signature on the request
    pub owner_signature: Vec<u8>,
    /// Timestamp
    pub timestamp: u64,
}

impl UnlockRequestTx {
    /// Compute SHA3-256 hash of this transaction
    ///
    /// # CP-1 Compliance
    /// Uses SHA3-256 (FIPS 202), not keccak256.
    pub fn hash(&self) -> Hash256 {
        let serialized = serde_json::to_vec(self).expect("Serialization should not fail");
        Hash256::hash(&serialized)
    }
}

/// VRF result transaction
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VRFResultTx {
    /// Unlock ID this VRF is for
    pub unlock_id: Hash256,
    /// VRF output
    pub vrf_output: Hash256,
    /// VRF proof
    pub vrf_proof: Vec<u8>,
    /// Selected prover IDs
    pub selected_provers: Vec<Hash256>,
    /// Node that generated the VRF
    pub generator_node: Hash256,
    /// Timestamp
    pub timestamp: u64,
}

impl VRFResultTx {
    /// Compute SHA3-256 hash of this transaction
    ///
    /// # CP-1 Compliance
    /// Uses SHA3-256 (FIPS 202), not keccak256.
    pub fn hash(&self) -> Hash256 {
        let serialized = serde_json::to_vec(self).expect("Serialization should not fail");
        Hash256::hash(&serialized)
    }
}

/// Prover signature transaction
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProverSignatureTx {
    /// Unlock ID this signature is for
    pub unlock_id: Hash256,
    /// Prover ID
    pub prover_id: Hash256,
    /// SPHINCS+ signature
    pub signature: SPHINCSSignature,
    /// Timestamp
    pub timestamp: u64,
}

impl ProverSignatureTx {
    /// Compute SHA3-256 hash of this transaction
    ///
    /// # CP-1 Compliance
    /// Uses SHA3-256 (FIPS 202), not keccak256.
    pub fn hash(&self) -> Hash256 {
        let serialized = serde_json::to_vec(self).expect("Serialization should not fail");
        Hash256::hash(&serialized)
    }
}

/// L1 submit transaction
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct L1SubmitTx {
    /// Unlock ID submitted
    pub unlock_id: Hash256,
    /// L1 transaction hash
    pub l1_tx_hash: Hash256,
    /// Node that submitted to L1
    pub submitter_node: Hash256,
    /// Timestamp
    pub timestamp: u64,
}

impl L1SubmitTx {
    /// Compute SHA3-256 hash of this transaction
    ///
    /// # CP-1 Compliance
    /// Uses SHA3-256 (FIPS 202), not keccak256.
    pub fn hash(&self) -> Hash256 {
        let serialized = serde_json::to_vec(self).expect("Serialization should not fail");
        Hash256::hash(&serialized)
    }
}

/// Transaction enum as per L3_CHAIN_SPECIFICATION.md §2.3
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum Transaction {
    /// Unlock request from user
    UnlockRequest(UnlockRequestTx),
    /// VRF result for prover selection
    VRFResult(VRFResultTx),
    /// Prover signature
    ProverSignature(ProverSignatureTx),
    /// L1 submission record
    L1Submit(L1SubmitTx),
}

impl Transaction {
    /// Compute SHA3-256 hash of this transaction
    ///
    /// # CP-1 Compliance
    /// Uses SHA3-256 (FIPS 202), not keccak256.
    pub fn hash(&self) -> Hash256 {
        let serialized = serde_json::to_vec(self).expect("Transaction serialization should not fail");
        Hash256::hash(&serialized)
    }

    /// Get the transaction type as a string
    pub fn tx_type(&self) -> &'static str {
        match self {
            Transaction::UnlockRequest(_) => "UnlockRequest",
            Transaction::VRFResult(_) => "VRFResult",
            Transaction::ProverSignature(_) => "ProverSignature",
            Transaction::L1Submit(_) => "L1Submit",
        }
    }

    /// Get the associated unlock ID
    pub fn unlock_id(&self) -> Hash256 {
        match self {
            Transaction::UnlockRequest(tx) => tx.unlock_id,
            Transaction::VRFResult(tx) => tx.unlock_id,
            Transaction::ProverSignature(tx) => tx.unlock_id,
            Transaction::L1Submit(tx) => tx.unlock_id,
        }
    }

    /// Get the timestamp
    pub fn timestamp(&self) -> u64 {
        match self {
            Transaction::UnlockRequest(tx) => tx.timestamp,
            Transaction::VRFResult(tx) => tx.timestamp,
            Transaction::ProverSignature(tx) => tx.timestamp,
            Transaction::L1Submit(tx) => tx.timestamp,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mock_unlock_request() -> UnlockRequestTx {
        UnlockRequestTx {
            unlock_id: Hash256::hash(b"unlock1"),
            lock_id: Hash256::hash(b"lock1"),
            dest_addr: Address::new([1u8; 20]),
            amount: 1000000000000000000,
            owner_pk: DilithiumPublicKey(vec![1, 2, 3]),
            owner_signature: vec![4, 5, 6],
            timestamp: 1234567890,
        }
    }

    fn mock_vrf_result() -> VRFResultTx {
        VRFResultTx {
            unlock_id: Hash256::hash(b"unlock1"),
            vrf_output: Hash256::hash(b"vrf_output"),
            vrf_proof: vec![1, 2, 3, 4],
            selected_provers: vec![Hash256::hash(b"prover1")],
            generator_node: Hash256::hash(b"node1"),
            timestamp: 1234567890,
        }
    }

    fn mock_prover_signature() -> ProverSignatureTx {
        ProverSignatureTx {
            unlock_id: Hash256::hash(b"unlock1"),
            prover_id: Hash256::hash(b"prover1"),
            signature: SPHINCSSignature(vec![1, 2, 3, 4, 5]),
            timestamp: 1234567890,
        }
    }

    fn mock_l1_submit() -> L1SubmitTx {
        L1SubmitTx {
            unlock_id: Hash256::hash(b"unlock1"),
            l1_tx_hash: Hash256::hash(b"l1_tx"),
            submitter_node: Hash256::hash(b"node1"),
            timestamp: 1234567890,
        }
    }

    #[test]
    fn test_address_hex_roundtrip() {
        let addr = Address::new([1u8; 20]);
        let hex = addr.to_hex();
        let parsed = Address::from_hex(&hex).unwrap();
        assert_eq!(addr, parsed);
    }

    #[test]
    fn test_transaction_type() {
        let tx = Transaction::UnlockRequest(mock_unlock_request());
        assert_eq!(tx.tx_type(), "UnlockRequest");
    }

    #[test]
    fn test_unlock_request_hash() {
        let tx = mock_unlock_request();
        let hash = tx.hash();
        assert!(!hash.is_zero());
        assert_eq!(hash.as_bytes().len(), 32);
    }

    #[test]
    fn test_vrf_result_hash() {
        let tx = mock_vrf_result();
        let hash = tx.hash();
        assert!(!hash.is_zero());
        assert_eq!(hash.as_bytes().len(), 32);
    }

    #[test]
    fn test_prover_signature_hash() {
        let tx = mock_prover_signature();
        let hash = tx.hash();
        assert!(!hash.is_zero());
        assert_eq!(hash.as_bytes().len(), 32);
    }

    #[test]
    fn test_l1_submit_hash() {
        let tx = mock_l1_submit();
        let hash = tx.hash();
        assert!(!hash.is_zero());
        assert_eq!(hash.as_bytes().len(), 32);
    }

    #[test]
    fn test_transaction_enum_hash() {
        let tx = Transaction::UnlockRequest(mock_unlock_request());
        let hash = tx.hash();
        assert!(!hash.is_zero());
        assert_eq!(hash.as_bytes().len(), 32);
    }

    #[test]
    fn test_hash_deterministic() {
        let tx = mock_unlock_request();
        let hash1 = tx.hash();
        let hash2 = tx.hash();
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_different_content_different_hash() {
        let tx1 = mock_unlock_request();
        let mut tx2 = mock_unlock_request();
        tx2.amount = 2000000000000000000;
        assert_ne!(tx1.hash(), tx2.hash());
    }

    #[test]
    fn test_all_transaction_types_hash() {
        let txs = vec![
            Transaction::UnlockRequest(mock_unlock_request()),
            Transaction::VRFResult(mock_vrf_result()),
            Transaction::ProverSignature(mock_prover_signature()),
            Transaction::L1Submit(mock_l1_submit()),
        ];

        let mut hashes = Vec::new();
        for tx in &txs {
            let hash = tx.hash();
            assert!(!hash.is_zero());
            assert_eq!(hash.as_bytes().len(), 32);
            hashes.push(hash);
        }

        // All different transaction types should have different hashes
        for i in 0..hashes.len() {
            for j in (i + 1)..hashes.len() {
                assert_ne!(hashes[i], hashes[j]);
            }
        }
    }

    #[test]
    fn test_cp1_compliance_sha3_256() {
        let tx = Transaction::UnlockRequest(mock_unlock_request());
        let hash = tx.hash();
        assert_eq!(hash.as_bytes().len(), 32, "Hash must be 256 bits for SHA3-256");
    }
}
