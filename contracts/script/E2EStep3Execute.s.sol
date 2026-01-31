// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1VaultTestnet.sol";

contract E2EStep3Execute is Script {
    L1VaultTestnet constant vault = L1VaultTestnet(payable(0x8f8661038C85634619B668d2C747B96e32F104CB));
    bytes32 constant LOCK_ID = 0x25f3a13b154835222011dcad2c58f08b85f9961e7527ba4a35c81d067a79aa7c;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("=== Step 3: Execute Unlock ===");
        console.log("LockId:", vm.toString(LOCK_ID));
        
        vm.startBroadcast(deployerPrivateKey);
        
        vault.executeUnlock(LOCK_ID);
        console.log("Unlock executed!");
        
        vm.stopBroadcast();
        
        console.log("\n=== E2E Test Complete ===");
    }
}
