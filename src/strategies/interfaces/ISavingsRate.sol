// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

/// @title ISDAI - MakerDAO Savings DAI (sDAI) interface
/// @dev sDAI は ERC-4626 Vault。DSR (DAI Savings Rate) の利回りを自動複利。
interface ISDAI {
    /// @notice DAI を預けて sDAI を受け取る
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    /// @notice sDAI を burn して DAI を引き出す
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);

    /// @notice sDAI のシェア残高
    function balanceOf(address account) external view returns (uint256);

    /// @notice shares → assets の変換（現在の exchange rate 込み）
    function convertToAssets(uint256 shares) external view returns (uint256);

    /// @notice assets → shares の変換
    function convertToShares(uint256 assets) external view returns (uint256);

    /// @notice 1 sDAI あたりの DAI 量（PPS）
    function previewRedeem(uint256 shares) external view returns (uint256);

    /// @notice 預入可能な最大額
    function maxDeposit(address) external view returns (uint256);

    /// @notice 総資産 (DAI建て)
    function totalAssets() external view returns (uint256);
}

/// @title ISFrax - Frax Finance Staked FRAX (sFRAX) interface
/// @dev sFRAX も ERC-4626。Frax AMO の利回りを反映。
interface ISFrax {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function balanceOf(address account) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function previewRedeem(uint256 shares) external view returns (uint256);
    function totalAssets() external view returns (uint256);
}

/// @title ISUSDe - Ethena Staked USDe (sUSDe) interface
/// @dev sUSDe は ERC-4626。Funding Rate 由来の利回り。
interface ISUSDe {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function balanceOf(address account) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function previewRedeem(uint256 shares) external view returns (uint256);
    function totalAssets() external view returns (uint256);
    /// @notice sUSDe は unstake に 7日の cooldown がある
    function cooldownDuration() external view returns (uint24);
}
