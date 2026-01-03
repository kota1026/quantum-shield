// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/economics/EconomicParameters.sol";
import "../../src/interfaces/IEconomicParameters.sol";
import "../../src/interfaces/IGovernanceSwitch.sol";

/// @title EconomicParameters Test Suite
/// @notice Tests for DECEN-019: Economic Parameters
/// @dev TDD approach - tests written before implementation
contract EconomicParametersTest is Test {
    EconomicParameters public params;
    
    address public admin = address(0x1);
    address public governance = address(0x2);
    address public mockGovernanceSwitch = address(0x100);
    
    // Constants from UNIFIED_SPEC and CORE_PRINCIPLES
    uint256 constant INITIAL_FEE_RATE = 5;                    // 0.05%
    uint256 constant INITIAL_MIN_FEE = 10 * 1e18;             // $10
    uint256 constant INITIAL_MIN_STAKE = 500_000 * 1e18;      // $500K
    uint256 constant INITIAL_UNBONDING = 7 days;              // 7 days
    uint256 constant INITIAL_VOTING_CAP = 500;                // 5%
    uint256 constant BASIS_POINTS = 10000;
    
    // CP-3 Protected (cannot be reduced)
    uint256 constant NORMAL_TIME_LOCK = 24 hours;
    uint256 constant EMERGENCY_TIME_LOCK = 7 days;
    
    // CP-4 Protected (IMMUTABLE)
    uint256 constant SLASHING_RATE_BASE = 1000;               // 10%
    
    event FeeRateUpdated(uint256 oldRate, uint256 newRate, uint256 timestamp);
    event MinimumFeeUpdated(uint256 oldFee, uint256 newFee, uint256 timestamp);
    event MinimumStakeUpdated(uint256 oldStake, uint256 newStake, uint256 timestamp);
    event UnbondingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod, uint256 timestamp);
    event VotingPowerCapUpdated(uint256 oldCap, uint256 newCap, uint256 timestamp);
    
    function setUp() public {
        // Mock governance switch to return CENTRALIZED mode (admin has control)
        vm.mockCall(
            mockGovernanceSwitch,
            abi.encodeWithSignature("getCurrentMode()"),
            abi.encode(IGovernanceSwitch.GovernanceMode.CENTRALIZED)
        );
        
        vm.startPrank(admin);
        params = new EconomicParameters(mockGovernanceSwitch);
        vm.stopPrank();
    }
    
    // Helper to setup governance authorization
    function _setupGovernanceAuth() internal {
        // In CENTRALIZED mode, admin is authorized
        // Switch to allow governance address as well
        vm.mockCall(
            mockGovernanceSwitch,
            abi.encodeWithSignature("getCurrentMode()"),
            abi.encode(IGovernanceSwitch.GovernanceMode.DECENTRALIZED)
        );
        vm.mockCall(
            mockGovernanceSwitch,
            abi.encodeWithSignature("isGovernanceExecutor(address)", governance),
            abi.encode(true)
        );
    }
    
    // ========== TEST-ECON-001: Parameter change with Token Vote ==========
    
    function test_InitialFeeRateIs5BasisPoints() public view {
        assertEq(params.feeRate(), INITIAL_FEE_RATE, "Initial fee rate should be 5 bp");
    }
    
    function test_InitialMinimumFeeIs10Dollars() public view {
        assertEq(params.minimumFee(), INITIAL_MIN_FEE, "Initial min fee should be $10");
    }
    
    function test_InitialMinimumStakeIs500K() public view {
        assertEq(params.minimumStake(), INITIAL_MIN_STAKE, "Initial min stake should be $500K");
    }
    
    function test_SetFeeRate_RequiresGovernance() public {
        vm.prank(address(0x999));
        vm.expectRevert(IEconomicParameters.NotAuthorized.selector);
        params.setFeeRate(10);
    }
    
    function test_SetFeeRate_EmitsEvent() public {
        _setupGovernanceAuth();
        vm.prank(governance);
        
        vm.expectEmit(true, true, true, true);
        emit FeeRateUpdated(INITIAL_FEE_RATE, 10, block.timestamp);
        
        params.setFeeRate(10);
    }
    
    function test_SetMinimumFee_EmitsEvent() public {
        _setupGovernanceAuth();
        uint256 newFee = 20 * 1e18;
        vm.prank(governance);
        
        vm.expectEmit(true, true, true, true);
        emit MinimumFeeUpdated(INITIAL_MIN_FEE, newFee, block.timestamp);
        
        params.setMinimumFee(newFee);
    }
    
    function test_SetMinimumStake_EmitsEvent() public {
        _setupGovernanceAuth();
        uint256 newStake = 1_000_000 * 1e18;
        vm.prank(governance);
        
        vm.expectEmit(true, true, true, true);
        emit MinimumStakeUpdated(INITIAL_MIN_STAKE, newStake, block.timestamp);
        
        params.setMinimumStake(newStake);
    }
    
    // ========== TEST-ECON-002: Voting power cap enforcement ==========
    
    function test_InitialVotingPowerCapIs5Percent() public view {
        assertEq(params.votingPowerCap(), INITIAL_VOTING_CAP, "Initial voting cap should be 5%");
    }
    
    function test_SetVotingPowerCap() public {
        _setupGovernanceAuth();
        uint256 newCap = 300; // 3%
        vm.prank(governance);
        params.setVotingPowerCap(newCap);
        
        assertEq(params.votingPowerCap(), newCap);
    }
    
    function test_VotingPowerCap_CannotExceed100Percent() public {
        _setupGovernanceAuth();
        vm.prank(governance);
        vm.expectRevert(IEconomicParameters.InvalidVotingPowerCap.selector);
        params.setVotingPowerCap(10001); // >100%
    }
    
    function test_ApplyVotingPowerCap() public view {
        uint256 userVotes = 100 * 1e18;
        uint256 totalVotes = 1000 * 1e18;
        
        // 10% of votes, but cap is 5%
        uint256 capped = params.applyVotingPowerCap(userVotes, totalVotes);
        uint256 expected = (totalVotes * INITIAL_VOTING_CAP) / BASIS_POINTS;
        
        assertEq(capped, expected, "Should cap at 5%");
    }
    
    function test_ApplyVotingPowerCap_UnderCap() public view {
        uint256 userVotes = 10 * 1e18;
        uint256 totalVotes = 1000 * 1e18;
        
        // 1% of votes, under 5% cap
        uint256 capped = params.applyVotingPowerCap(userVotes, totalVotes);
        
        assertEq(capped, userVotes, "Should not cap if under limit");
    }
    
    // ========== TEST-ECON-003: Unbonding period (extension only, CP-3) ==========
    
    function test_InitialUnbondingPeriodIs7Days() public view {
        assertEq(params.unbondingPeriod(), INITIAL_UNBONDING, "Initial unbonding should be 7 days");
    }
    
    function test_SetUnbondingPeriod_CanExtend() public {
        _setupGovernanceAuth();
        uint256 newPeriod = 14 days;
        vm.prank(governance);
        params.setUnbondingPeriod(newPeriod);
        
        assertEq(params.unbondingPeriod(), newPeriod, "Unbonding period should be extended");
    }
    
    function test_SetUnbondingPeriod_CannotReduce() public {
        _setupGovernanceAuth();
        // First extend
        vm.prank(governance);
        params.setUnbondingPeriod(14 days);
        
        // Try to reduce - should fail (CP-3 protection)
        vm.prank(governance);
        vm.expectRevert(IEconomicParameters.CannotReduceUnbondingPeriod.selector);
        params.setUnbondingPeriod(7 days);
    }
    
    function test_SetUnbondingPeriod_CannotReduceBelowInitial() public {
        _setupGovernanceAuth();
        // Try to reduce below initial - should fail (CP-3 protection)
        vm.prank(governance);
        vm.expectRevert(IEconomicParameters.CannotReduceUnbondingPeriod.selector);
        params.setUnbondingPeriod(3 days);
    }
    
    function test_NormalTimeLock_IsImmutable() public view {
        // CP-3: 24 hours cannot be reduced
        assertEq(params.NORMAL_TIME_LOCK(), NORMAL_TIME_LOCK, "Normal time lock should be 24h");
    }
    
    function test_EmergencyTimeLock_IsImmutable() public view {
        // CP-3: 7 days cannot be reduced
        assertEq(params.EMERGENCY_TIME_LOCK(), EMERGENCY_TIME_LOCK, "Emergency time lock should be 7 days");
    }
    
    // ========== TEST-ECON-004: CP-4 slashing rate immutability ==========
    
    function test_SlashingRateBase_IsImmutable() public view {
        // CP-4: 10% slashing rate is IMMUTABLE
        assertEq(params.SLASHING_RATE_BASE(), SLASHING_RATE_BASE, "Slashing base should be 10%");
    }
    
    function test_CalculateSlashing_SingleViolation() public view {
        uint256 baseAmount = 100 * 1e18;
        uint256 violationCount = 1;
        
        // N^2 * 10% = 1 * 10% = 10%
        uint256 expected = (baseAmount * SLASHING_RATE_BASE) / BASIS_POINTS;
        uint256 actual = params.calculateSlashing(baseAmount, violationCount);
        
        assertEq(actual, expected, "Single violation should slash 10%");
    }
    
    function test_CalculateSlashing_QuadraticScaling() public view {
        uint256 baseAmount = 100 * 1e18;
        
        // N=2: 4 * 10% = 40%
        uint256 slash2 = params.calculateSlashing(baseAmount, 2);
        assertEq(slash2, (baseAmount * 4 * SLASHING_RATE_BASE) / BASIS_POINTS, "2 violations = 40%");
        
        // N=3: 9 * 10% = 90%
        uint256 slash3 = params.calculateSlashing(baseAmount, 3);
        assertEq(slash3, (baseAmount * 9 * SLASHING_RATE_BASE) / BASIS_POINTS, "3 violations = 90%");
    }
    
    function test_CalculateSlashing_CappedAt100Percent() public view {
        uint256 baseAmount = 100 * 1e18;
        
        // N=4: 16 * 10% = 160% -> capped at 100%
        uint256 slash4 = params.calculateSlashing(baseAmount, 4);
        assertEq(slash4, baseAmount, "Should cap at 100%");
        
        // N=10: 100 * 10% = 1000% -> capped at 100%
        uint256 slash10 = params.calculateSlashing(baseAmount, 10);
        assertEq(slash10, baseAmount, "Should cap at 100%");
    }
    
    function test_CalculateSlashing_ZeroViolations() public view {
        uint256 baseAmount = 100 * 1e18;
        uint256 slash0 = params.calculateSlashing(baseAmount, 0);
        
        assertEq(slash0, 0, "Zero violations = zero slashing");
    }
    
    // ========== Fee Calculation Tests ==========
    
    function test_CalculateFee_RateBased() public view {
        uint256 amount = 1_000_000 * 1e18; // $1M
        uint256 fee = params.calculateFee(amount);
        
        // 0.05% of $1M = $500
        uint256 expected = (amount * INITIAL_FEE_RATE) / BASIS_POINTS;
        assertEq(fee, expected, "Fee should be rate-based for large amounts");
    }
    
    function test_CalculateFee_MinimumFee() public view {
        uint256 amount = 100 * 1e18; // $100
        uint256 fee = params.calculateFee(amount);
        
        // 0.05% of $100 = $0.05, but min is $10
        assertEq(fee, INITIAL_MIN_FEE, "Fee should be minimum for small amounts");
    }
    
    function test_CalculateFee_ExactlyMinimum() public view {
        // Find amount where rate equals minimum
        // rate * amount / 10000 = min
        // amount = min * 10000 / rate = $10 * 10000 / 5 = $20,000
        uint256 amount = 20_000 * 1e18;
        uint256 fee = params.calculateFee(amount);
        
        assertEq(fee, INITIAL_MIN_FEE, "Fee at threshold should equal minimum");
    }
    
    // ========== Getter Functions ==========
    
    function test_GetAllParameters() public view {
        IEconomicParameters.ParameterSet memory p = params.getAllParameters();
        
        assertEq(p.feeRate, INITIAL_FEE_RATE);
        assertEq(p.minimumFee, INITIAL_MIN_FEE);
        assertEq(p.minimumStake, INITIAL_MIN_STAKE);
        assertEq(p.unbondingPeriod, INITIAL_UNBONDING);
        assertEq(p.votingPowerCap, INITIAL_VOTING_CAP);
        assertEq(p.normalTimeLock, NORMAL_TIME_LOCK);
        assertEq(p.emergencyTimeLock, EMERGENCY_TIME_LOCK);
        assertEq(p.slashingRateBase, SLASHING_RATE_BASE);
    }
    
    function test_IsValidStake() public view {
        assertFalse(params.isValidStake(100 * 1e18), "$100 is below minimum");
        assertTrue(params.isValidStake(INITIAL_MIN_STAKE), "$500K equals minimum");
        assertTrue(params.isValidStake(1_000_000 * 1e18), "$1M is above minimum");
    }
}
