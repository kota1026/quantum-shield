// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ProofCompressor} from "../src/lib/ProofCompressor.sol";
import {ProofDecoder} from "../src/lib/ProofDecoder.sol";
import {SHA3Hasher} from "../src/libraries/SHA3Hasher.sol";

/**
 * @title RoundtripCompressionTest
 * @author Quantum Shield Team
 * @notice Roundtrip compression/decompression tests [TEST-026]
 * @dev Verifies data integrity through compress -> decompress cycle
 */
contract RoundtripCompressionTest is Test {

    ProofCompressor public compressor;
    ProofDecoder public decoder;

    uint256 constant TEST_DEPTH = 8;

    function setUp() public {
        compressor = new ProofCompressor();
        decoder = new ProofDecoder(address(compressor));
    }

    // =========================================================================
    // Merkle Path Roundtrip Tests
    // =========================================================================

    function test_Roundtrip_MerklePath_Basic() public view {
        bytes32[] memory original = _createTestSiblings(TEST_DEPTH);
        
        bytes memory compressed = compressor.compressMerklePath(original);
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        assertEq(decompressed.length, original.length, "Length mismatch");
        for (uint256 i = 0; i < original.length; i++) {
            assertEq(decompressed[i], original[i], string.concat("Sibling mismatch at index ", vm.toString(i)));
        }
    }

    function test_Roundtrip_MerklePath_SingleElement() public view {
        bytes32[] memory original = new bytes32[](1);
        original[0] = bytes32(uint256(0xabcdef));
        
        bytes memory compressed = compressor.compressMerklePath(original);
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        assertEq(decompressed.length, 1);
        assertEq(decompressed[0], original[0]);
    }

    function test_Roundtrip_MerklePath_MaxDepth() public view {
        bytes32[] memory original = _createTestSiblings(32);
        
        bytes memory compressed = compressor.compressMerklePath(original);
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        assertEq(decompressed.length, original.length);
        for (uint256 i = 0; i < original.length; i++) {
            assertEq(decompressed[i], original[i]);
        }
    }

    function test_Roundtrip_MerklePath_AllZeros() public view {
        bytes32[] memory original = new bytes32[](TEST_DEPTH);
        // All zeros
        
        bytes memory compressed = compressor.compressMerklePath(original);
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        assertEq(decompressed.length, original.length);
        for (uint256 i = 0; i < original.length; i++) {
            assertEq(decompressed[i], bytes32(0));
        }
    }

    // =========================================================================
    // Evaluation Roundtrip Tests
    // =========================================================================

    function test_Roundtrip_Evaluations_Basic() public view {
        uint256[] memory original = _createTestEvaluations(16);
        
        bytes memory compressed = compressor.compressEvaluations(original);
        uint256[] memory decompressed = decoder.decompressEvaluations(compressed);
        
        assertEq(decompressed.length, original.length, "Length mismatch");
        for (uint256 i = 0; i < original.length; i++) {
            assertEq(decompressed[i], original[i], string.concat("Eval mismatch at index ", vm.toString(i)));
        }
    }

    function test_Roundtrip_Evaluations_SmallValues() public view {
        uint256[] memory original = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            original[i] = i * 100;
        }
        
        bytes memory compressed = compressor.compressEvaluations(original);
        uint256[] memory decompressed = decoder.decompressEvaluations(compressed);
        
        assertEq(decompressed.length, original.length);
        for (uint256 i = 0; i < original.length; i++) {
            assertEq(decompressed[i], original[i]);
        }
    }

    function test_Roundtrip_Evaluations_LargeValues() public view {
        uint256[] memory original = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            original[i] = type(uint256).max - i;
        }
        
        bytes memory compressed = compressor.compressEvaluations(original);
        uint256[] memory decompressed = decoder.decompressEvaluations(compressed);
        
        assertEq(decompressed.length, original.length);
        for (uint256 i = 0; i < original.length; i++) {
            assertEq(decompressed[i], original[i]);
        }
    }

    // =========================================================================
    // Full STARK Proof Roundtrip Tests
    // =========================================================================

    function test_Roundtrip_STARKProof_Basic() public view {
        ProofCompressor.UncompressedProof memory original = _createTestProof();
        
        bytes memory compressed = compressor.compressSTARKProof(original);
        ProofCompressor.UncompressedProof memory decompressed = decoder.decompressSTARKProof(compressed);
        
        // Verify commitments
        assertEq(decompressed.traceCommitment, original.traceCommitment, "Trace commitment mismatch");
        assertEq(decompressed.constraintCommitment, original.constraintCommitment, "Constraint commitment mismatch");
        
        // Verify FRI commitments
        assertEq(decompressed.friCommitments.length, original.friCommitments.length, "FRI length mismatch");
        for (uint256 i = 0; i < original.friCommitments.length; i++) {
            assertEq(decompressed.friCommitments[i], original.friCommitments[i]);
        }
        
        // Verify evaluations
        assertEq(decompressed.traceEvaluations.length, original.traceEvaluations.length);
        for (uint256 i = 0; i < original.traceEvaluations.length; i++) {
            assertEq(decompressed.traceEvaluations[i], original.traceEvaluations[i]);
        }
    }

    function test_Roundtrip_STARKProof_MinimalProof() public view {
        ProofCompressor.UncompressedProof memory original;
        original.traceCommitment = bytes32(uint256(1));
        original.constraintCommitment = bytes32(uint256(2));
        original.friCommitments = new bytes32[](1);
        original.friCommitments[0] = bytes32(uint256(3));
        original.traceEvaluations = new uint256[](1);
        original.traceEvaluations[0] = 4;
        original.constraintEvaluations = new uint256[](1);
        original.constraintEvaluations[0] = 5;
        
        bytes memory compressed = compressor.compressSTARKProof(original);
        ProofCompressor.UncompressedProof memory decompressed = decoder.decompressSTARKProof(compressed);
        
        assertEq(decompressed.traceCommitment, original.traceCommitment);
        assertEq(decompressed.constraintCommitment, original.constraintCommitment);
    }

    function test_Roundtrip_STARKProof_LargeProof() public view {
        ProofCompressor.UncompressedProof memory original = _createLargeTestProof();
        
        bytes memory compressed = compressor.compressSTARKProof(original);
        ProofCompressor.UncompressedProof memory decompressed = decoder.decompressSTARKProof(compressed);
        
        assertEq(decompressed.traceCommitment, original.traceCommitment);
        assertEq(decompressed.constraintCommitment, original.constraintCommitment);
        assertEq(decompressed.friCommitments.length, original.friCommitments.length);
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    function testFuzz_Roundtrip_MerklePath(bytes32[8] calldata siblings) public view {
        bytes32[] memory original = new bytes32[](8);
        for (uint256 i = 0; i < 8; i++) {
            original[i] = siblings[i];
        }
        
        bytes memory compressed = compressor.compressMerklePath(original);
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        assertEq(decompressed.length, 8);
        for (uint256 i = 0; i < 8; i++) {
            assertEq(decompressed[i], original[i]);
        }
    }

    function testFuzz_Roundtrip_SingleEvaluation(uint256 value) public view {
        uint256[] memory original = new uint256[](1);
        original[0] = value;
        
        bytes memory compressed = compressor.compressEvaluations(original);
        uint256[] memory decompressed = decoder.decompressEvaluations(compressed);
        
        assertEq(decompressed.length, 1);
        assertEq(decompressed[0], value);
    }

    // =========================================================================
    // Data Integrity Tests
    // =========================================================================

    function test_DataIntegrity_MultipleRoundtrips() public view {
        bytes32[] memory original = _createTestSiblings(TEST_DEPTH);
        
        // Multiple roundtrips should produce same result
        bytes memory compressed1 = compressor.compressMerklePath(original);
        bytes32[] memory decompressed1 = decoder.decompressMerklePath(compressed1);
        
        bytes memory compressed2 = compressor.compressMerklePath(decompressed1);
        bytes32[] memory decompressed2 = decoder.decompressMerklePath(compressed2);
        
        for (uint256 i = 0; i < original.length; i++) {
            assertEq(decompressed2[i], original[i], "Multiple roundtrip integrity failed");
        }
    }

    function test_DataIntegrity_CompressionDeterminism() public view {
        bytes32[] memory siblings = _createTestSiblings(TEST_DEPTH);
        
        bytes memory compressed1 = compressor.compressMerklePath(siblings);
        bytes memory compressed2 = compressor.compressMerklePath(siblings);
        
        assertEq(keccak256(compressed1), keccak256(compressed2), "Compression should be deterministic");
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

    function _createTestEvaluations(uint256 count) internal pure returns (uint256[] memory) {
        uint256[] memory evals = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            evals[i] = uint256(keccak256(abi.encodePacked("eval", i)));
        }
        return evals;
    }

    function _createTestProof() internal pure returns (ProofCompressor.UncompressedProof memory) {
        ProofCompressor.UncompressedProof memory proof;
        proof.traceCommitment = bytes32(uint256(0x1111));
        proof.constraintCommitment = bytes32(uint256(0x2222));
        proof.friCommitments = new bytes32[](4);
        for (uint256 i = 0; i < 4; i++) {
            proof.friCommitments[i] = bytes32(uint256(0x3333 + i));
        }
        proof.traceEvaluations = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            proof.traceEvaluations[i] = 0x4444 + i;
        }
        proof.constraintEvaluations = new uint256[](4);
        for (uint256 i = 0; i < 4; i++) {
            proof.constraintEvaluations[i] = 0x5555 + i;
        }
        return proof;
    }

    function _createLargeTestProof() internal pure returns (ProofCompressor.UncompressedProof memory) {
        ProofCompressor.UncompressedProof memory proof;
        proof.traceCommitment = bytes32(uint256(0xaaaa));
        proof.constraintCommitment = bytes32(uint256(0xbbbb));
        proof.friCommitments = new bytes32[](16);
        for (uint256 i = 0; i < 16; i++) {
            proof.friCommitments[i] = bytes32(uint256(0xcccc + i));
        }
        proof.traceEvaluations = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            proof.traceEvaluations[i] = uint256(keccak256(abi.encodePacked("trace", i)));
        }
        proof.constraintEvaluations = new uint256[](32);
        for (uint256 i = 0; i < 32; i++) {
            proof.constraintEvaluations[i] = uint256(keccak256(abi.encodePacked("constraint", i)));
        }
        return proof;
    }
}
