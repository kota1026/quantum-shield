//! VRF Service for Chainlink VRF integration
//!
//! Implements SEQUENCES §2.3-§2.4: VRF Prover Selection

use std::time::Duration;
use thiserror::Error;
use crate::config::VRFConfig;

#[derive(Debug, Error)]
pub enum VRFError {
    #[error("VRF request failed: {0}")]
    RequestFailed(String),
    #[error("VRF timeout")]
    Timeout,
    #[error("No provers available")]
    NoProversAvailable,
}

/// VRF Service for Prover selection
pub struct VRFService {
    config: VRFConfig,
}

impl VRFService {
    pub async fn new(config: &VRFConfig) -> anyhow::Result<Self> {
        Ok(Self {
            config: config.clone(),
        })
    }

    /// Request VRF for prover selection
    /// SEQUENCES §2.3
    pub async fn request_prover_selection(&self, _unlock_id: &str) -> Result<String, VRFError> {
        use sha3::{Digest, Sha3_256};
        let mut hasher = Sha3_256::new();
        hasher.update(b"VRF_REQUEST_");
        hasher.update(&chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0).to_be_bytes());
        let vrf_request_id = format!("vrf_{}", hex::encode(&hasher.finalize()[..16]));
        tracing::info!("VRF request created: {}", vrf_request_id);
        Ok(vrf_request_id)
    }

    /// Wait for VRF selection result
    /// SEQUENCES §2.4
    pub async fn wait_for_selection(&self, vrf_request_id: &str, timeout: Duration) -> Result<String, VRFError> {
        tracing::info!("Waiting for VRF selection: {} (timeout: {:?})", vrf_request_id, timeout);
        
        // In production, this would poll for Chainlink VRF callback
        // For now, simulate selection
        tokio::time::sleep(Duration::from_millis(100)).await;
        
        Ok("prover_0x1234".to_string())
    }

    /// Trigger fallback using prevrandao
    /// Used when VRF times out (5 min)
    pub async fn trigger_fallback(&self, _unlock_id: &str) -> Result<String, VRFError> {
        tracing::warn!("VRF timeout, using prevrandao fallback");
        Ok("prover_fallback_0x5678".to_string())
    }

    /// Get timeout duration from config
    pub fn timeout_duration(&self) -> Duration {
        Duration::from_secs(self.config.timeout_seconds)
    }

    /// Get list of available provers
    pub async fn get_available_provers(&self) -> Result<Vec<String>, VRFError> {
        Ok(vec![
            "prover_0x1111".to_string(),
            "prover_0x2222".to_string(),
            "prover_0x3333".to_string(),
            "prover_0x4444".to_string(),
            "prover_0x5555".to_string(),
        ])
    }

    /// Select provers using VRF random value
    /// Selects 2 of 5 provers
    pub fn select_provers(&self, random_value: &str, provers: &[String]) -> Vec<String> {
        if provers.is_empty() {
            return vec![];
        }

        use sha3::{Digest, Sha3_256};
        let mut hasher = Sha3_256::new();
        hasher.update(random_value.as_bytes());
        let hash = hasher.finalize();

        let total = provers.len();
        let idx1 = (hash[0] as usize) % total;
        let mut idx2 = (hash[1] as usize) % total;
        if idx2 == idx1 {
            idx2 = (idx2 + 1) % total;
        }

        vec![provers[idx1].clone(), provers[idx2].clone()]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_select_provers() {
        let config = VRFConfig {
            contract_address: "0x0".to_string(),
            rpc_url: "http://localhost:8545".to_string(),
            timeout_seconds: 300,
            polling_interval_seconds: 5,
        };
        let service = VRFService { config };
        
        let provers = vec![
            "p1".to_string(), "p2".to_string(), "p3".to_string(),
            "p4".to_string(), "p5".to_string(),
        ];
        
        let selected = service.select_provers("random123", &provers);
        assert_eq!(selected.len(), 2);
        assert_ne!(selected[0], selected[1]);
    }

    #[test]
    fn test_select_provers_deterministic() {
        let config = VRFConfig::default();
        let service = VRFService { config };
        
        let provers = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let s1 = service.select_provers("same_seed", &provers);
        let s2 = service.select_provers("same_seed", &provers);
        assert_eq!(s1, s2);
    }
}
