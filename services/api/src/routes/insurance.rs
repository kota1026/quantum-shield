//! Insurance Fund API implementation
//!
//! TASK-P5-029: Insurance Fund API (4 EP)
//!
//! Provides endpoints for:
//! - Insurance fund dashboard and balance
//! - Claims management
//! - Transaction history
//!
//! Spec References:
//! - UNIFIED_SPEC §手数料配分 (Insurance: 10%)
//! - L3 Contract: l3-aegis/src/treasury/InsuranceFund.sol

use std::sync::Arc;

use axum::{Extension, Json};
use serde::{Deserialize, Serialize};

use crate::{
    error::ApiError,
    services::AppState,
};

// ============================================================================
// Insurance Fund Types
// ============================================================================

/// Insurance claim status
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ClaimStatus {
    /// Claim is pending review
    Pending,
    /// Claim is under investigation
    UnderReview,
    /// Claim has been approved
    Approved,
    /// Claim has been rejected
    Rejected,
    /// Claim has been paid out
    Paid,
    /// Claim was cancelled
    Cancelled,
}

/// Insurance claim type
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ClaimType {
    /// Slashing loss compensation
    SlashingLoss,
    /// Protocol bug exploitation
    ProtocolBug,
    /// Oracle manipulation
    OracleManipulation,
    /// Bridge failure
    BridgeFailure,
    /// Other incident
    Other,
}

// ============================================================================
// Request/Response Types
// ============================================================================

/// GET /v1/insurance/dashboard response
#[derive(Debug, Serialize)]
pub struct InsuranceDashboardResponse {
    /// Current insurance fund balance in wei
    pub balance: String,
    /// Balance in USD (approximate)
    #[serde(rename = "balanceUsd")]
    pub balance_usd: String,
    /// Total claims paid out
    #[serde(rename = "totalClaimsPaid")]
    pub total_claims_paid: String,
    /// Pending claims count
    #[serde(rename = "pendingClaims")]
    pub pending_claims: u32,
    /// Fund health (balance / total locked value)
    #[serde(rename = "fundHealthRatio")]
    pub fund_health_ratio: f64,
    /// Insurance statistics
    pub stats: InsuranceStats,
    /// Recent claims
    #[serde(rename = "recentClaims")]
    pub recent_claims: Vec<ClaimSummary>,
    /// Recent fund transactions
    #[serde(rename = "recentTransactions")]
    pub recent_transactions: Vec<InsuranceTransaction>,
}

#[derive(Debug, Serialize)]
pub struct InsuranceStats {
    /// Total funds received (10% of fees + slashing proceeds)
    #[serde(rename = "totalReceived")]
    pub total_received: String,
    /// Number of approved claims
    #[serde(rename = "approvedClaims")]
    pub approved_claims: u32,
    /// Number of rejected claims
    #[serde(rename = "rejectedClaims")]
    pub rejected_claims: u32,
    /// Average claim processing time (hours)
    #[serde(rename = "avgProcessingTime")]
    pub avg_processing_time: u32,
    /// Claims by type
    #[serde(rename = "claimsByType")]
    pub claims_by_type: Vec<ClaimsByType>,
}

#[derive(Debug, Serialize)]
pub struct ClaimsByType {
    #[serde(rename = "type")]
    pub claim_type: ClaimType,
    pub count: u32,
    #[serde(rename = "totalAmount")]
    pub total_amount: String,
}

#[derive(Debug, Serialize)]
pub struct ClaimSummary {
    pub id: String,
    pub claimant: String,
    #[serde(rename = "type")]
    pub claim_type: ClaimType,
    pub amount: String,
    pub status: ClaimStatus,
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
}

#[derive(Debug, Serialize)]
pub struct InsuranceTransaction {
    #[serde(rename = "txHash")]
    pub tx_hash: String,
    #[serde(rename = "type")]
    pub tx_type: String,
    pub amount: String,
    pub timestamp: u64,
    pub description: String,
}

/// GET /v1/insurance/claims response
#[derive(Debug, Serialize)]
pub struct ClaimsListResponse {
    pub claims: Vec<ClaimListItem>,
    pub total: u32,
    pub page: u32,
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct ClaimListItem {
    pub id: String,
    pub claimant: String,
    #[serde(rename = "type")]
    pub claim_type: ClaimType,
    pub amount: String,
    #[serde(rename = "amountUsd")]
    pub amount_usd: String,
    pub status: ClaimStatus,
    pub description: String,
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
    #[serde(rename = "processedAt")]
    pub processed_at: Option<u64>,
    #[serde(rename = "incidentTxHash")]
    pub incident_tx_hash: Option<String>,
}

/// POST /v1/insurance/claims request
#[derive(Debug, Deserialize)]
pub struct SubmitClaimRequest {
    /// Type of incident
    #[serde(rename = "type")]
    pub claim_type: ClaimType,
    /// Claimed amount in wei
    pub amount: String,
    /// Short description
    pub description: String,
    /// Detailed description with evidence
    #[serde(rename = "detailedDescription")]
    pub detailed_description: String,
    /// Transaction hash of the incident
    #[serde(rename = "incidentTxHash")]
    pub incident_tx_hash: String,
    /// Lock ID affected (if applicable)
    #[serde(rename = "lockId")]
    pub lock_id: Option<String>,
    /// Supporting evidence URLs
    pub evidence: Option<Vec<String>>,
    /// Claimant's signature
    pub signature: String,
}

/// POST /v1/insurance/claims response
#[derive(Debug, Serialize)]
pub struct SubmitClaimResponse {
    #[serde(rename = "claimId")]
    pub claim_id: String,
    pub status: ClaimStatus,
    #[serde(rename = "estimatedProcessingTime")]
    pub estimated_processing_time: String,
    pub message: String,
}

/// GET /v1/insurance/transactions response
#[derive(Debug, Serialize)]
pub struct InsuranceTransactionsResponse {
    pub transactions: Vec<InsuranceTransactionDetail>,
    pub total: u32,
    pub page: u32,
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct InsuranceTransactionDetail {
    #[serde(rename = "txHash")]
    pub tx_hash: String,
    #[serde(rename = "type")]
    pub tx_type: InsuranceTransactionType,
    pub amount: String,
    #[serde(rename = "amountUsd")]
    pub amount_usd: String,
    pub timestamp: u64,
    pub description: String,
    /// Related claim ID (for payouts)
    #[serde(rename = "claimId")]
    pub claim_id: Option<String>,
    /// Source of funds (for income)
    pub source: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum InsuranceTransactionType {
    /// Fee income (10% of protocol fees)
    FeeIncome,
    /// Slashing proceeds (20% of slashed amounts)
    SlashingIncome,
    /// Claim payout
    ClaimPayout,
    /// Emergency withdrawal
    EmergencyWithdrawal,
}

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// GET /v1/insurance/dashboard
///
/// Returns insurance fund dashboard overview including balance,
/// statistics, and recent activity.
pub async fn get_dashboard(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<InsuranceDashboardResponse>, ApiError> {
    tracing::debug!("Insurance: Getting dashboard");

    // Mock data - in production this would query the L3 InsuranceFund contract
    let response = InsuranceDashboardResponse {
        balance: "150000000000000000000000".to_string(), // 150K ETH (mock)
        balance_usd: "375000".to_string(), // $375K at $2500/ETH
        total_claims_paid: "25000000000000000000000".to_string(), // 25K ETH
        pending_claims: 3,
        fund_health_ratio: 0.015, // 1.5% of TVL
        stats: InsuranceStats {
            total_received: "200000000000000000000000".to_string(),
            approved_claims: 12,
            rejected_claims: 5,
            avg_processing_time: 72, // 72 hours
            claims_by_type: vec![
                ClaimsByType {
                    claim_type: ClaimType::SlashingLoss,
                    count: 8,
                    total_amount: "15000000000000000000000".to_string(),
                },
                ClaimsByType {
                    claim_type: ClaimType::ProtocolBug,
                    count: 2,
                    total_amount: "8000000000000000000000".to_string(),
                },
                ClaimsByType {
                    claim_type: ClaimType::OracleManipulation,
                    count: 1,
                    total_amount: "1500000000000000000000".to_string(),
                },
                ClaimsByType {
                    claim_type: ClaimType::Other,
                    count: 1,
                    total_amount: "500000000000000000000".to_string(),
                },
            ],
        },
        recent_claims: vec![
            ClaimSummary {
                id: "CLM-001".to_string(),
                claimant: "0xaaaa111111111111111111111111111111111111".to_string(),
                claim_type: ClaimType::SlashingLoss,
                amount: "2500000000000000000000".to_string(),
                status: ClaimStatus::Pending,
                submitted_at: 1736467200,
            },
            ClaimSummary {
                id: "CLM-002".to_string(),
                claimant: "0xbbbb222222222222222222222222222222222222".to_string(),
                claim_type: ClaimType::ProtocolBug,
                amount: "5000000000000000000000".to_string(),
                status: ClaimStatus::UnderReview,
                submitted_at: 1736380800,
            },
        ],
        recent_transactions: vec![
            InsuranceTransaction {
                tx_hash: "0xins123...".to_string(),
                tx_type: "fee_income".to_string(),
                amount: "5000000000000000000".to_string(),
                timestamp: 1736380800,
                description: "10% fee allocation".to_string(),
            },
            InsuranceTransaction {
                tx_hash: "0xins456...".to_string(),
                tx_type: "slashing_income".to_string(),
                amount: "10000000000000000000".to_string(),
                timestamp: 1736294400,
                description: "20% of prover slashing".to_string(),
            },
        ],
    };

    Ok(Json(response))
}

/// GET /v1/insurance/claims
///
/// Returns paginated list of insurance claims.
pub async fn list_claims(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ClaimsListResponse>, ApiError> {
    tracing::debug!("Insurance: Listing claims");

    // Mock data
    let claims = vec![
        ClaimListItem {
            id: "CLM-001".to_string(),
            claimant: "0xaaaa111111111111111111111111111111111111".to_string(),
            claim_type: ClaimType::SlashingLoss,
            amount: "2500000000000000000000".to_string(),
            amount_usd: "6250".to_string(),
            status: ClaimStatus::Pending,
            description: "Lost funds due to false challenge slashing".to_string(),
            submitted_at: 1736467200,
            processed_at: None,
            incident_tx_hash: Some("0xslash123...".to_string()),
        },
        ClaimListItem {
            id: "CLM-002".to_string(),
            claimant: "0xbbbb222222222222222222222222222222222222".to_string(),
            claim_type: ClaimType::ProtocolBug,
            amount: "5000000000000000000000".to_string(),
            amount_usd: "12500".to_string(),
            status: ClaimStatus::UnderReview,
            description: "Funds stuck due to contract bug in unlock flow".to_string(),
            submitted_at: 1736380800,
            processed_at: None,
            incident_tx_hash: Some("0xbug456...".to_string()),
        },
        ClaimListItem {
            id: "CLM-003".to_string(),
            claimant: "0xcccc333333333333333333333333333333333333".to_string(),
            claim_type: ClaimType::SlashingLoss,
            amount: "1000000000000000000000".to_string(),
            amount_usd: "2500".to_string(),
            status: ClaimStatus::Approved,
            description: "Partial compensation for wrongful slashing".to_string(),
            submitted_at: 1736294400,
            processed_at: Some(1736380800),
            incident_tx_hash: Some("0xslash789...".to_string()),
        },
        ClaimListItem {
            id: "CLM-004".to_string(),
            claimant: "0xdddd444444444444444444444444444444444444".to_string(),
            claim_type: ClaimType::OracleManipulation,
            amount: "3000000000000000000000".to_string(),
            amount_usd: "7500".to_string(),
            status: ClaimStatus::Paid,
            description: "Loss due to VRF oracle manipulation".to_string(),
            submitted_at: 1736208000,
            processed_at: Some(1736294400),
            incident_tx_hash: Some("0xoracle...".to_string()),
        },
    ];

    Ok(Json(ClaimsListResponse {
        claims,
        total: 4,
        page: 1,
        page_size: 10,
    }))
}

/// POST /v1/insurance/claims
///
/// Submits a new insurance claim.
pub async fn submit_claim(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<SubmitClaimRequest>,
) -> Result<Json<SubmitClaimResponse>, ApiError> {
    tracing::info!("Insurance: Submitting claim for {} wei", req.amount);

    // In production: verify signature, validate incident, create claim record

    Ok(Json(SubmitClaimResponse {
        claim_id: "CLM-005".to_string(),
        status: ClaimStatus::Pending,
        estimated_processing_time: "48-72 hours".to_string(),
        message: "Claim submitted successfully. Our team will review your claim shortly.".to_string(),
    }))
}

/// GET /v1/insurance/transactions
///
/// Returns paginated list of insurance fund transactions.
pub async fn list_transactions(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<InsuranceTransactionsResponse>, ApiError> {
    tracing::debug!("Insurance: Listing transactions");

    // Mock data
    let transactions = vec![
        InsuranceTransactionDetail {
            tx_hash: "0xins001...".to_string(),
            tx_type: InsuranceTransactionType::FeeIncome,
            amount: "5000000000000000000".to_string(),
            amount_usd: "12.50".to_string(),
            timestamp: 1736467200,
            description: "10% protocol fee allocation".to_string(),
            claim_id: None,
            source: Some("Protocol Fees".to_string()),
        },
        InsuranceTransactionDetail {
            tx_hash: "0xins002...".to_string(),
            tx_type: InsuranceTransactionType::SlashingIncome,
            amount: "10000000000000000000".to_string(),
            amount_usd: "25.00".to_string(),
            timestamp: 1736380800,
            description: "20% of prover slashing proceeds".to_string(),
            claim_id: None,
            source: Some("Slashing".to_string()),
        },
        InsuranceTransactionDetail {
            tx_hash: "0xins003...".to_string(),
            tx_type: InsuranceTransactionType::ClaimPayout,
            amount: "1000000000000000000000".to_string(),
            amount_usd: "2500.00".to_string(),
            timestamp: 1736294400,
            description: "Claim payout for wrongful slashing".to_string(),
            claim_id: Some("CLM-003".to_string()),
            source: None,
        },
        InsuranceTransactionDetail {
            tx_hash: "0xins004...".to_string(),
            tx_type: InsuranceTransactionType::ClaimPayout,
            amount: "3000000000000000000000".to_string(),
            amount_usd: "7500.00".to_string(),
            timestamp: 1736208000,
            description: "Claim payout for oracle manipulation loss".to_string(),
            claim_id: Some("CLM-004".to_string()),
            source: None,
        },
    ];

    Ok(Json(InsuranceTransactionsResponse {
        transactions,
        total: 4,
        page: 1,
        page_size: 10,
    }))
}
