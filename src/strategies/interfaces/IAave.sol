// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

/// @title IAaveV3Pool - Aave V3 Pool interface (minimal)
interface IAaveV3Pool {
    /// @notice Supplies an `amount` of underlying asset, receiving aTokens
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;

    /// @notice Withdraws an `amount` of underlying asset from the reserve
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/// @title IAToken - Aave aToken interface (minimal)
interface IAToken {
    function balanceOf(address account) external view returns (uint256);
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}
