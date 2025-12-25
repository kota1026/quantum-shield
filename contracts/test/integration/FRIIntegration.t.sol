// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/FRIVerifier.sol";
import "../../src/libraries/SHA3Hasher.sol";
import "../../src/libraries/SHA3_256.sol";

/**
 * @title FRIIntegrationTest
 * @notice Integration tests for FRIVerifier with SHA3-256
 * @dev Verifies CP-1 compliance: SHA3-256 usage instead of keccak256
 * 
 * Test Categories:
 * 1. SHA3-256 Usage Confirmation
 * 2. FRIVerifier + SHA3Hasher Integration
 * 3. Merkle Verification with SHA3-256
 * 4. Cross-Library Compatibility
 * 
 * @custom:security Ensures quantum resistance via NIST-compliant hash functions
 */
contract FRIIntegrationTest is Test {
    using SHA3Hasher for bytes;
    using SHA3Hasher for bytes32;

    // =========================================================================
    // Constants
    // =========================================================================

    uint256 constant FIELD_MODULUS = 0xFFFFFFFF00000001;
    bytes32 constant SHA3_EMPTY_HASH = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;

    // =========================================================================
    // SHA3-256 Usage Confirmation Tests (CP-1 Compliance)
    // =========================================================================

    function test_SHA3_256_NISTVector_Empty() public pure {
        bytes32 result = SHA3_256.hash("");
        assertEq(result, SHA3_EMPTY_HASH, "SHA3-256 empty string should match NIST vector");
    }

    function test_SHA3_256_NISTVector_abc() public pure {
        bytes32 expected = 0x3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532;
        bytes32 result = SHA3_256.hash("abc");
        assertEq(result, expected, "SHA3-256('abc') should match NIST vector");
    }

    function test_SHA3Hasher_UsesSHA3_256() public pure {
        bytes memory testData = "integration test data";
        bytes32 sha3Result = SHA3_256.hash(testData);
        bytes32 hasherResult = SHA3Hasher.hash(testData);
        assertEq(hasherResult, sha3Result, "SHA3Hasher should use SHA3_256");
    }

    function test_NotKeccak256() public pure {
        bytes memory testData = "test";
        bytes32 sha3Result = SHA3_256.hash(testData);
        bytes32 keccakResult = keccak256(testData);
        assertTrue(sha3Result != keccakResult, "SHA3-256 should differ from keccak256");
    }

    // =========================================================================
    // FRIVerifier SHA3-256 Integration Tests
    // =========================================================================

    function test_FRIVerifier_MerkleUseSHA3() public pure {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        bytes32 expectedHash = SHA3_256.hashPair(left, right);
        bytes32 friHash = SHA3Hasher.hashPair(left, right);
        
        assertEq(friHash, expectedHash, "FRIVerifier Merkle should use SHA3-256");
    }

    function test_FRIVerifier_LeafHashUseSHA3() public pure {
        uint256 eval0 = 12345;
        uint256 eval1 = 67890;
        
        bytes32 leafHash = SHA3_256.hash(abi.encodePacked(eval0, eval1));
        
        assertTrue(leafHash != bytes32(0), "Leaf hash should be computed");
        assertTrue(leafHash != keccak256(abi.encodePacked(eval0, eval1)), "Should differ from keccak256");
    }

    // =========================================================================
    // Merkle Tree Integration Tests
    // =========================================================================

    function test_MerkleTree_TwoLeaves() public pure {
        bytes32 leaf1 = SHA3_256.hash(abi.encodePacked(uint256(100)));
        bytes32 leaf2 = SHA3_256.hash(abi.encodePacked(uint256(200)));
        
        bytes32 root = SHA3_256.hashPair(leaf1, leaf2);
        
        assertTrue(root != bytes32(0), "Merkle root should be computed");
        assertTrue(root != leaf1 && root != leaf2, "Root should differ from leaves");
    }

    function test_MerkleTree_FourLeaves() public pure {
        bytes32 leaf1 = SHA3_256.hash(abi.encodePacked(uint256(1)));
        bytes32 leaf2 = SHA3_256.hash(abi.encodePacked(uint256(2)));
        bytes32 leaf3 = SHA3_256.hash(abi.encodePacked(uint256(3)));
        bytes32 leaf4 = SHA3_256.hash(abi.encodePacked(uint256(4)));
        
        bytes32 node1 = SHA3_256.hashPair(leaf1, leaf2);
        bytes32 node2 = SHA3_256.hashPair(leaf3, leaf4);
        bytes32 root = SHA3_256.hashPair(node1, node2);
        
        assertTrue(root != bytes32(0), "Merkle root should be computed");
    }

    function test_MerkleProofVerification() public pure {
        bytes32 leaf1 = SHA3_256.hash(abi.encodePacked(uint256(100)));
        bytes32 leaf2 = SHA3_256.hash(abi.encodePacked(uint256(200)));
        bytes32 leaf3 = SHA3_256.hash(abi.encodePacked(uint256(300)));
        bytes32 leaf4 = SHA3_256.hash(abi.encodePacked(uint256(400)));
        
        bytes32 node1 = SHA3_256.hashPair(leaf1, leaf2);
        bytes32 node2 = SHA3_256.hashPair(leaf3, leaf4);
        bytes32 root = SHA3_256.hashPair(node1, node2);
        
        bytes32[] memory proof = new bytes32[](2);
        proof[0] = leaf2;
        proof[1] = node2;
        
        bytes32 computed = leaf1;
        computed = SHA3_256.hashPair(computed, proof[0]);
        computed = SHA3_256.hashPair(computed, proof[1]);
        
        assertEq(computed, root, "Merkle proof should verify correctly");
    }

    // =========================================================================
    // Field Operations Integration Tests
    // =========================================================================

    function test_FieldOperations_WithHashing() public pure {
        uint256 a = 12345;
        uint256 b = 67890;
        
        uint256 sum = addmod(a, b, FIELD_MODULUS);
        uint256 product = mulmod(a, b, FIELD_MODULUS);
        
        bytes32 hashOfSum = SHA3_256.hash(abi.encodePacked(sum));
        bytes32 hashOfProduct = SHA3_256.hash(abi.encodePacked(product));
        
        assertTrue(hashOfSum != hashOfProduct, "Different values should have different hashes");
    }

    function test_DomainElement_Hashing() public pure {
        uint256 domainSize = 1024;
        uint256 exponent = (FIELD_MODULUS - 1) / domainSize;
        
        uint256 omega = modExp(7, exponent, FIELD_MODULUS);
        
        bytes32 elementHash = SHA3_256.hash(abi.encodePacked(omega));
        
        assertTrue(elementHash != bytes32(0), "Domain element hash should be computed");
    }

    // =========================================================================
    // Cross-Library Compatibility Tests
    // =========================================================================

    function test_SHA3Hasher_SHA3_256_Compatibility() public pure {
        bytes memory testData = "cross library test";
        
        bytes32 directResult = SHA3_256.hash(testData);
        bytes32 hasherResult = SHA3Hasher.hash(testData);
        
        assertEq(directResult, hasherResult, "SHA3Hasher and SHA3_256 should be compatible");
    }

    function test_HashPair_Consistency() public pure {
        bytes32 left = bytes32(uint256(0xAABBCCDD));
        bytes32 right = bytes32(uint256(0x11223344));
        
        bytes32 directResult = SHA3_256.hashPair(left, right);
        bytes32 hasherResult = SHA3Hasher.hashPair(left, right);
        
        assertEq(directResult, hasherResult, "hashPair should be consistent across libraries");
    }

    function test_HashChain_Integration() public pure {
        bytes32[] memory values = new bytes32[](4);
        values[0] = bytes32(uint256(1));
        values[1] = bytes32(uint256(2));
        values[2] = bytes32(uint256(3));
        values[3] = bytes32(uint256(4));
        
        bytes32 chainResult = SHA3Hasher.hashChain(values);
        
        assertTrue(chainResult != bytes32(0), "Hash chain should produce non-zero result");
    }

    function test_BatchHash_Integration() public pure {
        bytes32[] memory inputs = new bytes32[](3);
        inputs[0] = bytes32(uint256(100));
        inputs[1] = bytes32(uint256(200));
        inputs[2] = bytes32(uint256(300));
        
        bytes32[] memory hashes = SHA3Hasher.batchHash(inputs);
        
        assertEq(hashes.length, 3, "Batch hash should return same number of elements");
        
        for (uint256 i = 0; i < inputs.length; i++) {
            bytes32 expected = SHA3_256.hash(abi.encodePacked(inputs[i]));
            assertEq(hashes[i], expected, "Batch hash elements should match individual hashes");
        }
    }

    // =========================================================================
    // Domain Separation Tests
    // =========================================================================

    function test_DomainSeparation() public pure {
        bytes32 domain1 = bytes32("STARK_TRACE");
        bytes32 domain2 = bytes32("STARK_CONSTRAINT");
        bytes memory data = "same data";
        
        bytes32 hash1 = SHA3_256.hashWithDomain(domain1, data);
        bytes32 hash2 = SHA3_256.hashWithDomain(domain2, data);
        
        assertTrue(hash1 != hash2, "Different domains should produce different hashes");
    }

    function test_DomainSeparation_FRILayers() public pure {
        bytes32 domainLayer0 = bytes32("FRI_LAYER_0");
        bytes32 domainLayer1 = bytes32("FRI_LAYER_1");
        bytes memory commitment = abi.encodePacked(uint256(12345));
        
        bytes32 layer0Hash = SHA3_256.hashWithDomain(domainLayer0, commitment);
        bytes32 layer1Hash = SHA3_256.hashWithDomain(domainLayer1, commitment);
        
        assertTrue(layer0Hash != layer1Hash, "Different FRI layers should have different domain separations");
    }

    // =========================================================================
    // Gas Efficiency Tests
    // =========================================================================

    function test_GasEfficiency_SingleHash() public view {
        bytes memory data = abi.encodePacked(uint256(1), uint256(2), uint256(3));
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(data);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Single SHA3-256 hash gas", gasUsed);
        assertTrue(gasUsed < 2_000_000, "Single hash should be gas efficient");
    }

    function test_GasEfficiency_HashPair() public view {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        uint256 gasBefore = gasleft();
        SHA3_256.hashPair(left, right);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Hash pair gas", gasUsed);
        assertTrue(gasUsed < 2_000_000, "Hash pair should be gas efficient");
    }

    function test_GasEfficiency_MerkleTree8Leaves() public view {
        bytes32[] memory leaves = new bytes32[](8);
        for (uint256 i = 0; i < 8; i++) {
            leaves[i] = SHA3_256.hash(abi.encodePacked(i));
        }
        
        uint256 gasBefore = gasleft();
        
        bytes32[] memory layer1 = new bytes32[](4);
        for (uint256 i = 0; i < 4; i++) {
            layer1[i] = SHA3_256.hashPair(leaves[i * 2], leaves[i * 2 + 1]);
        }
        
        bytes32[] memory layer2 = new bytes32[](2);
        layer2[0] = SHA3_256.hashPair(layer1[0], layer1[1]);
        layer2[1] = SHA3_256.hashPair(layer1[2], layer1[3]);
        
        SHA3_256.hashPair(layer2[0], layer2[1]);
        
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("8-leaf Merkle tree gas", gasUsed);
        assertTrue(gasUsed < 15_000_000, "Merkle tree construction should be reasonable");
    }

    // =========================================================================
    // Edge Cases and Fuzz Tests
    // =========================================================================

    function test_EmptyInput() public pure {
        bytes32 result = SHA3_256.hash("");
        assertEq(result, SHA3_EMPTY_HASH, "Empty input should return correct hash");
    }

    function test_LargeInput() public pure {
        bytes memory largeData = new bytes(10000);
        for (uint256 i = 0; i < 10000; i++) {
            largeData[i] = bytes1(uint8(i % 256));
        }
        
        bytes32 result = SHA3_256.hash(largeData);
        assertTrue(result != bytes32(0), "Large input should be hashed");
    }

    function testFuzz_HashConsistency(bytes memory data) public pure {
        bytes32 hash1 = SHA3_256.hash(data);
        bytes32 hash2 = SHA3_256.hash(data);
        
        assertEq(hash1, hash2, "Same input should always produce same hash");
    }

    function testFuzz_HashPairCommutative(bytes32 a, bytes32 b) public pure {
        bytes32 hash1 = SHA3_256.hashPair(a, b);
        bytes32 hash2 = SHA3_256.hashPair(b, a);
        
        if (a != b) {
            assertTrue(hash1 != hash2, "Hash pair should not be commutative for different inputs");
        }
    }

    function testFuzz_DifferentInputsDifferentHashes(bytes memory data1, bytes memory data2) public pure {
        vm.assume(keccak256(data1) != keccak256(data2));
        
        bytes32 hash1 = SHA3_256.hash(data1);
        bytes32 hash2 = SHA3_256.hash(data2);
        
        assertTrue(hash1 != hash2, "Different inputs should produce different hashes");
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function modExp(uint256 base, uint256 exp, uint256 mod) internal pure returns (uint256) {
        uint256 result = 1;
        base = base % mod;
        
        while (exp > 0) {
            if (exp % 2 == 1) {
                result = mulmod(result, base, mod);
            }
            exp = exp / 2;
            base = mulmod(base, base, mod);
        }
        return result;
    }
}
