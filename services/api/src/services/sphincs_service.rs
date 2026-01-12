//! SPHINCS+ Verification Service (CP-1 Compliant)
//!
//! This module provides SPHINCS+-SHAKE-128s public key validation for Prover registration.
//! Implements NIST FIPS 205 compliant verification at the API layer.
//!
//! ## SPHINCS+-SHAKE-128s Parameters (NIST FIPS 205)
//! - Security Level: 128-bit post-quantum (NIST Level 1)
//! - Public Key Size: 32 bytes (seed: 16 bytes + root: 16 bytes)
//! - Signature Size: 7,856 bytes
//! - Hash Function: SHAKE256 (FIPS 202)
//!
//! ## Validation Flow
//! ```text
//! API Request → validate_sphincs_public_key() → L1 SPHINCSVerifier.sol
//! ```

use sha3::{Sha3_256, Digest};

use crate::error::ApiError;

/// SPHINCS+-SHAKE-128s public key size in bytes (NIST FIPS 205)
pub const SPHINCS_128S_PUBLIC_KEY_BYTES: usize = 32;

/// SPHINCS+-SHAKE-128s signature size in bytes
pub const SPHINCS_128S_SIGNATURE_BYTES: usize = 7856;

/// SPHINCS+ public key seed size in bytes
pub const SPHINCS_SEED_BYTES: usize = 16;

/// SPHINCS+ public key root size in bytes
pub const SPHINCS_ROOT_BYTES: usize = 16;

/// Parsed SPHINCS+ public key structure
#[derive(Debug, Clone)]
pub struct SphincsPublicKey {
    /// Public seed (SPK.seed) - 16 bytes
    pub seed: [u8; SPHINCS_SEED_BYTES],
    /// Root of the top tree (SPK.root) - 16 bytes
    pub root: [u8; SPHINCS_ROOT_BYTES],
}

/// SPHINCS+ public key validation result
#[derive(Debug)]
pub struct SphincsValidationResult {
    pub valid: bool,
    pub public_key_hash: Option<String>,
    pub error_reason: Option<String>,
}

/// Validate SPHINCS+-SHAKE-128s public key format
///
/// This function validates the format and structure of a SPHINCS+ public key
/// before it is used in Prover registration.
///
/// # CP-1 Compliance
/// - Uses NIST FIPS 205 SPHINCS+-SHAKE-128s parameters
/// - Validates 32-byte public key structure (seed + root)
/// - Rejects zero/all-ones keys as invalid
///
/// # Arguments
/// * `public_key_hex` - Hex-encoded SPHINCS+ public key (with or without 0x prefix)
///
/// # Returns
/// * `Ok(SphincsValidationResult)` with validation details
/// * `Err(ApiError)` if hex decoding fails
///
/// # Example
/// ```rust,ignore
/// use quantum_shield_api::services::sphincs_service::validate_sphincs_public_key;
///
/// let pubkey = "0x1234567890abcdef..."; // 64 hex chars
/// let result = validate_sphincs_public_key(pubkey)?;
/// if result.valid {
///     println!("Public key hash: {}", result.public_key_hash.unwrap());
/// }
/// ```
pub fn validate_sphincs_public_key(public_key_hex: &str) -> Result<SphincsValidationResult, ApiError> {
    // Strip 0x prefix if present
    let hex_str = public_key_hex.strip_prefix("0x").unwrap_or(public_key_hex);

    // Decode hex to bytes
    let pk_bytes = hex::decode(hex_str)
        .map_err(|e| ApiError::InvalidSignature(format!("Invalid SPHINCS+ public key hex: {}", e)))?;

    // Validate size
    if pk_bytes.len() != SPHINCS_128S_PUBLIC_KEY_BYTES {
        return Ok(SphincsValidationResult {
            valid: false,
            public_key_hash: None,
            error_reason: Some(format!(
                "Invalid SPHINCS+ public key size: expected {} bytes, got {}",
                SPHINCS_128S_PUBLIC_KEY_BYTES, pk_bytes.len()
            )),
        });
    }

    // Check for all-zeros key (invalid)
    if pk_bytes.iter().all(|&b| b == 0) {
        return Ok(SphincsValidationResult {
            valid: false,
            public_key_hash: None,
            error_reason: Some("SPHINCS+ public key cannot be all zeros".into()),
        });
    }

    // Check for all-ones key (invalid)
    if pk_bytes.iter().all(|&b| b == 0xFF) {
        return Ok(SphincsValidationResult {
            valid: false,
            public_key_hash: None,
            error_reason: Some("SPHINCS+ public key cannot be all ones".into()),
        });
    }

    // Parse into seed and root components
    let seed: [u8; SPHINCS_SEED_BYTES] = pk_bytes[0..SPHINCS_SEED_BYTES]
        .try_into()
        .map_err(|_| ApiError::Internal("Failed to parse SPHINCS+ seed".into()))?;

    let root: [u8; SPHINCS_ROOT_BYTES] = pk_bytes[SPHINCS_SEED_BYTES..SPHINCS_128S_PUBLIC_KEY_BYTES]
        .try_into()
        .map_err(|_| ApiError::Internal("Failed to parse SPHINCS+ root".into()))?;

    // Validate seed is not all zeros (required for security)
    if seed.iter().all(|&b| b == 0) {
        return Ok(SphincsValidationResult {
            valid: false,
            public_key_hash: None,
            error_reason: Some("SPHINCS+ seed component cannot be all zeros".into()),
        });
    }

    // Validate root is not all zeros (required for valid tree)
    if root.iter().all(|&b| b == 0) {
        return Ok(SphincsValidationResult {
            valid: false,
            public_key_hash: None,
            error_reason: Some("SPHINCS+ root component cannot be all zeros".into()),
        });
    }

    // Compute public key hash using SHA3-256 (CP-1 compliant, same as L1)
    let pk_hash = compute_public_key_hash(&pk_bytes);

    Ok(SphincsValidationResult {
        valid: true,
        public_key_hash: Some(pk_hash),
        error_reason: None,
    })
}

/// Parse SPHINCS+ public key into components
///
/// # Arguments
/// * `public_key_hex` - Hex-encoded SPHINCS+ public key
///
/// # Returns
/// * `Ok(SphincsPublicKey)` with parsed components
/// * `Err(ApiError)` if parsing fails
pub fn parse_sphincs_public_key(public_key_hex: &str) -> Result<SphincsPublicKey, ApiError> {
    // First validate the key
    let validation = validate_sphincs_public_key(public_key_hex)?;
    if !validation.valid {
        return Err(ApiError::InvalidSignature(
            validation.error_reason.unwrap_or_else(|| "Invalid SPHINCS+ public key".into())
        ));
    }

    // Decode and parse
    let hex_str = public_key_hex.strip_prefix("0x").unwrap_or(public_key_hex);
    let pk_bytes = hex::decode(hex_str)
        .map_err(|e| ApiError::InvalidSignature(format!("Invalid hex: {}", e)))?;

    let seed: [u8; SPHINCS_SEED_BYTES] = pk_bytes[0..SPHINCS_SEED_BYTES]
        .try_into()
        .map_err(|_| ApiError::Internal("Failed to parse seed".into()))?;

    let root: [u8; SPHINCS_ROOT_BYTES] = pk_bytes[SPHINCS_SEED_BYTES..SPHINCS_128S_PUBLIC_KEY_BYTES]
        .try_into()
        .map_err(|_| ApiError::Internal("Failed to parse root".into()))?;

    Ok(SphincsPublicKey { seed, root })
}

/// Compute SHA3-256 hash of public key (CP-1 compliant)
///
/// Uses SHA3-256 (NOT keccak256) per Core Principle #1.
/// This matches the L1 SPHINCSVerifier.sol implementation.
fn compute_public_key_hash(pk_bytes: &[u8]) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(pk_bytes);
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

/// Validate HSM attestation (placeholder for production implementation)
///
/// In production, this should verify:
/// - HSM manufacturer attestation chain
/// - Key generation attestation
/// - Hardware security module integrity
///
/// # Arguments
/// * `attestation` - HSM attestation data
///
/// # Returns
/// * `true` if attestation is valid (or if HSM validation is disabled)
pub fn validate_hsm_attestation(attestation: &str) -> bool {
    // Phase 1: Basic validation (non-empty)
    // Phase 2+: Full HSM attestation chain verification
    if attestation.is_empty() {
        return false;
    }

    // TODO: Implement full HSM attestation verification
    // - Verify attestation signature chain
    // - Check HSM manufacturer certificate
    // - Validate key generation proof
    // - Verify hardware security claims

    // For Phase 1, accept any non-empty attestation
    true
}

/// Validate 2-of-3 multisig proof (placeholder for production implementation)
///
/// In production, this should verify:
/// - Multisig wallet configuration
/// - Required signature threshold (2/3)
/// - Signer authorization
///
/// # Arguments
/// * `proof` - Multisig configuration proof
///
/// # Returns
/// * `true` if multisig proof is valid
pub fn validate_multisig_proof(proof: &str) -> bool {
    // Phase 1: Basic validation (non-empty)
    // Phase 2+: Full multisig verification
    if proof.is_empty() {
        return false;
    }

    // TODO: Implement full multisig proof verification
    // - Verify multisig wallet address
    // - Check required threshold configuration
    // - Validate owner addresses

    // For Phase 1, accept any non-empty proof
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_sphincs_public_key() {
        // Valid 32-byte public key (hex encoded)
        let valid_pk = "0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";
        let result = validate_sphincs_public_key(valid_pk).unwrap();

        assert!(result.valid, "Valid public key should pass validation");
        assert!(result.public_key_hash.is_some(), "Should return public key hash");
        assert!(result.error_reason.is_none(), "Should not have error reason");
    }

    #[test]
    fn test_valid_sphincs_public_key_without_prefix() {
        // Valid key without 0x prefix
        let valid_pk = "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";
        let result = validate_sphincs_public_key(valid_pk).unwrap();

        assert!(result.valid);
    }

    #[test]
    fn test_invalid_sphincs_public_key_wrong_size() {
        // Too short
        let short_pk = "0x01020304";
        let result = validate_sphincs_public_key(short_pk).unwrap();

        assert!(!result.valid, "Short public key should fail");
        assert!(result.error_reason.unwrap().contains("size"));
    }

    #[test]
    fn test_invalid_sphincs_public_key_too_long() {
        // Too long (33 bytes)
        let long_pk = "0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f2021";
        let result = validate_sphincs_public_key(long_pk).unwrap();

        assert!(!result.valid, "Long public key should fail");
    }

    #[test]
    fn test_invalid_sphincs_public_key_all_zeros() {
        let zero_pk = "0x0000000000000000000000000000000000000000000000000000000000000000";
        let result = validate_sphincs_public_key(zero_pk).unwrap();

        assert!(!result.valid, "All-zero public key should fail");
        assert!(result.error_reason.unwrap().contains("zeros"));
    }

    #[test]
    fn test_invalid_sphincs_public_key_all_ones() {
        let ones_pk = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        let result = validate_sphincs_public_key(ones_pk).unwrap();

        assert!(!result.valid, "All-ones public key should fail");
        assert!(result.error_reason.unwrap().contains("ones"));
    }

    #[test]
    fn test_invalid_sphincs_public_key_zero_seed() {
        // Seed is all zeros, root is valid
        let zero_seed_pk = "0x000000000000000000000000000000001112131415161718191a1b1c1d1e1f20";
        let result = validate_sphincs_public_key(zero_seed_pk).unwrap();

        assert!(!result.valid, "Zero seed should fail");
        assert!(result.error_reason.unwrap().contains("seed"));
    }

    #[test]
    fn test_invalid_sphincs_public_key_zero_root() {
        // Seed is valid, root is all zeros
        let zero_root_pk = "0x0102030405060708090a0b0c0d0e0f1000000000000000000000000000000000";
        let result = validate_sphincs_public_key(zero_root_pk).unwrap();

        assert!(!result.valid, "Zero root should fail");
        assert!(result.error_reason.unwrap().contains("root"));
    }

    #[test]
    fn test_invalid_hex() {
        let invalid_hex = "0xGGGG";
        let result = validate_sphincs_public_key(invalid_hex);

        assert!(result.is_err(), "Invalid hex should return error");
    }

    #[test]
    fn test_parse_sphincs_public_key() {
        let valid_pk = "0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";
        let parsed = parse_sphincs_public_key(valid_pk).unwrap();

        assert_eq!(parsed.seed[0], 0x01);
        assert_eq!(parsed.seed[15], 0x10);
        assert_eq!(parsed.root[0], 0x11);
        assert_eq!(parsed.root[15], 0x20);
    }

    #[test]
    fn test_public_key_hash_consistency() {
        let pk = "0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";

        let result1 = validate_sphincs_public_key(pk).unwrap();
        let result2 = validate_sphincs_public_key(pk).unwrap();

        assert_eq!(
            result1.public_key_hash,
            result2.public_key_hash,
            "Same key should produce same hash"
        );
    }

    #[test]
    fn test_constants() {
        assert_eq!(SPHINCS_128S_PUBLIC_KEY_BYTES, 32);
        assert_eq!(SPHINCS_128S_SIGNATURE_BYTES, 7856);
        assert_eq!(SPHINCS_SEED_BYTES, 16);
        assert_eq!(SPHINCS_ROOT_BYTES, 16);
        assert_eq!(SPHINCS_SEED_BYTES + SPHINCS_ROOT_BYTES, SPHINCS_128S_PUBLIC_KEY_BYTES);
    }

    #[test]
    fn test_hsm_attestation_empty() {
        assert!(!validate_hsm_attestation(""), "Empty attestation should fail");
    }

    #[test]
    fn test_hsm_attestation_valid() {
        assert!(validate_hsm_attestation("attestation_data"), "Non-empty attestation should pass");
    }

    #[test]
    fn test_multisig_proof_empty() {
        assert!(!validate_multisig_proof(""), "Empty proof should fail");
    }

    #[test]
    fn test_multisig_proof_valid() {
        assert!(validate_multisig_proof("proof_data"), "Non-empty proof should pass");
    }
}
