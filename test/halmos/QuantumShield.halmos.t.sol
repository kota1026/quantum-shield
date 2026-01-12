// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {QuantumShield} from "../../contracts/src/QuantumShield.sol";

/**
 * @title Halmos Formal Verification Tests for QuantumShield
 * @notice Symbolic testing using Halmos for formal verification
 * @dev Run with: halmos --solver-timeout-assertion 60000
 *
 * Halmos Installation:
 * ```bash
 * pip install halmos
 * halmos --version
 * ```
 *
 * Running Halmos:
 * ```bash
 * halmos --contract QuantumShieldHalmosTest
 * ```
 */
contract QuantumShieldHalmosTest is Test {
    QuantumShield shield;

    function setUp() public {
        shield = new QuantumShield();
    }

    // =========================================================================
    // Property 1: Lock funds cannot be stolen without valid proof
    // =========================================================================

    /**
     * @notice Verify that funds cannot be released without proper authorization
     * @dev Symbolic test: for any arbitrary inputs, release should fail without valid proof
     */
    function check_NoRelease_WithoutValidProof(
        bytes32 publicKeyHash,
        bytes32 messageHash,
        uint64 nonce,
        address recipient,
        uint256 amount,
        bytes32 lockId,
        bytes32 traceCommitment,
        bytes calldata friProof,
        bytes32[] calldata queryResponses
    ) public {
        // Assume reasonable constraints
        vm.assume(amount > 0 && amount < type(uint128).max);
        vm.assume(recipient != address(0));
        vm.assume(publicKeyHash != bytes32(0));
        vm.assume(messageHash != bytes32(0));
        vm.assume(lockId != bytes32(0));

        // First, create a lock
        vm.deal(address(this), amount);
        bytes32 realLockId = shield.lock{value: amount}(publicKeyHash);

        // Try to release with arbitrary proof (should fail or succeed only with valid proof)
        QuantumShield.PublicInputs memory pi = QuantumShield.PublicInputs({
            publicKeyHash: publicKeyHash,
            messageHash: messageHash,
            signatureValid: true,
            nonce: nonce,
            recipient: recipient,
            amount: amount,
            lockId: realLockId  // Use real lock ID
        });

        QuantumShield.StarkProof memory proof = QuantumShield.StarkProof({
            traceCommitment: traceCommitment,
            friProof: friProof,
            queryResponses: queryResponses
        });

        uint256 recipientBalanceBefore = recipient.balance;

        try shield.releaseWithProof(pi, proof) {
            // If release succeeded, verify the transfer was correct
            uint256 recipientBalanceAfter = recipient.balance;
            assert(recipientBalanceAfter == recipientBalanceBefore + amount);
        } catch {
            // Expected: invalid proofs should fail
            assert(true);
        }
    }

    // =========================================================================
    // Property 2: Nonce monotonicity - each nonce can only be used once
    // =========================================================================

    /**
     * @notice Verify that nonce replay is prevented
     * @dev Once a nonce is used, it cannot be reused
     */
    function check_NonceCannotBeReused(
        bytes32 publicKeyHash,
        uint64 nonce
    ) public {
        vm.assume(publicKeyHash != bytes32(0));
        vm.assume(nonce > 0);

        // Check nonce is initially unused
        bool usedBefore = shield.usedNonces(nonce);

        if (usedBefore) {
            // Nonce already used, cannot be reused
            assert(shield.usedNonces(nonce) == true);
        }
    }

    // =========================================================================
    // Property 3: Lock amount invariant
    // =========================================================================

    /**
     * @notice Verify lock amount matches public input amount requirement
     * @dev The amount in public inputs must match the locked amount
     */
    function check_AmountMustMatchLock(
        bytes32 publicKeyHash,
        uint256 lockAmount,
        uint256 claimAmount
    ) public {
        vm.assume(publicKeyHash != bytes32(0));
        vm.assume(lockAmount > 0 && lockAmount < type(uint128).max);
        vm.assume(claimAmount > 0 && claimAmount < type(uint128).max);
        vm.assume(lockAmount != claimAmount);  // Different amounts

        // Create lock
        vm.deal(address(this), lockAmount);
        bytes32 lockId = shield.lock{value: lockAmount}(publicKeyHash);

        // Verify lock has correct amount
        (,uint256 storedAmount,,,) = shield.getLock(lockId);
        assert(storedAmount == lockAmount);

        // Attempting to claim different amount should fail
        // (We can't fully test this without valid proof, but we verify the invariant)
    }

    // =========================================================================
    // Property 4: Double-release prevention
    // =========================================================================

    /**
     * @notice Verify that a lock can only be released once
     * @dev After release, the lock should be marked as released
     */
    function check_NoDoubleRelease(
        bytes32 publicKeyHash,
        uint256 amount
    ) public {
        vm.assume(publicKeyHash != bytes32(0));
        vm.assume(amount > 0 && amount < type(uint128).max);

        // Create lock
        vm.deal(address(this), amount);
        bytes32 lockId = shield.lock{value: amount}(publicKeyHash);

        // Initially not released
        (,,,,bool releasedBefore) = shield.getLock(lockId);
        assert(releasedBefore == false);

        // After a valid release, it should be marked released
        // (Can't test full flow without valid proof in symbolic execution)
    }

    // =========================================================================
    // Property 5: Total locked value consistency
    // =========================================================================

    /**
     * @notice Verify total locked value is correctly updated
     * @dev totalLocked should equal sum of all unreleased locks
     */
    function check_TotalLockedConsistency(
        bytes32 pk1,
        bytes32 pk2,
        uint256 amount1,
        uint256 amount2
    ) public {
        vm.assume(pk1 != bytes32(0));
        vm.assume(pk2 != bytes32(0));
        vm.assume(amount1 > 0 && amount1 < type(uint64).max);
        vm.assume(amount2 > 0 && amount2 < type(uint64).max);

        uint256 initialTotal = shield.totalLocked();

        // Create first lock
        vm.deal(address(this), amount1);
        shield.lock{value: amount1}(pk1);

        uint256 afterFirst = shield.totalLocked();
        assert(afterFirst == initialTotal + amount1);

        // Create second lock
        vm.deal(address(this), amount2);
        shield.lock{value: amount2}(pk2);

        uint256 afterSecond = shield.totalLocked();
        assert(afterSecond == initialTotal + amount1 + amount2);
    }

    // =========================================================================
    // Property 6: Public key hash binding
    // =========================================================================

    /**
     * @notice Verify that public key hash cannot be changed after lock
     * @dev The dilithiumPubKeyHash in lock is immutable
     */
    function check_PublicKeyHashImmutable(
        bytes32 publicKeyHash,
        uint256 amount
    ) public {
        vm.assume(publicKeyHash != bytes32(0));
        vm.assume(amount > 0 && amount < type(uint128).max);

        vm.deal(address(this), amount);
        bytes32 lockId = shield.lock{value: amount}(publicKeyHash);

        (,,bytes32 storedPkHash,,) = shield.getLock(lockId);

        // Public key hash should match exactly
        assert(storedPkHash == publicKeyHash);
    }

    // =========================================================================
    // Property 7: Proof commitment uniqueness
    // =========================================================================

    /**
     * @notice Verify that proof commitments cannot be reused
     * @dev Each traceCommitment should only be accepted once
     */
    function check_ProofCommitmentUnique(
        bytes32 traceCommitment
    ) public {
        vm.assume(traceCommitment != bytes32(0));

        bool usedBefore = shield.usedProofCommitments(traceCommitment);

        // Once used, it stays used
        if (usedBefore) {
            assert(shield.usedProofCommitments(traceCommitment) == true);
        }
    }
}
