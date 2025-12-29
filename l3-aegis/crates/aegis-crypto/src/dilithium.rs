//! Dilithium Signature Verification
//!
//! Implements FIPS 204 compliant Dilithium-III signature verification
//! for user unlock request authentication.
//!
//! Reference: UNIFIED_SPEC_v2.0.md
//! - User署名: Dilithium-III (FIPS 204)
//! - Public Key: 1952 bytes
//! - Signature: 3293 bytes

use aegis_core::{AegisError, Hash256, Result};
use pqcrypto_dilithium::dilithium3::{self, verify_detached_signature};
use pqcrypto_traits::sign::{PublicKey, DetachedSignature};
use sha3::{Digest, Sha3_256};

/// Dilithium-III parameter sizes (FIPS 204 Level 3)
pub mod params {
    /// Public key size in bytes
    pub const PUBLIC_KEY_SIZE: usize = 1952;
    /// Signature size in bytes
    pub const SIGNATURE_SIZE: usize = 3293;
    /// Security level (NIST Level 3)
    pub const SECURITY_LEVEL: u8 = 3;
}

/// Dilithium signature verifier
/// 
/// Reference: L3_AEGIS_ARCHITECTURE.md Section 5.2
pub struct DilithiumVerifier {
    /// Cached domain separator
    domain_separator: [u8; 32],
}

impl DilithiumVerifier {
    /// Create new verifier with domain separator
    pub fn new() -> Self {
        let domain = Sha3_256::digest(b"QUANTUM_SHIELD_DILITHIUM_V1");
        let mut domain_separator = [0u8; 32];
        domain_separator.copy_from_slice(&domain);
        
        Self { domain_separator }
    }

    /// Verify a Dilithium-III signature
    ///
    /// # Arguments
    /// * `public_key` - 1952-byte Dilithium-III public key
    /// * `message` - Message that was signed
    /// * `signature` - 3293-byte Dilithium-III signature
    ///
    /// # Returns
    /// * `Ok(true)` if signature is valid
    /// * `Ok(false)` if signature is invalid
    /// * `Err` if inputs are malformed
    pub fn verify(
        &self,
        public_key: &[u8],
        message: &[u8],
        signature: &[u8],
    ) -> Result<bool> {
        // Validate input sizes
        if public_key.len() != params::PUBLIC_KEY_SIZE {
            return Err(AegisError::InvalidPublicKey);
        }
        if signature.len() != params::SIGNATURE_SIZE {
            return Err(AegisError::InvalidSignature);
        }

        // Parse public key
        let pk = dilithium3::PublicKey::from_bytes(public_key)
            .map_err(|_| AegisError::InvalidPublicKey)?;

        // Parse signature
        let sig = dilithium3::DetachedSignature::from_bytes(signature)
            .map_err(|_| AegisError::InvalidSignature)?;

        // Verify signature
        match verify_detached_signature(&sig, message, &pk) {
            Ok(()) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Verify with domain-separated message
    ///
    /// Prepends domain separator to message before verification
    /// for additional security isolation.
    pub fn verify_with_domain(
        &self,
        public_key: &[u8],
        message: &[u8],
        signature: &[u8],
    ) -> Result<bool> {
        // Create domain-separated message
        let mut full_message = Vec::with_capacity(32 + message.len());
        full_message.extend_from_slice(&self.domain_separator);
        full_message.extend_from_slice(message);

        self.verify(public_key, &full_message, signature)
    }

    /// Compute hash of public key
    ///
    /// Used for storing compact references to public keys
    pub fn hash_public_key(public_key: &[u8]) -> Hash256 {
        Hash256::hash(public_key)
    }

    /// Validate public key format
    pub fn validate_public_key(public_key: &[u8]) -> Result<()> {
        if public_key.len() != params::PUBLIC_KEY_SIZE {
            return Err(AegisError::InvalidPublicKey);
        }
        
        // Try to parse as valid Dilithium public key
        dilithium3::PublicKey::from_bytes(public_key)
            .map_err(|_| AegisError::InvalidPublicKey)?;
        
        Ok(())
    }

    /// Validate signature format
    pub fn validate_signature(signature: &[u8]) -> Result<()> {
        if signature.len() != params::SIGNATURE_SIZE {
            return Err(AegisError::InvalidSignature);
        }
        
        // Try to parse as valid Dilithium signature
        dilithium3::DetachedSignature::from_bytes(signature)
            .map_err(|_| AegisError::InvalidSignature)?;
        
        Ok(())
    }
}

impl Default for DilithiumVerifier {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use pqcrypto_dilithium::dilithium3::{self, detached_sign};

    #[test]
    fn test_verify_valid_signature() {
        let verifier = DilithiumVerifier::new();
        
        // Generate keypair
        let (pk, sk) = dilithium3::keypair();
        
        // Sign message
        let message = b"Test unlock request for lock_id=0x1234";
        let signature = detached_sign(message, &sk);
        
        // Verify
        let result = verifier.verify(
            pk.as_bytes(),
            message,
            signature.as_bytes(),
        );
        
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_verify_invalid_signature() {
        let verifier = DilithiumVerifier::new();
        
        // Generate keypair
        let (pk, sk) = dilithium3::keypair();
        
        // Sign message
        let message = b"Original message";
        let signature = detached_sign(message, &sk);
        
        // Verify with different message
        let wrong_message = b"Different message";
        let result = verifier.verify(
            pk.as_bytes(),
            wrong_message,
            signature.as_bytes(),
        );
        
        assert!(result.is_ok());
        assert!(!result.unwrap());
    }

    #[test]
    fn test_invalid_public_key_size() {
        let verifier = DilithiumVerifier::new();
        
        let invalid_pk = vec![0u8; 100];
        let signature = vec![0u8; params::SIGNATURE_SIZE];
        
        let result = verifier.verify(&invalid_pk, b"test", &signature);
        assert!(matches!(result, Err(AegisError::InvalidPublicKey)));
    }

    #[test]
    fn test_invalid_signature_size() {
        let verifier = DilithiumVerifier::new();
        
        let (pk, _) = dilithium3::keypair();
        let invalid_sig = vec![0u8; 100];
        
        let result = verifier.verify(pk.as_bytes(), b"test", &invalid_sig);
        assert!(matches!(result, Err(AegisError::InvalidSignature)));
    }

    #[test]
    fn test_hash_public_key() {
        let (pk, _) = dilithium3::keypair();
        
        let hash1 = DilithiumVerifier::hash_public_key(pk.as_bytes());
        let hash2 = DilithiumVerifier::hash_public_key(pk.as_bytes());
        
        assert_eq!(hash1, hash2);
        assert_ne!(hash1, Hash256::ZERO);
    }

    #[test]
    fn test_verify_with_domain() {
        let verifier = DilithiumVerifier::new();
        
        let (pk, sk) = dilithium3::keypair();
        let message = b"Test message";
        
        // Create domain-separated message manually
        let mut full_message = Vec::new();
        full_message.extend_from_slice(&verifier.domain_separator);
        full_message.extend_from_slice(message);
        
        let signature = detached_sign(&full_message, &sk);
        
        let result = verifier.verify_with_domain(
            pk.as_bytes(),
            message,
            signature.as_bytes(),
        );
        
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
}
