// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IQuantumVerifier - Upgradable ZK Verifier Interface
/// @notice Abstract interface for ZK proof verification
/// @dev Allows switching between Groth16 (current) and future STARK verifiers
///      without modifying the bridge contract
interface IQuantumVerifier {
    /// @notice Verify a ZK proof of aggregated Dilithium signature verification
    /// @param proof The encoded proof data (format depends on implementation)
    /// @param publicInputs The public inputs to the circuit
    /// @return valid True if the proof is valid
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool valid);

    /// @notice Get the verification key hash for this verifier
    /// @return vkHash Hash of the verification key
    function getVerificationKeyHash() external view returns (bytes32 vkHash);

    /// @notice Get the verifier type identifier
    /// @return verifierType "groth16", "plonk", or "stark"
    function getVerifierType() external pure returns (string memory verifierType);

    /// @notice Check if verifier supports quantum-resistant proofs
    /// @return isQuantumResistant True for STARK-based verifiers
    function isQuantumResistant() external pure returns (bool);
}

/// @title IQuantumVerifierV2 - Extended interface for batch verification
/// @notice Adds batch verification support for future optimizations
interface IQuantumVerifierV2 is IQuantumVerifier {
    /// @notice Verify multiple proofs in a single call (gas optimization)
    /// @param proofs Array of encoded proofs
    /// @param publicInputsArray Array of public inputs for each proof
    /// @return results Array of verification results
    function verifyProofBatch(
        bytes[] calldata proofs,
        uint256[][] calldata publicInputsArray
    ) external view returns (bool[] memory results);
}
