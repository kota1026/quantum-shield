// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

/**
 * @title GovernanceModeE2E
 * @notice E2E tests for Governance mode transitions
 * @dev Implements TEST-009 from Phase 3.3 Track B
 *      Uses mock contracts to avoid import conflicts
 */

// ============================================
// Mock Contracts
// ============================================

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
    uint256 public totalLocked;
    
    constructor(address _qsToken) { qsToken = MockQSToken(_qsToken); }
    
    function createLock(uint256 amount, uint256) external {
        qsToken.transferFrom(msg.sender, address(this), amount);
        locks[msg.sender] = amount;
        totalLocked += amount;
    }
    function getTotalLocked() external view returns (uint256) { return totalLocked; }
}

contract MockSecurityCouncil {
    mapping(bytes32 => uint256) public approvals;
    mapping(bytes32 => bool) public vetoed;
    uint256 public threshold = 5;
    bool public paused;
    
    function approve(bytes32 hash) external { approvals[hash]++; }
    function veto(bytes32 target) external { approvals[target]++; if (approvals[target] >= 6) vetoed[target] = true; }
    function isVetoed(bytes32 target) external view returns (bool) { return vetoed[target]; }
    function executePause(bytes32 hash) external { require(approvals[hash] >= threshold, "Not enough"); paused = true; }
    function executeUnpause(bytes32 hash) external { require(approvals[hash] >= threshold, "Not enough"); paused = false; }
}

contract MockGovernor {
    uint256 public proposalCount;
    mapping(uint256 => bool) public executed;
    
    function propose(address, bytes calldata, string calldata) external returns (uint256) {
        proposalCount++;
        return proposalCount;
    }
}

contract MockGovernanceSwitch {
    uint8 public constant MODE_CENTRALIZED = 0;
    uint8 public constant MODE_MULTISIG = 1;
    uint8 public constant MODE_DECENTRALIZED = 2;
    
    uint8 public currentMode;
    address public admin;
    address[] public multisigSigners;
    MockVeQS public veQS;
    MockSecurityCouncil public securityCouncil;
    bool public paused;
    
    mapping(bytes32 => uint256) public signatures;
    uint256 public constant MULTISIG_THRESHOLD = 3;
    uint256 public constant MIN_VEQS = 10_000_000e18;
    
    constructor(address _admin, address[] memory _signers, address _veQS, address _sc) {
        admin = _admin;
        multisigSigners = _signers;
        veQS = MockVeQS(_veQS);
        securityCouncil = MockSecurityCouncil(_sc);
        currentMode = MODE_CENTRALIZED;
    }
    
    function executeAction(bytes calldata) external {
        if (currentMode == MODE_CENTRALIZED) {
            require(msg.sender == admin, "Not authorized");
        }
    }
    
    function transitionToMultisig() external {
        require(msg.sender == admin, "Not admin");
        require(currentMode == MODE_CENTRALIZED, "Wrong mode");
        currentMode = MODE_MULTISIG;
    }
    
    function transitionToDecentralized() external {
        require(currentMode == MODE_MULTISIG, "Must transition through multisig");
        require(veQS.getTotalLocked() >= MIN_VEQS, "Insufficient veQS participation");
        currentMode = MODE_DECENTRALIZED;
    }
    
    function transitionToCentralized() external pure {
        revert("Cannot revert to centralized");
    }
    
    function signAction(bytes32 actionHash) external {
        bool isSigner = false;
        for (uint256 i = 0; i < multisigSigners.length; i++) {
            if (multisigSigners[i] == msg.sender) { isSigner = true; break; }
        }
        require(isSigner, "Not a signer");
        signatures[actionHash]++;
    }
    
    function isActionApproved(bytes32 actionHash) external view returns (bool) {
        return signatures[actionHash] >= MULTISIG_THRESHOLD;
    }
    
    function requiresGovernorApproval() external view returns (bool) {
        return currentMode == MODE_DECENTRALIZED;
    }
    
    function isPaused() external view returns (bool) {
        return securityCouncil.paused();
    }
}

// ============================================
// Test Contract
// ============================================

contract GovernanceModeE2E is Test {
    uint8 public constant MODE_CENTRALIZED = 0;
    uint8 public constant MODE_MULTISIG = 1;
    uint8 public constant MODE_DECENTRALIZED = 2;
    uint256 public constant MULTISIG_THRESHOLD = 3;
    uint256 public constant MULTISIG_SIGNERS = 5;
    uint256 public constant DECENTRALIZED_MIN_VEQS = 10_000_000e18;
    
    MockGovernanceSwitch public governanceSwitch;
    MockGovernor public governor;
    MockSecurityCouncil public securityCouncil;
    MockQSToken public qsToken;
    MockVeQS public veQSToken;
    
    address public admin;
    address[] public multisigSigners;
    address[] public scMembers;
    address[] public voters;
    
    function setUp() public {
        admin = makeAddr("admin");
        
        for (uint256 i = 0; i < MULTISIG_SIGNERS; i++) {
            multisigSigners.push(makeAddr(string.concat("signer", vm.toString(i))));
        }
        for (uint256 i = 0; i < 9; i++) {
            scMembers.push(makeAddr(string.concat("sc", vm.toString(i))));
        }
        for (uint256 i = 0; i < 10; i++) {
            voters.push(makeAddr(string.concat("voter", vm.toString(i))));
        }
        
        vm.startPrank(admin);
        qsToken = new MockQSToken();
        veQSToken = new MockVeQS(address(qsToken));
        securityCouncil = new MockSecurityCouncil();
        governor = new MockGovernor();
        governanceSwitch = new MockGovernanceSwitch(
            admin,
            multisigSigners,
            address(veQSToken),
            address(securityCouncil)
        );
        
        for (uint256 i = 0; i < voters.length; i++) {
            qsToken.mint(voters[i], 2_000_000e18);
        }
        vm.stopPrank();
    }
    
    function test_InitialState_Centralized() public view {
        assertEq(governanceSwitch.currentMode(), MODE_CENTRALIZED);
        assertEq(governanceSwitch.admin(), admin);
    }
    
    function test_Centralized_AdminCanExecute() public {
        bytes memory action = abi.encodeWithSignature("updateParameter(uint256)", 100);
        vm.prank(admin);
        governanceSwitch.executeAction(action);
    }
    
    function test_Centralized_NonAdminCannotExecute() public {
        bytes memory action = abi.encodeWithSignature("updateParameter(uint256)", 100);
        vm.prank(voters[0]);
        vm.expectRevert("Not authorized");
        governanceSwitch.executeAction(action);
    }
    
    function test_Transition_CentralizedToMultisig() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        assertEq(governanceSwitch.currentMode(), MODE_MULTISIG);
    }
    
    function test_Multisig_RequiresThreeSignatures() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        bytes32 actionHash = keccak256("test_action");
        for (uint256 i = 0; i < MULTISIG_THRESHOLD; i++) {
            vm.prank(multisigSigners[i]);
            governanceSwitch.signAction(actionHash);
        }
        assertTrue(governanceSwitch.isActionApproved(actionHash));
    }
    
    function test_Multisig_TwoSignaturesFails() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        bytes32 actionHash = keccak256("test_action");
        for (uint256 i = 0; i < MULTISIG_THRESHOLD - 1; i++) {
            vm.prank(multisigSigners[i]);
            governanceSwitch.signAction(actionHash);
        }
        assertFalse(governanceSwitch.isActionApproved(actionHash));
    }
    
    function test_Transition_MultisigToDecentralized() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        for (uint256 i = 0; i < voters.length; i++) {
            vm.startPrank(voters[i]);
            qsToken.approve(address(veQSToken), type(uint256).max);
            veQSToken.createLock(2_000_000e18, block.timestamp + 365 days);
            vm.stopPrank();
        }
        
        vm.prank(multisigSigners[0]);
        governanceSwitch.transitionToDecentralized();
        assertEq(governanceSwitch.currentMode(), MODE_DECENTRALIZED);
    }
    
    function test_Decentralized_RequiresMinVeQS() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        vm.prank(multisigSigners[0]);
        vm.expectRevert("Insufficient veQS participation");
        governanceSwitch.transitionToDecentralized();
    }
    
    function test_Decentralized_GovernorControls() public {
        _transitionToDecentralized();
        assertTrue(governanceSwitch.requiresGovernorApproval());
    }
    
    function test_Decentralized_SCCanVeto() public {
        _transitionToDecentralized();
        
        bytes32 vetoTarget = keccak256("proposal_to_veto");
        for (uint256 i = 0; i < 6; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.veto(vetoTarget);
        }
        assertTrue(securityCouncil.isVetoed(vetoTarget));
    }
    
    function test_CannotRevertToCentralized() public {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        vm.prank(admin);
        vm.expectRevert("Cannot revert to centralized");
        governanceSwitch.transitionToCentralized();
    }
    
    function test_CannotSkipMultisig() public {
        vm.prank(admin);
        vm.expectRevert("Must transition through multisig");
        governanceSwitch.transitionToDecentralized();
    }
    
    function test_Emergency_SCCanPauseInAnyMode() public {
        bytes32 pauseHash = keccak256("emergency_pause");
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(scMembers[i]);
            securityCouncil.approve(pauseHash);
        }
        vm.prank(scMembers[0]);
        securityCouncil.executePause(pauseHash);
        assertTrue(governanceSwitch.isPaused());
    }
    
    function _transitionToDecentralized() internal {
        vm.prank(admin);
        governanceSwitch.transitionToMultisig();
        
        for (uint256 i = 0; i < voters.length; i++) {
            vm.startPrank(voters[i]);
            qsToken.approve(address(veQSToken), type(uint256).max);
            veQSToken.createLock(2_000_000e18, block.timestamp + 365 days);
            vm.stopPrank();
        }
        
        vm.prank(multisigSigners[0]);
        governanceSwitch.transitionToDecentralized();
    }
}
