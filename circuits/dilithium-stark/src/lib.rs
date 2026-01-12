//! Dilithium STARK Circuit
//!
//! This crate implements a STARK circuit for verifying Dilithium (FIPS 204) signatures.
//! The circuit proves that a given signature is valid without revealing the secret key.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────────┐
//! │                    Dilithium Signature Verification Circuit                  │
//! ├─────────────────────────────────────────────────────────────────────────────┤
//! │                                                                              │
//! │  Public Inputs:                                                              │
//! │  ├─ public_key_hash: [u8; 32]    (Keccak256 of pk)                          │
//! │  ├─ message_hash: [u8; 32]        (Keccak256 of message)                     │
//! │  └─ signature_valid: bool         (result of verification)                   │
//! │                                                                              │
//! │  Private Witness:                                                            │
//! │  ├─ public_key: [u8; 1952]        (Dilithium Level 3)                        │
//! │  ├─ message: Vec<u8>               (arbitrary length)                        │
//! │  └─ signature: [u8; 3293]         (Dilithium Level 3)                        │
//! │                                                                              │
//! │  Circuit Structure:                                                          │
//! │  ┌─────────────────────────────────────────────────────────────────────────┐ │
//! │  │  1. Hash Verification (Keccak256)                                       │ │
//! │  │     ├─ Verify: hash(public_key) == public_key_hash                      │ │
//! │  │     └─ Verify: hash(message) == message_hash                            │ │
//! │  ├─────────────────────────────────────────────────────────────────────────┤ │
//! │  │  2. NTT Polynomial Operations                                           │ │
//! │  │     ├─ Forward NTT: poly -> NTT(poly)                                   │ │
//! │  │     ├─ Inverse NTT: NTT(poly) -> poly                                   │ │
//! │  │     └─ Point-wise multiplication                                        │ │
//! │  ├─────────────────────────────────────────────────────────────────────────┤ │
//! │  │  3. Coefficient Bound Checks                                            │ │
//! │  │     ├─ Check: all coefficients < 2^16                                   │ │
//! │  │     └─ Range proofs for lattice parameters                              │ │
//! │  ├─────────────────────────────────────────────────────────────────────────┤ │
//! │  │  4. Signature Verification Logic                                        │ │
//! │  │     └─ Dilithium verification equation                                  │ │
//! │  └─────────────────────────────────────────────────────────────────────────┘ │
//! └─────────────────────────────────────────────────────────────────────────────┘
//! ```

pub mod ntt;
pub mod hash;
pub mod verification;
pub mod witness;
pub mod constraints;
pub mod kat;
pub mod ffi;

// STARK proving system (Winterfell)
pub mod stark;

use sha3::{Digest, Keccak256};
use serde::{Deserialize, Serialize};

// =============================================================================
// Constants (Dilithium Level 3 / FIPS 204)
// =============================================================================

/// Dilithium modulus q = 2^23 - 2^13 + 1 = 8380417
pub const Q: u32 = 8380417;

/// Polynomial degree (N = 256)
pub const N: usize = 256;

/// Public key size in bytes (Level 3)
pub const PUBLIC_KEY_BYTES: usize = 1952;

/// Secret key size in bytes (Level 3)
pub const SECRET_KEY_BYTES: usize = 4000;

/// Signature size in bytes (Level 3) - pqcrypto-dilithium v0.5
pub const SIGNATURE_BYTES: usize = 3309;

/// Maximum coefficient bound for range proofs
pub const MAX_COEFFICIENT_BOUND: u32 = 1 << 16;

// =============================================================================
// Public Inputs (What goes on-chain)
// =============================================================================

/// Public inputs for the STARK proof
/// These are the values that will be verified on-chain
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PublicInputs {
    /// Keccak256 hash of the Dilithium public key
    pub public_key_hash: [u8; 32],

    /// Keccak256 hash of the message
    pub message_hash: [u8; 32],

    /// Whether the signature verification succeeded
    pub signature_valid: bool,

    /// Nonce for replay protection
    pub nonce: u64,

    /// Optional: Ethereum address for binding
    pub eth_address: Option<[u8; 20]>,

    /// Optional: Amount for bridge operations
    pub amount: Option<u128>,
}

impl PublicInputs {
    /// Compute the commitment hash for on-chain verification
    pub fn commitment_hash(&self) -> [u8; 32] {
        let mut hasher = Keccak256::new();
        hasher.update(&self.public_key_hash);
        hasher.update(&self.message_hash);
        hasher.update(&[self.signature_valid as u8]);
        hasher.update(&self.nonce.to_be_bytes());

        if let Some(addr) = &self.eth_address {
            hasher.update(addr);
        }
        if let Some(amt) = &self.amount {
            hasher.update(&amt.to_be_bytes());
        }

        hasher.finalize().into()
    }

    /// Encode public inputs for Solidity verification
    pub fn to_solidity_inputs(&self) -> Vec<u8> {
        let mut data = Vec::new();
        data.extend_from_slice(&self.public_key_hash);
        data.extend_from_slice(&self.message_hash);
        data.push(self.signature_valid as u8);
        data.extend_from_slice(&self.nonce.to_be_bytes());

        if let Some(addr) = &self.eth_address {
            data.extend_from_slice(addr);
        }
        if let Some(amt) = &self.amount {
            data.extend_from_slice(&amt.to_be_bytes());
        }

        data
    }
}

// =============================================================================
// Witness (Private inputs to the circuit)
// =============================================================================

/// Private witness for the STARK circuit
/// These values are NOT revealed on-chain
#[derive(Clone)]
pub struct Witness {
    /// Dilithium public key (1952 bytes)
    pub public_key: Vec<u8>,

    /// Message bytes
    pub message: Vec<u8>,

    /// Dilithium signature (3293 bytes)
    pub signature: Vec<u8>,
}

impl Witness {
    /// Create a new witness from components
    pub fn new(public_key: Vec<u8>, message: Vec<u8>, signature: Vec<u8>) -> Result<Self, String> {
        if public_key.len() != PUBLIC_KEY_BYTES {
            return Err(format!(
                "Invalid public key length: expected {}, got {}",
                PUBLIC_KEY_BYTES,
                public_key.len()
            ));
        }

        if signature.len() != SIGNATURE_BYTES {
            return Err(format!(
                "Invalid signature length: expected {}, got {}",
                SIGNATURE_BYTES,
                signature.len()
            ));
        }

        Ok(Self {
            public_key,
            message,
            signature,
        })
    }

    /// Compute public inputs from witness
    pub fn compute_public_inputs(&self, nonce: u64) -> PublicInputs {
        let public_key_hash = keccak256(&self.public_key);
        let message_hash = keccak256(&self.message);

        // Verify signature using pqcrypto
        let signature_valid = verify_dilithium_signature(
            &self.public_key,
            &self.message,
            &self.signature,
        );

        PublicInputs {
            public_key_hash,
            message_hash,
            signature_valid,
            nonce,
            eth_address: None,
            amount: None,
        }
    }
}

// =============================================================================
// STARK Proof Structure
// =============================================================================

/// STARK proof for Dilithium signature verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DilithiumStarkProof {
    /// Public inputs (goes on-chain)
    pub public_inputs: PublicInputs,

    /// Commitment to the execution trace
    pub trace_commitment: [u8; 32],

    /// FRI proof layers
    pub fri_proof: FriProof,

    /// Query responses
    pub query_responses: Vec<QueryResponse>,

    /// Proof metadata
    pub metadata: ProofMetadata,
}

/// FRI (Fast Reed-Solomon IOP of Proximity) proof
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FriProof {
    /// Commitments to each FRI layer
    pub layer_commitments: Vec<[u8; 32]>,

    /// Final polynomial coefficients
    pub final_polynomial: Vec<u8>,

    /// Merkle authentication paths
    pub auth_paths: Vec<Vec<[u8; 32]>>,
}

/// Query response for STARK verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResponse {
    /// Query index
    pub index: usize,

    /// Trace values at query point
    pub trace_values: Vec<u8>,

    /// Constraint evaluation at query point
    pub constraint_values: Vec<u8>,
}

/// Proof metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofMetadata {
    /// Proof generation timestamp
    pub timestamp: u64,

    /// Prover version
    pub prover_version: String,

    /// Security level in bits
    pub security_bits: u32,

    /// Proof size in bytes
    pub proof_size: usize,
}

// =============================================================================
// Helper Functions
// =============================================================================

/// Compute Keccak256 hash
pub fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(data);
    hasher.finalize().into()
}

/// Verify Dilithium signature using pqcrypto
fn verify_dilithium_signature(public_key: &[u8], message: &[u8], signature: &[u8]) -> bool {
    use pqcrypto_dilithium::dilithium3;
    use pqcrypto_traits::sign::{PublicKey, DetachedSignature};

    let pk = match dilithium3::PublicKey::from_bytes(public_key) {
        Ok(pk) => pk,
        Err(_) => return false,
    };

    let sig = match dilithium3::DetachedSignature::from_bytes(signature) {
        Ok(sig) => sig,
        Err(_) => return false,
    };

    dilithium3::verify_detached_signature(&sig, message, &pk).is_ok()
}

// =============================================================================
// Circuit Trait (To be implemented with Plonky3)
// =============================================================================

/// Trait for STARK circuit implementations
pub trait StarkCircuit {
    /// Generate execution trace from witness
    fn generate_trace(&self, witness: &Witness) -> Vec<Vec<u64>>;

    /// Evaluate constraints at a given point
    fn evaluate_constraints(&self, trace: &[Vec<u64>], point: usize) -> Vec<u64>;

    /// Get the number of trace columns
    fn trace_width(&self) -> usize;

    /// Get the trace length (must be power of 2)
    fn trace_length(&self) -> usize;
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use pqcrypto_dilithium::dilithium3;
    #[allow(unused_imports)]
    use pqcrypto_traits::sign::{PublicKey, SecretKey, DetachedSignature};

    #[test]
    fn test_witness_creation() {
        let (pk, sk) = dilithium3::keypair();
        let message = b"Test message for STARK circuit";
        let sig = dilithium3::detached_sign(message, &sk);

        let witness = Witness::new(
            pk.as_bytes().to_vec(),
            message.to_vec(),
            sig.as_bytes().to_vec(),
        ).unwrap();

        assert_eq!(witness.public_key.len(), PUBLIC_KEY_BYTES);
        assert_eq!(witness.signature.len(), SIGNATURE_BYTES);
    }

    #[test]
    fn test_public_inputs_computation() {
        let (pk, sk) = dilithium3::keypair();
        let message = b"Test message";
        let sig = dilithium3::detached_sign(message, &sk);

        let witness = Witness::new(
            pk.as_bytes().to_vec(),
            message.to_vec(),
            sig.as_bytes().to_vec(),
        ).unwrap();

        let public_inputs = witness.compute_public_inputs(1);

        assert!(public_inputs.signature_valid);
        assert_eq!(public_inputs.nonce, 1);
        assert_eq!(
            public_inputs.public_key_hash,
            keccak256(pk.as_bytes())
        );
    }

    #[test]
    fn test_invalid_signature() {
        let (pk, _sk) = dilithium3::keypair();
        let (_, other_sk) = dilithium3::keypair();
        let message = b"Test message";
        let wrong_sig = dilithium3::detached_sign(message, &other_sk);

        let witness = Witness::new(
            pk.as_bytes().to_vec(),
            message.to_vec(),
            wrong_sig.as_bytes().to_vec(),
        ).unwrap();

        let public_inputs = witness.compute_public_inputs(1);

        assert!(!public_inputs.signature_valid);
    }

    #[test]
    fn test_commitment_hash_deterministic() {
        let public_inputs = PublicInputs {
            public_key_hash: [1u8; 32],
            message_hash: [2u8; 32],
            signature_valid: true,
            nonce: 42,
            eth_address: None,
            amount: None,
        };

        let hash1 = public_inputs.commitment_hash();
        let hash2 = public_inputs.commitment_hash();

        assert_eq!(hash1, hash2);
    }
}
