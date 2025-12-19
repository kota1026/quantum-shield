// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../../contracts/verifiers/SP1VerifierAdapter.sol";

/// @title Deploy SP1 Verifier Adapter to Sepolia
/// @notice Deploys the SP1VerifierAdapter with a placeholder vkey
///         The vkey should be updated after generating the SP1 proof
contract DeploySP1Adapter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // SP1 Dilithium program verification key (generated from cargo prove vkey)
        // Updated: 2025-12-19 from sp1-bench/program
        bytes32 programVKey = 0x0013da861b2d38d6fa5ca2495d1fbb64a68410cbc1541498247dad9de042bf17;

        vm.startBroadcast(deployerPrivateKey);

        SP1VerifierAdapter adapter = new SP1VerifierAdapter(programVKey);

        vm.stopBroadcast();

        console.log("=== SP1 Verifier Adapter Deployment ===");
        console.log("Adapter Address:", address(adapter));
        console.log("Program VKey:", vm.toString(programVKey));
        console.log("SP1 Verifier (Sepolia):", adapter.getSP1Verifier());
        console.log("");
        console.log("Next steps:");
        console.log("1. Build SP1 program: cd sp1-bench/program && cargo prove build");
        console.log("2. Get vkey: cargo prove vkey --elf target/elf-compilation/.../dilithium-sp1-program");
        console.log("3. Deploy with real vkey or update adapter");
    }
}
