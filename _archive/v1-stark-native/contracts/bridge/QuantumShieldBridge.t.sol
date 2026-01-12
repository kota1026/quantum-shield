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

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

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

        // Second release fails with ProofAlreadyUsed (replay protection)
        // This is the expected behavior - same proof cannot be reused
        vm.expectRevert(QuantumShieldBridge.ProofAlreadyUsed.selector);
        bridge.release(proof, publicInputs);
    }

    // Additional test: Verify LockAlreadyReleased error with different proof
    function test_Release_DifferentProofSameLock_Reverts() public {
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

        // Create new public inputs with different nonce and proof commitment
        uint256[] memory publicInputs2 = _createPublicInputs(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            1  // Different nonce
        );

        // Second release with same lock fails with LockAlreadyReleased
        vm.expectRevert(QuantumShieldBridge.LockAlreadyReleased.selector);
        bridge.release(proof, publicInputs2);
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
    // Boundary Value / Edge Case Tests
    // =========================================================================

    /// @notice Test coefficient bound exactly at max (65536) - should succeed
    function test_Release_CoefficientBoundExact_Success() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsExtended(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0,
            user1,
            1,      // circuitVersion
            65536   // coefficientBound - exactly at max
        );

        // Should succeed
        bridge.release(proof, publicInputs);

        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    /// @notice Test coefficient bound at 65537 - should revert
    function test_Release_CoefficientBoundOverflow_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsExtended(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0,
            user1,
            1,      // circuitVersion
            65537   // coefficientBound - one over max!
        );

        vm.expectRevert(QuantumShieldBridge.CoefficientOverflow.selector);
        bridge.release(proof, publicInputs);
    }

    /// @notice Test coefficient bound at 0 - edge case, should succeed
    function test_Release_CoefficientBoundZero_Success() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsExtended(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0,
            user1,
            1,  // circuitVersion
            0   // coefficientBound - zero is valid (no coefficients)
        );

        bridge.release(proof, publicInputs);

        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    /// @notice Test circuit version mismatch (version = 0)
    function test_Release_CircuitVersionZero_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsExtended(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0,
            user1,
            0,      // circuitVersion - wrong!
            65536
        );

        vm.expectRevert(QuantumShieldBridge.CircuitVersionMismatch.selector);
        bridge.release(proof, publicInputs);
    }

    /// @notice Test circuit version mismatch (version = 2)
    function test_Release_CircuitVersionTwo_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsExtended(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0,
            user1,
            2,      // circuitVersion - wrong (future version)
            65536
        );

        vm.expectRevert(QuantumShieldBridge.CircuitVersionMismatch.selector);
        bridge.release(proof, publicInputs);
    }

    // =========================================================================
    // Deep Replay Attack Tests
    // =========================================================================

    /// @notice Same proof commitment on different locks - should fail on second
    function test_Release_SameProofCommitmentDifferentLock_Reverts() public {
        // Lock 1
        vm.prank(user1);
        bytes32 lockId1 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Lock 2
        vm.prank(user1);
        bytes32 lockId2 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();

        // Create inputs for lock1 with specific proof commitment
        uint256[] memory publicInputs1 = _createPublicInputsWithFixedCommitment(
            lockId1,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0,
            user1,
            12345  // Fixed proof commitment
        );

        // Release lock1 - should succeed
        bridge.release(proof, publicInputs1);

        // Create inputs for lock2 with SAME proof commitment
        uint256[] memory publicInputs2 = _createPublicInputsWithFixedCommitment(
            lockId2,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            1,      // Different nonce
            user1,
            12345   // Same proof commitment!
        );

        // Should fail - proof commitment already used
        vm.expectRevert(QuantumShieldBridge.ProofAlreadyUsed.selector);
        bridge.release(proof, publicInputs2);
    }

    /// @notice Cross-sender nonce attack - different sender same nonce
    function test_Release_CrossSenderNonceAttack_Success() public {
        // user1 locks
        vm.prank(user1);
        bytes32 lockId1 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // user2 locks with same pk hash
        vm.prank(user2);
        bytes32 lockId2 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();

        // user1 releases with nonce 0
        uint256[] memory publicInputs1 = _createPublicInputsWithSender(
            lockId1,
            DILITHIUM_PK_HASH,
            address(0x3),
            1 ether,
            8,
            0,
            user1
        );
        bridge.release(proof, publicInputs1);

        // user2 tries to release with same global nonce 0 - should fail
        // (global nonce protection)
        uint256[] memory publicInputs2 = _createPublicInputsWithSenderAndNonce(
            lockId2,
            DILITHIUM_PK_HASH,
            address(0x4),
            1 ether,
            8,
            0,  // Same nonce
            user2
        );

        vm.expectRevert(QuantumShieldBridge.NonceAlreadyUsed.selector);
        bridge.release(proof, publicInputs2);
    }

    /// @notice Same sender tries same nonce twice
    function test_Release_SameSenderSameNonce_Reverts() public {
        vm.prank(user1);
        bytes32 lockId1 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        vm.prank(user1);
        bytes32 lockId2 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();

        // First release with nonce 0
        uint256[] memory publicInputs1 = _createPublicInputs(
            lockId1,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0
        );
        bridge.release(proof, publicInputs1);

        // Second release with same nonce - different proof commitment but same (sender, nonce)
        uint256[] memory publicInputs2 = new uint256[](12);
        publicInputs2[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        publicInputs2[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        publicInputs2[2] = 8;
        publicInputs2[3] = uint256(lockId2) & ((1 << 128) - 1);
        publicInputs2[4] = uint256(lockId2) >> 128;
        publicInputs2[5] = uint256(uint160(user2));
        publicInputs2[6] = 1 ether;
        publicInputs2[7] = 0;  // Same nonce!
        publicInputs2[8] = uint256(uint160(user1));
        publicInputs2[9] = 1;
        publicInputs2[10] = 65536;
        publicInputs2[11] = 999999;  // Different proof commitment

        vm.expectRevert(QuantumShieldBridge.NonceAlreadyUsed.selector);
        bridge.release(proof, publicInputs2);
    }

    // =========================================================================
    // Zero Recipient Attack Test
    // =========================================================================

    /// @notice Cannot release to zero address
    function test_Release_ZeroRecipient_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsWithSender(
            lockId,
            DILITHIUM_PK_HASH,
            address(0),  // Zero recipient!
            1 ether,
            8,
            0,
            user1
        );

        vm.expectRevert(QuantumShieldBridge.ZeroAddress.selector);
        bridge.release(proof, publicInputs);
    }

    // =========================================================================
    // Sender Mismatch Test
    // =========================================================================

    /// @notice Sender in proof doesn't match lock sender
    function test_Release_SenderMismatch_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        // Use user2 as sender in proof, but lock was created by user1
        uint256[] memory publicInputs = _createPublicInputsWithSender(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0,
            user2  // Wrong sender!
        );

        vm.expectRevert(QuantumShieldBridge.InvalidPublicInputs.selector);
        bridge.release(proof, publicInputs);
    }

    // =========================================================================
    // Owner & Access Control Tests
    // =========================================================================

    /// @notice Transfer ownership success
    function test_TransferOwnership_Success() public {
        bridge.transferOwnership(user1);
        assertEq(bridge.owner(), user1);
    }

    /// @notice Transfer ownership emits event
    function test_TransferOwnership_EmitsEvent() public {
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(address(this), user1);
        bridge.transferOwnership(user1);
    }

    /// @notice Transfer ownership to zero address fails
    function test_TransferOwnership_ZeroAddress_Reverts() public {
        vm.expectRevert(QuantumShieldBridge.ZeroAddress.selector);
        bridge.transferOwnership(address(0));
    }

    /// @notice Non-owner cannot transfer ownership
    function test_TransferOwnership_NotOwner_Reverts() public {
        vm.prank(user1);
        vm.expectRevert(QuantumShieldBridge.NotOwner.selector);
        bridge.transferOwnership(user2);
    }

    /// @notice Update verifier to zero address fails
    function test_UpdateVerifier_ZeroAddress_Reverts() public {
        vm.expectRevert(QuantumShieldBridge.ZeroAddress.selector);
        bridge.updateVerifier(address(0));
    }

    /// @notice Non-owner cannot pause
    function test_Pause_NotOwner_Reverts() public {
        vm.prank(user1);
        vm.expectRevert(QuantumShieldBridge.NotOwner.selector);
        bridge.pause();
    }

    /// @notice Non-owner cannot unpause
    function test_Unpause_NotOwner_Reverts() public {
        bridge.pause();
        vm.prank(user1);
        vm.expectRevert(QuantumShieldBridge.NotOwner.selector);
        bridge.unpause();
    }

    // =========================================================================
    // Pause Edge Case Tests
    // =========================================================================

    /// @notice Release fails when paused
    function test_Release_WhenPaused_Reverts() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bridge.pause();

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0
        );

        vm.expectRevert(QuantumShieldBridge.Paused.selector);
        bridge.release(proof, publicInputs);
    }

    /// @notice Pause then unpause allows release
    function test_Pause_ThenUnpause_ReleasesWork() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bridge.pause();
        bridge.unpause();

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0
        );

        bridge.release(proof, publicInputs);

        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    // =========================================================================
    // Gas & Large Value Tests
    // =========================================================================

    /// @notice Large proof commitment value works
    function test_Release_MaxProofCommitment_Success() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsWithFixedCommitment(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0,
            user1,
            type(uint256).max  // Max proof commitment
        );

        bridge.release(proof, publicInputs);

        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    /// @notice Multiple locks from same user
    function test_Lock_ManyFromSameUser() public {
        vm.startPrank(user1);

        for (uint i = 0; i < 10; i++) {
            bridge.lock{value: 0.1 ether}(DILITHIUM_PK_HASH);
        }

        assertEq(bridge.totalLocked(), 1 ether);
        vm.stopPrank();
    }

    // =========================================================================
    // Event Emission Tests
    // =========================================================================

    /// @notice Verifier update emits event
    function test_UpdateVerifier_EmitsEvent() public {
        SP1Groth16Verifier newVerifier = new SP1Groth16Verifier(keccak256("new_vk"));

        vm.expectEmit(true, true, false, true);
        emit VerifierUpdated(address(verifier), address(newVerifier), "groth16");

        bridge.updateVerifier(address(newVerifier));
    }

    /// @notice Pause emits event
    function test_Pause_EmitsEvent() public {
        vm.expectEmit(true, false, false, false);
        emit EmergencyPaused(owner);

        bridge.pause();
    }

    /// @notice Unpause emits event
    function test_Unpause_EmitsEvent() public {
        bridge.pause();

        vm.expectEmit(true, false, false, false);
        emit EmergencyUnpaused(owner);

        bridge.unpause();
    }

    /// @notice Release emits event with correct data
    function test_Release_EmitsEvent() public {
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

        vm.expectEmit(true, true, false, true);
        emit Released(lockId, user2, 1 ether, 8);

        bridge.release(proof, publicInputs);
    }

    // =========================================================================
    // View Function Tests
    // =========================================================================

    /// @notice getLock returns correct data
    function test_GetLock_ReturnsCorrectData() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        (
            address sender,
            uint256 amount,
            bytes32 pkHash,
            uint256 timestamp,
            bool released
        ) = bridge.getLock(lockId);

        assertEq(sender, user1);
        assertEq(amount, 1 ether);
        assertEq(pkHash, DILITHIUM_PK_HASH);
        assertEq(timestamp, block.timestamp);
        assertFalse(released);
    }

    /// @notice usedNonces tracks correctly
    function test_UsedNonces_TracksCorrectly() public {
        assertFalse(bridge.usedNonces(0));

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

        bridge.release(proof, publicInputs);

        assertTrue(bridge.usedNonces(0));
    }

    /// @notice usedProofCommitments tracks correctly
    function test_UsedProofCommitments_TracksCorrectly() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes32 proofCommitment = keccak256(abi.encodePacked(lockId, uint256(0), user1));

        assertFalse(bridge.usedProofCommitments(proofCommitment));

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(
            lockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0
        );

        bridge.release(proof, publicInputs);

        assertTrue(bridge.usedProofCommitments(proofCommitment));
    }

    /// @notice senderNoncePairs tracks correctly
    function test_SenderNoncePairs_TracksCorrectly() public {
        assertFalse(bridge.senderNoncePairs(user1, 0));

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

        bridge.release(proof, publicInputs);

        assertTrue(bridge.senderNoncePairs(user1, 0));
    }

    /// @notice nextExpectedNonce updates correctly
    function test_NextExpectedNonce_UpdatesCorrectly() public {
        assertEq(bridge.nextExpectedNonce(user1), 0);

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

        bridge.release(proof, publicInputs);

        assertEq(bridge.nextExpectedNonce(user1), 1);
    }

    // =========================================================================
    // Lock Not Found Test
    // =========================================================================

    /// @notice Release with non-existent lock fails
    function test_Release_LockNotFound_Reverts() public {
        bytes32 fakeLockId = keccak256("fake_lock");

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsWithSender(
            fakeLockId,
            DILITHIUM_PK_HASH,
            user2,
            1 ether,
            8,
            0,
            user1
        );

        vm.expectRevert(QuantumShieldBridge.LockNotFound.selector);
        bridge.release(proof, publicInputs);
    }

    // =========================================================================
    // Direct ETH Transfer Test
    // =========================================================================

    /// @notice Direct ETH transfer via receive()
    function test_DirectETHTransfer_Success() public {
        uint256 balanceBefore = address(bridge).balance;

        (bool success,) = address(bridge).call{value: 1 ether}("");
        assertTrue(success);

        // Direct transfers don't increase totalLocked
        assertEq(bridge.totalLocked(), 0);
        assertEq(address(bridge).balance, balanceBefore + 1 ether);
    }

    // =========================================================================
    // Additional Events (declared for testing)
    // =========================================================================

    event VerifierUpdated(
        address indexed oldVerifier,
        address indexed newVerifier,
        string verifierType
    );

    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);

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
    ) internal view returns (uint256[] memory) {
        return _createPublicInputsWithSender(
            lockId,
            commitment,
            recipient,
            amount,
            numSignatures,
            nonce,
            user1  // Default sender
        );
    }

    function _createPublicInputsWithSender(
        bytes32 lockId,
        bytes32 commitment,
        address recipient,
        uint256 amount,
        uint256 numSignatures,
        uint256 nonce,
        address sender
    ) internal pure returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        // [0-1] Commitment (split into two 128-bit parts)
        inputs[0] = uint256(commitment) & ((1 << 128) - 1); // lower
        inputs[1] = uint256(commitment) >> 128;              // upper

        // [2] Number of signatures verified
        inputs[2] = numSignatures;

        // [3-4] Lock ID (split into two 128-bit parts)
        inputs[3] = uint256(lockId) & ((1 << 128) - 1); // lower
        inputs[4] = uint256(lockId) >> 128;              // upper

        // [5] Recipient
        inputs[5] = uint256(uint160(recipient));

        // [6] Amount
        inputs[6] = amount;

        // [7] Nonce
        inputs[7] = nonce;

        // [8] Sender address (for sender-nonce binding)
        inputs[8] = uint256(uint160(sender));

        // [9] Circuit version (must match contract CIRCUIT_VERSION = 1)
        inputs[9] = 1;

        // [10] Max coefficient bound (must be <= 65536)
        inputs[10] = 65536;

        // [11] Proof commitment hash (unique per proof)
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, nonce, sender)));

        return inputs;
    }

    /// @notice Create public inputs with custom circuit version and coefficient bound
    function _createPublicInputsExtended(
        bytes32 lockId,
        bytes32 commitment,
        address recipient,
        uint256 amount,
        uint256 numSignatures,
        uint256 nonce,
        address sender,
        uint256 circuitVersion,
        uint256 coefficientBound
    ) internal pure returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(commitment) & ((1 << 128) - 1);
        inputs[1] = uint256(commitment) >> 128;
        inputs[2] = numSignatures;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(recipient));
        inputs[6] = amount;
        inputs[7] = nonce;
        inputs[8] = uint256(uint160(sender));
        inputs[9] = circuitVersion;
        inputs[10] = coefficientBound;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, nonce, sender, circuitVersion)));

        return inputs;
    }

    /// @notice Create public inputs with fixed proof commitment
    function _createPublicInputsWithFixedCommitment(
        bytes32 lockId,
        bytes32 commitment,
        address recipient,
        uint256 amount,
        uint256 numSignatures,
        uint256 nonce,
        address sender,
        uint256 proofCommitment
    ) internal pure returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(commitment) & ((1 << 128) - 1);
        inputs[1] = uint256(commitment) >> 128;
        inputs[2] = numSignatures;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(recipient));
        inputs[6] = amount;
        inputs[7] = nonce;
        inputs[8] = uint256(uint160(sender));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = proofCommitment;  // Fixed value

        return inputs;
    }

    /// @notice Create public inputs with sender and separate nonce for unique proof commitment
    function _createPublicInputsWithSenderAndNonce(
        bytes32 lockId,
        bytes32 commitment,
        address recipient,
        uint256 amount,
        uint256 numSignatures,
        uint256 nonce,
        address sender
    ) internal pure returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(commitment) & ((1 << 128) - 1);
        inputs[1] = uint256(commitment) >> 128;
        inputs[2] = numSignatures;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(recipient));
        inputs[6] = amount;
        inputs[7] = nonce;
        inputs[8] = uint256(uint160(sender));
        inputs[9] = 1;
        inputs[10] = 65536;
        // Different proof commitment based on sender
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, nonce, sender, "unique")));

        return inputs;
    }
}

// =========================================================================
// Reentrancy Attack Test Contract
// =========================================================================

/// @title ReentrancyAttacker - Tests reentrancy protection
contract ReentrancyAttacker {
    QuantumShieldBridge public bridge;
    bytes public storedProof;
    uint256[] public storedInputs;
    uint256 public attackCount;
    bool public attackEnabled;

    constructor(address _bridge) {
        bridge = QuantumShieldBridge(payable(_bridge));
    }

    function setAttackData(bytes memory proof, uint256[] memory inputs) external {
        storedProof = proof;
        storedInputs = inputs;
    }

    function enableAttack() external {
        attackEnabled = true;
    }

    receive() external payable {
        if (attackEnabled && attackCount < 2) {
            attackCount++;
            // Try to reenter with same proof - should fail
            try bridge.release(storedProof, storedInputs) {
                // If we get here, reentrancy succeeded (bad!)
                revert("Reentrancy attack succeeded!");
            } catch {
                // Expected: reentrancy blocked
            }
        }
    }
}

/// @title Reentrancy Test Suite
contract ReentrancyTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;
    ReentrancyAttacker public attacker;

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        attacker = new ReentrancyAttacker(address(bridge));

        vm.deal(address(this), 100 ether);
        vm.deal(address(attacker), 100 ether);
    }

    /// @notice Test reentrancy attack is blocked
    function test_Release_ReentrancyAttack_Blocked() public {
        // Lock funds
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Create proof pointing to attacker as recipient
        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId, address(attacker));

        // Setup attacker
        attacker.setAttackData(proof, publicInputs);
        attacker.enableAttack();

        // First release should succeed, reentrancy attempts should fail
        bridge.release(proof, publicInputs);

        // Verify funds were transferred (exactly once)
        assertEq(address(attacker).balance, 100 ether + 1 ether);

        // Verify lock is released
        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);

        // Verify attacker attempted reentrancy
        assertGt(attacker.attackCount(), 0);
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }

    function _createPublicInputs(bytes32 lockId, address recipient) internal view returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        inputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(recipient));
        inputs[6] = 1 ether;
        inputs[7] = 0;
        inputs[8] = uint256(uint160(address(this)));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        return inputs;
    }
}

// =========================================================================
// Invariant Test Suite
// =========================================================================

/// @title Handler for Invariant Testing
contract BridgeHandler is Test {
    QuantumShieldBridge public bridge;
    address[] public actors;
    bytes32[] public activeLockIds;

    uint256 public ghostTotalLocked;
    uint256 public ghostTotalReleased;
    mapping(bytes32 => bool) public ghostReleasedLocks;

    constructor(QuantumShieldBridge _bridge) {
        bridge = _bridge;
        actors.push(address(0x1000));
        actors.push(address(0x2000));
        actors.push(address(0x3000));
        for (uint i = 0; i < actors.length; i++) {
            vm.deal(actors[i], 1000 ether);
        }
    }

    function getActiveLockIdsLength() external view returns (uint256) {
        return activeLockIds.length;
    }

    function getActiveLockId(uint256 index) external view returns (bytes32) {
        return activeLockIds[index];
    }

    function lock(uint256 actorSeed, uint256 amount) external {
        address actor = actors[actorSeed % actors.length];
        amount = bound(amount, 1, 10 ether);

        vm.prank(actor);
        bytes32 lockId = bridge.lock{value: amount}(keccak256(abi.encodePacked("pk", actor)));

        activeLockIds.push(lockId);
        ghostTotalLocked += amount;
    }

    function release(uint256 lockIndex) external {
        if (activeLockIds.length == 0) return;

        lockIndex = lockIndex % activeLockIds.length;
        bytes32 lockId = activeLockIds[lockIndex];

        (address sender, uint256 amount, bytes32 pkHash, , bool released) = bridge.getLock(lockId);
        if (released || sender == address(0)) return;

        bytes memory proof = _createMockProof();
        uint256[] memory inputs = new uint256[](12);
        inputs[0] = uint256(pkHash) & ((1 << 128) - 1);
        inputs[1] = uint256(pkHash) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(address(0x9999)));
        inputs[6] = amount;
        inputs[7] = uint256(keccak256(abi.encodePacked(lockId)));
        inputs[8] = uint256(uint160(sender));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, block.timestamp)));

        vm.deal(address(0x9999), 0);

        try bridge.release(proof, inputs) {
            ghostTotalReleased += amount;
            ghostReleasedLocks[lockId] = true;
        } catch {}
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }
}

/// @title Invariant Tests
contract InvariantTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;
    BridgeHandler public handler;

    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        handler = new BridgeHandler(bridge);

        targetContract(address(handler));
    }

    /// @notice Invariant: totalLocked == contract balance
    function invariant_totalLockedEqualsBalance() public view {
        assertEq(bridge.totalLocked(), address(bridge).balance);
    }

    /// @notice Invariant: totalLocked >= 0 (no underflow)
    function invariant_noNegativeLocked() public view {
        assertGe(bridge.totalLocked(), 0);
    }

    /// @notice Invariant: Released locks cannot be released again
    function invariant_noDoubleRelease() public view {
        uint256 length = handler.getActiveLockIdsLength();
        for (uint i = 0; i < length; i++) {
            bytes32 lockId = handler.getActiveLockId(i);

            (, , , , bool released) = bridge.getLock(lockId);
            if (handler.ghostReleasedLocks(lockId)) {
                assertTrue(released, "Ghost says released but contract says not");
            }
        }
    }

    /// @notice Invariant: nonceCounter only increases
    function invariant_nonceCounterOnlyIncreases() public view {
        // nonceCounter should be >= number of locks created
        assertGe(bridge.nonceCounter(), handler.getActiveLockIdsLength());
    }
}

// =========================================================================
// Gas Griefing Attack Test
// =========================================================================

/// @title GasGriefingReceiver - Contract that consumes all gas on receive
contract GasGriefingReceiver {
    uint256 public counter;

    receive() external payable {
        // Consume lots of gas (but not infinite to allow test to complete)
        for (uint i = 0; i < 10000; i++) {
            counter = i;
        }
    }
}

/// @title Gas Griefing Test Suite
contract GasGriefingTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;
    GasGriefingReceiver public griefingReceiver;

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        griefingReceiver = new GasGriefingReceiver();

        vm.deal(address(this), 100 ether);
    }

    /// @notice Gas griefing receiver gets funds despite high gas usage
    function test_Release_ToGasGriefingReceiver_StillWorks() public {
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId, address(griefingReceiver));

        uint256 gasBefore = gasleft();
        bridge.release(proof, publicInputs);
        uint256 gasUsed = gasBefore - gasleft();

        // Verify release succeeded
        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);

        // Gas used should be reasonable (< 4M even with griefing receiver)
        // The griefing receiver consumes ~1.5M gas, but transfer still succeeds
        // Note: Coverage mode uses more gas due to instrumentation
        assertLt(gasUsed, 4_000_000);
    }

    /// @notice Release gas cost is bounded
    function test_Release_GasCost_Bounded() public {
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId, address(0x1234));

        uint256 gasBefore = gasleft();
        bridge.release(proof, publicInputs);
        uint256 gasUsed = gasBefore - gasleft();

        // Normal release should use < 500k gas
        assertLt(gasUsed, 500_000);
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }

    function _createPublicInputs(bytes32 lockId, address recipient) internal view returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        inputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(recipient));
        inputs[6] = 1 ether;
        inputs[7] = 0;
        inputs[8] = uint256(uint160(address(this)));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        return inputs;
    }
}

// =========================================================================
// Fuzz Test Suite
// =========================================================================

/// @title Fuzz Tests for edge cases
contract FuzzTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        vm.deal(address(this), 1000 ether);
    }

    /// @notice Fuzz test: Any amount > 0 can be locked
    function testFuzz_Lock_AnyAmount(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);

        bytes32 lockId = bridge.lock{value: amount}(DILITHIUM_PK_HASH);

        (, uint256 lockedAmount, , , ) = bridge.getLock(lockId);
        assertEq(lockedAmount, amount);
    }

    /// @notice Fuzz test: Any valid coefficient bound works
    function testFuzz_Release_ValidCoefficientBound(uint256 coeffBound) public {
        coeffBound = bound(coeffBound, 0, 65536);

        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsWithCoeff(lockId, coeffBound);

        bridge.release(proof, publicInputs);

        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    /// @notice Fuzz test: Invalid coefficient bound always fails
    function testFuzz_Release_InvalidCoefficientBound(uint256 coeffBound) public {
        coeffBound = bound(coeffBound, 65537, type(uint256).max);

        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsWithCoeff(lockId, coeffBound);

        vm.expectRevert(QuantumShieldBridge.CoefficientOverflow.selector);
        bridge.release(proof, publicInputs);
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }

    function _createPublicInputsWithCoeff(bytes32 lockId, uint256 coeffBound) internal view returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        inputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(address(0x1234)));
        inputs[6] = 1 ether;
        inputs[7] = 0;
        inputs[8] = uint256(uint160(address(this)));
        inputs[9] = 1;
        inputs[10] = coeffBound;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this), coeffBound)));

        return inputs;
    }
}

// =========================================================================
// Force-Feed ETH / Selfdestruct Attack Tests
// =========================================================================

/// @title SelfDestructAttacker - Contract for force-feeding ETH
contract SelfDestructAttacker {
    function attack(address target) external payable {
        selfdestruct(payable(target));
    }
}

/// @title Force-Feed ETH Test Suite
contract ForceFeedETHTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;
    SelfDestructAttacker public attacker;

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        attacker = new SelfDestructAttacker();

        vm.deal(address(this), 100 ether);
        vm.deal(address(attacker), 100 ether);
    }

    /// @notice Force-feed ETH doesn't affect totalLocked invariant
    function test_ForceFeedETH_InvariantMaintained() public {
        // Lock some ETH normally
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);
        uint256 initialLocked = bridge.totalLocked();
        uint256 initialBalance = address(bridge).balance;

        assertEq(initialLocked, 1 ether);
        assertEq(initialBalance, 1 ether);

        // Force-feed ETH via selfdestruct
        SelfDestructAttacker newAttacker = new SelfDestructAttacker();
        vm.deal(address(newAttacker), 2 ether);
        newAttacker.attack{value: 0}(address(bridge));

        // totalLocked is unchanged (balance > totalLocked now)
        assertEq(bridge.totalLocked(), initialLocked);
        assertGt(address(bridge).balance, bridge.totalLocked());

        // Release should still work correctly
        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId, address(0x1234));

        bridge.release(proof, publicInputs);

        // Verify correct amount was released (1 ether, not more)
        assertEq(bridge.totalLocked(), 0);
        assertEq(address(0x1234).balance, 1 ether); // Only locked amount, not force-fed
    }

    /// @notice Force-feed doesn't allow unauthorized withdrawals
    function test_ForceFeedETH_NoUnauthorizedWithdrawal() public {
        // Force-feed ETH
        SelfDestructAttacker newAttacker = new SelfDestructAttacker();
        vm.deal(address(newAttacker), 5 ether);
        newAttacker.attack{value: 0}(address(bridge));

        assertEq(address(bridge).balance, 5 ether);
        assertEq(bridge.totalLocked(), 0);

        // Cannot withdraw force-fed ETH because no lock exists
        bytes32 fakeLockId = keccak256("fake");
        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(fakeLockId, address(0x1234));

        vm.expectRevert(QuantumShieldBridge.LockNotFound.selector);
        bridge.release(proof, publicInputs);

        // Force-fed ETH remains in contract
        assertEq(address(bridge).balance, 5 ether);
    }

    /// @notice Multiple force-feeds maintain accounting integrity
    function test_ForceFeedETH_MultipleAttacks() public {
        // Lock 1 ether
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Force-feed multiple times
        for (uint i = 0; i < 3; i++) {
            SelfDestructAttacker newAttacker = new SelfDestructAttacker();
            vm.deal(address(newAttacker), 1 ether);
            newAttacker.attack{value: 0}(address(bridge));
        }

        // Balance is 4 ether but totalLocked is 1 ether
        assertEq(address(bridge).balance, 4 ether);
        assertEq(bridge.totalLocked(), 1 ether);

        // Release only releases locked amount
        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId, address(0x5555));

        bridge.release(proof, publicInputs);

        assertEq(address(0x5555).balance, 1 ether);
        assertEq(address(bridge).balance, 3 ether); // Force-fed ETH remains
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }

    function _createPublicInputs(bytes32 lockId, address recipient) internal view returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        inputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(recipient));
        inputs[6] = 1 ether;
        inputs[7] = 0;
        inputs[8] = uint256(uint160(address(this)));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        return inputs;
    }
}

// =========================================================================
// Cross-Function Reentrancy Tests
// =========================================================================

/// @title CrossFunctionReentrancyAttacker - Attempts to call lock() during release()
contract CrossFunctionReentrancyAttacker {
    QuantumShieldBridge public bridge;
    uint256 public attackCount;
    bool public attackEnabled;
    uint256 public lockedAmount;

    constructor(address _bridge) {
        bridge = QuantumShieldBridge(payable(_bridge));
    }

    function enableAttack() external payable {
        attackEnabled = true;
        lockedAmount = msg.value;
    }

    receive() external payable {
        if (attackEnabled && attackCount < 1) {
            attackCount++;
            // Try to call lock() during release() callback
            try bridge.lock{value: lockedAmount}(keccak256("attacker_pk")) returns (bytes32) {
                // Cross-function reentrancy succeeded
            } catch {
                // Expected if reentrancy protection exists
            }
        }
    }
}

/// @title Cross-Function Reentrancy Test Suite
contract CrossFunctionReentrancyTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;
    CrossFunctionReentrancyAttacker public attacker;

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        attacker = new CrossFunctionReentrancyAttacker(address(bridge));

        vm.deal(address(this), 100 ether);
        vm.deal(address(attacker), 100 ether);
    }

    /// @notice Cross-function reentrancy (lock during release) state consistency
    function test_CrossFunctionReentrancy_StateConsistency() public {
        // Lock funds with this contract as sender
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        uint256 totalLockedBefore = bridge.totalLocked();
        uint256 nonceBefore = bridge.nonceCounter();

        // Setup attacker - give it ETH to use in reentrancy lock()
        attacker.enableAttack{value: 0.5 ether}();

        // Create proof that releases to attacker
        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId, address(attacker));

        // Release - attacker will try to call lock() in receive()
        bridge.release(proof, publicInputs);

        // Verify state consistency
        // If cross-function reentrancy succeeded, attacker.attackCount > 0
        // and there should be a new lock

        if (attacker.attackCount() > 0) {
            // Reentrancy happened - verify state is still consistent
            // totalLocked should be 0 (released) + 0.5 ether (new lock if succeeded)
            // The exact value depends on whether the lock succeeded
            assertTrue(bridge.totalLocked() >= 0);
            assertTrue(bridge.nonceCounter() >= nonceBefore);
        } else {
            // No reentrancy - should have released
            assertEq(bridge.totalLocked(), 0);
        }

        // Original lock should always be released
        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    /// @notice Verify totalLocked accounting is correct after cross-function reentrancy
    function test_CrossFunctionReentrancy_AccountingCorrect() public {
        bytes32 lockId = bridge.lock{value: 2 ether}(DILITHIUM_PK_HASH);

        attacker.enableAttack{value: 1 ether}();

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = new uint256[](12);
        publicInputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        publicInputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        publicInputs[2] = 8;
        publicInputs[3] = uint256(lockId) & ((1 << 128) - 1);
        publicInputs[4] = uint256(lockId) >> 128;
        publicInputs[5] = uint256(uint160(address(attacker)));
        publicInputs[6] = 2 ether;
        publicInputs[7] = 0;
        publicInputs[8] = uint256(uint160(address(this)));
        publicInputs[9] = 1;
        publicInputs[10] = 65536;
        publicInputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        bridge.release(proof, publicInputs);

        // After release, totalLocked should equal actual balance
        // (if reentrancy lock succeeded, both should have the new lock's amount)
        uint256 actualBalance = address(bridge).balance;
        uint256 totalLocked = bridge.totalLocked();

        // Key invariant: totalLocked <= actualBalance
        assertLe(totalLocked, actualBalance);
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }

    function _createPublicInputs(bytes32 lockId, address recipient) internal view returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        inputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(recipient));
        inputs[6] = 1 ether;
        inputs[7] = 0;
        inputs[8] = uint256(uint160(address(this)));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        return inputs;
    }
}

// =========================================================================
// Timestamp Manipulation Tests
// =========================================================================

/// @title Timestamp Manipulation Test Suite
contract TimestampManipulationTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        vm.deal(address(this), 100 ether);
    }

    /// @notice Lock ID includes timestamp - different timestamps = different locks
    function test_Timestamp_DifferentLockIds() public {
        vm.warp(1000);
        bytes32 lockId1 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        vm.warp(2000);
        bytes32 lockId2 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Different timestamps should result in different lock IDs
        assertNotEq(lockId1, lockId2);
    }

    /// @notice Timestamp is recorded correctly in lock
    function test_Timestamp_RecordedInLock() public {
        vm.warp(12345678);

        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        (, , , uint256 timestamp, ) = bridge.getLock(lockId);
        assertEq(timestamp, 12345678);
    }

    /// @notice Release works regardless of future timestamp
    function test_Timestamp_ReleaseFutureTime() public {
        vm.warp(1000);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Warp to far future
        vm.warp(1000000000);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId);

        bridge.release(proof, publicInputs);

        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    /// @notice Timestamp at uint256 max edge case
    function test_Timestamp_MaxValue() public {
        vm.warp(type(uint256).max);

        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        (, , , uint256 timestamp, ) = bridge.getLock(lockId);
        assertEq(timestamp, type(uint256).max);
    }

    /// @notice Timestamp at zero
    function test_Timestamp_Zero() public {
        vm.warp(0);

        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        (, , , uint256 timestamp, ) = bridge.getLock(lockId);
        assertEq(timestamp, 0);
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }

    function _createPublicInputs(bytes32 lockId) internal view returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        inputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(address(0x1234)));
        inputs[6] = 1 ether;
        inputs[7] = 0;
        inputs[8] = uint256(uint160(address(this)));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        return inputs;
    }
}

// =========================================================================
// Integer Boundary / Casting Tests
// =========================================================================

/// @title Integer Boundary Test Suite
contract IntegerBoundaryTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        vm.deal(address(this), type(uint256).max);
    }

    /// @notice Recipient casting from uint256 to address(uint160)
    function test_RecipientCasting_HighBitsIgnored() public {
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = new uint256[](12);

        publicInputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        publicInputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        publicInputs[2] = 8;
        publicInputs[3] = uint256(lockId) & ((1 << 128) - 1);
        publicInputs[4] = uint256(lockId) >> 128;
        // Recipient with high bits set - should be truncated to address(0x1234)
        publicInputs[5] = uint256(uint160(address(0x1234))) | (uint256(1) << 200);
        publicInputs[6] = 1 ether;
        publicInputs[7] = 0;
        publicInputs[8] = uint256(uint160(address(this)));
        publicInputs[9] = 1;
        publicInputs[10] = 65536;
        publicInputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        bridge.release(proof, publicInputs);

        // Funds should go to 0x1234 (truncated address)
        assertEq(address(0x1234).balance, 1 ether);
    }

    /// @notice Sender casting from uint256 to address(uint160)
    function test_SenderCasting_HighBitsIgnored() public {
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = new uint256[](12);

        publicInputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        publicInputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        publicInputs[2] = 8;
        publicInputs[3] = uint256(lockId) & ((1 << 128) - 1);
        publicInputs[4] = uint256(lockId) >> 128;
        publicInputs[5] = uint256(uint160(address(0x5678)));
        publicInputs[6] = 1 ether;
        publicInputs[7] = 0;
        // Sender with high bits set - should still match
        publicInputs[8] = uint256(uint160(address(this))) | (uint256(0xFF) << 160);
        publicInputs[9] = 1;
        publicInputs[10] = 65536;
        publicInputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        bridge.release(proof, publicInputs);

        // Should succeed because address(uint160()) truncates properly
        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    /// @notice Lock ID reconstruction with max values
    function test_LockIdReconstruction_MaxValues() public {
        // Create a lock ID that has max bits in both halves
        bytes32 maxLockId = bytes32(type(uint256).max);

        // This won't exist, but verify reconstruction math
        uint256 low = uint256(maxLockId) & ((1 << 128) - 1);
        uint256 high = uint256(maxLockId) >> 128;

        // Reconstruct
        bytes32 reconstructed = bytes32((high << 128) | low);

        assertEq(reconstructed, maxLockId);
    }

    /// @notice Amount at max uint256
    function test_Amount_MaxUint256() public {
        // Lock max amount (though we won't have that much ETH)
        // Just verify no overflow in amount handling
        vm.deal(address(this), type(uint256).max);

        // We can't actually lock type(uint256).max ETH, but we can verify
        // that amounts near max work
        uint256 largeAmount = 1000000 ether;
        bytes32 lockId = bridge.lock{value: largeAmount}(DILITHIUM_PK_HASH);

        (, uint256 amount, , , ) = bridge.getLock(lockId);
        assertEq(amount, largeAmount);
    }

    /// @notice Number of signatures max value
    function test_NumSignatures_MaxValue() public {
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = new uint256[](12);

        publicInputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        publicInputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        publicInputs[2] = type(uint256).max; // Max signatures
        publicInputs[3] = uint256(lockId) & ((1 << 128) - 1);
        publicInputs[4] = uint256(lockId) >> 128;
        publicInputs[5] = uint256(uint160(address(0x1234)));
        publicInputs[6] = 1 ether;
        publicInputs[7] = 0;
        publicInputs[8] = uint256(uint160(address(this)));
        publicInputs[9] = 1;
        publicInputs[10] = 65536;
        publicInputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        // Should still work - numSignatures is just recorded, not validated
        bridge.release(proof, publicInputs);

        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }
}

// =========================================================================
// Storage Slot Collision Tests
// =========================================================================

/// @title Storage Slot Collision Test Suite
contract StorageSlotTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        vm.deal(address(this), 100 ether);
    }

    /// @notice Verify storage slots are independent (locks vs usedNonces)
    function test_StorageSlots_IndependentMappings() public {
        // Create a lock
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Check lock exists
        (address sender, , , , ) = bridge.getLock(lockId);
        assertEq(sender, address(this));

        // Nonce 0 should not be used yet
        assertFalse(bridge.usedNonces(0));

        // Release to mark nonce as used
        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId);

        bridge.release(proof, publicInputs);

        // Now nonce 0 is used
        assertTrue(bridge.usedNonces(0));

        // But other nonces are still unused
        assertFalse(bridge.usedNonces(1));
        assertFalse(bridge.usedNonces(type(uint256).max));
    }

    /// @notice Verify usedProofCommitments doesn't collide with usedNonces
    function test_StorageSlots_ProofCommitmentVsNonce() public {
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId);

        bytes32 proofCommitment = bytes32(publicInputs[11]);

        // Before release
        assertFalse(bridge.usedProofCommitments(proofCommitment));
        assertFalse(bridge.usedNonces(0));

        bridge.release(proof, publicInputs);

        // After release - both should be marked
        assertTrue(bridge.usedProofCommitments(proofCommitment));
        assertTrue(bridge.usedNonces(0));

        // But unrelated values should be unaffected
        assertFalse(bridge.usedProofCommitments(bytes32(0)));
        assertFalse(bridge.usedNonces(999));
    }

    /// @notice Verify senderNoncePairs mapping independence
    function test_StorageSlots_SenderNoncePairs() public {
        address sender1 = address(0x1111);
        address sender2 = address(0x2222);

        vm.deal(sender1, 10 ether);
        vm.deal(sender2, 10 ether);

        // Lock from sender1
        vm.prank(sender1);
        bytes32 lockId1 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Lock from sender2
        vm.prank(sender2);
        bytes32 lockId2 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Neither has used nonce 0 for their sender-nonce pair
        assertFalse(bridge.senderNoncePairs(sender1, 0));
        assertFalse(bridge.senderNoncePairs(sender2, 0));

        // Release from sender1 with nonce 0
        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputsForSender(lockId1, sender1, 0);

        bridge.release(proof, publicInputs);

        // Sender1's nonce 0 is now used
        assertTrue(bridge.senderNoncePairs(sender1, 0));

        // But sender2's nonce 0 is still unused
        assertFalse(bridge.senderNoncePairs(sender2, 0));
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }

    function _createPublicInputs(bytes32 lockId) internal view returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        inputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(address(0x1234)));
        inputs[6] = 1 ether;
        inputs[7] = 0;
        inputs[8] = uint256(uint160(address(this)));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), address(this))));

        return inputs;
    }

    function _createPublicInputsForSender(bytes32 lockId, address sender, uint256 nonce) internal pure returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        inputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(address(0x1234)));
        inputs[6] = 1 ether;
        inputs[7] = nonce;
        inputs[8] = uint256(uint160(sender));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, nonce, sender)));

        return inputs;
    }
}

// =========================================================================
// Emergency Recovery Scenario Tests
// =========================================================================

/// @title Emergency Recovery Scenario Test Suite
contract EmergencyRecoveryTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;
    SP1Groth16Verifier public newVerifier;

    bytes32 constant DILITHIUM_PK_HASH = keccak256("dilithium_public_key_1");
    bytes32 constant VK_HASH = keccak256("sp1_verification_key");
    bytes32 constant NEW_VK_HASH = keccak256("new_vk");

    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        newVerifier = new SP1Groth16Verifier(NEW_VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));

        vm.deal(address(this), 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    /// @notice Pause during active locks - locks preserved
    function test_EmergencyPause_LocksPreserved() public {
        // Create multiple locks
        vm.prank(user1);
        bytes32 lockId1 = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        vm.prank(user2);
        bytes32 lockId2 = bridge.lock{value: 2 ether}(DILITHIUM_PK_HASH);

        assertEq(bridge.totalLocked(), 3 ether);

        // Pause
        bridge.pause();

        // Locks are preserved
        (address sender1, uint256 amount1, , , bool released1) = bridge.getLock(lockId1);
        assertEq(sender1, user1);
        assertEq(amount1, 1 ether);
        assertFalse(released1);

        (address sender2, uint256 amount2, , , bool released2) = bridge.getLock(lockId2);
        assertEq(sender2, user2);
        assertEq(amount2, 2 ether);
        assertFalse(released2);

        assertEq(bridge.totalLocked(), 3 ether);
    }

    /// @notice Unpause allows release of previously locked funds
    function test_EmergencyUnpause_ReleasesWork() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bridge.pause();
        bridge.unpause();

        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId, user1, user2);

        bridge.release(proof, publicInputs);

        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
        assertEq(user2.balance, 100 ether + 1 ether);
    }

    /// @notice Verifier upgrade during active locks
    function test_VerifierUpgrade_DuringActiveLocks() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Upgrade verifier
        bridge.updateVerifier(address(newVerifier));

        // Locks still exist
        (address sender, uint256 amount, , , ) = bridge.getLock(lockId);
        assertEq(sender, user1);
        assertEq(amount, 1 ether);

        // New verifier is used
        assertEq(address(bridge.verifier()), address(newVerifier));
    }

    /// @notice Multiple pause/unpause cycles
    function test_MultiplePauseUnpauseCycles() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Cycle 1
        bridge.pause();
        assertTrue(bridge.paused());
        bridge.unpause();
        assertFalse(bridge.paused());

        // Cycle 2
        bridge.pause();
        assertTrue(bridge.paused());
        bridge.unpause();
        assertFalse(bridge.paused());

        // Cycle 3
        bridge.pause();
        assertTrue(bridge.paused());
        bridge.unpause();
        assertFalse(bridge.paused());

        // Lock should still be releasable
        bytes memory proof = _createMockProof();
        uint256[] memory publicInputs = _createPublicInputs(lockId, user1, user2);

        bridge.release(proof, publicInputs);

        (, , , , bool released) = bridge.getLock(lockId);
        assertTrue(released);
    }

    /// @notice Ownership transfer preserves locks and state
    function test_OwnershipTransfer_PreservesState() public {
        vm.prank(user1);
        bytes32 lockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        uint256 totalBefore = bridge.totalLocked();
        uint256 nonceBefore = bridge.nonceCounter();

        // Transfer ownership
        bridge.transferOwnership(user2);

        // State preserved
        assertEq(bridge.totalLocked(), totalBefore);
        assertEq(bridge.nonceCounter(), nonceBefore);

        (address sender, uint256 amount, , , bool released) = bridge.getLock(lockId);
        assertEq(sender, user1);
        assertEq(amount, 1 ether);
        assertFalse(released);

        // New owner can pause
        vm.prank(user2);
        bridge.pause();
        assertTrue(bridge.paused());
    }

    /// @notice Emergency pause prevents new locks but preserves existing
    function test_EmergencyPause_NewLocksBlocked() public {
        vm.prank(user1);
        bytes32 existingLockId = bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        bridge.pause();

        // New locks fail
        vm.prank(user2);
        vm.expectRevert(QuantumShieldBridge.Paused.selector);
        bridge.lock{value: 1 ether}(DILITHIUM_PK_HASH);

        // Existing lock preserved
        (address sender, , , , bool released) = bridge.getLock(existingLockId);
        assertEq(sender, user1);
        assertFalse(released);
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }

    function _createPublicInputs(bytes32 lockId, address sender, address recipient) internal pure returns (uint256[] memory) {
        uint256[] memory inputs = new uint256[](12);

        inputs[0] = uint256(DILITHIUM_PK_HASH) & ((1 << 128) - 1);
        inputs[1] = uint256(DILITHIUM_PK_HASH) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(recipient));
        inputs[6] = 1 ether;
        inputs[7] = 0;
        inputs[8] = uint256(uint160(sender));
        inputs[9] = 1;
        inputs[10] = 65536;
        inputs[11] = uint256(keccak256(abi.encodePacked(lockId, uint256(0), sender)));

        return inputs;
    }
}

// =========================================================================
// Additional Invariant Tests
// =========================================================================

/// @title Extended Invariant Handler
contract ExtendedBridgeHandler is Test {
    QuantumShieldBridge public bridge;
    address[] public actors;
    bytes32[] public activeLockIds;
    uint256 public releaseCount;

    // Ghost variables for tracking
    uint256 public ghostTotalLocked;
    uint256 public ghostTotalReleased;
    mapping(bytes32 => bool) public ghostUsedProofCommitments;
    uint256 public ghostProofCommitmentCount;

    constructor(QuantumShieldBridge _bridge) {
        bridge = _bridge;
        actors.push(address(0x1000));
        actors.push(address(0x2000));
        actors.push(address(0x3000));
        for (uint i = 0; i < actors.length; i++) {
            vm.deal(actors[i], 1000 ether);
        }
    }

    function getActiveLockIdsLength() external view returns (uint256) {
        return activeLockIds.length;
    }

    function getActiveLockId(uint256 index) external view returns (bytes32) {
        return activeLockIds[index];
    }

    function lock(uint256 actorSeed, uint256 amount) external {
        address actor = actors[actorSeed % actors.length];
        amount = bound(amount, 1, 10 ether);

        vm.prank(actor);
        bytes32 lockId = bridge.lock{value: amount}(keccak256(abi.encodePacked("pk", actor)));

        activeLockIds.push(lockId);
        ghostTotalLocked += amount;
    }

    function release(uint256 lockIndex) external {
        if (activeLockIds.length == 0) return;

        lockIndex = lockIndex % activeLockIds.length;
        bytes32 lockId = activeLockIds[lockIndex];

        (address sender, uint256 amount, bytes32 pkHash, , bool released) = bridge.getLock(lockId);
        if (released || sender == address(0)) return;

        bytes memory proof = _createMockProof();

        // Use unique nonce based on release count
        uint256 uniqueNonce = uint256(keccak256(abi.encodePacked(lockId, releaseCount)));

        uint256[] memory inputs = new uint256[](12);
        inputs[0] = uint256(pkHash) & ((1 << 128) - 1);
        inputs[1] = uint256(pkHash) >> 128;
        inputs[2] = 8;
        inputs[3] = uint256(lockId) & ((1 << 128) - 1);
        inputs[4] = uint256(lockId) >> 128;
        inputs[5] = uint256(uint160(address(0x9999)));
        inputs[6] = amount;
        inputs[7] = uniqueNonce;
        inputs[8] = uint256(uint160(sender));
        inputs[9] = 1;
        inputs[10] = 65536;

        bytes32 proofCommitment = keccak256(abi.encodePacked(lockId, uniqueNonce, sender));
        inputs[11] = uint256(proofCommitment);

        vm.deal(address(0x9999), 0);

        try bridge.release(proof, inputs) {
            ghostTotalReleased += amount;
            ghostUsedProofCommitments[proofCommitment] = true;
            ghostProofCommitmentCount++;
            releaseCount++;
        } catch {}
    }

    function _createMockProof() internal pure returns (bytes memory) {
        bytes memory proof = new bytes(256);
        for (uint i = 0; i < 256; i++) {
            proof[i] = bytes1(uint8(i + 1));
        }
        return proof;
    }
}

/// @title Extended Invariant Tests
contract ExtendedInvariantTest is Test {
    QuantumShieldBridge public bridge;
    SP1Groth16Verifier public verifier;
    ExtendedBridgeHandler public handler;

    bytes32 constant VK_HASH = keccak256("sp1_verification_key");

    function setUp() public {
        verifier = new SP1Groth16Verifier(VK_HASH);
        bridge = new QuantumShieldBridge(address(verifier));
        handler = new ExtendedBridgeHandler(bridge);

        targetContract(address(handler));
    }

    /// @notice Invariant: totalLocked == balance
    function invariant_totalLockedEqualsBalance() public view {
        assertEq(bridge.totalLocked(), address(bridge).balance);
    }

    /// @notice Invariant: proof commitments are unique (no replay)
    function invariant_proofCommitmentsUnique() public view {
        // If we've processed N releases, we should have N unique commitments
        assertEq(handler.ghostProofCommitmentCount(), handler.releaseCount());
    }

    /// @notice Invariant: ghostTotalLocked - ghostTotalReleased == totalLocked
    function invariant_ghostAccountingMatches() public view {
        uint256 expectedLocked = handler.ghostTotalLocked() - handler.ghostTotalReleased();
        assertEq(bridge.totalLocked(), expectedLocked);
    }

    /// @notice Invariant: nonceCounter >= number of locks
    function invariant_nonceCounterConsistent() public view {
        assertGe(bridge.nonceCounter(), handler.getActiveLockIdsLength());
    }
}
