//! Network message types

use aegis_types::{Block, Hash256, NodeId};
use serde::{Deserialize, Serialize};

/// Network message envelope
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NetworkMessage {
    /// Sender node ID
    pub from: NodeId,
    /// Message payload
    pub payload: MessagePayload,
    /// Dilithium signature
    pub signature: Vec<u8>,
    /// Timestamp
    pub timestamp: u64,
}

/// Message payload types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum MessagePayload {
    /// Handshake message
    Handshake(HandshakeMessage),
    /// Block announcement
    BlockAnnounce(BlockAnnounceMessage),
    /// Block request
    BlockRequest(BlockRequestMessage),
    /// Block response
    BlockResponse(BlockResponseMessage),
    /// Consensus message
    Consensus(ConsensusMessage),
    /// Heartbeat/ping
    Ping,
    /// Heartbeat/pong
    Pong,
}

/// Handshake message for initial connection
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct HandshakeMessage {
    /// Protocol version
    pub version: u8,
    /// Node's public key
    pub public_key: Vec<u8>,
    /// Chain ID
    pub chain_id: u64,
    /// Latest block height
    pub latest_height: u64,
}

/// Block announcement
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BlockAnnounceMessage {
    /// Block hash
    pub block_hash: Hash256,
    /// Block height
    pub height: u64,
}

/// Block request
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BlockRequestMessage {
    /// Requested block hash or height
    pub request: BlockRequestType,
}

/// Block request type
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum BlockRequestType {
    ByHash(Hash256),
    ByHeight(u64),
}

/// Block response
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BlockResponseMessage {
    /// The requested block
    pub block: Option<Block>,
}

/// Consensus message types (for PBFT)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ConsensusMessage {
    /// Pre-prepare phase
    PrePrepare {
        view: u64,
        seq: u64,
        block: Block,
    },
    /// Prepare phase
    Prepare {
        view: u64,
        seq: u64,
        block_hash: Hash256,
    },
    /// Commit phase
    Commit {
        view: u64,
        seq: u64,
        block_hash: Hash256,
    },
    /// View change request
    ViewChange {
        new_view: u64,
    },
}

impl NetworkMessage {
    /// Create a new unsigned message
    pub fn new(from: NodeId, payload: MessagePayload) -> Self {
        Self {
            from,
            payload,
            signature: vec![],
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    /// Get bytes to sign
    pub fn signing_bytes(&self) -> Vec<u8> {
        // Serialize payload for signing
        serde_json::to_vec(&self.payload).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_creation() {
        let node_id = NodeId::from_public_key(b"test");
        let msg = NetworkMessage::new(node_id, MessagePayload::Ping);
        assert!(msg.signature.is_empty());
    }

    #[test]
    fn test_message_serialization() {
        let node_id = NodeId::from_public_key(b"test");
        let msg = NetworkMessage::new(node_id, MessagePayload::Ping);
        let bytes = serde_json::to_vec(&msg).unwrap();
        let decoded: NetworkMessage = serde_json::from_slice(&bytes).unwrap();
        assert!(matches!(decoded.payload, MessagePayload::Ping));
    }
}
