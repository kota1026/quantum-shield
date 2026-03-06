// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.18;

/// @title ICurvePool - Curve StableSwap pool interface (minimal, 3pool example)
interface ICurvePool {
    /// @notice Add liquidity to the pool
    /// @param amounts Array of amounts for each coin (e.g. [DAI, USDC, USDT])
    /// @param min_mint_amount Minimum LP tokens to mint
    function add_liquidity(uint256[3] calldata amounts, uint256 min_mint_amount) external;

    /// @notice Remove liquidity in a single coin
    /// @param _token_amount Amount of LP tokens to burn
    /// @param i Index of coin to withdraw
    /// @param _min_amount Minimum amount of coin to receive
    function remove_liquidity_one_coin(uint256 _token_amount, int128 i, uint256 _min_amount) external;

    /// @notice Calculate the amount of LP tokens for given deposits
    function calc_token_amount(uint256[3] calldata amounts, bool deposit) external view returns (uint256);

    /// @notice Calculate withdrawal amount for single coin
    function calc_withdraw_one_coin(uint256 _token_amount, int128 i) external view returns (uint256);

    /// @notice Get the number of coins in the pool
    function coins(uint256 i) external view returns (address);
}

/// @title ICurveGauge - Curve gauge for staking LP tokens and earning CRV
interface ICurveGauge {
    function deposit(uint256 _value) external;
    function withdraw(uint256 _value) external;
    function balanceOf(address account) external view returns (uint256);
    function claim_rewards() external;
    function claimable_reward(address _addr, address _token) external view returns (uint256);
}

/// @title ICurveMinter - CRV minter
interface ICurveMinter {
    function mint(address gauge_addr) external;
}
