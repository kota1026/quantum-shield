// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ProofCompressor} from "../src/lib/ProofCompressor.sol";
import {ProofDecoder} from "../src/lib/ProofDecoder.sol";
import {BatchVerifier} from "../src/BatchVerifier.sol";
import {SharedMerkle} from "../src/lib/SharedMerkle.sol";
import {SHA3Hasher} from "../src/libraries/SHA3Hasher.sol";

/**
 * @title CompressionIntegrationTest
 * @author Quantum Shield Team
 * @notice Integration tests for compression with BatchVerifier [TEST-028]
 * @dev Verifies end-to-end flow: compress -> store -> decompress -> verify
 */
contract CompressionIntegrationTest is Test {
    using SHA3Hasher for bytes;

    ProofCompressor public compressor;
    ProofDecoder public decoder;
    SharedMerkle public sharedMerkle;
    BatchVerifier public batchVerifier;

    uint256 constant TEST_DEPTH = 8;

    function setUp() public {
        compressor = new ProofCompressor();
        decoder = new ProofDecoder(address(compressor));
        sharedMerkle = new SharedMerkle();
        batchVerifier = new BatchVerifier(address(sharedMerkle));
    }

    // =========================================================================
    // End-to-End Integration Tests
    // =========================================================================

    function test_Integration_CompressDecompressVerify() public {
        // Setup: Create valid proof data
        (bytes32[] memory leaves, uint256[] memory indices, bytes32[][] memory siblings, bytes32 root) 
            = _createValidProofBatch(5);
        
        // Step 1: Compress the Merkle paths
        bytes[] memory compressedPaths = new bytes[](leaves.length);
        for (uint256 i = 0; i < leaves.length; i++) {
            compressedPaths[i] = compressor.compressMerklePath(siblings[i]);
        }
        
        // Step 2: Decompress
        bytes32[][] memory decompressedSiblings = new bytes32[][](leaves.length);
        for (uint256 i = 0; i < leaves.length; i++) {
            decompressedSiblings[i] = decoder.decompressMerklePath(compressedPaths[i]);
        }
        
        // Step 3: Verify with BatchVerifier
        uint256 validCount = batchVerifier.verifyBatch(leaves, indices, decompressedSiblings, root);
        
        assertEq(validCount, leaves.length, "All decompressed proofs should be valid");
    }

    function test_Integration_CompressedProofStorage() public {
        // Simulate storing compressed proofs on-chain
        ProofCompressor.UncompressedProof memory proof = _createTestProof();
        
        bytes memory compressed = compressor.compressSTARKProof(proof);
        
        // Store in mapping simulation
        bytes32 proofId = keccak256(abi.encodePacked(proof.traceCommitment, proof.constraintCommitment));
        
        // Retrieve and decompress
        ProofCompressor.UncompressedProof memory recovered = decoder.decompressSTARKProof(compressed);
        
        // Verify integrity
        assertEq(recovered.traceCommitment, proof.traceCommitment);
        assertEq(recovered.constraintCommitment, proof.constraintCommitment);
    }

    function test_Integration_BatchCompressVerify() public {
        uint256 batchSize = 10;
        
        // Create batch of valid proofs
        (bytes32[] memory leaves, uint256[] memory indices, bytes32[][] memory siblings, bytes32 root) 
            = _createValidProofBatch(batchSize);
        
        // Compress all paths
        bytes[] memory compressedBatch = new bytes[](batchSize);
        uint256 totalOriginalSize = 0;
        uint256 totalCompressedSize = 0;
        
        for (uint256 i = 0; i < batchSize; i++) {
            totalOriginalSize += siblings[i].length * 32;
            compressedBatch[i] = compressor.compressMerklePath(siblings[i]);
            totalCompressedSize += compressedBatch[i].length;
        }
        
        console.log("Batch original size:", totalOriginalSize);
        console.log("Batch compressed size:", totalCompressedSize);
        
        // Decompress and verify
        bytes32[][] memory decompressedBatch = new bytes32[][](batchSize);
        for (uint256 i = 0; i < batchSize; i++) {
            decompressedBatch[i] = decoder.decompressMerklePath(compressedBatch[i]);
        }
        
        uint256 validCount = batchVerifier.verifyBatch(leaves, indices, decompressedBatch, root);
        assertEq(validCount, batchSize, "All batch proofs should verify after compression roundtrip");
    }

    // =========================================================================
    // SharedMerkle Integration Tests
    // =========================================================================

    function test_Integration_SharedMerkleCompression() public {
        // Create evaluations for SharedMerkle
        uint256[] memory evaluations = new uint256[](16);
        for (uint256 i = 0; i < 16; i++) {
            evaluations[i] = uint256(keccak256(abi.encodePacked("eval", i)));
        }
        
        // Compute root using SharedMerkle
        bytes32 root = sharedMerkle.computeRoot(evaluations);
        assertTrue(root != bytes32(0), "Root should not be zero");
        
        // Create and verify a proof
        bytes32 leaf = sharedMerkle.computeLeaf(evaluations[0], 0);
        bytes32[] memory siblings = _generateSiblingsForIndex(evaluations, 0);
        
        // Compress the proof
        bytes memory compressed = compressor.compressMerklePath(siblings);
        
        // Decompress and verify
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        bool valid = sharedMerkle.verifyProof(leaf, 0, decompressed, root);
        assertTrue(valid, "Compressed/decompressed proof should verify");
    }

    function test_Integration_CompressionWithPathSharing() public {
        // Test that compression works with SharedMerkle's path sharing optimization
        uint256 batchSize = 5;
        
        (bytes32[] memory leaves, uint256[] memory indices, bytes32[][] memory siblings, bytes32 root) 
            = _createValidProofBatch(batchSize);
        
        // Verify without compression first
        uint256 validOriginal = sharedMerkle.verifyBatchProofs(leaves, indices, siblings, root);
        
        // Compress, decompress, then verify
        bytes32[][] memory roundtrippedSiblings = new bytes32[][](batchSize);
        for (uint256 i = 0; i < batchSize; i++) {
            bytes memory compressed = compressor.compressMerklePath(siblings[i]);
            roundtrippedSiblings[i] = decoder.decompressMerklePath(compressed);
        }
        
        uint256 validAfterCompression = sharedMerkle.verifyBatchProofs(leaves, indices, roundtrippedSiblings, root);
        
        assertEq(validAfterCompression, validOriginal, "Compression should not affect verification results");
    }

    // =========================================================================
    // Error Handling Integration Tests
    // =========================================================================

    function test_Integration_InvalidCompressedData() public {
        // Corrupt compressed data
        bytes memory corrupted = hex"deadbeef";
        
        vm.expectRevert();
        decoder.decompressMerklePath(corrupted);
    }

    function test_Integration_TruncatedCompressedData() public {
        bytes32[] memory siblings = _createTestSiblings(TEST_DEPTH);
        bytes memory compressed = compressor.compressMerklePath(siblings);
        
        // Truncate the compressed data
        bytes memory truncated = new bytes(compressed.length / 2);
        for (uint256 i = 0; i < truncated.length; i++) {
            truncated[i] = compressed[i];
        }
        
        vm.expectRevert();
        decoder.decompressMerklePath(truncated);
    }

    // =========================================================================
    // Gas Optimization Integration Tests
    // =========================================================================

    function test_Integration_GasSavingsWithCompression() public {
        uint256 batchSize = 10;
        
        (bytes32[] memory leaves, uint256[] memory indices, bytes32[][] memory siblings, bytes32 root) 
            = _createValidProofBatch(batchSize);
        
        // Measure gas without compression
        uint256 gasWithoutCompression;
        {
            uint256 gasBefore = gasleft();
            batchVerifier.verifyBatch(leaves, indices, siblings, root);
            gasWithoutCompression = gasBefore - gasleft();
        }
        
        // Compress and decompress
        bytes32[][] memory roundtrippedSiblings = new bytes32[][](batchSize);
        uint256 compressionGas;
        uint256 decompressionGas;
        
        {
            uint256 gasBefore = gasleft();
            for (uint256 i = 0; i < batchSize; i++) {
                compressor.compressMerklePath(siblings[i]);
            }
            compressionGas = gasBefore - gasleft();
        }
        
        bytes[] memory compressedPaths = new bytes[](batchSize);
        for (uint256 i = 0; i < batchSize; i++) {
            compressedPaths[i] = compressor.compressMerklePath(siblings[i]);
        }
        
        {
            uint256 gasBefore = gasleft();
            for (uint256 i = 0; i < batchSize; i++) {
                roundtrippedSiblings[i] = decoder.decompressMerklePath(compressedPaths[i]);
            }
            decompressionGas = gasBefore - gasleft();
        }
        
        // Verify after roundtrip
        uint256 gasAfterCompression;
        {
            uint256 gasBefore = gasleft();
            batchVerifier.verifyBatch(leaves, indices, roundtrippedSiblings, root);
            gasAfterCompression = gasBefore - gasleft();
        }
        
        console.log("=== Gas Integration Analysis ===");
        console.log("Verification gas (no compression):", gasWithoutCompression);
        console.log("Compression gas:", compressionGas);
        console.log("Decompression gas:", decompressionGas);
        console.log("Verification gas (with roundtrip):", gasAfterCompression);
        
        // Verification should be same (paths are identical after roundtrip)
        assertEq(gasAfterCompression, gasWithoutCompression, "Verification cost should be same");
    }

    // =========================================================================
    // Version Compatibility Tests
    // =========================================================================

    function test_Integration_VersionCompatibility() public view {
        (string memory compressorName, string memory compressorVersion) = compressor.getVersion();
        (string memory decoderName, string memory decoderVersion) = decoder.getVersion();
        
        // Compressor and decoder versions should match
        assertEq(compressorVersion, decoderVersion, "Version mismatch between compressor and decoder");
        
        console.log("Compressor:", compressorName, compressorVersion);
        console.log("Decoder:", decoderName, decoderVersion);
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _createValidProofBatch(uint256 count) internal view returns (
        bytes32[] memory leaves,
        uint256[] memory indices,
        bytes32[][] memory siblings,
        bytes32 root
    ) {
        // Create simple valid Merkle tree
        leaves = new bytes32[](count);
        indices = new uint256[](count);
        siblings = new bytes32[][](count);
        
        // Build tree with 2^depth leaves
        uint256 treeSize = 1 << TEST_DEPTH;
        bytes32[] memory tree = new bytes32[](treeSize);
        
        for (uint256 i = 0; i < treeSize; i++) {
            tree[i] = SHA3Hasher.hash(abi.encodePacked("leaf", i));
        }
        
        // Compute root
        root = _computeMerkleRoot(tree);
        
        // Create proofs for first 'count' leaves
        for (uint256 i = 0; i < count; i++) {
            leaves[i] = tree[i];
            indices[i] = i;
            siblings[i] = _generateSiblingsFromTree(tree, i);
        }
    }

    function _computeMerkleRoot(bytes32[] memory tree) internal view returns (bytes32) {
        bytes32[] memory layer = tree;
        
        while (layer.length > 1) {
            bytes32[] memory nextLayer = new bytes32[](layer.length / 2);
            for (uint256 i = 0; i < nextLayer.length; i++) {
                nextLayer[i] = sharedMerkle.hashPair(layer[2*i], layer[2*i+1]);
            }
            layer = nextLayer;
        }
        
        return layer[0];
    }

    function _generateSiblingsFromTree(bytes32[] memory tree, uint256 index) internal view returns (bytes32[] memory) {
        bytes32[] memory siblings = new bytes32[](TEST_DEPTH);
        bytes32[] memory layer = tree;
        uint256 idx = index;
        
        for (uint256 level = 0; level < TEST_DEPTH; level++) {
            uint256 siblingIdx = idx ^ 1; // Toggle last bit
            siblings[level] = layer[siblingIdx];
            
            // Move to next layer
            bytes32[] memory nextLayer = new bytes32[](layer.length / 2);
            for (uint256 i = 0; i < nextLayer.length; i++) {
                nextLayer[i] = sharedMerkle.hashPair(layer[2*i], layer[2*i+1]);
            }
            layer = nextLayer;
            idx = idx / 2;
        }
        
        return siblings;
    }

    function _createTestSiblings(uint256 depth) internal pure returns (bytes32[] memory) {
        bytes32[] memory siblings = new bytes32[](depth);
        for (uint256 i = 0; i < depth; i++) {
            siblings[i] = bytes32(uint256(keccak256(abi.encodePacked("sibling", i))));
        }
        return siblings;
    }

    function _createTestProof() internal pure returns (ProofCompressor.UncompressedProof memory) {
        ProofCompressor.UncompressedProof memory proof;
        proof.traceCommitment = bytes32(uint256(0x1111));
        proof.constraintCommitment = bytes32(uint256(0x2222));
        proof.friCommitments = new bytes32[](4);
        proof.traceEvaluations = new uint256[](8);
        proof.constraintEvaluations = new uint256[](4);
        return proof;
    }

    function _generateSiblingsForIndex(uint256[] memory evaluations, uint256 index) internal view returns (bytes32[] memory) {
        // Build leaf layer
        bytes32[] memory layer = new bytes32[](evaluations.length);
        for (uint256 i = 0; i < evaluations.length; i++) {
            layer[i] = sharedMerkle.computeLeaf(evaluations[i], i);
        }
        
        // Calculate depth
        uint256 depth = 0;
        uint256 size = evaluations.length;
        while (size > 1) {
            depth++;
            size = size / 2;
        }
        
        bytes32[] memory siblings = new bytes32[](depth);
        uint256 idx = index;
        
        for (uint256 level = 0; level < depth; level++) {
            uint256 siblingIdx = idx ^ 1;
            siblings[level] = layer[siblingIdx];
            
            // Compute next layer
            bytes32[] memory nextLayer = new bytes32[](layer.length / 2);
            for (uint256 i = 0; i < nextLayer.length; i++) {
                nextLayer[i] = sharedMerkle.hashPair(layer[2*i], layer[2*i+1]);
            }
            layer = nextLayer;
            idx = idx / 2;
        }
        
        return siblings;
    }
}
