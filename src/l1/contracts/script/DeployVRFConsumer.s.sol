// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {VRFConsumerV2Production} from "../src/VRFConsumerV2Production.sol";
import {ChainlinkVRFConfig} from "../src/chainlink/ChainlinkVRFConfig.sol";

/// @title DeployVRFConsumer - Deploy Chainlink VRF Consumer for Prover Selection
/// @notice Deploys VRFConsumerV2Production to Sepolia with Chainlink VRF v2.5
///
/// Usage:
///   # Set environment variables
///   export PRIVATE_KEY=<deployer-private-key>
///   export VRF_SUBSCRIPTION_ID=<chainlink-subscription-id>
///   export L1_VAULT_ADDRESS=0x07012aeF87C6E423c32F2f8eaF81762f63337260
///
///   # Deploy to Sepolia
///   forge script script/DeployVRFConsumer.s.sol:DeployVRFConsumer \
///     --rpc-url sepolia \
///     --broadcast \
///     --verify \
///     -vvvv
///
/// Prerequisites:
///   1. Create VRF subscription at https://vrf.chain.link/sepolia
///   2. Fund subscription with LINK tokens
///   3. After deployment, add the consumer contract address to the subscription
contract DeployVRFConsumer is Script {
    // L1 Vault on Sepolia (from blockchain.md)
    address constant DEFAULT_L1_VAULT = 0x07012aeF87C6E423c32F2f8eaF81762f63337260;

    // Chainlink Sepolia VRF Coordinator
    address constant SEPOLIA_VRF_COORDINATOR = 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625;

    // Sepolia 150 gwei gas lane key hash
    bytes32 constant SEPOLIA_KEY_HASH = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Required: VRF subscription ID (create at https://vrf.chain.link)
        uint256 subscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");

        // Optional: Override L1 Vault address
        address l1Vault = vm.envOr("L1_VAULT_ADDRESS", DEFAULT_L1_VAULT);

        // Determine network config
        uint256 chainId = block.chainid;
        address vrfCoordinator;
        bytes32 keyHash;

        if (chainId == 11155111) {
            // Sepolia
            vrfCoordinator = SEPOLIA_VRF_COORDINATOR;
            keyHash = SEPOLIA_KEY_HASH;
        } else if (chainId == 1) {
            // Mainnet — use ChainlinkVRFConfig library
            (vrfCoordinator, keyHash) = ChainlinkVRFConfig.getCoordinatorAndKeyHash(chainId);
        } else if (chainId == 421614) {
            // Arbitrum Sepolia
            (vrfCoordinator, keyHash) = ChainlinkVRFConfig.getCoordinatorAndKeyHash(chainId);
        } else {
            revert("Unsupported chain ID for VRF deployment");
        }

        console.log("=== VRF Consumer Deployment ===");
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("VRF Coordinator:", vrfCoordinator);
        console.log("Key Hash:");
        console.logBytes32(keyHash);
        console.log("Subscription ID:", subscriptionId);
        console.log("L1 Vault:", l1Vault);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy VRFConsumerV2Production
        console.log("Step 1: Deploying VRFConsumerV2Production...");
        VRFConsumerV2Production vrfConsumer = new VRFConsumerV2Production(
            vrfCoordinator,
            l1Vault,
            keyHash,
            subscriptionId
        );
        console.log("VRFConsumerV2Production deployed at:", address(vrfConsumer));

        // Step 2: Verify configuration
        console.log("\nStep 2: Verifying configuration...");
        require(vrfConsumer.owner() == deployer, "Owner mismatch");
        console.log("Owner verified:", deployer);

        vm.stopBroadcast();

        // Step 3: Post-deployment instructions
        console.log("\n=== POST-DEPLOYMENT STEPS ===");
        console.log("1. Add consumer to VRF subscription:");
        console.log("   - Go to https://vrf.chain.link/sepolia");
        console.log("   - Open subscription ID:", subscriptionId);
        console.log("   - Click 'Add Consumer'");
        console.log("   - Enter address:", address(vrfConsumer));
        console.log("");
        console.log("2. Update backend config (default.yaml or env):");
        console.log("   QS__VRF__CONTRACT_ADDRESS=", address(vrfConsumer));
        console.log("");
        console.log("3. Link VRF Consumer to L1 Vault (if vault supports it):");
        console.log("   vault.setVRFConsumer(", address(vrfConsumer), ")");
        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
    }
}
