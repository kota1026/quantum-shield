// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProofCodec
 * @author Quantum Shield Team
 * @notice STARK proof encoding and decoding library
 * @dev Provides serialization/deserialization for ZK-STARK proofs
 * 
 * CP-1 Compliance:
 * - No cryptographic operations (uses SHA3Hasher for hashing)
 * - Pure serialization logic only
 * 
 * Proof Structure:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        STARKProof                               │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  traceCommitment      │ bytes32    │ Trace polynomial commit   │
 * │  constraintCommitment │ bytes32    │ Constraint polynomial     │
 * │  friCommitments[]     │ bytes32[]  │ FRI layer commitments     │
 * │  friChallenges[]      │ uint256[]  │ Verifier challenges       │
 * │  queryIndices[]       │ uint256[]  │ Random query positions    │
 * │  merkleProofs[][]     │ bytes32[][]│ Merkle authentication     │
 * │  evaluations[][]      │ uint256[][]│ Polynomial evaluations    │
 * │  finalPolynomial[]    │ uint256[]  │ Low-degree polynomial     │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * Encoding Format:
 * - All lengths are encoded as uint256 (32 bytes)
 * - bytes32 values are stored directly (32 bytes)
 * - uint256 values are stored directly (32 bytes)
 * - Nested arrays store outer length, then inner lengths and data
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 1.0.0
 */
library ProofCodec {
    // =========================================================================
    // Data Structures
    // =========================================================================

    /**
     * @notice STARK proof structure
     * @dev Contains all components needed for proof verification
     * 
     * @param traceCommitment Merkle root of trace polynomial evaluations
     * @param constraintCommitment Merkle root of constraint polynomial
     * @param friCommitments Array of FRI layer commitments
     * @param friChallenges Verifier-chosen challenges for each FRI layer
     * @param queryIndices Random positions to query
     * @param merkleProofs Merkle authentication paths for each query
     * @param evaluations Polynomial evaluations at query positions
     * @param finalPolynomial Coefficients of the final low-degree polynomial
     */
    struct STARKProof {
        bytes32 traceCommitment;
        bytes32 constraintCommitment;
        bytes32[] friCommitments;
        uint256[] friChallenges;
        uint256[] queryIndices;
        bytes32[][] merkleProofs;
        uint256[][] evaluations;
        uint256[] finalPolynomial;
    }

    // =========================================================================
    // Encoding Functions
    // =========================================================================

    /**
     * @notice Encode a STARKProof to bytes
     * @dev Serializes all proof components into a single byte array
     * 
     * @param proof The STARK proof to encode
     * @return encoded Serialized proof bytes
     * 
     * @custom:format
     * [traceCommitment (32)] 
     * [constraintCommitment (32)]
     * [friCommitments length (32)] [friCommitments data]
     * [friChallenges length (32)] [friChallenges data]
     * [queryIndices length (32)] [queryIndices data]
     * [merkleProofs outer length (32)] [inner lengths and data]
     * [evaluations outer length (32)] [inner lengths and data]
     * [finalPolynomial length (32)] [finalPolynomial data]
     * 
     * @custom:gas Approximately 50-100k gas for typical proofs
     */
    function encode(STARKProof memory proof) internal pure returns (bytes memory encoded) {
        // Calculate total size for preallocation
        uint256 totalSize = proofSize(proof);
        encoded = new bytes(totalSize);
        
        uint256 offset = 0;
        
        // Encode commitments
        offset = _encodeBytes32(encoded, offset, proof.traceCommitment);
        offset = _encodeBytes32(encoded, offset, proof.constraintCommitment);
        
        // Encode simple arrays
        offset = _encodeBytes32Array(encoded, offset, proof.friCommitments);
        offset = _encodeUint256Array(encoded, offset, proof.friChallenges);
        offset = _encodeUint256Array(encoded, offset, proof.queryIndices);
        
        // Encode nested arrays
        offset = _encodeBytes32NestedArray(encoded, offset, proof.merkleProofs);
        offset = _encodeUint256NestedArray(encoded, offset, proof.evaluations);
        
        // Encode final polynomial
        offset = _encodeUint256Array(encoded, offset, proof.finalPolynomial);
        
        // Verify we used exact amount of space
        assert(offset == totalSize);
    }

    // =========================================================================
    // Decoding Functions
    // =========================================================================

    /**
     * @notice Decode bytes to a STARKProof
     * @dev Deserializes proof from byte array
     * 
     * @param encoded Serialized proof bytes
     * @return proof Decoded STARK proof structure
     * 
     * @custom:note Reverts if data is malformed or truncated
     * @custom:gas Approximately 50-100k gas for typical proofs
     */
    function decode(bytes memory encoded) internal pure returns (STARKProof memory proof) {
        uint256 offset = 0;
        
        // Decode commitments
        (proof.traceCommitment, offset) = _decodeBytes32(encoded, offset);
        (proof.constraintCommitment, offset) = _decodeBytes32(encoded, offset);
        
        // Decode simple arrays
        (proof.friCommitments, offset) = _decodeBytes32Array(encoded, offset);
        (proof.friChallenges, offset) = _decodeUint256Array(encoded, offset);
        (proof.queryIndices, offset) = _decodeUint256Array(encoded, offset);
        
        // Decode nested arrays
        (proof.merkleProofs, offset) = _decodeBytes32NestedArray(encoded, offset);
        (proof.evaluations, offset) = _decodeUint256NestedArray(encoded, offset);
        
        // Decode final polynomial
        (proof.finalPolynomial, offset) = _decodeUint256Array(encoded, offset);
        
        // Verify we consumed all bytes
        assert(offset == encoded.length);
    }

    // =========================================================================
    // Size Calculation
    // =========================================================================

    /**
     * @notice Calculate the encoded size of a proof
     * @dev Useful for gas estimation and buffer allocation
     * 
     * @param proof The STARK proof to measure
     * @return size Size in bytes when encoded
     * 
     * @custom:formula
     * size = 64 (commitments)
     *      + 32 + 32 * friCommitments.length
     *      + 32 + 32 * friChallenges.length
     *      + 32 + 32 * queryIndices.length
     *      + 32 + sum(32 + 32 * merkleProofs[i].length)
     *      + 32 + sum(32 + 32 * evaluations[i].length)
     *      + 32 + 32 * finalPolynomial.length
     */
    function proofSize(STARKProof memory proof) internal pure returns (uint256 size) {
        // Fixed size: 2 commitments
        size = 64;
        
        // friCommitments: length + data
        size += 32 + 32 * proof.friCommitments.length;
        
        // friChallenges: length + data
        size += 32 + 32 * proof.friChallenges.length;
        
        // queryIndices: length + data
        size += 32 + 32 * proof.queryIndices.length;
        
        // merkleProofs: outer length + (inner length + data) for each
        size += 32; // outer length
        for (uint256 i = 0; i < proof.merkleProofs.length; i++) {
            size += 32 + 32 * proof.merkleProofs[i].length;
        }
        
        // evaluations: outer length + (inner length + data) for each
        size += 32; // outer length
        for (uint256 i = 0; i < proof.evaluations.length; i++) {
            size += 32 + 32 * proof.evaluations[i].length;
        }
        
        // finalPolynomial: length + data
        size += 32 + 32 * proof.finalPolynomial.length;
    }

    // =========================================================================
    // Internal Encoding Helpers
    // =========================================================================

    function _encodeBytes32(
        bytes memory buffer,
        uint256 offset,
        bytes32 value
    ) private pure returns (uint256 newOffset) {
        assembly {
            mstore(add(add(buffer, 32), offset), value)
        }
        return offset + 32;
    }

    function _encodeUint256(
        bytes memory buffer,
        uint256 offset,
        uint256 value
    ) private pure returns (uint256 newOffset) {
        assembly {
            mstore(add(add(buffer, 32), offset), value)
        }
        return offset + 32;
    }

    function _encodeBytes32Array(
        bytes memory buffer,
        uint256 offset,
        bytes32[] memory arr
    ) private pure returns (uint256 newOffset) {
        uint256 length = arr.length;
        offset = _encodeUint256(buffer, offset, length);
        
        for (uint256 i = 0; i < length;) {
            offset = _encodeBytes32(buffer, offset, arr[i]);
            unchecked { ++i; }
        }
        
        return offset;
    }

    function _encodeUint256Array(
        bytes memory buffer,
        uint256 offset,
        uint256[] memory arr
    ) private pure returns (uint256 newOffset) {
        uint256 length = arr.length;
        offset = _encodeUint256(buffer, offset, length);
        
        for (uint256 i = 0; i < length;) {
            offset = _encodeUint256(buffer, offset, arr[i]);
            unchecked { ++i; }
        }
        
        return offset;
    }

    function _encodeBytes32NestedArray(
        bytes memory buffer,
        uint256 offset,
        bytes32[][] memory arr
    ) private pure returns (uint256 newOffset) {
        uint256 outerLength = arr.length;
        offset = _encodeUint256(buffer, offset, outerLength);
        
        for (uint256 i = 0; i < outerLength;) {
            offset = _encodeBytes32Array(buffer, offset, arr[i]);
            unchecked { ++i; }
        }
        
        return offset;
    }

    function _encodeUint256NestedArray(
        bytes memory buffer,
        uint256 offset,
        uint256[][] memory arr
    ) private pure returns (uint256 newOffset) {
        uint256 outerLength = arr.length;
        offset = _encodeUint256(buffer, offset, outerLength);
        
        for (uint256 i = 0; i < outerLength;) {
            offset = _encodeUint256Array(buffer, offset, arr[i]);
            unchecked { ++i; }
        }
        
        return offset;
    }

    // =========================================================================
    // Internal Decoding Helpers
    // =========================================================================

    function _decodeBytes32(
        bytes memory buffer,
        uint256 offset
    ) private pure returns (bytes32 value, uint256 newOffset) {
        assembly {
            value := mload(add(add(buffer, 32), offset))
        }
        return (value, offset + 32);
    }

    function _decodeUint256(
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256 value, uint256 newOffset) {
        assembly {
            value := mload(add(add(buffer, 32), offset))
        }
        return (value, offset + 32);
    }

    function _decodeBytes32Array(
        bytes memory buffer,
        uint256 offset
    ) private pure returns (bytes32[] memory arr, uint256 newOffset) {
        uint256 length;
        (length, offset) = _decodeUint256(buffer, offset);
        
        arr = new bytes32[](length);
        for (uint256 i = 0; i < length;) {
            (arr[i], offset) = _decodeBytes32(buffer, offset);
            unchecked { ++i; }
        }
        
        return (arr, offset);
    }

    function _decodeUint256Array(
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256[] memory arr, uint256 newOffset) {
        uint256 length;
        (length, offset) = _decodeUint256(buffer, offset);
        
        arr = new uint256[](length);
        for (uint256 i = 0; i < length;) {
            (arr[i], offset) = _decodeUint256(buffer, offset);
            unchecked { ++i; }
        }
        
        return (arr, offset);
    }

    function _decodeBytes32NestedArray(
        bytes memory buffer,
        uint256 offset
    ) private pure returns (bytes32[][] memory arr, uint256 newOffset) {
        uint256 outerLength;
        (outerLength, offset) = _decodeUint256(buffer, offset);
        
        arr = new bytes32[][](outerLength);
        for (uint256 i = 0; i < outerLength;) {
            (arr[i], offset) = _decodeBytes32Array(buffer, offset);
            unchecked { ++i; }
        }
        
        return (arr, offset);
    }

    function _decodeUint256NestedArray(
        bytes memory buffer,
        uint256 offset
    ) private pure returns (uint256[][] memory arr, uint256 newOffset) {
        uint256 outerLength;
        (outerLength, offset) = _decodeUint256(buffer, offset);
        
        arr = new uint256[][](outerLength);
        for (uint256 i = 0; i < outerLength;) {
            (arr[i], offset) = _decodeUint256Array(buffer, offset);
            unchecked { ++i; }
        }
        
        return (arr, offset);
    }

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /**
     * @notice Get library information
     * @return name Library name
     * @return version Version string
     */
    function getInfo() internal pure returns (
        string memory name,
        string memory version
    ) {
        return ("ProofCodec", "1.0.0");
    }
}
