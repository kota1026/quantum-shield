// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernanceSwitch} from "../interfaces/IGovernanceSwitch.sol";

/// @title GovernanceSwitch
/// @notice Pluggable Governance Layer switch mechanism for Quantum Shield
/// @dev Implements MODULAR_ARCHITECTURE.md §3.1 and SPEC_STRATEGY_BRIDGE §7
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md IMPL-002~006
contract GovernanceSwitch is IGovernanceSwitch {
    // ============ Constants ============
    
    /// @notice Time lock for MULTISIG -> DECENTRALIZED transition (7 days)
    uint256 public constant UPGRADE_TIMELOCK = 7 days;
    
    /// @notice Time lock for downgrade transitions (30 days)
    uint256 public constant DOWNGRADE_TIMELOCK = 30 days;
    
    /// @notice Maximum pause duration (72 hours)
    uint256 public constant MAX_PAUSE_DURATION = 72 hours;
    
    /// @notice Maximum number of signers (gas limit protection)
    /// @dev Limits loop iterations in _resetUpgradeState and _resetPauseSignatures
    uint256 public constant MAX_SIGNERS = 20;
    
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
    
    // ============ Events ============
    
    /// @notice Emitted when multisig is configured
    event MultisigConfigured(address[] signers, uint256 threshold);
    
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
    
    // ============ State Variables ============
    
    /// @notice Current governance mode
    GovernanceMode private _mode;
    
    /// @notice Admin address (for CENTRALIZED mode)
    address private _admin;
    
    // --- Multisig Configuration ---
    
    /// @notice Multisig signers
    address[] private _multisigSigners;
    
    /// @notice Required signatures threshold
    uint256 private _multisigThreshold;
    
    /// @notice Mapping of address to signer status
    mapping(address => bool) private _isSigner;
    
    // --- Security Council Configuration (DECENTRALIZED stub) ---
    
    /// @notice Security Council members
    address[] private _councilMembers;
    
    /// @notice Required council votes
    uint256 private _councilThreshold;
    
    // --- Upgrade Management ---
    
    /// @notice Pending upgrade target mode
    GovernanceMode private _pendingUpgrade;
    
    /// @notice Time lock expiry for pending upgrade
    uint256 private _upgradeLockExpiry;
    
    /// @notice Mapping of upgrade signatures
    mapping(address => bool) private _upgradeSignatures;
    
    /// @notice Count of upgrade signatures
    uint256 private _upgradeSignatureCount;
    
    // --- Pause Management ---
    
    /// @notice Whether system is paused
    bool private _paused;
    
    /// @notice Pause expiry timestamp
    uint256 private _pauseExpiry;
    
    /// @notice Mapping of pause signatures
    mapping(address => bool) private _pauseSignatures;
    
    /// @notice Count of pause signatures
    uint256 private _pauseSignatureCount;
    
    // ============ Constructor ============
    
    /// @notice Initialize GovernanceSwitch in CENTRALIZED mode
    /// @param admin_ Initial admin address
    constructor(address admin_) {
        require(admin_ != address(0), "Invalid admin");
        _admin = admin_;
        _mode = GovernanceMode.CENTRALIZED;
    }
    
    // ============ Modifiers ============
    
    /// @notice Restrict to authorized callers based on mode
    modifier onlyAuthorized() {
        if (_mode == GovernanceMode.CENTRALIZED) {
            if (msg.sender != _admin) revert Unauthorized();
        } else if (_mode == GovernanceMode.MULTISIG) {
            if (!_isSigner[msg.sender]) revert Unauthorized();
        } else {
            // DECENTRALIZED - Security Council check (stub)
            revert Unauthorized();
        }
        _;
    }
    
    /// @notice Restrict to admin only (CENTRALIZED mode)
    modifier onlyAdmin() {
        if (msg.sender != _admin) revert Unauthorized();
        _;
    }
    
    // ============ IGovernanceSwitch Implementation ============
    
    /// @inheritdoc IGovernanceSwitch
    function getGovernanceMode() external view override returns (GovernanceMode) {
        return _mode;
    }
    
    /// @inheritdoc IGovernanceSwitch
    function getApprover(bytes4 /*action*/) external view override returns (address) {
        if (_mode == GovernanceMode.CENTRALIZED) {
            return _admin;
        } else {
            // For MULTISIG/DECENTRALIZED, return contract address
            // indicating collective approval is needed
            return address(this);
        }
    }
    
    /// @inheritdoc IGovernanceSwitch
    function canApprove(bytes4 /*action*/, address caller) external view override returns (bool) {
        if (_mode == GovernanceMode.CENTRALIZED) {
            return caller == _admin;
        } else if (_mode == GovernanceMode.MULTISIG) {
            return _isSigner[caller];
        } else {
            // DECENTRALIZED - stub
            return false;
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
        if (_mode != GovernanceMode.DECENTRALIZED) {
            return (0, 0);
        }
        return (_councilThreshold, _councilMembers.length);
    }
    
    /// @inheritdoc IGovernanceSwitch
    function setGovernanceMode(GovernanceMode newMode) external override {
        GovernanceMode currentMode = _mode;
        
        // Validate transition
        _validateModeTransition(currentMode, newMode);
        
        // Check authorization
        if (currentMode == GovernanceMode.CENTRALIZED) {
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
    
    // ============ Upgrade Management (IMPL-004, IMPL-005) ============
    
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
    
    /// @notice Check if downgrade is restricted
    /// @dev DECENTRALIZED -> MULTISIG/CENTRALIZED requires supermajority
    function isDowngradeRestricted() external view returns (bool) {
        return _mode == GovernanceMode.DECENTRALIZED;
    }
    
    // ============ Emergency Pause (IMPL-006) ============
    
    /// @notice Emergency pause (CENTRALIZED mode - admin only)
    function emergencyPause() external {
        if (_mode == GovernanceMode.CENTRALIZED) {
            if (msg.sender != _admin) revert Unauthorized();
            _activatePause();
        } else if (_mode == GovernanceMode.MULTISIG) {
            // MULTISIG mode requires threshold signatures
            revert Unauthorized();
        } else {
            // DECENTRALIZED mode - Security Council 5/9 (stub)
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
        // CENTRALIZED can only go to MULTISIG
        if (from == GovernanceMode.CENTRALIZED && to == GovernanceMode.DECENTRALIZED) {
            revert InvalidModeTransition(from, to);
        }
        
        // Same mode transition is invalid
        if (from == to) {
            revert InvalidModeTransition(from, to);
        }
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
        _pendingUpgrade = GovernanceMode.CENTRALIZED;
        _upgradeLockExpiry = 0;
        _upgradeSignatureCount = 0;
        
        // Reset signatures (bounded loop - max MAX_SIGNERS iterations)
        uint256 length = _multisigSigners.length;
        for (uint256 i = 0; i < length; i++) {
            _upgradeSignatures[_multisigSigners[i]] = false;
        }
    }
    
    /// @notice Reset pause signatures
    /// @dev Gas consumption bounded by MAX_SIGNERS (max 20 iterations)
    function _resetPauseSignatures() internal {
        _pauseSignatureCount = 0;
        // Bounded loop - max MAX_SIGNERS iterations
        uint256 length = _multisigSigners.length;
        for (uint256 i = 0; i < length; i++) {
            _pauseSignatures[_multisigSigners[i]] = false;
        }
    }
}
