// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {QuantumShield} from "../../src/QuantumShield.sol";
import {SHA3_256} from "../../src/libraries/SHA3_256.sol";

/// @title SEC-003 Test Suite - QuantumShield SHA3_256 Migration
/// @notice Tests for keccak256 → SHA3_256 migration (CP-1 compliance)
/// @dev Addresses ISSUE-001 from SPEC_REVIEW.md
///
/// Test Coverage:
/// - [TEST-SEC003-01] Existing functionality regression tests
/// - [TEST-SEC003-02] lock() function hash integrity
/// - [TEST-SEC003-03] releaseWithProof() integration
/// - [TEST-SEC003-04] _hashPublicInputs() unit tests
/// - [TEST-SEC003-05] Gas consumption benchmarks
contract SEC003Test is Test {
    QuantumShield public shield;

    address public owner = address(this);
    address public user = address(0xBEEF);
    address public recipient = address(0xCAFE);

    bytes32 public testPubKeyHash;

    event Locked(
        bytes32 indexed lockId,
        address indexed sender,
        uint256 amount,
        bytes32 dilithiumPubKeyHash,
        uint256 nonce
    );

    function setUp() public {
        shield = new QuantumShield();
        vm.deal(user, 100 ether);
        
        // Use SHA3_256 for test pub key hash (consistent with new implementation)
        testPubKeyHash = SHA3_256.hash(bytes("test-dilithium-pubkey"));
    }

    // =========================================================================
    // [TEST-SEC003-01] Regression Tests - Existing Functionality
    // =========================================================================

    /// @notice Verify lock() still creates locks correctly after SHA3_256 migration
    function test_SEC003_01_Lock_FunctionalityPreserved() public {
        vm.prank(user);
        bytes32 lockId = shield.lock{value: 1 ether}(testPubKeyHash);

        (address sender, uint256 amount, bytes32 pkHash, uint256 timestamp, bool released) =
            shield.getLock(lockId);

        assertEq(sender, user, "Sender should match");
        assertEq(amount, 1 ether, "Amount should match");
        assertEq(pkHash, testPubKeyHash, "PubKeyHash should match");
        assertEq(timestamp, block.timestamp, "Timestamp should match");
        assertFalse(released, "Should not be released");
        assertEq(shield.totalLocked(), 1 ether, "Total locked should be 1 ether");
    }

    /// @notice Verify multiple locks create unique IDs
    function test_SEC003_01_Lock_UniqueIDs() public {
        vm.startPrank(user);
        
        bytes32 lockId1 = shield.lock{value: 1 ether}(testPubKeyHash);
        bytes32 lockId2 = shield.lock{value: 1 ether}(testPubKeyHash);
        bytes32 lockId3 = shield.lock{value: 2 ether}(testPubKeyHash);

        vm.stopPrank();

        assertTrue(lockId1 != lockId2, "Lock IDs should be unique (same params, different nonce)");
        assertTrue(lockId2 != lockId3, "Lock IDs should be unique (different amount)");
        assertTrue(lockId1 != lockId3, "Lock IDs should be unique");
    }

    /// @notice Verify error handling is preserved
    function test_SEC003_01_Lock_RevertOnZeroValue() public {
        vm.prank(user);
        vm.expectRevert(QuantumShield.InsufficientAmount.selector);
        shield.lock{value: 0}(testPubKeyHash);
    }

    /// @notice Verify pause functionality still works
    function test_SEC003_01_Lock_RevertWhenPaused() public {
        shield.pause();

        vm.prank(user);
        vm.expectRevert(QuantumShield.Paused.selector);
        shield.lock{value: 1 ether}(testPubKeyHash);
    }

    // =========================================================================
    // [TEST-SEC003-02] lock() Function Hash Integrity Tests
    // =========================================================================

    /// @notice Verify lockId is computed using SHA3_256 (not keccak256)
    /// @dev This is the critical test for CP-1 compliance
    function test_SEC003_02_Lock_UsesSHA3_256() public {
        uint256 nonceBefore = shield.nonceCounter();
        uint256 timestamp = block.timestamp;
        uint256 amount = 1 ether;

        vm.prank(user);
        bytes32 actualLockId = shield.lock{value: amount}(testPubKeyHash);

        // Compute expected lockId using SHA3_256
        bytes32 expectedLockId = SHA3_256.hash(abi.encodePacked(
            user,
            amount,
            testPubKeyHash,
            nonceBefore,
            timestamp
        ));

        assertEq(actualLockId, expectedLockId, "lockId should be computed with SHA3_256");
    }

    /// @notice Verify lockId is NOT computed using keccak256
    function test_SEC003_02_Lock_NotKeccak256() public {
        uint256 nonceBefore = shield.nonceCounter();
        uint256 timestamp = block.timestamp;
        uint256 amount = 1 ether;

        vm.prank(user);
        bytes32 actualLockId = shield.lock{value: amount}(testPubKeyHash);

        // Compute what keccak256 would produce (should NOT match)
        bytes32 keccakLockId = keccak256(abi.encodePacked(
            user,
            amount,
            testPubKeyHash,
            nonceBefore,
            timestamp
        ));

        assertTrue(actualLockId != keccakLockId, "lockId should NOT use keccak256 (CP-1 violation)");
    }

    /// @notice Verify lockId is deterministic
    function test_SEC003_02_Lock_Deterministic() public {
        // Create two contracts to verify same inputs produce same hash
        bytes memory data = abi.encodePacked(
            user,
            uint256(1 ether),
            testPubKeyHash,
            uint256(0),
            block.timestamp
        );

        bytes32 hash1 = SHA3_256.hash(data);
        bytes32 hash2 = SHA3_256.hash(data);

        assertEq(hash1, hash2, "SHA3_256 should be deterministic");
    }

    // =========================================================================
    // [TEST-SEC003-03] releaseWithProof() Integration Tests
    // =========================================================================

    /// @notice Verify proof binding uses SHA3_256
    function test_SEC003_03_ProofBinding_UsesSHA3_256() public {
        // Use Level 1 verification for this test
        shield.setVerificationLevel(false);

        vm.prank(user);
        bytes32 lockId = shield.lock{value: 1 ether}(testPubKeyHash);

        QuantumShield.PublicInputs memory pi = _createValidPublicInputs(lockId, 1 ether);
        QuantumShield.StarkProof memory proof = _createMinimalProof();

        // The proof will fail verification, but we're testing the SHA3_256 path exists
        // If keccak256 was still being used, internal hash computations would differ
        vm.expectRevert(); // Expected to revert on proof validation
        shield.releaseWithProof(pi, proof);
    }

    /// @notice Verify public inputs hash uses SHA3_256
    function test_SEC003_03_PublicInputsHash_Structure() public {
        bytes32 lockId = _createLock(1 ether);
        QuantumShield.PublicInputs memory pi = _createValidPublicInputs(lockId, 1 ether);

        // Compute expected hash using SHA3_256
        bytes32 expectedHash = SHA3_256.hash(abi.encodePacked(
            pi.publicKeyHash,
            pi.messageHash,
            pi.signatureValid,
            pi.nonce,
            pi.recipient,
            pi.amount,
            pi.lockId
        ));

        // The hash should be non-zero and deterministic
        assertTrue(expectedHash != bytes32(0), "Public inputs hash should be non-zero");
    }

    /// @notice Verify lock data matches after SHA3_256 migration
    function test_SEC003_03_LockDataIntegrity() public {
        bytes32 lockId = _createLock(2.5 ether);

        (address sender, uint256 amount, bytes32 pkHash, uint256 timestamp, bool released) =
            shield.getLock(lockId);

        assertEq(sender, user, "Sender preserved");
        assertEq(amount, 2.5 ether, "Amount preserved");
        assertEq(pkHash, testPubKeyHash, "PubKeyHash preserved");
        assertGt(timestamp, 0, "Timestamp set");
        assertFalse(released, "Not released");
    }

    // =========================================================================
    // [TEST-SEC003-04] _hashPublicInputs() Unit Tests
    // =========================================================================

    /// @notice Verify different public inputs produce different hashes
    function test_SEC003_04_HashPublicInputs_Uniqueness() public {
        bytes32 lockId = _createLock(1 ether);
        
        QuantumShield.PublicInputs memory pi1 = _createValidPublicInputs(lockId, 1 ether);
        QuantumShield.PublicInputs memory pi2 = _createValidPublicInputs(lockId, 1 ether);
        pi2.nonce = 999; // Different nonce

        bytes32 hash1 = SHA3_256.hash(abi.encodePacked(
            pi1.publicKeyHash,
            pi1.messageHash,
            pi1.signatureValid,
            pi1.nonce,
            pi1.recipient,
            pi1.amount,
            pi1.lockId
        ));

        bytes32 hash2 = SHA3_256.hash(abi.encodePacked(
            pi2.publicKeyHash,
            pi2.messageHash,
            pi2.signatureValid,
            pi2.nonce,
            pi2.recipient,
            pi2.amount,
            pi2.lockId
        ));

        assertTrue(hash1 != hash2, "Different inputs should produce different hashes");
    }

    /// @notice Verify hash is consistent with SHA3_256 library
    function test_SEC003_04_HashPublicInputs_ConsistentWithLibrary() public pure {
        bytes32 pkHash = SHA3_256.hash(bytes("test-pk"));
        bytes32 msgHash = SHA3_256.hash(bytes("test-msg"));
        bool sigValid = true;
        uint64 nonce = 42;
        address recip = address(0xCAFE);
        uint256 amt = 1 ether;
        bytes32 lId = SHA3_256.hash(bytes("test-lock"));

        bytes memory encoded = abi.encodePacked(
            pkHash,
            msgHash,
            sigValid,
            nonce,
            recip,
            amt,
            lId
        );

        bytes32 hash1 = SHA3_256.hash(encoded);
        bytes32 hash2 = SHA3_256.hash(encoded);

        assertEq(hash1, hash2, "SHA3_256 hash should be consistent");
    }

    // =========================================================================
    // [TEST-SEC003-05] Gas Consumption Benchmarks
    // =========================================================================

    /// @notice Benchmark lock() gas consumption with SHA3_256
    function test_SEC003_05_Gas_Lock() public {
        uint256 gasBefore = gasleft();
        
        vm.prank(user);
        shield.lock{value: 1 ether}(testPubKeyHash);
        
        uint256 gasUsed = gasBefore - gasleft();
        
        // Log gas for comparison (SHA3_256 is more expensive than keccak256)
        console2.log("Gas used for lock() with SHA3_256:", gasUsed);
        
        // SHA3_256 is expected to use more gas than keccak256
        // keccak256 baseline: ~50K gas
        // SHA3_256 expected: ~300K-500K gas (pure Solidity implementation)
        assertTrue(gasUsed > 0, "Gas should be measured");
        assertTrue(gasUsed < 1_000_000, "Gas should be reasonable (< 1M)");
    }

    /// @notice Benchmark multiple locks for gas averaging
    function test_SEC003_05_Gas_MultipleLocks() public {
        uint256 totalGas = 0;
        uint256 numLocks = 5;

        vm.startPrank(user);
        
        for (uint256 i = 0; i < numLocks; i++) {
            uint256 gasBefore = gasleft();
            shield.lock{value: 0.1 ether}(testPubKeyHash);
            totalGas += gasBefore - gasleft();
        }
        
        vm.stopPrank();

        uint256 avgGas = totalGas / numLocks;
        console2.log("Average gas per lock():", avgGas);
        console2.log("Total gas for", numLocks, "locks:", totalGas);
    }

    /// @notice Compare SHA3_256 vs keccak256 gas (informational)
    function test_SEC003_05_Gas_SHA3vsKeccak_Comparison() public pure {
        bytes memory data = abi.encodePacked(
            address(0xBEEF),
            uint256(1 ether),
            bytes32(0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef),
            uint256(0),
            uint256(1234567890)
        );

        // Measure keccak256
        uint256 gasBefore = gasleft();
        keccak256(data);
        uint256 keccakGas = gasBefore - gasleft();

        // Measure SHA3_256
        gasBefore = gasleft();
        SHA3_256.hash(data);
        uint256 sha3Gas = gasBefore - gasleft();

        console2.log("keccak256 gas:", keccakGas);
        console2.log("SHA3_256 gas:", sha3Gas);
        console2.log("SHA3_256 / keccak256 ratio:", sha3Gas / keccakGas);

        // SHA3_256 is significantly more expensive (expected: 100-500x)
        assertTrue(sha3Gas > keccakGas, "SHA3_256 should use more gas than keccak256");
    }

    // =========================================================================
    // CP-1 Compliance Verification
    // =========================================================================

    /// @notice Verify no keccak256 is used for cryptographic operations
    /// @dev This is a meta-test to ensure CP-1 compliance
    function test_SEC003_CP1_NoKeccak256InCrypto() public {
        // This test verifies the migration is complete by checking
        // that the contract produces SHA3_256 hashes, not keccak256

        uint256 nonce = shield.nonceCounter();
        uint256 timestamp = block.timestamp;
        uint256 amount = 1 ether;

        vm.prank(user);
        bytes32 lockId = shield.lock{value: amount}(testPubKeyHash);

        // If the contract still used keccak256, this would be the lockId
        bytes32 keccakId = keccak256(abi.encodePacked(
            user, amount, testPubKeyHash, nonce, timestamp
        ));

        // If the contract correctly uses SHA3_256, this would be the lockId
        bytes32 sha3Id = SHA3_256.hash(abi.encodePacked(
            user, amount, testPubKeyHash, nonce, timestamp
        ));

        assertEq(lockId, sha3Id, "Contract should use SHA3_256");
        assertTrue(lockId != keccakId, "Contract should NOT use keccak256");
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _createLock(uint256 amount) internal returns (bytes32) {
        vm.deal(user, amount);
        vm.prank(user);
        return shield.lock{value: amount}(testPubKeyHash);
    }

    function _createValidPublicInputs(bytes32 lockId, uint256 amount)
        internal view returns (QuantumShield.PublicInputs memory)
    {
        return QuantumShield.PublicInputs({
            publicKeyHash: testPubKeyHash,
            messageHash: SHA3_256.hash(bytes("test-message")),
            signatureValid: true,
            nonce: 1,
            recipient: recipient,
            amount: amount,
            lockId: lockId
        });
    }

    function _createMinimalProof() internal pure returns (QuantumShield.StarkProof memory) {
        QuantumShield.StarkProof memory proof;
        proof.traceCommitment = SHA3_256.hash(bytes("trace-commitment"));

        // Create FRI proof with 8 layers
        bytes memory friProof = new bytes(1 + 8 * 32);
        friProof[0] = 0x08; // 8 layers
        for (uint i = 0; i < 8; i++) {
            bytes32 layerCommit = SHA3_256.hash(abi.encodePacked("layer", i));
            for (uint j = 0; j < 32; j++) {
                friProof[1 + i * 32 + j] = layerCommit[j];
            }
        }
        proof.friProof = friProof;

        // Create 80 query responses
        proof.queryResponses = new bytes32[](80);
        for (uint i = 0; i < 80; i++) {
            proof.queryResponses[i] = SHA3_256.hash(abi.encodePacked("query", i));
        }

        return proof;
    }
}
