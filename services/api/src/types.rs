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
<<<<<<< HEAD
<<<<<<< HEAD
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

/// Full challenge information
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
=======
// Authentication Types (TASK-P5-012: SIWE→JWT)
// ============================================================================

/// SIWE (Sign-In with Ethereum/Quantum-safe) request
/// Uses Dilithium-III signature for CP-1 compliance
#[derive(Debug, Deserialize)]
pub struct SiweRequest {
    /// The SIWE message to sign (EIP-4361 format)
    pub message: String,
    /// Dilithium-III signature of the message (hex encoded)
    pub signature: String,
    /// User's Dilithium-III public key (hex encoded)
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
>>>>>>> origin/claude/implement-task-p5-012-CoGF1
=======
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
>>>>>>> origin/claude/implement-task-p5-020-vNCen
}
