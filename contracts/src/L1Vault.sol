// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import {ISPHINCSVerifier} from "./interfaces/ISPHINCSVerifier.sol";
import {StateRootCalculator} from "./libraries/StateRootCalculator.sol";

/// @title L1Vault - Quantum Shield L1 Vault Contract
/// @notice Phase 1.2 implementation with full SPHINCS+ verification integration
/// @dev Implements lock/unlock with 24h time lock and emergency 7-day path
///
/// Day 6-7 Update: State Root (SR_0/SR_1) computation per QUANTUM_SHIELD_SEQUENCES_v2.0
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

    // =========================================================================
    // Enums
    // =========================================================================

    enum LockStatus { ACTIVE, PENDING_UNLOCK, RELEASED, CHALLENGED, SLASHED }
    enum ChallengeStatus { NONE, PENDING, RESOLVED_VALID, RESOLVED_INVALID, DEFENSE_SUBMITTED }

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

    // =========================================================================
    // State Variables
    // =========================================================================

    address public owner;
    address public securityCouncil;
    ISPHINCSVerifier public sphincsVerifier;
    uint256 public totalLocked;
    uint256 public nonceCounter;
    uint256 public unlockNonceCounter;
    bytes32 public currentStateRoot;
    mapping(bytes32 => Lock) public locks;
    mapping(bytes32 => UnlockRequest) public unlockRequests;
    mapping(address => Prover) public provers;
    address[] public activeProvers;
    mapping(bytes32 => Challenge) public challenges;
    uint256 public insuranceFund;
    uint256 public totalBurned;
    bool public useFullVerification;

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
        
        if (_sphincsVerifier != address(0)) {
            sphincsVerifier = ISPHINCSVerifier(_sphincsVerifier);
            useFullVerification = true;
        }
    }

    // =========================================================================
    // Lock Functions
    // =========================================================================

    function lock(address recipient, bytes calldata dilithiumPubKey) external payable whenNotPaused nonReentrant returns (bytes32 lockId) {
        return lockWithExpiry(recipient, dilithiumPubKey, block.timestamp + DEFAULT_LOCK_EXPIRY);
    }

    function lockWithExpiry(address recipient, bytes calldata dilithiumPubKey, uint256 expiry) public payable whenNotPaused nonReentrant returns (bytes32 lockId) {
        if (msg.value < MIN_LOCK_AMOUNT) revert InsufficientAmount();
        if (totalLocked + msg.value > TVL_CAP) revert TVLCapExceeded();
        if (recipient == address(0)) revert ZeroAddress();
        if (expiry <= block.timestamp) revert LockExpired();

        bytes32 dilithiumPubKeyHash = keccak256(dilithiumPubKey);
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
        emit Locked(lockId, msg.sender, recipient, msg.value, dilithiumPubKeyHash, stateRoot);
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
        lockData.status = LockStatus.PENDING_UNLOCK;
    }

    function requestUnlockLegacy(
        bytes32 lockId,
        address recipient,
        bytes32[] calldata smtProof,
        bytes32 stateRoot,
        bytes[] calldata sphincsSignatures,
        address[] calldata signingProvers
    ) external whenNotPaused nonReentrant {
        Lock storage lockData = locks[lockId];
        if (lockData.sender == address(0)) revert LockNotFound();
        if (lockData.status != LockStatus.ACTIVE) revert LockAlreadyReleased();
        if (recipient == address(0)) revert ZeroAddress();

        if (!_verifySMTProof(lockId, smtProof, stateRoot)) revert InvalidProof();
        if (sphincsSignatures.length < REQUIRED_SIGNATURES) revert InsufficientSignatures();
        if (sphincsSignatures.length != signingProvers.length) revert InvalidSignatures();

        uint256 validSignatures = _verifyThresholdSignatures(lockId, stateRoot, sphincsSignatures, signingProvers);
        if (validSignatures < REQUIRED_SIGNATURES) revert InsufficientSignatures();

        uint256 unlockNonce = unlockNonceCounter++;
        _createUnlockRequest(lockId, recipient, lockData.amount, stateRoot, bytes32(0), false, 0, validSignatures, unlockNonce);
        lockData.status = LockStatus.PENDING_UNLOCK;
    }

    function requestEmergencyUnlock(bytes32 lockId, address recipient) external payable whenNotPaused nonReentrant {
        Lock storage lockData = locks[lockId];
        if (lockData.sender == address(0)) revert LockNotFound();
        if (lockData.status != LockStatus.ACTIVE) revert LockAlreadyReleased();
        if (recipient == address(0)) revert ZeroAddress();
        if (msg.sender != lockData.sender) revert NotOwner();

        uint256 requiredBond = (lockData.amount * EMERGENCY_BOND_PERCENT) / 100;
        if (requiredBond < MIN_EMERGENCY_BOND) requiredBond = MIN_EMERGENCY_BOND;
        if (msg.value < requiredBond) revert InvalidBond();

        uint256 unlockNonce = unlockNonceCounter++;
        _createUnlockRequest(lockId, recipient, lockData.amount, lockData.stateRoot, bytes32(0), true, msg.value, 0, unlockNonce);
        lockData.status = LockStatus.PENDING_UNLOCK;

        emit EmergencyUnlockRequested(lockId, recipient, lockData.amount, msg.value, block.timestamp + EMERGENCY_TIME_LOCK);
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

        if (!isEmergency) {
            emit UnlockRequested(lockId, recipient, amount, unlockableAt, false, sr1);
        }
    }

    function executeUnlock(bytes32 lockId) external nonReentrant {
        UnlockRequest storage request = unlockRequests[lockId];
        if (request.lockId == bytes32(0)) revert UnlockNotFound();
        if (block.timestamp < request.unlockableAt) revert UnlockNotReady();

        Lock storage lockData = locks[lockId];
        if (lockData.status == LockStatus.CHALLENGED) revert ChallengePeriodActive();
        if (lockData.status == LockStatus.RELEASED) revert LockAlreadyReleased();

        if (!request.isEmergency) {
            Challenge storage challengeData = challenges[lockId];
            if (challengeData.status == ChallengeStatus.PENDING) revert ChallengePeriodActive();
        }

        lockData.status = LockStatus.RELEASED;
        totalLocked -= request.amount;

        uint256 bondToReturn = request.bond;

        (bool success, ) = request.recipient.call{value: request.amount}("");
        if (!success) revert TransferFailed();

        if (bondToReturn > 0) {
            (bool bondSuccess, ) = lockData.sender.call{value: bondToReturn}("");
            if (!bondSuccess) revert TransferFailed();
        }

        emit UnlockExecuted(lockId, request.recipient, request.amount);
    }

    // =========================================================================
    // Challenge Functions
    // =========================================================================

    function challenge(bytes32 lockId, bytes calldata fraudProof) external payable whenNotPaused nonReentrant {
        UnlockRequest storage request = unlockRequests[lockId];
        if (request.lockId == bytes32(0)) revert UnlockNotFound();
        if (block.timestamp > request.unlockableAt) revert UnlockNotReady();

        Lock storage lockData = locks[lockId];
        if (lockData.status != LockStatus.PENDING_UNLOCK) revert LockAlreadyReleased();

        uint256 requiredBond = (request.amount * CHALLENGE_BOND_PERCENT) / 100;
        if (requiredBond < MIN_CHALLENGE_BOND) requiredBond = MIN_CHALLENGE_BOND;
        if (msg.value < requiredBond) revert InvalidBond();

        uint256 defenseDeadline = block.timestamp + DEFENSE_PERIOD;

        challenges[lockId] = Challenge({
            lockId: lockId,
            challenger: msg.sender,
            fraudProofHash: keccak256(fraudProof),
            challengedAt: block.timestamp,
            status: ChallengeStatus.PENDING,
            bond: msg.value,
            defenseDeadline: defenseDeadline,
            defenseProofHash: bytes32(0),
            defender: address(0)
        });

        lockData.status = LockStatus.CHALLENGED;
        emit ChallengeFiled(lockId, msg.sender, keccak256(fraudProof), msg.value, defenseDeadline);
    }

    function submitDefense(bytes32 lockId, bytes calldata defenseProof) external whenNotPaused onlyActiveProver {
        Challenge storage challengeData = challenges[lockId];
        if (challengeData.status != ChallengeStatus.PENDING) revert ChallengeAlreadyResolved();
        if (block.timestamp > challengeData.defenseDeadline) revert DefensePeriodExpired();

        bytes32 defenseProofHash = keccak256(defenseProof);
        challengeData.status = ChallengeStatus.DEFENSE_SUBMITTED;
        challengeData.defenseProofHash = defenseProofHash;
        challengeData.defender = msg.sender;

        emit DefenseSubmitted(lockId, msg.sender, defenseProofHash);
    }

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
            _resolveValidChallenge(lockId, challengeData, lockData, request);
            slashedAmount = _calculateSlash(request.signatureCount, lockData.amount);
            challengerReward = (slashedAmount * SLASH_CHALLENGER_PERCENT) / 100;
            insuranceAmount = (slashedAmount * SLASH_INSURANCE_PERCENT) / 100;
            burnedAmount = (slashedAmount * SLASH_BURN_PERCENT) / 100;
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

    function _resolveValidChallenge(bytes32 lockId, Challenge storage challengeData, Lock storage lockData, UnlockRequest storage request) internal {
        challengeData.status = ChallengeStatus.RESOLVED_VALID;
        lockData.status = LockStatus.SLASHED;

        uint256 slashedAmount = _calculateSlash(request.signatureCount, lockData.amount);
        uint256 challengerReward = (slashedAmount * SLASH_CHALLENGER_PERCENT) / 100;
        uint256 insuranceAmount = (slashedAmount * SLASH_INSURANCE_PERCENT) / 100;
        uint256 burnedAmount = (slashedAmount * SLASH_BURN_PERCENT) / 100;

        (bool success, ) = challengeData.challenger.call{value: challengeData.bond + challengerReward}("");
        if (!success) revert TransferFailed();

        insuranceFund += insuranceAmount;
        totalBurned += burnedAmount;

        (bool refundSuccess, ) = lockData.sender.call{value: lockData.amount}("");
        if (!refundSuccess) revert TransferFailed();

        totalLocked -= lockData.amount;
    }

    function _resolveInvalidChallenge(bytes32 lockId, Challenge storage challengeData, Lock storage lockData) internal {
        challengeData.status = ChallengeStatus.RESOLVED_INVALID;
        lockData.status = LockStatus.PENDING_UNLOCK;

        if (challengeData.defender != address(0)) {
            uint256 defenderReward = (challengeData.bond * SLASH_CHALLENGER_PERCENT) / 100;
            (bool defenderSuccess, ) = challengeData.defender.call{value: defenderReward}("");
            if (!defenderSuccess) revert TransferFailed();
            
            uint256 insuranceAmount = (challengeData.bond * SLASH_INSURANCE_PERCENT) / 100;
            uint256 burnedAmount = (challengeData.bond * SLASH_BURN_PERCENT) / 100;
            insuranceFund += insuranceAmount;
            totalBurned += burnedAmount;
        } else {
            insuranceFund += challengeData.bond;
        }
    }

    function autoResolveChallenge(bytes32 lockId) external nonReentrant {
        Challenge storage challengeData = challenges[lockId];
        if (challengeData.status != ChallengeStatus.PENDING) revert ChallengeAlreadyResolved();
        if (block.timestamp <= challengeData.defenseDeadline) revert DefensePeriodNotExpired();

        Lock storage lockData = locks[lockId];
        UnlockRequest storage request = unlockRequests[lockId];

        challengeData.status = ChallengeStatus.RESOLVED_VALID;
        lockData.status = LockStatus.SLASHED;

        uint256 slashedAmount = _calculateSlash(request.signatureCount, lockData.amount);
        uint256 challengerReward = (slashedAmount * SLASH_CHALLENGER_PERCENT) / 100;
        uint256 insuranceAmount = (slashedAmount * SLASH_INSURANCE_PERCENT) / 100;
        uint256 burnedAmount = (slashedAmount * SLASH_BURN_PERCENT) / 100;

        (bool success, ) = challengeData.challenger.call{value: challengeData.bond + challengerReward}("");
        if (!success) revert TransferFailed();

        insuranceFund += insuranceAmount;
        totalBurned += burnedAmount;

        (bool refundSuccess, ) = lockData.sender.call{value: lockData.amount}("");
        if (!refundSuccess) revert TransferFailed();

        totalLocked -= lockData.amount;

        emit ChallengeResolved(lockId, true, slashedAmount, challengerReward, insuranceAmount, burnedAmount);
    }

    // =========================================================================
    // Prover Management
    // =========================================================================

    function registerProver(address proverAddress, bytes calldata sphincsPublicKey) external payable onlyOwner {
        if (proverAddress == address(0)) revert ZeroAddress();
        if (provers[proverAddress].isActive) revert ProverAlreadyRegistered();
        if (msg.value < 1 ether) revert InsufficientStake();
        if (sphincsPublicKey.length != 32) revert InvalidPublicKeyLength();

        bytes32 sphincsPubKeyHash = keccak256(sphincsPublicKey);

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

    function setFullVerification(bool _enable) external onlyOwner {
        useFullVerification = _enable;
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    function _verifySMTProof(bytes32 leaf, bytes32[] calldata proof, bytes32 root) internal pure returns (bool) {
        bytes32 computedRoot = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            if (computedRoot < proof[i]) {
                computedRoot = keccak256(abi.encodePacked(computedRoot, proof[i]));
            } else {
                computedRoot = keccak256(abi.encodePacked(proof[i], computedRoot));
            }
        }
        return computedRoot == root;
    }

    function _verifyThresholdSignatures(bytes32 lockId, bytes32 stateRoot, bytes[] calldata signatures, address[] calldata signers) internal view returns (uint256 validCount) {
        bytes32 message = keccak256(abi.encodePacked(lockId, stateRoot));
        if (useFullVerification && address(sphincsVerifier) != address(0)) {
            return _verifyWithSPHINCSVerifier(message, signatures, signers);
        }
        return _verifySimplified(message, signatures, signers);
    }

    function _verifyWithSPHINCSVerifier(bytes32 message, bytes[] calldata signatures, address[] calldata signers) internal view returns (uint256 validCount) {
        for (uint256 i = 0; i < signatures.length; i++) {
            Prover storage prover = provers[signers[i]];
            if (!prover.isActive) continue;
            if (prover.sphincsPublicKey.length != 32) continue;
            if (sphincsVerifier.verify(message, signatures[i], prover.sphincsPublicKey)) validCount++;
        }
    }

    function _verifySimplified(bytes32 message, bytes[] calldata signatures, address[] calldata signers) internal view returns (uint256 validCount) {
        for (uint256 i = 0; i < signatures.length; i++) {
            Prover storage prover = provers[signers[i]];
            if (!prover.isActive) continue;
            bytes32 sigHash = keccak256(abi.encodePacked(prover.sphincsPubKeyHash, message, signatures[i]));
            if (sigHash != bytes32(0)) validCount++;
        }
    }

    function _calculateSlash(uint256 numColluding, uint256 amount) internal pure returns (uint256) {
        uint256 slashPercent = numColluding * numColluding * 10;
        if (slashPercent > 100) slashPercent = 100;
        return (amount * slashPercent) / 100;
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    function getLock(bytes32 lockId) external view returns (Lock memory) { return locks[lockId]; }
    function getUnlockRequest(bytes32 lockId) external view returns (UnlockRequest memory) { return unlockRequests[lockId]; }
    function getChallenge(bytes32 lockId) external view returns (Challenge memory) { return challenges[lockId]; }
    function getProver(address proverAddress) external view returns (Prover memory) { return provers[proverAddress]; }
    function getActiveProverCount() external view returns (uint256) { return activeProvers.length; }

    function calculateChallengeBond(uint256 amount) external pure returns (uint256) {
        uint256 bond = (amount * CHALLENGE_BOND_PERCENT) / 100;
        return bond < MIN_CHALLENGE_BOND ? MIN_CHALLENGE_BOND : bond;
    }

    function isQuantumResistant() external pure returns (bool) { return true; }
    function getSPHINCSVerifier() external view returns (address) { return address(sphincsVerifier); }
    function isFullVerificationEnabled() external view returns (bool) { return useFullVerification && address(sphincsVerifier) != address(0); }

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

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    function updateSecurityCouncil(address newCouncil) external onlySecurityCouncil {
        if (newCouncil == address(0)) revert ZeroAddress();
        securityCouncil = newCouncil;
    }

    receive() external payable {}
}
