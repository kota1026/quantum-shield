// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SHA3_256} from "../libraries/SHA3_256.sol";
import {SHA3Hasher} from "../libraries/SHA3Hasher.sol";

/**
 * @title ProofCompressor
 * @author Quantum Shield Team
 * @notice STARK proof compression for gas optimization
 * @dev IMPL-012/013: Implements proof compression for Week 10 targets
 * 
 * ## Overview
 * This contract provides compression for STARK proofs to reduce calldata costs.
 * Target: 50%+ compression ratio for proof data.
 * 
 * ## Compression Techniques
 * 1. **Merkle Path Compression**: Run-length encoding for repeated patterns
 * 2. **Evaluation Compression**: Delta encoding for sequential values
 * 3. **Challenge Re-computation**: Store seeds instead of full challenges
 * 
 * ## CP-1 Compliance (Quantum Resistance)
 * - Uses ONLY SHA3-256 (FIPS 202) for all hash operations
 * - keccak256 is PROHIBITED
 * - Domain separation for security
 * 
 * ## Format
 * Compressed data format:
 * [4 bytes: version] [4 bytes: flags] [variable: compressed data]
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 0.1.0
 */
contract ProofCompressor {
    using SHA3Hasher for bytes;
    using SHA3Hasher for bytes32;

    // =========================================================================
    // Types
    // =========================================================================

    struct UncompressedProof {
        bytes32 traceCommitment;
        bytes32 constraintCommitment;
        bytes32[] friCommitments;
        uint256[] traceEvaluations;
        uint256[] constraintEvaluations;
    }

    struct CompressionHeader {
        uint32 version;
        uint32 flags;
        uint32 merklePathCount;
        uint32 evaluationCount;
    }

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Current compression format version
    uint32 public constant VERSION = 1;

    /// @notice Maximum Merkle tree depth
    uint256 public constant MAX_DEPTH = 32;

    /// @notice Maximum batch size for compression
    uint256 public constant MAX_BATCH_SIZE = 100;

    /// @notice Domain separator for compression hashing
    bytes32 private constant DOMAIN_COMPRESS = bytes32("QS_COMPRESS_V1");

    // Compression flags
    uint32 private constant FLAG_RLE_ENABLED = 1 << 0;
    uint32 private constant FLAG_DELTA_ENABLED = 1 << 1;
    uint32 private constant FLAG_COMMITMENTS_INCLUDED = 1 << 2;

    // =========================================================================
    // Errors
    // =========================================================================

    error PathTooDeep();
    error InvalidInput();
    error BatchTooLarge();

    // =========================================================================
    // Events
    // =========================================================================

    event ProofCompressed(
        bytes32 indexed proofHash,
        uint256 originalSize,
        uint256 compressedSize
    );

    // =========================================================================
    // Version Information
    // =========================================================================

    function getVersion() external pure returns (string memory name, string memory version) {
        return ("ProofCompressor", "0.1.0");
    }

    // =========================================================================
    // Merkle Path Compression
    // =========================================================================

    /**
     * @notice Compress a Merkle proof path
     * @dev Uses run-length encoding for repeated patterns
     * @param siblings Array of sibling hashes
     * @return compressed Compressed path data
     */
    function compressMerklePath(bytes32[] calldata siblings) external pure returns (bytes memory compressed) {
        if (siblings.length > MAX_DEPTH) {
            revert PathTooDeep();
        }

        // Header: [version:4][flags:4][depth:4][reserved:4]
        uint32 flags = FLAG_RLE_ENABLED;
        
        // For simple implementation, use basic encoding
        // Format: [header:16][length:4][siblings...]
        compressed = abi.encodePacked(
            VERSION,
            flags,
            uint32(siblings.length),
            uint32(0) // reserved
        );

        // Check for compression opportunities
        if (siblings.length > 0) {
            bytes memory compressedSiblings = _compressSiblingsRLE(siblings);
            compressed = abi.encodePacked(compressed, compressedSiblings);
        }
    }

    /**
     * @notice RLE compress siblings with zero-run optimization
     * @dev Encodes runs of zeros efficiently
     */
    function _compressSiblingsRLE(bytes32[] calldata siblings) internal pure returns (bytes memory) {
        // Simple RLE: [type:1][data...]
        // Type 0: raw siblings
        // Type 1: zero run (followed by count)
        // Type 2: repeated value (followed by count + value)

        bytes memory result;
        uint256 i = 0;
        
        while (i < siblings.length) {
            // Check for zero runs
            uint256 zeroRunLength = 0;
            while (i + zeroRunLength < siblings.length && siblings[i + zeroRunLength] == bytes32(0)) {
                zeroRunLength++;
            }
            
            if (zeroRunLength >= 2) {
                // Encode zero run
                result = abi.encodePacked(result, uint8(1), uint8(zeroRunLength));
                i += zeroRunLength;
            } else if (zeroRunLength == 1) {
                // Single zero - encode as raw
                result = abi.encodePacked(result, uint8(0), siblings[i]);
                i++;
            } else {
                // Check for repeated non-zero values
                uint256 repeatLength = 1;
                while (i + repeatLength < siblings.length && 
                       siblings[i + repeatLength] == siblings[i] &&
                       repeatLength < 255) {
                    repeatLength++;
                }
                
                if (repeatLength >= 3) {
                    // Encode repeated value
                    result = abi.encodePacked(result, uint8(2), uint8(repeatLength), siblings[i]);
                    i += repeatLength;
                } else {
                    // Encode raw value(s)
                    for (uint256 j = 0; j < repeatLength; j++) {
                        result = abi.encodePacked(result, uint8(0), siblings[i + j]);
                    }
                    i += repeatLength;
                }
            }
        }
        
        return result;
    }

    // =========================================================================
    // Evaluation Compression
    // =========================================================================

    /**
     * @notice Compress evaluation values
     * @dev Uses delta encoding for sequential values
     * @param evaluations Array of field element evaluations
     * @return compressed Compressed evaluation data
     */
    function compressEvaluations(uint256[] calldata evaluations) external pure returns (bytes memory compressed) {
        if (evaluations.length == 0) {
            return abi.encodePacked(VERSION, FLAG_DELTA_ENABLED, uint32(0), uint32(0));
        }

        uint32 flags = FLAG_DELTA_ENABLED;
        
        // Header
        compressed = abi.encodePacked(
            VERSION,
            flags,
            uint32(evaluations.length),
            uint32(0) // reserved
        );

        // First value stored in full
        compressed = abi.encodePacked(compressed, evaluations[0]);

        // Subsequent values as deltas where beneficial
        for (uint256 i = 1; i < evaluations.length; i++) {
            int256 delta = int256(evaluations[i]) - int256(evaluations[i-1]);
            
            // If delta fits in smaller representation, use it
            if (delta >= -32768 && delta <= 32767) {
                // Small delta: 2 bytes
                compressed = abi.encodePacked(compressed, uint8(1), int16(delta));
            } else if (delta >= -2147483648 && delta <= 2147483647) {
                // Medium delta: 4 bytes
                compressed = abi.encodePacked(compressed, uint8(2), int32(delta));
            } else {
                // Full value: 32 bytes
                compressed = abi.encodePacked(compressed, uint8(0), evaluations[i]);
            }
        }
    }

    // =========================================================================
    // Full STARK Proof Compression
    // =========================================================================

    /**
     * @notice Compress a complete STARK proof
     * @param proof Uncompressed proof structure
     * @return compressed Compressed proof bytes
     */
    function compressSTARKProof(UncompressedProof calldata proof) external pure returns (bytes memory compressed) {
        uint32 flags = FLAG_RLE_ENABLED | FLAG_DELTA_ENABLED | FLAG_COMMITMENTS_INCLUDED;
        
        // Header
        compressed = abi.encodePacked(
            VERSION,
            flags,
            uint32(proof.friCommitments.length),
            uint32(proof.traceEvaluations.length),
            uint32(proof.constraintEvaluations.length),
            uint32(0) // reserved
        );

        // Commitments (stored raw - 64 bytes total)
        compressed = abi.encodePacked(
            compressed,
            proof.traceCommitment,
            proof.constraintCommitment
        );

        // FRI commitments (check for patterns)
        if (proof.friCommitments.length > 0) {
            bytes memory friCompressed = _compressFRICommitments(proof.friCommitments);
            compressed = abi.encodePacked(compressed, friCompressed);
        }

        // Evaluations with delta encoding
        if (proof.traceEvaluations.length > 0) {
            bytes memory traceCompressed = _compressEvaluationsInternal(proof.traceEvaluations);
            compressed = abi.encodePacked(compressed, traceCompressed);
        }

        if (proof.constraintEvaluations.length > 0) {
            bytes memory constraintCompressed = _compressEvaluationsInternal(proof.constraintEvaluations);
            compressed = abi.encodePacked(compressed, constraintCompressed);
        }
    }

    /**
     * @notice Compress FRI commitments
     */
    function _compressFRICommitments(bytes32[] calldata commitments) internal pure returns (bytes memory) {
        // FRI commitments typically have no patterns, store raw with length prefix
        bytes memory result = abi.encodePacked(uint16(commitments.length));
        for (uint256 i = 0; i < commitments.length; i++) {
            result = abi.encodePacked(result, commitments[i]);
        }
        return result;
    }

    /**
     * @notice Internal evaluation compression
     */
    function _compressEvaluationsInternal(uint256[] calldata evals) internal pure returns (bytes memory) {
        if (evals.length == 0) {
            return abi.encodePacked(uint16(0));
        }

        bytes memory result = abi.encodePacked(uint16(evals.length), evals[0]);

        for (uint256 i = 1; i < evals.length; i++) {
            // Check if value can be compressed
            if (evals[i] < type(uint64).max && evals[i-1] < type(uint64).max) {
                int256 delta = int256(evals[i]) - int256(evals[i-1]);
                if (delta >= -32768 && delta <= 32767) {
                    result = abi.encodePacked(result, uint8(1), int16(delta));
                    continue;
                }
            }
            // Full value
            result = abi.encodePacked(result, uint8(0), evals[i]);
        }

        return result;
    }

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /**
     * @notice Calculate compression ratio
     * @param originalSize Original data size in bytes
     * @param compressedSize Compressed data size in bytes
     * @return ratio Compression ratio as percentage * 100 (e.g., 5000 = 50%)
     */
    function getCompressionRatio(uint256 originalSize, uint256 compressedSize) 
        external 
        pure 
        returns (uint256 ratio) 
    {
        if (originalSize == 0) return 10000;
        return (compressedSize * 10000) / originalSize;
    }

    /**
     * @notice Hash data for compression metadata (CP-1 compliant)
     * @param data Data to hash
     * @return hash SHA3-256 hash
     */
    function hashForCompression(bytes32 data) external pure returns (bytes32 hash) {
        return SHA3Hasher.hash(abi.encodePacked(DOMAIN_COMPRESS, data));
    }

    /**
     * @notice Estimate compressed size for a proof
     * @param proof Uncompressed proof
     * @return estimatedSize Estimated compressed size in bytes
     */
    function estimateCompressedSize(UncompressedProof calldata proof) 
        external 
        pure 
        returns (uint256 estimatedSize) 
    {
        // Header: 24 bytes
        estimatedSize = 24;
        
        // Commitments: 64 bytes (raw)
        estimatedSize += 64;
        
        // FRI commitments: 2 + 32 * count
        estimatedSize += 2 + 32 * proof.friCommitments.length;
        
        // Evaluations: estimated 50% compression
        // Trace: first value (32) + deltas (~4 per remaining)
        estimatedSize += 2 + 32 + (proof.traceEvaluations.length > 0 ? (proof.traceEvaluations.length - 1) * 5 : 0);
        
        // Constraints: same estimate
        estimatedSize += 2 + 32 + (proof.constraintEvaluations.length > 0 ? (proof.constraintEvaluations.length - 1) * 5 : 0);
    }
}
