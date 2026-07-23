// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SHAKE256} from "./libraries/SHAKE256.sol";
import {SHA3_256} from "./libraries/SHA3_256.sol";

/// @title SPHINCSVerifier - SPHINCS+-SHAKE-128s Signature Verifier
/// @notice Phase 1 implementation of SPHINCS+ signature verification
/// @dev Implements SPHINCS+-SHAKE-128s (NIST FIPS 205) for quantum-resistant signatures
///
/// SHAKE Migration (Day 13 - CEO Decision):
/// - All internal hashing: SHAKE256 (replaces SHA-256)
/// - Public key hashing: SHA3-256 (replaces keccak256)
/// - Core Principles CP-1 compliance: No SHA-256 or keccak256
///
/// SPHINCS+ Architecture Overview:
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │                    SPHINCS+ Signature Structure                     │
/// ├─────────────────────────────────────────────────────────────────────┤
/// │  Randomness R (16 bytes)                                            │
/// │  ├── FORS Signature (FORS_TREES × FORS_HEIGHT × 32 bytes)          │
/// │  │   └── Few-Time Signature for message hash                       │
/// │  └── Hypertree Signature (d layers)                                │
/// │      └── WOTS+ signatures + authentication paths                    │
/// └─────────────────────────────────────────────────────────────────────┘
///
/// Security Level: 128-bit post-quantum (NIST Level 1)
/// Signature Size: ~7,856 bytes (SPHINCS+-SHAKE-128s)
/// Public Key: 32 bytes
/// Hash Function: SHAKE256 (FIPS 202)
contract SPHINCSVerifier {
    // =========================================================================
    // Constants - SPHINCS+-SHAKE-128s Parameters (NIST FIPS 205)
    // =========================================================================

    /// @notice Security parameter n (hash output length in bytes)
    uint256 public constant N = 16;

    /// @notice Winternitz parameter (w = 16)
    uint256 public constant W = 16;

    /// @notice WOTS+ message length (len1 = 32 for n=16, w=16)
    uint256 public constant WOTS_LEN1 = 32;

    /// @notice WOTS+ checksum length (len2 = 3)
    uint256 public constant WOTS_LEN2 = 3;

    /// @notice WOTS+ total signature length (len = len1 + len2 = 35)
    uint256 public constant WOTS_LEN = 35;

    /// @notice Hypertree height
    uint256 public constant TREE_HEIGHT = 63;

    /// @notice Number of hypertree layers
    uint256 public constant D = 7;

    /// @notice Height of each subtree (h/d = 9)
    uint256 public constant SUBTREE_HEIGHT = 9;

    /// @notice FORS trees count
    uint256 public constant FORS_TREES = 14;

    /// @notice FORS tree height
    uint256 public constant FORS_HEIGHT = 12;

    /// @notice Expected signature size for SPHINCS+-SHAKE-128s
    uint256 public constant SIGNATURE_SIZE = 7856;

    /// @notice Public key size
    uint256 public constant PUBLIC_KEY_SIZE = 32;

    // =========================================================================
    // Structs
    // =========================================================================

    /// @notice Parsed SPHINCS+ public key
    struct PublicKey {
        bytes16 seed;      // Public seed (SPK.seed)
        bytes16 root;      // Root of the top tree (SPK.root)
    }

    /// @notice WOTS+ signature component
    struct WOTSSignature {
        bytes32[35] chains;  // WOTS+ chain values
    }

    /// @notice FORS signature component
    struct FORSSignature {
        bytes16[14] privateKeys;     // FORS private key values
        bytes32[14][12] authPaths;   // Authentication paths for each tree
    }

    /// @notice Verification result with detailed status
    struct VerificationResult {
        bool valid;
        bytes32 computedRoot;
        uint256 gasUsed;
        string errorReason;
    }

    // =========================================================================
    // Events
    // =========================================================================

    event SignatureVerified(
        bytes32 indexed messageHash,
        bytes32 indexed pubKeyHash,
        bool valid
    );

    event BatchVerified(
        uint256 indexed batchSize,
        uint256 validCount,
        uint256 totalGas
    );

    // =========================================================================
    // Errors
    // =========================================================================

    error InvalidSignatureLength();
    error InvalidPublicKeyLength();
    error InvalidMessageLength();
    error VerificationFailed(string reason);
    error BatchSizeMismatch();
    error BatchTooLarge();

    // =========================================================================
    // Main Verification Functions
    // =========================================================================

    /// @notice Verify a single SPHINCS+ signature
    /// @param message The message that was signed (32 bytes hash)
    /// @param signature The SPHINCS+ signature
    /// @param publicKey The SPHINCS+ public key (32 bytes)
    /// @return valid True if signature is valid
    function verify(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external pure returns (bool valid) {
        // Validate input lengths
        if (signature.length != SIGNATURE_SIZE) revert InvalidSignatureLength();
        if (publicKey.length != PUBLIC_KEY_SIZE) revert InvalidPublicKeyLength();

        // Parse public key
        PublicKey memory pk = _parsePublicKey(publicKey);

        // Compute message digest with randomness
        bytes16 R = bytes16(signature[0:16]);
        bytes32 digest = _computeDigest(R, pk.seed, pk.root, message);

        // Verify FORS signature
        bytes32 forsRoot = _verifyFORS(digest, signature[16:], pk.seed);

        // Verify hypertree signature (digest carries the tree/leaf position)
        bytes32 computedRoot = _verifyHypertree(forsRoot, digest, signature, pk.seed);

        // Compare with public key root
        valid = (bytes16(computedRoot) == pk.root);
    }

    /// @notice Verify multiple SPHINCS+ signatures in batch (gas optimized)
    /// @param messages Array of message hashes
    /// @param signatures Array of signatures
    /// @param publicKeys Array of public keys
    /// @return validCount Number of valid signatures
    function verifyBatch(
        bytes32[] calldata messages,
        bytes[] calldata signatures,
        bytes[] calldata publicKeys
    ) external returns (uint256 validCount) {
        if (messages.length != signatures.length || 
            signatures.length != publicKeys.length) {
            revert BatchSizeMismatch();
        }
        if (messages.length > 10) revert BatchTooLarge();

        uint256 startGas = gasleft();

        for (uint256 i = 0; i < messages.length; i++) {
            if (_verifyInternal(messages[i], signatures[i], publicKeys[i])) {
                validCount++;
            }
        }

        emit BatchVerified(messages.length, validCount, startGas - gasleft());
    }

    /// @notice Verify signature and return detailed result
    /// @param message The message hash
    /// @param signature The SPHINCS+ signature
    /// @param publicKey The SPHINCS+ public key
    /// @return result Detailed verification result
    function verifyWithDetails(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (VerificationResult memory result) {
        uint256 startGas = gasleft();

        if (signature.length != SIGNATURE_SIZE) {
            result.valid = false;
            result.errorReason = "Invalid signature length";
            result.gasUsed = startGas - gasleft();
            return result;
        }

        if (publicKey.length != PUBLIC_KEY_SIZE) {
            result.valid = false;
            result.errorReason = "Invalid public key length";
            result.gasUsed = startGas - gasleft();
            return result;
        }

        result.valid = _verifyInternal(message, signature, publicKey);
        result.gasUsed = startGas - gasleft();

        if (!result.valid) {
            result.errorReason = "Signature verification failed";
        }
    }

    // =========================================================================
    // Internal Verification Logic
    // =========================================================================

    /// @notice Internal verification without length checks
    function _verifyInternal(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) internal pure returns (bool) {
        PublicKey memory pk = _parsePublicKey(publicKey);

        bytes16 R = bytes16(signature[0:16]);
        bytes32 digest = _computeDigest(R, pk.seed, pk.root, message);

        bytes32 forsRoot = _verifyFORS(digest, signature[16:], pk.seed);
        bytes32 computedRoot = _verifyHypertree(forsRoot, digest, signature, pk.seed);

        return (bytes16(computedRoot) == pk.root);
    }

    /// @notice Parse SPHINCS+ public key
    function _parsePublicKey(bytes calldata pk) 
        internal 
        pure 
        returns (PublicKey memory) 
    {
        return PublicKey({
            seed: bytes16(pk[0:16]),
            root: bytes16(pk[16:32])
        });
    }

    /// @notice Compute message digest H_msg(R, PK.seed, PK.root, M)
    /// @dev Uses SHAKE256 per FIPS 205 SPHINCS+-SHAKE-128s
    function _computeDigest(
        bytes16 R,
        bytes16 seed,
        bytes16 root,
        bytes32 message
    ) internal pure returns (bytes32) {
        // SHAKE256 based message hashing per FIPS 205 (SHAKE variant)
        return SHAKE256.hash256(abi.encodePacked(
            bytes1(0x00),  // Domain separator for H_msg
            R,
            seed,
            root,
            message
        ));
    }

    /// @notice Verify FORS (Forest of Random Subsets) signature
    /// @dev FORS provides the few-time signature for the message hash
    function _verifyFORS(
        bytes32 digest,
        bytes calldata forsSignature,
        bytes16 seed
    ) internal pure returns (bytes32 forsRoot) {
        // Extract FORS indices from digest
        uint256[14] memory indices = _extractFORSIndices(digest);

        // Verify each FORS tree
        bytes32[14] memory roots;
        uint256 offset = 0;

        for (uint256 i = 0; i < FORS_TREES; i++) {
            // Get private key value
            bytes16 skValue = bytes16(forsSignature[offset:offset + 16]);
            offset += 16;

            // Get authentication path
            bytes32[12] memory authPath;
            for (uint256 j = 0; j < FORS_HEIGHT; j++) {
                authPath[j] = bytes32(forsSignature[offset:offset + 32]);
                offset += 32;
            }

            // Compute tree root
            roots[i] = _computeFORSTreeRoot(
                skValue,
                indices[i],
                authPath,
                seed,
                i
            );
        }

        // Combine FORS roots into single commitment
        forsRoot = _hashFORSRoots(roots, seed);
    }

    /// @notice Verify Hypertree signature (d layers of XMSS trees)
    /// @dev Derives the hypertree position (idx_tree, idx_leaf) from the message
    ///      digest per FIPS 205 (H_msg output split md || idx_tree || idx_leaf).
    ///      idx_leaf addresses the leaf in the bottom subtree; each higher layer
    ///      consumes SUBTREE_HEIGHT bits of idx_tree for its own leaf position.
    function _verifyHypertree(
        bytes32 forsRoot,
        bytes32 digest,
        bytes calldata signature,
        bytes16 seed
    ) internal pure returns (bytes32 root) {
        root = forsRoot;

        (uint256 idxTree, uint256 idxLeaf) = _extractTreeIndices(digest);

        // Skip FORS signature portion
        uint256 offset = 16 + (FORS_TREES * (16 + FORS_HEIGHT * 32));

        // Verify each hypertree layer
        for (uint256 layer = 0; layer < D; layer++) {
            // Extract WOTS+ signature
            bytes32[35] memory wotsChains;
            for (uint256 i = 0; i < WOTS_LEN; i++) {
                wotsChains[i] = bytes32(signature[offset:offset + 32]);
                offset += 32;
            }

            // Extract authentication path
            bytes32[9] memory authPath;
            for (uint256 i = 0; i < SUBTREE_HEIGHT; i++) {
                authPath[i] = bytes32(signature[offset:offset + 32]);
                offset += 32;
            }

            // Leaf index within this layer's subtree. Layer 0 uses idx_leaf; each
            // higher layer consumes the low SUBTREE_HEIGHT bits of the tree index.
            uint256 leafIdx;
            if (layer == 0) {
                leafIdx = idxLeaf;
            } else {
                leafIdx = idxTree & ((uint256(1) << SUBTREE_HEIGHT) - 1);
                idxTree >>= SUBTREE_HEIGHT;
            }

            // Verify WOTS+ and climb the tree using the leaf position
            root = _verifyXMSSLayer(root, wotsChains, authPath, seed, layer, leafIdx);
        }
    }

    /// @notice Extract FORS indices from message digest
    function _extractFORSIndices(bytes32 digest) 
        internal 
        pure 
        returns (uint256[14] memory indices) 
    {
        // Each FORS tree uses log2(2^12) = 12 bits of the digest
        for (uint256 i = 0; i < FORS_TREES; i++) {
            uint256 bitOffset = i * FORS_HEIGHT;
            uint256 byteOffset = bitOffset / 8;
            uint256 bitShift = bitOffset % 8;

            // Extract 12-bit index
            uint256 rawValue;
            if (byteOffset + 1 < 32) {
                rawValue = (uint256(uint8(digest[byteOffset])) << 8) | 
                           uint256(uint8(digest[byteOffset + 1]));
            } else {
                rawValue = uint256(uint8(digest[byteOffset])) << 8;
            }

            indices[i] = (rawValue >> (16 - FORS_HEIGHT - bitShift)) & 
                         ((1 << FORS_HEIGHT) - 1);
        }
    }

    /// @notice Extract hypertree tree/leaf indices from the message digest
    /// @dev FIPS 205 splits the H_msg output as md || idx_tree || idx_leaf. FORS
    ///      consumes the leading ceil(k*a/8) = 21 bytes; the tree index
    ///      (h - h/d = 54 bits) and the leaf index (h/d = 9 bits) follow.
    function _extractTreeIndices(bytes32 digest)
        internal
        pure
        returns (uint256 idxTree, uint256 idxLeaf)
    {
        // idx_tree: 7 bytes after the FORS index region (bytes 21..27), 54-bit mask
        uint256 t = 0;
        for (uint256 i = 21; i < 28; i++) {
            t = (t << 8) | uint256(uint8(digest[i]));
        }
        idxTree = t & ((uint256(1) << (TREE_HEIGHT - SUBTREE_HEIGHT)) - 1);

        // idx_leaf: next 2 bytes (bytes 28..29), SUBTREE_HEIGHT-bit mask
        uint256 l = (uint256(uint8(digest[28])) << 8) | uint256(uint8(digest[29]));
        idxLeaf = l & ((uint256(1) << SUBTREE_HEIGHT) - 1);
    }

    /// @notice Compute FORS tree root from leaf and authentication path
    /// @dev Uses SHAKE256 for all hashing operations
    function _computeFORSTreeRoot(
        bytes16 skValue,
        uint256 leafIndex,
        bytes32[12] memory authPath,
        bytes16 seed,
        uint256 treeIndex
    ) internal pure returns (bytes32 root) {
        // Hash private key to get leaf using SHAKE256
        bytes32 node = SHAKE256.hash256(abi.encodePacked(
            bytes1(0x01),  // Domain separator for F
            seed,
            uint32(treeIndex),
            uint32(leafIndex),
            skValue
        ));

        // Climb the tree using authentication path
        uint256 idx = leafIndex;
        for (uint256 height = 0; height < FORS_HEIGHT; height++) {
            bytes32 sibling = authPath[height];

            if (idx & 1 == 0) {
                // Current node is left child
                node = SHAKE256.hash256(abi.encodePacked(
                    bytes1(0x02),  // Domain separator for H
                    seed,
                    uint32(treeIndex),
                    uint32(height),
                    node,
                    sibling
                ));
            } else {
                // Current node is right child
                node = SHAKE256.hash256(abi.encodePacked(
                    bytes1(0x02),
                    seed,
                    uint32(treeIndex),
                    uint32(height),
                    sibling,
                    node
                ));
            }

            idx >>= 1;
        }

        root = node;
    }

    /// @notice Hash all FORS roots into a single commitment
    /// @dev Uses SHAKE256 for combining FORS roots
    function _hashFORSRoots(
        bytes32[14] memory roots,
        bytes16 seed
    ) internal pure returns (bytes32) {
        bytes memory packed = abi.encodePacked(bytes1(0x03), seed);
        for (uint256 i = 0; i < FORS_TREES; i++) {
            packed = abi.encodePacked(packed, roots[i]);
        }
        return SHAKE256.hash256(packed);
    }

    /// @notice Verify XMSS layer (WOTS+ signature + Merkle path)
    function _verifyXMSSLayer(
        bytes32 message,
        bytes32[35] memory wotsChains,
        bytes32[9] memory authPath,
        bytes16 seed,
        uint256 layer,
        uint256 leafIndex
    ) internal pure returns (bytes32 root) {
        // Convert message to WOTS+ checksum
        uint256[35] memory chainLengths = _computeWOTSChecksum(message);

        // Verify each WOTS+ chain (bound to this leaf's key-pair position)
        bytes32[35] memory publicKeyChunks;
        for (uint256 i = 0; i < WOTS_LEN; i++) {
            publicKeyChunks[i] = _computeWOTSChain(
                wotsChains[i],
                chainLengths[i],
                W - 1 - chainLengths[i],
                seed,
                layer,
                leafIndex,
                i
            );
        }

        // Compress WOTS+ public key to the leaf node at this position
        bytes32 wotsPublicKey = _compressWOTSPublicKey(publicKeyChunks, seed, layer, leafIndex);

        // Climb the Merkle tree using the leaf position
        root = _climbMerkleTree(wotsPublicKey, authPath, seed, layer, leafIndex);
    }

    /// @notice Compute WOTS+ checksum from message
    /// @dev For SPHINCS+-SHAKE-128s: n=16, w=16, len1=32, len2=3, len=35
    function _computeWOTSChecksum(bytes32 message) 
        internal 
        pure 
        returns (uint256[35] memory lengths) 
    {
        uint256 checksum = 0;

        // Extract base-16 digits from message (len1 = 32 nibbles from first 16 bytes)
        // For n=16 bytes, we process 16 bytes = 32 nibbles
        for (uint256 i = 0; i < N; i++) {
            uint8 byte_val = uint8(message[i]);
            uint256 highNibble = byte_val >> 4;
            uint256 lowNibble = byte_val & 0x0F;
            
            lengths[i * 2] = highNibble;
            lengths[i * 2 + 1] = lowNibble;
            
            checksum += (W - 1) - highNibble;
            checksum += (W - 1) - lowNibble;
        }

        // Append checksum (len2 = 3 chunks for w=16)
        // checksum fits in 12 bits max (32 * 15 = 480 < 4096)
        lengths[32] = (checksum >> 8) & 0x0F;
        lengths[33] = (checksum >> 4) & 0x0F;
        lengths[34] = checksum & 0x0F;
    }

    /// @notice Compute WOTS+ chain value
    /// @dev Uses SHAKE256 for chain hashing
    function _computeWOTSChain(
        bytes32 start,
        uint256 startIndex,
        uint256 steps,
        bytes16 seed,
        uint256 layer,
        uint256 keyPairIndex,
        uint256 chainIndex
    ) internal pure returns (bytes32 result) {
        result = start;
        for (uint256 i = 0; i < steps; i++) {
            result = SHAKE256.hash256(abi.encodePacked(
                bytes1(0x04),  // Domain separator for F
                seed,
                uint32(layer),
                uint32(keyPairIndex),  // leaf position binds this chain to its tree slot
                uint32(chainIndex),
                uint32(startIndex + i),
                result
            ));
        }
    }

    /// @notice Compress WOTS+ public key chunks into single hash
    /// @dev Uses SHAKE256 for compression
    function _compressWOTSPublicKey(
        bytes32[35] memory chunks,
        bytes16 seed,
        uint256 layer,
        uint256 keyPairIndex
    ) internal pure returns (bytes32) {
        bytes memory packed = abi.encodePacked(
            bytes1(0x05), seed, uint32(layer), uint32(keyPairIndex)
        );
        for (uint256 i = 0; i < WOTS_LEN; i++) {
            packed = abi.encodePacked(packed, chunks[i]);
        }
        return SHAKE256.hash256(packed);
    }

    /// @notice Climb Merkle tree using authentication path
    /// @dev Orders each hash by the leaf-index bit at the current height so the
    ///      path binds to the leaf's position (mirrors _computeFORSTreeRoot). The
    ///      node index is folded into the ADRS so sibling positions are addressed.
    function _climbMerkleTree(
        bytes32 leaf,
        bytes32[9] memory authPath,
        bytes16 seed,
        uint256 layer,
        uint256 leafIndex
    ) internal pure returns (bytes32 root) {
        root = leaf;
        uint256 idx = leafIndex;
        for (uint256 height = 0; height < SUBTREE_HEIGHT; height++) {
            bytes32 sibling = authPath[height];
            uint256 nodeIndex = idx >> 1;

            if (idx & 1 == 0) {
                // Current node is the left child
                root = SHAKE256.hash256(abi.encodePacked(
                    bytes1(0x06),
                    seed,
                    uint32(layer),
                    uint32(height),
                    uint32(nodeIndex),
                    root,
                    sibling
                ));
            } else {
                // Current node is the right child
                root = SHAKE256.hash256(abi.encodePacked(
                    bytes1(0x06),
                    seed,
                    uint32(layer),
                    uint32(height),
                    uint32(nodeIndex),
                    sibling,
                    root
                ));
            }

            idx >>= 1;
        }
    }

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /// @notice Compute hash of public key for storage/comparison
    /// @dev Uses SHA3-256 (NOT keccak256) per CP-1 compliance
    function computePublicKeyHash(bytes calldata publicKey) 
        external 
        pure 
        returns (bytes32) 
    {
        if (publicKey.length != PUBLIC_KEY_SIZE) revert InvalidPublicKeyLength();
        return SHA3_256.hash(publicKey);
    }

    /// @notice Check if this is a valid SPHINCS+ public key format
    function isValidPublicKeyFormat(bytes calldata publicKey) 
        external 
        pure 
        returns (bool) 
    {
        return publicKey.length == PUBLIC_KEY_SIZE;
    }

    /// @notice Get expected signature size
    function getSignatureSize() external pure returns (uint256) {
        return SIGNATURE_SIZE;
    }

    // === ISignatureVerifier conformance (QS crypto-agility, Move 2) ===

    /// @notice Stable scheme identifier: "SLH1" = SLH-DSA-SHAKE-128s.
    /// @dev Lets SchemeRegistry.setVerifier bind this verifier to the correct schemeId.
    function schemeId() external pure returns (bytes4) {
        return 0x534c4831; // bytes4("SLH1")
    }

    /// @notice Expected SPHINCS+ public-key length in bytes.
    function expectedPubKeyLen() external pure returns (uint256) {
        return 32;
    }

    /// @notice Check if this contract supports SPHINCS+ verification
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        // ISPHINCSVerifier interface ID
        return interfaceId == 0x7f5c4e5a;
    }
}
