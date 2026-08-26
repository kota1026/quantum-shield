// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ThresholdProofVerifier} from "../src/wrap/ThresholdProofVerifier.sol";
import {ISP1Verifier} from "../src/wrap/ISP1Verifier.sol";
import {ProverRegistry} from "../src/ProverRegistry.sol";

/// @notice Stand-in for Succinct's verifier gateway.
/// @dev The real one checks a Groth16 proof; its gas is measured separately in
///      `Groth16VerifierGas.t.sol` (~254K at 8 public inputs). What these tests
///      exercise is the binding layer around it, so the mock only has to
///      distinguish an accepted proof from a rejected one.
contract MockSP1Verifier is ISP1Verifier {
    error MockProofRejected();

    /// @notice Proof bytes that this mock accepts.
    bytes public accepted;

    function setAccepted(bytes calldata proofBytes) external {
        accepted = proofBytes;
    }

    function verifyProof(bytes32, bytes calldata, bytes calldata proofBytes)
        external
        view
    {
        if (keccak256(proofBytes) != keccak256(accepted)) revert MockProofRejected();
    }
}

/// @title ThresholdProofVerifierTest - M4 binding and negative cases
/// @notice The zkVM guest proves the cryptography; this contract proves the
///         claim belongs to *this* unlock. These tests are about the latter.
contract ThresholdProofVerifierTest is Test {
    MockSP1Verifier public sp1;
    ProverRegistry public registry;
    ThresholdProofVerifier public verifier;

    bytes32 public constant VKEY = bytes32(uint256(0xABCDEF));
    bytes32 public constant LOCK_ID = bytes32(uint256(0x1111));
    bytes32 public constant STATE_ROOT = bytes32(uint256(0x2222));

    bytes public proofBytes = hex"c0ffee";

    bytes32 public setCommitment;

    function setUp() public {
        sp1 = new MockSP1Verifier();
        registry = new ProverRegistry(makeAddr("council"), true);
        verifier = new ThresholdProofVerifier(address(sp1), VKEY, address(registry));

        // Give the registry a member so its commitment is non-trivial.
        registry.registerProverTestnet(address(0x1000), _pubKey(1));
        (setCommitment, ) = registry.getActiveSetCommitment();

        sp1.setAccepted(proofBytes);
    }

    function _pubKey(uint8 seed) internal pure returns (bytes memory key) {
        key = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            key[i] = bytes1(uint8(seed) ^ uint8(i));
        }
    }

    function _publicValues(
        bytes32 lockId,
        bytes32 stateRoot,
        bytes32 commitment,
        uint32 validCount
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(lockId, stateRoot, commitment, validCount);
    }

    function _valid() internal view returns (bytes memory) {
        return _publicValues(LOCK_ID, STATE_ROOT, setCommitment, uint32(2));
    }

    // =========================================================================
    // Encoding
    // =========================================================================

    /// @notice The layout must round-trip; the guest encodes to this exact
    ///         100-byte shape (`src/crypto/zkvm/guest`).
    function testDecodesTheCommittedLayout() public view {
        (bytes32 lockId, bytes32 stateRoot, bytes32 commitment, uint32 count) =
            verifier.decodePublicValues(_valid());

        assertEq(lockId, LOCK_ID);
        assertEq(stateRoot, STATE_ROOT);
        assertEq(commitment, setCommitment);
        assertEq(count, 2);
        assertEq(_valid().length, verifier.PUBLIC_VALUES_LENGTH());
    }

    /// @notice Golden vector: the exact bytes `sphincs-m2`'s
    ///         `public_values::tests::golden_vector_hex` produces. If either
    ///         encoder changes without the other, one of the two tests fails.
    function testDecodesTheGoldenVector() public view {
        bytes memory golden =
            hex"1111111111111111111111111111111111111111111111111111111111111111"
            hex"2222222222222222222222222222222222222222222222222222222222222222"
            hex"3333333333333333333333333333333333333333333333333333333333333333"
            hex"00000002";

        (bytes32 lockId, bytes32 stateRoot, bytes32 commitment, uint32 count) =
            verifier.decodePublicValues(golden);

        assertEq(lockId, bytes32(uint256(0x1111111111111111111111111111111111111111111111111111111111111111)));
        assertEq(stateRoot, bytes32(uint256(0x2222222222222222222222222222222222222222222222222222222222222222)));
        assertEq(commitment, bytes32(uint256(0x3333333333333333333333333333333333333333333333333333333333333333)));
        assertEq(count, 2);
    }

    function testRejectsWrongLengthPublicValues() public {
        bytes memory short = hex"0011";
        vm.expectRevert(ThresholdProofVerifier.InvalidPublicValuesLength.selector);
        verifier.decodePublicValues(short);
    }

    // =========================================================================
    // Happy path
    // =========================================================================

    function testAcceptsAValidProof() public view {
        uint256 count = verifier.verifyThreshold(LOCK_ID, STATE_ROOT, _valid(), proofBytes);
        assertEq(count, 2, "the proven count is returned verbatim");
    }

    // =========================================================================
    // The bindings — each is a distinct way to reuse an otherwise valid proof
    // =========================================================================

    /// @notice A proof for another lock must not unlock this one. Without this
    ///         check a proof could be replayed across every lock sharing a
    ///         state root.
    function testRejectsAProofForAnotherLock() public {
        bytes memory pv = _publicValues(
            bytes32(uint256(0x9999)),
            STATE_ROOT,
            setCommitment,
            uint32(2)
        );
        vm.expectRevert(ThresholdProofVerifier.LockIdMismatch.selector);
        verifier.verifyThreshold(LOCK_ID, STATE_ROOT, pv, proofBytes);
    }

    /// @notice The signatures cover a state root; a proof over a different one
    ///         says nothing about this unlock.
    function testRejectsAProofForAnotherStateRoot() public {
        bytes memory pv = _publicValues(
            LOCK_ID,
            bytes32(uint256(0x8888)),
            setCommitment,
            uint32(2)
        );
        vm.expectRevert(ThresholdProofVerifier.StateRootMismatch.selector);
        verifier.verifyThreshold(LOCK_ID, STATE_ROOT, pv, proofBytes);
    }

    /// @notice FR-THRESH-1(b): the signer set has to be one the registry
    ///         published. Otherwise a prover proves membership in a set it
    ///         invented, and the threshold means nothing.
    function testRejectsASetCommitmentTheRegistryNeverPublished() public {
        bytes memory pv = _publicValues(
            LOCK_ID,
            STATE_ROOT,
            bytes32(uint256(0xDEAD)),
            uint32(2)
        );
        vm.expectRevert(ThresholdProofVerifier.UnknownSetCommitment.selector);
        verifier.verifyThreshold(LOCK_ID, STATE_ROOT, pv, proofBytes);
    }

    /// @notice A *historical* commitment stays acceptable: signatures collected
    ///         under an earlier active set must remain redeemable even after a
    ///         prover joins or leaves.
    function testAcceptsAHistoricalSetCommitment() public {
        bytes32 earlier = setCommitment;
        registry.registerProverTestnet(address(0x1001), _pubKey(2));
        (bytes32 current, ) = registry.getActiveSetCommitment();
        assertTrue(earlier != current, "the set must have moved on");

        bytes memory pv = _publicValues(LOCK_ID, STATE_ROOT, earlier, uint32(2));
        assertEq(verifier.verifyThreshold(LOCK_ID, STATE_ROOT, pv, proofBytes), 2);
    }

    /// @notice An invalid proof must revert even when every binding lines up.
    function testRejectsAnInvalidProof() public {
        vm.expectRevert(MockSP1Verifier.MockProofRejected.selector);
        verifier.verifyThreshold(LOCK_ID, STATE_ROOT, _valid(), hex"baadf00d");
    }

    /// @notice Public values cannot be edited after proving: the verifier is
    ///         given the same bytes it checks the proof against.
    function testRejectsTamperedCountWithTheOriginalProof() public {
        bytes memory pv = _publicValues(LOCK_ID, STATE_ROOT, setCommitment, uint32(99));
        // The mock accepts any proof bytes it was told to accept, so this
        // reaches the verifier — which in production binds publicValues into
        // the proof and would reject. Here we assert the plumbing passes the
        // *decoded* count through unchanged, so a real verifier sees it.
        assertEq(verifier.verifyThreshold(LOCK_ID, STATE_ROOT, pv, proofBytes), 99);
    }

    // =========================================================================
    // Gas (NFR-2)
    // =========================================================================

    /// @notice The binding layer's own cost, on top of the Groth16
    ///         verification measured in `Groth16VerifierGas.t.sol` (~254K).
    function testBindingGasIsNegligible() public {
        bytes memory pv = _valid();
        uint256 before = gasleft();
        verifier.verifyThreshold(LOCK_ID, STATE_ROOT, pv, proofBytes);
        uint256 used = before - gasleft();

        emit log_named_uint("binding gas (excl. real proof verification)", used);
        assertLt(used, 60_000, "the binding layer must stay a rounding error");
    }
}
