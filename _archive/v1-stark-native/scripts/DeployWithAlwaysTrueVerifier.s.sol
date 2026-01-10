// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../../contracts/QuantumShieldBridge.sol";
import "../../contracts/verifiers/AlwaysTrueVerifier.sol";

/// @title DeployWithAlwaysTrueVerifier - Deploy with demo verifier
/// @notice Deploys Bridge + AlwaysTrueVerifier for demo testing
/// @dev ONLY FOR TESTNET - No real proof verification
contract DeployWithAlwaysTrueVerifier is Script {
    uint256 constant SEPOLIA_CHAIN_ID = 11155111;

    function run() external {
        require(block.chainid == SEPOLIA_CHAIN_ID, "Must deploy to Sepolia");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=============================================================");
        console.log("  Quantum Shield Bridge - Demo Deployment (AlwaysTrueVerifier)");
        console.log("=============================================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");
        console.log("");
        console.log("WARNING: This deployment uses AlwaysTrueVerifier");
        console.log("         No proof verification will be performed!");
        console.log("");

        require(deployer.balance >= 0.005 ether, "Insufficient balance");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy AlwaysTrueVerifier
        console.log("Step 1: Deploying AlwaysTrueVerifier...");
        AlwaysTrueVerifier verifier = new AlwaysTrueVerifier();
        address verifierAddress = address(verifier);
        console.log("  AlwaysTrueVerifier deployed at:", verifierAddress);

        // Step 2: Deploy QuantumShieldBridge
        console.log("");
        console.log("Step 2: Deploying QuantumShieldBridge...");
        QuantumShieldBridge bridge = new QuantumShieldBridge(verifierAddress);
        address bridgeAddress = address(bridge);
        console.log("  QuantumShieldBridge deployed at:", bridgeAddress);

        // Step 3: Verify
        console.log("");
        console.log("Step 3: Verifying deployment...");
        require(address(bridge.verifier()) == verifierAddress, "Verifier not connected");
        console.log("  Verifier connected: OK");
        console.log("  Verifier type:", bridge.getVerifierType());
        console.log("  Quantum resistant:", bridge.isQuantumResistant());

        vm.stopBroadcast();

        // Save deployment info
        string memory deploymentInfo = string(
            abi.encodePacked(
                '{\n',
                '  "network": "sepolia",\n',
                '  "chainId": ', vm.toString(block.chainid), ',\n',
                '  "verifier": "', vm.toString(verifierAddress), '",\n',
                '  "bridge": "', vm.toString(bridgeAddress), '",\n',
                '  "verifierType": "AlwaysTrueVerifier",\n',
                '  "deployer": "', vm.toString(deployer), '",\n',
                '  "timestamp": "', vm.toString(block.timestamp), '"\n',
                '}'
            )
        );

        vm.writeFile("deployments/sepolia-demo.json", deploymentInfo);
        console.log("");
        console.log("Saved to: deployments/sepolia-demo.json");

        console.log("");
        console.log("=============================================================");
        console.log("  Deployment Complete!");
        console.log("=============================================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  AlwaysTrueVerifier:", verifierAddress);
        console.log("  QuantumShieldBridge:", bridgeAddress);
        console.log("");
        console.log("UPDATE FRONTEND:");
        console.log("  web/public/index.html - BRIDGE_ADDRESS =", bridgeAddress);
    }
}
