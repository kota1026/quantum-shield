// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISequencerStaking.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SequencerStaking
 * @notice Manages sequencer staking and delegation for L3 Aegis
 * @dev Implements DECEN-013 requirements
 *      - Minimum stake: 500K tokens
 *      - Minimum delegation: 50K tokens  
 *      - 7-day unbonding period
 * @custom:security-contact security@quantumshield.io
 */
contract SequencerStaking is ISequencerStaking, AccessControl, ReentrancyGuard {
    // ============================================
    // Constants
    // ============================================
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SLASHING_ROLE = keccak256("SLASHING_ROLE");
    
    uint256 public constant override MINIMUM_STAKE = 500_000 ether;
    uint256 public constant override MINIMUM_DELEGATED_STAKE = 50_000 ether;
    uint256 public constant override UNBONDING_PERIOD = 7 days;

    // ============================================
    // State Variables
    // ============================================
    
    // Sequencer stakes
    mapping(address => uint256) private _stakes;
    
    // Sequencer unbonding entries
    mapping(address => UnbondingEntry[]) private _unbonding;
    
    // Delegations: delegator => sequencer => amount
    mapping(address => mapping(address => uint256)) private _delegations;
    
    // Delegation unbonding: delegator => sequencer => entries
    mapping(address => mapping(address => UnbondingEntry[])) private _delegationUnbonding;
    
    // Total delegated to each sequencer
    mapping(address => uint256) private _totalDelegated;
    
    // Delegators list per sequencer
    mapping(address => address[]) private _delegatorsList;
    mapping(address => mapping(address => bool)) private _isDelegator;
    
    // Slashing contract
    address public slashingContract;

    // ============================================
    // Constructor
    // ============================================
    
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ============================================
    // Staking Functions
    // ============================================
    
    /// @inheritdoc ISequencerStaking
    function stake() external payable override nonReentrant {
        require(msg.value > 0, "Zero stake");
        
        _stakes[msg.sender] += msg.value;
        
        emit Staked(msg.sender, msg.value);
    }
    
    /// @inheritdoc ISequencerStaking
    function stakeFor(address sequencer) external payable override nonReentrant {
        require(msg.value > 0, "Zero stake");
        require(sequencer != address(0), "Invalid sequencer");
        
        _stakes[sequencer] += msg.value;
        
        emit Staked(sequencer, msg.value);
    }
    
    /// @inheritdoc ISequencerStaking
    function unstake(uint256 amount) external override nonReentrant {
        require(amount > 0, "Zero amount");
        require(_stakes[msg.sender] >= amount, "Insufficient stake");
        
        _stakes[msg.sender] -= amount;
        
        uint256 unlockTime = block.timestamp + UNBONDING_PERIOD;
        _unbonding[msg.sender].push(UnbondingEntry({
            amount: amount,
            unlockTime: unlockTime
        }));
        
        emit Unstaked(msg.sender, amount, unlockTime);
    }
    
    /// @inheritdoc ISequencerStaking
    function withdraw() external override nonReentrant {
        uint256 withdrawable = _processUnbonding(msg.sender);
        require(withdrawable > 0, "Nothing to withdraw");
        
        (bool success, ) = msg.sender.call{value: withdrawable}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, withdrawable);
    }

    // ============================================
    // Delegation Functions
    // ============================================
    
    /// @inheritdoc ISequencerStaking
    function delegateStake(address sequencer) external payable override nonReentrant {
        require(msg.value >= MINIMUM_DELEGATED_STAKE, "Below minimum delegation");
        require(sequencer != address(0), "Invalid sequencer");
        require(_stakes[sequencer] > 0, "Not a sequencer");
        
        _delegations[msg.sender][sequencer] += msg.value;
        _totalDelegated[sequencer] += msg.value;
        
        // Track delegator
        if (!_isDelegator[sequencer][msg.sender]) {
            _delegatorsList[sequencer].push(msg.sender);
            _isDelegator[sequencer][msg.sender] = true;
        }
        
        emit DelegateStaked(msg.sender, sequencer, msg.value);
    }
    
    /// @inheritdoc ISequencerStaking
    function undelegateStake(address sequencer, uint256 amount) external override nonReentrant {
        require(amount > 0, "Zero amount");
        require(_delegations[msg.sender][sequencer] >= amount, "Insufficient delegation");
        
        _delegations[msg.sender][sequencer] -= amount;
        _totalDelegated[sequencer] -= amount;
        
        uint256 unlockTime = block.timestamp + UNBONDING_PERIOD;
        _delegationUnbonding[msg.sender][sequencer].push(UnbondingEntry({
            amount: amount,
            unlockTime: unlockTime
        }));
        
        emit DelegateUnstaked(msg.sender, sequencer, amount, unlockTime);
    }
    
    /// @inheritdoc ISequencerStaking
    function withdrawDelegation(address sequencer) external override nonReentrant {
        uint256 withdrawable = _processDelegationUnbonding(msg.sender, sequencer);
        require(withdrawable > 0, "Nothing to withdraw");
        
        (bool success, ) = msg.sender.call{value: withdrawable}("");
        require(success, "Transfer failed");
        
        emit DelegateWithdrawn(msg.sender, sequencer, withdrawable);
    }

    // ============================================
    // Query Functions
    // ============================================
    
    /// @inheritdoc ISequencerStaking
    function getStake(address sequencer) external view override returns (uint256) {
        return _stakes[sequencer];
    }
    
    /// @inheritdoc ISequencerStaking
    function isEligible(address sequencer) external view override returns (bool) {
        return _stakes[sequencer] >= MINIMUM_STAKE;
    }
    
    /// @inheritdoc ISequencerStaking
    function getTotalStake(address sequencer) external view override returns (uint256) {
        return _stakes[sequencer] + _totalDelegated[sequencer];
    }
    
    /// @inheritdoc ISequencerStaking
    function getDelegatedStake(address sequencer) external view override returns (uint256) {
        return _totalDelegated[sequencer];
    }
    
    /// @inheritdoc ISequencerStaking
    function getDelegation(address delegator, address sequencer) external view override returns (uint256) {
        return _delegations[delegator][sequencer];
    }
    
    /// @inheritdoc ISequencerStaking
    function getDelegators(address sequencer) external view override returns (address[] memory) {
        return _delegatorsList[sequencer];
    }
    
    /// @inheritdoc ISequencerStaking
    function getUnbondingEntries(address sequencer) external view override returns (UnbondingEntry[] memory) {
        return _unbonding[sequencer];
    }
    
    /// @inheritdoc ISequencerStaking
    function getWithdrawable(address sequencer) external view override returns (uint256) {
        uint256 withdrawable = 0;
        UnbondingEntry[] storage entries = _unbonding[sequencer];
        
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].unlockTime <= block.timestamp && entries[i].amount > 0) {
                withdrawable += entries[i].amount;
            }
        }
        
        return withdrawable;
    }

    // ============================================
    // Admin Functions
    // ============================================
    
    /// @inheritdoc ISequencerStaking
    function setSlashingContract(address _slashingContract) external override onlyRole(ADMIN_ROLE) {
        require(_slashingContract != address(0), "Invalid address");
        slashingContract = _slashingContract;
        _grantRole(SLASHING_ROLE, _slashingContract);
        emit SlashingContractSet(_slashingContract);
    }

    // ============================================
    // Slashing Integration
    // ============================================
    
    /// @inheritdoc ISequencerStaking
    function slash(address sequencer, uint256 amount) external override onlyRole(SLASHING_ROLE) {
        require(amount > 0, "Zero amount");
        
        uint256 currentStake = _stakes[sequencer];
        uint256 actualSlash = amount > currentStake ? currentStake : amount;
        
        _stakes[sequencer] -= actualSlash;
        
        emit StakeSlashed(sequencer, actualSlash);
    }

    // ============================================
    // Internal Functions
    // ============================================
    
    function _processUnbonding(address sequencer) internal returns (uint256) {
        uint256 withdrawable = 0;
        UnbondingEntry[] storage entries = _unbonding[sequencer];
        
        uint256 i = 0;
        while (i < entries.length) {
            if (entries[i].unlockTime <= block.timestamp) {
                withdrawable += entries[i].amount;
                // Remove entry by swapping with last and popping
                entries[i] = entries[entries.length - 1];
                entries.pop();
            } else {
                i++;
            }
        }
        
        return withdrawable;
    }
    
    function _processDelegationUnbonding(address delegator, address sequencer) internal returns (uint256) {
        uint256 withdrawable = 0;
        UnbondingEntry[] storage entries = _delegationUnbonding[delegator][sequencer];
        
        uint256 i = 0;
        while (i < entries.length) {
            if (entries[i].unlockTime <= block.timestamp) {
                withdrawable += entries[i].amount;
                entries[i] = entries[entries.length - 1];
                entries.pop();
            } else {
                i++;
            }
        }
        
        return withdrawable;
    }
}
