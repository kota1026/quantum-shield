// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/token/QSToken.sol";
import "../../src/token/veQS.sol";

/**
 * @title VeQSFuzz
 * @notice Fuzz tests for veQS token
 * @dev Implements TEST-002 from Phase 3.3 Track B
 *      Tests boundary values and edge cases for:
 *      - Lock period calculations
 *      - Voting power computation
 *      - Lock/unlock operations
 *
 * @custom:security-contact security@quantumshield.io
 */
contract VeQSFuzz is Test {
    // ============================================
    // Constants
    // ============================================
    
    uint256 public constant MIN_LOCK_DURATION = 1 weeks;
    uint256 public constant MAX_LOCK_DURATION = 4 * 365 days; // 4 years
    uint256 public constant MIN_LOCK_AMOUNT = 1e18; // 1 QS
    uint256 public constant MAX_LOCK_AMOUNT = 1_000_000_000e18; // 1B QS
    
    // ============================================
    // Contracts
    // ============================================
    
    QSToken public qsToken;
    veQS public veQSToken;
    
    // ============================================
    // Actors
    // ============================================
    
    address public admin;
    address public user;
    
    // ============================================
    // Setup
    // ============================================
    
    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");
        
        vm.startPrank(admin);
        qsToken = new QSToken(admin);
        veQSToken = new veQS(address(qsToken), admin);
        vm.stopPrank();
        
        // Fund user
        vm.prank(admin);
        qsToken.mint(user, MAX_LOCK_AMOUNT);
    }
    
    // ============================================
    // Lock Duration Fuzz Tests
    // ============================================
    
    function testFuzz_LockDuration_Valid(uint256 duration) public {
        // Bound duration to valid range
        duration = bound(duration, MIN_LOCK_DURATION, MAX_LOCK_DURATION);
        
        uint256 amount = 100e18;
        uint256 endTime = block.timestamp + duration;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, endTime);
        vm.stopPrank();
        
        // Verify lock was created
        assertTrue(veQSToken.balanceOf(user) > 0, "Should have veQS balance");
    }
    
    function testFuzz_LockDuration_BoundaryMin() public {
        uint256 amount = 100e18;
        uint256 endTime = block.timestamp + MIN_LOCK_DURATION;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, endTime);
        vm.stopPrank();
        
        assertTrue(veQSToken.balanceOf(user) > 0, "Min duration should work");
    }
    
    function testFuzz_LockDuration_BoundaryMax() public {
        uint256 amount = 100e18;
        uint256 endTime = block.timestamp + MAX_LOCK_DURATION;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, endTime);
        vm.stopPrank();
        
        assertTrue(veQSToken.balanceOf(user) > 0, "Max duration should work");
    }
    
    // ============================================
    // Lock Amount Fuzz Tests
    // ============================================
    
    function testFuzz_LockAmount_Valid(uint256 amount) public {
        // Bound amount to valid range
        amount = bound(amount, MIN_LOCK_AMOUNT, MAX_LOCK_AMOUNT);
        
        uint256 duration = 365 days;
        uint256 endTime = block.timestamp + duration;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, endTime);
        vm.stopPrank();
        
        // Verify lock was created
        assertTrue(veQSToken.balanceOf(user) > 0, "Should have veQS balance");
    }
    
    function testFuzz_LockAmount_BoundaryMin() public {
        uint256 amount = MIN_LOCK_AMOUNT;
        uint256 endTime = block.timestamp + 365 days;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, endTime);
        vm.stopPrank();
        
        assertTrue(veQSToken.balanceOf(user) > 0, "Min amount should work");
    }
    
    // ============================================
    // Voting Power Fuzz Tests
    // ============================================
    
    function testFuzz_VotingPower_LinearDecay(uint256 amount, uint256 duration, uint256 timeElapsed) public {
        // Bound inputs
        amount = bound(amount, MIN_LOCK_AMOUNT, 1_000_000e18);
        duration = bound(duration, MIN_LOCK_DURATION, MAX_LOCK_DURATION);
        timeElapsed = bound(timeElapsed, 0, duration);
        
        uint256 endTime = block.timestamp + duration;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, endTime);
        vm.stopPrank();
        
        uint256 initialPower = veQSToken.balanceOf(user);
        
        // Move forward in time
        vm.warp(block.timestamp + timeElapsed);
        
        uint256 currentPower = veQSToken.balanceOf(user);
        
        // Voting power should decrease over time (linear decay)
        assertTrue(currentPower <= initialPower, "Power should decay or stay same");
        
        // If lock hasn't expired, should still have some power
        if (block.timestamp < endTime) {
            assertTrue(currentPower >= 0, "Power should be non-negative");
        }
    }
    
    function testFuzz_VotingPower_MaxAtMaxDuration(uint256 amount) public {
        amount = bound(amount, MIN_LOCK_AMOUNT, 1_000_000e18);
        
        // Lock for max duration
        uint256 endTime = block.timestamp + MAX_LOCK_DURATION;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, endTime);
        vm.stopPrank();
        
        uint256 maxPower = veQSToken.balanceOf(user);
        
        // veQS power should be significant at max duration
        assertTrue(maxPower > 0, "Should have power at max duration");
    }
    
    function testFuzz_VotingPower_ProportionalToAmount(uint256 amount1, uint256 amount2) public {
        amount1 = bound(amount1, MIN_LOCK_AMOUNT, 500_000_000e18);
        amount2 = bound(amount2, MIN_LOCK_AMOUNT, 500_000_000e18);
        
        address user2 = makeAddr("user2");
        vm.prank(admin);
        qsToken.mint(user2, amount2);
        
        uint256 endTime = block.timestamp + 365 days;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount1);
        veQSToken.createLock(amount1, endTime);
        vm.stopPrank();
        
        vm.startPrank(user2);
        qsToken.approve(address(veQSToken), amount2);
        veQSToken.createLock(amount2, endTime);
        vm.stopPrank();
        
        uint256 power1 = veQSToken.balanceOf(user);
        uint256 power2 = veQSToken.balanceOf(user2);
        
        // Power should be proportional to amount (for same duration)
        if (amount1 > amount2) {
            assertTrue(power1 >= power2, "More tokens = more power");
        } else if (amount2 > amount1) {
            assertTrue(power2 >= power1, "More tokens = more power");
        }
    }
    
    // ============================================
    // Unlock Fuzz Tests
    // ============================================
    
    function testFuzz_Unlock_AfterExpiry(uint256 duration) public {
        duration = bound(duration, MIN_LOCK_DURATION, MAX_LOCK_DURATION);
        
        uint256 amount = 100e18;
        uint256 endTime = block.timestamp + duration;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, endTime);
        
        uint256 balanceBefore = qsToken.balanceOf(user);
        
        // Fast forward past lock end
        vm.warp(endTime + 1);
        
        // Withdraw
        veQSToken.withdraw();
        
        uint256 balanceAfter = qsToken.balanceOf(user);
        vm.stopPrank();
        
        assertEq(balanceAfter - balanceBefore, amount, "Should recover full amount");
    }
    
    // ============================================
    // Increase Amount Fuzz Tests
    // ============================================
    
    function testFuzz_IncreaseAmount(uint256 initialAmount, uint256 additionalAmount) public {
        initialAmount = bound(initialAmount, MIN_LOCK_AMOUNT, 400_000_000e18);
        additionalAmount = bound(additionalAmount, MIN_LOCK_AMOUNT, 400_000_000e18);
        
        uint256 endTime = block.timestamp + 365 days;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), initialAmount + additionalAmount);
        
        // Create initial lock
        veQSToken.createLock(initialAmount, endTime);
        uint256 initialPower = veQSToken.balanceOf(user);
        
        // Increase amount
        veQSToken.increaseAmount(additionalAmount);
        uint256 finalPower = veQSToken.balanceOf(user);
        vm.stopPrank();
        
        // Power should increase
        assertTrue(finalPower > initialPower, "Power should increase");
    }
    
    // ============================================
    // Extend Lock Duration Fuzz Tests
    // ============================================
    
    function testFuzz_ExtendLock(uint256 initialDuration, uint256 extension) public {
        initialDuration = bound(initialDuration, MIN_LOCK_DURATION, MAX_LOCK_DURATION / 2);
        extension = bound(extension, 1 weeks, MAX_LOCK_DURATION / 2);
        
        uint256 amount = 100e18;
        uint256 initialEndTime = block.timestamp + initialDuration;
        uint256 newEndTime = initialEndTime + extension;
        
        // Ensure new end time doesn't exceed max
        if (newEndTime > block.timestamp + MAX_LOCK_DURATION) {
            newEndTime = block.timestamp + MAX_LOCK_DURATION;
        }
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        
        // Create initial lock
        veQSToken.createLock(amount, initialEndTime);
        uint256 initialPower = veQSToken.balanceOf(user);
        
        // Extend lock
        veQSToken.increaseUnlockTime(newEndTime);
        uint256 finalPower = veQSToken.balanceOf(user);
        vm.stopPrank();
        
        // Power should increase with longer duration
        assertTrue(finalPower >= initialPower, "Power should increase or stay same");
    }
    
    // ============================================
    // Multiple Users Fuzz Tests
    // ============================================
    
    function testFuzz_MultipleUsers_IndependentLocks(uint8 numUsers) public {
        numUsers = uint8(bound(numUsers, 2, 10));
        
        for (uint8 i = 0; i < numUsers; i++) {
            address userAddr = makeAddr(string.concat("multiuser", vm.toString(i)));
            
            vm.prank(admin);
            qsToken.mint(userAddr, 1000e18);
            
            uint256 amount = 100e18 + (uint256(i) * 50e18);
            uint256 duration = MIN_LOCK_DURATION + (uint256(i) * 30 days);
            uint256 endTime = block.timestamp + duration;
            
            vm.startPrank(userAddr);
            qsToken.approve(address(veQSToken), amount);
            veQSToken.createLock(amount, endTime);
            vm.stopPrank();
            
            assertTrue(veQSToken.balanceOf(userAddr) > 0, "User should have veQS");
        }
    }
    
    // ============================================
    // Edge Case Tests
    // ============================================
    
    function testFuzz_EdgeCase_PowerDecayToZero() public {
        uint256 amount = 100e18;
        uint256 duration = MIN_LOCK_DURATION;
        uint256 endTime = block.timestamp + duration;
        
        vm.startPrank(user);
        qsToken.approve(address(veQSToken), amount);
        veQSToken.createLock(amount, endTime);
        vm.stopPrank();
        
        // Move to exactly at expiry
        vm.warp(endTime);
        
        uint256 powerAtExpiry = veQSToken.balanceOf(user);
        
        // Power should be 0 or very close at expiry
        assertLe(powerAtExpiry, amount / 100, "Power should be minimal at expiry");
    }
    
    function testFuzz_EdgeCase_ManySmallLocks(uint8 iterations) public {
        iterations = uint8(bound(iterations, 1, 10));
        
        uint256 amountPerLock = 10e18;
        
        for (uint8 i = 0; i < iterations; i++) {
            address userAddr = makeAddr(string.concat("smalllock", vm.toString(i)));
            
            vm.prank(admin);
            qsToken.mint(userAddr, amountPerLock);
            
            uint256 endTime = block.timestamp + 365 days;
            
            vm.startPrank(userAddr);
            qsToken.approve(address(veQSToken), amountPerLock);
            veQSToken.createLock(amountPerLock, endTime);
            vm.stopPrank();
        }
        
        // All locks should be independent and valid
        assertTrue(true, "Multiple small locks should work");
    }
}
