// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {TokenSwitch} from "../../src/token/TokenSwitch.sol";
import {ITokenSwitch} from "../../src/interfaces/ITokenSwitch.sol";
import {IGovernanceSwitch} from "../../src/interfaces/IGovernanceSwitch.sol";
import {GovernanceSwitch} from "../../src/governance/GovernanceSwitch.sol";

/// @title TokenSwitchTest
/// @notice Comprehensive test suite for TokenSwitch
/// @dev Tests per CURRENT_PLAN.md TEST-001~009
contract TokenSwitchTest is Test {
    // ============ State Variables ============
    
    TokenSwitch public tokenSwitch;
    GovernanceSwitch public governanceSwitch;
    
    address public admin = address(0x1);
    address public user = address(0x2);
    address public qsToken = address(0x3);
    
    address[] public signers;
    
    // ============ Events (for expectEmit) ============
    
    event TokenModeChanged(
        ITokenSwitch.TokenMode indexed oldMode,
        ITokenSwitch.TokenMode indexed newMode,
        address indexed changedBy
    );
    
    event UpgradeInitiated(
        ITokenSwitch.TokenMode indexed targetMode,
        address indexed initiator,
        uint256 unlockTime
    );
    
    event UpgradeCancelled(
        ITokenSwitch.TokenMode indexed targetMode,
        address indexed cancelledBy
    );
    
    event TokenAddressSet(address indexed tokenAddress);
    event GovernanceSwitchSet(address indexed governanceSwitch);
    
    // ============ Setup ============
    
    function setUp() public {
        vm.startPrank(admin);
        tokenSwitch = new TokenSwitch(admin);
        governanceSwitch = new GovernanceSwitch(admin);
        vm.stopPrank();
        
        // Setup signers for multisig tests
        signers = new address[](3);
        signers[0] = address(0x10);
        signers[1] = address(0x11);
        signers[2] = address(0x12);
    }
    
    // ============ TEST-001: Mode Get/Set Tests ============
    
    function test_InitialModeIsDisabled() public view {
        assertEq(uint256(tokenSwitch.getTokenMode()), uint256(ITokenSwitch.TokenMode.DISABLED));
    }
    
    function test_GetAdmin() public view {
        assertEq(tokenSwitch.getAdmin(), admin);
    }
    
    function test_SetTokenMode_DisabledToBasic_Success() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        
        vm.expectEmit(true, true, true, true);
        emit TokenModeChanged(
            ITokenSwitch.TokenMode.DISABLED,
            ITokenSwitch.TokenMode.BASIC,
            admin
        );
        
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
        
        assertEq(uint256(tokenSwitch.getTokenMode()), uint256(ITokenSwitch.TokenMode.BASIC));
    }
    
    function test_SetTokenMode_RequiresTokenAddress() public {
        vm.startPrank(admin);
        
        vm.expectRevert(TokenSwitch.TokenAddressRequired.selector);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
    }
    
    function test_SetTokenMode_SameModeReverts() public {
        vm.startPrank(admin);
        
        vm.expectRevert(
            abi.encodeWithSelector(
                ITokenSwitch.InvalidModeTransition.selector,
                ITokenSwitch.TokenMode.DISABLED,
                ITokenSwitch.TokenMode.DISABLED
            )
        );
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.DISABLED);
        vm.stopPrank();
    }
    
    // ============ TEST-002: DISABLED Mode Tests ============
    
    function test_DisabledMode_TokenAddressIsZero() public view {
        assertEq(tokenSwitch.getTokenAddress(), address(0));
    }
    
    function test_DisabledMode_FeeTokenIsZero() public view {
        assertEq(tokenSwitch.getFeeToken(), address(0));
    }
    
    function test_DisabledMode_StakeCurrencyIsZero() public view {
        assertEq(tokenSwitch.getStakeCurrency(), address(0));
    }
    
    function test_DisabledMode_MinimumStakeIs400K() public view {
        assertEq(tokenSwitch.getMinimumStake(), 400_000 * 1e18);
    }
    
    function test_DisabledMode_VeQSDisabled() public view {
        assertFalse(tokenSwitch.isVeQSEnabled());
    }
    
    function test_DisabledMode_StakingDisabled() public view {
        assertFalse(tokenSwitch.isStakingEnabled());
    }
    
    // ============ TEST-003: BASIC Mode Tests (Stub) ============
    
    function test_BasicMode_TokenAddressIsQS() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
        
        assertEq(tokenSwitch.getTokenAddress(), qsToken);
    }
    
    function test_BasicMode_FeeTokenIsQS() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
        
        assertEq(tokenSwitch.getFeeToken(), qsToken);
    }
    
    function test_BasicMode_StakeCurrencyIsQS() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
        
        assertEq(tokenSwitch.getStakeCurrency(), qsToken);
    }
    
    function test_BasicMode_MinimumStakeIs500K() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
        
        assertEq(tokenSwitch.getMinimumStake(), 500_000 * 1e18);
    }
    
    function test_BasicMode_VeQSDisabled() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
        
        assertFalse(tokenSwitch.isVeQSEnabled());
    }
    
    function test_BasicMode_StakingDisabled() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
        
        assertFalse(tokenSwitch.isStakingEnabled());
    }
    
    // ============ TEST-004: FULL Mode Tests (Stub) ============
    
    function test_FullMode_VeQSEnabled() public {
        _setupFullMode();
        assertTrue(tokenSwitch.isVeQSEnabled());
    }
    
    function test_FullMode_StakingEnabled() public {
        _setupFullMode();
        assertTrue(tokenSwitch.isStakingEnabled());
    }
    
    function test_FullMode_MinimumStakeIs500K() public {
        _setupFullMode();
        assertEq(tokenSwitch.getMinimumStake(), 500_000 * 1e18);
    }
    
    // ============ TEST-005: Mode Transition Tests ============
    
    function test_Transition_DisabledToBasic_Instant() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        
        // Should be instant (no pending upgrade)
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        
        assertEq(uint256(tokenSwitch.getTokenMode()), uint256(ITokenSwitch.TokenMode.BASIC));
        assertFalse(tokenSwitch.hasPendingUpgrade());
        vm.stopPrank();
    }
    
    function test_Transition_BasicToFull_RequiresTimeLock() public {
        // Setup BASIC mode first
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        
        // Initiate upgrade to FULL
        vm.expectEmit(true, true, false, true);
        emit UpgradeInitiated(
            ITokenSwitch.TokenMode.FULL,
            admin,
            block.timestamp + 7 days
        );
        
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.FULL);
        vm.stopPrank();
        
        // Mode should still be BASIC
        assertEq(uint256(tokenSwitch.getTokenMode()), uint256(ITokenSwitch.TokenMode.BASIC));
        assertTrue(tokenSwitch.hasPendingUpgrade());
        assertEq(uint256(tokenSwitch.getPendingUpgrade()), uint256(ITokenSwitch.TokenMode.FULL));
    }
    
    function test_Transition_FinalizeUpgrade_AfterTimeLock() public {
        // Setup and initiate upgrade
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.FULL);
        
        // Fast forward past time lock
        vm.warp(block.timestamp + 7 days + 1);
        
        // Finalize upgrade
        vm.expectEmit(true, true, true, true);
        emit TokenModeChanged(
            ITokenSwitch.TokenMode.BASIC,
            ITokenSwitch.TokenMode.FULL,
            admin
        );
        
        tokenSwitch.finalizeUpgrade();
        vm.stopPrank();
        
        assertEq(uint256(tokenSwitch.getTokenMode()), uint256(ITokenSwitch.TokenMode.FULL));
        assertFalse(tokenSwitch.hasPendingUpgrade());
    }
    
    function test_Transition_FullToBasic_RequiresDowngradeTimeLock() public {
        _setupFullMode();
        
        vm.startPrank(admin);
        
        // Initiate downgrade - should require 30 days
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        
        assertTrue(tokenSwitch.hasPendingUpgrade());
        assertEq(tokenSwitch.getTimeLockExpiry(), block.timestamp + 30 days);
        vm.stopPrank();
    }
    
    function test_Transition_FullToDisabled_RequiresDowngradeTimeLock() public {
        _setupFullMode();
        
        vm.startPrank(admin);
        
        // Initiate downgrade to DISABLED - should require 30 days
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.DISABLED);
        
        assertTrue(tokenSwitch.hasPendingUpgrade());
        assertEq(tokenSwitch.getTimeLockExpiry(), block.timestamp + 30 days);
        vm.stopPrank();
    }
    
    // ============ TEST-006: Time Lock Tests ============
    
    function test_TimeLock_CannotFinalizeEarly() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.FULL);
        
        // Try to finalize before time lock
        vm.warp(block.timestamp + 6 days);
        
        vm.expectRevert(TokenSwitch.TimeLockNotExpired.selector);
        tokenSwitch.finalizeUpgrade();
        vm.stopPrank();
    }
    
    function test_TimeLock_IsActive() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.FULL);
        vm.stopPrank();
        
        assertTrue(tokenSwitch.isTimeLockActive());
        
        // After time passes
        vm.warp(block.timestamp + 7 days + 1);
        assertFalse(tokenSwitch.isTimeLockActive());
    }
    
    function test_TimeLock_CancelUpgrade() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.FULL);
        
        assertTrue(tokenSwitch.hasPendingUpgrade());
        
        vm.expectEmit(true, true, false, true);
        emit UpgradeCancelled(ITokenSwitch.TokenMode.FULL, admin);
        
        tokenSwitch.cancelUpgrade();
        vm.stopPrank();
        
        assertFalse(tokenSwitch.hasPendingUpgrade());
        assertEq(uint256(tokenSwitch.getTokenMode()), uint256(ITokenSwitch.TokenMode.BASIC));
    }
    
    function test_TimeLock_NoPendingUpgradeRevert() public {
        vm.startPrank(admin);
        
        vm.expectRevert(TokenSwitch.NoPendingUpgrade.selector);
        tokenSwitch.finalizeUpgrade();
        
        vm.expectRevert(TokenSwitch.NoPendingUpgrade.selector);
        tokenSwitch.cancelUpgrade();
        vm.stopPrank();
    }
    
    function test_TimeLock_UpgradeConstant() public view {
        assertEq(tokenSwitch.UPGRADE_TIMELOCK(), 7 days);
    }
    
    function test_TimeLock_DowngradeConstant() public view {
        assertEq(tokenSwitch.DOWNGRADE_TIMELOCK(), 30 days);
    }
    
    // ============ TEST-007: Authorization Tests ============
    
    function test_Auth_NonAdminCannotSetMode() public {
        vm.startPrank(user);
        
        vm.expectRevert(ITokenSwitch.Unauthorized.selector);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
    }
    
    function test_Auth_NonAdminCannotSetTokenAddress() public {
        vm.startPrank(user);
        
        vm.expectRevert("Only admin");
        tokenSwitch.setTokenAddress(qsToken);
        vm.stopPrank();
    }
    
    function test_Auth_NonAdminCannotSetGovernanceSwitch() public {
        vm.startPrank(user);
        
        vm.expectRevert("Only admin");
        tokenSwitch.setGovernanceSwitch(address(governanceSwitch));
        vm.stopPrank();
    }
    
    function test_Auth_GovernanceSwitchIntegration() public {
        vm.startPrank(admin);
        tokenSwitch.setGovernanceSwitch(address(governanceSwitch));
        tokenSwitch.setTokenAddress(qsToken);
        vm.stopPrank();
        
        assertEq(tokenSwitch.getGovernanceSwitch(), address(governanceSwitch));
        
        // Admin should still be able to set mode
        vm.prank(admin);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        
        assertEq(uint256(tokenSwitch.getTokenMode()), uint256(ITokenSwitch.TokenMode.BASIC));
    }
    
    function test_Auth_SetGovernanceSwitchEmitsEvent() public {
        vm.startPrank(admin);
        
        vm.expectEmit(true, false, false, true);
        emit GovernanceSwitchSet(address(governanceSwitch));
        
        tokenSwitch.setGovernanceSwitch(address(governanceSwitch));
        vm.stopPrank();
    }
    
    function test_Auth_InvalidGovernanceSwitchReverts() public {
        vm.startPrank(admin);
        
        vm.expectRevert("Invalid governance switch");
        tokenSwitch.setGovernanceSwitch(address(0));
        vm.stopPrank();
    }
    
    // ============ TEST-008: Fuzz Tests ============
    
    function testFuzz_SetTokenMode_RandomAddress(address caller) public {
        vm.assume(caller != admin);
        vm.assume(caller != address(0));
        
        vm.startPrank(caller);
        
        vm.expectRevert(ITokenSwitch.Unauthorized.selector);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        vm.stopPrank();
    }
    
    function testFuzz_MinimumStake_Invariant(uint8 modeIndex) public {
        vm.assume(modeIndex <= 2);
        
        ITokenSwitch.TokenMode mode = ITokenSwitch.TokenMode(modeIndex);
        
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        
        if (mode == ITokenSwitch.TokenMode.DISABLED) {
            // Already in DISABLED mode
            assertEq(tokenSwitch.getMinimumStake(), 400_000 * 1e18);
        } else if (mode == ITokenSwitch.TokenMode.BASIC) {
            tokenSwitch.setTokenMode(mode);
            assertEq(tokenSwitch.getMinimumStake(), 500_000 * 1e18);
        } else if (mode == ITokenSwitch.TokenMode.FULL) {
            tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
            tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.FULL);
            vm.warp(block.timestamp + 7 days + 1);
            tokenSwitch.finalizeUpgrade();
            assertEq(tokenSwitch.getMinimumStake(), 500_000 * 1e18);
        }
        vm.stopPrank();
    }
    
    // ============ TEST-009: Gas Benchmarks ============
    
    function test_Gas_GetTokenMode() public view {
        uint256 gasBefore = gasleft();
        tokenSwitch.getTokenMode();
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("getTokenMode gas:", gasUsed);
        assertLt(gasUsed, 5000, "getTokenMode should be cheap");
    }
    
    function test_Gas_GetMinimumStake() public view {
        uint256 gasBefore = gasleft();
        tokenSwitch.getMinimumStake();
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("getMinimumStake gas:", gasUsed);
        assertLt(gasUsed, 5000, "getMinimumStake should be cheap");
    }
    
    function test_Gas_SetTokenMode() public {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        
        uint256 gasBefore = gasleft();
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("setTokenMode gas:", gasUsed);
        assertLt(gasUsed, 100000, "setTokenMode should be reasonable");
        vm.stopPrank();
    }
    
    // ============ Helper Functions ============
    
    function _setupFullMode() internal {
        vm.startPrank(admin);
        tokenSwitch.setTokenAddress(qsToken);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.BASIC);
        tokenSwitch.setTokenMode(ITokenSwitch.TokenMode.FULL);
        vm.warp(block.timestamp + 7 days + 1);
        tokenSwitch.finalizeUpgrade();
        vm.stopPrank();
    }
}
