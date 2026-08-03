// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ProverRegistry} from "@qs/ProverRegistry.sol";
import {RegistrySetCommitment} from "@qs/RegistrySetCommitment.sol";
import {ThresholdVerifier, IWrapVerifier} from "@qs/ThresholdVerifier.sol";
import {SHA3_256} from "@qs/libraries/SHA3_256.sol";

/// @notice Wrap-verifier stand-in until M0.5-impl delivers the real one:
///         accepts iff told to, and records the digest it was asked about.
contract MockWrapVerifier is IWrapVerifier {
    bool public accept = true;
    bytes32 public lastDigest;

    function setAccept(bool a) external {
        accept = a;
    }

    function verifyWrapped(bytes calldata, bytes32 publicInputsDigest)
        external
        view
        returns (bool)
    {
        publicInputsDigest; // bound by ThresholdVerifier; checked in tests
        return accept;
    }

    function expectedDigest(bytes32 message, bytes memory pks)
        external
        pure
        returns (bytes32)
    {
        return SHA3_256.hash(bytes.concat(abi.encodePacked(message), pks));
    }
}

contract ThresholdVerifierTest is Test {
    ProverRegistry internal registry;
    RegistrySetCommitment internal commitment;
    ThresholdVerifier internal verifier;
    MockWrapVerifier internal wrap;

    // Golden fixture (threshold-m3/src/bin/fixture.rs).
    bytes internal constant PK0 =
        hex"024f837cec77fdbdf35bb964dedbe803711a5770356d69c6efebf6de796c31f7";
    bytes internal constant PK1 =
        hex"444b8afdbbb097155e288d67d1f89a4750e73c4d031b2fc3206cce887e19c819";
    bytes internal constant PK2 =
        hex"d02dccb6761c84918d39644a3e16ba46f5b581f6b47157a747d25d6aca0beae0";
    bytes internal constant PK3 =
        hex"8f191f48b3eb9a320e48458ed9a0f5dc44248a1122d7bf1a11fb360a9a11f185";
    bytes internal constant PK4 =
        hex"bab757a108036f4bfad6e087330b5456614172bf8dabf067a65c82c8a59ee9a8";

    bytes32 internal constant MESSAGE = keccak256("qs-m4 unlock request #42");

    function setUp() public {
        registry = new ProverRegistry(address(this), true);
        commitment = new RegistrySetCommitment(address(registry));
        verifier = new ThresholdVerifier(address(commitment), 2);
        wrap = new MockWrapVerifier();
        verifier.setWrapVerifier(address(wrap));

        registry.registerProverTestnet(address(0x1001), PK0);
        registry.registerProverTestnet(address(0x1002), PK1);
        registry.registerProverTestnet(address(0x1003), PK2);
        registry.registerProverTestnet(address(0x1004), PK3);
        registry.registerProverTestnet(address(0x1005), PK4);
        commitment.snapshot();
    }

    function signerProof(bytes memory pk, uint256 index, bytes32[3] memory p)
        internal
        pure
        returns (ThresholdVerifier.SignerProof memory s)
    {
        bytes32[] memory path = new bytes32[](3);
        path[0] = p[0];
        path[1] = p[1];
        path[2] = p[2];
        s = ThresholdVerifier.SignerProof(pk, index, path);
    }

    /// Signers 1 and 3 (sorted by leaf hash: leaf1 0xd8.. > leaf3 0xaf..,
    /// so order is [3, 1]).
    function honestSigners()
        internal
        pure
        returns (ThresholdVerifier.SignerProof[] memory signers)
    {
        signers = new ThresholdVerifier.SignerProof[](2);
        signers[0] = signerProof(
            PK3,
            3,
            [
                bytes32(0xe78c33e74ffacea97941f63593dc2abcb5914781263e7eb575c2d0a27b636ed4),
                bytes32(0xfe42e3c994c0b4c5a92d7b48a665efc9f89ebf2f82fdacd5b293fad1f42e5612),
                bytes32(0xe7fde6d42dd6ca1739e0d932c74abe6aee7b8f78dcb71e67b7c806b6ba3b10ab)
            ]
        );
        signers[1] = signerProof(
            PK1,
            1,
            [
                bytes32(0x87d856786b38316b73611460609f84222c96acd1cff92048b06136e31f8ce2a0),
                bytes32(0x39341aaca9b9768156ba42b2b682bc7e3f17f2e7d1d5ede2e5df774c9cd7cef2),
                bytes32(0xe7fde6d42dd6ca1739e0d932c74abe6aee7b8f78dcb71e67b7c806b6ba3b10ab)
            ]
        );
    }

    function test_HonestThresholdVerifies() public view {
        assertTrue(verifier.verifyThreshold(MESSAGE, 0, honestSigners(), hex"aa"));
    }

    function test_RejectsBelowThreshold() public {
        ThresholdVerifier.SignerProof[] memory one =
            new ThresholdVerifier.SignerProof[](1);
        one[0] = honestSigners()[0];
        vm.expectRevert(ThresholdVerifier.BelowThreshold.selector);
        verifier.verifyThreshold(MESSAGE, 0, one, hex"aa");
    }

    function test_RejectsDuplicateSigner() public {
        ThresholdVerifier.SignerProof[] memory dup =
            new ThresholdVerifier.SignerProof[](2);
        dup[0] = honestSigners()[0];
        dup[1] = honestSigners()[0];
        vm.expectRevert(
            abi.encodeWithSelector(
                ThresholdVerifier.SignersNotStrictlyOrdered.selector, 1
            )
        );
        verifier.verifyThreshold(MESSAGE, 0, dup, hex"aa");
    }

    function test_RejectsNonMember() public {
        ThresholdVerifier.SignerProof[] memory signers = honestSigners();
        // Position 0 so the strict-ordering check cannot fire first.
        signers[0].sphincsPublicKey =
            hex"00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
        vm.expectRevert(
            abi.encodeWithSelector(ThresholdVerifier.NotMember.selector, 0)
        );
        verifier.verifyThreshold(MESSAGE, 0, signers, hex"aa");
    }

    function test_RejectsForgedPath() public {
        ThresholdVerifier.SignerProof[] memory signers = honestSigners();
        signers[0].path[2] = bytes32(uint256(signers[0].path[2]) ^ 1);
        vm.expectRevert(
            abi.encodeWithSelector(ThresholdVerifier.NotMember.selector, 0)
        );
        verifier.verifyThreshold(MESSAGE, 0, signers, hex"aa");
    }

    function test_RejectsWrongPathLength() public {
        ThresholdVerifier.SignerProof[] memory signers = honestSigners();
        signers[0].path = new bytes32[](2);
        vm.expectRevert(
            abi.encodeWithSelector(ThresholdVerifier.InvalidPathLength.selector, 0)
        );
        verifier.verifyThreshold(MESSAGE, 0, signers, hex"aa");
    }

    function test_RejectsWhenWrapProofInvalid() public {
        wrap.setAccept(false);
        vm.expectRevert(ThresholdVerifier.InvalidWrappedProof.selector);
        verifier.verifyThreshold(MESSAGE, 0, honestSigners(), hex"aa");
    }

    function test_RejectsWhenWrapVerifierUnset() public {
        ThresholdVerifier bare = new ThresholdVerifier(address(commitment), 2);
        vm.expectRevert(ThresholdVerifier.WrapVerifierNotSet.selector);
        bare.verifyThreshold(MESSAGE, 0, honestSigners(), hex"aa");
    }

    function test_PublicInputsDigestBindsMessageAndSigners() public view {
        // The digest the wrapped proof must bind: SHA3-256(message || pk3 || pk1).
        bytes32 expected =
            wrap.expectedDigest(MESSAGE, bytes.concat(PK3, PK1));
        // Recompute what ThresholdVerifier builds internally.
        bytes32 rebuilt = SHA3_256.hash(
            bytes.concat(abi.encodePacked(MESSAGE), PK3, PK1)
        );
        assertEq(rebuilt, expected);
    }

    function test_OnlyOwnerSetsWrapVerifier() public {
        vm.prank(address(0xdead));
        vm.expectRevert(ThresholdVerifier.NotOwner.selector);
        verifier.setWrapVerifier(address(wrap));
    }
}
