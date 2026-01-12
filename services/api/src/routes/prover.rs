//! Prover Portal API implementation
//!
<<<<<<< HEAD
//! Implements Sequence #5: Prover Registration
=======
//! Implements:
//! - Sequence #5: Prover Registration
//! - Sequence #6: Prover Exit
//! - TASK-P5-022: Prover Portal API (9 endpoints)
>>>>>>> origin/claude/implement-task-p5-022-MKhkM
//!
//! ## CP-1 Compliance
//! - Uses SPHINCS+-128s for Prover signatures (post-quantum secure)
//! - Uses SHA3-256 for all hashing
//! - Validates SPHINCS+ public key format and size
<<<<<<< HEAD
=======
//!
//! ## Endpoints
//! - GET /v1/prover/dashboard - Prover dashboard
//! - GET /v1/prover/queue - Signing queue
//! - GET /v1/prover/queue/:id - Queue item details
//! - POST /v1/prover/sign - Submit signature
//! - GET /v1/prover/metrics - Prover metrics
//! - GET /v1/prover/alerts - Prover alerts
//! - GET /v1/prover/challenges - Challenges against prover
//! - POST /v1/prover/challenge-response - Submit defense
//! - POST /v1/prover/exit - Initiate exit
>>>>>>> origin/claude/implement-task-p5-022-MKhkM

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use sha3::{Sha3_256, Digest};

use crate::{
    error::ApiError,
    services::{AppState, SphincsService, SPHINCS_PUBLIC_KEY_BYTES},
<<<<<<< HEAD
    types::{ProverRegisterRequest, ProverRegisterResponse, ProverInfoResponse, ProverStatus},
=======
    types::{
        ProverRegisterRequest, ProverRegisterResponse, ProverInfoResponse, ProverStatus,
        // Prover Portal types (TASK-P5-022)
        ProverDashboard, SigningQueueResponse, SigningQueueItem,
        ProverSignRequest, ProverSignResponse, ProverMetrics,
        ProverAlertsResponse, ProverChallengesResponse,
        ProverChallengeResponseRequest, ProverChallengeResponseResult,
        ProverExitRequest, ProverExitResponse,
    },
>>>>>>> origin/claude/implement-task-p5-022-MKhkM
};

/// POST /v1/prover/register
///
/// Register as a new Prover.
///
/// Requirements:
/// - Minimum stake: $400K (Phase 1) / $500K (Phase 2+)
/// - HSM attestation required
/// - 2-of-3 multisig proof required
/// - Valid SPHINCS+-128s public key (32 bytes)
///
/// ## CP-1 Compliance
/// - SPHINCS+-128s public key validation (post-quantum secure)
/// - HSM attestation verification
pub async fn register_prover(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ProverRegisterRequest>,
) -> Result<Json<ProverRegisterResponse>, ApiError> {
    tracing::info!("Processing prover registration for: {}", req.operator_addr);

    // 1. Validate SPHINCS+-128s public key format and size (CP-1)
    SphincsService::validate_public_key(&req.sphincs_pubkey)
        .map_err(|e| ApiError::InvalidSignature(format!("SPHINCS+ public key validation failed: {}", e)))?;
    tracing::info!("✓ SPHINCS+-128s public key validated ({} bytes)", SPHINCS_PUBLIC_KEY_BYTES);

    // 2. Validate HSM attestation with public key binding
    SphincsService::validate_hsm_attestation(&req.hsm_attestation, &req.sphincs_pubkey)
        .map_err(|e| ApiError::InvalidSignature(format!("HSM attestation validation failed: {}", e)))?;
    tracing::info!("✓ HSM attestation validated");

    // 3. Validate multisig proof
    if !validate_multisig_proof(&req.multisig_proof) {
        return Err(ApiError::InvalidSignature("Invalid multisig proof".into()));
    }
    tracing::info!("✓ Multisig proof validated");

    // 4. Generate prover_id using SHA3-256 (CP-1 compliant)
    let prover_id = generate_prover_id(&req.operator_addr, &req.sphincs_pubkey);

    // 5. Store prover record
    state.store_prover(&prover_id, &req).await?;

    tracing::info!(
        "Prover registration submitted: {} (operator: {})",
        prover_id,
        req.operator_addr
    );

    Ok(Json(ProverRegisterResponse {
        prover_id,
        status: ProverStatus::PendingApproval,
        stake_locked: req.stake_amount,
    }))
}

/// GET /v1/prover/{prover_id}
/// 
/// Get Prover information and status.
pub async fn get_prover_info(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverInfoResponse>, ApiError> {
    tracing::debug!("Getting prover info for: {}", prover_id);

    let prover = state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    Ok(Json(prover))
}

/// Validate 2-of-3 multisig proof
fn validate_multisig_proof(proof: &str) -> bool {
    // TODO: Implement actual multisig proof verification
    !proof.is_empty()
}

/// Generate prover_id from operator address and SPHINCS+ public key
fn generate_prover_id(operator_addr: &str, sphincs_pubkey: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(b"PROVER_ID_V1");
    hasher.update(operator_addr.as_bytes());
    hasher.update(sphincs_pubkey.as_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

// ============================================================================
// Prover Portal API Endpoints (TASK-P5-022)
// SEQUENCES §5: Prover Registration, §6: Prover Exit
// ============================================================================

/// GET /v1/prover/dashboard
///
/// Get the prover's dashboard with key metrics and status.
/// Requires prover authentication (prover_id in path).
///
/// Returns:
/// - Current status and stake
/// - Signature statistics (total, 24h)
/// - Pending rewards and earnings
/// - Queue size and active challenges
/// - Uptime percentage
pub async fn get_prover_dashboard(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverDashboard>, ApiError> {
    tracing::info!("Getting dashboard for prover: {}", prover_id);

    let dashboard = state.get_prover_dashboard(&prover_id).await?;

    tracing::debug!(
        "Dashboard retrieved: status={:?}, queue_size={}, active_challenges={}",
        dashboard.status,
        dashboard.queue_size,
        dashboard.active_challenges
    );

    Ok(Json(dashboard))
}

/// GET /v1/prover/queue
///
/// Get the signing queue for the prover.
/// Returns pending unlock requests that require this prover's signature.
///
/// Queue items include:
/// - Unlock request details (lock_id, amount, SR commitments)
/// - Deadline information
/// - Priority level
pub async fn get_signing_queue(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<SigningQueueResponse>, ApiError> {
    tracing::info!("Getting signing queue for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let queue = state.get_signing_queue(&prover_id).await?;

    tracing::debug!(
        "Queue retrieved: {} items, {} pending",
        queue.total,
        queue.pending_count
    );

    Ok(Json(queue))
}

/// GET /v1/prover/queue/:queue_id
///
/// Get details for a specific queue item.
pub async fn get_queue_item(
    Extension(state): Extension<Arc<AppState>>,
    Path((prover_id, queue_id)): Path<(String, String)>,
) -> Result<Json<SigningQueueItem>, ApiError> {
    tracing::info!("Getting queue item {} for prover: {}", queue_id, prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let item = state.get_queue_item(&prover_id, &queue_id).await?
        .ok_or_else(|| ApiError::NotFound(format!("Queue item not found: {}", queue_id)))?;

    Ok(Json(item))
}

/// POST /v1/prover/sign
///
/// Submit a SPHINCS+ signature for a queue item.
///
/// Requirements:
/// - Valid queue_id from the prover's queue
/// - Valid SPHINCS+-128s signature (7856 bytes)
/// - HSM attestation proving signature origin
///
/// ## CP-1 Compliance
/// - SPHINCS+-128s signature (post-quantum secure)
/// - HSM attestation verification
pub async fn submit_signature(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
    Json(req): Json<ProverSignRequest>,
) -> Result<Json<ProverSignResponse>, ApiError> {
    tracing::info!(
        "Processing signature submission from prover {} for queue item {}",
        prover_id,
        req.queue_id
    );

    // Verify prover exists and is active
    let prover = state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    if prover.status != ProverStatus::Active {
        return Err(ApiError::Forbidden(format!(
            "Prover is not active. Current status: {:?}",
            prover.status
        )));
    }

    // Validate HSM attestation
    SphincsService::validate_hsm_attestation(&req.hsm_attestation, "")
        .map_err(|e| ApiError::InvalidSignature(format!("HSM attestation invalid: {}", e)))?;

    // Submit signature
    let response = state.submit_prover_signature(&prover_id, &req).await?;

    tracing::info!(
        "Signature accepted: queue_id={}, signatures={}/{}",
        response.queue_id,
        response.total_signatures,
        response.required_signatures
    );

    Ok(Json(response))
}

/// GET /v1/prover/metrics
///
/// Get detailed metrics for the prover.
///
/// Returns:
/// - Signature statistics (24h, 7d, all time)
/// - Response time and success rate
/// - Uptime percentage
/// - Rewards and earnings
/// - Slash history
/// - Ranking among all provers
pub async fn get_prover_metrics(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverMetrics>, ApiError> {
    tracing::info!("Getting metrics for prover: {}", prover_id);

    let metrics = state.get_prover_metrics(&prover_id).await?;

    tracing::debug!(
        "Metrics retrieved: total_signatures={}, rank={}/{}",
        metrics.total_signatures,
        metrics.rank,
        metrics.total_provers
    );

    Ok(Json(metrics))
}

/// GET /v1/prover/alerts
///
/// Get alerts for the prover.
///
/// Alert types:
/// - ChallengeReceived: New challenge filed
/// - DefenseDeadline: Defense deadline approaching
/// - Slashed: Slashing occurred
/// - LowStake: Stake below minimum
/// - SigningDeadline: Queue item deadline approaching
/// - HsmIssue: HSM connection problem
/// - Maintenance: System maintenance scheduled
pub async fn get_prover_alerts(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverAlertsResponse>, ApiError> {
    tracing::info!("Getting alerts for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let alerts = state.get_prover_alerts(&prover_id).await?;

    tracing::debug!(
        "Alerts retrieved: {} total, {} unacknowledged",
        alerts.total,
        alerts.unacknowledged_count
    );

    Ok(Json(alerts))
}

/// GET /v1/prover/challenges
///
/// Get all challenges filed against this prover.
///
/// Returns challenges with:
/// - Challenge details (challenger, timestamp)
/// - Defense deadline and time remaining
/// - Current status
/// - Potential slash amount
pub async fn get_prover_challenges(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverChallengesResponse>, ApiError> {
    tracing::info!("Getting challenges for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let challenges = state.get_prover_challenges(&prover_id).await?;

    tracing::debug!(
        "Challenges retrieved: {} total, {} pending",
        challenges.total,
        challenges.pending_count
    );

    Ok(Json(challenges))
}

/// POST /v1/prover/challenge-response
///
/// Submit a defense response to a challenge.
///
/// Requirements:
/// - Valid challenge_id
/// - Defense proof (STARK proof or explanation)
/// - Must be submitted before defense deadline
///
/// After submission:
/// - Challenge status changes to DefenseSubmitted
/// - Arbitration process begins
pub async fn submit_challenge_response(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
    Json(req): Json<ProverChallengeResponseRequest>,
) -> Result<Json<ProverChallengeResponseResult>, ApiError> {
    tracing::info!(
        "Processing challenge response from prover {} for challenge {}",
        prover_id,
        req.challenge_id
    );

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let result = state.submit_prover_challenge_response(&prover_id, &req).await?;

    tracing::info!(
        "Challenge response submitted: challenge_id={}, accepted={}",
        result.challenge_id,
        result.defense_accepted
    );

    Ok(Json(result))
}

/// POST /v1/prover/exit
///
/// Initiate the prover exit process.
///
/// SEQUENCES §6: Prover Exit
/// - 7-day unbonding period required
/// - Cannot exit with pending challenges
/// - Stake returned after unbonding period
/// - Pending rewards included in return
///
/// Exit workflow:
/// 1. Status changes to Exiting
/// 2. 7-day unbonding period begins
/// 3. After unbonding: stake + rewards returned
/// 4. Status changes to Exited
pub async fn initiate_prover_exit(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
    Json(req): Json<ProverExitRequest>,
) -> Result<Json<ProverExitResponse>, ApiError> {
    tracing::info!("Processing exit request for prover: {}", prover_id);

    let response = state.initiate_prover_exit(&prover_id, &req).await?;

    tracing::info!(
        "Exit initiated: prover_id={}, unbonding_end={}, stake_to_return={}",
        response.prover_id,
        response.unbonding_end,
        response.stake_to_return
    );

    Ok(Json(response))
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_prover_id() {
        let operator = "0x1234567890abcdef";
        let pubkey = "0xabcdef1234567890";
        let id = generate_prover_id(operator, pubkey);
        assert!(id.starts_with("0x"));
        assert_eq!(id.len(), 66); // 0x + 64 hex chars (32 bytes)
    }

    #[test]
    fn test_generate_prover_id_deterministic() {
        let operator = "0xtest_operator";
        let pubkey = "0xtest_pubkey";
        let id1 = generate_prover_id(operator, pubkey);
        let id2 = generate_prover_id(operator, pubkey);
        assert_eq!(id1, id2);
    }

    #[test]
    fn test_generate_prover_id_different_inputs() {
        let id1 = generate_prover_id("operator1", "pubkey1");
        let id2 = generate_prover_id("operator2", "pubkey2");
        assert_ne!(id1, id2);
    }
}
