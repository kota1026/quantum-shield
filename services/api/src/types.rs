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
#[derive(Debug, Serialize)]
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
