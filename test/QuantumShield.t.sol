// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/src/QuantumShield.sol";

contract QuantumShieldTest is Test {
    QuantumShield public shield;

    address public owner;
    address public user1;
    address public user2;

    bytes32 constant DILITHIUM_PUB_KEY_HASH = keccak256("test_dilithium_public_key");
    bytes32 constant MESSAGE_HASH = keccak256("test_message");

    event Locked(
        bytes32 indexed lockId,
        address indexed sender,
        uint256 amount,
        bytes32 dilithiumPubKeyHash,
        uint256 nonce
    );

    event ProofVerified(
        bytes32 indexed lockId,
        bytes32 publicInputsHash,
        uint256 gasUsed
    );

    event Released(
        bytes32 indexed lockId,
        address indexed recipient,
        uint256 amount
    );

    function setUp() public {
        owner = address(this);
        user1 = address(0x1001);
        user2 = address(0x1002);

        shield = new QuantumShield();

        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // =========================================================================
    // Lock Tests
    // =========================================================================

    function test_Lock() public {
        vm.prank(user1);
        bytes32 lockId = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        (address sender, uint256 amount, bytes32 pubKeyHash, , bool released) = shield.getLock(lockId);

        assertEq(sender, user1);
        assertEq(amount, 1 ether);
        assertEq(pubKeyHash, DILITHIUM_PUB_KEY_HASH);
        assertFalse(released);
        assertEq(shield.totalLocked(), 1 ether);
    }

    function test_Lock_EmitsEvent() public {
        vm.prank(user1);
        vm.expectEmit(false, true, false, true);
        emit Locked(bytes32(0), user1, 1 ether, DILITHIUM_PUB_KEY_HASH, 0);
        shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);
    }

    function test_Lock_ZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert(QuantumShield.InsufficientAmount.selector);
        shield.lock{value: 0}(DILITHIUM_PUB_KEY_HASH);
    }

    function test_Lock_WhenPaused() public {
        shield.pause();

        vm.prank(user1);
        vm.expectRevert(QuantumShield.Paused.selector);
        shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);
    }

    function test_MultipleLocks() public {
        vm.startPrank(user1);

        bytes32 lockId1 = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);
        bytes32 lockId2 = shield.lock{value: 2 ether}(DILITHIUM_PUB_KEY_HASH);

        vm.stopPrank();

        assertNotEq(lockId1, lockId2);
        assertEq(shield.totalLocked(), 3 ether);
    }

    // =========================================================================
    // Release with Proof Tests
    // =========================================================================

    function test_ReleaseWithProof_InvalidPublicInputs_ZeroPubKeyHash() public {
        vm.prank(user1);
        bytes32 lockId = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        QuantumShield.PublicInputs memory pi = QuantumShield.PublicInputs({
            publicKeyHash: bytes32(0), // Invalid
            messageHash: MESSAGE_HASH,
            signatureValid: true,
            nonce: 1,
            recipient: user2,
            amount: 1 ether,
            lockId: lockId
        });

        QuantumShield.StarkProof memory proof = _createMockProof();

        vm.expectRevert(QuantumShield.InvalidPublicInputs.selector);
        shield.releaseWithProof(pi, proof);
    }

    function test_ReleaseWithProof_LockNotFound() public {
        QuantumShield.PublicInputs memory pi = QuantumShield.PublicInputs({
            publicKeyHash: DILITHIUM_PUB_KEY_HASH,
            messageHash: MESSAGE_HASH,
            signatureValid: true,
            nonce: 1,
            recipient: user2,
            amount: 1 ether,
            lockId: keccak256("nonexistent")
        });

        QuantumShield.StarkProof memory proof = _createMockProof();

        vm.expectRevert(QuantumShield.LockNotFound.selector);
        shield.releaseWithProof(pi, proof);
    }

    function test_ReleaseWithProof_CommitmentMismatch() public {
        vm.prank(user1);
        bytes32 lockId = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        QuantumShield.PublicInputs memory pi = QuantumShield.PublicInputs({
            publicKeyHash: keccak256("wrong_key"), // Mismatch
            messageHash: MESSAGE_HASH,
            signatureValid: true,
            nonce: 1,
            recipient: user2,
            amount: 1 ether,
            lockId: lockId
        });

        QuantumShield.StarkProof memory proof = _createMockProof();

        vm.expectRevert(QuantumShield.CommitmentMismatch.selector);
        shield.releaseWithProof(pi, proof);
    }

    function test_ReleaseWithProof_SignatureNotValid() public {
        vm.prank(user1);
        bytes32 lockId = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        QuantumShield.PublicInputs memory pi = QuantumShield.PublicInputs({
            publicKeyHash: DILITHIUM_PUB_KEY_HASH,
            messageHash: MESSAGE_HASH,
            signatureValid: false, // Invalid signature
            nonce: 1,
            recipient: user2,
            amount: 1 ether,
            lockId: lockId
        });

        QuantumShield.StarkProof memory proof = _createMockProof();

        vm.expectRevert(QuantumShield.SignatureNotValid.selector);
        shield.releaseWithProof(pi, proof);
    }

    function test_ReleaseWithProof_ProofTooLarge() public {
        vm.prank(user1);
        bytes32 lockId = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        QuantumShield.PublicInputs memory pi = QuantumShield.PublicInputs({
            publicKeyHash: DILITHIUM_PUB_KEY_HASH,
            messageHash: MESSAGE_HASH,
            signatureValid: true,
            nonce: 1,
            recipient: user2,
            amount: 1 ether,
            lockId: lockId
        });

        // Create oversized proof
        bytes memory largeProof = new bytes(2_000_000);
        bytes32[] memory queries = new bytes32[](80);

        QuantumShield.StarkProof memory proof = QuantumShield.StarkProof({
            traceCommitment: keccak256("trace"),
            friProof: largeProof,
            queryResponses: queries
        });

        vm.expectRevert(QuantumShield.ProofTooLarge.selector);
        shield.releaseWithProof(pi, proof);
    }

    function test_ReleaseWithProof_Success() public {
        vm.prank(user1);
        bytes32 lockId = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        QuantumShield.PublicInputs memory pi = QuantumShield.PublicInputs({
            publicKeyHash: DILITHIUM_PUB_KEY_HASH,
            messageHash: MESSAGE_HASH,
            signatureValid: true,
            nonce: 1,
            recipient: user2,
            amount: 1 ether,
            lockId: lockId
        });

        QuantumShield.StarkProof memory proof = _createValidMockProof();

        uint256 user2BalanceBefore = user2.balance;

        shield.releaseWithProof(pi, proof);

        assertEq(user2.balance - user2BalanceBefore, 1 ether);
        assertEq(shield.totalLocked(), 0);

        (, , , , bool released) = shield.getLock(lockId);
        assertTrue(released);
    }

    function test_ReleaseWithProof_NonceReplay() public {
        // First lock and release
        vm.prank(user1);
        bytes32 lockId1 = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        QuantumShield.PublicInputs memory pi1 = QuantumShield.PublicInputs({
            publicKeyHash: DILITHIUM_PUB_KEY_HASH,
            messageHash: MESSAGE_HASH,
            signatureValid: true,
            nonce: 1,
            recipient: user2,
            amount: 1 ether,
            lockId: lockId1
        });

        shield.releaseWithProof(pi1, _createValidMockProof());

        // Second lock with same nonce should fail
        vm.prank(user1);
        bytes32 lockId2 = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        QuantumShield.PublicInputs memory pi2 = QuantumShield.PublicInputs({
            publicKeyHash: DILITHIUM_PUB_KEY_HASH,
            messageHash: MESSAGE_HASH,
            signatureValid: true,
            nonce: 1, // Same nonce
            recipient: user2,
            amount: 1 ether,
            lockId: lockId2
        });

        vm.expectRevert(QuantumShield.NonceAlreadyUsed.selector);
        shield.releaseWithProof(pi2, _createValidMockProof());
    }

    // =========================================================================
    // View Function Tests
    // =========================================================================

    function test_IsQuantumResistant() public view {
        assertTrue(shield.isQuantumResistant());
    }

    function test_GetVerificationMode_Native() public view {
        assertEq(shield.getVerificationMode(), "NATIVE_STARK");
    }

    function test_GetVerificationMode_External() public {
        shield.setVerifier(address(0x1234));
        assertEq(shield.getVerificationMode(), "EXTERNAL_VERIFIER");
    }

    function test_EstimateVerificationGas() public view {
        uint256 estimate = shield.estimateVerificationGas(100_000);
        assertTrue(estimate > 0);
        assertTrue(estimate > 4_000_000); // Should be significant
    }

    // =========================================================================
    // Admin Tests
    // =========================================================================

    function test_SetVerifier() public {
        address newVerifier = address(0x9999);
        shield.setVerifier(newVerifier);
        assertEq(shield.verifier(), newVerifier);
    }

    function test_SetVerifier_NotOwner() public {
        vm.prank(user1);
        vm.expectRevert(QuantumShield.NotOwner.selector);
        shield.setVerifier(address(0x9999));
    }

    function test_Pause() public {
        shield.pause();
        assertTrue(shield.paused());
    }

    function test_Unpause() public {
        shield.pause();
        shield.unpause();
        assertFalse(shield.paused());
    }

    function test_TransferOwnership() public {
        shield.transferOwnership(user1);
        assertEq(shield.owner(), user1);
    }

    function test_TransferOwnership_ZeroAddress() public {
        vm.expectRevert(QuantumShield.ZeroAddress.selector);
        shield.transferOwnership(address(0));
    }

    // =========================================================================
    // Gas Tests
    // =========================================================================

    function test_GasUsage_Lock() public {
        vm.prank(user1);
        uint256 gasBefore = gasleft();
        shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for lock", gasUsed);
        assertLt(gasUsed, 200_000);
    }

    function test_GasUsage_ReleaseWithProof() public {
        vm.prank(user1);
        bytes32 lockId = shield.lock{value: 1 ether}(DILITHIUM_PUB_KEY_HASH);

        QuantumShield.PublicInputs memory pi = QuantumShield.PublicInputs({
            publicKeyHash: DILITHIUM_PUB_KEY_HASH,
            messageHash: MESSAGE_HASH,
            signatureValid: true,
            nonce: 1,
            recipient: user2,
            amount: 1 ether,
            lockId: lockId
        });

        QuantumShield.StarkProof memory proof = _createValidMockProof();

        uint256 gasBefore = gasleft();
        shield.releaseWithProof(pi, proof);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for releaseWithProof", gasUsed);
        // Note: Real STARK verification would use much more gas (2-6M)
        // This is just testing the contract structure
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    /// @notice Create a mock proof that fails Level 1 verification
    /// @dev This proof has invalid FRI structure (too short, no layer count)
    function _createMockProof() internal pure returns (QuantumShield.StarkProof memory) {
        bytes32[] memory queries = new bytes32[](80);
        for (uint256 i = 0; i < 80; i++) {
            queries[i] = keccak256(abi.encodePacked("query", i));
        }

        // This proof will fail Level 1 because:
        // 1. friProof is too short (4 bytes < 32 bytes minimum)
        return QuantumShield.StarkProof({
            traceCommitment: keccak256("trace_commitment"),
            friProof: hex"deadbeef",  // Too short, will fail
            queryResponses: queries
        });
    }

    /// @notice Create a valid mock proof that passes Level 1 verification
    /// @dev Properly structured FRI proof with layer commitments
    function _createValidMockProof() internal pure returns (QuantumShield.StarkProof memory) {
        bytes32[] memory queries = new bytes32[](80);
        for (uint256 i = 0; i < 80; i++) {
            queries[i] = keccak256(abi.encodePacked("valid_query", i));
        }

        // Create properly structured FRI proof for Level 1
        // Format: [num_layers (1 byte)] [layer_commitments (32 bytes each)]
        uint8 numLayers = 2;
        bytes32 layer1 = keccak256("fri_layer_1");
        bytes32 layer2 = keccak256("fri_layer_2");

        // Pack: num_layers + layer1 + layer2
        bytes memory friProof = abi.encodePacked(
            numLayers,
            layer1,
            layer2
        );

        return QuantumShield.StarkProof({
            traceCommitment: keccak256("valid_trace"),
            friProof: friProof,
            queryResponses: queries
        });
    }

    /// @notice Create a proof with all-zero queries (should fail Level 1)
    function _createZeroQueryProof() internal pure returns (QuantumShield.StarkProof memory) {
        bytes32[] memory queries = new bytes32[](80);
        // All queries are zero

        uint8 numLayers = 2;
        bytes memory friProof = abi.encodePacked(
            numLayers,
            keccak256("layer1"),
            keccak256("layer2")
        );

        return QuantumShield.StarkProof({
            traceCommitment: keccak256("trace"),
            friProof: friProof,
            queryResponses: queries
        });
    }
}
