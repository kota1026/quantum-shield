// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../../contracts/src/OptimisticQuantumBridge.sol";

/// @title Deploy Optimistic Quantum Bridge
/// @notice Deploys the Phase 1 Optimistic Attestation bridge contract
contract DeployOptimisticBridge is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        OptimisticQuantumBridge bridge = new OptimisticQuantumBridge();

        console.log("OptimisticQuantumBridge deployed at:", address(bridge));
        console.log("Owner:", bridge.owner());
        console.log("Challenge window:", bridge.CHALLENGE_WINDOW() / 1 days, "days");
        console.log("Min prover stake:", bridge.MIN_PROVER_STAKE() / 1 ether, "ETH");

        vm.stopBroadcast();
    }
}
