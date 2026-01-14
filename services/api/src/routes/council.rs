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

use crate::{
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
#[derive(Debug, Deserialize)]
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
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<CouncilMembersResponse>, ApiError> {
    tracing::debug!("Council: Getting members");

    // Mock data - 9-member Security Council
    // In production: Query SecurityCouncil.sol contract
    let members: Vec<CouncilMember> = (0..9)
        .map(|i| CouncilMember {
            seat_id: i,
            address: format!("0x{:0>40}", format!("{}", i + 1).repeat(40 / format!("{}", i + 1).len())),
            name: Some(format!("Council Member {}", i + 1)),
            joined_at: 1704067200 + (i as u64 * 86400), // Staggered join dates
            actions_participated: (10 - i) as u32, // Varying participation
            is_active: true,
        })
        .collect();

    Ok(Json(CouncilMembersResponse {
        total_members: 9,
        members,
        governor: "0xGOVERNOR_CONTRACT_ADDRESS".to_string(),
        emergency_controller: Some("0xEMERGENCY_CONTROLLER_ADDRESS".to_string()),
    }))
}

/// GET /v1/council/thresholds
///
/// Returns threshold requirements for different action types.
pub async fn get_thresholds(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ThresholdsResponse>, ApiError> {
    tracing::debug!("Council: Getting thresholds");

    // Per SecurityCouncil.sol constants
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
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ActionsListResponse>, ApiError> {
    tracing::debug!("Council: Listing actions");

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Mock data - example actions
    let actions = vec![
        ActionSummary {
            id: "0xACTION001".to_string(),
            action_type: ActionType::EmergencyPause,
            proposer: "0x1111111111111111111111111111111111111111".to_string(),
            proposed_at: now - 3600, // 1 hour ago
            expires_at: now + (47 * 3600), // 47 hours remaining
            signature_count: 3,
            required_signatures: 5,
            state: ActionState::Proposed,
            is_ready: false,
            time_remaining: (47 * 3600) as i64,
        },
        ActionSummary {
            id: "0xACTION002".to_string(),
            action_type: ActionType::Veto,
            proposer: "0x2222222222222222222222222222222222222222".to_string(),
            proposed_at: now - 86400, // 24 hours ago
            expires_at: now + (24 * 3600), // 24 hours remaining
            signature_count: 6,
            required_signatures: 6,
            state: ActionState::Proposed,
            is_ready: true, // Ready to execute
            time_remaining: (24 * 3600) as i64,
        },
        ActionSummary {
            id: "0xACTION003".to_string(),
            action_type: ActionType::EmergencyPause,
            proposer: "0x1111111111111111111111111111111111111111".to_string(),
            proposed_at: now - (7 * 86400), // 7 days ago
            expires_at: now - (5 * 86400), // Expired
            signature_count: 5,
            required_signatures: 5,
            state: ActionState::Executed,
            is_ready: false,
            time_remaining: 0,
        },
    ];

    let pending_count = actions.iter().filter(|a| a.state == ActionState::Proposed).count() as u32;

    Ok(Json(ActionsListResponse {
        actions,
        total: 3,
        pending_count,
    }))
}

/// GET /v1/council/actions/:id
///
/// Returns detailed information about a specific action.
pub async fn get_action(
    Extension(_state): Extension<Arc<AppState>>,
    Path(action_id): Path<String>,
) -> Result<Json<ActionDetailResponse>, ApiError> {
    tracing::debug!("Council: Getting action {}", action_id);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Mock data
    let response = ActionDetailResponse {
        id: action_id.clone(),
        action_type: ActionType::EmergencyPause,
        proposer: "0x1111111111111111111111111111111111111111".to_string(),
        proposer_name: Some("Council Member 1".to_string()),
        proposed_at: now - 3600,
        expires_at: now + (47 * 3600),
        signature_count: 3,
        required_signatures: 5,
        state: ActionState::Proposed,
        is_ready: false,
        is_expired: false,
        signers: vec![
            SignerInfo {
                address: "0x1111111111111111111111111111111111111111".to_string(),
                seat_id: 0,
                name: Some("Council Member 1".to_string()),
                signed_at: now - 3600,
            },
            SignerInfo {
                address: "0x2222222222222222222222222222222222222222".to_string(),
                seat_id: 1,
                name: Some("Council Member 2".to_string()),
                signed_at: now - 3000,
            },
            SignerInfo {
                address: "0x3333333333333333333333333333333333333333".to_string(),
                seat_id: 2,
                name: Some("Council Member 3".to_string()),
                signed_at: now - 1800,
            },
        ],
        action_data: ActionData::EmergencyPause {
            reason: "Detected suspicious activity on L3 bridge".to_string(),
            max_duration: 72 * 3600, // 72 hours max
        },
        raw_data: "0x000000...".to_string(),
    };

    Ok(Json(response))
}

/// POST /v1/council/actions
///
/// Proposes a new Security Council action.
/// Only council members can propose actions.
pub async fn propose_action(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<ProposeActionRequest>,
) -> Result<Json<ProposeActionResponse>, ApiError> {
    tracing::info!("Council: Proposing {:?} action", req.action_type);

    // In production:
    // 1. Verify proposer is a council member
    // 2. Validate Dilithium signature
    // 3. Call SecurityCouncil.proposeAction()
    // 4. Return transaction result

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let required_signatures = match req.action_type {
        ActionType::EmergencyPause => 5,
        ActionType::Veto | ActionType::MemberChange => 6,
        ActionType::EmergencyUpgrade => 7,
    };

    let action_id = format!(
        "0x{}",
        Uuid::new_v4().simple()
    );

    Ok(Json(ProposeActionResponse {
        action_id,
        action_type: req.action_type,
        proposed_at: now,
        expires_at: now + (48 * 3600), // 48 hour expiry
        required_signatures,
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
    Extension(_state): Extension<Arc<AppState>>,
    Path(action_id): Path<String>,
    Json(_req): Json<SignActionRequest>,
) -> Result<Json<SignActionResponse>, ApiError> {
    tracing::info!("Council: Signing action {}", action_id);

    // In production:
    // 1. Verify signer is a council member
    // 2. Verify action exists and is not expired
    // 3. Verify signer hasn't already signed
    // 4. Validate Dilithium signature
    // 5. Call SecurityCouncil.signAction()

    // Mock response with incremented signature
    let signature_count = 4; // Previous 3 + this 1
    let required_signatures = 5; // Assuming EmergencyPause

    Ok(Json(SignActionResponse {
        action_id: action_id.clone(),
        signature_count,
        required_signatures,
        is_ready: signature_count >= required_signatures,
        message: if signature_count >= required_signatures {
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
    Extension(_state): Extension<Arc<AppState>>,
    Path(action_id): Path<String>,
) -> Result<Json<ExecuteActionResponse>, ApiError> {
    tracing::info!("Council: Executing action {}", action_id);

    // In production:
    // 1. Verify caller is a council member
    // 2. Verify action exists and threshold is met
    // 3. Verify action is not expired
    // 4. Call SecurityCouncil.executeAction()

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    Ok(Json(ExecuteActionResponse {
        action_id: action_id.clone(),
        action_type: ActionType::EmergencyPause,
        state: ActionState::Executed,
        executed_at: now,
        tx_hash: format!("0x{}", Uuid::new_v4().simple()),
        message: "Action executed successfully. Emergency pause is now active.".to_string(),
    }))
}

/// GET /v1/council/emergency-status
///
/// Returns current emergency status (pause state, recent actions).
pub async fn get_emergency_status(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<EmergencyStatusResponse>, ApiError> {
    tracing::debug!("Council: Getting emergency status");

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Mock data - protocol is not paused
    Ok(Json(EmergencyStatusResponse {
        is_paused: false,
        pause_reason: None,
        paused_at: None,
        pause_expires_at: None,
        time_remaining: None,
        recent_actions: vec![
            RecentEmergencyAction {
                id: "0xACTION003".to_string(),
                action_type: ActionType::EmergencyPause,
                state: ActionState::Executed,
                executed_at: Some(now - (7 * 86400)),
                description: "Emergency pause due to detected anomaly (resolved)".to_string(),
            },
            RecentEmergencyAction {
                id: "0xACTION004".to_string(),
                action_type: ActionType::Veto,
                state: ActionState::Executed,
                executed_at: Some(now - (14 * 86400)),
                description: "Vetoed malicious parameter change proposal".to_string(),
            },
        ],
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
