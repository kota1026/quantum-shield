// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1VaultTestnet.sol";

contract E2EFullTest is Script {
    L1VaultTestnet constant vault = L1VaultTestnet(payable(0x8f8661038C85634619B668d2C747B96e32F104CB));
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Sepolia E2E Full Test ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Lock
        console.log("\n--- Step 1: Lock ---");
        bytes memory dilithiumPubKey = new bytes(50);
        for(uint i = 0; i < 50; i++) {
            dilithiumPubKey[i] = bytes1(uint8(i + 1));
        }
        
        uint256 gasBefore = gasleft();
        bytes32 lockId = vault.lock{value: 0.01 ether}(deployer, dilithiumPubKey);
        uint256 lockGas = gasBefore - gasleft();
        console.log("Lock gas:", lockGas);
        console.log("LockId:", vm.toString(lockId));
        
        // Step 2: Request Emergency Unlock
        console.log("\n--- Step 2: Request Emergency Unlock ---");
        uint256 bond = vault.calculateEmergencyBond(0.01 ether);
        console.log("Bond:", bond);
        
        gasBefore = gasleft();
        vault.requestEmergencyUnlock{value: bond}(lockId, deployer);
        uint256 emergencyGas = gasBefore - gasleft();
        console.log("RequestEmergencyUnlock gas:", emergencyGas);
        
        vm.stopBroadcast();
        
        console.log("\n=== Step 1 & 2 Complete ===");
        console.log("Lock gas:", lockGas);
        console.log("EmergencyUnlock gas:", emergencyGas);
        console.log("\nWait 5 minutes, then run E2EExecuteUnlock.s.sol");
        console.log("LockId to use:", vm.toString(lockId));
    }
}
