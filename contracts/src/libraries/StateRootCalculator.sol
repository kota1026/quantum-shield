// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SHA3_256} from "./SHA3_256.sol";

/// @title StateRootCalculator - QUANTUM_SHIELD_SEQUENCES_v2.0 Compliant SR Calculator
/// @notice Computes State Roots (SR_0, SR_1) per specification
/// @dev Uses SHA3-256 (FIPS 202) with domain separation
///
/// Specification (QUANTUM_SHIELD_SEQUENCES_v2.0):
///
/// SR_0 = SHA3-256(
///   "QS_LOCK_V1" ||
///   chain_id ||
///   asset ||
///   amount ||
///   dest_addr ||
///   expiry ||
///   nonce ||
///   pk_dilithium
/// )
///
/// SR_1 = SHA3-256(
///   "QS_UNLOCK_V1" ||
///   SR_0 ||
///   lock_id ||
///   dest_addr ||
///   amount ||
///   nonce
/// )
///
/// Architecture:
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │                    State Root Calculator                            │
/// ├─────────────────────────────────────────────────────────────────────┤
/// │  Lock:   computeSR0(chain_id, asset, amount, ...) → SR_0            │
/// │  Unlock: computeSR1(SR_0, lock_id, ...) → SR_1                      │
/// │                                                                     │
/// │  Hash: SHA3-256 (FIPS 202) with domain separation                  │
/// └─────────────────────────────────────────────────────────────────────┘
library StateRootCalculator {
    // =========================================================================
    // Domain Separators
    // =========================================================================

    /// @notice Domain separator for Lock state root (SR_0)
    bytes32 public constant DOMAIN_LOCK = keccak256("QS_LOCK_V1");

    /// @notice Domain separator for Unlock state root (SR_1)
    bytes32 public constant DOMAIN_UNLOCK = keccak256("QS_UNLOCK_V1");

    // =========================================================================
    // SR_0 (Lock State Root)
    // =========================================================================

    /// @notice Compute SR_0 for a lock operation
    /// @dev SR_0 = SHA3-256("QS_LOCK_V1" || chain_id || asset || amount || dest_addr || expiry || nonce || pk_dilithium)
    /// @param chainId Target chain ID
    /// @param asset Asset address (address(0) for native ETH)
    /// @param amount Lock amount in wei
    /// @param destAddr Destination address on L3
    /// @param expiry Lock expiry timestamp
    /// @param nonce Unique nonce to prevent replay
    /// @param pkDilithium Dilithium public key (hashed)
    /// @return sr0 The computed SR_0
    function computeSR0(
        uint256 chainId,
        address asset,
        uint256 amount,
        address destAddr,
        uint256 expiry,
        uint256 nonce,
        bytes32 pkDilithium
    ) internal pure returns (bytes32 sr0) {
        bytes memory data = abi.encodePacked(
            chainId,
            asset,
            amount,
            destAddr,
            expiry,
            nonce,
            pkDilithium
        );
        
        sr0 = SHA3_256.hashWithDomain(DOMAIN_LOCK, data);
    }

    /// @notice Compute SR_0 from raw Dilithium public key
    /// @param chainId Target chain ID
    /// @param asset Asset address
    /// @param amount Lock amount
    /// @param destAddr Destination address
    /// @param expiry Lock expiry
    /// @param nonce Unique nonce
    /// @param pkDilithiumRaw Raw Dilithium public key bytes
    /// @return sr0 The computed SR_0
    function computeSR0WithRawKey(
        uint256 chainId,
        address asset,
        uint256 amount,
        address destAddr,
        uint256 expiry,
        uint256 nonce,
        bytes memory pkDilithiumRaw
    ) internal pure returns (bytes32 sr0) {
        bytes32 pkDilithiumHash = keccak256(pkDilithiumRaw);
        return computeSR0(chainId, asset, amount, destAddr, expiry, nonce, pkDilithiumHash);
    }

    // =========================================================================
    // SR_1 (Unlock State Root)
    // =========================================================================

    /// @notice Compute SR_1 for an unlock operation
    /// @dev SR_1 = SHA3-256("QS_UNLOCK_V1" || SR_0 || lock_id || dest_addr || amount || nonce)
    /// @param sr0 State root from lock (SR_0)
    /// @param lockId Lock identifier
    /// @param destAddr Recipient address
    /// @param amount Unlock amount
    /// @param nonce Unlock nonce
    /// @return sr1 The computed SR_1
    function computeSR1(
        bytes32 sr0,
        bytes32 lockId,
        address destAddr,
        uint256 amount,
        uint256 nonce
    ) internal pure returns (bytes32 sr1) {
        bytes memory data = abi.encodePacked(
            sr0,
            lockId,
            destAddr,
            amount,
            nonce
        );
        
        sr1 = SHA3_256.hashWithDomain(DOMAIN_UNLOCK, data);
    }

    // =========================================================================
    // Lock ID Generation
    // =========================================================================

    /// @notice Generate a unique lock ID from SR_0 and additional entropy
    /// @dev lockId = SHA3-256("QS_LOCK_ID" || SR_0 || sender || timestamp)
    /// @param sr0 State root
    /// @param sender Lock initiator
    /// @param timestamp Block timestamp
    /// @return lockId Unique lock identifier
    function generateLockId(
        bytes32 sr0,
        address sender,
        uint256 timestamp
    ) internal pure returns (bytes32 lockId) {
        bytes memory data = abi.encodePacked(
            sr0,
            sender,
            timestamp
        );
        
        lockId = SHA3_256.hashWithDomain(keccak256("QS_LOCK_ID"), data);
    }

    // =========================================================================
    // Verification
    // =========================================================================

    /// @notice Verify SR_0 matches expected parameters
    /// @param expectedSR0 Expected SR_0 value
    /// @param chainId Chain ID
    /// @param asset Asset address
    /// @param amount Amount
    /// @param destAddr Destination address
    /// @param expiry Expiry timestamp
    /// @param nonce Nonce
    /// @param pkDilithium Dilithium public key hash
    /// @return valid True if SR_0 matches
    function verifySR0(
        bytes32 expectedSR0,
        uint256 chainId,
        address asset,
        uint256 amount,
        address destAddr,
        uint256 expiry,
        uint256 nonce,
        bytes32 pkDilithium
    ) internal pure returns (bool valid) {
        bytes32 computedSR0 = computeSR0(
            chainId,
            asset,
            amount,
            destAddr,
            expiry,
            nonce,
            pkDilithium
        );
        return computedSR0 == expectedSR0;
    }

    /// @notice Verify SR_1 matches expected parameters
    /// @param expectedSR1 Expected SR_1 value
    /// @param sr0 Original SR_0
    /// @param lockId Lock ID
    /// @param destAddr Destination address
    /// @param amount Amount
    /// @param nonce Nonce
    /// @return valid True if SR_1 matches
    function verifySR1(
        bytes32 expectedSR1,
        bytes32 sr0,
        bytes32 lockId,
        address destAddr,
        uint256 amount,
        uint256 nonce
    ) internal pure returns (bool valid) {
        bytes32 computedSR1 = computeSR1(sr0, lockId, destAddr, amount, nonce);
        return computedSR1 == expectedSR1;
    }

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /// @notice Get library version
    /// @return version Version string
    function version() internal pure returns (string memory) {
        return "1.0.0";
    }

    /// @notice Check if library is specification compliant
    /// @return compliant True if compliant with QUANTUM_SHIELD_SEQUENCES_v2.0
    function isSpecCompliant() internal pure returns (bool compliant) {
        // Verify SHA3-256 implementation
        return SHA3_256.verifySHA3Implementation();
    }
}
