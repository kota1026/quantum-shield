// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IveQS
/// @notice Interface for Vote Escrow QS Token (veQS)
/// @dev Per UNIFIED_SPEC_v2.0.md §veQS（Vote Escrow）仕様
interface IveQS {
    // ============ Structs ============
    
    /// @notice Lock position data
    struct LockPosition {
        uint256 amount;      // Locked QS amount
        uint256 unlockTime;  // Unlock timestamp
        uint256 startTime;   // Lock start timestamp
    }
    
    // ============ Events ============
    
    /// @notice Emitted when tokens are locked
    event Locked(
        address indexed user,
        uint256 amount,
        uint256 unlockTime,
        uint256 votingPower
    );
    
    /// @notice Emitted when lock is extended
    event LockExtended(
        address indexed user,
        uint256 newUnlockTime,
        uint256 newVotingPower
    );
    
    /// @notice Emitted when more tokens are added to lock
    event LockIncreased(
        address indexed user,
        uint256 addedAmount,
        uint256 totalAmount,
        uint256 newVotingPower
    );
    
    /// @notice Emitted when tokens are withdrawn
    event Withdrawn(
        address indexed user,
        uint256 amount
    );
    
    /// @notice Emitted when voting power is delegated
    event Delegated(
        address indexed delegator,
        address indexed delegatee
    );
    
    /// @notice Emitted when delegation is revoked
    event DelegationRevoked(
        address indexed delegator,
        address indexed previousDelegatee
    );
    
    // ============ Errors ============
    
    /// @notice Lock time too short
    error LockTimeTooShort();
    
    /// @notice Lock time too long
    error LockTimeTooLong();
    
    /// @notice Lock not expired
    error LockNotExpired();
    
    /// @notice No lock exists
    error NoLockExists();
    
    /// @notice Lock exists (when creating new)
    error LockAlreadyExists();
    
    /// @notice Cannot reduce lock time
    error CannotReduceLockTime();
    
    /// @notice Zero amount
    error ZeroAmount();
    
    /// @notice Cannot delegate to self
    error CannotDelegateToSelf();
    
    /// @notice Cannot delegate to zero address
    error CannotDelegateToZero();
    
    // ============ View Functions ============
    
    /// @notice Get lock position for user
    /// @param user User address
    /// @return position Lock position data
    function getLockPosition(address user) external view returns (LockPosition memory position);
    
    /// @notice Get current voting power for user
    /// @param user User address
    /// @return power Voting power (decays linearly)
    function getVotingPower(address user) external view returns (uint256 power);
    
    /// @notice Get voting power at specific timestamp
    /// @param user User address
    /// @param timestamp Target timestamp
    /// @return power Voting power at timestamp
    function getVotingPowerAt(address user, uint256 timestamp) external view returns (uint256 power);
    
    /// @notice Get total voting power across all users
    /// @return power Total voting power
    function getTotalVotingPower() external view returns (uint256 power);
    
    /// @notice Get delegate for user
    /// @param user User address
    /// @return delegatee Delegate address (user if not delegated)
    function getDelegate(address user) external view returns (address delegatee);
    
    /// @notice Get effective voting power (own + delegated)
    /// @param user User address
    /// @return power Effective voting power
    function getEffectiveVotingPower(address user) external view returns (uint256 power);
    
    /// @notice Check if lock exists
    /// @param user User address
    /// @return exists True if lock exists
    function hasLock(address user) external view returns (bool exists);
    
    /// @notice Get underlying QS token address
    /// @return token QS token address
    function qsToken() external view returns (address token);
    
    /// @notice Get minimum lock time
    /// @return time Minimum lock time in seconds
    function MIN_LOCK_TIME() external view returns (uint256 time);
    
    /// @notice Get maximum lock time
    /// @return time Maximum lock time in seconds
    function MAX_LOCK_TIME() external view returns (uint256 time);
    
    // ============ State-Changing Functions ============
    
    /// @notice Create new lock
    /// @param amount Amount of QS to lock
    /// @param lockDuration Lock duration in seconds
    function lock(uint256 amount, uint256 lockDuration) external;
    
    /// @notice Increase locked amount
    /// @param amount Additional amount to lock
    function increaseLockAmount(uint256 amount) external;
    
    /// @notice Extend lock time
    /// @param newUnlockTime New unlock timestamp
    function extendLockTime(uint256 newUnlockTime) external;
    
    /// @notice Withdraw unlocked tokens
    function withdraw() external;
    
    /// @notice Delegate voting power
    /// @param delegatee Address to delegate to
    function delegate(address delegatee) external;
    
    /// @notice Revoke delegation
    function revokeDelegate() external;
}
