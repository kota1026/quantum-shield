// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IQuantumVerifier.sol";

/// @title AlwaysTrueVerifier - Emergency Rescue Verifier
/// @notice ONLY FOR TESTNET RESCUE - Always returns true for any proof
/// @dev This is a security bypass for recovering locked funds on testnet
///      NEVER deploy this on mainnet!
contract AlwaysTrueVerifier is IQuantumVerifier {
    /// @notice Always returns true - INSECURE, for testnet rescue only
    function verifyProof(
        bytes calldata /* proof */,
        uint256[] calldata /* publicInputs */
    ) external pure override returns (bool) {
        return true;
    }

    /// @notice Returns a dummy verification key hash
    function getVerificationKeyHash() external pure override returns (bytes32) {
        return keccak256("RESCUE_MODE_TESTNET_ONLY");
    }

    /// @notice Returns the verifier type
    function getVerifierType() external pure override returns (string memory) {
        return "rescue-always-true";
    }

    /// @notice Returns false - this is NOT quantum resistant
    function isQuantumResistant() external pure override returns (bool) {
        return false;
    }
}
