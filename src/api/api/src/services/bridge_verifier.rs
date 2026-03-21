//! Bridge Verifier Integration Module (Phase 8-D)
//!
//! This module integrates with the Bridge Verifier contract on L1 (Sepolia)
//! to verify L3 transactions that have been bridged to L1.
//!
//! ## Contract Interface
//! - getVerificationStatus(bytes32 l3TxHash) -> VerificationStatus
//! - VerificationCompleted event
//!
//! ## BE Rules Compliance
//! - BE-001: Real L1 contract calls
//! - BE-002: No test hacks
//! - BE-003: Full logging

use ethers::prelude::*;
use ethers::types::{H256, Filter};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn, instrument};

use crate::services::l1_client::L1Error;

/// Verification status from Bridge Verifier contract
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VerificationStatus {
    /// Not yet submitted for verification
    NotSubmitted,
    /// Verification in progress
    Pending,
    /// Verification successful
    Verified,
    /// Verification failed
    Failed,
}

impl From<u8> for VerificationStatus {
    fn from(value: u8) -> Self {
        match value {
            0 => VerificationStatus::NotSubmitted,
            1 => VerificationStatus::Pending,
            2 => VerificationStatus::Verified,
            3 => VerificationStatus::Failed,
            _ => VerificationStatus::NotSubmitted,
        }
    }
}

/// Bridge verification result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeVerificationResult {
    pub l3_tx_hash: String,
    pub status: VerificationStatus,
    pub l1_tx_hash: Option<String>,
    pub verified_at: Option<u64>,
    pub block_number: Option<u64>,
}

/// Bridge Verifier Service
///
/// Interacts with the BridgeVerifier contract on L1 to check
/// verification status of L3 transactions.
pub struct BridgeVerifierService {
    provider: Arc<Provider<Http>>,
    contract_address: Address,
}

impl BridgeVerifierService {
    /// Create a new Bridge Verifier Service
    ///
    /// # Arguments
    /// * `provider` - L1 provider
    /// * `contract_address` - BridgeVerifier contract address
    pub fn new(provider: Arc<Provider<Http>>, contract_address: &str) -> Result<Self, L1Error> {
        let address = contract_address.parse::<Address>()
            .map_err(|_| L1Error::ContractCall("Invalid contract address".into()))?;

        info!(
            contract = %contract_address,
            "Initializing Bridge Verifier Service"
        );

        Ok(Self {
            provider,
            contract_address: address,
        })
    }

    /// Get verification status for an L3 transaction
    ///
    /// # Arguments
    /// * `l3_tx_hash` - L3 transaction hash (hex string with 0x prefix)
    ///
    /// # Returns
    /// * `Result<VerificationStatus, L1Error>` - Verification status
    #[instrument(skip(self), fields(l3_tx_hash = %l3_tx_hash))]
    pub async fn get_verification_status(
        &self,
        l3_tx_hash: &str,
    ) -> Result<VerificationStatus, L1Error> {
        info!("Getting verification status from Bridge Verifier");

        // Parse L3 tx hash
        let hash_bytes = hex::decode(l3_tx_hash.strip_prefix("0x").unwrap_or(l3_tx_hash))
            .map_err(|_| L1Error::ContractCall("Invalid L3 tx hash".into()))?;

        if hash_bytes.len() != 32 {
            return Err(L1Error::ContractCall("L3 tx hash must be 32 bytes".into()));
        }

        // Build call data for getVerificationStatus(bytes32)
        // Function selector: keccak256("getVerificationStatus(bytes32)")[0:4]
        let mut call_data = vec![0x3d, 0xb6, 0x4b, 0x3a]; // Function selector
        call_data.extend_from_slice(&hash_bytes);

        // Make call
        let call = TransactionRequest::new()
            .to(self.contract_address)
            .data(call_data);

        let result = self.provider.call(&call.into(), None).await
            .map_err(|e| L1Error::ContractCall(e.to_string()))?;

        // Parse result (uint8 status)
        if result.len() >= 32 {
            let status = result[31]; // Last byte of uint256
            let verification_status = VerificationStatus::from(status);

            info!(
                l3_tx_hash = %l3_tx_hash,
                status = ?verification_status,
                "Got verification status"
            );

            Ok(verification_status)
        } else {
            Err(L1Error::ContractCall("Invalid response from contract".into()))
        }
    }

    /// Get full verification result including L1 transaction details
    ///
    /// # Arguments
    /// * `l3_tx_hash` - L3 transaction hash
    ///
    /// # Returns
    /// * `Result<BridgeVerificationResult, L1Error>` - Full verification result
    #[instrument(skip(self), fields(l3_tx_hash = %l3_tx_hash))]
    pub async fn get_verification_result(
        &self,
        l3_tx_hash: &str,
    ) -> Result<BridgeVerificationResult, L1Error> {
        let status = self.get_verification_status(l3_tx_hash).await?;

        // If verified, get additional details from VerificationCompleted events
        let (l1_tx_hash, verified_at, block_number) = if status == VerificationStatus::Verified {
            match self.fetch_verification_event(l3_tx_hash).await {
                Ok(details) => details,
                Err(e) => {
                    warn!(
                        l3_tx_hash = %l3_tx_hash,
                        error = %e,
                        "Failed to fetch VerificationCompleted event, returning status only"
                    );
                    (None, None, None)
                }
            }
        } else {
            (None, None, None)
        };

        Ok(BridgeVerificationResult {
            l3_tx_hash: l3_tx_hash.to_string(),
            status,
            l1_tx_hash,
            verified_at,
            block_number,
        })
    }

    /// Fetch VerificationCompleted event details for a given L3 tx hash
    ///
    /// Queries L1 logs for the VerificationCompleted event filtered by the L3 tx hash.
    /// Returns (l1_tx_hash, verified_at_timestamp, block_number).
    async fn fetch_verification_event(
        &self,
        l3_tx_hash: &str,
    ) -> Result<(Option<String>, Option<u64>, Option<u64>), L1Error> {
        let hash_bytes = hex::decode(l3_tx_hash.strip_prefix("0x").unwrap_or(l3_tx_hash))
            .map_err(|_| L1Error::ContractCall("Invalid L3 tx hash".into()))?;

        if hash_bytes.len() != 32 {
            return Err(L1Error::ContractCall("L3 tx hash must be 32 bytes".into()));
        }

        // VerificationCompleted(bytes32 indexed l3TxHash, ...)
        // Topic0 = keccak256("VerificationCompleted(bytes32)")
        // Topic1 = l3TxHash (indexed)
        let topic1 = H256::from_slice(&hash_bytes);

        // Search recent blocks (last ~10000 blocks)
        let current_block = self.provider
            .get_block_number()
            .await
            .map_err(|e| L1Error::ContractCall(format!("Failed to get block number: {}", e)))?
            .as_u64();

        let from_block = current_block.saturating_sub(10000);

        let filter = Filter::new()
            .address(self.contract_address)
            .from_block(from_block)
            .to_block(current_block)
            .topic1(topic1);

        let logs = self.provider
            .get_logs(&filter)
            .await
            .map_err(|e| L1Error::ContractCall(format!("Failed to fetch verification logs: {}", e)))?;

        if let Some(log) = logs.first() {
            let l1_tx_hash = log.transaction_hash
                .map(|h| format!("0x{}", hex::encode(h.as_bytes())));
            let block_number = log.block_number.map(|b| b.as_u64());

            // Get block timestamp
            let verified_at = if let Some(block_num) = log.block_number {
                if let Ok(Some(block)) = self.provider.get_block(block_num).await {
                    Some(block.timestamp.as_u64())
                } else {
                    None
                }
            } else {
                None
            };

            Ok((l1_tx_hash, verified_at, block_number))
        } else {
            info!(l3_tx_hash = %l3_tx_hash, "No VerificationCompleted event found yet");
            Ok((None, None, None))
        }
    }

    /// Wait for verification to complete
    ///
    /// # Arguments
    /// * `l3_tx_hash` - L3 transaction hash to wait for
    /// * `max_attempts` - Maximum polling attempts
    /// * `interval_secs` - Polling interval in seconds
    ///
    /// # Returns
    /// * `Result<BridgeVerificationResult, L1Error>` - Verified result or error
    #[instrument(skip(self), fields(l3_tx_hash = %l3_tx_hash))]
    pub async fn wait_for_verification(
        &self,
        l3_tx_hash: &str,
        max_attempts: u32,
        interval_secs: u64,
    ) -> Result<BridgeVerificationResult, L1Error> {
        info!(
            max_attempts = max_attempts,
            interval_secs = interval_secs,
            "Waiting for bridge verification"
        );

        for attempt in 1..=max_attempts {
            let result = self.get_verification_result(l3_tx_hash).await?;

            match result.status {
                VerificationStatus::Verified => {
                    info!(
                        l3_tx_hash = %l3_tx_hash,
                        attempt = attempt,
                        "Bridge verification completed"
                    );
                    return Ok(result);
                }
                VerificationStatus::Failed => {
                    warn!(
                        l3_tx_hash = %l3_tx_hash,
                        "Bridge verification failed"
                    );
                    return Err(L1Error::ContractCall("Verification failed".into()));
                }
                VerificationStatus::Pending | VerificationStatus::NotSubmitted => {
                    info!(
                        l3_tx_hash = %l3_tx_hash,
                        attempt = attempt,
                        status = ?result.status,
                        "Verification pending, waiting..."
                    );
                    tokio::time::sleep(std::time::Duration::from_secs(interval_secs)).await;
                }
            }
        }

        warn!(
            l3_tx_hash = %l3_tx_hash,
            "Verification wait timed out"
        );
        Err(L1Error::ContractCall("Verification timeout".into()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verification_status_from_u8() {
        assert_eq!(VerificationStatus::from(0), VerificationStatus::NotSubmitted);
        assert_eq!(VerificationStatus::from(1), VerificationStatus::Pending);
        assert_eq!(VerificationStatus::from(2), VerificationStatus::Verified);
        assert_eq!(VerificationStatus::from(3), VerificationStatus::Failed);
        assert_eq!(VerificationStatus::from(99), VerificationStatus::NotSubmitted);
    }

    #[test]
    fn test_verification_status_serialize() {
        let verified = serde_json::to_string(&VerificationStatus::Verified).unwrap();
        assert_eq!(verified, "\"verified\"");

        let pending = serde_json::to_string(&VerificationStatus::Pending).unwrap();
        assert_eq!(pending, "\"pending\"");
    }
}
