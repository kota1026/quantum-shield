// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISP1Verifier} from "./ISP1Verifier.sol";
import {IProverRegistry} from "../interfaces/IProverRegistry.sol";

/// @title ThresholdProofVerifier - proof-based SPHINCS+ threshold check (M4)
/// @notice Turns a wrapped zkVM proof into the answer `L1Vault` needs: "how
///         many distinct active provers signed this unlock?".
///
/// The heavy work — FIPS 205 verification of each signature and Merkle
/// membership of each signer in the `ProverRegistry` active set — happens
/// inside the zkVM guest (`src/crypto/zkvm/guest`). What is left on-chain is
/// binding the guest's committed values to *this* unlock, which is what this
/// contract does:
///
/// | committed value | bound to |
/// |---|---|
/// | `lockId` | the unlock request being served |
/// | `stateRoot` | the state root the signatures cover |
/// | `setCommitment` | a commitment `ProverRegistry` actually published (FR-THRESH-5) |
/// | `validCount` | compared against the threshold by the caller |
///
/// Without the `setCommitment` check a prover could prove membership in a set
/// of its own construction; `isKnownActiveSetCommitment` is what makes the
/// signer set the registry's, at some epoch, rather than the prover's.
///
/// @dev This is an adapter, not a policy: it returns `validCount` and lets
///      `L1Vault` apply `REQUIRED_SIGNATURES`. Keeping the threshold in the
///      vault means the proof system never has to know it.
contract ThresholdProofVerifier {
    /// @notice Byte layout the guest commits. Packed, fixed width.
    ///
    /// ```text
    /// [ 0..32)  lockId
    /// [32..64)  stateRoot
    /// [64..96)  setCommitment
    /// [96..100) validCount (uint32, big-endian)
    /// ```
    uint256 public constant PUBLIC_VALUES_LENGTH = 100;

    /// @notice The zkVM verifier (Succinct's gateway, or a mock in tests)
    ISP1Verifier public immutable verifier;

    /// @notice Verification key hash of the threshold guest program
    bytes32 public immutable programVKey;

    /// @notice Registry whose published commitments are accepted
    IProverRegistry public immutable proverRegistry;

    error ZeroAddress();
    error InvalidPublicValuesLength();
    error LockIdMismatch();
    error StateRootMismatch();
    error UnknownSetCommitment();

    /// @param _verifier zkVM proof verifier
    /// @param _programVKey Verification key hash of the guest
    /// @param _proverRegistry Registry publishing the active-set commitments
    constructor(address _verifier, bytes32 _programVKey, address _proverRegistry) {
        if (_verifier == address(0) || _proverRegistry == address(0)) revert ZeroAddress();
        verifier = ISP1Verifier(_verifier);
        programVKey = _programVKey;
        proverRegistry = IProverRegistry(_proverRegistry);
    }

    /// @notice Decode the committed values without verifying anything.
    /// @dev Exposed so callers and tests can inspect a proof's claims.
    function decodePublicValues(bytes calldata publicValues)
        public
        pure
        returns (bytes32 lockId, bytes32 stateRoot, bytes32 setCommitment, uint32 validCount)
    {
        if (publicValues.length != PUBLIC_VALUES_LENGTH) revert InvalidPublicValuesLength();
        lockId = bytes32(publicValues[0:32]);
        stateRoot = bytes32(publicValues[32:64]);
        setCommitment = bytes32(publicValues[64:96]);
        validCount = uint32(bytes4(publicValues[96:100]));
    }

    /// @notice Verify a threshold proof and return the valid signature count.
    /// @param lockId The unlock request's lock
    /// @param stateRoot The state root the signatures cover
    /// @param publicValues Values the guest committed
    /// @param proofBytes The wrapped proof
    /// @return validCount Distinct active provers whose signatures verified
    /// @dev Reverts if the proof is invalid, if it was produced for a
    ///      different lock or state root, or if the signer set it used is not
    ///      one the registry published.
    function verifyThreshold(
        bytes32 lockId,
        bytes32 stateRoot,
        bytes calldata publicValues,
        bytes calldata proofBytes
    ) external view returns (uint256 validCount) {
        (
            bytes32 provenLockId,
            bytes32 provenStateRoot,
            bytes32 setCommitment,
            uint32 provenCount
        ) = decodePublicValues(publicValues);

        // Bind the proof to this unlock before spending gas on verification.
        if (provenLockId != lockId) revert LockIdMismatch();
        if (provenStateRoot != stateRoot) revert StateRootMismatch();
        if (!proverRegistry.isKnownActiveSetCommitment(setCommitment)) {
            revert UnknownSetCommitment();
        }

        // Reverts on an invalid proof.
        verifier.verifyProof(programVKey, publicValues, proofBytes);

        return provenCount;
    }
}
