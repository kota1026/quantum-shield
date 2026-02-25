// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IConstitutionLock
/// @notice Interface for Core Principles protection mechanism
/// @dev Part of Quantum Shield's Modular Architecture (MODULAR_ARCHITECTURE.md §3.4)
/// @dev Implements CP-1 through CP-5 per CORE_PRINCIPLES.md
/// @custom:security-contact security@quantumshield.io
interface IConstitutionLock {
    // ============ Enums ============
    
    /// @notice Protection levels for Core Principles
    /// @dev IMMUTABLE: Cannot be changed under any circumstances (CP-1, CP-2)
    /// @dev SUPERMAJORITY: Can be changed with 75% veQS + 6/7 SC + 30 days (CP-3, CP-4, CP-5)
    enum ProtectionLevel {
        IMMUTABLE,
        SUPERMAJORITY
    }
    
    // ============ Structs ============
    
    /// @notice Supermajority voting requirements
    struct SupermajorityRequirements {
        uint256 veQSThreshold;      // 75% (7500 basis points)
        uint256 scThreshold;        // 6/7 Security Council
        uint256 scTotal;            // 7 total
        uint256 timelockDays;       // 30 days
    }
    
    /// @notice Core Principle definition
    struct CorePrinciple {
        uint8 cpNumber;
        string name;
        string description;
        ProtectionLevel level;
        bool compliant;
    }
    
    // ============ Events ============
    
    /// @notice Emitted when CP compliance status changes
    /// @param cpNumber Core Principle number
    /// @param compliant New compliance status
    /// @param checker Address that performed the check
    event CPComplianceChanged(
        uint8 indexed cpNumber,
        bool compliant,
        address indexed checker
    );
    
    /// @notice Emitted when supermajority change is proposed
    /// @param cpNumber Core Principle being changed
    /// @param proposalId Unique proposal identifier
    /// @param proposer Address that proposed the change
    event SupermajorityProposed(
        uint8 indexed cpNumber,
        bytes32 indexed proposalId,
        address indexed proposer
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when attempting to modify immutable CP
    error ImmutableCPCannotBeChanged(uint8 cpNumber);
    
    /// @notice Thrown when supermajority requirements not met
    error SupermajorityNotReached(uint256 veQSVotes, uint256 scVotes);
    
    /// @notice Thrown when CP is not compliant
    error CPNotCompliant(uint8 cpNumber);
    
    /// @notice Thrown when invalid CP number is provided
    error InvalidCPNumber(uint8 cpNumber);
    
    /// @notice Thrown when timelock has not expired
    error TimelockNotExpired(uint256 unlockTime);
    
    // ============ View Functions ============
    
    /// @notice Get protection level for a CP
    /// @param cpNumber Core Principle number (1-5)
    /// @return ProtectionLevel enum value
    function getProtectionLevel(uint8 cpNumber) external view returns (ProtectionLevel);
    
    /// @notice Check if a CP is compliant
    /// @param cpNumber Core Principle number (1-5)
    /// @return True if compliant
    function isCompliant(uint8 cpNumber) external view returns (bool);
    
    /// @notice Check if all CPs are compliant
    /// @return True if all CPs (1-5) are compliant
    function areAllCompliant() external view returns (bool);
    
    /// @notice Get supermajority requirements
    /// @return requirements SupermajorityRequirements struct
    function getSupermajorityRequirements() 
        external view returns (SupermajorityRequirements memory requirements);
    
    /// @notice Get Core Principle details
    /// @param cpNumber Core Principle number (1-5)
    /// @return cp CorePrinciple struct
    function getCorePrinciple(uint8 cpNumber) 
        external view returns (CorePrinciple memory cp);
    
    // ============ CP Definitions (Constants) ============
    
    /// @notice CP-1: Complete Quantum Resistance
    /// @dev IMMUTABLE - NIST-compliant quantum-resistant algorithms only
    /// @return Description string
    function CP1_QUANTUM_RESISTANCE() external pure returns (string memory);
    
    /// @notice CP-2: Self-Custody
    /// @dev IMMUTABLE - Users manage their own private keys
    /// @return Description string
    function CP2_SELF_CUSTODY() external pure returns (string memory);
    
    /// @notice CP-3: Time Lock Existence
    /// @dev SUPERMAJORITY - Time Lock cannot be set to 0
    /// @return Description string
    function CP3_TIMELOCK() external pure returns (string memory);
    
    /// @notice CP-4: Slashing Existence
    /// @dev SUPERMAJORITY - Slashing mechanism cannot be removed
    /// @return Description string
    function CP4_SLASHING() external pure returns (string memory);
    
    /// @notice CP-5: Transparency
    /// @dev SUPERMAJORITY - All operations verifiable on-chain
    /// @return Description string
    function CP5_TRANSPARENCY() external pure returns (string memory);
    
    // ============ State-Changing Functions ============
    
    /// @notice Verify and update CP compliance status
    /// @param cpNumber Core Principle number to verify
    function verifyCompliance(uint8 cpNumber) external;
    
    /// @notice Propose SUPERMAJORITY CP parameter change
    /// @dev Only for CP-3, CP-4, CP-5
    /// @param cpNumber Core Principle number
    /// @param data Proposed change data
    /// @return proposalId Unique proposal identifier
    function proposeSuperMajorityChange(
        uint8 cpNumber,
        bytes calldata data
    ) external returns (bytes32 proposalId);
    
    /// @notice Execute approved supermajority change
    /// @param proposalId Proposal to execute
    function executeSuperMajorityChange(bytes32 proposalId) external;
}
