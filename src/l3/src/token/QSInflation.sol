// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IQSInflation.sol";
import "../interfaces/IQSToken.sol";

/// @title QSInflation
/// @notice DECEN-016: Inflation mechanism for QS token
/// @dev Implements 4-year decreasing inflation: 5% → 3.75% → 2.5% → 1%
contract QSInflation is IQSInflation {
    // ========== State Variables ==========
    
    /// @notice QS Token contract
    IQSToken public immutable token;
    
    /// @notice Reward distributor address
    address public rewardDistributor;
    
    /// @notice Admin address
    address public immutable admin;
    
    /// @notice Timestamp when contract was deployed
    uint256 public immutable deploymentTimestamp;
    
    /// @notice Last epoch that was minted
    uint256 public lastMintedEpoch;
    
    /// @notice Total minted through inflation
    uint256 public totalInflationMinted;
    
    // ========== Constants ==========
    
    /// @notice Initial inflation rate (5% = 500 basis points)
    uint256 public constant INITIAL_INFLATION_RATE = 500;
    
    /// @notice Final inflation rate (1% = 100 basis points)
    uint256 public constant FINAL_INFLATION_RATE = 100;
    
    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;
    
    /// @notice Duration of reduction period (4 years)
    uint256 public constant REDUCTION_PERIOD = 4 * 365 days;
    
    /// @notice Duration of one epoch (1 year)
    uint256 public constant EPOCH_DURATION = 365 days;
    
    // ========== Constructor ==========
    
    constructor(address _token, address _rewardDistributor) {
        if (_token == address(0)) revert InvalidToken();
        if (_rewardDistributor == address(0)) revert InvalidDistributor();
        
        token = IQSToken(_token);
        rewardDistributor = _rewardDistributor;
        admin = msg.sender;
        deploymentTimestamp = block.timestamp;
    }
    
    // ========== External Functions ==========
    
    /// @inheritdoc IQSInflation
    function mintInflation() external override returns (uint256 amount) {
        if (!canMint()) revert MintingNotAvailable();
        
        uint256 currentEpoch = getCurrentEpochId();
        uint256 totalSupply = token.totalSupply();
        amount = calculateYearlyMint(totalSupply);
        
        lastMintedEpoch = currentEpoch;
        totalInflationMinted += amount;
        
        // Mint to reward distributor
        token.mint(rewardDistributor, amount);
        
        emit InflationMinted(currentEpoch, amount, totalSupply, block.timestamp);
        
        return amount;
    }
    
    /// @inheritdoc IQSInflation
    function setRewardDistributor(address _distributor) external override {
        if (msg.sender != admin) revert NotAuthorized();
        if (_distributor == address(0)) revert InvalidDistributor();
        
        address old = rewardDistributor;
        rewardDistributor = _distributor;
        
        emit RewardDistributorUpdated(old, _distributor);
    }
    
    // ========== View Functions ==========
    
    /// @inheritdoc IQSInflation
    function getCurrentInflationRate() public view override returns (uint256) {
        uint256 elapsed = block.timestamp - deploymentTimestamp;
        
        if (elapsed >= REDUCTION_PERIOD) {
            return FINAL_INFLATION_RATE;
        }
        
        // Calculate which year we're in (1-4)
        uint256 yearIndex = elapsed / EPOCH_DURATION;
        
        // Year-based rates: Year 1 = 5%, Year 2 = 3.75%, Year 3 = 2.5%, Year 4+ = 1%
        if (yearIndex == 0) return 500;  // 5.00%
        if (yearIndex == 1) return 375;  // 3.75%
        if (yearIndex == 2) return 250;  // 2.50%
        return 100;                       // 1.00%
    }
    
    /// @inheritdoc IQSInflation
    function getInflationRateForYear(uint256 year) external pure override returns (uint256) {
        if (year == 0) return 500;  // Invalid year, return year 1
        if (year == 1) return 500;  // 5.00%
        if (year == 2) return 375;  // 3.75%
        if (year == 3) return 250;  // 2.50%
        return 100;                  // 1.00% for year 4+
    }
    
    /// @inheritdoc IQSInflation
    function calculateYearlyMint(uint256 totalSupply) public view override returns (uint256) {
        uint256 rate = getCurrentInflationRate();
        return (totalSupply * rate) / BASIS_POINTS;
    }
    
    /// @inheritdoc IQSInflation
    function canMint() public view override returns (bool) {
        uint256 currentEpoch = getCurrentEpochId();
        return currentEpoch > lastMintedEpoch;
    }
    
    /// @inheritdoc IQSInflation
    function timeUntilNextMint() external view override returns (uint256) {
        if (canMint()) return 0;
        
        uint256 nextEpochStart = deploymentTimestamp + ((lastMintedEpoch + 1) * EPOCH_DURATION);
        if (block.timestamp >= nextEpochStart) return 0;
        
        return nextEpochStart - block.timestamp;
    }
    
    /// @inheritdoc IQSInflation
    function getCurrentEpoch() external view override returns (InflationEpoch memory) {
        uint256 epochId = getCurrentEpochId();
        uint256 rate = getCurrentInflationRate();
        uint256 startTime = deploymentTimestamp + (epochId * EPOCH_DURATION);
        uint256 endTime = startTime + EPOCH_DURATION;
        
        return InflationEpoch({
            epochId: epochId,
            startTime: startTime,
            endTime: endTime,
            inflationRate: rate,
            mintedAmount: epochId == lastMintedEpoch ? totalInflationMinted : 0,
            isMinted: epochId <= lastMintedEpoch
        });
    }
    
    /// @inheritdoc IQSInflation
    function getTotalInflationMinted() external view override returns (uint256) {
        return totalInflationMinted;
    }
    
    // ========== Internal Functions ==========
    
    /// @notice Get current epoch ID (0-indexed)
    function getCurrentEpochId() internal view returns (uint256) {
        uint256 elapsed = block.timestamp - deploymentTimestamp;
        return elapsed / EPOCH_DURATION;
    }
}
