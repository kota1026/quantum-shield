// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IConstitutionLock} from "../interfaces/IConstitutionLock.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ConstitutionLock
 * @notice Implementation of Core Principles protection mechanism
 * @dev Enforces IMMUTABLE protection for CP-1/CP-2 and SUPERMAJORITY for CP-3/CP-4/CP-5
 * 
 * Security Parameters (from CORE_PRINCIPLES.md):
 * - Normal Time Lock: 24 hours minimum
 * - Emergency Time Lock: 7 days minimum
 * - veQS Threshold: 75% (7500 bps)
 * - SC Threshold: 6/7 (≈85.71%, 8571 bps)
 * - Supermajority Time Lock: 30 days
 */
contract ConstitutionLock is IConstitutionLock, ReentrancyGuard {
    // ============ Constants ============

    /// @notice Total number of Core Principles
    uint8 public constant TOTAL_CPS = 5;

    /// @notice veQS threshold in basis points (75%)
    uint256 public constant VEQS_THRESHOLD_BPS = 7500;

    /// @notice Security Council threshold in basis points (6/7 ≈ 85.71%)
    uint256 public constant SC_THRESHOLD_BPS = 8571;

    /// @notice Timelock for supermajority changes (30 days)
    uint256 public constant TIMELOCK_SECONDS = 30 days;

    /// @notice Minimum normal timelock (24 hours)
    uint256 public constant MIN_NORMAL_TIMELOCK = 24 hours;

    /// @notice Minimum emergency timelock (7 days)
    uint256 public constant MIN_EMERGENCY_TIMELOCK = 7 days;

    /// @notice Basis points denominator
    uint256 private constant BPS_DENOMINATOR = 10000;

    // ============ State Variables ============

    /// @notice Admin address
    address public admin;

    /// @notice Security Council members
    address[] public securityCouncil;

    /// @notice Mapping of SC member addresses
    mapping(address => bool) public isSecurityCouncilMember;

    /// @notice Protection levels for each CP (1-indexed)
    mapping(uint8 => ProtectionLevel) private _protectionLevels;

    /// @notice Proposals by ID
    mapping(uint256 => Proposal) private _proposals;

    /// @notice SC approvals per proposal
    mapping(uint256 => mapping(address => bool)) private _scApprovals;

    /// @notice Current proposal ID counter
    uint256 private _proposalCounter;

    /// @notice Current normal timelock value
    uint256 public normalTimeLock;

    /// @notice Current emergency timelock value
    uint256 public emergencyTimeLock;

    /// @notice Address authorized to record veQS votes (Token Layer)
    address public voteRecorder;

    // ============ Modifiers ============

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlySecurityCouncil() {
        if (!isSecurityCouncilMember[msg.sender]) revert Unauthorized();
        _;
    }

    modifier onlyVoteRecorder() {
        if (msg.sender != voteRecorder) revert Unauthorized();
        _;
    }

    modifier validCPNumber(uint8 cpNumber) {
        if (cpNumber == 0 || cpNumber > TOTAL_CPS) revert InvalidCPNumber(cpNumber);
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the ConstitutionLock contract
     * @param _admin Admin address
     * @param _securityCouncil Initial Security Council members (minimum 7)
     */
    constructor(address _admin, address[] memory _securityCouncil) {
        require(_admin != address(0), "Invalid admin");
        require(_securityCouncil.length >= 7, "Minimum 7 SC members required");

        admin = _admin;

        // Initialize Security Council
        for (uint256 i = 0; i < _securityCouncil.length; i++) {
            require(_securityCouncil[i] != address(0), "Invalid SC member");
            require(!isSecurityCouncilMember[_securityCouncil[i]], "Duplicate SC member");
            securityCouncil.push(_securityCouncil[i]);
            isSecurityCouncilMember[_securityCouncil[i]] = true;
        }

        // Initialize protection levels
        // CP-1 and CP-2 are IMMUTABLE
        _protectionLevels[1] = ProtectionLevel.IMMUTABLE;
        _protectionLevels[2] = ProtectionLevel.IMMUTABLE;
        
        // CP-3, CP-4, CP-5 require SUPERMAJORITY
        _protectionLevels[3] = ProtectionLevel.SUPERMAJORITY;
        _protectionLevels[4] = ProtectionLevel.SUPERMAJORITY;
        _protectionLevels[5] = ProtectionLevel.SUPERMAJORITY;

        // Initialize timelocks to minimum values
        normalTimeLock = MIN_NORMAL_TIMELOCK;
        emergencyTimeLock = MIN_EMERGENCY_TIMELOCK;
    }

    // ============ View Functions ============

    /// @inheritdoc IConstitutionLock
    function getProtectionLevel(uint8 cpNumber) 
        external 
        view 
        validCPNumber(cpNumber) 
        returns (ProtectionLevel) 
    {
        return _protectionLevels[cpNumber];
    }

    /// @inheritdoc IConstitutionLock
    function isCompliant(uint8 cpNumber) 
        external 
        view 
        validCPNumber(cpNumber) 
        returns (bool) 
    {
        // CP-1: Quantum Resistance - always compliant by design
        if (cpNumber == 1) return true;
        
        // CP-2: Self-Custody - always compliant by design
        if (cpNumber == 2) return true;
        
        // CP-3: Time Lock Exists - check minimums
        if (cpNumber == 3) {
            return normalTimeLock >= MIN_NORMAL_TIMELOCK && 
                   emergencyTimeLock >= MIN_EMERGENCY_TIMELOCK;
        }
        
        // CP-4: Slashing Exists - always compliant by design
        if (cpNumber == 4) return true;
        
        // CP-5: Transparency - always compliant by design
        if (cpNumber == 5) return true;
        
        return false;
    }

    /// @inheritdoc IConstitutionLock
    function getSupermajorityRequirements() external pure returns (SupermajorityRequirements memory) {
        return SupermajorityRequirements({
            veQSThresholdBps: VEQS_THRESHOLD_BPS,
            scThresholdBps: SC_THRESHOLD_BPS,
            timelockSeconds: TIMELOCK_SECONDS
        });
    }

    /// @inheritdoc IConstitutionLock
    function calculateRequiredVeQS(uint256 totalVeQS) external pure returns (uint256) {
        return (totalVeQS * VEQS_THRESHOLD_BPS) / BPS_DENOMINATOR;
    }

    /// @inheritdoc IConstitutionLock
    function calculateRequiredSCApprovals(uint256 totalMembers) external pure returns (uint256) {
        // 6/7 of total members, rounded up
        return (totalMembers * 6 + 6) / 7;
    }

    /// @inheritdoc IConstitutionLock
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        if (_proposals[proposalId].proposedAt == 0) revert ProposalNotFound(proposalId);
        return _proposals[proposalId];
    }

    /// @notice Get the number of Security Council members
    function getSecurityCouncilCount() external view returns (uint256) {
        return securityCouncil.length;
    }

    /// @notice Check if an SC member has approved a proposal
    function hasSCApproved(uint256 proposalId, address member) external view returns (bool) {
        return _scApprovals[proposalId][member];
    }

    // ============ State-Changing Functions ============

    /// @inheritdoc IConstitutionLock
    function proposeChange(uint8 cpNumber, bytes calldata proposedData) 
        external 
        validCPNumber(cpNumber) 
        returns (uint256 proposalId) 
    {
        // Check if CP is IMMUTABLE
        if (_protectionLevels[cpNumber] == ProtectionLevel.IMMUTABLE) {
            emit ImmutableCPViolationAttempted(cpNumber, msg.sender);
            revert CPImmutable(cpNumber);
        }

        // Create new proposal
        proposalId = ++_proposalCounter;
        
        _proposals[proposalId] = Proposal({
            cpNumber: cpNumber,
            proposedData: proposedData,
            proposedAt: block.timestamp,
            veQSVotesBps: 0,
            scApprovals: 0,
            executed: false,
            cancelled: false
        });

        emit ProposalCreated(proposalId, cpNumber, proposedData, msg.sender);
    }

    /// @inheritdoc IConstitutionLock
    function recordVeQSVotes(uint256 proposalId, uint256 votesBps) 
        external 
        onlyVoteRecorder 
    {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposedAt == 0) revert ProposalNotFound(proposalId);
        if (proposal.executed) revert ProposalAlreadyExecuted(proposalId);
        if (proposal.cancelled) revert ProposalCancelled(proposalId);

        proposal.veQSVotesBps += votesBps;

        emit VeQSVotesRecorded(proposalId, votesBps, proposal.veQSVotesBps);
    }

    /// @inheritdoc IConstitutionLock
    function approveSC(uint256 proposalId) external onlySecurityCouncil {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposedAt == 0) revert ProposalNotFound(proposalId);
        if (proposal.executed) revert ProposalAlreadyExecuted(proposalId);
        if (proposal.cancelled) revert ProposalCancelled(proposalId);

        // Check if already approved
        if (_scApprovals[proposalId][msg.sender]) revert Unauthorized();

        _scApprovals[proposalId][msg.sender] = true;
        proposal.scApprovals++;

        emit SCApprovalRecorded(proposalId, msg.sender, proposal.scApprovals);
    }

    /// @inheritdoc IConstitutionLock
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposedAt == 0) revert ProposalNotFound(proposalId);
        if (proposal.executed) revert ProposalAlreadyExecuted(proposalId);
        if (proposal.cancelled) revert ProposalCancelled(proposalId);

        // Check timelock
        uint256 elapsed = block.timestamp - proposal.proposedAt;
        if (elapsed < TIMELOCK_SECONDS) {
            revert TimeLockNotExpired(TIMELOCK_SECONDS - elapsed);
        }

        // Check veQS threshold
        if (proposal.veQSVotesBps < VEQS_THRESHOLD_BPS) {
            revert InsufficientVeQS(proposal.veQSVotesBps, VEQS_THRESHOLD_BPS);
        }

        // Check SC threshold (6/7)
        uint256 requiredSC = (securityCouncil.length * 6 + 6) / 7;
        if (proposal.scApprovals < requiredSC) {
            revert InsufficientSCApprovals(proposal.scApprovals, requiredSC);
        }

        // Mark as executed
        proposal.executed = true;

        // Apply the change
        _applyChange(proposal.cpNumber, proposal.proposedData);

        emit ProposalExecuted(proposalId, proposal.cpNumber, proposal.proposedData);
    }

    /// @inheritdoc IConstitutionLock
    function cancelProposal(uint256 proposalId) external onlyAdmin {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposedAt == 0) revert ProposalNotFound(proposalId);
        if (proposal.executed) revert ProposalAlreadyExecuted(proposalId);
        if (proposal.cancelled) revert ProposalCancelled(proposalId);

        proposal.cancelled = true;
    }

    // ============ Admin Functions ============

    /// @notice Set new admin
    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin");
        admin = newAdmin;
    }

    /// @notice Add a Security Council member
    function addSecurityCouncilMember(address member) external onlyAdmin {
        require(member != address(0), "Invalid member");
        require(!isSecurityCouncilMember[member], "Already a member");
        
        securityCouncil.push(member);
        isSecurityCouncilMember[member] = true;
    }

    /// @notice Remove a Security Council member
    function removeSecurityCouncilMember(address member) external onlyAdmin {
        require(isSecurityCouncilMember[member], "Not a member");
        require(securityCouncil.length > 7, "Cannot go below 7 members");

        isSecurityCouncilMember[member] = false;
        
        // Find and remove from array
        for (uint256 i = 0; i < securityCouncil.length; i++) {
            if (securityCouncil[i] == member) {
                securityCouncil[i] = securityCouncil[securityCouncil.length - 1];
                securityCouncil.pop();
                break;
            }
        }
    }

    /// @notice Set the vote recorder address
    function setVoteRecorder(address _voteRecorder) external onlyAdmin {
        voteRecorder = _voteRecorder;
    }

    // ============ Internal Functions ============

    /**
     * @notice Apply a validated CP change
     * @param cpNumber The CP being changed
     * @param data The encoded change data
     */
    function _applyChange(uint8 cpNumber, bytes memory data) internal {
        if (cpNumber == 3) {
            // CP-3: Time Lock changes
            (uint256 newNormalTimeLock, uint256 newEmergencyTimeLock) = abi.decode(
                data, 
                (uint256, uint256)
            );
            
            // Cannot shorten timelocks
            if (newNormalTimeLock < normalTimeLock) {
                revert TimeLockCannotBeShortened(normalTimeLock, newNormalTimeLock);
            }
            if (newEmergencyTimeLock < emergencyTimeLock) {
                revert TimeLockCannotBeShortened(emergencyTimeLock, newEmergencyTimeLock);
            }
            
            normalTimeLock = newNormalTimeLock;
            emergencyTimeLock = newEmergencyTimeLock;
        }
        // CP-4 and CP-5 changes can be added here
    }
}
