// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1Vault.sol";
import "../src/ProverRegistry.sol";

/// @title GasBenchmark - Comprehensive gas benchmark for all L1 operations
/// @notice Generates gas usage report for Phase E performance analysis
///
/// Usage (local Anvil):
///   anvil &
///   forge script script/GasBenchmark.s.sol:GasBenchmark --rpc-url http://localhost:8545 --broadcast -vvv
///
/// Usage (Sepolia fork):
///   forge script script/GasBenchmark.s.sol:GasBenchmark --fork-url $SEPOLIA_RPC --broadcast -vvv
contract GasBenchmark is Script {
    // Test parameters
    bytes constant DILITHIUM_PUBKEY = hex"0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101";
    bytes constant SPHINCS_PUBKEY = hex"0101010101010101010101010101010101010101010101010101010101010101";

    function run() external {
        uint256 pk = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)); // Anvil default
        address deployer = vm.addr(pk);

        console.log("========================================");
        console.log("  Quantum Shield Gas Benchmark Report");
        console.log("========================================");
        console.log("Block number:", block.number);
        console.log("Gas price:", tx.gasprice);
        console.log("Deployer:", deployer);
        console.log("");

        vm.startBroadcast(pk);

        // --- Deploy Contracts ---
        console.log("--- Deploying Contracts ---");
        uint256 g0 = gasleft();
        ProverRegistry registry = new ProverRegistry(deployer);
        uint256 deployRegistryGas = g0 - gasleft();

        g0 = gasleft();
        L1Vault vault = new L1Vault(deployer, address(0));
        uint256 deployVaultGas = g0 - gasleft();

        vault.setProverRegistry(address(registry));

        // Register test provers
        registry.registerProverTestnet(address(0x1), SPHINCS_PUBKEY);
        registry.registerProverTestnet(address(0x2), SPHINCS_PUBKEY);

        // --- Operation 1: Lock ---
        console.log("\n--- Operation 1: Lock ---");
        g0 = gasleft();
        bytes32 lockId1 = vault.lock{value: 1 ether}(deployer, DILITHIUM_PUBKEY);
        uint256 lockGas = g0 - gasleft();
        console.log("  lock() gas:", lockGas);

        // --- Operation 2: Lock (second, to test storage warm) ---
        g0 = gasleft();
        bytes32 lockId2 = vault.lock{value: 0.5 ether}(deployer, DILITHIUM_PUBKEY);
        uint256 lockGas2 = g0 - gasleft();
        console.log("  lock() gas (warm):", lockGas2);

        // --- Operation 3: Emergency Unlock ---
        console.log("\n--- Operation 3: Emergency Unlock ---");
        uint256 bond = vault.calculateEmergencyBond(1 ether);
        console.log("  bond required:", bond);

        g0 = gasleft();
        vault.requestEmergencyUnlock{value: bond}(lockId1, deployer);
        uint256 emergencyUnlockGas = g0 - gasleft();
        console.log("  requestEmergencyUnlock() gas:", emergencyUnlockGas);

        // --- Operation 4: Calculate Emergency Bond ---
        console.log("\n--- Operation 4: Bond Calculation ---");
        g0 = gasleft();
        vault.calculateEmergencyBond(10 ether);
        uint256 bondCalcGas = g0 - gasleft();
        console.log("  calculateEmergencyBond() gas:", bondCalcGas);

        // --- Operation 5: Prover Registration ---
        console.log("\n--- Operation 5: Prover Registration ---");
        g0 = gasleft();
        registry.registerProverTestnet(address(0x3), SPHINCS_PUBKEY);
        uint256 registerProverGas = g0 - gasleft();
        console.log("  registerProverTestnet() gas:", registerProverGas);

        // --- Operation 6: Check Active Prover ---
        console.log("\n--- Operation 6: View Operations ---");
        g0 = gasleft();
        registry.isActiveProver(address(0x1));
        uint256 isActiveGas = g0 - gasleft();
        console.log("  isActiveProver() gas:", isActiveGas);

        g0 = gasleft();
        registry.getActiveProvers();
        uint256 getProversGas = g0 - gasleft();
        console.log("  getActiveProvers() gas:", getProversGas);

        vm.stopBroadcast();

        // --- Summary Report ---
        console.log("\n========================================");
        console.log("  GAS SUMMARY REPORT");
        console.log("========================================");
        console.log("Deploy:");
        console.log("  ProverRegistry deploy:", deployRegistryGas);
        console.log("  L1Vault deploy:", deployVaultGas);
        console.log("");
        console.log("Write Operations:");
        console.log("  lock() [cold]:", lockGas);
        console.log("  lock() [warm]:", lockGas2);
        console.log("  requestEmergencyUnlock():", emergencyUnlockGas);
        console.log("  registerProverTestnet():", registerProverGas);
        console.log("");
        console.log("Read Operations:");
        console.log("  calculateEmergencyBond():", bondCalcGas);
        console.log("  isActiveProver():", isActiveGas);
        console.log("  getActiveProvers():", getProversGas);
        console.log("========================================");

        // Cost estimates at different gas prices
        console.log("\nCost Estimates (ETH):");
        console.log("  At 20 gwei:");
        console.log("    lock():", lockGas * 20);
        console.log("    emergencyUnlock():", emergencyUnlockGas * 20);
        console.log("  At 50 gwei:");
        console.log("    lock():", lockGas * 50);
        console.log("    emergencyUnlock():", emergencyUnlockGas * 50);
    }
}
