// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISequencerRegistry.sol";
import "../interfaces/ISequencerStaking.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SequencerRotation
 * @notice Manages sequencer rotation for L3 block production
 * @dev Implements DECEN-012 requirements
 *      - Epoch-based rotation (1000 blocks)
 *      - Round-robin selection
 *      - Force rotation (admin emergency)
 * @custom:security-contact security@quantumshield.io
 */
contract SequencerRotation is AccessControl {
    // ============================================
    // Constants
    // ============================================
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant HEALTH_ROLE = keccak256("HEALTH_ROLE");
    
    uint256 public constant EPOCH_LENGTH = 1000; // blocks per epoch

    // ============================================
    // Events
    // ============================================
    
    event SequencerRotated(
        address indexed oldSequencer,
        address indexed newSequencer,
        uint256 epoch,
        uint256 blockNumber
    );
    
    event EpochAdvanced(uint256 oldEpoch, uint256 newEpoch);
    event ForceRotation(address indexed triggeredBy, address indexed newSequencer);
    event RegistrySet(address indexed registry);
    event StakingSet(address indexed staking);

    // ============================================
    // State Variables
    // ============================================
    
    ISequencerRegistry public registryContract;
    ISequencerStaking public stakingContract;
    
    // Rotation state
    uint256 public currentEpoch;
    uint256 public epochStartBlock;
    uint256 public currentSequencerIndex;
    address public currentSequencer;
    
    // Rotation history
    mapping(uint256 => address) public epochSequencer;

    // ============================================
    // Constructor
    // ============================================
    
    constructor(
        address _registryContract,
        address _stakingContract,
        address admin
    ) {
        require(_registryContract != address(0), "Invalid registry");
        require(_stakingContract != address(0), "Invalid staking");
        
        registryContract = ISequencerRegistry(_registryContract);
        stakingContract = ISequencerStaking(_stakingContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        
        currentEpoch = 0;
        epochStartBlock = block.number;
    }

    // ============================================
    // Rotation Functions
    // ============================================
    
    /**
     * @notice Check and perform rotation if epoch boundary reached
     * @dev Can be called by anyone, gas incentivized in production
     */
    function checkAndRotate() external {
        if (block.number >= epochStartBlock + EPOCH_LENGTH) {
            _rotateSequencer();
        }
    }
    
    /**
     * @notice Force rotation to next sequencer (emergency)
     * @dev Only callable by admin or health contract
     */
    function forceRotation() external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(HEALTH_ROLE, msg.sender),
            "Not authorized"
        );
        
        address newSequencer = _rotateSequencer();
        emit ForceRotation(msg.sender, newSequencer);
    }
    
    /**
     * @notice Skip to specific sequencer (emergency)
     * @param sequencer Target sequencer address
     * @dev Only callable by admin
     */
    function forceRotationTo(address sequencer) external onlyRole(ADMIN_ROLE) {
        require(registryContract.isRegistered(sequencer), "Not registered");
        require(stakingContract.isEligible(sequencer), "Not eligible");
        
        address oldSequencer = currentSequencer;
        currentSequencer = sequencer;
        
        // Find index of this sequencer
        address[] memory active = registryContract.getActiveSequencers();
        for (uint256 i = 0; i < active.length; i++) {
            if (active[i] == sequencer) {
                currentSequencerIndex = i;
                break;
            }
        }
        
        emit SequencerRotated(oldSequencer, sequencer, currentEpoch, block.number);
        emit ForceRotation(msg.sender, sequencer);
    }

    // ============================================
    // Query Functions
    // ============================================
    
    /**
     * @notice Get current active sequencer
     * @return Current sequencer address
     */
    function getCurrentSequencer() external view returns (address) {
        return currentSequencer;
    }
    
    /**
     * @notice Get current epoch number
     * @return Current epoch
     */
    function getCurrentEpoch() external view returns (uint256) {
        return currentEpoch;
    }
    
    /**
     * @notice Get blocks remaining in current epoch
     * @return Blocks until next rotation
     */
    function getBlocksUntilRotation() external view returns (uint256) {
        uint256 epochEnd = epochStartBlock + EPOCH_LENGTH;
        if (block.number >= epochEnd) {
            return 0;
        }
        return epochEnd - block.number;
    }
    
    /**
     * @notice Get next sequencer in rotation
     * @return Next sequencer address
     */
    function getNextSequencer() external view returns (address) {
        address[] memory active = registryContract.getActiveSequencers();
        if (active.length == 0) return address(0);
        
        uint256 nextIndex = (currentSequencerIndex + 1) % active.length;
        return active[nextIndex];
    }
    
    /**
     * @notice Check if rotation is due
     * @return True if epoch boundary reached
     */
    function isRotationDue() external view returns (bool) {
        return block.number >= epochStartBlock + EPOCH_LENGTH;
    }
    
    /**
     * @notice Get sequencer for a specific epoch
     * @param epoch Epoch number
     * @return Sequencer address for that epoch
     */
    function getSequencerForEpoch(uint256 epoch) external view returns (address) {
        return epochSequencer[epoch];
    }

    // ============================================
    // Admin Functions
    // ============================================
    
    /**
     * @notice Set registry contract
     * @param registry New registry address
     */
    function setRegistry(address registry) external onlyRole(ADMIN_ROLE) {
        require(registry != address(0), "Invalid address");
        registryContract = ISequencerRegistry(registry);
        emit RegistrySet(registry);
    }
    
    /**
     * @notice Set staking contract
     * @param staking New staking address
     */
    function setStaking(address staking) external onlyRole(ADMIN_ROLE) {
        require(staking != address(0), "Invalid address");
        stakingContract = ISequencerStaking(staking);
        emit StakingSet(staking);
    }
    
    /**
     * @notice Set health contract for force rotation permissions
     * @param health Health contract address
     */
    function setHealthContract(address health) external onlyRole(ADMIN_ROLE) {
        require(health != address(0), "Invalid address");
        _grantRole(HEALTH_ROLE, health);
    }

    // ============================================
    // Internal Functions
    // ============================================
    
    function _rotateSequencer() internal returns (address newSequencer) {
        address[] memory active = registryContract.getActiveSequencers();
        require(active.length > 0, "No active sequencers");
        
        // Find next eligible sequencer (round-robin)
        uint256 startIndex = currentSequencerIndex;
        uint256 attempts = 0;
        
        do {
            currentSequencerIndex = (currentSequencerIndex + 1) % active.length;
            newSequencer = active[currentSequencerIndex];
            attempts++;
            
            // Check eligibility
            if (stakingContract.isEligible(newSequencer)) {
                break;
            }
        } while (attempts < active.length && currentSequencerIndex != startIndex);
        
        require(stakingContract.isEligible(newSequencer), "No eligible sequencer");
        
        // Update state
        address oldSequencer = currentSequencer;
        currentSequencer = newSequencer;
        
        // Advance epoch
        uint256 oldEpoch = currentEpoch;
        currentEpoch++;
        epochStartBlock = block.number;
        epochSequencer[currentEpoch] = newSequencer;
        
        emit EpochAdvanced(oldEpoch, currentEpoch);
        emit SequencerRotated(oldSequencer, newSequencer, currentEpoch, block.number);
        
        return newSequencer;
    }
}
