// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {EditionConfig} from "../../src/core/EditionConfig.sol";

/// @title Edition Switch E2E Test Suite
/// @notice Comprehensive E2E tests for Edition switching and approval mode transitions
/// @dev TASK-P5-035: Tests Enterprise ↔ Decentralized switching and all 4 approval modes
/// @custom:ref EDITION_SWITCH_SPEC.md §3, §8, D.2
contract EditionSwitchE2ETest is Test {
    // =========================================================================
    // Test Fixtures
    // =========================================================================

    EditionConfig public configEnterprise;
    EditionConfig public configDecentralized;

    address public owner = address(0x1);
    address public foundation = address(0x2);
    address public council = address(0x3);
    address public attacker = address(0xBAD);

    // Events
    event EditionChanged(
        EditionConfig.Edition indexed oldEdition,
        EditionConfig.Edition indexed newEdition,
        address indexed changedBy
    );
    event ProverApprovalModeChanged(
        EditionConfig.ProverApprovalMode indexed oldMode,
        EditionConfig.ProverApprovalMode indexed newMode,
        address indexed changedBy
    );
    event NodeConfigChanged(
        uint8 oldMinNodes,
        uint8 oldMaxNodes,
        bool oldDynamicMembership,
        EditionConfig.ConsensusType oldConsensus,
        uint8 newMinNodes,
        uint8 newMaxNodes,
        bool newDynamicMembership,
        EditionConfig.ConsensusType newConsensus
    );
    event GovernanceEnabledChanged(bool oldValue, bool newValue);

    function setUp() public {
        vm.startPrank(owner);
        configEnterprise = new EditionConfig(owner, EditionConfig.Edition.ENTERPRISE);
        configDecentralized = new EditionConfig(owner, EditionConfig.Edition.DECENTRALIZED);
        vm.stopPrank();
    }

    // =========================================================================
    // Section 1: Enterprise → Decentralized Full Cycle E2E Tests
    // =========================================================================

    /// @notice Test complete Enterprise to Decentralized transition
    /// @dev Verifies all settings are properly reset during transition
    function test_E2E_EnterpriseToDecentralizedFullCycle() public {
        // === Initial State Verification ===
        EditionConfig.Settings memory initialSettings = configEnterprise.getSettings();
        assertEq(uint256(initialSettings.edition), uint256(EditionConfig.Edition.ENTERPRISE));
        assertEq(uint256(initialSettings.proverApprovalMode), uint256(EditionConfig.ProverApprovalMode.CONTRACT_BASED));
        assertFalse(initialSettings.governanceEnabled);
        assertFalse(initialSettings.nodeConfig.dynamicMembership);

        // === Execute Edition Switch ===
        vm.startPrank(owner);

        // Expect events
        vm.expectEmit(true, true, true, false);
        emit EditionChanged(EditionConfig.Edition.ENTERPRISE, EditionConfig.Edition.DECENTRALIZED, owner);

        configEnterprise.switchEdition(EditionConfig.Edition.DECENTRALIZED);
        vm.stopPrank();

        // === Post-Switch Verification ===
        EditionConfig.Settings memory postSettings = configEnterprise.getSettings();

        // Edition changed
        assertEq(uint256(postSettings.edition), uint256(EditionConfig.Edition.DECENTRALIZED));
        assertTrue(configEnterprise.isDecentralized());
        assertFalse(configEnterprise.isEnterprise());

        // Governance enabled
        assertTrue(postSettings.governanceEnabled);
        assertTrue(configEnterprise.isGovernanceEnabled());

        // Prover approval mode reset to FOUNDATION_INVITE
        assertEq(
            uint256(postSettings.proverApprovalMode),
            uint256(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE)
        );

        // === Verify Decentralized capabilities unlocked ===
        // Should now be able to set COUNCIL_VOTE
        vm.prank(owner);
        configEnterprise.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);
        assertEq(
            uint256(configEnterprise.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.COUNCIL_VOTE)
        );

        // Should now be able to enable dynamic membership
        EditionConfig.NodeConfig memory dynamicConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });

        vm.prank(owner);
        configEnterprise.updateNodeConfig(dynamicConfig);
        assertTrue(configEnterprise.isDynamicMembershipEnabled());
    }

    /// @notice Test Enterprise to Decentralized with prior governance disabled
    function test_E2E_EnterpriseToDecentralizedEnablesGovernance() public {
        // Enterprise starts with governance disabled
        assertFalse(configEnterprise.isGovernanceEnabled());

        // Even if we explicitly disable (no-op for Enterprise)
        vm.prank(owner);
        configEnterprise.setGovernanceEnabled(false);
        assertFalse(configEnterprise.isGovernanceEnabled());

        // Switch to Decentralized
        vm.prank(owner);
        configEnterprise.switchEdition(EditionConfig.Edition.DECENTRALIZED);

        // Governance should be automatically enabled
        assertTrue(configEnterprise.isGovernanceEnabled());
    }

    // =========================================================================
    // Section 2: Decentralized → Enterprise Full Cycle E2E Tests
    // =========================================================================

    /// @notice Test complete Decentralized to Enterprise transition
    /// @dev Verifies all settings are reset to Enterprise constraints
    function test_E2E_DecentralizedToEnterpriseFullCycle() public {
        // === Setup: Configure Decentralized with Phase 4 settings ===
        vm.startPrank(owner);

        // Set dynamic PBFT
        EditionConfig.NodeConfig memory dynamicConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        configDecentralized.updateNodeConfig(dynamicConfig);

        // Set STAKE_AUTO
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);

        vm.stopPrank();

        // === Verify Pre-Switch State ===
        assertTrue(configDecentralized.isDynamicMembershipEnabled());
        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.STAKE_AUTO)
        );
        assertEq(configDecentralized.getNodeConfig().maxNodes, 21);

        // === Execute Edition Switch ===
        vm.startPrank(owner);

        vm.expectEmit(true, true, true, false);
        emit EditionChanged(EditionConfig.Edition.DECENTRALIZED, EditionConfig.Edition.ENTERPRISE, owner);

        configDecentralized.switchEdition(EditionConfig.Edition.ENTERPRISE);
        vm.stopPrank();

        // === Post-Switch Verification ===
        EditionConfig.Settings memory postSettings = configDecentralized.getSettings();

        // Edition changed
        assertEq(uint256(postSettings.edition), uint256(EditionConfig.Edition.ENTERPRISE));
        assertTrue(configDecentralized.isEnterprise());
        assertFalse(configDecentralized.isDecentralized());

        // Node config reset to FIXED_4BFT
        assertFalse(postSettings.nodeConfig.dynamicMembership);
        assertEq(postSettings.nodeConfig.maxNodes, 4);
        assertEq(postSettings.nodeConfig.minNodes, 4);
        assertEq(uint256(postSettings.nodeConfig.consensus), uint256(EditionConfig.ConsensusType.FIXED_4BFT));

        // Prover approval mode reset to CONTRACT_BASED
        assertEq(
            uint256(postSettings.proverApprovalMode),
            uint256(EditionConfig.ProverApprovalMode.CONTRACT_BASED)
        );

        // === Verify Enterprise constraints now enforced ===
        // Should not be able to set dynamic membership
        EditionConfig.NodeConfig memory invalidConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 4,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                EditionConfig.EnterpriseConstraintViolation.selector,
                "dynamic membership not allowed"
            )
        );
        configDecentralized.updateNodeConfig(invalidConfig);

        // Should not be able to set non-CONTRACT_BASED approval
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                EditionConfig.InvalidProverApprovalMode.selector,
                EditionConfig.Edition.ENTERPRISE,
                EditionConfig.ProverApprovalMode.COUNCIL_VOTE
            )
        );
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);
    }

    /// @notice Test Decentralized to Enterprise preserves governance setting option
    function test_E2E_DecentralizedToEnterpriseGovernanceOption() public {
        // Decentralized starts with governance enabled
        assertTrue(configDecentralized.isGovernanceEnabled());

        // Switch to Enterprise
        vm.prank(owner);
        configDecentralized.switchEdition(EditionConfig.Edition.ENTERPRISE);

        // Governance is not automatically disabled (Enterprise can have governance)
        // The value is preserved from before switch
        assertTrue(configDecentralized.isGovernanceEnabled());

        // But Enterprise can choose to disable it
        vm.prank(owner);
        configDecentralized.setGovernanceEnabled(false);
        assertFalse(configDecentralized.isGovernanceEnabled());
    }

    // =========================================================================
    // Section 3: Approval Mode 4-Stage Transition E2E Tests
    // =========================================================================

    /// @notice Test full Decentralized phase progression: Phase 1-2 → Phase 3 → Phase 4
    /// @dev CONTRACT_BASED → FOUNDATION_INVITE → COUNCIL_VOTE → STAKE_AUTO
    function test_E2E_ApprovalMode_FullPhaseProgression() public {
        // === Phase 1-2: FOUNDATION_INVITE (default for Decentralized) ===
        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE)
        );

        vm.startPrank(owner);

        // === Transition to Phase 3: COUNCIL_VOTE ===
        vm.expectEmit(true, true, true, false);
        emit ProverApprovalModeChanged(
            EditionConfig.ProverApprovalMode.FOUNDATION_INVITE,
            EditionConfig.ProverApprovalMode.COUNCIL_VOTE,
            owner
        );

        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);

        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.COUNCIL_VOTE)
        );

        // === Transition to Phase 4: STAKE_AUTO ===
        vm.expectEmit(true, true, true, false);
        emit ProverApprovalModeChanged(
            EditionConfig.ProverApprovalMode.COUNCIL_VOTE,
            EditionConfig.ProverApprovalMode.STAKE_AUTO,
            owner
        );

        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);

        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.STAKE_AUTO)
        );

        vm.stopPrank();

        // === Verify Final State ===
        assertTrue(configDecentralized.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.STAKE_AUTO));
    }

    /// @notice Test all 4 approval modes can be set in Decentralized edition
    function test_E2E_ApprovalMode_AllFourModes() public {
        EditionConfig.ProverApprovalMode[4] memory modes = [
            EditionConfig.ProverApprovalMode.CONTRACT_BASED,
            EditionConfig.ProverApprovalMode.FOUNDATION_INVITE,
            EditionConfig.ProverApprovalMode.COUNCIL_VOTE,
            EditionConfig.ProverApprovalMode.STAKE_AUTO
        ];

        for (uint256 i = 0; i < modes.length; i++) {
            vm.prank(owner);
            configDecentralized.updateProverApprovalMode(modes[i]);

            assertEq(
                uint256(configDecentralized.getProverApprovalMode()),
                uint256(modes[i])
            );

            assertTrue(configDecentralized.isProverApprovalModeAllowed(modes[i]));
        }
    }

    /// @notice Test reverse transition (Phase 4 → Phase 3 → Phase 2) is allowed
    /// @dev No restriction on going backwards in Decentralized
    function test_E2E_ApprovalMode_ReverseTransition() public {
        vm.startPrank(owner);

        // Start at STAKE_AUTO (Phase 4)
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);

        // Go back to COUNCIL_VOTE (Phase 3)
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);
        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.COUNCIL_VOTE)
        );

        // Go back to FOUNDATION_INVITE (Phase 1-2)
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE);
        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE)
        );

        vm.stopPrank();
    }

    /// @notice Test Enterprise is restricted to CONTRACT_BASED only
    function test_E2E_ApprovalMode_EnterpriseRestriction() public {
        // Verify Enterprise allows only CONTRACT_BASED
        assertTrue(configEnterprise.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.CONTRACT_BASED));
        assertFalse(configEnterprise.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE));
        assertFalse(configEnterprise.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.COUNCIL_VOTE));
        assertFalse(configEnterprise.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.STAKE_AUTO));

        // All non-CONTRACT_BASED modes should revert
        EditionConfig.ProverApprovalMode[3] memory invalidModes = [
            EditionConfig.ProverApprovalMode.FOUNDATION_INVITE,
            EditionConfig.ProverApprovalMode.COUNCIL_VOTE,
            EditionConfig.ProverApprovalMode.STAKE_AUTO
        ];

        for (uint256 i = 0; i < invalidModes.length; i++) {
            vm.prank(owner);
            vm.expectRevert(
                abi.encodeWithSelector(
                    EditionConfig.InvalidProverApprovalMode.selector,
                    EditionConfig.Edition.ENTERPRISE,
                    invalidModes[i]
                )
            );
            configEnterprise.updateProverApprovalMode(invalidModes[i]);
        }
    }

    // =========================================================================
    // Section 4: Phase Transition Integration E2E Tests (Phase 1-4)
    // =========================================================================

    /// @notice Test complete Phase 1 → 2 → 3 → 4 transition for Decentralized
    /// @dev Simulates full protocol maturation
    function test_E2E_PhaseTransition_FullCycle() public {
        vm.startPrank(owner);

        // === Phase 1-2: Initial State ===
        // FOUNDATION_INVITE + FIXED_4BFT (default)
        EditionConfig.Settings memory phase1Settings = configDecentralized.getSettings();
        assertEq(uint256(phase1Settings.proverApprovalMode), uint256(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE));
        assertEq(uint256(phase1Settings.nodeConfig.consensus), uint256(EditionConfig.ConsensusType.FIXED_4BFT));
        assertFalse(phase1Settings.nodeConfig.dynamicMembership);
        assertEq(phase1Settings.nodeConfig.maxNodes, 4);

        console.log("Phase 1-2: FOUNDATION_INVITE + FIXED_4BFT");

        // === Phase 3: Council Governance ===
        // Transition to COUNCIL_VOTE (still FIXED_4BFT)
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);

        EditionConfig.Settings memory phase3Settings = configDecentralized.getSettings();
        assertEq(uint256(phase3Settings.proverApprovalMode), uint256(EditionConfig.ProverApprovalMode.COUNCIL_VOTE));
        assertEq(uint256(phase3Settings.nodeConfig.consensus), uint256(EditionConfig.ConsensusType.FIXED_4BFT));

        console.log("Phase 3: COUNCIL_VOTE + FIXED_4BFT");

        // === Phase 4: Full Decentralization ===
        // Enable DYNAMIC_PBFT
        EditionConfig.NodeConfig memory phase4NodeConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        configDecentralized.updateNodeConfig(phase4NodeConfig);

        // Transition to STAKE_AUTO
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);

        EditionConfig.Settings memory phase4Settings = configDecentralized.getSettings();
        assertEq(uint256(phase4Settings.proverApprovalMode), uint256(EditionConfig.ProverApprovalMode.STAKE_AUTO));
        assertEq(uint256(phase4Settings.nodeConfig.consensus), uint256(EditionConfig.ConsensusType.DYNAMIC_PBFT));
        assertTrue(phase4Settings.nodeConfig.dynamicMembership);
        assertEq(phase4Settings.nodeConfig.maxNodes, 21);

        console.log("Phase 4: STAKE_AUTO + DYNAMIC_PBFT (max 21 nodes)");

        // === Verify BFT threshold calculation ===
        // For 21 nodes: (2*21 + 2) / 3 = 14
        assertEq(configDecentralized.calculateBftThreshold(), 14);

        vm.stopPrank();
    }

    /// @notice Test Phase 4 node expansion scenarios
    function test_E2E_PhaseTransition_NodeExpansion() public {
        vm.startPrank(owner);

        // Start with Phase 4 config
        EditionConfig.NodeConfig memory config7Nodes = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 7,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        configDecentralized.updateNodeConfig(config7Nodes);

        // Verify BFT threshold for 7 nodes: (2*7 + 2) / 3 = 5
        assertEq(configDecentralized.calculateBftThreshold(), 5);

        // Expand to 13 nodes
        EditionConfig.NodeConfig memory config13Nodes = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 13,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        configDecentralized.updateNodeConfig(config13Nodes);

        // Verify BFT threshold for 13 nodes: (2*13 + 2) / 3 = 9
        assertEq(configDecentralized.calculateBftThreshold(), 9);

        // Expand to max 21 nodes
        EditionConfig.NodeConfig memory config21Nodes = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        configDecentralized.updateNodeConfig(config21Nodes);

        // Verify BFT threshold for 21 nodes: (2*21 + 2) / 3 = 14
        assertEq(configDecentralized.calculateBftThreshold(), 14);

        vm.stopPrank();
    }

    // =========================================================================
    // Section 5: Edge Cases and Boundary Tests
    // =========================================================================

    /// @notice Test same edition switch reverts
    function test_E2E_EdgeCase_SameEditionRevert() public {
        vm.prank(owner);
        vm.expectRevert(EditionConfig.SameEdition.selector);
        configEnterprise.switchEdition(EditionConfig.Edition.ENTERPRISE);

        vm.prank(owner);
        vm.expectRevert(EditionConfig.SameEdition.selector);
        configDecentralized.switchEdition(EditionConfig.Edition.DECENTRALIZED);
    }

    /// @notice Test unauthorized access reverts
    function test_E2E_EdgeCase_UnauthorizedAccess() public {
        // Edition switch
        vm.prank(attacker);
        vm.expectRevert(EditionConfig.Unauthorized.selector);
        configEnterprise.switchEdition(EditionConfig.Edition.DECENTRALIZED);

        // Prover approval mode
        vm.prank(attacker);
        vm.expectRevert(EditionConfig.Unauthorized.selector);
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);

        // Node config
        EditionConfig.NodeConfig memory config = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 4,
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });
        vm.prank(attacker);
        vm.expectRevert(EditionConfig.Unauthorized.selector);
        configDecentralized.updateNodeConfig(config);
    }

    /// @notice Test boundary values for node configuration
    function test_E2E_EdgeCase_NodeConfigBoundaries() public {
        vm.startPrank(owner);

        // === Min nodes boundary (4) ===
        EditionConfig.NodeConfig memory minBoundaryValid = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 4,
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });
        configDecentralized.updateNodeConfig(minBoundaryValid);
        assertEq(configDecentralized.getNodeConfig().minNodes, 4);

        // Below min should revert
        EditionConfig.NodeConfig memory belowMin = EditionConfig.NodeConfig({
            minNodes: 3,
            maxNodes: 4,
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });
        vm.expectRevert(abi.encodeWithSelector(EditionConfig.InvalidNodeConfig.selector, "minNodes must be >= 4"));
        configDecentralized.updateNodeConfig(belowMin);

        // === Max nodes boundary (21 for dynamic) ===
        EditionConfig.NodeConfig memory maxBoundaryValid = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        configDecentralized.updateNodeConfig(maxBoundaryValid);
        assertEq(configDecentralized.getNodeConfig().maxNodes, 21);

        // Above max should revert
        EditionConfig.NodeConfig memory aboveMax = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 22,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        vm.expectRevert(
            abi.encodeWithSelector(EditionConfig.InvalidNodeConfig.selector, "maxNodes exceeds maximum for dynamic PBFT")
        );
        configDecentralized.updateNodeConfig(aboveMax);

        vm.stopPrank();
    }

    /// @notice Test max < min node config reverts
    function test_E2E_EdgeCase_MaxBelowMinRevert() public {
        EditionConfig.NodeConfig memory invalidConfig = EditionConfig.NodeConfig({
            minNodes: 10,
            maxNodes: 5,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(EditionConfig.InvalidNodeConfig.selector, "maxNodes must be >= minNodes"));
        configDecentralized.updateNodeConfig(invalidConfig);
    }

    /// @notice Test dynamic membership requires DYNAMIC_PBFT consensus
    function test_E2E_EdgeCase_DynamicRequiresDynamicPbft() public {
        EditionConfig.NodeConfig memory mismatchConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 10,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT // Mismatch!
        });

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(EditionConfig.InvalidNodeConfig.selector, "dynamic membership requires DYNAMIC_PBFT")
        );
        configDecentralized.updateNodeConfig(mismatchConfig);
    }

    // =========================================================================
    // Section 6: Complex Scenario E2E Tests
    // =========================================================================

    /// @notice Test multiple edition switches in sequence
    function test_E2E_Complex_MultipleEditionSwitches() public {
        vm.startPrank(owner);

        // Enterprise → Decentralized
        configEnterprise.switchEdition(EditionConfig.Edition.DECENTRALIZED);
        assertTrue(configEnterprise.isDecentralized());

        // Configure as Phase 4
        EditionConfig.NodeConfig memory dynamicConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        configEnterprise.updateNodeConfig(dynamicConfig);
        configEnterprise.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);

        // Decentralized → Enterprise (settings reset)
        configEnterprise.switchEdition(EditionConfig.Edition.ENTERPRISE);
        assertTrue(configEnterprise.isEnterprise());
        assertEq(configEnterprise.getNodeConfig().maxNodes, 4);
        assertFalse(configEnterprise.isDynamicMembershipEnabled());

        // Enterprise → Decentralized again
        configEnterprise.switchEdition(EditionConfig.Edition.DECENTRALIZED);
        assertTrue(configEnterprise.isDecentralized());
        // Starts fresh at FOUNDATION_INVITE
        assertEq(
            uint256(configEnterprise.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE)
        );

        vm.stopPrank();
    }

    /// @notice Test ownership transfer during edition management
    function test_E2E_Complex_OwnershipTransferDuringManagement() public {
        address newOwner = address(0x123);

        // Original owner starts configuration
        vm.prank(owner);
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);

        // Transfer ownership
        vm.prank(owner);
        configDecentralized.transferOwnership(newOwner);

        // Old owner can still operate until acceptance
        vm.prank(owner);
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);

        // New owner accepts
        vm.prank(newOwner);
        configDecentralized.acceptOwnership();

        // Old owner no longer authorized
        vm.prank(owner);
        vm.expectRevert(EditionConfig.Unauthorized.selector);
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);

        // New owner can operate
        vm.prank(newOwner);
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);
        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.COUNCIL_VOTE)
        );

        // New owner can switch edition
        vm.prank(newOwner);
        configDecentralized.switchEdition(EditionConfig.Edition.ENTERPRISE);
        assertTrue(configDecentralized.isEnterprise());
    }

    /// @notice Test isNodeConfigChangeValid helper function
    function test_E2E_Complex_ConfigValidationHelper() public view {
        // Valid config for Decentralized
        EditionConfig.NodeConfig memory validDecen = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        (bool isValid, string memory reason) = configDecentralized.isNodeConfigChangeValid(validDecen);
        assertTrue(isValid);
        assertEq(reason, "");

        // Valid config for Enterprise
        EditionConfig.NodeConfig memory validEnt = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 4,
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });
        (bool isValid2, string memory reason2) = configEnterprise.isNodeConfigChangeValid(validEnt);
        assertTrue(isValid2);
        assertEq(reason2, "");

        // Invalid for Enterprise (dynamic)
        EditionConfig.NodeConfig memory invalidEnt = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 4,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });
        (bool isValid3, string memory reason3) = configEnterprise.isNodeConfigChangeValid(invalidEnt);
        assertFalse(isValid3);
        assertEq(reason3, "Enterprise: dynamic membership not allowed");
    }

    // =========================================================================
    // Section 7: Gas Optimization Tests
    // =========================================================================

    /// @notice Measure gas for edition switch operations
    function test_E2E_Gas_EditionSwitch() public {
        vm.startPrank(owner);

        uint256 gasStart = gasleft();
        configEnterprise.switchEdition(EditionConfig.Edition.DECENTRALIZED);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for Enterprise->Decentralized switch:", gasUsed);

        // Should be reasonable (< 100k gas)
        assertLt(gasUsed, 100000);

        vm.stopPrank();
    }

    /// @notice Measure gas for approval mode change
    function test_E2E_Gas_ApprovalModeChange() public {
        vm.startPrank(owner);

        uint256 gasStart = gasleft();
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for approval mode change:", gasUsed);

        // Should be very cheap (< 50k gas)
        assertLt(gasUsed, 50000);

        vm.stopPrank();
    }

    /// @notice Measure gas for node config update
    function test_E2E_Gas_NodeConfigUpdate() public {
        vm.startPrank(owner);

        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });

        uint256 gasStart = gasleft();
        configDecentralized.updateNodeConfig(newConfig);
        uint256 gasUsed = gasStart - gasleft();

        console.log("Gas used for node config update:", gasUsed);

        // Should be reasonable (< 80k gas)
        assertLt(gasUsed, 80000);

        vm.stopPrank();
    }

    // =========================================================================
    // Section 8: State Consistency Tests
    // =========================================================================

    /// @notice Verify state consistency after multiple operations
    function test_E2E_StateConsistency_AfterOperations() public {
        vm.startPrank(owner);

        // Perform multiple operations
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);

        EditionConfig.NodeConfig memory config = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 13,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });
        configDecentralized.updateNodeConfig(config);

        configDecentralized.setGovernanceEnabled(true);

        // Verify all settings are consistent
        EditionConfig.Settings memory settings = configDecentralized.getSettings();

        assertEq(uint256(settings.edition), uint256(EditionConfig.Edition.DECENTRALIZED));
        assertEq(uint256(settings.proverApprovalMode), uint256(EditionConfig.ProverApprovalMode.COUNCIL_VOTE));
        assertEq(settings.nodeConfig.minNodes, 4);
        assertEq(settings.nodeConfig.maxNodes, 13);
        assertTrue(settings.nodeConfig.dynamicMembership);
        assertEq(uint256(settings.nodeConfig.consensus), uint256(EditionConfig.ConsensusType.DYNAMIC_PBFT));
        assertTrue(settings.governanceEnabled);

        // Verify individual getters match
        assertEq(uint256(configDecentralized.getEdition()), uint256(settings.edition));
        assertEq(uint256(configDecentralized.getProverApprovalMode()), uint256(settings.proverApprovalMode));

        EditionConfig.NodeConfig memory nodeConfig = configDecentralized.getNodeConfig();
        assertEq(nodeConfig.minNodes, settings.nodeConfig.minNodes);
        assertEq(nodeConfig.maxNodes, settings.nodeConfig.maxNodes);
        assertEq(nodeConfig.dynamicMembership, settings.nodeConfig.dynamicMembership);

        assertTrue(configDecentralized.isDecentralized());
        assertFalse(configDecentralized.isEnterprise());
        assertTrue(configDecentralized.isDynamicMembershipEnabled());
        assertTrue(configDecentralized.isGovernanceEnabled());

        vm.stopPrank();
    }
}
