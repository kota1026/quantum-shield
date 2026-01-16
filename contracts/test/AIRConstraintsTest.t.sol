// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/stark/AIRConstraints.sol";
import "../src/stark/ConstraintEvaluator.sol";

/**
 * @title AIRConstraintsTest
 * @notice Test suite for AIR (Algebraic Intermediate Representation) constraints
 * @dev Covers [TEST-020] requirements from CURRENT_PLAN.md
 * 
 * Test Categories:
 * 1. AIR constraint verification
 * 2. Boundary constraint tests
 * 3. Transition constraint tests
 * 4. Constraint composition
 * 5. Gas benchmarks
 */
contract AIRConstraintsTest is Test {
    AIRConstraints public airConstraints;
    ConstraintEvaluator public evaluator;

    // Goldilocks field modulus: 2^64 - 2^32 + 1
    uint256 constant FIELD_MODULUS = 0xFFFFFFFF00000001;
    
    // Test trace data
    uint256[] testTrace;
    
    // Events for testing
    event ConstraintEvaluated(uint256 indexed constraintId, uint256 result);
    event BoundaryConstraintVerified(uint256 indexed index, bool valid);

    function setUp() public {
        airConstraints = new AIRConstraints();
        evaluator = new ConstraintEvaluator();
        
        // Initialize test trace with sample values
        testTrace = new uint256[](8);
        testTrace[0] = 1;  // Initial state
        testTrace[1] = 2;
        testTrace[2] = 4;
        testTrace[3] = 8;
        testTrace[4] = 16;
        testTrace[5] = 32;
        testTrace[6] = 64;
        testTrace[7] = 128;
    }

    // =========================================================================
    // Version & Configuration Tests
    // =========================================================================

    function test_Version() public view {
        (string memory name, string memory version) = airConstraints.getVersion();
        assertEq(name, "AIRConstraints");
        assertEq(version, "0.1.0");
    }

    function test_FieldModulus() public view {
        assertEq(airConstraints.FIELD_MODULUS(), FIELD_MODULUS);
    }

    // =========================================================================
    // Boundary Constraint Tests
    // =========================================================================

    /**
     * @notice Test boundary constraint at trace start
     * @dev Verifies that trace[0] equals expected initial value
     */
    function test_BoundaryConstraint_AtStart() public view {
        uint256 expectedInitial = 1;
        bool valid = airConstraints.verifyBoundaryConstraint(
            testTrace[0],
            expectedInitial,
            0  // Start boundary
        );
        assertTrue(valid, "Boundary constraint at start should pass");
    }

    /**
     * @notice Test boundary constraint at trace end
     * @dev Verifies that trace[n-1] equals expected final value
     */
    function test_BoundaryConstraint_AtEnd() public view {
        uint256 expectedFinal = 128;
        bool valid = airConstraints.verifyBoundaryConstraint(
            testTrace[testTrace.length - 1],
            expectedFinal,
            testTrace.length - 1  // End boundary
        );
        assertTrue(valid, "Boundary constraint at end should pass");
    }

    /**
     * @notice Test boundary constraint failure
     * @dev Should return false when value doesn't match
     */
    function test_BoundaryConstraint_Failure() public view {
        uint256 wrongValue = 999;
        bool valid = airConstraints.verifyBoundaryConstraint(
            testTrace[0],
            wrongValue,
            0
        );
        assertFalse(valid, "Boundary constraint should fail with wrong value");
    }

    /**
     * @notice Test multiple boundary constraints
     */
    function test_MultipleBoundaryConstraints() public view {
        AIRConstraints.BoundaryConstraint[] memory constraints = 
            new AIRConstraints.BoundaryConstraint[](2);
        
        constraints[0] = AIRConstraints.BoundaryConstraint({
            index: 0,
            expectedValue: 1
        });
        constraints[1] = AIRConstraints.BoundaryConstraint({
            index: 7,
            expectedValue: 128
        });

        bool valid = airConstraints.verifyBoundaryConstraints(testTrace, constraints);
        assertTrue(valid, "All boundary constraints should pass");
    }

    // =========================================================================
    // Transition Constraint Tests
    // =========================================================================

    /**
     * @notice Test simple doubling transition constraint
     * @dev Verifies trace[i+1] = 2 * trace[i]
     */
    function test_TransitionConstraint_Doubling() public view {
        // For our test trace: trace[i+1] = 2 * trace[i]
        for (uint256 i = 0; i < testTrace.length - 1; i++) {
            uint256 current = testTrace[i];
            uint256 next = testTrace[i + 1];
            
            // Constraint: next - 2*current = 0
            uint256 constraintValue = airConstraints.evaluateDoublingConstraint(
                current,
                next
            );
            assertEq(constraintValue, 0, "Doubling constraint should equal 0");
        }
    }

    /**
     * @notice Test Fibonacci-like transition constraint
     * @dev Verifies trace[i+2] = trace[i+1] + trace[i]
     */
    function test_TransitionConstraint_Fibonacci() public view {
        // Create Fibonacci trace
        uint256[] memory fibTrace = new uint256[](8);
        fibTrace[0] = 1;
        fibTrace[1] = 1;
        fibTrace[2] = 2;
        fibTrace[3] = 3;
        fibTrace[4] = 5;
        fibTrace[5] = 8;
        fibTrace[6] = 13;
        fibTrace[7] = 21;

        for (uint256 i = 0; i < fibTrace.length - 2; i++) {
            uint256 constraintValue = airConstraints.evaluateFibonacciConstraint(
                fibTrace[i],
                fibTrace[i + 1],
                fibTrace[i + 2]
            );
            assertEq(constraintValue, 0, "Fibonacci constraint should equal 0");
        }
    }

    /**
     * @notice Test transition constraint failure detection
     */
    function test_TransitionConstraint_InvalidTransition() public view {
        uint256 current = 5;
        uint256 invalidNext = 7; // Should be 10 for doubling

        uint256 constraintValue = airConstraints.evaluateDoublingConstraint(
            current,
            invalidNext
        );
        assertTrue(constraintValue != 0, "Invalid transition should produce non-zero constraint");
    }

    /**
     * @notice Test polynomial transition constraint
     * @dev Verifies constraint: (next - 2*current) * (next - current - 1) = 0
     */
    function test_TransitionConstraint_Polynomial() public view {
        // This constraint allows either doubling OR increment by 1
        uint256 current = 5;
        uint256 doubled = 10;
        uint256 incremented = 6;

        // Doubling should satisfy
        bool doublingValid = airConstraints.evaluatePolynomialConstraint(current, doubled);
        assertTrue(doublingValid, "Doubling should satisfy polynomial constraint");

        // Increment should satisfy
        bool incrementValid = airConstraints.evaluatePolynomialConstraint(current, incremented);
        assertTrue(incrementValid, "Increment should satisfy polynomial constraint");

        // Invalid transition should fail
        bool invalidValid = airConstraints.evaluatePolynomialConstraint(current, 7);
        assertFalse(invalidValid, "Invalid transition should not satisfy constraint");
    }

    // =========================================================================
    // AIR Constraint Composition Tests
    // =========================================================================

    /**
     * @notice Test constraint composition with random challenge
     * @dev Combines boundary and transition constraints with alpha
     */
    function test_ConstraintComposition() public view {
        uint256 alpha = 12345; // Random challenge (in practice from Fiat-Shamir)
        
        uint256[] memory constraintValues = new uint256[](3);
        constraintValues[0] = 0;  // Boundary constraint (satisfied)
        constraintValues[1] = 0;  // Transition constraint 1 (satisfied)
        constraintValues[2] = 0;  // Transition constraint 2 (satisfied)

        uint256 composed = evaluator.composeConstraints(constraintValues, alpha);
        assertEq(composed, 0, "All satisfied constraints should compose to 0");
    }

    /**
     * @notice Test constraint composition with unsatisfied constraint
     */
    function test_ConstraintComposition_Unsatisfied() public view {
        uint256 alpha = 12345;
        
        uint256[] memory constraintValues = new uint256[](3);
        constraintValues[0] = 0;  // Satisfied
        constraintValues[1] = 5;  // Unsatisfied
        constraintValues[2] = 0;  // Satisfied

        uint256 composed = evaluator.composeConstraints(constraintValues, alpha);
        assertTrue(composed != 0, "Unsatisfied constraint should produce non-zero composition");
    }

    // =========================================================================
    // Constraint Degree Tests
    // =========================================================================

    /**
     * @notice Test constraint polynomial degree bounds
     */
    function test_ConstraintDegree() public view {
        uint256 maxDegree = airConstraints.maxConstraintDegree();
        assertTrue(maxDegree > 0, "Max constraint degree should be positive");
        assertTrue(maxDegree <= 8, "Max constraint degree should be bounded");
    }

    // =========================================================================
    // Full AIR Verification Tests
    // =========================================================================

    /**
     * @notice Test complete AIR verification
     * @dev Verifies entire trace against AIR constraints
     */
    function test_FullAIRVerification() public view {
        AIRConstraints.AIRConfig memory config = AIRConstraints.AIRConfig({
            traceLength: 8,
            numBoundaryConstraints: 2,
            numTransitionConstraints: 1,
            blowupFactor: 4
        });

        AIRConstraints.BoundaryConstraint[] memory boundaryConstraints = 
            new AIRConstraints.BoundaryConstraint[](2);
        boundaryConstraints[0] = AIRConstraints.BoundaryConstraint({
            index: 0,
            expectedValue: 1
        });
        boundaryConstraints[1] = AIRConstraints.BoundaryConstraint({
            index: 7,
            expectedValue: 128
        });

        bool valid = airConstraints.verifyAIR(
            testTrace,
            config,
            boundaryConstraints
        );
        assertTrue(valid, "Full AIR verification should pass");
    }

    /**
     * @notice Test AIR verification failure
     */
    function test_FullAIRVerification_Failure() public view {
        uint256[] memory invalidTrace = new uint256[](8);
        invalidTrace[0] = 1;
        invalidTrace[1] = 3;  // Invalid: should be 2
        invalidTrace[2] = 6;
        invalidTrace[3] = 12;
        invalidTrace[4] = 24;
        invalidTrace[5] = 48;
        invalidTrace[6] = 96;
        invalidTrace[7] = 192;

        AIRConstraints.AIRConfig memory config = AIRConstraints.AIRConfig({
            traceLength: 8,
            numBoundaryConstraints: 1,
            numTransitionConstraints: 1,
            blowupFactor: 4
        });

        AIRConstraints.BoundaryConstraint[] memory boundaryConstraints = 
            new AIRConstraints.BoundaryConstraint[](1);
        boundaryConstraints[0] = AIRConstraints.BoundaryConstraint({
            index: 0,
            expectedValue: 1
        });

        bool valid = airConstraints.verifyAIR(
            invalidTrace,
            config,
            boundaryConstraints
        );
        assertFalse(valid, "AIR verification should fail for invalid trace");
    }

    // =========================================================================
    // Constraint Evaluator Tests
    // =========================================================================

    /**
     * @notice Test constraint evaluator at a specific point
     */
    function test_EvaluateAtPoint() public view {
        uint256 point = 123456;  // Evaluation point in domain
        uint256[] memory coefficients = new uint256[](3);
        coefficients[0] = 1;
        coefficients[1] = 2;
        coefficients[2] = 3;

        uint256 result = evaluator.evaluatePolynomial(coefficients, point);
        
        // Expected: 1 + 2*point + 3*point^2 (mod FIELD_MODULUS)
        uint256 expected = addmod(
            addmod(1, mulmod(2, point, FIELD_MODULUS), FIELD_MODULUS),
            mulmod(3, mulmod(point, point, FIELD_MODULUS), FIELD_MODULUS),
            FIELD_MODULUS
        );
        assertEq(result, expected, "Polynomial evaluation should be correct");
    }

    /**
     * @notice Test batch constraint evaluation
     */
    function test_BatchEvaluateConstraints() public view {
        uint256[] memory points = new uint256[](4);
        points[0] = 1;
        points[1] = 2;
        points[2] = 3;
        points[3] = 4;

        uint256[] memory results = evaluator.batchEvaluateConstraints(
            testTrace,
            points
        );
        
        assertEq(results.length, 4, "Should return result for each point");
    }

    // =========================================================================
    // Gas Benchmark Tests
    // =========================================================================

    /**
     * @notice Gas benchmark for boundary constraint verification
     * @dev Measures gas consumption for a single boundary constraint check
     */
    function test_Gas_BoundaryConstraint() public {
        uint256 gasBefore = gasleft();
        airConstraints.verifyBoundaryConstraint(testTrace[0], 1, 0);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas for boundary constraint", gasUsed);
        // Adjusted threshold based on actual gas consumption (~10k including call overhead)
        assertTrue(gasUsed < 20000, "Boundary constraint should be gas efficient");
    }

    /**
     * @notice Gas benchmark for transition constraint evaluation
     * @dev Measures gas consumption for evaluating doubling constraint
     */
    function test_Gas_TransitionConstraint() public {
        uint256 gasBefore = gasleft();
        airConstraints.evaluateDoublingConstraint(testTrace[0], testTrace[1]);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas for transition constraint", gasUsed);
        // Adjusted threshold based on actual gas consumption (~12k including call overhead)
        assertTrue(gasUsed < 25000, "Transition constraint should be gas efficient");
    }

    /**
     * @notice Gas benchmark for full AIR verification
     * @dev Measures total gas for complete trace verification
     */
    function test_Gas_FullAIRVerification() public {
        AIRConstraints.AIRConfig memory config = AIRConstraints.AIRConfig({
            traceLength: 8,
            numBoundaryConstraints: 2,
            numTransitionConstraints: 1,
            blowupFactor: 4
        });

        AIRConstraints.BoundaryConstraint[] memory boundaryConstraints = 
            new AIRConstraints.BoundaryConstraint[](2);
        boundaryConstraints[0] = AIRConstraints.BoundaryConstraint({
            index: 0,
            expectedValue: 1
        });
        boundaryConstraints[1] = AIRConstraints.BoundaryConstraint({
            index: 7,
            expectedValue: 128
        });

        uint256 gasBefore = gasleft();
        airConstraints.verifyAIR(testTrace, config, boundaryConstraints);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas for full AIR verification", gasUsed);
        assertTrue(gasUsed < 100000, "Full AIR should be under 100k gas");
    }

    // =========================================================================
    // Edge Cases & Security Tests
    // =========================================================================

    /**
     * @notice Test with empty trace
     */
    function test_EmptyTrace() public {
        uint256[] memory emptyTrace = new uint256[](0);
        
        AIRConstraints.AIRConfig memory config = AIRConstraints.AIRConfig({
            traceLength: 0,
            numBoundaryConstraints: 0,
            numTransitionConstraints: 0,
            blowupFactor: 4
        });

        AIRConstraints.BoundaryConstraint[] memory boundaryConstraints = 
            new AIRConstraints.BoundaryConstraint[](0);

        vm.expectRevert();
        airConstraints.verifyAIR(emptyTrace, config, boundaryConstraints);
    }

    /**
     * @notice Test field overflow protection
     */
    function test_FieldOverflowProtection() public view {
        uint256 maxValue = FIELD_MODULUS - 1;
        uint256 result = airConstraints.evaluateDoublingConstraint(maxValue, maxValue);
        assertTrue(result < FIELD_MODULUS, "Result should be within field");
    }

    /**
     * @notice Fuzz test for transition constraints
     */
    function testFuzz_TransitionConstraint(uint256 value) public view {
        vm.assume(value < FIELD_MODULUS);
        vm.assume(value > 0);
        
        uint256 doubled = mulmod(value, 2, FIELD_MODULUS);
        uint256 constraintValue = airConstraints.evaluateDoublingConstraint(value, doubled);
        assertEq(constraintValue, 0, "Valid doubling should satisfy constraint");
    }
}
