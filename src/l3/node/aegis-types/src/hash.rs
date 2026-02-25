//! Hash types for L3 Aegis
//!
//! Uses SHA3-256 exclusively for CP-1 compliance.
//! keccak256 is explicitly prohibited.

use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};
use std::fmt;

/// 256-bit hash value (SHA3-256)
/// 
/// # CP-1 Compliance
/// This type uses SHA3-256 (FIPS 202) exclusively.
/// keccak256 is prohibited per Core Principles.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Default)]
pub struct Hash256(pub [u8; 32]);

impl Hash256 {
    /// Create a new Hash256 from bytes
    pub fn new(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Create a zero hash
    pub fn zero() -> Self {
        Self([0u8; 32])
    }

    /// Check if this is a zero hash
    pub fn is_zero(&self) -> bool {
        self.0 == [0u8; 32]
    }

    /// Compute SHA3-256 hash of data
    /// 
    /// # CP-1 Compliance
    /// Uses SHA3-256 (FIPS 202), not keccak256.
    pub fn hash(data: &[u8]) -> Self {
        let mut hasher = Sha3_256::new();
        hasher.update(data);
        let result = hasher.finalize();
        let mut bytes = [0u8; 32];
        bytes.copy_from_slice(&result);
        Self(bytes)
    }

    /// Get the underlying bytes
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// Create from byte slice (must be exactly 32 bytes)
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        if bytes.len() != 32 {
            return None;
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(bytes);
        Some(Self(arr))
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

impl fmt::Debug for Hash256 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Hash256(0x{})", &self.to_hex()[..8])
    }
}

impl fmt::Display for Hash256 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "0x{}", self.to_hex())
    }
}

impl AsRef<[u8]> for Hash256 {
    fn as_ref(&self) -> &[u8] {
        &self.0
    }
}

impl From<[u8; 32]> for Hash256 {
    fn from(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_zero() {
        let hash = Hash256::zero();
        assert!(hash.is_zero());
    }

    #[test]
    fn test_hash_sha3_256() {
        let data = b"hello world";
        let hash = Hash256::hash(data);
        assert!(!hash.is_zero());
        
        // Known SHA3-256 hash of "hello world"
        let expected = "644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938";
        assert_eq!(hash.to_hex(), expected);
    }

    #[test]
    fn test_hash_deterministic() {
        let data = b"test data";
        let hash1 = Hash256::hash(data);
        let hash2 = Hash256::hash(data);
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_hash_hex_roundtrip() {
        let original = Hash256::hash(b"test");
        let hex = original.to_hex();
        let parsed = Hash256::from_hex(&hex).unwrap();
        assert_eq!(original, parsed);
    }

    #[test]
    fn test_from_bytes() {
        let bytes = [1u8; 32];
        let hash = Hash256::from_bytes(&bytes).unwrap();
        assert_eq!(hash.as_bytes(), &bytes);
        
        // Invalid length should return None
        let short = [0u8; 16];
        assert!(Hash256::from_bytes(&short).is_none());
    }
}
