//! Single-node development mode for L3 Aegis
//!
//! Implements --dev --single mode per L3_CHAIN_SPECIFICATION.md §10

use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{RwLock, mpsc};
use tracing::{info, warn, debug, error};
use thiserror::Error;

use aegis_types::{Block, BlockHeader, BlockBody, Hash256, NodeId, Transaction, PROTOCOL_VERSION};
use aegis_core::Executor;
use aegis_storage::{Storage, StorageConfig};

#[derive(Error, Debug)]
pub enum SingleNodeError {
    #[error("Storage error: {0}")]
    Storage(String),
    #[error("Execution error: {0}")]
    Execution(String),
    #[error("Already running")]
    AlreadyRunning,
}

pub type SingleNodeResult<T> = Result<T, SingleNodeError>;

#[derive(Clone, Debug)]
pub struct SingleNodeConfig {
    pub block_interval_ms: u64,
    pub max_txs_per_block: usize,
    pub memory_limit_mb: usize,
    pub data_dir: std::path::PathBuf,
}

impl Default for SingleNodeConfig {
    fn default() -> Self {
        Self {
            block_interval_ms: 1000,
            max_txs_per_block: 100,
            memory_limit_mb: 500,
            data_dir: std::path::PathBuf::from("./data/dev"),
        }
    }
}

pub struct SingleNode {
    config: SingleNodeConfig,
    node_id: NodeId,
    executor: Arc<RwLock<Executor>>,
    storage: Option<Storage>,
    tx_pool: Arc<RwLock<Vec<Transaction>>>,
    current_height: Arc<RwLock<u64>>,
    running: Arc<RwLock<bool>>,
    shutdown_tx: Option<mpsc::Sender<()>>,
}

impl SingleNode {
    pub fn new(config: SingleNodeConfig) -> SingleNodeResult<Self> {
        let node_id = NodeId::from_public_key(b"dev-single-node");
        Ok(Self {
            config, node_id,
            executor: Arc::new(RwLock::new(Executor::with_fresh_state())),
            storage: None,
            tx_pool: Arc::new(RwLock::new(Vec::new())),
            current_height: Arc::new(RwLock::new(0)),
            running: Arc::new(RwLock::new(false)),
            shutdown_tx: None,
        })
    }

    pub async fn with_storage(mut self) -> SingleNodeResult<Self> {
        std::fs::create_dir_all(&self.config.data_dir)
            .map_err(|e| SingleNodeError::Storage(e.to_string()))?;
        let storage_config = StorageConfig::new(self.config.data_dir.clone());
        let storage = Storage::open(storage_config)
            .map_err(|e| SingleNodeError::Storage(e.to_string()))?;
        if let Ok(Some(tip)) = storage.chain_tip() {
            if let Ok(Some(header)) = storage.blocks().get_header(&tip) {
                *self.current_height.write().await = header.height;
                info!(height = header.height, "Loaded chain state");
            }
        }
        self.storage = Some(storage);
        Ok(self)
    }

    pub async fn start(&mut self) -> SingleNodeResult<()> {
        let mut running = self.running.write().await;
        if *running { return Err(SingleNodeError::AlreadyRunning); }
        *running = true;
        drop(running);

        let (shutdown_tx, mut shutdown_rx) = mpsc::channel::<()>(1);
        self.shutdown_tx = Some(shutdown_tx);

        info!(node_id = %self.node_id, "Starting single-node dev mode");

        if *self.current_height.read().await == 0 {
            self.produce_genesis_block().await?;
        }

        let interval = Duration::from_millis(self.config.block_interval_ms);
        let executor = self.executor.clone();
        let tx_pool = self.tx_pool.clone();
        let current_height = self.current_height.clone();
        let running = self.running.clone();
        let node_id = self.node_id;
        let max_txs = self.config.max_txs_per_block;

        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(interval);
            loop {
                tokio::select! {
                    _ = ticker.tick() => {
                        if !*running.read().await { break; }
                        let txs: Vec<_> = {
                            let mut pool = tx_pool.write().await;
                            pool.drain(..pool.len().min(max_txs)).collect()
                        };
                        let height = *current_height.read().await;
                        let parent_hash = Hash256::hash(&height.to_le_bytes());
                        let mut body = BlockBody::new();
                        for tx in txs { body.add_transaction(tx); }
                        let new_height = height + 1;
                        let state_root = executor.read().await.state().state_root();
                        let header = BlockHeader {
                            version: PROTOCOL_VERSION, height: new_height,
                            timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
                            parent_hash, state_root, tx_root: body.compute_tx_root(),
                            proposer: node_id, validator_signatures: vec![],
                        };
                        let block = Block::new(header, body);
                        if let Err(e) = executor.write().await.execute_block(&block) {
                            error!(error = %e, "Failed to execute block");
                            continue;
                        }
                        *current_height.write().await = new_height;
                        debug!(height = new_height, "Produced block");
                    }
                    _ = shutdown_rx.recv() => { break; }
                }
            }
            *running.write().await = false;
        });
        Ok(())
    }

    pub async fn stop(&mut self) -> SingleNodeResult<()> {
        if let Some(tx) = self.shutdown_tx.take() { let _ = tx.send(()).await; }
        *self.running.write().await = false;
        info!("Single-node stopped");
        Ok(())
    }

    async fn produce_genesis_block(&mut self) -> SingleNodeResult<()> {
        let timestamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        let block = Block::genesis(timestamp, self.node_id);
        if let Some(ref storage) = self.storage {
            storage.blocks().put_header(&block.header).map_err(|e| SingleNodeError::Storage(e.to_string()))?;
            storage.set_chain_tip(&block.hash()).map_err(|e| SingleNodeError::Storage(e.to_string()))?;
        }
        info!(hash = %block.hash(), "Genesis block created");
        Ok(())
    }

    pub async fn submit_transaction(&self, tx: Transaction) -> SingleNodeResult<Hash256> {
        self.executor.read().await.validate_transaction(&tx)
            .map_err(|e| SingleNodeError::Execution(e.to_string()))?;
        let tx_hash = Hash256::hash(&serde_json::to_vec(&tx).unwrap_or_default());
        self.tx_pool.write().await.push(tx);
        debug!(hash = %tx_hash, "Transaction submitted");
        Ok(tx_hash)
    }

    pub async fn height(&self) -> u64 { *self.current_height.read().await }
    pub async fn pending_tx_count(&self) -> usize { self.tx_pool.read().await.len() }
    pub async fn state_root(&self) -> Hash256 { self.executor.read().await.state().state_root() }
    pub async fn is_running(&self) -> bool { *self.running.read().await }
    pub fn node_id(&self) -> NodeId { self.node_id }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aegis_types::{UnlockRequestTx, Address, DilithiumPublicKey};
    use tempfile::tempdir;

    fn test_config() -> SingleNodeConfig {
        SingleNodeConfig {
            block_interval_ms: 100, max_txs_per_block: 10, memory_limit_mb: 100,
            data_dir: tempdir().unwrap().into_path(),
        }
    }

    #[tokio::test]
    async fn test_single_node() {
        let node = SingleNode::new(test_config()).unwrap();
        assert!(!node.is_running().await);
        let tx = Transaction::UnlockRequest(UnlockRequestTx {
            unlock_id: Hash256::hash(b"u1"), lock_id: Hash256::hash(b"l1"),
            dest_addr: Address::zero(), amount: 1000,
            owner_pk: DilithiumPublicKey(vec![1,2,3]), owner_signature: vec![4,5,6], timestamp: 123,
        });
        let hash = node.submit_transaction(tx).await.unwrap();
        assert!(!hash.is_zero());
    }
}
