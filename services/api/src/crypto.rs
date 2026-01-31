//! Quantum-Resistant Cryptography Module (CP-1 Compliant)
//!
//! This module provides NIST FIPS 204 ML-DSA-65 (Dilithium) signature verification.
//! All cryptographic operations comply with Core Principle #1 (Complete Quantum Resistance).
//!
//! ## Algorithms Used
//! - **User Signatures**: ML-DSA-65 (NIST FIPS 204)
//! - **Hashing**: SHA3-256 (NIST FIPS 202)
//!
//! ## Prohibited Algorithms (CP-1 Violation)
//! - ❌ ECDSA (quantum vulnerable - Shor's algorithm)
//! - ❌ RSA (quantum vulnerable - Shor's algorithm)
//! - ❌ keccak256 (use SHA3-256 instead)
//! - ❌ SHA-256 (Grover attack risk)
//! - ❌ Pre-FIPS Dilithium (use FIPS 204 ML-DSA)

use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Verifier};
use crate::error::ApiError;

/// ML-DSA-65 public key size (NIST FIPS 204)
pub const ML_DSA_65_PUBLIC_KEY_BYTES: usize = 1952;

/// ML-DSA-65 signature size (NIST FIPS 204)
pub const ML_DSA_65_SIGNATURE_BYTES: usize = 3309;

/// Verify ML-DSA-65 (Dilithium) signature
///
/// This function implements NIST FIPS 204 compliant signature verification.
/// It is used for all user signatures in the Quantum Shield system.
///
/// # CP-1 Compliance
/// - Uses NIST FIPS 204 ML-DSA-65 (NOT pre-FIPS Dilithium)
/// - Constant-time implementation
/// - Pure Rust, no unsafe code
///
/// # Arguments
/// * `message` - The message that was signed
/// * `signature_hex` - Hex-encoded ML-DSA-65 signature (with or without 0x prefix)
/// * `public_key_hex` - Hex-encoded ML-DSA-65 public key (with or without 0x prefix)
///
/// # Returns
/// * `Ok(true)` if signature is valid
/// * `Ok(false)` if signature is invalid
/// * `Err` if input format is invalid
///
/// # Example
/// ```rust,ignore
/// use quantum_shield_api::crypto::verify_ml_dsa_65_signature;
///
/// let message = b"QS_LOCK_V1...";
/// let signature_hex = "0x...";
/// let public_key_hex = "0x...";
///
/// let is_valid = verify_ml_dsa_65_signature(message, signature_hex, public_key_hex)?;
/// ```
pub fn verify_ml_dsa_65_signature(
    message: &[u8],
    signature_hex: &str,
    public_key_hex: &str,
) -> Result<bool, ApiError> {
    // Decode hex signature (strip 0x prefix if present)
    let sig_bytes = hex::decode(signature_hex.strip_prefix("0x").unwrap_or(signature_hex))
        .map_err(|e| ApiError::InvalidSignature(format!("Invalid signature hex: {}", e)))?;

    // Decode hex public key (strip 0x prefix if present)
    let pk_bytes = hex::decode(public_key_hex.strip_prefix("0x").unwrap_or(public_key_hex))
        .map_err(|e| ApiError::InvalidSignature(format!("Invalid public key hex: {}", e)))?;

    // Validate signature size
    if sig_bytes.len() != ML_DSA_65_SIGNATURE_BYTES {
        return Err(ApiError::InvalidSignature(format!(
            "Invalid signature size: expected {} bytes (FIPS 204 ML-DSA-65), got {}",
            ML_DSA_65_SIGNATURE_BYTES, sig_bytes.len()
        )));
    }

    // Validate public key size
    if pk_bytes.len() != ML_DSA_65_PUBLIC_KEY_BYTES {
        return Err(ApiError::InvalidSignature(format!(
            "Invalid public key size: expected {} bytes (FIPS 204 ML-DSA-65), got {}",
            ML_DSA_65_PUBLIC_KEY_BYTES, pk_bytes.len()
        )));
    }

    // Convert to fixed-size arrays
    let pk_array: [u8; ML_DSA_65_PUBLIC_KEY_BYTES] = pk_bytes
        .try_into()
        .map_err(|_| ApiError::InvalidSignature("Failed to convert public key to array".into()))?;

    let sig_array: [u8; ML_DSA_65_SIGNATURE_BYTES] = sig_bytes
        .try_into()
        .map_err(|_| ApiError::InvalidSignature("Failed to convert signature to array".into()))?;

    // Parse public key using FIPS 204 API
    let public_key = ml_dsa_65::PublicKey::try_from_bytes(pk_array)
        .map_err(|_| ApiError::InvalidSignature("Failed to parse ML-DSA-65 public key".into()))?;

    // Verify signature using FIPS 204 API
    // Note: The third argument is the NIST-specified context (empty for basic verification)
    let result = public_key.verify(message, &sig_array, &[]);

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use fips204::ml_dsa_65;
    use fips204::traits::{SerDes, Signer};

    #[test]
    fn test_ml_dsa_65_constants() {
        // Verify our constants match the actual FIPS 204 implementation
        let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");
        let message = b"test message";
        let sig = sk.try_sign(message, &[]).expect("Signing failed");

        assert_eq!(
            ML_DSA_65_PUBLIC_KEY_BYTES,
            pk.into_bytes().len(),
            "Public key size mismatch"
        );
        assert_eq!(
            ML_DSA_65_SIGNATURE_BYTES,
            sig.len(),
            "Signature size mismatch"
        );
    }

    #[test]
    fn test_ml_dsa_65_signature_verification_success() {
        // Generate a test keypair
        let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");

        // Create a test message (simulating QS_LOCK_V1 format)
        let message = b"QS_LOCK_V1test_lock_id0x1234567890abcdef1000000000000000000";

        // Sign the message (empty context for basic verification)
        let signature = sk.try_sign(message, &[]).expect("Signing failed");

        // Convert to hex strings
        let pk_hex = format!("0x{}", hex::encode(pk.into_bytes()));
        let sig_hex = format!("0x{}", hex::encode(signature));

        // Verify
        let result = verify_ml_dsa_65_signature(message, &sig_hex, &pk_hex);
        assert!(result.is_ok(), "Verification should not error: {:?}", result);
        assert!(result.unwrap(), "Signature should be valid");
    }

    #[test]
    fn test_ml_dsa_65_signature_verification_failure_wrong_message() {
        // Generate a test keypair
        let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");

        // Sign one message
        let message = b"original message";
        let signature = sk.try_sign(message, &[]).expect("Signing failed");

        // Convert to hex strings
        let pk_hex = format!("0x{}", hex::encode(pk.into_bytes()));
        let sig_hex = format!("0x{}", hex::encode(signature));

        // Verify with different message should fail
        let wrong_message = b"different message";
        let result = verify_ml_dsa_65_signature(wrong_message, &sig_hex, &pk_hex);
        assert!(result.is_ok(), "Verification should not error: {:?}", result);
        assert!(!result.unwrap(), "Signature should be invalid for wrong message");
    }

    #[test]
    fn test_ml_dsa_65_signature_verification_failure_wrong_key() {
        // Generate two test keypairs
        let (_pk1, sk1) = ml_dsa_65::try_keygen().expect("Key generation failed");
        let (pk2, _sk2) = ml_dsa_65::try_keygen().expect("Key generation failed");

        // Sign with keypair 1
        let message = b"test message";
        let signature = sk1.try_sign(message, &[]).expect("Signing failed");

        // Convert to hex strings (using wrong public key)
        let wrong_pk_hex = format!("0x{}", hex::encode(pk2.into_bytes()));
        let sig_hex = format!("0x{}", hex::encode(signature));

        // Verify with wrong public key should fail
        let result = verify_ml_dsa_65_signature(message, &sig_hex, &wrong_pk_hex);
        assert!(result.is_ok(), "Verification should not error: {:?}", result);
        assert!(!result.unwrap(), "Signature should be invalid for wrong key");
    }

    #[test]
    fn test_ml_dsa_65_signature_invalid_size() {
        let invalid_sig = "0x1234"; // Too short
        let valid_pk = format!("0x{}", hex::encode(vec![0u8; ML_DSA_65_PUBLIC_KEY_BYTES]));

        let result = verify_ml_dsa_65_signature(b"test", invalid_sig, &valid_pk);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid signature size"));
    }

    #[test]
    fn test_ml_dsa_65_public_key_invalid_size() {
        let valid_sig = format!("0x{}", hex::encode(vec![0u8; ML_DSA_65_SIGNATURE_BYTES]));
        let invalid_pk = "0x1234"; // Too short

        let result = verify_ml_dsa_65_signature(b"test", &valid_sig, invalid_pk);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid public key size"));
    }

    #[test]
    fn test_hex_without_0x_prefix() {
        // Generate a test keypair
        let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");
        let message = b"test message";
        let signature = sk.try_sign(message, &[]).expect("Signing failed");

        // Convert to hex strings WITHOUT 0x prefix
        let pk_hex = hex::encode(pk.into_bytes());
        let sig_hex = hex::encode(signature);

        // Should still work
        let result = verify_ml_dsa_65_signature(message, &sig_hex, &pk_hex);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }
}
