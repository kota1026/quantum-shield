// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/L1Vault.sol";
import {SPHINCSVerifier} from "../src/SPHINCSVerifier.sol";

contract DeployL1Vault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address securityCouncil = vm.envAddress("SECURITY_COUNCIL");

        vm.startBroadcast(deployerPrivateKey);

        // FR-THRESH-2: the vault refuses to deploy without a real verifier
        SPHINCSVerifier sphincsVerifier = new SPHINCSVerifier();
        L1Vault vault = new L1Vault(securityCouncil, address(sphincsVerifier));
        console.log("SPHINCSVerifier deployed at:", address(sphincsVerifier));

        console.log("L1Vault deployed at:", address(vault));
        console.log("Owner:", vault.owner());
        console.log("SecurityCouncil:", vault.securityCouncil());

        vm.stopBroadcast();
    }
}
