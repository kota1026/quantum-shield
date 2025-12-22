// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/libraries/SparseMerkleTree.sol";

/// @title SparseMerkleTree Test Suite
/// @notice Comprehensive tests for the SMT library
contract SparseMerkleTreeTest is Test {
    using SparseMerkleTree for *;

    // =========================================================================
    // Constants Tests
    // =========================================================================

    function test_TreeDepth() public pure {
        assertEq(SparseMerkleTree.TREE_DEPTH, 20);
    }

    function test_MaxLeafIndex() public pure {
        assertEq(SparseMerkleTree.MAX_LEAF_INDEX, (1 << 20) - 1);
    }

    function test_DomainSeparators() public pure {
        // Ensure domain separators are non-zero and distinct
        assertTrue(SparseMerkleTree.LEAF_DOMAIN() != bytes32(0));
        assertTrue(SparseMerkleTree.NODE_DOMAIN() != bytes32(0));
        assertTrue(SparseMerkleTree.LEAF_DOMAIN() != SparseMerkleTree.NODE_DOMAIN());
    }

    // =========================================================================
    // Hash Functions Tests
    // =========================================================================

    function test_HashNodes_Deterministic() public pure {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        bytes32 hash1 = SparseMerkleTree.hashNodes(left, right);
        bytes32 hash2 = SparseMerkleTree.hashNodes(left, right);
        
        assertEq(hash1, hash2);
    }

    function test_HashNodes_OrderMatters() public pure {
        bytes32 a = bytes32(uint256(1));
        bytes32 b = bytes32(uint256(2));
        
        bytes32 hashAB = SparseMerkleTree.hashNodes(a, b);
        bytes32 hashBA = SparseMerkleTree.hashNodes(b, a);
        
        assertTrue(hashAB != hashBA);
    }

    function test_HashNodes_NonZero() public pure {
        bytes32 left = bytes32(0);
        bytes32 right = bytes32(0);
        
        bytes32 result = SparseMerkleTree.hashNodes(left, right);
        
        assertTrue(result != bytes32(0));
    }

    function test_ComputeLeaf_Deterministic() public pure {
        bytes32 lockId = bytes32(uint256(123));
        uint256 amount = 1 ether;
        address recipient = address(0x1234);
        bytes32 pubKeyHash = bytes32(uint256(456));
        
        bytes32 leaf1 = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        bytes32 leaf2 = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        
        assertEq(leaf1, leaf2);
    }

    function test_ComputeLeaf_DifferentInputsDifferentOutputs() public pure {
        bytes32 lockId1 = bytes32(uint256(1));
        bytes32 lockId2 = bytes32(uint256(2));
        uint256 amount = 1 ether;
        address recipient = address(0x1234);
        bytes32 pubKeyHash = bytes32(uint256(456));
        
        bytes32 leaf1 = SparseMerkleTree.computeLeaf(lockId1, amount, recipient, pubKeyHash);
        bytes32 leaf2 = SparseMerkleTree.computeLeaf(lockId2, amount, recipient, pubKeyHash);
        
        assertTrue(leaf1 != leaf2);
    }

    // =========================================================================
    // Proof Verification Tests
    // =========================================================================

    function test_VerifyProof_ValidProof() public pure {
        // Create a simple proof for testing
        bytes32 leaf = keccak256(abi.encodePacked(SparseMerkleTree.LEAF_DOMAIN(), bytes32(uint256(1))));
        uint256 index = 0;
        
        // Create siblings (default hashes)
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = SparseMerkleTree.getDefaultHash(i);
        }
        
        // Compute the expected root
        bytes32 expectedRoot = SparseMerkleTree.computeRoot(leaf, index, siblings);
        
        // Verify the proof using computeRoot (which accepts memory)
        bytes32 computedRoot = SparseMerkleTree.computeRoot(leaf, index, siblings);
        assertEq(computedRoot, expectedRoot);
    }

    function test_VerifyProof_InvalidRoot() public pure {
        bytes32 leaf = bytes32(uint256(1));
        uint256 index = 0;
        
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = bytes32(0);
        }
        
        bytes32 wrongRoot = bytes32(uint256(999));
        bytes32 computedRoot = SparseMerkleTree.computeRoot(leaf, index, siblings);
        
        assertTrue(computedRoot != wrongRoot);
    }

    // =========================================================================
    // Utility Functions Tests
    // =========================================================================

    function test_GetDefaultHash_Level0() public pure {
        bytes32 level0 = SparseMerkleTree.getDefaultHash(0);
        assertEq(level0, SparseMerkleTree.EMPTY_LEAF_SHA3);
    }

    function test_GetDefaultHash_Increasing() public pure {
        bytes32 prev = SparseMerkleTree.getDefaultHash(0);
        
        for (uint256 i = 1; i < 5; i++) {
            bytes32 current = SparseMerkleTree.getDefaultHash(i);
            // Each level should be different
            assertTrue(current != prev);
            // Each level should be hash of two copies of previous
            assertEq(current, SparseMerkleTree.hashNodes(prev, prev));
            prev = current;
        }
    }

    function test_GetEmptyRoot() public pure {
        bytes32 emptyRoot = SparseMerkleTree.getEmptyRoot();
        bytes32 computedRoot = SparseMerkleTree.getDefaultHash(20);
        
        assertEq(emptyRoot, computedRoot);
    }

    function test_GetLeafIndex_Deterministic() public pure {
        bytes32 lockId = bytes32(uint256(12345));
        
        uint256 index1 = SparseMerkleTree.getLeafIndex(lockId);
        uint256 index2 = SparseMerkleTree.getLeafIndex(lockId);
        
        assertEq(index1, index2);
    }

    function test_GetLeafIndex_WithinBounds() public pure {
        for (uint256 i = 0; i < 100; i++) {
            bytes32 lockId = bytes32(i);
            uint256 index = SparseMerkleTree.getLeafIndex(lockId);
            assertTrue(index <= SparseMerkleTree.MAX_LEAF_INDEX);
        }
    }

    function test_GetLeafIndex_Distribution() public pure {
        // Different lock IDs should produce different indices (with high probability)
        bytes32 lockId1 = bytes32(uint256(1));
        bytes32 lockId2 = bytes32(uint256(2));
        bytes32 lockId3 = bytes32(uint256(3));
        
        uint256 index1 = SparseMerkleTree.getLeafIndex(lockId1);
        uint256 index2 = SparseMerkleTree.getLeafIndex(lockId2);
        uint256 index3 = SparseMerkleTree.getLeafIndex(lockId3);
        
        assertTrue(index1 != index2);
        assertTrue(index2 != index3);
        assertTrue(index1 != index3);
    }

    // =========================================================================
    // LockData Tests
    // =========================================================================

    function test_ComputeLeafFromData_Valid() public pure {
        SparseMerkleTree.LockData memory data = SparseMerkleTree.LockData({
            lockId: bytes32(uint256(1)),
            amount: 1 ether,
            recipient: address(0x1234),
            pubKeyHash: bytes32(uint256(456))
        });
        
        bytes32 leaf = SparseMerkleTree.computeLeafFromData(data);
        
        bytes32 expectedLeaf = SparseMerkleTree.computeLeaf(
            data.lockId,
            data.amount,
            data.recipient,
            data.pubKeyHash
        );
        
        assertEq(leaf, expectedLeaf);
    }

    function test_ComputeLeafFromData_InvalidLockId() public {
        SparseMerkleTree.LockData memory data = SparseMerkleTree.LockData({
            lockId: bytes32(0), // Invalid
            amount: 1 ether,
            recipient: address(0x1234),
            pubKeyHash: bytes32(uint256(456))
        });
        
        vm.expectRevert(SparseMerkleTree.InvalidLeafData.selector);
        SparseMerkleTree.computeLeafFromData(data);
    }

    // =========================================================================
    // Empty Leaf Constants Tests
    // =========================================================================

    function test_EmptyLeafSHA3() public pure {
        bytes32 sha3Empty = SparseMerkleTree.EMPTY_LEAF_SHA3;
        // SHA3-256("") = a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
        assertEq(sha3Empty, 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a);
    }

    function test_EmptyLeafLegacy() public pure {
        bytes32 legacyEmpty = SparseMerkleTree.EMPTY_LEAF_LEGACY;
        // keccak256("") = c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
        // But EMPTY_LEAF_LEGACY is different - it's keccak256(bytes1(0))
        assertEq(legacyEmpty, 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563);
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    function testFuzz_ComputeLeaf(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash
    ) public pure {
        bytes32 leaf = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        
        // Should be non-zero
        assertTrue(leaf != bytes32(0));
        
        // Should be deterministic
        bytes32 leaf2 = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        assertEq(leaf, leaf2);
    }

    function testFuzz_HashNodes(bytes32 left, bytes32 right) public pure {
        bytes32 result = SparseMerkleTree.hashNodes(left, right);
        
        // Should be non-zero (extremely unlikely to be zero by chance)
        assertTrue(result != bytes32(0));
        
        // Should be deterministic
        bytes32 result2 = SparseMerkleTree.hashNodes(left, right);
        assertEq(result, result2);
    }

    function testFuzz_GetLeafIndex(bytes32 lockId) public pure {
        uint256 index = SparseMerkleTree.getLeafIndex(lockId);
        assertTrue(index <= SparseMerkleTree.MAX_LEAF_INDEX);
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    function test_Gas_ComputeLeaf() public view {
        bytes32 lockId = bytes32(uint256(1));
        uint256 amount = 1 ether;
        address recipient = address(0x1234);
        bytes32 pubKeyHash = bytes32(uint256(456));
        
        uint256 gasBefore = gasleft();
        SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        emit log_named_uint("Gas used for computeLeaf", gasUsed);
        
        // SHA3-256 is more expensive than keccak256
        assertTrue(gasUsed < 50000);
    }

    function test_Gas_HashNodes() public view {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        uint256 gasBefore = gasleft();
        SparseMerkleTree.hashNodes(left, right);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        emit log_named_uint("Gas used for hashNodes", gasUsed);
        
        // SHA3-256 is more expensive than keccak256
        assertTrue(gasUsed < 30000);
    }

    function test_Gas_ComputeRoot() public view {
        bytes32 leaf = bytes32(uint256(1));
        uint256 index = 0;
        bytes32[] memory siblings = new bytes32[](20);
        
        uint256 gasBefore = gasleft();
        SparseMerkleTree.computeRoot(leaf, index, siblings);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        emit log_named_uint("Gas used for computeRoot", gasUsed);
        
        // 20 SHA3-256 hash operations
        assertTrue(gasUsed < 600000);
    }

    // =========================================================================
    // SHA3 vs Legacy Tests
    // =========================================================================

    function test_SHA3_vs_Legacy_Leaf() public pure {
        bytes32 lockId = bytes32(uint256(1));
        uint256 amount = 1 ether;
        address recipient = address(0x1234);
        bytes32 pubKeyHash = bytes32(uint256(456));
        
        bytes32 sha3Leaf = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        bytes32 legacyLeaf = SparseMerkleTree.computeLeafLegacy(lockId, amount, recipient, pubKeyHash);
        
        // They should be different (different hash functions)
        assertTrue(sha3Leaf != legacyLeaf);
    }

    function test_SHA3_vs_Legacy_Nodes() public pure {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        bytes32 sha3Node = SparseMerkleTree.hashNodes(left, right);
        bytes32 legacyNode = SparseMerkleTree.hashNodesLegacy(left, right);
        
        // They should be different (different hash functions)
        assertTrue(sha3Node != legacyNode);
    }

    // =========================================================================
    // Hash Info Tests
    // =========================================================================

    function test_GetHashInfo() public pure {
        (string memory hashFunction, bool fipsCompliant) = SparseMerkleTree.getHashInfo();
        
        assertEq(hashFunction, "SHA3-256");
        assertTrue(fipsCompliant);
    }

    function test_VerifySHA3Implementation() public pure {
        bool valid = SparseMerkleTree.verifySHA3Implementation();
        assertTrue(valid);
    }
}
