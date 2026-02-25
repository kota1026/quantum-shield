// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISecurityCouncilElection
/// @notice Interface for Security Council Election contract
/// @dev Per CURRENT_PLAN.md DECEN-005, DECEN-007
interface ISecurityCouncilElection {
    // ============ Structs ============
    
    /// @notice Election data
    struct Election {
        uint256 id;
        uint256 nominationStart;
        uint256 nominationEnd;
        uint256 votingEnd;
        uint256 candidateCount;
        bool finalized;
        address[9] winners;
    }
    
    /// @notice Candidate data
    struct Candidate {
        address addr;
        uint256 veQSBalance;
        uint256 votesReceived;
        bool nominated;
    }
    
    /// @notice Term tracking for members
    struct TermInfo {
        uint256 termNumber;
        uint256 startTime;
        uint256 endTime;
        uint256 consecutiveTerms;
    }
    
    // ============ Events ============
    
    event ElectionStarted(
        uint256 indexed electionId,
        uint256 nominationEnd,
        uint256 votingEnd
    );
    
    event CandidateNominated(
        uint256 indexed electionId,
        address indexed candidate,
        uint256 veQSBalance
    );
    
    event VoteCast(
        uint256 indexed electionId,
        address indexed voter,
        address indexed candidate,
        uint256 weight
    );
    
    event ElectionFinalized(
        uint256 indexed electionId,
        address[9] winners
    );
    
    event TermStarted(
        address indexed member,
        uint256 termNumber,
        uint256 startTime,
        uint256 endTime
    );
    
    event TermEnded(
        address indexed member,
        uint256 termNumber
    );
    
    event MemberRotated(
        address indexed oldMember,
        address indexed newMember,
        uint256 seatId
    );
    
    // ============ Errors ============
    
    error NotGovernance();
    error ElectionNotActive();
    error ElectionAlreadyActive();
    error NominationPeriodEnded();
    error NominationPeriodNotEnded();
    error VotingPeriodEnded();
    error VotingPeriodNotStarted();
    error InsufficientVeQS();
    error AlreadyNominated();
    error NotNominated();
    error AlreadyVoted();
    error InvalidCandidate();
    error ElectionNotFinalized();
    error MaxConsecutiveTermsReached();
    error ElectionAlreadyFinalized();
    error NotEnoughCandidates();
    
    // ============ Election Functions ============
    
    /// @notice Start a new election
    function startElection() external;
    
    /// @notice Nominate self as candidate
    function nominate() external;
    
    /// @notice Cast vote for a candidate
    /// @param candidate Candidate address to vote for
    function vote(address candidate) external;
    
    /// @notice Finalize election and update Security Council
    function finalize() external;
    
    // ============ View Functions ============
    
    /// @notice Get election info
    function getElection(uint256 electionId) external view returns (Election memory);
    
    /// @notice Get candidate info
    function getCandidate(uint256 electionId, address candidate) external view returns (Candidate memory);
    
    /// @notice Get all candidates for an election
    function getCandidates(uint256 electionId) external view returns (address[] memory);
    
    /// @notice Check if address has voted
    function hasVoted(uint256 electionId, address voter) external view returns (bool);
    
    /// @notice Check if address is nominated
    function isNominated(address candidate) external view returns (bool);
    
    /// @notice Get votes received by candidate
    function getVotesReceived(address candidate) external view returns (uint256);
    
    /// @notice Get election winners
    function getWinners(uint256 electionId) external view returns (address[9] memory);
    
    /// @notice Get term info for member
    function getTermInfo(address member) external view returns (TermInfo memory);
    
    /// @notice Get consecutive terms for a member
    function getConsecutiveTerms(address member) external view returns (uint256);
    
    /// @notice Get term end time for a member
    function getTermEnd(address member) external view returns (uint256);
    
    /// @notice Check if election is in nomination period
    function isNominationPeriod() external view returns (bool);
    
    /// @notice Check if election is in voting period
    function isVotingPeriod() external view returns (bool);
    
    // ============ Constants ============
    
    function MAX_MEMBERS() external view returns (uint256);
    function NOMINATION_PERIOD() external view returns (uint256);
    function VOTING_PERIOD() external view returns (uint256);
    function TERM_DURATION() external view returns (uint256);
    function MAX_CONSECUTIVE_TERMS() external view returns (uint256);
    function MIN_VEQS_TO_NOMINATE() external view returns (uint256);
    function MIN_VEQS_TO_VOTE() external view returns (uint256);
}
