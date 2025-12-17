// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/QuantumShieldBridge.sol";
import "../../contracts/verifiers/SP1Groth16Verifier.sol";

/// @title QuantumShieldBridge Test Suite
/// @notice Comprehensive tests for the Quantum Shield Bridge
contract QuantumShieldBridgeTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    event Locked(
        bytes32 indexed lockId,
        address indexed sender,
        uint256 amount,
        bytes32 dilithiumPubKeyHash,
        uint256 nonce
    );

    event Released(
        bytes32 indexed lockId,
        address indexed recipient,
        uint256 amount,
        uint256 numSignaturesVerified
    );

    function setUp() public {
        // Deploy verifier
        verifier = new SP1Groth16Verifier(VK_HASH);

        // Deploy bridge
        bridge = new QuantumShieldBridge(address(verifier));

        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    // =========================================================================
    // Lock Tests
    // =========================================================================

    function test_Lock_Success() public {
        vm.startPrank(user1);

        uint256 amount = 1 ether;
        bytes32 lockId = bridge.lock{value: amount}(DILITHIUM_PK_HASH);

        // Verify lock was created
        (
            address sender,
            uint256 lockedAmount,
            bytes32 pkHash,
            uint256 timestamp,
            bool released
        ) = bridge.getLock(lockId);

        assertEq(sender, user1);
        assertEq(lockedAmount, amount);
        assertEq(pkHash, DILITHIUM_PK_HASH);
        assertEq(timestamp, block.timestamp);
        assertFalse(released);

        // Verify total locked
        assertEq(bridge.totalLocked(), amount);

        vm.stopPrank();
    }

    function test_Lock_EmitsEvent() public {
        vm.startPrank(user1);

        uint256 amount = 1 ether;

        // We can't predict the exact lockId, but we can check the event is emitted
        vm.expectEmit(false, true, false, true);
        emit Locked(bytes32(0), user1, amount, DILITHIUM_PK_HASH, 0);

        bridge.lock{value: amount}(DILITHIUM_PK_HASH);

        vm.stopPrank();
    }

    function test_Lock_ZeroAmount_Reverts() public {
        vm.startPrank(user1);

        vm.expectRevert(QuantumShieldBridge.InsufficientAmount.selector);
        bridge.lock{value: 0}(DILITHIUM_PK_HASH);

        vm.stopPrank();
    }

    function test_Lock_MultipleLocks() public {
        vm.startPrank(user1);

        bytes32 lockId1 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);
        bytes32 lockId2 = bridge.lock{value: 2 ether}(DILITHIUM_PK_HASH);

        assertNotEq(lockId1, lockId2);
        assertEq(bridge.totalLocked(), 3 ether);

        vm.stopPrank();
    }

    // =========================================================================
    // Release Tests
    // =========================================================================

    function test_Release_Success() public {
        // First, lock some ETH
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Prepare mock proof and public inputs
        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8, // numSignatures
            0  // nonce
        );

        // Record user2's balance before
        uint256 balanceBefore = user2.balance;

        // Release
        bridge.release(proof, publicInputs);

        // Verify release
        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);

        // Verify funds transferred
        assertEq(user2.balance, balanceBefore + 1 ether);
        assertEq(bridge.totalLocked(), 0);
    }

    function test_Release_InvalidProof_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Create invalid proof (all zeros)
        bytes memory invalidProof = new bytes(256);
        uint256[] memory publicInputs = _createPublicInputs(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0
        );

        vm.expectRevert(QuantumShieldBridge.InvalidProof.selector);
        bridge.release(invalidProof, publicInputs);
    }

    function test_Release_WrongAmount_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            2 ether, // Wrong amount
            8,
            0
        );

        vm.expectRevert(QuantumShieldBridge.InvalidPublicInputs.selector);
        bridge.release(proof, publicInputs);
    }

    function test_Release_CommitmentMismatch_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(
            lockId,
            keccak256("wrong_key"), // Wrong commitment
            user2,
            1 ether,
            8,
            0
        );

        vm.expectRevert(QuantumShieldBridge.CommitmentMismatch.selector);
        bridge.release(proof, publicInputs);
    }

    function test_Release_AlreadyReleased_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0
        );

        // First release succeeds
        bridge.release(proof, publicInputs);

        // Second release fails
        vm.expectRevert(QuantumShieldBridge.LockAlreadyReleased.selector);
        bridge.release(proof, publicInputs);
    }

    // =========================================================================
    // Admin Tests
    // =========================================================================

    function test_UpdateVerifier() public {
        SP1Groth16Verifier newVerifier = new SP1Groth16Verifier(keccak256("new_vk"));

        bridge.updateVerifier(address(newVerifier));

        assertEq(address(bridge.verifier()), address(newVerifier));
    }

    function test_UpdateVerifier_NotOwner_Reverts() public {
        SP1Groth16Verifier newVerifier = new SP1Groth16Verifier(keccak256("new_vk"));

        vm.prank(user1);
        vm.expectRevert(QuantumShieldBridge.NotOwner.selector);
        bridge.updateVerifier(address(newVerifier));
    }

    function test_Pause() public {
        bridge.pause();
        assertTrue(bridge.paused());

        vm.prank(user1);
        vm.expectRevert(QuantumShieldBridge.Paused.selector);
        bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);
    }

    function test_Unpause() public {
        bridge.pause();
        bridge.unpause();
        assertFalse(bridge.paused());

        // Should work now
        vm.prank(user1);
        bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);
    }

    // =========================================================================
    // Quantum Resistance Check
    // =========================================================================

    function test_IsQuantumResistant() public view {
        // Groth16 is NOT quantum resistant
        assertFalse(bridge.isQuantumResistant());
        assertEq(bridge.getVerifierType(), "groth16");
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _createMockProof() internal pure returns (bytes memory) {
        // Create a valid mock proof (256 bytes with non-zero data)
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }

    function _createPublicInputs(
        bytes32 lockId,
        bytes32 commitment,
        address recipient,
        uint256 amount,
        uint256 numSignatures,
        uint256 nonce
    ) internal pure returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](8);

        // Commitment (split into two 128-bit parts)
        inputs[0] = uint256(commitment) & ((1 << 128) - 1); // lower
        inputs[1] = uint256(commitment) >> 128;              // upper

        // Number of signatures verified
        inputs[2] = numSignatures;

        // Lock ID (split into two 128-bit parts)
        inputs[3] = uint256(lockId) & ((1 << 128) - 1); // lower
        inputs[4] = uint256(lockId) >> 128;              // upper

        // Recipient
        inputs[5] = uint256(uint160(recipient));

        // Amount
        inputs[6] = amount;

        // Nonce
        inputs[7] = nonce;

        return inputs;
    }
}
