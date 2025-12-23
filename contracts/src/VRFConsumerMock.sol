// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVRFConsumer} from "./interfaces/IVRFConsumer.sol";
import {ProverSelector} from "./libraries/ProverSelector.sol";

/// @title VRFConsumerMock - Mock VRF Consumer for Development/Testing
/// @notice Mock implementation for local testing without Chainlink dependencies
/// @dev Day 8-9 VRF Integration (PIR-005) - Mock version for test environment
///
/// For production, this will be replaced with Chainlink VRF v2.5 integration:
/// - VRFConsumerBaseV2Plus inheritance
/// - Subscription-based or direct funding
/// - Proper callback security
contract VRFConsumerMock is IVRFConsumer {
    using ProverSelector for ProverSelector.ProverInfo[];

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice VRF timeout duration (5 minutes per spec)
    uint256 public constant VRF_TIMEOUT = 5 minutes;

    /// @notice Callback gas limit for VRF fulfillment
    uint256 public constant CALLBACK_GAS_LIMIT = 200_000;

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

    // =========================================================================
    // State Variables
    // =========================================================================

    /// @notice Owner of the contract
    address public owner;

    /// @notice L1Vault address that can request VRF
    address public l1Vault;

    /// @notice Counter for mock request IDs
    uint256 private _requestIdCounter;

    /// @notice VRF request ID to unlock request ID mapping
    mapping(uint256 => VRFRequest) public vrfRequests;

    /// @notice Unlock request ID to VRF request ID mapping
    mapping(bytes32 => uint256) public unlockToVRFRequest;

    /// @notice Registered provers for selection
    ProverSelector.ProverInfo[] public proverPool;

    // =========================================================================
    // Events (additional to interface)
    // =========================================================================

    event ProverAdded(address indexed prover, uint256 stake);
    event ProverRemoved(address indexed prover);
    event L1VaultUpdated(address indexed oldVault, address indexed newVault);

    // =========================================================================
    // Errors (additional to interface)
    // =========================================================================

    error NotOwner();
    error NotL1Vault();
    error ZeroAddress();
    error ProverAlreadyExists();
    error RequestNotFound();
    error RequestAlreadyFulfilled();
    error TimeoutNotReached();

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

    constructor(address _l1Vault) {
        owner = msg.sender;
        l1Vault = _l1Vault;
        _requestIdCounter = 1;
    }

    // =========================================================================
    // IVRFConsumer Implementation
    // =========================================================================

    /// @inheritdoc IVRFConsumer
    function requestProverSelection(bytes32 unlockRequestId) external onlyL1Vault returns (uint256 requestId) {
        requestId = _requestIdCounter++;

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
    function triggerFallback(bytes32 unlockRequestId) external returns (address prover) {
        uint256 requestId = unlockToVRFRequest[unlockRequestId];
        if (requestId == 0) revert RequestNotFound();

        VRFRequest storage req = vrfRequests[requestId];
        if (req.fulfilled) revert RequestAlreadyFulfilled();
        if (block.timestamp < req.requestedAt + VRF_TIMEOUT) revert TimeoutNotReached();

        // Use block.prevrandao as fallback entropy source
        uint256 fallbackRandom = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            unlockRequestId,
            block.number
        )));

        prover = _selectProver(fallbackRandom);
        
        req.randomValue = fallbackRandom;
        req.selectedProver = prover;
        req.fulfilled = true;

        emit FallbackProverSelected(unlockRequestId, prover);
    }

    // =========================================================================
    // Mock Functions (for testing)
    // =========================================================================

    /// @notice Mock fulfill VRF request (simulates Chainlink callback)
    /// @dev In production, this would be rawFulfillRandomWords from VRFConsumerBaseV2Plus
    /// @param requestId The VRF request ID
    /// @param randomValue The random value to use
    function mockFulfillRandomWords(uint256 requestId, uint256 randomValue) external onlyOwner {
        VRFRequest storage req = vrfRequests[requestId];
        if (req.unlockRequestId == bytes32(0)) revert RequestNotFound();
        if (req.fulfilled) revert RequestAlreadyFulfilled();

        address prover = _selectProver(randomValue);

        req.randomValue = randomValue;
        req.selectedProver = prover;
        req.fulfilled = true;

        emit VRFReceived(requestId, randomValue);
        emit ProverSelected(req.unlockRequestId, prover, randomValue);
    }

    /// @notice Simulate VRF fulfillment with timestamp-based randomness
    /// @dev Used for local testing without external entropy
    function mockAutoFulfill(uint256 requestId) external {
        VRFRequest storage req = vrfRequests[requestId];
        if (req.unlockRequestId == bytes32(0)) revert RequestNotFound();
        if (req.fulfilled) revert RequestAlreadyFulfilled();

        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            requestId,
            msg.sender
        )));

        address prover = _selectProver(randomValue);

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
    /// @param stake Prover stake amount
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

    /// @notice Remove a prover from the pool
    /// @param prover Prover address to remove
    function removeProver(address prover) external onlyOwner {
        for (uint256 i = 0; i < proverPool.length; i++) {
            if (proverPool[i].prover == prover) {
                proverPool[i].active = false;
                emit ProverRemoved(prover);
                return;
            }
        }
        revert RequestNotFound();
    }

    /// @notice Update prover stake
    /// @param prover Prover address
    /// @param newStake New stake amount
    function updateProverStake(address prover, uint256 newStake) external onlyOwner {
        for (uint256 i = 0; i < proverPool.length; i++) {
            if (proverPool[i].prover == prover) {
                proverPool[i].stake = newStake;
                return;
            }
        }
        revert RequestNotFound();
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

    /// @notice Transfer ownership
    /// @param newOwner New owner address
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
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

    /// @notice Get VRF request details
    function getVRFRequest(uint256 requestId) external view returns (VRFRequest memory) {
        return vrfRequests[requestId];
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /// @notice Internal prover selection using library with `using for` syntax
    function _selectProver(uint256 randomValue) internal view returns (address) {
        if (proverPool.length == 0) revert ProverSelector.NoActiveProvers();
        
        // Create memory copy for library function
        ProverSelector.ProverInfo[] memory provers = proverPool;
        // Use `using for` syntax: provers.selectProver(randomValue)
        (address selected, ) = provers.selectProver(randomValue);
        return selected;
    }
}
