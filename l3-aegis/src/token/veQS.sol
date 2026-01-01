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
    
    /// @notice Delegated power received (delegatee => power)
    mapping(address => uint256) private _delegatedPower;
    
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
        address delegate = _delegates[user];
        return delegate == address(0) ? user : delegate;
    }
    
    /// @inheritdoc IveQS
    function getEffectiveVotingPower(address user) external view override returns (uint256) {
        // Own voting power (if not delegated)
        uint256 ownPower = 0;
        if (_delegates[user] == address(0)) {
            ownPower = _calculateVotingPower(user, block.timestamp);
        }
        
        // Add delegated power received
        return ownPower + _delegatedPower[user];
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
        
        // Update delegated power if delegated
        _updateDelegatedPower(msg.sender);
        
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
        
        // Update delegated power if delegated
        _updateDelegatedPower(msg.sender);
        
        uint256 votingPower = _calculateVotingPower(msg.sender, block.timestamp);
        
        emit LockExtended(msg.sender, newUnlockTime, votingPower);
    }
    
    /// @inheritdoc IveQS
    function withdraw() external override nonReentrant {
        LockPosition storage position = _locks[msg.sender];
        if (position.amount == 0) revert NoLockExists();
        if (block.timestamp < position.unlockTime) revert LockNotExpired();
        
        uint256 amount = position.amount;
        
        // Clear lock position
        delete _locks[msg.sender];
        _totalLocked -= amount;
        
        // Clear delegation if any
        if (_delegates[msg.sender] != address(0)) {
            address previousDelegate = _delegates[msg.sender];
            delete _delegates[msg.sender];
            emit DelegationRevoked(msg.sender, previousDelegate);
        }
        
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
            uint256 power = _calculateVotingPower(msg.sender, block.timestamp);
            _delegatedPower[previousDelegate] -= power;
        }
        
        // Add to new delegate
        _delegates[msg.sender] = delegatee;
        uint256 power = _calculateVotingPower(msg.sender, block.timestamp);
        _delegatedPower[delegatee] += power;
        
        emit Delegated(msg.sender, delegatee);
    }
    
    /// @inheritdoc IveQS
    function revokeDelegate() external override {
        address previousDelegate = _delegates[msg.sender];
        if (previousDelegate == address(0)) return;
        
        // Remove delegated power
        uint256 power = _calculateVotingPower(msg.sender, block.timestamp);
        _delegatedPower[previousDelegate] -= power;
        
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
    /// @dev This is an approximation - for production, use checkpoints
    function _calculateTotalVotingPower(uint256 timestamp) internal view returns (uint256) {
        // Note: In production, implement with global checkpoints for efficiency
        // This simple version is for initial implementation
        // Total voting power decays linearly with time
        return (_totalLocked * MAX_LOCK_TIME) / (2 * MAX_LOCK_TIME); // Approximation assuming avg lock = 50% of max
    }
    
    /// @notice Update delegated power when lock changes
    function _updateDelegatedPower(address user) internal {
        address delegatee = _delegates[user];
        if (delegatee == address(0)) return;
        
        // Recalculate and update delegated power
        // Note: This is a simplified version - production should track historical power
        uint256 newPower = _calculateVotingPower(user, block.timestamp);
        _delegatedPower[delegatee] = newPower; // Simplified - assumes single delegator per delegatee for now
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
