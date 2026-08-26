// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {SLHDSA} from "../src/crypto/SLHDSA.sol";

/// @notice Solidity cannot call a library's `internal` functions from a test,
///         so this exposes them.
contract SLHDSAHarness {
    function compressAddress(bytes32 adrs) external pure returns (bytes memory) {
        return SLHDSA.compressAddress(adrs);
    }

    function f(bytes16 pkSeed, bytes32 adrs, bytes16 m1) external view returns (bytes16) {
        return SLHDSA.f(pkSeed, adrs, m1);
    }

    function h(bytes16 pkSeed, bytes32 adrs, bytes16 m1, bytes16 m2)
        external
        view
        returns (bytes16)
    {
        return SLHDSA.h(pkSeed, adrs, m1, m2);
    }

    function tl(bytes16 pkSeed, bytes32 adrs, bytes calldata messages)
        external
        view
        returns (bytes16)
    {
        return SLHDSA.tl(pkSeed, adrs, messages);
    }

    function hMsg(bytes16 r, bytes16 pkSeed, bytes16 pkRoot, bytes calldata message)
        external
        view
        returns (bytes memory)
    {
        return SLHDSA.hMsg(r, pkSeed, pkRoot, message);
    }

    /// @notice `n` chained `F` calls, the shape a WOTS+ chain actually takes.
    /// @dev Measured as a batch so the per-call cost can be isolated from the
    ///      external-call overhead, which a real verifier does not pay — the
    ///      library's functions are `internal` and inline into it.
    function fBatch(bytes16 pkSeed, bytes32 adrs, bytes16 m1, uint256 n)
        external
        view
        returns (bytes16 acc)
    {
        acc = m1;
        for (uint256 i = 0; i < n; i++) {
            acc = SLHDSA.f(pkSeed, adrs, acc);
        }
    }
}

/// @title SLHDSATest - differential test against the FIPS 205 reference
/// @notice Every vector here comes from `src/crypto/slh-dsa-sha2`, which is
///         itself pinned against the independent RustCrypto implementation.
///         Regenerate with its `emit_component_vectors` example.
///
/// @dev Component-by-component on purpose. `SPHINCSVerifier.sol` was wrong for
///      a long time with nothing to catch it; an end-to-end test would only say
///      "fails" and leave the construction that broke unidentified
///      (`STARK_AIR_GAP_ANALYSIS.md` §25).
contract SLHDSATest is Test {
    SLHDSAHarness internal harness;

    bytes32 internal adrs;
    bytes internal adrsCompressed;
    bytes16 internal pkSeed;
    bytes16 internal m1;
    bytes16 internal m2;
    bytes16 internal expectedF;
    bytes16 internal expectedH;
    bytes internal tlRoots;
    bytes16 internal expectedTl;
    bytes16 internal r;
    bytes16 internal pkRoot;
    bytes internal hmsgMessage;
    bytes internal expectedHMsg;

    function setUp() public {
        harness = new SLHDSAHarness();

        string memory json = vm.readFile("./test/vectors/slhdsa_sha2_components.json");
        adrs = bytes32(vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".adrs"), (string)))));
        adrsCompressed = vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".adrsCompressed"), (string))));
        pkSeed = bytes16(vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".pkSeed"), (string)))));
        m1 = bytes16(vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".m1"), (string)))));
        m2 = bytes16(vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".m2"), (string)))));
        expectedF = bytes16(vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".f"), (string)))));
        expectedH = bytes16(vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".h"), (string)))));
        tlRoots = vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".tlRoots"), (string))));
        expectedTl = bytes16(vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".tl"), (string)))));
        r = bytes16(vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".r"), (string)))));
        pkRoot = bytes16(vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".pkRoot"), (string)))));
        hmsgMessage = vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".hmsgMessage"), (string))));
        expectedHMsg = vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, ".hmsg"), (string))));
    }

    /// @notice The address compression FIPS 205 §11.2 specifies. The reference
    ///         vector sets every field to a distinct value, so a wrong byte
    ///         offset cannot hide behind zeros.
    function testCompressAddressMatchesReference() public view {
        bytes memory got = harness.compressAddress(adrs);
        assertEq(got.length, 22, "ADRS^c is 22 bytes");
        assertEq(got, adrsCompressed);
    }

    /// @notice `F` — the WOTS+ chain and FORS leaf hash.
    function testFMatchesReference() public view {
        assertEq(harness.f(pkSeed, adrs, m1), expectedF);
    }

    /// @notice `H` — the Merkle node hash.
    function testHMatchesReference() public view {
        assertEq(harness.h(pkSeed, adrs, m1, m2), expectedH);
    }

    /// @notice `T_l` — the WOTS+ public key and FORS roots compression.
    function testTlMatchesReference() public view {
        assertEq(harness.tl(pkSeed, adrs, tlRoots), expectedTl);
    }

    /// @notice `H_msg` — MGF1 over SHA-256, and the only construction here that
    ///         is not a single hash call.
    function testHMsgMatchesReference() public view {
        bytes memory got = harness.hMsg(r, pkSeed, pkRoot, hmsgMessage);
        assertEq(got.length, 30, "m = 30 bytes for category 1");
        assertEq(got, expectedHMsg);
    }

    /// @notice A changed address must change the hash — the property the old
    ///         verifier's one-byte domain separator could not provide.
    function testAddressIsLoadBearing() public view {
        bytes32 other = adrs ^ bytes32(uint256(1) << 8); // touch the tree index
        assertTrue(harness.f(pkSeed, other, m1) != expectedF);
        assertTrue(harness.h(pkSeed, other, m1, m2) != expectedH);
    }

    /// @notice Marginal gas per `F`, and what it implies for a full signature.
    /// @dev §28 projected 288 gas as the intrinsic SHA-256 floor at 64 bytes.
    ///      `F` hashes 102 bytes (two compression blocks), so its floor is
    ///      higher; what matters is whether 2,174 of them fit the budget.
    function testMarginalHashCostAgainstTheSignatureBudget() public {
        uint256 a = gasleft();
        harness.fBatch(pkSeed, adrs, m1, 100);
        a = a - gasleft();

        uint256 b = gasleft();
        harness.fBatch(pkSeed, adrs, m1, 1100);
        b = b - gasleft();

        uint256 perCall = (b - a) / 1000;
        emit log_named_uint("marginal gas per F", perCall);

        // Hash-call counts measured natively by the reference implementation.
        uint256 perSignature = 2174 * perCall;
        emit log_named_uint("one signature (2,174 calls)", perSignature);
        emit log_named_uint("2-of-N (two signatures)", 2 * perSignature);
        emit log_named_uint("Ethereum block gas limit", 30_000_000);

        assertLt(
            2 * perSignature,
            30_000_000,
            "2-of-N verification must fit in a block"
        );
    }
}
