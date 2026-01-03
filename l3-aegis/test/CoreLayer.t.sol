// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/core/CoreLayer.sol";

/**
 * @title CoreLayerTest
 * @notice Unit tests for CoreLayer.sol
 * @dev Tests Sequences #1-4, #3' per SPEC_STRATEGY_BRIDGE.md
 */
contract CoreLayerTest is Test {
    CoreLayer public coreLayer;
    
    address public user;
    address public recipient;
    
    uint256 public constant NORMAL_TIMELOCK = 24 hours;
    uint256 public constant EMERGENCY_TIMELOCK = 7 days;
    uint256 public constant MIN_EMERGENCY_BOND = 0.5 ether;
    
    event AssetLocked(bytes32 indexed txHash, address indexed sender, address token, uint256 amount, bytes32 recipient);
    event AssetUnlocked(bytes32 indexed txHash, address indexed recipient, uint256 amount, bool isEmergency);
    
    function setUp() public {
        coreLayer = new CoreLayer();
        user = makeAddr("user");
        recipient = makeAddr("recipient");
        
        vm.deal(user, 100 ether);
        vm.deal(address(coreLayer), 100 ether);
    }
    
    // =========================================================================
    // Constructor Tests
    // =========================================================================
    
    function test_Constructor_InitialState() public view {
        assertEq(coreLayer.getStateRoot(), bytes32(0), "Initial state root should be 0");
        assertEq(coreLayer.NORMAL_TIMELOCK(), NORMAL_TIMELOCK, "Normal timelock should be 24h");
        assertEq(coreLayer.EMERGENCY_TIMELOCK(), EMERGENCY_TIMELOCK, "Emergency timelock should be 7d");
    }
    
    // =========================================================================
    // SEQ#1: Lock Tests
    // =========================================================================
    
    function test_Lock_ETH_Success() public {
        uint256 lockAmount = 1 ether;
        bytes32 recipientBytes = bytes32(uint256(uint160(recipient)));
        
        vm.prank(user);
        bytes32 txHash = coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipientBytes);
        
        assertTrue(txHash != bytes32(0), "txHash should not be 0");
        assertTrue(coreLayer.isLocked(txHash), "Asset should be locked");
        
        ICoreLayer.BridgeTx memory bridgeTx = coreLayer.getTransaction(txHash);
        assertEq(bridgeTx.amount, lockAmount, "Amount should match");
        assertEq(bridgeTx.recipient, recipientBytes, "Recipient should match");
        assertEq(bridgeTx.token, address(0), "Token should be ETH (address 0)");
        assertFalse(bridgeTx.executed, "Should not be executed");
        assertEq(bridgeTx.unlockTime, 0, "Unlock time should be 0");
    }
    
    function test_Lock_ZeroAmount_Reverts() public {
        bytes32 recipientBytes = bytes32(uint256(uint160(recipient)));
        
        vm.prank(user);
        vm.expectRevert(ICoreLayer.InvalidAmount.selector);
        coreLayer.lock{value: 0}(address(0), 0, recipientBytes);
    }
    
    function test_Lock_MismatchedValue_Reverts() public {
        bytes32 recipientBytes = bytes32(uint256(uint160(recipient)));
        
        vm.prank(user);
        vm.expectRevert(ICoreLayer.InvalidAmount.selector);
        coreLayer.lock{value: 1 ether}(address(0), 2 ether, recipientBytes);
    }
    
    function test_Lock_EmitsEvent() public {
        uint256 lockAmount = 1 ether;
        bytes32 recipientBytes = bytes32(uint256(uint160(recipient)));
        
        vm.prank(user);
        vm.expectEmit(false, true, true, true);
        emit AssetLocked(bytes32(0), user, address(0), lockAmount, recipientBytes);
        coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipientBytes);
    }
    
    function test_Lock_UniqueTxHash() public {
        uint256 lockAmount = 1 ether;
        bytes32 recipientBytes = bytes32(uint256(uint160(recipient)));
        
        vm.startPrank(user);
        bytes32 txHash1 = coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipientBytes);
        bytes32 txHash2 = coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipientBytes);
        vm.stopPrank();
        
        assertTrue(txHash1 != txHash2, "txHashes should be unique");
    }
    
    // =========================================================================
    // SEQ#2: Normal Unlock Tests
    // =========================================================================
    
    function test_Unlock_Normal_Success() public {
        bytes32 txHash = _lockETH(user, 1 ether);
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.unlock(txHash, proof, recipient);
        
        ICoreLayer.BridgeTx memory bridgeTx = coreLayer.getTransaction(txHash);
        assertEq(bridgeTx.unlockTime, block.timestamp + NORMAL_TIMELOCK, "Unlock time should be set");
        assertFalse(bridgeTx.isEmergency, "Should not be emergency");
    }
    
    function test_Unlock_NotFound_Reverts() public {
        bytes32 fakeTxHash = bytes32(uint256(12345));
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)));
        
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(ICoreLayer.TransactionNotFound.selector, fakeTxHash));
        coreLayer.unlock(fakeTxHash, proof, recipient);
    }
    
    function test_Unlock_EmptyProof_Reverts() public {
        bytes32 txHash = _lockETH(user, 1 ether);
        bytes memory emptyProof = "";
        
        vm.prank(user);
        vm.expectRevert(ICoreLayer.StateVerificationFailed.selector);
        coreLayer.unlock(txHash, emptyProof, recipient);
    }
    
    // =========================================================================
    // Claim Tests
    // =========================================================================
    
    function test_Claim_AfterTimelock_Success() public {
        uint256 lockAmount = 1 ether;
        bytes32 txHash = _lockETH(user, lockAmount);
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.unlock(txHash, proof, recipient);
        
        // Advance time past timelock
        vm.warp(block.timestamp + NORMAL_TIMELOCK + 1);
        
        uint256 balanceBefore = recipient.balance;
        vm.prank(user);
        coreLayer.claim(txHash, recipient);
        
        assertEq(recipient.balance - balanceBefore, lockAmount, "Should receive locked amount");
        assertFalse(coreLayer.isLocked(txHash), "Should no longer be locked");
    }
    
    function test_Claim_BeforeTimelock_Reverts() public {
        bytes32 txHash = _lockETH(user, 1 ether);
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.unlock(txHash, proof, recipient);
        
        // Don't advance time
        vm.prank(user);
        vm.expectRevert();
        coreLayer.claim(txHash, recipient);
    }
    
    function test_Claim_AlreadyExecuted_Reverts() public {
        bytes32 txHash = _lockETH(user, 1 ether);
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.unlock(txHash, proof, recipient);
        vm.warp(block.timestamp + NORMAL_TIMELOCK + 1);
        
        vm.prank(user);
        coreLayer.claim(txHash, recipient);
        
        // Try to claim again
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(ICoreLayer.TransactionAlreadyExecuted.selector, txHash));
        coreLayer.claim(txHash, recipient);
    }
    
    // =========================================================================
    // SEQ#3: Emergency Unlock Tests
    // =========================================================================
    
    function test_EmergencyUnlock_Success() public {
        uint256 lockAmount = 1 ether;
        bytes32 txHash = _lockETH(user, lockAmount);
        uint256 bond = coreLayer.calculateEmergencyBond(lockAmount);
        
        vm.prank(user);
        coreLayer.emergencyUnlock{value: bond}(txHash, recipient);
        
        ICoreLayer.BridgeTx memory bridgeTx = coreLayer.getTransaction(txHash);
        assertTrue(bridgeTx.isEmergency, "Should be emergency unlock");
        assertEq(bridgeTx.unlockTime, block.timestamp + EMERGENCY_TIMELOCK, "Should use 7d timelock");
        assertEq(coreLayer.getEmergencyBond(txHash), bond, "Bond should be stored");
    }
    
    function test_EmergencyUnlock_InsufficientBond_Reverts() public {
        bytes32 txHash = _lockETH(user, 1 ether);
        
        vm.prank(user);
        vm.expectRevert(ICoreLayer.InvalidAmount.selector);
        coreLayer.emergencyUnlock{value: 0.1 ether}(txHash, recipient);
    }
    
    function test_EmergencyBond_MinBondForSmallAmounts() public view {
        uint256 smallAmount = 1 ether;
        uint256 bond = coreLayer.calculateEmergencyBond(smallAmount);
        assertEq(bond, MIN_EMERGENCY_BOND, "Should use min bond for small amounts");
    }
    
    function test_EmergencyBond_FivePercentForLargeAmounts() public view {
        uint256 largeAmount = 100 ether;
        uint256 bond = coreLayer.calculateEmergencyBond(largeAmount);
        assertEq(bond, largeAmount * 5 / 100, "Should use 5% for large amounts");
    }
    
    function test_EmergencyUnlock_ClaimReturnsBond() public {
        uint256 lockAmount = 10 ether;
        bytes32 txHash = _lockETH(user, lockAmount);
        uint256 bond = coreLayer.calculateEmergencyBond(lockAmount);
        
        vm.prank(user);
        coreLayer.emergencyUnlock{value: bond}(txHash, recipient);
        
        vm.warp(block.timestamp + EMERGENCY_TIMELOCK + 1);
        
        uint256 userBalanceBefore = user.balance;
        vm.prank(user);
        coreLayer.claim(txHash, recipient);
        
        // User should get bond back (as msg.sender)
        assertEq(user.balance - userBalanceBefore, bond, "Bond should be returned to claimer");
    }
    
    // =========================================================================
    // CP Compliance Tests
    // =========================================================================
    
    function test_CP1_SHA3Only() public view {
        assertTrue(coreLayer.verifyCPCompliance(), "Should be CP compliant");
        assertEq(
            coreLayer.getCPProtectionLevel(1), 
            "SHA3-256 ONLY - No keccak256 in security paths",
            "CP-1 description"
        );
    }
    
    function test_CP3_TimeLocks() public view {
        assertEq(coreLayer.NORMAL_TIMELOCK(), 24 hours, "Normal timelock = 24h");
        assertEq(coreLayer.EMERGENCY_TIMELOCK(), 7 days, "Emergency timelock = 7d");
        assertEq(
            coreLayer.getCPProtectionLevel(3), 
            "TIME_LOCKS - 24h normal, 7d emergency (immutable)",
            "CP-3 description"
        );
    }
    
    function test_CP5_TransparencyEvents() public view {
        // Events are tested in individual test cases
        // This test verifies the CP-5 description
        assertEq(
            coreLayer.getCPProtectionLevel(5), 
            "TRANSPARENCY - All operations emit events",
            "CP-5 description"
        );
    }
    
    // =========================================================================
    // SEQ#3': Resync Tests
    // =========================================================================
    
    function test_Resync_Success() public {
        bytes32 txHash = _lockETH(user, 1 ether);
        bytes32 newStateRoot = bytes32(uint256(999));
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        vm.prank(user);
        coreLayer.resync(txHash, newStateRoot, proof);
        
        assertEq(coreLayer.getStateRoot(), newStateRoot, "State root should be updated");
    }
    
    function test_Resync_InvalidTx_Reverts() public {
        bytes32 fakeTxHash = bytes32(uint256(12345));
        bytes32 newStateRoot = bytes32(uint256(999));
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)));
        
        vm.expectRevert(abi.encodeWithSelector(ICoreLayer.TransactionNotFound.selector, fakeTxHash));
        coreLayer.resync(fakeTxHash, newStateRoot, proof);
    }
    
    // =========================================================================
    // View Functions Tests
    // =========================================================================
    
    function test_IsLocked() public {
        bytes32 txHash = _lockETH(user, 1 ether);
        assertTrue(coreLayer.isLocked(txHash), "Should be locked");
        
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        vm.prank(user);
        coreLayer.unlock(txHash, proof, recipient);
        vm.warp(block.timestamp + NORMAL_TIMELOCK + 1);
        
        vm.prank(user);
        coreLayer.claim(txHash, recipient);
        assertFalse(coreLayer.isLocked(txHash), "Should not be locked after claim");
    }
    
    function test_VerifyState() public view {
        bytes memory validProof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        bytes memory emptyProof = "";
        
        assertTrue(coreLayer.verifyState(bytes32(0), validProof), "Should verify with empty state root");
        assertFalse(coreLayer.verifyState(bytes32(uint256(1)), emptyProof), "Should fail with empty proof");
    }
    
    // =========================================================================
    // Helper Functions
    // =========================================================================
    
    function _lockETH(address _user, uint256 _amount) internal returns (bytes32) {
        bytes32 recipientBytes = bytes32(uint256(uint160(recipient)));
        vm.prank(_user);
        return coreLayer.lock{value: _amount}(address(0), _amount, recipientBytes);
    }
}
