// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IEconomicParameters.sol";
import "../interfaces/IGovernanceSwitch.sol";

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
        IGovernanceSwitch.GovernanceMode mode = governanceSwitch.getCurrentMode();
        
        if (mode == IGovernanceSwitch.GovernanceMode.CENTRALIZED) {
            if (msg.sender != admin) revert NotAuthorized();
        } else if (mode == IGovernanceSwitch.GovernanceMode.MULTISIG) {
            // Check if caller is authorized multi-sig member
            if (!governanceSwitch.isAuthorizedSigner(msg.sender)) revert NotAuthorized();
        } else {
            // Decentralized mode - must go through governance proposal
            // This should be called from a governance executor contract
            if (!governanceSwitch.isGovernanceExecutor(msg.sender)) revert NotAuthorized();
        }
    }
}
