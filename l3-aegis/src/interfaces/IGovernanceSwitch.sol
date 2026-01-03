// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGovernanceSwitch
/// @notice Interface for the Pluggable Governance Layer switch mechanism
/// @dev Part of Quantum Shield's Modular Architecture (MODULAR_ARCHITECTURE.md §3.1)
/// @dev DECEN-009~011: Production mode transitions and emergency rollback
/// @custom:security-contact security@quantumshield.io
interface IGovernanceSwitch {
    // ============ Enums ============
    
    /// @notice Governance operation modes
    /// @dev TRAINING: Initial test period with TVL limits (Phase 3.3)
    /// @dev CENTRALIZED: Single admin control (Phase 1)
    /// @dev MULTISIG: N/M multisig approval (Phase 2)
    /// @dev DECENTRALIZED: Security Council + DAO voting (Phase 3+)
    enum GovernanceMode {
        TRAINING,       // New: Initial deployment with safety limits
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
    
    /// @notice Emitted when mode transition is initiated (DECEN-010)
    /// @param targetMode Target governance mode
    /// @param initiator Who initiated the transition
    /// @param unlockTime When the transition can be finalized
    event ModeTransitionInitiated(
        GovernanceMode indexed targetMode,
        address indexed initiator,
        uint256 unlockTime
    );
    
    /// @notice Emitted when emergency rollback is triggered (DECEN-011)
    /// @param fromMode Mode being rolled back from
    /// @param toMode Mode being rolled back to
    /// @param triggeredBy Who triggered the rollback
    /// @param reason Reason for the rollback
    event EmergencyRollback(
        GovernanceMode indexed fromMode,
        GovernanceMode indexed toMode,
        address indexed triggeredBy,
        string reason
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when caller lacks permission
    error Unauthorized();
    
    /// @notice Thrown when mode transition is invalid
    error InvalidModeTransition(GovernanceMode from, GovernanceMode to);
    
    /// @notice Thrown when action cannot be approved
    error CannotApprove(bytes4 action);
    
    /// @notice Thrown when rollback conditions are not met (DECEN-011)
    error RollbackNotAllowed(string reason);
    
    /// @notice Thrown when Security Council approval is missing
    error SecurityCouncilApprovalRequired();
    
    // ============ View Functions ============
    
    /// @notice Get current governance mode
    /// @return Current GovernanceMode enum value
    function getCurrentMode() external view returns (GovernanceMode);
    
    /// @notice Get current governance mode (alias for compatibility)
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
    
    /// @notice Get current admin address (CENTRALIZED/TRAINING mode)
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
    
    /// @notice Check if system is in training mode (DECEN-009)
    /// @return True if in TRAINING mode
    function isTrainingMode() external view returns (bool);
    
    /// @notice Check if emergency rollback is available (DECEN-011)
    /// @return True if rollback can be initiated
    function canInitiateRollback() external view returns (bool);
    
    /// @notice Check if address is an authorized multi-sig signer
    /// @param signer Address to check
    /// @return True if signer is authorized
    function isAuthorizedSigner(address signer) external view returns (bool);
    
    /// @notice Check if address is a governance executor
    /// @param executor Address to check
    /// @return True if executor is authorized
    function isGovernanceExecutor(address executor) external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice Change governance mode
    /// @dev Access control:
    ///      - TRAINING: admin only → CENTRALIZED
    ///      - CENTRALIZED: admin only → MULTISIG
    ///      - MULTISIG: required signatures → DECENTRALIZED
    ///      - DECENTRALIZED: Security Council + Time Lock
    /// @param newMode Target governance mode
    function setGovernanceMode(GovernanceMode newMode) external;
    
    /// @notice Approve an action (mode-dependent)
    /// @param action Action selector
    /// @param data Action-specific data
    function approveAction(bytes4 action, bytes calldata data) external;
    
    /// @notice Initiate mode transition with time lock (DECEN-010)
    /// @param targetMode Target governance mode
    function initiateTransition(GovernanceMode targetMode) external;
    
    /// @notice Finalize pending transition after time lock
    function finalizeTransition() external;
    
    /// @notice Initiate emergency rollback (DECEN-011)
    /// @param reason Reason for the rollback
    /// @dev Requires Security Council supermajority (7/9)
    function initiateEmergencyRollback(string calldata reason) external;
    
    /// @notice Approve emergency rollback (Security Council member)
    function approveEmergencyRollback() external;
    
    /// @notice Execute approved emergency rollback
    function executeEmergencyRollback() external;
}
