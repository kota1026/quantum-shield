// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/L1Vault.sol";
import "../src/SPHINCSVerifier.sol";

/// @title L1Vault security-fix regression tests
/// @notice Regression coverage for the multi-agent audit remediations:
///   - QS-SEC-VAULT-001: executeUnlock rejects terminal SLASHED state (no second withdrawal)
///   - QS-SEC-VAULT-002: requestUnlockLegacy is disabled (recipient was not bound to the signed msg)
///   - QS-SEC-VAULT-003: the lock sender cannot challenge their own unlock
contract L1VaultSecurityFixesTest is Test {
    L1Vault public vault;
    SPHINCSVerifier public sphincsVerifier;

    address public admin = address(0xAD01);
    address public securityCouncil = address(0x5EC0);
    address public user1 = address(0x1111); // lock sender
    address public user2 = address(0x2222); // recipient
    address public challenger = address(0xC001);
    address public prover1 = address(0x5001);
    address public prover2 = address(0x5002);

    function setUp() public {
        vm.startPrank(admin);
        vm.deal(admin, 10 ether);
        sphincsVerifier = new SPHINCSVerifier();
        vault = new L1Vault(securityCouncil, address(sphincsVerifier));
        vault.registerProver{value: 1 ether}(prover1, _pk(1));
        vault.registerProver{value: 1 ether}(prover2, _pk(2));
        vm.stopPrank();

        vm.deal(user1, 100 ether);
        vm.deal(challenger, 100 ether);
    }

    function _pk(uint256 seed) internal pure returns (bytes memory k) {
        k = new bytes(32);
        for (uint256 i = 0; i < 32; i++) k[i] = bytes1(uint8(keccak256(abi.encodePacked(seed, i))[0]));
    }

    function _dpk() internal pure returns (bytes memory k) {
        k = new bytes(1952);
        for (uint256 i = 0; i < 1952; i++) k[i] = bytes1(uint8(i));
    }

    /// Lock 1 ETH (user1 -> user2) and move it to EMERGENCY_PENDING (challengeable).
    function _lockAndEmergency() internal returns (bytes32 lockId) {
        vm.prank(user1);
        lockId = vault.lock{value: 1 ether}(user2, _dpk());
        vm.prank(user1);
        vault.requestEmergencyUnlock{value: 0.5 ether}(lockId, user2);
    }

    // ── QS-SEC-VAULT-002 ────────────────────────────────────────────────
    function test_VAULT002_requestUnlockLegacy_isDisabled() public {
        bytes32[] memory smt = new bytes32[](0);
        bytes[] memory sigs = new bytes[](2);
        address[] memory provers = new address[](2);
        provers[0] = prover1;
        provers[1] = prover2;

        vm.prank(challenger);
        vm.expectRevert(
            bytes("requestUnlockLegacy disabled: use requestUnlock (recipient must be bound to the signed state root)")
        );
        vault.requestUnlockLegacy(bytes32(uint256(1)), challenger, smt, bytes32(uint256(2)), sigs, provers);
    }

    // ── QS-SEC-VAULT-003 ────────────────────────────────────────────────
    function test_VAULT003_selfChallenge_reverts() public {
        bytes32 lockId = _lockAndEmergency();
        uint256 bond = vault.calculateChallengeBond(1 ether);

        vm.prank(user1); // the lock sender challenging their own unlock
        vm.expectRevert(bytes("challenger must not be the lock sender"));
        vault.challenge{value: bond}(lockId, "fraud");
    }

    function test_VAULT003_nonSenderChallenge_succeeds() public {
        bytes32 lockId = _lockAndEmergency();
        uint256 bond = vault.calculateChallengeBond(1 ether);

        vm.prank(challenger);
        vault.challenge{value: bond}(lockId, "fraud");

        assertEq(
            uint256(vault.getChallenge(lockId).status),
            uint256(L1Vault.ChallengeStatus.PENDING),
            "third-party challenge should be accepted"
        );
    }

    // ── QS-SEC-VAULT-001 ────────────────────────────────────────────────
    function test_VAULT001_executeUnlock_revertsAfterSlash() public {
        bytes32 lockId = _lockAndEmergency();
        uint256 bond = vault.calculateChallengeBond(1 ether);

        vm.prank(challenger);
        vault.challenge{value: bond}(lockId, "fraud");

        // No defense; auto-resolve the challenge as valid -> lock becomes SLASHED.
        vm.warp(block.timestamp + 49 hours);
        vault.autoResolveChallenge(lockId);
        assertEq(
            uint256(vault.getLock(lockId).status),
            uint256(L1Vault.LockStatus.SLASHED),
            "lock should be SLASHED after valid auto-resolution"
        );

        // Past any unlock window, executeUnlock on a SLASHED lock must not pay out again.
        vm.warp(block.timestamp + 30 days);
        vm.expectRevert(L1Vault.LockAlreadyReleased.selector);
        vault.executeUnlock(lockId);
    }
}
