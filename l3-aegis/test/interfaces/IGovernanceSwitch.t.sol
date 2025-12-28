// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/interfaces/IGovernanceSwitch.sol";

/// @title IGovernanceSwitchTest
/// @notice Tests for IGovernanceSwitch interface compliance
/// @dev Phase 3.1 Foundation - Interface validation tests
contract IGovernanceSwitchTest is Test {
    // ============ Interface Existence Tests ============
    
    /// @notice Verify interface can be referenced
    function test_InterfaceExists() public pure {
        // Interface ID calculation
        bytes4 interfaceId = type(IGovernanceSwitch).interfaceId;
        assertTrue(interfaceId != bytes4(0), "Interface should have non-zero ID");
    }
    
    /// @notice Verify GovernanceMode enum values
    function test_GovernanceModeEnum() public pure {
        // Test enum values are sequential starting from 0
        assertEq(
            uint8(IGovernanceSwitch.GovernanceMode.CENTRALIZED),
            0,
            "CENTRALIZED should be 0"
        );
        assertEq(
            uint8(IGovernanceSwitch.GovernanceMode.MULTISIG),
            1,
            "MULTISIG should be 1"
        );
        assertEq(
            uint8(IGovernanceSwitch.GovernanceMode.DECENTRALIZED),
            2,
            "DECENTRALIZED should be 2"
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
        
        // All selectors should be unique
        assertTrue(getGovernanceMode != getApprover, "Selectors must be unique");
        assertTrue(getApprover != canApprove, "Selectors must be unique");
        assertTrue(canApprove != getAdmin, "Selectors must be unique");
        assertTrue(getAdmin != getMultisigConfig, "Selectors must be unique");
        assertTrue(getMultisigConfig != getSecurityCouncilConfig, "Selectors must be unique");
        assertTrue(getSecurityCouncilConfig != setGovernanceMode, "Selectors must be unique");
        assertTrue(setGovernanceMode != approveAction, "Selectors must be unique");
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
    }
}
