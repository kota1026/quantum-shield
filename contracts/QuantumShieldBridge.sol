// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IQuantumVerifier.sol";

/// @title QuantumShieldBridge - Post-Quantum Secure Cross-Chain Bridge
/// @notice Enables secure asset transfers using aggregated Dilithium signature proofs
/// @dev Uses ZK proofs to verify multiple PQC signatures in a single L1 transaction
///
/// Architecture:
/// ┌─────────────────────────────────────────────────────────────────┐
/// │                    Quantum Shield Bridge                         │
/// ├─────────────────────────────────────────────────────────────────┤
/// │  User locks ETH → Proof generated off-chain (SP1/Plonky2)       │
/// │                 → Proof submitted to L1                          │
/// │                 → Verifier validates aggregated Dilithium sigs   │
/// │                 → Assets released to recipient                   │
/// └─────────────────────────────────────────────────────────────────┘
///
/// Security Model:
/// 1. ZK Proof: Proves N Dilithium signatures were valid (aggregated)
/// 2. Commitment Check: Public inputs contain Dilithium commitment hash
/// 3. Replay Protection: Each transfer has unique nonce
/// 4. Multi-layer: Verifier can be upgraded to STARK for quantum resistance
contract QuantumShieldBridge {
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

    event Released(
        bytes32 indexed lockId,
        address indexed recipient,
        uint256 amount,
        uint256 numSignaturesVerified
    );

    event VerifierUpdated(
        address indexed oldVerifier,
        address indexed newVerifier,
        string verifierType
    );

    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);

    // =========================================================================
    // Errors
    // =========================================================================

    error InvalidProof();
    error InvalidPublicInputs();
    error LockNotFound();
    error LockAlreadyReleased();
    error InsufficientAmount();
    error TransferFailed();
    error Paused();
    error NotOwner();
    error InvalidVerifier();
    error CommitmentMismatch();
    error NonceAlreadyUsed();
    error ZeroAddress();

    // =========================================================================
    // State
    // =========================================================================

    struct Lock {
        address sender;
        uint256 amount;
        bytes32 dilithiumPubKeyHash;  // Hash of Dilithium public key
        uint256 timestamp;
        bool released;
    }

    /// @notice The ZK verifier contract (upgradable)
    IQuantumVerifier public verifier;

    /// @notice Contract owner (for upgrades and emergency)
    address public owner;

    /// @notice Emergency pause flag
    bool public paused;

    /// @notice Mapping of lock ID to lock details
    mapping(bytes32 => Lock) public locks;

    /// @notice Used nonces for replay protection
    mapping(uint256 => bool) public usedNonces;

    /// @notice Total locked value
    uint256 public totalLocked;

    /// @notice Current nonce counter
    uint256 public nonceCounter;

    // =========================================================================
    // Public Input Layout (must match ZK circuit)
    // =========================================================================
    // publicInputs[0]: dilithiumCommitmentHash (lower 128 bits)
    // publicInputs[1]: dilithiumCommitmentHash (upper 128 bits)
    // publicInputs[2]: numSignaturesVerified
    // publicInputs[3]: lockId (lower 128 bits)
    // publicInputs[4]: lockId (upper 128 bits)
    // publicInputs[5]: recipientAddress
    // publicInputs[6]: amount
    // publicInputs[7]: nonce

    uint256 constant PI_COMMITMENT_LOW = 0;
    uint256 constant PI_COMMITMENT_HIGH = 1;
    uint256 constant PI_NUM_SIGNATURES = 2;
    uint256 constant PI_LOCK_ID_LOW = 3;
    uint256 constant PI_LOCK_ID_HIGH = 4;
    uint256 constant PI_RECIPIENT = 5;
    uint256 constant PI_AMOUNT = 6;
    uint256 constant PI_NONCE = 7;
    uint256 constant PI_LENGTH = 8;

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

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @notice Initialize the bridge with a verifier
    /// @param _verifier Address of the initial ZK verifier contract
    constructor(address _verifier) {
        if (_verifier == address(0)) revert ZeroAddress();
        verifier = IQuantumVerifier(_verifier);
        owner = msg.sender;
    }

    // =========================================================================
    // Core Functions
    // =========================================================================

    /// @notice Lock ETH for cross-chain transfer
    /// @param dilithiumPubKeyHash Hash of the Dilithium public key that will sign the release
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

    /// @notice Release locked assets by providing a valid ZK proof
    /// @param proof The ZK proof of aggregated Dilithium signature verification
    /// @param publicInputs The public inputs to the proof
    /// @dev Validates proof and checks commitment matches the lock
    function release(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external whenNotPaused {
        // Validate public inputs length
        if (publicInputs.length != PI_LENGTH) revert InvalidPublicInputs();

        // Reconstruct lock ID from public inputs
        bytes32 lockId = bytes32(
            (publicInputs[PI_LOCK_ID_HIGH] << 128) | publicInputs[PI_LOCK_ID_LOW]
        );

        // Get lock details
        Lock storage lockData = locks[lockId];
        if (lockData.sender == address(0)) revert LockNotFound();
        if (lockData.released) revert LockAlreadyReleased();

        // Check nonce hasn't been used (replay protection)
        uint256 nonce = publicInputs[PI_NONCE];
        if (usedNonces[nonce]) revert NonceAlreadyUsed();

        // Verify amount matches
        if (publicInputs[PI_AMOUNT] != lockData.amount) revert InvalidPublicInputs();

        // Reconstruct and verify Dilithium commitment
        bytes32 proofCommitment = bytes32(
            (publicInputs[PI_COMMITMENT_HIGH] << 128) | publicInputs[PI_COMMITMENT_LOW]
        );
        if (proofCommitment != lockData.dilithiumPubKeyHash) revert CommitmentMismatch();

        // Verify the ZK proof
        if (!verifier.verifyProof(proof, publicInputs)) revert InvalidProof();

        // Mark as released and nonce as used
        lockData.released = true;
        usedNonces[nonce] = true;
        totalLocked -= lockData.amount;

        // Get recipient from public inputs
        address recipient = address(uint160(publicInputs[PI_RECIPIENT]));
        if (recipient == address(0)) revert ZeroAddress();

        // Transfer funds
        (bool success, ) = recipient.call{value: lockData.amount}("");
        if (!success) revert TransferFailed();

        emit Released(
            lockId,
            recipient,
            lockData.amount,
            publicInputs[PI_NUM_SIGNATURES]
        );
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /// @notice Get lock details
    /// @param lockId The lock identifier
    /// @return sender The address that created the lock
    /// @return amount The locked amount
    /// @return dilithiumPubKeyHash The Dilithium public key hash
    /// @return timestamp When the lock was created
    /// @return released Whether the lock has been released
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

    /// @notice Check if the current verifier is quantum-resistant
    /// @return True if using a STARK-based verifier
    function isQuantumResistant() external view returns (bool) {
        return verifier.isQuantumResistant();
    }

    /// @notice Get the current verifier type
    /// @return The verifier type string
    function getVerifierType() external view returns (string memory) {
        return verifier.getVerifierType();
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    /// @notice Update the ZK verifier (for quantum-resistance upgrade)
    /// @param newVerifier Address of the new verifier contract
    function updateVerifier(address newVerifier) external onlyOwner {
        if (newVerifier == address(0)) revert ZeroAddress();

        address oldVerifier = address(verifier);
        verifier = IQuantumVerifier(newVerifier);

        emit VerifierUpdated(
            oldVerifier,
            newVerifier,
            verifier.getVerifierType()
        );
    }

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
    /// @param newOwner Address of the new owner
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    // =========================================================================
    // Receive
    // =========================================================================

    /// @notice Allow direct ETH transfers (for gas efficiency)
    receive() external payable {
        // Direct transfers go to the contract balance
        // Users should use lock() for tracked deposits
    }
}
