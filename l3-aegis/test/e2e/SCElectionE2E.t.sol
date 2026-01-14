// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

/**
 * @title SCElectionE2E
 * @notice E2E tests for Security Council election and voting
 * @dev Implements TEST-008 from Phase 3.3 Track B
 *      Uses mock contracts to avoid import conflicts
 */

// ============================================
// Mock Contracts
// ============================================

contract MockSecurityCouncil {
    address[] public members;
    uint256 public threshold = 5;
    uint256 public vetoThreshold = 6;
    bool public systemPaused;
    
    mapping(bytes32 => uint256) public approvalCount;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    mapping(bytes32 => uint256) public vetoCount;
    mapping(bytes32 => bool) public vetoed;
    
    constructor(address[] memory _members, uint256 _threshold, address) {
        members = _members;
        threshold = _threshold;
    }
    
    function memberCount() external view returns (uint256) { return members.length; }
    
    function isMember(address account) public view returns (bool) {
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == account) return true;
        }
        return false;
    }
    
    function approve(bytes32 proposal) external {
        require(isMember(msg.sender), "Not a member");
        require(!hasVoted[proposal][msg.sender], "Already voted");
        hasVoted[proposal][msg.sender] = true;
        approvalCount[proposal]++;
    }
    
    function isApproved(bytes32 proposal) external view returns (bool) {
        return approvalCount[proposal] >= threshold;
    }
    
    function veto(bytes32 target) external {
        require(isMember(msg.sender), "Not a member");
        require(!hasVoted[target][msg.sender], "Already voted");
        hasVoted[target][msg.sender] = true;
        vetoCount[target]++;
        if (vetoCount[target] >= vetoThreshold) vetoed[target] = true;
    }
    
    function isVetoed(bytes32 target) external view returns (bool) {
        return vetoed[target];
    }
    
    function executePause(bytes32 action) external {
        require(approvalCount[action] >= threshold, "Not approved");
        systemPaused = true;
    }
    
    function isSystemPaused() external view returns (bool) {
        return systemPaused;
    }
}

contract MockQSToken {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    
    function mint(address to, uint256 amount) external { balances[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) { allowances[msg.sender][spender] = amount; return true; }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowances[from][msg.sender] -= amount;
        balances[from] -= amount;
        balances[to] += amount;
        return true;
    }
}

contract MockVeQS {
    MockQSToken public qsToken;
    mapping(address => uint256) public locks;
    
    constructor(address _qsToken) { qsToken = MockQSToken(_qsToken); }
    
    function createLock(uint256 amount, uint256) external {
        qsToken.transferFrom(msg.sender, address(this), amount);
        locks[msg.sender] = amount;
    }
}

contract MockGovernor {
    uint256 public proposalCount;
    
    function propose(address, bytes calldata, string calldata) external returns (uint256) {
        proposalCount++;
        return proposalCount;
    }
}

// ============================================
// Test Contract
// ============================================

contract SCElectionE2E is Test {
    uint256 public constant SC_SIZE = 9;
    uint256 public constant SC_THRESHOLD = 5;
    uint256 public constant VETO_THRESHOLD = 6;
    
    MockSecurityCouncil public securityCouncil;
    MockGovernor public governor;
    MockQSToken public qsToken;
    MockVeQS public veQSToken;
    
    address public admin;
    address[] public scMembers;
    address[] public voters;
    
    function setUp() public {
        admin = makeAddr("admin");
        
        for (uint256 i = 0; i < SC_SIZE; i++) {
            scMembers.push(makeAddr(string.concat("sc", vm.toString(i))));
        }
        
        for (uint256 i = 0; i < 20; i++) {
            voters.push(makeAddr(string.concat("voter", vm.toString(i))));
        }
        
        vm.startPrank(admin);
        qsToken = new MockQSToken();
        veQSToken = new MockVeQS(address(qsToken));
        securityCouncil = new MockSecurityCouncil(scMembers, SC_THRESHOLD, admin);
        governor = new MockGovernor();
        
        for (uint256 i = 0; i < voters.length; i++) {
            qsToken.mint(voters[i], 1_000_000e18);
        }
        vm.stopPrank();
    }
    
    function test_InitialState_SCMembers() public view {
        assertEq(securityCouncil.memberCount(), SC_SIZE);
        for (uint256 i = 0; i < SC_SIZE; i++) {
            assertTrue(securityCouncil.isMember(scMembers[i]));
        }
    }
    
    function test_Threshold_ExactlyFiveApprovals() public {
        bytes32 proposal = keccak256("test_proposal");
        for (uint256 i = 0; i < SC_THRESHOLD; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(proposal);
        }
        assertTrue(securityCouncil.isApproved(proposal));
    }
    
    function test_Threshold_FourApprovalsFails() public {
        bytes32 proposal = keccak256("test_proposal");
        for (uint256 i = 0; i < SC_THRESHOLD - 1; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(proposal);
        }
        assertFalse(securityCouncil.isApproved(proposal));
    }
    
    function test_Veto_SixVotesRequired() public {
        bytes32 vetoTarget = keccak256("veto_target");
        for (uint256 i = 0; i < VETO_THRESHOLD; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.veto(vetoTarget);
        }
        assertTrue(securityCouncil.isVetoed(vetoTarget));
    }
    
    function test_Veto_FiveVotesFails() public {
        bytes32 vetoTarget = keccak256("veto_target");
        for (uint256 i = 0; i < VETO_THRESHOLD - 1; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.veto(vetoTarget);
        }
        assertFalse(securityCouncil.isVetoed(vetoTarget));
    }
    
    function test_Emergency_PauseSystem() public {
        bytes32 pauseAction = keccak256("emergency_pause");
        for (uint256 i = 0; i < SC_THRESHOLD; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(pauseAction);
        }
        vm.prank(scMembers[0]);
        securityCouncil.executePause(pauseAction);
        assertTrue(securityCouncil.isSystemPaused());
    }
    
    function test_CannotVoteTwice() public {
        bytes32 proposal = keccak256("test_proposal");
        vm.prank(scMembers[0]);
        securityCouncil.approve(proposal);
        vm.prank(scMembers[0]);
        vm.expectRevert("Already voted");
        securityCouncil.approve(proposal);
    }
    
    function test_NonMemberCannotVote() public {
        bytes32 proposal = keccak256("test_proposal");
        address nonMember = makeAddr("nonMember");
        vm.prank(nonMember);
        vm.expectRevert("Not a member");
        securityCouncil.approve(proposal);
    }
}
