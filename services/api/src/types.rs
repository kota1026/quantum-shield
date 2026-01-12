//! API types and data structures

use serde::{Deserialize, Serialize};

// ============================================================================
// Lock Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct LockRequest {
    pub chain_id: u64,
    pub asset: String,
    pub amount: String,
    pub dest_addr: String,
    pub expiry: u64,
    pub nonce: u64,
    pub pk_dilithium: String,
    pub sig_dilithium: String,
}

#[derive(Debug, Serialize)]
pub struct LockResponse {
    pub lock_id: String,
    pub sr_0: String,
    pub smt_proof: String,
    pub status: LockStatus,
}

// ============================================================================
// Unlock Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct UnlockRequest {
    pub lock_id: String,
    pub dest_addr: String,
    pub amount: String,
    pub sig_dilithium: String,
}

#[derive(Debug, Serialize)]
pub struct UnlockResponse {
    pub unlock_id: String,
    pub sr_1: String,
    pub release_time: u64,
    pub time_lock_hours: u64,
    pub prover_signatures_required: u32,
    pub prover_signatures_collected: u32,
    pub status: UnlockStatus,
}

#[derive(Debug, Serialize)]
pub struct EmergencyUnlockResponse {
    pub unlock_id: String,
    pub sr_1: String,
    pub release_time: u64,
    pub time_lock_days: u64,
    pub bond_required: String,
    pub bond_calculation: String,
    pub status: UnlockStatus,
}

// ============================================================================
// Status Types
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LockStatus {
    Pending,
    Confirmed,
    Locked,
    UnlockPending,
    Released,
    EmergencyPending,
    Challenged,
    Slashed,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum UnlockStatus {
    PendingSignatures,
    Submitted,
    EmergencyPending,
}

#[derive(Debug, Serialize)]
pub struct StatusResponse {
    pub lock_id: String,
    pub status: LockStatus,
    pub amount: String,
    pub asset: String,
    pub owner: String,
    pub created_at: u64,
    pub time_lock_remaining: Option<i64>,
    pub release_time: Option<u64>,
    pub is_emergency: bool,
}

#[derive(Debug, Serialize)]
pub struct PendingUnlocksResponse {
    pub pending_unlocks: Vec<PendingUnlock>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct PendingUnlock {
    pub unlock_id: String,
    pub lock_id: String,
    pub status: LockStatus,
    pub release_time: u64,
    pub time_lock_remaining: i64,
    pub is_emergency: bool,
}

// ============================================================================
// Prover Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ProverRegisterRequest {
    pub operator_addr: String,
    pub sphincs_pubkey: String,
    pub stake_amount: String,
    pub hsm_attestation: String,
    pub multisig_proof: String,
}

#[derive(Debug, Serialize)]
pub struct ProverRegisterResponse {
    pub prover_id: String,
    pub status: ProverStatus,
    pub stake_locked: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProverInfoResponse {
    pub prover_id: String,
    pub operator_addr: String,
    pub status: ProverStatus,
    pub stake_amount: String,
    pub total_signatures: u64,
    pub slashing_history: Vec<SlashingEvent>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProverStatus {
    PendingApproval,
    Active,
    Inactive,
    Exiting,
    Exited,
    Slashed,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SlashingEvent {
    pub timestamp: u64,
    pub amount: String,
    pub reason: String,
}

// ============================================================================
// Edition Types
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Edition {
    Enterprise,
    Decentralized,
}

#[derive(Debug, Serialize)]
pub struct EditionResponse {
    pub current_edition: Edition,
    pub available_editions: Vec<Edition>,
    pub switch_pending: bool,
    pub next_switch_time: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub struct EditionSwitchRequest {
    pub target_edition: Edition,
    pub admin_signature: String,
}

#[derive(Debug, Serialize)]
pub struct EditionSwitchResponse {
    pub switch_id: String,
    pub target_edition: Edition,
    pub effective_time: u64,
    pub time_lock_days: u64,
    pub status: String,
}

// ============================================================================
// Internal Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lock {
    pub lock_id: String,
    pub chain_id: u64,
    pub asset: String,
    pub amount: String,
    pub dest_addr: String,
    pub expiry: u64,
    pub nonce: u64,
    pub owner: String,
    pub sr_0: String,
    pub status: LockStatus,
    pub created_at: u64,
    pub release_time: Option<u64>,
    pub is_emergency: bool,
    /// User's Dilithium-III public key (hex encoded)
    /// Required for signature verification during unlock (CP-1)
    pub user_public_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignatureRequest {
    pub unlock_id: String,
    pub lock_id: String,
    pub sr_0: String,
    pub sr_1: String,
    pub unlock_data: Vec<u8>,
    pub requested_at: u64,
    pub signatures: Vec<SphincsSignature>,
    pub required_signatures: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SphincsSignature {
    pub prover_id: String,
    pub signature: Vec<u8>,
    pub timestamp: u64,
}

// ============================================================================
// Token Hub Types (veQS / Delegation / Rewards)
// ============================================================================

/// Dashboard response for Token Hub
#[derive(Debug, Serialize)]
pub struct TokenHubDashboardResponse {
    /// User's wallet address
    pub address: String,
    /// Available QS balance (not locked)
    pub qs_balance: String,
    /// Total locked QS amount
    pub locked_qs: String,
    /// Current veQS balance (decays over time)
    pub veqs_balance: String,
    /// Voting power percentage (0.0 - 100.0)
    pub voting_power_percent: f64,
    /// Active lock position (if any)
    pub lock_position: Option<LockPosition>,
    /// Delegations made by user
    pub delegations_count: u32,
    /// Pending rewards
    pub pending_rewards: String,
}

/// Lock position in veQS
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockPosition {
    /// Locked QS amount
    pub amount: String,
    /// Lock start timestamp
    pub start_time: u64,
    /// Lock end timestamp (unlock time)
    pub unlock_time: u64,
    /// Initial lock duration in seconds
    pub lock_duration: u64,
    /// Current veQS value
    pub veqs_value: String,
    /// Multiplier (remaining_time / max_lock_time)
    pub multiplier: f64,
    /// Time remaining in human readable format
    pub time_remaining: String,
}

/// Request to create a new QS lock
#[derive(Debug, Deserialize)]
pub struct TokenHubLockRequest {
    /// Amount of QS to lock
    pub amount: String,
    /// Lock duration in seconds (min: 1 week, max: 4 years)
    pub lock_duration: u64,
}

/// Response after creating a lock
#[derive(Debug, Serialize)]
pub struct TokenHubLockResponse {
    /// Success status
    pub success: bool,
    /// Transaction hash (if submitted to L1)
    pub tx_hash: Option<String>,
    /// Created lock position
    pub lock_position: LockPosition,
    /// Estimated gas cost
    pub estimated_gas: String,
}

/// Request to extend an existing lock
#[derive(Debug, Deserialize)]
pub struct TokenHubExtendRequest {
    /// New unlock timestamp (must be > current unlock_time)
    pub new_unlock_time: u64,
}

/// Response after extending a lock
#[derive(Debug, Serialize)]
pub struct TokenHubExtendResponse {
    /// Success status
    pub success: bool,
    /// Transaction hash
    pub tx_hash: Option<String>,
    /// Updated lock position
    pub lock_position: LockPosition,
}

/// List of user's lock positions
#[derive(Debug, Serialize)]
pub struct TokenHubLocksResponse {
    /// Active lock position (only one allowed per user in veQS)
    pub active_lock: Option<LockPosition>,
    /// Historical locks (withdrawn)
    pub history: Vec<HistoricalLock>,
}

/// Historical lock record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoricalLock {
    /// Locked amount
    pub amount: String,
    /// Lock start timestamp
    pub start_time: u64,
    /// Unlock timestamp
    pub unlock_time: u64,
    /// Withdrawn timestamp
    pub withdrawn_at: u64,
}

/// Delegate information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegateInfo {
    /// Delegate address
    pub address: String,
    /// Delegate name (ENS or custom)
    pub name: Option<String>,
    /// Total veQS delegated to this delegate
    pub total_veqs: String,
    /// Number of delegators
    pub delegators_count: u32,
    /// Voting participation rate (%)
    pub participation_rate: f64,
    /// Recent proposals voted
    pub recent_votes: u32,
}

/// List of available delegates
#[derive(Debug, Serialize)]
pub struct TokenHubDelegatesResponse {
    /// List of delegates
    pub delegates: Vec<DelegateInfo>,
    /// Total number of delegates
    pub total: u32,
}

/// Request to delegate voting power
#[derive(Debug, Deserialize)]
pub struct TokenHubDelegateRequest {
    /// Address to delegate to
    pub delegatee: String,
}

/// Response after delegating
#[derive(Debug, Serialize)]
pub struct TokenHubDelegateResponse {
    /// Success status
    pub success: bool,
    /// Transaction hash
    pub tx_hash: Option<String>,
    /// New delegatee address
    pub delegatee: String,
    /// Amount of veQS delegated
    pub veqs_delegated: String,
}

/// User's delegation info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MyDelegation {
    /// Delegatee address
    pub delegatee: String,
    /// Delegatee name
    pub delegatee_name: Option<String>,
    /// Amount of veQS delegated
    pub veqs_amount: String,
    /// Percentage of total veQS delegated to this address
    pub percent_of_total: f64,
    /// Delegation timestamp
    pub delegated_at: u64,
}

/// List of user's delegations
#[derive(Debug, Serialize)]
pub struct TokenHubMyDelegationsResponse {
    /// User's delegations
    pub delegations: Vec<MyDelegation>,
    /// Total veQS delegated
    pub total_delegated: String,
    /// Self-retained veQS (not delegated)
    pub self_retained: String,
}

/// Rewards information
#[derive(Debug, Serialize)]
pub struct TokenHubRewardsResponse {
    /// Claimable rewards amount
    pub claimable: String,
    /// Claimable in USD (estimated)
    pub claimable_usd: String,
    /// Total claimed historically
    pub total_claimed: String,
    /// Current epoch number
    pub current_epoch: u64,
    /// Epoch progress (0.0 - 1.0)
    pub epoch_progress: f64,
    /// Estimated rewards for current epoch
    pub estimated_epoch_rewards: String,
    /// APY (Annual Percentage Yield)
    pub apy: f64,
    /// Reward history
    pub history: Vec<RewardHistory>,
}

/// Historical reward record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RewardHistory {
    /// Epoch number
    pub epoch: u64,
    /// Reward amount
    pub amount: String,
    /// Claimed timestamp (None if unclaimed)
    pub claimed_at: Option<u64>,
}

/// Request to claim rewards
#[derive(Debug, Deserialize)]
pub struct TokenHubClaimRequest {
    /// Optional: specific epochs to claim (None = claim all)
    pub epochs: Option<Vec<u64>>,
}

/// Response after claiming rewards
#[derive(Debug, Serialize)]
pub struct TokenHubClaimResponse {
    /// Success status
    pub success: bool,
    /// Transaction hash
    pub tx_hash: Option<String>,
    /// Amount claimed
    pub amount_claimed: String,
    /// Epochs claimed
    pub epochs_claimed: Vec<u64>,
}
