// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernanceSwitch} from "./IGovernanceSwitch.sol";
import {ITokenSwitch} from "./ITokenSwitch.sol";

/// @title IExternalBridgeAdapter
/// @notice Interface for Layer interconnection adapter
/// @dev Part of Quantum Shield's Modular Architecture
///      Provides indirect reference between Core Layer and Pluggable Layers
///      to avoid direct dependency violations
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md IMPL-001, SPEC_STRATEGY_BRIDGE §3, §6, §7
interface IExternalBridgeAdapter {
    // ============ Errors ============
    
    /// @notice Thrown when governance and token mode combination is invalid
    /// @dev DECENTRALIZED + DISABLED is prohibited (veQS voting not possible)
    /// @param govMode Current governance mode
    /// @param tokenMode Current token mode
    error InvalidModeComposition(
        IGovernanceSwitch.GovernanceMode govMode,
        ITokenSwitch.TokenMode tokenMode
    );
    
    /// @notice Thrown when caller is not authorized for the action
    /// @param caller The unauthorized caller address
    /// @param action The action selector that was attempted
    error UnauthorizedCaller(address caller, bytes4 action);
    
    /// @notice Thrown when adapter is not initialized
    error NotInitialized();
    
    /// @notice Thrown when already initialized
    error AlreadyInitialized();
    
    /// @notice Thrown when zero address is provided
    error ZeroAddress();
    
    /// @notice Thrown when action is not supported
    error UnsupportedAction(bytes4 action);
    
    // ============ Events ============
    
    /// @notice Emitted when Layer references are updated
    /// @param governance New governance switch address
    /// @param token New token switch address
    event LayerReferenceUpdated(
        address indexed governance,
        address indexed token
    );
    
    /// @notice Emitted when mode compatibility is validated
    /// @param govMode Governance mode
    /// @param tokenMode Token mode
    /// @param valid Whether the combination is valid
    event ModeCompatibilityChecked(
        IGovernanceSwitch.GovernanceMode indexed govMode,
        ITokenSwitch.TokenMode indexed tokenMode,
        bool valid
    );
    
    /// @notice Emitted when an action authorization is checked
    /// @param action Action selector
    /// @param caller Caller address
    /// @param authorized Whether the caller is authorized
    event ActionAuthorizationChecked(
        bytes4 indexed action,
        address indexed caller,
        bool authorized
    );
    
    // ============ View Functions ============
    
    /// @notice Get current governance mode from GovernanceSwitch
    /// @return Current GovernanceMode enum value
    function getGovernanceMode() external view returns (IGovernanceSwitch.GovernanceMode);
    
    /// @notice Get current token mode from TokenSwitch
    /// @return Current TokenMode enum value
    function getTokenMode() external view returns (ITokenSwitch.TokenMode);
    
    /// @notice Check if caller can execute a Core operation
    /// @dev Authorization depends on current governance mode:
    ///      - CENTRALIZED: admin only
    ///      - MULTISIG: N/M approval
    ///      - DECENTRALIZED: Security Council approval
    /// @param action Action selector (function signature)
    /// @param caller Address attempting the action
    /// @return True if caller is authorized
    function canExecuteCoreAction(bytes4 action, address caller) external view returns (bool);
    
    /// @notice Check if an operation requires Token Layer
    /// @dev Used to determine if QS token operations are needed
    /// @param action Action selector
    /// @return True if Token Layer is required
    function isTokenRequired(bytes4 action) external view returns (bool);
    
    /// @notice Validate current mode combination
    /// @dev DECENTRALIZED + DISABLED is prohibited (SPEC_STRATEGY_BRIDGE §2.2)
    /// @return True if current mode combination is valid
    function validateLayerCompatibility() external view returns (bool);
    
    /// @notice Get stake currency address
    /// @dev DISABLED: address(0) = ETH
    ///      BASIC/FULL: QS token address
    /// @return Stake currency address
    function getStakeCurrency() external view returns (address);
    
    /// @notice Get minimum stake amount
    /// @dev DISABLED: $400K equivalent
    ///      BASIC/FULL: $500K equivalent
    /// @return Minimum stake amount in wei
    function getMinimumStake() external view returns (uint256);
    
    /// @notice Check if account has veQS voting power
    /// @dev Only relevant in DECENTRALIZED governance mode
    /// @param account Account to check
    /// @return True if account has voting power
    function hasVotingPower(address account) external view returns (bool);
    
    /// @notice Get governance switch address
    /// @return Governance switch contract address
    function getGovernanceSwitchAddress() external view returns (address);
    
    /// @notice Get token switch address
    /// @return Token switch contract address
    function getTokenSwitchAddress() external view returns (address);
    
    /// @notice Check if adapter is initialized
    /// @return True if initialized with valid references
    function isInitialized() external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice Initialize Layer references
    /// @dev Can only be called once during deployment
    /// @param governance GovernanceSwitch contract address
    /// @param token TokenSwitch contract address
    function initialize(address governance, address token) external;
    
    /// @notice Update Layer references (restricted)
    /// @dev Requires appropriate authorization based on governance mode
    /// @param governance New GovernanceSwitch contract address
    /// @param token New TokenSwitch contract address
    function updateLayerReferences(address governance, address token) external;
}
