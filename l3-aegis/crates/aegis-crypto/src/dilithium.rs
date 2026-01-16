//! Dilithium Signature Implementation (FIPS 204 ML-DSA-65)
//!
//! Implements FIPS 204 compliant ML-DSA-65 (Dilithium-III) signature
//! generation and verification for L3 Aegis sequencer operations.
//!
//! Reference: UNIFIED_SPEC_v2.0.md
//! - User署名: Dilithium-III (FIPS 204)
//! - Public Key: 1952 bytes
//! - Secret Key: 4032 bytes
//! - Signature: 3309 bytes

use aegis_core::{AegisError, Hash256, Result};
use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Signer, Verifier};
use sha3::{Digest, Sha3_256};

/// ML-DSA-65 parameter sizes (FIPS 204 Level 3)
pub mod params {
    /// Public key size in bytes (ML-DSA-65)
    pub const PUBLIC_KEY_SIZE: usize = 1952;
    /// Secret key size in bytes (ML-DSA-65)
    pub const SECRET_KEY_SIZE: usize = 4032;
    /// Signature size in bytes (ML-DSA-65)
    pub const SIGNATURE_SIZE: usize = 3309;
    /// Security level (NIST Level 3)
    pub const SECURITY_LEVEL: u8 = 3;
}

/// Dilithium key pair for signing operations
pub struct DilithiumKeyPair {
    /// Public key bytes
    pub public_key: [u8; params::PUBLIC_KEY_SIZE],
    /// Secret key bytes
    pub secret_key: [u8; params::SECRET_KEY_SIZE],
    /// SHA3-256 hash of public key
    pub public_key_hash: Hash256,
}

impl DilithiumKeyPair {
    /// Generate a new ML-DSA-65 key pair
    pub fn generate() -> Result<Self> {
        let (pk, sk) = ml_dsa_65::try_keygen()
            .map_err(|_| AegisError::CryptoError("Key generation failed".into()))?;

        let public_key = pk.clone().into_bytes();
        let secret_key = sk.into_bytes();
        let public_key_hash = Hash256::hash(&public_key);

        Ok(Self {
            public_key,
            secret_key,
            public_key_hash,
        })
    }

    /// Reconstruct from bytes
    pub fn from_bytes(
        public_key: &[u8],
        secret_key: &[u8],
    ) -> Result<Self> {
        if public_key.len() != params::PUBLIC_KEY_SIZE {
            return Err(AegisError::InvalidPublicKey);
        }
        if secret_key.len() != params::SECRET_KEY_SIZE {
            return Err(AegisError::CryptoError("Invalid secret key size".into()));
        }

        let mut pk_bytes = [0u8; params::PUBLIC_KEY_SIZE];
        pk_bytes.copy_from_slice(public_key);

        let mut sk_bytes = [0u8; params::SECRET_KEY_SIZE];
        sk_bytes.copy_from_slice(secret_key);

        let public_key_hash = Hash256::hash(&pk_bytes);

        Ok(Self {
            public_key: pk_bytes,
            secret_key: sk_bytes,
            public_key_hash,
        })
    }

    /// Sign a message with this key pair
    pub fn sign(&self, message: &[u8]) -> Result<[u8; params::SIGNATURE_SIZE]> {
        let sk = ml_dsa_65::PrivateKey::try_from_bytes(self.secret_key)
            .map_err(|_| AegisError::CryptoError("Invalid secret key".into()))?;

        let signature = sk.try_sign(message, &[])
            .map_err(|_| AegisError::CryptoError("Signing failed".into()))?;

        Ok(signature)
    }
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

    /// Verify a ML-DSA-65 signature
    ///
    /// # Arguments
    /// * `public_key` - ML-DSA-65 public key bytes (must be exactly 1952 bytes)
    /// * `message` - Message that was signed
    /// * `signature` - ML-DSA-65 signature bytes (must be exactly 3309 bytes)
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
        // Strict size validation
        if public_key.len() != params::PUBLIC_KEY_SIZE {
            return Err(AegisError::InvalidPublicKey);
        }

        if signature.len() != params::SIGNATURE_SIZE {
            return Err(AegisError::InvalidSignature);
        }

        // Convert to fixed-size arrays
        let pk_bytes: [u8; params::PUBLIC_KEY_SIZE] = public_key
            .try_into()
            .map_err(|_| AegisError::InvalidPublicKey)?;

        let sig_bytes: [u8; params::SIGNATURE_SIZE] = signature
            .try_into()
            .map_err(|_| AegisError::InvalidSignature)?;

        // Parse public key
        let pk = ml_dsa_65::PublicKey::try_from_bytes(pk_bytes)
            .map_err(|_| AegisError::InvalidPublicKey)?;

        // Verify signature (fips204 returns bool directly)
        Ok(pk.verify(message, &sig_bytes, &[]))
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

    /// Sign a message with domain separator
    pub fn sign_with_domain(
        &self,
        key_pair: &DilithiumKeyPair,
        message: &[u8],
    ) -> Result<[u8; params::SIGNATURE_SIZE]> {
        let mut full_message = Vec::with_capacity(32 + message.len());
        full_message.extend_from_slice(&self.domain_separator);
        full_message.extend_from_slice(message);

        key_pair.sign(&full_message)
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

        let pk_bytes: [u8; params::PUBLIC_KEY_SIZE] = public_key
            .try_into()
            .map_err(|_| AegisError::InvalidPublicKey)?;

        ml_dsa_65::PublicKey::try_from_bytes(pk_bytes)
            .map_err(|_| AegisError::InvalidPublicKey)?;
        Ok(())
    }

    /// Validate signature format (strict size check)
    pub fn validate_signature(signature: &[u8]) -> Result<()> {
        if signature.len() != params::SIGNATURE_SIZE {
            return Err(AegisError::InvalidSignature);
        }
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

    #[test]
    fn test_keygen() {
        let kp = DilithiumKeyPair::generate().unwrap();
        assert_eq!(kp.public_key.len(), params::PUBLIC_KEY_SIZE);
        assert_eq!(kp.secret_key.len(), params::SECRET_KEY_SIZE);
        assert_ne!(kp.public_key_hash, Hash256::ZERO);
    }

    #[test]
    fn test_sign_and_verify() {
        let kp = DilithiumKeyPair::generate().unwrap();
        let verifier = DilithiumVerifier::new();

        let message = b"Test unlock request for lock_id=0x1234";
        let signature = kp.sign(message).unwrap();

        assert_eq!(signature.len(), params::SIGNATURE_SIZE);

        let result = verifier.verify(&kp.public_key, message, &signature);
        assert!(result.is_ok(), "verify failed: {:?}", result);
        assert!(result.unwrap(), "signature should be valid");
    }

    #[test]
    fn test_verify_invalid_signature_content() {
        let kp = DilithiumKeyPair::generate().unwrap();
        let verifier = DilithiumVerifier::new();

        let message = b"Original message";
        let signature = kp.sign(message).unwrap();

        // Verify with different message - should return Ok(false)
        let wrong_message = b"Different message";
        let result = verifier.verify(&kp.public_key, wrong_message, &signature);

        assert!(result.is_ok(), "verify should not error on valid-sized inputs");
        assert!(!result.unwrap(), "signature should be invalid for wrong message");
    }

    #[test]
    fn test_invalid_public_key_size() {
        let verifier = DilithiumVerifier::new();

        let invalid_pk = vec![0u8; 100]; // Wrong size
        let signature = vec![0u8; params::SIGNATURE_SIZE];

        let result = verifier.verify(&invalid_pk, b"test", &signature);
        assert!(matches!(result, Err(AegisError::InvalidPublicKey)));
    }

    #[test]
    fn test_invalid_signature_size() {
        let verifier = DilithiumVerifier::new();

        let kp = DilithiumKeyPair::generate().unwrap();
        let invalid_sig = vec![0u8; 100]; // Wrong size

        let result = verifier.verify(&kp.public_key, b"test", &invalid_sig);
        assert!(
            matches!(result, Err(AegisError::InvalidSignature)),
            "Expected InvalidSignature error for wrong-sized signature, got {:?}",
            result
        );
    }

    #[test]
    fn test_hash_public_key() {
        let kp = DilithiumKeyPair::generate().unwrap();

        let hash1 = DilithiumVerifier::hash_public_key(&kp.public_key);
        let hash2 = DilithiumVerifier::hash_public_key(&kp.public_key);

        assert_eq!(hash1, hash2);
        assert_ne!(hash1, Hash256::ZERO);
    }

    #[test]
    fn test_sign_and_verify_with_domain() {
        let kp = DilithiumKeyPair::generate().unwrap();
        let verifier = DilithiumVerifier::new();

        let message = b"Test message";
        let signature = verifier.sign_with_domain(&kp, message).unwrap();

        let result = verifier.verify_with_domain(&kp.public_key, message, &signature);

        assert!(result.is_ok(), "verify_with_domain failed: {:?}", result);
        assert!(result.unwrap(), "domain-separated signature should be valid");
    }

    #[test]
    fn test_public_key_size() {
        let kp = DilithiumKeyPair::generate().unwrap();
        assert_eq!(kp.public_key.len(), params::PUBLIC_KEY_SIZE);
    }

    #[test]
    fn test_signature_size() {
        let kp = DilithiumKeyPair::generate().unwrap();
        let sig = kp.sign(b"test").unwrap();
        assert_eq!(sig.len(), params::SIGNATURE_SIZE);
    }

    #[test]
    fn test_keypair_from_bytes() {
        let kp1 = DilithiumKeyPair::generate().unwrap();
        let kp2 = DilithiumKeyPair::from_bytes(&kp1.public_key, &kp1.secret_key).unwrap();

        assert_eq!(kp1.public_key, kp2.public_key);
        assert_eq!(kp1.secret_key, kp2.secret_key);
        assert_eq!(kp1.public_key_hash, kp2.public_key_hash);
    }
}
