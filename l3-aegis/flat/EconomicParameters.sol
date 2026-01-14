// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// src/interfaces/IEconomicParameters.sol

/// @title IEconomicParameters - Protocol Economic Parameters Interface
/// @notice Manages protocol economic parameters per UNIFIED_SPEC v2.0
/// @dev CP-3 (Time Lock) and CP-4 (Slashing) parameters are immutable/restricted
/// @custom:ref UNIFIED_SPEC_v2.0.md §セキュリティパラメータ
/// @custom:ref CORE_PRINCIPLES.md §セキュリティパラメータ（固定値）
/// @custom:security CP-3/CP-4 protected parameters
interface IEconomicParameters {
    // ============ Structs ============

    struct ParameterSet {
        uint256 feeRate;              // Basis points (5 = 0.05%)
        uint256 minimumFee;           // Minimum fee in wei ($10 equivalent)
        uint256 minimumStake;         // Minimum prover stake ($500K)
        uint256 unbondingPeriod;      // Unbonding period (7 days)
        uint256 votingPowerCap;       // Max voting power per address (5%)
        uint256 normalTimeLock;       // Normal unlock time lock (24h) - CP-3
        uint256 emergencyTimeLock;    // Emergency time lock (7 days) - CP-3
        uint256 slashingRateBase;     // Base slashing rate (10%) - CP-4
    }

    // ============ Events ============

    event FeeRateUpdated(uint256 oldRate, uint256 newRate, uint256 timestamp);
    event MinimumFeeUpdated(uint256 oldFee, uint256 newFee, uint256 timestamp);
    event MinimumStakeUpdated(uint256 oldStake, uint256 newStake, uint256 timestamp);
    event UnbondingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod, uint256 timestamp);
    event VotingPowerCapUpdated(uint256 oldCap, uint256 newCap, uint256 timestamp);

    // ============ Errors ============

    error CannotReduceUnbondingPeriod();
    error SlashingRateImmutable();
    error CannotReduceTimeLock();
    error InvalidParameter();
    error NotAuthorized();
    error TimeLockRequired();
    error InvalidVotingPowerCap();
    error InvalidAddress();

    // ============ CP-Protected Constants ============

    /// @notice Normal time lock period (24 hours) - CP-3 protected
    function NORMAL_TIME_LOCK() external view returns (uint256 period);

    /// @notice Emergency time lock period (7 days) - CP-3 protected
    function EMERGENCY_TIME_LOCK() external view returns (uint256 period);

    /// @notice Quadratic slashing base rate (10%) - CP-4 protected, IMMUTABLE
    /// @dev Slashing = N² × 10% where N is violation count
    function SLASHING_RATE_BASE() external view returns (uint256 rate);

    // ============ View Functions ============

    function feeRate() external view returns (uint256 rate);
    function minimumFee() external view returns (uint256 fee);
    function minimumStake() external view returns (uint256 stake);
    function unbondingPeriod() external view returns (uint256 period);
    function votingPowerCap() external view returns (uint256 cap);
    function getAllParameters() external view returns (ParameterSet memory params);
    function calculateFee(uint256 amount) external view returns (uint256 fee);
    function calculateSlashing(uint256 baseAmount, uint256 violationCount) external view returns (uint256 slashAmount);
    function applyVotingPowerCap(uint256 userVotes, uint256 totalVotes) external view returns (uint256 cappedVotes);
    function isValidStake(uint256 amount) external view returns (bool valid);

    // ============ Parameter Update Functions ============

    function setFeeRate(uint256 newRate) external;
    function setMinimumFee(uint256 newFee) external;
    function setMinimumStake(uint256 newStake) external;
    function setUnbondingPeriod(uint256 newPeriod) external;
    function setVotingPowerCap(uint256 newCap) external;
}

// src/interfaces/IGovernanceSwitch.sol

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

// src/economics/EconomicParameters.sol

/// @title EconomicParameters
/// @notice DECEN-019: Protocol economic parameters with CP protection
/// @dev Manages fee rates, staking, unbonding, voting caps with CP-3/CP-4 enforcement
contract EconomicParameters is IEconomicParameters {
    // ========== State Variables ==========
    
    /// @notice GovernanceSwitch contract
    IGovernanceSwitch public immutable governanceSwitch;
    
    /// @notice Admin address
    address public immutable admin;
    
    /// @notice Fee rate in basis points (0.05% = 5)
    uint256 public feeRate;
    
    /// @notice Minimum fee amount ($10)
    uint256 public minimumFee;
    
    /// @notice Minimum stake requirement ($500K)
    uint256 public minimumStake;
    
    /// @notice Unbonding period (7 days, CP-3 protected - extension only)
    uint256 public unbondingPeriod;
    
    /// @notice Voting power cap in basis points (5% = 500)
    uint256 public votingPowerCap;
    
    // ========== Constants (CP Protected) ==========
    
    /// @notice Normal time lock period - CP-3 IMMUTABLE (24 hours)
    uint256 public constant NORMAL_TIME_LOCK = 24 hours;
    
    /// @notice Emergency time lock period - CP-3 IMMUTABLE (7 days)
    uint256 public constant EMERGENCY_TIME_LOCK = 7 days;
    
    /// @notice Slashing rate base - CP-4 IMMUTABLE (10% = 1000 basis points)
    uint256 public constant SLASHING_RATE_BASE = 1000;
    
    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;
    
    // ========== Initial Values ==========
    
    uint256 constant INITIAL_FEE_RATE = 5;                    // 0.05%
    uint256 constant INITIAL_MIN_FEE = 10 * 1e18;             // $10
    uint256 constant INITIAL_MIN_STAKE = 500_000 * 1e18;      // $500K
    uint256 constant INITIAL_UNBONDING = 7 days;              // 7 days
    uint256 constant INITIAL_VOTING_CAP = 500;                // 5%
    
    // ========== Constructor ==========
    
    constructor(address _governanceSwitch) {
        if (_governanceSwitch == address(0)) revert InvalidAddress();
        
        governanceSwitch = IGovernanceSwitch(_governanceSwitch);
        admin = msg.sender;
        
        // Initialize parameters
        feeRate = INITIAL_FEE_RATE;
        minimumFee = INITIAL_MIN_FEE;
        minimumStake = INITIAL_MIN_STAKE;
        unbondingPeriod = INITIAL_UNBONDING;
        votingPowerCap = INITIAL_VOTING_CAP;
    }
    
    // ========== Governance Functions ==========
    
    /// @inheritdoc IEconomicParameters
    function setFeeRate(uint256 _feeRate) external override {
        _checkGovernance();
        
        uint256 old = feeRate;
        feeRate = _feeRate;
        
        emit FeeRateUpdated(old, _feeRate, block.timestamp);
    }
    
    /// @inheritdoc IEconomicParameters
    function setMinimumFee(uint256 _minimumFee) external override {
        _checkGovernance();
        
        uint256 old = minimumFee;
        minimumFee = _minimumFee;
        
        emit MinimumFeeUpdated(old, _minimumFee, block.timestamp);
    }
    
    /// @inheritdoc IEconomicParameters
    function setMinimumStake(uint256 _minimumStake) external override {
        _checkGovernance();
        
        uint256 old = minimumStake;
        minimumStake = _minimumStake;
        
        emit MinimumStakeUpdated(old, _minimumStake, block.timestamp);
    }
    
    /// @inheritdoc IEconomicParameters
    function setUnbondingPeriod(uint256 _unbondingPeriod) external override {
        _checkGovernance();
        
        // CP-3 Protection: Cannot reduce unbonding period
        if (_unbondingPeriod < unbondingPeriod) {
            revert CannotReduceUnbondingPeriod();
        }
        
        uint256 old = unbondingPeriod;
        unbondingPeriod = _unbondingPeriod;
        
        emit UnbondingPeriodUpdated(old, _unbondingPeriod, block.timestamp);
    }
    
    /// @inheritdoc IEconomicParameters
    function setVotingPowerCap(uint256 _votingPowerCap) external override {
        _checkGovernance();
        
        if (_votingPowerCap > BASIS_POINTS) {
            revert InvalidVotingPowerCap();
        }
        
        uint256 old = votingPowerCap;
        votingPowerCap = _votingPowerCap;
        
        emit VotingPowerCapUpdated(old, _votingPowerCap, block.timestamp);
    }
    
    // ========== View Functions ==========
    
    /// @inheritdoc IEconomicParameters
    function calculateFee(uint256 amount) external view override returns (uint256) {
        uint256 rateFee = (amount * feeRate) / BASIS_POINTS;
        return rateFee > minimumFee ? rateFee : minimumFee;
    }
    
    /// @inheritdoc IEconomicParameters
    function calculateSlashing(uint256 baseAmount, uint256 violationCount) external pure override returns (uint256) {
        if (violationCount == 0) return 0;
        
        // CP-4: N² × 10% quadratic slashing
        uint256 multiplier = violationCount * violationCount;
        uint256 slashAmount = (baseAmount * multiplier * SLASHING_RATE_BASE) / BASIS_POINTS;
        
        // Cap at 100%
        return slashAmount > baseAmount ? baseAmount : slashAmount;
    }
    
    /// @inheritdoc IEconomicParameters
    function applyVotingPowerCap(uint256 userVotes, uint256 totalVotes) external view override returns (uint256) {
        if (totalVotes == 0) return 0;
        
        uint256 maxVotes = (totalVotes * votingPowerCap) / BASIS_POINTS;
        return userVotes > maxVotes ? maxVotes : userVotes;
    }
    
    /// @inheritdoc IEconomicParameters
    function isValidStake(uint256 amount) external view override returns (bool) {
        return amount >= minimumStake;
    }
    
    /// @inheritdoc IEconomicParameters
    function getAllParameters() external view override returns (ParameterSet memory) {
        return ParameterSet({
            feeRate: feeRate,
            minimumFee: minimumFee,
            minimumStake: minimumStake,
            unbondingPeriod: unbondingPeriod,
            votingPowerCap: votingPowerCap,
            normalTimeLock: NORMAL_TIME_LOCK,
            emergencyTimeLock: EMERGENCY_TIME_LOCK,
            slashingRateBase: SLASHING_RATE_BASE
        });
    }
    
    // ========== Internal Functions ==========
    
    /// @notice Check if caller has governance authority
    function _checkGovernance() internal view {
        IGovernanceSwitch.GovernanceMode mode = governanceSwitch.getGovernanceMode();
        
        if (mode == IGovernanceSwitch.GovernanceMode.TRAINING || 
            mode == IGovernanceSwitch.GovernanceMode.CENTRALIZED) {
            // In TRAINING/CENTRALIZED mode, only admin can modify
            if (msg.sender != admin) revert NotAuthorized();
        } else if (mode == IGovernanceSwitch.GovernanceMode.MULTISIG) {
            // In MULTISIG mode, use canApprove to check authorization
            bytes4 selector = bytes4(msg.data[:4]);
            if (!governanceSwitch.canApprove(selector, msg.sender)) revert NotAuthorized();
        } else {
            // DECENTRALIZED mode - use canApprove for governance checks
            bytes4 selector = bytes4(msg.data[:4]);
            if (!governanceSwitch.canApprove(selector, msg.sender)) revert NotAuthorized();
        }
    }
}
