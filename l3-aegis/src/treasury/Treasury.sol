// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ITreasury.sol";
import "../interfaces/IGovernanceSwitch.sol";
import "../interfaces/ISecurityCouncil.sol";

/// @title Treasury
/// @notice DECEN-017: Protocol treasury management
/// @dev Multi-sig controlled with time locks and spending limits (ETH-based)
contract Treasury is ITreasury {
    // ========== State Variables ==========
    
    /// @notice GovernanceSwitch contract
    IGovernanceSwitch public immutable governanceSwitch;
    
    /// @notice SecurityCouncil contract
    ISecurityCouncil public immutable securityCouncil;
    
    /// @notice Multi-sig signers
    address[] public signers;
    
    /// @notice Required approvals for proposals
    uint256 public requiredApprovals;
    
    /// @notice Minimum balance to maintain (12 months operating cost)
    uint256 public override minimumBalance;
    
    /// @notice Proposal counter
    uint256 public proposalCount;
    
    /// @notice Proposal storage
    mapping(uint256 => Proposal) internal _proposals;
    
    /// @notice Approval tracking: proposalId => approver => approved
    mapping(uint256 => mapping(address => bool)) internal _hasApproved;
    
    /// @notice Signer check
    mapping(address => bool) public isSigner;
    
    // ========== Constants ==========
    
    /// @notice Maximum single spend ($100K)
    uint256 public constant override MAX_SINGLE_SPEND = 100_000 * 1e18;
    
    /// @notice Time lock period for proposals (7 days)
    uint256 public constant override TIME_LOCK_PERIOD = 7 days;
    
    /// @notice Default minimum balance
    uint256 public constant DEFAULT_MIN_BALANCE = 500_000 * 1e18;
    
    // ========== Constructor ==========
    
    constructor(
        address _governanceSwitch,
        address _securityCouncil,
        address[] memory _signers,
        uint256 _requiredApprovals
    ) {
        require(_governanceSwitch != address(0), "Invalid governance switch");
        require(_securityCouncil != address(0), "Invalid security council");
        require(_signers.length >= _requiredApprovals, "Invalid signer count");
        require(_requiredApprovals > 0, "Invalid required approvals");
        
        governanceSwitch = IGovernanceSwitch(_governanceSwitch);
        securityCouncil = ISecurityCouncil(_securityCouncil);
        signers = _signers;
        requiredApprovals = _requiredApprovals;
        minimumBalance = DEFAULT_MIN_BALANCE;
        
        for (uint256 i = 0; i < _signers.length; i++) {
            isSigner[_signers[i]] = true;
        }
    }
    
    // ========== External Functions ==========
    
    /// @inheritdoc ITreasury
    function propose(
        address target,
        uint256 amount,
        bytes calldata data,
        string calldata description
    ) external override returns (uint256 proposalId) {
        if (target == address(0)) revert InvalidTarget();
        if (amount > MAX_SINGLE_SPEND) revert ExceedsMaxSingleSpend();
        
        proposalId = ++proposalCount;
        
        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            target: target,
            amount: amount,
            data: data,
            createdAt: block.timestamp,
            executionTime: block.timestamp + TIME_LOCK_PERIOD,
            state: ProposalState.Pending,
            approvals: 1, // Proposer auto-approves
            description: description
        });
        
        _hasApproved[proposalId][msg.sender] = true;
        
        emit ProposalCreated(proposalId, msg.sender, target, amount, description);
        
        return proposalId;
    }
    
    /// @inheritdoc ITreasury
    function approve(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (proposal.state != ProposalState.Pending && proposal.state != ProposalState.Active) {
            revert InvalidProposalState();
        }
        if (_hasApproved[proposalId][msg.sender]) revert AlreadyApproved();
        
        _hasApproved[proposalId][msg.sender] = true;
        proposal.approvals++;
        
        // Activate proposal if it has any approvals
        if (proposal.state == ProposalState.Pending) {
            proposal.state = ProposalState.Active;
        }
        
        // Check if enough approvals for current governance mode
        uint256 required = getRequiredApprovals();
        if (proposal.approvals >= required) {
            proposal.state = ProposalState.Approved;
        }
        
        emit ProposalApproved(proposalId, msg.sender, proposal.approvals);
    }
    
    /// @inheritdoc ITreasury
    function execute(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        
        // Check approvals
        if (proposal.approvals < getRequiredApprovals()) {
            revert InsufficientApprovals();
        }
        
        // Check time lock
        if (block.timestamp < proposal.executionTime) {
            revert TimeLockNotExpired();
        }
        
        // Check minimum balance
        uint256 balanceAfter = address(this).balance - proposal.amount;
        if (balanceAfter < minimumBalance) {
            revert BelowMinimumBalance();
        }
        
        proposal.state = ProposalState.Executed;
        
        // Execute the transfer (ETH)
        (bool success, ) = proposal.target.call{value: proposal.amount}(proposal.data);
        require(success, "Transfer failed");
        
        emit ProposalExecuted(proposalId, msg.sender, proposal.amount);
    }
    
    /// @inheritdoc ITreasury
    function emergencyWithdraw(
        address to,
        uint256 amount,
        string calldata reason
    ) external override {
        // Only Security Council can call this
        if (msg.sender != address(securityCouncil)) {
            revert EmergencyRequiresSCApproval();
        }
        
        if (to == address(0)) revert InvalidTarget();
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit EmergencyWithdrawal(to, amount, reason);
    }
    
    /// @inheritdoc ITreasury
    function cancel(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (proposal.state == ProposalState.Executed || proposal.state == ProposalState.Cancelled) {
            revert InvalidProposalState();
        }
        if (msg.sender != proposal.proposer && !isSigner[msg.sender]) {
            revert NotAuthorized();
        }
        
        proposal.state = ProposalState.Cancelled;
    }
    
    /// @inheritdoc ITreasury
    function receiveFunds(string calldata source) external payable override {
        emit FundsReceived(msg.sender, msg.value, source);
    }
    
    // ========== View Functions ==========
    
    /// @inheritdoc ITreasury
    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        return proposal;
    }
    
    /// @inheritdoc ITreasury
    function getProposalState(uint256 proposalId) external view override returns (ProposalState) {
        return _proposals[proposalId].state;
    }
    
    /// @inheritdoc ITreasury
    function getProposalCount() external view override returns (uint256) {
        return proposalCount;
    }
    
    /// @inheritdoc ITreasury
    function hasApproved(uint256 proposalId, address approver) external view override returns (bool) {
        return _hasApproved[proposalId][approver];
    }
    
    /// @inheritdoc ITreasury
    function getBalance() external view override returns (uint256) {
        return address(this).balance;
    }
    
    /// @inheritdoc ITreasury
    function getRequiredApprovals() public view override returns (uint256) {
        try governanceSwitch.getCurrentMode() returns (IGovernanceSwitch.GovernanceMode mode) {
            if (mode == IGovernanceSwitch.GovernanceMode.CENTRALIZED) {
                return 1; // Admin only
            } else if (mode == IGovernanceSwitch.GovernanceMode.MULTISIG) {
                return requiredApprovals; // N/M multi-sig
            } else {
                return 1; // Decentralized - governance approval
            }
        } catch {
            return requiredApprovals; // Default to multi-sig
        }
    }
    
    // ========== Admin Functions ==========
    
    /// @inheritdoc ITreasury
    function setMinimumBalance(uint256 newMinimum) external override {
        if (!isSigner[msg.sender]) revert NotAuthorized();
        minimumBalance = newMinimum;
    }
    
    // ========== Receive Function ==========
    
    /// @notice Receive ETH
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value, "direct");
    }
}
