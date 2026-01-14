// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1VaultTestnet.sol";
import "../src/SPHINCSVerifier.sol";

contract DeployTestnetScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Deploying Testnet Contracts ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Use existing SPHINCSVerifier
        address sphincsVerifier = 0xcaEF192eddA106810Caf1A3Ad5dC37229bA79be1;
        
        // Deploy L1VaultTestnet (5 min timelocks, 0.01 ETH min bond)
        L1VaultTestnet vault = new L1VaultTestnet(deployer, sphincsVerifier);
        console.log("L1VaultTestnet deployed at:", address(vault));
        
        vm.stopBroadcast();
        
        console.log("=== Testnet Deployment Complete ===");
        console.log("Timelocks: 5 minutes");
        console.log("Min Bond: 0.01 ETH");
    }
}
