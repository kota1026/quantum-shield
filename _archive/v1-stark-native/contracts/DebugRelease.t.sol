// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/QuantumShieldBridge.sol";

contract DebugReleaseTest is Test {
    QuantumShieldBridge bridge;
    
    function setUp() public {
        // Fork時に実際のコントラクトを取得
        bridge = QuantumShieldBridge(payable(0x32aec14Aa82b7f8a5d85df04c16418a957E958b6));
    }
    
    function testDebugRelease() external {
        // lockId = 0x7ec197aeaafc66cd1dc8506f8128a63d4ecd605fd8172e6baa8580ae37d69f21
        bytes32 lockId = bytes32(uint256(0x7ec197aeaafc66cd1dc8506f8128a63d4ecd605fd8172e6baa8580ae37d69f21));
        
        // Get lock data
        (address sender, uint256 amount, bytes32 dilithiumPubKeyHash, , bool released) = bridge.getLock(lockId);
        
        console.log("=== Lock Data ===");
        console.log("sender:", sender);
        console.log("amount:", amount);
        console.log("dilithiumPubKeyHash:");
        console.logBytes32(dilithiumPubKeyHash);
        console.log("released:", released);
        
        // Calculate correct split for dilithiumPubKeyHash
        uint256 hashAsUint = uint256(dilithiumPubKeyHash);
        uint256 commitment_low = uint128(hashAsUint);
        uint256 commitment_high = hashAsUint >> 128;
        
        console.log("\n=== Calculated Public Inputs ===");
        console.log("commitment_low:", commitment_low);
        console.log("commitment_high:", commitment_high);
        
        // lock_id split
        uint256 lockIdAsUint = uint256(lockId);
        uint256 lock_id_low = uint128(lockIdAsUint);
        uint256 lock_id_high = lockIdAsUint >> 128;
        console.log("lock_id_low:", lock_id_low);
        console.log("lock_id_high:", lock_id_high);
        
        console.log("sender as uint256:", uint256(uint160(sender)));
        
        // Build public inputs with CORRECT values from lock data
        uint256[] memory publicInputs = new uint256[](12);
        publicInputs[0] = commitment_low;
        publicInputs[1] = commitment_high;
        publicInputs[2] = 1;  // numSignatures
        publicInputs[3] = lock_id_low;
        publicInputs[4] = lock_id_high;
        publicInputs[5] = uint256(uint160(sender)); // recipient = sender
        publicInputs[6] = amount;
        publicInputs[7] = 6; // nonce (unused nonce)
        publicInputs[8] = uint256(uint160(sender)); // sender
        publicInputs[9] = 1; // circuitVersion
        publicInputs[10] = 65536; // maxCoeffBound
        publicInputs[11] = 12345; // proofCommitment
        
        // Call release
        vm.prank(sender);
        bridge.release(hex"1234", publicInputs);
    }
}
