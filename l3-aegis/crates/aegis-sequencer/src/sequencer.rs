//! # Sequencer Interface (SEQ-001)
//!
//! Core sequencer trait and implementation for L3 Aegis.
//!
//! ## Reference
//!
//! - UNIFIED_SPEC_v2.0.md §Sequencer
//! - L3_CHAIN_SPECIFICATION.md §Sequencer
//! - PHASE3_PLAN.md IC-3

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info, warn};

use crate::error::{SequencerError, SequencerResult};
use crate::mempool::MempoolManager;
use crate::types::{Batch, BatchHash, EpochInfo, PendingTx, TxHash};

/// Sequencer configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SequencerConfig {
    /// Maximum transactions per batch
    pub max_txs_per_batch: usize,
    /// Maximum gas per batch
    pub max_gas_per_batch: u64,
    /// Batch interval in milliseconds
    pub batch_interval_ms: u64,
    /// Epoch duration in seconds
    pub epoch_duration_secs: u64,
    /// Mempool maximum size
    pub mempool_max_size: usize,
    /// Minimum gas price
    pub min_gas_price: u128,
}

impl Default for SequencerConfig {
    fn default() -> Self {
        Self {
            max_txs_per_batch: 1000,
            max_gas_per_batch: 30_000_000,
            batch_interval_ms: 1000, // 1 second
            epoch_duration_secs: 3600, // 1 hour
            mempool_max_size: 10_000,
            min_gas_price: 1_000_000_000, // 1 gwei
        }
    }
}

/// Sequencer state
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SequencerState {
    /// Idle (not active sequencer)
    Idle,
    /// Active (building batches)
    Active,
    /// Syncing (catching up)
    Syncing,
    /// Stopped
    Stopped,
}

/// Sequencer trait
#[async_trait]
pub trait SequencerTrait: Send + Sync {
    /// Get current sequencer state
    fn state(&self) -> SequencerState;

    /// Check if this sequencer is active for current epoch
    fn is_active(&self) -> bool;

    /// Submit transaction to mempool
    async fn submit_tx(&self, tx: PendingTx) -> SequencerResult<TxHash>;

    /// Get pending transaction by hash
    async fn get_pending_tx(&self, hash: &TxHash) -> SequencerResult<Option<PendingTx>>;

    /// Get pending transaction count
    async fn pending_tx_count(&self) -> usize;

    /// Build next batch
    async fn build_batch(&self) -> SequencerResult<Batch>;

    /// Submit batch to L1
    async fn submit_batch(&self, batch: Batch) -> SequencerResult<()>;

    /// Get batch by number
    async fn get_batch(&self, number: u64) -> SequencerResult<Option<Batch>>;

    /// Get latest batch number
    async fn latest_batch_number(&self) -> u64;

    /// Get current epoch info
    fn current_epoch(&self) -> EpochInfo;

    /// Start sequencer
    async fn start(&self) -> SequencerResult<()>;

    /// Stop sequencer
    async fn stop(&self) -> SequencerResult<()>;
}

/// Sequencer implementation
pub struct Sequencer {
    /// Configuration
    config: SequencerConfig,
    /// Current state
    state: RwLock<SequencerState>,
    /// Mempool manager
    mempool: Arc<MempoolManager>,
    /// Sequencer identity (Dilithium public key hash)
    identity: [u8; 32],
    /// Current epoch
    current_epoch: RwLock<EpochInfo>,
    /// Latest batch number
    latest_batch: RwLock<u64>,
    /// Submitted batches (in-memory cache)
    batches: RwLock<Vec<Batch>>,
}

impl Sequencer {
    /// Create new sequencer instance
    pub fn new(config: SequencerConfig, identity: [u8; 32]) -> Self {
        let mempool = Arc::new(MempoolManager::new(config.mempool_max_size, config.min_gas_price));
        
        Self {
            config,
            state: RwLock::new(SequencerState::Idle),
            mempool,
            identity,
            current_epoch: RwLock::new(EpochInfo {
                number: 0,
                sequencer: [0u8; 32],
                start_time: 0,
                end_time: 0,
            }),
            latest_batch: RwLock::new(0),
            batches: RwLock::new(Vec::new()),
        }
    }

    /// Get configuration
    pub fn config(&self) -> &SequencerConfig {
        &self.config
    }

    /// Get identity
    pub fn identity(&self) -> &[u8; 32] {
        &self.identity
    }

    /// Get mempool reference
    pub fn mempool(&self) -> Arc<MempoolManager> {
        self.mempool.clone()
    }

    /// Update epoch info
    pub async fn set_epoch(&self, epoch: EpochInfo) {
        let epoch_number = epoch.number;
        let sequencer_hex = hex::encode(&epoch.sequencer[..8]);
        
        let mut current = self.current_epoch.write().await;
        *current = epoch;
        
        info!("Epoch updated: number={}, sequencer=0x{}", 
              epoch_number, 
              sequencer_hex);
    }

    /// Check if we are the active sequencer
    async fn check_active(&self) -> bool {
        let epoch = self.current_epoch.read().await;
        epoch.sequencer == self.identity
    }
}

#[async_trait]
impl SequencerTrait for Sequencer {
    fn state(&self) -> SequencerState {
        // Use blocking read for sync method
        futures::executor::block_on(async {
            *self.state.read().await
        })
    }

    fn is_active(&self) -> bool {
        futures::executor::block_on(async {
            self.check_active().await
        })
    }

    async fn submit_tx(&self, tx: PendingTx) -> SequencerResult<TxHash> {
        let hash = tx.hash;
        self.mempool.add_tx(tx).await?;
        debug!("Transaction submitted: {}", hash);
        Ok(hash)
    }

    async fn get_pending_tx(&self, hash: &TxHash) -> SequencerResult<Option<PendingTx>> {
        Ok(self.mempool.get_tx(hash).await)
    }

    async fn pending_tx_count(&self) -> usize {
        self.mempool.size().await
    }

    async fn build_batch(&self) -> SequencerResult<Batch> {
        // Check if we are active sequencer
        if !self.check_active().await {
            return Err(SequencerError::NotActiveSequencer);
        }

        let state = *self.state.read().await;
        if state != SequencerState::Active {
            return Err(SequencerError::InternalError(
                "Sequencer not in active state".to_string()
            ));
        }

        // Get transactions from mempool
        let txs = self.mempool
            .get_batch_txs(self.config.max_txs_per_batch, self.config.max_gas_per_batch)
            .await?;

        if txs.is_empty() {
            return Err(SequencerError::BatchError("No transactions available".to_string()));
        }

        let tx_hashes: Vec<TxHash> = txs.iter().map(|tx| tx.hash).collect();
        let batch_hash = BatchHash::from_txs(&tx_hashes);
        
        let mut latest = self.latest_batch.write().await;
        let batch_number = *latest + 1;

        // Get parent hash
        let parent_hash = if batch_number == 1 {
            BatchHash::from_bytes([0u8; 32])
        } else {
            let batches = self.batches.read().await;
            batches.last()
                .map(|b| b.hash)
                .unwrap_or(BatchHash::from_bytes([0u8; 32]))
        };

        // Calculate gas used
        let gas_used: u64 = txs.iter().map(|tx| tx.gas_limit).sum();

        let batch = Batch {
            number: batch_number,
            hash: batch_hash,
            parent_hash,
            sequencer: self.identity,
            transactions: tx_hashes,
            state_root: [0u8; 32], // TODO: Calculate from state
            timestamp: chrono::Utc::now().timestamp() as u64,
            gas_used,
            signature: Vec::new(), // TODO: Sign with Dilithium
        };

        *latest = batch_number;

        info!("Batch built: number={}, txs={}, gas={}", 
              batch.number, batch.transactions.len(), batch.gas_used);

        Ok(batch)
    }

    async fn submit_batch(&self, batch: Batch) -> SequencerResult<()> {
        // Remove transactions from mempool
        for tx_hash in &batch.transactions {
            self.mempool.remove_tx(tx_hash).await;
        }

        // Store batch
        let mut batches = self.batches.write().await;
        batches.push(batch.clone());

        info!("Batch submitted: number={}", batch.number);

        // TODO: Submit to L1

        Ok(())
    }

    async fn get_batch(&self, number: u64) -> SequencerResult<Option<Batch>> {
        let batches = self.batches.read().await;
        Ok(batches.iter().find(|b| b.number == number).cloned())
    }

    async fn latest_batch_number(&self) -> u64 {
        *self.latest_batch.read().await
    }

    fn current_epoch(&self) -> EpochInfo {
        futures::executor::block_on(async {
            self.current_epoch.read().await.clone()
        })
    }

    async fn start(&self) -> SequencerResult<()> {
        let mut state = self.state.write().await;
        
        if *state == SequencerState::Active {
            warn!("Sequencer already active");
            return Ok(());
        }

        *state = SequencerState::Active;
        info!("Sequencer started");
        
        Ok(())
    }

    async fn stop(&self) -> SequencerResult<()> {
        let mut state = self.state.write().await;
        *state = SequencerState::Stopped;
        info!("Sequencer stopped");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_sequencer() -> Sequencer {
        let config = SequencerConfig::default();
        let identity = [1u8; 32];
        Sequencer::new(config, identity)
    }

    #[tokio::test]
    async fn test_sequencer_creation() {
        let sequencer = create_test_sequencer();
        assert_eq!(sequencer.state(), SequencerState::Idle);
        assert!(!sequencer.is_active());
    }

    #[tokio::test]
    async fn test_sequencer_start_stop() {
        let sequencer = create_test_sequencer();
        
        sequencer.start().await.unwrap();
        assert_eq!(sequencer.state(), SequencerState::Active);
        
        sequencer.stop().await.unwrap();
        assert_eq!(sequencer.state(), SequencerState::Stopped);
    }

    #[tokio::test]
    async fn test_set_epoch() {
        let sequencer = create_test_sequencer();
        
        let epoch = EpochInfo {
            number: 1,
            sequencer: [1u8; 32], // Same as identity
            start_time: 1000,
            end_time: 2000,
        };
        
        sequencer.set_epoch(epoch.clone()).await;
        assert!(sequencer.is_active());
    }
}
