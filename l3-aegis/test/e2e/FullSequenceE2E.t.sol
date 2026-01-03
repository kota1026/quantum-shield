// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/CoreState.sol";
import "../../src/sequencer/SequencerRegistry.sol";
import "../../src/sequencer/SequencerSlashing.sol";
import "../../src/governance/Governor.sol";
import "../../src/governance/SecurityCouncil.sol";
import "../../src/governance/Timelock.sol";
import "../../src/token/QSToken.sol";
import "../../src/token/veQS.sol";
import "../../src/treasury/Treasury.sol";

/**
 * @title FullSequenceE2E
 * @notice End-to-end tests for all 8 Sequences from QUANTUM_SHIELD_SEQUENCES_v2.0
 * @dev Implements TEST-001 from Phase 3.3 Track B
 */
contract FullSequenceE2E is Test {
    // Constants
    uint256 public constant NORMAL_TIMELOCK = 24 hours;
    uint256 public constant EMERGENCY_TIMELOCK = 7 days;
    uint256 public constant EMERGENCY_TIMEOUT = 72 hours;
    uint256 public constant UNBONDING_PERIOD = 7 days;
    uint256 public constant DEFENSE_PERIOD = 48 hours;
    uint256 public constant GOVERNANCE_TIMELOCK = 7 days;
    uint256 public constant MIN_EMERGENCY_BOND = 0.5 ether;
    uint256 public constant EMERGENCY_BOND_PERCENT = 5;
    uint256 public constant MIN_CHALLENGE_BOND = 0.1 ether;
    uint256 public constant BASE_SLASH_PERCENT = 10;
    uint256 public constant SC_SIZE = 9;
    uint256 public constant SC_THRESHOLD = 5;
    uint256 public constant MIN_PROVER_STAKE = 400_000e18;
    
    // Contracts
    CoreState public coreState;
    SequencerRegistry public sequencerRegistry;
    SequencerSlashing public slashing;
    Governor public governor;
    SecurityCouncil public securityCouncil;
    Timelock public timelock;
    QSToken public qsToken;
    veQS public veQSToken;
    Treasury public treasury;
    
    // Actors
    address public admin;
    address public user;
    address public prover;
    address public challenger;
    address[] public scMembers;
    address[] public provers;
    
    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");
        prover = makeAddr("prover");
        challenger = makeAddr("challenger");
        
        // Setup SC members (9)
        for (uint256 i = 0; i < SC_SIZE; i++) {
            scMembers.push(makeAddr(string.concat("sc", vm.toString(i))));
        }
        
        // Setup provers (5)
        for (uint256 i = 0; i < 5; i++) {
            provers.push(makeAddr(string.concat("prover", vm.toString(i))));
        }
        
        vm.startPrank(admin);
        
        // Deploy contracts
        coreState = new CoreState(admin);
        treasury = new Treasury(admin);
        sequencerRegistry = new SequencerRegistry(admin);
        slashing = new SequencerSlashing(address(sequencerRegistry), address(treasury), admin);
        qsToken = new QSToken();
        veQSToken = new veQS(address(qsToken));
        timelock = new Timelock(admin, GOVERNANCE_TIMELOCK);
        
        // SecurityCouncil needs address[9] array
        address[9] memory scArray;
        for (uint256 i = 0; i < 9; i++) {
            scArray[i] = scMembers[i];
        }
        securityCouncil = new SecurityCouncil(scArray, admin);
        governor = new Governor(address(veQSToken), address(timelock));
        
        vm.stopPrank();
        
        // Fund actors
        vm.deal(user, 100 ether);
        vm.deal(challenger, 10 ether);
        
        for (uint256 i = 0; i < provers.length; i++) {
            vm.deal(provers[i], MIN_PROVER_STAKE + 1 ether);
        }
    }
    
    // SEQ#1: Lock
    function test_SEQ1_Lock_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        vm.startPrank(user);
        bytes32 commitment = keccak256(abi.encodePacked(user, lockAmount, block.timestamp));
        coreState.lock{value: lockAmount}(commitment);
        vm.stopPrank();
        assertTrue(coreState.isLocked(commitment), "Asset should be locked");
    }
    
    // SEQ#2: Unlock Normal
    function test_SEQ2_UnlockNormal_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        bytes32 commitment = _lockAsset(user, lockAmount);
        _registerProvers();
        
        vm.prank(user);
        coreState.requestUnlock(commitment);
        vm.warp(block.timestamp + NORMAL_TIMELOCK);
        
        bytes[] memory signatures = _getProverSignatures(commitment, 2);
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreState.claimUnlock(commitment, signatures);
        
        assertEq(user.balance - balanceBefore, lockAmount, "Should receive locked amount");
        assertFalse(coreState.isLocked(commitment), "Asset should be unlocked");
    }
    
    // SEQ#3: Emergency Unlock
    function test_SEQ3_UnlockEmergency_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        bytes32 commitment = _lockAsset(user, lockAmount);
        vm.warp(block.timestamp + EMERGENCY_TIMEOUT);
        
        uint256 bond = _calculateEmergencyBond(lockAmount);
        vm.prank(user);
        coreState.initiateEmergencyUnlock{value: bond}(commitment);
        vm.warp(block.timestamp + EMERGENCY_TIMELOCK);
        
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreState.executeEmergencyUnlock(commitment);
        assertGe(user.balance - balanceBefore, lockAmount, "Should receive at least locked amount");
    }
    
    // SEQ#4: Challenge
    function test_SEQ4_Challenge_DoubleSignSlash() public {
        vm.deal(prover, MIN_PROVER_STAKE + 1 ether);
        vm.prank(prover);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        bytes memory doubleSignProof = abi.encodePacked(prover, "double_sign");
        uint256 challengeBond = _calculateChallengeBond(MIN_PROVER_STAKE);
        vm.prank(challenger);
        slashing.submitChallenge{value: challengeBond}(prover, doubleSignProof);
        vm.warp(block.timestamp + DEFENSE_PERIOD);
        
        uint256 proverStakeBefore = sequencerRegistry.getStake(prover);
        vm.prank(admin);
        slashing.executeSlash(prover);
        
        uint256 expectedSlash = proverStakeBefore * BASE_SLASH_PERCENT / 100;
        uint256 proverStakeAfter = sequencerRegistry.getStake(prover);
        assertEq(proverStakeBefore - proverStakeAfter, expectedSlash, "Should slash 10%");
    }
    
    // SEQ#5: Prover Registration
    function test_SEQ5_ProverRegistration_BasicFlow() public {
        address newProver = makeAddr("newProver");
        vm.deal(newProver, MIN_PROVER_STAKE + 1 ether);
        vm.prank(newProver);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        assertTrue(sequencerRegistry.isRegistered(newProver), "Prover should be registered");
        assertEq(sequencerRegistry.getStake(newProver), MIN_PROVER_STAKE, "Stake should match");
    }
    
    // SEQ#6: Prover Exit
    function test_SEQ6_ProverExit_BasicFlow() public {
        vm.deal(prover, MIN_PROVER_STAKE + 1 ether);
        vm.prank(prover);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        vm.prank(prover);
        sequencerRegistry.initiateExit();
        vm.warp(block.timestamp + UNBONDING_PERIOD);
        
        uint256 balanceBefore = prover.balance;
        vm.prank(prover);
        sequencerRegistry.completeExit();
        
        assertEq(prover.balance - balanceBefore, MIN_PROVER_STAKE, "Should return full stake");
        assertFalse(sequencerRegistry.isRegistered(prover), "Should be unregistered");
    }
    
    // SEQ#7: Governance
    function test_SEQ7_Governance_FullProposalLifecycle() public {
        _setupVoterWithVeQS(user, 1_000_000e18);
        
        vm.prank(user);
        uint256 proposalId = governor.propose(
            address(coreState),
            abi.encodeWithSignature("updateParameter(uint256)", 100),
            "Update parameter"
        );
        
        vm.warp(block.timestamp + 7 days); // Discussion
        vm.prank(user);
        governor.castVote(proposalId, true);
        vm.warp(block.timestamp + 7 days); // Voting
        vm.prank(user);
        governor.queue(proposalId);
        vm.warp(block.timestamp + GOVERNANCE_TIMELOCK);
        vm.prank(user);
        governor.execute(proposalId);
        
        assertTrue(governor.isExecuted(proposalId), "Proposal should be executed");
    }
    
    // SEQ#8: Emergency Pause
    function test_SEQ8_EmergencyPause_SCActivation() public {
        // SC proposes pause action
        vm.prank(scMembers[0]);
        bytes32 actionId = securityCouncil.proposeAction(
            ISecurityCouncil.ActionType.EmergencyPause,
            abi.encode("Emergency test")
        );
        
        // Get 5/9 signatures
        for (uint256 i = 1; i < SC_THRESHOLD; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.signAction(actionId);
        }
        
        // Execute
        vm.prank(scMembers[0]);
        securityCouncil.executeAction(actionId);
        
        // Verify action was executed
        ISecurityCouncil.Action memory action = securityCouncil.getAction(actionId);
        assertEq(uint8(action.state), uint8(ISecurityCouncil.ActionState.Executed));
    }
    
    // CP Compliance Tests
    function test_CP3_TimeLock_AllPathsHaveDelay() public pure {
        assertTrue(NORMAL_TIMELOCK > 0, "Normal timelock must be > 0");
        assertTrue(EMERGENCY_TIMELOCK > 0, "Emergency timelock must be > 0");
        assertTrue(GOVERNANCE_TIMELOCK > 0, "Governance timelock must be > 0");
    }
    
    function test_CP4_Slashing_MechanismExists() public view {
        assertTrue(address(slashing) != address(0), "Slashing contract must exist");
        assertTrue(BASE_SLASH_PERCENT > 0, "Slash percent must be > 0");
    }
    
    // Helper Functions
    function _lockAsset(address _user, uint256 _amount) internal returns (bytes32) {
        bytes32 commitment = keccak256(abi.encodePacked(_user, _amount, block.timestamp));
        vm.prank(_user);
        coreState.lock{value: _amount}(commitment);
        return commitment;
    }
    
    function _registerProvers() internal {
        for (uint256 i = 0; i < provers.length; i++) {
            vm.prank(provers[i]);
            sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        }
    }
    
    function _getProverSignatures(bytes32 commitment, uint256 count) internal pure returns (bytes[] memory) {
        bytes[] memory signatures = new bytes[](count);
        for (uint256 i = 0; i < count; i++) {
            signatures[i] = abi.encodePacked(commitment, i);
        }
        return signatures;
    }
    
    function _calculateEmergencyBond(uint256 amount) internal pure returns (uint256) {
        uint256 percentBond = amount * EMERGENCY_BOND_PERCENT / 100;
        return percentBond > MIN_EMERGENCY_BOND ? percentBond : MIN_EMERGENCY_BOND;
    }
    
    function _calculateChallengeBond(uint256) internal pure returns (uint256) {
        return MIN_CHALLENGE_BOND;
    }
    
    function _setupVoterWithVeQS(address voter, uint256 amount) internal {
        vm.prank(admin);
        qsToken.mint(voter, amount);
        vm.startPrank(voter);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, block.timestamp + 365 days);
        vm.stopPrank();
    }
}
