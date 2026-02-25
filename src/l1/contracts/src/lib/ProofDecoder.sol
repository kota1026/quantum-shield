// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SHA3_256} from "../libraries/SHA3_256.sol";
import {SHA3Hasher} from "../libraries/SHA3Hasher.sol";
import {ProofCompressor} from "./ProofCompressor.sol";

/**
 * @title ProofDecoder
 * @author Quantum Shield Team
 * @notice STARK proof decompression for verification
 * @dev IMPL-014: Implements proof decompression paired with ProofCompressor
 * 
 * ## Overview
 * This contract decompresses STARK proofs that were compressed by ProofCompressor.
 * Target: Decompression gas < 100,000 gas
 * 
 * ## CP-1 Compliance (Quantum Resistance)
 * - Uses ONLY SHA3-256 (FIPS 202) for all hash operations
 * - keccak256 is PROHIBITED
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 0.1.0
 */
contract ProofDecoder {
    using SHA3Hasher for bytes;

    // =========================================================================
    // State
    // =========================================================================

    /// @notice Reference to the compressor for version compatibility
    ProofCompressor public immutable compressor;

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Expected version for compatibility
    uint32 public constant EXPECTED_VERSION = 1;

    /// @notice Maximum decompressed size to prevent DoS
    uint256 public constant MAX_DECOMPRESSED_SIZE = 100000; // 100KB

    // =========================================================================
    // Errors
    // =========================================================================

    error InvalidVersion(uint32 found, uint32 expected);
    error InvalidFormat();
    error DataTruncated();
    error DecompressedSizeTooLarge();
    error InvalidCompressedData();

    // =========================================================================
    // Constructor
    // =========================================================================

    /**
     * @notice Deploy ProofDecoder with compressor reference
     * @param _compressor Address of ProofCompressor contract
     */
    constructor(address _compressor) {
        compressor = ProofCompressor(_compressor);
    }

    // =========================================================================
    // Version Information
    // =========================================================================

    function getVersion() external pure returns (string memory name, string memory version) {
        return ("ProofDecoder", "0.1.0");
    }

    // =========================================================================
    // Merkle Path Decompression
    // =========================================================================

    /**
     * @notice Decompress a Merkle proof path
     * @param compressed Compressed path data from ProofCompressor
     * @return siblings Decompressed array of sibling hashes
     */
    function decompressMerklePath(bytes calldata compressed) external pure returns (bytes32[] memory siblings) {
        if (compressed.length < 16) {
            revert DataTruncated();
        }

        // Parse header
        uint32 version = uint32(bytes4(compressed[0:4]));
        // uint32 flags = uint32(bytes4(compressed[4:8])); // Available for future use
        uint32 depth = uint32(bytes4(compressed[8:12]));
        // uint32 reserved = uint32(bytes4(compressed[12:16]));

        if (version != EXPECTED_VERSION) {
            revert InvalidVersion(version, EXPECTED_VERSION);
        }

        siblings = new bytes32[](depth);
        
        if (depth == 0) {
            return siblings;
        }

        // Decompress RLE-encoded siblings
        uint256 offset = 16;
        uint256 siblingIndex = 0;
        
        while (siblingIndex < depth && offset < compressed.length) {
            uint8 typeCode = uint8(compressed[offset]);
            offset++;
            
            if (typeCode == 0) {
                // Raw value: next 32 bytes
                if (offset + 32 > compressed.length) {
                    revert DataTruncated();
                }
                siblings[siblingIndex] = bytes32(compressed[offset:offset+32]);
                offset += 32;
                siblingIndex++;
            } else if (typeCode == 1) {
                // Zero run: next byte is count
                if (offset >= compressed.length) {
                    revert DataTruncated();
                }
                uint8 runLength = uint8(compressed[offset]);
                offset++;
                
                for (uint256 j = 0; j < runLength && siblingIndex < depth; j++) {
                    siblings[siblingIndex] = bytes32(0);
                    siblingIndex++;
                }
            } else if (typeCode == 2) {
                // Repeated value: next byte is count, then 32-byte value
                if (offset + 33 > compressed.length) {
                    revert DataTruncated();
                }
                uint8 runLength = uint8(compressed[offset]);
                offset++;
                bytes32 value = bytes32(compressed[offset:offset+32]);
                offset += 32;
                
                for (uint256 j = 0; j < runLength && siblingIndex < depth; j++) {
                    siblings[siblingIndex] = value;
                    siblingIndex++;
                }
            } else {
                revert InvalidCompressedData();
            }
        }
        
        if (siblingIndex < depth) {
            revert DataTruncated();
        }
    }

    // =========================================================================
    // Evaluation Decompression
    // =========================================================================

    /**
     * @notice Decompress evaluation values
     * @param compressed Compressed evaluation data
     * @return evaluations Decompressed array of field elements
     */
    function decompressEvaluations(bytes calldata compressed) external pure returns (uint256[] memory evaluations) {
        if (compressed.length < 16) {
            revert DataTruncated();
        }

        // Parse header
        uint32 version = uint32(bytes4(compressed[0:4]));
        // uint32 flags = uint32(bytes4(compressed[4:8]));
        uint32 count = uint32(bytes4(compressed[8:12]));
        // uint32 reserved = uint32(bytes4(compressed[12:16]));

        if (version != EXPECTED_VERSION) {
            revert InvalidVersion(version, EXPECTED_VERSION);
        }

        evaluations = new uint256[](count);
        
        if (count == 0) {
            return evaluations;
        }

        uint256 offset = 16;
        
        // First value is stored in full
        if (offset + 32 > compressed.length) {
            revert DataTruncated();
        }
        evaluations[0] = uint256(bytes32(compressed[offset:offset+32]));
        offset += 32;

        // Decode remaining values
        for (uint256 i = 1; i < count; i++) {
            if (offset >= compressed.length) {
                revert DataTruncated();
            }
            
            uint8 typeCode = uint8(compressed[offset]);
            offset++;
            
            if (typeCode == 0) {
                // Full value
                if (offset + 32 > compressed.length) {
                    revert DataTruncated();
                }
                evaluations[i] = uint256(bytes32(compressed[offset:offset+32]));
                offset += 32;
            } else if (typeCode == 1) {
                // Small delta (2 bytes)
                if (offset + 2 > compressed.length) {
                    revert DataTruncated();
                }
                int16 delta = int16(uint16(bytes2(compressed[offset:offset+2])));
                offset += 2;
                evaluations[i] = uint256(int256(evaluations[i-1]) + int256(delta));
            } else if (typeCode == 2) {
                // Medium delta (4 bytes)
                if (offset + 4 > compressed.length) {
                    revert DataTruncated();
                }
                int32 delta = int32(uint32(bytes4(compressed[offset:offset+4])));
                offset += 4;
                evaluations[i] = uint256(int256(evaluations[i-1]) + int256(delta));
            } else {
                revert InvalidCompressedData();
            }
        }
    }

    // =========================================================================
    // Full STARK Proof Decompression
    // =========================================================================

    /**
     * @notice Decompress a complete STARK proof
     * @param compressed Compressed proof bytes
     * @return proof Decompressed proof structure
     */
    function decompressSTARKProof(bytes calldata compressed) 
        external 
        pure 
        returns (ProofCompressor.UncompressedProof memory proof) 
    {
        if (compressed.length < 24) {
            revert DataTruncated();
        }

        // Parse header (24 bytes)
        uint32 version = uint32(bytes4(compressed[0:4]));
        // uint32 flags = uint32(bytes4(compressed[4:8]));
        uint32 friCount = uint32(bytes4(compressed[8:12]));
        uint32 traceCount = uint32(bytes4(compressed[12:16]));
        uint32 constraintCount = uint32(bytes4(compressed[16:20]));
        // uint32 reserved = uint32(bytes4(compressed[20:24]));

        if (version != EXPECTED_VERSION) {
            revert InvalidVersion(version, EXPECTED_VERSION);
        }

        uint256 offset = 24;

        // Read commitments (64 bytes)
        if (offset + 64 > compressed.length) {
            revert DataTruncated();
        }
        proof.traceCommitment = bytes32(compressed[offset:offset+32]);
        offset += 32;
        proof.constraintCommitment = bytes32(compressed[offset:offset+32]);
        offset += 32;

        // Read FRI commitments
        if (friCount > 0) {
            if (offset + 2 > compressed.length) {
                revert DataTruncated();
            }
            uint16 friLength = uint16(bytes2(compressed[offset:offset+2]));
            offset += 2;
            
            proof.friCommitments = new bytes32[](friLength);
            for (uint256 i = 0; i < friLength; i++) {
                if (offset + 32 > compressed.length) {
                    revert DataTruncated();
                }
                proof.friCommitments[i] = bytes32(compressed[offset:offset+32]);
                offset += 32;
            }
        } else {
            proof.friCommitments = new bytes32[](0);
        }

        // Read trace evaluations
        if (traceCount > 0) {
            (proof.traceEvaluations, offset) = _decompressEvaluationsInternal(compressed, offset);
        } else {
            proof.traceEvaluations = new uint256[](0);
        }

        // Read constraint evaluations
        if (constraintCount > 0) {
            (proof.constraintEvaluations, offset) = _decompressEvaluationsInternal(compressed, offset);
        } else {
            proof.constraintEvaluations = new uint256[](0);
        }
    }

    /**
     * @notice Internal evaluation decompression with offset tracking
     */
    function _decompressEvaluationsInternal(bytes calldata data, uint256 startOffset) 
        internal 
        pure 
        returns (uint256[] memory evals, uint256 newOffset) 
    {
        uint256 offset = startOffset;
        
        if (offset + 2 > data.length) {
            revert DataTruncated();
        }
        uint16 count = uint16(bytes2(data[offset:offset+2]));
        offset += 2;
        
        evals = new uint256[](count);
        
        if (count == 0) {
            return (evals, offset);
        }

        // First value
        if (offset + 32 > data.length) {
            revert DataTruncated();
        }
        evals[0] = uint256(bytes32(data[offset:offset+32]));
        offset += 32;

        // Remaining values
        for (uint256 i = 1; i < count; i++) {
            if (offset >= data.length) {
                revert DataTruncated();
            }
            
            uint8 typeCode = uint8(data[offset]);
            offset++;
            
            if (typeCode == 0) {
                // Full value
                if (offset + 32 > data.length) {
                    revert DataTruncated();
                }
                evals[i] = uint256(bytes32(data[offset:offset+32]));
                offset += 32;
            } else if (typeCode == 1) {
                // Small delta
                if (offset + 2 > data.length) {
                    revert DataTruncated();
                }
                int16 delta = int16(uint16(bytes2(data[offset:offset+2])));
                offset += 2;
                evals[i] = uint256(int256(evals[i-1]) + int256(delta));
            } else {
                revert InvalidCompressedData();
            }
        }

        return (evals, offset);
    }

    // =========================================================================
    // Validation Functions
    // =========================================================================

    /**
     * @notice Validate compressed data format
     * @param compressed Compressed data to validate
     * @return valid True if data format is valid
     */
    function validateFormat(bytes calldata compressed) external pure returns (bool valid) {
        if (compressed.length < 16) {
            return false;
        }

        uint32 version = uint32(bytes4(compressed[0:4]));
        if (version != EXPECTED_VERSION) {
            return false;
        }

        return true;
    }

    /**
     * @notice Get compression format version from compressed data
     * @param compressed Compressed data
     * @return version Format version number
     */
    function getFormatVersion(bytes calldata compressed) external pure returns (uint32 version) {
        if (compressed.length < 4) {
            revert DataTruncated();
        }
        return uint32(bytes4(compressed[0:4]));
    }
}
