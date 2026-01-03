// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/CoreState.sol";
import "../../src/sequencer/SequencerRegistry.sol";
import "../../src/sequencer/SequencerSlashing.sol";
import "../../src/sequencer/SequencerRotation.sol";
import "../../src/governance/Governor.sol";
import "../../src/governance/SecurityCouncil.sol";
import "../../src/governance/GovernanceSwitch.sol";
import "../../src/token/QSToken.sol";
import "../../src/token/veQS.sol";
import "../../src/treasury/Treasury.sol";

/**
 * @title FullSystemE2E
 * @notice Full system E2E tests (L1 + L3 + Token + Governance)
 * @dev Implements TEST-010 from Phase 3.3 Track B
 */
contract FullSystemE2E is Test {
    // Core
    CoreState public coreState;
    
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
    Treasury public treasury;
    
    // Actors
    address public admin;
    address[] public sequencers;
    address[] public scMembers;
    address[] public voters;
    address public user;
    address public challenger;
    
    // Constants
    uint256 public constant MIN_PROVER_STAKE = 400_000e18;
    uint256 public constant NORMAL_TIMELOCK = 24 hours;
    uint256 public constant GOVERNANCE_TIMELOCK = 7 days;
    
    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");
        challenger = makeAddr("challenger");
        
        for (uint256 i = 0; i < 4; i++) {
            sequencers.push(makeAddr(string.concat("seq", vm.toString(i))));
            vm.deal(sequencers[i], MIN_PROVER_STAKE + 1 ether);
        }
        
        for (uint256 i = 0; i < 9; i++) {
            scMembers.push(makeAddr(string.concat("sc", vm.toString(i))));
        }
        
        for (uint256 i = 0; i < 20; i++) {
            voters.push(makeAddr(string.concat("voter", vm.toString(i))));
        }
        
        vm.deal(user, 100 ether);
        vm.deal(challenger, 10 ether);
        
        _deploySystem();
    }
    
    function _deploySystem() internal {
        vm.startPrank(admin);
        
        qsToken = new QSToken(admin);
        veQSToken = new veQS(address(qsToken), admin);
        treasury = new Treasury(admin);
        coreState = new CoreState(admin);
        seqRegistry = new SequencerRegistry(admin);
        seqSlashing = new SequencerSlashing(address(seqRegistry), address(treasury), admin);
        seqRotation = new SequencerRotation(address(seqRegistry), admin);
        securityCouncil = new SecurityCouncil(scMembers, 5, admin);
        governor = new Governor(address(veQSToken), address(treasury), admin);
        
        address[] memory multisigSigners = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            multisigSigners[i] = scMembers[i];
        }
        govSwitch = new GovernanceSwitch(admin, multisigSigners, address(governor), address(securityCouncil));
        
        for (uint256 i = 0; i < voters.length; i++) {
            qsToken.mint(voters[i], 5_000_000e18);
        }
        
        vm.stopPrank();
        
        for (uint256 i = 0; i < sequencers.length; i++) {
            vm.prank(sequencers[i]);
            seqRegistry.register{value: MIN_PROVER_STAKE}();
        }
        
        for (uint256 i = 0; i < voters.length; i++) {
            vm.startPrank(voters[i]);
            qsToken.approve(address(veQSToken), type(uint256).max);
            veQSToken.createLock(5_000_000e18, block.timestamp + 365 days);
            vm.stopPrank();
        }
    }
    
    function test_FullFlow_LockUnlockClaim() public {
        uint256 lockAmount = 1 ether;
        bytes32 commitment = keccak256(abi.encodePacked(user, lockAmount, block.timestamp));
        vm.prank(user);
        coreState.lock{value: lockAmount}(commitment);
        assertTrue(coreState.isLocked(commitment), "Asset should be locked");
        
        vm.prank(user);
        coreState.requestUnlock(commitment);
        vm.warp(block.timestamp + NORMAL_TIMELOCK);
        
        bytes[] memory signatures = new bytes[](2);
        signatures[0] = abi.encodePacked(commitment, uint256(0));
        signatures[1] = abi.encodePacked(commitment, uint256(1));
        
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreState.claimUnlock(commitment, signatures);
        assertEq(user.balance - balanceBefore, lockAmount, "Should receive locked amount");
    }
    
    function test_FullFlow_GovernanceProposal() public {
        vm.prank(voters[0]);
        uint256 proposalId = governor.propose(
            address(coreState),
            abi.encodeWithSignature("updateParameter(uint256)", 100),
            "Update system parameter"
        );
        
        vm.warp(block.timestamp + 7 days);
        
        for (uint256 i = 0; i < 15; i++) {
            vm.prank(voters[i]);
            governor.castVote(proposalId, true);
        }
        
        vm.warp(block.timestamp + 7 days);
        vm.prank(voters[0]);
        governor.queue(proposalId);
        vm.warp(block.timestamp + GOVERNANCE_TIMELOCK);
        vm.prank(voters[0]);
        governor.execute(proposalId);
        assertTrue(governor.isExecuted(proposalId), "Proposal should be executed");
    }
    
    function test_FullFlow_ChallengeSlash() public {
        address maliciousSeq = sequencers[0];
        bytes memory proof = abi.encodePacked(maliciousSeq, "double_sign");
        vm.prank(challenger);
        seqSlashing.submitChallenge{value: 0.1 ether}(maliciousSeq, proof);
        vm.warp(block.timestamp + 48 hours);
        
        uint256 stakeBefore = seqRegistry.getStake(maliciousSeq);
        vm.prank(admin);
        seqSlashing.executeSlash(maliciousSeq);
        uint256 stakeAfter = seqRegistry.getStake(maliciousSeq);
        assertEq(stakeBefore - stakeAfter, stakeBefore / 10, "Should slash 10%");
    }
    
    function test_FullFlow_EmergencyPause() public {
        bytes32 pauseHash = keccak256("emergency_pause");
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(pauseHash);
        }
        vm.prank(scMembers[0]);
        securityCouncil.executePause(pauseHash);
        assertTrue(coreState.isPaused(), "System should be paused");
        
        bytes32 unpauseHash = keccak256("unpause");
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(unpauseHash);
        }
        vm.prank(scMembers[0]);
        securityCouncil.executeUnpause(unpauseHash);
        assertFalse(coreState.isPaused(), "System should be unpaused");
    }
    
    function test_FullFlow_SequencerRotation() public {
        address leader = seqRotation.currentLeader();
        assertEq(leader, sequencers[0], "First sequencer should be leader");
        
        for (uint256 i = 0; i < 10; i++) {
            bytes32 blockHash = keccak256(abi.encodePacked("block", i));
            for (uint256 j = 0; j < 3; j++) {
                vm.prank(sequencers[j]);
                seqRotation.signBlock(blockHash);
            }
            assertTrue(seqRotation.isBlockFinalized(blockHash), "Block should be finalized");
        }
        
        vm.warp(block.timestamp + 10 seconds);
        seqRotation.rotate();
        assertEq(seqRotation.currentLeader(), sequencers[1], "Should rotate to next sequencer");
    }
    
    function test_SystemState_AllComponentsDeployed() public view {
        assertTrue(address(coreState) != address(0), "CoreState deployed");
        assertTrue(address(seqRegistry) != address(0), "SeqRegistry deployed");
        assertTrue(address(seqSlashing) != address(0), "Slashing deployed");
        assertTrue(address(seqRotation) != address(0), "Rotation deployed");
        assertTrue(address(governor) != address(0), "Governor deployed");
        assertTrue(address(securityCouncil) != address(0), "SC deployed");
        assertTrue(address(qsToken) != address(0), "QS deployed");
        assertTrue(address(veQSToken) != address(0), "veQS deployed");
        assertTrue(address(treasury) != address(0), "Treasury deployed");
    }
}
