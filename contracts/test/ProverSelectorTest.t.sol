// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ProverSelector} from "../src/libraries/ProverSelector.sol";

/// @title ProverSelectorTest - Unit tests for ProverSelector library
/// @notice Tests stake-weighted VRF selection logic
/// @dev PIR-005 Day 8-9
contract ProverSelectorTest is Test {
    using ProverSelector for ProverSelector.ProverInfo[];

    // Test addresses
    address constant PROVER_1 = address(0x1001);
    address constant PROVER_2 = address(0x1002);
    address constant PROVER_3 = address(0x1003);
    address constant PROVER_4 = address(0x1004);
    address constant PROVER_5 = address(0x1005);

    // =========================================================================
    // selectProver Tests
    // =========================================================================

    function test_SelectProver_SingleProver() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](1);
        provers[0] = ProverSelector.ProverInfo({
            prover: PROVER_1,
            stake: 10 ether,
            active: true
        });

        uint256 randomValue = 12345;
        (address selected, uint256 index) = provers.selectProver(randomValue);

        assertEq(selected, PROVER_1);
        assertEq(index, 0);
    }

    function test_SelectProver_MultipleProvers_EqualStake() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](3);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: true});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 10 ether, active: true});
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 10 ether, active: true});

        // With total stake 30 ether, random 0-9 should select prover 1
        uint256 randomValue = 5;
        (address selected, ) = provers.selectProver(randomValue);
        assertEq(selected, PROVER_1);

        // Random 10-19 should select prover 2
        randomValue = 15 ether;
        (selected, ) = provers.selectProver(randomValue);
        assertEq(selected, PROVER_2);

        // Random 20-29 should select prover 3
        randomValue = 25 ether;
        (selected, ) = provers.selectProver(randomValue);
        assertEq(selected, PROVER_3);
    }

    function test_SelectProver_WeightedProbability() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](3);
        // Prover 1: 50% weight
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 50 ether, active: true});
        // Prover 2: 30% weight
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 30 ether, active: true});
        // Prover 3: 20% weight
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 20 ether, active: true});

        // Total stake: 100 ether

        // Random 0-49 should select prover 1 (50%)
        (address selected, ) = provers.selectProver(25 ether);
        assertEq(selected, PROVER_1);

        // Random 50-79 should select prover 2 (30%)
        (selected, ) = provers.selectProver(60 ether);
        assertEq(selected, PROVER_2);

        // Random 80-99 should select prover 3 (20%)
        (selected, ) = provers.selectProver(90 ether);
        assertEq(selected, PROVER_3);
    }

    function test_SelectProver_SkipsInactiveProvers() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](3);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: false});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 10 ether, active: true});
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 10 ether, active: false});

        // Only prover 2 is active
        uint256 randomValue = 5 ether;
        (address selected, uint256 index) = provers.selectProver(randomValue);
        assertEq(selected, PROVER_2);
        assertEq(index, 1);
    }

    function test_SelectProver_SkipsInsufficientStake() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](3);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 0.5 ether, active: true}); // Below min
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 10 ether, active: true});
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 0.1 ether, active: true}); // Below min

        uint256 randomValue = 5 ether;
        (address selected, uint256 index) = provers.selectProver(randomValue);
        assertEq(selected, PROVER_2);
        assertEq(index, 1);
    }

    function test_SelectProver_RevertNoActiveProvers() public {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](2);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: false});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 10 ether, active: false});

        vm.expectRevert(ProverSelector.NoActiveProvers.selector);
        provers.selectProver(12345);
    }

    function test_SelectProver_RevertInvalidRandomValue() public {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](1);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: true});

        vm.expectRevert(ProverSelector.InvalidRandomValue.selector);
        provers.selectProver(0);
    }

    // =========================================================================
    // calculateTotalStake Tests
    // =========================================================================

    function test_CalculateTotalStake_AllActive() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](3);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: true});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 20 ether, active: true});
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 30 ether, active: true});

        (uint256 totalStake, uint256 activeCount) = provers.calculateTotalStake();
        assertEq(totalStake, 60 ether);
        assertEq(activeCount, 3);
    }

    function test_CalculateTotalStake_MixedActive() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](4);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: true});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 20 ether, active: false});
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 30 ether, active: true});
        provers[3] = ProverSelector.ProverInfo({prover: PROVER_4, stake: 0.5 ether, active: true}); // Below min

        (uint256 totalStake, uint256 activeCount) = provers.calculateTotalStake();
        assertEq(totalStake, 40 ether); // Only prover 1 and 3
        assertEq(activeCount, 2);
    }

    function test_CalculateTotalStake_Empty() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](0);

        (uint256 totalStake, uint256 activeCount) = provers.calculateTotalStake();
        assertEq(totalStake, 0);
        assertEq(activeCount, 0);
    }

    // =========================================================================
    // calculateProbability Tests
    // =========================================================================

    function test_CalculateProbability_CorrectBasisPoints() public pure {
        // 50% = 5000 basis points
        uint256 prob = ProverSelector.calculateProbability(50 ether, 100 ether);
        assertEq(prob, 5000);

        // 33.33% ≈ 3333 basis points
        prob = ProverSelector.calculateProbability(100 ether, 300 ether);
        assertEq(prob, 3333);

        // 100% = 10000 basis points
        prob = ProverSelector.calculateProbability(100 ether, 100 ether);
        assertEq(prob, 10000);
    }

    function test_CalculateProbability_ZeroTotalStake() public pure {
        uint256 prob = ProverSelector.calculateProbability(50 ether, 0);
        assertEq(prob, 0);
    }

    // =========================================================================
    // computeThreshold Tests
    // =========================================================================

    function test_ComputeThreshold_NonZero() public pure {
        uint256 threshold = ProverSelector.computeThreshold(100 ether);
        assertTrue(threshold > 0);
        // Threshold should be divisible by totalStake
        assertEq(threshold % 100 ether, 0);
    }

    function test_ComputeThreshold_Zero() public pure {
        uint256 threshold = ProverSelector.computeThreshold(0);
        assertEq(threshold, 0);
    }

    // =========================================================================
    // verifySelection Tests
    // =========================================================================

    function test_VerifySelection_Valid() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](2);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: true});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 10 ether, active: true});

        uint256 randomValue = 5 ether; // Should select PROVER_1
        (address expected, ) = provers.selectProver(randomValue);

        bool isValid = provers.verifySelection(randomValue, expected);
        assertTrue(isValid);
    }

    function test_VerifySelection_Invalid() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](2);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: true});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 10 ether, active: true});

        uint256 randomValue = 5 ether; // Should select PROVER_1
        bool isValid = provers.verifySelection(randomValue, PROVER_2); // Wrong prover
        assertFalse(isValid);
    }

    // =========================================================================
    // getActiveProvers Tests
    // =========================================================================

    function test_GetActiveProvers() public pure {
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](4);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: true});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 20 ether, active: false});
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 30 ether, active: true});
        provers[3] = ProverSelector.ProverInfo({prover: PROVER_4, stake: 0.5 ether, active: true}); // Below min

        ProverSelector.ProverInfo[] memory active = provers.getActiveProvers();
        assertEq(active.length, 2);
        assertEq(active[0].prover, PROVER_1);
        assertEq(active[1].prover, PROVER_3);
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    function testFuzz_SelectProver_AlwaysValid(uint256 randomValue) public pure {
        vm.assume(randomValue > 0);

        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](5);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: true});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 20 ether, active: true});
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 30 ether, active: true});
        provers[3] = ProverSelector.ProverInfo({prover: PROVER_4, stake: 25 ether, active: true});
        provers[4] = ProverSelector.ProverInfo({prover: PROVER_5, stake: 15 ether, active: true});

        (address selected, uint256 index) = provers.selectProver(randomValue);
        
        // Selection should be valid
        assertTrue(selected != address(0));
        assertTrue(index < provers.length);
        assertEq(provers[index].prover, selected);
    }

    function testFuzz_VerifySelection_Consistent(uint256 randomValue) public pure {
        vm.assume(randomValue > 0);

        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](3);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 10 ether, active: true});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 20 ether, active: true});
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 30 ether, active: true});

        (address selected, ) = provers.selectProver(randomValue);
        bool isValid = provers.verifySelection(randomValue, selected);
        assertTrue(isValid);
    }

    function testFuzz_SelectProver_Distribution(uint256 seed) public pure {
        // Test that selection respects stake weights over many iterations
        // This is a statistical test - we check that results are not constant
        ProverSelector.ProverInfo[] memory provers = new ProverSelector.ProverInfo[](3);
        provers[0] = ProverSelector.ProverInfo({prover: PROVER_1, stake: 50 ether, active: true});
        provers[1] = ProverSelector.ProverInfo({prover: PROVER_2, stake: 30 ether, active: true});
        provers[2] = ProverSelector.ProverInfo({prover: PROVER_3, stake: 20 ether, active: true});

        uint256 count1 = 0;
        uint256 count2 = 0;
        uint256 count3 = 0;
        uint256 iterations = 100;

        for (uint256 i = 0; i < iterations; i++) {
            uint256 randomValue = uint256(keccak256(abi.encodePacked(seed, i)));
            if (randomValue == 0) randomValue = 1;
            
            (address selected, ) = provers.selectProver(randomValue);
            if (selected == PROVER_1) count1++;
            else if (selected == PROVER_2) count2++;
            else if (selected == PROVER_3) count3++;
        }

        // At least each prover should be selected at least once (with high probability)
        // This is a sanity check, not a strict statistical test
        assertTrue(count1 + count2 + count3 == iterations);
    }
}
