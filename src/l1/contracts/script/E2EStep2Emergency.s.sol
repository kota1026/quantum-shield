// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1VaultTestnet.sol";

contract E2EStep2Emergency is Script {
    L1VaultTestnet constant vault = L1VaultTestnet(payable(0x8f8661038C85634619B668d2C747B96e32F104CB));
    bytes32 constant LOCK_ID = 0x25f3a13b154835222011dcad2c58f08b85f9961e7527ba4a35c81d067a79aa7c;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Step 2: Request Emergency Unlock ===");
        console.log("LockId:", vm.toString(LOCK_ID));
        
        uint256 bond = vault.calculateEmergencyBond(0.01 ether);
        console.log("Bond required:", bond);
        
        vm.startBroadcast(deployerPrivateKey);
        
        vault.requestEmergencyUnlock{value: bond}(LOCK_ID, deployer);
        console.log("Emergency unlock requested!");
        
        vm.stopBroadcast();
        
        console.log("\nWait 5 minutes, then run Step 3");
    }
}
