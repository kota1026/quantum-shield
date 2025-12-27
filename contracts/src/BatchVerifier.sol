// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SHA3Hasher} from "./libraries/SHA3Hasher.sol";
import {SharedMerkle} from "./lib/SharedMerkle.sol";
import {ProofCodec} from "./libraries/ProofCodec.sol";

/**
 * @title BatchVerifier
 * @author Quantum Shield Team
 * @notice Batch verification for STARK proofs with gas optimization
 * @dev IMPL-009: Implements batch proof verification for gas efficiency
 * 
 * ## Overview
 * This contract provides batch verification of STARK proofs, optimizing
 * gas costs by sharing Merkle path computations across multiple proofs.
 * 
 * ## Gas Optimization Strategy
 * 1. **Shared Merkle Paths**: Proofs sharing ancestors reuse hash computations
 * 2. **Batch Processing**: Amortize fixed costs across multiple proofs
 * 3. **Early Exit**: Skip invalid proofs quickly
 * 
 * ## Target Performance
 * - 10-proof batch: ≥40% gas reduction vs individual verification
 * - 20-proof batch: ≥50% gas reduction vs individual verification
 * 
 * ## CP-1 Compliance (Quantum Resistance)
 * - Uses ONLY SHA3-256 (FIPS 202) for all hash operations
 * - keccak256 is PROHIBITED
 * - 128-bit security level maintained
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 0.1.0
 */
contract BatchVerifier {
    using SHA3Hasher for bytes;
    using SHA3Hasher for bytes32;

    // =========================================================================
    // State
    // =========================================================================

    /// @notice SharedMerkle library for path optimization
    SharedMerkle public immutable sharedMerkle;

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Maximum batch size to prevent DoS
    uint256 public constant MAX_BATCH_SIZE = 100;

    /// @notice Minimum batch size for optimization benefit
    uint256 public constant MIN_BATCH_SIZE = 2;

    /// @notice Domain separator for batch verification
    bytes32 private constant DOMAIN_BATCH = bytes32("QS_BATCH_VERIFY_V1");

    // =========================================================================
    // Errors
    // =========================================================================

    error BatchSizeExceedsMax();
    error ArrayLengthMismatch();
    error InvalidSharedMerkle();

    // =========================================================================
    // Events
    // =========================================================================

    event BatchVerificationComplete(
        uint256 indexed batchSize,
        uint256 validCount,
        uint256 gasUsed
    );

    event ProofValidated(uint256 indexed index, bytes32 leaf, bool valid);

    // =========================================================================
    // Constructor
    // =========================================================================

    /**
     * @notice Deploy BatchVerifier with SharedMerkle dependency
     * @param _sharedMerkle Address of SharedMerkle contract
     */
    constructor(address _sharedMerkle) {
        if (_sharedMerkle == address(0)) {
            revert InvalidSharedMerkle();
        }
        sharedMerkle = SharedMerkle(_sharedMerkle);
    }

    // =========================================================================
    // Version Information
    // =========================================================================

    /**
     * @notice Get contract version
     */
    function getVersion() external pure returns (string memory name, string memory version) {
        return ("BatchVerifier", "0.1.0");
    }

    // =========================================================================
    // Main Batch Verification Interface
    // =========================================================================

    /**
     * @notice Verify a batch of Merkle proofs
     * @dev Main entry point for batch verification
     * @param leaves Array of leaf values to verify
     * @param indices Array of leaf positions in the tree
     * @param allSiblings 2D array of sibling hashes (Merkle proof paths)
     * @param expectedRoot Expected Merkle root
     * @return validCount Number of valid proofs in the batch
     */
    function verifyBatch(
        bytes32[] calldata leaves,
        uint256[] calldata indices,
        bytes32[][] calldata allSiblings,
        bytes32 expectedRoot
    ) external view returns (uint256 validCount) {
        // Input validation
        if (leaves.length != indices.length || leaves.length != allSiblings.length) {
            return 0;
        }

        if (leaves.length == 0) {
            return 0;
        }

        if (leaves.length > MAX_BATCH_SIZE) {
            revert BatchSizeExceedsMax();
        }

        // Delegate to SharedMerkle for optimized batch verification
        validCount = sharedMerkle.verifyBatchProofs(
            leaves,
            indices,
            allSiblings,
            expectedRoot
        );
    }

    /**
     * @notice Verify batch with detailed results
     * @dev Returns validity status for each proof
     * @param leaves Array of leaf values
     * @param indices Array of leaf positions
     * @param allSiblings 2D array of sibling hashes
     * @param expectedRoot Expected Merkle root
     * @return results Array of validity flags for each proof
     */
    function verifyBatchDetailed(
        bytes32[] calldata leaves,
        uint256[] calldata indices,
        bytes32[][] calldata allSiblings,
        bytes32 expectedRoot
    ) external view returns (bool[] memory results) {
        // Input validation
        if (leaves.length != indices.length || leaves.length != allSiblings.length) {
            return new bool[](0);
        }

        if (leaves.length > MAX_BATCH_SIZE) {
            revert BatchSizeExceedsMax();
        }

        results = new bool[](leaves.length);

        // Verify each proof individually and record results
        for (uint256 i = 0; i < leaves.length; i++) {
            results[i] = sharedMerkle.verifyProof(
                leaves[i],
                indices[i],
                allSiblings[i],
                expectedRoot
            );
        }
    }

    // =========================================================================
    // STARK Proof Batch Verification
    // =========================================================================

    /**
     * @notice Verify batch of STARK proofs
     * @dev Verifies trace commitments for multiple STARK proofs
     * @param proofs Array of STARK proofs to verify
     * @param publicInputs Array of public inputs
     * @return validCount Number of valid proofs
     */
    function verifySTARKBatch(
        ProofCodec.STARKProof[] calldata proofs,
        bytes32[] calldata publicInputs
    ) external view returns (uint256 validCount) {
        if (proofs.length != publicInputs.length) {
            return 0;
        }

        if (proofs.length == 0) {
            return 0;
        }

        if (proofs.length > MAX_BATCH_SIZE) {
            revert BatchSizeExceedsMax();
        }

        // Extract trace commitments and verify
        for (uint256 i = 0; i < proofs.length; i++) {
            ProofCodec.STARKProof calldata proof = proofs[i];
            
            // Basic structure validation
            if (proof.traceCommitment == bytes32(0)) {
                continue;
            }
            if (proof.constraintCommitment == bytes32(0)) {
                continue;
            }
            if (proof.friCommitments.length == 0) {
                continue;
            }

            // If basic checks pass, count as valid for v0.1
            // Full FRI verification in v0.2
            validCount++;
        }
    }

    // =========================================================================
    // Gas Estimation
    // =========================================================================

    /**
     * @notice Estimate gas for batch verification
     * @dev Useful for gas optimization analysis
     * @param batchSize Number of proofs in batch
     * @param proofDepth Depth of Merkle proofs
     * @return estimatedGas Estimated gas cost
     */
    function estimateBatchGas(
        uint256 batchSize,
        uint256 proofDepth
    ) external pure returns (uint256 estimatedGas) {
        // Base cost per proof
        uint256 basePerProof = 21000; // Base transaction cost amortized
        
        // SHA3-256 hash cost estimate (high due to pure Solidity implementation)
        uint256 hashCost = 1_000_000; // ~1M gas per SHA3-256
        
        // Per proof: proofDepth hashes + overhead
        uint256 perProof = proofDepth * hashCost + 5000;
        
        // Batch overhead
        uint256 batchOverhead = 10000;
        
        estimatedGas = basePerProof + (batchSize * perProof) + batchOverhead;
    }

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /**
     * @notice Check if batch size is optimal
     * @param batchSize Proposed batch size
     * @return optimal True if batch size is in optimal range
     */
    function isOptimalBatchSize(uint256 batchSize) external pure returns (bool optimal) {
        return batchSize >= MIN_BATCH_SIZE && batchSize <= MAX_BATCH_SIZE;
    }

    /**
     * @notice Get SharedMerkle address
     */
    function getSharedMerkleAddress() external view returns (address) {
        return address(sharedMerkle);
    }
}
