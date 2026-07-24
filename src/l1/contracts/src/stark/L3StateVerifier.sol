// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {STARKVerifier} from "../STARKVerifier.sol";
import {ProofCodec} from "../libraries/ProofCodec.sol";
import {SHA3_256} from "../libraries/SHA3_256.sol";

/// @title L3StateVerifier - Proof-based state verifier for the L3 CoreLayer
/// @notice Binds L3 state claims (inclusion / transition) to STARK proof
///         verification. Implements the IStateVerifier ABI consumed by
///         CoreLayer (src/l3/src/interfaces/IStateVerifier.sol).
/// @dev ONCHAIN_TRUST_MECHANISM_REQUIREMENTS.md FR-L3-1..3.
///
/// Public input binding (FR-L3-3):
///   inclusion:  SHA3-256("QS_L3_INCLUSION_V1"  || stateRoot || txHash)
///   transition: SHA3-256("QS_L3_TRANSITION_V1" || oldRoot   || newRoot)
/// The off-chain prover must generate proofs against the same public input.
///
/// CP-1 Compliance: SHA3-256 only; the underlying STARKVerifier uses
/// SHA3-256/Goldilocks (128-bit security).
///
/// Scope note (R-2): STARKVerifier v1.0 enforces proof structure, commitments,
/// FRI layer shape and query-count security bounds. Deepening AIR constraint
/// binding to the public input is tracked as requirement R-2 and lands in the
/// STARKVerifier, not here — this adapter already passes the bound public
/// input through.
/// @custom:security-contact security@quantumshield.io
contract L3StateVerifier {
    /// @notice The STARK verifier enforcing the proofs
    STARKVerifier public immutable starkVerifier;

    error ZeroAddress();

    constructor(address _starkVerifier) {
        if (_starkVerifier == address(0)) revert ZeroAddress();
        starkVerifier = STARKVerifier(_starkVerifier);
    }

    /// @notice Verify a proof that `txHash` is included in `stateRoot`
    function verifyInclusion(
        bytes32 stateRoot,
        bytes32 txHash,
        bytes calldata proof
    ) external view returns (bool valid) {
        bytes32 publicInput = SHA3_256.hash(
            abi.encodePacked("QS_L3_INCLUSION_V1", stateRoot, txHash)
        );
        return _verify(proof, publicInput);
    }

    /// @notice Verify a proof of a state transition oldStateRoot -> newStateRoot
    function verifyTransition(
        bytes32 oldStateRoot,
        bytes32 newStateRoot,
        bytes calldata proof
    ) external view returns (bool valid) {
        bytes32 publicInput = SHA3_256.hash(
            abi.encodePacked("QS_L3_TRANSITION_V1", oldStateRoot, newStateRoot)
        );
        return _verify(proof, publicInput);
    }

    /// @dev Malformed proof bytes must yield `false`, not a decode panic that
    ///      masks the StateVerificationFailed revert in CoreLayer
    function _verify(bytes calldata proofBytes, bytes32 publicInput) internal view returns (bool) {
        if (proofBytes.length == 0) return false;
        try this.decodeAndVerify(proofBytes, publicInput) returns (bool ok) {
            return ok;
        } catch {
            return false;
        }
    }

    /// @notice Decode serialized proof bytes and run STARK verification
    /// @dev External so _verify can try/catch decode panics; view-only, safe to expose
    function decodeAndVerify(bytes calldata proofBytes, bytes32 publicInput) external view returns (bool) {
        ProofCodec.STARKProof memory proof = ProofCodec.decode(proofBytes);
        return starkVerifier.verifyProof(proof, publicInput);
    }
}
