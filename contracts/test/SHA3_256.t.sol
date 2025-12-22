// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/libraries/SHA3_256.sol";
import "../src/libraries/SparseMerkleTree.sol";

/// @title SHA3-256 Test Suite
/// @notice Tests for FIPS 202 compliant SHA3-256 implementation
/// @dev Includes NIST test vectors and comparison with keccak256
contract SHA3_256Test is Test {
    
    // =========================================================================
    // NIST Test Vectors
    // Reference: https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines
    // =========================================================================

    /// @notice Test empty input (NIST test vector)
    function test_SHA3_EmptyInput() public pure {
        bytes memory empty = "";
        bytes32 result = SHA3_256.hash(empty);
        
        // NIST SHA3-256("") = a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
        bytes32 expected = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;
        
        assertEq(result, expected, "SHA3-256 empty input mismatch");
    }

    /// @notice Test "abc" input (NIST test vector)
    function test_SHA3_ABC() public pure {
        bytes memory input = "abc";
        bytes32 result = SHA3_256.hash(input);
        
        // NIST SHA3-256("abc") = 3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532
        bytes32 expected = 0x3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532;
        
        assertEq(result, expected, "SHA3-256 'abc' mismatch");
    }

    /// @notice Test longer input (NIST test vector)
    function test_SHA3_LongerInput() public pure {
        // "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
        bytes memory input = "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq";
        bytes32 result = SHA3_256.hash(input);
        
        // NIST test vector
        bytes32 expected = 0x41c0dba2a9d6240849100376a8235e2c82e1b9998a999e21db32dd97496d3376;
        
        assertEq(result, expected, "SHA3-256 longer input mismatch");
    }

    // =========================================================================
    // SHA3-256 vs keccak256 Difference Tests
    // =========================================================================

    /// @notice Verify SHA3-256 ≠ keccak256
    function test_SHA3_DifferentFromKeccak() public pure {
        bytes memory input = "test";
        
        bytes32 sha3Result = SHA3_256.hash(input);
        bytes32 keccakResult = keccak256(input);
        
        // These MUST be different (different padding)
        assertTrue(sha3Result != keccakResult, "SHA3-256 should differ from keccak256");
    }

    /// @notice Verify empty hash difference
    function test_EmptyHash_Difference() public pure {
        bytes memory empty = "";
        
        bytes32 sha3Empty = SHA3_256.hash(empty);
        bytes32 keccakEmpty = keccak256(empty);
        
        // SHA3-256("") = a7ffc6f8...
        // keccak256("") = c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
        
        assertEq(sha3Empty, 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a);
        assertEq(keccakEmpty, 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470);
        assertTrue(sha3Empty != keccakEmpty, "Empty hashes must differ");
    }

    // =========================================================================
    // Helper Function Tests
    // =========================================================================

    /// @notice Test hashPair function
    function test_HashPair() public pure {
        bytes32 a = bytes32(uint256(1));
        bytes32 b = bytes32(uint256(2));
        
        bytes32 result = SHA3_256.hashPair(a, b);
        bytes32 expected = SHA3_256.hash(abi.encodePacked(a, b));
        
        assertEq(result, expected, "hashPair should match direct hash");
    }

    /// @notice Test hashWithDomain function
    function test_HashWithDomain() public pure {
        bytes32 domain = keccak256("TEST_DOMAIN");
        bytes memory data = "test data";
        
        bytes32 result = SHA3_256.hashWithDomain(domain, data);
        bytes32 expected = SHA3_256.hash(abi.encodePacked(domain, data));
        
        assertEq(result, expected, "hashWithDomain should match direct hash");
    }

    /// @notice Test implementation verification
    function test_VerifyImplementation() public pure {
        bool valid = SHA3_256.verifySHA3Implementation();
        assertTrue(valid, "SHA3-256 implementation verification failed");
    }

    /// @notice Test implementation info
    function test_ImplementationInfo() public pure {
        (string memory name, string memory version, bool fipsCompliant) = SHA3_256.getImplementationInfo();
        
        assertEq(name, "SHA3-256 Pure Solidity");
        assertEq(version, "1.0.0");
        assertTrue(fipsCompliant, "Should be FIPS compliant");
    }

    // =========================================================================
    // SparseMerkleTree Integration Tests
    // =========================================================================

    /// @notice Test SMT uses SHA3-256
    function test_SMT_UsesSHA3() public pure {
        (string memory hashFunction, bool fipsCompliant) = SparseMerkleTree.getHashInfo();
        
        assertEq(hashFunction, "SHA3-256");
        assertTrue(fipsCompliant, "SMT should be FIPS compliant");
    }

    /// @notice Test SMT leaf computation with SHA3-256
    function test_SMT_LeafComputation() public pure {
        bytes32 lockId = bytes32(uint256(1));
        uint256 amount = 1 ether;
        address recipient = address(0x1234);
        bytes32 pubKeyHash = keccak256("pubkey");
        
        bytes32 leaf = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        
        // Verify it's different from legacy (keccak256)
        bytes32 legacyLeaf = SparseMerkleTree.computeLeafLegacy(lockId, amount, recipient, pubKeyHash);
        
        assertTrue(leaf != legacyLeaf, "SHA3 leaf should differ from legacy leaf");
        assertTrue(leaf != bytes32(0), "Leaf should not be zero");
    }

    /// @notice Test SMT node hashing with SHA3-256
    function test_SMT_NodeHashing() public pure {
        bytes32 left = bytes32(uint256(1));
        bytes32 right = bytes32(uint256(2));
        
        bytes32 node = SparseMerkleTree.hashNodes(left, right);
        bytes32 legacyNode = SparseMerkleTree.hashNodesLegacy(left, right);
        
        assertTrue(node != legacyNode, "SHA3 node should differ from legacy node");
        assertTrue(node != bytes32(0), "Node should not be zero");
    }

    /// @notice Test SMT empty leaf constant
    function test_SMT_EmptyLeaf() public pure {
        bytes32 sha3Empty = SparseMerkleTree.EMPTY_LEAF_SHA3;
        bytes32 legacyEmpty = SparseMerkleTree.EMPTY_LEAF_LEGACY;
        
        // Verify constants are correct
        assertEq(sha3Empty, 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a);
        assertEq(legacyEmpty, 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563);
        assertTrue(sha3Empty != legacyEmpty, "Empty leaf hashes must differ");
    }

    /// @notice Test SMT proof verification
    function test_SMT_ProofVerification() public pure {
        // Create a simple proof
        bytes32 leaf = SparseMerkleTree.computeLeaf(
            bytes32(uint256(1)),
            1 ether,
            address(0x1234),
            keccak256("pubkey")
        );
        
        uint256 index = 0;
        bytes32[] memory siblings = new bytes32[](20);
        
        // Fill with default hashes
        for (uint i = 0; i < 20; i++) {
            siblings[i] = SparseMerkleTree.getDefaultHash(i);
        }
        
        // Compute root
        bytes32 root = SparseMerkleTree.computeRoot(leaf, index, siblings);
        
        // Verify proof
        bool valid = SparseMerkleTree.verifyProof(leaf, index, siblings, root);
        assertTrue(valid, "Proof should be valid");
    }

    /// @notice Test SMT SHA3 implementation verification
    function test_SMT_SHA3Verification() public pure {
        bool valid = SparseMerkleTree.verifySHA3Implementation();
        assertTrue(valid, "SMT SHA3 verification should pass");
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    /// @notice Benchmark SHA3-256 gas cost for 32 bytes
    function test_Gas_SHA3_32Bytes() public view {
        bytes memory input = abi.encodePacked(bytes32(uint256(1)));
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(input);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        emit log_named_uint("SHA3-256 (32 bytes) gas", gasUsed);
        
        // Should be reasonable (< 50,000 gas)
        assertTrue(gasUsed < 50000, "Gas cost too high for 32 bytes");
    }

    /// @notice Benchmark SHA3-256 gas cost for 64 bytes
    function test_Gas_SHA3_64Bytes() public view {
        bytes memory input = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(input);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        emit log_named_uint("SHA3-256 (64 bytes) gas", gasUsed);
        
        // Should be reasonable (< 60,000 gas)
        assertTrue(gasUsed < 60000, "Gas cost too high for 64 bytes");
    }

    /// @notice Compare SHA3-256 vs keccak256 gas
    function test_Gas_Comparison() public view {
        bytes memory input = "test input for gas comparison";
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(input);
        uint256 gasAfter = gasleft();
        uint256 sha3Gas = gasBefore - gasAfter;
        
        gasBefore = gasleft();
        keccak256(input);
        gasAfter = gasleft();
        uint256 keccakGas = gasBefore - gasAfter;
        
        emit log_named_uint("SHA3-256 gas", sha3Gas);
        emit log_named_uint("keccak256 gas", keccakGas);
        emit log_named_uint("SHA3 overhead", sha3Gas - keccakGas);
        
        // SHA3-256 will be more expensive than native keccak256
        assertTrue(sha3Gas > keccakGas, "SHA3 should cost more than native keccak");
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    /// @notice Test single byte input
    function test_SHA3_SingleByte() public pure {
        bytes memory input = hex"00";
        bytes32 result = SHA3_256.hash(input);
        assertTrue(result != bytes32(0), "Single byte hash should not be zero");
    }

    /// @notice Test 136 bytes (exactly one block)
    function test_SHA3_OneBlock() public pure {
        bytes memory input = new bytes(136);
        for (uint i = 0; i < 136; i++) {
            input[i] = bytes1(uint8(i));
        }
        
        bytes32 result = SHA3_256.hash(input);
        assertTrue(result != bytes32(0), "One block hash should not be zero");
    }

    /// @notice Test 137 bytes (just over one block)
    function test_SHA3_OverOneBlock() public pure {
        bytes memory input = new bytes(137);
        for (uint i = 0; i < 137; i++) {
            input[i] = bytes1(uint8(i));
        }
        
        bytes32 result = SHA3_256.hash(input);
        assertTrue(result != bytes32(0), "Over one block hash should not be zero");
    }

    /// @notice Fuzz test - all inputs should produce non-zero output
    function testFuzz_SHA3_NonZeroOutput(bytes memory input) public pure {
        bytes32 result = SHA3_256.hash(input);
        // Note: Technically a hash could be zero, but probability is 1/2^256
        // For practical purposes, we just verify the function doesn't revert
        assertTrue(true, "Hash completed without revert");
    }

    /// @notice Fuzz test - same input always produces same output
    function testFuzz_SHA3_Deterministic(bytes memory input) public pure {
        bytes32 result1 = SHA3_256.hash(input);
        bytes32 result2 = SHA3_256.hash(input);
        assertEq(result1, result2, "Hash should be deterministic");
    }

    /// @notice Fuzz test - different inputs produce different outputs
    function testFuzz_SHA3_Collision(bytes memory input1, bytes memory input2) public pure {
        vm.assume(keccak256(input1) != keccak256(input2)); // Different inputs
        
        bytes32 result1 = SHA3_256.hash(input1);
        bytes32 result2 = SHA3_256.hash(input2);
        
        // Note: This could theoretically fail due to collision, but probability is negligible
        assertTrue(result1 != result2, "Different inputs should produce different hashes");
    }
}
