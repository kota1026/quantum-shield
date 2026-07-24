// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {STARKVerifier} from "../src/STARKVerifier.sol";
import {L3StateVerifier} from "../src/stark/L3StateVerifier.sol";

/// @title DeployL3StateVerifier
/// @notice Deploys the STARK verification stack consumed by the L3 CoreLayer
///         (FR-L3-1). Run against the L3 RPC (local Anvil :8545 or Arbitrum
///         Sepolia), then pass the L3StateVerifier address to the L3 deploy
///         scripts via QS_STATE_VERIFIER.
/// @dev forge script script/DeployL3StateVerifier.s.sol --rpc-url <l3-rpc> --broadcast
contract DeployL3StateVerifier is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));

        vm.startBroadcast(deployerPrivateKey);

        STARKVerifier starkVerifier = new STARKVerifier();
        console.log("STARKVerifier deployed at:", address(starkVerifier));

        L3StateVerifier stateVerifier = new L3StateVerifier(address(starkVerifier));
        console.log("L3StateVerifier deployed at:", address(stateVerifier));
        console.log("Export for L3 deploy: QS_STATE_VERIFIER=%s", address(stateVerifier));

        vm.stopBroadcast();
    }
}
