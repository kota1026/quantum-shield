// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVRFCoordinatorV2_5} from "./IVRFCoordinatorV2_5.sol";

/// @title VRFCoordinatorV2_5Mock - Mock VRF Coordinator for Testing
/// @notice Mock implementation of Chainlink VRF Coordinator v2.5
/// @dev TASK-P5-005-PROD: Chainlink VRF Production Integration
///      Used for local testing without actual Chainlink infrastructure
contract VRFCoordinatorV2_5Mock is IVRFCoordinatorV2_5 {
    // =========================================================================
    // Structs
    // =========================================================================

    struct Request {
        uint256 subId;
        uint32 callbackGasLimit;
        uint32 numWords;
        address consumer;
        bool fulfilled;
    }

    struct Subscription {
        uint96 balance;
        uint96 nativeBalance;
        uint64 reqCount;
        address owner;
        address[] consumers;
    }

    // =========================================================================
    // State Variables
    // =========================================================================

    uint256 private _requestIdCounter;
    uint256 private _subscriptionIdCounter;

    mapping(uint256 => Request) public requests;
    mapping(uint256 => Subscription) public subscriptions;

    // =========================================================================
    // Events
    // =========================================================================

    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint256 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );

    event RandomWordsFulfilled(
        uint256 indexed requestId,
        uint256[] randomWords,
        bool success
    );

    event SubscriptionCreated(uint256 indexed subId, address owner);
    event SubscriptionFunded(uint256 indexed subId, uint256 oldBalance, uint256 newBalance);
    event ConsumerAdded(uint256 indexed subId, address consumer);
    event ConsumerRemoved(uint256 indexed subId, address consumer);

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor() {
        _requestIdCounter = 1;
        _subscriptionIdCounter = 1;
    }

    // =========================================================================
    // IVRFCoordinatorV2_5 Implementation
    // =========================================================================

    /// @inheritdoc IVRFCoordinatorV2_5
    function requestRandomWords(
        bytes32 keyHash,
        uint256 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        bytes calldata /* extraArgs */
    ) external override returns (uint256 requestId) {
        require(subscriptions[subId].owner != address(0), "Subscription not found");

        // Check if consumer is registered
        bool isConsumer = false;
        for (uint256 i = 0; i < subscriptions[subId].consumers.length; i++) {
            if (subscriptions[subId].consumers[i] == msg.sender) {
                isConsumer = true;
                break;
            }
        }
        require(isConsumer, "Consumer not registered");

        requestId = _requestIdCounter++;

        requests[requestId] = Request({
            subId: subId,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            consumer: msg.sender,
            fulfilled: false
        });

        subscriptions[subId].reqCount++;

        emit RandomWordsRequested(
            keyHash,
            requestId,
            0, // preSeed
            subId,
            requestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );
    }

    /// @inheritdoc IVRFCoordinatorV2_5
    function getSubscription(uint256 subId)
        external
        view
        override
        returns (
            uint96 balance,
            uint96 nativeBalance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        )
    {
        Subscription storage sub = subscriptions[subId];
        return (
            sub.balance,
            sub.nativeBalance,
            sub.reqCount,
            sub.owner,
            sub.consumers
        );
    }

    /// @inheritdoc IVRFCoordinatorV2_5
    function addConsumer(uint256 subId, address consumer) external override {
        require(subscriptions[subId].owner == msg.sender, "Not subscription owner");
        subscriptions[subId].consumers.push(consumer);
        emit ConsumerAdded(subId, consumer);
    }

    /// @inheritdoc IVRFCoordinatorV2_5
    function removeConsumer(uint256 subId, address consumer) external override {
        require(subscriptions[subId].owner == msg.sender, "Not subscription owner");

        address[] storage consumers = subscriptions[subId].consumers;
        for (uint256 i = 0; i < consumers.length; i++) {
            if (consumers[i] == consumer) {
                consumers[i] = consumers[consumers.length - 1];
                consumers.pop();
                emit ConsumerRemoved(subId, consumer);
                return;
            }
        }
        revert("Consumer not found");
    }

    /// @inheritdoc IVRFCoordinatorV2_5
    function cancelSubscription(uint256 subId, address to) external override {
        require(subscriptions[subId].owner == msg.sender, "Not subscription owner");

        // Transfer any remaining balance
        uint96 balance = subscriptions[subId].balance;
        if (balance > 0) {
            // In mock, we don't actually transfer LINK
        }

        delete subscriptions[subId];
    }

    /// @inheritdoc IVRFCoordinatorV2_5
    function pendingRequestExists(uint256 /* subId */, address /* consumer */)
        external
        pure
        override
        returns (bool pending)
    {
        return false; // Mock always returns false
    }

    /// @inheritdoc IVRFCoordinatorV2_5
    function getRequestConfig()
        external
        pure
        override
        returns (
            uint16 minimumRequestConfirmations,
            uint32 maxGasLimit,
            uint32 stalenessSeconds,
            uint32 gasAfterPaymentCalculation,
            int256 fallbackWeiPerUnitLink,
            bytes32 feeConfig
        )
    {
        return (3, 2_500_000, 86400, 33285, 0, bytes32(0));
    }

    // =========================================================================
    // Mock-specific Functions
    // =========================================================================

    /// @notice Create a new subscription
    /// @return subId The new subscription ID
    function createSubscription() external returns (uint256 subId) {
        subId = _subscriptionIdCounter++;

        subscriptions[subId] = Subscription({
            balance: 0,
            nativeBalance: 0,
            reqCount: 0,
            owner: msg.sender,
            consumers: new address[](0)
        });

        emit SubscriptionCreated(subId, msg.sender);
    }

    /// @notice Fund a subscription (mock - just updates balance)
    /// @param subId The subscription ID
    /// @param amount The amount to add
    function fundSubscription(uint256 subId, uint96 amount) external {
        require(subscriptions[subId].owner != address(0), "Subscription not found");

        uint96 oldBalance = subscriptions[subId].balance;
        subscriptions[subId].balance = oldBalance + amount;

        emit SubscriptionFunded(subId, oldBalance, subscriptions[subId].balance);
    }

    /// @notice Fulfill a random words request (mock)
    /// @param requestId The request ID
    /// @param randomWords The random words to fulfill with
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        Request storage req = requests[requestId];
        require(req.consumer != address(0), "Request not found");
        require(!req.fulfilled, "Already fulfilled");

        req.fulfilled = true;

        // Call the consumer's rawFulfillRandomWords
        (bool success, ) = req.consumer.call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );

        emit RandomWordsFulfilled(requestId, randomWords, success);
    }

    /// @notice Fulfill with a simple random value
    /// @param requestId The request ID
    /// @param randomValue Single random value (will be wrapped in array)
    function fulfillRandomWordsSimple(uint256 requestId, uint256 randomValue) external {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = randomValue;
        this.fulfillRandomWords(requestId, randomWords);
    }

    /// @notice Get request details
    /// @param requestId The request ID
    /// @return request The request details
    function getRequest(uint256 requestId) external view returns (Request memory) {
        return requests[requestId];
    }

    /// @notice Get current request ID counter
    /// @return counter The current counter
    function getCurrentRequestId() external view returns (uint256) {
        return _requestIdCounter;
    }
}
