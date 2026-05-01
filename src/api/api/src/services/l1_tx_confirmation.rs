//! L1 Transaction Confirmation Service
//!
//! Background service that polls pending locks with L1 transaction hashes
//! and updates their status to "confirmed" once the L1 transaction is confirmed.
//!
//! This fixes the issue where lock status stays "pending" forever because
//! the backend submits L1 transactions but never checks their confirmation.
//!
//! ## Flow
//! 1. Query DB for locks with status='pending' AND l1_tx_hash IS NOT NULL
//! 2. For each, call eth_getTransactionReceipt on L1 RPC
//! 3. If receipt.status == 1 (success), update lock status to "confirmed"
//! 4. If receipt.status == 0 (revert), log error but keep as pending for retry

use std::sync::Arc;

use ethers::prelude::*;
use sqlx::PgPool;
use tokio::sync::watch;
use tracing::{info, warn, error};

use crate::config::L1SyncConfig;
use crate::db::LockRepository;

pub struct L1TxConfirmationService {
    pool: Arc<PgPool>,
    rpc_url: String,
    shutdown_rx: watch::Receiver<bool>,
    poll_interval_secs: u64,
    /// A lock that's been `status='pending'` with NULL `l1_tx_hash` for
    /// longer than this is considered stranded — the inline L1 submission
    /// in routes/lock.rs failed (RPC outage, vault not configured, etc.)
    /// and no retry path picked it up. Surfaced in CI run 25168505086.
    stale_pending_threshold_secs: i64,
}

impl L1TxConfirmationService {
    pub fn new(
        pool: Arc<PgPool>,
        config: &L1SyncConfig,
        shutdown_rx: watch::Receiver<bool>,
    ) -> Self {
        Self {
            pool,
            rpc_url: config.rpc_url.clone(),
            shutdown_rx,
            // Poll every 15 seconds for faster user feedback
            poll_interval_secs: 15,
            // 5 minutes — long enough that a slow but successful L1 submission
            // doesn't get flagged as stranded, short enough that a real
            // RPC-outage stranding shows up before the operator notices.
            stale_pending_threshold_secs: 5 * 60,
        }
    }

    /// Run the background polling loop until shutdown
    pub async fn run(mut self) {
        info!(
            poll_interval_secs = self.poll_interval_secs,
            stale_pending_threshold_secs = self.stale_pending_threshold_secs,
            rpc_url = %self.rpc_url,
            "L1 TX Confirmation service started"
        );

        let mut interval = tokio::time::interval(
            std::time::Duration::from_secs(self.poll_interval_secs),
        );

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    if let Err(e) = self.check_pending_confirmations().await {
                        error!("L1 TX Confirmation check error: {}", e);
                    }
                    // Surface stranded NULL-tx-hash pending locks. This is
                    // observability-only; a future PR can plug in the
                    // L1Vault to actually re-submit them. Even alone, the
                    // warning + count converts a silent stranding into a
                    // log line operators can grep for.
                    if let Err(e) = self.check_stale_pending_without_tx().await {
                        error!("L1 TX Confirmation stale-pending check error: {}", e);
                    }
                }
                _ = self.shutdown_rx.changed() => {
                    info!("L1 TX Confirmation service shutting down");
                    break;
                }
            }
        }

        info!("L1 TX Confirmation service stopped");
    }

    /// Check all pending locks with L1 tx hashes and update confirmed ones
    async fn check_pending_confirmations(&self) -> Result<(), String> {
        let pending_locks = LockRepository::list_pending_with_l1_tx_hash(&self.pool)
            .await
            .map_err(|e| format!("Failed to query pending locks: {}", e))?;

        if pending_locks.is_empty() {
            return Ok(());
        }

        info!(
            count = pending_locks.len(),
            "Checking L1 confirmations for pending locks"
        );

        let provider = Provider::<Http>::try_from(self.rpc_url.as_str())
            .map_err(|e| format!("Failed to create L1 provider: {}", e))?;

        for lock in &pending_locks {
            let tx_hash_str = match &lock.l1_tx_hash {
                Some(h) => h.clone(),
                None => continue,
            };

            match self.check_and_update_lock(&provider, &lock.lock_id, &tx_hash_str).await {
                Ok(confirmed) => {
                    if confirmed {
                        info!(
                            lock_id = %lock.lock_id,
                            l1_tx_hash = %tx_hash_str,
                            "Lock confirmed on L1"
                        );
                    }
                }
                Err(e) => {
                    warn!(
                        lock_id = %lock.lock_id,
                        l1_tx_hash = %tx_hash_str,
                        error = %e,
                        "Failed to check L1 confirmation"
                    );
                }
            }
        }

        Ok(())
    }

    /// Surface locks that are stuck `pending` with no L1 tx hash. Logs one
    /// warning per row (so each one is grep-able) plus a single summary
    /// metric line. Does NOT mutate state — re-submission requires the
    /// L1Vault wiring and is left to a follow-up PR.
    async fn check_stale_pending_without_tx(&self) -> Result<(), String> {
        let stranded = LockRepository::list_stale_pending_without_l1_tx_hash(
            &self.pool,
            self.stale_pending_threshold_secs,
        )
        .await
        .map_err(|e| format!("Failed to query stranded pending locks: {}", e))?;

        if stranded.is_empty() {
            return Ok(());
        }

        warn!(
            stranded_count = stranded.len(),
            threshold_secs = self.stale_pending_threshold_secs,
            "L1 stranded-pending locks detected (status=pending, l1_tx_hash IS NULL, older than threshold) — \
             inline L1 submission likely failed and no retry has run; manual intervention or follow-up retry service required"
        );

        for lock in &stranded {
            warn!(
                lock_id = %lock.lock_id,
                wallet_address = %lock.wallet_address,
                created_at = %lock.created_at,
                amount = %lock.amount,
                "stranded pending lock — never reached L1"
            );
        }

        Ok(())
    }

    /// Check a single lock's L1 tx status and update DB if confirmed
    async fn check_and_update_lock(
        &self,
        provider: &Provider<Http>,
        lock_id: &str,
        tx_hash_str: &str,
    ) -> Result<bool, String> {
        let hash = tx_hash_str.parse::<H256>()
            .map_err(|_| format!("Invalid tx hash: {}", tx_hash_str))?;

        let receipt = provider.get_transaction_receipt(hash)
            .await
            .map_err(|e| format!("RPC error: {}", e))?;

        match receipt {
            Some(r) => {
                if r.status == Some(1.into()) {
                    // Transaction confirmed successfully - update lock status
                    LockRepository::update_status(&self.pool, lock_id, "confirmed")
                        .await
                        .map_err(|e| format!("DB update failed: {}", e))?;

                    Ok(true)
                } else {
                    // Transaction reverted on-chain
                    warn!(
                        lock_id = %lock_id,
                        l1_tx_hash = %tx_hash_str,
                        "L1 transaction reverted (status=0)"
                    );
                    Ok(false)
                }
            }
            None => {
                // Transaction still pending on L1
                Ok(false)
            }
        }
    }
}
