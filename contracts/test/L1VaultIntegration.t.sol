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

    // Test accounts - using valid hex addresses
    address public admin = address(0xAD01);
    address public securityCouncil = address(0x5EC0);
    address public user1 = address(0x1111);
    address public user2 = address(0x2222);
    
    // Test prover addresses - using valid hex addresses
    address public prover1 = address(0x5001);
    address public prover2 = address(0x5002);
    address public prover3 = address(0x5003);
    address public prover4 = address(0x5004);
    address public prover5 = address(0x5005);

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

    function setUp() public {
        // Deploy contracts
        vm.startPrank(admin);
        
        sphincsVerifier = new SPHINCSVerifier();
        vault = new L1Vault(securityCouncil, address(sphincsVerifier));
        
        // Register provers with 32-byte public keys (need stake of 1 ETH)
        vm.deal(admin, 10 ether);
        bytes memory prover1PubKey = _generatePublicKey(1);
        bytes memory prover2PubKey = _generatePublicKey(2);
        bytes memory prover3PubKey = _generatePublicKey(3);
        bytes memory prover4PubKey = _generatePublicKey(4);
        bytes memory prover5PubKey = _generatePublicKey(5);
        
        vault.registerProver{value: 1 ether}(prover1, prover1PubKey);
        vault.registerProver{value: 1 ether}(prover2, prover2PubKey);
        vault.registerProver{value: 1 ether}(prover3, prover3PubKey);
        vault.registerProver{value: 1 ether}(prover4, prover4PubKey);
        vault.registerProver{value: 1 ether}(prover5, prover5PubKey);
        
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
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKey);
        
        // Verify lock was created
        assertTrue(lockId != bytes32(0));
        
        // Verify vault balance
        assertEq(address(vault).balance, amount + 5 ether); // +5 from prover stakes
    }

    function test_Lock_EmitsEvent() public {
        uint256 amount = 1 ether;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        bytes32 dilithiumPubKeyHash = keccak256(dilithiumPubKey);
        
        vm.prank(user1);
        
        // We can't predict the exact lockId, but we can verify the event structure
        vm.expectEmit(false, true, true, true);
        emit Locked(bytes32(0), user1, user2, amount, dilithiumPubKeyHash);
        
        vault.lock{value: amount}(user2, dilithiumPubKey);
    }

    function test_Lock_BelowMinimum() public {
        uint256 amount = MIN_LOCK_AMOUNT - 1;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.prank(user1);
        vm.expectRevert(); // Should revert due to minimum amount
        vault.lock{value: amount}(user2, dilithiumPubKey);
    }

    function test_Lock_MultipleLocks() public {
        bytes memory pubKey1 = _generateDilithiumPubKey(1);
        bytes memory pubKey2 = _generateDilithiumPubKey(2);
        
        vm.startPrank(user1);
        bytes32 lockId1 = vault.lock{value: 1 ether}(user2, pubKey1);
        bytes32 lockId2 = vault.lock{value: 2 ether}(user2, pubKey2);
        vm.stopPrank();
        
        // Lock IDs should be unique
        assertTrue(lockId1 != lockId2);
        
        // Total balance should be sum + prover stakes
        assertEq(address(vault).balance, 3 ether + 5 ether);
    }

    // =========================================================================
    // Emergency Unlock Tests
    // =========================================================================

    function test_EmergencyUnlock_Request() public {
        // Lock funds
        uint256 amount = 1 ether;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKey);
        
        // Calculate required bond: MAX(0.5 ETH, amount × 5%)
        uint256 minBond = 0.5 ether;
        uint256 percentBond = (amount * 5) / 100; // 5%
        uint256 requiredBond = minBond > percentBond ? minBond : percentBond;
        
        // Request emergency unlock with bond (only sender can request)
        vm.prank(user1);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user1);
        
        // Verify unlock request was created
        L1Vault.UnlockRequest memory request = vault.getUnlockRequest(lockId);
        assertTrue(request.isEmergency);
        assertEq(request.bond, requiredBond);
    }

    // =========================================================================
    // SPHINCS+ Verification Tests
    // =========================================================================

    function test_SPHINCSVerifier_Integration() public view {
        // Verify the verifier is properly linked
        assertEq(vault.getSPHINCSVerifier(), address(sphincsVerifier));
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
        bytes32 leaf = keccak256(abi.encodePacked(SparseMerkleTree.LEAF_DOMAIN(), bytes32(uint256(1))));
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
        address newProver = address(0x6001);
        bytes memory newPubKey = _generatePublicKey(6);
        
        vm.deal(admin, 2 ether);
        vm.prank(admin);
        vault.registerProver{value: 1 ether}(newProver, newPubKey);
        
        // Verify prover is registered
        L1Vault.Prover memory prover = vault.getProver(newProver);
        assertTrue(prover.isActive);
    }

    function test_ProverCount() public view {
        uint256 count = vault.getActiveProverCount();
        assertEq(count, 5);
    }

    // =========================================================================
    // Access Control Tests
    // =========================================================================

    function test_OnlyAdmin_RegisterProver() public {
        address newProver = address(0x7001);
        bytes memory newPubKey = _generatePublicKey(7);
        
        vm.deal(user1, 2 ether);
        vm.prank(user1);
        vm.expectRevert(); // Should revert - not admin
        vault.registerProver{value: 1 ether}(newProver, newPubKey);
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
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        uint256 gasBefore = gasleft();
        vm.prank(user1);
        vault.lock{value: 1 ether}(user2, dilithiumPubKey);
        uint256 gasAfter = gasleft();
        
        uint256 gasUsed = gasBefore - gasAfter;
        emit log_named_uint("Gas used for lock", gasUsed);
        
        // Lock should be reasonably efficient
        assertTrue(gasUsed < 200000);
    }

    // =========================================================================
    // Challenge Bond Calculation Tests
    // =========================================================================

    function test_ChallengeBond_MaxFunction() public view {
        // Test MAX(0.1 ETH, amount × 1%)
        
        // For 5 ETH: MAX(0.1, 0.05) = 0.1 ETH
        uint256 bond5ETH = vault.calculateChallengeBond(5 ether);
        assertEq(bond5ETH, 0.1 ether);
        
        // For 20 ETH: MAX(0.1, 0.2) = 0.2 ETH
        uint256 bond20ETH = vault.calculateChallengeBond(20 ether);
        assertEq(bond20ETH, 0.2 ether);
        
        // For 100 ETH: MAX(0.1, 1.0) = 1.0 ETH
        uint256 bond100ETH = vault.calculateChallengeBond(100 ether);
        assertEq(bond100ETH, 1 ether);
    }

    // =========================================================================
    // Slashing Distribution Tests
    // =========================================================================

    function test_SlashingDistribution_60_20_20() public view {
        (uint256 challenger, uint256 insurance, uint256 burn) = vault.getSlashingDistribution();
        
        assertEq(challenger, 60);
        assertEq(insurance, 20);
        assertEq(burn, 20);
        assertEq(challenger + insurance + burn, 100);
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

    function _generateDilithiumPubKey(uint256 seed) internal pure returns (bytes memory) {
        // Generate a mock Dilithium public key (1952 bytes for Level 3)
        bytes memory pubKey = new bytes(1952);
        for (uint i = 0; i < 1952; i++) {
            pubKey[i] = bytes1(uint8(keccak256(abi.encodePacked(seed, i))[0]));
        }
        return pubKey;
    }
}
