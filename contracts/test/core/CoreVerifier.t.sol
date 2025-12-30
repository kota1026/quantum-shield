// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ICoreVerifier} from "../../src/interfaces/ICoreVerifier.sol";
import {CoreVerifier} from "../../src/core/CoreVerifier.sol";
import {SPHINCSVerifier} from "../../src/SPHINCSVerifier.sol";

/// @title CoreVerifierTest
/// @notice Unit tests for CoreVerifier
/// @dev TEST-001: ICoreVerifier interface test
///      TEST-002: CoreVerifier unit test (SPHINCS+ verification)
contract CoreVerifierTest is Test {
    CoreVerifier public verifier;
    SPHINCSVerifier public sphincsVerifier;

    // Test constants
    uint256 constant EXPECTED_SECURITY_LEVEL = 128;
    uint256 constant EXPECTED_SIGNATURE_SIZE = 7856;
    uint256 constant EXPECTED_PUBLIC_KEY_SIZE = 32;

    // Test data (invalid but correctly sized)
    bytes32 constant TEST_MESSAGE = keccak256("test message");
    bytes constant TEST_PUBLIC_KEY = hex"0102030405060708091011121314151617181920212223242526272829303132";

    function setUp() public {
        sphincsVerifier = new SPHINCSVerifier();
        verifier = new CoreVerifier(address(sphincsVerifier));
    }

    // =========================================================================
    // TEST-001: Interface Tests
    // =========================================================================

    function test_securityLevel() public view {
        assertEq(
            verifier.securityLevel(),
            EXPECTED_SECURITY_LEVEL,
            "Security level should be 128-bit"
        );
    }

    function test_getSignatureSize() public view {
        assertEq(
            verifier.getSignatureSize(),
            EXPECTED_SIGNATURE_SIZE,
            "Signature size should be 7856 bytes"
        );
    }

    function test_getPublicKeySize() public view {
        assertEq(
            verifier.getPublicKeySize(),
            EXPECTED_PUBLIC_KEY_SIZE,
            "Public key size should be 32 bytes"
        );
    }

    function test_getSPHINCSVerifier() public view {
        assertEq(
            verifier.getSPHINCSVerifier(),
            address(sphincsVerifier),
            "Should return correct SPHINCSVerifier address"
        );
    }

    function test_isValidPublicKeyFormat_valid() public view {
        assertTrue(
            verifier.isValidPublicKeyFormat(TEST_PUBLIC_KEY),
            "32-byte key should be valid"
        );
    }

    function test_isValidPublicKeyFormat_invalidLength() public view {
        bytes memory shortKey = hex"0102030405";
        assertFalse(
            verifier.isValidPublicKeyFormat(shortKey),
            "Short key should be invalid"
        );
    }

    function test_computePublicKeyHash() public view {
        bytes32 hash = verifier.computePublicKeyHash(TEST_PUBLIC_KEY);
        assertTrue(hash != bytes32(0), "Hash should not be zero");
    }

    // =========================================================================
    // TEST-002: SPHINCS+ Verification Tests
    // =========================================================================

    function test_verifySPHINCS_invalidSignatureLength() public {
        bytes memory shortSig = new bytes(100);
        
        vm.expectRevert(
            abi.encodeWithSelector(
                ICoreVerifier.InvalidSignatureLength.selector,
                100,
                EXPECTED_SIGNATURE_SIZE
            )
        );
        verifier.verifySPHINCS(TEST_MESSAGE, shortSig, TEST_PUBLIC_KEY);
    }

    function test_verifySPHINCS_invalidPublicKeyLength() public {
        bytes memory correctSig = new bytes(EXPECTED_SIGNATURE_SIZE);
        bytes memory shortKey = hex"0102030405";
        
        vm.expectRevert(
            abi.encodeWithSelector(
                ICoreVerifier.InvalidPublicKeyLength.selector,
                5,
                EXPECTED_PUBLIC_KEY_SIZE
            )
        );
        verifier.verifySPHINCS(TEST_MESSAGE, correctSig, shortKey);
    }

    function test_verifySPHINCS_invalidSignature() public view {
        // Create correctly sized but invalid signature
        bytes memory invalidSig = new bytes(EXPECTED_SIGNATURE_SIZE);
        
        // Should return false for invalid signature (not revert)
        bool valid = verifier.verifySPHINCS(TEST_MESSAGE, invalidSig, TEST_PUBLIC_KEY);
        assertFalse(valid, "Invalid signature should return false");
    }

    function test_verifySPHINCSWithDetails_invalidSignature() public view {
        bytes memory invalidSig = new bytes(EXPECTED_SIGNATURE_SIZE);
        
        ICoreVerifier.VerificationResult memory result = 
            verifier.verifySPHINCSWithDetails(TEST_MESSAGE, invalidSig, TEST_PUBLIC_KEY);
        
        assertFalse(result.valid, "Invalid signature should not be valid");
        assertTrue(result.gasUsed > 0, "Should report gas used");
    }

    // =========================================================================
    // Multi-Signature Tests
    // =========================================================================

    function test_verifyMultiSPHINCS_threshold() public view {
        // Create 3 signatures (all invalid, but testing threshold logic)
        bytes[] memory sigs = new bytes[](3);
        bytes[] memory pks = new bytes[](3);
        
        for (uint256 i = 0; i < 3; i++) {
            sigs[i] = new bytes(EXPECTED_SIGNATURE_SIZE);
            pks[i] = TEST_PUBLIC_KEY;
        }
        
        // Threshold = 2, but all invalid
        (bool valid, uint256 count) = verifier.verifyMultiSPHINCS(
            TEST_MESSAGE,
            sigs,
            pks,
            2
        );
        
        assertFalse(valid, "Should not pass with all invalid sigs");
        assertEq(count, 0, "Valid count should be 0");
    }

    function test_verifyMultiSPHINCS_arrayMismatch() public {
        bytes[] memory sigs = new bytes[](2);
        bytes[] memory pks = new bytes[](3);  // Mismatched length
        
        sigs[0] = new bytes(EXPECTED_SIGNATURE_SIZE);
        sigs[1] = new bytes(EXPECTED_SIGNATURE_SIZE);
        pks[0] = TEST_PUBLIC_KEY;
        pks[1] = TEST_PUBLIC_KEY;
        pks[2] = TEST_PUBLIC_KEY;
        
        vm.expectRevert(ICoreVerifier.ArrayLengthMismatch.selector);
        verifier.verifyMultiSPHINCS(TEST_MESSAGE, sigs, pks, 1);
    }

    function test_verifyTwoOfFive_insufficientSignatures() public view {
        bytes[] memory sigs = new bytes[](1);
        bytes[] memory pks = new bytes[](1);
        
        sigs[0] = new bytes(EXPECTED_SIGNATURE_SIZE);
        pks[0] = TEST_PUBLIC_KEY;
        
        // Should return false as we need at least 2
        bool valid = verifier.verifyTwoOfFive(TEST_MESSAGE, sigs, pks);
        assertFalse(valid, "Should fail with only 1 signature");
    }

    // =========================================================================
    // Gas Benchmark Tests (TEST-004)
    // =========================================================================

    function test_verifySPHINCS_gasBenchmark() public view {
        bytes memory sig = new bytes(EXPECTED_SIGNATURE_SIZE);
        
        uint256 gasBefore = gasleft();
        verifier.verifySPHINCS(TEST_MESSAGE, sig, TEST_PUBLIC_KEY);
        uint256 gasUsed = gasBefore - gasleft();
        
        // Target: ~200K gas per signature (from CURRENT_PLAN)
        // Allow up to 500K for safety margin
        assertLt(
            gasUsed,
            500_000,
            "Gas usage should be under 500K"
        );
        
        emit log_named_uint("Single SPHINCS+ verification gas", gasUsed);
    }

    function test_verifyMultiSPHINCS_gasBenchmark() public view {
        bytes[] memory sigs = new bytes[](2);
        bytes[] memory pks = new bytes[](2);
        
        for (uint256 i = 0; i < 2; i++) {
            sigs[i] = new bytes(EXPECTED_SIGNATURE_SIZE);
            pks[i] = TEST_PUBLIC_KEY;
        }
        
        uint256 gasBefore = gasleft();
        verifier.verifyMultiSPHINCS(TEST_MESSAGE, sigs, pks, 2);
        uint256 gasUsed = gasBefore - gasleft();
        
        // Target: ~400K gas for 2/5 verification (from CURRENT_PLAN)
        // Allow up to 1M for safety margin
        assertLt(
            gasUsed,
            1_000_000,
            "Gas usage for 2 sigs should be under 1M"
        );
        
        emit log_named_uint("2-sig SPHINCS+ verification gas", gasUsed);
    }

    // =========================================================================
    // CP-1 Compliance Tests
    // =========================================================================

    function test_cp1_noKeccak256InHash() public view {
        // Verify that computePublicKeyHash uses SHA3-256, not keccak256
        bytes32 hash = verifier.computePublicKeyHash(TEST_PUBLIC_KEY);
        bytes32 keccakHash = keccak256(TEST_PUBLIC_KEY);
        
        // SHA3-256 and keccak256 should produce different results
        assertTrue(
            hash != keccakHash,
            "Hash should use SHA3-256, not keccak256"
        );
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    function test_constructor_zeroAddress() public {
        vm.expectRevert("Zero address");
        new CoreVerifier(address(0));
    }

    function test_verifyMultiSPHINCS_emptyArrays() public view {
        bytes[] memory sigs = new bytes[](0);
        bytes[] memory pks = new bytes[](0);
        
        (bool valid, uint256 count) = verifier.verifyMultiSPHINCS(
            TEST_MESSAGE,
            sigs,
            pks,
            0
        );
        
        assertTrue(valid, "Empty with threshold 0 should pass");
        assertEq(count, 0, "Count should be 0");
    }
}
