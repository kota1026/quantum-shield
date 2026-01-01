//! # BatchBuilder (SEQ-003)
//!
//! Constructs transaction batches for L1 submission.
//!
//! ## Features
//!
//! - FIFO transaction ordering with timestamp-based prioritization
//! - Configurable batch size and gas limits
//! - Batch timeout for guaranteed processing
//! - Integration with SMT for state root calculation
//!
//! ## CP-1 Compliance
//!
//! All hash operations use SHA3-256 (FIPS 202).
//!
//! ## Reference
//!
//! - L3_CHAIN_SPECIFICATION.md §2 Block Structure
//! - SEQUENCES_v2.0.md #1 Lock, #2 Unlock

use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};
use std::collections::VecDeque;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{debug, info, warn};

use crate::error::{SequencerError, SequencerResult};
use crate::mempool::MempoolManager;
use crate::types::{Batch, BatchHash, BatchStatus, PendingTx, TxHash};

/// Domain separator for batch hashes (CP-1 compliant)
const DOMAIN_BATCH: &[u8] = b"QS_SEQUENCER_BATCH_V1";

/// BatchBuilder configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchBuilderConfig {
    /// Maximum transactions per batch
    pub max_txs_per_batch: usize,
    /// Maximum gas per batch
    pub max_gas_per_batch: u64,
    /// Batch timeout in milliseconds
    pub batch_timeout_ms: u64,
    /// Minimum transactions to trigger batch
    pub min_txs_for_batch: usize,
    /// Enable FIFO strict ordering
    pub strict_fifo: bool,
}

impl Default for BatchBuilderConfig {
    fn default() -> Self {
        Self {
            max_txs_per_batch: 1000,
            max_gas_per_batch: 30_000_000,
            batch_timeout_ms: 5000, // 5 seconds (block interval)
            min_txs_for_batch: 1,
            strict_fifo: true,
        }
    }
}

/// Batch building state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuilderState {
    /// Idle, waiting for transactions
    Idle,
    /// Collecting transactions
    Collecting,
    /// Building batch
    Building,
    /// Batch ready
    Ready,
}

/// Transaction in the build queue
#[derive(Debug, Clone)]
struct QueuedTx {
    /// Transaction
    tx: PendingTx,
    /// Queue timestamp (for FIFO)
    queued_at: Instant,
    /// Sequence number (FIFO order)
    sequence: u64,
}

/// BatchBuilder for constructing transaction batches
pub struct BatchBuilder {
    /// Configuration
    config: BatchBuilderConfig,
    /// Current state
    state: RwLock<BuilderState>,
    /// Build queue (FIFO ordered)
    queue: RwLock<VecDeque<QueuedTx>>,
    /// Current batch being built
    current_batch: RwLock<Option<BatchInProgress>>,
    /// Mempool reference
    mempool: Option<Arc<MempoolManager>>,
    /// Sequence counter for FIFO ordering
    sequence_counter: RwLock<u64>,
    /// Last batch time
    last_batch_time: RwLock<Instant>,
    /// Builder identity (sequencer public key hash)
    identity: [u8; 32],
}

/// Batch in progress (being built)
#[derive(Debug, Clone)]
struct BatchInProgress {
    /// Batch number
    number: u64,
    /// Transactions collected
    transactions: Vec<PendingTx>,
    /// Gas used so far
    gas_used: u64,
    /// Start time
    started_at: Instant,
}

impl BatchBuilder {
    /// Create new BatchBuilder
    pub fn new(config: BatchBuilderConfig, identity: [u8; 32]) -> Self {
        Self {
            config,
            state: RwLock::new(BuilderState::Idle),
            queue: RwLock::new(VecDeque::new()),
            current_batch: RwLock::new(None),
            mempool: None,
            sequence_counter: RwLock::new(0),
            last_batch_time: RwLock::new(Instant::now()),
            identity,
        }
    }

    /// Set mempool reference
    pub fn set_mempool(&mut self, mempool: Arc<MempoolManager>) {
        self.mempool = Some(mempool);
    }

    /// Get current state
    pub async fn state(&self) -> BuilderState {
        *self.state.read().await
    }

    /// Get queue size
    pub async fn queue_size(&self) -> usize {
        self.queue.read().await.len()
    }

    /// Add transaction to build queue (FIFO)
    pub async fn enqueue_tx(&self, tx: PendingTx) -> SequencerResult<u64> {
        let mut counter = self.sequence_counter.write().await;
        let sequence = *counter;
        *counter += 1;

        let queued = QueuedTx {
            tx,
            queued_at: Instant::now(),
            sequence,
        };

        let mut queue = self.queue.write().await;
        queue.push_back(queued);

        debug!("Transaction enqueued: sequence={}", sequence);

        // Update state if idle
        let mut state = self.state.write().await;
        if *state == BuilderState::Idle {
            *state = BuilderState::Collecting;
        }

        Ok(sequence)
    }

    /// Check if batch should be built
    pub async fn should_build(&self) -> bool {
        let state = *self.state.read().await;
        if state == BuilderState::Building || state == BuilderState::Ready {
            return false;
        }

        let queue = self.queue.read().await;
        let queue_size = queue.len();

        // Check minimum transaction count
        if queue_size >= self.config.min_txs_for_batch {
            return true;
        }

        // Check timeout
        let last_batch = *self.last_batch_time.read().await;
        let elapsed = last_batch.elapsed();
        if elapsed >= Duration::from_millis(self.config.batch_timeout_ms) && queue_size > 0 {
            return true;
        }

        false
    }

    /// Build batch from queue
    pub async fn build_batch(&self, batch_number: u64, parent_hash: BatchHash) -> SequencerResult<Batch> {
        // Update state
        {
            let mut state = self.state.write().await;
            *state = BuilderState::Building;
        }

        let started_at = Instant::now();
        let mut transactions = Vec::new();
        let mut tx_hashes = Vec::new();
        let mut gas_used: u64 = 0;

        // Collect transactions from queue (FIFO order)
        {
            let mut queue = self.queue.write().await;
            
            while let Some(queued) = queue.front() {
                // Check limits
                if transactions.len() >= self.config.max_txs_per_batch {
                    break;
                }
                if gas_used + queued.tx.gas_limit > self.config.max_gas_per_batch {
                    break;
                }

                // Remove from queue and add to batch
                let queued = queue.pop_front().unwrap();
                gas_used += queued.tx.gas_limit;
                tx_hashes.push(queued.tx.hash);
                transactions.push(queued.tx);
            }
        }

        if transactions.is_empty() {
            // Reset state
            let mut state = self.state.write().await;
            *state = BuilderState::Idle;
            return Err(SequencerError::BatchError("No transactions to build".to_string()));
        }

        // Calculate batch hash with domain separation (CP-1)
        let batch_hash = self.calculate_batch_hash(&tx_hashes, batch_number);

        // Create batch
        let batch = Batch {
            number: batch_number,
            hash: batch_hash,
            parent_hash,
            sequencer: self.identity,
            transactions: tx_hashes,
            state_root: [0u8; 32], // Will be calculated by L1Submitter with SMT
            timestamp: chrono::Utc::now().timestamp() as u64,
            gas_used,
            signature: Vec::new(), // Will be signed by sequencer
        };

        // Update last batch time
        {
            let mut last_batch = self.last_batch_time.write().await;
            *last_batch = Instant::now();
        }

        // Update state
        {
            let mut state = self.state.write().await;
            *state = BuilderState::Ready;
        }

        let build_time = started_at.elapsed();
        info!(
            "Batch built: number={}, txs={}, gas={}, time={:?}",
            batch.number, batch.transactions.len(), batch.gas_used, build_time
        );

        Ok(batch)
    }

    /// Calculate batch hash with domain separation (CP-1 compliant)
    fn calculate_batch_hash(&self, tx_hashes: &[TxHash], batch_number: u64) -> BatchHash {
        let mut hasher = Sha3_256::new();
        
        // Domain separation
        hasher.update(DOMAIN_BATCH);
        
        // Batch number
        hasher.update(batch_number.to_be_bytes());
        
        // Transaction hashes in order
        for tx_hash in tx_hashes {
            hasher.update(tx_hash.as_bytes());
        }
        
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        BatchHash::from_bytes(hash)
    }

    /// Reset builder state
    pub async fn reset(&self) {
        let mut state = self.state.write().await;
        *state = BuilderState::Idle;
        
        let mut current = self.current_batch.write().await;
        *current = None;
    }

    /// Get pending transactions count
    pub async fn pending_count(&self) -> usize {
        self.queue.read().await.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{TxPriority, TxType};

    fn create_test_tx(nonce: u64, gas_limit: u64) -> PendingTx {
        let mut sender = [0u8; 32];
        sender[0] = (nonce % 256) as u8;
        
        let hash = TxHash::hash(&[nonce as u8]);
        
        PendingTx {
            hash,
            tx_type: TxType::BridgeLock,
            sender,
            nonce,
            gas_price: 1_000_000_000,
            gas_limit,
            data: vec![],
            signature: vec![],
            priority: TxPriority::Normal,
            received_at: chrono::Utc::now().timestamp() as u64,
        }
    }

    #[tokio::test]
    async fn test_batch_builder_creation() {
        let config = BatchBuilderConfig::default();
        let builder = BatchBuilder::new(config, [1u8; 32]);
        
        assert_eq!(builder.state().await, BuilderState::Idle);
        assert_eq!(builder.queue_size().await, 0);
    }

    #[tokio::test]
    async fn test_enqueue_fifo_order() {
        let config = BatchBuilderConfig::default();
        let builder = BatchBuilder::new(config, [1u8; 32]);
        
        let tx1 = create_test_tx(1, 21000);
        let tx2 = create_test_tx(2, 21000);
        let tx3 = create_test_tx(3, 21000);
        
        let seq1 = builder.enqueue_tx(tx1).await.unwrap();
        let seq2 = builder.enqueue_tx(tx2).await.unwrap();
        let seq3 = builder.enqueue_tx(tx3).await.unwrap();
        
        assert_eq!(seq1, 0);
        assert_eq!(seq2, 1);
        assert_eq!(seq3, 2);
        assert_eq!(builder.queue_size().await, 3);
        assert_eq!(builder.state().await, BuilderState::Collecting);
    }

    #[tokio::test]
    async fn test_build_batch() {
        let config = BatchBuilderConfig {
            max_txs_per_batch: 10,
            max_gas_per_batch: 1_000_000,
            batch_timeout_ms: 5000,
            min_txs_for_batch: 1,
            strict_fifo: true,
        };
        let builder = BatchBuilder::new(config, [1u8; 32]);
        
        // Add transactions
        for i in 0..5 {
            let tx = create_test_tx(i, 21000);
            builder.enqueue_tx(tx).await.unwrap();
        }
        
        // Build batch
        let parent_hash = BatchHash::from_bytes([0u8; 32]);
        let batch = builder.build_batch(1, parent_hash).await.unwrap();
        
        assert_eq!(batch.number, 1);
        assert_eq!(batch.transactions.len(), 5);
        assert_eq!(batch.gas_used, 21000 * 5);
        assert_eq!(builder.state().await, BuilderState::Ready);
    }

    #[tokio::test]
    async fn test_batch_gas_limit() {
        let config = BatchBuilderConfig {
            max_txs_per_batch: 100,
            max_gas_per_batch: 50000, // Only 2 txs fit
            batch_timeout_ms: 5000,
            min_txs_for_batch: 1,
            strict_fifo: true,
        };
        let builder = BatchBuilder::new(config, [1u8; 32]);
        
        // Add transactions with 21000 gas each
        for i in 0..5 {
            let tx = create_test_tx(i, 21000);
            builder.enqueue_tx(tx).await.unwrap();
        }
        
        // Build batch - should only include 2 txs (42000 < 50000)
        let parent_hash = BatchHash::from_bytes([0u8; 32]);
        let batch = builder.build_batch(1, parent_hash).await.unwrap();
        
        assert_eq!(batch.transactions.len(), 2);
        assert_eq!(batch.gas_used, 42000);
        // Remaining 3 should still be in queue
        assert_eq!(builder.queue_size().await, 3);
    }

    #[tokio::test]
    async fn test_batch_tx_limit() {
        let config = BatchBuilderConfig {
            max_txs_per_batch: 3, // Only 3 txs
            max_gas_per_batch: 1_000_000,
            batch_timeout_ms: 5000,
            min_txs_for_batch: 1,
            strict_fifo: true,
        };
        let builder = BatchBuilder::new(config, [1u8; 32]);
        
        // Add 5 transactions
        for i in 0..5 {
            let tx = create_test_tx(i, 21000);
            builder.enqueue_tx(tx).await.unwrap();
        }
        
        // Build batch - should only include 3 txs
        let parent_hash = BatchHash::from_bytes([0u8; 32]);
        let batch = builder.build_batch(1, parent_hash).await.unwrap();
        
        assert_eq!(batch.transactions.len(), 3);
        // Remaining 2 should still be in queue
        assert_eq!(builder.queue_size().await, 2);
    }

    #[tokio::test]
    async fn test_empty_batch_error() {
        let config = BatchBuilderConfig::default();
        let builder = BatchBuilder::new(config, [1u8; 32]);
        
        // Try to build with empty queue
        let parent_hash = BatchHash::from_bytes([0u8; 32]);
        let result = builder.build_batch(1, parent_hash).await;
        
        assert!(result.is_err());
        assert_eq!(builder.state().await, BuilderState::Idle);
    }

    #[tokio::test]
    async fn test_should_build_min_txs() {
        let config = BatchBuilderConfig {
            min_txs_for_batch: 5,
            ..Default::default()
        };
        let builder = BatchBuilder::new(config, [1u8; 32]);
        
        // Add 4 transactions (below min)
        for i in 0..4 {
            let tx = create_test_tx(i, 21000);
            builder.enqueue_tx(tx).await.unwrap();
        }
        
        assert!(!builder.should_build().await);
        
        // Add 5th transaction (at min)
        let tx = create_test_tx(5, 21000);
        builder.enqueue_tx(tx).await.unwrap();
        
        assert!(builder.should_build().await);
    }

    #[tokio::test]
    async fn test_batch_hash_domain_separation() {
        let config = BatchBuilderConfig::default();
        let builder = BatchBuilder::new(config, [1u8; 32]);
        
        let tx_hashes = vec![
            TxHash::hash(b"tx1"),
            TxHash::hash(b"tx2"),
        ];
        
        let hash1 = builder.calculate_batch_hash(&tx_hashes, 1);
        let hash2 = builder.calculate_batch_hash(&tx_hashes, 2);
        
        // Same transactions, different batch numbers should produce different hashes
        assert_ne!(hash1.as_bytes(), hash2.as_bytes());
    }
}
