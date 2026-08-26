// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Groth16Verifier - BN254 Groth16 verification (M0.5 gas reference)
/// @notice Reference implementation of the on-chain half of the proof-wrapping
///         strategy selected in `docs/core/STARK_AIR_GAP_ANALYSIS.md` §8.
///
/// M0 and M0.5 established that a raw STARK proof is ~1.07 MB at best, so it
/// cannot be posted to L1; the recommended path (strategy A) wraps the STARK
/// in a SNARK whose proof is a constant 8 field elements. This contract is
/// the verifier that wrap would land on, and exists so **NFR-2 (proof-based
/// unlock ≤ 1M gas) can be measured rather than estimated** before the wrap
/// circuit itself is built.
///
/// The verification equation is the standard one:
///
///     e(-A, B) · e(alpha, beta) · e(L, gamma) · e(C, delta) == 1
///     L = IC[0] + sum_i IC[i+1] * input[i]
///
/// Cost drivers are the EIP-196/197 precompiles: one `ecMul` (6,000 gas) and
/// one `ecAdd` (150 gas) per public input, plus one `ecPairing` over 4 pairs
/// (45,000 + 4 * 34,000 gas). See `test/Groth16VerifierGas.t.sol` for the
/// measured totals.
///
/// @dev Not wired into any unlock path. `L1Vault` integration is M4, and only
///      after a real wrap circuit and its verifying key exist.
library Pairing {
    /// @notice BN254 base field modulus
    uint256 internal constant FIELD_MODULUS =
        21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct G1Point {
        uint256 x;
        uint256 y;
    }

    /// @notice G2 point; each coordinate is `a * i + b`, stored as [a, b]
    ///         to match the EIP-197 input encoding.
    struct G2Point {
        uint256[2] x;
        uint256[2] y;
    }

    error EcAddFailed();
    error EcMulFailed();
    error PairingFailed();

    /// @notice Additive inverse of a G1 point
    function negate(G1Point memory p) internal pure returns (G1Point memory) {
        if (p.x == 0 && p.y == 0) return G1Point(0, 0);
        return G1Point(p.x, FIELD_MODULUS - (p.y % FIELD_MODULUS));
    }

    /// @notice `ecAdd` precompile (0x06)
    function addition(G1Point memory p1, G1Point memory p2)
        internal
        view
        returns (G1Point memory r)
    {
        uint256[4] memory input = [p1.x, p1.y, p2.x, p2.y];
        bool ok;
        assembly ("memory-safe") {
            ok := staticcall(gas(), 0x06, input, 0x80, r, 0x40)
        }
        if (!ok) revert EcAddFailed();
    }

    /// @notice `ecMul` precompile (0x07)
    function scalarMul(G1Point memory p, uint256 s)
        internal
        view
        returns (G1Point memory r)
    {
        uint256[3] memory input = [p.x, p.y, s];
        bool ok;
        assembly ("memory-safe") {
            ok := staticcall(gas(), 0x07, input, 0x60, r, 0x40)
        }
        if (!ok) revert EcMulFailed();
    }

    /// @notice `ecPairing` precompile (0x08) over four pairs
    function pairingProduct4(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
    ) internal view returns (bool) {
        uint256[24] memory input;
        _writePair(input, 0, a1, a2);
        _writePair(input, 6, b1, b2);
        _writePair(input, 12, c1, c2);
        _writePair(input, 18, d1, d2);

        uint256[1] memory out;
        bool ok;
        assembly ("memory-safe") {
            ok := staticcall(gas(), 0x08, input, 0x300, out, 0x20)
        }
        if (!ok) revert PairingFailed();
        return out[0] == 1;
    }

    function _writePair(
        uint256[24] memory input,
        uint256 offset,
        G1Point memory p,
        G2Point memory q
    ) private pure {
        input[offset] = p.x;
        input[offset + 1] = p.y;
        input[offset + 2] = q.x[0];
        input[offset + 3] = q.x[1];
        input[offset + 4] = q.y[0];
        input[offset + 5] = q.y[1];
    }
}

/// @notice Groth16 verifier with a runtime-supplied verifying key.
/// @dev A production deployment hard-codes the key as constants (saving the
///      calldata and a few hundred gas); keeping it as an argument here lets
///      the gas test sweep the public-input count without redeploying, which
///      is the measurement M0.5 needs.
contract Groth16Verifier {
    using Pairing for *;

    /// @notice BN254 scalar field modulus; public inputs must be reduced.
    uint256 public constant SCALAR_MODULUS =
        21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        /// @dev `ic.length == publicInputs.length + 1`
        Pairing.G1Point[] ic;
    }

    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }

    error PublicInputCountMismatch();
    error PublicInputOutOfRange();

    /// @notice Verify a Groth16 proof.
    /// @param vk Verifying key for the wrapped circuit
    /// @param proof The proof (8 field elements)
    /// @param publicInputs Public inputs, each < SCALAR_MODULUS
    /// @return valid True if the pairing equation holds
    function verify(
        VerifyingKey calldata vk,
        Proof calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool valid) {
        if (vk.ic.length != publicInputs.length + 1) revert PublicInputCountMismatch();

        // L = IC[0] + sum IC[i+1] * input[i]
        Pairing.G1Point memory l = vk.ic[0];
        for (uint256 i = 0; i < publicInputs.length; i++) {
            if (publicInputs[i] >= SCALAR_MODULUS) revert PublicInputOutOfRange();
            l = Pairing.addition(l, Pairing.scalarMul(vk.ic[i + 1], publicInputs[i]));
        }

        return Pairing.pairingProduct4(
            Pairing.negate(proof.a),
            proof.b,
            vk.alpha,
            vk.beta,
            l,
            vk.gamma,
            proof.c,
            vk.delta
        );
    }
}
