// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/STARKVerifier.sol";
import "../src/libraries/SHA3Hasher.sol";
import "../src/libraries/ProofCodec.sol";

/**
 * @title STARKVerifierTest
 * @notice Unit tests for STARKVerifier v0.1
 * @dev Tests basic structure, interfaces, and CP-1 compliance
 * 
 * CP-1 Compliance:
 * - Verifies SHA3-256 usage (keccak256 prohibited)
 * - Confirms quantum-resistant hash operations
 */
contract STARKVerifierTest is Test {
    using SHA3Hasher for bytes;
    using SHA3Hasher for bytes32;

    // =========================================================================
    // Test State
    // =========================================================================

    STARKVerifier public verifier;

    // Test constants
    bytes32 constant TEST_COMMITMENT = bytes32(uint256(0x1234567890abcdef));
    uint256 constant TEST_DOMAIN_SIZE = 1024;

    // =========================================================================
    // Setup
    // =========================================================================

    function setUp() public {
        verifier = new STARKVerifier();
    }

    // =========================================================================
    // Basic Structure Tests
    // =========================================================================

    /**
     * @notice Test contract deployment
     */
    function test_Deploy() public view {
        assertTrue(address(verifier) != address(0), "Verifier should be deployed");
    }

    /**
     * @notice Test getVersion returns correct version
     */
    function test_GetVersion() public view {
        (string memory name, string memory version) = verifier.getVersion();
        assertEq(name, "STARKVerifier", "Name should be STARKVerifier");
        assertEq(version, "0.1.0", "Version should be 0.1.0");
    }

    /**
     * @notice Test supported security level
     */
    function test_SecurityLevel() public view {
        uint256 level = verifier.securityLevel();
        assertEq(level, 128, "Security level should be 128-bit");
    }

    // =========================================================================
    // STARKProof Structure Tests
    // =========================================================================

    /**
     * @notice Test creating empty STARKProof
     */
    function test_CreateEmptyProof() public pure {
        ProofCodec.STARKProof memory proof;
        
        assertEq(proof.traceCommitment, bytes32(0), "Empty trace commitment");
        assertEq(proof.constraintCommitment, bytes32(0), "Empty constraint commitment");
        assertEq(proof.friCommitments.length, 0, "Empty FRI commitments");
        assertEq(proof.friChallenges.length, 0, "Empty FRI challenges");
        assertEq(proof.queryIndices.length, 0, "Empty query indices");
        assertEq(proof.merkleProofs.length, 0, "Empty merkle proofs");
        assertEq(proof.evaluations.length, 0, "Empty evaluations");
        assertEq(proof.finalPolynomial.length, 0, "Empty final polynomial");
    }

    /**
     * @notice Test proof encoding and decoding roundtrip
     */
    function test_ProofEncodeDecode() public pure {
        // Create a minimal proof
        ProofCodec.STARKProof memory original = _createMinimalProof();
        
        // Encode
        bytes memory encoded = ProofCodec.encode(original);
        assertTrue(encoded.length > 0, "Encoded proof should not be empty");
        
        // Decode
        ProofCodec.STARKProof memory decoded = ProofCodec.decode(encoded);
        
        // Verify
        assertEq(decoded.traceCommitment, original.traceCommitment, "Trace commitment mismatch");
        assertEq(decoded.constraintCommitment, original.constraintCommitment, "Constraint commitment mismatch");
    }

    /**
     * @notice Test proof size calculation
     */
    function test_ProofSize() public pure {
        ProofCodec.STARKProof memory proof = _createMinimalProof();
        
        uint256 size = ProofCodec.proofSize(proof);
        bytes memory encoded = ProofCodec.encode(proof);
        
        assertEq(size, encoded.length, "Proof size should match encoded length");
    }

    // =========================================================================
    // Commitment Verification Tests
    // =========================================================================

    /**
     * @notice Test trace commitment verification
     */
    function test_VerifyTraceCommitment() public view {
        bytes32 traceRoot = SHA3Hasher.hash(abi.encodePacked("trace data"));
        bytes32 expectedCommitment = SHA3Hasher.hash(abi.encodePacked(traceRoot));
        
        bool valid = verifier.verifyTraceCommitment(traceRoot, expectedCommitment);
        assertTrue(valid, "Valid trace commitment should pass");
    }

    /**
     * @notice Test trace commitment with invalid data
     */
    function test_VerifyTraceCommitment_Invalid() public view {
        bytes32 traceRoot = SHA3Hasher.hash(abi.encodePacked("trace data"));
        bytes32 wrongCommitment = SHA3Hasher.hash(abi.encodePacked("wrong data"));
        
        bool valid = verifier.verifyTraceCommitment(traceRoot, wrongCommitment);
        assertFalse(valid, "Invalid trace commitment should fail");
    }

    /**
     * @notice Test constraint commitment verification
     */
    function test_VerifyConstraintCommitment() public view {
        bytes32 constraintRoot = SHA3Hasher.hash(abi.encodePacked("constraint data"));
        bytes32 expectedCommitment = SHA3Hasher.hash(abi.encodePacked(constraintRoot));
        
        bool valid = verifier.verifyConstraintCommitment(constraintRoot, expectedCommitment);
        assertTrue(valid, "Valid constraint commitment should pass");
    }

    // =========================================================================
    // Field Operations Tests
    // =========================================================================

    /**
     * @notice Test Goldilocks field modulus
     */
    function test_GoldilocksModulus() public view {
        uint256 modulus = verifier.FIELD_MODULUS();
        assertEq(modulus, 0xFFFFFFFF00000001, "Goldilocks modulus should be 2^64 - 2^32 + 1");
    }

    /**
     * @notice Test field addition
     */
    function test_FieldAdd() public view {
        uint256 a = 100;
        uint256 b = 200;
        uint256 modulus = verifier.FIELD_MODULUS();
        
        uint256 result = verifier.fieldAdd(a, b);
        assertEq(result, (a + b) % modulus, "Field add should work correctly");
    }

    /**
     * @notice Test field multiplication
     */
    function test_FieldMul() public view {
        uint256 a = 100;
        uint256 b = 200;
        uint256 modulus = verifier.FIELD_MODULUS();
        
        uint256 result = verifier.fieldMul(a, b);
        assertEq(result, mulmod(a, b, modulus), "Field mul should work correctly");
    }

    /**
     * @notice Test field overflow protection
     */
    function test_FieldMul_Overflow() public view {
        uint256 modulus = verifier.FIELD_MODULUS();
        uint256 a = modulus - 1;
        uint256 b = modulus - 1;
        
        uint256 result = verifier.fieldMul(a, b);
        assertTrue(result < modulus, "Result should be within field");
    }

    // =========================================================================
    // Hash Integration Tests (CP-1 Compliance)
    // =========================================================================

    /**
     * @notice Test that verifier uses SHA3-256 for hashing
     */
    function test_UsesSSHA3_256() public view {
        bytes memory testData = "test data";
        bytes32 expected = SHA3Hasher.hash(testData);
        bytes32 actual = verifier.hashData(testData);
        
        assertEq(actual, expected, "Verifier should use SHA3-256");
    }

    /**
     * @notice Test pair hashing for Merkle operations
     */
    function test_HashPair() public view {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        bytes32 expected = SHA3Hasher.hashPair(left, right);
        bytes32 actual = verifier.hashPair(left, right);
        
        assertEq(actual, expected, "Hash pair should use SHA3Hasher");
    }

    /**
     * @notice Verify NIST test vector for SHA3-256 compliance
     */
    function test_SHA3_256_NISTVector() public view {
        // NIST test vector: SHA3-256("") = a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
        bytes32 expected = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;
        bytes32 actual = verifier.hashData("");
        
        assertEq(actual, expected, "SHA3-256 should match NIST test vector");
    }

    // =========================================================================
    // Basic Verification Interface Tests
    // =========================================================================

    /**
     * @notice Test empty proof fails verification
     */
    function test_VerifyProof_EmptyFails() public view {
        ProofCodec.STARKProof memory emptyProof;
        bytes32 publicInput = bytes32(0);
        
        bool valid = verifier.verifyProof(emptyProof, publicInput);
        assertFalse(valid, "Empty proof should fail verification");
    }

    /**
     * @notice Test minimum query requirement
     */
    function test_MinimumQueryRequirement() public view {
        uint256 minQueries = verifier.MIN_QUERIES();
        assertGe(minQueries, 80, "Minimum queries should be at least 80 for 128-bit security");
    }

    /**
     * @notice Test maximum FRI layers
     */
    function test_MaxFRILayers() public view {
        uint256 maxLayers = verifier.MAX_FRI_LAYERS();
        assertGe(maxLayers, 16, "Max FRI layers should support domain sizes up to 2^16");
    }

    // =========================================================================
    // Domain Operations Tests
    // =========================================================================

    /**
     * @notice Test domain size validation
     */
    function test_ValidateDomainSize() public view {
        assertTrue(verifier.isValidDomainSize(1024), "1024 should be valid");
        assertTrue(verifier.isValidDomainSize(2048), "2048 should be valid");
        assertTrue(verifier.isValidDomainSize(65536), "65536 should be valid");
        assertFalse(verifier.isValidDomainSize(1000), "1000 should be invalid (not power of 2)");
        assertFalse(verifier.isValidDomainSize(0), "0 should be invalid");
    }

    /**
     * @notice Test domain element computation
     */
    function test_ComputeDomainElement() public view {
        uint256 domainSize = 1024;
        
        // First element should be 1
        uint256 firstElement = verifier.computeDomainElement(0, domainSize);
        assertEq(firstElement, 1, "First domain element should be 1");
        
        // Elements should be in field
        uint256 randomElement = verifier.computeDomainElement(512, domainSize);
        assertTrue(randomElement < verifier.FIELD_MODULUS(), "Element should be in field");
    }

    // =========================================================================
    // Gas Optimization Tests
    // =========================================================================

    /**
     * @notice Measure gas for hash operation
     */
    function test_HashGas() public {
        bytes memory data = abi.encodePacked(uint256(1), uint256(2), uint256(3));
        
        uint256 gasBefore = gasleft();
        verifier.hashData(data);
        uint256 gasUsed = gasBefore - gasleft();
        
        // Log for benchmarking
        emit log_named_uint("Hash gas used", gasUsed);
        
        // Should be reasonable (less than 2M gas for typical hash)
        assertTrue(gasUsed < 2_000_000, "Hash should not use excessive gas");
    }

    /**
     * @notice Measure gas for field multiplication
     */
    function test_FieldMulGas() public {
        uint256 a = 12345678901234567890;
        uint256 b = 98765432109876543210;
        
        uint256 gasBefore = gasleft();
        verifier.fieldMul(a, b);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Field mul gas used", gasUsed);
        assertTrue(gasUsed < 1000, "Field mul should be gas efficient");
    }

    // =========================================================================
    // Edge Case Tests
    // =========================================================================

    /**
     * @notice Test with maximum field values
     */
    function test_MaxFieldValues() public view {
        uint256 modulus = verifier.FIELD_MODULUS();
        uint256 maxValue = modulus - 1;
        
        uint256 addResult = verifier.fieldAdd(maxValue, maxValue);
        assertTrue(addResult < modulus, "Add result should wrap correctly");
        
        uint256 mulResult = verifier.fieldMul(maxValue, maxValue);
        assertTrue(mulResult < modulus, "Mul result should wrap correctly");
    }

    /**
     * @notice Test with zero values
     */
    function test_ZeroValues() public view {
        uint256 result = verifier.fieldMul(0, 12345);
        assertEq(result, 0, "Zero times anything should be zero");
        
        result = verifier.fieldAdd(0, 12345);
        assertEq(result, 12345, "Zero plus x should be x");
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    /**
     * @notice Fuzz test field addition
     */
    function testFuzz_FieldAdd(uint256 a, uint256 b) public view {
        uint256 modulus = verifier.FIELD_MODULUS();
        a = a % modulus;
        b = b % modulus;
        
        uint256 result = verifier.fieldAdd(a, b);
        assertTrue(result < modulus, "Result should be in field");
    }

    /**
     * @notice Fuzz test field multiplication
     */
    function testFuzz_FieldMul(uint256 a, uint256 b) public view {
        uint256 modulus = verifier.FIELD_MODULUS();
        a = a % modulus;
        b = b % modulus;
        
        uint256 result = verifier.fieldMul(a, b);
        assertTrue(result < modulus, "Result should be in field");
    }

    /**
     * @notice Fuzz test domain size validation
     */
    function testFuzz_DomainSizeValidation(uint256 size) public view {
        bool valid = verifier.isValidDomainSize(size);
        
        if (valid) {
            // Valid sizes must be powers of 2 and > 0
            assertTrue(size > 0, "Valid size must be positive");
            assertTrue((size & (size - 1)) == 0, "Valid size must be power of 2");
        }
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    /**
     * @notice Create a minimal valid proof for testing
     */
    function _createMinimalProof() internal pure returns (ProofCodec.STARKProof memory proof) {
        proof.traceCommitment = bytes32(uint256(0x1111));
        proof.constraintCommitment = bytes32(uint256(0x2222));
        proof.friCommitments = new bytes32[](2);
        proof.friCommitments[0] = bytes32(uint256(0x3333));
        proof.friCommitments[1] = bytes32(uint256(0x4444));
        proof.friChallenges = new uint256[](2);
        proof.friChallenges[0] = 100;
        proof.friChallenges[1] = 200;
        proof.queryIndices = new uint256[](1);
        proof.queryIndices[0] = 42;
        proof.merkleProofs = new bytes32[][](1);
        proof.merkleProofs[0] = new bytes32[](2);
        proof.merkleProofs[0][0] = bytes32(uint256(0x5555));
        proof.merkleProofs[0][1] = bytes32(uint256(0x6666));
        proof.evaluations = new uint256[][](1);
        proof.evaluations[0] = new uint256[](2);
        proof.evaluations[0][0] = 1000;
        proof.evaluations[0][1] = 2000;
        proof.finalPolynomial = new uint256[](2);
        proof.finalPolynomial[0] = 10;
        proof.finalPolynomial[1] = 20;
    }
}
