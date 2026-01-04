//! Event Processor for L1 events
//!
//! Processes L1 events and syncs to L3 with:
//! - SR0 validation
//! - Idempotency checking
//! - State updates

use crate::config::Config;
use crate::error::{Error, Result};
use crate::events::{BridgeEvent, LockedEvent, LockStatus};
use crate::idempotency::IdempotencyManager;
use crate::queue::EventQueue;
use crate::metrics;
use tracing::{debug, error, info, warn};

/// Event Processor
pub struct EventProcessor {
    config: Config,
    idempotency: IdempotencyManager,
    queue: EventQueue,
}

impl EventProcessor {
    /// Create new event processor
    pub fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            config: config.clone(),
            idempotency: IdempotencyManager::new(&config.redis)?,
            queue: EventQueue::new(&config.redis)?,
        })
    }

    /// Process a bridge event
    pub async fn process(&self, event: BridgeEvent) -> Result<()> {
        let event_id = event.event_id();
        let event_type = event.event_type();
        
        info!("📥 Processing {} event: {}", event_type, hex::encode(event_id));
        
        // Check idempotency
        if self.idempotency.is_processed(&event_id).await? {
            debug!("⏭️ Event already processed, skipping");
            metrics::increment_duplicate_events();
            return Ok(());
        }
        
        // Process based on event type
        match &event {
            BridgeEvent::Locked(locked) => {
                self.process_locked(locked).await?;
            }
            BridgeEvent::EmergencyUnlock(emergency) => {
                self.process_emergency_unlock(emergency).await?;
            }
            BridgeEvent::UnlockReady(unlock) => {
                // This is L3→L1, shouldn't come through indexer
                warn!("Received UnlockReady in indexer (should be in relayer)");
            }
            BridgeEvent::Heartbeat { .. } => {
                debug!("Heartbeat received");
            }
        }
        
        // Mark as processed
        self.idempotency.mark_processed(&event_id).await?;
        
        // Update metrics
        metrics::increment_events_processed(event_type);
        
        info!("✅ Event processed successfully");
        Ok(())
    }

    /// Process Locked event (Sequence #1)
    async fn process_locked(&self, event: &LockedEvent) -> Result<()> {
        info!("🔒 Processing Lock event: {}", hex::encode(event.lock_id));
        
        // 1. Validate SR0
        if !event.validate_sr0() {
            let computed = event.compute_sr0();
            return Err(Error::InvalidSR0 {
                computed: hex::encode(computed),
                received: hex::encode(event.sr0),
            });
        }
        info!("  ✓ SR0 validated");
        
        // 2. Queue for L3 sync
        self.queue.enqueue_l3_sync(&BridgeEvent::Locked(event.clone())).await?;
        info!("  ✓ Queued for L3 sync");
        
        // In production, would also:
        // - Update SMT
        // - Create Lock record
        // - Emit L3 event
        
        Ok(())
    }

    /// Process Emergency Unlock event (Sequence #3)
    async fn process_emergency_unlock(&self, event: &crate::events::EmergencyUnlockEvent) -> Result<()> {
        info!("🚨 Processing Emergency Unlock: {}", hex::encode(event.lock_id));
        
        // Queue for L3 sync
        self.queue.enqueue_l3_sync(&BridgeEvent::EmergencyUnlock(event.clone())).await?;
        info!("  ✓ Queued for L3 emergency handling");
        
        Ok(())
    }
}
