//! Explorer API implementation
//!
//! TASK-P5-024: Explorer API (12 EP)
//!
//! Provides public blockchain explorer endpoints for:
//! - System overview and analytics
//! - Lock/Unlock transaction browsing
//! - Challenge monitoring
//! - Address activity lookup
//! - Prover information
//!
//! Spec References:
//! - TASK_P5_FULL_LIST.md §Phase 5.4
//! - UNIFIED_SPEC §Explorer

use std::sync::Arc;

use axum::{Extension, Json, extract::{Path, Query}};
use serde::{Deserialize, Serialize};

use crate::{
    error::ApiError,
    services::AppState,
    types::{LockStatus, ChallengeStatus, ProverStatus},
};

// ============================================================================
// Query Parameters
// ============================================================================

/// Common pagination parameters
#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    /// Page number (1-indexed, default: 1)
    pub page: Option<u32>,
    /// Items per page (max: 100, default: 20)
    pub limit: Option<u32>,
}

/// Search query parameters
#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    /// Search query string
    pub q: String,
    /// Filter by entity type: lock, unlock, address, prover, challenge
    #[serde(rename = "type")]
    pub entity_type: Option<String>,
}

/// Locks list query parameters
#[derive(Debug, Deserialize)]
pub struct LocksQuery {
    /// Filter by status
    pub status: Option<LockStatus>,
    /// Filter by asset
    pub asset: Option<String>,
    /// Filter by chain ID
    pub chain_id: Option<u64>,
    /// Page number
    pub page: Option<u32>,
    /// Items per page
    pub limit: Option<u32>,
}

/// Unlocks list query parameters
#[derive(Debug, Deserialize)]
pub struct UnlocksQuery {
    /// Filter by lock ID
    pub lock_id: Option<String>,
    /// Filter by emergency unlocks only
    pub emergency_only: Option<bool>,
    /// Page number
    pub page: Option<u32>,
    /// Items per page
    pub limit: Option<u32>,
}

/// Challenges list query parameters
#[derive(Debug, Deserialize)]
pub struct ChallengesQuery {
    /// Filter by status
    pub status: Option<ChallengeStatus>,
    /// Page number
    pub page: Option<u32>,
    /// Items per page
    pub limit: Option<u32>,
}

/// Provers list query parameters
#[derive(Debug, Deserialize)]
pub struct ProversQuery {
    /// Filter by status
    pub status: Option<ProverStatus>,
    /// Sort by: stake, signatures, joined
    pub sort_by: Option<String>,
    /// Sort order: asc, desc
    pub order: Option<String>,
    /// Page number
    pub page: Option<u32>,
    /// Items per page
    pub limit: Option<u32>,
}

// ============================================================================
// Response Types
// ============================================================================

/// GET /v1/explorer/overview response
#[derive(Debug, Serialize)]
pub struct ExplorerOverviewResponse {
    /// Total Value Locked (TVL) in ETH
    #[serde(rename = "tvl")]
    pub tvl: String,
    /// TVL in USD
    #[serde(rename = "tvlUsd")]
    pub tvl_usd: String,
    /// Total number of locks
    #[serde(rename = "totalLocks")]
    pub total_locks: u64,
    /// Total number of unlocks completed
    #[serde(rename = "totalUnlocks")]
    pub total_unlocks: u64,
    /// Total number of active challenges
    #[serde(rename = "activeChallenges")]
    pub active_challenges: u32,
    /// Total number of registered provers
    #[serde(rename = "totalProvers")]
    pub total_provers: u32,
    /// Active provers count
    #[serde(rename = "activeProvers")]
    pub active_provers: u32,
    /// 24h volume in ETH
    #[serde(rename = "volume24h")]
    pub volume_24h: String,
    /// 24h transactions count
    #[serde(rename = "transactions24h")]
    pub transactions_24h: u64,
    /// Average proof time in seconds
    #[serde(rename = "avgProofTime")]
    pub avg_proof_time: f64,
    /// Current edition
    pub edition: String,
    /// Network statistics
    pub network: NetworkStats,
}

#[derive(Debug, Serialize)]
pub struct NetworkStats {
    /// Latest block number
    #[serde(rename = "latestBlock")]
    pub latest_block: u64,
    /// Latest L3 state root
    #[serde(rename = "latestStateRoot")]
    pub latest_state_root: String,
    /// Last state root submission time
    #[serde(rename = "lastSubmissionTime")]
    pub last_submission_time: u64,
    /// Supported chains
    #[serde(rename = "supportedChains")]
    pub supported_chains: Vec<ChainInfo>,
}

#[derive(Debug, Serialize)]
pub struct ChainInfo {
    #[serde(rename = "chainId")]
    pub chain_id: u64,
    pub name: String,
    #[serde(rename = "isActive")]
    pub is_active: bool,
}

/// GET /v1/explorer/search response
#[derive(Debug, Serialize)]
pub struct SearchResponse {
    /// Search results
    pub results: Vec<SearchResult>,
    /// Total matching results
    pub total: u64,
    /// Query string
    pub query: String,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    /// Result type: lock, unlock, address, prover, challenge
    #[serde(rename = "type")]
    pub result_type: String,
    /// Entity ID
    pub id: String,
    /// Display title
    pub title: String,
    /// Brief description
    pub description: String,
    /// Match relevance score (0-100)
    pub score: u32,
    /// Timestamp (if applicable)
    pub timestamp: Option<u64>,
}

/// GET /v1/explorer/locks response
#[derive(Debug, Serialize)]
pub struct LocksListResponse {
    /// List of locks
    pub locks: Vec<ExplorerLock>,
    /// Total number of locks matching filter
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Items per page
    pub limit: u32,
}

#[derive(Debug, Serialize)]
pub struct ExplorerLock {
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Owner address
    pub owner: String,
    /// Asset type
    pub asset: String,
    /// Locked amount
    pub amount: String,
    /// Chain ID
    #[serde(rename = "chainId")]
    pub chain_id: u64,
    /// Lock status
    pub status: LockStatus,
    /// Creation timestamp
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    /// State root SR_0 (SHA3-256 hash)
    #[serde(rename = "sr0")]
    pub sr_0: String,
}

/// GET /v1/explorer/locks/:id response
#[derive(Debug, Serialize)]
pub struct LockDetailResponse {
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Owner address
    pub owner: String,
    /// Destination address
    #[serde(rename = "destAddr")]
    pub dest_addr: String,
    /// Asset type
    pub asset: String,
    /// Locked amount
    pub amount: String,
    /// Chain ID
    #[serde(rename = "chainId")]
    pub chain_id: u64,
    /// Lock status
    pub status: LockStatus,
    /// Creation timestamp
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    /// Expiry timestamp
    pub expiry: u64,
    /// State root SR_0 (SHA3-256)
    #[serde(rename = "sr0")]
    pub sr_0: String,
    /// SMT proof
    #[serde(rename = "smtProof")]
    pub smt_proof: String,
    /// Release time (if unlocking)
    #[serde(rename = "releaseTime")]
    pub release_time: Option<u64>,
    /// Is emergency unlock
    #[serde(rename = "isEmergency")]
    pub is_emergency: bool,
    /// Related unlock (if exists)
    #[serde(rename = "relatedUnlock")]
    pub related_unlock: Option<RelatedUnlock>,
    /// Challenge info (if challenged)
    #[serde(rename = "challengeInfo")]
    pub challenge_info: Option<ChallengeInfoBrief>,
    /// Transaction timeline
    pub timeline: Vec<TimelineEvent>,
}

#[derive(Debug, Serialize)]
pub struct RelatedUnlock {
    #[serde(rename = "unlockId")]
    pub unlock_id: String,
    pub status: String,
    #[serde(rename = "releaseTime")]
    pub release_time: u64,
    #[serde(rename = "signaturesCollected")]
    pub signatures_collected: u32,
    #[serde(rename = "signaturesRequired")]
    pub signatures_required: u32,
}

#[derive(Debug, Serialize)]
pub struct ChallengeInfoBrief {
    #[serde(rename = "challengeId")]
    pub challenge_id: String,
    pub challenger: String,
    pub status: ChallengeStatus,
    #[serde(rename = "defenseDeadline")]
    pub defense_deadline: u64,
}

#[derive(Debug, Serialize)]
pub struct TimelineEvent {
    /// Event type
    pub event: String,
    /// Timestamp
    pub timestamp: u64,
    /// Transaction hash (if on-chain)
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
    /// Description
    pub description: String,
}

/// GET /v1/explorer/unlocks response
#[derive(Debug, Serialize)]
pub struct UnlocksListResponse {
    /// List of unlocks
    pub unlocks: Vec<ExplorerUnlock>,
    /// Total count
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Items per page
    pub limit: u32,
}

#[derive(Debug, Serialize)]
pub struct ExplorerUnlock {
    /// Unlock ID
    #[serde(rename = "unlockId")]
    pub unlock_id: String,
    /// Related lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Owner address
    pub owner: String,
    /// Amount
    pub amount: String,
    /// Asset type
    pub asset: String,
    /// Release time
    #[serde(rename = "releaseTime")]
    pub release_time: u64,
    /// Is emergency unlock
    #[serde(rename = "isEmergency")]
    pub is_emergency: bool,
    /// Status
    pub status: String,
    /// Created timestamp
    #[serde(rename = "createdAt")]
    pub created_at: u64,
}

/// GET /v1/explorer/unlocks/:id response
#[derive(Debug, Serialize)]
pub struct UnlockDetailResponse {
    /// Unlock ID
    #[serde(rename = "unlockId")]
    pub unlock_id: String,
    /// Related lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Owner address
    pub owner: String,
    /// Destination address
    #[serde(rename = "destAddr")]
    pub dest_addr: String,
    /// Amount
    pub amount: String,
    /// Asset type
    pub asset: String,
    /// Release time
    #[serde(rename = "releaseTime")]
    pub release_time: u64,
    /// Time lock hours
    #[serde(rename = "timeLockHours")]
    pub time_lock_hours: u64,
    /// Is emergency unlock
    #[serde(rename = "isEmergency")]
    pub is_emergency: bool,
    /// Emergency bond (if applicable)
    #[serde(rename = "emergencyBond")]
    pub emergency_bond: Option<String>,
    /// Status
    pub status: String,
    /// State root SR_1
    #[serde(rename = "sr1")]
    pub sr_1: String,
    /// VRF request ID
    #[serde(rename = "vrfRequestId")]
    pub vrf_request_id: Option<String>,
    /// Selected provers
    #[serde(rename = "selectedProvers")]
    pub selected_provers: Vec<String>,
    /// Prover signatures
    #[serde(rename = "proverSignatures")]
    pub prover_signatures: Vec<ProverSignatureInfo>,
    /// Required signatures
    #[serde(rename = "signaturesRequired")]
    pub signatures_required: u32,
    /// Created timestamp
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    /// Timeline
    pub timeline: Vec<TimelineEvent>,
}

#[derive(Debug, Serialize)]
pub struct ProverSignatureInfo {
    #[serde(rename = "proverId")]
    pub prover_id: String,
    #[serde(rename = "signedAt")]
    pub signed_at: u64,
    pub verified: bool,
}

/// GET /v1/explorer/challenges response
#[derive(Debug, Serialize)]
pub struct ChallengesListResponse {
    /// List of challenges
    pub challenges: Vec<ExplorerChallenge>,
    /// Total count
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Items per page
    pub limit: u32,
}

#[derive(Debug, Serialize)]
pub struct ExplorerChallenge {
    /// Challenge ID
    #[serde(rename = "challengeId")]
    pub challenge_id: String,
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Challenger address
    pub challenger: String,
    /// Bond amount
    pub bond: String,
    /// Status
    pub status: ChallengeStatus,
    /// Challenge timestamp
    #[serde(rename = "challengedAt")]
    pub challenged_at: u64,
    /// Defense deadline
    #[serde(rename = "defenseDeadline")]
    pub defense_deadline: u64,
}

/// GET /v1/explorer/challenges/:id response
#[derive(Debug, Serialize)]
pub struct ChallengeDetailResponse {
    /// Challenge ID
    #[serde(rename = "challengeId")]
    pub challenge_id: String,
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Challenger address
    pub challenger: String,
    /// Fraud proof hash (SHA3-256)
    #[serde(rename = "fraudProofHash")]
    pub fraud_proof_hash: String,
    /// Bond amount
    pub bond: String,
    /// Status
    pub status: ChallengeStatus,
    /// Challenge timestamp
    #[serde(rename = "challengedAt")]
    pub challenged_at: u64,
    /// Defense deadline (48 hours from challenge)
    #[serde(rename = "defenseDeadline")]
    pub defense_deadline: u64,
    /// Defender (prover) address
    pub defender: Option<String>,
    /// Defense proof hash
    #[serde(rename = "defenseProofHash")]
    pub defense_proof_hash: Option<String>,
    /// Resolution details
    pub resolution: Option<ChallengeResolution>,
    /// Timeline
    pub timeline: Vec<TimelineEvent>,
}

#[derive(Debug, Serialize)]
pub struct ChallengeResolution {
    /// Challenge was valid (prover at fault)
    #[serde(rename = "challengeValid")]
    pub challenge_valid: bool,
    /// Slash amount
    #[serde(rename = "slashAmount")]
    pub slash_amount: String,
    /// Challenger reward
    #[serde(rename = "challengerReward")]
    pub challenger_reward: String,
    /// Insurance fund amount
    #[serde(rename = "insuranceAmount")]
    pub insurance_amount: String,
    /// Burn amount
    #[serde(rename = "burnAmount")]
    pub burn_amount: String,
    /// Resolution timestamp
    #[serde(rename = "resolvedAt")]
    pub resolved_at: u64,
}

/// GET /v1/explorer/address/:addr response
#[derive(Debug, Serialize)]
pub struct AddressActivityResponse {
    /// Address
    pub address: String,
    /// Total locks created by address
    #[serde(rename = "totalLocks")]
    pub total_locks: u64,
    /// Total unlocks
    #[serde(rename = "totalUnlocks")]
    pub total_unlocks: u64,
    /// Total volume in ETH
    #[serde(rename = "totalVolume")]
    pub total_volume: String,
    /// Current locked balance
    #[serde(rename = "lockedBalance")]
    pub locked_balance: String,
    /// Is prover
    #[serde(rename = "isProver")]
    pub is_prover: bool,
    /// Prover ID (if prover)
    #[serde(rename = "proverId")]
    pub prover_id: Option<String>,
    /// Recent transactions
    #[serde(rename = "recentTransactions")]
    pub recent_transactions: Vec<AddressTransaction>,
    /// First seen timestamp
    #[serde(rename = "firstSeen")]
    pub first_seen: u64,
    /// Last seen timestamp
    #[serde(rename = "lastSeen")]
    pub last_seen: u64,
}

#[derive(Debug, Serialize)]
pub struct AddressTransaction {
    /// Transaction type: lock, unlock, challenge
    #[serde(rename = "type")]
    pub tx_type: String,
    /// Reference ID
    pub id: String,
    /// Amount
    pub amount: String,
    /// Asset
    pub asset: String,
    /// Timestamp
    pub timestamp: u64,
    /// Status
    pub status: String,
}

/// GET /v1/explorer/provers response
#[derive(Debug, Serialize)]
pub struct ProversListResponse {
    /// List of provers
    pub provers: Vec<ExplorerProver>,
    /// Total count
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Items per page
    pub limit: u32,
}

#[derive(Debug, Serialize)]
pub struct ExplorerProver {
    /// Prover ID
    #[serde(rename = "proverId")]
    pub prover_id: String,
    /// Operator address
    #[serde(rename = "operatorAddr")]
    pub operator_addr: String,
    /// Status
    pub status: ProverStatus,
    /// Stake amount
    #[serde(rename = "stakeAmount")]
    pub stake_amount: String,
    /// Total signatures
    #[serde(rename = "totalSignatures")]
    pub total_signatures: u64,
    /// Uptime percentage
    #[serde(rename = "uptimePercent")]
    pub uptime_percent: f64,
    /// Joined timestamp
    #[serde(rename = "joinedAt")]
    pub joined_at: u64,
}

/// GET /v1/explorer/provers/:id response
#[derive(Debug, Serialize)]
pub struct ProverDetailResponse {
    /// Prover ID
    #[serde(rename = "proverId")]
    pub prover_id: String,
    /// Operator address
    #[serde(rename = "operatorAddr")]
    pub operator_addr: String,
    /// SPHINCS+ public key fingerprint (SHA3-256)
    #[serde(rename = "sphincsPubkeyFingerprint")]
    pub sphincs_pubkey_fingerprint: String,
    /// Status
    pub status: ProverStatus,
    /// Stake amount
    #[serde(rename = "stakeAmount")]
    pub stake_amount: String,
    /// Total signatures
    #[serde(rename = "totalSignatures")]
    pub total_signatures: u64,
    /// Signatures in last 24h
    #[serde(rename = "signatures24h")]
    pub signatures_24h: u64,
    /// Total rewards earned
    #[serde(rename = "totalRewards")]
    pub total_rewards: String,
    /// Uptime percentage
    #[serde(rename = "uptimePercent")]
    pub uptime_percent: f64,
    /// Slash count
    #[serde(rename = "slashCount")]
    pub slash_count: u32,
    /// Total slashed
    #[serde(rename = "totalSlashed")]
    pub total_slashed: String,
    /// Joined timestamp
    #[serde(rename = "joinedAt")]
    pub joined_at: u64,
    /// Last activity timestamp
    #[serde(rename = "lastActivity")]
    pub last_activity: u64,
    /// Recent activity
    #[serde(rename = "recentActivity")]
    pub recent_activity: Vec<ProverActivityItem>,
    /// Slashing history
    #[serde(rename = "slashingHistory")]
    pub slashing_history: Vec<SlashingHistoryItem>,
}

#[derive(Debug, Serialize)]
pub struct ProverActivityItem {
    /// Activity type: signature, challenge, slashing
    #[serde(rename = "type")]
    pub activity_type: String,
    /// Reference ID
    pub id: String,
    /// Timestamp
    pub timestamp: u64,
    /// Details
    pub details: String,
}

#[derive(Debug, Serialize)]
pub struct SlashingHistoryItem {
    /// Challenge ID
    #[serde(rename = "challengeId")]
    pub challenge_id: String,
    /// Slash amount
    pub amount: String,
    /// Reason
    pub reason: String,
    /// Timestamp
    pub timestamp: u64,
}

/// GET /v1/explorer/analytics response
#[derive(Debug, Serialize)]
pub struct AnalyticsResponse {
    /// TVL history (daily)
    #[serde(rename = "tvlHistory")]
    pub tvl_history: Vec<TimeSeriesPoint>,
    /// Volume history (daily)
    #[serde(rename = "volumeHistory")]
    pub volume_history: Vec<TimeSeriesPoint>,
    /// Transaction count history (daily)
    #[serde(rename = "txCountHistory")]
    pub tx_count_history: Vec<TimeSeriesPoint>,
    /// Asset breakdown
    #[serde(rename = "assetBreakdown")]
    pub asset_breakdown: Vec<AssetBreakdown>,
    /// Chain breakdown
    #[serde(rename = "chainBreakdown")]
    pub chain_breakdown: Vec<ChainBreakdown>,
    /// Prover statistics
    #[serde(rename = "proverStats")]
    pub prover_stats: ProverAnalytics,
    /// Challenge statistics
    #[serde(rename = "challengeStats")]
    pub challenge_stats: ChallengeAnalytics,
}

#[derive(Debug, Serialize)]
pub struct TimeSeriesPoint {
    /// Unix timestamp
    pub timestamp: u64,
    /// Value
    pub value: String,
}

#[derive(Debug, Serialize)]
pub struct AssetBreakdown {
    /// Asset symbol
    pub asset: String,
    /// Total locked
    #[serde(rename = "totalLocked")]
    pub total_locked: String,
    /// Percentage of TVL
    pub percentage: f64,
}

#[derive(Debug, Serialize)]
pub struct ChainBreakdown {
    /// Chain ID
    #[serde(rename = "chainId")]
    pub chain_id: u64,
    /// Chain name
    pub name: String,
    /// TVL on chain
    pub tvl: String,
    /// Transaction count
    #[serde(rename = "txCount")]
    pub tx_count: u64,
}

#[derive(Debug, Serialize)]
pub struct ProverAnalytics {
    /// Total provers
    #[serde(rename = "totalProvers")]
    pub total_provers: u32,
    /// Active provers
    #[serde(rename = "activeProvers")]
    pub active_provers: u32,
    /// Total stake
    #[serde(rename = "totalStake")]
    pub total_stake: String,
    /// Average uptime
    #[serde(rename = "avgUptime")]
    pub avg_uptime: f64,
    /// Total signatures (all time)
    #[serde(rename = "totalSignatures")]
    pub total_signatures: u64,
}

#[derive(Debug, Serialize)]
pub struct ChallengeAnalytics {
    /// Total challenges
    #[serde(rename = "totalChallenges")]
    pub total_challenges: u32,
    /// Successful challenges
    #[serde(rename = "successfulChallenges")]
    pub successful_challenges: u32,
    /// Total slashed
    #[serde(rename = "totalSlashed")]
    pub total_slashed: String,
    /// Challenge success rate
    #[serde(rename = "successRate")]
    pub success_rate: f64,
}

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// GET /v1/explorer/overview
///
/// Returns system-wide overview statistics including TVL, transaction counts,
/// and network status.
pub async fn get_overview(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ExplorerOverviewResponse>, ApiError> {
    tracing::debug!("Explorer: Getting overview");

    // Mock data - in production this queries Redis/blockchain
    let response = ExplorerOverviewResponse {
        tvl: "12500000000000000000000".to_string(), // 12,500 ETH
        tvl_usd: "31250000".to_string(), // $31.25M
        total_locks: 15420,
        total_unlocks: 12350,
        active_challenges: 3,
        total_provers: 25,
        active_provers: 22,
        volume_24h: "1250000000000000000000".to_string(), // 1,250 ETH
        transactions_24h: 342,
        avg_proof_time: 2.5, // 2.5 seconds
        edition: "Decentralized".to_string(),
        network: NetworkStats {
            latest_block: 19234567,
            latest_state_root: "0x8f3a...b2c1".to_string(),
            last_submission_time: 1736640000,
            supported_chains: vec![
                ChainInfo {
                    chain_id: 1,
                    name: "Ethereum Mainnet".to_string(),
                    is_active: true,
                },
                ChainInfo {
                    chain_id: 42161,
                    name: "Arbitrum One".to_string(),
                    is_active: true,
                },
            ],
        },
    };

    Ok(Json(response))
}

/// GET /v1/explorer/search
///
/// Unified search across locks, unlocks, addresses, provers, and challenges.
pub async fn search(
    Extension(_state): Extension<Arc<AppState>>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<SearchResponse>, ApiError> {
    tracing::debug!("Explorer: Searching for '{}'", query.q);

    // Mock data - in production this searches across Redis indices
    let results = vec![
        SearchResult {
            result_type: "lock".to_string(),
            id: "lock-abc123".to_string(),
            title: "Lock #abc123".to_string(),
            description: "5.0 ETH locked on Ethereum".to_string(),
            score: 95,
            timestamp: Some(1736553600),
        },
        SearchResult {
            result_type: "address".to_string(),
            id: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
            title: "Address 0x1234...5678".to_string(),
            description: "15 locks, 12 unlocks, Active user".to_string(),
            score: 85,
            timestamp: None,
        },
    ];

    Ok(Json(SearchResponse {
        results,
        total: 2,
        query: query.q,
    }))
}

/// GET /v1/explorer/locks
///
/// Returns paginated list of locks with optional filtering.
pub async fn list_locks(
    Extension(_state): Extension<Arc<AppState>>,
    Query(query): Query<LocksQuery>,
) -> Result<Json<LocksListResponse>, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100);

    tracing::debug!("Explorer: Listing locks page={} limit={}", page, limit);

    // Mock data
    let locks = vec![
        ExplorerLock {
            lock_id: "lock-001".to_string(),
            owner: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
            asset: "ETH".to_string(),
            amount: "5000000000000000000".to_string(), // 5 ETH
            chain_id: 1,
            status: LockStatus::Locked,
            created_at: 1736553600,
            sr_0: "0x8f3a7b2c1d4e5f6a...".to_string(),
        },
        ExplorerLock {
            lock_id: "lock-002".to_string(),
            owner: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
            asset: "USDC".to_string(),
            amount: "10000000000".to_string(), // 10,000 USDC (6 decimals)
            chain_id: 1,
            status: LockStatus::UnlockPending,
            created_at: 1736467200,
            sr_0: "0x2a3b4c5d6e7f8a9b...".to_string(),
        },
    ];

    Ok(Json(LocksListResponse {
        locks,
        total: 15420,
        page,
        limit,
    }))
}

/// GET /v1/explorer/locks/:id
///
/// Returns detailed information about a specific lock.
pub async fn get_lock(
    Extension(_state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<LockDetailResponse>, ApiError> {
    tracing::debug!("Explorer: Getting lock {}", lock_id);

    // Mock data
    let response = LockDetailResponse {
        lock_id: lock_id.clone(),
        owner: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
        dest_addr: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
        asset: "ETH".to_string(),
        amount: "5000000000000000000".to_string(),
        chain_id: 1,
        status: LockStatus::Locked,
        created_at: 1736553600,
        expiry: 1737158400,
        sr_0: "0x8f3a7b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a".to_string(),
        smt_proof: "0x...".to_string(),
        release_time: None,
        is_emergency: false,
        related_unlock: None,
        challenge_info: None,
        timeline: vec![
            TimelineEvent {
                event: "lock_created".to_string(),
                timestamp: 1736553600,
                tx_hash: Some("0xabc123...".to_string()),
                description: "Lock created with 5 ETH".to_string(),
            },
            TimelineEvent {
                event: "l1_confirmed".to_string(),
                timestamp: 1736553720,
                tx_hash: Some("0xdef456...".to_string()),
                description: "Lock confirmed on L1".to_string(),
            },
        ],
    };

    Ok(Json(response))
}

/// GET /v1/explorer/unlocks
///
/// Returns paginated list of unlocks with optional filtering.
pub async fn list_unlocks(
    Extension(_state): Extension<Arc<AppState>>,
    Query(query): Query<UnlocksQuery>,
) -> Result<Json<UnlocksListResponse>, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100);

    tracing::debug!("Explorer: Listing unlocks page={} limit={}", page, limit);

    // Mock data
    let unlocks = vec![
        ExplorerUnlock {
            unlock_id: "unlock-001".to_string(),
            lock_id: "lock-001".to_string(),
            owner: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
            amount: "5000000000000000000".to_string(),
            asset: "ETH".to_string(),
            release_time: 1736640000,
            is_emergency: false,
            status: "pending_signatures".to_string(),
            created_at: 1736553600,
        },
        ExplorerUnlock {
            unlock_id: "unlock-002".to_string(),
            lock_id: "lock-002".to_string(),
            owner: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
            amount: "10000000000".to_string(),
            asset: "USDC".to_string(),
            release_time: 1737244800,
            is_emergency: true,
            status: "emergency_pending".to_string(),
            created_at: 1736467200,
        },
    ];

    Ok(Json(UnlocksListResponse {
        unlocks,
        total: 12350,
        page,
        limit,
    }))
}

/// GET /v1/explorer/unlocks/:id
///
/// Returns detailed information about a specific unlock.
pub async fn get_unlock(
    Extension(_state): Extension<Arc<AppState>>,
    Path(unlock_id): Path<String>,
) -> Result<Json<UnlockDetailResponse>, ApiError> {
    tracing::debug!("Explorer: Getting unlock {}", unlock_id);

    // Mock data
    let response = UnlockDetailResponse {
        unlock_id: unlock_id.clone(),
        lock_id: "lock-001".to_string(),
        owner: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
        dest_addr: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
        amount: "5000000000000000000".to_string(),
        asset: "ETH".to_string(),
        release_time: 1736640000,
        time_lock_hours: 24,
        is_emergency: false,
        emergency_bond: None,
        status: "pending_signatures".to_string(),
        sr_1: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b".to_string(),
        vrf_request_id: Some("vrf-12345".to_string()),
        selected_provers: vec![
            "prover-001".to_string(),
            "prover-002".to_string(),
            "prover-003".to_string(),
        ],
        prover_signatures: vec![
            ProverSignatureInfo {
                prover_id: "prover-001".to_string(),
                signed_at: 1736556600,
                verified: true,
            },
            ProverSignatureInfo {
                prover_id: "prover-002".to_string(),
                signed_at: 1736556720,
                verified: true,
            },
        ],
        signatures_required: 3,
        created_at: 1736553600,
        timeline: vec![
            TimelineEvent {
                event: "unlock_requested".to_string(),
                timestamp: 1736553600,
                tx_hash: None,
                description: "Unlock request submitted".to_string(),
            },
            TimelineEvent {
                event: "vrf_fulfilled".to_string(),
                timestamp: 1736553660,
                tx_hash: Some("0x789abc...".to_string()),
                description: "VRF fulfilled, 3 provers selected".to_string(),
            },
            TimelineEvent {
                event: "signature_received".to_string(),
                timestamp: 1736556600,
                tx_hash: None,
                description: "Signature 1/3 from prover-001".to_string(),
            },
            TimelineEvent {
                event: "signature_received".to_string(),
                timestamp: 1736556720,
                tx_hash: None,
                description: "Signature 2/3 from prover-002".to_string(),
            },
        ],
    };

    Ok(Json(response))
}

/// GET /v1/explorer/challenges
///
/// Returns paginated list of challenges.
pub async fn list_challenges(
    Extension(_state): Extension<Arc<AppState>>,
    Query(query): Query<ChallengesQuery>,
) -> Result<Json<ChallengesListResponse>, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100);

    tracing::debug!("Explorer: Listing challenges page={} limit={}", page, limit);

    // Mock data
    let challenges = vec![
        ExplorerChallenge {
            challenge_id: "challenge-001".to_string(),
            lock_id: "lock-005".to_string(),
            challenger: "0x9876543210fedcba9876543210fedcba98765432".to_string(),
            bond: "1000000000000000000".to_string(), // 1 ETH
            status: ChallengeStatus::Pending,
            challenged_at: 1736553600,
            defense_deadline: 1736726400, // +48 hours
        },
        ExplorerChallenge {
            challenge_id: "challenge-002".to_string(),
            lock_id: "lock-010".to_string(),
            challenger: "0x5555555555555555555555555555555555555555".to_string(),
            bond: "500000000000000000".to_string(), // 0.5 ETH
            status: ChallengeStatus::ResolvedInvalid,
            challenged_at: 1736380800,
            defense_deadline: 1736553600,
        },
    ];

    Ok(Json(ChallengesListResponse {
        challenges,
        total: 45,
        page,
        limit,
    }))
}

/// GET /v1/explorer/challenges/:id
///
/// Returns detailed information about a specific challenge.
pub async fn get_challenge(
    Extension(_state): Extension<Arc<AppState>>,
    Path(challenge_id): Path<String>,
) -> Result<Json<ChallengeDetailResponse>, ApiError> {
    tracing::debug!("Explorer: Getting challenge {}", challenge_id);

    // Mock data
    let response = ChallengeDetailResponse {
        challenge_id: challenge_id.clone(),
        lock_id: "lock-005".to_string(),
        challenger: "0x9876543210fedcba9876543210fedcba98765432".to_string(),
        fraud_proof_hash: "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b".to_string(),
        bond: "1000000000000000000".to_string(),
        status: ChallengeStatus::Pending,
        challenged_at: 1736553600,
        defense_deadline: 1736726400,
        defender: None,
        defense_proof_hash: None,
        resolution: None,
        timeline: vec![
            TimelineEvent {
                event: "challenge_submitted".to_string(),
                timestamp: 1736553600,
                tx_hash: Some("0xchallenge123...".to_string()),
                description: "Challenge submitted with 1 ETH bond".to_string(),
            },
        ],
    };

    Ok(Json(response))
}

/// GET /v1/explorer/address/:addr
///
/// Returns activity summary for a specific address.
pub async fn get_address(
    Extension(_state): Extension<Arc<AppState>>,
    Path(addr): Path<String>,
) -> Result<Json<AddressActivityResponse>, ApiError> {
    tracing::debug!("Explorer: Getting address {}", addr);

    // Mock data
    let response = AddressActivityResponse {
        address: addr.clone(),
        total_locks: 15,
        total_unlocks: 12,
        total_volume: "125000000000000000000".to_string(), // 125 ETH
        locked_balance: "5000000000000000000".to_string(), // 5 ETH
        is_prover: false,
        prover_id: None,
        recent_transactions: vec![
            AddressTransaction {
                tx_type: "lock".to_string(),
                id: "lock-001".to_string(),
                amount: "5000000000000000000".to_string(),
                asset: "ETH".to_string(),
                timestamp: 1736553600,
                status: "locked".to_string(),
            },
            AddressTransaction {
                tx_type: "unlock".to_string(),
                id: "unlock-001".to_string(),
                amount: "3000000000000000000".to_string(),
                asset: "ETH".to_string(),
                timestamp: 1736467200,
                status: "completed".to_string(),
            },
        ],
        first_seen: 1704067200, // Jan 1, 2024
        last_seen: 1736553600,
    };

    Ok(Json(response))
}

/// GET /v1/explorer/provers
///
/// Returns paginated list of provers.
pub async fn list_provers(
    Extension(_state): Extension<Arc<AppState>>,
    Query(query): Query<ProversQuery>,
) -> Result<Json<ProversListResponse>, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100);

    tracing::debug!("Explorer: Listing provers page={} limit={}", page, limit);

    // Mock data
    let provers = vec![
        ExplorerProver {
            prover_id: "prover-001".to_string(),
            operator_addr: "0xaaaa111122223333444455556666777788889999".to_string(),
            status: ProverStatus::Active,
            stake_amount: "100000000000000000000".to_string(), // 100 ETH
            total_signatures: 12500,
            uptime_percent: 99.8,
            joined_at: 1704067200,
        },
        ExplorerProver {
            prover_id: "prover-002".to_string(),
            operator_addr: "0xbbbb111122223333444455556666777788889999".to_string(),
            status: ProverStatus::Active,
            stake_amount: "50000000000000000000".to_string(), // 50 ETH
            total_signatures: 8200,
            uptime_percent: 99.5,
            joined_at: 1706745600,
        },
    ];

    Ok(Json(ProversListResponse {
        provers,
        total: 25,
        page,
        limit,
    }))
}

/// GET /v1/explorer/provers/:id
///
/// Returns detailed information about a specific prover.
pub async fn get_prover(
    Extension(_state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverDetailResponse>, ApiError> {
    tracing::debug!("Explorer: Getting prover {}", prover_id);

    // Mock data
    let response = ProverDetailResponse {
        prover_id: prover_id.clone(),
        operator_addr: "0xaaaa111122223333444455556666777788889999".to_string(),
        sphincs_pubkey_fingerprint: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b".to_string(),
        status: ProverStatus::Active,
        stake_amount: "100000000000000000000".to_string(),
        total_signatures: 12500,
        signatures_24h: 125,
        total_rewards: "5000000000000000000".to_string(), // 5 ETH
        uptime_percent: 99.8,
        slash_count: 0,
        total_slashed: "0".to_string(),
        joined_at: 1704067200,
        last_activity: 1736640000,
        recent_activity: vec![
            ProverActivityItem {
                activity_type: "signature".to_string(),
                id: "unlock-123".to_string(),
                timestamp: 1736640000,
                details: "Signed unlock for 5 ETH".to_string(),
            },
            ProverActivityItem {
                activity_type: "signature".to_string(),
                id: "unlock-122".to_string(),
                timestamp: 1736636400,
                details: "Signed unlock for 2.5 ETH".to_string(),
            },
        ],
        slashing_history: vec![],
    };

    Ok(Json(response))
}

/// GET /v1/explorer/analytics
///
/// Returns analytics and historical data for the system.
pub async fn get_analytics(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<AnalyticsResponse>, ApiError> {
    tracing::debug!("Explorer: Getting analytics");

    // Mock data - 7 days of history
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let day = 86400;

    let tvl_history: Vec<TimeSeriesPoint> = (0..7)
        .map(|i| TimeSeriesPoint {
            timestamp: now - (6 - i) * day,
            value: format!("{}000000000000000000000", 12000 + i * 100), // Growing TVL
        })
        .collect();

    let volume_history: Vec<TimeSeriesPoint> = (0..7)
        .map(|i| TimeSeriesPoint {
            timestamp: now - (6 - i) * day,
            value: format!("{}000000000000000000", 800 + (i % 3) * 200), // Varying volume
        })
        .collect();

    let tx_count_history: Vec<TimeSeriesPoint> = (0..7)
        .map(|i| TimeSeriesPoint {
            timestamp: now - (6 - i) * day,
            value: format!("{}", 300 + (i % 4) * 50),
        })
        .collect();

    let response = AnalyticsResponse {
        tvl_history,
        volume_history,
        tx_count_history,
        asset_breakdown: vec![
            AssetBreakdown {
                asset: "ETH".to_string(),
                total_locked: "10000000000000000000000".to_string(), // 10,000 ETH
                percentage: 80.0,
            },
            AssetBreakdown {
                asset: "USDC".to_string(),
                total_locked: "2500000000000".to_string(), // 2,500,000 USDC
                percentage: 20.0,
            },
        ],
        chain_breakdown: vec![
            ChainBreakdown {
                chain_id: 1,
                name: "Ethereum Mainnet".to_string(),
                tvl: "10000000000000000000000".to_string(),
                tx_count: 12000,
            },
            ChainBreakdown {
                chain_id: 42161,
                name: "Arbitrum One".to_string(),
                tvl: "2500000000000000000000".to_string(),
                tx_count: 3420,
            },
        ],
        prover_stats: ProverAnalytics {
            total_provers: 25,
            active_provers: 22,
            total_stake: "2000000000000000000000".to_string(), // 2,000 ETH
            avg_uptime: 99.2,
            total_signatures: 250000,
        },
        challenge_stats: ChallengeAnalytics {
            total_challenges: 45,
            successful_challenges: 5,
            total_slashed: "50000000000000000000".to_string(), // 50 ETH
            success_rate: 11.1,
        },
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
    fn test_pagination_defaults() {
        let query = PaginationQuery {
            page: None,
            limit: None,
        };
        assert_eq!(query.page.unwrap_or(1), 1);
        assert_eq!(query.limit.unwrap_or(20), 20);
    }

    #[test]
    fn test_pagination_max_limit() {
        let query = PaginationQuery {
            page: Some(1),
            limit: Some(500),
        };
        assert_eq!(query.limit.unwrap_or(20).min(100), 100);
    }

    #[test]
    fn test_search_query_type_filter() {
        let query = SearchQuery {
            q: "test".to_string(),
            entity_type: Some("lock".to_string()),
        };
        assert_eq!(query.entity_type, Some("lock".to_string()));
    }
}
