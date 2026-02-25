//! Consensus State Management
//!
//! Tracks the current state of the PBFT consensus protocol.

use std::collections::HashMap;
use crate::message::{Block, ConsensusMessage, Hash256, Height, NodeId, View};

/// Number of nodes in the network
pub const NUM_NODES: usize = 4;

/// Byzantine fault tolerance threshold
/// f = floor((n-1)/3) = floor((4-1)/3) = 1
pub const FAULT_TOLERANCE: usize = 1;

/// Quorum size for prepare/commit (2f + 1 = 3)
pub const QUORUM_SIZE: usize = 2 * FAULT_TOLERANCE + 1;

/// Consensus phase
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Phase {
    /// Waiting for PrePrepare from primary
    Idle,
    /// Received PrePrepare, collecting Prepare messages
    PrePrepared,
    /// Collected enough Prepare messages, collecting Commit messages
    Prepared,
    /// Collected enough Commit messages, ready to execute
    Committed,
}

/// Consensus state for a single height
#[derive(Debug, Clone)]
pub struct HeightState {
    /// Current phase
    pub phase: Phase,
    /// Block proposed for this height
    pub block: Option<Block>,
    /// Block digest
    pub digest: Hash256,
    /// Prepare messages received (node_id -> message)
    pub prepares: HashMap<NodeId, ConsensusMessage>,
    /// Commit messages received (node_id -> message)
    pub commits: HashMap<NodeId, ConsensusMessage>,
}

impl HeightState {
    /// Create new height state
    pub fn new() -> Self {
        Self {
            phase: Phase::Idle,
            block: None,
            digest: [0u8; 32],
            prepares: HashMap::new(),
            commits: HashMap::new(),
        }
    }

    /// Check if we have enough prepare messages
    pub fn has_prepare_quorum(&self) -> bool {
        self.prepares.len() >= QUORUM_SIZE
    }

    /// Check if we have enough commit messages
    pub fn has_commit_quorum(&self) -> bool {
        self.commits.len() >= QUORUM_SIZE
    }

    /// Add a prepare message
    pub fn add_prepare(&mut self, msg: ConsensusMessage) {
        if msg.digest == self.digest {
            self.prepares.insert(msg.sender, msg);
        }
    }

    /// Add a commit message
    pub fn add_commit(&mut self, msg: ConsensusMessage) {
        if msg.digest == self.digest {
            self.commits.insert(msg.sender, msg);
        }
    }
}

impl Default for HeightState {
    fn default() -> Self {
        Self::new()
    }
}

/// Full consensus state
#[derive(Debug)]
pub struct ConsensusState {
    /// This node's ID
    pub node_id: NodeId,
    /// Current view number
    pub view: View,
    /// Latest committed block height
    pub committed_height: Height,
    /// Latest committed block hash
    pub committed_hash: Hash256,
    /// State for current height being processed
    pub current_height_state: HeightState,
    /// View change timeout (in seconds)
    pub view_change_timeout: u64,
    /// Whether view change is in progress
    pub view_change_in_progress: bool,
}

impl ConsensusState {
    /// Create new consensus state
    pub fn new(node_id: NodeId) -> Self {
        Self {
            node_id,
            view: 0,
            committed_height: 0,
            committed_hash: [0u8; 32],
            current_height_state: HeightState::new(),
            view_change_timeout: 5, // 5 seconds
            view_change_in_progress: false,
        }
    }

    /// Get the current primary node for this view
    pub fn primary(&self) -> NodeId {
        (self.view % NUM_NODES as u64) as NodeId
    }

    /// Check if this node is the primary
    pub fn is_primary(&self) -> bool {
        self.node_id == self.primary()
    }

    /// Get the current height being processed
    pub fn current_height(&self) -> Height {
        self.committed_height + 1
    }

    /// Move to next height after commit
    pub fn advance_height(&mut self, block: &Block) {
        self.committed_height = block.height;
        self.committed_hash = block.compute_hash();
        self.current_height_state = HeightState::new();
    }

    /// Initiate view change
    pub fn start_view_change(&mut self, new_view: View) {
        self.view = new_view;
        self.view_change_in_progress = true;
        self.current_height_state = HeightState::new();
    }

    /// Complete view change
    pub fn complete_view_change(&mut self) {
        self.view_change_in_progress = false;
    }

    /// Process PrePrepare message
    pub fn on_pre_prepare(&mut self, msg: ConsensusMessage) -> Result<(), StateError> {
        // Validate message
        if msg.view != self.view {
            return Err(StateError::ViewMismatch);
        }
        if msg.height != self.current_height() {
            return Err(StateError::HeightMismatch);
        }
        if msg.sender != self.primary() {
            return Err(StateError::NotFromPrimary);
        }
        if self.current_height_state.phase != Phase::Idle {
            return Err(StateError::InvalidPhase);
        }

        // Accept the pre-prepare
        self.current_height_state.phase = Phase::PrePrepared;
        self.current_height_state.block = msg.block;
        self.current_height_state.digest = msg.digest;

        Ok(())
    }

    /// Process Prepare message
    pub fn on_prepare(&mut self, msg: ConsensusMessage) -> Result<bool, StateError> {
        // Validate message
        if msg.view != self.view {
            return Err(StateError::ViewMismatch);
        }
        if msg.height != self.current_height() {
            return Err(StateError::HeightMismatch);
        }
        if msg.digest != self.current_height_state.digest {
            return Err(StateError::DigestMismatch);
        }

        // Add prepare message
        self.current_height_state.add_prepare(msg);

        // Check if we have quorum
        if self.current_height_state.has_prepare_quorum() 
            && self.current_height_state.phase == Phase::PrePrepared 
        {
            self.current_height_state.phase = Phase::Prepared;
            return Ok(true); // Ready to send Commit
        }

        Ok(false)
    }

    /// Process Commit message
    pub fn on_commit(&mut self, msg: ConsensusMessage) -> Result<bool, StateError> {
        // Validate message
        if msg.view != self.view {
            return Err(StateError::ViewMismatch);
        }
        if msg.height != self.current_height() {
            return Err(StateError::HeightMismatch);
        }
        if msg.digest != self.current_height_state.digest {
            return Err(StateError::DigestMismatch);
        }

        // Add commit message
        self.current_height_state.add_commit(msg);

        // Check if we have quorum
        if self.current_height_state.has_commit_quorum()
            && self.current_height_state.phase == Phase::Prepared
        {
            self.current_height_state.phase = Phase::Committed;
            return Ok(true); // Ready to execute
        }

        Ok(false)
    }
}

/// State errors
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StateError {
    /// View number doesn't match
    ViewMismatch,
    /// Height doesn't match
    HeightMismatch,
    /// Block digest doesn't match
    DigestMismatch,
    /// Message not from expected primary
    NotFromPrimary,
    /// Invalid phase for this operation
    InvalidPhase,
}

impl std::fmt::Display for StateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StateError::ViewMismatch => write!(f, "View mismatch"),
            StateError::HeightMismatch => write!(f, "Height mismatch"),
            StateError::DigestMismatch => write!(f, "Digest mismatch"),
            StateError::NotFromPrimary => write!(f, "Not from primary"),
            StateError::InvalidPhase => write!(f, "Invalid phase"),
        }
    }
}

impl std::error::Error for StateError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_primary_rotation() {
        let mut state = ConsensusState::new(0);
        
        assert_eq!(state.primary(), 0);
        
        state.view = 1;
        assert_eq!(state.primary(), 1);
        
        state.view = 4;
        assert_eq!(state.primary(), 0);
    }

    #[test]
    fn test_quorum() {
        let mut height_state = HeightState::new();
        height_state.digest = [1u8; 32];
        
        assert!(!height_state.has_prepare_quorum());
        
        for i in 0..3 {
            let msg = ConsensusMessage::prepare(0, 1, [1u8; 32], i);
            height_state.add_prepare(msg);
        }
        
        assert!(height_state.has_prepare_quorum());
    }
}
