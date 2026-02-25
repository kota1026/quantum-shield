// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISequencerSlashing
 * @notice Interface for Sequencer slashing mechanisms
 * @dev Implements DECEN-014 requirements
 *      - Quadratic slashing: N^2 * 10%
 *      - Distribution: 60% Challenger, 20% Insurance, 20% Burn
 * @custom:security-contact security@quantumshield.io
 */
interface ISequencerSlashing {
    // ============================================
    // Events
    // ============================================
    
    event DoubleSignReported(
        address indexed sequencer,
        address indexed challenger,
        uint256 slashAmount,
        uint256 violationCount
    );
    
    event DowntimeReported(
        address indexed sequencer,
        uint256 slashAmount,
        uint256 violationCount
    );
    
    event SlashDistributed(
        address indexed sequencer,
        uint256 challengerReward,
        uint256 insuranceAmount,
        uint256 burnedAmount
    );
    
    event InsuranceFundUpdated(address indexed newFund);
    event ChallengeBondUpdated(uint256 newBond);

    // ============================================
    // Enums
    // ============================================
    
    enum ViolationType {
        DoubleSigning,
        Downtime,
        InvalidStateRoot,
        Other
    }

    // ============================================
    // Structs
    // ============================================
    
    struct ViolationRecord {
        ViolationType violationType;
        uint256 timestamp;
        uint256 slashAmount;
        address challenger;
    }

    // ============================================
    // Constants (View)
    // ============================================
    
    /**
     * @notice Base slash percentage (10%)
     * @return uint256 Base slash in basis points (1000 = 10%)
     */
    function BASE_SLASH_PERCENT() external view returns (uint256);
    
    /**
     * @notice Challenger reward percentage (60%)
     * @return uint256 Challenger reward in basis points (6000 = 60%)
     */
    function CHALLENGER_REWARD_PERCENT() external view returns (uint256);
    
    /**
     * @notice Insurance fund percentage (20%)
     * @return uint256 Insurance amount in basis points (2000 = 20%)
     */
    function INSURANCE_PERCENT() external view returns (uint256);
    
    /**
     * @notice Burn percentage (20%)
     * @return uint256 Burn amount in basis points (2000 = 20%)
     */
    function BURN_PERCENT() external view returns (uint256);
    
    /**
     * @notice Required bond for challenge
     * @return uint256 Challenge bond amount
     */
    function CHALLENGE_BOND() external view returns (uint256);

    // ============================================
    // Slash Reporting Functions
    // ============================================
    
    /**
     * @notice Report double-signing violation
     * @param sequencer Sequencer who double-signed
     * @param proof Proof of double-signing (two conflicting signatures)
     * @dev Requires CHALLENGE_BOND, returns bond + reward on success
     */
    function reportDoubleSign(address sequencer, bytes calldata proof) external payable;
    
    /**
     * @notice Report downtime violation
     * @param sequencer Sequencer who failed SLA
     * @dev Only callable by authorized health monitor
     */
    function reportDowntime(address sequencer) external;
    
    /**
     * @notice Report invalid state root
     * @param sequencer Sequencer who submitted invalid root
     * @param proof Fraud proof
     * @dev Requires CHALLENGE_BOND
     */
    function reportInvalidStateRoot(address sequencer, bytes calldata proof) external payable;

    // ============================================
    // Calculation Functions
    // ============================================
    
    /**
     * @notice Calculate slash amount using quadratic formula
     * @param stake Current stake amount
     * @param violationCount Number of violations (N)
     * @return uint256 Slash amount (N^2 * 10% * stake, capped at 100%)
     */
    function calculateSlash(uint256 stake, uint256 violationCount) external pure returns (uint256);

    // ============================================
    // Query Functions
    // ============================================
    
    /**
     * @notice Get violation count for a sequencer
     * @param sequencer Sequencer address
     * @return uint256 Number of violations
     */
    function getViolationCount(address sequencer) external view returns (uint256);
    
    /**
     * @notice Get violation records for a sequencer
     * @param sequencer Sequencer address
     * @return ViolationRecord[] Array of violation records
     */
    function getViolationRecords(address sequencer) external view returns (ViolationRecord[] memory);
    
    /**
     * @notice Get insurance fund address
     * @return address Insurance fund address
     */
    function getInsuranceFund() external view returns (address);

    // ============================================
    // Admin Functions
    // ============================================
    
    /**
     * @notice Update insurance fund address
     * @param newFund New insurance fund address
     * @dev Only callable by admin
     */
    function setInsuranceFund(address newFund) external;
    
    /**
     * @notice Update challenge bond amount
     * @param newBond New challenge bond
     * @dev Only callable by admin, subject to timelock
     */
    function setChallengeBond(uint256 newBond) external;
    
    /**
     * @notice Authorize health monitor for downtime reports
     * @param monitor Health monitor address
     * @param authorized Authorization status
     * @dev Only callable by admin
     */
    function setAuthorizedMonitor(address monitor, bool authorized) external;
}
