// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISequencerHealth
 * @notice Interface for Sequencer health monitoring and failover
 * @dev Implements DECEN-015 requirements
 *      - Heartbeat monitoring (30s intervals)
 *      - Auto-rotation after 3 consecutive failures
 *      - Force inclusion guarantee (24h)
 * @custom:security-contact security@quantumshield.io
 */
interface ISequencerHealth {
    // ============================================
    // Events
    // ============================================
    
    event HeartbeatReceived(address indexed sequencer, uint256 timestamp);
    event HeartbeatMissed(address indexed sequencer, uint256 missCount);
    event SequencerSuspended(address indexed sequencer, string reason);
    event SequencerRecovered(address indexed sequencer);
    event AutoRotationTriggered(address indexed oldSequencer, address indexed newSequencer);
    event ForceInclusionRequested(bytes32 indexed txHash, address indexed requester, uint256 deadline);
    event ForceInclusionExecuted(bytes32 indexed txHash);

    // ============================================
    // Enums
    // ============================================
    
    enum HealthStatus {
        Healthy,
        Degraded,
        Suspended,
        Inactive
    }

    // ============================================
    // Structs
    // ============================================
    
    struct SequencerHealthInfo {
        HealthStatus status;
        uint256 lastHeartbeat;
        uint256 consecutiveMisses;
        uint256 totalMisses;
        uint256 suspendedUntil;
    }
    
    struct ForceInclusionRequest {
        bytes32 txHash;
        address requester;
        uint256 requestTime;
        uint256 deadline;
        bool executed;
    }

    // ============================================
    // Constants (View)
    // ============================================
    
    /**
     * @notice Heartbeat interval (30 seconds)
     * @return uint256 Heartbeat interval in seconds
     */
    function HEARTBEAT_INTERVAL() external view returns (uint256);
    
    /**
     * @notice Maximum consecutive misses before auto-rotation
     * @return uint256 Max misses (3)
     */
    function MAX_CONSECUTIVE_MISSES() external view returns (uint256);
    
    /**
     * @notice Force inclusion timeout (24 hours)
     * @return uint256 Force inclusion deadline in seconds
     */
    function FORCE_INCLUSION_TIMEOUT() external view returns (uint256);
    
    /**
     * @notice Suspension duration for failed sequencer
     * @return uint256 Suspension duration in seconds
     */
    function SUSPENSION_DURATION() external view returns (uint256);

    // ============================================
    // Heartbeat Functions
    // ============================================
    
    /**
     * @notice Submit heartbeat for active sequencer
     * @dev Only callable by registered sequencer
     */
    function submitHeartbeat() external;
    
    /**
     * @notice Check heartbeat status for a sequencer
     * @param sequencer Sequencer address
     * @return bool True if heartbeat is current
     */
    function isHeartbeatCurrent(address sequencer) external view returns (bool);
    
    /**
     * @notice Get last heartbeat timestamp
     * @param sequencer Sequencer address
     * @return uint256 Last heartbeat timestamp
     */
    function getLastHeartbeat(address sequencer) external view returns (uint256);

    // ============================================
    // Health Check Functions
    // ============================================
    
    /**
     * @notice Get health status of a sequencer
     * @param sequencer Sequencer address
     * @return HealthStatus Current health status
     */
    function getHealthStatus(address sequencer) external view returns (HealthStatus);
    
    /**
     * @notice Get full health info for a sequencer
     * @param sequencer Sequencer address
     * @return SequencerHealthInfo Health information struct
     */
    function getHealthInfo(address sequencer) external view returns (SequencerHealthInfo memory);
    
    /**
     * @notice Get health statistics
     * @return healthy Number of healthy sequencers
     * @return total Total registered sequencers
     */
    function getHealthStats() external view returns (uint256 healthy, uint256 total);

    // ============================================
    // Failover Functions
    // ============================================
    
    /**
     * @notice Trigger health check and rotation if needed
     * @dev Can be called by anyone, gas incentivized
     */
    function checkAndRotate() external;
    
    /**
     * @notice Manually suspend a sequencer (admin only)
     * @param sequencer Sequencer to suspend
     * @param reason Suspension reason
     */
    function suspendSequencer(address sequencer, string calldata reason) external;
    
    /**
     * @notice Recover a suspended sequencer
     * @param sequencer Sequencer to recover
     * @dev Only callable after suspension period or by admin
     */
    function recoverSequencer(address sequencer) external;

    // ============================================
    // Force Inclusion Functions
    // ============================================
    
    /**
     * @notice Request force inclusion of a transaction
     * @param txHash Hash of transaction to include
     * @dev Starts 24h countdown for inclusion
     */
    function requestForceInclusion(bytes32 txHash) external payable;
    
    /**
     * @notice Execute force inclusion after timeout
     * @param txHash Hash of transaction to force include
     * @dev Can be called by anyone after 24h deadline
     */
    function executeForceInclusion(bytes32 txHash) external;
    
    /**
     * @notice Get force inclusion request info
     * @param txHash Transaction hash
     * @return ForceInclusionRequest Request information
     */
    function getForceInclusionRequest(bytes32 txHash) external view returns (ForceInclusionRequest memory);
    
    /**
     * @notice Check if force inclusion is past deadline
     * @param txHash Transaction hash
     * @return bool True if past deadline and not executed
     */
    function isForceInclusionOverdue(bytes32 txHash) external view returns (bool);

    // ============================================
    // Admin Functions
    // ============================================
    
    /**
     * @notice Set rotation contract address
     * @param rotation Rotation contract address
     */
    function setRotationContract(address rotation) external;
    
    /**
     * @notice Set slashing contract address
     * @param slashing Slashing contract address
     */
    function setSlashingContract(address slashing) external;
    
    /**
     * @notice Update heartbeat interval
     * @param interval New interval in seconds
     * @dev Subject to timelock
     */
    function setHeartbeatInterval(uint256 interval) external;
}
