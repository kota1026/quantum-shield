//! L3→L1 Bridge Integration Module (Phase 8-D)
//!
//! This module orchestrates the complete end-to-end flow for admin operations
//! from L3 to L1, including:
//! 1. Dilithium signature generation on backend
//! 2. L3 transaction execution
//! 3. Bridge verification on L1
//! 4. Treasury Vault execution on L1
//!
//! ## Complete Flow
//! ```
//! Admin Request → Backend Signs → L3 Execute → Bridge → L1 Verify → L1 Execute
//! ```
//!
//! ## BE Rules Compliance
//! - BE-001: Real transactions on L3 and L1 (no mocks)
//! - BE-002: No test hacks
//! - BE-003: Comprehensive logging at each step

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn, error, instrument};

use crate::error::ApiError;
use crate::services::{
    l3_client::L3Client,
    l1_client::L1Client,
    bridge_verifier::{BridgeVerifierService, VerificationStatus},
    treasury_vault::{TreasuryVaultService, TreasuryWithdrawRequest, WithdrawalStatus},
    admin_l3_ops::{AdminL3OpsService, TreasuryTransferRequest},
};

/// End-to-end operation status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum E2EOperationStatus {
    /// L3 transaction pending
    L3Pending,
    /// L3 transaction confirmed
    L3Confirmed,
    /// Bridge verification pending
    BridgePending,
    /// Bridge verification complete
    BridgeVerified,
    /// L1 transaction pending
    L1Pending,
    /// L1 transaction confirmed
    L1Confirmed,
    /// Operation complete
    Complete,
    /// Operation failed
    Failed,
}

/// End-to-end operation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct E2EOperationResult {
    pub operation_id: String,
    pub operation_type: String,
    pub status: E2EOperationStatus,
    /// L3 transaction details
    pub l3_tx_hash: Option<String>,
    pub l3_block_number: Option<u64>,
    pub l3_signature: Option<String>,
    /// Bridge verification details
    pub bridge_verified: bool,
    pub bridge_verified_at: Option<u64>,
    /// L1 transaction details
    pub l1_tx_hash: Option<String>,
    pub l1_block_number: Option<u64>,
    pub l1_confirmations: Option<u64>,
    /// Timestamps
    pub started_at: u64,
    pub completed_at: Option<u64>,
    /// Error if failed
    pub error: Option<String>,
}

/// Treasury withdrawal end-to-end request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct E2ETreasuryWithdrawRequest {
    /// Withdrawal ID
    pub withdrawal_id: String,
    /// Recipient address
    pub to_address: String,
    /// Amount in wei
    pub amount: String,
    /// Reason for withdrawal
    pub reason: String,
    /// Approver addresses
    pub approvers: Vec<String>,
    /// Required L1 confirmations
    pub required_confirmations: u64,
}

/// L3→L1 Bridge Service
///
/// Orchestrates complete end-to-end flows for admin operations
/// across L3 and L1.
pub struct L3L1BridgeService {
    l3_client: Arc<L3Client>,
    l1_client: Arc<L1Client>,
    bridge_verifier: Arc<BridgeVerifierService>,
    treasury_vault: Arc<TreasuryVaultService>,
    admin_ops: Arc<AdminL3OpsService>,
}

impl L3L1BridgeService {
    /// Create a new L3→L1 Bridge Service
    pub fn new(
        l3_client: Arc<L3Client>,
        l1_client: Arc<L1Client>,
        bridge_verifier: Arc<BridgeVerifierService>,
        treasury_vault: Arc<TreasuryVaultService>,
        admin_ops: Arc<AdminL3OpsService>,
    ) -> Self {
        info!("Initializing L3→L1 Bridge Service");
        Self {
            l3_client,
            l1_client,
            bridge_verifier,
            treasury_vault,
            admin_ops,
        }
    }

    /// Execute end-to-end Treasury withdrawal
    ///
    /// # Complete Flow
    /// 1. Admin: Treasury withdrawal request
    /// 2. Backend: Generate message + Dilithium signature
    /// 3. L3: Execute transaction
    /// 4. L3: Prover signs + sends to bridge
    /// 5. Bridge: Submit verification data to L1
    /// 6. L1: BridgeVerifier verifies
    /// 7. L1: TreasuryVault executes withdrawal
    /// 8. Backend: Update DB with L1 confirmation
    /// 9. Admin: Display completion
    #[instrument(skip(self, req), fields(withdrawal_id = %req.withdrawal_id))]
    pub async fn execute_treasury_withdrawal(
        &self,
        req: &E2ETreasuryWithdrawRequest,
    ) -> Result<E2EOperationResult, ApiError> {
        let started_at = chrono::Utc::now().timestamp() as u64;
        let operation_id = format!("e2e_treasury_{}", req.withdrawal_id);

        info!(
            operation_id = %operation_id,
            to = %req.to_address,
            amount = %req.amount,
            "Starting E2E Treasury withdrawal"
        );

        let mut result = E2EOperationResult {
            operation_id: operation_id.clone(),
            operation_type: "treasury_withdrawal".to_string(),
            status: E2EOperationStatus::L3Pending,
            l3_tx_hash: None,
            l3_block_number: None,
            l3_signature: None,
            bridge_verified: false,
            bridge_verified_at: None,
            l1_tx_hash: None,
            l1_block_number: None,
            l1_confirmations: None,
            started_at,
            completed_at: None,
            error: None,
        };

        // Step 1-4: Execute L3 transaction
        info!("Step 1-4: Executing L3 transaction with Dilithium signature");
        let l3_result = self.admin_ops.execute_treasury_transfer(&TreasuryTransferRequest {
            transfer_id: req.withdrawal_id.clone(),
            to_address: req.to_address.clone(),
            amount: req.amount.clone(),
            reason: req.reason.clone(),
            approvers: req.approvers.clone(),
        }).await;

        match l3_result {
            Ok(l3_receipt) => {
                result.l3_tx_hash = Some(l3_receipt.l3_tx_hash.clone());
                result.l3_block_number = Some(l3_receipt.block_number);
                result.l3_signature = Some(l3_receipt.signature);
                result.status = E2EOperationStatus::L3Confirmed;

                info!(
                    l3_tx_hash = %l3_receipt.l3_tx_hash,
                    block = l3_receipt.block_number,
                    "L3 transaction confirmed"
                );
            }
            Err(e) => {
                error!(error = %e, "L3 transaction failed");
                result.status = E2EOperationStatus::Failed;
                result.error = Some(format!("L3 execution failed: {}", e));
                result.completed_at = Some(chrono::Utc::now().timestamp() as u64);
                return Ok(result);
            }
        }

        // Step 5-6: Wait for bridge verification
        info!("Step 5-6: Waiting for bridge verification on L1");
        result.status = E2EOperationStatus::BridgePending;

        let l3_tx_hash = result.l3_tx_hash.as_ref().unwrap();
        let verification_result = self.bridge_verifier.wait_for_verification(
            l3_tx_hash,
            30,  // max attempts
            12,  // interval seconds (approx 1 L1 block)
        ).await;

        match verification_result {
            Ok(verification) => {
                if verification.status == VerificationStatus::Verified {
                    result.bridge_verified = true;
                    result.bridge_verified_at = verification.verified_at;
                    result.status = E2EOperationStatus::BridgeVerified;

                    info!(
                        l3_tx_hash = %l3_tx_hash,
                        "Bridge verification complete"
                    );
                } else {
                    warn!(
                        l3_tx_hash = %l3_tx_hash,
                        status = ?verification.status,
                        "Bridge verification not complete"
                    );
                    result.status = E2EOperationStatus::Failed;
                    result.error = Some(format!("Bridge verification status: {:?}", verification.status));
                    result.completed_at = Some(chrono::Utc::now().timestamp() as u64);
                    return Ok(result);
                }
            }
            Err(e) => {
                error!(error = %e, "Bridge verification failed");
                result.status = E2EOperationStatus::Failed;
                result.error = Some(format!("Bridge verification failed: {}", e));
                result.completed_at = Some(chrono::Utc::now().timestamp() as u64);
                return Ok(result);
            }
        }

        // Step 7: Execute L1 Treasury withdrawal
        info!("Step 7: Executing L1 Treasury Vault withdrawal");
        result.status = E2EOperationStatus::L1Pending;

        let l1_result = self.treasury_vault.withdraw(&TreasuryWithdrawRequest {
            to: req.to_address.clone(),
            amount: req.amount.clone(),
            l3_signature: result.l3_signature.clone().unwrap_or_default(),
            l3_tx_hash: l3_tx_hash.clone(),
        }).await;

        match l1_result {
            Ok(withdraw_result) => {
                result.l1_tx_hash = Some(withdraw_result.l1_tx_hash);
                result.l1_block_number = Some(withdraw_result.block_number);

                if withdraw_result.status == WithdrawalStatus::Executed {
                    result.status = E2EOperationStatus::L1Confirmed;
                    info!(
                        l1_tx_hash = ?result.l1_tx_hash,
                        block = withdraw_result.block_number,
                        "L1 withdrawal executed"
                    );
                } else {
                    result.status = E2EOperationStatus::Failed;
                    result.error = Some(format!("L1 withdrawal status: {:?}", withdraw_result.status));
                }
            }
            Err(e) => {
                error!(error = %e, "L1 withdrawal failed");
                result.status = E2EOperationStatus::Failed;
                result.error = Some(format!("L1 withdrawal failed: {}", e));
                result.completed_at = Some(chrono::Utc::now().timestamp() as u64);
                return Ok(result);
            }
        }

        // Step 8: Wait for required L1 confirmations
        if req.required_confirmations > 0 && result.l1_tx_hash.is_some() {
            info!(
                confirmations = req.required_confirmations,
                "Step 8: Waiting for L1 confirmations"
            );

            let l1_tx_hash = result.l1_tx_hash.as_ref().unwrap();
            let confirmation_result = self.l1_client.wait_for_confirmation(
                l1_tx_hash,
                req.required_confirmations,
                60, // max attempts
            ).await;

            match confirmation_result {
                Ok(receipt) => {
                    let current_block = self.l1_client.get_block_number().await.unwrap_or(0);
                    let tx_block = receipt.block_number.map(|n| n.as_u64()).unwrap_or(0);
                    result.l1_confirmations = Some(current_block.saturating_sub(tx_block));
                    result.l1_block_number = Some(tx_block);

                    info!(
                        l1_tx_hash = %l1_tx_hash,
                        confirmations = result.l1_confirmations,
                        "L1 confirmations reached"
                    );
                }
                Err(e) => {
                    warn!(error = %e, "Failed to get L1 confirmations");
                    // Don't fail the operation - L1 tx was executed
                }
            }
        }

        // Step 9: Mark complete
        result.status = E2EOperationStatus::Complete;
        result.completed_at = Some(chrono::Utc::now().timestamp() as u64);

        let duration = result.completed_at.unwrap() - started_at;
        info!(
            operation_id = %operation_id,
            duration_secs = duration,
            l3_tx = ?result.l3_tx_hash,
            l1_tx = ?result.l1_tx_hash,
            "E2E Treasury withdrawal complete"
        );

        Ok(result)
    }

    /// Get operation status
    ///
    /// In production, this would query from a persistent store.
    /// For now, it demonstrates the interface.
    #[instrument(skip(self), fields(operation_id = %operation_id))]
    pub async fn get_operation_status(
        &self,
        operation_id: &str,
    ) -> Result<E2EOperationResult, ApiError> {
        info!("Getting E2E operation status");

        // In production: query from database
        // For now: return not found
        Err(ApiError::NotFound(format!("Operation not found: {}", operation_id)))
    }

    /// Check L3 health
    pub async fn check_l3_health(&self) -> Result<bool, ApiError> {
        match self.l3_client.health_check().await {
            Ok(health) => Ok(health.status == "healthy"),
            Err(_) => Ok(false),
        }
    }

    /// Check L1 health
    pub async fn check_l1_health(&self) -> Result<bool, ApiError> {
        match self.l1_client.get_block_number().await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_e2e_operation_status_serialize() {
        let complete = serde_json::to_string(&E2EOperationStatus::Complete).unwrap();
        assert_eq!(complete, "\"complete\"");

        let failed = serde_json::to_string(&E2EOperationStatus::Failed).unwrap();
        assert_eq!(failed, "\"failed\"");
    }

    #[test]
    fn test_e2e_operation_result_default() {
        let result = E2EOperationResult {
            operation_id: "test_op".to_string(),
            operation_type: "test".to_string(),
            status: E2EOperationStatus::L3Pending,
            l3_tx_hash: None,
            l3_block_number: None,
            l3_signature: None,
            bridge_verified: false,
            bridge_verified_at: None,
            l1_tx_hash: None,
            l1_block_number: None,
            l1_confirmations: None,
            started_at: 1706745600,
            completed_at: None,
            error: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("test_op"));
        assert!(json.contains("l3_pending"));
    }
}
