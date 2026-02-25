// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/token/veQS.sol";
import "../../src/token/QSToken.sol";

/// @title veQSDelegation Test
/// @notice Comprehensive tests for veQS delegation functionality
/// @dev Per CURRENT_PLAN.md TOKEN-004, TOKEN-009
contract veQSDelegationTest is Test {
    veQS public veqsContract;
    QSToken public qsToken;
    
    address public admin = address(0x1);
    address public minter = address(0x2);
    address public alice = address(0x10);
    address public bob = address(0x11);
    address public charlie = address(0x12);
    address public dave = address(0x13);
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant LOCK_AMOUNT = 10_000 * 1e18;
    uint256 public constant ONE_YEAR = 365 days;
    uint256 public constant FOUR_YEARS = 4 * 365 days;
    
    function setUp() public {
        // Deploy QSToken
        vm.prank(admin);
        qsToken = new QSToken(admin, minter);
        
        // Deploy veQS
        veqsContract = new veQS(address(qsToken));
        
        // Mint tokens to users
        vm.startPrank(minter);
        qsToken.mint(alice, INITIAL_SUPPLY / 4);
        qsToken.mint(bob, INITIAL_SUPPLY / 4);
        qsToken.mint(charlie, INITIAL_SUPPLY / 4);
        qsToken.mint(dave, INITIAL_SUPPLY / 4);
        vm.stopPrank();
        
        // Approve veQS for all users
        vm.prank(alice);
        qsToken.approve(address(veqsContract), type(uint256).max);
        
        vm.prank(bob);
        qsToken.approve(address(veqsContract), type(uint256).max);
        
        vm.prank(charlie);
        qsToken.approve(address(veqsContract), type(uint256).max);
        
        vm.prank(dave);
        qsToken.approve(address(veqsContract), type(uint256).max);
    }
    
    // ============ Delegation Basic Tests ============
    
    function test_Delegate_Success() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, ONE_YEAR);
        
        // Alice delegates to Bob
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        // Verify delegation
        assertEq(veqsContract.getDelegate(alice), bob);
    }
    
    function test_Delegate_UpdatesDelegatedPower() public {
        // Alice locks tokens for 4 years (max boost)
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        uint256 alicePower = veqsContract.getVotingPower(alice);
        assertGt(alicePower, 0, "Alice should have voting power");
        
        // Alice delegates to Bob
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        // Bob's effective power should include Alice's delegated power
        uint256 bobEffectivePower = veqsContract.getEffectiveVotingPower(bob);
        assertEq(bobEffectivePower, alicePower, "Bob should have Alice's delegated power");
    }
    
    function test_Delegate_RevertsWithoutLock() public {
        // Alice tries to delegate without a lock
        vm.prank(alice);
        vm.expectRevert(IveQS.NoLockExists.selector);
        veqsContract.delegate(bob);
    }
    
    function test_Delegate_RevertsToZeroAddress() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, ONE_YEAR);
        
        // Try to delegate to zero address
        vm.prank(alice);
        vm.expectRevert(IveQS.CannotDelegateToZero.selector);
        veqsContract.delegate(address(0));
    }
    
    function test_Delegate_RevertsToSelf() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, ONE_YEAR);
        
        // Try to delegate to self
        vm.prank(alice);
        vm.expectRevert(IveQS.CannotDelegateToSelf.selector);
        veqsContract.delegate(alice);
    }
    
    // ============ Delegation Change Tests ============
    
    function test_Delegate_CanChangeDelegate() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, ONE_YEAR);
        
        // Alice delegates to Bob
        vm.prank(alice);
        veqsContract.delegate(bob);
        assertEq(veqsContract.getDelegate(alice), bob);
        
        // Alice changes delegation to Charlie
        vm.prank(alice);
        veqsContract.delegate(charlie);
        assertEq(veqsContract.getDelegate(alice), charlie);
        
        // Bob should no longer have delegated power
        assertEq(veqsContract.getEffectiveVotingPower(bob), 0);
    }
    
    function test_Delegate_PowerTransfersOnChange() public {
        // Alice locks tokens for 4 years
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        uint256 alicePower = veqsContract.getVotingPower(alice);
        
        // Alice delegates to Bob
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        uint256 bobPowerBefore = veqsContract.getEffectiveVotingPower(bob);
        uint256 charliePowerBefore = veqsContract.getEffectiveVotingPower(charlie);
        
        assertEq(bobPowerBefore, alicePower);
        assertEq(charliePowerBefore, 0);
        
        // Alice changes delegation to Charlie
        vm.prank(alice);
        veqsContract.delegate(charlie);
        
        uint256 bobPowerAfter = veqsContract.getEffectiveVotingPower(bob);
        uint256 charliePowerAfter = veqsContract.getEffectiveVotingPower(charlie);
        
        assertEq(bobPowerAfter, 0);
        assertEq(charliePowerAfter, alicePower);
    }
    
    // ============ Revoke Delegation Tests ============
    
    function test_RevokeDelegate_Success() public {
        // Alice locks and delegates
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, ONE_YEAR);
        
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        // Revoke delegation
        vm.prank(alice);
        veqsContract.revokeDelegate();
        
        // Verify no delegation
        assertEq(veqsContract.getDelegate(alice), alice);
    }
    
    function test_RevokeDelegate_RestoresPower() public {
        // Alice locks for 4 years
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        uint256 alicePower = veqsContract.getVotingPower(alice);
        
        // Delegate to Bob
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        // Verify Alice's effective power is 0 while delegated
        assertEq(veqsContract.getEffectiveVotingPower(alice), 0);
        
        // Revoke delegation
        vm.prank(alice);
        veqsContract.revokeDelegate();
        
        // Alice's effective power should be restored
        assertEq(veqsContract.getEffectiveVotingPower(alice), alicePower);
    }
    
    function test_RevokeDelegate_NoOpWithoutDelegation() public {
        // Alice locks tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, ONE_YEAR);
        
        // Revoke without delegation should not revert
        vm.prank(alice);
        veqsContract.revokeDelegate();
        
        // Should still point to self
        assertEq(veqsContract.getDelegate(alice), alice);
    }
    
    // ============ Multiple Delegation Tests ============
    
    function test_MultipleDelegators_ToSameDelegate() public {
        // Alice and Charlie lock tokens
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        vm.prank(charlie);
        veqsContract.lock(LOCK_AMOUNT * 2, FOUR_YEARS);
        
        uint256 alicePower = veqsContract.getVotingPower(alice);
        uint256 charliePower = veqsContract.getVotingPower(charlie);
        
        // Both delegate to Bob
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        vm.prank(charlie);
        veqsContract.delegate(bob);
        
        // Bob should have combined power
        uint256 bobEffectivePower = veqsContract.getEffectiveVotingPower(bob);
        assertEq(bobEffectivePower, alicePower + charliePower);
    }
    
    // ============ Lock Modification with Delegation Tests ============
    
    function test_IncreaseLockAmount_UpdatesDelegatedPower() public {
        // Alice locks and delegates
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        uint256 bobPowerBefore = veqsContract.getEffectiveVotingPower(bob);
        
        // Alice increases lock amount
        vm.prank(alice);
        veqsContract.increaseLockAmount(LOCK_AMOUNT);
        
        uint256 bobPowerAfter = veqsContract.getEffectiveVotingPower(bob);
        
        // Bob's power should increase
        assertGt(bobPowerAfter, bobPowerBefore);
    }
    
    function test_ExtendLockTime_UpdatesDelegatedPower() public {
        // Alice locks for 1 year and delegates
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, ONE_YEAR);
        
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        uint256 bobPowerBefore = veqsContract.getEffectiveVotingPower(bob);
        
        // Alice extends lock to 4 years
        vm.prank(alice);
        veqsContract.extendLockTime(block.timestamp + FOUR_YEARS);
        
        uint256 bobPowerAfter = veqsContract.getEffectiveVotingPower(bob);
        
        // Bob's power should increase
        assertGt(bobPowerAfter, bobPowerBefore);
    }
    
    // ============ Withdrawal with Delegation Tests ============
    
    function test_Withdraw_ClearsDelegation() public {
        // Alice locks and delegates
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, ONE_YEAR);
        
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        assertEq(veqsContract.getDelegate(alice), bob);
        assertGt(veqsContract.getEffectiveVotingPower(bob), 0);
        
        // Fast forward past lock time
        vm.warp(block.timestamp + ONE_YEAR + 1);
        
        // Alice withdraws
        vm.prank(alice);
        veqsContract.withdraw();
        
        // Delegation should be cleared
        // Bob's effective power should be 0
        assertEq(veqsContract.getEffectiveVotingPower(bob), 0);
    }
    
    // ============ Voting Power Decay with Delegation Tests ============
    
    function test_DelegatedPower_DecaysOverTime() public {
        // Alice locks for 4 years
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        uint256 bobPowerAtStart = veqsContract.getEffectiveVotingPower(bob);
        
        // Fast forward 2 years
        vm.warp(block.timestamp + 2 * 365 days);
        
        uint256 bobPowerAfter2Years = veqsContract.getEffectiveVotingPower(bob);
        
        // Power should decay (approximately half)
        assertLt(bobPowerAfter2Years, bobPowerAtStart);
        // Should be roughly 50% (within 10% tolerance due to approximation)
        assertApproxEqRel(bobPowerAfter2Years, bobPowerAtStart / 2, 0.1e18);
    }
    
    // ============ Edge Cases ============
    
    function test_GetDelegate_ReturnsUserIfNoDelegation() public {
        // Alice locks tokens but doesn't delegate
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, ONE_YEAR);
        
        // getDelegate should return alice herself
        assertEq(veqsContract.getDelegate(alice), alice);
    }
    
    function test_EffectivePower_OwnPowerWhenNotDelegated() public {
        // Alice locks tokens but doesn't delegate
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        uint256 votingPower = veqsContract.getVotingPower(alice);
        uint256 effectivePower = veqsContract.getEffectiveVotingPower(alice);
        
        // Should be equal
        assertEq(effectivePower, votingPower);
    }
    
    function test_EffectivePower_ZeroWhenDelegated() public {
        // Alice locks and delegates
        vm.prank(alice);
        veqsContract.lock(LOCK_AMOUNT, FOUR_YEARS);
        
        uint256 alicePowerBefore = veqsContract.getEffectiveVotingPower(alice);
        assertGt(alicePowerBefore, 0);
        
        vm.prank(alice);
        veqsContract.delegate(bob);
        
        // Alice's effective power should be 0 after delegation
        uint256 alicePowerAfter = veqsContract.getEffectiveVotingPower(alice);
        assertEq(alicePowerAfter, 0);
    }
}
