// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/L1Vault.sol";
import "../src/SchemeRegistry.sol";
import "../src/SPHINCSVerifier.sol";
import "../src/interfaces/ISignatureVerifier.sol";

/// @notice A second-scheme verifier used to prove hot-swap routing (crypto-agility, Move 2).
contract MockVerifier is ISignatureVerifier {
    bytes4 private _id;
    bool public result = true;

    constructor(bytes4 id) {
        _id = id;
    }

    function schemeId() external view returns (bytes4) {
        return _id;
    }

    function verify(bytes32, bytes calldata, bytes calldata) external view returns (bool) {
        return result;
    }

    function expectedPubKeyLen() external pure returns (uint256) {
        return 32;
    }

    function setResult(bool r) external {
        result = r;
    }
}

/// @title Crypto-agility (SchemeRegistry) tests — QS Move 2 P2
contract SchemeRegistryTest is Test {
    L1Vault vault;
    SPHINCSVerifier sphincs;
    SchemeRegistry registry;

    address gov = address(0x60F);
    address securityCouncil = address(0x5EC0);

    bytes4 constant SLH1 = 0x534c4831; // "SLH1" = SLH-DSA-SHAKE-128s (default)
    bytes4 constant MD65 = 0x4d443635; // "MD65" = ML-DSA-65 (example target)

    function setUp() public {
        sphincs = new SPHINCSVerifier();
        vault = new L1Vault(securityCouncil, address(sphincs)); // owner = this
        registry = new SchemeRegistry(gov);
    }

    // ── SchemeRegistry unit ────────────────────────────────────────────
    function test_setVerifier_bindsWhenSchemeMatches() public {
        vm.prank(gov);
        registry.setVerifier(SLH1, address(sphincs));
        assertEq(registry.verifierFor(SLH1), address(sphincs));
    }

    function test_setVerifier_revertsOnSchemeMismatch() public {
        // sphincs.schemeId() == SLH1, so registering it under MD65 must revert.
        vm.prank(gov);
        vm.expectRevert(abi.encodeWithSelector(SchemeRegistry.SchemeMismatch.selector, MD65, SLH1));
        registry.setVerifier(MD65, address(sphincs));
    }

    function test_setVerifier_onlyOwner() public {
        vm.expectRevert(SchemeRegistry.NotOwner.selector);
        registry.setVerifier(SLH1, address(sphincs));
    }

    // ── SPHINCSVerifier conformance ────────────────────────────────────
    function test_sphincs_schemeConformance() public view {
        assertEq(sphincs.schemeId(), SLH1);
        assertEq(sphincs.expectedPubKeyLen(), 32);
    }

    // ── L1Vault wiring & routing ───────────────────────────────────────
    function test_default_activeVerifier_isSphincs() public view {
        assertEq(vault.activeVerifier(), address(sphincs));
        assertEq(vault.activeSchemeId(), SLH1);
    }

    function test_hotSwap_routesToRegisteredVerifier() public {
        MockVerifier mock = new MockVerifier(MD65);
        vm.prank(gov);
        registry.setVerifier(MD65, address(mock));

        vault.setSchemeRegistry(address(registry));
        vault.setActiveSchemeId(MD65);

        assertEq(vault.activeVerifier(), address(mock), "should route to the hot-swapped verifier");
    }

    function test_registrySetButSchemeUnregistered_fallsBackToSphincs() public {
        // Registry set, but the active scheme (SLH1) is not registered in it -> fallback.
        vault.setSchemeRegistry(address(registry));
        assertEq(vault.activeVerifier(), address(sphincs));
    }

    function test_setSchemeRegistry_onlyOwner() public {
        vm.prank(address(0xBEEF));
        vm.expectRevert();
        vault.setSchemeRegistry(address(registry));
    }
}
