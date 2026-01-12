// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1Vault.sol";
import "../src/SPHINCSVerifier.sol";
import "../src/STARKVerifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy SPHINCSVerifier
        SPHINCSVerifier sphincsVerifier = new SPHINCSVerifier();
        console.log("SPHINCSVerifier deployed at:", address(sphincsVerifier));
        
        // Deploy STARKVerifier
        STARKVerifier starkVerifier = new STARKVerifier();
        console.log("STARKVerifier deployed at:", address(starkVerifier));
        
        // Deploy L1Vault (securityCouncil = deployer for testing)
        L1Vault vault = new L1Vault(deployer, address(sphincsVerifier));
        console.log("L1Vault deployed at:", address(vault));
        
        vm.stopBroadcast();
        
        console.log("=== Deployment Complete ===");
    }
}
