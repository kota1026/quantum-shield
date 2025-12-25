// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SHA3_256.sol";

/**
 * @title SHA3Hasher
 * @author Quantum Shield Team
 * @notice SHA3-256 wrapper library for ZK-STARK proof system
 * @dev Provides optimized hashing operations for STARK verification
 * 
 * CP-1 Compliance:
 * - Uses ONLY SHA3-256 (FIPS 202)
 * - keccak256 is PROHIBITED
 * - Ensures quantum resistance via NIST-compliant algorithms
 * 
 * Features:
 * - Single hash: hash(bytes)
 * - Pair hash: hashPair(bytes32, bytes32) - Merkle tree operations
 * - Batch hash: batchHash(bytes32[]) - Gas-optimized multiple hashing
 * 
 * Gas Optimization:
 * - batchHash reduces per-element overhead for multiple hashes
 * - Direct bytes32 input avoids encoding overhead
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    SHA3Hasher (This Library)                    │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  hash() ─────────┐                                              │
 * │  hashPair() ─────┼───> SHA3_256.hash() ───> bytes32            │
 * │  batchHash() ────┘                                              │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 1.0.0
 */
library SHA3Hasher {
    // =========================================================================
    // Core Hashing Functions
    // =========================================================================

    /**
     * @notice Compute SHA3-256 hash of input data
     * @dev Wrapper around SHA3_256.hash for consistent interface
     * @param data Input bytes to hash (any length)
     * @return hash 32-byte SHA3-256 hash
     * 
     * @custom:example
     * ```solidity
     * bytes32 result = SHA3Hasher.hash("hello world");
     * ```
     * 
     * @custom:gas Approximately 1,000,000 gas for 32 bytes input
     */
    function hash(bytes memory data) internal pure returns (bytes32) {
        return SHA3_256.hash(data);
    }

    /**
     * @notice Hash two bytes32 values (optimized for Merkle trees)
     * @dev Computes SHA3-256(left || right) for Merkle tree construction
     * 
     * @param left Left child node (32 bytes)
     * @param right Right child node (32 bytes)
     * @return hash Combined hash of both inputs
     * 
     * @custom:important This function is NOT commutative:
     *                   hashPair(a, b) != hashPair(b, a)
     *                   This is intentional for Merkle tree security.
     * 
     * @custom:example
     * ```solidity
     * bytes32 parent = SHA3Hasher.hashPair(leftChild, rightChild);
     * ```
     * 
     * @custom:gas Approximately 1,000,000 gas (64 bytes input)
     */
    function hashPair(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        return SHA3_256.hashPair(left, right);
    }

    // =========================================================================
    // Batch Hashing (Gas Optimization)
    // =========================================================================

    /**
     * @notice Compute SHA3-256 hashes for multiple bytes32 inputs
     * @dev Optimized for processing multiple hashes in a single call
     * 
     * Each input element is individually hashed:
     *   results[i] = SHA3-256(inputs[i])
     * 
     * @param inputs Array of bytes32 values to hash
     * @return hashes Array of SHA3-256 hashes (same length as inputs)
     * 
     * @custom:optimization Reduces function call overhead when processing
     *                      multiple hashes compared to individual hash() calls.
     *                      Expected ~5-10% gas savings for batches of 10+.
     * 
     * @custom:example
     * ```solidity
     * bytes32[] memory inputs = new bytes32[](3);
     * inputs[0] = bytes32(uint256(1));
     * inputs[1] = bytes32(uint256(2));
     * inputs[2] = bytes32(uint256(3));
     * bytes32[] memory results = SHA3Hasher.batchHash(inputs);
     * ```
     * 
     * @custom:note Empty input array returns empty output array
     * @custom:gas Approximately 1,000,000 gas per element (varies with batch size)
     */
    function batchHash(bytes32[] memory inputs) internal pure returns (bytes32[] memory hashes) {
        uint256 length = inputs.length;
        hashes = new bytes32[](length);
        
        for (uint256 i = 0; i < length;) {
            // Hash each input individually
            // abi.encodePacked(bytes32) produces exactly 32 bytes
            hashes[i] = SHA3_256.hash(abi.encodePacked(inputs[i]));
            
            // Unchecked increment for gas optimization
            unchecked {
                ++i;
            }
        }
    }

    // =========================================================================
    // Extended Functions (Future Expansion)
    // =========================================================================

    /**
     * @notice Hash with domain separation
     * @dev Useful for preventing cross-protocol hash collisions
     * 
     * @param domain Domain separator (e.g., "QuantumShield.StateHash")
     * @param data Data to hash
     * @return hash Domain-separated hash
     * 
     * @custom:example
     * ```solidity
     * bytes32 domain = bytes32("QuantumShield.v1");
     * bytes32 result = SHA3Hasher.hashWithDomain(domain, data);
     * ```
     */
    function hashWithDomain(bytes32 domain, bytes memory data) internal pure returns (bytes32) {
        return SHA3_256.hashWithDomain(domain, data);
    }

    /**
     * @notice Hash multiple bytes32 values in sequence
     * @dev Creates a hash chain: H(H(H(a, b), c), d)
     * 
     * @param values Array of bytes32 values to chain
     * @return hash Final chained hash
     * 
     * @custom:note Empty input returns bytes32(0)
     *              Single element returns hash of that element
     * 
     * @custom:example
     * ```solidity
     * bytes32[] memory values = new bytes32[](4);
     * // ... populate values
     * bytes32 result = SHA3Hasher.hashChain(values);
     * ```
     */
    function hashChain(bytes32[] memory values) internal pure returns (bytes32) {
        uint256 length = values.length;
        
        if (length == 0) {
            return bytes32(0);
        }
        
        // Start with hash of first element
        bytes32 result = SHA3_256.hash(abi.encodePacked(values[0]));
        
        // Chain remaining elements
        for (uint256 i = 1; i < length;) {
            result = SHA3_256.hashPair(result, values[i]);
            unchecked {
                ++i;
            }
        }
        
        return result;
    }

    // =========================================================================
    // Verification Functions
    // =========================================================================

    /**
     * @notice Verify that SHA3Hasher uses correct SHA3-256 implementation
     * @dev Checks against NIST test vector for empty string
     * 
     * @return valid True if implementation is NIST-compliant
     * 
     * @custom:nist-vector SHA3-256("") = 
     *   0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
     */
    function verifyImplementation() internal pure returns (bool valid) {
        return SHA3_256.verifySHA3Implementation();
    }

    /**
     * @notice Get library information
     * @return name Library name
     * @return version Version string
     * @return algorithm Hash algorithm used
     */
    function getInfo() internal pure returns (
        string memory name,
        string memory version,
        string memory algorithm
    ) {
        return ("SHA3Hasher", "1.0.0", "SHA3-256 (FIPS 202)");
    }
}
