// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISequencerRegistry
 * @notice Interface for Sequencer registration and management
 * @dev Implements DECEN-012 requirements
 * @custom:security-contact security@quantumshield.io
 */
interface ISequencerRegistry {
    // ============================================
    // Events
    // ============================================
    
    event SequencerRegistered(
        address indexed sequencer,
        bytes sphincsKey,
        uint256 stake,
        uint256 timestamp
    );
    
    event SequencerDeregistered(
        address indexed sequencer,
        uint256 timestamp
    );
    
    event SequencerStakeUpdated(
        address indexed sequencer,
        uint256 oldStake,
        uint256 newStake
    );
    
    event RotationContractSet(address indexed rotationContract);
    event HealthContractSet(address indexed healthContract);

    // ============================================
    // Structs
    // ============================================
    
    struct SequencerInfo {
        address sequencerAddress;
        bytes sphincsKey;
        uint256 stake;
        uint256 registeredAt;
        bool isActive;
        uint256 totalBlocksProduced;
    }

    // ============================================
    // Registration Functions
    // ============================================
    
    /**
     * @notice Register as a sequencer with SPHINCS+ public key
     * @param sphincsKey SPHINCS+ public key for quantum-resistant signing
     * @dev Requires minimum stake of $500K equivalent
     */
    function register(bytes calldata sphincsKey) external payable;
    
    /**
     * @notice Deregister from sequencer duties
     * @dev Initiates unbonding period for stake return
     */
    function deregister() external;
    
    /**
     * @notice Update SPHINCS+ public key (for key rotation)
     * @param newSphincsKey New SPHINCS+ public key
     */
    function updateSphincsKey(bytes calldata newSphincsKey) external;

    // ============================================
    // Query Functions
    // ============================================
    
    /**
     * @notice Check if address is a registered sequencer
     * @param sequencer Address to check
     * @return bool True if registered
     */
    function isRegistered(address sequencer) external view returns (bool);
    
    /**
     * @notice Get list of active sequencers
     * @return Array of active sequencer addresses
     */
    function getActiveSequencers() external view returns (address[] memory);
    
    /**
     * @notice Get count of active sequencers
     * @return uint256 Number of active sequencers
     */
    function getActiveSequencersCount() external view returns (uint256);
    
    /**
     * @notice Get sequencer information
     * @param sequencer Sequencer address
     * @return SequencerInfo struct
     */
    function getSequencerInfo(address sequencer) external view returns (SequencerInfo memory);
    
    /**
     * @notice Get SPHINCS+ public key for sequencer
     * @param sequencer Sequencer address
     * @return SPHINCS+ public key bytes
     */
    function getSphincsKey(address sequencer) external view returns (bytes memory);

    // ============================================
    // Admin Functions
    // ============================================
    
    /**
     * @notice Set rotation contract address
     * @param rotationContract Address of SequencerRotation contract
     */
    function setRotationContract(address rotationContract) external;
    
    /**
     * @notice Set health monitoring contract address
     * @param healthContract Address of SequencerHealth contract
     */
    function setHealthContract(address healthContract) external;
    
    /**
     * @notice Force deregister a sequencer (emergency only)
     * @param sequencer Sequencer to force deregister
     */
    function forceDeregister(address sequencer) external;
}
