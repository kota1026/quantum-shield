//! View Change Protocol
//!
//! Implements the view change mechanism for PBFT when the primary fails.

use std::collections::HashMap;
use crate::message::{Hash256, Height, NodeId, View, ViewChangeMessage};
use crate::state::QUORUM_SIZE;

/// View change state
#[derive(Debug)]
pub struct ViewChangeState {
    /// Current view being changed to
    target_view: View,
    /// View change messages received
    messages: HashMap<NodeId, ViewChangeMessage>,
    /// Whether view change is complete
    complete: bool,
}

impl ViewChangeState {
    /// Create new view change state
    pub fn new(target_view: View) -> Self {
        Self {
            target_view,
            messages: HashMap::new(),
            complete: false,
        }
    }

    /// Add a view change message
    pub fn add_message(&mut self, msg: ViewChangeMessage) -> bool {
        if msg.new_view != self.target_view {
            return false;
        }

        self.messages.insert(msg.sender, msg);

        // Check if we have quorum
        if self.messages.len() >= QUORUM_SIZE && !self.complete {
            self.complete = true;
            return true;
        }

        false
    }

    /// Get the highest committed height from all messages
    pub fn get_highest_commit(&self) -> (Height, Hash256) {
        let mut highest_height = 0;
        let mut highest_hash = [0u8; 32];

        for msg in self.messages.values() {
            if msg.last_height > highest_height {
                highest_height = msg.last_height;
                highest_hash = msg.last_hash;
            }
        }

        (highest_height, highest_hash)
    }

    /// Check if view change is complete
    pub fn is_complete(&self) -> bool {
        self.complete
    }

    /// Get the target view
    pub fn target_view(&self) -> View {
        self.target_view
    }

    /// Get message count
    pub fn message_count(&self) -> usize {
        self.messages.len()
    }
}

/// View change manager
#[derive(Debug)]
pub struct ViewChangeManager {
    /// This node's ID
    node_id: NodeId,
    /// Current view
    current_view: View,
    /// Active view change state
    active_change: Option<ViewChangeState>,
    /// View change timeout (in seconds)
    timeout_secs: u64,
    /// Last activity timestamp
    last_activity: u64,
}

impl ViewChangeManager {
    /// Create new view change manager
    pub fn new(node_id: NodeId, timeout_secs: u64) -> Self {
        Self {
            node_id,
            current_view: 0,
            active_change: None,
            timeout_secs,
            last_activity: 0,
        }
    }

    /// Update current view
    pub fn set_view(&mut self, view: View) {
        self.current_view = view;
        self.active_change = None;
    }

    /// Record activity (resets timeout)
    pub fn record_activity(&mut self, timestamp: u64) {
        self.last_activity = timestamp;
    }

    /// Check if timeout has elapsed
    pub fn is_timeout(&self, current_time: u64) -> bool {
        if self.last_activity == 0 {
            return false;
        }
        current_time - self.last_activity > self.timeout_secs
    }

    /// Start a view change
    pub fn start_view_change(&mut self, last_height: Height, last_hash: Hash256) -> ViewChangeMessage {
        let new_view = self.current_view + 1;
        self.active_change = Some(ViewChangeState::new(new_view));

        ViewChangeMessage::new(new_view, last_height, last_hash, self.node_id)
    }

    /// Process a view change message
    pub fn process_message(&mut self, msg: ViewChangeMessage) -> Option<View> {
        // Initialize state if needed
        if self.active_change.is_none() || 
           self.active_change.as_ref().unwrap().target_view() < msg.new_view 
        {
            self.active_change = Some(ViewChangeState::new(msg.new_view));
        }

        let state = self.active_change.as_mut().unwrap();
        
        if state.add_message(msg) {
            // View change complete
            let new_view = state.target_view();
            self.current_view = new_view;
            self.active_change = None;
            return Some(new_view);
        }

        None
    }

    /// Get the new primary for a view
    pub fn get_primary_for_view(view: View, num_nodes: usize) -> NodeId {
        (view % num_nodes as u64) as NodeId
    }

    /// Check if this node is the primary for a view
    pub fn is_primary_for_view(&self, view: View, num_nodes: usize) -> bool {
        Self::get_primary_for_view(view, num_nodes) == self.node_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_view_change_state() {
        let mut state = ViewChangeState::new(1);
        
        for i in 0..3 {
            let msg = ViewChangeMessage::new(1, 100, [0u8; 32], i);
            let complete = state.add_message(msg);
            
            if i < 2 {
                assert!(!complete);
            } else {
                assert!(complete);
            }
        }
        
        assert!(state.is_complete());
    }

    #[test]
    fn test_view_change_manager() {
        let mut manager = ViewChangeManager::new(0, 5);
        
        manager.record_activity(100);
        assert!(!manager.is_timeout(104));
        assert!(manager.is_timeout(106));
    }

    #[test]
    fn test_primary_rotation() {
        assert_eq!(ViewChangeManager::get_primary_for_view(0, 4), 0);
        assert_eq!(ViewChangeManager::get_primary_for_view(1, 4), 1);
        assert_eq!(ViewChangeManager::get_primary_for_view(4, 4), 0);
        assert_eq!(ViewChangeManager::get_primary_for_view(7, 4), 3);
    }
}
