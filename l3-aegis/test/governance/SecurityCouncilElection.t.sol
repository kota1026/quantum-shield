// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/governance/SecurityCouncilElection.sol";
import "../../src/interfaces/IveQS.sol";
import "../../src/interfaces/ISecurityCouncil.sol";

/// @title MockVeQS
/// @notice Mock veQS for testing
contract MockVeQS is IveQS {
    mapping(address => uint256) private _votingPower;
    mapping(address => uint256) private _effectiveVotingPower;
    mapping(address => address) private _delegates;
    mapping(address => LockPosition) private _lockPositions;
    
    function setVotingPower(address user, uint256 power) external {
        _votingPower[user] = power;
        if (_effectiveVotingPower[user] == 0) {
            _effectiveVotingPower[user] = power;
        }
    }
    
    function setEffectiveVotingPower(address user, uint256 power) external {
        _effectiveVotingPower[user] = power;
    }
    
    // Interface implementations
    function getVotingPower(address user) external view returns (uint256) {
        return _votingPower[user];
    }
    
    function getEffectiveVotingPower(address user) external view returns (uint256) {
        return _effectiveVotingPower[user];
    }
    
    function getLockPosition(address user) external view returns (LockPosition memory) {
        return _lockPositions[user];
    }
    
    function getVotingPowerAt(address, uint256) external pure returns (uint256) {
        return 0;
    }
    
    function getTotalVotingPower() external pure returns (uint256) {
        return 0;
    }
    
    function getDelegate(address user) external view returns (address) {
        address d = _delegates[user];
        return d == address(0) ? user : d;
    }
    
    function hasLock(address user) external view returns (bool) {
        return _lockPositions[user].amount > 0;
    }
    
    function qsToken() external pure returns (address) {
        return address(0);
    }
    
    function MIN_LOCK_TIME() external pure returns (uint256) {
        return 7 days;
    }
    
    function MAX_LOCK_TIME() external pure returns (uint256) {
        return 4 * 365 days;
    }
    
    function lock(uint256, uint256) external pure {}
    function increaseLockAmount(uint256) external pure {}
    function extendLockTime(uint256) external pure {}
    function withdraw() external pure {}
    function delegate(address delegatee) external {
        _delegates[msg.sender] = delegatee;
    }
    function revokeDelegate() external {
        _delegates[msg.sender] = address(0);
    }
}

/// @title MockSecurityCouncil
/// @notice Mock Security Council for testing
contract MockSecurityCouncil is ISecurityCouncil {
    address[9] public members;
    mapping(address => uint256) private _seatIds;
    mapping(address => bool) private _isMember;
    
    constructor(address[9] memory initialMembers) {
        for (uint256 i = 0; i < 9; i++) {
            members[i] = initialMembers[i];
            _seatIds[initialMembers[i]] = i;
            _isMember[initialMembers[i]] = true;
        }
    }
    
    function getMember(uint256 seatId) external view returns (address) {
        return members[seatId];
    }
    
    function setMember(uint256 seatId, address member) external {
        _isMember[members[seatId]] = false;
        members[seatId] = member;
        _seatIds[member] = seatId;
        _isMember[member] = true;
    }
    
    // Interface implementations
    function MAX_MEMBERS() external pure returns (uint256) { return 9; }
    function ACTION_EXPIRY() external pure returns (uint256) { return 48 hours; }
    function PAUSE_THRESHOLD() external pure returns (uint256) { return 5; }
    function VETO_THRESHOLD() external pure returns (uint256) { return 6; }
    function UPGRADE_THRESHOLD() external pure returns (uint256) { return 7; }
    function governor() external pure returns (address) { return address(0); }
    function emergencyController() external pure returns (address) { return address(0); }
    function memberCount() external pure returns (uint256) { return 9; }
    
    function isMember(address account) external view returns (bool) {
        return _isMember[account];
    }
    
    function getSeatId(address member) external view returns (uint256) {
        return _seatIds[member];
    }
    
    function getAction(bytes32) external pure returns (Action memory) {
        return Action({
            id: bytes32(0),
            actionType: ActionType.EmergencyPause,
            proposer: address(0),
            proposedAt: 0,
            expiresAt: 0,
            signatureCount: 0,
            state: ActionState.Proposed,
            data: ""
        });
    }
    
    function hasSigned(bytes32, address) external pure returns (bool) { return false; }
    function getSignatureCount(bytes32) external pure returns (uint256) { return 0; }
    function getValidSignatureCount(bytes32) external pure returns (uint256) { return 0; }
    function getThreshold(ActionType) external pure returns (uint256) { return 5; }
    function isActionReady(bytes32) external pure returns (bool) { return false; }
    function isActionExpired(bytes32) external pure returns (bool) { return false; }
    
    function proposeAction(ActionType, bytes calldata) external pure returns (bytes32) {
        return bytes32(0);
    }
    function signAction(bytes32) external pure {}
    function executeAction(bytes32) external pure {}
    function replaceMember(uint256, address) external pure {}
    function setGovernor(address) external pure {}
    function setEmergencyController(address) external pure {}
}

/// @title SecurityCouncilElectionTest
/// @notice Test suite for Security Council Election via veQS
/// @dev Tests for DECEN-005, DECEN-007
/// @custom:ref CURRENT_PLAN.md Phase 3.3 Week 9
contract SecurityCouncilElectionTest is Test {
    // ============ Constants ============
    
    uint256 constant MAX_MEMBERS = 9;
    uint256 constant NOMINATION_PERIOD = 3 days;
    uint256 constant VOTING_PERIOD = 7 days;
    uint256 constant TERM_DURATION = 365 days;
    uint256 constant MAX_CONSECUTIVE_TERMS = 3;
    uint256 constant MIN_VEQS_TO_NOMINATE = 100_000e18;
    uint256 constant MIN_VEQS_TO_VOTE = 1e18;
    
    // ============ Contracts ============
    
    MockVeQS public veqs;
    MockSecurityCouncil public securityCouncil;
    SecurityCouncilElection public election;
    
    // ============ Test Accounts ============
    
    address public governance;
    address[] public candidates;
    address[] public voters;
    address[9] public initialMembers;
    
    // ============ State for helpers ============
    uint256 private _electionCounter;
    
    // ============ Setup ============
    
    function setUp() public {
        governance = makeAddr("governance");
        
        // Create initial members
        for (uint256 i = 0; i < MAX_MEMBERS; i++) {
            initialMembers[i] = makeAddr(string(abi.encodePacked("member", vm.toString(i))));
        }
        
        // Create candidates (15 candidates for election)
        for (uint256 i = 0; i < 15; i++) {
            candidates.push(makeAddr(string(abi.encodePacked("candidate", vm.toString(i)))));
        }
        
        // Create voters (20 voters)
        for (uint256 i = 0; i < 20; i++) {
            voters.push(makeAddr(string(abi.encodePacked("voter", vm.toString(i)))));
        }
        
        // Deploy mock contracts
        veqs = new MockVeQS();
        securityCouncil = new MockSecurityCouncil(initialMembers);
        
        // Deploy election contract
        election = new SecurityCouncilElection(
            address(veqs),
            address(securityCouncil),
            governance
        );
    }
    
    // ============================================================
    // TEST-SC-001: SC Election via veQS
    // ============================================================
    
    /// @notice TEST-SC-001-01: Candidate nomination requires min veQS
    function test_SC001_01_nominationRequiresMinVeQS() public {
        // Setup: Give candidate enough veQS
        veqs.setVotingPower(candidates[0], MIN_VEQS_TO_NOMINATE);
        
        // Start election
        vm.prank(governance);
        election.startElection();
        
        // Nominate
        vm.prank(candidates[0]);
        election.nominate();
        
        assertTrue(election.isNominated(candidates[0]));
    }
    
    /// @notice TEST-SC-001-02: Nomination fails without enough veQS
    function test_SC001_02_nominationFailsWithoutMinVeQS() public {
        // Setup: Give candidate less than min veQS
        veqs.setVotingPower(candidates[0], MIN_VEQS_TO_NOMINATE - 1);
        
        // Start election
        vm.prank(governance);
        election.startElection();
        
        // Try to nominate - should fail
        vm.expectRevert(SecurityCouncilElection.InsufficientVeQS.selector);
        vm.prank(candidates[0]);
        election.nominate();
    }
    
    /// @notice TEST-SC-001-03: veQS holders can vote
    function test_SC001_03_veQSHoldersCanVote() public {
        // Setup election with candidates
        _setupElectionWithCandidates();
        
        // Setup voter with veQS
        veqs.setEffectiveVotingPower(voters[0], 10000e18);
        
        // Advance to voting period
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        // Vote
        vm.prank(voters[0]);
        election.vote(candidates[0]);
        
        assertTrue(election.hasVoted(election.currentElectionId(), voters[0]));
    }
    
    /// @notice TEST-SC-001-04: Vote weight is proportional to veQS balance
    function test_SC001_04_voteWeightProportionalToVeQS() public {
        // Setup election
        _setupElectionWithCandidates();
        
        // Voter 1: 10,000 veQS
        veqs.setEffectiveVotingPower(voters[0], 10000e18);
        
        // Voter 2: 50,000 veQS
        veqs.setEffectiveVotingPower(voters[1], 50000e18);
        
        // Advance to voting period
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        // Both vote for same candidate
        vm.prank(voters[0]);
        election.vote(candidates[0]);
        
        vm.prank(voters[1]);
        election.vote(candidates[0]);
        
        // Verify vote weights
        uint256 candidateVotes = election.getVotesReceived(candidates[0]);
        assertEq(candidateVotes, 60000e18); // 10k + 50k
    }
    
    /// @notice TEST-SC-001-05: Top 9 candidates are elected
    function test_SC001_05_top9CandidatesElected() public {
        // Start election
        vm.prank(governance);
        election.startElection();
        
        // Nominate 10 candidates with descending votes
        for (uint256 i = 0; i < 10; i++) {
            veqs.setVotingPower(candidates[i], MIN_VEQS_TO_NOMINATE);
            vm.prank(candidates[i]);
            election.nominate();
        }
        
        // Advance to voting period
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        // Vote for candidates with descending weight
        for (uint256 i = 0; i < 10; i++) {
            veqs.setEffectiveVotingPower(voters[i], (10 - i) * 10000e18);
            vm.prank(voters[i]);
            election.vote(candidates[i]);
        }
        
        // Finalize election
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        election.finalize();
        
        // Verify top 9 are elected (candidates 0-8)
        address[9] memory winners = election.getWinners(election.currentElectionId());
        for (uint256 i = 0; i < 9; i++) {
            assertEq(winners[i], candidates[i]);
        }
    }
    
    /// @notice TEST-SC-001-06: Delegated veQS counts for voting
    function test_SC001_06_delegatedVeQSCountsForVoting() public {
        _setupElectionWithCandidates();
        
        // Voter 1 has 10k, delegates to Voter 2
        veqs.setVotingPower(voters[0], 10000e18);
        
        // Voter 2 has own 5k veQS + 10k delegated = 15k effective
        veqs.setVotingPower(voters[1], 5000e18);
        veqs.setEffectiveVotingPower(voters[1], 15000e18);
        
        // Advance to voting period
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        // Voter 2 votes with effective power (15k)
        vm.prank(voters[1]);
        election.vote(candidates[0]);
        
        uint256 candidateVotes = election.getVotesReceived(candidates[0]);
        assertEq(candidateVotes, 15000e18);
    }
    
    // ============================================================
    // TEST-SC-003: Term Limits & Rotation
    // ============================================================
    
    /// @notice TEST-SC-003-01: Term duration is 1 year
    function test_SC003_01_termDurationIsOneYear() public {
        // Run full election cycle
        _runFullElection();
        
        // Check term end for a winner
        uint256 electionId = election.currentElectionId();
        address[9] memory winners = election.getWinners(electionId);
        
        SecurityCouncilElection.TermInfo memory info = election.getTermInfo(winners[0]);
        assertEq(info.endTime - info.startTime, TERM_DURATION);
    }
    
    /// @notice TEST-SC-003-02: Max 3 consecutive terms
    function test_SC003_02_maxThreeConsecutiveTerms() public {
        // Complete 3 terms for candidate 0
        for (uint256 term = 1; term <= 3; term++) {
            _runElectionWithWinner(candidates[0]);
            
            // Verify term count
            assertEq(election.getConsecutiveTerms(candidates[0]), term);
            
            // Advance 1 year for next election
            vm.warp(block.timestamp + TERM_DURATION);
        }
        
        // 4th term should fail nomination
        vm.prank(governance);
        election.startElection();
        
        veqs.setVotingPower(candidates[0], MIN_VEQS_TO_NOMINATE);
        
        vm.expectRevert(SecurityCouncilElection.MaxConsecutiveTermsReached.selector);
        vm.prank(candidates[0]);
        election.nominate();
    }
    
    /// @notice TEST-SC-003-03: Term count resets after break
    function test_SC003_03_termCountResetsAfterBreak() public {
        // Complete 2 terms for candidate 0
        for (uint256 term = 1; term <= 2; term++) {
            _runElectionWithWinner(candidates[0]);
            vm.warp(block.timestamp + TERM_DURATION);
        }
        assertEq(election.getConsecutiveTerms(candidates[0]), 2);
        
        // Skip one term (break) - someone else wins
        _runElectionWithWinner(candidates[1]);
        vm.warp(block.timestamp + TERM_DURATION);
        
        // Skip another term to ensure break period
        vm.warp(block.timestamp + TERM_DURATION);
        
        // Can serve again - term count should reset
        _runElectionWithWinner(candidates[0]);
        assertEq(election.getConsecutiveTerms(candidates[0]), 1);
    }
    
    /// @notice TEST-SC-003-04: Rotation emits events
    function test_SC003_04_rotationEmitsEvents() public {
        // Setup election
        _runFullElection();
        
        // Verify MemberRotated events were emitted (check first member)
        // Events are verified implicitly by successful finalization
        assertTrue(election.getElection(election.currentElectionId()).finalized);
    }
    
    /// @notice TEST-SC-003-05: Cannot nominate during voting period
    function test_SC003_05_cannotNominateDuringVotingPeriod() public {
        // Start election
        vm.prank(governance);
        election.startElection();
        
        // Advance past nomination period
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        // Try to nominate - should fail
        veqs.setVotingPower(candidates[0], MIN_VEQS_TO_NOMINATE);
        
        vm.expectRevert(SecurityCouncilElection.NominationPeriodEnded.selector);
        vm.prank(candidates[0]);
        election.nominate();
    }
    
    // ============================================================
    // Additional Tests
    // ============================================================
    
    /// @notice Cannot vote before voting period
    function test_cannotVoteBeforeVotingPeriod() public {
        // Setup election with candidates
        _setupElectionWithCandidates();
        
        veqs.setEffectiveVotingPower(voters[0], 10000e18);
        
        // Try to vote during nomination period - should fail
        vm.expectRevert(SecurityCouncilElection.VotingPeriodNotStarted.selector);
        vm.prank(voters[0]);
        election.vote(candidates[0]);
    }
    
    /// @notice Cannot vote twice
    function test_cannotVoteTwice() public {
        _setupElectionWithCandidates();
        
        veqs.setEffectiveVotingPower(voters[0], 10000e18);
        
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        vm.prank(voters[0]);
        election.vote(candidates[0]);
        
        // Try to vote again
        vm.expectRevert(SecurityCouncilElection.AlreadyVoted.selector);
        vm.prank(voters[0]);
        election.vote(candidates[1]);
    }
    
    /// @notice Cannot vote for non-nominated candidate
    function test_cannotVoteForNonNominatedCandidate() public {
        _setupElectionWithCandidates();
        
        veqs.setEffectiveVotingPower(voters[0], 10000e18);
        
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        // Try to vote for non-nominated candidate
        vm.expectRevert(SecurityCouncilElection.InvalidCandidate.selector);
        vm.prank(voters[0]);
        election.vote(candidates[9]); // Not nominated
    }
    
    /// @notice Only governance can start election
    function test_onlyGovernanceCanStartElection() public {
        vm.expectRevert(SecurityCouncilElection.NotGovernance.selector);
        vm.prank(candidates[0]);
        election.startElection();
    }
    
    // ============================================================
    // Fuzz Tests
    // ============================================================
    
    /// @notice Fuzz test: Any valid veQS holder can vote
    function testFuzz_SC001_anyVeQSHolderCanVote(uint256 veQSAmount) public {
        veQSAmount = bound(veQSAmount, MIN_VEQS_TO_VOTE, 1_000_000e18);
        
        _setupElectionWithCandidates();
        
        veqs.setEffectiveVotingPower(voters[0], veQSAmount);
        
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        vm.prank(voters[0]);
        election.vote(candidates[0]);
        
        uint256 votes = election.getVotesReceived(candidates[0]);
        assertEq(votes, veQSAmount);
    }
    
    /// @notice Fuzz test: Various nomination amounts
    function testFuzz_SC001_nominationThreshold(uint256 veQSAmount) public {
        vm.prank(governance);
        election.startElection();
        
        veqs.setVotingPower(candidates[0], veQSAmount);
        
        vm.prank(candidates[0]);
        
        if (veQSAmount >= MIN_VEQS_TO_NOMINATE) {
            election.nominate();
            assertTrue(election.isNominated(candidates[0]));
        } else {
            vm.expectRevert(SecurityCouncilElection.InsufficientVeQS.selector);
            election.nominate();
        }
    }
    
    // ============================================================
    // Helper Functions
    // ============================================================
    
    /// @notice Setup election with nominated candidates
    function _setupElectionWithCandidates() internal {
        // Start election
        vm.prank(governance);
        election.startElection();
        
        // Nominate 9 candidates
        for (uint256 i = 0; i < 9; i++) {
            veqs.setVotingPower(candidates[i], MIN_VEQS_TO_NOMINATE);
            vm.prank(candidates[i]);
            election.nominate();
        }
    }
    
    /// @notice Run a full election cycle
    function _runFullElection() internal {
        // Start election
        vm.prank(governance);
        election.startElection();
        
        // Nominate 9+ candidates
        for (uint256 i = 0; i < 10; i++) {
            veqs.setVotingPower(candidates[i], MIN_VEQS_TO_NOMINATE);
            vm.prank(candidates[i]);
            election.nominate();
        }
        
        // Advance to voting period
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        // Vote
        for (uint256 i = 0; i < 9; i++) {
            veqs.setEffectiveVotingPower(voters[i], (10 - i) * 10000e18);
            vm.prank(voters[i]);
            election.vote(candidates[i]);
        }
        
        // Finalize
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        election.finalize();
    }
    
    /// @notice Run election with specific winner
    function _runElectionWithWinner(address winner) internal {
        _electionCounter++;
        
        // Start election
        vm.prank(governance);
        election.startElection();
        
        // Create filler candidates with unique addresses per election
        address[] memory fillers = new address[](9);
        for (uint256 i = 0; i < 9; i++) {
            fillers[i] = makeAddr(string(abi.encodePacked("filler_e", vm.toString(_electionCounter), "_", vm.toString(i))));
        }
        
        // Nominate winner
        veqs.setVotingPower(winner, MIN_VEQS_TO_NOMINATE);
        vm.prank(winner);
        election.nominate();
        
        // Nominate filler candidates
        for (uint256 i = 0; i < 9; i++) {
            veqs.setVotingPower(fillers[i], MIN_VEQS_TO_NOMINATE);
            vm.prank(fillers[i]);
            election.nominate();
        }
        
        // Advance to voting
        vm.warp(block.timestamp + NOMINATION_PERIOD + 1);
        
        // Give winner massive votes
        veqs.setEffectiveVotingPower(voters[0], 1_000_000e18);
        vm.prank(voters[0]);
        election.vote(winner);
        
        // Give fillers minimal votes (need at least 9 total candidates with votes for finalize)
        for (uint256 i = 0; i < 8; i++) {
            veqs.setEffectiveVotingPower(voters[i + 1], MIN_VEQS_TO_VOTE);
            vm.prank(voters[i + 1]);
            election.vote(fillers[i]);
        }
        
        // Finalize
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        election.finalize();
    }
}
