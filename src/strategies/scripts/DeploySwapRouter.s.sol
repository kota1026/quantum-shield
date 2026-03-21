// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SwapRouter} from "../SwapRouter.sol";
import {RealYieldAggregatorV3} from "../RealYieldAggregatorV3.sol";

/// @title Deploy SwapRouter + RealYieldAggregatorV3
/// @notice Mainnet デプロイスクリプト
/// @dev
///   Step 1: Deploy SwapRouter
///   Step 2: Verify USDe pool (optional)
///   Step 3: Deploy RealYieldAggregatorV3
///   Step 4: Seed with initial USDC
///
///   Run (dry-run):
///     forge script src/strategies/scripts/DeploySwapRouter.s.sol \
///       --fork-url $ETH_RPC_URL -vvvv
///
///   Run (broadcast):
///     forge script src/strategies/scripts/DeploySwapRouter.s.sol \
///       --fork-url $ETH_RPC_URL --broadcast --verify \
///       --etherscan-api-key $ETHERSCAN_KEY
contract DeploySwapRouter is Script {
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    // Set these before deployment
    uint256 constant INITIAL_DEPOSIT = 1_000e6; // $1,000 USDC for testing

    // Target allocations (must sum to 100)
    // If USDe pool not found, set sUSDe to 0 and redistribute
    uint8 constant TARGET_AAVE = 34;
    uint8 constant TARGET_SDAI = 33;
    uint8 constant TARGET_SFRAX = 33;
    uint8 constant TARGET_SUSDE = 0;  // 0 until USDe pool confirmed

    function run() public {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console2.log("Deployer:", deployer);
        console2.log("USDC balance:", IERC20(USDC).balanceOf(deployer) / 1e6, "USDC");

        require(
            IERC20(USDC).balanceOf(deployer) >= INITIAL_DEPOSIT,
            "Insufficient USDC balance"
        );

        vm.startBroadcast(deployerKey);

        // ── Step 1: Deploy SwapRouter ──────────────────────
        SwapRouter swapRouter = new SwapRouter();
        console2.log("SwapRouter deployed:", address(swapRouter));

        // ── Step 2: Check USDe pool ────────────────────────
        address usdeCandidate = 0x02950460E2b9529D0E00284A5fA2d7bDF3fA4d72;
        (bool usdeOk,) = usdeCandidate.staticcall(
            abi.encodeWithSignature("get_dy(int128,int128,uint256)", int128(1), int128(0), uint256(1e6))
        );
        if (usdeOk) {
            swapRouter.setUsdePool(usdeCandidate, 0, 1);
            console2.log("USDe pool configured:", usdeCandidate);
        } else {
            console2.log("USDe pool NOT available - sUSDe allocation set to 0%");
        }

        // ── Step 3: Verify swap routes work ────────────────
        _verifyRoutes(swapRouter);

        // ── Step 4: Deploy RealYieldAggregatorV3 ───────────
        // NOTE: Uncomment and configure when V3 is ready
        // RealYieldAggregatorV3 strategy = new RealYieldAggregatorV3(...);
        // console2.log("V3 deployed:", address(strategy));

        vm.stopBroadcast();

        // ── Summary ────────────────────────────────────────
        console2.log("");
        console2.log("=== Deployment Summary ===");
        console2.log("SwapRouter:", address(swapRouter));
        console2.log("USDe enabled:", swapRouter.usdeEnabled());
        console2.log("Default slippage:", swapRouter.defaultSlippageBps(), "bps");
        console2.log("");
        console2.log("Next steps:");
        console2.log("1. Verify on Etherscan");
        console2.log("2. Configure RealYieldAggregatorV3 with SwapRouter address");
        console2.log("3. Deposit initial USDC");
        console2.log("4. Monitor for 2 weeks before scaling");
    }

    function _verifyRoutes(SwapRouter router) internal view {
        // USDC→DAI quote
        uint256 daiQuote = router.getExpectedOutput(USDC, router.DAI(), 10_000e6);
        console2.log("Route check: 10k USDC -> DAI:", daiQuote / 1e18);
        require(daiQuote > 9_950e18, "DAI route: excessive slippage");

        // USDC→FRAX quote
        uint256 fraxQuote = router.getExpectedOutput(USDC, router.FRAX(), 10_000e6);
        console2.log("Route check: 10k USDC -> FRAX:", fraxQuote / 1e18);
        require(fraxQuote > 9_950e18, "FRAX route: excessive slippage");

        console2.log("All route checks passed!");
    }
}
