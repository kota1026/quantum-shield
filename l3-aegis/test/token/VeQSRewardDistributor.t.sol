// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/token/VeQSRewardDistributor.sol";
import "../../src/token/veQS.sol";
import "../../src/token/QSToken.sol";
import "../../src/interfaces/IVeQSRewardDistributor.sol";

/// @title VeQSRewardDistributor Test
/// @notice Comprehensive tests for veQS reward distribution
/// @dev Per CURRENT_PLAN.md TOKEN-006
contract VeQSRewardDistributorTest is Test {
    VeQSRewardDistributor public distributor;
    veQS public veqsContract;
    QSToken public qsToken;
    QSToken public rewardToken;
    
    address public admin = address(0x1);
    address public minter = address(0x2);
    address public treasury = address(0x3);
    address public alice = address(0x10);
    address public bob = address(0x11);
    address public charlie = address(0x12);
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant LOCK_AMOUNT = 10_000 * 1e18;
    uint256 public constant REWARD_AMOUNT = 1_000 * 1e18;
    uint256 public constant FOUR_YEARS = 4 * 365 days;
    uint256 public constant ONE_WEEK = 7 days;
    
    function setUp() public {
        // Deploy QSToken
        vm.prank(admin);
        qsToken = new QSToken(admin, minter);
        
        // Deploy separate reward token
        vm.prank(admin);
        rewardToken = new QSToken(admin, minter);
        
        // Deploy veQS
        veqsContract = new veQS(address(qsToken));
        
        // Deploy distributor
        distributor = new VeQSRewardDistributor(
            address(veqsContract),
            address(rewardToken),
            ONE_WEEK,
            admin
        );
        
        // Mint tokens to users
        vm.startPrank(minter);
        qsToken.mint(alice, INITIAL_SUPPLY / 4);
        qsToken.mint(bob, INITIAL_SUPPLY / 4);
        qsToken.mint(charlie, INITIAL_SUPPLY / 4);
        rewardToken.mint(treasury, INITIAL_SUPPLY);
        vm.stopPrank();
        
        // Approve veQS for all users
        vm.prank(alice);
        qsToken.approve(address(veqsContract), type(uint256).max);
        
        vm.prank(bob);
        qsToken.approve(address(veqsContract), type(uint256).max);
        
        vm.prank(charlie);
        qsToken.approve(address(veqsContract), type(uint256).max);
        
        // Approve distributor for treasury
        vm.prank(treasury);
        rewardToken.approve(address(distributor), type(uint256).max);
    }
    
    // ============ Initialization Tests ============
    
    function test_Constructor_SetsParameters() public view {
        assertEq(distributor.veQS(), address(veqsContract));
        assertEq(distributor.rewardToken(), address(rewardToken));
        assertEq(distributor.epochDuration(), ONE_WEEK);
        assertEq(distributor.currentEpoch(), 0);
    }
    
    // ============ Add Rewards Tests ============
    
    function test_AddRewards_Success() public {
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        IVeQSRewardDistributor.Epoch memory epoch = distributor.getEpoch(0);
        assertEq(epoch.totalRewards, REWARD_AMOUNT);
    }
    
    function test_AddRewards_TransfersTokens() public {
        uint256 balanceBefore = rewardToken.balanceOf(address(distributor));
        
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        uint256 balanceAfter = rewardToken.balanceOf(address(distributor));
        assertEq(balanceAfter - balanceBefore, REWARD_AMOUNT);
    }
    
    function test_AddRewards_EmitsEvent() public {
        vm.prank(treasury);
        vm.expectEmit(true, true, false, true);
        emit IVeQSRewardDistributor.RewardsAdded(0, REWARD_AMOUNT, treasury);
        distributor.addRewards(REWARD_AMOUNT);
    }
    
    function test_AddRewards_RevertsOnZeroAmount() public {
        vm.prank(treasury);
        vm.expectRevert(IVeQSRewardDistributor.ZeroAmount.selector);
        distributor.addRewards(0);
    }
    
    // ============ Finalize Epoch Tests ============
    
    function test_FinalizeEpoch_Success() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // Add rewards
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        // Fast forward past epoch
        vm.warp(block.timestamp + ONE_WEEK + 1);
        
        // Finalize epoch
        distributor.finalizeEpoch();
        
        IVeQSRewardDistributor.Epoch memory epoch = distributor.getEpoch(0);
        assertTrue(epoch.finalized);
        assertGt(epoch.totalVotingPower, 0);
    }
    
    function test_FinalizeEpoch_StartsNewEpoch() public {
        // Add rewards
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        // Fast forward past epoch
        vm.warp(block.timestamp + ONE_WEEK + 1);
        
        // Finalize epoch
        distributor.finalizeEpoch();
        
        assertEq(distributor.currentEpoch(), 1);
    }
    
    function test_FinalizeEpoch_RevertsIfNotEnded() public {
        // Add rewards
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        // Try to finalize before epoch ends
        vm.expectRevert(); // Epoch not ended
        distributor.finalizeEpoch();
    }
    
    // ============ Claim Rewards Tests ============
    
    function test_Claim_Success() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // Add rewards
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        // Fast forward past epoch
        vm.warp(block.timestamp + ONE_WEEK + 1);
        
        // Finalize epoch
        distributor.finalizeEpoch();
        
        // Alice claims
        uint256 balanceBefore = rewardToken.balanceOf(alice);
        
        vm.prank(alice);
        uint256 claimed = distributor.claim();
        
        uint256 balanceAfter = rewardToken.balanceOf(alice);
        assertEq(balanceAfter - balanceBefore, claimed);
        assertGt(claimed, 0);
    }
    
    function test_Claim_ProportionalToVotingPower() public {
        // Alice locks 10k tokens, Bob locks 20k tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        vm.prank(bob);
        veqsContract.lock(LOCK_AMOUNT * 2, FOUR_YEARS);
        
        // Add rewards
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        // Fast forward and finalize
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // Both claim
        vm.prank(alice);
        uint256 aliceClaimed = distributor.claim();
        
        vm.prank(bob);
        uint256 bobClaimed = distributor.claim();
        
        // Bob should get ~2x Alice's rewards (within tolerance)
        assertApproxEqRel(bobClaimed, aliceClaimed * 2, 0.01e18);
    }
    
    function test_Claim_RevertsIfNoRewards() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // No rewards added, but finalize
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // Try to claim
        vm.prank(alice);
        vm.expectRevert(IVeQSRewardDistributor.NoRewardsToClaim.selector);
        distributor.claim();
    }
    
    function test_Claim_RevertsIfAlreadyClaimed() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // Add rewards and finalize
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // First claim
        vm.prank(alice);
        distributor.claim();
        
        // Second claim should revert
        vm.prank(alice);
        vm.expectRevert(IVeQSRewardDistributor.NoRewardsToClaim.selector);
        distributor.claim();
    }
    
    // ============ Pending Rewards Tests ============
    
    function test_PendingRewards_BeforeFinalize() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // Add rewards
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        // Pending rewards should be 0 before finalize
        uint256 pending = distributor.pendingRewards(alice);
        assertEq(pending, 0);
    }
    
    function test_PendingRewards_AfterFinalize() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // Add rewards
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        // Fast forward and finalize
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // Pending rewards should be > 0
        uint256 pending = distributor.pendingRewards(alice);
        assertGt(pending, 0);
    }
    
    // ============ Multiple Epochs Tests ============
    
    function test_MultipleEpochs_AccumulateRewards() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // Epoch 0
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // Epoch 1
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // Epoch 2
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // Alice should have pending rewards from all 3 epochs
        uint256 pending = distributor.pendingRewards(alice);
        // Alice is sole staker, should get all rewards
        assertApproxEqRel(pending, REWARD_AMOUNT * 3, 0.01e18);
    }
    
    // ============ Calculate User Share Tests ============
    
    function test_CalculateUserShare_SingleUser() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // Add rewards and finalize
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // Alice should get all rewards
        uint256 share = distributor.calculateUserShare(alice, 0);
        assertEq(share, REWARD_AMOUNT);
    }
    
    function test_CalculateUserShare_MultipleUsers() public {
        // Alice and Bob lock equal amounts
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        vm.prank(bob);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // Add rewards and finalize
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // Each should get ~50%
        uint256 aliceShare = distributor.calculateUserShare(alice, 0);
        uint256 bobShare = distributor.calculateUserShare(bob, 0);
        
        assertApproxEqRel(aliceShare, REWARD_AMOUNT / 2, 0.01e18);
        assertApproxEqRel(bobShare, REWARD_AMOUNT / 2, 0.01e18);
    }
    
    // ============ Emergency Withdrawal Tests ============
    
    function test_EmergencyWithdraw_OnlyAdmin() public {
        // Add some rewards
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        // Non-admin cannot withdraw
        vm.prank(alice);
        vm.expectRevert(IVeQSRewardDistributor.NotAuthorized.selector);
        distributor.emergencyWithdraw(alice, REWARD_AMOUNT);
        
        // Admin can withdraw
        vm.prank(admin);
        distributor.emergencyWithdraw(admin, REWARD_AMOUNT);
        
        assertEq(rewardToken.balanceOf(admin), REWARD_AMOUNT);
    }
    
    // ============ Edge Cases ============
    
    function test_NoVotingPower_NoRewards() public {
        // Add rewards without any stakers
        vm.prank(treasury);
        distributor.addRewards(REWARD_AMOUNT);
        
        // Fast forward and finalize
        vm.warp(block.timestamp + ONE_WEEK + 1);
        distributor.finalizeEpoch();
        
        // Alice locks AFTER epoch finalized
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        // Alice should have no pending rewards for epoch 0
        uint256 share = distributor.calculateUserShare(alice, 0);
        assertEq(share, 0);
    }
}
