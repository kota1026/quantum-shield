// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ITimelock
/// @notice Interface for Quantum Shield Timelock
/// @dev Per CORE_PRINCIPLES.md CP-3 - Time Lock cannot be reduced to 0
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md GOV-003
interface ITimelock {
    // ============ Events ============
    
    /// @notice Emitted when a transaction is scheduled
    event TransactionScheduled(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        bytes data,
        uint256 eta
    );
    
    /// @notice Emitted when a transaction is executed
    event TransactionExecuted(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        bytes data
    );
    
    /// @notice Emitted when a transaction is cancelled
    event TransactionCancelled(bytes32 indexed txHash);
    
    /// @notice Emitted when delay is updated
    event DelayUpdated(uint256 oldDelay, uint256 newDelay);
    
    /// @notice Emitted when admin is updated
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    
    // ============ Errors ============
    
    /// @notice Thrown when caller is not authorized
    error NotAuthorized();
    
    /// @notice Thrown when transaction doesn't exist
    error TransactionNotFound();
    
    /// @notice Thrown when transaction already exists
    error TransactionAlreadyQueued();
    
    /// @notice Thrown when transaction has already been executed
    error TransactionAlreadyExecuted();
    
    /// @notice Thrown when timelock hasn't been met
    error TimelockNotMet();
    
    /// @notice Thrown when transaction has expired (grace period passed)
    error TransactionExpired();
    
    /// @notice Thrown when delay is below minimum
    error DelayBelowMinimum();
    
    /// @notice Thrown when delay is above maximum
    error DelayAboveMaximum();
    
    /// @notice Thrown when invalid parameters are provided
    error InvalidParameters();
    
    /// @notice Thrown when transaction execution fails
    error ExecutionFailed();
    
    // ============ Structs ============
    
    /// @notice Transaction state
    enum TxState {
        NotQueued,
        Queued,
        Executed,
        Cancelled
    }
    
    /// @notice Transaction data
    struct Transaction {
        address target;
        uint256 value;
        bytes data;
        uint256 eta;
        TxState state;
    }
    
    // ============ View Functions ============
    
    /// @notice Minimum delay (7 days per CORE_PRINCIPLES CP-3)
    function MIN_DELAY() external view returns (uint256);
    
    /// @notice Maximum delay (30 days)
    function MAX_DELAY() external view returns (uint256);
    
    /// @notice Grace period after eta (14 days)
    function GRACE_PERIOD() external view returns (uint256);
    
    /// @notice Current delay value
    function delay() external view returns (uint256);
    
    /// @notice Admin address (Governor contract)
    function admin() external view returns (address);
    
    /// @notice Pending admin address
    function pendingAdmin() external view returns (address);
    
    /// @notice Get transaction details
    /// @param txHash Hash of the transaction
    function getTransaction(bytes32 txHash) external view returns (Transaction memory);
    
    /// @notice Check if transaction is queued
    /// @param txHash Hash of the transaction
    function isQueued(bytes32 txHash) external view returns (bool);
    
    /// @notice Check if transaction is ready to execute
    /// @param txHash Hash of the transaction
    function isReady(bytes32 txHash) external view returns (bool);
    
    /// @notice Compute transaction hash
    /// @param target Target address
    /// @param value ETH value
    /// @param data Calldata
    /// @param eta Estimated time of execution
    function computeTxHash(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external pure returns (bytes32);
    
    // ============ State-Changing Functions ============
    
    /// @notice Schedule a transaction for execution
    /// @param target Target address
    /// @param value ETH value
    /// @param data Calldata
    /// @return txHash Hash of the scheduled transaction
    function schedule(
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (bytes32 txHash);
    
    /// @notice Schedule a batch of transactions
    /// @param targets Target addresses
    /// @param values ETH values
    /// @param datas Calldatas
    /// @return txHashes Hashes of the scheduled transactions
    function scheduleBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external returns (bytes32[] memory txHashes);
    
    /// @notice Execute a scheduled transaction
    /// @param target Target address
    /// @param value ETH value
    /// @param data Calldata
    /// @param eta Estimated time of execution
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external payable;
    
    /// @notice Execute a batch of scheduled transactions
    /// @param targets Target addresses
    /// @param values ETH values
    /// @param datas Calldatas
    /// @param etas Estimated times of execution
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        uint256[] calldata etas
    ) external payable;
    
    /// @notice Cancel a scheduled transaction
    /// @param txHash Hash of the transaction
    function cancel(bytes32 txHash) external;
    
    /// @notice Update the delay
    /// @dev Must be called through timelock itself
    /// @param newDelay New delay value (must be >= MIN_DELAY and <= MAX_DELAY)
    function setDelay(uint256 newDelay) external;
    
    /// @notice Set pending admin
    /// @param newPendingAdmin New pending admin address
    function setPendingAdmin(address newPendingAdmin) external;
    
    /// @notice Accept admin role
    function acceptAdmin() external;
}
