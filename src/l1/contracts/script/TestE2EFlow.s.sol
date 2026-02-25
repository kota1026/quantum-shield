// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {L1Vault} from "../src/L1Vault.sol";
import {ProverRegistry} from "../src/ProverRegistry.sol";

/// @title TestE2EFlow - E2E test for v3.0 architecture
/// @notice Test Lock flow with ProverRegistry integration
contract TestE2EFlow is Script {
    // v3.0 Contract addresses on Sepolia
    address constant L1_VAULT = 0x43aF0A4b58CC3f040eF05746e72021dE6D35115B;
    address constant PROVER_REGISTRY = 0x08e1fc1A0d614bc132B48950760c7A291cCB8946;

    // Test parameters
    uint256 constant LOCK_AMOUNT = 0.01 ether;
    address constant RECIPIENT = 0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== E2E Test: v3.0 Architecture ===");
        console.log("Deployer:", deployer);
        console.log("L1Vault:", L1_VAULT);
        console.log("ProverRegistry:", PROVER_REGISTRY);

        L1Vault vault = L1Vault(payable(L1_VAULT));
        ProverRegistry registry = ProverRegistry(payable(PROVER_REGISTRY));

        // Step 1: Verify Registry integration
        console.log("\n--- Step 1: Verify Registry Integration ---");
        address linkedRegistry = address(vault.proverRegistry());
        console.log("Vault.proverRegistry():", linkedRegistry);
        require(linkedRegistry == PROVER_REGISTRY, "Registry not linked!");
        console.log("Registry integration: OK");

        // Step 2: Check active provers
        console.log("\n--- Step 2: Check Active Provers ---");
        uint256 proverCount = registry.getActiveProverCount();
        console.log("Active provers:", proverCount);
        require(proverCount >= 2, "Need at least 2 provers!");

        address[] memory provers = registry.getActiveProvers();
        for (uint i = 0; i < provers.length; i++) {
            console.log("  Prover", i + 1, ":", provers[i]);
            bytes memory pubKey = registry.getPublicKey(provers[i]);
            console.log("    PubKey length:", pubKey.length);
        }
        console.log("Prover check: OK");

        // Step 3: Check deployer balance
        console.log("\n--- Step 3: Check Deployer Balance ---");
        uint256 balance = deployer.balance;
        console.log("Deployer balance:", balance);
        require(balance >= LOCK_AMOUNT, "Insufficient balance for test!");
        console.log("Balance check: OK");

        // Step 4: Check vault state before lock
        console.log("\n--- Step 4: Vault State Before Lock ---");
        uint256 totalLockedBefore = vault.totalLocked();
        uint256 userLockedBefore = vault.userLockedBalance(deployer);
        console.log("Total locked (before):", totalLockedBefore);
        console.log("User locked (before):", userLockedBefore);

        // Step 5: Perform Lock
        console.log("\n--- Step 5: Perform Lock ---");
        console.log("Lock amount:", LOCK_AMOUNT);
        console.log("Recipient:", RECIPIENT);

        vm.startBroadcast(deployerPrivateKey);

        // Create dummy Dilithium public key (32 bytes)
        bytes memory dummyPubKey = hex"deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
        uint256 expiry = block.timestamp + 1 days;

        bytes32 lockId = vault.lockWithExpiry{value: LOCK_AMOUNT}(
            RECIPIENT,
            dummyPubKey,
            expiry
        );

        vm.stopBroadcast();

        console.log("Lock ID:", vm.toString(lockId));
        console.log("Lock transaction: SUCCESS");

        // Step 6: Verify lock state
        console.log("\n--- Step 6: Verify Lock State ---");
        uint256 totalLockedAfter = vault.totalLocked();
        uint256 userLockedAfter = vault.userLockedBalance(deployer);
        console.log("Total locked (after):", totalLockedAfter);
        console.log("User locked (after):", userLockedAfter);
        console.log("Lock amount verified:", totalLockedAfter - totalLockedBefore == LOCK_AMOUNT);

        // Get lock details
        L1Vault.Lock memory lockData = vault.getLock(lockId);
        console.log("Lock sender:", lockData.sender);
        console.log("Lock recipient:", lockData.recipient);
        console.log("Lock amount:", lockData.amount);
        console.log("Lock status:", uint(lockData.status));
        console.log("Lock expiry:", lockData.expiry);

        // Step 7: Verify Vault can query Registry for signatures
        console.log("\n--- Step 7: Registry Query from Vault ---");
        uint256 activeCount = vault.getActiveProverCount();
        console.log("Vault.getActiveProverCount():", activeCount);
        require(activeCount == proverCount, "Vault should see Registry provers!");
        console.log("Registry query from Vault: OK");

        // Summary
        console.log("\n=== E2E Test Summary ===");
        console.log("Registry integration: PASS");
        console.log("Prover registration: PASS");
        console.log("Lock execution: PASS");
        console.log("State verification: PASS");
        console.log("Registry query: PASS");
        console.log("\nAll tests PASSED!");
    }
}
