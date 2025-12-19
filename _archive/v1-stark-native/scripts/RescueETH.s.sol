// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../../contracts/QuantumShieldBridge.sol";
import "../../contracts/verifiers/AlwaysTrueVerifier.sol";

/// @title RescueETH - Emergency rescue script for testnet locked funds
/// @notice This script deploys AlwaysTrueVerifier and updates the bridge to rescue mode
/// @dev ONLY FOR TESTNET - This bypasses all security checks!
contract RescueETH is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address payable bridgeAddress = payable(0x32aec14Aa82b7f8a5d85df04c16418a957E958b6);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy rescue verifier
        AlwaysTrueVerifier rescueVerifier = new AlwaysTrueVerifier();
        console.log("Rescue Verifier deployed at:", address(rescueVerifier));

        // 2. Update bridge verifier to rescue mode
        QuantumShieldBridge bridge = QuantumShieldBridge(bridgeAddress);
        bridge.updateVerifier(address(rescueVerifier));
        console.log("Bridge verifier updated to rescue mode.");

        // 3. Verify the update
        string memory verifierType = bridge.getVerifierType();
        console.log("New verifier type:", verifierType);

        vm.stopBroadcast();

        console.log("");
        console.log("=== RESCUE MODE ENABLED ===");
        console.log("Bridge is now in rescue mode. Any proof will be accepted.");
        console.log("You can now call release() with any proof to recover locked ETH.");
        console.log("");
        console.log("WARNING: This is INSECURE. Only use on testnet!");
    }
}
