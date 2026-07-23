// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import {ISPHINCSVerifier} from "./interfaces/ISPHINCSVerifier.sol";
import {ISignatureVerifier} from "./interfaces/ISignatureVerifier.sol";
import {SchemeRegistry} from "./SchemeRegistry.sol";
import {IProverRegistry} from "./interfaces/IProverRegistry.sol";
import {StateRootCalculator} from "./libraries/StateRootCalculator.sol";
import {SHA3_256} from "./libraries/SHA3_256.sol";

/// @title L1Vault - Quantum Shield L1 Vault Contract
/// @notice Phase 1.2 implementation with full SPHINCS+ verification integration
/// @dev Implements lock/unlock with 24h time lock and emergency 7-day path
///
/// v3.0 Architecture Update (2026-02-24):
/// - Prover management is now handled by separate ProverRegistry contract
/// - L1Vault references ProverRegistry for signature verification
/// - Legacy prover functions retained for backward compatibility
///
/// Sequence #3 Update: Full Emergency Unlock implementation with 72h timeout detection
///
/// FIX-001 Update (2025-12-24): SMT verification now uses SHA3-256 instead of keccak256
/// for CP-1 compliance (complete quantum resistance). keccak256 is vulnerable to
/// Grover's algorithm and is explicitly prohibited per CORE_PRINCIPLES.md.
///
/// FIX-008/009 Update (2025-12-24): Signature verification now uses SHA3-256
/// for message hash and simplified verification hash. This completes the
/// migration from keccak256 in all security-critical paths.
///
/// FIX-010/011/012/013 Update (2025-12-25): Complete keccak256 elimination.
/// All remaining keccak256 usages (dilithiumPubKeyHash, sphincsPubKeyHash,
/// fraudProofHash, defenseProofHash) replaced with SHA3_256.hash() for
/// complete CP-1 compliance. L1Vault.sol now has ZERO keccak256 usage.
///
/// SEC-001 Update (2025-12-25): Applied CEI (Checks-Effects-Interactions) pattern
/// to resolve reentrancy vulnerabilities identified by Slither analysis (SL-001 to SL-004).
/// All state updates now occur BEFORE external calls.
///
/// SEC-001 FIX-002b Update (2025-12-25): Fixed remaining reentrancy in resolveChallenge().
/// Emergency bond processing now occurs BEFORE _resolveValidChallenge() external calls.
///
/// SEC-002 Update (2025-12-25): Added OwnershipTransferred and SecurityCouncilUpdated
/// events for improved auditability (FIX-005, FIX-006).
///
/// INFO-001 Update (2025-12-27): Fixed unused parameter lockId in _resolveValidChallenge
/// for cleaner static analysis. Reserved for v0.2 audit logging feature.
contract L1Vault is ReentrancyGuard, Pausable {
    // =========================================================================
    // Constants
    // =========================================================================

    uint256 public constant NORMAL_TIME_LOCK = 24 hours;
    uint256 public constant EMERGENCY_TIME_LOCK = 7 days;
    uint256 public constant MIN_LOCK_AMOUNT = 0.01 ether;
    uint256 public constant EMERGENCY_BOND_PERCENT = 5;
    uint256 public constant MIN_EMERGENCY_BOND = 0.5 ether;
    uint256 public constant REQUIRED_SIGNATURES = 2;
    uint256 public constant TOTAL_PROVERS = 5;
    uint256 public constant TVL_CAP = 400 ether;
    uint256 public constant CHALLENGE_PERIOD = 12 hours;
    uint256 public constant DEFENSE_PERIOD = 48 hours;
    uint256 public constant MIN_CHALLENGE_BOND = 0.1 ether;
    uint256 public constant CHALLENGE_BOND_PERCENT = 1;
    uint256 public constant SLASH_CHALLENGER_PERCENT = 60;
    uint256 public constant SLASH_INSURANCE_PERCENT = 20;
    uint256 public constant SLASH_BURN_PERCENT = 20;
    uint256 public constant DEFAULT_LOCK_EXPIRY = 24 hours;
    
    /// @notice Prover response timeout - triggers Emergency path
    /// @dev Sequence #3: TRIG-001
    uint256 public constant PROVER_TIMEOUT = 72 hours;

    // =========================================================================
    // Enums
    // =========================================================================

    enum LockStatus { ACTIVE, PENDING_UNLOCK, RELEASED, CHALLENGED, SLASHED, EMERGENCY_PENDING }
    enum ChallengeStatus { NONE, PENDING, RESOLVED_VALID, RESOLVED_INVALID, DEFENSE_SUBMITTED }
    
    /// @notice Emergency unlock status tracking
    /// @dev Sequence #3: Emergency state machine
    enum EmergencyStatus { NONE, INITIATED, BOND_RECEIVED, MONITORING, FINALIZED }

    // =========================================================================
    // Structs
    // =========================================================================

    struct Lock {
        address sender;
        address recipient;
        uint256 amount;
        bytes32 dilithiumPubKeyHash;
        uint256 lockedAt;
        LockStatus status;
        bytes32 stateRoot;
        uint256 expiry;
        uint256 nonce;
    }

    struct UnlockRequest {
        bytes32 lockId;
        address recipient;
        uint256 amount;
        bytes32 stateRoot;
        bytes32 unlockStateRoot;
        uint256 requestedAt;
        uint256 unlockableAt;
        bool isEmergency;
        uint256 bond;
        uint256 signatureCount;
        uint256 unlockNonce;
        /// @dev Sequence #3: Prover response tracking (TRIG-002)
        uint256 proverRequestedAt;
        /// @dev Sequence #3: Emergency unlock ready timestamp (TL7-004)
        uint256 emergencyReadyAt;
    }

    struct Prover {
        address proverAddress;
        bytes32 sphincsPubKeyHash;
        bytes sphincsPublicKey;
        uint256 stakedAmount;
        uint256 registeredAt;
        bool isActive;
        uint256 successfulSigns;
        uint256 slashedCount;
    }

    struct Challenge {
        bytes32 lockId;
        address challenger;
        bytes32 fraudProofHash;
        uint256 challengedAt;
        ChallengeStatus status;
        uint256 bond;
        uint256 defenseDeadline;
        bytes32 defenseProofHash;
        address defender;
    }
    
    /// @notice Emergency unlock tracking structure
    /// @dev Sequence #3: Complete emergency state tracking
    struct EmergencyUnlock {
        bytes32 lockId;
        address initiator;
        uint256 bondAmount;
        uint256 initiatedAt;
        uint256 emergencyReadyAt;
        EmergencyStatus status;
        bool enhancedMonitoring;
        bool fromTimeout;
    }

    // =========================================================================
    // Events
    // =========================================================================

    event Locked(bytes32 indexed lockId, address indexed sender, address indexed recipient, uint256 amount, bytes32 dilithiumPubKeyHash, bytes32 stateRoot);
    event UnlockRequested(bytes32 indexed lockId, address indexed recipient, uint256 amount, uint256 unlockableAt, bool isEmergency, bytes32 unlockStateRoot);
    event UnlockExecuted(bytes32 indexed lockId, address indexed recipient, uint256 amount);
    event EmergencyUnlockRequested(bytes32 indexed lockId, address indexed recipient, uint256 amount, uint256 bond, uint256 unlockableAt);
    event ChallengeFiled(bytes32 indexed lockId, address indexed challenger, bytes32 fraudProofHash, uint256 bond, uint256 defenseDeadline);
    event DefenseSubmitted(bytes32 indexed lockId, address indexed defender, bytes32 defenseProofHash);
    event ChallengeResolved(bytes32 indexed lockId, bool challengeValid, uint256 slashedAmount, uint256 challengerReward, uint256 insuranceAmount, uint256 burnedAmount);
    event ProverRegistered(address indexed prover, bytes32 sphincsPubKeyHash, uint256 stake);
    event ProverSlashed(address indexed prover, uint256 amount, bytes32 reason);
    event StateRootUpdated(bytes32 indexed newRoot, uint256 indexed blockNumber);
    event SPHINCSVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event SchemeRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    event ActiveSchemeUpdated(bytes4 indexed oldSchemeId, bytes4 indexed newSchemeId);

    /// @notice Emitted when prover registry is updated
    /// @dev v3.0: Prover management is now handled by separate registry
    event ProverRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    
    /// @notice Emitted when ownership is transferred
    /// @dev SEC-002 FIX-005: Added for auditability
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    /// @notice Emitted when security council is updated
    /// @dev SEC-002 FIX-006: Added for auditability
    event SecurityCouncilUpdated(address indexed previousCouncil, address indexed newCouncil);
    
    /// @notice Emitted when Emergency unlock is initiated (manual or timeout)
    /// @dev Sequence #3: EVT-001
    event EmergencyUnlockInitiated(
        bytes32 indexed lockId, 
        address indexed initiator, 
        bool fromTimeout,
        uint256 timestamp
    );
    
    /// @notice Emitted when Emergency bond is received
    /// @dev Sequence #3: EVT-002
    event EmergencyBondReceived(
        bytes32 indexed lockId, 
        address indexed payer, 
        uint256 bondAmount,
        uint256 requiredBond
    );
    
    /// @notice Emitted when Emergency unlock is finalized
    /// @dev Sequence #3: EVT-003
    event EmergencyUnlockFinalized(
        bytes32 indexed lockId, 
        address indexed recipient, 
        uint256 amount,
        uint256 bondReturned,
        bool wasSlashed
    );
    
    /// @notice Emitted when enhanced monitoring is activated
    /// @dev Sequence #3: MON-001
    event EnhancedMonitoringActivated(bytes32 indexed lockId, uint256 timestamp);
    
    /// @notice Emitted when 72h prover timeout is detected
    /// @dev Sequence #3: TRIG-001
    event ProverTimeoutDetected(bytes32 indexed lockId, uint256 requestedAt, uint256 detectedAt);

    // =========================================================================
    // Errors
    // =========================================================================

    error InsufficientAmount();
    error TVLCapExceeded();
    error LockNotFound();
    error LockAlreadyReleased();
    error UnlockNotReady();
    error UnlockAlreadyRequested();
    error TransferFailed();
    error NotOwner();
    error ZeroAddress();
    error InvalidSignatures();
    error InsufficientSignatures();
    error InvalidProof();
    error ProverNotActive();
    error ProverAlreadyRegistered();
    error InsufficientStake();
    error ChallengePeriodActive();
    error ChallengeNotFound();
    error ChallengeAlreadyResolved();
    error NotSecurityCouncil();
    error InvalidBond();
    error UnlockNotFound();
    error InvalidPublicKeyLength();
    error VerifierNotSet();
    error DefensePeriodNotExpired();
    error DefensePeriodExpired();
    error NotActiveProver();
    error LockExpired();
    error InvalidStateRoot();
    /// @dev Sequence #3: Prover timeout not reached
    error ProverTimeoutNotReached();
    /// @dev Sequence #3: Emergency already initiated
    error EmergencyAlreadyInitiated();
    /// @dev Sequence #3: Not in emergency state
    error NotInEmergencyState();
    /// @dev Sequence #3: Emergency time lock not expired
    error EmergencyTimeLockActive();

    // =========================================================================
    // State Variables
    // =========================================================================

    address public owner;
    address public securityCouncil;
    ISPHINCSVerifier public sphincsVerifier;

    /// @notice Crypto-agility (Move 2): registry resolving schemeId -> verifier. When set,
    ///         the active scheme's verifier is looked up here so schemes can be hot-swapped
    ///         by governance (ML-DSA-65 -> 87, threshold-ML-DSA, ...) without a migration.
    ///         When unset, verification falls back to `sphincsVerifier` (backward compatible).
    SchemeRegistry public schemeRegistry;
    /// @notice The scheme currently used to verify prover signatures. Defaults to
    ///         SLH-DSA-SHAKE-128s ("SLH1"), matching the built-in SPHINCSVerifier.
    bytes4 public activeSchemeId;

    /// @notice External Prover Registry contract (v3.0 architecture)
    /// @dev When set, prover lookups use registry instead of local mapping
    IProverRegistry public proverRegistry;
    uint256 public totalLocked;
    uint256 public nonceCounter;
    uint256 public unlockNonceCounter;
    bytes32 public currentStateRoot;
    mapping(bytes32 => Lock) public locks;
    mapping(bytes32 => UnlockRequest) public unlockRequests;
    mapping(address => Prover) public provers;
    address[] public activeProvers;
    mapping(bytes32 => Challenge) public challenges;

    /// @notice Signing provers recorded per unlock request. Used to fund slashing
    ///         from the offending provers' stake instead of the pooled vault balance
    ///         on a valid challenge (QS-SEC-VAULT-004).
    mapping(bytes32 => address[]) private unlockSigningProvers;
    uint256 public insuranceFund;
    uint256 public totalBurned;
    bool public useFullVerification;
    
    /// @notice Emergency unlock tracking per lock
    /// @dev Sequence #3: Complete emergency state
    mapping(bytes32 => EmergencyUnlock) public emergencyUnlocks;
    
    /// @notice Enhanced monitoring flag per lock
    /// @dev Sequence #3: MON-001
    mapping(bytes32 => bool) public enhancedMonitoring;

    /// @notice User's lock IDs for balance tracking
    /// @dev Maps user address to array of their lock IDs
    mapping(address => bytes32[]) public userLockIds;

    /// @notice User's total locked balance (cached for O(1) lookup)
    /// @dev Updated on lock/unlock operations
    mapping(address => uint256) public userLockedBalance;

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlySecurityCouncil() {
        if (msg.sender != securityCouncil) revert NotSecurityCouncil();
        _;
    }

    modifier onlyActiveProver() {
        if (!provers[msg.sender].isActive) revert NotActiveProver();
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(address _securityCouncil, address _sphincsVerifier) {
        if (_securityCouncil == address(0)) revert ZeroAddress();
        owner = msg.sender;
        securityCouncil = _securityCouncil;
        activeSchemeId = 0x534c4831; // bytes4("SLH1") = SLH-DSA-SHAKE-128s (default)

        if (_sphincsVerifier != address(0)) {
            sphincsVerifier = ISPHINCSVerifier(_sphincsVerifier);
            useFullVerification = true;
        }
    }

    // =========================================================================
    // Lock Functions
    // =========================================================================

    /// @notice Lock funds with default expiry (delegates to lockWithExpiry)
    /// @dev No nonReentrant here since lockWithExpiry has it
    /// @dev DEPRECATED: Use lockWithSR0 for SEQUENCES.md compliant flow
    function lock(address recipient, bytes calldata dilithiumPubKey) external payable whenNotPaused returns (bytes32 lockId) {
        return lockWithExpiry(recipient, dilithiumPubKey, block.timestamp + DEFAULT_LOCK_EXPIRY);
    }

    /// @notice Lock funds with custom expiry
    /// @dev FIX-010: dilithiumPubKeyHash now uses SHA3-256 instead of keccak256
    /// @dev DEPRECATED: Use lockWithSR0 for SEQUENCES.md compliant flow
    function lockWithExpiry(address recipient, bytes calldata dilithiumPubKey, uint256 expiry) public payable whenNotPaused nonReentrant returns (bytes32 lockId) {
        if (msg.value < MIN_LOCK_AMOUNT) revert InsufficientAmount();
        if (totalLocked + msg.value > TVL_CAP) revert TVLCapExceeded();
        if (recipient == address(0)) revert ZeroAddress();
        if (expiry <= block.timestamp) revert LockExpired();

        // FIX-010: Use SHA3-256 instead of keccak256 for quantum resistance
        bytes32 dilithiumPubKeyHash = SHA3_256.hash(dilithiumPubKey);
        uint256 nonce = nonceCounter++;

        bytes32 stateRoot = StateRootCalculator.computeSR0(
            block.chainid, address(0), msg.value, recipient, expiry, nonce, dilithiumPubKeyHash
        );

        lockId = StateRootCalculator.generateLockId(stateRoot, msg.sender, block.timestamp);

        locks[lockId] = Lock({
            sender: msg.sender,
            recipient: recipient,
            amount: msg.value,
            dilithiumPubKeyHash: dilithiumPubKeyHash,
            lockedAt: block.timestamp,
            status: LockStatus.ACTIVE,
            stateRoot: stateRoot,
            expiry: expiry,
            nonce: nonce
        });

        totalLocked += msg.value;

        // Track user's lock for balance lookup
        userLockIds[msg.sender].push(lockId);
        userLockedBalance[msg.sender] += msg.value;

        emit Locked(lockId, msg.sender, recipient, msg.value, dilithiumPubKeyHash, stateRoot);
    }

    /// @notice Lock funds using pre-computed lock_id and sr_0 from L3 Aegis
    /// @dev SEQUENCES.md Sequence #1 compliant: L3 computes SR_0, L1 just stores
    ///      This eliminates the 15.5M gas cost of SHA3-256 on large Dilithium keys
    /// @param lockId Lock ID computed by L3 (SHA3-256 of SR_0 + timestamp)
    /// @param sr0 State Root 0 computed by L3 (SHA3-256 of lock params + pk_dilithium)
    /// @param recipient Address to receive funds on unlock
    /// @param expiry Request expiry timestamp
    function lockWithSR0(
        bytes32 lockId,
        bytes32 sr0,
        address recipient,
        uint256 expiry
    ) external payable whenNotPaused nonReentrant {
        if (msg.value < MIN_LOCK_AMOUNT) revert InsufficientAmount();
        if (totalLocked + msg.value > TVL_CAP) revert TVLCapExceeded();
        if (recipient == address(0)) revert ZeroAddress();
        if (expiry <= block.timestamp) revert LockExpired();
        if (lockId == bytes32(0)) revert LockNotFound();
        if (sr0 == bytes32(0)) revert InvalidStateRoot();

        // Verify lock doesn't already exist
        if (locks[lockId].sender != address(0)) revert UnlockAlreadyRequested();

        uint256 nonce = nonceCounter++;

        locks[lockId] = Lock({
            sender: msg.sender,
            recipient: recipient,
            amount: msg.value,
            dilithiumPubKeyHash: sr0,  // Store SR_0 as the identifier (already includes pk hash)
            lockedAt: block.timestamp,
            status: LockStatus.ACTIVE,
            stateRoot: sr0,
            expiry: expiry,
            nonce: nonce
        });

        totalLocked += msg.value;

        // Track user's lock for balance lookup
        userLockIds[msg.sender].push(lockId);
        userLockedBalance[msg.sender] += msg.value;

        // Emit with sr0 as both dilithiumPubKeyHash and stateRoot for compatibility
        emit Locked(lockId, msg.sender, recipient, msg.value, sr0, sr0);
    }

    // =========================================================================
    // Unlock Functions
    // =========================================================================

    function requestUnlock(
        bytes32 lockId,
        address recipient,
        bytes32[] calldata smtProof,
        bytes32 expectedSR1,
        bytes[] calldata sphincsSignatures,
        address[] calldata signingProvers
    ) external whenNotPaused nonReentrant {
        Lock storage lockData = locks[lockId];
        if (lockData.sender == address(0)) revert LockNotFound();
        if (lockData.status != LockStatus.ACTIVE) revert LockAlreadyReleased();
        if (recipient == address(0)) revert ZeroAddress();

        uint256 unlockNonce = unlockNonceCounter++;
        bytes32 computedSR1 = StateRootCalculator.computeSR1(lockData.stateRoot, lockId, recipient, lockData.amount, unlockNonce);

        if (computedSR1 != expectedSR1) revert InvalidStateRoot();
        if (!_verifySMTProof(lockId, smtProof, expectedSR1)) revert InvalidProof();
        if (sphincsSignatures.length < REQUIRED_SIGNATURES) revert InsufficientSignatures();
        if (sphincsSignatures.length != signingProvers.length) revert InvalidSignatures();

        uint256 validSignatures = _verifyThresholdSignatures(lockId, expectedSR1, sphincsSignatures, signingProvers);
        if (validSignatures < REQUIRED_SIGNATURES) revert InsufficientSignatures();

        _createUnlockRequest(lockId, recipient, lockData.amount, lockData.stateRoot, computedSR1, false, 0, validSignatures, unlockNonce);
        // QS-SEC-VAULT-004: record the signing provers so a later valid challenge can
        // slash their stake to fund the reward instead of the pooled vault balance.
        unlockSigningProvers[lockId] = signingProvers;
        lockData.status = LockStatus.PENDING_UNLOCK;
    }

    /// @dev QS-SEC-VAULT-002: DISABLED. This legacy path verified prover signatures
    ///      over hashPair(lockId, stateRoot) WITHOUT binding `recipient` into the
    ///      signed message, so a valid signature set (public in the mempool) could be
    ///      replayed/front-run to redirect payout to an attacker-chosen recipient.
    ///      Use requestUnlock, which folds recipient/amount/unlockNonce into the SR1
    ///      that provers sign. Kept as a reverting stub (no on-chain callers) to avoid
    ///      changing the function selector / ABI.
    function requestUnlockLegacy(
        bytes32 /* lockId */,
        address /* recipient */,
        bytes32[] calldata /* smtProof */,
        bytes32 /* stateRoot */,
        bytes[] calldata /* sphincsSignatures */,
        address[] calldata /* signingProvers */
    ) external {
        revert("requestUnlockLegacy disabled: use requestUnlock (recipient must be bound to the signed state root)");
    }

    /// @notice Request emergency unlock with bond payment
    /// @dev Sequence #3: TRIG-004 - User manual Emergency option
    function requestEmergencyUnlock(bytes32 lockId, address recipient) external payable whenNotPaused nonReentrant {
        Lock storage lockData = locks[lockId];
        if (lockData.sender == address(0)) revert LockNotFound();
        if (lockData.status != LockStatus.ACTIVE) revert LockAlreadyReleased();
        if (recipient == address(0)) revert ZeroAddress();
        if (msg.sender != lockData.sender) revert NotOwner();
        
        // Check if emergency already initiated
        if (emergencyUnlocks[lockId].status != EmergencyStatus.NONE) revert EmergencyAlreadyInitiated();

        uint256 requiredBond = _calculateEmergencyBond(lockData.amount);
        if (msg.value < requiredBond) revert InvalidBond();

        uint256 unlockNonce = unlockNonceCounter++;
        uint256 emergencyReadyAt = block.timestamp + EMERGENCY_TIME_LOCK;
        
        _createUnlockRequest(lockId, recipient, lockData.amount, lockData.stateRoot, bytes32(0), true, msg.value, 0, unlockNonce);
        
        // Update unlock request with emergency-specific fields
        unlockRequests[lockId].emergencyReadyAt = emergencyReadyAt;
        
        // Create emergency unlock tracking
        emergencyUnlocks[lockId] = EmergencyUnlock({
            lockId: lockId,
            initiator: msg.sender,
            bondAmount: msg.value,
            initiatedAt: block.timestamp,
            emergencyReadyAt: emergencyReadyAt,
            status: EmergencyStatus.BOND_RECEIVED,
            enhancedMonitoring: true,
            fromTimeout: false
        });
        
        // Activate enhanced monitoring
        enhancedMonitoring[lockId] = true;
        
        lockData.status = LockStatus.EMERGENCY_PENDING;

        emit EmergencyUnlockInitiated(lockId, msg.sender, false, block.timestamp);
        emit EmergencyBondReceived(lockId, msg.sender, msg.value, requiredBond);
        emit EnhancedMonitoringActivated(lockId, block.timestamp);
        emit EmergencyUnlockRequested(lockId, recipient, lockData.amount, msg.value, emergencyReadyAt);
    }
    
    /// @notice Check if prover timeout has occurred for a pending unlock
    /// @dev Sequence #3: TRIG-001 - 72h timeout detection
    /// @param lockId The lock ID to check
    /// @return isTimedOut True if 72h has passed since prover was requested
    /// @return proverRequestedAt When the prover was requested
    /// @return timeRemaining Seconds remaining until timeout (0 if already timed out)
    function checkProverTimeout(bytes32 lockId) public view returns (
        bool isTimedOut,
        uint256 proverRequestedAt,
        uint256 timeRemaining
    ) {
        UnlockRequest storage request = unlockRequests[lockId];
        if (request.lockId == bytes32(0)) {
            return (false, 0, 0);
        }
        
        proverRequestedAt = request.proverRequestedAt;
        if (proverRequestedAt == 0) {
            // Prover not yet requested, use requestedAt as fallback
            proverRequestedAt = request.requestedAt;
        }
        
        uint256 deadline = proverRequestedAt + PROVER_TIMEOUT;
        if (block.timestamp >= deadline) {
            isTimedOut = true;
            timeRemaining = 0;
        } else {
            isTimedOut = false;
            timeRemaining = deadline - block.timestamp;
        }
    }
    
    /// @notice Initiate emergency unlock due to 72h prover timeout
    /// @dev Sequence #3: TRIG-003 - Emergency Path auto switch
    /// @param lockId The lock ID to switch to emergency path
    function initiateEmergencyFromTimeout(bytes32 lockId) external payable whenNotPaused nonReentrant {
        Lock storage lockData = locks[lockId];
        if (lockData.sender == address(0)) revert LockNotFound();
        if (lockData.status != LockStatus.PENDING_UNLOCK) revert LockAlreadyReleased();
        
        // Check if emergency already initiated
        if (emergencyUnlocks[lockId].status != EmergencyStatus.NONE) revert EmergencyAlreadyInitiated();
        
        // Verify 72h timeout has occurred
        (bool isTimedOut, uint256 proverRequestedAt,) = checkProverTimeout(lockId);
        if (!isTimedOut) revert ProverTimeoutNotReached();
        
        // Calculate and verify bond
        uint256 requiredBond = _calculateEmergencyBond(lockData.amount);
        if (msg.value < requiredBond) revert InvalidBond();
        
        uint256 emergencyReadyAt = block.timestamp + EMERGENCY_TIME_LOCK;
        
        // Update existing unlock request to emergency
        UnlockRequest storage request = unlockRequests[lockId];
        request.isEmergency = true;
        request.bond = msg.value;
        request.unlockableAt = emergencyReadyAt;
        request.emergencyReadyAt = emergencyReadyAt;
        
        // Create emergency unlock tracking
        emergencyUnlocks[lockId] = EmergencyUnlock({
            lockId: lockId,
            initiator: msg.sender,
            bondAmount: msg.value,
            initiatedAt: block.timestamp,
            emergencyReadyAt: emergencyReadyAt,
            status: EmergencyStatus.MONITORING,
            enhancedMonitoring: true,
            fromTimeout: true
        });
        
        // Activate enhanced monitoring
        enhancedMonitoring[lockId] = true;
        
        lockData.status = LockStatus.EMERGENCY_PENDING;
        
        emit ProverTimeoutDetected(lockId, proverRequestedAt, block.timestamp);
        emit EmergencyUnlockInitiated(lockId, msg.sender, true, block.timestamp);
        emit EmergencyBondReceived(lockId, msg.sender, msg.value, requiredBond);
        emit EnhancedMonitoringActivated(lockId, block.timestamp);
        emit EmergencyUnlockRequested(lockId, request.recipient, request.amount, msg.value, emergencyReadyAt);
    }
    
    /// @notice Record prover request timestamp for timeout tracking
    /// @dev Sequence #3: TRIG-002 - Prover response state tracking
    function recordProverRequest(bytes32 lockId) external onlyActiveProver {
        UnlockRequest storage request = unlockRequests[lockId];
        if (request.lockId == bytes32(0)) revert UnlockNotFound();
        
        // Only record if not already set
        if (request.proverRequestedAt == 0) {
            request.proverRequestedAt = block.timestamp;
        }
    }

    /// @notice Internal helper to create unlock request (reduces stack depth)
    function _createUnlockRequest(
        bytes32 lockId,
        address recipient,
        uint256 amount,
        bytes32 sr0,
        bytes32 sr1,
        bool isEmergency,
        uint256 bond,
        uint256 sigCount,
        uint256 unlockNonce
    ) internal {
        uint256 unlockableAt = block.timestamp + (isEmergency ? EMERGENCY_TIME_LOCK : NORMAL_TIME_LOCK);
        
        UnlockRequest storage req = unlockRequests[lockId];
        req.lockId = lockId;
        req.recipient = recipient;
        req.amount = amount;
        req.stateRoot = sr0;
        req.unlockStateRoot = sr1;
        req.requestedAt = block.timestamp;
        req.unlockableAt = unlockableAt;
        req.isEmergency = isEmergency;
        req.bond = bond;
        req.signatureCount = sigCount;
        req.unlockNonce = unlockNonce;
        req.proverRequestedAt = block.timestamp; // Initialize prover tracking

        if (!isEmergency) {
            emit UnlockRequested(lockId, recipient, amount, unlockableAt, false, sr1);
        }
    }

    function executeUnlock(bytes32 lockId) external nonReentrant {
        UnlockRequest storage request = unlockRequests[lockId];
        if (request.lockId == bytes32(0)) revert UnlockNotFound();
        if (block.timestamp < request.unlockableAt) revert UnlockNotReady();

        Lock storage lockData = locks[lockId];
        // QS-SEC-VAULT-001: only ACTIVE-derived pending states may execute. This
        // blocks a second withdrawal after a challenge sets the lock to SLASHED
        // (the UnlockRequest is not cleared on slash), as well as RELEASED replay,
        // CHALLENGED, and raw ACTIVE. RESOLVED_INVALID restores the lock to
        // PENDING_UNLOCK / EMERGENCY_PENDING, so a legitimate unlock after a failed
        // challenge still executes.
        if (lockData.status != LockStatus.PENDING_UNLOCK && lockData.status != LockStatus.EMERGENCY_PENDING) {
            revert LockAlreadyReleased();
        }

        if (!request.isEmergency) {
            Challenge storage challengeData = challenges[lockId];
            if (challengeData.status == ChallengeStatus.PENDING) revert ChallengePeriodActive();
        }

        lockData.status = LockStatus.RELEASED;
        totalLocked -= request.amount;

        // Update user's locked balance
        if (userLockedBalance[lockData.sender] >= request.amount) {
            userLockedBalance[lockData.sender] -= request.amount;
        }

        uint256 bondToReturn = request.bond;
        bool wasSlashed = false;
        
        // Check if emergency was slashed
        EmergencyUnlock storage emergencyData = emergencyUnlocks[lockId];
        if (emergencyData.status == EmergencyStatus.MONITORING || emergencyData.status == EmergencyStatus.BOND_RECEIVED) {
            emergencyData.status = EmergencyStatus.FINALIZED;
            enhancedMonitoring[lockId] = false;
        }

        (bool success, ) = request.recipient.call{value: request.amount}("");
        if (!success) revert TransferFailed();

        if (bondToReturn > 0) {
            (bool bondSuccess, ) = lockData.sender.call{value: bondToReturn}("");
            if (!bondSuccess) revert TransferFailed();
        }

        emit UnlockExecuted(lockId, request.recipient, request.amount);
        
        if (request.isEmergency) {
            emit EmergencyUnlockFinalized(lockId, request.recipient, request.amount, bondToReturn, wasSlashed);
        }
    }
    
    /// @notice Calculate emergency bond amount
    /// @dev Sequence #3: BOND-001 - MAX(0.5 ETH, amount × 5%)
    function _calculateEmergencyBond(uint256 amount) internal pure returns (uint256) {
        uint256 percentBond = (amount * EMERGENCY_BOND_PERCENT) / 100;
        return percentBond > MIN_EMERGENCY_BOND ? percentBond : MIN_EMERGENCY_BOND;
    }
    
    /// @notice Get calculated emergency bond for an amount
    /// @dev Public view for UI/testing
    function calculateEmergencyBond(uint256 amount) external pure returns (uint256) {
        return _calculateEmergencyBond(amount);
    }
    
    /// @notice Get emergency unlock details
    /// @dev Sequence #3: View function for emergency state
    function getEmergencyUnlock(bytes32 lockId) external view returns (EmergencyUnlock memory) {
        return emergencyUnlocks[lockId];
    }
    
    /// @notice Check if lock is in enhanced monitoring mode
    /// @dev Sequence #3: MON-001
    function isEnhancedMonitoring(bytes32 lockId) external view returns (bool) {
        return enhancedMonitoring[lockId];
    }

    // =========================================================================
    // Challenge Functions
    // =========================================================================

    /// @notice File a challenge against a pending unlock
    /// @dev FIX-012: fraudProofHash now uses SHA3-256 instead of keccak256
    function challenge(bytes32 lockId, bytes calldata fraudProof) external payable whenNotPaused nonReentrant {
        UnlockRequest storage request = unlockRequests[lockId];
        if (request.lockId == bytes32(0)) revert UnlockNotFound();
        if (block.timestamp > request.unlockableAt) revert UnlockNotReady();

        Lock storage lockData = locks[lockId];
        if (lockData.status != LockStatus.PENDING_UNLOCK && lockData.status != LockStatus.EMERGENCY_PENDING) revert LockAlreadyReleased();

        // QS-SEC-VAULT-003: the lock owner must not challenge their own unlock.
        // Combined with autoResolveChallenge treating an undefended challenge as valid,
        // a self-challenge lets the sender reclaim the lock AND collect a challenger
        // reward. (The reward is currently paid from the pool rather than slashed prover
        // stake — see QS-SEC-VAULT-004 for the remaining stake-funding hardening.)
        require(msg.sender != lockData.sender, "challenger must not be the lock sender");

        uint256 requiredBond = (request.amount * CHALLENGE_BOND_PERCENT) / 100;
        if (requiredBond < MIN_CHALLENGE_BOND) requiredBond = MIN_CHALLENGE_BOND;
        if (msg.value < requiredBond) revert InvalidBond();

        uint256 defenseDeadline = block.timestamp + DEFENSE_PERIOD;

        // FIX-012: Use SHA3-256 instead of keccak256 for quantum resistance
        bytes32 fraudProofHash = SHA3_256.hash(fraudProof);

        challenges[lockId] = Challenge({
            lockId: lockId,
            challenger: msg.sender,
            fraudProofHash: fraudProofHash,
            challengedAt: block.timestamp,
            status: ChallengeStatus.PENDING,
            bond: msg.value,
            defenseDeadline: defenseDeadline,
            defenseProofHash: bytes32(0),
            defender: address(0)
        });

        lockData.status = LockStatus.CHALLENGED;
        
        // Extend time lock if challenged during emergency (TL7-003)
        if (request.isEmergency) {
            request.unlockableAt = request.unlockableAt + EMERGENCY_TIME_LOCK;
            if (emergencyUnlocks[lockId].emergencyReadyAt > 0) {
                emergencyUnlocks[lockId].emergencyReadyAt = request.unlockableAt;
            }
        }
        
        emit ChallengeFiled(lockId, msg.sender, fraudProofHash, msg.value, defenseDeadline);
    }

    /// @notice Submit defense against a challenge
    /// @dev FIX-013: defenseProofHash now uses SHA3-256 instead of keccak256
    function submitDefense(bytes32 lockId, bytes calldata defenseProof) external whenNotPaused onlyActiveProver {
        Challenge storage challengeData = challenges[lockId];
        if (challengeData.status != ChallengeStatus.PENDING) revert ChallengeAlreadyResolved();
        if (block.timestamp > challengeData.defenseDeadline) revert DefensePeriodExpired();

        // FIX-013: Use SHA3-256 instead of keccak256 for quantum resistance
        bytes32 defenseProofHash = SHA3_256.hash(defenseProof);
        challengeData.status = ChallengeStatus.DEFENSE_SUBMITTED;
        challengeData.defenseProofHash = defenseProofHash;
        challengeData.defender = msg.sender;

        emit DefenseSubmitted(lockId, msg.sender, defenseProofHash);
    }

    /// @notice Resolve a challenge by security council
    /// @dev SEC-001 FIX-002b: CEI pattern applied - ALL state updates BEFORE external calls
    ///      Emergency bond processing now occurs BEFORE _resolveValidChallenge() call
    function resolveChallenge(bytes32 lockId, bool challengeValid) external onlySecurityCouncil nonReentrant {
        Challenge storage challengeData = challenges[lockId];
        if (challengeData.status != ChallengeStatus.PENDING && challengeData.status != ChallengeStatus.DEFENSE_SUBMITTED) {
            revert ChallengeAlreadyResolved();
        }

        Lock storage lockData = locks[lockId];
        UnlockRequest storage request = unlockRequests[lockId];

        uint256 slashedAmount = 0;
        uint256 challengerReward = 0;
        uint256 insuranceAmount = 0;
        uint256 burnedAmount = 0;

        if (challengeValid) {
            // SEC-001 FIX-002b: Forfeit emergency bond BEFORE external calls (CEI pattern)
            // This was previously done AFTER _resolveValidChallenge() which caused reentrancy risk
            if (request.isEmergency && request.bond > 0) {
                insuranceFund += request.bond;
                request.bond = 0;
                emergencyUnlocks[lockId].bondAmount = 0;
            }

            // QS-SEC-VAULT-004: slashing/reward is computed and paid inside, funded from the
            // signing provers' stake rather than the pooled vault balance.
            (slashedAmount, challengerReward, insuranceAmount, burnedAmount) =
                _resolveValidChallenge(lockId, challengeData, lockData, request);
        } else {
            _resolveInvalidChallenge(lockId, challengeData, lockData);
            if (challengeData.defender != address(0)) {
                insuranceAmount = (challengeData.bond * SLASH_INSURANCE_PERCENT) / 100;
                burnedAmount = (challengeData.bond * SLASH_BURN_PERCENT) / 100;
            } else {
                insuranceAmount = challengeData.bond;
            }
        }

        emit ChallengeResolved(lockId, challengeValid, slashedAmount, challengerReward, insuranceAmount, burnedAmount);
    }

    /// @notice Internal function to resolve a valid challenge
    /// @dev SEC-001 FIX-003: CEI pattern applied - ALL state updates BEFORE external calls
    function _resolveValidChallenge(
        bytes32 lockId,
        Challenge storage challengeData,
        Lock storage lockData,
        UnlockRequest storage /* request */
    ) internal returns (uint256 slashedAmount, uint256 challengerReward, uint256 insuranceAmount, uint256 burnedAmount) {
        // === EFFECTS (state updates) - FIRST ===
        challengeData.status = ChallengeStatus.RESOLVED_VALID;
        lockData.status = LockStatus.SLASHED;

        // QS-SEC-VAULT-004: fund the reward from the signing provers' stake, not the pool.
        slashedAmount = _slashSigningProvers(lockId);
        challengerReward = (slashedAmount * SLASH_CHALLENGER_PERCENT) / 100;
        insuranceAmount = (slashedAmount * SLASH_INSURANCE_PERCENT) / 100;
        burnedAmount = (slashedAmount * SLASH_BURN_PERCENT) / 100;

        // Cache values for external calls
        address challenger = challengeData.challenger;
        uint256 challengerPayout = challengeData.bond + challengerReward;
        address sender = lockData.sender;
        uint256 lockAmount = lockData.amount;

        // Update state variables BEFORE external calls (CEI pattern)
        insuranceFund += insuranceAmount;
        totalBurned += burnedAmount;
        totalLocked -= lockAmount;

        // QS-SEC-VAULT-001 (defense in depth): clear the unlock request and signer set so a
        // SLASHED lock cannot be re-driven through executeUnlock.
        delete unlockRequests[lockId];
        delete unlockSigningProvers[lockId];

        // === INTERACTIONS (external calls) - LAST ===
        (bool success, ) = challenger.call{value: challengerPayout}("");
        if (!success) revert TransferFailed();

        (bool refundSuccess, ) = sender.call{value: lockAmount}("");
        if (!refundSuccess) revert TransferFailed();
    }

    /// @notice Internal function to resolve an invalid challenge
    /// @dev SEC-001 FIX-004: CEI pattern applied - ALL state updates BEFORE external calls
    function _resolveInvalidChallenge(bytes32 lockId, Challenge storage challengeData, Lock storage lockData) internal {
        // === EFFECTS (state updates) - FIRST ===
        challengeData.status = ChallengeStatus.RESOLVED_INVALID;
        
        // Restore to appropriate pending state
        if (emergencyUnlocks[lockId].status != EmergencyStatus.NONE) {
            lockData.status = LockStatus.EMERGENCY_PENDING;
        } else {
            lockData.status = LockStatus.PENDING_UNLOCK;
        }

        if (challengeData.defender != address(0)) {
            uint256 defenderReward = (challengeData.bond * SLASH_CHALLENGER_PERCENT) / 100;
            uint256 insuranceAmount = (challengeData.bond * SLASH_INSURANCE_PERCENT) / 100;
            uint256 burnedAmount = (challengeData.bond * SLASH_BURN_PERCENT) / 100;
            
            // Cache defender address for external call
            address defender = challengeData.defender;
            
            // Update state BEFORE external call (CEI pattern)
            insuranceFund += insuranceAmount;
            totalBurned += burnedAmount;
            
            // === INTERACTIONS (external calls) - LAST ===
            (bool defenderSuccess, ) = defender.call{value: defenderReward}("");
            if (!defenderSuccess) revert TransferFailed();
        } else {
            insuranceFund += challengeData.bond;
        }
    }

    /// @notice Auto-resolve challenge after defense period expires
    /// @dev SEC-001 FIX-001: CEI pattern applied - ALL state updates BEFORE external calls
    function autoResolveChallenge(bytes32 lockId) external nonReentrant {
        Challenge storage challengeData = challenges[lockId];
        if (challengeData.status != ChallengeStatus.PENDING) revert ChallengeAlreadyResolved();
        if (block.timestamp <= challengeData.defenseDeadline) revert DefensePeriodNotExpired();

        Lock storage lockData = locks[lockId];
        UnlockRequest storage request = unlockRequests[lockId];

        // === EFFECTS (state updates) - FIRST ===
        challengeData.status = ChallengeStatus.RESOLVED_VALID;
        lockData.status = LockStatus.SLASHED;

        // Forfeit emergency bond if applicable (read request before it is cleared below)
        if (request.isEmergency && request.bond > 0) {
            insuranceFund += request.bond;
            request.bond = 0;
        }

        // QS-SEC-VAULT-004: fund the reward from the signing provers' stake, not the pool.
        uint256 slashedAmount = _slashSigningProvers(lockId);
        uint256 challengerReward = (slashedAmount * SLASH_CHALLENGER_PERCENT) / 100;
        uint256 insuranceAmount = (slashedAmount * SLASH_INSURANCE_PERCENT) / 100;
        uint256 burnedAmount = (slashedAmount * SLASH_BURN_PERCENT) / 100;

        // Cache values for external calls
        address challenger = challengeData.challenger;
        uint256 challengerPayout = challengeData.bond + challengerReward;
        address sender = lockData.sender;
        uint256 lockAmount = lockData.amount;

        // Update state variables BEFORE external calls (CEI pattern)
        insuranceFund += insuranceAmount;
        totalBurned += burnedAmount;
        totalLocked -= lockAmount;

        // QS-SEC-VAULT-001 (defense in depth): clear unlock/signer state so a SLASHED lock
        // cannot be re-driven through executeUnlock.
        delete unlockRequests[lockId];
        delete unlockSigningProvers[lockId];

        // === INTERACTIONS (external calls) - LAST ===
        (bool success, ) = challenger.call{value: challengerPayout}("");
        if (!success) revert TransferFailed();

        (bool refundSuccess, ) = sender.call{value: lockAmount}("");
        if (!refundSuccess) revert TransferFailed();

        emit ChallengeResolved(lockId, true, slashedAmount, challengerReward, insuranceAmount, burnedAmount);
    }

    // =========================================================================
    // Prover Management
    // =========================================================================

    /// @notice Register a new prover
    /// @dev FIX-011: sphincsPubKeyHash now uses SHA3-256 instead of keccak256
    function registerProver(address proverAddress, bytes calldata sphincsPublicKey) external payable onlyOwner {
        if (proverAddress == address(0)) revert ZeroAddress();
        if (provers[proverAddress].isActive) revert ProverAlreadyRegistered();
        if (msg.value < 1 ether) revert InsufficientStake();
        if (sphincsPublicKey.length != 32) revert InvalidPublicKeyLength();

        // FIX-011: Use SHA3-256 instead of keccak256 for quantum resistance
        bytes32 sphincsPubKeyHash = SHA3_256.hash(sphincsPublicKey);

        provers[proverAddress] = Prover({
            proverAddress: proverAddress,
            sphincsPubKeyHash: sphincsPubKeyHash,
            sphincsPublicKey: sphincsPublicKey,
            stakedAmount: msg.value,
            registeredAt: block.timestamp,
            isActive: true,
            successfulSigns: 0,
            slashedCount: 0
        });

        activeProvers.push(proverAddress);
        emit ProverRegistered(proverAddress, sphincsPubKeyHash, msg.value);
    }

    /// @notice Register a new prover without stake (TESTNET ONLY)
    /// @dev For internal testing on testnets. Owner-only, no stake required.
    /// @param proverAddress The address of the prover to register
    /// @param sphincsPublicKey The SPHINCS+ public key (32 bytes)
    function registerProverTestnet(address proverAddress, bytes calldata sphincsPublicKey) external onlyOwner {
        if (proverAddress == address(0)) revert ZeroAddress();
        if (provers[proverAddress].isActive) revert ProverAlreadyRegistered();
        if (sphincsPublicKey.length != 32) revert InvalidPublicKeyLength();

        bytes32 sphincsPubKeyHash = SHA3_256.hash(sphincsPublicKey);

        provers[proverAddress] = Prover({
            proverAddress: proverAddress,
            sphincsPubKeyHash: sphincsPubKeyHash,
            sphincsPublicKey: sphincsPublicKey,
            stakedAmount: 0,  // No stake required for testnet
            registeredAt: block.timestamp,
            isActive: true,
            successfulSigns: 0,
            slashedCount: 0
        });

        activeProvers.push(proverAddress);
        emit ProverRegistered(proverAddress, sphincsPubKeyHash, 0);
    }

    // =========================================================================
    // State Management
    // =========================================================================

    function updateStateRoot(bytes32 newStateRoot) external onlyOwner {
        currentStateRoot = newStateRoot;
        emit StateRootUpdated(newStateRoot, block.number);
    }

    function setSPHINCSVerifier(address _sphincsVerifier) external onlyOwner {
        address oldVerifier = address(sphincsVerifier);
        sphincsVerifier = ISPHINCSVerifier(_sphincsVerifier);
        emit SPHINCSVerifierUpdated(oldVerifier, _sphincsVerifier);
    }

    /// @notice Set the scheme registry used to resolve the active signature verifier.
    /// @dev Crypto-agility (Move 2). address(0) disables the registry (falls back to
    ///      sphincsVerifier). The registry itself must be governed (timelock) — see
    ///      SchemeRegistry.
    function setSchemeRegistry(address _registry) external onlyOwner {
        address old = address(schemeRegistry);
        schemeRegistry = SchemeRegistry(_registry);
        emit SchemeRegistryUpdated(old, _registry);
    }

    /// @notice Select which scheme's verifier is used for prover-signature verification.
    /// @dev The chosen scheme must be registered in the SchemeRegistry (unless falling
    ///      back to the built-in sphincsVerifier for the default scheme).
    function setActiveSchemeId(bytes4 _schemeId) external onlyOwner {
        bytes4 old = activeSchemeId;
        activeSchemeId = _schemeId;
        emit ActiveSchemeUpdated(old, _schemeId);
    }

    /// @notice Resolve the verifier for the active scheme: prefer the SchemeRegistry entry,
    ///         else fall back to the built-in sphincsVerifier (backward compatible).
    function _activeVerifier() internal view returns (ISignatureVerifier) {
        if (address(schemeRegistry) != address(0)) {
            address v = schemeRegistry.verifierFor(activeSchemeId);
            if (v != address(0)) return ISignatureVerifier(v);
        }
        return ISignatureVerifier(address(sphincsVerifier));
    }

    function setFullVerification(bool _enable) external onlyOwner {
        useFullVerification = _enable;
    }

    /// @notice Set the external Prover Registry contract
    /// @dev v3.0: When set, prover lookups use registry instead of local mapping
    /// @param _proverRegistry Address of the ProverRegistry contract
    function setProverRegistry(address _proverRegistry) external onlyOwner {
        address oldRegistry = address(proverRegistry);
        proverRegistry = IProverRegistry(_proverRegistry);
        emit ProverRegistryUpdated(oldRegistry, _proverRegistry);
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /// @notice Verify SMT proof using SHA3-256 (FIPS 202 compliant)
    /// @dev FIX-001: Replaced keccak256 with SHA3_256.hashPair() for CP-1 compliance
    ///      keccak256 is vulnerable to Grover's algorithm and is explicitly prohibited
    ///      per CORE_PRINCIPLES.md. SHA3-256 provides full quantum resistance.
    /// @param leaf The leaf node to verify
    /// @param proof The merkle proof siblings
    /// @param root The expected merkle root
    /// @return True if proof is valid, false otherwise
    function _verifySMTProof(bytes32 leaf, bytes32[] calldata proof, bytes32 root) internal pure returns (bool) {
        bytes32 computedRoot = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            if (computedRoot < proof[i]) {
                computedRoot = SHA3_256.hashPair(computedRoot, proof[i]);
            } else {
                computedRoot = SHA3_256.hashPair(proof[i], computedRoot);
            }
        }
        return computedRoot == root;
    }

    /// @notice Verify threshold signatures from provers
    /// @dev FIX-008: Now uses SHA3-256 for message hash instead of keccak256
    ///      This provides quantum resistance per CP-1 requirements.
    /// @param lockId The lock ID being verified
    /// @param stateRoot The state root to sign
    /// @param signatures Array of SPHINCS+ signatures
    /// @param signers Array of prover addresses who signed
    /// @return validCount Number of valid signatures
    function _verifyThresholdSignatures(bytes32 lockId, bytes32 stateRoot, bytes[] calldata signatures, address[] calldata signers) internal view returns (uint256 validCount) {
        // FIX-008: Use SHA3-256 instead of keccak256 for quantum resistance
        bytes32 message = SHA3_256.hashPair(lockId, stateRoot);
        if (useFullVerification && address(_activeVerifier()) != address(0)) {
            return _verifyWithSPHINCSVerifier(message, signatures, signers);
        }
        return _verifySimplified(message, signatures, signers);
    }

    function _verifyWithSPHINCSVerifier(bytes32 message, bytes[] calldata signatures, address[] calldata signers) internal view returns (uint256 validCount) {
        // Crypto-agility (Move 2): resolve the active scheme's verifier once. Falls back
        // to the built-in sphincsVerifier when no SchemeRegistry is configured.
        ISignatureVerifier verifier = _activeVerifier();
        for (uint256 i = 0; i < signatures.length; i++) {
            // Distinct-signer: a prover appearing more than once must not be
            // counted twice, otherwise a single prover could satisfy the M-of-N
            // threshold on its own (QS-SEC-THRESH-001).
            if (_isDuplicateSigner(signers, i)) continue;

            bytes memory pubKey;
            bool isActive;

            // v3.0: Use external registry if set, otherwise fall back to local mapping
            if (address(proverRegistry) != address(0)) {
                isActive = proverRegistry.isActiveProver(signers[i]);
                pubKey = proverRegistry.getPublicKey(signers[i]);
            } else {
                Prover storage prover = provers[signers[i]];
                isActive = prover.isActive;
                pubKey = prover.sphincsPublicKey;
            }

            if (!isActive) continue;
            if (pubKey.length != 32) continue;
            if (verifier.verify(message, signatures[i], pubKey)) validCount++;
        }
    }

    /// @notice Simplified signature verification (for testing/non-SPHINCS mode)
    /// @dev FIX-009: Now uses SHA3-256 for signature hash instead of keccak256
    ///      This provides quantum resistance per CP-1 requirements.
    ///      v3.0: Now supports external ProverRegistry
    /// @param message The message that was signed
    /// @param signatures Array of signatures
    /// @param signers Array of signer addresses
    /// @return validCount Number of valid signatures
    function _verifySimplified(bytes32 message, bytes[] calldata signatures, address[] calldata signers) internal view returns (uint256 validCount) {
        for (uint256 i = 0; i < signatures.length; i++) {
            // Distinct-signer enforcement (QS-SEC-THRESH-001), consistent with
            // the full-verification path.
            if (_isDuplicateSigner(signers, i)) continue;

            bytes32 pubKeyHash;
            bool isActive;

            // v3.0: Use external registry if set, otherwise fall back to local mapping
            if (address(proverRegistry) != address(0)) {
                isActive = proverRegistry.isActiveProver(signers[i]);
                pubKeyHash = proverRegistry.getPublicKeyHash(signers[i]);
            } else {
                Prover storage prover = provers[signers[i]];
                isActive = prover.isActive;
                pubKeyHash = prover.sphincsPubKeyHash;
            }

            if (!isActive) continue;
            // FIX-009: Use SHA3-256 instead of keccak256 for quantum resistance
            bytes32 sigHash = SHA3_256.hash(abi.encodePacked(pubKeyHash, message, signatures[i]));
            if (sigHash != bytes32(0)) validCount++;
        }
    }

    /// @notice True if signers[idx] already appears at an earlier index
    /// @dev Enforces distinct signers in threshold verification so no single
    ///      prover can be counted more than once toward the M-of-N threshold
    ///      (QS-SEC-THRESH-001). O(n^2) but n is bounded by the small prover set.
    function _isDuplicateSigner(address[] calldata signers, uint256 idx) private pure returns (bool) {
        for (uint256 j = 0; j < idx; j++) {
            if (signers[j] == signers[idx]) return true;
        }
        return false;
    }

    function _calculateSlash(uint256 numColluding, uint256 amount) internal pure returns (uint256) {
        uint256 slashPercent = numColluding * numColluding * 10;
        if (slashPercent > 100) slashPercent = 100;
        return (amount * slashPercent) / 100;
    }

    /// @notice Slash each distinct signing prover of a fraudulent unlock and return the
    ///         total slashed. QS-SEC-VAULT-004: the challenger reward / insurance / burn
    ///         are funded from this slashed stake (real ETH the provers deposited at
    ///         registration) rather than from the pooled vault balance, so a valid
    ///         challenge no longer makes the vault insolvent.
    /// @dev    Slashes a quadratic percentage of each prover's OWN stake (capped at their
    ///         balance), distributed by slashing each distinct signer equally.
    function _slashSigningProvers(bytes32 lockId) internal returns (uint256 totalSlashed) {
        address[] storage signers = unlockSigningProvers[lockId];
        uint256 len = signers.length;

        // Collusion factor = number of DISTINCT signers, not the raw array length. The
        // stored array is the caller-supplied input and may contain padded duplicates
        // (which never count toward the unlock threshold); using the raw length would let
        // a crafted unlock inflate the quadratic slash on honest provers (self-audit fix).
        uint256 distinct = 0;
        for (uint256 i = 0; i < len; i++) {
            bool dup = false;
            for (uint256 j = 0; j < i; j++) {
                if (signers[j] == signers[i]) { dup = true; break; }
            }
            if (!dup) distinct++;
        }

        for (uint256 i = 0; i < len; i++) {
            // Slash each prover at most once even if it appears multiple times.
            bool duplicate = false;
            for (uint256 j = 0; j < i; j++) {
                if (signers[j] == signers[i]) { duplicate = true; break; }
            }
            if (duplicate) continue;

            Prover storage p = provers[signers[i]];
            uint256 staked = p.stakedAmount;
            if (staked == 0) continue;

            uint256 slash = _calculateSlash(distinct, staked); // distinct^2*10% of the prover's own stake
            if (slash > staked) slash = staked;                // cap at available stake
            p.stakedAmount = staked - slash;
            p.slashedCount += 1;
            totalSlashed += slash;
        }
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    function getLock(bytes32 lockId) external view returns (Lock memory) { return locks[lockId]; }
    function getUnlockRequest(bytes32 lockId) external view returns (UnlockRequest memory) { return unlockRequests[lockId]; }
    function getChallenge(bytes32 lockId) external view returns (Challenge memory) { return challenges[lockId]; }
    function getProver(address proverAddress) external view returns (Prover memory) { return provers[proverAddress]; }
    function getActiveProverCount() external view returns (uint256) {
        // v3.0: Use external registry if set
        if (address(proverRegistry) != address(0)) {
            return proverRegistry.getActiveProverCount();
        }
        return activeProvers.length;
    }

    /// @notice Get the total locked amount for a specific user
    /// @dev Uses cached userLockedBalance mapping for O(1) lookup
    /// @param user The user address to check
    /// @return Total amount locked by the user (active locks only)
    function lockedBalanceOf(address user) external view returns (uint256) {
        return userLockedBalance[user];
    }

    /// @notice Get all lock IDs for a specific user
    /// @dev Returns array of lock IDs where user is the sender
    /// @param user The user address to check
    /// @return lockIds Array of lock IDs belonging to the user
    function getUserLockIds(address user) external view returns (bytes32[] memory lockIds) {
        // Count locks first
        uint256 count = 0;
        for (uint256 i = 0; i < userLockIds[user].length; i++) {
            bytes32 lockId = userLockIds[user][i];
            if (locks[lockId].status == LockStatus.ACTIVE || locks[lockId].status == LockStatus.PENDING_UNLOCK || locks[lockId].status == LockStatus.EMERGENCY_PENDING) {
                count++;
            }
        }

        // Build result array
        lockIds = new bytes32[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < userLockIds[user].length; i++) {
            bytes32 lockId = userLockIds[user][i];
            if (locks[lockId].status == LockStatus.ACTIVE || locks[lockId].status == LockStatus.PENDING_UNLOCK || locks[lockId].status == LockStatus.EMERGENCY_PENDING) {
                lockIds[idx++] = lockId;
            }
        }
    }

    function calculateChallengeBond(uint256 amount) external pure returns (uint256) {
        uint256 bond = (amount * CHALLENGE_BOND_PERCENT) / 100;
        return bond < MIN_CHALLENGE_BOND ? MIN_CHALLENGE_BOND : bond;
    }

    function isQuantumResistant() external pure returns (bool) { return true; }
    function getSPHINCSVerifier() external view returns (address) { return address(sphincsVerifier); }
    function isFullVerificationEnabled() external view returns (bool) { return useFullVerification && address(_activeVerifier()) != address(0); }

    /// @notice The verifier that will be used for prover-signature verification right now,
    ///         after resolving the SchemeRegistry (crypto-agility, Move 2). For ops/introspection.
    function activeVerifier() external view returns (address) { return address(_activeVerifier()); }

    function getSlashingDistribution() external pure returns (uint256 challenger, uint256 insurance, uint256 burn) {
        return (SLASH_CHALLENGER_PERCENT, SLASH_INSURANCE_PERCENT, SLASH_BURN_PERCENT);
    }

    function computeStateRoot(uint256 chainId, address asset, uint256 amount, address destAddr, uint256 expiry, uint256 nonce, bytes32 pkDilithium) external pure returns (bytes32) {
        return StateRootCalculator.computeSR0(chainId, asset, amount, destAddr, expiry, nonce, pkDilithium);
    }

    function computeUnlockStateRoot(bytes32 sr0, bytes32 lockId, address destAddr, uint256 amount, uint256 nonce) external pure returns (bytes32) {
        return StateRootCalculator.computeSR1(sr0, lockId, destAddr, amount, nonce);
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    function pause() external onlySecurityCouncil { _pause(); }
    function unpause() external onlySecurityCouncil { _unpause(); }

    /// @notice Transfer ownership to a new owner
    /// @dev SEC-002 FIX-005: Added OwnershipTransferred event emission
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /// @notice Update the security council address
    /// @dev SEC-002 FIX-006: Added SecurityCouncilUpdated event emission
    function updateSecurityCouncil(address newCouncil) external onlySecurityCouncil {
        if (newCouncil == address(0)) revert ZeroAddress();
        address previousCouncil = securityCouncil;
        securityCouncil = newCouncil;
        emit SecurityCouncilUpdated(previousCouncil, newCouncil);
    }

    receive() external payable {}
}
