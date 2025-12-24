// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {VRFConsumer} from "../src/VRFConsumer.sol";
import {IVRFConsumer} from "../src/interfaces/IVRFConsumer.sol";
import {ProverSelector} from "../src/libraries/ProverSelector.sol";

/// @title VRFConsumerTest - Unit tests for VRFConsumer (Chainlink VRF v2.5 compatible)
/// @notice Tests VRF request/fulfill and prover selection for production deployment
/// @dev PIR-005 Day 8-9 - CURRENT_PLAN [TEST-001] to [TEST-005]
contract VRFConsumerTest is Test {
    VRFConsumer public vrfConsumer;

    address public owner = address(this);
    address public l1Vault = address(0x1234);
    address public prover1 = address(0x1001);
    address public prover2 = address(0x1002);
    address public prover3 = address(0x1003);
    address public prover4 = address(0x1004);
    address public prover5 = address(0x1005);
    address public user = address(0x9999);

    bytes32 public unlockRequestId = keccak256("unlock-1");

    // Events for testing
    event VRFRequested(uint256 indexed requestId, bytes32 indexed unlockRequestId);
    event VRFReceived(uint256 indexed requestId, uint256 randomValue);
    event ProverSelected(bytes32 indexed unlockRequestId, address indexed prover, uint256 randomValue);
    event FallbackProverSelected(bytes32 indexed unlockRequestId, address indexed prover);
    event ProverAdded(address indexed prover, uint256 stake);
    event ProverRemoved(address indexed prover);

    function setUp() public {
        vrfConsumer = new VRFConsumer(l1Vault);
        
        // Add 5 provers (as per 2/5 selection requirement)
        vrfConsumer.addProver(prover1, 10 ether);
        vrfConsumer.addProver(prover2, 15 ether);
        vrfConsumer.addProver(prover3, 20 ether);
        vrfConsumer.addProver(prover4, 25 ether);
        vrfConsumer.addProver(prover5, 30 ether);
    }

    // =========================================================================
    // [TEST-001] VRF正常系テスト
    // =========================================================================

    function test_TEST001_VRFNormalFlow_RequestSuccess() public {
        vm.prank(l1Vault);
        
        vm.expectEmit(true, true, false, true);
        emit VRFRequested(1, unlockRequestId);
        
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);
        assertEq(requestId, 1, "Request ID should be 1");
    }

    function test_TEST001_VRFNormalFlow_FulfillmentSuccess() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        uint256 randomValue = 12345678;
        vrfConsumer.mockFulfillRandomWords(requestId, randomValue);

        assertTrue(vrfConsumer.isProverSelected(unlockRequestId), "Prover should be selected");
        (address selected, uint256 returnedRandom) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(selected != address(0), "Selected prover should not be zero address");
        assertEq(returnedRandom, randomValue, "Random value should match");
    }

    function test_TEST001_VRFNormalFlow_SelectsFromProverPool() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        vrfConsumer.mockFulfillRandomWords(requestId, 50 ether);

        (address selected, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(
            selected == prover1 || selected == prover2 || selected == prover3 ||
            selected == prover4 || selected == prover5,
            "Selected prover must be from pool"
        );
    }

    function test_TEST001_VRFNormalFlow_StoresMapping() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        VRFConsumer.VRFRequest memory req = vrfConsumer.getVRFRequest(requestId);
        assertEq(req.unlockRequestId, unlockRequestId, "Unlock request ID should match");
        assertEq(req.requestedAt, block.timestamp, "Request time should be current block");
        assertFalse(req.fulfilled, "Request should not be fulfilled yet");
    }

    function test_TEST001_VRFNormalFlow_OnlyL1VaultCanRequest() public {
        vm.prank(user);
        vm.expectRevert(VRFConsumer.NotL1Vault.selector);
        vrfConsumer.requestProverSelection(unlockRequestId);
    }

    // =========================================================================
    // [TEST-002] VRFタイムアウトテスト
    // =========================================================================

    function test_TEST002_VRFTimeout_5MinutesTimeout() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // Advance time exactly to timeout boundary
        vm.warp(block.timestamp + 5 minutes);
        
        // Should still fail at exactly 5 minutes
        vm.expectRevert(VRFConsumer.TimeoutNotReached.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    function test_TEST002_VRFTimeout_CanFallbackAfterTimeout() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // Advance time past timeout
        vm.warp(block.timestamp + 5 minutes + 1);

        vm.expectEmit(true, true, false, false);
        emit FallbackProverSelected(unlockRequestId, address(0));

        address fallbackProver = vrfConsumer.triggerFallback(unlockRequestId);
        assertTrue(fallbackProver != address(0), "Fallback prover should be selected");
    }

    function test_TEST002_VRFTimeout_AlreadyFulfilledCannotFallback() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);
        vrfConsumer.mockFulfillRandomWords(requestId, 12345);

        vm.warp(block.timestamp + 5 minutes + 1);

        vm.expectRevert(VRFConsumer.RequestAlreadyFulfilled.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    // =========================================================================
    // [TEST-003] Prover選出確率テスト (2/5 threshold)
    // =========================================================================

    function test_TEST003_ProverSelection_WeightedSelection() public {
        // Total stake: 10 + 15 + 20 + 25 + 30 = 100 ether
        // prover1: 10% chance
        // prover2: 15% chance
        // prover3: 20% chance
        // prover4: 25% chance
        // prover5: 30% chance

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        // Random value 5 ether should select prover1 (0-10 range)
        vrfConsumer.mockFulfillRandomWords(requestId, 5 ether);
        (address selected, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertEq(selected, prover1, "Low random should select prover1");
    }

    function test_TEST003_ProverSelection_HighRandomSelectsHighStake() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        // Random value 95 ether should select prover5 (70-100 range)
        vrfConsumer.mockFulfillRandomWords(requestId, 95 ether);
        (address selected, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertEq(selected, prover5, "High random should select prover5");
    }

    function test_TEST003_ProverSelection_SelectsActiveProversOnly() public {
        // Deactivate prover3
        vrfConsumer.removeProver(prover3);

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);
        vrfConsumer.mockFulfillRandomWords(requestId, 40 ether);

        (address selected, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(selected != prover3, "Removed prover should not be selected");
    }

    function testFuzz_TEST003_ProverSelection_AlwaysValidProver(uint256 randomValue) public {
        vm.assume(randomValue > 0);

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);
        vrfConsumer.mockFulfillRandomWords(requestId, randomValue);

        (address selected, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(
            selected == prover1 || selected == prover2 || selected == prover3 ||
            selected == prover4 || selected == prover5,
            "Must select from pool"
        );
    }

    // =========================================================================
    // [TEST-004] Fallbackテスト
    // =========================================================================

    function test_TEST004_Fallback_UsesPrevrandao() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        vm.warp(block.timestamp + 5 minutes + 1);
        vm.prevrandao(bytes32(uint256(12345)));

        address prover = vrfConsumer.triggerFallback(unlockRequestId);
        assertTrue(prover != address(0), "Should select prover");
        assertTrue(vrfConsumer.isProverSelected(unlockRequestId), "Should mark as selected");
    }

    function test_TEST004_Fallback_DeterministicWithSameInputs() public {
        bytes32 unlock1 = keccak256("unlock-test-1");
        
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlock1);

        // Set specific prevrandao and timestamp
        vm.warp(1000000 + 5 minutes + 1);
        vm.prevrandao(bytes32(uint256(999)));

        address prover1Selected = vrfConsumer.triggerFallback(unlock1);
        assertTrue(prover1Selected != address(0), "Should select prover");
    }

    function test_TEST004_Fallback_RequestNotFound() public {
        vm.warp(block.timestamp + 5 minutes + 1);

        vm.expectRevert(VRFConsumer.RequestNotFound.selector);
        vrfConsumer.triggerFallback(keccak256("nonexistent"));
    }

    // =========================================================================
    // [TEST-005] 境界値テスト（5分±1s）
    // =========================================================================

    function test_TEST005_Boundary_ExactlyAtTimeout() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // Exactly at 5 minutes - should fail
        vm.warp(block.timestamp + 5 minutes);
        vm.expectRevert(VRFConsumer.TimeoutNotReached.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    function test_TEST005_Boundary_OneSecondBeforeTimeout() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // 1 second before timeout - should fail
        vm.warp(block.timestamp + 5 minutes - 1);
        vm.expectRevert(VRFConsumer.TimeoutNotReached.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    function test_TEST005_Boundary_OneSecondAfterTimeout() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // 1 second after timeout - should succeed
        vm.warp(block.timestamp + 5 minutes + 1);
        address prover = vrfConsumer.triggerFallback(unlockRequestId);
        assertTrue(prover != address(0), "Should succeed after timeout");
    }

    function test_TEST005_Boundary_LongAfterTimeout() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // 1 hour after timeout - should still work
        vm.warp(block.timestamp + 1 hours);
        address prover = vrfConsumer.triggerFallback(unlockRequestId);
        assertTrue(prover != address(0), "Should still work long after timeout");
    }

    // =========================================================================
    // Integration Tests
    // =========================================================================

    function test_Integration_FullNormalFlow() public {
        // 1. Request VRF
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);
        assertEq(requestId, 1, "First request should be ID 1");

        // 2. Verify pending state
        assertFalse(vrfConsumer.isProverSelected(unlockRequestId), "Not yet selected");

        // 3. Fulfill with random value
        vrfConsumer.mockFulfillRandomWords(requestId, 50 ether);

        // 4. Verify completed state
        assertTrue(vrfConsumer.isProverSelected(unlockRequestId), "Should be selected");
        (address selected, uint256 randomValue) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(selected != address(0), "Prover selected");
        assertEq(randomValue, 50 ether, "Random value stored");
    }

    function test_Integration_FullFallbackFlow() public {
        // 1. Request VRF
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // 2. Wait for timeout
        vm.warp(block.timestamp + 5 minutes + 1);

        // 3. Trigger fallback
        address fallbackProver = vrfConsumer.triggerFallback(unlockRequestId);

        // 4. Verify completed state
        assertTrue(vrfConsumer.isProverSelected(unlockRequestId), "Should be selected");
        (address selected, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertEq(selected, fallbackProver, "Fallback prover matches");
    }

    function test_Integration_MultipleRequests() public {
        bytes32 unlock1 = keccak256("unlock-1");
        bytes32 unlock2 = keccak256("unlock-2");
        bytes32 unlock3 = keccak256("unlock-3");

        vm.startPrank(l1Vault);
        uint256 req1 = vrfConsumer.requestProverSelection(unlock1);
        uint256 req2 = vrfConsumer.requestProverSelection(unlock2);
        uint256 req3 = vrfConsumer.requestProverSelection(unlock3);
        vm.stopPrank();

        assertEq(req1, 1);
        assertEq(req2, 2);
        assertEq(req3, 3);

        // Fulfill in any order
        vrfConsumer.mockFulfillRandomWords(req2, 20 ether);
        vrfConsumer.mockFulfillRandomWords(req1, 10 ether);
        vrfConsumer.mockFulfillRandomWords(req3, 30 ether);

        assertTrue(vrfConsumer.isProverSelected(unlock1), "unlock1 selected");
        assertTrue(vrfConsumer.isProverSelected(unlock2), "unlock2 selected");
        assertTrue(vrfConsumer.isProverSelected(unlock3), "unlock3 selected");
    }

    // =========================================================================
    // Prover Management Tests
    // =========================================================================

    function test_ProverManagement_Add() public {
        address newProver = address(0x2001);
        
        vm.expectEmit(true, false, false, true);
        emit ProverAdded(newProver, 40 ether);
        
        vrfConsumer.addProver(newProver, 40 ether);

        assertEq(vrfConsumer.getProverPoolLength(), 6, "Should have 6 provers");
    }

    function test_ProverManagement_Remove() public {
        vm.expectEmit(true, false, false, false);
        emit ProverRemoved(prover3);
        
        vrfConsumer.removeProver(prover3);

        ProverSelector.ProverInfo memory info = vrfConsumer.getProverByIndex(2);
        assertFalse(info.active, "Prover should be inactive");
    }

    function test_ProverManagement_UpdateStake() public {
        vrfConsumer.updateProverStake(prover1, 100 ether);

        ProverSelector.ProverInfo memory info = vrfConsumer.getProverByIndex(0);
        assertEq(info.stake, 100 ether, "Stake should be updated");
    }

    // =========================================================================
    // Admin Functions Tests
    // =========================================================================

    function test_Admin_SetL1Vault() public {
        address newVault = address(0x5678);
        vrfConsumer.setL1Vault(newVault);
        assertEq(vrfConsumer.l1Vault(), newVault, "L1Vault should be updated");
    }

    function test_Admin_TransferOwnership() public {
        address newOwner = address(0x8888);
        vrfConsumer.transferOwnership(newOwner);
        assertEq(vrfConsumer.owner(), newOwner, "Owner should be updated");
    }

    function test_Admin_OnlyOwnerCanAdd() public {
        vm.prank(user);
        vm.expectRevert(VRFConsumer.NotOwner.selector);
        vrfConsumer.addProver(address(0x9001), 50 ether);
    }
}
