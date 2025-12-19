// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/// @title RescueMainnet - Rescue ETH stuck on mainnet
/// @notice Deploys a simple contract at the target address to withdraw ETH
/// @dev Requires nonce bumping to match Sepolia deployment nonce
contract RescueMainnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy a simple contract that can receive and withdraw ETH
        RescueContract rescue = new RescueContract();
        console.log("Rescue contract deployed at:", address(rescue));

        // Withdraw all ETH to deployer
        rescue.withdrawAll();
        console.log("ETH withdrawn successfully!");

        vm.stopBroadcast();
    }
}

/// @notice Simple contract to rescue ETH
contract RescueContract {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function withdrawAll() external {
        require(msg.sender == owner, "Not owner");
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = owner.call{value: balance}("");
            require(success, "Transfer failed");
        }
    }
}
