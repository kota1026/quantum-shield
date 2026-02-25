// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

/// @title EmergencyControllerTest
/// @notice Test suite for Emergency Controller contract
/// @dev TDD approach - tests written before implementation
/// @custom:ref CURRENT_PLAN.md GOV-005
/// @custom:ref SEQUENCES v2.0 #8 (Emergency Pause &amp; Recovery)
contract EmergencyControllerTest is Test {
    // ============ Constants ============
    
    uint256 constant MAX_PAUSE_DURATION = 72 hours;
    uint256 constant MAX_EXTENSION_DURATION = 7 days;
    uint256 constant EXTENSION_VOTING_PERIOD = 48 hours;
    uint256 constant MAX_EXTENSIONS = 3;
    uint256 constant PAUSE_COOLDOWN = 24 hours;
    uint256 constant EXTENSION_QUORUM_BPS = 400; // 4%
    
    // ============ State Variables ============
    
    address public emergencyController;
    address public securityCouncil;
    address public veQSToken;
    address public guardian;
    
    address[] public voters;
    
    // ============ Events (Expected) ============
    
    event ProtocolPaused(
        address indexed pausedBy,
        string reason,
        uint256 pausedUntil
    );
    
    event ProtocolUnpaused(address indexed unpausedBy);
    
    event PauseExtended(
        uint256 indexed extensionId,
        uint256 newEndTime,
        uint256 votesFor
    );
    
    event ExtensionProposed(
        uint256 indexed extensionId,
        uint256 requestedDuration,
        address proposer
    );
    
    event ExtensionVoted(
        uint256 indexed extensionId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    
    event RecoveryAction(
        bytes32 indexed actionId,
        uint8 recoveryType,
        bytes data
    );
    
    event GuardianUpdated(address indexed oldGuardian, address indexed newGuardian);
    
    // ============ Setup ============
    
    function setUp() public {
        securityCouncil = makeAddr("securityCouncil");
        veQSToken = makeAddr("veQSToken");
        guardian = makeAddr("guardian");
        
        // Create voters with veQS tokens
        for (uint256 i = 0; i < 10; i++) {
            address voter = makeAddr(string(abi.encodePacked("voter", vm.toString(i))));
            voters.push(voter);
            vm.label(voter, string(abi.encodePacked("Voter", vm.toString(i))));
        }
        
        // TODO: Deploy actual EmergencyController contract
        // emergencyController = address(new EmergencyController(
        //     securityCouncil,
        //     veQSToken,
        //     guardian
        // ));
        
        vm.label(securityCouncil, "SecurityCouncil");
        vm.label(veQSToken, "veQSToken");
        vm.label(guardian, "Guardian");
    }
    
    // ============ Helper Functions ============
    
    function _mockVeQSBalance(address account, uint256 balance) internal {
        // Mock veQS.balanceOf(account) returns balance
        vm.mockCall(
            veQSToken,
            abi.encodeWithSignature("balanceOf(address)", account),
            abi.encode(balance)
        );
    }
    
    function _mockVeQSTotalSupply(uint256 totalSupply) internal {
        vm.mockCall(
            veQSToken,
            abi.encodeWithSignature("totalSupply()"),
            abi.encode(totalSupply)
        );
    }
    
    // ============ Deployment Tests ============
    
    function test_deployment_setsSecurityCouncil() public {
        vm.skip(true);
        // assertEq(EmergencyController(emergencyController).securityCouncil(), securityCouncil);
    }
    
    function test_deployment_setsVeQS() public {
        vm.skip(true);
        // assertEq(EmergencyController(emergencyController).veQS(), veQSToken);
    }
    
    function test_deployment_setsGuardian() public {
        vm.skip(true);
        // assertEq(EmergencyController(emergencyController).guardian(), guardian);
    }
    
    function test_deployment_protocolNotPaused() public {
        vm.skip(true);
        // assertFalse(EmergencyController(emergencyController).isPaused());
    }
    
    // ============ Pause Tests ============
    
    function test_pause_pausesProtocol() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Security incident", 24 hours);
        
        // assertTrue(EmergencyController(emergencyController).isPaused());
    }
    
    function test_pause_emitsEvent() public {
        vm.skip(true);
        
        // vm.expectEmit(true, false, false, true);
        // emit ProtocolPaused(securityCouncil, "Security incident", block.timestamp + 24 hours);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Security incident", 24 hours);
    }
    
    function test_pause_setsPauseState() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Security incident", 24 hours);
        
        // PauseState memory state = EmergencyController(emergencyController).getPauseState();
        // assertTrue(state.paused);
        // assertEq(state.pausedBy, securityCouncil);
        // assertEq(state.reason, "Security incident");
        // assertEq(state.pausedUntil, block.timestamp + 24 hours);
    }
    
    function test_pause_revertsIfNotSecurityCouncil() public {
        vm.skip(true);
        
        address notSC = makeAddr("notSC");
        
        vm.prank(notSC);
        // vm.expectRevert(NotAuthorized.selector);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
    }
    
    function test_pause_revertsIfAlreadyPaused() public {
        vm.skip(true);
        
        vm.startPrank(securityCouncil);
        // EmergencyController(emergencyController).pause("First pause", 24 hours);
        
        // vm.expectRevert(AlreadyPaused.selector);
        // EmergencyController(emergencyController).pause("Second pause", 24 hours);
        vm.stopPrank();
    }
    
    function test_pause_revertsIfDurationExceedsMax() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // vm.expectRevert(InvalidDuration.selector);
        // EmergencyController(emergencyController).pause("Reason", MAX_PAUSE_DURATION + 1);
    }
    
    function test_pause_revertsIfDurationIsZero() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // vm.expectRevert(InvalidDuration.selector);
        // EmergencyController(emergencyController).pause("Reason", 0);
    }
    
    function test_pause_revertsIfCooldownNotMet() public {
        vm.skip(true);
        
        // First pause
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("First", 1 hours);
        
        // Wait for pause to expire
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Unpause
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).unpause();
        
        // Try to pause again before cooldown
        vm.prank(securityCouncil);
        // vm.expectRevert(CooldownNotMet.selector);
        // EmergencyController(emergencyController).pause("Second", 1 hours);
    }
    
    function test_pause_allowsAfterCooldown() public {
        vm.skip(true);
        
        // First pause
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("First", 1 hours);
        
        vm.warp(block.timestamp + 1 hours + 1);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).unpause();
        
        // Wait for cooldown
        vm.warp(block.timestamp + PAUSE_COOLDOWN + 1);
        
        // Now pause should work
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Second", 1 hours);
        
        // assertTrue(EmergencyController(emergencyController).isPaused());
    }
    
    // ============ Unpause Tests ============
    
    function test_unpause_unpausesProtocol() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).unpause();
        
        // assertFalse(EmergencyController(emergencyController).isPaused());
    }
    
    function test_unpause_emitsEvent() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        // vm.expectEmit(true, false, false, false);
        // emit ProtocolUnpaused(securityCouncil);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).unpause();
    }
    
    function test_unpause_revertsIfNotPaused() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // vm.expectRevert(NotPaused.selector);
        // EmergencyController(emergencyController).unpause();
    }
    
    function test_unpause_automaticallyAfterExpiry() public {
        // Anyone can call unpause after pause expires
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 1 hours);
        
        // Warp past pause duration
        vm.warp(block.timestamp + 1 hours + 1);
        
        address anyone = makeAddr("anyone");
        vm.prank(anyone);
        // EmergencyController(emergencyController).unpause();
        
        // assertFalse(EmergencyController(emergencyController).isPaused());
    }
    
    function test_unpause_revertsIfCalledByNonSCBeforeExpiry() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        // Try to unpause before expiry by non-SC
        address notSC = makeAddr("notSC");
        vm.prank(notSC);
        // vm.expectRevert(NotAuthorized.selector);
        // EmergencyController(emergencyController).unpause();
    }
    
    // ============ Extension Proposal Tests ============
    
    function test_proposeExtension_createsExtension() public {
        vm.skip(true);
        
        // Setup: pause protocol
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        // Mock veQS balance
        _mockVeQSBalance(voters[0], 1000 ether);
        _mockVeQSTotalSupply(100_000 ether);
        
        vm.prank(voters[0]);
        // uint256 extensionId = EmergencyController(emergencyController).proposeExtension(48 hours);
        
        // assertTrue(extensionId > 0);
    }
    
    function test_proposeExtension_emitsEvent() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        _mockVeQSBalance(voters[0], 1000 ether);
        _mockVeQSTotalSupply(100_000 ether);
        
        // vm.expectEmit(true, false, false, true);
        // emit ExtensionProposed(1, 48 hours, voters[0]);
        
        vm.prank(voters[0]);
        // EmergencyController(emergencyController).proposeExtension(48 hours);
    }
    
    function test_proposeExtension_revertsIfNotPaused() public {
        vm.skip(true);
        
        _mockVeQSBalance(voters[0], 1000 ether);
        
        vm.prank(voters[0]);
        // vm.expectRevert(NotPaused.selector);
        // EmergencyController(emergencyController).proposeExtension(48 hours);
    }
    
    function test_proposeExtension_revertsIfNoVeQS() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        _mockVeQSBalance(voters[0], 0);
        
        vm.prank(voters[0]);
        // vm.expectRevert(NotAuthorized.selector);
        // EmergencyController(emergencyController).proposeExtension(48 hours);
    }
    
    function test_proposeExtension_revertsIfDurationExceedsMax() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        _mockVeQSBalance(voters[0], 1000 ether);
        
        vm.prank(voters[0]);
        // vm.expectRevert(InvalidDuration.selector);
        // EmergencyController(emergencyController).proposeExtension(MAX_EXTENSION_DURATION + 1);
    }
    
    function test_proposeExtension_revertsIfMaxExtensionsReached() public {
        vm.skip(true);
        
        // Would need to successfully extend MAX_EXTENSIONS times first
        // Then try to propose another extension
    }
    
    // ============ Extension Voting Tests ============
    
    function test_voteOnExtension_castsVote() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        _mockVeQSBalance(voters[0], 1000 ether);
        _mockVeQSTotalSupply(100_000 ether);
        
        vm.prank(voters[0]);
        // uint256 extensionId = EmergencyController(emergencyController).proposeExtension(48 hours);
        
        _mockVeQSBalance(voters[1], 2000 ether);
        
        vm.prank(voters[1]);
        // EmergencyController(emergencyController).voteOnExtension(extensionId, true);
        
        // ExtensionRequest memory ext = EmergencyController(emergencyController).getExtension(extensionId);
        // assertEq(ext.votesFor, 3000 ether); // 1000 from proposer + 2000 from voter
    }
    
    function test_voteOnExtension_emitsEvent() public {
        vm.skip(true);
        
        // vm.expectEmit(true, true, false, true);
        // emit ExtensionVoted(extensionId, voters[1], true, 2000 ether);
    }
    
    function test_voteOnExtension_revertsIfAlreadyVoted() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        _mockVeQSBalance(voters[0], 1000 ether);
        _mockVeQSTotalSupply(100_000 ether);
        
        vm.prank(voters[0]);
        // uint256 extensionId = EmergencyController(emergencyController).proposeExtension(48 hours);
        
        vm.prank(voters[0]);
        // vm.expectRevert(AlreadyVotedOnExtension.selector);
        // EmergencyController(emergencyController).voteOnExtension(extensionId, true);
    }
    
    function test_voteOnExtension_revertsIfVotingEnded() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        _mockVeQSBalance(voters[0], 1000 ether);
        _mockVeQSTotalSupply(100_000 ether);
        
        vm.prank(voters[0]);
        // uint256 extensionId = EmergencyController(emergencyController).proposeExtension(48 hours);
        
        // Warp past voting period
        vm.warp(block.timestamp + EXTENSION_VOTING_PERIOD + 1);
        
        _mockVeQSBalance(voters[1], 2000 ether);
        
        vm.prank(voters[1]);
        // vm.expectRevert(ExtensionVotingNotActive.selector);
        // EmergencyController(emergencyController).voteOnExtension(extensionId, true);
    }
    
    function test_voteOnExtension_againstVote() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        _mockVeQSBalance(voters[0], 1000 ether);
        _mockVeQSTotalSupply(100_000 ether);
        
        vm.prank(voters[0]);
        // uint256 extensionId = EmergencyController(emergencyController).proposeExtension(48 hours);
        
        _mockVeQSBalance(voters[1], 2000 ether);
        
        vm.prank(voters[1]);
        // EmergencyController(emergencyController).voteOnExtension(extensionId, false);
        
        // ExtensionRequest memory ext = EmergencyController(emergencyController).getExtension(extensionId);
        // assertEq(ext.votesAgainst, 2000 ether);
    }
    
    // ============ Execute Extension Tests ============
    
    function test_executeExtension_extendsePause() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        // Setup: reach quorum (4% of total supply)
        _mockVeQSTotalSupply(100_000 ether);
        
        // Proposer has 4000 ether (4%)
        _mockVeQSBalance(voters[0], 4000 ether);
        
        vm.prank(voters[0]);
        // uint256 extensionId = EmergencyController(emergencyController).proposeExtension(48 hours);
        
        // uint256 oldPausedUntil = EmergencyController(emergencyController).getPauseState().pausedUntil;
        
        // Execute extension
        vm.prank(voters[0]);
        // EmergencyController(emergencyController).executeExtension(extensionId);
        
        // uint256 newPausedUntil = EmergencyController(emergencyController).getPauseState().pausedUntil;
        // assertEq(newPausedUntil, oldPausedUntil + 48 hours);
    }
    
    function test_executeExtension_emitsEvent() public {
        vm.skip(true);
        
        // vm.expectEmit(true, false, false, true);
        // emit PauseExtended(extensionId, newEndTime, votesFor);
    }
    
    function test_executeExtension_revertsIfQuorumNotMet() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        _mockVeQSTotalSupply(100_000 ether);
        _mockVeQSBalance(voters[0], 1000 ether); // Only 1%, need 4%
        
        vm.prank(voters[0]);
        // uint256 extensionId = EmergencyController(emergencyController).proposeExtension(48 hours);
        
        vm.prank(voters[0]);
        // vm.expectRevert(ExtensionNotApproved.selector);
        // EmergencyController(emergencyController).executeExtension(extensionId);
    }
    
    function test_executeExtension_revertsIfAlreadyExecuted() public {
        vm.skip(true);
        
        // Execute once, then try again
    }
    
    function test_executeExtension_incrementsExtensionCount() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        // uint256 beforeCount = EmergencyController(emergencyController).currentExtensionCount();
        
        _mockVeQSTotalSupply(100_000 ether);
        _mockVeQSBalance(voters[0], 4000 ether);
        
        vm.prank(voters[0]);
        // uint256 extensionId = EmergencyController(emergencyController).proposeExtension(48 hours);
        
        vm.prank(voters[0]);
        // EmergencyController(emergencyController).executeExtension(extensionId);
        
        // uint256 afterCount = EmergencyController(emergencyController).currentExtensionCount();
        // assertEq(afterCount, beforeCount + 1);
    }
    
    // ============ Recovery Action Tests ============
    
    function test_executeRecovery_contractUpgrade() public {
        vm.skip(true);
        
        // Must be paused
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        address newImpl = makeAddr("newImpl");
        bytes memory data = abi.encode(newImpl);
        
        // Both guardian and SC must approve
        vm.prank(guardian);
        // bytes32 actionId = EmergencyController(emergencyController).executeRecovery(
        //     RecoveryType.ContractUpgrade,
        //     data
        // );
        
        // assertTrue(actionId != bytes32(0));
    }
    
    function test_executeRecovery_emitsEvent() public {
        vm.skip(true);
        
        // vm.expectEmit(true, true, false, true);
        // emit RecoveryAction(actionId, RecoveryType.ContractUpgrade, data);
    }
    
    function test_executeRecovery_revertsIfNotPaused() public {
        vm.skip(true);
        
        bytes memory data = abi.encode(makeAddr("newImpl"));
        
        vm.prank(guardian);
        // vm.expectRevert(NotPaused.selector);
        // EmergencyController(emergencyController).executeRecovery(
        //     RecoveryType.ContractUpgrade,
        //     data
        // );
    }
    
    function test_executeRecovery_revertsIfNotGuardian() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        address notGuardian = makeAddr("notGuardian");
        bytes memory data = abi.encode(makeAddr("newImpl"));
        
        vm.prank(notGuardian);
        // vm.expectRevert(NotAuthorized.selector);
        // EmergencyController(emergencyController).executeRecovery(
        //     RecoveryType.ContractUpgrade,
        //     data
        // );
    }
    
    // ============ Guardian Management Tests ============
    
    function test_setGuardian_updatesGuardian() public {
        vm.skip(true);
        
        address newGuardian = makeAddr("newGuardian");
        
        // Must go through governance or SC
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).setGuardian(newGuardian);
        
        // assertEq(EmergencyController(emergencyController).guardian(), newGuardian);
    }
    
    function test_setGuardian_emitsEvent() public {
        vm.skip(true);
        
        address newGuardian = makeAddr("newGuardian");
        
        // vm.expectEmit(true, true, false, false);
        // emit GuardianUpdated(guardian, newGuardian);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).setGuardian(newGuardian);
    }
    
    function test_setGuardian_revertsIfZeroAddress() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // vm.expectRevert();
        // EmergencyController(emergencyController).setGuardian(address(0));
    }
    
    // ============ View Function Tests ============
    
    function test_isPaused_returnsTrueWhenPaused() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        // assertTrue(EmergencyController(emergencyController).isPaused());
    }
    
    function test_isPaused_returnsFalseAfterExpiry() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 1 hours);
        
        vm.warp(block.timestamp + 1 hours + 1);
        
        // assertFalse(EmergencyController(emergencyController).isPaused());
    }
    
    function test_pauseTimeRemaining_returnsCorrectTime() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        // assertEq(EmergencyController(emergencyController).pauseTimeRemaining(), 24 hours);
        
        vm.warp(block.timestamp + 12 hours);
        
        // assertEq(EmergencyController(emergencyController).pauseTimeRemaining(), 12 hours);
    }
    
    function test_pauseTimeRemaining_returnsZeroAfterExpiry() public {
        vm.skip(true);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 1 hours);
        
        vm.warp(block.timestamp + 2 hours);
        
        // assertEq(EmergencyController(emergencyController).pauseTimeRemaining(), 0);
    }
    
    function test_extensionQuorum_returns4Percent() public {
        vm.skip(true);
        
        _mockVeQSTotalSupply(100_000 ether);
        
        // assertEq(EmergencyController(emergencyController).extensionQuorum(), 4000 ether);
    }
    
    // ============ Invariant Tests ============
    
    function invariant_pauseDurationNeverExceeds72Hours() public {
        vm.skip(true);
        // PauseState memory state = EmergencyController(emergencyController).getPauseState();
        // if (state.paused) {
        //     assertTrue(state.pausedUntil - state.pausedAt <= MAX_PAUSE_DURATION);
        // }
    }
    
    function invariant_extensionCountNeverExceedsMax() public {
        vm.skip(true);
        // assertLe(EmergencyController(emergencyController).currentExtensionCount(), MAX_EXTENSIONS);
    }
    
    // ============ Fuzz Tests ============
    
    function testFuzz_pause_withValidDuration(uint256 duration) public {
        vm.skip(true);
        
        duration = bound(duration, 1, MAX_PAUSE_DURATION);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", duration);
        
        // assertTrue(EmergencyController(emergencyController).isPaused());
    }
    
    function testFuzz_proposeExtension_withValidDuration(uint256 duration) public {
        vm.skip(true);
        
        duration = bound(duration, 1, MAX_EXTENSION_DURATION);
        
        vm.prank(securityCouncil);
        // EmergencyController(emergencyController).pause("Reason", 24 hours);
        
        _mockVeQSBalance(voters[0], 1000 ether);
        _mockVeQSTotalSupply(100_000 ether);
        
        vm.prank(voters[0]);
        // uint256 extensionId = EmergencyController(emergencyController).proposeExtension(duration);
        
        // assertTrue(extensionId > 0);
    }
    
    // ============ Integration Tests ============
    
    function test_integration_fullPauseExtensionFlow() public {
        // Test complete flow:
        // 1. SC pauses
        // 2. Extension proposed
        // 3. Votes cast
        // 4. Extension executed
        // 5. Protocol remains paused with extended duration
        vm.skip(true);
    }
    
    function test_integration_pauseRecoveryFlow() public {
        // Test:
        // 1. SC pauses
        // 2. Guardian executes recovery
        // 3. Protocol recovers
        vm.skip(true);
    }
}
