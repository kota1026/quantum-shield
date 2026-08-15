// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

/// @notice Isolated cost of the two things a hash-based (FRI/STARK) verifier
///         must do on-chain, measured as marginal gas so calldata and call
///         overhead cancel out.
/// @dev Kept minimal on purpose: the question is not whether *our*
///      `FRIVerifier.sol` is correct, but whether the arithmetic floor of
///      on-chain hash-based verification fits the NFR-2 budget at all. If the
///      floor does not fit, no implementation of it does.
contract HashVerifierFloor {
    /// @notice Goldilocks prime, the field our AIRs use: 2^64 - 2^32 + 1.
    uint256 internal constant P = 18446744069414584321;

    /// @notice Walk `steps` levels of a keccak Merkle path.
    /// @dev This is the FRI query cost: every query opens a path per layer.
    function merklePath(bytes32 leaf, uint256 steps) external pure returns (bytes32 node) {
        node = leaf;
        for (uint256 i = 0; i < steps; i++) {
            node = keccak256(abi.encodePacked(node, node));
        }
    }

    /// @notice `n` SHA-256 precompile calls on a 64-byte input.
    /// @dev FIPS 205 defines SHA2 parameter sets alongside the SHAKE ones, and
    ///      the EVM has a SHA-256 precompile (0x02) but none for SHAKE256.
    ///      Whether route 1 can stay inside FIPS 205 — rather than substituting
    ///      KECCAK256 as SPHINCS-minus does — turns on this number.
    function sha256Calls(bytes32 seed, uint256 n) external pure returns (bytes32 h) {
        h = seed;
        for (uint256 i = 0; i < n; i++) {
            h = sha256(abi.encodePacked(h, h));
        }
    }

    /// @notice `n` keccak256 hashes of a 64-byte scratch buffer, no allocation.
    /// @dev The loop above pays `abi.encodePacked`'s memory allocation every
    ///      iteration, which a real verifier would not. These two measure the
    ///      intrinsic cost, which is what an optimized implementation
    ///      approaches — and what decides whether route 1 can stay on FIPS
    ///      205's own SHA2 parameter family.
    function keccakTight(bytes32 seed, uint256 n) external pure returns (bytes32 h) {
        h = seed;
        assembly {
            for { let i := 0 } lt(i, n) { i := add(i, 1) } {
                mstore(0x00, h)
                mstore(0x20, h)
                h := keccak256(0x00, 0x40)
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

    /// @notice Accept a proof-sized blob, so its calldata cost can be measured.
    /// @dev A STARK proof is tens to hundreds of KB (§8). Every byte of it is
    ///      paid for before the verifier executes a single opcode, so calldata
    ///      may bind harder than the verification itself.
    function acceptProof(bytes calldata proof) external pure returns (uint256) {
        return proof.length;
    }

    /// @notice `ops` Goldilocks multiply-accumulates.
    /// @dev This is the constraint-evaluation cost: the verifier evaluates the
    ///      AIR constraints at the out-of-domain point, which is a sum of
    ///      products over the trace columns.
    function fieldOps(uint256 seed, uint256 ops) external pure returns (uint256 acc) {
        acc = seed;
        for (uint256 i = 0; i < ops; i++) {
            acc = addmod(mulmod(acc, seed, P), i, P);
        }
    }
}

/// @title HashVerifierGasProbe - does a post-quantum on-chain verifier fit?
/// @notice `STARK_AIR_GAP_ANALYSIS.md` §8 chose a Groth16 wrap partly because
///         on-chain STARK verification gas was "未知数". §26/§27: that wrap
///         reintroduces an elliptic-curve assumption, which defeats the
///         protocol's whole premise. So the number matters after all.
///
/// This measures the floor — Merkle hashing plus field arithmetic — and
/// projects it onto realistic FRI parameters. Correctness of any particular
/// verifier is a separate question; this is about feasibility.
contract HashVerifierGasProbeTest is Test {
    HashVerifierFloor public floorProbe;

    /// @notice NFR-2's on-chain budget for one unlock.
    uint256 internal constant NFR2_BUDGET = 1_000_000;

    function setUp() public {
        floorProbe = new HashVerifierFloor();
    }

    /// @dev Marginal gas per unit, measured as the difference between two
    ///      sizes so the call and calldata overhead cancels.
    function _marginalMerkleGas() internal view returns (uint256 perStep) {
        uint256 a = gasleft();
        floorProbe.merklePath(bytes32(uint256(1)), 100);
        a = a - gasleft();

        uint256 b = gasleft();
        floorProbe.merklePath(bytes32(uint256(1)), 1100);
        b = b - gasleft();

        perStep = (b - a) / 1000;
    }

    function _marginalFieldGas() internal view returns (uint256 perOp) {
        uint256 a = gasleft();
        floorProbe.fieldOps(7, 100);
        a = a - gasleft();

        uint256 b = gasleft();
        floorProbe.fieldOps(7, 1100);
        b = b - gasleft();

        perOp = (b - a) / 1000;
    }

    function _marginalSha256Gas() internal view returns (uint256 perCall) {
        uint256 a = gasleft();
        floorProbe.sha256Calls(bytes32(uint256(1)), 100);
        a = a - gasleft();

        uint256 b = gasleft();
        floorProbe.sha256Calls(bytes32(uint256(1)), 1100);
        b = b - gasleft();

        perCall = (b - a) / 1000;
    }

    function _tightGas(bool useSha) internal view returns (uint256 perCall) {
        uint256 a = gasleft();
        if (useSha) floorProbe.sha256Tight(bytes32(uint256(1)), 100);
        else floorProbe.keccakTight(bytes32(uint256(1)), 100);
        a = a - gasleft();

        uint256 b = gasleft();
        if (useSha) floorProbe.sha256Tight(bytes32(uint256(1)), 1100);
        else floorProbe.keccakTight(bytes32(uint256(1)), 1100);
        b = b - gasleft();

        perCall = (b - a) / 1000;
    }

    /// @notice Intrinsic per-hash cost, which is what an optimized verifier
    ///         approaches. This decides whether route 1 must abandon FIPS 205's
    ///         hash family or only its signature budget.
    function testIntrinsicHashCostAndRoute1Fit() public {
        uint256 keccakTight = _tightGas(false);
        uint256 shaTight = _tightGas(true);

        emit log_named_uint("intrinsic keccak256 (64B)", keccakTight);
        emit log_named_uint("intrinsic sha256 precompile (64B)", shaTight);

        uint256 fullHashes = 2174;
        uint256 reducedHashes = uint256(14 * 13) + uint256(3 * 35 * 15) / 2 + uint256(3 * 8);

        emit log_string("--- 2-of-N (two signatures), intrinsic cost ---");
        emit log_named_uint("full FIPS 205, keccak", 2 * fullHashes * keccakTight);
        emit log_named_uint("full FIPS 205, sha256", 2 * fullHashes * shaTight);
        emit log_named_uint("reduced budget, keccak", 2 * reducedHashes * keccakTight);
        emit log_named_uint("reduced budget, sha256", 2 * reducedHashes * shaTight);
        emit log_named_uint("NFR-2 budget", NFR2_BUDGET);

        assertGt(keccakTight, 0);
        assertGt(shaTight, 0);
    }

    /// @notice Route 1: direct on-chain SLH-DSA verification, by parameter set.
    /// @dev Hash-call counts come from the structure `sphincs-m2` measures
    ///      natively (2,174 for SLH-DSA-128s: FORS k(1+a), d*len WOTS+ chain
    ///      steps averaged, and d*h' tree hashes). A reduced-height variant —
    ///      the deviation SPHINCS-minus takes — cuts the d-dependent terms.
    function testRoute1CostByParameterSet() public {
        uint256 perKeccak = _marginalMerkleGas();
        uint256 perSha256 = _marginalSha256Gas();

        emit log_named_uint("gas per keccak256 (64B)", perKeccak);
        emit log_named_uint("gas per sha256 precompile (64B)", perSha256);

        // Full FIPS 205 SLH-DSA-128s: h=63, d=7, h'=9, k=14, a=12, len=35, w=16
        uint256 fullHashes = 2174;
        // Reduced height (h=24, d=3, h'=8): FORS unchanged, d-terms shrink.
        uint256 reducedHashes = uint256(14 * 13) + uint256(3 * 35 * 15) / 2 + uint256(3 * 8);

        emit log_named_uint("full FIPS 205 (2^64 budget): hash calls", fullHashes);
        emit log_named_uint("reduced height (2^24 budget): hash calls", reducedHashes);

        emit log_string("--- one signature ---");
        emit log_named_uint("full, sha256", fullHashes * perSha256);
        emit log_named_uint("reduced, sha256", reducedHashes * perSha256);

        emit log_string("--- 2-of-N threshold (two signatures) ---");
        emit log_named_uint("full, sha256", 2 * fullHashes * perSha256);
        emit log_named_uint("reduced, sha256", 2 * reducedHashes * perSha256);
        emit log_named_uint("NFR-2 budget", NFR2_BUDGET);

        assertGt(perSha256, 0);
    }

    /// @notice Report the two unit costs, then project onto FRI parameters.
    function testHashBasedVerifierFloor() public {
        uint256 perHash = _marginalMerkleGas();
        uint256 perFieldOp = _marginalFieldGas();

        emit log_named_uint("gas per keccak Merkle step", perHash);
        emit log_named_uint("gas per Goldilocks mul-add", perFieldOp);

        // Production FRI security in this repo: 100 queries (§11).
        uint256 queries = 100;

        emit log_string("--- Merkle cost by trace size (100 queries, 1 opening/query) ---");
        for (uint256 logN = 12; logN <= 24; logN += 4) {
            uint256 hashes = queries * logN;
            emit log_named_uint(
                string.concat("2^", vm.toString(logN), " trace: gas"),
                hashes * perHash
            );
        }

        emit log_string("--- Constraint evaluation by AIR width ---");
        // Roughly a few field ops per column per constraint group; take 4 as a
        // deliberately optimistic floor.
        for (uint256 cols = 100; cols <= 2700; cols += 800) {
            emit log_named_uint(
                string.concat(vm.toString(cols), " columns: gas"),
                cols * 4 * perFieldOp
            );
        }

        assertGt(perHash, 0);
        assertGt(perFieldOp, 0);
    }

    /// @notice Transaction calldata cost per non-zero byte (EIP-2028).
    /// @dev Modeled, not measured. A forge test reaches the verifier through an
    ///      internal call, which pays memory-copy costs only — the 16 gas/byte
    ///      is charged when a *transaction* carries the proof, which is how it
    ///      arrives in production. Measuring inside the test would report ~1
    ///      and understate the real cost sixteenfold.
    uint256 internal constant CALLDATA_GAS_PER_BYTE = 16;

    /// @notice Proof calldata alone can exhaust the budget before the verifier
    ///         executes a single opcode.
    function testProofCalldataCost() public {
        emit log_string("--- transaction calldata gas by proof size (16 gas/byte) ---");
        for (uint256 kb = 16; kb <= 256; kb *= 2) {
            emit log_named_uint(
                string.concat(vm.toString(kb), " KB: gas"),
                kb * 1024 * CALLDATA_GAS_PER_BYTE
            );
        }

        uint256 maxBytes = NFR2_BUDGET / CALLDATA_GAS_PER_BYTE;
        emit log_named_uint("max proof bytes if calldata were the ONLY cost", maxBytes);
        assertLt(maxBytes, 64 * 1024, "a 64 KB proof cannot fit NFR-2 on calldata alone");
    }

    /// @notice Where the frontier actually is: what a hash-based verifier can
    ///         afford once calldata is paid for.
    /// @dev Reported rather than asserted pass/fail on one guess, because the
    ///      answer is a frontier, not a point. The assertion at the end pins
    ///      the one thing that is settled: this repo's production FRI
    ///      parameters (100 queries, §11) do not fit.
    function testFeasibilityFrontier() public {
        uint256 perHash = _marginalMerkleGas();
        uint256 perByte = CALLDATA_GAS_PER_BYTE;

        emit log_string("--- budget left for hashing, after proof calldata ---");
        for (uint256 kb = 8; kb <= 64; kb *= 2) {
            uint256 calldataGas = kb * 1024 * perByte;
            if (calldataGas >= NFR2_BUDGET) {
                emit log_named_uint(
                    string.concat(vm.toString(kb), " KB proof: OVER BUDGET on calldata alone, gas"),
                    calldataGas
                );
                continue;
            }
            uint256 left = NFR2_BUDGET - calldataGas;
            emit log_named_uint(
                string.concat(vm.toString(kb), " KB proof: keccak hashes affordable"),
                left / perHash
            );
        }

        // This repo's production setting: 100 queries over a 2^16 domain with
        // arity-2 folding needs the initial opening plus every folding layer.
        uint256 hashesPerQuery = 16 + (16 * 17) / 2; // trace opening + folds
        uint256 productionHashes = 100 * hashesPerQuery;
        uint256 productionGas = productionHashes * perHash;

        emit log_named_uint("production config: keccak hashes", productionHashes);
        emit log_named_uint("production config: hashing gas alone", productionGas);
        emit log_named_uint("NFR-2 budget", NFR2_BUDGET);

        assertGt(
            productionGas,
            NFR2_BUDGET,
            "if this now fits, revisit the route-2 decision"
        );
    }
}
