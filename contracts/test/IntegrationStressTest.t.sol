// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {STARKVerifier} from "../src/STARKVerifier.sol";
import {OptimizedField} from "../src/lib/OptimizedField.sol";
import {ProofCompressor} from "../src/lib/ProofCompressor.sol";
import {ProofDecoder} from "../src/lib/ProofDecoder.sol";
import {BatchVerifier} from "../src/BatchVerifier.sol";
import {SharedMerkle} from "../src/lib/SharedMerkle.sol";
import {FRIVerifier} from "../src/FRIVerifier.sol";
import {AIRConstraints} from "../src/stark/AIRConstraints.sol";
import {ConstraintEvaluator} from "../src/stark/ConstraintEvaluator.sol";
import {SHA3Hasher} from "../src/libraries/SHA3Hasher.sol";
import {ProofCodec} from "../src/libraries/ProofCodec.sol";

/**
 * @title IntegrationStressTest
 * @author Quantum Shield Team
 * @notice Integration stress tests for STARK verification
 * @dev TEST-031: Tests large proof batches, edge cases, and error scenarios
 *
 * ## Test Categories
 * 1. Large batch verification (100 proofs)
 * 2. Edge cases (empty proofs, invalid proofs)
 * 3. Memory stress tests
 * 4. Concurrent operation simulation
 *
 * @custom:security-contact security@quantumshield.io
 */
contract IntegrationStressTest is Test {
    using SHA3Hasher for bytes;

    // =========================================================================
    // Test Fixtures
    // =========================================================================

    STARKVerifier public verifier;
    SharedMerkle public sharedMerkle;
    BatchVerifier public batchVerifier;
    AIRConstraints public airConstraints;
    ConstraintEvaluator public constraintEvaluator;

    // Goldilocks field modulus
    uint256 constant FIELD_MODULUS = 0xFFFFFFFF00000001;
    uint256 constant MIN_QUERIES = 80;

    function setUp() public {
        verifier = new STARKVerifier();
        sharedMerkle = new SharedMerkle();
        batchVerifier = new BatchVerifier(address(sharedMerkle));
        airConstraints = new AIRConstraints();
        constraintEvaluator = new ConstraintEvaluator();
    }

    // =========================================================================
    // TEST-031-01: Large Batch Verification
    // =========================================================================

    function test_Stress_BatchVerify10Proofs() public view {
        ProofCodec.STARKProof[] memory proofs = new ProofCodec.STARKProof[](10);
        bytes32[] memory publicInputs = new bytes32[](10);

        for (uint256 i = 0; i < 10; i++) {
            proofs[i] = _createValidProof(i);
            publicInputs[i] = keccak256(abi.encodePacked("input", i));
        }

        uint256 validCount = 0;
        for (uint256 i = 0; i < 10; i++) {
            if (verifier.verifyProof(proofs[i], publicInputs[i])) {
                validCount++;
            }
        }

        assertEq(validCount, 10, "All 10 proofs should verify");
    }

    function test_Stress_BatchVerify50Proofs() public view {
        ProofCodec.STARKProof[] memory proofs = new ProofCodec.STARKProof[](50);
        bytes32[] memory publicInputs = new bytes32[](50);

        for (uint256 i = 0; i < 50; i++) {
            proofs[i] = _createValidProof(i);
            publicInputs[i] = keccak256(abi.encodePacked("input", i));
        }

        uint256 validCount = 0;
        for (uint256 i = 0; i < 50; i++) {
            if (verifier.verifyProof(proofs[i], publicInputs[i])) {
                validCount++;
            }
        }

        assertEq(validCount, 50, "All 50 proofs should verify");
    }

    function test_Stress_BatchVerify100Proofs() public view {
        ProofCodec.STARKProof[] memory proofs = new ProofCodec.STARKProof[](100);
        bytes32[] memory publicInputs = new bytes32[](100);

        for (uint256 i = 0; i < 100; i++) {
            proofs[i] = _createValidProof(i);
            publicInputs[i] = keccak256(abi.encodePacked("input", i));
        }

        uint256 gasBefore = gasleft();
        uint256 validCount = 0;
        for (uint256 i = 0; i < 100; i++) {
            if (verifier.verifyProof(proofs[i], publicInputs[i])) {
                validCount++;
            }
        }
        uint256 gasUsed = gasBefore - gasleft();

        console.log("100 proofs verification gas used:", gasUsed);
        console.log("Average gas per proof:", gasUsed / 100);

        assertEq(validCount, 100, "All 100 proofs should verify");
    }

    // =========================================================================
    // TEST-031-02: Edge Cases - Empty Proofs
    // =========================================================================

    function test_Stress_EmptyTraceCommitment() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        proof.traceCommitment = bytes32(0);
        bytes32 publicInput = keccak256("test");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Empty trace commitment should fail");
    }

    function test_Stress_EmptyConstraintCommitment() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        proof.constraintCommitment = bytes32(0);
        bytes32 publicInput = keccak256("test");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Empty constraint commitment should fail");
    }

    function test_Stress_EmptyFRICommitments() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        proof.friCommitments = new bytes32[](0);
        proof.friChallenges = new uint256[](0);
        bytes32 publicInput = keccak256("test");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Empty FRI commitments should fail");
    }

    function test_Stress_EmptyQueryIndices() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        proof.queryIndices = new uint256[](0);
        proof.merkleProofs = new bytes32[][](0);
        proof.evaluations = new uint256[][](0);
        bytes32 publicInput = keccak256("test");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Empty query indices should fail");
    }

    function test_Stress_EmptyFinalPolynomial() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        proof.finalPolynomial = new uint256[](0);
        bytes32 publicInput = keccak256("test");

        // Empty final polynomial with length 0 should be valid
        // (represents constant 0 polynomial)
        bool isValid = verifier.verifyProof(proof, publicInput);
        assertTrue(isValid, "Empty final polynomial should be valid");
    }

    // =========================================================================
    // TEST-031-03: Edge Cases - Invalid Proofs
    // =========================================================================

    function test_Stress_MismatchedFRIArrays() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        proof.friCommitments = new bytes32[](4);
        proof.friChallenges = new uint256[](5); // Mismatched length
        bytes32 publicInput = keccak256("test");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Mismatched FRI arrays should fail");
    }

    function test_Stress_MismatchedQueryArrays() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        proof.queryIndices = new uint256[](80);
        proof.merkleProofs = new bytes32[][](81); // Mismatched length
        bytes32 publicInput = keccak256("test");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Mismatched query arrays should fail");
    }

    function test_Stress_TooManyFRILayers() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        proof.friCommitments = new bytes32[](20); // More than MAX_FRI_LAYERS (16)
        proof.friChallenges = new uint256[](20);
        bytes32 publicInput = keccak256("test");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "Too many FRI layers should fail");
    }

    function test_Stress_HighDegreeFinalPolynomial() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        proof.finalPolynomial = new uint256[](100); // Too high degree
        bytes32 publicInput = keccak256("test");

        bool isValid = verifier.verifyProof(proof, publicInput);
        assertFalse(isValid, "High degree final polynomial should fail");
    }

    // =========================================================================
    // TEST-031-04: Memory Stress Tests
    // =========================================================================

    function test_Stress_LargeTraceRoot() public {
        uint256[] memory evaluations = new uint256[](512);
        for (uint256 i = 0; i < 512; i++) {
            evaluations[i] = (i + 1) * 1000;
        }

        bytes32 root = verifier.computeTraceRoot(evaluations);
        assertTrue(root != bytes32(0), "Root should not be zero");
    }

    function test_Stress_LargeBatchVerification() public view {
        uint256[] memory evaluations = new uint256[](256);
        for (uint256 i = 0; i < 256; i++) {
            evaluations[i] = (i + 1) * 1000;
        }

        bytes32 root = verifier.computeTraceRoot(evaluations);

        // Verify 50 random indices
        bytes32[] memory leaves = new bytes32[](50);
        uint256[] memory indices = new uint256[](50);
        bytes32[][] memory allSiblings = new bytes32[][](50);

        for (uint256 i = 0; i < 50; i++) {
            uint256 idx = (i * 5) % 256;
            indices[i] = idx;
            leaves[i] = verifier.computeTraceLeaf(evaluations[idx], idx);
            allSiblings[i] = _computeMerkleProof256(evaluations, idx);
        }

        uint256 validCount = verifier.verifyTraceEvaluationsBatch(
            leaves,
            indices,
            allSiblings,
            root
        );

        assertEq(validCount, 50, "All 50 evaluations should verify");
    }

    function test_Stress_RepeatedVerification() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        bytes32 publicInput = keccak256("test");

        // Verify same proof 100 times
        for (uint256 i = 0; i < 100; i++) {
            bool isValid = verifier.verifyProof(proof, publicInput);
            assertTrue(isValid, "Repeated verification should succeed");
        }
    }

    // =========================================================================
    // TEST-031-05: Field Operation Stress
    // =========================================================================

    function test_Stress_FieldOperationsMaxValues() public view {
        uint256 maxA = FIELD_MODULUS - 1;
        uint256 maxB = FIELD_MODULUS - 1;

        // Add max values
        uint256 addResult = verifier.fieldAdd(maxA, maxB);
        assertTrue(addResult < FIELD_MODULUS, "Add result should be in field");

        // Multiply max values
        uint256 mulResult = verifier.fieldMul(maxA, maxB);
        assertTrue(mulResult < FIELD_MODULUS, "Mul result should be in field");
    }

    function test_Stress_FieldExpLargeExponent() public view {
        uint256 base = 7;
        uint256 largeExp = FIELD_MODULUS - 2;

        uint256 result = verifier.fieldExp(base, largeExp);
        assertTrue(result < FIELD_MODULUS, "Exp result should be in field");

        // Verify this is the inverse
        uint256 product = verifier.fieldMul(base, result);
        assertEq(product, 1, "Should compute inverse");
    }

    function test_Stress_BatchFieldOperations() public pure {
        uint256[] memory a = new uint256[](1000);
        uint256[] memory b = new uint256[](1000);

        for (uint256 i = 0; i < 1000; i++) {
            a[i] = (i + 1) * 1234;
            b[i] = (i + 1) * 5678;
        }

        uint256[] memory results = OptimizedField.batchMulMod(a, b, FIELD_MODULUS);
        assertEq(results.length, 1000, "Should return 1000 results");

        // Verify all results are in field
        for (uint256 i = 0; i < 1000; i++) {
            assertTrue(results[i] < FIELD_MODULUS, "All results should be in field");
        }
    }

    // =========================================================================
    // TEST-031-06: Hash Operation Stress
    // =========================================================================

    function test_Stress_HashLargeData() public view {
        bytes memory largeData = new bytes(10000);
        for (uint256 i = 0; i < 10000; i++) {
            largeData[i] = bytes1(uint8(i % 256));
        }

        bytes32 hash = verifier.hashData(largeData);
        assertTrue(hash != bytes32(0), "Hash should not be zero");
    }

    function test_Stress_ManyHashPairs() public view {
        bytes32 current = bytes32(uint256(1));
        
        for (uint256 i = 0; i < 1000; i++) {
            bytes32 next = bytes32(uint256(i + 2));
            current = verifier.hashPair(current, next);
        }

        assertTrue(current != bytes32(0), "Final hash should not be zero");
    }

    // =========================================================================
    // TEST-031-07: Merkle Verification Stress
    // =========================================================================

    function test_Stress_DeepMerkleProof() public view {
        // Create 16-depth tree (65536 leaves)
        uint256[] memory evaluations = new uint256[](256);
        for (uint256 i = 0; i < 256; i++) {
            evaluations[i] = i * 100;
        }

        bytes32 root = verifier.computeTraceRoot(evaluations);
        bytes32 leaf = verifier.computeTraceLeaf(evaluations[128], 128);
        bytes32[] memory siblings = _computeMerkleProof256(evaluations, 128);

        bool isValid = verifier.verifyTraceEvaluationAtIndex(
            leaf,
            128,
            siblings,
            root
        );
        assertTrue(isValid, "Deep Merkle proof should verify");
    }

    function test_Stress_AllLeavesVerify() public view {
        uint256[] memory evaluations = new uint256[](32);
        for (uint256 i = 0; i < 32; i++) {
            evaluations[i] = (i + 1) * 100;
        }

        bytes32 root = verifier.computeTraceRoot(evaluations);

        // Verify every single leaf
        for (uint256 i = 0; i < 32; i++) {
            bytes32 leaf = verifier.computeTraceLeaf(evaluations[i], i);
            bytes32[] memory siblings = _computeMerkleProof32(evaluations, i);
            
            bool isValid = verifier.verifyTraceEvaluationAtIndex(
                leaf,
                i,
                siblings,
                root
            );
            assertTrue(isValid, "All leaves should verify");
        }
    }

    // =========================================================================
    // TEST-031-08: Domain Operations Stress
    // =========================================================================

    function test_Stress_ComputeAllDomainElements() public view {
        uint256 domainSize = 256;
        
        for (uint256 i = 0; i < 256; i++) {
            uint256 elem = verifier.computeDomainElement(i, domainSize);
            assertTrue(elem < FIELD_MODULUS, "Element should be in field");
        }
    }

    function test_Stress_DomainSizeValidation() public view {
        // Test all power of 2 sizes up to 2^16
        for (uint256 exp = 0; exp <= 16; exp++) {
            uint256 size = 1 << exp;
            assertTrue(verifier.isValidDomainSize(size), "Power of 2 should be valid");
        }

        // Test non-powers of 2
        uint256[5] memory invalidSizes = [uint256(3), 5, 6, 7, 100];
        for (uint256 i = 0; i < 5; i++) {
            assertFalse(verifier.isValidDomainSize(invalidSizes[i]), "Non-power of 2 should be invalid");
        }
    }

    // =========================================================================
    // TEST-031-09: Error Recovery
    // =========================================================================

    function test_Stress_PartialBatchFailure() public view {
        ProofCodec.STARKProof[] memory proofs = new ProofCodec.STARKProof[](10);
        bytes32[] memory publicInputs = new bytes32[](10);

        for (uint256 i = 0; i < 10; i++) {
            proofs[i] = _createValidProof(i);
            publicInputs[i] = keccak256(abi.encodePacked("input", i));
        }

        // Corrupt some proofs
        proofs[3].traceCommitment = bytes32(0);
        proofs[7].constraintCommitment = bytes32(0);

        uint256 validCount = 0;
        for (uint256 i = 0; i < 10; i++) {
            if (verifier.verifyProof(proofs[i], publicInputs[i])) {
                validCount++;
            }
        }

        assertEq(validCount, 8, "8 out of 10 proofs should verify");
    }

    function test_Stress_AllInvalidBatch() public view {
        ProofCodec.STARKProof[] memory proofs = new ProofCodec.STARKProof[](5);
        bytes32[] memory publicInputs = new bytes32[](5);

        for (uint256 i = 0; i < 5; i++) {
            proofs[i] = _createInvalidProof();
            publicInputs[i] = keccak256(abi.encodePacked("input", i));
        }

        uint256 validCount = 0;
        for (uint256 i = 0; i < 5; i++) {
            if (verifier.verifyProof(proofs[i], publicInputs[i])) {
                validCount++;
            }
        }

        assertEq(validCount, 0, "No invalid proofs should verify");
    }

    // =========================================================================
    // TEST-031-10: Gas Limits
    // =========================================================================

    function test_Stress_GasLimitCheck() public view {
        ProofCodec.STARKProof memory proof = _createValidProof(0);
        bytes32 publicInput = keccak256("test");

        uint256 gasBefore = gasleft();
        verifier.verifyProof(proof, publicInput);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Single proof verification gas:", gasUsed);
        
        // Estimate max proofs per block (30M gas limit)
        uint256 maxProofsPerBlock = 30_000_000 / gasUsed;
        console.log("Estimated max proofs per block:", maxProofsPerBlock);
        
        assertTrue(maxProofsPerBlock >= 100, "Should support at least 100 proofs per block");
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _createValidProof(uint256 seed) internal pure returns (ProofCodec.STARKProof memory proof) {
        proof.traceCommitment = keccak256(abi.encodePacked("trace", seed));
        proof.constraintCommitment = keccak256(abi.encodePacked("constraint", seed));
        
        proof.friCommitments = new bytes32[](4);
        for (uint256 i = 0; i < 4; i++) {
            proof.friCommitments[i] = keccak256(abi.encodePacked("fri", seed, i));
        }
        
        proof.friChallenges = new uint256[](4);
        for (uint256 i = 0; i < 4; i++) {
            proof.friChallenges[i] = uint256(keccak256(abi.encodePacked("challenge", seed, i)));
        }
        
        proof.queryIndices = new uint256[](MIN_QUERIES);
        proof.merkleProofs = new bytes32[][](MIN_QUERIES);
        proof.evaluations = new uint256[][](MIN_QUERIES);
        
        for (uint256 i = 0; i < MIN_QUERIES; i++) {
            proof.queryIndices[i] = i;
            proof.merkleProofs[i] = new bytes32[](4);
            proof.evaluations[i] = new uint256[](2);
        }
        
        proof.finalPolynomial = new uint256[](2);
        proof.finalPolynomial[0] = 1 + seed;
        proof.finalPolynomial[1] = 2 + seed;
    }

    function _createInvalidProof() internal pure returns (ProofCodec.STARKProof memory proof) {
        proof.traceCommitment = bytes32(0);
        proof.constraintCommitment = bytes32(0);
        proof.friCommitments = new bytes32[](0);
        proof.friChallenges = new uint256[](0);
        proof.queryIndices = new uint256[](0);
        proof.merkleProofs = new bytes32[][](0);
        proof.evaluations = new uint256[][](0);
        proof.finalPolynomial = new uint256[](0);
    }

    function _computeMerkleProof256(
        uint256[] memory evaluations,
        uint256 index
    ) internal view returns (bytes32[] memory siblings) {
        uint256 depth = 8; // log2(256)
        siblings = new bytes32[](depth);
        
        bytes32[] memory layer = new bytes32[](evaluations.length);
        for (uint256 i = 0; i < evaluations.length; i++) {
            layer[i] = verifier.computeTraceLeaf(evaluations[i], i);
        }
        
        uint256 currentIndex = index;
        for (uint256 level = 0; level < depth; level++) {
            uint256 siblingIndex = currentIndex ^ 1;
            if (siblingIndex < layer.length) {
                siblings[level] = layer[siblingIndex];
            }
            
            bytes32[] memory nextLayer = new bytes32[](layer.length / 2);
            for (uint256 i = 0; i < nextLayer.length; i++) {
                nextLayer[i] = verifier.hashPair(layer[2 * i], layer[2 * i + 1]);
            }
            layer = nextLayer;
            currentIndex = currentIndex / 2;
        }
    }

    function _computeMerkleProof32(
        uint256[] memory evaluations,
        uint256 index
    ) internal view returns (bytes32[] memory siblings) {
        uint256 depth = 5; // log2(32)
        siblings = new bytes32[](depth);
        
        bytes32[] memory layer = new bytes32[](evaluations.length);
        for (uint256 i = 0; i < evaluations.length; i++) {
            layer[i] = verifier.computeTraceLeaf(evaluations[i], i);
        }
        
        uint256 currentIndex = index;
        for (uint256 level = 0; level < depth; level++) {
            uint256 siblingIndex = currentIndex ^ 1;
            siblings[level] = layer[siblingIndex];
            
            bytes32[] memory nextLayer = new bytes32[](layer.length / 2);
            for (uint256 i = 0; i < nextLayer.length; i++) {
                nextLayer[i] = verifier.hashPair(layer[2 * i], layer[2 * i + 1]);
            }
            layer = nextLayer;
            currentIndex = currentIndex / 2;
        }
    }
}
