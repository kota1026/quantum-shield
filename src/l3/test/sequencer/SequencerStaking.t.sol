// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/sequencer/SequencerStaking.sol";
import "../../src/interfaces/ISequencerStaking.sol";

/**
 * @title SequencerStaking Test
 * @notice TEST-SEQ-002: Sequencer staking requirements tests
 * @dev Covers DECEN-013 requirements:
 *      - Minimum stake: $500K
 *      - Stake increase/decrease
 *      - Auto-inactive on insufficient stake
 *      - Delegated stake support ($50K minimum)
 *      - 7-day unbonding period
 */
contract SequencerStakingTest is Test {
    SequencerStaking public staking;

    address public admin = address(0xAD1);
    address public sequencer1 = address(0x111);
    address public sequencer2 = address(0x222);
    address public delegator1 = address(0xD01);
    address public delegator2 = address(0xD02);

    uint256 public constant MINIMUM_STAKE = 500_000 ether;
    uint256 public constant MINIMUM_DELEGATED_STAKE = 50_000 ether;
    uint256 public constant UNBONDING_PERIOD = 7 days;

    function setUp() public {
        vm.prank(admin);
        staking = new SequencerStaking(admin);
    }

    // ============================================
    // TEST-SEQ-002.1: Basic Staking Tests
    // ============================================

    function test_Stake_MinimumAmount() public {
        vm.deal(sequencer1, MINIMUM_STAKE + 1 ether);
        vm.prank(sequencer1);
        staking.stake{value: MINIMUM_STAKE}();

        assertEq(staking.getStake(sequencer1), MINIMUM_STAKE);
        assertTrue(staking.isEligible(sequencer1));
    }

    function test_Stake_BelowMinimum() public {
        vm.deal(sequencer1, MINIMUM_STAKE);
        vm.prank(sequencer1);
        staking.stake{value: MINIMUM_STAKE - 1}();

        assertEq(staking.getStake(sequencer1), MINIMUM_STAKE - 1);
        assertFalse(staking.isEligible(sequencer1));
    }

    function test_Stake_Increase() public {
        _setupStake(sequencer1, MINIMUM_STAKE);
        
        uint256 additional = 100_000 ether;
        vm.deal(sequencer1, additional);
        vm.prank(sequencer1);
        staking.stake{value: additional}();

        assertEq(staking.getStake(sequencer1), MINIMUM_STAKE + additional);
    }

    function test_Stake_ZeroAmount() public {
        vm.prank(sequencer1);
        vm.expectRevert("Zero stake");
        staking.stake{value: 0}();
    }

    // ============================================
    // TEST-SEQ-002.2: Unstaking Tests
    // ============================================

    function test_Unstake_WithUnbondingPeriod() public {
        _setupStake(sequencer1, MINIMUM_STAKE + 100_000 ether);

        vm.prank(sequencer1);
        staking.unstake(100_000 ether);

        // Should still have original stake during unbonding
        assertEq(staking.getStake(sequencer1), MINIMUM_STAKE);
        assertTrue(staking.isEligible(sequencer1));
    }

    function test_Unstake_BeforeUnbondingComplete() public {
        _setupStake(sequencer1, MINIMUM_STAKE + 100_000 ether);

        vm.prank(sequencer1);
        staking.unstake(100_000 ether);

        // Check withdrawable is 0 before unbonding period
        uint256 withdrawable = staking.getWithdrawable(sequencer1);
        assertEq(withdrawable, 0);

        // Try to withdraw before unbonding period
        vm.prank(sequencer1);
        vm.expectRevert("Nothing to withdraw");
        staking.withdraw();
    }

    function test_Unstake_AfterUnbondingComplete() public {
        _setupStake(sequencer1, MINIMUM_STAKE + 100_000 ether);

        vm.prank(sequencer1);
        staking.unstake(100_000 ether);

        // Fast forward unbonding period
        vm.warp(block.timestamp + UNBONDING_PERIOD + 1);

        uint256 balanceBefore = sequencer1.balance;
        vm.prank(sequencer1);
        staking.withdraw();
        uint256 balanceAfter = sequencer1.balance;

        assertEq(balanceAfter - balanceBefore, 100_000 ether);
    }

    function test_Unstake_AutoInactive() public {
        _setupStake(sequencer1, MINIMUM_STAKE);

        vm.prank(sequencer1);
        staking.unstake(1); // Any amount brings below minimum

        assertFalse(staking.isEligible(sequencer1));
    }

    function test_Unstake_InsufficientStake() public {
        _setupStake(sequencer1, MINIMUM_STAKE);

        vm.prank(sequencer1);
        vm.expectRevert("Insufficient stake");
        staking.unstake(MINIMUM_STAKE + 1);
    }

    // ============================================
    // TEST-SEQ-002.3: Delegated Staking Tests
    // ============================================

    function test_DelegatedStake_MinimumAmount() public {
        _setupStake(sequencer1, MINIMUM_STAKE);

        vm.deal(delegator1, MINIMUM_DELEGATED_STAKE + 1 ether);
        vm.prank(delegator1);
        staking.delegateStake{value: MINIMUM_DELEGATED_STAKE}(sequencer1);

        assertEq(staking.getDelegation(delegator1, sequencer1), MINIMUM_DELEGATED_STAKE);
    }

    function test_DelegatedStake_BelowMinimum() public {
        _setupStake(sequencer1, MINIMUM_STAKE);

        vm.deal(delegator1, MINIMUM_DELEGATED_STAKE);
        vm.prank(delegator1);
        vm.expectRevert("Below minimum delegation");
        staking.delegateStake{value: MINIMUM_DELEGATED_STAKE - 1}(sequencer1);
    }

    function test_DelegatedStake_MultipleDelegators() public {
        _setupStake(sequencer1, MINIMUM_STAKE);

        _setupDelegation(delegator1, sequencer1, MINIMUM_DELEGATED_STAKE);
        _setupDelegation(delegator2, sequencer1, MINIMUM_DELEGATED_STAKE * 2);

        uint256 totalDelegated = staking.getDelegatedStake(sequencer1);
        assertEq(totalDelegated, MINIMUM_DELEGATED_STAKE * 3);
    }

    function test_UndelegateStake() public {
        _setupStake(sequencer1, MINIMUM_STAKE);
        _setupDelegation(delegator1, sequencer1, MINIMUM_DELEGATED_STAKE);

        vm.prank(delegator1);
        staking.undelegateStake(sequencer1, MINIMUM_DELEGATED_STAKE);

        // Fast forward unbonding period
        vm.warp(block.timestamp + UNBONDING_PERIOD + 1);

        uint256 balanceBefore = delegator1.balance;
        vm.prank(delegator1);
        staking.withdrawDelegation(sequencer1);
        uint256 balanceAfter = delegator1.balance;

        assertEq(balanceAfter - balanceBefore, MINIMUM_DELEGATED_STAKE);
    }

    function test_GetTotalStake() public {
        _setupStake(sequencer1, MINIMUM_STAKE);
        _setupDelegation(delegator1, sequencer1, MINIMUM_DELEGATED_STAKE);
        _setupDelegation(delegator2, sequencer1, MINIMUM_DELEGATED_STAKE);

        uint256 totalStake = staking.getTotalStake(sequencer1);
        assertEq(totalStake, MINIMUM_STAKE + MINIMUM_DELEGATED_STAKE * 2);
    }

    function test_GetDelegators() public {
        _setupStake(sequencer1, MINIMUM_STAKE);
        _setupDelegation(delegator1, sequencer1, MINIMUM_DELEGATED_STAKE);
        _setupDelegation(delegator2, sequencer1, MINIMUM_DELEGATED_STAKE);

        address[] memory delegators = staking.getDelegators(sequencer1);
        assertEq(delegators.length, 2);
    }

    // ============================================
    // TEST-SEQ-002.4: Unbonding Entry Tests
    // ============================================

    function test_GetUnbondingEntries() public {
        _setupStake(sequencer1, MINIMUM_STAKE + 200_000 ether);

        vm.startPrank(sequencer1);
        staking.unstake(100_000 ether);
        staking.unstake(100_000 ether);
        vm.stopPrank();

        ISequencerStaking.UnbondingEntry[] memory entries = staking.getUnbondingEntries(sequencer1);
        assertEq(entries.length, 2);
        assertEq(entries[0].amount, 100_000 ether);
        assertEq(entries[1].amount, 100_000 ether);
    }

    // ============================================
    // Helper Functions
    // ============================================

    function _setupStake(address seq, uint256 amount) internal {
        vm.deal(seq, amount + 1 ether);
        vm.prank(seq);
        staking.stake{value: amount}();
    }

    function _setupDelegation(address delegator, address seq, uint256 amount) internal {
        vm.deal(delegator, amount + 1 ether);
        vm.prank(delegator);
        staking.delegateStake{value: amount}(seq);
    }
}
