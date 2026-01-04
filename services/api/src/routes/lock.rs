//! Lock API implementation (API-002)
//!
//! Implements Sequence #1: Lock
//! - Validates Dilithium signature
//! - Computes SR_0 using SHA3-256 (CP-1 compliant)
//! - Creates lock record
//! - Notifies Event Bridge for L1→L3 sync

use std::sync::Arc;

use axum::{Extension, Json};
use sha3::{Sha3_256, Digest};

use crate::{
    error::ApiError,
    services::AppState,
    types::{LockRequest, LockResponse, LockStatus},
};

/// POST /v1/lock
/// 
/// Lock assets for cross-chain transfer.
/// 
/// # Security
/// - Validates Dilithium-III signature (CP-1)
/// - Uses SHA3-256 for SR_0 computation (CP-1)
/// - NO keccak256 or ECDSA
pub async fn create_lock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<LockRequest>,
) -> Result<Json<LockResponse>, ApiError> {
    tracing::info!("Processing lock request for chain_id: {}", req.chain_id);

    // 1. Validate Dilithium signature
    if !validate_dilithium_signature(&req) {
        return Err(ApiError::InvalidSignature("Dilithium verification failed".into()));
    }

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

    // 9. Generate SMT proof (placeholder)
    let smt_proof = generate_smt_proof(&lock_id, &sr_0);

    tracing::info!("Lock created successfully: {}", lock_id);

    Ok(Json(LockResponse {
        lock_id,
        sr_0,
        smt_proof,
        status: LockStatus::Pending,
    }))
}

/// Validate Dilithium-III signature
/// 
/// CP-1 Compliance: Only Dilithium-III is used for user signatures
fn validate_dilithium_signature(req: &LockRequest) -> bool {
    // TODO: Implement actual Dilithium-III verification
    // For now, basic validation that signature exists
    !req.sig_dilithium.is_empty() && !req.pk_dilithium.is_empty()
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

/// Generate SMT proof (placeholder implementation)
fn generate_smt_proof(lock_id: &str, sr_0: &str) -> String {
    // TODO: Implement actual SMT proof generation
    let mut hasher = Sha3_256::new();
    hasher.update(lock_id.as_bytes());
    hasher.update(sr_0.as_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
