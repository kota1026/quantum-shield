// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import {SHA3_256} from "../libraries/SHA3_256.sol";

/// @title ProverRegistry - Quantum Shield Prover Management Contract
/// @notice Implements SEQUENCES §5 (Prover Registration) and §6 (Prover Exit)
/// @dev Phase-based approval modes: FOUNDATION_INVITE → COUNCIL_VOTE → STAKE_AUTO
///
/// Key Features:
/// - SPHINCS+ public key registration with SHA3-256 hashing (CP-1 compliant)
/// - Phase-based approval modes for different security levels
/// - Quadratic slashing mechanism (N² × 10%)
/// - 7-day unbonding period for stake withdrawal
/// - HSM attestation and multisig proof validation
contract ProverRegistry is ReentrancyGuard, Pausable {
    // =========================================================================
    // Constants
    // =========================================================================

    /// @notice Minimum stake for Phase 1 (ETH-based)
    uint256 public constant MIN_STAKE_PHASE1 = 1 ether;

    /// @notice Unbonding period before stake can be withdrawn
    /// @dev SEQUENCES §6: 7-day unbonding period
    uint256 public constant UNBONDING_PERIOD = 7 days;

    /// @notice SPHINCS+-128s public key size
    uint256 public constant SPHINCS_PUBKEY_SIZE = 32;

    /// @notice Maximum slash rate (100%)
    uint256 public constant MAX_SLASH_RATE = 100;

    /// @notice Base slash rate per violation (10%)
    uint256 public constant BASE_SLASH_RATE = 10;

    /// @notice Council approval threshold (3 of 9)
    uint256 public constant COUNCIL_APPROVAL_THRESHOLD = 3;

    // =========================================================================
    // Enums
    // =========================================================================

    /// @notice Prover status states
    enum ProverStatus {
        NONE,           // Not registered
        PENDING,        // Awaiting approval
        ACTIVE,         // Approved and active
        UNBONDING,      // Exit requested, in unbonding period
        EXITED,         // Fully exited
        SLASHED         // Slashed and deactivated
    }

    /// @notice Approval mode based on protocol phase
    /// @dev SEQUENCES §5: Phase-based approval
    enum ApprovalMode {
        FOUNDATION_INVITE,  // Phase 1: Foundation invitation only
        COUNCIL_VOTE,       // Phase 2: Council 3/9 vote
        STAKE_AUTO          // Phase 3+: Automatic approval with stake
    }

    // =========================================================================
    // Structs
    // =========================================================================

    /// @notice Prover data structure
    /// @dev Based on SEQUENCES §5 registration data
    struct Prover {
        address operator;           // Operator address (receives rewards)
        bytes sphincsPublicKey;     // SPHINCS+-128s public key (32 bytes)
        bytes32 sphincsPubKeyHash;  // SHA3-256 hash of public key
        uint256 stake;              // Staked amount
        ProverStatus status;        // Current status
        uint256 registeredAt;       // Registration timestamp
        uint256 approvedAt;         // Approval timestamp
        uint256 totalSignatures;    // Cumulative successful signatures
        uint256 slashCount;         // Number of times slashed
        uint256 exitRequestedAt;    // Exit request timestamp
        bytes32 hsmAttestationHash; // HSM attestation hash
    }

    /// @notice Council vote tracking for prover approval
    struct ApprovalVote {
        uint256 approvalCount;
        mapping(address => bool) hasVoted;
    }

    // =========================================================================
    // Events
    // =========================================================================

    event ProverRegistered(
        bytes32 indexed proverId,
        address indexed operator,
        bytes32 sphincsPubKeyHash,
        uint256 stake
    );

    event ProverApproved(
        bytes32 indexed proverId,
        address indexed approvedBy,
        ApprovalMode mode
    );

    event ProverSlashed(
        bytes32 indexed proverId,
        uint256 amount,
        uint256 slashCount,
        bytes32 reason
    );

    event ProverExitRequested(
        bytes32 indexed proverId,
        uint256 exitRequestedAt,
        uint256 unbondingEndsAt
    );

    event ProverExited(
        bytes32 indexed proverId,
        uint256 stakeReturned
    );

    event StakeWithdrawn(
        bytes32 indexed proverId,
        address indexed operator,
        uint256 amount
    );

    event SignatureRecorded(
        bytes32 indexed proverId,
        uint256 totalSignatures
    );

    event ApprovalModeUpdated(
        ApprovalMode oldMode,
        ApprovalMode newMode
    );

    event CouncilMemberUpdated(
        address indexed member,
        bool isActive
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // =========================================================================
    // Errors
    // =========================================================================

    error NotOwner();
    error NotFoundation();
    error NotCouncilMember();
    error ZeroAddress();
    error InvalidPublicKeyLength();
    error ProverAlreadyRegistered();
    error ProverNotFound();
    error ProverNotPending();
    error ProverNotActive();
    error ProverNotUnbonding();
    error InsufficientStake();
    error UnbondingPeriodNotExpired();
    error AlreadyVoted();
    error InvalidApprovalMode();
    error TransferFailed();
    error InvalidSlashAmount();
    error NoStakeToSlash();
    error AlreadyExited();
    error InvalidHSMAttestation();
    error InvalidMultisigProof();

    // =========================================================================
    // State Variables
    // =========================================================================

    address public owner;
    address public foundation;
    ApprovalMode public approvalMode;

    /// @notice Prover data by proverId
    mapping(bytes32 => Prover) public provers;

    /// @notice Prover ID lookup by operator address
    mapping(address => bytes32) public operatorToProverId;

    /// @notice Prover ID lookup by SPHINCS+ public key hash
    mapping(bytes32 => bytes32) public pubKeyHashToProverId;

    /// @notice Council members for COUNCIL_VOTE mode
    mapping(address => bool) public councilMembers;

    /// @notice Council vote tracking
    mapping(bytes32 => ApprovalVote) private approvalVotes;

    /// @notice Active prover count
    uint256 public activeProverCount;

    /// @notice Total staked amount
    uint256 public totalStaked;

    /// @notice Insurance fund for slashed stakes
    uint256 public insuranceFund;

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyFoundation() {
        if (msg.sender != foundation) revert NotFoundation();
        _;
    }

    modifier onlyCouncilMember() {
        if (!councilMembers[msg.sender]) revert NotCouncilMember();
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    /// @notice Initialize ProverRegistry
    /// @param _foundation Foundation address for Phase 1 approvals
    constructor(address _foundation) {
        if (_foundation == address(0)) revert ZeroAddress();
        owner = msg.sender;
        foundation = _foundation;
        approvalMode = ApprovalMode.FOUNDATION_INVITE;
    }

    // =========================================================================
    // Registration Functions
    // =========================================================================

    /// @notice Register as a new Prover
    /// @dev SEQUENCES §5: Prover Registration flow
    /// @param sphincsPublicKey SPHINCS+-128s public key (32 bytes)
    /// @param hsmAttestation HSM attestation proof
    /// @param multisigProof 2-of-3 multisig proof
    /// @return proverId The generated prover ID
    function register(
        bytes calldata sphincsPublicKey,
        bytes calldata hsmAttestation,
        bytes calldata multisigProof
    ) external payable whenNotPaused nonReentrant returns (bytes32 proverId) {
        if (sphincsPublicKey.length != SPHINCS_PUBKEY_SIZE) revert InvalidPublicKeyLength();
        if (msg.value < MIN_STAKE_PHASE1) revert InsufficientStake();
        if (operatorToProverId[msg.sender] != bytes32(0)) revert ProverAlreadyRegistered();

        // Validate HSM attestation
        if (!_validateHSMAttestation(hsmAttestation)) revert InvalidHSMAttestation();

        // Validate multisig proof
        if (!_validateMultisigProof(multisigProof)) revert InvalidMultisigProof();

        // Generate prover ID using SHA3-256 (CP-1 compliant)
        bytes32 sphincsPubKeyHash = SHA3_256.hash(sphincsPublicKey);

        // Ensure public key not already registered
        if (pubKeyHashToProverId[sphincsPubKeyHash] != bytes32(0)) revert ProverAlreadyRegistered();

        proverId = _generateProverId(msg.sender, sphincsPubKeyHash);

        // Store prover data
        Prover storage prover = provers[proverId];
        prover.operator = msg.sender;
        prover.sphincsPublicKey = sphincsPublicKey;
        prover.sphincsPubKeyHash = sphincsPubKeyHash;
        prover.stake = msg.value;
        prover.status = ProverStatus.PENDING;
        prover.registeredAt = block.timestamp;
        prover.hsmAttestationHash = SHA3_256.hash(hsmAttestation);

        // Update mappings
        operatorToProverId[msg.sender] = proverId;
        pubKeyHashToProverId[sphincsPubKeyHash] = proverId;
        totalStaked += msg.value;

        emit ProverRegistered(proverId, msg.sender, sphincsPubKeyHash, msg.value);

        // Auto-approve if in STAKE_AUTO mode
        if (approvalMode == ApprovalMode.STAKE_AUTO) {
            _approveProver(proverId, msg.sender);
        }
    }

    /// @notice Add additional stake to an existing prover
    /// @param proverId The prover ID to add stake to
    function addStake(bytes32 proverId) external payable whenNotPaused nonReentrant {
        Prover storage prover = provers[proverId];
        if (prover.operator == address(0)) revert ProverNotFound();
        if (prover.status == ProverStatus.EXITED || prover.status == ProverStatus.SLASHED) {
            revert AlreadyExited();
        }

        prover.stake += msg.value;
        totalStaked += msg.value;
    }

    // =========================================================================
    // Approval Functions
    // =========================================================================

    /// @notice Foundation approval (Phase 1)
    /// @dev Only callable when approvalMode == FOUNDATION_INVITE
    /// @param proverId The prover ID to approve
    function approveByFoundation(bytes32 proverId) external onlyFoundation whenNotPaused {
        if (approvalMode != ApprovalMode.FOUNDATION_INVITE) revert InvalidApprovalMode();

        Prover storage prover = provers[proverId];
        if (prover.operator == address(0)) revert ProverNotFound();
        if (prover.status != ProverStatus.PENDING) revert ProverNotPending();

        _approveProver(proverId, msg.sender);
    }

    /// @notice Council vote for approval (Phase 2)
    /// @dev Requires 3 of 9 council members to approve
    /// @param proverId The prover ID to vote for
    function voteForApproval(bytes32 proverId) external onlyCouncilMember whenNotPaused {
        if (approvalMode != ApprovalMode.COUNCIL_VOTE) revert InvalidApprovalMode();

        Prover storage prover = provers[proverId];
        if (prover.operator == address(0)) revert ProverNotFound();
        if (prover.status != ProverStatus.PENDING) revert ProverNotPending();

        ApprovalVote storage vote = approvalVotes[proverId];
        if (vote.hasVoted[msg.sender]) revert AlreadyVoted();

        vote.hasVoted[msg.sender] = true;
        vote.approvalCount++;

        // Check if threshold met
        if (vote.approvalCount >= COUNCIL_APPROVAL_THRESHOLD) {
            _approveProver(proverId, address(0)); // No single approver
        }
    }

    /// @notice Auto-approve (Phase 3+)
    /// @dev Anyone can trigger auto-approval in STAKE_AUTO mode
    /// @param proverId The prover ID to approve
    function autoApprove(bytes32 proverId) external whenNotPaused {
        if (approvalMode != ApprovalMode.STAKE_AUTO) revert InvalidApprovalMode();

        Prover storage prover = provers[proverId];
        if (prover.operator == address(0)) revert ProverNotFound();
        if (prover.status != ProverStatus.PENDING) revert ProverNotPending();

        _approveProver(proverId, msg.sender);
    }

    /// @notice Internal approval logic
    function _approveProver(bytes32 proverId, address approvedBy) internal {
        Prover storage prover = provers[proverId];
        prover.status = ProverStatus.ACTIVE;
        prover.approvedAt = block.timestamp;
        activeProverCount++;

        emit ProverApproved(proverId, approvedBy, approvalMode);
    }

    // =========================================================================
    // Slashing Functions
    // =========================================================================

    /// @notice Slash a prover for malicious behavior
    /// @dev Quadratic slashing: N² × 10% (SEQUENCES §4)
    /// @param proverId The prover ID to slash
    /// @param colludingCount Number of colluding provers (for quadratic calculation)
    /// @param reason Hash of the reason/evidence
    function slash(
        bytes32 proverId,
        uint256 colludingCount,
        bytes32 reason
    ) external onlyOwner nonReentrant {
        Prover storage prover = provers[proverId];
        if (prover.operator == address(0)) revert ProverNotFound();
        if (prover.stake == 0) revert NoStakeToSlash();

        // Calculate quadratic slash: N² × 10%
        uint256 slashPercent = colludingCount * colludingCount * BASE_SLASH_RATE;
        if (slashPercent > MAX_SLASH_RATE) {
            slashPercent = MAX_SLASH_RATE;
        }

        uint256 slashAmount = (prover.stake * slashPercent) / 100;

        // Apply slash
        prover.stake -= slashAmount;
        prover.slashCount++;
        totalStaked -= slashAmount;
        insuranceFund += slashAmount;

        // Deactivate if stake too low
        if (prover.stake < MIN_STAKE_PHASE1) {
            if (prover.status == ProverStatus.ACTIVE) {
                prover.status = ProverStatus.SLASHED;
                activeProverCount--;
            } else {
                prover.status = ProverStatus.SLASHED;
            }
        }

        emit ProverSlashed(proverId, slashAmount, prover.slashCount, reason);
    }

    // =========================================================================
    // Exit Functions
    // =========================================================================

    /// @notice Request exit from prover pool
    /// @dev SEQUENCES §6: Initiates 7-day unbonding period
    /// @param proverId The prover ID requesting exit
    function requestExit(bytes32 proverId) external whenNotPaused nonReentrant {
        Prover storage prover = provers[proverId];
        if (prover.operator == address(0)) revert ProverNotFound();
        if (msg.sender != prover.operator) revert NotOwner();
        if (prover.status != ProverStatus.ACTIVE && prover.status != ProverStatus.PENDING) {
            revert ProverNotActive();
        }

        // Update status and start unbonding
        if (prover.status == ProverStatus.ACTIVE) {
            activeProverCount--;
        }
        prover.status = ProverStatus.UNBONDING;
        prover.exitRequestedAt = block.timestamp;

        emit ProverExitRequested(
            proverId,
            block.timestamp,
            block.timestamp + UNBONDING_PERIOD
        );
    }

    /// @notice Execute exit after unbonding period
    /// @dev SEQUENCES §6: Withdraw stake after 7 days
    /// @param proverId The prover ID to finalize exit
    function executeExit(bytes32 proverId) external nonReentrant {
        Prover storage prover = provers[proverId];
        if (prover.operator == address(0)) revert ProverNotFound();
        if (prover.status != ProverStatus.UNBONDING) revert ProverNotUnbonding();
        if (block.timestamp < prover.exitRequestedAt + UNBONDING_PERIOD) {
            revert UnbondingPeriodNotExpired();
        }

        uint256 stakeToReturn = prover.stake;
        address operator = prover.operator;

        // Update state before transfer (CEI pattern)
        prover.status = ProverStatus.EXITED;
        prover.stake = 0;
        totalStaked -= stakeToReturn;

        // Transfer stake back to operator
        (bool success, ) = operator.call{value: stakeToReturn}("");
        if (!success) revert TransferFailed();

        emit ProverExited(proverId, stakeToReturn);
        emit StakeWithdrawn(proverId, operator, stakeToReturn);
    }

    // =========================================================================
    // Signature Recording
    // =========================================================================

    /// @notice Record a successful signature by a prover
    /// @dev Called by L1Vault or authorized contracts
    /// @param proverId The prover ID that signed
    function recordSignature(bytes32 proverId) external onlyOwner {
        Prover storage prover = provers[proverId];
        if (prover.operator == address(0)) revert ProverNotFound();
        if (prover.status != ProverStatus.ACTIVE) revert ProverNotActive();

        prover.totalSignatures++;

        emit SignatureRecorded(proverId, prover.totalSignatures);
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    /// @notice Update the approval mode
    /// @param newMode The new approval mode to set
    function setApprovalMode(ApprovalMode newMode) external onlyOwner {
        ApprovalMode oldMode = approvalMode;
        approvalMode = newMode;
        emit ApprovalModeUpdated(oldMode, newMode);
    }

    /// @notice Add or remove a council member
    /// @param member The council member address
    /// @param isActive Whether the member is active
    function setCouncilMember(address member, bool isActive) external onlyOwner {
        if (member == address(0)) revert ZeroAddress();
        councilMembers[member] = isActive;
        emit CouncilMemberUpdated(member, isActive);
    }

    /// @notice Transfer ownership
    /// @param newOwner The new owner address
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /// @notice Update foundation address
    /// @param newFoundation The new foundation address
    function setFoundation(address newFoundation) external onlyOwner {
        if (newFoundation == address(0)) revert ZeroAddress();
        foundation = newFoundation;
    }

    /// @notice Pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Withdraw from insurance fund
    /// @param to Recipient address
    /// @param amount Amount to withdraw
    function withdrawInsuranceFund(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount > insuranceFund) revert InsufficientStake();

        insuranceFund -= amount;

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /// @notice Get prover details
    /// @param proverId The prover ID to query
    function getProver(bytes32 proverId) external view returns (
        address operator,
        bytes memory sphincsPublicKey,
        bytes32 sphincsPubKeyHash,
        uint256 stake,
        ProverStatus status,
        uint256 registeredAt,
        uint256 approvedAt,
        uint256 totalSignatures,
        uint256 slashCount,
        uint256 exitRequestedAt
    ) {
        Prover storage prover = provers[proverId];
        return (
            prover.operator,
            prover.sphincsPublicKey,
            prover.sphincsPubKeyHash,
            prover.stake,
            prover.status,
            prover.registeredAt,
            prover.approvedAt,
            prover.totalSignatures,
            prover.slashCount,
            prover.exitRequestedAt
        );
    }

    /// @notice Check if a prover is active
    /// @param proverId The prover ID to check
    function isActiveProver(bytes32 proverId) external view returns (bool) {
        return provers[proverId].status == ProverStatus.ACTIVE;
    }

    /// @notice Get prover ID by operator address
    /// @param operator The operator address
    function getProverIdByOperator(address operator) external view returns (bytes32) {
        return operatorToProverId[operator];
    }

    /// @notice Get prover ID by SPHINCS+ public key hash
    /// @param pubKeyHash The public key hash
    function getProverIdByPubKeyHash(bytes32 pubKeyHash) external view returns (bytes32) {
        return pubKeyHashToProverId[pubKeyHash];
    }

    /// @notice Get approval vote count for a prover
    /// @param proverId The prover ID
    function getApprovalVoteCount(bytes32 proverId) external view returns (uint256) {
        return approvalVotes[proverId].approvalCount;
    }

    /// @notice Check if council member has voted
    /// @param proverId The prover ID
    /// @param member The council member address
    function hasCouncilMemberVoted(bytes32 proverId, address member) external view returns (bool) {
        return approvalVotes[proverId].hasVoted[member];
    }

    /// @notice Calculate unbonding end time
    /// @param proverId The prover ID
    function getUnbondingEndTime(bytes32 proverId) external view returns (uint256) {
        Prover storage prover = provers[proverId];
        if (prover.exitRequestedAt == 0) return 0;
        return prover.exitRequestedAt + UNBONDING_PERIOD;
    }

    /// @notice Calculate slash amount for given parameters
    /// @param stake The stake amount
    /// @param colludingCount Number of colluding provers
    function calculateSlashAmount(uint256 stake, uint256 colludingCount) external pure returns (uint256) {
        uint256 slashPercent = colludingCount * colludingCount * BASE_SLASH_RATE;
        if (slashPercent > MAX_SLASH_RATE) {
            slashPercent = MAX_SLASH_RATE;
        }
        return (stake * slashPercent) / 100;
    }

    // =========================================================================
    // Internal Functions
    // =========================================================================

    /// @notice Generate prover ID from operator and public key hash
    /// @dev Uses SHA3-256 for CP-1 compliance
    function _generateProverId(address operator, bytes32 pubKeyHash) internal pure returns (bytes32) {
        return SHA3_256.hash(abi.encodePacked("PROVER_V1", operator, pubKeyHash));
    }

    /// @notice Validate HSM attestation
    /// @dev TODO: Implement actual HSM attestation verification
    function _validateHSMAttestation(bytes calldata attestation) internal pure returns (bool) {
        // Basic validation: non-empty attestation
        // In production, this would verify the HSM attestation certificate chain
        return attestation.length > 0;
    }

    /// @notice Validate 2-of-3 multisig proof
    /// @dev TODO: Implement actual multisig verification
    function _validateMultisigProof(bytes calldata proof) internal pure returns (bool) {
        // Basic validation: non-empty proof
        // In production, this would verify 2-of-3 signatures
        return proof.length > 0;
    }

    /// @notice Receive ETH
    receive() external payable {}
}
