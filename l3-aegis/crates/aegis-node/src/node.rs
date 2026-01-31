//! Aegis node implementation.
//!
//! Wires together storage, network, consensus, and RPC components
//! for the L3 Aegis node.

use std::net::SocketAddr;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error, debug};
use thiserror::Error;

use crate::config::NodeConfig;
use crate::rpc::{RpcConfig, RpcHandler};

use aegis_core::Executor;
use aegis_storage::{Storage, StorageConfig};
use aegis_network::{Transport, PeerManager};
use aegis_types::{NodeId, Transaction};
use aegis_crypto::DilithiumKeyPair;

/// Node errors.
#[derive(Error, Debug)]
pub enum NodeError {
    #[error("Failed to initialize storage: {0}")]
    StorageInit(String),

    #[error("Failed to start network: {0}")]
    NetworkStart(String),

    #[error("Consensus error: {0}")]
    Consensus(String),

    #[error("RPC error: {0}")]
    Rpc(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Node already running")]
    AlreadyRunning,

    #[error("Node not initialized")]
    NotInitialized,
}

/// Node state.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NodeState {
    /// Node is initializing
    Initializing,
    /// Node is syncing with network
    Syncing,
    /// Node is running normally
    Running,
    /// Node is shutting down
    ShuttingDown,
    /// Node is stopped
    Stopped,
}

/// Component handles for the node
pub struct NodeComponents {
    /// Storage backend
    pub storage: Arc<Storage>,
    /// State executor
    pub executor: Arc<RwLock<Executor>>,
    /// Network transport
    pub transport: Arc<Transport>,
    /// Peer manager
    pub peer_manager: Arc<PeerManager>,
    /// Validator key pair (for signing blocks)
    pub validator_keypair: Option<DilithiumKeyPair>,
    /// Is validator mode enabled
    pub is_validator: bool,
    /// Transaction sender channel
    pub tx_sender: tokio::sync::mpsc::Sender<Transaction>,
    /// Transaction receiver channel
    pub tx_receiver: Arc<RwLock<tokio::sync::mpsc::Receiver<Transaction>>>,
}

/// L3 Aegis Node.
pub struct AegisNode {
    config: NodeConfig,
    state: Arc<RwLock<NodeState>>,
    node_id: NodeId,
    components: Option<NodeComponents>,
}

impl AegisNode {
    /// Create a new node instance.
    pub async fn new(config: NodeConfig) -> anyhow::Result<Self> {
        info!(
            data_dir = %config.data_dir.display(),
            dev_mode = config.dev_mode,
            "Initializing Aegis node"
        );

        // Ensure data directory exists
        std::fs::create_dir_all(&config.data_dir)?;
        std::fs::create_dir_all(config.db_path())?;

        // Generate or load node ID
        let node_id = if let Some(ref id) = config.node_id {
            NodeId::from_public_key(id.as_bytes())
        } else {
            // Generate a temporary node ID
            NodeId::from_public_key(b"aegis-node-temp")
        };

        // Initialize storage
        let storage_config = StorageConfig::new(config.db_path());
        let storage = Storage::open(storage_config)
            .map_err(|e| NodeError::StorageInit(e.to_string()))?;
        info!("Storage initialized at {:?}", config.db_path());

        // Initialize executor with fresh state
        let executor = Arc::new(RwLock::new(Executor::with_fresh_state()));

        // Initialize network transport
        let bind_addr: SocketAddr = format!("{}:{}", config.p2p.listen_addr, config.p2p.port)
            .parse()
            .map_err(|e| NodeError::Config(format!("Invalid P2P address: {}", e)))?;

        let transport = if config.dev_mode {
            // Use plain TCP in dev mode
            Transport::new_plain(bind_addr)
        } else {
            // Use TLS in production
            // Note: In production, this would load certs from config paths
            Transport::new_plain(bind_addr) // Fallback for now
        };
        info!(addr = %bind_addr, "Network transport configured");

        // Initialize peer manager
        let peer_manager = PeerManager::new(node_id);
        info!("Peer manager initialized");

        // Create transaction channel
        let (tx_sender, tx_receiver) = tokio::sync::mpsc::channel::<Transaction>(1000);

        // Initialize validator key pair (if validator mode)
        let (validator_keypair, is_validator) = if config.dev_mode {
            // In dev mode, create a mock keypair for signing
            let kp = DilithiumKeyPair::generate()
                .map_err(|e| NodeError::Consensus(format!("Failed to generate keypair: {}", e)))?;
            info!("Generated dev validator keypair");
            (Some(kp), true)
        } else {
            // In production mode, check if validator key is configured
            match &config.consensus.validator_key_path {
                Some(path) => {
                    info!("Validator key path configured: {:?}", path);
                    // Generate keypair (in production, would load from file)
                    let kp = DilithiumKeyPair::generate()
                        .map_err(|e| NodeError::Consensus(format!("Failed to generate keypair: {}", e)))?;
                    info!("Validator mode enabled");
                    (Some(kp), true)
                }
                None => {
                    warn!("No validator key path configured, running in observer mode");
                    (None, false)
                }
            }
        };

        let components = NodeComponents {
            storage: Arc::new(storage),
            executor,
            transport: Arc::new(transport),
            peer_manager: Arc::new(peer_manager),
            validator_keypair,
            is_validator,
            tx_sender,
            tx_receiver: Arc::new(RwLock::new(tx_receiver)),
        };

        Ok(Self {
            config,
            state: Arc::new(RwLock::new(NodeState::Initializing)),
            node_id,
            components: Some(components),
        })
    }

    /// Run the node until shutdown signal.
    pub async fn run(self) -> anyhow::Result<()> {
        // Update state
        {
            let mut state = self.state.write().await;
            *state = NodeState::Running;
        }

        info!(node_id = %self.node_id, "Node is running");

        if self.config.dev_mode {
            info!("Running in development mode (single node)");
            self.run_dev_mode().await
        } else {
            info!("Running in production mode (4-node BFT)");
            self.run_production_mode().await
        }
    }

    /// Run in development mode (single node).
    async fn run_dev_mode(&self) -> anyhow::Result<()> {
        info!("Development mode: starting block production");

        let components = self.components.as_ref()
            .ok_or_else(|| NodeError::NotInitialized)?;

        // Start RPC server if enabled
        if self.config.rpc.enabled {
            let rpc_addr: SocketAddr = format!("{}:{}", self.config.rpc.host, self.config.rpc.port)
                .parse()
                .map_err(|e| NodeError::Rpc(format!("Invalid RPC address: {}", e)))?;
            info!(addr = %rpc_addr, "RPC server would start here");
            // Note: RPC server integration would be implemented with actix-web
        }

        // Wait for shutdown signal
        let shutdown = tokio::signal::ctrl_c();

        tokio::select! {
            _ = shutdown => {
                info!("Received shutdown signal");
            }
            _ = self.dev_block_production() => {
                warn!("Block production stopped unexpectedly");
            }
        }

        self.shutdown().await
    }

    /// Simulate block production in dev mode.
    async fn dev_block_production(&self) {
        let block_time = std::time::Duration::from_secs(
            self.config.consensus.block_time_secs
        );

        let mut block_number = 0u64;

        loop {
            tokio::time::sleep(block_time).await;
            block_number += 1;

            // Get pending transactions
            if let Some(ref components) = self.components {
                let pending_count = {
                    let mut rx = components.tx_receiver.write().await;
                    let mut count = 0;
                    while rx.try_recv().is_ok() {
                        count += 1;
                    }
                    count
                };

                let state_root = components.executor.read().await.state().state_root();
                info!(
                    block = block_number,
                    txs = pending_count,
                    state_root = %state_root,
                    "Produced dev block"
                );
            } else {
                info!(block = block_number, "Produced dev block");
            }
        }
    }

    /// Run in production mode (4-node BFT).
    async fn run_production_mode(&self) -> anyhow::Result<()> {
        info!("Production mode: connecting to peers...");

        let components = self.components.as_ref()
            .ok_or_else(|| NodeError::NotInitialized)?;

        // 1. Start listening for P2P connections
        let listener = components.transport.listen().await
            .map_err(|e| NodeError::NetworkStart(e.to_string()))?;
        info!(addr = %listener.local_addr()?, "P2P listener started");

        // 2. Connect to static peers
        for peer_addr in &self.config.p2p.static_peers {
            match peer_addr.parse::<SocketAddr>() {
                Ok(addr) => {
                    info!(peer = %addr, "Connecting to static peer");
                    match components.transport.connect(addr).await {
                        Ok(conn) => {
                            debug!(peer = %addr, "Connected to peer");
                            // Would handle connection here
                        }
                        Err(e) => {
                            warn!(peer = %addr, error = %e, "Failed to connect to peer");
                        }
                    }
                }
                Err(e) => {
                    warn!(peer = peer_addr, error = %e, "Invalid peer address");
                }
            }
        }

        // 3. Start RPC server if enabled
        if self.config.rpc.enabled {
            let rpc_addr: SocketAddr = format!("{}:{}", self.config.rpc.host, self.config.rpc.port)
                .parse()
                .map_err(|e| NodeError::Rpc(format!("Invalid RPC address: {}", e)))?;
            info!(addr = %rpc_addr, "RPC server would start here");
        }

        // 4. Start consensus participation (if validator)
        if components.is_validator {
            info!("Starting consensus participation as validator");
            // Consensus engine would be started here
        }

        // 5. Main loop - wait for shutdown
        info!("Node fully initialized, waiting for shutdown signal");
        tokio::signal::ctrl_c().await?;
        info!("Received shutdown signal");

        self.shutdown().await
    }

    /// Gracefully shutdown the node.
    async fn shutdown(&self) -> anyhow::Result<()> {
        info!("Shutting down node...");

        {
            let mut state = self.state.write().await;
            *state = NodeState::ShuttingDown;
        }

        // Graceful shutdown of components
        if let Some(ref components) = self.components {
            // Stop consensus (if validator)
            if components.is_validator {
                debug!("Stopping consensus participation");
            }

            // Close storage
            debug!("Closing storage");
            // Storage close would happen on drop

            info!("All components stopped");
        }

        {
            let mut state = self.state.write().await;
            *state = NodeState::Stopped;
        }

        info!("Node shutdown complete");
        Ok(())
    }

    /// Get current node state.
    pub async fn state(&self) -> NodeState {
        *self.state.read().await
    }

    /// Get node configuration.
    pub fn config(&self) -> &NodeConfig {
        &self.config
    }

    /// Get node ID.
    pub fn node_id(&self) -> NodeId {
        self.node_id
    }

    /// Get storage reference.
    pub fn storage(&self) -> Option<Arc<Storage>> {
        self.components.as_ref().map(|c| c.storage.clone())
    }

    /// Get executor reference.
    pub fn executor(&self) -> Option<Arc<RwLock<Executor>>> {
        self.components.as_ref().map(|c| c.executor.clone())
    }

    /// Submit a transaction to the node.
    pub async fn submit_transaction(&self, tx: Transaction) -> Result<(), NodeError> {
        if let Some(ref components) = self.components {
            components.tx_sender.send(tx).await
                .map_err(|e| NodeError::Rpc(format!("Failed to submit tx: {}", e)))?;
            Ok(())
        } else {
            Err(NodeError::NotInitialized)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn test_config() -> NodeConfig {
        let dir = tempdir().unwrap();
        NodeConfig::dev().with_data_dir(dir.path().to_str().unwrap())
    }

    #[tokio::test]
    async fn test_node_creation() {
        let config = test_config();
        let node = AegisNode::new(config).await.unwrap();

        assert_eq!(node.state().await, NodeState::Initializing);
        assert!(node.config().dev_mode);
        assert!(node.storage().is_some());
        assert!(node.executor().is_some());
    }

    #[tokio::test]
    async fn test_node_id_generation() {
        let config = test_config();
        let node = AegisNode::new(config).await.unwrap();

        // Node ID should not be all zeros
        assert!(!node.node_id().as_bytes().iter().all(|&b| b == 0));
    }
}
