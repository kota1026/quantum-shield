// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IWrapVerifier} from "./ThresholdVerifier.sol";

/// @title Groth16WrapVerifier - IWrapVerifier over BN254 pairing precompiles
/// @notice On-chain half of the M0.5-impl wrap path: verifies a BN254
///         Groth16 proof whose two public inputs are the 128-bit halves of
///         ThresholdVerifier's publicInputsDigest, binding the wrapped
///         proof to the exact message and signer set.
/// @dev The verifying key is fixed at deployment (circuit-specific CRS).
///      Swapping in the real STARK-composition wrap circuit (the remaining
///      M0.5-impl work) changes only the key this contract is deployed
///      with — the verification equation, calldata encoding
///      (abi-encoded uint256[8]: A.x A.y B.x1 B.x0 B.y1 B.y0 C.x C.y) and
///      gas profile measured here carry over unchanged.
contract Groth16WrapVerifier is IWrapVerifier {
    /// @notice BN254 base field modulus.
    uint256 internal constant P =
        21888242871839275222246405745257275088696311157297823662689037894645226208583;
    /// @notice BN254 scalar field modulus.
    uint256 internal constant R =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    uint256 public immutable alphaX;
    uint256 public immutable alphaY;
    uint256 public immutable betaX1;
    uint256 public immutable betaX0;
    uint256 public immutable betaY1;
    uint256 public immutable betaY0;
    uint256 public immutable gammaX1;
    uint256 public immutable gammaX0;
    uint256 public immutable gammaY1;
    uint256 public immutable gammaY0;
    uint256 public immutable deltaX1;
    uint256 public immutable deltaX0;
    uint256 public immutable deltaY1;
    uint256 public immutable deltaY0;
    uint256 public immutable ic0X;
    uint256 public immutable ic0Y;
    uint256 public immutable ic1X;
    uint256 public immutable ic1Y;
    uint256 public immutable ic2X;
    uint256 public immutable ic2Y;

    error InvalidProofLength();

    /// @dev Gas bounds forwarded to the precompiles: a malformed point makes
    ///      a precompile consume everything it is given, so unbounded
    ///      forwarding would let an invalid proof burn the caller's whole
    ///      gas stipend (griefing). Generous multiples of the EIP-1108
    ///      costs (pairing: 45k + 34k/pair = 181k for 4 pairs).
    uint256 internal constant PAIRING_GAS = 400_000;
    uint256 internal constant ECMUL_GAS = 30_000;
    uint256 internal constant ECADD_GAS = 5_000;

    /// @param vk Verifying key words: alpha(2) || beta(4) || gamma(4) ||
    ///        delta(4) || ic0(2) || ic1(2) || ic2(2), G2 points in EVM
    ///        precompile order (x_c1, x_c0, y_c1, y_c0).
    constructor(uint256[20] memory vk) {
        alphaX = vk[0];
        alphaY = vk[1];
        betaX1 = vk[2];
        betaX0 = vk[3];
        betaY1 = vk[4];
        betaY0 = vk[5];
        gammaX1 = vk[6];
        gammaX0 = vk[7];
        gammaY1 = vk[8];
        gammaY0 = vk[9];
        deltaX1 = vk[10];
        deltaX0 = vk[11];
        deltaY1 = vk[12];
        deltaY0 = vk[13];
        ic0X = vk[14];
        ic0Y = vk[15];
        ic1X = vk[16];
        ic1Y = vk[17];
        ic2X = vk[18];
        ic2Y = vk[19];
    }

    /// @inheritdoc IWrapVerifier
    function verifyWrapped(bytes calldata proof, bytes32 publicInputsDigest)
        external
        view
        returns (bool)
    {
        if (proof.length != 256) revert InvalidProofLength();
        uint256[8] memory p = abi.decode(proof, (uint256[8]));

        // Public inputs: big-endian 128-bit halves of the digest (< r).
        uint256 d0 = uint256(publicInputsDigest) >> 128;
        uint256 d1 = uint256(publicInputsDigest) & type(uint128).max;

        // vk_x = ic0 + d0 * ic1 + d1 * ic2.
        (uint256 t1x, uint256 t1y, bool ok1) = _ecMul(ic1X, ic1Y, d0);
        if (!ok1) return false;
        (uint256 t2x, uint256 t2y, bool ok2) = _ecMul(ic2X, ic2Y, d1);
        if (!ok2) return false;
        (uint256 sx, uint256 sy, bool ok3) = _ecAdd(ic0X, ic0Y, t1x, t1y);
        if (!ok3) return false;
        (uint256 vx, uint256 vy, bool ok4) = _ecAdd(sx, sy, t2x, t2y);
        if (!ok4) return false;

        // e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1.
        uint256[24] memory input = [
            p[0],
            p[1] == 0 ? 0 : P - (p[1] % P),
            p[2],
            p[3],
            p[4],
            p[5],
            alphaX,
            alphaY,
            betaX1,
            betaX0,
            betaY1,
            betaY0,
            vx,
            vy,
            gammaX1,
            gammaX0,
            gammaY1,
            gammaY0,
            p[6],
            p[7],
            deltaX1,
            deltaX0,
            deltaY1,
            deltaY0
        ];
        uint256[1] memory out;
        bool ok;
        assembly {
            ok := staticcall(PAIRING_GAS, 0x08, input, 768, out, 32)
        }
        return ok && out[0] == 1;
    }

    function _ecMul(uint256 x, uint256 y, uint256 s)
        internal
        view
        returns (uint256 rx, uint256 ry, bool ok)
    {
        uint256[3] memory input = [x, y, s];
        uint256[2] memory out;
        assembly {
            ok := staticcall(ECMUL_GAS, 0x07, input, 96, out, 64)
        }
        (rx, ry) = (out[0], out[1]);
    }

    function _ecAdd(uint256 ax, uint256 ay, uint256 bx, uint256 by)
        internal
        view
        returns (uint256 rx, uint256 ry, bool ok)
    {
        uint256[4] memory input = [ax, ay, bx, by];
        uint256[2] memory out;
        assembly {
            ok := staticcall(ECADD_GAS, 0x06, input, 128, out, 64)
        }
        (rx, ry) = (out[0], out[1]);
    }
}
