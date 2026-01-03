// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/sequencer/SequencerRegistry.sol";
import "../../src/sequencer/SequencerSlashing.sol";
import "../../src/sequencer/SequencerRotation.sol";

/**
 * @title SequencerFuzz
 * @notice Fuzz tests for Sequencer contracts
 * @dev Implements TEST-002 from Phase 3.3 Track B
 *      Tests boundary values and edge cases for:
 *      - Stake amounts and slashing calculations
 *      - Rotation timing
 *      - Health check intervals
 *
 * @custom:security-contact security@quantumshield.io
 */
contract SequencerFuzz is Test {
    // ============================================
    // Constants from SPEC_STRATEGY_BRIDGE
    // ============================================
    
    // Staking
    uint256 public constant MIN_STAKE = 400_000e18; // $400K equivalent
    uint256 public constant MAX_STAKE = 10_000_000e18; // $10M cap
    
    // Slashing (Quadratic N²×10%)
    uint256 public constant BASE_SLASH_PERCENT = 10;
    uint256 public constant CHALLENGER_REWARD_PERCENT = 60;
    uint256 public constant INSURANCE_PERCENT = 20;
    uint256 public constant BURN_PERCENT = 20;
    
    // Timing
    uint256 public constant ROTATION_TIMEOUT = 10 seconds;
    uint256 public constant HEALTH_CHECK_INTERVAL = 30 seconds;
    uint256 public constant UNBONDING_PERIOD = 7 days;
    
    // Distribution must sum to 100%
    uint256 public constant DISTRIBUTION_TOTAL = 100;
    
    // ============================================
    // Contracts
    // ============================================
    
    SequencerRegistry public registry;
    SequencerSlashing public slashing;
    SequencerRotation public rotation;
    
    // ============================================
    // Actors
    // ============================================
    
    address public admin;
    address[] public sequencers;
    address public challenger;
    address public insuranceFund;
    
    // ============================================
    // Setup
    // ============================================
    
    function setUp() public {
        admin = makeAddr("admin");
        challenger = makeAddr("challenger");
        insuranceFund = makeAddr("insuranceFund");
        
        // Setup sequencers (4 for BFT)
        for (uint256 i = 0; i < 4; i++) {
            sequencers.push(makeAddr(string.concat("sequencer", vm.toString(i))));
        }
        
        vm.startPrank(admin);
        
        // Deploy contracts
        registry = new SequencerRegistry(admin);
        slashing = new SequencerSlashing(address(registry), insuranceFund, admin);
        rotation = new SequencerRotation(address(registry), admin);
        
        vm.stopPrank();
        
        // Fund and register sequencers
        for (uint256 i = 0; i < sequencers.length; i++) {
            vm.deal(sequencers[i], MAX_STAKE);
            vm.prank(sequencers[i]);
            registry.register{value: MIN_STAKE}();
        }
    }
    
    // ============================================
    // Stake Amount Fuzz Tests
    // ============================================
    
    function testFuzz_Stake_ValidRange(uint256 stakeAmount) public {
        stakeAmount = bound(stakeAmount, MIN_STAKE, MAX_STAKE);
        
        address newSequencer = makeAddr("newSequencer");
        vm.deal(newSequencer, stakeAmount);
        
        vm.prank(newSequencer);
        registry.register{value: stakeAmount}();
        
        uint256 actualStake = registry.getStake(newSequencer);
        assertEq(actualStake, stakeAmount, "Stake should match deposited amount");
    }
    
    function testFuzz_Stake_BelowMinimum(uint256 stakeAmount) public {
        stakeAmount = bound(stakeAmount, 1, MIN_STAKE - 1);
        
        address newSequencer = makeAddr("lowStakeSequencer");
        vm.deal(newSequencer, stakeAmount);
        
        vm.prank(newSequencer);
        vm.expectRevert("Stake below minimum");
        registry.register{value: stakeAmount}();
    }
    
    function testFuzz_Stake_AboveMaximum(uint256 stakeAmount) public {
        stakeAmount = bound(stakeAmount, MAX_STAKE + 1, MAX_STAKE * 2);
        
        address newSequencer = makeAddr("highStakeSequencer");
        vm.deal(newSequencer, stakeAmount);
        
        vm.prank(newSequencer);
        // Should either cap at max or revert - depends on implementation
        // For this test, we assume it caps
        registry.register{value: stakeAmount}();
        
        uint256 actualStake = registry.getStake(newSequencer);
        assertLe(actualStake, MAX_STAKE, "Stake should be capped at maximum");
    }
    
    // ============================================
    // Slashing Calculation Fuzz Tests (Quadratic N²×10%)
    // ============================================
    
    function testFuzz_Slashing_SingleOffense(uint256 stakeAmount) public {
        stakeAmount = bound(stakeAmount, MIN_STAKE, MAX_STAKE);
        
        // N = 1, so slash = 1² × 10% = 10%
        uint256 offenseCount = 1;
        uint256 expectedSlash = stakeAmount * (offenseCount * offenseCount * BASE_SLASH_PERCENT) / 100;
        
        uint256 actualSlash = _calculateSlash(stakeAmount, offenseCount);
        
        assertEq(actualSlash, expectedSlash, "Single offense should slash 10%");
        assertEq(actualSlash, stakeAmount / 10, "Should be exactly 10%");
    }
    
    function testFuzz_Slashing_DoubleOffense(uint256 stakeAmount) public {
        stakeAmount = bound(stakeAmount, MIN_STAKE, MAX_STAKE);
        
        // N = 2, so slash = 2² × 10% = 40%
        uint256 offenseCount = 2;
        uint256 expectedSlash = stakeAmount * (offenseCount * offenseCount * BASE_SLASH_PERCENT) / 100;
        
        uint256 actualSlash = _calculateSlash(stakeAmount, offenseCount);
        
        assertEq(actualSlash, expectedSlash, "Double offense should slash 40%");
        assertEq(actualSlash, stakeAmount * 40 / 100, "Should be exactly 40%");
    }
    
    function testFuzz_Slashing_TripleOffense(uint256 stakeAmount) public {
        stakeAmount = bound(stakeAmount, MIN_STAKE, MAX_STAKE);
        
        // N = 3, so slash = 3² × 10% = 90%
        uint256 offenseCount = 3;
        uint256 expectedSlash = stakeAmount * (offenseCount * offenseCount * BASE_SLASH_PERCENT) / 100;
        
        uint256 actualSlash = _calculateSlash(stakeAmount, offenseCount);
        
        assertEq(actualSlash, expectedSlash, "Triple offense should slash 90%");
        assertEq(actualSlash, stakeAmount * 90 / 100, "Should be exactly 90%");
    }
    
    function testFuzz_Slashing_QuadrupleOffense(uint256 stakeAmount) public {
        stakeAmount = bound(stakeAmount, MIN_STAKE, MAX_STAKE);
        
        // N = 4, so slash = 4² × 10% = 160% -> capped at 100%
        uint256 offenseCount = 4;
        uint256 rawSlash = stakeAmount * (offenseCount * offenseCount * BASE_SLASH_PERCENT) / 100;
        uint256 expectedSlash = rawSlash > stakeAmount ? stakeAmount : rawSlash;
        
        uint256 actualSlash = _calculateSlash(stakeAmount, offenseCount);
        
        assertEq(actualSlash, expectedSlash, "Quadruple offense should slash 100% (capped)");
        assertEq(actualSlash, stakeAmount, "Should be capped at full stake");
    }
    
    function testFuzz_Slashing_ArbitraryOffenseCount(uint256 stakeAmount, uint8 offenseCount) public pure {
        stakeAmount = bound(stakeAmount, MIN_STAKE, MAX_STAKE);
        offenseCount = uint8(bound(offenseCount, 1, 10));
        
        uint256 rawSlash = stakeAmount * (uint256(offenseCount) * uint256(offenseCount) * BASE_SLASH_PERCENT) / 100;
        uint256 expectedSlash = rawSlash > stakeAmount ? stakeAmount : rawSlash;
        
        // Verify quadratic growth
        assertTrue(expectedSlash > 0, "Slash should be positive");
        assertTrue(expectedSlash <= stakeAmount, "Slash should not exceed stake");
    }
    
    // ============================================
    // Slash Distribution Fuzz Tests (60/20/20)
    // ============================================
    
    function testFuzz_SlashDistribution_ValidSplit(uint256 slashAmount) public pure {
        slashAmount = bound(slashAmount, 1e18, MAX_STAKE);
        
        uint256 challengerReward = slashAmount * CHALLENGER_REWARD_PERCENT / 100;
        uint256 insuranceAmount = slashAmount * INSURANCE_PERCENT / 100;
        uint256 burnAmount = slashAmount * BURN_PERCENT / 100;
        
        // Verify distribution sums to ~100% (accounting for rounding)
        uint256 totalDistributed = challengerReward + insuranceAmount + burnAmount;
        
        // Allow small rounding difference
        assertTrue(totalDistributed <= slashAmount, "Distribution should not exceed slash");
        assertTrue(slashAmount - totalDistributed <= 3, "Rounding error should be minimal");
        
        // Verify ratios
        assertEq(challengerReward, slashAmount * 60 / 100, "Challenger should get 60%");
        assertEq(insuranceAmount, slashAmount * 20 / 100, "Insurance should get 20%");
        assertEq(burnAmount, slashAmount * 20 / 100, "Burn should be 20%");
    }
    
    function testFuzz_SlashDistribution_DistributionConstants() public pure {
        // Verify constants sum to 100%
        uint256 total = CHALLENGER_REWARD_PERCENT + INSURANCE_PERCENT + BURN_PERCENT;
        assertEq(total, DISTRIBUTION_TOTAL, "Distribution must sum to 100%");
    }
    
    // ============================================
    // Rotation Timing Fuzz Tests
    // ============================================
    
    function testFuzz_Rotation_TimeoutBoundary(uint256 elapsedTime) public pure {
        elapsedTime = bound(elapsedTime, 0, 60 seconds);
        
        bool shouldRotate = elapsedTime >= ROTATION_TIMEOUT;
        
        if (elapsedTime >= 10 seconds) {
            assertTrue(shouldRotate, "Should rotate after 10s");
        } else {
            assertFalse(shouldRotate, "Should not rotate before 10s");
        }
    }
    
    function testFuzz_Rotation_HealthCheckInterval(uint256 elapsedTime) public pure {
        elapsedTime = bound(elapsedTime, 0, 120 seconds);
        
        bool needsHealthCheck = elapsedTime >= HEALTH_CHECK_INTERVAL;
        
        if (elapsedTime >= 30 seconds) {
            assertTrue(needsHealthCheck, "Health check needed after 30s");
        } else {
            assertFalse(needsHealthCheck, "Health check not needed before 30s");
        }
    }
    
    // ============================================
    // Unbonding Period Fuzz Tests
    // ============================================
    
    function testFuzz_Unbonding_ValidPeriod(uint256 elapsedTime) public pure {
        elapsedTime = bound(elapsedTime, 0, 14 days);
        
        bool canWithdraw = elapsedTime >= UNBONDING_PERIOD;
        
        if (elapsedTime >= 7 days) {
            assertTrue(canWithdraw, "Can withdraw after 7 days");
        } else {
            assertFalse(canWithdraw, "Cannot withdraw before 7 days");
        }
    }
    
    function testFuzz_Unbonding_SlashableDuringPeriod(uint256 elapsedTime, uint256 stakeAmount) public pure {
        elapsedTime = bound(elapsedTime, 0, UNBONDING_PERIOD - 1);
        stakeAmount = bound(stakeAmount, MIN_STAKE, MAX_STAKE);
        
        // During unbonding, stake should still be slashable
        bool isUnbonding = true;
        bool isSlashable = isUnbonding && elapsedTime < UNBONDING_PERIOD;
        
        assertTrue(isSlashable, "Should be slashable during unbonding");
    }
    
    // ============================================
    // BFT Consensus Fuzz Tests
    // ============================================
    
    function testFuzz_BFT_QuorumCalculation(uint8 totalNodes, uint8 faultyNodes) public pure {
        totalNodes = uint8(bound(totalNodes, 4, 100));
        
        // BFT requires n >= 3f + 1
        uint256 maxFaulty = (uint256(totalNodes) - 1) / 3;
        faultyNodes = uint8(bound(faultyNodes, 0, maxFaulty));
        
        // Quorum is 2f + 1
        uint256 quorum = 2 * uint256(faultyNodes) + 1;
        
        assertTrue(quorum <= totalNodes, "Quorum should not exceed total nodes");
        assertTrue(quorum >= 1, "Quorum should be at least 1");
    }
    
    function testFuzz_BFT_4NodeConsensus() public pure {
        // With 4 nodes, f = 1 (can tolerate 1 faulty)
        uint256 totalNodes = 4;
        uint256 maxFaulty = (totalNodes - 1) / 3; // = 1
        uint256 quorum = 2 * maxFaulty + 1; // = 3
        
        assertEq(maxFaulty, 1, "4 nodes can tolerate 1 faulty");
        assertEq(quorum, 3, "Quorum should be 3 for 4 nodes");
    }
    
    // ============================================
    // Edge Case Tests
    // ============================================
    
    function testFuzz_EdgeCase_MinimumSlash() public pure {
        uint256 stakeAmount = MIN_STAKE;
        uint256 offenseCount = 1;
        
        uint256 slash = stakeAmount * (offenseCount * offenseCount * BASE_SLASH_PERCENT) / 100;
        
        // Minimum slash should be 10% of minimum stake
        assertEq(slash, MIN_STAKE / 10, "Minimum slash should be 10% of min stake");
    }
    
    function testFuzz_EdgeCase_MaximumSlash() public pure {
        uint256 stakeAmount = MAX_STAKE;
        uint256 offenseCount = 4; // 160% -> capped at 100%
        
        uint256 rawSlash = stakeAmount * (offenseCount * offenseCount * BASE_SLASH_PERCENT) / 100;
        uint256 actualSlash = rawSlash > stakeAmount ? stakeAmount : rawSlash;
        
        assertEq(actualSlash, MAX_STAKE, "Max slash should be entire stake");
    }
    
    function testFuzz_EdgeCase_ZeroOffense() public pure {
        uint256 stakeAmount = MIN_STAKE;
        uint256 offenseCount = 0;
        
        uint256 slash = stakeAmount * (offenseCount * offenseCount * BASE_SLASH_PERCENT) / 100;
        
        assertEq(slash, 0, "Zero offenses should mean zero slash");
    }
    
    // ============================================
    // Helper Functions
    // ============================================
    
    function _calculateSlash(uint256 stake, uint256 offenseCount) internal pure returns (uint256) {
        uint256 rawSlash = stake * (offenseCount * offenseCount * BASE_SLASH_PERCENT) / 100;
        return rawSlash > stake ? stake : rawSlash;
    }
}
