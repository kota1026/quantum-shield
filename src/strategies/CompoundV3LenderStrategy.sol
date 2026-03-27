// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IComet, ICometRewards} from "./interfaces/ICompound.sol";
import {ISwapRouter} from "./interfaces/ISwapRouter.sol";

/// @title CompoundV3LenderStrategy
/// @author Quantum Shield
/// @notice Yearn V3 Tokenized Strategy: Compound V3 (Comet) で貸出 + COMP報酬を自動複利
///
/// 仕組み:
///   1. ユーザーが USDC 等を預入
///   2. Compound V3 (Comet) に supply → 貸出利息が時間経過で蓄積
///   3. harvest() 時に COMP 報酬を claim → Uniswap で asset に swap → 再投資
///   4. 貸出利息 + COMP報酬 の二重利回り
///
/// リスク:
///   - Compound プロトコルリスク
///   - COMP 価格変動（claim → swap の間）
///   - 利用率100%時の一時的な引出し不可
///
/// 想定APY: 2-6%（貸出利息） + 1-3%（COMP報酬） = 3-9%
///
/// @dev Compound V3 (Comet) は V2 と異なり、cToken ではなく
///      Comet コントラクトに直接 supply/withdraw する設計。
contract CompoundV3LenderStrategy {
    using SafeERC20 for IERC20;

    // ─── Storage ────────────────────────────────────────────────
    address public immutable asset;          // Base token (USDC)
    IComet public immutable comet;           // Compound V3 Comet market
    ICometRewards public immutable rewards;  // COMP rewards distributor
    ISwapRouter public immutable swapRouter; // Uniswap V3 for COMP → asset swap
    address public immutable comp;           // COMP token address

    address public management;
    uint24 public swapFee = 3000;           // Uniswap pool fee (0.3%)
    uint256 public minCompToSell = 1e16;    // 最小売却量 (0.01 COMP)

    // ─── Events ─────────────────────────────────────────────────
    event FundsDeployed(uint256 amount);
    event FundsFreed(uint256 amount);
    event Harvested(uint256 totalAssets, uint256 compSold, uint256 assetReceived);
    event SwapFeeUpdated(uint24 newFee);

    // ─── Errors ─────────────────────────────────────────────────
    error NotManagement();
    error ZeroAmount();

    modifier onlyManagement() {
        if (msg.sender != management) revert NotManagement();
        _;
    }

    // ─── Constructor ────────────────────────────────────────────
    /// @param _asset       Base token (e.g. USDC)
    /// @param _comet       Compound V3 Comet (e.g. cUSDCv3: 0xc3d688B66703497DAA19211EEdff47f25384cdc3)
    /// @param _rewards     CometRewards (0x1B0e765F6224C21223AeA2af16c1C46E38885a40)
    /// @param _swapRouter  Uniswap V3 Router (0xE592427A0AEce92De3Edee1F18E0157C05861564)
    /// @param _comp        COMP token (0xc00e94Cb662C3520282E6f5717214004A7f26888)
    constructor(
        address _asset,
        address _comet,
        address _rewards,
        address _swapRouter,
        address _comp
    ) {
        asset = _asset;
        comet = IComet(_comet);
        rewards = ICometRewards(_rewards);
        swapRouter = ISwapRouter(_swapRouter);
        comp = _comp;
        management = msg.sender;

        // Approve Comet for supply
        IERC20(_asset).forceApprove(_comet, type(uint256).max);
        // Approve Router for COMP sells
        IERC20(_comp).forceApprove(_swapRouter, type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════
    //  Core Strategy Functions
    // ═══════════════════════════════════════════════════════════

    /// @notice アセットを Compound V3 に供給
    /// @dev Yearn V3 の _deployFunds() に相当
    function deployFunds(uint256 _amount) external onlyManagement {
        if (_amount == 0) revert ZeroAmount();

        // Comet に supply → 時間経過で利息が蓄積
        comet.supply(asset, _amount);

        emit FundsDeployed(_amount);
    }

    /// @notice Compound V3 からアセットを引出し
    /// @dev Yearn V3 の _freeFunds() に相当
    function freeFunds(uint256 _amount) external onlyManagement {
        if (_amount == 0) revert ZeroAmount();

        comet.withdraw(asset, _amount);

        emit FundsFreed(_amount);
    }

    /// @notice COMP報酬を収穫 → asset に変換 → 再投資して総資産を報告
    /// @dev Yearn V3 の _harvestAndReport() に相当
    ///
    ///  Flow:
    ///   1. CometRewards.claim() で COMP を受け取る
    ///   2. COMP が minCompToSell 以上なら Uniswap V3 で asset にスワップ
    ///   3. スワップで得た asset を Comet に再度 supply（複利）
    ///   4. 総資産（Comet残高 + 手元残高）を返す
    ///
    function harvestAndReport() external onlyManagement returns (uint256 totalAssets_) {
        // Step 1: COMP 報酬を claim
        rewards.claim(address(comet), address(this), true);

        // Step 2: COMP → asset にスワップ
        uint256 compBalance = IERC20(comp).balanceOf(address(this));
        uint256 assetReceived = 0;

        if (compBalance >= minCompToSell) {
            assetReceived = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: comp,
                    tokenOut: asset,
                    fee: swapFee,
                    recipient: address(this),
                    amountIn: compBalance,
                    amountOutMinimum: 0, // 本番では oracle 価格からスリッページ制限を設定すべき
                    sqrtPriceLimitX96: 0
                })
            );

            // Step 3: スワップで得た asset を再投資
            if (assetReceived > 0) {
                comet.supply(asset, assetReceived);
            }
        }

        // Step 4: 総資産を計算
        uint256 cometBal = comet.balanceOf(address(this)); // 元本 + 利息
        uint256 loose = IERC20(asset).balanceOf(address(this));
        totalAssets_ = cometBal + loose;

        emit Harvested(totalAssets_, compBalance, assetReceived);
    }

    // ═══════════════════════════════════════════════════════════
    //  View Functions
    // ═══════════════════════════════════════════════════════════

    /// @notice Compound V3 上の残高（元本 + 利息）
    function cometBalance() external view returns (uint256) {
        return comet.balanceOf(address(this));
    }

    /// @notice 引出し可能な最大額
    function availableWithdrawLimit() external view returns (uint256) {
        return comet.balanceOf(address(this)) + IERC20(asset).balanceOf(address(this));
    }

    // ═══════════════════════════════════════════════════════════
    //  Management Functions
    // ═══════════════════════════════════════════════════════════

    /// @notice 緊急引出し
    function emergencyWithdraw() external onlyManagement {
        uint256 bal = comet.balanceOf(address(this));
        if (bal > 0) {
            comet.withdraw(asset, bal);
        }
    }

    /// @notice Uniswap swap fee tier の変更
    function setSwapFee(uint24 _fee) external onlyManagement {
        swapFee = _fee;
        emit SwapFeeUpdated(_fee);
    }

    /// @notice COMP の最小売却量を変更
    function setMinCompToSell(uint256 _minCompToSell) external onlyManagement {
        minCompToSell = _minCompToSell;
    }

    function setManagement(address _management) external onlyManagement {
        management = _management;
    }
}
