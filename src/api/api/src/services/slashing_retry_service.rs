//! Slashing L1 Retry Service
//!
//! Background worker that retries failed `ProverRegistry.slash()` submissions.
//!
//! ## Background (C-4 fix — Batch 3)
//!
//! Before the 2026-04-11 spec-drift audit, `SlashingService::execute_slashing`
//! treated the L1 `ProverRegistry.slash()` call as "best-effort" — if the
//! call failed, it logged a warning and returned `None` for `l1_tx_hash`.
//! The DB was marked as slashed while the attacker's on-chain stake remained
//! untouched. This was the exact silent-failure pattern the audit was looking
//! for.
//!
//! Batch 2 introduced the `L1SlashStatus` enum and persistent `l1_status`
//! column (migration 019) so every slashing has an explicit L1 lifecycle
//! state. This service closes the loop: it polls for rows with
//! `l1_status = 'pending_retry'` and resubmits them to L1, updating the DB
//! based on the outcome.
//!
//! ## Retry policy
//!
//! - Max retries: configurable via `QS__SLASHING_RETRY__MAX_RETRIES`
//!   (default 10). After that, the row is left in `pending_retry` state
//!   until an operator manually intervenes (no silent abandonment).
//! - Polling interval: configurable via `QS__SLASHING_RETRY__POLL_INTERVAL_SECS`
//!   (default 300 = 5 minutes).
//! - Batch size: up to 20 rows per poll to avoid overwhelming the L1 RPC.
//! - Oldest retries first (`ORDER BY l1_last_retry_at NULLS FIRST`) so
//!   the queue is fair.
//!
//! ## Observability
//!
//! Every successful retry emits an INFO log with `l1_tx_hash`.
//! Every failed retry emits an ERROR log (NOT warn — silent warns are what
//! we're eliminating) with the error, slashing_id, and attempt number.

use std::sync::Arc;

use sqlx::PgPool;
use tokio::sync::watch;
use tracing::{debug, error, info, instrument};

use crate::db::{ChallengeRepository, PendingRetrySlashing};
use crate::services::l1_prover_registry::{L1ProverRegistryService, hex_to_bytes32};

/// Configuration for the slashing retry service.
#[derive(Debug, Clone)]
pub struct SlashingRetryConfig {
    pub enabled: bool,
    pub poll_interval_secs: u64,
    pub max_retries: i32,
    pub batch_size: i64,
}

impl Default for SlashingRetryConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            poll_interval_secs: 300,
            max_retries: 10,
            batch_size: 20,
        }
    }
}

/// Background service that retries pending L1 slashing submissions.
pub struct SlashingRetryService {
    pool: Arc<PgPool>,
    registry: Arc<L1ProverRegistryService>,
    config: SlashingRetryConfig,
    shutdown_rx: watch::Receiver<bool>,
}

impl SlashingRetryService {
    pub fn new(
        pool: Arc<PgPool>,
        registry: Arc<L1ProverRegistryService>,
        config: SlashingRetryConfig,
        shutdown_rx: watch::Receiver<bool>,
    ) -> Self {
        Self { pool, registry, config, shutdown_rx }
    }

    /// Run the polling loop until shutdown.
    pub async fn run(mut self) {
        info!(
            poll_interval_secs = self.config.poll_interval_secs,
            max_retries = self.config.max_retries,
            batch_size = self.config.batch_size,
            "SlashingRetryService started"
        );

        let mut interval = tokio::time::interval(
            std::time::Duration::from_secs(self.config.poll_interval_secs),
        );
        // First tick fires immediately; use delay to avoid a hot start right
        // after service bootstrap.
        interval.tick().await;

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    if let Err(e) = self.process_retry_batch().await {
                        // Per the new silent-failure policy, service-level
                        // errors are ERROR not WARN.
                        error!(
                            error = %e,
                            "SlashingRetryService batch processing failed"
                        );
                    }
                }
                _ = self.shutdown_rx.changed() => {
                    info!("SlashingRetryService shutting down");
                    break;
                }
            }
        }

        info!("SlashingRetryService stopped");
    }

    /// Process one batch of pending retry slashings.
    #[instrument(skip(self))]
    async fn process_retry_batch(&self) -> Result<(), String> {
        let pending = ChallengeRepository::fetch_pending_retry_slashings(
            &self.pool,
            self.config.max_retries,
            self.config.batch_size,
        )
        .await
        .map_err(|e| format!("fetch_pending_retry_slashings failed: {}", e))?;

        if pending.is_empty() {
            debug!("No pending slashings to retry");
            return Ok(());
        }

        info!(count = pending.len(), "Retrying pending L1 slashings");

        for row in pending {
            self.retry_single(row).await;
        }

        Ok(())
    }

    /// Retry one slashing submission. Non-fatal on individual failure —
    /// logs and moves on so one bad row cannot block the whole queue.
    #[instrument(skip(self), fields(slashing_id = %row.slashing_id))]
    async fn retry_single(&self, row: PendingRetrySlashing) {
        // Re-validate hex with the strict helper. If this fails, the row
        // is permanently bad input and should not be retried.
        let prover_id_bytes = match hex_to_bytes32(&row.prover_id) {
            Ok(b) => b,
            Err(e) => {
                error!(
                    prover_id = %row.prover_id,
                    error = %e,
                    "SlashingRetry: prover_id is permanently invalid hex — skipping"
                );
                // Record the permanent failure so operators notice.
                let _ = ChallengeRepository::mark_slashing_l1_retry_failed(
                    &self.pool,
                    &row.slashing_id,
                    &format!("permanently invalid prover_id hex: {}", e),
                )
                .await;
                return;
            }
        };

        let challenge_bytes = match hex_to_bytes32(&row.challenge_id) {
            Ok(b) => b,
            Err(e) => {
                error!(
                    challenge_id = %row.challenge_id,
                    error = %e,
                    "SlashingRetry: challenge_id is permanently invalid hex — skipping"
                );
                let _ = ChallengeRepository::mark_slashing_l1_retry_failed(
                    &self.pool,
                    &row.slashing_id,
                    &format!("permanently invalid challenge_id hex: {}", e),
                )
                .await;
                return;
            }
        };

        let colluding_count = row.colluding_count.max(1) as u64;

        info!(
            slashing_id = %row.slashing_id,
            attempt = row.l1_retry_count + 1,
            colluding_count,
            "SlashingRetry: submitting L1 slash() to ProverRegistry"
        );

        match self
            .registry
            .slash(prover_id_bytes, colluding_count, challenge_bytes)
            .await
        {
            Ok(tx_hash) => {
                let tx_hash_str = format!("{:?}", tx_hash);
                info!(
                    slashing_id = %row.slashing_id,
                    l1_tx_hash = %tx_hash_str,
                    "SlashingRetry: L1 slash() succeeded"
                );
                if let Err(e) = ChallengeRepository::mark_slashing_l1_submitted(
                    &self.pool,
                    &row.slashing_id,
                    &tx_hash_str,
                )
                .await
                {
                    // If the DB update fails after a successful L1 call, we
                    // have an inconsistency. Log loudly so the operator can
                    // manually reconcile.
                    error!(
                        slashing_id = %row.slashing_id,
                        tx_hash = %tx_hash_str,
                        error = %e,
                        "SlashingRetry: L1 succeeded but DB update failed — manual reconciliation required"
                    );
                }
            }
            Err(e) => {
                error!(
                    slashing_id = %row.slashing_id,
                    attempt = row.l1_retry_count + 1,
                    error = %e,
                    "SlashingRetry: L1 slash() failed again"
                );
                let _ = ChallengeRepository::mark_slashing_l1_retry_failed(
                    &self.pool,
                    &row.slashing_id,
                    &e.to_string(),
                )
                .await;
            }
        }
    }
}
