// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ProverRegistry} from "../src/ProverRegistry.sol";

/// @title DeployProverRegistry - Deploy Prover Registry to Sepolia
/// @notice SEQUENCES.md v3.0: Separate Prover management from L1 Vault
contract DeployProverRegistry is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying ProverRegistry...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ProverRegistry with deployer as security council, testnet mode enabled
        ProverRegistry registry = new ProverRegistry(
            deployer,  // securityCouncil (deployer for testnet)
            true       // testnetMode = true (no stake required)
        );

        console.log("ProverRegistry deployed at:", address(registry));
        console.log("Testnet mode:", registry.testnetMode());
        console.log("Owner:", registry.owner());

        vm.stopBroadcast();
    }
}
