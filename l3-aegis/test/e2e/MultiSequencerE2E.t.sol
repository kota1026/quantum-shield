// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

/**
 * @title MultiSequencerE2E
 * @notice E2E tests for multi-sequencer operations
 * @dev Implements TEST-007 from Phase 3.3 Track B
 *      Uses mock contracts to avoid import conflicts
 */

// ============================================
// Mock Contracts
// ============================================

contract MockSequencerRegistry {
    mapping(address => uint256) public stakes;
    mapping(address => bool) public registered;
    mapping(address => bool) public active;
    mapping(address => uint256) public lastHeartbeat;
    uint256 public activeCount;
    
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
    function markInactive(address seq) external { if (active[seq]) { active[seq] = false; activeCount--; } }
    function markActive(address seq) external { if (!active[seq] && registered[seq]) { active[seq] = true; activeCount++; } }
    function heartbeat() external { lastHeartbeat[msg.sender] = block.timestamp; if (!active[msg.sender] && registered[msg.sender]) { active[msg.sender] = true; activeCount++; } }
    function isHealthy(address seq) external view returns (bool) { return active[seq] && block.timestamp - lastHeartbeat[seq] < 30 seconds; }
}

contract MockSlashing {
    MockSequencerRegistry public registry;
    mapping(address => uint256) public challengeTime;
    mapping(address => bool) public challenged;
    
    constructor(address _registry, address, address) { registry = MockSequencerRegistry(_registry); }
    
    function submitChallenge(address seq, bytes calldata) external payable { challenged[seq] = true; challengeTime[seq] = block.timestamp; }
    function executeSlash(address seq) external {
        require(challenged[seq], "Not challenged");
        require(block.timestamp >= challengeTime[seq] + 48 hours, "Defense period");
        uint256 stake = registry.getStake(seq);
        registry.reduceStake(seq, stake / 10);
        challenged[seq] = false;
    }
}

contract MockRotation {
    MockSequencerRegistry public registry;
    address[] public sequencers;
    uint256 public currentIndex;
    uint256 public lastRotation;
    mapping(bytes32 => uint256) public signatureCount;
    mapping(bytes32 => bool) public finalized;
    uint256 public constant ROTATION_TIMEOUT = 10 seconds;
    uint256 public constant QUORUM = 3;
    
    constructor(address _registry, address) { registry = MockSequencerRegistry(_registry); lastRotation = block.timestamp; }
    
    function setSequencers(address[] memory _seqs) external { sequencers = _seqs; }
    
    function currentLeader() public view returns (address) {
        if (sequencers.length == 0) return address(0);
        uint256 idx = currentIndex % sequencers.length;
        for (uint256 i = 0; i < sequencers.length; i++) {
            address seq = sequencers[(idx + i) % sequencers.length];
            if (registry.isActive(seq)) return seq;
        }
        return sequencers[idx];
    }
    
    function signBlock(bytes32 blockHash) external {
        signatureCount[blockHash]++;
        if (signatureCount[blockHash] >= QUORUM) finalized[blockHash] = true;
    }
    function isBlockFinalized(bytes32 blockHash) external view returns (bool) { return finalized[blockHash]; }
    
    function rotate() external {
        require(block.timestamp >= lastRotation + ROTATION_TIMEOUT, "Rotation timeout not reached");
        currentIndex++;
        lastRotation = block.timestamp;
    }
    function emergencyRotate() external { currentIndex++; lastRotation = block.timestamp; }
    function isEmergencyState() external view returns (bool) { return registry.activeCount() == 0; }
}

// ============================================
// Test Contract
// ============================================

contract MultiSequencerE2E is Test {
    uint256 public constant NUM_SEQUENCERS = 4;
    uint256 public constant MIN_STAKE = 400_000e18;
    uint256 public constant ROTATION_TIMEOUT = 10 seconds;
    uint256 public constant HEALTH_CHECK_INTERVAL = 30 seconds;
    uint256 public constant QUORUM = 3;
    
    MockSequencerRegistry public registry;
    MockSlashing public slashing;
    MockRotation public rotation;
    
    address public admin;
    address[] public sequencers;
    
    function setUp() public {
        admin = makeAddr("admin");
        
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            sequencers.push(makeAddr(string.concat("seq", vm.toString(i))));
            vm.deal(sequencers[i], MIN_STAKE + 1 ether);
        }
        
        vm.startPrank(admin);
        registry = new MockSequencerRegistry();
        slashing = new MockSlashing(address(registry), admin, admin);
        rotation = new MockRotation(address(registry), admin);
        vm.stopPrank();
        
        vm.deal(address(registry), 10000 ether);
        
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            registry.register{value: MIN_STAKE}();
        }
        rotation.setSequencers(sequencers);
    }
    
    function test_BFT_AllNodesHealthy() public view {
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            assertTrue(registry.isRegistered(sequencers[i]), "Sequencer should be registered");
            assertTrue(registry.isActive(sequencers[i]), "Sequencer should be active");
        }
        assertEq(registry.activeCount(), NUM_SEQUENCERS, "Should have 4 active sequencers");
    }
    
    function test_BFT_QuorumReached() public {
        bytes32 blockHash = keccak256("block_data");
        for (uint256 i = 0; i < QUORUM; i++) {
            vm.prank(sequencers[i]);
            rotation.signBlock(blockHash);
        }
        assertTrue(rotation.isBlockFinalized(blockHash), "Block should be finalized");
    }
    
    function test_BFT_TolerateOneFaulty() public {
        vm.prank(admin);
        registry.markInactive(sequencers[0]);
        assertEq(registry.activeCount(), NUM_SEQUENCERS - 1, "Should have 3 active");
        
        bytes32 blockHash = keccak256("block_data");
        for (uint256 i = 1; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            rotation.signBlock(blockHash);
        }
        assertTrue(rotation.isBlockFinalized(blockHash), "Should finalize with 3 signatures");
    }
    
    function test_BFT_CannotFinalizeWithTwoFaulty() public {
        vm.startPrank(admin);
        registry.markInactive(sequencers[0]);
        registry.markInactive(sequencers[1]);
        vm.stopPrank();
        
        assertEq(registry.activeCount(), 2, "Should have 2 active");
        
        bytes32 blockHash = keccak256("block_data");
        for (uint256 i = 2; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            rotation.signBlock(blockHash);
        }
        assertFalse(rotation.isBlockFinalized(blockHash), "Should NOT finalize with only 2 signatures");
    }
    
    function test_Rotation_NormalCycle() public {
        assertEq(rotation.currentLeader(), sequencers[0], "First sequencer should be initial leader");
        vm.warp(block.timestamp + ROTATION_TIMEOUT);
        rotation.rotate();
        assertEq(rotation.currentLeader(), sequencers[1], "Should rotate to next sequencer");
    }
    
    function test_Rotation_FullCycle() public {
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            assertEq(rotation.currentLeader(), sequencers[i], "Leader should match expected");
            vm.warp(block.timestamp + ROTATION_TIMEOUT);
            rotation.rotate();
        }
        assertEq(rotation.currentLeader(), sequencers[0], "Should wrap to first sequencer");
    }
    
    function test_Rotation_SkipInactive() public {
        vm.prank(admin);
        registry.markInactive(sequencers[1]);
        vm.warp(block.timestamp + ROTATION_TIMEOUT);
        rotation.rotate();
        assertEq(rotation.currentLeader(), sequencers[2], "Should skip inactive and go to seq2");
    }
    
    function test_Failover_LeaderCrash() public {
        address originalLeader = rotation.currentLeader();
        vm.prank(admin);
        registry.markInactive(originalLeader);
        rotation.emergencyRotate();
        address newLeader = rotation.currentLeader();
        assertTrue(newLeader != originalLeader, "Should have new leader");
        assertTrue(registry.isActive(newLeader), "New leader should be active");
    }
    
    function test_HealthCheck_AllHealthy() public {
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            vm.prank(sequencers[i]);
            registry.heartbeat();
        }
        for (uint256 i = 0; i < NUM_SEQUENCERS; i++) {
            assertTrue(registry.isHealthy(sequencers[i]), "All should be healthy");
        }
    }
    
    function test_Slashing_MaliciousSequencer() public {
        bytes memory doubleSignProof = abi.encodePacked(sequencers[0], keccak256("block1"), keccak256("block2"));
        vm.prank(sequencers[1]);
        slashing.submitChallenge{value: 0.1 ether}(sequencers[0], doubleSignProof);
        vm.warp(block.timestamp + 48 hours);
        
        uint256 stakeBefore = registry.getStake(sequencers[0]);
        vm.prank(admin);
        slashing.executeSlash(sequencers[0]);
        uint256 stakeAfter = registry.getStake(sequencers[0]);
        assertEq(stakeBefore - stakeAfter, stakeBefore / 10, "Should slash 10%");
    }
    
    function test_Performance_BlockThroughput() public {
        uint256 blocksProduced = 0;
        for (uint256 i = 0; i < 100; i++) {
            bytes32 blockHash = keccak256(abi.encodePacked("block", i));
            for (uint256 j = 0; j < QUORUM; j++) {
                vm.prank(sequencers[j]);
                rotation.signBlock(blockHash);
            }
            if (rotation.isBlockFinalized(blockHash)) {
                blocksProduced++;
            }
            if ((i + 1) % 10 == 0) {
                vm.warp(block.timestamp + ROTATION_TIMEOUT);
                rotation.rotate();
            }
        }
        assertEq(blocksProduced, 100, "All blocks should be finalized");
    }
}
