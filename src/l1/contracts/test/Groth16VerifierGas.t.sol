// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {Groth16Verifier, Pairing} from "../src/wrap/Groth16Verifier.sol";

/// @title Groth16VerifierGas - M0.5 NFR-2 measurement
/// @notice Measures the EVM gas of the on-chain half of the proof-wrapping
///         strategy (`docs/core/STARK_AIR_GAP_ANALYSIS.md` §8), so NFR-2
///         (proof-based unlock ≤ 1M gas) can be judged on a number rather
///         than a citation.
///
/// The verification is made to actually **succeed**, so every precompile runs
/// its full path: with `L = C = O` (the point at infinity) the equation
/// collapses to `e(-G1, G2) · e(G1, G2) = 1`, which holds. Public inputs
/// still drive a real `ecMul` + `ecAdd` each, because `IC[i] = O` and
/// `O * s = O` is a full precompile call.
///
/// Run: forge test --match-contract Groth16VerifierGas -vv
contract Groth16VerifierGasTest is Test {
    Groth16Verifier public verifier;

    /// @notice NFR-2: proof-based unlock must stay within 1M gas.
    uint256 internal constant NFR2_GAS_BUDGET = 1_000_000;

    function setUp() public {
        verifier = new Groth16Verifier();
    }

    /// @notice BN254 G1 generator
    function _g1() internal pure returns (Pairing.G1Point memory) {
        return Pairing.G1Point(1, 2);
    }

    /// @notice Point at infinity
    function _zeroG1() internal pure returns (Pairing.G1Point memory) {
        return Pairing.G1Point(0, 0);
    }

    /// @notice BN254 G2 generator, coordinates as [imaginary, real]
    function _g2() internal pure returns (Pairing.G2Point memory) {
        return Pairing.G2Point(
            [
                11559732032986387107991004021392285783925812861821192530917403151452391805634,
                10857046999023057135944570762232829481370756359578518086990519993285655852781
            ],
            [
                4082367875863433681332203403145435568316851327593401208105741076214120093531,
                8495653923123431417604973247489272438418190587263600148770280649306958101930
            ]
        );
    }

    /// @notice A key whose IC entries are all O, so `L` stays at infinity.
    function _vk(uint256 numInputs)
        internal
        pure
        returns (Groth16Verifier.VerifyingKey memory vk)
    {
        vk.alpha = _g1();
        vk.beta = _g2();
        vk.gamma = _g2();
        vk.delta = _g2();
        vk.ic = new Pairing.G1Point[](numInputs + 1);
        for (uint256 i = 0; i <= numInputs; i++) {
            vk.ic[i] = _zeroG1();
        }
    }

    /// @notice A = G1, B = G2, C = O — makes the pairing product equal 1.
    function _proof() internal pure returns (Groth16Verifier.Proof memory p) {
        p.a = _g1();
        p.b = _g2();
        p.c = _zeroG1();
    }

    function _inputs(uint256 n) internal pure returns (uint256[] memory xs) {
        xs = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            xs[i] = i + 1;
        }
    }

    function _measure(uint256 numInputs) internal view returns (uint256 gasUsed, bool ok) {
        Groth16Verifier.VerifyingKey memory vk = _vk(numInputs);
        Groth16Verifier.Proof memory proof = _proof();
        uint256[] memory inputs = _inputs(numInputs);

        uint256 before = gasleft();
        ok = verifier.verify(vk, proof, inputs);
        gasUsed = before - gasleft();
    }

    /// @notice The construction must genuinely verify, otherwise the numbers
    ///         below would be measuring an early exit.
    function testVerificationActuallySucceeds() public view {
        (, bool ok) = _measure(0);
        assertTrue(ok, "the reference pairing equation must hold");
    }

    /// @notice Sweep the public-input count and report gas.
    /// @dev FR-THRESH-1 needs roughly: the active-set commitment, the message
    ///      hash, the valid-signature count, and the lock/state root — a
    ///      handful of field elements. The sweep brackets that.
    function testGasByPublicInputCount() public {
        uint256[6] memory counts = [uint256(0), 1, 2, 4, 8, 16];

        for (uint256 i = 0; i < counts.length; i++) {
            (uint256 gasUsed, bool ok) = _measure(counts[i]);
            assertTrue(ok, "verification must succeed");

            emit log_named_uint("public inputs", counts[i]);
            emit log_named_uint("  gas", gasUsed);
        }
    }

    /// @notice The measurement that matters: a realistic wrapped-proof
    ///         verification must fit inside NFR-2's 1M gas budget with room
    ///         for the rest of the unlock transaction.
    function testFitsNfr2Budget() public {
        (uint256 gasUsed, bool ok) = _measure(8);
        assertTrue(ok, "verification must succeed");

        emit log_named_uint("Groth16 verify gas (8 public inputs)", gasUsed);
        emit log_named_uint("NFR-2 budget", NFR2_GAS_BUDGET);

        assertLt(gasUsed, NFR2_GAS_BUDGET, "wrapped-proof verification exceeds NFR-2");
    }

    /// @notice Marginal cost per public input, to size the public-input list.
    function testMarginalCostPerPublicInput() public {
        (uint256 gas0, ) = _measure(0);
        (uint256 gas8, ) = _measure(8);

        uint256 marginal = (gas8 - gas0) / 8;
        emit log_named_uint("marginal gas per public input", marginal);

        // One ecMul (6,000) + one ecAdd (150) plus calldata and loop overhead.
        assertGt(marginal, 6_000, "should be dominated by ecMul");
        assertLt(marginal, 12_000, "unexpected overhead per input");
    }
}
