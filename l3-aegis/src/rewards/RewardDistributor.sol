// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IRewardDistributor.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IGovernanceSwitch.sol";

/// @title RewardDistributor
/// @notice DECEN-018: Fee and inflation reward distribution
/// @dev Distributes rewards: 40% Prover, 30% Treasury, 20% Burn, 10% Insurance
contract RewardDistributor is IRewardDistributor {
    // ========== State Variables ==========
    
    /// @notice QS Token contract
    IERC20 public immutable token;
    
    /// @notice GovernanceSwitch contract
    IGovernanceSwitch public immutable governanceSwitch;
    
    /// @notice Admin address
    address public immutable admin;
    
    /// @notice Treasury address
    address public treasury;
    
    /// @notice Insurance fund address
    address public insuranceFund;
    
    /// @notice Distribution shares (basis points)
    DistributionShares public shares;
    
    /// @notice Operator rewards
    mapping(address => RewardInfo) internal _rewards;
    
    /// @notice Registered operators
    mapping(address => bool) public isRegisteredOperator;
    
    /// @notice Total burned amount
    uint256 public totalBurned;
    
    /// @notice Total distributed amount
    uint256 public totalDistributed;
    
    // ========== Constants ==========
    
    /// @notice Burn address
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;
    
    /// @notice Initial prover share (40%)
    uint256 public constant INITIAL_PROVER_SHARE = 4000;
    
    /// @notice Initial treasury share (30%)
    uint256 public constant INITIAL_TREASURY_SHARE = 3000;
    
    /// @notice Initial burn share (20%)
    uint256 public constant INITIAL_BURN_SHARE = 2000;
    
    /// @notice Initial insurance share (10%)
    uint256 public constant INITIAL_INSURANCE_SHARE = 1000;
    
    // ========== Constructor ==========
    
    constructor(
        address _token,
        address _governanceSwitch,
        address _treasury,
        address _insuranceFund
    ) {
        if (_token == address(0)) revert InvalidAddress();
        if (_governanceSwitch == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();
        if (_insuranceFund == address(0)) revert InvalidAddress();
        
        token = IERC20(_token);
        governanceSwitch = IGovernanceSwitch(_governanceSwitch);
        treasury = _treasury;
        insuranceFund = _insuranceFund;
        admin = msg.sender;
        
        // Initialize shares
        shares = DistributionShares({
            proverShare: INITIAL_PROVER_SHARE,
            treasuryShare: INITIAL_TREASURY_SHARE,
            burnShare: INITIAL_BURN_SHARE,
            insuranceShare: INITIAL_INSURANCE_SHARE
        });
    }
    
    // ========== External Functions ==========
    
    /// @inheritdoc IRewardDistributor
    function distribute(uint256 amount) external override {
        if (amount == 0) revert InvalidAmount();
        
        // Transfer tokens to this contract first
        bool success = token.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
        
        // Calculate shares
        uint256 proverAmount = (amount * shares.proverShare) / BASIS_POINTS;
        uint256 treasuryAmount = (amount * shares.treasuryShare) / BASIS_POINTS;
        uint256 burnAmount = (amount * shares.burnShare) / BASIS_POINTS;
        uint256 insuranceAmount = amount - proverAmount - treasuryAmount - burnAmount;
        
        // Distribute to treasury
        if (treasuryAmount > 0) {
            success = token.transfer(treasury, treasuryAmount);
            if (!success) revert TransferFailed();
        }
        
        // Burn tokens
        if (burnAmount > 0) {
            success = token.transfer(BURN_ADDRESS, burnAmount);
            if (!success) revert TransferFailed();
            totalBurned += burnAmount;
        }
        
        // Send to insurance fund
        if (insuranceAmount > 0) {
            success = token.transfer(insuranceFund, insuranceAmount);
            if (!success) revert TransferFailed();
        }
        
        // Prover rewards are kept in contract for claiming
        totalDistributed += amount;
        
        emit RewardsDistributed(
            proverAmount,
            treasuryAmount,
            burnAmount,
            insuranceAmount,
            block.timestamp
        );
    }
    
    /// @inheritdoc IRewardDistributor
    function allocateReward(address operator, uint256 amount) external override {
        if (operator == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (msg.sender != admin) revert NotAuthorized();
        
        if (!isRegisteredOperator[operator]) {
            isRegisteredOperator[operator] = true;
            _rewards[operator].operator = operator;
            _rewards[operator].registeredAt = block.timestamp;
        }
        
        _rewards[operator].pendingRewards += amount;
        _rewards[operator].totalEarned += amount;
        
        emit RewardAllocated(operator, amount, block.timestamp);
    }
    
    /// @inheritdoc IRewardDistributor
    function claimRewards() external override returns (uint256 amount) {
        if (!isRegisteredOperator[msg.sender]) revert UnregisteredOperator(msg.sender);
        
        amount = _rewards[msg.sender].pendingRewards;
        if (amount == 0) revert NoRewardsToClaim();
        
        _rewards[msg.sender].pendingRewards = 0;
        _rewards[msg.sender].claimedRewards += amount;
        _rewards[msg.sender].lastClaimedAt = block.timestamp;
        
        bool success = token.transfer(msg.sender, amount);
        if (!success) revert TransferFailed();
        
        emit RewardsClaimed(msg.sender, amount, block.timestamp);
        
        return amount;
    }
    
    /// @inheritdoc IRewardDistributor
    function setShares(
        uint256 proverShare,
        uint256 treasuryShare,
        uint256 burnShare,
        uint256 insuranceShare
    ) external override {
        // Only governance can change shares
        if (msg.sender != admin) revert NotAuthorized();
        
        // Validate total is 100%
        if (proverShare + treasuryShare + burnShare + insuranceShare != BASIS_POINTS) {
            revert InvalidShares(proverShare, treasuryShare, burnShare, insuranceShare);
        }
        
        DistributionShares memory old = shares;
        
        shares = DistributionShares({
            proverShare: proverShare,
            treasuryShare: treasuryShare,
            burnShare: burnShare,
            insuranceShare: insuranceShare
        });
        
        emit SharesUpdated(
            old.proverShare, proverShare,
            old.treasuryShare, treasuryShare,
            old.burnShare, burnShare,
            old.insuranceShare, insuranceShare
        );
    }
    
    /// @inheritdoc IRewardDistributor
    function setTreasury(address _treasury) external override {
        if (msg.sender != admin) revert NotAuthorized();
        if (_treasury == address(0)) revert InvalidAddress();
        
        address old = treasury;
        treasury = _treasury;
        
        emit TreasuryUpdated(old, _treasury);
    }
    
    /// @inheritdoc IRewardDistributor
    function setInsuranceFund(address _insuranceFund) external override {
        if (msg.sender != admin) revert NotAuthorized();
        if (_insuranceFund == address(0)) revert InvalidAddress();
        
        address old = insuranceFund;
        insuranceFund = _insuranceFund;
        
        emit InsuranceFundUpdated(old, _insuranceFund);
    }
    
    // ========== View Functions ==========
    
    /// @inheritdoc IRewardDistributor
    function getShares() external view override returns (DistributionShares memory) {
        return shares;
    }
    
    /// @inheritdoc IRewardDistributor
    function getRewardInfo(address operator) external view override returns (RewardInfo memory) {
        return _rewards[operator];
    }
    
    /// @inheritdoc IRewardDistributor
    function getTotalBurned() external view override returns (uint256) {
        return totalBurned;
    }
    
    /// @inheritdoc IRewardDistributor
    function getTotalDistributed() external view override returns (uint256) {
        return totalDistributed;
    }
    
    /// @inheritdoc IRewardDistributor
    function getPendingRewards(address operator) external view override returns (uint256) {
        return _rewards[operator].pendingRewards;
    }
}
