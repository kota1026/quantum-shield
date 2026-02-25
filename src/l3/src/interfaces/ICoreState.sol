// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ICoreState
/// @notice Interface for Core Layer State Management
/// @dev Part of Quantum Shield's Modular Architecture (MODULAR_ARCHITECTURE.md §3.3)
/// @dev Integrates Phase 2 SparseMerkleTree and SHA3-256 (FIPS 202)
/// @custom:security-contact security@quantumshield.io
interface ICoreState {
    // ============ Structs ============
    
    /// @notice State entry structure for key-value state management
    /// @param key State key (bytes32)
    /// @param value State value (bytes32)
    struct StateEntry {
        bytes32 key;
        bytes32 value;
    }

    /// @notice Lock data structure for Merkle tree leaves
    /// @param lockId Unique lock identifier
    /// @param amount Locked amount in wei
    /// @param recipient Recipient address
    /// @param pubKeyHash Hash of Dilithium public key
    struct LockData {
        bytes32 lockId;
        uint256 amount;
        address recipient;
        bytes32 pubKeyHash;
    }

    // ============ Events ============
    
    /// @notice Emitted when state root is updated
    /// @param oldRoot Previous state root
    /// @param newRoot New state root
    /// @param timestamp Block timestamp
    event StateRootUpdated(
        bytes32 indexed oldRoot,
        bytes32 indexed newRoot,
        uint256 timestamp
    );

    /// @notice Emitted when inclusion is verified
    /// @param leaf Verified leaf hash
    /// @param root State root used for verification
    /// @param verified Verification result
    event InclusionVerified(
        bytes32 indexed leaf,
        bytes32 indexed root,
        bool verified
    );

    // ============ Errors ============
    
    /// @notice Thrown when proof length is invalid
    error InvalidProofLength(uint256 expected, uint256 actual);

    /// @notice Thrown when leaf index exceeds maximum
    error IndexOutOfBounds(uint256 index, uint256 maxIndex);

    /// @notice Thrown when state entries array is empty
    error EmptyStateEntries();

    /// @notice Thrown when state root verification fails
    error StateRootMismatch(bytes32 expected, bytes32 actual);

    // ============ Constants ============
    
    /// @notice State version for upgrade compatibility
    /// @return Version number (1 for initial release)
    function STATE_VERSION() external pure returns (uint256);

    /// @notice Tree depth for Sparse Merkle Tree
    /// @return Depth (20 for 2^20 leaves)
    function TREE_DEPTH() external pure returns (uint256);

    /// @notice Maximum leaf index
    /// @return Max index (2^20 - 1)
    function MAX_LEAF_INDEX() external pure returns (uint256);

    /// @notice Empty leaf hash (SHA3-256 of empty bytes)
    /// @return Hash 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
    function EMPTY_LEAF_HASH() external pure returns (bytes32);

    // ============ Core State Functions ============
    
    /// @notice Calculate state root from state entries using SHA3-256
    /// @dev Uses domain-separated hashing for security
    /// @param entries Array of state entries
    /// @return root Calculated state root (bytes32)
    function calculateStateRoot(StateEntry[] calldata entries) external pure returns (bytes32 root);

    /// @notice Verify inclusion proof in Sparse Merkle Tree
    /// @dev Uses SHA3-256 (FIPS 202) for node hashing
    /// @param leaf Leaf value to verify
    /// @param index Leaf index in the tree
    /// @param siblings Array of sibling hashes (length = TREE_DEPTH)
    /// @param root Expected root hash
    /// @return valid True if proof is valid
    function verifyInclusion(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings,
        bytes32 root
    ) external pure returns (bool valid);

    /// @notice Compute root from leaf and proof
    /// @param leaf Leaf value
    /// @param index Leaf index
    /// @param siblings Array of sibling hashes
    /// @return root Computed root hash
    function computeRoot(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings
    ) external pure returns (bytes32 root);

    // ============ Leaf Computation ============

    /// @notice Compute leaf hash from lock data
    /// @dev Uses domain-separated SHA3-256 hashing
    /// @param lockId Unique lock identifier
    /// @param amount Locked amount
    /// @param recipient Recipient address
    /// @param pubKeyHash Hash of Dilithium public key
    /// @return leaf Computed leaf hash
    function computeLeaf(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash
    ) external pure returns (bytes32 leaf);

    /// @notice Get leaf index from lock ID
    /// @param lockId Lock identifier
    /// @return index Leaf index (mod 2^20)
    function getLeafIndex(bytes32 lockId) external pure returns (uint256 index);

    // ============ Hash Functions ============

    /// @notice Hash two nodes using SHA3-256 with domain separation
    /// @param left Left child hash
    /// @param right Right child hash
    /// @return parent Parent node hash
    function hashNodes(bytes32 left, bytes32 right) external pure returns (bytes32 parent);

    /// @notice Hash arbitrary data using SHA3-256
    /// @param data Data to hash
    /// @return digest SHA3-256 hash
    function sha3Hash(bytes calldata data) external pure returns (bytes32 digest);

    // ============ Utility Functions ============

    /// @notice Get default hash for empty subtree at given height
    /// @param height Height of subtree (0 = leaf level)
    /// @return defaultHash Default hash at that height
    function getDefaultHash(uint256 height) external pure returns (bytes32 defaultHash);

    /// @notice Get empty tree root (all leaves empty)
    /// @return root Empty tree root
    function getEmptyRoot() external pure returns (bytes32 root);

    /// @notice Verify lock inclusion with data
    /// @param lockId Lock identifier
    /// @param amount Locked amount
    /// @param recipient Recipient address
    /// @param pubKeyHash Public key hash
    /// @param siblings Proof siblings
    /// @param root Expected root
    /// @return valid True if lock is included
    function verifyLockInclusion(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash,
        bytes32[] calldata siblings,
        bytes32 root
    ) external pure returns (bool valid);

    // ============ Hash Function Info ============

    /// @notice Get hash function information
    /// @return hashFunction Name of hash function ("SHA3-256")
    /// @return fipsCompliant FIPS 202 compliance status (true)
    function getHashInfo() external pure returns (string memory hashFunction, bool fipsCompliant);

    /// @notice Verify SHA3-256 implementation correctness
    /// @return valid True if NIST test vector passes
    function verifySHA3Implementation() external pure returns (bool valid);
}
