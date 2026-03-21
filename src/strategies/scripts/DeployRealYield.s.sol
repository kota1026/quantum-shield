// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {Script, console2} from "forge-std/Script.sol";
import {RealYieldAggregator} from "../RealYieldAggregator.sol";

/// @title DeployRealYield
/// @notice RealYieldAggregator のデプロイスクリプト
///
/// 実行方法:
///   forge script src/strategies/scripts/DeployRealYield.s.sol:DeployRealYield \
///     --rpc-url $ETH_RPC_URL \
///     --broadcast \
///     --verify \
///     --etherscan-api-key $ETHERSCAN_KEY \
///     -vvv
///
contract DeployRealYield is Script {
    // ─── Mainnet Addresses ────────────────────────────────────
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant FRAX = 0x853d955aCEf822Db058eb8505911ED77F175b99e;
    address constant USDE = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;

    // Aave V3
    address constant AAVE_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    address constant A_USDC = 0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c;

    // Savings protocols
    address constant SDAI = 0x83F20F44975D03b1b09e64809B757c47f942BEeA;
    address constant SFRAX = 0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32;
    address constant SUSDE = 0x9D39A5DE30e57443BfF2A8307A4256c8797A3497;

    // Curve pool (TODO: 適切なプールに差し替え)
    address constant CURVE_POOL = address(0); // DEPLOY時に設定

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        RealYieldAggregator.ConstructorParams memory params = RealYieldAggregator
            .ConstructorParams({
                usdc: USDC,
                dai: DAI,
                frax: FRAX,
                usde: USDE,
                aavePool: AAVE_POOL,
                aUsdc: A_USDC,
                sdai: SDAI,
                sfrax: SFRAX,
                susde: SUSDE,
                curvePool: CURVE_POOL,
                curveIndexUsdc: 0,
                curveIndexDai: 1,
                curveIndexFrax: 2,
                curveIndexUsde: 3
            });

        RealYieldAggregator strategy = new RealYieldAggregator(params);

        console2.log("RealYieldAggregator deployed at:", address(strategy));
        console2.log("Management:", strategy.management());

        // 推奨初期設定: 利回りベースの配分
        // Aave 30%, sDAI 30%, sFRAX 20%, sUSDe 20%
        uint256[4] memory targets = [uint256(3000), uint256(3000), uint256(2000), uint256(2000)];
        strategy.setTargetAllocations(targets);
        console2.log("Target allocations set: 30/30/20/20");

        vm.stopBroadcast();
    }
}
