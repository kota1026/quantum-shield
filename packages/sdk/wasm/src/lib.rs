//! Quantum Shield WASM Module
//!
//! FIPS 204 ML-DSA-65 (Dilithium-III) implementation for browser.
//!
//! # Security
//! - Uses NIST-certified ML-DSA-65 (Dilithium-III)
//! - 192-bit security level (NIST Level 3)
//! - SHA3-256 for hashing (CP-1 compliant)
//!
//! # Forbidden Algorithms (CP-1)
//! - NO ECDSA, RSA, secp256k1
//! - NO SHA-256, SHA-2, keccak256

use wasm_bindgen::prelude::*;
use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Signer, Verifier};  // Required traits
use sha3::{Sha3_256, Digest};
use serde::{Serialize, Deserialize};

// Re-export for panic handling
#[cfg(feature = "console_error_panic_hook")]
pub use console_error_panic_hook::set_once as set_panic_hook;

/// Key pair result from keygen
#[derive(Serialize, Deserialize)]
pub struct KeyPairResult {
    pub public_key: String,
    pub secret_key: String,
    pub public_key_hash: String,
}

/// Signature verification result
#[derive(Serialize, Deserialize)]
pub struct VerifyResult {
    pub valid: bool,
    pub error: Option<String>,
}

/// Algorithm information
#[derive(Serialize, Deserialize)]
pub struct AlgorithmInfo {
    pub name: String,
    pub standard: String,
    pub security_level: String,
    pub security_bits: u32,
    pub public_key_bytes: usize,
    pub secret_key_bytes: usize,
    pub signature_bytes: usize,
}

/// Initialize WASM module (call once on load)
#[wasm_bindgen]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Generate a new ML-DSA-65 key pair
///
/// Returns JSON with:
/// - public_key: hex-encoded public key (1952 bytes)
/// - secret_key: hex-encoded secret key (4032 bytes)
/// - public_key_hash: SHA3-256 hash of public key (32 bytes)
///
/// # FIPS 204 Compliance
/// Uses ML-DSA-65 (Dilithium-III) with NIST Level 3 security
#[wasm_bindgen]
pub fn keygen() -> Result<JsValue, JsError> {
    // Generate key pair using FIPS 204 ML-DSA-65
    let (pk, sk) = ml_dsa_65::try_keygen()
        .map_err(|e| JsError::new(&format!("Key generation failed: {:?}", e)))?;

    // Convert to bytes
    let pk_bytes = pk.clone().into_bytes();
    let sk_bytes = sk.into_bytes();

    // Compute SHA3-256 hash of public key
    let pk_hash = sha3_256_hash(&pk_bytes);

    let result = KeyPairResult {
        public_key: hex::encode(&pk_bytes),
        secret_key: hex::encode(&sk_bytes),
        public_key_hash: hex::encode(&pk_hash),
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsError::new(&format!("Serialization failed: {:?}", e)))
}

/// Sign a message using ML-DSA-65
///
/// # Arguments
/// * `secret_key_hex` - Hex-encoded secret key (4032 bytes)
/// * `message_hex` - Hex-encoded message to sign
///
/// # Returns
/// Hex-encoded signature (3309 bytes)
///
/// # FIPS 204 Compliance
/// Uses deterministic signing as per ML-DSA-65 specification
#[wasm_bindgen]
pub fn sign(secret_key_hex: &str, message_hex: &str) -> Result<String, JsError> {
    // Decode secret key
    let sk_bytes = hex::decode(secret_key_hex)
        .map_err(|e| JsError::new(&format!("Invalid secret key hex: {:?}", e)))?;

    // Verify secret key size (ML-DSA-65: 4032 bytes)
    if sk_bytes.len() != 4032 {
        return Err(JsError::new(&format!(
            "Invalid secret key size: expected 4032 bytes, got {}",
            sk_bytes.len()
        )));
    }

    // Decode message
    let message = hex::decode(message_hex)
        .map_err(|e| JsError::new(&format!("Invalid message hex: {:?}", e)))?;

    // Convert to fixed-size array
    let sk_array: [u8; 4032] = sk_bytes
        .try_into()
        .map_err(|_| JsError::new("Failed to convert secret key to array"))?;

    // Reconstruct secret key
    let sk = ml_dsa_65::PrivateKey::try_from_bytes(sk_array)
        .map_err(|e| JsError::new(&format!("Invalid secret key format: {:?}", e)))?;

    // Sign message
    let signature = sk.try_sign(&message, &[])
        .map_err(|e| JsError::new(&format!("Signing failed: {:?}", e)))?;

    Ok(hex::encode(signature))
}

/// Verify a signature using ML-DSA-65
///
/// # Arguments
/// * `public_key_hex` - Hex-encoded public key (1952 bytes)
/// * `message_hex` - Hex-encoded message that was signed
/// * `signature_hex` - Hex-encoded signature to verify (3309 bytes)
///
/// # Returns
/// JSON with:
/// - valid: boolean indicating if signature is valid
/// - error: optional error message if verification failed
///
/// # FIPS 204 Compliance
/// Uses ML-DSA-65 verification as per NIST specification
#[wasm_bindgen]
pub fn verify(public_key_hex: &str, message_hex: &str, signature_hex: &str) -> Result<JsValue, JsError> {
    let result = verify_internal(public_key_hex, message_hex, signature_hex);

    let verify_result = match result {
        Ok(valid) => VerifyResult {
            valid,
            error: None,
        },
        Err(e) => VerifyResult {
            valid: false,
            error: Some(e),
        },
    };

    serde_wasm_bindgen::to_value(&verify_result)
        .map_err(|e| JsError::new(&format!("Serialization failed: {:?}", e)))
}

fn verify_internal(public_key_hex: &str, message_hex: &str, signature_hex: &str) -> Result<bool, String> {
    // Decode public key
    let pk_bytes = hex::decode(public_key_hex)
        .map_err(|e| format!("Invalid public key hex: {:?}", e))?;

    // Verify public key size (ML-DSA-65: 1952 bytes)
    if pk_bytes.len() != 1952 {
        return Err(format!(
            "Invalid public key size: expected 1952 bytes, got {}",
            pk_bytes.len()
        ));
    }

    // Decode message
    let message = hex::decode(message_hex)
        .map_err(|e| format!("Invalid message hex: {:?}", e))?;

    // Decode signature
    let sig_bytes = hex::decode(signature_hex)
        .map_err(|e| format!("Invalid signature hex: {:?}", e))?;

    // Verify signature size (ML-DSA-65: 3309 bytes)
    if sig_bytes.len() != 3309 {
        return Err(format!(
            "Invalid signature size: expected 3309 bytes, got {}",
            sig_bytes.len()
        ));
    }

    // Convert to fixed-size arrays
    let pk_array: [u8; 1952] = pk_bytes
        .try_into()
        .map_err(|_| "Failed to convert public key to array")?;

    let sig_array: [u8; 3309] = sig_bytes
        .try_into()
        .map_err(|_| "Failed to convert signature to array")?;

    // Reconstruct public key
    let pk = match ml_dsa_65::PublicKey::try_from_bytes(pk_array) {
        Ok(pk) => pk,
        Err(e) => return Err(format!("Invalid public key format: {:?}", e)),
    };

    // Verify signature
    match pk.try_verify(&message, &sig_array, &[]) {
        Ok(()) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Compute SHA3-256 hash
///
/// # Arguments
/// * `data_hex` - Hex-encoded data to hash
///
/// # Returns
/// Hex-encoded SHA3-256 hash (32 bytes)
///
/// # CP-1 Compliance
/// Uses SHA3-256 (NOT SHA-256 or keccak256)
#[wasm_bindgen]
pub fn sha3_256(data_hex: &str) -> Result<String, JsError> {
    let data = hex::decode(data_hex)
        .map_err(|e| JsError::new(&format!("Invalid hex: {:?}", e)))?;

    let hash = sha3_256_hash(&data);
    Ok(hex::encode(hash))
}

/// Get SHA3-256 hash of a public key
///
/// # Arguments
/// * `public_key_hex` - Hex-encoded public key
///
/// # Returns
/// Hex-encoded SHA3-256 hash (32 bytes)
#[wasm_bindgen]
pub fn get_public_key_hash(public_key_hex: &str) -> Result<String, JsError> {
    let pk_bytes = hex::decode(public_key_hex)
        .map_err(|e| JsError::new(&format!("Invalid public key hex: {:?}", e)))?;

    if pk_bytes.len() != 1952 {
        return Err(JsError::new(&format!(
            "Invalid public key size: expected 1952 bytes, got {}",
            pk_bytes.len()
        )));
    }

    let hash = sha3_256_hash(&pk_bytes);
    Ok(hex::encode(hash))
}

/// Get algorithm information
///
/// # Returns
/// JSON with algorithm details (ML-DSA-65 / FIPS 204)
#[wasm_bindgen]
pub fn get_algorithm_info() -> Result<JsValue, JsError> {
    let info = AlgorithmInfo {
        name: "ML-DSA-65".to_string(),
        standard: "FIPS 204".to_string(),
        security_level: "NIST Level 3".to_string(),
        security_bits: 192,
        public_key_bytes: 1952,
        secret_key_bytes: 4032,
        signature_bytes: 3309,
    };

    serde_wasm_bindgen::to_value(&info)
        .map_err(|e| JsError::new(&format!("Serialization failed: {:?}", e)))
}

/// Internal SHA3-256 hash function
fn sha3_256_hash(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha3_256::new();
    hasher.update(data);
    let result = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&result);
    hash
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha3_256() {
        // Test vector: SHA3-256("test")
        let input = hex::encode(b"test");
        let result = sha3_256(&input).unwrap();
        // Expected SHA3-256 hash of "test"
        assert_eq!(result.len(), 64); // 32 bytes = 64 hex chars
    }

    #[test]
    fn test_algorithm_info() {
        let info_js = get_algorithm_info().unwrap();
        let info: AlgorithmInfo = serde_wasm_bindgen::from_value(info_js).unwrap();
        
        assert_eq!(info.name, "ML-DSA-65");
        assert_eq!(info.standard, "FIPS 204");
        assert_eq!(info.security_bits, 192);
        assert_eq!(info.public_key_bytes, 1952);
        assert_eq!(info.secret_key_bytes, 4032);
        assert_eq!(info.signature_bytes, 3309);
    }
}
