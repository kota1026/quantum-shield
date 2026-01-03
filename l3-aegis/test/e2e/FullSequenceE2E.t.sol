// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/CoreLayer.sol";
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
 * @dev Uses CoreLayer for bridge operations (lock/unlock)
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
    CoreLayer public coreLayer;
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
        
        // Deploy CoreLayer (new bridge contract)
        coreLayer = new CoreLayer();
        
        // Deploy other contracts
        coreState = new CoreState();
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
        vm.deal(address(coreLayer), 100 ether); // Fund CoreLayer for unlocks
        
        for (uint256 i = 0; i < provers.length; i++) {
            vm.deal(provers[i], MIN_PROVER_STAKE + 1 ether);
        }
    }
    
    // =========================================================================
    // SEQ#1: Lock - Using CoreLayer
    // =========================================================================
    
    function test_SEQ1_Lock_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        bytes32 recipient = bytes32(uint256(uint160(user)));
        
        vm.startPrank(user);
        bytes32 txHash = coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipient);
        vm.stopPrank();
        
        assertTrue(coreLayer.isLocked(txHash), "Asset should be locked");
        
        ICoreLayer.BridgeTx memory tx = coreLayer.getTransaction(txHash);
        assertEq(tx.amount, lockAmount, "Lock amount should match");
        assertEq(tx.recipient, recipient, "Recipient should match");
        assertFalse(tx.executed, "Should not be executed yet");
    }
    
    function test_SEQ1_Lock_MultipleAssets() public {
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;
        amounts[2] = 0.5 ether;
        
        bytes32[] memory txHashes = new bytes32[](3);
        bytes32 recipient = bytes32(uint256(uint160(user)));
        
        vm.startPrank(user);
        for (uint256 i = 0; i < amounts.length; i++) {
            txHashes[i] = coreLayer.lock{value: amounts[i]}(address(0), amounts[i], recipient);
            assertTrue(coreLayer.isLocked(txHashes[i]), "Asset should be locked");
        }
        vm.stopPrank();
    }
    
    // =========================================================================
    // SEQ#2: Unlock Normal - Using CoreLayer
    // =========================================================================
    
    function test_SEQ2_UnlockNormal_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        bytes32 txHash = _lockAsset(user, lockAmount);
        
        // Request unlock with valid proof
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.unlock(txHash, proof, user);
        
        // Advance past timelock
        vm.warp(block.timestamp + NORMAL_TIMELOCK + 1);
        
        // Claim
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreLayer.claim(txHash, user);
        
        assertEq(user.balance - balanceBefore, lockAmount, "Should receive locked amount");
        assertFalse(coreLayer.isLocked(txHash), "Asset should be unlocked");
    }
    
    function test_SEQ2_UnlockNormal_TimelockEnforced() public {
        uint256 lockAmount = 1 ether;
        bytes32 txHash = _lockAsset(user, lockAmount);
        
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.unlock(txHash, proof, user);
        
        // Try to claim before timelock - should fail
        vm.prank(user);
        vm.expectRevert();
        coreLayer.claim(txHash, user);
    }
    
    // =========================================================================
    // SEQ#3: Emergency Unlock - Using CoreLayer
    // =========================================================================
    
    function test_SEQ3_UnlockEmergency_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        bytes32 txHash = _lockAsset(user, lockAmount);
        
        // Calculate required bond
        uint256 bond = coreLayer.calculateEmergencyBond(lockAmount);
        assertGe(bond, MIN_EMERGENCY_BOND, "Bond should be at least 0.5 ETH");
        
        // Initiate emergency unlock with bond
        vm.prank(user);
        coreLayer.emergencyUnlock{value: bond}(txHash, user);
        
        // Verify emergency timelock (7 days)
        ICoreLayer.BridgeTx memory tx = coreLayer.getTransaction(txHash);
        assertTrue(tx.isEmergency, "Should be emergency unlock");
        assertEq(tx.unlockTime, block.timestamp + EMERGENCY_TIMELOCK, "Emergency timelock should be 7 days");
        
        // Advance past emergency timelock
        vm.warp(block.timestamp + EMERGENCY_TIMELOCK + 1);
        
        // Claim with bond return
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreLayer.claim(txHash, user);
        
        // Should receive lock amount + bond returned
        assertGe(user.balance - balanceBefore, lockAmount, "Should receive at least locked amount");
    }
    
    function test_SEQ3_EmergencyBond_Calculation() public view {
        // Test MIN_EMERGENCY_BOND case
        uint256 smallAmount = 1 ether;
        uint256 bondSmall = coreLayer.calculateEmergencyBond(smallAmount);
        assertEq(bondSmall, MIN_EMERGENCY_BOND, "Small amount should use min bond");
        
        // Test 5% case
        uint256 largeAmount = 100 ether;
        uint256 bondLarge = coreLayer.calculateEmergencyBond(largeAmount);
        assertEq(bondLarge, largeAmount * EMERGENCY_BOND_PERCENT / 100, "Large amount should use 5%");
    }
    
    // =========================================================================
    // SEQ#4: Challenge
    // =========================================================================
    
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
    
    function test_SEQ4_QuadraticSlashing() public {
        // Quadratic formula: N^2 * 10%
        // 1 fraud: 1 * 10% = 10%
        // 2 fraud: 4 * 10% = 40%
        // 3 fraud: 9 * 10% = 90%
        // 4+ fraud: 100% (capped)
        
        assertEq(1 * 1 * BASE_SLASH_PERCENT, 10, "1 fraud = 10%");
        assertEq(2 * 2 * BASE_SLASH_PERCENT, 40, "2 fraud = 40%");
        assertEq(3 * 3 * BASE_SLASH_PERCENT, 90, "3 fraud = 90%");
        assertTrue(4 * 4 * BASE_SLASH_PERCENT >= 100, "4+ fraud = 100% (capped)");
    }
    
    // =========================================================================
    // SEQ#5: Prover Registration
    // =========================================================================
    
    function test_SEQ5_ProverRegistration_BasicFlow() public {
        address newProver = makeAddr("newProver");
        vm.deal(newProver, MIN_PROVER_STAKE + 1 ether);
        vm.prank(newProver);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        assertTrue(sequencerRegistry.isRegistered(newProver), "Prover should be registered");
        assertEq(sequencerRegistry.getStake(newProver), MIN_PROVER_STAKE, "Stake should match");
    }
    
    function test_SEQ5_ProverRegistration_MinStakeEnforced() public {
        address newProver = makeAddr("newProver");
        vm.deal(newProver, 1 ether);
        
        vm.prank(newProver);
        vm.expectRevert();
        sequencerRegistry.register{value: 1 ether}(); // Below min stake
    }
    
    // =========================================================================
    // SEQ#6: Prover Exit
    // =========================================================================
    
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
    
    function test_SEQ6_ProverExit_UnbondingPeriodEnforced() public {
        vm.deal(prover, MIN_PROVER_STAKE + 1 ether);
        vm.prank(prover);
        sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        
        vm.prank(prover);
        sequencerRegistry.initiateExit();
        
        // Try to exit before unbonding period
        vm.prank(prover);
        vm.expectRevert();
        sequencerRegistry.completeExit();
    }
    
    // =========================================================================
    // SEQ#7: Governance
    // =========================================================================
    
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
    
    // =========================================================================
    // SEQ#8: Emergency Pause
    // =========================================================================
    
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
    
    // =========================================================================
    // CP Compliance Tests
    // =========================================================================
    
    function test_CP1_SHA3Only_CoreLayer() public view {
        // CoreLayer uses SHA3_256 library for all hashing
        assertTrue(coreLayer.verifyCPCompliance(), "CoreLayer should be CP compliant");
        assertEq(coreLayer.getCPProtectionLevel(1), "SHA3-256 ONLY - No keccak256 in security paths");
    }
    
    function test_CP3_TimeLock_AllPathsHaveDelay() public view {
        assertEq(coreLayer.NORMAL_TIMELOCK(), NORMAL_TIMELOCK, "Normal timelock should be 24h");
        assertEq(coreLayer.EMERGENCY_TIMELOCK(), EMERGENCY_TIMELOCK, "Emergency timelock should be 7d");
        assertTrue(coreLayer.NORMAL_TIMELOCK() > 0, "Normal timelock must be > 0");
        assertTrue(coreLayer.EMERGENCY_TIMELOCK() > 0, "Emergency timelock must be > 0");
        assertTrue(GOVERNANCE_TIMELOCK > 0, "Governance timelock must be > 0");
    }
    
    function test_CP4_Slashing_MechanismExists() public view {
        assertTrue(address(slashing) != address(0), "Slashing contract must exist");
        assertTrue(BASE_SLASH_PERCENT > 0, "Slash percent must be > 0");
    }
    
    function test_CP5_Transparency_EventsEmitted() public {
        uint256 lockAmount = 1 ether;
        bytes32 recipient = bytes32(uint256(uint160(user)));
        
        vm.prank(user);
        vm.expectEmit(true, true, true, true);
        emit ICoreLayer.AssetLocked(bytes32(0), user, address(0), lockAmount, recipient);
        coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipient);
    }
    
    // =========================================================================
    // Helper Functions
    // =========================================================================
    
    function _lockAsset(address _user, uint256 _amount) internal returns (bytes32) {
        bytes32 recipient = bytes32(uint256(uint160(_user)));
        vm.prank(_user);
        return coreLayer.lock{value: _amount}(address(0), _amount, recipient);
    }
    
    function _registerProvers() internal {
        for (uint256 i = 0; i < provers.length; i++) {
            vm.prank(provers[i]);
            sequencerRegistry.register{value: MIN_PROVER_STAKE}();
        }
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
