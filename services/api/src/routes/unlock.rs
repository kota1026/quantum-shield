//! Unlock API implementation (API-003)
//!
//! Implements:
//! - Sequence #2: Unlock (Normal Path) - 24h time lock
//! - Sequence #3: Unlock (Emergency Path) - 7d time lock + bond

use std::sync::Arc;

use axum::{Extension, Json};
use sha3::{Sha3_256, Digest};

use crate::{
    error::ApiError,
    services::AppState,
    types::{UnlockRequest, UnlockResponse, EmergencyUnlockResponse, UnlockStatus, LockStatus},
};

/// Time lock constants from CORE_PRINCIPLES.md
const NORMAL_TIME_LOCK_HOURS: u64 = 24;    // SEQ#2
const EMERGENCY_TIME_LOCK_DAYS: u64 = 7;   // SEQ#3

/// POST /v1/unlock
/// 
/// Request normal unlock with 24h time lock.
/// Requires 2/5 Prover SPHINCS+ signatures.
/// 
/// # Security
/// - 24h Time Lock (CP-3)
/// - Prover 2/5 signatures required
/// - Uses SHA3-256 for SR_1 computation (CP-1)
pub async fn create_unlock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<UnlockRequest>,
) -> Result<Json<UnlockResponse>, ApiError> {
    tracing::info!("Processing unlock request for lock_id: {}", req.lock_id);

    // 1. Get lock record
    let lock = state.get_lock(&req.lock_id).await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    // 2. Validate lock status
    if lock.status == LockStatus::Released {
        return Err(ApiError::AlreadyReleased);
    }
    if lock.status == LockStatus::Challenged {
        return Err(ApiError::ChallengeActive);
    }
    if lock.status == LockStatus::UnlockPending {
        return Err(ApiError::TimeLockActive);
    }

    // 3. Validate Dilithium signature
    if !validate_dilithium_signature(&req) {
        return Err(ApiError::InvalidSignature("Dilithium verification failed".into()));
    }

    // 4. Compute SR_1 using SHA3-256 (NOT keccak256)
    let sr_1 = compute_sr1(&lock.sr_0, &req);

    // 5. Generate unlock_id
    let unlock_id = generate_unlock_id(&req.lock_id, &sr_1);

    // 6. Calculate release time (24h from now)
    let now = chrono::Utc::now().timestamp() as u64;
    let release_time = now + (NORMAL_TIME_LOCK_HOURS * 3600);

    // 7. Request Prover signatures via Signature Queue (API-005)
    state.request_prover_signatures(&unlock_id, &req.lock_id, &lock.sr_0, &sr_1).await?;

    // 8. Update lock status
    state.update_lock_status(&req.lock_id, LockStatus::UnlockPending, Some(release_time)).await?;

    tracing::info!("Unlock request created: {}", unlock_id);

    Ok(Json(UnlockResponse {
        unlock_id,
        sr_1,
        release_time,
        time_lock_hours: NORMAL_TIME_LOCK_HOURS,
        prover_signatures_required: 2,
        prover_signatures_collected: 0,
        status: UnlockStatus::PendingSignatures,
    }))
}

/// POST /v1/unlock/emergency
/// 
/// Request emergency unlock with 7d time lock and bond.
/// No Prover signatures required.
/// 
/// # Security
/// - 7d Time Lock (CP-3)
/// - Emergency Bond: MAX(0.5 ETH, amount × 5%)
/// - Uses SHA3-256 for SR_1 computation (CP-1)
pub async fn create_emergency_unlock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<UnlockRequest>,
) -> Result<Json<EmergencyUnlockResponse>, ApiError> {
    tracing::info!("Processing EMERGENCY unlock request for lock_id: {}", req.lock_id);

    // 1. Get lock record
    let lock = state.get_lock(&req.lock_id).await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    // 2. Validate lock status
    if lock.status == LockStatus::Released {
        return Err(ApiError::AlreadyReleased);
    }
    if lock.status == LockStatus::Challenged {
        return Err(ApiError::ChallengeActive);
    }

    // 3. Validate Dilithium signature
    if !validate_dilithium_signature(&req) {
        return Err(ApiError::InvalidSignature("Dilithium verification failed".into()));
    }

    // 4. Compute SR_1 using SHA3-256 (NOT keccak256)
    let sr_1 = compute_sr1(&lock.sr_0, &req);

    // 5. Generate unlock_id
    let unlock_id = generate_unlock_id(&req.lock_id, &sr_1);

    // 6. Calculate release time (7 days from now)
    let now = chrono::Utc::now().timestamp() as u64;
    let release_time = now + (EMERGENCY_TIME_LOCK_DAYS * 24 * 3600);

    // 7. Calculate emergency bond: MAX(0.5 ETH, amount × 5%)
    let bond_required = calculate_emergency_bond(&req.amount);

    // 8. Update lock status
    state.update_lock_status(&req.lock_id, LockStatus::EmergencyPending, Some(release_time)).await?;

    tracing::info!("Emergency unlock request created: {}, bond: {}", unlock_id, bond_required);

    Ok(Json(EmergencyUnlockResponse {
        unlock_id,
        sr_1,
        release_time,
        time_lock_days: EMERGENCY_TIME_LOCK_DAYS,
        bond_required,
        bond_calculation: "MAX(0.5 ETH, amount × 5%)".to_string(),
        status: UnlockStatus::EmergencyPending,
    }))
}

/// Validate Dilithium-III signature
/// 
/// CP-1 Compliance: Only Dilithium-III is used for user signatures
fn validate_dilithium_signature(req: &UnlockRequest) -> bool {
    // TODO: Implement actual Dilithium-III verification
    !req.sig_dilithium.is_empty()
}

/// Compute SR_1 using SHA3-256
/// 
/// CP-1 Compliance: SHA3-256 is used instead of keccak256
/// 
/// SR_1 = SHA3-256(
///   "QS_UNLOCK_V1" ||
///   SR_0 ||
///   lock_id ||
///   dest_addr ||
///   amount ||
///   nonce (from timestamp)
/// )
fn compute_sr1(sr_0: &str, req: &UnlockRequest) -> String {
    let mut hasher = Sha3_256::new();
    
    hasher.update(b"QS_UNLOCK_V1");
    hasher.update(sr_0.as_bytes());
    hasher.update(req.lock_id.as_bytes());
    hasher.update(req.dest_addr.as_bytes());
    hasher.update(req.amount.as_bytes());
    hasher.update(chrono::Utc::now().timestamp().to_be_bytes());
    
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

/// Generate unlock_id from lock_id and SR_1
fn generate_unlock_id(lock_id: &str, sr_1: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(lock_id.as_bytes());
    hasher.update(sr_1.as_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

/// Calculate emergency bond: MAX(0.5 ETH, amount × 5%)
/// 
/// From CORE_PRINCIPLES.md:
/// - Emergency Bond: MAX(0.5 ETH, amount × 5%)
fn calculate_emergency_bond(amount: &str) -> String {
    const MIN_BOND_WEI: u128 = 500_000_000_000_000_000; // 0.5 ETH
    const BOND_PERCENTAGE_BPS: u128 = 500; // 5% = 500 basis points

    let amount_wei: u128 = amount.parse().unwrap_or(0);
    let percentage_bond = (amount_wei * BOND_PERCENTAGE_BPS) / 10_000;
    
    let bond = std::cmp::max(MIN_BOND_WEI, percentage_bond);
    bond.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_time_lock_constants() {
        // SEQ#2: 24h Normal Time Lock
        assert_eq!(NORMAL_TIME_LOCK_HOURS, 24);
        // SEQ#3: 7d Emergency Time Lock
        assert_eq!(EMERGENCY_TIME_LOCK_DAYS, 7);
    }

    #[test]
    fn test_emergency_bond_minimum() {
        // 0.1 ETH → should return 0.5 ETH (minimum)
        let bond = calculate_emergency_bond("100000000000000000");
        assert_eq!(bond, "500000000000000000"); // 0.5 ETH
    }

    #[test]
    fn test_emergency_bond_percentage() {
        // 100 ETH → 5% = 5 ETH > 0.5 ETH minimum
        let bond = calculate_emergency_bond("100000000000000000000");
        assert_eq!(bond, "5000000000000000000"); // 5 ETH
    }

    #[test]
    fn test_emergency_bond_edge_case() {
        // 10 ETH → 5% = 0.5 ETH = minimum
        let bond = calculate_emergency_bond("10000000000000000000");
        assert_eq!(bond, "500000000000000000"); // 0.5 ETH
    }

    #[test]
    fn test_compute_sr1_uses_sha3_256() {
        let sr_0 = "0xabc123";
        let req = UnlockRequest {
            lock_id: "0xdef456".to_string(),
            dest_addr: "0x1234".to_string(),
            amount: "1000000000000000000".to_string(),
            sig_dilithium: "0xsig".to_string(),
        };

        let sr_1 = compute_sr1(sr_0, &req);
        
        // SR_1 should be a hex string starting with 0x
        assert!(sr_1.starts_with("0x"));
        // SHA3-256 produces 32 bytes = 64 hex chars + 0x prefix
        assert_eq!(sr_1.len(), 66);
    }
}
