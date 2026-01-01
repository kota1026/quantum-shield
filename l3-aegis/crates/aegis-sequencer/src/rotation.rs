//! # Sequencer Rotation (SEQ-005)
//!
//! Round-robin sequencer rotation with View Change support.
//!
//! ## Features
//!
//! - Round-robin leader selection
//! - View change on timeout (10 seconds)
//! - Integration with PBFT consensus
//! - Epoch-based rotation
//!
//! ## Reference
//!
//! - L3_CHAIN_SPECIFICATION.md §3 Consensus Protocol
//! - L3_CHAIN_SPECIFICATION.md §3.4 View Change

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{debug, info, warn};

use crate::error::{SequencerError, SequencerResult};

/// View change timeout (from L3_CHAIN_SPECIFICATION.md §3.4)
pub const VIEW_CHANGE_TIMEOUT_SECS: u64 = 10;

/// Block interval (from L3_CHAIN_SPECIFICATION.md §3.5)
pub const BLOCK_INTERVAL_SECS: u64 = 5;

/// Rotation configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotationConfig {
    /// View change timeout in seconds
    pub view_change_timeout_secs: u64,
    /// Block interval in seconds
    pub block_interval_secs: u64,
    /// Epoch duration in blocks
    pub epoch_duration_blocks: u64,
    /// Enable automatic rotation
    pub auto_rotate: bool,
}

impl Default for RotationConfig {
    fn default() -> Self {
        Self {
            view_change_timeout_secs: VIEW_CHANGE_TIMEOUT_SECS,
            block_interval_secs: BLOCK_INTERVAL_SECS,
            epoch_duration_blocks: 100, // 100 blocks per epoch
            auto_rotate: true,
        }
    }
}

/// Node information for rotation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeInfo {
    /// Node ID (Dilithium public key hash)
    pub id: [u8; 32],
    /// Node index in rotation
    pub index: usize,
    /// Is node active
    pub active: bool,
    /// Last block produced
    pub last_block: u64,
    /// Total blocks produced
    pub total_blocks: u64,
}

/// Rotation state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotationState {
    /// Current view number
    pub view: u64,
    /// Current epoch
    pub epoch: u64,
    /// Current leader index
    pub leader_index: usize,
    /// Current leader ID
    pub leader_id: [u8; 32],
    /// View change in progress
    pub view_change_in_progress: bool,
    /// Last view change time
    pub last_view_change: u64,
}

/// View change message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewChangeMessage {
    /// New view number
    pub new_view: u64,
    /// Sender node ID
    pub sender: [u8; 32],
    /// Signature (Dilithium)
    pub signature: Vec<u8>,
    /// Timestamp
    pub timestamp: u64,
}

/// Rotation manager for sequencer selection
pub struct RotationManager {
    /// Configuration
    config: RotationConfig,
    /// List of sequencer nodes (ordered)
    nodes: RwLock<Vec<NodeInfo>>,
    /// Current state
    state: RwLock<RotationState>,
    /// View change messages received
    view_change_messages: RwLock<Vec<ViewChangeMessage>>,
    /// Last activity time
    last_activity: RwLock<Instant>,
    /// Local node ID
    local_node_id: [u8; 32],
}

impl RotationManager {
    /// Create new rotation manager
    pub fn new(config: RotationConfig, local_node_id: [u8; 32]) -> Self {
        Self {
            config,
            nodes: RwLock::new(Vec::new()),
            state: RwLock::new(RotationState {
                view: 0,
                epoch: 0,
                leader_index: 0,
                leader_id: [0u8; 32],
                view_change_in_progress: false,
                last_view_change: 0,
            }),
            view_change_messages: RwLock::new(Vec::new()),
            last_activity: RwLock::new(Instant::now()),
            local_node_id,
        }
    }

    /// Initialize with node list
    pub async fn initialize(&self, nodes: Vec<NodeInfo>) -> SequencerResult<()> {
        if nodes.is_empty() {
            return Err(SequencerError::InternalError(
                "Cannot initialize with empty node list".to_string()
            ));
        }

        let initial_leader_id = nodes[0].id;
        
        {
            let mut state = self.state.write().await;
            state.leader_index = 0;
            state.leader_id = initial_leader_id;
        }

        {
            let mut nodes_lock = self.nodes.write().await;
            *nodes_lock = nodes;
        }

        info!("Rotation manager initialized with {} nodes", 
              self.nodes.read().await.len());

        Ok(())
    }

    /// Add node to rotation
    pub async fn add_node(&self, node: NodeInfo) -> SequencerResult<()> {
        let mut nodes = self.nodes.write().await;
        
        // Check for duplicates
        if nodes.iter().any(|n| n.id == node.id) {
            return Err(SequencerError::InternalError(
                "Node already exists".to_string()
            ));
        }

        nodes.push(node);
        info!("Node added to rotation, total nodes: {}", nodes.len());
        Ok(())
    }

    /// Remove node from rotation
    pub async fn remove_node(&self, node_id: [u8; 32]) -> SequencerResult<()> {
        let mut nodes = self.nodes.write().await;
        let initial_len = nodes.len();
        nodes.retain(|n| n.id != node_id);
        
        if nodes.len() == initial_len {
            return Err(SequencerError::InternalError(
                "Node not found".to_string()
            ));
        }

        // Reindex nodes
        for (i, node) in nodes.iter_mut().enumerate() {
            node.index = i;
        }

        info!("Node removed from rotation, total nodes: {}", nodes.len());
        Ok(())
    }

    /// Get current state
    pub async fn get_state(&self) -> RotationState {
        self.state.read().await.clone()
    }

    /// Get current leader
    pub async fn get_leader(&self) -> [u8; 32] {
        self.state.read().await.leader_id
    }

    /// Check if local node is current leader
    pub async fn is_leader(&self) -> bool {
        let state = self.state.read().await;
        state.leader_id == self.local_node_id
    }

    /// Get node count
    pub async fn node_count(&self) -> usize {
        self.nodes.read().await.len()
    }

    /// Calculate leader for given view (round-robin)
    pub async fn calculate_leader(&self, view: u64) -> SequencerResult<[u8; 32]> {
        let nodes = self.nodes.read().await;
        
        if nodes.is_empty() {
            return Err(SequencerError::InternalError(
                "No nodes in rotation".to_string()
            ));
        }

        // Filter active nodes only
        let active_nodes: Vec<&NodeInfo> = nodes.iter()
            .filter(|n| n.active)
            .collect();

        if active_nodes.is_empty() {
            return Err(SequencerError::InternalError(
                "No active nodes in rotation".to_string()
            ));
        }

        // Round-robin: view % active_node_count
        let leader_index = (view as usize) % active_nodes.len();
        Ok(active_nodes[leader_index].id)
    }

    /// Rotate to next leader (after successful block)
    pub async fn rotate(&self, block_number: u64) -> SequencerResult<[u8; 32]> {
        let mut state = self.state.write().await;
        let nodes = self.nodes.read().await;

        if nodes.is_empty() {
            return Err(SequencerError::InternalError(
                "No nodes in rotation".to_string()
            ));
        }

        let active_nodes: Vec<&NodeInfo> = nodes.iter()
            .filter(|n| n.active)
            .collect();

        if active_nodes.is_empty() {
            return Err(SequencerError::InternalError(
                "No active nodes".to_string()
            ));
        }

        // Move to next view
        state.view += 1;
        
        // Calculate new leader
        let new_leader_index = (state.view as usize) % active_nodes.len();
        state.leader_index = new_leader_index;
        state.leader_id = active_nodes[new_leader_index].id;

        // Check for epoch change
        if block_number > 0 && block_number % self.config.epoch_duration_blocks == 0 {
            state.epoch += 1;
            info!("Epoch changed to {}", state.epoch);
        }

        // Update activity time
        {
            let mut last = self.last_activity.write().await;
            *last = Instant::now();
        }

        info!(
            "Rotated to leader {} at view {}", 
            hex::encode(&state.leader_id[..8]),
            state.view
        );

        Ok(state.leader_id)
    }

    /// Check if view change is needed (timeout)
    pub async fn should_view_change(&self) -> bool {
        let last = *self.last_activity.read().await;
        let elapsed = last.elapsed();
        let timeout = Duration::from_secs(self.config.view_change_timeout_secs);
        
        elapsed >= timeout
    }

    /// Initiate view change
    pub async fn initiate_view_change(&self) -> SequencerResult<ViewChangeMessage> {
        let mut state = self.state.write().await;
        
        if state.view_change_in_progress {
            return Err(SequencerError::InternalError(
                "View change already in progress".to_string()
            ));
        }

        state.view_change_in_progress = true;
        let new_view = state.view + 1;
        
        let msg = ViewChangeMessage {
            new_view,
            sender: self.local_node_id,
            signature: Vec::new(), // To be signed with Dilithium
            timestamp: chrono::Utc::now().timestamp() as u64,
        };

        warn!(
            "Initiating view change to view {} due to timeout",
            new_view
        );

        Ok(msg)
    }

    /// Process view change message
    pub async fn process_view_change(&self, msg: ViewChangeMessage) -> SequencerResult<bool> {
        let state = self.state.read().await;
        
        // Ignore old view changes
        if msg.new_view <= state.view {
            return Ok(false);
        }

        drop(state);

        // Store message
        {
            let mut messages = self.view_change_messages.write().await;
            
            // Prevent duplicates
            if messages.iter().any(|m| m.sender == msg.sender && m.new_view == msg.new_view) {
                return Ok(false);
            }
            
            messages.push(msg.clone());
        }

        // Check if we have enough messages (2f+1 = 3 for 4 nodes)
        let node_count = self.nodes.read().await.len();
        let quorum = self.calculate_quorum(node_count);
        
        let messages = self.view_change_messages.read().await;
        let count = messages.iter()
            .filter(|m| m.new_view == msg.new_view)
            .count();

        if count >= quorum {
            drop(messages);
            self.complete_view_change(msg.new_view).await?;
            return Ok(true);
        }

        Ok(false)
    }

    /// Complete view change
    async fn complete_view_change(&self, new_view: u64) -> SequencerResult<()> {
        let mut state = self.state.write().await;
        
        state.view = new_view;
        state.view_change_in_progress = false;
        state.last_view_change = chrono::Utc::now().timestamp() as u64;
        
        // Calculate new leader
        let nodes = self.nodes.read().await;
        let active_nodes: Vec<&NodeInfo> = nodes.iter()
            .filter(|n| n.active)
            .collect();

        if !active_nodes.is_empty() {
            let new_leader_index = (new_view as usize) % active_nodes.len();
            state.leader_index = new_leader_index;
            state.leader_id = active_nodes[new_leader_index].id;
        }

        // Clear view change messages
        {
            let mut messages = self.view_change_messages.write().await;
            messages.retain(|m| m.new_view > new_view);
        }

        // Reset activity timer
        {
            let mut last = self.last_activity.write().await;
            *last = Instant::now();
        }

        info!(
            "View change completed: view={}, new_leader=0x{}",
            new_view,
            hex::encode(&state.leader_id[..8])
        );

        Ok(())
    }

    /// Calculate quorum (2f+1 for PBFT)
    fn calculate_quorum(&self, node_count: usize) -> usize {
        // f = (n-1)/3, quorum = 2f+1
        let f = (node_count.saturating_sub(1)) / 3;
        2 * f + 1
    }

    /// Update activity timestamp (call on block production)
    pub async fn update_activity(&self) {
        let mut last = self.last_activity.write().await;
        *last = Instant::now();
    }

    /// Record block produced by node
    pub async fn record_block(&self, node_id: [u8; 32], block_number: u64) {
        let mut nodes = self.nodes.write().await;
        
        if let Some(node) = nodes.iter_mut().find(|n| n.id == node_id) {
            node.last_block = block_number;
            node.total_blocks += 1;
        }
    }

    /// Get node statistics
    pub async fn get_node_stats(&self) -> Vec<NodeInfo> {
        self.nodes.read().await.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_nodes(count: usize) -> Vec<NodeInfo> {
        (0..count).map(|i| {
            let mut id = [0u8; 32];
            id[0] = i as u8;
            NodeInfo {
                id,
                index: i,
                active: true,
                last_block: 0,
                total_blocks: 0,
            }
        }).collect()
    }

    #[tokio::test]
    async fn test_rotation_manager_creation() {
        let config = RotationConfig::default();
        let manager = RotationManager::new(config, [0u8; 32]);
        
        assert_eq!(manager.node_count().await, 0);
    }

    #[tokio::test]
    async fn test_initialize_rotation() {
        let config = RotationConfig::default();
        let manager = RotationManager::new(config, [0u8; 32]);
        
        let nodes = create_test_nodes(4);
        manager.initialize(nodes).await.unwrap();
        
        assert_eq!(manager.node_count().await, 4);
        
        let state = manager.get_state().await;
        assert_eq!(state.view, 0);
        assert_eq!(state.leader_index, 0);
    }

    #[tokio::test]
    async fn test_round_robin_rotation() {
        let config = RotationConfig::default();
        let manager = RotationManager::new(config, [0u8; 32]);
        
        let nodes = create_test_nodes(4);
        manager.initialize(nodes.clone()).await.unwrap();
        
        // Initial leader should be node 0
        let leader = manager.get_leader().await;
        assert_eq!(leader, nodes[0].id);
        
        // Rotate to next
        let new_leader = manager.rotate(1).await.unwrap();
        assert_eq!(new_leader, nodes[1].id);
        
        // Continue rotation
        let new_leader = manager.rotate(2).await.unwrap();
        assert_eq!(new_leader, nodes[2].id);
        
        let new_leader = manager.rotate(3).await.unwrap();
        assert_eq!(new_leader, nodes[3].id);
        
        // Wrap around
        let new_leader = manager.rotate(4).await.unwrap();
        assert_eq!(new_leader, nodes[0].id);
    }

    #[tokio::test]
    async fn test_is_leader() {
        let local_id = [0u8; 32];
        let config = RotationConfig::default();
        let manager = RotationManager::new(config, local_id);
        
        let nodes = create_test_nodes(4);
        manager.initialize(nodes).await.unwrap();
        
        // Node 0 is local and initial leader
        assert!(manager.is_leader().await);
        
        // After rotation, should not be leader
        manager.rotate(1).await.unwrap();
        assert!(!manager.is_leader().await);
    }

    #[tokio::test]
    async fn test_calculate_quorum() {
        let config = RotationConfig::default();
        let manager = RotationManager::new(config, [0u8; 32]);
        
        // 4 nodes: f=1, quorum=3
        assert_eq!(manager.calculate_quorum(4), 3);
        
        // 7 nodes: f=2, quorum=5
        assert_eq!(manager.calculate_quorum(7), 5);
        
        // 1 node: f=0, quorum=1
        assert_eq!(manager.calculate_quorum(1), 1);
    }

    #[tokio::test]
    async fn test_view_change_initiation() {
        let config = RotationConfig {
            view_change_timeout_secs: 0, // Immediate timeout for testing
            ..Default::default()
        };
        let local_id = [0u8; 32];
        let manager = RotationManager::new(config, local_id);
        
        let nodes = create_test_nodes(4);
        manager.initialize(nodes).await.unwrap();
        
        // Wait for timeout
        tokio::time::sleep(Duration::from_millis(100)).await;
        
        assert!(manager.should_view_change().await);
        
        let msg = manager.initiate_view_change().await.unwrap();
        assert_eq!(msg.new_view, 1);
        assert_eq!(msg.sender, local_id);
    }

    #[tokio::test]
    async fn test_view_change_completion() {
        let config = RotationConfig::default();
        let local_id = [0u8; 32];
        let manager = RotationManager::new(config, local_id);
        
        let nodes = create_test_nodes(4);
        manager.initialize(nodes).await.unwrap();
        
        // Simulate view change messages from 3 nodes (quorum)
        for i in 0..3 {
            let mut sender = [0u8; 32];
            sender[0] = i as u8;
            
            let msg = ViewChangeMessage {
                new_view: 1,
                sender,
                signature: vec![],
                timestamp: chrono::Utc::now().timestamp() as u64,
            };
            
            manager.process_view_change(msg).await.unwrap();
        }
        
        let state = manager.get_state().await;
        assert_eq!(state.view, 1);
        assert!(!state.view_change_in_progress);
    }

    #[tokio::test]
    async fn test_add_remove_node() {
        let config = RotationConfig::default();
        let manager = RotationManager::new(config, [0u8; 32]);
        
        let nodes = create_test_nodes(4);
        manager.initialize(nodes).await.unwrap();
        
        assert_eq!(manager.node_count().await, 4);
        
        // Add new node
        let new_node = NodeInfo {
            id: [100u8; 32],
            index: 4,
            active: true,
            last_block: 0,
            total_blocks: 0,
        };
        manager.add_node(new_node).await.unwrap();
        assert_eq!(manager.node_count().await, 5);
        
        // Remove node
        manager.remove_node([100u8; 32]).await.unwrap();
        assert_eq!(manager.node_count().await, 4);
    }

    #[tokio::test]
    async fn test_record_block() {
        let config = RotationConfig::default();
        let manager = RotationManager::new(config, [0u8; 32]);
        
        let nodes = create_test_nodes(4);
        manager.initialize(nodes.clone()).await.unwrap();
        
        // Record blocks
        manager.record_block(nodes[0].id, 1).await;
        manager.record_block(nodes[0].id, 2).await;
        
        let stats = manager.get_node_stats().await;
        let node = stats.iter().find(|n| n.id == nodes[0].id).unwrap();
        assert_eq!(node.last_block, 2);
        assert_eq!(node.total_blocks, 2);
    }
}
