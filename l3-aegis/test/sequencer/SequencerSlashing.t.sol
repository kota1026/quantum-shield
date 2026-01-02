// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/sequencer/SequencerSlashing.sol";
import "../../src/sequencer/SequencerStaking.sol";
import "../../src/interfaces/ISequencerSlashing.sol";

/**
 * @title SequencerSlashing Test
 * @notice TEST-SEQ-003: Sequencer slashing integration tests
 * @dev Covers DECEN-014 requirements:
 *      - Double-signing detection and slash
 *      - Downtime (SLA violation) detection and slash
 *      - Quadratic slashing: N^2 * 10%
 *      - Slash distribution: Challenger 60%, Insurance 20%, Burn 20%
 *      - Integration with CoreSlashing
 */
contract SequencerSlashingTest is Test {
    SequencerSlashing public slashing;
    SequencerStaking public staking;

    address public admin = address(0xAD1);
    address public sequencer1 = address(0x111);
    address public sequencer2 = address(0x222);
    address public challenger = address(0xC4A);
    address public insuranceFund = address(0x1F0);

    uint256 public constant MINIMUM_STAKE = 500_000 ether;
    uint256 public constant CHALLENGE_BOND = 0.1 ether;

    // Slashing rates (N^2 * 10%)
    // N=1: 10%, N=2: 40%, N=3: 90%, N=4: 160% (capped at 100%)

    function setUp() public {
        vm.startPrank(admin);
        staking = new SequencerStaking(admin);
        slashing = new SequencerSlashing(address(staking), insuranceFund, admin);
        staking.setSlashingContract(address(slashing));
        
        // Grant HEALTH_MONITOR_ROLE to admin for downtime reporting
        bytes32 HEALTH_MONITOR_ROLE = keccak256("HEALTH_MONITOR_ROLE");
        slashing.grantRole(HEALTH_MONITOR_ROLE, admin);
        vm.stopPrank();

        // Setup sequencers with stake using stakeFor
        _setupStake(sequencer1, MINIMUM_STAKE);
        _setupStake(sequencer2, MINIMUM_STAKE);
        
        // Fund slashing contract with ETH for challenger rewards
        vm.deal(address(slashing), 100 ether);
    }

    // ============================================
    // TEST-SEQ-003.1: Double-Signing Slash Tests
    // ============================================

    function test_ReportDoubleSigning() public {
        bytes memory proof = _createDoubleSignProof(sequencer1);

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, proof);

        // First violation: 10% slash
        uint256 expectedSlash = MINIMUM_STAKE * 10 / 100;
        assertEq(staking.getStake(sequencer1), MINIMUM_STAKE - expectedSlash);
    }

    function test_ReportDoubleSigning_QuadraticSlash() public {
        // First violation: N=1, 10%
        _reportAndVerifySlash(sequencer1, 1, 10);

        // Second violation: N=2, 40%
        _reportAndVerifySlash(sequencer1, 2, 40);

        // Third violation: N=3, 90%
        _reportAndVerifySlash(sequencer1, 3, 90);
    }

    function test_ReportDoubleSigning_InvalidProof() public {
        bytes memory invalidProof = hex"00";

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        vm.expectRevert("Invalid proof");
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, invalidProof);
    }

    // ============================================
    // TEST-SEQ-003.2: Downtime Slash Tests
    // ============================================

    function test_ReportDowntime() public {
        // Simulate missed blocks
        vm.prank(admin);
        slashing.reportDowntime(sequencer1);

        // First violation: 10% slash
        uint256 expectedSlash = MINIMUM_STAKE * 10 / 100;
        assertEq(staking.getStake(sequencer1), MINIMUM_STAKE - expectedSlash);
    }

    function test_ReportDowntime_OnlyAuthorized() public {
        vm.prank(challenger);
        vm.expectRevert();
        slashing.reportDowntime(sequencer1);
    }

    // ============================================
    // TEST-SEQ-003.3: Slash Distribution Tests
    // ============================================

    function test_SlashDistribution() public {
        bytes memory proof = _createDoubleSignProof(sequencer1);
        
        uint256 slashAmount = MINIMUM_STAKE * 10 / 100; // N=1
        uint256 challengerReward = slashAmount * 60 / 100;
        uint256 insuranceAmount = slashAmount * 20 / 100;
        // Burn: 20% (destroyed)

        uint256 challengerBalanceBefore = challenger.balance;
        uint256 insuranceBalanceBefore = insuranceFund.balance;

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, proof);

        assertEq(challenger.balance - challengerBalanceBefore + CHALLENGE_BOND, challengerReward + CHALLENGE_BOND);
        assertEq(insuranceFund.balance - insuranceBalanceBefore, insuranceAmount);
    }

    // ============================================
    // TEST-SEQ-003.4: Slash Calculation Tests
    // ============================================

    function test_CalculateSlash_FirstViolation() public view {
        // N=1: 1^2 * 10% = 10%
        uint256 slash = slashing.calculateSlash(MINIMUM_STAKE, 1);
        assertEq(slash, MINIMUM_STAKE * 10 / 100);
    }

    function test_CalculateSlash_SecondViolation() public view {
        // N=2: 2^2 * 10% = 40%
        uint256 slash = slashing.calculateSlash(MINIMUM_STAKE, 2);
        assertEq(slash, MINIMUM_STAKE * 40 / 100);
    }

    function test_CalculateSlash_Capped() public view {
        // N=4+: Should cap at 100%
        uint256 slash = slashing.calculateSlash(MINIMUM_STAKE, 4);
        assertEq(slash, MINIMUM_STAKE); // 100%
    }

    function testFuzz_CalculateSlash(uint256 stake, uint256 violations) public view {
        stake = bound(stake, 1 ether, 10_000_000 ether);
        violations = bound(violations, 1, 10);

        uint256 slash = slashing.calculateSlash(stake, violations);
        assertTrue(slash <= stake, "Slash exceeds stake");
        assertTrue(slash > 0, "Slash is zero");
    }

    // ============================================
    // TEST-SEQ-003.5: Unbonding Period Slash Tests
    // ============================================

    function test_SlashDuringUnbonding() public {
        // Start unbonding
        vm.prank(sequencer1);
        staking.unstake(100_000 ether);

        // Should still be slashable during unbonding
        bytes memory proof = _createDoubleSignProof(sequencer1);
        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(sequencer1, proof);

        // Stake should be reduced
        assertTrue(staking.getStake(sequencer1) < MINIMUM_STAKE - 100_000 ether);
    }

    // ============================================
    // Helper Functions
    // ============================================

    function _setupStake(address seq, uint256 amount) internal {
        vm.deal(seq, amount + 1 ether);
        vm.prank(seq);
        staking.stakeFor{value: amount}(seq);
    }

    function _createDoubleSignProof(address seq) internal view returns (bytes memory) {
        // Mock proof - in production would be actual signature comparison
        return abi.encode(seq, "double_sign_proof", block.number);
    }

    function _reportAndVerifySlash(address seq, uint256 violationNum, uint256 expectedPercentage) internal {
        uint256 stakeBefore = staking.getStake(seq);
        bytes memory proof = _createDoubleSignProof(seq);

        vm.deal(challenger, CHALLENGE_BOND + 1 ether);
        vm.prank(challenger);
        slashing.reportDoubleSign{value: CHALLENGE_BOND}(seq, proof);

        uint256 stakeAfter = staking.getStake(seq);
        uint256 actualSlash = stakeBefore - stakeAfter;
        uint256 expectedSlash = stakeBefore * expectedPercentage / 100;

        assertApproxEqRel(actualSlash, expectedSlash, 1e16); // 1% tolerance
    }
}
