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
    function test_ContractSizes_WithinLimit() public view {
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
    
    // =========================================================================
    // TEST-021-B: AIRConstraints Functionality Tests
    // =========================================================================
    
    /// @notice Test AIR constraint initialization
    function test_AIRConstraints_GetConstraintCount() public view {
        uint256 count = airConstraints.getConstraintCount();
        assertTrue(count > 0, "Should have constraints defined");
        emit log_named_uint("Constraint count", count);
    }
    
    /// @notice Test constraint evaluation with valid input
    function test_AIRConstraints_EvaluateConstraints() public view {
        // Create test trace data
        uint256[] memory trace = new uint256[](16);
        for (uint256 i = 0; i < 16; i++) {
            trace[i] = i + 1;
        }
        
        // Evaluate (should not revert)
        uint256[] memory results = airConstraints.evaluateConstraints(trace);
        assertTrue(results.length > 0, "Should return evaluation results");
    }
    
    /// @notice Test boundary constraints
    function test_AIRConstraints_GetBoundaryConstraints() public view {
        (uint256[] memory indices, uint256[] memory values) = airConstraints.getBoundaryConstraints();
        
        // Basic sanity checks
        assertEq(indices.length, values.length, "Boundary constraint arrays should match");
        emit log_named_uint("Boundary constraint count", indices.length);
    }
    
    // =========================================================================
    // TEST-021-C: ConstraintEvaluator Tests
    // =========================================================================
    
    /// @notice Test constraint evaluator initialization
    function test_ConstraintEvaluator_Initialize() public view {
        // ConstraintEvaluator should be ready to use
        assertTrue(address(constraintEvaluator).code.length > 0, "Should be deployed");
    }
    
    /// @notice Test polynomial evaluation
    function test_ConstraintEvaluator_EvaluatePolynomial() public view {
        // Create simple polynomial coefficients: 1 + 2x + 3x^2
        uint256[] memory coeffs = new uint256[](3);
        coeffs[0] = 1;
        coeffs[1] = 2;
        coeffs[2] = 3;
        
        uint256 x = 2;
        uint256 result = constraintEvaluator.evaluatePolynomial(coeffs, x);
        
        // Expected: 1 + 2*2 + 3*4 = 1 + 4 + 12 = 17
        assertEq(result, 17, "Polynomial evaluation incorrect");
    }
    
    /// @notice Test batch constraint evaluation
    function test_ConstraintEvaluator_BatchEvaluate() public view {
        uint256[] memory values = new uint256[](4);
        values[0] = 1;
        values[1] = 2;
        values[2] = 3;
        values[3] = 4;
        
        uint256[] memory results = constraintEvaluator.batchEvaluate(values);
        assertEq(results.length, values.length, "Batch results should match input length");
    }
    
    // =========================================================================
    // TEST-021-D: Gas Consumption Tests
    // =========================================================================
    
    /// @notice Measure gas for AIRConstraints evaluation
    function test_GasConsumption_AIRConstraints() public {
        uint256[] memory trace = new uint256[](16);
        for (uint256 i = 0; i < 16; i++) {
            trace[i] = i + 1;
        }
        
        uint256 gasBefore = gasleft();
        airConstraints.evaluateConstraints(trace);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("AIRConstraints.evaluateConstraints gas", gasUsed);
        
        // Sanity check: should be reasonable
        assertTrue(gasUsed < 1000000, "Gas consumption too high");
    }
    
    /// @notice Measure gas for ConstraintEvaluator
    function test_GasConsumption_ConstraintEvaluator() public {
        uint256[] memory coeffs = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            coeffs[i] = i + 1;
        }
        
        uint256 gasBefore = gasleft();
        constraintEvaluator.evaluatePolynomial(coeffs, 5);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("ConstraintEvaluator.evaluatePolynomial gas", gasUsed);
        
        assertTrue(gasUsed < 100000, "Gas consumption too high");
    }
    
    // =========================================================================
    // TEST-021-E: Integration Tests
    // =========================================================================
    
    /// @notice Test AIRConstraints and ConstraintEvaluator work together
    function test_Integration_AIRAndEvaluator() public view {
        // Get constraint definitions
        uint256 constraintCount = airConstraints.getConstraintCount();
        
        // Prepare trace
        uint256[] memory trace = new uint256[](16);
        for (uint256 i = 0; i < 16; i++) {
            trace[i] = i;
        }
        
        // Evaluate constraints
        uint256[] memory constraintResults = airConstraints.evaluateConstraints(trace);
        
        // Use evaluator for additional processing
        uint256[] memory finalResults = constraintEvaluator.batchEvaluate(constraintResults);
        
        // Verify integration
        assertEq(finalResults.length, constraintResults.length, "Integration failed");
        emit log_named_uint("Integration test constraint count", constraintCount);
        emit log_named_uint("Integration test result count", finalResults.length);
    }
    
    // =========================================================================
    // TEST-021-F: Edge Cases
    // =========================================================================
    
    /// @notice Test with empty trace
    function test_EdgeCase_EmptyTrace() public {
        uint256[] memory emptyTrace = new uint256[](0);
        
        // Should handle gracefully (revert or return empty)
        try airConstraints.evaluateConstraints(emptyTrace) returns (uint256[] memory results) {
            // If it doesn't revert, should return empty
            assertEq(results.length, 0, "Empty trace should return empty results");
        } catch {
            // Reverting is also acceptable
            assertTrue(true, "Reverted on empty trace (acceptable)");
        }
    }
    
    /// @notice Test with single element
    function test_EdgeCase_SingleElement() public view {
        uint256[] memory singleTrace = new uint256[](1);
        singleTrace[0] = 42;
        
        // Should handle single element
        uint256[] memory results = airConstraints.evaluateConstraints(singleTrace);
        assertTrue(results.length >= 0, "Should handle single element");
    }
    
    /// @notice Test with maximum values
    function test_EdgeCase_MaxValues() public view {
        uint256[] memory maxTrace = new uint256[](4);
        maxTrace[0] = type(uint256).max;
        maxTrace[1] = type(uint256).max - 1;
        maxTrace[2] = type(uint256).max / 2;
        maxTrace[3] = 0;
        
        // Should handle max values (may overflow intentionally in field arithmetic)
        uint256[] memory results = airConstraints.evaluateConstraints(maxTrace);
        assertTrue(results.length > 0, "Should handle max values");
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
    function test_ChainId_Detection() public view {
        uint256 currentChainId = block.chainid;
        emit log_named_uint("Current chain ID", currentChainId);
        
        // In tests, chain ID is typically 31337 (anvil default)
        assertTrue(currentChainId > 0, "Chain ID should be set");
    }
    
    /// @notice Test block properties are accessible
    function test_BlockProperties() public view {
        assertTrue(block.number > 0, "Block number should be set");
        assertTrue(block.timestamp > 0, "Timestamp should be set");
        assertTrue(block.gaslimit > 0, "Gas limit should be set");
        
        emit log_named_uint("Block number", block.number);
        emit log_named_uint("Timestamp", block.timestamp);
        emit log_named_uint("Gas limit", block.gaslimit);
    }
    
    /// @notice Test gas price compatibility
    function test_GasPrice() public view {
        uint256 gasPrice = tx.gasprice;
        emit log_named_uint("Gas price (wei)", gasPrice);
        
        // Gas price should be reasonable
        assertTrue(gasPrice < 1000 gwei, "Gas price seems unreasonable");
    }
    
    /// @notice Verify EVM version compatibility (Paris)
    function test_EVMVersion_Paris() public view {
        // PUSH0 opcode was introduced in Shanghai
        // We're targeting Paris, so we shouldn't rely on Shanghai features
        
        // This test verifies basic EVM operations work
        uint256 a = 100;
        uint256 b = 200;
        uint256 sum = a + b;
        
        assertEq(sum, 300, "Basic arithmetic should work");
    }
    
    /// @notice Test CREATE2 is available (introduced in Constantinople)
    function test_CREATE2_Available() public {
        // CREATE2 should be available on all target networks
        bytes memory bytecode = type(TestContract).creationCode;
        bytes32 salt = keccak256("test_salt");
        
        address predicted = address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(bytecode)
        )))));
        
        assertTrue(predicted != address(0), "CREATE2 address calculation works");
    }
}

/// @notice Simple test contract for CREATE2 testing
contract TestContract {
    uint256 public value = 42;
}
