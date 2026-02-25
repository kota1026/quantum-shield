//! Cryptography Module
//!
//! This module provides signature verification for the Quantum Shield system.
//!
//! ## Authentication Signatures (SIWE)
//! - **ECDSA** (secp256k1): Standard Ethereum wallet signatures
//!   Used for SIWE (Sign-In with Ethereum) authentication as per SEQUENCES.md §1.1
//!
//! ## Asset Protection Signatures (Lock/Unlock)
//! - **ML-DSA-65** (NIST FIPS 204): Quantum-resistant signatures
//!   Used for Lock/Unlock operations as per SEQUENCES.md §2.1
//!   Provides CP-1 (Complete Quantum Resistance) for asset protection
//!
//! ## Design Philosophy
//! - Authentication: Uses standard ECDSA for wallet compatibility
//! - Asset Protection: Uses Dilithium for quantum resistance
//! - This separation allows standard wallet UX while protecting locked assets

use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Signer, Verifier};
use ethers::core::types::{RecoveryMessage, Signature};
use crate::error::ApiError;

// ============================================================================
// ECDSA Signature Verification (SIWE Authentication)
// ============================================================================

/// ECDSA signature size (65 bytes: r[32] + s[32] + v[1])
pub const ECDSA_SIGNATURE_BYTES: usize = 65;

/// Verify ECDSA signature for SIWE authentication
///
/// This function verifies Ethereum wallet signatures (secp256k1 ECDSA).
/// Used for SIWE (Sign-In with Ethereum) authentication as per SEQUENCES.md §1.1.
///
/// # Arguments
/// * `message` - The SIWE message that was signed (as string)
/// * `signature_hex` - Hex-encoded ECDSA signature (65 bytes, with or without 0x prefix)
///
/// # Returns
/// * `Ok(address)` - The recovered Ethereum address if signature is valid
/// * `Err` - If signature is invalid or recovery fails
///
/// # Example
/// ```rust,ignore
/// let message = "example.com wants you to sign in with your account...";
/// let signature = "0x..."; // 65-byte ECDSA signature
/// let address = verify_ecdsa_signature(message, signature)?;
/// ```
pub fn verify_ecdsa_signature(
    message: &str,
    signature_hex: &str,
) -> Result<String, ApiError> {
    // Decode hex signature (strip 0x prefix if present)
    let sig_bytes = hex::decode(signature_hex.strip_prefix("0x").unwrap_or(signature_hex))
        .map_err(|e| ApiError::InvalidSignature(format!("Invalid signature hex: {}", e)))?;

    // Validate signature size
    if sig_bytes.len() != ECDSA_SIGNATURE_BYTES {
        return Err(ApiError::InvalidSignature(format!(
            "Invalid signature size: expected {} bytes (ECDSA), got {}",
            ECDSA_SIGNATURE_BYTES, sig_bytes.len()
        )));
    }

    // Parse signature
    let signature = Signature::try_from(sig_bytes.as_slice())
        .map_err(|e| ApiError::InvalidSignature(format!("Failed to parse ECDSA signature: {}", e)))?;

    // Ethereum personal sign message (EIP-191)
    let recovery_message = RecoveryMessage::Data(message.as_bytes().to_vec());

    // Recover the address from the signature
    let recovered_address = signature.recover(recovery_message)
        .map_err(|e| ApiError::InvalidSignature(format!("Failed to recover address: {}", e)))?;

    Ok(format!("{:?}", recovered_address))
}

/// ML-DSA-65 public key size (NIST FIPS 204)
pub const ML_DSA_65_PUBLIC_KEY_BYTES: usize = 1952;

/// ML-DSA-65 signature size (NIST FIPS 204)
pub const ML_DSA_65_SIGNATURE_BYTES: usize = 3309;

/// ML-DSA-65 private key size (NIST FIPS 204)
pub const ML_DSA_65_PRIVATE_KEY_BYTES: usize = 4032;

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

// ============================================================================
// Admin Signature Generation (Phase 8-D L3 Integration)
// ============================================================================

/// Generate ML-DSA-65 (Dilithium) signature for admin operations
///
/// This function implements NIST FIPS 204 compliant signature generation.
/// It is used for QS Admin operations that require quantum-resistant signatures.
///
/// # CP-1 Compliance
/// - Uses NIST FIPS 204 ML-DSA-65 (NOT pre-FIPS Dilithium)
/// - Constant-time implementation
/// - Pure Rust, no unsafe code
///
/// # Security Note
/// In production, the private key should be retrieved from HSM/KMS.
/// Never store private keys in environment variables or code.
///
/// # Arguments
/// * `message` - The message to sign
/// * `private_key_bytes` - ML-DSA-65 private key bytes (4032 bytes)
///
/// # Returns
/// * `Ok(Vec<u8>)` if signature generation succeeds
/// * `Err` if signing fails
pub fn sign_ml_dsa_65(
    message: &[u8],
    private_key_bytes: &[u8],
) -> Result<Vec<u8>, ApiError> {
    // Validate private key size
    if private_key_bytes.len() != ML_DSA_65_PRIVATE_KEY_BYTES {
        return Err(ApiError::InvalidSignature(format!(
            "Invalid private key size: expected {} bytes (FIPS 204 ML-DSA-65), got {}",
            ML_DSA_65_PRIVATE_KEY_BYTES, private_key_bytes.len()
        )));
    }

    // Convert to fixed-size array
    let sk_array: [u8; ML_DSA_65_PRIVATE_KEY_BYTES] = private_key_bytes
        .try_into()
        .map_err(|_| ApiError::InvalidSignature("Failed to convert private key to array".into()))?;

    // Parse private key using FIPS 204 API
    let private_key = ml_dsa_65::PrivateKey::try_from_bytes(sk_array)
        .map_err(|_| ApiError::InvalidSignature("Failed to parse ML-DSA-65 private key".into()))?;

    // Sign the message (empty context for basic signing)
    let signature = private_key
        .try_sign(message, &[])
        .map_err(|_| ApiError::Internal("Dilithium signing failed".into()))?;

    Ok(signature.to_vec())
}

/// Generate ML-DSA-65 keypair for testing
///
/// # Warning
/// This function is for development/testing only.
/// In production, keys should be generated and stored in HSM/KMS.
///
/// # Returns
/// * `Ok((public_key, private_key))` - Hex-encoded keypair
/// * `Err` if key generation fails
pub fn generate_ml_dsa_65_keypair() -> Result<(String, String), ApiError> {
    let (pk, sk) = ml_dsa_65::try_keygen()
        .map_err(|_| ApiError::Internal("Failed to generate ML-DSA-65 keypair".into()))?;

    let pk_hex = format!("0x{}", hex::encode(pk.into_bytes()));
    let sk_hex = format!("0x{}", hex::encode(sk.into_bytes()));

    Ok((pk_hex, sk_hex))
}

/// Build admin signing message for L3 operations
///
/// This creates a standardized message format for admin operations
/// that require Dilithium signatures.
///
/// # Format
/// `QS_ADMIN_V1|action_type|resource_id|timestamp|nonce`
///
/// # Arguments
/// * `action_type` - Type of admin action (e.g., "TREASURY_TRANSFER", "PROVER_APPROVE")
/// * `resource_id` - ID of the resource being acted upon
/// * `timestamp` - Unix timestamp of the action
/// * `nonce` - Unique nonce to prevent replay attacks
///
/// # Returns
/// * Message bytes for signing
pub fn build_admin_signing_message(
    action_type: &str,
    resource_id: &str,
    timestamp: u64,
    nonce: &str,
) -> Vec<u8> {
    format!(
        "QS_ADMIN_V1|{}|{}|{}|{}",
        action_type, resource_id, timestamp, nonce
    ).into_bytes()
}

/// Verify admin signature with message reconstruction
///
/// This function reconstructs the admin signing message and verifies
/// the Dilithium signature.
///
/// # Arguments
/// * `action_type` - Type of admin action
/// * `resource_id` - ID of the resource
/// * `timestamp` - Unix timestamp
/// * `nonce` - Unique nonce
/// * `signature_hex` - Hex-encoded signature
/// * `public_key_hex` - Hex-encoded public key
///
/// # Returns
/// * `Ok(true)` if signature is valid
/// * `Ok(false)` if signature is invalid
/// * `Err` if input format is invalid
pub fn verify_admin_signature(
    action_type: &str,
    resource_id: &str,
    timestamp: u64,
    nonce: &str,
    signature_hex: &str,
    public_key_hex: &str,
) -> Result<bool, ApiError> {
    let message = build_admin_signing_message(action_type, resource_id, timestamp, nonce);
    verify_ml_dsa_65_signature(&message, signature_hex, public_key_hex)
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

    // ========================================================================
    // Admin Signature Tests (Phase 8-D)
    // ========================================================================

    #[test]
    fn test_sign_ml_dsa_65() {
        // Generate a test keypair
        let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");
        let message = b"QS_ADMIN_V1|TREASURY_TRANSFER|tx_123|1706745600|nonce_abc";

        // Sign using our new function
        let signature = sign_ml_dsa_65(message, &sk.into_bytes())
            .expect("Signing should succeed");

        // Verify size
        assert_eq!(signature.len(), ML_DSA_65_SIGNATURE_BYTES);

        // Verify signature is valid
        let pk_hex = format!("0x{}", hex::encode(pk.into_bytes()));
        let sig_hex = format!("0x{}", hex::encode(&signature));
        let result = verify_ml_dsa_65_signature(message, &sig_hex, &pk_hex);
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_sign_ml_dsa_65_invalid_key_size() {
        let message = b"test message";
        let invalid_key = vec![0u8; 100]; // Too short

        let result = sign_ml_dsa_65(message, &invalid_key);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid private key size"));
    }

    #[test]
    fn test_generate_ml_dsa_65_keypair() {
        let result = generate_ml_dsa_65_keypair();
        assert!(result.is_ok());

        let (pk_hex, sk_hex) = result.unwrap();

        // Check format
        assert!(pk_hex.starts_with("0x"));
        assert!(sk_hex.starts_with("0x"));

        // Check sizes (hex encoded with 0x prefix)
        assert_eq!(pk_hex.len(), 2 + ML_DSA_65_PUBLIC_KEY_BYTES * 2);
        assert_eq!(sk_hex.len(), 2 + ML_DSA_65_PRIVATE_KEY_BYTES * 2);
    }

    #[test]
    fn test_build_admin_signing_message() {
        let message = build_admin_signing_message(
            "TREASURY_TRANSFER",
            "tx_123",
            1706745600,
            "nonce_abc",
        );

        let expected = b"QS_ADMIN_V1|TREASURY_TRANSFER|tx_123|1706745600|nonce_abc";
        assert_eq!(message, expected);
    }

    #[test]
    fn test_verify_admin_signature_success() {
        // Generate a test keypair
        let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");

        // Create admin message
        let action_type = "PROVER_APPROVE";
        let resource_id = "prover_123";
        let timestamp = 1706745600u64;
        let nonce = "nonce_xyz";

        let message = build_admin_signing_message(action_type, resource_id, timestamp, nonce);
        let signature = sk.try_sign(&message, &[]).expect("Signing failed");

        // Verify
        let pk_hex = format!("0x{}", hex::encode(pk.into_bytes()));
        let sig_hex = format!("0x{}", hex::encode(signature));

        let result = verify_admin_signature(
            action_type,
            resource_id,
            timestamp,
            nonce,
            &sig_hex,
            &pk_hex,
        );

        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_verify_admin_signature_wrong_params() {
        // Generate a test keypair
        let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");

        // Sign with one set of params
        let message = build_admin_signing_message("ACTION_A", "id_1", 1000, "nonce_1");
        let signature = sk.try_sign(&message, &[]).expect("Signing failed");

        // Verify with different params - should fail
        let pk_hex = format!("0x{}", hex::encode(pk.into_bytes()));
        let sig_hex = format!("0x{}", hex::encode(signature));

        let result = verify_admin_signature(
            "ACTION_B", // Different action
            "id_1",
            1000,
            "nonce_1",
            &sig_hex,
            &pk_hex,
        );

        assert!(result.is_ok());
        assert!(!result.unwrap()); // Signature should be invalid
    }
}
