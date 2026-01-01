// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernor} from "../interfaces/IGovernor.sol";
import {IveQS} from "../interfaces/IveQS.sol";
import {SHA3Hasher} from "@phase2/libraries/SHA3Hasher.sol";

/// @title Governor
/// @notice Quantum Shield Governor with veQS voting
/// @dev Per UNIFIED_SPEC_v2.0.md §Governance + SPEC_STRATEGY_BRIDGE §7
/// @custom:security-contact security@quantumshield.io
/// @custom:ref CURRENT_PLAN.md TOKEN-005
contract Governor is IGovernor {
    // ============ Constants ============
    
    /// @notice Voting delay after proposal creation (1 day)
    uint256 public constant override VOTING_DELAY = 1 days;
    
    /// @notice Voting period duration (7 days)
    uint256 public constant override VOTING_PERIOD = 7 days;
    
    /// @notice Timelock delay before execution (7 days)
    /// @dev Per CORE_PRINCIPLES.md CP-3 Time Lock
    uint256 public constant override TIMELOCK_DELAY = 7 days;
    
    /// @notice Minimum voting power to create proposal (1% of expected total)
    uint256 public constant override PROPOSAL_THRESHOLD = 10_000_000 * 1e18 / 100; // 1% of 10M
    
    /// @notice Quorum for Parameter proposals (4%)
    uint256 private constant QUORUM_PARAMETER = 4;
    
    /// @notice Quorum for Upgrade proposals (8%)
    uint256 private constant QUORUM_UPGRADE = 8;
    
    /// @notice Quorum for Council proposals (15%)
    uint256 private constant QUORUM_COUNCIL = 15;
    
    /// @notice ReentrancyGuard: not entered state
    uint256 private constant NOT_ENTERED = 1;
    
    /// @notice ReentrancyGuard: entered state
    uint256 private constant ENTERED = 2;
    
    // ============ Immutable ============
    
    /// @notice veQS contract address
    address public immutable override veQS;
    
    // ============ Storage ============
    
    /// @notice Reentrancy guard status
    uint256 private _status;
    
    /// @notice Admin address
    address private _admin;
    
    /// @notice Proposal count
    uint256 private _proposalCount;
    
    /// @notice Proposals mapping
    mapping(uint256 => Proposal) private _proposals;
    
    /// @notice Proposal actions mapping
    mapping(uint256 => ProposalActions) private _proposalActions;
    
    /// @notice Vote receipts mapping
    mapping(uint256 => mapping(address => Receipt)) private _receipts;
    
    /// @notice Proposal ETAs mapping
    mapping(uint256 => uint256) private _proposalEtas;
    
    // ============ Modifiers ============
    
    /// @notice Prevents reentrancy attacks (CP-5 compliance)
    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
    
    // ============ Constructor ============
    
    /// @notice Initialize Governor
    /// @param veQS_ veQS contract address
    /// @param admin_ Admin address
    constructor(address veQS_, address admin_) {
        require(veQS_ != address(0), "Invalid veQS");
        require(admin_ != address(0), "Invalid admin");
        
        veQS = veQS_;
        _admin = admin_;
        _status = NOT_ENTERED;
    }
    
    // ============ View Functions ============
    
    /// @inheritdoc IGovernor
    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        if (proposalId == 0 || proposalId > _proposalCount) revert ProposalNotFound();
        return _proposals[proposalId];
    }
    
    /// @inheritdoc IGovernor
    function getProposalActions(uint256 proposalId) external view override returns (ProposalActions memory) {
        if (proposalId == 0 || proposalId > _proposalCount) revert ProposalNotFound();
        return _proposalActions[proposalId];
    }
    
    /// @inheritdoc IGovernor
    function state(uint256 proposalId) public view override returns (ProposalState) {
        if (proposalId == 0 || proposalId > _proposalCount) revert ProposalNotFound();
        
        Proposal storage proposal = _proposals[proposalId];
        
        if (proposal.canceled) {
            return ProposalState.Canceled;
        }
        
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        if (block.timestamp < proposal.startTime) {
            return ProposalState.Pending;
        }
        
        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }
        
        // Voting ended
        if (!_hasReachedQuorumInternal(proposalId) || proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.Defeated;
        }
        
        // Succeeded
        uint256 eta = _proposalEtas[proposalId];
        if (eta == 0) {
            return ProposalState.Succeeded;
        }
        
        if (block.timestamp < eta) {
            return ProposalState.Queued;
        }
        
        // Timelock period expired (grace period 14 days)
        if (block.timestamp > eta + 14 days) {
            return ProposalState.Expired;
        }
        
        return ProposalState.Queued;
    }
    
    /// @inheritdoc IGovernor
    function getReceipt(uint256 proposalId, address voter) external view override returns (Receipt memory) {
        return _receipts[proposalId][voter];
    }
    
    /// @inheritdoc IGovernor
    function quorum(ProposalCategory category) public view override returns (uint256) {
        uint256 totalPower = IveQS(veQS).getTotalVotingPower();
        
        if (category == ProposalCategory.Parameter) {
            return (totalPower * QUORUM_PARAMETER) / 100;
        } else if (category == ProposalCategory.Upgrade) {
            return (totalPower * QUORUM_UPGRADE) / 100;
        } else {
            return (totalPower * QUORUM_COUNCIL) / 100;
        }
    }
    
    /// @inheritdoc IGovernor
    function hasReachedQuorum(uint256 proposalId) external view override returns (bool) {
        return _hasReachedQuorumInternal(proposalId);
    }
    
    /// @inheritdoc IGovernor
    function proposalCount() external view override returns (uint256) {
        return _proposalCount;
    }
    
    /// @inheritdoc IGovernor
    function proposalEta(uint256 proposalId) external view override returns (uint256) {
        return _proposalEtas[proposalId];
    }
    
    // ============ State-Changing Functions ============
    
    /// @inheritdoc IGovernor
    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description,
        ProposalCategory category
    ) external override returns (uint256 proposalId) {
        if (targets.length == 0) revert InvalidParameters();
        if (targets.length != values.length) revert InvalidParameters();
        if (targets.length != calldatas.length) revert InvalidParameters();
        
        // Check proposer has enough voting power
        uint256 proposerPower = IveQS(veQS).getEffectiveVotingPower(msg.sender);
        if (proposerPower < PROPOSAL_THRESHOLD) revert InsufficientVotingPower();
        
        proposalId = ++_proposalCount;
        
        uint256 startTime = block.timestamp + VOTING_DELAY;
        uint256 endTime = startTime + VOTING_PERIOD;
        
        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            category: category,
            startTime: startTime,
            endTime: endTime,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            canceled: false,
            executed: false,
            descriptionHash: SHA3Hasher.hash(bytes(description))
        });
        
        _proposalActions[proposalId] = ProposalActions({
            targets: targets,
            values: values,
            calldatas: calldatas
        });
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            category,
            targets,
            values,
            calldatas,
            startTime,
            endTime,
            description
        );
    }
    
    /// @inheritdoc IGovernor
    function castVote(uint256 proposalId, VoteType voteType) external override {
        _castVote(proposalId, msg.sender, voteType, "");
    }
    
    /// @inheritdoc IGovernor
    function castVoteWithReason(
        uint256 proposalId,
        VoteType voteType,
        string calldata reason
    ) external override {
        _castVote(proposalId, msg.sender, voteType, reason);
    }
    
    /// @inheritdoc IGovernor
    function queue(uint256 proposalId) external override {
        ProposalState proposalState = state(proposalId);
        if (proposalState != ProposalState.Succeeded) revert InvalidProposalState();
        
        uint256 eta = block.timestamp + TIMELOCK_DELAY;
        _proposalEtas[proposalId] = eta;
        
        emit ProposalQueued(proposalId, eta);
    }
    
    /// @inheritdoc IGovernor
    function execute(uint256 proposalId) external override nonReentrant {
        ProposalState proposalState = state(proposalId);
        if (proposalState != ProposalState.Queued) revert InvalidProposalState();
        
        uint256 eta = _proposalEtas[proposalId];
        if (block.timestamp < eta) revert TimelockNotMet();
        
        _proposals[proposalId].executed = true;
        
        ProposalActions storage actions = _proposalActions[proposalId];
        
        for (uint256 i = 0; i < actions.targets.length; i++) {
            (bool success, ) = actions.targets[i].call{value: actions.values[i]}(actions.calldatas[i]);
            if (!success) revert ExecutionFailed();
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    /// @inheritdoc IGovernor
    function cancel(uint256 proposalId) external override {
        Proposal storage proposal = _proposals[proposalId];
        
        if (proposal.id == 0) revert ProposalNotFound();
        if (proposal.executed) revert InvalidProposalState();
        if (proposal.canceled) revert InvalidProposalState();
        
        // Only proposer or admin can cancel
        if (msg.sender != proposal.proposer && msg.sender != _admin) revert NotAuthorized();
        
        proposal.canceled = true;
        
        emit ProposalCanceled(proposalId);
    }
    
    // ============ Internal Functions ============
    
    /// @notice Internal vote casting
    function _castVote(
        uint256 proposalId,
        address voter,
        VoteType voteType,
        string memory reason
    ) internal {
        ProposalState proposalState = state(proposalId);
        if (proposalState != ProposalState.Active) revert InvalidProposalState();
        
        Receipt storage receipt = _receipts[proposalId][voter];
        if (receipt.hasVoted) revert AlreadyVoted();
        
        // Get voting power at proposal start time (snapshot)
        Proposal storage proposal = _proposals[proposalId];
        uint256 votes = IveQS(veQS).getVotingPowerAt(voter, proposal.startTime);
        
        if (votes == 0) revert InsufficientVotingPower();
        
        receipt.hasVoted = true;
        receipt.voteType = voteType;
        receipt.votes = votes;
        
        if (voteType == VoteType.For) {
            proposal.forVotes += votes;
        } else if (voteType == VoteType.Against) {
            proposal.againstVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }
        
        emit VoteCast(voter, proposalId, voteType, votes, reason);
    }
    
    /// @notice Check if proposal has reached quorum
    function _hasReachedQuorumInternal(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = _proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        
        // Calculate quorum at proposal end time
        uint256 requiredQuorum = quorum(proposal.category);
        
        return totalVotes >= requiredQuorum;
    }
}
