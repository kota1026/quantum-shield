// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ITimelock.sol";
import "../crypto/SHA3Hasher.sol";

/// @title Timelock
/// @notice Quantum Shield Timelock Controller - enforces delay on governance actions
/// @dev Per CURRENT_PLAN.md GOV-003 and CORE_PRINCIPLES.md CP-3
/// @custom:security-contact security@quantumshield.io
/// @custom:invariant MIN_DELAY can never be reduced below 7 days (CP-3)
contract Timelock is ITimelock {
    // ============ Constants ============
    
    /// @inheritdoc ITimelock
    uint256 public constant override MIN_DELAY = 7 days;
    
    /// @inheritdoc ITimelock
    uint256 public constant override MAX_DELAY = 30 days;
    
    /// @inheritdoc ITimelock
    uint256 public constant override GRACE_PERIOD = 14 days;
    
    // ============ State Variables ============
    
    /// @inheritdoc ITimelock
    address public override admin;
    
    /// @inheritdoc ITimelock
    address public override pendingAdmin;
    
    /// @inheritdoc ITimelock
    uint256 public override delay;
    
    /// @notice Transaction state storage
    mapping(bytes32 => TransactionState) private _transactionStates;
    
    /// @notice Transaction details storage
    mapping(bytes32 => TransactionDetail) private _transactionDetails;
    
    // ============ Modifiers ============
    
    /// @notice Restricts access to admin only
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAuthorized();
        _;
    }
    
    /// @notice Restricts access to timelock itself (for self-governance)
    modifier onlyTimelock() {
        if (msg.sender != address(this)) revert NotAuthorized();
        _;
    }
    
    // ============ Constructor ============
    
    /// @notice Initializes the Timelock with admin and initial delay
    /// @param _admin Initial admin address
    /// @param _delay Initial delay (must be >= MIN_DELAY and <= MAX_DELAY)
    constructor(address _admin, uint256 _delay) {
        if (_admin == address(0)) revert InvalidAddress();
        if (_delay < MIN_DELAY) revert DelayBelowMinimum();
        if (_delay > MAX_DELAY) revert DelayAboveMaximum();
        
        admin = _admin;
        delay = _delay;
        
        emit AdminTransferred(address(0), _admin);
        emit DelayUpdated(0, _delay);
    }
    
    // ============ Core Functions ============
    
    /// @inheritdoc ITimelock
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external override onlyAdmin returns (bytes32 txHash) {
        if (target == address(0)) revert InvalidAddress();
        if (eta < block.timestamp + delay) revert DelayNotMet();
        
        txHash = getTransactionHash(target, value, data, eta);
        
        if (_transactionStates[txHash] != TransactionState.NotQueued) {
            revert AlreadyQueued();
        }
        
        _transactionStates[txHash] = TransactionState.Queued;
        _transactionDetails[txHash] = TransactionDetail({
            target: target,
            value: value,
            data: data,
            eta: eta
        });
        
        emit TransactionScheduled(txHash, target, value, data, eta);
    }
    
    /// @inheritdoc ITimelock
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external payable override onlyAdmin returns (bytes memory result) {
        bytes32 txHash = getTransactionHash(target, value, data, eta);
        
        TransactionState state = _transactionStates[txHash];
        if (state == TransactionState.NotQueued) revert NotQueued();
        if (state == TransactionState.Executed) revert AlreadyExecuted();
        if (state == TransactionState.Cancelled) revert TransactionWasCancelled();
        
        if (block.timestamp < eta) revert TimeLockNotReady();
        if (block.timestamp > eta + GRACE_PERIOD) revert TransactionExpired();
        
        _transactionStates[txHash] = TransactionState.Executed;
        
        // Execute the transaction
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        if (!success) {
            // Bubble up the revert reason
            if (returnData.length > 0) {
                assembly {
                    let returnDataSize := mload(returnData)
                    revert(add(32, returnData), returnDataSize)
                }
            } else {
                revert ExecutionFailed();
            }
        }
        
        emit TransactionExecuted(txHash, target, value, data);
        
        return returnData;
    }
    
    /// @inheritdoc ITimelock
    function cancel(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) external override onlyAdmin {
        bytes32 txHash = getTransactionHash(target, value, data, eta);
        
        if (_transactionStates[txHash] != TransactionState.Queued) {
            revert NotQueued();
        }
        
        _transactionStates[txHash] = TransactionState.Cancelled;
        
        emit TransactionCancelled(txHash);
    }
    
    // ============ Batch Operations ============
    
    /// @inheritdoc ITimelock
    function scheduleBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        uint256 eta
    ) external override onlyAdmin returns (bytes32 batchHash) {
        if (targets.length != values.length || targets.length != datas.length) {
            revert ArrayLengthMismatch();
        }
        if (targets.length == 0) revert InvalidAddress();
        if (eta < block.timestamp + delay) revert DelayNotMet();
        
        batchHash = getBatchHash(targets, values, datas, eta);
        
        if (_transactionStates[batchHash] != TransactionState.NotQueued) {
            revert AlreadyQueued();
        }
        
        _transactionStates[batchHash] = TransactionState.Queued;
        
        // Store batch info (simplified - stores hash only)
        _transactionDetails[batchHash] = TransactionDetail({
            target: address(0), // Indicates batch
            value: targets.length,
            data: abi.encode(targets, values, datas),
            eta: eta
        });
        
        emit BatchScheduled(batchHash, targets, values, datas, eta);
    }
    
    /// @inheritdoc ITimelock
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        uint256 eta
    ) external payable override onlyAdmin returns (bytes[] memory results) {
        if (targets.length != values.length || targets.length != datas.length) {
            revert ArrayLengthMismatch();
        }
        
        bytes32 batchHash = getBatchHash(targets, values, datas, eta);
        
        TransactionState state = _transactionStates[batchHash];
        if (state == TransactionState.NotQueued) revert NotQueued();
        if (state == TransactionState.Executed) revert AlreadyExecuted();
        if (state == TransactionState.Cancelled) revert TransactionWasCancelled();
        
        if (block.timestamp < eta) revert TimeLockNotReady();
        if (block.timestamp > eta + GRACE_PERIOD) revert TransactionExpired();
        
        _transactionStates[batchHash] = TransactionState.Executed;
        
        results = new bytes[](targets.length);
        
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, bytes memory returnData) = targets[i].call{value: values[i]}(datas[i]);
            if (!success) {
                if (returnData.length > 0) {
                    assembly {
                        let returnDataSize := mload(returnData)
                        revert(add(32, returnData), returnDataSize)
                    }
                } else {
                    revert ExecutionFailed();
                }
            }
            results[i] = returnData;
        }
        
        emit BatchExecuted(batchHash, targets, values, datas);
    }
    
    /// @inheritdoc ITimelock
    function cancelBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        uint256 eta
    ) external override onlyAdmin {
        bytes32 batchHash = getBatchHash(targets, values, datas, eta);
        
        if (_transactionStates[batchHash] != TransactionState.Queued) {
            revert NotQueued();
        }
        
        _transactionStates[batchHash] = TransactionState.Cancelled;
        
        emit BatchCancelled(batchHash);
    }
    
    // ============ Admin Functions ============
    
    /// @inheritdoc ITimelock
    function setDelay(uint256 newDelay) external override onlyTimelock {
        // CP-3: Delay cannot be reduced below minimum
        if (newDelay < MIN_DELAY) revert DelayBelowMinimum();
        if (newDelay > MAX_DELAY) revert DelayAboveMaximum();
        
        uint256 oldDelay = delay;
        delay = newDelay;
        
        emit DelayUpdated(oldDelay, newDelay);
    }
    
    /// @inheritdoc ITimelock
    function setPendingAdmin(address newPendingAdmin) external override onlyTimelock {
        if (newPendingAdmin == address(0)) revert InvalidAddress();
        
        pendingAdmin = newPendingAdmin;
        
        emit PendingAdminSet(newPendingAdmin);
    }
    
    /// @inheritdoc ITimelock
    function acceptAdmin() external override {
        if (msg.sender != pendingAdmin) revert NotPendingAdmin();
        
        address oldAdmin = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        
        emit AdminTransferred(oldAdmin, admin);
    }
    
    // ============ View Functions ============
    
    /// @inheritdoc ITimelock
    function getTransactionHash(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 eta
    ) public pure override returns (bytes32) {
        // CP-1 Compliant: Using SHA3-256 for all hashing operations
        return SHA3Hasher.hash(abi.encode(target, value, data, eta));
    }
    
    /// @inheritdoc ITimelock
    function getBatchHash(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        uint256 eta
    ) public pure override returns (bytes32) {
        // CP-1 Compliant: Using SHA3-256 for all hashing operations
        return SHA3Hasher.hash(abi.encode(targets, values, datas, eta));
    }
    
    /// @inheritdoc ITimelock
    function getTransactionState(bytes32 txHash) external view override returns (TransactionState) {
        return _transactionStates[txHash];
    }
    
    /// @inheritdoc ITimelock
    function getTransaction(bytes32 txHash) external view override returns (TransactionDetail memory) {
        return _transactionDetails[txHash];
    }
    
    /// @inheritdoc ITimelock
    function isQueued(bytes32 txHash) external view override returns (bool) {
        return _transactionStates[txHash] == TransactionState.Queued;
    }
    
    /// @inheritdoc ITimelock
    function isReady(bytes32 txHash) external view override returns (bool) {
        if (_transactionStates[txHash] != TransactionState.Queued) {
            return false;
        }
        TransactionDetail memory txn = _transactionDetails[txHash];
        return block.timestamp >= txn.eta && block.timestamp <= txn.eta + GRACE_PERIOD;
    }
    
    /// @inheritdoc ITimelock
    function isExpired(bytes32 txHash) external view override returns (bool) {
        TransactionDetail memory txn = _transactionDetails[txHash];
        return txn.eta > 0 && block.timestamp > txn.eta + GRACE_PERIOD;
    }
    
    // ============ Receive Ether ============
    
    /// @notice Allows contract to receive Ether for transaction execution
    receive() external payable {}
}
