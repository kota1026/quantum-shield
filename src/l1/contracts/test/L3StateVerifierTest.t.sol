// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {STARKVerifier} from "../src/STARKVerifier.sol";
import {L3StateVerifier} from "../src/stark/L3StateVerifier.sol";
import {ProofCodec} from "../src/libraries/ProofCodec.sol";

/// @title L3StateVerifier Tests
/// @notice NFR-6 coverage for the CoreLayer proof enforcement adapter
///         (FR-L3-1..3): success path plus the failure modes a malicious or
///         buggy prover would hit (empty, malformed, structurally invalid).
contract L3StateVerifierTest is Test {
    STARKVerifier internal starkVerifier;
    L3StateVerifier internal stateVerifier;

    bytes32 internal constant OLD_ROOT = bytes32(uint256(0xaaa1));
    bytes32 internal constant NEW_ROOT = bytes32(uint256(0xbbb2));
    bytes32 internal constant TX_HASH = bytes32(uint256(0xccc3));

    function setUp() public {
        starkVerifier = new STARKVerifier();
        stateVerifier = new L3StateVerifier(address(starkVerifier));
    }

    function test_Constructor_ZeroVerifier_Reverts() public {
        vm.expectRevert(L3StateVerifier.ZeroAddress.selector);
        new L3StateVerifier(address(0));
    }

    function test_VerifyTransition_StructurallyValidProof_Accepts() public view {
        bytes memory proof = ProofCodec.encode(_structurallyValidProof());
        assertTrue(stateVerifier.verifyTransition(OLD_ROOT, NEW_ROOT, proof), "Valid proof should verify");
    }

    function test_VerifyInclusion_StructurallyValidProof_Accepts() public view {
        bytes memory proof = ProofCodec.encode(_structurallyValidProof());
        assertTrue(stateVerifier.verifyInclusion(OLD_ROOT, TX_HASH, proof), "Valid proof should verify");
    }

    function test_Rejects_EmptyProof() public view {
        assertFalse(stateVerifier.verifyTransition(OLD_ROOT, NEW_ROOT, ""), "Empty proof must be rejected");
        assertFalse(stateVerifier.verifyInclusion(OLD_ROOT, TX_HASH, ""), "Empty proof must be rejected");
    }

    function test_Rejects_MalformedBytes() public view {
        // The 32-byte blob that satisfied the old CoreLayer placeholder
        // (proof.length >= 32) must now fail decoding and be rejected
        bytes memory garbage = abi.encodePacked(bytes32(uint256(1)));
        assertFalse(stateVerifier.verifyTransition(OLD_ROOT, NEW_ROOT, garbage), "Garbage bytes must be rejected");
    }

    function test_Rejects_InsufficientQueries() public view {
        ProofCodec.STARKProof memory proof = _structurallyValidProof();
        // Below MIN_QUERIES security bound
        proof.queryIndices = new uint256[](1);
        proof.merkleProofs = new bytes32[][](1);
        proof.merkleProofs[0] = new bytes32[](1);
        proof.evaluations = new uint256[][](1);
        proof.evaluations[0] = new uint256[](1);
        assertFalse(
            stateVerifier.verifyTransition(OLD_ROOT, NEW_ROOT, ProofCodec.encode(proof)),
            "Proof below the query security bound must be rejected"
        );
    }

    function test_Rejects_ZeroTraceCommitment() public view {
        ProofCodec.STARKProof memory proof = _structurallyValidProof();
        proof.traceCommitment = bytes32(0);
        assertFalse(
            stateVerifier.verifyTransition(OLD_ROOT, NEW_ROOT, ProofCodec.encode(proof)),
            "Zero trace commitment must be rejected"
        );
    }

    /// @dev Satisfies STARKVerifier.verifyProof structure and security checks:
    ///      matching array lengths, non-zero commitments, >= MIN_QUERIES
    ///      queries, low-degree final polynomial
    function _structurallyValidProof() internal view returns (ProofCodec.STARKProof memory proof) {
        uint256 queries = starkVerifier.MIN_QUERIES();

        proof.traceCommitment = bytes32(uint256(0x1111));
        proof.constraintCommitment = bytes32(uint256(0x2222));

        proof.friCommitments = new bytes32[](2);
        proof.friCommitments[0] = bytes32(uint256(0x3333));
        proof.friCommitments[1] = bytes32(uint256(0x4444));
        proof.friChallenges = new uint256[](2);
        proof.friChallenges[0] = 100;
        proof.friChallenges[1] = 200;

        proof.queryIndices = new uint256[](queries);
        proof.merkleProofs = new bytes32[][](queries);
        proof.evaluations = new uint256[][](queries);
        for (uint256 i = 0; i < queries; i++) {
            proof.queryIndices[i] = i;
            proof.merkleProofs[i] = new bytes32[](1);
            proof.merkleProofs[i][0] = bytes32(uint256(0x5555 + i));
            proof.evaluations[i] = new uint256[](1);
            proof.evaluations[i][0] = 1000 + i;
        }

        proof.finalPolynomial = new uint256[](2);
        proof.finalPolynomial[0] = 10;
        proof.finalPolynomial[1] = 20;
    }
}
