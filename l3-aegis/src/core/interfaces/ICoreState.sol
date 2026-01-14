// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ICoreState
/// @notice Interface for Core Layer state management
/// @dev Part of Quantum Shield's Modular Architecture (MODULAR_ARCHITECTURE.md §3.3)
/// @dev Implements State Management (IC-4) per L3_CHAIN_SPECIFICATION.md §5
/// @custom:security-contact security@quantumshield.io
interface ICoreState {
    // ============ Structs ============
    
    /// @notice State entry for batch operations
    struct StateEntry {
        bytes32 key;
        bytes32 value;
    }
    
    /// @notice Merkle proof structure
    struct MerkleProof {
        bytes32 leaf;
        uint256 index;
        bytes32[] siblings;
    }
    
    // ============ Events ============
    
    /// @notice Emitted when state root is updated
    /// @param previousRoot Previous state root
    /// @param newRoot New state root
    /// @param blockNumber Block number of update
    event StateRootUpdated(
        bytes32 indexed previousRoot,
        bytes32 indexed newRoot,
        uint256 blockNumber
    );
    
    /// @notice Emitted when state entry is modified
    /// @param key State key
    /// @param previousValue Previous value (bytes32(0) if new)
    /// @param newValue New value
    event StateEntryModified(
        bytes32 indexed key,
        bytes32 previousValue,
        bytes32 newValue
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when proof verification fails
    error InvalidMerkleProof();
    
    /// @notice Thrown when state root mismatch
    error StateRootMismatch(bytes32 expected, bytes32 actual);
    
    /// @notice Thrown when index is out of bounds
    error IndexOutOfBounds(uint256 index, uint256 maxIndex);
    
    /// @notice Thrown when batch operation exceeds limit
    error BatchSizeExceeded(uint256 size, uint256 maxSize);
    
    // ============ Constants ============
    
    /// @notice State version for compatibility checks
    /// @return Version number (1 = initial SHA3-256 implementation)
    function STATE_VERSION() external pure returns (uint256);
    
    /// @notice Merkle tree depth
    /// @return Tree depth (20 = 2^20 possible leaves)
    function TREE_DEPTH() external pure returns (uint256);
    
    /// @notice Maximum batch size for operations
    /// @return Maximum entries per batch
    function MAX_BATCH_SIZE() external pure returns (uint256);
    
    // ============ Core Functions ============
    
    /// @notice Calculate state root from entries
    /// @param entries Array of state entries
    /// @return root Computed state root
    function calculateStateRoot(
        StateEntry[] calldata entries
    ) external pure returns (bytes32 root);
    
    /// @notice Verify inclusion proof
    /// @param leaf Leaf value to verify
    /// @param index Leaf index in tree
    /// @param siblings Sibling hashes for proof
    /// @param root Expected root hash
    /// @return valid True if proof is valid
    function verifyInclusion(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings,
        bytes32 root
    ) external pure returns (bool valid);
    
    /// @notice Verify inclusion with proof struct
    /// @param proof Merkle proof structure
    /// @param root Expected root hash
    /// @return valid True if proof is valid
    function verifyInclusionProof(
        MerkleProof calldata proof,
        bytes32 root
    ) external pure returns (bool valid);
    
    /// @notice Compute leaf hash from key-value pair
    /// @param key State key
    /// @param value State value
    /// @return leaf Computed leaf hash
    function computeLeaf(
        bytes32 key,
        bytes32 value
    ) external pure returns (bytes32 leaf);
    
    /// @notice Compute root from single leaf and proof
    /// @param leaf Leaf value
    /// @param index Leaf index
    /// @param siblings Sibling hashes
    /// @return root Computed root hash
    function computeRoot(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings
    ) external pure returns (bytes32 root);
    
    // ============ Hash Functions ============
    
    /// @notice Hash two nodes (SHA3-256 with domain separation)
    /// @param left Left child hash
    /// @param right Right child hash
    /// @return parent Parent hash
    function hashNodes(
        bytes32 left,
        bytes32 right
    ) external pure returns (bytes32 parent);
    
    /// @notice Get empty leaf hash (SHA3-256 of empty bytes)
    /// @return Empty leaf hash constant
    function getEmptyLeaf() external pure returns (bytes32);
    
    /// @notice Get empty tree root
    /// @return Empty tree root hash
    function getEmptyRoot() external pure returns (bytes32);
    
    // ============ Verification ============
    
    /// @notice Verify SHA3-256 implementation correctness
    /// @return valid True if NIST test vector passes
    function verifySHA3Implementation() external pure returns (bool valid);
    
    /// @notice Get hash function info
    /// @return hashFunction Name of hash function
    /// @return fipsCompliant FIPS 202 compliance status
    function getHashInfo() external pure returns (
        string memory hashFunction,
        bool fipsCompliant
    );
}
