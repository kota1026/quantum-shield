// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/treasury/Treasury.sol";
import "../../src/interfaces/ITreasury.sol";
import "../../src/interfaces/IGovernanceSwitch.sol";

/// @title Treasury Test Suite
/// @notice Tests for DECEN-017: Treasury Management
/// @dev TDD approach - tests written before implementation
contract TreasuryTest is Test {
    Treasury public treasury;
    
    address public admin = address(0x1);
    address public multisig1 = address(0x10);
    address public multisig2 = address(0x11);
    address public multisig3 = address(0x12);
    address public multisig4 = address(0x13);
    address public multisig5 = address(0x14);
    address public recipient = address(0x99);
    address public mockGovernanceSwitch = address(0x100);
    address public mockSecurityCouncil = address(0x200);
    
    uint256 constant MAX_SINGLE_SPEND = 100_000 * 1e18; // $100K
    uint256 constant MIN_BALANCE = 500_000 * 1e18; // 12 months operating
    uint256 constant TIME_LOCK = 7 days;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed target, uint256 amount, string description);
    event ProposalApproved(uint256 indexed proposalId, address indexed approver, uint256 currentApprovals);
    event ProposalExecuted(uint256 indexed proposalId, address indexed executor, uint256 amount);
    event EmergencyWithdrawal(address indexed to, uint256 amount, string reason);
    
    function setUp() public {
        address[] memory signers = new address[](5);
        signers[0] = multisig1;
        signers[1] = multisig2;
        signers[2] = multisig3;
        signers[3] = multisig4;
        signers[4] = multisig5;
        
        vm.startPrank(admin);
        treasury = new Treasury(mockGovernanceSwitch, mockSecurityCouncil, signers, 3);
        vm.stopPrank();
        
        // Fund treasury
        vm.deal(address(treasury), 1_000_000 * 1e18);
    }
    
    // ========== TEST-TREA-001: Treasury proposal/execute lifecycle ==========
    
    function test_ProposeCreatesProposal() public {
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(
            recipient, 
            50_000 * 1e18, 
            "", 
            "Fund development"
        );
        
        ITreasury.Proposal memory proposal = treasury.getProposal(proposalId);
        assertEq(proposal.id, proposalId);
        assertEq(proposal.target, recipient);
        assertEq(proposal.amount, 50_000 * 1e18);
        assertEq(proposal.proposer, multisig1);
    }
    
    function test_ApproveIncrementsCount() public {
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(recipient, 50_000 * 1e18, "", "Test");
        
        vm.prank(multisig2);
        treasury.approve(proposalId);
        
        ITreasury.Proposal memory proposal = treasury.getProposal(proposalId);
        assertEq(proposal.approvals, 2); // proposer auto-approves + 1
    }
    
    function test_ExecuteAfterTimeLockAndApprovals() public {
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(recipient, 50_000 * 1e18, "", "Test");
        
        vm.prank(multisig2);
        treasury.approve(proposalId);
        vm.prank(multisig3);
        treasury.approve(proposalId);
        
        // Fast forward past time lock
        vm.warp(block.timestamp + TIME_LOCK + 1);
        
        uint256 balBefore = recipient.balance;
        treasury.execute(proposalId);
        uint256 balAfter = recipient.balance;
        
        assertEq(balAfter - balBefore, 50_000 * 1e18);
    }
    
    function test_CannotExecuteBeforeTimeLock() public {
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(recipient, 50_000 * 1e18, "", "Test");
        
        vm.prank(multisig2);
        treasury.approve(proposalId);
        vm.prank(multisig3);
        treasury.approve(proposalId);
        
        vm.expectRevert(ITreasury.TimeLockNotExpired.selector);
        treasury.execute(proposalId);
    }
    
    function test_CannotExecuteWithoutEnoughApprovals() public {
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(recipient, 50_000 * 1e18, "", "Test");
        
        // Only 1 approval (proposer)
        vm.warp(block.timestamp + TIME_LOCK + 1);
        
        vm.expectRevert(ITreasury.InsufficientApprovals.selector);
        treasury.execute(proposalId);
    }
    
    // ========== TEST-TREA-002: Max single spend enforcement ==========
    
    function test_RejectProposalExceedingMaxSingleSpend() public {
        vm.prank(multisig1);
        vm.expectRevert(ITreasury.ExceedsMaxSingleSpend.selector);
        treasury.propose(recipient, MAX_SINGLE_SPEND + 1, "", "Too much");
    }
    
    function test_AllowProposalAtMaxSingleSpend() public {
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(recipient, MAX_SINGLE_SPEND, "", "Exactly max");
        assertTrue(proposalId > 0);
    }
    
    // ========== TEST-TREA-003: Minimum balance requirement ==========
    
    function test_RejectExecutionIfBelowMinBalance() public {
        // Set low balance
        vm.deal(address(treasury), MIN_BALANCE + 50_000 * 1e18);
        
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(recipient, 60_000 * 1e18, "", "Test");
        
        vm.prank(multisig2);
        treasury.approve(proposalId);
        vm.prank(multisig3);
        treasury.approve(proposalId);
        
        vm.warp(block.timestamp + TIME_LOCK + 1);
        
        vm.expectRevert(ITreasury.BelowMinimumBalance.selector);
        treasury.execute(proposalId);
    }
    
    // ========== TEST-TREA-004: Emergency withdraw (SC 7/9) ==========
    
    function test_EmergencyWithdraw_RequiresSCApproval() public {
        vm.prank(admin);
        vm.expectRevert(ITreasury.EmergencyRequiresSCApproval.selector);
        treasury.emergencyWithdraw(recipient, 10_000 * 1e18, "Emergency");
    }
    
    function test_EmergencyWithdraw_WithSCApproval() public {
        // Mock SC approval (7/9)
        vm.mockCall(
            mockSecurityCouncil,
            abi.encodeWithSignature("hasEmergencyApproval(bytes32)"),
            abi.encode(true)
        );
        
        vm.prank(mockSecurityCouncil);
        uint256 balBefore = recipient.balance;
        treasury.emergencyWithdraw(recipient, 10_000 * 1e18, "Critical emergency");
        uint256 balAfter = recipient.balance;
        
        assertEq(balAfter - balBefore, 10_000 * 1e18);
    }
    
    // ========== TEST-TREA-005: GovernanceSwitch integration ==========
    
    function test_RequiredApprovals_CentralizedMode() public {
        vm.mockCall(
            mockGovernanceSwitch,
            abi.encodeWithSignature("getGovernanceMode()"),
            abi.encode(IGovernanceSwitch.GovernanceMode.CENTRALIZED)
        );
        
        // In centralized mode, admin has full control
        assertEq(treasury.getRequiredApprovals(), 1);
    }
    
    function test_RequiredApprovals_MultisigMode() public {
        vm.mockCall(
            mockGovernanceSwitch,
            abi.encodeWithSignature("getGovernanceMode()"),
            abi.encode(IGovernanceSwitch.GovernanceMode.MULTISIG)
        );
        
        // In multisig mode, requires N/M (3/5 in this test)
        assertEq(treasury.getRequiredApprovals(), 3);
    }
    
    function test_RequiredApprovals_DecentralizedMode() public {
        vm.mockCall(
            mockGovernanceSwitch,
            abi.encodeWithSignature("getGovernanceMode()"),
            abi.encode(IGovernanceSwitch.GovernanceMode.DECENTRALIZED)
        );
        
        // In decentralized mode, requires Token Vote (handled by Governor)
        // Treasury multisig becomes optional/secondary
        assertEq(treasury.getRequiredApprovals(), 1); // Governance approval
    }
    
    // ========== Additional Tests ==========
    
    function test_GetBalance() public view {
        assertEq(treasury.getBalance(), 1_000_000 * 1e18);
    }
    
    function test_GetProposalCount() public {
        vm.prank(multisig1);
        treasury.propose(recipient, 1000 * 1e18, "", "Test1");
        vm.prank(multisig1);
        treasury.propose(recipient, 2000 * 1e18, "", "Test2");
        
        assertEq(treasury.getProposalCount(), 2);
    }
    
    function test_HasApproved() public {
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(recipient, 1000 * 1e18, "", "Test");
        
        assertTrue(treasury.hasApproved(proposalId, multisig1));
        assertFalse(treasury.hasApproved(proposalId, multisig2));
    }
    
    function test_CannotApproveTwice() public {
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(recipient, 1000 * 1e18, "", "Test");
        
        vm.prank(multisig1);
        vm.expectRevert(ITreasury.AlreadyApproved.selector);
        treasury.approve(proposalId);
    }
    
    function test_CancelProposal() public {
        vm.prank(multisig1);
        uint256 proposalId = treasury.propose(recipient, 1000 * 1e18, "", "Test");
        
        vm.prank(multisig1);
        treasury.cancel(proposalId);
        
        assertEq(uint256(treasury.getProposalState(proposalId)), uint256(ITreasury.ProposalState.Cancelled));
    }
    
    function test_ReceiveFunds() public {
        uint256 balBefore = treasury.getBalance();
        
        vm.deal(address(this), 100 * 1e18);
        treasury.receiveFunds{value: 100 * 1e18}("Protocol fees");
        
        assertEq(treasury.getBalance(), balBefore + 100 * 1e18);
    }
}
