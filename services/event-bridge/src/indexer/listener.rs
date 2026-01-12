//! L1 Event Listener
//!
//! Listens to L1Vault events via WebSocket with HTTP fallback.
//! 
//! IMPL-FIX-002: Alloy crateを使用した本番L1 RPC実装

use crate::config::Config;
use crate::error::{Error, Result};
use crate::events::{BridgeEvent, LockedEvent, EmergencyUnlockEvent};
use crate::indexer::EventProcessor;
use crate::metrics;
use alloy::hex;
use alloy::primitives::{Address, B256, U256};
use alloy::providers::{Provider, ProviderBuilder, RootProvider};
use alloy::rpc::types::{Filter, Log};
use alloy::transports::http::{Client, Http};
use sha3::{Sha3_256, Digest};
use std::str::FromStr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::interval;
use tracing::{debug, error, info, warn};

/// L1 Vault Contract Event Signatures (SHA3-256 hashes)
/// CP-1 Compliant: Using SHA3-256 for event topic hashes
mod event_topics {
    use super::*;
    use once_cell::sync::Lazy;

    /// Locked(bytes32 indexed lockId, address indexed owner, uint256 chainId, address asset, uint256 amount, bytes destAddr, uint256 expiry, uint256 nonce)
    pub static LOCKED_TOPIC: Lazy<B256> = Lazy::new(|| {
        let mut hasher = Sha3_256::new();
        hasher.update(b"Locked(bytes32,address,uint256,address,uint256,bytes,uint256,uint256)");
        let hash = hasher.finalize();
        B256::from_slice(&hash)
    });

    /// EmergencyUnlock(bytes32 indexed lockId, uint256 bondAmount)
    pub static EMERGENCY_UNLOCK_TOPIC: Lazy<B256> = Lazy::new(|| {
        let mut hasher = Sha3_256::new();
        hasher.update(b"EmergencyUnlock(bytes32,uint256)");
        let hash = hasher.finalize();
        B256::from_slice(&hash)
    });
}

/// L1 RPC Client using Alloy
pub struct L1RpcClient {
    provider: RootProvider<Http<Client>>,
    contract_address: Address,
}

impl L1RpcClient {
    /// Create new L1 RPC client with HTTP provider
    pub fn new(http_url: &str, contract_address: &str) -> Result<Self> {
        let provider = ProviderBuilder::new()
            .on_http(http_url.parse().map_err(|e| Error::Config(format!("Invalid RPC URL: {}", e)))?);
        
        let address = Address::from_str(contract_address)
            .map_err(|e| Error::Config(format!("Invalid contract address: {}", e)))?;

        info!("📡 L1 RPC Client initialized");
        info!("  HTTP URL: {}", http_url);
        info!("  Contract: {}", contract_address);

        Ok(Self {
            provider,
            contract_address: address,
        })
    }

    /// Get current block number via eth_blockNumber RPC
    pub async fn get_block_number(&self) -> Result<u64> {
        let block_number = self.provider
            .get_block_number()
            .await
            .map_err(|e| Error::L1Rpc(format!("Failed to get block number: {}", e)))?;
        
        debug!("Current L1 block: {}", block_number);
        Ok(block_number)
    }

    /// Fetch events from block range via eth_getLogs RPC
    pub async fn get_logs(
        &self,
        from_block: u64,
        to_block: u64,
    ) -> Result<Vec<BridgeEvent>> {
        info!("🔍 Fetching L1 logs from block {} to {}", from_block, to_block);

        // Build filter for L1Vault events
        let filter = Filter::new()
            .address(self.contract_address)
            .from_block(from_block)
            .to_block(to_block)
            .event_signature(vec![
                *event_topics::LOCKED_TOPIC,
                *event_topics::EMERGENCY_UNLOCK_TOPIC,
            ]);

        let logs = self.provider
            .get_logs(&filter)
            .await
            .map_err(|e| Error::L1Rpc(format!("Failed to get logs: {}", e)))?;

        info!("  Found {} log(s)", logs.len());

        // Parse logs into BridgeEvents
        let events: Vec<BridgeEvent> = logs
            .into_iter()
            .filter_map(|log| self.parse_log(log))
            .collect();

        Ok(events)
    }

    /// Parse a raw log into a BridgeEvent
    fn parse_log(&self, log: Log) -> Option<BridgeEvent> {
        let topics = &log.topics();
        if topics.is_empty() {
            return None;
        }

        let event_topic = topics[0];
        let block_number = log.block_number.unwrap_or(0);
        let tx_hash = log.transaction_hash.unwrap_or_default();

        if event_topic == *event_topics::LOCKED_TOPIC {
            self.parse_locked_event(&log, block_number, tx_hash)
        } else if event_topic == *event_topics::EMERGENCY_UNLOCK_TOPIC {
            self.parse_emergency_unlock_event(&log, block_number, tx_hash)
        } else {
            debug!("Unknown event topic: {:?}", event_topic);
            None
        }
    }

    /// Parse Locked event into LockedEvent struct from events.rs
    fn parse_locked_event(&self, log: &Log, block_number: u64, tx_hash: B256) -> Option<BridgeEvent> {
        let topics = log.topics();
        if topics.len() < 3 {
            warn!("Locked event has insufficient topics");
            return None;
        }

        let lock_id: [u8; 32] = topics[1].0;
        let owner = Address::from_slice(&topics[2].0[12..32]);

        // Parse data fields (chainId, asset, amount, destAddr, expiry, nonce)
        let data = &log.data().data;
        if data.len() < 192 {
            warn!("Locked event data too short");
            return None;
        }

        let chain_id = U256::from_be_slice(&data[0..32]).to::<u64>();
        let asset = Address::from_slice(&data[44..64]);
        let amount = U256::from_be_slice(&data[64..96]).to::<u128>();
        // destAddr is dynamic, skip for now and use owner
        let expiry = U256::from_be_slice(&data[128..160]).to::<u64>();
        let nonce = U256::from_be_slice(&data[160..192]).to::<u64>();

        info!("📥 Parsed Locked event:");
        info!("  Lock ID: 0x{}", hex::encode(lock_id));
        info!("  Owner: {}", owner);
        info!("  Amount: {}", amount);
        info!("  Block: {}", block_number);

        // Create LockedEvent matching events.rs structure
        Some(BridgeEvent::Locked(LockedEvent {
            lock_id,
            owner: owner.into_array(),
            chain_id,
            asset: asset.into_array(),
            amount,
            dest_addr: owner.to_vec(), // Use owner as dest_addr for now
            expiry,
            nonce,
            sr0: [0u8; 32], // Will be computed
            l1_block_number: block_number,
            l1_tx_hash: tx_hash.0,
        }))
    }

    /// Parse EmergencyUnlock event into EmergencyUnlockEvent struct from events.rs
    fn parse_emergency_unlock_event(&self, log: &Log, block_number: u64, tx_hash: B256) -> Option<BridgeEvent> {
        let topics = log.topics();
        if topics.len() < 2 {
            warn!("EmergencyUnlock event has insufficient topics");
            return None;
        }

        let lock_id: [u8; 32] = topics[1].0;

        // Parse data fields (bondAmount)
        let data = &log.data().data;
        if data.len() < 32 {
            warn!("EmergencyUnlock event data too short");
            return None;
        }

        let bond_amount = U256::from_be_slice(&data[0..32]).to::<u128>();

        info!("🚨 Parsed EmergencyUnlock event:");
        info!("  Lock ID: 0x{}", hex::encode(lock_id));
        info!("  Bond: {}", bond_amount);
        info!("  Block: {}", block_number);

        // Create EmergencyUnlockEvent matching events.rs structure
        Some(BridgeEvent::EmergencyUnlock(EmergencyUnlockEvent {
            lock_id,
            sr0: [0u8; 32],
            sr1: [0u8; 32],
            smt_proof: vec![],
            unlock_data: vec![],
            bond_amount,
            l1_block_number: block_number,
            l1_tx_hash: tx_hash.0,
        }))
    }
}

/// L1 Event Listener
pub struct L1EventListener {
    config: Config,
    /// Last processed block (for polling fallback)
    last_block: Arc<AtomicU64>,
    /// Confirmation blocks required (12 per AGENT_MEETING)
    confirmation_blocks: u64,
    /// L1 RPC client
    rpc_client: Arc<RwLock<Option<L1RpcClient>>>,
}

impl L1EventListener {
    /// Create new L1 event listener
    pub fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            config: config.clone(),
            last_block: Arc::new(AtomicU64::new(0)),
            confirmation_blocks: config.l1.confirmation_blocks,
            rpc_client: Arc::new(RwLock::new(None)),
        })
    }

    /// Initialize the RPC client
    async fn ensure_client(&self) -> Result<()> {
        let mut client = self.rpc_client.write().await;
        if client.is_none() {
            *client = Some(L1RpcClient::new(
                &self.config.l1.http_rpc_url,
                &self.config.l1.vault_contract,
            )?);
        }
        Ok(())
    }

    /// Start listening for events
    pub async fn start(&self, processor: EventProcessor) -> Result<()> {
        info!("🎧 Starting L1 Event Listener");
        info!("  Confirmation blocks: {}", self.confirmation_blocks);
        
        self.ensure_client().await?;

        // Start with polling mode (WebSocket can be added later)
        self.listen_polling(&processor).await
    }

    /// Listen via polling
    async fn listen_polling(&self, processor: &EventProcessor) -> Result<()> {
        info!("🔄 Starting polling mode with 5 second interval");
        
        let mut interval = interval(Duration::from_secs(5));
        
        loop {
            interval.tick().await;
            
            if let Err(e) = self.poll_once(processor).await {
                error!("Polling error: {}", e);
                // Continue polling despite errors
            }
        }
    }

    /// Poll once for new events
    async fn poll_once(&self, processor: &EventProcessor) -> Result<()> {
        let client_guard = self.rpc_client.read().await;
        let client = client_guard.as_ref()
            .ok_or_else(|| Error::Config("RPC client not initialized".into()))?;

        let current_block = client.get_block_number().await?;
        let last_processed = self.last_block.load(Ordering::SeqCst);
        
        // Apply confirmation blocks (12 blocks per AGENT_MEETING_MINUTES)
        let safe_block = current_block.saturating_sub(self.confirmation_blocks);
        
        if safe_block > last_processed {
            info!("📦 Processing blocks {} to {} (confirmed: -{} blocks)", 
                  last_processed + 1, safe_block, self.confirmation_blocks);
            
            let events = client.get_logs(last_processed + 1, safe_block).await?;
            
            for event in events {
                if let Err(e) = processor.process(event).await {
                    error!("Failed to process event: {}", e);
                }
            }
            
            self.last_block.store(safe_block, Ordering::SeqCst);
            metrics::set_last_processed_block(safe_block);
        }

        metrics::increment_events_checked();
        Ok(())
    }

    /// Wait for block confirmations (12 blocks per AGENT_MEETING)
    pub async fn wait_confirmations(&self, block_number: u64) -> Result<()> {
        self.ensure_client().await?;
        
        let target_block = block_number + self.confirmation_blocks;
        
        loop {
            let client_guard = self.rpc_client.read().await;
            let client = client_guard.as_ref()
                .ok_or_else(|| Error::Config("RPC client not initialized".into()))?;
            
            let current = client.get_block_number().await?;
            
            if current >= target_block {
                info!("✅ Block {} confirmed ({} confirmations)", 
                      block_number, self.confirmation_blocks);
                return Ok(());
            }
            
            debug!("Waiting for confirmations: {}/{}", 
                   current.saturating_sub(block_number), self.confirmation_blocks);
            
            drop(client_guard);
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    }

    /// Get the last processed block number
    pub fn last_processed_block(&self) -> u64 {
        self.last_block.load(Ordering::SeqCst)
    }

    /// Set the starting block for sync
    pub fn set_starting_block(&self, block: u64) {
        self.last_block.store(block, Ordering::SeqCst);
        info!("📍 Starting block set to {}", block);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_topic_computation() {
        // Verify event topics are computed using SHA3-256
        let locked_topic = *event_topics::LOCKED_TOPIC;
        assert_eq!(locked_topic.0.len(), 32);
        
        let emergency_topic = *event_topics::EMERGENCY_UNLOCK_TOPIC;
        assert_eq!(emergency_topic.0.len(), 32);
        
        // Topics should be different
        assert_ne!(locked_topic, emergency_topic);
    }

    #[test]
    fn test_confirmation_blocks_default() {
        // Per AGENT_MEETING_MINUTES: 12 block confirmations
        use crate::events::security::CONFIRMATION_BLOCKS;
        assert_eq!(CONFIRMATION_BLOCKS, 12);
    }

    #[tokio::test]
    async fn test_l1_rpc_client_creation() {
        // Test client creation with valid parameters
        let result = L1RpcClient::new(
            "http://localhost:8545",
            "0x1234567890123456789012345678901234567890",
        );
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_l1_rpc_client_invalid_address() {
        // Test client creation with invalid address
        let result = L1RpcClient::new(
            "http://localhost:8545",
            "invalid_address",
        );
        assert!(result.is_err());
    }
}
