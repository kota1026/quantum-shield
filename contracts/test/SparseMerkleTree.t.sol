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
        assertTrue(SparseMerkleTree.LEAF_DOMAIN != bytes32(0));
        assertTrue(SparseMerkleTree.NODE_DOMAIN != bytes32(0));
        assertTrue(SparseMerkleTree.LEAF_DOMAIN != SparseMerkleTree.NODE_DOMAIN);
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
        // This is a minimal test - in production, proofs come from L3
        bytes32 leaf = keccak256(abi.encodePacked(SparseMerkleTree.LEAF_DOMAIN, bytes32(uint256(1))));
        uint256 index = 0;
        
        // Create siblings (all zeros for simplicity)
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = SparseMerkleTree.getDefaultHash(i);
        }
        
        // Compute the expected root
        bytes32 expectedRoot = SparseMerkleTree.computeRoot(leaf, index, siblings);
        
        // Verify the proof
        bool valid = SparseMerkleTree.verifyProof(leaf, index, siblings, expectedRoot);
        assertTrue(valid);
    }

    function test_VerifyProof_InvalidRoot() public pure {
        bytes32 leaf = bytes32(uint256(1));
        uint256 index = 0;
        
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = bytes32(0);
        }
        
        bytes32 wrongRoot = bytes32(uint256(999));
        
        bool valid = SparseMerkleTree.verifyProof(leaf, index, siblings, wrongRoot);
        assertFalse(valid);
    }

    function test_VerifyProof_InvalidSiblingsLength() public {
        bytes32 leaf = bytes32(uint256(1));
        uint256 index = 0;
        
        // Wrong length
        bytes32[] memory siblings = new bytes32[](19);
        bytes32 root = bytes32(0);
        
        vm.expectRevert(SparseMerkleTree.InvalidProofLength.selector);
        SparseMerkleTree.verifyProof(leaf, index, siblings, root);
    }

    function test_VerifyProof_IndexOutOfBounds() public {
        bytes32 leaf = bytes32(uint256(1));
        uint256 index = SparseMerkleTree.MAX_LEAF_INDEX + 1; // Out of bounds
        
        bytes32[] memory siblings = new bytes32[](20);
        bytes32 root = bytes32(0);
        
        vm.expectRevert(SparseMerkleTree.IndexOutOfBounds.selector);
        SparseMerkleTree.verifyProof(leaf, index, siblings, root);
    }

    // =========================================================================
    // Utility Functions Tests
    // =========================================================================

    function test_GetDefaultHash_Level0() public pure {
        bytes32 level0 = SparseMerkleTree.getDefaultHash(0);
        assertEq(level0, SparseMerkleTree.EMPTY_LEAF);
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
    // Batch Verification Tests
    // =========================================================================

    function test_VerifyBatch_Empty() public pure {
        bytes32[] memory leaves = new bytes32[](0);
        uint256[] memory indices = new uint256[](0);
        bytes32[] memory allSiblings = new bytes32[](0);
        bytes32 root = bytes32(0);
        
        uint256 validCount = SparseMerkleTree.verifyBatch(leaves, indices, allSiblings, root);
        assertEq(validCount, 0);
    }

    function test_VerifyBatch_LengthMismatch() public {
        bytes32[] memory leaves = new bytes32[](2);
        uint256[] memory indices = new uint256[](1); // Mismatch
        bytes32[] memory allSiblings = new bytes32[](40);
        bytes32 root = bytes32(0);
        
        vm.expectRevert(SparseMerkleTree.InvalidProofLength.selector);
        SparseMerkleTree.verifyBatch(leaves, indices, allSiblings, root);
    }

    function test_VerifyBatch_SiblingsMismatch() public {
        bytes32[] memory leaves = new bytes32[](2);
        uint256[] memory indices = new uint256[](2);
        bytes32[] memory allSiblings = new bytes32[](20); // Should be 40
        bytes32 root = bytes32(0);
        
        vm.expectRevert(SparseMerkleTree.InvalidProofLength.selector);
        SparseMerkleTree.verifyBatch(leaves, indices, allSiblings, root);
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
        
        // Should be reasonably efficient
        assertTrue(gasUsed < 1000);
    }

    function test_Gas_HashNodes() public view {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        uint256 gasBefore = gasleft();
        SparseMerkleTree.hashNodes(left, right);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        emit log_named_uint("Gas used for hashNodes", gasUsed);
        
        assertTrue(gasUsed < 500);
    }

    function test_Gas_VerifyProof() public view {
        bytes32 leaf = bytes32(uint256(1));
        uint256 index = 0;
        bytes32[] memory siblings = new bytes32[](20);
        
        bytes32 root = SparseMerkleTree.computeRoot(leaf, index, siblings);
        
        uint256 gasBefore = gasleft();
        SparseMerkleTree.verifyProof(leaf, index, siblings, root);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        emit log_named_uint("Gas used for verifyProof", gasUsed);
        
        // 20 hash operations should be under 15000 gas
        assertTrue(gasUsed < 15000);
    }
}
