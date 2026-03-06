// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

/// @title IComet - Compound V3 (Comet) interface (minimal)
interface IComet {
    /// @notice Supply an amount of base asset to Compound
    function supply(address asset, uint256 amount) external;

    /// @notice Withdraw an amount of base asset from Compound
    function withdraw(address asset, uint256 amount) external;

    /// @notice Get the balance of an account (including accrued interest)
    function balanceOf(address account) external view returns (uint256);

    /// @notice Get the base token address
    function baseToken() external view returns (address);
}

/// @title ICometRewards - Compound V3 rewards interface
interface ICometRewards {
    /// @notice Claim COMP rewards for a given comet market
    function claim(address comet, address src, bool shouldAccrue) external;

    /// @notice Get reward info
    function getRewardOwed(address comet, address account)
        external
        returns (address token, uint256 owed);
}
