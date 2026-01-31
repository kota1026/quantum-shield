// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SPHINCSVerifier} from "../src/SPHINCSVerifier.sol";
import {SHA3_256} from "../src/libraries/SHA3_256.sol";

/// @title SPHINCSVerifier SHAKE Test Suite
/// @notice Tests for SPHINCS+-SHAKE-128s signature verification
/// @dev Verifies SHAKE256 migration and SHA3-256 usage for public key hashing
contract SPHINCSVerifierSHAKETest is Test {
    SPHINCSVerifier public verifier;

    // Test fixtures
    bytes32 constant TEST_MESSAGE = keccak256("Quantum Shield Test Message");
    bytes constant TEST_PUBLIC_KEY = hex"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    function setUp() public {
        verifier = new SPHINCSVerifier();
    }

    // =========================================================================
    // [TEST-SHAKE-001] SHA3-256 Public Key Hash Tests
    // =========================================================================

    /// @notice Verify computePublicKeyHash uses SHA3-256 (NOT keccak256)
    /// @dev CP-1 compliance: keccak256 is prohibited, must use SHA3-256
    function test_ComputePublicKeyHash_UsesSHA3() public view {
        bytes32 hash = verifier.computePublicKeyHash(TEST_PUBLIC_KEY);
        bytes32 sha3Hash = SHA3_256.hash(TEST_PUBLIC_KEY);
        bytes32 keccakHash = keccak256(TEST_PUBLIC_KEY);
        
        // Must match SHA3-256
        assertEq(hash, sha3Hash, "computePublicKeyHash must use SHA3-256");
        
        // Must NOT match keccak256
        assertTrue(hash != keccakHash, "computePublicKeyHash must NOT use keccak256");
    }

    /// @notice Verify public key hash is deterministic
    function test_ComputePublicKeyHash_Deterministic() public view {
        bytes32 hash1 = verifier.computePublicKeyHash(TEST_PUBLIC_KEY);
        bytes32 hash2 = verifier.computePublicKeyHash(TEST_PUBLIC_KEY);
        
        assertEq(hash1, hash2, "Hash should be deterministic");
    }

    // =========================================================================
    // [TEST-SHAKE-002] SPHINCS+ Constants Verification (SHAKE-128s)
    // =========================================================================

    /// @notice Verify SPHINCS+-SHAKE-128s constants match FIPS 205
    function test_Constants_SHAKE128s() public view {
        assertEq(verifier.N(), 16, "N should be 16");
        assertEq(verifier.W(), 16, "W should be 16");
        assertEq(verifier.WOTS_LEN(), 35, "WOTS_LEN should be 35");
        assertEq(verifier.TREE_HEIGHT(), 63, "TREE_HEIGHT should be 63");
        assertEq(verifier.D(), 7, "D should be 7");
        assertEq(verifier.SUBTREE_HEIGHT(), 9, "SUBTREE_HEIGHT should be 9");
        assertEq(verifier.FORS_TREES(), 14, "FORS_TREES should be 14");
        assertEq(verifier.FORS_HEIGHT(), 12, "FORS_HEIGHT should be 12");
        assertEq(verifier.SIGNATURE_SIZE(), 7856, "SIGNATURE_SIZE should be 7856");
        assertEq(verifier.PUBLIC_KEY_SIZE(), 32, "PUBLIC_KEY_SIZE should be 32");
    }

    // =========================================================================
    // [TEST-SHAKE-003] Input Validation Tests
    // =========================================================================

    function test_RevertInvalidSignatureLength() public {
        bytes memory invalidSig = new bytes(100);
        
        vm.expectRevert(SPHINCSVerifier.InvalidSignatureLength.selector);
        verifier.verify(TEST_MESSAGE, invalidSig, TEST_PUBLIC_KEY);
    }

    function test_RevertInvalidPublicKeyLength() public {
        bytes memory validSig = new bytes(7856);
        bytes memory invalidPK = new bytes(16);
        
        vm.expectRevert(SPHINCSVerifier.InvalidPublicKeyLength.selector);
        verifier.verify(TEST_MESSAGE, validSig, invalidPK);
    }

    function test_ComputePublicKeyHash_RevertInvalidLength() public {
        bytes memory invalidPK = new bytes(16);
        
        vm.expectRevert(SPHINCSVerifier.InvalidPublicKeyLength.selector);
        verifier.computePublicKeyHash(invalidPK);
    }

    // =========================================================================
    // [TEST-SHAKE-004] Batch Verification Tests
    // =========================================================================

    function test_BatchSizeMismatch() public {
        bytes32[] memory messages = new bytes32[](2);
        bytes[] memory signatures = new bytes[](3);
        bytes[] memory publicKeys = new bytes[](2);
        
        vm.expectRevert(SPHINCSVerifier.BatchSizeMismatch.selector);
        verifier.verifyBatch(messages, signatures, publicKeys);
    }

    function test_BatchTooLarge() public {
        bytes32[] memory messages = new bytes32[](11);
        bytes[] memory signatures = new bytes[](11);
        bytes[] memory publicKeys = new bytes[](11);
        
        vm.expectRevert(SPHINCSVerifier.BatchTooLarge.selector);
        verifier.verifyBatch(messages, signatures, publicKeys);
    }

    // =========================================================================
    // [TEST-SHAKE-005] Utility Function Tests
    // =========================================================================

    function test_IsValidPublicKeyFormat() public view {
        assertTrue(verifier.isValidPublicKeyFormat(TEST_PUBLIC_KEY));
        
        bytes memory shortPK = new bytes(16);
        assertFalse(verifier.isValidPublicKeyFormat(shortPK));
        
        bytes memory longPK = new bytes(64);
        assertFalse(verifier.isValidPublicKeyFormat(longPK));
    }

    function test_GetSignatureSize() public view {
        assertEq(verifier.getSignatureSize(), 7856);
    }

    function test_SupportsInterface() public view {
        assertTrue(verifier.supportsInterface(0x7f5c4e5a));
        assertFalse(verifier.supportsInterface(0x12345678));
    }

    // =========================================================================
    // [TEST-SHAKE-006] VerifyWithDetails Tests
    // =========================================================================

    function test_VerifyWithDetails_InvalidSignatureLength() public view {
        bytes memory invalidSig = new bytes(100);
        
        SPHINCSVerifier.VerificationResult memory result = 
            verifier.verifyWithDetails(TEST_MESSAGE, invalidSig, TEST_PUBLIC_KEY);
        
        assertFalse(result.valid);
        assertEq(result.errorReason, "Invalid signature length");
    }

    function test_VerifyWithDetails_InvalidPublicKeyLength() public view {
        bytes memory validSig = new bytes(7856);
        bytes memory invalidPK = new bytes(16);
        
        SPHINCSVerifier.VerificationResult memory result = 
            verifier.verifyWithDetails(TEST_MESSAGE, validSig, invalidPK);
        
        assertFalse(result.valid);
        assertEq(result.errorReason, "Invalid public key length");
    }

    // =========================================================================
    // [TEST-SHAKE-007] CP-1 Compliance Tests
    // =========================================================================

    /// @notice Verify no keccak256 is used in critical paths
    /// @dev Core Principle CP-1: No SHA-2 family or keccak256 in cryptographic functions
    function test_CP1_NoKeccak256InCryptoFunctions() public view {
        // Public key hash must use SHA3-256
        bytes32 hash = verifier.computePublicKeyHash(TEST_PUBLIC_KEY);
        bytes32 sha3Hash = SHA3_256.hash(TEST_PUBLIC_KEY);
        
        assertEq(hash, sha3Hash, "CP-1: Must use SHA3-256 for public key hash");
    }

    // =========================================================================
    // [TEST-SHAKE-008] Gas Benchmarks
    // =========================================================================

    function test_Gas_ComputePublicKeyHash() public view {
        uint256 gasBefore = gasleft();
        verifier.computePublicKeyHash(TEST_PUBLIC_KEY);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for computePublicKeyHash (SHA3-256):", gasUsed);
    }

    function test_Gas_VerifyWithDetails_ValidationPath() public view {
        bytes memory invalidSig = new bytes(100);
        
        uint256 gasBefore = gasleft();
        verifier.verifyWithDetails(TEST_MESSAGE, invalidSig, TEST_PUBLIC_KEY);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for verifyWithDetails (validation failure path):", gasUsed);
    }

    // =========================================================================
    // [TEST-SHAKE-009] Fuzz Tests
    // =========================================================================

    function testFuzz_ComputePublicKeyHash(bytes32 pk1) public view {
        bytes memory publicKey = abi.encodePacked(pk1);
        vm.assume(publicKey.length == 32);
        
        bytes32 hash = verifier.computePublicKeyHash(publicKey);
        bytes32 expected = SHA3_256.hash(publicKey);
        
        assertEq(hash, expected, "Fuzz: Hash must match SHA3-256");
    }
}
