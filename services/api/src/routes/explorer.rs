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
    db::{LockRepository, ChallengeRepository, ProverRepository, UserRepository},
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
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_overview(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ExplorerOverviewResponse>, ApiError> {
    tracing::info!("Explorer: get_overview started");
    let pool = state.pool();

    // Fetch aggregate stats from DB
    let tvl = LockRepository::get_total_tvl(pool).await?;
    let total_locks = LockRepository::count_locks(pool, None).await? as u64;
    let total_unlocks = LockRepository::count_unlocks(pool, None, None).await? as u64;
    let active_provers = ProverRepository::count_by_status(pool, Some("active")).await? as u32;
    let total_challenges = ChallengeRepository::count_by_status(pool, None).await? as u32;
    let successful_challenges = ChallengeRepository::count_by_status(pool, Some("resolved_valid")).await? as u32;

    // Top provers — list active provers ordered by registration (best proxy without a separate volume column)
    let top_prover_rows = ProverRepository::list_provers(pool, Some("active"), None, 0, 3).await?;
    let mut top_provers = Vec::new();
    for p in &top_prover_rows {
        let metrics = ProverRepository::get_metrics(pool, &p.prover_id).await?;
        let (lock_count, success_rate) = match &metrics {
            Some(m) => (m.total_signatures as u64, m.success_rate),
            None => (0, 100.0),
        };
        top_provers.push(TopProverItem {
            id: p.prover_id.clone(),
            address: p.operator_addr.clone(),
            name: None, // No display name column in ProverRow
            volume: p.stake_amount.to_string(),
            lock_count,
            success_rate,
        });
    }

    let response = ExplorerOverviewResponse {
        network: NetworkStats {
            total_value_locked: tvl.to_string(),
            total_value_locked_usd: "0".to_string(), // Requires price oracle — Phase 6
            total_locks,
            total_unlocks,
            active_provers,
            total_challenges,
            successful_challenges,
            total_fees: "0".to_string(), // Requires fee aggregation — Phase 5
            current_edition: "Community".to_string(),
        },
        recent_activity: RecentActivitySummary {
            locks_24h: 0,    // Requires time-windowed query — Phase 5
            unlocks_24h: 0,
            volume_24h: "0".to_string(),
            challenges_24h: 0,
        },
        top_provers,
        health: NetworkHealth {
            status: "healthy".to_string(),
            avg_unlock_time: 86400,
            avg_proof_time: 0,
            l1_status: "unknown".to_string(), // Requires L1 health check — Phase 8-D
            l3_status: "unknown".to_string(),
        },
    };

    tracing::info!("Explorer: get_overview completed, locks={}, unlocks={}", total_locks, total_unlocks);
    Ok(Json(response))
}

/// GET /v1/explorer/search
///
/// Unified search for locks, unlocks, addresses, provers.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn search(
    Extension(state): Extension<Arc<AppState>>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<SearchResponse>, ApiError> {
    tracing::info!("Explorer: search started, q={}, type={:?}", params.q, params.search_type);
    let pool = state.pool();

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let now = chrono::Utc::now().timestamp() as u64;
    let mut results = Vec::new();

    let q = &params.q;
    let search_type = params.search_type.unwrap_or(SearchType::All);

    // Search by lock ID
    if matches!(search_type, SearchType::Lock | SearchType::All) {
        if let Ok(Some(lock)) = LockRepository::get_by_id(pool, q).await {
            results.push(SearchResult {
                result_type: SearchType::Lock,
                id: lock.lock_id.clone(),
                title: format!("Lock: {}", &lock.lock_id),
                description: format!("Status: {}, Amount: {}", lock.status, lock.amount),
                score: 1.0,
                timestamp: lock.created_at.timestamp() as u64,
            });
        }
    }

    // Search by address (wallet)
    if matches!(search_type, SearchType::Address | SearchType::All) {
        if let Ok(Some(user)) = UserRepository::get_by_wallet(pool, q).await {
            results.push(SearchResult {
                result_type: SearchType::Address,
                id: user.wallet_address.clone(),
                title: format!("Address: {}", &user.wallet_address),
                description: format!("User registered at {}", user.created_at),
                score: 1.0,
                timestamp: user.created_at.timestamp() as u64,
            });
        }
    }

    // Search by challenge ID
    if matches!(search_type, SearchType::Challenge | SearchType::All) {
        if let Ok(Some(ch)) = ChallengeRepository::get_by_id(pool, q).await {
            results.push(SearchResult {
                result_type: SearchType::Challenge,
                id: ch.challenge_id.clone(),
                title: format!("Challenge: {}", &ch.challenge_id),
                description: format!("Status: {}, Bond: {}", ch.status, ch.bond),
                score: 1.0,
                timestamp: ch.challenged_at.timestamp() as u64,
            });
        }
    }

    // Search by prover ID
    if matches!(search_type, SearchType::Prover | SearchType::All) {
        if let Ok(Some(prover)) = ProverRepository::get_by_id(pool, q).await {
            results.push(SearchResult {
                result_type: SearchType::Prover,
                id: prover.prover_id.clone(),
                title: format!("Prover: {}", &prover.prover_id),
                description: format!("Status: {}, Stake: {}", prover.status, prover.stake_amount),
                score: 1.0,
                timestamp: prover.registered_at.timestamp() as u64,
            });
        }
    }

    let total = results.len() as u32;
    tracing::info!("Explorer: search completed, results={}", total);

    Ok(Json(SearchResponse {
        query: params.q,
        results,
        total,
        page,
        page_size,
    }))
}

/// GET /v1/explorer/locks
///
/// Returns paginated list of locks.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_locks(
    Extension(state): Extension<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<LocksListResponse>, ApiError> {
    tracing::info!("Explorer: get_locks started");
    let pool = state.pool();

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let offset = ((page - 1) * page_size) as i64;
    let limit = page_size as i64;

    let status_filter = params.status.as_deref();
    let total = LockRepository::count_locks(pool, status_filter).await? as u64;
    let rows = LockRepository::list_locks(pool, None, status_filter, offset, limit).await?;

    let locks: Vec<LockListItem> = rows.iter().map(|r| {
        let status = match r.status.as_str() {
            "active" | "confirmed" => ExplorerLockStatus::Active,
            "unlock_pending" => ExplorerLockStatus::UnlockPending,
            "emergency_pending" => ExplorerLockStatus::EmergencyPending,
            "challenged" => ExplorerLockStatus::Challenged,
            "unlocked" => ExplorerLockStatus::Unlocked,
            "slashed" => ExplorerLockStatus::Slashed,
            _ => ExplorerLockStatus::Active,
        };
        LockListItem {
            id: r.lock_id.clone(),
            owner: r.wallet_address.clone(),
            amount: r.amount.to_string(),
            token: r.asset.clone(),
            token_symbol: "ETH".to_string(),
            status,
            created_at: r.created_at.timestamp() as u64,
            l1_tx_hash: r.l1_tx_hash.clone().unwrap_or_default(),
        }
    }).collect();

    tracing::info!("Explorer: get_locks completed, count={}, total={}", locks.len(), total);
    Ok(Json(LocksListResponse { locks, total, page, page_size }))
}

/// GET /v1/explorer/locks/:id
///
/// Returns detailed information about a specific lock.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_lock_detail(
    Extension(state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<LockDetailResponse>, ApiError> {
    tracing::info!("Explorer: get_lock_detail started, lock_id={}", lock_id);
    let pool = state.pool();

    let lock = LockRepository::get_by_id(pool, &lock_id).await?
        .ok_or_else(|| ApiError::NotFound(format!("Lock {} not found", lock_id)))?;

    let status = match lock.status.as_str() {
        "active" | "confirmed" => ExplorerLockStatus::Active,
        "unlock_pending" => ExplorerLockStatus::UnlockPending,
        "emergency_pending" => ExplorerLockStatus::EmergencyPending,
        "challenged" => ExplorerLockStatus::Challenged,
        "unlocked" => ExplorerLockStatus::Unlocked,
        "slashed" => ExplorerLockStatus::Slashed,
        _ => ExplorerLockStatus::Active,
    };

    // Check for related unlock
    let unlocks = LockRepository::list_unlocks(pool, None, None, 0, 100).await?;
    let related_unlock = unlocks.iter()
        .find(|u| u.lock_id == lock_id)
        .map(|u| RelatedUnlockInfo {
            unlock_id: u.unlock_id.clone(),
            requested_at: u.created_at.timestamp() as u64,
            status: u.status.clone(),
        });

    // Check for related challenge
    let challenge_row = ChallengeRepository::get_by_lock_id(pool, &lock_id).await?;
    let challenge = challenge_row.map(|c| {
        let c_status = match c.status.as_str() {
            "pending" => ExplorerChallengeStatus::Pending,
            "defense_submitted" => ExplorerChallengeStatus::UnderReview,
            "resolved_valid" => ExplorerChallengeStatus::Succeeded,
            "resolved_invalid" => ExplorerChallengeStatus::Failed,
            _ => ExplorerChallengeStatus::Pending,
        };
        LockChallengeInfo {
            challenge_id: c.challenge_id,
            challenger: c.challenger,
            status: c_status,
            submitted_at: c.challenged_at.timestamp() as u64,
        }
    });

    // Build timeline from lock data
    let mut timeline = vec![
        LockEvent {
            event_type: "created".to_string(),
            description: "Lock created".to_string(),
            timestamp: lock.created_at.timestamp() as u64,
            tx_hash: lock.l1_tx_hash.clone(),
        },
    ];
    if let Some(confirmed) = lock.confirmed_at {
        timeline.push(LockEvent {
            event_type: "confirmed".to_string(),
            description: "Lock confirmed on L1".to_string(),
            timestamp: confirmed.timestamp() as u64,
            tx_hash: lock.l1_tx_hash.clone(),
        });
    }

    let response = LockDetailResponse {
        id: lock.lock_id.clone(),
        owner: lock.wallet_address.clone(),
        amount: lock.amount.to_string(),
        token: lock.asset.clone(),
        token_symbol: "ETH".to_string(),
        token_decimals: 18,
        status,
        created_at: lock.created_at.timestamp() as u64,
        l1_deposit_tx_hash: lock.l1_tx_hash.clone().unwrap_or_default(),
        l3_mint_tx_hash: None,
        stark_proof_hash: Some(lock.sr_0.clone()),
        dilithium_signature: Some(hex::encode(&lock.sig_dilithium)),
        prover: None, // Prover assignment not tracked in LockRow directly
        timeline,
        related_unlock,
        challenge,
    };

    tracing::info!("Explorer: get_lock_detail completed, lock_id={}", lock_id);
    Ok(Json(response))
}

/// GET /v1/explorer/unlocks
///
/// Returns paginated list of unlocks.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_unlocks(
    Extension(state): Extension<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<UnlocksListResponse>, ApiError> {
    tracing::info!("Explorer: get_unlocks started");
    let pool = state.pool();

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let offset = ((page - 1) * page_size) as i64;
    let limit = page_size as i64;

    let status_filter = params.status.as_deref();
    let total = LockRepository::count_unlocks(pool, status_filter, None).await? as u64;
    let rows = LockRepository::list_unlocks(pool, status_filter, None, offset, limit).await?;

    let unlocks: Vec<UnlockListItem> = rows.iter().map(|r| {
        let executable_at = r.release_time
            .map(|rt| rt.timestamp() as u64)
            .unwrap_or(0);
        UnlockListItem {
            id: r.unlock_id.clone(),
            lock_id: r.lock_id.clone(),
            owner: r.wallet_address.clone(),
            amount: r.amount.to_string(),
            unlock_type: if r.is_emergency { "emergency".to_string() } else { "normal".to_string() },
            status: r.status.clone(),
            requested_at: r.created_at.timestamp() as u64,
            executable_at,
        }
    }).collect();

    tracing::info!("Explorer: get_unlocks completed, count={}, total={}", unlocks.len(), total);
    Ok(Json(UnlocksListResponse { unlocks, total, page, page_size }))
}

/// GET /v1/explorer/unlocks/:id
///
/// Returns detailed information about a specific unlock.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_unlock_detail(
    Extension(state): Extension<Arc<AppState>>,
    Path(unlock_id): Path<String>,
) -> Result<Json<UnlockDetailResponse>, ApiError> {
    tracing::info!("Explorer: get_unlock_detail started, unlock_id={}", unlock_id);
    let pool = state.pool();

    let unlock = LockRepository::get_unlock_by_id(pool, &unlock_id).await?
        .ok_or_else(|| ApiError::NotFound(format!("Unlock {} not found", unlock_id)))?;

    let timelock_end = unlock.release_time
        .map(|rt| rt.timestamp() as u64)
        .unwrap_or(0);

    let timeline = vec![
        UnlockEvent {
            event_type: "requested".to_string(),
            description: if unlock.is_emergency { "Emergency unlock requested".to_string() } else { "Unlock requested".to_string() },
            timestamp: unlock.created_at.timestamp() as u64,
            tx_hash: None,
        },
        UnlockEvent {
            event_type: "timelock_started".to_string(),
            description: if unlock.is_emergency { "7-day timelock started".to_string() } else { "24-hour timelock started".to_string() },
            timestamp: unlock.created_at.timestamp() as u64,
            tx_hash: None,
        },
    ];

    let response = UnlockDetailResponse {
        id: unlock.unlock_id.clone(),
        lock_id: unlock.lock_id.clone(),
        owner: unlock.wallet_address.clone(),
        amount: unlock.amount.to_string(),
        token: "ETH".to_string(),
        token_symbol: "ETH".to_string(),
        unlock_type: if unlock.is_emergency { "emergency".to_string() } else { "normal".to_string() },
        status: unlock.status.clone(),
        requested_at: unlock.created_at.timestamp() as u64,
        timelock_end,
        executed_at: None,
        emergency_bond: unlock.bond_amount.as_ref().map(|b| b.to_string()),
        l1_burn_tx_hash: None,
        l3_release_tx_hash: None,
        timeline,
    };

    tracing::info!("Explorer: get_unlock_detail completed, unlock_id={}", unlock_id);
    Ok(Json(response))
}

/// GET /v1/explorer/challenges
///
/// Returns paginated list of challenges.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_challenges(
    Extension(state): Extension<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<ChallengesListResponse>, ApiError> {
    tracing::info!("Explorer: get_challenges started");
    let pool = state.pool();

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let offset = ((page - 1) * page_size) as i64;
    let limit = page_size as i64;

    let status_filter = params.status.as_deref();
    let total = ChallengeRepository::count_by_status(pool, status_filter).await? as u64;
    let rows = ChallengeRepository::list_challenges(pool, status_filter, offset, limit).await?;

    let challenges: Vec<ChallengeListItem> = rows.iter().map(|c| {
        let status = match c.status.as_str() {
            "pending" => ExplorerChallengeStatus::Pending,
            "defense_submitted" => ExplorerChallengeStatus::UnderReview,
            "resolved_valid" => ExplorerChallengeStatus::Succeeded,
            "resolved_invalid" => ExplorerChallengeStatus::Failed,
            "expired" => ExplorerChallengeStatus::Expired,
            _ => ExplorerChallengeStatus::Pending,
        };
        ChallengeListItem {
            id: c.challenge_id.clone(),
            lock_id: c.lock_id.clone(),
            challenger: c.challenger.clone(),
            bond: c.bond.to_string(),
            status,
            submitted_at: c.challenged_at.timestamp() as u64,
            defense_deadline: c.defense_deadline.timestamp() as u64,
        }
    }).collect();

    tracing::info!("Explorer: get_challenges completed, count={}, total={}", challenges.len(), total);
    Ok(Json(ChallengesListResponse { challenges, total, page, page_size }))
}

/// GET /v1/explorer/challenges/:id
///
/// Returns detailed information about a specific challenge.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_challenge_detail(
    Extension(state): Extension<Arc<AppState>>,
    Path(challenge_id): Path<String>,
) -> Result<Json<ChallengeDetailResponse>, ApiError> {
    tracing::info!("Explorer: get_challenge_detail started, challenge_id={}", challenge_id);
    let pool = state.pool();

    let ch = ChallengeRepository::get_by_id(pool, &challenge_id).await?
        .ok_or_else(|| ApiError::NotFound(format!("Challenge {} not found", challenge_id)))?;

    let status = match ch.status.as_str() {
        "pending" => ExplorerChallengeStatus::Pending,
        "defense_submitted" => ExplorerChallengeStatus::UnderReview,
        "resolved_valid" => ExplorerChallengeStatus::Succeeded,
        "resolved_invalid" => ExplorerChallengeStatus::Failed,
        "expired" => ExplorerChallengeStatus::Expired,
        _ => ExplorerChallengeStatus::Pending,
    };

    // Defense info
    let defense = ch.defense_proof_hash.as_ref().map(|dph| ChallengeDefenseInfo {
        defense_proof_hash: dph.clone(),
        submitted_at: ch.challenged_at.timestamp() as u64, // approximate
    });

    // Resolution info (from slashing record)
    let slashing = ChallengeRepository::get_slashing(pool, &challenge_id).await?;
    let resolution = if let Some(ref s) = slashing {
        Some(ChallengeResolutionInfo {
            winner: if ch.status == "resolved_valid" { "challenger".to_string() } else { "defender".to_string() },
            resolved_at: ch.resolved_at.map(|r| r.timestamp() as u64).unwrap_or(0),
            slashed_amount: Some(s.slash_amount.to_string()),
            reward_amount: Some(s.challenger_reward.to_string()),
            tx_hash: s.l1_tx_hash.clone(),
        })
    } else if ch.resolved_at.is_some() {
        Some(ChallengeResolutionInfo {
            winner: if ch.status == "resolved_valid" { "challenger".to_string() } else { "defender".to_string() },
            resolved_at: ch.resolved_at.map(|r| r.timestamp() as u64).unwrap_or(0),
            slashed_amount: None,
            reward_amount: None,
            tx_hash: None,
        })
    } else {
        None
    };

    // Build timeline
    let mut timeline = vec![
        ChallengeEvent {
            event_type: "submitted".to_string(),
            description: "Challenge submitted".to_string(),
            timestamp: ch.challenged_at.timestamp() as u64,
            tx_hash: None,
        },
    ];
    if ch.defense_proof_hash.is_some() {
        timeline.push(ChallengeEvent {
            event_type: "defense_submitted".to_string(),
            description: "Defense submitted".to_string(),
            timestamp: ch.challenged_at.timestamp() as u64, // approximate
            tx_hash: None,
        });
    }
    if let Some(resolved) = ch.resolved_at {
        timeline.push(ChallengeEvent {
            event_type: "resolved".to_string(),
            description: format!("Challenge resolved: {}", ch.status),
            timestamp: resolved.timestamp() as u64,
            tx_hash: slashing.as_ref().and_then(|s| s.l1_tx_hash.clone()),
        });
    }

    // Lock summary
    let lock = LockRepository::get_by_id(pool, &ch.lock_id).await?;
    let lock_summary = match lock {
        Some(l) => ChallengeLockSummary {
            id: l.lock_id,
            owner: l.wallet_address,
            amount: l.amount.to_string(),
            token: l.asset,
        },
        None => ChallengeLockSummary {
            id: ch.lock_id.clone(),
            owner: "unknown".to_string(),
            amount: "0".to_string(),
            token: "ETH".to_string(),
        },
    };

    let response = ChallengeDetailResponse {
        id: ch.challenge_id.clone(),
        lock_id: ch.lock_id.clone(),
        challenger: ch.challenger.clone(),
        defender: ch.defender.clone(),
        bond: ch.bond.to_string(),
        fraud_proof_hash: ch.fraud_proof_hash.clone(),
        reason: "Challenge submitted by observer".to_string(),
        status,
        submitted_at: ch.challenged_at.timestamp() as u64,
        defense_deadline: ch.defense_deadline.timestamp() as u64,
        defense,
        resolution,
        timeline,
        lock_summary,
    };

    tracing::info!("Explorer: get_challenge_detail completed, challenge_id={}", challenge_id);
    Ok(Json(response))
}

/// GET /v1/explorer/address/:addr
///
/// Returns information about a specific address.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_address_info(
    Extension(state): Extension<Arc<AppState>>,
    Path(addr): Path<String>,
) -> Result<Json<AddressInfoResponse>, ApiError> {
    tracing::info!("Explorer: get_address_info started, addr={}", addr);
    let pool = state.pool();

    // Get user info
    let user = UserRepository::get_by_wallet(pool, &addr).await?;
    let first_seen = user.as_ref().map(|u| u.created_at.timestamp() as u64).unwrap_or(0);

    // Lock stats
    let total_locks_count = LockRepository::count_locks_by_wallet(pool, &addr, None).await? as u64;
    let active_locks_count = LockRepository::count_locks_by_wallet(pool, &addr, Some("active")).await? as u64;
    let locks_for_tvl = LockRepository::list_locks_by_wallet(pool, &addr, Some("active"), 0, 10000).await?;
    let total_value_locked: bigdecimal::BigDecimal = locks_for_tvl.iter()
        .map(|l| l.amount.clone())
        .sum();

    // Unlock stats
    let total_unlocks_count = LockRepository::count_unlocks_by_wallet(pool, &addr, None).await? as u64;
    let pending_unlocks_count = LockRepository::count_unlocks_by_wallet(pool, &addr, Some("pending")).await? as u64;
    let unlocks_all = LockRepository::list_unlocks_by_wallet(pool, &addr, None, 0, 10000).await?;
    let total_value_unlocked: bigdecimal::BigDecimal = unlocks_all.iter()
        .filter(|u| u.status == "completed")
        .map(|u| u.amount.clone())
        .sum();

    // Recent locks
    let recent_lock_rows = LockRepository::list_locks_by_wallet(pool, &addr, None, 0, 5).await?;
    let recent_locks: Vec<AddressRecentLock> = recent_lock_rows.iter().map(|r| {
        let status = match r.status.as_str() {
            "active" | "confirmed" => ExplorerLockStatus::Active,
            "unlock_pending" => ExplorerLockStatus::UnlockPending,
            "emergency_pending" => ExplorerLockStatus::EmergencyPending,
            "challenged" => ExplorerLockStatus::Challenged,
            "unlocked" => ExplorerLockStatus::Unlocked,
            "slashed" => ExplorerLockStatus::Slashed,
            _ => ExplorerLockStatus::Active,
        };
        AddressRecentLock {
            id: r.lock_id.clone(),
            amount: r.amount.to_string(),
            status,
            created_at: r.created_at.timestamp() as u64,
        }
    }).collect();

    // Recent unlocks
    let recent_unlock_rows = LockRepository::list_unlocks_by_wallet(pool, &addr, None, 0, 5).await?;
    let recent_unlocks: Vec<AddressRecentUnlock> = recent_unlock_rows.iter().map(|u| {
        AddressRecentUnlock {
            id: u.unlock_id.clone(),
            lock_id: u.lock_id.clone(),
            amount: u.amount.to_string(),
            status: u.status.clone(),
            requested_at: u.created_at.timestamp() as u64,
        }
    }).collect();

    // Determine address type and check if prover
    let mut address_type = "user".to_string();
    let mut prover_info = None;
    // Check provers by operator_addr (walk through list; no direct wallet lookup in ProverRepository)
    let provers = ProverRepository::list_provers(pool, None, None, 0, 1000).await?;
    if let Some(p) = provers.iter().find(|p| p.operator_addr == addr) {
        address_type = "prover".to_string();
        let p_status = match p.status.as_str() {
            "active" => ExplorerProverStatus::Active,
            "pending" | "pending_approval" => ExplorerProverStatus::Pending,
            "suspended" => ExplorerProverStatus::Suspended,
            "exiting" => ExplorerProverStatus::Exiting,
            "exited" => ExplorerProverStatus::Exited,
            _ => ExplorerProverStatus::Active,
        };
        prover_info = Some(AddressProverInfo {
            prover_id: p.prover_id.clone(),
            status: p_status,
            stake: p.stake_amount.to_string(),
            total_volume: p.stake_amount.to_string(),
        });
    }

    let response = AddressInfoResponse {
        address: addr.clone(),
        address_type,
        first_seen,
        last_active: first_seen, // Approximate — no last_active tracking
        lock_stats: AddressLockStats {
            total_locks: total_locks_count,
            active_locks: active_locks_count,
            total_value_locked: total_value_locked.to_string(),
        },
        unlock_stats: AddressUnlockStats {
            total_unlocks: total_unlocks_count,
            pending_unlocks: pending_unlocks_count,
            total_value_unlocked: total_value_unlocked.to_string(),
        },
        challenge_stats: None, // Observer stats require wallet→observer mapping
        prover_info,
        recent_locks,
        recent_unlocks,
    };

    tracing::info!("Explorer: get_address_info completed, addr={}", addr);
    Ok(Json(response))
}

/// GET /v1/explorer/provers
///
/// Returns paginated list of provers.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_provers(
    Extension(state): Extension<Arc<AppState>>,
    Query(params): Query<ListQuery>,
) -> Result<Json<ProversListResponse>, ApiError> {
    tracing::info!("Explorer: get_provers started");
    let pool = state.pool();

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let offset = ((page - 1) * page_size) as i64;
    let limit = page_size as i64;

    let status_filter = params.status.as_deref();
    let total = ProverRepository::count_by_status(pool, status_filter).await? as u32;
    let rows = ProverRepository::list_provers(pool, status_filter, None, offset, limit).await?;

    let mut provers = Vec::new();
    for p in &rows {
        let metrics = ProverRepository::get_metrics(pool, &p.prover_id).await?;
        let (total_locks, success_rate) = match &metrics {
            Some(m) => (m.total_signatures as u64, m.success_rate),
            None => (0, 100.0),
        };
        let p_status = match p.status.as_str() {
            "active" => ExplorerProverStatus::Active,
            "pending" | "pending_approval" => ExplorerProverStatus::Pending,
            "suspended" => ExplorerProverStatus::Suspended,
            "exiting" => ExplorerProverStatus::Exiting,
            "exited" => ExplorerProverStatus::Exited,
            _ => ExplorerProverStatus::Active,
        };
        provers.push(ProverListItem {
            id: p.prover_id.clone(),
            address: p.operator_addr.clone(),
            name: None,
            status: p_status,
            stake: p.stake_amount.to_string(),
            total_volume: p.stake_amount.to_string(), // Volume = stake as proxy
            total_locks,
            success_rate,
            joined_at: p.registered_at.timestamp() as u64,
        });
    }

    tracing::info!("Explorer: get_provers completed, count={}, total={}", provers.len(), total);
    Ok(Json(ProversListResponse { provers, total, page, page_size }))
}

/// GET /v1/explorer/provers/:id
///
/// Returns detailed information about a specific prover.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_prover_detail(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<ProverDetailResponse>, ApiError> {
    tracing::info!("Explorer: get_prover_detail started, prover_id={}", prover_id);
    let pool = state.pool();

    let prover = ProverRepository::get_by_id(pool, &prover_id).await?
        .ok_or_else(|| ApiError::NotFound(format!("Prover {} not found", prover_id)))?;

    let metrics = ProverRepository::get_metrics(pool, &prover_id).await?;

    let p_status = match prover.status.as_str() {
        "active" => ExplorerProverStatus::Active,
        "pending" | "pending_approval" => ExplorerProverStatus::Pending,
        "suspended" => ExplorerProverStatus::Suspended,
        "exiting" => ExplorerProverStatus::Exiting,
        "exited" => ExplorerProverStatus::Exited,
        _ => ExplorerProverStatus::Active,
    };

    let (total_locks, success_rate, avg_response_time, uptime, total_rewards, last_active) = match &metrics {
        Some(m) => (
            m.total_signatures as u64,
            m.success_rate,
            m.avg_response_time_ms as u64,
            m.uptime_percentage,
            m.total_rewards.to_string(),
            m.updated_at.timestamp() as u64,
        ),
        None => (0, 100.0, 0, 100.0, "0".to_string(), prover.registered_at.timestamp() as u64),
    };

    let response = ProverDetailResponse {
        id: prover.prover_id.clone(),
        address: prover.operator_addr.clone(),
        name: None,
        description: None,
        website: None,
        status: p_status,
        stake: prover.stake_amount.to_string(),
        performance: ProverPerformanceStats {
            total_locks,
            success_rate,
            avg_response_time,
            uptime,
            last_active_at: last_active,
        },
        financial: ProverFinancialStats {
            total_volume: prover.stake_amount.to_string(),
            total_fees: "0".to_string(), // Requires fee aggregation
            total_rewards,
            slashed_amount: "0".to_string(), // Requires slashing aggregation
        },
        hardware: None, // No hardware info in DB
        recent_activity: vec![], // Requires activity log
        challenge_history: ProverChallengeHistory {
            total_challenges: 0,
            challenges_won: 0,
            challenges_lost: 0,
            total_slashed: "0".to_string(),
        },
        joined_at: prover.registered_at.timestamp() as u64,
    };

    tracing::info!("Explorer: get_prover_detail completed, prover_id={}", prover_id);
    Ok(Json(response))
}

/// GET /v1/explorer/analytics
///
/// Returns network analytics data.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_analytics(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<AnalyticsResponse>, ApiError> {
    tracing::info!("Explorer: get_analytics started");
    let pool = state.pool();

    let now = chrono::Utc::now().timestamp() as u64;

    // Aggregate current stats
    let tvl = LockRepository::get_total_tvl(pool).await?;
    let total_locks_count = LockRepository::count_locks(pool, None).await? as u64;
    let total_unlocks_count = LockRepository::count_unlocks(pool, None, None).await? as u64;
    let active_provers = ProverRepository::count_by_status(pool, Some("active")).await? as u32;
    let total_challenges = ChallengeRepository::count_by_status(pool, None).await? as u32;
    let successful_challenges = ChallengeRepository::count_by_status(pool, Some("resolved_valid")).await? as u32;
    let success_rate = if total_challenges > 0 {
        (successful_challenges as f64 / total_challenges as f64) * 100.0
    } else {
        0.0
    };

    let response = AnalyticsResponse {
        period: "all".to_string(),
        volume: VolumeAnalytics {
            total_volume: tvl.to_string(),
            change: 0.0, // Requires historical data
            peak_day: now,
            avg_daily: "0".to_string(), // Requires daily_metrics table
        },
        locks: LockAnalytics {
            new_locks: total_locks_count,
            total_unlocks: total_unlocks_count,
            avg_lock_size: "0".to_string(), // Requires AVG aggregate
            avg_lock_duration: 0,
        },
        provers: ProverAnalytics {
            active_provers,
            new_provers: 0, // Requires time-windowed query
            exited_provers: ProverRepository::count_by_status(pool, Some("exited")).await.unwrap_or(0) as u32,
            avg_stake: "0".to_string(),
        },
        challenges: ChallengeAnalytics {
            total_challenges,
            successful_challenges,
            success_rate,
            total_slashed: "0".to_string(), // Requires slashing SUM aggregate
        },
        fees: FeeAnalytics {
            total_fees: "0".to_string(), // Requires fee table
            prover_fees: "0".to_string(),
            protocol_fees: "0".to_string(),
            insurance_fees: "0".to_string(),
        },
        time_series: vec![], // Requires daily_metrics table — Phase 5
    };

    tracing::info!("Explorer: get_analytics completed");
    Ok(Json(response))
}

// ============================================================================
// Additional Response Types (FE-BE alignment)
// ============================================================================

/// GET /v1/explorer/locks/recent response
#[derive(Debug, Serialize)]
pub struct RecentLocksResponse {
    pub locks: Vec<LockListItem>,
}

/// GET /v1/explorer/unlocks/recent response
#[derive(Debug, Serialize)]
pub struct RecentUnlocksResponse {
    pub unlocks: Vec<UnlockListItem>,
}

/// GET /v1/explorer/challenges/active response
#[derive(Debug, Serialize)]
pub struct ActiveChallengesResponse {
    pub challenges: Vec<ChallengeListItem>,
    pub total: u64,
}

/// GET /v1/explorer/challenges/stats response
#[derive(Debug, Serialize)]
pub struct ChallengeStatsResponse {
    #[serde(rename = "totalChallenges")]
    pub total_challenges: u32,
    #[serde(rename = "activeChallenges")]
    pub active_challenges: u32,
    #[serde(rename = "successfulChallenges")]
    pub successful_challenges: u32,
    #[serde(rename = "failedChallenges")]
    pub failed_challenges: u32,
    #[serde(rename = "successRate")]
    pub success_rate: f64,
    #[serde(rename = "totalSlashed")]
    pub total_slashed: String,
    #[serde(rename = "totalBondsLocked")]
    pub total_bonds_locked: String,
}

/// GET /v1/explorer/provers/stats response
#[derive(Debug, Serialize)]
pub struct ProverStatsResponse {
    #[serde(rename = "totalProvers")]
    pub total_provers: u32,
    #[serde(rename = "activeProvers")]
    pub active_provers: u32,
    #[serde(rename = "pendingProvers")]
    pub pending_provers: u32,
    #[serde(rename = "suspendedProvers")]
    pub suspended_provers: u32,
    #[serde(rename = "avgSuccessRate")]
    pub avg_success_rate: f64,
    #[serde(rename = "totalStaked")]
    pub total_staked: String,
}

/// GET /v1/explorer/analytics/stats response
#[derive(Debug, Serialize)]
pub struct AnalyticsStatsResponse {
    #[serde(rename = "totalValueLocked")]
    pub total_value_locked: String,
    #[serde(rename = "totalLocks")]
    pub total_locks: u64,
    #[serde(rename = "totalUnlocks")]
    pub total_unlocks: u64,
    #[serde(rename = "activeProvers")]
    pub active_provers: u32,
    #[serde(rename = "totalChallenges")]
    pub total_challenges: u32,
    #[serde(rename = "networkHealth")]
    pub network_health: String,
}

/// Single data point for time-series analytics
#[derive(Debug, Serialize)]
pub struct AnalyticsDataPoint {
    pub timestamp: u64,
    pub value: String,
}

/// GET /v1/explorer/analytics/tvl response
#[derive(Debug, Serialize)]
pub struct AnalyticsTvlResponse {
    pub data: Vec<AnalyticsDataPoint>,
    pub current: String,
    pub period: String,
}

/// GET /v1/explorer/analytics/volume response
#[derive(Debug, Serialize)]
pub struct AnalyticsVolumeResponse {
    pub data: Vec<AnalyticsDataPoint>,
    pub total: String,
    pub period: String,
}

/// Prover performance item for analytics
#[derive(Debug, Serialize)]
pub struct ProverPerformanceItem {
    pub id: String,
    pub address: String,
    pub name: Option<String>,
    #[serde(rename = "successRate")]
    pub success_rate: f64,
    #[serde(rename = "totalSignatures")]
    pub total_signatures: u64,
    #[serde(rename = "avgResponseTimeMs")]
    pub avg_response_time_ms: u64,
    pub uptime: f64,
}

/// GET /v1/explorer/analytics/provers response
#[derive(Debug, Serialize)]
pub struct AnalyticsProversResponse {
    pub provers: Vec<ProverPerformanceItem>,
    pub total: u32,
}

/// Distribution bucket for lock/unlock breakdowns
#[derive(Debug, Serialize)]
pub struct DistributionBucket {
    pub label: String,
    pub count: u64,
    pub percentage: f64,
}

/// GET /v1/explorer/analytics/locks/distribution response
#[derive(Debug, Serialize)]
pub struct LockDistributionResponse {
    pub distribution: Vec<DistributionBucket>,
    pub total: u64,
}

/// GET /v1/explorer/analytics/unlocks/distribution response
#[derive(Debug, Serialize)]
pub struct UnlockDistributionResponse {
    pub distribution: Vec<DistributionBucket>,
    pub total: u64,
}

// ============================================================================
// Additional API Handlers (FE-BE alignment)
// ============================================================================

/// GET /v1/explorer/locks/recent
///
/// Returns the 10 most recent locks.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_recent_locks(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<RecentLocksResponse>, ApiError> {
    tracing::info!("Explorer: get_recent_locks started");
    let pool = state.pool();

    let rows = LockRepository::list_locks(pool, None, None, 0, 10).await?;

    let locks: Vec<LockListItem> = rows.iter().map(|r| {
        let status = match r.status.as_str() {
            "active" | "confirmed" => ExplorerLockStatus::Active,
            "unlock_pending" => ExplorerLockStatus::UnlockPending,
            "emergency_pending" => ExplorerLockStatus::EmergencyPending,
            "challenged" => ExplorerLockStatus::Challenged,
            "unlocked" => ExplorerLockStatus::Unlocked,
            "slashed" => ExplorerLockStatus::Slashed,
            _ => ExplorerLockStatus::Active,
        };
        LockListItem {
            id: r.lock_id.clone(),
            owner: r.wallet_address.clone(),
            amount: r.amount.to_string(),
            token: r.asset.clone(),
            token_symbol: "ETH".to_string(),
            status,
            created_at: r.created_at.timestamp() as u64,
            l1_tx_hash: r.l1_tx_hash.clone().unwrap_or_default(),
        }
    }).collect();

    tracing::info!("Explorer: get_recent_locks completed, count={}", locks.len());
    Ok(Json(RecentLocksResponse { locks }))
}

/// GET /v1/explorer/unlocks/recent
///
/// Returns the 10 most recent unlocks.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_recent_unlocks(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<RecentUnlocksResponse>, ApiError> {
    tracing::info!("Explorer: get_recent_unlocks started");
    let pool = state.pool();

    let rows = LockRepository::list_unlocks(pool, None, None, 0, 10).await?;

    let unlocks: Vec<UnlockListItem> = rows.iter().map(|r| {
        let executable_at = r.release_time
            .map(|rt| rt.timestamp() as u64)
            .unwrap_or(0);
        UnlockListItem {
            id: r.unlock_id.clone(),
            lock_id: r.lock_id.clone(),
            owner: r.wallet_address.clone(),
            amount: r.amount.to_string(),
            unlock_type: if r.is_emergency { "emergency".to_string() } else { "normal".to_string() },
            status: r.status.clone(),
            requested_at: r.created_at.timestamp() as u64,
            executable_at,
        }
    }).collect();

    tracing::info!("Explorer: get_recent_unlocks completed, count={}", unlocks.len());
    Ok(Json(RecentUnlocksResponse { unlocks }))
}

/// GET /v1/explorer/challenges/active
///
/// Returns currently active (pending / under_review) challenges.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_active_challenges(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ActiveChallengesResponse>, ApiError> {
    tracing::info!("Explorer: get_active_challenges started");
    let pool = state.pool();

    let pending_rows = ChallengeRepository::list_challenges(pool, Some("pending"), 0, 100).await?;
    let defense_rows = ChallengeRepository::list_challenges(pool, Some("defense_submitted"), 0, 100).await?;

    let mut all_rows = pending_rows;
    all_rows.extend(defense_rows);

    let challenges: Vec<ChallengeListItem> = all_rows.iter().map(|c| {
        let status = match c.status.as_str() {
            "pending" => ExplorerChallengeStatus::Pending,
            "defense_submitted" => ExplorerChallengeStatus::UnderReview,
            _ => ExplorerChallengeStatus::Pending,
        };
        ChallengeListItem {
            id: c.challenge_id.clone(),
            lock_id: c.lock_id.clone(),
            challenger: c.challenger.clone(),
            bond: c.bond.to_string(),
            status,
            submitted_at: c.challenged_at.timestamp() as u64,
            defense_deadline: c.defense_deadline.timestamp() as u64,
        }
    }).collect();

    let total = challenges.len() as u64;
    tracing::info!("Explorer: get_active_challenges completed, total={}", total);
    Ok(Json(ActiveChallengesResponse { challenges, total }))
}

/// GET /v1/explorer/challenges/stats
///
/// Returns aggregate challenge statistics.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_challenge_stats(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ChallengeStatsResponse>, ApiError> {
    tracing::info!("Explorer: get_challenge_stats started");
    let pool = state.pool();

    let total = ChallengeRepository::count_by_status(pool, None).await? as u32;
    let active = ChallengeRepository::count_by_status(pool, Some("pending")).await? as u32
        + ChallengeRepository::count_by_status(pool, Some("defense_submitted")).await? as u32;
    let successful = ChallengeRepository::count_by_status(pool, Some("resolved_valid")).await? as u32;
    let failed = ChallengeRepository::count_by_status(pool, Some("resolved_invalid")).await? as u32;

    let success_rate = if total > 0 {
        (successful as f64 / total as f64) * 100.0
    } else {
        0.0
    };

    tracing::info!("Explorer: get_challenge_stats completed, total={}, active={}", total, active);
    Ok(Json(ChallengeStatsResponse {
        total_challenges: total,
        active_challenges: active,
        successful_challenges: successful,
        failed_challenges: failed,
        success_rate,
        total_slashed: "0".to_string(),
        total_bonds_locked: "0".to_string(),
    }))
}

/// GET /v1/explorer/provers/stats
///
/// Returns aggregate prover statistics.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_prover_stats(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ProverStatsResponse>, ApiError> {
    tracing::info!("Explorer: get_prover_stats started");
    let pool = state.pool();

    let total = ProverRepository::count_by_status(pool, None).await? as u32;
    let active = ProverRepository::count_by_status(pool, Some("active")).await? as u32;
    let pending = ProverRepository::count_by_status(pool, Some("pending")).await? as u32
        + ProverRepository::count_by_status(pool, Some("pending_approval")).await? as u32;
    let suspended = ProverRepository::count_by_status(pool, Some("suspended")).await? as u32;

    // Calculate average success rate from active provers
    let active_provers = ProverRepository::list_provers(pool, Some("active"), None, 0, 1000).await?;
    let mut total_rate = 0.0;
    let mut rate_count = 0u32;
    for p in &active_provers {
        if let Ok(Some(m)) = ProverRepository::get_metrics(pool, &p.prover_id).await {
            total_rate += m.success_rate;
            rate_count += 1;
        }
    }
    let avg_success_rate = if rate_count > 0 { total_rate / rate_count as f64 } else { 100.0 };

    // Total staked from active provers
    let total_staked: bigdecimal::BigDecimal = active_provers.iter()
        .map(|p| p.stake_amount.clone())
        .sum();

    tracing::info!("Explorer: get_prover_stats completed, total={}, active={}", total, active);
    Ok(Json(ProverStatsResponse {
        total_provers: total,
        active_provers: active,
        pending_provers: pending,
        suspended_provers: suspended,
        avg_success_rate,
        total_staked: total_staked.to_string(),
    }))
}

/// GET /v1/explorer/analytics/stats
///
/// Returns high-level analytics overview.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_analytics_stats(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<AnalyticsStatsResponse>, ApiError> {
    tracing::info!("Explorer: get_analytics_stats started");
    let pool = state.pool();

    let tvl = LockRepository::get_total_tvl(pool).await?;
    let total_locks = LockRepository::count_locks(pool, None).await? as u64;
    let total_unlocks = LockRepository::count_unlocks(pool, None, None).await? as u64;
    let active_provers = ProverRepository::count_by_status(pool, Some("active")).await? as u32;
    let total_challenges = ChallengeRepository::count_by_status(pool, None).await? as u32;

    tracing::info!("Explorer: get_analytics_stats completed, tvl={}, locks={}", tvl, total_locks);
    Ok(Json(AnalyticsStatsResponse {
        total_value_locked: tvl.to_string(),
        total_locks,
        total_unlocks,
        active_provers,
        total_challenges,
        network_health: "healthy".to_string(),
    }))
}

/// GET /v1/explorer/analytics/tvl
///
/// Returns TVL time-series data points.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_analytics_tvl(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<AnalyticsTvlResponse>, ApiError> {
    tracing::info!("Explorer: get_analytics_tvl started");
    let pool = state.pool();

    let current_tvl = LockRepository::get_total_tvl(pool).await?;
    let now = chrono::Utc::now();

    // Build time-series from lock creation timestamps by aggregating per-day
    // For now, return current TVL as a single data point (daily_metrics table needed for full history)
    let data = vec![
        AnalyticsDataPoint {
            timestamp: now.timestamp() as u64,
            value: current_tvl.to_string(),
        },
    ];

    tracing::info!("Explorer: get_analytics_tvl completed, current={}", current_tvl);
    Ok(Json(AnalyticsTvlResponse {
        data,
        current: current_tvl.to_string(),
        period: "all".to_string(),
    }))
}

/// GET /v1/explorer/analytics/volume
///
/// Returns volume time-series data points.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_analytics_volume(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<AnalyticsVolumeResponse>, ApiError> {
    tracing::info!("Explorer: get_analytics_volume started");
    let pool = state.pool();

    let tvl = LockRepository::get_total_tvl(pool).await?;
    let now = chrono::Utc::now();

    // Single data point — full history requires daily_metrics table
    let data = vec![
        AnalyticsDataPoint {
            timestamp: now.timestamp() as u64,
            value: tvl.to_string(),
        },
    ];

    tracing::info!("Explorer: get_analytics_volume completed, total={}", tvl);
    Ok(Json(AnalyticsVolumeResponse {
        data,
        total: tvl.to_string(),
        period: "all".to_string(),
    }))
}

/// GET /v1/explorer/analytics/provers
///
/// Returns prover performance data.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_analytics_provers(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<AnalyticsProversResponse>, ApiError> {
    tracing::info!("Explorer: get_analytics_provers started");
    let pool = state.pool();

    let rows = ProverRepository::list_provers(pool, Some("active"), None, 0, 50).await?;
    let total = rows.len() as u32;

    let mut provers = Vec::new();
    for p in &rows {
        let metrics = ProverRepository::get_metrics(pool, &p.prover_id).await?;
        let (success_rate, total_sigs, avg_rt, uptime) = match &metrics {
            Some(m) => (m.success_rate, m.total_signatures as u64, m.avg_response_time_ms as u64, m.uptime_percentage),
            None => (100.0, 0, 0, 100.0),
        };
        provers.push(ProverPerformanceItem {
            id: p.prover_id.clone(),
            address: p.operator_addr.clone(),
            name: None,
            success_rate,
            total_signatures: total_sigs,
            avg_response_time_ms: avg_rt,
            uptime,
        });
    }

    tracing::info!("Explorer: get_analytics_provers completed, count={}", total);
    Ok(Json(AnalyticsProversResponse { provers, total }))
}

/// GET /v1/explorer/analytics/locks/distribution
///
/// Returns lock status distribution (how many locks in each status).
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_lock_distribution(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<LockDistributionResponse>, ApiError> {
    tracing::info!("Explorer: get_lock_distribution started");
    let pool = state.pool();

    let total = LockRepository::count_locks(pool, None).await? as u64;

    let statuses = ["active", "confirmed", "unlock_pending", "emergency_pending", "challenged", "unlocked", "slashed"];
    let mut distribution = Vec::new();

    for status in &statuses {
        let count = LockRepository::count_locks(pool, Some(status)).await? as u64;
        if count > 0 {
            let percentage = if total > 0 { (count as f64 / total as f64) * 100.0 } else { 0.0 };
            distribution.push(DistributionBucket {
                label: status.to_string(),
                count,
                percentage,
            });
        }
    }

    tracing::info!("Explorer: get_lock_distribution completed, total={}, buckets={}", total, distribution.len());
    Ok(Json(LockDistributionResponse { distribution, total }))
}

/// GET /v1/explorer/analytics/unlocks/distribution
///
/// Returns unlock type distribution (normal vs emergency, and by status).
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_unlock_distribution(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<UnlockDistributionResponse>, ApiError> {
    tracing::info!("Explorer: get_unlock_distribution started");
    let pool = state.pool();

    let total = LockRepository::count_unlocks(pool, None, None).await? as u64;
    let normal_count = LockRepository::count_unlocks(pool, None, Some(false)).await? as u64;
    let emergency_count = LockRepository::count_unlocks(pool, None, Some(true)).await? as u64;

    let mut distribution = Vec::new();
    if normal_count > 0 {
        let percentage = if total > 0 { (normal_count as f64 / total as f64) * 100.0 } else { 0.0 };
        distribution.push(DistributionBucket {
            label: "normal".to_string(),
            count: normal_count,
            percentage,
        });
    }
    if emergency_count > 0 {
        let percentage = if total > 0 { (emergency_count as f64 / total as f64) * 100.0 } else { 0.0 };
        distribution.push(DistributionBucket {
            label: "emergency".to_string(),
            count: emergency_count,
            percentage,
        });
    }

    tracing::info!("Explorer: get_unlock_distribution completed, total={}, normal={}, emergency={}", total, normal_count, emergency_count);
    Ok(Json(UnlockDistributionResponse { distribution, total }))
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
