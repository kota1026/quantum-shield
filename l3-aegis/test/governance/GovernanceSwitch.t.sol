// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {GovernanceSwitch} from "../../src/governance/GovernanceSwitch.sol";
import {IGovernanceSwitch} from "../../src/interfaces/IGovernanceSwitch.sol";

/// @title GovernanceSwitchTest
/// @notice Tests for DECEN-009~011: GovernanceSwitch production mode
contract GovernanceSwitchTest is Test {
    GovernanceSwitch public governanceSwitch;
    
    address public admin = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    // Multisig signers
    address[] public signers;
    
    // Security Council members (9)
    address[] public councilMembers;
    
    function setUp() public {
        vm.startPrank(admin);
        governanceSwitch = new GovernanceSwitch(admin);
        vm.stopPrank();
        
        // Setup signers
        for (uint i = 0; i < 5; i++) {
            signers.push(address(uint160(100 + i)));
        }
        
        // Setup council members (9)
        for (uint i = 0; i < 9; i++) {
            councilMembers.push(address(uint160(200 + i)));
        }
    }
    
    // ============ TEST-GOV-001: Training Mode Tests ============
    
    function test_InitialModeIsTraining() public view {
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.TRAINING),
            "Should start in TRAINING mode"
        );
    }
    
    function test_IsTrainingMode() public view {
        assertTrue(governanceSwitch.isTrainingMode(), "Should be in training mode");
    }
    
    function test_TrainingModeAdminCanApprove() public view {
        assertTrue(
            governanceSwitch.canApprove(bytes4(0), admin),
            "Admin should be able to approve in TRAINING mode"
        );
    }
    
    function test_TrainingModeNonAdminCannotApprove() public view {
        assertFalse(
            governanceSwitch.canApprove(bytes4(0), user1),
            "Non-admin should not be able to approve in TRAINING mode"
        );
    }
    
    // ============ TEST-GOV-002: Mode Transition Tests ============
    
    function test_TrainingToCentralized() public {
        vm.startPrank(admin);
        
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.CENTRALIZED),
            "Should transition to CENTRALIZED"
        );
        
        assertFalse(governanceSwitch.isTrainingMode(), "Should no longer be in training mode");
        
        vm.stopPrank();
    }
    
    function test_TrainingToDecentralizedFails() public {
        vm.startPrank(admin);
        
        vm.expectRevert(
            abi.encodeWithSelector(
                IGovernanceSwitch.InvalidModeTransition.selector,
                IGovernanceSwitch.GovernanceMode.TRAINING,
                IGovernanceSwitch.GovernanceMode.DECENTRALIZED
            )
        );
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        
        vm.stopPrank();
    }
    
    function test_CentralizedToMultisig() public {
        // First go to CENTRALIZED
        vm.startPrank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        // Configure multisig
        governanceSwitch.configureMultisig(signers, 3);
        
        // Transition to MULTISIG
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
        
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.MULTISIG),
            "Should transition to MULTISIG"
        );
        
        vm.stopPrank();
    }
    
    function test_CentralizedToMultisigWithoutConfigFails() public {
        vm.startPrank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        vm.expectRevert(GovernanceSwitch.MultisigNotConfigured.selector);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
        
        vm.stopPrank();
    }
    
    // ============ TEST-GOV-003: Transition with Time Lock ============
    
    function test_InitiateTransitionFromTraining() public {
        vm.startPrank(admin);
        
        governanceSwitch.initiateTransition(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        uint256 lockExpiry = governanceSwitch.getTransitionLockExpiry();
        assertGt(lockExpiry, block.timestamp, "Lock expiry should be in the future");
        assertEq(
            lockExpiry,
            block.timestamp + governanceSwitch.TRAINING_EXIT_TIMELOCK(),
            "Lock expiry should be TRAINING_EXIT_TIMELOCK from now"
        );
        
        vm.stopPrank();
    }
    
    function test_FinalizeTransitionAfterTimeLock() public {
        vm.startPrank(admin);
        
        governanceSwitch.initiateTransition(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        // Fast forward past time lock
        vm.warp(block.timestamp + governanceSwitch.TRAINING_EXIT_TIMELOCK() + 1);
        
        governanceSwitch.finalizeTransition();
        
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.CENTRALIZED),
            "Should be in CENTRALIZED after finalize"
        );
        
        vm.stopPrank();
    }
    
    function test_FinalizeTransitionBeforeTimeLockFails() public {
        vm.startPrank(admin);
        
        governanceSwitch.initiateTransition(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        vm.expectRevert(GovernanceSwitch.TimeLockNotExpired.selector);
        governanceSwitch.finalizeTransition();
        
        vm.stopPrank();
    }
    
    // ============ TEST-GOV-004: Security Council Configuration ============
    
    function test_ConfigureSecurityCouncil() public {
        vm.startPrank(admin);
        
        governanceSwitch.configureSecurityCouncil(councilMembers, 5);
        
        (uint256 threshold, uint256 total) = governanceSwitch.getSecurityCouncilConfig();
        assertEq(threshold, 5, "Threshold should be 5");
        assertEq(total, 9, "Total should be 9");
        
        vm.stopPrank();
    }
    
    function test_ConfigureSecurityCouncilInvalidSizeFails() public {
        address[] memory invalidMembers = new address[](5);
        for (uint i = 0; i < 5; i++) {
            invalidMembers[i] = address(uint160(300 + i));
        }
        
        vm.startPrank(admin);
        
        vm.expectRevert(GovernanceSwitch.InvalidThreshold.selector);
        governanceSwitch.configureSecurityCouncil(invalidMembers, 3);
        
        vm.stopPrank();
    }
    
    // ============ TEST-GOV-005: Emergency Rollback Tests ============
    
    function test_CannotInitiateRollbackFromTraining() public view {
        assertFalse(
            governanceSwitch.canInitiateRollback(),
            "Should not be able to rollback from TRAINING mode"
        );
    }
    
    function test_InitiateEmergencyRollback() public {
        // Setup: Go to DECENTRALIZED mode
        _setupDecentralizedMode();
        
        // Council member initiates rollback
        vm.startPrank(councilMembers[0]);
        
        governanceSwitch.initiateEmergencyRollback("Security vulnerability detected");
        
        (
            bool pending,
            IGovernanceSwitch.GovernanceMode targetMode,
            string memory reason,
            uint256 signatures,
            uint256 required,
            uint256 lockExpiry
        ) = governanceSwitch.getRollbackStatus();
        
        assertTrue(pending, "Rollback should be pending");
        assertEq(uint256(targetMode), uint256(IGovernanceSwitch.GovernanceMode.MULTISIG), "Target should be MULTISIG");
        assertEq(reason, "Security vulnerability detected", "Reason should match");
        assertEq(signatures, 1, "Should have 1 signature");
        assertEq(required, 7, "Should require 7 signatures");
        assertGt(lockExpiry, block.timestamp, "Lock expiry should be set");
        
        vm.stopPrank();
    }
    
    function test_ApproveEmergencyRollback() public {
        _setupDecentralizedMode();
        
        // Initiate rollback
        vm.prank(councilMembers[0]);
        governanceSwitch.initiateEmergencyRollback("Security issue");
        
        // Approve from other council members
        for (uint i = 1; i < 6; i++) {
            vm.prank(councilMembers[i]);
            governanceSwitch.approveEmergencyRollback();
        }
        
        (,,, uint256 signatures,,) = governanceSwitch.getRollbackStatus();
        assertEq(signatures, 6, "Should have 6 signatures");
    }
    
    function test_ExecuteEmergencyRollbackAfterThreshold() public {
        _setupDecentralizedMode();
        
        // Initiate and collect signatures
        vm.prank(councilMembers[0]);
        governanceSwitch.initiateEmergencyRollback("Critical bug");
        
        for (uint i = 1; i < 7; i++) {
            vm.prank(councilMembers[i]);
            governanceSwitch.approveEmergencyRollback();
        }
        
        // Fast forward past time lock
        vm.warp(block.timestamp + governanceSwitch.ROLLBACK_TIMELOCK() + 1);
        
        // Execute rollback
        vm.prank(councilMembers[0]);
        governanceSwitch.executeEmergencyRollback();
        
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.MULTISIG),
            "Should be rolled back to MULTISIG"
        );
    }
    
    function test_ExecuteRollbackBeforeThresholdFails() public {
        _setupDecentralizedMode();
        
        vm.prank(councilMembers[0]);
        governanceSwitch.initiateEmergencyRollback("Test");
        
        // Only 5 signatures (need 7)
        for (uint i = 1; i < 5; i++) {
            vm.prank(councilMembers[i]);
            governanceSwitch.approveEmergencyRollback();
        }
        
        vm.warp(block.timestamp + governanceSwitch.ROLLBACK_TIMELOCK() + 1);
        
        vm.prank(councilMembers[0]);
        vm.expectRevert(GovernanceSwitch.RollbackThresholdNotReached.selector);
        governanceSwitch.executeEmergencyRollback();
    }
    
    function test_ExecuteRollbackBeforeTimeLockFails() public {
        _setupDecentralizedMode();
        
        // Get all 7 signatures
        vm.prank(councilMembers[0]);
        governanceSwitch.initiateEmergencyRollback("Test");
        
        for (uint i = 1; i < 7; i++) {
            vm.prank(councilMembers[i]);
            governanceSwitch.approveEmergencyRollback();
        }
        
        // Try to execute before time lock
        vm.prank(councilMembers[0]);
        vm.expectRevert(GovernanceSwitch.TimeLockNotExpired.selector);
        governanceSwitch.executeEmergencyRollback();
    }
    
    function test_CancelEmergencyRollback() public {
        _setupDecentralizedMode();
        
        vm.prank(councilMembers[0]);
        governanceSwitch.initiateEmergencyRollback("Test");
        
        // Cancel before threshold reached
        vm.prank(councilMembers[1]);
        governanceSwitch.cancelEmergencyRollback();
        
        (bool pending,,,,,) = governanceSwitch.getRollbackStatus();
        assertFalse(pending, "Rollback should be cancelled");
    }
    
    // ============ TEST-GOV-006: Emergency Pause Integration ============
    
    function test_EmergencyPauseInTrainingMode() public {
        vm.startPrank(admin);
        
        governanceSwitch.emergencyPause();
        
        assertTrue(governanceSwitch.isPaused(), "Should be paused");
        
        vm.stopPrank();
    }
    
    function test_EmergencyPauseInDecentralizedMode() public {
        _setupDecentralizedMode();
        
        vm.prank(councilMembers[0]);
        governanceSwitch.emergencyPause();
        
        assertTrue(governanceSwitch.isPaused(), "Should be paused");
    }
    
    function test_UnpauseAfterPause() public {
        vm.startPrank(admin);
        
        governanceSwitch.emergencyPause();
        assertTrue(governanceSwitch.isPaused(), "Should be paused");
        
        governanceSwitch.unpause();
        assertFalse(governanceSwitch.isPaused(), "Should be unpaused");
        
        vm.stopPrank();
    }
    
    // ============ TEST-GOV-007: Multisig Mode Tests ============
    
    function test_MultisigUpgradeToDecentralized() public {
        _setupMultisigMode();
        
        // Configure Security Council BEFORE upgrading to DECENTRALIZED
        vm.prank(admin);
        governanceSwitch.configureSecurityCouncil(councilMembers, 5);
        
        // All signers initiate upgrade
        for (uint i = 0; i < 3; i++) {
            vm.prank(signers[i]);
            governanceSwitch.initiateTransition(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        }
        
        uint256 lockExpiry = governanceSwitch.getTransitionLockExpiry();
        assertGt(lockExpiry, 0, "Transition should be pending");
        
        // Fast forward and finalize
        vm.warp(block.timestamp + governanceSwitch.UPGRADE_TIMELOCK() + 1);
        governanceSwitch.finalizeTransition();
        
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.DECENTRALIZED),
            "Should be DECENTRALIZED"
        );
    }
    
    // ============ Fuzz Tests ============
    
    function testFuzz_ConfigureMultisigThreshold(uint256 threshold) public {
        vm.assume(threshold > 0 && threshold <= 5);
        
        vm.startPrank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        governanceSwitch.configureMultisig(signers, threshold);
        
        (uint256 actualThreshold, uint256 total) = governanceSwitch.getMultisigConfig();
        assertEq(actualThreshold, threshold, "Threshold should match");
        assertEq(total, 5, "Total should be 5");
        
        vm.stopPrank();
    }
    
    function testFuzz_TimeLockDuration(uint256 warpTime) public {
        vm.assume(warpTime < governanceSwitch.TRAINING_EXIT_TIMELOCK());
        
        vm.startPrank(admin);
        governanceSwitch.initiateTransition(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        vm.warp(block.timestamp + warpTime);
        
        vm.expectRevert(GovernanceSwitch.TimeLockNotExpired.selector);
        governanceSwitch.finalizeTransition();
        
        vm.stopPrank();
    }
    
    // ============ Helper Functions ============
    
    function _setupMultisigMode() internal {
        vm.startPrank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        governanceSwitch.configureMultisig(signers, 3);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
        vm.stopPrank();
    }
    
    function _setupDecentralizedMode() internal {
        // Step 1: Go to CENTRALIZED
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        // Step 2: Configure multisig
        vm.prank(admin);
        governanceSwitch.configureMultisig(signers, 3);
        
        // Step 3: Configure Security Council BEFORE going to DECENTRALIZED
        vm.prank(admin);
        governanceSwitch.configureSecurityCouncil(councilMembers, 5);
        
        // Step 4: Go to MULTISIG
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
        
        // Step 5: Upgrade to DECENTRALIZED via initiateUpgrade
        for (uint i = 0; i < 3; i++) {
            vm.prank(signers[i]);
            governanceSwitch.initiateUpgrade(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        }
        
        // Step 6: Wait for time lock
        vm.warp(block.timestamp + governanceSwitch.UPGRADE_TIMELOCK() + 1);
        
        // Step 7: Finalize
        governanceSwitch.finalizeUpgrade();
        
        // Verify we're in DECENTRALIZED mode
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.DECENTRALIZED),
            "Should be in DECENTRALIZED mode"
        );
    }
}
