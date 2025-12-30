// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ConstitutionLock} from "../../src/core/ConstitutionLock.sol";
import {ConstitutionRegistry} from "../../src/core/ConstitutionRegistry.sol";
import {IConstitutionLock} from "../../src/interfaces/IConstitutionLock.sol";

/**
 * @title ConstitutionLockTest
 * @notice Test suite for CP protection mechanism (CORE-003)
 * @dev Tests cover:
 *   [TEST-001] ConstitutionLock unit tests
 *   [TEST-002] CP compliance confirmation tests
 *   [TEST-003] Boundary conditions & attack vector tests
 */
contract ConstitutionLockTest is Test {
    ConstitutionLock public constitutionLock;
    ConstitutionRegistry public registry;

    address public admin = address(0x1);
    address public voteRecorder = address(0x2);
    address public attacker = address(0x999);
    
    address[] public securityCouncil;

    // Events for testing
    event ProposalCreated(uint256 indexed proposalId, uint8 indexed cpNumber, bytes proposedData, address proposer);
    event VeQSVotesRecorded(uint256 indexed proposalId, uint256 votesBps, uint256 totalVotesBps);
    event SCApprovalRecorded(uint256 indexed proposalId, address indexed member, uint256 totalApprovals);
    event ProposalExecuted(uint256 indexed proposalId, uint8 indexed cpNumber, bytes appliedData);
    event ImmutableCPViolationAttempted(uint8 indexed cpNumber, address indexed attacker);

    function setUp() public {
        // Initialize 7 SC members
        for (uint256 i = 0; i < 7; i++) {
            securityCouncil.push(address(uint160(0x100 + i)));
        }

        vm.startPrank(admin);
        constitutionLock = new ConstitutionLock(admin, securityCouncil);
        constitutionLock.setVoteRecorder(voteRecorder);
        registry = new ConstitutionRegistry(address(constitutionLock));
        vm.stopPrank();
    }

    // ============ [TEST-001] Protection Level Tests ============

    function test_ProtectionLevel_CP1_IsImmutable() public view {
        assertEq(
            uint256(constitutionLock.getProtectionLevel(1)),
            uint256(IConstitutionLock.ProtectionLevel.IMMUTABLE),
            "CP-1 should be IMMUTABLE"
        );
    }

    function test_ProtectionLevel_CP2_IsImmutable() public view {
        assertEq(
            uint256(constitutionLock.getProtectionLevel(2)),
            uint256(IConstitutionLock.ProtectionLevel.IMMUTABLE),
            "CP-2 should be IMMUTABLE"
        );
    }

    function test_ProtectionLevel_CP3_IsSupermajority() public view {
        assertEq(
            uint256(constitutionLock.getProtectionLevel(3)),
            uint256(IConstitutionLock.ProtectionLevel.SUPERMAJORITY),
            "CP-3 should be SUPERMAJORITY"
        );
    }

    function test_ProtectionLevel_CP4_IsSupermajority() public view {
        assertEq(
            uint256(constitutionLock.getProtectionLevel(4)),
            uint256(IConstitutionLock.ProtectionLevel.SUPERMAJORITY),
            "CP-4 should be SUPERMAJORITY"
        );
    }

    function test_ProtectionLevel_CP5_IsSupermajority() public view {
        assertEq(
            uint256(constitutionLock.getProtectionLevel(5)),
            uint256(IConstitutionLock.ProtectionLevel.SUPERMAJORITY),
            "CP-5 should be SUPERMAJORITY"
        );
    }

    function test_ProposeChange_CP1_Reverts() public {
        vm.expectEmit(true, true, false, false);
        emit ImmutableCPViolationAttempted(1, attacker);
        
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.CPImmutable.selector, 1));
        constitutionLock.proposeChange(1, bytes("malicious"));
    }

    function test_ProposeChange_CP2_Reverts() public {
        vm.expectEmit(true, true, false, false);
        emit ImmutableCPViolationAttempted(2, attacker);
        
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.CPImmutable.selector, 2));
        constitutionLock.proposeChange(2, bytes("malicious"));
    }

    function test_InvalidCPNumber_Reverts() public {
        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.InvalidCPNumber.selector, 0));
        constitutionLock.getProtectionLevel(0);

        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.InvalidCPNumber.selector, 6));
        constitutionLock.getProtectionLevel(6);
    }

    // ============ [TEST-001] Supermajority Requirements Tests ============

    function test_SupermajorityRequirements_Values() public view {
        IConstitutionLock.SupermajorityRequirements memory req = constitutionLock.getSupermajorityRequirements();
        
        assertEq(req.veQSThresholdBps, 7500, "veQS threshold should be 75%");
        assertEq(req.scThresholdBps, 8571, "SC threshold should be ~85.71%");
        assertEq(req.timelockSeconds, 30 days, "Timelock should be 30 days");
    }

    function test_CalculateRequiredVeQS() public view {
        // 75% of 10000 = 7500
        assertEq(constitutionLock.calculateRequiredVeQS(10000), 7500);
        
        // 75% of 1000000 = 750000
        assertEq(constitutionLock.calculateRequiredVeQS(1000000), 750000);
    }

    function test_CalculateRequiredSCApprovals() public view {
        // 6/7 of 7 = 6
        assertEq(constitutionLock.calculateRequiredSCApprovals(7), 6);
        
        // 6/7 of 14 = 12
        assertEq(constitutionLock.calculateRequiredSCApprovals(14), 12);
    }

    // ============ [TEST-001] Proposal Flow Tests ============

    function test_ProposeChange_CP3_Success() public {
        bytes memory data = abi.encode(48 hours, 14 days);
        
        vm.expectEmit(true, true, false, true);
        emit ProposalCreated(1, 3, data, admin);
        
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, data);
        
        assertEq(proposalId, 1);
        
        IConstitutionLock.Proposal memory proposal = constitutionLock.getProposal(proposalId);
        assertEq(proposal.cpNumber, 3);
        assertEq(proposal.veQSVotesBps, 0);
        assertEq(proposal.scApprovals, 0);
        assertFalse(proposal.executed);
        assertFalse(proposal.cancelled);
    }

    function test_RecordVeQSVotes_Success() public {
        // Create proposal
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        // Record votes
        vm.prank(voteRecorder);
        constitutionLock.recordVeQSVotes(proposalId, 5000);

        IConstitutionLock.Proposal memory proposal = constitutionLock.getProposal(proposalId);
        assertEq(proposal.veQSVotesBps, 5000);
    }

    function test_ApproveSC_Success() public {
        // Create proposal
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        // SC member approves
        vm.prank(securityCouncil[0]);
        constitutionLock.approveSC(proposalId);

        IConstitutionLock.Proposal memory proposal = constitutionLock.getProposal(proposalId);
        assertEq(proposal.scApprovals, 1);
        assertTrue(constitutionLock.hasSCApproved(proposalId, securityCouncil[0]));
    }

    function test_ExecuteProposal_FullFlow() public {
        bytes memory data = abi.encode(48 hours, 14 days);
        
        // Create proposal
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, data);

        // Record 75% veQS votes
        vm.prank(voteRecorder);
        constitutionLock.recordVeQSVotes(proposalId, 7500);

        // Get 6/7 SC approvals
        for (uint256 i = 0; i < 6; i++) {
            vm.prank(securityCouncil[i]);
            constitutionLock.approveSC(proposalId);
        }

        // Wait 30 days
        vm.warp(block.timestamp + 30 days);

        // Execute
        vm.expectEmit(true, true, false, true);
        emit ProposalExecuted(proposalId, 3, data);
        
        constitutionLock.executeProposal(proposalId);

        IConstitutionLock.Proposal memory proposal = constitutionLock.getProposal(proposalId);
        assertTrue(proposal.executed);
    }

    // ============ [TEST-002] CP Compliance Tests ============

    function test_CP1_Compliant() public view {
        assertTrue(constitutionLock.isCompliant(1), "CP-1 should be compliant");
        assertTrue(registry.isCompliant(1), "Registry: CP-1 should be compliant");
    }

    function test_CP2_Compliant() public view {
        assertTrue(constitutionLock.isCompliant(2), "CP-2 should be compliant");
        assertTrue(registry.isCompliant(2), "Registry: CP-2 should be compliant");
        assertFalse(registry.hasServerKeyStorage(), "No server key storage");
    }

    function test_CP3_Compliant() public view {
        assertTrue(constitutionLock.isCompliant(3), "CP-3 should be compliant");
        assertTrue(registry.isCompliant(3), "Registry: CP-3 should be compliant");
        assertGe(registry.getNormalTimeLock(), 24 hours, "Normal timelock >= 24h");
        assertGe(registry.getEmergencyTimeLock(), 7 days, "Emergency timelock >= 7d");
    }

    function test_CP4_Compliant() public view {
        assertTrue(constitutionLock.isCompliant(4), "CP-4 should be compliant");
        assertTrue(registry.isCompliant(4), "Registry: CP-4 should be compliant");
        assertTrue(registry.hasSlashingMechanism(), "Slashing mechanism exists");
    }

    function test_CP4_QuadraticSlashing() public view {
        // N=1: 1*1*1000 = 1000 bps (10%)
        assertEq(registry.getSlashingRate(1), 1000);
        
        // N=2: 2*2*1000 = 4000 bps (40%)
        assertEq(registry.getSlashingRate(2), 4000);
        
        // N=3: 3*3*1000 = 9000 bps (90%)
        assertEq(registry.getSlashingRate(3), 9000);
        
        // N=4: 4*4*1000 = 16000 -> capped at 10000 bps (100%)
        assertEq(registry.getSlashingRate(4), 10000);
    }

    function test_CP5_Compliant() public view {
        assertTrue(constitutionLock.isCompliant(5), "CP-5 should be compliant");
        assertTrue(registry.isCompliant(5), "Registry: CP-5 should be compliant");
        assertTrue(registry.hasEventEmission(), "Event emission enabled");
        assertFalse(registry.hasOffchainSecretComputation(), "No off-chain secrets");
    }

    function test_FullyCompliant() public view {
        assertTrue(registry.isFullyCompliant(), "All CPs should be compliant");
    }

    function test_ProhibitedAlgorithms() public view {
        assertTrue(registry.usesProhibitedAlgorithm("ECDSA"));
        assertTrue(registry.usesProhibitedAlgorithm("RSA"));
        assertTrue(registry.usesProhibitedAlgorithm("secp256k1"));
        assertTrue(registry.usesProhibitedAlgorithm("SHA-256"));
        assertTrue(registry.usesProhibitedAlgorithm("keccak256"));
        
        // Allowed algorithms
        assertFalse(registry.usesProhibitedAlgorithm("Dilithium-III"));
        assertFalse(registry.usesProhibitedAlgorithm("SPHINCS+-128s"));
        assertFalse(registry.usesProhibitedAlgorithm("SHA3-256"));
    }

    // ============ [TEST-003] Boundary & Attack Vector Tests ============

    function test_VeQSThreshold_74Percent_Fails() public {
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        // Record 74% veQS (insufficient)
        vm.prank(voteRecorder);
        constitutionLock.recordVeQSVotes(proposalId, 7400);

        // Get 6/7 SC approvals
        for (uint256 i = 0; i < 6; i++) {
            vm.prank(securityCouncil[i]);
            constitutionLock.approveSC(proposalId);
        }

        vm.warp(block.timestamp + 30 days);

        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.InsufficientVeQS.selector, 7400, 7500));
        constitutionLock.executeProposal(proposalId);
    }

    function test_SCThreshold_5of7_Fails() public {
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        vm.prank(voteRecorder);
        constitutionLock.recordVeQSVotes(proposalId, 7500);

        // Get only 5/7 SC approvals (insufficient)
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(securityCouncil[i]);
            constitutionLock.approveSC(proposalId);
        }

        vm.warp(block.timestamp + 30 days);

        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.InsufficientSCApprovals.selector, 5, 6));
        constitutionLock.executeProposal(proposalId);
    }

    function test_TimeLock_NotExpired_Fails() public {
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        vm.prank(voteRecorder);
        constitutionLock.recordVeQSVotes(proposalId, 7500);

        for (uint256 i = 0; i < 6; i++) {
            vm.prank(securityCouncil[i]);
            constitutionLock.approveSC(proposalId);
        }

        // Only 29 days passed
        vm.warp(block.timestamp + 29 days);

        vm.expectRevert();
        constitutionLock.executeProposal(proposalId);
    }

    function test_TimeLockShortening_Prevention() public {
        // First, create a proposal to extend timelock
        bytes memory data1 = abi.encode(48 hours, 14 days);
        
        vm.prank(admin);
        uint256 proposalId1 = constitutionLock.proposeChange(3, data1);
        
        _simulateSupermajorityApproval(proposalId1);
        vm.warp(block.timestamp + 30 days);
        constitutionLock.executeProposal(proposalId1);

        // Now try to shorten it (should fail)
        bytes memory data2 = abi.encode(24 hours, 7 days); // Back to minimum
        
        vm.prank(admin);
        uint256 proposalId2 = constitutionLock.proposeChange(3, data2);
        
        _simulateSupermajorityApproval(proposalId2);
        vm.warp(block.timestamp + 30 days);
        
        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.TimeLockCannotBeShortened.selector, 48 hours, 24 hours));
        constitutionLock.executeProposal(proposalId2);
    }

    function test_ProposalDoubleExecution_Reverts() public {
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        _simulateSupermajorityApproval(proposalId);
        vm.warp(block.timestamp + 30 days);
        
        constitutionLock.executeProposal(proposalId);

        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.ProposalAlreadyExecuted.selector, proposalId));
        constitutionLock.executeProposal(proposalId);
    }

    function test_ProposalCancellation() public {
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        vm.prank(admin);
        constitutionLock.cancelProposal(proposalId);

        IConstitutionLock.Proposal memory proposal = constitutionLock.getProposal(proposalId);
        assertTrue(proposal.cancelled);

        // Cannot execute cancelled proposal
        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.ProposalCancelled.selector, proposalId));
        constitutionLock.executeProposal(proposalId);
    }

    function test_UnauthorizedVoteRecording_Reverts() public {
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        vm.prank(attacker);
        vm.expectRevert(IConstitutionLock.Unauthorized.selector);
        constitutionLock.recordVeQSVotes(proposalId, 10000);
    }

    function test_UnauthorizedSCApproval_Reverts() public {
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        vm.prank(attacker);
        vm.expectRevert(IConstitutionLock.Unauthorized.selector);
        constitutionLock.approveSC(proposalId);
    }

    function test_DoubleSCApproval_Reverts() public {
        vm.prank(admin);
        uint256 proposalId = constitutionLock.proposeChange(3, abi.encode(48 hours, 14 days));

        vm.prank(securityCouncil[0]);
        constitutionLock.approveSC(proposalId);

        vm.prank(securityCouncil[0]);
        vm.expectRevert(IConstitutionLock.Unauthorized.selector);
        constitutionLock.approveSC(proposalId);
    }

    function test_ProposalNotFound_Reverts() public {
        vm.expectRevert(abi.encodeWithSelector(IConstitutionLock.ProposalNotFound.selector, 999));
        constitutionLock.getProposal(999);
    }

    // ============ Helper Functions ============

    function _simulateSupermajorityApproval(uint256 proposalId) internal {
        vm.prank(voteRecorder);
        constitutionLock.recordVeQSVotes(proposalId, 7500);

        for (uint256 i = 0; i < 6; i++) {
            vm.prank(securityCouncil[i]);
            constitutionLock.approveSC(proposalId);
        }
    }
}

/**
 * @title ReentrancyAttacker
 * @notice Mock contract for testing reentrancy protection
 */
contract ReentrancyAttacker {
    ConstitutionLock public target;
    uint256 public targetProposalId;
    uint256 public attackCount;

    constructor(address _target) {
        target = ConstitutionLock(_target);
    }

    function attack(uint256 proposalId) external {
        targetProposalId = proposalId;
        target.executeProposal(proposalId);
    }

    // Fallback to attempt reentrancy
    receive() external payable {
        if (attackCount < 2) {
            attackCount++;
            target.executeProposal(targetProposalId);
        }
    }
}
