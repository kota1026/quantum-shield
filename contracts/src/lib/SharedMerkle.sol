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
 * ## CP-1 Compliance (Quantum Resistance)
 * - Uses ONLY SHA3-256 (FIPS 202) for all hash operations
 * - keccak256 is PROHIBITED
 * - Domain separation for security
 * 
 * ## Gas Optimization Strategy (v0.2.1)
 * - Cache intermediate nodes from VALID proofs only
 * - Prevents cache pollution from invalid proofs
 * - Reuse computations across valid proofs sharing ancestors
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 0.2.1
 */
contract SharedMerkle {
    using SHA3Hasher for bytes;
    using SHA3Hasher for bytes32;

    // =========================================================================
    // Constants
    // =========================================================================

    bytes32 private constant DOMAIN_MERKLE_NODE = bytes32("QS_STARK_MERKLE_V1");
    bytes32 private constant DOMAIN_LEAF = bytes32("QS_STARK_LEAF_V1");
    uint256 public constant MAX_DEPTH = 32;
    uint256 public constant MAX_BATCH_SIZE = 100;

    // =========================================================================
    // Structs
    // =========================================================================

    struct ProofContext {
        bytes32 computedHash;
        uint256 nodeIndex;
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

    function getVersion() external pure returns (string memory name, string memory version) {
        return ("SharedMerkle", "0.2.1");
    }

    // =========================================================================
    // Single Proof Verification
    // =========================================================================

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
    // Batch Verification with Path Sharing (OPTIMIZED v0.2.1)
    // =========================================================================

    /**
     * @notice Verify multiple proofs with path caching optimization
     * @dev Only caches results from VALID proofs to prevent cache pollution
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

        uint256 depth = allSiblings[0].length;
        if (depth == 0 || depth > MAX_DEPTH) {
            return 0;
        }

        // Cache for valid proof computations
        uint256 maxCacheSize = leaves.length * depth;
        uint256[] memory cacheKeys = new uint256[](maxCacheSize);
        bytes32[] memory cacheValues = new bytes32[](maxCacheSize);
        uint256 cacheCount = 0;

        // Temporary storage for current proof's computations
        uint256[] memory tempKeys = new uint256[](depth);
        bytes32[] memory tempValues = new bytes32[](depth);

        // Process each proof
        for (uint256 p = 0; p < leaves.length; p++) {
            bytes32[] calldata siblings = allSiblings[p];
            
            if (siblings.length != depth) {
                continue;
            }

            ProofContext memory ctx;
            ctx.computedHash = leaves[p];
            ctx.nodeIndex = indices[p];
            uint256 tempCount = 0;

            // Walk up the tree
            for (uint256 level = 0; level < depth; level++) {
                uint256 parentIndex = ctx.nodeIndex >> 1;
                uint256 cacheKey = (level + 1) << 128 | parentIndex;
                
                // Check cache for valid computation
                bytes32 cached = _lookupCache(cacheKeys, cacheValues, cacheCount, cacheKey);
                
                if (cached != bytes32(0)) {
                    // Cache hit from a previously valid proof
                    ctx.computedHash = cached;
                } else {
                    // Compute hash
                    if (ctx.nodeIndex & 1 == 0) {
                        ctx.computedHash = _hashNodes(ctx.computedHash, siblings[level]);
                    } else {
                        ctx.computedHash = _hashNodes(siblings[level], ctx.computedHash);
                    }
                    
                    // Store in temp (will commit to cache only if proof is valid)
                    tempKeys[tempCount] = cacheKey;
                    tempValues[tempCount] = ctx.computedHash;
                    tempCount++;
                }
                
                ctx.nodeIndex = parentIndex;
            }

            // Check if proof is valid
            if (ctx.computedHash == expectedRoot) {
                validCount++;
                
                // Commit temp computations to cache (only for valid proofs)
                for (uint256 i = 0; i < tempCount && cacheCount < maxCacheSize; i++) {
                    // Check if key already exists
                    bool exists = false;
                    for (uint256 j = 0; j < cacheCount; j++) {
                        if (cacheKeys[j] == tempKeys[i]) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        cacheKeys[cacheCount] = tempKeys[i];
                        cacheValues[cacheCount] = tempValues[i];
                        cacheCount++;
                    }
                }
            }
        }
    }

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

    function computeLeaf(uint256 evaluation, uint256 index) external pure returns (bytes32 leaf) {
        return _hashLeaf(evaluation, index);
    }

    // =========================================================================
    // Hash Operations (CP-1 Compliant)
    // =========================================================================

    function hashData(bytes calldata data) external pure returns (bytes32) {
        return SHA3Hasher.hash(data);
    }

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
