// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IVeQSRewardDistributor} from "../interfaces/IVeQSRewardDistributor.sol";
import {IveQS} from "../interfaces/IveQS.sol";

/// @title VeQSRewardDistributor
/// @notice Distributes rewards to veQS holders proportional to voting power
/// @dev Per UNIFIED_SPEC_v2.0.md §Token Design - Staking報酬配分
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md TOKEN-006
contract VeQSRewardDistributor is IVeQSRewardDistributor {
    // ============ Constants ============
    
    /// @notice Precision for calculations
    uint256 private constant PRECISION = 1e18;
    
    /// @notice ReentrancyGuard: not entered state
    uint256 private constant NOT_ENTERED = 1;
    
    /// @notice ReentrancyGuard: entered state
    uint256 private constant ENTERED = 2;
    
    // ============ Immutable ============
    
    /// @notice veQS contract address
    address public immutable override veQS;
    
    /// @notice Reward token address
    address public immutable override rewardToken;
    
    /// @notice Epoch duration in seconds
    uint256 public immutable override epochDuration;
    
    // ============ Storage ============
    
    /// @notice Reentrancy guard status
    uint256 private _status;
    
    /// @notice Admin address
    address private _admin;
    
    /// @notice Current epoch number
    uint256 private _currentEpoch;
    
    /// @notice Epoch data mapping
    mapping(uint256 => Epoch) private _epochs;
    
    /// @notice User claim data mapping
    mapping(address => UserClaim) private _userClaims;
    
    /// @notice User voting power snapshot per epoch
    mapping(uint256 => mapping(address => uint256)) private _userEpochPower;
    
    /// @notice Whether user power was recorded for epoch
    mapping(uint256 => mapping(address => bool)) private _userPowerRecorded;
    
    // ============ Modifiers ============
    
    /// @notice Prevents reentrancy attacks (CP-5 compliance)
    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
    
    /// @notice Only admin modifier
    modifier onlyAdmin() {
        if (msg.sender != _admin) revert NotAuthorized();
        _;
    }
    
    // ============ Constructor ============
    
    /// @notice Initialize VeQSRewardDistributor
    /// @param veQS_ veQS contract address
    /// @param rewardToken_ Reward token address
    /// @param epochDuration_ Epoch duration in seconds
    /// @param admin_ Admin address
    constructor(
        address veQS_,
        address rewardToken_,
        uint256 epochDuration_,
        address admin_
    ) {
        require(veQS_ != address(0), "Invalid veQS");
        require(rewardToken_ != address(0), "Invalid reward token");
        require(epochDuration_ > 0, "Invalid epoch duration");
        require(admin_ != address(0), "Invalid admin");
        
        veQS = veQS_;
        rewardToken = rewardToken_;
        epochDuration = epochDuration_;
        _admin = admin_;
        _status = NOT_ENTERED;
        
        // Initialize first epoch
        _epochs[0] = Epoch({
            startTime: block.timestamp,
            endTime: block.timestamp + epochDuration_,
            totalRewards: 0,
            totalVotingPower: 0,
            finalized: false
        });
    }
    
    // ============ View Functions ============
    
    /// @inheritdoc IVeQSRewardDistributor
    function currentEpoch() external view override returns (uint256) {
        return _currentEpoch;
    }
    
    /// @inheritdoc IVeQSRewardDistributor
    function getEpoch(uint256 epoch) external view override returns (Epoch memory) {
        return _epochs[epoch];
    }
    
    /// @inheritdoc IVeQSRewardDistributor
    function getUserClaim(address user) external view override returns (UserClaim memory) {
        return _userClaims[user];
    }
    
    /// @inheritdoc IVeQSRewardDistributor
    function pendingRewards(address user) external view override returns (uint256) {
        uint256 total = 0;
        uint256 lastClaimed = _userClaims[user].lastClaimedEpoch;
        
        // Start from the epoch after last claimed (or 0 if never claimed)
        uint256 startEpoch = lastClaimed > 0 ? lastClaimed : 0;
        
        for (uint256 i = startEpoch; i < _currentEpoch; i++) {
            if (_epochs[i].finalized && !_hasClaimedEpoch(user, i)) {
                total += _calculateUserShareInternal(user, i);
            }
        }
        
        return total;
    }
    
    /// @inheritdoc IVeQSRewardDistributor
    function calculateUserShare(address user, uint256 epoch) external view override returns (uint256) {
        return _calculateUserShareInternal(user, epoch);
    }
    
    // ============ State-Changing Functions ============
    
    /// @inheritdoc IVeQSRewardDistributor
    function addRewards(uint256 amount) external override nonReentrant {
        if (amount == 0) revert ZeroAmount();
        
        Epoch storage epoch = _epochs[_currentEpoch];
        if (epoch.finalized) revert EpochAlreadyFinalized();
        
        epoch.totalRewards += amount;
        
        // Transfer reward tokens
        _transferIn(msg.sender, amount);
        
        emit RewardsAdded(_currentEpoch, amount, msg.sender);
    }
    
    /// @inheritdoc IVeQSRewardDistributor
    function finalizeEpoch() external override {
        Epoch storage epoch = _epochs[_currentEpoch];
        
        require(block.timestamp >= epoch.endTime, "Epoch not ended");
        if (epoch.finalized) revert EpochAlreadyFinalized();
        
        // Get total voting power from veQS
        epoch.totalVotingPower = IveQS(veQS).getTotalVotingPower();
        epoch.finalized = true;
        
        emit EpochFinalized(_currentEpoch, epoch.totalRewards, epoch.totalVotingPower);
        
        // Start new epoch
        _currentEpoch++;
        _epochs[_currentEpoch] = Epoch({
            startTime: block.timestamp,
            endTime: block.timestamp + epochDuration,
            totalRewards: 0,
            totalVotingPower: 0,
            finalized: false
        });
    }
    
    /// @inheritdoc IVeQSRewardDistributor
    function claim() external override nonReentrant returns (uint256) {
        uint256 total = 0;
        
        for (uint256 i = 0; i < _currentEpoch; i++) {
            if (_epochs[i].finalized && !_hasClaimedEpoch(msg.sender, i)) {
                uint256 share = _calculateUserShareInternal(msg.sender, i);
                if (share > 0) {
                    total += share;
                    _markEpochClaimed(msg.sender, i);
                    emit RewardsClaimed(msg.sender, i, share);
                }
            }
        }
        
        if (total == 0) revert NoRewardsToClaim();
        
        _userClaims[msg.sender].lastClaimedEpoch = _currentEpoch;
        _userClaims[msg.sender].totalClaimed += total;
        
        // Transfer rewards
        _transferOut(msg.sender, total);
        
        return total;
    }
    
    /// @inheritdoc IVeQSRewardDistributor
    function claimForEpochs(uint256[] calldata epochs) external override nonReentrant returns (uint256) {
        uint256 total = 0;
        
        for (uint256 i = 0; i < epochs.length; i++) {
            uint256 epoch = epochs[i];
            if (epoch >= _currentEpoch) revert InvalidEpoch();
            if (!_epochs[epoch].finalized) revert EpochNotFinalized();
            if (_hasClaimedEpoch(msg.sender, epoch)) revert AlreadyClaimed();
            
            uint256 share = _calculateUserShareInternal(msg.sender, epoch);
            if (share > 0) {
                total += share;
                _markEpochClaimed(msg.sender, epoch);
                emit RewardsClaimed(msg.sender, epoch, share);
            }
        }
        
        if (total == 0) revert NoRewardsToClaim();
        
        _userClaims[msg.sender].totalClaimed += total;
        
        // Transfer rewards
        _transferOut(msg.sender, total);
        
        return total;
    }
    
    /// @inheritdoc IVeQSRewardDistributor
    function emergencyWithdraw(address to, uint256 amount) external override onlyAdmin {
        _transferOut(to, amount);
        emit EmergencyWithdrawal(to, amount);
    }
    
    // ============ Internal Functions ============
    
    /// @notice Calculate user's share for a specific epoch
    function _calculateUserShareInternal(address user, uint256 epoch) internal view returns (uint256) {
        Epoch storage epochData = _epochs[epoch];
        
        if (!epochData.finalized) return 0;
        if (epochData.totalVotingPower == 0) return 0;
        if (epochData.totalRewards == 0) return 0;
        
        // Get user's voting power at epoch end time
        uint256 userPower = IveQS(veQS).getVotingPowerAt(user, epochData.endTime);
        
        if (userPower == 0) return 0;
        
        // Calculate share: (userPower / totalPower) * totalRewards
        return (userPower * epochData.totalRewards) / epochData.totalVotingPower;
    }
    
    /// @notice Check if user has claimed for epoch
    function _hasClaimedEpoch(address user, uint256 epoch) internal view returns (bool) {
        // Simple approach: check if lastClaimedEpoch is past this epoch
        // For more precise tracking, use a bitmap
        return _userClaims[user].lastClaimedEpoch > epoch;
    }
    
    /// @notice Mark epoch as claimed for user
    function _markEpochClaimed(address user, uint256 epoch) internal {
        // Simple approach - in production, use a bitmap for gas efficiency
        // This is handled by updating lastClaimedEpoch in claim()
    }
    
    /// @notice Transfer reward tokens in
    function _transferIn(address from, uint256 amount) internal {
        (bool success, bytes memory data) = rewardToken.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, address(this), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
    
    /// @notice Transfer reward tokens out
    function _transferOut(address to, uint256 amount) internal {
        (bool success, bytes memory data) = rewardToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
}
