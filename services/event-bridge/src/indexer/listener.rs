//! L1 Event Listener
//!
//! Listens to L1Vault events via WebSocket with HTTP fallback.

use crate::config::Config;
use crate::error::{Error, Result};
use crate::events::{security, BridgeEvent, LockedEvent, EmergencyUnlockEvent};
use crate::indexer::EventProcessor;
use crate::metrics;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::interval;
use tracing::{debug, error, info, warn};

/// L1 Event Listener
pub struct L1EventListener {
    config: Config,
    /// Last processed block (for polling fallback)
    last_block: Arc<AtomicU64>,
    /// Confirmation blocks required
    confirmation_blocks: u64,
}

impl L1EventListener {
    /// Create new L1 event listener
    pub fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            config: config.clone(),
            last_block: Arc::new(AtomicU64::new(0)),
            confirmation_blocks: config.l1.confirmation_blocks,
        })
    }

    /// Start listening for events
    pub async fn start(&self, processor: EventProcessor) -> Result<()> {
        info!("🎧 Starting event listener");

        // Try WebSocket first, fall back to polling
        tokio::select! {
            result = self.listen_websocket(&processor) => {
                match result {
                    Ok(_) => info!("WebSocket listener completed"),
                    Err(e) => {
                        warn!("WebSocket failed: {}, falling back to polling", e);
                        self.listen_polling(&processor).await?;
                    }
                }
            }
        }

        Ok(())
    }

    /// Listen via WebSocket (primary method)
    async fn listen_websocket(&self, processor: &EventProcessor) -> Result<()> {
        info!("📡 Connecting to WebSocket: {}", self.config.l1.ws_rpc_url);
        
        // In production, connect to actual WebSocket
        // For now, simulate event listening
        let mut interval = interval(Duration::from_secs(1));
        
        loop {
            interval.tick().await;
            
            // Check for new events (mock implementation)
            debug!("Checking for new L1 events...");
            
            // Update metrics
            metrics::increment_events_checked();
        }
    }

    /// Listen via polling (fallback method)
    async fn listen_polling(&self, processor: &EventProcessor) -> Result<()> {
        info!("🔄 Starting polling mode with {} second interval", 5);
        
        let mut interval = interval(Duration::from_secs(5));
        
        loop {
            interval.tick().await;
            
            // Get current block
            let current_block = self.get_current_block().await?;
            let last_processed = self.last_block.load(Ordering::SeqCst);
            
            // Only process confirmed blocks
            let safe_block = current_block.saturating_sub(self.confirmation_blocks);
            
            if safe_block > last_processed {
                info!("📦 Processing blocks {} to {}", last_processed + 1, safe_block);
                
                // Fetch and process events
                let events = self.fetch_events(last_processed + 1, safe_block).await?;
                
                for event in events {
                    if let Err(e) = processor.process(event).await {
                        error!("Failed to process event: {}", e);
                    }
                }
                
                // Update last processed block
                self.last_block.store(safe_block, Ordering::SeqCst);
                metrics::set_last_processed_block(safe_block);
            }
        }
    }

    /// Get current L1 block number (mock)
    async fn get_current_block(&self) -> Result<u64> {
        // In production, call actual RPC
        // For now, return mock value
        Ok(12345678)
    }

    /// Fetch events in block range (mock)
    async fn fetch_events(&self, from_block: u64, to_block: u64) -> Result<Vec<BridgeEvent>> {
        debug!("Fetching events from block {} to {}", from_block, to_block);
        
        // In production, query L1 contract events
        // For now, return empty vec
        Ok(vec![])
    }

    /// Wait for block confirmations
    pub async fn wait_confirmations(&self, block_number: u64) -> Result<()> {
        let target_block = block_number + self.confirmation_blocks;
        
        loop {
            let current = self.get_current_block().await?;
            if current >= target_block {
                info!("✅ Block {} confirmed ({} confirmations)", 
                      block_number, self.confirmation_blocks);
                return Ok(());
            }
            
            debug!("Waiting for confirmations: {}/{}", 
                   current.saturating_sub(block_number), self.confirmation_blocks);
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    }
}
