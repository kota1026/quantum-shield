// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IveQS.sol";
import "../interfaces/ISecurityCouncil.sol";
import "../crypto/SHA3Hasher.sol";

/// @title SecurityCouncilElection
/// @notice Election mechanism for Security Council members via veQS voting
/// @dev Per CURRENT_PLAN.md DECEN-005, DECEN-007
/// @custom:security-contact security@quantumshield.io
/// @custom:ref SPEC_STRATEGY_BRIDGE.md §5 Security Requirements
contract SecurityCouncilElection {
    // ============ Constants ============
    
    /// @notice Maximum number of SC members
    uint256 public constant MAX_MEMBERS = 9;
    
    /// @notice Nomination period duration
    uint256 public constant NOMINATION_PERIOD = 3 days;
    
    /// @notice Voting period duration
    uint256 public constant VOTING_PERIOD = 7 days;
    
    /// @notice Term duration (1 year)
    uint256 public constant TERM_DURATION = 365 days;
    
    /// @notice Maximum consecutive terms
    uint256 public constant MAX_CONSECUTIVE_TERMS = 3;
    
    /// @notice Minimum veQS required to nominate (100k veQS)
    uint256 public constant MIN_VEQS_TO_NOMINATE = 100_000e18;
    
    /// @notice Minimum veQS required to vote (1 veQS)
    uint256 public constant MIN_VEQS_TO_VOTE = 1e18;
    
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
        uint256 lastElectionId;
    }
    
    // ============ State Variables ============
    
    /// @notice veQS contract
    IveQS public immutable veqs;
    
    /// @notice Security Council contract
    ISecurityCouncil public immutable securityCouncil;
    
    /// @notice Governance address
    address public governance;
    
    /// @notice Current election ID
    uint256 public currentElectionId;
    
    /// @notice Election data by ID
    mapping(uint256 => Election) private _elections;
    
    /// @notice Candidate data: electionId => candidate address => Candidate
    mapping(uint256 => mapping(address => Candidate)) private _candidates;
    
    /// @notice List of candidates: electionId => candidate addresses
    mapping(uint256 => address[]) private _candidateList;
    
    /// @notice Voter records: electionId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) private _hasVoted;
    
    /// @notice Voter choice: electionId => voter => candidate
    mapping(uint256 => mapping(address => address)) private _voterChoice;
    
    /// @notice Term info by member
    mapping(address => TermInfo) private _termInfo;
    
    /// @notice Historical consecutive terms (for cooldown tracking)
    mapping(address => uint256) private _lastTermEnd;
    
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
    
    // ============ Modifiers ============
    
    modifier onlyGovernance() {
        if (msg.sender != governance) revert NotGovernance();
        _;
    }
    
    // ============ Constructor ============
    
    /// @notice Initialize the election contract
    /// @param veqs_ veQS contract address
    /// @param securityCouncil_ Security Council contract address
    /// @param governance_ Governance address
    constructor(
        address veqs_,
        address securityCouncil_,
        address governance_
    ) {
        require(veqs_ != address(0), "Invalid veQS");
        require(securityCouncil_ != address(0), "Invalid SC");
        require(governance_ != address(0), "Invalid governance");
        
        veqs = IveQS(veqs_);
        securityCouncil = ISecurityCouncil(securityCouncil_);
        governance = governance_;
    }
    
    // ============ Election Functions ============
    
    /// @notice Start a new election
    /// @dev Can only be called by governance when no election is active
    function startElection() external onlyGovernance {
        // Check no active election
        if (currentElectionId > 0) {
            Election storage current = _elections[currentElectionId];
            if (!current.finalized && block.timestamp <= current.votingEnd) {
                revert ElectionAlreadyActive();
            }
        }
        
        currentElectionId++;
        
        uint256 nominationEnd = block.timestamp + NOMINATION_PERIOD;
        uint256 votingEnd = nominationEnd + VOTING_PERIOD;
        
        _elections[currentElectionId] = Election({
            id: currentElectionId,
            nominationStart: block.timestamp,
            nominationEnd: nominationEnd,
            votingEnd: votingEnd,
            candidateCount: 0,
            finalized: false,
            winners: [address(0), address(0), address(0), address(0), address(0), address(0), address(0), address(0), address(0)]
        });
        
        emit ElectionStarted(currentElectionId, nominationEnd, votingEnd);
    }
    
    /// @notice Nominate self as candidate
    /// @dev Requires minimum veQS balance
    function nominate() external {
        Election storage election = _elections[currentElectionId];
        
        if (election.nominationStart == 0) revert ElectionNotActive();
        if (block.timestamp > election.nominationEnd) revert NominationPeriodEnded();
        
        // Check veQS balance
        uint256 votingPower = veqs.getVotingPower(msg.sender);
        if (votingPower < MIN_VEQS_TO_NOMINATE) revert InsufficientVeQS();
        
        // Check not already nominated
        if (_candidates[currentElectionId][msg.sender].nominated) revert AlreadyNominated();
        
        // Check term limits
        if (!_canServeNewTerm(msg.sender)) revert MaxConsecutiveTermsReached();
        
        // Add candidate
        _candidates[currentElectionId][msg.sender] = Candidate({
            addr: msg.sender,
            veQSBalance: votingPower,
            votesReceived: 0,
            nominated: true
        });
        
        _candidateList[currentElectionId].push(msg.sender);
        election.candidateCount++;
        
        emit CandidateNominated(currentElectionId, msg.sender, votingPower);
    }
    
    /// @notice Cast vote for a candidate
    /// @param candidate Candidate address to vote for
    function vote(address candidate) external {
        Election storage election = _elections[currentElectionId];
        
        if (election.nominationStart == 0) revert ElectionNotActive();
        if (block.timestamp <= election.nominationEnd) revert VotingPeriodNotStarted();
        if (block.timestamp > election.votingEnd) revert VotingPeriodEnded();
        
        // Check veQS balance
        uint256 votingPower = veqs.getEffectiveVotingPower(msg.sender);
        if (votingPower < MIN_VEQS_TO_VOTE) revert InsufficientVeQS();
        
        // Check not already voted
        if (_hasVoted[currentElectionId][msg.sender]) revert AlreadyVoted();
        
        // Check valid candidate
        if (!_candidates[currentElectionId][candidate].nominated) revert InvalidCandidate();
        
        // Record vote
        _hasVoted[currentElectionId][msg.sender] = true;
        _voterChoice[currentElectionId][msg.sender] = candidate;
        _candidates[currentElectionId][candidate].votesReceived += votingPower;
        
        emit VoteCast(currentElectionId, msg.sender, candidate, votingPower);
    }
    
    /// @notice Finalize election and update Security Council
    function finalize() external {
        Election storage election = _elections[currentElectionId];
        
        if (election.nominationStart == 0) revert ElectionNotActive();
        if (block.timestamp <= election.votingEnd) revert VotingPeriodNotStarted();
        if (election.finalized) revert ElectionAlreadyFinalized();
        if (election.candidateCount < MAX_MEMBERS) revert NotEnoughCandidates();
        
        // Sort candidates by votes (selection sort for small array)
        address[] memory sortedCandidates = _sortCandidatesByVotes(currentElectionId);
        
        // Get top 9 as winners
        address[9] memory winners;
        for (uint256 i = 0; i < MAX_MEMBERS; i++) {
            winners[i] = sortedCandidates[i];
        }
        
        election.winners = winners;
        election.finalized = true;
        
        // Update Security Council members
        _applyElectionResults(winners);
        
        emit ElectionFinalized(currentElectionId, winners);
    }
    
    // ============ Term Management ============
    
    /// @notice Check if a member can serve a new term
    /// @param member Address to check
    /// @return canServe True if member can serve new term
    function _canServeNewTerm(address member) internal view returns (bool) {
        TermInfo storage info = _termInfo[member];
        
        // First time candidate
        if (info.termNumber == 0) return true;
        
        // Check if had a break (missed at least one election)
        // If lastElectionId + 1 < currentElectionId, they missed an election
        if (info.lastElectionId > 0 && info.lastElectionId + 1 < currentElectionId) {
            return true; // Had a break, reset allowed
        }
        
        // Check consecutive terms
        return info.consecutiveTerms < MAX_CONSECUTIVE_TERMS;
    }
    
    /// @notice Get consecutive terms for a member
    /// @param member Member address
    /// @return Number of consecutive terms
    function getConsecutiveTerms(address member) external view returns (uint256) {
        return _termInfo[member].consecutiveTerms;
    }
    
    /// @notice Get term end time for a member
    /// @param member Member address
    /// @return Term end timestamp
    function getTermEnd(address member) external view returns (uint256) {
        return _termInfo[member].endTime;
    }
    
    // ============ Internal Functions ============
    
    /// @notice Sort candidates by votes received (descending)
    /// @param electionId Election ID
    /// @return Sorted array of candidate addresses
    function _sortCandidatesByVotes(uint256 electionId) internal view returns (address[] memory) {
        address[] memory candidates = _candidateList[electionId];
        uint256 len = candidates.length;
        
        // Selection sort (simple, gas efficient for small arrays)
        for (uint256 i = 0; i < len - 1; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < len; j++) {
                if (_candidates[electionId][candidates[j]].votesReceived > 
                    _candidates[electionId][candidates[maxIdx]].votesReceived) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                address temp = candidates[i];
                candidates[i] = candidates[maxIdx];
                candidates[maxIdx] = temp;
            }
        }
        
        return candidates;
    }
    
    /// @notice Apply election results to Security Council
    /// @param winners Array of 9 winning addresses
    function _applyElectionResults(address[9] memory winners) internal {
        uint256 termStart = block.timestamp;
        uint256 termEnd = block.timestamp + TERM_DURATION;
        
        for (uint256 i = 0; i < MAX_MEMBERS; i++) {
            address currentMember = securityCouncil.getMember(i);
            address newMember = winners[i];
            
            // End term for current member if different
            if (currentMember != newMember) {
                // End old member's term
                if (_termInfo[currentMember].termNumber > 0) {
                    _lastTermEnd[currentMember] = block.timestamp;
                    emit TermEnded(currentMember, _termInfo[currentMember].termNumber);
                }
                
                emit MemberRotated(currentMember, newMember, i);
            }
            
            // Update term info for new member
            TermInfo storage info = _termInfo[newMember];
            
            // Check if continuing or starting fresh
            // Continuing = won the immediately previous election
            if (info.lastElectionId > 0 && info.lastElectionId + 1 == currentElectionId) {
                // Continuing - increment consecutive terms
                info.consecutiveTerms++;
            } else {
                // Fresh start or after break
                info.consecutiveTerms = 1;
            }
            
            info.termNumber++;
            info.startTime = termStart;
            info.endTime = termEnd;
            info.lastElectionId = currentElectionId;
            
            emit TermStarted(newMember, info.termNumber, termStart, termEnd);
        }
    }
    
    // ============ View Functions ============
    
    /// @notice Get election info
    /// @param electionId Election ID
    /// @return Election data
    function getElection(uint256 electionId) external view returns (Election memory) {
        return _elections[electionId];
    }
    
    /// @notice Get candidate info
    /// @param electionId Election ID
    /// @param candidate Candidate address
    /// @return Candidate data
    function getCandidate(uint256 electionId, address candidate) external view returns (Candidate memory) {
        return _candidates[electionId][candidate];
    }
    
    /// @notice Get all candidates for an election
    /// @param electionId Election ID
    /// @return Array of candidate addresses
    function getCandidates(uint256 electionId) external view returns (address[] memory) {
        return _candidateList[electionId];
    }
    
    /// @notice Check if address has voted
    /// @param electionId Election ID
    /// @param voter Voter address
    /// @return True if voted
    function hasVoted(uint256 electionId, address voter) external view returns (bool) {
        return _hasVoted[electionId][voter];
    }
    
    /// @notice Check if address is nominated
    /// @param candidate Candidate address
    /// @return True if nominated in current election
    function isNominated(address candidate) external view returns (bool) {
        return _candidates[currentElectionId][candidate].nominated;
    }
    
    /// @notice Get votes received by candidate
    /// @param candidate Candidate address
    /// @return Number of votes
    function getVotesReceived(address candidate) external view returns (uint256) {
        return _candidates[currentElectionId][candidate].votesReceived;
    }
    
    /// @notice Get election winners
    /// @param electionId Election ID
    /// @return Array of 9 winner addresses
    function getWinners(uint256 electionId) external view returns (address[9] memory) {
        if (!_elections[electionId].finalized) revert ElectionNotFinalized();
        return _elections[electionId].winners;
    }
    
    /// @notice Get term info for member
    /// @param member Member address
    /// @return Term info struct
    function getTermInfo(address member) external view returns (TermInfo memory) {
        return _termInfo[member];
    }
    
    /// @notice Check if election is in nomination period
    /// @return True if in nomination period
    function isNominationPeriod() external view returns (bool) {
        Election storage election = _elections[currentElectionId];
        return election.nominationStart > 0 && 
               block.timestamp <= election.nominationEnd;
    }
    
    /// @notice Check if election is in voting period
    /// @return True if in voting period
    function isVotingPeriod() external view returns (bool) {
        Election storage election = _elections[currentElectionId];
        return election.nominationStart > 0 && 
               block.timestamp > election.nominationEnd &&
               block.timestamp <= election.votingEnd;
    }
    
    /// @notice Set new governance address
    /// @param newGovernance New governance address
    function setGovernance(address newGovernance) external onlyGovernance {
        require(newGovernance != address(0), "Invalid governance");
        governance = newGovernance;
    }
}
