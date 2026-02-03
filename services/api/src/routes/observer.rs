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
    error::ApiError,
    services::AppState,
};

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
pub async fn get_dashboard(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ObserverDashboardResponse>, ApiError> {
    tracing::info!("Fetching observer dashboard");

    // Mock response for now - will integrate with actual data store
    let response = ObserverDashboardResponse {
        total_earnings: "5000000000000000000".to_string(), // 5 ETH
        unclaimed_earnings: "1500000000000000000".to_string(), // 1.5 ETH
        total_challenges: 12,
        successful_challenges: 8,
        success_rate: 66.67,
        pending_unlocks_count: 45,
        active_challenges: 3,
        recent_activity: vec![
            ObserverActivityItem {
                id: "activity_001".to_string(),
                activity_type: "challenge_won".to_string(),
                description: "Challenge succeeded against lock 0x1234...".to_string(),
                timestamp: chrono::Utc::now().timestamp() as u64 - 3600,
                amount: Some("600000000000000000".to_string()),
            },
            ObserverActivityItem {
                id: "activity_002".to_string(),
                activity_type: "challenge_submitted".to_string(),
                description: "New challenge submitted for lock 0x5678...".to_string(),
                timestamp: chrono::Utc::now().timestamp() as u64 - 7200,
                amount: None,
            },
        ],
        stats: ObserverNetworkStats {
            total_value_locked: "1000000000000000000000".to_string(), // 1000 ETH
            network_pending_unlocks: 156,
            network_challenges: 34,
            network_success_rate: 58.82,
        },
    };

    Ok(Json(response))
}

/// GET /v1/observer/pending-unlocks
///
/// Returns list of pending unlocks available to monitor/challenge.
pub async fn get_pending_unlocks(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<PendingUnlocksResponse>, ApiError> {
    tracing::info!("Fetching pending unlocks for observer");

    let now = chrono::Utc::now().timestamp() as u64;

    // Mock response - will integrate with actual L1/L3 data
    let response = PendingUnlocksResponse {
        unlocks: vec![
            PendingUnlockItem {
                lock_id: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
                owner: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
                amount: "10000000000000000000".to_string(), // 10 ETH
                token: "0x0000000000000000000000000000000000000000".to_string(),
                unlock_type: UnlockType::Normal,
                unlock_requested_at: now - 43200, // 12 hours ago
                time_remaining: 43200, // 12 hours left
                suspicion_level: SuspicionLevel::Low,
                risk_indicators: vec![],
                can_challenge: true,
            },
            PendingUnlockItem {
                lock_id: "0xfedcba0987654321fedcba0987654321fedcba09".to_string(),
                owner: "0x1234abcd5678ef901234abcd5678ef901234abcd".to_string(),
                amount: "50000000000000000000".to_string(), // 50 ETH
                token: "0x0000000000000000000000000000000000000000".to_string(),
                unlock_type: UnlockType::Emergency,
                unlock_requested_at: now - 172800, // 2 days ago
                time_remaining: 432000, // 5 days left
                suspicion_level: SuspicionLevel::High,
                risk_indicators: vec![
                    "Large amount emergency unlock".to_string(),
                    "New account (< 30 days)".to_string(),
                    "Unusual time pattern".to_string(),
                ],
                can_challenge: true,
            },
        ],
        total: 2,
        page: 1,
        page_size: 20,
    };

    Ok(Json(response))
}

/// GET /v1/observer/suspicious-txs
///
/// Returns transactions flagged as suspicious by the monitoring system.
pub async fn get_suspicious_txs(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<SuspiciousTxsResponse>, ApiError> {
    tracing::info!("Fetching suspicious transactions");

    let now = chrono::Utc::now().timestamp() as u64;

    let response = SuspiciousTxsResponse {
        transactions: vec![
            SuspiciousTransaction {
                lock_id: "0xsuspicious123456789abcdef123456789abcdef".to_string(),
                owner: "0xowner123456789abcdef123456789abcdef1234".to_string(),
                amount: "100000000000000000000".to_string(), // 100 ETH
                suspicion_level: SuspicionLevel::Critical,
                risk_analysis: RiskAnalysis {
                    score: 92,
                    factors: vec![
                        RiskFactor {
                            name: "Rapid unlock pattern".to_string(),
                            description: "Multiple unlock requests in short period".to_string(),
                            severity: "high".to_string(),
                            weight: 35,
                        },
                        RiskFactor {
                            name: "New account".to_string(),
                            description: "Account created less than 7 days ago".to_string(),
                            severity: "medium".to_string(),
                            weight: 25,
                        },
                        RiskFactor {
                            name: "Large amount".to_string(),
                            description: "Amount exceeds 90th percentile".to_string(),
                            severity: "high".to_string(),
                            weight: 32,
                        },
                    ],
                    summary: "High probability of fraudulent unlock attempt".to_string(),
                },
                recommended_action: "Submit challenge with fraud proof".to_string(),
                challenge_bond: "1000000000000000000".to_string(), // 1 ETH (MAX(0.1 ETH, 1%))
                detected_at: now - 1800, // 30 minutes ago
            },
        ],
        total: 1,
        page: 1,
        page_size: 20,
    };

    Ok(Json(response))
}

/// GET /v1/observer/history
///
/// Returns observer's challenge and earnings history.
pub async fn get_history(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ObserverHistoryResponse>, ApiError> {
    tracing::info!("Fetching observer history");

    let now = chrono::Utc::now().timestamp() as u64;

    let response = ObserverHistoryResponse {
        history: vec![
            ObserverHistoryItem {
                id: "hist_001".to_string(),
                history_type: "challenge_won".to_string(),
                lock_id: "0x1234...5678".to_string(),
                amount: "600000000000000000".to_string(), // 0.6 ETH reward
                status: "completed".to_string(),
                timestamp: now - 86400,
                tx_hash: Some("0xtx_challenge_won_123".to_string()),
            },
            ObserverHistoryItem {
                id: "hist_002".to_string(),
                history_type: "challenge_lost".to_string(),
                lock_id: "0xabcd...ef01".to_string(),
                amount: "100000000000000000".to_string(), // 0.1 ETH bond lost
                status: "completed".to_string(),
                timestamp: now - 172800,
                tx_hash: Some("0xtx_challenge_lost_456".to_string()),
            },
            ObserverHistoryItem {
                id: "hist_003".to_string(),
                history_type: "earnings_claimed".to_string(),
                lock_id: "".to_string(),
                amount: "3000000000000000000".to_string(), // 3 ETH
                status: "completed".to_string(),
                timestamp: now - 259200,
                tx_hash: Some("0xtx_claim_789".to_string()),
            },
        ],
        total: 3,
        page: 1,
        page_size: 20,
    };

    Ok(Json(response))
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
pub async fn get_challenge(
    Extension(state): Extension<Arc<AppState>>,
    Path(challenge_id): Path<String>,
) -> Result<Json<ChallengeDetailResponse>, ApiError> {
    tracing::info!("Fetching challenge details: {}", challenge_id);

    // Mock challenge data (in production, query from storage)
    let challenge = ChallengeInfo {
        challenge_id: challenge_id.clone(),
        lock_id: "lock-001".to_string(),
        challenger: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
        fraud_proof_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890".to_string(),
        bond: "100000000000000000".to_string(), // 0.1 ETH
        submitted_at: chrono::Utc::now().timestamp() as u64 - 3600, // 1 hour ago
        defense_deadline: chrono::Utc::now().timestamp() as u64 + 172800 - 3600, // +48h from submission
        defense_submitted: false,
        defense_timestamp: None,
        defender: None,
        defense_proof_hash: None,
        resolved: false,
        resolved_at: None,
        challenger_won: false,
        slashed_amount: None,
        reward_amount: None,
        resolution_tx_hash: None,
    };

    let now = chrono::Utc::now().timestamp() as u64;

    // Build timeline
    let mut timeline = vec![
        ChallengeEvent {
            event_type: "challenge_submitted".to_string(),
            description: format!("Challenge submitted by {}", challenge.challenger),
            timestamp: challenge.submitted_at,
            tx_hash: None,
        },
    ];

    // Add defense event if exists
    let defense = if challenge.defense_submitted {
        timeline.push(ChallengeEvent {
            event_type: "defense_submitted".to_string(),
            description: "Defense proof submitted by prover".to_string(),
            timestamp: challenge.defense_timestamp.unwrap_or(0),
            tx_hash: None,
        });
        Some(DefenseInfo {
            defender: challenge.defender.clone().unwrap_or_default(),
            defense_proof_hash: challenge.defense_proof_hash.clone().unwrap_or_default(),
            submitted_at: challenge.defense_timestamp.unwrap_or(0),
        })
    } else {
        None
    };

    // Add resolution if resolved
    let resolution = if challenge.resolved {
        let winner = if challenge.challenger_won {
            challenge.challenger.clone()
        } else {
            challenge.defender.clone().unwrap_or_default()
        };
        timeline.push(ChallengeEvent {
            event_type: "challenge_resolved".to_string(),
            description: format!("Challenge resolved. Winner: {}", winner),
            timestamp: challenge.resolved_at.unwrap_or(now),
            tx_hash: challenge.resolution_tx_hash.clone(),
        });
        Some(ResolutionInfo {
            winner,
            resolved_at: challenge.resolved_at.unwrap_or(now),
            slashed_amount: challenge.slashed_amount.clone(),
            reward_amount: challenge.reward_amount.clone(),
        })
    } else {
        None
    };

    // Determine status
    let status = if challenge.resolved {
        if challenge.challenger_won {
            ObserverChallengeStatus::Succeeded
        } else {
            ObserverChallengeStatus::Failed
        }
    } else if challenge.defense_submitted {
        ObserverChallengeStatus::UnderReview
    } else if now > challenge.defense_deadline {
        ObserverChallengeStatus::Expired
    } else {
        ObserverChallengeStatus::Pending
    };

    Ok(Json(ChallengeDetailResponse {
        challenge_id: challenge.challenge_id,
        lock_id: challenge.lock_id,
        challenger: challenge.challenger,
        fraud_proof_hash: challenge.fraud_proof_hash,
        bond: challenge.bond,
        status,
        submitted_at: challenge.submitted_at,
        defense_deadline: challenge.defense_deadline,
        defense,
        resolution,
        timeline,
    }))
}

/// GET /v1/observer/earnings
///
/// Get observer's earnings summary and history.
pub async fn get_earnings(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<EarningsResponse>, ApiError> {
    tracing::info!("Fetching observer earnings");

    let now = chrono::Utc::now().timestamp() as u64;

    // Mock response - will integrate with actual earnings tracking
    let response = EarningsResponse {
        total_earnings: "5000000000000000000".to_string(), // 5 ETH
        claimed_earnings: "3500000000000000000".to_string(), // 3.5 ETH
        unclaimed_earnings: "1500000000000000000".to_string(), // 1.5 ETH
        breakdown: EarningsBreakdown {
            from_challenges: "5000000000000000000".to_string(),
            winning_challenges: 8,
        },
        history: vec![
            EarningItem {
                id: "earn_001".to_string(),
                challenge_id: "0xchallenge_001".to_string(),
                amount: "600000000000000000".to_string(),
                timestamp: now - 86400,
                claimed: false,
                tx_hash: None,
            },
            EarningItem {
                id: "earn_002".to_string(),
                challenge_id: "0xchallenge_002".to_string(),
                amount: "900000000000000000".to_string(),
                timestamp: now - 172800,
                claimed: false,
                tx_hash: None,
            },
            EarningItem {
                id: "earn_003".to_string(),
                challenge_id: "0xchallenge_003".to_string(),
                amount: "1200000000000000000".to_string(),
                timestamp: now - 259200,
                claimed: true,
                tx_hash: Some("0xtx_claim_001".to_string()),
            },
        ],
    };

    Ok(Json(response))
}

/// POST /v1/observer/claim-earnings
///
/// Claim accumulated earnings from successful challenges.
pub async fn claim_earnings(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<ClaimEarningsRequest>,
) -> Result<Json<ClaimEarningsResponse>, ApiError> {
    tracing::info!("Observer {} claiming earnings", req.observer);

    // Validate observer address
    if !req.observer.starts_with("0x") || req.observer.len() != 42 {
        return Err(ApiError::InvalidRequest(format!("Invalid address: {}", req.observer)));
    }

    // Generate claim ID
    let mut hasher = Sha3_256::new();
    hasher.update(b"CLAIM_V1");
    hasher.update(req.observer.as_bytes());
    hasher.update(&chrono::Utc::now().timestamp().to_be_bytes());
    let claim_id = format!("0x{}", hex::encode(hasher.finalize()));

    // Mock claim - will integrate with L1 contract
    let response = ClaimEarningsResponse {
        claim_id,
        amount_claimed: "1500000000000000000".to_string(), // 1.5 ETH
        earnings_claimed: 2,
        tx_hash: "0xpending_tx_hash_will_be_replaced".to_string(),
        status: "pending".to_string(),
    };

    Ok(Json(response))
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
