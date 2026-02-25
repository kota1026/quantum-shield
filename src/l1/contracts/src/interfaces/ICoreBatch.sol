// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICoreVerifier} from "./ICoreVerifier.sol";

/// @title ICoreBatch - Batch SPHINCS+ Verification Interface
/// @notice L3 Decision (2025-12-28) Compliant - No ZK-STARK
/// @dev Gas-optimized batch verification for multiple signature sets
///
/// Use Cases:
/// - Batch unlock processing
/// - Multiple challenge verification
/// - Gas-efficient bulk operations
interface ICoreBatch {
    // =========================================================================
    // Errors
    // =========================================================================

    /// @notice Thrown when batch size exceeds maximum
    error BatchTooLarge(uint256 provided, uint256 maximum);

    /// @notice Thrown when array lengths mismatch
    error ArrayLengthMismatch();

    /// @notice Thrown when batch is empty
    error EmptyBatch();

    // =========================================================================
    // Events
    // =========================================================================

    /// @notice Emitted when batch verification completes
    event BatchVerified(
        uint256 indexed batchSize,
        uint256 validCount,
        uint256 totalGasUsed
    );

    // =========================================================================
    // Structs
    // =========================================================================

    /// @notice Batch verification result
    struct BatchResult {
        uint256 totalCount;
        uint256 validCount;
        uint256 totalGasUsed;
        bool[] results;  // Individual results
    }

    /// @notice Individual verification item in batch
    struct BatchItem {
        bytes32 message;
        bytes signature;
        bytes publicKey;
    }

    // =========================================================================
    // Batch Verification
    // =========================================================================

    /// @notice Verify multiple signatures in a single call
    /// @param items Array of BatchItem (message, signature, publicKey)
    /// @return result BatchResult with individual and aggregate results
    function verifyBatch(
        BatchItem[] calldata items
    ) external returns (BatchResult memory result);

    /// @notice Verify batch with threshold requirement
    /// @param items Array of BatchItem
    /// @param threshold Minimum number of valid signatures required
    /// @return passed True if threshold is met
    /// @return validCount Number of valid signatures
    function verifyBatchWithThreshold(
        BatchItem[] calldata items,
        uint256 threshold
    ) external returns (bool passed, uint256 validCount);

    /// @notice Verify batch and return only count (gas optimized)
    /// @param items Array of BatchItem
    /// @return validCount Number of valid signatures
    function verifyBatchCount(
        BatchItem[] calldata items
    ) external view returns (uint256 validCount);

    // =========================================================================
    // Configuration
    // =========================================================================

    /// @notice Get maximum batch size
    /// @return Maximum number of items per batch
    function MAX_BATCH_SIZE() external pure returns (uint256);

    /// @notice Get the CoreVerifier address
    /// @return Address of the underlying CoreVerifier
    function getCoreVerifier() external view returns (address);
}
