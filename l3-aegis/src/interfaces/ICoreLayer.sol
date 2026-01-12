// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ICoreLayer
/// @notice Interface for the Core Layer - always ON, immutable CP protection
/// @dev Part of Quantum Shield's Modular Architecture (MODULAR_ARCHITECTURE.md §3.3)
/// @dev Implements Sequences #1-4, #3' per SPEC_STRATEGY_BRIDGE.md §3
/// @custom:security-contact security@quantumshield.io
interface ICoreLayer {
    // ============ Structs ============
    
    /// @notice Bridge transaction structure
    struct BridgeTx {
        bytes32 txHash;
        address token;
        uint256 amount;
        bytes32 recipient;  // Quantum-resistant recipient identifier
        uint256 timestamp;
        uint256 unlockTime;
        bool isEmergency;
        bool executed;
    }
    
    // ============ Events ============
    
    /// @notice Emitted on asset lock (Sequence #1)
    /// @param txHash Unique transaction hash
    /// @param sender L1 sender address
    /// @param token Token address (address(0) for ETH)
    /// @param amount Amount locked
    /// @param recipient L3 recipient identifier
    event AssetLocked(
        bytes32 indexed txHash,
        address indexed sender,
        address indexed token,
        uint256 amount,
        bytes32 recipient
    );
    
    /// @notice Emitted on asset unlock (Sequence #2, #3)
    /// @param txHash Transaction hash being unlocked
    /// @param recipient L1 recipient address
    /// @param amount Amount unlocked
    /// @param isEmergency True if emergency unlock
    event AssetUnlocked(
        bytes32 indexed txHash,
        address indexed recipient,
        uint256 amount,
        bool isEmergency
    );
    
    /// @notice Emitted on state verification
    /// @param stateRoot State root being verified
    /// @param verified True if verification passed
    event StateVerified(
        bytes32 indexed stateRoot,
        bool verified
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when state verification fails
    error StateVerificationFailed();
    
    /// @notice Thrown when unlock time has not passed
    error TimeLockNotExpired(uint256 unlockTime, uint256 currentTime);
    
    /// @notice Thrown when transaction not found
    error TransactionNotFound(bytes32 txHash);
    
    /// @notice Thrown when transaction already executed
    error TransactionAlreadyExecuted(bytes32 txHash);
    
    /// @notice Thrown when amount is invalid
    error InvalidAmount();
    
    /// @notice Thrown when CP compliance check fails
    error CPComplianceFailed(uint8 cpNumber);
    
    // ============ Constants ============
    
    /// @notice Normal unlock time lock (24 hours) - SEQ#2
    /// @dev CP-3: Cannot be set to 0
    function NORMAL_TIMELOCK() external view returns (uint256);
    
    /// @notice Emergency unlock time lock (7 days) - SEQ#3
    /// @dev CP-3: Cannot be reduced below 7 days
    function EMERGENCY_TIMELOCK() external view returns (uint256);
    
    /// @notice Emergency timeout (72 hours) - SEQ#3
    function EMERGENCY_TIMEOUT() external view returns (uint256);
    
    // ============ Core Functions - Sequences #1-4, #3' ============
    
    /// @notice Lock assets on L1 bridge (Sequence #1)
    /// @param token Token address (address(0) for ETH)
    /// @param amount Amount to lock
    /// @param recipient L3 recipient identifier (quantum-resistant)
    /// @return txHash Unique transaction hash
    function lock(
        address token,
        uint256 amount,
        bytes32 recipient
    ) external payable returns (bytes32 txHash);
    
    /// @notice Normal unlock with proof (Sequence #2)
    /// @param txHash Transaction hash to unlock
    /// @param proof STARK proof of state transition
    /// @param recipient L1 recipient address
    function unlock(
        bytes32 txHash,
        bytes calldata proof,
        address recipient
    ) external;
    
    /// @notice Emergency unlock with bond (Sequence #3)
    /// @param txHash Transaction hash to unlock
    /// @param recipient L1 recipient address
    function emergencyUnlock(
        bytes32 txHash,
        address recipient
    ) external payable;
    
    /// @notice Resync state after emergency (Sequence #3')
    /// @param txHash Transaction hash to resync
    /// @param newStateRoot New state root
    /// @param proof STARK proof of new state
    function resync(
        bytes32 txHash,
        bytes32 newStateRoot,
        bytes calldata proof
    ) external;
    
    // ============ State Verification ============
    
    /// @notice Verify state with STARK proof
    /// @param stateRoot State root to verify
    /// @param proof STARK proof
    /// @return True if verification passes
    function verifyState(
        bytes32 stateRoot,
        bytes calldata proof
    ) external view returns (bool);
    
    /// @notice Get current state root
    /// @return Current verified state root
    function getStateRoot() external view returns (bytes32);
    
    // ============ CP Protection ============
    
    /// @notice Verify all CPs are compliant
    /// @return True if all CPs pass
    function verifyCPCompliance() external view returns (bool);
    
    /// @notice Get protection level for a specific CP
    /// @param cpNumber CP number (1-5)
    /// @return Protection level string
    function getCPProtectionLevel(uint8 cpNumber) external view returns (string memory);
    
    // ============ View Functions ============
    
    /// @notice Get transaction details
    /// @param txHash Transaction hash
    /// @return tx Bridge transaction struct
    function getTransaction(bytes32 txHash) external view returns (BridgeTx memory tx);
    
    /// @notice Calculate emergency bond
    /// @param amount Transaction amount
    /// @return bond Required bond amount (MAX(0.5 ETH, amount * 5%))
    function calculateEmergencyBond(uint256 amount) external pure returns (uint256 bond);
}
