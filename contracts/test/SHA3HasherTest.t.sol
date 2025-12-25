// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/libraries/SHA3Hasher.sol";

/**
 * @title SHA3HasherTest
 * @notice Unit tests for SHA3Hasher library
 * @dev TEST-001: 100% coverage target for SHA3Hasher.sol
 */
contract SHA3HasherTest is Test {
    bytes32 constant NIST_EMPTY_HASH = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;
    bytes32 constant NIST_ABC_HASH = 0x3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532;

    function test_hash_emptyBytes() public pure {
        bytes memory empty = "";
        bytes32 result = SHA3Hasher.hash(empty);
        assertEq(result, NIST_EMPTY_HASH, "Empty hash should match NIST test vector");
    }

    function test_hash_abc() public pure {
        bytes memory abc = "abc";
        bytes32 result = SHA3Hasher.hash(abc);
        assertEq(result, NIST_ABC_HASH, "ABC hash should match NIST test vector");
    }

    function test_hash_deterministic() public pure {
        bytes memory data = "quantum shield test data";
        bytes32 hash1 = SHA3Hasher.hash(data);
        bytes32 hash2 = SHA3Hasher.hash(data);
        assertEq(hash1, hash2, "Hash should be deterministic");
    }

    function test_hash_collisionResistance() public pure {
        bytes memory data1 = "input1";
        bytes memory data2 = "input2";
        bytes32 hash1 = SHA3Hasher.hash(data1);
        bytes32 hash2 = SHA3Hasher.hash(data2);
        assertTrue(hash1 != hash2, "Different inputs should produce different hashes");
    }

    function testFuzz_hash_outputLength(bytes calldata data) public pure {
        bytes32 result = SHA3Hasher.hash(data);
        assertTrue(result != bytes32(0) || data.length == 0, "Hash should be non-zero for non-trivial input");
    }

    function test_hashPair_zeros() public pure {
        bytes32 left = bytes32(0);
        bytes32 right = bytes32(0);
        bytes32 result = SHA3Hasher.hashPair(left, right);
        bytes memory combined = abi.encodePacked(left, right);
        bytes32 expected = SHA3Hasher.hash(combined);
        assertEq(result, expected, "hashPair should equal hash of concatenated values");
    }

    function test_hashPair_notCommutative() public pure {
        bytes32 a = bytes32(uint256(1));
        bytes32 b = bytes32(uint256(2));
        bytes32 hash_ab = SHA3Hasher.hashPair(a, b);
        bytes32 hash_ba = SHA3Hasher.hashPair(b, a);
        assertTrue(hash_ab != hash_ba, "hashPair should not be commutative");
    }

    function test_hashPair_consistentWithHash() public pure {
        bytes32 left = keccak256("left");
        bytes32 right = keccak256("right");
        bytes32 pairResult = SHA3Hasher.hashPair(left, right);
        bytes32 manualResult = SHA3Hasher.hash(abi.encodePacked(left, right));
        assertEq(pairResult, manualResult, "hashPair should match manual concatenation");
    }

    function testFuzz_hashPair(bytes32 left, bytes32 right) public pure {
        bytes32 result = SHA3Hasher.hashPair(left, right);
        bytes32 expected = SHA3Hasher.hash(abi.encodePacked(left, right));
        assertEq(result, expected, "hashPair should equal hash of concatenation");
    }

    function test_batchHash_emptyArray() public pure {
        bytes32[] memory inputs = new bytes32[](0);
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        assertEq(results.length, 0, "Empty input should produce empty output");
    }

    function test_batchHash_singleElement() public pure {
        bytes32[] memory inputs = new bytes32[](1);
        inputs[0] = bytes32(uint256(42));
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        assertEq(results.length, 1, "Should have one result");
        bytes32 expected = SHA3Hasher.hash(abi.encodePacked(inputs[0]));
        assertEq(results[0], expected, "Batch hash should match individual hash");
    }

    function test_batchHash_multipleElements() public pure {
        bytes32[] memory inputs = new bytes32[](3);
        inputs[0] = bytes32(uint256(1));
        inputs[1] = bytes32(uint256(2));
        inputs[2] = bytes32(uint256(3));
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        assertEq(results.length, 3, "Should have three results");
        for (uint256 i = 0; i < inputs.length; i++) {
            bytes32 expected = SHA3Hasher.hash(abi.encodePacked(inputs[i]));
            assertEq(results[i], expected, "Each batch result should match individual hash");
        }
    }

    function test_batchHash_maintainsOrder() public pure {
        bytes32[] memory inputs = new bytes32[](5);
        for (uint256 i = 0; i < 5; i++) {
            inputs[i] = bytes32(uint256(i + 100));
        }
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        for (uint256 i = 0; i < inputs.length; i++) {
            bytes32 expected = SHA3Hasher.hash(abi.encodePacked(inputs[i]));
            assertEq(results[i], expected, "Order should be preserved");
        }
    }

    function test_batchHash_largeBatch() public pure {
        uint256 batchSize = 100;
        bytes32[] memory inputs = new bytes32[](batchSize);
        for (uint256 i = 0; i < batchSize; i++) {
            inputs[i] = bytes32(uint256(i));
        }
        bytes32[] memory results = SHA3Hasher.batchHash(inputs);
        assertEq(results.length, batchSize, "Should have correct number of results");
        assertEq(results[0], SHA3Hasher.hash(abi.encodePacked(inputs[0])), "First element mismatch");
        assertEq(results[batchSize - 1], SHA3Hasher.hash(abi.encodePacked(inputs[batchSize - 1])), "Last element mismatch");
    }

    function test_hash_rateBoundary() public pure {
        bytes memory data136 = new bytes(136);
        for (uint256 i = 0; i < 136; i++) {
            data136[i] = bytes1(uint8(i));
        }
        bytes32 result = SHA3Hasher.hash(data136);
        assertTrue(result != bytes32(0), "Should handle rate boundary input");
        bytes memory data137 = new bytes(137);
        for (uint256 i = 0; i < 137; i++) {
            data137[i] = bytes1(uint8(i));
        }
        bytes32 result2 = SHA3Hasher.hash(data137);
        assertTrue(result != result2, "Different sizes should produce different hashes");
    }

    function test_hash_multiBlock() public pure {
        bytes memory data = new bytes(500);
        for (uint256 i = 0; i < 500; i++) {
            data[i] = bytes1(uint8(i % 256));
        }
        bytes32 result = SHA3Hasher.hash(data);
        assertTrue(result != bytes32(0), "Should handle multi-block input");
    }

    function test_gas_hash32bytes() public {
        bytes memory data = abi.encodePacked(bytes32(uint256(12345)));
        uint256 gasBefore = gasleft();
        SHA3Hasher.hash(data);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("Gas for hash(32 bytes)", gasUsed);
    }

    function test_gas_hashPair() public {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        uint256 gasBefore = gasleft();
        SHA3Hasher.hashPair(left, right);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("Gas for hashPair(64 bytes)", gasUsed);
    }

    function test_gas_batchHash_efficiency() public {
        bytes32[] memory inputs = new bytes32[](10);
        for (uint256 i = 0; i < 10; i++) {
            inputs[i] = bytes32(uint256(i));
        }
        uint256 gasBefore = gasleft();
        SHA3Hasher.batchHash(inputs);
        uint256 batchGas = gasBefore - gasleft();
        gasBefore = gasleft();
        for (uint256 i = 0; i < inputs.length; i++) {
            SHA3Hasher.hash(abi.encodePacked(inputs[i]));
        }
        uint256 individualGas = gasBefore - gasleft();
        emit log_named_uint("Gas for batchHash(10 elements)", batchGas);
        emit log_named_uint("Gas for 10 individual hashes", individualGas);
    }

    function test_cp1_sha3NotKeccak() public pure {
        bytes memory data = "test";
        bytes32 sha3Result = SHA3Hasher.hash(data);
        bytes32 keccakResult = keccak256(data);
        assertTrue(sha3Result != keccakResult, "SHA3-256 should differ from keccak256");
    }

    function test_cp1_nistCompliance() public pure {
        assertEq(SHA3Hasher.hash(""), NIST_EMPTY_HASH, "Empty string hash should match NIST");
        assertEq(SHA3Hasher.hash("abc"), NIST_ABC_HASH, "ABC hash should match NIST");
    }
}
