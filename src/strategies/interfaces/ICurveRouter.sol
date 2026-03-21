// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

/// @title ICurveRouter - Curve Router V1.1 interface
/// @dev Curve Router は複数プールを跨いだ最適ルーティングを提供
///      単一プールでは USDC/DAI/FRAX/USDe 全てをカバーできないため、
///      Router 経由で最適ルートを使う
///
/// Mainnet: 0xF0d4c12A5768D806021F80a262B4d39d26C58b8D (Router V1.1)
///
/// ルーティング例:
///   USDC → DAI:  3pool (USDC→DAI direct)
///   USDC → FRAX: FRAXBP (USDC→FRAX direct) or 3pool→FRAXBP
///   USDC → USDe: USDe/USDC pool (direct) or via intermediate
///
interface ICurveRouter {
    /// @notice Perform an exchange using the router
    /// @param _route Array of [token, pool, token, pool, ...] addresses
    ///        Route is defined as [input_token, pool1, intermediate_token, pool2, output_token, ...]
    ///        Unused elements should be address(0)
    /// @param _swap_params Array of [i, j, swap_type, pool_type, n_coins] for each swap
    ///        i: input coin index in pool
    ///        j: output coin index in pool
    ///        swap_type: 1=exchange, 2=exchange_underlying, 3=exchange_ng
    ///        pool_type: 0=plain, 1=lending, 2=meta
    ///        n_coins: number of coins in pool
    /// @param _amount Amount of input token
    /// @param _expected Minimum output amount
    /// @return Output amount received
    function exchange(
        address[11] calldata _route,
        uint256[5][5] calldata _swap_params,
        uint256 _amount,
        uint256 _expected
    ) external payable returns (uint256);

    /// @notice Get expected output amount
    function get_dy(
        address[11] calldata _route,
        uint256[5][5] calldata _swap_params,
        uint256 _amount
    ) external view returns (uint256);

    /// @notice Get the best exchange rate across all pools
    function get_exchange_amount(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (uint256);
}
