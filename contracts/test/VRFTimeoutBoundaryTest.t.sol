// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {VRFConsumerMock} from "../src/VRFConsumerMock.sol";
import {ProverSelector} from "../src/libraries/ProverSelector.sol";

/// @title VRFTimeoutBoundaryTest - Boundary value tests for VRF timeout (5 minutes)
/// @notice TEST-005: Tests edge cases around the 5-minute VRF timeout threshold
/// @dev PIR-005 Day 8-9 - Boundary value testing per CURRENT_PLAN
contract VRFTimeoutBoundaryTest is Test {
    VRFConsumerMock public vrfConsumer;

    address public owner = address(this);
    address public l1Vault = address(0x1234);
    address public prover1 = address(0x1001);
    address public prover2 = address(0x1002);
    address public prover3 = address(0x1003);

    bytes32 public unlockRequestId = keccak256("unlock-boundary-test");

    // VRF_TIMEOUT constant (5 minutes = 300 seconds)
    uint256 public constant VRF_TIMEOUT = 5 minutes;

    event FallbackProverSelected(bytes32 indexed unlockRequestId, address indexed prover);

    function setUp() public {
        vrfConsumer = new VRFConsumerMock(l1Vault);
        
        // Add provers to the pool
        vrfConsumer.addProver(prover1, 10 ether);
        vrfConsumer.addProver(prover2, 20 ether);
        vrfConsumer.addProver(prover3, 30 ether);
    }

    // =========================================================================
    // TEST-005: Boundary Value Tests (5 minutes ± 1 second)
    // =========================================================================

    /// @notice Test: Fallback should SUCCEED at exactly 5 minutes (boundary)
    /// @dev Edge case: implementation uses `<` so exactly at timeout succeeds (>= timeout)
    /// @dev Implementation: if (block.timestamp < req.requestedAt + VRF_TIMEOUT) revert
    /// @dev At exactly timeout: block.timestamp == requestedAt + VRF_TIMEOUT, so < is false, no revert
    function test_TriggerFallback_ExactlyAtTimeout_ShouldSucceed() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);
        uint256 requestedAt = block.timestamp;

        // Warp to exactly 5 minutes (300 seconds)
        vm.warp(requestedAt + VRF_TIMEOUT);

        // Should succeed: timeout boundary is inclusive (>= timeout passes)
        address fallbackProver = vrfConsumer.triggerFallback(unlockRequestId);
        assertTrue(fallbackProver != address(0), "Fallback should select a prover");
        assertTrue(vrfConsumer.isProverSelected(unlockRequestId), "Prover should be selected");
    }

    /// @notice Test: Fallback should FAIL at 5 minutes minus 1 second
    /// @dev Edge case: 1 second before timeout
    function test_TriggerFallback_OneSec_BeforeTimeout_ShouldFail() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);
        uint256 requestedAt = block.timestamp;

        // Warp to 5 minutes - 1 second (299 seconds)
        vm.warp(requestedAt + VRF_TIMEOUT - 1);

        // Should fail: still within timeout window
        vm.expectRevert(VRFConsumerMock.TimeoutNotReached.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    /// @notice Test: Fallback should SUCCEED at 5 minutes plus 1 second
    /// @dev Edge case: 1 second after timeout
    function test_TriggerFallback_OneSec_AfterTimeout_ShouldSucceed() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);
        uint256 requestedAt = block.timestamp;

        // Warp to 5 minutes + 1 second (301 seconds)
        vm.warp(requestedAt + VRF_TIMEOUT + 1);

        // Should succeed: past timeout window
        address fallbackProver = vrfConsumer.triggerFallback(unlockRequestId);
        assertTrue(fallbackProver != address(0), "Fallback should select a prover");
        assertTrue(vrfConsumer.isProverSelected(unlockRequestId), "Prover should be selected");
    }

    /// @notice Test: Verify exact timeout duration is 5 minutes (300 seconds)
    function test_VRF_TIMEOUT_IsExactly5Minutes() public view {
        assertEq(vrfConsumer.VRF_TIMEOUT(), 5 minutes, "VRF_TIMEOUT should be 5 minutes");
        assertEq(vrfConsumer.VRF_TIMEOUT(), 300, "VRF_TIMEOUT should be 300 seconds");
    }

    /// @notice Test: Fallback fails at various times before timeout
    /// @dev Parameterized boundary testing
    function test_TriggerFallback_VariousTimesBeforeTimeout() public {
        uint256[5] memory secondsBeforeTimeout = [uint256(1), 10, 60, 150, 299];
        
        for (uint256 i = 0; i < secondsBeforeTimeout.length; i++) {
            bytes32 uniqueUnlockId = keccak256(abi.encodePacked("unlock-boundary-", i));
            
            vm.prank(l1Vault);
            vrfConsumer.requestProverSelection(uniqueUnlockId);
            uint256 requestedAt = block.timestamp;

            // Warp to specific time before timeout
            vm.warp(requestedAt + VRF_TIMEOUT - secondsBeforeTimeout[i]);

            // Should fail
            vm.expectRevert(VRFConsumerMock.TimeoutNotReached.selector);
            vrfConsumer.triggerFallback(uniqueUnlockId);
            
            // Reset timestamp for next iteration
            vm.warp(requestedAt);
        }
    }

    /// @notice Test: Fallback succeeds at various times after timeout (including exactly at timeout)
    /// @dev Parameterized boundary testing
    function test_TriggerFallback_VariousTimesAtOrAfterTimeout() public {
        // Note: 0 means exactly at timeout, which should succeed
        uint256[6] memory secondsAfterTimeout = [uint256(0), 1, 10, 60, 3600, 86400];
        
        for (uint256 i = 0; i < secondsAfterTimeout.length; i++) {
            bytes32 uniqueUnlockId = keccak256(abi.encodePacked("unlock-after-", i));
            
            vm.prank(l1Vault);
            vrfConsumer.requestProverSelection(uniqueUnlockId);
            uint256 requestedAt = block.timestamp;

            // Warp to specific time at or after timeout
            vm.warp(requestedAt + VRF_TIMEOUT + secondsAfterTimeout[i]);

            // Should succeed
            address fallbackProver = vrfConsumer.triggerFallback(uniqueUnlockId);
            assertTrue(fallbackProver != address(0), "Fallback should select a prover");
            
            // Reset timestamp for next iteration
            vm.warp(requestedAt);
        }
    }

    /// @notice Test: Multiple sequential requests with different timeouts
    function test_TriggerFallback_MultipleRequests_DifferentTimings() public {
        bytes32 unlockId1 = keccak256("unlock-1");
        bytes32 unlockId2 = keccak256("unlock-2");
        bytes32 unlockId3 = keccak256("unlock-3");

        // Create requests at different times
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockId1);
        uint256 request1At = block.timestamp;

        vm.warp(block.timestamp + 60); // 1 minute later
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockId2);
        uint256 request2At = block.timestamp;

        vm.warp(block.timestamp + 60); // Another 1 minute later
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockId3);

        // At this point:
        // - unlockId1: requested 2 minutes ago (120s)
        // - unlockId2: requested 1 minute ago (60s)
        // - unlockId3: requested just now (0s)

        // Warp to exactly 5 minutes after request1 (should succeed due to >= check)
        vm.warp(request1At + VRF_TIMEOUT);

        // Request1 should be fallback-able (exactly 5 min passed)
        address prover1Selected = vrfConsumer.triggerFallback(unlockId1);
        assertTrue(prover1Selected != address(0));

        // Request2 should still fail (only 4 min passed)
        vm.expectRevert(VRFConsumerMock.TimeoutNotReached.selector);
        vrfConsumer.triggerFallback(unlockId2);

        // Request3 should still fail (only 3 min passed)
        vm.expectRevert(VRFConsumerMock.TimeoutNotReached.selector);
        vrfConsumer.triggerFallback(unlockId3);

        // Warp to exactly 5 minutes after request2
        vm.warp(request2At + VRF_TIMEOUT);

        // Now Request2 should be fallback-able
        address prover2Selected = vrfConsumer.triggerFallback(unlockId2);
        assertTrue(prover2Selected != address(0));
    }

    /// @notice Test: Fallback cannot be called twice
    function test_TriggerFallback_CannotCallTwice() public {
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(unlockRequestId);

        vm.warp(block.timestamp + VRF_TIMEOUT);

        // First call succeeds
        vrfConsumer.triggerFallback(unlockRequestId);

        // Second call should fail
        vm.expectRevert(VRFConsumerMock.RequestAlreadyFulfilled.selector);
        vrfConsumer.triggerFallback(unlockRequestId);
    }

    /// @notice Fuzz test: Any time >= timeout should allow fallback
    function testFuzz_TriggerFallback_AnyTimeAtOrAfterTimeout(uint256 extraSeconds) public {
        // Bound extra seconds to reasonable range (0 to 1 year)
        // Note: 0 means exactly at timeout, which should succeed
        extraSeconds = bound(extraSeconds, 0, 365 days);

        bytes32 uniqueUnlockId = keccak256(abi.encodePacked("fuzz-unlock-", extraSeconds));
        
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(uniqueUnlockId);
        uint256 requestedAt = block.timestamp;

        // Warp to timeout + extra seconds
        vm.warp(requestedAt + VRF_TIMEOUT + extraSeconds);

        // Should always succeed
        address fallbackProver = vrfConsumer.triggerFallback(uniqueUnlockId);
        assertTrue(fallbackProver != address(0));
    }

    /// @notice Fuzz test: Any time < timeout should fail
    function testFuzz_TriggerFallback_BeforeTimeout_AlwaysFails(uint256 secondsBefore) public {
        // Bound to times before timeout (1 second to timeout)
        // Note: at exactly timeout (secondsBefore=0), it would succeed
        secondsBefore = bound(secondsBefore, 1, VRF_TIMEOUT);

        bytes32 uniqueUnlockId = keccak256(abi.encodePacked("fuzz-before-", secondsBefore));
        
        vm.prank(l1Vault);
        vrfConsumer.requestProverSelection(uniqueUnlockId);
        uint256 requestedAt = block.timestamp;

        // Warp to timeout - secondsBefore (always before timeout)
        vm.warp(requestedAt + VRF_TIMEOUT - secondsBefore);

        // Should always fail
        vm.expectRevert(VRFConsumerMock.TimeoutNotReached.selector);
        vrfConsumer.triggerFallback(uniqueUnlockId);
    }
}
