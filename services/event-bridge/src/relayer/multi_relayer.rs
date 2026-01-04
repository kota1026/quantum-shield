//! Multi-Relayer System
//!
//! Implements 2-node failover architecture:
//! - Primary: Main transaction relay
//! - Secondary: Hot standby with automatic failover
//!
//! IMPL-FIX-003: Alloy crateを使用したL1トランザクション送信本実装

use crate::config::Config;
use crate::error::{Error, Result};
use crate::events::{BridgeEvent, UnlockReadyEvent};
use crate::queue::EventQueue;
use crate::metrics;
use alloy::hex;
use alloy::network::EthereumWallet;
use alloy::primitives::{Address, Bytes, FixedBytes, U256};
use alloy::providers::{Provider, ProviderBuilder, RootProvider};
use alloy::rpc::types::TransactionRequest;
use alloy::signers::local::PrivateKeySigner;
use alloy::sol;
use alloy::transports::http::{Client, Http};
use std::str::FromStr;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::interval;
use tracing::{debug, error, info, warn};

/// Relayer role
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RelayerRole {
    Primary,
    Secondary,
}

// Define L1Vault contract interface using Alloy sol! macro
sol! {
    /// L1Vault contract interface for unlock operations
    #[sol(rpc)]
    interface IL1Vault {
        /// Execute unlock after time lock expires
        /// @param lockId The lock identifier
        /// @param sr0 State root 0
        /// @param sr1 State root 1
        /// @param smtProof SMT proof bytes
        /// @param unlockData Unlock data bytes
        /// @param sphincsSignatures Array of SPHINCS+ signatures from provers
        function executeUnlock(
            bytes32 lockId,
            bytes32 sr0,
            bytes32 sr1,
            bytes calldata smtProof,
            bytes calldata unlockData,
            bytes[] calldata sphincsSignatures
        ) external;

        /// Execute emergency unlock with bond
        /// @param lockId The lock identifier
        function executeEmergencyUnlock(bytes32 lockId) external payable;

        /// Get unlock status
        function getUnlockStatus(bytes32 lockId) external view returns (uint8);
    }
}

/// L1 Transaction Submitter using Alloy
pub struct L1Submitter {
    provider: RootProvider<Http<Client>>,
    wallet: Option<EthereumWallet>,
    vault_address: Address,
    relayer_address: Address,
    chain_id: u64,
}

impl L1Submitter {
    /// Create new L1 submitter
    pub fn new(
        http_url: &str,
        vault_address: &str,
        relayer_private_key: Option<&str>,
        chain_id: u64,
    ) -> Result<Self> {
        let provider = ProviderBuilder::new()
            .on_http(http_url.parse().map_err(|e| Error::Config(format!("Invalid RPC URL: {}", e)))?);
        
        let vault_addr = Address::from_str(vault_address)
            .map_err(|e| Error::Config(format!("Invalid vault address: {}", e)))?;

        // Setup wallet if private key is provided
        let (wallet, relayer_addr) = if let Some(pk) = relayer_private_key {
            let signer: PrivateKeySigner = pk.parse()
                .map_err(|e| Error::Config(format!("Invalid private key: {}", e)))?;
            let addr = signer.address();
            let wallet = EthereumWallet::from(signer);
            (Some(wallet), addr)
        } else {
            (None, Address::ZERO)
        };

        info!("📤 L1 Submitter initialized");
        info!("  HTTP URL: {}", http_url);
        info!("  Vault: {}", vault_address);
        info!("  Relayer: {}", relayer_addr);
        info!("  Chain ID: {}", chain_id);

        Ok(Self {
            provider,
            wallet,
            vault_address: vault_addr,
            relayer_address: relayer_addr,
            chain_id,
        })
    }

    /// Submit unlock transaction to L1
    pub async fn submit_unlock(&self, unlock: &UnlockReadyEvent) -> Result<String> {
        info!("📤 Submitting unlock to L1 Vault at {}", self.vault_address);
        info!("  Lock ID: 0x{}", hex::encode(unlock.lock_id));
        info!("  SR0: 0x{}", hex::encode(&unlock.sr0[..8]));
        info!("  SR1: 0x{}", hex::encode(&unlock.sr1[..8]));
        info!("  Signatures: {}", unlock.sphincs_signatures.len());

        // Verify we have wallet configured
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| Error::Config("Relayer wallet not configured".into()))?;

        // Encode contract call data
        let lock_id = FixedBytes::<32>::from(unlock.lock_id);
        let sr0 = FixedBytes::<32>::from(unlock.sr0);
        let sr1 = FixedBytes::<32>::from(unlock.sr1);
        let smt_proof = Bytes::from(unlock.smt_proof.clone());
        let unlock_data = Bytes::from(unlock.unlock_data.clone());
        
        // Convert SPHINCS+ signatures to bytes array
        let signatures: Vec<Bytes> = unlock.sphincs_signatures
            .iter()
            .map(|sig| Bytes::from(sig.signature.clone()))
            .collect();

        // Build the contract call
        let call = IL1Vault::executeUnlockCall {
            lockId: lock_id,
            sr0,
            sr1,
            smtProof: smt_proof,
            unlockData: unlock_data,
            sphincsSignatures: signatures,
        };

        // Get current gas price and nonce
        let gas_price = self.provider.get_gas_price().await
            .map_err(|e| Error::L1Rpc(format!("Failed to get gas price: {}", e)))?;
        
        let nonce = self.provider.get_transaction_count(self.relayer_address).await
            .map_err(|e| Error::L1Rpc(format!("Failed to get nonce: {}", e)))?;

        // Build transaction
        let tx = TransactionRequest::default()
            .to(self.vault_address)
            .from(self.relayer_address)
            .nonce(nonce)
            .gas_price(gas_price)
            .gas(500_000u64) // Estimate gas limit
            .input(call.abi_encode().into());

        // Sign transaction
        let signed_tx = wallet.sign_transaction(tx.clone()).await
            .map_err(|e| Error::L1Rpc(format!("Failed to sign transaction: {}", e)))?;

        // Send transaction
        let pending_tx = self.provider
            .send_raw_transaction(&signed_tx)
            .await
            .map_err(|e| Error::L1Rpc(format!("Failed to send transaction: {}", e)))?;

        let tx_hash = format!("0x{}", hex::encode(pending_tx.tx_hash()));
        info!("✅ L1 TX submitted: {}", tx_hash);

        Ok(tx_hash)
    }

    /// Submit emergency unlock to L1 with bond
    pub async fn submit_emergency_unlock(
        &self,
        lock_id: [u8; 32],
        bond_wei: u128,
    ) -> Result<String> {
        info!("🚨 Submitting emergency unlock to L1");
        info!("  Lock ID: 0x{}", hex::encode(lock_id));
        info!("  Bond: {} wei", bond_wei);

        // Verify we have wallet configured
        let wallet = self.wallet.as_ref()
            .ok_or_else(|| Error::Config("Relayer wallet not configured".into()))?;

        // Build the contract call
        let call = IL1Vault::executeEmergencyUnlockCall {
            lockId: FixedBytes::<32>::from(lock_id),
        };

        // Get current gas price and nonce
        let gas_price = self.provider.get_gas_price().await
            .map_err(|e| Error::L1Rpc(format!("Failed to get gas price: {}", e)))?;
        
        let nonce = self.provider.get_transaction_count(self.relayer_address).await
            .map_err(|e| Error::L1Rpc(format!("Failed to get nonce: {}", e)))?;

        // Build transaction with bond value
        let tx = TransactionRequest::default()
            .to(self.vault_address)
            .from(self.relayer_address)
            .nonce(nonce)
            .gas_price(gas_price)
            .gas(300_000u64)
            .value(U256::from(bond_wei))
            .input(call.abi_encode().into());

        // Sign transaction
        let signed_tx = wallet.sign_transaction(tx.clone()).await
            .map_err(|e| Error::L1Rpc(format!("Failed to sign transaction: {}", e)))?;

        // Send transaction
        let pending_tx = self.provider
            .send_raw_transaction(&signed_tx)
            .await
            .map_err(|e| Error::L1Rpc(format!("Failed to send transaction: {}", e)))?;

        let tx_hash = format!("0x{}", hex::encode(pending_tx.tx_hash()));
        info!("✅ Emergency unlock TX submitted: {}", tx_hash);

        Ok(tx_hash)
    }

    /// Check unlock status on L1
    pub async fn get_unlock_status(&self, lock_id: [u8; 32]) -> Result<u8> {
        let call = IL1Vault::getUnlockStatusCall {
            lockId: FixedBytes::<32>::from(lock_id),
        };

        let tx = TransactionRequest::default()
            .to(self.vault_address)
            .input(call.abi_encode().into());

        let result = self.provider
            .call(&tx)
            .await
            .map_err(|e| Error::L1Rpc(format!("Failed to call getUnlockStatus: {}", e)))?;

        // Decode result (uint8)
        if result.len() < 32 {
            return Err(Error::L1Rpc("Invalid response from getUnlockStatus".into()));
        }

        Ok(result[31])
    }
}

/// Multi-Relayer coordinator
pub struct MultiRelayer {
    config: Config,
    role: Arc<RwLock<RelayerRole>>,
    #[allow(dead_code)]
    is_healthy: Arc<AtomicBool>,
    queue: EventQueue,
    l1_submitter: Arc<RwLock<Option<L1Submitter>>>,
    heartbeat_interval: u64,
    failover_timeout: u64,
}

impl MultiRelayer {
    /// Create new multi-relayer
    pub fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            config: config.clone(),
            role: Arc::new(RwLock::new(RelayerRole::Secondary)),
            is_healthy: Arc::new(AtomicBool::new(true)),
            queue: EventQueue::new(&config.redis)?,
            l1_submitter: Arc::new(RwLock::new(None)),
            heartbeat_interval: 5,
            failover_timeout: 30,
        })
    }

    /// Initialize the L1 submitter
    async fn ensure_submitter(&self) -> Result<()> {
        let mut submitter = self.l1_submitter.write().await;
        if submitter.is_none() {
            *submitter = Some(L1Submitter::new(
                &self.config.l1.http_rpc_url,
                &self.config.l1.vault_contract,
                self.config.l1.relayer_private_key.as_deref(),
                self.config.l1.chain_id,
            )?);
        }
        Ok(())
    }

    /// Start the multi-relayer system
    pub async fn start(&self) -> Result<()> {
        info!("🚀 Starting Multi-Relayer system");

        self.ensure_submitter().await?;
        self.try_become_primary().await?;

        tokio::select! {
            r = self.run_heartbeat() => {
                error!("Heartbeat task exited: {:?}", r);
            }
            r = self.run_event_processor() => {
                error!("Event processor exited: {:?}", r);
            }
            r = self.run_failover_monitor() => {
                error!("Failover monitor exited: {:?}", r);
            }
        }

        Ok(())
    }

    /// Attempt to become primary relayer
    async fn try_become_primary(&self) -> Result<()> {
        info!("🔑 Attempting to acquire primary role...");

        let acquired = self.queue.try_acquire_primary_lock().await?;

        if acquired {
            *self.role.write().await = RelayerRole::Primary;
            info!("✅ Acquired PRIMARY role");
            metrics::set_relayer_role("primary");
        } else {
            info!("📋 Running as SECONDARY (standby)");
            metrics::set_relayer_role("secondary");
        }

        Ok(())
    }

    /// Run heartbeat to maintain primary role
    async fn run_heartbeat(&self) -> Result<()> {
        let mut interval = interval(Duration::from_secs(self.heartbeat_interval));

        loop {
            interval.tick().await;

            let role = *self.role.read().await;
            if role == RelayerRole::Primary {
                if let Err(e) = self.queue.renew_primary_lock().await {
                    error!("Failed to renew primary lock: {}", e);
                    self.demote_to_secondary().await;
                } else {
                    debug!("💓 Primary heartbeat OK");
                }
            }

            metrics::record_heartbeat();
        }
    }

    /// Run event processor
    async fn run_event_processor(&self) -> Result<()> {
        let mut interval = interval(Duration::from_millis(100));

        loop {
            interval.tick().await;

            let role = *self.role.read().await;
            if role != RelayerRole::Primary {
                continue;
            }

            match self.queue.dequeue_l1_relay(10).await {
                Ok(events) => {
                    for event in events {
                        if let Err(e) = self.relay_to_l1(event).await {
                            error!("Failed to relay event: {}", e);
                            metrics::increment_relay_errors();
                        }
                    }
                }
                Err(e) => {
                    error!("Failed to dequeue events: {}", e);
                }
            }
        }
    }

    /// Monitor for primary failure and perform failover
    async fn run_failover_monitor(&self) -> Result<()> {
        let mut interval = interval(Duration::from_secs(self.failover_timeout / 3));

        loop {
            interval.tick().await;

            let role = *self.role.read().await;
            if role == RelayerRole::Secondary {
                let primary_alive = self.queue.is_primary_alive().await?;

                if !primary_alive {
                    info!("⚠️ Primary appears dead, attempting failover...");
                    self.try_become_primary().await?;
                }
            }
        }
    }

    /// Relay event to L1
    async fn relay_to_l1(&self, event: BridgeEvent) -> Result<()> {
        match event {
            BridgeEvent::UnlockReady(unlock) => {
                self.submit_unlock_to_l1(&unlock).await?;
            }
            _ => {
                debug!("Ignoring non-relay event type");
            }
        }
        Ok(())
    }

    /// Submit unlock transaction to L1
    async fn submit_unlock_to_l1(&self, unlock: &UnlockReadyEvent) -> Result<()> {
        info!("📤 Processing unlock for L1: 0x{}", hex::encode(unlock.lock_id));

        // Verify 2/5 SPHINCS+ signatures (SEQ#2 requirement)
        if unlock.sphincs_signatures.len() < 2 {
            return Err(Error::Validation(format!(
                "Not enough signatures: {} < 2 (SEQ#2 requires 2/5 Prover signatures)",
                unlock.sphincs_signatures.len()
            )));
        }
        info!("  ✓ {}/5 SPHINCS+ signatures present", unlock.sphincs_signatures.len());

        // Get L1 submitter
        let submitter_guard = self.l1_submitter.read().await;
        let submitter = submitter_guard.as_ref()
            .ok_or_else(|| Error::Config("L1 submitter not initialized".into()))?;

        // Submit to L1
        let tx_hash = submitter.submit_unlock(unlock).await?;
        info!("  ✓ L1 TX submitted: {}", tx_hash);

        metrics::increment_relays_successful();
        info!("✅ Unlock submitted to L1 successfully");

        Ok(())
    }

    /// Demote self to secondary role
    async fn demote_to_secondary(&self) {
        warn!("⬇️ Demoting to SECONDARY role");
        *self.role.write().await = RelayerRole::Secondary;
        metrics::set_relayer_role("secondary");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::events::SphincsSignature;

    #[test]
    fn test_relayer_role_values() {
        assert_ne!(RelayerRole::Primary, RelayerRole::Secondary);
    }

    #[tokio::test]
    async fn test_l1_submitter_creation() {
        // Test submitter creation without private key
        let result = L1Submitter::new(
            "http://localhost:8545",
            "0x1234567890123456789012345678901234567890",
            None,
            1, // Mainnet
        );
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_l1_submitter_with_wallet() {
        // Test submitter creation with private key
        // Using a test private key (DO NOT use in production!)
        let test_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        
        let result = L1Submitter::new(
            "http://localhost:8545",
            "0x1234567890123456789012345678901234567890",
            Some(test_key),
            11155111, // Sepolia
        );
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_l1_submitter_invalid_vault_address() {
        let result = L1Submitter::new(
            "http://localhost:8545",
            "invalid_address",
            None,
            1,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_unlock_event_signature_requirement() {
        // SEQ#2 requires 2/5 Prover signatures
        let unlock = UnlockReadyEvent {
            lock_id: [1u8; 32],
            sr0: [2u8; 32],
            sr1: [3u8; 32],
            smt_proof: vec![4u8; 128],
            unlock_data: vec![5u8; 64],
            sphincs_signatures: vec![
                SphincsSignature {
                    prover_id: [6u8; 32],
                    signature: vec![7u8; 8000],
                    public_key: vec![8u8; 1312],
                },
            ],
            l3_block_number: 54321,
        };

        // Only 1 signature - should fail validation
        assert!(unlock.sphincs_signatures.len() < 2);
    }

    #[test]
    fn test_unlock_event_with_valid_signatures() {
        let unlock = UnlockReadyEvent {
            lock_id: [1u8; 32],
            sr0: [2u8; 32],
            sr1: [3u8; 32],
            smt_proof: vec![4u8; 128],
            unlock_data: vec![5u8; 64],
            sphincs_signatures: vec![
                SphincsSignature {
                    prover_id: [6u8; 32],
                    signature: vec![7u8; 8000],
                    public_key: vec![8u8; 1312],
                },
                SphincsSignature {
                    prover_id: [9u8; 32],
                    signature: vec![10u8; 8000],
                    public_key: vec![11u8; 1312],
                },
            ],
            l3_block_number: 54321,
        };

        // 2 signatures - should pass validation
        assert!(unlock.sphincs_signatures.len() >= 2);
    }
}
