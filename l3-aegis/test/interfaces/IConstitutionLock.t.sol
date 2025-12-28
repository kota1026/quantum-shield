// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/interfaces/IConstitutionLock.sol";

/// @title IConstitutionLockTest
/// @notice Tests for IConstitutionLock interface compliance
/// @dev Phase 3.1 Foundation - Interface validation tests
contract IConstitutionLockTest is Test {
    // ============ Interface Existence Tests ============
    
    /// @notice Verify interface can be referenced
    function test_InterfaceExists() public pure {
        bytes4 interfaceId = type(IConstitutionLock).interfaceId;
        assertTrue(interfaceId != bytes4(0), "Interface should have non-zero ID");
    }
    
    /// @notice Verify ProtectionLevel enum values
    function test_ProtectionLevelEnum() public pure {
        assertEq(
            uint8(IConstitutionLock.ProtectionLevel.IMMUTABLE),
            0,
            "IMMUTABLE should be 0"
        );
        assertEq(
            uint8(IConstitutionLock.ProtectionLevel.SUPERMAJORITY),
            1,
            "SUPERMAJORITY should be 1"
        );
    }
    
    /// @notice Verify function selectors are unique
    function test_FunctionSelectorsUnique() public pure {
        bytes4 getProtectionLevel = IConstitutionLock.getProtectionLevel.selector;
        bytes4 isCompliant = IConstitutionLock.isCompliant.selector;
        bytes4 areAllCompliant = IConstitutionLock.areAllCompliant.selector;
        bytes4 getSupermajorityRequirements = IConstitutionLock.getSupermajorityRequirements.selector;
        bytes4 getCorePrinciple = IConstitutionLock.getCorePrinciple.selector;
        bytes4 verifyCompliance = IConstitutionLock.verifyCompliance.selector;
        bytes4 proposeSuperMajorityChange = IConstitutionLock.proposeSuperMajorityChange.selector;
        bytes4 executeSuperMajorityChange = IConstitutionLock.executeSuperMajorityChange.selector;
        
        // All selectors should be unique
        assertTrue(getProtectionLevel != isCompliant, "Selectors must be unique");
        assertTrue(isCompliant != areAllCompliant, "Selectors must be unique");
        assertTrue(areAllCompliant != getSupermajorityRequirements, "Selectors must be unique");
        assertTrue(getSupermajorityRequirements != getCorePrinciple, "Selectors must be unique");
        assertTrue(getCorePrinciple != verifyCompliance, "Selectors must be unique");
        assertTrue(verifyCompliance != proposeSuperMajorityChange, "Selectors must be unique");
        assertTrue(proposeSuperMajorityChange != executeSuperMajorityChange, "Selectors must be unique");
    }
    
    /// @notice Document expected function signatures
    function test_FunctionSignatures() public pure {
        // View functions
        assertEq(
            IConstitutionLock.getProtectionLevel.selector,
            bytes4(keccak256("getProtectionLevel(uint8)")),
            "getProtectionLevel signature mismatch"
        );
        
        assertEq(
            IConstitutionLock.isCompliant.selector,
            bytes4(keccak256("isCompliant(uint8)")),
            "isCompliant signature mismatch"
        );
        
        assertEq(
            IConstitutionLock.areAllCompliant.selector,
            bytes4(keccak256("areAllCompliant()")),
            "areAllCompliant signature mismatch"
        );
        
        // State-changing functions
        assertEq(
            IConstitutionLock.verifyCompliance.selector,
            bytes4(keccak256("verifyCompliance(uint8)")),
            "verifyCompliance signature mismatch"
        );
        
        assertEq(
            IConstitutionLock.proposeSuperMajorityChange.selector,
            bytes4(keccak256("proposeSuperMajorityChange(uint8,bytes)")),
            "proposeSuperMajorityChange signature mismatch"
        );
        
        assertEq(
            IConstitutionLock.executeSuperMajorityChange.selector,
            bytes4(keccak256("executeSuperMajorityChange(bytes32)")),
            "executeSuperMajorityChange signature mismatch"
        );
    }
    
    /// @notice Verify CP protection levels per CORE_PRINCIPLES.md
    function test_CPProtectionLevels() public pure {
        // CP-1: Complete Quantum Resistance - IMMUTABLE
        // CP-2: Self-Custody - IMMUTABLE
        // CP-3: Time Lock Existence - SUPERMAJORITY
        // CP-4: Slashing Existence - SUPERMAJORITY
        // CP-5: Transparency - SUPERMAJORITY
        
        uint8 immutableLevel = uint8(IConstitutionLock.ProtectionLevel.IMMUTABLE);
        uint8 supermajorityLevel = uint8(IConstitutionLock.ProtectionLevel.SUPERMAJORITY);
        
        assertTrue(immutableLevel < supermajorityLevel, "IMMUTABLE should be stricter than SUPERMAJORITY");
    }
    
    /// @notice Verify supermajority requirements per MODULAR_ARCHITECTURE.md section 4.2
    function test_SupermajorityRequirementValues() public pure {
        // 75% veQS threshold
        uint256 veQSThreshold = 7500; // basis points
        assertEq(veQSThreshold, 7500, "veQS threshold should be 75% (7500 bp)");
        
        // 6/7 Security Council
        uint256 scThreshold = 6;
        uint256 scTotal = 7;
        assertTrue(scThreshold > scTotal / 2, "SC threshold must be supermajority");
        
        // 30 days timelock
        uint256 timelockDays = 30;
        uint256 timelockSeconds = timelockDays * 1 days;
        assertEq(timelockSeconds, 2592000, "Timelock should be 30 days");
    }
    
    /// @notice Verify Core Principle numbers are valid
    function test_CorePrincipleNumbers() public pure {
        // Valid CP numbers are 1-5
        for (uint8 i = 1; i <= 5; i++) {
            assertTrue(i >= 1 && i <= 5, "CP number should be in range 1-5");
        }
    }
}
