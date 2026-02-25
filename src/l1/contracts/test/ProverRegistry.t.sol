// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/prover/ProverRegistry.sol";

/// @title ProverRegistryTest - Comprehensive tests for ProverRegistry
/// @notice Tests SEQUENCES §5 (Prover Registration) and §6 (Prover Exit)
contract ProverRegistryTest is Test {
    ProverRegistry public registry;

    address public owner;
    address public foundation;
    address public prover1;
    address public prover2;
    address public prover3;
    address public council1;
    address public council2;
    address public council3;
    address public council4;

    bytes public validPubKey;
    bytes public validPubKey2;
    bytes public validHSMAttestation;
    bytes public validMultisigProof;

    uint256 public constant MIN_STAKE = 1 ether;
    uint256 public constant UNBONDING_PERIOD = 7 days;

    // Events
    event ProverRegistered(
        bytes32 indexed proverId,
        address indexed operator,
        bytes32 sphincsPubKeyHash,
        uint256 stake
    );

    event ProverApproved(
        bytes32 indexed proverId,
        address indexed approvedBy,
        ProverRegistry.ApprovalMode mode
    );

    event ProverSlashed(
        bytes32 indexed proverId,
        uint256 amount,
        uint256 slashCount,
        bytes32 reason
    );

    event ProverExitRequested(
        bytes32 indexed proverId,
        uint256 exitRequestedAt,
        uint256 unbondingEndsAt
    );

    event ProverExited(
        bytes32 indexed proverId,
        uint256 stakeReturned
    );

    function setUp() public {
        owner = address(this);
        foundation = makeAddr("foundation");
        prover1 = makeAddr("prover1");
        prover2 = makeAddr("prover2");
        prover3 = makeAddr("prover3");
        council1 = makeAddr("council1");
        council2 = makeAddr("council2");
        council3 = makeAddr("council3");
        council4 = makeAddr("council4");

        // Valid SPHINCS+-128s public key (32 bytes)
        validPubKey = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            validPubKey[i] = bytes1(uint8(i + 1));
        }

        validPubKey2 = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            validPubKey2[i] = bytes1(uint8(i + 33));
        }

        validHSMAttestation = abi.encodePacked("HSM_ATTESTATION_V1");
        validMultisigProof = abi.encodePacked("MULTISIG_PROOF_2_OF_3");

        // Deploy registry
        registry = new ProverRegistry(foundation);

        // Fund provers
        vm.deal(prover1, 100 ether);
        vm.deal(prover2, 100 ether);
        vm.deal(prover3, 100 ether);
    }

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    function testConstructorSetsFoundation() public view {
        assertEq(registry.foundation(), foundation);
    }

    function testConstructorSetsOwner() public view {
        assertEq(registry.owner(), owner);
    }

    function testConstructorSetsApprovalModeToFoundation() public view {
        assertEq(uint256(registry.approvalMode()), uint256(ProverRegistry.ApprovalMode.FOUNDATION_INVITE));
    }

    function testConstructorRevertsOnZeroFoundation() public {
        vm.expectRevert(ProverRegistry.ZeroAddress.selector);
        new ProverRegistry(address(0));
    }

    // =========================================================================
    // Registration Tests
    // =========================================================================

    function testRegisterProver() public {
        vm.startPrank(prover1);

        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        assertTrue(proverId != bytes32(0), "Prover ID should not be zero");

        (
            address operator,
            bytes memory sphincsPublicKey,
            bytes32 sphincsPubKeyHash,
            uint256 stake,
            ProverRegistry.ProverStatus status,
            uint256 registeredAt,
            ,
            ,
            ,
        ) = registry.getProver(proverId);

        assertEq(operator, prover1);
        assertEq(sphincsPublicKey, validPubKey);
        assertTrue(sphincsPubKeyHash != bytes32(0));
        assertEq(stake, MIN_STAKE);
        assertEq(uint256(status), uint256(ProverRegistry.ProverStatus.PENDING));
        assertEq(registeredAt, block.timestamp);

        vm.stopPrank();
    }

    function testRegisterEmitsEvent() public {
        vm.startPrank(prover1);

        vm.expectEmit(false, true, false, true);
        emit ProverRegistered(bytes32(0), prover1, bytes32(0), MIN_STAKE);

        registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.stopPrank();
    }

    function testRegisterRevertsOnInvalidPubKeyLength() public {
        vm.startPrank(prover1);

        bytes memory invalidPubKey = new bytes(31); // Wrong length

        vm.expectRevert(ProverRegistry.InvalidPublicKeyLength.selector);
        registry.register{value: MIN_STAKE}(
            invalidPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.stopPrank();
    }

    function testRegisterRevertsOnInsufficientStake() public {
        vm.startPrank(prover1);

        vm.expectRevert(ProverRegistry.InsufficientStake.selector);
        registry.register{value: 0.5 ether}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.stopPrank();
    }

    function testRegisterRevertsOnDuplicateOperator() public {
        vm.startPrank(prover1);

        registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.expectRevert(ProverRegistry.ProverAlreadyRegistered.selector);
        registry.register{value: MIN_STAKE}(
            validPubKey2,
            validHSMAttestation,
            validMultisigProof
        );

        vm.stopPrank();
    }

    function testRegisterRevertsOnDuplicatePubKey() public {
        vm.startPrank(prover1);
        registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );
        vm.stopPrank();

        vm.startPrank(prover2);
        vm.expectRevert(ProverRegistry.ProverAlreadyRegistered.selector);
        registry.register{value: MIN_STAKE}(
            validPubKey, // Same pubkey
            validHSMAttestation,
            validMultisigProof
        );
        vm.stopPrank();
    }

    function testRegisterRevertsOnEmptyHSMAttestation() public {
        vm.startPrank(prover1);

        vm.expectRevert(ProverRegistry.InvalidHSMAttestation.selector);
        registry.register{value: MIN_STAKE}(
            validPubKey,
            "", // Empty
            validMultisigProof
        );

        vm.stopPrank();
    }

    function testRegisterRevertsOnEmptyMultisigProof() public {
        vm.startPrank(prover1);

        vm.expectRevert(ProverRegistry.InvalidMultisigProof.selector);
        registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            "" // Empty
        );

        vm.stopPrank();
    }

    // =========================================================================
    // Foundation Approval Tests (Phase 1)
    // =========================================================================

    function testFoundationApproval() public {
        // Register prover
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        // Foundation approves
        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        (, , , , ProverRegistry.ProverStatus status, , uint256 approvedAt, , , ) = registry.getProver(proverId);

        assertEq(uint256(status), uint256(ProverRegistry.ProverStatus.ACTIVE));
        assertEq(approvedAt, block.timestamp);
        assertEq(registry.activeProverCount(), 1);
    }

    function testFoundationApprovalEmitsEvent() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        vm.expectEmit(true, true, false, true);
        emit ProverApproved(proverId, foundation, ProverRegistry.ApprovalMode.FOUNDATION_INVITE);
        registry.approveByFoundation(proverId);
    }

    function testFoundationApprovalRevertsIfNotFoundation() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(prover2);
        vm.expectRevert(ProverRegistry.NotFoundation.selector);
        registry.approveByFoundation(proverId);
    }

    function testFoundationApprovalRevertsIfNotPending() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        // Approve once
        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        // Try to approve again
        vm.prank(foundation);
        vm.expectRevert(ProverRegistry.ProverNotPending.selector);
        registry.approveByFoundation(proverId);
    }

    // =========================================================================
    // Council Approval Tests (Phase 2)
    // =========================================================================

    function testCouncilApproval() public {
        // Setup council members
        registry.setCouncilMember(council1, true);
        registry.setCouncilMember(council2, true);
        registry.setCouncilMember(council3, true);

        // Set approval mode to COUNCIL_VOTE
        registry.setApprovalMode(ProverRegistry.ApprovalMode.COUNCIL_VOTE);

        // Register prover
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        // Council votes (need 3 of 9)
        vm.prank(council1);
        registry.voteForApproval(proverId);

        vm.prank(council2);
        registry.voteForApproval(proverId);

        // Not approved yet (2 votes)
        (, , , , ProverRegistry.ProverStatus status1, , , , , ) = registry.getProver(proverId);
        assertEq(uint256(status1), uint256(ProverRegistry.ProverStatus.PENDING));

        // Third vote triggers approval
        vm.prank(council3);
        registry.voteForApproval(proverId);

        (, , , , ProverRegistry.ProverStatus status2, , , , , ) = registry.getProver(proverId);
        assertEq(uint256(status2), uint256(ProverRegistry.ProverStatus.ACTIVE));
    }

    function testCouncilVoteRevertsIfNotCouncilMember() public {
        registry.setApprovalMode(ProverRegistry.ApprovalMode.COUNCIL_VOTE);

        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(prover2); // Not a council member
        vm.expectRevert(ProverRegistry.NotCouncilMember.selector);
        registry.voteForApproval(proverId);
    }

    function testCouncilVoteRevertsOnDoubleVote() public {
        registry.setCouncilMember(council1, true);
        registry.setApprovalMode(ProverRegistry.ApprovalMode.COUNCIL_VOTE);

        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.startPrank(council1);
        registry.voteForApproval(proverId);

        vm.expectRevert(ProverRegistry.AlreadyVoted.selector);
        registry.voteForApproval(proverId);
        vm.stopPrank();
    }

    // =========================================================================
    // Auto Approval Tests (Phase 3+)
    // =========================================================================

    function testAutoApprovalOnRegistration() public {
        // Set to STAKE_AUTO mode
        registry.setApprovalMode(ProverRegistry.ApprovalMode.STAKE_AUTO);

        // Register prover - should be auto-approved
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        (, , , , ProverRegistry.ProverStatus status, , , , , ) = registry.getProver(proverId);
        assertEq(uint256(status), uint256(ProverRegistry.ProverStatus.ACTIVE));
        assertEq(registry.activeProverCount(), 1);
    }

    function testAutoApproveManualTrigger() public {
        // Register in FOUNDATION mode
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        // Switch to STAKE_AUTO mode
        registry.setApprovalMode(ProverRegistry.ApprovalMode.STAKE_AUTO);

        // Anyone can trigger auto-approve
        vm.prank(prover2);
        registry.autoApprove(proverId);

        (, , , , ProverRegistry.ProverStatus status, , , , , ) = registry.getProver(proverId);
        assertEq(uint256(status), uint256(ProverRegistry.ProverStatus.ACTIVE));
    }

    // =========================================================================
    // Slashing Tests
    // =========================================================================

    function testSlashingQuadratic() public {
        // Register and approve prover
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: 10 ether}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        // Single colluder: 1² × 10% = 10%
        bytes32 reason = keccak256("FRAUD_DETECTED");
        registry.slash(proverId, 1, reason);

        (, , , uint256 stake1, , , , , uint256 slashCount1, ) = registry.getProver(proverId);
        assertEq(stake1, 9 ether); // 10 - 1 = 9
        assertEq(slashCount1, 1);
    }

    function testSlashingQuadraticTwoColluders() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: 10 ether}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        // Two colluders: 2² × 10% = 40%
        registry.slash(proverId, 2, keccak256("COLLUSION"));

        (, , , uint256 stake, , , , , , ) = registry.getProver(proverId);
        assertEq(stake, 6 ether); // 10 - 4 = 6
    }

    function testSlashingCappedAt100Percent() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: 10 ether}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        // Four colluders: 4² × 10% = 160% → capped at 100%
        registry.slash(proverId, 4, keccak256("MASSIVE_COLLUSION"));

        (, , , uint256 stake, , , , , , ) = registry.getProver(proverId);
        assertEq(stake, 0); // All slashed
    }

    function testSlashingUpdatesInsuranceFund() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: 10 ether}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        uint256 insuranceBefore = registry.insuranceFund();

        registry.slash(proverId, 1, keccak256("FRAUD"));

        uint256 insuranceAfter = registry.insuranceFund();
        assertEq(insuranceAfter - insuranceBefore, 1 ether);
    }

    function testSlashingDeactivatesIfBelowMinStake() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        // Slash 100% - should deactivate
        registry.slash(proverId, 4, keccak256("FRAUD"));

        (, , , , ProverRegistry.ProverStatus status, , , , , ) = registry.getProver(proverId);
        assertEq(uint256(status), uint256(ProverRegistry.ProverStatus.SLASHED));
        assertEq(registry.activeProverCount(), 0);
    }

    function testSlashEmitsEvent() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: 10 ether}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        bytes32 reason = keccak256("FRAUD");

        vm.expectEmit(true, false, false, true);
        emit ProverSlashed(proverId, 1 ether, 1, reason);
        registry.slash(proverId, 1, reason);
    }

    // =========================================================================
    // Exit Tests
    // =========================================================================

    function testRequestExit() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        vm.prank(prover1);
        registry.requestExit(proverId);

        (, , , , ProverRegistry.ProverStatus status, , , , , uint256 exitRequestedAt) = registry.getProver(proverId);
        assertEq(uint256(status), uint256(ProverRegistry.ProverStatus.UNBONDING));
        assertEq(exitRequestedAt, block.timestamp);
        assertEq(registry.activeProverCount(), 0);
    }

    function testRequestExitEmitsEvent() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        vm.prank(prover1);
        vm.expectEmit(true, false, false, true);
        emit ProverExitRequested(proverId, block.timestamp, block.timestamp + UNBONDING_PERIOD);
        registry.requestExit(proverId);
    }

    function testRequestExitRevertsIfNotOperator() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        vm.prank(prover2);
        vm.expectRevert(ProverRegistry.NotOwner.selector);
        registry.requestExit(proverId);
    }

    function testExecuteExitAfterUnbonding() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        vm.prank(prover1);
        registry.requestExit(proverId);

        // Fast forward past unbonding period
        vm.warp(block.timestamp + UNBONDING_PERIOD + 1);

        uint256 balanceBefore = prover1.balance;

        registry.executeExit(proverId);

        uint256 balanceAfter = prover1.balance;
        assertEq(balanceAfter - balanceBefore, MIN_STAKE);

        (, , , uint256 stake, ProverRegistry.ProverStatus status, , , , , ) = registry.getProver(proverId);
        assertEq(uint256(status), uint256(ProverRegistry.ProverStatus.EXITED));
        assertEq(stake, 0);
    }

    function testExecuteExitEmitsEvent() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        vm.prank(prover1);
        registry.requestExit(proverId);

        vm.warp(block.timestamp + UNBONDING_PERIOD + 1);

        vm.expectEmit(true, false, false, true);
        emit ProverExited(proverId, MIN_STAKE);
        registry.executeExit(proverId);
    }

    function testExecuteExitRevertsBeforeUnbonding() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        vm.prank(prover1);
        registry.requestExit(proverId);

        // Only 6 days passed
        vm.warp(block.timestamp + 6 days);

        vm.expectRevert(ProverRegistry.UnbondingPeriodNotExpired.selector);
        registry.executeExit(proverId);
    }

    function testSlashingDuringUnbonding() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: 10 ether}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        vm.prank(prover1);
        registry.requestExit(proverId);

        // Slash during unbonding (still allowed per SEQUENCES §6)
        registry.slash(proverId, 2, keccak256("FRAUD_DURING_UNBONDING"));

        (, , , uint256 stake, , , , , , ) = registry.getProver(proverId);
        assertEq(stake, 6 ether); // 10 - 4 = 6

        // Fast forward and execute exit
        vm.warp(block.timestamp + UNBONDING_PERIOD + 1);

        uint256 balanceBefore = prover1.balance;
        registry.executeExit(proverId);
        uint256 balanceAfter = prover1.balance;

        assertEq(balanceAfter - balanceBefore, 6 ether); // Only remaining stake
    }

    // =========================================================================
    // Admin Function Tests
    // =========================================================================

    function testSetApprovalMode() public {
        registry.setApprovalMode(ProverRegistry.ApprovalMode.COUNCIL_VOTE);
        assertEq(uint256(registry.approvalMode()), uint256(ProverRegistry.ApprovalMode.COUNCIL_VOTE));

        registry.setApprovalMode(ProverRegistry.ApprovalMode.STAKE_AUTO);
        assertEq(uint256(registry.approvalMode()), uint256(ProverRegistry.ApprovalMode.STAKE_AUTO));
    }

    function testSetCouncilMember() public {
        registry.setCouncilMember(council1, true);
        assertTrue(registry.councilMembers(council1));

        registry.setCouncilMember(council1, false);
        assertFalse(registry.councilMembers(council1));
    }

    function testTransferOwnership() public {
        address newOwner = makeAddr("newOwner");
        registry.transferOwnership(newOwner);
        assertEq(registry.owner(), newOwner);
    }

    function testPauseUnpause() public {
        registry.pause();
        assertTrue(registry.paused());

        registry.unpause();
        assertFalse(registry.paused());
    }

    function testWithdrawInsuranceFund() public {
        // Create insurance fund through slashing
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: 10 ether}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        registry.slash(proverId, 1, keccak256("FRAUD"));

        uint256 insuranceBalance = registry.insuranceFund();
        assertEq(insuranceBalance, 1 ether);

        address recipient = makeAddr("recipient");
        registry.withdrawInsuranceFund(recipient, 0.5 ether);

        assertEq(recipient.balance, 0.5 ether);
        assertEq(registry.insuranceFund(), 0.5 ether);
    }

    // =========================================================================
    // View Function Tests
    // =========================================================================

    function testGetUnbondingEndTime() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        uint256 unbondingEndBefore = registry.getUnbondingEndTime(proverId);
        assertEq(unbondingEndBefore, 0);

        vm.prank(prover1);
        registry.requestExit(proverId);

        uint256 unbondingEndAfter = registry.getUnbondingEndTime(proverId);
        assertEq(unbondingEndAfter, block.timestamp + UNBONDING_PERIOD);
    }

    function testCalculateSlashAmount() public view {
        // 1 colluder: 10%
        assertEq(registry.calculateSlashAmount(10 ether, 1), 1 ether);

        // 2 colluders: 40%
        assertEq(registry.calculateSlashAmount(10 ether, 2), 4 ether);

        // 3 colluders: 90%
        assertEq(registry.calculateSlashAmount(10 ether, 3), 9 ether);

        // 4+ colluders: capped at 100%
        assertEq(registry.calculateSlashAmount(10 ether, 4), 10 ether);
        assertEq(registry.calculateSlashAmount(10 ether, 5), 10 ether);
    }

    function testIsActiveProver() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        assertFalse(registry.isActiveProver(proverId));

        vm.prank(foundation);
        registry.approveByFoundation(proverId);

        assertTrue(registry.isActiveProver(proverId));
    }

    function testGetProverIdByOperator() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        assertEq(registry.getProverIdByOperator(prover1), proverId);
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    function testAddStakeToExistingProver() public {
        vm.prank(prover1);
        bytes32 proverId = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        vm.prank(prover2);
        registry.addStake{value: 2 ether}(proverId);

        (, , , uint256 stake, , , , , , ) = registry.getProver(proverId);
        assertEq(stake, MIN_STAKE + 2 ether);
    }

    function testMultipleProversRegistration() public {
        // Register prover 1
        vm.prank(prover1);
        bytes32 proverId1 = registry.register{value: MIN_STAKE}(
            validPubKey,
            validHSMAttestation,
            validMultisigProof
        );

        // Register prover 2
        vm.prank(prover2);
        bytes32 proverId2 = registry.register{value: 2 ether}(
            validPubKey2,
            validHSMAttestation,
            validMultisigProof
        );

        assertTrue(proverId1 != proverId2);

        assertEq(registry.totalStaked(), MIN_STAKE + 2 ether);
    }
}
