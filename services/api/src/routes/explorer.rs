//! Explorer API implementation
//!
//! TASK-P5-024: Explorer API (12 EP)
//!
//! Provides public endpoints for exploring the Quantum Shield network:
//! - Network overview and statistics
//! - Search for locks, unlocks, addresses
//! - Browse locks, unlocks, challenges
//! - View prover information
//! - Analytics data
//!
//! Spec References:
//! - TASK_P5_FULL_LIST.md §Phase 5.4
//! - Appendix B.2 Explorer API

use std::sync::Arc;

use axum::{Extension, Json, extract::{Path, Query}};
use serde::{Deserialize, Serialize};

use crate::{
    error::ApiError,
    services::AppState,
};

// ============================================================================
// Explorer Types
// ============================================================================

/// Search type enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SearchType {
    /// Search for locks
    Lock,
    /// Search for unlocks
    Unlock,
    /// Search for addresses
    Address,
    /// Search for provers
    Prover,
    /// Search for challenges
    Challenge,
    /// Search all types
    All,
}

/// Lock status for explorer
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExplorerLockStatus {
    /// Lock is active
    Active,
    /// Unlock pending (in timelock)
    UnlockPending,
    /// Emergency unlock pending (7-day timelock)
    EmergencyPending,
    /// Under challenge
    Challenged,
    /// Unlocked successfully
    Unlocked,
    /// Slashed due to fraud
    Slashed,
}

/// Challenge status for explorer
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExplorerChallengeStatus {
    /// Challenge is pending defense
    Pending,
    /// Defense submitted, under review
    UnderReview,
    /// Challenge succeeded (fraud proven)
    Succeeded,
    /// Challenge failed (defense successful)
    Failed,
    /// Challenge expired
    Expired,
}

/// Prover status for explorer
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExplorerProverStatus {
    /// Prover is active and operating
    Active,
    /// Prover is pending approval
    Pending,
    /// Prover is suspended
    Suspended,
    /// Prover is exiting
    Exiting,
    /// Prover has exited
    Exited,
}

// ============================================================================
// Query Parameters
// ============================================================================

/// Query parameters for search endpoint
#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    /// Search query string (address, lock ID, tx hash)
    pub q: String,
    /// Filter by search type (optional)
    #[serde(rename = "type")]
    pub search_type: Option<SearchType>,
    /// Page number (1-based)
    pub page: Option<u32>,
    /// Page size
    #[serde(rename = "pageSize")]
    pub page_size: Option<u32>,
}

/// Query parameters for list endpoints
#[derive(Debug, Deserialize)]
pub struct ListQuery {
    /// Page number (1-based)
    pub page: Option<u32>,
    /// Page size
    #[serde(rename = "pageSize")]
    pub page_size: Option<u32>,
    /// Sort by field
    #[serde(rename = "sortBy")]
    pub sort_by: Option<String>,
    /// Sort order (asc/desc)
    pub order: Option<String>,
    /// Filter by status
    pub status: Option<String>,
}

// ============================================================================
// Request/Response Types
// ============================================================================

/// GET /v1/explorer/overview response
#[derive(Debug, Serialize)]
pub struct ExplorerOverviewResponse {
    /// Network statistics
    pub network: NetworkStats,
    /// Recent activity summary
    #[serde(rename = "recentActivity")]
    pub recent_activity: RecentActivitySummary,
    /// Top provers by volume
    #[serde(rename = "topProvers")]
    pub top_provers: Vec<TopProverItem>,
    /// Network health indicators
    pub health: NetworkHealth,
}

#[derive(Debug, Serialize)]
pub struct NetworkStats {
    /// Total value locked (in wei)
    #[serde(rename = "totalValueLocked")]
    pub total_value_locked: String,
    /// Total value locked in USD
    #[serde(rename = "totalValueLockedUsd")]
    pub total_value_locked_usd: String,
    /// Total number of locks
    #[serde(rename = "totalLocks")]
    pub total_locks: u64,
    /// Total number of unlocks
    #[serde(rename = "totalUnlocks")]
    pub total_unlocks: u64,
    /// Active provers count
    #[serde(rename = "activeProvers")]
    pub active_provers: u32,
    /// Total challenges
    #[serde(rename = "totalChallenges")]
    pub total_challenges: u32,
    /// Successful challenges
    #[serde(rename = "successfulChallenges")]
    pub successful_challenges: u32,
    /// Total fees generated (in wei)
    #[serde(rename = "totalFees")]
    pub total_fees: String,
    /// Current edition
    #[serde(rename = "currentEdition")]
    pub current_edition: String,
}

#[derive(Debug, Serialize)]
pub struct RecentActivitySummary {
    /// Locks in last 24h
    #[serde(rename = "locks24h")]
    pub locks_24h: u32,
    /// Unlocks in last 24h
    #[serde(rename = "unlocks24h")]
    pub unlocks_24h: u32,
    /// Volume in last 24h (in wei)
    #[serde(rename = "volume24h")]
    pub volume_24h: String,
    /// Challenges in last 24h
    #[serde(rename = "challenges24h")]
    pub challenges_24h: u32,
}

#[derive(Debug, Serialize)]
pub struct TopProverItem {
    /// Prover ID
    pub id: String,
    /// Prover address
    pub address: String,
    /// Display name
    pub name: Option<String>,
    /// Total volume processed (in wei)
    pub volume: String,
    /// Number of locks signed
    #[serde(rename = "lockCount")]
    pub lock_count: u64,
    /// Success rate percentage
    #[serde(rename = "successRate")]
    pub success_rate: f64,
}

#[derive(Debug, Serialize)]
pub struct NetworkHealth {
    /// Overall health status
    pub status: String,
    /// Average unlock time (seconds)
    #[serde(rename = "avgUnlockTime")]
    pub avg_unlock_time: u64,
    /// Average proof generation time (ms)
    #[serde(rename = "avgProofTime")]
    pub avg_proof_time: u64,
    /// L1 connection status
    #[serde(rename = "l1Status")]
    pub l1_status: String,
    /// L3 consensus status
    #[serde(rename = "l3Status")]
    pub l3_status: String,
}

/// GET /v1/explorer/search response
#[derive(Debug, Serialize)]
pub struct SearchResponse {
    /// Search query
    pub query: String,
    /// Results
    pub results: Vec<SearchResult>,
    /// Total results count
    pub total: u32,
    /// Current page
    pub page: u32,
    /// Page size
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    /// Result type
    #[serde(rename = "type")]
    pub result_type: SearchType,
    /// Result ID
    pub id: String,
    /// Display title
    pub title: String,
    /// Short description
    pub description: String,
    /// Relevance score
    pub score: f64,
    /// Timestamp
    pub timestamp: u64,
}

/// GET /v1/explorer/locks response
#[derive(Debug, Serialize)]
pub struct LocksListResponse {
    /// Lock items
    pub locks: Vec<LockListItem>,
    /// Total count
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Page size
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct LockListItem {
    /// Lock ID
    pub id: String,
    /// Owner address
    pub owner: String,
    /// Amount locked (in wei)
    pub amount: String,
    /// Token address
    pub token: String,
    /// Token symbol
    #[serde(rename = "tokenSymbol")]
    pub token_symbol: String,
    /// Lock status
    pub status: ExplorerLockStatus,
    /// Created timestamp
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    /// L1 transaction hash
    #[serde(rename = "l1TxHash")]
    pub l1_tx_hash: String,
}

/// GET /v1/explorer/locks/:id response
#[derive(Debug, Serialize)]
pub struct LockDetailResponse {
    /// Lock ID
    pub id: String,
    /// Owner address
    pub owner: String,
    /// Amount locked (in wei)
    pub amount: String,
    /// Token address
    pub token: String,
    /// Token symbol
    #[serde(rename = "tokenSymbol")]
    pub token_symbol: String,
    /// Token decimals
    #[serde(rename = "tokenDecimals")]
    pub token_decimals: u8,
    /// Current status
    pub status: ExplorerLockStatus,
    /// Created timestamp
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    /// L1 deposit transaction hash
    #[serde(rename = "l1DepositTxHash")]
    pub l1_deposit_tx_hash: String,
    /// L3 mint transaction hash
    #[serde(rename = "l3MintTxHash")]
    pub l3_mint_tx_hash: Option<String>,
    /// STARK proof hash
    #[serde(rename = "starkProofHash")]
    pub stark_proof_hash: Option<String>,
    /// Dilithium signature
    #[serde(rename = "dilithiumSignature")]
    pub dilithium_signature: Option<String>,
    /// Prover info
    pub prover: Option<LockProverInfo>,
    /// Timeline events
    pub timeline: Vec<LockEvent>,
    /// Related unlock (if any)
    #[serde(rename = "relatedUnlock")]
    pub related_unlock: Option<RelatedUnlockInfo>,
    /// Challenge info (if challenged)
    pub challenge: Option<LockChallengeInfo>,
}

#[derive(Debug, Serialize)]
pub struct LockProverInfo {
    pub id: String,
    pub address: String,
    pub name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct LockEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub description: String,
    pub timestamp: u64,
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RelatedUnlockInfo {
    #[serde(rename = "unlockId")]
    pub unlock_id: String,
    #[serde(rename = "requestedAt")]
    pub requested_at: u64,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct LockChallengeInfo {
    #[serde(rename = "challengeId")]
    pub challenge_id: String,
    pub challenger: String,
    pub status: ExplorerChallengeStatus,
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
}

/// GET /v1/explorer/unlocks response
#[derive(Debug, Serialize)]
pub struct UnlocksListResponse {
    /// Unlock items
    pub unlocks: Vec<UnlockListItem>,
    /// Total count
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Page size
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct UnlockListItem {
    /// Unlock ID
    pub id: String,
    /// Related lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Owner address
    pub owner: String,
    /// Amount (in wei)
    pub amount: String,
    /// Unlock type (normal/emergency)
    #[serde(rename = "unlockType")]
    pub unlock_type: String,
    /// Status
    pub status: String,
    /// Requested timestamp
    #[serde(rename = "requestedAt")]
    pub requested_at: u64,
    /// Executable timestamp
    #[serde(rename = "executableAt")]
    pub executable_at: u64,
}

/// GET /v1/explorer/unlocks/:id response
#[derive(Debug, Serialize)]
pub struct UnlockDetailResponse {
    /// Unlock ID
    pub id: String,
    /// Related lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Owner address
    pub owner: String,
    /// Amount (in wei)
    pub amount: String,
    /// Token address
    pub token: String,
    /// Token symbol
    #[serde(rename = "tokenSymbol")]
    pub token_symbol: String,
    /// Unlock type
    #[serde(rename = "unlockType")]
    pub unlock_type: String,
    /// Current status
    pub status: String,
    /// Requested timestamp
    #[serde(rename = "requestedAt")]
    pub requested_at: u64,
    /// Timelock end timestamp
    #[serde(rename = "timelockEnd")]
    pub timelock_end: u64,
    /// Executed timestamp (if completed)
    #[serde(rename = "executedAt")]
    pub executed_at: Option<u64>,
    /// Emergency bond amount (if emergency)
    #[serde(rename = "emergencyBond")]
    pub emergency_bond: Option<String>,
    /// L1 burn transaction hash
    #[serde(rename = "l1BurnTxHash")]
    pub l1_burn_tx_hash: Option<String>,
    /// L3 release transaction hash
    #[serde(rename = "l3ReleaseTxHash")]
    pub l3_release_tx_hash: Option<String>,
    /// Timeline events
    pub timeline: Vec<UnlockEvent>,
}

#[derive(Debug, Serialize)]
pub struct UnlockEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub description: String,
    pub timestamp: u64,
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
}

/// GET /v1/explorer/challenges response
#[derive(Debug, Serialize)]
pub struct ChallengesListResponse {
    /// Challenge items
    pub challenges: Vec<ChallengeListItem>,
    /// Total count
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Page size
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct ChallengeListItem {
    /// Challenge ID
    pub id: String,
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Challenger address
    pub challenger: String,
    /// Bond amount
    pub bond: String,
    /// Status
    pub status: ExplorerChallengeStatus,
    /// Submitted timestamp
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
    /// Defense deadline
    #[serde(rename = "defenseDeadline")]
    pub defense_deadline: u64,
}

/// GET /v1/explorer/challenges/:id response
#[derive(Debug, Serialize)]
pub struct ChallengeDetailResponse {
    /// Challenge ID
    pub id: String,
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Challenger address
    pub challenger: String,
    /// Defender address (prover)
    pub defender: Option<String>,
    /// Bond amount
    pub bond: String,
    /// Fraud proof hash
    #[serde(rename = "fraudProofHash")]
    pub fraud_proof_hash: String,
    /// Challenge reason
    pub reason: String,
    /// Status
    pub status: ExplorerChallengeStatus,
    /// Submitted timestamp
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
    /// Defense deadline
    #[serde(rename = "defenseDeadline")]
    pub defense_deadline: u64,
    /// Defense info (if submitted)
    pub defense: Option<ChallengeDefenseInfo>,
    /// Resolution info (if resolved)
    pub resolution: Option<ChallengeResolutionInfo>,
    /// Timeline events
    pub timeline: Vec<ChallengeEvent>,
    /// Lock summary
    #[serde(rename = "lockSummary")]
    pub lock_summary: ChallengeLockSummary,
}

#[derive(Debug, Serialize)]
pub struct ChallengeDefenseInfo {
    #[serde(rename = "defenseProofHash")]
    pub defense_proof_hash: String,
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
}

#[derive(Debug, Serialize)]
pub struct ChallengeResolutionInfo {
    pub winner: String,
    #[serde(rename = "resolvedAt")]
    pub resolved_at: u64,
    #[serde(rename = "slashedAmount")]
    pub slashed_amount: Option<String>,
    #[serde(rename = "rewardAmount")]
    pub reward_amount: Option<String>,
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ChallengeEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub description: String,
    pub timestamp: u64,
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ChallengeLockSummary {
    pub id: String,
    pub owner: String,
    pub amount: String,
    pub token: String,
}

/// GET /v1/explorer/address/:addr response
#[derive(Debug, Serialize)]
pub struct AddressInfoResponse {
    /// Address
    pub address: String,
    /// Address type (user/prover/contract)
    #[serde(rename = "addressType")]
    pub address_type: String,
    /// First seen timestamp
    #[serde(rename = "firstSeen")]
    pub first_seen: u64,
    /// Last active timestamp
    #[serde(rename = "lastActive")]
    pub last_active: u64,
    /// Lock statistics
    #[serde(rename = "lockStats")]
    pub lock_stats: AddressLockStats,
    /// Unlock statistics
    #[serde(rename = "unlockStats")]
    pub unlock_stats: AddressUnlockStats,
    /// Challenge statistics (if observer)
    #[serde(rename = "challengeStats")]
    pub challenge_stats: Option<AddressChallengeStats>,
    /// Prover info (if prover)
    #[serde(rename = "proverInfo")]
    pub prover_info: Option<AddressProverInfo>,
    /// Recent locks
    #[serde(rename = "recentLocks")]
    pub recent_locks: Vec<AddressRecentLock>,
    /// Recent unlocks
    #[serde(rename = "recentUnlocks")]
    pub recent_unlocks: Vec<AddressRecentUnlock>,
}

#[derive(Debug, Serialize)]
pub struct AddressLockStats {
    #[serde(rename = "totalLocks")]
    pub total_locks: u64,
    #[serde(rename = "activeLocks")]
    pub active_locks: u64,
    #[serde(rename = "totalValueLocked")]
    pub total_value_locked: String,
}

#[derive(Debug, Serialize)]
pub struct AddressUnlockStats {
    #[serde(rename = "totalUnlocks")]
    pub total_unlocks: u64,
    #[serde(rename = "pendingUnlocks")]
    pub pending_unlocks: u64,
    #[serde(rename = "totalValueUnlocked")]
    pub total_value_unlocked: String,
}

#[derive(Debug, Serialize)]
pub struct AddressChallengeStats {
    #[serde(rename = "totalChallenges")]
    pub total_challenges: u32,
    #[serde(rename = "successfulChallenges")]
    pub successful_challenges: u32,
    #[serde(rename = "totalEarnings")]
    pub total_earnings: String,
}

#[derive(Debug, Serialize)]
pub struct AddressProverInfo {
    #[serde(rename = "proverId")]
    pub prover_id: String,
    pub status: ExplorerProverStatus,
    pub stake: String,
    #[serde(rename = "totalVolume")]
    pub total_volume: String,
}

#[derive(Debug, Serialize)]
pub struct AddressRecentLock {
    pub id: String,
    pub amount: String,
    pub status: ExplorerLockStatus,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
}

#[derive(Debug, Serialize)]
pub struct AddressRecentUnlock {
    pub id: String,
    #[serde(rename = "lockId")]
    pub lock_id: String,
    pub amount: String,
    pub status: String,
    #[serde(rename = "requestedAt")]
    pub requested_at: u64,
}

/// GET /v1/explorer/provers response
#[derive(Debug, Serialize)]
pub struct ProversListResponse {
    /// Prover items
    pub provers: Vec<ProverListItem>,
    /// Total count
    pub total: u32,
    /// Current page
    pub page: u32,
    /// Page size
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct ProverListItem {
    /// Prover ID
    pub id: String,
    /// Prover address
    pub address: String,
    /// Display name
    pub name: Option<String>,
    /// Status
    pub status: ExplorerProverStatus,
    /// Stake amount
    pub stake: String,
    /// Total volume processed
    #[serde(rename = "totalVolume")]
    pub total_volume: String,
    /// Total locks signed
    #[serde(rename = "totalLocks")]
    pub total_locks: u64,
    /// Success rate
    #[serde(rename = "successRate")]
    pub success_rate: f64,
    /// Joined timestamp
    #[serde(rename = "joinedAt")]
    pub joined_at: u64,
}

/// GET /v1/explorer/provers/:id response
#[derive(Debug, Serialize)]
pub struct ProverDetailResponse {
    /// Prover ID
    pub id: String,
    /// Prover address
    pub address: String,
    /// Display name
    pub name: Option<String>,
    /// Description
    pub description: Option<String>,
    /// Website URL
    pub website: Option<String>,
    /// Status
    pub status: ExplorerProverStatus,
    /// Stake amount
    pub stake: String,
    /// Performance statistics
    pub performance: ProverPerformanceStats,
    /// Financial statistics
    pub financial: ProverFinancialStats,
    /// Hardware info
    pub hardware: Option<ProverHardwareInfo>,
    /// Recent activity
    #[serde(rename = "recentActivity")]
    pub recent_activity: Vec<ProverActivityItem>,
    /// Challenge history
    #[serde(rename = "challengeHistory")]
    pub challenge_history: ProverChallengeHistory,
    /// Joined timestamp
    #[serde(rename = "joinedAt")]
    pub joined_at: u64,
}

#[derive(Debug, Serialize)]
pub struct ProverPerformanceStats {
    #[serde(rename = "totalLocks")]
    pub total_locks: u64,
    #[serde(rename = "successRate")]
    pub success_rate: f64,
    #[serde(rename = "avgResponseTime")]
    pub avg_response_time: u64,
    pub uptime: f64,
    #[serde(rename = "lastActiveAt")]
    pub last_active_at: u64,
}

#[derive(Debug, Serialize)]
pub struct ProverFinancialStats {
    #[serde(rename = "totalVolume")]
    pub total_volume: String,
    #[serde(rename = "totalFees")]
    pub total_fees: String,
    #[serde(rename = "totalRewards")]
    pub total_rewards: String,
    #[serde(rename = "slashedAmount")]
    pub slashed_amount: String,
}

#[derive(Debug, Serialize)]
pub struct ProverHardwareInfo {
    pub cpu: String,
    pub memory: String,
    pub storage: String,
    pub region: String,
}

#[derive(Debug, Serialize)]
pub struct ProverActivityItem {
    #[serde(rename = "type")]
    pub activity_type: String,
    pub description: String,
    pub timestamp: u64,
    #[serde(rename = "lockId")]
    pub lock_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProverChallengeHistory {
    #[serde(rename = "totalChallenges")]
    pub total_challenges: u32,
    #[serde(rename = "challengesWon")]
    pub challenges_won: u32,
    #[serde(rename = "challengesLost")]
    pub challenges_lost: u32,
    #[serde(rename = "totalSlashed")]
    pub total_slashed: String,
}

/// GET /v1/explorer/analytics response
#[derive(Debug, Serialize)]
pub struct AnalyticsResponse {
    /// Time period
    pub period: String,
    /// Volume analytics
    pub volume: VolumeAnalytics,
    /// Lock analytics
    pub locks: LockAnalytics,
    /// Prover analytics
    pub provers: ProverAnalytics,
    /// Challenge analytics
    pub challenges: ChallengeAnalytics,
    /// Fee analytics
    pub fees: FeeAnalytics,
    /// Time series data
    #[serde(rename = "timeSeries")]
    pub time_series: Vec<TimeSeriesDataPoint>,
}

#[derive(Debug, Serialize)]
pub struct VolumeAnalytics {
    /// Total volume in period (wei)
    #[serde(rename = "totalVolume")]
    pub total_volume: String,
    /// Change from previous period (percentage)
    pub change: f64,
    /// Peak volume day
    #[serde(rename = "peakDay")]
    pub peak_day: u64,
    /// Average daily volume
    #[serde(rename = "avgDaily")]
    pub avg_daily: String,
}

#[derive(Debug, Serialize)]
pub struct LockAnalytics {
    /// Total new locks
    #[serde(rename = "newLocks")]
    pub new_locks: u64,
    /// Total unlocks
    #[serde(rename = "totalUnlocks")]
    pub total_unlocks: u64,
    /// Average lock size
    #[serde(rename = "avgLockSize")]
    pub avg_lock_size: String,
    /// Average lock duration (seconds)
    #[serde(rename = "avgLockDuration")]
    pub avg_lock_duration: u64,
}

#[derive(Debug, Serialize)]
pub struct ProverAnalytics {
    /// Active provers
    #[serde(rename = "activeProvers")]
    pub active_provers: u32,
    /// New provers in period
    #[serde(rename = "newProvers")]
    pub new_provers: u32,
    /// Exited provers
    #[serde(rename = "exitedProvers")]
    pub exited_provers: u32,
    /// Average prover stake
    #[serde(rename = "avgStake")]
    pub avg_stake: String,
}

#[derive(Debug, Serialize)]
pub struct ChallengeAnalytics {
    /// Total challenges
    #[serde(rename = "totalChallenges")]
    pub total_challenges: u32,
    /// Successful challenges
    #[serde(rename = "successfulChallenges")]
    pub successful_challenges: u32,
    /// Success rate
    #[serde(rename = "successRate")]
    pub success_rate: f64,
    /// Total slashed amount
    #[serde(rename = "totalSlashed")]
    pub total_slashed: String,
}

#[derive(Debug, Serialize)]
pub struct FeeAnalytics {
    /// Total fees collected
    #[serde(rename = "totalFees")]
    pub total_fees: String,
    /// Prover fees
    #[serde(rename = "proverFees")]
    pub prover_fees: String,
    /// Protocol fees
    #[serde(rename = "protocolFees")]
    pub protocol_fees: String,
    /// Insurance fund contribution
    #[serde(rename = "insuranceFees")]
    pub insurance_fees: String,
}

#[derive(Debug, Serialize)]
pub struct TimeSeriesDataPoint {
    /// Timestamp (start of period)
    pub timestamp: u64,
    /// Volume in period
    pub volume: String,
    /// Number of locks
    pub locks: u32,
    /// Number of unlocks
    pub unlocks: u32,
    /// Number of challenges
    pub challenges: u32,
}

// ============================================================================
// API Handlers
// ============================================================================

/// GET /v1/explorer/overview
///
/// Returns network overview with statistics, recent activity, and health.
pub async fn get_overview(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ExplorerOverviewResponse>, ApiError> {
    tracing::info!("Fetching explorer overview");

    let now = chrono::Utc::now().timestamp() as u64;

    let response = ExplorerOverviewResponse {
        network: NetworkStats {
            total_value_locked: "1500000000000000000000".to_string(), // 1500 ETH
            total_value_locked_usd: "3750000".to_string(), // $3.75M
            total_locks: 2847,
            total_unlocks: 1923,
            active_provers: 12,
            total_challenges: 47,
            successful_challenges: 28,
            total_fees: "75000000000000000000".to_string(), // 75 ETH
            current_edition: "Community".to_string(),
        },
        recent_activity: RecentActivitySummary {
            locks_24h: 45,
            unlocks_24h: 32,
            volume_24h: "125000000000000000000".to_string(), // 125 ETH
            challenges_24h: 2,
        },
        top_provers: vec![
            TopProverItem {
                id: "prover_001".to_string(),
                address: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
                name: Some("Quantum Prover Alpha".to_string()),
                volume: "500000000000000000000".to_string(), // 500 ETH
                lock_count: 892,
                success_rate: 99.8,
            },
            TopProverItem {
                id: "prover_002".to_string(),
                address: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
                name: Some("Shield Node Beta".to_string()),
                volume: "350000000000000000000".to_string(), // 350 ETH
                lock_count: 654,
                success_rate: 99.5,
            },
            TopProverItem {
                id: "prover_003".to_string(),
                address: "0x9876543210fedcba9876543210fedcba98765432".to_string(),
                name: Some("Aegis Validator".to_string()),
                volume: "280000000000000000000".to_string(), // 280 ETH
                lock_count: 521,
                success_rate: 99.9,
            },
        ],
        health: NetworkHealth {
            status: "healthy".to_string(),
            avg_unlock_time: 86400, // 24 hours
            avg_proof_time: 2500, // 2.5 seconds
            l1_status: "connected".to_string(),
            l3_status: "consensus_active".to_string(),
        },
    };

    Ok(Json(response))
}

/// GET /v1/explorer/search
///
/// Unified search for locks, unlocks, addresses, provers.
pub async fn search(
    Extension(_state): Extension<Arc<AppState>>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<SearchResponse>, ApiError> {
    tracing::info!("Explorer search: q={}, type={:?}", params.q, params.search_type);

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let now = chrono::Utc::now().timestamp() as u64;

    // Mock search results based on query
    let results = if params.q.starts_with("0x") && params.q.len() == 42 {
        // Address search
        vec![SearchResult {
            result_type: SearchType::Address,
            id: params.q.clone(),
            title: format!("Address: {}...{}", &params.q[0..10], &params.q[38..42]),
            description: "User account with 5 locks, 3 unlocks".to_string(),
            score: 1.0,
            timestamp: now - 86400,
        }]
    } else if params.q.starts_with("0x") && params.q.len() == 66 {
        // Lock ID or TX hash search
        vec![SearchResult {
            result_type: SearchType::Lock,
            id: params.q.clone(),
            title: format!("Lock: {}...{}", &params.q[0..10], &params.q[62..66]),
            description: "Active lock: 10 ETH".to_string(),
            score: 1.0,
            timestamp: now - 3600,
        }]
    } else {
        // General search
        vec![
            SearchResult {
                result_type: SearchType::Prover,
                id: "prover_001".to_string(),
                title: format!("Prover matching '{}'", params.q),
                description: "Active prover with 99% success rate".to_string(),
                score: 0.8,
                timestamp: now - 7200,
            },
        ]
    };

    Ok(Json(SearchResponse {
        query: params.q,
        results,
        total: 1,
        page,
        page_size,
    }))
}

/// GET /v1/explorer/locks
///
/// Returns paginated list of locks.
pub async fn get_locks(
    Extension(_state): Extension<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<LocksListResponse>, ApiError> {
    tracing::info!("Fetching explorer locks list");

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let now = chrono::Utc::now().timestamp() as u64;

    let response = LocksListResponse {
        locks: vec![
            LockListItem {
                id: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef".to_string(),
                owner: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
                amount: "10000000000000000000".to_string(), // 10 ETH
                token: "0x0000000000000000000000000000000000000000".to_string(),
                token_symbol: "ETH".to_string(),
                status: ExplorerLockStatus::Active,
                created_at: now - 86400,
                l1_tx_hash: "0xtx_deposit_001".to_string(),
            },
            LockListItem {
                id: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210".to_string(),
                owner: "0x1234abcd5678ef901234abcd5678ef901234abcd".to_string(),
                amount: "25000000000000000000".to_string(), // 25 ETH
                token: "0x0000000000000000000000000000000000000000".to_string(),
                token_symbol: "ETH".to_string(),
                status: ExplorerLockStatus::UnlockPending,
                created_at: now - 172800,
                l1_tx_hash: "0xtx_deposit_002".to_string(),
            },
            LockListItem {
                id: "0x5555666677778888999900001111222233334444555566667777888899990000".to_string(),
                owner: "0x9999888877776666555544443333222211110000".to_string(),
                amount: "50000000000000000000".to_string(), // 50 ETH
                token: "0x0000000000000000000000000000000000000000".to_string(),
                token_symbol: "ETH".to_string(),
                status: ExplorerLockStatus::Challenged,
                created_at: now - 259200,
                l1_tx_hash: "0xtx_deposit_003".to_string(),
            },
        ],
        total: 2847,
        page,
        page_size,
    };

    Ok(Json(response))
}

/// GET /v1/explorer/locks/:id
///
/// Returns detailed information about a specific lock.
pub async fn get_lock_detail(
    Extension(_state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<LockDetailResponse>, ApiError> {
    tracing::info!("Fetching lock detail: {}", lock_id);

    let now = chrono::Utc::now().timestamp() as u64;

    let response = LockDetailResponse {
        id: lock_id.clone(),
        owner: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
        amount: "10000000000000000000".to_string(), // 10 ETH
        token: "0x0000000000000000000000000000000000000000".to_string(),
        token_symbol: "ETH".to_string(),
        token_decimals: 18,
        status: ExplorerLockStatus::Active,
        created_at: now - 86400,
        l1_deposit_tx_hash: "0xtx_l1_deposit_123".to_string(),
        l3_mint_tx_hash: Some("0xtx_l3_mint_456".to_string()),
        stark_proof_hash: Some("0xstark_proof_hash_789".to_string()),
        dilithium_signature: Some("0xdilithium_sig_abc".to_string()),
        prover: Some(LockProverInfo {
            id: "prover_001".to_string(),
            address: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
            name: Some("Quantum Prover Alpha".to_string()),
        }),
        timeline: vec![
            LockEvent {
                event_type: "deposit".to_string(),
                description: "L1 deposit confirmed".to_string(),
                timestamp: now - 86400,
                tx_hash: Some("0xtx_l1_deposit_123".to_string()),
            },
            LockEvent {
                event_type: "proof_generated".to_string(),
                description: "STARK proof generated".to_string(),
                timestamp: now - 86300,
                tx_hash: None,
            },
            LockEvent {
                event_type: "signed".to_string(),
                description: "Dilithium signature added".to_string(),
                timestamp: now - 86200,
                tx_hash: None,
            },
            LockEvent {
                event_type: "minted".to_string(),
                description: "L3 tokens minted".to_string(),
                timestamp: now - 86100,
                tx_hash: Some("0xtx_l3_mint_456".to_string()),
            },
        ],
        related_unlock: None,
        challenge: None,
    };

    Ok(Json(response))
}

/// GET /v1/explorer/unlocks
///
/// Returns paginated list of unlocks.
pub async fn get_unlocks(
    Extension(_state): Extension<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<UnlocksListResponse>, ApiError> {
    tracing::info!("Fetching explorer unlocks list");

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let now = chrono::Utc::now().timestamp() as u64;

    let response = UnlocksListResponse {
        unlocks: vec![
            UnlockListItem {
                id: "unlock_001".to_string(),
                lock_id: "0xlock_001".to_string(),
                owner: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
                amount: "5000000000000000000".to_string(), // 5 ETH
                unlock_type: "normal".to_string(),
                status: "pending".to_string(),
                requested_at: now - 43200, // 12 hours ago
                executable_at: now + 43200, // 12 hours remaining
            },
            UnlockListItem {
                id: "unlock_002".to_string(),
                lock_id: "0xlock_002".to_string(),
                owner: "0x1234abcd5678ef901234abcd5678ef901234abcd".to_string(),
                amount: "15000000000000000000".to_string(), // 15 ETH
                unlock_type: "emergency".to_string(),
                status: "pending".to_string(),
                requested_at: now - 172800, // 2 days ago
                executable_at: now + 432000, // 5 days remaining
            },
            UnlockListItem {
                id: "unlock_003".to_string(),
                lock_id: "0xlock_003".to_string(),
                owner: "0x9876543210fedcba9876543210fedcba98765432".to_string(),
                amount: "8000000000000000000".to_string(), // 8 ETH
                unlock_type: "normal".to_string(),
                status: "completed".to_string(),
                requested_at: now - 259200, // 3 days ago
                executable_at: now - 172800, // completed 2 days ago
            },
        ],
        total: 1923,
        page,
        page_size,
    };

    Ok(Json(response))
}

/// GET /v1/explorer/unlocks/:id
///
/// Returns detailed information about a specific unlock.
pub async fn get_unlock_detail(
    Extension(_state): Extension<Arc<AppState>>,
    Path(unlock_id): Path<String>,
) -> Result<Json<UnlockDetailResponse>, ApiError> {
    tracing::info!("Fetching unlock detail: {}", unlock_id);

    let now = chrono::Utc::now().timestamp() as u64;

    let response = UnlockDetailResponse {
        id: unlock_id.clone(),
        lock_id: "0xlock_001".to_string(),
        owner: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
        amount: "5000000000000000000".to_string(), // 5 ETH
        token: "0x0000000000000000000000000000000000000000".to_string(),
        token_symbol: "ETH".to_string(),
        unlock_type: "normal".to_string(),
        status: "pending".to_string(),
        requested_at: now - 43200,
        timelock_end: now + 43200,
        executed_at: None,
        emergency_bond: None,
        l1_burn_tx_hash: None,
        l3_release_tx_hash: None,
        timeline: vec![
            UnlockEvent {
                event_type: "requested".to_string(),
                description: "Unlock requested".to_string(),
                timestamp: now - 43200,
                tx_hash: Some("0xtx_unlock_request".to_string()),
            },
            UnlockEvent {
                event_type: "timelock_started".to_string(),
                description: "24-hour timelock started".to_string(),
                timestamp: now - 43200,
                tx_hash: None,
            },
        ],
    };

    Ok(Json(response))
}

/// GET /v1/explorer/challenges
///
/// Returns paginated list of challenges.
pub async fn get_challenges(
    Extension(_state): Extension<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<ChallengesListResponse>, ApiError> {
    tracing::info!("Fetching explorer challenges list");

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let now = chrono::Utc::now().timestamp() as u64;

    let response = ChallengesListResponse {
        challenges: vec![
            ChallengeListItem {
                id: "challenge_001".to_string(),
                lock_id: "0xlock_challenged_001".to_string(),
                challenger: "0xchallenger_001".to_string(),
                bond: "100000000000000000".to_string(), // 0.1 ETH
                status: ExplorerChallengeStatus::Pending,
                submitted_at: now - 3600, // 1 hour ago
                defense_deadline: now + 169200, // ~47 hours remaining
            },
            ChallengeListItem {
                id: "challenge_002".to_string(),
                lock_id: "0xlock_challenged_002".to_string(),
                challenger: "0xchallenger_002".to_string(),
                bond: "500000000000000000".to_string(), // 0.5 ETH
                status: ExplorerChallengeStatus::Succeeded,
                submitted_at: now - 259200, // 3 days ago
                defense_deadline: now - 86400, // expired 1 day ago
            },
        ],
        total: 47,
        page,
        page_size,
    };

    Ok(Json(response))
}

/// GET /v1/explorer/challenges/:id
///
/// Returns detailed information about a specific challenge.
pub async fn get_challenge_detail(
    Extension(_state): Extension<Arc<AppState>>,
    Path(challenge_id): Path<String>,
) -> Result<Json<ChallengeDetailResponse>, ApiError> {
    tracing::info!("Fetching challenge detail: {}", challenge_id);

    let now = chrono::Utc::now().timestamp() as u64;

    let response = ChallengeDetailResponse {
        id: challenge_id.clone(),
        lock_id: "0xlock_challenged_001".to_string(),
        challenger: "0xchallenger_001".to_string(),
        defender: Some("0xprover_001".to_string()),
        bond: "100000000000000000".to_string(), // 0.1 ETH
        fraud_proof_hash: "0xfraud_proof_hash_123".to_string(),
        reason: "Invalid STARK proof detected".to_string(),
        status: ExplorerChallengeStatus::Pending,
        submitted_at: now - 3600,
        defense_deadline: now + 169200,
        defense: None,
        resolution: None,
        timeline: vec![
            ChallengeEvent {
                event_type: "submitted".to_string(),
                description: "Challenge submitted".to_string(),
                timestamp: now - 3600,
                tx_hash: Some("0xtx_challenge_submit".to_string()),
            },
        ],
        lock_summary: ChallengeLockSummary {
            id: "0xlock_challenged_001".to_string(),
            owner: "0xowner_001".to_string(),
            amount: "50000000000000000000".to_string(), // 50 ETH
            token: "ETH".to_string(),
        },
    };

    Ok(Json(response))
}

/// GET /v1/explorer/address/:addr
///
/// Returns information about a specific address.
pub async fn get_address_info(
    Extension(_state): Extension<Arc<AppState>>,
    Path(addr): Path<String>,
) -> Result<Json<AddressInfoResponse>, ApiError> {
    tracing::info!("Fetching address info: {}", addr);

    let now = chrono::Utc::now().timestamp() as u64;

    let response = AddressInfoResponse {
        address: addr.clone(),
        address_type: "user".to_string(),
        first_seen: now - 2592000, // 30 days ago
        last_active: now - 3600, // 1 hour ago
        lock_stats: AddressLockStats {
            total_locks: 15,
            active_locks: 5,
            total_value_locked: "75000000000000000000".to_string(), // 75 ETH
        },
        unlock_stats: AddressUnlockStats {
            total_unlocks: 10,
            pending_unlocks: 2,
            total_value_unlocked: "50000000000000000000".to_string(), // 50 ETH
        },
        challenge_stats: None,
        prover_info: None,
        recent_locks: vec![
            AddressRecentLock {
                id: "0xlock_recent_001".to_string(),
                amount: "10000000000000000000".to_string(), // 10 ETH
                status: ExplorerLockStatus::Active,
                created_at: now - 86400,
            },
            AddressRecentLock {
                id: "0xlock_recent_002".to_string(),
                amount: "15000000000000000000".to_string(), // 15 ETH
                status: ExplorerLockStatus::UnlockPending,
                created_at: now - 172800,
            },
        ],
        recent_unlocks: vec![
            AddressRecentUnlock {
                id: "unlock_recent_001".to_string(),
                lock_id: "0xlock_old_001".to_string(),
                amount: "8000000000000000000".to_string(), // 8 ETH
                status: "completed".to_string(),
                requested_at: now - 259200,
            },
        ],
    };

    Ok(Json(response))
}

/// GET /v1/explorer/provers
///
/// Returns paginated list of provers.
pub async fn get_provers(
    Extension(_state): Extension<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<ProversListResponse>, ApiError> {
    tracing::info!("Fetching explorer provers list");

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let now = chrono::Utc::now().timestamp() as u64;

    let response = ProversListResponse {
        provers: vec![
            ProverListItem {
                id: "prover_001".to_string(),
                address: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
                name: Some("Quantum Prover Alpha".to_string()),
                status: ExplorerProverStatus::Active,
                stake: "32000000000000000000".to_string(), // 32 ETH
                total_volume: "500000000000000000000".to_string(), // 500 ETH
                total_locks: 892,
                success_rate: 99.8,
                joined_at: now - 7776000, // 90 days ago
            },
            ProverListItem {
                id: "prover_002".to_string(),
                address: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
                name: Some("Shield Node Beta".to_string()),
                status: ExplorerProverStatus::Active,
                stake: "32000000000000000000".to_string(), // 32 ETH
                total_volume: "350000000000000000000".to_string(), // 350 ETH
                total_locks: 654,
                success_rate: 99.5,
                joined_at: now - 5184000, // 60 days ago
            },
            ProverListItem {
                id: "prover_003".to_string(),
                address: "0x9876543210fedcba9876543210fedcba98765432".to_string(),
                name: Some("Aegis Validator".to_string()),
                status: ExplorerProverStatus::Active,
                stake: "32000000000000000000".to_string(), // 32 ETH
                total_volume: "280000000000000000000".to_string(), // 280 ETH
                total_locks: 521,
                success_rate: 99.9,
                joined_at: now - 2592000, // 30 days ago
            },
        ],
        total: 12,
        page,
        page_size,
    };

    Ok(Json(response))
}

/// GET /v1/explorer/provers/:id
///
/// Returns detailed information about a specific prover.
pub async fn get_prover_detail(
    Extension(_state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverDetailResponse>, ApiError> {
    tracing::info!("Fetching prover detail: {}", prover_id);

    let now = chrono::Utc::now().timestamp() as u64;

    let response = ProverDetailResponse {
        id: prover_id.clone(),
        address: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
        name: Some("Quantum Prover Alpha".to_string()),
        description: Some("High-performance quantum-resistant prover node".to_string()),
        website: Some("https://quantumprover.example.com".to_string()),
        status: ExplorerProverStatus::Active,
        stake: "32000000000000000000".to_string(), // 32 ETH
        performance: ProverPerformanceStats {
            total_locks: 892,
            success_rate: 99.8,
            avg_response_time: 1500, // 1.5 seconds
            uptime: 99.95,
            last_active_at: now - 300, // 5 minutes ago
        },
        financial: ProverFinancialStats {
            total_volume: "500000000000000000000".to_string(), // 500 ETH
            total_fees: "2500000000000000000".to_string(), // 2.5 ETH
            total_rewards: "3000000000000000000".to_string(), // 3 ETH
            slashed_amount: "0".to_string(),
        },
        hardware: Some(ProverHardwareInfo {
            cpu: "AMD EPYC 7763".to_string(),
            memory: "256 GB".to_string(),
            storage: "2 TB NVMe".to_string(),
            region: "US-East".to_string(),
        }),
        recent_activity: vec![
            ProverActivityItem {
                activity_type: "lock_signed".to_string(),
                description: "Signed lock for 10 ETH".to_string(),
                timestamp: now - 300,
                lock_id: Some("0xlock_recent".to_string()),
            },
            ProverActivityItem {
                activity_type: "lock_signed".to_string(),
                description: "Signed lock for 25 ETH".to_string(),
                timestamp: now - 1800,
                lock_id: Some("0xlock_previous".to_string()),
            },
        ],
        challenge_history: ProverChallengeHistory {
            total_challenges: 2,
            challenges_won: 2,
            challenges_lost: 0,
            total_slashed: "0".to_string(),
        },
        joined_at: now - 7776000, // 90 days ago
    };

    Ok(Json(response))
}

/// GET /v1/explorer/analytics
///
/// Returns network analytics data.
pub async fn get_analytics(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<AnalyticsResponse>, ApiError> {
    tracing::info!("Fetching explorer analytics");

    let now = chrono::Utc::now().timestamp() as u64;
    let day_seconds = 86400u64;

    let response = AnalyticsResponse {
        period: "30d".to_string(),
        volume: VolumeAnalytics {
            total_volume: "4500000000000000000000".to_string(), // 4500 ETH
            change: 12.5, // +12.5% from previous period
            peak_day: now - 7 * day_seconds,
            avg_daily: "150000000000000000000".to_string(), // 150 ETH
        },
        locks: LockAnalytics {
            new_locks: 1234,
            total_unlocks: 987,
            avg_lock_size: "5000000000000000000".to_string(), // 5 ETH
            avg_lock_duration: 604800, // 7 days
        },
        provers: ProverAnalytics {
            active_provers: 12,
            new_provers: 2,
            exited_provers: 0,
            avg_stake: "32000000000000000000".to_string(), // 32 ETH
        },
        challenges: ChallengeAnalytics {
            total_challenges: 15,
            successful_challenges: 9,
            success_rate: 60.0,
            total_slashed: "45000000000000000000".to_string(), // 45 ETH
        },
        fees: FeeAnalytics {
            total_fees: "22500000000000000000".to_string(), // 22.5 ETH
            prover_fees: "18000000000000000000".to_string(), // 18 ETH (80%)
            protocol_fees: "3375000000000000000".to_string(), // 3.375 ETH (15%)
            insurance_fees: "1125000000000000000".to_string(), // 1.125 ETH (5%)
        },
        time_series: (0..30).map(|i| {
            TimeSeriesDataPoint {
                timestamp: now - (29 - i) * day_seconds,
                volume: format!("{}", 100_000_000_000_000_000_000u128 + (i as u128 * 10_000_000_000_000_000_000)),
                locks: 30 + (i % 20) as u32,
                unlocks: 20 + (i % 15) as u32,
                challenges: (i % 3) as u32,
            }
        }).collect(),
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
    fn test_search_type_serialization() {
        let search_type = SearchType::Lock;
        let json = serde_json::to_string(&search_type).unwrap();
        assert_eq!(json, "\"lock\"");
    }

    #[test]
    fn test_explorer_lock_status_serialization() {
        let status = ExplorerLockStatus::Active;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"active\"");

        let status2 = ExplorerLockStatus::UnlockPending;
        let json2 = serde_json::to_string(&status2).unwrap();
        assert_eq!(json2, "\"unlock_pending\"");
    }

    #[test]
    fn test_challenge_status_serialization() {
        let status = ExplorerChallengeStatus::Pending;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"pending\"");

        let status2 = ExplorerChallengeStatus::Succeeded;
        let json2 = serde_json::to_string(&status2).unwrap();
        assert_eq!(json2, "\"succeeded\"");
    }

    #[test]
    fn test_prover_status_serialization() {
        let status = ExplorerProverStatus::Active;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"active\"");

        let status2 = ExplorerProverStatus::Exiting;
        let json2 = serde_json::to_string(&status2).unwrap();
        assert_eq!(json2, "\"exiting\"");
    }

    #[test]
    fn test_network_stats_serialization() {
        let stats = NetworkStats {
            total_value_locked: "1000000000000000000000".to_string(),
            total_value_locked_usd: "2500000".to_string(),
            total_locks: 1000,
            total_unlocks: 500,
            active_provers: 10,
            total_challenges: 25,
            successful_challenges: 15,
            total_fees: "50000000000000000000".to_string(),
            current_edition: "Community".to_string(),
        };

        let json = serde_json::to_string(&stats).unwrap();
        assert!(json.contains("totalValueLocked"));
        assert!(json.contains("activeProvers"));
        assert!(json.contains("currentEdition"));
    }
}
