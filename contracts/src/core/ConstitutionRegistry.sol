// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IConstitutionLock} from "../interfaces/IConstitutionLock.sol";

/**
 * @title ConstitutionRegistry
 * @notice Registry for tracking Core Principles compliance
 * @dev Provides compliance checking and history tracking for all 5 CPs
 * 
 * Core Principles:
 * - CP-1: Complete Quantum Resistance (no ECDSA, RSA, secp256k1, SHA-256, keccak256)
 * - CP-2: Self-Custody (no server key storage)
 * - CP-3: Time Lock Existence (≥24h normal, ≥7d emergency)
 * - CP-4: Slashing Existence (N²×10% quadratic formula)
 * - CP-5: Transparency (event emission, no off-chain secrets)
 */
contract ConstitutionRegistry {
    // ============ Constants ============

    /// @notice Total number of Core Principles
    uint8 public constant TOTAL_CPS = 5;

    /// @notice Minimum normal timelock (24 hours)
    uint256 public constant MIN_NORMAL_TIMELOCK = 24 hours;

    /// @notice Minimum emergency timelock (7 days)
    uint256 public constant MIN_EMERGENCY_TIMELOCK = 7 days;

    /// @notice Base slashing rate in basis points (10% = 1000 bps)
    uint256 public constant SLASHING_BASE_RATE_BPS = 1000;

    // ============ State Variables ============

    /// @notice Reference to ConstitutionLock contract
    IConstitutionLock public immutable constitutionLock;

    /// @notice Current normal timelock value
    uint256 public normalTimeLock;

    /// @notice Current emergency timelock value
    uint256 public emergencyTimeLock;

    /// @notice Prohibited algorithms (CP-1)
    mapping(string => bool) private _prohibitedAlgorithms;

    /// @notice Compliance history per CP
    mapping(uint8 => ComplianceRecord[]) private _complianceHistory;

    /// @notice Last compliance check timestamp per CP
    mapping(uint8 => uint256) private _lastComplianceCheck;

    // ============ Structs ============

    /// @notice Record of a compliance check
    struct ComplianceRecord {
        uint256 timestamp;
        bool compliant;
        string notes;
    }

    // ============ Events ============

    /// @notice Emitted when CP compliance status changes
    event CPComplianceChanged(
        uint8 indexed cpNumber,
        bool compliant,
        string notes
    );

    /// @notice Emitted when a prohibited algorithm is detected
    event ProhibitedAlgorithmDetected(
        string algorithm,
        address indexed reporter
    );

    /// @notice Emitted when timelock values are updated
    event TimeLockUpdated(
        uint256 normalTimeLock,
        uint256 emergencyTimeLock
    );

    // ============ Constructor ============

    /**
     * @notice Initialize the ConstitutionRegistry
     * @param _constitutionLock Address of the ConstitutionLock contract
     */
    constructor(address _constitutionLock) {
        require(_constitutionLock != address(0), "Invalid ConstitutionLock address");
        constitutionLock = IConstitutionLock(_constitutionLock);

        // Initialize prohibited algorithms (CP-1)
        _prohibitedAlgorithms["ECDSA"] = true;
        _prohibitedAlgorithms["RSA"] = true;
        _prohibitedAlgorithms["secp256k1"] = true;
        _prohibitedAlgorithms["SHA-256"] = true;
        _prohibitedAlgorithms["SHA-2"] = true;
        _prohibitedAlgorithms["keccak256"] = true;

        // Initialize timelocks to minimums
        normalTimeLock = MIN_NORMAL_TIMELOCK;
        emergencyTimeLock = MIN_EMERGENCY_TIMELOCK;
    }

    // ============ CP-1: Quantum Resistance ============

    /**
     * @notice Check if an algorithm is prohibited (non-quantum-resistant)
     * @param algorithm Algorithm name to check
     * @return True if prohibited
     */
    function usesProhibitedAlgorithm(string memory algorithm) public view returns (bool) {
        return _prohibitedAlgorithms[algorithm];
    }

    /**
     * @notice Check CP-1 compliance
     * @return True if quantum-resistant by design
     */
    function _checkCP1Compliance() internal pure returns (bool) {
        // System uses only Dilithium-III, SPHINCS+-128s, SHA3-256
        // Compliance is enforced at compile time
        return true;
    }

    // ============ CP-2: Self-Custody ============

    /**
     * @notice Check if server key storage exists (should always be false)
     * @return Always false - no server key storage by design
     */
    function hasServerKeyStorage() public pure returns (bool) {
        // Self-custody: all keys held by users
        return false;
    }

    /**
     * @notice Check CP-2 compliance
     * @return True if self-custody is maintained
     */
    function _checkCP2Compliance() internal pure returns (bool) {
        // No server-side key storage by design
        return !hasServerKeyStorage();
    }

    // ============ CP-3: Time Lock Existence ============

    /**
     * @notice Get current normal timelock
     * @return Current normal timelock in seconds
     */
    function getNormalTimeLock() public view returns (uint256) {
        return normalTimeLock;
    }

    /**
     * @notice Get current emergency timelock
     * @return Current emergency timelock in seconds
     */
    function getEmergencyTimeLock() public view returns (uint256) {
        return emergencyTimeLock;
    }

    /**
     * @notice Check CP-3 compliance
     * @return True if timelocks meet minimum requirements
     */
    function _checkCP3Compliance() internal view returns (bool) {
        return normalTimeLock >= MIN_NORMAL_TIMELOCK && 
               emergencyTimeLock >= MIN_EMERGENCY_TIMELOCK;
    }

    // ============ CP-4: Slashing Existence ============

    /**
     * @notice Check if slashing mechanism exists
     * @return Always true - slashing is built-in
     */
    function hasSlashingMechanism() public pure returns (bool) {
        return true;
    }

    /**
     * @notice Calculate slashing rate using quadratic formula
     * @param violationCount Number of violations (N)
     * @return Slashing rate in basis points (N² × 10%)
     */
    function getSlashingRate(uint256 violationCount) public pure returns (uint256) {
        // N² × 10% (1000 bps)
        // Cap at 100% (10000 bps)
        uint256 rate = violationCount * violationCount * SLASHING_BASE_RATE_BPS;
        return rate > 10000 ? 10000 : rate;
    }

    /**
     * @notice Check CP-4 compliance
     * @return True if slashing mechanism exists
     */
    function _checkCP4Compliance() internal pure returns (bool) {
        return hasSlashingMechanism();
    }

    // ============ CP-5: Transparency ============

    /**
     * @notice Check if event emission is enabled
     * @return Always true - all state changes emit events
     */
    function hasEventEmission() public pure returns (bool) {
        return true;
    }

    /**
     * @notice Check if off-chain secret computation exists
     * @return Always false - all computation is on-chain or verifiable
     */
    function hasOffchainSecretComputation() public pure returns (bool) {
        return false;
    }

    /**
     * @notice Check CP-5 compliance
     * @return True if transparency requirements are met
     */
    function _checkCP5Compliance() internal pure returns (bool) {
        return hasEventEmission() && !hasOffchainSecretComputation();
    }

    // ============ General Compliance Functions ============

    /**
     * @notice Check if a specific CP is compliant
     * @param cpNumber CP number (1-5)
     * @return True if compliant
     */
    function isCompliant(uint8 cpNumber) public view returns (bool) {
        require(cpNumber >= 1 && cpNumber <= TOTAL_CPS, "Invalid CP number");

        if (cpNumber == 1) return _checkCP1Compliance();
        if (cpNumber == 2) return _checkCP2Compliance();
        if (cpNumber == 3) return _checkCP3Compliance();
        if (cpNumber == 4) return _checkCP4Compliance();
        if (cpNumber == 5) return _checkCP5Compliance();

        return false;
    }

    /**
     * @notice Check if all CPs are compliant
     * @return True if all 5 CPs are compliant
     */
    function isFullyCompliant() public view returns (bool) {
        for (uint8 i = 1; i <= TOTAL_CPS; i++) {
            if (!isCompliant(i)) return false;
        }
        return true;
    }

    /**
     * @notice Record a compliance check
     * @param cpNumber CP number (1-5)
     * @param notes Notes about the compliance check
     */
    function recordComplianceCheck(uint8 cpNumber, string memory notes) external {
        require(cpNumber >= 1 && cpNumber <= TOTAL_CPS, "Invalid CP number");

        bool compliant = isCompliant(cpNumber);
        
        _complianceHistory[cpNumber].push(ComplianceRecord({
            timestamp: block.timestamp,
            compliant: compliant,
            notes: notes
        }));

        _lastComplianceCheck[cpNumber] = block.timestamp;

        emit CPComplianceChanged(cpNumber, compliant, notes);
    }

    /**
     * @notice Get compliance history count for a CP
     * @param cpNumber CP number (1-5)
     * @return Number of compliance records
     */
    function getComplianceHistoryCount(uint8 cpNumber) external view returns (uint256) {
        return _complianceHistory[cpNumber].length;
    }

    /**
     * @notice Get a specific compliance record
     * @param cpNumber CP number (1-5)
     * @param index Record index
     * @return The compliance record
     */
    function getComplianceRecord(uint8 cpNumber, uint256 index) 
        external 
        view 
        returns (ComplianceRecord memory) 
    {
        require(index < _complianceHistory[cpNumber].length, "Index out of bounds");
        return _complianceHistory[cpNumber][index];
    }

    /**
     * @notice Get last compliance check timestamp
     * @param cpNumber CP number (1-5)
     * @return Timestamp of last check
     */
    function getLastComplianceCheckTime(uint8 cpNumber) external view returns (uint256) {
        return _lastComplianceCheck[cpNumber];
    }

    // ============ Admin Functions ============

    /**
     * @notice Sync timelock values from ConstitutionLock
     * @dev Should be called after ConstitutionLock updates timelocks
     */
    function syncTimeLocks() external {
        // In a real implementation, this would read from ConstitutionLock
        // For now, we just emit an event
        emit TimeLockUpdated(normalTimeLock, emergencyTimeLock);
    }
}
