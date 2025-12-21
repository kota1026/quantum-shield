// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/libraries/SparseMerkleTree.sol";

/// @title SparseMerkleTree Library Tests
/// @notice Tests for SMT verification library
contract SparseMerkleTreeTest is Test {
    using SparseMerkleTree for *;

    // =========================================================================
    // Constants Tests
    // =========================================================================

    function test_Constants() public pure {
        assertEq(SparseMerkleTree.TREE_DEPTH, 20);
        assertEq(SparseMerkleTree.MAX_LEAF_INDEX, (1 << 20) - 1);
        assertNotEq(SparseMerkleTree.EMPTY_LEAF, bytes32(0));
        assertNotEq(SparseMerkleTree.LEAF_DOMAIN, bytes32(0));
        assertNotEq(SparseMerkleTree.NODE_DOMAIN, bytes32(0));
    }

    // =========================================================================
    // Hash Functions Tests
    // =========================================================================

    function test_HashNodes() public pure {
        bytes32 left = keccak256("left");
        bytes32 right = keccak256("right");
        
        bytes32 parent = SparseMerkleTree.hashNodes(left, right);
        
        // Should be deterministic
        bytes32 parent2 = SparseMerkleTree.hashNodes(left, right);
        assertEq(parent, parent2);
        
        // Should not be zero
        assertNotEq(parent, bytes32(0));
        
        // Order matters
        bytes32 reversed = SparseMerkleTree.hashNodes(right, left);
        assertNotEq(parent, reversed);
    }

    function test_ComputeLeaf() public pure {
        bytes32 lockId = keccak256("lock1");
        uint256 amount = 1 ether;
        address recipient = address(0x1234);
        bytes32 pubKeyHash = keccak256("pubkey");
        
        bytes32 leaf = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        
        // Should be deterministic
        bytes32 leaf2 = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        assertEq(leaf, leaf2);
        
        // Should not be zero
        assertNotEq(leaf, bytes32(0));
        
        // Different inputs should produce different leaves
        bytes32 differentLeaf = SparseMerkleTree.computeLeaf(
            keccak256("lock2"), amount, recipient, pubKeyHash
        );
        assertNotEq(leaf, differentLeaf);
    }

    function testFuzz_ComputeLeaf(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash
    ) public pure {
        bytes32 leaf = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        assertNotEq(leaf, bytes32(0));
    }

    // =========================================================================
    // Default Hash Tests
    // =========================================================================

    function test_GetDefaultHash() public pure {
        bytes32 h0 = SparseMerkleTree.getDefaultHash(0);
        bytes32 h1 = SparseMerkleTree.getDefaultHash(1);
        bytes32 h2 = SparseMerkleTree.getDefaultHash(2);
        
        // h1 should be hash of (h0, h0)
        assertEq(h1, SparseMerkleTree.hashNodes(h0, h0));
        
        // h2 should be hash of (h1, h1)
        assertEq(h2, SparseMerkleTree.hashNodes(h1, h1));
    }

    function test_GetEmptyRoot() public pure {
        bytes32 emptyRoot = SparseMerkleTree.getEmptyRoot();
        bytes32 expectedRoot = SparseMerkleTree.getDefaultHash(SparseMerkleTree.TREE_DEPTH);
        assertEq(emptyRoot, expectedRoot);
    }

    // =========================================================================
    // Leaf Index Tests
    // =========================================================================

    function test_GetLeafIndex() public pure {
        bytes32 lockId1 = keccak256("lock1");
        bytes32 lockId2 = keccak256("lock2");
        
        uint256 index1 = SparseMerkleTree.getLeafIndex(lockId1);
        uint256 index2 = SparseMerkleTree.getLeafIndex(lockId2);
        
        // Should be within bounds
        assertLe(index1, SparseMerkleTree.MAX_LEAF_INDEX);
        assertLe(index2, SparseMerkleTree.MAX_LEAF_INDEX);
        
        // Should be deterministic
        assertEq(index1, SparseMerkleTree.getLeafIndex(lockId1));
        
        // Different lock IDs should (likely) have different indices
        // Note: Could collide but extremely unlikely
        assertNotEq(index1, index2);
    }

    function testFuzz_GetLeafIndex(bytes32 lockId) public pure {
        uint256 index = SparseMerkleTree.getLeafIndex(lockId);
        assertLe(index, SparseMerkleTree.MAX_LEAF_INDEX);
    }

    // =========================================================================
    // Proof Verification Tests
    // =========================================================================

    function test_VerifyProof_SingleLeaf() public pure {
        // Create a simple proof
        bytes32 leaf = keccak256("leaf");
        uint256 index = 0;
        
        // Build siblings (all default hashes for empty tree with one leaf)
        bytes32[] memory siblings = new bytes32[](20);
        bytes32 currentDefault = SparseMerkleTree.getDefaultHash(0);
        
        for (uint i = 0; i < 20; i++) {
            siblings[i] = currentDefault;
            currentDefault = SparseMerkleTree.hashNodes(currentDefault, currentDefault);
        }
        
        // Compute expected root
        bytes32 current = leaf;
        for (uint i = 0; i < 20; i++) {
            current = SparseMerkleTree.hashNodes(current, siblings[i]);
        }
        
        // Verify
        bool valid = SparseMerkleTree.verifyProof(leaf, index, siblings, current);
        assertTrue(valid);
    }

    function test_VerifyProof_RevertInvalidProofLength() public {
        bytes32 leaf = keccak256("leaf");
        uint256 index = 0;
        bytes32 root = keccak256("root");
        
        // Wrong length
        bytes32[] memory siblings = new bytes32[](10); // Should be 20
        
        vm.expectRevert(SparseMerkleTree.InvalidProofLength.selector);
        SparseMerkleTree.verifyProof(leaf, index, siblings, root);
    }

    function test_VerifyProof_RevertIndexOutOfBounds() public {
        bytes32 leaf = keccak256("leaf");
        uint256 index = SparseMerkleTree.MAX_LEAF_INDEX + 1; // Out of bounds
        bytes32 root = keccak256("root");
        
        bytes32[] memory siblings = new bytes32[](20);
        
        vm.expectRevert(SparseMerkleTree.IndexOutOfBounds.selector);
        SparseMerkleTree.verifyProof(leaf, index, siblings, root);
    }

    function test_VerifyProof_InvalidRoot() public pure {
        bytes32 leaf = keccak256("leaf");
        uint256 index = 0;
        bytes32 wrongRoot = keccak256("wrong");
        
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = SparseMerkleTree.getDefaultHash(i);
        }
        
        bool valid = SparseMerkleTree.verifyProof(leaf, index, siblings, wrongRoot);
        assertFalse(valid);
    }

    // =========================================================================
    // Struct-Based Verification Tests
    // =========================================================================

    function test_ComputeLeafFromData() public pure {
        SparseMerkleTree.LockData memory data = SparseMerkleTree.LockData({
            lockId: keccak256("lock1"),
            amount: 1 ether,
            recipient: address(0x1234),
            pubKeyHash: keccak256("pubkey")
        });
        
        bytes32 leaf = SparseMerkleTree.computeLeafFromData(data);
        
        // Should match individual computation
        bytes32 expected = SparseMerkleTree.computeLeaf(
            data.lockId,
            data.amount,
            data.recipient,
            data.pubKeyHash
        );
        assertEq(leaf, expected);
    }

    function test_ComputeLeafFromData_RevertInvalidData() public {
        SparseMerkleTree.LockData memory data = SparseMerkleTree.LockData({
            lockId: bytes32(0), // Invalid
            amount: 1 ether,
            recipient: address(0x1234),
            pubKeyHash: keccak256("pubkey")
        });
        
        vm.expectRevert(SparseMerkleTree.InvalidLeafData.selector);
        SparseMerkleTree.computeLeafFromData(data);
    }

    // =========================================================================
    // Compute Root Tests
    // =========================================================================

    function test_ComputeRoot() public pure {
        bytes32 leaf = keccak256("leaf");
        uint256 index = 5;
        
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = keccak256(abi.encodePacked("sibling", i));
        }
        
        bytes32 root = SparseMerkleTree.computeRoot(leaf, index, siblings);
        
        // Verify should pass with computed root
        bool valid = SparseMerkleTree.verifyProof(leaf, index, siblings, root);
        assertTrue(valid);
    }

    // =========================================================================
    // Lock Inclusion Verification Tests
    // =========================================================================

    function test_VerifyLockInclusion() public pure {
        bytes32 lockId = keccak256("lock1");
        uint256 amount = 1 ether;
        address recipient = address(0x1234);
        bytes32 pubKeyHash = keccak256("pubkey");
        
        // Compute leaf
        bytes32 leaf = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        uint256 index = SparseMerkleTree.getLeafIndex(lockId);
        
        // Build proof
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = SparseMerkleTree.getDefaultHash(i);
        }
        
        // Compute root
        bytes32 root = SparseMerkleTree.computeRoot(leaf, index, siblings);
        
        // Verify inclusion
        bool valid = SparseMerkleTree.verifyLockInclusion(
            lockId, amount, recipient, pubKeyHash, siblings, root
        );
        assertTrue(valid);
    }

    // =========================================================================
    // Batch Verification Tests
    // =========================================================================

    function test_VerifyBatch() public pure {
        uint256 batchSize = 3;
        
        bytes32[] memory leaves = new bytes32[](batchSize);
        uint256[] memory indices = new uint256[](batchSize);
        bytes32[] memory allSiblings = new bytes32[](batchSize * 20);
        
        // Setup test data
        for (uint i = 0; i < batchSize; i++) {
            leaves[i] = keccak256(abi.encodePacked("leaf", i));
            indices[i] = i;
            
            for (uint j = 0; j < 20; j++) {
                allSiblings[i * 20 + j] = SparseMerkleTree.getDefaultHash(j);
            }
        }
        
        // Compute expected root (all leaves at indices 0, 1, 2 with default siblings)
        bytes32 expectedRoot = SparseMerkleTree.computeRoot(
            leaves[0], indices[0], _extractSiblings(allSiblings, 0)
        );
        
        // Batch verify (only first leaf will match)
        uint256 validCount = SparseMerkleTree.verifyBatch(
            leaves, indices, allSiblings, expectedRoot
        );
        
        assertGe(validCount, 1);
    }

    function test_VerifyBatch_RevertMismatchedLengths() public {
        bytes32[] memory leaves = new bytes32[](2);
        uint256[] memory indices = new uint256[](3); // Mismatched
        bytes32[] memory allSiblings = new bytes32[](40);
        
        vm.expectRevert(SparseMerkleTree.InvalidProofLength.selector);
        SparseMerkleTree.verifyBatch(leaves, indices, allSiblings, bytes32(0));
    }

    function test_VerifyBatch_RevertInvalidSiblingLength() public {
        bytes32[] memory leaves = new bytes32[](2);
        uint256[] memory indices = new uint256[](2);
        bytes32[] memory allSiblings = new bytes32[](30); // Should be 40
        
        vm.expectRevert(SparseMerkleTree.InvalidProofLength.selector);
        SparseMerkleTree.verifyBatch(leaves, indices, allSiblings, bytes32(0));
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    function test_Gas_VerifyProof() public {
        bytes32 leaf = keccak256("leaf");
        uint256 index = 12345;
        bytes32[] memory siblings = new bytes32[](20);
        
        for (uint i = 0; i < 20; i++) {
            siblings[i] = keccak256(abi.encodePacked("sibling", i));
        }
        
        bytes32 root = SparseMerkleTree.computeRoot(leaf, index, siblings);
        
        uint256 gasBefore = gasleft();
        SparseMerkleTree.verifyProof(leaf, index, siblings, root);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("verifyProof gas used", gasUsed);
        assertLt(gasUsed, 50_000); // Should be under 50k gas
    }

    function test_Gas_ComputeLeaf() public {
        bytes32 lockId = keccak256("lock1");
        uint256 amount = 1 ether;
        address recipient = address(0x1234);
        bytes32 pubKeyHash = keccak256("pubkey");
        
        uint256 gasBefore = gasleft();
        SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("computeLeaf gas used", gasUsed);
        assertLt(gasUsed, 5_000); // Should be under 5k gas
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _extractSiblings(bytes32[] memory allSiblings, uint256 proofIndex) 
        internal 
        pure 
        returns (bytes32[] memory) 
    {
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = allSiblings[proofIndex * 20 + i];
        }
        return siblings;
    }
}
