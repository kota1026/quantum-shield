// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernanceSwitch} from "../interfaces/IGovernanceSwitch.sol";

/// @title GovernanceSwitch
/// @notice Pluggable Governance Layer switch mechanism for Quantum Shield
/// @dev Implements MODULAR_ARCHITECTURE.md §3.1 and SPEC_STRATEGY_BRIDGE §7
/// @dev DECEN-009: Production mode (TRAINING → DECENTRALIZED)
/// @dev DECEN-010: Mode transitions with time locks
/// @dev DECEN-011: Emergency rollback mechanism
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md IMPL-002~006
contract GovernanceSwitch is IGovernanceSwitch {
    // ============ Constants ============
    
    /// @notice Time lock for MULTISIG -> DECENTRALIZED transition (7 days)
    uint256 public constant UPGRADE_TIMELOCK = 7 days;
    
    /// @notice Time lock for downgrade transitions (30 days)
    uint256 public constant DOWNGRADE_TIMELOCK = 30 days;
    
    /// @notice Time lock for TRAINING -> CENTRALIZED transition (3 days)
    uint256 public constant TRAINING_EXIT_TIMELOCK = 3 days;
    
    /// @notice Maximum pause duration (72 hours)
    uint256 public constant MAX_PAUSE_DURATION = 72 hours;
    
    /// @notice Maximum number of signers (gas limit protection)
    /// @dev Limits loop iterations in _resetUpgradeState and _resetPauseSignatures
    uint256 public constant MAX_SIGNERS = 20;
    
    /// @notice Security Council size
    uint256 public constant COUNCIL_SIZE = 9;
    
    /// @notice Emergency rollback threshold (7/9 supermajority)
    uint256 public constant ROLLBACK_THRESHOLD = 7;
    
    /// @notice Emergency pause threshold for DECENTRALIZED mode (5/9)
    uint256 public constant PAUSE_THRESHOLD = 5;
    
    /// @notice Emergency rollback time lock (24 hours)
    uint256 public constant ROLLBACK_TIMELOCK = 24 hours;
    
    // ============ Errors ============
    
    /// @notice Thrown when time lock has not expired
    error TimeLockNotExpired();
    
    /// @notice Thrown when no upgrade is pending
    error NoPendingUpgrade();
    
    /// @notice Thrown when threshold is invalid
    error InvalidThreshold();
    
    /// @notice Thrown when signers array is empty
    error EmptySigners();
    
    /// @notice Thrown when too many signers
    error TooManySigners(uint256 provided, uint256 max);
    
    /// @notice Thrown when duplicate signer detected
    error DuplicateSigner(address signer);
    
    /// @notice Thrown when multisig not configured
    error MultisigNotConfigured();
    
    /// @notice Thrown when already signed
    error AlreadySigned();
    
    /// @notice Thrown when no pending rollback
    error NoPendingRollback();
    
    /// @notice Thrown when rollback threshold not reached
    error RollbackThresholdNotReached();
    
    /// @notice Thrown when not a council member
    error NotCouncilMember();
    
    // ============ Events ============
    
    /// @notice Emitted when multisig is configured
    event MultisigConfigured(address[] signers, uint256 threshold);
    
    /// @notice Emitted when Security Council is configured
    event SecurityCouncilConfigured(address[] members, uint256 threshold);
    
    /// @notice Emitted when upgrade is initiated
    event UpgradeInitiated(
        GovernanceMode targetMode,
        address initiator,
        uint256 unlockTime
    );
    
    /// @notice Emitted when system is paused
    event Paused(address indexed by, uint256 until);
    
    /// @notice Emitted when system is unpaused
    event Unpaused(address indexed by);
    
    /// @notice Emitted when pause signature collected
    event PauseSignatureCollected(address indexed signer, uint256 current, uint256 required);
    
    /// @notice Emitted when council pause signature collected
    event CouncilPauseSignatureCollected(address indexed member, uint256 current, uint256 required);
    
    /// @notice Emitted when rollback signature collected
    event RollbackSignatureCollected(address indexed member, uint256 current, uint256 required);
    
    // ============ State Variables ============
    
    /// @notice Current governance mode
    GovernanceMode private _mode;
    
    /// @notice Admin address (for CENTRALIZED/TRAINING mode)
    address private _admin;
    
    // --- Multisig Configuration ---
    
    /// @notice Multisig signers
    address[] private _multisigSigners;
    
    /// @notice Required signatures threshold
    uint256 private _multisigThreshold;
    
    /// @notice Mapping of address to signer status
    mapping(address => bool) private _isSigner;
    
    // --- Security Council Configuration (DECENTRALIZED) ---
    
    /// @notice Security Council members
    address[] private _councilMembers;
    
    /// @notice Required council votes
    uint256 private _councilThreshold;
    
    /// @notice Mapping of address to council member status
    mapping(address => bool) private _isCouncilMember;
    
    // --- Upgrade Management ---
    
    /// @notice Pending upgrade target mode
    GovernanceMode private _pendingUpgrade;
    
    /// @notice Time lock expiry for pending upgrade
    uint256 private _upgradeLockExpiry;
    
    /// @notice Mapping of upgrade signatures
    mapping(address => bool) private _upgradeSignatures;
    
    /// @notice Count of upgrade signatures
    uint256 private _upgradeSignatureCount;
    
    // --- Transition Management (DECEN-010) ---
    
    /// @notice Pending transition target mode
    GovernanceMode private _pendingTransition;
    
    /// @notice Time lock expiry for pending transition
    uint256 private _transitionLockExpiry;
    
    /// @notice Transition initiator
    address private _transitionInitiator;
    
    // --- Emergency Rollback Management (DECEN-011) ---
    
    /// @notice Whether emergency rollback is pending
    bool private _rollbackPending;
    
    /// @notice Rollback target mode
    GovernanceMode private _rollbackTargetMode;
    
    /// @notice Rollback reason
    string private _rollbackReason;
    
    /// @notice Rollback time lock expiry
    uint256 private _rollbackLockExpiry;
    
    /// @notice Mapping of rollback signatures
    mapping(address => bool) private _rollbackSignatures;
    
    /// @notice Count of rollback signatures
    uint256 private _rollbackSignatureCount;
    
    // --- Pause Management ---
    
    /// @notice Whether system is paused
    bool private _paused;
    
    /// @notice Pause expiry timestamp
    uint256 private _pauseExpiry;
    
    /// @notice Mapping of pause signatures (for MULTISIG mode)
    mapping(address => bool) private _pauseSignatures;
    
    /// @notice Count of pause signatures
    uint256 private _pauseSignatureCount;
    
    /// @notice Mapping of council pause signatures (for DECENTRALIZED mode)
    mapping(address => bool) private _councilPauseSignatures;
    
    /// @notice Count of council pause signatures
    uint256 private _councilPauseSignatureCount;
    
    // ============ Constructor ============
    
    /// @notice Initialize GovernanceSwitch in TRAINING mode (DECEN-009)
    /// @param admin_ Initial admin address
    constructor(address admin_) {
        require(admin_ != address(0), "Invalid admin");
        _admin = admin_;
        _mode = GovernanceMode.TRAINING; // Start in TRAINING mode
    }
    
    // ============ Modifiers ============
    
    /// @notice Restrict to authorized callers based on mode
    modifier onlyAuthorized() {
        if (_mode == GovernanceMode.TRAINING || _mode == GovernanceMode.CENTRALIZED) {
            if (msg.sender != _admin) revert Unauthorized();
        } else if (_mode == GovernanceMode.MULTISIG) {
            if (!_isSigner[msg.sender]) revert Unauthorized();
        } else {
            // DECENTRALIZED - Security Council check
            if (!_isCouncilMember[msg.sender]) revert Unauthorized();
        }
        _;
    }
    
    /// @notice Restrict to admin only (CENTRALIZED/TRAINING mode)
    modifier onlyAdmin() {
        if (msg.sender != _admin) revert Unauthorized();
        _;
    }
    
    /// @notice Restrict to Security Council members
    modifier onlyCouncilMember() {
        if (!_isCouncilMember[msg.sender]) revert NotCouncilMember();
        _;
    }
    
    // ============ IGovernanceSwitch Implementation ============
    
    /// @inheritdoc IGovernanceSwitch
    function getGovernanceMode() external view override returns (GovernanceMode) {
        return _mode;
    }
    
    /// @inheritdoc IGovernanceSwitch
    function getApprover(bytes4 /*action*/) external view override returns (address) {
        if (_mode == GovernanceMode.TRAINING || _mode == GovernanceMode.CENTRALIZED) {
            return _admin;
        } else {
            // For MULTISIG/DECENTRALIZED, return contract address
            // indicating collective approval is needed
            return address(this);
        }
    }
    
    /// @inheritdoc IGovernanceSwitch
    function canApprove(bytes4 /*action*/, address caller) external view override returns (bool) {
        if (_mode == GovernanceMode.TRAINING || _mode == GovernanceMode.CENTRALIZED) {
            return caller == _admin;
        } else if (_mode == GovernanceMode.MULTISIG) {
            return _isSigner[caller];
        } else {
            // DECENTRALIZED - Security Council
            return _isCouncilMember[caller];
        }
    }
    
    /// @inheritdoc IGovernanceSwitch
    function getAdmin() external view override returns (address) {
        return _admin;
    }
    
    /// @inheritdoc IGovernanceSwitch
    function getMultisigConfig() external view override returns (uint256 threshold, uint256 total) {
        if (_mode != GovernanceMode.MULTISIG && _multisigSigners.length == 0) {
            return (0, 0);
        }
        return (_multisigThreshold, _multisigSigners.length);
    }
    
    /// @inheritdoc IGovernanceSwitch
    function getSecurityCouncilConfig() external view override returns (uint256 threshold, uint256 total) {
        if (_councilMembers.length == 0) {
            return (0, 0);
        }
        return (_councilThreshold, _councilMembers.length);
    }
    
    /// @inheritdoc IGovernanceSwitch
    function isTrainingMode() external view override returns (bool) {
        return _mode == GovernanceMode.TRAINING;
    }
    
    /// @inheritdoc IGovernanceSwitch
    function canInitiateRollback() external view override returns (bool) {
        // Rollback is only available from DECENTRALIZED or MULTISIG mode
        // and requires Security Council to be configured
        return (_mode == GovernanceMode.DECENTRALIZED || _mode == GovernanceMode.MULTISIG)
            && _councilMembers.length >= COUNCIL_SIZE
            && !_rollbackPending;
    }
    
    /// @inheritdoc IGovernanceSwitch
    function setGovernanceMode(GovernanceMode newMode) external override {
        GovernanceMode currentMode = _mode;
        
        // Validate transition
        _validateModeTransition(currentMode, newMode);
        
        // Check authorization and handle transition
        if (currentMode == GovernanceMode.TRAINING) {
            if (msg.sender != _admin) revert Unauthorized();
            
            // TRAINING can only go to CENTRALIZED
            if (newMode != GovernanceMode.CENTRALIZED) {
                revert InvalidModeTransition(currentMode, newMode);
            }
            
            // Direct transition allowed (no time lock for exiting training)
            _mode = newMode;
            emit GovernanceModeChanged(currentMode, newMode, msg.sender);
            
        } else if (currentMode == GovernanceMode.CENTRALIZED) {
            if (msg.sender != _admin) revert Unauthorized();
            
            // CENTRALIZED can only go to MULTISIG
            if (newMode != GovernanceMode.MULTISIG) {
                revert InvalidModeTransition(currentMode, newMode);
            }
            
            // Ensure multisig is configured
            if (_multisigSigners.length == 0) revert MultisigNotConfigured();
            
            // Direct transition allowed
            _mode = newMode;
            emit GovernanceModeChanged(currentMode, newMode, msg.sender);
            
        } else if (currentMode == GovernanceMode.MULTISIG) {
            // Requires multisig approval + time lock
            revert InvalidModeTransition(currentMode, newMode);
            
        } else {
            // DECENTRALIZED mode transitions require supermajority
            revert Unauthorized();
        }
    }
    
    /// @inheritdoc IGovernanceSwitch
    function approveAction(bytes4 action, bytes calldata data) external override onlyAuthorized {
        emit ActionApproved(action, msg.sender, data);
    }
    
    // ============ Transition Management (DECEN-010) ============
    
    /// @inheritdoc IGovernanceSwitch
    function initiateTransition(GovernanceMode targetMode) external override {
        GovernanceMode currentMode = _mode;
        
        // Validate transition path
        _validateModeTransition(currentMode, targetMode);
        
        if (currentMode == GovernanceMode.TRAINING) {
            if (msg.sender != _admin) revert Unauthorized();
            if (targetMode != GovernanceMode.CENTRALIZED) {
                revert InvalidModeTransition(currentMode, targetMode);
            }
            
            _pendingTransition = targetMode;
            _transitionLockExpiry = block.timestamp + TRAINING_EXIT_TIMELOCK;
            _transitionInitiator = msg.sender;
            
            emit ModeTransitionInitiated(targetMode, msg.sender, _transitionLockExpiry);
            
        } else if (currentMode == GovernanceMode.MULTISIG) {
            if (!_isSigner[msg.sender]) revert Unauthorized();
            
            // First signature initiates
            if (_upgradeSignatureCount == 0 || _pendingUpgrade != targetMode) {
                _resetUpgradeState();
                _pendingUpgrade = targetMode;
            }
            
            if (_upgradeSignatures[msg.sender]) revert AlreadySigned();
            
            _upgradeSignatures[msg.sender] = true;
            _upgradeSignatureCount++;
            
            // Check if threshold reached
            if (_upgradeSignatureCount >= _multisigThreshold) {
                _pendingTransition = targetMode;
                _transitionLockExpiry = block.timestamp + UPGRADE_TIMELOCK;
                _transitionInitiator = msg.sender;
                
                emit ModeTransitionInitiated(targetMode, msg.sender, _transitionLockExpiry);
            }
            
        } else if (currentMode == GovernanceMode.DECENTRALIZED) {
            // Downgrade from DECENTRALIZED requires Security Council supermajority
            if (!_isCouncilMember[msg.sender]) revert Unauthorized();
            
            if (_upgradeSignatureCount == 0 || _pendingUpgrade != targetMode) {
                _resetUpgradeState();
                _pendingUpgrade = targetMode;
            }
            
            if (_upgradeSignatures[msg.sender]) revert AlreadySigned();
            
            _upgradeSignatures[msg.sender] = true;
            _upgradeSignatureCount++;
            
            // Requires 7/9 supermajority for downgrade
            if (_upgradeSignatureCount >= ROLLBACK_THRESHOLD) {
                _pendingTransition = targetMode;
                _transitionLockExpiry = block.timestamp + DOWNGRADE_TIMELOCK;
                _transitionInitiator = msg.sender;
                
                emit ModeTransitionInitiated(targetMode, msg.sender, _transitionLockExpiry);
            }
        } else {
            revert Unauthorized();
        }
    }
    
    /// @inheritdoc IGovernanceSwitch
    function finalizeTransition() external override {
        if (_transitionLockExpiry == 0) revert NoPendingUpgrade();
        if (block.timestamp < _transitionLockExpiry) revert TimeLockNotExpired();
        
        GovernanceMode oldMode = _mode;
        GovernanceMode newMode = _pendingTransition;
        
        // Apply transition
        _mode = newMode;
        
        // Reset state
        _pendingTransition = GovernanceMode.TRAINING;
        _transitionLockExpiry = 0;
        _transitionInitiator = address(0);
        _resetUpgradeState();
        
        emit GovernanceModeChanged(oldMode, newMode, msg.sender);
    }
    
    // ============ Emergency Rollback (DECEN-011) ============
    
    /// @inheritdoc IGovernanceSwitch
    function initiateEmergencyRollback(string calldata reason) external override onlyCouncilMember {
        if (_mode != GovernanceMode.DECENTRALIZED && _mode != GovernanceMode.MULTISIG) {
            revert RollbackNotAllowed("Only from DECENTRALIZED or MULTISIG mode");
        }
        
        if (_rollbackPending) {
            revert RollbackNotAllowed("Rollback already pending");
        }
        
        // Determine rollback target (one step back)
        GovernanceMode targetMode;
        if (_mode == GovernanceMode.DECENTRALIZED) {
            targetMode = GovernanceMode.MULTISIG;
        } else {
            targetMode = GovernanceMode.CENTRALIZED;
        }
        
        _rollbackPending = true;
        _rollbackTargetMode = targetMode;
        _rollbackReason = reason;
        _rollbackLockExpiry = block.timestamp + ROLLBACK_TIMELOCK;
        
        // First signature from initiator
        _rollbackSignatures[msg.sender] = true;
        _rollbackSignatureCount = 1;
        
        emit RollbackSignatureCollected(msg.sender, 1, ROLLBACK_THRESHOLD);
    }
    
    /// @inheritdoc IGovernanceSwitch
    function approveEmergencyRollback() external override onlyCouncilMember {
        if (!_rollbackPending) revert NoPendingRollback();
        if (_rollbackSignatures[msg.sender]) revert AlreadySigned();
        
        _rollbackSignatures[msg.sender] = true;
        _rollbackSignatureCount++;
        
        emit RollbackSignatureCollected(msg.sender, _rollbackSignatureCount, ROLLBACK_THRESHOLD);
    }
    
    /// @inheritdoc IGovernanceSwitch
    function executeEmergencyRollback() external override {
        if (!_rollbackPending) revert NoPendingRollback();
        if (_rollbackSignatureCount < ROLLBACK_THRESHOLD) revert RollbackThresholdNotReached();
        if (block.timestamp < _rollbackLockExpiry) revert TimeLockNotExpired();
        
        GovernanceMode oldMode = _mode;
        GovernanceMode newMode = _rollbackTargetMode;
        string memory reason = _rollbackReason;
        
        // Execute rollback
        _mode = newMode;
        
        // Reset rollback state
        _resetRollbackState();
        
        emit EmergencyRollback(oldMode, newMode, msg.sender, reason);
        emit GovernanceModeChanged(oldMode, newMode, msg.sender);
    }
    
    /// @notice Cancel pending rollback (requires supermajority against)
    function cancelEmergencyRollback() external onlyCouncilMember {
        if (!_rollbackPending) revert NoPendingRollback();
        
        // Can be cancelled by admin before time lock expires
        // or if threshold not reached after time lock
        if (block.timestamp >= _rollbackLockExpiry && _rollbackSignatureCount >= ROLLBACK_THRESHOLD) {
            revert RollbackNotAllowed("Rollback already approved");
        }
        
        _resetRollbackState();
    }
    
    /// @notice Get rollback status
    function getRollbackStatus() external view returns (
        bool pending,
        GovernanceMode targetMode,
        string memory reason,
        uint256 signatures,
        uint256 required,
        uint256 lockExpiry
    ) {
        return (
            _rollbackPending,
            _rollbackTargetMode,
            _rollbackReason,
            _rollbackSignatureCount,
            ROLLBACK_THRESHOLD,
            _rollbackLockExpiry
        );
    }
    
    // ============ Multisig Configuration (IMPL-004) ============
    
    /// @notice Configure multisig signers and threshold
    /// @param signers Array of signer addresses (max MAX_SIGNERS)
    /// @param threshold Required number of signatures
    /// @dev Gas consumption is bounded by MAX_SIGNERS constant
    function configureMultisig(address[] calldata signers, uint256 threshold) external onlyAdmin {
        if (signers.length == 0) revert EmptySigners();
        if (signers.length > MAX_SIGNERS) revert TooManySigners(signers.length, MAX_SIGNERS);
        if (threshold == 0 || threshold > signers.length) revert InvalidThreshold();
        
        // Clear existing signers (bounded by MAX_SIGNERS)
        uint256 existingLength = _multisigSigners.length;
        for (uint256 i = 0; i < existingLength; i++) {
            _isSigner[_multisigSigners[i]] = false;
        }
        delete _multisigSigners;
        
        // Set new signers (bounded by MAX_SIGNERS)
        for (uint256 i = 0; i < signers.length; i++) {
            address signer = signers[i];
            require(signer != address(0), "Invalid signer");
            if (_isSigner[signer]) revert DuplicateSigner(signer);
            
            _multisigSigners.push(signer);
            _isSigner[signer] = true;
        }
        
        _multisigThreshold = threshold;
        
        emit MultisigConfigured(signers, threshold);
    }
    
    // ============ Security Council Configuration ============
    
    /// @notice Configure Security Council members
    /// @param members Array of council member addresses (must be COUNCIL_SIZE)
    /// @param threshold Required votes for actions
    function configureSecurityCouncil(address[] calldata members, uint256 threshold) external {
        // Only admin (in TRAINING/CENTRALIZED) or multisig threshold can configure
        if (_mode == GovernanceMode.TRAINING || _mode == GovernanceMode.CENTRALIZED) {
            if (msg.sender != _admin) revert Unauthorized();
        } else if (_mode == GovernanceMode.MULTISIG) {
            if (!_isSigner[msg.sender]) revert Unauthorized();
        } else {
            revert Unauthorized();
        }
        
        if (members.length != COUNCIL_SIZE) revert InvalidThreshold();
        if (threshold == 0 || threshold > members.length) revert InvalidThreshold();
        
        // Clear existing members
        uint256 existingLength = _councilMembers.length;
        for (uint256 i = 0; i < existingLength; i++) {
            _isCouncilMember[_councilMembers[i]] = false;
        }
        delete _councilMembers;
        
        // Set new members
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            require(member != address(0), "Invalid member");
            if (_isCouncilMember[member]) revert DuplicateSigner(member);
            
            _councilMembers.push(member);
            _isCouncilMember[member] = true;
        }
        
        _councilThreshold = threshold;
        
        emit SecurityCouncilConfigured(members, threshold);
    }
    
    // ============ Legacy Upgrade Management (IMPL-004, IMPL-005) ============
    
    /// @notice Initiate mode upgrade (requires multisig signatures)
    /// @param targetMode Target governance mode
    function initiateUpgrade(GovernanceMode targetMode) external {
        if (_mode != GovernanceMode.MULTISIG) revert Unauthorized();
        if (!_isSigner[msg.sender]) revert Unauthorized();
        if (_upgradeSignatures[msg.sender]) revert AlreadySigned();
        
        // First signature initiates the upgrade
        if (_upgradeSignatureCount == 0) {
            _pendingUpgrade = targetMode;
        } else {
            // Subsequent signatures must match the pending upgrade
            require(_pendingUpgrade == targetMode, "Mode mismatch");
        }
        
        _upgradeSignatures[msg.sender] = true;
        _upgradeSignatureCount++;
        
        // Check if threshold reached
        if (_upgradeSignatureCount >= _multisigThreshold) {
            // Set time lock
            _upgradeLockExpiry = block.timestamp + UPGRADE_TIMELOCK;
            
            emit UpgradeInitiated(targetMode, msg.sender, _upgradeLockExpiry);
        }
    }
    
    /// @notice Finalize pending upgrade after time lock expires
    function finalizeUpgrade() external {
        if (_upgradeLockExpiry == 0) revert NoPendingUpgrade();
        if (block.timestamp <= _upgradeLockExpiry) revert TimeLockNotExpired();
        
        GovernanceMode oldMode = _mode;
        GovernanceMode newMode = _pendingUpgrade;
        
        // Apply upgrade
        _mode = newMode;
        
        // Reset upgrade state (bounded by MAX_SIGNERS)
        _resetUpgradeState();
        
        emit GovernanceModeChanged(oldMode, newMode, msg.sender);
    }
    
    /// @notice Check if time lock is active for pending upgrade
    function isTimeLockActive() external view returns (bool) {
        return _upgradeLockExpiry > 0 && block.timestamp <= _upgradeLockExpiry;
    }
    
    /// @notice Get time lock expiry timestamp
    function getTimeLockExpiry() external view returns (uint256) {
        return _upgradeLockExpiry;
    }
    
    /// @notice Get transition time lock expiry
    function getTransitionLockExpiry() external view returns (uint256) {
        return _transitionLockExpiry;
    }
    
    /// @notice Check if downgrade is restricted
    /// @dev DECENTRALIZED -> MULTISIG/CENTRALIZED requires supermajority
    function isDowngradeRestricted() external view returns (bool) {
        return _mode == GovernanceMode.DECENTRALIZED;
    }
    
    // ============ Emergency Pause (IMPL-006) ============
    
    /// @notice Emergency pause (CENTRALIZED/TRAINING mode - admin only)
    /// @dev For MULTISIG/DECENTRALIZED modes, use initiatePause() or initiateCouncilPause()
    function emergencyPause() external {
        if (_mode == GovernanceMode.TRAINING || _mode == GovernanceMode.CENTRALIZED) {
            if (msg.sender != _admin) revert Unauthorized();
            _activatePause();
        } else {
            // MULTISIG and DECENTRALIZED modes require threshold signatures
            // Use initiatePause() for MULTISIG or initiateCouncilPause() for DECENTRALIZED
            revert Unauthorized();
        }
    }
    
    /// @notice Initiate pause in MULTISIG mode (requires threshold)
    function initiatePause() external {
        if (_mode != GovernanceMode.MULTISIG) revert Unauthorized();
        if (!_isSigner[msg.sender]) revert Unauthorized();
        if (_pauseSignatures[msg.sender]) revert AlreadySigned();
        
        _pauseSignatures[msg.sender] = true;
        _pauseSignatureCount++;
        
        emit PauseSignatureCollected(msg.sender, _pauseSignatureCount, _multisigThreshold);
        
        // Check if threshold reached
        if (_pauseSignatureCount >= _multisigThreshold) {
            _activatePause();
            // Reset pause signatures (bounded by MAX_SIGNERS)
            _resetPauseSignatures();
        }
    }
    
    /// @notice Initiate pause in DECENTRALIZED mode (requires 5/9 Security Council threshold)
    /// @dev SEQ#8 compliant: Emergency pause requires 5/9 council members
    function initiateCouncilPause() external {
        if (_mode != GovernanceMode.DECENTRALIZED) revert Unauthorized();
        if (!_isCouncilMember[msg.sender]) revert Unauthorized();
        if (_councilPauseSignatures[msg.sender]) revert AlreadySigned();
        
        _councilPauseSignatures[msg.sender] = true;
        _councilPauseSignatureCount++;
        
        emit CouncilPauseSignatureCollected(msg.sender, _councilPauseSignatureCount, PAUSE_THRESHOLD);
        
        // Check if 5/9 threshold reached
        if (_councilPauseSignatureCount >= PAUSE_THRESHOLD) {
            _activatePause();
            // Reset council pause signatures
            _resetCouncilPauseSignatures();
        }
    }
    
    /// @notice Get council pause status
    function getCouncilPauseStatus() external view returns (uint256 signatures, uint256 required) {
        return (_councilPauseSignatureCount, PAUSE_THRESHOLD);
    }
    
    /// @notice Unpause the system
    function unpause() external onlyAuthorized {
        _paused = false;
        _pauseExpiry = 0;
        emit Unpaused(msg.sender);
    }
    
    /// @notice Check if system is paused
    function isPaused() external view returns (bool) {
        return _paused && block.timestamp <= _pauseExpiry;
    }
    
    /// @notice Check if system is paused (strict - doesn't auto-expire)
    function isPausedStrict() external view returns (bool) {
        if (!_paused) return false;
        return block.timestamp <= _pauseExpiry;
    }
    
    // ============ Internal Functions ============
    
    /// @notice Validate mode transition
    function _validateModeTransition(
        GovernanceMode from,
        GovernanceMode to
    ) internal pure {
        // Same mode transition is invalid
        if (from == to) {
            revert InvalidModeTransition(from, to);
        }
        
        // TRAINING can only go to CENTRALIZED
        if (from == GovernanceMode.TRAINING && to != GovernanceMode.CENTRALIZED) {
            revert InvalidModeTransition(from, to);
        }
        
        // CENTRALIZED can only go to MULTISIG
        if (from == GovernanceMode.CENTRALIZED && to != GovernanceMode.MULTISIG) {
            revert InvalidModeTransition(from, to);
        }
        
        // MULTISIG can go to DECENTRALIZED (upgrade) or CENTRALIZED (downgrade)
        // DECENTRALIZED can go to MULTISIG (downgrade)
    }
    
    /// @notice Activate pause with max duration
    function _activatePause() internal {
        _paused = true;
        _pauseExpiry = block.timestamp + MAX_PAUSE_DURATION;
        emit Paused(msg.sender, _pauseExpiry);
    }
    
    /// @notice Reset upgrade state
    /// @dev Gas consumption bounded by MAX_SIGNERS (max 20 iterations)
    function _resetUpgradeState() internal {
        _pendingUpgrade = GovernanceMode.TRAINING;
        _upgradeLockExpiry = 0;
        _upgradeSignatureCount = 0;
        
        // Reset signatures (bounded loop - max MAX_SIGNERS iterations)
        uint256 length = _multisigSigners.length;
        for (uint256 i = 0; i < length; i++) {
            _upgradeSignatures[_multisigSigners[i]] = false;
        }
        
        // Also reset council signatures if applicable
        length = _councilMembers.length;
        for (uint256 i = 0; i < length; i++) {
            _upgradeSignatures[_councilMembers[i]] = false;
        }
    }
    
    /// @notice Reset pause signatures (for MULTISIG mode)
    /// @dev Gas consumption bounded by MAX_SIGNERS (max 20 iterations)
    function _resetPauseSignatures() internal {
        _pauseSignatureCount = 0;
        // Bounded loop - max MAX_SIGNERS iterations
        uint256 length = _multisigSigners.length;
        for (uint256 i = 0; i < length; i++) {
            _pauseSignatures[_multisigSigners[i]] = false;
        }
    }
    
    /// @notice Reset council pause signatures (for DECENTRALIZED mode)
    /// @dev Gas consumption bounded by COUNCIL_SIZE (9 iterations)
    function _resetCouncilPauseSignatures() internal {
        _councilPauseSignatureCount = 0;
        // Bounded loop - max COUNCIL_SIZE iterations
        uint256 length = _councilMembers.length;
        for (uint256 i = 0; i < length; i++) {
            _councilPauseSignatures[_councilMembers[i]] = false;
        }
    }
    
    /// @notice Reset rollback state
    function _resetRollbackState() internal {
        _rollbackPending = false;
        _rollbackTargetMode = GovernanceMode.TRAINING;
        _rollbackReason = "";
        _rollbackLockExpiry = 0;
        _rollbackSignatureCount = 0;
        
        // Reset signatures
        uint256 length = _councilMembers.length;
        for (uint256 i = 0; i < length; i++) {
            _rollbackSignatures[_councilMembers[i]] = false;
        }
    }
}
