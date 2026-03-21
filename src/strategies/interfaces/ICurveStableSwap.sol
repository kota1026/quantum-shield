// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

/// @title ICurveStableSwapNG - Curve StableSwap NG (new generation) for stablecoin swaps
/// @dev DAI↔USDC↔FRAX↔USDe のスワップに使用
interface ICurveStableSwapNG {
    /// @notice Get the amount of coin j received for swapping dx of coin i
    function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256);

    /// @notice Swap coin i for coin j
    function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256);

    /// @notice Get coin address by index
    function coins(uint256 i) external view returns (address);
}
