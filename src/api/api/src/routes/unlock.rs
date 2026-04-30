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

use axum::{Extension, Json};
use sha3::{Digest, Sha3_256};

use bigdecimal::BigDecimal;
use std::str::FromStr;

use crate::{
    crypto::verify_ml_dsa_65_signature,
    error::ApiError,
    services::AppState,
    types::{ClaimUnlockRequest, ClaimUnlockResponse, EmergencyUnlockResponse, LockStatus, UnlockRequest, UnlockResponse, UnlockStatus},
};

// Time-lock values are now config-driven (`security.normal_time_lock_hours` /
// `security.emergency_time_lock_days`), not hardcoded constants. This closes the
// split-brain where unlock.rs used 24/7 while observer.rs read from config.
// A production-guard in config.rs enforces minimum values (>= 1h / >= 1d) on
// any non-local chain so DEMO values (0) cannot leak into production.

// ============================================================================
// Prover pool validation (C-1 fix: no more silent 0x...0002 fallback)
// ============================================================================

/// Validate that enough active provers exist to satisfy the 2-of-N SEQUENCES
/// requirement. Returns `ApiError::InsufficientProvers` if not.
///
/// Previously the call site fell back to a hardcoded `0x...0002` placeholder
/// address, which let unlocks appear to succeed but could never collect valid
/// signatures — a classic silent-failure pattern.
fn validate_prover_count(active_count: usize) -> Result<(), ApiError> {
    if active_count < 2 {
        return Err(ApiError::InsufficientProvers { active: active_count });
    }
    Ok(())
}

/// Convert a config `normal_time_lock_hours` / `emergency_time_lock_days` value
/// into a timestamp offset in seconds. Extracted for test coverage.
fn release_offset_seconds(hours: u64) -> u64 {
    hours * 3600
}

// ============================================================================
// Input validation helpers (fail-fast on invalid user input)
//
// Previously these sites used `unwrap_or_default()` which silently converted
// invalid hex / amount strings to empty bytes / zero, allowing garbage to
// reach the database. That is a silent-failure anti-pattern: every invalid
// input MUST return ApiError::InvalidRequest (HTTP 400), never silently
// succeed. See .claude/agents/silent-failure-hunter.md.
// ============================================================================

/// Parse a hex-encoded field (optionally prefixed with `0x`) into raw bytes.
///
/// Returns `ApiError::InvalidRequest` on any failure:
/// - Empty string
/// - Non-hex characters
/// - Odd number of hex digits
fn parse_hex_field(input: &str, field: &str) -> Result<Vec<u8>, ApiError> {
    if input.is_empty() {
        return Err(ApiError::InvalidRequest(format!(
            "{} must not be empty",
            field
        )));
    }
    let stripped = input.trim_start_matches("0x");
    if stripped.is_empty() {
        return Err(ApiError::InvalidRequest(format!(
            "{} must not be empty",
            field
        )));
    }
    hex::decode(stripped).map_err(|e| {
        ApiError::InvalidRequest(format!("invalid hex in {}: {}", field, e))
    })
}

/// Parse an amount string (wei, base-10 integer) into a BigDecimal.
///
/// Returns `ApiError::InvalidRequest` on any failure:
/// - Empty string
/// - Non-numeric characters
/// - Negative values (amounts are always non-negative)
fn parse_amount(input: &str) -> Result<BigDecimal, ApiError> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ApiError::InvalidRequest(
            "amount must not be empty".to_string(),
        ));
    }
    // Reject negative amounts before parsing (defence in depth).
    if trimmed.starts_with('-') {
        return Err(ApiError::InvalidRequest(
            "amount must be non-negative".to_string(),
        ));
    }
    BigDecimal::from_str(trimmed).map_err(|e| {
        ApiError::InvalidRequest(format!("invalid amount: {}", e))
    })
}

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
    // Err(e) (malformed input) is never bypassed by skip_signature_verification.
    // The skip flag is for "users don't have real ML-DSA keys yet" (testnet
    // beta), not for "we accept garbage input."
    let message = construct_unlock_message(&req.lock_id, &req.dest_addr, &req.amount);
    let sig_result = verify_ml_dsa_65_signature(&message, &req.sig_dilithium, &lock.user_public_key);
    match sig_result {
        Ok(true) => {
            tracing::info!("ML-DSA-65 signature verified (NIST FIPS 204 compliant)");
        }
        Ok(false) => {
            if state.config().security.skip_signature_verification {
                tracing::warn!("SECURITY: ML-DSA-65 signature verification failed, skip_signature_verification=true");
            } else {
                return Err(ApiError::InvalidSignature(
                    "ML-DSA-65 (FIPS 204) verification failed".into(),
                ));
            }
        }
        Err(e) => {
            return Err(ApiError::InvalidSignature(
                format!("ML-DSA-65 verification error: {}", e),
            ));
        }
    }

    // 4. Compute SR_1 using SHA3-256 (NOT keccak256)
    let sr_1 = compute_sr1(&lock.sr_0, &req);

    // 5. Generate unlock_id
    let unlock_id = generate_unlock_id(&req.lock_id, &sr_1);

    // 6. Calculate release time using config (H-2 fix: was hardcoded 24h).
    //    Production guard in config::enforce_production_guards() ensures
    //    `normal_time_lock_hours >= 1` on any non-local chain.
    let time_lock_hours = state.config().security.normal_time_lock_hours;
    let now = chrono::Utc::now().timestamp() as u64;
    let release_time = now + release_offset_seconds(time_lock_hours);

    // 6b. Storage Migration: INSERT unlock_request into PostgreSQL (SM-001: PG first)
    {
        // Ensure user exists (FK constraint on unlock_requests.wallet_address)
        crate::db::UserRepository::ensure_exists(state.pool(), &lock.dest_addr).await?;

        // Fail-fast validation — never silently drop garbage into the DB.
        let amount_bd = parse_amount(&req.amount)?;
        let sig_bytes = parse_hex_field(&req.sig_dilithium, "sig_dilithium")?;
        let dest_bytes = parse_hex_field(&req.dest_addr, "dest_addr")?;
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
    //
    // C-1 fix: fail-fast instead of falling back to `0x...0002`. If fewer than
    // 2 active provers exist, the spec cannot be satisfied and we must stop.
    let active_provers = crate::db::ProverRepository::list_provers(
        state.db.pool(), Some("active"), None, 0, 100,
    ).await?;
    let prover_addresses: Vec<String> = active_provers.iter()
        .map(|p| p.prover_id.clone())
        .collect();

    validate_prover_count(prover_addresses.len()).map_err(|e| {
        tracing::error!(
            active = prover_addresses.len(),
            "Prover pool degraded: cannot satisfy 2-of-N signing threshold"
        );
        e
    })?;
    let selected_provers = state.vrf.select_provers(&random_value, &prover_addresses);

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
        time_lock_hours,
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
    // Err(e) (malformed input) is never bypassed by skip_signature_verification.
    // The skip flag is for "users don't have real ML-DSA keys yet" (testnet
    // beta), not for "we accept garbage input."
    let message = construct_unlock_message(&req.lock_id, &req.dest_addr, &req.amount);
    let sig_result = verify_ml_dsa_65_signature(&message, &req.sig_dilithium, &lock.user_public_key);
    match sig_result {
        Ok(true) => {
            tracing::info!("ML-DSA-65 signature verified (NIST FIPS 204 compliant)");
        }
        Ok(false) => {
            if state.config().security.skip_signature_verification {
                tracing::warn!("SECURITY: ML-DSA-65 signature verification failed, skip_signature_verification=true");
            } else {
                return Err(ApiError::InvalidSignature(
                    "ML-DSA-65 (FIPS 204) verification failed".into(),
                ));
            }
        }
        Err(e) => {
            return Err(ApiError::InvalidSignature(
                format!("ML-DSA-65 verification error: {}", e),
            ));
        }
    }

    // 4. Compute SR_1 using SHA3-256 (NOT keccak256)
    let sr_1 = compute_sr1(&lock.sr_0, &req);

    // 5. Generate unlock_id
    let unlock_id = generate_unlock_id(&req.lock_id, &sr_1);

    // 6. Calculate release time using config (H-2 fix: was hardcoded 7d).
    //    Production guard enforces `emergency_time_lock_days >= 1` on non-local
    //    chains so DEMO values (0) cannot leak into production.
    let time_lock_days = state.config().security.emergency_time_lock_days;
    let now = chrono::Utc::now().timestamp() as u64;
    let release_time = now + release_offset_seconds(time_lock_days * 24);

    // 7. Calculate emergency bond: MAX(0.5 ETH, amount × 5%)
    let bond_required = calculate_emergency_bond(&req.amount);

    // 7b. Storage Migration: INSERT emergency unlock_request into PostgreSQL (SM-001: PG first)
    {
        // Ensure user exists (FK constraint on unlock_requests.wallet_address)
        crate::db::UserRepository::ensure_exists(state.pool(), &lock.dest_addr).await?;

        // Fail-fast validation — never silently drop garbage into the DB.
        let amount_bd = parse_amount(&req.amount)?;
        // bond_required comes from calculate_emergency_bond() which produces a
        // valid decimal string, but validate it anyway as defence in depth.
        let bond_bd = parse_amount(&bond_required)?;
        let sig_bytes = parse_hex_field(&req.sig_dilithium, "sig_dilithium")?;
        let dest_bytes = parse_hex_field(&req.dest_addr, "dest_addr")?;
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
        time_lock_days,
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

    // ========================================================================
    // C-1 regression: prover count validation
    // ========================================================================

    #[test]
    fn test_validate_prover_count_rejects_zero() {
        match validate_prover_count(0) {
            Err(ApiError::InsufficientProvers { active }) => assert_eq!(active, 0),
            other => panic!("expected InsufficientProvers(0), got {:?}", other),
        }
    }

    #[test]
    fn test_validate_prover_count_rejects_one() {
        // Previously the code "degraded" to 1 prover. Spec says 2-of-N, so
        // 1 is a violation and must error.
        match validate_prover_count(1) {
            Err(ApiError::InsufficientProvers { active }) => assert_eq!(active, 1),
            other => panic!("expected InsufficientProvers(1), got {:?}", other),
        }
    }

    #[test]
    fn test_validate_prover_count_accepts_two() {
        validate_prover_count(2).expect("2 provers must be accepted");
    }

    #[test]
    fn test_validate_prover_count_accepts_five() {
        validate_prover_count(5).expect("5 provers must be accepted");
    }

    // ========================================================================
    // H-2 regression: release_offset_seconds math
    // ========================================================================

    #[test]
    fn test_release_offset_seconds_zero_hours() {
        assert_eq!(release_offset_seconds(0), 0);
    }

    #[test]
    fn test_release_offset_seconds_normal_24h() {
        // 24h * 3600 = 86400s
        assert_eq!(release_offset_seconds(24), 86400);
    }

    #[test]
    fn test_release_offset_seconds_emergency_7d() {
        // 7d * 24h * 3600s = 604800s
        assert_eq!(release_offset_seconds(7 * 24), 604800);
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

    // ========================================================================
    // Input validation tests (silent-failure-hunter regression suite)
    //
    // These tests enforce fail-fast behavior on invalid user input.
    // Previously `unwrap_or_default()` silently converted garbage to empty
    // bytes / zero — a classic silent failure pattern. Every case below MUST
    // return ApiError::InvalidRequest, never silently succeed.
    // ========================================================================

    #[test]
    fn test_parse_hex_field_accepts_valid_hex() {
        let out = parse_hex_field("0x1234abcd", "sig_dilithium")
            .expect("valid hex must parse");
        assert_eq!(out, vec![0x12, 0x34, 0xab, 0xcd]);
    }

    #[test]
    fn test_parse_hex_field_accepts_no_prefix() {
        let out = parse_hex_field("1234abcd", "sig_dilithium")
            .expect("valid hex without 0x must parse");
        assert_eq!(out, vec![0x12, 0x34, 0xab, 0xcd]);
    }

    #[test]
    fn test_parse_hex_field_rejects_invalid_hex() {
        let err = parse_hex_field("0xZZZZ", "dest_addr")
            .expect_err("invalid hex must be rejected");
        match err {
            ApiError::InvalidRequest(msg) => {
                assert!(msg.contains("dest_addr"), "error must name the field: {}", msg);
            }
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_hex_field_rejects_odd_length() {
        let err = parse_hex_field("0x123", "sig_dilithium")
            .expect_err("odd-length hex must be rejected");
        match err {
            ApiError::InvalidRequest(msg) => {
                assert!(msg.contains("sig_dilithium"), "error must name the field: {}", msg);
            }
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_hex_field_rejects_empty() {
        // Empty string is not an acceptable hex input for required fields
        let err = parse_hex_field("", "dest_addr")
            .expect_err("empty string must be rejected");
        match err {
            ApiError::InvalidRequest(msg) => {
                assert!(msg.contains("dest_addr"), "error must name the field: {}", msg);
            }
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_amount_accepts_valid_wei() {
        let bd = parse_amount("1000000000000000000")
            .expect("valid wei amount must parse");
        assert_eq!(bd.to_string(), "1000000000000000000");
    }

    #[test]
    fn test_parse_amount_rejects_garbage() {
        let err = parse_amount("not-a-number")
            .expect_err("garbage amount must be rejected");
        match err {
            ApiError::InvalidRequest(msg) => {
                assert!(msg.contains("amount"), "error must mention amount: {}", msg);
            }
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_amount_rejects_empty() {
        let err = parse_amount("")
            .expect_err("empty amount must be rejected");
        match err {
            ApiError::InvalidRequest(msg) => {
                assert!(msg.contains("amount"), "error must mention amount: {}", msg);
            }
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }

    #[test]
    fn test_parse_amount_rejects_negative() {
        // Negative amounts are never valid for unlock requests
        let err = parse_amount("-1")
            .expect_err("negative amount must be rejected");
        match err {
            ApiError::InvalidRequest(msg) => {
                assert!(msg.contains("amount"), "error must mention amount: {}", msg);
            }
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }
}
