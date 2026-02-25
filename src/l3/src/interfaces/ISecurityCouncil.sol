// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISecurityCouncil
/// @notice Interface for Quantum Shield Security Council
/// @dev Per SEQUENCES v2.0 #7, #8 - Security Council 6/9 for Veto
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md GOV-004
interface ISecurityCouncil {
    // ============ Events ============
    
    /// @notice Emitted when a member is added
    event MemberAdded(uint256 indexed seatId, address indexed member);
    
    /// @notice Emitted when a member is removed
    event MemberRemoved(uint256 indexed seatId, address indexed member);
    
    /// @notice Emitted when a member is replaced
    event MemberReplaced(
        uint256 indexed seatId,
        address indexed oldMember,
        address indexed newMember
    );
    
    /// @notice Emitted when an action is proposed
    event ActionProposed(
        bytes32 indexed actionId,
        ActionType actionType,
        address indexed proposer,
        bytes data,
        uint256 expiresAt
    );
    
    /// @notice Emitted when a member signs an action
    event ActionSigned(
        bytes32 indexed actionId,
        address indexed signer,
        uint256 signatureCount
    );
    
    /// @notice Emitted when an action is executed
    event ActionExecuted(
        bytes32 indexed actionId,
        ActionType actionType,
        address indexed executor
    );
    
    /// @notice Emitted when an action is cancelled
    event ActionCancelled(bytes32 indexed actionId);
    
    // ============ Errors ============
    
    /// @notice Thrown when caller is not a member
    error NotMember();
    
    /// @notice Thrown when caller is not the governor
    error NotGovernor();
    
    /// @notice Thrown when member address is invalid
    error InvalidMember();
    
    /// @notice Thrown when member already exists
    error DuplicateMember();
    
    /// @notice Thrown when seat ID is invalid
    error InvalidSeat();
    
    /// @notice Thrown when action doesn't exist
    error ActionNotFound();
    
    /// @notice Thrown when action is not active
    error ActionNotActive();
    
    /// @notice Thrown when member has already signed
    error AlreadySigned();
    
    /// @notice Thrown when threshold is not met
    error ThresholdNotMet();
    
    /// @notice Thrown when action has expired
    error ActionExpiredError();
    
    /// @notice Thrown when execution fails
    error ExecutionFailed();
    
    // ============ Enums ============
    
    /// @notice Action types requiring different thresholds
    enum ActionType {
        EmergencyPause,     // 5/9 - Pause protocol
        EmergencyUpgrade,   // 7/9 - Emergency upgrade
        Veto,               // 6/9 - Veto governance proposal
        MemberChange        // 6/9 - Change member (via governance)
    }
    
    /// @notice Action state
    enum ActionState {
        Proposed,
        Executed,
        Cancelled,
        Expired
    }
    
    // ============ Structs ============
    
    /// @notice Security Council action
    struct Action {
        bytes32 id;
        ActionType actionType;
        address proposer;
        uint256 proposedAt;
        uint256 expiresAt;
        uint256 signatureCount;
        ActionState state;
        bytes data;
    }
    
    // ============ View Functions ============
    
    /// @notice Maximum number of members (9)
    function MAX_MEMBERS() external view returns (uint256);
    
    /// @notice Action expiration time (48 hours)
    function ACTION_EXPIRY() external view returns (uint256);
    
    /// @notice Threshold for emergency pause (5/9)
    function PAUSE_THRESHOLD() external view returns (uint256);
    
    /// @notice Threshold for veto (6/9)
    function VETO_THRESHOLD() external view returns (uint256);
    
    /// @notice Threshold for emergency upgrade (7/9)
    function UPGRADE_THRESHOLD() external view returns (uint256);
    
    /// @notice Governor contract address
    function governor() external view returns (address);
    
    /// @notice Emergency controller address
    function emergencyController() external view returns (address);
    
    /// @notice Current member count (always 9)
    function memberCount() external view returns (uint256);
    
    /// @notice Check if address is a member
    /// @param account Address to check
    function isMember(address account) external view returns (bool);
    
    /// @notice Get member by seat ID
    /// @param seatId Seat ID (0-8)
    function getMember(uint256 seatId) external view returns (address);
    
    /// @notice Get seat ID for member
    /// @param member Member address
    function getSeatId(address member) external view returns (uint256);
    
    /// @notice Get action details
    /// @param actionId Action ID
    function getAction(bytes32 actionId) external view returns (Action memory);
    
    /// @notice Check if member has signed action
    /// @param actionId Action ID
    /// @param signer Signer address
    function hasSigned(bytes32 actionId, address signer) external view returns (bool);
    
    /// @notice Get signature count for action
    /// @param actionId Action ID
    function getSignatureCount(bytes32 actionId) external view returns (uint256);
    
    /// @notice Get valid signature count (only current members)
    /// @param actionId Action ID
    function getValidSignatureCount(bytes32 actionId) external view returns (uint256);
    
    /// @notice Get threshold for action type
    /// @param actionType Action type
    function getThreshold(ActionType actionType) external pure returns (uint256);
    
    /// @notice Check if action is ready to execute
    /// @param actionId Action ID
    function isActionReady(bytes32 actionId) external view returns (bool);
    
    /// @notice Check if action is expired
    /// @param actionId Action ID
    function isActionExpired(bytes32 actionId) external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice Propose an action
    /// @param actionType Type of action
    /// @param data Action data
    /// @return actionId ID of the proposed action
    function proposeAction(
        ActionType actionType,
        bytes calldata data
    ) external returns (bytes32 actionId);
    
    /// @notice Sign an action
    /// @param actionId Action ID to sign
    function signAction(bytes32 actionId) external;
    
    /// @notice Execute an action (if threshold met)
    /// @param actionId Action ID to execute
    function executeAction(bytes32 actionId) external;
    
    /// @notice Replace a member (via governance)
    /// @param seatId Seat ID
    /// @param newMember New member address
    function replaceMember(uint256 seatId, address newMember) external;
    
    /// @notice Set governor address
    /// @param newGovernor New governor address
    function setGovernor(address newGovernor) external;
    
    /// @notice Set emergency controller address
    /// @param newController New controller address
    function setEmergencyController(address newController) external;
}
