// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {L1Vault} from "@qs/L1Vault.sol";
import {ProverRegistry} from "@qs/ProverRegistry.sol";
import {RegistrySetCommitment} from "@qs/RegistrySetCommitment.sol";
import {ThresholdVerifier, IWrapVerifier} from "@qs/ThresholdVerifier.sol";
import {SHA3_256} from "@qs/libraries/SHA3_256.sol";

contract AcceptAllWrap is IWrapVerifier {
    bool public accept = true;
    bytes32 public lastDigest;

    function setAccept(bool a) external {
        accept = a;
    }

    function verifyWrapped(bytes calldata, bytes32 digest) external view returns (bool) {
        digest;
        return accept;
    }
}

/// @title L1VaultProofUnlock - FR-THRESH-1 proof-based unlock wiring
/// @notice Exercises requestUnlockWithProof end to end against the registry
///         set commitment and the ThresholdVerifier native layer, with the
///         wrap boundary mocked (the real-pairing coverage lives in
///         Groth16WrapVerifierTest / ThresholdGroth16E2ETest).
contract L1VaultProofUnlockTest is Test {
    // Fixture public keys (threshold-m3 fixture; any 32-byte values work
    // here — signature validity is the wrapped proof's concern).
    bytes internal constant PK0 =
        hex"024f837cec77fdbdf35bb964dedbe803711a5770356d69c6efebf6de796c31f7";
    bytes internal constant PK1 =
        hex"444b8afdbbb097155e288d67d1f89a4750e73c4d031b2fc3206cce887e19c819";

    L1Vault internal vault;
    ProverRegistry internal registry;
    RegistrySetCommitment internal commitment;
    ThresholdVerifier internal verifier;
    AcceptAllWrap internal wrap;

    bytes32 internal lockId;

    function setUp() public {
        vault = new L1Vault(address(this), address(0xdead));
        registry = new ProverRegistry(address(this), true);
        commitment = new RegistrySetCommitment(address(registry));
        verifier = new ThresholdVerifier(address(commitment), 2);
        wrap = new AcceptAllWrap();
        verifier.setWrapVerifier(address(wrap));

        registry.registerProverTestnet(address(0x1001), PK0);
        registry.registerProverTestnet(address(0x1002), PK1);
        commitment.snapshot();

        // Install the threshold verifier through the three-step governance.
        vault.proposeThresholdVerifier(address(verifier));
        vault.approveThresholdVerifier(address(verifier));
        vm.warp(block.timestamp + vault.VERIFIER_UPDATE_DELAY() + 1);
        vault.executeThresholdVerifierUpdate();
        assertEq(address(vault.thresholdVerifier()), address(verifier));

        // Create a lock to unlock.
        lockId = vault.lock{value: 1 ether}(address(0xbeef), abi.encodePacked(bytes32(uint256(1))));
    }

    /// Signers sorted by ascending leaf hash with height-1 sibling paths.
    function signers() internal pure returns (ThresholdVerifier.SignerProof[] memory s) {
        bytes32 leaf0 = SHA3_256.hash(PK0);
        bytes32 leaf1 = SHA3_256.hash(PK1);
        (bytes memory a, bytes memory b, bytes32 la, bytes32 lb, uint256 ia, uint256 ib) =
            leaf0 < leaf1 ? (PK0, PK1, leaf0, leaf1, uint256(0), uint256(1))
                          : (PK1, PK0, leaf1, leaf0, uint256(1), uint256(0));
        s = new ThresholdVerifier.SignerProof[](2);
        bytes32[] memory pa = new bytes32[](1);
        pa[0] = lb;
        bytes32[] memory pb = new bytes32[](1);
        pb[0] = la;
        s[0] = ThresholdVerifier.SignerProof(a, ia, pa);
        s[1] = ThresholdVerifier.SignerProof(b, ib, pb);
    }

    function test_ProofBasedUnlockCreatesRequest() public {
        vault.requestUnlockWithProof(
            lockId, address(0xbeef), new bytes32[](0), lockId, 0, signers(), hex"aa"
        );
        L1Vault.UnlockRequest memory req = vault.getUnlockRequest(lockId);
        assertEq(req.recipient, address(0xbeef));
        assertEq(req.signatureCount, 2);
        assertEq(uint256(vault.getLock(lockId).status), uint256(L1Vault.LockStatus.PENDING_UNLOCK));
    }

    function test_RevertsWhenWrapProofRejected() public {
        wrap.setAccept(false);
        vm.expectRevert(ThresholdVerifier.InvalidWrappedProof.selector);
        vault.requestUnlockWithProof(
            lockId, address(0xbeef), new bytes32[](0), lockId, 0, signers(), hex"aa"
        );
    }

    function test_RevertsWhenSignerNotInRegistry() public {
        ThresholdVerifier.SignerProof[] memory s = signers();
        s[0].sphincsPublicKey =
            hex"00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
        vm.expectRevert(
            abi.encodeWithSelector(ThresholdVerifier.NotMember.selector, 0)
        );
        vault.requestUnlockWithProof(
            lockId, address(0xbeef), new bytes32[](0), lockId, 0, s, hex"aa"
        );
    }

    function test_RevertsBelowThreshold() public {
        ThresholdVerifier.SignerProof[] memory one = new ThresholdVerifier.SignerProof[](1);
        one[0] = signers()[0];
        vm.expectRevert(ThresholdVerifier.BelowThreshold.selector);
        vault.requestUnlockWithProof(
            lockId, address(0xbeef), new bytes32[](0), lockId, 0, one, hex"aa"
        );
    }

    function test_RevertsWhenVerifierUnset() public {
        L1Vault bare = new L1Vault(address(this), address(0xdead));
        bytes32 id = bare.lock{value: 1 ether}(address(0xbeef), abi.encodePacked(bytes32(uint256(1))));
        vm.expectRevert(L1Vault.VerifierNotSet.selector);
        bare.requestUnlockWithProof(
            id, address(0xbeef), new bytes32[](0), id, 0, signers(), hex"aa"
        );
    }

    function test_GovernanceTimelockEnforced() public {
        L1Vault v2 = new L1Vault(address(this), address(0xdead));
        v2.proposeThresholdVerifier(address(verifier));
        v2.approveThresholdVerifier(address(verifier));
        vm.expectRevert(L1Vault.VerifierTimelockActive.selector);
        v2.executeThresholdVerifierUpdate();
    }
}
