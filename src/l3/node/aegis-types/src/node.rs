//! Node identification types

use serde::{Deserialize, Serialize};
use crate::Hash256;
use std::fmt;

/// Unique identifier for a node in the L3 network
#[derive(Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NodeId(pub [u8; 32]);

impl NodeId {
    /// Create a new NodeId from bytes
    pub fn new(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Create NodeId from a public key hash
    pub fn from_public_key(public_key: &[u8]) -> Self {
        let hash = Hash256::hash(public_key);
        Self(*hash.as_bytes())
    }

    /// Get the underlying bytes
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// Convert to hex string
    pub fn to_hex(&self) -> String {
        hex::encode(self.0)
    }

    /// Parse from hex string
    pub fn from_hex(s: &str) -> Result<Self, hex::FromHexError> {
        let bytes = hex::decode(s)?;
        if bytes.len() != 32 {
            return Err(hex::FromHexError::InvalidStringLength);
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&bytes);
        Ok(Self(arr))
    }
}

impl fmt::Debug for NodeId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "NodeId(0x{})", &self.to_hex()[..8])
    }
}

impl fmt::Display for NodeId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "0x{}", self.to_hex())
    }
}

impl From<[u8; 32]> for NodeId {
    fn from(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_id_from_public_key() {
        let pk = b"mock dilithium public key bytes here";
        let id = NodeId::from_public_key(pk);
        assert!(!id.as_bytes().iter().all(|&b| b == 0));
    }

    #[test]
    fn test_node_id_hex_roundtrip() {
        let id = NodeId::from_public_key(b"test key");
        let hex = id.to_hex();
        let parsed = NodeId::from_hex(&hex).unwrap();
        assert_eq!(id, parsed);
    }
}
