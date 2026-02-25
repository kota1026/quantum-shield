// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IProverRewardPool - Prover Signing Reward Pool Interface
/// @notice Distributes QS token rewards to active Provers based on signing activity
/// @dev Receives QS tokens from RewardRouter (30% of inflation)
///   Distribution: proportional to each Prover's signature count in the period
/// @custom:ref SEQUENCES.md §9.4 Prover署名報酬メカニズム
/// @custom:security-contact security@quantumshield.io
interface IProverRewardPool {
    // ============ Structs ============

    /// @notice Prover reward tracking
    struct ProverReward {
        uint256 pendingRewards;     // Unclaimed rewards
        uint256 totalClaimed;       // Total claimed amount
        uint256 lastClaimTime;      // Last claim timestamp
        uint256 signatureCount;     // Signatures in current period
    }

    /// @notice Distribution period data
    struct DistributionPeriod {
        uint256 periodId;
        uint256 startTime;
        uint256 endTime;
        uint256 totalRewards;       // Total QS distributed in period
        uint256 totalSignatures;    // Total signatures across all provers
        bool finalized;
    }

    // ============ Events ============

    /// @notice Emitted when signatures are recorded for a prover
    event SignaturesRecorded(
        address indexed prover,
        uint256 count,
        uint256 periodId
    );

    /// @notice Emitted when a distribution period is finalized
    event PeriodFinalized(
        uint256 indexed periodId,
        uint256 totalRewards,
        uint256 totalSignatures,
        uint256 proverCount
    );

    /// @notice Emitted when a prover claims rewards
    event RewardClaimed(
        address indexed prover,
        uint256 amount,
        uint256 totalClaimed
    );

    /// @notice Emitted when rewards are added to the pool
    event RewardsAdded(uint256 amount, address indexed from);

    // ============ Errors ============

    error NotAuthorized();
    error ZeroAmount();
    error NoRewardsToClaim();
    error ProverNotRegistered();
    error PeriodNotFinalized();
    error PeriodAlreadyFinalized();
    error InvalidAddress();

    // ============ View Functions ============

    /// @notice QS Token address
    function qsToken() external view returns (address);

    /// @notice Current distribution period ID
    function currentPeriodId() external view returns (uint256);

    /// @notice Period duration in seconds (default: 1 day)
    function periodDuration() external view returns (uint256);

    /// @notice Get prover reward data
    function getProverReward(address prover) external view returns (ProverReward memory);

    /// @notice Get distribution period data
    function getPeriod(uint256 periodId) external view returns (DistributionPeriod memory);

    /// @notice Get pending rewards for a prover
    function pendingRewards(address prover) external view returns (uint256);

    /// @notice Total rewards distributed through this pool
    function totalDistributed() external view returns (uint256);

    /// @notice Minimum claimable amount (gas efficiency)
    function minClaimAmount() external view returns (uint256);

    // ============ State-Changing Functions ============

    /// @notice Record signatures for a prover (called by L3 system)
    /// @param prover Prover address
    /// @param count Number of signatures processed
    function recordSignatures(address prover, uint256 count) external;

    /// @notice Finalize current period and calculate rewards
    function finalizePeriod() external;

    /// @notice Claim pending rewards
    /// @return amount Amount claimed
    function claimReward() external returns (uint256 amount);

    /// @notice Add QS rewards to pool (called by RewardRouter)
    /// @param amount Amount of QS to add
    function addRewards(uint256 amount) external;

    // ============ Admin Functions ============

    /// @notice Register a new prover
    function registerProver(address prover) external;

    /// @notice Deregister a prover
    function deregisterProver(address prover) external;

    /// @notice Emergency withdrawal (admin only)
    function emergencyWithdraw(address to, uint256 amount) external;
}
