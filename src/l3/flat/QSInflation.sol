// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// src/interfaces/IERC20.sol

/// @title IERC20
/// @notice Standard ERC20 interface
interface IERC20 {
    /// @notice Returns the total token supply
    function totalSupply() external view returns (uint256);
    
    /// @notice Returns the token balance of an account
    function balanceOf(address account) external view returns (uint256);
    
    /// @notice Transfers tokens to a recipient
    function transfer(address to, uint256 amount) external returns (bool);
    
    /// @notice Returns the remaining allowance for a spender
    function allowance(address owner, address spender) external view returns (uint256);
    
    /// @notice Approves a spender to spend tokens
    function approve(address spender, uint256 amount) external returns (bool);
    
    /// @notice Transfers tokens from one address to another
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    /// @notice Emitted when tokens are transferred
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    /// @notice Emitted when an allowance is set
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// src/interfaces/IQSInflation.sol

/// @title IQSInflation - Inflation Mechanism Interface
/// @notice Manages QS token inflation schedule per UNIFIED_SPEC v2.0
/// @dev Inflation schedule: 5% Year1 → 3.75% Year2 → 2.5% Year3 → 1% Year4+
/// @custom:ref UNIFIED_SPEC_v2.0.md §Token配分
/// @custom:security CP-1 compliant (SHA3-256 for any hashing)
interface IQSInflation {
    // ============ Structs ============

    /// @notice Inflation epoch data
    struct InflationEpoch {
        uint256 epochId;
        uint256 startTime;
        uint256 endTime;
        uint256 inflationRate;    // In basis points (500 = 5%)
        uint256 mintedAmount;
        bool isMinted;
    }

    // ============ Events ============

    /// @notice Emitted when inflation tokens are minted
    event InflationMinted(
        uint256 indexed epochId,
        uint256 amount,
        uint256 totalSupply,
        uint256 timestamp
    );

    /// @notice Emitted when inflation rate transitions
    event InflationRateTransitioned(
        uint256 oldRate,
        uint256 newRate,
        uint256 timestamp
    );

    /// @notice Emitted when reward distributor is updated
    event RewardDistributorUpdated(
        address indexed oldDistributor,
        address indexed newDistributor
    );

    // ============ Errors ============

    error MintingNotAvailable();
    error NotAuthorized();
    error InvalidDistributor();
    error InvalidToken();
    error TokenNotSet();

    // ============ View Functions ============

    function INITIAL_INFLATION_RATE() external view returns (uint256);
    function FINAL_INFLATION_RATE() external view returns (uint256);
    function REDUCTION_PERIOD() external view returns (uint256);
    function getCurrentInflationRate() external view returns (uint256);
    function getInflationRateForYear(uint256 year) external view returns (uint256);
    function calculateYearlyMint(uint256 totalSupply) external view returns (uint256);
    function getCurrentEpoch() external view returns (InflationEpoch memory epoch);
    function timeUntilNextMint() external view returns (uint256);
    function canMint() external view returns (bool available);
    function deploymentTimestamp() external view returns (uint256 timestamp);
    function getTotalInflationMinted() external view returns (uint256);

    // ============ State-Changing Functions ============

    function mintInflation() external returns (uint256 amount);
    function setRewardDistributor(address distributor) external;
}

// src/interfaces/IQSToken.sol

/// @title IQSToken
/// @notice Interface for QS Token with minting capability
interface IQSToken is IERC20 {
    /// @notice Mints new tokens
    /// @param to Recipient address
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external;
    
    /// @notice Burns tokens
    /// @param amount Amount to burn
    function burn(uint256 amount) external;
    
    /// @notice Burns tokens from an account
    /// @param from Account to burn from
    /// @param amount Amount to burn
    function burnFrom(address from, uint256 amount) external;
    
    /// @notice Returns the token name
    function name() external view returns (string memory);
    
    /// @notice Returns the token symbol
    function symbol() external view returns (string memory);
    
    /// @notice Returns the token decimals
    function decimals() external view returns (uint8);
    
    /// @notice Emitted when tokens are minted
    event Minted(address indexed to, uint256 amount);
    
    /// @notice Emitted when tokens are burned
    event Burned(address indexed from, uint256 amount);
}

// src/token/QSInflation.sol

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
