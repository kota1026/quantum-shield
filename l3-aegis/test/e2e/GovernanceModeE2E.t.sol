// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/governance/GovernanceSwitch.sol";
import "../../src/governance/Governor.sol";
import "../../src/governance/SecurityCouncil.sol";
import "../../src/token/QSToken.sol";
import "../../src/token/veQS.sol";

/**
 * @title GovernanceModeE2E
 * @notice E2E tests for Governance mode transitions
 * @dev Implements TEST-009 from Phase 3.3 Track B
 *
 * Modes:
 * - CENTRALIZED: Single admin control (Phase 1-2)
 * - MULTISIG: 3/5 multisig (Phase 3 early)
 * - DECENTRALIZED: Full veQS governance (Phase 3+)
 */
contract GovernanceModeE2E is Test {
    // Modes
    uint8 public constant MODE_CENTRALIZED = 0;
    uint8 public constant MODE_MULTISIG = 1;
    uint8 public constant MODE_DECENTRALIZED = 2;
    
    // Transition requirements
    uint256 public constant MULTISIG_THRESHOLD = 3;
    uint256 public constant MULTISIG_SIGNERS = 5;
    uint256 public constant DECENTRALIZED_MIN_VEQS = 10_000_000e18;
    
    GovernanceSwitch public governanceSwitch;
    Governor public governor;
    SecurityCouncil public securityCouncil;
    QSToken public qsToken;
    veQS public veQSToken;
    
    address public admin;
    address[] public multisigSigners;
    address[] public scMembers;
    address[] public voters;
    
    function setUp() public {
        admin = makeAddr("admin");
        
        // Setup multisig signers
        for (uint256 i = 0; i < MULTISIG_SIGNERS; i++) {
            multisigSigners.push(makeAddr(string.concat("signer", vm.toString(i))));
        }
        
        // Setup SC members
        for (uint256 i = 0; i < 9; i++) {
            scMembers.push(makeAddr(string.concat("sc", vm.toString(i))));
        }
        
        // Setup voters
        for (uint256 i = 0; i < 10; i++) {
            voters.push(makeAddr(string.concat("voter", vm.toString(i))));
        }
        
        vm.startPrank(admin);
        
        qsToken = new QSToken(admin);
        veQSToken = new veQS(address(qsToken), admin);
        securityCouncil = new SecurityCouncil(scMembers, 5, admin);
        governor = new Governor(address(veQSToken), address(0), admin);
        governanceSwitch = new GovernanceSwitch(
            admin,
            multisigSigners,
            address(governor),
            address(securityCouncil)
        );
        
        // Mint tokens
        for (uint256 i = 0; i < voters.length; i++) {
            qsToken.mint(voters[i], 2_000_000e18);
        }
        
        vm.stopPrank();
    }
    
    // ============================================
    // Initial State Tests
    // ============================================
    
    function test_InitialState_Centralized() public view {
        assertEq(governanceSwitch.currentMode(), MODE_CENTRALIZED);
        assertEq(governanceSwitch.admin(), admin);
    }
    
    function test_Centralized_AdminCanExecute() public {
        bytes memory action = abi.encodeWithSignature("updateParameter(uint256)", 100);
        
        vm.prank(admin);
        governanceSwitch.executeAction(action);
        
        // Should succeed without revert
    }
    
    function test_Centralized_NonAdminCannotExecute() public {
        bytes memory action = abi.encodeWithSignature("updateParameter(uint256)", 100);
        
        vm.prank(voters[0]);
        vm.expectRevert("Not authorized");
        governanceSwitch.executeAction(action);
    }
    
    // ============================================
    // Transition to Multisig Tests
    // ============================================
    
    function test_Transition_CentralizedToMultisig() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        assertEq(governanceSwitch.currentMode(), MODE_MULTISIG);
    }
    
    function test_Multisig_RequiresThreeSignatures() public {
        // Transition to multisig
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        bytes32 actionHash = keccak256("test_action");
        
        // Get 3 signatures
        for (uint256 i = 0; i < MULTISIG_THRESHOLD; i++) {
            vm.prank(multisigSigners[i]);
            governanceSwitch.signAction(actionHash);
        }
        
        assertTrue(governanceSwitch.isActionApproved(actionHash));
    }
    
    function test_Multisig_TwoSignaturesFails() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        bytes32 actionHash = keccak256("test_action");
        
        // Only 2 signatures
        for (uint256 i = 0; i < MULTISIG_THRESHOLD - 1; i++) {
            vm.prank(multisigSigners[i]);
            governanceSwitch.signAction(actionHash);
        }
        
        assertFalse(governanceSwitch.isActionApproved(actionHash));
    }
    
    // ============================================
    // Transition to Decentralized Tests
    // ============================================
    
    function test_Transition_MultisigToDecentralized() public {
        // First transition to multisig
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        // Setup veQS participation (10M minimum)
        for (uint256 i = 0; i < voters.length; i++) {
            vm.startPrank(voters[i]);
            qsToken.approve(address(veQSToken), type(uint256).max);
            veQSToken.createLock(2_000_000e18, block.timestamp + 365 days);
            vm.stopPrank();
        }
        
        // Multisig approves transition
        bytes32 transitionHash = keccak256("transition_decentralized");
        for (uint256 i = 0; i < MULTISIG_THRESHOLD; i++) {
            vm.prank(multisigSigners[i]);
            governanceSwitch.signAction(transitionHash);
        }
        
        vm.prank(multisigSigners[0]);
        governanceSwitch.transitionToDecentralized();
        
        assertEq(governanceSwitch.currentMode(), MODE_DECENTRALIZED);
    }
    
    function test_Decentralized_RequiresMinVeQS() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        // Try to transition without enough veQS
        bytes32 transitionHash = keccak256("transition_decentralized");
        for (uint256 i = 0; i < MULTISIG_THRESHOLD; i++) {
            vm.prank(multisigSigners[i]);
            governanceSwitch.signAction(transitionHash);
        }
        
        vm.prank(multisigSigners[0]);
        vm.expectRevert("Insufficient veQS participation");
        governanceSwitch.transitionToDecentralized();
    }
    
    // ============================================
    // Decentralized Mode Tests
    // ============================================
    
    function test_Decentralized_GovernorControls() public {
        _transitionToDecentralized();
        
        // Actions require governance proposal
        assertTrue(governanceSwitch.requiresGovernorApproval());
    }
    
    function test_Decentralized_SCCanVeto() public {
        _transitionToDecentralized();
        
        // SC can still veto (6/9)
        bytes32 vetoTarget = keccak256("proposal_to_veto");
        
        for (uint256 i = 0; i < 6; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.veto(vetoTarget);
        }
        
        assertTrue(securityCouncil.isVetoed(vetoTarget));
    }
    
    // ============================================
    // Backwards Transition Tests
    // ============================================
    
    function test_CannotRevertToCentralized() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        vm.prank(admin);
        vm.expectRevert("Cannot revert to centralized");
        governanceSwitch.transitionToCentralized();
    }
    
    function test_CannotSkipMultisig() public {
        // Try to go directly to decentralized
        vm.prank(admin);
        vm.expectRevert("Must transition through multisig");
        governanceSwitch.transitionToDecentralized();
    }
    
    // ============================================
    // Emergency Fallback Tests
    // ============================================
    
    function test_Emergency_SCCanPauseInAnyMode() public {
        // Test in centralized mode
        _testSCPause();
        
        // Transition to multisig
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        // Unpause first
        _testSCUnpause();
        
        // Test pause in multisig mode
        _testSCPause();
    }
    
    function _testSCPause() internal {
        bytes32 pauseHash = keccak256("emergency_pause");
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(pauseHash);
        }
        vm.prank(scMembers[0]);
        securityCouncil.executePause(pauseHash);
        assertTrue(governanceSwitch.isPaused());
    }
    
    function _testSCUnpause() internal {
        bytes32 unpauseHash = keccak256("unpause");
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(unpauseHash);
        }
        vm.prank(scMembers[0]);
        securityCouncil.executeUnpause(unpauseHash);
    }
    
    // ============================================
    // Helper Functions
    // ============================================
    
    function _transitionToDecentralized() internal {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        for (uint256 i = 0; i < voters.length; i++) {
            vm.startPrank(voters[i]);
            qsToken.approve(address(veQSToken), type(uint256).max);
            veQSToken.createLock(2_000_000e18, block.timestamp + 365 days);
            vm.stopPrank();
        }
        
        bytes32 transitionHash = keccak256("transition_decentralized");
        for (uint256 i = 0; i < MULTISIG_THRESHOLD; i++) {
            vm.prank(multisigSigners[i]);
            governanceSwitch.signAction(transitionHash);
        }
        
        vm.prank(multisigSigners[0]);
        governanceSwitch.transitionToDecentralized();
    }
}
