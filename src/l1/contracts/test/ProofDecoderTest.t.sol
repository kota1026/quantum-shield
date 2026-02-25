// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ProofCompressor} from "../src/lib/ProofCompressor.sol";
import {ProofDecoder} from "../src/lib/ProofDecoder.sol";

/**
 * @title ProofDecoderTest
 * @author Quantum Shield Team
 * @notice Unit tests for ProofDecoder [TEST-026]
 * @dev Tests decompression functionality, gas usage, and roundtrip integrity
 * 
 * ## Test Coverage
 * - Version info
 * - Merkle path decompression
 * - Evaluation decompression
 * - Full STARK proof decompression
 * - Gas benchmarks (target: < 100,000 gas)
 * - Error handling
 * 
 * @custom:version 0.1.0
 */
contract ProofDecoderTest is Test {
    ProofCompressor public compressor;
    ProofDecoder public decoder;

    // Test constants
    uint256 constant TEST_DEPTH = 8;

    function setUp() public {
        compressor = new ProofCompressor();
        decoder = new ProofDecoder(address(compressor));
    }

    // =========================================================================
    // Version Tests
    // =========================================================================

    function test_Version() public view {
        (string memory name, string memory version) = decoder.getVersion();
        assertEq(name, "ProofDecoder");
        assertEq(version, "0.1.0");
    }

    // =========================================================================
    // Merkle Path Decompression Tests
    // =========================================================================

    function test_DecompressMerklePath_Basic() public {
        // Compress then decompress
        bytes32[] memory original = _createTestSiblings(TEST_DEPTH);
        bytes memory compressed = compressor.compressMerklePath(original);
        
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        assertEq(decompressed.length, original.length, "Length mismatch");
        for (uint256 i = 0; i < original.length; i++) {
            assertEq(decompressed[i], original[i], "Sibling mismatch at index");
        }
    }

    function test_DecompressMerklePath_Empty() public {
        bytes32[] memory original = new bytes32[](0);
        bytes memory compressed = compressor.compressMerklePath(original);
        
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        assertEq(decompressed.length, 0, "Should decompress to empty array");
    }

    function test_DecompressMerklePath_ZeroRuns() public {
        // All zeros - tests RLE zero run decoding
        bytes32[] memory original = new bytes32[](TEST_DEPTH);
        bytes memory compressed = compressor.compressMerklePath(original);
        
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        assertEq(decompressed.length, TEST_DEPTH, "Length mismatch");
        for (uint256 i = 0; i < TEST_DEPTH; i++) {
            assertEq(decompressed[i], bytes32(0), "Should be zero");
        }
    }

    function test_DecompressMerklePath_RepeatedValues() public {
        // Same non-zero value repeated - tests RLE repeat decoding
        bytes32[] memory original = new bytes32[](TEST_DEPTH);
        bytes32 repeatedValue = bytes32(uint256(0xABCD));
        for (uint256 i = 0; i < TEST_DEPTH; i++) {
            original[i] = repeatedValue;
        }
        
        bytes memory compressed = compressor.compressMerklePath(original);
        bytes32[] memory decompressed = decoder.decompressMerklePath(compressed);
        
        assertEq(decompressed.length, TEST_DEPTH, "Length mismatch");
        for (uint256 i = 0; i < TEST_DEPTH; i++) {
            assertEq(decompressed[i], repeatedValue, "Value mismatch");
        }
    }

    function test_DecompressMerklePath_InvalidVersion_Reverts() public {
        // Create malformed compressed data with wrong version
        bytes memory invalidData = abi.encodePacked(
            uint32(99), // Wrong version
            uint32(0),  // flags
            uint32(4),  // depth
            uint32(0)   // reserved
        );
        
        vm.expectRevert(abi.encodeWithSelector(ProofDecoder.InvalidVersion.selector, uint32(99), uint32(1)));
        decoder.decompressMerklePath(invalidData);
    }

    function test_DecompressMerklePath_DataTruncated_Reverts() public {
        // Too short data
        bytes memory truncated = abi.encodePacked(uint32(1), uint32(0));
        
        vm.expectRevert(ProofDecoder.DataTruncated.selector);
        decoder.decompressMerklePath(truncated);
    }

    // =========================================================================
    // Evaluation Decompression Tests
    // =========================================================================

    function test_DecompressEvaluations_Basic() public {
        // Sequential values that delta-encode well
        uint256[] memory original = new uint256[](16);
        for (uint256 i = 0; i < 16; i++) {
            original[i] = 1000 + i * 100;
        }
        
        bytes memory compressed = compressor.compressEvaluations(original);
        uint256[] memory decompressed = decoder.decompressEvaluations(compressed);
        
        assertEq(decompressed.length, original.length, "Length mismatch");
        for (uint256 i = 0; i < original.length; i++) {
            assertEq(decompressed[i], original[i], "Evaluation mismatch at index");
        }
    }

    function test_DecompressEvaluations_Empty() public {
        uint256[] memory original = new uint256[](0);
        bytes memory compressed = compressor.compressEvaluations(original);
        
        uint256[] memory decompressed = decoder.decompressEvaluations(compressed);
        
        assertEq(decompressed.length, 0, "Should decompress to empty");
    }

    function test_DecompressEvaluations_SingleValue() public {
        uint256[] memory original = new uint256[](1);
        original[0] = 12345;
        
        bytes memory compressed = compressor.compressEvaluations(original);
        uint256[] memory decompressed = decoder.decompressEvaluations(compressed);
        
        assertEq(decompressed.length, 1, "Length should be 1");
        assertEq(decompressed[0], original[0], "Value mismatch");
    }

    // =========================================================================
    // Full STARK Proof Decompression Tests
    // =========================================================================

    function test_DecompressSTARKProof_Basic() public {
        ProofCompressor.UncompressedProof memory original = _createTestProof();
        bytes memory compressed = compressor.compressSTARKProof(original);
        
        ProofCompressor.UncompressedProof memory decompressed = decoder.decompressSTARKProof(compressed);
        
        assertEq(decompressed.traceCommitment, original.traceCommitment, "Trace commitment mismatch");
        assertEq(decompressed.constraintCommitment, original.constraintCommitment, "Constraint commitment mismatch");
        assertEq(decompressed.friCommitments.length, original.friCommitments.length, "FRI length mismatch");
    }

    function test_DecompressSTARKProof_PreservesAllFields() public {
        ProofCompressor.UncompressedProof memory original = _createTestProof();
        bytes memory compressed = compressor.compressSTARKProof(original);
        
        ProofCompressor.UncompressedProof memory decompressed = decoder.decompressSTARKProof(compressed);
        
        // Check all FRI commitments
        for (uint256 i = 0; i < original.friCommitments.length; i++) {
            assertEq(decompressed.friCommitments[i], original.friCommitments[i], "FRI commitment mismatch");
        }
        
        // Check all trace evaluations
        assertEq(decompressed.traceEvaluations.length, original.traceEvaluations.length, "Trace eval length");
        for (uint256 i = 0; i < original.traceEvaluations.length; i++) {
            assertEq(decompressed.traceEvaluations[i], original.traceEvaluations[i], "Trace eval mismatch");
        }
        
        // Check all constraint evaluations
        assertEq(decompressed.constraintEvaluations.length, original.constraintEvaluations.length, "Constraint eval length");
        for (uint256 i = 0; i < original.constraintEvaluations.length; i++) {
            assertEq(decompressed.constraintEvaluations[i], original.constraintEvaluations[i], "Constraint eval mismatch");
        }
    }

    // =========================================================================
    // Gas Benchmark Tests - Target: < 100,000 gas
    // =========================================================================

    function test_Gas_DecompressMerklePath() public {
        bytes32[] memory original = _createTestSiblings(TEST_DEPTH);
        bytes memory compressed = compressor.compressMerklePath(original);
        
        uint256 gasBefore = gasleft();
        decoder.decompressMerklePath(compressed);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Merkle path decompression gas:", gasUsed);
        assertTrue(gasUsed < 100000, "Decompression should use < 100k gas");
    }

    function test_Gas_DecompressEvaluations() public {
        uint256[] memory original = new uint256[](16);
        for (uint256 i = 0; i < 16; i++) {
            original[i] = 1000 + i * 100;
        }
        bytes memory compressed = compressor.compressEvaluations(original);
        
        uint256 gasBefore = gasleft();
        decoder.decompressEvaluations(compressed);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Evaluations decompression gas:", gasUsed);
        assertTrue(gasUsed < 100000, "Decompression should use < 100k gas");
    }

    function test_Gas_DecompressSTARKProof() public {
        ProofCompressor.UncompressedProof memory original = _createTestProof();
        bytes memory compressed = compressor.compressSTARKProof(original);
        
        uint256 gasBefore = gasleft();
        decoder.decompressSTARKProof(compressed);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("STARK proof decompression gas:", gasUsed);
        assertTrue(gasUsed < 100000, "Decompression should use < 100k gas");
    }

    // =========================================================================
    // Validation Tests
    // =========================================================================

    function test_ValidateFormat_Valid() public {
        bytes32[] memory siblings = _createTestSiblings(TEST_DEPTH);
        bytes memory compressed = compressor.compressMerklePath(siblings);
        
        bool valid = decoder.validateFormat(compressed);
        
        assertTrue(valid, "Valid compressed data should pass validation");
    }

    function test_ValidateFormat_InvalidVersion() public view {
        bytes memory invalid = abi.encodePacked(
            uint32(99), // Wrong version
            uint32(0),
            uint32(0),
            uint32(0)
        );
        
        bool valid = decoder.validateFormat(invalid);
        
        assertFalse(valid, "Invalid version should fail validation");
    }

    function test_ValidateFormat_TooShort() public view {
        bytes memory tooShort = abi.encodePacked(uint32(1));
        
        bool valid = decoder.validateFormat(tooShort);
        
        assertFalse(valid, "Too short data should fail validation");
    }

    function test_GetFormatVersion() public {
        bytes32[] memory siblings = _createTestSiblings(TEST_DEPTH);
        bytes memory compressed = compressor.compressMerklePath(siblings);
        
        uint32 version = decoder.getFormatVersion(compressed);
        
        assertEq(version, 1, "Version should be 1");
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _createTestSiblings(uint256 depth) internal pure returns (bytes32[] memory) {
        bytes32[] memory siblings = new bytes32[](depth);
        for (uint256 i = 0; i < depth; i++) {
            siblings[i] = bytes32(uint256(keccak256(abi.encodePacked("test", i))));
        }
        return siblings;
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
}
