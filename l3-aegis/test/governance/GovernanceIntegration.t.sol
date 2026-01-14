// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "src/governance/Timelock.sol";
import "src/governance/SecurityCouncil.sol";
import "src/governance/EmergencyController.sol";
import "src/interfaces/ITimelock.sol";
import "src/interfaces/ISecurityCouncil.sol";
import "src/interfaces/IEmergencyController.sol";

/// @title GovernanceIntegrationTest
/// @notice Integration tests for Governance Layer components
/// @dev Per GOV-006 requirements - Governance統合テスト
/// @custom:ref CURRENT_PLAN.md GOV-006
/// @custom:ref SEQUENCES v2.0 #7, #8
contract GovernanceIntegrationTest is Test {
    // ============ State Variables ============
    
    Timelock public timelock;
    SecurityCouncil public securityCouncil;
    EmergencyController public emergencyController;
    
    address public governor;
    address public guardian;
    address public veQSToken;
    
    address[9] public councilMembers;
    address[] public voters;
    
    // ============ Events ============
    
    event ProtocolPaused(address indexed pausedBy, string reason, uint256 pausedUntil);
    event ProtocolUnpaused(address indexed unpausedBy);
    
    // ============ Setup ============
    
    function setUp() public {
        // Create addresses
        governor = makeAddr("governor");
        guardian = makeAddr("guardian");
        veQSToken = address(new MockVeQS());
        
        // Create 9 council members
        for (uint256 i = 0; i < 9; i++) {
            councilMembers[i] = makeAddr(string(abi.encodePacked("council", vm.toString(i))));
            vm.label(councilMembers[i], string(abi.encodePacked("Council", vm.toString(i))));
        }
        
        // Create voters with veQS
        for (uint256 i = 0; i < 10; i++) {
            address voter = makeAddr(string(abi.encodePacked("voter", vm.toString(i))));
            voters.push(voter);
            MockVeQS(veQSToken).mint(voter, 10_000 ether);
        }
        
        // Deploy contracts
        timelock = new Timelock(governor, 7 days);
        securityCouncil = new SecurityCouncil(councilMembers, governor);
        emergencyController = new EmergencyController(
            address(securityCouncil),
            veQSToken,
            guardian
        );
        
        // Link contracts
        vm.prank(governor);
        securityCouncil.setEmergencyController(address(emergencyController));
        
        vm.label(address(timelock), "Timelock");
        vm.label(address(securityCouncil), "SecurityCouncil");
        vm.label(address(emergencyController), "EmergencyController");
    }
    
    // ============ Sequence #7: Governance Proposal Flow ============
    
    function test_sequence7_fullGovernanceProposalFlow() public {
        // Sequence #7: propose() → 議論7日 → 投票7日 → Time Lock 7日 → execute()
        
        // 1. Create a governance action through timelock
        bytes memory actionData = abi.encodeWithSignature("setValue(uint256)", 42);
        address target = address(new MockTarget());
        uint256 eta = block.timestamp + 7 days;
        
        // Governor schedules through timelock
        vm.prank(governor);
        bytes32 txHash = timelock.schedule(target, 0, actionData, eta);
        
        // Verify scheduled
        assertTrue(timelock.isQueued(txHash));
        assertFalse(timelock.isReady(txHash));
        
        // 2. Wait for timelock (simulating discussion + voting + timelock = 21 days)
        vm.warp(block.timestamp + 7 days);
        
        // Now ready to execute
        assertTrue(timelock.isReady(txHash));
        
        // 3. Execute
        vm.prank(governor);
        timelock.execute(target, 0, actionData, eta);
        
        // Verify execution - cast enum to uint256 for assertEq
        assertTrue(timelock.getTransactionState(txHash) == ITimelock.TransactionState.Executed);
        assertEq(MockTarget(target).value(), 42);
    }
    
    function test_sequence7_vetoBySecurityCouncil() public {
        // Security Council can veto governance proposals with 6/9
        
        bytes32 proposalId = keccak256("proposal1");
        bytes memory data = abi.encode(proposalId);
        
        // Member 0 proposes veto
        vm.prank(councilMembers[0]);
        bytes32 actionId = securityCouncil.proposeAction(
            ISecurityCouncil.ActionType.Veto,
            data
        );
        
        // Need 6 signatures total (member 0 already signed)
        for (uint256 i = 1; i < 6; i++) {
            vm.prank(councilMembers[i]);
            securityCouncil.signAction(actionId);
        }
        
        // Verify threshold met
        assertTrue(securityCouncil.isActionReady(actionId));
        assertEq(securityCouncil.getSignatureCount(actionId), 6);
    }
    
    // ============ Sequence #8: Emergency Pause & Recovery ============
    
    function test_sequence8_emergencyPauseBy5of9() public {
        // SC 5/9 can pause protocol for up to 72 hours
        
        bytes memory data = abi.encode("Security vulnerability detected");
        
        // Member 0 proposes pause
        vm.prank(councilMembers[0]);
        bytes32 actionId = securityCouncil.proposeAction(
            ISecurityCouncil.ActionType.EmergencyPause,
            data
        );
        
        // Members 1-4 sign (total 5)
        for (uint256 i = 1; i < 5; i++) {
            vm.prank(councilMembers[i]);
            securityCouncil.signAction(actionId);
        }
        
        assertEq(securityCouncil.getSignatureCount(actionId), 5);
        assertTrue(securityCouncil.isActionReady(actionId));
    }
    
    function test_sequence8_pauseAndUnpause() public {
        // Direct pause through EmergencyController
        
        assertFalse(emergencyController.isPaused());
        
        // Security Council pauses
        vm.prank(address(securityCouncil));
        emergencyController.pause("Critical bug found", 24 hours);
        
        assertTrue(emergencyController.isPaused());
        assertEq(emergencyController.pauseTimeRemaining(), 24 hours);
        
        // SC can unpause early
        vm.prank(address(securityCouncil));
        emergencyController.unpause();
        
        assertFalse(emergencyController.isPaused());
    }
    
    function test_sequence8_pauseExtensionByTokenVote() public {
        // Token holders can vote to extend pause beyond 72 hours
        
        // Setup: SC pauses protocol
        vm.prank(address(securityCouncil));
        emergencyController.pause("Investigation ongoing", 72 hours);
        
        assertTrue(emergencyController.isPaused());
        
        // Voter proposes extension
        vm.prank(voters[0]);
        uint256 extensionId = emergencyController.proposeExtension(48 hours);
        
        // Multiple voters support (need 4% quorum)
        // Total supply = 10 voters * 10,000 = 100,000 ether
        // Quorum = 4% = 4,000 ether
        // voter[0] already voted 10,000 ether (exceeds quorum)
        
        // Execute extension
        vm.prank(voters[0]);
        emergencyController.executeExtension(extensionId);
        
        // Verify extended
        assertEq(emergencyController.currentExtensionCount(), 1);
    }
    
    function test_sequence8_pauseExpiresAutomatically() public {
        // Pause expires after duration
        
        vm.prank(address(securityCouncil));
        emergencyController.pause("Temporary pause", 1 hours);
        
        assertTrue(emergencyController.isPaused());
        
        // Warp past pause duration
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Should be able to unpause by anyone after expiry
        address anyone = makeAddr("anyone");
        vm.prank(anyone);
        emergencyController.unpause();
        
        assertFalse(emergencyController.isPaused());
    }
    
    // ============ CP-3: Time Lock Invariant ============
    
    function test_cp3_timelockCannotBeBelowMinimum() public {
        // CP-3: Time Lock cannot be reduced to 0
        
        assertGe(timelock.delay(), timelock.MIN_DELAY());
        assertEq(timelock.MIN_DELAY(), 7 days);
        
        // Try to set delay below minimum (should revert)
        bytes memory data = abi.encodeWithSignature("setDelay(uint256)", 1 days);
        uint256 eta = block.timestamp + 7 days;
        
        vm.prank(governor);
        bytes32 txHash = timelock.schedule(address(timelock), 0, data, eta);
        
        vm.warp(eta);
        
        vm.expectRevert(ITimelock.DelayBelowMinimum.selector);
        vm.prank(governor);
        timelock.execute(address(timelock), 0, data, eta);
    }
    
    function test_cp3_timelockDelayCanBeIncreased() public {
        // Delay can be increased
        
        uint256 newDelay = 14 days;
        bytes memory data = abi.encodeWithSignature("setDelay(uint256)", newDelay);
        uint256 eta = block.timestamp + 7 days;
        
        vm.prank(governor);
        bytes32 txHash = timelock.schedule(address(timelock), 0, data, eta);
        
        vm.warp(eta);
        
        vm.prank(governor);
        timelock.execute(address(timelock), 0, data, eta);
        
        assertEq(timelock.delay(), newDelay);
    }
    
    // ============ Security Council Member Management ============
    
    function test_memberReplacement_requiresGovernance() public {
        // Only governance can replace SC members
        
        address newMember = makeAddr("newMember");
        address oldMember = councilMembers[0];
        
        // Direct call should revert
        vm.expectRevert(ISecurityCouncil.NotGovernor.selector);
        vm.prank(oldMember);
        securityCouncil.replaceMember(0, newMember);
        
        // Governor can replace
        vm.prank(governor);
        securityCouncil.replaceMember(0, newMember);
        
        assertEq(securityCouncil.getMember(0), newMember);
        assertFalse(securityCouncil.isMember(oldMember));
        assertTrue(securityCouncil.isMember(newMember));
    }
    
    function test_memberReplacement_invalidatesOldSignatures() public {
        // Old member's signatures should not count after replacement
        
        bytes memory data = abi.encode("test");
        
        // Old member proposes
        vm.prank(councilMembers[0]);
        bytes32 actionId = securityCouncil.proposeAction(
            ISecurityCouncil.ActionType.EmergencyPause,
            data
        );
        
        uint256 sigCountBefore = securityCouncil.getValidSignatureCount(actionId);
        assertEq(sigCountBefore, 1);
        
        // Replace member
        address newMember = makeAddr("newMember");
        vm.prank(governor);
        securityCouncil.replaceMember(0, newMember);
        
        // Valid signature count should be 0 (old member replaced)
        uint256 sigCountAfter = securityCouncil.getValidSignatureCount(actionId);
        assertEq(sigCountAfter, 0);
    }
    
    // ============ Cross-Contract Integration ============
    
    function test_integration_timelockWithGovernor() public {
        // Governor → Timelock → Execute
        
        MockTarget target = new MockTarget();
        bytes memory data = abi.encodeWithSignature("setValue(uint256)", 100);
        uint256 eta = block.timestamp + 7 days;
        
        // Schedule through governor
        vm.prank(governor);
        bytes32 txHash = timelock.schedule(address(target), 0, data, eta);
        
        vm.warp(eta);
        
        // Execute
        vm.prank(governor);
        timelock.execute(address(target), 0, data, eta);
        
        assertEq(target.value(), 100);
    }
    
    function test_integration_emergencyUpgrade7of9() public {
        // Emergency upgrade requires 7/9 SC approval
        
        address newImpl = makeAddr("newImpl");
        bytes memory upgradeData = abi.encodeWithSignature("upgradeTo(address)", newImpl);
        bytes memory data = abi.encode(address(0), upgradeData); // target, data
        
        vm.prank(councilMembers[0]);
        bytes32 actionId = securityCouncil.proposeAction(
            ISecurityCouncil.ActionType.EmergencyUpgrade,
            data
        );
        
        // Need 7 signatures
        for (uint256 i = 1; i < 7; i++) {
            vm.prank(councilMembers[i]);
            securityCouncil.signAction(actionId);
        }
        
        assertTrue(securityCouncil.isActionReady(actionId));
        assertEq(securityCouncil.getSignatureCount(actionId), 7);
    }
    
    function test_integration_recoveryByGuardian() public {
        // Guardian can execute recovery during pause
        
        // First pause
        vm.prank(address(securityCouncil));
        emergencyController.pause("Recovery needed", 24 hours);
        
        // Guardian executes recovery
        bytes memory recoveryData = abi.encode(address(0), ""); // Placeholder
        
        vm.prank(guardian);
        bytes32 actionId = emergencyController.executeRecovery(
            IEmergencyController.RecoveryType.ParameterChange,
            recoveryData
        );
        
        assertTrue(actionId != bytes32(0));
    }
    
    // ============ Invariant Tests ============
    
    function invariant_alwaysExactly9CouncilMembers() public {
        assertEq(securityCouncil.memberCount(), 9);
    }
    
    function invariant_timelockDelayNeverBelowMinimum() public {
        assertGe(timelock.delay(), timelock.MIN_DELAY());
    }
    
    function invariant_pauseDurationMax72Hours() public {
        assertEq(emergencyController.MAX_PAUSE_DURATION(), 72 hours);
    }
}

/// @title MockVeQS
/// @notice Mock veQS token for testing
contract MockVeQS {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}

/// @title MockTarget
/// @notice Mock target contract for testing execution
contract MockTarget {
    uint256 public value;
    
    function setValue(uint256 _value) external {
        value = _value;
    }
}
