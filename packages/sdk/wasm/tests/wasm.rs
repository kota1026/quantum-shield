//! WASM-specific tests for Quantum Shield Dilithium Module

#![cfg(target_arch = "wasm32")]

use wasm_bindgen_test::*;
use quantum_shield_wasm::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn test_keygen_in_browser() {
    let result = keygen();
    assert!(result.is_ok(), "keygen should succeed in browser");
}

#[wasm_bindgen_test]
fn test_sign_verify_in_browser() {
    // Generate keys
    let keypair = keygen().expect("keygen failed");
    let keypair_obj: serde_json::Value = serde_wasm_bindgen::from_value(keypair).expect("deserialize failed");

    let public_key = keypair_obj["public_key"].as_str().expect("no public_key");
    let secret_key = keypair_obj["secret_key"].as_str().expect("no secret_key");

    // Sign
    let message = hex::encode(b"test message");
    let signature = sign(secret_key, &message).expect("sign failed");

    // Verify
    let result = verify(public_key, &message, &signature).expect("verify failed");
    let result_obj: serde_json::Value = serde_wasm_bindgen::from_value(result).expect("deserialize failed");

    assert_eq!(result_obj["valid"], true);
}

#[wasm_bindgen_test]
fn test_algorithm_info() {
    let info = get_algorithm_info().expect("get_algorithm_info failed");
    let info_obj: serde_json::Value = serde_wasm_bindgen::from_value(info).expect("deserialize failed");

    assert_eq!(info_obj["name"], "ML-DSA-65");
    assert_eq!(info_obj["standard"], "FIPS 204");
    assert_eq!(info_obj["security_level"], 3);
    assert_eq!(info_obj["public_key_bytes"], 1952);
    assert_eq!(info_obj["secret_key_bytes"], 4032);
    assert_eq!(info_obj["signature_bytes"], 3309);
}
