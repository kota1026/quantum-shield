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

// src/interfaces/IRewardDistributor.sol

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

// src/rewards/RewardDistributor.sol

/// @title RewardDistributor
/// @notice DECEN-018: Fee and inflation reward distribution
/// @dev Distributes rewards: 40% Prover, 30% Treasury, 20% Burn, 10% Insurance
contract RewardDistributor is IRewardDistributor {
    // ========== State Variables ==========
    
    /// @notice QS Token contract
    IERC20 public immutable token;
    
    /// @notice Admin address
    address public immutable admin;
    
    /// @notice Operator registry (immutable after deployment)
    address public immutable registry;
    
    /// @notice Treasury address
    address public treasury;
    
    /// @notice Insurance fund address
    address public insuranceFund;
    
    /// @notice Distribution shares (basis points)
    DistributionShares internal _shares;
    
    /// @notice Operator rewards
    mapping(address => RewardInfo) internal _rewards;
    
    /// @notice Total burned amount
    uint256 public totalBurned;
    
    /// @notice Total distributed amount
    uint256 public totalDistributed;
    
    // ========== Constants ==========
    
    /// @notice Burn address
    address public constant override BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;
    
    /// @notice Initial prover share (40%)
    uint256 public constant override PROVER_SHARE = 4000;
    
    /// @notice Initial treasury share (30%)
    uint256 public constant override TREASURY_SHARE = 3000;
    
    /// @notice Initial burn share (20%)
    uint256 public constant override BURN_SHARE = 2000;
    
    /// @notice Initial insurance share (10%)
    uint256 public constant override INSURANCE_SHARE = 1000;
    
    // ========== Constructor ==========
    
    constructor(
        address _token,
        address _treasury,
        address _insuranceFund,
        address _registry
    ) {
        if (_token == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();
        if (_insuranceFund == address(0)) revert InvalidAddress();
        if (_registry == address(0)) revert InvalidAddress();
        
        token = IERC20(_token);
        treasury = _treasury;
        insuranceFund = _insuranceFund;
        registry = _registry;
        admin = msg.sender;
        
        // Initialize shares
        _shares = DistributionShares({
            proverShare: PROVER_SHARE,
            treasuryShare: TREASURY_SHARE,
            burnShare: BURN_SHARE,
            insuranceShare: INSURANCE_SHARE
        });
    }
    
    // ========== External Functions ==========
    
    /// @inheritdoc IRewardDistributor
    function distribute(uint256 amount) external override {
        if (amount == 0) revert ZeroAmount();
        
        // Transfer tokens to this contract first
        bool success = token.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        
        // Calculate shares
        uint256 proverAmount = (amount * _shares.proverShare) / BASIS_POINTS;
        uint256 treasuryAmount = (amount * _shares.treasuryShare) / BASIS_POINTS;
        uint256 burnAmount = (amount * _shares.burnShare) / BASIS_POINTS;
        uint256 insuranceAmount = amount - proverAmount - treasuryAmount - burnAmount;
        
        // Distribute to treasury
        if (treasuryAmount > 0) {
            success = token.transfer(treasury, treasuryAmount);
            require(success, "Treasury transfer failed");
        }
        
        // Burn tokens
        if (burnAmount > 0) {
            success = token.transfer(BURN_ADDRESS, burnAmount);
            require(success, "Burn transfer failed");
            totalBurned += burnAmount;
            emit TokensBurned(burnAmount, totalBurned);
        }
        
        // Send to insurance fund
        if (insuranceAmount > 0) {
            success = token.transfer(insuranceFund, insuranceAmount);
            require(success, "Insurance transfer failed");
        }
        
        // Prover rewards are kept in contract for claiming
        totalDistributed += amount;
        
        emit FeesDistributed(
            amount,
            proverAmount,
            treasuryAmount,
            burnAmount,
            insuranceAmount
        );
    }
    
    /// @inheritdoc IRewardDistributor
    function allocateReward(address operator, uint256 amount) external override {
        if (operator == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();
        if (msg.sender != admin) revert NotAuthorized();
        
        _rewards[operator].pendingRewards += amount;
    }
    
    /// @inheritdoc IRewardDistributor
    function claimRewards() external override returns (uint256 amount) {
        // Check if operator is registered
        if (!_isRegisteredOperator(msg.sender)) revert NotRegisteredOperator();
        
        amount = _rewards[msg.sender].pendingRewards;
        if (amount == 0) revert NoRewardsAvailable();
        
        _rewards[msg.sender].pendingRewards = 0;
        _rewards[msg.sender].totalClaimed += amount;
        _rewards[msg.sender].lastClaimTime = block.timestamp;
        
        bool success = token.transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
        emit RewardsClaimed(msg.sender, amount, _rewards[msg.sender].totalClaimed);
        
        return amount;
    }
    
    /// @inheritdoc IRewardDistributor
    function setShares(
        uint256 proverShare,
        uint256 treasuryShare,
        uint256 burnShare,
        uint256 insuranceShare
    ) external override {
        // Only admin can change shares
        if (msg.sender != admin) revert NotAuthorized();
        
        // Validate total is 100%
        if (proverShare + treasuryShare + burnShare + insuranceShare != BASIS_POINTS) {
            revert InvalidSharesSum();
        }
        
        _shares = DistributionShares({
            proverShare: proverShare,
            treasuryShare: treasuryShare,
            burnShare: burnShare,
            insuranceShare: insuranceShare
        });
        
        emit SharesUpdated(proverShare, treasuryShare, burnShare, insuranceShare);
    }
    
    /// @inheritdoc IRewardDistributor
    function setTreasury(address newTreasury) external override {
        if (msg.sender != admin) revert NotAuthorized();
        if (newTreasury == address(0)) revert InvalidAddress();
        treasury = newTreasury;
    }
    
    /// @inheritdoc IRewardDistributor
    function setInsuranceFund(address newInsurance) external override {
        if (msg.sender != admin) revert NotAuthorized();
        if (newInsurance == address(0)) revert InvalidAddress();
        insuranceFund = newInsurance;
    }
    
    // ========== View Functions ==========
    
    /// @inheritdoc IRewardDistributor
    function getShares() external view override returns (DistributionShares memory) {
        return _shares;
    }
    
    /// @inheritdoc IRewardDistributor
    function getRewardInfo(address operator) external view override returns (RewardInfo memory) {
        return _rewards[operator];
    }
    
    /// @inheritdoc IRewardDistributor
    function getUnclaimedRewards(address operator) external view override returns (uint256) {
        return _rewards[operator].pendingRewards;
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
    function getTreasury() external view override returns (address) {
        return treasury;
    }
    
    /// @inheritdoc IRewardDistributor
    function getInsuranceFund() external view override returns (address) {
        return insuranceFund;
    }
    
    // ========== Internal Functions ==========
    
    /// @notice Check if operator is registered (prover or sequencer)
    function _isRegisteredOperator(address operator) internal view returns (bool) {
        // Call registry to check if active prover or sequencer
        (bool success1, bytes memory data1) = registry.staticcall(
            abi.encodeWithSignature("isActiveProver(address)", operator)
        );
        if (success1 && abi.decode(data1, (bool))) return true;
        
        (bool success2, bytes memory data2) = registry.staticcall(
            abi.encodeWithSignature("isActiveSequencer(address)", operator)
        );
        if (success2 && abi.decode(data2, (bool))) return true;
        
        return false;
    }
}
