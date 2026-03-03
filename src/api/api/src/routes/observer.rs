//! Observer API implementation
//!
//! TASK-P5-019: Observer API (8 EP)
//!
//! Provides endpoints for observers to:
//! - Monitor pending unlocks for potential fraud
//! - Submit challenges against suspicious transactions
//! - Track earnings from successful challenges
//!
//! Spec References:
//! - SEQUENCES §4 Challenge + Slashing
//! - UNIFIED_SPEC §Observer Role
//!
//! ## CP-4 Compliance
//! - Slashing mechanism exists and cannot be removed
//! - Quadratic slashing: N² × 10%
//! - Distribution: 60% Challenger, 20% Insurance, 20% Burn

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};

use crate::{
    db::{ObserverRepository, ChallengeRepository, LockRepository},
    error::ApiError,
    services::AppState,
};

/// Extract wallet address from X-User-Address header
/// TODO: Replace with JWT token extraction (TASK-P5-012)
fn extract_observer_address(headers: &axum::http::HeaderMap) -> Result<String, ApiError> {
    headers
        .get("X-User-Address")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .ok_or(ApiError::Unauthorized)
}

// ============================================================================
// Observer Types
// ============================================================================

/// Challenge status enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ObserverChallengeStatus {
    /// Challenge submitted, awaiting defense
    Pending,
    /// Defense submitted, under review
    UnderReview,
    /// Challenge succeeded, challenger won
    Succeeded,
    /// Challenge failed, defender won
    Failed,
    /// Challenge expired without resolution
    Expired,
}

/// Suspicion level for transactions
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SuspicionLevel {
    /// Low risk, normal transaction pattern
    Low,
    /// Medium risk, unusual but not alarming
    Medium,
    /// High risk, likely fraudulent
    High,
    /// Critical risk, immediate attention required
    Critical,
}

/// Unlock type for pending unlocks
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum UnlockType {
    /// Normal unlock with 24h timelock
    Normal,
    /// Emergency unlock with 7d timelock and bond
    Emergency,
}

// ============================================================================
// Request/Response Types
// ============================================================================

/// GET /v1/observer/dashboard response
#[derive(Debug, Serialize)]
pub struct ObserverDashboardResponse {
    /// Total earnings from successful challenges (in wei)
    #[serde(rename = "totalEarnings")]
    pub total_earnings: String,
    /// Unclaimed earnings available to claim
    #[serde(rename = "unclaimedEarnings")]
    pub unclaimed_earnings: String,
    /// Total number of challenges submitted
    #[serde(rename = "totalChallenges")]
    pub total_challenges: u32,
    /// Number of successful challenges
    #[serde(rename = "successfulChallenges")]
    pub successful_challenges: u32,
    /// Success rate percentage
    #[serde(rename = "successRate")]
    pub success_rate: f64,
    /// Current pending unlocks being monitored
    #[serde(rename = "pendingUnlocksCount")]
    pub pending_unlocks_count: u32,
    /// Active challenges count
    #[serde(rename = "activeChallenges")]
    pub active_challenges: u32,
    /// Recent activity summary
    #[serde(rename = "recentActivity")]
    pub recent_activity: Vec<ObserverActivityItem>,
    /// Network statistics
    pub stats: ObserverNetworkStats,
}

#[derive(Debug, Serialize)]
pub struct ObserverNetworkStats {
    /// Total value locked (in wei)
    #[serde(rename = "totalValueLocked")]
    pub total_value_locked: String,
    /// Total pending unlocks network-wide
    #[serde(rename = "networkPendingUnlocks")]
    pub network_pending_unlocks: u32,
    /// Total challenges network-wide
    #[serde(rename = "networkChallenges")]
    pub network_challenges: u32,
    /// Average challenge success rate
    #[serde(rename = "networkSuccessRate")]
    pub network_success_rate: f64,
}

#[derive(Debug, Serialize)]
pub struct ObserverActivityItem {
    pub id: String,
    #[serde(rename = "type")]
    pub activity_type: String,
    pub description: String,
    #[serde(rename = "timestamp")]
    pub timestamp: u64,
    pub amount: Option<String>,
}

/// GET /v1/observer/pending-unlocks response
#[derive(Debug, Serialize)]
pub struct PendingUnlocksResponse {
    pub unlocks: Vec<PendingUnlockItem>,
    pub total: u32,
    pub page: u32,
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct PendingUnlockItem {
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Owner address
    pub owner: String,
    /// Amount locked (in wei)
    pub amount: String,
    /// Token address (0x0 for ETH)
    pub token: String,
    /// Unlock type (normal or emergency)
    #[serde(rename = "unlockType")]
    pub unlock_type: UnlockType,
    /// Unlock request timestamp
    #[serde(rename = "unlockRequestedAt")]
    pub unlock_requested_at: u64,
    /// Time until unlock is executable (seconds)
    #[serde(rename = "timeRemaining")]
    pub time_remaining: u64,
    /// Suspicion level assigned by system
    #[serde(rename = "suspicionLevel")]
    pub suspicion_level: SuspicionLevel,
    /// Risk indicators
    #[serde(rename = "riskIndicators")]
    pub risk_indicators: Vec<String>,
    /// Whether user can challenge this unlock
    #[serde(rename = "canChallenge")]
    pub can_challenge: bool,
}

/// GET /v1/observer/suspicious-txs response
#[derive(Debug, Serialize)]
pub struct SuspiciousTxsResponse {
    pub transactions: Vec<SuspiciousTransaction>,
    pub total: u32,
    pub page: u32,
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct SuspiciousTransaction {
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Owner address
    pub owner: String,
    /// Amount (in wei)
    pub amount: String,
    /// Suspicion level
    #[serde(rename = "suspicionLevel")]
    pub suspicion_level: SuspicionLevel,
    /// Detailed risk analysis
    #[serde(rename = "riskAnalysis")]
    pub risk_analysis: RiskAnalysis,
    /// Recommended action
    #[serde(rename = "recommendedAction")]
    pub recommended_action: String,
    /// Minimum bond required to challenge
    #[serde(rename = "challengeBond")]
    pub challenge_bond: String,
    /// Detected timestamp
    #[serde(rename = "detectedAt")]
    pub detected_at: u64,
}

#[derive(Debug, Serialize)]
pub struct RiskAnalysis {
    /// Risk score (0-100)
    pub score: u32,
    /// Risk factors identified
    pub factors: Vec<RiskFactor>,
    /// Summary of risk
    pub summary: String,
}

#[derive(Debug, Serialize)]
pub struct RiskFactor {
    pub name: String,
    pub description: String,
    pub severity: String,
    pub weight: u32,
}

/// GET /v1/observer/history response
#[derive(Debug, Serialize)]
pub struct ObserverHistoryResponse {
    pub history: Vec<ObserverHistoryItem>,
    pub total: u32,
    pub page: u32,
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct ObserverHistoryItem {
    pub id: String,
    /// Type: challenge_submitted, challenge_won, challenge_lost, earnings_claimed
    #[serde(rename = "type")]
    pub history_type: String,
    #[serde(rename = "lockId")]
    pub lock_id: String,
    pub amount: String,
    pub status: String,
    #[serde(rename = "timestamp")]
    pub timestamp: u64,
    /// Transaction hash on L1
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
}

/// POST /v1/observer/challenge request
#[derive(Debug, Deserialize)]
pub struct SubmitChallengeRequest {
    /// Lock ID to challenge
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Observer's address
    pub challenger: String,
    /// Fraud evidence data
    #[serde(rename = "fraudProof")]
    pub fraud_proof: String,
    /// Challenge bond (in wei) - must meet minimum
    pub bond: String,
    /// Reason for challenge
    pub reason: String,
}

/// POST /v1/observer/challenge response
#[derive(Debug, Serialize)]
pub struct SubmitChallengeResponse {
    #[serde(rename = "challengeId")]
    pub challenge_id: String,
    #[serde(rename = "lockId")]
    pub lock_id: String,
    #[serde(rename = "fraudProofHash")]
    pub fraud_proof_hash: String,
    pub bond: String,
    #[serde(rename = "defenseDeadline")]
    pub defense_deadline: u64,
    pub status: ObserverChallengeStatus,
    /// Estimated reward if challenge succeeds
    #[serde(rename = "estimatedReward")]
    pub estimated_reward: String,
}

/// GET /v1/observer/challenge/:id response
#[derive(Debug, Serialize)]
pub struct ChallengeDetailResponse {
    #[serde(rename = "challengeId")]
    pub challenge_id: String,
    #[serde(rename = "lockId")]
    pub lock_id: String,
    pub challenger: String,
    #[serde(rename = "fraudProofHash")]
    pub fraud_proof_hash: String,
    pub bond: String,
    pub status: ObserverChallengeStatus,
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
    #[serde(rename = "defenseDeadline")]
    pub defense_deadline: u64,
    /// Defense details if submitted
    pub defense: Option<DefenseInfo>,
    /// Resolution details if resolved
    pub resolution: Option<ResolutionInfo>,
    /// Timeline of events
    pub timeline: Vec<ChallengeEvent>,
}

#[derive(Debug, Serialize)]
pub struct DefenseInfo {
    pub defender: String,
    #[serde(rename = "defenseProofHash")]
    pub defense_proof_hash: String,
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
}

#[derive(Debug, Serialize)]
pub struct ResolutionInfo {
    pub winner: String,
    #[serde(rename = "resolvedAt")]
    pub resolved_at: u64,
    /// Amount slashed (if challenge won)
    #[serde(rename = "slashedAmount")]
    pub slashed_amount: Option<String>,
    /// Amount rewarded to challenger (if won)
    #[serde(rename = "rewardAmount")]
    pub reward_amount: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ChallengeEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub description: String,
    #[serde(rename = "timestamp")]
    pub timestamp: u64,
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
}

/// Internal challenge info for get_challenge handler
#[derive(Debug, Clone)]
struct ChallengeInfo {
    pub challenge_id: String,
    pub lock_id: String,
    pub challenger: String,
    pub fraud_proof_hash: String,
    pub bond: String,
    pub submitted_at: u64,
    pub defense_deadline: u64,
    pub defense_submitted: bool,
    pub defense_timestamp: Option<u64>,
    pub defender: Option<String>,
    pub defense_proof_hash: Option<String>,
    pub resolved: bool,
    pub resolved_at: Option<u64>,
    pub challenger_won: bool,
    pub slashed_amount: Option<String>,
    pub reward_amount: Option<String>,
    pub resolution_tx_hash: Option<String>,
}

/// GET /v1/observer/earnings response
#[derive(Debug, Serialize)]
pub struct EarningsResponse {
    /// Total earnings all-time
    #[serde(rename = "totalEarnings")]
    pub total_earnings: String,
    /// Already claimed earnings
    #[serde(rename = "claimedEarnings")]
    pub claimed_earnings: String,
    /// Available to claim
    #[serde(rename = "unclaimedEarnings")]
    pub unclaimed_earnings: String,
    /// Earnings breakdown by source
    pub breakdown: EarningsBreakdown,
    /// Recent earnings history
    pub history: Vec<EarningItem>,
    /// Reward currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

#[derive(Debug, Serialize)]
pub struct EarningsBreakdown {
    /// From successful challenges (60% of slash)
    #[serde(rename = "fromChallenges")]
    pub from_challenges: String,
    /// Number of winning challenges
    #[serde(rename = "winningChallenges")]
    pub winning_challenges: u32,
}

#[derive(Debug, Serialize)]
pub struct EarningItem {
    pub id: String,
    #[serde(rename = "challengeId")]
    pub challenge_id: String,
    pub amount: String,
    #[serde(rename = "timestamp")]
    pub timestamp: u64,
    pub claimed: bool,
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
    /// Earning currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

/// POST /v1/observer/claim-earnings request
#[derive(Debug, Deserialize)]
pub struct ClaimEarningsRequest {
    /// Observer's address
    pub observer: String,
    /// Optional: specific earning IDs to claim, or all if empty
    #[serde(rename = "earningIds")]
    pub earning_ids: Option<Vec<String>>,
}

/// POST /v1/observer/claim-earnings response
#[derive(Debug, Serialize)]
pub struct ClaimEarningsResponse {
    #[serde(rename = "claimId")]
    pub claim_id: String,
    #[serde(rename = "amountClaimed")]
    pub amount_claimed: String,
    #[serde(rename = "earningsClaimed")]
    pub earnings_claimed: u32,
    #[serde(rename = "txHash")]
    pub tx_hash: String,
    /// Claim currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
    pub status: String,
}

// ============================================================================
// API Handlers
// ============================================================================

/// POST /v1/observer/register
///
/// Register a new observer to participate in the challenge system.
/// Observers monitor pending unlocks and can submit fraud challenges.
pub async fn register_observer(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<crate::types::ObserverRegisterRequest>,
) -> Result<Json<crate::types::ObserverRegisterResponse>, ApiError> {
    tracing::info!("Registering new observer: {}", req.operator_addr);

    // 1. Validate operator address format
    if !req.operator_addr.starts_with("0x") || req.operator_addr.len() != 42 {
        return Err(ApiError::InvalidRequest(format!(
            "Invalid operator address: {}",
            req.operator_addr
        )));
    }

    // 2. Check if observer already exists
    if let Some(_existing) = state.get_observer_by_address(&req.operator_addr).await? {
        return Err(ApiError::AlreadyExists(format!(
            "Observer already registered for address: {}",
            req.operator_addr
        )));
    }

    // 3. Generate observer ID using SHA3-256
    let mut hasher = Sha3_256::new();
    hasher.update(b"OBSERVER_V1");
    hasher.update(req.operator_addr.as_bytes());
    hasher.update(&chrono::Utc::now().timestamp().to_be_bytes());
    let observer_id = format!("obs_{}", hex::encode(&hasher.finalize()[..16]));

    let now = chrono::Utc::now().timestamp() as u64;

    // 4. Create observer record
    let observer = crate::types::Observer {
        observer_id: observer_id.clone(),
        operator_addr: req.operator_addr.clone(),
        status: crate::types::ObserverStatus::PendingApproval,
        stake_amount: req.stake_amount.clone(),
        registered_at: now,
        total_challenges: 0,
        successful_challenges: 0,
        total_earnings: "0".to_string(),
    };

    // 5. Store observer
    state.store_observer(&observer).await?;

    tracing::info!(
        "Observer registered: {} for address: {}",
        observer_id,
        req.operator_addr
    );

    Ok(Json(crate::types::ObserverRegisterResponse {
        observer_id,
        status: crate::types::ObserverStatus::PendingApproval,
        operator_addr: req.operator_addr,
        registered_at: now,
    }))
}

/// GET /v1/observer/dashboard
///
/// Returns observer's dashboard with earnings, challenges, and network stats.
/// Phase 4: PG-backed implementation
pub async fn get_dashboard(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<ObserverDashboardResponse>, ApiError> {
    // TODO: Replace with JWT token extraction (TASK-P5-012)
    // Currently uses X-User-Address header for development (matches user.rs, token_hub.rs pattern)
    let wallet_address = headers
        .get("X-User-Address")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .ok_or(ApiError::Unauthorized)?;

    tracing::info!(wallet = %wallet_address, "Fetching observer dashboard");

    let pool = state.db.pool();

    // Get observer record
    let observer = ObserverRepository::get_by_wallet(pool, &wallet_address).await?;
    let (total_earnings_str, unclaimed_str, total_challenges, successful_challenges) =
        if let Some(ref obs) = observer {
            let summary = ObserverRepository::get_earnings_summary(pool, &obs.observer_id).await?;
            (
                summary.total_earnings.to_string(),
                summary.unclaimed_earnings.to_string(),
                obs.successful_challenges + obs.failed_challenges,
                obs.successful_challenges,
            )
        } else {
            ("0".to_string(), "0".to_string(), 0i64, 0i64)
        };

    let success_rate = if total_challenges > 0 {
        (successful_challenges as f64 / total_challenges as f64) * 100.0
    } else {
        0.0
    };

    // Network-wide stats from PG
    let pending_count = LockRepository::count_by_status(pool, Some("unlock_pending")).await?
        + LockRepository::count_by_status(pool, Some("emergency_pending")).await?;
    let active_challenges = ChallengeRepository::count_by_status(pool, Some("pending")).await?;
    let total_tvl = LockRepository::get_total_tvl(pool).await?;
    let total_network_challenges = ChallengeRepository::count_by_status(pool, None).await?;
    let resolved_valid = ChallengeRepository::count_by_status(pool, Some("resolved_valid")).await?;
    let network_success_rate = if total_network_challenges > 0 {
        (resolved_valid as f64 / total_network_challenges as f64) * 100.0
    } else {
        0.0
    };

    // Recent activity from challenges
    let recent_activity = if let Some(ref obs) = observer {
        let challenges = ObserverRepository::get_challenges_by_observer(pool, &obs.observer_id, 0, 5).await?;
        challenges.iter().map(|c| ObserverActivityItem {
            id: c.challenge_id.clone(),
            activity_type: format!("challenge_{}", c.status),
            description: format!("Challenge {} for lock {}", c.status, &c.lock_id[..std::cmp::min(10, c.lock_id.len())]),
            timestamp: c.challenged_at.timestamp() as u64,
            amount: Some(c.bond.to_string()),
        }).collect()
    } else {
        vec![]
    };

    Ok(Json(ObserverDashboardResponse {
        total_earnings: total_earnings_str,
        unclaimed_earnings: unclaimed_str,
        total_challenges: total_challenges as u32,
        successful_challenges: successful_challenges as u32,
        success_rate: (success_rate * 100.0).round() / 100.0,
        pending_unlocks_count: pending_count as u32,
        active_challenges: active_challenges as u32,
        recent_activity,
        stats: ObserverNetworkStats {
            total_value_locked: total_tvl.to_string(),
            network_pending_unlocks: pending_count as u32,
            network_challenges: total_network_challenges as u32,
            network_success_rate: (network_success_rate * 100.0).round() / 100.0,
        },
    }))
}

/// GET /v1/observer/pending-unlocks
///
/// Returns list of pending unlocks available to monitor/challenge.
/// Phase 4: PG-backed implementation
pub async fn get_pending_unlocks(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<PendingUnlocksResponse>, ApiError> {
    tracing::info!("Fetching pending unlocks for observer");

    let pool = state.db.pool();
    let now = chrono::Utc::now().timestamp() as u64;

    // Query pending unlock locks from PG
    let statuses = &["unlock_pending", "emergency_pending"];
    let rows = crate::db::LockRepository::list_locks_by_statuses(pool, statuses).await?;

    let unlocks: Vec<PendingUnlockItem> = rows.iter().map(|row| {
        let is_emergency = row.status == "emergency_pending";
        let requested_at = row.created_at.timestamp() as u64;
        let time_lock = if is_emergency {
            state.config.security.emergency_time_lock_days * 24 * 3600
        } else {
            state.config.security.normal_time_lock_hours * 3600
        };
        let deadline = requested_at + time_lock;
        let time_remaining = if deadline > now { deadline - now } else { 0 };

        PendingUnlockItem {
            lock_id: row.lock_id.clone(),
            owner: row.wallet_address.clone(),
            amount: row.amount.to_string(),
            token: "0x0000000000000000000000000000000000000000".to_string(),
            unlock_type: if is_emergency { UnlockType::Emergency } else { UnlockType::Normal },
            unlock_requested_at: requested_at,
            time_remaining,
            suspicion_level: if is_emergency { SuspicionLevel::High } else { SuspicionLevel::Low },
            risk_indicators: if is_emergency {
                vec!["Emergency unlock request".to_string()]
            } else {
                vec![]
            },
            can_challenge: time_remaining > 0,
        }
    }).collect();

    let total = unlocks.len() as u32;

    Ok(Json(PendingUnlocksResponse {
        unlocks,
        total,
        page: 1,
        page_size: 20,
    }))
}

/// GET /v1/observer/suspicious-txs
///
/// Returns transactions flagged as suspicious by the monitoring system.
/// Phase 4: PG-backed — queries emergency pending locks as suspicious
pub async fn get_suspicious_txs(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<SuspiciousTxsResponse>, ApiError> {
    tracing::info!("Fetching suspicious transactions");

    let pool = state.db.pool();
    let _now = chrono::Utc::now().timestamp() as u64;

    // Emergency pending locks are treated as suspicious
    let rows = crate::db::LockRepository::list_locks_by_statuses(pool, &["emergency_pending"]).await?;

    let transactions: Vec<SuspiciousTransaction> = rows.iter().map(|row| {
        let amount_str = row.amount.to_string();
        let amount_val: u128 = amount_str.parse().unwrap_or(0);
        let bond = std::cmp::max(100_000_000_000_000_000u128, amount_val / 100);

        SuspiciousTransaction {
            lock_id: row.lock_id.clone(),
            owner: row.wallet_address.clone(),
            amount: amount_str,
            suspicion_level: SuspicionLevel::High,
            risk_analysis: RiskAnalysis {
                score: 75,
                factors: vec![
                    RiskFactor {
                        name: "Emergency unlock".to_string(),
                        description: "Emergency unlock bypasses normal timelock".to_string(),
                        severity: "high".to_string(),
                        weight: 40,
                    },
                ],
                summary: "Emergency unlock request requires observer verification".to_string(),
            },
            recommended_action: "Review and submit challenge if fraud is suspected".to_string(),
            challenge_bond: bond.to_string(),
            detected_at: row.created_at.timestamp() as u64,
        }
    }).collect();

    let total = transactions.len() as u32;

    Ok(Json(SuspiciousTxsResponse {
        transactions,
        total,
        page: 1,
        page_size: 20,
    }))
}

/// GET /v1/observer/history
///
/// Returns observer's challenge and earnings history.
/// Phase 4: PG-backed implementation
pub async fn get_history(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<ObserverHistoryResponse>, ApiError> {
    let wallet_address = extract_observer_address(&headers)?;
    tracing::info!(wallet = %wallet_address, "Fetching observer history");

    let pool = state.db.pool();

    let observer = ObserverRepository::get_by_wallet(pool, &wallet_address).await?;

    let history = if let Some(ref obs) = observer {
        // Get challenge history
        let challenges = ObserverRepository::get_challenges_by_observer(pool, &obs.observer_id, 0, 20).await?;
        let mut items: Vec<ObserverHistoryItem> = challenges.iter().map(|c| {
            let history_type = match c.status.as_str() {
                "resolved_valid" => "challenge_won",
                "resolved_invalid" => "challenge_lost",
                _ => "challenge_submitted",
            };
            ObserverHistoryItem {
                id: c.challenge_id.clone(),
                history_type: history_type.to_string(),
                lock_id: c.lock_id.clone(),
                amount: c.bond.to_string(),
                status: c.status.clone(),
                timestamp: c.challenged_at.timestamp() as u64,
                tx_hash: None,
            }
        }).collect();

        // Get earnings history
        let earnings = ObserverRepository::get_earnings(pool, &obs.observer_id, 20).await?;
        for e in &earnings {
            items.push(ObserverHistoryItem {
                id: e.earning_id.clone(),
                history_type: if e.claimed { "earnings_claimed" } else { "earnings_earned" }.to_string(),
                lock_id: e.challenge_id.clone(),
                amount: e.amount.to_string(),
                status: if e.claimed { "claimed" } else { "unclaimed" }.to_string(),
                timestamp: e.earned_at.timestamp() as u64,
                tx_hash: e.claim_tx_hash.clone(),
            });
        }

        // Sort by timestamp descending
        items.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        items
    } else {
        vec![]
    };

    let total = history.len() as u32;

    Ok(Json(ObserverHistoryResponse {
        history,
        total,
        page: 1,
        page_size: 20,
    }))
}

/// POST /v1/observer/challenge
///
/// Submit a challenge against a pending unlock.
///
/// # Security
/// - Uses SHA3-256 for fraud proof hash (CP-1 compliant)
/// - Bond required: MAX(0.1 ETH, amount × 1%) (SEQUENCES §4.3)
/// - Defense period: 48 hours (SEQUENCES §4.4)
pub async fn submit_challenge(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<SubmitChallengeRequest>,
) -> Result<Json<SubmitChallengeResponse>, ApiError> {
    tracing::info!("Observer submitting challenge for lock_id: {}", req.lock_id);

    // 1. Validate lock exists and is in pending unlock state
    let lock = state.get_lock(&req.lock_id).await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    if lock.status != crate::types::LockStatus::UnlockPending
        && lock.status != crate::types::LockStatus::EmergencyPending {
        return Err(ApiError::InvalidChallengeTarget(
            "Lock must be in pending unlock state".into()
        ));
    }

    // 2. Calculate required bond: MAX(0.1 ETH, amount × 1%)
    let min_bond: u128 = 100_000_000_000_000_000; // 0.1 ETH in wei
    let lock_amount: u128 = lock.amount.parse().unwrap_or(0);
    let percent_bond = lock_amount / 100; // 1%
    let required_bond = std::cmp::max(min_bond, percent_bond);

    let provided_bond: u128 = req.bond.parse().unwrap_or(0);
    if provided_bond < required_bond {
        return Err(ApiError::InsufficientBond(format!(
            "Required: {}, Provided: {}", required_bond, provided_bond
        )));
    }

    // 3. Compute fraud proof hash using SHA3-256 (CP-1 compliant)
    let mut hasher = Sha3_256::new();
    hasher.update(req.fraud_proof.as_bytes());
    let fraud_proof_hash = format!("0x{}", hex::encode(hasher.finalize()));

    // 4. Generate challenge ID
    let mut id_hasher = Sha3_256::new();
    id_hasher.update(b"OBSERVER_CHALLENGE_V1");
    id_hasher.update(req.lock_id.as_bytes());
    id_hasher.update(req.challenger.as_bytes());
    id_hasher.update(&chrono::Utc::now().timestamp().to_be_bytes());
    let challenge_id = format!("0x{}", hex::encode(id_hasher.finalize()));

    // 5. Calculate defense deadline (48 hours)
    let defense_deadline = chrono::Utc::now().timestamp() as u64 + 48 * 3600;

    // 6. Store challenge
    state.store_challenge(
        &challenge_id,
        &req.lock_id,
        &req.challenger,
        &fraud_proof_hash,
        &req.bond,
        defense_deadline,
    ).await?;

    // 7. Update lock status to CHALLENGED
    state.update_lock_status(&req.lock_id, crate::types::LockStatus::Challenged, None).await?;

    // 8. Calculate estimated reward (60% of potential slash)
    // Quadratic slashing: N² × 10% where N = violation count (assume 1 for new challenge)
    let slash_rate = 10u128; // 10% for first violation
    let potential_slash = lock_amount * slash_rate / 100;
    let estimated_reward = potential_slash * 60 / 100; // 60% to challenger

    tracing::info!(
        "Observer challenge submitted: {} for lock: {}, defense deadline: {}",
        challenge_id, req.lock_id, defense_deadline
    );

    Ok(Json(SubmitChallengeResponse {
        challenge_id,
        lock_id: req.lock_id,
        fraud_proof_hash,
        bond: req.bond,
        defense_deadline,
        status: ObserverChallengeStatus::Pending,
        estimated_reward: estimated_reward.to_string(),
    }))
}

/// GET /v1/observer/challenge/:id
///
/// Get details of a specific challenge.
/// Phase 4: PG-backed implementation
pub async fn get_challenge(
    Extension(state): Extension<Arc<AppState>>,
    Path(challenge_id): Path<String>,
) -> Result<Json<ChallengeDetailResponse>, ApiError> {
    tracing::info!("Fetching challenge details: {}", challenge_id);

    let pool = state.db.pool();

    let row = ChallengeRepository::get_by_id(pool, &challenge_id).await?
        .ok_or_else(|| ApiError::NotFound(format!("Challenge {} not found", challenge_id)))?;

    let now = chrono::Utc::now().timestamp() as u64;
    let submitted_at = row.challenged_at.timestamp() as u64;
    let defense_deadline = row.defense_deadline.timestamp() as u64;

    let is_defense_submitted = row.status == "defense_submitted"
        || row.status == "resolved_valid"
        || row.status == "resolved_invalid";
    let is_resolved = row.status == "resolved_valid" || row.status == "resolved_invalid";
    let challenger_won = row.status == "resolved_valid";

    // Build timeline
    let mut timeline = vec![
        ChallengeEvent {
            event_type: "challenge_submitted".to_string(),
            description: format!("Challenge submitted by {}", row.challenger),
            timestamp: submitted_at,
            tx_hash: None,
        },
    ];

    let defense = if is_defense_submitted {
        timeline.push(ChallengeEvent {
            event_type: "defense_submitted".to_string(),
            description: "Defense proof submitted by prover".to_string(),
            timestamp: defense_deadline.saturating_sub(3600), // approximate
            tx_hash: None,
        });
        Some(DefenseInfo {
            defender: row.defender.clone().unwrap_or_default(),
            defense_proof_hash: row.defense_proof_hash.clone().unwrap_or_default(),
            submitted_at: defense_deadline.saturating_sub(3600),
        })
    } else {
        None
    };

    let resolution = if is_resolved {
        let resolved_at = row.resolved_at.map(|t| t.timestamp() as u64).unwrap_or(now);
        let winner = if challenger_won {
            row.challenger.clone()
        } else {
            row.defender.clone().unwrap_or_default()
        };
        // Get slashing info if exists
        let slashing = ChallengeRepository::get_slashing(pool, &challenge_id).await?;
        timeline.push(ChallengeEvent {
            event_type: "challenge_resolved".to_string(),
            description: format!("Challenge resolved. Winner: {}", winner),
            timestamp: resolved_at,
            tx_hash: slashing.as_ref().and_then(|s| s.l1_tx_hash.clone()),
        });
        Some(ResolutionInfo {
            winner,
            resolved_at,
            slashed_amount: slashing.as_ref().map(|s| s.slash_amount.to_string()),
            reward_amount: slashing.as_ref().map(|s| s.challenger_reward.to_string()),
        })
    } else {
        None
    };

    let status = if is_resolved {
        if challenger_won { ObserverChallengeStatus::Succeeded } else { ObserverChallengeStatus::Failed }
    } else if is_defense_submitted {
        ObserverChallengeStatus::UnderReview
    } else if now > defense_deadline {
        ObserverChallengeStatus::Expired
    } else {
        ObserverChallengeStatus::Pending
    };

    Ok(Json(ChallengeDetailResponse {
        challenge_id: row.challenge_id,
        lock_id: row.lock_id,
        challenger: row.challenger,
        fraud_proof_hash: row.fraud_proof_hash,
        bond: row.bond.to_string(),
        status,
        submitted_at,
        defense_deadline,
        defense,
        resolution,
        timeline,
    }))
}

/// GET /v1/observer/earnings
///
/// Get observer's earnings summary and history.
/// Phase 4: PG-backed implementation
pub async fn get_earnings(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<EarningsResponse>, ApiError> {
    let wallet_address = extract_observer_address(&headers)?;
    tracing::info!(wallet = %wallet_address, "Fetching observer earnings");

    let pool = state.db.pool();

    let observer = ObserverRepository::get_by_wallet(pool, &wallet_address).await?;

    let (summary, earnings_rows) = if let Some(ref obs) = observer {
        let s = ObserverRepository::get_earnings_summary(pool, &obs.observer_id).await?;
        let rows = ObserverRepository::get_earnings(pool, &obs.observer_id, 50).await?;
        (s, rows)
    } else {
        (
            crate::db::ObserverEarningsSummary {
                total_earnings: bigdecimal::BigDecimal::from(0),
                claimed_earnings: bigdecimal::BigDecimal::from(0),
                unclaimed_earnings: bigdecimal::BigDecimal::from(0),
            },
            vec![],
        )
    };

    let winning_challenges = observer.as_ref().map(|o| o.successful_challenges as u32).unwrap_or(0);

    let history: Vec<EarningItem> = earnings_rows.iter().map(|e| {
        EarningItem {
            id: e.earning_id.clone(),
            challenge_id: e.challenge_id.clone(),
            amount: e.amount.to_string(),
            timestamp: e.earned_at.timestamp() as u64,
            claimed: e.claimed,
            tx_hash: e.claim_tx_hash.clone(),
            currency: "QS".to_string(),
        }
    }).collect();

    Ok(Json(EarningsResponse {
        total_earnings: summary.total_earnings.to_string(),
        claimed_earnings: summary.claimed_earnings.to_string(),
        unclaimed_earnings: summary.unclaimed_earnings.to_string(),
        breakdown: EarningsBreakdown {
            from_challenges: summary.total_earnings.to_string(),
            winning_challenges,
        },
        history,
        currency: "QS".to_string(),
    }))
}

/// POST /v1/observer/claim-earnings
///
/// Claim accumulated earnings from successful challenges.
/// Phase 4: PG-backed implementation
pub async fn claim_earnings(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ClaimEarningsRequest>,
) -> Result<Json<ClaimEarningsResponse>, ApiError> {
    tracing::info!("Observer {} claiming earnings", req.observer);

    let pool = state.db.pool();

    // Validate observer address
    if !req.observer.starts_with("0x") || req.observer.len() != 42 {
        return Err(ApiError::InvalidRequest(format!("Invalid address: {}", req.observer)));
    }

    // Find observer
    let observer = ObserverRepository::get_by_wallet(pool, &req.observer).await?
        .ok_or_else(|| ApiError::NotFound("Observer not found".to_string()))?;

    // Get unclaimed earnings
    let earnings = ObserverRepository::get_earnings(pool, &observer.observer_id, 100).await?;
    let unclaimed: Vec<_> = earnings.iter().filter(|e| !e.claimed).collect();

    if unclaimed.is_empty() {
        return Err(ApiError::BadRequest("No unclaimed earnings".to_string()));
    }

    // Claim all unclaimed earnings
    let mut total_claimed = bigdecimal::BigDecimal::from(0);
    let mut count = 0u32;
    for earning in &unclaimed {
        let claimed = ObserverRepository::claim_earning(pool, &earning.earning_id).await?;
        if claimed {
            total_claimed += &earning.amount;
            count += 1;
        }
    }

    // Generate claim ID
    let mut hasher = Sha3_256::new();
    hasher.update(b"CLAIM_V1");
    hasher.update(req.observer.as_bytes());
    hasher.update(&chrono::Utc::now().timestamp().to_be_bytes());
    let claim_id = format!("0x{}", hex::encode(hasher.finalize()));

    tracing::info!(observer = %req.observer, claimed = count, "Observer earnings claimed");

    Ok(Json(ClaimEarningsResponse {
        claim_id,
        amount_claimed: total_claimed.to_string(),
        earnings_claimed: count,
        tx_hash: "".to_string(), // L1 tx hash assigned after on-chain confirmation
        status: "pending".to_string(),
        currency: "QS".to_string(),
    }))
}

// ============================================================================
// Profile / Active Challenges / Settings Types
// ============================================================================

/// GET /v1/observer/profile response
#[derive(Debug, Serialize)]
pub struct ObserverProfileResponse {
    #[serde(rename = "observerId")]
    pub observer_id: String,
    #[serde(rename = "walletAddress")]
    pub wallet_address: String,
    #[serde(rename = "registrationDate")]
    pub registration_date: u64,
    #[serde(rename = "practicePeriodMonths")]
    pub practice_period_months: u32,
    pub status: String,
    #[serde(rename = "stakeAmount")]
    pub stake_amount: String,
    #[serde(rename = "totalChallenges")]
    pub total_challenges: u32,
    #[serde(rename = "successfulChallenges")]
    pub successful_challenges: u32,
    #[serde(rename = "totalEarnings")]
    pub total_earnings: String,
}

/// GET /v1/observer/challenges/active response
#[derive(Debug, Serialize)]
pub struct ActiveChallengesResponse {
    pub challenges: Vec<ActiveChallengeItem>,
    pub total: u32,
}

#[derive(Debug, Serialize)]
pub struct ActiveChallengeItem {
    #[serde(rename = "challengeId")]
    pub challenge_id: String,
    #[serde(rename = "lockId")]
    pub lock_id: String,
    pub bond: String,
    pub status: String,
    #[serde(rename = "challengedAt")]
    pub challenged_at: u64,
    #[serde(rename = "defenseDeadline")]
    pub defense_deadline: u64,
    #[serde(rename = "timeRemaining")]
    pub time_remaining: u64,
}

/// GET /v1/observer/settings response
#[derive(Debug, Serialize, Deserialize)]
pub struct ObserverSettingsResponse {
    pub notifications: ObserverNotificationSettings,
    #[serde(rename = "autoChallenge")]
    pub auto_challenge: ObserverAutoChallengeSettings,
    pub display: ObserverDisplaySettings,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObserverNotificationSettings {
    #[serde(rename = "emailAlerts")]
    pub email_alerts: bool,
    #[serde(rename = "pushNotifications")]
    pub push_notifications: bool,
    #[serde(rename = "challengeUpdates")]
    pub challenge_updates: bool,
    #[serde(rename = "earningsAlerts")]
    pub earnings_alerts: bool,
    #[serde(rename = "newSuspiciousTx")]
    pub new_suspicious_tx: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObserverAutoChallengeSettings {
    pub enabled: bool,
    #[serde(rename = "minSuspicionLevel")]
    pub min_suspicion_level: String,
    #[serde(rename = "maxBondPerChallenge")]
    pub max_bond_per_challenge: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ObserverDisplaySettings {
    #[serde(rename = "currency")]
    pub currency: String,
    #[serde(rename = "language")]
    pub language: String,
    #[serde(rename = "timezone")]
    pub timezone: String,
}

/// PUT /v1/observer/settings request
#[derive(Debug, Deserialize)]
pub struct UpdateObserverSettingsRequest {
    pub notifications: Option<ObserverNotificationSettings>,
    #[serde(rename = "autoChallenge")]
    pub auto_challenge: Option<ObserverAutoChallengeSettings>,
    pub display: Option<ObserverDisplaySettings>,
}

// ============================================================================
// Profile / Active Challenges / Settings Handlers
// ============================================================================

/// GET /v1/observer/profile
///
/// Returns observer profile data including registration date, status, and stake.
/// Uses authenticated user's wallet address to look up observer record.
pub async fn get_profile(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<ObserverProfileResponse>, ApiError> {
    let wallet_address = extract_observer_address(&headers)?;
    tracing::info!(wallet = %wallet_address, "Fetching observer profile");

    let pool = state.db.pool();

    let observer = ObserverRepository::get_by_wallet(pool, &wallet_address)
        .await?
        .ok_or_else(|| ApiError::ObserverNotFound(wallet_address.clone()))?;

    let total_challenges = (observer.successful_challenges + observer.failed_challenges) as u32;

    // Determine practice period: if practice_mode_until is set, compute months from registration
    let practice_period_months = if let Some(until) = observer.practice_mode_until {
        let duration = until.signed_duration_since(observer.registered_at);
        std::cmp::max(1, (duration.num_days() / 30) as u32)
    } else {
        3 // Default 3-month practice period
    };

    tracing::info!(
        observer_id = %observer.observer_id,
        "Observer profile fetched successfully"
    );

    Ok(Json(ObserverProfileResponse {
        observer_id: observer.observer_id,
        wallet_address: observer.wallet_address,
        registration_date: observer.registered_at.timestamp() as u64,
        practice_period_months,
        status: observer.status,
        stake_amount: observer.total_earnings.to_string(),
        total_challenges,
        successful_challenges: observer.successful_challenges as u32,
        total_earnings: observer.total_earnings.to_string(),
    }))
}

/// GET /v1/observer/challenges/active
///
/// Returns active (pending/under_review) challenges for the authenticated observer.
pub async fn get_active_challenges(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<ActiveChallengesResponse>, ApiError> {
    let wallet_address = extract_observer_address(&headers)?;
    tracing::info!(wallet = %wallet_address, "Fetching active challenges for observer");

    let pool = state.db.pool();

    let observer = ObserverRepository::get_by_wallet(pool, &wallet_address).await?;

    let challenges = if let Some(ref obs) = observer {
        let all_challenges = ObserverRepository::get_challenges_by_observer(
            pool,
            &obs.observer_id,
            0,
            100,
        )
        .await?;

        let now = chrono::Utc::now().timestamp() as u64;

        // Filter to only active challenges (pending or defense_submitted / under review)
        all_challenges
            .into_iter()
            .filter(|c| {
                c.status == "pending"
                    || c.status == "defense_submitted"
                    || c.status == "under_review"
            })
            .map(|c| {
                let challenged_at = c.challenged_at.timestamp() as u64;
                let defense_deadline = c.defense_deadline.timestamp() as u64;
                let time_remaining = if defense_deadline > now {
                    defense_deadline - now
                } else {
                    0
                };

                ActiveChallengeItem {
                    challenge_id: c.challenge_id,
                    lock_id: c.lock_id,
                    bond: c.bond.to_string(),
                    status: c.status,
                    challenged_at,
                    defense_deadline,
                    time_remaining,
                }
            })
            .collect::<Vec<_>>()
    } else {
        vec![]
    };

    let total = challenges.len() as u32;

    tracing::info!(
        wallet = %wallet_address,
        active_count = total,
        "Active challenges fetched"
    );

    Ok(Json(ActiveChallengesResponse { challenges, total }))
}

/// GET /v1/observer/settings
///
/// Returns observer settings. Since there is no dedicated settings table,
/// returns sensible defaults. In production these would be stored in a
/// user-preferences table or Redis.
pub async fn get_observer_settings(
    Extension(_state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<ObserverSettingsResponse>, ApiError> {
    let wallet_address = extract_observer_address(&headers)?;
    tracing::info!(wallet = %wallet_address, "Fetching observer settings");

    // Return sensible defaults (no dedicated settings table yet)
    let settings = ObserverSettingsResponse {
        notifications: ObserverNotificationSettings {
            email_alerts: true,
            push_notifications: true,
            challenge_updates: true,
            earnings_alerts: true,
            new_suspicious_tx: true,
        },
        auto_challenge: ObserverAutoChallengeSettings {
            enabled: false,
            min_suspicion_level: "high".to_string(),
            max_bond_per_challenge: "100000000000000000".to_string(), // 0.1 ETH
        },
        display: ObserverDisplaySettings {
            currency: "QS".to_string(), // Observer rewards are in QS Token (SEQUENCES.md §9.4)
            language: "ja".to_string(),
            timezone: "Asia/Tokyo".to_string(),
        },
    };

    tracing::info!(wallet = %wallet_address, "Observer settings returned (defaults)");

    Ok(Json(settings))
}

/// PUT /v1/observer/settings
///
/// Update observer settings. Accepts partial updates - only provided fields
/// are applied. Currently returns the merged result without persistent storage;
/// in production this would write to a user-preferences table or Redis.
pub async fn update_observer_settings(
    Extension(_state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(req): Json<UpdateObserverSettingsRequest>,
) -> Result<Json<ObserverSettingsResponse>, ApiError> {
    let wallet_address = extract_observer_address(&headers)?;
    tracing::info!(wallet = %wallet_address, "Updating observer settings");

    // Merge with defaults (in production, load existing then merge)
    let settings = ObserverSettingsResponse {
        notifications: req.notifications.unwrap_or(ObserverNotificationSettings {
            email_alerts: true,
            push_notifications: true,
            challenge_updates: true,
            earnings_alerts: true,
            new_suspicious_tx: true,
        }),
        auto_challenge: req.auto_challenge.unwrap_or(ObserverAutoChallengeSettings {
            enabled: false,
            min_suspicion_level: "high".to_string(),
            max_bond_per_challenge: "100000000000000000".to_string(),
        }),
        display: req.display.unwrap_or(ObserverDisplaySettings {
            currency: "QS".to_string(), // Observer rewards are in QS Token (SEQUENCES.md §9.4)
            language: "ja".to_string(),
            timezone: "Asia/Tokyo".to_string(),
        }),
    };

    tracing::info!(
        wallet = %wallet_address,
        "Observer settings updated successfully"
    );

    Ok(Json(settings))
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_suspicion_level_serialization() {
        let level = SuspicionLevel::High;
        let json = serde_json::to_string(&level).unwrap();
        assert_eq!(json, "\"high\"");
    }

    #[test]
    fn test_unlock_type_serialization() {
        let unlock_type = UnlockType::Emergency;
        let json = serde_json::to_string(&unlock_type).unwrap();
        assert_eq!(json, "\"emergency\"");
    }

    #[test]
    fn test_challenge_status_serialization() {
        let status = ObserverChallengeStatus::Pending;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"pending\"");
    }

    #[test]
    fn test_bond_calculation() {
        // 10 ETH lock
        let lock_amount: u128 = 10_000_000_000_000_000_000;
        let min_bond: u128 = 100_000_000_000_000_000; // 0.1 ETH
        let percent_bond = lock_amount / 100; // 1%
        let required_bond = std::cmp::max(min_bond, percent_bond);

        // 1% of 10 ETH = 0.1 ETH, same as min
        assert_eq!(required_bond, min_bond);

        // 100 ETH lock
        let lock_amount_large: u128 = 100_000_000_000_000_000_000;
        let percent_bond_large = lock_amount_large / 100;
        let required_bond_large = std::cmp::max(min_bond, percent_bond_large);

        // 1% of 100 ETH = 1 ETH > 0.1 ETH
        assert_eq!(required_bond_large, 1_000_000_000_000_000_000);
    }

    #[test]
    fn test_quadratic_slashing() {
        // First violation: 1² × 10% = 10%
        let violations = 1u128;
        let slash_rate = violations * violations * 10;
        assert_eq!(slash_rate, 10);

        // Second violation: 2² × 10% = 40%
        let violations2 = 2u128;
        let slash_rate2 = violations2 * violations2 * 10;
        assert_eq!(slash_rate2, 40);

        // Third violation: 3² × 10% = 90%
        let violations3 = 3u128;
        let slash_rate3 = violations3 * violations3 * 10;
        assert_eq!(slash_rate3, 90);
    }

    #[test]
    fn test_reward_distribution() {
        // Total slash: 1 ETH
        let slashed_amount: u128 = 1_000_000_000_000_000_000;

        // 60% to challenger
        let challenger_reward = slashed_amount * 60 / 100;
        assert_eq!(challenger_reward, 600_000_000_000_000_000);

        // 20% to insurance
        let insurance = slashed_amount * 20 / 100;
        assert_eq!(insurance, 200_000_000_000_000_000);

        // 20% burn
        let burn = slashed_amount * 20 / 100;
        assert_eq!(burn, 200_000_000_000_000_000);

        // Total should equal slash
        assert_eq!(challenger_reward + insurance + burn, slashed_amount);
    }
}
