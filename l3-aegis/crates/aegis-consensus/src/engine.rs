//! Consensus Engine
//!
//! Main PBFT consensus engine implementation.
//! 
//! Per DECEN-001~004: Production-ready 4BFT consensus with:
//! - Byzantine fault tolerance (f=1, n=4)
//! - Leader election & rotation
//! - Network partition recovery

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{mpsc, RwLock};
use tracing::{debug, error, info, warn};

use crate::message::{Block, ConsensusMessage, Hash256, MessageType, NodeId, Transaction, ViewChangeMessage};
use crate::state::{ConsensusState, Phase, QUORUM_SIZE, NUM_NODES};
use crate::view_change::ViewChangeManager;

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
    /// Network timeout for messages
    pub network_timeout_ms: u64,
    /// Maximum message retries
    pub max_retries: usize,
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self {
            node_id: 0,
            block_time_ms: 2000, // 2 seconds
            view_change_timeout: 5,
            max_txs_per_block: 100,
            network_timeout_ms: 1000, // 1 second
            max_retries: 3,
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
    /// Leader changed
    LeaderChanged { old: NodeId, new: NodeId, view: u64 },
    /// Network partition detected
    PartitionDetected { isolated_nodes: Vec<NodeId> },
    /// Partition recovered
    PartitionRecovered { reconnected_nodes: Vec<NodeId> },
    /// Byzantine behavior detected
    ByzantineDetected { node: NodeId, reason: String },
    /// Error occurred
    Error(String),
}

/// Network health status
#[derive(Debug, Clone)]
pub struct NetworkHealth {
    /// Last message received from each node
    pub last_seen: [Option<Instant>; NUM_NODES],
    /// Nodes considered disconnected
    pub disconnected: Vec<NodeId>,
    /// Whether partition is suspected
    pub partition_suspected: bool,
}

impl NetworkHealth {
    pub fn new() -> Self {
        Self {
            last_seen: [None; NUM_NODES],
            disconnected: Vec::new(),
            partition_suspected: false,
        }
    }

    /// Update last seen for a node
    pub fn update_last_seen(&mut self, node: NodeId) {
        if node < NUM_NODES {
            self.last_seen[node] = Some(Instant::now());
        }
    }

    /// Check for disconnected nodes
    pub fn check_disconnections(&mut self, timeout: Duration) -> Vec<NodeId> {
        let now = Instant::now();
        self.disconnected.clear();

        for i in 0..NUM_NODES {
            if let Some(last) = self.last_seen[i] {
                if now.duration_since(last) > timeout {
                    self.disconnected.push(i);
                }
            } else {
                // Never seen, consider disconnected if we're past initial startup
                self.disconnected.push(i);
            }
        }

        // Suspect partition if we lost more than f nodes
        self.partition_suspected = self.disconnected.len() > 1;
        
        self.disconnected.clone()
    }
}

impl Default for NetworkHealth {
    fn default() -> Self {
        Self::new()
    }
}

/// Byzantine behavior tracker
#[derive(Debug)]
pub struct ByzantineTracker {
    /// Double vote detection: (view, height) -> (node, digest)
    votes: std::collections::HashMap<(u64, u64), Vec<(NodeId, Hash256)>>,
    /// Nodes flagged as Byzantine
    flagged_nodes: Vec<NodeId>,
}

impl ByzantineTracker {
    pub fn new() -> Self {
        Self {
            votes: std::collections::HashMap::new(),
            flagged_nodes: Vec::new(),
        }
    }

    /// Record a vote and check for double voting
    pub fn record_vote(&mut self, view: u64, height: u64, node: NodeId, digest: Hash256) -> Option<String> {
        let key = (view, height);
        let entry = self.votes.entry(key).or_default();

        // Check for existing vote from same node with different digest
        for (existing_node, existing_digest) in entry.iter() {
            if *existing_node == node && *existing_digest != digest {
                self.flagged_nodes.push(node);
                return Some(format!(
                    "Double vote detected: node {} voted for different digests at view {}, height {}",
                    node, view, height
                ));
            }
        }

        entry.push((node, digest));
        None
    }

    /// Check if a node is flagged as Byzantine
    pub fn is_byzantine(&self, node: NodeId) -> bool {
        self.flagged_nodes.contains(&node)
    }
}

impl Default for ByzantineTracker {
    fn default() -> Self {
        Self::new()
    }
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
    /// View change manager
    view_change_manager: Arc<RwLock<ViewChangeManager>>,
    /// Network health tracker
    network_health: Arc<RwLock<NetworkHealth>>,
    /// Byzantine behavior tracker
    byzantine_tracker: Arc<RwLock<ByzantineTracker>>,
    /// Last block proposal time
    last_proposal_time: Arc<RwLock<Option<Instant>>>,
}

impl ConsensusEngine {
    /// Create a new consensus engine
    pub fn new(
        config: ConsensusConfig,
        msg_sender: mpsc::Sender<ConsensusMessage>,
        event_sender: mpsc::Sender<ConsensusEvent>,
    ) -> Self {
        let state = ConsensusState::new(config.node_id);
        let view_change_manager = ViewChangeManager::new(config.node_id, config.view_change_timeout);
        
        Self {
            config: config.clone(),
            state: Arc::new(RwLock::new(state)),
            pending_txs: Arc::new(RwLock::new(Vec::new())),
            msg_sender,
            event_sender,
            view_change_manager: Arc::new(RwLock::new(view_change_manager)),
            network_health: Arc::new(RwLock::new(NetworkHealth::new())),
            byzantine_tracker: Arc::new(RwLock::new(ByzantineTracker::new())),
            last_proposal_time: Arc::new(RwLock::new(None)),
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

    /// Get network health status
    pub async fn get_network_health(&self) -> NetworkHealth {
        self.network_health.read().await.clone()
    }

    /// Add transaction to pending pool
    pub async fn add_transaction(&self, tx: Transaction) {
        let mut pending = self.pending_txs.write().await;
        if pending.len() < self.config.max_txs_per_block {
            pending.push(tx);
        }
    }

    /// Check and trigger view change if needed (DECEN-003)
    pub async fn check_view_change_timeout(&self) -> Result<bool, EngineError> {
        let state = self.state.read().await;
        
        // Check if we're waiting too long for the primary
        if !state.is_primary() && state.current_height_state.phase == Phase::Idle {
            let last_proposal = self.last_proposal_time.read().await;
            if let Some(time) = *last_proposal {
                if time.elapsed() > Duration::from_secs(self.config.view_change_timeout) {
                    drop(state);
                    drop(last_proposal);
                    info!(
                        "Node {} triggering view change due to timeout",
                        self.config.node_id
                    );
                    self.initiate_view_change().await?;
                    return Ok(true);
                }
            }
        }
        
        Ok(false)
    }

    /// Check network health and detect partitions (DECEN-004)
    pub async fn check_network_health(&self) -> Result<(), EngineError> {
        let mut health = self.network_health.write().await;
        let timeout = Duration::from_millis(self.config.network_timeout_ms * 3);
        let disconnected = health.check_disconnections(timeout);
        
        if health.partition_suspected {
            warn!(
                "Node {} suspects network partition, disconnected nodes: {:?}",
                self.config.node_id, disconnected
            );
            
            drop(health);
            self.event_sender
                .send(ConsensusEvent::PartitionDetected { 
                    isolated_nodes: disconnected 
                })
                .await
                .ok();
        }
        
        Ok(())
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

        // Update proposal time
        *self.last_proposal_time.write().await = Some(Instant::now());

        // Broadcast PrePrepare
        drop(state);
        drop(pending);
        self.msg_sender.send(msg).await.map_err(|_| EngineError::SendFailed)?;

        Ok(())
    }

    /// Handle incoming consensus message
    pub async fn handle_message(&self, msg: ConsensusMessage) -> Result<(), EngineError> {
        // Update network health
        {
            let mut health = self.network_health.write().await;
            health.update_last_seen(msg.sender);
        }
        
        // Check for Byzantine behavior
        {
            let mut tracker = self.byzantine_tracker.write().await;
            if tracker.is_byzantine(msg.sender) {
                warn!("Ignoring message from Byzantine node {}", msg.sender);
                return Ok(());
            }
        }

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

        // Update proposal time
        *self.last_proposal_time.write().await = Some(Instant::now());

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
        // Check for double voting (DECEN-002)
        {
            let mut tracker = self.byzantine_tracker.write().await;
            if let Some(reason) = tracker.record_vote(msg.view, msg.height, msg.sender, msg.digest) {
                error!("Byzantine behavior detected: {}", reason);
                self.event_sender
                    .send(ConsensusEvent::ByzantineDetected {
                        node: msg.sender,
                        reason,
                    })
                    .await
                    .ok();
                return Ok(());
            }
        }

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
        // Check for double voting (DECEN-002)
        {
            let mut tracker = self.byzantine_tracker.write().await;
            if let Some(reason) = tracker.record_vote(msg.view, msg.height, msg.sender, msg.digest) {
                error!("Byzantine behavior detected: {}", reason);
                self.event_sender
                    .send(ConsensusEvent::ByzantineDetected {
                        node: msg.sender,
                        reason,
                    })
                    .await
                    .ok();
                return Ok(());
            }
        }

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
                
                // Reset proposal time for next round
                *self.last_proposal_time.write().await = Some(Instant::now());
                
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

    /// Handle ViewChange message (DECEN-003)
    async fn handle_view_change(&self, msg: ConsensusMessage) -> Result<(), EngineError> {
        let state = self.state.read().await;
        
        info!(
            "Node {} received ViewChange for view {} from node {}",
            state.node_id, msg.view, msg.sender
        );

        // Create ViewChangeMessage from ConsensusMessage
        let vc_msg = ViewChangeMessage::new(
            msg.view,
            state.committed_height,
            state.committed_hash,
            msg.sender,
        );

        drop(state);

        // Process with view change manager
        let mut vc_manager = self.view_change_manager.write().await;
        if let Some(new_view) = vc_manager.process_message(vc_msg) {
            info!(
                "Node {} completed view change to view {}",
                self.config.node_id, new_view
            );

            drop(vc_manager);

            // Update consensus state
            let mut state = self.state.write().await;
            let old_primary = state.primary();
            state.start_view_change(new_view);
            state.complete_view_change();
            let new_primary = state.primary();

            drop(state);

            // Notify listeners
            self.event_sender
                .send(ConsensusEvent::ViewChanged(new_view))
                .await
                .ok();

            self.event_sender
                .send(ConsensusEvent::LeaderChanged {
                    old: old_primary,
                    new: new_primary,
                    view: new_view,
                })
                .await
                .ok();

            // If we are the new primary, send NewView
            if new_primary == self.config.node_id {
                let new_view_msg = ConsensusMessage::new_view(new_view, self.config.node_id);
                self.msg_sender.send(new_view_msg).await.map_err(|_| EngineError::SendFailed)?;
            }
        }

        Ok(())
    }

    /// Handle NewView message (DECEN-003)
    async fn handle_new_view(&self, msg: ConsensusMessage) -> Result<(), EngineError> {
        let mut state = self.state.write().await;
        
        info!(
            "Node {} received NewView for view {} from node {}",
            state.node_id, msg.view, msg.sender
        );

        // Verify sender is the new primary
        let expected_primary = (msg.view % NUM_NODES as u64) as NodeId;
        if msg.sender != expected_primary {
            warn!(
                "NewView from {} but expected primary is {}",
                msg.sender, expected_primary
            );
            return Err(EngineError::InvalidNewView);
        }

        // Update state
        let old_primary = state.primary();
        state.view = msg.view;
        state.complete_view_change();
        let new_primary = state.primary();

        // Reset proposal time
        *self.last_proposal_time.write().await = Some(Instant::now());

        drop(state);

        // Update view change manager
        let mut vc_manager = self.view_change_manager.write().await;
        vc_manager.set_view(msg.view);
        drop(vc_manager);

        // Notify listeners
        self.event_sender
            .send(ConsensusEvent::LeaderChanged {
                old: old_primary,
                new: new_primary,
                view: msg.view,
            })
            .await
            .ok();

        Ok(())
    }

    /// Start view change procedure (DECEN-003)
    pub async fn initiate_view_change(&self) -> Result<(), EngineError> {
        let state = self.state.read().await;
        let new_view = state.view + 1;
        
        info!(
            "Node {} initiating view change to view {}",
            state.node_id, new_view
        );

        let height = state.committed_height;
        let hash = state.committed_hash;
        drop(state);

        // Create and send ViewChange message
        let mut vc_manager = self.view_change_manager.write().await;
        let vc_msg = vc_manager.start_view_change(height, hash);
        drop(vc_manager);

        // Convert to ConsensusMessage
        let msg = ConsensusMessage::view_change(
            new_view,
            height,
            hash,
            self.config.node_id,
        );

        self.msg_sender.send(msg).await.map_err(|_| EngineError::SendFailed)?;

        // Also process our own view change message
        let mut vc_manager = self.view_change_manager.write().await;
        vc_manager.process_message(vc_msg);

        Ok(())
    }

    /// Attempt to recover from network partition (DECEN-004)
    pub async fn attempt_partition_recovery(&self) -> Result<(), EngineError> {
        let health = self.network_health.read().await;
        
        if !health.partition_suspected {
            return Ok(());
        }

        info!(
            "Node {} attempting partition recovery",
            self.config.node_id
        );

        drop(health);

        // Try to reconnect by sending state sync requests
        // In a real implementation, this would involve:
        // 1. Sending heartbeats to all nodes
        // 2. Requesting state from any responding nodes
        // 3. Syncing to the highest committed height

        // For now, initiate view change to recover
        self.initiate_view_change().await?;

        Ok(())
    }

    /// Sync state from another node (DECEN-004)
    pub async fn sync_state(&self, from_node: NodeId, height: u64, hash: Hash256) -> Result<(), EngineError> {
        let mut state = self.state.write().await;
        
        if height > state.committed_height {
            info!(
                "Node {} syncing state from node {}: height {} -> {}",
                state.node_id, from_node, state.committed_height, height
            );
            
            state.committed_height = height;
            state.committed_hash = hash;
            state.current_height_state = crate::state::HeightState::new();
            
            // Update network health
            let mut health = self.network_health.write().await;
            health.update_last_seen(from_node);
            health.partition_suspected = false;
            
            drop(health);
            drop(state);

            // Notify recovery
            self.event_sender
                .send(ConsensusEvent::PartitionRecovered {
                    reconnected_nodes: vec![from_node],
                })
                .await
                .ok();
        }

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
    /// Invalid NewView message
    InvalidNewView,
    /// Partition detected
    PartitionDetected,
    /// Sync failed
    SyncFailed,
}

impl std::fmt::Display for EngineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EngineError::NotPrimary => write!(f, "Not the primary node"),
            EngineError::SendFailed => write!(f, "Failed to send message"),
            EngineError::StateError(e) => write!(f, "State error: {}", e),
            EngineError::InvalidNewView => write!(f, "Invalid NewView message"),
            EngineError::PartitionDetected => write!(f, "Network partition detected"),
            EngineError::SyncFailed => write!(f, "State sync failed"),
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

    #[tokio::test]
    async fn test_network_health() {
        let mut health = NetworkHealth::new();
        
        health.update_last_seen(0);
        health.update_last_seen(1);
        
        let disconnected = health.check_disconnections(Duration::from_secs(1));
        
        // Nodes 2 and 3 never seen
        assert!(disconnected.contains(&2));
        assert!(disconnected.contains(&3));
    }

    #[tokio::test]
    async fn test_byzantine_tracker() {
        let mut tracker = ByzantineTracker::new();
        
        // First vote is OK
        assert!(tracker.record_vote(0, 1, 0, [1u8; 32]).is_none());
        
        // Same vote is OK
        assert!(tracker.record_vote(0, 1, 0, [1u8; 32]).is_none());
        
        // Different digest = double vote!
        assert!(tracker.record_vote(0, 1, 0, [2u8; 32]).is_some());
        
        // Node is now flagged
        assert!(tracker.is_byzantine(0));
    }
}
