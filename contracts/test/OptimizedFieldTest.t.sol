// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {OptimizedField} from "../src/lib/OptimizedField.sol";

/**
 * @title OptimizedFieldTest
 * @author Quantum Shield Team
 * @notice Unit tests for OptimizedField library [TEST-028]
 * @dev Tests field arithmetic optimizations for gas reduction
 * 
 * ## Test Coverage
 * - modExp using precompile
 * - modInverse using Extended Euclidean
 * - batchMulMod optimization
 * - Gas benchmarks (target: 50% reduction)
 * 
 * @custom:version 0.1.1
 */

/// @notice Helper contract to test library reverts
contract OptimizedFieldWrapper {
    function modInverse(uint256 a, uint256 p) external view returns (uint256) {
        return OptimizedField.modInverse(a, p);
    }
    
    function batchMulMod(
        uint256[] memory a,
        uint256[] memory b,
        uint256 m
    ) external pure returns (uint256[] memory) {
        return OptimizedField.batchMulMod(a, b, m);
    }
}

contract OptimizedFieldTest is Test {
    using OptimizedField for uint256;

    // BN254 prime (commonly used in ZK)
    uint256 constant BN254_PRIME = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    
    // Small prime for testing
    uint256 constant TEST_PRIME = 65537;
    
    // Another small prime for basic tests
    uint256 constant SMALL_PRIME = 67;

    OptimizedFieldWrapper wrapper;

    function setUp() public {
        wrapper = new OptimizedFieldWrapper();
    }

    // =========================================================================
    // modExp Tests
    // =========================================================================

    function test_ModExp_Basic() public view {
        // 2^10 mod 1000 = 1024 mod 1000 = 24
        uint256 result = OptimizedField.modExp(2, 10, 1000);
        assertEq(result, 24, "2^10 mod 1000 should be 24");
    }

    function test_ModExp_IdentityExponent() public view {
        // x^1 mod p = x mod p
        uint256 result = OptimizedField.modExp(123, 1, TEST_PRIME);
        assertEq(result, 123, "x^1 should equal x");
    }

    function test_ModExp_ZeroExponent() public view {
        // x^0 mod p = 1
        uint256 result = OptimizedField.modExp(123, 0, TEST_PRIME);
        assertEq(result, 1, "x^0 should equal 1");
    }

    function test_ModExp_LargePrime() public view {
        // Test with BN254 prime
        uint256 base = 12345;
        uint256 exponent = 100;
        uint256 result = OptimizedField.modExp(base, exponent, BN254_PRIME);
        
        // Verify result is in valid range
        assertTrue(result < BN254_PRIME, "Result should be < prime");
    }

    function test_ModExp_FermatLittleTheorem() public view {
        // a^(p-1) ≡ 1 (mod p) for prime p and gcd(a,p)=1
        uint256 a = 12345;
        uint256 result = OptimizedField.modExp(a, TEST_PRIME - 1, TEST_PRIME);
        assertEq(result, 1, "Fermat's little theorem");
    }

    function test_Gas_ModExp() public view {
        uint256 gasBefore = gasleft();
        OptimizedField.modExp(12345, 10000, BN254_PRIME);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("modExp gas used:", gasUsed);
        assertTrue(gasUsed < 5000, "modExp should use < 5k gas with precompile");
    }

    // =========================================================================
    // modInverse Tests
    // =========================================================================

    function test_ModInverse_Basic() public view {
        // Use a prime modulus (67) - Fermat's Little Theorem requires prime
        // 3 * inv(3) ≡ 1 (mod 67)
        uint256 inv = OptimizedField.modInverse(3, SMALL_PRIME);
        uint256 check = mulmod(3, inv, SMALL_PRIME);
        assertEq(check, 1, "3 * inv(3) should equal 1 mod 67");
    }

    function test_ModInverse_Identity() public view {
        // inv(1) = 1
        uint256 inv = OptimizedField.modInverse(1, TEST_PRIME);
        assertEq(inv, 1, "Inverse of 1 should be 1");
    }

    function test_ModInverse_Roundtrip() public view {
        // a * inv(a) ≡ 1 (mod p)
        uint256 a = 12345;
        uint256 inv = OptimizedField.modInverse(a, TEST_PRIME);
        uint256 product = mulmod(a, inv, TEST_PRIME);
        assertEq(product, 1, "a * inv(a) should equal 1");
    }

    function test_ModInverse_LargePrime() public view {
        uint256 a = 123456789;
        uint256 inv = OptimizedField.modInverse(a, BN254_PRIME);
        uint256 product = mulmod(a, inv, BN254_PRIME);
        assertEq(product, 1, "Should work with large prime");
    }

    function test_ModInverse_Zero_Reverts() public {
        // Use wrapper contract to properly test revert
        vm.expectRevert(OptimizedField.ZeroInverse.selector);
        wrapper.modInverse(0, TEST_PRIME);
    }

    function test_Gas_ModInverse() public view {
        uint256 gasBefore = gasleft();
        OptimizedField.modInverse(12345, BN254_PRIME);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("modInverse gas used:", gasUsed);
        assertTrue(gasUsed < 10000, "modInverse should use < 10k gas");
    }

    // =========================================================================
    // batchMulMod Tests
    // =========================================================================

    function test_BatchMulMod_Basic() public pure {
        uint256[] memory a = new uint256[](3);
        uint256[] memory b = new uint256[](3);
        a[0] = 2; a[1] = 3; a[2] = 4;
        b[0] = 5; b[1] = 6; b[2] = 7;
        
        uint256[] memory results = OptimizedField.batchMulMod(a, b, 1000);
        
        assertEq(results[0], 10, "2 * 5 mod 1000 = 10");
        assertEq(results[1], 18, "3 * 6 mod 1000 = 18");
        assertEq(results[2], 28, "4 * 7 mod 1000 = 28");
    }

    function test_BatchMulMod_Empty() public pure {
        uint256[] memory a = new uint256[](0);
        uint256[] memory b = new uint256[](0);
        
        uint256[] memory results = OptimizedField.batchMulMod(a, b, TEST_PRIME);
        
        assertEq(results.length, 0, "Empty batch should return empty");
    }

    function test_BatchMulMod_Single() public pure {
        uint256[] memory a = new uint256[](1);
        uint256[] memory b = new uint256[](1);
        a[0] = 123;
        b[0] = 456;
        
        uint256[] memory results = OptimizedField.batchMulMod(a, b, TEST_PRIME);
        
        assertEq(results.length, 1, "Should have one result");
        assertEq(results[0], mulmod(123, 456, TEST_PRIME), "Should equal mulmod");
    }

    function test_BatchMulMod_LengthMismatch_Reverts() public {
        uint256[] memory a = new uint256[](3);
        uint256[] memory b = new uint256[](2);
        
        // Use wrapper contract to properly test revert
        vm.expectRevert(OptimizedField.LengthMismatch.selector);
        wrapper.batchMulMod(a, b, TEST_PRIME);
    }

    function test_BatchMulMod_LargeBatch() public pure {
        uint256[] memory a = new uint256[](100);
        uint256[] memory b = new uint256[](100);
        for (uint256 i = 0; i < 100; i++) {
            a[i] = i + 1;
            b[i] = i + 2;
        }
        
        uint256[] memory results = OptimizedField.batchMulMod(a, b, TEST_PRIME);
        
        assertEq(results.length, 100, "Should process all 100 elements");
        // Spot check a few values
        assertEq(results[0], mulmod(1, 2, TEST_PRIME), "First result");
        assertEq(results[99], mulmod(100, 101, TEST_PRIME), "Last result");
    }

    function test_Gas_BatchMulMod() public view {
        uint256[] memory a = new uint256[](10);
        uint256[] memory b = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            a[i] = i + 1;
            b[i] = i + 2;
        }
        
        uint256 gasBefore = gasleft();
        OptimizedField.batchMulMod(a, b, BN254_PRIME);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("batchMulMod (10 elements) gas used:", gasUsed);
        assertTrue(gasUsed < 50000, "batchMulMod should use < 50k gas for 10 elements");
    }

    // =========================================================================
    // addMod Tests
    // =========================================================================

    function test_AddMod_Basic() public pure {
        uint256 result = OptimizedField.addMod(10, 20, 25);
        assertEq(result, 5, "10 + 20 mod 25 = 5");
    }

    function test_AddMod_NoOverflow() public pure {
        uint256 result = OptimizedField.addMod(10, 10, 100);
        assertEq(result, 20, "No overflow case");
    }

    function test_AddMod_LargeValues() public pure {
        uint256 a = BN254_PRIME - 1;
        uint256 b = 2;
        uint256 result = OptimizedField.addMod(a, b, BN254_PRIME);
        assertEq(result, 1, "Should wrap correctly");
    }

    // =========================================================================
    // subMod Tests
    // =========================================================================

    function test_SubMod_Basic() public pure {
        uint256 result = OptimizedField.subMod(20, 10, 25);
        assertEq(result, 10, "20 - 10 mod 25 = 10");
    }

    function test_SubMod_Underflow() public pure {
        uint256 result = OptimizedField.subMod(5, 10, 25);
        assertEq(result, 20, "5 - 10 mod 25 = 20");
    }

    function test_SubMod_LargeValues() public pure {
        uint256 result = OptimizedField.subMod(1, 2, BN254_PRIME);
        assertEq(result, BN254_PRIME - 1, "1 - 2 mod p = p-1");
    }

    // =========================================================================
    // Combined Operations Tests
    // =========================================================================

    function test_Div_Basic() public view {
        // a / b = a * inv(b)
        uint256 a = 20;
        uint256 b = 5;
        uint256 result = OptimizedField.div(a, b, TEST_PRIME);
        
        // 20 / 5 should be 4 in regular arithmetic
        // In field: 20 * inv(5) mod p
        uint256 expected = mulmod(a, OptimizedField.modInverse(b, TEST_PRIME), TEST_PRIME);
        assertEq(result, expected, "Division should work");
    }

    function test_Pow_Small() public view {
        // 2^8 mod 257 = 256
        uint256 result = OptimizedField.pow(2, 8, 257);
        assertEq(result, 256, "2^8 mod 257 = 256");
    }

    // =========================================================================
    // Version Test
    // =========================================================================

    function test_Version() public pure {
        assertEq(OptimizedField.VERSION, 1, "Version should be 1");
    }
}
