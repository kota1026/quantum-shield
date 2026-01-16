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

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use serde::{Deserialize, Serialize};

use crate::{
    error::ApiError,
    services::AppState,
};

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
#[derive(Debug, Deserialize)]
pub struct VoteRequest {
    #[serde(rename = "proposalId")]
    pub proposal_id: String,
    #[serde(rename = "voteType")]
    pub vote_type: VoteType,
    /// Optional reason for vote
    pub reason: Option<String>,
    /// Voter's signature
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

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// GET /v1/governance/dashboard
///
/// Returns governance dashboard overview including voting power,
/// active proposals, and recent activity.
pub async fn get_dashboard(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<GovernanceDashboardResponse>, ApiError> {
    tracing::debug!("Governance: Getting dashboard");

    // Mock data - in production this would query blockchain and database
    let response = GovernanceDashboardResponse {
        voting_power: "125000000000000000000".to_string(), // 125 veQS
        ve_qs_balance: "100000000000000000000".to_string(), // 100 veQS
        delegated_power: "25000000000000000000".to_string(), // 25 veQS delegated
        active_proposals: 3,
        pending_votes: 2,
        recent_proposals: vec![
            ProposalSummary {
                id: "QIP-001".to_string(),
                title: "Increase Prover Rewards by 5%".to_string(),
                proposal_type: ProposalType::Parameter,
                status: ProposalStatus::Active,
                end_time: 1736899200, // Example timestamp
                for_votes: "45000000000000000000000".to_string(),
                against_votes: "12000000000000000000000".to_string(),
            },
            ProposalSummary {
                id: "QIP-002".to_string(),
                title: "Treasury Grant for Security Audit".to_string(),
                proposal_type: ProposalType::Treasury,
                status: ProposalStatus::Active,
                end_time: 1736985600,
                for_votes: "38000000000000000000000".to_string(),
                against_votes: "8000000000000000000000".to_string(),
            },
        ],
        stats: GovernanceStats {
            total_proposals: 15,
            total_votes: 1250,
            participation_rate: 62.5,
            average_turnout: 58.3,
        },
    };

    Ok(Json(response))
}

/// GET /v1/governance/proposals
///
/// Returns paginated list of governance proposals with filtering.
pub async fn list_proposals(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ProposalsListResponse>, ApiError> {
    tracing::debug!("Governance: Listing proposals");

    // Mock data
    let proposals = vec![
        ProposalListItem {
            id: "QIP-001".to_string(),
            title: "Increase Prover Rewards by 5%".to_string(),
            description: "This proposal aims to increase prover rewards to attract more node operators.".to_string(),
            proposal_type: ProposalType::Parameter,
            status: ProposalStatus::Active,
            proposer: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
            created_at: 1736294400,
            start_time: 1736294400,
            end_time: 1736899200,
            for_votes: "45000000000000000000000".to_string(),
            against_votes: "12000000000000000000000".to_string(),
            abstain_votes: "5000000000000000000000".to_string(),
            quorum: "50000000000000000000000".to_string(),
            quorum_reached: true,
        },
        ProposalListItem {
            id: "QIP-002".to_string(),
            title: "Treasury Grant for Security Audit".to_string(),
            description: "Allocate 100,000 QS for comprehensive security audit by Trail of Bits.".to_string(),
            proposal_type: ProposalType::Treasury,
            status: ProposalStatus::Active,
            proposer: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
            created_at: 1736380800,
            start_time: 1736380800,
            end_time: 1736985600,
            for_votes: "38000000000000000000000".to_string(),
            against_votes: "8000000000000000000000".to_string(),
            abstain_votes: "2000000000000000000000".to_string(),
            quorum: "50000000000000000000000".to_string(),
            quorum_reached: false,
        },
        ProposalListItem {
            id: "QIP-003".to_string(),
            title: "Add Support for Arbitrum".to_string(),
            description: "Expand Quantum Shield to support Arbitrum L2 for lower gas fees.".to_string(),
            proposal_type: ProposalType::Signal,
            status: ProposalStatus::Passed,
            proposer: "0x9876543210fedcba9876543210fedcba98765432".to_string(),
            created_at: 1735689600,
            start_time: 1735689600,
            end_time: 1736294400,
            for_votes: "72000000000000000000000".to_string(),
            against_votes: "15000000000000000000000".to_string(),
            abstain_votes: "8000000000000000000000".to_string(),
            quorum: "50000000000000000000000".to_string(),
            quorum_reached: true,
        },
    ];

    Ok(Json(ProposalsListResponse {
        proposals,
        total: 3,
        page: 1,
        page_size: 10,
    }))
}

/// GET /v1/governance/proposals/:id
///
/// Returns detailed information about a specific proposal.
pub async fn get_proposal(
    Extension(_state): Extension<Arc<AppState>>,
    Path(proposal_id): Path<String>,
) -> Result<Json<ProposalDetailResponse>, ApiError> {
    tracing::debug!("Governance: Getting proposal {}", proposal_id);

    // Mock data
    let response = ProposalDetailResponse {
        id: proposal_id.clone(),
        title: "Increase Prover Rewards by 5%".to_string(),
        description: "This proposal aims to increase prover rewards to attract more node operators.".to_string(),
        full_description: r#"## Summary
This proposal increases the base prover reward rate from 10% to 15% of transaction fees.

## Motivation
Current prover participation is below optimal levels. Increasing rewards will:
1. Attract more prover operators
2. Improve network decentralization
3. Reduce proof generation latency

## Specification
- Modify `PROVER_REWARD_RATE` in ProverRewards.sol from 1000 (10%) to 1500 (15%)
- Effective immediately upon execution

## Risk Analysis
- Treasury impact: ~$50,000/month additional rewards
- Expected ROI: 30% more provers within 3 months"#.to_string(),
        proposal_type: ProposalType::Parameter,
        status: ProposalStatus::Active,
        proposer: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
        proposer_ve_qs: "50000000000000000000000".to_string(),
        created_at: 1736294400,
        start_time: 1736294400,
        end_time: 1736899200,
        for_votes: "45000000000000000000000".to_string(),
        against_votes: "12000000000000000000000".to_string(),
        abstain_votes: "5000000000000000000000".to_string(),
        quorum: "50000000000000000000000".to_string(),
        quorum_reached: true,
        user_vote: None,
        user_voting_power: "125000000000000000000".to_string(),
        recent_votes: vec![
            VoteRecord {
                voter: "0xaaaa111122223333444455556666777788889999".to_string(),
                vote_type: VoteType::For,
                voting_power: "5000000000000000000000".to_string(),
                timestamp: 1736380800,
                reason: Some("Strong support for prover incentives".to_string()),
            },
            VoteRecord {
                voter: "0xbbbb111122223333444455556666777788889999".to_string(),
                vote_type: VoteType::Against,
                voting_power: "2000000000000000000000".to_string(),
                timestamp: 1736377200,
                reason: Some("Treasury impact too high".to_string()),
            },
        ],
        execution_params: Some(serde_json::json!({
            "contract": "ProverRewards",
            "method": "setRewardRate",
            "params": [1500]
        })),
    };

    Ok(Json(response))
}

/// POST /v1/governance/proposals
///
/// Creates a new governance proposal.
pub async fn create_proposal(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<CreateProposalRequest>,
) -> Result<Json<CreateProposalResponse>, ApiError> {
    tracing::info!("Governance: Creating proposal - {}", req.title);

    // In production: verify signature, check veQS balance, create on-chain

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let voting_duration = req.voting_duration.unwrap_or(604800); // Default 7 days

    Ok(Json(CreateProposalResponse {
        proposal_id: format!("QIP-{:03}", 4), // Next proposal ID
        status: ProposalStatus::Active,
        start_time: now,
        end_time: now + voting_duration,
        message: "Proposal created successfully. Voting is now open.".to_string(),
    }))
}

/// POST /v1/governance/vote
///
/// Submits a vote on a proposal.
pub async fn submit_vote(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<VoteRequest>,
) -> Result<Json<VoteResponse>, ApiError> {
    tracing::info!("Governance: Submitting vote on {}", req.proposal_id);

    // In production: verify signature, check voting power, record on-chain

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    Ok(Json(VoteResponse {
        vote_id: format!("vote-{}", now),
        proposal_id: req.proposal_id,
        vote_type: req.vote_type,
        voting_power: "125000000000000000000".to_string(),
        timestamp: now,
        message: "Vote recorded successfully.".to_string(),
    }))
}

/// GET /v1/governance/votes/:id
///
/// Returns details of a specific vote.
pub async fn get_vote(
    Extension(_state): Extension<Arc<AppState>>,
    Path(vote_id): Path<String>,
) -> Result<Json<VoteDetailResponse>, ApiError> {
    tracing::debug!("Governance: Getting vote {}", vote_id);

    // Mock data
    Ok(Json(VoteDetailResponse {
        vote_id: vote_id.clone(),
        proposal_id: "QIP-001".to_string(),
        proposal_title: "Increase Prover Rewards by 5%".to_string(),
        voter: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
        vote_type: VoteType::For,
        voting_power: "125000000000000000000".to_string(),
        timestamp: 1736380800,
        reason: Some("Support better prover incentives".to_string()),
        tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890".to_string(),
    }))
}

/// GET /v1/governance/activity
///
/// Returns user's governance activity (votes, proposals, delegations).
pub async fn get_activity(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ActivityResponse>, ApiError> {
    tracing::debug!("Governance: Getting user activity");

    // Mock data
    Ok(Json(ActivityResponse {
        votes: vec![
            UserVote {
                proposal_id: "QIP-001".to_string(),
                proposal_title: "Increase Prover Rewards by 5%".to_string(),
                vote_type: VoteType::For,
                voting_power: "125000000000000000000".to_string(),
                timestamp: 1736380800,
                proposal_status: ProposalStatus::Active,
            },
            UserVote {
                proposal_id: "QIP-003".to_string(),
                proposal_title: "Add Support for Arbitrum".to_string(),
                vote_type: VoteType::For,
                voting_power: "100000000000000000000".to_string(),
                timestamp: 1735776000,
                proposal_status: ProposalStatus::Passed,
            },
        ],
        proposals: vec![
            UserProposal {
                proposal_id: "QIP-002".to_string(),
                title: "Treasury Grant for Security Audit".to_string(),
                status: ProposalStatus::Active,
                created_at: 1736380800,
                for_votes: "38000000000000000000000".to_string(),
                against_votes: "8000000000000000000000".to_string(),
            },
        ],
        delegations_received: vec![
            DelegationInfo {
                delegator: "0xaaaa111122223333444455556666777788889999".to_string(),
                voting_power: "25000000000000000000".to_string(),
                delegated_at: 1736294400,
            },
        ],
        total_votes: 12,
        total_proposals: 1,
    }))
}

/// GET /v1/governance/council
///
/// Returns Security Council information and history.
pub async fn get_council(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<CouncilResponse>, ApiError> {
    tracing::debug!("Governance: Getting council info");

    // Mock data - 9-member Security Council with 5/9 threshold
    Ok(Json(CouncilResponse {
        members: vec![
            CouncilMember {
                address: "0x1111111111111111111111111111111111111111".to_string(),
                name: Some("Council Member 1".to_string()),
                joined_at: 1704067200,
                actions_count: 5,
            },
            CouncilMember {
                address: "0x2222222222222222222222222222222222222222".to_string(),
                name: Some("Council Member 2".to_string()),
                joined_at: 1704067200,
                actions_count: 3,
            },
            CouncilMember {
                address: "0x3333333333333333333333333333333333333333".to_string(),
                name: Some("Council Member 3".to_string()),
                joined_at: 1704067200,
                actions_count: 4,
            },
            CouncilMember {
                address: "0x4444444444444444444444444444444444444444".to_string(),
                name: None,
                joined_at: 1706745600,
                actions_count: 2,
            },
            CouncilMember {
                address: "0x5555555555555555555555555555555555555555".to_string(),
                name: None,
                joined_at: 1706745600,
                actions_count: 2,
            },
        ],
        threshold: 5,
        total_members: 9,
        emergency_actions: vec![
            EmergencyAction {
                id: "EA-001".to_string(),
                action_type: "pause".to_string(),
                description: "Emergency pause due to detected anomaly".to_string(),
                executed_at: 1735084800,
                signers: vec![
                    "0x1111111111111111111111111111111111111111".to_string(),
                    "0x2222222222222222222222222222222222222222".to_string(),
                    "0x3333333333333333333333333333333333333333".to_string(),
                    "0x4444444444444444444444444444444444444444".to_string(),
                    "0x5555555555555555555555555555555555555555".to_string(),
                ],
            },
        ],
        veto_history: vec![
            VetoRecord {
                proposal_id: "QIP-000".to_string(),
                proposal_title: "Malicious Parameter Change".to_string(),
                vetoed_at: 1733961600,
                reason: "Proposal attempted to bypass security controls".to_string(),
                signers: vec![
                    "0x1111111111111111111111111111111111111111".to_string(),
                    "0x2222222222222222222222222222222222222222".to_string(),
                    "0x3333333333333333333333333333333333333333".to_string(),
                    "0x4444444444444444444444444444444444444444".to_string(),
                    "0x5555555555555555555555555555555555555555".to_string(),
                ],
            },
        ],
    }))
}
