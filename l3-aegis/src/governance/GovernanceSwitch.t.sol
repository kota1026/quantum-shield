// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {GovernanceSwitch} from "../../src/governance/GovernanceSwitch.sol";
import {IGovernanceSwitch} from "../../src/interfaces/IGovernanceSwitch.sol";

/// @title GovernanceSwitchTest
/// @notice Comprehensive tests for GovernanceSwitch Pluggable Governance Layer
/// @dev Part of PLUG-001 Governance Switch implementation
/// @dev Updated for DECEN-009~011: TRAINING mode as initial state
/// @custom:ref CURRENT_PLAN.md TEST-001~006
contract GovernanceSwitchTest is Test {
    GovernanceSwitch public governanceSwitch;
    
    // Test addresses
    address public admin = address(0x1);
    address public signer1 = address(0x11);
    address public signer2 = address(0x12);
    address public signer3 = address(0x13);
    address public signer4 = address(0x14);
    address public signer5 = address(0x15);
    address public councilMember1 = address(0x21);
    address public councilMember2 = address(0x22);
    address public councilMember3 = address(0x23);
    address public councilMember4 = address(0x24);
    address public councilMember5 = address(0x25);
    address public councilMember6 = address(0x26);
    address public councilMember7 = address(0x27);
    address public councilMember8 = address(0x28);
    address public councilMember9 = address(0x29);
    address public unauthorized = address(0x99);
    
    // Test action selectors
    bytes4 public constant ACTION_PAUSE = bytes4(keccak256("pause()"));
    bytes4 public constant ACTION_UPGRADE = bytes4(keccak256("upgrade(address)"));
    
    // Time Lock constants (from SPEC_STRATEGY_BRIDGE)
    uint256 public constant MULTISIG_TO_DECENTRALIZED_TIMELOCK = 7 days;
    uint256 public constant DOWNGRADE_TIMELOCK = 30 days;
    uint256 public constant EMERGENCY_PAUSE_MAX_DURATION = 72 hours;
    
    // MAX_SIGNERS constant (must match contract)
    uint256 public constant MAX_SIGNERS = 20;
    
    // Council constants
    uint256 public constant COUNCIL_SIZE = 9;
    uint256 public constant PAUSE_THRESHOLD = 5;

    function setUp() public {
        vm.prank(admin);
        governanceSwitch = new GovernanceSwitch(admin);
    }

    // ============ TEST-001: GovernanceSwitch単体テスト ============

    /// @notice Test initial state after deployment - now TRAINING mode
    function test_InitialState() public view {
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.TRAINING),
            "Initial mode should be TRAINING"
        );
        assertEq(governanceSwitch.getAdmin(), admin, "Admin should be set correctly");
        assertTrue(governanceSwitch.isTrainingMode(), "Should be in training mode");
    }

    /// @notice Test getAdmin function
    function test_GetAdmin() public view {
        assertEq(governanceSwitch.getAdmin(), admin, "Should return admin address");
    }

    /// @notice Test getGovernanceMode function
    function test_GetGovernanceMode() public view {
        IGovernanceSwitch.GovernanceMode mode = governanceSwitch.getGovernanceMode();
        assertEq(uint256(mode), uint256(IGovernanceSwitch.GovernanceMode.TRAINING));
    }

    /// @notice Test multisig config returns zeros in TRAINING mode
    function test_GetMultisigConfig_CentralizedMode() public view {
        (uint256 threshold, uint256 total) = governanceSwitch.getMultisigConfig();
        assertEq(threshold, 0, "Threshold should be 0 in TRAINING mode");
        assertEq(total, 0, "Total should be 0 in TRAINING mode");
    }

    /// @notice Test security council config returns zeros in TRAINING mode
    function test_GetSecurityCouncilConfig_CentralizedMode() public view {
        (uint256 threshold, uint256 total) = governanceSwitch.getSecurityCouncilConfig();
        assertEq(threshold, 0, "Threshold should be 0 in TRAINING mode");
        assertEq(total, 0, "Total should be 0 in TRAINING mode");
    }
    
    /// @notice Test MAX_SIGNERS constant is exposed
    function test_MaxSignersConstant() public view {
        assertEq(governanceSwitch.MAX_SIGNERS(), 20, "MAX_SIGNERS should be 20");
    }
    
    /// @notice Test PAUSE_THRESHOLD constant is exposed
    function test_PauseThresholdConstant() public view {
        assertEq(governanceSwitch.PAUSE_THRESHOLD(), 5, "PAUSE_THRESHOLD should be 5");
    }

    // ============ TEST-002: モード切替テスト（全遷移パターン） ============

    /// @notice Test TRAINING -> CENTRALIZED transition
    function test_Transition_Training_To_Centralized() public {
        vm.prank(admin);
        vm.expectEmit(true, true, true, true);
        emit IGovernanceSwitch.GovernanceModeChanged(
            IGovernanceSwitch.GovernanceMode.TRAINING,
            IGovernanceSwitch.GovernanceMode.CENTRALIZED,
            admin
        );
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.CENTRALIZED),
            "Mode should be CENTRALIZED"
        );
        assertFalse(governanceSwitch.isTrainingMode(), "Should not be in training mode");
    }

    /// @notice Test CENTRALIZED -> MULTISIG transition
    function test_Transition_Centralized_To_Multisig() public {
        // First transition to CENTRALIZED
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        // Setup multisig signers
        address[] memory signers = new address[](5);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;
        signers[3] = signer4;
        signers[4] = signer5;
        
        vm.prank(admin);
        governanceSwitch.configureMultisig(signers, 3); // 3-of-5
        
        vm.prank(admin);
        vm.expectEmit(true, true, true, true);
        emit IGovernanceSwitch.GovernanceModeChanged(
            IGovernanceSwitch.GovernanceMode.CENTRALIZED,
            IGovernanceSwitch.GovernanceMode.MULTISIG,
            admin
        );
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
        
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.MULTISIG),
            "Mode should be MULTISIG"
        );
        
        (uint256 threshold, uint256 total) = governanceSwitch.getMultisigConfig();
        assertEq(threshold, 3, "Threshold should be 3");
        assertEq(total, 5, "Total should be 5");
    }

    /// @notice Test MULTISIG -> DECENTRALIZED transition with Time Lock
    function test_Transition_Multisig_To_Decentralized() public {
        // First transition to MULTISIG
        _setupAndTransitionToMultisig();
        
        // Initiate transition to DECENTRALIZED
        vm.prank(signer1);
        governanceSwitch.initiateUpgrade(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        vm.prank(signer2);
        governanceSwitch.initiateUpgrade(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        vm.prank(signer3);
        governanceSwitch.initiateUpgrade(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        
        // Try to finalize before time lock expires - should fail
        vm.expectRevert(GovernanceSwitch.TimeLockNotExpired.selector);
        governanceSwitch.finalizeUpgrade();
        
        // Warp past time lock (7 days)
        vm.warp(block.timestamp + MULTISIG_TO_DECENTRALIZED_TIMELOCK + 1);
        
        // Finalize should succeed now
        governanceSwitch.finalizeUpgrade();
        
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.DECENTRALIZED),
            "Mode should be DECENTRALIZED"
        );
    }

    /// @notice Test invalid transition: TRAINING directly to DECENTRALIZED
    function test_Transition_InvalidDirect_Training_To_Decentralized() public {
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IGovernanceSwitch.InvalidModeTransition.selector,
                IGovernanceSwitch.GovernanceMode.TRAINING,
                IGovernanceSwitch.GovernanceMode.DECENTRALIZED
            )
        );
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
    }

    /// @notice Test invalid transition: CENTRALIZED directly to DECENTRALIZED
    function test_Transition_InvalidDirect_Centralized_To_Decentralized() public {
        // First go to CENTRALIZED
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                IGovernanceSwitch.InvalidModeTransition.selector,
                IGovernanceSwitch.GovernanceMode.CENTRALIZED,
                IGovernanceSwitch.GovernanceMode.DECENTRALIZED
            )
        );
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
    }

    /// @notice Test downgrade: DECENTRALIZED -> MULTISIG (requires 30 days + supermajority)
    function test_Transition_Downgrade_Requires_Supermajority() public {
        // Setup and transition to DECENTRALIZED first
        _setupAndTransitionToDecentralized();
        
        // Downgrade should require supermajority + 30 day time lock
        // This is a stub test - full implementation in Phase 3.2
        assertTrue(
            governanceSwitch.isDowngradeRestricted(),
            "Downgrade should be restricted"
        );
    }

    // ============ TEST-003: 権限チェックテスト ============

    /// @notice Test unauthorized mode change attempt
    function test_Unauthorized_ModeChange_Reverts() public {
        vm.prank(unauthorized);
        vm.expectRevert(IGovernanceSwitch.Unauthorized.selector);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
    }

    /// @notice Test canApprove in TRAINING mode
    function test_CanApprove_TrainingMode() public view {
        assertTrue(
            governanceSwitch.canApprove(ACTION_PAUSE, admin),
            "Admin should be able to approve"
        );
        assertFalse(
            governanceSwitch.canApprove(ACTION_PAUSE, unauthorized),
            "Unauthorized should not be able to approve"
        );
    }

    /// @notice Test canApprove in CENTRALIZED mode
    function test_CanApprove_CentralizedMode() public {
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        assertTrue(
            governanceSwitch.canApprove(ACTION_PAUSE, admin),
            "Admin should be able to approve"
        );
        assertFalse(
            governanceSwitch.canApprove(ACTION_PAUSE, unauthorized),
            "Unauthorized should not be able to approve"
        );
    }

    /// @notice Test canApprove in MULTISIG mode
    function test_CanApprove_MultisigMode() public {
        _setupAndTransitionToMultisig();
        
        assertTrue(
            governanceSwitch.canApprove(ACTION_PAUSE, signer1),
            "Signer1 should be able to approve"
        );
        assertTrue(
            governanceSwitch.canApprove(ACTION_PAUSE, signer2),
            "Signer2 should be able to approve"
        );
        assertFalse(
            governanceSwitch.canApprove(ACTION_PAUSE, unauthorized),
            "Unauthorized should not be able to approve"
        );
    }

    /// @notice Test getApprover in different modes
    function test_GetApprover() public {
        // TRAINING mode
        assertEq(
            governanceSwitch.getApprover(ACTION_PAUSE),
            admin,
            "Approver should be admin in TRAINING mode"
        );
        
        // CENTRALIZED mode
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        assertEq(
            governanceSwitch.getApprover(ACTION_PAUSE),
            admin,
            "Approver should be admin in CENTRALIZED mode"
        );
        
        // MULTISIG mode
        _configureAndTransitionToMultisig();
        address approver = governanceSwitch.getApprover(ACTION_PAUSE);
        assertEq(
            approver,
            address(governanceSwitch),
            "Approver should be contract itself in MULTISIG mode"
        );
    }

    // ============ TEST-004: Time Lock検証テスト ============

    /// @notice Test 7 day time lock for MULTISIG -> DECENTRALIZED
    function test_TimeLock_MultisigToDecentralized() public {
        _setupAndTransitionToMultisig();
        
        // Collect signatures for upgrade
        _collectSignaturesForUpgrade(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        
        // Check time lock is active
        assertTrue(governanceSwitch.isTimeLockActive(), "Time lock should be active");
        
        uint256 unlockTime = governanceSwitch.getTimeLockExpiry();
        assertEq(
            unlockTime,
            block.timestamp + MULTISIG_TO_DECENTRALIZED_TIMELOCK,
            "Time lock should be 7 days"
        );
    }

    /// @notice Test that mode transition respects time lock
    function test_TimeLock_CannotBypassTimeLock() public {
        _setupAndTransitionToMultisig();
        _collectSignaturesForUpgrade(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        
        // unlockTime = 1 + 7 days = 604801
        // condition: block.timestamp <= 604801 reverts
        
        // Try 1 day (86401) - should fail
        vm.warp(86401);
        vm.expectRevert(GovernanceSwitch.TimeLockNotExpired.selector);
        governanceSwitch.finalizeUpgrade();
        
        // Try 6 days (518401) - should fail
        vm.warp(518401);
        vm.expectRevert(GovernanceSwitch.TimeLockNotExpired.selector);
        governanceSwitch.finalizeUpgrade();
        
        // Exactly at unlock time (604801) - should still fail (condition is <=)
        vm.warp(604801);
        vm.expectRevert(GovernanceSwitch.TimeLockNotExpired.selector);
        governanceSwitch.finalizeUpgrade();
    }

    // ============ TEST-005: Emergency Pauseテスト ============

    /// @notice Test emergency pause in TRAINING mode (admin only)
    function test_EmergencyPause_TrainingMode() public {
        vm.prank(admin);
        governanceSwitch.emergencyPause();
        
        assertTrue(governanceSwitch.isPaused(), "Should be paused");
    }

    /// @notice Test emergency pause in CENTRALIZED mode (admin only)
    function test_EmergencyPause_CentralizedMode() public {
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        vm.prank(admin);
        governanceSwitch.emergencyPause();
        
        assertTrue(governanceSwitch.isPaused(), "Should be paused");
    }

    /// @notice Test emergency pause unauthorized access
    function test_EmergencyPause_Unauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert(IGovernanceSwitch.Unauthorized.selector);
        governanceSwitch.emergencyPause();
    }

    /// @notice Test emergency pause max duration (72 hours)
    function test_EmergencyPause_MaxDuration() public {
        vm.prank(admin);
        governanceSwitch.emergencyPause();
        
        // Auto-unpause after 72 hours
        vm.warp(block.timestamp + EMERGENCY_PAUSE_MAX_DURATION + 1);
        
        assertFalse(
            governanceSwitch.isPausedStrict(),
            "Should auto-unpause after 72 hours"
        );
    }

    /// @notice Test emergency pause in MULTISIG mode (N/M approval required)
    function test_EmergencyPause_MultisigMode() public {
        _setupAndTransitionToMultisig();
        
        // Single signer cannot pause alone
        vm.prank(signer1);
        governanceSwitch.initiatePause();
        assertFalse(governanceSwitch.isPaused(), "Should not be paused yet");
        
        // Second signer
        vm.prank(signer2);
        governanceSwitch.initiatePause();
        assertFalse(governanceSwitch.isPaused(), "Should not be paused yet");
        
        // Third signer reaches threshold (3-of-5)
        vm.prank(signer3);
        governanceSwitch.initiatePause();
        assertTrue(governanceSwitch.isPaused(), "Should be paused after threshold reached");
    }
    
    /// @notice Test emergency pause in DECENTRALIZED mode requires 5/9 SC threshold
    /// @dev SEQ#8 compliant: Single SC member cannot pause alone
    function test_EmergencyPause_DecentralizedMode_Requires5of9() public {
        _setupAndTransitionToDecentralizedWithCouncil();
        
        // Verify we are in DECENTRALIZED mode
        assertEq(
            uint256(governanceSwitch.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.DECENTRALIZED),
            "Should be in DECENTRALIZED mode"
        );
        
        // emergencyPause() should revert in DECENTRALIZED mode
        vm.prank(councilMember1);
        vm.expectRevert(IGovernanceSwitch.Unauthorized.selector);
        governanceSwitch.emergencyPause();
        
        // Must use initiateCouncilPause() instead
        // Single council member cannot pause alone
        vm.prank(councilMember1);
        governanceSwitch.initiateCouncilPause();
        assertFalse(governanceSwitch.isPaused(), "Should not be paused with 1 signature");
        
        // Check status
        (uint256 sigs, uint256 required) = governanceSwitch.getCouncilPauseStatus();
        assertEq(sigs, 1, "Should have 1 signature");
        assertEq(required, 5, "Should require 5 signatures");
        
        // Add more signatures (2-4)
        vm.prank(councilMember2);
        governanceSwitch.initiateCouncilPause();
        assertFalse(governanceSwitch.isPaused(), "Should not be paused with 2 signatures");
        
        vm.prank(councilMember3);
        governanceSwitch.initiateCouncilPause();
        assertFalse(governanceSwitch.isPaused(), "Should not be paused with 3 signatures");
        
        vm.prank(councilMember4);
        governanceSwitch.initiateCouncilPause();
        assertFalse(governanceSwitch.isPaused(), "Should not be paused with 4 signatures");
        
        // 5th signature reaches threshold
        vm.prank(councilMember5);
        governanceSwitch.initiateCouncilPause();
        assertTrue(governanceSwitch.isPaused(), "Should be paused after 5/9 threshold reached");
    }
    
    /// @notice Test that non-council members cannot initiate council pause
    function test_CouncilPause_NonMemberReverts() public {
        _setupAndTransitionToDecentralizedWithCouncil();
        
        vm.prank(unauthorized);
        vm.expectRevert(IGovernanceSwitch.Unauthorized.selector);
        governanceSwitch.initiateCouncilPause();
    }
    
    /// @notice Test that council member cannot sign twice
    function test_CouncilPause_CannotSignTwice() public {
        _setupAndTransitionToDecentralizedWithCouncil();
        
        vm.prank(councilMember1);
        governanceSwitch.initiateCouncilPause();
        
        vm.prank(councilMember1);
        vm.expectRevert(GovernanceSwitch.AlreadySigned.selector);
        governanceSwitch.initiateCouncilPause();
    }
    
    /// @notice Test initiateCouncilPause only works in DECENTRALIZED mode
    function test_CouncilPause_OnlyInDecentralizedMode() public {
        _setupAndTransitionToMultisig();
        
        // Configure council in MULTISIG mode
        _configureSecurityCouncil();
        
        // Try to use council pause in MULTISIG mode - should fail
        vm.prank(councilMember1);
        vm.expectRevert(IGovernanceSwitch.Unauthorized.selector);
        governanceSwitch.initiateCouncilPause();
    }

    /// @notice Test unpause functionality
    function test_Unpause() public {
        vm.prank(admin);
        governanceSwitch.emergencyPause();
        assertTrue(governanceSwitch.isPaused());
        
        vm.prank(admin);
        governanceSwitch.unpause();
        assertFalse(governanceSwitch.isPaused());
    }

    // ============ TEST-006: Fuzzテスト（境界値） ============

    /// @notice Fuzz test for multisig threshold configuration
    /// @dev Bounded by MAX_SIGNERS to prevent gas limit issues
    function testFuzz_MultisigThreshold(uint256 threshold, uint256 total) public {
        // Bound inputs to MAX_SIGNERS limit
        total = bound(total, 1, MAX_SIGNERS);
        threshold = bound(threshold, 1, total);
        
        console.log("Bound result", total);
        console.log("Bound result", threshold);
        
        address[] memory signers = new address[](total);
        for (uint256 i = 0; i < total; i++) {
            signers[i] = address(uint160(0x1000 + i));
        }
        
        // First go to CENTRALIZED
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        vm.prank(admin);
        governanceSwitch.configureMultisig(signers, threshold);
        
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
        
        (uint256 gotThreshold, uint256 gotTotal) = governanceSwitch.getMultisigConfig();
        assertEq(gotThreshold, threshold, "Threshold mismatch");
        assertEq(gotTotal, total, "Total mismatch");
    }

    /// @notice Fuzz test for invalid threshold (threshold > total)
    function testFuzz_InvalidThreshold(uint256 threshold, uint256 total) public {
        total = bound(total, 1, MAX_SIGNERS);
        threshold = bound(threshold, total + 1, MAX_SIGNERS + 50); // Always invalid
        
        address[] memory signers = new address[](total);
        for (uint256 i = 0; i < total; i++) {
            signers[i] = address(uint160(0x1000 + i));
        }
        
        vm.prank(admin);
        vm.expectRevert(GovernanceSwitch.InvalidThreshold.selector);
        governanceSwitch.configureMultisig(signers, threshold);
    }

    /// @notice Fuzz test for action approval data
    function testFuzz_ApproveAction(bytes4 action, bytes memory data) public {
        vm.prank(admin);
        
        vm.expectEmit(true, true, false, true);
        emit IGovernanceSwitch.ActionApproved(action, admin, data);
        governanceSwitch.approveAction(action, data);
    }

    // ============ TEST-007: MAX_SIGNERS制限テスト ============
    
    /// @notice Test that configuring more than MAX_SIGNERS reverts
    function test_TooManySigners_Reverts() public {
        uint256 tooMany = MAX_SIGNERS + 1;
        address[] memory signers = new address[](tooMany);
        for (uint256 i = 0; i < tooMany; i++) {
            signers[i] = address(uint160(0x1000 + i));
        }
        
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                GovernanceSwitch.TooManySigners.selector,
                tooMany,
                MAX_SIGNERS
            )
        );
        governanceSwitch.configureMultisig(signers, 3);
    }
    
    /// @notice Test that exactly MAX_SIGNERS is allowed
    function test_ExactlyMaxSigners_Succeeds() public {
        address[] memory signers = new address[](MAX_SIGNERS);
        for (uint256 i = 0; i < MAX_SIGNERS; i++) {
            signers[i] = address(uint160(0x1000 + i));
        }
        
        vm.prank(admin);
        governanceSwitch.configureMultisig(signers, MAX_SIGNERS / 2);
        
        (uint256 threshold, uint256 total) = governanceSwitch.getMultisigConfig();
        assertEq(total, MAX_SIGNERS, "Should allow exactly MAX_SIGNERS");
        assertEq(threshold, MAX_SIGNERS / 2, "Threshold should be set correctly");
    }
    
    /// @notice Test gas consumption with MAX_SIGNERS
    function test_Gas_MaxSigners_ResetUpgradeState() public {
        // Setup with MAX_SIGNERS
        address[] memory signers = new address[](MAX_SIGNERS);
        for (uint256 i = 0; i < MAX_SIGNERS; i++) {
            signers[i] = address(uint160(0x1000 + i));
        }
        
        // First go to CENTRALIZED
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        vm.prank(admin);
        governanceSwitch.configureMultisig(signers, MAX_SIGNERS / 2);
        
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
        
        // Collect signatures for upgrade
        for (uint256 i = 0; i < MAX_SIGNERS / 2; i++) {
            vm.prank(address(uint160(0x1000 + i)));
            governanceSwitch.initiateUpgrade(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        }
        
        // Warp past time lock
        vm.warp(block.timestamp + MULTISIG_TO_DECENTRALIZED_TIMELOCK + 1);
        
        // Measure gas for finalizeUpgrade (includes _resetUpgradeState)
        uint256 gasBefore = gasleft();
        governanceSwitch.finalizeUpgrade();
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for finalizeUpgrade with MAX_SIGNERS:", gasUsed);
        
        // Ensure gas is reasonable (less than 500k for 20 signers)
        assertLt(gasUsed, 500_000, "Gas should be bounded");
    }

    // ============ Gas Benchmark Tests ============

    function test_Gas_GetGovernanceMode() public view {
        uint256 gasBefore = gasleft();
        governanceSwitch.getGovernanceMode();
        uint256 gasUsed = gasBefore - gasleft();
        console.log("Gas used for getGovernanceMode:", gasUsed);
    }

    function test_Gas_CanApprove() public view {
        uint256 gasBefore = gasleft();
        governanceSwitch.canApprove(ACTION_PAUSE, admin);
        uint256 gasUsed = gasBefore - gasleft();
        console.log("Gas used for canApprove:", gasUsed);
    }

    function test_Gas_SetGovernanceMode() public {
        // First go to CENTRALIZED
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        address[] memory signers = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            signers[i] = address(uint160(0x1000 + i));
        }
        
        vm.prank(admin);
        governanceSwitch.configureMultisig(signers, 3);
        
        uint256 gasBefore = gasleft();
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
        uint256 gasUsed = gasBefore - gasleft();
        console.log("Gas used for setGovernanceMode:", gasUsed);
    }

    // ============ Helper Functions ============

    function _setupAndTransitionToMultisig() internal {
        // First transition to CENTRALIZED
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        address[] memory signers = new address[](5);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;
        signers[3] = signer4;
        signers[4] = signer5;
        
        vm.prank(admin);
        governanceSwitch.configureMultisig(signers, 3);
        
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
    }
    
    function _configureAndTransitionToMultisig() internal {
        address[] memory signers = new address[](5);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;
        signers[3] = signer4;
        signers[4] = signer5;
        
        vm.prank(admin);
        governanceSwitch.configureMultisig(signers, 3);
        
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
    }

    function _setupAndTransitionToDecentralized() internal {
        _setupAndTransitionToMultisig();
        _collectSignaturesForUpgrade(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        vm.warp(block.timestamp + MULTISIG_TO_DECENTRALIZED_TIMELOCK + 1);
        governanceSwitch.finalizeUpgrade();
    }
    
    function _configureSecurityCouncil() internal {
        address[] memory members = new address[](9);
        members[0] = councilMember1;
        members[1] = councilMember2;
        members[2] = councilMember3;
        members[3] = councilMember4;
        members[4] = councilMember5;
        members[5] = councilMember6;
        members[6] = councilMember7;
        members[7] = councilMember8;
        members[8] = councilMember9;
        
        vm.prank(admin);
        governanceSwitch.configureSecurityCouncil(members, 5);
    }
    
    function _setupAndTransitionToDecentralizedWithCouncil() internal {
        // First transition to CENTRALIZED
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.CENTRALIZED);
        
        // Configure multisig
        address[] memory signers = new address[](5);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;
        signers[3] = signer4;
        signers[4] = signer5;
        
        vm.prank(admin);
        governanceSwitch.configureMultisig(signers, 3);
        
        // Configure Security Council before transitioning
        _configureSecurityCouncil();
        
        // Transition to MULTISIG
        vm.prank(admin);
        governanceSwitch.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
        
        // Collect signatures for upgrade to DECENTRALIZED
        _collectSignaturesForUpgrade(IGovernanceSwitch.GovernanceMode.DECENTRALIZED);
        
        // Warp past time lock and finalize
        vm.warp(block.timestamp + MULTISIG_TO_DECENTRALIZED_TIMELOCK + 1);
        governanceSwitch.finalizeUpgrade();
    }

    function _collectSignaturesForUpgrade(IGovernanceSwitch.GovernanceMode targetMode) internal {
        vm.prank(signer1);
        governanceSwitch.initiateUpgrade(targetMode);
        vm.prank(signer2);
        governanceSwitch.initiateUpgrade(targetMode);
        vm.prank(signer3);
        governanceSwitch.initiateUpgrade(targetMode);
    }
}
