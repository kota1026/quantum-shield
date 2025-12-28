// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGovernanceSwitch
/// @notice Interface for the Pluggable Governance Layer switch mechanism
/// @dev Part of Quantum Shield's Modular Architecture (MODULAR_ARCHITECTURE.md §3.1)
/// @custom:security-contact security@quantumshield.io
interface IGovernanceSwitch {
    // ============ Enums ============
    
    /// @notice Governance operation modes
    /// @dev CENTRALIZED: Single admin control (Phase 1)
    /// @dev MULTISIG: N/M multisig approval (Phase 2)
    /// @dev DECENTRALIZED: Security Council + DAO voting (Phase 3+)
    enum GovernanceMode {
        CENTRALIZED,
        MULTISIG,
        DECENTRALIZED
    }
    
    // ============ Events ============
    
    /// @notice Emitted when governance mode is changed
    /// @param oldMode Previous governance mode
    /// @param newMode New governance mode
    /// @param changedBy Address that initiated the change
    event GovernanceModeChanged(
        GovernanceMode indexed oldMode,
        GovernanceMode indexed newMode,
        address indexed changedBy
    );
    
    /// @notice Emitted when an action is approved
    /// @param action Action selector
    /// @param approver Address that approved
    /// @param data Action-specific data
    event ActionApproved(
        bytes4 indexed action,
        address indexed approver,
        bytes data
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when caller lacks permission
    error Unauthorized();
    
    /// @notice Thrown when mode transition is invalid
    error InvalidModeTransition(GovernanceMode from, GovernanceMode to);
    
    /// @notice Thrown when action cannot be approved
    error CannotApprove(bytes4 action);
    
    // ============ View Functions ============
    
    /// @notice Get current governance mode
    /// @return Current GovernanceMode enum value
    function getGovernanceMode() external view returns (GovernanceMode);
    
    /// @notice Get approver address for a specific action
    /// @param action Action selector (function signature)
    /// @return Approver address (varies by mode)
    function getApprover(bytes4 action) external view returns (address);
    
    /// @notice Check if caller can approve an action
    /// @param action Action selector
    /// @param caller Address to check
    /// @return True if caller can approve the action
    function canApprove(bytes4 action, address caller) external view returns (bool);
    
    /// @notice Get current admin address (CENTRALIZED mode)
    /// @return Admin address or zero if not applicable
    function getAdmin() external view returns (address);
    
    /// @notice Get multisig configuration (MULTISIG mode)
    /// @return threshold Required signatures
    /// @return total Total signers
    function getMultisigConfig() external view returns (uint256 threshold, uint256 total);
    
    /// @notice Get Security Council configuration (DECENTRALIZED mode)
    /// @return threshold Required council votes
    /// @return total Total council members
    function getSecurityCouncilConfig() external view returns (uint256 threshold, uint256 total);
    
    // ============ State-Changing Functions ============
    
    /// @notice Change governance mode
    /// @dev Access control:
    ///      - CENTRALIZED: admin only
    ///      - MULTISIG: required signatures
    ///      - DECENTRALIZED: Security Council + Time Lock
    /// @param newMode Target governance mode
    function setGovernanceMode(GovernanceMode newMode) external;
    
    /// @notice Approve an action (mode-dependent)
    /// @param action Action selector
    /// @param data Action-specific data
    function approveAction(bytes4 action, bytes calldata data) external;
}
