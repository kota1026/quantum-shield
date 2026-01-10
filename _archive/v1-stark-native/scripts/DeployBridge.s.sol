// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../../contracts/QuantumShieldBridge.sol";
import "../../contracts/verifiers/SP1Groth16Verifier.sol";

/// @title DeployBridge - Deployment Script for Quantum Shield Bridge
/// @notice Deploys the bridge and verifier contracts
contract DeployBridge is Script {
    function run() external {
        // Get deployment parameters from environment
        bytes32 vkHash = vm.envOr("VK_HASH", keccak256("sp1_vk_placeholder"));

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy verifier first
        SP1Groth16Verifier verifier = new SP1Groth16Verifier(vkHash);
        console.log("SP1Groth16Verifier deployed at:", address(verifier));

        // Deploy bridge with verifier
        QuantumShieldBridge bridge = new QuantumShieldBridge(address(verifier));
        console.log("QuantumShieldBridge deployed at:", address(bridge));

        // Log configuration
        console.log("Configuration:");
        console.log("  Verifier type:", bridge.getVerifierType());
        console.log("  Quantum resistant:", bridge.isQuantumResistant());
        console.log("  Owner:", bridge.owner());

        vm.stopBroadcast();

        // Write deployment addresses to file
        string memory deploymentInfo = string(abi.encodePacked(
            '{"verifier":"', vm.toString(address(verifier)),
            '","bridge":"', vm.toString(address(bridge)),
            '","vkHash":"', vm.toString(vkHash),
            '","network":"', vm.toString(block.chainid),
            '"}'
        ));

        vm.writeFile("deployments/latest.json", deploymentInfo);
    }
}

/// @title UpgradeVerifier - Script to upgrade the verifier
contract UpgradeVerifier is Script {
    function run() external {
        address bridgeAddress = vm.envAddress("BRIDGE_ADDRESS");
        bytes32 newVkHash = vm.envBytes32("NEW_VK_HASH");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new verifier
        SP1Groth16Verifier newVerifier = new SP1Groth16Verifier(newVkHash);
        console.log("New SP1Groth16Verifier deployed at:", address(newVerifier));

        // Upgrade bridge to use new verifier
        QuantumShieldBridge bridge = QuantumShieldBridge(payable(bridgeAddress));
        bridge.updateVerifier(address(newVerifier));
        console.log("Bridge verifier updated");

        vm.stopBroadcast();
    }
}
