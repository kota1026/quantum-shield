// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../../contracts/QuantumShieldBridge.sol";
import "../../contracts/verifiers/SP1Groth16Verifier.sol";

/// @title DeployL2 - Multi-chain L2 Deployment Script
/// @notice Deploys Quantum Shield Bridge to various L2 testnets
contract DeployL2 is Script {
    // Chain IDs
    uint256 constant OPTIMISM_SEPOLIA_CHAIN_ID = 11155420;
    uint256 constant BASE_SEPOLIA_CHAIN_ID = 84532;
    uint256 constant ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

    function run() external {
        uint256 chainId = block.chainid;
        string memory networkName;

        if (chainId == OPTIMISM_SEPOLIA_CHAIN_ID) {
            networkName = "optimism_sepolia";
        } else if (chainId == BASE_SEPOLIA_CHAIN_ID) {
            networkName = "base_sepolia";
        } else if (chainId == ARBITRUM_SEPOLIA_CHAIN_ID) {
            networkName = "arbitrum_sepolia";
        } else {
            revert("Unsupported chain");
        }

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=============================================================");
        console.log("  Quantum Shield Bridge - L2 Deployment");
        console.log("=============================================================");
        console.log("");
        console.log("Network:", networkName);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e15, "mETH");
        console.log("");

        require(deployer.balance >= 0.001 ether, "Insufficient balance");

        bytes32 vkHash = keccak256("quantum_shield_sp1_vk_v1.0");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy SP1Groth16Verifier
        console.log("Deploying SP1Groth16Verifier...");
        SP1Groth16Verifier verifier = new SP1Groth16Verifier(vkHash);
        address verifierAddress = address(verifier);
        console.log("  Deployed at:", verifierAddress);

        // Deploy QuantumShieldBridge
        console.log("Deploying QuantumShieldBridge...");
        QuantumShieldBridge bridge = new QuantumShieldBridge(verifierAddress);
        address bridgeAddress = address(bridge);
        console.log("  Deployed at:", bridgeAddress);

        vm.stopBroadcast();

        // Save deployment info
        string memory deploymentInfo = string(
            abi.encodePacked(
                '{\n',
                '  "network": "', networkName, '",\n',
                '  "chainId": ', vm.toString(chainId), ',\n',
                '  "verifier": "', vm.toString(verifierAddress), '",\n',
                '  "bridge": "', vm.toString(bridgeAddress), '",\n',
                '  "deployer": "', vm.toString(deployer), '",\n',
                '  "timestamp": "', vm.toString(block.timestamp), '"\n',
                '}'
            )
        );

        string memory filename = string(abi.encodePacked("deployments/", networkName, ".json"));
        vm.writeFile(filename, deploymentInfo);

        console.log("");
        console.log("=============================================================");
        console.log("  Deployment Complete!");
        console.log("=============================================================");
        console.log("Verifier:", verifierAddress);
        console.log("Bridge:", bridgeAddress);
        console.log("Saved to:", filename);
    }
}

/// @title TestL2Deployment - Test L2 contract functionality
contract TestL2Deployment is Script {
    function run() external {
        string memory networkName;
        uint256 chainId = block.chainid;

        if (chainId == 11155420) {
            networkName = "optimism_sepolia";
        } else if (chainId == 84532) {
            networkName = "base_sepolia";
        } else if (chainId == 421614) {
            networkName = "arbitrum_sepolia";
        } else {
            revert("Unsupported chain");
        }

        string memory filename = string(abi.encodePacked("deployments/", networkName, ".json"));
        string memory deploymentJson = vm.readFile(filename);
        address bridgeAddress = vm.parseJsonAddress(deploymentJson, ".bridge");
        address verifierAddress = vm.parseJsonAddress(deploymentJson, ".verifier");

        console.log("=============================================================");
        console.log("  L2 Deployment Test -", networkName);
        console.log("=============================================================");
        console.log("");
        console.log("Bridge:", bridgeAddress);
        console.log("Verifier:", verifierAddress);

        QuantumShieldBridge bridge = QuantumShieldBridge(payable(bridgeAddress));

        // Check contract state
        console.log("");
        console.log("Contract State:");
        console.log("  Owner:", bridge.owner());
        console.log("  Verifier Type:", bridge.getVerifierType());
        console.log("  Total Locked:", bridge.totalLocked());

        // Test lock function
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        if (deployer.balance >= 0.0001 ether) {
            console.log("");
            console.log("Testing Lock Function:");

            vm.startBroadcast(deployerPrivateKey);

            bytes32 testPubKeyHash = keccak256(abi.encodePacked("l2_test_", networkName));
            bytes32 lockId = bridge.lock{value: 0.0001 ether}(testPubKeyHash);

            vm.stopBroadcast();

            console.log("  Lock ID:", vm.toString(lockId));
            console.log("  Lock test: PASS");
        }

        // Test EIP-197 pairing precompile
        console.log("");
        console.log("EIP-197 Pairing Precompile:");

        address BN254_PAIRING = address(0x08);
        bytes memory pairingInput = hex"00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c21800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa";

        (bool success, bytes memory result) = BN254_PAIRING.staticcall(pairingInput);

        if (success && result.length == 32) {
            console.log("  Pairing precompile: AVAILABLE");
        } else {
            console.log("  Pairing precompile: NOT AVAILABLE");
        }

        console.log("");
        console.log("=============================================================");
        console.log("  Test Complete!");
        console.log("=============================================================");
    }
}
