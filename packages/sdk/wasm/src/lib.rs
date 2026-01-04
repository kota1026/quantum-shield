//! Quantum Shield Dilithium WASM Module
//!
//! This module provides FIPS 204 ML-DSA-65 (Dilithium-III) signatures for web browsers.
//! Part of the Quantum Shield post-quantum cryptographic bridge system.
//!
//! ## Features
//! - Key generation: <500ms target
//! - Signing: <100ms target
//! - Verification: <50ms target
//!
//! ## Security
//! - NIST FIPS 204 compliant
//! - Quantum-resistant (lattice-based)
//! - CP-1 compliant (no ECDSA, RSA, SHA-256, keccak256)

use wasm_bindgen::prelude::*;
use fips204::ml_dsa_65;
use fips204::traits::{KeyGen, Signer, Verifier};
use sha3::{Sha3_256, Digest};
use serde::{Serialize, Deserialize};

#[cfg(feature = "console_error_panic_hook")]
use console_error_panic_hook::set_once as set_panic_hook;

/// Initialize the WASM module with panic hook for better error messages
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    set_panic_hook();
}

/// Dilithium key pair for FIPS 204 ML-DSA-65
#[derive(Serialize, Deserialize)]
pub struct DilithiumKeyPair {
    /// Public key (1952 bytes, hex encoded = 3904 chars)
    pub public_key: String,
    /// Secret key (4032 bytes, hex encoded = 8064 chars)
    pub secret_key: String,
    /// Public key hash (SHA3-256, 32 bytes, hex encoded = 64 chars)
    pub public_key_hash: String,
}

/// Result of signature verification
#[derive(Serialize, Deserialize)]
pub struct VerificationResult {
    /// Whether the signature is valid
    pub valid: bool,
    /// Error message if any
    pub error: Option<String>,
}

/// Generate a new Dilithium key pair (FIPS 204 ML-DSA-65)
///
/// # Returns
/// - `DilithiumKeyPair` containing public_key, secret_key, and public_key_hash
///
/// # Performance Target
/// - <500ms on modern browsers (Chrome/Firefox, M1 Mac equivalent)
///
/// # Security
/// - Uses NIST FIPS 204 ML-DSA-65 parameters
/// - Quantum-resistant (192-bit security level)
#[wasm_bindgen]
pub fn keygen() -> Result<JsValue, JsValue> {
    // Generate key pair using FIPS 204 ML-DSA-65
    let (pk, sk) = match ml_dsa_65::KG::try_keygen() {
        Ok(keys) => keys,
        Err(e) => return Err(JsValue::from_str(&format!("Key generation failed: {:?}", e))),
    };

    // Extract raw bytes
    let pk_bytes = pk.clone().into_bytes();
    let sk_bytes = sk.into_bytes();

    // Compute SHA3-256 hash of public key (CP-1 compliant)
    let mut hasher = Sha3_256::new();
    hasher.update(&pk_bytes);
    let pk_hash = hasher.finalize();

    let key_pair = DilithiumKeyPair {
        public_key: hex::encode(&pk_bytes),
        secret_key: hex::encode(&sk_bytes),
        public_key_hash: hex::encode(&pk_hash),
    };

    serde_wasm_bindgen::to_value(&key_pair)
        .map_err(|e| JsValue::from_str(&format!("Serialization failed: {:?}", e)))
}

/// Sign a message using Dilithium secret key
///
/// # Arguments
/// - `secret_key_hex`: Hex-encoded secret key (8064 chars)
/// - `message_hex`: Hex-encoded message to sign
///
/// # Returns
/// - Hex-encoded signature (3309 bytes = 6618 chars)
///
/// # Performance Target
/// - <100ms for 32-byte message
#[wasm_bindgen]
pub fn sign(secret_key_hex: &str, message_hex: &str) -> Result<String, JsValue> {
    // Decode secret key
    let sk_bytes = hex::decode(secret_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid secret key hex: {:?}", e)))?;

    // Validate secret key length (4032 bytes for ML-DSA-65)
    if sk_bytes.len() != 4032 {
        return Err(JsValue::from_str(&format!(
            "Invalid secret key length: expected 4032, got {}",
            sk_bytes.len()
        )));
    }

    // Decode message
    let message = hex::decode(message_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid message hex: {:?}", e)))?;

    // Convert to fixed-size array
    let sk_array: [u8; 4032] = sk_bytes
        .try_into()
        .map_err(|_| JsValue::from_str("Failed to convert secret key to array"))?;

    // Reconstruct secret key
    let sk = ml_dsa_65::PrivateKey::try_from_bytes(sk_array)
        .map_err(|e| JsValue::from_str(&format!("Invalid secret key: {:?}", e)))?;

    // Sign the message
    let signature = sk.try_sign(&message, &[])
        .map_err(|e| JsValue::from_str(&format!("Signing failed: {:?}", e)))?;

    Ok(hex::encode(signature))
}

/// Verify a signature using Dilithium public key
///
/// # Arguments
/// - `public_key_hex`: Hex-encoded public key (3904 chars)
/// - `message_hex`: Hex-encoded message that was signed
/// - `signature_hex`: Hex-encoded signature to verify (6618 chars)
///
/// # Returns
/// - `VerificationResult` with `valid` boolean and optional error
///
/// # Performance Target
/// - <50ms for 32-byte message
#[wasm_bindgen]
pub fn verify(public_key_hex: &str, message_hex: &str, signature_hex: &str) -> Result<JsValue, JsValue> {
    // Decode public key
    let pk_bytes = match hex::decode(public_key_hex) {
        Ok(b) => b,
        Err(e) => {
            let result = VerificationResult {
                valid: false,
                error: Some(format!("Invalid public key hex: {:?}", e)),
            };
            return serde_wasm_bindgen::to_value(&result)
                .map_err(|e| JsValue::from_str(&format!("Serialization failed: {:?}", e)));
        }
    };

    // Validate public key length (1952 bytes for ML-DSA-65)
    if pk_bytes.len() != 1952 {
        let result = VerificationResult {
            valid: false,
            error: Some(format!("Invalid public key length: expected 1952, got {}", pk_bytes.len())),
        };
        return serde_wasm_bindgen::to_value(&result)
            .map_err(|e| JsValue::from_str(&format!("Serialization failed: {:?}", e)));
    }

    // Decode message
    let message = match hex::decode(message_hex) {
        Ok(m) => m,
        Err(e) => {
            let result = VerificationResult {
                valid: false,
                error: Some(format!("Invalid message hex: {:?}", e)),
            };
            return serde_wasm_bindgen::to_value(&result)
                .map_err(|e| JsValue::from_str(&format!("Serialization failed: {:?}", e)));
        }
    };

    // Decode signature
    let sig_bytes = match hex::decode(signature_hex) {
        Ok(s) => s,
        Err(e) => {
            let result = VerificationResult {
                valid: false,
                error: Some(format!("Invalid signature hex: {:?}", e)),
            };
            return serde_wasm_bindgen::to_value(&result)
                .map_err(|e| JsValue::from_str(&format!("Serialization failed: {:?}", e)));
        }
    };

    // Validate signature length (3309 bytes for ML-DSA-65)
    if sig_bytes.len() != 3309 {
        let result = VerificationResult {
            valid: false,
            error: Some(format!("Invalid signature length: expected 3309, got {}", sig_bytes.len())),
        };
        return serde_wasm_bindgen::to_value(&result)
            .map_err(|e| JsValue::from_str(&format!("Serialization failed: {:?}", e)));
    }

    // Convert to fixed-size arrays
    let pk_array: [u8; 1952] = pk_bytes
        .try_into()
        .map_err(|_| JsValue::from_str("Failed to convert public key to array"))?;

    let sig_array: [u8; 3309] = sig_bytes
        .try_into()
        .map_err(|_| JsValue::from_str("Failed to convert signature to array"))?;

    // Reconstruct public key
    let pk = match ml_dsa_65::PublicKey::try_from_bytes(pk_array) {
        Ok(k) => k,
        Err(e) => {
            let result = VerificationResult {
                valid: false,
                error: Some(format!("Invalid public key: {:?}", e)),
            };
            return serde_wasm_bindgen::to_value(&result)
                .map_err(|e| JsValue::from_str(&format!("Serialization failed: {:?}", e)));
        }
    };

    // Verify the signature
    let valid = pk.verify(&message, &sig_array, &[]);

    let result = VerificationResult {
        valid,
        error: if valid { None } else { Some("Signature verification failed".to_string()) },
    };

    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization failed: {:?}", e)))
}

/// Compute SHA3-256 hash (CP-1 compliant)
///
/// # Arguments
/// - `data_hex`: Hex-encoded data to hash
///
/// # Returns
/// - Hex-encoded SHA3-256 hash (64 chars)
#[wasm_bindgen]
pub fn sha3_256(data_hex: &str) -> Result<String, JsValue> {
    let data = hex::decode(data_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid data hex: {:?}", e)))?;

    let mut hasher = Sha3_256::new();
    hasher.update(&data);
    let hash = hasher.finalize();

    Ok(hex::encode(&hash))
}

/// Get public key hash from public key (SHA3-256)
///
/// # Arguments
/// - `public_key_hex`: Hex-encoded public key
///
/// # Returns
/// - Hex-encoded SHA3-256 hash of public key (64 chars)
#[wasm_bindgen]
pub fn get_public_key_hash(public_key_hex: &str) -> Result<String, JsValue> {
    let pk_bytes = hex::decode(public_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid public key hex: {:?}", e)))?;

    let mut hasher = Sha3_256::new();
    hasher.update(&pk_bytes);
    let hash = hasher.finalize();

    Ok(hex::encode(&hash))
}

/// Get WASM module version
#[wasm_bindgen]
pub fn get_version() -> String {
    "0.1.0".to_string()
}

/// Get algorithm information
#[wasm_bindgen]
pub fn get_algorithm_info() -> Result<JsValue, JsValue> {
    #[derive(Serialize)]
    struct AlgorithmInfo {
        name: &'static str,
        standard: &'static str,
        security_level: u8,
        public_key_bytes: usize,
        secret_key_bytes: usize,
        signature_bytes: usize,
        hash_algorithm: &'static str,
    }

    let info = AlgorithmInfo {
        name: "ML-DSA-65",
        standard: "FIPS 204",
        security_level: 3, // NIST Level 3 (192-bit security)
        public_key_bytes: 1952,
        secret_key_bytes: 4032,
        signature_bytes: 3309,
        hash_algorithm: "SHA3-256",
    };

    serde_wasm_bindgen::to_value(&info)
        .map_err(|e| JsValue::from_str(&format!("Serialization failed: {:?}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keygen() {
        let result = keygen();
        assert!(result.is_ok());
    }

    #[test]
    fn test_sign_verify_roundtrip() {
        // Generate key pair
        let js_keypair = keygen().expect("keygen failed");
        let keypair: DilithiumKeyPair = serde_wasm_bindgen::from_value(js_keypair).expect("deserialize failed");

        // Sign a message
        let message = hex::encode(b"Hello, Quantum Shield!");
        let signature = sign(&keypair.secret_key, &message).expect("sign failed");

        // Verify the signature
        let js_result = verify(&keypair.public_key, &message, &signature).expect("verify failed");
        let result: VerificationResult = serde_wasm_bindgen::from_value(js_result).expect("deserialize failed");

        assert!(result.valid);
        assert!(result.error.is_none());
    }

    #[test]
    fn test_invalid_signature() {
        // Generate key pair
        let js_keypair = keygen().expect("keygen failed");
        let keypair: DilithiumKeyPair = serde_wasm_bindgen::from_value(js_keypair).expect("deserialize failed");

        // Sign a message
        let message = hex::encode(b"Hello, Quantum Shield!");
        let mut signature = sign(&keypair.secret_key, &message).expect("sign failed");

        // Corrupt the signature
        let mut sig_bytes = hex::decode(&signature).unwrap();
        sig_bytes[0] ^= 0xff;
        signature = hex::encode(&sig_bytes);

        // Verify should fail
        let js_result = verify(&keypair.public_key, &message, &signature).expect("verify failed");
        let result: VerificationResult = serde_wasm_bindgen::from_value(js_result).expect("deserialize failed");

        assert!(!result.valid);
    }

    #[test]
    fn test_sha3_256() {
        let data = hex::encode(b"test");
        let hash = sha3_256(&data).expect("sha3_256 failed");

        // Expected SHA3-256 of "test"
        // Using Python: hashlib.sha3_256(b"test").hexdigest()
        let expected = "36f028580bb02cc8272a9a020f4200e346e276ae664e45ee80745574e2f5ab80";
        assert_eq!(hash, expected);
    }

    #[test]
    fn test_get_public_key_hash() {
        let js_keypair = keygen().expect("keygen failed");
        let keypair: DilithiumKeyPair = serde_wasm_bindgen::from_value(js_keypair).expect("deserialize failed");

        let hash = get_public_key_hash(&keypair.public_key).expect("get_public_key_hash failed");
        assert_eq!(hash, keypair.public_key_hash);
    }
}
