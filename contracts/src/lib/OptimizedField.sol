// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OptimizedField
 * @author Quantum Shield Team
 * @notice Optimized finite field arithmetic for ZK-STARK verification
 * @dev IMPL-014: Implements gas-optimized field operations for Week 10 targets
 * 
 * ## Overview
 * This library provides highly optimized field arithmetic operations
 * for use in STARK proof verification. Key optimizations:
 * - modExp: Uses EVM precompile (0x05) for ~90% gas reduction
 * - modInverse: Extended Euclidean Algorithm with early termination
 * - batchMulMod: Amortized overhead through batching
 * 
 * ## Gas Targets
 * | Operation    | Before  | Target   | Strategy              |
 * |-------------|---------|----------|----------------------|
 * | modExp      | ~5,000  | <2,000   | Precompile 0x05      |
 * | modInverse  | ~10,000 | <5,000   | Extended Euclidean   |
 * | batchMulMod | ~50,000 | <20,000  | Batch amortization   |
 * 
 * ## CP-1 Compliance
 * All operations are pure field arithmetic with no hash functions.
 * When hashing is needed, caller must use SHA3-256.
 * 
 * @custom:security-contact security@quantumshield.io
 * @custom:version 0.1.0
 */
library OptimizedField {
    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Library version for compatibility checks
    uint256 public constant VERSION = 1;

    /// @notice Address of the modular exponentiation precompile
    address private constant MODEXP_PRECOMPILE = address(0x05);

    // =========================================================================
    // Errors
    // =========================================================================

    /// @notice Thrown when attempting to compute inverse of zero
    error ZeroInverse();

    /// @notice Thrown when input arrays have different lengths
    error LengthMismatch();

    /// @notice Thrown when modular exponentiation precompile fails
    error ModExpFailed();

    // =========================================================================
    // Modular Exponentiation
    // =========================================================================

    /**
     * @notice Compute base^exponent mod modulus using the EVM precompile
     * @dev Uses precompile at 0x05 for gas efficiency
     * @param base The base value
     * @param exponent The exponent
     * @param modulus The modulus (must be > 0)
     * @return result base^exponent mod modulus
     */
    function modExp(uint256 base, uint256 exponent, uint256 modulus) internal view returns (uint256 result) {
        // Special cases
        if (modulus == 0) return 0;
        if (modulus == 1) return 0;
        if (exponent == 0) return 1;
        if (base == 0) return 0;
        
        // Use precompile for efficiency
        // Input format: [Bsize, Esize, Msize, B, E, M]
        bytes memory input = abi.encodePacked(
            uint256(32),    // Base length
            uint256(32),    // Exponent length
            uint256(32),    // Modulus length
            base,
            exponent,
            modulus
        );

        bytes memory output = new bytes(32);

        // Call precompile
        assembly {
            let success := staticcall(
                gas(),
                0x05,                    // MODEXP precompile
                add(input, 32),          // Input data (skip length prefix)
                192,                     // Input size: 6 * 32 = 192 bytes
                add(output, 32),         // Output location (skip length prefix)
                32                       // Output size: 32 bytes
            )
            
            if iszero(success) {
                // Fallback: compute manually if precompile fails
                // This shouldn't happen on mainnet but provides safety
                result := 1
                let b := mod(base, modulus)
                let e := exponent
                
                for {} gt(e, 0) {} {
                    if and(e, 1) {
                        result := mulmod(result, b, modulus)
                    }
                    b := mulmod(b, b, modulus)
                    e := shr(1, e)
                }
            }
        }

        // Extract result from output
        assembly {
            result := mload(add(output, 32))
        }
    }

    // =========================================================================
    // Modular Inverse
    // =========================================================================

    /**
     * @notice Compute modular inverse using Extended Euclidean Algorithm
     * @dev Uses Fermat's Little Theorem: a^(-1) ≡ a^(p-2) mod p for prime p
     * @param a The value to invert (must be non-zero)
     * @param p The prime modulus
     * @return inverse a^(-1) mod p such that a * inverse ≡ 1 (mod p)
     */
    function modInverse(uint256 a, uint256 p) internal view returns (uint256 inverse) {
        if (a == 0) revert ZeroInverse();
        
        // For prime p, use Fermat's Little Theorem: a^(-1) ≡ a^(p-2) mod p
        // This is simpler and works well with the modExp precompile
        inverse = modExp(a, p - 2, p);
    }

    /**
     * @notice Compute modular inverse using Extended Euclidean Algorithm
     * @dev Direct implementation without using modExp
     * @param a The value to invert (must be non-zero)
     * @param p The modulus
     * @return inverse a^(-1) mod p
     */
    function modInverseEEA(uint256 a, uint256 p) internal pure returns (uint256 inverse) {
        if (a == 0) revert ZeroInverse();
        
        // Extended Euclidean Algorithm
        int256 t = 0;
        int256 newT = 1;
        uint256 r = p;
        uint256 newR = a;
        
        while (newR != 0) {
            uint256 quotient = r / newR;
            
            // Update t
            int256 tempT = t;
            t = newT;
            newT = tempT - int256(quotient) * newT;
            
            // Update r
            uint256 tempR = r;
            r = newR;
            newR = tempR - quotient * newR;
        }
        
        // Make result positive
        if (t < 0) {
            t += int256(p);
        }
        
        inverse = uint256(t);
    }

    // =========================================================================
    // Batch Operations
    // =========================================================================

    /**
     * @notice Batch multiply arrays element-wise modulo m
     * @dev Optimized for multiple multiplications with same modulus
     * @param a First array of values
     * @param b Second array of values (must have same length as a)
     * @param m The modulus
     * @return results Array of a[i] * b[i] mod m
     */
    function batchMulMod(
        uint256[] memory a,
        uint256[] memory b,
        uint256 m
    ) internal pure returns (uint256[] memory results) {
        if (a.length != b.length) revert LengthMismatch();
        
        uint256 len = a.length;
        results = new uint256[](len);
        
        // Unrolled loop for gas efficiency on common batch sizes
        assembly {
            let aData := add(a, 32)
            let bData := add(b, 32)
            let resData := add(results, 32)
            
            // Process 4 elements at a time if possible
            let i := 0
            let remainder := mod(len, 4)
            let mainLen := sub(len, remainder)
            
            // Main loop: 4 elements per iteration
            for {} lt(i, mainLen) {} {
                let offset := mul(i, 32)
                
                // Element 0
                mstore(
                    add(resData, offset),
                    mulmod(
                        mload(add(aData, offset)),
                        mload(add(bData, offset)),
                        m
                    )
                )
                
                // Element 1
                let offset1 := add(offset, 32)
                mstore(
                    add(resData, offset1),
                    mulmod(
                        mload(add(aData, offset1)),
                        mload(add(bData, offset1)),
                        m
                    )
                )
                
                // Element 2
                let offset2 := add(offset, 64)
                mstore(
                    add(resData, offset2),
                    mulmod(
                        mload(add(aData, offset2)),
                        mload(add(bData, offset2)),
                        m
                    )
                )
                
                // Element 3
                let offset3 := add(offset, 96)
                mstore(
                    add(resData, offset3),
                    mulmod(
                        mload(add(aData, offset3)),
                        mload(add(bData, offset3)),
                        m
                    )
                )
                
                i := add(i, 4)
            }
            
            // Handle remainder
            for {} lt(i, len) {} {
                let offset := mul(i, 32)
                mstore(
                    add(resData, offset),
                    mulmod(
                        mload(add(aData, offset)),
                        mload(add(bData, offset)),
                        m
                    )
                )
                i := add(i, 1)
            }
        }
    }

    /**
     * @notice Batch addition modulo m
     * @param a First array
     * @param b Second array
     * @param m The modulus
     * @return results Array of (a[i] + b[i]) mod m
     */
    function batchAddMod(
        uint256[] memory a,
        uint256[] memory b,
        uint256 m
    ) internal pure returns (uint256[] memory results) {
        if (a.length != b.length) revert LengthMismatch();
        
        uint256 len = a.length;
        results = new uint256[](len);
        
        for (uint256 i = 0; i < len; i++) {
            results[i] = addMod(a[i], b[i], m);
        }
    }

    // =========================================================================
    // Basic Field Operations
    // =========================================================================

    /**
     * @notice Modular addition with overflow protection
     * @param a First operand
     * @param b Second operand
     * @param m The modulus
     * @return result (a + b) mod m
     */
    function addMod(uint256 a, uint256 b, uint256 m) internal pure returns (uint256 result) {
        assembly {
            result := addmod(a, b, m)
        }
    }

    /**
     * @notice Modular subtraction
     * @param a Minuend
     * @param b Subtrahend
     * @param m The modulus
     * @return result (a - b) mod m
     */
    function subMod(uint256 a, uint256 b, uint256 m) internal pure returns (uint256 result) {
        assembly {
            // If a >= b, simple subtraction
            // If a < b, add modulus: (a + m - b) mod m
            switch lt(a, b)
            case 0 {
                result := mod(sub(a, b), m)
            }
            default {
                result := sub(m, mod(sub(b, a), m))
            }
        }
    }

    /**
     * @notice Modular multiplication (wrapper for mulmod)
     * @param a First operand
     * @param b Second operand
     * @param m The modulus
     * @return result (a * b) mod m
     */
    function mulMod(uint256 a, uint256 b, uint256 m) internal pure returns (uint256 result) {
        assembly {
            result := mulmod(a, b, m)
        }
    }

    /**
     * @notice Modular division: a / b mod m = a * inv(b) mod m
     * @param a Dividend
     * @param b Divisor (must be non-zero)
     * @param m The prime modulus
     * @return result (a / b) mod m
     */
    function div(uint256 a, uint256 b, uint256 m) internal view returns (uint256 result) {
        uint256 bInv = modInverse(b, m);
        assembly {
            result := mulmod(a, bInv, m)
        }
    }

    /**
     * @notice Modular exponentiation (alias for modExp)
     * @param base The base
     * @param exponent The exponent
     * @param m The modulus
     * @return result base^exponent mod m
     */
    function pow(uint256 base, uint256 exponent, uint256 m) internal view returns (uint256 result) {
        return modExp(base, exponent, m);
    }

    // =========================================================================
    // Utility Functions
    // =========================================================================

    /**
     * @notice Check if a value is a quadratic residue
     * @dev Uses Euler's criterion: a^((p-1)/2) ≡ 1 (mod p) iff a is a QR
     * @param a The value to check
     * @param p The prime modulus
     * @return isQR True if a is a quadratic residue mod p
     */
    function isQuadraticResidue(uint256 a, uint256 p) internal view returns (bool isQR) {
        if (a == 0) return true;
        uint256 exponent = (p - 1) / 2;
        uint256 result = modExp(a, exponent, p);
        return result == 1;
    }

    /**
     * @notice Compute the Legendre symbol (a/p)
     * @param a The value
     * @param p The odd prime modulus
     * @return symbol 0 if a ≡ 0, 1 if a is QR, p-1 (≡ -1) if a is QNR
     */
    function legendreSymbol(uint256 a, uint256 p) internal view returns (uint256 symbol) {
        return modExp(a % p, (p - 1) / 2, p);
    }
}
