// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITokenSwitch} from "../interfaces/ITokenSwitch.sol";
import {IGovernanceSwitch} from "../interfaces/IGovernanceSwitch.sol";

/// @title TokenSwitch
/// @notice Pluggable Token Layer switch mechanism for Quantum Shield
/// @dev Implements MODULAR_ARCHITECTURE.md §3.2 and SPEC_STRATEGY_BRIDGE §7.2
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md IMPL-001~007
contract TokenSwitch is ITokenSwitch {
    // ============ Constants ============
    
    /// @notice Time lock for upgrade transitions DISABLED -> BASIC (instant, admin)
    /// @dev Admin can directly transition in CENTRALIZED governance mode
    uint256 public constant ADMIN_INSTANT = 0;
    
    /// @notice Time lock for BASIC -> FULL transition (7 days)
    uint256 public constant UPGRADE_TIMELOCK = 7 days;
    
    /// @notice Time lock for downgrade transitions FULL -> BASIC/DISABLED (30 days)
    uint256 public constant DOWNGRADE_TIMELOCK = 30 days;
    
    /// @notice Minimum stake for DISABLED mode ($400K equivalent)
    /// @dev Per SPEC_STRATEGY_BRIDGE §7.2
    uint256 public constant DISABLED_MIN_STAKE = 400_000 * 1e18;
    
    /// @notice Minimum stake for BASIC/FULL mode ($500K equivalent)
    /// @dev Per SPEC_STRATEGY_BRIDGE §7.2
    uint256 public constant BASIC_FULL_MIN_STAKE = 500_000 * 1e18;
    
    /// @notice Pre-computed function selector for setTokenMode(uint8)
    /// @dev = bytes4(keccak256("setTokenMode(uint8)")) - pre-computed for CP-1 compliance
    bytes4 private constant SELECTOR_SET_TOKEN_MODE = 0x0d175f51;
    
    // ============ Errors ============
    
    /// @notice Thrown when time lock has not expired
    error TimeLockNotExpired();
    
    /// @notice Thrown when no upgrade is pending
    error NoPendingUpgrade();
    
    /// @notice Thrown when token address is zero but required
    error TokenAddressRequired();
    
    /// @notice Thrown when governance switch is not set
    error GovernanceSwitchNotSet();
    
    /// @notice Thrown when caller is not governance switch
    error NotGovernanceSwitch();
    
    // ============ Events ============
    
    /// @notice Emitted when upgrade is initiated
    event UpgradeInitiated(
        TokenMode indexed targetMode,
        address indexed initiator,
        uint256 unlockTime
    );
    
    /// @notice Emitted when upgrade is cancelled
    event UpgradeCancelled(
        TokenMode indexed targetMode,
        address indexed cancelledBy
    );
    
    /// @notice Emitted when QS token address is set
    event TokenAddressSet(address indexed tokenAddress);
    
    /// @notice Emitted when governance switch is set
    event GovernanceSwitchSet(address indexed governanceSwitch);
    
    // ============ State Variables ============
    
    /// @notice Current token mode
    TokenMode private _mode;
    
    /// @notice QS Token address (address(0) when DISABLED)
    address private _qsTokenAddress;
    
    /// @notice Governance switch contract reference
    IGovernanceSwitch private _governanceSwitch;
    
    /// @notice Admin address (for initial setup)
    address private _admin;
    
    // --- Upgrade Management ---
    
    /// @notice Pending upgrade target mode
    TokenMode private _pendingUpgrade;
    
    /// @notice Time lock expiry for pending upgrade
    uint256 private _upgradeLockExpiry;
    
    /// @notice Whether an upgrade is pending
    bool private _hasPendingUpgrade;
    
    // ============ Constructor ============
    
    /// @notice Initialize TokenSwitch in DISABLED mode
    /// @param admin_ Initial admin address
    constructor(address admin_) {
        require(admin_ != address(0), "Invalid admin");
        _admin = admin_;
        _mode = TokenMode.DISABLED;
    }
    
    // ============ Modifiers ============
    
    /// @notice Restrict to authorized callers (admin or governance switch)
    modifier onlyAuthorized() {
        _checkAuthorization();
        _;
    }
    
    /// @notice Restrict to admin only
    modifier onlyAdmin() {
        require(msg.sender == _admin, "Only admin");
        _;
    }
    
    // ============ ITokenSwitch Implementation ============
    
    /// @inheritdoc ITokenSwitch
    function getTokenMode() external view override returns (TokenMode) {
        return _mode;
    }
    
    /// @inheritdoc ITokenSwitch
    function getTokenAddress() external view override returns (address) {
        if (_mode == TokenMode.DISABLED) {
            return address(0);
        }
        return _qsTokenAddress;
    }
    
    /// @inheritdoc ITokenSwitch
    function getFeeToken() external view override returns (address) {
        if (_mode == TokenMode.DISABLED) {
            return address(0); // ETH
        }
        return _qsTokenAddress;
    }
    
    /// @inheritdoc ITokenSwitch
    function getStakeCurrency() external view override returns (address) {
        if (_mode == TokenMode.DISABLED) {
            return address(0); // ETH
        }
        return _qsTokenAddress; // $QS
    }
    
    /// @inheritdoc ITokenSwitch
    function getMinimumStake() external view override returns (uint256) {
        if (_mode == TokenMode.DISABLED) {
            return DISABLED_MIN_STAKE; // $400K
        }
        return BASIC_FULL_MIN_STAKE; // $500K
    }
    
    /// @inheritdoc ITokenSwitch
    function isVeQSEnabled() external view override returns (bool) {
        return _mode == TokenMode.FULL;
    }
    
    /// @inheritdoc ITokenSwitch
    function isStakingEnabled() external view override returns (bool) {
        return _mode == TokenMode.FULL;
    }
    
    /// @inheritdoc ITokenSwitch
    function setTokenMode(TokenMode newMode) external override onlyAuthorized {
        TokenMode currentMode = _mode;
        
        // Same mode transition is invalid
        if (currentMode == newMode) {
            revert InvalidModeTransition(currentMode, newMode);
        }
        
        // Check if governance switch is set (required for non-admin transitions)
        IGovernanceSwitch govSwitch = _governanceSwitch;
        IGovernanceSwitch.GovernanceMode govMode;
        
        if (address(govSwitch) != address(0)) {
            govMode = govSwitch.getGovernanceMode();
        } else {
            // No governance switch, use CENTRALIZED behavior
            govMode = IGovernanceSwitch.GovernanceMode.CENTRALIZED;
        }
        
        // CENTRALIZED governance: admin can directly transition DISABLED -> BASIC
        if (govMode == IGovernanceSwitch.GovernanceMode.CENTRALIZED) {
            if (currentMode == TokenMode.DISABLED && newMode == TokenMode.BASIC) {
                // Require token address for BASIC mode
                if (_qsTokenAddress == address(0)) {
                    revert TokenAddressRequired();
                }
                _mode = newMode;
                emit TokenModeChanged(currentMode, newMode, msg.sender);
                return;
            }
        }
        
        // Check if this is an upgrade or downgrade
        bool isUpgrade = uint256(newMode) > uint256(currentMode);
        bool isDowngrade = uint256(newMode) < uint256(currentMode);
        
        // Determine required timelock
        uint256 requiredTimelock;
        if (isUpgrade) {
            // DISABLED -> BASIC: admin approval (handled above for CENTRALIZED)
            // BASIC -> FULL: 7 days
            if (currentMode == TokenMode.BASIC && newMode == TokenMode.FULL) {
                requiredTimelock = UPGRADE_TIMELOCK;
            } else {
                requiredTimelock = 0;
            }
        } else if (isDowngrade) {
            // All downgrades: 30 days + supermajority (for DECENTRALIZED)
            requiredTimelock = DOWNGRADE_TIMELOCK;
        }
        
        // For transitions requiring timelock, initiate pending upgrade
        if (requiredTimelock > 0) {
            // Token address required for BASIC/FULL modes
            if (newMode != TokenMode.DISABLED && _qsTokenAddress == address(0)) {
                revert TokenAddressRequired();
            }
            
            _pendingUpgrade = newMode;
            _upgradeLockExpiry = block.timestamp + requiredTimelock;
            _hasPendingUpgrade = true;
            
            emit UpgradeInitiated(newMode, msg.sender, _upgradeLockExpiry);
        } else {
            // Direct transition
            if (newMode != TokenMode.DISABLED && _qsTokenAddress == address(0)) {
                revert TokenAddressRequired();
            }
            _mode = newMode;
            emit TokenModeChanged(currentMode, newMode, msg.sender);
        }
    }
    
    /// @inheritdoc ITokenSwitch
    function setTokenAddress(address tokenAddress) external override onlyAdmin {
        require(tokenAddress != address(0), "Invalid token address");
        
        address oldToken = _qsTokenAddress;
        _qsTokenAddress = tokenAddress;
        
        emit TokenAddressSet(tokenAddress);
        if (oldToken != tokenAddress) {
            emit FeeTokenUpdated(oldToken, tokenAddress);
        }
    }
    
    // ============ Upgrade Management ============
    
    /// @notice Finalize pending upgrade after time lock expires
    function finalizeUpgrade() external onlyAuthorized {
        if (!_hasPendingUpgrade) revert NoPendingUpgrade();
        if (block.timestamp < _upgradeLockExpiry) revert TimeLockNotExpired();
        
        TokenMode oldMode = _mode;
        TokenMode newMode = _pendingUpgrade;
        
        // Apply upgrade
        _mode = newMode;
        
        // Reset upgrade state
        _resetUpgradeState();
        
        emit TokenModeChanged(oldMode, newMode, msg.sender);
    }
    
    /// @notice Cancel pending upgrade
    function cancelUpgrade() external onlyAuthorized {
        if (!_hasPendingUpgrade) revert NoPendingUpgrade();
        
        TokenMode cancelledMode = _pendingUpgrade;
        _resetUpgradeState();
        
        emit UpgradeCancelled(cancelledMode, msg.sender);
    }
    
    /// @notice Check if an upgrade is pending
    function hasPendingUpgrade() external view returns (bool) {
        return _hasPendingUpgrade;
    }
    
    /// @notice Get pending upgrade target mode
    function getPendingUpgrade() external view returns (TokenMode) {
        return _pendingUpgrade;
    }
    
    /// @notice Get time lock expiry timestamp
    function getTimeLockExpiry() external view returns (uint256) {
        return _upgradeLockExpiry;
    }
    
    /// @notice Check if time lock is active
    function isTimeLockActive() external view returns (bool) {
        return _hasPendingUpgrade && block.timestamp < _upgradeLockExpiry;
    }
    
    // ============ Governance Integration ============
    
    /// @notice Set governance switch contract
    /// @param governanceSwitch_ GovernanceSwitch contract address
    function setGovernanceSwitch(address governanceSwitch_) external onlyAdmin {
        require(governanceSwitch_ != address(0), "Invalid governance switch");
        _governanceSwitch = IGovernanceSwitch(governanceSwitch_);
        emit GovernanceSwitchSet(governanceSwitch_);
    }
    
    /// @notice Get governance switch address
    function getGovernanceSwitch() external view returns (address) {
        return address(_governanceSwitch);
    }
    
    /// @notice Get admin address
    function getAdmin() external view returns (address) {
        return _admin;
    }
    
    // ============ Internal Functions ============
    
    /// @notice Check if caller is authorized
    function _checkAuthorization() internal view {
        // Admin is always authorized
        if (msg.sender == _admin) {
            return;
        }
        
        // Check governance switch authorization
        IGovernanceSwitch govSwitch = _governanceSwitch;
        if (address(govSwitch) != address(0)) {
            // Use pre-computed selector for CP-1 compliance (no runtime keccak256)
            if (govSwitch.canApprove(SELECTOR_SET_TOKEN_MODE, msg.sender)) {
                return;
            }
        }
        
        revert Unauthorized();
    }
    
    /// @notice Reset upgrade state
    function _resetUpgradeState() internal {
        _pendingUpgrade = TokenMode.DISABLED;
        _upgradeLockExpiry = 0;
        _hasPendingUpgrade = false;
    }
}
