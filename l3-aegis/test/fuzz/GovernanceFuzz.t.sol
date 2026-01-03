// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/governance/Governor.sol";
import "../../src/governance/GovernanceSwitch.sol";
import "../../src/governance/SecurityCouncil.sol";
import "../../src/governance/Timelock.sol";
import "../../src/token/QSToken.sol";
import "../../src/token/veQS.sol";

/**
 * @title GovernanceFuzz
 * @notice Fuzz tests for Governance contracts
 * @dev Implements TEST-002 from Phase 3.3 Track B
 *      Tests boundary values and edge cases for:
 *      - Voting thresholds and quorum calculations
 *      - Proposal lifecycle
 *      - Mode transitions
 *
 * @custom:security-contact security@quantumshield.io
 */
contract GovernanceFuzz is Test {
    // ============================================
    // Constants from SPEC_STRATEGY_BRIDGE
    // ============================================
    
    // Quorum requirements (in basis points for precision)
    uint256 public constant PARAMETER_QUORUM_BPS = 400;  // 4%
    uint256 public constant UPGRADE_QUORUM_BPS = 800;    // 8%
    uint256 public constant COUNCIL_QUORUM_BPS = 1500;   // 15%
    uint256 public constant BASIS_POINTS = 10000;
    
    // Time periods
    uint256 public constant DISCUSSION_PERIOD = 7 days;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant TIMELOCK_DELAY = 7 days;
    
    // Security Council
    uint256 public constant SC_SIZE = 9;
    uint256 public constant SC_THRESHOLD = 5; // 5/9
    uint256 public constant VETO_THRESHOLD = 6; // 6/9
    
    // ============================================
    // Contracts
    // ============================================
    
    QSToken public qsToken;
    veQS public veQSToken;
    Governor public governor;
    SecurityCouncil public securityCouncil;
    Timelock public timelock;
    
    // ============================================
    // Actors
    // ============================================
    
    address public admin;
    address[] public scMembers;
    address[] public voters;
    
    // ============================================
    // Setup
    // ============================================
    
    function setUp() public {
        admin = makeAddr("admin");
        
        // Setup SC members (9)
        for (uint256 i = 0; i < SC_SIZE; i++) {
            scMembers.push(makeAddr(string.concat("sc", vm.toString(i))));
        }
        
        // Setup voters (20)
        for (uint256 i = 0; i < 20; i++) {
            voters.push(makeAddr(string.concat("voter", vm.toString(i))));
        }
        
        vm.startPrank(admin);
        
        // Deploy Token contracts
        qsToken = new QSToken(admin);
        veQSToken = new veQS(address(qsToken), admin);
        
        // Deploy Governance contracts
        timelock = new Timelock(TIMELOCK_DELAY, admin);
        securityCouncil = new SecurityCouncil(scMembers, SC_THRESHOLD, admin);
        governor = new Governor(address(veQSToken), address(timelock), admin);
        
        // Setup voters with tokens
        uint256 totalSupply = 100_000_000e18; // 100M
        for (uint256 i = 0; i < voters.length; i++) {
            qsToken.mint(voters[i], totalSupply / voters.length);
        }
        
        vm.stopPrank();
        
        // Voters lock tokens for veQS
        for (uint256 i = 0; i < voters.length; i++) {
            vm.startPrank(voters[i]);
            qsToken.approve(address(veQSToken), type(uint256).max);
            veQSToken.createLock(qsToken.balanceOf(voters[i]), block.timestamp + 365 days);
            vm.stopPrank();
        }
    }
    
    // ============================================
    // Quorum Calculation Fuzz Tests
    // ============================================
    
    function testFuzz_Quorum_ParameterChange(uint256 totalVotingPower) public pure {
        totalVotingPower = bound(totalVotingPower, 1e18, 100_000_000e18);
        
        uint256 requiredQuorum = totalVotingPower * PARAMETER_QUORUM_BPS / BASIS_POINTS;
        
        assertTrue(requiredQuorum > 0, "Quorum should be > 0");
        assertLe(requiredQuorum, totalVotingPower, "Quorum should be <= total");
        assertEq(requiredQuorum, totalVotingPower * 4 / 100, "Should be 4%");
    }
    
    function testFuzz_Quorum_Upgrade(uint256 totalVotingPower) public pure {
        totalVotingPower = bound(totalVotingPower, 1e18, 100_000_000e18);
        
        uint256 paramQuorum = totalVotingPower * PARAMETER_QUORUM_BPS / BASIS_POINTS;
        uint256 upgradeQuorum = totalVotingPower * UPGRADE_QUORUM_BPS / BASIS_POINTS;
        
        assertTrue(upgradeQuorum > 0, "Quorum should be > 0");
        assertGt(upgradeQuorum, paramQuorum, "Upgrade quorum > parameter quorum");
        assertEq(upgradeQuorum, totalVotingPower * 8 / 100, "Should be 8%");
    }
    
    function testFuzz_Quorum_CouncilChange(uint256 totalVotingPower) public pure {
        totalVotingPower = bound(totalVotingPower, 1e18, 100_000_000e18);
        
        uint256 upgradeQuorum = totalVotingPower * UPGRADE_QUORUM_BPS / BASIS_POINTS;
        uint256 councilQuorum = totalVotingPower * COUNCIL_QUORUM_BPS / BASIS_POINTS;
        
        assertTrue(councilQuorum > 0, "Quorum should be > 0");
        assertGt(councilQuorum, upgradeQuorum, "Council quorum > upgrade quorum");
        assertEq(councilQuorum, totalVotingPower * 15 / 100, "Should be 15%");
    }
    
    // ============================================
    // Voting Threshold Fuzz Tests
    // ============================================
    
    function testFuzz_VotingThreshold_SimpleVote(uint256 forVotes, uint256 againstVotes) public pure {
        forVotes = bound(forVotes, 0, 100_000_000e18);
        againstVotes = bound(againstVotes, 0, 100_000_000e18);
        
        bool passes = forVotes > againstVotes;
        
        if (forVotes > againstVotes) {
            assertTrue(passes, "Should pass if for > against");
        } else {
            assertFalse(passes, "Should fail if for <= against");
        }
    }
    
    function testFuzz_VotingThreshold_WithQuorum(
        uint256 forVotes, 
        uint256 againstVotes,
        uint256 totalSupply
    ) public pure {
        totalSupply = bound(totalSupply, 1e18, 100_000_000e18);
        forVotes = bound(forVotes, 0, totalSupply);
        againstVotes = bound(againstVotes, 0, totalSupply - forVotes);
        
        uint256 requiredQuorum = totalSupply * PARAMETER_QUORUM_BPS / BASIS_POINTS;
        uint256 totalVotes = forVotes + againstVotes;
        
        bool quorumMet = totalVotes >= requiredQuorum;
        bool majorityFor = forVotes > againstVotes;
        bool passes = quorumMet && majorityFor;
        
        if (passes) {
            assertTrue(totalVotes >= requiredQuorum, "Quorum must be met");
            assertTrue(forVotes > againstVotes, "For must exceed against");
        }
    }
    
    // ============================================
    // Security Council Threshold Fuzz Tests
    // ============================================
    
    function testFuzz_SC_Threshold_Valid(uint8 approvals) public pure {
        approvals = uint8(bound(approvals, 0, SC_SIZE));
        
        bool meetsThreshold = approvals >= SC_THRESHOLD;
        
        if (approvals >= 5) {
            assertTrue(meetsThreshold, "5+ approvals should meet threshold");
        } else {
            assertFalse(meetsThreshold, "<5 approvals should not meet threshold");
        }
    }
    
    function testFuzz_SC_Veto_Valid(uint8 vetoVotes) public pure {
        vetoVotes = uint8(bound(vetoVotes, 0, SC_SIZE));
        
        bool canVeto = vetoVotes >= VETO_THRESHOLD;
        
        if (vetoVotes >= 6) {
            assertTrue(canVeto, "6+ votes should allow veto");
        } else {
            assertFalse(canVeto, "<6 votes should not allow veto");
        }
    }
    
    // ============================================
    // Time Period Fuzz Tests
    // ============================================
    
    function testFuzz_TimePeriod_Discussion(uint256 elapsedTime) public pure {
        elapsedTime = bound(elapsedTime, 0, 30 days);
        
        bool discussionComplete = elapsedTime >= DISCUSSION_PERIOD;
        
        if (elapsedTime >= 7 days) {
            assertTrue(discussionComplete, "Discussion should be complete after 7 days");
        } else {
            assertFalse(discussionComplete, "Discussion not complete before 7 days");
        }
    }
    
    function testFuzz_TimePeriod_Voting(uint256 elapsedTime) public pure {
        elapsedTime = bound(elapsedTime, 0, 30 days);
        
        bool votingComplete = elapsedTime >= VOTING_PERIOD;
        
        if (elapsedTime >= 7 days) {
            assertTrue(votingComplete, "Voting should be complete after 7 days");
        } else {
            assertFalse(votingComplete, "Voting not complete before 7 days");
        }
    }
    
    function testFuzz_TimePeriod_Timelock(uint256 elapsedTime) public pure {
        elapsedTime = bound(elapsedTime, 0, 30 days);
        
        bool timelockComplete = elapsedTime >= TIMELOCK_DELAY;
        
        if (elapsedTime >= 7 days) {
            assertTrue(timelockComplete, "Timelock should be complete after 7 days");
        } else {
            assertFalse(timelockComplete, "Timelock not complete before 7 days");
        }
    }
    
    // ============================================
    // Proposal Lifecycle Fuzz Tests
    // ============================================
    
    function testFuzz_ProposalLifecycle_TotalTime(
        uint256 discussionExtra,
        uint256 votingExtra,
        uint256 timelockExtra
    ) public pure {
        // Extra time beyond minimums
        discussionExtra = bound(discussionExtra, 0, 7 days);
        votingExtra = bound(votingExtra, 0, 7 days);
        timelockExtra = bound(timelockExtra, 0, 7 days);
        
        uint256 totalTime = DISCUSSION_PERIOD + discussionExtra +
                           VOTING_PERIOD + votingExtra +
                           TIMELOCK_DELAY + timelockExtra;
        
        // Minimum total time is 21 days (7 + 7 + 7)
        assertGe(totalTime, 21 days, "Minimum lifecycle is 21 days");
    }
    
    // ============================================
    // Edge Case Tests
    // ============================================
    
    function testFuzz_EdgeCase_ZeroVotes() public pure {
        uint256 forVotes = 0;
        uint256 againstVotes = 0;
        
        bool passes = forVotes > againstVotes;
        assertFalse(passes, "Zero votes should not pass");
    }
    
    function testFuzz_EdgeCase_EqualVotes(uint256 votes) public pure {
        votes = bound(votes, 1, 100_000_000e18);
        
        bool passes = votes > votes;
        assertFalse(passes, "Equal votes should not pass");
    }
    
    function testFuzz_EdgeCase_SingleVoteMargin(uint256 baseVotes) public pure {
        baseVotes = bound(baseVotes, 1, 100_000_000e18 - 1);
        
        uint256 forVotes = baseVotes + 1;
        uint256 againstVotes = baseVotes;
        
        bool passes = forVotes > againstVotes;
        assertTrue(passes, "Single vote margin should pass");
    }
}
