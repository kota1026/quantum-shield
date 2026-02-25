// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IVRFConsumer - Interface for VRF Consumer
/// @notice Interface for requesting and receiving VRF random values for prover selection
/// @dev Day 8-9 VRF Integration (PIR-005)
interface IVRFConsumer {
    // =========================================================================
    // Events
    // =========================================================================

    /// @notice Emitted when a VRF request is made
    /// @param requestId The Chainlink VRF request ID
    /// @param unlockRequestId The associated unlock request ID
    event VRFRequested(uint256 indexed requestId, bytes32 indexed unlockRequestId);

    /// @notice Emitted when VRF fulfillment is received
    /// @param requestId The Chainlink VRF request ID
    /// @param randomValue The random value received
    event VRFReceived(uint256 indexed requestId, uint256 randomValue);

    /// @notice Emitted when a prover is selected via VRF
    /// @param unlockRequestId The unlock request ID
    /// @param prover The selected prover address
    /// @param randomValue The VRF random value used for selection
    event ProverSelected(bytes32 indexed unlockRequestId, address indexed prover, uint256 randomValue);

    /// @notice Emitted when VRF request times out and fallback is used
    /// @param unlockRequestId The unlock request ID
    /// @param prover The fallback-selected prover address
    event FallbackProverSelected(bytes32 indexed unlockRequestId, address indexed prover);

    // =========================================================================
    // Errors
    // =========================================================================

    error VRFRequestFailed();
    error VRFNotReady();
    error VRFTimeout();
    error InvalidCallback();
    error UnauthorizedCallback();

    // =========================================================================
    // Core Functions
    // =========================================================================

    /// @notice Request VRF random value for prover selection
    /// @param unlockRequestId The unlock request ID that needs prover selection
    /// @return requestId The VRF request ID
    function requestProverSelection(bytes32 unlockRequestId) external returns (uint256 requestId);

    /// @notice Get the selected prover for an unlock request
    /// @param unlockRequestId The unlock request ID
    /// @return prover The selected prover address (address(0) if not yet selected)
    /// @return randomValue The random value used (0 if not yet received)
    function getSelectedProver(bytes32 unlockRequestId) external view returns (address prover, uint256 randomValue);

    /// @notice Check if VRF is ready for an unlock request
    /// @param unlockRequestId The unlock request ID
    /// @return ready True if prover has been selected
    function isProverSelected(bytes32 unlockRequestId) external view returns (bool ready);

    /// @notice Trigger fallback selection if VRF times out
    /// @param unlockRequestId The unlock request ID
    /// @return prover The fallback-selected prover address
    function triggerFallback(bytes32 unlockRequestId) external returns (address prover);
}
