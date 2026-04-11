// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {L1Vault} from "../src/L1Vault.sol";
import {ProverRegistry} from "../src/ProverRegistry.sol";

/// @title ConfigureVaultAndProvers - Configure L1 Vault with Registry and register Provers
/// @notice SEQUENCES.md v3.0: Link Vault to Registry and register AI Provers
///
/// Phase 1 honest bridge (2026-04-11):
///   - Off-chain verification: real SLH-DSA-SHAKE-128s (FIPS 205) in Rust backend
///   - On-chain enforcement: identity gate only (_verifySimplified path)
///     useFullVerification=false because the deployed SPHINCSVerifier.sol is a
///     Phase-1 stub whose Merkle-climb incorrectly assumes leaf index 0.
///     Phase 2 will replace it with a STARK proof of off-chain verification.
///
/// Prover keypairs:
///   secrets/provers/prover1.env  (SLH-DSA pk=32B sk=64B, gitignored)
///   secrets/provers/prover2.env
///
/// Run:
///   cd src/l1/contracts
///   export PRIVATE_KEY=<deployer_hex_no_0x>
///   export SEPOLIA_RPC_URL=https://rpc.sepolia.org   # or Alchemy/Infura
///   forge script script/ConfigureVaultAndProvers.s.sol \
///     --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
contract ConfigureVaultAndProvers is Script {
    // ── Current Sepolia deployments (default.yaml) ───────────────────────────
    address constant L1_VAULT         = 0x07012aeF87C6E423c32F2f8eaF81762f63337260;
    address constant PROVER_REGISTRY  = 0x08e1fc1A0d614bc132B48950760c7A291cCB8946;

    // ── Operator addresses (on-chain identifiers for AI Provers) ─────────────
    address constant PROVER_001 = 0x0000000000000000000000000000000000000001;
    address constant PROVER_002 = 0x0000000000000000000000000000000000000002;

    // ── Real SLH-DSA-SHAKE-128s public keys (NIST FIPS 205) ─────────────────
    // Generated 2026-04-11 via keygen.ts; full keypairs in secrets/provers/*.env
    // pk=32 bytes, sk=64 bytes, sig=7856 bytes
    bytes constant SPHINCS_PUBKEY_001 =
        hex"45fc636754a029a1e5412beaaa05657dcb9881a0a1fe138f9259b22771f50ed0";
    bytes constant SPHINCS_PUBKEY_002 =
        hex"7d7523153f333b86a53c21536fc769f20995adfe052c749921ef15c19d30a870";

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Quantum Shield - AI Prover Configuration (Phase 1) ===");
        console.log("Deployer       :", deployer);
        console.log("L1 Vault       :", L1_VAULT);
        console.log("Prover Registry:", PROVER_REGISTRY);
        console.log("SPHINCS PK 001 :", vm.toString(SPHINCS_PUBKEY_001));
        console.log("SPHINCS PK 002 :", vm.toString(SPHINCS_PUBKEY_002));

        L1Vault vault = L1Vault(payable(L1_VAULT));
        ProverRegistry registry = ProverRegistry(payable(PROVER_REGISTRY));

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Ensure ProverRegistry is set on L1Vault
        console.log("\nStep 1: Linking ProverRegistry to L1Vault...");
        vault.setProverRegistry(PROVER_REGISTRY);
        console.log("  OK");

        // Step 2: Switch to simplified verification (off-chain real FIPS 205,
        //         on-chain identity gate only - Phase 1 honest bridge).
        console.log("Step 2: setFullVerification(false) - Phase 1 bridge mode...");
        vault.setFullVerification(false);
        console.log("  OK: on-chain uses _verifySimplified (identity gate)");

        // Step 3: Register Prover 001 with real SLH-DSA public key
        console.log("Step 3: Registering Prover 001 with real FIPS 205 pubkey...");
        registry.registerProverTestnet(PROVER_001, SPHINCS_PUBKEY_001);
        console.log("  OK");

        // Step 4: Register Prover 002 with real SLH-DSA public key
        console.log("Step 4: Registering Prover 002 with real FIPS 205 pubkey...");
        registry.registerProverTestnet(PROVER_002, SPHINCS_PUBKEY_002);
        console.log("  OK");

        vm.stopBroadcast();

        // ── Post-broadcast verification (read-only) ───────────────────────────
        console.log("\n=== Verification (post-broadcast) ===");
        console.log("Vault.proverRegistry    :", address(vault.proverRegistry()));
        console.log("Vault.useFullVerification:", vault.useFullVerification());
        console.log("Active provers          :", registry.getActiveProverCount());
        console.log("Prover 001 active       :", registry.isActiveProver(PROVER_001));
        console.log("Prover 002 active       :", registry.isActiveProver(PROVER_002));

        bytes memory pk001 = registry.getPublicKey(PROVER_001);
        bytes memory pk002 = registry.getPublicKey(PROVER_002);
        console.log("PK 001 length (bytes):", pk001.length);
        console.log("PK 002 length (bytes):", pk002.length);

        require(!vault.useFullVerification(), "FAIL: useFullVerification should be false");
        require(registry.isActiveProver(PROVER_001), "FAIL: prover 001 not active");
        require(registry.isActiveProver(PROVER_002), "FAIL: prover 002 not active");
        require(pk001.length == 32, "FAIL: pubkey 001 wrong length");
        require(pk002.length == 32, "FAIL: pubkey 002 wrong length");

        console.log("\nAll checks passed. Phase 1 bridge is live.");
    }
}
