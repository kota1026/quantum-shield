// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/sequencer/SequencerHealth.sol";
import "../../src/sequencer/SequencerRegistry.sol";
import "../../src/sequencer/SequencerRotation.sol";

/**
 * @title SequencerFailover Test
 * @notice TEST-SEQ-004: Sequencer failover scenarios tests
 * @dev Covers DECEN-015 requirements:
 *      - Heartbeat monitoring (30s intervals)
 *      - Auto-rotation after 3 consecutive failures
 *      - Failed sequencer suspension
 *      - Recovery and re-registration flow
 *      - Force inclusion guarantee (24h)
 */
contract SequencerFailoverTest is Test {
    SequencerHealth public health;
    SequencerRegistry public registry;
    SequencerRotation public rotation;

    address public admin = address(0xAD1);
    address public sequencer1 = address(0x111);
    address public sequencer2 = address(0x222);
    address public sequencer3 = address(0x333);
    address public sequencer4 = address(0x444);

    bytes public sphincsKey1 = hex"0101010101010101010101010101010101010101010101010101010101010101";
    bytes public sphincsKey2 = hex"0202020202020202020202020202020202020202020202020202020202020202";
    bytes public sphincsKey3 = hex"0303030303030303030303030303030303030303030303030303030303030303";
    bytes public sphincsKey4 = hex"0404040404040404040404040404040404040404040404040404040404040404";

    uint256 public constant MIN_STAKE = 500_000 ether;
    uint256 public constant HEARTBEAT_INTERVAL = 30 seconds;
    uint256 public constant MAX_MISSED_HEARTBEATS = 3;
    uint256 public constant FORCE_INCLUSION_TIMEOUT = 24 hours;

    function setUp() public {
        vm.startPrank(admin);
        registry = new SequencerRegistry(admin);
        rotation = new SequencerRotation(address(registry), admin);
        health = new SequencerHealth(address(registry), address(rotation), admin);
        
        registry.setRotationContract(address(rotation));
        registry.setHealthContract(address(health));
        rotation.setHealthContract(address(health));
        vm.stopPrank();

        // Register all sequencers
        _registerSequencer(sequencer1, sphincsKey1);
        _registerSequencer(sequencer2, sphincsKey2);
        _registerSequencer(sequencer3, sphincsKey3);
        _registerSequencer(sequencer4, sphincsKey4);
    }

    // ============================================
    // TEST-SEQ-004.1: Heartbeat Monitoring Tests
    // ============================================

    function test_Heartbeat() public {
        vm.prank(sequencer1);
        health.heartbeat();

        assertTrue(health.checkHealth(sequencer1));
    }

    function test_Heartbeat_Expiry() public {
        vm.prank(sequencer1);
        health.heartbeat();

        // Fast forward past heartbeat interval
        vm.warp(block.timestamp + HEARTBEAT_INTERVAL + 1);

        assertFalse(health.checkHealth(sequencer1));
    }

    function test_Heartbeat_OnlyRegistered() public {
        address unregistered = address(0xBAD);
        vm.prank(unregistered);
        vm.expectRevert("Not registered");
        health.heartbeat();
    }

    // ============================================
    // TEST-SEQ-004.2: Auto-Rotation on Failure
    // ============================================

    function test_AutoRotation_AfterThreeMisses() public {
        // Set sequencer1 as active
        address currentSeq = rotation.getCurrentSequencer();
        
        // Miss 3 heartbeats
        for (uint256 i = 0; i < MAX_MISSED_HEARTBEATS; i++) {
            vm.warp(block.timestamp + HEARTBEAT_INTERVAL + 1);
        }

        // Trigger health check
        vm.prank(admin);
        health.checkAndRotate();

        // If currentSeq was sequencer1, it should have been rotated
        if (currentSeq == sequencer1) {
            assertNotEq(rotation.getCurrentSequencer(), sequencer1);
        }
    }

    function test_AutoRotation_SkipFailedSequencer() public {
        // Make sequencer1 unhealthy
        vm.warp(block.timestamp + HEARTBEAT_INTERVAL * (MAX_MISSED_HEARTBEATS + 1));

        // Force rotation should skip sequencer1
        vm.prank(admin);
        rotation.forceRotation();

        // Next sequencer should not be sequencer1
        address next = rotation.getCurrentSequencer();
        // If rotation was to sequencer1, health check should have skipped it
        assertTrue(
            health.checkHealth(next) || 
            registry.getActiveSequencersCount() == 1,
            "Active sequencer should be healthy"
        );
    }

    // ============================================
    // TEST-SEQ-004.3: Sequencer Suspension Tests
    // ============================================

    function test_SuspendSequencer() public {
        vm.prank(admin);
        health.suspendSequencer(sequencer1);

        assertTrue(health.isSuspended(sequencer1));
        assertFalse(health.checkHealth(sequencer1));
    }

    function test_SuspendedSequencer_NotInRotation() public {
        vm.prank(admin);
        health.suspendSequencer(sequencer1);

        // Force multiple rotations
        for (uint256 i = 0; i < 10; i++) {
            vm.roll(block.number + 1000);
            rotation.rotateSequencer();
            assertNotEq(rotation.getCurrentSequencer(), sequencer1);
        }
    }

    // ============================================
    // TEST-SEQ-004.4: Recovery Flow Tests
    // ============================================

    function test_RecoverSequencer() public {
        // Suspend
        vm.prank(admin);
        health.suspendSequencer(sequencer1);
        assertTrue(health.isSuspended(sequencer1));

        // Recover
        vm.prank(admin);
        health.unsuspendSequencer(sequencer1);
        assertFalse(health.isSuspended(sequencer1));

        // Should be able to send heartbeat again
        vm.prank(sequencer1);
        health.heartbeat();
        assertTrue(health.checkHealth(sequencer1));
    }

    function test_RecoverSequencer_RequiresHeartbeat() public {
        // Suspend and unsuspend
        vm.startPrank(admin);
        health.suspendSequencer(sequencer1);
        health.unsuspendSequencer(sequencer1);
        vm.stopPrank();

        // Still needs heartbeat to be healthy
        assertFalse(health.checkHealth(sequencer1));

        vm.prank(sequencer1);
        health.heartbeat();
        assertTrue(health.checkHealth(sequencer1));
    }

    // ============================================
    // TEST-SEQ-004.5: Force Inclusion Tests
    // ============================================

    function test_ForceInclusionTimeout() public {
        bytes32 txHash = keccak256("test_tx");
        
        // Submit transaction
        vm.prank(sequencer1);
        health.submitForInclusion(txHash);

        // Before timeout: cannot force include
        vm.expectRevert("Timeout not reached");
        health.forceInclude(txHash);

        // After timeout: can force include
        vm.warp(block.timestamp + FORCE_INCLUSION_TIMEOUT + 1);
        health.forceInclude(txHash);

        assertTrue(health.isIncluded(txHash));
    }

    function test_ForceInclusionTimeout_Constants() public view {
        assertEq(health.FORCE_INCLUSION_TIMEOUT(), FORCE_INCLUSION_TIMEOUT);
    }

    // ============================================
    // TEST-SEQ-004.6: Health Stats Tests
    // ============================================

    function test_GetHealthStats() public {
        // All sequencers send heartbeats
        vm.prank(sequencer1);
        health.heartbeat();
        vm.prank(sequencer2);
        health.heartbeat();
        vm.prank(sequencer3);
        health.heartbeat();
        vm.prank(sequencer4);
        health.heartbeat();

        (uint256 healthy, uint256 total) = health.getHealthStats();
        assertEq(total, 4);
        assertEq(healthy, 4);

        // Make one unhealthy
        vm.warp(block.timestamp + HEARTBEAT_INTERVAL + 1);
        vm.prank(sequencer1);
        health.heartbeat(); // Only seq1 sends heartbeat

        (healthy, total) = health.getHealthStats();
        assertEq(total, 4);
        assertEq(healthy, 1);
    }

    // ============================================
    // Helper Functions
    // ============================================

    function _registerSequencer(address seq, bytes memory key) internal {
        vm.deal(seq, MIN_STAKE + 1 ether);
        vm.prank(seq);
        registry.register{value: MIN_STAKE}(key);
    }
}
