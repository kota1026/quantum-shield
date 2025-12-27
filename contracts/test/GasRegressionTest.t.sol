// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {STARKVerifier} from "../src/STARKVerifier.sol";
import {OptimizedField} from "../src/lib/OptimizedField.sol";
import {ProofCompressor} from "../src/lib/ProofCompressor.sol";
import {ProofDecoder} from "../src/lib/ProofDecoder.sol";
import {FRIVerifier} from "../src/FRIVerifier.sol";
import {AIRConstraints} from "../src/stark/AIRConstraints.sol";
import {ConstraintEvaluator} from "../src/stark/ConstraintEvaluator.sol";
import {SHA3Hasher} from "../src/libraries/SHA3Hasher.sol";
import {ProofCodec} from "../src/libraries/ProofCodec.sol";

/**
 * @title GasRegressionTest
 * @author Quantum Shield Team
 * @notice Gas regression tests for STARK verification components
 * @dev TEST-030: Ensures Gas targets are maintained after v1.0 integration
 *
 * ## Gas Targets
 * | Component        | Week 10 Achieved | Week 11 Target |
 * |-----------------|------------------|----------------|
 * | modExp          | 787 gas          | Maintain       |
 * | modInverse      | 1,969 gas        | Maintain       |
 * | batchMulMod     | 1,487 gas/10     | Maintain       |
 * | STARK verify    | ~1,000,000 gas   | <500,000 gas   |
 *
 * @custom:security-contact security@quantumshield.io
 */
contract GasRegressionTest is Test {
    using SHA3Hasher for bytes;
    
    // =========================================================================
    // Test Fixtures
    // =========================================================================

    STARKVerifier public verifier;
    AIRConstraints public airConstraints;
    ConstraintEvaluator public constraintEvaluator;

    // Goldilocks field modulus
    uint256 constant FIELD_MODULUS = 0xFFFFFFFF00000001;

    // Week 10 Gas Baselines (must maintain)
    uint256 constant MODEXP_TARGET = 2000;
    uint256 constant MODINVERSE_TARGET = 5000;
    uint256 constant BATCH_MULMOD_10_TARGET = 20000;
    
    // Week 11 Target for full STARK verification
    uint256 constant STARK_VERIFY_TARGET = 500000;

    function setUp() public {
        verifier = new STARKVerifier();
        airConstraints = new AIRConstraints();
        constraintEvaluator = new ConstraintEvaluator();
    }

    // =========================================================================
    // TEST-030-01: OptimizedField Gas Regression
    // =========================================================================

    function test_GasRegression_ModExp() public {
        uint256 base = 12345;
        uint256 exp = 1000;

        uint256 gasBefore = gasleft();
        OptimizedField.modExp(base, exp, FIELD_MODULUS);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("modExp gas used:", gasUsed);
        assertLt(gasUsed, MODEXP_TARGET, "modExp exceeds target");
    }

    function test_GasRegression_ModExpLargeExponent() public {
        uint256 base = 7;
        uint256 exp = FIELD_MODULUS - 2; // Large exponent

        uint256 gasBefore = gasleft();
        OptimizedField.modExp(base, exp, FIELD_MODULUS);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("modExp (large exp) gas used:", gasUsed);
        // Large exponent should still be efficient due to precompile
        assertLt(gasUsed, MODEXP_TARGET * 2, "modExp large exp exceeds target");
    }

    function test_GasRegression_ModInverse() public {
        uint256 a = 12345;

        uint256 gasBefore = gasleft();
        OptimizedField.modInverse(a, FIELD_MODULUS);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("modInverse gas used:", gasUsed);
        assertLt(gasUsed, MODINVERSE_TARGET, "modInverse exceeds target");
    }

    function test_GasRegression_ModInverseEEA() public {
        uint256 a = 12345;

        uint256 gasBefore = gasleft();
        OptimizedField.modInverseEEA(a, FIELD_MODULUS);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("modInverseEEA gas used:", gasUsed);
        // EEA should be comparable or better than Fermat
        assertLt(gasUsed, MODINVERSE_TARGET * 2, "modInverseEEA exceeds target");
    }

    function test_GasRegression_BatchMulMod10() public {
        uint256[] memory a = new uint256[](10);
        uint256[] memory b = new uint256[](10);
        
        for (uint256 i = 0; i < 10; i++) {
            a[i] = (i + 1) * 1000;
            b[i] = (i + 1) * 2000;
        }

        uint256 gasBefore = gasleft();
        OptimizedField.batchMulMod(a, b, FIELD_MODULUS);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("batchMulMod (10 elements) gas used:", gasUsed);
        assertLt(gasUsed, BATCH_MULMOD_10_TARGET, "batchMulMod exceeds target");
    }

    function test_GasRegression_BatchMulMod100() public {
        uint256[] memory a = new uint256[](100);
        uint256[] memory b = new uint256[](100);
        
        for (uint256 i = 0; i < 100; i++) {
            a[i] = (i + 1) * 1000;
            b[i] = (i + 1) * 2000;
        }

        uint256 gasBefore = gasleft();
        OptimizedField.batchMulMod(a, b, FIELD_MODULUS);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("batchMulMod (100 elements) gas used:", gasUsed);
        // Should scale linearly: ~10x the 10-element case
        assertLt(gasUsed, BATCH_MULMOD_10_TARGET * 15, "batchMulMod 100 exceeds linear scaling");
    }

    // =========================================================================
    // TEST-030-02: STARKVerifier Component Gas
    // =========================================================================

    function test_GasRegression_FieldAdd() public {
        uint256 a = 12345;
        uint256 b = 67890;

        uint256 gasBefore = gasleft();
        verifier.fieldAdd(a, b);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("fieldAdd gas used:", gasUsed);
        assertLt(gasUsed, 200, "fieldAdd should be very cheap");
    }

    function test_GasRegression_FieldMul() public {
        uint256 a = 12345;
        uint256 b = 67890;

        uint256 gasBefore = gasleft();
        verifier.fieldMul(a, b);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("fieldMul gas used:", gasUsed);
        assertLt(gasUsed, 200, "fieldMul should be very cheap");
    }

    function test_GasRegression_FieldExp() public {
        uint256 base = 7;
        uint256 exp = 1000;

        uint256 gasBefore = gasleft();
        verifier.fieldExp(base, exp);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("fieldExp gas used:", gasUsed);
        assertLt(gasUsed, MODEXP_TARGET * 2, "fieldExp exceeds target");
    }

    function test_GasRegression_FieldInverse() public {
        uint256 a = 12345;

        uint256 gasBefore = gasleft();
        verifier.fieldInverse(a);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("fieldInverse gas used:", gasUsed);
        assertLt(gasUsed, MODINVERSE_TARGET * 2, "fieldInverse exceeds target");
    }

    // =========================================================================
    // TEST-030-03: Hash Operations Gas
    // =========================================================================

    function test_GasRegression_SHA3Hash32Bytes() public {
        bytes memory data = abi.encodePacked(bytes32(uint256(1)));

        uint256 gasBefore = gasleft();
        verifier.hashData(data);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("SHA3 hash (32 bytes) gas used:", gasUsed);
        assertLt(gasUsed, 5000, "SHA3 hash should be under 5000 gas");
    }

    function test_GasRegression_SHA3Hash256Bytes() public {
        bytes memory data = new bytes(256);
        for (uint256 i = 0; i < 256; i++) {
            data[i] = bytes1(uint8(i));
        }

        uint256 gasBefore = gasleft();
        verifier.hashData(data);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("SHA3 hash (256 bytes) gas used:", gasUsed);
        assertLt(gasUsed, 20000, "SHA3 hash (256 bytes) should scale reasonably");
    }

    function test_GasRegression_HashPair() public {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));

        uint256 gasBefore = gasleft();
        verifier.hashPair(left, right);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("hashPair gas used:", gasUsed);
        assertLt(gasUsed, 5000, "hashPair should be under 5000 gas");
    }

    // =========================================================================
    // TEST-030-04: Merkle Operations Gas
    // =========================================================================

    function test_GasRegression_ComputeTraceLeaf() public {
        uint256 evaluation = 12345;
        uint256 index = 5;

        uint256 gasBefore = gasleft();
        verifier.computeTraceLeaf(evaluation, index);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("computeTraceLeaf gas used:", gasUsed);
        assertLt(gasUsed, 10000, "computeTraceLeaf should be under 10000 gas");
    }

    function test_GasRegression_ComputeTraceRoot8() public {
        uint256[] memory evaluations = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            evaluations[i] = (i + 1) * 1000;
        }

        uint256 gasBefore = gasleft();
        verifier.computeTraceRoot(evaluations);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("computeTraceRoot (8) gas used:", gasUsed);
        assertLt(gasUsed, 100000, "computeTraceRoot should be under 100000 gas");
    }

    function test_GasRegression_ComputeTraceRoot256() public {
        uint256[] memory evaluations = new uint256[](256);
        for (uint256 i = 0; i < 256; i++) {
            evaluations[i] = (i + 1) * 1000;
        }

        uint256 gasBefore = gasleft();
        verifier.computeTraceRoot(evaluations);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("computeTraceRoot (256) gas used:", gasUsed);
        // Should scale O(n log n)
        assertLt(gasUsed, 2000000, "computeTraceRoot (256) gas too high");
    }

    function test_GasRegression_VerifyTraceEvaluationAtIndex() public {
        uint256[] memory evaluations = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            evaluations[i] = (i + 1) * 1000;
        }

        bytes32 root = verifier.computeTraceRoot(evaluations);
        bytes32 leaf = verifier.computeTraceLeaf(evaluations[3], 3);
        bytes32[] memory siblings = _computeMerkleProof(evaluations, 3);

        uint256 gasBefore = gasleft();
        verifier.verifyTraceEvaluationAtIndex(leaf, 3, siblings, root);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("verifyTraceEvaluationAtIndex gas used:", gasUsed);
        assertLt(gasUsed, 50000, "verifyTraceEvaluationAtIndex too expensive");
    }

    // =========================================================================
    // TEST-030-05: Commitment Verification Gas
    // =========================================================================

    function test_GasRegression_VerifyTraceCommitment() public {
        bytes32 traceRoot = SHA3Hasher.hash(abi.encodePacked("trace_root"));
        bytes32 expectedCommitment = SHA3Hasher.hash(abi.encodePacked(traceRoot));

        uint256 gasBefore = gasleft();
        verifier.verifyTraceCommitment(traceRoot, expectedCommitment);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("verifyTraceCommitment gas used:", gasUsed);
        assertLt(gasUsed, 10000, "verifyTraceCommitment too expensive");
    }

    function test_GasRegression_VerifyConstraintCommitment() public {
        bytes32 constraintRoot = SHA3Hasher.hash(abi.encodePacked("constraint_root"));
        bytes32 expectedCommitment = SHA3Hasher.hash(abi.encodePacked(constraintRoot));

        uint256 gasBefore = gasleft();
        verifier.verifyConstraintCommitment(constraintRoot, expectedCommitment);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("verifyConstraintCommitment gas used:", gasUsed);
        assertLt(gasUsed, 10000, "verifyConstraintCommitment too expensive");
    }

    // =========================================================================
    // TEST-030-06: Full Verification Gas
    // =========================================================================

    function test_GasRegression_VerifyProof() public {
        ProofCodec.STARKProof memory proof = _createValidProof();
        bytes32 publicInput = keccak256("test_public_input");

        uint256 gasBefore = gasleft();
        verifier.verifyProof(proof, publicInput);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("verifyProof gas used:", gasUsed);
        console.log("Target:", STARK_VERIFY_TARGET);
        
        // Track progress toward target
        if (gasUsed > STARK_VERIFY_TARGET) {
            console.log("WARNING: verifyProof exceeds target by:", gasUsed - STARK_VERIFY_TARGET);
        } else {
            console.log("SUCCESS: verifyProof under target by:", STARK_VERIFY_TARGET - gasUsed);
        }
    }

    // =========================================================================
    // TEST-030-07: AIR Constraints Gas
    // =========================================================================

    function test_GasRegression_AIRComputeTransition() public view {
        // Create test witness
        uint256[] memory witness = new uint256[](4);
        witness[0] = 100; // state0
        witness[1] = 200; // state1
        witness[2] = 110; // nextState0
        witness[3] = 210; // nextState1

        uint256 gasBefore = gasleft();
        airConstraints.computeTransitionConstraint(
            witness[0],
            witness[1],
            witness[2],
            witness[3]
        );
        uint256 gasUsed = gasBefore - gasleft();

        console.log("AIR transition constraint gas used:", gasUsed);
        assertLt(gasUsed, 5000, "AIR constraint too expensive");
    }

    // =========================================================================
    // TEST-030-08: Batch Verification Gas
    // =========================================================================

    function test_GasRegression_BatchVerifyEvaluations() public {
        uint256[] memory evaluations = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            evaluations[i] = (i + 1) * 1000;
        }

        bytes32 root = verifier.computeTraceRoot(evaluations);

        // Prepare batch verification for 3 indices
        bytes32[] memory leaves = new bytes32[](3);
        uint256[] memory indices = new uint256[](3);
        bytes32[][] memory allSiblings = new bytes32[][](3);

        uint256[3] memory testIndices = [uint256(0), uint256(2), uint256(5)];
        for (uint256 i = 0; i < 3; i++) {
            indices[i] = testIndices[i];
            leaves[i] = verifier.computeTraceLeaf(evaluations[testIndices[i]], testIndices[i]);
            allSiblings[i] = _computeMerkleProof(evaluations, testIndices[i]);
        }

        uint256 gasBefore = gasleft();
        verifier.verifyTraceEvaluationsBatch(leaves, indices, allSiblings, root);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("verifyTraceEvaluationsBatch (3) gas used:", gasUsed);
        assertLt(gasUsed, 150000, "Batch verification too expensive");
    }

    // =========================================================================
    // TEST-030-09: Domain Operations Gas
    // =========================================================================

    function test_GasRegression_ComputeDomainElement() public {
        uint256 domainSize = 256;
        uint256 index = 100;

        uint256 gasBefore = gasleft();
        verifier.computeDomainElement(index, domainSize);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("computeDomainElement gas used:", gasUsed);
        assertLt(gasUsed, 10000, "computeDomainElement too expensive");
    }

    function test_GasRegression_IsValidDomainSize() public {
        uint256 gasBefore = gasleft();
        verifier.isValidDomainSize(256);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("isValidDomainSize gas used:", gasUsed);
        assertLt(gasUsed, 500, "isValidDomainSize should be very cheap");
    }

    // =========================================================================
    // TEST-030-10: Gas Summary Report
    // =========================================================================

    function test_GasReport_Summary() public {
        console.log("=== Gas Regression Summary ===");
        console.log("Target | Component | Status");
        console.log("-------|-----------|--------");
        
        // modExp
        uint256 modExpGas = _measureModExp();
        console.log(
            modExpGas < MODEXP_TARGET ? "PASS" : "FAIL",
            " | modExp | ",
            modExpGas
        );

        // modInverse
        uint256 modInverseGas = _measureModInverse();
        console.log(
            modInverseGas < MODINVERSE_TARGET ? "PASS" : "FAIL",
            " | modInverse | ",
            modInverseGas
        );

        // batchMulMod
        uint256 batchMulGas = _measureBatchMulMod();
        console.log(
            batchMulGas < BATCH_MULMOD_10_TARGET ? "PASS" : "FAIL",
            " | batchMulMod (10) | ",
            batchMulGas
        );
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _measureModExp() internal returns (uint256) {
        uint256 gasBefore = gasleft();
        OptimizedField.modExp(12345, 1000, FIELD_MODULUS);
        return gasBefore - gasleft();
    }

    function _measureModInverse() internal returns (uint256) {
        uint256 gasBefore = gasleft();
        OptimizedField.modInverse(12345, FIELD_MODULUS);
        return gasBefore - gasleft();
    }

    function _measureBatchMulMod() internal returns (uint256) {
        uint256[] memory a = new uint256[](10);
        uint256[] memory b = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            a[i] = (i + 1) * 1000;
            b[i] = (i + 1) * 2000;
        }
        uint256 gasBefore = gasleft();
        OptimizedField.batchMulMod(a, b, FIELD_MODULUS);
        return gasBefore - gasleft();
    }

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
        
        proof.queryIndices = new uint256[](80);
        proof.merkleProofs = new bytes32[][](80);
        proof.evaluations = new uint256[][](80);
        
        for (uint256 i = 0; i < 80; i++) {
            proof.queryIndices[i] = i;
            proof.merkleProofs[i] = new bytes32[](4);
            proof.evaluations[i] = new uint256[](2);
        }
        
        proof.finalPolynomial = new uint256[](2);
        proof.finalPolynomial[0] = 1;
        proof.finalPolynomial[1] = 2;
    }

    function _computeMerkleProof(
        uint256[] memory evaluations,
        uint256 index
    ) internal view returns (bytes32[] memory siblings) {
        uint256 depth = 3;
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
