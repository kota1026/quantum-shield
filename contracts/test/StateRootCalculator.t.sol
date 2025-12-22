// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/libraries/StateRootCalculator.sol";
import "../src/libraries/SHA3_256.sol";

/// @title StateRootCalculatorTest
/// @notice Comprehensive tests for StateRootCalculator library
/// @dev Tests SR_0 and SR_1 computation per QUANTUM_SHIELD_SEQUENCES_v2.0
contract StateRootCalculatorTest is Test {
    // =========================================================================
    // Test Data
    // =========================================================================

    uint256 constant TEST_CHAIN_ID = 1;
    address constant TEST_ASSET = address(0); // ETH
    uint256 constant TEST_AMOUNT = 1 ether;
    address constant TEST_DEST_ADDR = address(0x1234567890123456789012345678901234567890);
    uint256 constant TEST_EXPIRY = 1735084800; // 2024-12-25 00:00:00 UTC
    uint256 constant TEST_NONCE = 42;
    bytes32 constant TEST_PK_DILITHIUM = keccak256("test_dilithium_public_key");

    bytes32 constant TEST_LOCK_ID = keccak256("test_lock_id");
    address constant TEST_SENDER = address(0xABCDEF);
    uint256 constant TEST_TIMESTAMP = 1735000000;

    // =========================================================================
    // SR_0 Tests
    // =========================================================================

    function test_ComputeSR0_Deterministic() public pure {
        bytes32 sr0_1 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID,
            TEST_ASSET,
            TEST_AMOUNT,
            TEST_DEST_ADDR,
            TEST_EXPIRY,
            TEST_NONCE,
            TEST_PK_DILITHIUM
        );

        bytes32 sr0_2 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID,
            TEST_ASSET,
            TEST_AMOUNT,
            TEST_DEST_ADDR,
            TEST_EXPIRY,
            TEST_NONCE,
            TEST_PK_DILITHIUM
        );

        assertEq(sr0_1, sr0_2, "SR_0 should be deterministic");
    }

    function test_ComputeSR0_NonZero() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID,
            TEST_ASSET,
            TEST_AMOUNT,
            TEST_DEST_ADDR,
            TEST_EXPIRY,
            TEST_NONCE,
            TEST_PK_DILITHIUM
        );

        assertTrue(sr0 != bytes32(0), "SR_0 should not be zero");
    }

    function test_ComputeSR0_DifferentChainId() public pure {
        bytes32 sr0_chain1 = StateRootCalculator.computeSR0(
            1, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr0_chain2 = StateRootCalculator.computeSR0(
            2, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        assertTrue(sr0_chain1 != sr0_chain2, "Different chain_id should produce different SR_0");
    }

    function test_ComputeSR0_DifferentAsset() public pure {
        bytes32 sr0_eth = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, address(0), TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr0_token = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, address(0x1111), TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        assertTrue(sr0_eth != sr0_token, "Different asset should produce different SR_0");
    }

    function test_ComputeSR0_DifferentAmount() public pure {
        bytes32 sr0_1eth = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, 1 ether, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr0_2eth = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, 2 ether, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        assertTrue(sr0_1eth != sr0_2eth, "Different amount should produce different SR_0");
    }

    function test_ComputeSR0_DifferentDestAddr() public pure {
        bytes32 sr0_addr1 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, address(0x1111), TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr0_addr2 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, address(0x2222), TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        assertTrue(sr0_addr1 != sr0_addr2, "Different dest_addr should produce different SR_0");
    }

    function test_ComputeSR0_DifferentExpiry() public pure {
        bytes32 sr0_exp1 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, 1000, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr0_exp2 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, 2000, TEST_NONCE, TEST_PK_DILITHIUM
        );

        assertTrue(sr0_exp1 != sr0_exp2, "Different expiry should produce different SR_0");
    }

    function test_ComputeSR0_DifferentNonce() public pure {
        bytes32 sr0_nonce1 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, 1, TEST_PK_DILITHIUM
        );

        bytes32 sr0_nonce2 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, 2, TEST_PK_DILITHIUM
        );

        assertTrue(sr0_nonce1 != sr0_nonce2, "Different nonce should produce different SR_0");
    }

    function test_ComputeSR0_DifferentPkDilithium() public pure {
        bytes32 sr0_pk1 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, keccak256("pk1")
        );

        bytes32 sr0_pk2 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, keccak256("pk2")
        );

        assertTrue(sr0_pk1 != sr0_pk2, "Different pk_dilithium should produce different SR_0");
    }

    // =========================================================================
    // SR_0 with Raw Key Tests
    // =========================================================================

    function test_ComputeSR0WithRawKey() public pure {
        bytes memory rawKey = "test_dilithium_public_key";
        bytes32 expectedPkHash = keccak256(rawKey);

        bytes32 sr0_raw = StateRootCalculator.computeSR0WithRawKey(
            TEST_CHAIN_ID,
            TEST_ASSET,
            TEST_AMOUNT,
            TEST_DEST_ADDR,
            TEST_EXPIRY,
            TEST_NONCE,
            rawKey
        );

        bytes32 sr0_hash = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID,
            TEST_ASSET,
            TEST_AMOUNT,
            TEST_DEST_ADDR,
            TEST_EXPIRY,
            TEST_NONCE,
            expectedPkHash
        );

        assertEq(sr0_raw, sr0_hash, "computeSR0WithRawKey should match computeSR0 with hashed key");
    }

    // =========================================================================
    // SR_1 Tests
    // =========================================================================

    function test_ComputeSR1_Deterministic() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1_1 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        bytes32 sr1_2 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        assertEq(sr1_1, sr1_2, "SR_1 should be deterministic");
    }

    function test_ComputeSR1_NonZero() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        assertTrue(sr1 != bytes32(0), "SR_1 should not be zero");
    }

    function test_ComputeSR1_DifferentSR0() public pure {
        bytes32 sr0_1 = StateRootCalculator.computeSR0(
            1, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );
        bytes32 sr0_2 = StateRootCalculator.computeSR0(
            2, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1_1 = StateRootCalculator.computeSR1(
            sr0_1, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );
        bytes32 sr1_2 = StateRootCalculator.computeSR1(
            sr0_2, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        assertTrue(sr1_1 != sr1_2, "Different SR_0 should produce different SR_1");
    }

    function test_ComputeSR1_DifferentLockId() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1_1 = StateRootCalculator.computeSR1(
            sr0, keccak256("lock1"), TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );
        bytes32 sr1_2 = StateRootCalculator.computeSR1(
            sr0, keccak256("lock2"), TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        assertTrue(sr1_1 != sr1_2, "Different lock_id should produce different SR_1");
    }

    function test_ComputeSR1_DifferentDestAddr() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1_1 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, address(0x1111), TEST_AMOUNT, TEST_NONCE
        );
        bytes32 sr1_2 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, address(0x2222), TEST_AMOUNT, TEST_NONCE
        );

        assertTrue(sr1_1 != sr1_2, "Different dest_addr should produce different SR_1");
    }

    function test_ComputeSR1_DifferentAmount() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1_1 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, TEST_DEST_ADDR, 1 ether, TEST_NONCE
        );
        bytes32 sr1_2 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, TEST_DEST_ADDR, 2 ether, TEST_NONCE
        );

        assertTrue(sr1_1 != sr1_2, "Different amount should produce different SR_1");
    }

    function test_ComputeSR1_DifferentNonce() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1_1 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, 1
        );
        bytes32 sr1_2 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, 2
        );

        assertTrue(sr1_1 != sr1_2, "Different nonce should produce different SR_1");
    }

    // =========================================================================
    // SR_1 Dependency on SR_0 Tests
    // =========================================================================

    function test_SR1_DependsOn_SR0() public pure {
        // Verify that SR_1 changes when any SR_0 parameter changes
        bytes32 sr0_original = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr0_modified = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID + 1, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1_original = StateRootCalculator.computeSR1(
            sr0_original, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        bytes32 sr1_modified = StateRootCalculator.computeSR1(
            sr0_modified, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        assertTrue(sr1_original != sr1_modified, "SR_1 should change when SR_0 changes");
    }

    // =========================================================================
    // Lock ID Generation Tests
    // =========================================================================

    function test_GenerateLockId_Deterministic() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 lockId1 = StateRootCalculator.generateLockId(sr0, TEST_SENDER, TEST_TIMESTAMP);
        bytes32 lockId2 = StateRootCalculator.generateLockId(sr0, TEST_SENDER, TEST_TIMESTAMP);

        assertEq(lockId1, lockId2, "Lock ID should be deterministic");
    }

    function test_GenerateLockId_NonZero() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 lockId = StateRootCalculator.generateLockId(sr0, TEST_SENDER, TEST_TIMESTAMP);

        assertTrue(lockId != bytes32(0), "Lock ID should not be zero");
    }

    function test_GenerateLockId_DifferentSR0() public pure {
        bytes32 sr0_1 = StateRootCalculator.computeSR0(
            1, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );
        bytes32 sr0_2 = StateRootCalculator.computeSR0(
            2, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 lockId1 = StateRootCalculator.generateLockId(sr0_1, TEST_SENDER, TEST_TIMESTAMP);
        bytes32 lockId2 = StateRootCalculator.generateLockId(sr0_2, TEST_SENDER, TEST_TIMESTAMP);

        assertTrue(lockId1 != lockId2, "Different SR_0 should produce different lock ID");
    }

    function test_GenerateLockId_DifferentSender() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 lockId1 = StateRootCalculator.generateLockId(sr0, address(0x1111), TEST_TIMESTAMP);
        bytes32 lockId2 = StateRootCalculator.generateLockId(sr0, address(0x2222), TEST_TIMESTAMP);

        assertTrue(lockId1 != lockId2, "Different sender should produce different lock ID");
    }

    function test_GenerateLockId_DifferentTimestamp() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 lockId1 = StateRootCalculator.generateLockId(sr0, TEST_SENDER, 1000);
        bytes32 lockId2 = StateRootCalculator.generateLockId(sr0, TEST_SENDER, 2000);

        assertTrue(lockId1 != lockId2, "Different timestamp should produce different lock ID");
    }

    // =========================================================================
    // Verification Tests
    // =========================================================================

    function test_VerifySR0_Valid() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bool valid = StateRootCalculator.verifySR0(
            sr0,
            TEST_CHAIN_ID,
            TEST_ASSET,
            TEST_AMOUNT,
            TEST_DEST_ADDR,
            TEST_EXPIRY,
            TEST_NONCE,
            TEST_PK_DILITHIUM
        );

        assertTrue(valid, "verifySR0 should return true for matching parameters");
    }

    function test_VerifySR0_Invalid() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        // Wrong chain_id
        bool valid = StateRootCalculator.verifySR0(
            sr0,
            TEST_CHAIN_ID + 1,  // Different chain_id
            TEST_ASSET,
            TEST_AMOUNT,
            TEST_DEST_ADDR,
            TEST_EXPIRY,
            TEST_NONCE,
            TEST_PK_DILITHIUM
        );

        assertFalse(valid, "verifySR0 should return false for non-matching parameters");
    }

    function test_VerifySR1_Valid() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        bool valid = StateRootCalculator.verifySR1(
            sr1, sr0, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        assertTrue(valid, "verifySR1 should return true for matching parameters");
    }

    function test_VerifySR1_Invalid() public pure {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        bytes32 sr1 = StateRootCalculator.computeSR1(
            sr0, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        // Wrong lock_id
        bool valid = StateRootCalculator.verifySR1(
            sr1, sr0, keccak256("wrong_lock_id"), TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE
        );

        assertFalse(valid, "verifySR1 should return false for non-matching parameters");
    }

    // =========================================================================
    // Domain Separator Tests
    // =========================================================================

    function test_DomainSeparators_Unique() public pure {
        assertTrue(
            StateRootCalculator.DOMAIN_LOCK() != StateRootCalculator.DOMAIN_UNLOCK(),
            "DOMAIN_LOCK and DOMAIN_UNLOCK should be different"
        );
    }

    function test_DomainSeparators_NonZero() public pure {
        assertTrue(StateRootCalculator.DOMAIN_LOCK() != bytes32(0), "DOMAIN_LOCK should not be zero");
        assertTrue(StateRootCalculator.DOMAIN_UNLOCK() != bytes32(0), "DOMAIN_UNLOCK should not be zero");
    }

    // =========================================================================
    // Utility Function Tests
    // =========================================================================

    function test_Version() public pure {
        string memory ver = StateRootCalculator.version();
        assertTrue(bytes(ver).length > 0, "Version should not be empty");
    }

    function test_IsSpecCompliant() public pure {
        bool compliant = StateRootCalculator.isSpecCompliant();
        assertTrue(compliant, "Library should be specification compliant");
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    function testFuzz_ComputeSR0_Deterministic(
        uint256 chainId,
        address asset,
        uint256 amount,
        address destAddr,
        uint256 expiry,
        uint256 nonce,
        bytes32 pkDilithium
    ) public pure {
        bytes32 sr0_1 = StateRootCalculator.computeSR0(
            chainId, asset, amount, destAddr, expiry, nonce, pkDilithium
        );
        bytes32 sr0_2 = StateRootCalculator.computeSR0(
            chainId, asset, amount, destAddr, expiry, nonce, pkDilithium
        );

        assertEq(sr0_1, sr0_2, "SR_0 should be deterministic for any input");
    }

    function testFuzz_ComputeSR1_Deterministic(
        bytes32 sr0,
        bytes32 lockId,
        address destAddr,
        uint256 amount,
        uint256 nonce
    ) public pure {
        bytes32 sr1_1 = StateRootCalculator.computeSR1(sr0, lockId, destAddr, amount, nonce);
        bytes32 sr1_2 = StateRootCalculator.computeSR1(sr0, lockId, destAddr, amount, nonce);

        assertEq(sr1_1, sr1_2, "SR_1 should be deterministic for any input");
    }

    function testFuzz_GenerateLockId_Deterministic(
        bytes32 sr0,
        address sender,
        uint256 timestamp
    ) public pure {
        bytes32 lockId1 = StateRootCalculator.generateLockId(sr0, sender, timestamp);
        bytes32 lockId2 = StateRootCalculator.generateLockId(sr0, sender, timestamp);

        assertEq(lockId1, lockId2, "Lock ID should be deterministic for any input");
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    function test_Gas_ComputeSR0() public view {
        uint256 gasBefore = gasleft();
        StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for computeSR0", gasUsed);
        // SR_0 uses SHA3-256, expect ~1.3M gas
    }

    function test_Gas_ComputeSR1() public view {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        uint256 gasBefore = gasleft();
        StateRootCalculator.computeSR1(sr0, TEST_LOCK_ID, TEST_DEST_ADDR, TEST_AMOUNT, TEST_NONCE);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for computeSR1", gasUsed);
    }

    function test_Gas_GenerateLockId() public view {
        bytes32 sr0 = StateRootCalculator.computeSR0(
            TEST_CHAIN_ID, TEST_ASSET, TEST_AMOUNT, TEST_DEST_ADDR, TEST_EXPIRY, TEST_NONCE, TEST_PK_DILITHIUM
        );

        uint256 gasBefore = gasleft();
        StateRootCalculator.generateLockId(sr0, TEST_SENDER, TEST_TIMESTAMP);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for generateLockId", gasUsed);
    }
}
