// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/src/OptimisticQuantumBridge.sol";

contract OptimisticQuantumBridgeTest is Test {
    OptimisticQuantumBridge public bridge;

    address public owner;
    address public prover1;
    address public prover2;
    address public user1;
    address public user2;
    address public challenger;

    uint256 public prover1Key;
    uint256 public prover2Key;

    bytes32 constant DILITHIUM_PUB_KEY_HASH = keccak256("test_dilithium_public_key");

    event Locked(
        bytes32 indexed lockId,
        address indexed sender,
        uint256 amount,
        bytes32 dilithiumPubKeyHash,
        uint256 nonce
    );

    event AttestationSubmitted(
        bytes32 indexed lockId,
        bytes32 attestationHash,
        address indexed prover,
        uint256 timestamp
    );

    event Released(
        bytes32 indexed lockId,
        address indexed recipient,
        uint256 amount
    );

    function setUp() public {
        owner = address(this);
        prover1Key = 0x1234;
        prover2Key = 0x5678;
        prover1 = vm.addr(prover1Key);
        prover2 = vm.addr(prover2Key);
        user1 = address(0x1001);
        user2 = address(0x1002);
        challenger = address(0x2001);

        bridge = new OptimisticQuantumBridge();

        // Fund accounts
        vm.deal(prover1, 10 ether);
        vm.deal(prover2, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(challenger, 10 ether);
    }

    // =========================================================================
    // Prover Registration Tests
    // =========================================================================

    function test_RegisterProver() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        (uint256 stake, , , bool active) = bridge.getProverInfo(prover1);
        assertEq(stake, 1 ether);
        assertTrue(active);
    }

    function test_RegisterProver_InsufficientStake() public {
        vm.prank(prover1);
        vm.expectRevert(OptimisticQuantumBridge.InsufficientStake.selector);
        bridge.registerProver{value: 0.5 ether}();
    }

    function test_WithdrawStake() public {
        vm.startPrank(prover1);
        bridge.registerProver{value: 2 ether}();

        uint256 balanceBefore = prover1.balance;
        bridge.withdrawStake(0.5 ether);
        uint256 balanceAfter = prover1.balance;

        assertEq(balanceAfter - balanceBefore, 0.5 ether);

        (uint256 stake, , , bool active) = bridge.getProverInfo(prover1);
        assertEq(stake, 1.5 ether);
        assertTrue(active);
        vm.stopPrank();
    }

    function test_WithdrawStake_DeactivatesProver() public {
        vm.startPrank(prover1);
        bridge.registerProver{value: 1 ether}();
        bridge.withdrawStake(0.5 ether);

        (, , , bool active) = bridge.getProverInfo(prover1);
        assertFalse(active);
        vm.stopPrank();
    }

    // =========================================================================
    // Lock Tests
    // =========================================================================

    function test_Lock() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        (address sender, uint256 amount, bytes32 pubKeyHash, , bool released) = bridge.getLock(lockId);

        assertEq(sender, user1);
        assertEq(amount, 1 ether);
        assertEq(pubKeyHash, DILITHIUM_PUB_KEY_HASH);
        assertFalse(released);
        assertEq(bridge.totalLocked(), 1 ether);
    }

    function test_Lock_EmitsEvent() public {
        vm.prank(user1);
        vm.expectEmit(false, true, false, true);
        emit Locked(bytes32(0), user1, 1 ether, DILITHIUM_PUB_KEY_HASH, 0);
        bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);
    }

    function test_Lock_ZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert(OptimisticQuantumBridge.InsufficientAmount.selector);
        bridge.lock{value: 0}(DILITHIUM_PUB_KEY_HASH);
    }

    function test_Lock_WhenPaused() public {
        bridge.pause();

        vm.prank(user1);
        vm.expectRevert(OptimisticQuantumBridge.Paused.selector);
        bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);
    }

    // =========================================================================
    // Attestation Tests
    // =========================================================================

    function test_SubmitAttestation() public {
        // Register prover
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        // User locks funds
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        // Create attestation
        bytes32 attestationHash = keccak256("valid_dilithium_verification");
        uint256 nonce = 1;

        // Sign the attestation
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId,
            attestationHash,
            user2,
            uint256(1 ether),
            nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Submit attestation
        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId,
            attestationHash,
            user2,
            nonce,
            signature
        );

        // Verify attestation was stored
        (
            bytes32 storedLockId,
            bytes32 storedAttestationHash,
            address storedProver,
            address storedRecipient,
            uint256 storedAmount,
            ,
            bool executed,
            bool challenged
        ) = bridge.getAttestation(attestationId);

        assertEq(storedLockId, lockId);
        assertEq(storedAttestationHash, attestationHash);
        assertEq(storedProver, prover1);
        assertEq(storedRecipient, user2);
        assertEq(storedAmount, 1 ether);
        assertFalse(executed);
        assertFalse(challenged);
    }

    function test_SubmitAttestation_NotRegisteredProver() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        vm.prank(prover1); // Not registered
        vm.expectRevert(OptimisticQuantumBridge.NotRegisteredProver.selector);
        bridge.submitAttestation(
            lockId,
            keccak256("hash"),
            user2,
            1,
            bytes("")
        );
    }

    // =========================================================================
    // Execute Release Tests
    // =========================================================================

    function test_ExecuteRelease() public {
        // Setup: register prover, lock funds, submit attestation
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("valid_dilithium_verification");
        uint256 nonce = 1;

        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        // Fast forward past challenge window
        vm.warp(block.timestamp + 7 days + 1);

        // Execute release
        uint256 user2BalanceBefore = user2.balance;
        bridge.executeRelease(attestationId);
        uint256 user2BalanceAfter = user2.balance;

        assertEq(user2BalanceAfter - user2BalanceBefore, 1 ether);
        assertEq(bridge.totalLocked(), 0);

        // Verify attestation is marked as executed
        (, , , , , , bool executed, ) = bridge.getAttestation(attestationId);
        assertTrue(executed);

        // Verify lock is marked as released
        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    function test_ExecuteRelease_ChallengeWindowNotExpired() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        // Try to execute before challenge window expires
        vm.expectRevert(OptimisticQuantumBridge.ChallengeWindowNotExpired.selector);
        bridge.executeRelease(attestationId);
    }

    // =========================================================================
    // Challenge Tests
    // =========================================================================

    function test_Challenge() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        // Challenge
        vm.prank(challenger);
        bridge.challenge{value: 0.1 ether}(attestationId);

        (, , , , , , , bool challenged) = bridge.getAttestation(attestationId);
        assertTrue(challenged);
    }

    function test_Challenge_InsufficientBond() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        vm.prank(challenger);
        vm.expectRevert(OptimisticQuantumBridge.InsufficientAmount.selector);
        bridge.challenge{value: 0.05 ether}(attestationId);
    }

    function test_Challenge_AfterWindowExpires() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        // Fast forward past challenge window
        vm.warp(block.timestamp + 7 days + 1);

        vm.prank(challenger);
        vm.expectRevert(OptimisticQuantumBridge.ChallengeWindowExpired.selector);
        bridge.challenge{value: 0.1 ether}(attestationId);
    }

    // =========================================================================
    // Challenge Resolution Tests
    // =========================================================================

    function test_ResolveChallenge_ValidAttestation() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        vm.prank(challenger);
        bridge.challenge{value: 0.1 ether}(attestationId);

        uint256 prover1BalanceBefore = prover1.balance;
        uint256 user2BalanceBefore = user2.balance;

        // Owner resolves - attestation was valid
        bridge.resolveChallenge(attestationId, true, challenger);

        // Prover gets challenger's bond
        assertEq(prover1.balance - prover1BalanceBefore, 0.1 ether);
        // User2 gets the locked funds
        assertEq(user2.balance - user2BalanceBefore, 1 ether);
    }

    function test_ResolveChallenge_InvalidAttestation() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        vm.prank(challenger);
        bridge.challenge{value: 0.1 ether}(attestationId);

        uint256 challengerBalanceBefore = challenger.balance;

        // Owner resolves - attestation was invalid
        bridge.resolveChallenge(attestationId, false, challenger);

        // Challenger gets bond back + half of slashed stake
        assertEq(challenger.balance - challengerBalanceBefore, 0.1 ether + 0.5 ether);

        // Prover is slashed
        (uint256 stake, , uint256 slashedCount, bool active) = bridge.getProverInfo(prover1);
        assertEq(slashedCount, 1);
        assertFalse(active); // Deactivated because stake < 1 ETH
    }

    // =========================================================================
    // View Function Tests
    // =========================================================================

    function test_CanExecute() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        // Before window expires
        assertFalse(bridge.canExecute(attestationId));

        // After window expires
        vm.warp(block.timestamp + 7 days + 1);
        assertTrue(bridge.canExecute(attestationId));
    }

    function test_ChallengeWindowRemaining() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        // Initial remaining time should be close to 7 days
        uint256 remaining = bridge.challengeWindowRemaining(attestationId);
        assertEq(remaining, 7 days);

        // After 1 day
        vm.warp(block.timestamp + 1 days);
        remaining = bridge.challengeWindowRemaining(attestationId);
        assertEq(remaining, 6 days);

        // After window expires
        vm.warp(block.timestamp + 7 days);
        remaining = bridge.challengeWindowRemaining(attestationId);
        assertEq(remaining, 0);
    }

    // =========================================================================
    // Admin Tests
    // =========================================================================

    function test_Pause() public {
        bridge.pause();
        assertTrue(bridge.paused());
    }

    function test_Unpause() public {
        bridge.pause();
        bridge.unpause();
        assertFalse(bridge.paused());
    }

    function test_TransferOwnership() public {
        bridge.transferOwnership(user1);
        assertEq(bridge.owner(), user1);
    }

    function test_TransferOwnership_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(OptimisticQuantumBridge.NotOwner.selector);
        bridge.transferOwnership(user2);
    }

    // =========================================================================
    // Gas Tests
    // =========================================================================

    function test_GasUsage_Lock() public {
        vm.prank(user1);
        uint256 gasBefore = gasleft();
        bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);
        uint256 gasUsed = gasBefore - gasleft();

        // Log gas usage (should be around 140-160k for first lock due to storage init)
        emit log_named_uint("Gas used for lock", gasUsed);
        assertLt(gasUsed, 200000);
    }

    function test_GasUsage_SubmitAttestation() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        uint256 gasBefore = gasleft();
        bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );
        uint256 gasUsed = gasBefore - gasleft();

        // Log gas usage (should be around 180-230k for first attestation due to storage init)
        emit log_named_uint("Gas used for submitAttestation", gasUsed);
        assertLt(gasUsed, 250000);
    }

    function test_GasUsage_ExecuteRelease() public {
        vm.prank(prover1);
        bridge.registerProver{value: 1 ether}();

        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        bytes32 attestationHash = keccak256("hash");
        uint256 nonce = 1;
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId, attestationHash, user2, uint256(1 ether), nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", messageHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(prover1Key, ethSignedHash);

        vm.prank(prover1);
        bytes32 attestationId = bridge.submitAttestation(
            lockId, attestationHash, user2, nonce, abi.encodePacked(r, s, v)
        );

        vm.warp(block.timestamp + 7 days + 1);

        uint256 gasBefore = gasleft();
        bridge.executeRelease(attestationId);
        uint256 gasUsed = gasBefore - gasleft();

        // Log gas usage (should be around 50-80k)
        emit log_named_uint("Gas used for executeRelease", gasUsed);
        assertLt(gasUsed, 150000);
    }
}
