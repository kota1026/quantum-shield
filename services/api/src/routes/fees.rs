//! Fee Distribution API implementation
//!
//! TASK-P5-029: Fee Distribution API (2 EP)
//!
//! Provides endpoints for:
//! - Current fee distribution configuration
//! - Fee statistics and history
//!
//! Spec References:
//! - UNIFIED_SPEC §手数料配分
//!   - Phase 1: Prover 50%, Treasury 40%, Insurance 10%
//!   - Phase 2+: Prover 40%, Treasury 30%, Burn 20%, Insurance 10%
//!   - Phase 4: ZK Prover 30%, Treasury 30%, Burn 30%, Insurance 10%

use std::sync::Arc;

use axum::{Extension, Json};
use serde::{Deserialize, Serialize};

use crate::{
    db::{TreasuryRepository, LockRepository},
    error::ApiError,
    services::AppState,
};

// ============================================================================
// Fee Distribution Types
// ============================================================================

/// Fee recipient type
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FeeRecipient {
    /// Prover rewards (Phase 1-3)
    ProverReward,
    /// ZK Prover rewards (Phase 4)
    ZkProverReward,
    /// Protocol Treasury
    Treasury,
    /// Insurance Fund
    Insurance,
    /// Token burn (Phase 2+)
    Burn,
}

/// Current protocol phase for fee distribution
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProtocolPhase {
    /// Phase 1: Foundation Bootstrap
    Phase1,
    /// Phase 2: Security Council + Token Launch
    Phase2,
    /// Phase 3: Token Governance
    Phase3,
    /// Phase 4: Full Decentralization
    Phase4,
}

// ============================================================================
// Request/Response Types
// ============================================================================

/// GET /v1/fees/distribution response
#[derive(Debug, Serialize)]
pub struct FeeDistributionResponse {
    /// Current protocol phase
    #[serde(rename = "currentPhase")]
    pub current_phase: ProtocolPhase,
    /// Phase description
    #[serde(rename = "phaseDescription")]
    pub phase_description: String,
    /// Base fee rate (e.g., 0.05% = 5 basis points)
    #[serde(rename = "baseFeeRate")]
    pub base_fee_rate: String,
    /// Minimum fee in USD
    #[serde(rename = "minimumFeeUsd")]
    pub minimum_fee_usd: String,
    /// Current distribution percentages
    pub distribution: Vec<DistributionAllocation>,
    /// Phase-specific notes
    pub notes: Vec<String>,
    /// When distribution was last updated
    #[serde(rename = "lastUpdated")]
    pub last_updated: u64,
    /// Governance proposal for next change (if any)
    #[serde(rename = "pendingChange")]
    pub pending_change: Option<PendingDistributionChange>,
}

#[derive(Debug, Serialize)]
pub struct DistributionAllocation {
    pub recipient: FeeRecipient,
    /// Percentage (e.g., 50 = 50%)
    pub percentage: u8,
    /// Recipient address
    pub address: String,
    /// Description
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct PendingDistributionChange {
    #[serde(rename = "proposalId")]
    pub proposal_id: String,
    #[serde(rename = "newDistribution")]
    pub new_distribution: Vec<DistributionAllocation>,
    #[serde(rename = "effectiveDate")]
    pub effective_date: u64,
    pub status: String,
}

/// GET /v1/fees/stats response
#[derive(Debug, Serialize)]
pub struct FeeStatsResponse {
    /// Total fees collected all time
    #[serde(rename = "totalFeesCollected")]
    pub total_fees_collected: String,
    /// Total fees in USD
    #[serde(rename = "totalFeesUsd")]
    pub total_fees_usd: String,
    /// Fees collected in last 24 hours
    #[serde(rename = "fees24h")]
    pub fees_24h: String,
    /// Fees collected in last 7 days
    #[serde(rename = "fees7d")]
    pub fees_7d: String,
    /// Fees collected in last 30 days
    #[serde(rename = "fees30d")]
    pub fees_30d: String,
    /// Distribution breakdown
    #[serde(rename = "distributionBreakdown")]
    pub distribution_breakdown: DistributionBreakdown,
    /// Monthly fee history
    #[serde(rename = "monthlyHistory")]
    pub monthly_history: Vec<MonthlyFeeData>,
    /// Top fee-generating transactions
    #[serde(rename = "topTransactions")]
    pub top_transactions: Vec<TopFeeTransaction>,
}

#[derive(Debug, Serialize)]
pub struct DistributionBreakdown {
    /// Total sent to provers
    #[serde(rename = "toProvers")]
    pub to_provers: String,
    /// Total sent to treasury
    #[serde(rename = "toTreasury")]
    pub to_treasury: String,
    /// Total sent to insurance
    #[serde(rename = "toInsurance")]
    pub to_insurance: String,
    /// Total burned (Phase 2+)
    #[serde(rename = "toBurn")]
    pub to_burn: String,
}

#[derive(Debug, Serialize)]
pub struct MonthlyFeeData {
    pub month: String,
    #[serde(rename = "totalFees")]
    pub total_fees: String,
    #[serde(rename = "totalFeesUsd")]
    pub total_fees_usd: String,
    #[serde(rename = "transactionCount")]
    pub transaction_count: u32,
    #[serde(rename = "avgFeePerTx")]
    pub avg_fee_per_tx: String,
}

#[derive(Debug, Serialize)]
pub struct TopFeeTransaction {
    #[serde(rename = "txHash")]
    pub tx_hash: String,
    #[serde(rename = "lockAmount")]
    pub lock_amount: String,
    pub fee: String,
    pub timestamp: u64,
}

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// GET /v1/fees/distribution
///
/// Returns current fee distribution configuration based on protocol phase.
/// BE-001: Protocol phase config is on-chain; addresses use "0x0" until L1 integration.
/// BE-003: Logging at start and end.
pub async fn get_distribution(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<FeeDistributionResponse>, ApiError> {
    tracing::info!("Fees: get_distribution started");

    let pool = state.pool();

    // Query TVL to determine effective phase cap status
    let tvl = LockRepository::get_total_tvl(pool).await?;
    tracing::info!("Fees: current TVL = {}", tvl);

    // Protocol phase configuration (Phase 1 constants per UNIFIED_SPEC)
    // Phase transitions are governed on-chain; hardcoded percentages are spec-defined, not mock data.
    let now = chrono::Utc::now().timestamp() as u64;

    let response = FeeDistributionResponse {
        current_phase: ProtocolPhase::Phase1,
        phase_description: "Foundation Bootstrap (Month 1-6, TVL Cap $1M)".to_string(),
        base_fee_rate: "0.0005".to_string(), // 0.05% per spec
        minimum_fee_usd: "10".to_string(),
        distribution: vec![
            DistributionAllocation {
                recipient: FeeRecipient::ProverReward,
                percentage: 50,
                address: "0x0".to_string(), // L1 contract address — populated after L1 integration
                description: "Rewards for Prover operators who sign unlock requests".to_string(),
            },
            DistributionAllocation {
                recipient: FeeRecipient::Treasury,
                percentage: 40,
                address: "0x0".to_string(),
                description: "Protocol treasury for development, security, and operations".to_string(),
            },
            DistributionAllocation {
                recipient: FeeRecipient::Insurance,
                percentage: 10,
                address: "0x0".to_string(),
                description: "Insurance fund for user protection and claim payouts".to_string(),
            },
        ],
        notes: vec![
            "Phase 1 distribution: Prover 50%, Treasury 40%, Insurance 10%".to_string(),
            "Minimum fee: $10 (prevents dust attacks)".to_string(),
            "TVL capped at $1M during Foundation Bootstrap".to_string(),
            "No token burn in Phase 1 (token not yet launched)".to_string(),
            format!("Current TVL: {} wei", tvl),
        ],
        last_updated: now,
        pending_change: None, // No governance table for pending fee changes yet
    };

    tracing::info!("Fees: get_distribution completed");
    Ok(Json(response))
}

/// GET /v1/fees/stats
///
/// Returns fee collection statistics and history.
/// BE-001: Real DB queries for treasury revenue + lock counts. On-chain fee
///         events (24h/7d/30d breakdowns, per-tx fees) are not yet indexed, so
///         those fields return "0" or empty arrays rather than fake data.
/// BE-003: Logging at start and end.
pub async fn get_stats(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<FeeStatsResponse>, ApiError> {
    tracing::info!("Fees: get_stats started");

    let pool = state.pool();

    // --- Real DB queries ---
    // Total treasury balance (proxy for total fees collected until L1 fee indexer exists)
    let treasury_balance = TreasuryRepository::get_total_balance(pool).await?;
    tracing::info!("Fees: treasury_balance = {}", treasury_balance);

    // Revenue breakdown by source (from protocol_revenue table)
    let revenue_by_source = TreasuryRepository::get_revenue_by_source(pool).await?;
    tracing::info!("Fees: revenue sources count = {}", revenue_by_source.len());

    // Total lock/unlock counts for context
    let total_lock_count = LockRepository::count_locks(pool, None).await?;
    tracing::info!("Fees: total_lock_count = {}", total_lock_count);

    // Build distribution breakdown from revenue sources
    let mut to_provers = "0".to_string();
    let mut to_treasury = "0".to_string();
    let mut to_insurance = "0".to_string();
    let to_burn = "0".to_string(); // No burn in Phase 1

    for (source, amount) in &revenue_by_source {
        match source.as_str() {
            "prover_reward" | "prover" => to_provers = amount.to_string(),
            "treasury" | "protocol" => to_treasury = amount.to_string(),
            "insurance" => to_insurance = amount.to_string(),
            _ => {} // Other sources are not part of fee distribution
        }
    }

    // Fee time-window breakdowns require an L1 event indexer that does not
    // exist yet. Return "0" per BE-001 (no fake data).
    let response = FeeStatsResponse {
        total_fees_collected: treasury_balance.to_string(),
        total_fees_usd: "0".to_string(), // Requires price oracle — not available yet
        fees_24h: "0".to_string(),       // Requires L1 fee event indexer
        fees_7d: "0".to_string(),        // Requires L1 fee event indexer
        fees_30d: "0".to_string(),       // Requires L1 fee event indexer
        distribution_breakdown: DistributionBreakdown {
            to_provers,
            to_treasury,
            to_insurance,
            to_burn,
        },
        monthly_history: vec![],       // Requires L1 fee event indexer with monthly aggregation
        top_transactions: vec![],      // Requires L1 fee event indexer with per-tx fee tracking
    };

    tracing::info!("Fees: get_stats completed, total_locks={}", total_lock_count);
    Ok(Json(response))
}
