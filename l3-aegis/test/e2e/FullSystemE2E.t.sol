// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/CoreLayer.sol";

/**
 * @title FullSystemE2E
 * @notice Full system E2E tests (L1 + L3 + Token + Governance)
 * @dev Implements TEST-010 from Phase 3.3 Track B
 *      Uses mock contracts for non-bridge components
 *      Uses real CoreLayer for bridge operations
 */

// ============================================
// Mock Contracts (for non-bridge components)
// ============================================

contract MockSequencerRegistry {
    mapping(address => uint256) public stakes;
    mapping(address => bool) public registered;
    mapping(address => bool) public active;
    uint256 public activeCount;
    
    constructor(address) {}
    
    function register() external payable {
        stakes[msg.sender] = msg.value;
        registered[msg.sender] = true;
        active[msg.sender] = true;
        activeCount++;
    }
    function isRegistered(address seq) external view returns (bool) { return registered[seq]; }
    function isActive(address seq) external view returns (bool) { return active[seq]; }
    function getStake(address seq) external view returns (uint256) { return stakes[seq]; }
    function reduceStake(address seq, uint256 amount) external { stakes[seq] -= amount; }
    function markInactive(address seq) external { active[seq] = false; activeCount--; }
    function markActive(address seq) external { active[seq] = true; activeCount++; }
    function heartbeat() external {}
    function isHealthy(address seq) external view returns (bool) { return active[seq]; }
}

contract MockSlashing {
    MockSequencerRegistry public registry;
    mapping(address => uint256) public challengeTime;
    
    constructor(address _registry, address, address) { registry = MockSequencerRegistry(_registry); }
    
    function submitChallenge(address seq, bytes calldata) external payable { challengeTime[seq] = block.timestamp; }
    function executeSlash(address seq) external {
        require(block.timestamp >= challengeTime[seq] + 48 hours, "Defense period");
        uint256 stake = registry.getStake(seq);
        registry.reduceStake(seq, stake / 10);
    }
}

contract MockRotation {
    MockSequencerRegistry public registry;
    address[] public sequencers;
    uint256 public currentIndex;
    mapping(bytes32 => uint256) public signatures;
    mapping(bytes32 => bool) public finalized;
    
    constructor(address _registry, address) { registry = MockSequencerRegistry(_registry); }
    
    function setSequencers(address[] memory _seqs) external { sequencers = _seqs; }
    function currentLeader() external view returns (address) {
        if (sequencers.length == 0) return address(0);
        return sequencers[currentIndex % sequencers.length];
    }
    function signBlock(bytes32 blockHash) external { signatures[blockHash]++; if (signatures[blockHash] >= 3) finalized[blockHash] = true; }
    function isBlockFinalized(bytes32 blockHash) external view returns (bool) { return finalized[blockHash]; }
    function rotate() external { currentIndex++; }
    function emergencyRotate() external { currentIndex++; }
    function isEmergencyState() external view returns (bool) { return registry.activeCount() == 0; }
}

contract MockGovernor {
    uint256 public proposalCount;
    mapping(uint256 => bool) public executed;
    mapping(uint256 => uint256) public proposalTime;
    mapping(uint256 => bool) public queued;
    
    constructor(address, address, address) {}
    
    function propose(address, bytes calldata, string calldata) external returns (uint256) {
        proposalCount++;
        proposalTime[proposalCount] = block.timestamp;
        return proposalCount;
    }
    function castVote(uint256, bool) external {}
    function queue(uint256 id) external { queued[id] = true; }
    function execute(uint256 id) external {
        require(queued[id] && block.timestamp >= proposalTime[id] + 21 days, "Not ready");
        executed[id] = true;
    }
    function isExecuted(uint256 id) external view returns (bool) { return executed[id]; }
}

contract MockSecurityCouncil {
    uint256 public memberCount = 9;
    uint256 public threshold = 5;
    mapping(bytes32 => uint256) public approvals;
    bool public systemPaused;
    
    constructor(address[] memory, uint256, address) {}
    
    function approve(bytes32 hash) external { approvals[hash]++; }
    function executePause(bytes32 hash) external { require(approvals[hash] >= threshold, "Not enough"); systemPaused = true; }
    function executeUnpause(bytes32 hash) external { require(approvals[hash] >= threshold, "Not enough"); systemPaused = false; }
    function isPaused() external view returns (bool) { return systemPaused; }
}

contract MockQSToken {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    
    constructor(address) {}
    
    function mint(address to, uint256 amount) external { balances[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) { allowances[msg.sender][spender] = amount; return true; }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowances[from][msg.sender] -= amount;
        balances[from] -= amount;
        balances[to] += amount;
        return true;
    }
    function balanceOf(address account) external view returns (uint256) { return balances[account]; }
}

contract MockVeQS {
    MockQSToken public qsToken;
    mapping(address => uint256) public locks;
    
    constructor(address _qsToken, address) { qsToken = MockQSToken(_qsToken); }
    
    function createLock(uint256 amount, uint256) external {
        qsToken.transferFrom(msg.sender, address(this), amount);
        locks[msg.sender] = amount;
    }
    function balanceOf(address account) external view returns (uint256) { return locks[account]; }
}

contract MockTreasury {
    constructor(address) {}
    receive() external payable {}
}

contract MockGovernanceSwitch {
    constructor(address, address[] memory, address, address) {}
}

// ============================================
// Test Contract
// ============================================

contract FullSystemE2E is Test {
    uint256 public constant MIN_PROVER_STAKE = 400_000e18;
    uint256 public constant NORMAL_TIMELOCK = 24 hours;
    uint256 public constant EMERGENCY_TIMELOCK = 7 days;
    uint256 public constant GOVERNANCE_TIMELOCK = 7 days;
    
    // Real CoreLayer for bridge operations
    CoreLayer public coreLayer;
    
    // Mock contracts for other components
    MockSequencerRegistry public seqRegistry;
    MockSlashing public seqSlashing;
    MockRotation public seqRotation;
    MockGovernor public governor;
    MockSecurityCouncil public securityCouncil;
    MockGovernanceSwitch public govSwitch;
    MockQSToken public qsToken;
    MockVeQS public veQSToken;
    MockTreasury public treasury;
    
    address public admin;
    address[] public sequencers;
    address[] public scMembers;
    address[] public voters;
    address public user;
    address public challenger;
    
    function setUp() public {
        admin = makeAddr("admin");
        user = makeAddr("user");
        challenger = makeAddr("challenger");
        
        for (uint256 i = 0; i < 4; i++) {
            sequencers.push(makeAddr(string.concat("seq", vm.toString(i))));
            vm.deal(sequencers[i], MIN_PROVER_STAKE + 1 ether);
        }
        for (uint256 i = 0; i < 9; i++) {
            scMembers.push(makeAddr(string.concat("sc", vm.toString(i))));
        }
        for (uint256 i = 0; i < 20; i++) {
            voters.push(makeAddr(string.concat("voter", vm.toString(i))));
        }
        
        vm.deal(user, 100 ether);
        vm.deal(challenger, 10 ether);
        
        _deploySystem();
    }
    
    function _deploySystem() internal {
        vm.startPrank(admin);
        
        // Deploy real CoreLayer
        coreLayer = new CoreLayer();
        
        // Deploy mock contracts
        qsToken = new MockQSToken(admin);
        veQSToken = new MockVeQS(address(qsToken), admin);
        treasury = new MockTreasury(admin);
        seqRegistry = new MockSequencerRegistry(admin);
        seqSlashing = new MockSlashing(address(seqRegistry), address(treasury), admin);
        seqRotation = new MockRotation(address(seqRegistry), admin);
        securityCouncil = new MockSecurityCouncil(scMembers, 5, admin);
        governor = new MockGovernor(address(veQSToken), address(treasury), admin);
        
        address[] memory multisigSigners = new address[](5);
        for (uint256 i = 0; i < 5; i++) multisigSigners[i] = scMembers[i];
        govSwitch = new MockGovernanceSwitch(admin, multisigSigners, address(governor), address(securityCouncil));
        
        for (uint256 i = 0; i < voters.length; i++) qsToken.mint(voters[i], 5_000_000e18);
        
        vm.stopPrank();
        
        // Fund contracts
        vm.deal(address(coreLayer), 1000 ether);
        vm.deal(address(seqRegistry), 10000 ether);
        
        // Register sequencers
        for (uint256 i = 0; i < sequencers.length; i++) {
            vm.prank(sequencers[i]);
            seqRegistry.register{value: MIN_PROVER_STAKE}();
        }
        seqRotation.setSequencers(sequencers);
        
        // Setup voters with veQS
        for (uint256 i = 0; i < voters.length; i++) {
            vm.startPrank(voters[i]);
            qsToken.approve(address(veQSToken), type(uint256).max);
            veQSToken.createLock(5_000_000e18, block.timestamp + 365 days);
            vm.stopPrank();
        }
    }
    
    // =========================================================================
    // CoreLayer Bridge Tests (Real Implementation)
    // =========================================================================
    
    function test_FullFlow_LockUnlockClaim_RealBridge() public {
        uint256 lockAmount = 1 ether;
        bytes32 recipient = bytes32(uint256(uint160(user)));
        
        // Lock using real CoreLayer
        vm.prank(user);
        bytes32 txHash = coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipient);
        assertTrue(coreLayer.isLocked(txHash), "Asset should be locked");
        
        // Verify transaction details
        ICoreLayer.BridgeTx memory tx = coreLayer.getTransaction(txHash);
        assertEq(tx.amount, lockAmount, "Lock amount should match");
        assertEq(tx.recipient, recipient, "Recipient should match");
        
        // Unlock with proof
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)), bytes32(uint256(2)));
        vm.prank(user);
        coreLayer.unlock(txHash, proof, user);
        
        // Advance past timelock
        vm.warp(block.timestamp + NORMAL_TIMELOCK + 1);
        
        // Claim
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreLayer.claim(txHash, user);
        assertEq(user.balance - balanceBefore, lockAmount, "Should receive locked amount");
        assertFalse(coreLayer.isLocked(txHash), "Asset should be unlocked");
    }
    
    function test_FullFlow_EmergencyUnlock_RealBridge() public {
        uint256 lockAmount = 10 ether;
        bytes32 recipient = bytes32(uint256(uint160(user)));
        
        // Lock
        vm.prank(user);
        bytes32 txHash = coreLayer.lock{value: lockAmount}(address(0), lockAmount, recipient);
        
        // Calculate emergency bond
        uint256 bond = coreLayer.calculateEmergencyBond(lockAmount);
        assertEq(bond, lockAmount * 5 / 100, "Large amount should use 5% bond");
        
        // Emergency unlock
        vm.prank(user);
        coreLayer.emergencyUnlock{value: bond}(txHash, user);
        
        // Verify emergency state
        ICoreLayer.BridgeTx memory tx = coreLayer.getTransaction(txHash);
        assertTrue(tx.isEmergency, "Should be emergency unlock");
        
        // Advance past emergency timelock (7 days)
        vm.warp(block.timestamp + EMERGENCY_TIMELOCK + 1);
        
        // Claim
        uint256 balanceBefore = user.balance;
        vm.prank(user);
        coreLayer.claim(txHash, user);
        assertGe(user.balance - balanceBefore, lockAmount, "Should receive at least locked amount");
    }
    
    // =========================================================================
    // Integration Tests (Mock + Real)
    // =========================================================================
    
    function test_FullFlow_GovernanceProposal() public {
        vm.prank(voters[0]);
        uint256 proposalId = governor.propose(address(coreLayer), "", "Test");
        vm.warp(block.timestamp + 7 days);
        for (uint256 i = 0; i < 15; i++) { vm.prank(voters[i]); governor.castVote(proposalId, true); }
        vm.warp(block.timestamp + 7 days);
        vm.prank(voters[0]);
        governor.queue(proposalId);
        vm.warp(block.timestamp + GOVERNANCE_TIMELOCK);
        vm.prank(voters[0]);
        governor.execute(proposalId);
        assertTrue(governor.isExecuted(proposalId), "Proposal should be executed");
    }
    
    function test_FullFlow_ChallengeSlash() public {
        address maliciousSeq = sequencers[0];
        vm.prank(challenger);
        seqSlashing.submitChallenge{value: 0.1 ether}(maliciousSeq, "");
        vm.warp(block.timestamp + 48 hours);
        uint256 stakeBefore = seqRegistry.getStake(maliciousSeq);
        vm.prank(admin);
        seqSlashing.executeSlash(maliciousSeq);
        uint256 stakeAfter = seqRegistry.getStake(maliciousSeq);
        assertEq(stakeBefore - stakeAfter, stakeBefore / 10, "Should slash 10%");
    }
    
    function test_FullFlow_EmergencyPause() public {
        bytes32 pauseHash = keccak256("emergency_pause");
        for (uint256 i = 0; i < 5; i++) { vm.prank(scMembers[i]); securityCouncil.approve(pauseHash); }
        vm.prank(scMembers[0]);
        securityCouncil.executePause(pauseHash);
        assertTrue(securityCouncil.isPaused(), "System should be paused");
        
        bytes32 unpauseHash = keccak256("unpause");
        for (uint256 i = 0; i < 5; i++) { vm.prank(scMembers[i]); securityCouncil.approve(unpauseHash); }
        vm.prank(scMembers[0]);
        securityCouncil.executeUnpause(unpauseHash);
        assertFalse(securityCouncil.isPaused(), "System should be unpaused");
    }
    
    function test_FullFlow_SequencerRotation() public {
        assertEq(seqRotation.currentLeader(), sequencers[0], "First sequencer should be leader");
        for (uint256 i = 0; i < 10; i++) {
            bytes32 blockHash = keccak256(abi.encodePacked("block", i));
            for (uint256 j = 0; j < 3; j++) { vm.prank(sequencers[j]); seqRotation.signBlock(blockHash); }
            assertTrue(seqRotation.isBlockFinalized(blockHash), "Block should be finalized");
        }
        vm.warp(block.timestamp + 10 seconds);
        seqRotation.rotate();
        assertEq(seqRotation.currentLeader(), sequencers[1], "Should rotate to next sequencer");
    }
    
    // =========================================================================
    // System State Verification
    // =========================================================================
    
    function test_SystemState_AllComponentsDeployed() public view {
        assertTrue(address(coreLayer) != address(0), "CoreLayer deployed");
        assertTrue(address(seqRegistry) != address(0), "SeqRegistry deployed");
        assertTrue(address(seqSlashing) != address(0), "Slashing deployed");
        assertTrue(address(seqRotation) != address(0), "Rotation deployed");
        assertTrue(address(governor) != address(0), "Governor deployed");
        assertTrue(address(securityCouncil) != address(0), "SC deployed");
        assertTrue(address(qsToken) != address(0), "QS deployed");
        assertTrue(address(veQSToken) != address(0), "veQS deployed");
        assertTrue(address(treasury) != address(0), "Treasury deployed");
    }
    
    function test_CoreLayer_CPCompliance() public view {
        assertTrue(coreLayer.verifyCPCompliance(), "CoreLayer should be CP compliant");
        assertEq(coreLayer.NORMAL_TIMELOCK(), 24 hours, "Normal timelock should be 24h");
        assertEq(coreLayer.EMERGENCY_TIMELOCK(), 7 days, "Emergency timelock should be 7d");
    }
}
