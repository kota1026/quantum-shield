// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/sequencer/SequencerRegistry.sol";
import "../../src/sequencer/SequencerSlashing.sol";
import "../../src/sequencer/SequencerRotation.sol";
import "../../src/treasury/InsuranceFund.sol";

/**
 * @title MultiSequencerE2E
 * @notice E2E tests for multi-sequencer operations
 * @dev Implements TEST-007 from Phase 3.3 Track B
 *
 * Tests:
 * - 4-node BFT consensus
 * - Sequencer rotation
 * - Failover scenarios
 * - Health checks
 *
 * @custom:security-contact security@quantumshield.io
 */
contract MultiSequencerE2E is Test {
    // ============================================
    // Constants
    // ============================================
    
    uint256 public constant NUM_SEQUENCERS = 4;
    uint256 public constant MIN_STAKE = 400_000e18;
    uint256 public constant ROTATION_TIMEOUT = 10 seconds;
    uint256 public constant HEALTH_CHECK_INTERVAL = 30 seconds;
    uint256 public constant UNBONDING_PERIOD = 7 days;
    
    // BFT: n = 3f + 1, so f = 1 for 4 nodes
    uint256 public constant MAX_FAULTY = 1;
    uint256 public constant QUORUM = 3; // 2f + 1
    
    // ============================================
    // Contracts
    // ============================================
    
    SequencerRegistry public registry;
    SequencerSlashing public slashing;
    SequencerRotation public rotation;
    InsuranceFund public insuranceFund;
    
    // ============================================
    // Actors
    // ============================================
    
    address public admin;
    address[] public sequencers;
    
    // ============================================
    // Setup
    // ============================================
    
    function setUp() public {
        admin = makeAddr("admin");
        
        // Create 4 sequencers for BFT
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            sequencers.push(makeAddr(string.concat("seq", vm.toString(i))));
            vm.deal(sequencers[i], MIN_STAKE + 1 ether);
        }
        
        vm.startPrank(admin);
        
        insuranceFund = new InsuranceFund(admin);
        registry = new SequencerRegistry(admin);
        slashing = new SequencerSlashing(address(registry), address(insuranceFund), admin);
        rotation = new SequencerRotation(address(registry), admin);
        
        vm.stopPrank();
        
        // Register all sequencers
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            registry.register{value: MIN_STAKE}();
        }
    }
    
    // ============================================
    // 4-Node BFT Consensus Tests
    // ============================================
    
    function test_BFT_AllNodesHealthy() public view {
        // All 4 nodes should be registered and active
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            assertTrue(registry.isRegistered(sequencers[i]), "Sequencer should be registered");
            assertTrue(registry.isActive(sequencers[i]), "Sequencer should be active");
        }
        
        assertEq(registry.activeCount(), NUM_SEQUENCERS, "Should have 4 active sequencers");
    }
    
    function test_BFT_QuorumReached() public {
        // Simulate block proposal
        bytes32 blockHash = keccak256("block_data");
        
        // Get signatures from quorum (3 of 4)
        uint256 signatures = 0;
        for (uint256 i = 0; i < QUORUM; i++) {
            vm.prank(sequencers[i]);
            rotation.signBlock(blockHash);
            signatures++;
        }
        
        assertTrue(signatures >= QUORUM, "Should have quorum");
        assertTrue(rotation.isBlockFinalized(blockHash), "Block should be finalized");
    }
    
    function test_BFT_TolerateOneFaulty() public {
        // Mark one sequencer as faulty/offline
        vm.prank(admin);
        registry.markInactive(sequencers[0]);
        
        // Should still have quorum with 3 remaining
        assertEq(registry.activeCount(), NUM_SEQUENCERS - 1, "Should have 3 active");
        
        // Can still finalize blocks
        bytes32 blockHash = keccak256("block_data");
        
        for (uint256 i = 1; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            rotation.signBlock(blockHash);
        }
        
        assertTrue(rotation.isBlockFinalized(blockHash), "Should finalize with 3 signatures");
    }
    
    function test_BFT_CannotFinalizeWithTwoFaulty() public {
        // Mark two sequencers as faulty
        vm.startPrank(admin);
        registry.markInactive(sequencers[0]);
        registry.markInactive(sequencers[1]);
        vm.stopPrank();
        
        // Only 2 active, need 3 for quorum
        assertEq(registry.activeCount(), 2, "Should have 2 active");
        
        bytes32 blockHash = keccak256("block_data");
        
        for (uint256 i = 2; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            rotation.signBlock(blockHash);
        }
        
        assertFalse(rotation.isBlockFinalized(blockHash), "Should NOT finalize with only 2 signatures");
    }
    
    // ============================================
    // Rotation Tests
    // ============================================
    
    function test_Rotation_NormalCycle() public {
        // Initial leader
        address leader = rotation.currentLeader();
        assertEq(leader, sequencers[0], "First sequencer should be initial leader");
        
        // Trigger rotation after timeout
        vm.warp(block.timestamp + ROTATION_TIMEOUT);
        
        rotation.rotate();
        
        address newLeader = rotation.currentLeader();
        assertEq(newLeader, sequencers[1], "Should rotate to next sequencer");
    }
    
    function test_Rotation_FullCycle() public {
        // Complete full rotation cycle
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            assertEq(rotation.currentLeader(), sequencers[i], "Leader should match expected");
            
            vm.warp(block.timestamp + ROTATION_TIMEOUT);
            rotation.rotate();
        }
        
        // Should wrap back to first
        assertEq(rotation.currentLeader(), sequencers[0], "Should wrap to first sequencer");
    }
    
    function test_Rotation_SkipInactive() public {
        // Mark sequencer 1 as inactive
        vm.prank(admin);
        registry.markInactive(sequencers[1]);
        
        // Initial leader is sequencer 0
        assertEq(rotation.currentLeader(), sequencers[0], "Initial leader should be seq0");
        
        // Rotate
        vm.warp(block.timestamp + ROTATION_TIMEOUT);
        rotation.rotate();
        
        // Should skip seq1 and go to seq2
        assertEq(rotation.currentLeader(), sequencers[2], "Should skip inactive and go to seq2");
    }
    
    function test_Rotation_TimeoutEnforced() public {
        // Try to rotate before timeout
        vm.expectRevert("Rotation timeout not reached");
        rotation.rotate();
        
        // After timeout should work
        vm.warp(block.timestamp + ROTATION_TIMEOUT);
        rotation.rotate();
    }
    
    // ============================================
    // Failover Tests
    // ============================================
    
    function test_Failover_LeaderCrash() public {
        address originalLeader = rotation.currentLeader();
        
        // Leader crashes (marked inactive)
        vm.prank(admin);
        registry.markInactive(originalLeader);
        
        // Emergency rotation should trigger
        rotation.emergencyRotate();
        
        address newLeader = rotation.currentLeader();
        assertTrue(newLeader != originalLeader, "Should have new leader");
        assertTrue(registry.isActive(newLeader), "New leader should be active");
    }
    
    function test_Failover_MultipleNodesCrash() public {
        // Two nodes crash simultaneously
        vm.startPrank(admin);
        registry.markInactive(sequencers[0]);
        registry.markInactive(sequencers[1]);
        vm.stopPrank();
        
        // System should remain operational with 2 nodes
        // But cannot finalize new blocks (need 3)
        assertEq(registry.activeCount(), 2, "Should have 2 active");
        
        // Recovery: reactivate one node
        vm.prank(admin);
        registry.markActive(sequencers[0]);
        
        assertEq(registry.activeCount(), 3, "Should have 3 active after recovery");
    }
    
    function test_Failover_AutoRecovery() public {
        // Node goes offline
        vm.prank(admin);
        registry.markInactive(sequencers[0]);
        
        // Node comes back online
        vm.prank(sequencers[0]);
        registry.heartbeat();
        
        // Should be reactivated
        assertTrue(registry.isActive(sequencers[0]), "Node should be reactivated");
    }
    
    // ============================================
    // Health Check Tests
    // ============================================
    
    function test_HealthCheck_AllHealthy() public {
        // All nodes send heartbeats
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            registry.heartbeat();
        }
        
        // Check health status
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            assertTrue(registry.isHealthy(sequencers[i]), "All should be healthy");
        }
    }
    
    function test_HealthCheck_MissedHeartbeat() public {
        // Initial heartbeat
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            registry.heartbeat();
        }
        
        // Time passes, seq0 doesn't send heartbeat
        vm.warp(block.timestamp + HEALTH_CHECK_INTERVAL + 1);
        
        for (uint256 i = 1; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            registry.heartbeat();
        }
        
        // seq0 should be marked unhealthy
        assertFalse(registry.isHealthy(sequencers[0]), "Seq0 should be unhealthy");
        assertTrue(registry.isHealthy(sequencers[1]), "Seq1 should be healthy");
    }
    
    function test_HealthCheck_AutoDeactivation() public {
        // Miss multiple health checks
        vm.prank(sequencers[0]);
        registry.heartbeat();
        
        // Miss 3 consecutive health checks
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(block.timestamp + HEALTH_CHECK_INTERVAL + 1);
            
            // Only other sequencers send heartbeats
            for (uint256 j = 1; j < NUM_SEQUENCERS; j++) {
                vm.prank(sequencers[j]);
                registry.heartbeat();
            }
        }
        
        // seq0 should be auto-deactivated
        assertFalse(registry.isActive(sequencers[0]), "Seq0 should be deactivated");
    }
    
    // ============================================
    // Slashing Integration Tests
    // ============================================
    
    function test_Slashing_MaliciousSequencer() public {
        // Sequencer produces conflicting blocks
        bytes memory doubleSignProof = abi.encodePacked(
            sequencers[0],
            keccak256("block1"),
            keccak256("block2")
        );
        
        vm.prank(sequencers[1]); // Another sequencer challenges
        slashing.submitChallenge{value: 0.1 ether}(sequencers[0], doubleSignProof);
        
        // Wait defense period
        vm.warp(block.timestamp + 48 hours);
        
        // Execute slash
        uint256 stakeBefore = registry.getStake(sequencers[0]);
        vm.prank(admin);
        slashing.executeSlash(sequencers[0]);
        uint256 stakeAfter = registry.getStake(sequencers[0]);
        
        // Verify 10% slashed
        assertEq(stakeBefore - stakeAfter, stakeBefore / 10, "Should slash 10%");
    }
    
    function test_Slashing_RemoveFromRotation() public {
        // Slash sequencer multiple times
        for (uint256 i = 0; i < 3; i++) {
            bytes memory proof = abi.encodePacked(sequencers[0], "offense", i);
            
            vm.prank(sequencers[1]);
            slashing.submitChallenge{value: 0.1 ether}(sequencers[0], proof);
            
            vm.warp(block.timestamp + 48 hours);
            
            vm.prank(admin);
            slashing.executeSlash(sequencers[0]);
        }
        
        // After multiple slashes, should be removed from rotation
        assertFalse(registry.isActive(sequencers[0]), "Should be removed from rotation");
    }
    
    // ============================================
    // Performance Tests
    // ============================================
    
    function test_Performance_BlockThroughput() public {
        // Simulate block production
        uint256 blocksProduced = 0;
        uint256 startTime = block.timestamp;
        
        for (uint256 i = 0; i < 100; i++) {
            bytes32 blockHash = keccak256(abi.encodePacked("block", i));
            
            // Get quorum signatures
            for (uint256 j = 0; j < QUORUM; j++) {
                vm.prank(sequencers[j]);
                rotation.signBlock(blockHash);
            }
            
            if (rotation.isBlockFinalized(blockHash)) {
                blocksProduced++;
            }
            
            // Advance time for rotation
            if ((i + 1) % 10 == 0) {
                vm.warp(block.timestamp + ROTATION_TIMEOUT);
                rotation.rotate();
            }
        }
        
        assertEq(blocksProduced, 100, "All blocks should be finalized");
    }
    
    // ============================================
    // Edge Case Tests
    // ============================================
    
    function test_EdgeCase_AllNodesOffline() public {
        // Mark all nodes inactive
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            vm.prank(admin);
            registry.markInactive(sequencers[i]);
        }
        
        // System should be in emergency state
        assertEq(registry.activeCount(), 0, "No active sequencers");
        assertTrue(rotation.isEmergencyState(), "Should be in emergency state");
    }
    
    function test_EdgeCase_SingleNodeRemaining() public {
        // Deactivate 3 of 4 nodes
        for (uint256 i = 1; i < NUM_SEQUENCERS; i++) {
            vm.prank(admin);
            registry.markInactive(sequencers[i]);
        }
        
        assertEq(registry.activeCount(), 1, "Single node remaining");
        
        // Cannot finalize blocks
        bytes32 blockHash = keccak256("block_data");
        vm.prank(sequencers[0]);
        rotation.signBlock(blockHash);
        
        assertFalse(rotation.isBlockFinalized(blockHash), "Cannot finalize with single node");
    }
    
    function test_EdgeCase_RapidReconnection() public {
        // Node rapidly disconnects and reconnects
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(admin);
            registry.markInactive(sequencers[0]);
            
            vm.prank(sequencers[0]);
            registry.heartbeat();
        }
        
        // Should remain stable
        assertTrue(registry.isActive(sequencers[0]), "Node should be active");
    }
}
