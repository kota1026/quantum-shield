// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SLHDSA - FIPS 205 SLH-DSA-SHA2-128s primitives
/// @notice The hash constructions and address encoding of FIPS 205's SHA2
///         parameter set, security category 1.
///
/// @dev Replaces `SPHINCSVerifier.sol`, which was not FIPS 205: it substituted
///      a one-byte domain separator for the 22-byte compressed address and
///      produced 32-byte outputs where the standard specifies 16, and cost
///      673.8M gas — twenty-two blocks' worth — on a real signature
///      (`docs/core/STARK_AIR_GAP_ANALYSIS.md` §25). This is a rewrite, not an
///      optimization.
///
///      SHA2 rather than SHAKE because the EVM has a SHA-256 precompile and
///      none for SHAKE256, which is what lets an on-chain verifier stay
///      strictly conformant instead of substituting KECCAK256 (§28). Every
///      function here is pinned against `src/crypto/slh-dsa-sha2`, which is in
///      turn pinned against the independent RustCrypto implementation.
library SLHDSA {
    /// @notice Hash output and key element size (FIPS 205 Table 2, n).
    uint256 internal constant N = 16;
    /// @notice Message digest length (m).
    uint256 internal constant M = 30;
    /// @notice Compressed address length, FIPS 205 §11.2.
    uint256 internal constant ADRS_C_LEN = 22;
    /// @notice Zero padding between `PK.seed` and the address: 64 - n.
    uint256 internal constant PAD_LEN = 48;

    error Sha256Failed();

    // =========================================================================
    // Address fields
    //
    // The 32-byte layout: layer(0..4) tree(4..16) type(16..20)
    // keyPair(20..24) chain-or-height(24..28) hash-or-index(28..32).
    // Held as a `bytes32` and edited with masks, so no memory is touched.
    // =========================================================================

    uint256 private constant MASK_LAYER = uint256(0xFFFFFFFF) << 224;
    uint256 private constant MASK_TREE_HI = uint256(0xFFFFFFFF) << 192;
    uint256 private constant MASK_TREE = uint256(0xFFFFFFFFFFFFFFFF) << 128;
    uint256 private constant MASK_TYPE = uint256(0xFFFFFFFF) << 96;
    uint256 private constant MASK_KEYPAIR = uint256(0xFFFFFFFF) << 64;
    uint256 private constant MASK_CHAIN = uint256(0xFFFFFFFF) << 32;
    uint256 private constant MASK_HASH = uint256(0xFFFFFFFF);
    /// @notice `type` and everything after it — cleared together per FIPS 205.
    uint256 private constant MASK_TAIL = MASK_KEYPAIR | MASK_CHAIN | MASK_HASH;

    function setLayerAddress(bytes32 adrs, uint32 layer) internal pure returns (bytes32) {
        return bytes32((uint256(adrs) & ~MASK_LAYER) | (uint256(layer) << 224));
    }

    /// @dev Writes the low 8 bytes of the 12-byte field and clears the high 4,
    ///      which is the whole field for every parameter set in FIPS 205.
    function setTreeAddress(bytes32 adrs, uint64 tree) internal pure returns (bytes32) {
        uint256 cleared = uint256(adrs) & ~(MASK_TREE | MASK_TREE_HI);
        return bytes32(cleared | (uint256(tree) << 128));
    }

    /// @notice Set the type and zero the three words after it (FIPS 205).
    function setTypeAndClear(bytes32 adrs, uint32 adrsType) internal pure returns (bytes32) {
        uint256 cleared = uint256(adrs) & ~(MASK_TYPE | MASK_TAIL);
        return bytes32(cleared | (uint256(adrsType) << 96));
    }

    function setKeyPairAddress(bytes32 adrs, uint32 keyPair) internal pure returns (bytes32) {
        return bytes32((uint256(adrs) & ~MASK_KEYPAIR) | (uint256(keyPair) << 64));
    }

    function keyPairAddress(bytes32 adrs) internal pure returns (uint32) {
        return uint32((uint256(adrs) & MASK_KEYPAIR) >> 64);
    }

    /// @notice `setChainAddress` and `setTreeHeight` share a field.
    function setChainAddress(bytes32 adrs, uint32 chain) internal pure returns (bytes32) {
        return bytes32((uint256(adrs) & ~MASK_CHAIN) | (uint256(chain) << 32));
    }

    function setTreeHeight(bytes32 adrs, uint32 height) internal pure returns (bytes32) {
        return setChainAddress(adrs, height);
    }

    /// @notice `setHashAddress` and `setTreeIndex` share a field.
    function setHashAddress(bytes32 adrs, uint32 hash_) internal pure returns (bytes32) {
        return bytes32((uint256(adrs) & ~MASK_HASH) | uint256(hash_));
    }

    function setTreeIndex(bytes32 adrs, uint32 index) internal pure returns (bytes32) {
        return setHashAddress(adrs, index);
    }

    function treeIndex(bytes32 adrs) internal pure returns (uint32) {
        return uint32(uint256(adrs) & MASK_HASH);
    }

    // =========================================================================
    // Address compression
    // =========================================================================

    /// @notice `ADRS^c` — the 22 bytes the SHA2 parameter sets hash.
    /// @param adrs The full 32-byte address
    /// @return c layer(1) ‖ tree(8) ‖ type(1) ‖ trailing(12)
    /// @dev The dropped bytes are the high halves of fields this parameter set
    ///      never fills. Dropping the address entirely — as the old verifier
    ///      did — discards the layer/tree/keypair/chain position that makes a
    ///      hash call unique to its place in the hypertree.
    function compressAddress(bytes32 adrs) internal pure returns (bytes memory c) {
        c = new bytes(ADRS_C_LEN);
        assembly {
            let ptr := add(c, 0x20)
            // layer address: byte 3 of the 4-byte big-endian field.
            mstore8(ptr, byte(3, adrs))
            // tree address: bytes 8..16.
            for { let i := 0 } lt(i, 8) { i := add(i, 1) } {
                mstore8(add(ptr, add(1, i)), byte(add(8, i), adrs))
            }
            // type: byte 19.
            mstore8(add(ptr, 9), byte(19, adrs))
            // key pair / chain-or-height / hash-or-index: bytes 20..32.
            for { let i := 0 } lt(i, 12) { i := add(i, 1) } {
                mstore8(add(ptr, add(10, i)), byte(add(20, i), adrs))
            }
        }
    }

    // =========================================================================
    // Hash constructions
    // =========================================================================

    /// @notice Offset where the message bytes start: 16 + 48 + 22.
    uint256 internal constant MSG_OFFSET = 86;

    /// @notice Lay `PK.seed ‖ toByte(0, 48) ‖ ADRS^c` into scratch memory at
    ///         `ptr`.
    /// @dev Written straight into memory rather than assembled with
    ///      `abi.encodePacked`, which allocated three buffers per call. This
    ///      runs thousands of times per signature, so its constant factor is
    ///      the whole budget: the allocating version cost 12,986 gas against an
    ///      intrinsic floor of 288 (§28.1).
    function _layoutPrefix(uint256 ptr, bytes16 pkSeed, bytes32 adrs) private pure {
        assembly {
            // `pkSeed` is left-aligned in its word, so this writes 16 seed
            // bytes followed by 16 zeros — the first third of the padding.
            mstore(ptr, pkSeed)
            mstore(add(ptr, 32), 0)

            // ADRS^c built with shifts rather than a byte loop:
            //   layer(1) ‖ tree(8) ‖ type(1) ‖ trailing(12), left-aligned.
            let treeAddr := and(shr(128, adrs), 0xFFFFFFFFFFFFFFFF)
            let trailing := and(adrs, 0xFFFFFFFFFFFFFFFFFFFFFFFF)
            mstore(
                add(ptr, 64),
                or(
                    or(shl(248, byte(3, adrs)), shl(184, treeAddr)),
                    or(shl(176, byte(19, adrs)), shl(80, trailing))
                )
            )
        }
    }

    /// @notice `F(PK.seed, ADRS, M_1)`
    ///         `= Trunc_n(SHA-256(PK.seed ‖ toByte(0, 48) ‖ ADRS^c ‖ M_1))`
    function f(bytes16 pkSeed, bytes32 adrs, bytes16 m1) internal view returns (bytes16 out) {
        uint256 ptr;
        assembly {
            ptr := mload(0x40)
        }
        _layoutPrefix(ptr, pkSeed, adrs);
        assembly {
            mstore(add(ptr, MSG_OFFSET), m1)
            if iszero(staticcall(gas(), 0x02, ptr, add(MSG_OFFSET, 16), 0x00, 0x20)) {
                mstore(0x00, 0x8d0e2d3900000000000000000000000000000000000000000000000000000000)
                revert(0x00, 0x04)
            }
            out := mload(0x00)
        }
    }

    /// @notice `H(PK.seed, ADRS, M_1 ‖ M_2)` — same construction, two messages.
    function h(
        bytes16 pkSeed,
        bytes32 adrs,
        bytes16 m1,
        bytes16 m2
    ) internal view returns (bytes16 out) {
        uint256 ptr;
        assembly {
            ptr := mload(0x40)
        }
        _layoutPrefix(ptr, pkSeed, adrs);
        assembly {
            mstore(add(ptr, MSG_OFFSET), m1)
            mstore(add(ptr, add(MSG_OFFSET, 16)), m2)
            if iszero(staticcall(gas(), 0x02, ptr, add(MSG_OFFSET, 32), 0x00, 0x20)) {
                mstore(0x00, 0x8d0e2d3900000000000000000000000000000000000000000000000000000000)
                revert(0x00, 0x04)
            }
            out := mload(0x00)
        }
    }

    /// @notice `T_l(PK.seed, ADRS, M_l)` — `l` concatenated n-byte messages.
    function tl(
        bytes16 pkSeed,
        bytes32 adrs,
        bytes memory messages
    ) internal view returns (bytes16 out) {
        uint256 ptr;
        assembly {
            ptr := mload(0x40)
        }
        _layoutPrefix(ptr, pkSeed, adrs);
        assembly {
            let len := mload(messages)
            let src := add(messages, 0x20)
            let dst := add(ptr, MSG_OFFSET)
            for { let i := 0 } lt(i, len) { i := add(i, 32) } {
                mstore(add(dst, i), mload(add(src, i)))
            }
            if iszero(staticcall(gas(), 0x02, ptr, add(MSG_OFFSET, len), 0x00, 0x20)) {
                mstore(0x00, 0x8d0e2d3900000000000000000000000000000000000000000000000000000000)
                revert(0x00, 0x04)
            }
            out := mload(0x00)
        }
    }

    /// @notice `MGF1-SHA-256(seed, outLen)` (RFC 8017).
    function mgf1(bytes memory seed, uint256 outLen) internal view returns (bytes memory out) {
        out = new bytes(outLen);
        uint256 written = 0;
        uint32 counter = 0;
        while (written < outLen) {
            bytes32 block_ = _sha256(abi.encodePacked(seed, counter));
            uint256 take = outLen - written;
            if (take > 32) take = 32;
            for (uint256 i = 0; i < take; i++) {
                out[written + i] = block_[i];
            }
            written += take;
            counter++;
        }
    }

    /// @notice `H_msg(R, PK.seed, PK.root, M)`
    ///         `= MGF1-SHA-256(R ‖ PK.seed ‖ SHA-256(R ‖ PK.seed ‖ PK.root ‖ M), m)`
    function hMsg(
        bytes16 r,
        bytes16 pkSeed,
        bytes16 pkRoot,
        bytes memory message
    ) internal view returns (bytes memory) {
        bytes32 inner = _sha256(abi.encodePacked(r, pkSeed, pkRoot, message));
        return mgf1(abi.encodePacked(r, pkSeed, inner), M);
    }

    // =========================================================================
    // Primitive
    // =========================================================================

    /// @notice SHA-256 via the precompile at address 0x02.
    /// @dev Called directly rather than through Solidity's `sha256()` so the
    ///      cost is the precompile's, not an extra memory copy's — the
    ///      difference is 288 vs 714 gas per call at 64 bytes (§28.1), and this
    ///      verifier makes thousands of them.
    function _sha256(bytes memory input) private view returns (bytes32 digest) {
        assembly {
            let ok := staticcall(
                gas(),
                0x02,
                add(input, 0x20),
                mload(input),
                0x00,
                0x20
            )
            if iszero(ok) {
                mstore(0x00, 0x8d0e2d3900000000000000000000000000000000000000000000000000000000)
                revert(0x00, 0x04)
            }
            digest := mload(0x00)
        }
    }
}
