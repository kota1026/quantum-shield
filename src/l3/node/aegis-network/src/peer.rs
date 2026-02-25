//! Peer management for L3 network

use aegis_types::NodeId;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Peer state
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PeerState {
    /// Peer is disconnected
    Disconnected,
    /// Connection in progress
    Connecting,
    /// Peer is connected
    Connected,
}

/// Peer information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PeerInfo {
    /// Node ID
    pub node_id: NodeId,
    /// Network address
    pub addr: SocketAddr,
    /// Dilithium public key for authentication
    pub public_key: Vec<u8>,
}

/// Peer connection
pub struct Peer {
    /// Peer info
    pub info: PeerInfo,
    /// Connection state
    pub state: PeerState,
    /// Last seen timestamp
    pub last_seen: u64,
}

impl Peer {
    /// Create a new peer
    pub fn new(info: PeerInfo) -> Self {
        Self {
            info,
            state: PeerState::Disconnected,
            last_seen: 0,
        }
    }

    /// Check if peer is connected
    pub fn is_connected(&self) -> bool {
        self.state == PeerState::Connected
    }
}

/// Peer manager for static 4-node network
pub struct PeerManager {
    /// Known peers
    peers: Arc<RwLock<HashMap<NodeId, Peer>>>,
    /// Our node ID
    local_node_id: NodeId,
}

impl PeerManager {
    /// Create a new peer manager
    pub fn new(local_node_id: NodeId) -> Self {
        Self {
            peers: Arc::new(RwLock::new(HashMap::new())),
            local_node_id,
        }
    }

    /// Add a peer
    pub async fn add_peer(&self, info: PeerInfo) {
        let mut peers = self.peers.write().await;
        peers.insert(info.node_id, Peer::new(info));
    }

    /// Get a peer by node ID
    pub async fn get_peer(&self, node_id: &NodeId) -> Option<PeerInfo> {
        let peers = self.peers.read().await;
        peers.get(node_id).map(|p| p.info.clone())
    }

    /// Get all connected peers
    pub async fn connected_peers(&self) -> Vec<PeerInfo> {
        let peers = self.peers.read().await;
        peers
            .values()
            .filter(|p| p.is_connected())
            .map(|p| p.info.clone())
            .collect()
    }

    /// Get all peer infos
    pub async fn all_peers(&self) -> Vec<PeerInfo> {
        let peers = self.peers.read().await;
        peers.values().map(|p| p.info.clone()).collect()
    }

    /// Update peer state
    pub async fn set_peer_state(&self, node_id: &NodeId, state: PeerState) {
        let mut peers = self.peers.write().await;
        if let Some(peer) = peers.get_mut(node_id) {
            peer.state = state;
        }
    }

    /// Get the number of connected peers
    pub async fn connected_count(&self) -> usize {
        let peers = self.peers.read().await;
        peers.values().filter(|p| p.is_connected()).count()
    }

    /// Check if we have quorum (3/4 nodes for PBFT)
    pub async fn has_quorum(&self) -> bool {
        // For 4-node PBFT, we need 3 nodes (2f+1 where f=1)
        self.connected_count().await >= 3
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mock_node_id() -> NodeId {
        NodeId::from_public_key(b"test")
    }

    fn mock_peer_info(id: u8) -> PeerInfo {
        let node_id = NodeId::from_public_key(&[id; 32]);
        PeerInfo {
            node_id,
            addr: format!("127.0.0.1:800{}", id).parse().unwrap(),
            public_key: vec![id; 32],
        }
    }

    #[tokio::test]
    async fn test_peer_manager_add_and_get() {
        let manager = PeerManager::new(mock_node_id());
        let peer_info = mock_peer_info(1);
        let node_id = peer_info.node_id;

        manager.add_peer(peer_info.clone()).await;

        let retrieved = manager.get_peer(&node_id).await;
        assert!(retrieved.is_some());
    }

    #[tokio::test]
    async fn test_quorum_check() {
        let manager = PeerManager::new(mock_node_id());

        // Add 3 peers
        for i in 1..=3 {
            let info = mock_peer_info(i);
            manager.add_peer(info.clone()).await;
            manager.set_peer_state(&info.node_id, PeerState::Connected).await;
        }

        // Should have quorum with 3 connected
        assert!(manager.has_quorum().await);
    }
}
