// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISequencerHealth.sol";
import "../interfaces/ISequencerStaking.sol";
import "../interfaces/ISequencerRegistry.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SequencerHealth
 * @notice Manages sequencer health monitoring and failover
 * @dev Implements DECEN-015 requirements
 *      - Heartbeat monitoring (30s intervals)
 *      - Auto-rotation after 3 consecutive misses
 *      - Force inclusion guarantee (24h)
 * @custom:security-contact security@quantumshield.io
 */
contract SequencerHealth is ISequencerHealth, AccessControl, ReentrancyGuard {
    // ============================================
    // Constants
    // ============================================
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SEQUENCER_ROLE = keccak256("SEQUENCER_ROLE");
    
    uint256 public constant override HEARTBEAT_INTERVAL = 30 seconds;
    uint256 public constant override MAX_CONSECUTIVE_MISSES = 3;
    uint256 public constant override FORCE_INCLUSION_TIMEOUT = 24 hours;
    uint256 public constant override SUSPENSION_DURATION = 1 hours;
    
    uint256 public constant FORCE_INCLUSION_FEE = 0.01 ether;

    // ============================================
    // State Variables
    // ============================================
    
    ISequencerStaking public stakingContract;
    ISequencerRegistry public registryContract;
    address public rotationContract;
    address public slashingContract;
    
    // Health tracking
    mapping(address => SequencerHealthInfo) private _healthInfo;
    
    // Force inclusion requests
    mapping(bytes32 => ForceInclusionRequest) private _forceInclusions;
    bytes32[] private _pendingForceInclusions;
    
    // Active sequencers list for stats
    address[] private _trackedSequencers;
    mapping(address => bool) private _isTracked;

    // ============================================
    // Constructor
    // ============================================
    
    constructor(
        address _stakingContract,
        address _registryContract,
        address admin
    ) {
        require(_stakingContract != address(0), "Invalid staking");
        require(_registryContract != address(0), "Invalid registry");
        
        stakingContract = ISequencerStaking(_stakingContract);
        registryContract = ISequencerRegistry(_registryContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ============================================
    // Heartbeat Functions
    // ============================================
    
    /// @inheritdoc ISequencerHealth
    function submitHeartbeat() external override {
        require(stakingContract.isEligible(msg.sender), "Not eligible sequencer");
        
        // Track sequencer if new
        if (!_isTracked[msg.sender]) {
            _trackedSequencers.push(msg.sender);
            _isTracked[msg.sender] = true;
        }
        
        SequencerHealthInfo storage info = _healthInfo[msg.sender];
        
        // Reset consecutive misses on successful heartbeat
        info.consecutiveMisses = 0;
        info.lastHeartbeat = block.timestamp;
        
        // Recover if was degraded
        if (info.status == HealthStatus.Degraded) {
            info.status = HealthStatus.Healthy;
        }
        
        emit HeartbeatReceived(msg.sender, block.timestamp);
    }
    
    /// @inheritdoc ISequencerHealth
    function isHeartbeatCurrent(address sequencer) external view override returns (bool) {
        return block.timestamp <= _healthInfo[sequencer].lastHeartbeat + HEARTBEAT_INTERVAL;
    }
    
    /// @inheritdoc ISequencerHealth
    function getLastHeartbeat(address sequencer) external view override returns (uint256) {
        return _healthInfo[sequencer].lastHeartbeat;
    }

    // ============================================
    // Health Check Functions
    // ============================================
    
    /// @inheritdoc ISequencerHealth
    function getHealthStatus(address sequencer) external view override returns (HealthStatus) {
        return _healthInfo[sequencer].status;
    }
    
    /// @inheritdoc ISequencerHealth
    function getHealthInfo(address sequencer) external view override returns (SequencerHealthInfo memory) {
        return _healthInfo[sequencer];
    }
    
    /// @inheritdoc ISequencerHealth
    function getHealthStats() external view override returns (uint256 healthy, uint256 total) {
        total = _trackedSequencers.length;
        healthy = 0;
        
        for (uint256 i = 0; i < _trackedSequencers.length; i++) {
            if (_healthInfo[_trackedSequencers[i]].status == HealthStatus.Healthy) {
                healthy++;
            }
        }
    }

    // ============================================
    // Failover Functions
    // ============================================
    
    /// @inheritdoc ISequencerHealth
    function checkAndRotate() external override {
        // Check all tracked sequencers
        for (uint256 i = 0; i < _trackedSequencers.length; i++) {
            address sequencer = _trackedSequencers[i];
            SequencerHealthInfo storage info = _healthInfo[sequencer];
            
            // Skip if already suspended or inactive
            if (info.status == HealthStatus.Suspended || info.status == HealthStatus.Inactive) {
                continue;
            }
            
            // Check if heartbeat is expired
            if (block.timestamp > info.lastHeartbeat + HEARTBEAT_INTERVAL) {
                info.consecutiveMisses++;
                info.totalMisses++;
                
                emit HeartbeatMissed(sequencer, info.consecutiveMisses);
                
                // Check for auto-rotation threshold
                if (info.consecutiveMisses >= MAX_CONSECUTIVE_MISSES) {
                    _triggerAutoRotation(sequencer);
                } else {
                    info.status = HealthStatus.Degraded;
                }
            }
        }
    }
    
    /// @inheritdoc ISequencerHealth
    function suspendSequencer(address sequencer, string calldata reason) external override onlyRole(ADMIN_ROLE) {
        SequencerHealthInfo storage info = _healthInfo[sequencer];
        info.status = HealthStatus.Suspended;
        info.suspendedUntil = block.timestamp + SUSPENSION_DURATION;
        
        emit SequencerSuspended(sequencer, reason);
    }
    
    /// @inheritdoc ISequencerHealth
    function recoverSequencer(address sequencer) external override {
        SequencerHealthInfo storage info = _healthInfo[sequencer];
        
        // Admin can recover anytime, others must wait
        if (!hasRole(ADMIN_ROLE, msg.sender)) {
            require(
                info.status == HealthStatus.Suspended && 
                block.timestamp >= info.suspendedUntil,
                "Suspension not expired"
            );
        }
        
        // Must be eligible
        require(stakingContract.isEligible(sequencer), "Not eligible");
        
        info.status = HealthStatus.Healthy;
        info.consecutiveMisses = 0;
        info.suspendedUntil = 0;
        info.lastHeartbeat = block.timestamp;
        
        emit SequencerRecovered(sequencer);
    }

    // ============================================
    // Force Inclusion Functions
    // ============================================
    
    /// @inheritdoc ISequencerHealth
    function requestForceInclusion(bytes32 txHash) external payable override nonReentrant {
        require(msg.value >= FORCE_INCLUSION_FEE, "Insufficient fee");
        require(_forceInclusions[txHash].requestTime == 0, "Already requested");
        
        uint256 deadline = block.timestamp + FORCE_INCLUSION_TIMEOUT;
        
        _forceInclusions[txHash] = ForceInclusionRequest({
            txHash: txHash,
            requester: msg.sender,
            requestTime: block.timestamp,
            deadline: deadline,
            executed: false
        });
        
        _pendingForceInclusions.push(txHash);
        
        emit ForceInclusionRequested(txHash, msg.sender, deadline);
    }
    
    /// @inheritdoc ISequencerHealth
    function executeForceInclusion(bytes32 txHash) external override nonReentrant {
        ForceInclusionRequest storage request = _forceInclusions[txHash];
        
        require(request.requestTime > 0, "Request not found");
        require(!request.executed, "Already executed");
        require(block.timestamp >= request.deadline, "Deadline not reached");
        
        request.executed = true;
        
        // TODO: Integrate with L1 bridge for actual force inclusion
        // This would submit the tx directly to L1 bypassing the sequencer
        
        emit ForceInclusionExecuted(txHash);
    }
    
    /// @inheritdoc ISequencerHealth
    function getForceInclusionRequest(bytes32 txHash) external view override returns (ForceInclusionRequest memory) {
        return _forceInclusions[txHash];
    }
    
    /// @inheritdoc ISequencerHealth
    function isForceInclusionOverdue(bytes32 txHash) external view override returns (bool) {
        ForceInclusionRequest storage request = _forceInclusions[txHash];
        return request.requestTime > 0 && 
               !request.executed && 
               block.timestamp >= request.deadline;
    }

    // ============================================
    // Admin Functions
    // ============================================
    
    /// @inheritdoc ISequencerHealth
    function setRotationContract(address rotation) external override onlyRole(ADMIN_ROLE) {
        require(rotation != address(0), "Invalid address");
        rotationContract = rotation;
    }
    
    /// @inheritdoc ISequencerHealth
    function setSlashingContract(address slashing) external override onlyRole(ADMIN_ROLE) {
        require(slashing != address(0), "Invalid address");
        slashingContract = slashing;
    }
    
    /// @inheritdoc ISequencerHealth
    function setHeartbeatInterval(uint256 /*interval*/) external view override onlyRole(ADMIN_ROLE) {
        // Note: Immutable in v1, would require governance to change
        revert("Immutable in v1");
    }

    // ============================================
    // Internal Functions
    // ============================================
    
    function _triggerAutoRotation(address oldSequencer) internal {
        SequencerHealthInfo storage info = _healthInfo[oldSequencer];
        info.status = HealthStatus.Suspended;
        info.suspendedUntil = block.timestamp + SUSPENSION_DURATION;
        
        // Get next sequencer from rotation
        address[] memory activeSequencers = registryContract.getActiveSequencers();
        address newSequencer = address(0);
        
        for (uint256 i = 0; i < activeSequencers.length; i++) {
            if (activeSequencers[i] != oldSequencer && 
                _healthInfo[activeSequencers[i]].status == HealthStatus.Healthy) {
                newSequencer = activeSequencers[i];
                break;
            }
        }
        
        emit AutoRotationTriggered(oldSequencer, newSequencer);
        emit SequencerSuspended(oldSequencer, "Auto-rotation: missed heartbeats");
    }
    
    // Receive function for force inclusion fees
    receive() external payable {}
}
