// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
     * @param proof The STARK proof to encode
     * @return encoded Serialized proof bytes
     */
    function encode(STARKProof memory proof) internal pure returns (bytes memory encoded) {
        uint256 totalSize = proofSize(proof);
        encoded = new bytes(totalSize);
        
        uint256 offset = 0;
        
        offset = _encodeBytes32(encoded, offset, proof.traceCommitment);
        offset = _encodeBytes32(encoded, offset, proof.constraintCommitment);
        offset = _encodeBytes32Array(encoded, offset, proof.friCommitments);
        offset = _encodeUint256Array(encoded, offset, proof.friChallenges);
        offset = _encodeUint256Array(encoded, offset, proof.queryIndices);
        offset = _encodeBytes32NestedArray(encoded, offset, proof.merkleProofs);
        offset = _encodeUint256NestedArray(encoded, offset, proof.evaluations);
        offset = _encodeUint256Array(encoded, offset, proof.finalPolynomial);
        
        assert(offset == totalSize);
    }

    // =========================================================================
    // Decoding Functions
    // =========================================================================

    /**
     * @notice Decode bytes to a STARKProof
     * @dev Deserializes proof from byte array
     * @param encoded Serialized proof bytes
     * @return proof Decoded STARK proof structure
     */
    function decode(bytes memory encoded) internal pure returns (STARKProof memory proof) {
        uint256 offset = 0;
        
        (proof.traceCommitment, offset) = _decodeBytes32(encoded, offset);
        (proof.constraintCommitment, offset) = _decodeBytes32(encoded, offset);
        (proof.friCommitments, offset) = _decodeBytes32Array(encoded, offset);
        (proof.friChallenges, offset) = _decodeUint256Array(encoded, offset);
        (proof.queryIndices, offset) = _decodeUint256Array(encoded, offset);
        (proof.merkleProofs, offset) = _decodeBytes32NestedArray(encoded, offset);
        (proof.evaluations, offset) = _decodeUint256NestedArray(encoded, offset);
        (proof.finalPolynomial, offset) = _decodeUint256Array(encoded, offset);
        
        assert(offset == encoded.length);
    }

    // =========================================================================
    // Size Calculation
    // =========================================================================

    /**
     * @notice Calculate the encoded size of a proof
     * @param proof The STARK proof to measure
     * @return size Size in bytes when encoded
     */
    function proofSize(STARKProof memory proof) internal pure returns (uint256 size) {
        size = 64; // 2 commitments
        size += 32 + 32 * proof.friCommitments.length;
        size += 32 + 32 * proof.friChallenges.length;
        size += 32 + 32 * proof.queryIndices.length;
        
        size += 32;
        for (uint256 i = 0; i < proof.merkleProofs.length; i++) {
            size += 32 + 32 * proof.merkleProofs[i].length;
        }
        
        size += 32;
        for (uint256 i = 0; i < proof.evaluations.length; i++) {
            size += 32 + 32 * proof.evaluations[i].length;
        }
        
        size += 32 + 32 * proof.finalPolynomial.length;
    }

    // =========================================================================
    // Internal Encoding Helpers
    // =========================================================================

    function _encodeBytes32(bytes memory buffer, uint256 offset, bytes32 value) private pure returns (uint256) {
        assembly { mstore(add(add(buffer, 32), offset), value) }
        return offset + 32;
    }

    function _encodeUint256(bytes memory buffer, uint256 offset, uint256 value) private pure returns (uint256) {
        assembly { mstore(add(add(buffer, 32), offset), value) }
        return offset + 32;
    }

    function _encodeBytes32Array(bytes memory buffer, uint256 offset, bytes32[] memory arr) private pure returns (uint256) {
        offset = _encodeUint256(buffer, offset, arr.length);
        for (uint256 i = 0; i < arr.length;) {
            offset = _encodeBytes32(buffer, offset, arr[i]);
            unchecked { ++i; }
        }
        return offset;
    }

    function _encodeUint256Array(bytes memory buffer, uint256 offset, uint256[] memory arr) private pure returns (uint256) {
        offset = _encodeUint256(buffer, offset, arr.length);
        for (uint256 i = 0; i < arr.length;) {
            offset = _encodeUint256(buffer, offset, arr[i]);
            unchecked { ++i; }
        }
        return offset;
    }

    function _encodeBytes32NestedArray(bytes memory buffer, uint256 offset, bytes32[][] memory arr) private pure returns (uint256) {
        offset = _encodeUint256(buffer, offset, arr.length);
        for (uint256 i = 0; i < arr.length;) {
            offset = _encodeBytes32Array(buffer, offset, arr[i]);
            unchecked { ++i; }
        }
        return offset;
    }

    function _encodeUint256NestedArray(bytes memory buffer, uint256 offset, uint256[][] memory arr) private pure returns (uint256) {
        offset = _encodeUint256(buffer, offset, arr.length);
        for (uint256 i = 0; i < arr.length;) {
            offset = _encodeUint256Array(buffer, offset, arr[i]);
            unchecked { ++i; }
        }
        return offset;
    }

    // =========================================================================
    // Internal Decoding Helpers
    // =========================================================================

    function _decodeBytes32(bytes memory buffer, uint256 offset) private pure returns (bytes32 value, uint256) {
        assembly { value := mload(add(add(buffer, 32), offset)) }
        return (value, offset + 32);
    }

    function _decodeUint256(bytes memory buffer, uint256 offset) private pure returns (uint256 value, uint256) {
        assembly { value := mload(add(add(buffer, 32), offset)) }
        return (value, offset + 32);
    }

    function _decodeBytes32Array(bytes memory buffer, uint256 offset) private pure returns (bytes32[] memory arr, uint256) {
        uint256 length;
        (length, offset) = _decodeUint256(buffer, offset);
        arr = new bytes32[](length);
        for (uint256 i = 0; i < length;) {
            (arr[i], offset) = _decodeBytes32(buffer, offset);
            unchecked { ++i; }
        }
        return (arr, offset);
    }

    function _decodeUint256Array(bytes memory buffer, uint256 offset) private pure returns (uint256[] memory arr, uint256) {
        uint256 length;
        (length, offset) = _decodeUint256(buffer, offset);
        arr = new uint256[](length);
        for (uint256 i = 0; i < length;) {
            (arr[i], offset) = _decodeUint256(buffer, offset);
            unchecked { ++i; }
        }
        return (arr, offset);
    }

    function _decodeBytes32NestedArray(bytes memory buffer, uint256 offset) private pure returns (bytes32[][] memory arr, uint256) {
        uint256 outerLength;
        (outerLength, offset) = _decodeUint256(buffer, offset);
        arr = new bytes32[][](outerLength);
        for (uint256 i = 0; i < outerLength;) {
            (arr[i], offset) = _decodeBytes32Array(buffer, offset);
            unchecked { ++i; }
        }
        return (arr, offset);
    }

    function _decodeUint256NestedArray(bytes memory buffer, uint256 offset) private pure returns (uint256[][] memory arr, uint256) {
        uint256 outerLength;
        (outerLength, offset) = _decodeUint256(buffer, offset);
        arr = new uint256[][](outerLength);
        for (uint256 i = 0; i < outerLength;) {
            (arr[i], offset) = _decodeUint256Array(buffer, offset);
            unchecked { ++i; }
        }
        return (arr, offset);
    }

    /**
     * @notice Get library information
     */
    function getInfo() internal pure returns (string memory name, string memory version) {
        return ("ProofCodec", "1.0.0");
    }
}
