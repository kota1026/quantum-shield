// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IObserverRewardPool} from "../interfaces/IObserverRewardPool.sol";

/// @title ObserverRewardPool
/// @notice Distributes QS token rewards to Observers for successful challenges
/// @dev Receives QS tokens from:
///   1. RewardRouter (10% of inflation) - base incentive for monitoring
///   2. Slashing penalties (60% of slash → Challenger) - challenge rewards
/// @custom:ref SEQUENCES.md §9.4 Observer Challenge報酬
/// @custom:ref SEQUENCES.md §4 Challenge + Slashing
/// @custom:security-contact security@quantumshield.io
contract ObserverRewardPool is IObserverRewardPool {
    // ============ Constants ============

    /// @notice ReentrancyGuard: not entered state
    uint256 private constant NOT_ENTERED = 1;

    /// @notice ReentrancyGuard: entered state
    uint256 private constant ENTERED = 2;

    /// @notice Slash distribution: 60% to challenger
    uint256 public constant CHALLENGER_SHARE = 6000; // 60% in basis points

    /// @notice Slash distribution: 20% to insurance
    uint256 public constant INSURANCE_SHARE = 2000; // 20% in basis points

    /// @notice Slash distribution: 20% burned
    uint256 public constant BURN_SHARE = 2000; // 20% in basis points

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Burn address
    address public constant BURN_ADDRESS = address(0xdead);

    // ============ Immutable ============

    /// @notice QS Token address
    address public immutable override qsToken;

    /// @notice Insurance fund address
    address public immutable override insuranceFund;

    // ============ Storage ============

    /// @notice Reentrancy guard status
    uint256 private _status;

    /// @notice Admin address
    address private _admin;

    /// @notice Slashing contract address (authorized to record challenge rewards)
    address private _slashingContract;

    /// @notice Total rewards distributed
    uint256 private _totalDistributed;

    /// @notice Observer reward data
    mapping(address => ObserverReward) private _observerRewards;

    /// @notice Challenge reward records
    mapping(uint256 => ChallengeReward) private _challengeRewards;

    /// @notice Registered observers
    mapping(address => bool) private _registeredObservers;

    /// @notice Base reward pool (from RewardRouter inflation)
    uint256 private _baseRewardPool;

    // ============ Modifiers ============

    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }

    modifier onlyAdmin() {
        if (msg.sender != _admin) revert NotAuthorized();
        _;
    }

    modifier onlySlashing() {
        if (msg.sender != _slashingContract) revert NotAuthorized();
        _;
    }

    // ============ Constructor ============

    /// @notice Initialize ObserverRewardPool
    /// @param qsToken_ QS Token address
    /// @param insuranceFund_ Insurance fund address
    /// @param admin_ Admin address
    /// @param slashingContract_ Slashing contract address
    constructor(
        address qsToken_,
        address insuranceFund_,
        address admin_,
        address slashingContract_
    ) {
        require(qsToken_ != address(0), "Invalid QS token");
        require(insuranceFund_ != address(0), "Invalid insurance fund");
        require(admin_ != address(0), "Invalid admin");

        qsToken = qsToken_;
        insuranceFund = insuranceFund_;
        _admin = admin_;
        _slashingContract = slashingContract_;
        _status = NOT_ENTERED;
    }

    // ============ View Functions ============

    /// @inheritdoc IObserverRewardPool
    function getObserverReward(address observer) external view override returns (ObserverReward memory) {
        return _observerRewards[observer];
    }

    /// @inheritdoc IObserverRewardPool
    function getChallengeReward(uint256 challengeId) external view override returns (ChallengeReward memory) {
        return _challengeRewards[challengeId];
    }

    /// @inheritdoc IObserverRewardPool
    function pendingRewards(address observer) external view override returns (uint256) {
        return _observerRewards[observer].pendingRewards;
    }

    /// @inheritdoc IObserverRewardPool
    function totalDistributed() external view override returns (uint256) {
        return _totalDistributed;
    }

    // ============ State-Changing Functions ============

    /// @inheritdoc IObserverRewardPool
    /// @dev Called by Slashing contract when a challenge is confirmed
    /// Distribution: 60% Challenger, 20% Insurance, 20% Burn
    function recordChallengeReward(
        uint256 challengeId,
        address observer,
        address slashedProver,
        uint256 totalSlashAmount
    ) external override onlySlashing nonReentrant {
        if (_challengeRewards[challengeId].rewardAmount != 0) revert ChallengeAlreadyRecorded();
        if (totalSlashAmount == 0) revert ZeroAmount();

        // Calculate distribution
        uint256 challengerReward = (totalSlashAmount * CHALLENGER_SHARE) / BASIS_POINTS;
        uint256 insuranceAmount = (totalSlashAmount * INSURANCE_SHARE) / BASIS_POINTS;
        uint256 burnAmount = totalSlashAmount - challengerReward - insuranceAmount;

        // Record challenge reward
        _challengeRewards[challengeId] = ChallengeReward({
            challengeId: challengeId,
            observer: observer,
            slashedProver: slashedProver,
            rewardAmount: challengerReward,
            timestamp: block.timestamp,
            claimed: false
        });

        // Add to observer's pending rewards
        _observerRewards[observer].pendingRewards += challengerReward;
        _observerRewards[observer].challengeCount++;

        // Transfer to insurance fund
        if (insuranceAmount > 0) {
            _transferQS(insuranceFund, insuranceAmount);
        }

        // Burn
        if (burnAmount > 0) {
            _transferQS(BURN_ADDRESS, burnAmount);
        }

        _totalDistributed += challengerReward;

        emit ChallengeRewardRecorded(challengeId, observer, slashedProver, challengerReward);
        emit SlashRewardsAdded(challengeId, challengerReward, insuranceAmount, burnAmount);
    }

    /// @inheritdoc IObserverRewardPool
    function addRewards(uint256 amount) external override {
        if (amount == 0) revert ZeroAmount();

        _baseRewardPool += amount;

        // Transfer QS tokens from sender
        _transferIn(msg.sender, amount);

        emit BaseRewardsAdded(amount, msg.sender);
    }

    /// @inheritdoc IObserverRewardPool
    function claimReward() external override nonReentrant returns (uint256 amount) {
        if (!_registeredObservers[msg.sender]) revert ObserverNotRegistered();

        amount = _observerRewards[msg.sender].pendingRewards;
        if (amount == 0) revert NoRewardsToClaim();

        _observerRewards[msg.sender].pendingRewards = 0;
        _observerRewards[msg.sender].totalClaimed += amount;
        _observerRewards[msg.sender].lastClaimTime = block.timestamp;

        _transferOut(msg.sender, amount);

        emit RewardClaimed(msg.sender, amount, _observerRewards[msg.sender].totalClaimed);

        return amount;
    }

    // ============ Admin Functions ============

    /// @inheritdoc IObserverRewardPool
    function registerObserver(address observer) external override onlyAdmin {
        if (observer == address(0)) revert InvalidAddress();
        _registeredObservers[observer] = true;
    }

    /// @inheritdoc IObserverRewardPool
    function deregisterObserver(address observer) external override onlyAdmin {
        _registeredObservers[observer] = false;
    }

    /// @inheritdoc IObserverRewardPool
    function emergencyWithdraw(address to, uint256 amount) external override onlyAdmin {
        _transferOut(to, amount);
    }

    /// @notice Update slashing contract address
    function setSlashingContract(address newSlashing) external onlyAdmin {
        if (newSlashing == address(0)) revert InvalidAddress();
        _slashingContract = newSlashing;
    }

    // ============ Internal Functions ============

    /// @notice Transfer QS tokens in (requires approval)
    function _transferIn(address from, uint256 amount) internal {
        (bool success, bytes memory data) = qsToken.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, address(this), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    /// @notice Transfer QS tokens out
    function _transferOut(address to, uint256 amount) internal {
        (bool success, bytes memory data) = qsToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    /// @notice Transfer QS tokens to a specific address
    function _transferQS(address to, uint256 amount) internal {
        (bool success, bytes memory data) = qsToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
}
