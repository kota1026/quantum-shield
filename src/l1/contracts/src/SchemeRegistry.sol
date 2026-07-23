// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISignatureVerifier} from "./interfaces/ISignatureVerifier.sol";

/// @title SchemeRegistry - governance-gated registry of post-quantum signature verifiers
/// @notice QS crypto-agility (Move 2). Maps a schemeId to its ISignatureVerifier so that
///         L1Vault (and any future vault) can hot-swap the active scheme's verifier
///         (e.g. ML-DSA-65 -> ML-DSA-87, or add a threshold-ML-DSA verifier) without a
///         hard migration. Deliberately an INDEPENDENT contract so it can be audited in
///         isolation and shared across vaults, and so verifier changes never touch a
///         vault's bytecode.
/// @dev Mutations are owner-gated. The owner is expected to be a SecurityCouncil or a
///      timelocked governance address — the registry is a single point of trust, so its
///      ownership must itself be governed (timelock) at deployment time.
contract SchemeRegistry {
    /// @notice Governance address permitted to register verifiers.
    address public owner;

    /// @dev schemeId => verifier contract.
    mapping(bytes4 => address) private _verifiers;

    event VerifierSet(bytes4 indexed schemeId, address indexed verifier, address indexed by);
    event OwnershipTransferred(address indexed from, address indexed to);

    error NotOwner();
    error ZeroAddress();
    error SchemeMismatch(bytes4 expected, bytes4 got);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _owner) {
        if (_owner == address(0)) revert ZeroAddress();
        owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    /// @notice Register or replace the verifier for `schemeId`.
    /// @dev The verifier's own schemeId() MUST equal `schemeId`, so a mis-tagged verifier
    ///      cannot be wired to the wrong scheme.
    function setVerifier(bytes4 schemeId, address verifier) external onlyOwner {
        if (verifier == address(0)) revert ZeroAddress();
        bytes4 got = ISignatureVerifier(verifier).schemeId();
        if (got != schemeId) revert SchemeMismatch(schemeId, got);
        _verifiers[schemeId] = verifier;
        emit VerifierSet(schemeId, verifier, msg.sender);
    }

    /// @notice Resolve the verifier registered for `schemeId` (address(0) if unset).
    function verifierFor(bytes4 schemeId) external view returns (address) {
        return _verifiers[schemeId];
    }

    /// @notice Transfer registry ownership (e.g. to a new governance/timelock).
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
