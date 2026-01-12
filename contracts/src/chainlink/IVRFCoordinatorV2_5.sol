// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IVRFCoordinatorV2_5 - Chainlink VRF Coordinator V2.5 Interface
/// @notice Interface for Chainlink VRF Coordinator V2.5
/// @dev Based on official Chainlink VRF v2.5 interface
/// @dev TASK-P5-005-PROD: Chainlink VRF Production Integration
interface IVRFCoordinatorV2_5 {
    /// @notice Request configuration struct
    struct RequestConfig {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        bytes extraArgs;
    }

    /// @notice Request random words
    /// @param keyHash The gas lane key hash
    /// @param subId The subscription ID
    /// @param requestConfirmations Minimum confirmations before response
    /// @param callbackGasLimit Gas limit for callback
    /// @param numWords Number of random words to request
    /// @param extraArgs Extra arguments for the request
    /// @return requestId The request ID
    function requestRandomWords(
        bytes32 keyHash,
        uint256 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        bytes calldata extraArgs
    ) external returns (uint256 requestId);

    /// @notice Get subscription details
    /// @param subId The subscription ID
    /// @return balance The subscription balance
    /// @return nativeBalance The native token balance
    /// @return reqCount The request count
    /// @return owner The subscription owner
    /// @return consumers The list of consumer addresses
    function getSubscription(uint256 subId)
        external
        view
        returns (
            uint96 balance,
            uint96 nativeBalance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        );

    /// @notice Add a consumer to a subscription
    /// @param subId The subscription ID
    /// @param consumer The consumer address
    function addConsumer(uint256 subId, address consumer) external;

    /// @notice Remove a consumer from a subscription
    /// @param subId The subscription ID
    /// @param consumer The consumer address
    function removeConsumer(uint256 subId, address consumer) external;

    /// @notice Cancel a subscription
    /// @param subId The subscription ID
    /// @param to The address to send remaining funds to
    function cancelSubscription(uint256 subId, address to) external;

    /// @notice Check if pending request exists
    /// @param subId The subscription ID
    /// @param consumer The consumer address
    /// @return pending True if pending request exists
    function pendingRequestExists(uint256 subId, address consumer) external view returns (bool pending);

    /// @notice Get the current block number
    /// @return blockNumber The current block number
    function getRequestConfig()
        external
        view
        returns (
            uint16 minimumRequestConfirmations,
            uint32 maxGasLimit,
            uint32 stalenessSeconds,
            uint32 gasAfterPaymentCalculation,
            int256 fallbackWeiPerUnitLink,
            bytes32 feeConfig
        );
}
