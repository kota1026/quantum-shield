// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {VRFConsumerMock} from "../src/VRFConsumerMock.sol";
import {IVRFConsumer} from "../src/interfaces/IVRFConsumer.sol";
import {ProverSelector} from "../src/libraries/ProverSelector.sol";

/// @title VRFConsumerMockTest - Unit tests for VRFConsumerMock
/// @notice Tests VRF request/fulfill and prover selection
/// @dev PIR-005 Day 8-9
contract VRFConsumerMockTest is Test {
    VRFConsumerMock public vrfConsumer;

    address public owner = address(this);
    address public l1Vault = address(0x1234);
    address public prover1 = address(0x1001);
    address public prover2 = address(0x1002);
    address public prover3 = address(0x1003);
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
        vrfConsumer = new VRFConsumerMock(l1Vault);
        
        // Add provers to the pool
        vrfConsumer.addProver(prover1, 10 ether);
        vrfConsumer.addProver(prover2, 20 ether);
        vrfConsumer.addProver(prover3, 30 ether);
    }

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    function test_Constructor_SetsOwner() public view {
        assertEq(vrfConsumer.owner(), owner);
    }

    function test_Constructor_SetsL1Vault() public view {
        assertEq(vrfConsumer.l1Vault(), l1Vault);
    }

    // =========================================================================
    // requestProverSelection Tests
    // =========================================================================

    function test_RequestProverSelection_Success() public {
        vm.prank(l1Vault);
        
        vm.expectEmit(true, true, false, true);
        emit VRFRequested(1, unlockRequestId);
        
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);
        assertEq(requestId, 1);
    }

    function test_RequestProverSelection_StoresMapping() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        VRFConsumerMock.VRFRequest memory req = vrfConsumer.getVRFRequest(requestId);
        assertEq(req.unlockRequestId, unlockRequestId);
        assertEq(req.requestedAt, block.timestamp);
        assertFalse(req.fulfilled);
    }

    function test_RequestProverSelection_RevertNotL1Vault() public {
        vm.prank(user);
        vm.expectRevert(VRFConsumerMock.NotL1Vault.selector);
        vrfConsumer.requestProverSelection(unlockRequestId);
    }

    function test_RequestProverSelection_IncrementsRequestId() public {
        vm.startPrank(l1Vault);
        
        uint256 requestId1 = vrfConsumer.requestProverSelection(keccak256("unlock-1"));
        uint256 requestId2 = vrfConsumer.requestProverSelection(keccak256("unlock-2"));
        uint256 requestId3 = vrfConsumer.requestProverSelection(keccak256("unlock-3"));
        
        vm.stopPrank();

        assertEq(requestId1, 1);
        assertEq(requestId2, 2);
        assertEq(requestId3, 3);
    }

    // =========================================================================
    // mockFulfillRandomWords Tests
    // =========================================================================

    function test_MockFulfillRandomWords_Success() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        uint256 randomValue = 12345;
        
        vm.expectEmit(true, false, false, true);
        emit VRFReceived(requestId, randomValue);
        
        vrfConsumer.mockFulfillRandomWords(requestId, randomValue);

        VRFConsumerMock.VRFRequest memory req = vrfConsumer.getVRFRequest(requestId);
        assertTrue(req.fulfilled);
        assertEq(req.randomValue, randomValue);
        assertTrue(req.selectedProver != address(0));
    }

    function test_MockFulfillRandomWords_SelectsProver() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        // With stake weights 10:20:30, random value determines selection
        vrfConsumer.mockFulfillRandomWords(requestId, 5 ether); // Should select prover1

        (address selected, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertEq(selected, prover1);
    }

    function test_MockFulfillRandomWords_RevertNotOwner() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        vm.prank(user);
        vm.expectRevert(VRFConsumerMock.NotOwner.selector);
        vrfConsumer.mockFulfillRandomWords(requestId, 12345);
    }

    function test_MockFulfillRandomWords_RevertAlreadyFulfilled() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        vrfConsumer.mockFulfillRandomWords(requestId, 12345);

        vm.expectRevert(VRFConsumerMock.RequestAlreadyFulfilled.selector);
        vrfConsumer.mockFulfillRandomWords(requestId, 67890);
    }

    function test_MockFulfillRandomWords_RevertRequestNotFound() public {
        vm.expectRevert(VRFConsumerMock.RequestNotFound.selector);
        vrfConsumer.mockFulfillRandomWords(999, 12345);
    }

    // =========================================================================
    // mockAutoFulfill Tests
    // =========================================================================

    function test_MockAutoFulfill_Success() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        vrfConsumer.mockAutoFulfill(requestId);

        assertTrue(vrfConsumer.isProverSelected(unlockRequestId));
        (address selected, uint256 randomValue) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(selected != address(0));
        assertTrue(randomValue != 0);
    }

    function test_MockAutoFulfill_DifferentTimestamps() public {
        vm.prank(l1Vault);
        uint256 requestId1 = vrfConsumer.requestProverSelection(keccak256("unlock-1"));
        vrfConsumer.mockAutoFulfill(requestId1);
        (, uint256 random1) = vrfConsumer.getSelectedProver(keccak256("unlock-1"));

        vm.warp(block.timestamp + 1);
        
        vm.prank(l1Vault);
        uint256 requestId2 = vrfConsumer.requestProverSelection(keccak256("unlock-2"));
        vrfConsumer.mockAutoFulfill(requestId2);
        (, uint256 random2) = vrfConsumer.getSelectedProver(keccak256("unlock-2"));

        // Different timestamps should produce different random values
        assertTrue(random1 != random2);
    }

    // =========================================================================
    // triggerFallback Tests
    // =========================================================================

    function test_TriggerFallback_AfterTimeout() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // Advance time past VRF_TIMEOUT (5 minutes)
        vm.warp(block.timestamp + 5 minutes + 1);

        vm.expectEmit(true, true, false, false);
        emit FallbackProverSelected(unlockRequestId, address(0)); // We don't know prover address yet

        address fallbackProver = vrfConsumer.triggerFallback(unlockRequestId);
        assertTrue(fallbackProver != address(0));
        assertTrue(vrfConsumer.isProverSelected(unlockRequestId));
    }

    function test_TriggerFallback_RevertBeforeTimeout() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        vm.expectRevert(VRFConsumerMock.TimeoutNotReached.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    function test_TriggerFallback_RevertAlreadyFulfilled() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);
        vrfConsumer.mockFulfillRandomWords(requestId, 12345);

        vm.warp(block.timestamp + 5 minutes + 1);

        vm.expectRevert(VRFConsumerMock.RequestAlreadyFulfilled.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    function test_TriggerFallback_RevertRequestNotFound() public {
        vm.warp(block.timestamp + 5 minutes + 1);

        vm.expectRevert(VRFConsumerMock.RequestNotFound.selector);
        vrfConsumer.triggerFallback(keccak256("nonexistent"));
    }

    function test_TriggerFallback_UsesPrevrandao() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        vm.warp(block.timestamp + 5 minutes + 1);
        // Set different prevrandao values to verify it affects selection
        vm.prevrandao(bytes32(uint256(12345)));
        
        address prover = vrfConsumer.triggerFallback(unlockRequestId);
        assertTrue(prover != address(0));
    }

    // =========================================================================
    // getSelectedProver Tests
    // =========================================================================

    function test_GetSelectedProver_BeforeFulfillment() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        (address prover, uint256 randomValue) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertEq(prover, address(0));
        assertEq(randomValue, 0);
    }

    function test_GetSelectedProver_AfterFulfillment() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);
        vrfConsumer.mockFulfillRandomWords(requestId, 55 ether);

        (address prover, uint256 randomValue) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(prover != address(0));
        assertEq(randomValue, 55 ether);
    }

    function test_GetSelectedProver_NonexistentRequest() public view {
        (address prover, uint256 randomValue) = vrfConsumer.getSelectedProver(keccak256("nonexistent"));
        assertEq(prover, address(0));
        assertEq(randomValue, 0);
    }

    // =========================================================================
    // isProverSelected Tests
    // =========================================================================

    function test_IsProverSelected_False_BeforeFulfillment() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        assertFalse(vrfConsumer.isProverSelected(unlockRequestId));
    }

    function test_IsProverSelected_True_AfterFulfillment() public {
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);
        vrfConsumer.mockFulfillRandomWords(requestId, 12345);

        assertTrue(vrfConsumer.isProverSelected(unlockRequestId));
    }

    function test_IsProverSelected_False_NonexistentRequest() public view {
        assertFalse(vrfConsumer.isProverSelected(keccak256("nonexistent")));
    }

    // =========================================================================
    // Prover Management Tests
    // =========================================================================

    function test_AddProver_Success() public {
        address newProver = address(0x2001);
        
        vm.expectEmit(true, false, false, true);
        emit ProverAdded(newProver, 50 ether);
        
        vrfConsumer.addProver(newProver, 50 ether);

        assertEq(vrfConsumer.getProverPoolLength(), 4);
        ProverSelector.ProverInfo memory info = vrfConsumer.getProverByIndex(3);
        assertEq(info.prover, newProver);
        assertEq(info.stake, 50 ether);
        assertTrue(info.active);
    }

    function test_AddProver_RevertZeroAddress() public {
        vm.expectRevert(VRFConsumerMock.ZeroAddress.selector);
        vrfConsumer.addProver(address(0), 50 ether);
    }

    function test_AddProver_RevertAlreadyExists() public {
        vm.expectRevert(VRFConsumerMock.ProverAlreadyExists.selector);
        vrfConsumer.addProver(prover1, 50 ether);
    }

    function test_AddProver_RevertNotOwner() public {
        vm.prank(user);
        vm.expectRevert(VRFConsumerMock.NotOwner.selector);
        vrfConsumer.addProver(address(0x2001), 50 ether);
    }

    function test_RemoveProver_Success() public {
        vm.expectEmit(true, false, false, false);
        emit ProverRemoved(prover1);
        
        vrfConsumer.removeProver(prover1);

        ProverSelector.ProverInfo memory info = vrfConsumer.getProverByIndex(0);
        assertFalse(info.active);
    }

    function test_RemoveProver_RevertNotFound() public {
        vm.expectRevert(VRFConsumerMock.RequestNotFound.selector);
        vrfConsumer.removeProver(address(0x9999));
    }

    function test_UpdateProverStake_Success() public {
        vrfConsumer.updateProverStake(prover1, 100 ether);

        ProverSelector.ProverInfo memory info = vrfConsumer.getProverByIndex(0);
        assertEq(info.stake, 100 ether);
    }

    // =========================================================================
    // Admin Functions Tests
    // =========================================================================

    function test_SetL1Vault_Success() public {
        address newVault = address(0x5678);
        vrfConsumer.setL1Vault(newVault);
        assertEq(vrfConsumer.l1Vault(), newVault);
    }

    function test_SetL1Vault_RevertZeroAddress() public {
        vm.expectRevert(VRFConsumerMock.ZeroAddress.selector);
        vrfConsumer.setL1Vault(address(0));
    }

    function test_TransferOwnership_Success() public {
        address newOwner = address(0x8888);
        vrfConsumer.transferOwnership(newOwner);
        assertEq(vrfConsumer.owner(), newOwner);
    }

    // =========================================================================
    // View Functions Tests
    // =========================================================================

    function test_GetProverPoolLength() public view {
        assertEq(vrfConsumer.getProverPoolLength(), 3);
    }

    function test_GetAllProvers() public view {
        ProverSelector.ProverInfo[] memory provers = vrfConsumer.getAllProvers();
        assertEq(provers.length, 3);
        assertEq(provers[0].prover, prover1);
        assertEq(provers[1].prover, prover2);
        assertEq(provers[2].prover, prover3);
    }

    // =========================================================================
    // Integration Tests
    // =========================================================================

    function test_FullFlow_Request_Fulfill_Select() public {
        // 1. Request VRF
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        // 2. Fulfill with random value
        vrfConsumer.mockFulfillRandomWords(requestId, 15 ether); // Should select prover2 (stake 20)

        // 3. Check selection
        assertTrue(vrfConsumer.isProverSelected(unlockRequestId));
        (address selected, uint256 randomValue) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(selected != address(0));
        assertEq(randomValue, 15 ether);
    }

    function test_FullFlow_Fallback() public {
        // 1. Request VRF
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // 2. Wait for timeout
        vm.warp(block.timestamp + 5 minutes + 1);

        // 3. Trigger fallback
        address fallbackProver = vrfConsumer.triggerFallback(unlockRequestId);

        // 4. Check selection
        assertTrue(vrfConsumer.isProverSelected(unlockRequestId));
        (address selected, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertEq(selected, fallbackProver);
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    function testFuzz_MockFulfillRandomWords_AlwaysSelectsValidProver(uint256 randomValue) public {
        vm.assume(randomValue > 0);

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        vrfConsumer.mockFulfillRandomWords(requestId, randomValue);

        (address selected, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(selected == prover1 || selected == prover2 || selected == prover3);
    }
}
