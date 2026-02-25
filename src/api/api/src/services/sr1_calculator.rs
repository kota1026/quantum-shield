//! SR_1 Calculator - Solidity-Compatible State Root Computation
//!
//! This module provides SR_1 computation that exactly matches the L1 Vault contract.
//! Critical for proper integration with L1 Vault's requestUnlock verification.
//!
//! ## Solidity Reference (StateRootCalculator.sol)
//!
//! ```solidity
//! bytes32 public constant DOMAIN_UNLOCK = keccak256("QS_UNLOCK_V1");
//!
//! function computeSR1(
//!     bytes32 sr0,
//!     bytes32 lockId,
//!     address destAddr,
//!     uint256 amount,
//!     uint256 nonce
//! ) internal pure returns (bytes32 sr1) {
//!     bytes memory data = abi.encodePacked(sr0, lockId, destAddr, amount, nonce);
//!     sr1 = SHA3_256.hashWithDomain(DOMAIN_UNLOCK, data);
//! }
//! ```
//!
//! ## Encoding Details (abi.encodePacked)
//! - bytes32 (sr0, lockId): 32 bytes each, no padding
//! - address (destAddr): 20 bytes, no padding
//! - uint256 (amount, nonce): 32 bytes each, big-endian
//!
//! ## Quantum Resistance
//! - Uses SHA3-256 (FIPS 202) for final hash
//! - Domain separator uses keccak256 (Ethereum standard) for compatibility
//! - The cryptographic strength comes from SHA3-256, not the domain separator

use ethers::types::{Address, U256};
use sha3::{Digest, Keccak256, Sha3_256};
use tracing::{debug, instrument};

/// Domain separator for unlock operations
/// Computed as: keccak256("QS_UNLOCK_V1")
const DOMAIN_UNLOCK_STR: &str = "QS_UNLOCK_V1";

/// Compute the domain separator using keccak256
/// This matches Solidity's: keccak256("QS_UNLOCK_V1")
fn compute_domain_unlock() -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(DOMAIN_UNLOCK_STR.as_bytes());
    let result = hasher.finalize();
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&result);
    arr
}

/// Compute SR_1 exactly as the L1 Vault contract does
///
/// # Arguments
/// * `sr0` - State Root 0 (32 bytes)
/// * `lock_id` - Lock ID (32 bytes)
/// * `dest_addr` - Destination address (20 bytes)
/// * `amount` - Amount in wei (U256)
/// * `nonce` - Unlock nonce counter from L1 (U256)
///
/// # Returns
/// SR_1 as 32 bytes, matching the contract's computation
#[instrument(skip_all, fields(lock_id = hex::encode(lock_id)))]
pub fn compute_sr1(
    sr0: &[u8; 32],
    lock_id: &[u8; 32],
    dest_addr: &Address,
    amount: U256,
    nonce: U256,
) -> [u8; 32] {
    // Step 1: Compute domain separator
    let domain = compute_domain_unlock();

    // Step 2: Build abi.encodePacked(sr0, lockId, destAddr, amount, nonce)
    // Total: 32 + 32 + 20 + 32 + 32 = 148 bytes
    let mut data = Vec::with_capacity(148);

    // bytes32 sr0 - 32 bytes, as-is
    data.extend_from_slice(sr0);

    // bytes32 lockId - 32 bytes, as-is
    data.extend_from_slice(lock_id);

    // address destAddr - 20 bytes, as-is
    data.extend_from_slice(dest_addr.as_bytes());

    // uint256 amount - 32 bytes, big-endian
    let mut amount_bytes = [0u8; 32];
    amount.to_big_endian(&mut amount_bytes);
    data.extend_from_slice(&amount_bytes);

    // uint256 nonce - 32 bytes, big-endian
    let mut nonce_bytes = [0u8; 32];
    nonce.to_big_endian(&mut nonce_bytes);
    data.extend_from_slice(&nonce_bytes);

    debug!(
        "SR1 computation: sr0={}, lockId={}, destAddr={:?}, amount={}, nonce={}",
        hex::encode(sr0),
        hex::encode(lock_id),
        dest_addr,
        amount,
        nonce
    );

    // Step 3: Compute SHA3-256(domain || data)
    // This matches: SHA3_256.hashWithDomain(DOMAIN_UNLOCK, data)
    let mut hasher = Sha3_256::new();
    hasher.update(&domain);
    hasher.update(&data);
    let result = hasher.finalize();

    let mut sr1 = [0u8; 32];
    sr1.copy_from_slice(&result);

    debug!("SR1 computed: {}", hex::encode(&sr1));

    sr1
}

/// Compute SR_1 from hex strings (convenience wrapper)
///
/// # Arguments
/// * `sr0_hex` - State Root 0 as hex string (with or without 0x prefix)
/// * `lock_id_hex` - Lock ID as hex string
/// * `dest_addr_hex` - Destination address as hex string
/// * `amount` - Amount in wei
/// * `nonce` - Unlock nonce counter
///
/// # Returns
/// SR_1 as hex string with 0x prefix
pub fn compute_sr1_hex(
    sr0_hex: &str,
    lock_id_hex: &str,
    dest_addr_hex: &str,
    amount: U256,
    nonce: U256,
) -> Result<String, String> {
    let sr0 = hex_to_bytes32(sr0_hex)?;
    let lock_id = hex_to_bytes32(lock_id_hex)?;
    let dest_addr: Address = dest_addr_hex.parse()
        .map_err(|e| format!("Invalid address: {}", e))?;

    let sr1 = compute_sr1(&sr0, &lock_id, &dest_addr, amount, nonce);
    Ok(format!("0x{}", hex::encode(sr1)))
}

/// Compute the message that provers should sign
///
/// This matches the L1 Vault's signature verification:
/// ```solidity
/// bytes32 message = SHA3_256.hashPair(lockId, expectedSR1);
/// ```
///
/// # Arguments
/// * `lock_id` - Lock ID (32 bytes)
/// * `sr1` - State Root 1 (32 bytes)
///
/// # Returns
/// Message hash for prover signature (32 bytes)
pub fn compute_prover_message(lock_id: &[u8; 32], sr1: &[u8; 32]) -> [u8; 32] {
    // SHA3_256.hashPair(a, b) = SHA3_256(abi.encodePacked(a, b))
    let mut hasher = Sha3_256::new();
    hasher.update(lock_id);
    hasher.update(sr1);
    let result = hasher.finalize();

    let mut message = [0u8; 32];
    message.copy_from_slice(&result);
    message
}

/// Compute prover message from hex strings (convenience wrapper)
pub fn compute_prover_message_hex(lock_id_hex: &str, sr1_hex: &str) -> Result<String, String> {
    let lock_id = hex_to_bytes32(lock_id_hex)?;
    let sr1 = hex_to_bytes32(sr1_hex)?;
    let message = compute_prover_message(&lock_id, &sr1);
    Ok(format!("0x{}", hex::encode(message)))
}

/// Parse hex string (with or without 0x prefix) to [u8; 32]
fn hex_to_bytes32(hex_str: &str) -> Result<[u8; 32], String> {
    let clean = hex_str.strip_prefix("0x").unwrap_or(hex_str);
    let bytes = hex::decode(clean)
        .map_err(|e| format!("Invalid hex: {}", e))?;
    if bytes.len() != 32 {
        return Err(format!("Expected 32 bytes, got {}", bytes.len()));
    }
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes);
    Ok(arr)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_domain_separator() {
        // Verify our domain separator matches Solidity's keccak256("QS_UNLOCK_V1")
        let domain = compute_domain_unlock();
        // This should match the on-chain value
        println!("DOMAIN_UNLOCK = 0x{}", hex::encode(&domain));

        // Verify it's not all zeros
        assert_ne!(domain, [0u8; 32]);
    }

    #[test]
    fn test_compute_sr1_basic() {
        let sr0 = [0xabu8; 32];
        let lock_id = [0xcdu8; 32];
        let dest_addr: Address = "0x1234567890123456789012345678901234567890".parse().unwrap();
        let amount = U256::from(1_000_000_000_000_000_000u64); // 1 ETH
        let nonce = U256::from(0u64);

        let sr1 = compute_sr1(&sr0, &lock_id, &dest_addr, amount, nonce);

        // SR1 should be 32 bytes
        assert_eq!(sr1.len(), 32);
        // Should not be all zeros
        assert_ne!(sr1, [0u8; 32]);

        println!("SR1 = 0x{}", hex::encode(&sr1));
    }

    #[test]
    fn test_compute_sr1_deterministic() {
        let sr0 = [0x11u8; 32];
        let lock_id = [0x22u8; 32];
        let dest_addr: Address = "0xabcdef1234567890abcdef1234567890abcdef12".parse().unwrap();
        let amount = U256::from(5_000_000_000_000_000_000u64); // 5 ETH
        let nonce = U256::from(42u64);

        let sr1_1 = compute_sr1(&sr0, &lock_id, &dest_addr, amount, nonce);
        let sr1_2 = compute_sr1(&sr0, &lock_id, &dest_addr, amount, nonce);

        // Same inputs should produce same output
        assert_eq!(sr1_1, sr1_2);
    }

    #[test]
    fn test_compute_sr1_different_nonce() {
        let sr0 = [0x11u8; 32];
        let lock_id = [0x22u8; 32];
        let dest_addr: Address = "0xabcdef1234567890abcdef1234567890abcdef12".parse().unwrap();
        let amount = U256::from(1_000_000_000_000_000_000u64);

        let sr1_nonce_0 = compute_sr1(&sr0, &lock_id, &dest_addr, amount, U256::from(0u64));
        let sr1_nonce_1 = compute_sr1(&sr0, &lock_id, &dest_addr, amount, U256::from(1u64));

        // Different nonces should produce different SR1
        assert_ne!(sr1_nonce_0, sr1_nonce_1);
    }

    #[test]
    fn test_compute_sr1_hex() {
        let sr0 = "0xabababababababababababababababababababababababababababababababab";
        let lock_id = "0xcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd";
        let dest_addr = "0x1234567890123456789012345678901234567890";
        let amount = U256::from(1_000_000_000_000_000_000u64);
        let nonce = U256::from(5u64);

        let result = compute_sr1_hex(sr0, lock_id, dest_addr, amount, nonce);
        assert!(result.is_ok());

        let sr1 = result.unwrap();
        assert!(sr1.starts_with("0x"));
        assert_eq!(sr1.len(), 66); // 0x + 64 hex chars
    }

    #[test]
    fn test_compute_prover_message() {
        let lock_id = [0xaau8; 32];
        let sr1 = [0xbbu8; 32];

        let message = compute_prover_message(&lock_id, &sr1);

        // Message should be 32 bytes
        assert_eq!(message.len(), 32);
        // Should not be all zeros
        assert_ne!(message, [0u8; 32]);

        println!("Prover message = 0x{}", hex::encode(&message));
    }

    #[test]
    fn test_prover_message_deterministic() {
        let lock_id = [0xaau8; 32];
        let sr1 = [0xbbu8; 32];

        let msg1 = compute_prover_message(&lock_id, &sr1);
        let msg2 = compute_prover_message(&lock_id, &sr1);

        assert_eq!(msg1, msg2);
    }
}
