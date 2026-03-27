// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

import {RealYieldAggregatorV2} from "../RealYieldAggregatorV2.sol";

/// @title GelatoResolver
/// @notice Gelato Automate 用の Resolver コントラクト
///         harvest() や tend() を自動実行するための判定ロジック
///
/// Gelato Automate 登録手順:
///   1. このコントラクトをデプロイ
///   2. app.gelato.network でタスク作成
///   3. Resolver: このコントラクトの checker() を指定
///   4. Execute: strategy の harvestAndReport() を指定
///   5. 実行間隔: Every block (Resolver が判定するので)
///
/// なぜ Gelato か:
///   - Yearn 自体も Gelato/Chainlink Keeper を使っている
///   - ガス代は Gelato が立替 → 後でトークンで精算
///   - ダウンタイムなし（自前 Bot より信頼性高い）
///
contract GelatoResolver {
    RealYieldAggregatorV2 public immutable strategy;

    /// @notice harvest すべき最小利益 (USDC, 6 decimals)
    /// @dev ガス代を上回る利益がある場合のみ実行
    uint256 public minProfitToHarvest = 100e6; // $100

    /// @notice 最大 harvest 間隔（これを超えたら利益に関係なく実行）
    uint256 public maxHarvestDelay = 7 days;

    address public owner;

    constructor(address _strategy) {
        strategy = RealYieldAggregatorV2(_strategy);
        owner = msg.sender;
    }

    /// @notice Gelato が毎ブロック呼ぶチェッカー関数
    /// @return canExec 実行すべきか
    /// @return execPayload 実行するトランザクションデータ
    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        // Condition 1: リバランスが必要
        if (strategy.needsRebalance()) {
            return (
                true,
                abi.encodeWithSignature("report()")
            );
        }

        // Condition 2: 最大間隔を超過
        uint256 lastHarvest = strategy.lastHarvest();
        if (lastHarvest > 0 && block.timestamp > lastHarvest + maxHarvestDelay) {
            return (
                true,
                abi.encodeWithSignature("report()")
            );
        }

        // Condition 3: 十分な利益が蓄積
        uint256 currentAssets = strategy.estimatedTotalAssets();
        uint256 prevAssets = strategy.prevAssets();
        if (prevAssets > 0 && currentAssets > prevAssets + minProfitToHarvest) {
            return (
                true,
                abi.encodeWithSignature("report()")
            );
        }

        return (false, bytes(""));
    }

    // ─── Config ────────────────────────────────────────

    function setMinProfitToHarvest(uint256 _min) external {
        require(msg.sender == owner, "!owner");
        minProfitToHarvest = _min;
    }

    function setMaxHarvestDelay(uint256 _delay) external {
        require(msg.sender == owner, "!owner");
        maxHarvestDelay = _delay;
    }
}
