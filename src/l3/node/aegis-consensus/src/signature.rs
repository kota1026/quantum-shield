//! Consensus Message Signing
//!
//! Implements Dilithium-III signing and verification for PBFT consensus messages.
//! Reference: L3_CHAIN_SPECIFICATION.md §3.6, CP-1 (Complete Quantum Resistance)

use pqcrypto_dilithium::dilithium3::{self, DetachedSignature, PublicKey, SecretKey};
use pqcrypto_traits::sign::{
    DetachedSignature as DetachedSignatureTrait, 
    PublicKey as PublicKeyTrait,
    SecretKey as SecretKeyTrait,
};
use sha3::{Digest, Sha3_256};

/// Dilithium-III parameter sizes (FIPS 204 Level 3)
pub mod params {
    /// Public key size in bytes
    pub const PUBLIC_KEY_SIZE: usize = 1952;
    /// Secret key size in bytes
    pub const SECRET_KEY_SIZE: usize = 4032;
    /// Signature size in bytes
    pub const SIGNATURE_SIZE: usize = 3309;
    /// NIST security level
    pub const SECURITY_LEVEL: u8 = 3;
}

/// Domain separator for consensus messages
const CONSENSUS_DOMAIN: &[u8] = b"QUANTUM_SHIELD_CONSENSUS_V1";

/// 32-byte hash type
pub type Hash256 = [u8; 32];

/// Node signing key pair
#[derive(Clone)]
pub struct NodeKeyPair {
    /// Dilithium public key
    pub public_key: PublicKey,
    /// Dilithium secret key
    secret_key: SecretKey,
    /// Node ID
    pub node_id: u8,
}

impl NodeKeyPair {
    /// Generate a new random keypair for a node
    pub fn generate(node_id: u8) -> Self {
        let (public_key, secret_key) = dilithium3::keypair();
        Self {
            public_key,
            secret_key,
            node_id,
        }
    }
    
    /// Create from existing key bytes
    pub fn from_bytes(
        node_id: u8,
        public_key_bytes: &[u8],
        secret_key_bytes: &[u8],
    ) -> Result<Self, SignatureError> {
        if public_key_bytes.len() != params::PUBLIC_KEY_SIZE {
            return Err(SignatureError::InvalidPublicKeySize);
        }
        if secret_key_bytes.len() != params::SECRET_KEY_SIZE {
            return Err(SignatureError::InvalidSecretKeySize);
        }
        
        let public_key = PublicKey::from_bytes(public_key_bytes)
            .map_err(|_| SignatureError::InvalidPublicKey)?;
        let secret_key = SecretKey::from_bytes(secret_key_bytes)
            .map_err(|_| SignatureError::InvalidSecretKey)?;
            
        Ok(Self {
            public_key,
            secret_key,
            node_id,
        })
    }
    
    /// Get public key bytes
    pub fn public_key_bytes(&self) -> &[u8] {
        self.public_key.as_bytes()
    }
    
    /// Sign a message
    pub fn sign(&self, message: &[u8]) -> DilithiumSignature {
        let full_message = Self::create_domain_message(message);
        let sig = dilithium3::detached_sign(&full_message, &self.secret_key);
        
        DilithiumSignature {
            bytes: sig.as_bytes().to_vec(),
            signer_id: self.node_id,
        }
    }
    
    /// Create domain-separated message
    fn create_domain_message(message: &[u8]) -> Vec<u8> {
        let mut full_message = Vec::with_capacity(CONSENSUS_DOMAIN.len() + message.len());
        full_message.extend_from_slice(CONSENSUS_DOMAIN);
        full_message.extend_from_slice(message);
        full_message
    }
}

impl std::fmt::Debug for NodeKeyPair {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("NodeKeyPair")
            .field("node_id", &self.node_id)
            .field("public_key", &format!("PublicKey[{}]", self.public_key.as_bytes().len()))
            .field("secret_key", &"[REDACTED]")
            .finish()
    }
}

/// Dilithium-III signature with metadata
#[derive(Debug, Clone)]
pub struct DilithiumSignature {
    /// Raw signature bytes (3309 bytes)
    pub bytes: Vec<u8>,
    /// Signer node ID
    pub signer_id: u8,
}

impl DilithiumSignature {
    /// Create empty signature (for unsigned messages)
    pub fn empty(signer_id: u8) -> Self {
        Self {
            bytes: Vec::new(),
            signer_id,
        }
    }
    
    /// Check if signature is present
    pub fn is_signed(&self) -> bool {
        !self.bytes.is_empty()
    }
    
    /// Get signature size
    pub fn size(&self) -> usize {
        self.bytes.len()
    }
}

/// Signature verifier for consensus messages
#[derive(Debug, Default)]
pub struct ConsensusVerifier {
    /// Cached domain separator hash
    domain_hash: Hash256,
}

impl ConsensusVerifier {
    /// Create new verifier
    pub fn new() -> Self {
        let domain_hash = Sha3_256::digest(CONSENSUS_DOMAIN).into();
        Self { domain_hash }
    }
    
    /// Verify a consensus message signature
    pub fn verify(
        &self,
        message: &[u8],
        signature: &DilithiumSignature,
        public_key: &PublicKey,
    ) -> Result<bool, SignatureError> {
        if !signature.is_signed() {
            return Err(SignatureError::EmptySignature);
        }
        
        if signature.bytes.len() != params::SIGNATURE_SIZE {
            return Err(SignatureError::InvalidSignatureSize);
        }
        
        let sig = DetachedSignature::from_bytes(&signature.bytes)
            .map_err(|_| SignatureError::InvalidSignature)?;
            
        // Create domain-separated message
        let full_message = NodeKeyPair::create_domain_message(message);
        
        match dilithium3::verify_detached_signature(&sig, &full_message, public_key) {
            Ok(()) => Ok(true),
            Err(_) => Ok(false),
        }
    }
    
    /// Verify signature using public key bytes
    pub fn verify_with_bytes(
        &self,
        message: &[u8],
        signature: &DilithiumSignature,
        public_key_bytes: &[u8],
    ) -> Result<bool, SignatureError> {
        if public_key_bytes.len() != params::PUBLIC_KEY_SIZE {
            return Err(SignatureError::InvalidPublicKeySize);
        }
        
        let public_key = PublicKey::from_bytes(public_key_bytes)
            .map_err(|_| SignatureError::InvalidPublicKey)?;
            
        self.verify(message, signature, &public_key)
    }
}

/// Signature errors
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SignatureError {
    /// Public key size is invalid
    InvalidPublicKeySize,
    /// Secret key size is invalid
    InvalidSecretKeySize,
    /// Public key format is invalid
    InvalidPublicKey,
    /// Secret key format is invalid
    InvalidSecretKey,
    /// Signature size is invalid
    InvalidSignatureSize,
    /// Signature format is invalid
    InvalidSignature,
    /// Signature is empty
    EmptySignature,
    /// Signature verification failed
    VerificationFailed,
}

impl std::fmt::Display for SignatureError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SignatureError::InvalidPublicKeySize => {
                write!(f, "Invalid public key size (expected {} bytes)", params::PUBLIC_KEY_SIZE)
            }
            SignatureError::InvalidSecretKeySize => {
                write!(f, "Invalid secret key size (expected {} bytes)", params::SECRET_KEY_SIZE)
            }
            SignatureError::InvalidPublicKey => write!(f, "Invalid public key format"),
            SignatureError::InvalidSecretKey => write!(f, "Invalid secret key format"),
            SignatureError::InvalidSignatureSize => {
                write!(f, "Invalid signature size (expected {} bytes)", params::SIGNATURE_SIZE)
            }
            SignatureError::InvalidSignature => write!(f, "Invalid signature format"),
            SignatureError::EmptySignature => write!(f, "Signature is empty"),
            SignatureError::VerificationFailed => write!(f, "Signature verification failed"),
        }
    }
}

impl std::error::Error for SignatureError {}

/// Aggregate validator signatures for a block
#[derive(Debug, Clone, Default)]
pub struct ValidatorSignatures {
    /// Individual signatures from validators
    signatures: Vec<DilithiumSignature>,
    /// Block hash that was signed
    block_hash: Hash256,
}

impl ValidatorSignatures {
    /// Create new aggregate for a block hash
    pub fn new(block_hash: Hash256) -> Self {
        Self {
            signatures: Vec::with_capacity(4),
            block_hash,
        }
    }
    
    /// Add a validator signature
    pub fn add(&mut self, signature: DilithiumSignature) {
        // Avoid duplicates from same signer
        if !self.signatures.iter().any(|s| s.signer_id == signature.signer_id) {
            self.signatures.push(signature);
        }
    }
    
    /// Get number of signatures
    pub fn count(&self) -> usize {
        self.signatures.len()
    }
    
    /// Check if quorum is reached (3/4 for 4 nodes)
    pub fn has_quorum(&self, quorum: usize) -> bool {
        self.signatures.len() >= quorum
    }
    
    /// Get all signatures
    pub fn iter(&self) -> impl Iterator<Item = &DilithiumSignature> {
        self.signatures.iter()
    }
    
    /// Get block hash
    pub fn block_hash(&self) -> Hash256 {
        self.block_hash
    }
    
    /// Total signature data size (for gas estimation)
    pub fn total_size(&self) -> usize {
        self.signatures.iter().map(|s| s.size()).sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keypair_generation() {
        let keypair = NodeKeyPair::generate(0);
        
        assert_eq!(keypair.node_id, 0);
        assert_eq!(keypair.public_key_bytes().len(), params::PUBLIC_KEY_SIZE);
    }

    #[test]
    fn test_sign_and_verify() {
        let keypair = NodeKeyPair::generate(1);
        let verifier = ConsensusVerifier::new();
        
        let message = b"Test consensus message";
        let signature = keypair.sign(message);
        
        assert!(signature.is_signed());
        assert_eq!(signature.size(), params::SIGNATURE_SIZE);
        assert_eq!(signature.signer_id, 1);
        
        let result = verifier.verify(message, &signature, &keypair.public_key);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_verify_wrong_message() {
        let keypair = NodeKeyPair::generate(0);
        let verifier = ConsensusVerifier::new();
        
        let message = b"Original message";
        let signature = keypair.sign(message);
        
        let wrong_message = b"Wrong message";
        let result = verifier.verify(wrong_message, &signature, &keypair.public_key);
        
        assert!(result.is_ok());
        assert!(!result.unwrap(), "Signature should be invalid for wrong message");
    }

    #[test]
    fn test_verify_wrong_key() {
        let keypair1 = NodeKeyPair::generate(0);
        let keypair2 = NodeKeyPair::generate(1);
        let verifier = ConsensusVerifier::new();
        
        let message = b"Test message";
        let signature = keypair1.sign(message);
        
        // Verify with different public key
        let result = verifier.verify(message, &signature, &keypair2.public_key);
        
        assert!(result.is_ok());
        assert!(!result.unwrap(), "Signature should be invalid for wrong key");
    }

    #[test]
    fn test_empty_signature_error() {
        let keypair = NodeKeyPair::generate(0);
        let verifier = ConsensusVerifier::new();
        
        let empty_sig = DilithiumSignature::empty(0);
        let result = verifier.verify(b"test", &empty_sig, &keypair.public_key);
        
        assert!(matches!(result, Err(SignatureError::EmptySignature)));
    }

    #[test]
    fn test_invalid_signature_size() {
        let keypair = NodeKeyPair::generate(0);
        let verifier = ConsensusVerifier::new();
        
        let bad_sig = DilithiumSignature {
            bytes: vec![0u8; 100], // Wrong size
            signer_id: 0,
        };
        
        let result = verifier.verify(b"test", &bad_sig, &keypair.public_key);
        assert!(matches!(result, Err(SignatureError::InvalidSignatureSize)));
    }

    #[test]
    fn test_validator_signatures_aggregate() {
        let block_hash = [1u8; 32];
        let mut agg = ValidatorSignatures::new(block_hash);
        
        assert_eq!(agg.count(), 0);
        assert!(!agg.has_quorum(3));
        
        // Add signatures from different nodes
        for i in 0..3 {
            let keypair = NodeKeyPair::generate(i);
            let sig = keypair.sign(&block_hash);
            agg.add(sig);
        }
        
        assert_eq!(agg.count(), 3);
        assert!(agg.has_quorum(3));
        assert_eq!(agg.block_hash(), block_hash);
    }

    #[test]
    fn test_validator_signatures_no_duplicates() {
        let block_hash = [2u8; 32];
        let mut agg = ValidatorSignatures::new(block_hash);
        
        let keypair = NodeKeyPair::generate(0);
        let sig1 = keypair.sign(&block_hash);
        let sig2 = keypair.sign(&block_hash);
        
        agg.add(sig1);
        agg.add(sig2); // Duplicate from same signer
        
        assert_eq!(agg.count(), 1, "Should not add duplicate from same signer");
    }

    #[test]
    fn test_cp1_compliance() {
        // Verify Dilithium-III (FIPS 204) parameter sizes
        assert_eq!(params::PUBLIC_KEY_SIZE, 1952);
        assert_eq!(params::SIGNATURE_SIZE, 3309);
        assert_eq!(params::SECURITY_LEVEL, 3);
        
        // Generate keypair and verify sizes
        let keypair = NodeKeyPair::generate(0);
        assert_eq!(keypair.public_key_bytes().len(), params::PUBLIC_KEY_SIZE);
        
        let sig = keypair.sign(b"test");
        assert_eq!(sig.size(), params::SIGNATURE_SIZE);
    }

    #[test]
    fn test_signature_size_per_block() {
        // L3_CHAIN_SPECIFICATION §3.6: 4 signatures × ~3KB = ~12KB
        let block_hash = [3u8; 32];
        let mut agg = ValidatorSignatures::new(block_hash);
        
        for i in 0..4 {
            let keypair = NodeKeyPair::generate(i);
            let sig = keypair.sign(&block_hash);
            agg.add(sig);
        }
        
        let total = agg.total_size();
        assert_eq!(total, 4 * params::SIGNATURE_SIZE);
        assert!(total >= 12000, "Total signature size should be ~12KB");
        assert!(total < 14000, "Total signature size should be ~12KB");
    }
}
