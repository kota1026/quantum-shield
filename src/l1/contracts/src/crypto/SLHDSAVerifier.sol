// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SLHDSA} from "./SLHDSA.sol";
import {ISPHINCSVerifier} from "../interfaces/ISPHINCSVerifier.sol";

/// @title SLHDSAVerifier - FIPS 205 SLH-DSA-SHA2-128s signature verification
/// @notice Verifies a post-quantum signature entirely on-chain, with no
///         elliptic-curve assumption anywhere in the path.
///
/// @dev Replaces `SPHINCSVerifier.sol`, which was not FIPS 205 and could not be
///      executed at all — 673.8M gas on a real signature, twenty-two blocks'
///      worth (`docs/core/STARK_AIR_GAP_ANALYSIS.md` §25). This is a rewrite.
///
///      Why it matters that this exists: §27 established that the Groth16 wrap
///      route, whatever its gas advantage, reduces the protocol's quantum
///      resistance to BN254's — an attacker with a quantum computer forges the
///      proof and never touches a SPHINCS+ signature. A verifier that is
///      post-quantum end to end is the only construction that delivers the
///      protocol's central claim.
///
///      Every layer is pinned against `src/crypto/slh-dsa-sha2`, which is in
///      turn pinned against the independent RustCrypto implementation.
///      Implements `ISPHINCSVerifier` so it can be dropped into `L1Vault`
///      through `setSPHINCSVerifier` with no change to the vault: the
///      threshold path already calls `verify(bytes32, bytes, bytes)` per
///      signature and counts the passes.
contract SLHDSAVerifier is ISPHINCSVerifier {
    using SLHDSA for bytes32;

    // FIPS 205 Table 2, SLH-DSA-SHA2-128s.
    uint256 internal constant N = 16;
    uint256 internal constant H = 63;
    uint256 internal constant D = 7;
    uint256 internal constant H_PRIME = 9;
    uint256 internal constant A = 12;
    uint256 internal constant K = 14;
    uint256 internal constant LG_W = 4;
    uint32 internal constant W = 16;
    uint256 internal constant MSG_DIGEST = 30;

    uint256 internal constant LEN1 = (8 * N) / LG_W;
    uint256 internal constant LEN2 = 3;
    uint256 internal constant LEN = LEN1 + LEN2;

    uint256 internal constant MD_BYTES = (K * A + 7) / 8;
    uint256 internal constant TREE_BYTES = (H - H / D + 7) / 8;
    uint256 internal constant LEAF_BYTES = (H / D + 7) / 8;

    uint256 internal constant PK_BYTES = 2 * N;
    uint256 internal constant SIG_FORS_BYTES = K * (1 + A) * N;
    uint256 internal constant SIG_HT_BYTES = (H + D * LEN) * N;
    uint256 internal constant SIG_BYTES = N + SIG_FORS_BYTES + SIG_HT_BYTES;

    // ADRS types.
    uint32 internal constant WOTS_HASH = 0;
    uint32 internal constant WOTS_PK = 1;
    uint32 internal constant TREE = 2;
    uint32 internal constant FORS_TREE = 3;
    uint32 internal constant FORS_ROOTS = 4;

    // =========================================================================
    // Public interface
    // =========================================================================

    /// @notice Signature length this parameter set expects.
    function getSignatureSize() external pure returns (uint256) {
        return SIG_BYTES;
    }

    /// @notice `PK.seed ‖ PK.root`, 32 bytes for category 1.
    function isValidPublicKeyFormat(bytes calldata publicKey) external pure returns (bool) {
        return publicKey.length == PK_BYTES;
    }

    /// @notice Identifier for a registered key.
    /// @dev SHA3-256 per CP-1, matching `ProverRegistry`'s `sphincsPubKeyHash`.
    function computePublicKeyHash(bytes calldata publicKey) external pure returns (bytes32) {
        return sha256(publicKey);
    }

    /// @notice `slh_verify(M, SIG, ctx, PK)` (FIPS 205 Algorithm 24), pure
    ///         variant with an empty context, over a 32-byte message.
    /// @param message The signed message — `L1Vault` signs
    ///        `SHA3-256(lockId ‖ stateRoot)`
    /// @param signature `R ‖ SIG_FORS ‖ SIG_HT`
    /// @param publicKey `PK.seed ‖ PK.root`
    /// @dev The `0x00 ‖ |ctx| ‖ ctx` prefix is what a conforming signer applies
    ///      by default; a verifier that skipped it would reject every signature
    ///      a standard library produces.
    function verify(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool) {
        if (signature.length != SIG_BYTES || publicKey.length != PK_BYTES) return false;
        return _verifyInternal(
            abi.encodePacked(bytes1(0x00), bytes1(0x00), message),
            signature,
            publicKey
        );
    }

    /// @notice As [`verify`], over a variable-length message.
    function verifyMessage(
        bytes calldata message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool) {
        if (signature.length != SIG_BYTES || publicKey.length != PK_BYTES) return false;
        return _verifyInternal(
            abi.encodePacked(bytes1(0x00), bytes1(0x00), message),
            signature,
            publicKey
        );
    }

    /// @notice Count how many of a batch verify.
    /// @dev Each signature costs ~2.7M gas (§30.2), so a caller must size the
    ///      batch against the block limit rather than assume it can pass an
    ///      arbitrary array.
    function verifyBatch(
        bytes32[] calldata messages,
        bytes[] calldata signatures,
        bytes[] calldata publicKeys
    ) external view returns (uint256 validCount) {
        if (messages.length != signatures.length || messages.length != publicKeys.length) {
            return 0;
        }
        for (uint256 i = 0; i < messages.length; i++) {
            if (signatures[i].length != SIG_BYTES || publicKeys[i].length != PK_BYTES) continue;
            if (
                _verifyInternal(
                    abi.encodePacked(bytes1(0x00), bytes1(0x00), messages[i]),
                    signatures[i],
                    publicKeys[i]
                )
            ) {
                validCount++;
            }
        }
    }

    /// @notice Verify and report the gas the attempt consumed.
    function verifyWithDetails(
        bytes32 message,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (VerificationResult memory result) {
        uint256 startGas = gasleft();
        if (signature.length != SIG_BYTES) {
            return VerificationResult(false, bytes32(0), 0, "invalid signature length");
        }
        if (publicKey.length != PK_BYTES) {
            return VerificationResult(false, bytes32(0), 0, "invalid public key length");
        }
        bool ok = _verifyInternal(
            abi.encodePacked(bytes1(0x00), bytes1(0x00), message),
            signature,
            publicKey
        );
        // `computedRoot` is the reconstructed `PK.root`, which equals the
        // registered one exactly when the signature is valid.
        result = VerificationResult(
            ok,
            ok ? bytes32(bytes16(publicKey[N:PK_BYTES])) : bytes32(0),
            startGas - gasleft(),
            ok ? "" : "verification failed"
        );
    }

    // =========================================================================
    // FIPS 205 Algorithm 20
    // =========================================================================

    function _verifyInternal(
        bytes memory prepared,
        bytes calldata sig,
        bytes calldata pk
    ) internal view returns (bool) {
        bytes16 r = bytes16(sig[0:N]);
        bytes16 pkSeed = bytes16(pk[0:N]);
        bytes16 pkRoot = bytes16(pk[N:PK_BYTES]);

        bytes memory digest = SLHDSA.hMsg(r, pkSeed, pkRoot, prepared);

        (uint64 idxTree, uint32 idxLeaf) = _splitDigest(digest);

        bytes32 adrs = bytes32(0);
        adrs = adrs.setTreeAddress(idxTree);
        adrs = adrs.setTypeAndClear(FORS_TREE);
        adrs = adrs.setKeyPairAddress(idxLeaf);

        bytes16 forsPk = _forsPkFromSig(
            sig[N:N + SIG_FORS_BYTES],
            digest,
            pkSeed,
            adrs
        );

        return _htVerify(forsPk, sig[N + SIG_FORS_BYTES:], pkSeed, idxTree, idxLeaf, pkRoot);
    }

    /// @notice Split `H_msg`'s output into the FORS message, the hypertree
    ///         index, and the leaf index.
    function _splitDigest(bytes memory digest)
        internal
        pure
        returns (uint64 idxTree, uint32 idxLeaf)
    {
        uint256 treeVal = 0;
        for (uint256 i = 0; i < TREE_BYTES; i++) {
            treeVal = (treeVal << 8) | uint8(digest[MD_BYTES + i]);
        }
        // Keep the low `h - h/d` bits.
        idxTree = uint64(treeVal & (type(uint64).max >> (64 - (H - H / D))));

        uint256 leafVal = 0;
        for (uint256 i = 0; i < LEAF_BYTES; i++) {
            leafVal = (leafVal << 8) | uint8(digest[MD_BYTES + TREE_BYTES + i]);
        }
        idxLeaf = uint32(leafVal & (type(uint32).max >> (32 - H_PRIME)));
    }

    // =========================================================================
    // FIPS 205 Algorithm 4
    // =========================================================================

    /// @notice `base_2b(X, b, outLen)` — the big-endian bit-packing FORS and
    ///         WOTS+ both use to turn bytes into digits.
    function baseB(
        bytes memory x,
        uint256 offset,
        uint256 b,
        uint256 outLen
    ) internal pure returns (uint32[] memory out) {
        out = new uint32[](outLen);
        uint256 pos = offset;
        uint256 bits = 0;
        uint256 total = 0;
        uint256 mask = (uint256(1) << b) - 1;
        for (uint256 i = 0; i < outLen; i++) {
            while (bits < b) {
                total = (total << 8) + uint8(x[pos]);
                pos++;
                bits += 8;
            }
            bits -= b;
            out[i] = uint32((total >> bits) & mask);
        }
    }

    // =========================================================================
    // FIPS 205 Algorithms 5 and 8
    // =========================================================================

    /// @notice `chain(X, i, s, PK.seed, ADRS)` — `steps` iterations of `F`.
    function _chain(
        bytes16 x,
        uint32 start,
        uint32 steps,
        bytes16 pkSeed,
        bytes32 adrs
    ) internal view returns (bytes16 tmp) {
        tmp = x;
        for (uint32 j = start; j < start + steps; j++) {
            adrs = adrs.setHashAddress(j);
            tmp = SLHDSA.f(pkSeed, adrs, tmp);
        }
    }

    /// @notice `wots_pkFromSig(sig, M, PK.seed, ADRS)`.
    /// @dev The checksum digits are what stop an attacker walking a chain
    ///      further than the signer did: raising any message digit lowers the
    ///      checksum, and the checksum chains cannot be walked backwards.
    function _wotsPkFromSig(
        bytes calldata sig,
        bytes16 msgDigest,
        bytes16 pkSeed,
        bytes32 adrs
    ) internal view returns (bytes16) {
        // `base_2b` with b = 4 over a 16-byte message is just its nibbles, so
        // the digits are read with a shift instead of built into an array.
        // This runs once per hypertree layer, seven times per signature.
        uint256 packed = uint256(uint128(msgDigest));

        uint256 csum = 0;
        for (uint256 i = 0; i < LEN1; i++) {
            csum += W - 1 - uint32((packed >> (4 * (LEN1 - 1 - i))) & 0xF);
        }
        // len2 * lg_w = 12 bits, left-aligned in two bytes, then read as three
        // nibbles from the top — the same values `base_2b` would produce.
        csum <<= (8 - ((LEN2 * LG_W) % 8)) % 8;

        bytes memory chained = new bytes(LEN * N);

        // Same reason as FORS: a `bytes calldata` slice copies each element
        // into memory before it is used, and this loop runs 35 times per
        // hypertree layer, seven layers deep.
        uint256 sigOffset;
        assembly {
            sigOffset := sig.offset
        }

        for (uint256 i = 0; i < LEN; i++) {
            uint32 digit = i < LEN1
                ? uint32((packed >> (4 * (LEN1 - 1 - i))) & 0xF)
                : uint32((csum >> (12 - 4 * (i - LEN1))) & 0xF);
            bytes32 chainAdrs = adrs.setChainAddress(uint32(i));
            bytes16 element;
            uint256 elementOffset = sigOffset + i * N;
            assembly {
                element := calldataload(elementOffset)
            }
            bytes16 end = _chain(element, digit, W - 1 - digit, pkSeed, chainAdrs);
            assembly {
                mstore(add(add(chained, 0x20), mul(i, N)), end)
            }
        }

        bytes32 pkAdrs = adrs.setTypeAndClear(WOTS_PK);
        pkAdrs = pkAdrs.setKeyPairAddress(adrs.keyPairAddress());
        return SLHDSA.tl(pkSeed, pkAdrs, chained);
    }

    // =========================================================================
    // FIPS 205 Algorithms 12 and 14
    // =========================================================================

    /// @notice `xmss_pkFromSig(idx, SIG_XMSS, M, PK.seed, ADRS)`.
    function _xmssPkFromSig(
        uint32 idx,
        bytes calldata sigXmss,
        bytes16 msgDigest,
        bytes16 pkSeed,
        bytes32 adrs
    ) internal view returns (bytes16 node) {
        adrs = adrs.setTypeAndClear(WOTS_HASH);
        adrs = adrs.setKeyPairAddress(idx);

        node = _wotsPkFromSig(sigXmss[0:LEN * N], msgDigest, pkSeed, adrs);

        adrs = adrs.setTypeAndClear(TREE);
        adrs = adrs.setTreeIndex(idx);

        uint256 wotsLen = LEN * N;
        uint256 authOffset;
        assembly {
            authOffset := add(sigXmss.offset, wotsLen)
        }

        for (uint256 k = 0; k < H_PRIME; k++) {
            adrs = adrs.setTreeHeight(uint32(k + 1));
            bytes16 sibling;
            uint256 sibOffset = authOffset + k * N;
            assembly {
                sibling := calldataload(sibOffset)
            }
            if ((idx >> k) & 1 == 0) {
                adrs = adrs.setTreeIndex(adrs.treeIndex() / 2);
                node = SLHDSA.h(pkSeed, adrs, node, sibling);
            } else {
                adrs = adrs.setTreeIndex((adrs.treeIndex() - 1) / 2);
                node = SLHDSA.h(pkSeed, adrs, sibling, node);
            }
        }
    }

    /// @notice `ht_verify(...)` — climb all `d` hypertree layers to `PK.root`.
    function _htVerify(
        bytes16 msgDigest,
        bytes calldata sigHt,
        bytes16 pkSeed,
        uint64 idxTree,
        uint32 idxLeaf,
        bytes16 pkRoot
    ) internal view returns (bool) {
        uint256 xmssSigLen = (H_PRIME + LEN) * N;

        bytes32 adrs = bytes32(0);
        adrs = adrs.setTreeAddress(idxTree);
        adrs = adrs.setLayerAddress(0);

        bytes16 node = _xmssPkFromSig(idxLeaf, sigHt[0:xmssSigLen], msgDigest, pkSeed, adrs);

        for (uint256 j = 1; j < D; j++) {
            idxLeaf = uint32(idxTree % (uint64(1) << H_PRIME));
            idxTree >>= H_PRIME;
            adrs = adrs.setLayerAddress(uint32(j));
            adrs = adrs.setTreeAddress(idxTree);
            node = _xmssPkFromSig(
                idxLeaf,
                sigHt[j * xmssSigLen:(j + 1) * xmssSigLen],
                node,
                pkSeed,
                adrs
            );
        }

        return node == pkRoot;
    }

    // =========================================================================
    // FIPS 205 Algorithm 17
    // =========================================================================

    /// @notice `fors_pkFromSig(SIG_FORS, md, PK.seed, ADRS)`.
    function _forsPkFromSig(
        bytes calldata sigFors,
        bytes memory digest,
        bytes16 pkSeed,
        bytes32 adrs
    ) internal view returns (bytes16) {
        // `base_2b` with b = 12 over the digest's first 21 bytes. Those fit in
        // one word, so the indices are read with a shift rather than built
        // into an array.
        uint256 mdWord;
        assembly {
            mdWord := mload(add(digest, 0x20))
        }
        uint256 elementLen = (A + 1) * N;
        bytes memory roots = new bytes(K * N);

        // `.offset` is only reachable from assembly.
        uint256 sigOffset;
        assembly {
            sigOffset := sigFors.offset
        }

        for (uint256 i = 0; i < K; i++) {
            uint32 idx = uint32((mdWord >> (256 - A * (i + 1))) & ((1 << A) - 1));
            uint256 base = i * elementLen;

            adrs = adrs.setTreeHeight(0);
            adrs = adrs.setTreeIndex(uint32(i * (1 << A)) + idx);

            // Read the signature straight from calldata. A `bytes calldata`
            // slice would copy each 16-byte element into memory first, and at
            // 182 elements that dominated the phase: 1,547 gas per hash call
            // against a 568 floor.
            bytes16 leaf;
            assembly {
                leaf := calldataload(add(sigOffset, base))
            }
            bytes16 node = SLHDSA.f(pkSeed, adrs, leaf);

            for (uint256 j = 0; j < A; j++) {
                bytes16 sibling;
                uint256 sibOffset = sigOffset + base + N + j * N;
                assembly {
                    sibling := calldataload(sibOffset)
                }
                adrs = adrs.setTreeHeight(uint32(j + 1));
                if ((idx >> j) & 1 == 0) {
                    adrs = adrs.setTreeIndex(adrs.treeIndex() / 2);
                    node = SLHDSA.h(pkSeed, adrs, node, sibling);
                } else {
                    adrs = adrs.setTreeIndex((adrs.treeIndex() - 1) / 2);
                    node = SLHDSA.h(pkSeed, adrs, sibling, node);
                }
            }
            assembly {
                mstore(add(add(roots, 0x20), mul(i, N)), node)
            }
        }

        bytes32 pkAdrs = adrs.setTypeAndClear(FORS_ROOTS);
        pkAdrs = pkAdrs.setKeyPairAddress(adrs.keyPairAddress());
        return SLHDSA.tl(pkSeed, pkAdrs, roots);
    }
}
