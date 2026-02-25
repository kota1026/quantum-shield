// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SHAKE256 - FIPS 202 Compliant SHAKE256 XOF Implementation
/// @notice Pure Solidity implementation of SHAKE256 for Quantum Shield
/// @dev Implements Keccak-f[1600] with SHAKE padding (domain separation byte 0x1F)
///
/// IMPORTANT: SHAKE256 ≠ SHA3-256 ≠ keccak256
/// - SHAKE256: Uses padding 0x1F (XOF - Extendable Output Function)
/// - SHA3-256: Uses padding 0x06 (FIPS 202 standard)
/// - keccak256: Uses padding 0x01 (Ethereum standard)
///
/// This library provides FIPS 202 compliant SHAKE256 required for:
/// - SPHINCS+-SHAKE-128s signature verification
/// - NIST certification compliance
/// - Core Principles CP-1 compliance (no SHA-256)
///
/// Architecture:
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │                    SHAKE256 (FIPS 202)                              │
/// ├─────────────────────────────────────────────────────────────────────┤
/// │  Input → Pad (0x1F) → Absorb → Keccak-f[1600] → Squeeze (variable) │
/// │                                                                     │
/// │  Rate: 1088 bits (136 bytes)                                       │
/// │  Capacity: 512 bits                                                │
/// │  Output: Variable length (XOF)                                     │
/// └─────────────────────────────────────────────────────────────────────┘
library SHAKE256 {
    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice SHAKE256 rate in bytes (1088 bits / 8)
    uint256 internal constant RATE = 136;

    /// @notice SHAKE domain separation byte (0x1F for SHAKE XOF)
    uint8 internal constant SHAKE_DOMAIN = 0x1F;

    /// @notice Number of Keccak-f rounds
    uint256 internal constant ROUNDS = 24;

    // =========================================================================
    // Main Functions
    // =========================================================================

    /// @notice Compute SHAKE256 hash with variable output length
    /// @param data Input bytes to hash
    /// @param outputLen Desired output length in bytes
    /// @return output SHAKE256 hash of specified length
    function hash(bytes memory data, uint256 outputLen) internal pure returns (bytes memory output) {
        // Initialize state (5x5 array of 64-bit lanes = 1600 bits)
        uint64[25] memory state;

        // Absorb phase
        uint256 dataLen = data.length;
        uint256 blockCount = (dataLen + 1) / RATE + 1;
        
        for (uint256 blockIdx = 0; blockIdx < blockCount; blockIdx++) {
            uint256 offset = blockIdx * RATE;
            
            for (uint256 i = 0; i < 17; i++) { // 17 lanes = 136 bytes = RATE
                uint64 lane = 0;
                
                for (uint256 j = 0; j < 8; j++) {
                    uint256 byteIndex = offset + i * 8 + j;
                    uint8 b;
                    
                    if (byteIndex < dataLen) {
                        b = uint8(data[byteIndex]);
                    } else if (byteIndex == dataLen) {
                        // First padding byte: SHAKE domain separator
                        b = SHAKE_DOMAIN;
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

        // Squeeze phase
        output = new bytes(outputLen);
        uint256 outputIdx = 0;
        
        while (outputIdx < outputLen) {
            // Extract up to RATE bytes from current state
            for (uint256 i = 0; i < 17 && outputIdx < outputLen; i++) {
                uint64 lane = state[i];
                for (uint256 j = 0; j < 8 && outputIdx < outputLen; j++) {
                    output[outputIdx++] = bytes1(uint8(lane >> (j * 8)));
                }
            }
            
            // If more output needed, apply another permutation
            if (outputIdx < outputLen) {
                state = keccakF(state);
            }
        }
    }

    /// @notice Compute SHAKE256 hash with 256-bit output (convenience function)
    /// @param data Input bytes to hash
    /// @return digest 32-byte SHAKE256 hash
    function hash256(bytes memory data) internal pure returns (bytes32 digest) {
        bytes memory output = hash(data, 32);
        assembly {
            digest := mload(add(output, 32))
        }
    }

    /// @notice Compute SHAKE256 hash of two concatenated bytes32 values
    /// @dev Optimized version for common use case in Merkle trees
    /// @param a First 32 bytes
    /// @param b Second 32 bytes
    /// @return digest SHAKE256 hash
    function hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32 digest) {
        bytes memory data = abi.encodePacked(a, b);
        return hash256(data);
    }

    /// @notice Compute SHAKE256 hash with domain separation
    /// @param domain Domain separator
    /// @param data Data to hash
    /// @return digest SHAKE256 hash
    function hashWithDomain(bytes1 domain, bytes memory data) internal pure returns (bytes32 digest) {
        bytes memory combined = abi.encodePacked(domain, data);
        return hash256(combined);
    }

    // =========================================================================
    // Keccak-f[1600] Permutation
    // =========================================================================

    /// @notice Apply Keccak-f[1600] permutation
    /// @param state 25 x 64-bit state array
    /// @return newState Permuted state
    function keccakF(uint64[25] memory state) internal pure returns (uint64[25] memory) {
        uint64[25] memory s = state;
        uint64[5] memory c;
        uint64[5] memory d;
        
        // Pre-compute rho offsets array
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

            // Unrolled theta application
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

            // ι (iota) step
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

    // =========================================================================
    // Verification Functions
    // =========================================================================

    /// @notice Verify SHAKE256 against known test vector
    /// @dev NIST test vector: SHAKE256("", 256 bits) = 46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f
    /// @return valid True if implementation is correct
    function verifySHAKE256Implementation() internal pure returns (bool valid) {
        bytes memory empty = "";
        bytes32 result = hash256(empty);
        bytes32 expected = 0x46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f;
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
        return ("SHAKE256 Pure Solidity", "1.0.0", true);
    }
}
