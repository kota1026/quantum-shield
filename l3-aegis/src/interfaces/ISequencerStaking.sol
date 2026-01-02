// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISequencerStaking
 * @notice Interface for Sequencer staking and delegation
 * @dev Implements DECEN-013 requirements
 * @custom:security-contact security@quantumshield.io
 */
interface ISequencerStaking {
    // ============================================
    // Events
    // ============================================
    
    event Staked(address indexed sequencer, uint256 amount);
    event Unstaked(address indexed sequencer, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed sequencer, uint256 amount);
    event DelegateStaked(address indexed delegator, address indexed sequencer, uint256 amount);
    event DelegateUnstaked(address indexed delegator, address indexed sequencer, uint256 amount, uint256 unlockTime);
    event DelegateWithdrawn(address indexed delegator, address indexed sequencer, uint256 amount);
    event SlashingContractSet(address indexed slashingContract);
    event StakeSlashed(address indexed sequencer, uint256 amount);

    // ============================================
    // Structs
    // ============================================
    
    struct UnbondingEntry {
        uint256 amount;
        uint256 unlockTime;
    }
    
    struct DelegationInfo {
        uint256 amount;
        UnbondingEntry[] unbonding;
    }

    // ============================================
    // Constants (View)
    // ============================================
    
    /**
     * @notice Minimum stake required for sequencer eligibility
     * @return uint256 Minimum stake (500,000 tokens)
     */
    function MINIMUM_STAKE() external view returns (uint256);
    
    /**
     * @notice Minimum delegation amount
     * @return uint256 Minimum delegation (50,000 tokens)
     */
    function MINIMUM_DELEGATED_STAKE() external view returns (uint256);
    
    /**
     * @notice Unbonding period duration
     * @return uint256 Unbonding period (7 days)
     */
    function UNBONDING_PERIOD() external view returns (uint256);

    // ============================================
    // Staking Functions
    // ============================================
    
    /**
     * @notice Stake tokens as a sequencer
     * @dev Increases stake if already staked
     */
    function stake() external payable;
    
    /**
     * @notice Request unstaking of tokens
     * @param amount Amount to unstake
     * @dev Initiates 7-day unbonding period
     */
    function unstake(uint256 amount) external;
    
    /**
     * @notice Withdraw unbonded tokens
     * @dev Can only withdraw after unbonding period
     */
    function withdraw() external;

    // ============================================
    // Delegation Functions
    // ============================================
    
    /**
     * @notice Delegate stake to a sequencer
     * @param sequencer Sequencer to delegate to
     * @dev Minimum 50,000 tokens required
     */
    function delegateStake(address sequencer) external payable;
    
    /**
     * @notice Request undelegate of tokens
     * @param sequencer Sequencer to undelegate from
     * @param amount Amount to undelegate
     */
    function undelegateStake(address sequencer, uint256 amount) external;
    
    /**
     * @notice Withdraw undelegated tokens
     * @param sequencer Sequencer to withdraw delegation from
     */
    function withdrawDelegation(address sequencer) external;

    // ============================================
    // Query Functions
    // ============================================
    
    /**
     * @notice Get sequencer's own stake
     * @param sequencer Sequencer address
     * @return uint256 Stake amount
     */
    function getStake(address sequencer) external view returns (uint256);
    
    /**
     * @notice Check if sequencer meets minimum stake requirement
     * @param sequencer Sequencer address
     * @return bool True if eligible
     */
    function isEligible(address sequencer) external view returns (bool);
    
    /**
     * @notice Get total stake (own + delegated)
     * @param sequencer Sequencer address
     * @return uint256 Total stake
     */
    function getTotalStake(address sequencer) external view returns (uint256);
    
    /**
     * @notice Get delegated stake for a sequencer
     * @param sequencer Sequencer address
     * @return uint256 Total delegated stake
     */
    function getDelegatedStake(address sequencer) external view returns (uint256);
    
    /**
     * @notice Get delegation info for a delegator to a sequencer
     * @param delegator Delegator address
     * @param sequencer Sequencer address
     * @return amount Delegated amount
     */
    function getDelegation(address delegator, address sequencer) external view returns (uint256 amount);
    
    /**
     * @notice Get all delegators for a sequencer
     * @param sequencer Sequencer address
     * @return address[] Array of delegator addresses
     */
    function getDelegators(address sequencer) external view returns (address[] memory);
    
    /**
     * @notice Get unbonding entries for a sequencer
     * @param sequencer Sequencer address
     * @return UnbondingEntry[] Array of unbonding entries
     */
    function getUnbondingEntries(address sequencer) external view returns (UnbondingEntry[] memory);
    
    /**
     * @notice Get withdrawable amount for a sequencer
     * @param sequencer Sequencer address
     * @return uint256 Amount that can be withdrawn
     */
    function getWithdrawable(address sequencer) external view returns (uint256);

    // ============================================
    // Admin Functions
    // ============================================
    
    /**
     * @notice Set slashing contract address
     * @param slashingContract Address of SequencerSlashing contract
     * @dev Only callable by admin
     */
    function setSlashingContract(address slashingContract) external;

    // ============================================
    // Slashing Integration
    // ============================================
    
    /**
     * @notice Slash a sequencer's stake
     * @param sequencer Sequencer to slash
     * @param amount Amount to slash
     * @dev Only callable by slashing contract
     */
    function slash(address sequencer, uint256 amount) external;
}
