// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IStateVerifier
/// @notice Proof-based state verification interface (Phase 2 trustless enforcement)
/// @dev ONCHAIN_TRUST_MECHANISM_REQUIREMENTS.md FR-L3-1..3: CoreLayer must not
///      accept any state claim without a proof accepted by a real verifier.
///      Implementations wrap the STARK verification stack; CoreLayer depends
///      only on this interface so the L3 project stays self-contained.
/// @custom:security-contact security@quantumshield.io
interface IStateVerifier {
    /// @notice Verify a proof that `txHash` is included in the state committed to by `stateRoot`
    /// @param stateRoot State root the inclusion is claimed against
    /// @param txHash Transaction hash whose inclusion is being proven
    /// @param proof Serialized STARK proof bytes
    /// @return valid True only if the proof is accepted by the verifier
    function verifyInclusion(
        bytes32 stateRoot,
        bytes32 txHash,
        bytes calldata proof
    ) external view returns (bool valid);

    /// @notice Verify a proof of a valid state transition from `oldStateRoot` to `newStateRoot`
    /// @param oldStateRoot State root before the transition
    /// @param newStateRoot State root after the transition
    /// @param proof Serialized STARK proof bytes
    /// @return valid True only if the proof is accepted by the verifier
    function verifyTransition(
        bytes32 oldStateRoot,
        bytes32 newStateRoot,
        bytes calldata proof
    ) external view returns (bool valid);
}
