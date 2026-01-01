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
    event MemberAdded(address indexed member, uint256 indexed seatId);
    
    /// @notice Emitted when a member is removed
    event MemberRemoved(address indexed member, uint256 indexed seatId);
    
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
        bytes data,
        address proposer
    );
    
    /// @notice Emitted when a member signs an action
    event ActionSigned(bytes32 indexed actionId, address indexed signer);
    
    /// @notice Emitted when an action is executed
    event ActionExecuted(bytes32 indexed actionId, ActionType actionType);
    
    /// @notice Emitted when an action is cancelled
    event ActionCancelled(bytes32 indexed actionId);
    
    /// @notice Emitted when a veto is cast
    event VetoCast(uint256 indexed proposalId, bytes32 indexed actionId);
    
    /// @notice Emitted when threshold is updated
    event ThresholdUpdated(ActionType actionType, uint256 newThreshold);
    
    // ============ Errors ============
    
    /// @notice Thrown when caller is not a member
    error NotMember();
    
    /// @notice Thrown when member already exists
    error MemberAlreadyExists();
    
    /// @notice Thrown when member doesn't exist
    error MemberNotFound();
    
    /// @notice Thrown when action doesn't exist
    error ActionNotFound();
    
    /// @notice Thrown when action already exists
    error ActionAlreadyExists();
    
    /// @notice Thrown when member has already signed
    error AlreadySigned();
    
    /// @notice Thrown when threshold is not met
    error ThresholdNotMet();
    
    /// @notice Thrown when action has expired
    error ActionExpired();
    
    /// @notice Thrown when action is already executed
    error ActionAlreadyExecuted();
    
    /// @notice Thrown when invalid threshold is set
    error InvalidThreshold();
    
    /// @notice Thrown when seat is occupied
    error SeatOccupied();
    
    /// @notice Thrown when seat is empty
    error SeatEmpty();
    
    /// @notice Thrown when invalid parameters are provided
    error InvalidParameters();
    
    /// @notice Thrown when max members exceeded
    error MaxMembersExceeded();
    
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
        Pending,
        Executed,
        Cancelled,
        Expired
    }
    
    // ============ Structs ============
    
    /// @notice Security Council action
    struct Action {
        bytes32 id;
        ActionType actionType;
        bytes data;
        address proposer;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 signatureCount;
        ActionState state;
    }
    
    /// @notice Member info
    struct Member {
        address addr;
        uint256 seatId;
        uint256 joinedAt;
        bool active;
    }
    
    // ============ View Functions ============
    
    /// @notice Maximum number of members
    function MAX_MEMBERS() external view returns (uint256);
    
    /// @notice Action expiration time (48 hours)
    function ACTION_EXPIRY() external view returns (uint256);
    
    /// @notice Threshold for emergency pause (5/9)
    function PAUSE_THRESHOLD() external view returns (uint256);
    
    /// @notice Threshold for veto (6/9)
    function VETO_THRESHOLD() external view returns (uint256);
    
    /// @notice Threshold for emergency upgrade (7/9)
    function UPGRADE_THRESHOLD() external view returns (uint256);
    
    /// @notice Current member count
    function memberCount() external view returns (uint256);
    
    /// @notice Governor contract address
    function governor() external view returns (address);
    
    /// @notice Emergency controller address
    function emergencyController() external view returns (address);
    
    /// @notice Check if address is a member
    /// @param account Address to check
    function isMember(address account) external view returns (bool);
    
    /// @notice Get member by seat ID
    /// @param seatId Seat ID
    function getMemberBySeat(uint256 seatId) external view returns (Member memory);
    
    /// @notice Get member by address
    /// @param account Member address
    function getMemberByAddress(address account) external view returns (Member memory);
    
    /// @notice Get all members
    function getMembers() external view returns (Member[] memory);
    
    /// @notice Get action details
    /// @param actionId Action ID
    function getAction(bytes32 actionId) external view returns (Action memory);
    
    /// @notice Check if member has signed action
    /// @param actionId Action ID
    /// @param member Member address
    function hasSigned(bytes32 actionId, address member) external view returns (bool);
    
    /// @notice Get signers of an action
    /// @param actionId Action ID
    function getSigners(bytes32 actionId) external view returns (address[] memory);
    
    /// @notice Get threshold for action type
    /// @param actionType Action type
    function getThreshold(ActionType actionType) external view returns (uint256);
    
    /// @notice Check if action can be executed
    /// @param actionId Action ID
    function canExecute(bytes32 actionId) external view returns (bool);
    
    /// @notice Compute action ID
    /// @param actionType Action type
    /// @param data Action data
    /// @param nonce Unique nonce
    function computeActionId(
        ActionType actionType,
        bytes calldata data,
        uint256 nonce
    ) external pure returns (bytes32);
    
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
    
    /// @notice Cancel an action (proposer only)
    /// @param actionId Action ID to cancel
    function cancelAction(bytes32 actionId) external;
    
    /// @notice Veto a governance proposal
    /// @param proposalId Proposal ID to veto
    function veto(uint256 proposalId) external;
    
    /// @notice Add a member (via governance)
    /// @param member Member address
    /// @param seatId Seat ID (0-8)
    function addMember(address member, uint256 seatId) external;
    
    /// @notice Remove a member (via governance)
    /// @param seatId Seat ID to remove
    function removeMember(uint256 seatId) external;
    
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
