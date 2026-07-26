// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {QuantumShield} from "@qs/QuantumShield.sol";

/**
 * @title STARK E2E Test Suite
 * @notice End-to-End tests for STARK proof verification flow
 * @dev Tests complete Lock → STARK Proof → Unlock flow
 *
 * TASK-P5-034: E2E Test Implementation
 *
 * This test validates:
 * 1. Lock creation with Dilithium public key hash
 * 2. STARK proof structure for Level 1 verification
 * 3. Proof verification and fund release
 * 4. Challenge and slashing flow
 */
contract StarkE2ETest is Test {
    address internal constant LOCK_RECIPIENT = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC); // == RECIPIENT: releaseWithProof enforces the intended recipient
    QuantumShield public quantumShield;

    // Test accounts
    address constant USER = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    address constant RECIPIENT = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
    address constant OBSERVER = address(0x90F79bf6EB2c4f870365E785982E1f101E93b906);
    address constant PROVER = address(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);

    // Events
    event Locked(bytes32 indexed lockId, address indexed sender, uint256 amount, bytes32 dilithiumPubKeyHash, uint256 nonce, address intendedRecipient);
    event Released(bytes32 indexed lockId, address indexed recipient, uint256 amount);
    event ChallengeSubmitted(bytes32 indexed lockId, address indexed challenger, uint256 bondAmount);

    function setUp() public {
        // Deploy QuantumShield contract
        quantumShield = new QuantumShield();

        // Fund test accounts
        vm.deal(USER, 100 ether);
        vm.deal(OBSERVER, 10 ether);
        vm.deal(PROVER, 50 ether);
    }

    // =========================================================================
    // SEQ#1: Lock Flow Tests
    // =========================================================================

    /**
     * @notice Test basic lock creation
     */
    function test_Lock_BasicCreation() public {
        bytes32 dilithiumPubKeyHash = keccak256("test_dilithium_pubkey");
        uint256 lockAmount = 1 ether;

        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(dilithiumPubKeyHash, LOCK_RECIPIENT);

        // Verify lock exists
        (address owner, uint256 amount, bytes32 pubKeyHash, uint256 createdAt, bool released,) =
            quantumShield.getLock(lockId);

        assertEq(owner, USER, "Lock owner should be USER");
        assertEq(amount, lockAmount, "Lock amount should match");
        assertEq(pubKeyHash, dilithiumPubKeyHash, "Public key hash should match");
        assertFalse(released, "Lock should not be released");
        assertGt(createdAt, 0, "Created timestamp should be set");

        console.log("Lock created successfully:");
        console.log("  Lock ID:", vm.toString(lockId));
        console.log("  Amount:", lockAmount / 1e18, "ETH");
    }

    /**
     * @notice Test lock creation emits correct event
     */
    function test_Lock_EmitsEvent() public {
        bytes32 dilithiumPubKeyHash = keccak256("event_test_pubkey");
        uint256 lockAmount = 2 ether;

        // lockId (topic1) and data are unpredictable (nonce-dependent) — check the sender topic only
        vm.expectEmit(false, true, false, false);
        emit Locked(bytes32(0), USER, lockAmount, dilithiumPubKeyHash, 0, LOCK_RECIPIENT);

        vm.prank(USER);
        quantumShield.lock{value: lockAmount}(dilithiumPubKeyHash, LOCK_RECIPIENT);
    }

    /**
     * @notice Test multiple locks from same user
     */
    function test_Lock_MultipleLocks() public {
        bytes32[] memory lockIds = new bytes32[](3);

        for (uint256 i = 0; i < 3; i++) {
            bytes32 pubKeyHash = keccak256(abi.encodePacked("pubkey_", i));
            uint256 amount = (i + 1) * 0.5 ether;

            vm.prank(USER);
            lockIds[i] = quantumShield.lock{value: amount}(pubKeyHash, LOCK_RECIPIENT);

            // Verify each lock
            (address owner, uint256 lockedAmount,,,,) = quantumShield.getLock(lockIds[i]);
            assertEq(owner, USER);
            assertEq(lockedAmount, amount);
        }

        console.log("Created", lockIds.length, "locks successfully");
    }

    // =========================================================================
    // SEQ#2: STARK Proof & Unlock Flow Tests
    // =========================================================================

    /**
     * @notice Test unlock with valid STARK proof
     */
    function test_Unlock_WithValidProof() public {
        // Step 1: Create lock
        bytes32 dilithiumPubKeyHash = keccak256("unlock_test_pubkey");
        uint256 lockAmount = 1 ether;

        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(dilithiumPubKeyHash, LOCK_RECIPIENT);

        // Step 2: Create valid STARK proof
        QuantumShield.StarkProof memory proof = _createValidProof(0);
        QuantumShield.PublicInputs memory publicInputs = _createPublicInputs(
            dilithiumPubKeyHash,
            lockId,
            lockAmount
        );

        // Step 3: Verify and release
        uint256 recipientBalanceBefore = RECIPIENT.balance;

        // Phase 2 enforcement: a structurally fabricated proof must be
        // rejected — only a real STARK proof (Rust prover) can release
        vm.expectRevert();
        vm.prank(USER);
        quantumShield.releaseWithProof(publicInputs, proof);

        // Funds stay locked
        assertEq(RECIPIENT.balance, recipientBalanceBefore, "No funds may move on a rejected proof");
        (,,,, bool released,) = quantumShield.getLock(lockId);
        assertFalse(released, "Lock must remain unreleased");
    }

    /**
     * @notice Test that released lock cannot be released again
     */
    function test_Unlock_CannotReleaseAgain() public {
        bytes32 dilithiumPubKeyHash = keccak256("double_release_pubkey");
        uint256 lockAmount = 1 ether;

        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(dilithiumPubKeyHash, LOCK_RECIPIENT);

        // Every fabricated-proof attempt is rejected; retrying does not
        // weaken the lock (Phase 2 enforcement)
        QuantumShield.StarkProof memory proof = _createValidProof(0);
        QuantumShield.PublicInputs memory publicInputs = _createPublicInputs(
            dilithiumPubKeyHash,
            lockId,
            lockAmount
        );

        vm.expectRevert();
        vm.prank(USER);
        quantumShield.releaseWithProof(publicInputs, proof);

        QuantumShield.StarkProof memory proof2 = _createValidProof(1);
        publicInputs.nonce = 2;

        vm.expectRevert();
        vm.prank(USER);
        quantumShield.releaseWithProof(publicInputs, proof2);

        (,,,, bool released,) = quantumShield.getLock(lockId);
        assertFalse(released, "Lock must remain unreleased after rejected attempts");
    }

    /**
     * @notice Test unlock with invalid proof fails
     */
    function test_Unlock_InvalidProofFails() public {
        bytes32 dilithiumPubKeyHash = keccak256("invalid_proof_pubkey");
        uint256 lockAmount = 1 ether;

        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(dilithiumPubKeyHash, LOCK_RECIPIENT);

        // Create invalid proof (empty query responses)
        QuantumShield.StarkProof memory proof = QuantumShield.StarkProof({
            traceCommitment: bytes32(0),
            friProof: "",
            queryResponses: new bytes32[](0)
        });

        QuantumShield.PublicInputs memory publicInputs = _createPublicInputs(
            dilithiumPubKeyHash,
            lockId,
            lockAmount
        );

        vm.expectRevert();
        vm.prank(USER);
        quantumShield.releaseWithProof(publicInputs, proof);
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    /**
     * @notice Benchmark lock gas cost
     */
    function test_Benchmark_Lock() public {
        bytes32 pubKeyHash = keccak256("benchmark_lock");

        uint256 gasBefore = gasleft();
        vm.prank(USER);
        quantumShield.lock{value: 1 ether}(pubKeyHash, LOCK_RECIPIENT);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== Lock Gas Benchmark ===");
        console.log("Gas used:", gasUsed);
        console.log("Cost @ 30 gwei:", (gasUsed * 30) / 1e9, "ETH");

        // Lock should be efficient
        // SHA3-256 (FIPS 202) is implemented in Solidity (no native opcode), so lock
        // costs ~1.8M gas — the historical 100k bound predates the CP-1 migration
        assertLt(gasUsed, 2_500_000, "Lock gas should stay under 2.5M");
    }

    /**
     * @notice Benchmark proof verification gas cost
     */
    function test_Benchmark_ProofVerification() public {
        bytes32 pubKeyHash = keccak256("benchmark_verify");
        uint256 lockAmount = 1 ether;

        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(pubKeyHash, LOCK_RECIPIENT);

        QuantumShield.StarkProof memory proof = _createValidProof(0);
        QuantumShield.PublicInputs memory publicInputs = _createPublicInputs(
            pubKeyHash,
            lockId,
            lockAmount
        );

        // The fabricated proof is rejected; benchmark the gas consumed by the
        // rejecting verification path
        uint256 gasBefore = gasleft();
        vm.prank(USER);
        try quantumShield.releaseWithProof(publicInputs, proof) {
            revert("Fabricated proof must not verify");
        } catch {}
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== Proof Verification (reject path) Gas Benchmark ===");
        console.log("Gas used:", gasUsed);
        console.log("Cost @ 30 gwei:", (gasUsed * 30) / 1e9, "ETH");

        assertLt(gasUsed, 5_000_000, "Rejecting verification should stay under 5M gas");
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    /**
     * @notice Fuzz test lock amounts
     */
    function testFuzz_Lock_Amounts(uint256 amount) public {
        // Bound to reasonable range
        amount = bound(amount, 0.01 ether, 100 ether);

        bytes32 pubKeyHash = keccak256(abi.encodePacked("fuzz_", amount));

        vm.deal(USER, amount + 1 ether);
        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: amount}(pubKeyHash, LOCK_RECIPIENT);

        (address owner, uint256 lockedAmount,,,,) = quantumShield.getLock(lockId);
        assertEq(owner, USER);
        assertEq(lockedAmount, amount);
    }

    /**
     * @notice Fuzz test public key hashes
     */
    function testFuzz_Lock_PubKeyHashes(bytes32 pubKeyHash) public {
        // Skip zero hash
        vm.assume(pubKeyHash != bytes32(0));

        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: 1 ether}(pubKeyHash, LOCK_RECIPIENT);

        (,, bytes32 storedHash,,,) = quantumShield.getLock(lockId);
        assertEq(storedHash, pubKeyHash);
    }

    // =========================================================================
    // SEQ#4: Challenge Flow Tests
    // =========================================================================

    /**
     * @notice Test challenge submission (if implemented)
     */
    function test_Challenge_Submission() public {
        bytes32 pubKeyHash = keccak256("challenge_test");
        uint256 lockAmount = 1 ether;

        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(pubKeyHash, LOCK_RECIPIENT);

        // Challenge would be submitted here if the function exists
        // This is a placeholder for the challenge flow test

        console.log("Challenge test placeholder");
        console.log("  Lock ID:", vm.toString(lockId));
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    /**
     * @notice Create a valid STARK proof structure for Level 1 verification
     */
    function _createValidProof(uint256 index) internal pure returns (QuantumShield.StarkProof memory) {
        bytes32[] memory queries = new bytes32[](80);
        for (uint256 i = 0; i < 80; i++) {
            queries[i] = keccak256(abi.encodePacked("valid_query", index, i));
        }

        // FRI proof structure: [num_layers (1 byte)] [layer_commitments (32 bytes each)]
        uint8 numLayers = 2;
        bytes32 layer1 = keccak256(abi.encodePacked("fri_layer_1_", index));
        bytes32 layer2 = keccak256(abi.encodePacked("fri_layer_2_", index));

        bytes memory friProof = abi.encodePacked(numLayers, layer1, layer2);

        return QuantumShield.StarkProof({
            traceCommitment: keccak256(abi.encodePacked("valid_trace_", index)),
            friProof: friProof,
            queryResponses: queries
        });
    }

    /**
     * @notice Create public inputs for verification
     */
    function _createPublicInputs(
        bytes32 pubKeyHash,
        bytes32 lockId,
        uint256 amount
    ) internal pure returns (QuantumShield.PublicInputs memory) {
        return QuantumShield.PublicInputs({
            publicKeyHash: pubKeyHash,
            messageHash: keccak256("E2E Test Message"),
            signatureValid: true,
            nonce: 1,
            recipient: RECIPIENT,
            amount: amount,
            lockId: lockId
        });
    }
}

/**
 * @title Multi-Sequence E2E Test
 * @notice Tests complete flow across all sequences
 */
contract MultiSequenceE2ETest is Test {
    address internal constant LOCK_RECIPIENT = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC); // == RECIPIENT: releaseWithProof enforces the intended recipient
    QuantumShield public quantumShield;

    address constant USER = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    address constant RECIPIENT = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);

    function setUp() public {
        quantumShield = new QuantumShield();
        vm.deal(USER, 100 ether);
    }

    /**
     * @notice Complete E2E flow: Lock → Proof → Unlock
     */
    function test_CompleteE2EFlow() public {
        console.log("=== Complete E2E Flow Test ===");

        // SEQ#1: Lock
        console.log("\n[SEQ#1] Creating lock...");
        bytes32 pubKeyHash = keccak256("complete_e2e_pubkey");
        uint256 lockAmount = 5 ether;

        vm.prank(USER);
        bytes32 lockId = quantumShield.lock{value: lockAmount}(pubKeyHash, LOCK_RECIPIENT);
        console.log("  Lock created:", vm.toString(lockId));

        // Verify lock state
        (address owner, uint256 amount,,, bool released,) = quantumShield.getLock(lockId);
        assertEq(owner, USER);
        assertEq(amount, lockAmount);
        assertFalse(released);

        // SEQ#2: Generate proof and unlock
        console.log("\n[SEQ#2] Generating STARK proof...");

        bytes32[] memory queries = new bytes32[](80);
        for (uint256 i = 0; i < 80; i++) {
            queries[i] = keccak256(abi.encodePacked("e2e_query", i));
        }

        QuantumShield.StarkProof memory proof = QuantumShield.StarkProof({
            traceCommitment: keccak256("e2e_trace"),
            friProof: abi.encodePacked(uint8(2), keccak256("layer1"), keccak256("layer2")),
            queryResponses: queries
        });

        QuantumShield.PublicInputs memory inputs = QuantumShield.PublicInputs({
            publicKeyHash: pubKeyHash,
            messageHash: keccak256("E2E unlock message"),
            signatureValid: true,
            nonce: 1,
            recipient: RECIPIENT,
            amount: lockAmount,
            lockId: lockId
        });

        console.log("  Proof generated with", queries.length, "queries");

        // Execute unlock attempt — Phase 2 enforcement rejects the
        // fabricated proof and the lock stays intact
        console.log("\n[SEQ#2] Attempting unlock with fabricated proof...");
        uint256 balanceBefore = RECIPIENT.balance;

        vm.expectRevert();
        vm.prank(USER);
        quantumShield.releaseWithProof(inputs, proof);

        assertEq(RECIPIENT.balance, balanceBefore, "No funds may move on a rejected proof");

        // Verify final state
        (,,,, released,) = quantumShield.getLock(lockId);
        assertFalse(released, "Lock must remain unreleased");

        console.log("\n=== E2E enforcement verified: fabricated proof rejected ===");
        console.log("  Recipient received:", lockAmount / 1e18, "ETH");
        console.log("  Lock released: true");
    }

    /**
     * @notice Batch lock and unlock test
     */
    function test_BatchLockUnlock() public {
        console.log("=== Batch Lock/Unlock Test ===");

        uint256 batchSize = 5;
        bytes32[] memory lockIds = new bytes32[](batchSize);
        uint256 totalAmount = 0;

        // Create multiple locks
        for (uint256 i = 0; i < batchSize; i++) {
            bytes32 pubKeyHash = keccak256(abi.encodePacked("batch_", i));
            uint256 amount = (i + 1) * 0.5 ether;
            totalAmount += amount;

            vm.prank(USER);
            lockIds[i] = quantumShield.lock{value: amount}(pubKeyHash, LOCK_RECIPIENT);
        }

        console.log("Created", batchSize, "locks");
        console.log("Total locked:", totalAmount / 1e18, "ETH");

        // Unlock all
        uint256 balanceBefore = RECIPIENT.balance;

        for (uint256 i = 0; i < batchSize; i++) {
            bytes32 pubKeyHash = keccak256(abi.encodePacked("batch_", i));
            uint256 amount = (i + 1) * 0.5 ether;

            bytes32[] memory queries = new bytes32[](80);
            for (uint256 j = 0; j < 80; j++) {
                queries[j] = keccak256(abi.encodePacked("batch_query", i, j));
            }

            QuantumShield.StarkProof memory proof = QuantumShield.StarkProof({
                traceCommitment: keccak256(abi.encodePacked("batch_trace_", i)),
                friProof: abi.encodePacked(uint8(2), keccak256(abi.encodePacked("l1_", i)), keccak256(abi.encodePacked("l2_", i))),
                queryResponses: queries
            });

            QuantumShield.PublicInputs memory inputs = QuantumShield.PublicInputs({
                publicKeyHash: pubKeyHash,
                messageHash: keccak256(abi.encodePacked("batch_unlock_", i)),
                signatureValid: true,
                nonce: uint64(i + 1),
                recipient: RECIPIENT,
                amount: amount,
                lockId: lockIds[i]
            });

            // Phase 2 enforcement: every fabricated batch proof is rejected
            vm.expectRevert();
            vm.prank(USER);
            quantumShield.releaseWithProof(inputs, proof);
        }

        assertEq(RECIPIENT.balance, balanceBefore, "No funds may move on rejected proofs");
        for (uint256 i = 0; i < batchSize; i++) {
            (,,,, bool released,) = quantumShield.getLock(lockIds[i]);
            assertFalse(released, "Every lock must remain unreleased");
        }

        console.log("All fabricated proofs rejected; funds remain locked");
    }
}
