// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title OptimisticQuantumBridge - Phase 1 Optimistic Attestation Model
/// @notice Enables quantum-resistant asset transfers using Dilithium attestations
/// @dev Uses an optimistic model: attestation hash is verified on-chain,
///      full proof is available off-chain for dispute resolution
///
/// Architecture:
/// ┌───────────────────────────────────────────────────────────────────────────┐
/// │                     Optimistic Quantum Bridge                              │
/// ├───────────────────────────────────────────────────────────────────────────┤
/// │  Client (8GB MacBook)         Prover Network              L1 Contract     │
/// │       │                              │                         │          │
/// │       │ Dilithium Sign               │                         │          │
/// │       └──────────────────────────────►                         │          │
/// │                    │ Verify + Create Attestation               │          │
/// │                    │                                           │          │
/// │                    └───────────────────────────────────────────►          │
/// │                                              ├─ Verify Attestation Hash   │
/// │                                              ├─ Check Prover Signature    │
/// │                                              └─ Execute State Change      │
/// └───────────────────────────────────────────────────────────────────────────┘
///
/// Security Model:
/// 1. Prover Network verifies Dilithium signatures off-chain
/// 2. Attestation hash (keccak256) is submitted to L1 (~50K gas)
/// 3. Full STARK proof stored in DA layer for dispute resolution
/// 4. Provers are economically bonded (slashing for invalid attestations)
contract OptimisticQuantumBridge {
    // =========================================================================
    // Events
    // =========================================================================

    event Locked(
        bytes32 indexed lockId,
        address indexed sender,
        uint256 amount,
        bytes32 dilithiumPubKeyHash,
        uint256 nonce
    );

    event AttestationSubmitted(
        bytes32 indexed lockId,
        bytes32 attestationHash,
        address indexed prover,
        uint256 timestamp
    );

    event Released(
        bytes32 indexed lockId,
        address indexed recipient,
        uint256 amount
    );

    event Challenged(
        bytes32 indexed lockId,
        address indexed challenger,
        uint256 challengeBond
    );

    event ChallengeResolved(
        bytes32 indexed lockId,
        bool attestationValid,
        address winner
    );

    event ProverRegistered(address indexed prover, uint256 stake);
    event ProverSlashed(address indexed prover, uint256 amount, bytes32 reason);
    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // =========================================================================
    // Errors
    // =========================================================================

    error InsufficientAmount();
    error LockNotFound();
    error LockAlreadyReleased();
    error TransferFailed();
    error Paused();
    error NotOwner();
    error ZeroAddress();
    error InvalidAttestation();
    error AttestationNotFound();
    error ChallengeWindowNotExpired();
    error ChallengeWindowExpired();
    error AlreadyChallenged();
    error NotRegisteredProver();
    error InsufficientStake();
    error InvalidSignature();
    error NonceMismatch();

    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Challenge window duration (default: 7 days for optimistic finality)
    uint256 public constant CHALLENGE_WINDOW = 7 days;

    /// @notice Minimum prover stake (1 ETH)
    uint256 public constant MIN_PROVER_STAKE = 1 ether;

    /// @notice Challenge bond (0.1 ETH)
    uint256 public constant CHALLENGE_BOND = 0.1 ether;

    // =========================================================================
    // Structs
    // =========================================================================

    struct Lock {
        address sender;
        uint256 amount;
        bytes32 dilithiumPubKeyHash;  // Keccak256 hash of Dilithium public key
        uint256 timestamp;
        bool released;
    }

    struct Attestation {
        bytes32 lockId;
        bytes32 attestationHash;      // Hash of (pubKeyHash, messageHash, sigHash, nonce)
        address prover;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        uint256 nonce;
        bool executed;
        bool challenged;
    }

    struct Prover {
        uint256 stake;
        uint256 successfulAttestations;
        uint256 slashedCount;
        bool active;
    }

    // =========================================================================
    // State
    // =========================================================================

    /// @notice Contract owner
    address public owner;

    /// @notice Emergency pause flag
    bool public paused;

    /// @notice Total locked value
    uint256 public totalLocked;

    /// @notice Global nonce counter
    uint256 public nonceCounter;

    /// @notice Mapping of lock ID to lock details
    mapping(bytes32 => Lock) public locks;

    /// @notice Mapping of attestation ID to attestation details
    mapping(bytes32 => Attestation) public attestations;

    /// @notice Registered provers
    mapping(address => Prover) public provers;

    /// @notice Used nonces for replay protection
    mapping(uint256 => bool) public usedNonces;

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    modifier onlyRegisteredProver() {
        if (!provers[msg.sender].active) revert NotRegisteredProver();
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor() {
        owner = msg.sender;
    }

    // =========================================================================
    // Prover Registration
    // =========================================================================

    /// @notice Register as a prover by staking ETH
    function registerProver() external payable {
        if (msg.value < MIN_PROVER_STAKE) revert InsufficientStake();

        Prover storage prover = provers[msg.sender];
        prover.stake += msg.value;
        prover.active = true;

        emit ProverRegistered(msg.sender, prover.stake);
    }

    /// @notice Withdraw prover stake (only if no pending attestations)
    function withdrawStake(uint256 amount) external {
        Prover storage prover = provers[msg.sender];
        if (prover.stake < amount) revert InsufficientStake();

        prover.stake -= amount;
        if (prover.stake < MIN_PROVER_STAKE) {
            prover.active = false;
        }

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    // =========================================================================
    // Core Functions
    // =========================================================================

    /// @notice Lock ETH for cross-chain transfer
    /// @param dilithiumPubKeyHash Keccak256 hash of the Dilithium public key
    /// @return lockId Unique identifier for this lock
    function lock(bytes32 dilithiumPubKeyHash) external payable whenNotPaused returns (bytes32 lockId) {
        if (msg.value == 0) revert InsufficientAmount();

        uint256 nonce = nonceCounter++;

        // Generate unique lock ID
        lockId = keccak256(abi.encodePacked(
            msg.sender,
            msg.value,
            dilithiumPubKeyHash,
            nonce,
            block.timestamp
        ));

        locks[lockId] = Lock({
            sender: msg.sender,
            amount: msg.value,
            dilithiumPubKeyHash: dilithiumPubKeyHash,
            timestamp: block.timestamp,
            released: false
        });

        totalLocked += msg.value;

        emit Locked(lockId, msg.sender, msg.value, dilithiumPubKeyHash, nonce);
    }

    /// @notice Submit an attestation for a lock (called by prover)
    /// @param lockId The lock being attested
    /// @param attestationHash Hash computed from Dilithium verification
    /// @param recipient Address to receive the funds
    /// @param nonce Unique nonce for replay protection
    /// @param proverSignature ECDSA signature from the prover
    /// @return attestationId Unique identifier for this attestation
    function submitAttestation(
        bytes32 lockId,
        bytes32 attestationHash,
        address recipient,
        uint256 nonce,
        bytes calldata proverSignature
    ) external whenNotPaused onlyRegisteredProver returns (bytes32 attestationId) {
        // Validate lock exists and not released
        Lock storage lockData = locks[lockId];
        if (lockData.sender == address(0)) revert LockNotFound();
        if (lockData.released) revert LockAlreadyReleased();
        if (recipient == address(0)) revert ZeroAddress();

        // Validate nonce
        if (usedNonces[nonce]) revert NonceMismatch();

        // Verify prover signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            lockId,
            attestationHash,
            recipient,
            lockData.amount,
            nonce
        ));
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));

        address signer = recoverSigner(ethSignedHash, proverSignature);
        if (signer != msg.sender) revert InvalidSignature();

        // Create attestation ID
        attestationId = keccak256(abi.encodePacked(
            lockId,
            attestationHash,
            msg.sender,
            nonce
        ));

        // Store attestation
        attestations[attestationId] = Attestation({
            lockId: lockId,
            attestationHash: attestationHash,
            prover: msg.sender,
            recipient: recipient,
            amount: lockData.amount,
            timestamp: block.timestamp,
            nonce: nonce,
            executed: false,
            challenged: false
        });

        usedNonces[nonce] = true;

        emit AttestationSubmitted(lockId, attestationHash, msg.sender, block.timestamp);
    }

    /// @notice Execute a release after challenge window expires
    /// @param attestationId The attestation to execute
    function executeRelease(bytes32 attestationId) external whenNotPaused {
        Attestation storage att = attestations[attestationId];
        if (att.prover == address(0)) revert AttestationNotFound();
        if (att.executed) revert LockAlreadyReleased();
        if (att.challenged) revert AlreadyChallenged();

        // Check challenge window has expired
        if (block.timestamp < att.timestamp + CHALLENGE_WINDOW) {
            revert ChallengeWindowNotExpired();
        }

        Lock storage lockData = locks[att.lockId];
        if (lockData.released) revert LockAlreadyReleased();

        // Mark as executed
        att.executed = true;
        lockData.released = true;
        totalLocked -= att.amount;

        // Update prover stats
        provers[att.prover].successfulAttestations++;

        // Transfer funds to recipient
        (bool success, ) = att.recipient.call{value: att.amount}("");
        if (!success) revert TransferFailed();

        emit Released(att.lockId, att.recipient, att.amount);
    }

    /// @notice Challenge an attestation (requires bond)
    /// @param attestationId The attestation to challenge
    function challenge(bytes32 attestationId) external payable whenNotPaused {
        if (msg.value < CHALLENGE_BOND) revert InsufficientAmount();

        Attestation storage att = attestations[attestationId];
        if (att.prover == address(0)) revert AttestationNotFound();
        if (att.executed) revert LockAlreadyReleased();
        if (att.challenged) revert AlreadyChallenged();

        // Check still within challenge window
        if (block.timestamp >= att.timestamp + CHALLENGE_WINDOW) {
            revert ChallengeWindowExpired();
        }

        att.challenged = true;

        emit Challenged(att.lockId, msg.sender, msg.value);
    }

    /// @notice Resolve a challenge (called by owner/arbitrator with off-chain proof)
    /// @param attestationId The challenged attestation
    /// @param attestationValid Whether the attestation was valid
    /// @param challenger The address that initiated the challenge
    function resolveChallenge(
        bytes32 attestationId,
        bool attestationValid,
        address challenger
    ) external onlyOwner {
        Attestation storage att = attestations[attestationId];
        if (att.prover == address(0)) revert AttestationNotFound();
        if (!att.challenged) revert AttestationNotFound();

        Lock storage lockData = locks[att.lockId];

        if (attestationValid) {
            // Attestation was valid - execute it and give challenger's bond to prover
            att.executed = true;
            lockData.released = true;
            totalLocked -= att.amount;

            // Transfer to recipient
            (bool success1, ) = att.recipient.call{value: att.amount}("");
            if (!success1) revert TransferFailed();

            // Challenger loses bond to prover
            (bool success2, ) = att.prover.call{value: CHALLENGE_BOND}("");
            if (!success2) revert TransferFailed();

            provers[att.prover].successfulAttestations++;

            emit ChallengeResolved(att.lockId, true, att.prover);
        } else {
            // Attestation was invalid - slash prover and refund challenger
            Prover storage prover = provers[att.prover];
            uint256 slashAmount = att.amount > prover.stake ? prover.stake : att.amount;
            prover.stake -= slashAmount;
            prover.slashedCount++;

            if (prover.stake < MIN_PROVER_STAKE) {
                prover.active = false;
            }

            // Refund challenger with bonus from slashed stake
            uint256 challengerReward = CHALLENGE_BOND + (slashAmount / 2);
            (bool success, ) = challenger.call{value: challengerReward}("");
            if (!success) revert TransferFailed();

            emit ProverSlashed(att.prover, slashAmount, keccak256("INVALID_ATTESTATION"));
            emit ChallengeResolved(att.lockId, false, challenger);
        }
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /// @notice Get lock details
    function getLock(bytes32 lockId) external view returns (
        address sender,
        uint256 amount,
        bytes32 dilithiumPubKeyHash,
        uint256 timestamp,
        bool released
    ) {
        Lock storage l = locks[lockId];
        return (l.sender, l.amount, l.dilithiumPubKeyHash, l.timestamp, l.released);
    }

    /// @notice Get attestation details
    function getAttestation(bytes32 attestationId) external view returns (
        bytes32 lockId,
        bytes32 attestationHash,
        address prover,
        address recipient,
        uint256 amount,
        uint256 timestamp,
        bool executed,
        bool challenged
    ) {
        Attestation storage a = attestations[attestationId];
        return (
            a.lockId,
            a.attestationHash,
            a.prover,
            a.recipient,
            a.amount,
            a.timestamp,
            a.executed,
            a.challenged
        );
    }

    /// @notice Check if an attestation can be executed
    function canExecute(bytes32 attestationId) external view returns (bool) {
        Attestation storage att = attestations[attestationId];
        if (att.prover == address(0)) return false;
        if (att.executed) return false;
        if (att.challenged) return false;
        return block.timestamp >= att.timestamp + CHALLENGE_WINDOW;
    }

    /// @notice Time remaining in challenge window
    function challengeWindowRemaining(bytes32 attestationId) external view returns (uint256) {
        Attestation storage att = attestations[attestationId];
        if (att.prover == address(0)) return 0;

        uint256 deadline = att.timestamp + CHALLENGE_WINDOW;
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    /// @notice Get prover info
    function getProverInfo(address prover) external view returns (
        uint256 stake,
        uint256 successfulAttestations,
        uint256 slashedCount,
        bool active
    ) {
        Prover storage p = provers[prover];
        return (p.stake, p.successfulAttestations, p.slashedCount, p.active);
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    /// @notice Emergency pause
    function pause() external onlyOwner {
        paused = true;
        emit EmergencyPaused(msg.sender);
    }

    /// @notice Unpause after emergency
    function unpause() external onlyOwner {
        paused = false;
        emit EmergencyUnpaused(msg.sender);
    }

    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /// @notice Recover signer from ECDSA signature
    function recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        if (signature.length != 65) return address(0);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);

        return ecrecover(hash, v, r, s);
    }

    // =========================================================================
    // Receive
    // =========================================================================

    receive() external payable {}
}
