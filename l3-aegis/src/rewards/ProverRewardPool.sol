// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IProverRewardPool} from "../interfaces/IProverRewardPool.sol";

/// @title ProverRewardPool
/// @notice Distributes QS token rewards to active Provers based on signing activity
/// @dev Receives QS tokens from RewardRouter (30% of inflation)
///   Distribution: proportional to each Prover's signature count in the period
/// @custom:ref SEQUENCES.md §9.4 Prover署名報酬メカニズム
/// @custom:security-contact security@quantumshield.io
contract ProverRewardPool is IProverRewardPool {
    // ============ Constants ============

    /// @notice ReentrancyGuard: not entered state
    uint256 private constant NOT_ENTERED = 1;

    /// @notice ReentrancyGuard: entered state
    uint256 private constant ENTERED = 2;

    /// @notice Default minimum claim amount: 1 QS (1e18 wei)
    uint256 private constant DEFAULT_MIN_CLAIM = 1e18;

    // ============ Immutable ============

    /// @notice QS Token address
    address public immutable override qsToken;

    /// @notice Period duration in seconds (default: 1 day)
    uint256 public immutable override periodDuration;

    // ============ Storage ============

    /// @notice Reentrancy guard status
    uint256 private _status;

    /// @notice Admin address
    address private _admin;

    /// @notice RewardRouter address (authorized to add rewards)
    address private _rewardRouter;

    /// @notice Current distribution period ID
    uint256 private _currentPeriodId;

    /// @notice Total rewards distributed
    uint256 private _totalDistributed;

    /// @notice Minimum claim amount
    uint256 private _minClaimAmount;

    /// @notice Prover reward data
    mapping(address => ProverReward) private _proverRewards;

    /// @notice Distribution period data
    mapping(uint256 => DistributionPeriod) private _periods;

    /// @notice Prover signature count per period
    mapping(uint256 => mapping(address => uint256)) private _periodSignatures;

    /// @notice Registered provers
    mapping(address => bool) private _registeredProvers;

    /// @notice List of active provers (for iteration)
    address[] private _activeProvers;

    /// @notice Index of prover in active list (1-indexed, 0 = not in list)
    mapping(address => uint256) private _proverIndex;

    /// @notice Undistributed rewards (accumulated from RewardRouter)
    uint256 private _undistributedRewards;

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

    modifier onlyAdminOrRouter() {
        if (msg.sender != _admin && msg.sender != _rewardRouter) revert NotAuthorized();
        _;
    }

    // ============ Constructor ============

    /// @notice Initialize ProverRewardPool
    /// @param qsToken_ QS Token address
    /// @param periodDuration_ Distribution period duration in seconds
    /// @param admin_ Admin address
    /// @param rewardRouter_ RewardRouter address
    constructor(
        address qsToken_,
        uint256 periodDuration_,
        address admin_,
        address rewardRouter_
    ) {
        require(qsToken_ != address(0), "Invalid QS token");
        require(periodDuration_ > 0, "Invalid period duration");
        require(admin_ != address(0), "Invalid admin");

        qsToken = qsToken_;
        periodDuration = periodDuration_;
        _admin = admin_;
        _rewardRouter = rewardRouter_;
        _status = NOT_ENTERED;
        _minClaimAmount = DEFAULT_MIN_CLAIM;

        // Initialize first period
        _periods[0] = DistributionPeriod({
            periodId: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + periodDuration_,
            totalRewards: 0,
            totalSignatures: 0,
            finalized: false
        });
    }

    // ============ View Functions ============

    /// @inheritdoc IProverRewardPool
    function currentPeriodId() external view override returns (uint256) {
        return _currentPeriodId;
    }

    /// @inheritdoc IProverRewardPool
    function getProverReward(address prover) external view override returns (ProverReward memory) {
        return _proverRewards[prover];
    }

    /// @inheritdoc IProverRewardPool
    function getPeriod(uint256 periodId) external view override returns (DistributionPeriod memory) {
        return _periods[periodId];
    }

    /// @inheritdoc IProverRewardPool
    function pendingRewards(address prover) external view override returns (uint256) {
        return _proverRewards[prover].pendingRewards;
    }

    /// @inheritdoc IProverRewardPool
    function totalDistributed() external view override returns (uint256) {
        return _totalDistributed;
    }

    /// @inheritdoc IProverRewardPool
    function minClaimAmount() external view override returns (uint256) {
        return _minClaimAmount;
    }

    // ============ State-Changing Functions ============

    /// @inheritdoc IProverRewardPool
    function recordSignatures(address prover, uint256 count) external override onlyAdminOrRouter {
        if (!_registeredProvers[prover]) revert ProverNotRegistered();
        if (count == 0) revert ZeroAmount();

        _periodSignatures[_currentPeriodId][prover] += count;
        _periods[_currentPeriodId].totalSignatures += count;
        _proverRewards[prover].signatureCount += count;

        emit SignaturesRecorded(prover, count, _currentPeriodId);
    }

    /// @inheritdoc IProverRewardPool
    function finalizePeriod() external override {
        DistributionPeriod storage period = _periods[_currentPeriodId];

        require(block.timestamp >= period.endTime, "Period not ended");
        if (period.finalized) revert PeriodAlreadyFinalized();

        // Allocate undistributed rewards to this period
        period.totalRewards = _undistributedRewards;
        _undistributedRewards = 0;
        period.finalized = true;

        // Calculate and assign individual prover rewards
        if (period.totalSignatures > 0 && period.totalRewards > 0) {
            for (uint256 i = 0; i < _activeProvers.length; i++) {
                address prover = _activeProvers[i];
                uint256 sigs = _periodSignatures[_currentPeriodId][prover];
                if (sigs > 0) {
                    uint256 reward = (period.totalRewards * sigs) / period.totalSignatures;
                    _proverRewards[prover].pendingRewards += reward;
                    _totalDistributed += reward;
                }
            }
        }

        emit PeriodFinalized(
            _currentPeriodId,
            period.totalRewards,
            period.totalSignatures,
            _activeProvers.length
        );

        // Start new period
        _currentPeriodId++;
        _periods[_currentPeriodId] = DistributionPeriod({
            periodId: _currentPeriodId,
            startTime: block.timestamp,
            endTime: block.timestamp + periodDuration,
            totalRewards: 0,
            totalSignatures: 0,
            finalized: false
        });
    }

    /// @inheritdoc IProverRewardPool
    function claimReward() external override nonReentrant returns (uint256 amount) {
        if (!_registeredProvers[msg.sender]) revert ProverNotRegistered();

        amount = _proverRewards[msg.sender].pendingRewards;
        if (amount == 0) revert NoRewardsToClaim();
        if (amount < _minClaimAmount) revert NoRewardsToClaim();

        _proverRewards[msg.sender].pendingRewards = 0;
        _proverRewards[msg.sender].totalClaimed += amount;
        _proverRewards[msg.sender].lastClaimTime = block.timestamp;

        _transferOut(msg.sender, amount);

        emit RewardClaimed(msg.sender, amount, _proverRewards[msg.sender].totalClaimed);

        return amount;
    }

    /// @inheritdoc IProverRewardPool
    function addRewards(uint256 amount) external override {
        if (amount == 0) revert ZeroAmount();

        _undistributedRewards += amount;

        // Transfer QS tokens from sender
        _transferIn(msg.sender, amount);

        emit RewardsAdded(amount, msg.sender);
    }

    // ============ Admin Functions ============

    /// @inheritdoc IProverRewardPool
    function registerProver(address prover) external override onlyAdmin {
        if (prover == address(0)) revert InvalidAddress();
        if (_registeredProvers[prover]) return; // Already registered

        _registeredProvers[prover] = true;
        _activeProvers.push(prover);
        _proverIndex[prover] = _activeProvers.length; // 1-indexed
    }

    /// @inheritdoc IProverRewardPool
    function deregisterProver(address prover) external override onlyAdmin {
        if (!_registeredProvers[prover]) return; // Not registered

        _registeredProvers[prover] = false;

        // Remove from active provers list (swap and pop)
        uint256 indexPlusOne = _proverIndex[prover];
        if (indexPlusOne > 0) {
            uint256 index = indexPlusOne - 1;
            uint256 lastIndex = _activeProvers.length - 1;

            if (index != lastIndex) {
                address lastProver = _activeProvers[lastIndex];
                _activeProvers[index] = lastProver;
                _proverIndex[lastProver] = indexPlusOne;
            }

            _activeProvers.pop();
            delete _proverIndex[prover];
        }
    }

    /// @inheritdoc IProverRewardPool
    function emergencyWithdraw(address to, uint256 amount) external override onlyAdmin {
        _transferOut(to, amount);
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
}
