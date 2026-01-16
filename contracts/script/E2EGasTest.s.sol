// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1Vault.sol";

contract E2EGasTest is Script {
    L1Vault constant vault = L1Vault(payable(0xD4748Fb7a382265E903cCd2b0d15Da64e5d6a2E7));
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Sepolia E2E Gas Test - Full Flow ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Test 1: Lock
        console.log("\n--- Test 1: Lock ---");
        bytes memory dilithiumPubKey = new bytes(50);
        for(uint i = 0; i < 50; i++) {
            dilithiumPubKey[i] = bytes1(uint8(i + 1));
        }
        
        uint256 gasBefore = gasleft();
        bytes32 lockId = vault.lock{value: 0.01 ether}(deployer, dilithiumPubKey);
        uint256 lockGas = gasBefore - gasleft();
        console.log("Lock gas used:", lockGas);
        console.log("LockId:", vm.toString(lockId));
        
        // Test 2: Request Emergency Unlock
        console.log("\n--- Test 2: Request Emergency Unlock ---");
        uint256 bond = vault.calculateEmergencyBond(0.01 ether);
        console.log("Bond required:", bond);
        
        gasBefore = gasleft();
        vault.requestEmergencyUnlock{value: bond}(lockId, deployer);
        uint256 emergencyGas = gasBefore - gasleft();
        console.log("RequestEmergencyUnlock gas used:", emergencyGas);
        
        vm.stopBroadcast();
        
        console.log("\n=== Gas Summary ===");
        console.log("Lock:", lockGas);
        console.log("RequestEmergencyUnlock:", emergencyGas);
        console.log("Total:", lockGas + emergencyGas);
    }
}
