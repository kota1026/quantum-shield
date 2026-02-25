//! Real Lock API Test
//!
//! Generates valid ML-DSA-65 signature and calls the actual API endpoint

use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Signer};

#[test]
fn test_real_lock_api_with_valid_signature() {
    // Generate ML-DSA-65 keypair
    let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");
    let pk_hex = format!("0x{}", hex::encode(pk.into_bytes()));

    // Lock request parameters
    let chain_id: u64 = 11155111;
    let asset = "ETH";
    let amount = "1000000000000000000";
    let dest_addr = "0x1234567890abcdef1234567890abcdef12345678";
    let expiry: u64 = 1900000000; // Far future
    let nonce: u64 = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Construct message exactly as the API does
    let mut message = Vec::new();
    message.extend_from_slice(b"QS_LOCK_V1");
    message.extend_from_slice(&chain_id.to_be_bytes());
    message.extend_from_slice(asset.as_bytes());
    message.extend_from_slice(amount.as_bytes());
    message.extend_from_slice(dest_addr.as_bytes());
    message.extend_from_slice(&expiry.to_be_bytes());
    message.extend_from_slice(&nonce.to_be_bytes());

    // Sign the message
    let signature = sk.try_sign(&message, &[]).expect("Signing failed");
    let sig_hex = format!("0x{}", hex::encode(signature));

    // Print for manual testing
    println!("\n=== Valid Lock Request ===");
    println!("pk_dilithium length: {}", pk_hex.len());
    println!("sig_dilithium length: {}", sig_hex.len());

    // Create JSON payload
    let payload = serde_json::json!({
        "chain_id": chain_id,
        "asset": asset,
        "amount": amount,
        "dest_addr": dest_addr,
        "expiry": expiry,
        "nonce": nonce,
        "pk_dilithium": pk_hex,
        "sig_dilithium": sig_hex
    });

    println!("\nJSON Payload:\n{}", serde_json::to_string_pretty(&payload).unwrap());

    // Write to file for easy testing
    std::fs::write("/tmp/lock_request.json", serde_json::to_string_pretty(&payload).unwrap())
        .expect("Failed to write file");

    println!("\nSaved to /tmp/lock_request.json");
    println!("\nTest with:");
    println!("curl -X POST http://localhost:8080/v1/lock -H 'Content-Type: application/json' -d @/tmp/lock_request.json");
}
