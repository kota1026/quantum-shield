// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IProverRegistry} from "./interfaces/IProverRegistry.sol";
import {SHA3_256} from "./libraries/SHA3_256.sol";

/// @title RegistrySetCommitment - FR-THRESH-5 prover-set commitment
/// @notice Maintains block-stamped SHA3-256 Merkle commitments over the
///         active prover set of the ProverRegistry:
///         leaf = SHA3-256(sphincsPublicKey), node = SHA3-256(left || right),
///         zero leaves pad the set to the next power of two.
/// @dev Byte-compatible with the circuit-side registry
///      (src/crypto/circuits/threshold-m3/src/registry.rs, FIPS 202
///      SHA3-256), so the same root C anchors both on-chain native
///      membership checks (verifyMembership) and in-circuit membership
///      proofs. Unlock flows reference a commitment by its epoch, fixing
///      "the active set at block B" for FR-THRESH-1.
contract RegistrySetCommitment {
    struct Snapshot {
        bytes32 root;
        uint64 blockNumber;
        uint32 proverCount;
        uint8 treeHeight;
    }

    IProverRegistry public immutable registry;
    Snapshot[] internal snapshots;

    event SnapshotTaken(
        uint256 indexed epoch, bytes32 root, uint32 proverCount, uint8 treeHeight
    );

    error NoSnapshot();

    constructor(address _registry) {
        registry = IProverRegistry(_registry);
    }

    /// @notice Commit the current active prover set. Permissionless: the
    ///         root is deterministic in the registry state, so the worst a
    ///         caller can do is pay for an extra epoch.
    function snapshot() external returns (uint256 epoch, bytes32 root) {
        address[] memory provers = registry.getActiveProvers();
        uint256 n = provers.length;
        uint256 size = 1;
        uint8 height = 0;
        while (size < n) {
            size <<= 1;
            height++;
        }
        bytes32[] memory nodes = new bytes32[](size);
        for (uint256 i = 0; i < n; i++) {
            nodes[i] = SHA3_256.hash(registry.getPublicKey(provers[i]));
        }
        // Unused positions keep the zero leaf, matching the circuit side.
        uint256 width = size;
        while (width > 1) {
            width >>= 1;
            for (uint256 i = 0; i < width; i++) {
                nodes[i] = SHA3_256.hashPair(nodes[2 * i], nodes[2 * i + 1]);
            }
        }
        root = nodes[0];
        epoch = snapshots.length;
        snapshots.push(
            Snapshot(root, uint64(block.number), uint32(n), height)
        );
        emit SnapshotTaken(epoch, root, uint32(n), height);
    }

    function snapshotCount() external view returns (uint256) {
        return snapshots.length;
    }

    function latest() external view returns (Snapshot memory s) {
        if (snapshots.length == 0) revert NoSnapshot();
        return snapshots[snapshots.length - 1];
    }

    function snapshotAt(uint256 epoch) external view returns (Snapshot memory) {
        return snapshots[epoch];
    }

    function rootAt(uint256 epoch) external view returns (bytes32) {
        return snapshots[epoch].root;
    }

    function heightAt(uint256 epoch) external view returns (uint8) {
        return snapshots[epoch].treeHeight;
    }

    /// @notice Native membership check: SHA3-256 Merkle path from
    ///         leaf = SHA3-256(sphincsPublicKey) at `index` up to `root`.
    /// @dev Sibling j is the node at level j next to the running node; the
    ///      running node is the left child when bit j of `index` is 0.
    function verifyMembership(
        bytes32 root,
        bytes memory sphincsPublicKey,
        uint256 index,
        bytes32[] memory path
    ) public pure returns (bool) {
        bytes32 node = SHA3_256.hash(sphincsPublicKey);
        for (uint256 j = 0; j < path.length; j++) {
            node = (index >> j) & 1 == 0
                ? SHA3_256.hashPair(node, path[j])
                : SHA3_256.hashPair(path[j], node);
        }
        return node == root;
    }
}
