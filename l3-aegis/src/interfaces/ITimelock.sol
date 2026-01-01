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
    
    /// @notice Emitted when a batch is scheduled
    event BatchScheduled(
        bytes32 indexed batchHash,
        address[] targets,
        uint256[] values,
        bytes[] datas,
        uint256 eta
    );
    
    /// @notice Emitted when a batch is executed
    event BatchExecuted(
        bytes32 indexed batchHash,
        address[] targets,
        uint256[] values,
        bytes[] datas
    );
    
    /// @notice Emitted when a batch is cancelled
    event BatchCancelled(bytes32 indexed batchHash);
    
    /// @notice Emitted when delay is updated
    event DelayUpdated(uint256 oldDelay, uint256 newDelay);
    
    /// @notice Emitted when pending admin is set
    event PendingAdminSet(address indexed pendingAdmin);
    
    /// @notice Emitted when admin is transferred
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    
    // ============ Errors ============
    
    /// @notice Thrown when caller is not authorized
    error NotAuthorized();
    
    /// @notice Thrown when address is invalid
    error InvalidAddress();
    
    /// @notice Thrown when transaction is not queued
    error NotQueued();
    
    /// @notice Thrown when transaction is already queued
    error AlreadyQueued();
    
    /// @notice Thrown when transaction has already been executed
    error AlreadyExecuted();
    
    /// @notice Thrown when transaction was cancelled
    error TransactionCancelled();
    
    /// @notice Thrown when timelock hasn't been met
    error TimeLockNotReady();
    
    /// @notice Thrown when delay not met
    error DelayNotMet();
    
    /// @notice Thrown when transaction has expired (grace period passed)
    error TransactionExpired();
    
    /// @notice Thrown when delay is below minimum
    error DelayBelowMinimum();
    
    /// @notice Thrown when delay is above maximum
    error DelayAboveMaximum();
    
    /// @notice Thrown when caller is not pending admin
    error NotPendingAdmin();
    
    /// @notice Thrown when array lengths mismatch
    error ArrayLengthMismatch();
    
    /// @notice Thrown when transaction execution fails
    error ExecutionFailed();
    
    // ============ Enums ============
    
    /// @notice Transaction state
    enum TransactionState {
        NotQueued,
        Queued,
        Executed,
        Cancelled
    }
    
    // ============ Structs ============
    
    /// @notice Transaction detail
    struct TransactionDetail {
        address target;
        uint256 value;
        bytes data;
        uint256 eta;
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
    
    /// @notice Get transaction hash
    /// @param target Target address
    /// @param value ETH value
    /// @param data Calldata
    /// @param eta Estimated time of execution
    function getTransactionHash(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external pure returns (bytes32);
    
    /// @notice Get batch hash
    /// @param targets Target addresses
    /// @param values ETH values
    /// @param datas Calldatas
    /// @param eta Estimated time of execution
    function getBatchHash(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        uint256 eta
    ) external pure returns (bytes32);
    
    /// @notice Get transaction state
    /// @param txHash Hash of the transaction
    function getTransactionState(bytes32 txHash) external view returns (TransactionState);
    
    /// @notice Get transaction details
    /// @param txHash Hash of the transaction
    function getTransaction(bytes32 txHash) external view returns (TransactionDetail memory);
    
    /// @notice Check if transaction is queued
    /// @param txHash Hash of the transaction
    function isQueued(bytes32 txHash) external view returns (bool);
    
    /// @notice Check if transaction is ready to execute
    /// @param txHash Hash of the transaction
    function isReady(bytes32 txHash) external view returns (bool);
    
    /// @notice Check if transaction is expired
    /// @param txHash Hash of the transaction
    function isExpired(bytes32 txHash) external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice Schedule a transaction for execution
    /// @param target Target address
    /// @param value ETH value
    /// @param data Calldata
    /// @param eta Estimated time of execution
    /// @return txHash Hash of the scheduled transaction
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external returns (bytes32 txHash);
    
    /// @notice Execute a scheduled transaction
    /// @param target Target address
    /// @param value ETH value
    /// @param data Calldata
    /// @param eta Estimated time of execution
    /// @return result Return data from execution
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external payable returns (bytes memory result);
    
    /// @notice Cancel a scheduled transaction
    /// @param target Target address
    /// @param value ETH value
    /// @param data Calldata
    /// @param eta Estimated time of execution
    function cancel(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external;
    
    /// @notice Schedule a batch of transactions
    /// @param targets Target addresses
    /// @param values ETH values
    /// @param datas Calldatas
    /// @param eta Estimated time of execution
    /// @return batchHash Hash of the scheduled batch
    function scheduleBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        uint256 eta
    ) external returns (bytes32 batchHash);
    
    /// @notice Execute a batch of scheduled transactions
    /// @param targets Target addresses
    /// @param values ETH values
    /// @param datas Calldatas
    /// @param eta Estimated time of execution
    /// @return results Return data from each execution
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        uint256 eta
    ) external payable returns (bytes[] memory results);
    
    /// @notice Cancel a batch of scheduled transactions
    /// @param targets Target addresses
    /// @param values ETH values
    /// @param datas Calldatas
    /// @param eta Estimated time of execution
    function cancelBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        uint256 eta
    ) external;
    
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
