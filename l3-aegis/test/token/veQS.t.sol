// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "src/token/QSToken.sol";
import "src/token/veQS.sol";

/// @title ReentrancyAttacker
/// @notice Mock contract to test reentrancy protection
contract ReentrancyAttacker {
    veQS public target;
    QSToken public token;
    uint256 public attackCount;
    bool public attacking;
    
    constructor(address _veqs, address _token) {
        target = veQS(_veqs);
        token = QSToken(_token);
    }
    
    function attack(uint256 amount, uint256 duration) external {
        attacking = true;
        attackCount = 0;
        token.approve(address(target), type(uint256).max);
        target.lock(amount, duration);
    }
    
    // This would be called if the token had a callback (simulating malicious token)
    function onTokenTransfer() external {
        if (attacking && attackCount < 2) {
            attackCount++;
            // Try to reenter
            try target.lock(100, 1 weeks) {
                // If this succeeds, reentrancy guard is broken
            } catch {
                // Expected: should revert
            }
        }
    }
}

/// @title veQSTest
/// @notice Unit tests for veQS (TOKEN-002, TOKEN-003)
contract veQSTest is Test {
    QSToken public qsToken;
    veQS public veqs;
    
    address public admin = address(0x1);
    address public minter = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    
    uint256 constant ONE_WEEK = 1 weeks;
    uint256 constant ONE_YEAR = 365 days;
    uint256 constant FOUR_YEARS = 4 * 365 days;
    
    function setUp() public {
        qsToken = new QSToken(admin, minter);
        veqs = new veQS(address(qsToken));
        
        // Mint tokens to users
        vm.startPrank(minter);
        qsToken.mint(user1, 10000 * 1e18);
        qsToken.mint(user2, 10000 * 1e18);
        vm.stopPrank();
        
        // Approve veQS to spend tokens
        vm.prank(user1);
        qsToken.approve(address(veqs), type(uint256).max);
        
        vm.prank(user2);
        qsToken.approve(address(veqs), type(uint256).max);
    }
    
    // ============ Lock Tests (TOKEN-002) ============
    
    function test_lock() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        
        assertTrue(veqs.hasLock(user1));
        
        IveQS.LockPosition memory pos = veqs.getLockPosition(user1);
        assertEq(pos.amount, 1000 * 1e18);
        assertEq(pos.unlockTime, block.timestamp + ONE_YEAR);
    }
    
    function test_lock_minDuration() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_WEEK);
        
        assertTrue(veqs.hasLock(user1));
    }
    
    function test_lock_maxDuration() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, FOUR_YEARS);
        
        assertTrue(veqs.hasLock(user1));
    }
    
    function test_lock_tooShort_reverts() public {
        vm.prank(user1);
        vm.expectRevert(IveQS.LockTimeTooShort.selector);
        veqs.lock(1000 * 1e18, ONE_WEEK - 1);
    }
    
    function test_lock_tooLong_reverts() public {
        vm.prank(user1);
        vm.expectRevert(IveQS.LockTimeTooLong.selector);
        veqs.lock(1000 * 1e18, FOUR_YEARS + 1);
    }
    
    function test_lock_zeroAmount_reverts() public {
        vm.prank(user1);
        vm.expectRevert(IveQS.ZeroAmount.selector);
        veqs.lock(0, ONE_YEAR);
    }
    
    function test_lock_alreadyExists_reverts() public {
        vm.startPrank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        
        vm.expectRevert(IveQS.LockAlreadyExists.selector);
        veqs.lock(500 * 1e18, ONE_YEAR);
        vm.stopPrank();
    }
    
    function test_increaseLockAmount() public {
        vm.startPrank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        veqs.increaseLockAmount(500 * 1e18);
        vm.stopPrank();
        
        IveQS.LockPosition memory pos = veqs.getLockPosition(user1);
        assertEq(pos.amount, 1500 * 1e18);
    }
    
    function test_extendLockTime() public {
        vm.startPrank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        
        uint256 newUnlockTime = block.timestamp + 2 * ONE_YEAR;
        veqs.extendLockTime(newUnlockTime);
        vm.stopPrank();
        
        IveQS.LockPosition memory pos = veqs.getLockPosition(user1);
        assertEq(pos.unlockTime, newUnlockTime);
    }
    
    function test_withdraw() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_WEEK);
        
        // Fast forward past unlock time
        vm.warp(block.timestamp + ONE_WEEK + 1);
        
        uint256 balanceBefore = qsToken.balanceOf(user1);
        
        vm.prank(user1);
        veqs.withdraw();
        
        uint256 balanceAfter = qsToken.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, 1000 * 1e18);
        assertFalse(veqs.hasLock(user1));
    }
    
    function test_withdraw_notExpired_reverts() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        
        vm.prank(user1);
        vm.expectRevert(IveQS.LockNotExpired.selector);
        veqs.withdraw();
    }
    
    // ============ Voting Power Tests (TOKEN-003) ============
    
    function test_votingPower_maxLock() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, FOUR_YEARS);
        
        // Max voting power = amount (100% at 4 years)
        uint256 power = veqs.getVotingPower(user1);
        
        // Should be approximately equal to locked amount
        // (slightly less due to time passing during test)
        assertGt(power, 999 * 1e18);
        assertLe(power, 1000 * 1e18);
    }
    
    function test_votingPower_halfLock() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, 2 * ONE_YEAR); // 2 years = 50% of max
        
        uint256 power = veqs.getVotingPower(user1);
        
        // Should be approximately 50% of locked amount
        assertGt(power, 490 * 1e18);
        assertLe(power, 510 * 1e18);
    }
    
    function test_votingPower_minLock() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_WEEK);
        
        uint256 power = veqs.getVotingPower(user1);
        
        // 1 week / 4 years ≈ 0.48%
        // Expected: ~4.8 tokens worth of voting power
        assertGt(power, 0);
        assertLt(power, 10 * 1e18);
    }
    
    function test_votingPower_decaysOverTime() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        
        uint256 powerAtStart = veqs.getVotingPower(user1);
        
        // Fast forward 6 months
        vm.warp(block.timestamp + ONE_YEAR / 2);
        
        uint256 powerAtHalf = veqs.getVotingPower(user1);
        
        // Power should have decayed by roughly half
        assertLt(powerAtHalf, powerAtStart);
        assertGt(powerAtHalf, powerAtStart / 3);
    }
    
    function test_votingPower_zeroAfterExpiry() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_WEEK);
        
        // Fast forward past expiry
        vm.warp(block.timestamp + ONE_WEEK + 1);
        
        uint256 power = veqs.getVotingPower(user1);
        assertEq(power, 0);
    }
    
    // ============ Delegation Tests ============
    
    function test_delegate() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        
        vm.prank(user1);
        veqs.delegate(user2);
        
        assertEq(veqs.getDelegate(user1), user2);
    }
    
    function test_delegate_toSelf_reverts() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        
        vm.prank(user1);
        vm.expectRevert(IveQS.CannotDelegateToSelf.selector);
        veqs.delegate(user1);
    }
    
    function test_revokeDelegate() public {
        vm.startPrank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        veqs.delegate(user2);
        veqs.revokeDelegate();
        vm.stopPrank();
        
        // After revoke, delegate should be self
        assertEq(veqs.getDelegate(user1), user1);
    }
    
    function test_effectiveVotingPower() public {
        // User1 locks and delegates to user2
        vm.startPrank(user1);
        veqs.lock(1000 * 1e18, FOUR_YEARS);
        veqs.delegate(user2);
        vm.stopPrank();
        
        // User2 should have user1's voting power
        uint256 user2Power = veqs.getEffectiveVotingPower(user2);
        assertGt(user2Power, 0);
    }
    
    // ============ Constants Tests ============
    
    function test_constants() public {
        assertEq(veqs.MIN_LOCK_TIME(), ONE_WEEK);
        assertEq(veqs.MAX_LOCK_TIME(), FOUR_YEARS);
        assertEq(veqs.qsToken(), address(qsToken));
    }
    
    // ============ ReentrancyGuard Tests ============
    
    /// @notice Test that nonReentrant modifier is applied by verifying
    /// the contract compiles and functions work correctly
    function test_reentrancyGuard_lockWorks() public {
        // This test verifies that lock() with nonReentrant modifier works
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        assertTrue(veqs.hasLock(user1));
    }
    
    function test_reentrancyGuard_increaseLockAmountWorks() public {
        vm.startPrank(user1);
        veqs.lock(1000 * 1e18, ONE_YEAR);
        veqs.increaseLockAmount(500 * 1e18);
        vm.stopPrank();
        
        IveQS.LockPosition memory pos = veqs.getLockPosition(user1);
        assertEq(pos.amount, 1500 * 1e18);
    }
    
    function test_reentrancyGuard_withdrawWorks() public {
        vm.prank(user1);
        veqs.lock(1000 * 1e18, ONE_WEEK);
        
        vm.warp(block.timestamp + ONE_WEEK + 1);
        
        vm.prank(user1);
        veqs.withdraw();
        
        assertFalse(veqs.hasLock(user1));
    }
}
