// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RejectingSPHINCSVerifier - mock that rejects every signature
/// @notice Used to test that L1Vault enforces verifier rejection (NFR-6:
///         failure-path coverage for FR-THRESH-2/6 — no tautological path
///         may let unverified signatures through)
contract RejectingSPHINCSVerifier {
    function verify(bytes32, bytes calldata, bytes calldata) external pure returns (bool) {
        return false;
    }
}
