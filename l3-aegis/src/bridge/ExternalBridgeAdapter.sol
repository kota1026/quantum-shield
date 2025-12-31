// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IExternalBridgeAdapter} from "../interfaces/IExternalBridgeAdapter.sol";
import {IGovernanceSwitch} from "../interfaces/IGovernanceSwitch.sol";
import {ITokenSwitch} from "../interfaces/ITokenSwitch.sol";

/// @title ExternalBridgeAdapter
/// @notice Layer interconnection adapter for Quantum Shield Modular Architecture
/// @dev Implements SPEC_STRATEGY_BRIDGE §3, §6, §7
///      Provides indirect reference between Core Layer and Pluggable Layers
///      to avoid direct dependency violations
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md IMPL-002~005, IC-2
contract ExternalBridgeAdapter is IExternalBridgeAdapter {
    // ============ Constants ============
    
    /// @notice Pre-computed selector for prover registration (Sequence #5)
    /// @dev Token required for stake
    bytes4 private constant SELECTOR_PROVER_REGISTRATION = 0x45678901;
    
    /// @notice Pre-computed selector for governance proposal (Sequence #7)
    /// @dev Only valid in DECENTRALIZED mode with Token enabled
    bytes4 private constant SELECTOR_GOVERNANCE_PROPOSAL = 0x56789012;
    
    /// @notice Pre-computed selector for prover exit (Sequence #6)
    bytes4 private constant SELECTOR_PROVER_EXIT = 0x67890123;
    
    // ============ State Variables ============
    
    /// @notice Admin address
    address private _admin;
    
    /// @notice GovernanceSwitch contract reference
    IGovernanceSwitch private _governanceSwitch;
    
    /// @notice TokenSwitch contract reference
    ITokenSwitch private _tokenSwitch;
    
    /// @notice Initialization flag
    bool private _initialized;
    
    // ============ Events ============
    
    /// @notice Emitted when admin is transferred
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    
    // ============ Constructor ============
    
    /// @notice Deploy ExternalBridgeAdapter
    /// @param admin_ Initial admin address
    constructor(address admin_) {
        require(admin_ != address(0), "Invalid admin");
        _admin = admin_;
    }
    
    // ============ Modifiers ============
    
    /// @notice Restrict to initialized state
    modifier onlyInitialized() {
        if (!_initialized) revert NotInitialized();
        _;
    }
    
    /// @notice Restrict to admin
    modifier onlyAdmin() {
        if (msg.sender != _admin) {
            revert UnauthorizedCaller(msg.sender, bytes4(0));
        }
        _;
    }
    
    // ============ IExternalBridgeAdapter Implementation ============
    
    /// @inheritdoc IExternalBridgeAdapter
    function getGovernanceMode() external view override onlyInitialized returns (IGovernanceSwitch.GovernanceMode) {
        return _governanceSwitch.getGovernanceMode();
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function getTokenMode() external view override onlyInitialized returns (ITokenSwitch.TokenMode) {
        return _tokenSwitch.getTokenMode();
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function canExecuteCoreAction(bytes4 action, address caller) external view override onlyInitialized returns (bool) {
        IGovernanceSwitch.GovernanceMode govMode = _governanceSwitch.getGovernanceMode();
        ITokenSwitch.TokenMode tokenMode = _tokenSwitch.getTokenMode();
        
        // Governance Proposal (Sequence #7) requires DECENTRALIZED + Token
        if (action == SELECTOR_GOVERNANCE_PROPOSAL) {
            if (govMode != IGovernanceSwitch.GovernanceMode.DECENTRALIZED) {
                return false;
            }
            if (tokenMode == ITokenSwitch.TokenMode.DISABLED) {
                return false;
            }
            // In DECENTRALIZED mode, check veQS voting power
            return _hasVeQSVotingPower(caller);
        }
        
        // Standard authorization check via GovernanceSwitch
        return _governanceSwitch.canApprove(action, caller);
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function isTokenRequired(bytes4 action) external view override onlyInitialized returns (bool) {
        // Prover Registration (Sequence #5) requires token for stake
        if (action == SELECTOR_PROVER_REGISTRATION) {
            return true;
        }
        
        // Prover Exit (Sequence #6) requires token for stake return
        if (action == SELECTOR_PROVER_EXIT) {
            return true;
        }
        
        // Governance Proposal (Sequence #7) requires veQS for voting
        if (action == SELECTOR_GOVERNANCE_PROPOSAL) {
            return true;
        }
        
        return false;
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function validateLayerCompatibility() external view override onlyInitialized returns (bool) {
        IGovernanceSwitch.GovernanceMode govMode = _governanceSwitch.getGovernanceMode();
        ITokenSwitch.TokenMode tokenMode = _tokenSwitch.getTokenMode();
        
        // DECENTRALIZED + DISABLED is prohibited (SPEC_STRATEGY_BRIDGE §2.2)
        // Reason: veQS voting not possible without token
        if (govMode == IGovernanceSwitch.GovernanceMode.DECENTRALIZED && 
            tokenMode == ITokenSwitch.TokenMode.DISABLED) {
            return false;
        }
        
        return true;
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function getStakeCurrency() external view override onlyInitialized returns (address) {
        return _tokenSwitch.getStakeCurrency();
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function getMinimumStake() external view override onlyInitialized returns (uint256) {
        return _tokenSwitch.getMinimumStake();
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function hasVotingPower(address account) external view override onlyInitialized returns (bool) {
        IGovernanceSwitch.GovernanceMode govMode = _governanceSwitch.getGovernanceMode();
        
        // Only relevant in DECENTRALIZED mode
        if (govMode != IGovernanceSwitch.GovernanceMode.DECENTRALIZED) {
            return false;
        }
        
        return _hasVeQSVotingPower(account);
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function getGovernanceSwitchAddress() external view override returns (address) {
        return address(_governanceSwitch);
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function getTokenSwitchAddress() external view override returns (address) {
        return address(_tokenSwitch);
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function isInitialized() external view override returns (bool) {
        return _initialized;
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function initialize(address governance, address token) external override onlyAdmin {
        if (_initialized) revert AlreadyInitialized();
        if (governance == address(0)) revert ZeroAddress();
        if (token == address(0)) revert ZeroAddress();
        
        _governanceSwitch = IGovernanceSwitch(governance);
        _tokenSwitch = ITokenSwitch(token);
        _initialized = true;
        
        emit LayerReferenceUpdated(governance, token);
    }
    
    /// @inheritdoc IExternalBridgeAdapter
    function updateLayerReferences(address governance, address token) external override {
        // Check authorization
        if (!_canUpdateReferences(msg.sender)) {
            revert UnauthorizedCaller(msg.sender, bytes4(0));
        }
        
        if (governance == address(0)) revert ZeroAddress();
        if (token == address(0)) revert ZeroAddress();
        
        _governanceSwitch = IGovernanceSwitch(governance);
        _tokenSwitch = ITokenSwitch(token);
        
        emit LayerReferenceUpdated(governance, token);
    }
    
    // ============ Admin Functions ============
    
    /// @notice Transfer admin role
    /// @param newAdmin New admin address
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid new admin");
        address oldAdmin = _admin;
        _admin = newAdmin;
        emit AdminTransferred(oldAdmin, newAdmin);
    }
    
    /// @notice Get admin address
    function getAdmin() external view returns (address) {
        return _admin;
    }
    
    // ============ Internal Functions ============
    
    /// @notice Check if account has veQS voting power
    /// @dev Stub implementation - will be extended when veQS is implemented
    /// @param account Account to check
    /// @return True if account has voting power
    function _hasVeQSVotingPower(address account) internal view returns (bool) {
        ITokenSwitch.TokenMode tokenMode = _tokenSwitch.getTokenMode();
        
        // No voting power if token is DISABLED
        if (tokenMode == ITokenSwitch.TokenMode.DISABLED) {
            return false;
        }
        
        // In BASIC mode, no veQS voting (only token utility)
        if (tokenMode == ITokenSwitch.TokenMode.BASIC) {
            return false;
        }
        
        // In FULL mode, check veQS balance
        // TODO: Implement veQS balance check when veQS contract is deployed
        // For now, return true for any non-zero address in FULL mode
        return account != address(0);
    }
    
    /// @notice Check if caller can update Layer references
    /// @dev Admin can always update. In MULTISIG/DECENTRALIZED mode,
    ///      requires appropriate governance approval
    /// @param caller Address attempting the update
    /// @return True if caller can update references
    function _canUpdateReferences(address caller) internal view returns (bool) {
        // Admin can always update
        if (caller == _admin) {
            return true;
        }
        
        // If not initialized, only admin can update
        if (!_initialized) {
            return false;
        }
        
        // Check governance authorization
        // Use a pre-computed selector for updateLayerReferences
        bytes4 updateSelector = bytes4(0x12341234); // Placeholder selector
        return _governanceSwitch.canApprove(updateSelector, caller);
    }
}
