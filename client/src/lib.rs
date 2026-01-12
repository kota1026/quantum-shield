//! Quantum Shield Client Library
//!
//! Lightweight client for Dilithium signature generation.
//! Designed to run on resource-constrained devices (MacBook Air 8GB).
//!
//! # Architecture
//!
//! ```text
//! Client (this crate)          Prover Network              L1/L2
//!      │                             │                       │
//!      │ generate_keypair()          │                       │
//!      │ sign_message()              │                       │
//!      │                             │                       │
//!      └──── SignatureRequest ──────►│                       │
//!                                    │ verify + attestation  │
//!                                    └───────────────────────►
//! ```

use pqcrypto_dilithium::dilithium3;
use pqcrypto_traits::sign::{PublicKey, SecretKey, DetachedSignature};
use sha3::{Digest, Keccak256};
use serde::{Deserialize, Serialize};

// =============================================================================
// Types
// =============================================================================

/// Dilithium keypair for signing
#[derive(Clone)]
pub struct DilithiumKeypair {
    pub public_key: Vec<u8>,
    pub secret_key: Vec<u8>,
    pub public_key_hash: [u8; 32],
}

/// Request to send to prover network
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureRequest {
    /// Dilithium public key (1952 bytes for Level 3)
    pub public_key: Vec<u8>,
    /// Keccak256 hash of public key (for on-chain identity)
    pub public_key_hash: [u8; 32],
    /// Message that was signed
    pub message: Vec<u8>,
    /// Dilithium signature (3293 bytes for Level 3)
    pub signature: Vec<u8>,
    /// Optional: Ethereum address to associate
    pub eth_address: Option<[u8; 20]>,
    /// Optional: Amount in wei (for bridge operations)
    pub amount: Option<u128>,
    /// Nonce for replay protection
    pub nonce: u64,
}

/// Response from prover network
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttestationResponse {
    /// Whether signature was valid
    pub valid: bool,
    /// Attestation hash (to be submitted to L1)
    pub attestation_hash: [u8; 32],
    /// Prover's signature on attestation (for dispute resolution)
    pub prover_signature: Vec<u8>,
    /// Timestamp of attestation
    pub timestamp: u64,
    /// Request ID for tracking
    pub request_id: String,
}

// =============================================================================
// Keypair Generation
// =============================================================================

/// Generate a new Dilithium keypair
///
/// # Memory Usage
/// - Public key: 1,952 bytes
/// - Secret key: 4,000 bytes
/// - Total: ~6 KB (easily fits in 8GB RAM)
pub fn generate_keypair() -> DilithiumKeypair {
    let (pk, sk) = dilithium3::keypair();

    let pk_bytes = pk.as_bytes().to_vec();
    let sk_bytes = sk.as_bytes().to_vec();

    // Hash public key for on-chain identity
    let mut hasher = Keccak256::new();
    hasher.update(&pk_bytes);
    let hash: [u8; 32] = hasher.finalize().into();

    DilithiumKeypair {
        public_key: pk_bytes,
        secret_key: sk_bytes,
        public_key_hash: hash,
    }
}

/// Restore keypair from bytes
pub fn restore_keypair(public_key: &[u8], secret_key: &[u8]) -> Result<DilithiumKeypair, String> {
    if public_key.len() != dilithium3::public_key_bytes() {
        return Err(format!(
            "Invalid public key length: expected {}, got {}",
            dilithium3::public_key_bytes(),
            public_key.len()
        ));
    }

    if secret_key.len() != dilithium3::secret_key_bytes() {
        return Err(format!(
            "Invalid secret key length: expected {}, got {}",
            dilithium3::secret_key_bytes(),
            secret_key.len()
        ));
    }

    let mut hasher = Keccak256::new();
    hasher.update(public_key);
    let hash: [u8; 32] = hasher.finalize().into();

    Ok(DilithiumKeypair {
        public_key: public_key.to_vec(),
        secret_key: secret_key.to_vec(),
        public_key_hash: hash,
    })
}

// =============================================================================
// Signing
// =============================================================================

/// Sign a message with Dilithium
///
/// # Performance
/// - Signing time: < 1ms on M3
/// - Memory: ~10 KB peak
pub fn sign_message(keypair: &DilithiumKeypair, message: &[u8]) -> Result<Vec<u8>, String> {
    let sk = dilithium3::SecretKey::from_bytes(&keypair.secret_key)
        .map_err(|_| "Invalid secret key")?;

    let signed = dilithium3::detached_sign(message, &sk);
    Ok(signed.as_bytes().to_vec())
}

/// Create a signature request for the prover network
pub fn create_signature_request(
    keypair: &DilithiumKeypair,
    message: &[u8],
    eth_address: Option<[u8; 20]>,
    amount: Option<u128>,
    nonce: u64,
) -> Result<SignatureRequest, String> {
    let signature = sign_message(keypair, message)?;

    Ok(SignatureRequest {
        public_key: keypair.public_key.clone(),
        public_key_hash: keypair.public_key_hash,
        message: message.to_vec(),
        signature,
        eth_address,
        amount,
        nonce,
    })
}

// =============================================================================
// Verification (for local testing)
// =============================================================================

/// Verify a Dilithium signature locally
///
/// Note: In production, verification is done by the prover network.
/// This is provided for testing and development.
pub fn verify_signature(
    public_key: &[u8],
    message: &[u8],
    signature: &[u8],
) -> Result<bool, String> {
    let pk = dilithium3::PublicKey::from_bytes(public_key)
        .map_err(|_| "Invalid public key")?;

    let sig = dilithium3::DetachedSignature::from_bytes(signature)
        .map_err(|_| "Invalid signature")?;

    Ok(dilithium3::verify_detached_signature(&sig, message, &pk).is_ok())
}

// =============================================================================
// Utility Functions
// =============================================================================

/// Compute Keccak256 hash of data
pub fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(data);
    hasher.finalize().into()
}

/// Compute attestation hash for on-chain verification
///
/// Format: keccak256(public_key_hash || message_hash || signature_hash || nonce)
pub fn compute_attestation_hash(request: &SignatureRequest) -> [u8; 32] {
    let message_hash = keccak256(&request.message);
    let signature_hash = keccak256(&request.signature);

    let mut data = Vec::new();
    data.extend_from_slice(&request.public_key_hash);
    data.extend_from_slice(&message_hash);
    data.extend_from_slice(&signature_hash);
    data.extend_from_slice(&request.nonce.to_be_bytes());

    if let Some(addr) = request.eth_address {
        data.extend_from_slice(&addr);
    }
    if let Some(amount) = request.amount {
        data.extend_from_slice(&amount.to_be_bytes());
    }

    keccak256(&data)
}

// =============================================================================
// WASM Bindings (optional)
// =============================================================================

#[cfg(feature = "wasm")]
mod wasm {
    use super::*;
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    pub struct WasmKeypair {
        inner: DilithiumKeypair,
    }

    #[wasm_bindgen]
    impl WasmKeypair {
        #[wasm_bindgen(constructor)]
        pub fn new() -> Self {
            Self {
                inner: generate_keypair(),
            }
        }

        #[wasm_bindgen(getter)]
        pub fn public_key(&self) -> Vec<u8> {
            self.inner.public_key.clone()
        }

        #[wasm_bindgen(getter)]
        pub fn public_key_hash(&self) -> Vec<u8> {
            self.inner.public_key_hash.to_vec()
        }

        pub fn sign(&self, message: &[u8]) -> Result<Vec<u8>, JsValue> {
            sign_message(&self.inner, message)
                .map_err(|e| JsValue::from_str(&e))
        }
    }

    #[wasm_bindgen]
    pub fn wasm_verify_signature(
        public_key: &[u8],
        message: &[u8],
        signature: &[u8],
    ) -> Result<bool, JsValue> {
        verify_signature(public_key, message, signature)
            .map_err(|e| JsValue::from_str(&e))
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keypair_generation() {
        let keypair = generate_keypair();

        assert_eq!(keypair.public_key.len(), dilithium3::public_key_bytes());
        assert_eq!(keypair.secret_key.len(), dilithium3::secret_key_bytes());
        assert_eq!(keypair.public_key_hash.len(), 32);
    }

    #[test]
    fn test_sign_and_verify() {
        let keypair = generate_keypair();
        let message = b"Hello, Quantum Shield!";

        let signature = sign_message(&keypair, message).unwrap();

        assert!(verify_signature(&keypair.public_key, message, &signature).unwrap());
    }

    #[test]
    fn test_invalid_signature_fails() {
        let keypair = generate_keypair();
        let message = b"Hello, Quantum Shield!";
        let wrong_message = b"Wrong message";

        let signature = sign_message(&keypair, message).unwrap();

        assert!(!verify_signature(&keypair.public_key, wrong_message, &signature).unwrap());
    }

    #[test]
    fn test_signature_request_creation() {
        let keypair = generate_keypair();
        let message = b"Bridge transfer";

        let request = create_signature_request(
            &keypair,
            message,
            Some([0u8; 20]),
            Some(1_000_000_000_000_000_000), // 1 ETH
            1,
        ).unwrap();

        assert_eq!(request.public_key, keypair.public_key);
        assert_eq!(request.message, message.to_vec());
        assert!(!request.signature.is_empty());
    }

    #[test]
    fn test_attestation_hash_deterministic() {
        let keypair = generate_keypair();
        let message = b"Test message";

        let request = create_signature_request(&keypair, message, None, None, 1).unwrap();

        let hash1 = compute_attestation_hash(&request);
        let hash2 = compute_attestation_hash(&request);

        assert_eq!(hash1, hash2);
    }
}
