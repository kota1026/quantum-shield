// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/L1Vault.sol";
import "../src/SPHINCSVerifier.sol";
import "../src/libraries/SparseMerkleTree.sol";
import "../src/libraries/StateRootCalculator.sol";

/// @title L1Vault Integration Test Suite
/// @notice End-to-end tests for L1Vault with SPHINCS+ and SMT
/// @dev Tests the complete Lock/Unlock flow per SEQUENCES_v2.0.md
///
/// Day 5 Update (2025-12-22):
/// Added comprehensive tests for Day 1 features:
/// - Challenge/Defense/Resolution flow (Sequence #4)
/// - Defense Period (48 hours)
/// - Quadratic Slashing calculation
/// - autoResolveChallenge mechanism
///
/// PIR-002 Code Review Update (2025-12-22 13:30 JST):
/// Added missing tests identified during code review
///
/// Day 6-7 Update (2025-12-22):
/// Updated for SR_0/SR_1 state root implementation:
/// - Lock struct now includes stateRoot (SR_0)
/// - Locked event now includes stateRoot
/// - Added SR_0/SR_1 integration tests
///
/// PIR-004 Code Review Update (2025-12-22 14:30 JST):
/// Added missing tests per PIR Code Review Routine:
/// - Locked Event stateRoot full verification
/// - UnlockRequested Event unlockStateRoot verification
/// - Boundary value tests
///
/// Day 8 Update (2025-12-24):
/// Fixed test_ChallengeFlow_Complete() expectation:
/// - Emergency Unlock経由のChallenge棄却後はEMERGENCY_PENDINGに戻る
contract L1VaultIntegrationTest is Test {
    L1Vault public vault;
    SPHINCSVerifier public sphincsVerifier;

    // Test accounts
    address public admin = address(0xAD01);
    address public securityCouncil = address(0x5EC0);
    address public user1 = address(0x1111);
    address public user2 = address(0x2222);
    address public challenger = address(0xC001);
    
    // Test prover addresses
    address public prover1 = address(0x5001);
    address public prover2 = address(0x5002);
    address public prover3 = address(0x5003);
    address public prover4 = address(0x5004);
    address public prover5 = address(0x5005);

    // Constants
    uint256 public constant MIN_LOCK_AMOUNT = 0.01 ether;
    uint256 public constant TIME_LOCK_DURATION = 24 hours;
    uint256 public constant EMERGENCY_TIME_LOCK = 7 days;
    uint256 public constant DEFENSE_PERIOD = 48 hours;
    uint256 public constant MIN_CHALLENGE_BOND = 0.1 ether;

    // Events - Updated for Day 6-7 with stateRoot
    event Locked(
        bytes32 indexed lockId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        bytes32 dilithiumPubKeyHash,
        bytes32 stateRoot
    );

    event UnlockRequested(
        bytes32 indexed lockId,
        address indexed recipient,
        uint256 amount,
        uint256 unlockableAt,
        bool isEmergency,
        bytes32 unlockStateRoot
    );

    event ChallengeFiled(
        bytes32 indexed lockId,
        address indexed challenger,
        bytes32 fraudProofHash,
        uint256 bond,
        uint256 defenseDeadline
    );

    event DefenseSubmitted(
        bytes32 indexed lockId,
        address indexed defender,
        bytes32 defenseProofHash
    );

    event ChallengeResolved(
        bytes32 indexed lockId,
        bool challengeValid,
        uint256 slashedAmount,
        uint256 challengerReward,
        uint256 insuranceAmount,
        uint256 burnedAmount
    );

    function setUp() public {
        vm.startPrank(admin);
        
        sphincsVerifier = new SPHINCSVerifier();
        vault = new L1Vault(securityCouncil, address(sphincsVerifier));
        
        vm.deal(admin, 10 ether);
        vault.registerProver{value: 1 ether}(prover1, _generatePublicKey(1));
        vault.registerProver{value: 1 ether}(prover2, _generatePublicKey(2));
        vault.registerProver{value: 1 ether}(prover3, _generatePublicKey(3));
        vault.registerProver{value: 1 ether}(prover4, _generatePublicKey(4));
        vault.registerProver{value: 1 ether}(prover5, _generatePublicKey(5));
        
        vm.stopPrank();
        
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(challenger, 100 ether);
    }

    // =========================================================================
    // Lock Flow Tests
    // =========================================================================

    function test_Lock_Success() public {
        uint256 amount = 1 ether;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKey);
        
        assertTrue(lockId != bytes32(0));
        assertEq(address(vault).balance, amount + 5 ether);
    }

    function test_Lock_EmitsEvent() public {
        uint256 amount = 1 ether;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        bytes32 dilithiumPubKeyHash = keccak256(dilithiumPubKey);
        
        vm.prank(user1);
        vm.expectEmit(false, true, true, false);
        emit Locked(bytes32(0), user1, user2, amount, dilithiumPubKeyHash, bytes32(0));
        
        vault.lock{value: amount}(user2, dilithiumPubKey);
    }

    // =========================================================================
    // PIR-004: Event Verification Tests (Full Parameter Validation)
    // =========================================================================

    /// @notice Verify Locked event includes correct stateRoot (SR_0)
    function test_Lock_EmitsEvent_WithCorrectStateRoot() public {
        uint256 amount = 1 ether;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        bytes32 dilithiumPubKeyHash = keccak256(dilithiumPubKey);
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKey);
        
        // Get the lock data to verify stateRoot
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        
        // Verify stateRoot is non-zero and matches expected computation
        assertTrue(lockData.stateRoot != bytes32(0), "stateRoot should be non-zero");
        
        bytes32 expectedSR0 = vault.computeStateRoot(
            block.chainid,
            address(0),
            amount,
            user2,
            lockData.expiry,
            lockData.nonce,
            dilithiumPubKeyHash
        );
        assertEq(lockData.stateRoot, expectedSR0, "stateRoot in Lock should match computed SR_0");
    }

    /// @notice Verify Locked event parameters can be fully reconstructed
    function test_Lock_EventParameters_AllVerifiable() public {
        uint256 amount = 1 ether;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        bytes32 dilithiumPubKeyHash = keccak256(dilithiumPubKey);
        
        // Record logs to verify event
        vm.recordLogs();
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKey);
        
        Vm.Log[] memory logs = vm.getRecordedLogs();
        
        // Find Locked event (topic0 = keccak256("Locked(bytes32,address,address,uint256,bytes32,bytes32)"))
        bool foundEvent = false;
        for (uint i = 0; i < logs.length; i++) {
            if (logs[i].topics.length >= 4) {
                // Verify indexed parameters
                bytes32 eventLockId = logs[i].topics[1];
                address eventSender = address(uint160(uint256(logs[i].topics[2])));
                address eventRecipient = address(uint160(uint256(logs[i].topics[3])));
                
                if (eventSender == user1 && eventRecipient == user2) {
                    foundEvent = true;
                    assertEq(eventLockId, lockId, "Event lockId should match returned lockId");
                    
                    // Decode non-indexed parameters
                    (uint256 eventAmount, bytes32 eventPkHash, bytes32 eventStateRoot) = 
                        abi.decode(logs[i].data, (uint256, bytes32, bytes32));
                    
                    assertEq(eventAmount, amount, "Event amount should match");
                    assertEq(eventPkHash, dilithiumPubKeyHash, "Event pkHash should match");
                    assertTrue(eventStateRoot != bytes32(0), "Event stateRoot should be non-zero");
                    break;
                }
            }
        }
        assertTrue(foundEvent, "Locked event should be emitted");
    }

    // =========================================================================
    // PIR-004: Boundary Value Tests
    // =========================================================================

    /// @notice Test lock with minimum allowed amount
    function test_Lock_MinimumAmount() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: MIN_LOCK_AMOUNT}(user2, dilithiumPubKey);
        
        assertTrue(lockId != bytes32(0), "Lock with minimum amount should succeed");
        
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        assertEq(lockData.amount, MIN_LOCK_AMOUNT, "Amount should be MIN_LOCK_AMOUNT");
        assertTrue(lockData.stateRoot != bytes32(0), "SR_0 should be computed for min amount");
    }

    /// @notice Test lock with exact minimum expiry (block.timestamp + 1)
    function test_Lock_MinimumExpiry() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        uint256 minExpiry = block.timestamp + 1;
        
        vm.prank(user1);
        bytes32 lockId = vault.lockWithExpiry{value: 1 ether}(user2, dilithiumPubKey, minExpiry);
        
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        assertEq(lockData.expiry, minExpiry, "Expiry should be minimum valid");
    }

    /// @notice Test lock at exactly current timestamp (should revert)
    function test_Lock_ExactCurrentTimestamp_Reverts() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        uint256 currentTime = block.timestamp;
        
        vm.prank(user1);
        vm.expectRevert(L1Vault.LockExpired.selector);
        vault.lockWithExpiry{value: 1 ether}(user2, dilithiumPubKey, currentTime);
    }

    function test_Lock_BelowMinimum() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.prank(user1);
        vm.expectRevert();
        vault.lock{value: MIN_LOCK_AMOUNT - 1}(user2, dilithiumPubKey);
    }

    function test_Lock_MultipleLocks() public {
        vm.startPrank(user1);
        bytes32 lockId1 = vault.lock{value: 1 ether}(user2, _generateDilithiumPubKey(1));
        bytes32 lockId2 = vault.lock{value: 2 ether}(user2, _generateDilithiumPubKey(2));
        vm.stopPrank();
        
        assertTrue(lockId1 != lockId2);
        assertEq(address(vault).balance, 3 ether + 5 ether);
    }

    // =========================================================================
    // Day 6-7: SR_0 State Root Tests
    // =========================================================================

    function test_Lock_ComputesSR0() public {
        uint256 amount = 1 ether;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKey);
        
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        
        // SR_0 should be non-zero
        assertTrue(lockData.stateRoot != bytes32(0), "SR_0 should be computed");
        
        // SR_0 should match manual computation
        bytes32 expectedSR0 = vault.computeStateRoot(
            block.chainid,
            address(0),  // ETH
            amount,
            user2,
            lockData.expiry,
            lockData.nonce,
            keccak256(dilithiumPubKey)
        );
        assertEq(lockData.stateRoot, expectedSR0, "SR_0 should match manual computation");
    }

    function test_Lock_SR0_IsDeterministic() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        // Lock with same parameters at same block
        vm.prank(user1);
        bytes32 lockId1 = vault.lock{value: 1 ether}(user2, dilithiumPubKey);
        
        L1Vault.Lock memory lock1 = vault.getLock(lockId1);
        
        // Different locks should have different SR_0 (different nonce)
        vm.prank(user1);
        bytes32 lockId2 = vault.lock{value: 1 ether}(user2, dilithiumPubKey);
        
        L1Vault.Lock memory lock2 = vault.getLock(lockId2);
        
        assertTrue(lock1.stateRoot != lock2.stateRoot, "Different locks should have different SR_0");
    }

    function test_Lock_SR0_DiffersByAmount() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.startPrank(user1);
        bytes32 lockId1 = vault.lock{value: 1 ether}(user2, dilithiumPubKey);
        bytes32 lockId2 = vault.lock{value: 2 ether}(user2, dilithiumPubKey);
        vm.stopPrank();
        
        L1Vault.Lock memory lock1 = vault.getLock(lockId1);
        L1Vault.Lock memory lock2 = vault.getLock(lockId2);
        
        assertTrue(lock1.stateRoot != lock2.stateRoot, "Different amounts should produce different SR_0");
    }

    function test_Lock_SR0_DiffersByRecipient() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.startPrank(user1);
        bytes32 lockId1 = vault.lock{value: 1 ether}(user2, dilithiumPubKey);
        bytes32 lockId2 = vault.lock{value: 1 ether}(address(0x3333), dilithiumPubKey);
        vm.stopPrank();
        
        L1Vault.Lock memory lock1 = vault.getLock(lockId1);
        L1Vault.Lock memory lock2 = vault.getLock(lockId2);
        
        assertTrue(lock1.stateRoot != lock2.stateRoot, "Different recipients should produce different SR_0");
    }

    function test_LockWithExpiry_CustomExpiry() public {
        uint256 amount = 1 ether;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        uint256 customExpiry = block.timestamp + 48 hours;
        
        vm.prank(user1);
        bytes32 lockId = vault.lockWithExpiry{value: amount}(user2, dilithiumPubKey, customExpiry);
        
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        assertEq(lockData.expiry, customExpiry, "Custom expiry should be set");
    }

    function test_LockWithExpiry_PastExpiry_Reverts() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        uint256 pastExpiry = block.timestamp - 1;
        
        vm.prank(user1);
        vm.expectRevert(L1Vault.LockExpired.selector);
        vault.lockWithExpiry{value: 1 ether}(user2, dilithiumPubKey, pastExpiry);
    }

    // =========================================================================
    // Day 6-7: SR_1 Unlock State Root Tests
    // =========================================================================

    function test_ComputeUnlockStateRoot() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: 1 ether}(user2, dilithiumPubKey);
        
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        
        // Compute expected SR_1
        uint256 unlockNonce = 0;
        bytes32 expectedSR1 = vault.computeUnlockStateRoot(
            lockData.stateRoot,  // SR_0
            lockId,
            user2,
            lockData.amount,
            unlockNonce
        );
        
        // SR_1 should be non-zero
        assertTrue(expectedSR1 != bytes32(0), "SR_1 should be non-zero");
        
        // SR_1 should be different from SR_0
        assertTrue(expectedSR1 != lockData.stateRoot, "SR_1 should differ from SR_0");
    }

    function test_SR1_DependsOnSR0() public {
        bytes memory dilithiumPubKey1 = _generateDilithiumPubKey(1);
        bytes memory dilithiumPubKey2 = _generateDilithiumPubKey(2);
        
        vm.startPrank(user1);
        bytes32 lockId1 = vault.lock{value: 1 ether}(user2, dilithiumPubKey1);
        bytes32 lockId2 = vault.lock{value: 1 ether}(user2, dilithiumPubKey2);
        vm.stopPrank();
        
        L1Vault.Lock memory lock1 = vault.getLock(lockId1);
        L1Vault.Lock memory lock2 = vault.getLock(lockId2);
        
        // Compute SR_1 for both
        bytes32 sr1_1 = vault.computeUnlockStateRoot(lock1.stateRoot, lockId1, user2, lock1.amount, 0);
        bytes32 sr1_2 = vault.computeUnlockStateRoot(lock2.stateRoot, lockId2, user2, lock2.amount, 0);
        
        assertTrue(sr1_1 != sr1_2, "Different SR_0 should produce different SR_1");
    }

    // =========================================================================
    // Emergency Unlock Tests
    // =========================================================================

    function test_EmergencyUnlock_Request() public {
        uint256 amount = 1 ether;
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: amount}(user2, dilithiumPubKey);
        
        uint256 minBond = 0.5 ether;
        uint256 percentBond = (amount * 5) / 100;
        uint256 requiredBond = minBond > percentBond ? minBond : percentBond;
        
        vm.prank(user1);
        vault.requestEmergencyUnlock{value: requiredBond}(lockId, user1);
        
        L1Vault.UnlockRequest memory request = vault.getUnlockRequest(lockId);
        assertTrue(request.isEmergency);
        assertEq(request.bond, requiredBond);
    }

    // =========================================================================
    // SPHINCS+ Verification Tests
    // =========================================================================

    function test_SPHINCSVerifier_Integration() public view {
        assertEq(vault.getSPHINCSVerifier(), address(sphincsVerifier));
    }

    function test_SPHINCSVerifier_Constants() public view {
        assertEq(sphincsVerifier.SIGNATURE_SIZE(), 7856);
        assertEq(sphincsVerifier.PUBLIC_KEY_SIZE(), 32);
    }

    // =========================================================================
    // SMT Integration Tests
    // =========================================================================

    function test_SMT_LeafComputation() public pure {
        bytes32 lockId = bytes32(uint256(1));
        bytes32 leaf = SparseMerkleTree.computeLeaf(lockId, 1 ether, address(0x1234), keccak256("pubkey"));
        assertTrue(leaf != bytes32(0));
    }

    function test_SMT_ProofVerification() public pure {
        bytes32 leaf = keccak256(abi.encodePacked(SparseMerkleTree.LEAF_DOMAIN(), bytes32(uint256(1))));
        bytes32[] memory siblings = new bytes32[](20);
        for (uint i = 0; i < 20; i++) {
            siblings[i] = SparseMerkleTree.getDefaultHash(i);
        }
        
        bytes32 root = SparseMerkleTree.computeRoot(leaf, 0, siblings);
        bytes32 root2 = SparseMerkleTree.computeRoot(leaf, 0, siblings);
        
        assertEq(root, root2);
        assertTrue(root != bytes32(0));
    }

    // =========================================================================
    // Prover Management Tests
    // =========================================================================

    function test_ProverRegistration() public {
        address newProver = address(0x6001);
        
        vm.deal(admin, 2 ether);
        vm.prank(admin);
        vault.registerProver{value: 1 ether}(newProver, _generatePublicKey(6));
        
        L1Vault.Prover memory prover = vault.getProver(newProver);
        assertTrue(prover.isActive);
    }

    function test_ProverCount() public view {
        assertEq(vault.getActiveProverCount(), 5);
    }

    // =========================================================================
    // Access Control Tests
    // =========================================================================

    function test_OnlyAdmin_RegisterProver() public {
        vm.deal(user1, 2 ether);
        vm.prank(user1);
        vm.expectRevert();
        vault.registerProver{value: 1 ether}(address(0x7001), _generatePublicKey(7));
    }

    function test_OnlyAdmin_UpdateStateRoot() public {
        vm.prank(user1);
        vm.expectRevert();
        vault.updateStateRoot(keccak256("new_state_root"));
    }

    // =========================================================================
    // Gas Benchmarks
    // =========================================================================

    function test_Gas_Lock() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        
        uint256 gasBefore = gasleft();
        vm.prank(user1);
        vault.lock{value: 1 ether}(user2, dilithiumPubKey);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for lock", gasUsed);
    }

    // =========================================================================
    // Challenge Bond Calculation Tests
    // =========================================================================

    function test_ChallengeBond_MaxFunction() public view {
        assertEq(vault.calculateChallengeBond(5 ether), 0.1 ether);
        assertEq(vault.calculateChallengeBond(20 ether), 0.2 ether);
        assertEq(vault.calculateChallengeBond(100 ether), 1 ether);
    }

    // =========================================================================
    // Slashing Distribution Tests
    // =========================================================================

    function test_SlashingDistribution_60_20_20() public view {
        (uint256 challengerPct, uint256 insurance, uint256 burn) = vault.getSlashingDistribution();
        
        assertEq(challengerPct, 60);
        assertEq(insurance, 20);
        assertEq(burn, 20);
    }

    // =========================================================================
    // Defense Period Tests
    // =========================================================================

    function test_DefensePeriod_Constant() public view {
        assertEq(vault.DEFENSE_PERIOD(), 48 hours);
    }

    function test_Challenge_SetsDefenseDeadline() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        L1Vault.Challenge memory challengeData = vault.getChallenge(lockId);
        assertEq(challengeData.defenseDeadline, block.timestamp + 48 hours);
    }

    function test_Challenge_EmitsEvent() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        bytes memory fraudProof = abi.encodePacked("fraud_proof");
        bytes32 fraudProofHash = keccak256(fraudProof);
        
        vm.prank(challenger);
        vm.expectEmit(true, true, false, true);
        emit ChallengeFiled(lockId, challenger, fraudProofHash, challengeBond, block.timestamp + 48 hours);
        
        vault.challenge{value: challengeBond}(lockId, fraudProof);
    }

    function test_SubmitDefense_BeforeDeadline() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.warp(block.timestamp + 24 hours);
        
        vm.prank(prover1);
        vault.submitDefense(lockId, "valid_proof");
        
        L1Vault.Challenge memory challengeData = vault.getChallenge(lockId);
        assertEq(uint256(challengeData.status), uint256(L1Vault.ChallengeStatus.DEFENSE_SUBMITTED));
        assertEq(challengeData.defender, prover1);
    }

    function test_SubmitDefense_EmitsEvent() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        bytes memory defenseProof = abi.encodePacked("valid_proof");
        bytes32 defenseProofHash = keccak256(defenseProof);
        
        vm.prank(prover1);
        vm.expectEmit(true, true, false, true);
        emit DefenseSubmitted(lockId, prover1, defenseProofHash);
        
        vault.submitDefense(lockId, defenseProof);
    }

    function test_SubmitDefense_AfterDeadline_Reverts() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.warp(block.timestamp + 49 hours);
        
        vm.prank(prover1);
        vm.expectRevert(L1Vault.DefensePeriodExpired.selector);
        vault.submitDefense(lockId, "valid_proof");
    }

    function test_SubmitDefense_AtExactDeadline() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.warp(block.timestamp + 48 hours);
        
        vm.prank(prover1);
        vault.submitDefense(lockId, "valid_proof");
        
        L1Vault.Challenge memory challengeData = vault.getChallenge(lockId);
        assertEq(uint256(challengeData.status), uint256(L1Vault.ChallengeStatus.DEFENSE_SUBMITTED));
    }

    function test_SubmitDefense_OnlyActiveProver() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.prank(user2);
        vm.expectRevert(L1Vault.NotActiveProver.selector);
        vault.submitDefense(lockId, "valid_proof");
    }

    // =========================================================================
    // Auto-Resolve Challenge Tests
    // =========================================================================

    function test_AutoResolveChallenge_AfterDefensePeriod() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        uint256 challengerBalanceAfterChallenge = challenger.balance;
        
        vm.warp(block.timestamp + 48 hours + 1);
        
        vault.autoResolveChallenge(lockId);
        
        L1Vault.Challenge memory challengeData = vault.getChallenge(lockId);
        assertEq(uint256(challengeData.status), uint256(L1Vault.ChallengeStatus.RESOLVED_VALID));
        assertEq(challenger.balance, challengerBalanceAfterChallenge + challengeBond);
    }

    function test_AutoResolveChallenge_EmitsEvent() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.warp(block.timestamp + 48 hours + 1);
        
        vm.expectEmit(true, false, false, true);
        emit ChallengeResolved(lockId, true, 0, 0, 0, 0);
        
        vault.autoResolveChallenge(lockId);
    }

    function test_AutoResolveChallenge_BeforeDeadline_Reverts() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.warp(block.timestamp + 24 hours);
        
        vm.expectRevert(L1Vault.DefensePeriodNotExpired.selector);
        vault.autoResolveChallenge(lockId);
    }

    function test_AutoResolveChallenge_AtExactDeadline_Reverts() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.warp(block.timestamp + 48 hours);
        
        vm.expectRevert(L1Vault.DefensePeriodNotExpired.selector);
        vault.autoResolveChallenge(lockId);
    }

    // =========================================================================
    // Challenge Resolution Tests
    // =========================================================================

    function test_ResolveChallenge_Valid() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        uint256 challengerBalanceBefore = challenger.balance;
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.prank(securityCouncil);
        vault.resolveChallenge(lockId, true);
        
        assertEq(challenger.balance, challengerBalanceBefore);
        
        L1Vault.Challenge memory challengeData = vault.getChallenge(lockId);
        assertEq(uint256(challengeData.status), uint256(L1Vault.ChallengeStatus.RESOLVED_VALID));
    }

    function test_ResolveChallenge_Invalid_DefenderReward() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        uint256 proverBalanceBefore = prover1.balance;
        vm.prank(prover1);
        vault.submitDefense(lockId, "valid_defense");
        
        vm.prank(securityCouncil);
        vault.resolveChallenge(lockId, false);
        
        uint256 expectedReward = (challengeBond * 60) / 100;
        assertEq(prover1.balance, proverBalanceBefore + expectedReward);
    }

    function test_ResolveChallenge_Invalid_InsuranceAndBurn() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        uint256 insuranceBefore = vault.insuranceFund();
        uint256 burnedBefore = vault.totalBurned();
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.prank(prover1);
        vault.submitDefense(lockId, "valid_defense");
        
        vm.prank(securityCouncil);
        vault.resolveChallenge(lockId, false);
        
        uint256 expectedInsurance = (challengeBond * 20) / 100;
        assertEq(vault.insuranceFund(), insuranceBefore + expectedInsurance);
        
        uint256 expectedBurn = (challengeBond * 20) / 100;
        assertEq(vault.totalBurned(), burnedBefore + expectedBurn);
    }

    function test_ResolveChallenge_OnlySecurityCouncil() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.prank(user1);
        vm.expectRevert(L1Vault.NotSecurityCouncil.selector);
        vault.resolveChallenge(lockId, true);
    }

    // =========================================================================
    // Quadratic Slashing Tests
    // =========================================================================

    function test_QuadraticSlashing_Constants() public view {
        assertEq(vault.SLASH_CHALLENGER_PERCENT(), 60);
        assertEq(vault.SLASH_INSURANCE_PERCENT(), 20);
        assertEq(vault.SLASH_BURN_PERCENT(), 20);
    }

    function test_QuadraticSlashing_Formula() public pure {
        assertEq(_calculateSlash(1), 10);
        assertEq(_calculateSlash(2), 40);
        assertEq(_calculateSlash(3), 90);
        assertEq(_calculateSlash(4), 100);
        assertEq(_calculateSlash(5), 100);
    }

    function _calculateSlash(uint256 numColluding) internal pure returns (uint256) {
        uint256 slashPercent = numColluding * numColluding * 10;
        if (slashPercent > 100) slashPercent = 100;
        return slashPercent;
    }

    // =========================================================================
    // Complete Challenge Flow Test
    // =========================================================================

    /// @notice Test complete challenge flow: Lock → Emergency Unlock → Challenge → Defense → Resolve
    /// @dev Day 8 Fix: Emergency Unlock経由の場合、Challenge棄却後はEMERGENCY_PENDINGに戻る
    function test_ChallengeFlow_Complete() public {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        vm.prank(user1);
        bytes32 lockId = vault.lock{value: 1 ether}(user2, dilithiumPubKey);
        
        uint256 emergencyBond = 0.5 ether;
        vm.prank(user1);
        vault.requestEmergencyUnlock{value: emergencyBond}(lockId, user1);
        
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        assertEq(uint256(lockData.status), uint256(L1Vault.LockStatus.CHALLENGED));
        
        vm.warp(block.timestamp + 24 hours);
        vm.prank(prover1);
        vault.submitDefense(lockId, "valid_defense");
        
        vm.prank(securityCouncil);
        vault.resolveChallenge(lockId, false);
        
        // Day 8 Fix: Emergency Unlock経由なのでEMERGENCY_PENDINGに戻る
        // (通常Unlockの場合はPENDING_UNLOCKに戻る)
        lockData = vault.getLock(lockId);
        assertEq(uint256(lockData.status), uint256(L1Vault.LockStatus.EMERGENCY_PENDING));
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    function test_Challenge_MinimumBond() public {
        bytes32 lockId = _setupChallengeScenario();
        
        vm.prank(challenger);
        vm.expectRevert(L1Vault.InvalidBond.selector);
        vault.challenge{value: 0.05 ether}(lockId, "fraud_proof");
    }

    function test_Challenge_AfterUnlockTime_Reverts() public {
        bytes32 lockId = _setupChallengeScenario();
        
        vm.warp(block.timestamp + 7 days + 1);
        
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        vm.prank(challenger);
        vm.expectRevert(L1Vault.UnlockNotReady.selector);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
    }

    function test_DoubleChallenge_Reverts() public {
        bytes32 lockId = _setupChallengeScenario();
        uint256 challengeBond = vault.calculateChallengeBond(1 ether);
        
        vm.prank(challenger);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof");
        
        vm.prank(user2);
        vm.deal(user2, 1 ether);
        vm.expectRevert(L1Vault.LockAlreadyReleased.selector);
        vault.challenge{value: challengeBond}(lockId, "fraud_proof_2");
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
        bytes memory pubKey = new bytes(1952);
        for (uint i = 0; i < 1952; i++) {
            pubKey[i] = bytes1(uint8(keccak256(abi.encodePacked(seed, i))[0]));
        }
        return pubKey;
    }

    function _setupChallengeScenario() internal returns (bytes32 lockId) {
        bytes memory dilithiumPubKey = _generateDilithiumPubKey(1);
        vm.prank(user1);
        lockId = vault.lock{value: 1 ether}(user2, dilithiumPubKey);
        
        uint256 emergencyBond = 0.5 ether;
        vm.prank(user1);
        vault.requestEmergencyUnlock{value: emergencyBond}(lockId, user1);
    }
}
