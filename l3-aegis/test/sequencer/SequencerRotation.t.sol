// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/sequencer/SequencerRegistry.sol";
import "../../src/sequencer/SequencerRotation.sol";
import "../../src/sequencer/SequencerStaking.sol";
import "../../src/interfaces/ISequencerRegistry.sol";

/**
 * @title SequencerRotation Test
 * @notice TEST-SEQ-001: Sequencer rotation E2E tests
 * @dev Covers DECEN-012 requirements:
 *      - Sequencer registration/deregistration
 *      - Round-robin rotation
 *      - Epoch-based rotation (1000 blocks)
 *      - Current active sequencer retrieval
 */
contract SequencerRotationTest is Test {
    SequencerRegistry public registry;
    SequencerRotation public rotation;
    SequencerStaking public staking;

    address public admin = address(0xAD1);
    address public sequencer1 = address(0x111);
    address public sequencer2 = address(0x222);
    address public sequencer3 = address(0x333);
    address public sequencer4 = address(0x444);

    // Mock SPHINCS+ public keys (simplified for testing)
    bytes public sphincsKey1 = hex"0101010101010101010101010101010101010101010101010101010101010101";
    bytes public sphincsKey2 = hex"0202020202020202020202020202020202020202020202020202020202020202";
    bytes public sphincsKey3 = hex"0303030303030303030303030303030303030303030303030303030303030303";
    bytes public sphincsKey4 = hex"0404040404040404040404040404040404040404040404040404040404040404";

    uint256 public constant MIN_STAKE = 500_000 ether; // $500K in tokens
    uint256 public constant EPOCH_LENGTH = 1000; // blocks

    function setUp() public {
        vm.startPrank(admin);
        staking = new SequencerStaking(admin);
        registry = new SequencerRegistry(address(staking), admin);
        rotation = new SequencerRotation(address(registry), address(staking), admin);
        registry.setRotationContract(address(rotation));
        vm.stopPrank();
    }

    // ============================================
    // TEST-SEQ-001.1: Registration Tests
    // ============================================

    function test_RegisterSequencer() public {
        vm.deal(sequencer1, MIN_STAKE + 1 ether);
        vm.prank(sequencer1);
        registry.register{value: MIN_STAKE}(sphincsKey1);

        assertTrue(registry.isRegistered(sequencer1));
        assertEq(registry.getActiveSequencersCount(), 1);
        
        // Verify stake was credited to sequencer1
        assertTrue(staking.isEligible(sequencer1));
    }

    function test_RegisterMultipleSequencers() public {
        _registerSequencer(sequencer1, sphincsKey1);
        _registerSequencer(sequencer2, sphincsKey2);
        _registerSequencer(sequencer3, sphincsKey3);
        _registerSequencer(sequencer4, sphincsKey4);

        assertEq(registry.getActiveSequencersCount(), 4);
        
        // Verify all are eligible
        assertTrue(staking.isEligible(sequencer1));
        assertTrue(staking.isEligible(sequencer2));
        assertTrue(staking.isEligible(sequencer3));
        assertTrue(staking.isEligible(sequencer4));
    }

    function test_RegisterSequencer_RevertInsufficientStake() public {
        vm.deal(sequencer1, MIN_STAKE - 1);
        vm.prank(sequencer1);
        vm.expectRevert("Insufficient stake");
        registry.register{value: MIN_STAKE - 1}(sphincsKey1);
    }

    function test_DeregisterSequencer() public {
        _registerSequencer(sequencer1, sphincsKey1);
        
        vm.prank(sequencer1);
        registry.deregister();

        assertFalse(registry.isRegistered(sequencer1));
    }

    // ============================================
    // TEST-SEQ-001.2: Rotation Tests
    // ============================================

    function test_GetCurrentSequencer_InitialState() public {
        _registerSequencer(sequencer1, sphincsKey1);
        _registerSequencer(sequencer2, sphincsKey2);

        // Trigger initial rotation
        vm.prank(admin);
        rotation.forceRotation();

        address current = rotation.getCurrentSequencer();
        assertTrue(current == sequencer1 || current == sequencer2);
    }

    function test_RotateSequencer_EpochBased() public {
        _registerSequencer(sequencer1, sphincsKey1);
        _registerSequencer(sequencer2, sphincsKey2);

        // Trigger initial rotation
        vm.prank(admin);
        rotation.forceRotation();
        address initial = rotation.getCurrentSequencer();
        
        // Advance EPOCH_LENGTH blocks
        vm.roll(block.number + EPOCH_LENGTH);
        rotation.checkAndRotate();

        address next = rotation.getCurrentSequencer();
        // In round-robin, next should be different
        assertNotEq(initial, next);
    }

    function test_RotateSequencer_RoundRobin() public {
        _registerSequencer(sequencer1, sphincsKey1);
        _registerSequencer(sequencer2, sphincsKey2);
        _registerSequencer(sequencer3, sphincsKey3);
        _registerSequencer(sequencer4, sphincsKey4);

        address[] memory seen = new address[](4);
        
        // Initial rotation
        vm.prank(admin);
        rotation.forceRotation();
        
        for (uint256 i = 0; i < 4; i++) {
            seen[i] = rotation.getCurrentSequencer();
            vm.roll(block.number + EPOCH_LENGTH);
            rotation.checkAndRotate();
        }

        // All 4 sequencers should have been active once
        _assertAllUnique(seen);
    }

    function test_ForceRotation_OnlyAdmin() public {
        _registerSequencer(sequencer1, sphincsKey1);
        _registerSequencer(sequencer2, sphincsKey2);

        vm.prank(sequencer1);
        vm.expectRevert();
        rotation.forceRotation();

        vm.prank(admin);
        rotation.forceRotation(); // Should succeed
    }

    function test_GetActiveSequencers() public {
        _registerSequencer(sequencer1, sphincsKey1);
        _registerSequencer(sequencer2, sphincsKey2);

        address[] memory active = registry.getActiveSequencers();
        assertEq(active.length, 2);
    }

    function test_GetBlocksUntilRotation() public {
        _registerSequencer(sequencer1, sphincsKey1);
        
        vm.prank(admin);
        rotation.forceRotation();

        uint256 remaining = rotation.getBlocksUntilRotation();
        assertEq(remaining, EPOCH_LENGTH);

        vm.roll(block.number + 500);
        remaining = rotation.getBlocksUntilRotation();
        assertEq(remaining, EPOCH_LENGTH - 500);
    }

    function test_GetNextSequencer() public {
        _registerSequencer(sequencer1, sphincsKey1);
        _registerSequencer(sequencer2, sphincsKey2);

        vm.prank(admin);
        rotation.forceRotation();

        address current = rotation.getCurrentSequencer();
        address next = rotation.getNextSequencer();
        
        assertNotEq(current, next);
    }

    // ============================================
    // Helper Functions
    // ============================================

    function _registerSequencer(address seq, bytes memory key) internal {
        vm.deal(seq, MIN_STAKE + 1 ether);
        vm.prank(seq);
        registry.register{value: MIN_STAKE}(key);
    }

    function _assertAllUnique(address[] memory arr) internal pure {
        for (uint256 i = 0; i < arr.length; i++) {
            for (uint256 j = i + 1; j < arr.length; j++) {
                require(arr[i] != arr[j], "Duplicate found");
            }
        }
    }
}
