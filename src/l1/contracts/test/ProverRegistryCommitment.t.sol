// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ProverRegistry} from "../src/ProverRegistry.sol";
import {IProverRegistry} from "../src/interfaces/IProverRegistry.sol";
import {SHA3_256} from "../src/libraries/SHA3_256.sol";

/// @title ProverRegistryCommitmentTest - FR-THRESH-5 active set commitment
/// @notice Verifies that the active prover set commitment is maintained
///         on-chain across register / exit / slash, that historical epochs
///         stay queryable, and that the commitment matches an independent
///         re-computation of the merkle tree
contract ProverRegistryCommitmentTest is Test {
    ProverRegistry public registry;

    address public council;
    address public prover1;
    address public prover2;
    address public prover3;

    bytes public pubKey1;
    bytes public pubKey2;
    bytes public pubKey3;

    event ActiveSetCommitmentUpdated(
        uint64 indexed epoch,
        bytes32 indexed commitment,
        bytes32 root,
        uint256 proverCount,
        uint256 blockNumber
    );

    function setUp() public {
        council = makeAddr("council");
        prover1 = makeAddr("prover1");
        prover2 = makeAddr("prover2");
        prover3 = makeAddr("prover3");

        pubKey1 = _pubKey(0x11);
        pubKey2 = _pubKey(0x22);
        pubKey3 = _pubKey(0x33);

        registry = new ProverRegistry(council, false);

        vm.deal(prover1, 10 ether);
        vm.deal(prover2, 10 ether);
        vm.deal(prover3, 10 ether);
    }

    function _pubKey(uint8 seed) internal pure returns (bytes memory key) {
        key = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            key[i] = bytes1(uint8(seed) ^ uint8(i));
        }
    }

    function _register(address prover, bytes memory key) internal {
        vm.prank(prover);
        registry.registerProver{value: 1 ether}(key);
    }

    function _expectedCommitment(bytes32 root, uint256 count) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(registry.SET_DOMAIN(), root, count));
    }

    function _leaf(address prover, bytes memory key) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(registry.LEAF_DOMAIN(), prover, SHA3_256.hash(key))
        );
    }

    function _node(bytes32 left, bytes32 right) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(registry.NODE_DOMAIN(), left, right));
    }

    // =========================================================================
    // Genesis (epoch 0)
    // =========================================================================

    function testGenesisEpochIsEmptySet() public view {
        assertEq(registry.activeSetEpoch(), 0);
        (bytes32 commitment, uint64 epoch) = registry.getActiveSetCommitment();
        assertEq(epoch, 0);
        assertEq(commitment, _expectedCommitment(bytes32(0), 0));
        assertTrue(registry.isKnownActiveSetCommitment(commitment));
    }

    function testGenesisCheckpointFields() public view {
        IProverRegistry.SetCheckpoint memory cp = registry.getActiveSetCheckpoint(0);
        assertEq(cp.root, bytes32(0));
        assertEq(cp.proverCount, 0);
        assertEq(cp.blockNumber, uint64(block.number));
    }

    // =========================================================================
    // Registration updates the commitment
    // =========================================================================

    function testSingleProverRootIsLeaf() public {
        _register(prover1, pubKey1);

        assertEq(registry.activeSetEpoch(), 1);
        (bytes32 commitment, ) = registry.getActiveSetCommitment();

        bytes32 expectedRoot = _leaf(prover1, pubKey1);
        assertEq(commitment, _expectedCommitment(expectedRoot, 1));
    }

    function testTwoProverRoot() public {
        _register(prover1, pubKey1);
        _register(prover2, pubKey2);

        assertEq(registry.activeSetEpoch(), 2);
        (bytes32 commitment, ) = registry.getActiveSetCommitment();

        bytes32 expectedRoot = _node(_leaf(prover1, pubKey1), _leaf(prover2, pubKey2));
        assertEq(commitment, _expectedCommitment(expectedRoot, 2));
    }

    function testThreeProverRootZeroPadded() public {
        _register(prover1, pubKey1);
        _register(prover2, pubKey2);
        _register(prover3, pubKey3);

        (bytes32 commitment, ) = registry.getActiveSetCommitment();

        bytes32 left = _node(_leaf(prover1, pubKey1), _leaf(prover2, pubKey2));
        bytes32 right = _node(_leaf(prover3, pubKey3), bytes32(0));
        assertEq(commitment, _expectedCommitment(_node(left, right), 3));
    }

    function testRegisterEmitsCommitmentEvent() public {
        bytes32 expectedRoot = _leaf(prover1, pubKey1);
        bytes32 expectedCommitment = _expectedCommitment(expectedRoot, 1);

        vm.expectEmit(true, true, false, true);
        emit ActiveSetCommitmentUpdated(1, expectedCommitment, expectedRoot, 1, block.number);
        _register(prover1, pubKey1);
    }

    function testViewMatchesStoredCommitment() public {
        _register(prover1, pubKey1);
        _register(prover2, pubKey2);

        (bytes32 root, bytes32 commitment) = registry.computeActiveSetCommitment();
        (bytes32 stored, ) = registry.getActiveSetCommitment();
        assertEq(commitment, stored);
        assertEq(root, registry.getActiveSetCheckpoint(2).root);
    }

    // =========================================================================
    // Exit / slash update the commitment
    // =========================================================================

    function testExitUpdatesCommitment() public {
        _register(prover1, pubKey1);
        _register(prover2, pubKey2);

        vm.prank(prover1);
        registry.requestExit();

        assertEq(registry.activeSetEpoch(), 3);
        // swap-remove: prover2 is now the only (and first) member
        (bytes32 commitment, ) = registry.getActiveSetCommitment();
        assertEq(commitment, _expectedCommitment(_leaf(prover2, pubKey2), 1));
    }

    function testSlashBelowMinStakeUpdatesCommitment() public {
        _register(prover1, pubKey1);
        _register(prover2, pubKey2);
        registry.addAuthorizedSlasher(address(this));

        registry.slash(prover1, 1 ether, bytes32("test"));

        assertEq(registry.activeSetEpoch(), 3);
        assertFalse(registry.isActiveProver(prover1));
        (bytes32 commitment, ) = registry.getActiveSetCommitment();
        assertEq(commitment, _expectedCommitment(_leaf(prover2, pubKey2), 1));
    }

    function testPartialSlashKeepsCommitment() public {
        _register(prover1, pubKey1);
        _register(prover2, pubKey2);
        registry.addAuthorizedSlasher(address(this));
        uint64 epochBefore = registry.activeSetEpoch();

        // slash of 0 keeps the stake at min stake, so the set must not change
        registry.slash(prover1, 0, bytes32("noop"));

        assertEq(registry.activeSetEpoch(), epochBefore);
        assertTrue(registry.isActiveProver(prover1));
    }

    function testSlashDuringUnbondingDoesNotCorruptActiveList() public {
        _register(prover1, pubKey1);
        _register(prover2, pubKey2);
        registry.addAuthorizedSlasher(address(this));

        // prover1 exits (already removed from the active list)
        vm.prank(prover1);
        registry.requestExit();
        uint64 epochAfterExit = registry.activeSetEpoch();

        // slashing an unbonding prover must not touch the active list again
        registry.slash(prover1, 1 ether, bytes32("late"));

        assertEq(registry.activeSetEpoch(), epochAfterExit);
        assertEq(registry.getActiveProverCount(), 1);
        assertEq(registry.getActiveProvers()[0], prover2);
        (bytes32 commitment, ) = registry.getActiveSetCommitment();
        assertEq(commitment, _expectedCommitment(_leaf(prover2, pubKey2), 1));
    }

    // =========================================================================
    // History
    // =========================================================================

    function testHistoricalCommitmentsStayKnown() public {
        (bytes32 genesisCommitment, ) = registry.getActiveSetCommitment();

        _register(prover1, pubKey1);
        (bytes32 epoch1Commitment, ) = registry.getActiveSetCommitment();

        _register(prover2, pubKey2);

        assertTrue(registry.isKnownActiveSetCommitment(genesisCommitment));
        assertTrue(registry.isKnownActiveSetCommitment(epoch1Commitment));
        assertFalse(registry.isKnownActiveSetCommitment(bytes32(uint256(0xdead))));
    }

    function testCheckpointHistoryQueryable() public {
        _register(prover1, pubKey1);
        vm.roll(block.number + 5);
        _register(prover2, pubKey2);

        IProverRegistry.SetCheckpoint memory cp1 = registry.getActiveSetCheckpoint(1);
        IProverRegistry.SetCheckpoint memory cp2 = registry.getActiveSetCheckpoint(2);

        assertEq(cp1.proverCount, 1);
        assertEq(cp2.proverCount, 2);
        assertEq(cp2.blockNumber, cp1.blockNumber + 5);
        assertTrue(cp1.commitment != cp2.commitment);
    }

    function testUnknownEpochReturnsZeroedCheckpoint() public view {
        IProverRegistry.SetCheckpoint memory cp = registry.getActiveSetCheckpoint(99);
        assertEq(cp.commitment, bytes32(0));
        assertEq(cp.proverCount, 0);
    }

    // =========================================================================
    // Bounds
    // =========================================================================

    function testRegistrationRevertsWhenSetFull() public {
        ProverRegistry testnetRegistry = new ProverRegistry(council, true);

        for (uint256 i = 0; i < testnetRegistry.MAX_ACTIVE_PROVERS(); i++) {
            testnetRegistry.registerProverTestnet(
                address(uint160(0x1000 + i)),
                _pubKey(uint8(i + 1))
            );
        }
        assertEq(testnetRegistry.getActiveProverCount(), testnetRegistry.MAX_ACTIVE_PROVERS());

        vm.expectRevert(ProverRegistry.ActiveProverSetFull.selector);
        testnetRegistry.registerProverTestnet(address(0x9999), _pubKey(0xFF));
    }
}
