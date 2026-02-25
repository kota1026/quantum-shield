// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ITokenSwitch
/// @notice Interface for the Pluggable Token Layer switch mechanism
/// @dev Part of Quantum Shield's Modular Architecture (MODULAR_ARCHITECTURE.md §3.2)
/// @custom:security-contact security@quantumshield.io
interface ITokenSwitch {
    // ============ Enums ============
    
    /// @notice Token operation modes
    /// @dev DISABLED: No token, ETH/USDC fees (Phase 1 / Transfer minimal)
    /// @dev BASIC: QS Token basic functionality
    /// @dev FULL: veQS + Staking + Rewards (Phase 3+)
    enum TokenMode {
        DISABLED,
        BASIC,
        FULL
    }
    
    // ============ Events ============
    
    /// @notice Emitted when token mode is changed
    /// @param oldMode Previous token mode
    /// @param newMode New token mode
    /// @param changedBy Address that initiated the change
    event TokenModeChanged(
        TokenMode indexed oldMode,
        TokenMode indexed newMode,
        address indexed changedBy
    );
    
    /// @notice Emitted when fee token is updated
    /// @param oldToken Previous fee token address
    /// @param newToken New fee token address
    event FeeTokenUpdated(
        address indexed oldToken,
        address indexed newToken
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when caller lacks permission
    error Unauthorized();
    
    /// @notice Thrown when mode transition is invalid
    error InvalidModeTransition(TokenMode from, TokenMode to);
    
    /// @notice Thrown when token address is invalid
    error InvalidTokenAddress();
    
    /// @notice Thrown when operation requires higher token mode
    error InsufficientTokenMode(TokenMode required, TokenMode current);
    
    // ============ View Functions ============
    
    /// @notice Get current token mode
    /// @return Current TokenMode enum value
    function getTokenMode() external view returns (TokenMode);
    
    /// @notice Get QS token address
    /// @dev Returns address(0) in DISABLED mode
    /// @return QS token contract address
    function getTokenAddress() external view returns (address);
    
    /// @notice Get fee token address
    /// @dev Returns address(0) for ETH in DISABLED mode
    /// @return Fee token address or address(0) for ETH
    function getFeeToken() external view returns (address);
    
    /// @notice Get stake currency address
    /// @dev DISABLED: address(0) = ETH
    /// @dev BASIC/FULL: QS token address
    /// @return Stake currency address
    function getStakeCurrency() external view returns (address);
    
    /// @notice Get minimum stake amount
    /// @dev DISABLED: $400K equivalent in ETH
    /// @dev BASIC/FULL: $500K equivalent in QS
    /// @return Minimum stake amount in wei
    function getMinimumStake() external view returns (uint256);
    
    /// @notice Check if veQS features are enabled
    /// @return True if mode is FULL
    function isVeQSEnabled() external view returns (bool);
    
    /// @notice Check if staking rewards are enabled
    /// @return True if mode is FULL
    function isStakingEnabled() external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice Change token mode
    /// @dev Requires Governance Layer approval
    /// @param newMode Target token mode
    function setTokenMode(TokenMode newMode) external;
    
    /// @notice Update QS token address
    /// @dev Only callable during initial setup or upgrade
    /// @param tokenAddress New QS token address
    function setTokenAddress(address tokenAddress) external;
}
