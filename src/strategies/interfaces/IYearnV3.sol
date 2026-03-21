// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

/// @title ITokenizedStrategy - Yearn V3 Tokenized Strategy interface
/// @dev 実際のデプロイ時は `forge install yearn/tokenized-strategy` して
///      本物の BaseStrategy を使う。ここでは開発・テスト用にインターフェースを定義。
///
/// Yearn V3 の Strategy は以下の4関数を override する:
///   1. _deployFunds(uint256)     - 資金をプロトコルに投入
///   2. _freeFunds(uint256)       - 資金をプロトコルから引出し
///   3. _harvestAndReport()       - 利益収穫 & 総資産報告
///   4. _emergencyWithdraw(uint256) - 緊急引出し
///
/// ref: https://github.com/yearn/tokenized-strategy/blob/master/src/BaseStrategy.sol
interface ITokenizedStrategy {
    function asset() external view returns (address);
    function totalAssets() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function pricePerShare() external view returns (uint256);
    function deposit(uint256 assets, address receiver) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    function report() external returns (uint256 profit, uint256 loss);
    function tend() external;
    function isShutdown() external view returns (bool);
    function shutdownStrategy() external;
}

/// @title BaseStrategy - Yearn V3 の Strategy 基底コントラクト (ローカル実装)
/// @dev 本番では yearn/tokenized-strategy の BaseStrategy を使う。
///      ここではコンパイル・テスト用にミニマルな実装を提供。
///
/// Yearn V3 Strategy のライフサイクル:
///   1. Vault が deposit → TokenizedStrategy が _deployFunds() を呼ぶ
///   2. Keeper が report() → TokenizedStrategy が _harvestAndReport() を呼ぶ
///   3. Vault が withdraw → TokenizedStrategy が _freeFunds() を呼ぶ
///   4. Emergency → management が shutdownStrategy() → _emergencyWithdraw()
///
abstract contract BaseStrategy {
    // TokenizedStrategy が管理する状態
    address public tokenizedStrategy;
    address internal _asset;
    string public name;

    // ═══════════════════════════════════════════════════════════════
    //  Required Overrides - Strategy 作者がこの4つを実装する
    // ═══════════════════════════════════════════════════════════════

    /// @notice 資金をプロトコルに投入
    /// @param _amount 投入する asset の量
    function _deployFunds(uint256 _amount) internal virtual;

    /// @notice 指定量の資金をプロトコルから引出し
    /// @param _amount 引出す asset の量
    function _freeFunds(uint256 _amount) internal virtual;

    /// @notice 利益を収穫し、総資産を報告
    /// @return _totalAssets この Strategy が管理する総資産
    function _harvestAndReport() internal virtual returns (uint256 _totalAssets);

    /// @notice 緊急時の全額引出し
    /// @param _amount 引出す量 (type(uint256).max なら全額)
    function _emergencyWithdraw(uint256 _amount) internal virtual;

    // ═══════════════════════════════════════════════════════════════
    //  Optional Overrides
    // ═══════════════════════════════════════════════════════════════

    /// @notice 預入可能な最大額
    function availableDepositLimit(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    /// @notice 引出し可能な最大額
    function availableWithdrawLimit(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    /// @notice tend (リバランスのみ、利益報告なし) が必要か
    function _tendTrigger() internal view virtual returns (bool) {
        return false;
    }

    /// @notice tend の実行
    function _tend(uint256 _totalIdle) internal virtual {}

    // ═══════════════════════════════════════════════════════════════
    //  Modifiers (TokenizedStrategy から呼ばれる想定)
    // ═══════════════════════════════════════════════════════════════

    modifier onlyManagement() {
        require(msg.sender == tokenizedStrategy || msg.sender == _management(), "!management");
        _;
    }

    modifier onlyKeepers() {
        require(
            msg.sender == tokenizedStrategy || msg.sender == _management() || msg.sender == _keeper(),
            "!keeper"
        );
        _;
    }

    // ─── Internal helpers (本番では TokenizedStrategy が提供) ───

    function _management() internal view virtual returns (address) {
        return tokenizedStrategy;
    }

    function _keeper() internal view virtual returns (address) {
        return tokenizedStrategy;
    }

    function asset() public view returns (address) {
        return _asset;
    }
}
