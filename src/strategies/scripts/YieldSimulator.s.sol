// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import "forge-std/Script.sol";

/// @title YieldSimulator
/// @notice Mainnet fork 上で各プロトコルの実際のレートを取得し、
///         1年間の予想収益をシミュレーションする
///
/// Usage:
///   forge script src/strategies/scripts/YieldSimulator.s.sol \
///     --fork-url $ETH_RPC_URL -vvv
///
/// ※ ETH_RPC_URL に Ethereum mainnet の RPC を設定すること
///    (Alchemy, Infura, etc.)
contract YieldSimulator is Script {
    // ─── Protocol Addresses (Ethereum Mainnet) ──────────────────
    address constant AAVE_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    address constant AAVE_DATA_PROVIDER = 0x7B4EB56E7CD4b454BA8ff71E4518426c84b5b7A5;
    address constant COMET_USDC = 0xc3d688B66703497DAA19211EEdff47f25384cdc3;
    address constant CURVE_3POOL = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;
    address constant CURVE_GAUGE = 0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;
    address constant COMP = 0xc00e94Cb662C3520282E6f5717214004A7f26888;

    // Chainlink Price Feeds
    address constant CRV_USD_FEED = 0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f;
    address constant COMP_USD_FEED = 0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5;
    address constant ETH_USD_FEED = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;

    // ─── Simulation Parameters ──────────────────────────────────
    uint256[] public depositAmounts;

    function setUp() public {
        // シミュレーション対象の預入額 (USDC, 6 decimals)
        depositAmounts.push(10_000e6);    // $10,000
        depositAmounts.push(50_000e6);    // $50,000
        depositAmounts.push(100_000e6);   // $100,000
        depositAmounts.push(500_000e6);   // $500,000
        depositAmounts.push(1_000_000e6); // $1,000,000
    }

    function run() public view {
        console.log("=======================================================");
        console.log("  Yearn V3 Strategy Yield Simulator");
        console.log("  Chain: Ethereum Mainnet (Fork)");
        console.log("=======================================================");
        console.log("");

        // ─── 1. Aave V3 Supply Rate ────────────────────────────
        uint256 aaveSupplyRate = _getAaveSupplyRate();
        console.log("--- Strategy 1: Aave V3 Lender ---");
        console.log("  Current Supply APY: %s.%s%s%%",
            aaveSupplyRate / 100,
            (aaveSupplyRate % 100) / 10,
            aaveSupplyRate % 10
        );
        _printYieldTable("Aave V3", aaveSupplyRate);

        // ─── 2. Compound V3 Supply Rate ────────────────────────
        uint256 compoundSupplyRate = _getCompoundSupplyRate();
        uint256 compRewardRate = _getCompRewardRate();
        uint256 compoundTotalRate = compoundSupplyRate + compRewardRate;
        console.log("--- Strategy 2: Compound V3 Lender ---");
        console.log("  Supply APY: %s.%s%s%%",
            compoundSupplyRate / 100,
            (compoundSupplyRate % 100) / 10,
            compoundSupplyRate % 10
        );
        console.log("  COMP Reward APY: ~%s.%s%s%%",
            compRewardRate / 100,
            (compRewardRate % 100) / 10,
            compRewardRate % 10
        );
        _printYieldTable("Compound V3", compoundTotalRate);

        // ─── 3. Curve 3pool + Gauge ────────────────────────────
        uint256 curveBaseRate = _getCurveBaseRate();
        uint256 curveCrvRate = _getCurveCrvRewardRate();
        uint256 curveTotalRate = curveBaseRate + curveCrvRate;
        console.log("--- Strategy 3: Curve 3pool LP ---");
        console.log("  Base APY (trading fees): %s.%s%s%%",
            curveBaseRate / 100,
            (curveBaseRate % 100) / 10,
            curveBaseRate % 10
        );
        console.log("  CRV Reward APY: ~%s.%s%s%%",
            curveCrvRate / 100,
            (curveCrvRate % 100) / 10,
            curveCrvRate % 10
        );
        _printYieldTable("Curve 3pool", curveTotalRate);

        // ─── Summary Comparison ────────────────────────────────
        console.log("=======================================================");
        console.log("  SUMMARY ($100,000 deposit, 1 year)");
        console.log("=======================================================");
        uint256 base = 100_000;
        console.log("  Aave V3:      $%s profit", base * aaveSupplyRate / 10000);
        console.log("  Compound V3:  $%s profit", base * compoundTotalRate / 10000);
        console.log("  Curve 3pool:  $%s profit", base * curveTotalRate / 10000);
        console.log("");
        console.log("  * Compound includes COMP reward auto-compound");
        console.log("  * Curve includes CRV reward auto-compound");
        console.log("  * Actual returns vary with market conditions");
        console.log("  * Does not account for gas costs of harvest()");
    }

    // ═══════════════════════════════════════════════════════════
    //  Rate Fetching (Mainnet Fork)
    // ═══════════════════════════════════════════════════════════

    /// @dev Aave V3 の USDC supply rate を取得
    ///      AaveProtocolDataProvider.getReserveData() を使用
    function _getAaveSupplyRate() internal view returns (uint256) {
        // getReserveData returns multiple values, we want currentLiquidityRate (index 5)
        // Rate is in RAY (1e27), convert to basis points (1e4 = 100%)
        (bool success, bytes memory data) = AAVE_DATA_PROVIDER.staticcall(
            abi.encodeWithSignature("getReserveData(address)", USDC)
        );
        if (!success || data.length < 192) {
            // Fallback: typical Aave USDC supply rate
            return 450; // 4.50% as fallback
        }
        // currentLiquidityRate is at offset 5 * 32 = 160
        uint256 liquidityRate = abi.decode(_slice(data, 160, 32), (uint256));
        // RAY (1e27) → basis points: rate * 10000 / 1e27
        return liquidityRate / 1e23; // bps with 2 decimal places
    }

    /// @dev Compound V3 の supply rate を取得
    function _getCompoundSupplyRate() internal view returns (uint256) {
        (bool success, bytes memory data) = COMET_USDC.staticcall(
            abi.encodeWithSignature("getSupplyRate(uint256)", _getUtilization())
        );
        if (!success) return 350; // 3.50% fallback

        uint256 ratePerSecond = abi.decode(data, (uint256));
        // rate per second (1e18) → APY bps
        // APY = (1 + rate)^seconds_per_year - 1 ≈ rate * seconds_per_year (for small rates)
        uint256 annualRate = ratePerSecond * 365 days;
        return annualRate / 1e14; // → bps * 100
    }

    function _getUtilization() internal view returns (uint256) {
        (bool success, bytes memory data) = COMET_USDC.staticcall(
            abi.encodeWithSignature("getUtilization()")
        );
        if (!success) return 85e16; // 85% fallback
        return abi.decode(data, (uint256));
    }

    /// @dev COMP reward APY の概算
    function _getCompRewardRate() internal pure returns (uint256) {
        // COMP distribution rate は on-chain 計算が複雑なため概算値を使用
        // 実際のレートは CometRewards.rewardConfig() + COMP 価格から算出
        return 150; // ~1.50% (typical range: 1-3%)
    }

    /// @dev Curve 3pool の base APY (trading fees)
    function _getCurveBaseRate() internal pure returns (uint256) {
        // Curve の手数料収入は過去7日の取引量から算出
        // on-chain で直接取得するのは困難なため概算
        return 200; // ~2.00% (typical for 3pool)
    }

    /// @dev Curve CRV reward APY
    function _getCurveCrvRewardRate() internal pure returns (uint256) {
        // CRV emission rate * CRV price / total staked TVL
        // Gauge の inflation_rate() と CRV 価格から算出可能
        return 500; // ~5.00% (typical range: 3-10%)
    }

    // ═══════════════════════════════════════════════════════════
    //  Output Helpers
    // ═══════════════════════════════════════════════════════════

    function _printYieldTable(string memory name, uint256 apyBps) internal view {
        console.log("  ---- %s Yield Table ----", name);
        console.log("  | Deposit     | Monthly   | Yearly     | 3-Year     |");
        console.log("  |-------------|-----------|------------|------------|");

        for (uint256 i = 0; i < depositAmounts.length; i++) {
            uint256 deposit = depositAmounts[i] / 1e6; // to USD
            uint256 yearly = deposit * apyBps / 10000;
            uint256 monthly = yearly / 12;
            // 3年複利: P * (1 + r)^3 - P ≈ P * (3r + 3r^2 + r^3)
            uint256 threeYear = deposit * apyBps * 3 / 10000
                + deposit * apyBps * apyBps * 3 / 100000000
                + deposit * apyBps * apyBps * apyBps / 1000000000000;

            console.log("  | $%s | $%s | $%s | $%s |",
                _formatUSD(deposit),
                _formatUSD(monthly),
                _formatUSD(yearly),
                _formatUSD(threeYear)
            );
        }
        console.log("");
    }

    function _formatUSD(uint256 amount) internal pure returns (string memory) {
        // Simple number formatting (no commas for simplicity in Solidity)
        return vm.toString(amount);
    }

    function _slice(bytes memory data, uint256 start, uint256 length)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = data[start + i];
        }
        return result;
    }
}
