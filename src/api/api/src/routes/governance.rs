//! Governance API implementation
//!
//! TASK-P5-023: Governance API (8 EP)
//!
//! Provides endpoints for:
//! - Governance dashboard and proposals
//! - Voting and vote management
//! - User activity tracking
//! - Council information
//!
//! Spec References:
//! - SEQUENCES §7 Governance Proposal
//! - UNIFIED_SPEC §Governance, §veQS Voting

use std::str::FromStr;
use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use serde::{Deserialize, Serialize};

use crate::{
    db::GovernanceRepository,
    error::ApiError,
    services::AppState,
};

use ethers::prelude::*;

// Needed for create_proposal chrono duration and uuid generation

// ============================================================================
// Governance Types
// ============================================================================

/// Proposal status enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProposalStatus {
    /// Proposal is currently active for voting
    Active,
    /// Proposal passed with majority support
    Passed,
    /// Proposal was defeated
    Defeated,
    /// Proposal is pending execution
    Pending,
    /// Proposal was executed successfully
    Executed,
    /// Proposal was cancelled
    Cancelled,
    /// Proposal was vetoed by council
    Vetoed,
}

/// Vote type enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum VoteType {
    For,
    Against,
    Abstain,
}

/// Proposal type enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProposalType {
    /// Parameter change proposal
    Parameter,
    /// Treasury spending proposal
    Treasury,
    /// Upgrade proposal
    Upgrade,
    /// Text/signal proposal
    Signal,
    /// Emergency action
    Emergency,
}

// ============================================================================
// Request/Response Types
// ============================================================================

/// GET /v1/governance/dashboard response
#[derive(Debug, Serialize)]
pub struct GovernanceDashboardResponse {
    /// User's total voting power
    #[serde(rename = "votingPower")]
    pub voting_power: String,
    /// User's veQS balance
    #[serde(rename = "veQsBalance")]
    pub ve_qs_balance: String,
    /// Total delegated voting power received
    #[serde(rename = "delegatedPower")]
    pub delegated_power: String,
    /// Number of active proposals
    #[serde(rename = "activeProposals")]
    pub active_proposals: u32,
    /// Number of proposals user hasn't voted on
    #[serde(rename = "pendingVotes")]
    pub pending_votes: u32,
    /// Recent proposals summary
    #[serde(rename = "recentProposals")]
    pub recent_proposals: Vec<ProposalSummary>,
    /// Governance statistics
    pub stats: GovernanceStats,
}

#[derive(Debug, Serialize)]
pub struct GovernanceStats {
    /// Total proposals all time
    #[serde(rename = "totalProposals")]
    pub total_proposals: u32,
    /// Total votes cast
    #[serde(rename = "totalVotes")]
    pub total_votes: u64,
    /// Current participation rate
    #[serde(rename = "participationRate")]
    pub participation_rate: f64,
    /// Average turnout percentage
    #[serde(rename = "averageTurnout")]
    pub average_turnout: f64,
}

#[derive(Debug, Serialize)]
pub struct ProposalSummary {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub proposal_type: ProposalType,
    pub status: ProposalStatus,
    #[serde(rename = "endTime")]
    pub end_time: u64,
    #[serde(rename = "forVotes")]
    pub for_votes: String,
    #[serde(rename = "againstVotes")]
    pub against_votes: String,
}

/// GET /v1/governance/proposals response
#[derive(Debug, Serialize)]
pub struct ProposalsListResponse {
    pub proposals: Vec<ProposalListItem>,
    pub total: u32,
    pub page: u32,
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct ProposalListItem {
    pub id: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "type")]
    pub proposal_type: ProposalType,
    pub status: ProposalStatus,
    pub proposer: String,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "startTime")]
    pub start_time: u64,
    #[serde(rename = "endTime")]
    pub end_time: u64,
    #[serde(rename = "forVotes")]
    pub for_votes: String,
    #[serde(rename = "againstVotes")]
    pub against_votes: String,
    #[serde(rename = "abstainVotes")]
    pub abstain_votes: String,
    pub quorum: String,
    #[serde(rename = "quorumReached")]
    pub quorum_reached: bool,
}

/// GET /v1/governance/proposals/:id response
#[derive(Debug, Serialize)]
pub struct ProposalDetailResponse {
    pub id: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "fullDescription")]
    pub full_description: String,
    #[serde(rename = "type")]
    pub proposal_type: ProposalType,
    pub status: ProposalStatus,
    pub proposer: String,
    #[serde(rename = "proposerVeQs")]
    pub proposer_ve_qs: String,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "startTime")]
    pub start_time: u64,
    #[serde(rename = "endTime")]
    pub end_time: u64,
    #[serde(rename = "forVotes")]
    pub for_votes: String,
    #[serde(rename = "againstVotes")]
    pub against_votes: String,
    #[serde(rename = "abstainVotes")]
    pub abstain_votes: String,
    pub quorum: String,
    #[serde(rename = "quorumReached")]
    pub quorum_reached: bool,
    /// User's current vote on this proposal (if any)
    #[serde(rename = "userVote")]
    pub user_vote: Option<VoteType>,
    /// User's voting power at snapshot
    #[serde(rename = "userVotingPower")]
    pub user_voting_power: String,
    /// Recent votes on this proposal
    #[serde(rename = "recentVotes")]
    pub recent_votes: Vec<VoteRecord>,
    /// Execution parameters (if applicable)
    #[serde(rename = "executionParams")]
    pub execution_params: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct VoteRecord {
    pub voter: String,
    #[serde(rename = "voteType")]
    pub vote_type: VoteType,
    #[serde(rename = "votingPower")]
    pub voting_power: String,
    pub timestamp: u64,
    pub reason: Option<String>,
}

/// POST /v1/governance/proposals request
#[derive(Debug, Deserialize)]
pub struct CreateProposalRequest {
    pub title: String,
    pub description: String,
    #[serde(rename = "fullDescription")]
    pub full_description: String,
    #[serde(rename = "type")]
    pub proposal_type: ProposalType,
    /// Voting duration in seconds (default: 7 days)
    #[serde(rename = "votingDuration")]
    pub voting_duration: Option<u64>,
    /// Execution parameters (for Parameter/Treasury/Upgrade types)
    #[serde(rename = "executionParams")]
    pub execution_params: Option<serde_json::Value>,
    /// Proposer's signature
    pub signature: String,
}

/// POST /v1/governance/proposals response
#[derive(Debug, Serialize)]
pub struct CreateProposalResponse {
    #[serde(rename = "proposalId")]
    pub proposal_id: String,
    pub status: ProposalStatus,
    #[serde(rename = "startTime")]
    pub start_time: u64,
    #[serde(rename = "endTime")]
    pub end_time: u64,
    pub message: String,
}

/// POST /v1/governance/vote request
///
/// When using the RESTful route `/governance/proposals/:id/vote`, the
/// `proposalId` field can be omitted (it defaults to an empty string and
/// is overridden by the path parameter). The `signature` field is also
/// optional to support lightweight vote submissions from the frontend.
#[derive(Debug, Deserialize)]
pub struct VoteRequest {
    #[serde(rename = "proposalId", default)]
    pub proposal_id: String,
    /// Vote type: "for" | "against" | "abstain"
    /// Also accepts the shorthand `vote` field used by the frontend hooks.
    #[serde(rename = "voteType", alias = "vote")]
    pub vote_type: VoteType,
    /// Optional reason for vote
    pub reason: Option<String>,
    /// Voter's signature (optional for frontend convenience)
    #[serde(default)]
    pub signature: String,
}

/// POST /v1/governance/vote response
#[derive(Debug, Serialize)]
pub struct VoteResponse {
    #[serde(rename = "voteId")]
    pub vote_id: String,
    #[serde(rename = "proposalId")]
    pub proposal_id: String,
    #[serde(rename = "voteType")]
    pub vote_type: VoteType,
    #[serde(rename = "votingPower")]
    pub voting_power: String,
    pub timestamp: u64,
    pub message: String,
}

/// GET /v1/governance/votes/:id response
#[derive(Debug, Serialize)]
pub struct VoteDetailResponse {
    #[serde(rename = "voteId")]
    pub vote_id: String,
    #[serde(rename = "proposalId")]
    pub proposal_id: String,
    #[serde(rename = "proposalTitle")]
    pub proposal_title: String,
    pub voter: String,
    #[serde(rename = "voteType")]
    pub vote_type: VoteType,
    #[serde(rename = "votingPower")]
    pub voting_power: String,
    pub timestamp: u64,
    pub reason: Option<String>,
    #[serde(rename = "txHash")]
    pub tx_hash: String,
}

/// GET /v1/governance/activity response
#[derive(Debug, Serialize)]
pub struct ActivityResponse {
    /// User's vote history
    pub votes: Vec<UserVote>,
    /// User's created proposals
    pub proposals: Vec<UserProposal>,
    /// Delegations received
    #[serde(rename = "delegationsReceived")]
    pub delegations_received: Vec<DelegationInfo>,
    /// Total votes cast
    #[serde(rename = "totalVotes")]
    pub total_votes: u32,
    /// Total proposals created
    #[serde(rename = "totalProposals")]
    pub total_proposals: u32,
}

#[derive(Debug, Serialize)]
pub struct UserVote {
    #[serde(rename = "proposalId")]
    pub proposal_id: String,
    #[serde(rename = "proposalTitle")]
    pub proposal_title: String,
    #[serde(rename = "voteType")]
    pub vote_type: VoteType,
    #[serde(rename = "votingPower")]
    pub voting_power: String,
    pub timestamp: u64,
    #[serde(rename = "proposalStatus")]
    pub proposal_status: ProposalStatus,
}

#[derive(Debug, Serialize)]
pub struct UserProposal {
    #[serde(rename = "proposalId")]
    pub proposal_id: String,
    pub title: String,
    pub status: ProposalStatus,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "forVotes")]
    pub for_votes: String,
    #[serde(rename = "againstVotes")]
    pub against_votes: String,
}

#[derive(Debug, Serialize)]
pub struct DelegationInfo {
    pub delegator: String,
    #[serde(rename = "votingPower")]
    pub voting_power: String,
    #[serde(rename = "delegatedAt")]
    pub delegated_at: u64,
}

/// GET /v1/governance/council response
#[derive(Debug, Serialize)]
pub struct CouncilResponse {
    /// Council members
    pub members: Vec<CouncilMember>,
    /// Council threshold for actions
    pub threshold: u32,
    /// Total council size
    #[serde(rename = "totalMembers")]
    pub total_members: u32,
    /// Emergency actions taken
    #[serde(rename = "emergencyActions")]
    pub emergency_actions: Vec<EmergencyAction>,
    /// Veto history
    #[serde(rename = "vetoHistory")]
    pub veto_history: Vec<VetoRecord>,
}

#[derive(Debug, Serialize)]
pub struct CouncilMember {
    pub address: String,
    pub name: Option<String>,
    #[serde(rename = "joinedAt")]
    pub joined_at: u64,
    #[serde(rename = "actionsCount")]
    pub actions_count: u32,
}

#[derive(Debug, Serialize)]
pub struct EmergencyAction {
    pub id: String,
    #[serde(rename = "actionType")]
    pub action_type: String,
    pub description: String,
    #[serde(rename = "executedAt")]
    pub executed_at: u64,
    pub signers: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct VetoRecord {
    #[serde(rename = "proposalId")]
    pub proposal_id: String,
    #[serde(rename = "proposalTitle")]
    pub proposal_title: String,
    #[serde(rename = "vetoedAt")]
    pub vetoed_at: u64,
    pub reason: String,
    pub signers: Vec<String>,
}

/// GET /v1/governance/voting-power response
///
/// Field names match the FE `VotingPowerBreakdown` interface in
/// `apps/web/src/lib/api/governance/types.ts`.
#[derive(Debug, Serialize)]
pub struct VotingPowerBreakdownResponse {
    /// User's own veQS balance
    #[serde(rename = "myVeqs")]
    pub my_veqs: f64,
    /// Voting power delegated to user by others
    #[serde(rename = "delegatedToMe")]
    pub delegated_to_me: f64,
    /// Voting power user delegated to others
    #[serde(rename = "iDelegated")]
    pub i_delegated: f64,
    /// Number of addresses that delegated to user
    pub delegators: u32,
    /// Lock expiry date (ISO date string, e.g. "2028-01-15")
    #[serde(rename = "lockExpiry")]
    pub lock_expiry: String,
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Map DB proposal_type string to ProposalType enum
/// SEQUENCES.md §7: 5 proposal types with type-dependent quorum
fn map_proposal_type(pt: Option<&str>) -> ProposalType {
    match pt.unwrap_or("parameter") {
        "parameter" => ProposalType::Parameter,
        "treasury" => ProposalType::Treasury,
        "upgrade" => ProposalType::Upgrade,
        "signal" => ProposalType::Signal,
        "emergency" => ProposalType::Emergency,
        _ => ProposalType::Parameter,
    }
}

/// Map DB status string to ProposalStatus enum
fn map_proposal_status(status: &str) -> ProposalStatus {
    match status {
        "active" => ProposalStatus::Active,
        "passed" => ProposalStatus::Passed,
        "defeated" => ProposalStatus::Defeated,
        "pending" | "pending_execution" => ProposalStatus::Pending,
        "executed" => ProposalStatus::Executed,
        "cancelled" => ProposalStatus::Cancelled,
        "vetoed" => ProposalStatus::Vetoed,
        _ => ProposalStatus::Pending,
    }
}

/// Map DB support value (i16) to VoteType enum
fn map_vote_type(support: i16) -> VoteType {
    match support {
        1 => VoteType::For,
        0 => VoteType::Against,
        _ => VoteType::Abstain,
    }
}

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// GET /v1/governance/dashboard
///
/// Returns governance dashboard overview including voting power,
/// active proposals, and recent activity.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_dashboard(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<GovernanceDashboardResponse>, ApiError> {
    tracing::info!("Governance: get_dashboard started");
    let pool = state.pool();

    // Get active proposals
    let active_proposals_list = GovernanceRepository::list_active(pool).await?;
    let active_proposals = active_proposals_list.len() as u32;

    // Get recent proposals (latest 5)
    let recent_rows = GovernanceRepository::list_proposals(pool, None, 0, 5).await?;
    let recent_proposals: Vec<ProposalSummary> = recent_rows.iter().map(|p| {
        ProposalSummary {
            id: p.proposal_id.clone(),
            title: p.title.clone(),
            proposal_type: map_proposal_type(p.proposal_type.as_deref()),
            status: map_proposal_status(&p.status),
            end_time: p.end_time.map(|t| t.timestamp() as u64).unwrap_or(0),
            for_votes: p.votes_for.to_string(),
            against_votes: p.votes_against.to_string(),
        }
    }).collect();

    // Stats
    let total_proposals = GovernanceRepository::count_by_status(pool, None).await? as u32;
    let total_votes = GovernanceRepository::count_all_votes(pool).await? as u64;

    // L3 integration: fetch total voting power for participation rate
    let total_voting_power = state.l3_contracts.get_total_voting_power().await
        .unwrap_or_else(|e| {
            tracing::warn!("L3: get_total_voting_power failed, using default: {}", e);
            U256::from(100)
        });

    // Participation rate: total votes cast / total possible voting power
    let participation_rate = if !total_voting_power.is_zero() && total_proposals > 0 {
        let avg_votes_per_proposal = total_votes as f64 / total_proposals as f64;
        let total_power_f64 = total_voting_power.as_u128() as f64;
        (avg_votes_per_proposal / total_power_f64 * 100.0).min(100.0)
    } else {
        0.0
    };

    let response = GovernanceDashboardResponse {
        voting_power: "0".to_string(), // Per-user: requires auth context (JWT user address)
        ve_qs_balance: "0".to_string(),
        delegated_power: "0".to_string(),
        active_proposals,
        pending_votes: 0, // Requires user context
        recent_proposals,
        stats: GovernanceStats {
            total_proposals,
            total_votes,
            participation_rate,
            average_turnout: participation_rate, // Same metric until per-proposal tracking
        },
    };

    tracing::info!("Governance: get_dashboard completed, active={}, total={}, participation={:.1}%",
        active_proposals, total_proposals, participation_rate);
    Ok(Json(response))
}

/// GET /v1/governance/proposals
///
/// Returns paginated list of governance proposals with filtering.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn list_proposals(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ProposalsListResponse>, ApiError> {
    tracing::info!("Governance: list_proposals started");
    let pool = state.pool();

    let total = GovernanceRepository::count_by_status(pool, None).await? as u32;
    let rows = GovernanceRepository::list_proposals(pool, None, 0, 20).await?;

    let proposals: Vec<ProposalListItem> = rows.iter().map(|p| {
        let total_votes = &p.votes_for + &p.votes_against + &p.votes_abstain;
        let quorum_reached = total_votes >= p.quorum;
        ProposalListItem {
            id: p.proposal_id.clone(),
            title: p.title.clone(),
            description: p.description.clone().unwrap_or_default(),
            proposal_type: map_proposal_type(p.proposal_type.as_deref()),
            status: map_proposal_status(&p.status),
            proposer: p.proposer.clone(),
            created_at: p.created_at.timestamp() as u64,
            start_time: p.start_time.map(|t| t.timestamp() as u64).unwrap_or(0),
            end_time: p.end_time.map(|t| t.timestamp() as u64).unwrap_or(0),
            for_votes: p.votes_for.to_string(),
            against_votes: p.votes_against.to_string(),
            abstain_votes: p.votes_abstain.to_string(),
            quorum: p.quorum.to_string(),
            quorum_reached,
        }
    }).collect();

    tracing::info!("Governance: list_proposals completed, count={}, total={}", proposals.len(), total);
    Ok(Json(ProposalsListResponse {
        proposals,
        total,
        page: 1,
        page_size: 20,
    }))
}

/// GET /v1/governance/proposals/:id
///
/// Returns detailed information about a specific proposal.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_proposal(
    Extension(state): Extension<Arc<AppState>>,
    Path(proposal_id): Path<String>,
) -> Result<Json<ProposalDetailResponse>, ApiError> {
    tracing::info!("Governance: get_proposal started, proposal_id={}", proposal_id);
    let pool = state.pool();

    let p = GovernanceRepository::get_proposal_by_id(pool, &proposal_id).await?
        .ok_or_else(|| ApiError::NotFound(format!("Proposal {} not found", proposal_id)))?;

    // Get recent votes for this proposal
    let vote_rows = GovernanceRepository::list_votes(pool, &proposal_id, 0, 10).await?;
    let recent_votes: Vec<VoteRecord> = vote_rows.iter().map(|v| {
        VoteRecord {
            voter: v.voter.clone(),
            vote_type: map_vote_type(v.support),
            voting_power: v.weight.to_string(),
            timestamp: v.voted_at.timestamp() as u64,
            reason: None, // No reason column in VoteRow
        }
    }).collect();

    let total_votes = &p.votes_for + &p.votes_against + &p.votes_abstain;
    let quorum_reached = total_votes >= p.quorum;
    let description = p.description.clone().unwrap_or_default();

    // L3 integration: fetch proposer's veQS balance
    let proposer_ve_qs = if let Ok(proposer_addr) = p.proposer.parse::<Address>() {
        state.l3_contracts.get_voting_power(proposer_addr).await
            .map(|v| v.to_string())
            .unwrap_or_else(|e| {
                tracing::warn!("L3: get_voting_power for proposer failed: {}", e);
                "0".to_string()
            })
    } else {
        "0".to_string()
    };

    let response = ProposalDetailResponse {
        id: p.proposal_id.clone(),
        title: p.title.clone(),
        description: description.clone(),
        full_description: description,
        proposal_type: map_proposal_type(p.proposal_type.as_deref()),
        status: map_proposal_status(&p.status),
        proposer: p.proposer.clone(),
        proposer_ve_qs,
        created_at: p.created_at.timestamp() as u64,
        start_time: p.start_time.map(|t| t.timestamp() as u64).unwrap_or(0),
        end_time: p.end_time.map(|t| t.timestamp() as u64).unwrap_or(0),
        for_votes: p.votes_for.to_string(),
        against_votes: p.votes_against.to_string(),
        abstain_votes: p.votes_abstain.to_string(),
        quorum: p.quorum.to_string(),
        quorum_reached,
        user_vote: None, // Requires user context (JWT)
        user_voting_power: "0".to_string(),
        recent_votes,
        execution_params: None,
    };

    tracing::info!("Governance: get_proposal completed, proposal_id={}", proposal_id);
    Ok(Json(response))
}

/// POST /v1/governance/proposals
///
/// Creates a new governance proposal.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn create_proposal(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<CreateProposalRequest>,
) -> Result<Json<CreateProposalResponse>, ApiError> {
    tracing::info!("Governance: create_proposal started, title={}", req.title);
    let pool = state.pool();

    let now = chrono::Utc::now();
    let voting_duration = chrono::Duration::seconds(req.voting_duration.unwrap_or(604800) as i64);
    let end_time = now + voting_duration;

    let proposal_id = format!("QIP-{}", uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("000"));

    let proposal_type_str = match req.proposal_type {
        ProposalType::Parameter => "parameter",
        ProposalType::Treasury => "treasury",
        ProposalType::Upgrade => "upgrade",
        ProposalType::Signal => "signal",
        ProposalType::Emergency => "emergency",
    };

    // TODO: In production, extract proposer from auth context / signature
    let proposer = "0x0000000000000000000000000000000000000000";

    let created = GovernanceRepository::create_proposal(
        pool,
        &proposal_id,
        &req.title,
        &req.description,
        proposer,
        proposal_type_str,
        now,
        end_time,
    ).await?;

    tracing::info!("Governance: create_proposal completed, proposal_id={}", proposal_id);
    Ok(Json(CreateProposalResponse {
        proposal_id: created.proposal_id,
        status: ProposalStatus::Active,
        start_time: now.timestamp() as u64,
        end_time: end_time.timestamp() as u64,
        message: "Proposal created successfully. Voting is now open.".to_string(),
    }))
}

/// POST /v1/governance/vote
///
/// Submits a vote on a proposal (legacy flat route).
/// The proposal_id is expected in the request body.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn submit_vote(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<VoteRequest>,
) -> Result<Json<VoteResponse>, ApiError> {
    submit_vote_inner(state, req).await
}

/// POST /v1/governance/proposals/:id/vote
///
/// Submits a vote on a specific proposal (RESTful route).
/// The proposal_id is extracted from the URL path; if also present in
/// the body it is overridden by the path parameter.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn submit_vote_by_proposal_id(
    Extension(state): Extension<Arc<AppState>>,
    Path(proposal_id): Path<String>,
    Json(mut req): Json<VoteRequest>,
) -> Result<Json<VoteResponse>, ApiError> {
    // Path parameter takes precedence over body field
    req.proposal_id = proposal_id;
    submit_vote_inner(state, req).await
}

/// Shared vote submission logic used by both route variants.
async fn submit_vote_inner(
    state: Arc<AppState>,
    req: VoteRequest,
) -> Result<Json<VoteResponse>, ApiError> {
    tracing::info!("Governance: submit_vote started, proposal_id={}", req.proposal_id);
    let pool = state.pool();

    // Verify proposal exists
    let _proposal = GovernanceRepository::get_proposal_by_id(pool, &req.proposal_id).await?
        .ok_or_else(|| ApiError::NotFound(format!("Proposal {} not found", req.proposal_id)))?;

    // TODO: In production, extract voter address from auth/signature
    let voter = "0x0000000000000000000000000000000000000000";

    // Check for duplicate vote before attempting insert
    if let Some(_existing) = GovernanceRepository::get_vote_by_proposal_and_voter(pool, &req.proposal_id, voter).await? {
        tracing::warn!("Governance: duplicate vote detected, proposal_id={}, voter={}", req.proposal_id, voter);
        return Err(ApiError::AlreadyExists(
            format!("Vote already submitted for proposal {} by voter {}", req.proposal_id, voter),
        ));
    }

    let vote_id = format!("vote-{}", uuid::Uuid::new_v4());
    let support: i16 = match req.vote_type {
        VoteType::For => 1,
        VoteType::Against => 0,
        VoteType::Abstain => 2,
    };

    // L3 integration: get on-chain effective voting power (own + delegated)
    let voter_addr = voter.parse::<Address>().unwrap_or(Address::zero());
    let voting_power_u256 = state.l3_contracts.get_effective_voting_power(voter_addr).await
        .unwrap_or_else(|e| {
            tracing::warn!("L3: get_effective_voting_power failed, using default: {}", e);
            U256::from(1) // Dev mode fallback
        });
    let weight = bigdecimal::BigDecimal::from_str(&voting_power_u256.to_string())
        .unwrap_or_else(|_| bigdecimal::BigDecimal::from(1));
    tracing::info!("Governance: voter={} effective_voting_power={}", voter, voting_power_u256);

    let vote = match GovernanceRepository::create_vote(
        pool,
        &vote_id,
        &req.proposal_id,
        voter,
        support,
        &weight,
    ).await {
        Ok(v) => v,
        Err(e) => {
            // Check for unique constraint violation (duplicate vote)
            let err_str = format!("{}", e);
            if err_str.contains("duplicate key") || err_str.contains("unique constraint") || err_str.contains("already exists") {
                tracing::warn!("Governance: duplicate vote for proposal={} by voter={}", req.proposal_id, voter);
                return Err(ApiError::AlreadyExists(format!(
                    "Vote already submitted for proposal {} by voter {}",
                    req.proposal_id, voter
                )));
            }
            return Err(e);
        }
    };

    let now = chrono::Utc::now().timestamp() as u64;

    tracing::info!("Governance: submit_vote completed, vote_id={}", vote_id);
    Ok(Json(VoteResponse {
        vote_id: vote.vote_id,
        proposal_id: req.proposal_id,
        vote_type: req.vote_type,
        voting_power: vote.weight.to_string(),
        timestamp: now,
        message: "Vote recorded successfully.".to_string(),
    }))
}

/// GET /v1/governance/votes/:id
///
/// Returns details of a specific vote.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_vote(
    Extension(state): Extension<Arc<AppState>>,
    Path(vote_id): Path<String>,
) -> Result<Json<VoteDetailResponse>, ApiError> {
    tracing::info!("Governance: get_vote started, vote_id={}", vote_id);
    let pool = state.pool();

    let vote = GovernanceRepository::get_vote_by_id(pool, &vote_id).await?
        .ok_or_else(|| ApiError::NotFound(format!("Vote {} not found", vote_id)))?;

    let response = VoteDetailResponse {
        vote_id: vote.vote_id.clone(),
        proposal_id: vote.proposal_id.clone(),
        proposal_title: vote.proposal_title.clone(),
        voter: vote.voter.clone(),
        vote_type: map_vote_type(vote.support),
        voting_power: vote.weight.to_string(),
        timestamp: vote.voted_at.timestamp() as u64,
        reason: None, // No reason column in VoteRow
        tx_hash: vote.l1_tx_hash.clone().unwrap_or_default(),
    };

    tracing::info!("Governance: get_vote completed, vote_id={}", vote_id);
    Ok(Json(response))
}

/// GET /v1/governance/activity
///
/// Returns user's governance activity (votes, proposals, delegations).
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_activity(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ActivityResponse>, ApiError> {
    tracing::info!("Governance: get_activity started");
    let pool = state.pool();

    // NOTE: In production, voter would be extracted from auth context
    // For now, return all recent votes and proposals
    let all_votes = GovernanceRepository::list_all_votes(pool, 0, 20).await?;
    let votes: Vec<UserVote> = all_votes.iter().map(|v| {
        UserVote {
            proposal_id: v.proposal_id.clone(),
            proposal_title: v.proposal_title.clone(),
            vote_type: map_vote_type(v.support),
            voting_power: v.weight.to_string(),
            timestamp: v.voted_at.timestamp() as u64,
            proposal_status: ProposalStatus::Active, // Would need proposal lookup per vote
        }
    }).collect();

    let all_proposals = GovernanceRepository::list_proposals(pool, None, 0, 20).await?;
    let proposals: Vec<UserProposal> = all_proposals.iter().map(|p| {
        UserProposal {
            proposal_id: p.proposal_id.clone(),
            title: p.title.clone(),
            status: map_proposal_status(&p.status),
            created_at: p.created_at.timestamp() as u64,
            for_votes: p.votes_for.to_string(),
            against_votes: p.votes_against.to_string(),
        }
    }).collect();

    let total_votes = votes.len() as u32;
    let total_proposals = proposals.len() as u32;

    tracing::info!("Governance: get_activity completed, votes={}, proposals={}", total_votes, total_proposals);
    Ok(Json(ActivityResponse {
        votes,
        proposals,
        delegations_received: vec![], // Requires delegation table — not yet implemented
        total_votes,
        total_proposals,
    }))
}

/// GET /v1/governance/council
///
/// Returns Security Council information and history.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_council(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<CouncilResponse>, ApiError> {
    tracing::info!("Governance: get_council started");
    let pool = state.pool();

    let council_rows = GovernanceRepository::get_council_members(pool).await?;
    let total_members = council_rows.len() as u32;

    let members: Vec<CouncilMember> = council_rows.iter().map(|m| {
        CouncilMember {
            address: m.wallet_address.clone(),
            name: m.name.clone(),
            joined_at: m.joined_at.timestamp() as u64,
            actions_count: 0, // Requires council_actions count query
        }
    }).collect();

    // Default threshold: 5/9 multisig
    let threshold = if total_members > 0 { (total_members / 2) + 1 } else { 1 };

    tracing::info!("Governance: get_council completed, members={}", total_members);
    Ok(Json(CouncilResponse {
        members,
        threshold,
        total_members,
        emergency_actions: vec![], // Requires council_actions table query
        veto_history: vec![],     // Requires vetoed proposals query
    }))
}

/// GET /v1/governance/voting-power
///
/// Returns the current user's voting power breakdown.
/// In production, this queries on-chain veQS balance and delegation data.
/// BE-001: Real DB operation / BE-003: Mandatory logging
pub async fn get_voting_power(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<VotingPowerBreakdownResponse>, ApiError> {
    tracing::info!("Governance: get_voting_power started");

    // NOTE: In production, user address comes from JWT auth context.
    // For now, use zero address (dev mode returns non-zero defaults from L3Contracts).
    let user_addr = Address::zero();

    // L3 integration: query veQS contract for voting power
    let own_power = state.l3_contracts.get_voting_power(user_addr).await
        .unwrap_or_else(|e| {
            tracing::warn!("L3: get_voting_power failed: {}", e);
            U256::zero()
        });

    let effective_power = state.l3_contracts.get_effective_voting_power(user_addr).await
        .unwrap_or_else(|e| {
            tracing::warn!("L3: get_effective_voting_power failed: {}", e);
            U256::zero()
        });

    // Delegated power = effective - own
    let delegated_to_me = if effective_power > own_power {
        effective_power - own_power
    } else {
        U256::zero()
    };

    // Check delegate (if user delegated to someone else)
    let delegate = state.l3_contracts.get_delegate(user_addr).await
        .unwrap_or_else(|e| {
            tracing::warn!("L3: get_delegate failed: {}", e);
            user_addr // Self-delegation default
        });
    let i_delegated = if delegate != user_addr && delegate != Address::zero() {
        own_power.as_u128() as f64 / 1e18 // User delegated all their power
    } else {
        0.0
    };

    let response = VotingPowerBreakdownResponse {
        my_veqs: own_power.as_u128() as f64 / 1e18,
        delegated_to_me: delegated_to_me.as_u128() as f64 / 1e18,
        i_delegated,
        delegators: 0, // Requires delegation event indexing
        lock_expiry: "".to_string(), // Requires veQS lock position query
    };

    tracing::info!("Governance: get_voting_power completed, own={}, effective={}", own_power, effective_power);
    Ok(Json(response))
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_map_proposal_type() {
        assert_eq!(map_proposal_type(Some("parameter")), ProposalType::Parameter);
        assert_eq!(map_proposal_type(Some("treasury")), ProposalType::Treasury);
        assert_eq!(map_proposal_type(Some("upgrade")), ProposalType::Upgrade);
        assert_eq!(map_proposal_type(Some("signal")), ProposalType::Signal);
        assert_eq!(map_proposal_type(Some("emergency")), ProposalType::Emergency);
        assert_eq!(map_proposal_type(None), ProposalType::Parameter);
        assert_eq!(map_proposal_type(Some("unknown")), ProposalType::Parameter);
    }

    #[test]
    fn test_map_proposal_status() {
        assert_eq!(map_proposal_status("active"), ProposalStatus::Active);
        assert_eq!(map_proposal_status("passed"), ProposalStatus::Passed);
        assert_eq!(map_proposal_status("defeated"), ProposalStatus::Defeated);
        assert_eq!(map_proposal_status("pending"), ProposalStatus::Pending);
        assert_eq!(map_proposal_status("pending_execution"), ProposalStatus::Pending);
        assert_eq!(map_proposal_status("executed"), ProposalStatus::Executed);
        assert_eq!(map_proposal_status("cancelled"), ProposalStatus::Cancelled);
        assert_eq!(map_proposal_status("vetoed"), ProposalStatus::Vetoed);
        assert_eq!(map_proposal_status("unknown"), ProposalStatus::Pending);
    }

    #[test]
    fn test_map_vote_type() {
        assert_eq!(map_vote_type(1), VoteType::For);
        assert_eq!(map_vote_type(0), VoteType::Against);
        assert_eq!(map_vote_type(2), VoteType::Abstain);
        assert_eq!(map_vote_type(99), VoteType::Abstain);
    }

    #[test]
    fn test_proposal_status_serialization() {
        let json = serde_json::to_string(&ProposalStatus::Active).unwrap();
        assert_eq!(json, "\"active\"");
        let json = serde_json::to_string(&ProposalStatus::Vetoed).unwrap();
        assert_eq!(json, "\"vetoed\"");
    }

    #[test]
    fn test_vote_type_serialization() {
        let json = serde_json::to_string(&VoteType::For).unwrap();
        assert_eq!(json, "\"for\"");
        let json = serde_json::to_string(&VoteType::Against).unwrap();
        assert_eq!(json, "\"against\"");
    }

    #[test]
    fn test_proposal_type_serialization() {
        let json = serde_json::to_string(&ProposalType::Treasury).unwrap();
        assert_eq!(json, "\"treasury\"");
        let json = serde_json::to_string(&ProposalType::Emergency).unwrap();
        assert_eq!(json, "\"emergency\"");
    }

    #[test]
    fn test_vote_request_deserialization() {
        // Standard format
        let json = r#"{"proposalId":"QIP-001","voteType":"for","signature":"0x123"}"#;
        let req: VoteRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.proposal_id, "QIP-001");
        assert_eq!(req.vote_type, VoteType::For);

        // Frontend shorthand (alias "vote" → "voteType")
        let json = r#"{"proposalId":"QIP-002","vote":"against"}"#;
        let req: VoteRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.proposal_id, "QIP-002");
        assert_eq!(req.vote_type, VoteType::Against);
    }

    #[test]
    fn test_create_proposal_request_deserialization() {
        let json = r#"{
            "title": "Test Proposal",
            "description": "Short desc",
            "fullDescription": "Full description here",
            "type": "parameter",
            "votingDuration": 604800,
            "signature": "0xabc"
        }"#;
        let req: CreateProposalRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.title, "Test Proposal");
        assert_eq!(req.proposal_type, ProposalType::Parameter);
        assert_eq!(req.voting_duration, Some(604800));
    }

    #[test]
    fn test_voting_power_breakdown_response_serialization() {
        let resp = VotingPowerBreakdownResponse {
            my_veqs: 100.5,
            delegated_to_me: 50.0,
            i_delegated: 0.0,
            delegators: 3,
            lock_expiry: "2028-01-15".to_string(),
        };
        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("\"myVeqs\":100.5"));
        assert!(json.contains("\"delegatedToMe\":50.0"));
        assert!(json.contains("\"iDelegated\":0.0"));
        assert!(json.contains("\"delegators\":3"));
        assert!(json.contains("\"lockExpiry\":\"2028-01-15\""));
    }

    #[test]
    fn test_participation_rate_calculation() {
        // Simulate: 100 total voting power, 5 proposals, 20 total votes
        let total_voting_power = U256::from(100u64);
        let total_proposals = 5u32;
        let total_votes = 20u64;

        let participation_rate = if !total_voting_power.is_zero() && total_proposals > 0 {
            let avg_votes_per_proposal = total_votes as f64 / total_proposals as f64;
            let total_power_f64 = total_voting_power.as_u128() as f64;
            (avg_votes_per_proposal / total_power_f64 * 100.0).min(100.0)
        } else {
            0.0
        };

        // 20 votes / 5 proposals = 4 avg votes per proposal
        // 4 / 100 * 100 = 4.0%
        assert!((participation_rate - 4.0).abs() < 0.01);
    }

    #[test]
    fn test_participation_rate_zero_proposals() {
        let total_voting_power = U256::from(100u64);
        let total_proposals = 0u32;
        let total_votes = 0u64;

        let participation_rate = if !total_voting_power.is_zero() && total_proposals > 0 {
            let avg_votes_per_proposal = total_votes as f64 / total_proposals as f64;
            let total_power_f64 = total_voting_power.as_u128() as f64;
            (avg_votes_per_proposal / total_power_f64 * 100.0).min(100.0)
        } else {
            0.0
        };

        assert_eq!(participation_rate, 0.0);
    }
}
