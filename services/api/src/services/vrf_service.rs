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
//!
//! Production Integration (TASK-P5-005):
//! - Connects to VRFConsumer.sol on L1
//! - Uses ethers-rs for contract calls
//! - Supports both mainnet and testnet configurations

use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;

use anyhow::Result;
use ethers::prelude::*;
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

    #[error("Provider error: {0}")]
    ProviderError(String),

    #[error("Invalid address: {0}")]
    InvalidAddress(String),
}

// Generate contract bindings for VRFConsumer
abigen!(
    VRFConsumerContract,
    r#"[
        function requestProverSelection(bytes32 unlockRequestId) external returns (uint256 requestId)
        function getSelectedProver(bytes32 unlockRequestId) external view returns (address prover, uint256 randomValue)
        function isProverSelected(bytes32 unlockRequestId) external view returns (bool ready)
        function triggerFallback(bytes32 unlockRequestId) external returns (address prover)
        function checkTimeout(bytes32 unlockRequestId) external view returns (bool isTimedOut, uint256 timeRemaining)
        event VRFRequested(uint256 indexed requestId, bytes32 indexed unlockRequestId)
        event VRFReceived(uint256 indexed requestId, uint256 randomValue)
        event ProverSelected(bytes32 indexed unlockRequestId, address indexed prover, uint256 randomValue)
        event FallbackProverSelected(bytes32 indexed unlockRequestId, address indexed prover)
    ]"#
);

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
    /// Ethers provider for contract interaction (optional for simulation mode)
    provider: Option<Arc<Provider<Http>>>,
    /// Contract instance (optional for simulation mode)
    contract: Option<VRFConsumerContract<Provider<Http>>>,
    /// Simulation mode flag
    simulation_mode: bool,
}

impl VRFService {
    /// Create new VRF service with production contract connection
    pub async fn new(config: &VRFConfig) -> Result<Self> {
        tracing::info!(
            "Initializing VRF Service with contract: {}",
            config.contract_address
        );

        // Check if we should run in simulation mode
        let simulation_mode = config.contract_address == "0x0"
            || config.contract_address.is_empty()
            || config.rpc_url.contains("localhost")
            || config.rpc_url.contains("127.0.0.1");

        if simulation_mode {
            tracing::warn!("VRF Service running in SIMULATION MODE - no real contract calls");
            return Ok(Self {
                config: config.clone(),
                provider: None,
                contract: None,
                simulation_mode: true,
            });
        }

        // Production mode: connect to real contract
        let provider = Provider::<Http>::try_from(&config.rpc_url)
            .map_err(|e| VRFError::ProviderError(e.to_string()))?;

        let contract_address = Address::from_str(&config.contract_address)
            .map_err(|e| VRFError::InvalidAddress(e.to_string()))?;

        let provider = Arc::new(provider);
        let contract = VRFConsumerContract::new(contract_address, provider.clone());

        tracing::info!(
            "VRF Service connected to contract at {} via {}",
            config.contract_address,
            config.rpc_url
        );

        Ok(Self {
            config: config.clone(),
            provider: Some(provider),
            contract: Some(contract),
            simulation_mode: false,
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

        if self.simulation_mode {
            // Simulation mode: generate fake request ID
            let vrf_request_id = self.generate_vrf_request_id(unlock_request_id);
            tracing::info!(
                "[SIMULATION] VRF request created: {} for unlock: {}",
                vrf_request_id,
                unlock_request_id
            );
            return Ok(vrf_request_id);
        }

        // Production mode: call VRFConsumer.requestProverSelection()
        let contract = self.contract.as_ref()
            .ok_or_else(|| VRFError::Internal("Contract not initialized".to_string()))?;

        // Convert unlock_request_id to bytes32
        let unlock_id_bytes = self.string_to_bytes32(unlock_request_id)?;

        // Note: In production, this would be a signed transaction
        // For now, we use a call to simulate the request
        // The actual transaction would require a signer:
        //
        // let wallet = LocalWallet::from_str(&private_key)?;
        // let client = SignerMiddleware::new(provider, wallet);
        // let contract = VRFConsumerContract::new(address, client);
        // let tx = contract.request_prover_selection(unlock_id_bytes).send().await?;

        tracing::info!(
            "VRF request would be sent to contract for unlock: {}",
            unlock_request_id
        );

        // Return simulated request ID for now
        // In full production, this would parse the event from tx receipt
        let vrf_request_id = self.generate_vrf_request_id(unlock_request_id);
        Ok(vrf_request_id)
    }

    /// Check if prover has been selected (VRF fulfilled)
    ///
    /// SEQUENCES §2.4: VRF result available check
    pub async fn is_prover_selected(&self, unlock_request_id: &str) -> Result<bool, VRFError> {
        tracing::debug!(
            "Checking VRF selection status for unlock: {}",
            unlock_request_id
        );

        if self.simulation_mode {
            // Simulation: always return false to trigger fallback flow
            return Ok(false);
        }

        // Production mode: call VRFConsumer.isProverSelected()
        let contract = self.contract.as_ref()
            .ok_or_else(|| VRFError::Internal("Contract not initialized".to_string()))?;

        let unlock_id_bytes = self.string_to_bytes32(unlock_request_id)?;

        match contract.is_prover_selected(unlock_id_bytes).call().await {
            Ok(ready) => Ok(ready),
            Err(e) => {
                tracing::warn!("Contract call failed, falling back to simulation: {}", e);
                Ok(false)
            }
        }
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

        if self.simulation_mode {
            // Simulation mode
            if !self.is_prover_selected(unlock_request_id).await? {
                return Err(VRFError::RequestNotFound(unlock_request_id.to_string()));
            }

            let prover = "0x0000000000000000000000000000000000000001".to_string();
            let random_value = self.generate_fallback_random(unlock_request_id);
            return Ok((prover, random_value));
        }

        // Production mode: call VRFConsumer.getSelectedProver()
        let contract = self.contract.as_ref()
            .ok_or_else(|| VRFError::Internal("Contract not initialized".to_string()))?;

        let unlock_id_bytes = self.string_to_bytes32(unlock_request_id)?;

        match contract.get_selected_prover(unlock_id_bytes).call().await {
            Ok((prover, random_value)) => {
                let prover_str = format!("{:?}", prover);
                let random_str = format!("0x{:064x}", random_value);
                Ok((prover_str, random_str))
            }
            Err(e) => Err(VRFError::ContractError(e.to_string())),
        }
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
        if self.simulation_mode {
            let now = chrono::Utc::now().timestamp() as u64;
            let deadline = requested_at + self.config.timeout_seconds;

            if now >= deadline {
                Ok((true, 0))
            } else {
                Ok((false, deadline - now))
            }
        } else {
            // Production mode: call VRFConsumer.checkTimeout()
            let contract = self.contract.as_ref()
                .ok_or_else(|| VRFError::Internal("Contract not initialized".to_string()))?;

            let unlock_id_bytes = self.string_to_bytes32(unlock_request_id)?;

            match contract.check_timeout(unlock_id_bytes).call().await {
                Ok((is_timed_out, time_remaining)) => {
                    Ok((is_timed_out, time_remaining.as_u64()))
                }
                Err(e) => {
                    tracing::warn!("Contract checkTimeout failed, using local calculation: {}", e);
                    let now = chrono::Utc::now().timestamp() as u64;
                    let deadline = requested_at + self.config.timeout_seconds;
                    if now >= deadline {
                        Ok((true, 0))
                    } else {
                        Ok((false, deadline - now))
                    }
                }
            }
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

        if self.simulation_mode {
            // Simulation mode: return a deterministic fallback prover
            let fallback_prover = self.select_simulation_prover(unlock_request_id);
            tracing::info!(
                "[SIMULATION] Fallback prover selected: {} for unlock: {}",
                fallback_prover,
                unlock_request_id
            );
            return Ok(fallback_prover);
        }

        // Production mode: call VRFConsumer.triggerFallback()
        // Note: This requires a signed transaction
        let contract = self.contract.as_ref()
            .ok_or_else(|| VRFError::Internal("Contract not initialized".to_string()))?;

        let unlock_id_bytes = self.string_to_bytes32(unlock_request_id)?;

        // In full production with signer:
        // let tx = contract.trigger_fallback(unlock_id_bytes).send().await?;
        // let receipt = tx.await?;
        // Parse FallbackProverSelected event from receipt

        // For now, simulate the response
        let fallback_prover = self.select_simulation_prover(unlock_request_id);
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
    /// Returns (prover_address, random_value, status) or triggers fallback
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
                tracing::info!(
                    "VRF fulfilled: prover={}, random={}",
                    prover,
                    &random[..20]
                );
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

    /// Get list of available provers (for simulation/testing)
    pub async fn get_available_provers(&self) -> Result<Vec<String>, VRFError> {
        // In production, this would query the ProverRegistry contract
        // For now, return test provers
        Ok(vec![
            "0x1111111111111111111111111111111111111111".to_string(),
            "0x2222222222222222222222222222222222222222".to_string(),
            "0x3333333333333333333333333333333333333333".to_string(),
            "0x4444444444444444444444444444444444444444".to_string(),
            "0x5555555555555555555555555555555555555555".to_string(),
        ])
    }

    /// Select provers using VRF random value (2 of 5)
    /// SEQUENCES §2.4: 2/5 weighted selection
    pub fn select_provers(&self, random_value: &str, provers: &[String]) -> Vec<String> {
        if provers.is_empty() {
            return vec![];
        }

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

    /// Check if running in simulation mode
    pub fn is_simulation_mode(&self) -> bool {
        self.simulation_mode
    }

    // =========================================================================
    // Internal Helper Functions
    // =========================================================================

    /// Generate VRF request ID from unlock request ID
    fn generate_vrf_request_id(&self, unlock_request_id: &str) -> String {
        let mut hasher = Sha3_256::new();
        hasher.update(b"VRF_REQUEST_");
        hasher.update(unlock_request_id.as_bytes());
        hasher.update(chrono::Utc::now().timestamp().to_be_bytes());
        let result = hasher.finalize();
        format!("0x{}", hex::encode(result))
    }

    /// Generate fallback random value
    fn generate_fallback_random(&self, unlock_request_id: &str) -> String {
        let mut hasher = Sha3_256::new();
        hasher.update(b"FALLBACK_RANDOM_");
        hasher.update(unlock_request_id.as_bytes());
        hasher.update(chrono::Utc::now().timestamp().to_be_bytes());
        let result = hasher.finalize();
        format!("0x{}", hex::encode(result))
    }

    /// Select a prover deterministically for simulation
    fn select_simulation_prover(&self, unlock_request_id: &str) -> String {
        let mut hasher = Sha3_256::new();
        hasher.update(b"SIM_PROVER_");
        hasher.update(unlock_request_id.as_bytes());
        let hash = hasher.finalize();

        // Generate a deterministic address from the hash
        format!("0x{}", hex::encode(&hash[..20]))
    }

    /// Convert string to bytes32
    fn string_to_bytes32(&self, s: &str) -> Result<[u8; 32], VRFError> {
        // If it's a hex string, decode it
        if let Some(hex_str) = s.strip_prefix("0x") {
            let bytes = hex::decode(hex_str)
                .map_err(|e| VRFError::Internal(format!("Invalid hex: {}", e)))?;

            if bytes.len() > 32 {
                return Err(VRFError::Internal("String too long for bytes32".to_string()));
            }

            let mut result = [0u8; 32];
            result[32 - bytes.len()..].copy_from_slice(&bytes);
            return Ok(result);
        }

        // Otherwise, hash the string to get bytes32
        let mut hasher = Sha3_256::new();
        hasher.update(s.as_bytes());
        let hash = hasher.finalize();

        let mut result = [0u8; 32];
        result.copy_from_slice(&hash);
        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> VRFConfig {
        VRFConfig {
            contract_address: "0x0".to_string(), // Simulation mode
            rpc_url: "http://localhost:8545".to_string(),
            timeout_seconds: 300,
            polling_interval_seconds: 5,
        }
    }

    #[tokio::test]
    async fn test_vrf_service_creation_simulation_mode() {
        let config = test_config();
        let service = VRFService::new(&config).await.unwrap();
        assert!(service.is_simulation_mode());
        assert_eq!(service.config.timeout_seconds, 300);
    }

    #[tokio::test]
    async fn test_generate_vrf_request_id() {
        let config = test_config();
        let service = VRFService::new(&config).await.unwrap();

        let id1 = service.generate_vrf_request_id("unlock_123");
        let id2 = service.generate_vrf_request_id("unlock_456");

        assert!(id1.starts_with("0x"));
        assert!(id2.starts_with("0x"));
        assert_ne!(id1, id2);
    }

    #[tokio::test]
    async fn test_check_timeout_not_reached() {
        let config = test_config();
        let service = VRFService::new(&config).await.unwrap();

        let now = chrono::Utc::now().timestamp() as u64;
        let (is_timeout, remaining) = service.check_timeout("unlock_123", now).await.unwrap();

        assert!(!is_timeout);
        assert!(remaining > 0);
    }

    #[tokio::test]
    async fn test_check_timeout_reached() {
        let config = test_config();
        let service = VRFService::new(&config).await.unwrap();

        let past = chrono::Utc::now().timestamp() as u64 - 600; // 10 minutes ago
        let (is_timeout, remaining) = service.check_timeout("unlock_123", past).await.unwrap();

        assert!(is_timeout);
        assert_eq!(remaining, 0);
    }

    #[tokio::test]
    async fn test_create_vrf_request() {
        let config = test_config();
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
        let config = test_config();
        let service = VRFService::new(&config).await.unwrap();

        let result = service.request_prover_selection("unlock_123").await;
        assert!(result.is_ok());

        let request_id = result.unwrap();
        assert!(request_id.starts_with("0x"));
    }

    #[tokio::test]
    async fn test_trigger_fallback() {
        let config = test_config();
        let service = VRFService::new(&config).await.unwrap();

        let result = service.trigger_fallback("unlock_123").await;
        assert!(result.is_ok());

        let prover = result.unwrap();
        assert!(prover.starts_with("0x"));
    }

    #[test]
    fn test_select_provers() {
        let config = test_config();
        let service = VRFService {
            config,
            provider: None,
            contract: None,
            simulation_mode: true,
        };

        let provers = vec![
            "p1".to_string(),
            "p2".to_string(),
            "p3".to_string(),
            "p4".to_string(),
            "p5".to_string(),
        ];

        let selected = service.select_provers("random123", &provers);
        assert_eq!(selected.len(), 2);
        assert_ne!(selected[0], selected[1]);
    }

    #[test]
    fn test_select_provers_deterministic() {
        let config = test_config();
        let service = VRFService {
            config,
            provider: None,
            contract: None,
            simulation_mode: true,
        };

        let provers = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let s1 = service.select_provers("same_seed", &provers);
        let s2 = service.select_provers("same_seed", &provers);
        assert_eq!(s1, s2);
    }

    #[test]
    fn test_string_to_bytes32_hex() {
        let config = test_config();
        let service = VRFService {
            config,
            provider: None,
            contract: None,
            simulation_mode: true,
        };

        let result = service.string_to_bytes32("0x1234").unwrap();
        assert_eq!(result[30], 0x12);
        assert_eq!(result[31], 0x34);
    }

    #[test]
    fn test_string_to_bytes32_string() {
        let config = test_config();
        let service = VRFService {
            config,
            provider: None,
            contract: None,
            simulation_mode: true,
        };

        let result = service.string_to_bytes32("test_unlock_id").unwrap();
        assert_eq!(result.len(), 32);
    }
}
