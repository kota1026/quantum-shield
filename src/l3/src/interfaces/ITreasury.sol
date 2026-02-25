// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ITreasury - Protocol Treasury Management Interface
/// @notice Manages protocol treasury funds per UNIFIED_SPEC v2.0
/// @dev Phase 1-2: Multi-sig, Phase 3: Token Vote + Multi-sig, Phase 4: Token Vote only
/// @custom:ref UNIFIED_SPEC_v2.0.md §Treasury
/// @custom:security CP-5 compliant (full transparency)
interface ITreasury {
    // ============ Enums ============

    enum ProposalState {
        Pending,
        Active,
        Approved,
        Rejected,
        Executed,
        Expired,
        Cancelled
    }

    // ============ Structs ============

    struct Proposal {
        uint256 id;
        address proposer;
        address target;
        uint256 amount;
        bytes data;
        uint256 createdAt;
        uint256 executionTime;
        ProposalState state;
        uint256 approvals;
        string description;
    }

    // ============ Events ============

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed target,
        uint256 amount,
        string description
    );

    event ProposalApproved(
        uint256 indexed proposalId,
        address indexed approver,
        uint256 currentApprovals
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor,
        uint256 amount
    );

    event EmergencyWithdrawal(
        address indexed to,
        uint256 amount,
        string reason
    );

    event FundsReceived(
        address indexed from,
        uint256 amount,
        string source
    );

    // ============ Errors ============

    error ExceedsMaxSingleSpend();
    error BelowMinimumBalance();
    error ProposalNotFound();
    error InvalidProposalState();
    error TimeLockNotExpired();
    error AlreadyApproved();
    error InsufficientApprovals();
    error NotAuthorized();
    error EmergencyRequiresSCApproval();
    error InvalidTarget();
    error ZeroAmount();

    // ============ View Functions ============

    function MAX_SINGLE_SPEND() external view returns (uint256 limit);
    function minimumBalance() external view returns (uint256 balance);
    function TIME_LOCK_PERIOD() external view returns (uint256 period);
    function getBalance() external view returns (uint256 balance);
    function getProposal(uint256 proposalId) external view returns (Proposal memory proposal);
    function getProposalState(uint256 proposalId) external view returns (ProposalState state);
    function hasApproved(uint256 proposalId, address approver) external view returns (bool approved);
    function getRequiredApprovals() external view returns (uint256 required);
    function getProposalCount() external view returns (uint256 count);

    // ============ Proposal Functions ============

    function propose(
        address target,
        uint256 amount,
        bytes calldata data,
        string calldata description
    ) external returns (uint256 proposalId);

    function approve(uint256 proposalId) external;
    function execute(uint256 proposalId) external;
    function cancel(uint256 proposalId) external;

    // ============ Emergency Functions ============

    function emergencyWithdraw(
        address to,
        uint256 amount,
        string calldata reason
    ) external;

    // ============ Admin Functions ============

    function setMinimumBalance(uint256 newMinimum) external;
    function receiveFunds(string calldata source) external payable;
}
