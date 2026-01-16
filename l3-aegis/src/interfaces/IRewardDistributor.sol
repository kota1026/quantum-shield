// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRewardDistributor - Protocol Fee Distribution Interface
/// @notice Manages protocol fee distribution per UNIFIED_SPEC v2.0 Phase 3
/// @dev Distribution: 40% Prover, 30% Treasury, 20% Burn, 10% Insurance
/// @custom:ref UNIFIED_SPEC_v2.0.md §手数料配分（Phase 2-3）
/// @custom:ref PHASE3_STRATEGY.md §手数料配分
/// @custom:security CP-5 compliant (all distributions on-chain verifiable)
interface IRewardDistributor {
    // ============ Structs ============

    struct DistributionShares {
        uint256 proverShare;      // Basis points (4000 = 40%)
        uint256 treasuryShare;    // Basis points (3000 = 30%)
        uint256 burnShare;        // Basis points (2000 = 20%)
        uint256 insuranceShare;   // Basis points (1000 = 10%)
    }

    struct RewardInfo {
        uint256 pendingRewards;
        uint256 totalClaimed;
        uint256 lastClaimTime;
    }

    // ============ Events ============

    event FeesDistributed(
        uint256 totalAmount,
        uint256 proverAmount,
        uint256 treasuryAmount,
        uint256 burnAmount,
        uint256 insuranceAmount
    );

    event RewardsClaimed(
        address indexed claimant,
        uint256 amount,
        uint256 totalClaimed
    );

    event SharesUpdated(
        uint256 proverShare,
        uint256 treasuryShare,
        uint256 burnShare,
        uint256 insuranceShare
    );

    event TokensBurned(
        uint256 amount,
        uint256 totalBurned
    );

    // ============ Errors ============

    error InvalidSharesSum();
    error NoRewardsAvailable();
    error NotAuthorized();
    error NotRegisteredOperator();
    error ZeroAmount();
    error InvalidAddress();

    // ============ View Functions ============

    function PROVER_SHARE() external view returns (uint256);
    function TREASURY_SHARE() external view returns (uint256);
    function BURN_SHARE() external view returns (uint256);
    function INSURANCE_SHARE() external view returns (uint256);
    function BURN_ADDRESS() external view returns (address);
    
    function getShares() external view returns (DistributionShares memory shares);
    function getUnclaimedRewards(address operator) external view returns (uint256 amount);
    function getRewardInfo(address operator) external view returns (RewardInfo memory info);
    function getTotalDistributed() external view returns (uint256 amount);
    function getTotalBurned() external view returns (uint256 amount);
    function getTreasury() external view returns (address treasury);
    function getInsuranceFund() external view returns (address insurance);

    // ============ Distribution Functions ============

    function distribute(uint256 amount) external;
    function claimRewards() external returns (uint256 amount);
    function allocateReward(address operator, uint256 amount) external;

    // ============ Admin Functions ============

    function setShares(
        uint256 proverShare,
        uint256 treasuryShare,
        uint256 burnShare,
        uint256 insuranceShare
    ) external;
    function setTreasury(address newTreasury) external;
    function setInsuranceFund(address newInsurance) external;
}
