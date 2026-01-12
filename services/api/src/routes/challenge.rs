//! Challenge API implementation (SEQUENCES §4)
//!
//! Implements Challenge + Slashing flow for fraud prevention.

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use sha3::{Digest, Sha3_256};

use crate::{
    error::ApiError,
    services::AppState,
    types::{
        ChallengeRequest, ChallengeResponse, ChallengeStatus, ChallengeInfo,
        DefenseRequest, DefenseResponse, AutoResolveResponse, LockStatus,
    },
};

/// Defense deadline: 48 hours after challenge
const DEFENSE_DEADLINE_HOURS: u64 = 48;

/// POST /v1/challenge
pub async fn submit_challenge(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ChallengeRequest>,
) -> Result<Json<ChallengeResponse>, ApiError> {
    tracing::info!("Processing challenge for lock_id: {}", req.lock_id);

    let lock = state.get_lock(&req.lock_id).await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    if lock.status != LockStatus::UnlockPending {
        return Err(ApiError::InvalidChallengeTarget(
            format!("Lock status is {:?}, expected UnlockPending", lock.status)
        ));
    }

    let lock_amount: u128 = lock.amount.parse().unwrap_or(0);
    let min_bond = lock_amount / 1000;
    let provided_bond: u128 = req.bond.parse().unwrap_or(0);
    if provided_bond < min_bond {
        return Err(ApiError::InsufficientBond(
            format!("Minimum bond: {}, provided: {}", min_bond, provided_bond)
        ));
    }

    let mut hasher = Sha3_256::new();
    hasher.update(b"CHALLENGE_V1");
    hasher.update(req.lock_id.as_bytes());
    hasher.update(req.challenger.as_bytes());
    hasher.update(&chrono::Utc::now().timestamp().to_be_bytes());
    let challenge_id = format!("0x{}", hex::encode(hasher.finalize()));

    let mut proof_hasher = Sha3_256::new();
    proof_hasher.update(req.fraud_proof.as_bytes());
    let fraud_proof_hash = format!("0x{}", hex::encode(proof_hasher.finalize()));

    let now = chrono::Utc::now().timestamp() as u64;
    let defense_deadline = now + (DEFENSE_DEADLINE_HOURS * 3600);

    state.store_challenge(&challenge_id, &req.lock_id, &req.challenger, &fraud_proof_hash, &req.bond, defense_deadline).await?;
    state.update_lock_status(&req.lock_id, LockStatus::Challenged, None).await?;

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
pub async fn get_challenge(
    Extension(state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<ChallengeInfo>, ApiError> {
    let challenge = state.get_challenge_by_lock_id(&lock_id).await?
        .ok_or_else(|| ApiError::ChallengeNotFound(lock_id))?;
    Ok(Json(challenge))
}

/// POST /v1/challenge/:lock_id/defense
pub async fn submit_defense(
    Extension(state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
    Json(req): Json<DefenseRequest>,
) -> Result<Json<DefenseResponse>, ApiError> {
    let challenge = state.get_challenge_by_lock_id(&lock_id).await?
        .ok_or_else(|| ApiError::ChallengeNotFound(lock_id.clone()))?;

    let now = chrono::Utc::now().timestamp() as u64;
    if now > challenge.defense_deadline {
        return Err(ApiError::DefenseDeadlineExpired);
    }
    if challenge.status != ChallengeStatus::Pending {
        return Err(ApiError::ChallengeAlreadyResolved);
    }

    let mut proof_hasher = Sha3_256::new();
    proof_hasher.update(req.defense_proof.as_bytes());
    let defense_proof_hash = format!("0x{}", hex::encode(proof_hasher.finalize()));

    state.submit_defense(&challenge.challenge_id, &req.prover_id, &defense_proof_hash).await?;

    Ok(Json(DefenseResponse {
        challenge_id: challenge.challenge_id,
        lock_id,
        defender: req.prover_id,
        defense_proof_hash,
        status: ChallengeStatus::DefenseSubmitted,
    }))
}

/// POST /v1/challenge/:lock_id/auto-resolve
pub async fn auto_resolve(
    Extension(state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<AutoResolveResponse>, ApiError> {
    let challenge = state.get_challenge_by_lock_id(&lock_id).await?
        .ok_or_else(|| ApiError::ChallengeNotFound(lock_id.clone()))?;

    let now = chrono::Utc::now().timestamp() as u64;
    if now <= challenge.defense_deadline {
        return Err(ApiError::DefenseDeadlineNotPassed);
    }
    if matches!(challenge.status, ChallengeStatus::ResolvedValid | ChallengeStatus::ResolvedInvalid) {
        return Err(ApiError::ChallengeAlreadyResolved);
    }

    let challenge_valid = challenge.defense_proof_hash.is_none();
    let bond: u128 = challenge.bond.parse().unwrap_or(0);
    let (slash_amount, challenger_reward, insurance_amount, burn_amount) = if challenge_valid {
        let slash = bond * 10;
        (slash, bond + (slash / 2), slash * 3 / 10, slash * 2 / 10)
    } else {
        (0u128, 0u128, bond, 0u128)
    };

    state.resolve_challenge(&challenge.challenge_id, challenge_valid, &slash_amount.to_string(), &challenger_reward.to_string(), &insurance_amount.to_string(), &burn_amount.to_string()).await?;

    let new_status = if challenge_valid { LockStatus::Slashed } else { LockStatus::UnlockPending };
    state.update_lock_status(&lock_id, new_status, None).await?;

    Ok(Json(AutoResolveResponse {
        challenge_id: challenge.challenge_id,
        lock_id,
        challenge_valid,
        slash_amount: slash_amount.to_string(),
        challenger_reward: challenger_reward.to_string(),
        insurance_amount: insurance_amount.to_string(),
        burn_amount: burn_amount.to_string(),
        status: if challenge_valid { ChallengeStatus::ResolvedValid } else { ChallengeStatus::ResolvedInvalid },
    }))
}
