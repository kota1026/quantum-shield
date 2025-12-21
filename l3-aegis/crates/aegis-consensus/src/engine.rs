//! Consensus Engine
//!
//! Main PBFT consensus engine implementation.

use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tracing::{debug, info, warn};

use crate::message::{Block, ConsensusMessage, Hash256, MessageType, NodeId, Transaction};
use crate::state::{ConsensusState, Phase, QUORUM_SIZE};

/// Consensus engine configuration
#[derive(Debug, Clone)]
pub struct ConsensusConfig {
    /// This node's ID
    pub node_id: NodeId,
    /// Block time in milliseconds
    pub block_time_ms: u64,
    /// View change timeout in seconds
    pub view_change_timeout: u64,
    /// Maximum transactions per block
    pub max_txs_per_block: usize,
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self {
            node_id: 0,
            block_time_ms: 2000, // 2 seconds
            view_change_timeout: 5,
            max_txs_per_block: 100,
        }
    }
}

/// Consensus engine events
#[derive(Debug, Clone)]
pub enum ConsensusEvent {
    /// Block was committed
    BlockCommitted(Block),
    /// View changed
    ViewChanged(u64),
    /// Error occurred
    Error(String),
}

/// Consensus engine
pub struct ConsensusEngine {
    /// Configuration
    config: ConsensusConfig,
    /// Consensus state
    state: Arc<RwLock<ConsensusState>>,
    /// Pending transactions
    pending_txs: Arc<RwLock<Vec<Transaction>>>,
    /// Channel to send outgoing messages
    msg_sender: mpsc::Sender<ConsensusMessage>,
    /// Channel to receive events
    event_sender: mpsc::Sender<ConsensusEvent>,
}

impl ConsensusEngine {
    /// Create a new consensus engine
    pub fn new(
        config: ConsensusConfig,
        msg_sender: mpsc::Sender<ConsensusMessage>,
        event_sender: mpsc::Sender<ConsensusEvent>,
    ) -> Self {
        let state = ConsensusState::new(config.node_id);
        
        Self {
            config,
            state: Arc::new(RwLock::new(state)),
            pending_txs: Arc::new(RwLock::new(Vec::new())),
            msg_sender,
            event_sender,
        }
    }

    /// Get current state snapshot
    pub async fn get_state(&self) -> ConsensusStateSnapshot {
        let state = self.state.read().await;
        ConsensusStateSnapshot {
            node_id: state.node_id,
            view: state.view,
            height: state.committed_height,
            phase: state.current_height_state.phase,
            is_primary: state.is_primary(),
        }
    }

    /// Add transaction to pending pool
    pub async fn add_transaction(&self, tx: Transaction) {
        let mut pending = self.pending_txs.write().await;
        if pending.len() < self.config.max_txs_per_block {
            pending.push(tx);
        }
    }

    /// Propose a new block (called by primary)
    pub async fn propose_block(&self) -> Result<(), EngineError> {
        let mut state = self.state.write().await;
        
        if !state.is_primary() {
            return Err(EngineError::NotPrimary);
        }

        let mut pending = self.pending_txs.write().await;
        let transactions: Vec<Transaction> = pending.drain(..).collect();
        
        let height = state.current_height();
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Create new block
        let block = Block::new(
            height,
            timestamp,
            state.committed_hash,
            [0u8; 32], // State root computed after execution
            transactions,
            state.node_id,
        );

        // Create PrePrepare message
        let msg = ConsensusMessage::pre_prepare(
            state.view,
            height,
            block.clone(),
            state.node_id,
        );

        // Update local state
        state.current_height_state.phase = Phase::PrePrepared;
        state.current_height_state.block = Some(block);
        state.current_height_state.digest = msg.digest;

        info!(
            "Node {} proposing block at height {} (view {})",
            state.node_id, height, state.view
        );

        // Broadcast PrePrepare
        drop(state);
        self.msg_sender.send(msg).await.map_err(|_| EngineError::SendFailed)?;

        Ok(())
    }

    /// Handle incoming consensus message
    pub async fn handle_message(&self, msg: ConsensusMessage) -> Result<(), EngineError> {
        match msg.msg_type {
            MessageType::PrePrepare => self.handle_pre_prepare(msg).await,
            MessageType::Prepare => self.handle_prepare(msg).await,
            MessageType::Commit => self.handle_commit(msg).await,
            MessageType::ViewChange => self.handle_view_change(msg).await,
            MessageType::NewView => self.handle_new_view(msg).await,
        }
    }

    /// Handle PrePrepare message
    async fn handle_pre_prepare(&self, msg: ConsensusMessage) -> Result<(), EngineError> {
        let mut state = self.state.write().await;
        
        debug!(
            "Node {} received PrePrepare for height {} from node {}",
            state.node_id, msg.height, msg.sender
        );

        // Process the message
        state.on_pre_prepare(msg.clone())
            .map_err(|e| EngineError::StateError(e.to_string()))?;

        // Send Prepare message
        let prepare = ConsensusMessage::prepare(
            state.view,
            msg.height,
            msg.digest,
            state.node_id,
        );

        drop(state);
        self.msg_sender.send(prepare).await.map_err(|_| EngineError::SendFailed)?;

        Ok(())
    }

    /// Handle Prepare message
    async fn handle_prepare(&self, msg: ConsensusMessage) -> Result<(), EngineError> {
        let mut state = self.state.write().await;
        
        debug!(
            "Node {} received Prepare for height {} from node {}",
            state.node_id, msg.height, msg.sender
        );

        // Process the message
        let ready_to_commit = state.on_prepare(msg.clone())
            .map_err(|e| EngineError::StateError(e.to_string()))?;

        if ready_to_commit {
            info!(
                "Node {} has prepare quorum for height {}",
                state.node_id, msg.height
            );

            // Send Commit message
            let commit = ConsensusMessage::commit(
                state.view,
                msg.height,
                msg.digest,
                state.node_id,
            );

            drop(state);
            self.msg_sender.send(commit).await.map_err(|_| EngineError::SendFailed)?;
        }

        Ok(())
    }

    /// Handle Commit message
    async fn handle_commit(&self, msg: ConsensusMessage) -> Result<(), EngineError> {
        let mut state = self.state.write().await;
        
        debug!(
            "Node {} received Commit for height {} from node {}",
            state.node_id, msg.height, msg.sender
        );

        // Process the message
        let ready_to_execute = state.on_commit(msg.clone())
            .map_err(|e| EngineError::StateError(e.to_string()))?;

        if ready_to_execute {
            info!(
                "Node {} has commit quorum for height {}, executing block",
                state.node_id, msg.height
            );

            // Execute the block
            if let Some(block) = state.current_height_state.block.clone() {
                state.advance_height(&block);
                
                // Notify listeners
                drop(state);
                self.event_sender
                    .send(ConsensusEvent::BlockCommitted(block))
                    .await
                    .ok();
            }
        }

        Ok(())
    }

    /// Handle ViewChange message
    async fn handle_view_change(&self, _msg: ConsensusMessage) -> Result<(), EngineError> {
        // TODO: Implement view change handling
        warn!("ViewChange handling not yet implemented");
        Ok(())
    }

    /// Handle NewView message
    async fn handle_new_view(&self, _msg: ConsensusMessage) -> Result<(), EngineError> {
        // TODO: Implement new view handling
        warn!("NewView handling not yet implemented");
        Ok(())
    }

    /// Start view change procedure
    pub async fn initiate_view_change(&self) -> Result<(), EngineError> {
        let mut state = self.state.write().await;
        let new_view = state.view + 1;
        
        info!(
            "Node {} initiating view change to view {}",
            state.node_id, new_view
        );

        state.start_view_change(new_view);

        // TODO: Broadcast ViewChange message

        drop(state);
        self.event_sender
            .send(ConsensusEvent::ViewChanged(new_view))
            .await
            .ok();

        Ok(())
    }
}

/// Snapshot of consensus state (for external queries)
#[derive(Debug, Clone)]
pub struct ConsensusStateSnapshot {
    pub node_id: NodeId,
    pub view: u64,
    pub height: u64,
    pub phase: Phase,
    pub is_primary: bool,
}

/// Engine errors
#[derive(Debug, Clone)]
pub enum EngineError {
    /// Not the primary node
    NotPrimary,
    /// Failed to send message
    SendFailed,
    /// State error
    StateError(String),
}

impl std::fmt::Display for EngineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EngineError::NotPrimary => write!(f, "Not the primary node"),
            EngineError::SendFailed => write!(f, "Failed to send message"),
            EngineError::StateError(e) => write!(f, "State error: {}", e),
        }
    }
}

impl std::error::Error for EngineError {}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::sync::mpsc;

    #[tokio::test]
    async fn test_engine_creation() {
        let (msg_tx, _msg_rx) = mpsc::channel(100);
        let (event_tx, _event_rx) = mpsc::channel(100);
        
        let config = ConsensusConfig {
            node_id: 0,
            ..Default::default()
        };
        
        let engine = ConsensusEngine::new(config, msg_tx, event_tx);
        let state = engine.get_state().await;
        
        assert_eq!(state.node_id, 0);
        assert_eq!(state.view, 0);
        assert_eq!(state.height, 0);
        assert!(state.is_primary);
    }

    #[tokio::test]
    async fn test_add_transaction() {
        let (msg_tx, _msg_rx) = mpsc::channel(100);
        let (event_tx, _event_rx) = mpsc::channel(100);
        
        let engine = ConsensusEngine::new(
            ConsensusConfig::default(),
            msg_tx,
            event_tx,
        );

        let tx = Transaction::Lock(crate::message::LockTx {
            lock_id: [1u8; 32],
            sender: [0u8; 20],
            recipient: [1u8; 20],
            amount: 1000,
            pubkey_hash: [2u8; 32],
            l1_block: 100,
        });

        engine.add_transaction(tx).await;

        let pending = engine.pending_txs.read().await;
        assert_eq!(pending.len(), 1);
    }
}
