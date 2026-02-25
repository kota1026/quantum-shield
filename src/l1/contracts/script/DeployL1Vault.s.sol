// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1Vault.sol";

contract DeployL1Vault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address securityCouncil = vm.envAddress("SECURITY_COUNCIL");

        vm.startBroadcast(deployerPrivateKey);

        L1Vault vault = new L1Vault(securityCouncil, address(0));

        console.log("L1Vault deployed at:", address(vault));
        console.log("Owner:", vault.owner());
        console.log("SecurityCouncil:", vault.securityCouncil());

        vm.stopBroadcast();
    }
}
