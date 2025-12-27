// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ProofCompressor} from "../src/lib/ProofCompressor.sol";
import {ProofDecoder} from "../src/lib/ProofDecoder.sol";
import {BatchVerifier} from "../src/BatchVerifier.sol";
import {SharedMerkle} from "../src/lib/SharedMerkle.sol";

/**
 * @title CompressionBenchmarkTest
 * @author Quantum Shield Team
 * @notice Gas compression benchmark tests [TEST-027]
 * @dev Validates 50% compression target for Week 10
 */
contract CompressionBenchmarkTest is Test {

    ProofCompressor public compressor;
    ProofDecoder public decoder;
    SharedMerkle public sharedMerkle;
    BatchVerifier public batchVerifier;

    // Target: 50% compression ratio
    uint256 constant TARGET_COMPRESSION_RATIO = 5000; // 50% = 5000/10000

    function setUp() public {
        compressor = new ProofCompressor();
        decoder = new ProofDecoder(address(compressor));
        sharedMerkle = new SharedMerkle();
        batchVerifier = new BatchVerifier(address(sharedMerkle));
    }

    // =========================================================================
    // Size Compression Benchmarks
    // =========================================================================

    function test_Benchmark_MerklePathCompression_Size() public {
        bytes32[] memory siblings = _createRealisticSiblings(8);
        uint256 originalSize = siblings.length * 32;
        
        bytes memory compressed = compressor.compressMerklePath(siblings);
        uint256 compressedSize = compressed.length;
        
        uint256 ratio = (compressedSize * 10000) / originalSize;
        
        console.log("=== Merkle Path Compression ===");
        console.log("Original size:", originalSize, "bytes");
        console.log("Compressed size:", compressedSize, "bytes");
        console.log("Compression ratio:", ratio, "/ 10000");
        console.log("Bytes saved:", originalSize - compressedSize);
        
        // Log result
        emit log_named_uint("MerklePath_Original", originalSize);
        emit log_named_uint("MerklePath_Compressed", compressedSize);
        emit log_named_uint("MerklePath_Ratio", ratio);
    }

    function test_Benchmark_EvaluationsCompression_Size() public {
        uint256[] memory evals = _createRealisticEvaluations(32);
        uint256 originalSize = evals.length * 32;
        
        bytes memory compressed = compressor.compressEvaluations(evals);
        uint256 compressedSize = compressed.length;
        
        uint256 ratio = (compressedSize * 10000) / originalSize;
        
        console.log("=== Evaluations Compression ===");
        console.log("Original size:", originalSize, "bytes");
        console.log("Compressed size:", compressedSize, "bytes");
        console.log("Compression ratio:", ratio, "/ 10000");
        
        emit log_named_uint("Evaluations_Original", originalSize);
        emit log_named_uint("Evaluations_Compressed", compressedSize);
        emit log_named_uint("Evaluations_Ratio", ratio);
    }

    function test_Benchmark_FullProofCompression_Size() public {
        ProofCompressor.UncompressedProof memory proof = _createRealisticProof();
        uint256 originalSize = _calculateProofSize(proof);
        
        bytes memory compressed = compressor.compressSTARKProof(proof);
        uint256 compressedSize = compressed.length;
        
        uint256 ratio = (compressedSize * 10000) / originalSize;
        
        console.log("=== Full STARK Proof Compression ===");
        console.log("Original size:", originalSize, "bytes");
        console.log("Compressed size:", compressedSize, "bytes");
        console.log("Compression ratio:", ratio, "/ 10000");
        console.log("Target ratio:", TARGET_COMPRESSION_RATIO, "/ 10000");
        
        emit log_named_uint("FullProof_Original", originalSize);
        emit log_named_uint("FullProof_Compressed", compressedSize);
        emit log_named_uint("FullProof_Ratio", ratio);
        
        // Week 10 target: 50% compression
        assertTrue(ratio <= TARGET_COMPRESSION_RATIO, "Failed to achieve 50% compression target");
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    function test_Benchmark_CompressionGas() public {
        ProofCompressor.UncompressedProof memory proof = _createRealisticProof();
        
        uint256 gasBefore = gasleft();
        bytes memory compressed = compressor.compressSTARKProof(proof);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== Compression Gas Usage ===");
        console.log("Gas used for compression:", gasUsed);
        console.log("Compressed size:", compressed.length, "bytes");
        
        emit log_named_uint("Compression_Gas", gasUsed);
    }

    function test_Benchmark_DecompressionGas() public {
        ProofCompressor.UncompressedProof memory proof = _createRealisticProof();
        bytes memory compressed = compressor.compressSTARKProof(proof);
        
        uint256 gasBefore = gasleft();
        decoder.decompressSTARKProof(compressed);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== Decompression Gas Usage ===");
        console.log("Gas used for decompression:", gasUsed);
        
        // Target: decompression should be < 100,000 gas
        emit log_named_uint("Decompression_Gas", gasUsed);
        assertTrue(gasUsed < 100000, "Decompression gas exceeds 100,000 target");
    }

    function test_Benchmark_MerklePathCompressionGas() public {
        bytes32[] memory siblings = _createRealisticSiblings(8);
        
        uint256 gasBefore = gasleft();
        compressor.compressMerklePath(siblings);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== Merkle Path Compression Gas ===");
        console.log("Gas used:", gasUsed);
        
        emit log_named_uint("MerkleCompress_Gas", gasUsed);
    }

    function test_Benchmark_MerklePathDecompressionGas() public {
        bytes32[] memory siblings = _createRealisticSiblings(8);
        bytes memory compressed = compressor.compressMerklePath(siblings);
        
        uint256 gasBefore = gasleft();
        decoder.decompressMerklePath(compressed);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== Merkle Path Decompression Gas ===");
        console.log("Gas used:", gasUsed);
        
        emit log_named_uint("MerkleDecompress_Gas", gasUsed);
    }

    // =========================================================================
    // Batch Compression Benchmarks
    // =========================================================================

    function test_Benchmark_BatchCompressionSavings() public {
        uint256 batchSize = 10;
        ProofCompressor.UncompressedProof[] memory proofs = new ProofCompressor.UncompressedProof[](batchSize);
        
        uint256 totalOriginalSize = 0;
        uint256 totalCompressedSize = 0;
        
        for (uint256 i = 0; i < batchSize; i++) {
            proofs[i] = _createRealisticProof();
            totalOriginalSize += _calculateProofSize(proofs[i]);
            
            bytes memory compressed = compressor.compressSTARKProof(proofs[i]);
            totalCompressedSize += compressed.length;
        }
        
        uint256 ratio = (totalCompressedSize * 10000) / totalOriginalSize;
        uint256 bytesSaved = totalOriginalSize - totalCompressedSize;
        
        console.log("=== Batch Compression (10 proofs) ===");
        console.log("Total original size:", totalOriginalSize, "bytes");
        console.log("Total compressed size:", totalCompressedSize, "bytes");
        console.log("Total bytes saved:", bytesSaved);
        console.log("Batch compression ratio:", ratio, "/ 10000");
        
        emit log_named_uint("Batch10_Original", totalOriginalSize);
        emit log_named_uint("Batch10_Compressed", totalCompressedSize);
        emit log_named_uint("Batch10_Ratio", ratio);
    }

    // =========================================================================
    // Calldata Cost Analysis
    // =========================================================================

    function test_Benchmark_CalldataCostSavings() public {
        ProofCompressor.UncompressedProof memory proof = _createRealisticProof();
        uint256 originalSize = _calculateProofSize(proof);
        
        bytes memory compressed = compressor.compressSTARKProof(proof);
        uint256 compressedSize = compressed.length;
        
        // Calldata cost: 4 gas for zero byte, 16 gas for non-zero byte
        // Estimate assuming 75% non-zero bytes
        uint256 originalCalldataCost = (originalSize * 75 / 100 * 16) + (originalSize * 25 / 100 * 4);
        uint256 compressedCalldataCost = (compressedSize * 75 / 100 * 16) + (compressedSize * 25 / 100 * 4);
        
        uint256 calldataSaved = originalCalldataCost - compressedCalldataCost;
        
        console.log("=== Calldata Cost Analysis ===");
        console.log("Original calldata cost:", originalCalldataCost, "gas");
        console.log("Compressed calldata cost:", compressedCalldataCost, "gas");
        console.log("Calldata gas saved:", calldataSaved);
        
        emit log_named_uint("Calldata_Original", originalCalldataCost);
        emit log_named_uint("Calldata_Compressed", compressedCalldataCost);
        emit log_named_uint("Calldata_Saved", calldataSaved);
    }

    // =========================================================================
    // Week 10 Target Validation
    // =========================================================================

    function test_Week10Target_50PercentCompression() public {
        // Create realistic proof representing actual use case
        ProofCompressor.UncompressedProof memory proof = _createRealisticProof();
        uint256 originalSize = _calculateProofSize(proof);
        
        bytes memory compressed = compressor.compressSTARKProof(proof);
        uint256 compressedSize = compressed.length;
        
        uint256 compressionPercent = 100 - (compressedSize * 100 / originalSize);
        
        console.log("=== Week 10 Target Validation ===");
        console.log("Original size:", originalSize, "bytes");
        console.log("Compressed size:", compressedSize, "bytes");
        console.log("Compression achieved:", compressionPercent, "%");
        console.log("Target: >= 50%");
        
        assertTrue(compressionPercent >= 50, "Week 10 target not met: need >= 50% compression");
    }

    function test_Week10Target_DecompressionUnder100kGas() public {
        ProofCompressor.UncompressedProof memory proof = _createRealisticProof();
        bytes memory compressed = compressor.compressSTARKProof(proof);
        
        uint256 gasBefore = gasleft();
        decoder.decompressSTARKProof(compressed);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== Week 10 Decompression Gas Target ===");
        console.log("Gas used:", gasUsed);
        console.log("Target: < 100,000");
        
        assertTrue(gasUsed < 100000, "Week 10 target not met: decompression > 100k gas");
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _createRealisticSiblings(uint256 depth) internal pure returns (bytes32[] memory) {
        bytes32[] memory siblings = new bytes32[](depth);
        // Simulate realistic merkle siblings with some patterns
        for (uint256 i = 0; i < depth; i++) {
            // Mix of pattern types
            if (i % 3 == 0) {
                siblings[i] = bytes32(uint256(keccak256(abi.encodePacked("realistic", i))));
            } else if (i % 3 == 1) {
                // Some structured data
                siblings[i] = bytes32(uint256(i * 0x1111111111111111));
            } else {
                // Random-looking data
                siblings[i] = bytes32(uint256(keccak256(abi.encodePacked(block.timestamp, i))));
            }
        }
        return siblings;
    }

    function _createRealisticEvaluations(uint256 count) internal pure returns (uint256[] memory) {
        uint256[] memory evals = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            // Field elements typically have patterns
            evals[i] = uint256(keccak256(abi.encodePacked("field_element", i))) % (2**64);
        }
        return evals;
    }

    function _createRealisticProof() internal pure returns (ProofCompressor.UncompressedProof memory) {
        ProofCompressor.UncompressedProof memory proof;
        
        // Realistic commitments
        proof.traceCommitment = bytes32(uint256(keccak256("trace_commitment")));
        proof.constraintCommitment = bytes32(uint256(keccak256("constraint_commitment")));
        
        // FRI commitments (typically 8-16 layers)
        proof.friCommitments = new bytes32[](10);
        for (uint256 i = 0; i < 10; i++) {
            proof.friCommitments[i] = bytes32(uint256(keccak256(abi.encodePacked("fri", i))));
        }
        
        // Trace evaluations (typically 32-128)
        proof.traceEvaluations = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            proof.traceEvaluations[i] = uint256(keccak256(abi.encodePacked("trace_eval", i)));
        }
        
        // Constraint evaluations (typically 16-64)
        proof.constraintEvaluations = new uint256[](32);
        for (uint256 i = 0; i < 32; i++) {
            proof.constraintEvaluations[i] = uint256(keccak256(abi.encodePacked("constraint_eval", i)));
        }
        
        return proof;
    }

    function _calculateProofSize(ProofCompressor.UncompressedProof memory proof) internal pure returns (uint256) {
        uint256 size = 64; // traceCommitment + constraintCommitment
        size += proof.friCommitments.length * 32;
        size += proof.traceEvaluations.length * 32;
        size += proof.constraintEvaluations.length * 32;
        return size;
    }
}
