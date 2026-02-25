// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/rewards/RewardDistributor.sol";
import "../../src/interfaces/IRewardDistributor.sol";

/// @title RewardDistributor Test Suite
/// @notice Tests for DECEN-018: Reward Distribution
/// @dev TDD approach - tests written before implementation
contract RewardDistributorTest is Test {
    RewardDistributor public distributor;
    
    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public insurance = address(0x3);
    address public mockToken = address(0x4);
    address public mockRegistry = address(0x5);
    
    address public prover1 = address(0x10);
    address public prover2 = address(0x11);
    address public sequencer1 = address(0x20);
    
    // Distribution shares per PHASE3_STRATEGY
    uint256 constant PROVER_SHARE = 4000;    // 40%
    uint256 constant TREASURY_SHARE = 3000;  // 30%
    uint256 constant BURN_SHARE = 2000;      // 20%
    uint256 constant INSURANCE_SHARE = 1000; // 10%
    uint256 constant BASIS_POINTS = 10000;
    
    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    event FeesDistributed(uint256 totalAmount, uint256 proverAmount, uint256 treasuryAmount, uint256 burnAmount, uint256 insuranceAmount);
    event RewardsClaimed(address indexed claimant, uint256 amount, uint256 totalClaimed);
    event TokensBurned(uint256 amount, uint256 totalBurned);
    
    function setUp() public {
        vm.startPrank(admin);
        distributor = new RewardDistributor(mockToken, treasury, insurance, mockRegistry);
        vm.stopPrank();
        
        // Mock registry to return true for provers/sequencers
        vm.mockCall(
            mockRegistry,
            abi.encodeWithSignature("isActiveProver(address)"),
            abi.encode(false)
        );
        vm.mockCall(
            mockRegistry,
            abi.encodeWithSignature("isActiveProver(address)", prover1),
            abi.encode(true)
        );
        vm.mockCall(
            mockRegistry,
            abi.encodeWithSignature("isActiveProver(address)", prover2),
            abi.encode(true)
        );
        vm.mockCall(
            mockRegistry,
            abi.encodeWithSignature("isActiveSequencer(address)"),
            abi.encode(false)
        );
        vm.mockCall(
            mockRegistry,
            abi.encodeWithSignature("isActiveSequencer(address)", sequencer1),
            abi.encode(true)
        );
    }
    
    // ========== TEST-REW-001: Fee distribution (40/30/20/10) ==========
    
    function test_DistributeFeesCorrectShares() public {
        uint256 amount = 100_000 * 1e18;
        
        // Expected amounts
        uint256 expectedProver = (amount * PROVER_SHARE) / BASIS_POINTS;
        uint256 expectedTreasury = (amount * TREASURY_SHARE) / BASIS_POINTS;
        uint256 expectedBurn = (amount * BURN_SHARE) / BASIS_POINTS;
        uint256 expectedInsurance = (amount * INSURANCE_SHARE) / BASIS_POINTS;
        
        // Mock token transfer
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("transferFrom(address,address,uint256)"),
            abi.encode(true)
        );
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("transfer(address,uint256)"),
            abi.encode(true)
        );
        
        vm.expectEmit(true, true, true, true);
        emit FeesDistributed(amount, expectedProver, expectedTreasury, expectedBurn, expectedInsurance);
        
        distributor.distribute(amount);
    }
    
    function test_GetShares() public view {
        IRewardDistributor.DistributionShares memory shares = distributor.getShares();
        
        assertEq(shares.proverShare, PROVER_SHARE);
        assertEq(shares.treasuryShare, TREASURY_SHARE);
        assertEq(shares.burnShare, BURN_SHARE);
        assertEq(shares.insuranceShare, INSURANCE_SHARE);
    }
    
    function test_DistributeToBurnAddress() public {
        uint256 amount = 10_000 * 1e18;
        uint256 expectedBurn = (amount * BURN_SHARE) / BASIS_POINTS;
        
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("transferFrom(address,address,uint256)"),
            abi.encode(true)
        );
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("transfer(address,uint256)"),
            abi.encode(true)
        );
        
        // Implementation emits TokensBurned then FeesDistributed
        // We expect TokensBurned to be emitted
        vm.expectEmit(true, true, true, true);
        emit TokensBurned(expectedBurn, expectedBurn);
        
        distributor.distribute(amount);
        assertEq(distributor.getTotalBurned(), expectedBurn);
    }
    
    // ========== TEST-REW-002: Reward claim lifecycle ==========
    
    function test_AllocateRewardToProver() public {
        uint256 reward = 1000 * 1e18;
        
        vm.prank(admin);
        distributor.allocateReward(prover1, reward);
        
        assertEq(distributor.getUnclaimedRewards(prover1), reward);
    }
    
    function test_ClaimRewards() public {
        uint256 reward = 1000 * 1e18;
        
        vm.prank(admin);
        distributor.allocateReward(prover1, reward);
        
        // Mock token transfer for claim
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("transfer(address,uint256)", prover1, reward),
            abi.encode(true)
        );
        
        vm.prank(prover1);
        uint256 claimed = distributor.claimRewards();
        
        assertEq(claimed, reward);
        assertEq(distributor.getUnclaimedRewards(prover1), 0);
    }
    
    function test_CannotClaimZeroRewards() public {
        vm.prank(prover1);
        vm.expectRevert(IRewardDistributor.NoRewardsAvailable.selector);
        distributor.claimRewards();
    }
    
    function test_UnregisteredOperatorCannotClaim() public {
        address unregistered = address(0x999);
        
        vm.prank(admin);
        distributor.allocateReward(unregistered, 1000 * 1e18);
        
        vm.prank(unregistered);
        vm.expectRevert(IRewardDistributor.NotRegisteredOperator.selector);
        distributor.claimRewards();
    }
    
    function test_GetRewardInfo() public {
        uint256 reward = 1000 * 1e18;
        
        vm.prank(admin);
        distributor.allocateReward(prover1, reward);
        
        IRewardDistributor.RewardInfo memory info = distributor.getRewardInfo(prover1);
        assertEq(info.pendingRewards, reward);
        assertEq(info.totalClaimed, 0);
    }
    
    function test_MultipleClaimsAccumulate() public {
        vm.prank(admin);
        distributor.allocateReward(prover1, 1000 * 1e18);
        
        vm.mockCall(mockToken, abi.encodeWithSignature("transfer(address,uint256)"), abi.encode(true));
        
        vm.prank(prover1);
        distributor.claimRewards();
        
        vm.prank(admin);
        distributor.allocateReward(prover1, 500 * 1e18);
        
        vm.prank(prover1);
        distributor.claimRewards();
        
        IRewardDistributor.RewardInfo memory info = distributor.getRewardInfo(prover1);
        assertEq(info.totalClaimed, 1500 * 1e18);
    }
    
    // ========== TEST-REW-003: Burn mechanism verification ==========
    
    function test_BurnAddressIsCorrect() public view {
        assertEq(distributor.BURN_ADDRESS(), BURN_ADDRESS);
    }
    
    function test_TotalBurnedAccumulates() public {
        vm.mockCall(mockToken, abi.encodeWithSignature("transferFrom(address,address,uint256)"), abi.encode(true));
        vm.mockCall(mockToken, abi.encodeWithSignature("transfer(address,uint256)"), abi.encode(true));
        
        distributor.distribute(10_000 * 1e18);
        
        distributor.distribute(5_000 * 1e18);
        uint256 burn2 = distributor.getTotalBurned();
        
        uint256 expectedBurn1 = (10_000 * 1e18 * BURN_SHARE) / BASIS_POINTS;
        uint256 expectedBurn2 = (5_000 * 1e18 * BURN_SHARE) / BASIS_POINTS;
        
        assertEq(burn2, expectedBurn1 + expectedBurn2);
    }
    
    // ========== Admin Functions ==========
    
    function test_SetShares() public {
        vm.prank(admin);
        distributor.setShares(3500, 3500, 2000, 1000);
        
        IRewardDistributor.DistributionShares memory shares = distributor.getShares();
        assertEq(shares.proverShare, 3500);
        assertEq(shares.treasuryShare, 3500);
    }
    
    function test_SetShares_MustSumTo10000() public {
        vm.prank(admin);
        vm.expectRevert(IRewardDistributor.InvalidSharesSum.selector);
        distributor.setShares(5000, 3000, 2000, 1000); // Sum = 11000
    }
    
    function test_SetShares_OnlyAuthorized() public {
        vm.prank(address(0x999));
        vm.expectRevert(IRewardDistributor.NotAuthorized.selector);
        distributor.setShares(4000, 3000, 2000, 1000);
    }
    
    function test_SetTreasury() public {
        address newTreasury = address(0x999);
        vm.prank(admin);
        distributor.setTreasury(newTreasury);
        assertEq(distributor.getTreasury(), newTreasury);
    }
    
    function test_SetInsuranceFund() public {
        address newInsurance = address(0x888);
        vm.prank(admin);
        distributor.setInsuranceFund(newInsurance);
        assertEq(distributor.getInsuranceFund(), newInsurance);
    }
    
    function test_GetTotalDistributed() public {
        vm.mockCall(mockToken, abi.encodeWithSignature("transferFrom(address,address,uint256)"), abi.encode(true));
        vm.mockCall(mockToken, abi.encodeWithSignature("transfer(address,uint256)"), abi.encode(true));
        
        distributor.distribute(10_000 * 1e18);
        distributor.distribute(5_000 * 1e18);
        
        assertEq(distributor.getTotalDistributed(), 15_000 * 1e18);
    }
}
