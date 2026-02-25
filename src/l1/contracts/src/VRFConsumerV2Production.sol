// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVRFConsumer} from "./interfaces/IVRFConsumer.sol";
import {ProverSelector} from "./libraries/ProverSelector.sol";
import {VRFConsumerBaseV2Plus} from "./chainlink/VRFConsumerBaseV2Plus.sol";

/// @title VRFConsumerV2Production - Chainlink VRF v2.5 Production Consumer
/// @notice Production VRF consumer with real Chainlink VRF v2.5 integration
/// @dev TASK-P5-005-PROD: Chainlink VRF Production Integration
///
/// This contract implements REAL Chainlink VRF v2.5 calls for production deployment.
/// Key differences from VRFConsumer.sol (simulation):
/// - Inherits VRFConsumerBaseV2Plus for production-ready VRF integration
/// - Makes actual VRF requests to Chainlink Coordinator
/// - Secured callback via rawFulfillRandomWords from Coordinator
///
/// Network Configuration:
/// - Ethereum Mainnet VRF Coordinator: 0x271682DEB8C4E0901D1a1550aD2e64D568E69909
/// - Ethereum Sepolia VRF Coordinator: 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
/// - Arbitrum Mainnet: 0x41034678D6C633D8a95c75e1138A360a28bA15d1
/// - Arbitrum Sepolia: 0x50d47e4142598E3411aA864e08a44284e471AC6f
///
/// Key Hashes (Gas Lanes):
/// - Ethereum Mainnet 200 gwei: 0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef
/// - Ethereum Sepolia 150 gwei: 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c
/// - Arbitrum Mainnet 50 gwei: 0x72d2b016bb5b62912afea355ebf33b91319f828738b111b723b78696b9847b63
/// - Arbitrum Sepolia: 0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414
///
/// Sequence #2 Compliance:
/// - VRF seed取得 ✅ Real Chainlink VRF v2.5 call
/// - Prover選出（2/5） ✅ via weighted stake selection
/// - 5分タイムアウト ✅ VRF_TIMEOUT = 5 minutes
/// - Fallback ✅ uses block.prevrandao
///
/// Security Features:
/// - Only VRF Coordinator can call fulfillRandomWords
/// - Only L1Vault can request prover selection
/// - 2-step ownership transfer recommended
contract VRFConsumerV2Production is IVRFConsumer, VRFConsumerBaseV2Plus {
    using ProverSelector for ProverSelector.ProverInfo[];

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice VRF timeout duration (5 minutes per Sequence #2 spec)
    uint256 public constant VRF_TIMEOUT = 5 minutes;

    /// @notice Default callback gas limit for VRF fulfillment
    uint32 public constant DEFAULT_CALLBACK_GAS_LIMIT = 200_000;

    /// @notice Default request confirmations (Chainlink recommended)
    uint16 public constant DEFAULT_REQUEST_CONFIRMATIONS = 3;

    /// @notice Number of random words to request
    uint32 public constant NUM_WORDS = 1;

    // =========================================================================
    // Structs
    // =========================================================================

    /// @notice VRF request tracking
    struct VRFRequest {
        bytes32 unlockRequestId;
        uint256 requestedAt;
        uint256 randomValue;
        address selectedProver;
        bool fulfilled;
    }

    /// @notice VRF configuration
    struct VRFConfig {
        bytes32 keyHash;
        uint256 subscriptionId;
        uint32 callbackGasLimit;
        uint16 requestConfirmations;
        bool useNativePayment;
    }

    // =========================================================================
    // State Variables
    // =========================================================================

    /// @notice Owner of the contract
    address public owner;

    /// @notice Pending owner for 2-step transfer
    address public pendingOwner;

    /// @notice L1Vault address that can request VRF
    address public l1Vault;

    /// @notice VRF configuration
    VRFConfig public vrfConfig;

    /// @notice VRF request ID to request data mapping
    mapping(uint256 => VRFRequest) public vrfRequests;

    /// @notice Unlock request ID to VRF request ID mapping
    mapping(bytes32 => uint256) public unlockToVRFRequest;

    /// @notice Registered provers for selection
    ProverSelector.ProverInfo[] public proverPool;

    // =========================================================================
    // Events
    // =========================================================================

    event ProverAdded(address indexed prover, uint256 stake);
    event ProverRemoved(address indexed prover);
    event ProverStakeUpdated(address indexed prover, uint256 oldStake, uint256 newStake);
    event L1VaultUpdated(address indexed oldVault, address indexed newVault);
    event VRFConfigUpdated(
        bytes32 keyHash,
        uint256 subscriptionId,
        uint32 callbackGasLimit,
        uint16 requestConfirmations,
        bool useNativePayment
    );
    event VRFCoordinatorUpdated(address indexed oldCoordinator, address indexed newCoordinator);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // =========================================================================
    // Errors
    // =========================================================================

    error NotOwner();
    error NotPendingOwner();
    error NotL1Vault();
    error ZeroAddress();
    error ProverAlreadyExists();
    error ProverNotFound();
    error RequestNotFound();
    error RequestAlreadyFulfilled();
    error TimeoutNotReached();
    error InvalidSubscriptionId();
    error InvalidKeyHash();
    // VRFRequestFailed is inherited from IVRFConsumer

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyL1Vault() {
        if (msg.sender != l1Vault) revert NotL1Vault();
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @notice Initialize Production VRF Consumer
    /// @param _vrfCoordinator Chainlink VRF Coordinator address
    /// @param _l1Vault L1Vault contract address
    /// @param _keyHash Gas lane key hash
    /// @param _subscriptionId VRF subscription ID
    constructor(
        address _vrfCoordinator,
        address _l1Vault,
        bytes32 _keyHash,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        if (_l1Vault == address(0)) revert ZeroAddress();
        if (_keyHash == bytes32(0)) revert InvalidKeyHash();
        if (_subscriptionId == 0) revert InvalidSubscriptionId();

        owner = msg.sender;
        l1Vault = _l1Vault;

        vrfConfig = VRFConfig({
            keyHash: _keyHash,
            subscriptionId: _subscriptionId,
            callbackGasLimit: DEFAULT_CALLBACK_GAS_LIMIT,
            requestConfirmations: DEFAULT_REQUEST_CONFIRMATIONS,
            useNativePayment: false
        });

        emit OwnershipTransferred(address(0), msg.sender);
    }

    // =========================================================================
    // IVRFConsumer Implementation
    // =========================================================================

    /// @inheritdoc IVRFConsumer
    /// @dev Makes REAL Chainlink VRF v2.5 request
    function requestProverSelection(bytes32 unlockRequestId) external onlyL1Vault returns (uint256 requestId) {
        // Request random words from Chainlink VRF v2.5
        if (vrfConfig.useNativePayment) {
            requestId = _requestRandomWordsWithNativePayment(
                vrfConfig.keyHash,
                vrfConfig.subscriptionId,
                vrfConfig.requestConfirmations,
                vrfConfig.callbackGasLimit,
                NUM_WORDS,
                true
            );
        } else {
            requestId = _requestRandomWords(
                vrfConfig.keyHash,
                vrfConfig.subscriptionId,
                vrfConfig.requestConfirmations,
                vrfConfig.callbackGasLimit,
                NUM_WORDS
            );
        }

        vrfRequests[requestId] = VRFRequest({
            unlockRequestId: unlockRequestId,
            requestedAt: block.timestamp,
            randomValue: 0,
            selectedProver: address(0),
            fulfilled: false
        });

        unlockToVRFRequest[unlockRequestId] = requestId;

        emit VRFRequested(requestId, unlockRequestId);
    }

    /// @inheritdoc IVRFConsumer
    function getSelectedProver(bytes32 unlockRequestId) external view returns (address prover, uint256 randomValue) {
        uint256 requestId = unlockToVRFRequest[unlockRequestId];
        if (requestId == 0) return (address(0), 0);

        VRFRequest storage req = vrfRequests[requestId];
        return (req.selectedProver, req.randomValue);
    }

    /// @inheritdoc IVRFConsumer
    function isProverSelected(bytes32 unlockRequestId) external view returns (bool ready) {
        uint256 requestId = unlockToVRFRequest[unlockRequestId];
        if (requestId == 0) return false;
        return vrfRequests[requestId].fulfilled;
    }

    /// @inheritdoc IVRFConsumer
    /// @dev Fallback mechanism using block.prevrandao when VRF times out
    function triggerFallback(bytes32 unlockRequestId) external returns (address prover) {
        uint256 requestId = unlockToVRFRequest[unlockRequestId];
        if (requestId == 0) revert RequestNotFound();

        VRFRequest storage req = vrfRequests[requestId];
        if (req.fulfilled) revert RequestAlreadyFulfilled();

        // 5 minute timeout check
        if (block.timestamp < req.requestedAt + VRF_TIMEOUT) revert TimeoutNotReached();

        // Use block.prevrandao as fallback entropy source
        uint256 fallbackRandom = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            unlockRequestId,
            block.number,
            msg.sender
        )));

        prover = _selectProverSafe(fallbackRandom);

        req.randomValue = fallbackRandom;
        req.selectedProver = prover;
        req.fulfilled = true;

        emit FallbackProverSelected(unlockRequestId, prover);
    }

    // =========================================================================
    // VRF Callback (from VRFConsumerBaseV2Plus)
    // =========================================================================

    /// @notice Chainlink VRF callback function
    /// @dev Called by VRFConsumerBaseV2Plus.rawFulfillRandomWords
    ///      Only VRF Coordinator can trigger this via rawFulfillRandomWords
    /// @param requestId The VRF request ID
    /// @param randomWords Array of random values (we use first one)
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        VRFRequest storage req = vrfRequests[requestId];
        if (req.unlockRequestId == bytes32(0)) revert RequestNotFound();
        if (req.fulfilled) revert RequestAlreadyFulfilled();

        uint256 randomValue = randomWords[0];
        address prover = _selectProverSafe(randomValue);

        req.randomValue = randomValue;
        req.selectedProver = prover;
        req.fulfilled = true;

        emit VRFReceived(requestId, randomValue);
        emit ProverSelected(req.unlockRequestId, prover, randomValue);
    }

    // =========================================================================
    // Prover Management
    // =========================================================================

    /// @notice Add a prover to the pool
    /// @param prover Prover address
    /// @param stake Prover stake amount (affects selection probability)
    function addProver(address prover, uint256 stake) external onlyOwner {
        if (prover == address(0)) revert ZeroAddress();

        // Check if prover already exists
        for (uint256 i = 0; i < proverPool.length; i++) {
            if (proverPool[i].prover == prover) revert ProverAlreadyExists();
        }

        proverPool.push(ProverSelector.ProverInfo({
            prover: prover,
            stake: stake,
            active: true
        }));

        emit ProverAdded(prover, stake);
    }

    /// @notice Remove a prover from the pool (mark inactive)
    /// @param prover Prover address to remove
    function removeProver(address prover) external onlyOwner {
        for (uint256 i = 0; i < proverPool.length; i++) {
            if (proverPool[i].prover == prover) {
                proverPool[i].active = false;
                emit ProverRemoved(prover);
                return;
            }
        }
        revert ProverNotFound();
    }

    /// @notice Update prover stake
    /// @param prover Prover address
    /// @param newStake New stake amount
    function updateProverStake(address prover, uint256 newStake) external onlyOwner {
        for (uint256 i = 0; i < proverPool.length; i++) {
            if (proverPool[i].prover == prover) {
                uint256 oldStake = proverPool[i].stake;
                proverPool[i].stake = newStake;
                emit ProverStakeUpdated(prover, oldStake, newStake);
                return;
            }
        }
        revert ProverNotFound();
    }

    /// @notice Reactivate a previously removed prover
    /// @param prover Prover address to reactivate
    function reactivateProver(address prover) external onlyOwner {
        for (uint256 i = 0; i < proverPool.length; i++) {
            if (proverPool[i].prover == prover) {
                proverPool[i].active = true;
                emit ProverAdded(prover, proverPool[i].stake);
                return;
            }
        }
        revert ProverNotFound();
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    /// @notice Update L1Vault address
    /// @param newL1Vault New L1Vault address
    function setL1Vault(address newL1Vault) external onlyOwner {
        if (newL1Vault == address(0)) revert ZeroAddress();
        address oldVault = l1Vault;
        l1Vault = newL1Vault;
        emit L1VaultUpdated(oldVault, newL1Vault);
    }

    /// @notice Update VRF configuration
    /// @param _keyHash New gas lane key hash
    /// @param _subscriptionId New subscription ID
    /// @param _callbackGasLimit New callback gas limit
    /// @param _requestConfirmations New request confirmations
    /// @param _useNativePayment Whether to use native token for payment
    function setVRFConfig(
        bytes32 _keyHash,
        uint256 _subscriptionId,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        bool _useNativePayment
    ) external onlyOwner {
        if (_keyHash == bytes32(0)) revert InvalidKeyHash();
        if (_subscriptionId == 0) revert InvalidSubscriptionId();

        vrfConfig = VRFConfig({
            keyHash: _keyHash,
            subscriptionId: _subscriptionId,
            callbackGasLimit: _callbackGasLimit,
            requestConfirmations: _requestConfirmations,
            useNativePayment: _useNativePayment
        });

        emit VRFConfigUpdated(
            _keyHash,
            _subscriptionId,
            _callbackGasLimit,
            _requestConfirmations,
            _useNativePayment
        );
    }

    /// @notice Update VRF Coordinator address
    /// @dev Use with caution - only for coordinator upgrades
    /// @param newCoordinator New VRF Coordinator address
    function setVRFCoordinator(address newCoordinator) external onlyOwner {
        address oldCoordinator = address(s_vrfCoordinator);
        _setVRFCoordinator(newCoordinator);
        emit VRFCoordinatorUpdated(oldCoordinator, newCoordinator);
    }

    /// @notice Start ownership transfer (2-step process)
    /// @param newOwner New owner address
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Accept ownership transfer (2-step process)
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(oldOwner, msg.sender);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /// @notice Get prover pool length
    function getProverPoolLength() external view returns (uint256) {
        return proverPool.length;
    }

    /// @notice Get prover info by index
    function getProverByIndex(uint256 index) external view returns (ProverSelector.ProverInfo memory) {
        return proverPool[index];
    }

    /// @notice Get all provers
    function getAllProvers() external view returns (ProverSelector.ProverInfo[] memory) {
        return proverPool;
    }

    /// @notice Get active provers count
    function getActiveProverCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < proverPool.length; i++) {
            if (proverPool[i].active) count++;
        }
    }

    /// @notice Get VRF request details
    function getVRFRequest(uint256 requestId) external view returns (VRFRequest memory) {
        return vrfRequests[requestId];
    }

    /// @notice Get VRF configuration
    function getVRFConfig() external view returns (VRFConfig memory) {
        return vrfConfig;
    }

    /// @notice Check VRF timeout status
    /// @param unlockRequestId The unlock request ID
    /// @return isTimedOut True if VRF has timed out
    /// @return timeRemaining Seconds remaining until timeout
    function checkTimeout(bytes32 unlockRequestId) external view returns (bool isTimedOut, uint256 timeRemaining) {
        uint256 requestId = unlockToVRFRequest[unlockRequestId];
        if (requestId == 0) return (false, 0);

        VRFRequest storage req = vrfRequests[requestId];
        uint256 deadline = req.requestedAt + VRF_TIMEOUT;

        if (block.timestamp >= deadline) {
            return (true, 0);
        } else {
            return (false, deadline - block.timestamp);
        }
    }

    /// @notice Get VRF Coordinator address
    function getVRFCoordinator() external view returns (address) {
        return address(s_vrfCoordinator);
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /// @notice Safe wrapper for prover selection with proper error handling
    /// @param randomValue Random value for selection
    /// @return selected The selected prover address
    function _selectProverSafe(uint256 randomValue) internal view returns (address selected) {
        if (proverPool.length == 0) revert ProverSelector.NoActiveProvers();

        // Check for active provers first
        bool hasActiveProver = false;
        for (uint256 i = 0; i < proverPool.length; i++) {
            if (proverPool[i].active) {
                hasActiveProver = true;
                break;
            }
        }
        if (!hasActiveProver) revert ProverSelector.NoActiveProvers();

        // Create memory copy for library function
        ProverSelector.ProverInfo[] memory provers = proverPool;

        // Use ProverSelector library for weighted selection
        (selected, ) = provers.selectProver(randomValue);

        // Verify we got a valid result
        if (selected == address(0)) revert ProverSelector.NoActiveProvers();

        return selected;
    }
}
