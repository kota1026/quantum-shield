//! L1 Sync Background Service
//!
//! Periodically fetches L1 events (Locked, UnlockExecuted) from Sepolia
//! and syncs them to PostgreSQL to keep DB in sync with L1 state.
//!
//! This prevents discrepancies between DB and L1 when:
//! - Locks are created directly on L1 (e.g., via etherscan or scripts)
//! - Unlocks are executed directly on L1
//! - DB is restored from backup or migrated

use std::sync::Arc;

use sqlx::PgPool;
use tokio::sync::watch;
use tracing::{info, warn, error};

use crate::config::L1SyncConfig;
use crate::services::l1_indexer::L1Indexer;

pub struct L1SyncService {
    pool: Arc<PgPool>,
    config: L1SyncConfig,
    vault_address: String,
    shutdown_rx: watch::Receiver<bool>,
}

impl L1SyncService {
    pub fn new(
        pool: Arc<PgPool>,
        config: L1SyncConfig,
        vault_address: String,
        shutdown_rx: watch::Receiver<bool>,
    ) -> Self {
        Self { pool, config, vault_address, shutdown_rx }
    }

    /// Run the background polling loop until shutdown
    pub async fn run(mut self) {
        info!(
            poll_interval_secs = self.config.poll_interval_secs,
            rpc_url = %self.config.rpc_url,
            "L1 Sync service started"
        );

        let mut interval = tokio::time::interval(
            std::time::Duration::from_secs(self.config.poll_interval_secs),
        );

        // Run initial sync immediately
        if let Err(e) = self.sync_l1_events().await {
            warn!("Initial L1 sync failed: {}", e);
        }

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    if let Err(e) = self.sync_l1_events().await {
                        error!("L1 sync processing error: {}", e);
                    }
                }
                _ = self.shutdown_rx.changed() => {
                    info!("L1 Sync service shutting down");
                    break;
                }
            }
        }

        info!("L1 Sync service stopped");
    }

    /// Fetch L1 events and sync to database
    async fn sync_l1_events(&self) -> Result<(), String> {
        // Create L1 indexer using config-driven vault address (not hardcoded)
        let indexer = L1Indexer::new(&self.config.rpc_url, &self.vault_address)
            .await
            .map_err(|e| format!("Failed to create L1 indexer: {}", e))?;

        // Sync events to database
        let synced_count = indexer
            .sync_to_database(&self.pool)
            .await
            .map_err(|e| format!("L1 sync failed: {}", e))?;

        if synced_count > 0 {
            info!(synced_count, "L1 sync completed - new events indexed");
        }

        Ok(())
    }
}
