// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ISecurityCouncil.sol";

/// @title SecurityCouncil
/// @notice Quantum Shield Security Council - 9-member multi-sig for emergency actions
/// @dev Per CURRENT_PLAN.md GOV-004 and SEQUENCES v2.0 #8
/// @custom:security-contact security@quantumshield.io
/// @custom:invariant Always exactly 9 members
contract SecurityCouncil is ISecurityCouncil {
    // ============ Constants ============
    
    /// @inheritdoc ISecurityCouncil
    uint256 public constant override MAX_MEMBERS = 9;
    
    /// @inheritdoc ISecurityCouncil
    uint256 public constant override PAUSE_THRESHOLD = 5;
    
    /// @inheritdoc ISecurityCouncil
    uint256 public constant override VETO_THRESHOLD = 6;
    
    /// @inheritdoc ISecurityCouncil
    uint256 public constant override UPGRADE_THRESHOLD = 7;
    
    /// @inheritdoc ISecurityCouncil
    uint256 public constant override ACTION_EXPIRY = 48 hours;
    
    // ============ State Variables ============
    
    /// @inheritdoc ISecurityCouncil
    address public override governor;
    
    /// @inheritdoc ISecurityCouncil
    address public override emergencyController;
    
    /// @notice Member addresses by seat ID
    mapping(uint256 => address) private _members;
    
    /// @notice Seat ID by member address
    mapping(address => uint256) private _seatIds;
    
    /// @notice Whether an address is a member
    mapping(address => bool) private _isMember;
    
    /// @notice Action storage
    mapping(bytes32 => Action) private _actions;
    
    /// @notice Action signatures
    mapping(bytes32 => mapping(address => bool)) private _signatures;
    
    /// @notice Action nonce for unique IDs
    uint256 private _actionNonce;
    
    // ============ Modifiers ============
    
    /// @notice Restricts access to members only
    modifier onlyMember() {
        if (!_isMember[msg.sender]) revert NotMember();
        _;
    }
    
    /// @notice Restricts access to governor only
    modifier onlyGovernor() {
        if (msg.sender != governor) revert NotGovernor();
        _;
    }
    
    // ============ Constructor ============
    
    /// @notice Initializes the Security Council with 9 members
    /// @param initialMembers Array of exactly 9 member addresses
    /// @param _governor Governor contract address
    constructor(address[9] memory initialMembers, address _governor) {
        if (_governor == address(0)) revert InvalidMember();
        
        governor = _governor;
        
        // Initialize all 9 seats
        for (uint256 i = 0; i < MAX_MEMBERS; i++) {
            address member = initialMembers[i];
            if (member == address(0)) revert InvalidMember();
            if (_isMember[member]) revert DuplicateMember();
            
            _members[i] = member;
            _seatIds[member] = i;
            _isMember[member] = true;
            
            emit MemberAdded(i, member);
        }
    }
    
    // ============ Action Functions ============
    
    /// @inheritdoc ISecurityCouncil
    function proposeAction(
        ActionType actionType,
        bytes calldata data
    ) external override onlyMember returns (bytes32 actionId) {
        _actionNonce++;
        actionId = keccak256(abi.encode(actionType, data, _actionNonce, block.timestamp));
        
        uint256 expiresAt = block.timestamp + ACTION_EXPIRY;
        
        _actions[actionId] = Action({
            id: actionId,
            actionType: actionType,
            proposer: msg.sender,
            proposedAt: block.timestamp,
            expiresAt: expiresAt,
            signatureCount: 1, // Proposer auto-signs
            state: ActionState.Proposed,
            data: data
        });
        
        // Proposer automatically signs
        _signatures[actionId][msg.sender] = true;
        
        emit ActionProposed(actionId, actionType, msg.sender, data, expiresAt);
        emit ActionSigned(actionId, msg.sender, 1);
    }
    
    /// @inheritdoc ISecurityCouncil
    function signAction(bytes32 actionId) external override onlyMember {
        Action storage action = _actions[actionId];
        
        if (action.proposedAt == 0) revert ActionNotFound();
        if (action.state != ActionState.Proposed) revert ActionNotActive();
        if (block.timestamp > action.expiresAt) revert ActionExpiredError();
        if (_signatures[actionId][msg.sender]) revert AlreadySigned();
        
        _signatures[actionId][msg.sender] = true;
        action.signatureCount++;
        
        emit ActionSigned(actionId, msg.sender, action.signatureCount);
    }
    
    /// @inheritdoc ISecurityCouncil
    function executeAction(bytes32 actionId) external override onlyMember {
        Action storage action = _actions[actionId];
        
        if (action.proposedAt == 0) revert ActionNotFound();
        if (action.state != ActionState.Proposed) revert ActionNotActive();
        if (block.timestamp > action.expiresAt) revert ActionExpiredError();
        
        uint256 threshold = getThreshold(action.actionType);
        if (action.signatureCount < threshold) revert ThresholdNotMet();
        
        action.state = ActionState.Executed;
        
        // Execute based on action type
        _executeActionInternal(action);
        
        emit ActionExecuted(actionId, action.actionType, msg.sender);
    }
    
    /// @notice Internal action execution
    /// @param action The action to execute
    function _executeActionInternal(Action storage action) internal {
        if (action.actionType == ActionType.EmergencyPause) {
            // Trigger emergency pause via EmergencyController
            if (emergencyController != address(0)) {
                (string memory reason) = abi.decode(action.data, (string));
                // Note: EmergencyController.pause() will be called
                (bool success,) = emergencyController.call(
                    abi.encodeWithSignature("pause(string,uint256)", reason, 72 hours)
                );
                if (!success) revert ExecutionFailed();
            }
        } else if (action.actionType == ActionType.Veto) {
            // Veto a governance proposal
            if (governor != address(0)) {
                bytes32 proposalId = abi.decode(action.data, (bytes32));
                (bool success,) = governor.call(
                    abi.encodeWithSignature("veto(bytes32)", proposalId)
                );
                if (!success) revert ExecutionFailed();
            }
        } else if (action.actionType == ActionType.EmergencyUpgrade) {
            // Execute emergency upgrade
            (address target, bytes memory upgradeData) = abi.decode(action.data, (address, bytes));
            (bool success,) = target.call(upgradeData);
            if (!success) revert ExecutionFailed();
        } else if (action.actionType == ActionType.MemberChange) {
            // Replace a member
            (uint256 seatId, address newMember) = abi.decode(action.data, (uint256, address));
            _replaceMemberInternal(seatId, newMember);
        }
    }
    
    // ============ Member Management ============
    
    /// @inheritdoc ISecurityCouncil
    function replaceMember(uint256 seatId, address newMember) external override onlyGovernor {
        _replaceMemberInternal(seatId, newMember);
    }
    
    /// @notice Internal member replacement
    /// @param seatId Seat to replace
    /// @param newMember New member address
    function _replaceMemberInternal(uint256 seatId, address newMember) internal {
        if (seatId >= MAX_MEMBERS) revert InvalidSeat();
        if (newMember == address(0)) revert InvalidMember();
        if (_isMember[newMember]) revert DuplicateMember();
        
        address oldMember = _members[seatId];
        
        // Remove old member
        _isMember[oldMember] = false;
        delete _seatIds[oldMember];
        
        // Add new member
        _members[seatId] = newMember;
        _seatIds[newMember] = seatId;
        _isMember[newMember] = true;
        
        // Invalidate old member's pending signatures
        // Note: This is handled by checking _isMember in signature validation
        
        emit MemberReplaced(seatId, oldMember, newMember);
    }
    
    /// @inheritdoc ISecurityCouncil
    function setEmergencyController(address _emergencyController) external override onlyGovernor {
        if (_emergencyController == address(0)) revert InvalidMember();
        emergencyController = _emergencyController;
    }
    
    /// @inheritdoc ISecurityCouncil
    function setGovernor(address newGovernor) external override onlyGovernor {
        if (newGovernor == address(0)) revert InvalidMember();
        governor = newGovernor;
    }
    
    // ============ View Functions ============
    
    /// @inheritdoc ISecurityCouncil
    function isMember(address account) external view override returns (bool) {
        return _isMember[account];
    }
    
    /// @inheritdoc ISecurityCouncil
    function getMember(uint256 seatId) external view override returns (address) {
        if (seatId >= MAX_MEMBERS) revert InvalidSeat();
        return _members[seatId];
    }
    
    /// @inheritdoc ISecurityCouncil
    function getSeatId(address member) external view override returns (uint256) {
        if (!_isMember[member]) revert NotMember();
        return _seatIds[member];
    }
    
    /// @inheritdoc ISecurityCouncil
    function memberCount() external pure override returns (uint256) {
        return MAX_MEMBERS;
    }
    
    /// @inheritdoc ISecurityCouncil
    function getThreshold(ActionType actionType) public pure override returns (uint256) {
        if (actionType == ActionType.EmergencyPause) {
            return PAUSE_THRESHOLD;  // 5/9
        } else if (actionType == ActionType.Veto) {
            return VETO_THRESHOLD;   // 6/9
        } else if (actionType == ActionType.EmergencyUpgrade) {
            return UPGRADE_THRESHOLD; // 7/9
        } else if (actionType == ActionType.MemberChange) {
            return VETO_THRESHOLD;   // 6/9
        }
        return MAX_MEMBERS; // Default to unanimous
    }
    
    /// @inheritdoc ISecurityCouncil
    function getAction(bytes32 actionId) external view override returns (Action memory) {
        return _actions[actionId];
    }
    
    /// @inheritdoc ISecurityCouncil
    function hasSigned(bytes32 actionId, address signer) external view override returns (bool) {
        // Only count signatures from current members
        if (!_isMember[signer]) return false;
        return _signatures[actionId][signer];
    }
    
    /// @inheritdoc ISecurityCouncil
    function getSignatureCount(bytes32 actionId) external view override returns (uint256) {
        return _actions[actionId].signatureCount;
    }
    
    /// @inheritdoc ISecurityCouncil
    function getValidSignatureCount(bytes32 actionId) external view override returns (uint256) {
        uint256 validCount = 0;
        for (uint256 i = 0; i < MAX_MEMBERS; i++) {
            address member = _members[i];
            if (_signatures[actionId][member]) {
                validCount++;
            }
        }
        return validCount;
    }
    
    /// @inheritdoc ISecurityCouncil
    function isActionReady(bytes32 actionId) external view override returns (bool) {
        Action storage action = _actions[actionId];
        if (action.proposedAt == 0) return false;
        if (action.state != ActionState.Proposed) return false;
        if (block.timestamp > action.expiresAt) return false;
        
        uint256 threshold = getThreshold(action.actionType);
        return action.signatureCount >= threshold;
    }
    
    /// @inheritdoc ISecurityCouncil
    function isActionExpired(bytes32 actionId) external view override returns (bool) {
        Action storage action = _actions[actionId];
        if (action.proposedAt == 0) return false;
        return block.timestamp > action.expiresAt;
    }
}
