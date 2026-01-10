// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockSPHINCSVerifier - Simple mock for testing
/// @notice Always returns true for signature verification
/// @dev Used in integration tests where actual SPHINCS+ verification is not required
contract MockSPHINCSVerifier {
    /// @notice Mock verify function that always returns true
    /// @param message The message hash (ignored in mock)
    /// @param signature The signature bytes (ignored in mock)
    /// @param publicKey The public key bytes (ignored in mock)
    /// @return success Always returns true
    function verify(bytes32 message, bytes calldata signature, bytes calldata publicKey) external pure returns (bool success) {
        // Silence unused variable warnings
        message;
        signature;
        publicKey;
        return true;
    }
}
