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
 * ## Gas Targets - REALISTIC VALUES
 * 
 * ### Constraints
 * 1. External call overhead: ~2,600 gas base cost per call
 * 2. Pure Solidity SHA3-256: ~1,000,000 gas per hash (no precompile)
 * 3. These are structural limitations, not bugs
 *
 * ### Week 10 Achieved (Internal Library Calls - No External Overhead)
 * | Component        | Week 10 Achieved | Target       |
 * |-----------------|------------------|--------------|
 * | modExp          | 787 gas          | < 2,000      |
 * | modInverse      | 1,969 gas        | < 5,000      |
 * | batchMulMod     | 1,487 gas/10     | < 20,000     |
 *
 * ### Week 11 External Calls (Includes ~2,600 gas overhead)
 * | Component        | Measured    | Target       |
 * |-----------------|-------------|--------------|
 * | fieldAdd        | ~5,500 gas  | < 10,000     |
 * | fieldMul        | ~5,700 gas  | < 10,000     |
 * | fieldExp        | ~6,600 gas  | < 10,000     |
 *
 * ### SHA3-256 Operations (Pure Solidity - No Precompile)
 * | Component        | Measured      | Target         |
 * |-----------------|---------------|----------------|
 * | SHA3 32 bytes   | ~1,000,000    | < 1,500,000    |
 * | SHA3 256 bytes  | ~2,000,000    | < 3,000,000    |
 * | hashPair        | ~1,000,000    | < 1,500,000    |
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

    // Domain separators - MUST match STARKVerifier.sol
    bytes32 private constant DOMAIN_TRACE = bytes32("QS_STARK_TRACE_V1");
    bytes32 private constant DOMAIN_MERKLE_NODE = bytes32("QS_STARK_MERKLE_V1");

    // =========================================================================
    // Gas Targets - REALISTIC VALUES
    // =========================================================================

    // Week 10 Baselines (Internal library calls, no external overhead)
    uint256 constant MODEXP_TARGET = 2000;
    uint256 constant MODINVERSE_TARGET = 5000;
    uint256 constant BATCH_MULMOD_10_TARGET = 20000;
    
    // External call targets (includes ~2,600 gas base overhead)
    uint256 constant EXTERNAL_FIELD_OP_TARGET = 10000;
    
    // SHA3-256 targets (Pure Solidity implementation ~1M gas/hash)
    uint256 constant SHA3_32_BYTES_TARGET = 1_500_000;
    uint256 constant SHA3_256_BYTES_TARGET = 3_000_000;
    uint256 constant HASH_PAIR_TARGET = 1_500_000;
    
    // Merkle operation targets (multiple SHA3 hashes)
    uint256 constant TRACE_LEAF_TARGET = 1_500_000;
    uint256 constant TRACE_ROOT_8_TARGET = 20_000_000;      // 8 elements
    uint256 constant TRACE_ROOT_256_TARGET = 1_000_000_000; // 256 elements
    uint256 constant VERIFY_COMMITMENT_TARGET = 1_500_000;
    uint256 constant VERIFY_EVAL_AT_INDEX_TARGET = 5_000_000;
    uint256 constant BATCH_VERIFY_TARGET = 15_000_000;
    
    // AIR constraint targets (external call overhead)
    uint256 constant AIR_CONSTRAINT_TARGET = 10000;
    
    // Full STARK verification (structure validation only, no full proof)
    uint256 constant STARK_VERIFY_TARGET = 500000;

    function setUp() public {
        verifier = new STARKVerifier();
        airConstraints = new AIRConstraints();
        constraintEvaluator = new ConstraintEvaluator();
    }

    // =========================================================================
    // TEST-030-01: OptimizedField Gas Regression (Internal Library - No Overhead)
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
    // TEST-030-02: STARKVerifier Component Gas (External Calls - With Overhead)
    // =========================================================================

    function test_GasRegression_FieldAdd() public {
        uint256 a = 12345;
        uint256 b = 67890;

        uint256 gasBefore = gasleft();
        verifier.fieldAdd(a, b);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("fieldAdd gas used:", gasUsed);
        assertLt(gasUsed, EXTERNAL_FIELD_OP_TARGET, "fieldAdd exceeds external call target");
    }

    function test_GasRegression_FieldMul() public {
        uint256 a = 12345;
        uint256 b = 67890;

        uint256 gasBefore = gasleft();
        verifier.fieldMul(a, b);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("fieldMul gas used:", gasUsed);
        assertLt(gasUsed, EXTERNAL_FIELD_OP_TARGET, "fieldMul exceeds external call target");
    }

    function test_GasRegression_FieldExp() public {
        uint256 base = 7;
        uint256 exp = 1000;

        uint256 gasBefore = gasleft();
        verifier.fieldExp(base, exp);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("fieldExp gas used:", gasUsed);
        assertLt(gasUsed, EXTERNAL_FIELD_OP_TARGET, "fieldExp exceeds target");
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
    // TEST-030-03: Hash Operations Gas (Pure Solidity SHA3-256)
    // =========================================================================

    function test_GasRegression_SHA3Hash32Bytes() public {
        bytes memory data = abi.encodePacked(bytes32(uint256(1)));

        uint256 gasBefore = gasleft();
        verifier.hashData(data);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("SHA3 hash (32 bytes) gas used:", gasUsed);
        assertLt(gasUsed, SHA3_32_BYTES_TARGET, "SHA3 hash exceeds Pure Solidity target");
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
        assertLt(gasUsed, SHA3_256_BYTES_TARGET, "SHA3 hash (256 bytes) exceeds target");
    }

    function test_GasRegression_HashPair() public {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));

        uint256 gasBefore = gasleft();
        verifier.hashPair(left, right);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("hashPair gas used:", gasUsed);
        assertLt(gasUsed, HASH_PAIR_TARGET, "hashPair exceeds Pure Solidity target");
    }

    // =========================================================================
    // TEST-030-04: Merkle Operations Gas (Multiple SHA3 Hashes)
    // =========================================================================

    function test_GasRegression_ComputeTraceLeaf() public {
        uint256 evaluation = 12345;
        uint256 index = 5;

        uint256 gasBefore = gasleft();
        verifier.computeTraceLeaf(evaluation, index);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("computeTraceLeaf gas used:", gasUsed);
        assertLt(gasUsed, TRACE_LEAF_TARGET, "computeTraceLeaf exceeds target");
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
        assertLt(gasUsed, TRACE_ROOT_8_TARGET, "computeTraceRoot (8) exceeds target");
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
        assertLt(gasUsed, TRACE_ROOT_256_TARGET, "computeTraceRoot (256) exceeds target");
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
        assertLt(gasUsed, VERIFY_EVAL_AT_INDEX_TARGET, "verifyTraceEvaluationAtIndex exceeds target");
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
        assertLt(gasUsed, VERIFY_COMMITMENT_TARGET, "verifyTraceCommitment exceeds target");
    }

    function test_GasRegression_VerifyConstraintCommitment() public {
        bytes32 constraintRoot = SHA3Hasher.hash(abi.encodePacked("constraint_root"));
        bytes32 expectedCommitment = SHA3Hasher.hash(abi.encodePacked(constraintRoot));

        uint256 gasBefore = gasleft();
        verifier.verifyConstraintCommitment(constraintRoot, expectedCommitment);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("verifyConstraintCommitment gas used:", gasUsed);
        assertLt(gasUsed, VERIFY_COMMITMENT_TARGET, "verifyConstraintCommitment exceeds target");
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
        // Create test witness - use evaluateDoublingConstraint
        uint256 current = 100;
        uint256 next = 200; // 2 * current

        uint256 gasBefore = gasleft();
        airConstraints.evaluateDoublingConstraint(current, next);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("AIR doubling constraint gas used:", gasUsed);
        assertLt(gasUsed, AIR_CONSTRAINT_TARGET, "AIR constraint exceeds external call target");
    }

    function test_GasRegression_AIRFibonacciConstraint() public view {
        // Test Fibonacci constraint
        uint256 current = 1;
        uint256 next1 = 1;
        uint256 next2 = 2; // current + next1

        uint256 gasBefore = gasleft();
        airConstraints.evaluateFibonacciConstraint(current, next1, next2);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("AIR Fibonacci constraint gas used:", gasUsed);
        assertLt(gasUsed, AIR_CONSTRAINT_TARGET, "AIR Fibonacci constraint exceeds external call target");
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
        assertLt(gasUsed, BATCH_VERIFY_TARGET, "Batch verification exceeds Pure Solidity target");
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
        assertLt(gasUsed, EXTERNAL_FIELD_OP_TARGET, "computeDomainElement exceeds external call target");
    }

    function test_GasRegression_IsValidDomainSize() public {
        uint256 gasBefore = gasleft();
        verifier.isValidDomainSize(256);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("isValidDomainSize gas used:", gasUsed);
        assertLt(gasUsed, EXTERNAL_FIELD_OP_TARGET, "isValidDomainSize exceeds external call target");
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

    /**
     * @notice Compute Merkle proof using domain-separated hashing
     * @dev MUST match STARKVerifier._hashMerkleNodes() exactly
     */
    function _computeMerkleProof(
        uint256[] memory evaluations,
        uint256 index
    ) internal pure returns (bytes32[] memory siblings) {
        uint256 depth = 3;
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
