// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAaveV3Pool, IAToken} from "./interfaces/IAave.sol";

/// @title AaveLenderStrategy
/// @author Quantum Shield
/// @notice Yearn V3 Tokenized Strategy: Aave V3にアセットを預けて貸出利息を自動複利運用
///
/// 仕組み:
///   1. ユーザーが USDC/WETH 等を預入
///   2. Aave V3 Pool に supply → aToken を受け取る
///   3. aToken は時間経過で残高が増える（利息が自動付与）
///   4. harvest() 時に増えた分を totalAssets として報告 → PPS上昇
///
/// リスク:
///   - Aave プロトコルリスク（スマコン脆弱性）
///   - 利用率100%時の一時的な引出し不可
///   - 変動金利の低下
///
/// 想定APY: 3-8%（市場状況による）
///
/// @dev BaseStrategy を継承する想定。ここではスタンドアロン実装として記述。
///      実際のデプロイ時は `forge install yearn/tokenized-strategy` して
///      BaseStrategy を継承する形に変換してください。
contract AaveLenderStrategy {
    using SafeERC20 for IERC20;

    // ─── Storage ────────────────────────────────────────────────
    address public immutable asset;       // 運用対象トークン (USDC, WETH, etc.)
    address public immutable aToken;      // Aave の aToken (aUSDC, aWETH, etc.)
    IAaveV3Pool public immutable aavePool;
    address public management;            // 管理者（Yearn V3 では TokenizedStrategy が管理）

    // ─── Events ─────────────────────────────────────────────────
    event FundsDeployed(uint256 amount);
    event FundsFreed(uint256 amount);
    event Harvested(uint256 totalAssets, uint256 profit);

    // ─── Errors ─────────────────────────────────────────────────
    error NotManagement();
    error ZeroAmount();
    error InsufficientBalance();

    // ─── Modifiers ──────────────────────────────────────────────
    modifier onlyManagement() {
        if (msg.sender != management) revert NotManagement();
        _;
    }

    // ─── Constructor ────────────────────────────────────────────
    /// @param _asset      運用対象アセット (e.g. USDC: 0xA0b8...4e12)
    /// @param _aToken     対応する aToken (e.g. aUSDC: 0xBcca...2f7b)
    /// @param _aavePool   Aave V3 Pool (Ethereum: 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2)
    constructor(address _asset, address _aToken, address _aavePool) {
        asset = _asset;
        aToken = _aToken;
        aavePool = IAaveV3Pool(_aavePool);
        management = msg.sender;

        // Aave Pool に対して無制限 approve（初回のみ）
        IERC20(_asset).safeApprove(_aavePool, type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════
    //  Core Strategy Functions (Yearn V3 Required Overrides)
    // ═══════════════════════════════════════════════════════════

    /// @notice アセットを Aave V3 に預入
    /// @dev Yearn V3 の _deployFunds() に相当
    /// @param _amount 預入する量
    function deployFunds(uint256 _amount) external onlyManagement {
        if (_amount == 0) revert ZeroAmount();

        // Aave V3 Pool に supply → aToken を受け取る
        // aToken の残高は時間とともに自動で増加する（利息）
        aavePool.supply(asset, _amount, address(this), 0);

        emit FundsDeployed(_amount);
    }

    /// @notice Aave V3 から指定量を引出し
    /// @dev Yearn V3 の _freeFunds() に相当
    /// @param _amount 引出す量
    function freeFunds(uint256 _amount) external onlyManagement {
        if (_amount == 0) revert ZeroAmount();

        // aToken を burn して underlying asset を受け取る
        uint256 withdrawn = aavePool.withdraw(asset, _amount, address(this));
        if (withdrawn < _amount) revert InsufficientBalance();

        emit FundsFreed(withdrawn);
    }

    /// @notice 利益を収穫して総資産を報告
    /// @dev Yearn V3 の _harvestAndReport() に相当
    ///      Aave の場合、aToken の残高が自動で増えるので
    ///      特別な harvest 操作は不要。残高を返すだけ。
    /// @return totalAssets_ この戦略が管理する総資産額
    function harvestAndReport() external onlyManagement returns (uint256 totalAssets_) {
        // aToken 残高 = 元本 + 利息（自動複利）
        uint256 aTokenBalance = IAToken(aToken).balanceOf(address(this));

        // 手元に残っている未デプロイ分も加算
        uint256 loose = IERC20(asset).balanceOf(address(this));

        totalAssets_ = aTokenBalance + loose;

        emit Harvested(totalAssets_, 0); // Aave は利息が自動なので profit 計算は Vault 側で行う
    }

    // ═══════════════════════════════════════════════════════════
    //  Optional Overrides
    // ═══════════════════════════════════════════════════════════

    /// @notice 引出し可能な最大額
    function availableWithdrawLimit() external view returns (uint256) {
        // aToken 残高 + 手元の loose 資金
        return IAToken(aToken).balanceOf(address(this)) + IERC20(asset).balanceOf(address(this));
    }

    /// @notice 緊急時: 全額を Aave から引出し
    function emergencyWithdraw() external onlyManagement {
        uint256 aTokenBalance = IAToken(aToken).balanceOf(address(this));
        if (aTokenBalance > 0) {
            aavePool.withdraw(asset, type(uint256).max, address(this));
        }
    }

    // ─── Admin ──────────────────────────────────────────────────

    /// @notice 管理者変更
    function setManagement(address _management) external onlyManagement {
        management = _management;
    }
}
