// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ExternalBridgeAdapter} from "../src/bridge/ExternalBridgeAdapter.sol";
import {IExternalBridgeAdapter} from "../src/interfaces/IExternalBridgeAdapter.sol";
import {IGovernanceSwitch} from "../src/interfaces/IGovernanceSwitch.sol";
import {ITokenSwitch} from "../src/interfaces/ITokenSwitch.sol";
import {GovernanceSwitch} from "../src/governance/GovernanceSwitch.sol";
import {TokenSwitch} from "../src/token/TokenSwitch.sol";

/// @title ExternalBridgeAdapterTest
/// @notice Comprehensive test suite for ExternalBridgeAdapter
/// @dev Tests cover:
///      - TEST-001: Unit tests
///      - TEST-002: Core ↔ Governance interconnection
///      - TEST-003: Core ↔ Token interconnection
///      - TEST-004: Governance ↔ Token interconnection
///      - TEST-005: All valid mode combinations
///      - TEST-006: Prohibited mode combinations (DECENTRALIZED + DISABLED)
/// @custom:ref CURRENT_PLAN.md TEST-001~006
contract ExternalBridgeAdapterTest is Test {
    // ============ Test Fixtures ============
    
    ExternalBridgeAdapter public adapter;
    GovernanceSwitch public governance;
    TokenSwitch public tokenSwitch;
    
    address public admin = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public signer1 = address(0x4);
    address public signer2 = address(0x5);
    address public signer3 = address(0x6);
    address public qsToken = address(0x100);
    
    /// @notice Pre-computed selectors for CP-1 compliance
    bytes4 constant SELECTOR_LOCK = bytes4(0x12345678);
    bytes4 constant SELECTOR_UNLOCK = bytes4(0x23456789);
    bytes4 constant SELECTOR_EMERGENCY_UNLOCK = bytes4(0x34567890);
    bytes4 constant SELECTOR_PROVER_REGISTRATION = bytes4(0x45678901);
    bytes4 constant SELECTOR_GOVERNANCE_PROPOSAL = bytes4(0x56789012);
    
    // ============ Setup ============
    
    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy GovernanceSwitch
        governance = new GovernanceSwitch(admin);
        
        // Deploy TokenSwitch
        tokenSwitch = new TokenSwitch(admin);
        tokenSwitch.setGovernanceSwitch(address(governance));
        tokenSwitch.setTokenAddress(qsToken);
        
        // Deploy ExternalBridgeAdapter
        adapter = new ExternalBridgeAdapter(admin);
        
        vm.stopPrank();
    }
    
    // ============ TEST-001: Unit Tests ============
    
    /// @notice Test initialization
    function test_initialization() public {
        assertEq(adapter.isInitialized(), false);
        
        vm.prank(admin);
        adapter.initialize(address(governance), address(tokenSwitch));
        
        assertEq(adapter.isInitialized(), true);
        assertEq(adapter.getGovernanceSwitchAddress(), address(governance));
        assertEq(adapter.getTokenSwitchAddress(), address(tokenSwitch));
    }
    
    /// @notice Test double initialization reverts
    function test_revert_doubleInitialization() public {
        vm.startPrank(admin);
        adapter.initialize(address(governance), address(tokenSwitch));
        
        vm.expectRevert(IExternalBridgeAdapter.AlreadyInitialized.selector);
        adapter.initialize(address(governance), address(tokenSwitch));
        vm.stopPrank();
    }
    
    /// @notice Test initialization with zero address reverts
    function test_revert_initializeZeroAddress() public {
        vm.startPrank(admin);
        
        vm.expectRevert(IExternalBridgeAdapter.ZeroAddress.selector);
        adapter.initialize(address(0), address(tokenSwitch));
        
        vm.expectRevert(IExternalBridgeAdapter.ZeroAddress.selector);
        adapter.initialize(address(governance), address(0));
        
        vm.stopPrank();
    }
    
    /// @notice Test getGovernanceMode returns correct mode
    function test_getGovernanceMode() public {
        _initializeAdapter();
        
        assertEq(
            uint256(adapter.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.CENTRALIZED)
        );
    }
    
    /// @notice Test getTokenMode returns correct mode
    function test_getTokenMode() public {
        _initializeAdapter();
        
        assertEq(
            uint256(adapter.getTokenMode()),
            uint256(ITokenSwitch.TokenMode.DISABLED)
        );
    }
    
    /// @notice Test getStakeCurrency returns ETH (address(0)) in DISABLED mode
    function test_getStakeCurrency_disabled() public {
        _initializeAdapter();
        
        assertEq(adapter.getStakeCurrency(), address(0));
    }
    
    /// @notice Test getMinimumStake returns $400K in DISABLED mode
    function test_getMinimumStake_disabled() public {
        _initializeAdapter();
        
        assertEq(adapter.getMinimumStake(), 400_000 * 1e18);
    }
    
    /// @notice Test getStakeCurrency returns QS token in BASIC mode
    function test_getStakeCurrency_basic() public {
        _initializeAdapter();
        
        // Transition to BASIC mode
        vm.prank(admin);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        
        assertEq(adapter.getStakeCurrency(), qsToken);
    }
    
    /// @notice Test getMinimumStake returns $500K in BASIC mode
    function test_getMinimumStake_basic() public {
        _initializeAdapter();
        
        // Transition to BASIC mode
        vm.prank(admin);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        
        assertEq(adapter.getMinimumStake(), 500_000 * 1e18);
    }
    
    // ============ TEST-002: Core ↔ Governance Interconnection ============
    
    /// @notice Test canExecuteCoreAction in CENTRALIZED mode - admin authorized
    function test_canExecuteCoreAction_centralized_admin() public {
        _initializeAdapter();
        
        assertTrue(adapter.canExecuteCoreAction(SELECTOR_LOCK, admin));
        assertTrue(adapter.canExecuteCoreAction(SELECTOR_UNLOCK, admin));
    }
    
    /// @notice Test canExecuteCoreAction in CENTRALIZED mode - non-admin not authorized
    function test_canExecuteCoreAction_centralized_nonAdmin() public {
        _initializeAdapter();
        
        assertFalse(adapter.canExecuteCoreAction(SELECTOR_LOCK, user1));
        assertFalse(adapter.canExecuteCoreAction(SELECTOR_UNLOCK, user1));
    }
    
    /// @notice Test canExecuteCoreAction in MULTISIG mode - signer authorized
    function test_canExecuteCoreAction_multisig_signer() public {
        _initializeAdapter();
        _configureMultisig();
        
        assertTrue(adapter.canExecuteCoreAction(SELECTOR_LOCK, signer1));
        assertTrue(adapter.canExecuteCoreAction(SELECTOR_UNLOCK, signer2));
    }
    
    /// @notice Test canExecuteCoreAction in MULTISIG mode - non-signer not authorized
    function test_canExecuteCoreAction_multisig_nonSigner() public {
        _initializeAdapter();
        _configureMultisig();
        
        assertFalse(adapter.canExecuteCoreAction(SELECTOR_LOCK, user1));
    }
    
    // ============ TEST-003: Core ↔ Token Interconnection ============
    
    /// @notice Test isTokenRequired for Prover Registration (Sequence #5)
    function test_isTokenRequired_proverRegistration() public {
        _initializeAdapter();
        
        // Prover registration requires token for stake
        assertTrue(adapter.isTokenRequired(SELECTOR_PROVER_REGISTRATION));
    }
    
    /// @notice Test isTokenRequired for basic operations
    function test_isTokenRequired_basicOperations() public {
        _initializeAdapter();
        
        // Lock/Unlock don't require token
        assertFalse(adapter.isTokenRequired(SELECTOR_LOCK));
        assertFalse(adapter.isTokenRequired(SELECTOR_UNLOCK));
    }
    
    // ============ TEST-004: Governance ↔ Token Interconnection ============
    
    /// @notice Test hasVotingPower returns false in non-DECENTRALIZED mode
    function test_hasVotingPower_nonDecentralized() public {
        _initializeAdapter();
        
        assertFalse(adapter.hasVotingPower(user1));
    }
    
    /// @notice Test Governance Proposal requires DECENTRALIZED + Token (BASIC/FULL)
    function test_governanceProposal_requires_decentralized_and_token() public {
        _initializeAdapter();
        
        // In CENTRALIZED mode, governance proposal should not be authorized for anyone
        assertFalse(adapter.canExecuteCoreAction(SELECTOR_GOVERNANCE_PROPOSAL, admin));
    }
    
    // ============ TEST-005: All Valid Mode Combinations ============
    
    /// @notice Test combination 1: CENTRALIZED + DISABLED (Phase 1)
    function test_modeCombo_centralized_disabled() public {
        _initializeAdapter();
        
        assertTrue(adapter.validateLayerCompatibility());
        assertEq(
            uint256(adapter.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.CENTRALIZED)
        );
        assertEq(
            uint256(adapter.getTokenMode()),
            uint256(ITokenSwitch.TokenMode.DISABLED)
        );
    }
    
    /// @notice Test combination 2: CENTRALIZED + BASIC
    function test_modeCombo_centralized_basic() public {
        _initializeAdapter();
        
        vm.prank(admin);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        
        assertTrue(adapter.validateLayerCompatibility());
    }
    
    /// @notice Test combination 4: MULTISIG + DISABLED (Transfer minimal)
    function test_modeCombo_multisig_disabled() public {
        _initializeAdapter();
        _configureMultisig();
        
        assertTrue(adapter.validateLayerCompatibility());
        assertEq(
            uint256(adapter.getGovernanceMode()),
            uint256(IGovernanceSwitch.GovernanceMode.MULTISIG)
        );
    }
    
    /// @notice Test combination 5: MULTISIG + BASIC (Phase 2)
    function test_modeCombo_multisig_basic() public {
        _initializeAdapter();
        _configureMultisig();
        
        vm.prank(admin);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        
        assertTrue(adapter.validateLayerCompatibility());
    }
    
    // ============ TEST-006: Prohibited Mode Combinations ============
    
    /// @notice Test combination 7: DECENTRALIZED + DISABLED is prohibited
    /// @dev This is the key test - veQS voting not possible without token
    function test_revert_modeCombo_decentralized_disabled() public {
        // Deploy fresh adapter for this specific test
        ExternalBridgeAdapter testAdapter = new ExternalBridgeAdapter(admin);
        
        // Create mock governance that returns DECENTRALIZED
        MockDecentralizedGovernance mockGov = new MockDecentralizedGovernance();
        
        // Create mock token that returns DISABLED
        MockDisabledToken mockToken = new MockDisabledToken();
        
        vm.prank(admin);
        testAdapter.initialize(address(mockGov), address(mockToken));
        
        // Validation should fail
        assertFalse(testAdapter.validateLayerCompatibility());
    }
    
    /// @notice Test that DECENTRALIZED + BASIC is allowed
    function test_modeCombo_decentralized_basic_allowed() public {
        // Create mock governance that returns DECENTRALIZED
        MockDecentralizedGovernance mockGov = new MockDecentralizedGovernance();
        
        // Create mock token that returns BASIC
        MockBasicToken mockToken = new MockBasicToken();
        
        ExternalBridgeAdapter testAdapter = new ExternalBridgeAdapter(admin);
        
        vm.prank(admin);
        testAdapter.initialize(address(mockGov), address(mockToken));
        
        // Validation should pass
        assertTrue(testAdapter.validateLayerCompatibility());
    }
    
    /// @notice Test that DECENTRALIZED + FULL is allowed
    function test_modeCombo_decentralized_full_allowed() public {
        // Create mock governance that returns DECENTRALIZED
        MockDecentralizedGovernance mockGov = new MockDecentralizedGovernance();
        
        // Create mock token that returns FULL
        MockFullToken mockToken = new MockFullToken();
        
        ExternalBridgeAdapter testAdapter = new ExternalBridgeAdapter(admin);
        
        vm.prank(admin);
        testAdapter.initialize(address(mockGov), address(mockToken));
        
        // Validation should pass
        assertTrue(testAdapter.validateLayerCompatibility());
    }
    
    // ============ Layer Reference Update Tests ============
    
    /// @notice Test updateLayerReferences by admin
    function test_updateLayerReferences_admin() public {
        _initializeAdapter();
        
        GovernanceSwitch newGov = new GovernanceSwitch(admin);
        TokenSwitch newToken = new TokenSwitch(admin);
        
        vm.prank(admin);
        adapter.updateLayerReferences(address(newGov), address(newToken));
        
        assertEq(adapter.getGovernanceSwitchAddress(), address(newGov));
        assertEq(adapter.getTokenSwitchAddress(), address(newToken));
    }
    
    /// @notice Test updateLayerReferences by unauthorized user reverts
    function test_revert_updateLayerReferences_unauthorized() public {
        _initializeAdapter();
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(
            IExternalBridgeAdapter.UnauthorizedCaller.selector,
            user1,
            bytes4(0)
        ));
        adapter.updateLayerReferences(address(governance), address(tokenSwitch));
    }
    
    // ============ Helper Functions ============
    
    function _initializeAdapter() internal {
        vm.prank(admin);
        adapter.initialize(address(governance), address(tokenSwitch));
    }
    
    function _configureMultisig() internal {
        address[] memory signers = new address[](3);
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;
        
        vm.prank(admin);
        governance.configureMultisig(signers, 2);
        
        vm.prank(admin);
        governance.setGovernanceMode(IGovernanceSwitch.GovernanceMode.MULTISIG);
    }
}

// ============ Mock Contracts for Testing ============

/// @notice Mock GovernanceSwitch that returns DECENTRALIZED mode
contract MockDecentralizedGovernance is IGovernanceSwitch {
    function getGovernanceMode() external pure override returns (GovernanceMode) {
        return GovernanceMode.DECENTRALIZED;
    }
    
    function getApprover(bytes4) external pure override returns (address) {
        return address(0);
    }
    
    function canApprove(bytes4, address) external pure override returns (bool) {
        return false;
    }
    
    function getAdmin() external pure override returns (address) {
        return address(0);
    }
    
    function getMultisigConfig() external pure override returns (uint256, uint256) {
        return (0, 0);
    }
    
    function getSecurityCouncilConfig() external pure override returns (uint256, uint256) {
        return (5, 9); // SC 5/9
    }
    
    function setGovernanceMode(GovernanceMode) external override {}
    
    function approveAction(bytes4, bytes calldata) external override {}
}

/// @notice Mock TokenSwitch that returns DISABLED mode
contract MockDisabledToken is ITokenSwitch {
    function getTokenMode() external pure override returns (TokenMode) {
        return TokenMode.DISABLED;
    }
    
    function getTokenAddress() external pure override returns (address) {
        return address(0);
    }
    
    function getFeeToken() external pure override returns (address) {
        return address(0);
    }
    
    function getStakeCurrency() external pure override returns (address) {
        return address(0);
    }
    
    function getMinimumStake() external pure override returns (uint256) {
        return 400_000 * 1e18;
    }
    
    function isVeQSEnabled() external pure override returns (bool) {
        return false;
    }
    
    function isStakingEnabled() external pure override returns (bool) {
        return false;
    }
    
    function setTokenMode(TokenMode) external override {}
    
    function setTokenAddress(address) external override {}
}

/// @notice Mock TokenSwitch that returns BASIC mode
contract MockBasicToken is ITokenSwitch {
    function getTokenMode() external pure override returns (TokenMode) {
        return TokenMode.BASIC;
    }
    
    function getTokenAddress() external pure override returns (address) {
        return address(0x100);
    }
    
    function getFeeToken() external pure override returns (address) {
        return address(0x100);
    }
    
    function getStakeCurrency() external pure override returns (address) {
        return address(0x100);
    }
    
    function getMinimumStake() external pure override returns (uint256) {
        return 500_000 * 1e18;
    }
    
    function isVeQSEnabled() external pure override returns (bool) {
        return false;
    }
    
    function isStakingEnabled() external pure override returns (bool) {
        return false;
    }
    
    function setTokenMode(TokenMode) external override {}
    
    function setTokenAddress(address) external override {}
}

/// @notice Mock TokenSwitch that returns FULL mode
contract MockFullToken is ITokenSwitch {
    function getTokenMode() external pure override returns (TokenMode) {
        return TokenMode.FULL;
    }
    
    function getTokenAddress() external pure override returns (address) {
        return address(0x100);
    }
    
    function getFeeToken() external pure override returns (address) {
        return address(0x100);
    }
    
    function getStakeCurrency() external pure override returns (address) {
        return address(0x100);
    }
    
    function getMinimumStake() external pure override returns (uint256) {
        return 500_000 * 1e18;
    }
    
    function isVeQSEnabled() external pure override returns (bool) {
        return true;
    }
    
    function isStakingEnabled() external pure override returns (bool) {
        return true;
    }
    
    function setTokenMode(TokenMode) external override {}
    
    function setTokenAddress(address) external override {}
}
