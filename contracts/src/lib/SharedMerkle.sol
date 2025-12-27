// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SHA3_256} from "../libraries/SHA3_256.sol";
import {SHA3Hasher} from "../libraries/SHA3Hasher.sol";

/**
 * @title SharedMerkle
 * @author Quantum Shield Team
 * @notice Optimized Merkle tree operations with path sharing
 * @dev IMPL-010: Implements Merkle path sharing for batch verification optimization
 * 
 * ## Overview
 * This library provides optimized Merkle tree operations that can share
 * common path segments across multiple proofs, reducing gas costs when
 * verifying multiple proofs against the same root.
 * 
 * ## CP-1 Compliance (Quantum Resistance)
 * - Uses ONLY SHA3-256 (FIPS 202) for all hash operations
 * - keccak256 is PROHIBITED
 * - Domain separation for security
 * 
 * ## Gas Optimization Strategy (v0.2)
 * 1. Cache intermediate nodes during verification
 * 2. Reuse shared path segments via position-based caching
 * 3. Bottom-up computation with deduplication
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 0.2.0
 */
contract SharedMerkle {
    using SHA3Hasher for bytes;
    using SHA3Hasher for bytes32;

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Domain separator for Merkle node hashing
    bytes32 private constant DOMAIN_MERKLE_NODE = bytes32("QS_STARK_MERKLE_V1");

    /// @notice Domain separator for leaf hashing
    bytes32 private constant DOMAIN_LEAF = bytes32("QS_STARK_LEAF_V1");

    /// @notice Maximum supported tree depth
    uint256 public constant MAX_DEPTH = 32;

    /// @notice Maximum batch size for optimization
    uint256 public constant MAX_BATCH_SIZE = 100;

    // =========================================================================
    // Structs for Stack Optimization
    // =========================================================================

    /// @dev Internal struct to avoid stack too deep
    struct BatchContext {
        uint256 batchSize;
        uint256 depth;
        uint256 cacheCount;
        uint256 validCount;
    }

    /// @dev Proof verification context
    struct ProofContext {
        bytes32 computedHash;
        uint256 nodeIndex;
        bool isValid;
    }

    // =========================================================================
    // Errors
    // =========================================================================

    error InvalidProofDepth();
    error InvalidEvaluationCount();
    error ProofDepthExceedsMax();
    error BatchSizeTooLarge();

    // =========================================================================
    // Events
    // =========================================================================

    event ProofVerified(bytes32 indexed leaf, bytes32 indexed root, uint256 index);

    // =========================================================================
    // Version Information
    // =========================================================================

    /**
     * @notice Get library version
     */
    function getVersion() external pure returns (string memory name, string memory version) {
        return ("SharedMerkle", "0.2.0");
    }

    // =========================================================================
    // Single Proof Verification
    // =========================================================================

    /**
     * @notice Verify a single Merkle proof
     * @dev CP-1 COMPLIANCE: Uses SHA3-256 for all hashing
     * @param leaf The leaf value to verify
     * @param index Position of the leaf in the tree
     * @param siblings Array of sibling hashes (Merkle proof path)
     * @param expectedRoot Expected Merkle root
     * @return valid True if proof is valid
     */
    function verifyProof(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings,
        bytes32 expectedRoot
    ) external pure returns (bool valid) {
        if (siblings.length == 0 || siblings.length > MAX_DEPTH) {
            return false;
        }

        bytes32 computedHash = leaf;
        uint256 path = index;

        for (uint256 i = 0; i < siblings.length; i++) {
            if (path & 1 == 0) {
                computedHash = _hashNodes(computedHash, siblings[i]);
            } else {
                computedHash = _hashNodes(siblings[i], computedHash);
            }
            path >>= 1;
        }

        return computedHash == expectedRoot;
    }

    // =========================================================================
    // Batch Verification with Path Sharing (OPTIMIZED v0.2)
    // =========================================================================

    /**
     * @notice Verify multiple proofs with path caching optimization
     * @dev Caches intermediate nodes to avoid redundant hash computations
     * @param leaves Array of leaf values
     * @param indices Array of leaf positions
     * @param allSiblings 2D array of sibling hashes
     * @param expectedRoot Expected Merkle root
     * @return validCount Number of valid proofs
     */
    function verifyBatchProofs(
        bytes32[] calldata leaves,
        uint256[] calldata indices,
        bytes32[][] calldata allSiblings,
        bytes32 expectedRoot
    ) external pure returns (uint256 validCount) {
        // Input validation
        if (leaves.length != indices.length || leaves.length != allSiblings.length) {
            return 0;
        }
        if (leaves.length == 0) {
            return 0;
        }
        if (leaves.length > MAX_BATCH_SIZE) {
            revert BatchSizeTooLarge();
        }

        // Get proof depth
        uint256 depth = allSiblings[0].length;
        if (depth == 0 || depth > MAX_DEPTH) {
            return 0;
        }

        // Initialize cache
        uint256 maxCacheSize = leaves.length * depth;
        uint256[] memory cacheKeys = new uint256[](maxCacheSize);
        bytes32[] memory cacheValues = new bytes32[](maxCacheSize);
        uint256 cacheCount = 0;

        // Process each proof
        for (uint256 p = 0; p < leaves.length; p++) {
            bytes32[] calldata siblings = allSiblings[p];
            
            if (siblings.length != depth) {
                continue;
            }

            ProofContext memory ctx;
            ctx.computedHash = leaves[p];
            ctx.nodeIndex = indices[p];
            ctx.isValid = true;

            // Walk up the tree
            for (uint256 level = 0; level < depth && ctx.isValid; level++) {
                uint256 parentIndex = ctx.nodeIndex >> 1;
                uint256 cacheKey = (level + 1) << 128 | parentIndex;
                
                // Check cache
                bytes32 cached = _lookupCache(cacheKeys, cacheValues, cacheCount, cacheKey);
                
                if (cached != bytes32(0)) {
                    ctx.computedHash = cached;
                } else {
                    // Compute hash
                    if (ctx.nodeIndex & 1 == 0) {
                        ctx.computedHash = _hashNodes(ctx.computedHash, siblings[level]);
                    } else {
                        ctx.computedHash = _hashNodes(siblings[level], ctx.computedHash);
                    }
                    
                    // Store in cache
                    if (cacheCount < maxCacheSize) {
                        cacheKeys[cacheCount] = cacheKey;
                        cacheValues[cacheCount] = ctx.computedHash;
                        cacheCount++;
                    }
                }
                
                ctx.nodeIndex = parentIndex;
            }

            if (ctx.computedHash == expectedRoot) {
                validCount++;
            }
        }
    }

    /**
     * @notice Lookup value in cache
     */
    function _lookupCache(
        uint256[] memory keys,
        bytes32[] memory values,
        uint256 count,
        uint256 targetKey
    ) internal pure returns (bytes32) {
        for (uint256 i = 0; i < count; i++) {
            if (keys[i] == targetKey) {
                return values[i];
            }
        }
        return bytes32(0);
    }

    // =========================================================================
    // Merkle Root Computation
    // =========================================================================

    /**
     * @notice Compute Merkle root from evaluations
     * @param evaluations Array of evaluation values (must be power of 2)
     * @return root The computed Merkle root
     */
    function computeRoot(uint256[] calldata evaluations) external pure returns (bytes32 root) {
        if (evaluations.length == 0) {
            revert InvalidEvaluationCount();
        }
        if ((evaluations.length & (evaluations.length - 1)) != 0) {
            revert InvalidEvaluationCount();
        }

        bytes32[] memory layer = new bytes32[](evaluations.length);
        for (uint256 i = 0; i < evaluations.length; i++) {
            layer[i] = _hashLeaf(evaluations[i], i);
        }

        while (layer.length > 1) {
            bytes32[] memory nextLayer = new bytes32[](layer.length / 2);
            for (uint256 i = 0; i < nextLayer.length; i++) {
                nextLayer[i] = _hashNodes(layer[2 * i], layer[2 * i + 1]);
            }
            layer = nextLayer;
        }

        return layer[0];
    }

    /**
     * @notice Compute leaf hash from evaluation
     */
    function computeLeaf(uint256 evaluation, uint256 index) external pure returns (bytes32 leaf) {
        return _hashLeaf(evaluation, index);
    }

    // =========================================================================
    // Hash Operations (CP-1 Compliant)
    // =========================================================================

    /**
     * @notice Hash arbitrary data using SHA3-256
     */
    function hashData(bytes calldata data) external pure returns (bytes32) {
        return SHA3Hasher.hash(data);
    }

    /**
     * @notice Hash two values for Merkle operations
     */
    function hashPair(bytes32 left, bytes32 right) external pure returns (bytes32) {
        return _hashNodes(left, right);
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    function _hashNodes(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        return SHA3Hasher.hash(abi.encodePacked(DOMAIN_MERKLE_NODE, left, right));
    }

    function _hashLeaf(uint256 evaluation, uint256 index) internal pure returns (bytes32) {
        return SHA3Hasher.hash(abi.encodePacked(DOMAIN_LEAF, evaluation, index));
    }
}
