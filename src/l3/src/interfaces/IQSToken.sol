// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IERC20.sol";

/// @title IQSToken
/// @notice Interface for QS Token with minting capability
interface IQSToken is IERC20 {
    /// @notice Mints new tokens
    /// @param to Recipient address
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external;
    
    /// @notice Burns tokens
    /// @param amount Amount to burn
    function burn(uint256 amount) external;
    
    /// @notice Burns tokens from an account
    /// @param from Account to burn from
    /// @param amount Amount to burn
    function burnFrom(address from, uint256 amount) external;
    
    /// @notice Returns the token name
    function name() external view returns (string memory);
    
    /// @notice Returns the token symbol
    function symbol() external view returns (string memory);
    
    /// @notice Returns the token decimals
    function decimals() external view returns (uint8);
    
    /// @notice Emitted when tokens are minted
    event Minted(address indexed to, uint256 amount);
    
    /// @notice Emitted when tokens are burned
    event Burned(address indexed from, uint256 amount);
}
