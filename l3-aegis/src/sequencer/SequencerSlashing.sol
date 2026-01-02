// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISequencerSlashing.sol";
import "../interfaces/ISequencerStaking.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SequencerSlashing
 * @notice Manages sequencer slashing for violations
 * @dev Implements DECEN-014 requirements
 *      - Quadratic slashing: N² × 10%
 *      - Distribution: 60% Challenger, 20% Insurance, 20% Burn
 * @custom:security-contact security@quantumshield.io
 */
contract SequencerSlashing is ISequencerSlashing, AccessControl, ReentrancyGuard {
    // ============================================
    // Constants
    // ============================================
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant HEALTH_MONITOR_ROLE = keccak256("HEALTH_MONITOR_ROLE");
    
    uint256 public constant override BASE_SLASH_PERCENT = 1000; // 10% in basis points
    uint256 public constant override CHALLENGER_REWARD_PERCENT = 6000; // 60%
    uint256 public constant override INSURANCE_PERCENT = 2000; // 20%
    uint256 public constant override BURN_PERCENT = 2000; // 20%
    uint256 public constant override CHALLENGE_BOND = 0.1 ether;
    
    uint256 private constant BASIS_POINTS = 10000;

    // ============================================
    // State Variables
    // ============================================
    
    ISequencerStaking public stakingContract;
    address public insuranceFund;
    
    // Violation tracking
    mapping(address => uint256) private _violationCounts;
    mapping(address => ViolationRecord[]) private _violationRecords;

    // ============================================
    // Constructor
    // ============================================
    
    constructor(
        address _stakingContract,
        address _insuranceFund,
        address admin
    ) {
        require(_stakingContract != address(0), "Invalid staking");
        require(_insuranceFund != address(0), "Invalid insurance");
        
        stakingContract = ISequencerStaking(_stakingContract);
        insuranceFund = _insuranceFund;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    // ============================================
    // Slash Reporting Functions
    // ============================================
    
    /// @inheritdoc ISequencerSlashing
    function reportDoubleSign(address sequencer, bytes calldata proof) external payable override nonReentrant {
        require(msg.value >= CHALLENGE_BOND, "Insufficient bond");
        require(_verifyDoubleSignProof(sequencer, proof), "Invalid proof");
        
        _processSlash(sequencer, ViolationType.DoubleSigning, msg.sender);
        
        // Return bond to challenger (reward is added in _distributeSlash)
        (bool success, ) = msg.sender.call{value: CHALLENGE_BOND}("");
        require(success, "Bond return failed");
    }
    
    /// @inheritdoc ISequencerSlashing
    function reportDowntime(address sequencer) external override onlyRole(HEALTH_MONITOR_ROLE) {
        _processSlash(sequencer, ViolationType.Downtime, address(0));
    }
    
    /// @inheritdoc ISequencerSlashing
    function reportInvalidStateRoot(address sequencer, bytes calldata proof) external payable override nonReentrant {
        require(msg.value >= CHALLENGE_BOND, "Insufficient bond");
        require(_verifyFraudProof(sequencer, proof), "Invalid proof");
        
        _processSlash(sequencer, ViolationType.InvalidStateRoot, msg.sender);
        
        // Return bond to challenger
        (bool success, ) = msg.sender.call{value: CHALLENGE_BOND}("");
        require(success, "Bond return failed");
    }

    // ============================================
    // Calculation Functions
    // ============================================
    
    /// @inheritdoc ISequencerSlashing
    function calculateSlash(uint256 stake, uint256 violationCount) external pure override returns (uint256) {
        return _calculateSlashAmount(stake, violationCount);
    }
    
    function _calculateSlashAmount(uint256 stake, uint256 violationCount) internal pure returns (uint256) {
        if (violationCount == 0) return 0;
        
        // N² × 10%
        uint256 percentage = violationCount * violationCount * 10;
        
        // Cap at 100%
        if (percentage > 100) {
            percentage = 100;
        }
        
        return stake * percentage / 100;
    }

    // ============================================
    // Query Functions
    // ============================================
    
    /// @inheritdoc ISequencerSlashing
    function getViolationCount(address sequencer) external view override returns (uint256) {
        return _violationCounts[sequencer];
    }
    
    /// @inheritdoc ISequencerSlashing
    function getViolationRecords(address sequencer) external view override returns (ViolationRecord[] memory) {
        return _violationRecords[sequencer];
    }
    
    /// @inheritdoc ISequencerSlashing
    function getInsuranceFund() external view override returns (address) {
        return insuranceFund;
    }

    // ============================================
    // Admin Functions
    // ============================================
    
    /// @inheritdoc ISequencerSlashing
    function setInsuranceFund(address newFund) external override onlyRole(ADMIN_ROLE) {
        require(newFund != address(0), "Invalid address");
        insuranceFund = newFund;
        emit InsuranceFundUpdated(newFund);
    }
    
    /// @inheritdoc ISequencerSlashing
    function setChallengeBond(uint256 /*newBond*/) external view override onlyRole(ADMIN_ROLE) {
        // Note: In production, this would update CHALLENGE_BOND via governance
        revert("Immutable in v1");
    }
    
    /// @inheritdoc ISequencerSlashing
    function setAuthorizedMonitor(address monitor, bool authorized) external override onlyRole(ADMIN_ROLE) {
        if (authorized) {
            _grantRole(HEALTH_MONITOR_ROLE, monitor);
        } else {
            _revokeRole(HEALTH_MONITOR_ROLE, monitor);
        }
    }

    // ============================================
    // Internal Functions
    // ============================================
    
    function _processSlash(
        address sequencer,
        ViolationType violationType,
        address challenger
    ) internal {
        // Increment violation count
        _violationCounts[sequencer]++;
        uint256 violationCount = _violationCounts[sequencer];
        
        // Get current stake
        uint256 stake = stakingContract.getStake(sequencer);
        
        // Calculate slash amount using quadratic formula
        uint256 slashAmount = _calculateSlashAmount(stake, violationCount);
        
        // Execute slash on staking contract
        stakingContract.slash(sequencer, slashAmount);
        
        // Record violation
        _violationRecords[sequencer].push(ViolationRecord({
            violationType: violationType,
            timestamp: block.timestamp,
            slashAmount: slashAmount,
            challenger: challenger
        }));
        
        // Distribute slashed funds
        _distributeSlash(slashAmount, challenger);
        
        // Emit events
        if (violationType == ViolationType.DoubleSigning) {
            emit DoubleSignReported(sequencer, challenger, slashAmount, violationCount);
        } else if (violationType == ViolationType.Downtime) {
            emit DowntimeReported(sequencer, slashAmount, violationCount);
        }
    }
    
    function _distributeSlash(uint256 slashAmount, address challenger) internal {
        uint256 challengerReward = 0;
        uint256 insuranceAmount = slashAmount * INSURANCE_PERCENT / BASIS_POINTS;
        uint256 burnAmount = slashAmount * BURN_PERCENT / BASIS_POINTS;
        
        // Challenger gets reward if present
        if (challenger != address(0)) {
            challengerReward = slashAmount * CHALLENGER_REWARD_PERCENT / BASIS_POINTS;
            (bool success, ) = challenger.call{value: challengerReward}("");
            require(success, "Challenger reward failed");
        } else {
            // If no challenger, add to insurance
            insuranceAmount += slashAmount * CHALLENGER_REWARD_PERCENT / BASIS_POINTS;
        }
        
        // Send to insurance fund
        (bool insuranceSuccess, ) = insuranceFund.call{value: insuranceAmount}("");
        require(insuranceSuccess, "Insurance transfer failed");
        
        // Burn by sending to zero address (or dead address)
        // In practice, tokens would be burned; for ETH we can leave in contract or use dead address
        
        emit SlashDistributed(
            msg.sender,
            challengerReward,
            insuranceAmount,
            burnAmount
        );
    }
    
    function _verifyDoubleSignProof(address sequencer, bytes calldata proof) internal pure returns (bool) {
        // TODO: Implement actual double-sign verification
        // Should verify two conflicting signatures from same sequencer
        // For now, check proof is valid format
        if (proof.length < 32) return false;
        
        // Decode and verify
        (address proofSequencer, , ) = abi.decode(proof, (address, string, uint256));
        return proofSequencer == sequencer;
    }
    
    function _verifyFraudProof(address /*sequencer*/, bytes calldata proof) internal pure returns (bool) {
        // TODO: Implement actual fraud proof verification
        // Should verify invalid state transition
        return proof.length >= 32;
    }
    
    // Receive function to accept slashed funds
    receive() external payable {}
}
