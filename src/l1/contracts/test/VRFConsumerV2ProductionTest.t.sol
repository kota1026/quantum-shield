// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {VRFConsumerV2Production} from "../src/VRFConsumerV2Production.sol";
import {VRFCoordinatorV2_5Mock} from "../src/chainlink/VRFCoordinatorV2_5Mock.sol";
import {ChainlinkVRFConfig} from "../src/chainlink/ChainlinkVRFConfig.sol";
import {ProverSelector} from "../src/libraries/ProverSelector.sol";

/// @title VRFConsumerV2ProductionTest
/// @notice Test suite for VRFConsumerV2Production
/// @dev TASK-P5-005-PROD: Chainlink VRF Production Integration Tests
contract VRFConsumerV2ProductionTest is Test {
    VRFConsumerV2Production public vrfConsumer;
    VRFCoordinatorV2_5Mock public vrfCoordinator;

    address public owner = address(this);
    address public l1Vault = address(0x1111);
    address public prover1 = address(0x2222);
    address public prover2 = address(0x3333);
    address public prover3 = address(0x4444);
    address public user = address(0x5555);

    uint256 public subscriptionId;
    bytes32 public keyHash = ChainlinkVRFConfig.ETH_SEPOLIA_KEY_HASH;

    event VRFRequested(uint256 indexed requestId, bytes32 indexed unlockRequestId);
    event VRFReceived(uint256 indexed requestId, uint256 randomValue);
    event ProverSelected(bytes32 indexed unlockRequestId, address indexed prover, uint256 randomValue);
    event FallbackProverSelected(bytes32 indexed unlockRequestId, address indexed prover);
    event ProverAdded(address indexed prover, uint256 stake);
    event ProverRemoved(address indexed prover);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function setUp() public {
        // Deploy mock VRF Coordinator
        vrfCoordinator = new VRFCoordinatorV2_5Mock();

        // Create and fund subscription
        subscriptionId = vrfCoordinator.createSubscription();
        vrfCoordinator.fundSubscription(subscriptionId, 10 ether);

        // Deploy VRF Consumer
        vrfConsumer = new VRFConsumerV2Production(
            address(vrfCoordinator),
            l1Vault,
            keyHash,
            subscriptionId
        );

        // Add consumer to subscription
        vrfCoordinator.addConsumer(subscriptionId, address(vrfConsumer));

        // Add provers
        vrfConsumer.addProver(prover1, 100 ether);
        vrfConsumer.addProver(prover2, 200 ether);
        vrfConsumer.addProver(prover3, 300 ether);
    }

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    function test_Constructor_SetsCorrectValues() public view {
        assertEq(vrfConsumer.owner(), owner);
        assertEq(vrfConsumer.l1Vault(), l1Vault);
        assertEq(vrfConsumer.getVRFCoordinator(), address(vrfCoordinator));

        VRFConsumerV2Production.VRFConfig memory config = vrfConsumer.getVRFConfig();
        assertEq(config.keyHash, keyHash);
        assertEq(config.subscriptionId, subscriptionId);
        assertEq(config.callbackGasLimit, vrfConsumer.DEFAULT_CALLBACK_GAS_LIMIT());
        assertEq(config.requestConfirmations, vrfConsumer.DEFAULT_REQUEST_CONFIRMATIONS());
        assertEq(config.useNativePayment, false);
    }

    function test_Constructor_RevertsOnZeroL1Vault() public {
        vm.expectRevert(VRFConsumerV2Production.ZeroAddress.selector);
        new VRFConsumerV2Production(
            address(vrfCoordinator),
            address(0),
            keyHash,
            subscriptionId
        );
    }

    function test_Constructor_RevertsOnZeroKeyHash() public {
        vm.expectRevert(VRFConsumerV2Production.InvalidKeyHash.selector);
        new VRFConsumerV2Production(
            address(vrfCoordinator),
            l1Vault,
            bytes32(0),
            subscriptionId
        );
    }

    function test_Constructor_RevertsOnZeroSubscriptionId() public {
        vm.expectRevert(VRFConsumerV2Production.InvalidSubscriptionId.selector);
        new VRFConsumerV2Production(
            address(vrfCoordinator),
            l1Vault,
            keyHash,
            0
        );
    }

    // =========================================================================
    // Request Prover Selection Tests
    // =========================================================================

    function test_RequestProverSelection_Success() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        vm.expectEmit(true, true, false, false);
        emit VRFRequested(1, unlockRequestId);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        assertEq(requestId, 1);
        assertEq(vrfConsumer.unlockToVRFRequest(unlockRequestId), requestId);

        VRFConsumerV2Production.VRFRequest memory req = vrfConsumer.getVRFRequest(requestId);
        assertEq(req.unlockRequestId, unlockRequestId);
        assertEq(req.fulfilled, false);
        assertEq(req.selectedProver, address(0));
    }

    function test_RequestProverSelection_RevertsOnNonL1Vault() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(user);
        vm.expectRevert(VRFConsumerV2Production.NotL1Vault.selector);
        vrfConsumer.requestProverSelection(unlockRequestId);
    }

    function test_RequestProverSelection_MultipleRequests() public {
        bytes32 unlock1 = keccak256("unlock1");
        bytes32 unlock2 = keccak256("unlock2");

        vm.startPrank(l1Vault);
        uint256 requestId1 = vrfConsumer.requestProverSelection(unlock1);
        uint256 requestId2 = vrfConsumer.requestProverSelection(unlock2);
        vm.stopPrank();

        assertEq(requestId1, 1);
        assertEq(requestId2, 2);
        assertEq(vrfConsumer.unlockToVRFRequest(unlock1), requestId1);
        assertEq(vrfConsumer.unlockToVRFRequest(unlock2), requestId2);
    }

    // =========================================================================
    // VRF Fulfillment Tests
    // =========================================================================

    function test_FulfillRandomWords_Success() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        uint256 randomValue = 12345;

        vm.expectEmit(true, false, false, true);
        emit VRFReceived(requestId, randomValue);

        vrfCoordinator.fulfillRandomWordsSimple(requestId, randomValue);

        VRFConsumerV2Production.VRFRequest memory req = vrfConsumer.getVRFRequest(requestId);
        assertEq(req.fulfilled, true);
        assertEq(req.randomValue, randomValue);
        assertTrue(req.selectedProver != address(0));

        // Verify selected prover is one of the registered provers
        assertTrue(
            req.selectedProver == prover1 ||
            req.selectedProver == prover2 ||
            req.selectedProver == prover3
        );
    }

    function test_FulfillRandomWords_SelectsProverByWeight() public {
        // Run multiple fulfillments and check distribution
        uint256 prover3Count = 0;
        uint256 iterations = 100;

        for (uint256 i = 0; i < iterations; i++) {
            // Create new consumer for each test to avoid state issues
            VRFConsumerV2Production consumer = new VRFConsumerV2Production(
                address(vrfCoordinator),
                l1Vault,
                keyHash,
                subscriptionId
            );
            vrfCoordinator.addConsumer(subscriptionId, address(consumer));

            consumer.addProver(prover1, 100 ether); // 16.67%
            consumer.addProver(prover2, 200 ether); // 33.33%
            consumer.addProver(prover3, 300 ether); // 50%

            bytes32 unlockRequestId = keccak256(abi.encodePacked("unlock", i));

            vm.prank(l1Vault);
            uint256 requestId = consumer.requestProverSelection(unlockRequestId);

            uint256 randomValue = uint256(keccak256(abi.encodePacked(i, block.timestamp)));
            vrfCoordinator.fulfillRandomWordsSimple(requestId, randomValue);

            VRFConsumerV2Production.VRFRequest memory req = consumer.getVRFRequest(requestId);
            if (req.selectedProver == prover3) {
                prover3Count++;
            }
        }

        // Prover3 has 50% weight, should be selected roughly 50% of the time
        // Allow 20% deviation for randomness
        assertGt(prover3Count, 30, "Prover3 should be selected at least 30% of time");
        assertLt(prover3Count, 70, "Prover3 should be selected at most 70% of time");
    }

    function test_FulfillRandomWords_RevertsOnUnauthorized() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 12345;

        // Try to call rawFulfillRandomWords directly (not from coordinator)
        vm.expectRevert();
        vm.prank(user);
        vrfConsumer.rawFulfillRandomWords(requestId, randomWords);
    }

    function test_FulfillRandomWords_RevertsOnAlreadyFulfilled() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        vrfCoordinator.fulfillRandomWordsSimple(requestId, 12345);

        // Try to fulfill again
        vm.expectRevert(); // Will revert in mock or consumer
        vrfCoordinator.fulfillRandomWordsSimple(requestId, 67890);
    }

    // =========================================================================
    // Fallback Tests
    // =========================================================================

    function test_TriggerFallback_Success() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // Fast forward past timeout
        vm.warp(block.timestamp + vrfConsumer.VRF_TIMEOUT() + 1);

        vm.expectEmit(true, false, false, false);
        emit FallbackProverSelected(unlockRequestId, address(0)); // Address will be set

        address selectedProver = vrfConsumer.triggerFallback(unlockRequestId);

        assertTrue(selectedProver != address(0));
        assertTrue(
            selectedProver == prover1 ||
            selectedProver == prover2 ||
            selectedProver == prover3
        );

        assertEq(vrfConsumer.isProverSelected(unlockRequestId), true);
    }

    function test_TriggerFallback_RevertsBeforeTimeout() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // Don't fast forward - still within timeout
        vm.expectRevert(VRFConsumerV2Production.TimeoutNotReached.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    function test_TriggerFallback_RevertsOnAlreadyFulfilled() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        // Fulfill via VRF
        vrfCoordinator.fulfillRandomWordsSimple(requestId, 12345);

        // Fast forward past timeout
        vm.warp(block.timestamp + vrfConsumer.VRF_TIMEOUT() + 1);

        // Try fallback on already fulfilled request
        vm.expectRevert(VRFConsumerV2Production.RequestAlreadyFulfilled.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    function test_TriggerFallback_RevertsOnInvalidRequest() public {
        bytes32 invalidRequestId = keccak256("invalid");

        vm.expectRevert(VRFConsumerV2Production.RequestNotFound.selector);
        vrfConsumer.triggerFallback(invalidRequestId);
    }

    // =========================================================================
    // View Functions Tests
    // =========================================================================

    function test_GetSelectedProver_BeforeFulfillment() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        (address prover, uint256 randomValue) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertEq(prover, address(0));
        assertEq(randomValue, 0);
    }

    function test_GetSelectedProver_AfterFulfillment() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        vrfCoordinator.fulfillRandomWordsSimple(requestId, 12345);

        (address prover, uint256 randomValue) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(prover != address(0));
        assertEq(randomValue, 12345);
    }

    function test_IsProverSelected() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        assertEq(vrfConsumer.isProverSelected(unlockRequestId), false);

        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        assertEq(vrfConsumer.isProverSelected(unlockRequestId), false);

        vrfCoordinator.fulfillRandomWordsSimple(requestId, 12345);

        assertEq(vrfConsumer.isProverSelected(unlockRequestId), true);
    }

    function test_CheckTimeout() public {
        bytes32 unlockRequestId = keccak256("unlock1");

        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        (bool isTimedOut, uint256 timeRemaining) = vrfConsumer.checkTimeout(unlockRequestId);
        assertEq(isTimedOut, false);
        assertEq(timeRemaining, vrfConsumer.VRF_TIMEOUT());

        // Fast forward half the timeout
        vm.warp(block.timestamp + 150);
        (isTimedOut, timeRemaining) = vrfConsumer.checkTimeout(unlockRequestId);
        assertEq(isTimedOut, false);
        assertEq(timeRemaining, vrfConsumer.VRF_TIMEOUT() - 150);

        // Fast forward past timeout
        vm.warp(block.timestamp + vrfConsumer.VRF_TIMEOUT());
        (isTimedOut, timeRemaining) = vrfConsumer.checkTimeout(unlockRequestId);
        assertEq(isTimedOut, true);
        assertEq(timeRemaining, 0);
    }

    // =========================================================================
    // Prover Management Tests
    // =========================================================================

    function test_AddProver_Success() public {
        address newProver = address(0x6666);

        vm.expectEmit(true, false, false, true);
        emit ProverAdded(newProver, 500 ether);

        vrfConsumer.addProver(newProver, 500 ether);

        assertEq(vrfConsumer.getProverPoolLength(), 4);
        assertEq(vrfConsumer.getActiveProverCount(), 4);
    }

    function test_AddProver_RevertsOnZeroAddress() public {
        vm.expectRevert(VRFConsumerV2Production.ZeroAddress.selector);
        vrfConsumer.addProver(address(0), 100 ether);
    }

    function test_AddProver_RevertsOnDuplicate() public {
        vm.expectRevert(VRFConsumerV2Production.ProverAlreadyExists.selector);
        vrfConsumer.addProver(prover1, 500 ether);
    }

    function test_AddProver_RevertsOnNonOwner() public {
        vm.prank(user);
        vm.expectRevert(VRFConsumerV2Production.NotOwner.selector);
        vrfConsumer.addProver(address(0x6666), 100 ether);
    }

    function test_RemoveProver_Success() public {
        vm.expectEmit(true, false, false, false);
        emit ProverRemoved(prover1);

        vrfConsumer.removeProver(prover1);

        assertEq(vrfConsumer.getProverPoolLength(), 3); // Still 3, just inactive
        assertEq(vrfConsumer.getActiveProverCount(), 2);
    }

    function test_RemoveProver_RevertsOnNotFound() public {
        vm.expectRevert(VRFConsumerV2Production.ProverNotFound.selector);
        vrfConsumer.removeProver(address(0x9999));
    }

    function test_ReactivateProver() public {
        vrfConsumer.removeProver(prover1);
        assertEq(vrfConsumer.getActiveProverCount(), 2);

        vrfConsumer.reactivateProver(prover1);
        assertEq(vrfConsumer.getActiveProverCount(), 3);
    }

    // =========================================================================
    // Ownership Tests
    // =========================================================================

    function test_TransferOwnership_TwoStep() public {
        address newOwner = address(0x7777);

        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferStarted(owner, newOwner);

        vrfConsumer.transferOwnership(newOwner);
        assertEq(vrfConsumer.owner(), owner); // Still old owner
        assertEq(vrfConsumer.pendingOwner(), newOwner);

        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, newOwner);

        vm.prank(newOwner);
        vrfConsumer.acceptOwnership();

        assertEq(vrfConsumer.owner(), newOwner);
        assertEq(vrfConsumer.pendingOwner(), address(0));
    }

    function test_AcceptOwnership_RevertsOnNonPendingOwner() public {
        address newOwner = address(0x7777);

        vrfConsumer.transferOwnership(newOwner);

        vm.prank(user);
        vm.expectRevert(VRFConsumerV2Production.NotPendingOwner.selector);
        vrfConsumer.acceptOwnership();
    }

    // =========================================================================
    // VRF Config Tests
    // =========================================================================

    function test_SetVRFConfig() public {
        bytes32 newKeyHash = bytes32(uint256(1));
        uint256 newSubId = 2;
        uint32 newGasLimit = 500_000;
        uint16 newConfirmations = 5;
        bool useNative = true;

        vrfConsumer.setVRFConfig(newKeyHash, newSubId, newGasLimit, newConfirmations, useNative);

        VRFConsumerV2Production.VRFConfig memory config = vrfConsumer.getVRFConfig();
        assertEq(config.keyHash, newKeyHash);
        assertEq(config.subscriptionId, newSubId);
        assertEq(config.callbackGasLimit, newGasLimit);
        assertEq(config.requestConfirmations, newConfirmations);
        assertEq(config.useNativePayment, useNative);
    }

    function test_SetVRFCoordinator() public {
        address newCoordinator = address(0x8888);

        vrfConsumer.setVRFCoordinator(newCoordinator);

        assertEq(vrfConsumer.getVRFCoordinator(), newCoordinator);
    }

    // =========================================================================
    // Integration Tests
    // =========================================================================

    function test_FullFlow_RequestToSelection() public {
        bytes32 unlockRequestId = keccak256("fullflow");

        // 1. Request prover selection
        vm.prank(l1Vault);
        uint256 requestId = vrfConsumer.requestProverSelection(unlockRequestId);

        // 2. Verify initial state
        assertEq(vrfConsumer.isProverSelected(unlockRequestId), false);
        (address prover, ) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertEq(prover, address(0));

        // 3. Fulfill VRF request
        uint256 randomValue = 98765;
        vrfCoordinator.fulfillRandomWordsSimple(requestId, randomValue);

        // 4. Verify final state
        assertEq(vrfConsumer.isProverSelected(unlockRequestId), true);
        (address selectedProver, uint256 storedRandom) = vrfConsumer.getSelectedProver(unlockRequestId);
        assertTrue(selectedProver != address(0));
        assertEq(storedRandom, randomValue);

        // 5. Verify prover is valid
        assertTrue(
            selectedProver == prover1 ||
            selectedProver == prover2 ||
            selectedProver == prover3
        );
    }

    function test_FullFlow_FallbackPath() public {
        bytes32 unlockRequestId = keccak256("fallback");

        // 1. Request prover selection
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        // 2. Wait for timeout
        vm.warp(block.timestamp + vrfConsumer.VRF_TIMEOUT() + 1);

        // 3. Trigger fallback
        address selectedProver = vrfConsumer.triggerFallback(unlockRequestId);

        // 4. Verify
        assertEq(vrfConsumer.isProverSelected(unlockRequestId), true);
        assertTrue(selectedProver != address(0));
        assertTrue(
            selectedProver == prover1 ||
            selectedProver == prover2 ||
            selectedProver == prover3
        );
    }

    // =========================================================================
    // ChainlinkVRFConfig Library Tests
    // =========================================================================

    function test_ChainlinkVRFConfig_GetConfigByChainId() public pure {
        // Ethereum Mainnet
        (address ethMainnetCoord, bytes32 ethMainnetKey) = ChainlinkVRFConfig.getConfigByChainId(1);
        assertEq(ethMainnetCoord, ChainlinkVRFConfig.ETH_MAINNET_COORDINATOR);
        assertEq(ethMainnetKey, ChainlinkVRFConfig.ETH_MAINNET_KEY_HASH_200_GWEI);

        // Ethereum Sepolia
        (address ethSepoliaCoord, bytes32 ethSepoliaKey) = ChainlinkVRFConfig.getConfigByChainId(11155111);
        assertEq(ethSepoliaCoord, ChainlinkVRFConfig.ETH_SEPOLIA_COORDINATOR);
        assertEq(ethSepoliaKey, ChainlinkVRFConfig.ETH_SEPOLIA_KEY_HASH);

        // Arbitrum Mainnet
        (address arbMainnetCoord, bytes32 arbMainnetKey) = ChainlinkVRFConfig.getConfigByChainId(42161);
        assertEq(arbMainnetCoord, ChainlinkVRFConfig.ARB_MAINNET_COORDINATOR);
        assertEq(arbMainnetKey, ChainlinkVRFConfig.ARB_MAINNET_KEY_HASH);
    }

    function test_ChainlinkVRFConfig_IsChainSupported() public pure {
        assertTrue(ChainlinkVRFConfig.isChainSupported(1)); // Ethereum Mainnet
        assertTrue(ChainlinkVRFConfig.isChainSupported(11155111)); // Ethereum Sepolia
        assertTrue(ChainlinkVRFConfig.isChainSupported(42161)); // Arbitrum Mainnet
        assertTrue(ChainlinkVRFConfig.isChainSupported(421614)); // Arbitrum Sepolia
        assertTrue(ChainlinkVRFConfig.isChainSupported(8453)); // Base Mainnet
        assertTrue(ChainlinkVRFConfig.isChainSupported(84532)); // Base Sepolia

        assertFalse(ChainlinkVRFConfig.isChainSupported(999)); // Unsupported
    }
}
