// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITokenVesting} from "../interfaces/ITokenVesting.sol";

/// @title TokenVesting
/// @notice Token vesting with cliff and linear release
/// @dev Per UNIFIED_SPEC_v2.0.md §Token Design - Token Distribution
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md TOKEN-008
contract TokenVesting is ITokenVesting {
    // ============ Constants ============
    
    /// @notice ReentrancyGuard: not entered state
    uint256 private constant NOT_ENTERED = 1;
    
    /// @notice ReentrancyGuard: entered state
    uint256 private constant ENTERED = 2;
    
    // ============ Immutable ============
    
    /// @notice Token address
    address public immutable override token;
    
    // ============ Storage ============
    
    /// @notice Reentrancy guard status
    uint256 private _status;
    
    /// @notice Admin address
    address private _admin;
    
    /// @notice Vesting schedules mapping
    mapping(address => VestingSchedule) private _schedules;
    
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
    
    /// @notice Initialize TokenVesting
    /// @param token_ Token address to vest
    /// @param admin_ Admin address
    constructor(address token_, address admin_) {
        if (token_ == address(0)) revert ZeroAddress();
        if (admin_ == address(0)) revert ZeroAddress();
        
        token = token_;
        _admin = admin_;
        _status = NOT_ENTERED;
    }
    
    // ============ View Functions ============
    
    /// @inheritdoc ITokenVesting
    function getVestingSchedule(address beneficiary) external view override returns (VestingSchedule memory) {
        return _schedules[beneficiary];
    }
    
    /// @inheritdoc ITokenVesting
    function vestedAmount(address beneficiary) public view override returns (uint256) {
        VestingSchedule storage schedule = _schedules[beneficiary];
        
        if (schedule.totalAmount == 0) return 0;
        if (schedule.revoked) {
            return schedule.claimedAmount;
        }
        
        return _calculateVestedAmount(schedule);
    }
    
    /// @inheritdoc ITokenVesting
    function claimableAmount(address beneficiary) public view override returns (uint256) {
        VestingSchedule storage schedule = _schedules[beneficiary];
        
        if (schedule.totalAmount == 0) return 0;
        if (schedule.revoked) return 0;
        
        uint256 vested = _calculateVestedAmount(schedule);
        return vested - schedule.claimedAmount;
    }
    
    /// @inheritdoc ITokenVesting
    function hasCliffPassed(address beneficiary) external view override returns (bool) {
        VestingSchedule storage schedule = _schedules[beneficiary];
        
        if (schedule.totalAmount == 0) return false;
        
        return block.timestamp >= schedule.startTime + schedule.cliffDuration;
    }
    
    // ============ State-Changing Functions ============
    
    /// @inheritdoc ITokenVesting
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool revocable
    ) external override onlyAdmin {
        if (beneficiary == address(0)) revert ZeroAddress();
        if (totalAmount == 0) revert ZeroAmount();
        if (vestingDuration == 0) revert InvalidParameters();
        if (cliffDuration > vestingDuration) revert InvalidParameters();
        if (_schedules[beneficiary].totalAmount > 0) revert ScheduleAlreadyExists();
        
        _schedules[beneficiary] = VestingSchedule({
            totalAmount: totalAmount,
            claimedAmount: 0,
            startTime: startTime,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            revocable: revocable,
            revoked: false
        });
        
        // Transfer tokens to this contract
        _transferIn(msg.sender, totalAmount);
        
        emit VestingScheduleCreated(
            beneficiary,
            totalAmount,
            startTime,
            cliffDuration,
            vestingDuration,
            revocable
        );
    }
    
    /// @inheritdoc ITokenVesting
    function claim() external override nonReentrant returns (uint256) {
        VestingSchedule storage schedule = _schedules[msg.sender];
        
        if (schedule.totalAmount == 0) revert NoScheduleExists();
        if (schedule.revoked) revert AlreadyRevoked();
        
        // Check cliff
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            revert CliffNotReached();
        }
        
        uint256 claimable = claimableAmount(msg.sender);
        if (claimable == 0) revert NothingToClaim();
        
        schedule.claimedAmount += claimable;
        
        _transferOut(msg.sender, claimable);
        
        emit TokensClaimed(msg.sender, claimable);
        
        return claimable;
    }
    
    /// @inheritdoc ITokenVesting
    function revoke(address beneficiary) external override onlyAdmin {
        VestingSchedule storage schedule = _schedules[beneficiary];
        
        if (schedule.totalAmount == 0) revert NoScheduleExists();
        if (!schedule.revocable) revert NotRevocable();
        if (schedule.revoked) revert AlreadyRevoked();
        
        // Calculate unvested amount
        uint256 vested = _calculateVestedAmount(schedule);
        uint256 unvested = schedule.totalAmount - vested;
        
        schedule.revoked = true;
        
        // Return unvested tokens to admin
        if (unvested > 0) {
            _transferOut(_admin, unvested);
        }
        
        emit VestingRevoked(beneficiary, unvested);
    }
    
    // ============ Internal Functions ============
    
    /// @notice Calculate vested amount based on schedule
    function _calculateVestedAmount(VestingSchedule storage schedule) internal view returns (uint256) {
        if (block.timestamp < schedule.startTime) {
            return 0;
        }
        
        // Cliff check
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }
        
        uint256 elapsed = block.timestamp - schedule.startTime;
        
        if (elapsed >= schedule.vestingDuration) {
            return schedule.totalAmount;
        }
        
        // Linear vesting
        return (schedule.totalAmount * elapsed) / schedule.vestingDuration;
    }
    
    /// @notice Transfer tokens in
    function _transferIn(address from, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, address(this), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
    
    /// @notice Transfer tokens out
    function _transferOut(address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
}
