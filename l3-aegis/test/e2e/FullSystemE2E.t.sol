// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/CoreState.sol";
import "../../src/core/L1Verifier.sol";
import "../../src/sequencer/SequencerRegistry.sol";
import "../../src/sequencer/SequencerSlashing.sol";
import "../../src/sequencer/SequencerRotation.sol";
import "../../src/governance/Governor.sol";
import "../../src/governance/SecurityCouncil.sol";
import "../../src/governance/GovernanceSwitch.sol";
import "../../src/token/QSToken.sol";
import "../../src/token/veQS.sol";
import "../../src/treasury/InsuranceFund.sol";
import "../../src/treasury/Treasury.sol";

/**
 * @title FullSystemE2E
 * @notice Full system E2E tests (L1 + L3 + Token + Governance)
 * @dev Implements TEST-010 from Phase 3.3 Track B
 *
 * Tests complete system integration including:
 * - L1 Vault + L3 Sequencer coordination
 * - Token economics (QS, veQS)
 * - Full governance lifecycle
 * - Treasury operations
 */
contract FullSystemE2E is Test {
    // ============================================
    // System Components
    // ============================================
    
    // Core
    CoreState public coreState;
    L1Verifier public verifier;
    
    // Sequencer
    SequencerRegistry public seqRegistry;
    SequencerSlashing public seqSlashing;
    SequencerRotation public seqRotation;
    
    // Governance
    Governor public governor;
    SecurityCouncil public securityCouncil;
    GovernanceSwitch public govSwitch;
    
    // Token
    QSToken public qsToken;
    veQS public veQSToken;
    
    // Treasury
    InsuranceFund public insuranceFund;
    Treasury public treasury;
    
    // ============================================
    // Actors
    // ============================================
    
    address public admin;
    address[] public sequencers;
    address[] public scMembers;
    address[] public voters;
    address public user;
    address public challenger;
    
    // ============================================
    // Constants
    // ============================================
    
    uint256 public constant MIN_PROVER_STAKE = 400_000e18;
    uint256 public constant NORMAL_TIMELOCK = 24 hours;
    uint256 public constant GOVERNANCE_TIMELOCK = 7 days;
    
    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");
        challenger = makeAddr("challenger");
        
        // Setup sequencers (4 for BFT)
        for (uint256 i = 0; i < 4; i++) {
            sequencers.push(makeAddr(string.concat("seq", vm.toString(i))));
            vm.deal(sequencers[i], MIN_PROVER_STAKE + 1 ether);
        }
        
        // Setup SC members (9)
        for (uint256 i = 0; i < 9; i++) {
            scMembers.push(makeAddr(string.concat("sc", vm.toString(i))));
        }
        
        // Setup voters (20)
        for (uint256 i = 0; i < 20; i++) {
            voters.push(makeAddr(string.concat("voter", vm.toString(i))));
        }
        
        vm.deal(user, 100 ether);
        vm.deal(challenger, 10 ether);
        
        _deploySystem();
    }
    
    function _deploySystem() internal {
        vm.startPrank(admin);
        
        // Deploy token contracts
        qsToken = new QSToken(admin);
        veQSToken = new veQS(address(qsToken), admin);
        
        // Deploy treasury
        insuranceFund = new InsuranceFund(admin);
        treasury = new Treasury(admin);
        
        // Deploy core contracts
        coreState = new CoreState(admin);
        verifier = new L1Verifier(admin);
        
        // Deploy sequencer contracts
        seqRegistry = new SequencerRegistry(admin);
        seqSlashing = new SequencerSlashing(address(seqRegistry), address(insuranceFund), admin);
        seqRotation = new SequencerRotation(address(seqRegistry), admin);
        
        // Deploy governance
        securityCouncil = new SecurityCouncil(scMembers, 5, admin);
        governor = new Governor(address(veQSToken), address(treasury), admin);
        
        address[] memory multisigSigners = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            multisigSigners[i] = scMembers[i];
        }
        govSwitch = new GovernanceSwitch(admin, multisigSigners, address(governor), address(securityCouncil));
        
        // Mint tokens to voters
        for (uint256 i = 0; i < voters.length; i++) {
            qsToken.mint(voters[i], 5_000_000e18);
        }
        
        vm.stopPrank();
        
        // Register sequencers
        for (uint256 i = 0; i < sequencers.length; i++) {
            vm.prank(sequencers[i]);
            seqRegistry.register{value: MIN_PROVER_STAKE}();
        }
        
        // Voters create veQS locks
        for (uint256 i = 0; i < voters.length; i++) {
            vm.startPrank(voters[i]);
            qsToken.approve(address(veQSToken), type(uint256).max);
            veQSToken.createLock(5_000_000e18, block.timestamp + 365 days);
            vm.stopPrank();
        }
    }
    
    // ============================================
    // Full Flow: Lock -> Unlock -> Claim
    // ============================================
    
    function test_FullFlow_LockUnlockClaim() public {
        uint256 lockAmount = 1 ether;
        
        // 1. User locks assets
        bytes32 commitment = keccak256(abi.encodePacked(user, lockAmount, block.timestamp));
        vm.prank(user);
        coreState.lock{value: lockAmount}(commitment);
        
        assertTrue(coreState.isLocked(commitment), "Asset should be locked");
        
        // 2. User requests unlock
        vm.prank(user);
        coreState.requestUnlock(commitment);
        
        // 3. Wait timelock
        vm.warp(block.timestamp + NORMAL_TIMELOCK);
        
        // 4. Get prover signatures (simulated)
        bytes[] memory signatures = new bytes[](2);
        signatures[0] = abi.encodePacked(commitment, uint256(0));
        signatures[1] = abi.encodePacked(commitment, uint256(1));
        
        // 5. Claim
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreState.claimUnlock(commitment, signatures);
        
        assertEq(user.balance - balanceBefore, lockAmount, "Should receive locked amount");
    }
    
    // ============================================
    // Full Flow: Governance Proposal
    // ============================================
    
    function test_FullFlow_GovernanceProposal() public {
        // 1. Create proposal
        vm.prank(voters[0]);
        uint256 proposalId = governor.propose(
            address(coreState),
            abi.encodeWithSignature("updateParameter(uint256)", 100),
            "Update system parameter"
        );
        
        // 2. Discussion period (7 days)
        vm.warp(block.timestamp + 7 days);
        
        // 3. Voting period - majority votes yes
        for (uint256 i = 0; i < 15; i++) {
            vm.prank(voters[i]);
            governor.castVote(proposalId, true);
        }
        
        vm.warp(block.timestamp + 7 days);
        
        // 4. Queue
        vm.prank(voters[0]);
        governor.queue(proposalId);
        
        // 5. Timelock
        vm.warp(block.timestamp + GOVERNANCE_TIMELOCK);
        
        // 6. Execute
        vm.prank(voters[0]);
        governor.execute(proposalId);
        
        assertTrue(governor.isExecuted(proposalId), "Proposal should be executed");
    }
    
    // ============================================
    // Full Flow: Challenge and Slash
    // ============================================
    
    function test_FullFlow_ChallengeSlash() public {
        address maliciousSeq = sequencers[0];
        
        // 1. Submit challenge
        bytes memory proof = abi.encodePacked(maliciousSeq, "double_sign");
        vm.prank(challenger);
        seqSlashing.submitChallenge{value: 0.1 ether}(maliciousSeq, proof);
        
        // 2. Wait defense period
        vm.warp(block.timestamp + 48 hours);
        
        // 3. Execute slash
        uint256 stakeBefore = seqRegistry.getStake(maliciousSeq);
        uint256 insuranceBefore = address(insuranceFund).balance;
        
        vm.prank(admin);
        seqSlashing.executeSlash(maliciousSeq);
        
        uint256 stakeAfter = seqRegistry.getStake(maliciousSeq);
        uint256 slashAmount = stakeBefore - stakeAfter;
        
        // 4. Verify 10% slashed
        assertEq(slashAmount, stakeBefore / 10, "Should slash 10%");
        
        // 5. Verify insurance got 20%
        uint256 insuranceAfter = address(insuranceFund).balance;
        assertGe(insuranceAfter - insuranceBefore, slashAmount * 20 / 100 - 1, "Insurance should get 20%");
    }
    
    // ============================================
    // Full Flow: Emergency Pause
    // ============================================
    
    function test_FullFlow_EmergencyPause() public {
        // 1. SC votes for pause (5/9)
        bytes32 pauseHash = keccak256("emergency_pause");
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(pauseHash);
        }
        
        // 2. Execute pause
        vm.prank(scMembers[0]);
        securityCouncil.executePause(pauseHash);
        
        assertTrue(coreState.isPaused(), "System should be paused");
        
        // 3. Operations should be blocked
        vm.prank(user);
        vm.expectRevert("System paused");
        coreState.lock{value: 1 ether}(keccak256("test"));
        
        // 4. SC unpause
        bytes32 unpauseHash = keccak256("unpause");
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(unpauseHash);
        }
        vm.prank(scMembers[0]);
        securityCouncil.executeUnpause(unpauseHash);
        
        assertFalse(coreState.isPaused(), "System should be unpaused");
    }
    
    // ============================================
    // Full Flow: Sequencer Rotation
    // ============================================
    
    function test_FullFlow_SequencerRotation() public {
        // 1. Initial leader
        address leader = seqRotation.currentLeader();
        assertEq(leader, sequencers[0], "First sequencer should be leader");
        
        // 2. Produce blocks
        for (uint256 i = 0; i < 10; i++) {
            bytes32 blockHash = keccak256(abi.encodePacked("block", i));
            
            // Get quorum (3/4)
            for (uint256 j = 0; j < 3; j++) {
                vm.prank(sequencers[j]);
                seqRotation.signBlock(blockHash);
            }
            
            assertTrue(seqRotation.isBlockFinalized(blockHash), "Block should be finalized");
        }
        
        // 3. Rotation
        vm.warp(block.timestamp + 10 seconds);
        seqRotation.rotate();
        
        assertEq(seqRotation.currentLeader(), sequencers[1], "Should rotate to next sequencer");
    }
    
    // ============================================
    // Full Flow: veQS Lifecycle
    // ============================================
    
    function test_FullFlow_VeQSLifecycle() public {
        address newVoter = makeAddr("newVoter");
        uint256 lockAmount = 1_000_000e18;
        
        // 1. Get QS tokens
        vm.prank(admin);
        qsToken.mint(newVoter, lockAmount);
        
        // 2. Create veQS lock
        vm.startPrank(newVoter);
        qsToken.approve(address(veQSToken), lockAmount);
        veQSToken.createLock(lockAmount, block.timestamp + 365 days);
        vm.stopPrank();
        
        uint256 votingPower = veQSToken.balanceOf(newVoter);
        assertTrue(votingPower > 0, "Should have voting power");
        
        // 3. Use voting power in governance
        vm.prank(newVoter);
        uint256 proposalId = governor.propose(
            address(coreState),
            abi.encodeWithSignature("test()"),
            "Test"
        );
        
        assertTrue(proposalId > 0, "Should create proposal");
        
        // 4. Wait and unlock
        vm.warp(block.timestamp + 366 days);
        
        uint256 balanceBefore = qsToken.balanceOf(newVoter);
        vm.prank(newVoter);
        veQSToken.withdraw();
        uint256 balanceAfter = qsToken.balanceOf(newVoter);
        
        assertEq(balanceAfter - balanceBefore, lockAmount, "Should recover QS tokens");
    }
    
    // ============================================
    // Full Flow: Treasury Operations
    // ============================================
    
    function test_FullFlow_TreasuryOperations() public {
        // 1. Fund treasury
        vm.deal(address(treasury), 100 ether);
        
        // 2. Create spending proposal
        vm.prank(voters[0]);
        uint256 proposalId = governor.propose(
            address(treasury),
            abi.encodeWithSignature("withdraw(address,uint256)", voters[0], 1 ether),
            "Treasury spending"
        );
        
        // 3. Pass through governance
        vm.warp(block.timestamp + 7 days);
        
        for (uint256 i = 0; i < 15; i++) {
            vm.prank(voters[i]);
            governor.castVote(proposalId, true);
        }
        
        vm.warp(block.timestamp + 7 days);
        
        vm.prank(voters[0]);
        governor.queue(proposalId);
        
        vm.warp(block.timestamp + GOVERNANCE_TIMELOCK);
        
        // 4. Execute
        uint256 treasuryBefore = address(treasury).balance;
        vm.prank(voters[0]);
        governor.execute(proposalId);
        
        assertEq(treasuryBefore - address(treasury).balance, 1 ether, "Treasury should transfer funds");
    }
    
    // ============================================
    // System State Verification
    // ============================================
    
    function test_SystemState_AllComponentsDeployed() public view {
        assertTrue(address(coreState) != address(0), "CoreState deployed");
        assertTrue(address(verifier) != address(0), "Verifier deployed");
        assertTrue(address(seqRegistry) != address(0), "SeqRegistry deployed");
        assertTrue(address(seqSlashing) != address(0), "Slashing deployed");
        assertTrue(address(seqRotation) != address(0), "Rotation deployed");
        assertTrue(address(governor) != address(0), "Governor deployed");
        assertTrue(address(securityCouncil) != address(0), "SC deployed");
        assertTrue(address(qsToken) != address(0), "QS deployed");
        assertTrue(address(veQSToken) != address(0), "veQS deployed");
        assertTrue(address(insuranceFund) != address(0), "Insurance deployed");
        assertTrue(address(treasury) != address(0), "Treasury deployed");
    }
    
    function test_SystemState_SequencerSetup() public view {
        assertEq(seqRegistry.activeCount(), 4, "Should have 4 sequencers");
        
        for (uint256 i = 0; i < sequencers.length; i++) {
            assertTrue(seqRegistry.isRegistered(sequencers[i]), "Sequencer registered");
            assertTrue(seqRegistry.isActive(sequencers[i]), "Sequencer active");
        }
    }
    
    function test_SystemState_GovernanceSetup() public view {
        assertEq(securityCouncil.memberCount(), 9, "Should have 9 SC members");
        assertEq(securityCouncil.threshold(), 5, "SC threshold should be 5");
    }
    
    function test_SystemState_TokenSetup() public view {
        uint256 totalVeQS = 0;
        for (uint256 i = 0; i < voters.length; i++) {
            totalVeQS += veQSToken.balanceOf(voters[i]);
        }
        assertTrue(totalVeQS > 0, "Should have veQS participation");
    }
}
