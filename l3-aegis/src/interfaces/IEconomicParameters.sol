// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
