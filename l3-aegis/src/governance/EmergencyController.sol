// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IEmergencyController.sol";

/// @title EmergencyController
/// @notice Quantum Shield Emergency Controller - manages protocol pause and recovery
/// @dev Per CURRENT_PLAN.md GOV-005 and SEQUENCES v2.0 #8
/// @custom:security-contact security@quantumshield.io
/// @custom:invariant MAX_PAUSE_DURATION is 72 hours
contract EmergencyController is IEmergencyController {
    // ============ Constants ============
    
    /// @inheritdoc IEmergencyController
    uint256 public constant override MAX_PAUSE_DURATION = 72 hours;
    
    /// @inheritdoc IEmergencyController
    uint256 public constant override MAX_EXTENSION_DURATION = 7 days;
    
    /// @inheritdoc IEmergencyController
    uint256 public constant override EXTENSION_VOTING_PERIOD = 48 hours;
    
    /// @inheritdoc IEmergencyController
    uint256 public constant override MAX_EXTENSIONS = 3;
    
    /// @inheritdoc IEmergencyController
    uint256 public constant override PAUSE_COOLDOWN = 24 hours;
    
    /// @notice Extension quorum in basis points (4% = 400)
    uint256 public constant EXTENSION_QUORUM_BPS = 400;
    
    // ============ State Variables ============
    
    /// @inheritdoc IEmergencyController
    address public override securityCouncil;
    
    /// @inheritdoc IEmergencyController
    address public override veQS;
    
    /// @inheritdoc IEmergencyController
    address public override guardian;
    
    /// @notice Current pause state
    PauseState private _pauseState;
    
    /// @notice Last pause timestamp (for cooldown)
    uint256 private _lastPauseTimestamp;
    
    /// @notice Extension requests
    mapping(uint256 => ExtensionRequest) private _extensions;
    
    /// @notice Extension votes
    mapping(uint256 => mapping(address => bool)) private _extensionVotes;
    
    /// @notice Extension vote weights
    mapping(uint256 => mapping(address => uint256)) private _extensionVoteWeights;
    
    /// @notice Extension nonce
    uint256 private _extensionNonce;
    
    /// @notice Recovery action nonce
    uint256 private _recoveryNonce;
    
    // ============ Modifiers ============
    
    /// @notice Restricts to Security Council
    modifier onlySecurityCouncil() {
        if (msg.sender != securityCouncil) revert NotAuthorized();
        _;
    }
    
    /// @notice Restricts to Guardian
    modifier onlyGuardian() {
        if (msg.sender != guardian) revert NotAuthorized();
        _;
    }
    
    /// @notice Requires protocol to be paused
    modifier whenPaused() {
        if (!_isPausedInternal()) revert NotPaused();
        _;
    }
    
    /// @notice Requires protocol to not be paused
    modifier whenNotPaused() {
        if (_isPausedInternal()) revert AlreadyPaused();
        _;
    }
    
    // ============ Constructor ============
    
    /// @notice Initializes the Emergency Controller
    /// @param _securityCouncil Security Council contract address
    /// @param _veQS veQS token address
    /// @param _guardian Guardian address
    constructor(address _securityCouncil, address _veQS, address _guardian) {
        if (_securityCouncil == address(0)) revert NotAuthorized();
        if (_veQS == address(0)) revert NotAuthorized();
        if (_guardian == address(0)) revert NotAuthorized();
        
        securityCouncil = _securityCouncil;
        veQS = _veQS;
        guardian = _guardian;
    }
    
    // ============ Pause Functions ============
    
    /// @inheritdoc IEmergencyController
    function pause(string calldata reason, uint256 duration) external override onlySecurityCouncil whenNotPaused {
        if (duration == 0 || duration > MAX_PAUSE_DURATION) revert InvalidDuration();
        
        // Check cooldown
        if (_lastPauseTimestamp > 0 && block.timestamp < _lastPauseTimestamp + PAUSE_COOLDOWN) {
            revert CooldownNotMet();
        }
        
        uint256 pausedUntil = block.timestamp + duration;
        
        _pauseState = PauseState({
            paused: true,
            pausedBy: msg.sender,
            pausedAt: block.timestamp,
            pausedUntil: pausedUntil,
            reason: reason,
            extensionCount: 0
        });
        
        _lastPauseTimestamp = block.timestamp;
        
        emit ProtocolPaused(msg.sender, reason, pausedUntil);
    }
    
    /// @inheritdoc IEmergencyController
    function unpause() external override {
        if (!_pauseState.paused) revert NotPaused();
        
        // Either SC can unpause anytime, or anyone can unpause after expiry
        if (msg.sender != securityCouncil && block.timestamp <= _pauseState.pausedUntil) {
            revert NotAuthorized();
        }
        
        _pauseState.paused = false;
        
        emit ProtocolUnpaused(msg.sender);
    }
    
    // ============ Extension Functions ============
    
    /// @inheritdoc IEmergencyController
    function proposeExtension(uint256 duration) external override whenPaused returns (uint256 extensionId) {
        if (duration == 0 || duration > MAX_EXTENSION_DURATION) revert InvalidDuration();
        if (_pauseState.extensionCount >= MAX_EXTENSIONS) revert MaxExtensionsReached();
        
        // Proposer must have veQS tokens
        uint256 voterBalance = _getVeQSBalance(msg.sender);
        if (voterBalance == 0) revert NotAuthorized();
        
        _extensionNonce++;
        extensionId = _extensionNonce;
        
        uint256 votingDeadline = block.timestamp + EXTENSION_VOTING_PERIOD;
        
        _extensions[extensionId] = ExtensionRequest({
            id: extensionId,
            requestedDuration: duration,
            proposedAt: block.timestamp,
            votingDeadline: votingDeadline,
            votesFor: voterBalance, // Proposer auto-votes for
            votesAgainst: 0,
            state: ExtensionState.Proposed,
            proposer: msg.sender
        });
        
        // Record proposer's vote
        _extensionVotes[extensionId][msg.sender] = true;
        _extensionVoteWeights[extensionId][msg.sender] = voterBalance;
        
        emit ExtensionProposed(extensionId, duration, msg.sender);
        emit ExtensionVoted(extensionId, msg.sender, true, voterBalance);
    }
    
    /// @inheritdoc IEmergencyController
    function voteOnExtension(uint256 extensionId, bool support) external override {
        ExtensionRequest storage ext = _extensions[extensionId];
        
        if (ext.proposedAt == 0) revert ExtensionNotFound();
        if (ext.state != ExtensionState.Proposed) revert ExtensionVotingNotActive();
        if (block.timestamp > ext.votingDeadline) revert ExtensionVotingNotActive();
        if (_extensionVotes[extensionId][msg.sender]) revert AlreadyVotedOnExtension();
        
        uint256 voterBalance = _getVeQSBalance(msg.sender);
        if (voterBalance == 0) revert NotAuthorized();
        
        _extensionVotes[extensionId][msg.sender] = true;
        _extensionVoteWeights[extensionId][msg.sender] = voterBalance;
        
        if (support) {
            ext.votesFor += voterBalance;
        } else {
            ext.votesAgainst += voterBalance;
        }
        
        emit ExtensionVoted(extensionId, msg.sender, support, voterBalance);
    }
    
    /// @inheritdoc IEmergencyController
    function executeExtension(uint256 extensionId) external override whenPaused {
        ExtensionRequest storage ext = _extensions[extensionId];
        
        if (ext.proposedAt == 0) revert ExtensionNotFound();
        if (ext.state != ExtensionState.Proposed) revert ExtensionVotingNotActive();
        
        // Check quorum
        uint256 quorum = extensionQuorum();
        if (ext.votesFor < quorum) revert ExtensionNotApproved();
        
        // Check majority
        if (ext.votesFor <= ext.votesAgainst) revert ExtensionNotApproved();
        
        ext.state = ExtensionState.Executed;
        
        // Extend pause duration
        uint256 newEndTime = _pauseState.pausedUntil + ext.requestedDuration;
        _pauseState.pausedUntil = newEndTime;
        _pauseState.extensionCount++;
        
        emit PauseExtended(extensionId, newEndTime, ext.votesFor);
    }
    
    // ============ Recovery Functions ============
    
    /// @inheritdoc IEmergencyController
    function executeRecovery(
        RecoveryType recoveryType,
        bytes calldata data
    ) external override onlyGuardian whenPaused returns (bytes32 actionId) {
        _recoveryNonce++;
        actionId = keccak256(abi.encode(recoveryType, data, _recoveryNonce, block.timestamp));
        
        // Execute recovery based on type
        if (recoveryType == RecoveryType.ContractUpgrade) {
            (address target, bytes memory upgradeData) = abi.decode(data, (address, bytes));
            (bool success,) = target.call(upgradeData);
            if (!success) revert InvalidRecoveryAction();
        } else if (recoveryType == RecoveryType.ParameterChange) {
            (address target, bytes memory paramData) = abi.decode(data, (address, bytes));
            (bool success,) = target.call(paramData);
            if (!success) revert InvalidRecoveryAction();
        } else if (recoveryType == RecoveryType.FundsRecovery) {
            (address token, address recipient, uint256 amount) = abi.decode(data, (address, address, uint256));
            if (token == address(0)) {
                // ETH recovery
                (bool success,) = recipient.call{value: amount}("");
                if (!success) revert InvalidRecoveryAction();
            } else {
                // ERC20 recovery
                (bool success,) = token.call(
                    abi.encodeWithSignature("transfer(address,uint256)", recipient, amount)
                );
                if (!success) revert InvalidRecoveryAction();
            }
        } else if (recoveryType == RecoveryType.CircuitBreaker) {
            // Circuit breaker implementation - disable specific functions permanently
            // This is a placeholder - actual implementation depends on target contracts
        }
        
        emit RecoveryAction(actionId, recoveryType, data);
    }
    
    // ============ Admin Functions ============
    
    /// @inheritdoc IEmergencyController
    function setGuardian(address newGuardian) external override onlySecurityCouncil {
        if (newGuardian == address(0)) revert NotAuthorized();
        
        address oldGuardian = guardian;
        guardian = newGuardian;
        
        emit GuardianUpdated(oldGuardian, newGuardian);
    }
    
    /// @inheritdoc IEmergencyController
    function setSecurityCouncil(address newSecurityCouncil) external override onlySecurityCouncil {
        if (newSecurityCouncil == address(0)) revert NotAuthorized();
        securityCouncil = newSecurityCouncil;
    }
    
    // ============ View Functions ============
    
    /// @inheritdoc IEmergencyController
    function getPauseState() external view override returns (PauseState memory) {
        return _pauseState;
    }
    
    /// @inheritdoc IEmergencyController
    function isPaused() external view override returns (bool) {
        return _isPausedInternal();
    }
    
    /// @notice Internal pause check (considers expiry)
    function _isPausedInternal() internal view returns (bool) {
        if (!_pauseState.paused) return false;
        return block.timestamp <= _pauseState.pausedUntil;
    }
    
    /// @inheritdoc IEmergencyController
    function pauseTimeRemaining() external view override returns (uint256) {
        if (!_isPausedInternal()) return 0;
        if (block.timestamp >= _pauseState.pausedUntil) return 0;
        return _pauseState.pausedUntil - block.timestamp;
    }
    
    /// @inheritdoc IEmergencyController
    function getExtension(uint256 extensionId) external view override returns (ExtensionRequest memory) {
        return _extensions[extensionId];
    }
    
    /// @inheritdoc IEmergencyController
    function hasVotedOnExtension(uint256 extensionId, address voter) external view override returns (bool) {
        return _extensionVotes[extensionId][voter];
    }
    
    /// @inheritdoc IEmergencyController
    function lastPauseTimestamp() external view override returns (uint256) {
        return _lastPauseTimestamp;
    }
    
    /// @inheritdoc IEmergencyController
    function currentExtensionCount() external view override returns (uint256) {
        return _pauseState.extensionCount;
    }
    
    /// @inheritdoc IEmergencyController
    function extensionQuorum() public view override returns (uint256) {
        uint256 totalSupply = _getVeQSTotalSupply();
        return (totalSupply * EXTENSION_QUORUM_BPS) / 10000;
    }
    
    // ============ Internal Functions ============
    
    /// @notice Gets veQS balance of an account
    /// @param account Account to check
    function _getVeQSBalance(address account) internal view returns (uint256) {
        (bool success, bytes memory data) = veQS.staticcall(
            abi.encodeWithSignature("balanceOf(address)", account)
        );
        if (!success) return 0;
        return abi.decode(data, (uint256));
    }
    
    /// @notice Gets veQS total supply
    function _getVeQSTotalSupply() internal view returns (uint256) {
        (bool success, bytes memory data) = veQS.staticcall(
            abi.encodeWithSignature("totalSupply()")
        );
        if (!success) return 0;
        return abi.decode(data, (uint256));
    }
    
    // ============ Receive Ether ============
    
    /// @notice Allows contract to receive Ether for recovery operations
    receive() external payable {}
}
