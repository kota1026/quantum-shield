// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISPHINCSVerifier - Interface for SPHINCS+ Verification
/// @notice Standardized interface for SPHINCS+ signature verification
interface ISPHINCSVerifier {
    /// @notice Verification result with detailed status
    struct VerificationResult {
        bool valid;
        bytes32 computedRoot;
        uint256 gasUsed;
        string errorReason;
    }

    /// @notice Verify a single SPHINCS+ signature
    /// @param message The message that was signed (32 bytes hash)
    /// @param signature The SPHINCS+ signature
    /// @param publicKey The SPHINCS+ public key (32 bytes)
    /// @return valid True if signature is valid
    function verify(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool valid);

    /// @notice Verify multiple SPHINCS+ signatures in batch
    /// @param messages Array of message hashes
    /// @param signatures Array of signatures
    /// @param publicKeys Array of public keys
    /// @return validCount Number of valid signatures
    function verifyBatch(
        bytes32[] calldata messages,
        bytes[] calldata signatures,
        bytes[] calldata publicKeys
    ) external view returns (uint256 validCount);

    /// @notice Verify signature and return detailed result
    function verifyWithDetails(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (VerificationResult memory result);

    /// @notice Compute hash of public key for storage/comparison
    function computePublicKeyHash(bytes calldata publicKey) 
        external 
        pure 
        returns (bytes32);

    /// @notice Check if this is a valid SPHINCS+ public key format
    function isValidPublicKeyFormat(bytes calldata publicKey) 
        external 
        pure 
        returns (bool);

    /// @notice Get expected signature size
    function getSignatureSize() external pure returns (uint256);
}
