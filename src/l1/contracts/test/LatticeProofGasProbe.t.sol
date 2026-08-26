// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

/// @notice EVM cost of the arithmetic that ML-DSA verification and a lattice
///         proof verifier both rest on: multiplication in `Z_q`.
contract LatticeFloor {
    /// @notice ML-DSA / Dilithium modulus, 2^23 - 2^13 + 1.
    uint256 internal constant Q = 8380417;

    /// @notice `n` multiply-accumulates mod q, no allocation.
    /// @dev The unit both sides of the comparison are counted in: ML-DSA
    ///      verification needs 27,648 of them (§34.1), and a LaBRADOR verifier
    ///      — being linear in the statement — does work of the same order.
    function mulmodQ(uint256 seed, uint256 n) external pure returns (uint256 acc) {
        acc = seed;
        assembly {
            for { let i := 0 } lt(i, n) { i := add(i, 1) } {
                acc := addmod(mulmod(acc, seed, Q), i, Q)
            }
        }
    }

    /// @notice `n` SHA-256 precompile calls on a 64-byte scratch buffer.
    function sha256Tight(bytes32 seed, uint256 n) external view returns (bytes32 h) {
        h = seed;
        assembly {
            for { let i := 0 } lt(i, n) { i := add(i, 1) } {
                mstore(0x00, h)
                mstore(0x20, h)
                if iszero(staticcall(gas(), 0x02, 0x00, 0x40, 0x00, 0x20)) { revert(0, 0) }
                h := mload(0x00)
            }
        }
    }
}

/// @title LatticeProofGasProbe - would a lattice proof beat verifying ML-DSA
///        directly on-chain?
/// @notice §34 measured that ML-DSA verification is 27,648 multiplications mod
///         q against only 159 Keccak permutations — a 174:1 ratio saying a
///         *lattice-based* proof system fits the algebra better than a
///         hash-based STARK. That settles which proof system suits the
///         signature. It does not settle whether the resulting proof is worth
///         verifying on-chain, which is what this measures.
///
/// @dev The property that decides it: LaBRADOR is "transparent with linear
///      prover and verifier time, achieving sublinear proof size (O(log n))
///      through recursion" (zkSecurity, "Playing with LaBRADOR"). **Sublinear
///      proof, linear verifier.** A succinct proof whose verifier still does
///      work proportional to the statement saves bandwidth, not gas.
contract LatticeProofGasProbeTest is Test {
    LatticeFloor internal probe;

    /// @notice EIP-2028 non-zero calldata byte.
    uint256 internal constant CALLDATA_GAS_PER_BYTE = 16;
    /// @notice Ethereum block gas limit, for scale.
    uint256 internal constant BLOCK_GAS_LIMIT = 30_000_000;
    /// @notice LaBRADOR's ZK-enabled proof size (eprint 2026/1289).
    uint256 internal constant PROOF_KB = 110;

    /// @notice §34.1, measured by `dilithium-stark`'s `cost_axes`.
    uint256 internal constant MLDSA_MULMOD = 27_648;
    uint256 internal constant MLDSA_KECCAK = 159;

    function setUp() public {
        probe = new LatticeFloor();
    }

    function _marginalMulmodGas() internal view returns (uint256 perOp) {
        uint256 a = gasleft();
        probe.mulmodQ(7, 1_000);
        a = a - gasleft();

        uint256 b = gasleft();
        probe.mulmodQ(7, 11_000);
        b = b - gasleft();

        perOp = (b - a) / 10_000;
    }

    function _marginalHashGas() internal view returns (uint256 perCall) {
        uint256 a = gasleft();
        probe.sha256Tight(bytes32(uint256(1)), 100);
        a = a - gasleft();

        uint256 b = gasleft();
        probe.sha256Tight(bytes32(uint256(1)), 1_100);
        b = b - gasleft();

        perCall = (b - a) / 1_000;
    }

    function _directCost() internal view returns (uint256) {
        return MLDSA_MULMOD * _marginalMulmodGas() + MLDSA_KECCAK * _marginalHashGas();
    }

    /// @notice The baseline: verifying one ML-DSA signature directly on-chain.
    function testDirectMlDsaVerificationFloor() public {
        uint256 perMulmod = _marginalMulmodGas();
        uint256 perHash = _marginalHashGas();

        emit log_named_uint("gas per mulmod (mod q)", perMulmod);
        emit log_named_uint("gas per SHA-256 call", perHash);

        uint256 arithmetic = MLDSA_MULMOD * perMulmod;
        uint256 hashing = MLDSA_KECCAK * perHash;
        uint256 total = arithmetic + hashing;

        emit log_named_uint("arithmetic (27,648 mulmod)", arithmetic);
        emit log_named_uint("hashing (159 calls)", hashing);
        emit log_named_uint("direct ML-DSA floor", total);
        emit log_named_uint("percent of a block", (total * 100) / BLOCK_GAS_LIMIT);

        assertLt(total, BLOCK_GAS_LIMIT, "direct verification must fit a block");
    }

    /// @notice The break-even, stated as a requirement on the verifier rather
    ///         than a guess about it.
    function testBreakEvenAgainstDirectVerification() public {
        uint256 perMulmod = _marginalMulmodGas();
        uint256 direct = _directCost();
        uint256 calldataOnly = PROOF_KB * 1024 * CALLDATA_GAS_PER_BYTE;

        emit log_string("--- proof calldata alone (EIP-2028) ---");
        uint256[3] memory sizesKb = [uint256(58), 100, 110];
        for (uint256 i = 0; i < sizesKb.length; i++) {
            emit log_named_uint(
                string.concat(vm.toString(sizesKb[i]), " KB proof"),
                sizesKb[i] * 1024 * CALLDATA_GAS_PER_BYTE
            );
        }

        emit log_string("--- break-even ---");
        emit log_named_uint("direct verification, no proof", direct);
        emit log_named_uint("110KB calldata", calldataOnly);

        uint256 budgetLeft = direct - calldataOnly;
        uint256 opsAllowed = budgetLeft / perMulmod;
        emit log_named_uint("gas left for the verifier", budgetLeft);
        emit log_named_uint("mulmod ops the verifier may use", opsAllowed);
        emit log_named_uint("statement ops, for comparison", MLDSA_MULMOD);
        emit log_named_uint("verifier must be this many x lighter", MLDSA_MULMOD / opsAllowed);

        // What is established: the calldata for a 110 KB proof sits below the
        // direct cost, but within a factor of two of it — so the verifier has
        // to be several times lighter than the statement for the proof to pay.
        assertLt(calldataOnly, direct, "calldata alone is below the direct cost");
        assertGt(
            calldataOnly * 2,
            direct,
            "if calldata became negligible against direct cost, revisit this"
        );
    }

    /// @notice Where a proof does pay: the threshold. Direct verification is
    ///         linear in the number of signatures; a proof's calldata is not.
    function testWhereAProofStartsToPay() public {
        uint256 direct = _directCost();
        uint256 calldataOnly = PROOF_KB * 1024 * CALLDATA_GAS_PER_BYTE;

        emit log_string("--- direct verification by threshold size ---");
        for (uint256 n = 1; n <= 5; n++) {
            emit log_named_uint(string.concat(vm.toString(n), "-of-N"), n * direct);
        }
        emit log_named_uint("one proof's calldata, any N", calldataOnly);

        uint256 maxN = BLOCK_GAS_LIMIT / direct;
        emit log_named_uint("largest N direct verification fits in a block", maxN);
        assertGt(maxN, 1, "direct must handle at least a 2-of-N threshold");
    }
}
