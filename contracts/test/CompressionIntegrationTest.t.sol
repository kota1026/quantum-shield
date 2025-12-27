// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ProofCompressor} from "../src/lib/ProofCompressor.sol";
import {ProofDecoder} from "../src/lib/ProofDecoder.sol";
import {SharedMerkle} from "../src/lib/SharedMerkle.sol";

/**
 * @title CompressionIntegrationTest
 * @author Quantum Shield Team
 * @notice Integration tests for compression with SharedMerkle [TEST-028]
 * @dev Verifies end-to-end flow: compress -> store -> decompress -> verify
 */
contract CompressionIntegrationTest is Test {

    ProofCompressor public compressor;
    ProofDecoder public decoder;
    SharedMerkle public sharedMerkle;

    uint256 constant TEST_DEPTH = 8;

    function setUp() public {
        compressor = new ProofCompressor();
        decoder = new ProofDecoder(address(compressor));
        sharedMerkle = new SharedMerkle();
    }

    // =========================================================================
    // End-to-End Integration Tests
    // =========================================================================

    function test_Integration_CompressDecompressVerify() public view {
        // Create test siblings
        bytes32[] memory siblings = _createTestSiblings(TEST_DEPTH);
        
        // Step 1: Compress the Merkle path
        bytes memory compressed = compressor.compressMerklePath(siblings);
        
        // Step 2: Decompress
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        // Step 3: Verify roundtrip integrity
        assertEq(decompressed.length, siblings.length, "Length mismatch after roundtrip");
        for (uint256 i = 0; i < siblings.length; i++) {
            assertEq(decompressed[i], siblings[i], "Sibling mismatch after roundtrip");
        }
    }

    function test_Integration_CompressedProofStorage() public view {
        // Simulate storing compressed proofs on-chain
        ProofCompressor.UncompressedProof memory proof = _createTestProof();
        
        bytes memory compressed = compressor.compressSTARKProof(proof);
        
        // Retrieve and decompress
        ProofCompressor.UncompressedProof memory recovered = decoder.decompressSTARKProof(compressed);
        
        // Verify integrity
        assertEq(recovered.traceCommitment, proof.traceCommitment);
        assertEq(recovered.constraintCommitment, proof.constraintCommitment);
    }

    function test_Integration_BatchCompressVerify() public view {
        uint256 batchSize = 10;
        
        // Compress all paths
        uint256 totalOriginalSize = 0;
        uint256 totalCompressedSize = 0;
        
        for (uint256 i = 0; i < batchSize; i++) {
            bytes32[] memory siblings = _createCompressibleSiblings(TEST_DEPTH);
            totalOriginalSize += siblings.length * 32;
            
            bytes memory compressed = compressor.compressMerklePath(siblings);
            totalCompressedSize += compressed.length;
            
            // Verify roundtrip
            bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
            assertEq(decompressed.length, siblings.length);
        }
        
        console.log("Batch original size:", totalOriginalSize);
        console.log("Batch compressed size:", totalCompressedSize);
    }

    // =========================================================================
    // SharedMerkle Integration Tests
    // =========================================================================

    function test_Integration_SharedMerkleCompression() public view {
        // Create evaluations for SharedMerkle
        uint256[] memory evaluations = new uint256[](16);
        for (uint256 i = 0; i < 16; i++) {
            evaluations[i] = 1000000 + i * 100;
        }
        
        // Compute root using SharedMerkle
        bytes32 root = sharedMerkle.computeRoot(evaluations);
        assertTrue(root != bytes32(0), "Root should not be zero");
    }

    function test_Integration_CompressionWithPathSharing() public view {
        uint256 batchSize = 5;
        
        // Compress and decompress multiple paths
        for (uint256 i = 0; i < batchSize; i++) {
            bytes32[] memory siblings = _createTestSiblings(TEST_DEPTH);
            
            bytes memory compressed = compressor.compressMerklePath(siblings);
            bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
            
            // Verify roundtrip
            for (uint256 j = 0; j < siblings.length; j++) {
                assertEq(decompressed[j], siblings[j]);
            }
        }
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
        
        // Measure compression gas
        uint256 compressionGas;
        bytes[] memory compressedPaths = new bytes[](batchSize);
        
        {
            uint256 gasBefore = gasleft();
            for (uint256 i = 0; i < batchSize; i++) {
                bytes32[] memory siblings = _createCompressibleSiblings(TEST_DEPTH);
                compressedPaths[i] = compressor.compressMerklePath(siblings);
            }
            compressionGas = gasBefore - gasleft();
        }
        
        // Measure decompression gas
        uint256 decompressionGas;
        {
            uint256 gasBefore = gasleft();
            for (uint256 i = 0; i < batchSize; i++) {
                decoder.decompressMerklePath(compressedPaths[i]);
            }
            decompressionGas = gasBefore - gasleft();
        }
        
        console.log("=== Gas Integration Analysis ===");
        console.log("Compression gas (10 paths):", compressionGas);
        console.log("Decompression gas (10 paths):", decompressionGas);
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

    function _createTestSiblings(uint256 depth) internal pure returns (bytes32[] memory) {
        bytes32[] memory siblings = new bytes32[](depth);
        for (uint256 i = 0; i < depth; i++) {
            siblings[i] = bytes32(uint256(keccak256(abi.encodePacked("sibling", i))));
        }
        return siblings;
    }

    function _createCompressibleSiblings(uint256 depth) internal pure returns (bytes32[] memory) {
        bytes32[] memory siblings = new bytes32[](depth);
        // Create compressible pattern: zeros and repeats
        for (uint256 i = 0; i < depth; i++) {
            if (i < depth / 2) {
                siblings[i] = bytes32(0);
            } else {
                siblings[i] = bytes32(uint256(0x1234567890abcdef));
            }
        }
        return siblings;
    }

    function _createTestProof() internal pure returns (ProofCompressor.UncompressedProof memory) {
        ProofCompressor.UncompressedProof memory proof;
        proof.traceCommitment = bytes32(uint256(0x1111));
        proof.constraintCommitment = bytes32(uint256(0x2222));
        proof.friCommitments = new bytes32[](4);
        proof.traceEvaluations = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            proof.traceEvaluations[i] = 1000000 + i * 100;
        }
        proof.constraintEvaluations = new uint256[](4);
        for (uint256 i = 0; i < 4; i++) {
            proof.constraintEvaluations[i] = 500000 + i * 50;
        }
        return proof;
    }
}
