// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

interface IOldL1Vault {
    function requestEmergencyUnlock(bytes32 lockId, address recipient) external payable;
    function executeUnlock(bytes32 lockId) external;
    function getUserLockIds(address user) external view returns (bytes32[] memory);
    function getLock(bytes32 lockId) external view returns (
        address sender,
        address recipient,
        uint256 amount,
        bytes32 dilithiumPubKeyHash,
        uint256 lockedAt,
        uint8 status,
        bytes32 stateRoot,
        uint256 expiry,
        uint256 nonce
    );
    function unlockRequests(bytes32 lockId) external view returns (
        bytes32 lockId_,
        address recipient,
        uint256 amount,
        bytes32 stateRoot,
        bytes32 unlockStateRoot,
        uint256 requestedAt,
        uint256 unlockableAt,
        bool isEmergency,
        uint256 bond,
        uint256 signatureCount,
        uint256 unlockNonce,
        uint256 proverRequestedAt,
        uint256 emergencyReadyAt
    );
    function calculateEmergencyBond(uint256 amount) external pure returns (uint256);
    function MIN_EMERGENCY_BOND() external pure returns (uint256);
    function EMERGENCY_TIME_LOCK() external pure returns (uint256);
}

/// @title RescueLocks - Rescue stuck ETH from old L1Vault
/// @notice Emergency unlock script for v2 contract (no provers registered)
/// @dev Run this to initiate emergency unlock for one lock at a time
contract RescueLocks is Script {
    // Old L1Vault contract address
    address constant OLD_L1_VAULT = 0x108A5CE65f927ACfAC55325f1c471010FdEC8599;

    // CDC3 wallet (owner and lock sender)
    address constant CDC3_WALLET = 0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3;

    // Minimum emergency bond
    uint256 constant MIN_BOND = 0.5 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Rescue Locks from Old L1Vault ===");
        console.log("Deployer:", deployer);
        console.log("Old L1Vault:", OLD_L1_VAULT);

        IOldL1Vault vault = IOldL1Vault(OLD_L1_VAULT);

        // Get all lock IDs
        bytes32[] memory lockIds = vault.getUserLockIds(CDC3_WALLET);
        console.log("Total locks found:", lockIds.length);

        // Find locks that need emergency unlock (status = 0 = ACTIVE)
        uint256 activeCount = 0;
        bytes32 nextLockToRescue;

        for (uint256 i = 0; i < lockIds.length; i++) {
            (,,,,,uint8 lockStatus,,,) = vault.getLock(lockIds[i]);
            if (lockStatus == 0) {
                activeCount++;
                if (nextLockToRescue == bytes32(0)) {
                    nextLockToRescue = lockIds[i];
                }
            }
        }

        console.log("Active locks needing rescue:", activeCount);

        if (activeCount == 0) {
            console.log("No active locks to rescue!");
            return;
        }

        // Get lock details
        (address sender, address recipient, uint256 amount,,, uint8 status,, uint256 expiry,) = vault.getLock(nextLockToRescue);
        console.log("\n=== Next Lock to Rescue ===");
        console.log("Lock ID:", vm.toString(nextLockToRescue));
        console.log("Sender:", sender);
        console.log("Amount:", amount);
        console.log("Status:", status);
        console.log("Expiry:", expiry);
        console.log("Current time:", block.timestamp);
        console.log("Is expired:", block.timestamp > expiry);

        // Calculate required bond
        uint256 requiredBond = vault.calculateEmergencyBond(amount);
        console.log("\nRequired bond:", requiredBond);
        console.log("Deployer balance:", deployer.balance);

        require(deployer.balance >= requiredBond, "Insufficient balance for bond");
        require(deployer == sender, "Must be lock sender to request emergency unlock");

        // Initiate emergency unlock
        console.log("\n=== Initiating Emergency Unlock ===");

        vm.startBroadcast(deployerPrivateKey);

        vault.requestEmergencyUnlock{value: requiredBond}(nextLockToRescue, CDC3_WALLET);

        vm.stopBroadcast();

        console.log("Emergency unlock requested!");
        console.log("Bond paid:", requiredBond);

        // Get emergency unlock details
        uint256 emergencyTimeLock = vault.EMERGENCY_TIME_LOCK();
        uint256 unlockableAt = block.timestamp + emergencyTimeLock;

        console.log("\n=== Next Steps ===");
        console.log("Emergency time lock (seconds):", emergencyTimeLock);
        console.log("Emergency time lock (days):", emergencyTimeLock / 86400);
        console.log("Unlock available at:", unlockableAt);
        console.log("\nAfter time lock expires, run:");
        console.log("  forge script script/ExecuteRescue.s.sol --rpc-url sepolia --broadcast");
        console.log("\nRemaining active locks:", activeCount - 1);
    }
}

/// @title ExecuteRescue - Execute pending emergency unlocks
contract ExecuteRescue is Script {
    address constant OLD_L1_VAULT = 0x108A5CE65f927ACfAC55325f1c471010FdEC8599;
    address constant CDC3_WALLET = 0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Execute Pending Emergency Unlocks ===");
        console.log("Deployer:", deployer);

        IOldL1Vault vault = IOldL1Vault(OLD_L1_VAULT);

        bytes32[] memory lockIds = vault.getUserLockIds(CDC3_WALLET);

        uint256 executedCount = 0;

        for (uint256 i = 0; i < lockIds.length; i++) {
            (,,,,,uint8 lockStatus,,,) = vault.getLock(lockIds[i]);

            // Status 5 = EMERGENCY_PENDING
            if (lockStatus == 5) {
                (,,,,,, uint256 unlockableAt,,,,,,) = vault.unlockRequests(lockIds[i]);

                if (block.timestamp >= unlockableAt) {
                    console.log("Executing unlock for:", vm.toString(lockIds[i]));

                    vm.startBroadcast(deployerPrivateKey);
                    vault.executeUnlock(lockIds[i]);
                    vm.stopBroadcast();

                    console.log("  Unlock executed!");
                    executedCount++;
                } else {
                    console.log("Lock", vm.toString(lockIds[i]), "not ready yet");
                    console.log("  Unlockable at:", unlockableAt);
                    console.log("  Current time:", block.timestamp);
                    console.log("  Time remaining:", unlockableAt - block.timestamp, "seconds");
                }
            }
        }

        console.log("\nExecuted unlocks:", executedCount);
        console.log("Check balance:", deployer.balance);
    }
}

/// @title CheckRescueStatus - View rescue progress
contract CheckRescueStatus is Script {
    address constant OLD_L1_VAULT = 0x108A5CE65f927ACfAC55325f1c471010FdEC8599;
    address constant CDC3_WALLET = 0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3;

    function run() external view {
        console.log("=== Rescue Status Check ===");

        IOldL1Vault vault = IOldL1Vault(OLD_L1_VAULT);
        bytes32[] memory lockIds = vault.getUserLockIds(CDC3_WALLET);

        uint256 activeCount = 0;
        uint256 pendingEmergencyCount = 0;
        uint256 releasedCount = 0;
        uint256 totalLockedAmount = 0;
        uint256 readyToExecuteCount = 0;

        console.log("Total locks:", lockIds.length);
        console.log("Current time:", block.timestamp);
        console.log("");

        for (uint256 i = 0; i < lockIds.length; i++) {
            (,, uint256 amount,,, uint8 lockStatus,,,) = vault.getLock(lockIds[i]);

            if (lockStatus == 0) {
                activeCount++;
                totalLockedAmount += amount;
            } else if (lockStatus == 5) {
                pendingEmergencyCount++;
                totalLockedAmount += amount;

                (,,,,,, uint256 unlockableAt,,,,,,) = vault.unlockRequests(lockIds[i]);
                if (block.timestamp >= unlockableAt) {
                    readyToExecuteCount++;
                    console.log("READY:", vm.toString(lockIds[i]));
                } else {
                    uint256 remaining = unlockableAt - block.timestamp;
                    console.log("PENDING (hours remaining):", remaining / 3600);
                }
            } else if (lockStatus == 2) {
                releasedCount++;
            }
        }

        console.log("");
        console.log("=== Summary ===");
        console.log("Active (need emergency unlock):", activeCount);
        console.log("Pending Emergency (waiting):", pendingEmergencyCount);
        console.log("Ready to Execute:", readyToExecuteCount);
        console.log("Released:", releasedCount);
        console.log("Total locked amount:", totalLockedAmount);
    }
}
