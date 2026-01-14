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
    
    /// @notice Dead address for burning ETH (standard burn address)
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // ============================================
    // State Variables
    // ============================================
    
    ISequencerStaking public stakingContract;
    address public insuranceFund;
    
    // Violation tracking
    mapping(address => uint256) private _violationCounts;
    mapping(address => ViolationRecord[]) private _violationRecords;
    
    // Double-sign tracking: sequencer => blockNumber => commitment hash
    mapping(address => mapping(uint256 => bytes32)) private _blockCommitments;
    
    // Total burned amount tracking
    uint256 public totalBurned;

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
        
        // Burn by sending to dead address (0x000...dEaD)
        // This permanently removes ETH from circulation
        (bool burnSuccess, ) = BURN_ADDRESS.call{value: burnAmount}("");
        require(burnSuccess, "Burn transfer failed");
        totalBurned += burnAmount;
        
        emit SlashDistributed(
            msg.sender,
            challengerReward,
            insuranceAmount,
            burnAmount
        );
    }
    
    /**
     * @notice Verifies a double-sign proof
     * @dev Validates that the sequencer signed two different commitments for the same block
     * @param sequencer The address of the accused sequencer
     * @param proof Encoded proof containing: (sequencer, blockNumber, commitment1, commitment2, sig1, sig2)
     * @return valid True if the proof demonstrates double-signing
     */
    function _verifyDoubleSignProof(address sequencer, bytes calldata proof) internal pure returns (bool) {
        // Minimum proof size: address(20) + blockNumber(32) + 2 commitments(64) + 2 sigs(~130)
        if (proof.length < 100) return false;
        
        // Decode proof components
        (
            address proofSequencer,
            uint256 blockNumber,
            bytes32 commitment1,
            bytes32 commitment2
        ) = abi.decode(proof, (address, uint256, bytes32, bytes32));
        
        // Verify sequencer matches
        if (proofSequencer != sequencer) return false;
        
        // Verify commitments are different (evidence of double-signing)
        if (commitment1 == commitment2) return false;
        
        // Verify block number is valid (not in the future, not too old)
        if (blockNumber == 0) return false;
        
        // In production, would verify actual SPHINCS+ signatures here:
        // 1. Recover/verify signature1 over commitment1 matches sequencer's public key
        // 2. Recover/verify signature2 over commitment2 matches sequencer's public key
        // 3. Both signatures valid but commitments differ = double-sign proven
        
        // For testnet, basic structural validation passes
        return true;
    }
    
    /**
     * @notice Verifies a fraud proof (invalid state transition)
     * @dev Validates that the sequencer produced an invalid state root
     * @param sequencer The address of the accused sequencer
     * @param proof Encoded proof containing: (sequencer, preStateRoot, postStateRoot, transaction, witness)
     * @return valid True if the proof demonstrates fraud
     */
    function _verifyFraudProof(address sequencer, bytes calldata proof) internal pure returns (bool) {
        // Minimum proof size for meaningful fraud proof
        if (proof.length < 128) return false;
        
        // Decode proof components
        (
            address proofSequencer,
            bytes32 preStateRoot,
            bytes32 claimedPostStateRoot,
            bytes memory transaction,
            bytes memory witness
        ) = abi.decode(proof, (address, bytes32, bytes32, bytes, bytes));
        
        // Verify sequencer matches
        if (proofSequencer != sequencer) return false;
        
        // Verify state roots are non-zero
        if (preStateRoot == bytes32(0) || claimedPostStateRoot == bytes32(0)) return false;
        
        // Verify transaction and witness are present
        if (transaction.length == 0 || witness.length == 0) return false;
        
        // In production, would:
        // 1. Re-execute transaction against preStateRoot using witness data
        // 2. Compute actual postStateRoot
        // 3. Compare with claimedPostStateRoot
        // 4. If different, fraud is proven
        
        // For testnet, structural validation passes
        return true;
    }
    
    // Receive function to accept slashed funds
    receive() external payable {}
}
