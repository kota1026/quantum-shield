// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {SPHINCSVerifier} from "../src/SPHINCSVerifier.sol";

/// @title SPHINCSVerifierConformance - does the on-chain verifier accept a
///        genuine FIPS 205 signature?
/// @notice `docs/core/STARK_AIR_GAP_ANALYSIS.md` §24.3 flagged a consistency
///         requirement: the zkVM guest and this contract must agree on every
///         signature, or the proof route (FR-THRESH-1) and the full-direct
///         fallback (FR-THRESH-4) give different answers for the same unlock.
///
/// The vector under `test/vectors/` is a real SLH-DSA-SHAKE-128s signature
/// produced by the RustCrypto `slh-dsa` implementation and accepted by our own
/// verifier, over exactly the 32-byte message `L1Vault` derives. Whatever this
/// contract says about it is the answer to that question.
contract SPHINCSVerifierConformanceTest is Test {
    SPHINCSVerifier public verifier;

    bytes32 public message;
    bytes public signature;
    bytes public publicKey;

    function setUp() public {
        verifier = new SPHINCSVerifier();
        message = bytes32(vm.readFileBinary("./test/vectors/sol_message.bin"));
        signature = vm.readFileBinary("./test/vectors/sol_sig.bin");
        publicKey = vm.readFileBinary("./test/vectors/sol_pk.bin");
    }

    /// @notice The fixture must be the parameter set the contract expects,
    ///         so a rejection cannot be blamed on a size mismatch.
    function testFixtureMatchesTheExpectedSizes() public view {
        assertEq(signature.length, verifier.getSignatureSize(), "SLH-DSA-SHAKE-128s signature");
        assertEq(publicKey.length, 32, "PK.seed || PK.root");
        assertTrue(verifier.isValidPublicKeyFormat(publicKey));
    }

    /// @notice Ethereum's block gas limit, for scale. Sepolia matches mainnet.
    uint256 internal constant BLOCK_GAS_LIMIT = 30_000_000;

    /// @notice Full-direct verification of a real signature cannot be executed
    ///         on-chain: it burns ~674M gas — more than twenty blocks' worth —
    ///         and reverts without completing.
    /// @dev This test passes to *pin the limitation*, not to bless it. If the
    ///      verifier is ever made viable, this test fails and whoever fixed it
    ///      must update `FR-THRESH-4`'s recoverability claim with it. The
    ///      consequence is recorded in `STARK_AIR_GAP_ANALYSIS.md` §25.
    function testFullDirectVerificationExceedsTheBlockGasLimit() public {
        uint256 before = gasleft();
        try verifier.verify(message, signature, publicKey) returns (bool accepted) {
            uint256 used = before - gasleft();
            emit log_named_uint("verify() gas", used);
            emit log_named_string("verdict", accepted ? "ACCEPTED" : "REJECTED");
            assertGt(used, BLOCK_GAS_LIMIT, "if this now fits in a block, revisit FR-THRESH-4");
        } catch {
            uint256 used = before - gasleft();
            emit log_named_uint("gas consumed before revert", used);
            emit log_named_uint("block gas limit", BLOCK_GAS_LIMIT);
            emit log_named_uint("multiple of a full block", used / BLOCK_GAS_LIMIT);
            assertGt(
                used,
                BLOCK_GAS_LIMIT,
                "reverted, and consumed more than a block doing so"
            );
        }
    }
}
