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
// User Types (Consumer App API - TASK-P5-020)
// ============================================================================

/// User dashboard response containing aggregated user data
#[derive(Debug, Serialize)]
pub struct UserDashboardResponse {
    /// User's wallet address
    pub address: String,
    /// Total value locked in ETH (as string for precision)
    pub total_locked: String,
    /// Total value locked in USD
    pub total_locked_usd: String,
    /// Number of active locks
    pub active_locks: u32,
    /// Number of pending unlocks
    pub pending_unlocks: u32,
    /// User's quantum keys status
    pub quantum_keys: UserQuantumKeysStatus,
    /// Recent activity summary
    pub recent_activity: Vec<ActivitySummary>,
}

/// Quantum keys status for user
#[derive(Debug, Serialize)]
pub struct UserQuantumKeysStatus {
    /// Whether Dilithium key is registered
    pub dilithium_registered: bool,
    /// Dilithium key fingerprint (SHA3-256 hash of public key)
    pub dilithium_fingerprint: Option<String>,
    /// Key registration timestamp
    pub registered_at: Option<u64>,
}

/// Activity summary item
#[derive(Debug, Serialize)]
pub struct ActivitySummary {
    /// Activity type
    pub activity_type: ActivityType,
    /// Related lock/unlock ID
    pub reference_id: String,
    /// Amount involved
    pub amount: String,
    /// Asset type
    pub asset: String,
    /// Timestamp
    pub timestamp: u64,
}

/// Type of user activity
#[derive(Debug, Serialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum ActivityType {
    Lock,
    Unlock,
    EmergencyUnlock,
    Challenge,
    Claim,
}

/// User transactions list response
#[derive(Debug, Serialize)]
pub struct UserTransactionsResponse {
    /// List of transactions
    pub transactions: Vec<UserTransaction>,
    /// Total number of transactions
    pub total: u64,
    /// Current page
    pub page: u32,
    /// Items per page
    pub per_page: u32,
}

/// User transaction record
#[derive(Debug, Serialize, Clone)]
pub struct UserTransaction {
    /// Transaction ID (lock_id or unlock_id)
    pub id: String,
    /// Transaction type
    pub tx_type: TransactionType,
    /// Asset type
    pub asset: String,
    /// Amount
    pub amount: String,
    /// Status
    pub status: TransactionStatus,
    /// Chain ID
    pub chain_id: u64,
    /// Created timestamp
    pub created_at: u64,
    /// Updated timestamp
    pub updated_at: Option<u64>,
    /// Release time (for unlocks)
    pub release_time: Option<u64>,
    /// L1 transaction hash (if confirmed on-chain)
    pub l1_tx_hash: Option<String>,
}

/// Transaction type
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TransactionType {
    Lock,
    NormalUnlock,
    EmergencyUnlock,
}

/// Transaction status for display
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Processing,
    Completed,
    Failed,
    Challenged,
}

/// Single transaction detail response
#[derive(Debug, Serialize)]
pub struct UserTransactionDetailResponse {
    /// Basic transaction info
    pub transaction: UserTransaction,
    /// State root SR_0
    pub sr_0: String,
    /// State root SR_1 (for unlocks)
    pub sr_1: Option<String>,
    /// Prover signatures count
    pub prover_signatures: u32,
    /// Required prover signatures
    pub required_signatures: u32,
    /// Time lock remaining in seconds (negative if expired)
    pub time_lock_remaining: Option<i64>,
    /// Challenge info (if challenged)
    pub challenge_info: Option<ChallengeInfo>,
    /// Transaction timeline
    pub timeline: Vec<TimelineEvent>,
}

/// Challenge information
#[derive(Debug, Serialize)]
pub struct ChallengeInfo {
    /// Challenger address
    pub challenger: String,
    /// Challenge bond amount
    pub bond: String,
    /// Challenge timestamp
    pub challenged_at: u64,
    /// Defense deadline
    pub defense_deadline: u64,
}

/// Timeline event for transaction history
#[derive(Debug, Serialize)]
pub struct TimelineEvent {
    /// Event type
    pub event: String,
    /// Event timestamp
    pub timestamp: u64,
    /// Event description
    pub description: String,
}

/// User settings response
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserSettingsResponse {
    /// User's wallet address
    pub address: String,
    /// Notification preferences
    pub notifications: NotificationSettings,
    /// Default time lock preference (hours)
    pub default_time_lock_hours: u32,
    /// Preferred language
    pub language: String,
    /// Two-factor authentication enabled
    pub two_factor_enabled: bool,
}

/// Notification settings
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NotificationSettings {
    /// Email notifications enabled
    pub email_enabled: bool,
    /// Email address (if enabled)
    pub email: Option<String>,
    /// Notify on lock confirmation
    pub on_lock_confirmed: bool,
    /// Notify on unlock ready
    pub on_unlock_ready: bool,
    /// Notify on challenge
    pub on_challenge: bool,
}

/// User settings update request
#[derive(Debug, Deserialize)]
pub struct UserSettingsUpdateRequest {
    /// Notification preferences update
    pub notifications: Option<NotificationSettings>,
    /// Default time lock preference update
    pub default_time_lock_hours: Option<u32>,
    /// Language preference update
    pub language: Option<String>,
}

/// User keys response
#[derive(Debug, Serialize)]
pub struct UserKeysResponse {
    /// User's wallet address
    pub address: String,
    /// Dilithium-III public key (hex encoded)
    pub dilithium_public_key: Option<String>,
    /// Key fingerprint (SHA3-256 of public key)
    pub dilithium_fingerprint: Option<String>,
    /// Key registration timestamp
    pub registered_at: Option<u64>,
    /// Algorithm info
    pub algorithm: KeyAlgorithmInfo,
}

/// Key algorithm information
#[derive(Debug, Serialize)]
pub struct KeyAlgorithmInfo {
    /// Algorithm name
    pub name: String,
    /// Standard reference
    pub standard: String,
    /// Security level
    pub security_level: String,
    /// Public key size in bytes
    pub public_key_size: u32,
    /// Signature size in bytes
    pub signature_size: u32,
}

/// Query parameters for transactions list
#[derive(Debug, Deserialize)]
pub struct TransactionsQueryParams {
    /// Filter by transaction type
    pub tx_type: Option<TransactionType>,
    /// Filter by status
    pub status: Option<TransactionStatus>,
    /// Page number (1-indexed)
    pub page: Option<u32>,
    /// Items per page (max 100)
    pub per_page: Option<u32>,
}
