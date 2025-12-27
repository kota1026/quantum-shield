// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/libraries/SHA3_256.sol";

/// @title ComputeDomains - ドメインセパレータのSHA3-256ハッシュ値を計算
/// @notice IMPL-011: CP-1準拠のためにkeccak256をSHA3-256に置き換える際に使用
/// @dev 実行: forge script scripts/ComputeDomains.s.sol -vvvv
contract ComputeDomains is Script {
    function run() public view {
        console.log("=== Domain Separator Hashes (SHA3-256) ===");
        console.log("");
        
        // SparseMerkleTree domains
        bytes32 leafDomain = SHA3_256.hash(bytes("QS_SMT_LEAF_V1"));
        bytes32 nodeDomain = SHA3_256.hash(bytes("QS_SMT_NODE_V1"));
        
        console.log("SparseMerkleTree.sol:");
        console.log("  LEAF_DOMAIN_HASH:");
        console.logBytes32(leafDomain);
        console.log("  NODE_DOMAIN_HASH:");
        console.logBytes32(nodeDomain);
        console.log("");
        
        // StateRootCalculator domains
        bytes32 lockDomain = SHA3_256.hash(bytes("QS_LOCK_V1"));
        bytes32 unlockDomain = SHA3_256.hash(bytes("QS_UNLOCK_V1"));
        bytes32 lockIdDomain = SHA3_256.hash(bytes("QS_LOCK_ID"));
        
        console.log("StateRootCalculator.sol:");
        console.log("  DOMAIN_LOCK:");
        console.logBytes32(lockDomain);
        console.log("  DOMAIN_UNLOCK:");
        console.logBytes32(unlockDomain);
        console.log("  DOMAIN_LOCK_ID:");
        console.logBytes32(lockIdDomain);
        console.log("");
        
        console.log("=== Copy these values to the respective contracts ===");
    }
}
