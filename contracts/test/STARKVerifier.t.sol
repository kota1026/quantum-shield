// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/STARKVerifier.sol";
import "../src/libraries/SHA3Hasher.sol";
import "../src/libraries/ProofCodec.sol";

/**
 * @title STARKVerifierTest
 * @notice Unit tests for STARKVerifier v1.0
 * @dev Tests basic structure, interfaces, and CP-1 compliance
 * 
 * CP-1 Compliance:
 * - Verifies SHA3-256 usage (keccak256 prohibited)
 * - Confirms quantum-resistant hash operations
 * 
 * TEST-005: Trace Commitment verification tests added
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
    uint256 constant TEST_TREE_DEPTH = 10; // For trace Merkle tree
    
    // Domain separator - MUST match STARKVerifier._hashMerkleNodes()
    bytes32 private constant DOMAIN_MERKLE_NODE = bytes32("QS_STARK_MERKLE_V1");

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
        assertEq(version, "1.0.0", "Version should be 1.0.0");
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
    // Commitment Verification Tests (Original)
    // =========================================================================

    /**
     * @notice Test trace commitment verification (simple)
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
    // TEST-005: Trace Commitment with Merkle Proof Verification
    // =========================================================================

    /**
     * @notice Test trace evaluation verification at a specific index with Merkle proof
     * @dev IMPL-005: Core functionality for trace commitment verification
     */
    function test_VerifyTraceEvaluationAtIndex() public view {
        // Build a simple Merkle tree for testing
        (bytes32 root, bytes32 leaf, uint256 index, bytes32[] memory siblings) = _buildTestMerkleTree();
        
        // Verify the evaluation
        bool valid = verifier.verifyTraceEvaluationAtIndex(
            leaf,
            index,
            siblings,
            root
        );
        assertTrue(valid, "Valid Merkle proof should pass");
    }

    /**
     * @notice Test trace evaluation with invalid Merkle proof
     */
    function test_VerifyTraceEvaluationAtIndex_InvalidProof() public view {
        (bytes32 root, bytes32 leaf, uint256 index, bytes32[] memory siblings) = _buildTestMerkleTree();
        
        // Corrupt one sibling
        siblings[0] = bytes32(uint256(0xDEADBEEF));
        
        bool valid = verifier.verifyTraceEvaluationAtIndex(
            leaf,
            index,
            siblings,
            root
        );
        assertFalse(valid, "Invalid Merkle proof should fail");
    }

    /**
     * @notice Test trace evaluation with wrong leaf value
     */
    function test_VerifyTraceEvaluationAtIndex_InvalidLeaf() public view {
        (bytes32 root, , uint256 index, bytes32[] memory siblings) = _buildTestMerkleTree();
        
        // Use wrong leaf
        bytes32 wrongLeaf = SHA3Hasher.hash(abi.encodePacked("wrong evaluation"));
        
        bool valid = verifier.verifyTraceEvaluationAtIndex(
            wrongLeaf,
            index,
            siblings,
            root
        );
        assertFalse(valid, "Wrong leaf should fail verification");
    }

    /**
     * @notice Test batch verification of trace evaluations
     */
    function test_VerifyTraceEvaluations_Batch() public view {
        // Create multiple test proofs
        uint256 numQueries = 3;
        bytes32[] memory leaves = new bytes32[](numQueries);
        uint256[] memory indices = new uint256[](numQueries);
        bytes32[][] memory allSiblings = new bytes32[][](numQueries);
        
        // Build test data
        for (uint256 i = 0; i < numQueries; i++) {
            (bytes32 root, bytes32 leaf, uint256 idx, bytes32[] memory siblings) = _buildTestMerkleTreeWithIndex(i);
            leaves[i] = leaf;
            indices[i] = idx;
            allSiblings[i] = siblings;
            
            // All should use same root for this test
            if (i == 0) {
                // Store root for later verification
            }
        }
        
        // Verify batch - each individual proof should be valid
        for (uint256 i = 0; i < numQueries; i++) {
            (bytes32 expectedRoot, , , ) = _buildTestMerkleTreeWithIndex(i);
            bool valid = verifier.verifyTraceEvaluationAtIndex(
                leaves[i],
                indices[i],
                allSiblings[i],
                expectedRoot
            );
            assertTrue(valid, "Batch proof element should be valid");
        }
    }

    /**
     * @notice Test that insufficient queries fail verification
     */
    function test_VerifyTraceEvaluations_InsufficientQueries() public view {
        // Create proof with fewer queries than minimum
        ProofCodec.STARKProof memory proof = _createMinimalProof();
        
        // Ensure query count is below minimum (80)
        assertTrue(proof.queryIndices.length < verifier.MIN_QUERIES(), "Test setup: should have fewer than MIN_QUERIES");
        
        // Verification should fail due to insufficient queries
        bool valid = verifier.verifyProof(proof, bytes32(0));
        assertFalse(valid, "Proof with insufficient queries should fail");
    }

    /**
     * @notice Test Merkle proof depth validation
     */
    function test_VerifyTraceEvaluation_DepthValidation() public view {
        (bytes32 root, bytes32 leaf, uint256 index, bytes32[] memory siblings) = _buildTestMerkleTree();
        
        // Create proof with wrong depth (too short)
        bytes32[] memory shortSiblings = new bytes32[](siblings.length - 1);
        for (uint256 i = 0; i < shortSiblings.length; i++) {
            shortSiblings[i] = siblings[i];
        }
        
        // Should fail with wrong depth - call will revert or return false
        // depending on implementation
        bool valid = verifier.verifyTraceEvaluationAtIndex(
            leaf,
            index,
            shortSiblings,
            root
        );
        assertFalse(valid, "Proof with wrong depth should fail");
    }

    /**
     * @notice Gas benchmark for single Merkle verification
     */
    function test_VerifyTraceEvaluationAtIndex_Gas() public {
        (bytes32 root, bytes32 leaf, uint256 index, bytes32[] memory siblings) = _buildTestMerkleTree();
        
        uint256 gasBefore = gasleft();
        verifier.verifyTraceEvaluationAtIndex(leaf, index, siblings, root);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Merkle verification gas used", gasUsed);
        
        // SHA3-256 is expensive (~1M gas per hash), so 10 hashes = ~10M gas
        // This is expected behavior for pure Solidity SHA3-256
        assertTrue(gasUsed < 15_000_000, "Merkle verification should complete");
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
     * @dev External call overhead means ~2600 gas base + operation cost
     *      Native mulmod is ~8 gas, but cross-contract call adds overhead
     */
    function test_FieldMulGas() public {
        uint256 a = 12345678901234567890;
        uint256 b = 98765432109876543210;
        
        uint256 gasBefore = gasleft();
        verifier.fieldMul(a, b);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Field mul gas used", gasUsed);
        // External call overhead (~2600 base) + operation (~100) = ~3000-15000 typical
        assertTrue(gasUsed < 50_000, "Field mul should be gas efficient");
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

    /**
     * @notice Fuzz test Merkle proof verification
     */
    function testFuzz_MerkleVerification(uint256 leafValue, uint8 indexSeed) public view {
        // Bound index to valid range
        uint256 index = uint256(indexSeed) % (1 << TEST_TREE_DEPTH);
        
        // Build deterministic tree with fuzzed values
        bytes32 leaf = SHA3Hasher.hash(abi.encodePacked(leafValue, index));
        bytes32[] memory siblings = new bytes32[](TEST_TREE_DEPTH);
        
        // Generate siblings and build tree using domain-separated hash
        bytes32 currentHash = leaf;
        for (uint256 i = 0; i < TEST_TREE_DEPTH; i++) {
            siblings[i] = SHA3Hasher.hash(abi.encodePacked("sibling", i, leafValue));
            
            // Use domain-separated hash to match STARKVerifier._hashMerkleNodes()
            if ((index >> i) & 1 == 0) {
                currentHash = _hashMerkleNodesTest(currentHash, siblings[i]);
            } else {
                currentHash = _hashMerkleNodesTest(siblings[i], currentHash);
            }
        }
        bytes32 root = currentHash;
        
        // Verify should pass with correct data
        bool valid = verifier.verifyTraceEvaluationAtIndex(leaf, index, siblings, root);
        assertTrue(valid, "Fuzzed valid proof should pass");
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

    /**
     * @notice Build a test Merkle tree and return root, leaf, index, and siblings
     * @dev Uses TEST_TREE_DEPTH (10) for trace polynomial commitments
     */
    function _buildTestMerkleTree() internal pure returns (
        bytes32 root,
        bytes32 leaf,
        uint256 index,
        bytes32[] memory siblings
    ) {
        return _buildTestMerkleTreeWithIndex(0);
    }

    /**
     * @notice Build a test Merkle tree with a specific leaf index
     * @dev Uses domain-separated hashing to match STARKVerifier implementation
     */
    function _buildTestMerkleTreeWithIndex(uint256 targetIndex) internal pure returns (
        bytes32 root,
        bytes32 leaf,
        uint256 index,
        bytes32[] memory siblings
    ) {
        index = targetIndex % (1 << TEST_TREE_DEPTH);
        siblings = new bytes32[](TEST_TREE_DEPTH);
        
        // Create leaf as hash of evaluation data
        uint256 evaluation = 12345 + targetIndex;
        leaf = SHA3Hasher.hash(abi.encodePacked(evaluation));
        
        // Build path from leaf to root
        bytes32 currentHash = leaf;
        
        for (uint256 i = 0; i < TEST_TREE_DEPTH; i++) {
            // Generate deterministic sibling
            siblings[i] = SHA3Hasher.hash(abi.encodePacked("sibling", i, targetIndex));
            
            // Combine based on path bit using domain-separated hash
            if ((index >> i) & 1 == 0) {
                // Current is left child
                currentHash = _hashMerkleNodesTest(currentHash, siblings[i]);
            } else {
                // Current is right child
                currentHash = _hashMerkleNodesTest(siblings[i], currentHash);
            }
        }
        
        root = currentHash;
    }

    /**
     * @notice Hash two Merkle tree nodes using domain-separated SHA3-256
     * @dev MUST match STARKVerifier._hashMerkleNodes() exactly
     */
    function _hashMerkleNodesTest(
        bytes32 left,
        bytes32 right
    ) internal pure returns (bytes32) {
        return SHA3Hasher.hash(abi.encodePacked(
            DOMAIN_MERKLE_NODE,
            left,
            right
        ));
    }
}
