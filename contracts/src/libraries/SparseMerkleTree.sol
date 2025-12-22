// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SHA3_256} from "./SHA3_256.sol";

/// @title SparseMerkleTree - Optimized SMT for Quantum Shield
/// @notice Sparse Merkle Tree implementation for L1 state verification
/// @dev Implements SMT with depth 20 using SHA3-256 (FIPS 202)
///
/// Architecture:
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │                    Sparse Merkle Tree (Depth 20)                    │
/// ├─────────────────────────────────────────────────────────────────────┤
/// │  Root                                                               │
/// │   ├── [0] ────────────────────────────────────────                 │
/// │   │    ├── [00] ─────────────────────                              │
/// │   │    │    ├── ...                                                │
/// │   │    │    └── Leaf: SHA3(lockId || amount || recipient || pubkey)│
/// │   │    └── [01] ─────────────────────                              │
/// │   └── [1] ────────────────────────────────────────                 │
/// │        └── ...                                                      │
/// └─────────────────────────────────────────────────────────────────────┘
///
/// IMPORTANT UPDATE (Day 2-4):
/// - Changed from keccak256 to SHA3-256 for FIPS 202 compliance
/// - SHA3-256 uses padding 0x06 (NIST standard)
/// - keccak256 uses padding 0x01 (Ethereum standard)
/// - This change is required for QUANTUM_SHIELD_UNIFIED_SPEC_v2.0 compliance
///
/// Features:
/// - SHA3-256 hashing (FIPS 202 compliant) ✅
/// - Depth 20 (2^20 = 1,048,576 possible leaves)
/// - Optimized proof verification
/// - Domain separation for security
/// - Backward compatibility mode (keccak256) for migration
library SparseMerkleTree {
    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Tree depth (2^20 possible leaves)
    uint256 public constant TREE_DEPTH = 20;

    /// @notice Maximum leaf index
    uint256 public constant MAX_LEAF_INDEX = (1 << TREE_DEPTH) - 1;

    /// @notice Empty leaf hash (SHA3-256 of empty bytes)
    /// @dev SHA3-256("") = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
    bytes32 public constant EMPTY_LEAF_SHA3 = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;

    /// @notice Legacy empty leaf hash (keccak256) for backward compatibility
    bytes32 public constant EMPTY_LEAF_LEGACY = 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563;

    /// @notice Domain separator for leaf hashing
    bytes32 public constant LEAF_DOMAIN = 0x51535f534d545f4c4541465f563100000000000000000000000000000000000000; // "QS_SMT_LEAF_V1"

    /// @notice Domain separator for node hashing
    bytes32 public constant NODE_DOMAIN = 0x51535f534d545f4e4f44455f563100000000000000000000000000000000000000; // "QS_SMT_NODE_V1"

    // =========================================================================
    // Structs
    // =========================================================================

    /// @notice SMT Proof structure
    struct Proof {
        bytes32 leaf;
        uint256 index;
        bytes32[20] siblings;
    }

    /// @notice Lock data for leaf computation
    struct LockData {
        bytes32 lockId;
        uint256 amount;
        address recipient;
        bytes32 pubKeyHash;
    }

    // =========================================================================
    // Errors
    // =========================================================================

    error InvalidProofLength();
    error IndexOutOfBounds();
    error InvalidLeafData();

    // =========================================================================
    // Core Functions (SHA3-256)
    // =========================================================================

    /// @notice Verify an SMT inclusion proof using SHA3-256
    /// @param leaf The leaf value to verify
    /// @param index The leaf index in the tree
    /// @param siblings Array of sibling hashes (length = TREE_DEPTH)
    /// @param root The expected root hash
    /// @return valid True if proof is valid
    function verifyProof(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings,
        bytes32 root
    ) internal pure returns (bool valid) {
        if (siblings.length != TREE_DEPTH) revert InvalidProofLength();
        if (index > MAX_LEAF_INDEX) revert IndexOutOfBounds();

        bytes32 computedHash = leaf;
        uint256 path = index;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            bytes32 sibling = siblings[i];

            if (path & 1 == 0) {
                // Current node is left child
                computedHash = hashNodes(computedHash, sibling);
            } else {
                // Current node is right child
                computedHash = hashNodes(sibling, computedHash);
            }

            path >>= 1;
        }

        return computedHash == root;
    }

    /// @notice Verify proof with struct input
    /// @param proof The proof structure
    /// @param root The expected root hash
    /// @return valid True if proof is valid
    function verifyProofStruct(
        Proof memory proof,
        bytes32 root
    ) internal pure returns (bool valid) {
        bytes32 computedHash = proof.leaf;
        uint256 path = proof.index;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            bytes32 sibling = proof.siblings[i];

            if (path & 1 == 0) {
                computedHash = hashNodes(computedHash, sibling);
            } else {
                computedHash = hashNodes(sibling, computedHash);
            }

            path >>= 1;
        }

        return computedHash == root;
    }

    /// @notice Compute root from leaf and proof
    /// @param leaf The leaf value
    /// @param index The leaf index
    /// @param siblings Array of sibling hashes
    /// @return root The computed root hash
    function computeRoot(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings
    ) internal pure returns (bytes32 root) {
        if (siblings.length != TREE_DEPTH) revert InvalidProofLength();
        if (index > MAX_LEAF_INDEX) revert IndexOutOfBounds();

        root = leaf;
        uint256 path = index;

        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            bytes32 sibling = siblings[i];

            if (path & 1 == 0) {
                root = hashNodes(root, sibling);
            } else {
                root = hashNodes(sibling, root);
            }

            path >>= 1;
        }
    }

    // =========================================================================
    // Hashing Functions (SHA3-256)
    // =========================================================================

    /// @notice Hash two child nodes into parent node using SHA3-256
    /// @dev FIPS 202 compliant - uses SHA3-256 with domain separation
    /// @param left Left child hash
    /// @param right Right child hash
    /// @return parent Parent node hash
    function hashNodes(bytes32 left, bytes32 right) internal pure returns (bytes32 parent) {
        // Domain-separated hashing using SHA3-256 (FIPS 202)
        bytes memory data = abi.encodePacked(NODE_DOMAIN, left, right);
        parent = SHA3_256.hash(data);
    }

    /// @notice Compute leaf hash from lock data using SHA3-256
    /// @param lockId Unique lock identifier
    /// @param amount Locked amount in wei
    /// @param recipient Recipient address
    /// @param pubKeyHash Hash of Dilithium public key
    /// @return leaf The leaf hash
    function computeLeaf(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash
    ) internal pure returns (bytes32 leaf) {
        // Domain-separated leaf hashing using SHA3-256 (FIPS 202)
        bytes memory data = abi.encodePacked(
            LEAF_DOMAIN,
            lockId,
            amount,
            recipient,
            pubKeyHash
        );
        leaf = SHA3_256.hash(data);
    }

    /// @notice Compute leaf hash from struct
    /// @param data Lock data structure
    /// @return leaf The leaf hash
    function computeLeafFromData(LockData memory data) internal pure returns (bytes32 leaf) {
        if (data.lockId == bytes32(0)) revert InvalidLeafData();
        
        bytes memory encoded = abi.encodePacked(
            LEAF_DOMAIN,
            data.lockId,
            data.amount,
            data.recipient,
            data.pubKeyHash
        );
        leaf = SHA3_256.hash(encoded);
    }

    // =========================================================================
    // Legacy Functions (keccak256) - For Migration
    // =========================================================================

    /// @notice Hash nodes using legacy keccak256 (for migration only)
    /// @dev DEPRECATED - Use hashNodes() for new implementations
    /// @param left Left child hash
    /// @param right Right child hash
    /// @return parent Parent node hash
    function hashNodesLegacy(bytes32 left, bytes32 right) internal pure returns (bytes32 parent) {
        parent = keccak256(abi.encodePacked(NODE_DOMAIN, left, right));
    }

    /// @notice Compute leaf using legacy keccak256 (for migration only)
    /// @dev DEPRECATED - Use computeLeaf() for new implementations
    function computeLeafLegacy(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash
    ) internal pure returns (bytes32 leaf) {
        leaf = keccak256(abi.encodePacked(
            LEAF_DOMAIN,
            lockId,
            amount,
            recipient,
            pubKeyHash
        ));
    }

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /// @notice Get the default hash for an empty subtree at given height
    /// @param height Height of the subtree (0 = leaf level)
    /// @return hash The default hash at that height
    function getDefaultHash(uint256 height) internal pure returns (bytes32 hash) {
        hash = EMPTY_LEAF_SHA3;
        for (uint256 i = 0; i < height; i++) {
            hash = hashNodes(hash, hash);
        }
    }

    /// @notice Get legacy default hash (keccak256) for migration
    /// @dev DEPRECATED - Use getDefaultHash() for new implementations
    function getDefaultHashLegacy(uint256 height) internal pure returns (bytes32 hash) {
        hash = EMPTY_LEAF_LEGACY;
        for (uint256 i = 0; i < height; i++) {
            hash = hashNodesLegacy(hash, hash);
        }
    }

    /// @notice Compute the empty tree root (all leaves empty)
    /// @return root The empty tree root
    function getEmptyRoot() internal pure returns (bytes32 root) {
        root = getDefaultHash(TREE_DEPTH);
    }

    /// @notice Get the leaf index from a lock ID (deterministic mapping)
    /// @param lockId The lock identifier
    /// @return index The leaf index (mod 2^20)
    function getLeafIndex(bytes32 lockId) internal pure returns (uint256 index) {
        // Use SHA3-256 for index derivation
        bytes32 indexHash = SHA3_256.hash(abi.encodePacked(lockId));
        index = uint256(indexHash) & MAX_LEAF_INDEX;
    }

    /// @notice Verify proof and check leaf matches lock data
    /// @param lockId Lock identifier
    /// @param amount Locked amount
    /// @param recipient Recipient address
    /// @param pubKeyHash Public key hash
    /// @param siblings Proof siblings
    /// @param root Expected root
    /// @return valid True if lock is included in tree
    function verifyLockInclusion(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash,
        bytes32[] calldata siblings,
        bytes32 root
    ) internal pure returns (bool valid) {
        bytes32 leaf = computeLeaf(lockId, amount, recipient, pubKeyHash);
        uint256 index = getLeafIndex(lockId);
        return verifyProof(leaf, index, siblings, root);
    }

    // =========================================================================
    // Batch Operations
    // =========================================================================

    /// @notice Verify multiple proofs efficiently
    /// @param leaves Array of leaf values
    /// @param indices Array of leaf indices
    /// @param allSiblings 2D array of siblings (flattened for gas efficiency)
    /// @param root The expected root hash
    /// @return validCount Number of valid proofs
    function verifyBatch(
        bytes32[] calldata leaves,
        uint256[] calldata indices,
        bytes32[] calldata allSiblings,
        bytes32 root
    ) internal pure returns (uint256 validCount) {
        uint256 count = leaves.length;
        if (indices.length != count) revert InvalidProofLength();
        if (allSiblings.length != count * TREE_DEPTH) revert InvalidProofLength();

        for (uint256 i = 0; i < count; i++) {
            bytes32 computedHash = leaves[i];
            uint256 path = indices[i];
            uint256 siblingOffset = i * TREE_DEPTH;

            for (uint256 j = 0; j < TREE_DEPTH; j++) {
                bytes32 sibling = allSiblings[siblingOffset + j];

                if (path & 1 == 0) {
                    computedHash = hashNodes(computedHash, sibling);
                } else {
                    computedHash = hashNodes(sibling, computedHash);
                }

                path >>= 1;
            }

            if (computedHash == root) {
                validCount++;
            }
        }
    }

    // =========================================================================
    // Verification
    // =========================================================================

    /// @notice Verify SHA3-256 implementation is correct
    /// @return valid True if SHA3-256 passes NIST test vector
    function verifySHA3Implementation() internal pure returns (bool valid) {
        return SHA3_256.verifySHA3Implementation();
    }

    /// @notice Get hash function info
    /// @return hashFunction Name of hash function
    /// @return fipsCompliant FIPS 202 compliance status
    function getHashInfo() internal pure returns (string memory hashFunction, bool fipsCompliant) {
        return ("SHA3-256", true);
    }
}
