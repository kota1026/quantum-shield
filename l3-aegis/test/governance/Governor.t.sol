// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {Governor} from "../../src/governance/Governor.sol";
import {IGovernor} from "../../src/interfaces/IGovernor.sol";
import {veQS} from "../../src/token/veQS.sol";
import {IveQS} from "../../src/interfaces/IveQS.sol";
import {QSToken} from "../../src/token/QSToken.sol";

/// @title GovernorTest
/// @notice Integration tests for Governor with veQS
/// @dev Per CURRENT_PLAN.md TOKEN-010
contract GovernorTest is Test {
    // ============ Constants ============
    
    uint256 constant INITIAL_SUPPLY = 100_000_000 * 1e18; // 100M tokens
    uint256 constant LOCK_AMOUNT = 10_000_000 * 1e18; // 10M tokens
    uint256 constant LOCK_DURATION = 365 days * 4; // 4 years max
    
    // ============ State ============
    
    QSToken public qsToken;
    veQS public veQSContract;
    Governor public governor;
    
    address public admin = address(0x1);
    address public proposer = address(0x2);
    address public voter1 = address(0x3);
    address public voter2 = address(0x4);
    address public voter3 = address(0x5);
    
    address public targetContract = address(0x100);
    
    // ============ Setup ============
    
    function setUp() public {
        // Deploy QS Token
        qsToken = new QSToken(admin, admin);
        
        // Mint tokens
        vm.prank(admin);
        qsToken.mint(proposer, LOCK_AMOUNT * 2);
        
        vm.prank(admin);
        qsToken.mint(voter1, LOCK_AMOUNT);
        
        vm.prank(admin);
        qsToken.mint(voter2, LOCK_AMOUNT);
        
        vm.prank(admin);
        qsToken.mint(voter3, LOCK_AMOUNT);
        
        // Deploy veQS
        veQSContract = new veQS(address(qsToken));
        
        // Deploy Governor
        governor = new Governor(address(veQSContract), admin);
        
        // Setup: Proposer locks tokens
        _lockTokens(proposer, LOCK_AMOUNT, LOCK_DURATION);
        _lockTokens(voter1, LOCK_AMOUNT, LOCK_DURATION);
        _lockTokens(voter2, LOCK_AMOUNT, LOCK_DURATION);
        _lockTokens(voter3, LOCK_AMOUNT, LOCK_DURATION);
    }
    
    function _lockTokens(address user, uint256 amount, uint256 duration) internal {
        vm.startPrank(user);
        qsToken.approve(address(veQSContract), amount);
        veQSContract.lock(amount, duration);
        vm.stopPrank();
    }
    
    // ============ Proposal Creation Tests ============
    
    function test_propose_success() public {
        address[] memory targets = new address[](1);
        targets[0] = targetContract;
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("updateParameter(uint256)", 100);
        
        vm.prank(proposer);
        uint256 proposalId = governor.propose(
            targets,
            values,
            calldatas,
            "Update parameter to 100",
            IGovernor.ProposalCategory.Parameter
        );
        
        assertEq(proposalId, 1);
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Pending));
    }
    
    function test_propose_revert_insufficientVotingPower() public {
        address lowPowerUser = address(0x999);
        
        address[] memory targets = new address[](1);
        targets[0] = targetContract;
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";
        
        vm.prank(lowPowerUser);
        vm.expectRevert(IGovernor.InsufficientVotingPower.selector);
        governor.propose(
            targets,
            values,
            calldatas,
            "Test",
            IGovernor.ProposalCategory.Parameter
        );
    }
    
    function test_propose_revert_emptyTargets() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);
        
        vm.prank(proposer);
        vm.expectRevert(IGovernor.InvalidParameters.selector);
        governor.propose(
            targets,
            values,
            calldatas,
            "Test",
            IGovernor.ProposalCategory.Parameter
        );
    }
    
    // ============ Voting Tests ============
    
    function test_castVote_for() public {
        uint256 proposalId = _createProposal();
        
        // Skip to voting period (7 days discussion period)
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Active));
        
        vm.prank(voter1);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        IGovernor.Receipt memory receipt = governor.getReceipt(proposalId, voter1);
        assertTrue(receipt.hasVoted);
        assertEq(uint256(receipt.voteType), uint256(IGovernor.VoteType.For));
        assertGt(receipt.votes, 0);
    }
    
    function test_castVote_against() public {
        uint256 proposalId = _createProposal();
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        
        vm.prank(voter1);
        governor.castVote(proposalId, IGovernor.VoteType.Against);
        
        IGovernor.Receipt memory receipt = governor.getReceipt(proposalId, voter1);
        assertEq(uint256(receipt.voteType), uint256(IGovernor.VoteType.Against));
    }
    
    function test_castVote_abstain() public {
        uint256 proposalId = _createProposal();
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        
        vm.prank(voter1);
        governor.castVote(proposalId, IGovernor.VoteType.Abstain);
        
        IGovernor.Receipt memory receipt = governor.getReceipt(proposalId, voter1);
        assertEq(uint256(receipt.voteType), uint256(IGovernor.VoteType.Abstain));
    }
    
    function test_castVote_revert_alreadyVoted() public {
        uint256 proposalId = _createProposal();
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        
        vm.prank(voter1);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        vm.prank(voter1);
        vm.expectRevert(IGovernor.AlreadyVoted.selector);
        governor.castVote(proposalId, IGovernor.VoteType.Against);
    }
    
    function test_castVote_revert_notActive() public {
        uint256 proposalId = _createProposal();
        // Don't skip to voting period
        
        vm.prank(voter1);
        vm.expectRevert(IGovernor.InvalidProposalState.selector);
        governor.castVote(proposalId, IGovernor.VoteType.For);
    }
    
    function test_castVoteWithReason() public {
        uint256 proposalId = _createProposal();
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        
        vm.prank(voter1);
        governor.castVoteWithReason(proposalId, IGovernor.VoteType.For, "This is a good proposal");
        
        IGovernor.Receipt memory receipt = governor.getReceipt(proposalId, voter1);
        assertTrue(receipt.hasVoted);
    }
    
    // ============ Quorum Tests ============
    
    function test_quorum_parameter() public view {
        // Parameter proposals require 4% quorum
        uint256 quorumAmount = governor.quorum(IGovernor.ProposalCategory.Parameter);
        uint256 totalPower = veQSContract.getTotalVotingPower();
        
        // Should be 4% of total
        assertEq(quorumAmount, (totalPower * 4) / 100);
    }
    
    function test_quorum_upgrade() public view {
        // Upgrade proposals require 8% quorum
        uint256 quorumAmount = governor.quorum(IGovernor.ProposalCategory.Upgrade);
        uint256 totalPower = veQSContract.getTotalVotingPower();
        
        assertEq(quorumAmount, (totalPower * 8) / 100);
    }
    
    function test_quorum_council() public view {
        // Council proposals require 15% quorum
        uint256 quorumAmount = governor.quorum(IGovernor.ProposalCategory.Council);
        uint256 totalPower = veQSContract.getTotalVotingPower();
        
        assertEq(quorumAmount, (totalPower * 15) / 100);
    }
    
    function test_hasReachedQuorum() public {
        uint256 proposalId = _createProposal();
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        
        // Vote with multiple users to reach quorum
        vm.prank(voter1);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        vm.prank(voter2);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        // With 4 voters each with 10M locked, we should have enough for 4% quorum
        assertTrue(governor.hasReachedQuorum(proposalId));
    }
    
    // ============ Proposal State Tests ============
    
    function test_state_pending() public {
        uint256 proposalId = _createProposal();
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Pending));
    }
    
    function test_state_active() public {
        uint256 proposalId = _createProposal();
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Active));
    }
    
    function test_state_succeeded() public {
        uint256 proposalId = _createProposal();
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        
        // Vote with multiple users
        vm.prank(proposer);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        vm.prank(voter1);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        vm.prank(voter2);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        vm.prank(voter3);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        // Skip past voting period
        vm.warp(block.timestamp + governor.VOTING_PERIOD() + 1);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Succeeded));
    }
    
    // ============ Queue Tests ============
    
    function test_queue_success() public {
        uint256 proposalId = _passProposal();
        
        governor.queue(proposalId);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Queued));
        assertGt(governor.proposalEta(proposalId), block.timestamp);
    }
    
    function test_queue_revert_notSucceeded() public {
        uint256 proposalId = _createProposal();
        
        vm.expectRevert(IGovernor.InvalidProposalState.selector);
        governor.queue(proposalId);
    }
    
    // ============ Execute Tests ============
    
    function test_execute_success() public {
        // Deploy a simple target contract
        MockTarget target = new MockTarget();
        
        address[] memory targets = new address[](1);
        targets[0] = address(target);
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("setValue(uint256)", 42);
        
        // Create proposal
        vm.prank(proposer);
        uint256 proposalId = governor.propose(
            targets,
            values,
            calldatas,
            "Set value to 42",
            IGovernor.ProposalCategory.Parameter
        );
        
        // Pass proposal
        _passProposalById(proposalId);
        
        // Queue
        governor.queue(proposalId);
        
        // Wait for timelock
        vm.warp(block.timestamp + governor.TIMELOCK_DELAY() + 1);
        
        // Execute
        governor.execute(proposalId);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Executed));
        assertEq(target.value(), 42);
    }
    
    function test_execute_revert_timelockNotMet() public {
        uint256 proposalId = _passProposal();
        governor.queue(proposalId);
        
        // Don't wait for timelock
        vm.expectRevert(IGovernor.TimelockNotMet.selector);
        governor.execute(proposalId);
    }
    
    // ============ Cancel Tests ============
    
    function test_cancel_byProposer() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(proposer);
        governor.cancel(proposalId);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Canceled));
    }
    
    function test_cancel_byAdmin() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(admin);
        governor.cancel(proposalId);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Canceled));
    }
    
    function test_cancel_revert_notAuthorized() public {
        uint256 proposalId = _createProposal();
        
        vm.prank(voter1);
        vm.expectRevert(IGovernor.NotAuthorized.selector);
        governor.cancel(proposalId);
    }
    
    // ============ veQS Integration Tests ============
    
    function test_votingPower_usesSnapshot() public {
        uint256 proposalId = _createProposal();
        
        // Get proposal to check start time
        IGovernor.Proposal memory proposal = governor.getProposal(proposalId);
        
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        
        // Get voter's power at snapshot (proposal start time)
        uint256 powerAtSnapshot = veQSContract.getVotingPowerAt(voter1, proposal.startTime);
        
        vm.prank(voter1);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        IGovernor.Receipt memory receipt = governor.getReceipt(proposalId, voter1);
        assertEq(receipt.votes, powerAtSnapshot);
    }
    
    function test_delegation_affectsVotingPower() public {
        // Voter1 delegates to voter2
        vm.prank(voter1);
        veQSContract.delegate(voter2);
        
        // Voter2 should have increased effective voting power
        uint256 effectivePower = veQSContract.getEffectiveVotingPower(voter2);
        assertGt(effectivePower, veQSContract.getVotingPower(voter2));
    }
    
    // ============ Constants Verification Tests ============
    
    function test_constants() public view {
        // Per CORE_PRINCIPLES.md CP-3: Time Lock must be 7 days
        // Per CURRENT_PLAN.md: 議論期間7日 + 投票期間7日 + Time Lock 7日
        assertEq(governor.TIMELOCK_DELAY(), 7 days);
        assertEq(governor.VOTING_PERIOD(), 7 days);
        assertEq(governor.VOTING_DELAY(), 7 days); // Discussion period
    }
    
    // ============ Helper Functions ============
    
    function _createProposal() internal returns (uint256) {
        address[] memory targets = new address[](1);
        targets[0] = targetContract;
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("updateParameter(uint256)", 100);
        
        vm.prank(proposer);
        return governor.propose(
            targets,
            values,
            calldatas,
            "Test Proposal",
            IGovernor.ProposalCategory.Parameter
        );
    }
    
    function _passProposal() internal returns (uint256) {
        uint256 proposalId = _createProposal();
        _passProposalById(proposalId);
        return proposalId;
    }
    
    function _passProposalById(uint256 proposalId) internal {
        vm.warp(block.timestamp + governor.VOTING_DELAY() + 1);
        
        vm.prank(proposer);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        vm.prank(voter1);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        vm.prank(voter2);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        vm.prank(voter3);
        governor.castVote(proposalId, IGovernor.VoteType.For);
        
        vm.warp(block.timestamp + governor.VOTING_PERIOD() + 1);
    }
}

/// @notice Mock target contract for execution tests
contract MockTarget {
    uint256 public value;
    
    function setValue(uint256 _value) external {
        value = _value;
    }
}
