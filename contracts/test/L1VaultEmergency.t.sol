// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {L1Vault} from "../src/L1Vault.sol";
import {SPHINCSVerifier} from "../src/SPHINCSVerifier.sol";

/// @title L1VaultEmergency Test Suite
/// @notice Tests for Sequence #3: Unlock (Emergency) implementation
/// @dev Covers 72h timeout detection, Emergency Bond, 7-day Time Lock, and monitoring
contract L1VaultEmergencyTest is Test {
    L1Vault public vault;
    SPHINCSVerifier public verifier;

    address public owner;
    address public securityCouncil;
    address public user;
    address public prover1;
    address public prover2;
    address public challenger;

    bytes public constant DILITHIUM_PUBKEY = hex"0102030405060708091011121314151617181920212223242526272829303132";
    bytes public constant SPHINCS_PUBKEY = hex"0102030405060708091011121314151617181920212223242526272829303132";

    // =========================================================================
    // Events for testing
    // =========================================================================

    event EmergencyUnlockInitiated(bytes32 indexed lockId, address indexed initiator, bool fromTimeout, uint256 timestamp);
    event EmergencyBondReceived(bytes32 indexed lockId, address indexed payer, uint256 bondAmount, uint256 requiredBond);
    event EmergencyUnlockFinalized(bytes32 indexed lockId, address indexed recipient, uint256 amount, uint256 bondReturned, bool wasSlashed);
    event EnhancedMonitoringActivated(bytes32 indexed lockId, uint256 timestamp);
    event ProverTimeoutDetected(bytes32 indexed lockId, uint256 requestedAt, uint256 detectedAt);
    event EmergencyUnlockRequested(bytes32 indexed lockId, address indexed recipient, uint256 amount, uint256 bond, uint256 unlockableAt);

    // =========================================================================
    // Setup
    // =========================================================================

    function setUp() public {
        owner = makeAddr("owner");
        securityCouncil = makeAddr("securityCouncil");
        user = makeAddr("user");
        prover1 = makeAddr("prover1");
        prover2 = makeAddr("prover2");
        challenger = makeAddr("challenger");

        vm.startPrank(owner);
        verifier = new SPHINCSVerifier();
        vault = new L1Vault(securityCouncil, address(verifier));

        // Register provers
        vault.registerProver{value: 1 ether}(prover1, SPHINCS_PUBKEY);
        vault.registerProver{value: 1 ether}(prover2, SPHINCS_PUBKEY);
        vm.stopPrank();

        // Fund accounts
        vm.deal(user, 100 ether);
        vm.deal(challenger, 10 ether);
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _createLock(uint256 amount) internal returns (bytes32 lockId) {
        vm.prank(user);
        lockId = vault.lock{value: amount}(user, DILITHIUM_PUBKEY);
    }

    function _createLockWithRecipient(uint256 amount, address recipient) internal returns (bytes32 lockId) {
        vm.prank(user);
        lockId = vault.lock{value: amount}(recipient, DILITHIUM_PUBKEY);
    }

    // =========================================================================
    // Test: Bond Calculation (BOND-001)
    // =========================================================================

    /// @notice Test: Bond calculation MIN case (0.5 ETH minimum)
    function test_EmergencyBondCalculation_Min() public view {
        // For 1 ETH: 5% = 0.05 ETH < 0.5 ETH, so MIN applies
        uint256 bond = vault.calculateEmergencyBond(1 ether);
        assertEq(bond, 0.5 ether, "Should use minimum bond of 0.5 ETH");
    }

    /// @notice Test: Bond calculation MAX case (5% of amount)
    function test_EmergencyBondCalculation_Percent() public view {
        // For 20 ETH: 5% = 1 ETH > 0.5 ETH, so 5% applies
        uint256 bond = vault.calculateEmergencyBond(20 ether);
        assertEq(bond, 1 ether, "Should use 5% for larger amounts");
    }

    /// @notice Test: Bond calculation boundary
    function test_EmergencyBondCalculation_Boundary() public view {
        // For 10 ETH: 5% = 0.5 ETH = MIN, exactly at boundary
        uint256 bond = vault.calculateEmergencyBond(10 ether);
        assertEq(bond, 0.5 ether, "Should be exactly at minimum");
    }

    // =========================================================================
    // Test: Manual Emergency Request (TRIG-004)
    // =========================================================================

    /// @notice Test: User can request emergency unlock with bond
    function test_RequestEmergencyUnlock_Success() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.expectEmit(true, true, false, true);
        emit EmergencyUnlockInitiated(lockId, user, false, block.timestamp);

        vm.expectEmit(true, true, false, true);
        emit EmergencyBondReceived(lockId, user, requiredBond, requiredBond);

        vm.expectEmit(true, false, false, true);
        emit EnhancedMonitoringActivated(lockId, block.timestamp);

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        L1Vault.EmergencyUnlock memory emergency = vault.getEmergencyUnlock(lockId);
        assertEq(uint256(emergency.status), uint256(L1Vault.EmergencyStatus.BOND_RECEIVED));
        assertTrue(emergency.enhancedMonitoring);
        assertFalse(emergency.fromTimeout);
        assertEq(emergency.bondAmount, requiredBond);
    }

    /// @notice Test: Emergency unlock rejected with insufficient bond
    function test_RequestEmergencyUnlock_InsufficientBond() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.prank(user);
        vm.expectRevert(L1Vault.InvalidBond.selector);
        vault.requestEmergencyUnlock{value: requiredBond - 0.1 ether}(lockId, user);
    }

    /// @notice Test: Only lock sender can request emergency
    function test_RequestEmergencyUnlock_NotOwner() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.deal(challenger, 10 ether);
        vm.prank(challenger);
        vm.expectRevert(L1Vault.NotOwner.selector);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, challenger);
    }

    /// @notice Test: Cannot request emergency twice
    function test_RequestEmergencyUnlock_AlreadyInitiated() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.startPrank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        vm.expectRevert(L1Vault.EmergencyAlreadyInitiated.selector);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);
        vm.stopPrank();
    }

    // =========================================================================
    // Test: 72h Timeout Detection (TRIG-001)
    // =========================================================================

    /// @notice Test: Check timeout before 72h
    function test_CheckProverTimeout_NotReached() public {
        bytes32 lockId = _createLock(10 ether);
        
        // Create a normal unlock request to initialize proverRequestedAt
        // For simplicity, we'll use emergency which also sets timestamp
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);
        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        (bool isTimedOut, uint256 requestedAt, uint256 timeRemaining) = vault.checkProverTimeout(lockId);
        
        assertFalse(isTimedOut, "Should not be timed out yet");
        assertGt(requestedAt, 0, "Should have recorded request time");
        assertGt(timeRemaining, 0, "Should have time remaining");
    }

    /// @notice Test: Timeout after 72h
    function test_CheckProverTimeout_Reached() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);
        
        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        // Warp past 72 hours
        vm.warp(block.timestamp + 73 hours);

        (bool isTimedOut, uint256 requestedAt, uint256 timeRemaining) = vault.checkProverTimeout(lockId);
        
        assertTrue(isTimedOut, "Should be timed out");
        assertGt(requestedAt, 0, "Should have recorded request time");
        assertEq(timeRemaining, 0, "Should have no time remaining");
    }

    // =========================================================================
    // Test: 7-day Time Lock (TL7-001 to TL7-004)
    // =========================================================================

    /// @notice Test: 7-day time lock is set correctly
    function test_EmergencyTimeLock_SetCorrectly() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);
        uint256 startTime = block.timestamp;

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        L1Vault.UnlockRequest memory request = vault.getUnlockRequest(lockId);
        assertEq(request.unlockableAt, startTime + 7 days, "Should have 7 day time lock");
        assertEq(request.emergencyReadyAt, startTime + 7 days, "Emergency ready timestamp should match");
    }

    /// @notice Test: Cannot execute before 7-day time lock
    function test_EmergencyUnlock_BeforeTimeLock() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        // Try to execute after 6 days (before 7-day lock expires)
        vm.warp(block.timestamp + 6 days);

        vm.expectRevert(L1Vault.UnlockNotReady.selector);
        vault.executeUnlock(lockId);
    }

    /// @notice Test: Can execute after 7-day time lock
    function test_EmergencyUnlock_AfterTimeLock() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);
        uint256 userBalanceBefore = user.balance;

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        // Warp past 7-day time lock
        vm.warp(block.timestamp + 7 days + 1);

        vm.expectEmit(true, true, false, true);
        emit EmergencyUnlockFinalized(lockId, user, 10 ether, requiredBond, false);

        vault.executeUnlock(lockId);

        // User should receive locked amount + bond back
        assertEq(user.balance, userBalanceBefore - requiredBond + 10 ether + requiredBond, "User should receive funds and bond back");
    }

    // =========================================================================
    // Test: Time Lock Extension on Challenge (TL7-003)
    // =========================================================================

    /// @notice Test: Time lock extends when challenged
    function test_EmergencyTimeLock_ExtendedOnChallenge() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        uint256 originalUnlockTime = vault.getUnlockRequest(lockId).unlockableAt;

        // File a challenge
        vm.prank(challenger);
        vault.challenge{value: 0.1 ether}(lockId, hex"1234");

        uint256 newUnlockTime = vault.getUnlockRequest(lockId).unlockableAt;
        assertEq(newUnlockTime, originalUnlockTime + 7 days, "Time lock should extend by 7 days on challenge");
    }

    // =========================================================================
    // Test: Enhanced Monitoring (MON-001 to MON-003)
    // =========================================================================

    /// @notice Test: Enhanced monitoring is activated
    function test_EnhancedMonitoring_Activated() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        assertFalse(vault.isEnhancedMonitoring(lockId), "Should not be in enhanced monitoring initially");

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        assertTrue(vault.isEnhancedMonitoring(lockId), "Should be in enhanced monitoring after emergency request");
    }

    /// @notice Test: Challenge can be filed during emergency
    function test_EnhancedMonitoring_ChallengeAccepted() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        // Challenge should be accepted during enhanced monitoring
        vm.prank(challenger);
        vault.challenge{value: 0.1 ether}(lockId, hex"1234");

        L1Vault.Challenge memory challengeData = vault.getChallenge(lockId);
        assertEq(uint256(challengeData.status), uint256(L1Vault.ChallengeStatus.PENDING));
    }

    // =========================================================================
    // Test: Bond Return on Success (BOND-003)
    // =========================================================================

    /// @notice Test: Bond is returned on successful emergency unlock
    function test_EmergencyBond_ReturnedOnSuccess() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);
        
        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        uint256 userBalanceBeforeExecute = user.balance;

        // Warp past time lock
        vm.warp(block.timestamp + 7 days + 1);
        vault.executeUnlock(lockId);

        // User should have received back: 10 ETH locked + bond
        assertEq(user.balance, userBalanceBeforeExecute + 10 ether + requiredBond);
    }

    // =========================================================================
    // Test: Bond Forfeited on Invalid Unlock (BOND-004)
    // =========================================================================

    /// @notice Test: Bond is forfeited when challenge succeeds
    function test_EmergencyBond_ForfeitedOnValidChallenge() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        uint256 insuranceBefore = vault.insuranceFund();

        // File and resolve challenge as valid (fraud detected)
        vm.prank(challenger);
        vault.challenge{value: 0.1 ether}(lockId, hex"1234");

        vm.prank(securityCouncil);
        vault.resolveChallenge(lockId, true);

        // Bond should be added to insurance fund
        assertGt(vault.insuranceFund(), insuranceBefore, "Insurance fund should increase");

        // Check bond was forfeited
        L1Vault.UnlockRequest memory request = vault.getUnlockRequest(lockId);
        assertEq(request.bond, 0, "Bond should be forfeited");
    }

    // =========================================================================
    // Test: Edge Cases
    // =========================================================================

    /// @notice Test: 72h directly before Prover response
    function test_EdgeCase_72hBoundary() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        // Warp to exactly 72 hours - 1 second
        vm.warp(block.timestamp + 72 hours - 1);
        
        (bool isTimedOut,,) = vault.checkProverTimeout(lockId);
        assertFalse(isTimedOut, "Should not be timed out at 72h - 1s");

        // Warp 1 more second to exactly 72 hours
        vm.warp(block.timestamp + 1);
        
        (isTimedOut,,) = vault.checkProverTimeout(lockId);
        assertTrue(isTimedOut, "Should be timed out at exactly 72h");
    }

    /// @notice Test: Multiple emergency requests for different locks
    function test_EdgeCase_MultipleEmergencyParallel() public {
        bytes32 lockId1 = _createLock(5 ether);
        bytes32 lockId2 = _createLock(10 ether);

        uint256 bond1 = vault.calculateEmergencyBond(5 ether);
        uint256 bond2 = vault.calculateEmergencyBond(10 ether);

        vm.startPrank(user);
        vault.requestEmergencyUnlock{value: bond1}(lockId1, user);
        vault.requestEmergencyUnlock{value: bond2}(lockId2, user);
        vm.stopPrank();

        assertTrue(vault.isEnhancedMonitoring(lockId1));
        assertTrue(vault.isEnhancedMonitoring(lockId2));

        L1Vault.EmergencyUnlock memory em1 = vault.getEmergencyUnlock(lockId1);
        L1Vault.EmergencyUnlock memory em2 = vault.getEmergencyUnlock(lockId2);

        assertEq(em1.bondAmount, bond1);
        assertEq(em2.bondAmount, bond2);
    }

    // =========================================================================
    // Test: Core Principles Compliance
    // =========================================================================

    /// @notice Test: CP-2 Self-Custody - Bond only, no locked funds kept after release
    function test_CorePrinciple_SelfCustody() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);

        vm.warp(block.timestamp + 7 days + 1);
        vault.executeUnlock(lockId);

        // Vault should have released all user funds
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        assertEq(uint256(lockData.status), uint256(L1Vault.LockStatus.RELEASED));
    }

    /// @notice Test: CP-3 Time Lock exists - 7 day emergency time lock
    function test_CorePrinciple_TimeLockExists() public {
        assertEq(vault.EMERGENCY_TIME_LOCK(), 7 days, "Emergency time lock should be 7 days");
    }

    /// @notice Test: CP-5 Transparency - All operations emit events
    function test_CorePrinciple_Transparency() public {
        bytes32 lockId = _createLock(10 ether);
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);

        // All three events should be emitted
        vm.expectEmit(true, true, false, true);
        emit EmergencyUnlockInitiated(lockId, user, false, block.timestamp);
        
        vm.expectEmit(true, true, false, true);
        emit EmergencyBondReceived(lockId, user, requiredBond, requiredBond);
        
        vm.expectEmit(true, false, false, true);
        emit EnhancedMonitoringActivated(lockId, block.timestamp);

        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);
    }

    // =========================================================================
    // Test: Specification Compliance
    // =========================================================================

    /// @notice Test: SPEC-001 Sequence#3 compliance - full flow
    function test_Spec_FullEmergencyFlow() public {
        // 1. Lock funds
        bytes32 lockId = _createLock(10 ether);
        
        // 2. Request emergency with bond
        uint256 requiredBond = vault.calculateEmergencyBond(10 ether);
        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);
        
        // 3. Verify 7-day time lock
        L1Vault.UnlockRequest memory request = vault.getUnlockRequest(lockId);
        assertEq(request.unlockableAt, block.timestamp + 7 days);
        
        // 4. Verify enhanced monitoring
        assertTrue(vault.isEnhancedMonitoring(lockId));
        
        // 5. Wait for time lock
        vm.warp(block.timestamp + 7 days + 1);
        
        // 6. Execute unlock
        vault.executeUnlock(lockId);
        
        // 7. Verify finalization
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        assertEq(uint256(lockData.status), uint256(L1Vault.LockStatus.RELEASED));
        
        L1Vault.EmergencyUnlock memory emergency = vault.getEmergencyUnlock(lockId);
        assertEq(uint256(emergency.status), uint256(L1Vault.EmergencyStatus.FINALIZED));
    }

    /// @notice Test: SPEC-002 Emergency Bond calculation formula
    function test_Spec_BondFormula() public view {
        // MAX(0.5 ETH, amount × 5%)
        
        // Case 1: amount = 5 ETH → 5% = 0.25 ETH < 0.5 ETH → bond = 0.5 ETH
        assertEq(vault.calculateEmergencyBond(5 ether), 0.5 ether);
        
        // Case 2: amount = 10 ETH → 5% = 0.5 ETH = 0.5 ETH → bond = 0.5 ETH
        assertEq(vault.calculateEmergencyBond(10 ether), 0.5 ether);
        
        // Case 3: amount = 20 ETH → 5% = 1 ETH > 0.5 ETH → bond = 1 ETH
        assertEq(vault.calculateEmergencyBond(20 ether), 1 ether);
        
        // Case 4: amount = 100 ETH → 5% = 5 ETH > 0.5 ETH → bond = 5 ETH
        assertEq(vault.calculateEmergencyBond(100 ether), 5 ether);
    }
}
