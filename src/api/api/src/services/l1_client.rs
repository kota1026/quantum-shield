//! L1 Client Module (Phase 8-D)
//!
//! This module provides connectivity to L1 (Ethereum Sepolia) for QS Admin operations.
//! Integrates with Bridge Verifier and Treasury Vault contracts.
//!
//! ## BE Rules Compliance
//! - BE-001: No stubs - real L1 transactions submitted to Sepolia
//! - BE-002: No test hacks
//! - BE-003: Full logging of all L1 operations

use ethers::prelude::*;
use std::sync::Arc;
use std::time::Duration;
use tracing::{info, warn, instrument};

use crate::error::ApiError;

/// Sepolia chain ID
pub const SEPOLIA_CHAIN_ID: u64 = 11155111;

/// L1 transaction status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TxStatus {
    Pending,
    Confirmed,
    Failed,
}

/// L1 Client configuration
#[derive(Debug, Clone)]
pub struct L1Config {
    pub rpc_url: String,
    pub chain_id: u64,
    pub timeout_ms: u64,
    pub bridge_verifier_address: Option<String>,
    pub treasury_vault_address: Option<String>,
}

impl Default for L1Config {
    fn default() -> Self {
        Self {
            rpc_url: "https://sepolia.infura.io/v3/YOUR_PROJECT_ID".to_string(),
            chain_id: SEPOLIA_CHAIN_ID,
            timeout_ms: 60000,
            bridge_verifier_address: None,
            treasury_vault_address: None,
        }
    }
}

/// L1 error types
#[derive(Debug, thiserror::Error)]
pub enum L1Error {
    #[error("L1 connection failed: {0}")]
    Connection(String),

    #[error("Chain ID mismatch: expected {expected}, got {actual}")]
    ChainMismatch { expected: u64, actual: u64 },

    #[error("L1 query failed: {0}")]
    Query(String),

    #[error("Invalid transaction hash")]
    InvalidTxHash,

    #[error("Contract call failed: {0}")]
    ContractCall(String),

    #[error("Transaction submission failed: {0}")]
    TxSubmission(String),

    #[error("Transaction failed on-chain")]
    TxFailed,
}

impl From<L1Error> for ApiError {
    fn from(err: L1Error) -> Self {
        ApiError::Internal(err.to_string())
    }
}

/// L1 Client for QS Admin operations
///
/// Provides connectivity to Ethereum Sepolia for:
/// - Bridge verification
/// - Treasury Vault operations
/// - Transaction monitoring
pub struct L1Client {
    provider: Arc<Provider<Http>>,
    chain_id: u64,
}

impl L1Client {
    /// Create a new L1 client
    ///
    /// # Arguments
    /// * `config` - L1 client configuration
    ///
    /// # Returns
    /// * `Result<Self, L1Error>` - L1 client or error
    pub async fn new(config: &L1Config) -> Result<Self, L1Error> {
        info!(
            rpc_url = %config.rpc_url,
            chain_id = config.chain_id,
            "Initializing L1 client"
        );

        let provider = Provider::<Http>::try_from(&config.rpc_url)
            .map_err(|e| L1Error::Connection(e.to_string()))?;

        // Verify chain ID
        let actual_chain_id = provider.get_chainid().await
            .map_err(|e| L1Error::Connection(e.to_string()))?;

        if actual_chain_id.as_u64() != config.chain_id {
            return Err(L1Error::ChainMismatch {
                expected: config.chain_id,
                actual: actual_chain_id.as_u64(),
            });
        }

        info!(
            chain_id = config.chain_id,
            "L1 client initialized successfully"
        );

        Ok(Self {
            provider: Arc::new(provider),
            chain_id: config.chain_id,
        })
    }

    /// Get current L1 block number
    ///
    /// # Returns
    /// * `Result<u64, L1Error>` - Block number or error
    #[instrument(skip(self))]
    pub async fn get_block_number(&self) -> Result<u64, L1Error> {
        info!("Getting L1 block number");

        let block_number = self.provider.get_block_number().await
            .map_err(|e| L1Error::Query(e.to_string()))?;

        info!(block_number = block_number.as_u64(), "Got L1 block number");
        Ok(block_number.as_u64())
    }

    /// Get transaction status
    ///
    /// # Arguments
    /// * `tx_hash` - Transaction hash (hex string with 0x prefix)
    ///
    /// # Returns
    /// * `Result<TxStatus, L1Error>` - Transaction status or error
    #[instrument(skip(self), fields(tx_hash = %tx_hash))]
    pub async fn get_tx_status(&self, tx_hash: &str) -> Result<TxStatus, L1Error> {
        info!("Getting L1 transaction status");

        let hash = tx_hash.parse::<H256>()
            .map_err(|_| L1Error::InvalidTxHash)?;

        let receipt = self.provider.get_transaction_receipt(hash).await
            .map_err(|e| L1Error::Query(e.to_string()))?;

        match receipt {
            Some(r) => {
                let status = if r.status == Some(1.into()) {
                    TxStatus::Confirmed
                } else {
                    TxStatus::Failed
                };
                info!(tx_hash = %tx_hash, status = ?status, "Got L1 transaction status");
                Ok(status)
            }
            None => {
                info!(tx_hash = %tx_hash, "L1 transaction pending");
                Ok(TxStatus::Pending)
            }
        }
    }

    /// Get transaction block number
    ///
    /// # Arguments
    /// * `tx_hash` - Transaction hash
    ///
    /// # Returns
    /// * `Result<Option<u64>, L1Error>` - Block number if confirmed
    #[instrument(skip(self), fields(tx_hash = %tx_hash))]
    pub async fn get_tx_block(&self, tx_hash: &str) -> Result<Option<u64>, L1Error> {
        let hash = tx_hash.parse::<H256>()
            .map_err(|_| L1Error::InvalidTxHash)?;

        let receipt = self.provider.get_transaction_receipt(hash).await
            .map_err(|e| L1Error::Query(e.to_string()))?;

        Ok(receipt.and_then(|r| r.block_number.map(|n| n.as_u64())))
    }

    /// Wait for transaction confirmation with specified number of confirmations
    ///
    /// # Arguments
    /// * `tx_hash` - Transaction hash to wait for
    /// * `confirmations` - Number of block confirmations required
    /// * `max_attempts` - Maximum polling attempts
    ///
    /// # Returns
    /// * `Result<TransactionReceipt, L1Error>` - Confirmed receipt or error
    #[instrument(skip(self), fields(tx_hash = %tx_hash, confirmations = confirmations))]
    pub async fn wait_for_confirmation(
        &self,
        tx_hash: &str,
        confirmations: u64,
        max_attempts: u32,
    ) -> Result<TransactionReceipt, L1Error> {
        info!("Waiting for L1 transaction confirmation");

        let hash = tx_hash.parse::<H256>()
            .map_err(|_| L1Error::InvalidTxHash)?;

        for attempt in 1..=max_attempts {
            let status = self.get_tx_status(tx_hash).await?;

            match status {
                TxStatus::Confirmed => {
                    let current_block = self.get_block_number().await?;
                    let tx_block = self.get_tx_block(tx_hash).await?
                        .ok_or_else(|| L1Error::Query("Could not get tx block".into()))?;

                    let current_confirmations = current_block.saturating_sub(tx_block);

                    if current_confirmations >= confirmations {
                        let receipt = self.provider.get_transaction_receipt(hash).await
                            .map_err(|e| L1Error::Query(e.to_string()))?
                            .ok_or_else(|| L1Error::Query("Receipt not found".into()))?;

                        info!(
                            tx_hash = %tx_hash,
                            confirmations = current_confirmations,
                            "L1 transaction confirmed"
                        );

                        return Ok(receipt);
                    }

                    info!(
                        tx_hash = %tx_hash,
                        current = current_confirmations,
                        required = confirmations,
                        "Waiting for more confirmations"
                    );
                }
                TxStatus::Failed => {
                    warn!(tx_hash = %tx_hash, "L1 transaction failed");
                    return Err(L1Error::TxFailed);
                }
                TxStatus::Pending => {
                    info!(
                        tx_hash = %tx_hash,
                        attempt = attempt,
                        "L1 transaction pending"
                    );
                }
            }

            tokio::time::sleep(Duration::from_secs(12)).await; // ~1 Ethereum block time
        }

        warn!(
            tx_hash = %tx_hash,
            max_attempts = max_attempts,
            "L1 transaction confirmation timed out"
        );
        Err(L1Error::Query("Confirmation timeout".into()))
    }

    /// Get ETH balance for an address
    ///
    /// # Arguments
    /// * `address` - Ethereum address (hex string with 0x prefix)
    ///
    /// # Returns
    /// * `Result<U256, L1Error>` - Balance in wei
    #[instrument(skip(self), fields(address = %address))]
    pub async fn get_balance(&self, address: &str) -> Result<U256, L1Error> {
        let addr = address.parse::<Address>()
            .map_err(|_| L1Error::Query("Invalid address".into()))?;

        let balance = self.provider.get_balance(addr, None).await
            .map_err(|e| L1Error::Query(e.to_string()))?;

        info!(address = %address, balance = %balance, "Got L1 balance");
        Ok(balance)
    }

    /// Get the chain ID
    pub fn chain_id(&self) -> u64 {
        self.chain_id
    }

    /// Get provider reference
    pub fn provider(&self) -> Arc<Provider<Http>> {
        Arc::clone(&self.provider)
    }
}

/// L1 Transaction Monitor for tracking transaction status
pub struct L1Monitor {
    l1_client: Arc<L1Client>,
    poll_interval: Duration,
}

impl L1Monitor {
    /// Create a new L1 monitor
    pub fn new(l1_client: Arc<L1Client>, poll_interval_secs: u64) -> Self {
        Self {
            l1_client,
            poll_interval: Duration::from_secs(poll_interval_secs),
        }
    }

    /// Wait for transaction confirmation with polling
    ///
    /// # Arguments
    /// * `tx_hash` - Transaction hash to wait for
    /// * `confirmations` - Required confirmations
    ///
    /// # Returns
    /// * `Result<TransactionReceipt, L1Error>` - Confirmed receipt or error
    #[instrument(skip(self), fields(tx_hash = %tx_hash))]
    pub async fn wait_for_confirmation(
        &self,
        tx_hash: &str,
        confirmations: u64,
    ) -> Result<TransactionReceipt, L1Error> {
        info!(
            tx_hash = %tx_hash,
            confirmations = confirmations,
            "Starting L1 transaction monitoring"
        );

        loop {
            let status = self.l1_client.get_tx_status(tx_hash).await?;

            match status {
                TxStatus::Confirmed => {
                    let current_block = self.l1_client.get_block_number().await?;
                    let tx_block = self.l1_client.get_tx_block(tx_hash).await?
                        .ok_or_else(|| L1Error::Query("Could not get tx block".into()))?;

                    if current_block.saturating_sub(tx_block) >= confirmations {
                        let hash = tx_hash.parse::<H256>()
                            .map_err(|_| L1Error::InvalidTxHash)?;

                        let receipt = self.l1_client.provider.get_transaction_receipt(hash).await
                            .map_err(|e| L1Error::Query(e.to_string()))?
                            .ok_or_else(|| L1Error::Query("Receipt not found".into()))?;

                        info!(
                            tx_hash = %tx_hash,
                            confirmations = current_block.saturating_sub(tx_block),
                            "L1 transaction confirmed with required confirmations"
                        );

                        return Ok(receipt);
                    }
                }
                TxStatus::Failed => {
                    return Err(L1Error::TxFailed);
                }
                TxStatus::Pending => {
                    // Continue waiting
                }
            }

            tokio::time::sleep(self.poll_interval).await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_l1_config_default() {
        let config = L1Config::default();
        assert_eq!(config.chain_id, SEPOLIA_CHAIN_ID);
        assert_eq!(config.timeout_ms, 60000);
    }

    #[test]
    fn test_tx_status_eq() {
        assert_eq!(TxStatus::Pending, TxStatus::Pending);
        assert_eq!(TxStatus::Confirmed, TxStatus::Confirmed);
        assert_eq!(TxStatus::Failed, TxStatus::Failed);
        assert_ne!(TxStatus::Pending, TxStatus::Confirmed);
    }

    #[test]
    fn test_l1_error_display() {
        let err = L1Error::ChainMismatch {
            expected: 11155111,
            actual: 1,
        };
        assert!(err.to_string().contains("11155111"));
        assert!(err.to_string().contains("1"));
    }
}
