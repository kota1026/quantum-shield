// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {EditionConfig} from "../../src/core/EditionConfig.sol";

/// @title EditionConfig Test Suite
/// @notice Comprehensive tests for EditionConfig contract
/// @dev Tests EDITION_SWITCH_SPEC.md compliance, TASK-P5-010
contract EditionConfigTest is Test {
    EditionConfig public configEnterprise;
    EditionConfig public configDecentralized;

    address public owner = address(0x1);
    address public newOwner = address(0x2);
    address public unauthorized = address(0x3);

    // Events for testing
    event EditionChanged(
        EditionConfig.Edition indexed oldEdition,
        EditionConfig.Edition indexed newEdition,
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
    event ProverApprovalModeChanged(
        EditionConfig.ProverApprovalMode indexed oldMode,
        EditionConfig.ProverApprovalMode indexed newMode,
        address indexed changedBy
    );
    event GovernanceEnabledChanged(bool oldValue, bool newValue);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    function setUp() public {
        vm.startPrank(owner);
        configEnterprise = new EditionConfig(owner, EditionConfig.Edition.ENTERPRISE);
        configDecentralized = new EditionConfig(owner, EditionConfig.Edition.DECENTRALIZED);
        vm.stopPrank();
    }

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    function test_ConstructorEnterprise() public view {
        EditionConfig.Settings memory settings = configEnterprise.getSettings();

        assertEq(uint256(settings.edition), uint256(EditionConfig.Edition.ENTERPRISE));
        assertEq(settings.nodeConfig.minNodes, 4);
        assertEq(settings.nodeConfig.maxNodes, 4);
        assertFalse(settings.nodeConfig.dynamicMembership);
        assertEq(uint256(settings.nodeConfig.consensus), uint256(EditionConfig.ConsensusType.FIXED_4BFT));
        assertEq(uint256(settings.proverApprovalMode), uint256(EditionConfig.ProverApprovalMode.CONTRACT_BASED));
        assertFalse(settings.governanceEnabled);
    }

    function test_ConstructorDecentralized() public view {
        EditionConfig.Settings memory settings = configDecentralized.getSettings();

        assertEq(uint256(settings.edition), uint256(EditionConfig.Edition.DECENTRALIZED));
        assertEq(settings.nodeConfig.minNodes, 4);
        assertEq(settings.nodeConfig.maxNodes, 4);
        assertFalse(settings.nodeConfig.dynamicMembership);
        assertEq(uint256(settings.nodeConfig.consensus), uint256(EditionConfig.ConsensusType.FIXED_4BFT));
        assertEq(uint256(settings.proverApprovalMode), uint256(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE));
        assertTrue(settings.governanceEnabled);
    }

    function test_ConstructorRevertZeroAddress() public {
        vm.expectRevert(EditionConfig.ZeroAddress.selector);
        new EditionConfig(address(0), EditionConfig.Edition.ENTERPRISE);
    }

    // =========================================================================
    // Owner Management Tests
    // =========================================================================

    function test_Owner() public view {
        assertEq(configEnterprise.owner(), owner);
    }

    function test_TransferOwnership() public {
        vm.startPrank(owner);
        configEnterprise.transferOwnership(newOwner);
        vm.stopPrank();

        assertEq(configEnterprise.pendingOwner(), newOwner);
        assertEq(configEnterprise.owner(), owner); // Not changed yet
    }

    function test_AcceptOwnership() public {
        vm.prank(owner);
        configEnterprise.transferOwnership(newOwner);

        vm.expectEmit(true, true, false, false);
        emit OwnerChanged(owner, newOwner);

        vm.prank(newOwner);
        configEnterprise.acceptOwnership();

        assertEq(configEnterprise.owner(), newOwner);
        assertEq(configEnterprise.pendingOwner(), address(0));
    }

    function test_TransferOwnershipRevertUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert(EditionConfig.Unauthorized.selector);
        configEnterprise.transferOwnership(newOwner);
    }

    function test_TransferOwnershipRevertZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(EditionConfig.ZeroAddress.selector);
        configEnterprise.transferOwnership(address(0));
    }

    function test_AcceptOwnershipRevertUnauthorized() public {
        vm.prank(owner);
        configEnterprise.transferOwnership(newOwner);

        vm.prank(unauthorized);
        vm.expectRevert(EditionConfig.Unauthorized.selector);
        configEnterprise.acceptOwnership();
    }

    // =========================================================================
    // Edition Switch Tests
    // =========================================================================

    function test_SwitchEditionEnterpriseToDecentralized() public {
        vm.expectEmit(true, true, true, false);
        emit EditionChanged(EditionConfig.Edition.ENTERPRISE, EditionConfig.Edition.DECENTRALIZED, owner);

        vm.prank(owner);
        configEnterprise.switchEdition(EditionConfig.Edition.DECENTRALIZED);

        assertTrue(configEnterprise.isDecentralized());
        assertTrue(configEnterprise.isGovernanceEnabled());
        assertEq(
            uint256(configEnterprise.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE)
        );
    }

    function test_SwitchEditionDecentralizedToEnterprise() public {
        vm.expectEmit(true, true, true, false);
        emit EditionChanged(EditionConfig.Edition.DECENTRALIZED, EditionConfig.Edition.ENTERPRISE, owner);

        vm.prank(owner);
        configDecentralized.switchEdition(EditionConfig.Edition.ENTERPRISE);

        assertTrue(configDecentralized.isEnterprise());
        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.CONTRACT_BASED)
        );

        // Node config reset to fixed 4BFT
        EditionConfig.NodeConfig memory nodeConfig = configDecentralized.getNodeConfig();
        assertEq(nodeConfig.minNodes, 4);
        assertEq(nodeConfig.maxNodes, 4);
        assertFalse(nodeConfig.dynamicMembership);
    }

    function test_SwitchEditionRevertSameEdition() public {
        vm.prank(owner);
        vm.expectRevert(EditionConfig.SameEdition.selector);
        configEnterprise.switchEdition(EditionConfig.Edition.ENTERPRISE);
    }

    function test_SwitchEditionRevertUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert(EditionConfig.Unauthorized.selector);
        configEnterprise.switchEdition(EditionConfig.Edition.DECENTRALIZED);
    }

    // =========================================================================
    // Node Configuration Tests
    // =========================================================================

    function test_UpdateNodeConfigDecentralizedToDynamicPbft() public {
        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });

        vm.prank(owner);
        configDecentralized.updateNodeConfig(newConfig);

        EditionConfig.NodeConfig memory savedConfig = configDecentralized.getNodeConfig();
        assertEq(savedConfig.minNodes, 4);
        assertEq(savedConfig.maxNodes, 21);
        assertTrue(savedConfig.dynamicMembership);
        assertEq(uint256(savedConfig.consensus), uint256(EditionConfig.ConsensusType.DYNAMIC_PBFT));
    }

    function test_UpdateNodeConfigRevertMinNodesBelow4() public {
        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 3, // Invalid
            maxNodes: 4,
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(EditionConfig.InvalidNodeConfig.selector, "minNodes must be >= 4"));
        configDecentralized.updateNodeConfig(newConfig);
    }

    function test_UpdateNodeConfigRevertMaxBelowMin() public {
        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 8,
            maxNodes: 4, // Invalid: less than min
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(EditionConfig.InvalidNodeConfig.selector, "maxNodes must be >= minNodes"));
        configDecentralized.updateNodeConfig(newConfig);
    }

    function test_UpdateNodeConfigRevertMaxExceedsLimit() public {
        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 30, // Invalid: exceeds 21
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(EditionConfig.InvalidNodeConfig.selector, "maxNodes exceeds maximum for dynamic PBFT")
        );
        configDecentralized.updateNodeConfig(newConfig);
    }

    function test_UpdateNodeConfigRevertEnterpriseDynamicMembership() public {
        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 4,
            dynamicMembership: true, // Not allowed for Enterprise
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(EditionConfig.EnterpriseConstraintViolation.selector, "dynamic membership not allowed")
        );
        configEnterprise.updateNodeConfig(newConfig);
    }

    function test_UpdateNodeConfigRevertEnterpriseMaxNodes() public {
        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 8, // Not allowed for Enterprise
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(EditionConfig.EnterpriseConstraintViolation.selector, "max nodes must be 4")
        );
        configEnterprise.updateNodeConfig(newConfig);
    }

    function test_UpdateNodeConfigRevertEnterpriseConsensusType() public {
        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 4,
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT // Not allowed for Enterprise
        });

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(EditionConfig.EnterpriseConstraintViolation.selector, "only FIXED_4BFT allowed")
        );
        configEnterprise.updateNodeConfig(newConfig);
    }

    function test_UpdateNodeConfigRevertDynamicWithoutDynamicPbft() public {
        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 10,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT // Mismatch
        });

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(EditionConfig.InvalidNodeConfig.selector, "dynamic membership requires DYNAMIC_PBFT")
        );
        configDecentralized.updateNodeConfig(newConfig);
    }

    // =========================================================================
    // Prover Approval Mode Tests
    // =========================================================================

    function test_UpdateProverApprovalModeDecentralized() public {
        vm.expectEmit(true, true, true, false);
        emit ProverApprovalModeChanged(
            EditionConfig.ProverApprovalMode.FOUNDATION_INVITE,
            EditionConfig.ProverApprovalMode.COUNCIL_VOTE,
            owner
        );

        vm.prank(owner);
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);

        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.COUNCIL_VOTE)
        );
    }

    function test_UpdateProverApprovalModeToStakeAuto() public {
        vm.prank(owner);
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);

        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.STAKE_AUTO)
        );
    }

    function test_UpdateProverApprovalModeRevertEnterpriseNonContract() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                EditionConfig.InvalidProverApprovalMode.selector,
                EditionConfig.Edition.ENTERPRISE,
                EditionConfig.ProverApprovalMode.COUNCIL_VOTE
            )
        );
        configEnterprise.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);
    }

    function test_UpdateProverApprovalModeEnterpriseContractBased() public {
        // Should not revert when setting CONTRACT_BASED for Enterprise (even if already set)
        vm.prank(owner);
        configEnterprise.updateProverApprovalMode(EditionConfig.ProverApprovalMode.CONTRACT_BASED);

        assertEq(
            uint256(configEnterprise.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.CONTRACT_BASED)
        );
    }

    // =========================================================================
    // Governance Enabled Tests
    // =========================================================================

    function test_SetGovernanceEnabled() public {
        vm.expectEmit(false, false, false, true);
        emit GovernanceEnabledChanged(false, true);

        vm.prank(owner);
        configEnterprise.setGovernanceEnabled(true);

        assertTrue(configEnterprise.isGovernanceEnabled());
    }

    function test_SetGovernanceDisabled() public {
        vm.expectEmit(false, false, false, true);
        emit GovernanceEnabledChanged(true, false);

        vm.prank(owner);
        configDecentralized.setGovernanceEnabled(false);

        assertFalse(configDecentralized.isGovernanceEnabled());
    }

    // =========================================================================
    // View Function Tests
    // =========================================================================

    function test_IsEnterprise() public view {
        assertTrue(configEnterprise.isEnterprise());
        assertFalse(configDecentralized.isEnterprise());
    }

    function test_IsDecentralized() public view {
        assertFalse(configEnterprise.isDecentralized());
        assertTrue(configDecentralized.isDecentralized());
    }

    function test_IsDynamicMembershipEnabled() public view {
        assertFalse(configEnterprise.isDynamicMembershipEnabled());
        assertFalse(configDecentralized.isDynamicMembershipEnabled());
    }

    function test_GetConsensusType() public view {
        assertEq(uint256(configEnterprise.getConsensusType()), uint256(EditionConfig.ConsensusType.FIXED_4BFT));
        assertEq(uint256(configDecentralized.getConsensusType()), uint256(EditionConfig.ConsensusType.FIXED_4BFT));
    }

    function test_CalculateBftThreshold() public view {
        // For 4 nodes: (2*4 + 2) / 3 = 10/3 = 3
        assertEq(configEnterprise.calculateBftThreshold(), 3);
        assertEq(configDecentralized.calculateBftThreshold(), 3);
    }

    function test_CalculateBftThresholdDynamic() public {
        // Set up dynamic PBFT with 21 nodes
        EditionConfig.NodeConfig memory newConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });

        vm.prank(owner);
        configDecentralized.updateNodeConfig(newConfig);

        // For 21 nodes: (2*21 + 2) / 3 = 44/3 = 14
        assertEq(configDecentralized.calculateBftThreshold(), 14);
    }

    function test_IsProverApprovalModeAllowed() public view {
        // Enterprise only allows CONTRACT_BASED
        assertTrue(configEnterprise.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.CONTRACT_BASED));
        assertFalse(configEnterprise.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE));
        assertFalse(configEnterprise.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.COUNCIL_VOTE));
        assertFalse(configEnterprise.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.STAKE_AUTO));

        // Decentralized allows all
        assertTrue(configDecentralized.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.CONTRACT_BASED));
        assertTrue(configDecentralized.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE));
        assertTrue(configDecentralized.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.COUNCIL_VOTE));
        assertTrue(configDecentralized.isProverApprovalModeAllowed(EditionConfig.ProverApprovalMode.STAKE_AUTO));
    }

    function test_IsNodeConfigChangeValid() public view {
        EditionConfig.NodeConfig memory validConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 4,
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });

        (bool isValid, string memory reason) = configEnterprise.isNodeConfigChangeValid(validConfig);
        assertTrue(isValid);
        assertEq(reason, "");
    }

    function test_IsNodeConfigChangeValidInvalidMinNodes() public view {
        EditionConfig.NodeConfig memory invalidConfig = EditionConfig.NodeConfig({
            minNodes: 2,
            maxNodes: 4,
            dynamicMembership: false,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });

        (bool isValid, string memory reason) = configEnterprise.isNodeConfigChangeValid(invalidConfig);
        assertFalse(isValid);
        assertEq(reason, "minNodes must be >= 4");
    }

    // =========================================================================
    // Constants Tests
    // =========================================================================

    function test_Constants() public view {
        assertEq(configEnterprise.MIN_NODES(), 4);
        assertEq(configEnterprise.MAX_DYNAMIC_NODES(), 21);
        assertEq(configEnterprise.FIXED_NODE_COUNT(), 4);
    }

    // =========================================================================
    // Integration Tests
    // =========================================================================

    function test_FullPhaseTransitionDecentralized() public {
        // Phase 1-2: FOUNDATION_INVITE (default)
        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.FOUNDATION_INVITE)
        );

        // Phase 3: COUNCIL_VOTE
        vm.prank(owner);
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.COUNCIL_VOTE);
        assertEq(
            uint256(configDecentralized.getProverApprovalMode()),
            uint256(EditionConfig.ProverApprovalMode.COUNCIL_VOTE)
        );

        // Phase 4: STAKE_AUTO + DYNAMIC_PBFT
        EditionConfig.NodeConfig memory phase4Config = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 21,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.DYNAMIC_PBFT
        });

        vm.startPrank(owner);
        configDecentralized.updateNodeConfig(phase4Config);
        configDecentralized.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);
        vm.stopPrank();

        // Verify final state
        EditionConfig.Settings memory finalSettings = configDecentralized.getSettings();
        assertTrue(finalSettings.nodeConfig.dynamicMembership);
        assertEq(finalSettings.nodeConfig.maxNodes, 21);
        assertEq(uint256(finalSettings.nodeConfig.consensus), uint256(EditionConfig.ConsensusType.DYNAMIC_PBFT));
        assertEq(uint256(finalSettings.proverApprovalMode), uint256(EditionConfig.ProverApprovalMode.STAKE_AUTO));
    }

    function test_EnterpriseRemainsFrozen() public {
        // Enterprise should not be able to change to dynamic membership or non-contract approval

        // Try dynamic membership
        EditionConfig.NodeConfig memory dynamicConfig = EditionConfig.NodeConfig({
            minNodes: 4,
            maxNodes: 4,
            dynamicMembership: true,
            consensus: EditionConfig.ConsensusType.FIXED_4BFT
        });

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(EditionConfig.EnterpriseConstraintViolation.selector, "dynamic membership not allowed")
        );
        configEnterprise.updateNodeConfig(dynamicConfig);

        // Try non-contract prover approval
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                EditionConfig.InvalidProverApprovalMode.selector,
                EditionConfig.Edition.ENTERPRISE,
                EditionConfig.ProverApprovalMode.STAKE_AUTO
            )
        );
        configEnterprise.updateProverApprovalMode(EditionConfig.ProverApprovalMode.STAKE_AUTO);

        // Verify unchanged
        EditionConfig.Settings memory settings = configEnterprise.getSettings();
        assertFalse(settings.nodeConfig.dynamicMembership);
        assertEq(uint256(settings.proverApprovalMode), uint256(EditionConfig.ProverApprovalMode.CONTRACT_BASED));
    }
}
