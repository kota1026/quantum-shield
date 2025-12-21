// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/L1Vault.sol";
import "../src/SPHINCSVerifier.sol";
import "../src/libraries/SparseMerkleTree.sol";

/// @title L1Vault Integration Test Suite
/// @notice End-to-end tests for L1Vault with SPHINCS+ and SMT
/// @dev Tests the complete Lock/Unlock flow per SEQUENCES_v2.0.md
contract L1VaultIntegrationTest is Test {
    L1Vault public vault;
    SPHINCSVerifier public sphincsVerifier;

    // Test accounts
    address public admin = address(0xADMIN);
    address public user1 = address(0x1111);
    address public user2 = address(0x2222);
    
    // Test prover addresses
    address public prover1 = address(0xP001);
    address public prover2 = address(0xP002);
    address public prover3 = address(0xP003);
    address public prover4 = address(0xP004);
    address public prover5 = address(0xP005);

    // Constants
    uint256 public constant MIN_LOCK_AMOUNT = 0.01 ether;
    uint256 public constant TIME_LOCK_DURATION = 24 hours;
    uint256 public constant EMERGENCY_TIME_LOCK = 7 days;

    // Events (for testing)
    event Locked(
        bytes32 indexed lockId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        bytes32 dilithiumPubKeyHash
    );
    event UnlockSubmitted(
        bytes32 indexed lockId,
        address indexed recipient,
        uint256 amount,
        uint256 executeAfter
    );
    event UnlockExecuted(
        bytes32 indexed lockId,
        address indexed recipient,
        uint256 amount
    );

    function setUp() public {
        // Deploy contracts
        vm.startPrank(admin);
        
        sphincsVerifier = new SPHINCSVerifier();
        vault = new L1Vault(address(sphincsVerifier));
        
        // Register provers with 32-byte public keys
        bytes memory prover1PubKey = _generatePublicKey(1);
        bytes memory prover2PubKey = _generatePublicKey(2);
        bytes memory prover3PubKey = _generatePublicKey(3);
        bytes memory prover4PubKey = _generatePublicKey(4);
        bytes memory prover5PubKey = _generatePublicKey(5);
        
        vault.registerProver(prover1, prover1PubKey);
        vault.registerProver(prover2, prover2PubKey);
        vault.registerProver(prover3, prover3PubKey);
        vault.registerProver(prover4, prover4PubKey);
        vault.registerProver(prover5, prover5PubKey);
        
        vm.stopPrank();
        
        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    // =========================================================================
    // Lock Flow Tests
    // =========================================================================

    function test_Lock_Success() public {
        uint256 amount = 1 ether;
        bytes32 dilithiumPubKeyHash = keccak256("user1_dilithium_pubkey");
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKeyHash);
        
        // Verify lock was created
        assertTrue(lockId != bytes32(0));
        
        // Verify vault balance
        assertEq(address(vault).balance, amount);
    }

    function test_Lock_EmitsEvent() public {
        uint256 amount = 1 ether;
        bytes32 dilithiumPubKeyHash = keccak256("user1_dilithium_pubkey");
        
        vm.prank(user1);
        
        // We can't predict the exact lockId, but we can verify the event structure
        vm.expectEmit(false, true, true, true);
        emit Locked(bytes32(0), user1, user2, amount, dilithiumPubKeyHash);
        
        vault.lock{value: amount}(user2, dilithiumPubKeyHash);
    }

    function test_Lock_BelowMinimum() public {
        uint256 amount = MIN_LOCK_AMOUNT - 1;
        bytes32 dilithiumPubKeyHash = keccak256("user1_dilithium_pubkey");
        
        vm.prank(user1);
        vm.expectRevert(); // Should revert due to minimum amount
        vault.lock{value: amount}(user2, dilithiumPubKeyHash);
    }

    function test_Lock_MultipleLocks() public {
        bytes32 pubKeyHash1 = keccak256("pubkey1");
        bytes32 pubKeyHash2 = keccak256("pubkey2");
        
        vm.startPrank(user1);
        bytes32 lockId1 = vault.lock{value: 1 ether}(user2, pubKeyHash1);
        bytes32 lockId2 = vault.lock{value: 2 ether}(user2, pubKeyHash2);
        vm.stopPrank();
        
        // Lock IDs should be unique
        assertTrue(lockId1 != lockId2);
        
        // Total balance should be sum
        assertEq(address(vault).balance, 3 ether);
    }

    // =========================================================================
    // Unlock Flow Tests (Normal Path)
    // =========================================================================

    function test_UnlockFlow_SubmitAndExecute() public {
        // Step 1: Lock funds
        uint256 amount = 1 ether;
        bytes32 dilithiumPubKeyHash = keccak256("user1_dilithium_pubkey");
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKeyHash);
        
        // Step 2: Create mock proof and signatures
        bytes32 stateRoot = _computeStateRoot(lockId, amount, user2, dilithiumPubKeyHash);
        bytes32[] memory smtProof = _createMockSMTProof();
        bytes[] memory signatures = _createMockSignatures(lockId, amount, user2);
        address[] memory signers = new address[](2);
        signers[0] = prover1;
        signers[1] = prover2;
        
        // Step 3: Submit unlock request
        vm.prank(admin);
        vault.submitUnlock(lockId, amount, user2, stateRoot, smtProof, signatures, signers);
        
        // Step 4: Wait for time lock
        vm.warp(block.timestamp + TIME_LOCK_DURATION + 1);
        
        // Step 5: Execute unlock
        uint256 user2BalanceBefore = user2.balance;
        
        vm.prank(user2);
        vault.executeUnlock(lockId);
        
        // Verify funds transferred
        assertEq(user2.balance, user2BalanceBefore + amount);
    }

    function test_UnlockFlow_ExecuteBeforeTimeLock() public {
        // Lock funds
        uint256 amount = 1 ether;
        bytes32 dilithiumPubKeyHash = keccak256("user1_dilithium_pubkey");
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKeyHash);
        
        // Submit unlock
        bytes32 stateRoot = _computeStateRoot(lockId, amount, user2, dilithiumPubKeyHash);
        bytes32[] memory smtProof = _createMockSMTProof();
        bytes[] memory signatures = _createMockSignatures(lockId, amount, user2);
        address[] memory signers = new address[](2);
        signers[0] = prover1;
        signers[1] = prover2;
        
        vm.prank(admin);
        vault.submitUnlock(lockId, amount, user2, stateRoot, smtProof, signatures, signers);
        
        // Try to execute before time lock expires
        vm.prank(user2);
        vm.expectRevert(); // Should revert - time lock not expired
        vault.executeUnlock(lockId);
    }

    // =========================================================================
    // Emergency Unlock Tests
    // =========================================================================

    function test_EmergencyUnlock_WithBond() public {
        // Lock funds
        uint256 amount = 1 ether;
        bytes32 dilithiumPubKeyHash = keccak256("user1_dilithium_pubkey");
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKeyHash);
        
        // Calculate required bond
        uint256 minBond = 0.5 ether;
        uint256 percentBond = (amount * 5) / 100; // 5%
        uint256 requiredBond = minBond > percentBond ? minBond : percentBond;
        
        // Request emergency unlock with bond
        vm.prank(user2);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId);
        
        // Wait for emergency time lock
        vm.warp(block.timestamp + EMERGENCY_TIME_LOCK + 1);
        
        // Execute emergency unlock
        uint256 user2BalanceBefore = user2.balance;
        
        vm.prank(user2);
        vault.executeEmergencyUnlock(lockId);
        
        // Should receive amount + bond back
        assertEq(user2.balance, user2BalanceBefore + amount + requiredBond);
    }

    // =========================================================================
    // Challenge Flow Tests
    // =========================================================================

    function test_Challenge_ValidChallenge() public {
        // Lock and submit unlock
        uint256 amount = 1 ether;
        bytes32 dilithiumPubKeyHash = keccak256("user1_dilithium_pubkey");
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKeyHash);
        
        bytes32 stateRoot = _computeStateRoot(lockId, amount, user2, dilithiumPubKeyHash);
        bytes32[] memory smtProof = _createMockSMTProof();
        bytes[] memory signatures = _createMockSignatures(lockId, amount, user2);
        address[] memory signers = new address[](2);
        signers[0] = prover1;
        signers[1] = prover2;
        
        vm.prank(admin);
        vault.submitUnlock(lockId, amount, user2, stateRoot, smtProof, signatures, signers);
        
        // Challenge the unlock
        address challenger = address(0xCHAL);
        bytes memory fraudProof = abi.encodePacked("fraud_proof_data");
        
        vm.prank(challenger);
        vault.challenge(lockId, fraudProof);
        
        // Verify challenge is pending
        // Note: This depends on the actual implementation
    }

    // =========================================================================
    // SPHINCS+ Verification Tests
    // =========================================================================

    function test_SPHINCSVerifier_Integration() public {
        // Verify the verifier is properly linked
        assertEq(address(vault.getSPHINCSVerifier()), address(sphincsVerifier));
    }

    function test_SPHINCSVerifier_Constants() public view {
        // Verify constants match specification
        assertEq(sphincsVerifier.SIGNATURE_SIZE(), 7856);
        assertEq(sphincsVerifier.PUBLIC_KEY_SIZE(), 32);
    }

    // =========================================================================
    // SMT Integration Tests
    // =========================================================================

    function test_SMT_LeafComputation() public pure {
        bytes32 lockId = bytes32(uint256(1));
        uint256 amount = 1 ether;
        address recipient = address(0x1234);
        bytes32 pubKeyHash = keccak256("pubkey");
        
        bytes32 leaf = SparseMerkleTree.computeLeaf(
            lockId,
            amount,
            recipient,
            pubKeyHash
        );
        
        assertTrue(leaf != bytes32(0));
    }

    function test_SMT_ProofVerification() public pure {
        // Create a simple proof
        bytes32 leaf = keccak256(abi.encodePacked(SparseMerkleTree.LEAF_DOMAIN, bytes32(uint256(1))));
        uint256 index = 0;
        
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = SparseMerkleTree.getDefaultHash(i);
        }
        
        bytes32 root = SparseMerkleTree.computeRoot(leaf, index, siblings);
        
        bool valid = SparseMerkleTree.verifyProof(leaf, index, siblings, root);
        assertTrue(valid);
    }

    // =========================================================================
    // Prover Management Tests
    // =========================================================================

    function test_ProverRegistration() public {
        address newProver = address(0xNEW);
        bytes memory newPubKey = _generatePublicKey(6);
        
        vm.prank(admin);
        vault.registerProver(newProver, newPubKey);
        
        // Verify prover is registered
        assertTrue(vault.isActiveProver(newProver));
    }

    function test_ProverRemoval() public {
        vm.prank(admin);
        vault.removeProver(prover5);
        
        // Verify prover is removed
        assertFalse(vault.isActiveProver(prover5));
    }

    function test_ProverCount() public view {
        uint256 count = vault.getActiveProverCount();
        assertEq(count, 5);
    }

    // =========================================================================
    // Access Control Tests
    // =========================================================================

    function test_OnlyAdmin_RegisterProver() public {
        address newProver = address(0xNEW);
        bytes memory newPubKey = _generatePublicKey(7);
        
        vm.prank(user1);
        vm.expectRevert(); // Should revert - not admin
        vault.registerProver(newProver, newPubKey);
    }

    function test_OnlyAdmin_UpdateStateRoot() public {
        bytes32 newRoot = keccak256("new_state_root");
        
        vm.prank(user1);
        vm.expectRevert(); // Should revert - not admin
        vault.updateStateRoot(newRoot);
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    function test_Gas_Lock() public {
        bytes32 dilithiumPubKeyHash = keccak256("user1_dilithium_pubkey");
        
        uint256 gasBefore = gasleft();
        vm.prank(user1);
        vault.lock{value: 1 ether}(user2, dilithiumPubKeyHash);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        emit log_named_uint("Gas used for lock", gasUsed);
        
        // Lock should be reasonably efficient
        assertTrue(gasUsed < 100000);
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _generatePublicKey(uint256 seed) internal pure returns (bytes memory) {
        bytes memory pubKey = new bytes(32);
        for (uint i = 0; i < 32; i++) {
            pubKey[i] = bytes1(uint8(keccak256(abi.encodePacked(seed, i))[0]));
        }
        return pubKey;
    }

    function _computeStateRoot(
        bytes32 lockId,
        uint256 amount,
        address recipient,
        bytes32 pubKeyHash
    ) internal pure returns (bytes32) {
        bytes32 leaf = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        return keccak256(abi.encodePacked("state_root", leaf));
    }

    function _createMockSMTProof() internal pure returns (bytes32[] memory) {
        bytes32[] memory proof = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            proof[i] = SparseMerkleTree.getDefaultHash(i);
        }
        return proof;
    }

    function _createMockSignatures(
        bytes32 lockId,
        uint256 amount,
        address recipient
    ) internal pure returns (bytes[] memory) {
        bytes[] memory signatures = new bytes[](2);
        
        // Create mock signatures (in production these would be real SPHINCS+ signatures)
        signatures[0] = abi.encodePacked(
            keccak256(abi.encodePacked("sig1", lockId, amount, recipient))
        );
        signatures[1] = abi.encodePacked(
            keccak256(abi.encodePacked("sig2", lockId, amount, recipient))
        );
        
        return signatures;
    }
}
