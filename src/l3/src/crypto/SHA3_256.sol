// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SHA3_256 - FIPS 202 Compliant SHA3-256 Implementation (Optimized)
/// @notice Pure Solidity implementation of SHA3-256 for Quantum Shield
/// @dev Implements Keccak-f[1600] with SHA3 padding (domain separation byte 0x06)
///
/// IMPORTANT: keccak256 ≠ SHA3-256
/// - keccak256: Uses padding 0x01 (Ethereum standard)
/// - SHA3-256: Uses padding 0x06 (FIPS 202 standard)
///
/// This library provides FIPS 202 compliant SHA3-256 required for:
/// - NIST certification compliance
/// - Interoperability with external systems using standard SHA3
/// - QUANTUM_SHIELD_UNIFIED_SPEC_v2.0 compliance
///
/// Optimizations (Day 11 - IMPL-010):
/// - Round constants converted to static array (eliminates 24 if/else branches)
/// - Rho offsets converted to static array (eliminates 25 if/else branches)
/// - Expected gas reduction: ~30-40%
///
/// Architecture:
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │                    SHA3-256 (FIPS 202)                              │
/// ├─────────────────────────────────────────────────────────────────────┤
/// │  Input → Pad (0x06) → Absorb → Keccak-f[1600] x 24 → Squeeze       │
/// │                                                                     │
/// │  Rate: 1088 bits (136 bytes)                                       │
/// │  Capacity: 512 bits                                                │
/// │  Output: 256 bits                                                  │
/// └─────────────────────────────────────────────────────────────────────┘
library SHA3_256 {
    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice SHA3-256 rate in bytes (1088 bits / 8)
    uint256 internal constant RATE = 136;

    /// @notice SHA3 domain separation byte (0x06 for SHA3, 0x01 for Keccak)
    uint8 internal constant SHA3_DOMAIN = 0x06;

    /// @notice Number of Keccak-f rounds
    uint256 internal constant ROUNDS = 24;

    // =========================================================================
    // Optimized Static Arrays (IMPL-010)
    // =========================================================================

    /// @notice Get round constant for Keccak-f[1600] from static array
    /// @dev Optimization: Replaced 24 if/else branches with array lookup
    /// @param round Round number (0-23)
    /// @return Round constant value
    function _getRoundConstant(uint256 round) internal pure returns (uint64) {
        // Static array stored in memory for each call
        // This is more gas-efficient than if/else chain
        uint64[24] memory RC = [
            uint64(0x0000000000000001),
            uint64(0x0000000000008082),
            uint64(0x800000000000808a),
            uint64(0x8000000080008000),
            uint64(0x000000000000808b),
            uint64(0x0000000080000001),
            uint64(0x8000000080008081),
            uint64(0x8000000000008009),
            uint64(0x000000000000008a),
            uint64(0x0000000000000088),
            uint64(0x0000000080008009),
            uint64(0x000000008000000a),
            uint64(0x000000008000808b),
            uint64(0x800000000000008b),
            uint64(0x8000000000008089),
            uint64(0x8000000000008003),
            uint64(0x8000000000008002),
            uint64(0x8000000000000080),
            uint64(0x000000000000800a),
            uint64(0x800000008000000a),
            uint64(0x8000000080008081),
            uint64(0x8000000000008080),
            uint64(0x0000000080000001),
            uint64(0x8000000080008008)
        ];
        return RC[round];
    }

    /// @notice Get rho offset for Keccak-f[1600] from static array
    /// @dev Optimization: Replaced 25 if/else branches with array lookup
    /// @param i Lane index (0-24)
    /// @return Rotation offset
    function _getRhoOffset(uint256 i) internal pure returns (uint256) {
        // Static array stored in memory for each call
        // Eliminates condition checking overhead
        uint256[25] memory RHO = [
            uint256(0), uint256(1), uint256(62), uint256(28), uint256(27),
            uint256(36), uint256(44), uint256(6), uint256(55), uint256(20),
            uint256(3), uint256(10), uint256(43), uint256(25), uint256(39),
            uint256(41), uint256(45), uint256(15), uint256(21), uint256(8),
            uint256(18), uint256(2), uint256(61), uint256(56), uint256(14)
        ];
        return RHO[i];
    }

    // =========================================================================
    // Main Function
    // =========================================================================

    /// @notice Compute SHA3-256 hash of input data
    /// @param data Input bytes to hash
    /// @return digest 32-byte SHA3-256 hash
    function hash(bytes memory data) internal pure returns (bytes32 digest) {
        // Initialize state (5x5 array of 64-bit lanes = 1600 bits)
        uint64[25] memory state;

        // Absorb phase
        uint256 dataLen = data.length;
        uint256 blockCount = (dataLen + 1) / RATE + 1; // +1 for padding
        
        for (uint256 blockIdx = 0; blockIdx < blockCount; blockIdx++) {
            // XOR block into state
            uint256 offset = blockIdx * RATE;
            
            for (uint256 i = 0; i < 17; i++) { // 17 lanes = 136 bytes = RATE
                uint64 lane = 0;
                
                for (uint256 j = 0; j < 8; j++) {
                    uint256 byteIndex = offset + i * 8 + j;
                    uint8 b;
                    
                    if (byteIndex < dataLen) {
                        b = uint8(data[byteIndex]);
                    } else if (byteIndex == dataLen) {
                        // First padding byte: SHA3 domain separator
                        b = SHA3_DOMAIN;
                    } else if (byteIndex == offset + RATE - 1) {
                        // Last byte of block: set high bit
                        b = 0x80;
                    } else {
                        b = 0;
                    }
                    
                    lane |= uint64(b) << (j * 8);
                }
                
                state[i] ^= lane;
            }
            
            // Apply Keccak-f[1600]
            state = keccakF(state);
        }

        // Squeeze phase (only need 256 bits = 4 lanes)
        digest = bytes32(
            (uint256(state[0])) |
            (uint256(state[1]) << 64) |
            (uint256(state[2]) << 128) |
            (uint256(state[3]) << 192)
        );
        
        // Convert to big-endian
        digest = _reverseBytes32(digest);
    }

    /// @notice Compute SHA3-256 hash of two concatenated bytes32 values
    /// @dev Optimized version for common use case in Merkle trees
    /// @param a First 32 bytes
    /// @param b Second 32 bytes
    /// @return digest SHA3-256 hash
    function hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32 digest) {
        bytes memory data = abi.encodePacked(a, b);
        return hash(data);
    }

    /// @notice Compute SHA3-256 hash with domain separation
    /// @param domain Domain separator
    /// @param data Data to hash
    /// @return digest SHA3-256 hash
    function hashWithDomain(bytes32 domain, bytes memory data) internal pure returns (bytes32 digest) {
        bytes memory combined = abi.encodePacked(domain, data);
        return hash(combined);
    }

    // =========================================================================
    // Keccak-f[1600] Permutation (Optimized)
    // =========================================================================

    /// @notice Apply Keccak-f[1600] permutation
    /// @dev Uses optimized array-based constants
    /// @param state 25 x 64-bit state array
    /// @return newState Permuted state
    function keccakF(uint64[25] memory state) internal pure returns (uint64[25] memory newState) {
        uint64[25] memory s = state;
        uint64[5] memory c;
        uint64[5] memory d;
        
        // Pre-compute rho offsets array once for all rounds
        uint256[25] memory rhoOffsets = [
            uint256(0), uint256(1), uint256(62), uint256(28), uint256(27),
            uint256(36), uint256(44), uint256(6), uint256(55), uint256(20),
            uint256(3), uint256(10), uint256(43), uint256(25), uint256(39),
            uint256(41), uint256(45), uint256(15), uint256(21), uint256(8),
            uint256(18), uint256(2), uint256(61), uint256(56), uint256(14)
        ];
        
        // Pre-compute round constants array
        uint64[24] memory roundConstants = [
            uint64(0x0000000000000001),
            uint64(0x0000000000008082),
            uint64(0x800000000000808a),
            uint64(0x8000000080008000),
            uint64(0x000000000000808b),
            uint64(0x0000000080000001),
            uint64(0x8000000080008081),
            uint64(0x8000000000008009),
            uint64(0x000000000000008a),
            uint64(0x0000000000000088),
            uint64(0x0000000080008009),
            uint64(0x000000008000000a),
            uint64(0x000000008000808b),
            uint64(0x800000000000008b),
            uint64(0x8000000000008089),
            uint64(0x8000000000008003),
            uint64(0x8000000000008002),
            uint64(0x8000000000000080),
            uint64(0x000000000000800a),
            uint64(0x800000008000000a),
            uint64(0x8000000080008081),
            uint64(0x8000000000008080),
            uint64(0x0000000080000001),
            uint64(0x8000000080008008)
        ];
        
        for (uint256 round = 0; round < ROUNDS; round++) {
            // θ (theta) step
            c[0] = s[0] ^ s[5] ^ s[10] ^ s[15] ^ s[20];
            c[1] = s[1] ^ s[6] ^ s[11] ^ s[16] ^ s[21];
            c[2] = s[2] ^ s[7] ^ s[12] ^ s[17] ^ s[22];
            c[3] = s[3] ^ s[8] ^ s[13] ^ s[18] ^ s[23];
            c[4] = s[4] ^ s[9] ^ s[14] ^ s[19] ^ s[24];

            d[0] = c[4] ^ _rotl64(c[1], 1);
            d[1] = c[0] ^ _rotl64(c[2], 1);
            d[2] = c[1] ^ _rotl64(c[3], 1);
            d[3] = c[2] ^ _rotl64(c[4], 1);
            d[4] = c[3] ^ _rotl64(c[0], 1);

            // Unrolled theta application for better gas efficiency
            s[0] ^= d[0]; s[1] ^= d[1]; s[2] ^= d[2]; s[3] ^= d[3]; s[4] ^= d[4];
            s[5] ^= d[0]; s[6] ^= d[1]; s[7] ^= d[2]; s[8] ^= d[3]; s[9] ^= d[4];
            s[10] ^= d[0]; s[11] ^= d[1]; s[12] ^= d[2]; s[13] ^= d[3]; s[14] ^= d[4];
            s[15] ^= d[0]; s[16] ^= d[1]; s[17] ^= d[2]; s[18] ^= d[3]; s[19] ^= d[4];
            s[20] ^= d[0]; s[21] ^= d[1]; s[22] ^= d[2]; s[23] ^= d[3]; s[24] ^= d[4];

            // ρ (rho) and π (pi) steps combined
            uint64[25] memory b;
            for (uint256 i = 0; i < 25; i++) {
                uint256 x = i % 5;
                uint256 y = i / 5;
                uint256 newX = y;
                uint256 newY = (2 * x + 3 * y) % 5;
                b[newX + 5 * newY] = _rotl64(s[i], rhoOffsets[i]);
            }

            // χ (chi) step
            for (uint256 y = 0; y < 5; y++) {
                uint256 base = 5 * y;
                uint64 t0 = b[base];
                uint64 t1 = b[base + 1];
                uint64 t2 = b[base + 2];
                uint64 t3 = b[base + 3];
                uint64 t4 = b[base + 4];
                
                s[base]     = t0 ^ ((~t1) & t2);
                s[base + 1] = t1 ^ ((~t2) & t3);
                s[base + 2] = t2 ^ ((~t3) & t4);
                s[base + 3] = t3 ^ ((~t4) & t0);
                s[base + 4] = t4 ^ ((~t0) & t1);
            }

            // ι (iota) step - using pre-computed array
            s[0] ^= roundConstants[round];
        }

        return s;
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    /// @notice 64-bit left rotation
    function _rotl64(uint64 x, uint256 n) internal pure returns (uint64) {
        if (n == 0) return x;
        return (x << n) | (x >> (64 - n));
    }

    /// @notice Reverse bytes in a bytes32 (for endianness conversion)
    function _reverseBytes32(bytes32 input) internal pure returns (bytes32 output) {
        uint256 v = uint256(input);
        // Swap bytes
        v = ((v & 0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >> 8) |
            ((v & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) << 8);
        // Swap 2-byte pairs
        v = ((v & 0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >> 16) |
            ((v & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) << 16);
        // Swap 4-byte pairs
        v = ((v & 0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >> 32) |
            ((v & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) << 32);
        // Swap 8-byte pairs
        v = ((v & 0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >> 64) |
            ((v & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) << 64);
        // Swap 16-byte pairs
        v = (v >> 128) | (v << 128);
        output = bytes32(v);
    }

    // =========================================================================
    // Verification Functions
    // =========================================================================

    /// @notice Verify SHA3-256 against known test vector
    /// @dev NIST test vector: SHA3-256("") = a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
    /// @return valid True if implementation is correct
    function verifySHA3Implementation() internal pure returns (bool valid) {
        bytes memory empty = "";
        bytes32 result = hash(empty);
        bytes32 expected = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;
        return result == expected;
    }

    /// @notice Get implementation info
    /// @return name Implementation name
    /// @return version Version string
    /// @return fipsCompliant FIPS 202 compliance status
    function getImplementationInfo() internal pure returns (
        string memory name,
        string memory version,
        bool fipsCompliant
    ) {
        return ("SHA3-256 Pure Solidity", "1.1.0", true);
    }
}
