//! Admin L3 Operations Module (Phase 8-D)
//!
//! This module provides L3 operations for QS Admin with Dilithium signatures.
//! All admin operations (Treasury, Prover approval) are executed on L3 with
//! quantum-resistant signatures before bridging to L1.
//!
//! ## Operations
//! - Treasury transfers with Dilithium signatures
//! - Prover approval/suspension with Dilithium signatures
//!
//! ## BE Rules Compliance
//! - BE-001: No stubs - real L3 transactions
//! - BE-002: No test hacks
//! - BE-003: Full logging

use serde::{Deserialize, Serialize};
use tracing::{info, warn, instrument};

use crate::error::ApiError;
use crate::crypto::{sign_ml_dsa_65, build_admin_signing_message, verify_admin_signature};
use crate::services::l3_client::{L3Client, L3Transaction, L3TxReceipt, L3TxType};

/// Treasury transfer request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreasuryTransferRequest {
    /// Transfer ID
    pub transfer_id: String,
    /// Recipient address
    pub to_address: String,
    /// Amount in wei
    pub amount: String,
    /// Reason for transfer
    pub reason: String,
    /// Approver addresses (for multi-sig)
    pub approvers: Vec<String>,
}

/// Treasury transfer result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreasuryTransferResult {
    pub transfer_id: String,
    pub l3_tx_hash: String,
    pub signature: String,
    pub status: String,
    pub block_number: u64,
}

/// Prover approval request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProverApprovalRequest {
    /// Prover ID to approve
    pub prover_id: String,
    /// Approval type: "approve" or "reject"
    pub action: ProverApprovalAction,
    /// Reason for decision
    pub reason: String,
}

/// Prover approval action
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProverApprovalAction {
    Approve,
    Reject,
}

/// Prover approval result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProverApprovalResult {
    pub prover_id: String,
    pub action: ProverApprovalAction,
    pub l3_tx_hash: String,
    pub signature: String,
    pub status: String,
    pub block_number: u64,
}

/// Prover suspension request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProverSuspensionRequest {
    /// Prover ID to suspend
    pub prover_id: String,
    /// Reason for suspension
    pub reason: String,
    /// Duration in seconds (0 = permanent)
    pub duration_seconds: u64,
}

/// Prover suspension result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProverSuspensionResult {
    pub prover_id: String,
    pub l3_tx_hash: String,
    pub signature: String,
    pub status: String,
    pub suspended_until: Option<u64>,
}

/// Admin L3 Operations Service
///
/// Handles all admin operations that require L3 execution with Dilithium signatures.
pub struct AdminL3OpsService {
    l3_client: L3Client,
    /// Admin signing key (should be from HSM in production)
    admin_private_key: Vec<u8>,
    /// Admin public key for verification
    admin_public_key: String,
}

impl AdminL3OpsService {
    /// Create a new Admin L3 Operations Service
    ///
    /// # Arguments
    /// * `l3_client` - L3 client for transaction submission
    /// * `admin_private_key` - Admin's Dilithium private key bytes
    /// * `admin_public_key` - Admin's Dilithium public key (hex)
    pub fn new(
        l3_client: L3Client,
        admin_private_key: Vec<u8>,
        admin_public_key: String,
    ) -> Self {
        Self {
            l3_client,
            admin_private_key,
            admin_public_key,
        }
    }

    /// Execute Treasury transfer on L3
    ///
    /// # Flow
    /// 1. Build admin signing message
    /// 2. Generate Dilithium signature
    /// 3. Submit transaction to L3
    /// 4. Wait for confirmation
    /// 5. Return receipt with signature
    #[instrument(skip(self, req), fields(transfer_id = %req.transfer_id))]
    pub async fn execute_treasury_transfer(
        &self,
        req: &TreasuryTransferRequest,
    ) -> Result<TreasuryTransferResult, ApiError> {
        info!(
            transfer_id = %req.transfer_id,
            to = %req.to_address,
            amount = %req.amount,
            "Executing Treasury transfer on L3"
        );

        // 1. Build signing message
        let timestamp = chrono::Utc::now().timestamp() as u64;
        let nonce = uuid::Uuid::new_v4().to_string();
        let message = build_admin_signing_message(
            "TREASURY_TRANSFER",
            &req.transfer_id,
            timestamp,
            &nonce,
        );

        // 2. Generate Dilithium signature
        let signature = sign_ml_dsa_65(&message, &self.admin_private_key)?;
        let signature_hex = format!("0x{}", hex::encode(&signature));

        info!(
            transfer_id = %req.transfer_id,
            signature_len = signature.len(),
            "Dilithium signature generated"
        );

        // 3. Build L3 transaction
        let tx_data = serde_json::json!({
            "transfer_id": req.transfer_id,
            "to": req.to_address,
            "amount": req.amount,
            "reason": req.reason,
            "approvers": req.approvers,
            "timestamp": timestamp,
            "nonce": nonce,
        });

        let tx = L3Transaction {
            tx_type: L3TxType::TreasuryTransfer,
            data: tx_data,
            signature: signature_hex.clone(),
            public_key: self.admin_public_key.clone(),
            nonce: timestamp,
            timestamp,
        };

        // 4. Submit to L3
        let receipt = self.l3_client.submit_transaction(tx).await?;

        info!(
            transfer_id = %req.transfer_id,
            l3_tx_hash = %receipt.tx_hash,
            block = receipt.block_number,
            "Treasury transfer submitted to L3"
        );

        // 5. Wait for confirmation
        let confirmed = self.l3_client
            .wait_for_confirmation(&receipt.tx_hash, 3)
            .await?;

        info!(
            transfer_id = %req.transfer_id,
            l3_tx_hash = %confirmed.tx_hash,
            status = ?confirmed.status,
            "Treasury transfer confirmed on L3"
        );

        Ok(TreasuryTransferResult {
            transfer_id: req.transfer_id.clone(),
            l3_tx_hash: confirmed.tx_hash,
            signature: signature_hex,
            status: format!("{:?}", confirmed.status),
            block_number: confirmed.block_number,
        })
    }

    /// Execute Prover approval/rejection on L3
    ///
    /// # Flow
    /// 1. Build admin signing message
    /// 2. Generate Dilithium signature
    /// 3. Submit transaction to L3
    /// 4. Wait for confirmation
    #[instrument(skip(self, req), fields(prover_id = %req.prover_id, action = ?req.action))]
    pub async fn execute_prover_approval(
        &self,
        req: &ProverApprovalRequest,
    ) -> Result<ProverApprovalResult, ApiError> {
        let action_str = match req.action {
            ProverApprovalAction::Approve => "PROVER_APPROVE",
            ProverApprovalAction::Reject => "PROVER_REJECT",
        };

        info!(
            prover_id = %req.prover_id,
            action = action_str,
            "Executing Prover approval on L3"
        );

        // 1. Build signing message
        let timestamp = chrono::Utc::now().timestamp() as u64;
        let nonce = uuid::Uuid::new_v4().to_string();
        let message = build_admin_signing_message(
            action_str,
            &req.prover_id,
            timestamp,
            &nonce,
        );

        // 2. Generate Dilithium signature
        let signature = sign_ml_dsa_65(&message, &self.admin_private_key)?;
        let signature_hex = format!("0x{}", hex::encode(&signature));

        info!(
            prover_id = %req.prover_id,
            "Dilithium signature generated for prover approval"
        );

        // 3. Build L3 transaction
        let tx_data = serde_json::json!({
            "prover_id": req.prover_id,
            "action": action_str,
            "reason": req.reason,
            "timestamp": timestamp,
            "nonce": nonce,
        });

        let tx = L3Transaction {
            tx_type: L3TxType::ProverApproval,
            data: tx_data,
            signature: signature_hex.clone(),
            public_key: self.admin_public_key.clone(),
            nonce: timestamp,
            timestamp,
        };

        // 4. Submit to L3
        let receipt = self.l3_client.submit_transaction(tx).await?;

        info!(
            prover_id = %req.prover_id,
            l3_tx_hash = %receipt.tx_hash,
            "Prover approval submitted to L3"
        );

        // 5. Wait for confirmation
        let confirmed = self.l3_client
            .wait_for_confirmation(&receipt.tx_hash, 3)
            .await?;

        info!(
            prover_id = %req.prover_id,
            l3_tx_hash = %confirmed.tx_hash,
            status = ?confirmed.status,
            "Prover approval confirmed on L3"
        );

        Ok(ProverApprovalResult {
            prover_id: req.prover_id.clone(),
            action: req.action.clone(),
            l3_tx_hash: confirmed.tx_hash,
            signature: signature_hex,
            status: format!("{:?}", confirmed.status),
            block_number: confirmed.block_number,
        })
    }

    /// Execute Prover suspension on L3
    #[instrument(skip(self, req), fields(prover_id = %req.prover_id))]
    pub async fn execute_prover_suspension(
        &self,
        req: &ProverSuspensionRequest,
    ) -> Result<ProverSuspensionResult, ApiError> {
        info!(
            prover_id = %req.prover_id,
            duration = req.duration_seconds,
            "Executing Prover suspension on L3"
        );

        // 1. Build signing message
        let timestamp = chrono::Utc::now().timestamp() as u64;
        let nonce = uuid::Uuid::new_v4().to_string();
        let message = build_admin_signing_message(
            "PROVER_SUSPEND",
            &req.prover_id,
            timestamp,
            &nonce,
        );

        // 2. Generate Dilithium signature
        let signature = sign_ml_dsa_65(&message, &self.admin_private_key)?;
        let signature_hex = format!("0x{}", hex::encode(&signature));

        // 3. Build L3 transaction
        let suspended_until = if req.duration_seconds > 0 {
            Some(timestamp + req.duration_seconds)
        } else {
            None // Permanent suspension
        };

        let tx_data = serde_json::json!({
            "prover_id": req.prover_id,
            "reason": req.reason,
            "duration_seconds": req.duration_seconds,
            "suspended_until": suspended_until,
            "timestamp": timestamp,
            "nonce": nonce,
        });

        let tx = L3Transaction {
            tx_type: L3TxType::ProverSuspend,
            data: tx_data,
            signature: signature_hex.clone(),
            public_key: self.admin_public_key.clone(),
            nonce: timestamp,
            timestamp,
        };

        // 4. Submit to L3
        let receipt = self.l3_client.submit_transaction(tx).await?;

        // 5. Wait for confirmation
        let confirmed = self.l3_client
            .wait_for_confirmation(&receipt.tx_hash, 3)
            .await?;

        info!(
            prover_id = %req.prover_id,
            l3_tx_hash = %confirmed.tx_hash,
            "Prover suspension confirmed on L3"
        );

        Ok(ProverSuspensionResult {
            prover_id: req.prover_id.clone(),
            l3_tx_hash: confirmed.tx_hash,
            signature: signature_hex,
            status: format!("{:?}", confirmed.status),
            suspended_until,
        })
    }

    /// Verify an admin signature
    ///
    /// Used to verify signatures from other admin operations or auditing.
    pub fn verify_signature(
        &self,
        action_type: &str,
        resource_id: &str,
        timestamp: u64,
        nonce: &str,
        signature_hex: &str,
        public_key_hex: &str,
    ) -> Result<bool, ApiError> {
        verify_admin_signature(
            action_type,
            resource_id,
            timestamp,
            nonce,
            signature_hex,
            public_key_hex,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prover_approval_action_serialize() {
        let approve = serde_json::to_string(&ProverApprovalAction::Approve).unwrap();
        assert_eq!(approve, "\"approve\"");

        let reject = serde_json::to_string(&ProverApprovalAction::Reject).unwrap();
        assert_eq!(reject, "\"reject\"");
    }

    #[test]
    fn test_treasury_transfer_request_serialize() {
        let req = TreasuryTransferRequest {
            transfer_id: "tx_001".to_string(),
            to_address: "0x1234".to_string(),
            amount: "1000000000000000000".to_string(),
            reason: "Test transfer".to_string(),
            approvers: vec!["0xadmin1".to_string()],
        };

        let json = serde_json::to_string(&req).unwrap();
        assert!(json.contains("tx_001"));
        assert!(json.contains("0x1234"));
    }
}
