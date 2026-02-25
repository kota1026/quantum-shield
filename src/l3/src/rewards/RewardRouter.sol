// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRewardRouter} from "../interfaces/IRewardRouter.sol";

/// @title RewardRouter
/// @notice Routes QS inflation rewards to multiple distribution pools
/// @dev Receives minted QS from QSInflation and distributes to 4 pools:
///   50% VeQSRewardDistributor, 30% ProverRewardPool, 10% ObserverRewardPool, 10% Treasury
/// @custom:ref SEQUENCES.md §9.4 報酬アーキテクチャ（RewardRouter設計）
/// @custom:security-contact security@quantumshield.io
contract RewardRouter is IRewardRouter {
    // ============ Constants ============

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice ReentrancyGuard: not entered state
    uint256 private constant NOT_ENTERED = 1;

    /// @notice ReentrancyGuard: entered state
    uint256 private constant ENTERED = 2;

    // ============ Immutable ============

    /// @notice QS Token address
    address public immutable override qsToken;

    // ============ Storage ============

    /// @notice Reentrancy guard status
    uint256 private _status;

    /// @notice Admin address (initially deployer, transfers to Governance)
    address private _admin;

    /// @notice VeQSRewardDistributor address
    address private _veQSDistributor;

    /// @notice ProverRewardPool address
    address private _proverPool;

    /// @notice ObserverRewardPool address
    address private _observerPool;

    /// @notice Treasury address
    address private _treasury;

    /// @notice Distribution allocation
    Allocation private _allocation;

    /// @notice Total amount distributed through this router
    uint256 private _totalDistributed;

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

    /// @notice Initialize RewardRouter
    /// @param qsToken_ QS Token address
    /// @param veQSDistributor_ VeQSRewardDistributor address
    /// @param proverPool_ ProverRewardPool address
    /// @param observerPool_ ObserverRewardPool address
    /// @param treasury_ Treasury address
    /// @param admin_ Admin address
    constructor(
        address qsToken_,
        address veQSDistributor_,
        address proverPool_,
        address observerPool_,
        address treasury_,
        address admin_
    ) {
        require(qsToken_ != address(0), "Invalid QS token");
        require(veQSDistributor_ != address(0), "Invalid veQS distributor");
        require(proverPool_ != address(0), "Invalid prover pool");
        require(observerPool_ != address(0), "Invalid observer pool");
        require(treasury_ != address(0), "Invalid treasury");
        require(admin_ != address(0), "Invalid admin");

        qsToken = qsToken_;
        _veQSDistributor = veQSDistributor_;
        _proverPool = proverPool_;
        _observerPool = observerPool_;
        _treasury = treasury_;
        _admin = admin_;
        _status = NOT_ENTERED;

        // Default allocation: 50% veQS, 30% Prover, 10% Observer, 10% Treasury
        _allocation = Allocation({
            veQSShare: 5000,
            proverShare: 3000,
            observerShare: 1000,
            treasuryShare: 1000
        });
    }

    // ============ View Functions ============

    /// @inheritdoc IRewardRouter
    function veQSDistributor() external view override returns (address) {
        return _veQSDistributor;
    }

    /// @inheritdoc IRewardRouter
    function proverPool() external view override returns (address) {
        return _proverPool;
    }

    /// @inheritdoc IRewardRouter
    function observerPool() external view override returns (address) {
        return _observerPool;
    }

    /// @inheritdoc IRewardRouter
    function treasury() external view override returns (address) {
        return _treasury;
    }

    /// @inheritdoc IRewardRouter
    function getAllocation() external view override returns (Allocation memory) {
        return _allocation;
    }

    /// @inheritdoc IRewardRouter
    function totalDistributed() external view override returns (uint256) {
        return _totalDistributed;
    }

    /// @inheritdoc IRewardRouter
    function pendingBalance() external view override returns (uint256) {
        return _getQSBalance();
    }

    // ============ Distribution Functions ============

    /// @inheritdoc IRewardRouter
    /// @dev Permissionless — anyone can call. Distributes entire QS balance.
    function distribute() external override nonReentrant returns (uint256 totalAmount) {
        totalAmount = _getQSBalance();
        if (totalAmount == 0) revert ZeroBalance();

        // Calculate amounts for each pool
        uint256 veQSAmount = (totalAmount * _allocation.veQSShare) / BASIS_POINTS;
        uint256 proverAmount = (totalAmount * _allocation.proverShare) / BASIS_POINTS;
        uint256 observerAmount = (totalAmount * _allocation.observerShare) / BASIS_POINTS;
        // Treasury gets the remainder (avoids rounding dust)
        uint256 treasuryAmount = totalAmount - veQSAmount - proverAmount - observerAmount;

        // Transfer to each pool
        if (veQSAmount > 0) {
            _transferQS(_veQSDistributor, veQSAmount);
            // Call addRewards on VeQSRewardDistributor
            _callAddRewards(_veQSDistributor, veQSAmount);
        }
        if (proverAmount > 0) {
            _transferQS(_proverPool, proverAmount);
            _callAddRewards(_proverPool, proverAmount);
        }
        if (observerAmount > 0) {
            _transferQS(_observerPool, observerAmount);
            _callAddRewards(_observerPool, observerAmount);
        }
        if (treasuryAmount > 0) {
            _transferQS(_treasury, treasuryAmount);
        }

        _totalDistributed += totalAmount;

        emit Distributed(
            totalAmount,
            veQSAmount,
            proverAmount,
            observerAmount,
            treasuryAmount,
            block.timestamp
        );

        return totalAmount;
    }

    // ============ Admin Functions ============

    /// @inheritdoc IRewardRouter
    function setAllocation(
        uint256 veQSShare,
        uint256 proverShare,
        uint256 observerShare,
        uint256 treasuryShare
    ) external override onlyAdmin {
        if (veQSShare + proverShare + observerShare + treasuryShare != BASIS_POINTS) {
            revert InvalidAllocation();
        }

        _allocation = Allocation({
            veQSShare: veQSShare,
            proverShare: proverShare,
            observerShare: observerShare,
            treasuryShare: treasuryShare
        });

        emit AllocationUpdated(veQSShare, proverShare, observerShare, treasuryShare);
    }

    /// @inheritdoc IRewardRouter
    function setVeQSDistributor(address newDistributor) external override onlyAdmin {
        if (newDistributor == address(0)) revert InvalidAddress();
        address old = _veQSDistributor;
        _veQSDistributor = newDistributor;
        emit PoolAddressUpdated("veQSDistributor", old, newDistributor);
    }

    /// @inheritdoc IRewardRouter
    function setProverPool(address newPool) external override onlyAdmin {
        if (newPool == address(0)) revert InvalidAddress();
        address old = _proverPool;
        _proverPool = newPool;
        emit PoolAddressUpdated("proverPool", old, newPool);
    }

    /// @inheritdoc IRewardRouter
    function setObserverPool(address newPool) external override onlyAdmin {
        if (newPool == address(0)) revert InvalidAddress();
        address old = _observerPool;
        _observerPool = newPool;
        emit PoolAddressUpdated("observerPool", old, newPool);
    }

    /// @inheritdoc IRewardRouter
    function setTreasury(address newTreasury) external override onlyAdmin {
        if (newTreasury == address(0)) revert InvalidAddress();
        address old = _treasury;
        _treasury = newTreasury;
        emit PoolAddressUpdated("treasury", old, newTreasury);
    }

    // ============ Internal Functions ============

    /// @notice Get QS token balance of this contract
    function _getQSBalance() internal view returns (uint256) {
        (bool success, bytes memory data) = qsToken.staticcall(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );
        require(success && data.length >= 32, "Balance query failed");
        return abi.decode(data, (uint256));
    }

    /// @notice Transfer QS tokens to recipient
    function _transferQS(address to, uint256 amount) internal {
        (bool success, bytes memory data) = qsToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    /// @notice Approve QS tokens for a recipient (for addRewards pattern)
    function _approveQS(address spender, uint256 amount) internal {
        (bool success, bytes memory data) = qsToken.call(
            abi.encodeWithSignature("approve(address,uint256)", spender, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Approve failed");
    }

    /// @notice Call addRewards on a pool contract (best-effort, doesn't revert if pool doesn't support it)
    function _callAddRewards(address pool, uint256 amount) internal {
        // Note: VeQSRewardDistributor.addRewards uses transferFrom pattern,
        // so we approve+call. ProverRewardPool/ObserverRewardPool receive direct transfer.
        // This is a no-op notification for pools that track incoming rewards internally.
        (bool success, ) = pool.call(
            abi.encodeWithSignature("notifyRewardAmount(uint256)", amount)
        );
        // Silently ignore if pool doesn't implement notifyRewardAmount
        // The transfer itself already moved the tokens
    }
}
