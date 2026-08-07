// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ProverRegistry} from "../src/ProverRegistry.sol";

/// @title ProverSetCommitmentVectors - reference vectors for the STARK circuit
/// @notice Emits the FR-THRESH-5 active-set root/commitment for deterministic
///         prover sets, so the circuit-side (Rust) implementation in
///         `src/crypto/circuits/sphincs-m3` can be pinned against this
///         contract rather than against itself.
/// @dev Run with: forge test --match-contract ProverSetCommitmentVectors -vv
contract ProverSetCommitmentVectorsTest is Test {
    ProverRegistry public registry;

    function setUp() public {
        registry = new ProverRegistry(makeAddr("council"), true);
    }

    /// @notice Deterministic prover address for index i (must match the Rust side)
    function _proverAddress(uint256 i) internal pure returns (address) {
        return address(uint160(0x1000 + i));
    }

    /// @notice Deterministic SPHINCS+ public key for index i (must match Rust)
    function _pubKey(uint256 i) internal pure returns (bytes memory key) {
        key = new bytes(32);
        for (uint256 j = 0; j < 32; j++) {
            key[j] = bytes1(uint8((i + 1) ^ j));
        }
    }

    /// @notice Log root/commitment as the active set grows from 0 to 5 members.
    function testEmitVectors() public {
        emit log_named_bytes32("LEAF_DOMAIN", registry.LEAF_DOMAIN());
        emit log_named_bytes32("NODE_DOMAIN", registry.NODE_DOMAIN());
        emit log_named_bytes32("SET_DOMAIN", registry.SET_DOMAIN());

        for (uint256 count = 0; count <= 5; count++) {
            if (count > 0) {
                registry.registerProverTestnet(_proverAddress(count - 1), _pubKey(count - 1));
            }
            (bytes32 root, bytes32 commitment) = registry.computeActiveSetCommitment();

            emit log_named_uint("count", count);
            emit log_named_bytes32("  root", root);
            emit log_named_bytes32("  commitment", commitment);
        }
    }

    /// @notice Log one leaf so the Rust side can pin the leaf encoding alone.
    function testEmitLeafVector() public {
        bytes32 pubKeyHash = registry.computeSetLeaf(address(0), bytes32(0));
        emit log_named_bytes32("leaf(addr=0, pkHash=0)", pubKeyHash);

        bytes32 leaf = registry.computeSetLeaf(
            _proverAddress(0),
            bytes32(uint256(0x1122334455667788990011223344556677889900112233445566778899001122))
        );
        emit log_named_bytes32("leaf(addr=0x1000, pkHash=0x1122..)", leaf);
    }
}
