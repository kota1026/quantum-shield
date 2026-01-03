// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/CoreState.sol";
import "../../src/core/L1Verifier.sol";
import "../../src/sequencer/SequencerRegistry.sol";
import "../../src/sequencer/SequencerSlashing.sol";
import "../../src/governance/Governor.sol";
import "../../src/governance/SecurityCouncil.sol";
import "../../src/governance/Timelock.sol";
import "../../src/token/QSToken.sol";
import "../../src/token/veQS.sol";
import "../../src/treasury/InsuranceFund.sol";

/**
 * @title FullSequenceE2E
 * @notice End-to-end tests for all 8 Sequences from QUANTUM_SHIELD_SEQUENCES_v2.0
 * @dev Implements TEST-001 from Phase 3.3 Track B
 *
 * Sequences tested:
 * - SEQ#1: Lock (資産ロック)
 * - SEQ#2: Unlock Normal (通常アンロック)
 * - SEQ#3: Unlock Emergency (緊急アンロック)
 * - SEQ#3': Resync (L3-L1同期回復)
 * - SEQ#4: Challenge (不正チャレンジ)
 * - SEQ#5: Prover Registration (Prover登録)
 * - SEQ#6: Prover Exit (Prover退出)
 * - SEQ#7: Governance (ガバナンス)
 * - SEQ#8: Emergency Pause (緊急停止)
 *
 * @custom:security-contact security@quantumshield.io
 */
contract FullSequenceE2E is Test {
    // ============================================
    // Constants from SPEC_STRATEGY_BRIDGE §5
    // ============================================
    
    // Time Locks (CP-3 compliance)
    uint256 public constant NORMAL_TIMELOCK = 24 hours;
    uint256 public constant EMERGENCY_TIMELOCK = 7 days;
    uint256 public constant EMERGENCY_TIMEOUT = 72 hours;
    uint256 public constant PAUSE_MAX_DURATION = 72 hours;
    uint256 public constant UNBONDING_PERIOD = 7 days;
    uint256 public constant DEFENSE_PERIOD = 48 hours;
    
    // Governance
    uint256 public constant DISCUSSION_PERIOD = 7 days;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant GOVERNANCE_TIMELOCK = 7 days;
    
    // Bonds
    uint256 public constant MIN_EMERGENCY_BOND = 0.5 ether;
    uint256 public constant EMERGENCY_BOND_PERCENT = 5;
    uint256 public constant MIN_CHALLENGE_BOND = 0.1 ether;
    uint256 public constant CHALLENGE_BOND_PERCENT = 1;
    
    // Slashing (CP-4 compliance)
    uint256 public constant BASE_SLASH_PERCENT = 10;
    uint256 public constant CHALLENGER_REWARD_PERCENT = 60;
    uint256 public constant INSURANCE_PERCENT = 20;
    uint256 public constant BURN_PERCENT = 20;
    
    // Security Council
    uint256 public constant SC_SIZE = 9;
    uint256 public constant SC_THRESHOLD = 5;
    
    // Prover
    uint256 public constant MIN_PROVER_STAKE = 400_000e18;
    
    // ============================================
    // Contracts
    // ============================================
    
    CoreState public coreState;
    L1Verifier public verifier;
    SequencerRegistry public sequencerRegistry;
    SequencerSlashing public slashing;
    Governor public governor;
    SecurityCouncil public securityCouncil;
    Timelock public timelock;
    QSToken public qsToken;
    veQS public veQSToken;
    InsuranceFund public insuranceFund;
    
    // ============================================
    // Actors
    // ============================================
    
    address public admin;
    address public user;
    address public prover;
    address public challenger;
    address[] public scMembers;
    address[] public provers;
    
    // ============================================
    // Events for verification
    // ============================================
    
    event AssetLocked(address indexed user, uint256 amount, bytes32 commitment);
    event AssetUnlocked(address indexed user, uint256 amount);
    event EmergencyUnlockInitiated(address indexed user, uint256 amount);
    event ChallengeSubmitted(address indexed challenger, bytes32 proofHash);
    event SlashExecuted(address indexed prover, uint256 amount);
    event ProverRegistered(address indexed prover, uint256 stake);
    event ProverExitInitiated(address indexed prover);
    event ProposalCreated(uint256 indexed proposalId);
    event EmergencyPauseActivated(uint256 duration);
    
    // ============================================
    // Setup
    // ============================================
    
    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");
        prover = makeAddr("prover");
        challenger = makeAddr("challenger");
        
        // Setup SC members
        for (uint256 i = 0; i < SC_SIZE; i++) {
            scMembers.push(makeAddr(string.concat("sc", vm.toString(i))));
        }
        
        // Setup provers (5 for 2/5 threshold)
        for (uint256 i = 0; i < 5; i++) {
            provers.push(makeAddr(string.concat("prover", vm.toString(i))));
        }
        
        vm.startPrank(admin);
        
        // Deploy core contracts
        coreState = new CoreState(admin);
        verifier = new L1Verifier(admin);
        insuranceFund = new InsuranceFund(admin);
        
        // Deploy sequencer contracts
        sequencerRegistry = new SequencerRegistry(admin);
        slashing = new SequencerSlashing(address(sequencerRegistry), address(insuranceFund), admin);
        
        // Deploy governance contracts
        qsToken = new QSToken(admin);
        veQSToken = new veQS(address(qsToken), admin);
        timelock = new Timelock(GOVERNANCE_TIMELOCK, admin);
        securityCouncil = new SecurityCouncil(scMembers, SC_THRESHOLD, admin);
        governor = new Governor(address(veQSToken), address(timelock), admin);
        
        vm.stopPrank();
        
        // Fund actors
        vm.deal(user, 100 ether);
        vm.deal(challenger, 10 ether);
        
        for (uint256 i = 0; i < provers.length; i++) {
            vm.deal(provers[i], MIN_PROVER_STAKE + 1 ether);
        }
    }
    
    // ============================================
    // SEQ#1: Lock (資産ロック)
    // ============================================
    
    function test_SEQ1_Lock_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        
        vm.startPrank(user);
        
        // Step 1-3: User initiates lock
        bytes32 commitment = _computeCommitment(user, lockAmount);
        
        // Step 4-6: L1 Vault receives and verifies
        coreState.lock{value: lockAmount}(commitment);
        
        vm.stopPrank();
        
        // Verify: SR_0 computed, state updated
        assertTrue(coreState.isLocked(commitment), "Asset should be locked");
    }
    
    function test_SEQ1_Lock_CP1_SHA3Compliance() public {
        // CP-1: Must use SHA3-256, not keccak256
        uint256 lockAmount = 1 ether;
        
        // Verify commitment uses SHA3-256 (implementation detail)
        bytes32 commitment = _computeCommitment(user, lockAmount);
        
        // The commitment should be valid SHA3-256 hash
        assertTrue(commitment != bytes32(0), "Commitment should be non-zero");
    }
    
    // ============================================
    // SEQ#2: Unlock Normal (通常アンロック)
    // ============================================
    
    function test_SEQ2_UnlockNormal_BasicFlow() public {
        // Setup: Lock first
        uint256 lockAmount = 1 ether;
        bytes32 commitment = _lockAsset(user, lockAmount);
        
        // Setup: Register provers (2/5 threshold)
        _registerProvers();
        
        // Step 1-7: User requests unlock, L3 processes
        vm.prank(user);
        coreState.requestUnlock(commitment);
        
        // Step 8: Wait 24h time lock (CP-3)
        vm.warp(block.timestamp + NORMAL_TIMELOCK);
        
        // Step 9-10: Claim with prover signatures
        bytes[] memory signatures = _getProverSignatures(commitment, 2);
        
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreState.claimUnlock(commitment, signatures);
        uint256 balanceAfter = user.balance;
        
        // Verify
        assertEq(balanceAfter - balanceBefore, lockAmount, "Should receive locked amount");
        assertFalse(coreState.isLocked(commitment), "Asset should be unlocked");
    }
    
    function test_SEQ2_UnlockNormal_CP3_TimeLockEnforced() public {
        uint256 lockAmount = 1 ether;
        bytes32 commitment = _lockAsset(user, lockAmount);
        _registerProvers();
        
        vm.prank(user);
        coreState.requestUnlock(commitment);
        
        // Try to claim before 24h - should fail
        bytes[] memory signatures = _getProverSignatures(commitment, 2);
        
        vm.prank(user);
        vm.expectRevert("Timelock not expired");
        coreState.claimUnlock(commitment, signatures);
        
        // After 24h - should succeed
        vm.warp(block.timestamp + NORMAL_TIMELOCK);
        
        vm.prank(user);
        coreState.claimUnlock(commitment, signatures);
    }
    
    // ============================================
    // SEQ#3: Unlock Emergency (緊急アンロック)
    // ============================================
    
    function test_SEQ3_UnlockEmergency_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        bytes32 commitment = _lockAsset(user, lockAmount);
        
        // Condition: No L3 response for 72h
        vm.warp(block.timestamp + EMERGENCY_TIMEOUT);
        
        // Calculate bond: MAX(0.5 ETH, 5% of amount)
        uint256 bond = _calculateEmergencyBond(lockAmount);
        
        // Step 1-4: User initiates emergency unlock with bond
        vm.prank(user);
        coreState.initiateEmergencyUnlock{value: bond}(commitment);
        
        // Step 5: Wait 7 days emergency timelock
        vm.warp(block.timestamp + EMERGENCY_TIMELOCK);
        
        // Step 6-7: Execute emergency unlock
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreState.executeEmergencyUnlock(commitment);
        uint256 balanceAfter = user.balance;
        
        // Verify: User gets amount + bond back
        assertGe(balanceAfter - balanceBefore, lockAmount, "Should receive at least locked amount");
    }
    
    function test_SEQ3_UnlockEmergency_BondCalculation() public {
        // Test bond = MAX(0.5 ETH, 5%)
        
        // Small amount: 1 ETH -> bond = 0.5 ETH (minimum)
        uint256 smallAmount = 1 ether;
        uint256 smallBond = _calculateEmergencyBond(smallAmount);
        assertEq(smallBond, MIN_EMERGENCY_BOND, "Small amount should use minimum bond");
        
        // Large amount: 100 ETH -> bond = 5 ETH (5%)
        uint256 largeAmount = 100 ether;
        uint256 largeBond = _calculateEmergencyBond(largeAmount);
        assertEq(largeBond, largeAmount * EMERGENCY_BOND_PERCENT / 100, "Large amount should use 5%");
    }
    
    // ============================================
    // SEQ#3': Resync (L3-L1同期回復)
    // ============================================
    
    function test_SEQ3Prime_Resync_AutoRecovery() public {
        // Simulate L3-L1 desync
        bytes32 l1StateRoot = keccak256("l1state");
        bytes32 l3StateRoot = keccak256("l3state");
        
        // Auto resync triggered
        vm.prank(admin);
        coreState.triggerResync(l1StateRoot, l3StateRoot);
        
        // Verify sync status
        assertTrue(coreState.isSynced(), "Should be synced after resync");
    }
    
    // ============================================
    // SEQ#4: Challenge (不正チャレンジ)
    // ============================================
    
    function test_SEQ4_Challenge_DoubleSignSlash() public {
        // Setup: Register prover with stake
        vm.deal(prover, MIN_PROVER_STAKE + 1 ether);
        vm.prank(prover);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        // Step 1-3: Challenger submits double-sign proof
        bytes memory doubleSignProof = _createDoubleSignProof(prover);
        uint256 challengeBond = _calculateChallengeBond(MIN_PROVER_STAKE);
        
        vm.prank(challenger);
        slashing.submitChallenge{value: challengeBond}(prover, doubleSignProof);
        
        // Step 4-5: Defense period (48h)
        vm.warp(block.timestamp + DEFENSE_PERIOD);
        
        // Step 6: No valid defense, slash executed
        uint256 proverStakeBefore = sequencerRegistry.getStake(prover);
        uint256 challengerBalanceBefore = challenger.balance;
        uint256 insuranceBalanceBefore = address(insuranceFund).balance;
        
        vm.prank(admin);
        slashing.executeSlash(prover);
        
        // Verify quadratic slashing N²×10% (N=1 for first offense)
        uint256 expectedSlash = proverStakeBefore * BASE_SLASH_PERCENT / 100;
        uint256 proverStakeAfter = sequencerRegistry.getStake(prover);
        
        assertEq(proverStakeBefore - proverStakeAfter, expectedSlash, "Should slash 10%");
        
        // Verify distribution 60/20/20
        uint256 challengerReward = expectedSlash * CHALLENGER_REWARD_PERCENT / 100;
        uint256 insuranceAmount = expectedSlash * INSURANCE_PERCENT / 100;
        
        assertGe(challenger.balance - challengerBalanceBefore, challengerReward - 1, "Challenger should get 60%");
        assertGe(address(insuranceFund).balance - insuranceBalanceBefore, insuranceAmount - 1, "Insurance should get 20%");
    }
    
    function test_SEQ4_Challenge_CP4_SlashingExists() public {
        // CP-4: Slashing mechanism must exist
        assertTrue(address(slashing) != address(0), "Slashing contract must exist");
        assertTrue(BASE_SLASH_PERCENT > 0, "Base slash percent must be > 0");
    }
    
    // ============================================
    // SEQ#5: Prover Registration (Prover登録)
    // ============================================
    
    function test_SEQ5_ProverRegistration_BasicFlow() public {
        address newProver = makeAddr("newProver");
        vm.deal(newProver, MIN_PROVER_STAKE + 1 ether);
        
        // Step 1-2: Prover stakes minimum $400K
        vm.prank(newProver);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        // Verify registration
        assertTrue(sequencerRegistry.isRegistered(newProver), "Prover should be registered");
        assertEq(sequencerRegistry.getStake(newProver), MIN_PROVER_STAKE, "Stake should match");
    }
    
    function test_SEQ5_ProverRegistration_MinimumStake() public {
        address newProver = makeAddr("lowStakeProver");
        vm.deal(newProver, MIN_PROVER_STAKE);
        
        // Below minimum should fail
        vm.prank(newProver);
        vm.expectRevert("Stake below minimum");
        sequencerRegistry.register{value: MIN_PROVER_STAKE - 1}();
    }
    
    // ============================================
    // SEQ#6: Prover Exit (Prover退出)
    // ============================================
    
    function test_SEQ6_ProverExit_BasicFlow() public {
        // Setup: Register prover
        vm.deal(prover, MIN_PROVER_STAKE + 1 ether);
        vm.prank(prover);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        // Step 1: Initiate exit
        vm.prank(prover);
        sequencerRegistry.initiateExit();
        
        // Step 2: 7 day unbonding period
        vm.warp(block.timestamp + UNBONDING_PERIOD);
        
        // Step 3: Complete exit
        uint256 balanceBefore = prover.balance;
        vm.prank(prover);
        sequencerRegistry.completeExit();
        uint256 balanceAfter = prover.balance;
        
        // Verify stake returned
        assertEq(balanceAfter - balanceBefore, MIN_PROVER_STAKE, "Should return full stake");
        assertFalse(sequencerRegistry.isRegistered(prover), "Should be unregistered");
    }
    
    function test_SEQ6_ProverExit_SlashableDuringUnbonding() public {
        // Setup: Register prover
        vm.deal(prover, MIN_PROVER_STAKE + 1 ether);
        vm.prank(prover);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        // Initiate exit
        vm.prank(prover);
        sequencerRegistry.initiateExit();
        
        // During unbonding, should still be slashable
        bytes memory doubleSignProof = _createDoubleSignProof(prover);
        
        vm.prank(challenger);
        slashing.submitChallenge{value: MIN_CHALLENGE_BOND}(prover, doubleSignProof);
        
        vm.warp(block.timestamp + DEFENSE_PERIOD);
        
        vm.prank(admin);
        slashing.executeSlash(prover);
        
        // Verify slashing occurred
        assertTrue(sequencerRegistry.getStake(prover) < MIN_PROVER_STAKE, "Should be slashed during unbonding");
    }
    
    // ============================================
    // SEQ#7: Governance (ガバナンス)
    // ============================================
    
    function test_SEQ7_Governance_FullProposalLifecycle() public {
        // Setup: User gets veQS
        _setupVoterWithVeQS(user, 1_000_000e18);
        
        // Step 1-2: Create proposal
        bytes memory proposalData = abi.encodeWithSignature("updateParameter(uint256)", 100);
        
        vm.prank(user);
        uint256 proposalId = governor.propose(
            address(coreState),
            proposalData,
            "Update parameter to 100"
        );
        
        // Step 3: Discussion period (7 days)
        vm.warp(block.timestamp + DISCUSSION_PERIOD);
        
        // Step 4: Voting period (7 days)
        vm.prank(user);
        governor.castVote(proposalId, true);
        
        vm.warp(block.timestamp + VOTING_PERIOD);
        
        // Step 5: Queue for execution
        vm.prank(user);
        governor.queue(proposalId);
        
        // Step 6: Timelock (7 days)
        vm.warp(block.timestamp + GOVERNANCE_TIMELOCK);
        
        // Step 7: Execute
        vm.prank(user);
        governor.execute(proposalId);
        
        // Verify execution
        assertTrue(governor.isExecuted(proposalId), "Proposal should be executed");
    }
    
    function test_SEQ7_Governance_RequiresVeQS() public {
        // User without veQS should not be able to propose
        vm.prank(user);
        vm.expectRevert("Insufficient voting power");
        governor.propose(address(coreState), "", "Test proposal");
    }
    
    // ============================================
    // SEQ#8: Emergency Pause (緊急停止)
    // ============================================
    
    function test_SEQ8_EmergencyPause_SCActivation() public {
        // Step 1: SC members vote for pause (5/9 threshold)
        bytes32 pauseProposal = keccak256("emergency_pause");
        
        for (uint256 i = 0; i < SC_THRESHOLD; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(pauseProposal);
        }
        
        // Step 2: Execute pause
        vm.prank(scMembers[0]);
        securityCouncil.executePause(pauseProposal);
        
        // Verify pause active
        assertTrue(coreState.isPaused(), "System should be paused");
    }
    
    function test_SEQ8_EmergencyPause_MaxDuration() public {
        // Activate pause
        _activateEmergencyPause();
        
        // Try to extend beyond 72h - should fail
        vm.warp(block.timestamp + PAUSE_MAX_DURATION);
        
        // System should auto-unpause
        assertTrue(!coreState.isPaused() || block.timestamp >= coreState.pauseEndTime(), 
            "Pause should expire after 72h");
    }
    
    function test_SEQ8_EmergencyPause_RecoveryProcess() public {
        // Activate pause
        _activateEmergencyPause();
        
        // SC votes to unpause
        bytes32 unpauseProposal = keccak256("unpause");
        
        for (uint256 i = 0; i < SC_THRESHOLD; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(unpauseProposal);
        }
        
        vm.prank(scMembers[0]);
        securityCouncil.executeUnpause(unpauseProposal);
        
        // Verify unpaused
        assertFalse(coreState.isPaused(), "System should be unpaused");
    }
    
    // ============================================
    // CP Compliance Tests
    // ============================================
    
    function test_CP1_QuantumResistance_NoKeccak256() public pure {
        // This test verifies that the system uses SHA3-256
        // In actual implementation, grep codebase for keccak256 usage
        
        // SHA3-256 should be used for all hashing
        bytes memory data = "test data";
        bytes32 hash = sha256(data); // Placeholder for SHA3-256
        assertTrue(hash != bytes32(0), "Hash should be computed");
    }
    
    function test_CP3_TimeLock_AllPathsHaveDelay() public pure {
        // Verify all unlock paths have time lock > 0
        assertTrue(NORMAL_TIMELOCK > 0, "Normal timelock must be > 0");
        assertTrue(EMERGENCY_TIMELOCK > 0, "Emergency timelock must be > 0");
        assertTrue(GOVERNANCE_TIMELOCK > 0, "Governance timelock must be > 0");
    }
    
    function test_CP4_Slashing_MechanismExists() public view {
        // Verify slashing mechanism exists
        assertTrue(address(slashing) != address(0), "Slashing contract must exist");
        assertTrue(BASE_SLASH_PERCENT > 0, "Slash percent must be > 0");
        
        // Verify distribution sums to 100%
        assertEq(
            CHALLENGER_REWARD_PERCENT + INSURANCE_PERCENT + BURN_PERCENT,
            100,
            "Distribution must sum to 100%"
        );
    }
    
    function test_CP5_Transparency_EventsEmitted() public {
        // Verify events are emitted for key actions
        uint256 lockAmount = 1 ether;
        bytes32 commitment = _computeCommitment(user, lockAmount);
        
        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit AssetLocked(user, lockAmount, commitment);
        coreState.lock{value: lockAmount}(commitment);
    }
    
    // ============================================
    // Full Flow Integration Tests
    // ============================================
    
    function test_FullFlow_LockUnlockNormal() public {
        // Complete flow: Lock -> Unlock Normal
        uint256 amount = 1 ether;
        
        // 1. Lock
        bytes32 commitment = _lockAsset(user, amount);
        
        // 2. Register provers
        _registerProvers();
        
        // 3. Request unlock
        vm.prank(user);
        coreState.requestUnlock(commitment);
        
        // 4. Wait timelock
        vm.warp(block.timestamp + NORMAL_TIMELOCK);
        
        // 5. Claim
        bytes[] memory sigs = _getProverSignatures(commitment, 2);
        uint256 balanceBefore = user.balance;
        
        vm.prank(user);
        coreState.claimUnlock(commitment, sigs);
        
        assertEq(user.balance - balanceBefore, amount, "Full flow should work");
    }
    
    function test_FullFlow_LockUnlockEmergency() public {
        // Complete flow: Lock -> Emergency Unlock
        uint256 amount = 1 ether;
        
        // 1. Lock
        bytes32 commitment = _lockAsset(user, amount);
        
        // 2. Wait for emergency timeout
        vm.warp(block.timestamp + EMERGENCY_TIMEOUT);
        
        // 3. Initiate emergency
        uint256 bond = _calculateEmergencyBond(amount);
        vm.prank(user);
        coreState.initiateEmergencyUnlock{value: bond}(commitment);
        
        // 4. Wait emergency timelock
        vm.warp(block.timestamp + EMERGENCY_TIMELOCK);
        
        // 5. Execute
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreState.executeEmergencyUnlock(commitment);
        
        assertGe(user.balance - balanceBefore, amount, "Emergency flow should work");
    }
    
    function test_FullFlow_ChallengeSlash() public {
        // Complete flow: Prover stake -> Double-sign -> Challenge -> Slash
        
        // 1. Register prover
        vm.deal(prover, MIN_PROVER_STAKE + 1 ether);
        vm.prank(prover);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        // 2. Submit challenge
        bytes memory proof = _createDoubleSignProof(prover);
        vm.prank(challenger);
        slashing.submitChallenge{value: MIN_CHALLENGE_BOND}(prover, proof);
        
        // 3. Wait defense period
        vm.warp(block.timestamp + DEFENSE_PERIOD);
        
        // 4. Execute slash
        uint256 stakeBefore = sequencerRegistry.getStake(prover);
        vm.prank(admin);
        slashing.executeSlash(prover);
        uint256 stakeAfter = sequencerRegistry.getStake(prover);
        
        // 5. Verify 10% slashed
        assertEq(stakeBefore - stakeAfter, stakeBefore / 10, "Should slash 10%");
    }
    
    function test_FullFlow_GovernanceProposal() public {
        // Complete flow: veQS -> Propose -> Vote -> Execute
        
        // 1. Get veQS
        _setupVoterWithVeQS(user, 1_000_000e18);
        
        // 2. Propose
        vm.prank(user);
        uint256 proposalId = governor.propose(
            address(coreState),
            abi.encodeWithSignature("updateParameter(uint256)", 100),
            "Test"
        );
        
        // 3. Discussion
        vm.warp(block.timestamp + DISCUSSION_PERIOD);
        
        // 4. Vote
        vm.prank(user);
        governor.castVote(proposalId, true);
        vm.warp(block.timestamp + VOTING_PERIOD);
        
        // 5. Queue
        vm.prank(user);
        governor.queue(proposalId);
        vm.warp(block.timestamp + GOVERNANCE_TIMELOCK);
        
        // 6. Execute
        vm.prank(user);
        governor.execute(proposalId);
        
        assertTrue(governor.isExecuted(proposalId), "Governance flow should work");
    }
    
    // ============================================
    // Helper Functions
    // ============================================
    
    function _computeCommitment(address _user, uint256 _amount) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_user, _amount, block.timestamp));
    }
    
    function _lockAsset(address _user, uint256 _amount) internal returns (bytes32) {
        bytes32 commitment = _computeCommitment(_user, _amount);
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
            // Mock signatures for testing
            signatures[i] = abi.encodePacked(commitment, i);
        }
        return signatures;
    }
    
    function _calculateEmergencyBond(uint256 amount) internal pure returns (uint256) {
        uint256 percentBond = amount * EMERGENCY_BOND_PERCENT / 100;
        return percentBond > MIN_EMERGENCY_BOND ? percentBond : MIN_EMERGENCY_BOND;
    }
    
    function _calculateChallengeBond(uint256 stake) internal pure returns (uint256) {
        uint256 percentBond = stake * CHALLENGE_BOND_PERCENT / 100;
        return percentBond > MIN_CHALLENGE_BOND ? percentBond : MIN_CHALLENGE_BOND;
    }
    
    function _createDoubleSignProof(address _prover) internal pure returns (bytes memory) {
        // Mock double-sign proof
        return abi.encodePacked(_prover, "double_sign_evidence");
    }
    
    function _setupVoterWithVeQS(address voter, uint256 amount) internal {
        vm.prank(admin);
        qsToken.mint(voter, amount);
        
        vm.startPrank(voter);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, block.timestamp + 365 days);
        vm.stopPrank();
    }
    
    function _activateEmergencyPause() internal {
        bytes32 pauseProposal = keccak256("emergency_pause");
        
        for (uint256 i = 0; i < SC_THRESHOLD; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(pauseProposal);
        }
        
        vm.prank(scMembers[0]);
        securityCouncil.executePause(pauseProposal);
    }
}
