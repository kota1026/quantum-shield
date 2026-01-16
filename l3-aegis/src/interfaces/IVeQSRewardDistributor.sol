// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IVeQSRewardDistributor
/// @notice Interface for veQS reward distribution
/// @dev Per UNIFIED_SPEC_v2.0.md §Token Design - Staking報酬配分
/// @custom:security-contact security@quantumshield.io
interface IVeQSRewardDistributor {
    // ============ Structs ============
    
    /// @notice Epoch data for reward distribution
    struct Epoch {
        uint256 startTime;
        uint256 endTime;
        uint256 totalRewards;
        uint256 totalVotingPower;
        bool finalized;
    }
    
    /// @notice User claim data
    struct UserClaim {
        uint256 lastClaimedEpoch;
        uint256 totalClaimed;
    }
    
    // ============ Events ============
    
    /// @notice Emitted when rewards are added to an epoch
    event RewardsAdded(uint256 indexed epoch, uint256 amount, address indexed addedBy);
    
    /// @notice Emitted when an epoch is finalized
    event EpochFinalized(uint256 indexed epoch, uint256 totalRewards, uint256 totalVotingPower);
    
    /// @notice Emitted when a user claims rewards
    event RewardsClaimed(address indexed user, uint256 indexed epoch, uint256 amount);
    
    /// @notice Emitted when emergency withdrawal is executed
    event EmergencyWithdrawal(address indexed to, uint256 amount);
    
    // ============ Errors ============
    
    /// @notice Zero amount not allowed
    error ZeroAmount();
    
    /// @notice Epoch not finalized yet
    error EpochNotFinalized();
    
    /// @notice Epoch already finalized
    error EpochAlreadyFinalized();
    
    /// @notice No rewards to claim
    error NoRewardsToClaim();
    
    /// @notice Invalid epoch
    error InvalidEpoch();
    
    /// @notice Caller not authorized
    error NotAuthorized();
    
    /// @notice Already claimed for this epoch
    error AlreadyClaimed();
    
    // ============ View Functions ============
    
    /// @notice Get veQS contract address
    function veQS() external view returns (address);
    
    /// @notice Get reward token address
    function rewardToken() external view returns (address);
    
    /// @notice Get current epoch number
    function currentEpoch() external view returns (uint256);
    
    /// @notice Get epoch duration
    function epochDuration() external view returns (uint256);
    
    /// @notice Get epoch data
    /// @param epoch Epoch number
    function getEpoch(uint256 epoch) external view returns (Epoch memory);
    
    /// @notice Get user claim data
    /// @param user User address
    function getUserClaim(address user) external view returns (UserClaim memory);
    
    /// @notice Calculate pending rewards for user
    /// @param user User address
    function pendingRewards(address user) external view returns (uint256);
    
    /// @notice Calculate user's share for a specific epoch
    /// @param user User address
    /// @param epoch Epoch number
    function calculateUserShare(address user, uint256 epoch) external view returns (uint256);
    
    // ============ State-Changing Functions ============
    
    /// @notice Add rewards to current epoch
    /// @param amount Amount of reward tokens to add
    function addRewards(uint256 amount) external;
    
    /// @notice Finalize current epoch and start new one
    function finalizeEpoch() external;
    
    /// @notice Claim all pending rewards
    function claim() external returns (uint256);
    
    /// @notice Claim rewards for specific epochs
    /// @param epochs Array of epoch numbers to claim
    function claimForEpochs(uint256[] calldata epochs) external returns (uint256);
    
    /// @notice Emergency withdrawal (admin only)
    /// @param to Recipient address
    /// @param amount Amount to withdraw
    function emergencyWithdraw(address to, uint256 amount) external;
}
