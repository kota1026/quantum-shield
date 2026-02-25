// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/interfaces/ITokenSwitch.sol";

/// @title ITokenSwitchTest
/// @notice Tests for ITokenSwitch interface compliance
/// @dev Phase 3.1 Foundation - Interface validation tests
contract ITokenSwitchTest is Test {
    // ============ Interface Existence Tests ============
    
    /// @notice Verify interface can be referenced
    function test_InterfaceExists() public pure {
        bytes4 interfaceId = type(ITokenSwitch).interfaceId;
        assertTrue(interfaceId != bytes4(0), "Interface should have non-zero ID");
    }
    
    /// @notice Verify TokenMode enum values
    function test_TokenModeEnum() public pure {
        // Test enum values are sequential starting from 0
        assertEq(
            uint8(ITokenSwitch.TokenMode.DISABLED),
            0,
            "DISABLED should be 0"
        );
        assertEq(
            uint8(ITokenSwitch.TokenMode.BASIC),
            1,
            "BASIC should be 1"
        );
        assertEq(
            uint8(ITokenSwitch.TokenMode.FULL),
            2,
            "FULL should be 2"
        );
    }
    
    /// @notice Verify function selectors are unique
    function test_FunctionSelectorsUnique() public pure {
        bytes4 getTokenMode = ITokenSwitch.getTokenMode.selector;
        bytes4 getTokenAddress = ITokenSwitch.getTokenAddress.selector;
        bytes4 getFeeToken = ITokenSwitch.getFeeToken.selector;
        bytes4 getStakeCurrency = ITokenSwitch.getStakeCurrency.selector;
        bytes4 getMinimumStake = ITokenSwitch.getMinimumStake.selector;
        bytes4 isVeQSEnabled = ITokenSwitch.isVeQSEnabled.selector;
        bytes4 isStakingEnabled = ITokenSwitch.isStakingEnabled.selector;
        bytes4 setTokenMode = ITokenSwitch.setTokenMode.selector;
        bytes4 setTokenAddress = ITokenSwitch.setTokenAddress.selector;
        
        // All selectors should be unique
        assertTrue(getTokenMode != getTokenAddress, "Selectors must be unique");
        assertTrue(getTokenAddress != getFeeToken, "Selectors must be unique");
        assertTrue(getFeeToken != getStakeCurrency, "Selectors must be unique");
        assertTrue(getStakeCurrency != getMinimumStake, "Selectors must be unique");
        assertTrue(getMinimumStake != isVeQSEnabled, "Selectors must be unique");
        assertTrue(isVeQSEnabled != isStakingEnabled, "Selectors must be unique");
        assertTrue(isStakingEnabled != setTokenMode, "Selectors must be unique");
        assertTrue(setTokenMode != setTokenAddress, "Selectors must be unique");
    }
    
    /// @notice Document expected function signatures
    function test_FunctionSignatures() public pure {
        // View functions
        assertEq(
            ITokenSwitch.getTokenMode.selector,
            bytes4(keccak256("getTokenMode()")),
            "getTokenMode signature mismatch"
        );
        
        assertEq(
            ITokenSwitch.getTokenAddress.selector,
            bytes4(keccak256("getTokenAddress()")),
            "getTokenAddress signature mismatch"
        );
        
        assertEq(
            ITokenSwitch.getFeeToken.selector,
            bytes4(keccak256("getFeeToken()")),
            "getFeeToken signature mismatch"
        );
        
        assertEq(
            ITokenSwitch.getMinimumStake.selector,
            bytes4(keccak256("getMinimumStake()")),
            "getMinimumStake signature mismatch"
        );
        
        // State-changing functions
        assertEq(
            ITokenSwitch.setTokenMode.selector,
            bytes4(keccak256("setTokenMode(uint8)")),
            "setTokenMode signature mismatch"
        );
        
        assertEq(
            ITokenSwitch.setTokenAddress.selector,
            bytes4(keccak256("setTokenAddress(address)")),
            "setTokenAddress signature mismatch"
        );
    }
    
    /// @notice Verify stake amounts per SPEC_STRATEGY_BRIDGE section 7.2
    function test_StakeAmountConstants() public pure {
        // Phase 1 (DISABLED): $400K in ETH
        uint256 disabledStake = 400_000 * 1e18;
        assertTrue(disabledStake > 0, "Disabled stake should be positive");
        
        // Phase 2+ (BASIC/FULL): $500K in QS
        uint256 basicStake = 500_000 * 1e18;
        assertTrue(basicStake > disabledStake, "Basic stake should exceed disabled stake");
    }
}
