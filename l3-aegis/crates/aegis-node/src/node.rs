//! Aegis node implementation.

use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};
use thiserror::Error;

use crate::config::NodeConfig;

/// Node errors.
#[derive(Error, Debug)]
pub enum NodeError {
    #[error("Failed to initialize storage: {0}")]
    StorageInit(String),
    
    #[error("Failed to start network: {0}")]
    NetworkStart(String),
    
    #[error("Consensus error: {0}")]
    Consensus(String),
    
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

/// L3 Aegis Node.
pub struct AegisNode {
    config: NodeConfig,
    state: Arc<RwLock<NodeState>>,
    // TODO: Add actual components
    // storage: Storage,
    // network: NetworkManager,
    // consensus: ConsensusEngine,
    // rpc: RpcServer,
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

        // TODO: Initialize components
        // let storage = Storage::open(config.storage.clone())?;
        // let network = NetworkManager::new(config.p2p.clone()).await?;
        // let consensus = ConsensusEngine::new(config.consensus.clone())?;

        Ok(Self {
            config,
            state: Arc::new(RwLock::new(NodeState::Initializing)),
        })
    }

    /// Run the node until shutdown signal.
    pub async fn run(self) -> anyhow::Result<()> {
        // Update state
        {
            let mut state = self.state.write().await;
            *state = NodeState::Running;
        }

        info!("Node is running");

        if self.config.dev_mode {
            info!("Running in development mode (single node)");
            // In dev mode, we can produce blocks ourselves
            self.run_dev_mode().await
        } else {
            // In production mode, wait for peers and sync
            self.run_production_mode().await
        }
    }

    /// Run in development mode (single node).
    async fn run_dev_mode(&self) -> anyhow::Result<()> {
        info!("Development mode: simulating block production");

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
            info!(block = block_number, "Produced dev block");
        }
    }

    /// Run in production mode (4-node BFT).
    async fn run_production_mode(&self) -> anyhow::Result<()> {
        info!("Production mode: connecting to peers...");

        // TODO: Implement actual production logic
        // 1. Connect to static peers
        // 2. Sync chain state
        // 3. Start consensus participation
        // 4. Start RPC server

        // Wait for shutdown signal
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

        // TODO: Graceful shutdown of components
        // self.rpc.stop().await?;
        // self.consensus.stop().await?;
        // self.network.stop().await?;
        // self.storage.close()?;

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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_node_creation() {
        let config = NodeConfig::dev();
        let node = AegisNode::new(config).await.unwrap();
        
        assert_eq!(node.state().await, NodeState::Initializing);
        assert!(node.config().dev_mode);
    }
}
