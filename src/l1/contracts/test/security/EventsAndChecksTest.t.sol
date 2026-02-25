// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {L1Vault} from "../../src/L1Vault.sol";
import {QuantumShield} from "../../src/QuantumShield.sol";
import {VRFConsumer} from "../../src/VRFConsumer.sol";

/// @title EventsAndChecksTest - Security tests for events and zero-address checks
/// @notice SEC-002: Tests to verify proper event emission and input validation
/// @dev PIR-SEC-001 test cases for FIX-005 through FIX-011
contract EventsAndChecksTest is Test {
    L1Vault public vault;
    QuantumShield public quantumShield;
    VRFConsumer public vrfConsumer;
    
    address public owner;
    address public securityCouncil;
    address public newOwner;
    address public newCouncil;
    address public l1VaultAddress;

    // Events to test
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SecurityCouncilUpdated(address indexed previousCouncil, address indexed newCouncil);
    event VerifierUpdated(address indexed newVerifier);
    event L1VaultUpdated(address indexed oldVault, address indexed newVault);
    event VRFConfigUpdated(address coordinator, bytes32 keyHash, uint64 subscriptionId);

    function setUp() public {
        owner = makeAddr("owner");
        securityCouncil = makeAddr("securityCouncil");
        newOwner = makeAddr("newOwner");
        newCouncil = makeAddr("newCouncil");
        l1VaultAddress = makeAddr("l1Vault");

        // Deploy contracts
        vm.startPrank(owner);
        vault = new L1Vault(securityCouncil, address(0));
        quantumShield = new QuantumShield();
        vrfConsumer = new VRFConsumer(l1VaultAddress);
        vm.stopPrank();
    }

    // =========================================================================
    // TEST-SEC-003: Event Emission Tests
    // =========================================================================

    /// @notice Test L1Vault emits OwnershipTransferred event
    /// @dev FIX-005: L1Vault.sol - OwnershipTransferred event
    function test_L1Vault_OwnershipTransferred_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, newOwner);
        
        vm.prank(owner);
        vault.transferOwnership(newOwner);
        
        // Verify state change
        assertEq(vault.owner(), newOwner);
    }

    /// @notice Test L1Vault emits SecurityCouncilUpdated event
    /// @dev FIX-006: L1Vault.sol - SecurityCouncilUpdated event
    function test_L1Vault_SecurityCouncilUpdated_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit SecurityCouncilUpdated(securityCouncil, newCouncil);
        
        vm.prank(securityCouncil);
        vault.updateSecurityCouncil(newCouncil);
        
        // Verify state change
        assertEq(vault.securityCouncil(), newCouncil);
    }

    /// @notice Test QuantumShield emits OwnershipTransferred event
    /// @dev FIX-007: QuantumShield.sol - OwnershipTransferred event
    function test_QuantumShield_OwnershipTransferred_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, newOwner);
        
        vm.prank(owner);
        quantumShield.transferOwnership(newOwner);
        
        // Verify state change
        assertEq(quantumShield.owner(), newOwner);
    }

    /// @notice Test VRFConsumer emits OwnershipTransferred event
    /// @dev FIX-009: VRFConsumer.sol - OwnershipTransferred event
    function test_VRFConsumer_OwnershipTransferred_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, newOwner);
        
        vm.prank(owner);
        vrfConsumer.transferOwnership(newOwner);
        
        // Verify state change
        assertEq(vrfConsumer.owner(), newOwner);
    }

    // =========================================================================
    // TEST-SEC-004: Zero-Address Revert Tests
    // =========================================================================

    /// @notice Test L1Vault transferOwnership reverts on zero address
    function test_L1Vault_TransferOwnership_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(L1Vault.ZeroAddress.selector);
        vault.transferOwnership(address(0));
    }

    /// @notice Test L1Vault updateSecurityCouncil reverts on zero address
    function test_L1Vault_UpdateSecurityCouncil_RevertsOnZeroAddress() public {
        vm.prank(securityCouncil);
        vm.expectRevert(L1Vault.ZeroAddress.selector);
        vault.updateSecurityCouncil(address(0));
    }

    /// @notice Test QuantumShield transferOwnership reverts on zero address
    function test_QuantumShield_TransferOwnership_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(QuantumShield.ZeroAddress.selector);
        quantumShield.transferOwnership(address(0));
    }

    /// @notice Test QuantumShield setVerifier reverts on zero address
    /// @dev FIX-008: QuantumShield.sol - setVerifier zero-address check
    function test_QuantumShield_SetVerifier_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(QuantumShield.ZeroAddress.selector);
        quantumShield.setVerifier(address(0));
    }

    /// @notice Test VRFConsumer transferOwnership reverts on zero address
    function test_VRFConsumer_TransferOwnership_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(VRFConsumer.ZeroAddress.selector);
        vrfConsumer.transferOwnership(address(0));
    }

    /// @notice Test VRFConsumer setL1Vault reverts on zero address
    /// @dev FIX-010: VRFConsumer.sol - setL1Vault zero-address check
    function test_VRFConsumer_SetL1Vault_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(VRFConsumer.ZeroAddress.selector);
        vrfConsumer.setL1Vault(address(0));
    }

    /// @notice Test VRFConsumer setVRFConfig with zero coordinator address
    /// @dev FIX-010: VRFConsumer.sol - setVRFConfig zero-address check for coordinator
    function test_VRFConsumer_SetVRFConfig_RevertsOnZeroCoordinator() public {
        bytes32 keyHash = bytes32(uint256(1));
        uint64 subscriptionId = 1;
        
        vm.prank(owner);
        vm.expectRevert(VRFConsumer.ZeroAddress.selector);
        vrfConsumer.setVRFConfig(address(0), keyHash, subscriptionId);
    }

    // =========================================================================
    // Regression Tests: Ensure valid inputs still work
    // =========================================================================

    /// @notice Test L1Vault ownership transfer with valid address
    function test_L1Vault_TransferOwnership_ValidAddress() public {
        vm.prank(owner);
        vault.transferOwnership(newOwner);
        assertEq(vault.owner(), newOwner);
    }

    /// @notice Test L1Vault security council update with valid address
    function test_L1Vault_UpdateSecurityCouncil_ValidAddress() public {
        vm.prank(securityCouncil);
        vault.updateSecurityCouncil(newCouncil);
        assertEq(vault.securityCouncil(), newCouncil);
    }

    /// @notice Test QuantumShield setVerifier with valid address
    function test_QuantumShield_SetVerifier_ValidAddress() public {
        address newVerifier = makeAddr("newVerifier");
        
        vm.expectEmit(true, false, false, true);
        emit VerifierUpdated(newVerifier);
        
        vm.prank(owner);
        quantumShield.setVerifier(newVerifier);
        assertEq(quantumShield.verifier(), newVerifier);
    }

    /// @notice Test VRFConsumer setL1Vault with valid address
    function test_VRFConsumer_SetL1Vault_ValidAddress() public {
        address newVault = makeAddr("newVault");
        
        vm.expectEmit(true, true, false, true);
        emit L1VaultUpdated(l1VaultAddress, newVault);
        
        vm.prank(owner);
        vrfConsumer.setL1Vault(newVault);
        assertEq(vrfConsumer.l1Vault(), newVault);
    }

    /// @notice Test VRFConsumer setVRFConfig with valid addresses
    function test_VRFConsumer_SetVRFConfig_ValidAddresses() public {
        address coordinator = makeAddr("coordinator");
        bytes32 keyHash = bytes32(uint256(12345));
        uint64 subscriptionId = 42;
        
        vm.expectEmit(true, true, true, true);
        emit VRFConfigUpdated(coordinator, keyHash, subscriptionId);
        
        vm.prank(owner);
        vrfConsumer.setVRFConfig(coordinator, keyHash, subscriptionId);
        
        assertEq(vrfConsumer.vrfCoordinator(), coordinator);
        assertEq(vrfConsumer.keyHash(), keyHash);
        assertEq(vrfConsumer.subscriptionId(), subscriptionId);
    }

    // =========================================================================
    // Authorization Tests
    // =========================================================================

    /// @notice Test only owner can transfer L1Vault ownership
    function test_L1Vault_TransferOwnership_OnlyOwner() public {
        address attacker = makeAddr("attacker");
        
        vm.prank(attacker);
        vm.expectRevert(L1Vault.NotOwner.selector);
        vault.transferOwnership(newOwner);
    }

    /// @notice Test only security council can update security council
    function test_L1Vault_UpdateSecurityCouncil_OnlySecurityCouncil() public {
        address attacker = makeAddr("attacker");
        
        vm.prank(attacker);
        vm.expectRevert(L1Vault.NotSecurityCouncil.selector);
        vault.updateSecurityCouncil(newCouncil);
    }

    /// @notice Test only owner can transfer QuantumShield ownership
    function test_QuantumShield_TransferOwnership_OnlyOwner() public {
        address attacker = makeAddr("attacker");
        
        vm.prank(attacker);
        vm.expectRevert(QuantumShield.NotOwner.selector);
        quantumShield.transferOwnership(newOwner);
    }

    /// @notice Test only owner can set QuantumShield verifier
    function test_QuantumShield_SetVerifier_OnlyOwner() public {
        address attacker = makeAddr("attacker");
        address newVerifier = makeAddr("newVerifier");
        
        vm.prank(attacker);
        vm.expectRevert(QuantumShield.NotOwner.selector);
        quantumShield.setVerifier(newVerifier);
    }

    /// @notice Test only owner can transfer VRFConsumer ownership
    function test_VRFConsumer_TransferOwnership_OnlyOwner() public {
        address attacker = makeAddr("attacker");
        
        vm.prank(attacker);
        vm.expectRevert(VRFConsumer.NotOwner.selector);
        vrfConsumer.transferOwnership(newOwner);
    }
}
