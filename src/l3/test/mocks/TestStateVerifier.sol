// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IStateVerifier} from "../../src/interfaces/IStateVerifier.sol";

/// @title TestStateVerifier - controllable IStateVerifier double for tests
/// @notice Lets tests exercise both the accept and reject paths of CoreLayer's
///         proof enforcement (NFR-6: success + failure cases). Rejects empty
///         proofs unconditionally, mirroring any real verifier.
contract TestStateVerifier is IStateVerifier {
    bool public acceptInclusion = true;
    bool public acceptTransition = true;

    function setAcceptInclusion(bool v) external {
        acceptInclusion = v;
    }

    function setAcceptTransition(bool v) external {
        acceptTransition = v;
    }

    function verifyInclusion(bytes32, bytes32, bytes calldata proof) external view returns (bool) {
        return proof.length > 0 && acceptInclusion;
    }

    function verifyTransition(bytes32, bytes32, bytes calldata proof) external view returns (bool) {
        return proof.length > 0 && acceptTransition;
    }
}
