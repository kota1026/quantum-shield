// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ISignatureVerifier - scheme-agnostic post-quantum signature verifier
/// @notice QS crypto-agility (Move 2). A single interface behind which any signature
///         scheme's verifier can be registered — ML-DSA-65/87, SLH-DSA (SPHINCS+),
///         FN-DSA, SQIsign, or a threshold-ML-DSA verifier that emits a STANDARD
///         signature. L1Vault resolves the active verifier through SchemeRegistry, so
///         schemes can be hot-swapped by governance without a hard migration or a
///         flag-day. Because a threshold/MPC signer produces an ordinary scheme
///         signature, the same verify() accepts it unchanged.
/// @dev The verify() shape is kept identical to the pre-existing ISPHINCSVerifier.verify
///      so SPHINCS+ verifiers conform without changes.
interface ISignatureVerifier {
    /// @notice Stable identifier of the scheme this verifier implements.
    /// @dev e.g. bytes4("SLH1") for SLH-DSA-SHAKE-128s, bytes4("MD65") for ML-DSA-65.
    function schemeId() external view returns (bytes4);

    /// @notice Verify `signature` over `message` under `publicKey`.
    /// @param message   32-byte message hash that was signed
    /// @param signature The raw scheme signature
    /// @param publicKey The signer's public key (raw scheme encoding)
    /// @return valid    True iff the signature is cryptographically valid
    function verify(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool valid);

    /// @notice Expected public-key length in bytes, or 0 if variable.
    function expectedPubKeyLen() external view returns (uint256);
}
