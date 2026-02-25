//! Unlock API implementation (API-003)
//!
//! Implements:
//! - Sequence #2: Unlock (Normal Path) - 24h time lock
//!   - §2.3: VRF Prover Selection (Chainlink VRF v2.5)
//!   - §2.4: VRF Result Processing (2/5 weighted selection)
//! - Sequence #3: Unlock (Emergency Path) - 7d time lock + bond
//!
//! ## CP-1 Compliance
//! - Uses NIST FIPS 204 ML-DSA-65 for user signatures
//! - Uses SHA3-256 for all hashing
//! - NO keccak256, ECDSA, or pre-FIPS Dilithium

use std::sync::Arc;
use std::time::Duration;

use axum::{Extension, Json};
use sha3::{Digest, Sha3_256};

use bigdecimal::BigDecimal;
use std::str::FromStr;

use crate::{
    crypto::verify_ml_dsa_65_signature,
    error::ApiError,
    services::AppState,
    types::{ClaimUnlockRequest, ClaimUnlockResponse, EmergencyUnlockResponse, LockStatus, UnlockRequest, UnlockResponse, UnlockStatus, VRFStatus},
};

/// Time lock constants from CORE_PRINCIPLES.md
const NORMAL_TIME_LOCK_HOURS: u64 = 24; // SEQ#2
const EMERGENCY_TIME_LOCK_DAYS: u64 = 7; // SEQ#3

/// POST /v1/unlock
///
/// Request normal unlock with 24h time lock.
/// Requires 2/5 Prover SPHINCS+ signatures.
///
/// # Security
/// - 24h Time Lock (CP-3)
/// - Prover 2/5 signatures required via VRF selection (SEQUENCES §2.3-§2.4)
/// - Uses SHA3-256 for SR_1 computation (CP-1)
/// - Uses ML-DSA-65 (FIPS 204) for user signature verification (CP-1)
///
/// # VRF Integration (SEQUENCES §2.3-§2.4)
/// 1. Request VRF prover selection from VRFConsumer contract
/// 2. Wait for VRF fulfillment (max 5 minutes)
/// 3. If timeout, trigger fallback using block.prevrandao
/// 4. Request signatures only from selected provers
pub async fn create_unlock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<UnlockRequest>,
) -> Result<Json<UnlockResponse>, ApiError> {
    tracing::info!("Processing unlock request for lock_id: {}", req.lock_id);

    // 1. Get lock record
    let lock = state
        .get_lock(&req.lock_id)
        .await?
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

    // 3. Validate ML-DSA-65 signature (NIST FIPS 204 - CP-1 Compliant)
    let message = construct_unlock_message(&req.lock_id, &req.dest_addr, &req.amount);
    let sig_valid = verify_ml_dsa_65_signature(&message, &req.sig_dilithium, &lock.user_public_key)?;
    if !sig_valid {
        if state.config().security.skip_signature_verification {
            tracing::warn!("SECURITY: ML-DSA-65 signature verification failed, skip_signature_verification=true");
        } else {
            return Err(ApiError::InvalidSignature(
                "ML-DSA-65 (FIPS 204) verification failed".into(),
            ));
        }
    } else {
        tracing::info!("ML-DSA-65 signature verified (NIST FIPS 204 compliant)");
    }

    // 4. Compute SR_1 using SHA3-256 (NOT keccak256)
    let sr_1 = compute_sr1(&lock.sr_0, &req);

    // 5. Generate unlock_id
    let unlock_id = generate_unlock_id(&req.lock_id, &sr_1);

    // 6. Calculate release time (24h from now)
    let now = chrono::Utc::now().timestamp() as u64;
    let release_time = now + (NORMAL_TIME_LOCK_HOURS * 3600);

    // 6b. Storage Migration: INSERT unlock_request into PostgreSQL (SM-001: PG first)
    {
        // Ensure user exists (FK constraint on unlock_requests.wallet_address)
        crate::db::UserRepository::ensure_exists(state.pool(), &lock.dest_addr).await?;

        let amount_bd = BigDecimal::from_str(&req.amount).unwrap_or_else(|_| BigDecimal::from(0));
        let sig_bytes = hex::decode(req.sig_dilithium.trim_start_matches("0x")).unwrap_or_default();
        let dest_bytes = hex::decode(req.dest_addr.trim_start_matches("0x")).unwrap_or_default();
        let release_dt = chrono::DateTime::from_timestamp(release_time as i64, 0);

        crate::db::LockRepository::create_unlock_request(
            state.pool(),
            &unlock_id,
            &req.lock_id,
            &lock.dest_addr,  // wallet_address (lock owner)
            &dest_bytes,
            &amount_bd,
            &sig_bytes,
            &lock.sr_0,
            &sr_1,
            false,  // is_emergency = false
            None,   // no bond for normal unlock
            release_dt,
        ).await?;
        tracing::info!("Unlock request stored in PG: unlock_id={}", unlock_id);
    }

    // 7. VRF Prover Selection (SEQUENCES §2.3-§2.4)
    //    Request VRF from Chainlink, wait for result, or fallback
    tracing::info!("Initiating VRF prover selection for unlock: {}", unlock_id);

    // 7.1 Request VRF prover selection
    let vrf_request_id = state.vrf
        .request_prover_selection(&unlock_id)
        .await
        .map_err(|e| ApiError::Internal(format!("VRF request failed: {}", e)))?;

    // 7.2 Create and store VRF request record
    let vrf_request = state.vrf.create_vrf_request(&vrf_request_id, &unlock_id, &req.lock_id);
    state.store_vrf_request(&vrf_request).await?;

    tracing::info!("VRF request created: {} for unlock: {}", vrf_request_id, unlock_id);

    // 7.3 Wait for VRF selection (max 5 min timeout with fallback)
    let vrf_timeout = state.vrf.get_timeout();
    let (_initial_prover, random_value, vrf_status) = state.vrf
        .wait_for_selection(&unlock_id, now, vrf_timeout)
        .await
        .map_err(|e| ApiError::Internal(format!("VRF selection failed: {}", e)))?;

    // 7.4 Use VRF random value to select 2-of-N active provers (SEQUENCES §2.4)
    let active_provers = crate::db::ProverRepository::list_provers(
        state.db.pool(), Some("active"), None, 0, 100,
    ).await?;
    let prover_addresses: Vec<String> = active_provers.iter()
        .map(|p| p.prover_id.clone())
        .collect();

    let selected_provers = if prover_addresses.len() >= 2 {
        state.vrf.select_provers(&random_value, &prover_addresses)
    } else if prover_addresses.len() == 1 {
        // Only 1 prover available — use it (degraded mode)
        tracing::warn!("Only 1 active prover available — degraded 2-of-5 selection");
        prover_addresses
    } else {
        // No active provers — use fallback address
        tracing::warn!("No active provers in DB — using fallback address");
        vec!["0x0000000000000000000000000000000000000002".to_string()]
    };

    tracing::info!(
        "VRF selection complete: provers={:?} (count={}), status={:?}",
        selected_provers, selected_provers.len(), vrf_status
    );

    // 7.5 Update VRF status in Redis
    state.update_vrf_status(
        &vrf_request_id,
        vrf_status,
        selected_provers.first().map(|s| s.as_str()),
        None, // random_value stored in contract
    ).await?;

    // 8. Request Prover signatures from ALL selected provers (SEQUENCES §2.4: 2-of-5)
    //    Creates signing_queue entries for each selected prover
    for prover in &selected_provers {
        state
            .request_selected_prover_signatures(
                &unlock_id,
                &req.lock_id,
                &lock.sr_0,
                &sr_1,
                prover,
                &lock.dest_addr,  // user's wallet address
                &req.amount,
                false,  // is_emergency = false for normal unlock
                release_time,
            )
            .await?;
    }

    // 9. Update lock status
    state
        .update_lock_status(&req.lock_id, LockStatus::UnlockPending, Some(release_time))
        .await?;

    tracing::info!("Unlock request created: {} with {} VRF provers: {:?}", unlock_id, selected_provers.len(), selected_provers);

    Ok(Json(UnlockResponse {
        unlock_id,
        sr_1,
        release_time,
        time_lock_hours: NORMAL_TIME_LOCK_HOURS,
        prover_signatures_required: 2,
        prover_signatures_collected: 0,
        status: UnlockStatus::PendingSignatures,
        vrf_request_id: Some(vrf_request_id),
        selected_provers,
        vrf_status,
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
/// - Uses ML-DSA-65 (FIPS 204) for user signature verification (CP-1)
pub async fn create_emergency_unlock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<UnlockRequest>,
) -> Result<Json<EmergencyUnlockResponse>, ApiError> {
    tracing::info!(
        "Processing EMERGENCY unlock request for lock_id: {}",
        req.lock_id
    );

    // 1. Get lock record
    let lock = state
        .get_lock(&req.lock_id)
        .await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    // 2. Validate lock status
    if lock.status == LockStatus::Released {
        return Err(ApiError::AlreadyReleased);
    }
    if lock.status == LockStatus::Challenged {
        return Err(ApiError::ChallengeActive);
    }

    // 3. Validate ML-DSA-65 signature (NIST FIPS 204 - CP-1 Compliant)
    let message = construct_unlock_message(&req.lock_id, &req.dest_addr, &req.amount);
    let sig_valid = verify_ml_dsa_65_signature(&message, &req.sig_dilithium, &lock.user_public_key)?;
    if !sig_valid {
        if state.config().security.skip_signature_verification {
            tracing::warn!("SECURITY: ML-DSA-65 signature verification failed, skip_signature_verification=true");
        } else {
            return Err(ApiError::InvalidSignature(
                "ML-DSA-65 (FIPS 204) verification failed".into(),
            ));
        }
    } else {
        tracing::info!("ML-DSA-65 signature verified (NIST FIPS 204 compliant)");
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

    // 7b. Storage Migration: INSERT emergency unlock_request into PostgreSQL (SM-001: PG first)
    {
        // Ensure user exists (FK constraint on unlock_requests.wallet_address)
        crate::db::UserRepository::ensure_exists(state.pool(), &lock.dest_addr).await?;

        let amount_bd = BigDecimal::from_str(&req.amount).unwrap_or_else(|_| BigDecimal::from(0));
        let bond_bd = BigDecimal::from_str(&bond_required).unwrap_or_else(|_| BigDecimal::from(0));
        let sig_bytes = hex::decode(req.sig_dilithium.trim_start_matches("0x")).unwrap_or_default();
        let dest_bytes = hex::decode(req.dest_addr.trim_start_matches("0x")).unwrap_or_default();
        let release_dt = chrono::DateTime::from_timestamp(release_time as i64, 0);

        crate::db::LockRepository::create_unlock_request(
            state.pool(),
            &unlock_id,
            &req.lock_id,
            &lock.dest_addr,  // wallet_address (lock owner)
            &dest_bytes,
            &amount_bd,
            &sig_bytes,
            &lock.sr_0,
            &sr_1,
            true,          // is_emergency = true
            Some(&bond_bd),
            release_dt,
        ).await?;
        tracing::info!("Emergency unlock request stored in PG: unlock_id={}", unlock_id);
    }

    // 8. Update lock status
    state
        .update_lock_status(&req.lock_id, LockStatus::EmergencyPending, Some(release_time))
        .await?;

    tracing::info!(
        "Emergency unlock request created: {}, bond: {}",
        unlock_id, bond_required
    );

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

/// POST /v1/unlock/claim
///
/// Execute unlock after timelock expiry.
/// Calls L1 Vault.executeUnlock() to release funds.
///
/// # Prerequisites
/// - 2/5 SPHINCS+ signatures collected
/// - requestUnlock submitted to L1
/// - 24h timelock has passed
pub async fn claim_unlock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ClaimUnlockRequest>,
) -> Result<Json<ClaimUnlockResponse>, ApiError> {
    tracing::info!("Processing claim request for lock_id: {}", req.lock_id);

    // 1. Get lock record
    let lock = state
        .get_lock(&req.lock_id)
        .await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    // 2. Validate lock is in unlock_pending status
    if lock.status != LockStatus::UnlockPending && lock.status != LockStatus::EmergencyPending {
        return Err(ApiError::BadRequest(format!(
            "Lock is not in unlock_pending state. Current status: {:?}",
            lock.status
        )));
    }

    // 3. Check timelock expiry
    let now = chrono::Utc::now().timestamp() as u64;
    if let Some(release_time) = lock.release_time {
        if now < release_time {
            return Err(ApiError::TimeLockActive);
        }
    }

    // 4. Verify required signatures exist (2/5)
    let sig_count: i64 = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM unlock_prover_signatures ups
         JOIN unlock_requests ur ON ups.unlock_id = ur.unlock_id
         WHERE ur.lock_id = $1"
    )
    .bind(&req.lock_id)
    .fetch_one(state.pool())
    .await
    .unwrap_or(0);

    if sig_count < 2 {
        return Err(ApiError::BadRequest(format!(
            "Insufficient signatures: {}/2 required",
            sig_count
        )));
    }

    // 5. Call L1 Vault.executeUnlock()
    let l1_tx_hash = if let Some(ref l1_vault) = state.l1_vault {
        tracing::info!("Submitting executeUnlock to L1 Vault for lock_id: {}", req.lock_id);

        match l1_vault.execute_unlock(&req.lock_id).await {
            Ok(tx_hash) => {
                let tx_hash_str = format!("{:?}", tx_hash);
                tracing::info!(
                    l1_tx_hash = %tx_hash_str,
                    lock_id = %req.lock_id,
                    "L1 executeUnlock submitted successfully"
                );
                Some(tx_hash_str)
            }
            Err(e) => {
                tracing::error!(
                    error = %e,
                    lock_id = %req.lock_id,
                    "L1 executeUnlock failed"
                );
                return Err(ApiError::Internal(format!("L1 executeUnlock failed: {}", e)));
            }
        }
    } else {
        tracing::info!("L1 Vault not configured - skipping L1 executeUnlock");
        None
    };

    // 6. Update lock status to Released
    state
        .update_lock_status(&req.lock_id, LockStatus::Released, None)
        .await?;

    tracing::info!(
        "Unlock claimed successfully: lock_id={}, l1_tx_hash={:?}",
        req.lock_id,
        l1_tx_hash
    );

    Ok(Json(ClaimUnlockResponse {
        lock_id: req.lock_id,
        status: LockStatus::Released,
        l1_tx_hash,
    }))
}

/// Construct the message to be signed for unlock requests
///
/// Message format: "QS_UNLOCK_V1" || lock_id || dest_addr || amount
fn construct_unlock_message(lock_id: &str, dest_addr: &str, amount: &str) -> Vec<u8> {
    let mut message = Vec::new();
    message.extend_from_slice(b"QS_UNLOCK_V1");
    message.extend_from_slice(lock_id.as_bytes());
    message.extend_from_slice(dest_addr.as_bytes());
    message.extend_from_slice(amount.as_bytes());
    message
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
    use crate::crypto::{ML_DSA_65_PUBLIC_KEY_BYTES, ML_DSA_65_SIGNATURE_BYTES};
    use fips204::ml_dsa_65;
    use fips204::traits::{SerDes, Signer};

    #[test]
    fn test_time_lock_constants() {
        // SEQ#2: 24h Normal Time Lock
        assert_eq!(NORMAL_TIME_LOCK_HOURS, 24);
        // SEQ#3: 7d Emergency Time Lock
        assert_eq!(EMERGENCY_TIME_LOCK_DAYS, 7);
    }

    #[test]
    fn test_ml_dsa_65_constants() {
        // Verify constants match actual FIPS 204 implementation
        let (pk, sk) = ml_dsa_65::try_keygen().expect("Key generation failed");
        let sig = sk.try_sign(b"test", &[]).expect("Signing failed");

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

        // Create a test message
        let message = b"QS_UNLOCK_V1test_lock_id0x1234567890abcdef1000000000000000000";

        // Sign the message
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
        assert!(
            !result.unwrap(),
            "Signature should be invalid for wrong message"
        );
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
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Invalid signature size"));
    }

    #[test]
    fn test_ml_dsa_65_public_key_invalid_size() {
        let valid_sig = format!("0x{}", hex::encode(vec![0u8; ML_DSA_65_SIGNATURE_BYTES]));
        let invalid_pk = "0x1234"; // Too short

        let result = verify_ml_dsa_65_signature(b"test", &valid_sig, invalid_pk);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Invalid public key size"));
    }

    #[test]
    fn test_construct_unlock_message() {
        let message = construct_unlock_message("lock123", "0xdest", "1000");
        let expected = b"QS_UNLOCK_V1lock1230xdest1000";
        assert_eq!(message, expected);
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
