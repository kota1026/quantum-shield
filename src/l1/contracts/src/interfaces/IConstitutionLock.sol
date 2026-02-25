// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IConstitutionLock
 * @notice Interface for Core Principles (CP) protection mechanism
 * @dev Implements IMMUTABLE and SUPERMAJORITY protection levels as defined in CORE_PRINCIPLES.md
 * 
 * Protection Levels:
 * - IMMUTABLE: CP-1 (Quantum Resistance), CP-2 (Self-Custody) - Cannot be changed by any means
 * - SUPERMAJORITY: CP-3, CP-4, CP-5 - Requires 75% veQS + 6/7 SC + 30 days timelock
 */
interface IConstitutionLock {
    // ============ Enums ============

    /// @notice Protection level for each Core Principle
    enum ProtectionLevel {
        IMMUTABLE,      // Cannot be changed (CP-1, CP-2)
        SUPERMAJORITY   // Requires 75% veQS + 6/7 SC + 30 days (CP-3, CP-4, CP-5)
    }

    // ============ Structs ============

    /// @notice Requirements for supermajority approval
    struct SupermajorityRequirements {
        uint256 veQSThresholdBps;    // 7500 = 75%
        uint256 scThresholdBps;       // 8571 = 6/7 ≈ 85.71%
        uint256 timelockSeconds;      // 30 days
    }

    /// @notice Proposal for changing a SUPERMAJORITY CP
    struct Proposal {
        uint8 cpNumber;           // 3, 4, or 5
        bytes proposedData;       // Encoded change data
        uint256 proposedAt;       // Timestamp when proposed
        uint256 veQSVotesBps;     // Current veQS votes in basis points
        uint256 scApprovals;      // Number of SC member approvals
        bool executed;            // Whether proposal has been executed
        bool cancelled;           // Whether proposal has been cancelled
    }

    // ============ Events ============

    /// @notice Emitted when a new proposal is created
    event ProposalCreated(
        uint256 indexed proposalId,
        uint8 indexed cpNumber,
        bytes proposedData,
        address proposer
    );

    /// @notice Emitted when veQS votes are recorded
    event VeQSVotesRecorded(
        uint256 indexed proposalId,
        uint256 votesBps,
        uint256 totalVotesBps
    );

    /// @notice Emitted when a Security Council member approves
    event SCApprovalRecorded(
        uint256 indexed proposalId,
        address indexed member,
        uint256 totalApprovals
    );

    /// @notice Emitted when a proposal is executed
    event ProposalExecuted(
        uint256 indexed proposalId,
        uint8 indexed cpNumber,
        bytes appliedData
    );

    /// @notice Emitted when an attempt to change IMMUTABLE CP is detected
    event ImmutableCPViolationAttempted(
        uint8 indexed cpNumber,
        address indexed attacker
    );

    /// @notice Emitted when admin is changed (CP-5 Transparency)
    event AdminChanged(
        address indexed previousAdmin,
        address indexed newAdmin
    );

    /// @notice Emitted when vote recorder is changed (CP-5 Transparency)
    event VoteRecorderChanged(
        address indexed previousRecorder,
        address indexed newRecorder
    );

    /// @notice Emitted when Security Council member is added (CP-5 Transparency)
    event SecurityCouncilMemberAdded(
        address indexed member
    );

    /// @notice Emitted when Security Council member is removed (CP-5 Transparency)
    event SecurityCouncilMemberRemoved(
        address indexed member
    );

    // ============ Errors ============

    /// @notice Thrown when attempting to modify an IMMUTABLE CP
    error CPImmutable(uint8 cpNumber);

    /// @notice Thrown when caller is not authorized
    error Unauthorized();

    /// @notice Thrown when CP number is invalid (not 1-5)
    error InvalidCPNumber(uint8 cpNumber);

    /// @notice Thrown when timelock has not expired
    error TimeLockNotExpired(uint256 remainingTime);

    /// @notice Thrown when veQS threshold is not met
    error InsufficientVeQS(uint256 current, uint256 required);

    /// @notice Thrown when SC approval threshold is not met
    error InsufficientSCApprovals(uint256 current, uint256 required);

    /// @notice Thrown when proposal has already been executed
    error ProposalAlreadyExecuted(uint256 proposalId);

    /// @notice Thrown when proposal has been cancelled
    error ProposalCancelled(uint256 proposalId);

    /// @notice Thrown when proposal does not exist
    error ProposalNotFound(uint256 proposalId);

    /// @notice Thrown when attempting to shorten a timelock
    error TimeLockCannotBeShortened(uint256 current, uint256 proposed);

    /// @notice Thrown when attempting to reduce slashing rate
    error SlashingCannotBeReduced();

    // ============ View Functions ============

    /// @notice Get the protection level for a CP
    /// @param cpNumber The CP number (1-5)
    /// @return The protection level
    function getProtectionLevel(uint8 cpNumber) external view returns (ProtectionLevel);

    /// @notice Check if a CP is compliant
    /// @param cpNumber The CP number (1-5)
    /// @return True if compliant
    function isCompliant(uint8 cpNumber) external view returns (bool);

    /// @notice Get supermajority requirements
    /// @return The requirements struct
    function getSupermajorityRequirements() external pure returns (SupermajorityRequirements memory);

    /// @notice Calculate required veQS votes for a proposal
    /// @param totalVeQS Total veQS supply
    /// @return Required votes in basis points
    function calculateRequiredVeQS(uint256 totalVeQS) external pure returns (uint256);

    /// @notice Calculate required SC approvals
    /// @param totalMembers Total SC members
    /// @return Required approvals (6/7 of total)
    function calculateRequiredSCApprovals(uint256 totalMembers) external pure returns (uint256);

    /// @notice Get proposal details
    /// @param proposalId The proposal ID
    /// @return The proposal struct
    function getProposal(uint256 proposalId) external view returns (Proposal memory);

    // ============ State-Changing Functions ============

    /// @notice Propose a change to a SUPERMAJORITY CP
    /// @param cpNumber The CP number (must be 3, 4, or 5)
    /// @param proposedData The encoded change data
    /// @return proposalId The ID of the created proposal
    function proposeChange(uint8 cpNumber, bytes calldata proposedData) external returns (uint256 proposalId);

    /// @notice Record veQS votes for a proposal
    /// @param proposalId The proposal ID
    /// @param votesBps The votes in basis points
    function recordVeQSVotes(uint256 proposalId, uint256 votesBps) external;

    /// @notice Record SC member approval
    /// @param proposalId The proposal ID
    function approveSC(uint256 proposalId) external;

    /// @notice Execute a proposal after all requirements are met
    /// @param proposalId The proposal ID
    function executeProposal(uint256 proposalId) external;

    /// @notice Cancel a proposal
    /// @param proposalId The proposal ID
    function cancelProposal(uint256 proposalId) external;
}
