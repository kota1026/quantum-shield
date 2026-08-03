// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RegistrySetCommitment} from "./RegistrySetCommitment.sol";
import {SHA3_256} from "./libraries/SHA3_256.sol";

/// @title IWrapVerifier - M0.5-impl plug point
/// @notice Verifier of the wrapped (recursively aggregated) proof that
///         attests "each listed signer's SLH-DSA-SHAKE-128s signature on
///         the message is valid". The wrap implementation (Groth16 or
///         Halo2 over the STARK compositions, gap analysis section 7.4/7.5)
///         is built in a dedicated CI environment and plugged in here.
interface IWrapVerifier {
    /// @param proof Wrapped proof bytes (format defined by the wrap stage).
    /// @param publicInputsDigest SHA3-256 binding of (message || signer pks)
    ///        as computed by ThresholdVerifier.
    function verifyWrapped(bytes calldata proof, bytes32 publicInputsDigest)
        external
        view
        returns (bool);
}

/// @title ThresholdVerifier - FR-THRESH-1 on-chain native layer
/// @notice On-chain side of the 2/N threshold statement: "at least
///         `threshold` distinct provers whose public keys are in the
///         registry set commitment at `epoch` have valid SLH-DSA signatures
///         on `message`". Everything that is a check over public values -
///         threshold count, signer deduplication, set membership - is
///         verified natively here, mirroring the verifier-side native
///         checks of the circuit composition (threshold-m3); signature
///         validity itself is attested by the wrapped proof.
contract ThresholdVerifier {
    struct SignerProof {
        /// 32 bytes: PK.seed || PK.root.
        bytes sphincsPublicKey;
        /// Leaf slot in the snapshot tree.
        uint256 index;
        /// Membership path to the epoch root (length = snapshot height).
        bytes32[] path;
    }

    RegistrySetCommitment public immutable commitment;
    uint256 public immutable threshold;
    address public owner;
    IWrapVerifier public wrapVerifier;

    event WrapVerifierUpdated(address indexed verifier);

    error NotOwner();
    error ZeroAddress();
    error WrapVerifierNotSet();
    error BelowThreshold();
    error InvalidPublicKeyLength(uint256 signerIdx);
    error InvalidPathLength(uint256 signerIdx);
    error SignersNotStrictlyOrdered(uint256 signerIdx);
    error NotMember(uint256 signerIdx);
    error InvalidWrappedProof();

    constructor(address _commitment, uint256 _threshold) {
        if (_commitment == address(0)) revert ZeroAddress();
        commitment = RegistrySetCommitment(_commitment);
        threshold = _threshold;
        owner = msg.sender;
    }

    function setWrapVerifier(address verifier) external {
        if (msg.sender != owner) revert NotOwner();
        if (verifier == address(0)) revert ZeroAddress();
        wrapVerifier = IWrapVerifier(verifier);
        emit WrapVerifierUpdated(verifier);
    }

    /// @notice Verify the threshold statement for `message` against the set
    ///         commitment at `epoch`. Reverts with a specific error on any
    ///         failed check; returns true otherwise.
    /// @dev Signers must be sorted by strictly increasing leaf hash
    ///      (SHA3-256 of the public key), which enforces deduplication in
    ///      O(n). The wrapped proof is bound to the exact signer set and
    ///      message via publicInputsDigest = SHA3-256(message || pk_0 ||
    ///      ... || pk_{k-1}).
    function verifyThreshold(
        bytes32 message,
        uint256 epoch,
        SignerProof[] calldata signers,
        bytes calldata wrappedProof
    ) external view returns (bool) {
        if (address(wrapVerifier) == address(0)) revert WrapVerifierNotSet();
        if (signers.length < threshold) revert BelowThreshold();
        bytes32 root = commitment.rootAt(epoch);
        uint8 height = commitment.heightAt(epoch);

        bytes32 prevLeaf;
        bytes memory bound = abi.encodePacked(message);
        for (uint256 i = 0; i < signers.length; i++) {
            SignerProof calldata s = signers[i];
            if (s.sphincsPublicKey.length != 32) revert InvalidPublicKeyLength(i);
            if (s.path.length != height) revert InvalidPathLength(i);

            bytes32 leaf = SHA3_256.hash(s.sphincsPublicKey);
            if (i > 0 && leaf <= prevLeaf) revert SignersNotStrictlyOrdered(i);
            prevLeaf = leaf;

            bytes32 node = leaf;
            for (uint256 j = 0; j < s.path.length; j++) {
                node = (s.index >> j) & 1 == 0
                    ? SHA3_256.hashPair(node, s.path[j])
                    : SHA3_256.hashPair(s.path[j], node);
            }
            if (node != root) revert NotMember(i);

            bound = bytes.concat(bound, s.sphincsPublicKey);
        }

        bytes32 publicInputsDigest = SHA3_256.hash(bound);
        if (!wrapVerifier.verifyWrapped(wrappedProof, publicInputsDigest)) {
            revert InvalidWrappedProof();
        }
        return true;
    }
}
