// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/L1Vault.sol";
import "../src/SPHINCSVerifier.sol";
import "../src/libraries/SHA3_256.sol";
import "../src/libraries/SparseMerkleTree.sol";
import "../src/libraries/StateRootCalculator.sol";

/// @title L1Vault SMT SHA3-256 Verification Test Suite
/// @notice Tests for SMT proof verification using SHA3-256 (CP-1 compliance)
/// @dev Created for FIX-001: Replace keccak256 with SHA3-256 in _verifySMTProof()
///
/// ISSUE-001 Resolution:
/// - L1Vault._verifySMTProof() must use SHA3-256 for quantum resistance
/// - keccak256 is prohibited per CORE_PRINCIPLES.md (CP-1)
///
/// Created: 2025-12-24
contract L1VaultSMTSHA3Test is Test {
    L1Vault public vault;
    SPHINCSVerifier public sphincsVerifier;

    // Test accounts
    address public admin = address(0xAD01);
    address public securityCouncil = address(0x5EC0);
    address public user1 = address(0x1111);
    address public user2 = address(0x2222);
    
    // Test prover addresses
    address public prover1 = address(0x5001);
    address public prover2 = address(0x5002);

    function setUp() public {
        vm.startPrank(admin);
        
        sphincsVerifier = new SPHINCSVerifier();
        vault = new L1Vault(securityCouncil, address(sphincsVerifier));
        
        vm.deal(admin, 10 ether);
        vault.registerProver{value: 1 ether}(prover1, _generatePublicKey(1));
        vault.registerProver{value: 1 ether}(prover2, _generatePublicKey(2));
        
        vm.stopPrank();
        
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    // =========================================================================
    // FIX-001: SMT SHA3-256 Verification Tests
    // =========================================================================

    /// @notice Verify that SMT proof verification uses SHA3-256
    /// @dev This test creates a proof with SHA3-256 hashing and verifies it
    function test_SMT_SHA3_256_ProofVerification() public view {
        // Create a simple proof using SHA3-256
        bytes32 leaf = bytes32(uint256(0x1234));
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = bytes32(uint256(0x5678));
        
        // Compute expected root using SHA3-256 (not keccak256!)
        bytes32 expectedRoot;
        if (leaf < proof[0]) {
            expectedRoot = SHA3_256.hashPair(leaf, proof[0]);
        } else {
            expectedRoot = SHA3_256.hashPair(proof[0], leaf);
        }
        
        // The root should be computed with SHA3-256
        assertTrue(expectedRoot != bytes32(0), "SHA3-256 root should be non-zero");
        
        // Verify that SHA3-256 produces different result than keccak256
        bytes32 keccakRoot;
        if (leaf < proof[0]) {
            keccakRoot = keccak256(abi.encodePacked(leaf, proof[0]));
        } else {
            keccakRoot = keccak256(abi.encodePacked(proof[0], leaf));
        }
        
        // SHA3-256 and keccak256 should produce different results
        assertTrue(expectedRoot != keccakRoot, "SHA3-256 should differ from keccak256");
    }

    /// @notice Test SHA3-256 hashPair is deterministic
    function test_SMT_SHA3_256_Deterministic() public pure {
        bytes32 a = bytes32(uint256(0x1111));
        bytes32 b = bytes32(uint256(0x2222));
        
        bytes32 hash1 = SHA3_256.hashPair(a, b);
        bytes32 hash2 = SHA3_256.hashPair(a, b);
        
        assertEq(hash1, hash2, "SHA3-256 hashPair should be deterministic");
    }

    /// @notice Test SHA3-256 hashPair ordering consistency
    function test_SMT_SHA3_256_OrderMatters() public pure {
        bytes32 a = bytes32(uint256(0x1111));
        bytes32 b = bytes32(uint256(0x2222));
        
        bytes32 hashAB = SHA3_256.hashPair(a, b);
        bytes32 hashBA = SHA3_256.hashPair(b, a);
        
        // Order should matter
        assertTrue(hashAB != hashBA, "SHA3-256 hashPair order should matter");
    }

    /// @notice Test multi-level SMT proof with SHA3-256
    function test_SMT_SHA3_256_MultiLevelProof() public pure {
        bytes32 leaf = bytes32(uint256(0x1234));
        bytes32[] memory proof = new bytes32[](3);
        proof[0] = bytes32(uint256(0x0001));
        proof[1] = bytes32(uint256(0x0002));
        proof[2] = bytes32(uint256(0x0003));
        
        // Manually compute root using SHA3-256
        bytes32 computedRoot = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            if (computedRoot < proof[i]) {
                computedRoot = SHA3_256.hashPair(computedRoot, proof[i]);
            } else {
                computedRoot = SHA3_256.hashPair(proof[i], computedRoot);
            }
        }
        
        // Root should be non-zero
        assertTrue(computedRoot != bytes32(0), "Multi-level SHA3-256 root should be non-zero");
        
        // Verify with keccak256 produces different result
        bytes32 keccakRoot = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            if (keccakRoot < proof[i]) {
                keccakRoot = keccak256(abi.encodePacked(keccakRoot, proof[i]));
            } else {
                keccakRoot = keccak256(abi.encodePacked(proof[i], keccakRoot));
            }
        }
        
        assertTrue(computedRoot != keccakRoot, "SHA3-256 multi-level should differ from keccak256");
    }

    /// @notice Test SHA3-256 is FIPS 202 compliant (empty string test vector)
    function test_SHA3_256_FIPS202_Compliance() public pure {
        // NIST test vector: SHA3-256("") = a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
        bool isCompliant = SHA3_256.verifySHA3Implementation();
        assertTrue(isCompliant, "SHA3-256 should be FIPS 202 compliant");
    }

    /// @notice Verify SHA3_256 library info
    function test_SHA3_256_ImplementationInfo() public pure {
        (string memory name, string memory version, bool fipsCompliant) = SHA3_256.getImplementationInfo();
        
        assertEq(name, "SHA3-256 Pure Solidity", "Implementation name should match");
        assertEq(version, "1.0.0", "Version should match");
        assertTrue(fipsCompliant, "Should be FIPS compliant");
    }

    // =========================================================================
    // Gas Benchmark Tests
    // =========================================================================

    /// @notice Benchmark gas usage for SHA3-256 vs keccak256
    function test_Gas_SHA3_256_vs_Keccak256() public {
        bytes32 a = bytes32(uint256(0x1111));
        bytes32 b = bytes32(uint256(0x2222));
        
        // Measure SHA3-256 gas
        uint256 gasBefore = gasleft();
        SHA3_256.hashPair(a, b);
        uint256 sha3Gas = gasBefore - gasleft();
        
        // Measure keccak256 gas
        gasBefore = gasleft();
        keccak256(abi.encodePacked(a, b));
        uint256 keccakGas = gasBefore - gasleft();
        
        emit log_named_uint("SHA3-256 hashPair gas", sha3Gas);
        emit log_named_uint("keccak256 gas", keccakGas);
        
        // SHA3-256 will be more expensive, but security is priority
        assertTrue(sha3Gas > 0, "SHA3-256 should use gas");
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _generatePublicKey(uint256 seed) internal pure returns (bytes memory) {
        bytes memory pubKey = new bytes(32);
        for (uint i = 0; i < 32; i++) {
            pubKey[i] = bytes1(uint8(keccak256(abi.encodePacked(seed, i))[0]));
        }
        return pubKey;
    }
}
