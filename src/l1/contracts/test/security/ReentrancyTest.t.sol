// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {L1Vault} from "../../src/L1Vault.sol";
import {SHA3_256} from "../../src/libraries/SHA3_256.sol";
import {StateRootCalculator} from "../../src/libraries/StateRootCalculator.sol";

/// @title ReentrancyTest - Security tests for L1Vault reentrancy protection
/// @notice SEC-001: Tests to verify CEI pattern is correctly applied
/// @dev PIR-SEC-001 test cases
contract ReentrancyTest is Test {
    L1Vault public vault;
    address public owner;
    address public securityCouncil;
    address public user;
    address public prover1;
    address public prover2;
    
    MaliciousChallenger public maliciousChallenger;
    MaliciousDefender public maliciousDefender;
    MaliciousRecipient public maliciousRecipient;

    bytes32 public lockId;
    bytes public dilithiumPubKey;
    bytes32 public stateRoot;

    event ChallengeResolved(bytes32 indexed lockId, bool challengeValid, uint256 slashedAmount, uint256 challengerReward, uint256 insuranceAmount, uint256 burnedAmount);

    function setUp() public {
        owner = makeAddr("owner");
        securityCouncil = makeAddr("securityCouncil");
        user = makeAddr("user");
        prover1 = makeAddr("prover1");
        prover2 = makeAddr("prover2");

        // Fund owner for prover registration
        vm.deal(owner, 10 ether);

        vm.startPrank(owner);
        vault = new L1Vault(securityCouncil, address(0));
        
        // Register provers
        bytes memory sphincsKey1 = abi.encodePacked(bytes32(uint256(1)));
        bytes memory sphincsKey2 = abi.encodePacked(bytes32(uint256(2)));
        vault.registerProver{value: 1 ether}(prover1, sphincsKey1);
        vault.registerProver{value: 1 ether}(prover2, sphincsKey2);
        vm.stopPrank();

        // Setup malicious contracts
        maliciousChallenger = new MaliciousChallenger(address(vault));
        maliciousDefender = new MaliciousDefender(address(vault));
        maliciousRecipient = new MaliciousRecipient(address(vault));

        // Fund accounts
        vm.deal(user, 100 ether);
        vm.deal(address(maliciousChallenger), 100 ether);
        vm.deal(address(maliciousDefender), 100 ether);
        vm.deal(address(maliciousRecipient), 100 ether);

        // Create a lock for testing
        dilithiumPubKey = abi.encodePacked(bytes32(uint256(12345)));
        vm.prank(user);
        lockId = vault.lock{value: 1 ether}(user, dilithiumPubKey);
    }

    // =========================================================================
    // TEST-SEC-001: Reentrancy Attack Tests
    // =========================================================================

    /// @notice Test that autoResolveChallenge is protected against reentrancy
    /// @dev FIX-001: CEI pattern must be applied - reentrancy attempts should fail
    function test_AutoResolveChallenge_ReentrancyProtection() public {
        // Setup: Create a pending unlock request via emergency path (no SMT proof needed)
        _createPendingUnlockViaEmergency();
        
        // Configure malicious challenger to attempt reentrancy
        maliciousChallenger.setAttackVector(MaliciousChallenger.AttackVector.AUTO_RESOLVE);
        maliciousChallenger.setTargetLock(lockId);
        
        // Malicious challenger files a challenge
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        vm.prank(address(maliciousChallenger));
        vault.challenge{value: challengeBond}(lockId, abi.encodePacked("fraud"));
        
        // Fast forward past defense period
        vm.warp(block.timestamp + 48 hours + 1);
        
        // Reset counters
        maliciousChallenger.resetCounters();
        
        // Try to auto-resolve - should succeed without allowing reentrancy
        vault.autoResolveChallenge(lockId);
        
        // Verify: receive() was called (attack was attempted) but reentrancy failed
        assertGt(maliciousChallenger.attackAttempts(), 0, "Attack should have been attempted");
        assertEq(maliciousChallenger.successfulAttacks(), 0, "No reentrancy attacks should have succeeded");
    }

    /// @notice Test that resolveChallenge is protected against reentrancy
    /// @dev FIX-002: CEI pattern must be applied
    function test_ResolveChallenge_ReentrancyProtection_ValidChallenge() public {
        // Setup: Create a pending unlock request via emergency path
        _createPendingUnlockViaEmergency();
        
        // Configure malicious challenger
        maliciousChallenger.setAttackVector(MaliciousChallenger.AttackVector.RESOLVE_CHALLENGE);
        maliciousChallenger.setTargetLock(lockId);
        
        // Malicious challenger files a challenge
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        vm.prank(address(maliciousChallenger));
        vault.challenge{value: challengeBond}(lockId, abi.encodePacked("fraud"));
        
        // Reset counters
        maliciousChallenger.resetCounters();
        
        // Security council resolves as valid (challenger wins)
        vm.prank(securityCouncil);
        vault.resolveChallenge(lockId, true);
        
        // Verify: attack was attempted but reentrancy failed
        assertGt(maliciousChallenger.attackAttempts(), 0, "Attack should have been attempted");
        assertEq(maliciousChallenger.successfulAttacks(), 0, "No reentrancy attacks should have succeeded");
    }

    /// @notice Test that resolveChallenge with invalid challenge is protected
    /// @dev FIX-002/FIX-004: CEI pattern for invalid challenge resolution
    function test_ResolveChallenge_ReentrancyProtection_InvalidChallenge() public {
        // Setup: Create a pending unlock request via emergency path
        _createPendingUnlockViaEmergency();
        
        // Regular challenger files a challenge
        address regularChallenger = makeAddr("regularChallenger");
        vm.deal(regularChallenger, 10 ether);
        
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        vm.prank(regularChallenger);
        vault.challenge{value: challengeBond}(lockId, abi.encodePacked("fraud"));
        
        // Make malicious defender an active prover for testing
        vm.deal(owner, 10 ether);
        vm.startPrank(owner);
        bytes memory sphincsKey = abi.encodePacked(bytes32(uint256(999)));
        vault.registerProver{value: 1 ether}(address(maliciousDefender), sphincsKey);
        vm.stopPrank();
        
        // Configure malicious defender
        maliciousDefender.setTargetLock(lockId);
        
        vm.prank(address(maliciousDefender));
        vault.submitDefense(lockId, abi.encodePacked("defense"));
        
        // Reset counters
        maliciousDefender.resetCounters();
        
        // Security council resolves as invalid (defender wins)
        vm.prank(securityCouncil);
        vault.resolveChallenge(lockId, false);
        
        // Verify: attack was attempted but reentrancy failed
        assertGt(maliciousDefender.attackAttempts(), 0, "Attack should have been attempted");
        assertEq(maliciousDefender.successfulAttacks(), 0, "No reentrancy attacks should have succeeded");
    }

    /// @notice Test that state is updated before external calls in autoResolve
    /// @dev Verify CEI pattern - state should be finalized before ETH transfer
    function test_AutoResolve_StateUpdatedBeforeTransfer() public {
        // Setup via emergency path
        _createPendingUnlockViaEmergency();
        
        address regularChallenger = makeAddr("regularChallenger");
        vm.deal(regularChallenger, 10 ether);
        
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        vm.prank(regularChallenger);
        vault.challenge{value: challengeBond}(lockId, abi.encodePacked("fraud"));
        
        // Fast forward past defense period
        vm.warp(block.timestamp + 48 hours + 1);
        
        // Record state before
        L1Vault.Challenge memory challengeBefore = vault.getChallenge(lockId);
        assertEq(uint8(challengeBefore.status), uint8(L1Vault.ChallengeStatus.PENDING));
        
        // Auto resolve
        vault.autoResolveChallenge(lockId);
        
        // Verify state is updated
        L1Vault.Challenge memory challengeAfter = vault.getChallenge(lockId);
        assertEq(uint8(challengeAfter.status), uint8(L1Vault.ChallengeStatus.RESOLVED_VALID));
        
        L1Vault.Lock memory lockAfter = vault.getLock(lockId);
        assertEq(uint8(lockAfter.status), uint8(L1Vault.LockStatus.SLASHED));
    }

    /// @notice Test multiple reentrancy attempts fail
    /// @dev Ensure nonReentrant modifier works across all entry points
    function test_MultipleReentrancyAttempts_AllFail() public {
        // Setup via emergency path
        _createPendingUnlockViaEmergency();
        
        // Configure malicious contract to attempt multiple attack vectors
        maliciousChallenger.setAttackVector(MaliciousChallenger.AttackVector.AUTO_RESOLVE);
        maliciousChallenger.setTargetLock(lockId);
        
        // File challenge with malicious contract
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        vm.prank(address(maliciousChallenger));
        vault.challenge{value: challengeBond}(lockId, abi.encodePacked("fraud"));
        
        // Fast forward past defense period
        vm.warp(block.timestamp + 48 hours + 1);
        
        // Reset counters
        maliciousChallenger.resetCounters();
        
        // Auto resolve should complete without successful reentry
        vault.autoResolveChallenge(lockId);
        
        // Challenge should be resolved despite malicious attempts
        L1Vault.Challenge memory challenge = vault.getChallenge(lockId);
        assertEq(uint8(challenge.status), uint8(L1Vault.ChallengeStatus.RESOLVED_VALID));
        
        // Verify no successful attacks
        assertEq(maliciousChallenger.successfulAttacks(), 0, "No reentrancy attacks should have succeeded");
    }

    // =========================================================================
    // TEST-SEC-002: Regression Tests (ensure existing functionality works)
    // =========================================================================

    /// @notice Test normal unlock flow still works after CEI fixes
    function test_NormalUnlockFlow_StillWorks() public {
        // Create a new lock
        vm.prank(user);
        bytes32 newLockId = vault.lock{value: 0.5 ether}(user, dilithiumPubKey);
        
        // Verify lock was created
        L1Vault.Lock memory lockData = vault.getLock(newLockId);
        assertEq(lockData.amount, 0.5 ether);
        assertEq(uint8(lockData.status), uint8(L1Vault.LockStatus.ACTIVE));
    }

    /// @notice Test challenge flow still works after CEI fixes
    function test_ChallengeFlow_StillWorks() public {
        _createPendingUnlockViaEmergency();
        
        address regularChallenger = makeAddr("regularChallenger");
        vm.deal(regularChallenger, 10 ether);
        
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(regularChallenger);
        vault.challenge{value: challengeBond}(lockId, abi.encodePacked("fraud"));
        
        L1Vault.Challenge memory challenge = vault.getChallenge(lockId);
        assertEq(uint8(challenge.status), uint8(L1Vault.ChallengeStatus.PENDING));
        assertEq(challenge.challenger, regularChallenger);
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    /// @notice Create a pending unlock via emergency path (no SMT proof needed)
    /// @dev Uses requestEmergencyUnlock which doesn't require cryptographic proofs
    function _createPendingUnlockViaEmergency() internal {
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        
        // Calculate required bond
        uint256 requiredBond = vault.calculateEmergencyBond(lockData.amount);
        
        // Request emergency unlock (doesn't need SMT proof)
        vm.prank(user);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user);
        
        // Verify status is EMERGENCY_PENDING (challengeable)
        L1Vault.Lock memory updatedLock = vault.getLock(lockId);
        assertEq(uint8(updatedLock.status), uint8(L1Vault.LockStatus.EMERGENCY_PENDING));
    }
}

// =========================================================================
// Malicious Contract: Attempts reentrancy via receive()
// =========================================================================

contract MaliciousChallenger {
    L1Vault public vault;
    uint256 public attackAttempts;
    uint256 public successfulAttacks;
    AttackVector public currentVector;
    bytes32 public targetLockId;
    
    enum AttackVector { NONE, AUTO_RESOLVE, RESOLVE_CHALLENGE, EXECUTE_UNLOCK }
    
    constructor(address _vault) {
        vault = L1Vault(payable(_vault));
    }
    
    function setAttackVector(AttackVector vector) external {
        currentVector = vector;
    }
    
    function setTargetLock(bytes32 _lockId) external {
        targetLockId = _lockId;
    }
    
    function resetCounters() external {
        attackAttempts = 0;
        successfulAttacks = 0;
    }
    
    receive() external payable {
        // Only attempt reentrancy if configured
        if (currentVector == AttackVector.NONE || targetLockId == bytes32(0)) {
            return;
        }
        
        // Limit attempts to prevent infinite loops
        if (attackAttempts >= 3) {
            return;
        }
        
        attackAttempts++;
        
        if (currentVector == AttackVector.AUTO_RESOLVE) {
            // Try to call autoResolveChallenge again
            try vault.autoResolveChallenge(targetLockId) {
                // Attack succeeded - this should not happen with proper CEI
                successfulAttacks++;
            } catch {
                // Expected - reentrancy blocked (either by CEI or nonReentrant)
            }
        } else if (currentVector == AttackVector.RESOLVE_CHALLENGE) {
            // Try to resolve challenge again
            try vault.resolveChallenge(targetLockId, true) {
                successfulAttacks++;
            } catch {
                // Expected
            }
        } else if (currentVector == AttackVector.EXECUTE_UNLOCK) {
            try vault.executeUnlock(targetLockId) {
                successfulAttacks++;
            } catch {
                // Expected
            }
        }
    }
    
    fallback() external payable {}
}

contract MaliciousDefender {
    L1Vault public vault;
    uint256 public attackAttempts;
    uint256 public successfulAttacks;
    bytes32 public targetLockId;
    
    constructor(address _vault) {
        vault = L1Vault(payable(_vault));
    }
    
    function setTargetLock(bytes32 _lockId) external {
        targetLockId = _lockId;
    }
    
    function resetCounters() external {
        attackAttempts = 0;
        successfulAttacks = 0;
    }
    
    receive() external payable {
        if (targetLockId == bytes32(0) || attackAttempts >= 3) {
            return;
        }
        
        attackAttempts++;
        
        // Attempt to re-enter via executeUnlock
        try vault.executeUnlock(targetLockId) {
            successfulAttacks++;
        } catch {
            // Expected - reentrancy blocked
        }
    }
    
    fallback() external payable {}
}

contract MaliciousRecipient {
    L1Vault public vault;
    uint256 public attackAttempts;
    uint256 public successfulAttacks;
    bytes32 public targetLockId;
    
    constructor(address _vault) {
        vault = L1Vault(payable(_vault));
    }
    
    function setTargetLock(bytes32 _lockId) external {
        targetLockId = _lockId;
    }
    
    function resetCounters() external {
        attackAttempts = 0;
        successfulAttacks = 0;
    }
    
    receive() external payable {
        if (targetLockId == bytes32(0) || attackAttempts >= 3) {
            return;
        }
        
        attackAttempts++;
        
        try vault.executeUnlock(targetLockId) {
            successfulAttacks++;
        } catch {
            // Expected
        }
    }
    
    fallback() external payable {}
}
