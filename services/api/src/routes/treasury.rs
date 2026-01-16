//! Treasury API implementation
//!
//! TASK-P5-029: Treasury API (6 EP)
//!
//! Provides endpoints for:
//! - Treasury dashboard and balance information
//! - Proposal management (create, approve, execute)
//! - Transaction history
//!
//! Spec References:
//! - UNIFIED_SPEC §Treasury
//! - L3 Contract: l3-aegis/src/treasury/Treasury.sol

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use serde::{Deserialize, Serialize};

use crate::{
    error::ApiError,
    services::AppState,
};

// ============================================================================
// Treasury Types
// ============================================================================

/// Treasury proposal state enum (matches ITreasury.sol)
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TreasuryProposalState {
    /// Initial state
    Pending,
    /// Has at least one approval
    Active,
    /// Has enough approvals to execute
    Approved,
    /// Rejected by signers
    Rejected,
    /// Successfully executed
    Executed,
    /// Time lock expired without execution
    Expired,
    /// Cancelled by proposer
    Cancelled,
}

/// Treasury spending category
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SpendingCategory {
    /// Development grants
    Development,
    /// Security audits and bug bounties
    Security,
    /// Infrastructure costs
    Infrastructure,
    /// Community initiatives
    Community,
    /// Legal and compliance
    Legal,
    /// Council/committee compensation
    Council,
    /// Other expenses
    Other,
}

// ============================================================================
// Request/Response Types
// ============================================================================

/// GET /v1/treasury/dashboard response
#[derive(Debug, Serialize)]
pub struct TreasuryDashboardResponse {
    /// Current treasury balance in wei
    pub balance: String,
    /// Balance in USD (approximate)
    #[serde(rename = "balanceUsd")]
    pub balance_usd: String,
    /// Minimum required balance (12 months operating cost)
    #[serde(rename = "minimumBalance")]
    pub minimum_balance: String,
    /// Available for spending (balance - minimum)
    #[serde(rename = "availableBalance")]
    pub available_balance: String,
    /// Maximum single spend limit
    #[serde(rename = "maxSingleSpend")]
    pub max_single_spend: String,
    /// Number of pending proposals
    #[serde(rename = "pendingProposals")]
    pub pending_proposals: u32,
    /// Number of approved proposals awaiting execution
    #[serde(rename = "approvedProposals")]
    pub approved_proposals: u32,
    /// Required approvals for current governance mode
    #[serde(rename = "requiredApprovals")]
    pub required_approvals: u32,
    /// Treasury statistics
    pub stats: TreasuryStats,
    /// Recent transactions
    #[serde(rename = "recentTransactions")]
    pub recent_transactions: Vec<TreasuryTransaction>,
    /// Multi-sig signers
    pub signers: Vec<SignerInfo>,
}

#[derive(Debug, Serialize)]
pub struct TreasuryStats {
    /// Total funds received all time
    #[serde(rename = "totalReceived")]
    pub total_received: String,
    /// Total funds spent all time
    #[serde(rename = "totalSpent")]
    pub total_spent: String,
    /// Number of executed proposals
    #[serde(rename = "executedProposals")]
    pub executed_proposals: u32,
    /// Monthly burn rate (30-day average)
    #[serde(rename = "monthlyBurnRate")]
    pub monthly_burn_rate: String,
    /// Spending by category
    #[serde(rename = "spendingByCategory")]
    pub spending_by_category: Vec<CategorySpending>,
}

#[derive(Debug, Serialize)]
pub struct CategorySpending {
    pub category: SpendingCategory,
    pub amount: String,
    pub percentage: f64,
}

#[derive(Debug, Serialize)]
pub struct TreasuryTransaction {
    #[serde(rename = "txHash")]
    pub tx_hash: String,
    #[serde(rename = "type")]
    pub tx_type: String,
    pub amount: String,
    pub timestamp: u64,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct SignerInfo {
    pub address: String,
    pub name: Option<String>,
    #[serde(rename = "isActive")]
    pub is_active: bool,
}

/// GET /v1/treasury/proposals response
#[derive(Debug, Serialize)]
pub struct TreasuryProposalsListResponse {
    pub proposals: Vec<TreasuryProposalListItem>,
    pub total: u32,
    pub page: u32,
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct TreasuryProposalListItem {
    pub id: u64,
    pub proposer: String,
    pub target: String,
    pub amount: String,
    pub description: String,
    pub category: SpendingCategory,
    pub state: TreasuryProposalState,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "executionTime")]
    pub execution_time: u64,
    pub approvals: u32,
    #[serde(rename = "requiredApprovals")]
    pub required_approvals: u32,
}

/// GET /v1/treasury/proposals/:id response
#[derive(Debug, Serialize)]
pub struct TreasuryProposalDetailResponse {
    pub id: u64,
    pub proposer: String,
    #[serde(rename = "proposerName")]
    pub proposer_name: Option<String>,
    pub target: String,
    #[serde(rename = "targetName")]
    pub target_name: Option<String>,
    pub amount: String,
    #[serde(rename = "amountUsd")]
    pub amount_usd: String,
    pub description: String,
    #[serde(rename = "fullDescription")]
    pub full_description: String,
    pub category: SpendingCategory,
    pub state: TreasuryProposalState,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "executionTime")]
    pub execution_time: u64,
    pub approvals: u32,
    #[serde(rename = "requiredApprovals")]
    pub required_approvals: u32,
    /// List of signers who approved
    #[serde(rename = "approvedBy")]
    pub approved_by: Vec<ApprovalInfo>,
    /// Call data for execution (if any)
    #[serde(rename = "callData")]
    pub call_data: Option<String>,
    /// User has approved this proposal
    #[serde(rename = "userHasApproved")]
    pub user_has_approved: bool,
    /// User is a signer
    #[serde(rename = "userIsSigner")]
    pub user_is_signer: bool,
}

#[derive(Debug, Serialize)]
pub struct ApprovalInfo {
    pub signer: String,
    pub name: Option<String>,
    #[serde(rename = "approvedAt")]
    pub approved_at: u64,
}

/// POST /v1/treasury/proposals request
#[derive(Debug, Deserialize)]
pub struct CreateTreasuryProposalRequest {
    /// Target address to receive funds
    pub target: String,
    /// Amount in wei
    pub amount: String,
    /// Short description
    pub description: String,
    /// Full description (markdown supported)
    #[serde(rename = "fullDescription")]
    pub full_description: Option<String>,
    /// Spending category
    pub category: SpendingCategory,
    /// Optional call data for contract interaction
    #[serde(rename = "callData")]
    pub call_data: Option<String>,
    /// Proposer's signature
    pub signature: String,
}

/// POST /v1/treasury/proposals response
#[derive(Debug, Serialize)]
pub struct CreateTreasuryProposalResponse {
    #[serde(rename = "proposalId")]
    pub proposal_id: u64,
    pub state: TreasuryProposalState,
    #[serde(rename = "executionTime")]
    pub execution_time: u64,
    pub message: String,
}

/// POST /v1/treasury/proposals/:id/approve request
#[derive(Debug, Deserialize)]
pub struct ApproveTreasuryProposalRequest {
    /// Signer's signature
    pub signature: String,
}

/// POST /v1/treasury/proposals/:id/approve response
#[derive(Debug, Serialize)]
pub struct ApproveTreasuryProposalResponse {
    #[serde(rename = "proposalId")]
    pub proposal_id: u64,
    pub approvals: u32,
    #[serde(rename = "requiredApprovals")]
    pub required_approvals: u32,
    #[serde(rename = "newState")]
    pub new_state: TreasuryProposalState,
    pub message: String,
}

/// POST /v1/treasury/proposals/:id/execute request
#[derive(Debug, Deserialize)]
pub struct ExecuteTreasuryProposalRequest {
    /// Executor's signature
    pub signature: String,
}

/// POST /v1/treasury/proposals/:id/execute response
#[derive(Debug, Serialize)]
pub struct ExecuteTreasuryProposalResponse {
    #[serde(rename = "proposalId")]
    pub proposal_id: u64,
    #[serde(rename = "txHash")]
    pub tx_hash: String,
    pub amount: String,
    pub target: String,
    pub message: String,
}

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// GET /v1/treasury/dashboard
///
/// Returns treasury dashboard overview including balance, statistics,
/// and recent transactions.
pub async fn get_dashboard(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<TreasuryDashboardResponse>, ApiError> {
    tracing::debug!("Treasury: Getting dashboard");

    // Mock data - in production this would query the L3 Treasury contract
    let response = TreasuryDashboardResponse {
        balance: "1500000000000000000000000".to_string(), // 1.5M ETH (mock)
        balance_usd: "3750000".to_string(), // $3.75M at $2500/ETH
        minimum_balance: "500000000000000000000000".to_string(), // 500K ETH
        available_balance: "1000000000000000000000000".to_string(), // 1M ETH
        max_single_spend: "100000000000000000000000".to_string(), // $100K
        pending_proposals: 2,
        approved_proposals: 1,
        required_approvals: 3, // 3/5 multi-sig
        stats: TreasuryStats {
            total_received: "2500000000000000000000000".to_string(),
            total_spent: "1000000000000000000000000".to_string(),
            executed_proposals: 45,
            monthly_burn_rate: "75000000000000000000000".to_string(), // 75K ETH/month
            spending_by_category: vec![
                CategorySpending {
                    category: SpendingCategory::Development,
                    amount: "400000000000000000000000".to_string(),
                    percentage: 40.0,
                },
                CategorySpending {
                    category: SpendingCategory::Security,
                    amount: "250000000000000000000000".to_string(),
                    percentage: 25.0,
                },
                CategorySpending {
                    category: SpendingCategory::Infrastructure,
                    amount: "150000000000000000000000".to_string(),
                    percentage: 15.0,
                },
                CategorySpending {
                    category: SpendingCategory::Community,
                    amount: "100000000000000000000000".to_string(),
                    percentage: 10.0,
                },
                CategorySpending {
                    category: SpendingCategory::Council,
                    amount: "50000000000000000000000".to_string(),
                    percentage: 5.0,
                },
                CategorySpending {
                    category: SpendingCategory::Legal,
                    amount: "50000000000000000000000".to_string(),
                    percentage: 5.0,
                },
            ],
        },
        recent_transactions: vec![
            TreasuryTransaction {
                tx_hash: "0xabc123...".to_string(),
                tx_type: "fee_income".to_string(),
                amount: "50000000000000000000".to_string(),
                timestamp: 1736380800,
                description: "Protocol fee distribution".to_string(),
            },
            TreasuryTransaction {
                tx_hash: "0xdef456...".to_string(),
                tx_type: "spending".to_string(),
                amount: "25000000000000000000000".to_string(),
                timestamp: 1736294400,
                description: "Security audit payment".to_string(),
            },
        ],
        signers: vec![
            SignerInfo {
                address: "0x1111111111111111111111111111111111111111".to_string(),
                name: Some("Foundation Signer 1".to_string()),
                is_active: true,
            },
            SignerInfo {
                address: "0x2222222222222222222222222222222222222222".to_string(),
                name: Some("Foundation Signer 2".to_string()),
                is_active: true,
            },
            SignerInfo {
                address: "0x3333333333333333333333333333333333333333".to_string(),
                name: Some("Foundation Signer 3".to_string()),
                is_active: true,
            },
            SignerInfo {
                address: "0x4444444444444444444444444444444444444444".to_string(),
                name: Some("External Signer 1".to_string()),
                is_active: true,
            },
            SignerInfo {
                address: "0x5555555555555555555555555555555555555555".to_string(),
                name: Some("External Signer 2".to_string()),
                is_active: true,
            },
        ],
    };

    Ok(Json(response))
}

/// GET /v1/treasury/proposals
///
/// Returns paginated list of treasury proposals.
pub async fn list_proposals(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<TreasuryProposalsListResponse>, ApiError> {
    tracing::debug!("Treasury: Listing proposals");

    // Mock data
    let proposals = vec![
        TreasuryProposalListItem {
            id: 1,
            proposer: "0x1111111111111111111111111111111111111111".to_string(),
            target: "0xaaaa111111111111111111111111111111111111".to_string(),
            amount: "50000000000000000000000".to_string(), // 50K
            description: "Security audit by Trail of Bits".to_string(),
            category: SpendingCategory::Security,
            state: TreasuryProposalState::Approved,
            created_at: 1736294400,
            execution_time: 1736899200, // 7 days later
            approvals: 3,
            required_approvals: 3,
        },
        TreasuryProposalListItem {
            id: 2,
            proposer: "0x2222222222222222222222222222222222222222".to_string(),
            target: "0xbbbb222222222222222222222222222222222222".to_string(),
            amount: "25000000000000000000000".to_string(), // 25K
            description: "Developer grant for SDK improvements".to_string(),
            category: SpendingCategory::Development,
            state: TreasuryProposalState::Active,
            created_at: 1736380800,
            execution_time: 1736985600,
            approvals: 2,
            required_approvals: 3,
        },
        TreasuryProposalListItem {
            id: 3,
            proposer: "0x3333333333333333333333333333333333333333".to_string(),
            target: "0xcccc333333333333333333333333333333333333".to_string(),
            amount: "10000000000000000000000".to_string(), // 10K
            description: "Community event sponsorship".to_string(),
            category: SpendingCategory::Community,
            state: TreasuryProposalState::Pending,
            created_at: 1736467200,
            execution_time: 1737072000,
            approvals: 1,
            required_approvals: 3,
        },
    ];

    Ok(Json(TreasuryProposalsListResponse {
        proposals,
        total: 3,
        page: 1,
        page_size: 10,
    }))
}

/// GET /v1/treasury/proposals/:id
///
/// Returns detailed information about a specific treasury proposal.
pub async fn get_proposal(
    Extension(_state): Extension<Arc<AppState>>,
    Path(proposal_id): Path<u64>,
) -> Result<Json<TreasuryProposalDetailResponse>, ApiError> {
    tracing::debug!("Treasury: Getting proposal {}", proposal_id);

    // Mock data
    let response = TreasuryProposalDetailResponse {
        id: proposal_id,
        proposer: "0x1111111111111111111111111111111111111111".to_string(),
        proposer_name: Some("Foundation Signer 1".to_string()),
        target: "0xaaaa111111111111111111111111111111111111".to_string(),
        target_name: Some("Trail of Bits".to_string()),
        amount: "50000000000000000000000".to_string(),
        amount_usd: "125000".to_string(), // $125K at $2500/ETH
        description: "Security audit by Trail of Bits".to_string(),
        full_description: r#"## Summary
Comprehensive security audit of all smart contracts by Trail of Bits.

## Scope
- L1 contracts (L1Vault, STARKVerifier, ProverRegistry)
- L3 contracts (Treasury, InsuranceFund, Governance)
- Total: ~5,000 lines of Solidity

## Timeline
- Audit start: Week after execution
- Duration: 4 weeks
- Final report: 6 weeks from start

## Cost Breakdown
- Base audit fee: $100,000
- Additional review: $25,000
- Total: $125,000"#.to_string(),
        category: SpendingCategory::Security,
        state: TreasuryProposalState::Approved,
        created_at: 1736294400,
        execution_time: 1736899200,
        approvals: 3,
        required_approvals: 3,
        approved_by: vec![
            ApprovalInfo {
                signer: "0x1111111111111111111111111111111111111111".to_string(),
                name: Some("Foundation Signer 1".to_string()),
                approved_at: 1736294400,
            },
            ApprovalInfo {
                signer: "0x2222222222222222222222222222222222222222".to_string(),
                name: Some("Foundation Signer 2".to_string()),
                approved_at: 1736380800,
            },
            ApprovalInfo {
                signer: "0x4444444444444444444444444444444444444444".to_string(),
                name: Some("External Signer 1".to_string()),
                approved_at: 1736467200,
            },
        ],
        call_data: None,
        user_has_approved: false,
        user_is_signer: false,
    };

    Ok(Json(response))
}

/// POST /v1/treasury/proposals
///
/// Creates a new treasury spending proposal.
pub async fn create_proposal(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<CreateTreasuryProposalRequest>,
) -> Result<Json<CreateTreasuryProposalResponse>, ApiError> {
    tracing::info!("Treasury: Creating proposal - {} to {}", req.amount, req.target);

    // In production: verify signature, check signer status, create on L3 Treasury contract

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Time lock period: 7 days
    let execution_time = now + (7 * 24 * 60 * 60);

    Ok(Json(CreateTreasuryProposalResponse {
        proposal_id: 4, // Next proposal ID
        state: TreasuryProposalState::Pending,
        execution_time,
        message: "Treasury proposal created. Awaiting signer approvals.".to_string(),
    }))
}

/// POST /v1/treasury/proposals/:id/approve
///
/// Approves a treasury proposal (signer only).
pub async fn approve_proposal(
    Extension(_state): Extension<Arc<AppState>>,
    Path(proposal_id): Path<u64>,
    Json(_req): Json<ApproveTreasuryProposalRequest>,
) -> Result<Json<ApproveTreasuryProposalResponse>, ApiError> {
    tracing::info!("Treasury: Approving proposal {}", proposal_id);

    // In production: verify signature, check signer status, call Treasury.approve()

    Ok(Json(ApproveTreasuryProposalResponse {
        proposal_id,
        approvals: 3,
        required_approvals: 3,
        new_state: TreasuryProposalState::Approved,
        message: "Proposal approved. Required approvals reached.".to_string(),
    }))
}

/// POST /v1/treasury/proposals/:id/execute
///
/// Executes an approved treasury proposal after time lock.
pub async fn execute_proposal(
    Extension(_state): Extension<Arc<AppState>>,
    Path(proposal_id): Path<u64>,
    Json(_req): Json<ExecuteTreasuryProposalRequest>,
) -> Result<Json<ExecuteTreasuryProposalResponse>, ApiError> {
    tracing::info!("Treasury: Executing proposal {}", proposal_id);

    // In production: verify signature, check time lock, call Treasury.execute()

    Ok(Json(ExecuteTreasuryProposalResponse {
        proposal_id,
        tx_hash: "0xexec123456789abcdef123456789abcdef123456789abcdef123456789abcdef12".to_string(),
        amount: "50000000000000000000000".to_string(),
        target: "0xaaaa111111111111111111111111111111111111".to_string(),
        message: "Proposal executed successfully. Funds transferred.".to_string(),
    }))
}
