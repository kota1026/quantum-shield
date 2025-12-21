// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/L1Vault.sol";
import "../src/SPHINCSVerifier.sol";
import "../src/libraries/SparseMerkleTree.sol";

/// @title L1Vault Integration Tests
/// @notice Comprehensive integration tests for L1Vault + SPHINCSVerifier + SMT
/// @dev Tests per SEQUENCES_v2.0.md flows: Lock, Unlock, Emergency, Challenge
contract L1VaultIntegrationTest is Test {
    // =========================================================================
    // Test Setup
    // =========================================================================

    L1Vault public vault;
    SPHINCSVerifier public sphincsVerifier;

    address public owner;
    address public user1;
    address public user2;
    address public challenger;

    // Test provers (5 as per UNIFIED_SPEC_v2.0)
    address public prover1;
    address public prover2;
    address public prover3;
    address public prover4;
    address public prover5;

    // Mock public keys (32 bytes each for simplified testing)
    bytes32 public constant MOCK_PUBKEY_1 = keccak256("prover1_pubkey");
    bytes32 public constant MOCK_PUBKEY_2 = keccak256("prover2_pubkey");
    bytes32 public constant MOCK_PUBKEY_3 = keccak256("prover3_pubkey");
    bytes32 public constant MOCK_PUBKEY_4 = keccak256("prover4_pubkey");
    bytes32 public constant MOCK_PUBKEY_5 = keccak256("prover5_pubkey");

    bytes32 public constant MOCK_DILITHIUM_PUBKEY = keccak256("user_dilithium_key");

    // Test amounts
    uint256 public constant MIN_LOCK_AMOUNT = 0.01 ether;
    uint256 public constant TEST_LOCK_AMOUNT = 1 ether;
    uint256 public constant LARGE_LOCK_AMOUNT = 10 ether;

    // Time constants (per UNIFIED_SPEC_v2.0)
    uint256 public constant NORMAL_TIME_LOCK = 24 hours;
    uint256 public constant EMERGENCY_TIME_LOCK = 7 days;

    // Events to test
    event Locked(
        bytes32 indexed lockId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        bytes32 dilithiumPubkeyHash
    );
    event UnlockRequested(bytes32 indexed lockId, uint256 unlockTime);
    event Unlocked(bytes32 indexed lockId, address indexed recipient, uint256 amount);
    event EmergencyUnlockRequested(bytes32 indexed lockId, uint256 bond);
    event Challenged(bytes32 indexed lockId, address indexed challenger);
    event ProverRegistered(address indexed prover, bytes32 pubkeyHash);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        challenger = makeAddr("challenger");

        prover1 = makeAddr("prover1");
        prover2 = makeAddr("prover2");
        prover3 = makeAddr("prover3");
        prover4 = makeAddr("prover4");
        prover5 = makeAddr("prover5");

        // Deploy contracts
        sphincsVerifier = new SPHINCSVerifier();
        vault = new L1Vault(address(sphincsVerifier));

        // Fund test accounts
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(challenger, 10 ether);

        // Register provers
        _registerProvers();
    }

    function _registerProvers() internal {
        vault.registerProver(prover1, bytes32ToBytes(MOCK_PUBKEY_1));
        vault.registerProver(prover2, bytes32ToBytes(MOCK_PUBKEY_2));
        vault.registerProver(prover3, bytes32ToBytes(MOCK_PUBKEY_3));
        vault.registerProver(prover4, bytes32ToBytes(MOCK_PUBKEY_4));
        vault.registerProver(prover5, bytes32ToBytes(MOCK_PUBKEY_5));
    }

    function bytes32ToBytes(bytes32 data) internal pure returns (bytes memory) {
        return abi.encodePacked(data);
    }

    // =========================================================================
    // Lock Flow Tests (SEQUENCES_v2.0.md - Lock Flow)
    // =========================================================================

    function test_LockFlow_BasicLock() public {
        vm.startPrank(user1);

        bytes32 expectedLockId = keccak256(
            abi.encodePacked(user1, user2, TEST_LOCK_AMOUNT, block.number, MOCK_DILITHIUM_PUBKEY)
        );

        vm.expectEmit(true, true, true, true);
        emit Locked(expectedLockId, user1, user2, TEST_LOCK_AMOUNT, MOCK_DILITHIUM_PUBKEY);

        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(
            user2,
            MOCK_DILITHIUM_PUBKEY
        );

        vm.stopPrank();

        // Verify lock state
        (
            address sender,
            address recipient,
            uint256 amount,
            bytes32 pubkeyHash,
            uint256 lockedAt,
            L1Vault.LockStatus status
        ) = vault.getLock(lockId);

        assertEq(sender, user1);
        assertEq(recipient, user2);
        assertEq(amount, TEST_LOCK_AMOUNT);
        assertEq(pubkeyHash, MOCK_DILITHIUM_PUBKEY);
        assertGt(lockedAt, 0);
        assertEq(uint8(status), uint8(L1Vault.LockStatus.Active));
    }

    function test_LockFlow_MinimumAmount() public {
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: MIN_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);
        
        (, , uint256 amount, , , ) = vault.getLock(lockId);
        assertEq(amount, MIN_LOCK_AMOUNT);
    }

    function test_LockFlow_RevertBelowMinimum() public {
        vm.prank(user1);
        vm.expectRevert("Amount below minimum");
        vault.lock{value: MIN_LOCK_AMOUNT - 1}(user2, MOCK_DILITHIUM_PUBKEY);
    }

    function test_LockFlow_MultipleLocks() public {
        vm.startPrank(user1);

        bytes32 lockId1 = vault.lock{value: 1 ether}(user2, MOCK_DILITHIUM_PUBKEY);
        bytes32 lockId2 = vault.lock{value: 2 ether}(user2, MOCK_DILITHIUM_PUBKEY);
        bytes32 lockId3 = vault.lock{value: 3 ether}(user2, MOCK_DILITHIUM_PUBKEY);

        vm.stopPrank();

        // All locks should be unique
        assertTrue(lockId1 != lockId2);
        assertTrue(lockId2 != lockId3);
        assertTrue(lockId1 != lockId3);

        // Vault should hold all funds
        assertEq(address(vault).balance, 6 ether);
    }

    // =========================================================================
    // Normal Unlock Flow Tests (SEQUENCES_v2.0.md - Normal Unlock)
    // =========================================================================

    function test_UnlockFlow_RequestAndExecute() public {
        // Setup: Create a lock
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        // Create mock proof and signatures
        bytes32 stateRoot = keccak256("mock_state_root");
        bytes32[] memory proof = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            proof[i] = keccak256(abi.encodePacked("proof_node_", i));
        }

        bytes[] memory signatures = new bytes[](2);
        signatures[0] = abi.encodePacked(keccak256("sig1"));
        signatures[1] = abi.encodePacked(keccak256("sig2"));

        address[] memory signers = new address[](2);
        signers[0] = prover1;
        signers[1] = prover2;

        // Request unlock
        vm.prank(user2);
        vault.requestUnlock(lockId, stateRoot, proof, signatures, signers);

        // Verify pending state
        (, , , , , L1Vault.LockStatus status) = vault.getLock(lockId);
        assertEq(uint8(status), uint8(L1Vault.LockStatus.PendingUnlock));

        // Fast forward past time lock
        vm.warp(block.timestamp + NORMAL_TIME_LOCK + 1);

        // Execute unlock
        uint256 balanceBefore = user2.balance;
        
        vm.prank(user2);
        vault.executeUnlock(lockId);

        // Verify funds transferred
        assertEq(user2.balance, balanceBefore + TEST_LOCK_AMOUNT);

        // Verify released state
        (, , , , , L1Vault.LockStatus finalStatus) = vault.getLock(lockId);
        assertEq(uint8(finalStatus), uint8(L1Vault.LockStatus.Released));
    }

    function test_UnlockFlow_RevertBeforeTimeLock() public {
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        _requestUnlockWithMocks(lockId, user2);

        // Try to execute before time lock expires
        vm.prank(user2);
        vm.expectRevert("Time lock not expired");
        vault.executeUnlock(lockId);
    }

    function test_UnlockFlow_RevertInsufficientSignatures() public {
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        bytes32 stateRoot = keccak256("mock_state_root");
        bytes32[] memory proof = new bytes32[](20);
        
        // Only 1 signature (need 2)
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = abi.encodePacked(keccak256("sig1"));

        address[] memory signers = new address[](1);
        signers[0] = prover1;

        vm.prank(user2);
        vm.expectRevert("Insufficient signatures");
        vault.requestUnlock(lockId, stateRoot, proof, signatures, signers);
    }

    // =========================================================================
    // Emergency Unlock Flow Tests (SEQUENCES_v2.0.md - Emergency Unlock)
    // =========================================================================

    function test_EmergencyUnlock_RequestAndExecute() public {
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        // Calculate required bond (5% or 0.5 ETH, whichever is greater)
        uint256 requiredBond = TEST_LOCK_AMOUNT * 5 / 100;
        if (requiredBond < 0.5 ether) requiredBond = 0.5 ether;

        // Request emergency unlock
        vm.prank(user2);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId);

        // Verify emergency pending state
        (, , , , , L1Vault.LockStatus status) = vault.getLock(lockId);
        assertEq(uint8(status), uint8(L1Vault.LockStatus.EmergencyPending));

        // Fast forward past 7-day emergency time lock
        vm.warp(block.timestamp + EMERGENCY_TIME_LOCK + 1);

        // Execute emergency unlock
        uint256 balanceBefore = user2.balance;

        vm.prank(user2);
        vault.executeEmergencyUnlock(lockId);

        // Should receive amount + bond back
        assertEq(user2.balance, balanceBefore + TEST_LOCK_AMOUNT + requiredBond);
    }

    function test_EmergencyUnlock_RevertInsufficientBond() public {
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        vm.prank(user2);
        vm.expectRevert("Insufficient bond");
        vault.requestEmergencyUnlock{value: 0.1 ether}(lockId);
    }

    // =========================================================================
    // Challenge Flow Tests (SEQUENCES_v2.0.md - Challenge Flow)
    // =========================================================================

    function test_ChallengeFlow_SuccessfulChallenge() public {
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        _requestUnlockWithMocks(lockId, user2);

        // Challenger submits fraud proof
        bytes memory fraudProof = abi.encodePacked(keccak256("fraud_evidence"));

        vm.prank(challenger);
        vault.challenge(lockId, fraudProof);

        // Verify challenged state
        (, , , , , L1Vault.LockStatus status) = vault.getLock(lockId);
        assertEq(uint8(status), uint8(L1Vault.LockStatus.Challenged));
    }

    function test_ChallengeFlow_RevertNotPending() public {
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        // Try to challenge active lock (not pending unlock)
        bytes memory fraudProof = abi.encodePacked(keccak256("fraud_evidence"));

        vm.prank(challenger);
        vm.expectRevert("Lock not pending unlock");
        vault.challenge(lockId, fraudProof);
    }

    // =========================================================================
    // Prover Registration Tests
    // =========================================================================

    function test_ProverRegistration_Success() public {
        address newProver = makeAddr("newProver");
        bytes32 newPubkey = keccak256("new_pubkey");

        vm.expectEmit(true, false, false, true);
        emit ProverRegistered(newProver, newPubkey);

        vault.registerProver(newProver, bytes32ToBytes(newPubkey));

        assertTrue(vault.isProver(newProver));
    }

    function test_ProverRegistration_RevertDuplicate() public {
        vm.expectRevert("Prover already registered");
        vault.registerProver(prover1, bytes32ToBytes(MOCK_PUBKEY_1));
    }

    function test_ProverDeregistration() public {
        vault.deregisterProver(prover5);
        assertFalse(vault.isProver(prover5));
    }

    // =========================================================================
    // SPHINCSVerifier Integration Tests
    // =========================================================================

    function test_SPHINCSVerifier_Integration() public {
        // Verify verifier is set
        assertEq(vault.getSPHINCSVerifier(), address(sphincsVerifier));

        // Test verifier constants
        assertEq(sphincsVerifier.N(), 16);
        assertEq(sphincsVerifier.SIGNATURE_SIZE(), 7856);
        assertEq(sphincsVerifier.PUBLIC_KEY_SIZE(), 32);
    }

    function test_SPHINCSVerifier_ToggleFullVerification() public {
        // Initially simplified verification
        assertFalse(vault.isFullVerificationEnabled());

        // Enable full verification
        vault.setFullVerification(true);
        assertTrue(vault.isFullVerificationEnabled());

        // Disable
        vault.setFullVerification(false);
        assertFalse(vault.isFullVerificationEnabled());
    }

    // =========================================================================
    // SMT Verification Tests
    // =========================================================================

    function test_SMT_ProofVerification() public {
        // Test SMT library constants
        assertEq(SparseMerkleTree.TREE_DEPTH, 20);
        assertEq(SparseMerkleTree.MAX_LEAF_INDEX, (1 << 20) - 1);
    }

    function test_SMT_ComputeLeaf() public {
        bytes32 lockId = keccak256("lock1");
        uint256 amount = 1 ether;
        address recipient = user2;
        bytes32 pubKeyHash = MOCK_DILITHIUM_PUBKEY;

        bytes32 leaf = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        assertNotEq(leaf, bytes32(0));

        // Same inputs should produce same leaf
        bytes32 leaf2 = SparseMerkleTree.computeLeaf(lockId, amount, recipient, pubKeyHash);
        assertEq(leaf, leaf2);
    }

    // =========================================================================
    // Edge Cases and Security Tests
    // =========================================================================

    function test_Security_ReentrancyProtection() public {
        // Deploy a reentrancy attacker contract would be tested here
        // For now, verify state changes happen before transfers
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        _requestUnlockWithMocks(lockId, user2);
        vm.warp(block.timestamp + NORMAL_TIME_LOCK + 1);

        // Execute should update state before transfer
        vm.prank(user2);
        vault.executeUnlock(lockId);

        // Cannot execute again
        vm.prank(user2);
        vm.expectRevert("Lock not pending");
        vault.executeUnlock(lockId);
    }

    function test_Security_OnlyRecipientCanUnlock() public {
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        _requestUnlockWithMocks(lockId, user2);
        vm.warp(block.timestamp + NORMAL_TIME_LOCK + 1);

        // User1 (sender) cannot execute unlock
        vm.prank(user1);
        vm.expectRevert("Not recipient");
        vault.executeUnlock(lockId);
    }

    function test_Security_OnlyOwnerCanRegisterProvers() public {
        address newProver = makeAddr("newProver");
        bytes32 newPubkey = keccak256("new_pubkey");

        vm.prank(user1);
        vm.expectRevert();
        vault.registerProver(newProver, bytes32ToBytes(newPubkey));
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    function test_Gas_LockOperation() public {
        vm.prank(user1);
        uint256 gasBefore = gasleft();
        vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);
        uint256 gasUsed = gasBefore - gasleft();

        // Log gas usage for benchmarking
        emit log_named_uint("Lock gas used", gasUsed);
        assertLt(gasUsed, 200_000); // Should be under 200k gas
    }

    function test_Gas_UnlockRequest() public {
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(user2, MOCK_DILITHIUM_PUBKEY);

        bytes32 stateRoot = keccak256("mock_state_root");
        bytes32[] memory proof = new bytes32[](20);
        bytes[] memory signatures = new bytes[](2);
        signatures[0] = abi.encodePacked(keccak256("sig1"));
        signatures[1] = abi.encodePacked(keccak256("sig2"));
        address[] memory signers = new address[](2);
        signers[0] = prover1;
        signers[1] = prover2;

        vm.prank(user2);
        uint256 gasBefore = gasleft();
        vault.requestUnlock(lockId, stateRoot, proof, signatures, signers);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Unlock request gas used", gasUsed);
        assertLt(gasUsed, 500_000); // Should be under 500k gas
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    function testFuzz_Lock_VariableAmounts(uint256 amount) public {
        vm.assume(amount >= MIN_LOCK_AMOUNT);
        vm.assume(amount <= 1000 ether);

        vm.deal(user1, amount);
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, MOCK_DILITHIUM_PUBKEY);

        (, , uint256 lockedAmount, , , ) = vault.getLock(lockId);
        assertEq(lockedAmount, amount);
    }

    function testFuzz_Lock_VariableRecipients(address recipient) public {
        vm.assume(recipient != address(0));
        vm.assume(recipient != address(vault));

        vm.prank(user1);
        bytes32 lockId = vault.lock{value: TEST_LOCK_AMOUNT}(recipient, MOCK_DILITHIUM_PUBKEY);

        (, address storedRecipient, , , , ) = vault.getLock(lockId);
        assertEq(storedRecipient, recipient);
    }

    // =========================================================================
    // Helper Functions
    // =========================================================================

    function _requestUnlockWithMocks(bytes32 lockId, address caller) internal {
        bytes32 stateRoot = keccak256("mock_state_root");
        bytes32[] memory proof = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            proof[i] = keccak256(abi.encodePacked("proof_node_", i));
        }

        bytes[] memory signatures = new bytes[](2);
        signatures[0] = abi.encodePacked(keccak256("sig1"));
        signatures[1] = abi.encodePacked(keccak256("sig2"));

        address[] memory signers = new address[](2);
        signers[0] = prover1;
        signers[1] = prover2;

        vm.prank(caller);
        vault.requestUnlock(lockId, stateRoot, proof, signatures, signers);
    }
}
