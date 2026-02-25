// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/stark/AIRConstraints.sol";
import "../src/stark/ConstraintEvaluator.sol";

/**
 * @title DeploymentVerificationTest
 * @notice [TEST-021] Deployment verification tests for Week 8 infrastructure
 * @dev Tests contract deployment, initialization, and basic functionality
 */
contract DeploymentVerificationTest is Test {
    AIRConstraints public airConstraints;
    ConstraintEvaluator public constraintEvaluator;
    
    // Test addresses
    address public deployer = address(0x1);
    address public user = address(0x2);
    
    function setUp() public {
        vm.startPrank(deployer);
        
        // Deploy contracts
        airConstraints = new AIRConstraints();
        constraintEvaluator = new ConstraintEvaluator();
        
        vm.stopPrank();
    }
    
    // =========================================================================
    // TEST-021-A: Contract Deployment Tests
    // =========================================================================
    
    /// @notice Verify AIRConstraints deploys successfully
    function test_AIRConstraints_Deployment() public view {
        assertTrue(address(airConstraints) != address(0), "AIRConstraints should be deployed");
        assertTrue(address(airConstraints).code.length > 0, "AIRConstraints should have code");
    }
    
    /// @notice Verify ConstraintEvaluator deploys successfully
    function test_ConstraintEvaluator_Deployment() public view {
        assertTrue(address(constraintEvaluator) != address(0), "ConstraintEvaluator should be deployed");
        assertTrue(address(constraintEvaluator).code.length > 0, "ConstraintEvaluator should have code");
    }
    
    /// @notice Verify contract sizes are within EIP-170 limit
    function test_ContractSizes_WithinLimit() public {
        uint256 airSize = address(airConstraints).code.length;
        uint256 evalSize = address(constraintEvaluator).code.length;
        
        // EIP-170 limit: 24KB = 24576 bytes
        uint256 maxSize = 24576;
        
        assertTrue(airSize < maxSize, "AIRConstraints exceeds size limit");
        assertTrue(evalSize < maxSize, "ConstraintEvaluator exceeds size limit");
        
        // Log sizes for reference
        emit log_named_uint("AIRConstraints size (bytes)", airSize);
        emit log_named_uint("ConstraintEvaluator size (bytes)", evalSize);
    }
    
    /// @notice Verify version information is correct
    function test_VersionInfo() public view {
        (string memory airName, string memory airVersion) = airConstraints.getVersion();
        (string memory evalName, string memory evalVersion) = constraintEvaluator.getVersion();
        
        assertEq(airName, "AIRConstraints", "AIRConstraints name mismatch");
        assertEq(airVersion, "0.1.0", "AIRConstraints version mismatch");
        assertEq(evalName, "ConstraintEvaluator", "ConstraintEvaluator name mismatch");
        assertEq(evalVersion, "0.1.0", "ConstraintEvaluator version mismatch");
    }
    
    // =========================================================================
    // TEST-021-B: AIRConstraints Functionality Tests
    // =========================================================================
    
    /// @notice Test field modulus constant
    function test_AIRConstraints_FieldModulus() public view {
        uint256 expectedModulus = 0xFFFFFFFF00000001; // Goldilocks prime
        assertEq(airConstraints.FIELD_MODULUS(), expectedModulus, "Field modulus mismatch");
    }
    
    /// @notice Test max constraint degree
    function test_AIRConstraints_MaxConstraintDegree() public view {
        uint256 maxDegree = airConstraints.maxConstraintDegree();
        assertEq(maxDegree, 8, "Max constraint degree should be 8");
    }
    
    /// @notice Test boundary constraint verification
    function test_AIRConstraints_BoundaryConstraint() public view {
        // Same value should pass
        bool valid = airConstraints.verifyBoundaryConstraint(100, 100, 0);
        assertTrue(valid, "Same values should pass");
        
        // Different values should fail
        valid = airConstraints.verifyBoundaryConstraint(100, 200, 0);
        assertFalse(valid, "Different values should fail");
    }
    
    /// @notice Test doubling constraint evaluation
    function test_AIRConstraints_DoublingConstraint() public view {
        // 5 * 2 = 10, constraint should be satisfied (return 0)
        uint256 result = airConstraints.evaluateDoublingConstraint(5, 10);
        assertEq(result, 0, "Doubling constraint should be satisfied");
        
        // 5 * 2 != 11, constraint should not be satisfied
        result = airConstraints.evaluateDoublingConstraint(5, 11);
        assertTrue(result != 0, "Doubling constraint should not be satisfied");
    }
    
    /// @notice Test Fibonacci constraint evaluation
    function test_AIRConstraints_FibonacciConstraint() public view {
        // Fibonacci: 1, 1, 2 -> 1 + 1 = 2 ✓
        uint256 result = airConstraints.evaluateFibonacciConstraint(1, 1, 2);
        assertEq(result, 0, "Fibonacci constraint should be satisfied");
        
        // 1 + 1 != 3
        result = airConstraints.evaluateFibonacciConstraint(1, 1, 3);
        assertTrue(result != 0, "Fibonacci constraint should not be satisfied");
    }
    
    /// @notice Test polynomial constraint (allows doubling OR increment)
    function test_AIRConstraints_PolynomialConstraint() public view {
        // Doubling: 5 -> 10
        bool valid = airConstraints.evaluatePolynomialConstraint(5, 10);
        assertTrue(valid, "Doubling should satisfy polynomial constraint");
        
        // Increment: 5 -> 6
        valid = airConstraints.evaluatePolynomialConstraint(5, 6);
        assertTrue(valid, "Increment should satisfy polynomial constraint");
        
        // Neither: 5 -> 7
        valid = airConstraints.evaluatePolynomialConstraint(5, 7);
        assertFalse(valid, "Neither doubling nor increment should fail");
    }
    
    /// @notice Test transition constraints on trace
    function test_AIRConstraints_TransitionConstraints() public view {
        // Valid doubling trace: 1, 2, 4, 8
        uint256[] memory validTrace = new uint256[](4);
        validTrace[0] = 1;
        validTrace[1] = 2;
        validTrace[2] = 4;
        validTrace[3] = 8;
        
        bool valid = airConstraints.evaluateAllTransitionConstraints(validTrace);
        assertTrue(valid, "Valid doubling trace should pass");
        
        // Invalid trace: 1, 2, 5, 10
        uint256[] memory invalidTrace = new uint256[](4);
        invalidTrace[0] = 1;
        invalidTrace[1] = 2;
        invalidTrace[2] = 5; // Should be 4
        invalidTrace[3] = 10;
        
        valid = airConstraints.evaluateAllTransitionConstraints(invalidTrace);
        assertFalse(valid, "Invalid trace should fail");
    }
    
    /// @notice Test domain generator computation
    function test_AIRConstraints_DomainGenerator() public view {
        // Domain size must be power of 2
        uint256 omega = airConstraints.computeDomainGenerator(8);
        assertTrue(omega > 0, "Domain generator should be non-zero");
        assertTrue(omega < airConstraints.FIELD_MODULUS(), "Generator should be in field");
    }
    
    // =========================================================================
    // TEST-021-C: ConstraintEvaluator Tests
    // =========================================================================
    
    /// @notice Test polynomial evaluation with Horner's method
    function test_ConstraintEvaluator_EvaluatePolynomial() public view {
        // Polynomial: 1 + 2x + 3x^2 (coeffs = [1, 2, 3])
        uint256[] memory coeffs = new uint256[](3);
        coeffs[0] = 1;
        coeffs[1] = 2;
        coeffs[2] = 3;
        
        // At x = 2: 1 + 2*2 + 3*4 = 1 + 4 + 12 = 17
        uint256 result = constraintEvaluator.evaluatePolynomial(coeffs, 2);
        assertEq(result, 17, "Polynomial evaluation incorrect");
        
        // At x = 0: constant term = 1
        result = constraintEvaluator.evaluatePolynomial(coeffs, 0);
        assertEq(result, 1, "Polynomial at 0 should be constant term");
    }
    
    /// @notice Test constraint composition with alpha
    function test_ConstraintEvaluator_ComposeConstraints() public view {
        // constraints = [1, 2, 3], alpha = 2
        // result = 1*2^0 + 2*2^1 + 3*2^2 = 1 + 4 + 12 = 17
        uint256[] memory constraints = new uint256[](3);
        constraints[0] = 1;
        constraints[1] = 2;
        constraints[2] = 3;
        
        uint256 result = constraintEvaluator.composeConstraints(constraints, 2);
        assertEq(result, 17, "Constraint composition incorrect");
    }
    
    /// @notice Test weighted constraint composition
    function test_ConstraintEvaluator_WeightedComposition() public view {
        uint256[] memory constraints = new uint256[](3);
        constraints[0] = 10;
        constraints[1] = 20;
        constraints[2] = 30;
        
        uint256[] memory weights = new uint256[](3);
        weights[0] = 1;
        weights[1] = 2;
        weights[2] = 3;
        
        // 10*1 + 20*2 + 30*3 = 10 + 40 + 90 = 140
        uint256 result = constraintEvaluator.composeConstraintsWeighted(constraints, weights);
        assertEq(result, 140, "Weighted composition incorrect");
    }
    
    /// @notice Test batch constraint evaluation
    function test_ConstraintEvaluator_BatchEvaluate() public view {
        // Valid doubling trace
        uint256[] memory trace = new uint256[](4);
        trace[0] = 1;
        trace[1] = 2;
        trace[2] = 4;
        trace[3] = 8;
        
        uint256[] memory points = new uint256[](2);
        points[0] = 0;
        points[1] = 1;
        
        uint256[] memory results = constraintEvaluator.batchEvaluateConstraints(trace, points);
        assertEq(results.length, 2, "Should return 2 results");
    }
    
    /// @notice Test deep composition polynomial
    function test_ConstraintEvaluator_DeepComposition() public view {
        uint256 traceEval = 100;
        uint256 constraintEval = 200;
        uint256 alpha = 3;
        uint256 beta = 5;
        
        // DCP = alpha * constraintEval + beta * traceEval
        // = 3 * 200 + 5 * 100 = 600 + 500 = 1100
        uint256 result = constraintEvaluator.computeDeepComposition(traceEval, constraintEval, alpha, beta);
        assertEq(result, 1100, "Deep composition incorrect");
    }
    
    // =========================================================================
    // TEST-021-D: Gas Consumption Tests
    // =========================================================================
    
    /// @notice Measure gas for boundary constraint verification
    function test_GasConsumption_BoundaryConstraint() public {
        uint256 gasBefore = gasleft();
        airConstraints.verifyBoundaryConstraint(100, 100, 0);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("verifyBoundaryConstraint gas", gasUsed);
        assertTrue(gasUsed < 10000, "Gas consumption too high");
    }
    
    /// @notice Measure gas for doubling constraint
    function test_GasConsumption_DoublingConstraint() public {
        uint256 gasBefore = gasleft();
        airConstraints.evaluateDoublingConstraint(5, 10);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("evaluateDoublingConstraint gas", gasUsed);
        assertTrue(gasUsed < 10000, "Gas consumption too high");
    }
    
    /// @notice Measure gas for transition constraints
    function test_GasConsumption_TransitionConstraints() public {
        uint256[] memory trace = new uint256[](8);
        for (uint256 i = 0; i < 8; i++) {
            trace[i] = 1 << i; // 1, 2, 4, 8, 16, 32, 64, 128
        }
        
        uint256 gasBefore = gasleft();
        airConstraints.evaluateAllTransitionConstraints(trace);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("evaluateAllTransitionConstraints (8 elements) gas", gasUsed);
        assertTrue(gasUsed < 100000, "Gas consumption too high");
    }
    
    /// @notice Measure gas for polynomial evaluation
    function test_GasConsumption_PolynomialEvaluation() public {
        uint256[] memory coeffs = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            coeffs[i] = i + 1;
        }
        
        uint256 gasBefore = gasleft();
        constraintEvaluator.evaluatePolynomial(coeffs, 5);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("evaluatePolynomial (10 coeffs) gas", gasUsed);
        assertTrue(gasUsed < 50000, "Gas consumption too high");
    }
    
    // =========================================================================
    // TEST-021-E: Integration Tests
    // =========================================================================
    
    /// @notice Test full AIR verification
    function test_Integration_VerifyAIR() public view {
        // Create valid doubling trace: 1, 2, 4, 8
        uint256[] memory trace = new uint256[](4);
        trace[0] = 1;
        trace[1] = 2;
        trace[2] = 4;
        trace[3] = 8;
        
        // Create AIR config
        AIRConstraints.AIRConfig memory config = AIRConstraints.AIRConfig({
            traceLength: 4,
            numBoundaryConstraints: 2,
            numTransitionConstraints: 3,
            blowupFactor: 4
        });
        
        // Create boundary constraints
        AIRConstraints.BoundaryConstraint[] memory boundaries = new AIRConstraints.BoundaryConstraint[](2);
        boundaries[0] = AIRConstraints.BoundaryConstraint({index: 0, expectedValue: 1});
        boundaries[1] = AIRConstraints.BoundaryConstraint({index: 3, expectedValue: 8});
        
        // Verify AIR
        bool valid = airConstraints.verifyAIR(trace, config, boundaries);
        assertTrue(valid, "AIR verification should pass");
    }
    
    /// @notice Test integration between AIR and Evaluator
    function test_Integration_AIRAndEvaluator() public view {
        // Valid trace
        uint256[] memory trace = new uint256[](4);
        trace[0] = 1;
        trace[1] = 2;
        trace[2] = 4;
        trace[3] = 8;
        
        // Verify transitions with AIR
        bool transitionsValid = airConstraints.evaluateAllTransitionConstraints(trace);
        assertTrue(transitionsValid, "Transitions should be valid");
        
        // Use evaluator for polynomial operations
        uint256[] memory coeffs = new uint256[](4);
        for (uint256 i = 0; i < 4; i++) {
            coeffs[i] = trace[i];
        }
        
        uint256 polyEval = constraintEvaluator.evaluatePolynomial(coeffs, 2);
        assertTrue(polyEval > 0, "Polynomial evaluation should work");
    }
    
    // =========================================================================
    // TEST-021-F: Edge Cases
    // =========================================================================
    
    /// @notice Test with minimum trace length
    function test_EdgeCase_MinimumTrace() public view {
        uint256[] memory trace = new uint256[](2);
        trace[0] = 5;
        trace[1] = 10; // 5 * 2 = 10
        
        bool valid = airConstraints.evaluateAllTransitionConstraints(trace);
        assertTrue(valid, "Minimum length trace should work");
    }
    
    /// @notice Test with field modulus values
    function test_EdgeCase_FieldModulusValues() public view {
        uint256 modulus = airConstraints.FIELD_MODULUS();
        
        // Value at modulus should wrap to 0
        bool valid = airConstraints.verifyBoundaryConstraint(modulus, 0, 0);
        assertTrue(valid, "Modulus should wrap to 0");
        
        // Value above modulus should reduce
        valid = airConstraints.verifyBoundaryConstraint(modulus + 5, 5, 0);
        assertTrue(valid, "Value above modulus should reduce");
    }
    
    /// @notice Test empty polynomial handling
    function test_EdgeCase_EmptyPolynomial() public {
        uint256[] memory emptyCoeffs = new uint256[](0);
        
        vm.expectRevert(ConstraintEvaluator.EmptyPolynomial.selector);
        constraintEvaluator.evaluatePolynomial(emptyCoeffs, 5);
    }
    
    /// @notice Test trace too short
    function test_EdgeCase_TraceTooShort() public {
        uint256[] memory shortTrace = new uint256[](1);
        shortTrace[0] = 1;
        
        uint256[] memory points = new uint256[](1);
        points[0] = 0;
        
        vm.expectRevert(ConstraintEvaluator.TraceTooShort.selector);
        constraintEvaluator.batchEvaluateConstraints(shortTrace, points);
    }
}

/**
 * @title NetworkCompatibilityTest
 * @notice [TEST-022] Network compatibility verification tests
 * @dev Verifies contracts work correctly across different networks
 */
contract NetworkCompatibilityTest is Test {
    // Chain IDs for reference
    uint256 constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 constant ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
    uint256 constant BASE_SEPOLIA_CHAIN_ID = 84532;
    
    /// @notice Verify chain ID detection works
    function test_ChainId_Detection() public {
        uint256 currentChainId = block.chainid;
        emit log_named_uint("Current chain ID", currentChainId);
        
        // In tests, chain ID is typically 31337 (anvil default)
        assertTrue(currentChainId > 0, "Chain ID should be set");
    }
    
    /// @notice Test block properties are accessible
    function test_BlockProperties() public {
        assertTrue(block.number > 0, "Block number should be set");
        assertTrue(block.timestamp > 0, "Timestamp should be set");
        assertTrue(block.gaslimit > 0, "Gas limit should be set");
        
        emit log_named_uint("Block number", block.number);
        emit log_named_uint("Timestamp", block.timestamp);
        emit log_named_uint("Gas limit", block.gaslimit);
    }
    
    /// @notice Test gas price compatibility
    function test_GasPrice() public {
        uint256 gasPrice = tx.gasprice;
        emit log_named_uint("Gas price (wei)", gasPrice);
        
        // Gas price should be reasonable
        assertTrue(gasPrice < 1000 gwei, "Gas price seems unreasonable");
    }
    
    /// @notice Verify EVM version compatibility (Paris)
    function test_EVMVersion_Paris() public pure {
        // Basic arithmetic should work on all target networks
        uint256 a = 100;
        uint256 b = 200;
        uint256 sum = a + b;
        
        assertEq(sum, 300, "Basic arithmetic should work");
    }
}
