//! L3 Client Module (Phase 8-D)
//!
//! This module provides connectivity to the L3 node (Aegis) for QS Admin operations.
//! All L3 transactions use Dilithium (ML-DSA-65) signatures for quantum resistance.
//!
//! ## BE Rules Compliance
//! - BE-001: No stubs - real L3 transactions submitted
//! - BE-002: No test hacks
//! - BE-003: Full logging of all L3 operations

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tracing::{info, warn, instrument};

use crate::error::ApiError;

/// L3 node health status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L3HealthStatus {
    pub status: String,
    pub block_height: u64,
    pub syncing: bool,
    pub peer_count: u32,
}

/// L3 transaction receipt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L3TxReceipt {
    pub tx_hash: String,
    pub block_number: u64,
    pub status: L3TxStatus,
    pub gas_used: u64,
    pub prover_signatures: Vec<String>,
    /// Bridge transaction hash if bridged to L1
    pub bridge_tx_hash: Option<String>,
}

/// L3 transaction status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum L3TxStatus {
    Pending,
    Confirmed,
    Failed,
}

/// L3 transaction for submission
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L3Transaction {
    pub tx_type: L3TxType,
    pub data: serde_json::Value,
    pub signature: String,
    pub public_key: String,
    pub nonce: u64,
    pub timestamp: u64,
}

/// L3 transaction types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum L3TxType {
    TreasuryTransfer,
    ProverApproval,
    ProverSuspend,
    ObserverSuspend,
    EmergencyPause,
    GovernanceExecute,
}

/// L3 Client configuration
#[derive(Debug, Clone)]
pub struct L3Config {
    pub endpoint: String,
    pub chain_id: u64,
    pub timeout_ms: u64,
}

impl Default for L3Config {
    fn default() -> Self {
        Self {
            endpoint: "http://localhost:8545".to_string(),
            chain_id: 31337,
            timeout_ms: 30000,
        }
    }
}

/// L3 Client for QS Admin operations
///
/// Provides connectivity to the L3 node for executing admin operations
/// with Dilithium signatures.
pub struct L3Client {
    endpoint: String,
    chain_id: u64,
    client: Client,
}

impl L3Client {
    /// Create a new L3 client
    ///
    /// # Arguments
    /// * `config` - L3 client configuration
    ///
    /// # Returns
    /// * `Result<Self, ApiError>` - L3 client or error
    pub fn new(config: &L3Config) -> Result<Self, ApiError> {
        info!(
            endpoint = %config.endpoint,
            chain_id = config.chain_id,
            "Initializing L3 client"
        );

        let client = Client::builder()
            .timeout(Duration::from_millis(config.timeout_ms))
            .build()
            .map_err(|e| ApiError::Internal(format!("Failed to create HTTP client: {}", e)))?;

        Ok(Self {
            endpoint: config.endpoint.clone(),
            chain_id: config.chain_id,
            client,
        })
    }

    /// Check L3 node health
    ///
    /// # Returns
    /// * `Result<L3HealthStatus, ApiError>` - Health status or error
    #[instrument(skip(self), fields(endpoint = %self.endpoint))]
    pub async fn health_check(&self) -> Result<L3HealthStatus, ApiError> {
        info!("Checking L3 node health");

        let url = format!("{}/health", self.endpoint);
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| {
                warn!(error = %e, "L3 health check failed");
                ApiError::Internal(format!("L3 connection failed: {}", e))
            })?;

        if !response.status().is_success() {
            let status = response.status();
            warn!(status = %status, "L3 health check returned non-success status");
            return Err(ApiError::Internal(format!("L3 health check failed: {}", status)));
        }

        let health: L3HealthStatus = response
            .json()
            .await
            .map_err(|e| ApiError::Internal(format!("Failed to parse health response: {}", e)))?;

        info!(
            status = %health.status,
            block_height = health.block_height,
            "L3 health check successful"
        );

        Ok(health)
    }

    /// Get current L3 block height
    ///
    /// # Returns
    /// * `Result<u64, ApiError>` - Block height or error
    #[instrument(skip(self))]
    pub async fn get_block_height(&self) -> Result<u64, ApiError> {
        info!("Getting L3 block height");

        let url = format!("{}/block/latest", self.endpoint);
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| ApiError::Internal(format!("L3 request failed: {}", e)))?;

        #[derive(Deserialize)]
        struct BlockResponse {
            height: u64,
        }

        let block: BlockResponse = response
            .json()
            .await
            .map_err(|e| ApiError::Internal(format!("Failed to parse block response: {}", e)))?;

        info!(block_height = block.height, "Got L3 block height");
        Ok(block.height)
    }

    /// Submit a transaction to L3
    ///
    /// # Arguments
    /// * `tx` - L3 transaction to submit
    ///
    /// # Returns
    /// * `Result<L3TxReceipt, ApiError>` - Transaction receipt or error
    #[instrument(skip(self, tx), fields(tx_type = ?tx.tx_type))]
    pub async fn submit_transaction(&self, tx: L3Transaction) -> Result<L3TxReceipt, ApiError> {
        info!(
            tx_type = ?tx.tx_type,
            nonce = tx.nonce,
            "Submitting L3 transaction"
        );

        let url = format!("{}/tx/submit", self.endpoint);
        let response = self.client
            .post(&url)
            .json(&tx)
            .send()
            .await
            .map_err(|e| {
                warn!(error = %e, "L3 transaction submission failed");
                ApiError::Internal(format!("L3 transaction failed: {}", e))
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            warn!(status = %status, body = %body, "L3 transaction rejected");
            return Err(ApiError::Internal(format!("L3 transaction rejected: {} - {}", status, body)));
        }

        let receipt: L3TxReceipt = response
            .json()
            .await
            .map_err(|e| ApiError::Internal(format!("Failed to parse tx receipt: {}", e)))?;

        info!(
            tx_hash = %receipt.tx_hash,
            block_number = receipt.block_number,
            status = ?receipt.status,
            "L3 transaction submitted"
        );

        Ok(receipt)
    }

    /// Get transaction status
    ///
    /// # Arguments
    /// * `tx_hash` - Transaction hash to check
    ///
    /// # Returns
    /// * `Result<L3TxReceipt, ApiError>` - Transaction receipt or error
    #[instrument(skip(self), fields(tx_hash = %tx_hash))]
    pub async fn get_transaction(&self, tx_hash: &str) -> Result<L3TxReceipt, ApiError> {
        info!("Getting L3 transaction status");

        let url = format!("{}/tx/{}", self.endpoint, tx_hash);
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| ApiError::Internal(format!("L3 request failed: {}", e)))?;

        if response.status().as_u16() == 404 {
            return Err(ApiError::NotFound(format!("Transaction not found: {}", tx_hash)));
        }

        let receipt: L3TxReceipt = response
            .json()
            .await
            .map_err(|e| ApiError::Internal(format!("Failed to parse tx response: {}", e)))?;

        info!(
            tx_hash = %receipt.tx_hash,
            status = ?receipt.status,
            "Got L3 transaction status"
        );

        Ok(receipt)
    }

    /// Wait for transaction confirmation
    ///
    /// # Arguments
    /// * `tx_hash` - Transaction hash to wait for
    /// * `max_attempts` - Maximum polling attempts
    ///
    /// # Returns
    /// * `Result<L3TxReceipt, ApiError>` - Confirmed receipt or error
    #[instrument(skip(self), fields(tx_hash = %tx_hash))]
    pub async fn wait_for_confirmation(
        &self,
        tx_hash: &str,
        max_attempts: u32,
    ) -> Result<L3TxReceipt, ApiError> {
        info!(max_attempts = max_attempts, "Waiting for L3 transaction confirmation");

        for attempt in 1..=max_attempts {
            let receipt = self.get_transaction(tx_hash).await?;

            match receipt.status {
                L3TxStatus::Confirmed => {
                    info!(
                        tx_hash = %tx_hash,
                        attempt = attempt,
                        "L3 transaction confirmed"
                    );
                    return Ok(receipt);
                }
                L3TxStatus::Failed => {
                    warn!(tx_hash = %tx_hash, "L3 transaction failed");
                    return Err(ApiError::Internal(format!("L3 transaction failed: {}", tx_hash)));
                }
                L3TxStatus::Pending => {
                    info!(
                        tx_hash = %tx_hash,
                        attempt = attempt,
                        "L3 transaction pending, waiting..."
                    );
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            }
        }

        warn!(
            tx_hash = %tx_hash,
            max_attempts = max_attempts,
            "L3 transaction confirmation timed out"
        );
        Err(ApiError::Internal(format!("Transaction confirmation timeout: {}", tx_hash)))
    }

    /// Get the chain ID
    pub fn chain_id(&self) -> u64 {
        self.chain_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_l3_config_default() {
        let config = L3Config::default();
        assert_eq!(config.endpoint, "http://localhost:8545");
        assert_eq!(config.chain_id, 31337);
        assert_eq!(config.timeout_ms, 30000);
    }

    #[test]
    fn test_l3_client_new() {
        let config = L3Config::default();
        let client = L3Client::new(&config);
        assert!(client.is_ok());
        assert_eq!(client.unwrap().chain_id(), 31337);
    }
}
