//! # Mempool Manager (SEQ-002)
//!
//! Transaction pool management for L3 Aegis sequencer.
//!
//! ## Features
//!
//! - Transaction validation and storage
//! - Priority-based ordering
//! - Gas price sorting
//! - Nonce management
//! - Duplicate detection
//!
//! ## Reference
//!
//! - L3_CHAIN_SPECIFICATION.md §Mempool
//! - PHASE3_PLAN.md IC-3

use std::collections::{BinaryHeap, HashMap, HashSet};
use std::cmp::Ordering;
use tokio::sync::RwLock;
use tracing::{debug, info};

use crate::error::{SequencerError, SequencerResult};
use crate::types::{PendingTx, TxHash, TxPriority};

/// Transaction wrapper for priority queue ordering
#[derive(Debug, Clone)]
struct OrderedTx {
    tx: PendingTx,
    effective_gas_price: u128,
}

impl PartialEq for OrderedTx {
    fn eq(&self, other: &Self) -> bool {
        self.tx.hash == other.tx.hash
    }
}

impl Eq for OrderedTx {}

impl PartialOrd for OrderedTx {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for OrderedTx {
    fn cmp(&self, other: &Self) -> Ordering {
        // Higher priority first (BinaryHeap is max-heap, so Greater comes first)
        match self.tx.priority.cmp(&other.tx.priority) {
            Ordering::Equal => {}
            ord => return ord, // Higher priority = Greater = comes first
        }

        // Higher gas price first
        match self.effective_gas_price.cmp(&other.effective_gas_price) {
            Ordering::Equal => {}
            ord => return ord, // Higher gas = Greater = comes first
        }

        // Earlier timestamp first (FIFO for same priority/gas)
        // Reverse: smaller timestamp should be Greater to come first
        other.tx.received_at.cmp(&self.tx.received_at)
    }
}

/// Mempool manager
pub struct MempoolManager {
    /// Maximum mempool size
    max_size: usize,
    /// Minimum gas price
    min_gas_price: u128,
    /// Transactions by hash
    txs_by_hash: RwLock<HashMap<TxHash, PendingTx>>,
    /// Transaction hashes by sender
    txs_by_sender: RwLock<HashMap<[u8; 32], HashSet<TxHash>>>,
    /// Nonces by sender
    nonces: RwLock<HashMap<[u8; 32], u64>>,
}

impl MempoolManager {
    /// Create new mempool manager
    pub fn new(max_size: usize, min_gas_price: u128) -> Self {
        Self {
            max_size,
            min_gas_price,
            txs_by_hash: RwLock::new(HashMap::new()),
            txs_by_sender: RwLock::new(HashMap::new()),
            nonces: RwLock::new(HashMap::new()),
        }
    }

    /// Get mempool size
    pub async fn size(&self) -> usize {
        self.txs_by_hash.read().await.len()
    }

    /// Check if mempool is full
    pub async fn is_full(&self) -> bool {
        self.size().await >= self.max_size
    }

    /// Add transaction to mempool
    pub async fn add_tx(&self, tx: PendingTx) -> SequencerResult<()> {
        // Validate gas price
        if tx.gas_price < self.min_gas_price {
            return Err(SequencerError::ValidationError(
                format!("Gas price {} below minimum {}", tx.gas_price, self.min_gas_price)
            ));
        }

        // Check mempool capacity - try eviction if full
        if self.is_full().await {
            // Try to evict lowest priority transaction
            if !self.try_evict_for(&tx).await {
                return Err(SequencerError::MempoolFull { max_capacity: self.max_size });
            }
        }

        let hash = tx.hash;
        let sender = tx.sender;
        let nonce = tx.nonce;

        // Check for duplicate
        {
            let txs = self.txs_by_hash.read().await;
            if txs.contains_key(&hash) {
                return Err(SequencerError::DuplicateTransaction(hash.to_string()));
            }
        }

        // Validate nonce
        {
            let nonces = self.nonces.read().await;
            if let Some(&expected_nonce) = nonces.get(&sender) {
                if nonce < expected_nonce {
                    return Err(SequencerError::InvalidNonce {
                        expected: expected_nonce,
                        actual: nonce,
                    });
                }
            }
        }

        // Insert transaction
        {
            let mut txs = self.txs_by_hash.write().await;
            txs.insert(hash, tx.clone());
        }

        // Track by sender
        {
            let mut by_sender = self.txs_by_sender.write().await;
            by_sender.entry(sender).or_insert_with(HashSet::new).insert(hash);
        }

        debug!("Transaction added to mempool: {}", hash);
        Ok(())
    }

    /// Get transaction by hash
    pub async fn get_tx(&self, hash: &TxHash) -> Option<PendingTx> {
        let txs = self.txs_by_hash.read().await;
        txs.get(hash).cloned()
    }

    /// Remove transaction from mempool
    pub async fn remove_tx(&self, hash: &TxHash) -> Option<PendingTx> {
        let tx = {
            let mut txs = self.txs_by_hash.write().await;
            txs.remove(hash)
        };

        if let Some(ref tx) = tx {
            // Remove from sender tracking
            let mut by_sender = self.txs_by_sender.write().await;
            if let Some(sender_txs) = by_sender.get_mut(&tx.sender) {
                sender_txs.remove(hash);
                if sender_txs.is_empty() {
                    by_sender.remove(&tx.sender);
                }
            }

            // Update nonce
            let mut nonces = self.nonces.write().await;
            let entry = nonces.entry(tx.sender).or_insert(0);
            if tx.nonce >= *entry {
                *entry = tx.nonce + 1;
            }

            debug!("Transaction removed from mempool: {}", hash);
        }

        tx
    }

    /// Get transactions for batch building
    ///
    /// Returns transactions ordered by priority and gas price,
    /// up to the specified limits.
    pub async fn get_batch_txs(
        &self,
        max_txs: usize,
        max_gas: u64,
    ) -> SequencerResult<Vec<PendingTx>> {
        let txs = self.txs_by_hash.read().await;
        
        if txs.is_empty() {
            return Ok(Vec::new());
        }

        // Build priority queue
        let mut heap: BinaryHeap<OrderedTx> = txs
            .values()
            .map(|tx| OrderedTx {
                tx: tx.clone(),
                effective_gas_price: tx.effective_gas_price(),
            })
            .collect();

        let mut result = Vec::with_capacity(max_txs);
        let mut total_gas: u64 = 0;

        while let Some(ordered) = heap.pop() {
            if result.len() >= max_txs {
                break;
            }

            if total_gas + ordered.tx.gas_limit > max_gas {
                continue; // Skip tx that exceeds gas limit
            }

            total_gas += ordered.tx.gas_limit;
            result.push(ordered.tx);
        }

        info!("Selected {} transactions for batch (gas: {})", result.len(), total_gas);
        Ok(result)
    }

    /// Get transactions by sender
    pub async fn get_txs_by_sender(&self, sender: &[u8; 32]) -> Vec<PendingTx> {
        let by_sender = self.txs_by_sender.read().await;
        let txs = self.txs_by_hash.read().await;

        by_sender
            .get(sender)
            .map(|hashes| {
                hashes
                    .iter()
                    .filter_map(|h| txs.get(h).cloned())
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get current nonce for sender
    pub async fn get_nonce(&self, sender: &[u8; 32]) -> u64 {
        let nonces = self.nonces.read().await;
        nonces.get(sender).copied().unwrap_or(0)
    }

    /// Try to evict lowest priority transaction for new tx
    /// Returns true if eviction succeeded, false otherwise
    async fn try_evict_for(&self, new_tx: &PendingTx) -> bool {
        let txs = self.txs_by_hash.read().await;
        
        if txs.is_empty() {
            return false;
        }

        // Find the lowest priority transaction
        let lowest = txs.values().min_by(|a, b| {
            // Compare priority first
            match a.priority.cmp(&b.priority) {
                Ordering::Equal => {}
                ord => return ord,
            }
            // Then gas price
            match a.gas_price.cmp(&b.gas_price) {
                Ordering::Equal => {}
                ord => return ord,
            }
            // Earlier timestamp = lower priority for eviction
            b.received_at.cmp(&a.received_at)
        });

        let lowest = match lowest {
            Some(tx) => tx.clone(),
            None => return false,
        };

        // Check if new tx has higher priority
        let new_is_better = match new_tx.priority.cmp(&lowest.priority) {
            Ordering::Greater => true,
            Ordering::Less => false,
            Ordering::Equal => new_tx.gas_price > lowest.gas_price,
        };

        if !new_is_better {
            return false;
        }

        // Release read lock before acquiring write lock
        drop(txs);

        // Evict the lowest priority transaction
        let evicted_hash = lowest.hash;
        self.remove_tx(&evicted_hash).await;
        
        info!(
            "Evicted tx {} (priority={:?}, gas={}) for new tx (priority={:?}, gas={})",
            evicted_hash, lowest.priority, lowest.gas_price,
            new_tx.priority, new_tx.gas_price
        );

        true
    }

    /// Clear all transactions
    pub async fn clear(&self) {
        let mut txs = self.txs_by_hash.write().await;
        let mut by_sender = self.txs_by_sender.write().await;
        
        txs.clear();
        by_sender.clear();
        
        info!("Mempool cleared");
    }

    /// Get mempool stats
    pub async fn stats(&self) -> MempoolStats {
        let txs = self.txs_by_hash.read().await;
        let by_sender = self.txs_by_sender.read().await;

        let total_txs = txs.len();
        let unique_senders = by_sender.len();
        let total_gas: u64 = txs.values().map(|tx| tx.gas_limit).sum();

        let (min_gas_price, max_gas_price, avg_gas_price) = if txs.is_empty() {
            (0, 0, 0)
        } else {
            let prices: Vec<u128> = txs.values().map(|tx| tx.gas_price).collect();
            let min = *prices.iter().min().unwrap();
            let max = *prices.iter().max().unwrap();
            let avg = prices.iter().sum::<u128>() / prices.len() as u128;
            (min, max, avg)
        };

        let priority_counts = {
            let mut counts = [0usize; 4];
            for tx in txs.values() {
                match tx.priority {
                    TxPriority::Low => counts[0] += 1,
                    TxPriority::Normal => counts[1] += 1,
                    TxPriority::High => counts[2] += 1,
                    TxPriority::Urgent => counts[3] += 1,
                }
            }
            counts
        };

        MempoolStats {
            total_txs,
            unique_senders,
            total_gas,
            min_gas_price,
            max_gas_price,
            avg_gas_price,
            priority_counts,
            max_size: self.max_size,
        }
    }
}

/// Mempool statistics
#[derive(Debug, Clone)]
pub struct MempoolStats {
    /// Total transactions
    pub total_txs: usize,
    /// Unique senders
    pub unique_senders: usize,
    /// Total gas
    pub total_gas: u64,
    /// Minimum gas price
    pub min_gas_price: u128,
    /// Maximum gas price
    pub max_gas_price: u128,
    /// Average gas price
    pub avg_gas_price: u128,
    /// Priority counts [Low, Normal, High, Urgent]
    pub priority_counts: [usize; 4],
    /// Maximum size
    pub max_size: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::TxType;

    fn create_test_tx(sender: [u8; 32], nonce: u64, gas_price: u128) -> PendingTx {
        let mut tx = PendingTx {
            hash: TxHash::from_bytes([0u8; 32]),
            tx_type: TxType::BridgeLock,
            sender,
            nonce,
            gas_price,
            gas_limit: 21000,
            data: vec![],
            signature: vec![],
            priority: TxPriority::Normal,
            received_at: chrono::Utc::now().timestamp() as u64,
        };
        tx.hash = tx.calculate_hash();
        tx
    }

    #[tokio::test]
    async fn test_add_and_get_tx() {
        let mempool = MempoolManager::new(100, 1_000_000_000);
        let tx = create_test_tx([1u8; 32], 0, 2_000_000_000);
        let hash = tx.hash;

        mempool.add_tx(tx).await.unwrap();
        
        let retrieved = mempool.get_tx(&hash).await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().hash, hash);
    }

    #[tokio::test]
    async fn test_duplicate_rejection() {
        let mempool = MempoolManager::new(100, 1_000_000_000);
        let tx = create_test_tx([1u8; 32], 0, 2_000_000_000);

        mempool.add_tx(tx.clone()).await.unwrap();
        let result = mempool.add_tx(tx).await;
        
        assert!(matches!(result, Err(SequencerError::DuplicateTransaction(_))));
    }

    #[tokio::test]
    async fn test_gas_price_validation() {
        let mempool = MempoolManager::new(100, 2_000_000_000);
        let tx = create_test_tx([1u8; 32], 0, 1_000_000_000); // Below minimum

        let result = mempool.add_tx(tx).await;
        assert!(matches!(result, Err(SequencerError::ValidationError(_))));
    }

    #[tokio::test]
    async fn test_batch_selection() {
        let mempool = MempoolManager::new(100, 1_000_000_000);

        // Add txs with different gas prices
        for i in 0..5 {
            let tx = create_test_tx([i as u8; 32], 0, (i + 1) as u128 * 1_000_000_000);
            mempool.add_tx(tx).await.unwrap();
        }

        let batch = mempool.get_batch_txs(3, 100_000).await.unwrap();
        
        assert_eq!(batch.len(), 3);
        // Highest gas price first
        assert!(batch[0].gas_price >= batch[1].gas_price);
        assert!(batch[1].gas_price >= batch[2].gas_price);
    }

    #[tokio::test]
    async fn test_mempool_full() {
        let mempool = MempoolManager::new(2, 1_000_000_000);

        // Add two low-priority txs
        for i in 0..2 {
            let tx = create_test_tx([i as u8; 32], 0, 2_000_000_000);
            mempool.add_tx(tx).await.unwrap();
        }

        // Same priority and gas price - should fail (no eviction possible)
        let tx = create_test_tx([99u8; 32], 0, 2_000_000_000);
        let result = mempool.add_tx(tx).await;
        
        assert!(matches!(result, Err(SequencerError::MempoolFull { .. })));
    }

    #[tokio::test]
    async fn test_eviction_higher_gas_price() {
        let mempool = MempoolManager::new(2, 1_000_000_000);

        // Add two txs with low gas price
        for i in 0..2 {
            let tx = create_test_tx([i as u8; 32], 0, 2_000_000_000);
            mempool.add_tx(tx).await.unwrap();
        }

        // Higher gas price should trigger eviction
        let high_gas_tx = create_test_tx([99u8; 32], 0, 5_000_000_000);
        let result = mempool.add_tx(high_gas_tx).await;
        
        assert!(result.is_ok());
        assert_eq!(mempool.size().await, 2); // Still at capacity
    }

    fn create_test_tx_with_priority(sender: [u8; 32], nonce: u64, gas_price: u128, priority: TxPriority) -> PendingTx {
        let mut tx = PendingTx {
            hash: TxHash::from_bytes([0u8; 32]),
            tx_type: TxType::BridgeLock,
            sender,
            nonce,
            gas_price,
            gas_limit: 21000,
            data: vec![],
            signature: vec![],
            priority,
            received_at: chrono::Utc::now().timestamp() as u64,
        };
        tx.hash = tx.calculate_hash();
        tx
    }

    #[tokio::test]
    async fn test_eviction_higher_priority() {
        let mempool = MempoolManager::new(2, 1_000_000_000);

        // Add two Low priority txs
        for i in 0..2 {
            let tx = create_test_tx_with_priority([i as u8; 32], 0, 2_000_000_000, TxPriority::Low);
            mempool.add_tx(tx).await.unwrap();
        }

        // Urgent priority should trigger eviction
        let urgent_tx = create_test_tx_with_priority([99u8; 32], 0, 2_000_000_000, TxPriority::Urgent);
        let result = mempool.add_tx(urgent_tx).await;
        
        assert!(result.is_ok());
        assert_eq!(mempool.size().await, 2);
    }

    #[tokio::test]
    async fn test_stats() {
        let mempool = MempoolManager::new(100, 1_000_000_000);

        for i in 0..3 {
            let tx = create_test_tx([i as u8; 32], 0, (i + 1) as u128 * 1_000_000_000);
            mempool.add_tx(tx).await.unwrap();
        }

        let stats = mempool.stats().await;
        
        assert_eq!(stats.total_txs, 3);
        assert_eq!(stats.unique_senders, 3);
        assert_eq!(stats.min_gas_price, 1_000_000_000);
        assert_eq!(stats.max_gas_price, 3_000_000_000);
    }
}
