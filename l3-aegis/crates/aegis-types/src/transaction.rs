//! Transaction types for L3 Aegis Chain
//!
//! Implements transaction types per L3_CHAIN_SPECIFICATION.md §2.3

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

    #[test]
    fn test_address_hex_roundtrip() {
        let addr = Address::new([1u8; 20]);
        let hex = addr.to_hex();
        let parsed = Address::from_hex(&hex).unwrap();
        assert_eq!(addr, parsed);
    }

    #[test]
    fn test_transaction_type() {
        let tx = Transaction::UnlockRequest(UnlockRequestTx {
            unlock_id: Hash256::zero(),
            lock_id: Hash256::zero(),
            dest_addr: Address::zero(),
            amount: 0,
            owner_pk: DilithiumPublicKey(vec![]),
            owner_signature: vec![],
            timestamp: 0,
        });
        assert_eq!(tx.tx_type(), "UnlockRequest");
    }
}
