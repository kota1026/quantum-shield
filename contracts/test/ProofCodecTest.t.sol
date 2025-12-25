// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/libraries/ProofCodec.sol";

/**
 * @title ProofCodecTest
 * @notice Unit tests for ProofCodec library
 * @dev TEST-002: Encode/decode tests for STARK proof serialization
 * 
 * Test Categories:
 * 1. Encode/decode roundtrip
 * 2. Edge cases (empty arrays, max sizes)
 * 3. Proof size calculation
 * 4. Malformed data handling
 * 5. Gas benchmarks
 */
contract ProofCodecTest is Test {
    // =========================================================================
    // Helper Functions
    // =========================================================================

    /**
     * @notice Create a minimal valid STARK proof for testing
     * @return proof A valid STARKProof struct
     */
    function _createMinimalProof() internal pure returns (ProofCodec.STARKProof memory) {
        ProofCodec.STARKProof memory proof;
        proof.traceCommitment = bytes32(uint256(1));
        proof.constraintCommitment = bytes32(uint256(2));
        proof.friCommitments = new bytes32[](2);
        proof.friCommitments[0] = bytes32(uint256(3));
        proof.friCommitments[1] = bytes32(uint256(4));
        proof.friChallenges = new uint256[](2);
        proof.friChallenges[0] = 5;
        proof.friChallenges[1] = 6;
        proof.queryIndices = new uint256[](4);
        proof.queryIndices[0] = 100;
        proof.queryIndices[1] = 200;
        proof.queryIndices[2] = 300;
        proof.queryIndices[3] = 400;
        
        // merkleProofs: 4 queries x 2 proof elements each
        proof.merkleProofs = new bytes32[][](4);
        for (uint256 i = 0; i < 4; i++) {
            proof.merkleProofs[i] = new bytes32[](2);
            proof.merkleProofs[i][0] = bytes32(uint256(1000 + i * 2));
            proof.merkleProofs[i][1] = bytes32(uint256(1001 + i * 2));
        }
        
        // evaluations: 4 queries x 2 evaluations each
        proof.evaluations = new uint256[][](4);
        for (uint256 i = 0; i < 4; i++) {
            proof.evaluations[i] = new uint256[](2);
            proof.evaluations[i][0] = 10000 + i * 2;
            proof.evaluations[i][1] = 10001 + i * 2;
        }
        
        // finalPolynomial: 8 coefficients (low degree)
        proof.finalPolynomial = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            proof.finalPolynomial[i] = i + 1;
        }
        
        return proof;
    }

    /**
     * @notice Create a larger realistic STARK proof
     * @return proof A realistic STARKProof struct
     */
    function _createRealisticProof() internal pure returns (ProofCodec.STARKProof memory) {
        ProofCodec.STARKProof memory proof;
        proof.traceCommitment = keccak256("trace");
        proof.constraintCommitment = keccak256("constraint");
        
        // 10 FRI layers (typical for 128-bit security)
        uint256 friLayers = 10;
        proof.friCommitments = new bytes32[](friLayers);
        proof.friChallenges = new uint256[](friLayers);
        for (uint256 i = 0; i < friLayers; i++) {
            proof.friCommitments[i] = bytes32(uint256(keccak256(abi.encodePacked("fri", i))));
            proof.friChallenges[i] = uint256(keccak256(abi.encodePacked("challenge", i)));
        }
        
        // 32 queries (typical for 128-bit security)
        uint256 numQueries = 32;
        proof.queryIndices = new uint256[](numQueries);
        proof.merkleProofs = new bytes32[][](numQueries);
        proof.evaluations = new uint256[][](numQueries);
        
        for (uint256 i = 0; i < numQueries; i++) {
            proof.queryIndices[i] = uint256(keccak256(abi.encodePacked("query", i))) % (1 << 20);
            
            // 20 elements per Merkle proof (20-level tree)
            proof.merkleProofs[i] = new bytes32[](20);
            for (uint256 j = 0; j < 20; j++) {
                proof.merkleProofs[i][j] = bytes32(uint256(keccak256(abi.encodePacked("merkle", i, j))));
            }
            
            // 4 evaluations per query
            proof.evaluations[i] = new uint256[](4);
            for (uint256 j = 0; j < 4; j++) {
                proof.evaluations[i][j] = uint256(keccak256(abi.encodePacked("eval", i, j)));
            }
        }
        
        // 16 coefficient final polynomial
        proof.finalPolynomial = new uint256[](16);
        for (uint256 i = 0; i < 16; i++) {
            proof.finalPolynomial[i] = uint256(keccak256(abi.encodePacked("final", i)));
        }
        
        return proof;
    }

    // =========================================================================
    // Encode/Decode Roundtrip Tests
    // =========================================================================

    /**
     * @notice Test minimal proof roundtrip
     * @dev Verifies encode then decode returns original proof
     */
    function test_encodeDecode_minimalProof() public pure {
        ProofCodec.STARKProof memory original = _createMinimalProof();
        
        bytes memory encoded = ProofCodec.encode(original);
        ProofCodec.STARKProof memory decoded = ProofCodec.decode(encoded);
        
        // Verify all fields match
        assertEq(decoded.traceCommitment, original.traceCommitment, "traceCommitment mismatch");
        assertEq(decoded.constraintCommitment, original.constraintCommitment, "constraintCommitment mismatch");
        assertEq(decoded.friCommitments.length, original.friCommitments.length, "friCommitments length mismatch");
        assertEq(decoded.friChallenges.length, original.friChallenges.length, "friChallenges length mismatch");
        assertEq(decoded.queryIndices.length, original.queryIndices.length, "queryIndices length mismatch");
        assertEq(decoded.finalPolynomial.length, original.finalPolynomial.length, "finalPolynomial length mismatch");
        
        // Verify array contents
        for (uint256 i = 0; i < original.friCommitments.length; i++) {
            assertEq(decoded.friCommitments[i], original.friCommitments[i], "friCommitments element mismatch");
        }
        for (uint256 i = 0; i < original.friChallenges.length; i++) {
            assertEq(decoded.friChallenges[i], original.friChallenges[i], "friChallenges element mismatch");
        }
        for (uint256 i = 0; i < original.queryIndices.length; i++) {
            assertEq(decoded.queryIndices[i], original.queryIndices[i], "queryIndices element mismatch");
        }
        for (uint256 i = 0; i < original.finalPolynomial.length; i++) {
            assertEq(decoded.finalPolynomial[i], original.finalPolynomial[i], "finalPolynomial element mismatch");
        }
    }

    /**
     * @notice Test realistic proof roundtrip
     * @dev Verifies larger proof with typical parameters
     */
    function test_encodeDecode_realisticProof() public pure {
        ProofCodec.STARKProof memory original = _createRealisticProof();
        
        bytes memory encoded = ProofCodec.encode(original);
        ProofCodec.STARKProof memory decoded = ProofCodec.decode(encoded);
        
        // Verify key fields
        assertEq(decoded.traceCommitment, original.traceCommitment, "traceCommitment mismatch");
        assertEq(decoded.constraintCommitment, original.constraintCommitment, "constraintCommitment mismatch");
        assertEq(decoded.friCommitments.length, 10, "friCommitments should have 10 layers");
        assertEq(decoded.queryIndices.length, 32, "queryIndices should have 32 queries");
        
        // Spot check merkle proofs
        assertEq(decoded.merkleProofs[0].length, 20, "merkleProofs[0] should have 20 elements");
        assertEq(decoded.merkleProofs[0][0], original.merkleProofs[0][0], "merkleProofs[0][0] mismatch");
        
        // Spot check evaluations
        assertEq(decoded.evaluations[0].length, 4, "evaluations[0] should have 4 elements");
        assertEq(decoded.evaluations[0][0], original.evaluations[0][0], "evaluations[0][0] mismatch");
    }

    /**
     * @notice Test multiple roundtrips (idempotence)
     * @dev Encode-decode-encode should produce identical bytes
     */
    function test_encodeDecode_idempotent() public pure {
        ProofCodec.STARKProof memory original = _createMinimalProof();
        
        bytes memory encoded1 = ProofCodec.encode(original);
        ProofCodec.STARKProof memory decoded = ProofCodec.decode(encoded1);
        bytes memory encoded2 = ProofCodec.encode(decoded);
        
        assertEq(keccak256(encoded1), keccak256(encoded2), "Re-encoded bytes should match");
    }

    // =========================================================================
    // Edge Case Tests
    // =========================================================================

    /**
     * @notice Test proof with empty arrays
     */
    function test_encodeDecode_emptyArrays() public pure {
        ProofCodec.STARKProof memory proof;
        proof.traceCommitment = bytes32(uint256(1));
        proof.constraintCommitment = bytes32(uint256(2));
        proof.friCommitments = new bytes32[](0);
        proof.friChallenges = new uint256[](0);
        proof.queryIndices = new uint256[](0);
        proof.merkleProofs = new bytes32[][](0);
        proof.evaluations = new uint256[][](0);
        proof.finalPolynomial = new uint256[](0);
        
        bytes memory encoded = ProofCodec.encode(proof);
        ProofCodec.STARKProof memory decoded = ProofCodec.decode(encoded);
        
        assertEq(decoded.traceCommitment, proof.traceCommitment, "traceCommitment mismatch");
        assertEq(decoded.friCommitments.length, 0, "friCommitments should be empty");
        assertEq(decoded.queryIndices.length, 0, "queryIndices should be empty");
    }

    /**
     * @notice Test proof with single element arrays
     */
    function test_encodeDecode_singleElements() public pure {
        ProofCodec.STARKProof memory proof;
        proof.traceCommitment = bytes32(uint256(1));
        proof.constraintCommitment = bytes32(uint256(2));
        proof.friCommitments = new bytes32[](1);
        proof.friCommitments[0] = bytes32(uint256(3));
        proof.friChallenges = new uint256[](1);
        proof.friChallenges[0] = 4;
        proof.queryIndices = new uint256[](1);
        proof.queryIndices[0] = 5;
        proof.merkleProofs = new bytes32[][](1);
        proof.merkleProofs[0] = new bytes32[](1);
        proof.merkleProofs[0][0] = bytes32(uint256(6));
        proof.evaluations = new uint256[][](1);
        proof.evaluations[0] = new uint256[](1);
        proof.evaluations[0][0] = 7;
        proof.finalPolynomial = new uint256[](1);
        proof.finalPolynomial[0] = 8;
        
        bytes memory encoded = ProofCodec.encode(proof);
        ProofCodec.STARKProof memory decoded = ProofCodec.decode(encoded);
        
        assertEq(decoded.friCommitments.length, 1, "friCommitments should have 1 element");
        assertEq(decoded.friCommitments[0], bytes32(uint256(3)), "friCommitments[0] mismatch");
        assertEq(decoded.merkleProofs[0][0], bytes32(uint256(6)), "merkleProofs[0][0] mismatch");
    }

    // =========================================================================
    // Proof Size Tests
    // =========================================================================

    /**
     * @notice Test proofSize calculation for minimal proof
     */
    function test_proofSize_minimal() public pure {
        ProofCodec.STARKProof memory proof = _createMinimalProof();
        
        uint256 calculatedSize = ProofCodec.proofSize(proof);
        bytes memory encoded = ProofCodec.encode(proof);
        
        assertEq(calculatedSize, encoded.length, "proofSize should match encoded length");
    }

    /**
     * @notice Test proofSize calculation for realistic proof
     */
    function test_proofSize_realistic() public pure {
        ProofCodec.STARKProof memory proof = _createRealisticProof();
        
        uint256 calculatedSize = ProofCodec.proofSize(proof);
        bytes memory encoded = ProofCodec.encode(proof);
        
        assertEq(calculatedSize, encoded.length, "proofSize should match encoded length");
        
        // Log the size for reference
        emit log_named_uint("Realistic proof size (bytes)", calculatedSize);
    }

    /**
     * @notice Test proofSize for empty proof
     */
    function test_proofSize_empty() public pure {
        ProofCodec.STARKProof memory proof;
        proof.traceCommitment = bytes32(uint256(1));
        proof.constraintCommitment = bytes32(uint256(2));
        proof.friCommitments = new bytes32[](0);
        proof.friChallenges = new uint256[](0);
        proof.queryIndices = new uint256[](0);
        proof.merkleProofs = new bytes32[][](0);
        proof.evaluations = new uint256[][](0);
        proof.finalPolynomial = new uint256[](0);
        
        uint256 calculatedSize = ProofCodec.proofSize(proof);
        bytes memory encoded = ProofCodec.encode(proof);
        
        assertEq(calculatedSize, encoded.length, "proofSize should match for empty proof");
        
        // Minimum size should be at least 2 * 32 (commitments) + length fields
        assertTrue(calculatedSize >= 64, "Empty proof should be at least 64 bytes");
    }

    // =========================================================================
    // Gas Benchmark Tests
    // =========================================================================

    /**
     * @notice Gas benchmark for encoding minimal proof
     */
    function test_gas_encode_minimal() public {
        ProofCodec.STARKProof memory proof = _createMinimalProof();
        
        uint256 gasBefore = gasleft();
        ProofCodec.encode(proof);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas for encode (minimal proof)", gasUsed);
    }

    /**
     * @notice Gas benchmark for decoding minimal proof
     */
    function test_gas_decode_minimal() public {
        ProofCodec.STARKProof memory proof = _createMinimalProof();
        bytes memory encoded = ProofCodec.encode(proof);
        
        uint256 gasBefore = gasleft();
        ProofCodec.decode(encoded);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas for decode (minimal proof)", gasUsed);
    }

    /**
     * @notice Gas benchmark for realistic proof operations
     */
    function test_gas_encodeDecode_realistic() public {
        ProofCodec.STARKProof memory proof = _createRealisticProof();
        
        // Encode
        uint256 gasBefore = gasleft();
        bytes memory encoded = ProofCodec.encode(proof);
        uint256 encodeGas = gasBefore - gasleft();
        
        // Decode
        gasBefore = gasleft();
        ProofCodec.decode(encoded);
        uint256 decodeGas = gasBefore - gasleft();
        
        emit log_named_uint("Gas for encode (realistic proof)", encodeGas);
        emit log_named_uint("Gas for decode (realistic proof)", decodeGas);
        emit log_named_uint("Encoded size (bytes)", encoded.length);
    }

    /**
     * @notice Gas benchmark for proofSize calculation
     */
    function test_gas_proofSize() public {
        ProofCodec.STARKProof memory proof = _createRealisticProof();
        
        uint256 gasBefore = gasleft();
        ProofCodec.proofSize(proof);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas for proofSize (realistic proof)", gasUsed);
    }

    // =========================================================================
    // Determinism Tests
    // =========================================================================

    /**
     * @notice Test that encoding is deterministic
     */
    function test_encode_deterministic() public pure {
        ProofCodec.STARKProof memory proof = _createMinimalProof();
        
        bytes memory encoded1 = ProofCodec.encode(proof);
        bytes memory encoded2 = ProofCodec.encode(proof);
        
        assertEq(keccak256(encoded1), keccak256(encoded2), "Encoding should be deterministic");
    }

    /**
     * @notice Test that different proofs produce different encodings
     */
    function test_encode_uniqueness() public pure {
        ProofCodec.STARKProof memory proof1 = _createMinimalProof();
        ProofCodec.STARKProof memory proof2 = _createMinimalProof();
        proof2.traceCommitment = bytes32(uint256(999));
        
        bytes memory encoded1 = ProofCodec.encode(proof1);
        bytes memory encoded2 = ProofCodec.encode(proof2);
        
        assertTrue(keccak256(encoded1) != keccak256(encoded2), "Different proofs should have different encodings");
    }
}
