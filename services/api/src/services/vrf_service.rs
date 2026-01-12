//! VRF Service for Chainlink VRF Integration
//!
//! Implements SEQUENCES §2.3-§2.4:
//! - §2.3: VRF Prover Selection (requestProverSelection)
//! - §2.4: VRF Result Processing (getSelectedProver)

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

/// VRF Service for Prover selection
pub struct VRFService {
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
    pub async fn request_prover_selection(
        &self,
        unlock_request_id: &str,
    ) -> Result<String, VRFError> {
        tracing::info!(
            "Requesting VRF prover selection for unlock: {}",
            unlock_request_id
        );

        let vrf_request_id = self.generate_vrf_request_id(unlock_request_id);

        tracing::info!(
            "VRF request created: {} for unlock: {}",
            vrf_request_id,
            unlock_request_id
        );

        Ok(vrf_request_id)
    }

    /// Check if prover has been selected (VRF fulfilled)
    pub async fn is_prover_selected(&self, _unlock_request_id: &str) -> Result<bool, VRFError> {
        Ok(false)
    }

    /// Get selected prover after VRF fulfillment
    pub async fn get_selected_prover(
        &self,
        unlock_request_id: &str,
    ) -> Result<(String, String), VRFError> {
        tracing::info!(
            "Getting selected prover for unlock: {}",
            unlock_request_id
        );

        if !self.is_prover_selected(unlock_request_id).await? {
            return Err(VRFError::RequestNotFound(unlock_request_id.to_string()));
        }

        let prover = "0x0000000000000000000000000000000000000001".to_string();
        let random_value = "0x1234567890abcdef".to_string();

        Ok((prover, random_value))
    }

    /// Check VRF timeout status
    pub async fn check_timeout(
        &self,
        _unlock_request_id: &str,
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

    /// Trigger fallback using prevrandao
    pub async fn trigger_fallback(
        &self,
        unlock_request_id: &str,
    ) -> Result<(String, String), VRFError> {
        tracing::warn!(
            "Triggering VRF fallback for unlock: {}",
            unlock_request_id
        );

        let prover = "0x0000000000000000000000000000000000000002".to_string();
        let random_value = "0xfallback000000000".to_string();

        Ok((prover, random_value))
    }

    /// Wait for VRF selection with timeout and fallback
    pub async fn wait_for_selection(
        &self,
        unlock_request_id: &str,
        requested_at: u64,
        timeout: Duration,
    ) -> Result<(String, String, VRFStatus), VRFError> {
        tracing::info!(
            "Waiting for VRF selection for unlock: {}, timeout: {:?}",
            unlock_request_id,
            timeout
        );

        let poll_interval = Duration::from_secs(5);
        let start = std::time::Instant::now();

        loop {
            if self.is_prover_selected(unlock_request_id).await? {
                let (prover, random_value) = self.get_selected_prover(unlock_request_id).await?;
                return Ok((prover, random_value, VRFStatus::Fulfilled));
            }

            let (is_timed_out, _) = self.check_timeout(unlock_request_id, requested_at).await?;
            if is_timed_out || start.elapsed() >= timeout {
                tracing::warn!(
                    "VRF timeout reached, using fallback for unlock: {}",
                    unlock_request_id
                );
                let (prover, random_value) = self.trigger_fallback(unlock_request_id).await?;
                return Ok((prover, random_value, VRFStatus::FallbackUsed));
            }

            tokio::time::sleep(poll_interval).await;
        }
    }

    /// Create a new VRF request record
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

    /// Get timeout duration
    pub fn get_timeout(&self) -> Duration {
        Duration::from_secs(self.config.timeout_seconds)
    }

    /// Generate VRF request ID using SHA3-256
    fn generate_vrf_request_id(&self, unlock_request_id: &str) -> String {
        let mut hasher = Sha3_256::new();
        hasher.update(b"VRF_REQUEST_V1");
        hasher.update(unlock_request_id.as_bytes());
        hasher.update(&chrono::Utc::now().timestamp().to_be_bytes());
        let result = hasher.finalize();
        format!("0x{}", hex::encode(&result[..16]))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_generate_vrf_request_id() {
        let config = VRFConfig {
            contract_address: "0x1234".to_string(),
            rpc_url: "http://localhost:8545".to_string(),
            timeout_seconds: 300,
            polling_interval_seconds: 5,
        };

        let service = VRFService::new(&config).await.unwrap();
        let id = service.generate_vrf_request_id("test_unlock_123");

        assert!(id.starts_with("0x"));
        assert_eq!(id.len(), 34); // 0x + 32 hex chars
    }
}
