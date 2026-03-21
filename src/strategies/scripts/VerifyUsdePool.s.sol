// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title USDe Pool Verification Script
/// @notice Mainnet 上で USDe/USDC の Curve pool を検索・検証する
/// @dev Run: forge script src/strategies/scripts/VerifyUsdePool.s.sol --fork-url $ETH_RPC_URL -vvvv
contract VerifyUsdePool is Script {
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant USDE = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;

    // Candidate pool addresses to check
    address[] candidates;

    function setUp() public {
        // Known/suspected pool addresses
        candidates.push(0x02950460E2b9529D0E00284A5fA2d7bDF3fA4d72); // Original from PROPOSAL.md
    }

    function run() public view {
        console2.log("=== USDe/USDC Pool Verification ===");
        console2.log("");

        // 1. Check each candidate
        for (uint256 i = 0; i < candidates.length; i++) {
            _checkPool(candidates[i]);
        }

        // 2. Check Curve Registry for USDe pools
        _checkCurveRegistry();

        // 3. Check Curve MetaRegistry
        _checkMetaRegistry();

        console2.log("");
        console2.log("=== Verification Complete ===");
    }

    function _checkPool(address pool) internal view {
        console2.log("Checking pool:", pool);

        // Check if contract exists
        uint256 size;
        assembly { size := extcodesize(pool) }
        if (size == 0) {
            console2.log("  -> No contract at this address");
            return;
        }
        console2.log("  Contract size:", size);

        // Try get_dy with different index combinations
        int128[2][4] memory indexPairs = [
            [int128(0), int128(1)],
            [int128(1), int128(0)],
            [int128(0), int128(2)],
            [int128(2), int128(0)]
        ];

        for (uint256 i = 0; i < indexPairs.length; i++) {
            (bool ok, bytes memory data) = pool.staticcall(
                abi.encodeWithSignature(
                    "get_dy(int128,int128,uint256)",
                    indexPairs[i][0],
                    indexPairs[i][1],
                    uint256(1e6)
                )
            );
            if (ok && data.length >= 32) {
                uint256 dy = abi.decode(data, (uint256));
                console2.log("  get_dy(%d,%d,1e6) =", uint256(int256(indexPairs[i][0])), uint256(int256(indexPairs[i][1])));
                console2.log("    result:", dy);
            }
        }

        // Try to identify coins in the pool
        for (uint256 i = 0; i < 4; i++) {
            (bool ok, bytes memory data) = pool.staticcall(
                abi.encodeWithSignature("coins(uint256)", i)
            );
            if (ok && data.length >= 32) {
                address coin = abi.decode(data, (address));
                console2.log("  coins(%d) =", i);
                console2.log("    ", coin);
                if (coin == USDC) console2.log("    ^ THIS IS USDC");
                if (coin == USDE) console2.log("    ^ THIS IS USDe");
            }
        }
    }

    function _checkCurveRegistry() internal view {
        // Curve Address Provider
        address provider = 0x0000000022D53366457F9d5E68Ec105046FC4383;

        uint256 providerSize;
        assembly { providerSize := extcodesize(provider) }
        if (providerSize == 0) {
            console2.log("Curve Address Provider not found");
            return;
        }

        // Get registry address (id=0)
        (bool ok, bytes memory data) = provider.staticcall(
            abi.encodeWithSignature("get_registry()")
        );
        if (!ok || data.length < 32) {
            console2.log("Could not get Curve registry");
            return;
        }

        address registry = abi.decode(data, (address));
        console2.log("Curve Registry:", registry);

        // Find pool for USDC/USDe pair
        (bool found, bytes memory poolData) = registry.staticcall(
            abi.encodeWithSignature("find_pool_for_coins(address,address)", USDC, USDE)
        );
        if (found && poolData.length >= 32) {
            address pool = abi.decode(poolData, (address));
            console2.log("Registry found pool for USDC/USDe:", pool);
            if (pool != address(0)) {
                _checkPool(pool);
            }
        } else {
            console2.log("No pool found in registry for USDC/USDe");
        }
    }

    function _checkMetaRegistry() internal view {
        // Curve MetaRegistry (newer)
        address metaRegistry = 0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC;

        uint256 mrSize;
        assembly { mrSize := extcodesize(metaRegistry) }
        if (mrSize == 0) {
            console2.log("MetaRegistry not found at expected address");
            return;
        }

        (bool ok, bytes memory data) = metaRegistry.staticcall(
            abi.encodeWithSignature("find_pool_for_coins(address,address)", USDC, USDE)
        );
        if (ok && data.length >= 32) {
            address pool = abi.decode(data, (address));
            console2.log("MetaRegistry found pool for USDC/USDe:", pool);
            if (pool != address(0)) {
                _checkPool(pool);
            }
        } else {
            console2.log("MetaRegistry: No pool for USDC/USDe");
        }
    }
}
