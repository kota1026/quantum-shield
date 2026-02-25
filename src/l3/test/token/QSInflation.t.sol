// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/token/QSInflation.sol";
import "../../src/interfaces/IQSInflation.sol";

/// @title QSInflation Test Suite
/// @notice Tests for DECEN-016: Inflation Mechanism
/// @dev TDD approach - tests written before implementation
contract QSInflationTest is Test {
    QSInflation public inflation;
    
    address public admin = address(0x1);
    address public distributor = address(0x2);
    address public mockToken = address(0x3);
    
    // Constants from spec
    uint256 constant YEAR = 365 days;
    uint256 constant BASIS_POINTS = 10000;
    
    // Expected rates per UNIFIED_SPEC
    uint256 constant YEAR1_RATE = 500;  // 5.00%
    uint256 constant YEAR2_RATE = 375;  // 3.75%
    uint256 constant YEAR3_RATE = 250;  // 2.50%
    uint256 constant YEAR4_RATE = 100;  // 1.00%
    
    // Mock total supply
    uint256 constant MOCK_TOTAL_SUPPLY = 1_000_000_000 * 1e18;
    
    event InflationMinted(uint256 indexed epochId, uint256 amount, uint256 totalSupply, uint256 timestamp);
    event InflationRateTransitioned(uint256 oldRate, uint256 newRate, uint256 timestamp);
    
    function setUp() public {
        // Mock token totalSupply and mint
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("totalSupply()"),
            abi.encode(MOCK_TOTAL_SUPPLY)
        );
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("mint(address,uint256)"),
            abi.encode(true)
        );
        
        vm.startPrank(admin);
        inflation = new QSInflation(mockToken, distributor);
        vm.stopPrank();
    }
    
    // ========== TEST-INF-001: Inflation rate calculation (year 1-4+) ==========
    
    function test_InitialInflationRateIs5Percent() public view {
        assertEq(inflation.getCurrentInflationRate(), YEAR1_RATE, "Year 1 should be 5%");
    }
    
    function test_Year2InflationRateIs3_75Percent() public {
        vm.warp(block.timestamp + YEAR);
        uint256 rate = inflation.getCurrentInflationRate();
        // Year 2 rate should be 3.75% (375 basis points)
        assertEq(rate, YEAR2_RATE, "Year 2 should be 3.75%");
    }
    
    function test_Year3InflationRateIs2_5Percent() public {
        vm.warp(block.timestamp + 2 * YEAR);
        uint256 rate = inflation.getCurrentInflationRate();
        assertEq(rate, YEAR3_RATE, "Year 3 should be 2.5%");
    }
    
    function test_Year4PlusInflationRateIs1Percent() public {
        vm.warp(block.timestamp + 3 * YEAR);
        uint256 rate = inflation.getCurrentInflationRate();
        assertEq(rate, YEAR4_RATE, "Year 4+ should be 1%");
    }
    
    function test_Year10InflationRateStillIs1Percent() public {
        vm.warp(block.timestamp + 10 * YEAR);
        uint256 rate = inflation.getCurrentInflationRate();
        assertEq(rate, YEAR4_RATE, "Year 10+ should still be 1%");
    }
    
    function test_GetInflationRateForYear() public view {
        assertEq(inflation.getInflationRateForYear(1), YEAR1_RATE);
        assertEq(inflation.getInflationRateForYear(2), YEAR2_RATE);
        assertEq(inflation.getInflationRateForYear(3), YEAR3_RATE);
        assertEq(inflation.getInflationRateForYear(4), YEAR4_RATE);
        assertEq(inflation.getInflationRateForYear(100), YEAR4_RATE);
    }
    
    // ========== TEST-INF-002: Inflation minting schedule ==========
    
    function test_CannotMintBeforeEpochComplete() public {
        // Cannot mint in first epoch (epoch 0)
        assertFalse(inflation.canMint(), "Should not be able to mint in epoch 0");
    }
    
    function test_CanMintAfterOneYear() public {
        vm.warp(block.timestamp + YEAR);
        assertTrue(inflation.canMint(), "Should be able to mint after 1 year");
    }
    
    function test_MintInflation_Success() public {
        vm.warp(block.timestamp + YEAR);
        
        uint256 amount = inflation.mintInflation();
        uint256 expectedAmount = (MOCK_TOTAL_SUPPLY * YEAR2_RATE) / BASIS_POINTS;
        
        assertEq(amount, expectedAmount, "Mint amount should match expected");
    }
    
    function test_CannotMintTwiceInSameEpoch() public {
        vm.warp(block.timestamp + YEAR);
        inflation.mintInflation();
        
        vm.warp(block.timestamp + 30 days); // Still in same epoch
        vm.expectRevert(IQSInflation.MintingNotAvailable.selector);
        inflation.mintInflation();
    }
    
    function test_CanMintInNextEpoch() public {
        vm.warp(block.timestamp + YEAR);
        inflation.mintInflation();
        
        vm.warp(block.timestamp + YEAR); // Next epoch
        assertTrue(inflation.canMint(), "Should be able to mint in next epoch");
    }
    
    // ========== TEST-INF-003: Rate transition (5%→1%) ==========
    
    function test_RateTransitionIsYearBased() public {
        uint256 startRate = inflation.getCurrentInflationRate();
        assertEq(startRate, YEAR1_RATE);
        
        // Mid Year 2 (1.5 years)
        vm.warp(block.timestamp + YEAR + 182 days);
        uint256 midRate = inflation.getCurrentInflationRate();
        // Should be Year 2 rate (3.75%)
        assertEq(midRate, YEAR2_RATE, "Rate should be Year 2 rate");
    }
    
    function test_CalculateYearlyMint_Year1() public view {
        uint256 totalSupply = 1_000_000_000 * 1e18;
        uint256 expectedMint = (totalSupply * YEAR1_RATE) / BASIS_POINTS;
        
        assertEq(inflation.calculateYearlyMint(totalSupply), expectedMint);
    }
    
    function test_CalculateYearlyMint_Year4Plus() public {
        vm.warp(block.timestamp + 4 * YEAR);
        
        uint256 totalSupply = 1_000_000_000 * 1e18;
        uint256 expectedMint = (totalSupply * YEAR4_RATE) / BASIS_POINTS;
        
        assertEq(inflation.calculateYearlyMint(totalSupply), expectedMint);
    }
    
    // ========== Additional Tests ==========
    
    function test_DeploymentTimestamp() public view {
        assertTrue(inflation.deploymentTimestamp() > 0);
    }
    
    function test_TimeUntilNextMint() public {
        uint256 timeLeft = inflation.timeUntilNextMint();
        assertTrue(timeLeft > 0 && timeLeft <= YEAR);
        
        vm.warp(block.timestamp + YEAR);
        assertEq(inflation.timeUntilNextMint(), 0);
    }
    
    function test_GetCurrentEpoch() public view {
        IQSInflation.InflationEpoch memory epoch = inflation.getCurrentEpoch();
        assertEq(epoch.epochId, 0);
        assertEq(epoch.inflationRate, YEAR1_RATE);
    }
    
    function test_SetRewardDistributor_OnlyAdmin() public {
        address newDistributor = address(0x99);
        
        vm.prank(address(0x999));
        vm.expectRevert(IQSInflation.NotAuthorized.selector);
        inflation.setRewardDistributor(newDistributor);
    }
    
    function test_SetRewardDistributor_InvalidAddress() public {
        vm.prank(admin);
        vm.expectRevert(IQSInflation.InvalidDistributor.selector);
        inflation.setRewardDistributor(address(0));
    }
    
    function test_TotalInflationMinted() public {
        vm.warp(block.timestamp + YEAR);
        uint256 minted = inflation.mintInflation();
        
        assertEq(inflation.getTotalInflationMinted(), minted);
    }
}
