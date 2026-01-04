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
