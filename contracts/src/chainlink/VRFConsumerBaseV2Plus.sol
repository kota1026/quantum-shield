// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVRFCoordinatorV2_5} from "./IVRFCoordinatorV2_5.sol";

/// @title VRFConsumerBaseV2Plus - Base contract for VRF v2.5 consumers
/// @notice Abstract base contract for Chainlink VRF v2.5 consumers
/// @dev TASK-P5-005-PROD: Chainlink VRF Production Integration
///      Based on official Chainlink VRFConsumerBaseV2Plus
abstract contract VRFConsumerBaseV2Plus {
    // =========================================================================
    // Errors
    // =========================================================================

    error OnlyCoordinatorCanFulfill(address have, address want);
    error OnlyOwner();
    error ZeroCoordinatorAddress();

    // =========================================================================
    // State Variables
    // =========================================================================

    /// @notice VRF Coordinator contract
    IVRFCoordinatorV2_5 public s_vrfCoordinator;

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @notice Initialize the VRF consumer base
    /// @param _vrfCoordinator The VRF Coordinator address
    constructor(address _vrfCoordinator) {
        if (_vrfCoordinator == address(0)) revert ZeroCoordinatorAddress();
        s_vrfCoordinator = IVRFCoordinatorV2_5(_vrfCoordinator);
    }

    // =========================================================================
    // Abstract Functions
    // =========================================================================

    /// @notice Callback function for VRF fulfillment
    /// @dev Must be implemented by inheriting contracts
    /// @param requestId The request ID
    /// @param randomWords The array of random words
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal virtual;

    // =========================================================================
    // External Functions
    // =========================================================================

    /// @notice Raw fulfill function called by VRF Coordinator
    /// @dev Validates caller is the coordinator before calling fulfillRandomWords
    /// @param requestId The request ID
    /// @param randomWords The array of random words
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != address(s_vrfCoordinator)) {
            revert OnlyCoordinatorCanFulfill(msg.sender, address(s_vrfCoordinator));
        }
        fulfillRandomWords(requestId, randomWords);
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /// @notice Set the VRF Coordinator address
    /// @dev Can be overridden to add access control
    /// @param _vrfCoordinator The new VRF Coordinator address
    function _setVRFCoordinator(address _vrfCoordinator) internal {
        if (_vrfCoordinator == address(0)) revert ZeroCoordinatorAddress();
        s_vrfCoordinator = IVRFCoordinatorV2_5(_vrfCoordinator);
    }

    /// @notice Request random words from VRF Coordinator
    /// @param keyHash The gas lane key hash
    /// @param subId The subscription ID
    /// @param requestConfirmations Minimum confirmations before response
    /// @param callbackGasLimit Gas limit for callback
    /// @param numWords Number of random words to request
    /// @return requestId The request ID
    function _requestRandomWords(
        bytes32 keyHash,
        uint256 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) internal returns (uint256 requestId) {
        // Empty extraArgs for basic requests
        bytes memory extraArgs = "";

        requestId = s_vrfCoordinator.requestRandomWords(
            keyHash,
            subId,
            requestConfirmations,
            callbackGasLimit,
            numWords,
            extraArgs
        );
    }

    /// @notice Request random words with native payment
    /// @param keyHash The gas lane key hash
    /// @param subId The subscription ID
    /// @param requestConfirmations Minimum confirmations before response
    /// @param callbackGasLimit Gas limit for callback
    /// @param numWords Number of random words to request
    /// @param nativePayment Whether to pay with native token
    /// @return requestId The request ID
    function _requestRandomWordsWithNativePayment(
        bytes32 keyHash,
        uint256 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        bool nativePayment
    ) internal returns (uint256 requestId) {
        // Encode native payment flag in extraArgs
        // Format: 0x01 for native, 0x00 for LINK
        bytes memory extraArgs = nativePayment ? abi.encodePacked(uint8(1)) : bytes("");

        requestId = s_vrfCoordinator.requestRandomWords(
            keyHash,
            subId,
            requestConfirmations,
            callbackGasLimit,
            numWords,
            extraArgs
        );
    }
}
