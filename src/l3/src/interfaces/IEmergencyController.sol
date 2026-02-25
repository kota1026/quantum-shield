// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IEmergencyController
/// @notice Interface for Quantum Shield Emergency Controller
/// @dev Per SEQUENCES v2.0 #8 - Emergency Pause & Recovery
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md GOV-005
interface IEmergencyController {
    // ============ Events ============
    
    /// @notice Emitted when protocol is paused
    event ProtocolPaused(
        address indexed pausedBy,
        string reason,
        uint256 pausedUntil
    );
    
    /// @notice Emitted when protocol is unpaused
    event ProtocolUnpaused(address indexed unpausedBy);
    
    /// @notice Emitted when pause is extended
    event PauseExtended(
        uint256 indexed extensionId,
        uint256 newEndTime,
        uint256 votesFor
    );
    
    /// @notice Emitted when extension is proposed
    event ExtensionProposed(
        uint256 indexed extensionId,
        uint256 requestedDuration,
        address proposer
    );
    
    /// @notice Emitted when extension is voted on
    event ExtensionVoted(
        uint256 indexed extensionId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    
    /// @notice Emitted when recovery action is taken
    event RecoveryAction(
        bytes32 indexed actionId,
        RecoveryType recoveryType,
        bytes data
    );
    
    /// @notice Emitted when guardian is updated
    event GuardianUpdated(address indexed oldGuardian, address indexed newGuardian);
    
    // ============ Errors ============
    
    /// @notice Thrown when caller is not authorized
    error NotAuthorized();
    
    /// @notice Thrown when protocol is already paused
    error AlreadyPaused();
    
    /// @notice Thrown when protocol is not paused
    error NotPaused();
    
    /// @notice Thrown when pause duration is invalid
    error InvalidDuration();
    
    /// @notice Thrown when extension already exists
    error ExtensionAlreadyExists();
    
    /// @notice Thrown when extension not found
    error ExtensionNotFound();
    
    /// @notice Thrown when extension voting is not active
    error ExtensionVotingNotActive();
    
    /// @notice Thrown when already voted on extension
    error AlreadyVotedOnExtension();
    
    /// @notice Thrown when extension not approved
    error ExtensionNotApproved();
    
    /// @notice Thrown when max extensions reached
    error MaxExtensionsReached();
    
    /// @notice Thrown when cooldown not met
    error CooldownNotMet();
    
    /// @notice Thrown when invalid recovery action
    error InvalidRecoveryAction();
    
    // ============ Enums ============
    
    /// @notice Recovery action types
    enum RecoveryType {
        ContractUpgrade,    // Emergency upgrade
        ParameterChange,    // Emergency parameter update
        FundsRecovery,      // Rescue stuck funds
        CircuitBreaker      // Permanent disable function
    }
    
    /// @notice Extension state
    enum ExtensionState {
        Proposed,
        Active,
        Approved,
        Rejected,
        Executed,
        Expired
    }
    
    // ============ Structs ============
    
    /// @notice Pause state
    struct PauseState {
        bool paused;
        address pausedBy;
        uint256 pausedAt;
        uint256 pausedUntil;
        string reason;
        uint256 extensionCount;
    }
    
    /// @notice Extension request
    struct ExtensionRequest {
        uint256 id;
        uint256 requestedDuration;
        uint256 proposedAt;
        uint256 votingDeadline;
        uint256 votesFor;
        uint256 votesAgainst;
        ExtensionState state;
        address proposer;
    }
    
    // ============ View Functions ============
    
    /// @notice Maximum initial pause duration (72 hours)
    function MAX_PAUSE_DURATION() external view returns (uint256);
    
    /// @notice Maximum extension duration (7 days)
    function MAX_EXTENSION_DURATION() external view returns (uint256);
    
    /// @notice Extension voting period (48 hours)
    function EXTENSION_VOTING_PERIOD() external view returns (uint256);
    
    /// @notice Maximum number of extensions
    function MAX_EXTENSIONS() external view returns (uint256);
    
    /// @notice Cooldown between pauses (24 hours)
    function PAUSE_COOLDOWN() external view returns (uint256);
    
    /// @notice Security Council address
    function securityCouncil() external view returns (address);
    
    /// @notice veQS token address (for extension voting)
    function veQS() external view returns (address);
    
    /// @notice Guardian address (for recovery)
    function guardian() external view returns (address);
    
    /// @notice Get current pause state
    function getPauseState() external view returns (PauseState memory);
    
    /// @notice Check if protocol is paused
    function isPaused() external view returns (bool);
    
    /// @notice Get time remaining in pause
    function pauseTimeRemaining() external view returns (uint256);
    
    /// @notice Get extension request details
    /// @param extensionId Extension ID
    function getExtension(uint256 extensionId) external view returns (ExtensionRequest memory);
    
    /// @notice Check if address has voted on extension
    /// @param extensionId Extension ID
    /// @param voter Voter address
    function hasVotedOnExtension(uint256 extensionId, address voter) external view returns (bool);
    
    /// @notice Get last pause timestamp
    function lastPauseTimestamp() external view returns (uint256);
    
    /// @notice Get extension count for current pause
    function currentExtensionCount() external view returns (uint256);
    
    /// @notice Quorum for extension approval (4% of veQS total)
    function extensionQuorum() external view returns (uint256);
    
    // ============ State-Changing Functions ============
    
    /// @notice Pause the protocol (Security Council 5/9)
    /// @param reason Reason for pause
    /// @param duration Duration of pause (max 72 hours)
    function pause(string calldata reason, uint256 duration) external;
    
    /// @notice Unpause the protocol
    /// @dev Can be called by Security Council or after pause expires
    function unpause() external;
    
    /// @notice Propose pause extension (requires token vote)
    /// @param duration Requested extension duration
    /// @return extensionId ID of the extension request
    function proposeExtension(uint256 duration) external returns (uint256 extensionId);
    
    /// @notice Vote on extension
    /// @param extensionId Extension ID
    /// @param support Whether to support extension
    function voteOnExtension(uint256 extensionId, bool support) external;
    
    /// @notice Execute approved extension
    /// @param extensionId Extension ID
    function executeExtension(uint256 extensionId) external;
    
    /// @notice Execute recovery action (Guardian + Security Council)
    /// @param recoveryType Type of recovery
    /// @param data Recovery data
    /// @return actionId ID of recovery action
    function executeRecovery(
        RecoveryType recoveryType,
        bytes calldata data
    ) external returns (bytes32 actionId);
    
    /// @notice Set guardian address
    /// @param newGuardian New guardian address
    function setGuardian(address newGuardian) external;
    
    /// @notice Set Security Council address
    /// @param newSecurityCouncil New Security Council address
    function setSecurityCouncil(address newSecurityCouncil) external;
}
