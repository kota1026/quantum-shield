// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1VaultTestnet.sol";

contract E2EStep1Lock is Script {
    L1VaultTestnet constant vault = L1VaultTestnet(payable(0x8f8661038C85634619B668d2C747B96e32F104CB));
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Step 1: Lock ===");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        bytes memory dilithiumPubKey = new bytes(50);
        for(uint i = 0; i < 50; i++) {
            dilithiumPubKey[i] = bytes1(uint8(i + 1));
        }
        
        bytes32 lockId = vault.lock{value: 0.01 ether}(deployer, dilithiumPubKey);
        console.log("LockId:", vm.toString(lockId));
        
        vm.stopBroadcast();
    }
}
