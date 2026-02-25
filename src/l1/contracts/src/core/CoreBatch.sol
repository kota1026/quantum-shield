// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICoreBatch} from "../interfaces/ICoreBatch.sol";
import {ICoreVerifier} from "../interfaces/ICoreVerifier.sol";
import {CoreVerifier} from "./CoreVerifier.sol";

/// @title CoreBatch - Batch SPHINCS+ Verification Implementation
/// @notice L3 Decision (2025-12-28) Compliant - No ZK-STARK
/// @dev Gas-optimized batch verification for multiple signature sets
///
/// Use Cases:
/// - Batch unlock processing
/// - Multiple challenge verification
/// - Gas-efficient bulk operations
contract CoreBatch is ICoreBatch {
    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Maximum batch size to prevent gas exhaustion
    uint256 public constant MAX_BATCH = 10;

    // =========================================================================
    // State
    // =========================================================================

    /// @notice The underlying CoreVerifier contract
    CoreVerifier public immutable coreVerifier;

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @notice Initialize CoreBatch with CoreVerifier address
    /// @param _coreVerifier Address of deployed CoreVerifier
    constructor(address _coreVerifier) {
        require(_coreVerifier != address(0), "Zero address");
        coreVerifier = CoreVerifier(_coreVerifier);
    }

    // =========================================================================
    // Batch Verification
    // =========================================================================

    /// @inheritdoc ICoreBatch
    function verifyBatch(
        BatchItem[] calldata items
    ) external returns (BatchResult memory result) {
        uint256 startGas = gasleft();

        // Validate batch
        if (items.length == 0) {
            revert EmptyBatch();
        }
        if (items.length > MAX_BATCH) {
            revert BatchTooLarge(items.length, MAX_BATCH);
        }

        result.totalCount = items.length;
        result.results = new bool[](items.length);

        for (uint256 i = 0; i < items.length; i++) {
            try coreVerifier.verifySPHINCS(
                items[i].message,
                items[i].signature,
                items[i].publicKey
            ) returns (bool valid) {
                result.results[i] = valid;
                if (valid) {
                    result.validCount++;
                }
            } catch {
                result.results[i] = false;
            }
        }

        result.totalGasUsed = startGas - gasleft();

        emit BatchVerified(result.totalCount, result.validCount, result.totalGasUsed);
    }

    /// @inheritdoc ICoreBatch
    function verifyBatchWithThreshold(
        BatchItem[] calldata items,
        uint256 threshold
    ) external returns (bool passed, uint256 validCount) {
        uint256 startGas = gasleft();

        // Validate batch
        if (items.length == 0) {
            revert EmptyBatch();
        }
        if (items.length > MAX_BATCH) {
            revert BatchTooLarge(items.length, MAX_BATCH);
        }

        for (uint256 i = 0; i < items.length; i++) {
            try coreVerifier.verifySPHINCS(
                items[i].message,
                items[i].signature,
                items[i].publicKey
            ) returns (bool valid) {
                if (valid) {
                    validCount++;
                    // Early exit if threshold met
                    if (validCount >= threshold) {
                        passed = true;
                        uint256 gasUsed = startGas - gasleft();
                        emit BatchVerified(items.length, validCount, gasUsed);
                        return (passed, validCount);
                    }
                }
            } catch {
                // Continue to next item
            }
        }

        uint256 gasUsed = startGas - gasleft();
        passed = validCount >= threshold;
        emit BatchVerified(items.length, validCount, gasUsed);
    }

    /// @inheritdoc ICoreBatch
    function verifyBatchCount(
        BatchItem[] calldata items
    ) external view returns (uint256 validCount) {
        // Validate batch
        if (items.length == 0) {
            revert EmptyBatch();
        }
        if (items.length > MAX_BATCH) {
            revert BatchTooLarge(items.length, MAX_BATCH);
        }

        for (uint256 i = 0; i < items.length; i++) {
            try coreVerifier.verifySPHINCS(
                items[i].message,
                items[i].signature,
                items[i].publicKey
            ) returns (bool valid) {
                if (valid) {
                    validCount++;
                }
            } catch {
                // Continue to next item
            }
        }
    }

    // =========================================================================
    // Configuration
    // =========================================================================

    /// @inheritdoc ICoreBatch
    function MAX_BATCH_SIZE() external pure returns (uint256) {
        return MAX_BATCH;
    }

    /// @inheritdoc ICoreBatch
    function getCoreVerifier() external view returns (address) {
        return address(coreVerifier);
    }
}
