// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {SLHDSAVerifier} from "../src/crypto/SLHDSAVerifier.sol";
import {SLHDSA} from "../src/crypto/SLHDSA.sol";
import {ISPHINCSVerifier} from "../src/interfaces/ISPHINCSVerifier.sol";

/// @notice Exposes the verifier's internals so each FIPS 205 algorithm can be
///         compared with the reference separately.
contract VerifierHarness is SLHDSAVerifier {
    function baseBPublic(bytes calldata x, uint256 offset, uint256 b, uint256 outLen)
        external
        pure
        returns (uint32[] memory)
    {
        return baseB(x, offset, b, outLen);
    }

    function chainPublic(
        bytes16 x,
        uint32 start,
        uint32 steps,
        bytes16 pkSeed,
        bytes32 adrs
    ) external view returns (bytes16) {
        return _chain(x, start, steps, pkSeed, adrs);
    }

    function wotsPublic(
        bytes calldata sig,
        bytes16 msgDigest,
        bytes16 pkSeed,
        bytes32 adrs
    ) external view returns (bytes16) {
        return _wotsPkFromSig(sig, msgDigest, pkSeed, adrs);
    }

    function forsPublic(
        bytes calldata sigFors,
        bytes calldata digest,
        bytes16 pkSeed,
        bytes32 adrs
    ) external view returns (bytes16) {
        return _forsPkFromSig(sigFors, digest, pkSeed, adrs);
    }

    function xmssPublic(
        uint32 idx,
        bytes calldata sigXmss,
        bytes16 msgDigest,
        bytes16 pkSeed,
        bytes32 adrs
    ) external view returns (bytes16) {
        return _xmssPkFromSig(idx, sigXmss, msgDigest, pkSeed, adrs);
    }

    /// @notice Gas of each phase of one verification, measured inside a single
    ///         call so calldata and dispatch are paid once.
    /// @dev §30.2 found the cost is dominated by what surrounds the hashing,
    ///      not the hashing — but "the surroundings" is not an optimization
    ///      target until it is broken down.
    function gasBreakdown(bytes calldata sig, bytes calldata pk, bytes calldata message)
        external
        view
        returns (uint256 hMsgGas, uint256 forsGas, uint256 htGas)
    {
        bytes memory prepared = abi.encodePacked(bytes1(0x00), bytes1(0x00), message);

        uint256 g = gasleft();
        bytes memory digest = SLHDSA.hMsg(
            bytes16(sig[0:16]),
            bytes16(pk[0:16]),
            bytes16(pk[16:32]),
            prepared
        );
        hMsgGas = g - gasleft();

        (uint64 idxTree, uint32 idxLeaf) = _splitDigest(digest);

        bytes32 adrs = bytes32(0);
        adrs = SLHDSA.setTreeAddress(adrs, idxTree);
        adrs = SLHDSA.setTypeAndClear(adrs, FORS_TREE);
        adrs = SLHDSA.setKeyPairAddress(adrs, idxLeaf);

        g = gasleft();
        bytes16 forsPk = _forsPkFromSig(sig[16:16 + 14 * 13 * 16], digest, bytes16(pk[0:16]), adrs);
        forsGas = g - gasleft();

        g = gasleft();
        _htVerify(
            forsPk,
            sig[16 + 14 * 13 * 16:],
            bytes16(pk[0:16]),
            idxTree,
            idxLeaf,
            bytes16(pk[16:32])
        );
        htGas = g - gasleft();
    }

    function splitDigestPublic(bytes calldata digest)
        external
        pure
        returns (uint64, uint32)
    {
        return _splitDigest(digest);
    }
}

/// @title SLHDSAVerifierTest - layer-by-layer against the FIPS 205 reference
/// @notice Vectors come from `src/crypto/slh-dsa-sha2`'s `emit_layer_vectors`,
///         which is pinned against the independent RustCrypto implementation.
///         Each algorithm is checked on its own so a failure names the layer
///         that broke rather than just reporting an invalid signature.
contract SLHDSAVerifierTest is Test {
    VerifierHarness internal v;

    bytes internal base2bInput;
    uint32[] internal base2bDigits;

    bytes16 internal chainPkSeed;
    bytes32 internal chainAdrs;
    bytes16 internal chainInput;
    uint32 internal chainStart;
    uint32 internal chainSteps;
    bytes16 internal chainOut;

    bytes internal message;
    bytes internal pk;
    bytes internal sig;
    bytes internal digest;
    uint64 internal idxTree;
    uint32 internal idxLeaf;

    bytes32 internal forsAdrs;
    bytes16 internal forsPk;
    bytes32 internal wotsAdrs;
    bytes16 internal wotsPk;
    bytes32 internal xmssAdrs;
    bytes16 internal xmssRoot;
    bytes16 internal pkRoot;

    function _hex(string memory json, string memory key) internal pure returns (bytes memory) {
        return vm.parseBytes(string.concat("0x", abi.decode(vm.parseJson(json, key), (string))));
    }

    function setUp() public {
        v = new VerifierHarness();
        string memory j = vm.readFile("./test/vectors/slhdsa_sha2_layers.json");

        base2bInput = _hex(j, ".base2bInput");
        uint256[] memory raw = abi.decode(vm.parseJson(j, ".base2bDigits"), (uint256[]));
        for (uint256 i = 0; i < raw.length; i++) {
            base2bDigits.push(uint32(raw[i]));
        }

        chainPkSeed = bytes16(_hex(j, ".chainPkSeed"));
        chainAdrs = bytes32(_hex(j, ".chainAdrs"));
        chainInput = bytes16(_hex(j, ".chainInput"));
        chainStart = uint32(abi.decode(vm.parseJson(j, ".chainStart"), (uint256)));
        chainSteps = uint32(abi.decode(vm.parseJson(j, ".chainSteps"), (uint256)));
        chainOut = bytes16(_hex(j, ".chainOut"));

        message = _hex(j, ".message");
        pk = _hex(j, ".pk");
        sig = _hex(j, ".sig");
        digest = _hex(j, ".digest");
        idxTree = uint64(abi.decode(vm.parseJson(j, ".idxTree"), (uint256)));
        idxLeaf = uint32(abi.decode(vm.parseJson(j, ".idxLeaf"), (uint256)));

        forsAdrs = bytes32(_hex(j, ".forsAdrs"));
        forsPk = bytes16(_hex(j, ".forsPk"));
        wotsAdrs = bytes32(_hex(j, ".wotsAdrs"));
        wotsPk = bytes16(_hex(j, ".wotsPk"));
        xmssAdrs = bytes32(_hex(j, ".xmssAdrs"));
        xmssRoot = bytes16(_hex(j, ".xmssRoot"));
        pkRoot = bytes16(_hex(j, ".pkRoot"));
    }

    /// @notice Algorithm 4. Shared by FORS and WOTS+, and easy to get subtly
    ///         wrong at a byte boundary.
    function testBaseBMatchesReference() public view {
        uint32[] memory got = v.baseBPublic(base2bInput, 0, 12, 14);
        assertEq(got.length, base2bDigits.length);
        for (uint256 i = 0; i < got.length; i++) {
            assertEq(got[i], base2bDigits[i], "digit mismatch");
        }
    }

    /// @notice Algorithm 5, with a non-zero start so the hash address is
    ///         actually exercised.
    function testChainMatchesReference() public view {
        assertEq(
            v.chainPublic(chainInput, chainStart, chainSteps, chainPkSeed, chainAdrs),
            chainOut
        );
    }

    /// @notice Splitting `H_msg`'s output into FORS message, tree index and
    ///         leaf index — a masking step with no cryptography to hide behind.
    function testDigestSplitMatchesReference() public view {
        (uint64 gotTree, uint32 gotLeaf) = v.splitDigestPublic(digest);
        assertEq(gotTree, idxTree, "hypertree index");
        assertEq(gotLeaf, idxLeaf, "leaf index");
    }

    /// @notice Algorithm 17, on a real signature.
    function testForsPkFromSigMatchesReference() public view {
        bytes memory sigFors = new bytes(14 * 13 * 16);
        for (uint256 i = 0; i < sigFors.length; i++) {
            sigFors[i] = sig[16 + i];
        }
        assertEq(
            v.forsPublic(sigFors, digest, bytes16(_slice(pk, 0, 16)), forsAdrs),
            forsPk
        );
    }

    /// @notice Algorithm 8, on the bottom hypertree layer of a real signature.
    function testWotsPkFromSigMatchesReference() public view {
        uint256 forsLen = 14 * 13 * 16;
        bytes memory wotsSig = _slice(sig, 16 + forsLen, 35 * 16);
        assertEq(
            v.wotsPublic(wotsSig, forsPk, bytes16(_slice(pk, 0, 16)), wotsAdrs),
            wotsPk
        );
    }

    /// @notice Algorithm 12 — WOTS+ reconstruction plus the XMSS auth path.
    function testXmssPkFromSigMatchesReference() public view {
        uint256 forsLen = 14 * 13 * 16;
        uint256 xmssLen = (9 + 35) * 16;
        bytes memory sigXmss = _slice(sig, 16 + forsLen, xmssLen);
        assertEq(
            v.xmssPublic(idxLeaf, sigXmss, forsPk, bytes16(_slice(pk, 0, 16)), xmssAdrs),
            xmssRoot
        );
    }

    // =========================================================================
    // End to end
    // =========================================================================

    /// @notice The whole point: a genuine FIPS 205 signature must verify.
    function testAcceptsAGenuineSignature() public view {
        assertTrue(v.verifyMessage(message, sig, pk), "a valid signature must verify");
    }

    /// @notice Every tampering class must be rejected.
    function testRejectsTamperedInputs() public view {
        assertFalse(v.verifyMessage(hex"00", sig, pk), "wrong message");

        bytes memory bad = _copy(sig);
        bad[0] ^= 0x01;
        assertFalse(v.verifyMessage(message, bad, pk), "tampered randomizer R");

        bad = _copy(sig);
        bad[16 + 5] ^= 0x01;
        assertFalse(v.verifyMessage(message, bad, pk), "tampered FORS signature");

        bad = _copy(sig);
        bad[bad.length - 1] ^= 0x01;
        assertFalse(v.verifyMessage(message, bad, pk), "tampered hypertree auth path");

        bytes memory badPk = _copy(pk);
        badPk[badPk.length - 1] ^= 0x01;
        assertFalse(v.verifyMessage(message, sig, badPk), "tampered public key root");
    }

    /// @notice Wrong lengths must be rejected rather than read out of bounds.
    function testRejectsWrongLengths() public view {
        assertFalse(v.verifyMessage(message, hex"00", pk));
        assertFalse(v.verifyMessage(message, sig, hex"00"));
        assertEq(v.getSignatureSize(), 7856);
    }

    /// @notice Where the gas actually goes, so optimization targets the right
    ///         thing rather than the plausible thing.
    function testGasBreakdown() public {
        (uint256 hMsgGas, uint256 forsGas, uint256 htGas) =
            v.gasBreakdown(sig, pk, message);

        emit log_named_uint("H_msg", hMsgGas);
        emit log_named_uint("FORS (182 hash calls)", forsGas);
        emit log_named_uint("hypertree (~1,990 hash calls)", htGas);
        emit log_named_uint("per hash call, FORS", forsGas / 182);
        emit log_named_uint("per hash call, hypertree", htGas / 1990);

        assertGt(htGas, forsGas, "the hypertree dominates");
    }

    /// @notice The measured cost of one verification, against a block.
    function testVerificationGas() public {
        uint256 before = gasleft();
        v.verifyMessage(message, sig, pk);
        uint256 used = before - gasleft();

        emit log_named_uint("one signature verification gas", used);
        emit log_named_uint("2-of-N projection", 2 * used);
        emit log_named_uint("percent of a 30M block (2-of-N)", (2 * used * 100) / 30_000_000);

        assertLt(2 * used, 30_000_000, "2-of-N must fit in a block");
    }

    // =========================================================================

    /// @notice The drop-in check: `L1Vault` calls `ISPHINCSVerifier.verify`
    ///         with a `bytes32` message, so the new verifier must satisfy that
    ///         shape without any change to the vault.
    function testSatisfiesTheVaultsInterface() public view {
        ISPHINCSVerifier iface = ISPHINCSVerifier(address(v));

        assertEq(iface.getSignatureSize(), 7856);
        assertTrue(iface.isValidPublicKeyFormat(pk));
        assertFalse(iface.isValidPublicKeyFormat(hex"00"));

        // The vault signs `SHA3-256(lockId || stateRoot)`; here the fixture's
        // own message stands in for that 32-byte digest.
        bytes32 digestMessage = bytes32(_slice(message, 0, message.length < 32 ? message.length : 32));
        // A signature over a different message must not verify.
        assertFalse(iface.verify(digestMessage, sig, pk));
    }

    /// @notice `verifyWithDetails` reports the cost, which is what a caller
    ///         needs to size a threshold batch against the block limit.
    function testVerifyWithDetailsReportsGas() public view {
        ISPHINCSVerifier.VerificationResult memory res =
            ISPHINCSVerifier(address(v)).verifyWithDetails(bytes32(0), sig, pk);
        assertFalse(res.valid, "a signature over another message must fail");
        assertGt(res.gasUsed, 0, "gas must be reported");

        res = ISPHINCSVerifier(address(v)).verifyWithDetails(bytes32(0), hex"00", pk);
        assertEq(res.errorReason, "invalid signature length");
    }

    function _slice(bytes memory data, uint256 start, uint256 len)
        internal
        pure
        returns (bytes memory out)
    {
        out = new bytes(len);
        for (uint256 i = 0; i < len; i++) {
            out[i] = data[start + i];
        }
    }

    function _copy(bytes memory data) internal pure returns (bytes memory) {
        return _slice(data, 0, data.length);
    }
}
