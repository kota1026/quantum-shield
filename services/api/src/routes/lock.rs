//! Lock API implementation (API-002)
//!
//! Implements Sequence #1: Lock
//! - Validates ML-DSA-65 signature (NIST FIPS 204)
//! - Computes SR_0 using SHA3-256 (CP-1 compliant)
//! - Creates lock record
//! - Generates SMT proof for L3 state verification
//! - Notifies Event Bridge for L1→L3 sync
//!
//! ## CP-1 Compliance
//! - Uses NIST FIPS 204 ML-DSA-65 for user signatures
//! - Uses SHA3-256 for all hashing (including SMT)
//! - NO keccak256, ECDSA, or pre-FIPS Dilithium
//!
//! ## BE Rules Compliance
//! - BE-001: No stubs - real SMT proof generation
//! - BE-003: Full logging of lock operations

use std::sync::Arc;

use axum::{Extension, Json};
use sha3::{Digest, Sha3_256};

use crate::{
    crypto::verify_ml_dsa_65_signature,
    error::ApiError,
    services::{AppState, SmtService},
    types::{LockRequest, LockResponse, LockStatus},
};

/// POST /v1/lock
///
/// Lock assets for cross-chain transfer.
///
/// # Security
/// - Validates ML-DSA-65 signature (NIST FIPS 204 - CP-1)
/// - Uses SHA3-256 for SR_0 computation (CP-1)
/// - NO keccak256 or ECDSA
pub async fn create_lock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<LockRequest>,
) -> Result<Json<LockResponse>, ApiError> {
    tracing::info!("Processing lock request for chain_id: {}", req.chain_id);

    // 1. Validate ML-DSA-65 signature (NIST FIPS 204 - CP-1 Compliant)
    let message = construct_lock_message(&req);
    if !verify_ml_dsa_65_signature(&message, &req.sig_dilithium, &req.pk_dilithium)? {
        return Err(ApiError::InvalidSignature(
            "ML-DSA-65 (FIPS 204) verification failed".into(),
        ));
    }
    tracing::info!("✓ ML-DSA-65 signature verified (NIST FIPS 204 compliant)");

    // 2. Check nonce
    if state.is_nonce_used(&req.pk_dilithium, req.nonce).await? {
        return Err(ApiError::InvalidNonce("Nonce already used".into()));
    }

    // 3. Check expiry
    let now = chrono::Utc::now().timestamp() as u64;
    if req.expiry <= now {
        return Err(ApiError::ExpiredRequest);
    }

    // 4. Compute SR_0 using SHA3-256 (NOT keccak256)
    let sr_0 = compute_sr0(&req);

    // 5. Generate lock_id
    let lock_id = generate_lock_id(&sr_0, now);

    // 6. Store lock record
    state.store_lock(&lock_id, &req, &sr_0).await?;

    // 7. Mark nonce as used
    state.mark_nonce_used(&req.pk_dilithium, req.nonce).await?;

    // 8. Notify Event Bridge for L1 sync
    state.notify_lock_created(&lock_id).await?;

    // 9. Insert lock into SMT and generate proof (BE-001: No stubs)
    let leaf_index = state.smt.insert_lock(&lock_id, &sr_0)?;
    let smt_proof_obj = state.smt.generate_proof(&lock_id)?;
    let smt_proof = SmtService::proof_to_hex(&smt_proof_obj);

    tracing::info!(
        "Lock created successfully: lock_id={}, smt_leaf_index={}, smt_root={}",
        lock_id,
        leaf_index,
        smt_proof_obj.root
    );

    Ok(Json(LockResponse {
        lock_id,
        sr_0,
        smt_proof,
        status: LockStatus::Pending,
    }))
}

/// Construct the message to be signed for lock requests
///
/// Message format:
/// "QS_LOCK_V1" || chain_id || asset || amount || dest_addr || expiry || nonce
fn construct_lock_message(req: &LockRequest) -> Vec<u8> {
    let mut message = Vec::new();
    message.extend_from_slice(b"QS_LOCK_V1");
    message.extend_from_slice(&req.chain_id.to_be_bytes());
    message.extend_from_slice(req.asset.as_bytes());
    message.extend_from_slice(req.amount.as_bytes());
    message.extend_from_slice(req.dest_addr.as_bytes());
    message.extend_from_slice(&req.expiry.to_be_bytes());
    message.extend_from_slice(&req.nonce.to_be_bytes());
    message
}

/// Compute SR_0 using SHA3-256
///
/// CP-1 Compliance: SHA3-256 is used instead of keccak256
///
/// SR_0 = SHA3-256(
///   "QS_LOCK_V1" ||
///   chain_id ||
///   asset ||
///   amount ||
///   dest_addr ||
///   expiry ||
///   nonce ||
///   pk_dilithium
/// )
fn compute_sr0(req: &LockRequest) -> String {
    let mut hasher = Sha3_256::new();

    hasher.update(b"QS_LOCK_V1");
    hasher.update(req.chain_id.to_be_bytes());
    hasher.update(req.asset.as_bytes());
    hasher.update(req.amount.as_bytes());
    hasher.update(req.dest_addr.as_bytes());
    hasher.update(req.expiry.to_be_bytes());
    hasher.update(req.nonce.to_be_bytes());
    hasher.update(req.pk_dilithium.as_bytes());

    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

/// Generate lock_id from SR_0 and timestamp
fn generate_lock_id(sr_0: &str, timestamp: u64) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(sr_0.as_bytes());
    hasher.update(timestamp.to_be_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

// Note: SMT proof generation is now handled by SmtService (BE-001 compliant)
// The placeholder generate_smt_proof function has been removed.

#[cfg(test)]
mod tests {
    use super::*;
    use fips204::ml_dsa_65;
    use fips204::traits::{SerDes, Signer};

    #[test]
    fn test_compute_sr0_uses_sha3_256() {
        let req = LockRequest {
            chain_id: 11155111,
            asset: "0x0000000000000000000000000000000000000000".to_string(),
            amount: "1000000000000000000".to_string(),
            dest_addr: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
            expiry: 1736150400,
            nonce: 1,
            pk_dilithium: "0xabc123".to_string(),
            sig_dilithium: "0xdef456".to_string(),
        };

        let sr_0 = compute_sr0(&req);

        // SR_0 should be a hex string starting with 0x
        assert!(sr_0.starts_with("0x"));
        // SHA3-256 produces 32 bytes = 64 hex chars + 0x prefix
        assert_eq!(sr_0.len(), 66);
    }

    #[test]
    fn test_generate_lock_id_deterministic() {
        let sr_0 = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
        let timestamp = 1736150400u64;

        let lock_id_1 = generate_lock_id(sr_0, timestamp);
        let lock_id_2 = generate_lock_id(sr_0, timestamp);

        assert_eq!(lock_id_1, lock_id_2);
    }

    #[test]
    fn test_construct_lock_message() {
        let req = LockRequest {
            chain_id: 1,
            asset: "ETH".to_string(),
            amount: "1000".to_string(),
            dest_addr: "0xdest".to_string(),
            expiry: 12345,
            nonce: 1,
            pk_dilithium: "0xpk".to_string(),
            sig_dilithium: "0xsig".to_string(),
        };

        let message = construct_lock_message(&req);

        // Message should start with "QS_LOCK_V1"
        assert!(message.starts_with(b"QS_LOCK_V1"));
        // Message should be non-empty
        assert!(!message.is_empty());
    }

    #[test]
    fn test_ml_dsa_65_lock_signature_verification() {
        // Generate a test keypair using FIPS 204
        let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");

        // Create a lock request
        let pk_hex = format!("0x{}", hex::encode(pk.into_bytes()));

        let req = LockRequest {
            chain_id: 11155111,
            asset: "0x0000000000000000000000000000000000000000".to_string(),
            amount: "1000000000000000000".to_string(),
            dest_addr: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
            expiry: 1736150400,
            nonce: 1,
            pk_dilithium: pk_hex.clone(),
            sig_dilithium: String::new(), // Will be set below
        };

        // Construct message and sign
        let message = construct_lock_message(&req);
        let signature = sk.try_sign(&message, &[]).expect("Signing failed");
        let sig_hex = format!("0x{}", hex::encode(signature));

        // Verify signature
        let result = verify_ml_dsa_65_signature(&message, &sig_hex, &pk_hex);
        assert!(result.is_ok());
        assert!(result.unwrap(), "Lock signature should be valid");
    }
}
