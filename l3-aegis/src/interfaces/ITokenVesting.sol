// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ITokenVesting
/// @notice Interface for token vesting with cliff and linear release
/// @dev Per UNIFIED_SPEC_v2.0.md §Token Design - Token Distribution
/// @custom:security-contact security@quantumshield.io
interface ITokenVesting {
    // ============ Structs ============
    
    /// @notice Vesting schedule for a beneficiary
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revocable;
        bool revoked;
    }
    
    // ============ Events ============
    
    /// @notice Emitted when a vesting schedule is created
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool revocable
    );
    
    /// @notice Emitted when tokens are claimed
    event TokensClaimed(address indexed beneficiary, uint256 amount);
    
    /// @notice Emitted when a vesting schedule is revoked
    event VestingRevoked(address indexed beneficiary, uint256 unvestedAmount);
    
    // ============ Errors ============
    
    /// @notice Zero address not allowed
    error ZeroAddress();
    
    /// @notice Zero amount not allowed
    error ZeroAmount();
    
    /// @notice Schedule already exists
    error ScheduleAlreadyExists();
    
    /// @notice No schedule exists
    error NoScheduleExists();
    
    /// @notice Nothing to claim
    error NothingToClaim();
    
    /// @notice Schedule not revocable
    error NotRevocable();
    
    /// @notice Already revoked
    error AlreadyRevoked();
    
    /// @notice Cliff not reached
    error CliffNotReached();
    
    /// @notice Caller not authorized
    error NotAuthorized();
    
    /// @notice Invalid vesting parameters
    error InvalidParameters();
    
    // ============ View Functions ============
    
    /// @notice Get token address
    function token() external view returns (address);
    
    /// @notice Get vesting schedule for beneficiary
    /// @param beneficiary Beneficiary address
    function getVestingSchedule(address beneficiary) external view returns (VestingSchedule memory);
    
    /// @notice Calculate vested amount for beneficiary
    /// @param beneficiary Beneficiary address
    function vestedAmount(address beneficiary) external view returns (uint256);
    
    /// @notice Calculate claimable amount for beneficiary
    /// @param beneficiary Beneficiary address
    function claimableAmount(address beneficiary) external view returns (uint256);
    
    /// @notice Check if cliff has passed for beneficiary
    /// @param beneficiary Beneficiary address
    function hasCliffPassed(address beneficiary) external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice Create a vesting schedule
    /// @param beneficiary Beneficiary address
    /// @param totalAmount Total tokens to vest
    /// @param startTime Vesting start time
    /// @param cliffDuration Cliff duration in seconds
    /// @param vestingDuration Total vesting duration in seconds
    /// @param revocable Whether the schedule can be revoked
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool revocable
    ) external;
    
    /// @notice Claim vested tokens
    function claim() external returns (uint256);
    
    /// @notice Revoke a vesting schedule
    /// @param beneficiary Beneficiary address
    function revoke(address beneficiary) external;
}
