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
 * @dev Validates compression functionality and gas targets for Week 10
 */
contract CompressionBenchmarkTest is Test {

    ProofCompressor public compressor;
    ProofDecoder public decoder;
    SharedMerkle public sharedMerkle;
    BatchVerifier public batchVerifier;

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
        // Use compressible data pattern (zeros and repeats)
        bytes32[] memory siblings = _createCompressibleSiblings(8);
        uint256 originalSize = siblings.length * 32;
        
        bytes memory compressed = compressor.compressMerklePath(siblings);
        uint256 compressedSize = compressed.length;
        
        uint256 ratio = (compressedSize * 10000) / originalSize;
        
        console.log("=== Merkle Path Compression ===");
        console.log("Original size:", originalSize, "bytes");
        console.log("Compressed size:", compressedSize, "bytes");
        console.log("Compression ratio:", ratio, "/ 10000");
        
        if (compressedSize < originalSize) {
            console.log("Bytes saved:", originalSize - compressedSize);
        } else {
            console.log("Overhead:", compressedSize - originalSize);
        }
        
        emit log_named_uint("MerklePath_Original", originalSize);
        emit log_named_uint("MerklePath_Compressed", compressedSize);
        emit log_named_uint("MerklePath_Ratio", ratio);
    }

    function test_Benchmark_EvaluationsCompression_Size() public {
        // Use compressible data (small sequential values)
        uint256[] memory evals = _createCompressibleEvaluations(32);
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
        // Use compressible proof data
        ProofCompressor.UncompressedProof memory proof = _createCompressibleProof();
        uint256 originalSize = _calculateProofSize(proof);
        
        bytes memory compressed = compressor.compressSTARKProof(proof);
        uint256 compressedSize = compressed.length;
        
        uint256 ratio = (compressedSize * 10000) / originalSize;
        
        console.log("=== Full STARK Proof Compression (Compressible Data) ===");
        console.log("Original size:", originalSize, "bytes");
        console.log("Compressed size:", compressedSize, "bytes");
        console.log("Compression ratio:", ratio, "/ 10000");
        
        emit log_named_uint("FullProof_Original", originalSize);
        emit log_named_uint("FullProof_Compressed", compressedSize);
        emit log_named_uint("FullProof_Ratio", ratio);
        
        // Compressible data should achieve significant compression
        assertTrue(ratio < 10000, "Compressible data should compress");
    }

    function test_Benchmark_RandomDataCompression() public {
        // Test with random data (worst case - no compression expected)
        ProofCompressor.UncompressedProof memory proof = _createRandomProof();
        uint256 originalSize = _calculateProofSize(proof);
        
        bytes memory compressed = compressor.compressSTARKProof(proof);
        uint256 compressedSize = compressed.length;
        
        uint256 ratio = (compressedSize * 10000) / originalSize;
        
        console.log("=== Random Data Compression (Worst Case) ===");
        console.log("Original size:", originalSize, "bytes");
        console.log("Compressed size:", compressedSize, "bytes");
        console.log("Compression ratio:", ratio, "/ 10000");
        console.log("Note: Random data does not compress well");
        
        emit log_named_uint("RandomProof_Original", originalSize);
        emit log_named_uint("RandomProof_Compressed", compressedSize);
        emit log_named_uint("RandomProof_Ratio", ratio);
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    function test_Benchmark_CompressionGas() public {
        ProofCompressor.UncompressedProof memory proof = _createCompressibleProof();
        
        uint256 gasBefore = gasleft();
        bytes memory compressed = compressor.compressSTARKProof(proof);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== Compression Gas Usage ===");
        console.log("Gas used for compression:", gasUsed);
        console.log("Compressed size:", compressed.length, "bytes");
        
        emit log_named_uint("Compression_Gas", gasUsed);
    }

    function test_Benchmark_DecompressionGas() public {
        ProofCompressor.UncompressedProof memory proof = _createCompressibleProof();
        bytes memory compressed = compressor.compressSTARKProof(proof);
        
        uint256 gasBefore = gasleft();
        decoder.decompressSTARKProof(compressed);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== Decompression Gas Usage ===");
        console.log("Gas used for decompression:", gasUsed);
        
        // Target: decompression should be < 150,000 gas (v0.1)
        // Future optimization target: < 100,000 gas (v0.2 with assembly)
        emit log_named_uint("Decompression_Gas", gasUsed);
        assertTrue(gasUsed < 150000, "Decompression gas exceeds 150,000 limit");
    }

    function test_Benchmark_MerklePathCompressionGas() public {
        bytes32[] memory siblings = _createCompressibleSiblings(8);
        
        uint256 gasBefore = gasleft();
        compressor.compressMerklePath(siblings);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== Merkle Path Compression Gas ===");
        console.log("Gas used:", gasUsed);
        
        emit log_named_uint("MerkleCompress_Gas", gasUsed);
    }

    function test_Benchmark_MerklePathDecompressionGas() public {
        bytes32[] memory siblings = _createCompressibleSiblings(8);
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
        
        uint256 totalOriginalSize = 0;
        uint256 totalCompressedSize = 0;
        
        for (uint256 i = 0; i < batchSize; i++) {
            ProofCompressor.UncompressedProof memory proof = _createCompressibleProof();
            totalOriginalSize += _calculateProofSize(proof);
            
            bytes memory compressed = compressor.compressSTARKProof(proof);
            totalCompressedSize += compressed.length;
        }
        
        uint256 ratio = (totalCompressedSize * 10000) / totalOriginalSize;
        
        console.log("=== Batch Compression (10 proofs) ===");
        console.log("Total original size:", totalOriginalSize, "bytes");
        console.log("Total compressed size:", totalCompressedSize, "bytes");
        console.log("Batch compression ratio:", ratio, "/ 10000");
        
        if (totalCompressedSize < totalOriginalSize) {
            console.log("Total bytes saved:", totalOriginalSize - totalCompressedSize);
        }
        
        emit log_named_uint("Batch10_Original", totalOriginalSize);
        emit log_named_uint("Batch10_Compressed", totalCompressedSize);
        emit log_named_uint("Batch10_Ratio", ratio);
    }

    // =========================================================================
    // Calldata Cost Analysis
    // =========================================================================

    function test_Benchmark_CalldataCostSavings() public {
        ProofCompressor.UncompressedProof memory proof = _createCompressibleProof();
        uint256 originalSize = _calculateProofSize(proof);
        
        bytes memory compressed = compressor.compressSTARKProof(proof);
        uint256 compressedSize = compressed.length;
        
        // Calldata cost: 4 gas for zero byte, 16 gas for non-zero byte
        // Estimate assuming 75% non-zero bytes
        uint256 originalCalldataCost = (originalSize * 75 / 100 * 16) + (originalSize * 25 / 100 * 4);
        uint256 compressedCalldataCost = (compressedSize * 75 / 100 * 16) + (compressedSize * 25 / 100 * 4);
        
        console.log("=== Calldata Cost Analysis ===");
        console.log("Original calldata cost:", originalCalldataCost, "gas");
        console.log("Compressed calldata cost:", compressedCalldataCost, "gas");
        
        if (compressedCalldataCost < originalCalldataCost) {
            console.log("Calldata gas saved:", originalCalldataCost - compressedCalldataCost);
        } else {
            console.log("Note: No savings with this data pattern");
        }
        
        emit log_named_uint("Calldata_Original", originalCalldataCost);
        emit log_named_uint("Calldata_Compressed", compressedCalldataCost);
    }

    // =========================================================================
    // Week 10 Target Validation
    // =========================================================================

    function test_Week10Target_CompressibleDataCompression() public view {
        // Test with highly compressible data (zeros)
        ProofCompressor.UncompressedProof memory proof = _createHighlyCompressibleProof();
        uint256 originalSize = _calculateProofSize(proof);
        
        bytes memory compressed = compressor.compressSTARKProof(proof);
        uint256 compressedSize = compressed.length;
        
        uint256 compressionPercent = 100 - (compressedSize * 100 / originalSize);
        
        console.log("=== Week 10 Compressible Data Validation ===");
        console.log("Original size:", originalSize, "bytes");
        console.log("Compressed size:", compressedSize, "bytes");
        console.log("Compression achieved:", compressionPercent, "%");
        
        // Highly compressible data should achieve significant compression
        assertTrue(compressedSize < originalSize, "Compressible data should reduce in size");
    }

    function test_Week10Target_DecompressionUnder150kGas() public {
        ProofCompressor.UncompressedProof memory proof = _createCompressibleProof();
        bytes memory compressed = compressor.compressSTARKProof(proof);
        
        uint256 gasBefore = gasleft();
        decoder.decompressSTARKProof(compressed);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("=== Week 10 Decompression Gas Target ===");
        console.log("Gas used:", gasUsed);
        console.log("Target: < 150,000 (v0.1)");
        console.log("Stretch goal: < 100,000 (v0.2 with assembly)");
        
        assertTrue(gasUsed < 150000, "Week 10 target not met: decompression > 150k gas");
    }

    // =========================================================================
    // Helper Functions - Compressible Data
    // =========================================================================

    function _createCompressibleSiblings(uint256 depth) internal pure returns (bytes32[] memory) {
        bytes32[] memory siblings = new bytes32[](depth);
        // Create compressible pattern: zeros and repeats
        for (uint256 i = 0; i < depth; i++) {
            if (i < depth / 2) {
                // First half: zeros (highly compressible)
                siblings[i] = bytes32(0);
            } else {
                // Second half: repeated value
                siblings[i] = bytes32(uint256(0x1234567890abcdef));
            }
        }
        return siblings;
    }

    function _createCompressibleEvaluations(uint256 count) internal pure returns (uint256[] memory) {
        uint256[] memory evals = new uint256[](count);
        // Sequential small values (compressible with delta encoding)
        for (uint256 i = 0; i < count; i++) {
            evals[i] = 1000000 + i * 100; // Small deltas
        }
        return evals;
    }

    function _createCompressibleProof() internal pure returns (ProofCompressor.UncompressedProof memory) {
        ProofCompressor.UncompressedProof memory proof;
        
        proof.traceCommitment = bytes32(uint256(0x1111));
        proof.constraintCommitment = bytes32(uint256(0x2222));
        
        // FRI commitments with some zeros
        proof.friCommitments = new bytes32[](10);
        for (uint256 i = 0; i < 10; i++) {
            proof.friCommitments[i] = i < 5 ? bytes32(0) : bytes32(uint256(0xABCD));
        }
        
        // Trace evaluations with small deltas
        proof.traceEvaluations = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            proof.traceEvaluations[i] = 1000000 + i * 10;
        }
        
        // Constraint evaluations with small deltas
        proof.constraintEvaluations = new uint256[](32);
        for (uint256 i = 0; i < 32; i++) {
            proof.constraintEvaluations[i] = 500000 + i * 5;
        }
        
        return proof;
    }

    function _createHighlyCompressibleProof() internal pure returns (ProofCompressor.UncompressedProof memory) {
        ProofCompressor.UncompressedProof memory proof;
        
        proof.traceCommitment = bytes32(0);
        proof.constraintCommitment = bytes32(0);
        
        // All zeros
        proof.friCommitments = new bytes32[](10);
        proof.traceEvaluations = new uint256[](64);
        proof.constraintEvaluations = new uint256[](32);
        
        return proof;
    }

    function _createRandomProof() internal pure returns (ProofCompressor.UncompressedProof memory) {
        ProofCompressor.UncompressedProof memory proof;
        
        proof.traceCommitment = bytes32(uint256(keccak256("trace_commitment")));
        proof.constraintCommitment = bytes32(uint256(keccak256("constraint_commitment")));
        
        proof.friCommitments = new bytes32[](10);
        for (uint256 i = 0; i < 10; i++) {
            proof.friCommitments[i] = bytes32(uint256(keccak256(abi.encodePacked("fri", i))));
        }
        
        proof.traceEvaluations = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            proof.traceEvaluations[i] = uint256(keccak256(abi.encodePacked("trace_eval", i)));
        }
        
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
