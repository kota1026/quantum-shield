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

/// Request to confirm a lock after L1 transaction succeeds
/// Sent by frontend after lockWithSR0 TX is confirmed on Sepolia
#[derive(Debug, Deserialize)]
pub struct LockConfirmRequest {
    pub l1_tx_hash: String,
}

/// Response for lock confirmation
#[derive(Debug, Serialize)]
pub struct LockConfirmResponse {
    pub lock_id: String,
    pub status: LockStatus,
    pub l1_tx_hash: String,
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
    /// VRF request ID for prover selection (SEQUENCES §2.3)
    pub vrf_request_id: Option<String>,
    /// Selected provers via VRF (SEQUENCES §2.4)
    pub selected_provers: Vec<String>,
    /// VRF status for tracking
    pub vrf_status: VRFStatus,
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
    // Application form fields (optional for backward compatibility)
    #[serde(default)]
    pub organization_name: Option<String>,
    #[serde(default)]
    pub country: Option<String>,
    #[serde(default)]
    pub website: Option<String>,
    #[serde(default)]
    pub contact_email: Option<String>,
    #[serde(default)]
    pub validator_experience: Option<String>,
    #[serde(default)]
    pub hsm_provider: Option<String>,
    #[serde(default)]
    pub infrastructure_location: Option<String>,
    #[serde(default)]
    pub business_registration_number: Option<String>,
    #[serde(default)]
    pub documents_count: Option<i32>,
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
// Challenge Types (SEQUENCES §4)
// ============================================================================

/// Challenge request for filing a challenge against pending unlock
#[derive(Debug, Deserialize)]
pub struct ChallengeRequest {
    pub lock_id: String,
    pub challenger: String,
    pub fraud_proof: String,
    pub bond: String,
}

/// Challenge response after successful submission
#[derive(Debug, Serialize)]
pub struct ChallengeResponse {
    pub challenge_id: String,
    pub lock_id: String,
    pub fraud_proof_hash: String,
    pub bond: String,
    pub defense_deadline: u64,
    pub status: ChallengeStatus,
}

/// Defense request from Prover
#[derive(Debug, Deserialize)]
pub struct DefenseRequest {
    pub prover_id: String,
    pub defense_proof: String,
}

/// Defense response after successful submission
#[derive(Debug, Serialize)]
pub struct DefenseResponse {
    pub challenge_id: String,
    pub lock_id: String,
    pub defender: String,
    pub defense_proof_hash: String,
    pub status: ChallengeStatus,
}

/// Challenge status enum
/// Maps to L1Vault.sol ChallengeStatus
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ChallengeStatus {
    None,
    Pending,
    DefenseSubmitted,
    ResolvedValid,
    ResolvedInvalid,
}

/// Full challenge information (basic)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChallengeInfo {
    pub challenge_id: String,
    pub lock_id: String,
    pub challenger: String,
    pub fraud_proof_hash: String,
    pub bond: String,
    pub challenged_at: u64,
    pub defense_deadline: u64,
    pub status: ChallengeStatus,
    pub defender: Option<String>,
    pub defense_proof_hash: Option<String>,
}

/// Extended challenge information for Observer API
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExtendedChallengeInfo {
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

/// Auto-resolve response
#[derive(Debug, Serialize)]
pub struct AutoResolveResponse {
    pub challenge_id: String,
    pub lock_id: String,
    pub challenge_valid: bool,
    pub slash_amount: String,
    pub challenger_reward: String,
    pub insurance_amount: String,
    pub burn_amount: String,
    pub status: ChallengeStatus,
}

/// Prover info for internal use
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prover {
    pub prover_id: String,
    pub operator_addr: String,
    pub sphincs_pubkey: String,
    pub stake_amount: String,
    pub status: ProverStatus,
    pub is_active: bool,
}

// ============================================================================
// VRF Types (SEQUENCES §2.3-§2.4)
// ============================================================================

/// VRF Status for prover selection tracking
/// Implements SEQUENCES §2.3-§2.4 workflow
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum VRFStatus {
    /// VRF not yet requested
    NotStarted,
    /// VRF request sent, awaiting Chainlink response
    Pending,
    /// VRF fulfilled, prover selected
    Fulfilled,
    /// VRF timed out (5 min), fallback used
    FallbackUsed,
    /// VRF request failed
    Failed,
}

impl Default for VRFStatus {
    fn default() -> Self {
        Self::NotStarted
    }
}

/// VRF request information stored in Redis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VRFRequest {
    /// Unique identifier for the VRF request
    pub vrf_request_id: String,
    /// Associated unlock request ID
    pub unlock_request_id: String,
    /// Lock ID being unlocked
    pub lock_id: String,
    /// Timestamp when VRF was requested
    pub requested_at: u64,
    /// Random value from VRF (set when fulfilled)
    pub random_value: Option<String>,
    /// Selected prover address (set when fulfilled)
    pub selected_prover: Option<String>,
    /// Current status
    pub status: VRFStatus,
}

/// VRF status response for API
#[derive(Debug, Serialize)]
pub struct VRFStatusResponse {
    pub vrf_request_id: String,
    pub unlock_request_id: String,
    pub status: VRFStatus,
    pub selected_prover: Option<String>,
    pub time_remaining: Option<u64>,
    pub is_timed_out: bool,
}

// ============================================================================
// Authentication Types (TASK-P5-012: SIWE→JWT)
// ============================================================================

/// SIWE (Sign-In with Ethereum) request
///
/// Uses ECDSA signature for wallet compatibility (per SEQUENCES.md §1.1).
/// Quantum-resistant Dilithium signatures are used separately for Lock/Unlock operations.
#[derive(Debug, Deserialize)]
pub struct SiweRequest {
    /// The SIWE message to sign (EIP-4361 format)
    pub message: String,
    /// ECDSA signature of the message (hex encoded, 65 bytes)
    pub signature: String,
    /// Optional: User's Dilithium public key for future Lock operations
    /// Not required for authentication itself
    #[serde(default)]
    pub public_key: String,
}

/// SIWE authentication response with JWT tokens
#[derive(Debug, Serialize)]
pub struct SiweResponse {
    /// JWT access token
    pub access_token: String,
    /// JWT refresh token
    pub refresh_token: String,
    /// Access token expiry (Unix timestamp)
    pub expires_at: u64,
    /// Authenticated wallet address
    pub address: String,
}

/// Token refresh request
#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    /// The refresh token to use
    pub refresh_token: String,
}

/// Token refresh response
#[derive(Debug, Serialize)]
pub struct RefreshTokenResponse {
    /// New JWT access token
    pub access_token: String,
    /// Access token expiry (Unix timestamp)
    pub expires_at: u64,
}

/// Current user information
#[derive(Debug, Serialize)]
pub struct UserInfoResponse {
    /// Wallet address (derived from Dilithium public key)
    pub address: String,
    /// Dilithium public key hash (SHA3-256)
    pub public_key_hash: String,
    /// Token issued at (Unix timestamp)
    pub issued_at: u64,
    /// Token expires at (Unix timestamp)
    pub expires_at: u64,
}

/// JWT claims structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JwtClaims {
    /// Subject (wallet address)
    pub sub: String,
    /// Public key hash (SHA3-256 of Dilithium public key)
    pub pkh: String,
    /// Issued at (Unix timestamp)
    pub iat: u64,
    /// Expires at (Unix timestamp)
    pub exp: u64,
    /// Token type: "access" or "refresh"
    pub typ: String,
}

/// Parsed SIWE message fields
#[derive(Debug, Clone)]
pub struct SiweMessage {
    /// Domain that requested the sign-in
    pub domain: String,
    /// Wallet address
    pub address: String,
    /// Human-readable statement
    pub statement: Option<String>,
    /// URI of the requesting resource
    pub uri: String,
    /// EIP-155 chain ID
    pub chain_id: u64,
    /// Nonce for replay protection
    pub nonce: String,
    /// ISO 8601 issued at timestamp
    pub issued_at: String,
    /// ISO 8601 expiration time (optional)
    pub expiration_time: Option<String>,
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
    /// Owner's Dilithium public key (hex-encoded, for signature pre-check)
    pub owner_public_key: String,
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
    pub challenge_info: Option<TransactionChallengeInfo>,
    /// Transaction timeline
    pub timeline: Vec<TimelineEvent>,
}

/// Challenge information for transaction detail
#[derive(Debug, Serialize)]
pub struct TransactionChallengeInfo {
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

// ============================================================================
// Token Hub Types (veQS / Delegation / Rewards - TASK-P5-021)
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

/// Rewards info for token hub
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RewardsInfo {
    /// Pending rewards
    pub pending: String,
    /// Claimable rewards
    pub claimable: String,
    /// Last claim timestamp
    pub last_claim: Option<u64>,
    /// Next epoch timestamp
    pub next_epoch: u64,
    /// APR percentage
    pub apr: f64,
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

// ============================================================================
// Token Hub Additional Types (FE-BE alignment)
// ============================================================================

/// Rewards summary for dashboard widget
/// GET /v1/token-hub/rewards/summary
#[derive(Debug, Serialize)]
pub struct TokenHubRewardsSummaryResponse {
    pub claimable: f64,
    pub usd_value: f64,
    pub epoch_progress: f64,
    /// Reward currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

/// Rewards breakdown by source
/// GET /v1/token-hub/rewards/breakdown
#[derive(Debug, Serialize)]
pub struct TokenHubRewardsBreakdownResponse {
    pub veqs_holding: f64,
    pub voting_participation: f64,
    pub delegation_bonus: f64,
}

/// Current epoch information
/// GET /v1/token-hub/epoch
#[derive(Debug, Serialize)]
pub struct TokenHubEpochResponse {
    pub number: u64,
    pub progress: f64,
    pub remaining: String,
}

/// User QS balance
/// GET /v1/token-hub/balance
#[derive(Debug, Serialize)]
pub struct TokenHubBalanceResponse {
    pub balance: f64,
}

/// Locked position for unlock page
/// GET /v1/token-hub/locked-positions
#[derive(Debug, Serialize)]
pub struct TokenHubLockedPosition {
    pub id: String,
    pub locked_amount: f64,
    #[serde(rename = "veQSAmount")]
    pub veqs_amount: f64,
    pub lock_date: String,
    pub unlock_date: String,
    pub duration_months: u32,
    pub multiplier: f64,
}

/// User delegation summary
/// GET /v1/token-hub/user-delegation
#[derive(Debug, Serialize)]
pub struct TokenHubUserDelegationResponse {
    pub total_delegated: f64,
    pub delegate_count: u32,
}

/// Claimable rewards detail
/// GET /v1/token-hub/rewards/claimable
#[derive(Debug, Serialize)]
pub struct TokenHubClaimableResponse {
    pub total: f64,
    pub usd_value: f64,
    pub breakdown: TokenHubClaimableBreakdown,
    /// Reward currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

/// Breakdown for claimable rewards
#[derive(Debug, Serialize)]
pub struct TokenHubClaimableBreakdown {
    pub veqs_holding: f64,
    pub voting_participation: f64,
    pub delegation_bonus: f64,
}

/// Rewards history item
/// GET /v1/token-hub/rewards/history
#[derive(Debug, Serialize)]
pub struct TokenHubRewardsHistoryItem {
    pub id: String,
    #[serde(rename = "type")]
    pub history_type: String,
    pub date: String,
    pub amount: f64,
    pub status: String,
    /// Reward currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

/// Extended rewards history item with epoch and breakdown
/// GET /v1/token-hub/rewards/history/extended
#[derive(Debug, Serialize)]
pub struct TokenHubExtendedRewardsHistoryItem {
    pub id: String,
    #[serde(rename = "type")]
    pub history_type: String,
    pub date: String,
    pub amount: f64,
    pub epoch: u64,
    pub status: String,
    pub breakdown: TokenHubRewardBreakdown,
    /// Reward currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

/// Per-item reward breakdown
#[derive(Debug, Serialize)]
pub struct TokenHubRewardBreakdown {
    pub holding: f64,
    pub voting: f64,
    pub delegation: f64,
}

// ============================================================================
// Prover Portal Types (TASK-P5-022)
// SEQUENCES §5: Prover Registration, §6: Prover Exit
// ============================================================================

/// Prover dashboard response
/// GET /v1/prover/dashboard
#[derive(Debug, Serialize)]
pub struct ProverDashboard {
    /// Prover ID
    pub prover_id: String,
    /// Current status
    pub status: ProverStatus,
    /// Staked amount in wei
    pub stake_amount: String,
    /// Total signatures provided
    pub total_signatures: u64,
    /// Signatures in the last 24 hours
    pub signatures_24h: u64,
    /// Current earnings (unclaimed rewards)
    pub pending_rewards: String,
    /// Total lifetime earnings
    pub total_earnings: String,
    /// Number of pending signature requests
    pub queue_size: u64,
    /// Number of active challenges against this prover
    pub active_challenges: u64,
    /// Slash count (for quadratic slashing calculation)
    pub slash_count: u32,
    /// Uptime percentage (0-100)
    pub uptime_percentage: f64,
    /// Last activity timestamp
    pub last_activity: u64,
}

/// Signing queue item
/// GET /v1/prover/queue
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SigningQueueItem {
    /// Queue item ID
    pub queue_id: String,
    /// Associated unlock ID
    pub unlock_id: String,
    /// Lock ID being unlocked
    pub lock_id: String,
    /// Amount being unlocked
    pub amount: String,
    /// Asset type
    pub asset: String,
    /// SR_0 commitment
    pub sr_0: String,
    /// SR_1 commitment
    pub sr_1: String,
    /// Request timestamp
    pub requested_at: u64,
    /// Time remaining until deadline (seconds)
    pub deadline_remaining: i64,
    /// Priority (1=high, 2=medium, 3=low)
    pub priority: u8,
    /// Queue status
    pub status: QueueItemStatus,
}

/// Queue item status
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum QueueItemStatus {
    /// Waiting to be signed
    Pending,
    /// Currently being processed
    Processing,
    /// Successfully signed
    Signed,
    /// Signing failed
    Failed,
    /// Expired without signature
    Expired,
}

/// Signing queue list response
#[derive(Debug, Serialize)]
pub struct SigningQueueResponse {
    pub items: Vec<SigningQueueItem>,
    pub total: usize,
    pub pending_count: usize,
}

/// Sign request from Prover
/// POST /v1/prover/sign
#[derive(Debug, Deserialize)]
pub struct ProverSignRequest {
    /// Queue item ID to sign
    pub queue_id: String,
    /// SPHINCS+ signature (hex encoded)
    pub sphincs_signature: String,
    /// HSM attestation proving signature was generated in HSM
    pub hsm_attestation: String,
}

/// Sign response
#[derive(Debug, Serialize)]
pub struct ProverSignResponse {
    pub queue_id: String,
    pub unlock_id: String,
    pub signature_accepted: bool,
    pub total_signatures: u32,
    pub required_signatures: u32,
    pub reward_earned: String,
}

/// Prover metrics
/// GET /v1/prover/metrics
#[derive(Debug, Serialize, Deserialize)]
pub struct ProverMetrics {
    /// Total signatures all time
    pub total_signatures: u64,
    /// Signatures in last 24 hours
    pub signatures_24h: u64,
    /// Signatures in last 7 days
    pub signatures_7d: u64,
    /// Average response time (milliseconds)
    pub avg_response_time_ms: u64,
    /// Success rate (0-100)
    pub success_rate: f64,
    /// Uptime percentage (0-100)
    pub uptime_percentage: f64,
    /// Total rewards earned
    pub total_rewards: String,
    /// Rewards in last 30 days
    pub rewards_30d: String,
    /// Slash count
    pub slash_count: u32,
    /// Total slashed amount
    pub total_slashed: String,
    /// Ranking among all provers
    pub rank: u32,
    /// Total number of provers
    pub total_provers: u32,
}

/// Prover alert
/// GET /v1/prover/alerts
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProverAlert {
    /// Alert ID
    pub alert_id: String,
    /// Alert type
    pub alert_type: AlertType,
    /// Alert severity
    pub severity: AlertSeverity,
    /// Alert message
    pub message: String,
    /// Related entity (lock_id, challenge_id, etc.)
    pub related_id: Option<String>,
    /// Alert timestamp
    pub created_at: u64,
    /// Whether alert has been acknowledged
    pub acknowledged: bool,
}

/// Alert type
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AlertType {
    /// New challenge filed against prover
    ChallengeReceived,
    /// Challenge defense deadline approaching
    DefenseDeadline,
    /// Slashing occurred
    Slashed,
    /// Stake is below minimum threshold
    LowStake,
    /// Queue item deadline approaching
    SigningDeadline,
    /// HSM connection issue
    HsmIssue,
    /// System maintenance scheduled
    Maintenance,
}

/// Alert severity
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

/// Alerts list response
#[derive(Debug, Serialize)]
pub struct ProverAlertsResponse {
    pub alerts: Vec<ProverAlert>,
    pub total: usize,
    pub unacknowledged_count: usize,
}

/// Prover's challenge info (from prover's perspective)
/// GET /v1/prover/challenges
#[derive(Debug, Serialize)]
pub struct ProverChallengeItem {
    /// Challenge ID
    pub challenge_id: String,
    /// Lock ID
    pub lock_id: String,
    /// Challenger address
    pub challenger: String,
    /// Challenge timestamp
    pub challenged_at: u64,
    /// Defense deadline
    pub defense_deadline: u64,
    /// Time remaining for defense (seconds)
    pub time_remaining: i64,
    /// Challenge status
    pub status: ChallengeStatus,
    /// Potential slash amount
    pub potential_slash: String,
    /// Whether defense was submitted
    pub defense_submitted: bool,
}

/// Challenges list response
#[derive(Debug, Serialize)]
pub struct ProverChallengesResponse {
    pub challenges: Vec<ProverChallengeItem>,
    pub total: usize,
    pub pending_count: usize,
}

/// Challenge response request (defense submission)
/// POST /v1/prover/challenge-response
#[derive(Debug, Deserialize)]
pub struct ProverChallengeResponseRequest {
    /// Challenge ID to respond to
    pub challenge_id: String,
    /// Defense proof (STARK proof or explanation)
    pub defense_proof: String,
    /// Optional supporting evidence
    pub evidence: Option<String>,
}

/// Challenge response result
#[derive(Debug, Serialize)]
pub struct ProverChallengeResponseResult {
    pub challenge_id: String,
    pub status: ChallengeStatus,
    pub defense_accepted: bool,
    pub message: String,
}

/// Prover exit request
/// POST /v1/prover/exit
/// SEQUENCES §6: Prover Exit (7-day unbonding)
#[derive(Debug, Deserialize)]
pub struct ProverExitRequest {
    /// Reason for exit (optional)
    pub reason: Option<String>,
    /// Confirmation signature
    pub confirmation_signature: String,
}

/// Prover exit response
#[derive(Debug, Serialize)]
pub struct ProverExitResponse {
    pub prover_id: String,
    pub status: ProverStatus,
    /// Exit initiated timestamp
    pub exit_initiated_at: u64,
    /// Unbonding period end timestamp
    pub unbonding_end: u64,
    /// Unbonding period in days (7 days per SEQUENCES §6)
    pub unbonding_days: u32,
    /// Stake to be returned after unbonding
    pub stake_to_return: String,
    /// Pending rewards to be returned
    pub pending_rewards: String,
}

/// Prover exit status response
/// GET /v1/prover/:prover_id/exit-status
/// SEQUENCES §6: Prover Exit - Status tracking during unbonding
#[derive(Debug, Serialize)]
pub struct ProverExitStatusResponse {
    pub prover_id: String,
    pub status: ProverStatus,
    /// Exit initiated timestamp (None if not exiting)
    pub exit_initiated_at: Option<u64>,
    /// Unbonding period end timestamp (None if not exiting)
    pub unbonding_end: Option<u64>,
    /// Time remaining in unbonding (seconds, negative if complete)
    pub unbonding_remaining: Option<i64>,
    /// Whether unbonding is complete and withdrawal is allowed
    pub can_withdraw: bool,
    /// Stake to be returned after unbonding
    pub stake_to_return: String,
    /// Pending rewards to be returned
    pub pending_rewards: String,
    /// Whether there are pending challenges (blocks withdrawal)
    pub has_pending_challenges: bool,
    /// Number of pending challenges
    pub pending_challenge_count: u32,
}

/// Prover withdraw stake request
/// POST /v1/prover/:prover_id/withdraw
/// SEQUENCES §6: Step 4-5 - Stake withdrawal after unbonding
#[derive(Debug, Deserialize)]
pub struct ProverWithdrawRequest {
    /// Destination address for stake return
    pub destination_address: String,
    /// Confirmation signature
    pub confirmation_signature: String,
}

/// Prover withdraw stake response
#[derive(Debug, Serialize)]
pub struct ProverWithdrawResponse {
    pub prover_id: String,
    /// Final status after withdrawal
    pub status: ProverStatus,
    /// Amount of stake returned
    pub stake_returned: String,
    /// Amount of rewards returned
    pub rewards_returned: String,
    /// Total amount returned
    pub total_returned: String,
    /// Destination address
    pub destination_address: String,
    /// L1 transaction hash (if submitted)
    pub l1_tx_hash: Option<String>,
    /// Withdrawal timestamp
    pub withdrawn_at: u64,
}

// ============================================================================
// Observer Types (TASK-P5-019 Extension: Registration)
// ============================================================================

/// Observer registration request
/// POST /v1/observer/register
#[derive(Debug, Deserialize)]
pub struct ObserverRegisterRequest {
    /// Operator wallet address
    pub operator_addr: String,
    /// Optional stake amount (not required for observers, but can stake for enhanced rewards)
    pub stake_amount: Option<String>,
}

/// Observer registration response
#[derive(Debug, Serialize)]
pub struct ObserverRegisterResponse {
    /// Unique observer ID
    pub observer_id: String,
    /// Registration status
    pub status: ObserverStatus,
    /// Operator address
    pub operator_addr: String,
    /// Registration timestamp
    pub registered_at: u64,
}

/// Observer status enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ObserverStatus {
    /// Pending admin approval
    PendingApproval,
    /// Active and can submit challenges
    Active,
    /// Temporarily inactive
    Inactive,
    /// Suspended by admin
    Suspended,
}

/// Observer info for admin/internal use
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Observer {
    pub observer_id: String,
    pub operator_addr: String,
    pub status: ObserverStatus,
    pub stake_amount: Option<String>,
    pub registered_at: u64,
    pub total_challenges: u32,
    pub successful_challenges: u32,
    pub total_earnings: String,
}
