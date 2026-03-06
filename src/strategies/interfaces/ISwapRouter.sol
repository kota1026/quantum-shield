// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

/// @title ISwapRouter - Uniswap V3 SwapRouter interface (minimal)
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}
