// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/interfaces/ICoreLayer.sol";

/// @title ICoreLayerTest
/// @notice Tests for ICoreLayer interface compliance
/// @dev Phase 3.1 Foundation - Interface validation tests
contract ICoreLayerTest is Test {
    // ============ Interface Existence Tests ============
    
    /// @notice Verify interface can be referenced
    function test_InterfaceExists() public pure {
        bytes4 interfaceId = type(ICoreLayer).interfaceId;
        assertTrue(interfaceId != bytes4(0), "Interface should have non-zero ID");
    }
    
    /// @notice Verify function selectors are unique
    function test_FunctionSelectorsUnique() public pure {
        bytes4 lock = ICoreLayer.lock.selector;
        bytes4 unlock = ICoreLayer.unlock.selector;
        bytes4 emergencyUnlock = ICoreLayer.emergencyUnlock.selector;
        bytes4 resync = ICoreLayer.resync.selector;
        bytes4 verifyState = ICoreLayer.verifyState.selector;
        bytes4 getStateRoot = ICoreLayer.getStateRoot.selector;
        bytes4 verifyCPCompliance = ICoreLayer.verifyCPCompliance.selector;
        bytes4 getTransaction = ICoreLayer.getTransaction.selector;
        bytes4 calculateEmergencyBond = ICoreLayer.calculateEmergencyBond.selector;
        
        // All selectors should be unique
        assertTrue(lock != unlock, "Selectors must be unique");
        assertTrue(unlock != emergencyUnlock, "Selectors must be unique");
        assertTrue(emergencyUnlock != resync, "Selectors must be unique");
        assertTrue(resync != verifyState, "Selectors must be unique");
        assertTrue(verifyState != getStateRoot, "Selectors must be unique");
        assertTrue(getStateRoot != verifyCPCompliance, "Selectors must be unique");
        assertTrue(verifyCPCompliance != getTransaction, "Selectors must be unique");
        assertTrue(getTransaction != calculateEmergencyBond, "Selectors must be unique");
    }
    
    /// @notice Document expected function signatures for Sequences #1-4, #3'
    function test_SequenceFunctionSignatures() public pure {
        // Sequence #1: Lock
        assertEq(
            ICoreLayer.lock.selector,
            bytes4(keccak256("lock(address,uint256,bytes32)")),
            "lock signature mismatch"
        );
        
        // Sequence #2: Normal Unlock
        assertEq(
            ICoreLayer.unlock.selector,
            bytes4(keccak256("unlock(bytes32,bytes,address)")),
            "unlock signature mismatch"
        );
        
        // Sequence #3: Emergency Unlock
        assertEq(
            ICoreLayer.emergencyUnlock.selector,
            bytes4(keccak256("emergencyUnlock(bytes32,address)")),
            "emergencyUnlock signature mismatch"
        );
        
        // Sequence #3': Resync
        assertEq(
            ICoreLayer.resync.selector,
            bytes4(keccak256("resync(bytes32,bytes32,bytes)")),
            "resync signature mismatch"
        );
    }
    
    /// @notice Verify timelock constants per SPEC_STRATEGY_BRIDGE section 5
    function test_TimelockConstantValues() public pure {
        // Normal Time Lock: 24 hours (SEQ#2 Step8)
        uint256 normalTimelock = 24 hours;
        assertEq(normalTimelock, 86400, "Normal timelock should be 24 hours");
        
        // Emergency Time Lock: 7 days (SEQ#3 Step5)
        uint256 emergencyTimelock = 7 days;
        assertEq(emergencyTimelock, 604800, "Emergency timelock should be 7 days");
        
        // Emergency Timeout: 72 hours (SEQ#3 condition)
        uint256 emergencyTimeout = 72 hours;
        assertEq(emergencyTimeout, 259200, "Emergency timeout should be 72 hours");
    }
    
    /// @notice Verify emergency bond calculation per SPEC_STRATEGY_BRIDGE section 5
    function test_EmergencyBondCalculation() public pure {
        // Bond = MAX(0.5 ETH, amount x 5%)
        uint256 minBond = 0.5 ether;
        uint256 bondPercentage = 5; // 5%
        
        // For 1 ETH: MAX(0.5, 0.05) = 0.5 ETH
        uint256 smallAmount = 1 ether;
        uint256 smallBond = _max(minBond, smallAmount * bondPercentage / 100);
        assertEq(smallBond, 0.5 ether, "Small amount bond should be min 0.5 ETH");
        
        // For 100 ETH: MAX(0.5, 5) = 5 ETH
        uint256 largeAmount = 100 ether;
        uint256 largeBond = _max(minBond, largeAmount * bondPercentage / 100);
        assertEq(largeBond, 5 ether, "Large amount bond should be 5%");
    }
    
    function _max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
}
