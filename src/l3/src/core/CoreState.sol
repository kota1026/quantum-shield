// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICoreState} from "../interfaces/ICoreState.sol";
import {SHA3_256} from "../crypto/SHA3_256.sol";

/// @title CoreState
/// @notice Core Layer State Management implementation
/// @dev Integrates Phase 2 SparseMerkleTree and SHA3-256 (FIPS 202)
/// @dev Part of Quantum Shield's Modular Architecture
/// @custom:security-contact security@quantumshield.io
contract CoreState is ICoreState {
    // ============ Constants ============
    
    /// @inheritdoc ICoreState
    uint256 public constant override STATE_VERSION = 1;
    
    /// @inheritdoc ICoreState
    uint256 public constant override TREE_DEPTH = 20;
    
    /// @inheritdoc ICoreState
    uint256 public constant override MAX_LEAF_INDEX = (1 << TREE_DEPTH) - 1;
    
    /// @inheritdoc ICoreState
    /// @dev SHA3-256("") = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
    bytes32 public constant override EMPTY_LEAF_HASH = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;

    // ============ Domain Separators (SHA3-256 Pre-computed for CP-1 Compliance) ============
    
    /// @notice Domain separator for leaf hashing
    /// @dev SHA3-256("QS_SMT_LEAF_V1") - Pre-computed for CP-1 compliance (no keccak256)
    bytes32 private constant LEAF_DOMAIN = 0x1fc57ebce31be3d5781e78f150b1303c4295b0ab57b3e349a286904a176f3a22;
    
    /// @notice Domain separator for node hashing
    /// @dev SHA3-256("QS_SMT_NODE_V1") - Pre-computed for CP-1 compliance (no keccak256)
    bytes32 private constant NODE_DOMAIN = 0x2788e21c82dcd3e3f1683169f418c39da467ef396fca65015ae273ef0f04be03;
    
    /// @notice Domain separator for state root calculation
    /// @dev SHA3-256("QS_STATE_ROOT_V1") - Pre-computed for CP-1 compliance (no keccak256)
    bytes32 private constant STATE_ROOT_DOMAIN = 0x60311680a88251ea5468ef203bddcdd726d4fa7b0e68ec9cb636dafef58d1f29;

    // ============ Core State Functions ============
    
    /// @inheritdoc ICoreState
    function calculateStateRoot(StateEntry[] calldata entries) external pure override returns (bytes32 root) {
        if (entries.length == 0) revert EmptyStateEntries();
        
        // Sort-free state root calculation using accumulative hashing
        // Each entry contributes to the root via domain-separated hashing
        bytes memory accumulator = abi.encodePacked(STATE_ROOT_DOMAIN);
        
        for (uint256 i = 0; i < entries.length; i++) {
            accumulator = abi.encodePacked(
                accumulator,
                entries[i].key,
                entries[i].value
            );
        }
        
        root = SHA3_256.hash(accumulator);
    }

    /// @inheritdoc ICoreState
    function verifyInclusion(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings,
        bytes32 root
    ) external pure override returns (bool valid) {
        if (siblings.length != TREE_DEPTH) {
            revert InvalidProofLength(TREE_DEPTH, siblings.length);
        }
        if (index > MAX_LEAF_INDEX) {
            revert IndexOutOfBounds(index, MAX_LEAF_INDEX);
        }

        bytes32 computedHash = leaf;
        uint256 path = index;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            bytes32 sibling = siblings[i];

            if (path & 1 == 0) {
                // Current node is left child
                computedHash = _hashNodes(computedHash, sibling);
            } else {
                // Current node is right child
                computedHash = _hashNodes(sibling, computedHash);
            }

            path >>= 1;
        }

        return computedHash == root;
    }

    /// @inheritdoc ICoreState
    function computeRoot(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings
    ) external pure override returns (bytes32 root) {
        if (siblings.length != TREE_DEPTH) {
            revert InvalidProofLength(TREE_DEPTH, siblings.length);
        }
        if (index > MAX_LEAF_INDEX) {
            revert IndexOutOfBounds(index, MAX_LEAF_INDEX);
        }

        root = leaf;
        uint256 path = index;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            bytes32 sibling = siblings[i];

            if (path & 1 == 0) {
                root = _hashNodes(root, sibling);
            } else {
                root = _hashNodes(sibling, root);
            }

            path >>= 1;
        }
    }

    // ============ Leaf Computation ============

    /// @inheritdoc ICoreState
    function computeLeaf(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash
    ) external pure override returns (bytes32 leaf) {
        bytes memory data = abi.encodePacked(
            LEAF_DOMAIN,
            lockId,
            amount,
            recipient,
            pubKeyHash
        );
        leaf = SHA3_256.hash(data);
    }

    /// @inheritdoc ICoreState
    function getLeafIndex(bytes32 lockId) external pure override returns (uint256 index) {
        bytes32 indexHash = SHA3_256.hash(abi.encodePacked(lockId));
        index = uint256(indexHash) & MAX_LEAF_INDEX;
    }

    // ============ Hash Functions ============

    /// @inheritdoc ICoreState
    function hashNodes(bytes32 left, bytes32 right) external pure override returns (bytes32 parent) {
        return _hashNodes(left, right);
    }

    /// @inheritdoc ICoreState
    function sha3Hash(bytes calldata data) external pure override returns (bytes32 digest) {
        digest = SHA3_256.hash(data);
    }

    // ============ Utility Functions ============

    /// @inheritdoc ICoreState
    function getDefaultHash(uint256 height) external pure override returns (bytes32 defaultHash) {
        defaultHash = EMPTY_LEAF_HASH;
        for (uint256 i = 0; i < height; i++) {
            defaultHash = _hashNodes(defaultHash, defaultHash);
        }
    }

    /// @inheritdoc ICoreState
    function getEmptyRoot() external pure override returns (bytes32 root) {
        root = EMPTY_LEAF_HASH;
        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            root = _hashNodes(root, root);
        }
    }

    /// @inheritdoc ICoreState
    function verifyLockInclusion(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash,
        bytes32[] calldata siblings,
        bytes32 root
    ) external pure override returns (bool valid) {
        // Compute leaf
        bytes32 leaf = SHA3_256.hash(abi.encodePacked(
            LEAF_DOMAIN,
            lockId,
            amount,
            recipient,
            pubKeyHash
        ));
        
        // Get index
        bytes32 indexHash = SHA3_256.hash(abi.encodePacked(lockId));
        uint256 index = uint256(indexHash) & MAX_LEAF_INDEX;
        
        // Verify inclusion
        if (siblings.length != TREE_DEPTH) {
            revert InvalidProofLength(TREE_DEPTH, siblings.length);
        }

        bytes32 computedHash = leaf;
        uint256 path = index;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            bytes32 sibling = siblings[i];

            if (path & 1 == 0) {
                computedHash = _hashNodes(computedHash, sibling);
            } else {
                computedHash = _hashNodes(sibling, computedHash);
            }

            path >>= 1;
        }

        return computedHash == root;
    }

    // ============ Hash Function Info ============

    /// @inheritdoc ICoreState
    function getHashInfo() external pure override returns (string memory hashFunction, bool fipsCompliant) {
        return ("SHA3-256", true);
    }

    /// @inheritdoc ICoreState
    function verifySHA3Implementation() external pure override returns (bool valid) {
        return SHA3_256.verifySHA3Implementation();
    }

    // ============ Internal Functions ============

    /// @dev Hash two nodes using SHA3-256 with domain separation
    /// @param left Left child hash
    /// @param right Right child hash
    /// @return parent Parent node hash
    function _hashNodes(bytes32 left, bytes32 right) internal pure returns (bytes32 parent) {
        bytes memory data = abi.encodePacked(NODE_DOMAIN, left, right);
        parent = SHA3_256.hash(data);
    }
}
