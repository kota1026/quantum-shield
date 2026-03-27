// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICurvePool, ICurveGauge} from "./interfaces/ICurve.sol";
import {ISwapRouter} from "./interfaces/ISwapRouter.sol";

/// @title CurveLPStrategy
/// @author Quantum Shield
/// @notice Yearn V3 Tokenized Strategy: Curve 3pool LP + Gauge ステーキングで CRV 報酬を自動複利
///
/// 仕組み:
///   1. ユーザーが USDC を預入
///   2. USDC → Curve 3pool に流動性提供 → 3CRV LP トークンを受け取る
///   3. 3CRV を Curve Gauge にステーク → CRV 報酬が蓄積
///   4. harvest() で CRV を claim → Uniswap で USDC に変換 → 再度 LP に投入（複利）
///
/// 利回りの内訳:
///   - Curve 取引手数料（3pool の swap fee の一部）
///   - CRV 報酬（Gauge emission）
///   - 複利効果（harvest のたびに再投資）
///
/// リスク:
///   - Curve プロトコルリスク
///   - ステーブルコインのデペッグリスク（DAI, USDT）
///   - CRV 価格下落 → 報酬価値低下
///   - IL（Impermanent Loss）は 3pool ではほぼゼロ（全てステーブル）
///
/// 想定APY: 5-15%
///
/// @dev Curve 3pool: DAI(0), USDC(1), USDT(2)
///      このコントラクトは USDC (index=1) で出入りする想定
contract CurveLPStrategy {
    using SafeERC20 for IERC20;

    // ─── Constants ──────────────────────────────────────────────
    int128 private constant USDC_INDEX = 1; // 3pool 内の USDC の index

    // ─── Storage ────────────────────────────────────────────────
    address public immutable asset;          // USDC
    ICurvePool public immutable curvePool;   // Curve 3pool
    IERC20 public immutable lpToken;         // 3CRV token
    ICurveGauge public immutable gauge;      // Curve Gauge (3pool)
    ISwapRouter public immutable swapRouter; // Uniswap V3 Router
    address public immutable crv;            // CRV token

    address public management;
    uint24 public swapFee = 10000;           // Uniswap fee tier for CRV/ETH→USDC (1%)
    uint256 public minCrvToSell = 1e18;      // 最小 CRV 売却量 (1 CRV)
    uint256 public slippageBps = 50;         // 許容スリッページ (0.5%)

    // ─── Events ─────────────────────────────────────────────────
    event FundsDeployed(uint256 assetAmount, uint256 lpReceived);
    event FundsFreed(uint256 lpBurned, uint256 assetReceived);
    event Harvested(uint256 totalAssets, uint256 crvClaimed, uint256 assetFromCrv);

    // ─── Errors ─────────────────────────────────────────────────
    error NotManagement();
    error ZeroAmount();
    error SlippageTooHigh();

    modifier onlyManagement() {
        if (msg.sender != management) revert NotManagement();
        _;
    }

    // ─── Constructor ────────────────────────────────────────────
    /// @param _asset      USDC address
    /// @param _curvePool  Curve 3pool (0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7)
    /// @param _lpToken    3CRV token (0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490)
    /// @param _gauge      3pool Gauge (0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A)
    /// @param _swapRouter Uniswap V3 Router
    /// @param _crv        CRV token (0xD533a949740bb3306d119CC777fa900bA034cd52)
    constructor(
        address _asset,
        address _curvePool,
        address _lpToken,
        address _gauge,
        address _swapRouter,
        address _crv
    ) {
        asset = _asset;
        curvePool = ICurvePool(_curvePool);
        lpToken = IERC20(_lpToken);
        gauge = ICurveGauge(_gauge);
        swapRouter = ISwapRouter(_swapRouter);
        crv = _crv;
        management = msg.sender;

        // Approvals
        IERC20(_asset).forceApprove(_curvePool, type(uint256).max);  // USDC → 3pool
        IERC20(_lpToken).forceApprove(_gauge, type(uint256).max);     // 3CRV → Gauge
        IERC20(_crv).forceApprove(_swapRouter, type(uint256).max);    // CRV → Uniswap
    }

    // ═══════════════════════════════════════════════════════════
    //  Core Strategy Functions
    // ═══════════════════════════════════════════════════════════

    /// @notice USDC → Curve 3pool LP → Gauge にステーク
    /// @dev Yearn V3 の _deployFunds() に相当
    ///
    ///  Flow:
    ///   1. USDC を Curve 3pool に add_liquidity → 3CRV を受け取る
    ///   2. 3CRV を Gauge に deposit → CRV 報酬の蓄積が始まる
    ///
    function deployFunds(uint256 _amount) external onlyManagement {
        if (_amount == 0) revert ZeroAmount();

        // Step 1: USDC → 3pool LP
        //   amounts[0]=DAI, amounts[1]=USDC, amounts[2]=USDT
        uint256[3] memory amounts = [uint256(0), _amount, uint256(0)];

        // スリッページ保護: 予想 LP 量の (100 - slippageBps)/100 以上を要求
        uint256 expectedLp = curvePool.calc_token_amount(amounts, true);
        uint256 minLp = (expectedLp * (10000 - slippageBps)) / 10000;

        curvePool.add_liquidity(amounts, minLp);

        // Step 2: 受け取った 3CRV を全て Gauge にステーク
        uint256 lpBalance = lpToken.balanceOf(address(this));
        if (lpBalance > 0) {
            gauge.deposit(lpBalance);
        }

        emit FundsDeployed(_amount, lpBalance);
    }

    /// @notice Gauge からアンステーク → Curve 3pool から USDC を引出し
    /// @dev Yearn V3 の _freeFunds() に相当
    ///
    ///  Flow:
    ///   1. 必要な LP 量を計算
    ///   2. Gauge から withdraw
    ///   3. 3pool の remove_liquidity_one_coin で USDC を受け取る
    ///
    function freeFunds(uint256 _amount) external onlyManagement {
        if (_amount == 0) revert ZeroAmount();

        // _amount (USDC) を引き出すのに必要な LP トークン量を概算
        // Note: 正確な逆算は困難なので、少し多めに LP を burn する
        uint256[3] memory amounts = [uint256(0), _amount, uint256(0)];
        uint256 lpNeeded = curvePool.calc_token_amount(amounts, false);
        // バッファを加える（スリッページ対策）
        lpNeeded = (lpNeeded * (10000 + slippageBps)) / 10000;

        // Gauge の残高を超えないようにキャップ
        uint256 gaugeBalance = gauge.balanceOf(address(this));
        if (lpNeeded > gaugeBalance) {
            lpNeeded = gaugeBalance;
        }

        // Step 1: Gauge から LP を引出し
        gauge.withdraw(lpNeeded);

        // Step 2: LP → USDC に変換
        uint256 minOut = (_amount * (10000 - slippageBps)) / 10000;
        curvePool.remove_liquidity_one_coin(lpNeeded, USDC_INDEX, minOut);

        uint256 received = IERC20(asset).balanceOf(address(this));
        emit FundsFreed(lpNeeded, received);
    }

    /// @notice CRV 報酬を収穫 → USDC に変換 → 再投資して総資産を報告
    /// @dev Yearn V3 の _harvestAndReport() に相当
    ///
    ///  Flow:
    ///   1. Gauge から CRV 報酬を claim
    ///   2. CRV → USDC にスワップ (Uniswap V3)
    ///   3. 得た USDC を再度 Curve 3pool → Gauge に投入（複利）
    ///   4. 総資産を計算して返す
    ///
    function harvestAndReport() external onlyManagement returns (uint256 totalAssets_) {
        // Step 1: CRV 報酬を claim
        gauge.claim_rewards();
        uint256 crvBalance = IERC20(crv).balanceOf(address(this));
        uint256 assetFromCrv = 0;

        // Step 2: CRV → USDC (min threshold 以上の場合のみ)
        if (crvBalance >= minCrvToSell) {
            assetFromCrv = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: crv,
                    tokenOut: asset,
                    fee: swapFee,
                    recipient: address(this),
                    amountIn: crvBalance,
                    amountOutMinimum: 0, // 本番では oracle ベースで設定
                    sqrtPriceLimitX96: 0
                })
            );
        }

        // Step 3: 得た USDC を再投資
        uint256 loose = IERC20(asset).balanceOf(address(this));
        if (loose > 0) {
            uint256[3] memory amounts = [uint256(0), loose, uint256(0)];
            uint256 expectedLp = curvePool.calc_token_amount(amounts, true);
            uint256 minLp = (expectedLp * (10000 - slippageBps)) / 10000;
            curvePool.add_liquidity(amounts, minLp);

            uint256 lpBalance = lpToken.balanceOf(address(this));
            if (lpBalance > 0) {
                gauge.deposit(lpBalance);
            }
        }

        // Step 4: 総資産の計算
        //   Gauge 上の LP → USDC 換算 + 手元の USDC
        totalAssets_ = _estimatedTotalAssets();

        emit Harvested(totalAssets_, crvBalance, assetFromCrv);
    }

    // ═══════════════════════════════════════════════════════════
    //  View Functions
    // ═══════════════════════════════════════════════════════════

    /// @notice 総資産の概算（USDC 建て）
    function estimatedTotalAssets() external view returns (uint256) {
        return _estimatedTotalAssets();
    }

    function _estimatedTotalAssets() internal view returns (uint256) {
        uint256 gaugeBalance = gauge.balanceOf(address(this));
        uint256 lpBalance = lpToken.balanceOf(address(this));
        uint256 totalLp = gaugeBalance + lpBalance;

        // LP → USDC 換算
        uint256 lpValue = 0;
        if (totalLp > 0) {
            lpValue = curvePool.calc_withdraw_one_coin(totalLp, USDC_INDEX);
        }

        // 手元の loose USDC
        uint256 loose = IERC20(asset).balanceOf(address(this));

        return lpValue + loose;
    }

    /// @notice 引出し可能な最大額
    function availableWithdrawLimit() external view returns (uint256) {
        return _estimatedTotalAssets();
    }

    /// @notice 未 claim の CRV 報酬
    function pendingRewards() external view returns (uint256) {
        return gauge.claimable_reward(address(this), crv);
    }

    // ═══════════════════════════════════════════════════════════
    //  Management Functions
    // ═══════════════════════════════════════════════════════════

    /// @notice 緊急引出し: Gauge → LP → USDC
    function emergencyWithdraw() external onlyManagement {
        // Gauge から全 LP を引出し
        uint256 gaugeBalance = gauge.balanceOf(address(this));
        if (gaugeBalance > 0) {
            gauge.withdraw(gaugeBalance);
        }

        // LP → USDC に変換（スリッページ許容度を広く）
        uint256 lpBalance = lpToken.balanceOf(address(this));
        if (lpBalance > 0) {
            curvePool.remove_liquidity_one_coin(lpBalance, USDC_INDEX, 0); // min=0 for emergency
        }
    }

    function setSlippageBps(uint256 _slippageBps) external onlyManagement {
        slippageBps = _slippageBps;
    }

    function setSwapFee(uint24 _fee) external onlyManagement {
        swapFee = _fee;
    }

    function setMinCrvToSell(uint256 _minCrvToSell) external onlyManagement {
        minCrvToSell = _minCrvToSell;
    }

    function setManagement(address _management) external onlyManagement {
        management = _management;
    }
}
