//! Consensus Configuration
//!
//! Defines all configurable parameters for the PBFT consensus protocol.
//! Reference: L3_CHAIN_SPECIFICATION.md §3.5

use std::time::Duration;

/// Number of nodes in the network (Phase 1-2: static 4 nodes)
pub const NUM_NODES: usize = 4;

/// Byzantine fault tolerance threshold: f = floor((n-1)/3) = 1
pub const FAULT_TOLERANCE: usize = 1;

/// Quorum size for prepare/commit: 2f + 1 = 3 (75%)
pub const QUORUM_SIZE: usize = 2 * FAULT_TOLERANCE + 1;

/// Production block interval (5 seconds)
pub const BLOCK_INTERVAL_SECS: u64 = 5;

/// Development block interval (1 second for faster testing)
pub const DEV_BLOCK_INTERVAL_SECS: u64 = 1;

/// View change timeout (10 seconds = 2x block interval)
pub const VIEW_CHANGE_TIMEOUT_SECS: u64 = 10;

/// Development view change timeout (3 seconds)
pub const DEV_VIEW_CHANGE_TIMEOUT_SECS: u64 = 3;

/// Pre-prepare phase timeout (2 seconds)
pub const PRE_PREPARE_TIMEOUT_SECS: u64 = 2;

/// Prepare phase timeout (2 seconds)
pub const PREPARE_TIMEOUT_SECS: u64 = 2;

/// Commit phase timeout (2 seconds)
pub const COMMIT_TIMEOUT_SECS: u64 = 2;

/// Maximum transactions per block
pub const MAX_TXS_PER_BLOCK: usize = 100;

/// Consensus configuration
#[derive(Debug, Clone)]
pub struct ConsensusConfig {
    /// This node's ID (0-3)
    pub node_id: u8,
    
    /// Total number of nodes
    pub num_nodes: usize,
    
    /// Block generation interval
    pub block_interval: Duration,
    
    /// View change timeout
    pub view_change_timeout: Duration,
    
    /// Pre-prepare phase timeout
    pub pre_prepare_timeout: Duration,
    
    /// Prepare phase timeout
    pub prepare_timeout: Duration,
    
    /// Commit phase timeout
    pub commit_timeout: Duration,
    
    /// Maximum transactions per block
    pub max_txs_per_block: usize,
    
    /// Development mode flag
    pub dev_mode: bool,
}

impl ConsensusConfig {
    /// Create production configuration
    pub fn production(node_id: u8) -> Self {
        Self {
            node_id,
            num_nodes: NUM_NODES,
            block_interval: Duration::from_secs(BLOCK_INTERVAL_SECS),
            view_change_timeout: Duration::from_secs(VIEW_CHANGE_TIMEOUT_SECS),
            pre_prepare_timeout: Duration::from_secs(PRE_PREPARE_TIMEOUT_SECS),
            prepare_timeout: Duration::from_secs(PREPARE_TIMEOUT_SECS),
            commit_timeout: Duration::from_secs(COMMIT_TIMEOUT_SECS),
            max_txs_per_block: MAX_TXS_PER_BLOCK,
            dev_mode: false,
        }
    }
    
    /// Create development configuration (faster timeouts)
    pub fn development(node_id: u8) -> Self {
        Self {
            node_id,
            num_nodes: NUM_NODES,
            block_interval: Duration::from_secs(DEV_BLOCK_INTERVAL_SECS),
            view_change_timeout: Duration::from_secs(DEV_VIEW_CHANGE_TIMEOUT_SECS),
            pre_prepare_timeout: Duration::from_millis(500),
            prepare_timeout: Duration::from_millis(500),
            commit_timeout: Duration::from_millis(500),
            max_txs_per_block: MAX_TXS_PER_BLOCK,
            dev_mode: true,
        }
    }
    
    /// Create single-node development configuration (no consensus)
    pub fn single_node() -> Self {
        Self {
            node_id: 0,
            num_nodes: 1,
            block_interval: Duration::from_millis(100),
            view_change_timeout: Duration::from_secs(1),
            pre_prepare_timeout: Duration::from_millis(100),
            prepare_timeout: Duration::from_millis(100),
            commit_timeout: Duration::from_millis(100),
            max_txs_per_block: MAX_TXS_PER_BLOCK,
            dev_mode: true,
        }
    }
    
    /// Calculate quorum size based on number of nodes
    /// Quorum = 2f + 1 where f = floor((n-1)/3)
    pub fn quorum(&self) -> usize {
        if self.num_nodes == 1 {
            return 1; // Single node mode
        }
        let f = (self.num_nodes - 1) / 3;
        2 * f + 1
    }
    
    /// Calculate fault tolerance
    pub fn fault_tolerance(&self) -> usize {
        if self.num_nodes == 1 {
            return 0;
        }
        (self.num_nodes - 1) / 3
    }
    
    /// Get the primary node for a given view
    pub fn primary_for_view(&self, view: u64) -> u8 {
        (view % self.num_nodes as u64) as u8
    }
    
    /// Check if this node is the primary for a given view
    pub fn is_primary_for_view(&self, view: u64) -> bool {
        self.primary_for_view(view) == self.node_id
    }
    
    /// Validate node configuration
    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.node_id as usize >= self.num_nodes {
            return Err(ConfigError::InvalidNodeId {
                node_id: self.node_id,
                num_nodes: self.num_nodes,
            });
        }
        
        if self.num_nodes < 1 {
            return Err(ConfigError::InvalidNodeCount(self.num_nodes));
        }
        
        // Multi-node network requires at least 4 nodes for BFT
        if self.num_nodes > 1 && self.num_nodes < 4 {
            return Err(ConfigError::InsufficientNodesForBFT(self.num_nodes));
        }
        
        Ok(())
    }
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self::production(0)
    }
}

/// Configuration errors
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConfigError {
    /// Node ID is out of range
    InvalidNodeId { node_id: u8, num_nodes: usize },
    /// Invalid number of nodes
    InvalidNodeCount(usize),
    /// Insufficient nodes for BFT (need at least 4)
    InsufficientNodesForBFT(usize),
}

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigError::InvalidNodeId { node_id, num_nodes } => {
                write!(f, "Node ID {} is out of range (0-{})", node_id, num_nodes - 1)
            }
            ConfigError::InvalidNodeCount(n) => {
                write!(f, "Invalid node count: {}", n)
            }
            ConfigError::InsufficientNodesForBFT(n) => {
                write!(f, "Insufficient nodes for BFT: {} (need at least 4)", n)
            }
        }
    }
}

impl std::error::Error for ConfigError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_production_config() {
        let config = ConsensusConfig::production(0);
        
        assert_eq!(config.node_id, 0);
        assert_eq!(config.num_nodes, 4);
        assert_eq!(config.block_interval, Duration::from_secs(5));
        assert_eq!(config.view_change_timeout, Duration::from_secs(10));
        assert!(!config.dev_mode);
    }

    #[test]
    fn test_development_config() {
        let config = ConsensusConfig::development(1);
        
        assert_eq!(config.node_id, 1);
        assert_eq!(config.block_interval, Duration::from_secs(1));
        assert_eq!(config.view_change_timeout, Duration::from_secs(3));
        assert!(config.dev_mode);
    }

    #[test]
    fn test_quorum_calculation() {
        // 4 nodes: f=1, quorum=3
        let config = ConsensusConfig::production(0);
        assert_eq!(config.quorum(), 3);
        assert_eq!(config.fault_tolerance(), 1);
        
        // Single node: quorum=1
        let single = ConsensusConfig::single_node();
        assert_eq!(single.quorum(), 1);
        assert_eq!(single.fault_tolerance(), 0);
    }

    #[test]
    fn test_primary_rotation() {
        let config = ConsensusConfig::production(0);
        
        assert_eq!(config.primary_for_view(0), 0);
        assert_eq!(config.primary_for_view(1), 1);
        assert_eq!(config.primary_for_view(2), 2);
        assert_eq!(config.primary_for_view(3), 3);
        assert_eq!(config.primary_for_view(4), 0); // Wrap around
        assert_eq!(config.primary_for_view(7), 3);
    }

    #[test]
    fn test_is_primary() {
        let config = ConsensusConfig::production(2);
        
        assert!(!config.is_primary_for_view(0));
        assert!(!config.is_primary_for_view(1));
        assert!(config.is_primary_for_view(2));  // Node 2 is primary in view 2
        assert!(!config.is_primary_for_view(3));
        assert!(config.is_primary_for_view(6));  // Node 2 is primary in view 6
    }

    #[test]
    fn test_config_validation() {
        // Valid config
        let valid = ConsensusConfig::production(0);
        assert!(valid.validate().is_ok());
        
        // Invalid node ID
        let mut invalid = ConsensusConfig::production(0);
        invalid.node_id = 5; // Out of range
        assert!(matches!(
            invalid.validate(),
            Err(ConfigError::InvalidNodeId { .. })
        ));
        
        // Invalid node count (2 nodes, not enough for BFT)
        let mut invalid2 = ConsensusConfig::production(0);
        invalid2.num_nodes = 2;
        assert!(matches!(
            invalid2.validate(),
            Err(ConfigError::InsufficientNodesForBFT(2))
        ));
    }

    #[test]
    fn test_constants_match_spec() {
        // L3_CHAIN_SPECIFICATION §3.5 requirements
        assert_eq!(NUM_NODES, 4);
        assert_eq!(FAULT_TOLERANCE, 1);
        assert_eq!(QUORUM_SIZE, 3);
        assert_eq!(BLOCK_INTERVAL_SECS, 5);
        assert_eq!(VIEW_CHANGE_TIMEOUT_SECS, 10);
        assert_eq!(PRE_PREPARE_TIMEOUT_SECS, 2);
        assert_eq!(PREPARE_TIMEOUT_SECS, 2);
        assert_eq!(COMMIT_TIMEOUT_SECS, 2);
    }
}
