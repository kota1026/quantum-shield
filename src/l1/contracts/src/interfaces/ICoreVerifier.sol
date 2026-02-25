// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ICoreVerifier - Core Layer SPHINCS+ Verification Interface
/// @notice L3 Decision (2025-12-28) Compliant - No ZK-STARK
/// @dev Standardized interface for SPHINCS+ signature verification in Core Layer
///
/// This interface wraps SPHINCSVerifier for use in the Modular Architecture.
/// Sequence Coverage:
/// - SEQ#1 Lock: User Dilithium signature verification
/// - SEQ#2 Unlock: Prover SPHINCS+ 2/5 signature verification
/// - SEQ#4 Challenge: Signature verification for slashing
interface ICoreVerifier {
    // =========================================================================
    // Errors
    // =========================================================================

    /// @notice Thrown when signature length is invalid
    error InvalidSignatureLength(uint256 provided, uint256 expected);

    /// @notice Thrown when public key length is invalid
    error InvalidPublicKeyLength(uint256 provided, uint256 expected);

    /// @notice Thrown when verification fails
    error VerificationFailed();

    /// @notice Thrown when threshold is not met for multi-signature
    error ThresholdNotMet(uint256 validCount, uint256 required);

    /// @notice Thrown when array lengths mismatch
    error ArrayLengthMismatch();

    // =========================================================================
    // Events
    // =========================================================================

    /// @notice Emitted when a signature is verified
    event SignatureVerified(
        bytes32 indexed messageHash,
        bytes32 indexed pubKeyHash,
        bool valid
    );

    /// @notice Emitted when multi-signature verification completes
    event MultiSignatureVerified(
        bytes32 indexed messageHash,
        uint256 validCount,
        uint256 threshold
    );

    // =========================================================================
    // Structs
    // =========================================================================

    /// @notice Signature data for batch/multi verification
    struct SignatureData {
        bytes32 message;
        bytes signature;
        bytes publicKey;
    }

    /// @notice Verification result with details
    struct VerificationResult {
        bool valid;
        bytes32 pubKeyHash;
        uint256 gasUsed;
        string errorReason;
    }

    // =========================================================================
    // Single Signature Verification
    // =========================================================================

    /// @notice Verify a single SPHINCS+ signature
    /// @param message The message hash (32 bytes)
    /// @param signature The SPHINCS+ signature (~7856 bytes)
    /// @param publicKey The SPHINCS+ public key (32 bytes)
    /// @return valid True if signature is valid
    function verifySPHINCS(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool valid);

    /// @notice Verify with detailed result
    /// @param message The message hash
    /// @param signature The SPHINCS+ signature
    /// @param publicKey The SPHINCS+ public key
    /// @return result Detailed verification result
    function verifySPHINCSWithDetails(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (VerificationResult memory result);

    // =========================================================================
    // Multi-Signature Verification (2/5 Threshold)
    // =========================================================================

    /// @notice Verify multiple SPHINCS+ signatures with threshold
    /// @dev Used for SEQ#2 Unlock: requires 2/5 Prover signatures
    /// @param message The message hash (same for all signatures)
    /// @param signatures Array of SPHINCS+ signatures
    /// @param publicKeys Array of SPHINCS+ public keys
    /// @param threshold Minimum number of valid signatures required
    /// @return valid True if threshold is met
    /// @return validCount Number of valid signatures
    function verifyMultiSPHINCS(
        bytes32 message,
        bytes[] calldata signatures,
        bytes[] calldata publicKeys,
        uint256 threshold
    ) external view returns (bool valid, uint256 validCount);

    /// @notice Convenience function for 2/5 verification
    /// @dev Equivalent to verifyMultiSPHINCS with threshold=2
    /// @param message The message hash
    /// @param signatures Array of SPHINCS+ signatures (expects 5 max)
    /// @param publicKeys Array of SPHINCS+ public keys
    /// @return valid True if at least 2 signatures are valid
    function verifyTwoOfFive(
        bytes32 message,
        bytes[] calldata signatures,
        bytes[] calldata publicKeys
    ) external view returns (bool valid);

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /// @notice Get the security level (128-bit for SPHINCS+-128s)
    /// @return Security level in bits
    function securityLevel() external pure returns (uint256);

    /// @notice Get expected signature size
    /// @return Signature size in bytes (~7856 for SPHINCS+-SHAKE-128s)
    function getSignatureSize() external pure returns (uint256);

    /// @notice Get expected public key size
    /// @return Public key size in bytes (32)
    function getPublicKeySize() external pure returns (uint256);

    /// @notice Compute SHA3-256 hash of public key
    /// @dev CP-1 compliant: uses SHA3-256, NOT keccak256
    /// @param publicKey The SPHINCS+ public key
    /// @return Hash of the public key
    function computePublicKeyHash(bytes calldata publicKey) 
        external 
        pure 
        returns (bytes32);

    /// @notice Check if public key format is valid
    /// @param publicKey The public key to check
    /// @return True if format is valid
    function isValidPublicKeyFormat(bytes calldata publicKey) 
        external 
        pure 
        returns (bool);

    /// @notice Get the underlying SPHINCSVerifier address
    /// @return Address of SPHINCSVerifier contract
    function getSPHINCSVerifier() external view returns (address);
}
