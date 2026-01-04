//! L1 Event Listener
//!
//! Listens to L1Vault events via WebSocket with HTTP fallback.
//! 
//! IMPL-FIX-002: Alloy crateを使用した本番L1 RPC実装

use crate::config::Config;
use crate::error::{Error, Result};
use crate::events::BridgeEvent;
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

    /// Locked(bytes32 indexed lockId, address indexed owner, uint256 amount, address token, uint256 unlockTime, uint256 nonce, bytes data)
    pub static LOCKED_TOPIC: Lazy<B256> = Lazy::new(|| {
        let mut hasher = Sha3_256::new();
        hasher.update(b"Locked(bytes32,address,uint256,address,uint256,uint256,bytes)");
        let hash = hasher.finalize();
        B256::from_slice(&hash)
    });

    /// EmergencyUnlock(bytes32 indexed lockId, address indexed user, uint256 bond)
    pub static EMERGENCY_UNLOCK_TOPIC: Lazy<B256> = Lazy::new(|| {
        let mut hasher = Sha3_256::new();
        hasher.update(b"EmergencyUnlock(bytes32,address,uint256)");
        let hash = hasher.finalize();
        B256::from_slice(&hash)
    });

    /// Challenged(bytes32 indexed lockId, address indexed challenger, bytes32 challengeId)
    pub static CHALLENGED_TOPIC: Lazy<B256> = Lazy::new(|| {
        let mut hasher = Sha3_256::new();
        hasher.update(b"Challenged(bytes32,address,bytes32)");
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
                *event_topics::CHALLENGED_TOPIC,
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

        if event_topic == *event_topics::LOCKED_TOPIC {
            self.parse_locked_event(&log, block_number)
        } else if event_topic == *event_topics::EMERGENCY_UNLOCK_TOPIC {
            self.parse_emergency_unlock_event(&log, block_number)
        } else if event_topic == *event_topics::CHALLENGED_TOPIC {
            self.parse_challenged_event(&log, block_number)
        } else {
            debug!("Unknown event topic: {:?}", event_topic);
            None
        }
    }

    /// Parse Locked event
    fn parse_locked_event(&self, log: &Log, block_number: u64) -> Option<BridgeEvent> {
        let topics = log.topics();
        if topics.len() < 3 {
            warn!("Locked event has insufficient topics");
            return None;
        }

        let lock_id: [u8; 32] = topics[1].0;
        let owner = Address::from_slice(&topics[2].0[12..32]);

        // Parse data fields (amount, token, unlockTime, nonce, data)
        let data = &log.data().data;
        if data.len() < 128 {
            warn!("Locked event data too short");
            return None;
        }

        let amount = U256::from_be_slice(&data[0..32]);
        let token = Address::from_slice(&data[44..64]);
        let unlock_time = U256::from_be_slice(&data[64..96]);
        
        info!("📥 Parsed Locked event:");
        info!("  Lock ID: 0x{}", hex::encode(lock_id));
        info!("  Owner: {}", owner);
        info!("  Amount: {}", amount);
        info!("  Token: {}", token);
        info!("  Block: {}", block_number);

        Some(BridgeEvent::Locked(crate::events::LockedEvent {
            lock_id,
            owner: owner.into_array(),
            amount: amount.to::<u128>(),
            token: token.into_array(),
            unlock_time: unlock_time.to::<u64>(),
            l1_block_number: block_number,
        }))
    }

    /// Parse EmergencyUnlock event
    fn parse_emergency_unlock_event(&self, log: &Log, block_number: u64) -> Option<BridgeEvent> {
        let topics = log.topics();
        if topics.len() < 3 {
            warn!("EmergencyUnlock event has insufficient topics");
            return None;
        }

        let lock_id: [u8; 32] = topics[1].0;
        let user = Address::from_slice(&topics[2].0[12..32]);

        // Parse data fields (bond)
        let data = &log.data().data;
        if data.len() < 32 {
            warn!("EmergencyUnlock event data too short");
            return None;
        }

        let bond = U256::from_be_slice(&data[0..32]);

        info!("🚨 Parsed EmergencyUnlock event:");
        info!("  Lock ID: 0x{}", hex::encode(lock_id));
        info!("  User: {}", user);
        info!("  Bond: {}", bond);
        info!("  Block: {}", block_number);

        Some(BridgeEvent::EmergencyUnlock(crate::events::EmergencyUnlockEvent {
            lock_id,
            user: user.into_array(),
            bond: bond.to::<u128>(),
            l1_block_number: block_number,
        }))
    }

    /// Parse Challenged event
    fn parse_challenged_event(&self, log: &Log, block_number: u64) -> Option<BridgeEvent> {
        let topics = log.topics();
        if topics.len() < 3 {
            warn!("Challenged event has insufficient topics");
            return None;
        }

        let lock_id: [u8; 32] = topics[1].0;
        let challenger = Address::from_slice(&topics[2].0[12..32]);

        // Parse data fields (challengeId)
        let data = &log.data().data;
        if data.len() < 32 {
            warn!("Challenged event data too short");
            return None;
        }

        let challenge_id: [u8; 32] = data[0..32].try_into().unwrap_or([0u8; 32]);

        info!("⚔️ Parsed Challenged event:");
        info!("  Lock ID: 0x{}", hex::encode(lock_id));
        info!("  Challenger: {}", challenger);
        info!("  Challenge ID: 0x{}", hex::encode(challenge_id));
        info!("  Block: {}", block_number);

        Some(BridgeEvent::Challenged(crate::events::ChallengedEvent {
            lock_id,
            challenger: challenger.into_array(),
            challenge_id,
            l1_block_number: block_number,
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
        
        let challenged_topic = *event_topics::CHALLENGED_TOPIC;
        assert_eq!(challenged_topic.0.len(), 32);
        
        // Topics should be different
        assert_ne!(locked_topic, emergency_topic);
        assert_ne!(locked_topic, challenged_topic);
    }

    #[test]
    fn test_confirmation_blocks_constant() {
        // Per AGENT_MEETING_MINUTES: 12 block confirmations
        // This should be configurable but default to 12
        let config = Config::default();
        assert_eq!(config.l1.confirmation_blocks, 12);
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
