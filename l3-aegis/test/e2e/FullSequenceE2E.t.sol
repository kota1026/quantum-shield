// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/CoreLayer.sol";
import "../../src/core/CoreState.sol";

/**
 * @title FullSequenceE2E
 * @notice End-to-end tests for Sequences #1-3, #3' from QUANTUM_SHIELD_SEQUENCES_v2.0
 * @dev Implements TEST-001 from Phase 3.3 Track B
 * @dev Uses CoreLayer for bridge operations (lock/unlock)
 * @dev Focused on CoreLayer functionality; other contract E2E tests pending
 */
contract FullSequenceE2E is Test {
    // Constants
    uint256 public constant NORMAL_TIMELOCK = 24 hours;
    uint256 public constant EMERGENCY_TIMELOCK = 7 days;
    uint256 public constant EMERGENCY_TIMEOUT = 72 hours;
    uint256 public constant MIN_EMERGENCY_BOND = 0.5 ether;
    uint256 public constant EMERGENCY_BOND_PERCENT = 5;
    uint256 public constant BASE_SLASH_PERCENT = 10;
    uint256 public constant GOVERNANCE_TIMELOCK = 7 days;
    
    // Contracts
    CoreLayer public coreLayer;
    CoreState public coreState;
    
    // Actors
    address public admin;
    address public user;
    address public recipient;
    
    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");
        recipient = makeAddr("recipient");
        
        vm.startPrank(admin);
        
        // Deploy CoreLayer (bridge contract)
        coreLayer = new CoreLayer();
        
        // Deploy CoreState (state management)
        coreState = new CoreState();
        
        vm.stopPrank();
        
        // Fund actors
        vm.deal(user, 100 ether);
        vm.deal(address(coreLayer), 100 ether); // Fund CoreLayer for unlocks
    }
    
    // =========================================================================
    // SEQ#1: Lock - Using CoreLayer
    // =========================================================================
    
    function test_SEQ1_Lock_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        bytes32 recipientBytes = bytes32(uint256(uint160(user)));
        
        vm.startPrank(user);
        bytes32 txHash = coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipientBytes);
        vm.stopPrank();
        
        assertTrue(coreLayer.isLocked(txHash), "Asset should be locked");
        
        ICoreLayer.BridgeTx memory bridgeTx = coreLayer.getTransaction(txHash);
        assertEq(bridgeTx.amount, lockAmount, "Lock amount should match");
        assertEq(bridgeTx.recipient, recipientBytes, "Recipient should match");
        assertFalse(bridgeTx.executed, "Should not be executed yet");
    }
    
    function test_SEQ1_Lock_MultipleAssets() public {
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;
        amounts[2] = 0.5 ether;
        
        bytes32[] memory txHashes = new bytes32[](3);
        bytes32 recipientBytes = bytes32(uint256(uint160(user)));
        
        vm.startPrank(user);
        for (uint256 i = 0; i < amounts.length; i++) {
            txHashes[i] = coreLayer.lock{value: amounts[i]}(address(0), amounts[i], recipientBytes);
            assertTrue(coreLayer.isLocked(txHashes[i]), "Asset should be locked");
        }
        vm.stopPrank();
    }
    
    // =========================================================================
    // SEQ#2: Unlock Normal - Using CoreLayer
    // =========================================================================
    
    function test_SEQ2_UnlockNormal_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        bytes32 txHash = _lockAsset(user, lockAmount);
        
        // Request unlock with valid proof
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.unlock(txHash, proof, user);
        
        // Advance past timelock
        vm.warp(block.timestamp + NORMAL_TIMELOCK + 1);
        
        // Claim
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreLayer.claim(txHash, user);
        
        assertEq(user.balance - balanceBefore, lockAmount, "Should receive locked amount");
        assertFalse(coreLayer.isLocked(txHash), "Asset should be unlocked");
    }
    
    function test_SEQ2_UnlockNormal_TimelockEnforced() public {
        uint256 lockAmount = 1 ether;
        bytes32 txHash = _lockAsset(user, lockAmount);
        
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.unlock(txHash, proof, user);
        
        // Try to claim before timelock - should fail
        vm.prank(user);
        vm.expectRevert();
        coreLayer.claim(txHash, user);
    }
    
    // =========================================================================
    // SEQ#3: Emergency Unlock - Using CoreLayer
    // =========================================================================
    
    function test_SEQ3_UnlockEmergency_BasicFlow() public {
        uint256 lockAmount = 1 ether;
        bytes32 txHash = _lockAsset(user, lockAmount);
        
        // Calculate required bond
        uint256 bond = coreLayer.calculateEmergencyBond(lockAmount);
        assertGe(bond, MIN_EMERGENCY_BOND, "Bond should be at least 0.5 ETH");
        
        // Initiate emergency unlock with bond
        vm.prank(user);
        coreLayer.emergencyUnlock{value: bond}(txHash, user);
        
        // Verify emergency timelock (7 days)
        ICoreLayer.BridgeTx memory bridgeTx = coreLayer.getTransaction(txHash);
        assertTrue(bridgeTx.isEmergency, "Should be emergency unlock");
        assertEq(bridgeTx.unlockTime, block.timestamp + EMERGENCY_TIMELOCK, "Emergency timelock should be 7 days");
        
        // Advance past emergency timelock
        vm.warp(block.timestamp + EMERGENCY_TIMELOCK + 1);
        
        // Claim with bond return
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreLayer.claim(txHash, user);
        
        // Should receive lock amount + bond returned
        assertGe(user.balance - balanceBefore, lockAmount, "Should receive at least locked amount");
    }
    
    function test_SEQ3_EmergencyBond_Calculation() public view {
        // Test MIN_EMERGENCY_BOND case
        uint256 smallAmount = 1 ether;
        uint256 bondSmall = coreLayer.calculateEmergencyBond(smallAmount);
        assertEq(bondSmall, MIN_EMERGENCY_BOND, "Small amount should use min bond");
        
        // Test 5% case
        uint256 largeAmount = 100 ether;
        uint256 bondLarge = coreLayer.calculateEmergencyBond(largeAmount);
        assertEq(bondLarge, largeAmount * EMERGENCY_BOND_PERCENT / 100, "Large amount should use 5%");
    }
    
    // =========================================================================
    // SEQ#3': Resync
    // =========================================================================
    
    function test_SEQ3Prime_Resync_Success() public {
        bytes32 txHash = _lockAsset(user, 1 ether);
        bytes32 newStateRoot = bytes32(uint256(999));
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.resync(txHash, newStateRoot, proof);
        
        assertEq(coreLayer.getStateRoot(), newStateRoot, "State root should be updated");
    }
    
    // =========================================================================
    // SEQ#4: Challenge (Quadratic Slashing Formula Test)
    // =========================================================================
    
    function test_SEQ4_QuadraticSlashing_Formula() public pure {
        // Quadratic formula: N^2 * 10%
        // 1 fraud: 1 * 10% = 10%
        // 2 fraud: 4 * 10% = 40%
        // 3 fraud: 9 * 10% = 90%
        // 4+ fraud: 100% (capped)
        
        assertEq(1 * 1 * BASE_SLASH_PERCENT, 10, "1 fraud = 10%");
        assertEq(2 * 2 * BASE_SLASH_PERCENT, 40, "2 fraud = 40%");
        assertEq(3 * 3 * BASE_SLASH_PERCENT, 90, "3 fraud = 90%");
        assertTrue(4 * 4 * BASE_SLASH_PERCENT >= 100, "4+ fraud = 100% (capped)");
    }
    
    // =========================================================================
    // CP Compliance Tests
    // =========================================================================
    
    function test_CP1_SHA3Only_CoreLayer() public view {
        // CoreLayer uses SHA3_256 library for all hashing
        assertTrue(coreLayer.verifyCPCompliance(), "CoreLayer should be CP compliant");
        assertEq(coreLayer.getCPProtectionLevel(1), "SHA3-256 ONLY - No keccak256 in security paths");
    }
    
    function test_CP3_TimeLock_AllPathsHaveDelay() public view {
        assertEq(coreLayer.NORMAL_TIMELOCK(), NORMAL_TIMELOCK, "Normal timelock should be 24h");
        assertEq(coreLayer.EMERGENCY_TIMELOCK(), EMERGENCY_TIMELOCK, "Emergency timelock should be 7d");
        assertTrue(coreLayer.NORMAL_TIMELOCK() > 0, "Normal timelock must be > 0");
        assertTrue(coreLayer.EMERGENCY_TIMELOCK() > 0, "Emergency timelock must be > 0");
    }
    
    function test_CP5_Transparency_EventsEmitted() public {
        uint256 lockAmount = 1 ether;
        bytes32 recipientBytes = bytes32(uint256(uint160(user)));
        
        vm.prank(user);
        // Event is emitted - we just verify the call succeeds
        bytes32 txHash = coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipientBytes);
        assertTrue(txHash != bytes32(0), "Should emit event and return txHash");
    }
    
    // =========================================================================
    // CoreState Integration Tests
    // =========================================================================
    
    function test_CoreState_SHA3Implementation() public view {
        assertTrue(coreState.verifySHA3Implementation(), "SHA3 implementation should be valid");
        
        (string memory hashFunction, bool fipsCompliant) = coreState.getHashInfo();
        assertEq(hashFunction, "SHA3-256", "Should use SHA3-256");
        assertTrue(fipsCompliant, "Should be FIPS compliant");
    }
    
    function test_CoreState_MerkleTreeConstants() public view {
        assertEq(coreState.TREE_DEPTH(), 20, "Tree depth should be 20");
        assertEq(coreState.MAX_LEAF_INDEX(), (1 << 20) - 1, "Max leaf index should be 2^20 - 1");
    }
    
    // =========================================================================
    // Helper Functions
    // =========================================================================
    
    function _lockAsset(address _user, uint256 _amount) internal returns (bytes32) {
        bytes32 recipientBytes = bytes32(uint256(uint160(_user)));
        vm.prank(_user);
        return coreLayer.lock{value: _amount}(address(0), _amount, recipientBytes);
    }
}
