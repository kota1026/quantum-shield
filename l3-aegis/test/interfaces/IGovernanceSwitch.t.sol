// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/interfaces/IGovernanceSwitch.sol";

/// @title IGovernanceSwitchTest
/// @notice Tests for IGovernanceSwitch interface compliance
/// @dev Phase 3.1 Foundation - Interface validation tests
/// @dev Updated for DECEN-009~011: TRAINING mode added
contract IGovernanceSwitchTest is Test {
    // ============ Interface Existence Tests ============
    
    /// @notice Verify interface can be referenced
    function test_InterfaceExists() public pure {
        // Interface ID calculation
        bytes4 interfaceId = type(IGovernanceSwitch).interfaceId;
        assertTrue(interfaceId != bytes4(0), "Interface should have non-zero ID");
    }
    
    /// @notice Verify GovernanceMode enum values (updated for TRAINING mode)
    function test_GovernanceModeEnum() public pure {
        // Test enum values are sequential starting from 0
        assertEq(
            uint8(IGovernanceSwitch.GovernanceMode.TRAINING),
            0,
            "TRAINING should be 0"
        );
        assertEq(
            uint8(IGovernanceSwitch.GovernanceMode.CENTRALIZED),
            1,
            "CENTRALIZED should be 1"
        );
        assertEq(
            uint8(IGovernanceSwitch.GovernanceMode.MULTISIG),
            2,
            "MULTISIG should be 2"
        );
        assertEq(
            uint8(IGovernanceSwitch.GovernanceMode.DECENTRALIZED),
            3,
            "DECENTRALIZED should be 3"
        );
    }
    
    /// @notice Verify function selectors are unique
    function test_FunctionSelectorsUnique() public pure {
        bytes4 getGovernanceMode = IGovernanceSwitch.getGovernanceMode.selector;
        bytes4 getApprover = IGovernanceSwitch.getApprover.selector;
        bytes4 canApprove = IGovernanceSwitch.canApprove.selector;
        bytes4 getAdmin = IGovernanceSwitch.getAdmin.selector;
        bytes4 getMultisigConfig = IGovernanceSwitch.getMultisigConfig.selector;
        bytes4 getSecurityCouncilConfig = IGovernanceSwitch.getSecurityCouncilConfig.selector;
        bytes4 setGovernanceMode = IGovernanceSwitch.setGovernanceMode.selector;
        bytes4 approveAction = IGovernanceSwitch.approveAction.selector;
        bytes4 isTrainingMode = IGovernanceSwitch.isTrainingMode.selector;
        bytes4 canInitiateRollback = IGovernanceSwitch.canInitiateRollback.selector;
        
        // All selectors should be unique
        assertTrue(getGovernanceMode != getApprover, "Selectors must be unique");
        assertTrue(getApprover != canApprove, "Selectors must be unique");
        assertTrue(canApprove != getAdmin, "Selectors must be unique");
        assertTrue(getAdmin != getMultisigConfig, "Selectors must be unique");
        assertTrue(getMultisigConfig != getSecurityCouncilConfig, "Selectors must be unique");
        assertTrue(getSecurityCouncilConfig != setGovernanceMode, "Selectors must be unique");
        assertTrue(setGovernanceMode != approveAction, "Selectors must be unique");
        assertTrue(approveAction != isTrainingMode, "Selectors must be unique");
        assertTrue(isTrainingMode != canInitiateRollback, "Selectors must be unique");
    }
    
    /// @notice Document expected function signatures
    function test_FunctionSignatures() public pure {
        // View functions
        assertEq(
            IGovernanceSwitch.getGovernanceMode.selector,
            bytes4(keccak256("getGovernanceMode()")),
            "getGovernanceMode signature mismatch"
        );
        
        assertEq(
            IGovernanceSwitch.getApprover.selector,
            bytes4(keccak256("getApprover(bytes4)")),
            "getApprover signature mismatch"
        );
        
        assertEq(
            IGovernanceSwitch.canApprove.selector,
            bytes4(keccak256("canApprove(bytes4,address)")),
            "canApprove signature mismatch"
        );
        
        assertEq(
            IGovernanceSwitch.isTrainingMode.selector,
            bytes4(keccak256("isTrainingMode()")),
            "isTrainingMode signature mismatch"
        );
        
        assertEq(
            IGovernanceSwitch.canInitiateRollback.selector,
            bytes4(keccak256("canInitiateRollback()")),
            "canInitiateRollback signature mismatch"
        );
        
        // State-changing functions
        assertEq(
            IGovernanceSwitch.setGovernanceMode.selector,
            bytes4(keccak256("setGovernanceMode(uint8)")),
            "setGovernanceMode signature mismatch"
        );
        
        assertEq(
            IGovernanceSwitch.approveAction.selector,
            bytes4(keccak256("approveAction(bytes4,bytes)")),
            "approveAction signature mismatch"
        );
        
        assertEq(
            IGovernanceSwitch.initiateTransition.selector,
            bytes4(keccak256("initiateTransition(uint8)")),
            "initiateTransition signature mismatch"
        );
        
        assertEq(
            IGovernanceSwitch.finalizeTransition.selector,
            bytes4(keccak256("finalizeTransition()")),
            "finalizeTransition signature mismatch"
        );
    }
}
