//! VRF Service for Chainlink VRF Integration
//!
//! Implements SEQUENCES §2.3-§2.4:
//! - §2.3: VRF Prover Selection (requestProverSelection)
//! - §2.4: VRF Result Processing (getSelectedProver)
//!
//! Features:
//! - 5 minute timeout with fallback (triggerFallback)
//! - Polling-based VRF status checking
//! - Contract interaction via ethers-rs

use std::time::Duration;

use anyhow::Result;
use sha3::{Digest, Sha3_256};

use crate::config::VRFConfig;
use crate::types::{VRFRequest, VRFStatus};

/// VRF Service Error types
#[derive(Debug, thiserror::Error)]
pub enum VRFError {
    #[error("VRF request not found: {0}")]
    RequestNotFound(String),

    #[error("VRF request already fulfilled")]
    AlreadyFulfilled,

    #[error("VRF timeout not reached yet")]
    TimeoutNotReached,

    #[error("No active provers available")]
    NoActiveProvers,

    #[error("Contract call failed: {0}")]
    ContractError(String),

    #[error("VRF timeout after {0} seconds")]
    Timeout(u64),

    #[error("Internal error: {0}")]
    Internal(String),
}

/// VRF Service for interacting with VRFConsumer contract
///
/// SEQUENCES §2.3-§2.4 Implementation:
/// 1. requestProverSelection() - Request VRF random value
/// 2. Poll isProverSelected() - Check if VRF fulfilled
/// 3. getSelectedProver() - Get selected prover
/// 4. triggerFallback() - Use prevrandao after 5 min timeout
pub struct VRFService {
    /// VRF configuration
    config: VRFConfig,
}

impl VRFService {
    /// Create new VRF service
    pub async fn new(config: &VRFConfig) -> Result<Self> {
        tracing::info!(
            "Initializing VRF Service with contract: {}",
            config.contract_address
        );

        Ok(Self {
            config: config.clone(),
        })
    }

    /// Request VRF prover selection
    ///
    /// SEQUENCES §2.3: VRF seed取得
    ///
    /// Returns the VRF request ID
    pub async fn request_prover_selection(
        &self,
        unlock_request_id: &str,
    ) -> Result<String, VRFError> {
        tracing::info!(
            "Requesting VRF prover selection for unlock: {}",
            unlock_request_id
        );

        // Generate VRF request ID (in production, this comes from VRFConsumer contract)
        let vrf_request_id = self.generate_vrf_request_id(unlock_request_id);

        // In production, this would call:
        // VRFConsumer.requestProverSelection(bytes32(unlock_request_id))
        //
        // For now, we simulate the request and return the ID
        // The actual contract call would be:
        //
        // let contract = VRFConsumer::new(self.config.contract_address, provider);
        // let tx = contract.request_prover_selection(unlock_request_id_bytes).send().await?;
        // let receipt = tx.await?;
        // let vrf_request_id = extract_request_id_from_receipt(receipt);

        tracing::info!(
            "VRF request created: {} for unlock: {}",
            vrf_request_id,
            unlock_request_id
        );

        Ok(vrf_request_id)
    }

    /// Check if prover has been selected (VRF fulfilled)
    ///
    /// SEQUENCES §2.4: VRF result available check
    pub async fn is_prover_selected(&self, unlock_request_id: &str) -> Result<bool, VRFError> {
        // In production, this would call:
        // VRFConsumer.isProverSelected(bytes32(unlock_request_id))
        //
        // For development, we simulate based on stored state
        tracing::debug!(
            "Checking VRF selection status for unlock: {}",
            unlock_request_id
        );

        // Simulated - in production this calls the contract
        Ok(false)
    }

    /// Get selected prover after VRF fulfillment
    ///
    /// SEQUENCES §2.4: Prover選出結果取得
    ///
    /// Returns (prover_address, random_value)
    pub async fn get_selected_prover(
        &self,
        unlock_request_id: &str,
    ) -> Result<(String, String), VRFError> {
        tracing::info!(
            "Getting selected prover for unlock: {}",
            unlock_request_id
        );

        // In production, this would call:
        // (address prover, uint256 randomValue) = VRFConsumer.getSelectedProver(bytes32(unlock_request_id))
        //
        // For development, return simulated values

        // Check if VRF is fulfilled first
        if !self.is_prover_selected(unlock_request_id).await? {
            return Err(VRFError::RequestNotFound(unlock_request_id.to_string()));
        }

        // Simulated response
        let prover = "0x0000000000000000000000000000000000000001".to_string();
        let random_value = "0x1234567890abcdef".to_string();

        Ok((prover, random_value))
    }

    /// Check VRF timeout status
    ///
    /// SEQUENCES §2.3: 5分タイムアウト確認
    ///
    /// Returns (is_timed_out, time_remaining_seconds)
    pub async fn check_timeout(
        &self,
        unlock_request_id: &str,
        requested_at: u64,
    ) -> Result<(bool, u64), VRFError> {
        let now = chrono::Utc::now().timestamp() as u64;
        let deadline = requested_at + self.config.timeout_seconds;

        if now >= deadline {
            Ok((true, 0))
        } else {
            Ok((false, deadline - now))
        }
    }

    /// Trigger fallback mechanism after timeout
    ///
    /// SEQUENCES §2.3: Fallback using block.prevrandao
    ///
    /// Returns selected prover address
    pub async fn trigger_fallback(
        &self,
        unlock_request_id: &str,
    ) -> Result<String, VRFError> {
        tracing::warn!(
            "Triggering VRF fallback for unlock: {}",
            unlock_request_id
        );

        // In production, this would call:
        // address prover = VRFConsumer.triggerFallback(bytes32(unlock_request_id))
        //
        // For development, simulate fallback selection

        // Simulated fallback prover selection
        let fallback_prover = "0x0000000000000000000000000000000000000002".to_string();

        tracing::info!(
            "Fallback prover selected: {} for unlock: {}",
            fallback_prover,
            unlock_request_id
        );

        Ok(fallback_prover)
    }

    /// Wait for VRF selection with polling
    ///
    /// Implements polling loop with timeout
    ///
    /// Returns (prover_address, random_value) or triggers fallback
    pub async fn wait_for_selection(
        &self,
        unlock_request_id: &str,
        requested_at: u64,
        timeout: Duration,
    ) -> Result<(String, String, VRFStatus), VRFError> {
        let start = std::time::Instant::now();
        let poll_interval = Duration::from_secs(self.config.polling_interval_seconds);

        tracing::info!(
            "Waiting for VRF selection for unlock: {}, timeout: {:?}",
            unlock_request_id,
            timeout
        );

        loop {
            // Check if VRF is fulfilled
            if self.is_prover_selected(unlock_request_id).await? {
                let (prover, random) = self.get_selected_prover(unlock_request_id).await?;
                return Ok((prover, random, VRFStatus::Fulfilled));
            }

            // Check timeout
            if start.elapsed() >= timeout {
                tracing::warn!(
                    "VRF timeout reached for unlock: {}, triggering fallback",
                    unlock_request_id
                );

                // Trigger fallback
                let prover = self.trigger_fallback(unlock_request_id).await?;
                let random = self.generate_fallback_random(unlock_request_id);

                return Ok((prover, random, VRFStatus::FallbackUsed));
            }

            // Wait before next poll
            tokio::time::sleep(poll_interval).await;
        }
    }

    /// Generate VRF request ID from unlock request ID
    fn generate_vrf_request_id(&self, unlock_request_id: &str) -> String {
        let mut hasher = Sha3_256::new();
        hasher.update(b"VRF_REQUEST_");
        hasher.update(unlock_request_id.as_bytes());
        hasher.update(chrono::Utc::now().timestamp().to_be_bytes());
        let result = hasher.finalize();
        format!("0x{}", hex::encode(result))
    }

    /// Generate fallback random value (for development/testing)
    fn generate_fallback_random(&self, unlock_request_id: &str) -> String {
        let mut hasher = Sha3_256::new();
        hasher.update(b"FALLBACK_RANDOM_");
        hasher.update(unlock_request_id.as_bytes());
        hasher.update(chrono::Utc::now().timestamp().to_be_bytes());
        let result = hasher.finalize();
        format!("0x{}", hex::encode(result))
    }

    /// Get VRF timeout duration
    pub fn get_timeout(&self) -> Duration {
        Duration::from_secs(self.config.timeout_seconds)
    }

    /// Create a new VRFRequest record
    pub fn create_vrf_request(
        &self,
        vrf_request_id: &str,
        unlock_request_id: &str,
        lock_id: &str,
    ) -> VRFRequest {
        VRFRequest {
            vrf_request_id: vrf_request_id.to_string(),
            unlock_request_id: unlock_request_id.to_string(),
            lock_id: lock_id.to_string(),
            requested_at: chrono::Utc::now().timestamp() as u64,
            random_value: None,
            selected_prover: None,
            status: VRFStatus::Pending,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_vrf_service_creation() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();
        assert_eq!(service.config.timeout_seconds, 300);
    }

    #[tokio::test]
    async fn test_generate_vrf_request_id() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let id1 = service.generate_vrf_request_id("unlock_123");
        let id2 = service.generate_vrf_request_id("unlock_456");

        assert!(id1.starts_with("0x"));
        assert!(id2.starts_with("0x"));
        assert_ne!(id1, id2);
    }

    #[tokio::test]
    async fn test_check_timeout_not_reached() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let now = chrono::Utc::now().timestamp() as u64;
        let (is_timeout, remaining) = service.check_timeout("unlock_123", now).await.unwrap();

        assert!(!is_timeout);
        assert!(remaining > 0);
    }

    #[tokio::test]
    async fn test_check_timeout_reached() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let past = chrono::Utc::now().timestamp() as u64 - 600; // 10 minutes ago
        let (is_timeout, remaining) = service.check_timeout("unlock_123", past).await.unwrap();

        assert!(is_timeout);
        assert_eq!(remaining, 0);
    }

    #[tokio::test]
    async fn test_create_vrf_request() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let request = service.create_vrf_request("vrf_123", "unlock_456", "lock_789");

        assert_eq!(request.vrf_request_id, "vrf_123");
        assert_eq!(request.unlock_request_id, "unlock_456");
        assert_eq!(request.lock_id, "lock_789");
        assert_eq!(request.status, VRFStatus::Pending);
        assert!(request.selected_prover.is_none());
    }

    #[tokio::test]
    async fn test_request_prover_selection() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let result = service.request_prover_selection("unlock_123").await;
        assert!(result.is_ok());

        let request_id = result.unwrap();
        assert!(request_id.starts_with("0x"));
    }

    #[tokio::test]
    async fn test_trigger_fallback() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let result = service.trigger_fallback("unlock_123").await;
        assert!(result.is_ok());

        let prover = result.unwrap();
        assert!(prover.starts_with("0x"));
    }
}
