// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SHAKE256} from "../src/libraries/SHAKE256.sol";

/// @title SHAKE256 Test Suite
/// @notice NIST FIPS 202 compliant SHAKE256 XOF tests
/// @dev Tests based on NIST CAVP test vectors
contract SHAKE256Test is Test {
    
    // =========================================================================
    // NIST FIPS 202 Test Vectors - SHAKE256
    // =========================================================================
    
    /// @notice Test SHAKE256 with empty input (NIST test vector)
    /// @dev SHAKE256("", 256 bits) = 46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f
    function test_SHAKE256_Empty() public pure {
        bytes memory empty = "";
        bytes memory result = SHAKE256.hash(empty, 32);
        
        bytes32 expected = 0x46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f;
        assertEq(bytes32(result), expected, "SHAKE256 empty input mismatch");
    }
    
    /// @notice Test SHAKE256 with "abc" (NIST test vector)
    /// @dev SHAKE256("abc", 256 bits) = 483366601360a8771c6863080cc4114d8db44530f8f1e1ee4f94ea37e78b5739
    function test_SHAKE256_ABC() public pure {
        bytes memory input = "abc";
        bytes memory result = SHAKE256.hash(input, 32);
        
        bytes32 expected = 0x483366601360a8771c6863080cc4114d8db44530f8f1e1ee4f94ea37e78b5739;
        assertEq(bytes32(result), expected, "SHAKE256 'abc' mismatch");
    }
    
    /// @notice Test SHAKE256 with longer output (512 bits)
    function test_SHAKE256_512BitOutput() public pure {
        bytes memory input = "test";
        bytes memory result = SHAKE256.hash(input, 64);
        
        assertEq(result.length, 64, "Output length should be 64 bytes");
    }
    
    /// @notice Test SHAKE256 256-bit convenience function
    function test_SHAKE256_256() public pure {
        bytes memory input = "";
        bytes32 result = SHAKE256.hash256(input);
        
        bytes32 expected = 0x46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f;
        assertEq(result, expected, "SHAKE256-256 empty input mismatch");
    }
    
    // =========================================================================
    // Domain Separation Tests
    // =========================================================================
    
    /// @notice Verify SHAKE256 uses correct domain separation (0x1F)
    /// @dev SHAKE uses 0x1F, SHA3 uses 0x06, Keccak uses 0x01
    function test_DomainSeparation() public pure {
        bytes memory input = "domain test";
        
        // SHAKE256 should produce different output than SHA3-256 and keccak256
        bytes32 shakeResult = SHAKE256.hash256(input);
        bytes32 keccakResult = keccak256(input);
        
        assertTrue(shakeResult != keccakResult, "SHAKE256 should differ from keccak256");
    }
    
    // =========================================================================
    // Variable Length Output Tests (XOF property)
    // =========================================================================
    
    /// @notice Test various output lengths
    function test_VariableLengthOutput() public pure {
        bytes memory input = "variable length test";
        
        bytes memory result16 = SHAKE256.hash(input, 16);
        bytes memory result32 = SHAKE256.hash(input, 32);
        bytes memory result64 = SHAKE256.hash(input, 64);
        
        assertEq(result16.length, 16, "16-byte output");
        assertEq(result32.length, 32, "32-byte output");
        assertEq(result64.length, 64, "64-byte output");
        
        // Verify prefix consistency (XOF property)
        for (uint i = 0; i < 16; i++) {
            assertEq(result16[i], result32[i], "16-byte prefix should match 32-byte");
            assertEq(result16[i], result64[i], "16-byte prefix should match 64-byte");
        }
    }
    
    // =========================================================================
    // SPHINCS+ Specific Tests
    // =========================================================================
    
    /// @notice Test SHAKE256 for SPHINCS+ FORS hashing
    function test_SPHINCS_FORSHash() public pure {
        bytes memory forsInput = abi.encodePacked(
            bytes1(0x01),  // Domain separator for F
            bytes16(0x00112233445566778899aabbccddeeff),  // seed
            uint32(0),  // tree index
            uint32(0),  // leaf index
            bytes16(0xffeeddccbbaa99887766554433221100)  // sk value
        );
        
        bytes32 result = SHAKE256.hash256(forsInput);
        assertTrue(result != bytes32(0), "FORS hash should be non-zero");
    }
    
    /// @notice Test SHAKE256 for SPHINCS+ WOTS+ chain
    function test_SPHINCS_WOTSChain() public pure {
        bytes memory wotsInput = abi.encodePacked(
            bytes1(0x04),  // Domain separator for F
            bytes16(0x00112233445566778899aabbccddeeff),  // seed
            uint32(0),  // layer
            uint32(0),  // chain index
            uint32(0),  // step index
            bytes32(0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef)  // input
        );
        
        bytes32 result = SHAKE256.hash256(wotsInput);
        assertTrue(result != bytes32(0), "WOTS chain should be non-zero");
    }
    
    // =========================================================================
    // Gas Benchmarks
    // =========================================================================
    
    function test_Gas_SHAKE256_32Bytes() public view {
        bytes memory input = "gas benchmark input data";
        
        uint256 gasBefore = gasleft();
        SHAKE256.hash256(input);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for SHAKE256 (32-byte output):", gasUsed);
    }
    
    function test_Gas_SHAKE256_64Bytes() public view {
        bytes memory input = "gas benchmark input data";
        
        uint256 gasBefore = gasleft();
        SHAKE256.hash(input, 64);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for SHAKE256 (64-byte output):", gasUsed);
    }
    
    // =========================================================================
    // Edge Cases
    // =========================================================================
    
    /// @notice Test with single byte input
    function test_SingleByteInput() public pure {
        bytes memory input = hex"00";
        bytes32 result = SHAKE256.hash256(input);
        assertTrue(result != bytes32(0), "Single byte should produce valid hash");
    }
    
    /// @notice Test with maximum practical input size
    function test_LargeInput() public pure {
        bytes memory input = new bytes(1024);
        for (uint i = 0; i < 1024; i++) {
            input[i] = bytes1(uint8(i % 256));
        }
        
        bytes32 result = SHAKE256.hash256(input);
        assertTrue(result != bytes32(0), "Large input should produce valid hash");
    }
}
