//! SPHINCS+ Service for Public Key and Signature Verification
//!
//! Implements CP-1 compliant SPHINCS+-128s verification for Prover registration.
//!
//! SPHINCS+-128s Parameters (NIST Level 1):
//! - Public Key Size: 32 bytes
//! - Signature Size: 7,856 bytes
//! - Security: 128-bit post-quantum
//!
//! References:
//! - SEQUENCES §5: Prover Registration
//! - CORE_PRINCIPLES CP-1: 完全量子耐性

use fips205::slh_dsa_shake_128s;
use fips205::traits::{SerDes, Verifier};
use sha3::{Digest, Sha3_256};

/// SPHINCS+-128s public key size in bytes
pub const SPHINCS_PUBLIC_KEY_BYTES: usize = 32;

/// SPHINCS+-128s signature size in bytes
pub const SPHINCS_SIGNATURE_BYTES: usize = 7856;

/// SPHINCS+ Service Error types
#[derive(Debug, thiserror::Error)]
pub enum SphincsError {
    #[error("Invalid public key size: expected {expected} bytes, got {actual}")]
    InvalidPublicKeySize { expected: usize, actual: usize },

    #[error("Invalid public key format: {0}")]
    InvalidPublicKeyFormat(String),

    #[error("Invalid signature size: expected {expected} bytes, got {actual}")]
    InvalidSignatureSize { expected: usize, actual: usize },

    #[error("Invalid signature format: {0}")]
    InvalidSignatureFormat(String),

    #[error("Signature verification failed")]
    VerificationFailed,

    #[error("Invalid hex encoding: {0}")]
    InvalidHex(String),

    #[error("HSM attestation invalid: {0}")]
    InvalidHsmAttestation(String),
}

/// SPHINCS+ Service for key and signature operations
pub struct SphincsService;

impl SphincsService {
    /// Validate SPHINCS+-128s public key format and size
    ///
    /// Checks:
    /// 1. Hex prefix "0x"
    /// 2. Valid hex encoding
    /// 3. Correct size (32 bytes = 64 hex chars)
    ///
    /// # Arguments
    /// * `pubkey` - Hex-encoded public key with "0x" prefix
    ///
    /// # Returns
    /// * `Ok(true)` if valid
    /// * `Err(SphincsError)` if invalid
    pub fn validate_public_key(pubkey: &str) -> Result<bool, SphincsError> {
        // Check prefix
        if !pubkey.starts_with("0x") {
            return Err(SphincsError::InvalidPublicKeyFormat(
                "Public key must start with '0x' prefix".to_string(),
            ));
        }

        // Get hex part (after 0x)
        let hex_part = &pubkey[2..];

        // Check hex encoding
        if hex::decode(hex_part).is_err() {
            return Err(SphincsError::InvalidHex(
                "Invalid hex encoding in public key".to_string(),
            ));
        }

        // Check size (32 bytes = 64 hex chars)
        let expected_hex_len = SPHINCS_PUBLIC_KEY_BYTES * 2;
        if hex_part.len() != expected_hex_len {
            return Err(SphincsError::InvalidPublicKeySize {
                expected: SPHINCS_PUBLIC_KEY_BYTES,
                actual: hex_part.len() / 2,
            });
        }

        Ok(true)
    }

    /// Parse public key from hex string to bytes
    ///
    /// # Arguments
    /// * `pubkey` - Hex-encoded public key with "0x" prefix
    ///
    /// # Returns
    /// * `Ok([u8; 32])` - Public key bytes
    /// * `Err(SphincsError)` - If invalid
    pub fn parse_public_key(pubkey: &str) -> Result<[u8; SPHINCS_PUBLIC_KEY_BYTES], SphincsError> {
        // Validate first
        Self::validate_public_key(pubkey)?;

        // Parse hex
        let hex_part = &pubkey[2..];
        let bytes = hex::decode(hex_part)
            .map_err(|e| SphincsError::InvalidHex(e.to_string()))?;

        // Convert to fixed array
        let mut result = [0u8; SPHINCS_PUBLIC_KEY_BYTES];
        result.copy_from_slice(&bytes);

        Ok(result)
    }

    /// Validate SPHINCS+-128s signature format and size
    ///
    /// # Arguments
    /// * `signature` - Hex-encoded signature with "0x" prefix
    ///
    /// # Returns
    /// * `Ok(true)` if valid format
    /// * `Err(SphincsError)` if invalid
    pub fn validate_signature_format(signature: &str) -> Result<bool, SphincsError> {
        // Check prefix
        if !signature.starts_with("0x") {
            return Err(SphincsError::InvalidSignatureFormat(
                "Signature must start with '0x' prefix".to_string(),
            ));
        }

        // Get hex part
        let hex_part = &signature[2..];

        // Check hex encoding
        if hex::decode(hex_part).is_err() {
            return Err(SphincsError::InvalidHex(
                "Invalid hex encoding in signature".to_string(),
            ));
        }

        // Check size (7856 bytes = 15712 hex chars)
        let expected_hex_len = SPHINCS_SIGNATURE_BYTES * 2;
        if hex_part.len() != expected_hex_len {
            return Err(SphincsError::InvalidSignatureSize {
                expected: SPHINCS_SIGNATURE_BYTES,
                actual: hex_part.len() / 2,
            });
        }

        Ok(true)
    }

    /// Verify SPHINCS+-128s (SLH-DSA-SHAKE-128s) signature
    ///
    /// Uses NIST FIPS 205 compliant verification via the fips205 crate.
    /// SLH-DSA-SHAKE-128s parameters:
    /// - Public Key: 32 bytes
    /// - Signature: 7,856 bytes
    /// - Hash: SHAKE-256
    ///
    /// # Arguments
    /// * `message` - Message bytes that were signed
    /// * `signature` - Hex-encoded signature with "0x" prefix
    /// * `pubkey` - Hex-encoded public key with "0x" prefix
    ///
    /// # Returns
    /// * `Ok(true)` if signature is valid
    /// * `Err(SphincsError)` if invalid
    pub fn verify_signature(
        message: &[u8],
        signature: &str,
        pubkey: &str,
    ) -> Result<bool, SphincsError> {
        // Validate formats first
        Self::validate_public_key(pubkey)?;
        Self::validate_signature_format(signature)?;

        // Parse public key bytes
        let pk_bytes = Self::parse_public_key(pubkey)?;

        // Parse signature bytes
        let sig_hex = &signature[2..]; // strip "0x"
        let sig_bytes = hex::decode(sig_hex)
            .map_err(|e| SphincsError::InvalidHex(e.to_string()))?;

        // Deserialize public key using FIPS 205 API
        let public_key = slh_dsa_shake_128s::PublicKey::try_from_bytes(pk_bytes)
            .map_err(|_| SphincsError::InvalidPublicKeyFormat(
                "Failed to parse SLH-DSA-SHAKE-128s public key".to_string(),
            ))?;

        // Deserialize signature - convert Vec<u8> to fixed-size array
        let sig_array: [u8; SPHINCS_SIGNATURE_BYTES] = sig_bytes
            .try_into()
            .map_err(|_| SphincsError::InvalidSignatureSize {
                expected: SPHINCS_SIGNATURE_BYTES,
                actual: 0, // already validated above
            })?;

        // Verify signature using FIPS 205 API
        let result = public_key.try_verify_vt(message, &sig_array);

        match result {
            Ok(true) => {
                tracing::debug!("SPHINCS+ signature verified successfully (FIPS 205)");
                Ok(true)
            }
            _ => {
                tracing::warn!("SPHINCS+ signature verification failed");
                Err(SphincsError::VerificationFailed)
            }
        }
    }

    /// Validate HSM attestation for Prover registration
    ///
    /// HSM attestation proves that the SPHINCS+ private key is stored in
    /// a Hardware Security Module meeting required security standards.
    ///
    /// # Arguments
    /// * `attestation` - HSM attestation document
    /// * `pubkey` - SPHINCS+ public key to attest
    ///
    /// # Returns
    /// * `Ok(true)` if attestation is valid
    /// * `Err(SphincsError)` if invalid
    pub fn validate_hsm_attestation(
        attestation: &str,
        pubkey: &str,
    ) -> Result<bool, SphincsError> {
        // Basic validation
        if attestation.is_empty() {
            return Err(SphincsError::InvalidHsmAttestation(
                "Attestation cannot be empty".to_string(),
            ));
        }

        // Validate public key format
        Self::validate_public_key(pubkey)?;

        // TODO: Implement actual HSM attestation verification
        // This would verify:
        // 1. Attestation signature from HSM vendor
        // 2. Key binding to the specific public key
        // 3. HSM security level meets requirements (FIPS 140-2 Level 3+)

        // For development: basic format check
        if !attestation.starts_with("HSM_ATT_") {
            return Err(SphincsError::InvalidHsmAttestation(
                "Invalid attestation format".to_string(),
            ));
        }

        tracing::debug!("HSM attestation format validated (actual verification pending)");

        Ok(true)
    }

    /// Compute public key hash using SHA3-256 (CP-1 compliant)
    ///
    /// # Arguments
    /// * `pubkey` - SPHINCS+ public key bytes
    ///
    /// # Returns
    /// * 32-byte hash
    pub fn compute_pubkey_hash(pubkey: &[u8; SPHINCS_PUBLIC_KEY_BYTES]) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        hasher.update(b"SPHINCS_PUBKEY_V1");
        hasher.update(pubkey);
        let result = hasher.finalize();

        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        hash
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_pubkey() -> String {
        // 32 bytes = 64 hex chars
        format!("0x{}", "a".repeat(64))
    }

    fn valid_signature() -> String {
        // 7856 bytes = 15712 hex chars
        format!("0x{}", "b".repeat(15712))
    }

    #[test]
    fn test_sphincs_constants() {
        assert_eq!(SPHINCS_PUBLIC_KEY_BYTES, 32);
        assert_eq!(SPHINCS_SIGNATURE_BYTES, 7856);
    }

    #[test]
    fn test_validate_public_key_valid() {
        let pubkey = valid_pubkey();
        let result = SphincsService::validate_public_key(&pubkey);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_validate_public_key_no_prefix() {
        let pubkey = "a".repeat(64);
        let result = SphincsService::validate_public_key(&pubkey);
        assert!(result.is_err());
        match result {
            Err(SphincsError::InvalidPublicKeyFormat(_)) => {}
            _ => panic!("Expected InvalidPublicKeyFormat error"),
        }
    }

    #[test]
    fn test_validate_public_key_wrong_size() {
        let pubkey = format!("0x{}", "a".repeat(32)); // Only 16 bytes
        let result = SphincsService::validate_public_key(&pubkey);
        assert!(result.is_err());
        match result {
            Err(SphincsError::InvalidPublicKeySize { expected, actual }) => {
                assert_eq!(expected, 32);
                assert_eq!(actual, 16);
            }
            _ => panic!("Expected InvalidPublicKeySize error"),
        }
    }

    #[test]
    fn test_validate_public_key_invalid_hex() {
        let pubkey = format!("0x{}", "g".repeat(64)); // 'g' is not valid hex
        let result = SphincsService::validate_public_key(&pubkey);
        assert!(result.is_err());
        match result {
            Err(SphincsError::InvalidHex(_)) => {}
            _ => panic!("Expected InvalidHex error"),
        }
    }

    #[test]
    fn test_parse_public_key() {
        let pubkey = valid_pubkey();
        let result = SphincsService::parse_public_key(&pubkey);
        assert!(result.is_ok());
        let bytes = result.unwrap();
        assert_eq!(bytes.len(), SPHINCS_PUBLIC_KEY_BYTES);
    }

    #[test]
    fn test_validate_signature_format_valid() {
        let sig = valid_signature();
        let result = SphincsService::validate_signature_format(&sig);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_signature_format_wrong_size() {
        let sig = format!("0x{}", "b".repeat(100)); // Wrong size
        let result = SphincsService::validate_signature_format(&sig);
        assert!(result.is_err());
        match result {
            Err(SphincsError::InvalidSignatureSize { .. }) => {}
            _ => panic!("Expected InvalidSignatureSize error"),
        }
    }

    #[test]
    fn test_verify_signature_rejects_invalid() {
        // With real FIPS 205 verification, random data should fail verification
        let message = b"test message";
        let sig = valid_signature();
        let pubkey = valid_pubkey();

        let result = SphincsService::verify_signature(message, &sig, &pubkey);
        // Random bytes will not form a valid signature, so verification should fail
        assert!(result.is_err());
        match result {
            Err(SphincsError::VerificationFailed) |
            Err(SphincsError::InvalidPublicKeyFormat(_)) => {}
            other => panic!("Expected VerificationFailed or InvalidPublicKeyFormat, got {:?}", other),
        }
    }

    #[test]
    fn test_validate_hsm_attestation_empty() {
        let result = SphincsService::validate_hsm_attestation("", &valid_pubkey());
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_hsm_attestation_invalid_format() {
        let result = SphincsService::validate_hsm_attestation("invalid", &valid_pubkey());
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_hsm_attestation_valid() {
        let result = SphincsService::validate_hsm_attestation(
            "HSM_ATT_abc123",
            &valid_pubkey(),
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_compute_pubkey_hash() {
        let pubkey = [0xAAu8; SPHINCS_PUBLIC_KEY_BYTES];
        let hash = SphincsService::compute_pubkey_hash(&pubkey);
        assert_eq!(hash.len(), 32);

        // Same input should produce same hash
        let hash2 = SphincsService::compute_pubkey_hash(&pubkey);
        assert_eq!(hash, hash2);

        // Different input should produce different hash
        let pubkey2 = [0xBBu8; SPHINCS_PUBLIC_KEY_BYTES];
        let hash3 = SphincsService::compute_pubkey_hash(&pubkey2);
        assert_ne!(hash, hash3);
    }
}
