// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISP1Verifier - the SP1 on-chain verifier interface
/// @notice Succinct's deployed verifier gateway exposes exactly this call.
///         Declaring it here rather than importing keeps the L1 contracts free
///         of an external dependency, and lets tests substitute a mock.
/// @dev The wrap strategy is `docs/core/STARK_AIR_GAP_ANALYSIS.md` §19: the
///      SPHINCS+ threshold check runs inside a zkVM, and SP1's own Groth16
///      wrapper produces the proof this verifier checks. §13 measured the
///      Groth16 verification at ~254K gas, a quarter of the NFR-2 budget.
interface ISP1Verifier {
    /// @notice Verify a proof for a given program.
    /// @param programVKey Verification key hash of the guest program
    /// @param publicValues Bytes the guest committed
    /// @param proofBytes The wrapped proof
    /// @dev Reverts on an invalid proof rather than returning false.
    function verifyProof(
        bytes32 programVKey,
        bytes calldata publicValues,
        bytes calldata proofBytes
    ) external view;
}
