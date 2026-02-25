// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {L1Vault} from "../src/L1Vault.sol";
import {ProverRegistry} from "../src/ProverRegistry.sol";

/// @title ConfigureVaultAndProvers - Configure L1 Vault with Registry and register Provers
/// @notice SEQUENCES.md v3.0: Link Vault to Registry and register AI Provers
contract ConfigureVaultAndProvers is Script {
    // Deployed contract addresses on Sepolia
    address constant L1_VAULT = 0x6F889C00a5e674ab0b9403AfBa0fBEbe30511c67;
    address constant PROVER_REGISTRY = 0x08e1fc1A0d614bc132B48950760c7A291cCB8946;

    // Prover addresses (placeholder addresses for AI Provers)
    address constant PROVER_001 = 0x0000000000000000000000000000000000000001;
    address constant PROVER_002 = 0x0000000000000000000000000000000000000002;

    // Placeholder SPHINCS+ public keys (32 bytes each)
    bytes constant SPHINCS_PUBKEY_001 = hex"0101010101010101010101010101010101010101010101010101010101010101";
    bytes constant SPHINCS_PUBKEY_002 = hex"0202020202020202020202020202020202020202020202020202020202020202";

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Configuring Vault and Provers...");
        console.log("Deployer:", deployer);
        console.log("L1 Vault:", L1_VAULT);
        console.log("Prover Registry:", PROVER_REGISTRY);

        L1Vault vault = L1Vault(payable(L1_VAULT));
        ProverRegistry registry = ProverRegistry(payable(PROVER_REGISTRY));

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Set ProverRegistry on L1Vault
        console.log("Step 1: Setting ProverRegistry on L1Vault...");
        vault.setProverRegistry(PROVER_REGISTRY);
        console.log("ProverRegistry set successfully");

        // Step 2: Register Prover 001
        console.log("Step 2: Registering Prover 001...");
        registry.registerProverTestnet(PROVER_001, SPHINCS_PUBKEY_001);
        console.log("Prover 001 registered");

        // Step 3: Register Prover 002
        console.log("Step 3: Registering Prover 002...");
        registry.registerProverTestnet(PROVER_002, SPHINCS_PUBKEY_002);
        console.log("Prover 002 registered");

        vm.stopBroadcast();

        // Verify configuration
        console.log("\n=== Verification ===");
        console.log("Vault ProverRegistry:", address(vault.proverRegistry()));
        console.log("Registry Active Provers:", registry.getActiveProverCount());
        console.log("Prover 001 active:", registry.isActiveProver(PROVER_001));
        console.log("Prover 002 active:", registry.isActiveProver(PROVER_002));
    }
}
