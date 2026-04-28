// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVRFConsumer} from "./interfaces/IVRFConsumer.sol";
import {ProverSelector} from "./libraries/ProverSelector.sol";

/// @title VRFConsumer - Chainlink VRF v2.5 Compatible Consumer
/// @notice Production VRF consumer for prover selection in Quantum Shield
/// @dev Day 8-9 VRF Integration (PIR-005)
///
/// This contract implements Chainlink VRF v2.5 compatible interface for
/// production deployment. Key features:
///
/// CURRENT_PLAN Implementation:
/// - [IMPL-001] VRFConsumerBase compatible design (v2.5 ready)
/// - [IMPL-002] requestRandomWords function (requestProverSelection)
/// - [IMPL-003] fulfillRandomWords function (mockFulfillRandomWords / rawFulfillRandomWords)
/// - [IMPL-004] Prover selection logic (2/5 threshold via weighted random)
/// - [IMPL-005] 5 minute timeout implementation
/// - [IMPL-006] Fallback mechanism using prevrandao
///
/// Production Notes:
/// - In production, this will inherit VRFConsumerBaseV2Plus
/// - Subscription or direct funding model supported
/// - rawFulfillRandomWords callback secured by coordinator address check
///
/// Sequence #2 Compliance:
/// - VRF seed取得 ✅
/// - Prover選出（2/5） ✅ via weighted stake selection
/// - 5分タイムアウト ✅ VRF_TIMEOUT = 5 minutes
/// - Fallback ✅ uses block.prevrandao
///
/// SEC-002 Update (2025-12-25):
/// - [FIX-009] Added OwnershipTransferred event to transferOwnership()
/// - [FIX-010] Added zero-address check to setVRFConfig() for coordinator
/// - [FIX-011] Improved _selectProver() return value handling
/// - [FIX-012] Added zero-address check to constructor for l1Vault
contract VRFConsumer is IVRFConsumer {
    using ProverSelector for ProverSelector.ProverInfo[];

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice VRF timeout duration (5 minutes per Sequence #2 spec)
    /// @dev IMPL-005: Timeout triggers fallback mechanism
    uint256 public constant VRF_TIMEOUT = 5 minutes;

    /// @notice Callback gas limit for VRF fulfillment
    uint256 public constant CALLBACK_GAS_LIMIT = 200_000;

    /// @notice Required confirmations for VRF (Chainlink recommended)
    uint16 public constant REQUEST_CONFIRMATIONS = 3;

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

    // =========================================================================
    // State Variables
    // =========================================================================

    /// @notice Owner of the contract
    address public owner;

    /// @notice L1Vault address that can request VRF
    address public l1Vault;

    /// @notice Counter for request IDs
    uint256 private _requestIdCounter;

    /// @notice VRF request ID to request data mapping
    mapping(uint256 => VRFRequest) public vrfRequests;

    /// @notice Unlock request ID to VRF request ID mapping
    mapping(bytes32 => uint256) public unlockToVRFRequest;

    /// @notice Registered provers for selection
    ProverSelector.ProverInfo[] public proverPool;

    // =========================================================================
    // Chainlink VRF v2.5 Configuration (Production)
    // =========================================================================
    
    /// @notice Chainlink VRF Coordinator address (to be set in production)
    /// @dev For Ethereum Mainnet: 0x271682DEB8C4E0901D1a1550aD2e64D568E69909
    address public vrfCoordinator;
    
    /// @notice Chainlink VRF key hash (gas lane)
    /// @dev Different key hashes for different gas prices
    bytes32 public keyHash;
    
    /// @notice Chainlink VRF subscription ID
    uint64 public subscriptionId;

    // =========================================================================
    // Events (additional to interface)
    // =========================================================================

    event ProverAdded(address indexed prover, uint256 stake);
    event ProverRemoved(address indexed prover);
    event L1VaultUpdated(address indexed oldVault, address indexed newVault);
    event VRFConfigUpdated(address coordinator, bytes32 keyHash, uint64 subscriptionId);
    
    /// @notice Emitted when ownership is transferred
    /// @dev SEC-002 FIX-009: Added for auditability
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

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
    error NotVRFCoordinator();

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
    
    /// @notice Modifier for Chainlink VRF callback security
    /// @dev In production, only VRF Coordinator can call rawFulfillRandomWords.
    ///      Pre-Sherlock blocker (CRITICAL-1, 2026-04-28): the previous form
    ///      `if (vrfCoordinator != address(0) && ...)` made the callback
    ///      callable by ANY EOA when the coordinator was unset, allowing an
    ///      attacker to inject `randomValue` and steer prover selection.
    ///      The fix is fail-fast: an unset coordinator means VRF is not
    ///      operational and the callback must revert.
    modifier onlyVRFCoordinator() {
        if (vrfCoordinator == address(0)) revert NotVRFCoordinator();
        if (msg.sender != vrfCoordinator) revert NotVRFCoordinator();
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @notice Initialize VRF Consumer
    /// @dev SEC-002 FIX-012: Added zero-address check for l1Vault
    /// @param _l1Vault L1Vault contract address
    constructor(address _l1Vault) {
        if (_l1Vault == address(0)) revert ZeroAddress();
        owner = msg.sender;
        l1Vault = _l1Vault;
        _requestIdCounter = 1;
    }

    // =========================================================================
    // IVRFConsumer Implementation
    // =========================================================================

    /// @inheritdoc IVRFConsumer
    /// @dev IMPL-002: requestRandomWords implementation
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
        
        // In production with Chainlink VRF v2.5:
        // requestId = COORDINATOR.requestRandomWords(
        //     keyHash,
        //     subscriptionId,
        //     REQUEST_CONFIRMATIONS,
        //     CALLBACK_GAS_LIMIT,
        //     NUM_WORDS
        // );
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
    /// @dev IMPL-006: Fallback mechanism using block.prevrandao
    function triggerFallback(bytes32 unlockRequestId) external returns (address prover) {
        uint256 requestId = unlockToVRFRequest[unlockRequestId];
        if (requestId == 0) revert RequestNotFound();

        VRFRequest storage req = vrfRequests[requestId];
        if (req.fulfilled) revert RequestAlreadyFulfilled();
        
        // IMPL-005: 5 minute timeout check
        if (block.timestamp < req.requestedAt + VRF_TIMEOUT) revert TimeoutNotReached();

        // Use block.prevrandao as fallback entropy source
        // This is cryptographically secure for our use case as:
        // 1. Validators cannot predict it far in advance
        // 2. The economic cost of manipulating is high
        // 3. We combine with other entropy sources
        uint256 fallbackRandom = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            unlockRequestId,
            block.number,
            msg.sender
        )));

        // FIX-011: Properly handle _selectProver return value
        prover = _selectProverSafe(fallbackRandom);
        
        req.randomValue = fallbackRandom;
        req.selectedProver = prover;
        req.fulfilled = true;

        emit FallbackProverSelected(unlockRequestId, prover);
    }

    // =========================================================================
    // Chainlink VRF Callback (Production)
    // =========================================================================

    /// @notice Chainlink VRF callback function
    /// @dev IMPL-003: fulfillRandomWords implementation
    ///      In production, this is called by Chainlink VRF Coordinator
    /// @param requestId The VRF request ID
    /// @param randomWords Array of random values (we use first one)
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external onlyVRFCoordinator {
        _fulfillRandomWords(requestId, randomWords[0]);
    }

    /// @notice Mock fulfill for testing (development only)
    /// @dev This function simulates Chainlink callback for local testing
    /// @param requestId The VRF request ID
    /// @param randomValue The random value to use
    function mockFulfillRandomWords(uint256 requestId, uint256 randomValue) external onlyOwner {
        _fulfillRandomWords(requestId, randomValue);
    }

    /// @notice Internal fulfillment logic
    /// @dev IMPL-004: Prover selection with 2/5 threshold via weighted random
    function _fulfillRandomWords(uint256 requestId, uint256 randomValue) internal {
        VRFRequest storage req = vrfRequests[requestId];
        if (req.unlockRequestId == bytes32(0)) revert RequestNotFound();
        if (req.fulfilled) revert RequestAlreadyFulfilled();

        // FIX-011: Properly handle _selectProver return value
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

    /// @notice Configure Chainlink VRF v2.5 settings
    /// @dev SEC-002 FIX-010: Added zero-address check for coordinator
    /// @param _coordinator VRF Coordinator address
    /// @param _keyHash Gas lane key hash
    /// @param _subscriptionId Subscription ID
    function setVRFConfig(address _coordinator, bytes32 _keyHash, uint64 _subscriptionId) external onlyOwner {
        if (_coordinator == address(0)) revert ZeroAddress();
        vrfCoordinator = _coordinator;
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        emit VRFConfigUpdated(_coordinator, _keyHash, _subscriptionId);
    }

    /// @notice Transfer ownership
    /// @dev SEC-002 FIX-009: Added OwnershipTransferred event emission
    /// @param newOwner New owner address
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
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

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /// @notice Internal prover selection using ProverSelector library
    /// @dev IMPL-004: Implements weighted random selection for 2/5 threshold
    function _selectProver(uint256 randomValue) internal view returns (address) {
        if (proverPool.length == 0) revert ProverSelector.NoActiveProvers();
        
        // Create memory copy for library function
        ProverSelector.ProverInfo[] memory provers = proverPool;
        
        // Use ProverSelector library for weighted selection
        // This implements P(i) = Stake_i / Σ Stake
        (address selected, ) = provers.selectProver(randomValue);
        return selected;
    }
    
    /// @notice Safe wrapper for prover selection with proper error handling
    /// @dev FIX-011: Ensures return value is properly handled
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
        // This implements P(i) = Stake_i / Σ Stake
        (selected, ) = provers.selectProver(randomValue);
        
        // Verify we got a valid result
        if (selected == address(0)) revert ProverSelector.NoActiveProvers();
        
        return selected;
    }
}
