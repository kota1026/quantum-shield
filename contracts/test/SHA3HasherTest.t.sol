// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/libraries/SHA3Hasher.sol";

/**
 * @title SHA3HasherTest
 * @notice Unit tests for SHA3Hasher library
 * @dev TEST-001: 100% coverage target for SHA3Hasher.sol
 * 
 * Test Categories:
 * 1. Basic hash operations
 * 2. hashPair for Merkle trees
 * 3. batchHash for gas optimization
 * 4. Edge cases
 * 5. NIST compliance
 * 6. Gas benchmarks
 */
contract SHA3HasherTest is Test {
    // =========================================================================
    // Constants for Testing
    // =========================================================================

    /// @notice NIST test vector: SHA3-256("") = expected hash
    bytes32 constant NIST_EMPTY_HASH = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;

    /// @notice NIST test vector: SHA3-256("abc") = expected hash
    bytes32 constant NIST_ABC_HASH = 0x3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532;

    // =========================================================================
    // Basic Hash Tests
    // =========================================================================

    /**
     * @notice Test hash of empty bytes
     * @dev Verifies NIST test vector compliance
     */
    function test_hash_emptyBytes() public pure {
        bytes memory empty = "";
        bytes32 result = SHA3Hasher.hash(empty);
        assertEq(result, NIST_EMPTY_HASH, "Empty hash should match NIST test vector");
    }

    /**
     * @notice Test hash of "abc"
     * @dev Verifies NIST test vector compliance
     */
    function test_hash_abc() public pure {
        bytes memory abc = "abc";
        bytes32 result = SHA3Hasher.hash(abc);
        assertEq(result, NIST_ABC_HASH, "ABC hash should match NIST test vector");
    }

    /**
     * @notice Test hash determinism
     * @dev Same input should always produce same output
     */
    function test_hash_deterministic() public pure {
        bytes memory data = "quantum shield test data";
        bytes32 hash1 = SHA3Hasher.hash(data);
        bytes32 hash2 = SHA3Hasher.hash(data);
        assertEq(hash1, hash2, "Hash should be deterministic");
    }

    /**
     * @notice Test hash collision resistance
     * @dev Different inputs should produce different outputs
     */
    function test_hash_collisionResistance() public pure {
        bytes memory data1 = "input1";
        bytes memory data2 = "input2";
        bytes32 hash1 = SHA3Hasher.hash(data1);
        bytes32 hash2 = SHA3Hasher.hash(data2);
        assertTrue(hash1 != hash2, "Different inputs should produce different hashes");
    }

    /**
     * @notice Fuzz test hash function
     * @dev Random inputs should always produce 32-byte output
     */
    function testFuzz_hash_outputLength(bytes calldata data) public pure {
        bytes32 result = SHA3Hasher.hash(data);
        assertTrue(result != bytes32(0) || data.length == 0, "Hash should be non-zero for non-trivial input");
    }

    // =========================================================================
    // hashPair Tests (Merkle Tree Operations)
    // =========================================================================

    /**
     * @notice Test hashPair with zero values
     */
    function test_hashPair_zeros() public pure {
        bytes32 left = bytes32(0);
        bytes32 right = bytes32(0);
        bytes32 result = SHA3Hasher.hashPair(left, right);
        
        // Result should be SHA3-256 of 64 zero bytes
        bytes memory combined = abi.encodePacked(left, right);
        bytes32 expected = SHA3Hasher.hash(combined);
        assertEq(result, expected, "hashPair should equal hash of concatenated values");
    }

    /**
     * @notice Test hashPair commutativity (should NOT be commutative)
     * @dev Merkle trees require order-dependent hashing
     */
    function test_hashPair_notCommutative() public pure {
        bytes32 a = bytes32(uint256(1));
        bytes32 b = bytes32(uint256(2));
        bytes32 hash_ab = SHA3Hasher.hashPair(a, b);
        bytes32 hash_ba = SHA3Hasher.hashPair(b, a);
        assertTrue(hash_ab != hash_ba, "hashPair should not be commutative");
    }

    /**
     * @notice Test hashPair consistency with hash function
     */
    function test_hashPair_consistentWithHash() public pure {
        bytes32 left = keccak256("left");
        bytes32 right = keccak256("right");
        
        bytes32 pairResult = SHA3Hasher.hashPair(left, right);
        bytes32 manualResult = SHA3Hasher.hash(abi.encodePacked(left, right));
        
        assertEq(pairResult, manualResult, "hashPair should match manual concatenation");
    }

    /**
     * @notice Fuzz test hashPair
     */
    function testFuzz_hashPair(bytes32 left, bytes32 right) public pure {
        bytes32 result = SHA3Hasher.hashPair(left, right);
        // Verify it equals hash of concatenation
        bytes32 expected = SHA3Hasher.hash(abi.encodePacked(left, right));
        assertEq(result, expected, "hashPair should equal hash of concatenation");
    }

    // =========================================================================
    // batchHash Tests (Gas Optimization)
    // =========================================================================

    /**
     * @notice Test batchHash with empty array
     */
    function test_batchHash_emptyArray() public pure {
        bytes32[] memory inputs = new bytes32[](0);
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        assertEq(results.length, 0, "Empty input should produce empty output");
    }

    /**
     * @notice Test batchHash with single element
     */
    function test_batchHash_singleElement() public pure {
        bytes32[] memory inputs = new bytes32[](1);
        inputs[0] = bytes32(uint256(42));
        
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        
        assertEq(results.length, 1, "Should have one result");
        bytes32 expected = SHA3Hasher.hash(abi.encodePacked(inputs[0]));
        assertEq(results[0], expected, "Batch hash should match individual hash");
    }

    /**
     * @notice Test batchHash with multiple elements
     */
    function test_batchHash_multipleElements() public pure {
        bytes32[] memory inputs = new bytes32[](3);
        inputs[0] = bytes32(uint256(1));
        inputs[1] = bytes32(uint256(2));
        inputs[2] = bytes32(uint256(3));
        
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        
        assertEq(results.length, 3, "Should have three results");
        
        // Verify each result
        for (uint256 i = 0; i < inputs.length; i++) {
            bytes32 expected = SHA3Hasher.hash(abi.encodePacked(inputs[i]));
            assertEq(results[i], expected, "Each batch result should match individual hash");
        }
    }

    /**
     * @notice Test batchHash maintains order
     */
    function test_batchHash_maintainsOrder() public pure {
        bytes32[] memory inputs = new bytes32[](5);
        for (uint256 i = 0; i < 5; i++) {
            inputs[i] = bytes32(uint256(i + 100));
        }
        
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        
        // Verify order is preserved
        for (uint256 i = 0; i < inputs.length; i++) {
            bytes32 expected = SHA3Hasher.hash(abi.encodePacked(inputs[i]));
            assertEq(results[i], expected, "Order should be preserved");
        }
    }

    /**
     * @notice Test batchHash with larger batch (stress test)
     */
    function test_batchHash_largeBatch() public pure {
        uint256 batchSize = 100;
        bytes32[] memory inputs = new bytes32[](batchSize);
        for (uint256 i = 0; i < batchSize; i++) {
            inputs[i] = bytes32(uint256(i));
        }
        
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        
        assertEq(results.length, batchSize, "Should have correct number of results");
        
        // Spot check first and last
        assertEq(results[0], SHA3Hasher.hash(abi.encodePacked(inputs[0])), "First element mismatch");
        assertEq(
            results[batchSize - 1], 
            SHA3Hasher.hash(abi.encodePacked(inputs[batchSize - 1])), 
            "Last element mismatch"
        );
    }

    // =========================================================================
    // Edge Case Tests
    // =========================================================================

    /**
     * @notice Test hash with maximum size input (rate boundary)
     * @dev Tests behavior at SHA3-256 rate boundary (136 bytes)
     */
    function test_hash_rateBoundary() public pure {
        // Exactly 136 bytes (SHA3-256 rate)
        bytes memory data136 = new bytes(136);
        for (uint256 i = 0; i < 136; i++) {
            data136[i] = bytes1(uint8(i));
        }
        
        bytes32 result = SHA3Hasher.hash(data136);
        assertTrue(result != bytes32(0), "Should handle rate boundary input");
        
        // 137 bytes (just over rate)
        bytes memory data137 = new bytes(137);
        for (uint256 i = 0; i < 137; i++) {
            data137[i] = bytes1(uint8(i));
        }
        
        bytes32 result2 = SHA3Hasher.hash(data137);
        assertTrue(result != result2, "Different sizes should produce different hashes");
    }

    /**
     * @notice Test hash with multi-block input
     * @dev Tests behavior with input spanning multiple Keccak blocks
     */
    function test_hash_multiBlock() public pure {
        // 500 bytes (spans multiple blocks)
        bytes memory data = new bytes(500);
        for (uint256 i = 0; i < 500; i++) {
            data[i] = bytes1(uint8(i % 256));
        }
        
        bytes32 result = SHA3Hasher.hash(data);
        assertTrue(result != bytes32(0), "Should handle multi-block input");
    }

    // =========================================================================
    // Gas Benchmark Tests
    // =========================================================================

    /**
     * @notice Gas benchmark for single hash (32 bytes)
     */
    function test_gas_hash32bytes() public {
        bytes memory data = abi.encodePacked(bytes32(uint256(12345)));
        
        uint256 gasBefore = gasleft();
        SHA3Hasher.hash(data);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas for hash(32 bytes)", gasUsed);
        // Should be reasonable gas (reference: ~1M gas for pure Solidity SHA3-256)
    }

    /**
     * @notice Gas benchmark for hashPair
     */
    function test_gas_hashPair() public {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        uint256 gasBefore = gasleft();
        SHA3Hasher.hashPair(left, right);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas for hashPair(64 bytes)", gasUsed);
    }

    /**
     * @notice Gas benchmark for batchHash
     * @dev Compare gas per element with individual hashing
     */
    function test_gas_batchHash_efficiency() public {
        bytes32[] memory inputs = new bytes32[](10);
        for (uint256 i = 0; i < 10; i++) {
            inputs[i] = bytes32(uint256(i));
        }
        
        // Batch hash
        uint256 gasBefore = gasleft();
        SHA3Hasher.batchHash(inputs);
        uint256 batchGas = gasBefore - gasleft();
        
        // Individual hashes
        gasBefore = gasleft();
        for (uint256 i = 0; i < inputs.length; i++) {
            SHA3Hasher.hash(abi.encodePacked(inputs[i]));
        }
        uint256 individualGas = gasBefore - gasleft();
        
        emit log_named_uint("Gas for batchHash(10 elements)", batchGas);
        emit log_named_uint("Gas for 10 individual hashes", individualGas);
        emit log_named_uint("Gas per element (batch)", batchGas / 10);
        emit log_named_uint("Gas per element (individual)", individualGas / 10);
    }

    // =========================================================================
    // CP-1 Compliance Tests
    // =========================================================================

    /**
     * @notice Verify SHA3Hasher uses SHA3-256, not keccak256
     * @dev Critical for CP-1 compliance
     */
    function test_cp1_sha3NotKeccak() public pure {
        bytes memory data = "test";
        
        // SHA3-256 hash (via SHA3Hasher)
        bytes32 sha3Result = SHA3Hasher.hash(data);
        
        // keccak256 hash (Ethereum native)
        bytes32 keccakResult = keccak256(data);
        
        // They should NOT be equal (different padding)
        assertTrue(sha3Result != keccakResult, "SHA3-256 should differ from keccak256");
    }

    /**
     * @notice Verify NIST compliance via test vectors
     */
    function test_cp1_nistCompliance() public pure {
        // Test empty string
        assertEq(
            SHA3Hasher.hash(""),
            NIST_EMPTY_HASH,
            "Empty string hash should match NIST"
        );
        
        // Test "abc"
        assertEq(
            SHA3Hasher.hash("abc"),
            NIST_ABC_HASH,
            "ABC hash should match NIST"
        );
    }
}
