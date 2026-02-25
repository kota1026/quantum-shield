// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// src/interfaces/IGovernanceSwitch.sol

/// @title IGovernanceSwitch
/// @notice Interface for the Pluggable Governance Layer switch mechanism
/// @dev Part of Quantum Shield's Modular Architecture (MODULAR_ARCHITECTURE.md §3.1)
/// @dev DECEN-009~011: Production mode transitions and emergency rollback
/// @custom:security-contact security@quantumshield.io
interface IGovernanceSwitch {
    // ============ Enums ============
    
    /// @notice Governance operation modes
    /// @dev TRAINING: Initial test period with TVL limits (Phase 3.3)
    /// @dev CENTRALIZED: Single admin control (Phase 1)
    /// @dev MULTISIG: N/M multisig approval (Phase 2)
    /// @dev DECENTRALIZED: Security Council + DAO voting (Phase 3+)
    enum GovernanceMode {
        TRAINING,       // New: Initial deployment with safety limits
        CENTRALIZED,
        MULTISIG,
        DECENTRALIZED
    }
    
    // ============ Events ============
    
    /// @notice Emitted when governance mode is changed
    /// @param oldMode Previous governance mode
    /// @param newMode New governance mode
    /// @param changedBy Address that initiated the change
    event GovernanceModeChanged(
        GovernanceMode indexed oldMode,
        GovernanceMode indexed newMode,
        address indexed changedBy
    );
    
    /// @notice Emitted when an action is approved
    /// @param action Action selector
    /// @param approver Address that approved
    /// @param data Action-specific data
    event ActionApproved(
        bytes4 indexed action,
        address indexed approver,
        bytes data
    );
    
    /// @notice Emitted when mode transition is initiated (DECEN-010)
    /// @param targetMode Target governance mode
    /// @param initiator Who initiated the transition
    /// @param unlockTime When the transition can be finalized
    event ModeTransitionInitiated(
        GovernanceMode indexed targetMode,
        address indexed initiator,
        uint256 unlockTime
    );
    
    /// @notice Emitted when emergency rollback is triggered (DECEN-011)
    /// @param fromMode Mode being rolled back from
    /// @param toMode Mode being rolled back to
    /// @param triggeredBy Who triggered the rollback
    /// @param reason Reason for the rollback
    event EmergencyRollback(
        GovernanceMode indexed fromMode,
        GovernanceMode indexed toMode,
        address indexed triggeredBy,
        string reason
    );
    
    // ============ Errors ============
    
    /// @notice Thrown when caller lacks permission
    error Unauthorized();
    
    /// @notice Thrown when mode transition is invalid
    error InvalidModeTransition(GovernanceMode from, GovernanceMode to);
    
    /// @notice Thrown when action cannot be approved
    error CannotApprove(bytes4 action);
    
    /// @notice Thrown when rollback conditions are not met (DECEN-011)
    error RollbackNotAllowed(string reason);
    
    /// @notice Thrown when Security Council approval is missing
    error SecurityCouncilApprovalRequired();
    
    // ============ View Functions ============
    
    /// @notice Get current governance mode
    /// @return Current GovernanceMode enum value
    function getGovernanceMode() external view returns (GovernanceMode);
    
    /// @notice Get approver address for a specific action
    /// @param action Action selector (function signature)
    /// @return Approver address (varies by mode)
    function getApprover(bytes4 action) external view returns (address);
    
    /// @notice Check if caller can approve an action
    /// @param action Action selector
    /// @param caller Address to check
    /// @return True if caller can approve the action
    function canApprove(bytes4 action, address caller) external view returns (bool);
    
    /// @notice Get current admin address (CENTRALIZED/TRAINING mode)
    /// @return Admin address or zero if not applicable
    function getAdmin() external view returns (address);
    
    /// @notice Get multisig configuration (MULTISIG mode)
    /// @return threshold Required signatures
    /// @return total Total signers
    function getMultisigConfig() external view returns (uint256 threshold, uint256 total);
    
    /// @notice Get Security Council configuration (DECENTRALIZED mode)
    /// @return threshold Required council votes
    /// @return total Total council members
    function getSecurityCouncilConfig() external view returns (uint256 threshold, uint256 total);
    
    /// @notice Check if system is in training mode (DECEN-009)
    /// @return True if in TRAINING mode
    function isTrainingMode() external view returns (bool);
    
    /// @notice Check if emergency rollback is available (DECEN-011)
    /// @return True if rollback can be initiated
    function canInitiateRollback() external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice Change governance mode
    /// @dev Access control:
    ///      - TRAINING: admin only → CENTRALIZED
    ///      - CENTRALIZED: admin only → MULTISIG
    ///      - MULTISIG: required signatures → DECENTRALIZED
    ///      - DECENTRALIZED: Security Council + Time Lock
    /// @param newMode Target governance mode
    function setGovernanceMode(GovernanceMode newMode) external;
    
    /// @notice Approve an action (mode-dependent)
    /// @param action Action selector
    /// @param data Action-specific data
    function approveAction(bytes4 action, bytes calldata data) external;
    
    /// @notice Initiate mode transition with time lock (DECEN-010)
    /// @param targetMode Target governance mode
    function initiateTransition(GovernanceMode targetMode) external;
    
    /// @notice Finalize pending transition after time lock
    function finalizeTransition() external;
    
    /// @notice Initiate emergency rollback (DECEN-011)
    /// @param reason Reason for the rollback
    /// @dev Requires Security Council supermajority (7/9)
    function initiateEmergencyRollback(string calldata reason) external;
    
    /// @notice Approve emergency rollback (Security Council member)
    function approveEmergencyRollback() external;
    
    /// @notice Execute approved emergency rollback
    function executeEmergencyRollback() external;
}

// src/interfaces/ISecurityCouncil.sol

/// @title ISecurityCouncil
/// @notice Interface for Quantum Shield Security Council
/// @dev Per SEQUENCES v2.0 #7, #8 - Security Council 6/9 for Veto
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md GOV-004
interface ISecurityCouncil {
    // ============ Events ============
    
    /// @notice Emitted when a member is added
    event MemberAdded(uint256 indexed seatId, address indexed member);
    
    /// @notice Emitted when a member is removed
    event MemberRemoved(uint256 indexed seatId, address indexed member);
    
    /// @notice Emitted when a member is replaced
    event MemberReplaced(
        uint256 indexed seatId,
        address indexed oldMember,
        address indexed newMember
    );
    
    /// @notice Emitted when an action is proposed
    event ActionProposed(
        bytes32 indexed actionId,
        ActionType actionType,
        address indexed proposer,
        bytes data,
        uint256 expiresAt
    );
    
    /// @notice Emitted when a member signs an action
    event ActionSigned(
        bytes32 indexed actionId,
        address indexed signer,
        uint256 signatureCount
    );
    
    /// @notice Emitted when an action is executed
    event ActionExecuted(
        bytes32 indexed actionId,
        ActionType actionType,
        address indexed executor
    );
    
    /// @notice Emitted when an action is cancelled
    event ActionCancelled(bytes32 indexed actionId);
    
    // ============ Errors ============
    
    /// @notice Thrown when caller is not a member
    error NotMember();
    
    /// @notice Thrown when caller is not the governor
    error NotGovernor();
    
    /// @notice Thrown when member address is invalid
    error InvalidMember();
    
    /// @notice Thrown when member already exists
    error DuplicateMember();
    
    /// @notice Thrown when seat ID is invalid
    error InvalidSeat();
    
    /// @notice Thrown when action doesn't exist
    error ActionNotFound();
    
    /// @notice Thrown when action is not active
    error ActionNotActive();
    
    /// @notice Thrown when member has already signed
    error AlreadySigned();
    
    /// @notice Thrown when threshold is not met
    error ThresholdNotMet();
    
    /// @notice Thrown when action has expired
    error ActionExpiredError();
    
    /// @notice Thrown when execution fails
    error ExecutionFailed();
    
    // ============ Enums ============
    
    /// @notice Action types requiring different thresholds
    enum ActionType {
        EmergencyPause,     // 5/9 - Pause protocol
        EmergencyUpgrade,   // 7/9 - Emergency upgrade
        Veto,               // 6/9 - Veto governance proposal
        MemberChange        // 6/9 - Change member (via governance)
    }
    
    /// @notice Action state
    enum ActionState {
        Proposed,
        Executed,
        Cancelled,
        Expired
    }
    
    // ============ Structs ============
    
    /// @notice Security Council action
    struct Action {
        bytes32 id;
        ActionType actionType;
        address proposer;
        uint256 proposedAt;
        uint256 expiresAt;
        uint256 signatureCount;
        ActionState state;
        bytes data;
    }
    
    // ============ View Functions ============
    
    /// @notice Maximum number of members (9)
    function MAX_MEMBERS() external view returns (uint256);
    
    /// @notice Action expiration time (48 hours)
    function ACTION_EXPIRY() external view returns (uint256);
    
    /// @notice Threshold for emergency pause (5/9)
    function PAUSE_THRESHOLD() external view returns (uint256);
    
    /// @notice Threshold for veto (6/9)
    function VETO_THRESHOLD() external view returns (uint256);
    
    /// @notice Threshold for emergency upgrade (7/9)
    function UPGRADE_THRESHOLD() external view returns (uint256);
    
    /// @notice Governor contract address
    function governor() external view returns (address);
    
    /// @notice Emergency controller address
    function emergencyController() external view returns (address);
    
    /// @notice Current member count (always 9)
    function memberCount() external view returns (uint256);
    
    /// @notice Check if address is a member
    /// @param account Address to check
    function isMember(address account) external view returns (bool);
    
    /// @notice Get member by seat ID
    /// @param seatId Seat ID (0-8)
    function getMember(uint256 seatId) external view returns (address);
    
    /// @notice Get seat ID for member
    /// @param member Member address
    function getSeatId(address member) external view returns (uint256);
    
    /// @notice Get action details
    /// @param actionId Action ID
    function getAction(bytes32 actionId) external view returns (Action memory);
    
    /// @notice Check if member has signed action
    /// @param actionId Action ID
    /// @param signer Signer address
    function hasSigned(bytes32 actionId, address signer) external view returns (bool);
    
    /// @notice Get signature count for action
    /// @param actionId Action ID
    function getSignatureCount(bytes32 actionId) external view returns (uint256);
    
    /// @notice Get valid signature count (only current members)
    /// @param actionId Action ID
    function getValidSignatureCount(bytes32 actionId) external view returns (uint256);
    
    /// @notice Get threshold for action type
    /// @param actionType Action type
    function getThreshold(ActionType actionType) external pure returns (uint256);
    
    /// @notice Check if action is ready to execute
    /// @param actionId Action ID
    function isActionReady(bytes32 actionId) external view returns (bool);
    
    /// @notice Check if action is expired
    /// @param actionId Action ID
    function isActionExpired(bytes32 actionId) external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice Propose an action
    /// @param actionType Type of action
    /// @param data Action data
    /// @return actionId ID of the proposed action
    function proposeAction(
        ActionType actionType,
        bytes calldata data
    ) external returns (bytes32 actionId);
    
    /// @notice Sign an action
    /// @param actionId Action ID to sign
    function signAction(bytes32 actionId) external;
    
    /// @notice Execute an action (if threshold met)
    /// @param actionId Action ID to execute
    function executeAction(bytes32 actionId) external;
    
    /// @notice Replace a member (via governance)
    /// @param seatId Seat ID
    /// @param newMember New member address
    function replaceMember(uint256 seatId, address newMember) external;
    
    /// @notice Set governor address
    /// @param newGovernor New governor address
    function setGovernor(address newGovernor) external;
    
    /// @notice Set emergency controller address
    /// @param newController New controller address
    function setEmergencyController(address newController) external;
}

// src/interfaces/ITreasury.sol

/// @title ITreasury - Protocol Treasury Management Interface
/// @notice Manages protocol treasury funds per UNIFIED_SPEC v2.0
/// @dev Phase 1-2: Multi-sig, Phase 3: Token Vote + Multi-sig, Phase 4: Token Vote only
/// @custom:ref UNIFIED_SPEC_v2.0.md §Treasury
/// @custom:security CP-5 compliant (full transparency)
interface ITreasury {
    // ============ Enums ============

    enum ProposalState {
        Pending,
        Active,
        Approved,
        Rejected,
        Executed,
        Expired,
        Cancelled
    }

    // ============ Structs ============

    struct Proposal {
        uint256 id;
        address proposer;
        address target;
        uint256 amount;
        bytes data;
        uint256 createdAt;
        uint256 executionTime;
        ProposalState state;
        uint256 approvals;
        string description;
    }

    // ============ Events ============

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed target,
        uint256 amount,
        string description
    );

    event ProposalApproved(
        uint256 indexed proposalId,
        address indexed approver,
        uint256 currentApprovals
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor,
        uint256 amount
    );

    event EmergencyWithdrawal(
        address indexed to,
        uint256 amount,
        string reason
    );

    event FundsReceived(
        address indexed from,
        uint256 amount,
        string source
    );

    // ============ Errors ============

    error ExceedsMaxSingleSpend();
    error BelowMinimumBalance();
    error ProposalNotFound();
    error InvalidProposalState();
    error TimeLockNotExpired();
    error AlreadyApproved();
    error InsufficientApprovals();
    error NotAuthorized();
    error EmergencyRequiresSCApproval();
    error InvalidTarget();
    error ZeroAmount();

    // ============ View Functions ============

    function MAX_SINGLE_SPEND() external view returns (uint256 limit);
    function minimumBalance() external view returns (uint256 balance);
    function TIME_LOCK_PERIOD() external view returns (uint256 period);
    function getBalance() external view returns (uint256 balance);
    function getProposal(uint256 proposalId) external view returns (Proposal memory proposal);
    function getProposalState(uint256 proposalId) external view returns (ProposalState state);
    function hasApproved(uint256 proposalId, address approver) external view returns (bool approved);
    function getRequiredApprovals() external view returns (uint256 required);
    function getProposalCount() external view returns (uint256 count);

    // ============ Proposal Functions ============

    function propose(
        address target,
        uint256 amount,
        bytes calldata data,
        string calldata description
    ) external returns (uint256 proposalId);

    function approve(uint256 proposalId) external;
    function execute(uint256 proposalId) external;
    function cancel(uint256 proposalId) external;

    // ============ Emergency Functions ============

    function emergencyWithdraw(
        address to,
        uint256 amount,
        string calldata reason
    ) external;

    // ============ Admin Functions ============

    function setMinimumBalance(uint256 newMinimum) external;
    function receiveFunds(string calldata source) external payable;
}

// src/treasury/Treasury.sol

/// @title Treasury
/// @notice DECEN-017: Protocol treasury management
/// @dev Multi-sig controlled with time locks and spending limits (ETH-based)
contract Treasury is ITreasury {
    // ========== State Variables ==========
    
    /// @notice GovernanceSwitch contract
    IGovernanceSwitch public immutable governanceSwitch;
    
    /// @notice SecurityCouncil contract
    ISecurityCouncil public immutable securityCouncil;
    
    /// @notice Required approvals for proposals (immutable after deployment)
    uint256 public immutable requiredApprovals;
    
    /// @notice Multi-sig signers
    address[] public signers;
    
    /// @notice Minimum balance to maintain (12 months operating cost)
    uint256 public override minimumBalance;
    
    /// @notice Proposal counter
    uint256 public proposalCount;
    
    /// @notice Proposal storage
    mapping(uint256 => Proposal) internal _proposals;
    
    /// @notice Approval tracking: proposalId => approver => approved
    mapping(uint256 => mapping(address => bool)) internal _hasApproved;
    
    /// @notice Signer check
    mapping(address => bool) public isSigner;
    
    // ========== Constants ==========
    
    /// @notice Maximum single spend ($100K)
    uint256 public constant override MAX_SINGLE_SPEND = 100_000 * 1e18;
    
    /// @notice Time lock period for proposals (7 days)
    uint256 public constant override TIME_LOCK_PERIOD = 7 days;
    
    /// @notice Default minimum balance
    uint256 public constant DEFAULT_MIN_BALANCE = 500_000 * 1e18;
    
    // ========== Constructor ==========
    
    constructor(
        address _governanceSwitch,
        address _securityCouncil,
        address[] memory _signers,
        uint256 _requiredApprovals
    ) {
        require(_governanceSwitch != address(0), "Invalid governance switch");
        require(_securityCouncil != address(0), "Invalid security council");
        require(_signers.length >= _requiredApprovals, "Invalid signer count");
        require(_requiredApprovals > 0, "Invalid required approvals");
        
        governanceSwitch = IGovernanceSwitch(_governanceSwitch);
        securityCouncil = ISecurityCouncil(_securityCouncil);
        signers = _signers;
        requiredApprovals = _requiredApprovals;
        minimumBalance = DEFAULT_MIN_BALANCE;
        
        for (uint256 i = 0; i < _signers.length; i++) {
            isSigner[_signers[i]] = true;
        }
    }
    
    // ========== External Functions ==========
    
    /// @inheritdoc ITreasury
    function propose(
        address target,
        uint256 amount,
        bytes calldata data,
        string calldata description
    ) external override returns (uint256 proposalId) {
        if (target == address(0)) revert InvalidTarget();
        if (amount > MAX_SINGLE_SPEND) revert ExceedsMaxSingleSpend();
        
        proposalId = ++proposalCount;
        
        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            target: target,
            amount: amount,
            data: data,
            createdAt: block.timestamp,
            executionTime: block.timestamp + TIME_LOCK_PERIOD,
            state: ProposalState.Pending,
            approvals: 1, // Proposer auto-approves
            description: description
        });
        
        _hasApproved[proposalId][msg.sender] = true;
        
        emit ProposalCreated(proposalId, msg.sender, target, amount, description);
        
        return proposalId;
    }
    
    /// @inheritdoc ITreasury
    function approve(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (proposal.state != ProposalState.Pending && proposal.state != ProposalState.Active) {
            revert InvalidProposalState();
        }
        if (_hasApproved[proposalId][msg.sender]) revert AlreadyApproved();
        
        _hasApproved[proposalId][msg.sender] = true;
        proposal.approvals++;
        
        // Activate proposal if it has any approvals
        if (proposal.state == ProposalState.Pending) {
            proposal.state = ProposalState.Active;
        }
        
        // Check if enough approvals for current governance mode
        uint256 required = getRequiredApprovals();
        if (proposal.approvals >= required) {
            proposal.state = ProposalState.Approved;
        }
        
        emit ProposalApproved(proposalId, msg.sender, proposal.approvals);
    }
    
    /// @inheritdoc ITreasury
    function execute(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        
        // Check approvals
        if (proposal.approvals < getRequiredApprovals()) {
            revert InsufficientApprovals();
        }
        
        // Check time lock
        if (block.timestamp < proposal.executionTime) {
            revert TimeLockNotExpired();
        }
        
        // Check minimum balance
        uint256 balanceAfter = address(this).balance - proposal.amount;
        if (balanceAfter < minimumBalance) {
            revert BelowMinimumBalance();
        }
        
        proposal.state = ProposalState.Executed;
        
        // Execute the transfer (ETH)
        (bool success, ) = proposal.target.call{value: proposal.amount}(proposal.data);
        require(success, "Transfer failed");
        
        emit ProposalExecuted(proposalId, msg.sender, proposal.amount);
    }
    
    /// @inheritdoc ITreasury
    function emergencyWithdraw(
        address to,
        uint256 amount,
        string calldata reason
    ) external override {
        // Only Security Council can call this
        if (msg.sender != address(securityCouncil)) {
            revert EmergencyRequiresSCApproval();
        }
        
        if (to == address(0)) revert InvalidTarget();
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit EmergencyWithdrawal(to, amount, reason);
    }
    
    /// @inheritdoc ITreasury
    function cancel(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        if (proposal.state == ProposalState.Executed || proposal.state == ProposalState.Cancelled) {
            revert InvalidProposalState();
        }
        if (msg.sender != proposal.proposer && !isSigner[msg.sender]) {
            revert NotAuthorized();
        }
        
        proposal.state = ProposalState.Cancelled;
    }
    
    /// @inheritdoc ITreasury
    function receiveFunds(string calldata source) external payable override {
        emit FundsReceived(msg.sender, msg.value, source);
    }
    
    // ========== View Functions ==========
    
    /// @inheritdoc ITreasury
    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        return proposal;
    }
    
    /// @inheritdoc ITreasury
    function getProposalState(uint256 proposalId) external view override returns (ProposalState) {
        return _proposals[proposalId].state;
    }
    
    /// @inheritdoc ITreasury
    function getProposalCount() external view override returns (uint256) {
        return proposalCount;
    }
    
    /// @inheritdoc ITreasury
    function hasApproved(uint256 proposalId, address approver) external view override returns (bool) {
        return _hasApproved[proposalId][approver];
    }
    
    /// @inheritdoc ITreasury
    function getBalance() external view override returns (uint256) {
        return address(this).balance;
    }
    
    /// @inheritdoc ITreasury
    function getRequiredApprovals() public view override returns (uint256) {
        try governanceSwitch.getGovernanceMode() returns (IGovernanceSwitch.GovernanceMode mode) {
            if (mode == IGovernanceSwitch.GovernanceMode.TRAINING ||
                mode == IGovernanceSwitch.GovernanceMode.CENTRALIZED) {
                return 1; // Admin only
            } else if (mode == IGovernanceSwitch.GovernanceMode.MULTISIG) {
                return requiredApprovals; // N/M multi-sig
            } else {
                return 1; // Decentralized - governance approval
            }
        } catch {
            return requiredApprovals; // Default to multi-sig
        }
    }
    
    // ========== Admin Functions ==========
    
    /// @inheritdoc ITreasury
    function setMinimumBalance(uint256 newMinimum) external override {
        if (!isSigner[msg.sender]) revert NotAuthorized();
        minimumBalance = newMinimum;
    }
    
    // ========== Receive Function ==========
    
    /// @notice Receive ETH
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value, "direct");
    }
}
