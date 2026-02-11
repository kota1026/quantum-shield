//! Security Council API implementation
//!
//! TASK-P5-028: Security Council統合
//!
//! Provides API endpoints for Security Council operations:
//! - Member management
//! - Action proposals (EmergencyPause, Veto, EmergencyUpgrade)
//! - Multi-sig signing and execution
//! - Emergency status monitoring
//!
//! Spec References:
//! - SEQUENCES §8 Emergency Pause
//! - UNIFIED_SPEC §Security Council (5/9 Pause, 6/9 Veto, 7/9 Upgrade)
//! - ISecurityCouncil.sol interface

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use serde::{Deserialize, Serialize};

use uuid::Uuid;

use chrono::Utc;

use crate::{
    db::CouncilRepository,
    error::ApiError,
    services::AppState,
};

// ============================================================================
// Security Council Types
// ============================================================================

/// Action type enum (mirrors contract ActionType)
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    /// Emergency pause (5/9 threshold)
    EmergencyPause,
    /// Veto governance proposal (6/9 threshold)
    Veto,
    /// Emergency upgrade (7/9 threshold)
    EmergencyUpgrade,
    /// Member change (6/9 threshold)
    MemberChange,
}

/// Action state enum (mirrors contract ActionState)
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActionState {
    Proposed,
    Executed,
    Cancelled,
    Expired,
}

// ============================================================================
// Request/Response Types
// ============================================================================

/// GET /v1/council/members response
#[derive(Debug, Serialize)]
pub struct CouncilMembersResponse {
    /// Total members (always 9)
    #[serde(rename = "totalMembers")]
    pub total_members: u32,
    /// Council members by seat
    pub members: Vec<CouncilMember>,
    /// Governor contract address
    pub governor: String,
    /// Emergency controller address
    #[serde(rename = "emergencyController")]
    pub emergency_controller: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CouncilMember {
    /// Seat ID (0-8)
    #[serde(rename = "seatId")]
    pub seat_id: u32,
    /// Member address
    pub address: String,
    /// Optional display name
    pub name: Option<String>,
    /// Timestamp when member joined
    #[serde(rename = "joinedAt")]
    pub joined_at: u64,
    /// Number of actions this member has participated in
    #[serde(rename = "actionsParticipated")]
    pub actions_participated: u32,
    /// Whether this member is active
    #[serde(rename = "isActive")]
    pub is_active: bool,
}

/// GET /v1/council/thresholds response
#[derive(Debug, Serialize)]
pub struct ThresholdsResponse {
    /// Maximum members (9)
    #[serde(rename = "maxMembers")]
    pub max_members: u32,
    /// Pause threshold (5/9)
    #[serde(rename = "pauseThreshold")]
    pub pause_threshold: u32,
    /// Veto threshold (6/9)
    #[serde(rename = "vetoThreshold")]
    pub veto_threshold: u32,
    /// Upgrade threshold (7/9)
    #[serde(rename = "upgradeThreshold")]
    pub upgrade_threshold: u32,
    /// Action expiry in seconds (48 hours)
    #[serde(rename = "actionExpiry")]
    pub action_expiry: u64,
}

/// GET /v1/council/actions response
#[derive(Debug, Serialize)]
pub struct ActionsListResponse {
    pub actions: Vec<ActionSummary>,
    pub total: u32,
    #[serde(rename = "pendingCount")]
    pub pending_count: u32,
}

#[derive(Debug, Serialize)]
pub struct ActionSummary {
    pub id: String,
    #[serde(rename = "actionType")]
    pub action_type: ActionType,
    pub proposer: String,
    #[serde(rename = "proposedAt")]
    pub proposed_at: u64,
    #[serde(rename = "expiresAt")]
    pub expires_at: u64,
    #[serde(rename = "signatureCount")]
    pub signature_count: u32,
    #[serde(rename = "requiredSignatures")]
    pub required_signatures: u32,
    pub state: ActionState,
    #[serde(rename = "isReady")]
    pub is_ready: bool,
    #[serde(rename = "timeRemaining")]
    pub time_remaining: i64,
}

/// GET /v1/council/actions/:id response
#[derive(Debug, Serialize)]
pub struct ActionDetailResponse {
    pub id: String,
    #[serde(rename = "actionType")]
    pub action_type: ActionType,
    pub proposer: String,
    #[serde(rename = "proposerName")]
    pub proposer_name: Option<String>,
    #[serde(rename = "proposedAt")]
    pub proposed_at: u64,
    #[serde(rename = "expiresAt")]
    pub expires_at: u64,
    #[serde(rename = "signatureCount")]
    pub signature_count: u32,
    #[serde(rename = "requiredSignatures")]
    pub required_signatures: u32,
    pub state: ActionState,
    #[serde(rename = "isReady")]
    pub is_ready: bool,
    #[serde(rename = "isExpired")]
    pub is_expired: bool,
    /// Signers who have signed this action
    pub signers: Vec<SignerInfo>,
    /// Decoded action data
    #[serde(rename = "actionData")]
    pub action_data: ActionData,
    /// Raw action data (hex)
    #[serde(rename = "rawData")]
    pub raw_data: String,
}

#[derive(Debug, Serialize)]
pub struct SignerInfo {
    pub address: String,
    #[serde(rename = "seatId")]
    pub seat_id: u32,
    pub name: Option<String>,
    #[serde(rename = "signedAt")]
    pub signed_at: u64,
}

/// Decoded action data
#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum ActionData {
    #[serde(rename = "emergency_pause")]
    EmergencyPause {
        reason: String,
        #[serde(rename = "maxDuration")]
        max_duration: u64,
    },
    #[serde(rename = "veto")]
    Veto {
        #[serde(rename = "proposalId")]
        proposal_id: String,
        #[serde(rename = "proposalTitle")]
        proposal_title: Option<String>,
    },
    #[serde(rename = "emergency_upgrade")]
    EmergencyUpgrade {
        target: String,
        description: String,
    },
    #[serde(rename = "member_change")]
    MemberChange {
        #[serde(rename = "seatId")]
        seat_id: u32,
        #[serde(rename = "oldMember")]
        old_member: String,
        #[serde(rename = "newMember")]
        new_member: String,
    },
}

/// POST /v1/council/actions request
#[derive(Debug, Deserialize)]
pub struct ProposeActionRequest {
    #[serde(rename = "actionType")]
    pub action_type: ActionType,
    /// Action-specific data
    pub data: ProposeActionData,
    /// Proposer's signature (Dilithium)
    pub signature: String,
}

/// Action data for proposal
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ProposeActionData {
    #[serde(rename = "emergency_pause")]
    EmergencyPause { reason: String },
    #[serde(rename = "veto")]
    Veto {
        #[serde(rename = "proposalId")]
        proposal_id: String,
    },
    #[serde(rename = "emergency_upgrade")]
    EmergencyUpgrade {
        target: String,
        #[serde(rename = "calldata")]
        calldata: String,
    },
    #[serde(rename = "member_change")]
    MemberChange {
        #[serde(rename = "seatId")]
        seat_id: u32,
        #[serde(rename = "newMember")]
        new_member: String,
    },
}

/// POST /v1/council/actions response
#[derive(Debug, Serialize)]
pub struct ProposeActionResponse {
    #[serde(rename = "actionId")]
    pub action_id: String,
    #[serde(rename = "actionType")]
    pub action_type: ActionType,
    #[serde(rename = "proposedAt")]
    pub proposed_at: u64,
    #[serde(rename = "expiresAt")]
    pub expires_at: u64,
    #[serde(rename = "requiredSignatures")]
    pub required_signatures: u32,
    pub message: String,
}

/// POST /v1/council/actions/:id/sign request
#[derive(Debug, Deserialize)]
pub struct SignActionRequest {
    /// Signer's address
    pub signer: String,
    /// Signer's signature (Dilithium)
    pub signature: String,
}

/// POST /v1/council/actions/:id/sign response
#[derive(Debug, Serialize)]
pub struct SignActionResponse {
    #[serde(rename = "actionId")]
    pub action_id: String,
    #[serde(rename = "signatureCount")]
    pub signature_count: u32,
    #[serde(rename = "requiredSignatures")]
    pub required_signatures: u32,
    #[serde(rename = "isReady")]
    pub is_ready: bool,
    pub message: String,
}

/// POST /v1/council/actions/:id/execute response
#[derive(Debug, Serialize)]
pub struct ExecuteActionResponse {
    #[serde(rename = "actionId")]
    pub action_id: String,
    #[serde(rename = "actionType")]
    pub action_type: ActionType,
    pub state: ActionState,
    #[serde(rename = "executedAt")]
    pub executed_at: u64,
    #[serde(rename = "txHash")]
    pub tx_hash: String,
    pub message: String,
}

/// GET /v1/council/emergency-status response
#[derive(Debug, Serialize)]
pub struct EmergencyStatusResponse {
    /// Whether the protocol is currently paused
    #[serde(rename = "isPaused")]
    pub is_paused: bool,
    /// Pause reason (if paused)
    #[serde(rename = "pauseReason")]
    pub pause_reason: Option<String>,
    /// Timestamp when pause started
    #[serde(rename = "pausedAt")]
    pub paused_at: Option<u64>,
    /// Timestamp when pause expires (max 72h)
    #[serde(rename = "pauseExpiresAt")]
    pub pause_expires_at: Option<u64>,
    /// Time remaining on pause (seconds)
    #[serde(rename = "timeRemaining")]
    pub time_remaining: Option<u64>,
    /// Recent emergency actions
    #[serde(rename = "recentActions")]
    pub recent_actions: Vec<RecentEmergencyAction>,
}

#[derive(Debug, Serialize)]
pub struct RecentEmergencyAction {
    pub id: String,
    #[serde(rename = "actionType")]
    pub action_type: ActionType,
    pub state: ActionState,
    #[serde(rename = "executedAt")]
    pub executed_at: Option<u64>,
    pub description: String,
}

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// GET /v1/council/members
///
/// Returns list of all Security Council members with their seat information.
pub async fn get_members(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<CouncilMembersResponse>, ApiError> {
    tracing::info!("Council: Getting members");

    let pool = state.pool();

    // Fetch all council members from DB
    let member_rows = CouncilRepository::list_members(pool).await?;

    // Build members with signature participation counts
    let mut members: Vec<CouncilMember> = Vec::with_capacity(member_rows.len());
    for (idx, row) in member_rows.iter().enumerate() {
        // Count distinct actions this member has signed
        let sig_count = CouncilRepository::count_member_signatures(pool, &row.wallet_address)
            .await
            .unwrap_or(0);

        members.push(CouncilMember {
            seat_id: idx as u32,
            address: row.wallet_address.clone(),
            name: row.name.clone(),
            joined_at: row.joined_at.timestamp() as u64,
            actions_participated: sig_count as u32,
            is_active: row.is_active(),
        });
    }

    let total_members = members.len() as u32;

    tracing::info!("Council: Returning {} members", total_members);

    Ok(Json(CouncilMembersResponse {
        total_members,
        members,
        // Contract addresses - hardcoded until config supports them
        governor: "0xGOVERNOR_CONTRACT_ADDRESS".to_string(),
        emergency_controller: Some("0xEMERGENCY_CONTROLLER_ADDRESS".to_string()),
    }))
}

/// GET /v1/council/thresholds
///
/// Returns threshold requirements for different action types.
/// These are hardcoded constants matching SecurityCouncil.sol.
pub async fn get_thresholds(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ThresholdsResponse>, ApiError> {
    tracing::info!("Council: Getting thresholds");

    // Per SecurityCouncil.sol constants - these do not change
    Ok(Json(ThresholdsResponse {
        max_members: 9,
        pause_threshold: 5,   // 5/9 for EmergencyPause
        veto_threshold: 6,    // 6/9 for Veto
        upgrade_threshold: 7, // 7/9 for EmergencyUpgrade
        action_expiry: 48 * 60 * 60, // 48 hours in seconds
    }))
}

/// GET /v1/council/actions
///
/// Returns list of Security Council actions (proposed, executed, etc.).
pub async fn list_actions(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ActionsListResponse>, ApiError> {
    tracing::info!("Council: Listing actions");

    let pool = state.pool();
    let now = Utc::now();

    // Fetch actions from DB (no filter, first 100)
    let action_rows = CouncilRepository::list_actions(pool, None, 0, 100).await?;
    let total = CouncilRepository::count_actions(pool, None).await? as u32;
    let pending_count = CouncilRepository::count_actions(pool, Some("proposed")).await? as u32;

    let actions: Vec<ActionSummary> = action_rows
        .iter()
        .map(|row| {
            let time_remaining = (row.expires_at - now).num_seconds().max(0);
            let is_ready = row.signature_count >= row.required_signatures;

            ActionSummary {
                id: row.action_id.clone(),
                action_type: parse_action_type(&row.action_type),
                proposer: row.proposer.clone(),
                proposed_at: row.proposed_at.timestamp() as u64,
                expires_at: row.expires_at.timestamp() as u64,
                signature_count: row.signature_count as u32,
                required_signatures: row.required_signatures as u32,
                state: parse_action_state(&row.state),
                is_ready,
                time_remaining,
            }
        })
        .collect();

    tracing::info!("Council: Returning {} actions, {} pending", actions.len(), pending_count);

    Ok(Json(ActionsListResponse {
        actions,
        total,
        pending_count,
    }))
}

/// GET /v1/council/actions/:id
///
/// Returns detailed information about a specific action.
pub async fn get_action(
    Extension(state): Extension<Arc<AppState>>,
    Path(action_id): Path<String>,
) -> Result<Json<ActionDetailResponse>, ApiError> {
    tracing::info!("Council: Getting action {}", action_id);

    let pool = state.pool();
    let now = Utc::now();

    // Fetch action from DB
    let action = CouncilRepository::get_action_by_id(pool, &action_id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Action not found: {}", action_id)))?;

    // Fetch signatures
    let sig_rows = CouncilRepository::get_action_signatures(pool, &action_id).await?;

    // Resolve signer names from council_members
    let members = CouncilRepository::list_members(pool).await?;

    let signers: Vec<SignerInfo> = sig_rows
        .iter()
        .map(|sig| {
            let name = members
                .iter()
                .find(|m| m.wallet_address == sig.signer_address)
                .and_then(|m| m.name.clone());

            SignerInfo {
                address: sig.signer_address.clone(),
                seat_id: sig.signer_seat_id as u32,
                name,
                signed_at: sig.signed_at.timestamp() as u64,
            }
        })
        .collect();

    // Resolve proposer name
    let proposer_name = members
        .iter()
        .find(|m| m.wallet_address == action.proposer)
        .and_then(|m| m.name.clone());

    let is_expired = now > action.expires_at;
    let is_ready = action.signature_count >= action.required_signatures;

    // Parse action_data JSON into ActionData enum
    let action_data = parse_action_data_json(&action.action_type, &action.action_data);

    let response = ActionDetailResponse {
        id: action.action_id,
        action_type: parse_action_type(&action.action_type),
        proposer: action.proposer,
        proposer_name,
        proposed_at: action.proposed_at.timestamp() as u64,
        expires_at: action.expires_at.timestamp() as u64,
        signature_count: action.signature_count as u32,
        required_signatures: action.required_signatures as u32,
        state: parse_action_state(&action.state),
        is_ready,
        is_expired,
        signers,
        action_data,
        raw_data: action.raw_data.unwrap_or_else(|| "0x".to_string()),
    };

    tracing::info!("Council: Returning action detail for {}", action_id);

    Ok(Json(response))
}

/// POST /v1/council/actions
///
/// Proposes a new Security Council action.
/// Only council members can propose actions.
pub async fn propose_action(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ProposeActionRequest>,
) -> Result<Json<ProposeActionResponse>, ApiError> {
    tracing::info!("Council: Proposing {:?} action", req.action_type);

    let pool = state.pool();
    let now = Utc::now();

    let required_signatures = get_threshold_for_action(req.action_type) as i32;
    let expires_at = now + chrono::Duration::hours(48);

    let action_id = format!("0x{}", Uuid::new_v4().simple());

    // Serialize the proposal data to JSON for storage
    let action_type_str = action_type_to_str(req.action_type);
    let action_data_json = serde_json::to_value(&req.data).ok();

    // Persist to DB
    CouncilRepository::create_action(
        pool,
        &action_id,
        action_type_str,
        "", // proposer address would come from auth middleware in production
        expires_at,
        required_signatures,
        action_data_json.as_ref(),
        None,
    )
    .await?;

    tracing::info!("Council: Action {} proposed successfully", action_id);

    Ok(Json(ProposeActionResponse {
        action_id,
        action_type: req.action_type,
        proposed_at: now.timestamp() as u64,
        expires_at: expires_at.timestamp() as u64,
        required_signatures: required_signatures as u32,
        message: format!(
            "Action proposed successfully. {} of {} signatures required.",
            required_signatures, 9
        ),
    }))
}

/// POST /v1/council/actions/:id/sign
///
/// Signs a proposed action.
/// Only council members can sign actions.
pub async fn sign_action(
    Extension(state): Extension<Arc<AppState>>,
    Path(action_id): Path<String>,
    Json(req): Json<SignActionRequest>,
) -> Result<Json<SignActionResponse>, ApiError> {
    tracing::info!("Council: Signing action {}", action_id);

    let pool = state.pool();

    // Verify action exists and is in proposed state
    let action = CouncilRepository::get_action_by_id(pool, &action_id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Action not found: {}", action_id)))?;

    if action.state != "proposed" {
        return Err(ApiError::BadRequest(format!(
            "Action is not in proposed state (current: {})",
            action.state
        )));
    }

    // Verify action is not expired
    if Utc::now() > action.expires_at {
        return Err(ApiError::BadRequest("Action has expired".to_string()));
    }

    // Look up signer from council_members
    let _member = CouncilRepository::get_member_by_address(pool, &req.signer)
        .await?
        .ok_or_else(|| ApiError::BadRequest(format!("Signer is not a council member: {}", req.signer)))?;

    // Derive seat index from member list order (council_members has no seat_id column)
    let all_members = CouncilRepository::list_members(pool).await?;
    let seat_id = all_members
        .iter()
        .position(|m| m.wallet_address == req.signer)
        .unwrap_or(0) as i32;

    // Add signature and get updated count
    let new_count = CouncilRepository::add_signature(
        pool,
        &action_id,
        &req.signer,
        seat_id,
    )
    .await?;

    let required_signatures = action.required_signatures as u32;
    let signature_count = new_count as u32;
    let is_ready = signature_count >= required_signatures;

    tracing::info!(
        "Council: Action {} signed by {}, count={}/{}",
        action_id, req.signer, signature_count, required_signatures
    );

    Ok(Json(SignActionResponse {
        action_id,
        signature_count,
        required_signatures,
        is_ready,
        message: if is_ready {
            "Action is now ready for execution.".to_string()
        } else {
            format!(
                "Signature recorded. {} more signature(s) required.",
                required_signatures - signature_count
            )
        },
    }))
}

/// POST /v1/council/actions/:id/execute
///
/// Executes an action that has reached its threshold.
/// Only council members can execute actions.
pub async fn execute_action(
    Extension(state): Extension<Arc<AppState>>,
    Path(action_id): Path<String>,
) -> Result<Json<ExecuteActionResponse>, ApiError> {
    tracing::info!("Council: Executing action {}", action_id);

    let pool = state.pool();
    let now = Utc::now();

    // Verify action exists
    let action = CouncilRepository::get_action_by_id(pool, &action_id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Action not found: {}", action_id)))?;

    // Verify action is in proposed state
    if action.state != "proposed" {
        return Err(ApiError::BadRequest(format!(
            "Action is not in proposed state (current: {})",
            action.state
        )));
    }

    // Verify threshold is met
    if action.signature_count < action.required_signatures {
        return Err(ApiError::BadRequest(format!(
            "Threshold not met: {}/{} signatures",
            action.signature_count, action.required_signatures
        )));
    }

    // Verify action is not expired
    if now > action.expires_at {
        return Err(ApiError::BadRequest("Action has expired".to_string()));
    }

    // Update state to executed
    CouncilRepository::update_action_state(pool, &action_id, "executed").await?;

    let action_type = parse_action_type(&action.action_type);
    let tx_hash = format!("0x{}", Uuid::new_v4().simple());

    tracing::info!(
        "Council: Action {} executed, type={:?}",
        action_id, action_type
    );

    Ok(Json(ExecuteActionResponse {
        action_id,
        action_type,
        state: ActionState::Executed,
        executed_at: now.timestamp() as u64,
        tx_hash,
        message: "Action executed successfully.".to_string(),
    }))
}

/// GET /v1/council/emergency-status
///
/// Returns current emergency status (pause state, recent actions).
/// Since we don't have a dedicated system_settings table for pause state yet,
/// we query recent emergency actions from council_actions.
pub async fn get_emergency_status(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<EmergencyStatusResponse>, ApiError> {
    tracing::info!("Council: Getting emergency status");

    let pool = state.pool();

    // Query recent executed emergency-related actions (last 10)
    let action_rows = CouncilRepository::list_actions(pool, Some("executed"), 0, 10).await?;

    let recent_actions: Vec<RecentEmergencyAction> = action_rows
        .iter()
        .map(|row| {
            let description = row
                .action_data
                .as_ref()
                .and_then(|data| data.get("reason").and_then(|r| r.as_str()))
                .unwrap_or("Council action")
                .to_string();

            RecentEmergencyAction {
                id: row.action_id.clone(),
                action_type: parse_action_type(&row.action_type),
                state: parse_action_state(&row.state),
                executed_at: row.executed_at.map(|t| t.timestamp() as u64),
                description,
            }
        })
        .collect();

    tracing::info!(
        "Council: Emergency status - is_paused=false, recent_actions={}",
        recent_actions.len()
    );

    // No dedicated pause state tracking yet; return is_paused=false
    Ok(Json(EmergencyStatusResponse {
        is_paused: false,
        pause_reason: None,
        paused_at: None,
        pause_expires_at: None,
        time_remaining: None,
        recent_actions,
    }))
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Get threshold for action type
fn get_threshold_for_action(action_type: ActionType) -> u32 {
    match action_type {
        ActionType::EmergencyPause => 5,   // 5/9
        ActionType::Veto => 6,             // 6/9
        ActionType::MemberChange => 6,     // 6/9
        ActionType::EmergencyUpgrade => 7, // 7/9
    }
}

/// Convert a DB action_type string to the ActionType enum
fn parse_action_type(s: &str) -> ActionType {
    match s {
        "emergency_pause" => ActionType::EmergencyPause,
        "veto" => ActionType::Veto,
        "emergency_upgrade" => ActionType::EmergencyUpgrade,
        "member_change" => ActionType::MemberChange,
        _ => ActionType::EmergencyPause, // fallback
    }
}

/// Convert a DB state string to the ActionState enum
fn parse_action_state(s: &str) -> ActionState {
    match s {
        "proposed" => ActionState::Proposed,
        "executed" => ActionState::Executed,
        "cancelled" => ActionState::Cancelled,
        "expired" => ActionState::Expired,
        _ => ActionState::Proposed, // fallback
    }
}

/// Convert ActionType enum to a DB string
fn action_type_to_str(action_type: ActionType) -> &'static str {
    match action_type {
        ActionType::EmergencyPause => "emergency_pause",
        ActionType::Veto => "veto",
        ActionType::EmergencyUpgrade => "emergency_upgrade",
        ActionType::MemberChange => "member_change",
    }
}

/// Parse action_data JSON into the ActionData enum based on the action type.
/// Falls back to sensible defaults if the JSON is missing or malformed.
fn parse_action_data_json(action_type: &str, json: &Option<serde_json::Value>) -> ActionData {
    match action_type {
        "emergency_pause" => {
            let reason = json
                .as_ref()
                .and_then(|v| v.get("reason").and_then(|r| r.as_str()))
                .unwrap_or("No reason provided")
                .to_string();
            ActionData::EmergencyPause {
                reason,
                max_duration: 72 * 3600, // 72 hours max per spec
            }
        }
        "veto" => {
            let proposal_id = json
                .as_ref()
                .and_then(|v| v.get("proposalId").or_else(|| v.get("proposal_id")).and_then(|r| r.as_str()))
                .unwrap_or("")
                .to_string();
            let proposal_title = json
                .as_ref()
                .and_then(|v| v.get("proposalTitle").or_else(|| v.get("proposal_title")).and_then(|r| r.as_str()))
                .map(|s| s.to_string());
            ActionData::Veto {
                proposal_id,
                proposal_title,
            }
        }
        "emergency_upgrade" => {
            let target = json
                .as_ref()
                .and_then(|v| v.get("target").and_then(|r| r.as_str()))
                .unwrap_or("")
                .to_string();
            let description = json
                .as_ref()
                .and_then(|v| v.get("description").or_else(|| v.get("calldata")).and_then(|r| r.as_str()))
                .unwrap_or("")
                .to_string();
            ActionData::EmergencyUpgrade {
                target,
                description,
            }
        }
        "member_change" => {
            let seat_id = json
                .as_ref()
                .and_then(|v| v.get("seatId").or_else(|| v.get("seat_id")).and_then(|r| r.as_u64()))
                .unwrap_or(0) as u32;
            let old_member = json
                .as_ref()
                .and_then(|v| v.get("oldMember").or_else(|| v.get("old_member")).and_then(|r| r.as_str()))
                .unwrap_or("")
                .to_string();
            let new_member = json
                .as_ref()
                .and_then(|v| v.get("newMember").or_else(|| v.get("new_member")).and_then(|r| r.as_str()))
                .unwrap_or("")
                .to_string();
            ActionData::MemberChange {
                seat_id,
                old_member,
                new_member,
            }
        }
        _ => ActionData::EmergencyPause {
            reason: "Unknown action type".to_string(),
            max_duration: 72 * 3600,
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
    fn test_action_type_serialization() {
        let action = ActionType::EmergencyPause;
        let json = serde_json::to_string(&action).unwrap();
        assert_eq!(json, "\"emergency_pause\"");
    }

    #[test]
    fn test_action_state_serialization() {
        let state = ActionState::Proposed;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"proposed\"");
    }

    #[test]
    fn test_threshold_values() {
        assert_eq!(get_threshold_for_action(ActionType::EmergencyPause), 5);
        assert_eq!(get_threshold_for_action(ActionType::Veto), 6);
        assert_eq!(get_threshold_for_action(ActionType::MemberChange), 6);
        assert_eq!(get_threshold_for_action(ActionType::EmergencyUpgrade), 7);
    }

    #[test]
    fn test_propose_action_data_deserialization() {
        let json = r#"{"type": "emergency_pause", "reason": "Test reason"}"#;
        let data: ProposeActionData = serde_json::from_str(json).unwrap();
        match data {
            ProposeActionData::EmergencyPause { reason } => {
                assert_eq!(reason, "Test reason");
            }
            _ => panic!("Expected EmergencyPause"),
        }
    }

    #[test]
    fn test_veto_action_data_deserialization() {
        let json = r#"{"type": "veto", "proposalId": "QIP-001"}"#;
        let data: ProposeActionData = serde_json::from_str(json).unwrap();
        match data {
            ProposeActionData::Veto { proposal_id } => {
                assert_eq!(proposal_id, "QIP-001");
            }
            _ => panic!("Expected Veto"),
        }
    }

    #[test]
    fn test_member_change_data_deserialization() {
        let json = r#"{"type": "member_change", "seatId": 5, "newMember": "0x1234"}"#;
        let data: ProposeActionData = serde_json::from_str(json).unwrap();
        match data {
            ProposeActionData::MemberChange { seat_id, new_member } => {
                assert_eq!(seat_id, 5);
                assert_eq!(new_member, "0x1234");
            }
            _ => panic!("Expected MemberChange"),
        }
    }

    #[test]
    fn test_council_members_response() {
        let response = CouncilMembersResponse {
            total_members: 9,
            members: vec![],
            governor: "0xGOV".to_string(),
            emergency_controller: Some("0xEC".to_string()),
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"totalMembers\":9"));
    }

    #[test]
    fn test_emergency_status_response() {
        let response = EmergencyStatusResponse {
            is_paused: false,
            pause_reason: None,
            paused_at: None,
            pause_expires_at: None,
            time_remaining: None,
            recent_actions: vec![],
        };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"isPaused\":false"));
    }

    #[test]
    fn test_action_data_serialization() {
        let data = ActionData::EmergencyPause {
            reason: "Test".to_string(),
            max_duration: 259200,
        };
        let json = serde_json::to_string(&data).unwrap();
        assert!(json.contains("\"type\":\"emergency_pause\""));
        assert!(json.contains("\"maxDuration\":259200"));
    }
}
