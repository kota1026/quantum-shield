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
pub async fn get_distribution(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<FeeDistributionResponse>, ApiError> {
    tracing::debug!("Fees: Getting distribution configuration");

    // Current phase is Phase 1 (Foundation Bootstrap)
    // In production, this would be read from the protocol configuration
    let response = FeeDistributionResponse {
        current_phase: ProtocolPhase::Phase1,
        phase_description: "Foundation Bootstrap (Month 1-6, TVL Cap $1M)".to_string(),
        base_fee_rate: "0.0005".to_string(), // 0.05%
        minimum_fee_usd: "10".to_string(),
        distribution: vec![
            DistributionAllocation {
                recipient: FeeRecipient::ProverReward,
                percentage: 50,
                address: "0x1111111111111111111111111111111111111111".to_string(),
                description: "Rewards for Prover operators who sign unlock requests".to_string(),
            },
            DistributionAllocation {
                recipient: FeeRecipient::Treasury,
                percentage: 40,
                address: "0x2222222222222222222222222222222222222222".to_string(),
                description: "Protocol treasury for development, security, and operations".to_string(),
            },
            DistributionAllocation {
                recipient: FeeRecipient::Insurance,
                percentage: 10,
                address: "0x3333333333333333333333333333333333333333".to_string(),
                description: "Insurance fund for user protection and claim payouts".to_string(),
            },
        ],
        notes: vec![
            "Phase 1 distribution: Prover 50%, Treasury 40%, Insurance 10%".to_string(),
            "Minimum fee: $10 (prevents dust attacks)".to_string(),
            "TVL capped at $1M during Foundation Bootstrap".to_string(),
            "No token burn in Phase 1 (token not yet launched)".to_string(),
        ],
        last_updated: 1736294400,
        pending_change: None,
    };

    Ok(Json(response))
}

/// GET /v1/fees/stats
///
/// Returns fee collection statistics and history.
pub async fn get_stats(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<FeeStatsResponse>, ApiError> {
    tracing::debug!("Fees: Getting statistics");

    // Mock data - in production this would aggregate from blockchain events
    let response = FeeStatsResponse {
        total_fees_collected: "500000000000000000000".to_string(), // 500 ETH
        total_fees_usd: "1250000".to_string(), // $1.25M
        fees_24h: "5000000000000000000".to_string(), // 5 ETH
        fees_7d: "35000000000000000000".to_string(), // 35 ETH
        fees_30d: "150000000000000000000".to_string(), // 150 ETH
        distribution_breakdown: DistributionBreakdown {
            to_provers: "250000000000000000000".to_string(), // 50% = 250 ETH
            to_treasury: "200000000000000000000".to_string(), // 40% = 200 ETH
            to_insurance: "50000000000000000000".to_string(), // 10% = 50 ETH
            to_burn: "0".to_string(), // No burn in Phase 1
        },
        monthly_history: vec![
            MonthlyFeeData {
                month: "2026-01".to_string(),
                total_fees: "150000000000000000000".to_string(),
                total_fees_usd: "375000".to_string(),
                transaction_count: 1250,
                avg_fee_per_tx: "120000000000000000".to_string(), // 0.12 ETH
            },
            MonthlyFeeData {
                month: "2025-12".to_string(),
                total_fees: "180000000000000000000".to_string(),
                total_fees_usd: "450000".to_string(),
                transaction_count: 1500,
                avg_fee_per_tx: "120000000000000000".to_string(),
            },
            MonthlyFeeData {
                month: "2025-11".to_string(),
                total_fees: "120000000000000000000".to_string(),
                total_fees_usd: "300000".to_string(),
                transaction_count: 1000,
                avg_fee_per_tx: "120000000000000000".to_string(),
            },
            MonthlyFeeData {
                month: "2025-10".to_string(),
                total_fees: "50000000000000000000".to_string(),
                total_fees_usd: "125000".to_string(),
                transaction_count: 420,
                avg_fee_per_tx: "119047619047619047".to_string(),
            },
        ],
        top_transactions: vec![
            TopFeeTransaction {
                tx_hash: "0xfee001...".to_string(),
                lock_amount: "100000000000000000000000".to_string(), // 100K ETH
                fee: "50000000000000000000".to_string(), // 50 ETH (0.05%)
                timestamp: 1736380800,
            },
            TopFeeTransaction {
                tx_hash: "0xfee002...".to_string(),
                lock_amount: "50000000000000000000000".to_string(), // 50K ETH
                fee: "25000000000000000000".to_string(), // 25 ETH
                timestamp: 1736294400,
            },
            TopFeeTransaction {
                tx_hash: "0xfee003...".to_string(),
                lock_amount: "25000000000000000000000".to_string(), // 25K ETH
                fee: "12500000000000000000".to_string(), // 12.5 ETH
                timestamp: 1736208000,
            },
        ],
    };

    Ok(Json(response))
}
