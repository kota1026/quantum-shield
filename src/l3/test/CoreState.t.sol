// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {CoreState} from "../src/core/CoreState.sol";
import {ICoreState} from "../src/interfaces/ICoreState.sol";

/// @title CoreStateTest
/// @notice Comprehensive tests for CoreState State Manager
/// @dev Part of CORE-001 State Manager implementation
contract CoreStateTest is Test {
    CoreState public coreState;
    
    // Test constants
    bytes32 constant TEST_LOCK_ID = keccak256("test_lock_1");
    uint256 constant TEST_AMOUNT = 1 ether;
    address constant TEST_RECIPIENT = address(0x1234567890123456789012345678901234567890);
    bytes32 constant TEST_PUBKEY_HASH = keccak256("test_pubkey");
    
    // Expected SHA3-256("") = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
    bytes32 constant EXPECTED_EMPTY_HASH = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;

    function setUp() public {
        coreState = new CoreState();
    }

    // ============ Constants Tests ============

    function test_StateVersion() public view {
        assertEq(coreState.STATE_VERSION(), 1, "State version should be 1");
    }

    function test_TreeDepth() public view {
        assertEq(coreState.TREE_DEPTH(), 20, "Tree depth should be 20");
    }

    function test_MaxLeafIndex() public view {
        assertEq(coreState.MAX_LEAF_INDEX(), (1 << 20) - 1, "Max leaf index should be 2^20 - 1");
    }

    function test_EmptyLeafHash() public view {
        assertEq(coreState.EMPTY_LEAF_HASH(), EXPECTED_EMPTY_HASH, "Empty leaf hash should match SHA3-256('')");
    }

    // ============ Hash Function Tests ============

    function test_SHA3Implementation() public view {
        assertTrue(coreState.verifySHA3Implementation(), "SHA3-256 implementation should pass NIST test vector");
    }

    function test_HashInfo() public view {
        (string memory hashFunction, bool fipsCompliant) = coreState.getHashInfo();
        assertEq(hashFunction, "SHA3-256", "Hash function should be SHA3-256");
        assertTrue(fipsCompliant, "Should be FIPS 202 compliant");
    }

    function test_HashNodes() public view {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        bytes32 result = coreState.hashNodes(left, right);
        
        // Result should be deterministic
        bytes32 result2 = coreState.hashNodes(left, right);
        assertEq(result, result2, "Hash should be deterministic");
        
        // Different inputs should produce different outputs
        bytes32 result3 = coreState.hashNodes(right, left);
        assertNotEq(result, result3, "Order should matter in hash");
    }

    function test_SHA3Hash() public view {
        bytes memory data = "Hello, Quantum Shield!";
        bytes32 hash1 = coreState.sha3Hash(data);
        bytes32 hash2 = coreState.sha3Hash(data);
        
        assertEq(hash1, hash2, "SHA3 hash should be deterministic");
        assertNotEq(hash1, bytes32(0), "Hash should not be zero");
    }

    // ============ State Root Tests ============

    function test_CalculateStateRoot_SingleEntry() public view {
        ICoreState.StateEntry[] memory entries = new ICoreState.StateEntry[](1);
        entries[0] = ICoreState.StateEntry({
            key: keccak256("key1"),
            value: keccak256("value1")
        });
        
        bytes32 root = coreState.calculateStateRoot(entries);
        assertNotEq(root, bytes32(0), "State root should not be zero");
    }

    function test_CalculateStateRoot_MultipleEntries() public view {
        ICoreState.StateEntry[] memory entries = new ICoreState.StateEntry[](3);
        entries[0] = ICoreState.StateEntry({key: keccak256("key1"), value: keccak256("value1")});
        entries[1] = ICoreState.StateEntry({key: keccak256("key2"), value: keccak256("value2")});
        entries[2] = ICoreState.StateEntry({key: keccak256("key3"), value: keccak256("value3")});
        
        bytes32 root = coreState.calculateStateRoot(entries);
        assertNotEq(root, bytes32(0), "State root should not be zero");
    }

    function test_CalculateStateRoot_Deterministic() public view {
        ICoreState.StateEntry[] memory entries = new ICoreState.StateEntry[](2);
        entries[0] = ICoreState.StateEntry({key: keccak256("key1"), value: keccak256("value1")});
        entries[1] = ICoreState.StateEntry({key: keccak256("key2"), value: keccak256("value2")});
        
        bytes32 root1 = coreState.calculateStateRoot(entries);
        bytes32 root2 = coreState.calculateStateRoot(entries);
        
        assertEq(root1, root2, "State root should be deterministic");
    }

    function test_CalculateStateRoot_EmptyReverts() public {
        ICoreState.StateEntry[] memory entries = new ICoreState.StateEntry[](0);
        
        vm.expectRevert(ICoreState.EmptyStateEntries.selector);
        coreState.calculateStateRoot(entries);
    }

    // ============ Leaf Computation Tests ============

    function test_ComputeLeaf() public view {
        bytes32 leaf = coreState.computeLeaf(
            TEST_LOCK_ID,
            TEST_AMOUNT,
            TEST_RECIPIENT,
            TEST_PUBKEY_HASH
        );
        
        assertNotEq(leaf, bytes32(0), "Leaf should not be zero");
    }

    function test_ComputeLeaf_Deterministic() public view {
        bytes32 leaf1 = coreState.computeLeaf(TEST_LOCK_ID, TEST_AMOUNT, TEST_RECIPIENT, TEST_PUBKEY_HASH);
        bytes32 leaf2 = coreState.computeLeaf(TEST_LOCK_ID, TEST_AMOUNT, TEST_RECIPIENT, TEST_PUBKEY_HASH);
        
        assertEq(leaf1, leaf2, "Leaf computation should be deterministic");
    }

    function test_ComputeLeaf_DifferentInputs() public view {
        bytes32 leaf1 = coreState.computeLeaf(TEST_LOCK_ID, TEST_AMOUNT, TEST_RECIPIENT, TEST_PUBKEY_HASH);
        bytes32 leaf2 = coreState.computeLeaf(keccak256("different"), TEST_AMOUNT, TEST_RECIPIENT, TEST_PUBKEY_HASH);
        
        assertNotEq(leaf1, leaf2, "Different inputs should produce different leaves");
    }

    function test_GetLeafIndex() public view {
        uint256 index = coreState.getLeafIndex(TEST_LOCK_ID);
        
        // Index should be within bounds
        assertLe(index, coreState.MAX_LEAF_INDEX(), "Index should be within bounds");
    }

    function test_GetLeafIndex_Deterministic() public view {
        uint256 index1 = coreState.getLeafIndex(TEST_LOCK_ID);
        uint256 index2 = coreState.getLeafIndex(TEST_LOCK_ID);
        
        assertEq(index1, index2, "Leaf index should be deterministic");
    }

    // ============ Merkle Proof Tests ============

    function test_GetDefaultHash() public view {
        bytes32 hash0 = coreState.getDefaultHash(0);
        assertEq(hash0, EXPECTED_EMPTY_HASH, "Default hash at height 0 should be empty leaf hash");
        
        bytes32 hash1 = coreState.getDefaultHash(1);
        assertNotEq(hash1, hash0, "Default hash at height 1 should differ from height 0");
    }

    function test_GetEmptyRoot() public view {
        bytes32 emptyRoot = coreState.getEmptyRoot();
        assertNotEq(emptyRoot, bytes32(0), "Empty root should not be zero");
    }

    function test_VerifyInclusion_InvalidProofLength() public {
        bytes32 leaf = keccak256("test_leaf");
        bytes32[] memory siblings = new bytes32[](10); // Wrong length, should be 20
        
        vm.expectRevert(abi.encodeWithSelector(ICoreState.InvalidProofLength.selector, 20, 10));
        coreState.verifyInclusion(leaf, 0, siblings, bytes32(0));
    }

    function test_VerifyInclusion_IndexOutOfBounds() public {
        bytes32 leaf = keccak256("test_leaf");
        bytes32[] memory siblings = new bytes32[](20);
        uint256 outOfBoundsIndex = (1 << 20); // One more than max
        
        vm.expectRevert(abi.encodeWithSelector(ICoreState.IndexOutOfBounds.selector, outOfBoundsIndex, (1 << 20) - 1));
        coreState.verifyInclusion(leaf, outOfBoundsIndex, siblings, bytes32(0));
    }

    function test_ComputeRoot_ValidProof() public view {
        // Create a simple proof scenario
        bytes32 leaf = coreState.EMPTY_LEAF_HASH();
        bytes32[] memory siblings = new bytes32[](20);
        
        // Initialize all siblings to empty leaf hash
        for (uint256 i = 0; i < 20; i++) {
            siblings[i] = coreState.getDefaultHash(i);
        }
        
        bytes32 computedRoot = coreState.computeRoot(leaf, 0, siblings);
        assertNotEq(computedRoot, bytes32(0), "Computed root should not be zero");
    }

    function test_VerifyInclusion_EmptyTree() public view {
        // For an empty tree, verify that empty leaf at index 0 is included
        bytes32 leaf = coreState.EMPTY_LEAF_HASH();
        bytes32[] memory siblings = new bytes32[](20);
        
        // Initialize siblings for empty tree
        for (uint256 i = 0; i < 20; i++) {
            siblings[i] = coreState.getDefaultHash(i);
        }
        
        bytes32 expectedRoot = coreState.computeRoot(leaf, 0, siblings);
        bool valid = coreState.verifyInclusion(leaf, 0, siblings, expectedRoot);
        
        assertTrue(valid, "Should verify inclusion in empty tree");
    }

    // ============ Lock Inclusion Tests ============

    function test_VerifyLockInclusion_InvalidProofLength() public {
        bytes32[] memory siblings = new bytes32[](10); // Wrong length
        
        vm.expectRevert(abi.encodeWithSelector(ICoreState.InvalidProofLength.selector, 20, 10));
        coreState.verifyLockInclusion(
            TEST_LOCK_ID,
            TEST_AMOUNT,
            TEST_RECIPIENT,
            TEST_PUBKEY_HASH,
            siblings,
            bytes32(0)
        );
    }

    // ============ Gas Benchmark Tests ============

    function test_Gas_CalculateStateRoot() public view {
        ICoreState.StateEntry[] memory entries = new ICoreState.StateEntry[](10);
        for (uint256 i = 0; i < 10; i++) {
            entries[i] = ICoreState.StateEntry({
                key: keccak256(abi.encodePacked("key", i)),
                value: keccak256(abi.encodePacked("value", i))
            });
        }
        
        uint256 gasBefore = gasleft();
        coreState.calculateStateRoot(entries);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for calculateStateRoot (10 entries):", gasUsed);
        // Log but don't assert specific value - this is for benchmarking
    }

    function test_Gas_ComputeLeaf() public view {
        uint256 gasBefore = gasleft();
        coreState.computeLeaf(TEST_LOCK_ID, TEST_AMOUNT, TEST_RECIPIENT, TEST_PUBKEY_HASH);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for computeLeaf:", gasUsed);
    }

    function test_Gas_HashNodes() public view {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        uint256 gasBefore = gasleft();
        coreState.hashNodes(left, right);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for hashNodes:", gasUsed);
    }

    function test_Gas_VerifyInclusion() public view {
        bytes32 leaf = coreState.EMPTY_LEAF_HASH();
        bytes32[] memory siblings = new bytes32[](20);
        
        for (uint256 i = 0; i < 20; i++) {
            siblings[i] = coreState.getDefaultHash(i);
        }
        
        bytes32 root = coreState.computeRoot(leaf, 0, siblings);
        
        uint256 gasBefore = gasleft();
        coreState.verifyInclusion(leaf, 0, siblings, root);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for verifyInclusion (depth 20):", gasUsed);
    }

    // ============ Interface Compliance Tests ============

    function test_ImplementsICoreState() public view {
        // Verify all interface functions are callable
        coreState.STATE_VERSION();
        coreState.TREE_DEPTH();
        coreState.MAX_LEAF_INDEX();
        coreState.EMPTY_LEAF_HASH();
        coreState.getHashInfo();
        coreState.verifySHA3Implementation();
    }

    // ============ Fuzz Tests ============

    function testFuzz_ComputeLeaf(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash
    ) public view {
        bytes32 leaf = coreState.computeLeaf(lockId, amount, recipient, pubKeyHash);
        assertNotEq(leaf, bytes32(0), "Fuzzed leaf should not be zero");
    }

    function testFuzz_GetLeafIndex(bytes32 lockId) public view {
        uint256 index = coreState.getLeafIndex(lockId);
        assertLe(index, coreState.MAX_LEAF_INDEX(), "Index should always be within bounds");
    }

    function testFuzz_HashNodes(bytes32 left, bytes32 right) public view {
        bytes32 result = coreState.hashNodes(left, right);
        assertNotEq(result, bytes32(0), "Hash result should not be zero for non-zero inputs");
    }
}
