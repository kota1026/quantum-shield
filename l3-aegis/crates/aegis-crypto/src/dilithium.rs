//! Dilithium Signature Verification
//!
//! Implements FIPS 204 compliant Dilithium-III signature verification
//! for user unlock request authentication.
//!
//! Reference: UNIFIED_SPEC_v2.0.md
//! - User署名: Dilithium-III (FIPS 204)
//! - Public Key: 1952 bytes
//! - Signature: 3309 bytes (pqcrypto-dilithium v0.5)

use aegis_core::{AegisError, Hash256, Result};
use pqcrypto_dilithium::dilithium3::{self, verify_detached_signature};
use pqcrypto_traits::sign::{PublicKey, DetachedSignature};
use sha3::{Digest, Sha3_256};

/// Dilithium-III parameter sizes (FIPS 204 Level 3)
/// Note: These sizes are from pqcrypto-dilithium v0.5
pub mod params {
    /// Public key size in bytes (Dilithium-III)
    pub const PUBLIC_KEY_SIZE: usize = 1952;
    /// Signature size in bytes (Dilithium-III, pqcrypto v0.5)
    pub const SIGNATURE_SIZE: usize = 3309;
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
    /// * `public_key` - Dilithium-III public key bytes (must be exactly 1952 bytes)
    /// * `message` - Message that was signed
    /// * `signature` - Dilithium-III signature bytes (must be exactly 3309 bytes)
    ///
    /// # Returns
    /// * `Ok(true)` if signature is valid
    /// * `Ok(false)` if signature is cryptographically invalid
    /// * `Err(InvalidPublicKey)` if public key size is wrong
    /// * `Err(InvalidSignature)` if signature size is wrong
    pub fn verify(
        &self,
        public_key: &[u8],
        message: &[u8],
        signature: &[u8],
    ) -> Result<bool> {
        // Strict size validation - do not rely on library's lenient parsing
        if public_key.len() != params::PUBLIC_KEY_SIZE {
            return Err(AegisError::InvalidPublicKey);
        }
        
        if signature.len() != params::SIGNATURE_SIZE {
            return Err(AegisError::InvalidSignature);
        }

        // Parse public key (should not fail after size check)
        let pk = dilithium3::PublicKey::from_bytes(public_key)
            .map_err(|_| AegisError::InvalidPublicKey)?;

        // Parse signature (should not fail after size check)
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

    /// Validate public key format (strict size check)
    pub fn validate_public_key(public_key: &[u8]) -> Result<()> {
        if public_key.len() != params::PUBLIC_KEY_SIZE {
            return Err(AegisError::InvalidPublicKey);
        }
        dilithium3::PublicKey::from_bytes(public_key)
            .map_err(|_| AegisError::InvalidPublicKey)?;
        Ok(())
    }

    /// Validate signature format (strict size check)
    pub fn validate_signature(signature: &[u8]) -> Result<()> {
        if signature.len() != params::SIGNATURE_SIZE {
            return Err(AegisError::InvalidSignature);
        }
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
        
        assert!(result.is_ok(), "verify failed: {:?}", result);
        assert!(result.unwrap(), "signature should be valid");
    }

    #[test]
    fn test_verify_invalid_signature_content() {
        let verifier = DilithiumVerifier::new();
        
        // Generate keypair
        let (pk, sk) = dilithium3::keypair();
        
        // Sign message
        let message = b"Original message";
        let signature = detached_sign(message, &sk);
        
        // Verify with different message - should return Ok(false)
        let wrong_message = b"Different message";
        let result = verifier.verify(
            pk.as_bytes(),
            wrong_message,
            signature.as_bytes(),
        );
        
        assert!(result.is_ok(), "verify should not error on valid-sized inputs");
        assert!(!result.unwrap(), "signature should be invalid for wrong message");
    }

    #[test]
    fn test_invalid_public_key_size() {
        let verifier = DilithiumVerifier::new();
        
        let invalid_pk = vec![0u8; 100]; // Wrong size
        let (_, sk) = dilithium3::keypair();
        let signature = detached_sign(b"test", &sk);
        
        let result = verifier.verify(&invalid_pk, b"test", signature.as_bytes());
        assert!(matches!(result, Err(AegisError::InvalidPublicKey)));
    }

    #[test]
    fn test_invalid_signature_size() {
        let verifier = DilithiumVerifier::new();
        
        let (pk, _) = dilithium3::keypair();
        let invalid_sig = vec![0u8; 100]; // Wrong size - must be rejected
        
        let result = verifier.verify(pk.as_bytes(), b"test", &invalid_sig);
        assert!(
            matches!(result, Err(AegisError::InvalidSignature)),
            "Expected InvalidSignature error for wrong-sized signature, got {:?}",
            result
        );
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
        
        assert!(result.is_ok(), "verify_with_domain failed: {:?}", result);
        assert!(result.unwrap(), "domain-separated signature should be valid");
    }

    #[test]
    fn test_public_key_size() {
        let (pk, _) = dilithium3::keypair();
        assert_eq!(pk.as_bytes().len(), params::PUBLIC_KEY_SIZE);
    }

    #[test]
    fn test_signature_size() {
        let (_, sk) = dilithium3::keypair();
        let sig = detached_sign(b"test", &sk);
        assert_eq!(sig.as_bytes().len(), params::SIGNATURE_SIZE);
    }
}
