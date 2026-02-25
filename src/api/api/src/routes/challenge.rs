//! Challenge API implementation
//!
//! Implements Sequence #4: Challenge + Slashing
//! - Submit challenge against pending unlock
//! - Submit defense by Prover
//! - Get challenge status
//! - Auto-resolve after defense deadline
//!
//! ## CP-4 Compliance
//! - Slashing mechanism exists and cannot be removed
//! - Quadratic slashing: N^2 x 10%
//! - Distribution: 60% Challenger, 20% Insurance, 20% Burn
//!
//! ## SEQUENCES #4 Reference
//! - #4.1: Monitor bot detects anomaly
//! - #4.2: Challenger submits challenge with bond
//! - #4.3: Bond = MAX(0.1 ETH, amount x 1%)
//! - #4.4: Defense period = 48 hours
//! - #4.5: Prover submits defense
//! - #4.6: Auto-resolve after deadline
//! - #4.7: Quadratic slashing if valid
//! - #4.8: Distribution to challenger/insurance/burn

use std::sync::Arc;

use axum::{
    extract::Path,
    Extension, Json,
};
use sha3::{Digest, Sha3_256};

use crate::{
    error::ApiError,
    services::{AppState, SlashingService},
    types::{
        ChallengeRequest, ChallengeResponse, ChallengeStatus, ChallengeInfo,
        DefenseRequest, DefenseResponse, AutoResolveResponse, LockStatus,
        ProverStatus,
    },
};

/// Defense deadline: 48 hours after challenge
const DEFENSE_DEADLINE_HOURS: u64 = 48;

/// POST /v1/challenge
///
/// Submit a challenge against a pending unlock.
///
/// # Security
/// - Uses SHA3-256 for fraud proof hash (CP-1)
/// - Bond required: MAX(0.1 ETH, amount x 1%) (SEQUENCES #4.3)
/// - Defense period: 48 hours (SEQUENCES #4.4)
///
/// # SEQUENCES #4.2-4.4
pub async fn submit_challenge(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ChallengeRequest>,
) -> Result<Json<ChallengeResponse>, ApiError> {
    tracing::info!("Processing challenge for lock_id: {}", req.lock_id);

    // 1. Validate lock exists and is in pending unlock state
    let lock = state.get_lock(&req.lock_id).await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    if lock.status != LockStatus::UnlockPending
        && lock.status != LockStatus::EmergencyPending {
        return Err(ApiError::InvalidChallengeTarget(
            format!("Lock status is {:?}, expected UnlockPending or EmergencyPending", lock.status)
        ));
    }

    // 2. Calculate required bond: MAX(0.1 ETH, amount x 1%)
    let min_bond = "100000000000000000".to_string(); // 0.1 ETH in wei
    let percent_bond = calculate_percent_bond(&lock.amount, 1);
    let required_bond = max_bond(&min_bond, &percent_bond);

    if parse_amount(&req.bond) < parse_amount(&required_bond) {
        return Err(ApiError::InsufficientBond(format!(
            "Required: {}, Provided: {}", required_bond, req.bond
        )));
    }

    // 3. Compute fraud proof hash using SHA3-256 (CP-1 compliant)
    let fraud_proof_hash = compute_sha3_hash(&req.fraud_proof);

    // 4. Create challenge record
    let challenge_id = generate_challenge_id(&req.lock_id, &fraud_proof_hash);
    let now = chrono::Utc::now().timestamp() as u64;
    let defense_deadline = now + (DEFENSE_DEADLINE_HOURS * 3600);

    state.store_challenge(
        &challenge_id,
        &req.lock_id,
        &req.challenger,
        &fraud_proof_hash,
        &req.bond,
        defense_deadline,
    ).await?;

    // 5. Update lock status to CHALLENGED
    state.update_lock_status(&req.lock_id, LockStatus::Challenged, None).await?;

    tracing::info!(
        "Challenge submitted: {} for lock: {}, defense deadline: {}",
        challenge_id, req.lock_id, defense_deadline
    );

    Ok(Json(ChallengeResponse {
        challenge_id,
        lock_id: req.lock_id,
        fraud_proof_hash,
        bond: req.bond,
        defense_deadline,
        status: ChallengeStatus::Pending,
    }))
}

/// GET /v1/challenge/:lock_id
///
/// Get challenge information for a lock.
pub async fn get_challenge(
    Extension(state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<ChallengeInfo>, ApiError> {
    let challenge = state.get_challenge_by_lock_id(&lock_id).await?
        .ok_or_else(|| ApiError::ChallengeNotFound(lock_id))?;

    Ok(Json(challenge))
}

/// POST /v1/challenge/:lock_id/defense
///
/// Submit defense against a challenge (Prover only).
///
/// # Security
/// - Requires active Prover authentication
/// - Uses SHA3-256 for defense proof hash (CP-1)
///
/// # SEQUENCES #4.5
pub async fn submit_defense(
    Extension(state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
    Json(req): Json<DefenseRequest>,
) -> Result<Json<DefenseResponse>, ApiError> {
    tracing::info!("Processing defense for lock_id: {}", lock_id);

    // 1. Verify Prover is authenticated and active
    let prover = state.get_prover(&req.prover_id).await?
        .ok_or(ApiError::ProverNotFound(req.prover_id.clone()))?;

    if prover.status != ProverStatus::Active {
        return Err(ApiError::Unauthorized);
    }

    // 2. Get challenge
    let challenge = state.get_challenge_by_lock_id(&lock_id).await?
        .ok_or_else(|| ApiError::ChallengeNotFound(lock_id.clone()))?;

    // 3. Verify challenge is still pending
    if challenge.status != ChallengeStatus::Pending {
        return Err(ApiError::ChallengeAlreadyResolved);
    }

    // 4. Verify defense deadline not passed
    let now = chrono::Utc::now().timestamp() as u64;
    if now > challenge.defense_deadline {
        return Err(ApiError::DefenseDeadlineExpired);
    }

    // 5. Compute defense proof hash using SHA3-256 (CP-1 compliant)
    let defense_proof_hash = compute_sha3_hash(&req.defense_proof);

    // 6. Update challenge with defense
    state.submit_defense(
        &challenge.challenge_id,
        &req.prover_id,
        &defense_proof_hash,
    ).await?;

    tracing::info!(
        "Defense submitted for challenge: {} by prover: {}",
        challenge.challenge_id, req.prover_id
    );

    Ok(Json(DefenseResponse {
        challenge_id: challenge.challenge_id,
        lock_id,
        defender: req.prover_id,
        defense_proof_hash,
        status: ChallengeStatus::DefenseSubmitted,
    }))
}

/// POST /v1/challenge/:lock_id/auto-resolve
///
/// Auto-resolve challenge after defense deadline.
///
/// # SEQUENCES #4.6
/// Anyone can call this after the defense deadline has passed.
/// If no defense was submitted, challenger wins.
pub async fn auto_resolve(
    Extension(state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<AutoResolveResponse>, ApiError> {
    tracing::info!("Processing auto-resolve for lock_id: {}", lock_id);

    // 1. Get challenge
    let challenge = state.get_challenge_by_lock_id(&lock_id).await?
        .ok_or_else(|| ApiError::ChallengeNotFound(lock_id.clone()))?;

    // 2. Verify defense deadline has passed
    let now = chrono::Utc::now().timestamp() as u64;
    if now <= challenge.defense_deadline {
        return Err(ApiError::DefenseDeadlineNotPassed);
    }

    // 3. Check if already resolved
    if matches!(challenge.status, ChallengeStatus::ResolvedValid | ChallengeStatus::ResolvedInvalid) {
        return Err(ApiError::ChallengeAlreadyResolved);
    }

    // 4. Determine if challenge is valid (no defense submitted = challenger wins)
    let challenge_valid = challenge.defense_proof_hash.is_none();

    // 5. Calculate slashing amounts and execute slashing pipeline
    let (slash_amount, challenger_reward, insurance_amount, burn_amount) = if challenge_valid {
        // No defense submitted -> Challenger wins
        let lock = state.get_lock(&lock_id).await?
            .ok_or_else(|| ApiError::LockNotFound(lock_id.clone()))?;

        // Resolve prover_id from unlock request signatures
        // For now use the first known prover; in production this comes from VRF selection
        let prover_id = challenge.defender.clone()
            .unwrap_or_else(|| "unknown_prover".to_string());

        let colluding_count = 1u64; // Single prover by default

        // Execute full slashing pipeline via SlashingService
        let result = SlashingService::execute_slashing(
            state.pool(),
            &challenge.challenge_id,
            &prover_id,
            &lock.amount,
            colluding_count,
            state.l1_prover_registry.as_ref(),
            state.config.l1.slashing.l1_execution,
            &state.config.l1.staking.min_stake,
        ).await?;

        (result.total_slash, result.challenger_reward, result.insurance_amount, result.burn_amount)
    } else {
        // Defense was submitted -> Challenger loses bond
        let bond: u128 = challenge.bond.parse().unwrap_or(0);
        // Challenger loses bond, it goes to insurance
        ("0".to_string(), "0".to_string(), bond.to_string(), "0".to_string())
    };

    // 6. Update challenge status in dual-write (PG + Redis)
    state.resolve_challenge(
        &challenge.challenge_id,
        challenge_valid,
        &slash_amount,
        &challenger_reward,
        &insurance_amount,
        &burn_amount,
    ).await?;

    // 7. Update lock status
    let new_status = if challenge_valid { LockStatus::Slashed } else { LockStatus::UnlockPending };
    state.update_lock_status(&lock_id, new_status, None).await?;

    tracing::info!(
        "Challenge auto-resolved: {} - valid: {}, slashed: {}, challenger reward: {}",
        challenge.challenge_id, challenge_valid, slash_amount, challenger_reward
    );

    Ok(Json(AutoResolveResponse {
        challenge_id: challenge.challenge_id,
        lock_id,
        challenge_valid,
        slash_amount,
        challenger_reward,
        insurance_amount,
        burn_amount,
        status: if challenge_valid { ChallengeStatus::ResolvedValid } else { ChallengeStatus::ResolvedInvalid },
    }))
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Compute SHA3-256 hash (CP-1 compliant - NO keccak256)
fn compute_sha3_hash(data: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(data.as_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

/// Generate challenge ID from lock_id and fraud proof hash
fn generate_challenge_id(lock_id: &str, fraud_proof_hash: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(lock_id.as_bytes());
    hasher.update(fraud_proof_hash.as_bytes());
    hasher.update(&chrono::Utc::now().timestamp().to_be_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(&result[..16]))
}

/// Calculate percent bond (amount x percent / 100)
fn calculate_percent_bond(amount: &str, percent: u64) -> String {
    let amount_val = parse_amount(amount);
    let bond = amount_val * percent as u128 / 100;
    bond.to_string()
}

/// Return max of two bond values
fn max_bond(a: &str, b: &str) -> String {
    let a_val = parse_amount(a);
    let b_val = parse_amount(b);
    if a_val > b_val { a.to_string() } else { b.to_string() }
}

/// Parse amount string to u128
fn parse_amount(amount: &str) -> u128 {
    amount.parse().unwrap_or(0)
}

/// Calculate quadratic slash: N^2 x 10% of amount
/// SEQUENCES #4.7
fn calculate_quadratic_slash(n: u64, amount: &str) -> String {
    let amount_val = parse_amount(amount);
    let mut slash_percent = (n as u128) * (n as u128) * 10; // N^2 x 10%
    if slash_percent > 100 {
        slash_percent = 100; // Cap at 100%
    }
    let slash_amount = amount_val * slash_percent / 100;
    slash_amount.to_string()
}

/// Calculate distribution percentage
fn calculate_distribution(total: &str, percent: u128) -> String {
    let total_val = parse_amount(total);
    let amount = total_val * percent / 100;
    amount.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quadratic_slash_1_prover() {
        // 1^2 x 10% = 10%
        let amount = "1000000000000000000"; // 1 ETH
        let slash = calculate_quadratic_slash(1, amount);
        assert_eq!(slash, "100000000000000000"); // 0.1 ETH
    }

    #[test]
    fn test_quadratic_slash_2_provers() {
        // 2^2 x 10% = 40%
        let amount = "1000000000000000000"; // 1 ETH
        let slash = calculate_quadratic_slash(2, amount);
        assert_eq!(slash, "400000000000000000"); // 0.4 ETH
    }

    #[test]
    fn test_quadratic_slash_3_provers() {
        // 3^2 x 10% = 90%
        let amount = "1000000000000000000"; // 1 ETH
        let slash = calculate_quadratic_slash(3, amount);
        assert_eq!(slash, "900000000000000000"); // 0.9 ETH
    }

    #[test]
    fn test_quadratic_slash_4_provers_capped() {
        // 4^2 x 10% = 160% -> capped at 100%
        let amount = "1000000000000000000"; // 1 ETH
        let slash = calculate_quadratic_slash(4, amount);
        assert_eq!(slash, "1000000000000000000"); // 1 ETH (capped)
    }

    #[test]
    fn test_distribution_60_20_20() {
        let total = "1000000000000000000"; // 1 ETH
        assert_eq!(calculate_distribution(total, 60), "600000000000000000");
        assert_eq!(calculate_distribution(total, 20), "200000000000000000");
    }

    #[test]
    fn test_max_bond() {
        let a = "100000000000000000"; // 0.1 ETH
        let b = "50000000000000000";  // 0.05 ETH
        assert_eq!(max_bond(a, b), a);
        assert_eq!(max_bond(b, a), a);
    }

    #[test]
    fn test_sha3_hash() {
        let hash = compute_sha3_hash("test");
        assert!(hash.starts_with("0x"));
        assert_eq!(hash.len(), 66); // 0x + 64 hex chars
    }
}
