// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {L1Vault} from "../src/L1Vault.sol";
import {ProverRegistry} from "../src/ProverRegistry.sol";

/// @title DeployL1VaultV3 - Deploy L1 Vault with ProverRegistry integration
/// @notice SEQUENCES.md v3.0: L1Vault with external ProverRegistry support
contract DeployL1VaultV3 is Script {
    // Already deployed ProverRegistry on Sepolia
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

        console.log("Deploying L1Vault v3.0 with ProverRegistry support...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy new L1Vault
        console.log("\nStep 1: Deploying L1Vault...");
        L1Vault vault = new L1Vault(
            deployer,   // securityCouncil (deployer for testnet)
            address(0)  // sphincsVerifier (not set yet)
        );
        console.log("L1Vault deployed at:", address(vault));

        // Step 2: Set ProverRegistry on L1Vault
        console.log("\nStep 2: Setting ProverRegistry...");
        vault.setProverRegistry(PROVER_REGISTRY);
        console.log("ProverRegistry linked");

        // Step 3: Register Provers in Registry (if not already registered)
        ProverRegistry registry = ProverRegistry(payable(PROVER_REGISTRY));

        if (!registry.isActiveProver(PROVER_001)) {
            console.log("\nStep 3a: Registering Prover 001...");
            registry.registerProverTestnet(PROVER_001, SPHINCS_PUBKEY_001);
            console.log("Prover 001 registered");
        } else {
            console.log("\nStep 3a: Prover 001 already registered");
        }

        if (!registry.isActiveProver(PROVER_002)) {
            console.log("\nStep 3b: Registering Prover 002...");
            registry.registerProverTestnet(PROVER_002, SPHINCS_PUBKEY_002);
            console.log("Prover 002 registered");
        } else {
            console.log("\nStep 3b: Prover 002 already registered");
        }

        // Step 4: Add L1Vault as authorized slasher
        console.log("\nStep 4: Adding L1Vault as authorized slasher...");
        registry.addAuthorizedSlasher(address(vault));
        console.log("L1Vault authorized for slashing");

        vm.stopBroadcast();

        // Verification
        console.log("\n=== Deployment Summary ===");
        console.log("L1Vault:", address(vault));
        console.log("ProverRegistry:", PROVER_REGISTRY);
        console.log("Vault Owner:", vault.owner());
        console.log("Vault ProverRegistry:", address(vault.proverRegistry()));
        console.log("Active Provers:", registry.getActiveProverCount());
        console.log("Prover 001 active:", registry.isActiveProver(PROVER_001));
        console.log("Prover 002 active:", registry.isActiveProver(PROVER_002));
    }
}
