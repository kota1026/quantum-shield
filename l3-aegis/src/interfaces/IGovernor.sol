// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGovernor
/// @notice Interface for Quantum Shield Governor with veQS voting
/// @dev Per UNIFIED_SPEC_v2.0.md §Governance + SPEC_STRATEGY_BRIDGE §7
/// @custom:security-contact security@quantumshield.io
interface IGovernor {
    // ============ Enums ============
    
    /// @notice Proposal state
    enum ProposalState {
        Pending,      // Waiting for voting delay
        Active,       // Voting in progress
        Canceled,     // Proposal canceled
        Defeated,     // Did not reach quorum or majority
        Succeeded,    // Passed vote
        Queued,       // In timelock queue
        Expired,      // Timelock expired without execution
        Executed      // Successfully executed
    }
    
    /// @notice Vote type
    enum VoteType {
        Against,
        For,
        Abstain
    }
    
    /// @notice Proposal category (different quorums)
    /// @dev Per SPEC_STRATEGY_BRIDGE §6.1
    enum ProposalCategory {
        Parameter,    // 4% quorum - parameter adjustments
        Upgrade,      // 8% quorum - contract upgrades
        Council       // 15% quorum - council member changes
    }
    
    // ============ Structs ============
    
    /// @notice Proposal data
    struct Proposal {
        uint256 id;
        address proposer;
        ProposalCategory category;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
        bytes32 descriptionHash;
    }
    
    /// @notice Proposal actions
    struct ProposalActions {
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
    }
    
    /// @notice Vote receipt
    struct Receipt {
        bool hasVoted;
        VoteType voteType;
        uint256 votes;
    }
    
    // ============ Events ============
    
    /// @notice Emitted when a proposal is created
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalCategory category,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        uint256 startTime,
        uint256 endTime,
        string description
    );
    
    /// @notice Emitted when a vote is cast
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType voteType,
        uint256 votes,
        string reason
    );
    
    /// @notice Emitted when a proposal is canceled
    event ProposalCanceled(uint256 indexed proposalId);
    
    /// @notice Emitted when a proposal is queued
    event ProposalQueued(uint256 indexed proposalId, uint256 eta);
    
    /// @notice Emitted when a proposal is executed
    event ProposalExecuted(uint256 indexed proposalId);
    
    // ============ Errors ============
    
    /// @notice Proposal does not exist
    error ProposalNotFound();
    
    /// @notice Invalid proposal state for action
    error InvalidProposalState();
    
    /// @notice Caller not authorized
    error NotAuthorized();
    
    /// @notice Insufficient voting power to propose
    error InsufficientVotingPower();
    
    /// @notice Already voted on this proposal
    error AlreadyVoted();
    
    /// @notice Invalid proposal parameters
    error InvalidParameters();
    
    /// @notice Voting period has not started
    error VotingNotStarted();
    
    /// @notice Voting period has ended
    error VotingEnded();
    
    /// @notice Proposal execution failed
    error ExecutionFailed();
    
    /// @notice Timelock not met
    error TimelockNotMet();
    
    /// @notice Quorum not reached
    error QuorumNotReached();
    
    // ============ Constants ============
    
    /// @notice Voting delay after proposal creation (1 day)
    function VOTING_DELAY() external view returns (uint256);
    
    /// @notice Voting period duration (7 days)
    function VOTING_PERIOD() external view returns (uint256);
    
    /// @notice Timelock delay before execution (7 days)
    function TIMELOCK_DELAY() external view returns (uint256);
    
    /// @notice Minimum voting power to create proposal (1% of total supply)
    function PROPOSAL_THRESHOLD() external view returns (uint256);
    
    // ============ View Functions ============
    
    /// @notice Get veQS contract address
    function veQS() external view returns (address);
    
    /// @notice Get proposal data
    /// @param proposalId Proposal ID
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
    
    /// @notice Get proposal actions
    /// @param proposalId Proposal ID
    function getProposalActions(uint256 proposalId) external view returns (ProposalActions memory);
    
    /// @notice Get proposal state
    /// @param proposalId Proposal ID
    function state(uint256 proposalId) external view returns (ProposalState);
    
    /// @notice Get vote receipt for voter on proposal
    /// @param proposalId Proposal ID
    /// @param voter Voter address
    function getReceipt(uint256 proposalId, address voter) external view returns (Receipt memory);
    
    /// @notice Get quorum for proposal category
    /// @param category Proposal category
    function quorum(ProposalCategory category) external view returns (uint256);
    
    /// @notice Check if proposal has reached quorum
    /// @param proposalId Proposal ID
    function hasReachedQuorum(uint256 proposalId) external view returns (bool);
    
    /// @notice Get proposal count
    function proposalCount() external view returns (uint256);
    
    /// @notice Get proposal ETA (when execution becomes available)
    /// @param proposalId Proposal ID
    function proposalEta(uint256 proposalId) external view returns (uint256);
    
    // ============ State-Changing Functions ============
    
    /// @notice Create a new proposal
    /// @param targets Target contract addresses
    /// @param values ETH values for each call
    /// @param calldatas Encoded function calls
    /// @param description Proposal description
    /// @param category Proposal category
    /// @return proposalId Created proposal ID
    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description,
        ProposalCategory category
    ) external returns (uint256 proposalId);
    
    /// @notice Cast a vote on a proposal
    /// @param proposalId Proposal ID
    /// @param voteType Vote type (For, Against, Abstain)
    function castVote(uint256 proposalId, VoteType voteType) external;
    
    /// @notice Cast a vote with reason
    /// @param proposalId Proposal ID
    /// @param voteType Vote type
    /// @param reason Vote reason
    function castVoteWithReason(
        uint256 proposalId,
        VoteType voteType,
        string calldata reason
    ) external;
    
    /// @notice Queue a successful proposal for execution
    /// @param proposalId Proposal ID
    function queue(uint256 proposalId) external;
    
    /// @notice Execute a queued proposal
    /// @param proposalId Proposal ID
    function execute(uint256 proposalId) external;
    
    /// @notice Cancel a proposal (proposer or admin only)
    /// @param proposalId Proposal ID
    function cancel(uint256 proposalId) external;
}
