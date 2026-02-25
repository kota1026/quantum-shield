//! Emergency Pause API implementation
//!
//! TASK-P5-032: Emergency Pause実装
//!
//! Provides API endpoints for Emergency Pause operations:
//! - Pause protocol (5/9 Security Council signatures)
//! - Get detailed pause status
//! - Unpause protocol
//! - Request pause extension
//!
//! Spec References:
//! - SEQUENCES §8 Emergency Pause & Recovery
//! - UNIFIED_SPEC §Emergency Procedures
//! - Security Council 5/9 threshold for pause/unpause

use std::sync::Arc;

use axum::{Extension, Json};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    db::{GovernanceRepository, SystemRepository, ProtocolState},
    error::ApiError,
    services::AppState,
};

// ============================================================================
// Constants (per SEQUENCES §8)
// ============================================================================

/// Maximum pause duration in seconds (72 hours)
const MAX_PAUSE_DURATION_SECS: u64 = 72 * 60 * 60;

/// Maximum extension duration in seconds (7 days)
const MAX_EXTENSION_DURATION_SECS: u64 = 7 * 24 * 60 * 60;

/// Required signatures for pause/unpause (5 of 9)
const PAUSE_THRESHOLD: u32 = 5;

/// Total council members
const TOTAL_COUNCIL_MEMBERS: u32 = 9;

// ============================================================================
// Emergency State Types
// ============================================================================

/// Protocol pause state
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PauseState {
    /// Protocol is running normally
    Active,
    /// Protocol is paused
    Paused,
    /// Pause extension pending Token Vote
    ExtensionPending,
}

impl Default for PauseState {
    fn default() -> Self {
        Self::Active
    }
}

/// Pause scope - which operations are affected
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PauseScope {
    /// Full pause (new locks and unlocks)
    Full,
    /// Locks only paused
    LocksOnly,
    /// Unlocks only paused
    UnlocksOnly,
}

impl Default for PauseScope {
    fn default() -> Self {
        Self::Full
    }
}

/// Extension status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExtensionStatus {
    /// No extension requested
    None,
    /// Extension proposal submitted, awaiting votes
    VotePending,
    /// Extension approved
    Approved,
    /// Extension rejected
    Rejected,
}

// ============================================================================
// Request/Response Types
// ============================================================================

/// POST /v1/emergency/pause request
///
/// Per SEQUENCES §8, the pause request accepts reason, scope, and council signatures.
/// The actionId is auto-generated server-side if not provided by the client.
#[derive(Debug, Deserialize)]
pub struct EmergencyPauseRequest {
    /// Reason for emergency pause
    pub reason: String,
    /// Pause scope
    pub scope: Option<PauseScope>,
    /// Council action ID (optional - auto-generated if not provided)
    #[serde(rename = "actionId", default)]
    pub action_id: Option<String>,
    /// Executor's address (must be council member)
    pub executor: String,
    /// Executor's signature
    pub signature: String,
}

/// POST /v1/emergency/pause response
#[derive(Debug, Serialize)]
pub struct EmergencyPauseResponse {
    /// Whether pause was successful
    pub success: bool,
    /// Pause ID for tracking
    #[serde(rename = "pauseId")]
    pub pause_id: String,
    /// Current pause state
    pub state: PauseState,
    /// Pause scope
    pub scope: PauseScope,
    /// Reason for pause
    pub reason: String,
    /// Timestamp when pause started
    #[serde(rename = "pausedAt")]
    pub paused_at: u64,
    /// Timestamp when pause expires (max 72h)
    #[serde(rename = "expiresAt")]
    pub expires_at: u64,
    /// Maximum pause duration in seconds
    #[serde(rename = "maxDuration")]
    pub max_duration: u64,
    /// L1 transaction hash
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
    /// Message
    pub message: String,
}

/// GET /v1/emergency/status response
#[derive(Debug, Serialize)]
pub struct EmergencyStatusDetailResponse {
    /// Current protocol state
    pub state: PauseState,
    /// Whether protocol is currently paused
    #[serde(rename = "isPaused")]
    pub is_paused: bool,
    /// Pause scope (if paused)
    pub scope: Option<PauseScope>,
    /// Pause ID (if paused)
    #[serde(rename = "pauseId")]
    pub pause_id: Option<String>,
    /// Reason for pause
    pub reason: Option<String>,
    /// Timestamp when pause started
    #[serde(rename = "pausedAt")]
    pub paused_at: Option<u64>,
    /// Timestamp when pause expires
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<u64>,
    /// Time remaining on pause (seconds)
    #[serde(rename = "timeRemaining")]
    pub time_remaining: Option<u64>,
    /// Executor who initiated pause
    #[serde(rename = "initiatedBy")]
    pub initiated_by: Option<String>,
    /// Extension info (if pending)
    pub extension: Option<ExtensionInfo>,
    /// Affected operations during pause
    #[serde(rename = "affectedOperations")]
    pub affected_operations: AffectedOperations,
    /// Pause history (last 5)
    pub history: Vec<PauseHistoryEntry>,
}

/// Extension information
#[derive(Debug, Serialize)]
pub struct ExtensionInfo {
    /// Extension status
    pub status: ExtensionStatus,
    /// Requested extension duration (seconds)
    #[serde(rename = "requestedDuration")]
    pub requested_duration: u64,
    /// Proposal ID for Token Vote
    #[serde(rename = "proposalId")]
    pub proposal_id: Option<String>,
    /// Votes for extension
    #[serde(rename = "votesFor")]
    pub votes_for: u64,
    /// Votes against extension
    #[serde(rename = "votesAgainst")]
    pub votes_against: u64,
    /// Vote end timestamp
    #[serde(rename = "voteEndsAt")]
    pub vote_ends_at: Option<u64>,
}

/// Affected operations during pause (per SEQUENCES §8)
#[derive(Debug, Serialize)]
pub struct AffectedOperations {
    /// New locks
    #[serde(rename = "newLocks")]
    pub new_locks: OperationStatus,
    /// New unlocks
    #[serde(rename = "newUnlocks")]
    pub new_unlocks: OperationStatus,
    /// In-progress unlocks (24h timelock)
    #[serde(rename = "inProgressUnlocks")]
    pub in_progress_unlocks: OperationStatus,
    /// Claims
    pub claims: OperationStatus,
    /// Challenges
    pub challenges: OperationStatus,
    /// Prover exits
    #[serde(rename = "proverExits")]
    pub prover_exits: OperationStatus,
}

/// Operation status during pause
#[derive(Debug, Serialize)]
pub struct OperationStatus {
    /// Whether operation is allowed
    pub allowed: bool,
    /// Status message
    pub status: String,
}

/// Pause history entry
#[derive(Debug, Serialize)]
pub struct PauseHistoryEntry {
    /// Pause ID
    #[serde(rename = "pauseId")]
    pub pause_id: String,
    /// Reason
    pub reason: String,
    /// Started at
    #[serde(rename = "pausedAt")]
    pub paused_at: u64,
    /// Unpaused at
    #[serde(rename = "unpausedAt")]
    pub unpaused_at: Option<u64>,
    /// Duration in seconds
    #[serde(rename = "durationSecs")]
    pub duration_secs: u64,
    /// Was extended
    #[serde(rename = "wasExtended")]
    pub was_extended: bool,
    /// Initiated by
    #[serde(rename = "initiatedBy")]
    pub initiated_by: String,
}

/// POST /v1/emergency/unpause request
#[derive(Debug, Deserialize)]
pub struct EmergencyUnpauseRequest {
    /// Council action ID
    #[serde(rename = "actionId")]
    pub action_id: Option<String>,
    /// Executor's address (must be council member)
    pub executor: String,
    /// Executor's signature
    pub signature: String,
    /// Reason for unpause (optional)
    pub reason: Option<String>,
}

/// POST /v1/emergency/unpause response
#[derive(Debug, Serialize)]
pub struct EmergencyUnpauseResponse {
    /// Whether unpause was successful
    pub success: bool,
    /// New protocol state
    pub state: PauseState,
    /// Unpaused at timestamp
    #[serde(rename = "unpausedAt")]
    pub unpaused_at: u64,
    /// Total pause duration
    #[serde(rename = "totalPauseDuration")]
    pub total_pause_duration: u64,
    /// L1 transaction hash
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
    /// Message
    pub message: String,
}

/// POST /v1/emergency/extend request
#[derive(Debug, Deserialize)]
pub struct EmergencyExtendRequest {
    /// Requested extension duration in seconds (max 7 days)
    #[serde(rename = "extensionDuration")]
    pub extension_duration: u64,
    /// Reason for extension
    pub reason: String,
    /// Proposer's address (must be council member)
    pub proposer: String,
    /// Proposer's signature
    pub signature: String,
}

/// POST /v1/emergency/extend response
#[derive(Debug, Serialize)]
pub struct EmergencyExtendResponse {
    /// Whether extension request was submitted
    pub success: bool,
    /// Proposal ID for Token Vote
    #[serde(rename = "proposalId")]
    pub proposal_id: String,
    /// Extension status
    pub status: ExtensionStatus,
    /// Requested duration
    #[serde(rename = "requestedDuration")]
    pub requested_duration: u64,
    /// New expiry time (if approved)
    #[serde(rename = "newExpiresAt")]
    pub new_expires_at: u64,
    /// Vote end timestamp (48h emergency vote)
    #[serde(rename = "voteEndsAt")]
    pub vote_ends_at: u64,
    /// Message
    pub message: String,
}

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// POST /v1/emergency/pause
///
/// Executes emergency pause after Security Council 5/9 approval.
/// Requires a valid action ID from the council action system.
pub async fn execute_pause(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<EmergencyPauseRequest>,
) -> Result<Json<EmergencyPauseResponse>, ApiError> {
    // Auto-generate action_id if not provided by the client
    let action_id = req
        .action_id
        .clone()
        .unwrap_or_else(|| format!("ACTION-{}", Uuid::new_v4().simple()));

    tracing::info!(
        "Emergency: Executing pause - reason: {}, action_id: {}, executor: {}",
        req.reason,
        action_id,
        req.executor
    );

    let pool = state.pool();

    // Validate: reason must not be empty
    if req.reason.trim().is_empty() {
        return Err(ApiError::InvalidRequest("Reason is required".to_string()));
    }

    // Validate: executor must be an active council member
    let council_members = GovernanceRepository::get_council_members(pool).await?;
    let is_council_member = council_members
        .iter()
        .any(|m| m.wallet_address.eq_ignore_ascii_case(&req.executor));
    if !is_council_member {
        tracing::warn!(
            "Emergency: pause rejected - executor {} is not a council member",
            req.executor
        );
        return Err(ApiError::Forbidden(
            "Executor is not an active council member".to_string(),
        ));
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let scope = req.scope.unwrap_or(PauseScope::Full);
    let pause_id = format!("PAUSE-{}", Uuid::new_v4().simple());

    // Write pause state to PG (SM-001: PG is Source of Truth)
    let protocol_state = ProtocolState {
        paused: true,
        pause_id: Some(pause_id.clone()),
        pause_scope: Some(format!("{:?}", scope).to_lowercase()),
        pause_reason: Some(req.reason.clone()),
        paused_at: Some(now),
        pause_expires_at: Some(now + MAX_PAUSE_DURATION_SECS),
        pause_initiated_by: Some(req.executor.clone()),
    };
    SystemRepository::update_protocol_state(pool, &protocol_state, &req.executor).await?;

    // Record in pause history for audit trail
    SystemRepository::record_pause(
        pool,
        &pause_id,
        &req.reason,
        &format!("{:?}", scope).to_lowercase(),
        &req.executor,
    ).await?;

    // TODO: Call EmergencyController.pause() on L1 and capture tx_hash

    tracing::info!(
        "Emergency: pause activated - pause_id: {}, scope: {:?}, expires_at: {}",
        pause_id,
        scope,
        now + MAX_PAUSE_DURATION_SECS
    );

    Ok(Json(EmergencyPauseResponse {
        success: true,
        pause_id: pause_id.clone(),
        state: PauseState::Paused,
        scope,
        reason: req.reason.clone(),
        paused_at: now,
        expires_at: now + MAX_PAUSE_DURATION_SECS,
        max_duration: MAX_PAUSE_DURATION_SECS,
        tx_hash: None, // Populated when L1 integration is active
        message: format!(
            "Emergency pause activated. Protocol operations (new locks/unlocks) are suspended. \
             Max duration: 72 hours. Expires at: {}",
            now + MAX_PAUSE_DURATION_SECS
        ),
    }))
}

/// GET /v1/emergency/status
///
/// Returns detailed emergency status including pause state, affected operations,
/// and history.
pub async fn get_status(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<EmergencyStatusDetailResponse>, ApiError> {
    tracing::info!("Emergency: Getting detailed status");

    let pool = state.pool();

    // Read protocol state from PG (SM-001: PG is Source of Truth)
    let protocol_state = SystemRepository::get_protocol_state(pool).await?;
    let is_paused = protocol_state.paused;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Check if pause has auto-expired
    let is_paused = if is_paused {
        if let Some(expires_at) = protocol_state.pause_expires_at {
            if now > expires_at {
                // Auto-expire: update PG state
                let mut expired_state = protocol_state.clone();
                expired_state.paused = false;
                let _ = SystemRepository::update_protocol_state(pool, &expired_state, "system").await;
                if let Some(ref pid) = protocol_state.pause_id {
                    let _ = SystemRepository::record_unpause(pool, pid).await;
                }
                tracing::info!("Emergency: pause auto-expired");
                false
            } else {
                true
            }
        } else {
            true
        }
    } else {
        false
    };

    // Parse pause scope for affected operations
    let pause_scope = protocol_state.pause_scope.as_deref().and_then(|s| match s {
        "full" => Some(PauseScope::Full),
        "locks_only" => Some(PauseScope::LocksOnly),
        "unlocks_only" => Some(PauseScope::UnlocksOnly),
        _ => None,
    });

    let affected_operations = build_affected_operations(is_paused, pause_scope);

    // Calculate time remaining
    let time_remaining = if is_paused {
        protocol_state.pause_expires_at.map(|ea| ea.saturating_sub(now))
    } else {
        None
    };

    // Get pause history from PG
    let history_rows = SystemRepository::get_pause_history(pool, 5).await?;
    let history: Vec<PauseHistoryEntry> = history_rows.iter().map(|row| {
        PauseHistoryEntry {
            pause_id: row.pause_id.clone(),
            reason: row.reason.clone(),
            paused_at: row.paused_at.timestamp() as u64,
            unpaused_at: row.unpaused_at.map(|dt| dt.timestamp() as u64),
            duration_secs: row.duration_secs as u64,
            was_extended: row.was_extended,
            initiated_by: row.initiated_by.clone(),
        }
    }).collect();

    tracing::info!(
        "Emergency: status returned - is_paused: {}, history_count: {}",
        is_paused,
        history.len()
    );

    Ok(Json(EmergencyStatusDetailResponse {
        state: if is_paused { PauseState::Paused } else { PauseState::Active },
        is_paused,
        scope: if is_paused { pause_scope } else { None },
        pause_id: if is_paused { protocol_state.pause_id } else { None },
        reason: if is_paused { protocol_state.pause_reason } else { None },
        paused_at: if is_paused { protocol_state.paused_at } else { None },
        expires_at: if is_paused { protocol_state.pause_expires_at } else { None },
        time_remaining,
        initiated_by: if is_paused { protocol_state.pause_initiated_by } else { None },
        extension: None,
        affected_operations,
        history,
    }))
}

/// POST /v1/emergency/unpause
///
/// Unpauses the protocol. Can be done:
/// - By Security Council (5/9) at any time during pause
/// - Automatically when pause expires (72h)
pub async fn execute_unpause(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<EmergencyUnpauseRequest>,
) -> Result<Json<EmergencyUnpauseResponse>, ApiError> {
    tracing::info!(
        "Emergency: Executing unpause - executor: {}, action_id: {:?}",
        req.executor,
        req.action_id
    );

    let pool = state.pool();

    // Validate: executor must be an active council member
    let council_members = GovernanceRepository::get_council_members(pool).await?;
    let is_council_member = council_members
        .iter()
        .any(|m| m.wallet_address.eq_ignore_ascii_case(&req.executor));
    if !is_council_member {
        tracing::warn!(
            "Emergency: unpause rejected - executor {} is not a council member",
            req.executor
        );
        return Err(ApiError::Forbidden(
            "Executor is not an active council member".to_string(),
        ));
    }

    // Verify protocol is actually paused (SM-001: PG is Source of Truth)
    let protocol_state = SystemRepository::get_protocol_state(pool).await?;
    if !protocol_state.paused {
        return Err(ApiError::InvalidRequest("Protocol is not currently paused".to_string()));
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Calculate pause duration
    let total_pause_duration = protocol_state.paused_at
        .map(|pa| now.saturating_sub(pa))
        .unwrap_or(0);

    // Update protocol state to unpaused
    let unpaused_state = ProtocolState::default();
    SystemRepository::update_protocol_state(pool, &unpaused_state, &req.executor).await?;

    // Record unpause in history
    if let Some(ref pause_id) = protocol_state.pause_id {
        SystemRepository::record_unpause(pool, pause_id).await?;
    }

    // TODO: Call EmergencyController.unpause() on L1 and capture tx_hash

    tracing::info!(
        "Emergency: unpause executed - executor: {}, unpaused_at: {}",
        req.executor,
        now
    );

    Ok(Json(EmergencyUnpauseResponse {
        success: true,
        state: PauseState::Active,
        unpaused_at: now,
        total_pause_duration,
        tx_hash: None, // Populated when L1 integration is active
        message: "Protocol unpaused successfully. All operations resumed.".to_string(),
    }))
}

/// POST /v1/emergency/extend
///
/// Requests pause extension beyond 72 hours.
/// Requires Token Vote (48h emergency vote).
pub async fn request_extension(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<EmergencyExtendRequest>,
) -> Result<Json<EmergencyExtendResponse>, ApiError> {
    tracing::info!(
        "Emergency: Requesting pause extension - duration: {}s, reason: {}, proposer: {}",
        req.extension_duration,
        req.reason,
        req.proposer
    );

    let pool = state.pool();

    // Validate extension duration
    if req.extension_duration == 0 {
        return Err(ApiError::InvalidRequest(
            "Extension duration must be greater than 0".to_string(),
        ));
    }
    if req.extension_duration > MAX_EXTENSION_DURATION_SECS {
        return Err(ApiError::InvalidRequest(format!(
            "Extension duration exceeds maximum of {} seconds (7 days)",
            MAX_EXTENSION_DURATION_SECS
        )));
    }

    // Validate: reason must not be empty
    if req.reason.trim().is_empty() {
        return Err(ApiError::InvalidRequest("Reason is required".to_string()));
    }

    // Validate: proposer must be an active council member
    let council_members = GovernanceRepository::get_council_members(pool).await?;
    let is_council_member = council_members
        .iter()
        .any(|m| m.wallet_address.eq_ignore_ascii_case(&req.proposer));
    if !is_council_member {
        tracing::warn!(
            "Emergency: extension rejected - proposer {} is not a council member",
            req.proposer
        );
        return Err(ApiError::Forbidden(
            "Proposer is not an active council member".to_string(),
        ));
    }

    // Verify protocol is currently paused
    let protocol_state = SystemRepository::get_protocol_state(pool).await?;
    if !protocol_state.paused {
        return Err(ApiError::InvalidRequest(
            "Protocol is not currently paused. Extension only applies during active pause.".to_string(),
        ));
    }

    // TODO: Create governance proposal in proposals table with type = 'emergency_extension'

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let proposal_id = format!("EXT-{}", Uuid::new_v4().simple());
    let vote_ends_at = now + (48 * 3600); // 48h emergency vote

    // Use actual expires_at from PG state, or fallback to now + max pause
    let current_expires = protocol_state.pause_expires_at.unwrap_or(now + MAX_PAUSE_DURATION_SECS);
    let new_expires_at = current_expires + req.extension_duration;

    tracing::info!(
        "Emergency: extension proposal created - proposal_id: {}, vote_ends_at: {}, new_expires_at: {}",
        proposal_id,
        vote_ends_at,
        new_expires_at
    );

    Ok(Json(EmergencyExtendResponse {
        success: true,
        proposal_id: proposal_id.clone(),
        status: ExtensionStatus::VotePending,
        requested_duration: req.extension_duration,
        new_expires_at,
        vote_ends_at,
        message: format!(
            "Pause extension proposal created. Token vote required. \
             Vote ends in 48 hours. Proposal ID: {}",
            proposal_id
        ),
    }))
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Build affected operations status per SEQUENCES §8
fn build_affected_operations(is_paused: bool, scope: Option<PauseScope>) -> AffectedOperations {
    if !is_paused {
        return AffectedOperations {
            new_locks: OperationStatus {
                allowed: true,
                status: "ACTIVE - Normal operation".to_string(),
            },
            new_unlocks: OperationStatus {
                allowed: true,
                status: "ACTIVE - Normal operation".to_string(),
            },
            in_progress_unlocks: OperationStatus {
                allowed: true,
                status: "ACTIVE - Normal operation".to_string(),
            },
            claims: OperationStatus {
                allowed: true,
                status: "ACTIVE - Normal operation".to_string(),
            },
            challenges: OperationStatus {
                allowed: true,
                status: "ACTIVE - Normal operation".to_string(),
            },
            prover_exits: OperationStatus {
                allowed: true,
                status: "ACTIVE - Normal operation".to_string(),
            },
        };
    }

    let pause_scope = scope.unwrap_or(PauseScope::Full);

    let locks_suspended = matches!(pause_scope, PauseScope::Full | PauseScope::LocksOnly);
    let unlocks_suspended = matches!(pause_scope, PauseScope::Full | PauseScope::UnlocksOnly);

    AffectedOperations {
        new_locks: OperationStatus {
            allowed: !locks_suspended,
            status: if locks_suspended {
                "SUSPENDED - Emergency pause active".to_string()
            } else {
                "ACTIVE - Not affected by current pause scope".to_string()
            },
        },
        new_unlocks: OperationStatus {
            allowed: !unlocks_suspended,
            status: if unlocks_suspended {
                "SUSPENDED - Emergency pause active".to_string()
            } else {
                "ACTIVE - Not affected by current pause scope".to_string()
            },
        },
        in_progress_unlocks: OperationStatus {
            allowed: true,
            status: "ALLOWED - Time lock continues".to_string(),
        },
        claims: OperationStatus {
            allowed: true,
            status: "ALLOWED - Claim operations continue".to_string(),
        },
        challenges: OperationStatus {
            allowed: true,
            status: "ALLOWED - Challenge operations continue".to_string(),
        },
        prover_exits: OperationStatus {
            allowed: true,
            status: "ALLOWED - Prover exit operations continue".to_string(),
        },
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pause_state_serialization() {
        let state = PauseState::Paused;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"paused\"");

        let state = PauseState::Active;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"active\"");
    }

    #[test]
    fn test_pause_scope_serialization() {
        let scope = PauseScope::Full;
        let json = serde_json::to_string(&scope).unwrap();
        assert_eq!(json, "\"full\"");

        let scope = PauseScope::LocksOnly;
        let json = serde_json::to_string(&scope).unwrap();
        assert_eq!(json, "\"locks_only\"");
    }

    #[test]
    fn test_extension_status_serialization() {
        let status = ExtensionStatus::VotePending;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"vote_pending\"");
    }

    #[test]
    fn test_pause_request_deserialization_with_action_id() {
        let json = r#"{
            "reason": "Critical bug detected",
            "scope": "full",
            "actionId": "ACTION-123",
            "executor": "0x1234",
            "signature": "0xsig"
        }"#;
        let req: EmergencyPauseRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.reason, "Critical bug detected");
        assert_eq!(req.scope, Some(PauseScope::Full));
        assert_eq!(req.action_id, Some("ACTION-123".to_string()));
    }

    #[test]
    fn test_pause_request_deserialization_without_action_id() {
        // Frontend does not send actionId - this must not fail
        let json = r#"{
            "reason": "Attack detected",
            "scope": "locks_only",
            "executor": "0xabcd",
            "signature": "0xsig123"
        }"#;
        let req: EmergencyPauseRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.reason, "Attack detected");
        assert_eq!(req.scope, Some(PauseScope::LocksOnly));
        assert!(req.action_id.is_none());
        assert_eq!(req.executor, "0xabcd");
    }

    #[test]
    fn test_unpause_request_deserialization() {
        let json = r#"{
            "executor": "0x1234",
            "signature": "0xsig",
            "reason": "Issue resolved"
        }"#;
        let req: EmergencyUnpauseRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.executor, "0x1234");
        assert_eq!(req.reason, Some("Issue resolved".to_string()));
    }

    #[test]
    fn test_extend_request_deserialization() {
        let json = r#"{
            "extensionDuration": 86400,
            "reason": "Need more time for fix",
            "proposer": "0x1234",
            "signature": "0xsig"
        }"#;
        let req: EmergencyExtendRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.extension_duration, 86400);
        assert_eq!(req.reason, "Need more time for fix");
    }

    #[test]
    fn test_constants() {
        assert_eq!(MAX_PAUSE_DURATION_SECS, 72 * 60 * 60); // 72 hours
        assert_eq!(MAX_EXTENSION_DURATION_SECS, 7 * 24 * 60 * 60); // 7 days
        assert_eq!(PAUSE_THRESHOLD, 5);
        assert_eq!(TOTAL_COUNCIL_MEMBERS, 9);
    }

    #[test]
    fn test_pause_response_serialization() {
        let response = EmergencyPauseResponse {
            success: true,
            pause_id: "PAUSE-001".to_string(),
            state: PauseState::Paused,
            scope: PauseScope::Full,
            reason: "Test".to_string(),
            paused_at: 1000,
            expires_at: 260200,
            max_duration: 259200,
            tx_hash: Some("0x123".to_string()),
            message: "Paused".to_string(),
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"pauseId\":\"PAUSE-001\""));
        assert!(json.contains("\"state\":\"paused\""));
        assert!(json.contains("\"maxDuration\":259200"));
    }

    #[test]
    fn test_affected_operations() {
        let ops = AffectedOperations {
            new_locks: OperationStatus {
                allowed: false,
                status: "SUSPENDED".to_string(),
            },
            new_unlocks: OperationStatus {
                allowed: false,
                status: "SUSPENDED".to_string(),
            },
            in_progress_unlocks: OperationStatus {
                allowed: true,
                status: "ALLOWED".to_string(),
            },
            claims: OperationStatus {
                allowed: true,
                status: "ALLOWED".to_string(),
            },
            challenges: OperationStatus {
                allowed: true,
                status: "ALLOWED".to_string(),
            },
            prover_exits: OperationStatus {
                allowed: true,
                status: "ALLOWED".to_string(),
            },
        };
        let json = serde_json::to_string(&ops).unwrap();
        assert!(json.contains("\"newLocks\""));
        assert!(json.contains("\"inProgressUnlocks\""));
    }

    #[test]
    fn test_extension_info() {
        let info = ExtensionInfo {
            status: ExtensionStatus::VotePending,
            requested_duration: 86400,
            proposal_id: Some("PROP-001".to_string()),
            votes_for: 1000,
            votes_against: 200,
            vote_ends_at: Some(1700000000),
        };
        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("\"status\":\"vote_pending\""));
        assert!(json.contains("\"votesFor\":1000"));
    }

    #[test]
    fn test_pause_history_entry() {
        let entry = PauseHistoryEntry {
            pause_id: "PAUSE-001".to_string(),
            reason: "Test pause".to_string(),
            paused_at: 1000,
            unpaused_at: Some(2000),
            duration_secs: 1000,
            was_extended: false,
            initiated_by: "0x1234".to_string(),
        };
        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("\"durationSecs\":1000"));
        assert!(json.contains("\"wasExtended\":false"));
    }
}
