// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ITreasury.sol";
import "../interfaces/IGovernanceSwitch.sol";
import "../interfaces/ISecurityCouncil.sol";
import "../interfaces/IERC20.sol";

/// @title Treasury
/// @notice DECEN-017: Protocol treasury management
/// @dev Multi-sig + DAO controlled with time locks and spending limits
contract Treasury is ITreasury {
    // ========== State Variables ==========
    
    /// @notice QS Token contract
    IERC20 public immutable token;
    
    /// @notice GovernanceSwitch contract
    IGovernanceSwitch public immutable governanceSwitch;
    
    /// @notice SecurityCouncil contract
    ISecurityCouncil public immutable securityCouncil;
    
    /// @notice Admin address
    address public immutable admin;
    
    /// @notice Minimum balance to maintain (12 months operating cost)
    uint256 public minimumBalance;
    
    /// @notice Proposal counter
    uint256 public proposalCount;
    
    /// @notice Proposal storage
    mapping(uint256 => Proposal) internal _proposals;
    
    /// @notice Approval tracking: proposalId => approver => approved
    mapping(uint256 => mapping(address => bool)) public hasApproved;
    
    // ========== Constants ==========
    
    /// @notice Maximum single spend ($100K)
    uint256 public constant MAX_SINGLE_SPEND = 100_000 * 1e18;
    
    /// @notice Time lock period for proposals (7 days)
    uint256 public constant TIME_LOCK_PERIOD = 7 days;
    
    /// @notice Required Security Council approvals for emergency (7/9)
    uint256 public constant SC_EMERGENCY_THRESHOLD = 7;
    
    // ========== Constructor ==========
    
    constructor(
        address _token,
        address _governanceSwitch,
        address _securityCouncil,
        uint256 _minimumBalance
    ) {
        if (_token == address(0)) revert InvalidAddress();
        if (_governanceSwitch == address(0)) revert InvalidAddress();
        if (_securityCouncil == address(0)) revert InvalidAddress();
        
        token = IERC20(_token);
        governanceSwitch = IGovernanceSwitch(_governanceSwitch);
        securityCouncil = ISecurityCouncil(_securityCouncil);
        minimumBalance = _minimumBalance;
        admin = msg.sender;
    }
    
    // ========== External Functions ==========
    
    /// @inheritdoc ITreasury
    function propose(
        address target,
        uint256 amount,
        bytes calldata data,
        string calldata description
    ) external override returns (uint256 proposalId) {
        if (target == address(0)) revert InvalidAddress();
        if (amount > MAX_SINGLE_SPEND) revert ExceedsMaxSingleSpend(amount, MAX_SINGLE_SPEND);
        if (bytes(description).length == 0) revert InvalidDescription();
        
        proposalId = ++proposalCount;
        
        _proposals[proposalId] = Proposal({
            proposalId: proposalId,
            proposer: msg.sender,
            target: target,
            amount: amount,
            data: data,
            description: description,
            createdAt: block.timestamp,
            executedAt: 0,
            approvalCount: 0,
            state: ProposalState.Pending
        });
        
        emit ProposalCreated(proposalId, msg.sender, target, amount, description);
        
        return proposalId;
    }
    
    /// @inheritdoc ITreasury
    function approve(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposalId == 0) revert ProposalNotFound(proposalId);
        if (proposal.state != ProposalState.Pending && proposal.state != ProposalState.Active) {
            revert InvalidProposalState(proposal.state);
        }
        if (hasApproved[proposalId][msg.sender]) revert AlreadyApproved(proposalId, msg.sender);
        
        hasApproved[proposalId][msg.sender] = true;
        proposal.approvalCount++;
        
        // Activate proposal if it has any approvals
        if (proposal.state == ProposalState.Pending) {
            proposal.state = ProposalState.Active;
        }
        
        // Check if enough approvals for current governance mode
        uint256 required = getRequiredApprovals();
        if (proposal.approvalCount >= required) {
            proposal.state = ProposalState.Approved;
        }
        
        emit ProposalApproved(proposalId, msg.sender, proposal.approvalCount);
    }
    
    /// @inheritdoc ITreasury
    function execute(uint256 proposalId) external override returns (bool success) {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposalId == 0) revert ProposalNotFound(proposalId);
        if (proposal.state != ProposalState.Approved) {
            revert InvalidProposalState(proposal.state);
        }
        
        // Check time lock
        if (block.timestamp < proposal.createdAt + TIME_LOCK_PERIOD) {
            revert TimeLockNotExpired(proposal.createdAt + TIME_LOCK_PERIOD);
        }
        
        // Check minimum balance
        uint256 balanceAfter = token.balanceOf(address(this)) - proposal.amount;
        if (balanceAfter < minimumBalance) {
            revert BelowMinimumBalance(balanceAfter, minimumBalance);
        }
        
        proposal.state = ProposalState.Executed;
        proposal.executedAt = block.timestamp;
        
        // Execute the transfer
        success = token.transfer(proposal.target, proposal.amount);
        if (!success) revert TransferFailed();
        
        emit ProposalExecuted(proposalId, msg.sender, proposal.target, proposal.amount);
        
        return success;
    }
    
    /// @inheritdoc ITreasury
    function emergencyWithdraw(
        address to,
        uint256 amount,
        string calldata reason
    ) external override returns (bool success) {
        // Verify Security Council approval (7/9)
        if (!securityCouncil.hasEmergencyApproval(bytes32(uint256(uint160(to))), SC_EMERGENCY_THRESHOLD)) {
            revert SCApprovalRequired();
        }
        
        if (to == address(0)) revert InvalidAddress();
        if (bytes(reason).length == 0) revert InvalidDescription();
        
        success = token.transfer(to, amount);
        if (!success) revert TransferFailed();
        
        emit EmergencyWithdraw(to, amount, reason, block.timestamp);
        
        return success;
    }
    
    /// @inheritdoc ITreasury
    function cancel(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposalId == 0) revert ProposalNotFound(proposalId);
        if (proposal.state == ProposalState.Executed || proposal.state == ProposalState.Cancelled) {
            revert InvalidProposalState(proposal.state);
        }
        if (msg.sender != proposal.proposer && msg.sender != admin) {
            revert NotAuthorized();
        }
        
        proposal.state = ProposalState.Cancelled;
        
        emit ProposalCancelled(proposalId, msg.sender);
    }
    
    // ========== View Functions ==========
    
    /// @inheritdoc ITreasury
    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposalId == 0) revert ProposalNotFound(proposalId);
        return proposal;
    }
    
    /// @inheritdoc ITreasury
    function getBalance() external view override returns (uint256) {
        return token.balanceOf(address(this));
    }
    
    /// @inheritdoc ITreasury
    function getRequiredApprovals() public view override returns (uint256) {
        IGovernanceSwitch.GovernanceMode mode = governanceSwitch.getCurrentMode();
        
        if (mode == IGovernanceSwitch.GovernanceMode.CENTRALIZED) {
            return 1; // Admin only
        } else if (mode == IGovernanceSwitch.GovernanceMode.MULTISIG) {
            return 3; // 3/5 multi-sig
        } else {
            return 0; // Token vote required (handled separately)
        }
    }
    
    /// @inheritdoc ITreasury
    function canExecute(uint256 proposalId) external view override returns (bool) {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposalId == 0) return false;
        if (proposal.state != ProposalState.Approved) return false;
        if (block.timestamp < proposal.createdAt + TIME_LOCK_PERIOD) return false;
        
        uint256 balanceAfter = token.balanceOf(address(this)) - proposal.amount;
        if (balanceAfter < minimumBalance) return false;
        
        return true;
    }
    
    // ========== Admin Functions ==========
    
    /// @notice Update minimum balance requirement
    function setMinimumBalance(uint256 _minimumBalance) external {
        if (msg.sender != admin) revert NotAuthorized();
        
        uint256 old = minimumBalance;
        minimumBalance = _minimumBalance;
        
        emit MinimumBalanceUpdated(old, _minimumBalance);
    }
    
    // ========== Receive Function ==========
    
    /// @notice Receive ETH (for gas costs if needed)
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value, block.timestamp);
    }
}
