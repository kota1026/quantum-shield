//! L1 → L3 Event Indexer
//!
//! Monitors L1 events and propagates them to L3 with:
//! - 12 block confirmations (reorg protection)
//! - Event idempotency (deduplication)
//! - Rate limiting (DoS protection)

mod listener;
mod processor;

pub use listener::L1EventListener;
pub use processor::EventProcessor;

use crate::{Config, Result};
use tracing::info;

/// Run the indexer service
pub async fn run(config: &Config) -> Result<()> {
    info!("🔍 Starting L1 Event Indexer");
    info!("  - RPC: {}", config.l1.ws_rpc_url);
    info!("  - Confirmations: {} blocks", config.l1.confirmation_blocks);

    // Initialize listener
    let listener = L1EventListener::new(config)?;
    
    // Initialize processor
    let processor = EventProcessor::new(config)?;

    // Start listening
    listener.start(processor).await?;

    Ok(())
}
