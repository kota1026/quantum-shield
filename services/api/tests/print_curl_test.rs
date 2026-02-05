//! Test to generate a valid curl command for lock API

use fips204::ml_dsa_65;
use fips204::traits::{SerDes, Signer};

#[test]
fn print_valid_lock_curl() {
    // Generate keypair
    let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");
    
    // Build lock message (matching backend format)
    let chain_id: u64 = 11155111; // Sepolia
    let asset = "0x0000000000000000000000000000000000000000";
    let amount = "1000000000000000";
    let dest_addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f5fE3d";
    let expiry: u64 = 9999999999;
    let nonce: u64 = 12345;
    
    let mut message = Vec::new();
    message.extend_from_slice(b"QS_LOCK_V1");
    message.extend_from_slice(&chain_id.to_be_bytes());
    message.extend_from_slice(asset.as_bytes());
    message.extend_from_slice(amount.as_bytes());
    message.extend_from_slice(dest_addr.as_bytes());
    message.extend_from_slice(&expiry.to_be_bytes());
    message.extend_from_slice(&nonce.to_be_bytes());
    
    println!("\n=== Message Details ===");
    println!("Message hex: {}", hex::encode(&message));
    println!("Message length: {} bytes", message.len());
    
    // Sign
    let signature = sk.try_sign(&message, &[]).expect("Signing failed");
    
    // Convert to hex (without 0x prefix, like WASM)
    let pk_hex = hex::encode(pk.into_bytes());
    let sig_hex = hex::encode(signature);
    
    println!("\n=== Key/Signature Details ===");
    println!("Public key length: {} chars ({} bytes)", pk_hex.len(), pk_hex.len() / 2);
    println!("Signature length: {} chars ({} bytes)", sig_hex.len(), sig_hex.len() / 2);
    
    // Save to file for easy curl
    let json = format!(r#"{{
  "chain_id": {},
  "asset": "{}",
  "amount": "{}",
  "dest_addr": "{}",
  "pk_dilithium": "{}",
  "sig_dilithium": "{}",
  "expiry": {},
  "nonce": {}
}}"#, chain_id, asset, amount, dest_addr, pk_hex, sig_hex, expiry, nonce);

    std::fs::write("/tmp/lock_request.json", &json).expect("Failed to write file");
    println!("\n=== Curl Command ===");
    println!("curl -X POST http://127.0.0.1:8080/v1/lock -H 'Content-Type: application/json' -d @/tmp/lock_request.json");
}
