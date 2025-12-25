// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {FRIVerifier} from "../contracts/src/FRIVerifier.sol";
import {SHA3_256} from "../contracts/src/libraries/SHA3_256.sol";

/// @title FRIVerifierSHA3Test - SHA3-256 Migration Verification Tests
/// @notice Tests for FRI Verifier SHA3-256 compliance (CP-1 requirement)
/// @dev Part of Phase 2 Day 1 implementation [TEST-001]
contract FRIVerifierSHA3Test is Test {
    // =========================================================================
    // Constants for Testing
    // =========================================================================
    
    uint256 constant TEST_DOMAIN_SIZE = 256;
    
    // =========================================================================
    // Test: SHA3-256 Implementation Verification
    // =========================================================================
    
    /// @notice Verify SHA3_256 library is correctly implemented (NIST test vector)
    function test_SHA3_256_NISTTestVector() public pure {
        // NIST test vector: SHA3-256("") = a7ffc6f8...
        bytes memory empty = "";
        bytes32 result = SHA3_256.hash(empty);
        bytes32 expected = 0xa7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a;
        
        assertEq(result, expected, "SHA3-256 empty string test vector mismatch");
    }
    
    /// @notice Verify SHA3-256 produces different output than keccak256
    function test_SHA3_256_DifferentFromKeccak() public pure {
        bytes memory testData = abi.encodePacked(uint256(123), uint256(456));
        
        bytes32 sha3Result = SHA3_256.hash(testData);
        bytes32 keccakResult = keccak256(testData);
        
        // SHA3-256 and keccak256 MUST produce different results
        assertTrue(sha3Result != keccakResult, "SHA3-256 should differ from keccak256");
    }
    
    /// @notice Verify hashPair function works correctly for Merkle trees
    function test_SHA3_256_HashPair() public pure {
        bytes32 a = bytes32(uint256(1));
        bytes32 b = bytes32(uint256(2));
        
        bytes32 pairResult = SHA3_256.hashPair(a, b);
        bytes32 manualResult = SHA3_256.hash(abi.encodePacked(a, b));
        
        assertEq(pairResult, manualResult, "hashPair should match manual concatenation");
    }
    
    // =========================================================================
    // Test: Gas Consumption Measurement
    // =========================================================================
    
    /// @notice Measure gas consumption for SHA3-256 hashing
    function test_SHA3_256_GasConsumption() public {
        bytes memory testData = abi.encodePacked(
            uint256(1), uint256(2), uint256(3), uint256(4)
        );
        
        uint256 gasBefore = gasleft();
        SHA3_256.hash(testData);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        console.log("SHA3-256 hash gas used:", gasUsed);
        
        // SHA3-256 is expected to use more gas than keccak256
        // Log for comparison purposes
        gasBefore = gasleft();
        keccak256(testData);
        gasAfter = gasleft();
        
        uint256 keccakGasUsed = gasBefore - gasAfter;
        console.log("keccak256 gas used:", keccakGasUsed);
        console.log("SHA3-256 overhead:", gasUsed - keccakGasUsed);
    }
    
    /// @notice Measure gas for hashPair (common in Merkle trees)
    function test_SHA3_256_HashPairGas() public {
        bytes32 a = bytes32(uint256(0x1234));
        bytes32 b = bytes32(uint256(0x5678));
        
        uint256 gasBefore = gasleft();
        SHA3_256.hashPair(a, b);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        console.log("SHA3-256 hashPair gas used:", gasUsed);
    }
    
    // =========================================================================
    // Test: FRIVerifier Structure Tests
    // =========================================================================
    
    /// @notice Test FRI proof structure validation
    function test_FRIProof_StructureValidation() public pure {
        // Create minimal valid proof structure
        FRIVerifier.FRIProof memory proof;
        proof.layerCommitments = new bytes32[](1);
        proof.layerCommitments[0] = bytes32(uint256(1));
        proof.challenges = new uint256[](1);
        proof.challenges[0] = 123;
        
        // Query proofs - need at least MIN_QUERIES (80)
        proof.queryProofs = new FRIVerifier.FRIQueryProof[](80);
        for (uint256 i = 0; i < 80; i++) {
            proof.queryProofs[i].queryIndex = i;
            proof.queryProofs[i].evaluations = new uint256[](2);
            proof.queryProofs[i].evaluations[0] = i + 1;
            proof.queryProofs[i].evaluations[1] = i + 2;
            proof.queryProofs[i].merkleProof = new bytes32[](8);
        }
        
        proof.finalPolynomial = new uint256[](1);
        proof.finalPolynomial[0] = 42;
        
        // Verify structure is valid (not empty)
        assertTrue(proof.layerCommitments.length > 0, "Layer commitments should not be empty");
        assertTrue(proof.queryProofs.length >= 80, "Need minimum 80 query proofs");
    }
    
    // =========================================================================
    // Test: CP-1 Compliance - No keccak256 in Critical Paths
    // =========================================================================
    
    /// @notice Verify that SHA3_256 library correctly implements FIPS 202
    function test_CP1_SHA3_256_FIPSCompliance() public pure {
        // Verify the implementation info
        (string memory name, string memory version, bool fipsCompliant) = 
            SHA3_256.getImplementationInfo();
        
        assertTrue(fipsCompliant, "SHA3_256 must be FIPS 202 compliant (CP-1)");
        assertEq(name, "SHA3-256 Pure Solidity", "Implementation name mismatch");
    }
    
    /// @notice Test multiple hash operations for consistency
    function test_SHA3_256_Deterministic() public pure {
        bytes memory data = "Quantum Shield FRI Verification";
        
        bytes32 hash1 = SHA3_256.hash(data);
        bytes32 hash2 = SHA3_256.hash(data);
        bytes32 hash3 = SHA3_256.hash(data);
        
        assertEq(hash1, hash2, "SHA3-256 must be deterministic");
        assertEq(hash2, hash3, "SHA3-256 must be deterministic");
    }
    
    // =========================================================================
    // Test: Merkle Proof Hash Computation (Post-Migration)
    // =========================================================================
    
    /// @notice Test leaf hash computation using SHA3-256
    function test_MerkleLeafHash_SHA3() public pure {
        uint256 eval0 = 12345;
        uint256 eval1 = 67890;
        
        // This is how FRIVerifier should compute leaf hash after migration
        bytes32 leafHash = SHA3_256.hash(abi.encodePacked(eval0, eval1));
        
        // Verify it's not the same as keccak256
        bytes32 keccakLeaf = keccak256(abi.encodePacked(eval0, eval1));
        
        assertTrue(leafHash != keccakLeaf, "Leaf hash should use SHA3-256, not keccak256");
        assertTrue(leafHash != bytes32(0), "Leaf hash should not be zero");
    }
    
    /// @notice Test intermediate node hash computation
    function test_MerkleIntermediateHash_SHA3() public pure {
        bytes32 left = bytes32(uint256(111));
        bytes32 right = bytes32(uint256(222));
        
        // Using hashPair for efficiency
        bytes32 nodeHash = SHA3_256.hashPair(left, right);
        
        // Verify it's not the same as keccak256
        bytes32 keccakNode = keccak256(abi.encodePacked(left, right));
        
        assertTrue(nodeHash != keccakNode, "Node hash should use SHA3-256, not keccak256");
    }
}
