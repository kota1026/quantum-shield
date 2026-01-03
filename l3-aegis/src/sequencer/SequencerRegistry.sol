// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISequencerRegistry.sol";
import "../interfaces/ISequencerStaking.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SequencerRegistry
 * @notice Manages sequencer registration with SPHINCS+ keys
 * @dev Implements DECEN-012 requirements
 *      - SPHINCS+ key registration (CP-1 compliant)
 *      - Integration with staking system
 *      - Epoch-based rotation support
 * @custom:security-contact security@quantumshield.io
 */
contract SequencerRegistry is ISequencerRegistry, AccessControl, ReentrancyGuard {
    // ============================================
    // Constants
    // ============================================
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ROTATION_ROLE = keccak256("ROTATION_ROLE");
    bytes32 public constant HEALTH_ROLE = keccak256("HEALTH_ROLE");
    
    uint256 public constant SPHINCS_KEY_LENGTH = 32; // SPHINCS+-128s public key length
    uint256 public constant MINIMUM_STAKE = 500_000 ether;

    // ============================================
    // State Variables
    // ============================================
    
    ISequencerStaking public stakingContract;
    address public rotationContract;
    address public healthContract;
    
    // Sequencer storage
    mapping(address => SequencerInfo) private _sequencers;
    address[] private _activeSequencerList;
    mapping(address => uint256) private _activeIndex;
    mapping(address => bool) private _isActive;
    
    // SPHINCS+ key to address mapping (prevent key reuse)
    mapping(bytes32 => address) private _keyToSequencer;

    // ============================================
    // Constructor
    // ============================================
    
    constructor(address _stakingContract, address admin) {
        require(_stakingContract != address(0), "Invalid staking");
        
        stakingContract = ISequencerStaking(_stakingContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ============================================
    // Registration Functions
    // ============================================
    
    /// @inheritdoc ISequencerRegistry
    function register(bytes calldata sphincsKey) external payable override nonReentrant {
        _validateRegistration(sphincsKey);
        _executeRegistration(sphincsKey, msg.value);
    }
    
    function _validateRegistration(bytes calldata sphincsKey) internal view {
        require(!_isActive[msg.sender], "Already registered");
        require(sphincsKey.length == SPHINCS_KEY_LENGTH, "Invalid key length");
        require(_keyToSequencer[keccak256(sphincsKey)] == address(0), "Key already used");
        require(msg.value >= MINIMUM_STAKE, "Insufficient stake");
    }
    
    function _executeRegistration(bytes calldata sphincsKey, uint256 stakeAmount) internal {
        // Forward stake to staking contract - stake for the actual sequencer (msg.sender)
        stakingContract.stakeFor{value: stakeAmount}(msg.sender);
        
        // Store sequencer info
        _sequencers[msg.sender] = SequencerInfo({
            sequencerAddress: msg.sender,
            sphincsKey: sphincsKey,
            stake: stakeAmount,
            registeredAt: block.timestamp,
            isActive: true,
            totalBlocksProduced: 0
        });
        
        // Add to active list
        _addToActiveList(msg.sender);
        
        // Track key usage
        _keyToSequencer[keccak256(sphincsKey)] = msg.sender;
        
        emit SequencerRegistered(msg.sender, sphincsKey, stakeAmount, block.timestamp);
    }
    
    function _addToActiveList(address sequencer) internal {
        _activeIndex[sequencer] = _activeSequencerList.length;
        _activeSequencerList.push(sequencer);
        _isActive[sequencer] = true;
    }
    
    /// @inheritdoc ISequencerRegistry
    function deregister() external override nonReentrant {
        require(_isActive[msg.sender], "Not registered");
        
        uint256 stakeAmount = _sequencers[msg.sender].stake;
        
        _removeFromActiveList(msg.sender);
        _sequencers[msg.sender].isActive = false;
        
        // Initiate unstaking via unstakeFor (7-day unbonding)
        // Using interface cast to access unstakeFor
        (bool success, ) = address(stakingContract).call(
            abi.encodeWithSignature("unstakeFor(address,uint256)", msg.sender, stakeAmount)
        );
        require(success, "Unstake failed");
        
        emit SequencerDeregistered(msg.sender, block.timestamp);
    }
    
    /// @inheritdoc ISequencerRegistry
    function updateSphincsKey(bytes calldata newSphincsKey) external override {
        require(_isActive[msg.sender], "Not registered");
        require(newSphincsKey.length == SPHINCS_KEY_LENGTH, "Invalid key length");
        
        bytes32 newKeyHash = keccak256(newSphincsKey);
        require(_keyToSequencer[newKeyHash] == address(0), "Key already used");
        
        // Remove old key mapping
        delete _keyToSequencer[keccak256(_sequencers[msg.sender].sphincsKey)];
        
        // Update to new key
        _sequencers[msg.sender].sphincsKey = newSphincsKey;
        _keyToSequencer[newKeyHash] = msg.sender;
    }

    // ============================================
    // Query Functions
    // ============================================
    
    /// @inheritdoc ISequencerRegistry
    function isRegistered(address sequencer) external view override returns (bool) {
        return _isActive[sequencer];
    }
    
    /// @inheritdoc ISequencerRegistry
    function getActiveSequencers() external view override returns (address[] memory) {
        return _activeSequencerList;
    }
    
    /// @inheritdoc ISequencerRegistry
    function getActiveSequencersCount() external view override returns (uint256) {
        return _activeSequencerList.length;
    }
    
    /// @inheritdoc ISequencerRegistry
    function getSequencerInfo(address sequencer) external view override returns (SequencerInfo memory) {
        return _sequencers[sequencer];
    }
    
    /// @inheritdoc ISequencerRegistry
    function getSphincsKey(address sequencer) external view override returns (bytes memory) {
        return _sequencers[sequencer].sphincsKey;
    }

    // ============================================
    // Admin Functions
    // ============================================
    
    /// @inheritdoc ISequencerRegistry
    function setRotationContract(address _rotationContract) external override onlyRole(ADMIN_ROLE) {
        require(_rotationContract != address(0), "Invalid address");
        rotationContract = _rotationContract;
        _grantRole(ROTATION_ROLE, _rotationContract);
        emit RotationContractSet(_rotationContract);
    }
    
    /// @inheritdoc ISequencerRegistry
    function setHealthContract(address _healthContract) external override onlyRole(ADMIN_ROLE) {
        require(_healthContract != address(0), "Invalid address");
        healthContract = _healthContract;
        _grantRole(HEALTH_ROLE, _healthContract);
        emit HealthContractSet(_healthContract);
    }
    
    /// @inheritdoc ISequencerRegistry
    function forceDeregister(address sequencer) external override onlyRole(ADMIN_ROLE) {
        require(_isActive[sequencer], "Not registered");
        
        _removeFromActiveList(sequencer);
        _sequencers[sequencer].isActive = false;
        
        emit SequencerDeregistered(sequencer, block.timestamp);
    }

    // ============================================
    // Rotation Integration
    // ============================================
    
    /**
     * @notice Increment blocks produced for a sequencer
     * @param sequencer Sequencer who produced a block
     * @dev Only callable by rotation contract
     */
    function incrementBlocksProduced(address sequencer) external onlyRole(ROTATION_ROLE) {
        require(_isActive[sequencer], "Not active");
        _sequencers[sequencer].totalBlocksProduced++;
    }
    
    /**
     * @notice Update stake info from staking contract
     * @param sequencer Sequencer address
     * @param newStake New stake amount
     * @dev Only callable by staking-related contracts
     */
    function updateStakeInfo(address sequencer, uint256 newStake) external {
        require(
            msg.sender == address(stakingContract) || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        
        uint256 oldStake = _sequencers[sequencer].stake;
        _sequencers[sequencer].stake = newStake;
        
        // Auto-deactivate if below minimum
        if (newStake < MINIMUM_STAKE && _isActive[sequencer]) {
            _removeFromActiveList(sequencer);
            _sequencers[sequencer].isActive = false;
        }
        
        emit SequencerStakeUpdated(sequencer, oldStake, newStake);
    }

    // ============================================
    // Internal Functions
    // ============================================
    
    function _removeFromActiveList(address sequencer) internal {
        if (!_isActive[sequencer]) return;
        
        uint256 index = _activeIndex[sequencer];
        uint256 lastIndex = _activeSequencerList.length - 1;
        
        if (index != lastIndex) {
            address lastSequencer = _activeSequencerList[lastIndex];
            _activeSequencerList[index] = lastSequencer;
            _activeIndex[lastSequencer] = index;
        }
        
        _activeSequencerList.pop();
        delete _activeIndex[sequencer];
        _isActive[sequencer] = false;
    }
}
