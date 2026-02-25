// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IObserverRewardPool - Observer Challenge Reward Pool Interface
/// @notice Distributes QS token rewards to Observers for successful challenges
/// @dev Receives QS tokens from:
///   1. RewardRouter (10% of inflation) - base incentive
///   2. Slashing penalties (60% of slash → Challenger) - challenge rewards
/// @custom:ref SEQUENCES.md §9.4 Observer Challenge報酬
/// @custom:ref SEQUENCES.md §4 Challenge + Slashing
/// @custom:security-contact security@quantumshield.io
interface IObserverRewardPool {
    // ============ Structs ============

    /// @notice Observer reward tracking
    struct ObserverReward {
        uint256 pendingRewards;     // Unclaimed rewards
        uint256 totalClaimed;       // Total claimed amount
        uint256 lastClaimTime;      // Last claim timestamp
        uint256 challengeCount;     // Successful challenges
    }

    /// @notice Challenge reward record
    struct ChallengeReward {
        uint256 challengeId;
        address observer;           // Challenger
        address slashedProver;      // Slashed prover
        uint256 rewardAmount;       // QS reward for challenger
        uint256 timestamp;
        bool claimed;
    }

    // ============ Events ============

    /// @notice Emitted when challenge reward is recorded
    event ChallengeRewardRecorded(
        uint256 indexed challengeId,
        address indexed observer,
        address indexed slashedProver,
        uint256 rewardAmount
    );

    /// @notice Emitted when an observer claims rewards
    event RewardClaimed(
        address indexed observer,
        uint256 amount,
        uint256 totalClaimed
    );

    /// @notice Emitted when base rewards are added from RewardRouter
    event BaseRewardsAdded(uint256 amount, address indexed from);

    /// @notice Emitted when slash rewards are added
    event SlashRewardsAdded(
        uint256 indexed challengeId,
        uint256 challengerReward,
        uint256 insuranceAmount,
        uint256 burnAmount
    );

    // ============ Errors ============

    error NotAuthorized();
    error ZeroAmount();
    error NoRewardsToClaim();
    error ObserverNotRegistered();
    error ChallengeAlreadyRecorded();
    error InvalidAddress();

    // ============ View Functions ============

    /// @notice QS Token address
    function qsToken() external view returns (address);

    /// @notice Insurance fund address
    function insuranceFund() external view returns (address);

    /// @notice Get observer reward data
    function getObserverReward(address observer) external view returns (ObserverReward memory);

    /// @notice Get challenge reward record
    function getChallengeReward(uint256 challengeId) external view returns (ChallengeReward memory);

    /// @notice Get pending rewards for an observer
    function pendingRewards(address observer) external view returns (uint256);

    /// @notice Total rewards distributed through this pool
    function totalDistributed() external view returns (uint256);

    // ============ State-Changing Functions ============

    /// @notice Record a challenge reward (called by Slashing contract)
    /// @param challengeId Challenge ID
    /// @param observer Observer (challenger) address
    /// @param slashedProver Slashed prover address
    /// @param totalSlashAmount Total slashed amount in QS
    /// @dev Distributes: 60% challenger, 20% insurance, 20% burn
    function recordChallengeReward(
        uint256 challengeId,
        address observer,
        address slashedProver,
        uint256 totalSlashAmount
    ) external;

    /// @notice Add base rewards from RewardRouter
    /// @param amount Amount of QS to add
    function addRewards(uint256 amount) external;

    /// @notice Claim pending rewards
    /// @return amount Amount claimed
    function claimReward() external returns (uint256 amount);

    // ============ Admin Functions ============

    /// @notice Register a new observer
    function registerObserver(address observer) external;

    /// @notice Deregister an observer
    function deregisterObserver(address observer) external;

    /// @notice Emergency withdrawal (admin only)
    function emergencyWithdraw(address to, uint256 amount) external;
}
