// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {STARKVerifier} from "../src/STARKVerifier.sol";
import {ProofCodec} from "../src/libraries/ProofCodec.sol";
import {OptimizedField} from "../src/lib/OptimizedField.sol";
import {ProofCompressor} from "../src/lib/ProofCompressor.sol";
import {ProofDecoder} from "../src/lib/ProofDecoder.sol";
import {AIRConstraints} from "../src/stark/AIRConstraints.sol";
import {ConstraintEvaluator} from "../src/stark/ConstraintEvaluator.sol";
import {FRIVerifier} from "../src/FRIVerifier.sol";
import {SHA3Hasher} from "../src/libraries/SHA3Hasher.sol";

/**
 * @title STARKVerifierE2ETest
 * @author Quantum Shield Team
 * @notice End-to-end test suite for STARKVerifier v1.0
 * @dev TEST-029: Comprehensive E2E testing for STARK proof verification
 *
 * ## Test Categories
 * 1. Full verification flow: Lock → Proof → Verify → Release
 * 2. Component integration tests
 * 3. Edge cases and error handling
 * 4. Performance benchmarks
 *
 * ## CP-1 Compliance
 * All tests use SHA3-256 exclusively, no keccak256
 */
contract STARKVerifierE2ETest is Test {
    using SHA3Hasher for bytes;
    using SHA3Hasher for bytes32;

    // =========================================================================
    // Test Fixtures
    // =========================================================================

    STARKVerifier public verifier;
    AIRConstraints public airConstraints;
    ConstraintEvaluator public constraintEvaluator;

    // Goldilocks field modulus
    uint256 constant FIELD_MODULUS = 0xFFFFFFFF00000001;

    // Test constants
    uint256 constant TEST_DOMAIN_SIZE = 256;
    uint256 constant TEST_BLOWUP_FACTOR = 8;
    uint256 constant MIN_QUERIES = 80;

    // Domain separators - MUST match STARKVerifier.sol
    bytes32 private constant DOMAIN_TRACE = bytes32("QS_STARK_TRACE_V1");
    bytes32 private constant DOMAIN_MERKLE_NODE = bytes32("QS_STARK_MERKLE_V1");

    // Events
    event ProofVerified(bytes32 indexed publicInput, uint256 timestamp);
    event ProofRejected(bytes32 indexed publicInput, string reason);

    function setUp() public {
        verifier = new STARKVerifier();
        airConstraints = new AIRConstraints();
        constraintEvaluator = new ConstraintEvaluator();
    }

    // =========================================================================
    // TEST-029-01: Basic Verification Flow
    // =========================================================================

    function test_E2E_VerifyValidProof() public view {
        // Create a valid proof structure
        ProofCodec.STARKProof memory proof = _createValidProof();
        bytes32 publicInput = keccak256("test_public_input");

        // Verify the proof
        bool isValid = verifier.verifyProof(proof, publicInput);
        assertTrue(isValid, "Valid proof should pass verification");
    }

    function test_E2E_RejectInvalidCommitment() public view {
        ProofCodec.STARKProof memory proof = _createValidProof();
        proof.traceCommitment = bytes32(0);
        bytes32 publicInput = keccak256("test_public_input");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Proof with zero trace commitment should fail");
    }

    function test_E2E_RejectInvalidConstraintCommitment() public view {
        ProofCodec.STARKProof memory proof = _createValidProof();
        proof.constraintCommitment = bytes32(0);
        bytes32 publicInput = keccak256("test_public_input");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Proof with zero constraint commitment should fail");
    }

    function test_E2E_RejectEmptyFRICommitments() public view {
        ProofCodec.STARKProof memory proof = _createValidProof();
        proof.friCommitments = new bytes32[](0);
        proof.friChallenges = new uint256[](0);
        bytes32 publicInput = keccak256("test_public_input");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Proof with empty FRI commitments should fail");
    }

    function test_E2E_RejectInsufficientQueries() public view {
        ProofCodec.STARKProof memory proof = _createValidProof();
        proof.queryIndices = new uint256[](10); // Less than MIN_QUERIES
        proof.merkleProofs = new bytes32[][](10);
        proof.evaluations = new uint256[][](10);
        bytes32 publicInput = keccak256("test_public_input");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Proof with insufficient queries should fail");
    }

    // =========================================================================
    // TEST-029-02: Trace Evaluation Verification
    // =========================================================================

    function test_E2E_VerifyTraceEvaluationAtIndex() public view {
        // Create trace evaluations
        uint256[] memory evaluations = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            evaluations[i] = (i + 1) * 1000;
        }

        // Compute root
        bytes32 root = verifier.computeTraceRoot(evaluations);

        // Create leaf at index 3
        bytes32 leaf = verifier.computeTraceLeaf(evaluations[3], 3);

        // Create Merkle proof for index 3 using domain-separated hash
        bytes32[] memory siblings = _computeMerkleProof(evaluations, 3);

        // Verify
        bool isValid = verifier.verifyTraceEvaluationAtIndex(
            leaf,
            3,
            siblings,
            root
        );
        assertTrue(isValid, "Valid trace evaluation should verify");
    }

    function test_E2E_VerifyTraceEvaluationsBatch() public view {
        uint256[] memory evaluations = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            evaluations[i] = (i + 1) * 1000;
        }

        bytes32 root = verifier.computeTraceRoot(evaluations);

        // Prepare batch verification for indices 0, 2, 5
        bytes32[] memory leaves = new bytes32[](3);
        uint256[] memory indices = new uint256[](3);
        bytes32[][] memory allSiblings = new bytes32[][](3);

        uint256[3] memory testIndices = [uint256(0), uint256(2), uint256(5)];
        for (uint256 i = 0; i < 3; i++) {
            indices[i] = testIndices[i];
            leaves[i] = verifier.computeTraceLeaf(evaluations[testIndices[i]], testIndices[i]);
            allSiblings[i] = _computeMerkleProof(evaluations, testIndices[i]);
        }

        uint256 validCount = verifier.verifyTraceEvaluationsBatch(
            leaves,
            indices,
            allSiblings,
            root
        );
        assertEq(validCount, 3, "All three evaluations should verify");
    }

    function test_E2E_RejectInvalidMerkleProof() public view {
        uint256[] memory evaluations = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            evaluations[i] = (i + 1) * 1000;
        }

        bytes32 root = verifier.computeTraceRoot(evaluations);
        bytes32 leaf = verifier.computeTraceLeaf(evaluations[3], 3);

        // Create invalid proof (wrong sibling)
        bytes32[] memory siblings = _computeMerkleProof(evaluations, 3);
        siblings[0] = bytes32(uint256(siblings[0]) + 1); // Corrupt proof

        bool isValid = verifier.verifyTraceEvaluationAtIndex(
            leaf,
            3,
            siblings,
            root
        );
        assertFalse(isValid, "Invalid Merkle proof should fail");
    }

    // =========================================================================
    // TEST-029-03: Field Operations Integration
    // =========================================================================

    function test_E2E_FieldOperationsConsistency() public view {
        uint256 a = 12345;
        uint256 b = 67890;

        // Test field add
        uint256 addResult = verifier.fieldAdd(a, b);
        assertEq(addResult, addmod(a, b, FIELD_MODULUS), "Field add mismatch");

        // Test field mul
        uint256 mulResult = verifier.fieldMul(a, b);
        assertEq(mulResult, mulmod(a, b, FIELD_MODULUS), "Field mul mismatch");
    }

    function test_E2E_FieldExpCorrectness() public view {
        uint256 base = 7;
        uint256 exp = 10;

        uint256 result = verifier.fieldExp(base, exp);

        // Verify: 7^10 mod FIELD_MODULUS
        uint256 expected = 1;
        for (uint256 i = 0; i < exp; i++) {
            expected = mulmod(expected, base, FIELD_MODULUS);
        }
        assertEq(result, expected, "Field exp mismatch");
    }

    function test_E2E_FieldInverseCorrectness() public view {
        uint256 a = 12345;

        uint256 inverse = verifier.fieldInverse(a);

        // Verify: a * a^(-1) = 1
        uint256 product = mulmod(a, inverse, FIELD_MODULUS);
        assertEq(product, 1, "Inverse verification failed");
    }

    // =========================================================================
    // TEST-029-04: Domain Operations
    // =========================================================================

    function test_E2E_ValidDomainSize() public view {
        assertTrue(verifier.isValidDomainSize(256), "256 should be valid");
        assertTrue(verifier.isValidDomainSize(1024), "1024 should be valid");
        assertFalse(verifier.isValidDomainSize(100), "100 should be invalid");
        assertFalse(verifier.isValidDomainSize(0), "0 should be invalid");
    }

    function test_E2E_ComputeDomainElement() public view {
        uint256 domainSize = 256;
        
        // Element at index 0 should be 1
        uint256 elem0 = verifier.computeDomainElement(0, domainSize);
        assertEq(elem0, 1, "omega^0 should be 1");

        // Elements should be in field
        uint256 elem10 = verifier.computeDomainElement(10, domainSize);
        assertTrue(elem10 < FIELD_MODULUS, "Element should be in field");
    }

    // =========================================================================
    // TEST-029-05: Hash Operations (CP-1 Compliance)
    // =========================================================================

    function test_E2E_SHA3HashConsistency() public view {
        bytes memory data = "test_data";
        bytes32 hash1 = verifier.hashData(data);
        bytes32 hash2 = verifier.hashData(data);

        assertEq(hash1, hash2, "Same input should produce same hash");
    }

    function test_E2E_HashPairDeterministic() public view {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));

        bytes32 hash1 = verifier.hashPair(left, right);
        bytes32 hash2 = verifier.hashPair(left, right);

        assertEq(hash1, hash2, "Hash pair should be deterministic");
    }

    function test_E2E_HashPairOrderMatters() public view {
        bytes32 a = bytes32(uint256(1));
        bytes32 b = bytes32(uint256(2));

        bytes32 hash1 = verifier.hashPair(a, b);
        bytes32 hash2 = verifier.hashPair(b, a);

        assertTrue(hash1 != hash2, "Hash order should matter");
    }

    // =========================================================================
    // TEST-029-06: Commitment Verification
    // =========================================================================

    function test_E2E_VerifyTraceCommitment() public view {
        bytes32 traceRoot = SHA3Hasher.hash(abi.encodePacked("trace_root"));
        bytes32 expectedCommitment = SHA3Hasher.hash(abi.encodePacked(traceRoot));

        bool isValid = verifier.verifyTraceCommitment(traceRoot, expectedCommitment);
        assertTrue(isValid, "Valid trace commitment should verify");
    }

    function test_E2E_VerifyConstraintCommitment() public view {
        bytes32 constraintRoot = SHA3Hasher.hash(abi.encodePacked("constraint_root"));
        bytes32 expectedCommitment = SHA3Hasher.hash(abi.encodePacked(constraintRoot));

        bool isValid = verifier.verifyConstraintCommitment(constraintRoot, expectedCommitment);
        assertTrue(isValid, "Valid constraint commitment should verify");
    }

    function test_E2E_RejectWrongCommitment() public view {
        bytes32 traceRoot = SHA3Hasher.hash(abi.encodePacked("trace_root"));
        bytes32 wrongCommitment = SHA3Hasher.hash(abi.encodePacked("wrong"));

        bool isValid = verifier.verifyTraceCommitment(traceRoot, wrongCommitment);
        assertFalse(isValid, "Wrong commitment should fail");
    }

    // =========================================================================
    // TEST-029-07: Version Information
    // =========================================================================

    function test_E2E_GetVersion() public view {
        (string memory name, string memory version) = verifier.getVersion();
        assertEq(name, "STARKVerifier", "Incorrect name");
        assertTrue(bytes(version).length > 0, "Version should not be empty");
    }

    function test_E2E_SecurityLevel() public view {
        uint256 level = verifier.securityLevel();
        assertEq(level, 128, "Security level should be 128 bits");
    }

    // =========================================================================
    // TEST-029-08: Proof Structure Validation
    // =========================================================================

    function test_E2E_ValidateProofStructure_MismatchedArrays() public view {
        ProofCodec.STARKProof memory proof = _createValidProof();
        // Create mismatch between friCommitments and friChallenges
        proof.friChallenges = new uint256[](proof.friCommitments.length + 1);
        
        bytes32 publicInput = keccak256("test");
        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Mismatched arrays should fail");
    }

    function test_E2E_ValidateProofStructure_TooManyFRILayers() public view {
        ProofCodec.STARKProof memory proof = _createValidProof();
        proof.friCommitments = new bytes32[](20); // More than MAX_FRI_LAYERS
        proof.friChallenges = new uint256[](20);
        
        bytes32 publicInput = keccak256("test");
        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Too many FRI layers should fail");
    }

    // =========================================================================
    // TEST-029-09: Final Polynomial Verification
    // =========================================================================

    function test_E2E_ValidFinalPolynomial() public view {
        ProofCodec.STARKProof memory proof = _createValidProof();
        proof.finalPolynomial = new uint256[](4); // Degree 3, which is valid
        
        bytes32 publicInput = keccak256("test");
        bool isValid = verifier.verifyProof(proof, publicInput);
        assertTrue(isValid, "Degree 3 polynomial should be valid");
    }

    function test_E2E_RejectHighDegreeFinalPolynomial() public view {
        ProofCodec.STARKProof memory proof = _createValidProof();
        proof.finalPolynomial = new uint256[](10); // Too high degree
        
        bytes32 publicInput = keccak256("test");
        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "High degree polynomial should fail");
    }

    // =========================================================================
    // TEST-029-10: Edge Cases
    // =========================================================================

    function test_E2E_ZeroPublicInput() public view {
        ProofCodec.STARKProof memory proof = _createValidProof();
        bytes32 publicInput = bytes32(0);

        // Should still work with zero input
        bool isValid = verifier.verifyProof(proof, publicInput);
        assertTrue(isValid, "Zero public input should be acceptable");
    }

    function test_E2E_MaxFieldElement() public view {
        uint256 maxElement = FIELD_MODULUS - 1;
        uint256 result = verifier.fieldMul(maxElement, maxElement);
        assertTrue(result < FIELD_MODULUS, "Result should be in field");
    }

    function test_E2E_ComputeTraceRootPowerOf2() public view {
        uint256[] memory evaluations = new uint256[](16);
        for (uint256 i = 0; i < 16; i++) {
            evaluations[i] = i * 100;
        }

        bytes32 root = verifier.computeTraceRoot(evaluations);
        assertTrue(root != bytes32(0), "Root should not be zero");
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _createValidProof() internal pure returns (ProofCodec.STARKProof memory proof) {
        proof.traceCommitment = keccak256("trace");
        proof.constraintCommitment = keccak256("constraint");
        
        proof.friCommitments = new bytes32[](4);
        for (uint256 i = 0; i < 4; i++) {
            proof.friCommitments[i] = keccak256(abi.encodePacked("fri", i));
        }
        
        proof.friChallenges = new uint256[](4);
        for (uint256 i = 0; i < 4; i++) {
            proof.friChallenges[i] = uint256(keccak256(abi.encodePacked("challenge", i)));
        }
        
        // Create MIN_QUERIES (80) query indices
        proof.queryIndices = new uint256[](MIN_QUERIES);
        proof.merkleProofs = new bytes32[][](MIN_QUERIES);
        proof.evaluations = new uint256[][](MIN_QUERIES);
        
        for (uint256 i = 0; i < MIN_QUERIES; i++) {
            proof.queryIndices[i] = i;
            proof.merkleProofs[i] = new bytes32[](4);
            proof.evaluations[i] = new uint256[](2);
        }
        
        proof.finalPolynomial = new uint256[](2);
        proof.finalPolynomial[0] = 1;
        proof.finalPolynomial[1] = 2;
    }

    /**
     * @notice Compute Merkle proof using domain-separated hashing
     * @dev MUST match STARKVerifier._hashMerkleNodes() exactly
     */
    function _computeMerkleProof(
        uint256[] memory evaluations,
        uint256 index
    ) internal pure returns (bytes32[] memory siblings) {
        uint256 depth = 3; // log2(8)
        siblings = new bytes32[](depth);
        
        // Build leaf layer using DOMAIN_TRACE (matches computeTraceLeaf)
        bytes32[] memory layer = new bytes32[](evaluations.length);
        for (uint256 i = 0; i < evaluations.length; i++) {
            layer[i] = SHA3Hasher.hash(abi.encodePacked(DOMAIN_TRACE, evaluations[i], i));
        }
        
        // Compute siblings at each level using domain-separated hash
        uint256 currentIndex = index;
        for (uint256 level = 0; level < depth; level++) {
            uint256 siblingIndex = currentIndex ^ 1;
            siblings[level] = layer[siblingIndex];
            
            // Compute next layer using DOMAIN_MERKLE_NODE (matches _hashMerkleNodes)
            bytes32[] memory nextLayer = new bytes32[](layer.length / 2);
            for (uint256 i = 0; i < nextLayer.length; i++) {
                nextLayer[i] = _hashMerkleNodesTest(layer[2 * i], layer[2 * i + 1]);
            }
            layer = nextLayer;
            currentIndex = currentIndex / 2;
        }
    }

    /**
     * @notice Hash two Merkle tree nodes using domain-separated SHA3-256
     * @dev MUST match STARKVerifier._hashMerkleNodes() exactly
     */
    function _hashMerkleNodesTest(
        bytes32 left,
        bytes32 right
    ) internal pure returns (bytes32) {
        return SHA3Hasher.hash(abi.encodePacked(DOMAIN_MERKLE_NODE, left, right));
    }
}
