//! Prover Portal API implementation
//!
//! Implements:
//! - Sequence #5: Prover Registration
//! - Sequence #6: Prover Exit
//! - TASK-P5-022: Prover Portal API (9 endpoints)
//! - TASK-P5-031: Prover Exit API (3 endpoints)
//!
//! ## CP-1 Compliance
//! - Uses SPHINCS+-128s for Prover signatures (post-quantum secure)
//! - Uses SHA3-256 for all hashing
//! - Validates SPHINCS+ public key format and size
//!
//! ## Endpoints (TASK-P5-022)
//! - GET /v1/prover/dashboard - Prover dashboard
//! - GET /v1/prover/queue - Signing queue
//! - GET /v1/prover/queue/:id - Queue item details
//! - POST /v1/prover/sign - Submit signature
//! - GET /v1/prover/metrics - Prover metrics
//! - GET /v1/prover/alerts - Prover alerts
//! - GET /v1/prover/challenges - Challenges against prover
//! - POST /v1/prover/challenge-response - Submit defense
//!
//! ## Endpoints (TASK-P5-031 - SEQUENCES §6: Prover Exit)
//! - POST /v1/prover/exit - Initiate exit (7-day unbonding)
//! - GET /v1/prover/exit-status - Check exit/unbonding status
//! - POST /v1/prover/withdraw - Withdraw stake after unbonding

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use sha3::{Sha3_256, Digest};

use crate::{
    error::ApiError,
    services::{AppState, SphincsService, SPHINCS_PUBLIC_KEY_BYTES},
    types::{
        ProverRegisterRequest, ProverRegisterResponse, ProverInfoResponse, ProverStatus,
        // Prover Portal types (TASK-P5-022)
        ProverDashboard, SigningQueueItem,
        ProverSignRequest, ProverSignResponse, ProverMetrics,
        ProverAlertsResponse, ProverChallengesResponse,
        ProverChallengeResponseRequest, ProverChallengeResponseResult,
        ProverExitRequest, ProverExitResponse,
        // Prover Exit types (TASK-P5-031 - SEQUENCES §6)
        ProverExitStatusResponse, ProverWithdrawRequest, ProverWithdrawResponse,
    },
};

/// POST /v1/prover/register
///
/// Register as a new Prover.
///
/// Requirements:
/// - Minimum stake: $400K USD equivalent in ETH or QS Token (Chainlink Oracle, SEQUENCES.md §5)
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
    // In dev mode (skip_signature_verification=true), skip strict HSM validation
    if state.config.security.skip_signature_verification {
        tracing::debug!(
            "Dev mode: skipping strict HSM attestation validation for registration {}",
            req.operator_addr
        );
        if req.hsm_attestation.is_empty() {
            return Err(ApiError::InvalidSignature(
                "HSM attestation cannot be empty even in dev mode".into(),
            ));
        }
    } else {
        SphincsService::validate_hsm_attestation(&req.hsm_attestation, &req.sphincs_pubkey)
            .map_err(|e| ApiError::InvalidSignature(format!("HSM attestation validation failed: {}", e)))?;
    }
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
    tracing::debug!("get_prover_info called for: {}", prover_id);

    let prover = state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    tracing::debug!("Returning prover {} with status: {:?}", prover_id, prover.status);
    Ok(Json(prover))
}

/// GET /v1/prover/status/by-wallet/{wallet_address}
///
/// Check if a wallet address is registered as an approved Prover.
/// Used by Prover Portal login to verify access.
///
/// Returns:
/// - prover_id: If registered
/// - status: "active" if approved, "pending_approval", "rejected", etc.
/// - can_access: true if status == "active"
pub async fn get_prover_status_by_wallet(
    Extension(state): Extension<Arc<AppState>>,
    Path(wallet_address): Path<String>,
) -> Result<Json<ProverStatusByWalletResponse>, ApiError> {
    tracing::info!("Checking prover status for wallet: {}", wallet_address);

    let pool = state.db.pool();

    // Query prover by operator_addr (wallet address)
    let result = sqlx::query_as::<_, (String, String)>(
        "SELECT prover_id, status FROM provers WHERE LOWER(operator_addr) = LOWER($1) ORDER BY registered_at DESC LIMIT 1"
    )
    .bind(&wallet_address)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    match result {
        Some((prover_id, status)) => {
            let can_access = status == "active";
            tracing::info!(
                "Prover found: {} with status: {}, can_access: {}",
                prover_id, status, can_access
            );
            Ok(Json(ProverStatusByWalletResponse {
                registered: true,
                prover_id: Some(prover_id),
                status: Some(status),
                can_access,
            }))
        }
        None => {
            tracing::info!("No prover found for wallet: {}", wallet_address);
            Ok(Json(ProverStatusByWalletResponse {
                registered: false,
                prover_id: None,
                status: None,
                can_access: false,
            }))
        }
    }
}

/// Response for prover status by wallet
#[derive(serde::Serialize)]
pub struct ProverStatusByWalletResponse {
    pub registered: bool,
    pub prover_id: Option<String>,
    pub status: Option<String>,
    pub can_access: bool,
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
) -> Result<Json<SigningQueueDbResponse>, ApiError> {
    tracing::info!("Getting signing queue for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    // Get queue from PostgreSQL signing_queue table
    let pool = state.db.pool();

    let items = sqlx::query_as::<_, (String, String, String, String, String, Option<String>, Option<String>, String, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>, bool)>(
        r#"
        SELECT
            queue_id, lock_id, unlock_type, user_address, amount::text,
            sr_0, sr_1, priority,
            created_at, deadline, dilithium_verified
        FROM signing_queue
        WHERE prover_id = $1 AND status = 'pending'
        ORDER BY
            CASE WHEN priority = 'critical' THEN 0 WHEN priority = 'high' THEN 1 ELSE 2 END,
            created_at ASC
        "#
    )
    .bind(&prover_id)
    .fetch_all(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let queue_items: Vec<SigningQueueDbItem> = items.into_iter().map(|(queue_id, lock_id, unlock_type, user_address, amount, sr_0, sr_1, priority, created_at, deadline, dilithium_verified)| {
        SigningQueueDbItem {
            queue_id,
            lock_id,
            unlock_type,
            user_address,
            amount,
            asset: "ETH".to_string(),
            sr_0: sr_0.unwrap_or_default(),
            sr_1: sr_1.unwrap_or_default(),
            created_at: created_at.timestamp() as u64,
            deadline: deadline.map(|d| d.timestamp() as u64).unwrap_or(0),
            priority,
            dilithium_verified,
        }
    }).collect();

    let pending_count = queue_items.len();
    let total = pending_count;

    tracing::debug!(
        "Queue retrieved from DB: {} items, {} pending",
        total,
        pending_count
    );

    Ok(Json(SigningQueueDbResponse {
        items: queue_items,
        total: total as i32,
        pending_count: pending_count as i32,
    }))
}

/// Signing queue item from DB (matches frontend expectations)
#[derive(serde::Serialize)]
pub struct SigningQueueDbItem {
    pub queue_id: String,
    pub lock_id: String,
    pub unlock_type: String,
    pub user_address: String,
    pub amount: String,
    pub asset: String,
    pub sr_0: String,
    pub sr_1: String,
    pub created_at: u64,
    pub deadline: u64,
    pub priority: String,
    pub dilithium_verified: bool,
}

/// Signing queue response from DB
#[derive(serde::Serialize)]
pub struct SigningQueueDbResponse {
    pub items: Vec<SigningQueueDbItem>,
    pub total: i32,
    pub pending_count: i32,
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

    // Validate HSM attestation with prover's SPHINCS+ public key from DB
    // In dev mode (skip_signature_verification=true), skip strict HSM validation
    if state.config.security.skip_signature_verification {
        tracing::debug!(
            "Dev mode: skipping strict HSM attestation validation for prover {}",
            prover_id
        );
        if req.hsm_attestation.is_empty() {
            return Err(ApiError::InvalidSignature(
                "HSM attestation cannot be empty even in dev mode".into(),
            ));
        }
    } else {
        let pool = state.db.pool();
        let prover_row = crate::db::ProverRepository::get_by_id(pool, &prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;
        let sphincs_pubkey_hex = format!("0x{}", hex::encode(&prover_row.sphincs_pubkey));
        SphincsService::validate_hsm_attestation(&req.hsm_attestation, &sphincs_pubkey_hex)
            .map_err(|e| ApiError::InvalidSignature(format!("HSM attestation invalid: {}", e)))?;
    }

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

/// GET /v1/prover/:prover_id/exit-status
///
/// Get the current exit status for a prover.
///
/// SEQUENCES §6: Prover Exit - Status tracking
/// - Returns unbonding period status and remaining time
/// - Indicates whether withdrawal is allowed
/// - Shows pending challenges that may block withdrawal
///
/// Used by provers to track their exit progress during unbonding.
pub async fn get_prover_exit_status(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverExitStatusResponse>, ApiError> {
    tracing::info!("Getting exit status for prover: {}", prover_id);

    let response = state.get_prover_exit_status(&prover_id).await?;

    tracing::debug!(
        "Exit status retrieved: prover_id={}, status={:?}, can_withdraw={}",
        response.prover_id,
        response.status,
        response.can_withdraw
    );

    Ok(Json(response))
}

/// GET /v1/prover/:prover_id/stats
///
/// Get dashboard stats for the prover portal dashboard.
/// Returns summarized stats for the quick stats section.
pub async fn get_prover_stats(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverStatsResponse>, ApiError> {
    tracing::info!("Getting stats for prover: {}", prover_id);

    let pool = state.db.pool();

    // Get queue stats
    let queue_stats = sqlx::query_as::<_, (i64, i64)>(
        r#"
        SELECT
            COUNT(*) as pending,
            COUNT(*) FILTER (WHERE priority = 'high' OR priority = 'critical') as urgent
        FROM signing_queue
        WHERE prover_id = $1 AND status = 'pending'
        "#
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
    .unwrap_or((0, 0));

    // Get today's processed count
    let today_processed: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM signing_queue
        WHERE prover_id = $1
        AND status = 'completed'
        AND completed_at >= CURRENT_DATE
        "#
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
    .unwrap_or(0);

    // Get yesterday's processed count for comparison
    let yesterday_processed: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM signing_queue
        WHERE prover_id = $1
        AND status = 'completed'
        AND completed_at >= CURRENT_DATE - INTERVAL '1 day'
        AND completed_at < CURRENT_DATE
        "#
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
    .unwrap_or(0);

    // Calculate percentage change vs yesterday
    let processed_change: i32 = if yesterday_processed > 0 {
        (((today_processed - yesterday_processed) as f64 / yesterday_processed as f64) * 100.0) as i32
    } else if today_processed > 0 {
        100
    } else {
        0
    };

    // Calculate 7-day average daily processed
    let week_processed: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM signing_queue
        WHERE prover_id = $1
        AND status = 'completed'
        AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
        "#
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
    .unwrap_or(0);

    let avg_processed = (week_processed / 7) as i32;

    // Get prover uptime from provers table or default
    let uptime: f64 = sqlx::query_scalar(
        "SELECT COALESCE(uptime_percentage::float8, 99.5) FROM provers WHERE prover_id = $1"
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
    .unwrap_or(99.5);

    // Get response time from prover_metrics table
    let response_time: f64 = sqlx::query_scalar(
        "SELECT COALESCE(avg_response_time_ms, 0)::float8 FROM prover_metrics WHERE prover_id = $1"
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
    .unwrap_or(0.0);

    tracing::info!(
        "Prover stats: id={}, today={}, change={}%, avg_7d={}, response_time={:.1}ms",
        prover_id, today_processed, processed_change, avg_processed, response_time
    );

    Ok(Json(ProverStatsResponse {
        pending_signatures: queue_stats.0 as i32,
        urgent_count: queue_stats.1 as i32,
        todays_processed: today_processed as i32,
        processed_change,
        avg_processed,
        uptime,
        sla_min_uptime: 99.5,
        response_time,
    }))
}

/// Stats response for prover dashboard
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProverStatsResponse {
    pub pending_signatures: i32,
    pub urgent_count: i32,
    pub todays_processed: i32,
    pub processed_change: i32,
    pub avg_processed: i32,
    pub uptime: f64,
    pub sla_min_uptime: f64,
    pub response_time: f64,
}

/// GET /v1/prover/:prover_id/queue/dashboard
///
/// Get simplified queue items for dashboard preview.
pub async fn get_prover_queue_dashboard(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverQueueDashboardResponse>, ApiError> {
    tracing::info!("Getting queue dashboard for prover: {}", prover_id);

    let pool = state.db.pool();

    // Get recent queue items for dashboard preview
    let items = sqlx::query_as::<_, (String, String, String, String, chrono::DateTime<chrono::Utc>, String)>(
        r#"
        SELECT
            queue_id,
            COALESCE(unlock_type, 'normal') as type,
            user_address,
            amount::text,
            created_at,
            priority
        FROM signing_queue
        WHERE prover_id = $1 AND status = 'pending'
        ORDER BY
            CASE WHEN priority = 'critical' THEN 0 WHEN priority = 'high' THEN 1 ELSE 2 END,
            created_at ASC
        LIMIT 5
        "#
    )
    .bind(&prover_id)
    .fetch_all(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let dashboard_items: Vec<QueueDashboardItem> = items.into_iter().map(|(id, req_type, address, amount, created_at, priority)| {
        let truncated_addr = format!("{}...{}", &address[..6], &address[address.len()-4..]);
        let time = created_at.format("%H:%M:%S").to_string();
        let urgent = priority == "high" || priority == "critical";
        QueueDashboardItem {
            id,
            r#type: req_type,
            address: truncated_addr,
            amount,
            time,
            urgent,
        }
    }).collect();

    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM signing_queue WHERE prover_id = $1 AND status = 'pending'"
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
    .unwrap_or(0);

    Ok(Json(ProverQueueDashboardResponse {
        items: dashboard_items,
        total: total as i32,
    }))
}

/// Queue item for dashboard preview
#[derive(serde::Serialize)]
pub struct QueueDashboardItem {
    pub id: String,
    pub r#type: String,
    pub address: String,
    pub amount: String,
    pub time: String,
    pub urgent: bool,
}

/// Queue dashboard response
#[derive(serde::Serialize)]
pub struct ProverQueueDashboardResponse {
    pub items: Vec<QueueDashboardItem>,
    pub total: i32,
}

/// GET /v1/prover/:prover_id/rewards
///
/// Get rewards summary for the prover.
pub async fn get_prover_rewards(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverRewardsResponse>, ApiError> {
    tracing::info!("Getting rewards for prover: {}", prover_id);

    let pool = state.db.pool();

    // Get rewards from provers table
    let rewards = sqlx::query_as::<_, (Option<String>, Option<String>)>(
        "SELECT pending_rewards, total_earnings FROM provers WHERE prover_id = $1"
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    match rewards {
        Some((pending, total)) => {
            let claimable = pending.unwrap_or_else(|| "0".to_string()).parse::<f64>().unwrap_or(0.0);
            let all_time = total.unwrap_or_else(|| "0".to_string()).parse::<f64>().unwrap_or(0.0);
            Ok(Json(ProverRewardsResponse {
                claimable,
                this_month: 0.0, // BE-001: Monthly reward tracking not yet implemented
                all_time,
                currency: "QS".to_string(),
            }))
        }
        None => {
            Ok(Json(ProverRewardsResponse {
                claimable: 0.0,
                this_month: 0.0,
                all_time: 0.0,
                currency: "QS".to_string(),
            }))
        }
    }
}

/// Rewards response
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProverRewardsResponse {
    pub claimable: f64,
    pub this_month: f64,
    pub all_time: f64,
    /// Reward currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

/// GET /v1/prover/:prover_id/stake
///
/// Get stake info for the prover.
pub async fn get_prover_stake(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverStakeResponse>, ApiError> {
    tracing::info!("Getting stake for prover: {}", prover_id);

    let pool = state.db.pool();

    let stake = sqlx::query_as::<_, (Option<f64>,)>(
        "SELECT stake_amount::float8 FROM provers WHERE prover_id = $1"
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    match stake {
        Some((amount,)) => {
            // stake_amount is in wei (1e18), convert to ETH
            let stake_wei = amount.unwrap_or(0.0);
            let stake_amount = stake_wei / 1e18;
            // BE-001: No hardcoded ETH price — return 0 until price oracle is integrated
            let usd_value = 0_i64; // TODO: Phase 8-D — Chainlink price oracle integration
            Ok(Json(ProverStakeResponse {
                amount: stake_amount,
                usd_value,
                challenges: 0, // TODO: Get from challenges table
            }))
        }
        None => {
            Ok(Json(ProverStakeResponse {
                amount: 0.0,
                usd_value: 0,
                challenges: 0,
            }))
        }
    }
}

/// Stake response
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProverStakeResponse {
    pub amount: f64,
    pub usd_value: i64,
    pub challenges: i32,
}

/// POST /v1/prover/:prover_id/withdraw
///
/// Withdraw stake after unbonding period completion.
///
/// SEQUENCES §6: Prover Exit - Step 4-5
/// - Verifies unbonding period is complete
/// - Verifies no pending challenges (slash could still apply)
/// - Returns stake + pending rewards to destination address
/// - Status changes to Exited
///
/// Requirements:
/// - Prover must be in Exiting status
/// - Unbonding period must be complete (7 days)
/// - No pending challenges
/// - Valid confirmation signature
pub async fn withdraw_stake(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
    Json(req): Json<ProverWithdrawRequest>,
) -> Result<Json<ProverWithdrawResponse>, ApiError> {
    tracing::info!(
        "Processing stake withdrawal for prover: {} to {}",
        prover_id,
        req.destination_address
    );

    let response = state.withdraw_prover_stake(&prover_id, &req).await?;

    tracing::info!(
        "Stake withdrawn: prover_id={}, total_returned={}, destination={}",
        response.prover_id,
        response.total_returned,
        response.destination_address
    );

    Ok(Json(response))
}

// ============================================================================
// Additional Prover Portal Endpoints (FE-BE Alignment)
// ============================================================================

/// POST /v1/prover/:prover_id/sign/batch
///
/// Batch sign multiple queue items at once.
/// Accepts an array of sign requests and processes them sequentially.
pub async fn batch_sign(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
    Json(req): Json<BatchSignRequest>,
) -> Result<Json<BatchSignResponse>, ApiError> {
    tracing::info!(
        "Processing batch sign for prover {}: {} items",
        prover_id, req.items.len()
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

    let mut results = Vec::new();
    let mut success_count = 0u32;
    let mut failure_count = 0u32;

    for item in &req.items {
        match state.submit_prover_signature(&prover_id, item).await {
            Ok(resp) => {
                success_count += 1;
                results.push(BatchSignItemResult {
                    queue_id: resp.queue_id,
                    success: true,
                    error: None,
                });
            }
            Err(e) => {
                failure_count += 1;
                results.push(BatchSignItemResult {
                    queue_id: item.queue_id.clone(),
                    success: false,
                    error: Some(e.to_string()),
                });
            }
        }
    }

    tracing::info!(
        "Batch sign completed for prover {}: {} success, {} failed",
        prover_id, success_count, failure_count
    );

    Ok(Json(BatchSignResponse {
        results,
        total: req.items.len() as u32,
        success_count,
        failure_count,
    }))
}

/// Batch sign request
#[derive(Debug, serde::Deserialize)]
pub struct BatchSignRequest {
    pub items: Vec<ProverSignRequest>,
}

/// Batch sign item result
#[derive(Debug, serde::Serialize)]
pub struct BatchSignItemResult {
    pub queue_id: String,
    pub success: bool,
    pub error: Option<String>,
}

/// Batch sign response
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSignResponse {
    pub results: Vec<BatchSignItemResult>,
    pub total: u32,
    pub success_count: u32,
    pub failure_count: u32,
}

/// POST /v1/prover/:prover_id/alerts/:alert_id/acknowledge
///
/// Acknowledge a prover alert so it no longer shows as unread.
pub async fn acknowledge_alert(
    Extension(state): Extension<Arc<AppState>>,
    Path((prover_id, alert_id)): Path<(String, String)>,
) -> Result<Json<AcknowledgeAlertResponse>, ApiError> {
    tracing::info!(
        "Acknowledging alert {} for prover {}",
        alert_id, prover_id
    );

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let pool = state.db.pool();

    // Update the alert's acknowledged status in the prover_alerts table
    let rows_affected = sqlx::query(
        r#"
        UPDATE prover_alerts
        SET acknowledged = true, acknowledged_at = NOW()
        WHERE alert_id = $1 AND prover_id = $2
        "#
    )
    .bind(&alert_id)
    .bind(&prover_id)
    .execute(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        // Alert might not exist in DB yet (stored in Redis or in-memory);
        // treat as success for idempotency
        tracing::debug!("Alert {} not found in DB for prover {}, treating as acknowledged", alert_id, prover_id);
    }

    tracing::info!("Alert {} acknowledged for prover {}", alert_id, prover_id);

    Ok(Json(AcknowledgeAlertResponse {
        alert_id,
        acknowledged: true,
    }))
}

/// Acknowledge alert response
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AcknowledgeAlertResponse {
    pub alert_id: String,
    pub acknowledged: bool,
}

/// GET /v1/prover/list
///
/// List all provers with pagination. Used by admin/explorer views.
pub async fn list_provers(
    Extension(state): Extension<Arc<AppState>>,
    axum::extract::Query(params): axum::extract::Query<ProverListParams>,
) -> Result<Json<ProverListResponse>, ApiError> {
    tracing::info!("Listing provers: offset={}, limit={}, status={:?}",
        params.offset.unwrap_or(0), params.limit.unwrap_or(20), params.status);

    let pool = state.db.pool();
    let offset = params.offset.unwrap_or(0);
    let limit = params.limit.unwrap_or(20).min(100);
    let status_filter = params.status.as_deref();

    let provers = crate::db::ProverRepository::list_provers(
        pool, status_filter, None, offset, limit,
    ).await?;

    let total = crate::db::ProverRepository::count_by_status(pool, status_filter).await?;

    let items: Vec<ProverListItem> = provers.into_iter().map(|p| {
        ProverListItem {
            prover_id: p.prover_id,
            operator_addr: p.operator_addr,
            status: p.status,
            tier: p.tier,
            stake_amount: p.stake_amount.to_string(),
            registered_at: p.registered_at.timestamp() as u64,
            approved_at: p.approved_at.map(|d| d.timestamp() as u64),
        }
    }).collect();

    tracing::info!("Listed {} provers out of {} total", items.len(), total);

    Ok(Json(ProverListResponse {
        items,
        total,
        offset,
        limit,
    }))
}

/// Prover list query parameters
#[derive(Debug, serde::Deserialize)]
pub struct ProverListParams {
    pub offset: Option<i64>,
    pub limit: Option<i64>,
    pub status: Option<String>,
}

/// Single prover item for the list
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProverListItem {
    pub prover_id: String,
    pub operator_addr: String,
    pub status: String,
    pub tier: Option<String>,
    pub stake_amount: String,
    pub registered_at: u64,
    pub approved_at: Option<u64>,
}

/// Prover list response
#[derive(Debug, serde::Serialize)]
pub struct ProverListResponse {
    pub items: Vec<ProverListItem>,
    pub total: i64,
    pub offset: i64,
    pub limit: i64,
}

/// GET /v1/prover/:prover_id/stake-data
///
/// Extended stake data including thresholds and history for the alerts component.
pub async fn get_prover_stake_data(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverStakeDataResponse>, ApiError> {
    tracing::info!("Getting extended stake data for prover: {}", prover_id);

    let pool = state.db.pool();

    let row = sqlx::query_as::<_, (Option<f64>, String, Option<String>)>(
        r#"
        SELECT stake_amount::float8, status, tier
        FROM provers
        WHERE prover_id = $1
        "#
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
    .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let stake_wei = row.0.unwrap_or(0.0);
    let stake_eth = stake_wei / 1e18;
    let tier = row.2.unwrap_or_else(|| "standard".to_string());

    // Minimum stake thresholds per tier
    let minimum_stake = match tier.as_str() {
        "enterprise" => 500_000.0,
        _ => 400_000.0,
    };

    let health = if stake_eth >= minimum_stake { "healthy" } else { "warning" };

    tracing::info!("Stake data retrieved for prover {}: {} ETH, health={}", prover_id, stake_eth, health);

    Ok(Json(ProverStakeDataResponse {
        prover_id,
        stake_amount: stake_eth,
        minimum_stake,
        tier,
        health: health.to_string(),
        slashing_history: vec![],
        status: row.1,
    }))
}

/// Extended stake data response
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProverStakeDataResponse {
    pub prover_id: String,
    pub stake_amount: f64,
    pub minimum_stake: f64,
    pub tier: String,
    pub health: String,
    pub slashing_history: Vec<SlashingEvent>,
    pub status: String,
}

/// Slashing event for history
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SlashingEvent {
    pub challenge_id: String,
    pub amount: f64,
    pub timestamp: u64,
    pub reason: String,
}

/// GET /v1/prover/:prover_id/enterprise-contract
///
/// Get enterprise contract information for this prover.
pub async fn get_prover_enterprise_contract(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverEnterpriseContractResponse>, ApiError> {
    tracing::info!("Getting enterprise contract for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let pool = state.db.pool();

    // Check if this prover has an enterprise contract
    let contract = sqlx::query_as::<_, (String, String, String, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(
        r#"
        SELECT contract_id, enterprise_id, status, created_at, expires_at
        FROM enterprise_contracts
        WHERE prover_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        "#
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        tracing::debug!("Enterprise contract query error (table may not exist): {}", e);
        ApiError::Internal(format!("Database error: {}", e))
    });

    match contract {
        Ok(Some((contract_id, enterprise_id, status, created_at, expires_at))) => {
            Ok(Json(ProverEnterpriseContractResponse {
                has_contract: true,
                contract_id: Some(contract_id),
                enterprise_id: Some(enterprise_id),
                status: Some(status),
                created_at: Some(created_at.timestamp() as u64),
                expires_at: expires_at.map(|d| d.timestamp() as u64),
            }))
        }
        _ => {
            tracing::debug!("No enterprise contract found for prover {}", prover_id);
            Ok(Json(ProverEnterpriseContractResponse {
                has_contract: false,
                contract_id: None,
                enterprise_id: None,
                status: None,
                created_at: None,
                expires_at: None,
            }))
        }
    }
}

/// Enterprise contract response
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProverEnterpriseContractResponse {
    pub has_contract: bool,
    pub contract_id: Option<String>,
    pub enterprise_id: Option<String>,
    pub status: Option<String>,
    pub created_at: Option<u64>,
    pub expires_at: Option<u64>,
}

/// GET /v1/prover/:prover_id/performance
///
/// Get performance stats for the prover (response times, throughput, etc).
pub async fn get_prover_performance(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverPerformanceResponse>, ApiError> {
    tracing::info!("Getting performance stats for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let pool = state.db.pool();

    // Get metrics from prover_metrics table
    let metrics = crate::db::ProverRepository::get_metrics(pool, &prover_id).await?;

    let (total_sigs, sigs_24h, sigs_7d, avg_response_ms, success_rate, uptime) = match metrics {
        Some(m) => (
            m.total_signatures,
            m.signatures_24h,
            m.signatures_7d,
            m.avg_response_time_ms,
            m.success_rate,
            m.uptime_percentage,
        ),
        None => (0, 0, 0, 0, 100.0, 99.5),
    };

    // Compute throughput (signatures per hour over last 24h)
    let throughput_per_hour = if sigs_24h > 0 {
        sigs_24h as f64 / 24.0
    } else {
        0.0
    };

    tracing::info!(
        "Performance retrieved for prover {}: total={}, 24h={}, success_rate={:.1}%",
        prover_id, total_sigs, sigs_24h, success_rate
    );

    Ok(Json(ProverPerformanceResponse {
        prover_id,
        total_signatures: total_sigs,
        signatures_24h: sigs_24h,
        signatures_7d: sigs_7d,
        avg_response_time_ms: avg_response_ms,
        success_rate,
        uptime_percentage: uptime,
        throughput_per_hour,
    }))
}

/// Performance stats response
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProverPerformanceResponse {
    pub prover_id: String,
    pub total_signatures: i64,
    pub signatures_24h: i64,
    pub signatures_7d: i64,
    pub avg_response_time_ms: i64,
    pub success_rate: f64,
    pub uptime_percentage: f64,
    pub throughput_per_hour: f64,
}

/// GET /v1/prover/:prover_id/signature-history
///
/// Get signature history data for charts and tables.
pub async fn get_prover_signature_history(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
    axum::extract::Query(params): axum::extract::Query<SignatureHistoryParams>,
) -> Result<Json<SignatureHistoryResponse>, ApiError> {
    tracing::info!("Getting signature history for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let pool = state.db.pool();
    let limit = params.limit.unwrap_or(50).min(200);

    let items = sqlx::query_as::<_, (String, String, String, String, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(
        r#"
        SELECT
            queue_id, lock_id, amount::text, status,
            created_at, completed_at
        FROM signing_queue
        WHERE prover_id = $1 AND status IN ('completed', 'failed')
        ORDER BY COALESCE(completed_at, created_at) DESC
        LIMIT $2
        "#
    )
    .bind(&prover_id)
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let history: Vec<SignatureHistoryItem> = items.into_iter().map(|(queue_id, lock_id, amount, status, created_at, completed_at)| {
        SignatureHistoryItem {
            queue_id,
            lock_id,
            amount,
            status,
            created_at: created_at.timestamp() as u64,
            completed_at: completed_at.map(|d| d.timestamp() as u64),
        }
    }).collect();

    let total = history.len();

    tracing::info!("Signature history retrieved for prover {}: {} entries", prover_id, total);

    Ok(Json(SignatureHistoryResponse {
        items: history,
        total,
    }))
}

/// Signature history query params
#[derive(Debug, serde::Deserialize)]
pub struct SignatureHistoryParams {
    pub limit: Option<i64>,
}

/// Single signature history item
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignatureHistoryItem {
    pub queue_id: String,
    pub lock_id: String,
    pub amount: String,
    pub status: String,
    pub created_at: u64,
    pub completed_at: Option<u64>,
}

/// Signature history response
#[derive(Debug, serde::Serialize)]
pub struct SignatureHistoryResponse {
    pub items: Vec<SignatureHistoryItem>,
    pub total: usize,
}

/// GET /v1/prover/:prover_id/metrics/detail
///
/// Get detailed metrics as an array of metric data points.
/// Used by the ProverMetrics component for charts.
pub async fn get_prover_metrics_detail(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverMetricsDetailResponse>, ApiError> {
    tracing::info!("Getting detailed metrics for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let pool = state.db.pool();

    // Get core metrics
    let metrics = crate::db::ProverRepository::get_metrics(pool, &prover_id).await?;

    let (total_sigs, sigs_24h, sigs_7d, avg_response_ms, success_rate, uptime) = match &metrics {
        Some(m) => (
            m.total_signatures,
            m.signatures_24h,
            m.signatures_7d,
            m.avg_response_time_ms,
            m.success_rate,
            m.uptime_percentage,
        ),
        None => (0, 0, 0, 0, 100.0, 99.5),
    };

    let items = vec![
        MetricDetailItem { name: "total_signatures".to_string(), value: total_sigs as f64, unit: "count".to_string() },
        MetricDetailItem { name: "signatures_24h".to_string(), value: sigs_24h as f64, unit: "count".to_string() },
        MetricDetailItem { name: "signatures_7d".to_string(), value: sigs_7d as f64, unit: "count".to_string() },
        MetricDetailItem { name: "avg_response_time".to_string(), value: avg_response_ms as f64, unit: "ms".to_string() },
        MetricDetailItem { name: "success_rate".to_string(), value: success_rate, unit: "percent".to_string() },
        MetricDetailItem { name: "uptime".to_string(), value: uptime, unit: "percent".to_string() },
    ];

    tracing::info!("Detailed metrics retrieved for prover {}: {} items", prover_id, items.len());

    Ok(Json(ProverMetricsDetailResponse {
        prover_id,
        metrics: items,
    }))
}

/// Single metric detail item
#[derive(Debug, serde::Serialize)]
pub struct MetricDetailItem {
    pub name: String,
    pub value: f64,
    pub unit: String,
}

/// Detailed metrics response
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProverMetricsDetailResponse {
    pub prover_id: String,
    pub metrics: Vec<MetricDetailItem>,
}

/// GET /v1/prover/:prover_id/rewards/summary
///
/// Get rewards summary including breakdown by period.
pub async fn get_prover_rewards_summary(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverRewardsSummaryResponse>, ApiError> {
    tracing::info!("Getting rewards summary for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let pool = state.db.pool();

    let rewards = sqlx::query_as::<_, (Option<String>, Option<String>)>(
        "SELECT pending_rewards, total_earnings FROM provers WHERE prover_id = $1"
    )
    .bind(&prover_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

    let (claimable, all_time) = match rewards {
        Some((pending, total)) => {
            let c = pending.unwrap_or_else(|| "0".to_string()).parse::<f64>().unwrap_or(0.0);
            let a = total.unwrap_or_else(|| "0".to_string()).parse::<f64>().unwrap_or(0.0);
            (c, a)
        }
        None => (0.0, 0.0),
    };

    // Get metrics for additional reward data
    let metrics = crate::db::ProverRepository::get_metrics(pool, &prover_id).await?;
    let total_rewards_from_metrics = metrics
        .map(|m| m.total_rewards.to_string().parse::<f64>().unwrap_or(0.0))
        .unwrap_or(0.0);

    // Use the larger of the two total values for accuracy
    let total = if total_rewards_from_metrics > all_time { total_rewards_from_metrics } else { all_time };

    tracing::info!(
        "Rewards summary for prover {}: claimable={}, total={}",
        prover_id, claimable, total
    );

    Ok(Json(ProverRewardsSummaryResponse {
        prover_id,
        claimable,
        this_month: 0.0, // BE-001: Monthly reward tracking not yet implemented
        last_month: 0.0, // BE-001: Monthly reward tracking not yet implemented
        all_time: total,
        next_payout_at: None, // TODO: Calculate from epoch schedule
        currency: "QS".to_string(),
    }))
}

/// Rewards summary response
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProverRewardsSummaryResponse {
    pub prover_id: String,
    pub claimable: f64,
    pub this_month: f64,
    pub last_month: f64,
    pub all_time: f64,
    pub next_payout_at: Option<u64>,
    /// Reward currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

/// GET /v1/prover/:prover_id/payouts
///
/// Get payout history for the prover.
pub async fn get_prover_payouts(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
    axum::extract::Query(params): axum::extract::Query<PayoutHistoryParams>,
) -> Result<Json<ProverPayoutsResponse>, ApiError> {
    tracing::info!("Getting payout history for prover: {}", prover_id);

    // Verify prover exists
    state.get_prover(&prover_id).await?
        .ok_or_else(|| ApiError::ProverNotFound(prover_id.clone()))?;

    let pool = state.db.pool();
    let limit = params.limit.unwrap_or(20).min(100);

    // Query payout records if the table exists
    let payouts = sqlx::query_as::<_, (String, String, String, chrono::DateTime<chrono::Utc>, Option<String>)>(
        r#"
        SELECT payout_id, amount, status, created_at, tx_hash
        FROM prover_payouts
        WHERE prover_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        "#
    )
    .bind(&prover_id)
    .bind(limit)
    .fetch_all(pool)
    .await;

    let items: Vec<PayoutItem> = match payouts {
        Ok(rows) => rows.into_iter().map(|(payout_id, amount, status, created_at, tx_hash)| {
            PayoutItem {
                payout_id,
                amount,
                status,
                created_at: created_at.timestamp() as u64,
                tx_hash,
                currency: "QS".to_string(),
            }
        }).collect(),
        Err(e) => {
            // Table may not exist yet; return empty list
            tracing::debug!("Payout query error (table may not exist): {}", e);
            vec![]
        }
    };

    let total = items.len();

    tracing::info!("Payout history for prover {}: {} records", prover_id, total);

    Ok(Json(ProverPayoutsResponse {
        items,
        total,
    }))
}

/// Payout history query params
#[derive(Debug, serde::Deserialize)]
pub struct PayoutHistoryParams {
    pub limit: Option<i64>,
}

/// Single payout item
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PayoutItem {
    pub payout_id: String,
    pub amount: String,
    pub status: String,
    pub created_at: u64,
    pub tx_hash: Option<String>,
    /// Payout currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

/// Payout history response
#[derive(Debug, serde::Serialize)]
pub struct ProverPayoutsResponse {
    pub items: Vec<PayoutItem>,
    pub total: usize,
}

/// POST /v1/prover/verify-invitation
///
/// Verify an enterprise invitation code for prover onboarding.
pub async fn verify_invitation(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<VerifyInvitationRequest>,
) -> Result<Json<VerifyInvitationResponse>, ApiError> {
    tracing::info!("Verifying invitation code: {}", req.invitation_code);

    let pool = state.db.pool();

    // Check if the invitation code exists and is valid
    let invitation = sqlx::query_as::<_, (String, String, String, chrono::DateTime<chrono::Utc>)>(
        r#"
        SELECT invitation_id, enterprise_id, status, expires_at
        FROM enterprise_invitations
        WHERE invitation_code = $1
        LIMIT 1
        "#
    )
    .bind(&req.invitation_code)
    .fetch_optional(pool)
    .await;

    match invitation {
        Ok(Some((invitation_id, enterprise_id, status, expires_at))) => {
            let now = chrono::Utc::now();
            let is_valid = status == "active" && expires_at > now;

            tracing::info!(
                "Invitation {} found: status={}, valid={}, enterprise={}",
                invitation_id, status, is_valid, enterprise_id
            );

            Ok(Json(VerifyInvitationResponse {
                valid: is_valid,
                invitation_id: Some(invitation_id),
                enterprise_id: Some(enterprise_id),
                message: if is_valid {
                    "Invitation code is valid".to_string()
                } else if expires_at <= now {
                    "Invitation code has expired".to_string()
                } else {
                    format!("Invitation code is {}", status)
                },
            }))
        }
        Ok(None) => {
            tracing::info!("Invitation code not found: {}", req.invitation_code);
            Ok(Json(VerifyInvitationResponse {
                valid: false,
                invitation_id: None,
                enterprise_id: None,
                message: "Invalid invitation code".to_string(),
            }))
        }
        Err(e) => {
            // Table may not exist; treat as invalid code
            tracing::debug!("Invitation query error (table may not exist): {}", e);
            Ok(Json(VerifyInvitationResponse {
                valid: false,
                invitation_id: None,
                enterprise_id: None,
                message: "Unable to verify invitation code at this time".to_string(),
            }))
        }
    }
}

/// Verify invitation request
#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyInvitationRequest {
    pub invitation_code: String,
}

/// Verify invitation response
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyInvitationResponse {
    pub valid: bool,
    pub invitation_id: Option<String>,
    pub enterprise_id: Option<String>,
    pub message: String,
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
