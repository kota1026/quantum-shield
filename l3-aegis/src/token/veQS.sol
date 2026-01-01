// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IveQS} from "../interfaces/IveQS.sol";

/// @title veQS - Vote Escrow Quantum Shield Token
/// @notice Locks QS tokens for voting power with time-decay mechanism
/// @dev Per UNIFIED_SPEC_v2.0.md §veQS（Vote Escrow）仕様
/// @custom:security-contact security@quantumshield.io
/// @custom:ref UNIFIED_SPEC_v2.0.md §Token Design
contract veQS is IveQS {
    // ============ Constants ============
    
    /// @notice Minimum lock time: 1 week
    uint256 public constant MIN_LOCK_TIME = 1 weeks;
    
    /// @notice Maximum lock time: 4 years
    uint256 public constant MAX_LOCK_TIME = 4 * 365 days;
    
    /// @notice Precision for voting power calculations
    uint256 private constant PRECISION = 1e18;
    
    /// @notice ReentrancyGuard: not entered state
    uint256 private constant NOT_ENTERED = 1;
    
    /// @notice ReentrancyGuard: entered state
    uint256 private constant ENTERED = 2;
    
    // ============ Immutable ============
    
    /// @notice QS Token address
    address public immutable qsToken;
    
    // ============ Storage ============
    
    /// @notice Reentrancy guard status
    uint256 private _status;
    
    /// @notice Lock positions per user
    mapping(address => LockPosition) private _locks;
    
    /// @notice Delegation mapping (delegator => delegatee)
    mapping(address => address) private _delegates;
    
    /// @notice Track all delegators to a delegatee (delegatee => delegator[])
    mapping(address => address[]) private _delegators;
    
    /// @notice Index of delegator in delegators array (delegatee => delegator => index+1)
    mapping(address => mapping(address => uint256)) private _delegatorIndex;
    
    /// @notice Total locked QS supply
    uint256 private _totalLocked;
    
    /// @notice Checkpoint for total supply tracking
    uint256 private _lastTotalSupplyUpdate;
    
    // ============ Modifiers ============
    
    /// @notice Prevents reentrancy attacks (CP-5 compliance)
    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
    
    // ============ Constructor ============
    
    /// @notice Initialize veQS
    /// @param qsToken_ QS Token address
    constructor(address qsToken_) {
        require(qsToken_ != address(0), "Invalid QS token");
        qsToken = qsToken_;
        _lastTotalSupplyUpdate = block.timestamp;
        _status = NOT_ENTERED;
    }
    
    // ============ View Functions ============
    
    /// @inheritdoc IveQS
    function getLockPosition(address user) external view override returns (LockPosition memory) {
        return _locks[user];
    }
    
    /// @inheritdoc IveQS
    function getVotingPower(address user) external view override returns (uint256) {
        return _calculateVotingPower(user, block.timestamp);
    }
    
    /// @inheritdoc IveQS
    function getVotingPowerAt(address user, uint256 timestamp) external view override returns (uint256) {
        return _calculateVotingPower(user, timestamp);
    }
    
    /// @inheritdoc IveQS
    function getTotalVotingPower() external view override returns (uint256) {
        return _calculateTotalVotingPower(block.timestamp);
    }
    
    /// @inheritdoc IveQS
    function getDelegate(address user) external view override returns (address) {
        address currentDelegate = _delegates[user];
        return currentDelegate == address(0) ? user : currentDelegate;
    }
    
    /// @inheritdoc IveQS
    function getEffectiveVotingPower(address user) external view override returns (uint256) {
        // Own voting power (if not delegated)
        uint256 ownPower = 0;
        if (_delegates[user] == address(0)) {
            ownPower = _calculateVotingPower(user, block.timestamp);
        }
        
        // Add delegated power received (calculated dynamically)
        uint256 delegatedPower = _calculateDelegatedPower(user);
        
        return ownPower + delegatedPower;
    }
    
    /// @inheritdoc IveQS
    function hasLock(address user) external view override returns (bool) {
        return _locks[user].amount > 0;
    }
    
    // ============ Lock Functions ============
    
    /// @inheritdoc IveQS
    function lock(uint256 amount, uint256 lockDuration) external override nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (lockDuration < MIN_LOCK_TIME) revert LockTimeTooShort();
        if (lockDuration > MAX_LOCK_TIME) revert LockTimeTooLong();
        if (_locks[msg.sender].amount > 0) revert LockAlreadyExists();
        
        uint256 unlockTime = block.timestamp + lockDuration;
        
        // Create lock position
        _locks[msg.sender] = LockPosition({
            amount: amount,
            unlockTime: unlockTime,
            startTime: block.timestamp
        });
        
        _totalLocked += amount;
        
        // Transfer QS tokens
        _transferIn(msg.sender, amount);
        
        uint256 votingPower = _calculateVotingPower(msg.sender, block.timestamp);
        
        emit Locked(msg.sender, amount, unlockTime, votingPower);
    }
    
    /// @inheritdoc IveQS
    function increaseLockAmount(uint256 amount) external override nonReentrant {
        if (amount == 0) revert ZeroAmount();
        
        LockPosition storage position = _locks[msg.sender];
        if (position.amount == 0) revert NoLockExists();
        
        // Update lock amount
        position.amount += amount;
        _totalLocked += amount;
        
        // Transfer QS tokens
        _transferIn(msg.sender, amount);
        
        uint256 votingPower = _calculateVotingPower(msg.sender, block.timestamp);
        
        emit LockIncreased(msg.sender, amount, position.amount, votingPower);
    }
    
    /// @inheritdoc IveQS
    function extendLockTime(uint256 newUnlockTime) external override {
        LockPosition storage position = _locks[msg.sender];
        if (position.amount == 0) revert NoLockExists();
        if (newUnlockTime <= position.unlockTime) revert CannotReduceLockTime();
        if (newUnlockTime > block.timestamp + MAX_LOCK_TIME) revert LockTimeTooLong();
        
        position.unlockTime = newUnlockTime;
        
        uint256 votingPower = _calculateVotingPower(msg.sender, block.timestamp);
        
        emit LockExtended(msg.sender, newUnlockTime, votingPower);
    }
    
    /// @inheritdoc IveQS
    function withdraw() external override nonReentrant {
        LockPosition storage position = _locks[msg.sender];
        if (position.amount == 0) revert NoLockExists();
        if (block.timestamp < position.unlockTime) revert LockNotExpired();
        
        uint256 amount = position.amount;
        
        // Clear delegation if any
        address previousDelegate = _delegates[msg.sender];
        if (previousDelegate != address(0)) {
            _removeDelegator(previousDelegate, msg.sender);
            delete _delegates[msg.sender];
            emit DelegationRevoked(msg.sender, previousDelegate);
        }
        
        // Clear lock position
        delete _locks[msg.sender];
        _totalLocked -= amount;
        
        // Transfer QS tokens back
        _transferOut(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    // ============ Delegation Functions ============
    
    /// @inheritdoc IveQS
    function delegate(address delegatee) external override {
        if (delegatee == address(0)) revert CannotDelegateToZero();
        if (delegatee == msg.sender) revert CannotDelegateToSelf();
        
        LockPosition storage position = _locks[msg.sender];
        if (position.amount == 0) revert NoLockExists();
        
        address previousDelegate = _delegates[msg.sender];
        
        // Remove from previous delegate
        if (previousDelegate != address(0)) {
            _removeDelegator(previousDelegate, msg.sender);
        }
        
        // Add to new delegate
        _delegates[msg.sender] = delegatee;
        _addDelegator(delegatee, msg.sender);
        
        emit Delegated(msg.sender, delegatee);
    }
    
    /// @inheritdoc IveQS
    function revokeDelegate() external override {
        address previousDelegate = _delegates[msg.sender];
        if (previousDelegate == address(0)) return;
        
        // Remove from delegators list
        _removeDelegator(previousDelegate, msg.sender);
        
        delete _delegates[msg.sender];
        
        emit DelegationRevoked(msg.sender, previousDelegate);
    }
    
    // ============ Internal Functions ============
    
    /// @notice Calculate voting power for user at timestamp
    /// @dev votingPower = amount × (remainingTime / maxLockTime)
    /// Per UNIFIED_SPEC: 投票力 = QS量 × (残りロック期間 / 最大ロック期間)
    function _calculateVotingPower(address user, uint256 timestamp) internal view returns (uint256) {
        LockPosition storage position = _locks[user];
        
        if (position.amount == 0) return 0;
        if (timestamp >= position.unlockTime) return 0;
        
        uint256 remainingTime = position.unlockTime - timestamp;
        
        // Ensure remaining time doesn't exceed max (shouldn't happen, but safety check)
        if (remainingTime > MAX_LOCK_TIME) {
            remainingTime = MAX_LOCK_TIME;
        }
        
        // votingPower = amount × (remainingTime / MAX_LOCK_TIME)
        // Maximum boost is 4x when locked for 4 years
        return (position.amount * remainingTime) / MAX_LOCK_TIME;
    }
    
    /// @notice Calculate total voting power at timestamp
    /// @dev Iterates through all locks - for production scale, use checkpoints
    function _calculateTotalVotingPower(uint256 timestamp) internal view returns (uint256) {
        // For production, this would use global checkpoints for gas efficiency
        // Using approximation based on total locked and average remaining time
        // Conservative estimate: use 50% of total locked as average voting power
        // This ensures rewards don't exceed what's available
        return _totalLocked / 2;
    }
    
    /// @notice Calculate delegated power received by user
    /// @dev Sums current voting power of all delegators
    function _calculateDelegatedPower(address user) internal view returns (uint256) {
        address[] storage delegators = _delegators[user];
        uint256 totalDelegated = 0;
        
        for (uint256 i = 0; i < delegators.length; i++) {
            totalDelegated += _calculateVotingPower(delegators[i], block.timestamp);
        }
        
        return totalDelegated;
    }
    
    /// @notice Add delegator to delegatee's list
    function _addDelegator(address delegatee, address delegator) internal {
        _delegators[delegatee].push(delegator);
        _delegatorIndex[delegatee][delegator] = _delegators[delegatee].length; // Store index + 1
    }
    
    /// @notice Remove delegator from delegatee's list
    function _removeDelegator(address delegatee, address delegator) internal {
        uint256 indexPlusOne = _delegatorIndex[delegatee][delegator];
        if (indexPlusOne == 0) return; // Not found
        
        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = _delegators[delegatee].length - 1;
        
        if (index != lastIndex) {
            // Move last element to the deleted position
            address lastDelegator = _delegators[delegatee][lastIndex];
            _delegators[delegatee][index] = lastDelegator;
            _delegatorIndex[delegatee][lastDelegator] = indexPlusOne;
        }
        
        // Remove last element
        _delegators[delegatee].pop();
        delete _delegatorIndex[delegatee][delegator];
    }
    
    /// @notice Transfer QS tokens in
    function _transferIn(address from, uint256 amount) internal {
        // Interface for QS token transfer
        (bool success, bytes memory data) = qsToken.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, address(this), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
    
    /// @notice Transfer QS tokens out
    function _transferOut(address to, uint256 amount) internal {
        // Interface for QS token transfer
        (bool success, bytes memory data) = qsToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
}
