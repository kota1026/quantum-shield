//! VRF Service for Chainlink VRF Integration
//!
//! Implements SEQUENCES §2.3-§2.4:
//! - §2.3: VRF Prover Selection (requestProverSelection)
//! - §2.4: VRF Result Processing (getSelectedProver)
//!
//! Features:
//! - Real Chainlink VRF v2.5 via VRFConsumerV2Production contract
//! - 5 minute timeout with fallback (triggerFallback via block.prevrandao)
//! - Polling-based VRF status checking
//! - Contract interaction via ethers-rs abigen! bindings
//!
//! Contract: VRFConsumerV2Production.sol (527 lines)
//! Key functions:
//! - requestProverSelection(bytes32) → uint256 requestId
//! - isProverSelected(bytes32) → bool
//! - getSelectedProver(bytes32) → (address, uint256)
//! - triggerFallback(bytes32) → address
//! - checkTimeout(bytes32) → (bool, uint256)

use std::sync::Arc;
use std::time::Duration;

use anyhow::Result;
use ethers::prelude::*;
use sha3::{Digest, Sha3_256};
use tracing::{info, warn, instrument, debug};

use crate::config::VRFConfig;
use crate::types::{VRFRequest, VRFStatus};

// Generate Rust bindings from VRFConsumerV2Production ABI
abigen!(
    VRFConsumerContract,
    "abi/VRFConsumerV2Production.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

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
/// 1. requestProverSelection() - Request VRF random value via Chainlink
/// 2. Poll isProverSelected() - Check if VRF fulfilled
/// 3. getSelectedProver() - Get selected prover address + random value
/// 4. triggerFallback() - Use prevrandao after 5 min timeout
///
/// When `contract` is None, the service operates in dev mode (stub behavior).
/// When `contract` is Some, all calls go to the real VRFConsumerV2Production contract.
pub struct VRFService {
    /// VRF configuration
    config: VRFConfig,
    /// Contract binding (None if VRF contract not configured)
    contract: Option<VRFConsumerContract<SignerMiddleware<Provider<Http>, LocalWallet>>>,
    /// Read-only contract for view calls (None if not configured)
    read_contract: Option<VRFConsumerContract<Provider<Http>>>,
}

impl VRFService {
    /// Create new VRF service
    ///
    /// If `private_key` is set and `contract_address` is not the zero address,
    /// creates real contract bindings. Otherwise, operates in dev/stub mode.
    ///
    /// In production mode (RUN_MODE=production), the service MUST have a real
    /// contract connection. Dev mode stubs are not allowed in production.
    pub async fn new(config: &VRFConfig) -> Result<Self> {
        let is_zero_addr = config.contract_address == "0x0000000000000000000000000000000000000000";
        let run_mode = std::env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

        if is_zero_addr || config.private_key.is_none() {
            if run_mode == "production" {
                anyhow::bail!(
                    "VRF contract not configured in production mode. \
                     Set vrf.contract_address and vrf.private_key for production deployment."
                );
            }
            info!(
                contract_address = %config.contract_address,
                "VRF Service initialized in DEV MODE (no contract connection)"
            );
            return Ok(Self {
                config: config.clone(),
                contract: None,
                read_contract: None,
            });
        }

        // Parse contract address
        let address: Address = config.contract_address.parse()
            .map_err(|e| anyhow::anyhow!("Invalid VRF contract address: {}", e))?;

        // Create provider
        let provider = Provider::<Http>::try_from(&config.rpc_url)
            .map_err(|e| anyhow::anyhow!("Failed to create provider: {}", e))?;

        // Create read-only contract for view calls
        let read_contract = VRFConsumerContract::new(address, Arc::new(provider.clone()));

        // Create signer for write calls
        let private_key = config.private_key.as_ref().unwrap();
        let key_hex = private_key.strip_prefix("0x").unwrap_or(private_key);
        let wallet: LocalWallet = key_hex.parse::<LocalWallet>()
            .map_err(|e| anyhow::anyhow!("Invalid VRF private key: {}", e))?
            .with_chain_id(config.chain_id);

        let signer = SignerMiddleware::new(provider, wallet);
        let contract = VRFConsumerContract::new(address, Arc::new(signer));

        info!(
            contract_address = %config.contract_address,
            chain_id = config.chain_id,
            "VRF Service initialized with LIVE contract connection"
        );

        Ok(Self {
            config: config.clone(),
            contract: Some(contract),
            read_contract: Some(read_contract),
        })
    }

    /// Check if the service is connected to a real contract
    pub fn is_connected(&self) -> bool {
        self.contract.is_some()
    }

    /// Request VRF prover selection
    ///
    /// SEQUENCES §2.3: VRF seed取得
    ///
    /// Calls VRFConsumerV2Production.requestProverSelection(bytes32)
    /// Returns the VRF request ID (uint256 from contract, returned as hex string)
    #[instrument(skip(self), fields(unlock_request_id = %unlock_request_id))]
    pub async fn request_prover_selection(
        &self,
        unlock_request_id: &str,
    ) -> Result<String, VRFError> {
        info!("Requesting VRF prover selection");

        // Dev mode: generate local request ID
        if self.contract.is_none() {
            let vrf_request_id = self.generate_vrf_request_id(unlock_request_id);
            info!(vrf_request_id = %vrf_request_id, "VRF request created (DEV MODE)");
            return Ok(vrf_request_id);
        }

        let contract = self.contract.as_ref().unwrap();
        let unlock_bytes = hex_to_bytes32(unlock_request_id)?;

        let tx = contract.request_prover_selection(unlock_bytes);
        let pending_tx = tx.send().await
            .map_err(|e| VRFError::ContractError(format!("requestProverSelection tx failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();
        info!(tx_hash = %tx_hash, "requestProverSelection transaction submitted");

        // Wait for receipt to get the VRF request ID from the event
        let receipt = pending_tx.await
            .map_err(|e| VRFError::ContractError(format!("requestProverSelection receipt failed: {}", e)))?
            .ok_or_else(|| VRFError::ContractError("No receipt for requestProverSelection".into()))?;

        // Extract VRF request ID from VRFRequested event log
        let vrf_request_id = self.extract_vrf_request_id_from_receipt(&receipt)?;

        info!(
            vrf_request_id = %vrf_request_id,
            tx_hash = %tx_hash,
            "VRF prover selection requested on-chain"
        );

        Ok(vrf_request_id)
    }

    /// Check if prover has been selected (VRF fulfilled)
    ///
    /// SEQUENCES §2.4: VRF result available check
    /// Calls VRFConsumerV2Production.isProverSelected(bytes32)
    #[instrument(skip(self), fields(unlock_request_id = %unlock_request_id))]
    pub async fn is_prover_selected(&self, unlock_request_id: &str) -> Result<bool, VRFError> {
        debug!("Checking VRF selection status");

        // Dev mode: always false (never fulfilled)
        if self.read_contract.is_none() {
            return Ok(false);
        }

        let contract = self.read_contract.as_ref().unwrap();
        let unlock_bytes = hex_to_bytes32(unlock_request_id)?;

        let is_selected = contract.is_prover_selected(unlock_bytes).call().await
            .map_err(|e| VRFError::ContractError(format!("isProverSelected failed: {}", e)))?;

        debug!(is_selected = is_selected, "VRF selection status checked");
        Ok(is_selected)
    }

    /// Get selected prover after VRF fulfillment
    ///
    /// SEQUENCES §2.4: Prover選出結果取得
    /// Calls VRFConsumerV2Production.getSelectedProver(bytes32)
    ///
    /// Returns (prover_address, random_value)
    #[instrument(skip(self), fields(unlock_request_id = %unlock_request_id))]
    pub async fn get_selected_prover(
        &self,
        unlock_request_id: &str,
    ) -> Result<(String, String), VRFError> {
        info!("Getting selected prover");

        // Dev mode: return stub
        if self.read_contract.is_none() {
            if !self.is_prover_selected(unlock_request_id).await? {
                return Err(VRFError::RequestNotFound(unlock_request_id.to_string()));
            }
            return Ok((
                "0x0000000000000000000000000000000000000001".to_string(),
                "0x1234567890abcdef".to_string(),
            ));
        }

        let contract = self.read_contract.as_ref().unwrap();
        let unlock_bytes = hex_to_bytes32(unlock_request_id)?;

        let (prover, random_value) = contract.get_selected_prover(unlock_bytes).call().await
            .map_err(|e| VRFError::ContractError(format!("getSelectedProver failed: {}", e)))?;

        let prover_addr = format!("{:?}", prover);
        // U256 → 32-byte big-endian representation
        let mut random_bytes = [0u8; 32];
        random_value.to_big_endian(&mut random_bytes);
        let random_hex = format!("0x{}", hex::encode(random_bytes));

        info!(
            prover = %prover_addr,
            random_value = %random_hex,
            "Selected prover retrieved from contract"
        );

        Ok((prover_addr, random_hex))
    }

    /// Check VRF timeout status
    ///
    /// SEQUENCES §2.3: 5分タイムアウト確認
    /// Calls VRFConsumerV2Production.checkTimeout(bytes32)
    ///
    /// Returns (is_timed_out, time_remaining_seconds)
    #[instrument(skip(self), fields(unlock_request_id = %unlock_request_id))]
    pub async fn check_timeout(
        &self,
        unlock_request_id: &str,
        requested_at: u64,
    ) -> Result<(bool, u64), VRFError> {
        // If contract connected, use on-chain timeout check
        if let Some(contract) = &self.read_contract {
            let unlock_bytes = hex_to_bytes32(unlock_request_id)?;

            let (is_timed_out, time_remaining) = contract.check_timeout(unlock_bytes).call().await
                .map_err(|e| VRFError::ContractError(format!("checkTimeout failed: {}", e)))?;

            return Ok((is_timed_out, time_remaining.as_u64()));
        }

        // Dev mode: compute locally
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
    /// Calls VRFConsumerV2Production.triggerFallback(bytes32)
    ///
    /// Returns selected prover address
    #[instrument(skip(self), fields(unlock_request_id = %unlock_request_id))]
    pub async fn trigger_fallback(
        &self,
        unlock_request_id: &str,
    ) -> Result<String, VRFError> {
        warn!("Triggering VRF fallback");

        // Dev mode: return stub
        if self.contract.is_none() {
            let fallback_prover = "0x0000000000000000000000000000000000000002".to_string();
            info!(prover = %fallback_prover, "Fallback prover selected (DEV MODE)");
            return Ok(fallback_prover);
        }

        let contract = self.contract.as_ref().unwrap();
        let unlock_bytes = hex_to_bytes32(unlock_request_id)?;

        let tx = contract.trigger_fallback(unlock_bytes);
        let pending_tx = tx.send().await
            .map_err(|e| VRFError::ContractError(format!("triggerFallback tx failed: {}", e)))?;

        let tx_hash = pending_tx.tx_hash();
        info!(tx_hash = %tx_hash, "triggerFallback transaction submitted");

        // Wait for receipt
        let receipt = pending_tx.await
            .map_err(|e| VRFError::ContractError(format!("triggerFallback receipt failed: {}", e)))?
            .ok_or_else(|| VRFError::ContractError("No receipt for triggerFallback".into()))?;

        // Extract fallback prover from FallbackProverSelected event
        let prover_addr = self.extract_fallback_prover_from_receipt(&receipt)?;

        info!(
            prover = %prover_addr,
            tx_hash = %tx_hash,
            "Fallback prover selected on-chain"
        );

        Ok(prover_addr)
    }

    /// Wait for VRF selection with polling
    ///
    /// Implements polling loop with timeout (SEQUENCES §2.3-§2.4):
    /// 1. Poll isProverSelected() every `polling_interval_seconds`
    /// 2. If fulfilled → getSelectedProver() and return
    /// 3. If timeout (5 min) → triggerFallback() and return
    ///
    /// Returns (prover_address, random_value, status)
    #[instrument(skip(self), fields(unlock_request_id = %unlock_request_id))]
    pub async fn wait_for_selection(
        &self,
        unlock_request_id: &str,
        _requested_at: u64,
        timeout: Duration,
    ) -> Result<(String, String, VRFStatus), VRFError> {
        let start = std::time::Instant::now();
        let poll_interval = Duration::from_secs(self.config.polling_interval_seconds);

        info!(timeout_secs = timeout.as_secs(), "Waiting for VRF selection");

        // Dev mode: Skip polling if contract is not configured
        if !self.is_connected() {
            warn!("VRF contract not configured, using immediate fallback");
            let prover = self.trigger_fallback(unlock_request_id).await?;
            let random = self.generate_fallback_random(unlock_request_id);
            return Ok((prover, random, VRFStatus::FallbackUsed));
        }

        loop {
            // Check if VRF is fulfilled
            if self.is_prover_selected(unlock_request_id).await? {
                let (prover, random) = self.get_selected_prover(unlock_request_id).await?;
                info!(prover = %prover, "VRF fulfilled, prover selected");
                return Ok((prover, random, VRFStatus::Fulfilled));
            }

            // Check timeout
            if start.elapsed() >= timeout {
                warn!("VRF timeout reached, triggering fallback");
                let prover = self.trigger_fallback(unlock_request_id).await?;
                let random = self.generate_fallback_random(unlock_request_id);
                return Ok((prover, random, VRFStatus::FallbackUsed));
            }

            // Wait before next poll
            tokio::time::sleep(poll_interval).await;
        }
    }

    /// Get the number of active provers from the contract
    #[instrument(skip(self))]
    pub async fn get_active_prover_count(&self) -> Result<u64, VRFError> {
        if let Some(contract) = &self.read_contract {
            let count = contract.get_active_prover_count().call().await
                .map_err(|e| VRFError::ContractError(format!("getActiveProverCount failed: {}", e)))?;
            Ok(count.as_u64())
        } else {
            Ok(0)
        }
    }

    /// Get all provers from the contract pool
    #[instrument(skip(self))]
    pub async fn get_all_provers(&self) -> Result<Vec<(Address, U256, bool)>, VRFError> {
        if let Some(contract) = &self.read_contract {
            let provers = contract.get_all_provers().call().await
                .map_err(|e| VRFError::ContractError(format!("getAllProvers failed: {}", e)))?;

            Ok(provers.iter().map(|p| (p.prover, p.stake, p.active)).collect())
        } else {
            Ok(vec![])
        }
    }

    // ========================================================================
    // Helper methods
    // ========================================================================

    /// Extract VRF request ID from VRFRequested event in transaction receipt
    fn extract_vrf_request_id_from_receipt(
        &self,
        receipt: &TransactionReceipt,
    ) -> Result<String, VRFError> {
        for log in &receipt.logs {
            if !log.topics.is_empty() {
                // Try to decode from the contract's generated event parser
                if let Ok(event) = VRFConsumerContractEvents::decode_log(&ethers::abi::RawLog {
                    topics: log.topics.clone(),
                    data: log.data.to_vec(),
                }) {
                    // ethers abigen generates VrfRequestedFilter for VRFRequested event
                    if let VRFConsumerContractEvents::VrfrequestedFilter(e) = event {
                        let mut bytes = [0u8; 32];
                        e.request_id.to_big_endian(&mut bytes);
                        return Ok(format!("0x{}", hex::encode(bytes)));
                    }
                }
            }
        }

        // Fallback: use tx hash as request ID
        let tx_hash = receipt.transaction_hash;
        warn!(
            tx_hash = %tx_hash,
            "Could not extract VRF request ID from events, using tx hash"
        );
        Ok(format!("{:?}", tx_hash))
    }

    /// Extract fallback prover from FallbackProverSelected event
    fn extract_fallback_prover_from_receipt(
        &self,
        receipt: &TransactionReceipt,
    ) -> Result<String, VRFError> {
        for log in &receipt.logs {
            if !log.topics.is_empty() {
                if let Ok(event) = VRFConsumerContractEvents::decode_log(&ethers::abi::RawLog {
                    topics: log.topics.clone(),
                    data: log.data.to_vec(),
                }) {
                    match event {
                        VRFConsumerContractEvents::FallbackProverSelectedFilter(e) => {
                            return Ok(format!("{:?}", e.prover));
                        },
                        _ => continue,
                    }
                }
            }
        }

        Err(VRFError::ContractError(
            "FallbackProverSelected event not found in receipt".into()
        ))
    }

    /// Generate VRF request ID from unlock request ID (dev mode only)
    fn generate_vrf_request_id(&self, unlock_request_id: &str) -> String {
        let mut hasher = Sha3_256::new();
        hasher.update(b"VRF_REQUEST_");
        hasher.update(unlock_request_id.as_bytes());
        hasher.update(chrono::Utc::now().timestamp().to_be_bytes());
        let result = hasher.finalize();
        format!("0x{}", hex::encode(result))
    }

    /// Generate fallback random value (for dev mode or as supplementary entropy)
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

    /// Select provers using VRF random value (2 of N)
    ///
    /// Uses SHA3-256 hash of random value to deterministically select 2 provers
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
}

/// Parse hex string (with or without 0x prefix) to [u8; 32]
fn hex_to_bytes32(hex_str: &str) -> Result<[u8; 32], VRFError> {
    let clean = hex_str.strip_prefix("0x").unwrap_or(hex_str);
    let bytes = hex::decode(clean)
        .map_err(|e| VRFError::ContractError(format!("Invalid hex: {}", e)))?;
    if bytes.len() != 32 {
        return Err(VRFError::ContractError(format!(
            "Expected 32 bytes, got {}",
            bytes.len()
        )));
    }
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes);
    Ok(arr)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_vrf_service_creation_dev_mode() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();
        assert_eq!(service.config.timeout_seconds, 300);
        assert!(!service.is_connected());
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
    async fn test_check_timeout_not_reached_dev_mode() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let now = chrono::Utc::now().timestamp() as u64;
        let (is_timeout, remaining) = service.check_timeout("unlock_123", now).await.unwrap();

        assert!(!is_timeout);
        assert!(remaining > 0);
    }

    #[tokio::test]
    async fn test_check_timeout_reached_dev_mode() {
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
    async fn test_request_prover_selection_dev_mode() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let result = service.request_prover_selection("unlock_123").await;
        assert!(result.is_ok());

        let request_id = result.unwrap();
        assert!(request_id.starts_with("0x"));
    }

    #[tokio::test]
    async fn test_trigger_fallback_dev_mode() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let result = service.trigger_fallback("unlock_123").await;
        assert!(result.is_ok());

        let prover = result.unwrap();
        assert!(prover.starts_with("0x"));
    }

    #[tokio::test]
    async fn test_is_prover_selected_dev_mode() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let result = service.is_prover_selected("unlock_123").await.unwrap();
        assert!(!result, "Dev mode should always return false");
    }

    #[tokio::test]
    async fn test_wait_for_selection_dev_mode_immediate_fallback() {
        let config = VRFConfig::default();
        let service = VRFService::new(&config).await.unwrap();

        let now = chrono::Utc::now().timestamp() as u64;
        let (prover, random, status) = service
            .wait_for_selection("unlock_123", now, Duration::from_secs(10))
            .await
            .unwrap();

        assert!(prover.starts_with("0x"));
        assert!(random.starts_with("0x"));
        assert_eq!(status, VRFStatus::FallbackUsed);
    }

    #[test]
    fn test_select_provers() {
        let config = VRFConfig::default();
        let service = VRFService {
            config,
            contract: None,
            read_contract: None,
        };

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
        let service = VRFService {
            config,
            contract: None,
            read_contract: None,
        };

        let provers = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let s1 = service.select_provers("same_seed", &provers);
        let s2 = service.select_provers("same_seed", &provers);
        assert_eq!(s1, s2);
    }

    #[test]
    fn test_hex_to_bytes32_valid() {
        let hex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        let result = hex_to_bytes32(hex);
        assert!(result.is_ok());
        let bytes = result.unwrap();
        assert_eq!(bytes[0], 0x12);
        assert_eq!(bytes[31], 0xef);
    }

    #[test]
    fn test_hex_to_bytes32_no_prefix() {
        let hex = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        let result = hex_to_bytes32(hex);
        assert!(result.is_ok());
    }

    #[test]
    fn test_hex_to_bytes32_wrong_length() {
        let hex = "0x1234";
        let result = hex_to_bytes32(hex);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_active_prover_count_dev_mode() {
        let config = VRFConfig::default();
        let service = VRFService {
            config,
            contract: None,
            read_contract: None,
        };

        let rt = tokio::runtime::Runtime::new().unwrap();
        let count = rt.block_on(service.get_active_prover_count()).unwrap();
        assert_eq!(count, 0);
    }
}
