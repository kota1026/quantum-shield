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

use bigdecimal::BigDecimal;
use uuid::Uuid;

use crate::{
    db::InsuranceRepository,
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
// Helper Functions
// ============================================================================

fn map_claim_type(ct: &str) -> ClaimType {
    match ct {
        "slashing_loss" => ClaimType::SlashingLoss,
        "protocol_bug" => ClaimType::ProtocolBug,
        "oracle_manipulation" => ClaimType::OracleManipulation,
        "bridge_failure" => ClaimType::BridgeFailure,
        _ => ClaimType::Other,
    }
}

fn map_claim_status(s: &str) -> ClaimStatus {
    match s {
        "pending" => ClaimStatus::Pending,
        "under_review" => ClaimStatus::UnderReview,
        "approved" => ClaimStatus::Approved,
        "rejected" => ClaimStatus::Rejected,
        "paid" => ClaimStatus::Paid,
        "cancelled" => ClaimStatus::Cancelled,
        _ => ClaimStatus::Pending,
    }
}

fn map_claim_type_to_str(ct: &ClaimType) -> &'static str {
    match ct {
        ClaimType::SlashingLoss => "slashing_loss",
        ClaimType::ProtocolBug => "protocol_bug",
        ClaimType::OracleManipulation => "oracle_manipulation",
        ClaimType::BridgeFailure => "bridge_failure",
        ClaimType::Other => "other",
    }
}

fn map_tx_type(t: &str) -> InsuranceTransactionType {
    match t {
        "fee_income" => InsuranceTransactionType::FeeIncome,
        "slashing_income" => InsuranceTransactionType::SlashingIncome,
        "claim_payout" => InsuranceTransactionType::ClaimPayout,
        "emergency_withdrawal" => InsuranceTransactionType::EmergencyWithdrawal,
        _ => InsuranceTransactionType::FeeIncome,
    }
}

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// GET /v1/insurance/dashboard
///
/// Returns insurance fund dashboard overview including balance,
/// statistics, and recent activity.
pub async fn get_dashboard(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<InsuranceDashboardResponse>, ApiError> {
    tracing::info!("Insurance: Getting dashboard");
    let pool = state.pool();

    // Get fund summary
    let fund = InsuranceRepository::get_fund(pool).await?;
    let (balance, total_received, total_claims_paid, approved_claims, rejected_claims) =
        if let Some(f) = fund {
            (
                f.total_balance.to_string(),
                f.total_received.to_string(),
                f.total_claims_paid.to_string(),
                f.approved_claims_count as u32,
                f.rejected_claims_count as u32,
            )
        } else {
            ("0".to_string(), "0".to_string(), "0".to_string(), 0, 0)
        };

    // Count pending claims
    let pending_claims = InsuranceRepository::count_claims(pool, Some("pending")).await? as u32;

    // Get claims by type
    let type_counts = InsuranceRepository::count_claims_by_type(pool).await?;
    let claims_by_type: Vec<ClaimsByType> = type_counts
        .into_iter()
        .map(|(ct, count, total)| ClaimsByType {
            claim_type: map_claim_type(&ct),
            count: count as u32,
            total_amount: total.to_string(),
        })
        .collect();

    // Get recent claims (last 5)
    let recent_claim_rows = InsuranceRepository::list_claims(pool, None, 0, 5).await?;
    let recent_claims: Vec<ClaimSummary> = recent_claim_rows
        .into_iter()
        .map(|c| ClaimSummary {
            id: c.claim_id,
            claimant: c.claimant,
            claim_type: map_claim_type(&c.claim_type),
            amount: c.amount.to_string(),
            status: map_claim_status(&c.status),
            submitted_at: c.submitted_at.map(|t| t.timestamp() as u64).unwrap_or(0),
        })
        .collect();

    // Get recent transactions (last 5)
    let recent_tx_rows = InsuranceRepository::list_transactions(pool, None, 0, 5).await?;
    let recent_transactions: Vec<InsuranceTransaction> = recent_tx_rows
        .into_iter()
        .map(|tx| InsuranceTransaction {
            tx_hash: tx.tx_hash,
            tx_type: tx.tx_type,
            amount: tx.amount.to_string(),
            timestamp: tx.created_at.map(|t| t.timestamp() as u64).unwrap_or(0),
            description: tx.description.unwrap_or_default(),
        })
        .collect();

    // Fund health ratio: balance / TVL — requires TVL from LockRepository (Phase 6)
    let fund_health_ratio = 0.0;

    let response = InsuranceDashboardResponse {
        balance,
        balance_usd: "0".to_string(), // Requires price oracle — Phase 6
        total_claims_paid,
        pending_claims,
        fund_health_ratio,
        stats: InsuranceStats {
            total_received,
            approved_claims,
            rejected_claims,
            avg_processing_time: 0, // Requires processing time tracking — Phase 6
            claims_by_type,
        },
        recent_claims,
        recent_transactions,
    };

    tracing::info!("Insurance: Dashboard retrieved, pending_claims={}", pending_claims);
    Ok(Json(response))
}

/// GET /v1/insurance/claims
///
/// Returns paginated list of insurance claims.
pub async fn list_claims(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ClaimsListResponse>, ApiError> {
    tracing::info!("Insurance: Listing claims");
    let pool = state.pool();

    let page: u32 = 1;
    let page_size: u32 = 10;
    let offset = ((page - 1) * page_size) as i64;

    let claim_rows = InsuranceRepository::list_claims(pool, None, offset, page_size as i64).await?;
    let total = InsuranceRepository::count_claims(pool, None).await? as u32;

    let claims: Vec<ClaimListItem> = claim_rows
        .into_iter()
        .map(|c| ClaimListItem {
            id: c.claim_id,
            claimant: c.claimant,
            claim_type: map_claim_type(&c.claim_type),
            amount: c.amount.to_string(),
            amount_usd: c.amount_usd.map(|u| u.to_string()).unwrap_or_else(|| "0".to_string()),
            status: map_claim_status(&c.status),
            description: c.description,
            submitted_at: c.submitted_at.map(|t| t.timestamp() as u64).unwrap_or(0),
            processed_at: c.processed_at.map(|t| t.timestamp() as u64),
            incident_tx_hash: c.incident_tx_hash,
        })
        .collect();

    tracing::info!("Insurance: Listed {} claims, total={}", claims.len(), total);
    Ok(Json(ClaimsListResponse {
        claims,
        total,
        page,
        page_size,
    }))
}

/// POST /v1/insurance/claims
///
/// Submits a new insurance claim.
pub async fn submit_claim(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<SubmitClaimRequest>,
) -> Result<Json<SubmitClaimResponse>, ApiError> {
    tracing::info!("Insurance: Submitting claim for {} wei", req.amount);
    let pool = state.pool();

    let claim_id = format!("CLM-{}", Uuid::new_v4().simple());
    let claim_type_str = map_claim_type_to_str(&req.claim_type);

    // Parse amount to BigDecimal
    let amount: BigDecimal = req.amount.parse().map_err(|_| {
        ApiError::InvalidRequest("Invalid amount format".to_string())
    })?;

    // Decode hex signature to bytes (fail-fast; never silently store empty bytes)
    if req.signature.is_empty() {
        return Err(ApiError::InvalidRequest("signature must not be empty".to_string()));
    }
    let sig_bytes = hex::decode(req.signature.trim_start_matches("0x"))
        .map_err(|e| ApiError::InvalidRequest(format!("invalid hex in signature: {}", e)))?;

    InsuranceRepository::create_claim(
        pool,
        &claim_id,
        "0x0000000000000000000000000000000000000000", // Placeholder — auth context Phase 8-D
        claim_type_str,
        &amount,
        &req.description,
        &req.detailed_description,
        &req.incident_tx_hash,
        req.lock_id.as_deref(),
        &sig_bytes,
    )
    .await?;

    tracing::info!("Insurance: Claim {} created successfully", claim_id);
    Ok(Json(SubmitClaimResponse {
        claim_id,
        status: ClaimStatus::Pending,
        estimated_processing_time: "48-72 hours".to_string(),
        message: "Claim submitted successfully. Our team will review your claim shortly.".to_string(),
    }))
}

/// GET /v1/insurance/transactions
///
/// Returns paginated list of insurance fund transactions.
pub async fn list_transactions(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<InsuranceTransactionsResponse>, ApiError> {
    tracing::info!("Insurance: Listing transactions");
    let pool = state.pool();

    let page: u32 = 1;
    let page_size: u32 = 10;
    let offset = ((page - 1) * page_size) as i64;

    let tx_rows = InsuranceRepository::list_transactions(pool, None, offset, page_size as i64).await?;
    let total = InsuranceRepository::count_transactions(pool, None).await? as u32;

    let transactions: Vec<InsuranceTransactionDetail> = tx_rows
        .into_iter()
        .map(|tx| InsuranceTransactionDetail {
            tx_hash: tx.tx_hash,
            tx_type: map_tx_type(&tx.tx_type),
            amount: tx.amount.to_string(),
            amount_usd: tx.amount_usd.map(|u| u.to_string()).unwrap_or_else(|| "0".to_string()),
            timestamp: tx.created_at.map(|t| t.timestamp() as u64).unwrap_or(0),
            description: tx.description.unwrap_or_default(),
            claim_id: tx.claim_id,
            source: tx.source,
        })
        .collect();

    tracing::info!("Insurance: Listed {} transactions, total={}", transactions.len(), total);
    Ok(Json(InsuranceTransactionsResponse {
        transactions,
        total,
        page,
        page_size,
    }))
}
