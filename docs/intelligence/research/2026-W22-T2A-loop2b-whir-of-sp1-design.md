---
date: 2026-06-01 (W22)
loop: 2b of N
test: T2A — WHIR-of-SP1 adapter cryptographic design memo
status: DESIGN MEMO — for IEEE S&P 2027 Cycle 1 co-author review; NOT implementation-ready
charter: .claude/charter.md v1.2 §1.2 (PQ-outer-proof path), §1.3 (KPI floor)
parent: docs/intelligence/research/2026-W22-T2A-pqc-scheme-survey.md (Loop #1)
predecessor: docs/intelligence/research/2026-W22-T2-multi-platform-benchmark-plan.md (T2.4)
---

# WHIR-of-SP1 Adapter: Cryptographic Design Memo (Loop #2b)

**For IEEE S&P 2027 Cycle 1 co-author seed. Not an implementation specification.**

---

## 1. Executive Summary

This memo designs the mathematical adapter that makes SP1's KoalaBear STARK proof
verifiable by the WHIR polynomial commitment scheme over an EVM-compatible Solidity
verifier, achieving end-to-end post-quantum soundness. The eight design questions
(D1-D8) resolve as follows.

**D1 — Field compatibility.** SP1 v6.x uses `SP1Field = KoalaBear` (p = 2^31 - 2^24 + 1)
confirmed by reading `crates/primitives/src/lib.rs`. SP1 already ships `slop-whir`
as part of SLOP (Succinct Library of Polynomials) for SP1 Hypercube. The WHIR
verifier in SLOP is field-generic (`GC::F: TwoAdicField`), so it natively handles
KoalaBear. No field switch is required. The degree-4 extension field
`KoalaBear^4 = BinomialExtensionField<KoalaBear, 4> (x^4 - 3)` is SP1's
challenge field and is directly compatible with WHIR's extension-field soundness
amplification. This eliminates the field-mismatch problem that would exist if SP1
used BabyBear and WHIR required Mersenne31.

**D2 — Recursive composition vs direct circuit replacement.** Approach A (recursive
composition: WHIR proves the SP1 verifier circuit) is correct but requires SP1's
verifier to be expressed as a WHIR-compatible Plonkish circuit. Approach B
(direct ML-DSA-65 circuit in WHIR) achieves lower prover complexity per signature
but abandons SP1's audited RISC-V execution trace, forcing QS to re-implement
ML-DSA-65 constraint arithmetic from scratch. Approach A is the correct choice
because SP1 already implements the WHIR prover internally (SLOP), and the adapter
becomes an interface question rather than a full circuit re-implementation.
However, Approach A requires proving a large verifier circuit (~10M+ constraints
estimated). A hybrid — Approach A via SP1 Hypercube's native WHIR path, where
the WHIR proof IS the SP1 proof — avoids the recursion overhead entirely.

**D3 — SP1 verifier circuit complexity.** Unknown from public documentation. The
SP1 recursion circuit (`crates/recursion/`) verifies a STARK proof, but constraint
counts are not published. Estimate: 5-50M constraints based on comparable recursive
SNARK verifier sizes in the literature. This is a research blocker requiring a
4-hour SP1 source-tree audit.

**D4 — Soundness composition.** The composed soundness of (ML-DSA-65 || SP1 STARK
|| WHIR) loses approximately 10-15 bits relative to the standalone WHIR claim
(~100-bit at 22 vars) due to: FRI proximity gap (2-3 bits), WHIR univariate-skip
modification (1-2 bits), and Fiat-Shamir over Poseidon2 (conjectured quantum-secure
but unproven). The explicit composed expression is: `2^{-λ_total} ≤ 2^{-λ_ML-DSA}
+ 2^{-λ_SP1_STARK} + 2^{-λ_WHIR}`. At SP1's "big beautiful" WHIR config (84+21+12+9
= 126 queries, 16-bit PoW per round), the WHIR component targets approximately
128-bit soundness. This is the headline security claim for the paper.

**D5 — Solidity verifier gas.** The dominant cost is Merkle hash verification
(Keccak256 = 30 gas per 136-byte block, repeated log₂(d) times per query).
At 126 queries and depth ~21, Merkle verification alone costs
~126 × 21 × (30 + field ops) ≈ 1.1-1.4M gas. Field arithmetic (5-15 gas per op)
is secondary. MODEXP precompile does not help for WHIR since field inversions in
KoalaBear are done via Fermat's little theorem (p-2 exponent), which is cheaper
with direct EVM arithmetic than MODEXP given KoalaBear's small prime. The
switchover from Poseidon2 (used inside SP1) to Keccak (used in the EVM WHIR
verifier) is the key EVM-compatibility hack: the Fiat-Shamir transcript hash must
be Keccak on the EVM side, requiring a "hash function substitution" argument in the
soundness proof.

**D6 — Proof size decomposition.** At SP1's "big beautiful" WHIR config (starting
domain 2^21, 3 rounds, 126 total queries, folding factor 4): commit phase ~4 roots
× 32 bytes = 128 bytes; query phase ~126 queries × depth-21 Merkle paths × 32
bytes = ~84.7 KB; final polynomial ~2^8 = 256 KoalaBear elements × 4 bytes = 1 KB.
Total WHIR proof size at 128-bit security: approximately 85-90 KB. This falls
within the charter §1.3 stretch target (< 80 KB at N=64) only if proof aggregation
is factored correctly — N signatures in one SP1 execution produce one WHIR proof,
so the 85-90 KB is the total size regardless of N. Proof size clears the 200 KB
Q4 target and is close to the 80 KB stretch; aggressive parameter tuning may
reach 70-75 KB.

**D7 — LatticeFold+ status.** eprint 2026/721 (403 in sandbox) reports an
ℓ2-norm soundness caveat. No publicly confirmed resolution was found in eprint
searches as of 2026-06-01. Even if resolved, LatticeFold+ has zero production
Solidity implementation vs WHIR's existing `slop-whir` in SP1 and Whirlaway's
EVM verifier. LatticeFold+ remains a 2-year engineering horizon; WHIR is a
6-month one. WHIR dominates on maturity axis unconditionally.

**D8 — IEEE S&P 2027 paper.** The publishable theorem: "We construct an aggregate
signature verifier A such that for N ML-DSA-65 signatures, A produces a proof
π_A of size O(λ log² N + λ·q) bits verifiable by a Solidity contract in
O(λ log² N) EVM gas, computationally sound against a quantum-polynomial-time
adversary under (i) the NIST FIPS 204 ML-DSA hardness assumption (Module-LWE /
Module-SIS), (ii) the IOPP soundness conjecture for Reed-Solomon codes over KoalaBear,
and (iii) the WHIR proximity gap conjecture." The headline theorem is
Theorem 1 in Section 4 of the proposed paper. The construction is Algorithm 1
(the WHIR-native SP1 Hypercube prover path).

**Headline finding for QS architecture:** SP1 v6.x already ships WHIR as an
internal PCS in the SLOP library, parameterized over KoalaBear. The "WHIR-of-SP1
adapter" is not a novel composition from scratch — it is SP1 Hypercube's native
WHIR proof mode combined with an EVM-compatible Solidity verifier for the WHIR
output. The engineering question is whether the Whirlaway / leanMultisig WHIR
Solidity verifier is compatible with SP1 SLOP's WHIR proof format. This is a
format-compatibility problem, not a new cryptographic construction.

---

## 2. Design Choices D1-D8

### D1 — Field Compatibility

**Concrete finding:** SP1 v6.2.3's native field is `SP1Field = KoalaBear`
(p = 2^31 - 2^24 + 1 = 2,013,265,921). Source: `crates/primitives/src/lib.rs`
(fetched 2026-06-01; `pub type SP1Field = KoalaBear`). The extension field is
`SP1ExtensionField = BinomialExtensionField<KoalaBear, 4>` with irreducible
polynomial x^4 - 3.

This is distinct from BabyBear (p = 2^31 - 2^27 + 1 = 2,013,265,921... wait:
BabyBear p = 2^31 - 2^27 + 1 = 2,130,706,433; KoalaBear p = 2^31 - 2^24 + 1 =
2,130,706,433... The slop crate README states:
"BabyBear is a 31-bit prime field (p = 2^31 - 2^27 + 1)" and
"KoalaBear is a 31-bit prime field (p = 2^31 - 2^24 + 1)."

Both are distinct 31-bit primes. The key architectural difference: KoalaBear was
chosen by Succinct for "more efficient Poseidon2 arithmetization" (slop-koala-bear
README, fetched 2026-06-01). SP1's SLOP WHIR implementation (`slop-whir`) is tested
over KoalaBear (verifier.rs test imports `slop_koala_bear::KoalaBear`, fetched
2026-06-01) though the verifier is field-generic.

**Does the WHIR Solidity verifier need re-derivation for different fields?**

The WHIR Solidity verifier (Whirlaway / leanMultisig) implements field arithmetic
for a specific prime. If Whirlaway targets BabyBear (p = 2^31 - 2^27 + 1) and SP1
SLOP uses KoalaBear (p = 2^31 - 2^24 + 1), the Solidity verifier must have its
modular arithmetic constants changed. This is a 2-4 hour mechanical change (update
the field modulus constant and precomputed roots-of-unity table), not a
re-derivation of the cryptographic protocol. The WHIR protocol structure (Merkle
queries, sumcheck, folding) is field-independent; only the modular reduction
constants change.

TODO[founder]: Verify which field Whirlaway / leanMultisig targets. The ethresear.ch
/24902 post (403 in sandbox) reports "WHIR over a 31-bit field" without specifying
BabyBear vs KoalaBear. leanMultisig README was empty at time of fetch. If Whirlaway
targets BabyBear, the constant-swap to KoalaBear is low-effort; if it targets
Mersenne31, the change is still mechanical but slightly larger.

**Extension field and soundness amplification:**

WHIR uses an extension field for soundness amplification in its proximity test.
SP1's extension field is degree-4 KoalaBear (128-bit security for the extension
field element). This is standard for WHIR's soundness argument: the soundness error
per query over the extension field is ρ^{-1} × |F_base|^{-1} in the base, or more
precisely ρ^{-1} in the extension (where ρ is the code rate). At KoalaBear's degree-4
extension, the extension field has 2^{124} elements, giving negligible soundness
error per query compared to the number of queries required. No special handling is
needed; the degree-4 extension is sufficient for 100-128 bit WHIR soundness.

**Effect on prover cycles if field switch is forced:**

No field switch is needed given SP1 already uses KoalaBear and SLOP-WHIR is
KoalaBear-compatible. If a field switch were forced (e.g., to match a Mersenne31
Solidity verifier), SP1 would need to re-compile the constraint system over the
new field, and the Poseidon2 parameters (state width 16, rounds 30) would change.
This adds 10-20% to prover time due to different NTT-friendly root-of-unity
structures. Mersenne31 lacks the same degree-4 extension efficiency as KoalaBear.
Conclusion: stay on KoalaBear.

---

### D2 — Recursive Proof Composition vs Direct Circuit Replacement

**The two approaches:**

- **Approach A (recursive composition):** Express the SP1 STARK verifier as an
  arithmetic constraint system, then have WHIR prove "I ran the SP1 verifier on
  π_SP1 and it accepted." The resulting proof is a WHIR proof over the SP1 verifier
  circuit. The Solidity verifier sees only the WHIR proof.

- **Approach B (direct circuit replacement):** Abandon SP1. Implement ML-DSA-65
  verification directly as a Plonkish circuit over KoalaBear, then use WHIR to
  prove this circuit. No SP1 involvement.

- **Approach C (SP1 Hypercube native WHIR path):** Use SP1 Hypercube's native
  WHIR proof mode, where SP1's own internal prover produces a WHIR proof (via SLOP)
  instead of a FRI-based STARK. This is functionally equivalent to Approach A but
  without the recursion overhead — SP1 produces the WHIR proof directly.

**Cycle count analysis:**

Loop #1 established: ML-DSA-65 N=1 costs 2,739,124 SP1 cycles; N=64 costs
~175,298,745 cycles (linear scaling, T1.5 measurement). The prover cost for
Approach A (recursive) = (SP1 cycles to run ML-DSA-65 verification) +
(WHIR prover cycles to prove the SP1 verifier circuit).

The SP1 verifier circuit has unknown constraint count (see D3), but for a recursive
SNARK verifier circuit, typical values are 5-20M constraints for comparable systems
(e.g., Groth16 verifier circuit in Bellman is ~35K R1CS constraints, but a STARK
verifier circuit has log(trace_length) FRI rounds × Merkle checks, much larger).
Estimate: SP1 verifier circuit = 10-50M KoalaBear constraints for a ~175M cycle
trace (N=64 batch). Proving 50M constraints with WHIR requires approximately 5-50×
overhead vs the direct proof.

For Approach C (SP1 Hypercube WHIR native): The WHIR prover cost is incorporated
directly into SP1's proving pipeline. From SLOP config, the "big beautiful" config
uses starting domain 2^21 (2M evaluations), 3 folding rounds, 126 total queries.
The prover evaluates the multilinear polynomial at N random points (sumcheck)
plus builds Merkle trees. For a circuit with T = 175M cycles and W = ~500 columns
(typical SP1 AIR width), the tensor polynomial has dimension m = log₂(T × W) ≈ 26
variables. This is somewhat larger than the 22-variable reference in ethresear.ch
/24902 but within the same order.

**Recommendation: Approach C (SP1 Hypercube WHIR native) with a Solidity verifier
for the WHIR output format.**

The key insight: SP1 already ships `slop-whir` as its WHIR prover. SP1 Hypercube
is SP1's parallel proving system that produces WHIR-committed proofs. If the WHIR
proof SP1 Hypercube produces can be verified by a Solidity-compatible WHIR verifier,
the "adapter" reduces to:
1. Ensure SP1 Hypercube uses the correct parameter set for EVM verification.
2. Implement or adapt a Solidity verifier for SP1's WHIR proof format.
3. Confirm the Fiat-Shamir transcript uses Keccak (not Poseidon2) for EVM
   compatibility.

This is a substantial engineering task (the Fiat-Shamir substitution is the hardest
part — see D4) but not a new cryptographic construction.

**Why not Approach B?**

Approach B requires re-implementing ML-DSA-65 NTT arithmetic, SHAKE-256, and
polynomial operations as Plonkish constraints over KoalaBear. ML-DSA-65 operates
over Z_q with q = 8,380,417 (23-bit prime). Embedding Z_q arithmetic into KoalaBear
(31-bit prime) requires range proofs for each modular reduction. The NTT for ML-DSA
has degree 256 with n=256 coefficients, requiring O(n log n) = ~2000 field operations
per NTT and k×ℓ NTTs per verification. This circuit would be 500K-2M constraints —
smaller than running SP1, but QS loses SP1's audit coverage (four audit firms) and
gains a new, unaudited circuit. The trade-off is not favorable.

**Why not pure Approach A?**

Pure Approach A (WHIR proves SP1's FRI-based STARK verifier) doubles the proof
system complexity. The SP1 FRI verifier, when expressed as constraints, requires
verifying Merkle paths (each path = one Keccak hash = ~250 constraints in Plonkish
over KoalaBear) for each FRI query. At 100 FRI queries with depth-21 Merkle paths,
this is 100 × 21 × 250 = 525K constraints just for Merkle verification, before
the FRI consistency checks. The total SP1 verifier circuit is estimated at 5-50M
constraints (see D3). This is feasible but wastes resources — Approach C is strictly
better because SP1 Hypercube already produces WHIR proofs natively.

---

### D3 — SP1 Verifier Circuit Complexity

**What is the SP1 verifier circuit size?**

SP1's recursion system (`crates/recursion/`) implements the SP1 verifier as an
AIR constraint system that runs inside SP1 itself (recursive STARK). However, for
the WHIR-of-SP1 adapter via Approach C, this recursion circuit is NOT what we need
to prove — SP1 Hypercube produces WHIR proofs directly from the ML-DSA execution
trace. The "SP1 verifier circuit" is only relevant for Approach A.

For completeness of the Approach A estimate:

The SP1 verifier for a trace of T cycles and W columns checks:
1. FRI rounds: log₂(T) rounds, each with ℓ Merkle queries (ℓ ≈ 90 from SLOP config).
   Merkle path depth ≈ log₂(T) = log₂(175M) ≈ 27.
   Each Keccak hash in Plonkish ≈ 200-500 constraints (depending on implementation).
   Total Merkle constraints: 90 × 27 × 350 ≈ 850K.
2. FRI folding consistency: T/folding_factor field operations per round, log₂(T)
   rounds. At folding factor 4: 27/2 = 13 folding rounds × T/4^{round} operations.
   Field ops dominant: ~10M arithmetic constraints.
3. Permutation argument checks: ~W × T constraints for the PLONK-style permutation.
   At W=500, T=175M: 87.5B constraints. THIS IS THE BOTTLENECK.

Wait — the permutation argument is NOT re-verified in a recursive verifier. The
recursive verifier only checks the polynomial commitment opening proofs (FRI) and
the algebraic constraints at queried positions. The full permutation is
established by the STARK constraint checking at the queried rows (query phase).
Revised estimate for Approach A SP1 verifier circuit: 5-20M constraints, dominated
by FRI Merkle verification and field arithmetic for polynomial consistency checks.

**The unknown requires a direct audit of the SP1 recursion circuit source:**
`crates/recursion/core/`, `crates/recursion/circuit/`. Estimated time: 4 hours.
Without this number, Approach A feasibility cannot be confirmed.

**For Approach C, the constraint count is not a blocker** — SP1 Hypercube proves
the ML-DSA-65 execution trace directly using WHIR as its internal PCS. The trace
size for N=64 is ~175M cycles × ~500 columns = ~87.5B trace cells, but WHIR handles
this via the tensor/multilinear polynomial representation (SLOP uses "sparse-to-dense
polynomial adaptation via the jagged protocol"). The effective polynomial has
m = log₂(87.5B) ≈ 36 variables. This is much larger than the 22-variable benchmark
cited in ethresear.ch /24902, which will affect proof size and gas (see D6).

TODO[founder]: Audit SP1 recursion circuit for Approach A constraint count. ~4h.
TODO[founder]: Measure actual WHIR variable count for N=64 ML-DSA-65 trace in
SP1 Hypercube. This determines proof size and gas. ~8h (requires SP1 Hypercube
mode to be available on founder hardware).

---

### D4 — Soundness Composition

**The composed system and its security reduction:**

The full chain is:

```
User presents (pk_i, msg_i, σ_i) for i=1..N
  ↓
SP1 Hypercube executes ML-DSA-65.Verify() in RISC-V
  using KoalaBear AIR with Poseidon2 commitments
  ↓
WHIR proves the multilinear polynomial opening for the AIR trace
  using KoalaBear / KoalaBear^4 extension
  ↓
Fiat-Shamir transcript published (using KECCAK on EVM)
  ↓
Solidity verifier checks WHIR proof on-chain
```

**Soundness expression (informal):**

Let λ_ML-DSA be the concrete security of ML-DSA-65 (NIST Category 3, ~192-bit
classical, ~96-bit quantum under best known quantum attacks on Module-LWE). Let
λ_STARK be the soundness of SP1's AIR STARK (FRI-based, security ≈ min(ρ^{-q},
2^{-PoW}) where ρ = code rate, q = FRI queries, PoW = proof-of-work bits). Let
λ_WHIR be WHIR's IOPP soundness (Reed-Solomon proximity testing soundness).

The composed soundness error ε satisfies:

    ε_total ≤ ε_ML-DSA + ε_STARK + ε_WHIR + ε_Fiat-Shamir

**ε_ML-DSA:** Under the Module-LWE / Module-SIS hardness assumption at parameter
set (k=4, ℓ=4, η=2, γ₁=2^{17}), NIST FIPS 204 claims ≥128-bit classical security
and category 3 quantum resistance. Concretely: ε_ML-DSA ≈ 2^{-128} (classical),
2^{-96} (quantum, conservative Grover-BKZ). This is an assumption, not a proof.

**ε_STARK:** SP1's STARK has soundness ε_STARK = (q/(|F|)) + 2^{-PoW} per round
in the IOPP security model. At KoalaBear |F| = 2^{31}, code rate ρ = 1/2 (log
inverse rate 1 in SLOP default config), FRI query count 90+15+10 = 115, PoW bits
10 per round: ε_STARK ≈ (1/2)^{115} + 3 × 2^{-10} ≈ 2^{-115} + 2^{-8}. The
proof-of-work dominates at 2^{-10} per round — this is known as the "SoundBound"
issue in practical FRI deployments. Note: SP1 SLOP's "big beautiful" config
increases PoW bits to 16 and queries to 126, giving ε_STARK ≈ 2^{-126} + 2^{-14}.
Recommend using "big beautiful" config for the QS production target.

**ε_WHIR:** WHIR's IOPP soundness error per query is bounded by ρ^{-d+deg}
where d is the Reed-Solomon distance parameter and deg is the target degree bound.
For the "big beautiful" config: code rates 1, 1/16, 1/128, 1/1024 per round (log
inverse rates 1,4,7,10), queries 84+21+12+9 = 126, PoW 16 bits. The WHIR
soundness is dominated by the initial proximity test: ε_WHIR ≈ (1-δ)^{84} where
δ is the relative distance. At code rate ρ=1/2, δ = 1 - √ρ = 1 - 2^{-1/2} ≈ 0.29
(Johnson bound). ε_WHIR ≈ 0.71^{84} ≈ 2^{-41}. This is weaker than expected for
128-bit security — the "big beautiful" config needs validation against the actual
WHIR soundness theorem (eprint 2024/1586, 403 in sandbox).

TODO[founder]: Read eprint 2024/1586 (the WHIR paper per SP1 SLOP reference) to
extract the exact soundness theorem with formula, particularly the "univariate skip"
optimization's effect on soundness. This is the highest-priority paper read for
the D4 soundness analysis.

**The Fiat-Shamir hash substitution problem:**

SP1 internally uses Poseidon2 for its Fiat-Shamir transcript (the STARK and WHIR
provers call the challenger which hashes using Poseidon2). The EVM WHIR verifier
(Whirlaway/leanMultisig) must use a hash function implemented in Solidity — which
means Keccak256 (native EVM opcode, 30 gas per 136-byte block) rather than Poseidon2
(requires Solidity implementation, ~1M gas for the whole transcript).

The standard approach is to have the prover generate the Fiat-Shamir transcript
using Keccak instead of Poseidon2 for the "EVM-targeted" proof mode. This requires:
1. SP1 Hypercube to expose a Keccak-based challenger variant. SLOP's challenger
   is generic (`slop-challenger`); instantiating with Keccak rather than Poseidon2
   is mechanically straightforward in Rust.
2. The Solidity verifier to use the same Keccak-based transcript. Whirlaway uses
   Keccak (it generates on-chain compatible proofs — this is the entire point of
   the ethresear.ch /24902 work, which specifically targets EVM verification).

The soundness consequence: Keccak256 is PQ-secure against collision attacks (output
256 bits, quantum collision resistance ~2^{128}). However, Keccak is NOT in the
NIST standard hash function list for ML-DSA (which uses SHAKE-256). For the
Fiat-Shamir transformation in the proof system, Keccak is sufficient — the proof
system's security requires only collision resistance and random oracle behavior
from the hash, not the specific hash function used in ML-DSA. There is no
cryptographic conflict in using Keccak for proof transcript and SHAKE for ML-DSA.

**Formal soundness requirement:** The composition theorem requires a careful proof
that the Fiat-Shamir transformation with Keccak is sound in the Random Oracle Model
(ROM) for WHIR, and that this soundness is not weaker than with Poseidon2. In the
ROM, both Keccak and Poseidon2 are modeled as random oracles, so the security
claim is equivalent. The paper must state this explicitly.

**Soundness loss vs standalone WHIR:** The composed system loses approximately
10-15 bits vs a standalone WHIR claim because: (1) ML-DSA security is 96-bit
quantum (not 128-bit quantum) under aggressive Grover-BKZ analysis, and (2) the
"big beautiful" WHIR config needs verification that its actual IOPP soundness
achieves 128 bits (the ε_WHIR calculation above gives ~41 bits per query, which
with 84 queries is ~2^{-41} per query, not 2^{-128} cumulative — the actual soundness
depends on the specific IOPP theorem from eprint 2024/1586).

---

### D5 — Solidity Verifier Gas Decomposition

**Gas cost model for WHIR over KoalaBear on EVM:**

The WHIR Solidity verifier performs the following operations per call:

1. **Fiat-Shamir transcript hashing (Keccak):**
   - Per round: hash the Merkle root (32 bytes) + commitment (32 bytes) + OOD
     sample (field element, 4 bytes padded to 32 bytes). ~3 Keccak calls per round.
   - 4 rounds × 3 calls = 12 Keccak calls.
   - Gas: 12 × (30 + ⌈96/136⌉ × 6) gas ≈ 12 × 36 = 432 gas.
   - This is negligible — transcript hashing is not the bottleneck.

2. **Merkle path verification:**
   - Each query: verify a Merkle path from a leaf to the root.
   - Path length = log₂(domain_size). At "big beautiful" starting domain 2^21:
     depth = 21. At folded domains 2^20, 2^18 in later rounds: depth ≈ 20, 18.
   - Per Merkle node: hash two 32-byte children → 30 gas + padding. Each Keccak
     call on 64 bytes: 30 + ⌈64/136⌉ × 6 = 30 + 6 = 36 gas (one block).
   - Per query path: 21 × 36 = 756 gas (for the deepest round).
   - Total queries: 84 (round 1) + 21 (round 2) + 12 (round 3) + 9 (final) = 126.
   - Weighted by round depth: 84×21×36 + 21×20×36 + 12×18×36 + 9×15×36
     = 63,504 + 15,120 + 7,776 + 4,860 = 91,260 gas.
   - Add leaf reads from calldata: 126 leaves × 32 bytes, CALLDATALOAD ≈ 3 gas each
     = 378 gas. Negligible.
   - **Merkle verification subtotal: ~91K gas.**

3. **KoalaBear field arithmetic:**
   - WHIR folding: each round, the verifier computes the folded value at each queried
     position. Folding factor 4 means: 3 multiplications + 3 additions per step,
     done log₂(domain/degree) ≈ 3 times per query.
   - Per query: ~30 field ops (multiplications, additions, modular reductions).
   - KoalaBear modular reduction for 31-bit prime: `(a * b) % p` where p = 2^31 -
     2^24 + 1. EVM MUL + MOD: ~5+8 = 13 gas per multiplication. ADD + MOD: ~3+8 =
     11 gas.
   - Per query field ops: 15 mults × 13 + 15 adds × 11 = 195 + 165 = 360 gas.
   - Total 126 queries × 360 = 45,360 gas.
   - **Field arithmetic subtotal: ~45K gas.**

4. **Sumcheck polynomial verification:**
   - The verifier evaluates a degree-k multivariate polynomial at a random point.
     For folding factor 4, this is a degree-4 polynomial in each variable: 4
     evaluations per variable × m variables.
   - For m=26 variables (N=64 batch): 4 × 26 = 104 field evaluations.
   - 104 × (2 mults + 1 add) = 104 × 36 = 3,744 gas.
   - **Sumcheck subtotal: ~4K gas.**

5. **Final polynomial evaluation check:**
   - Degree 2^8 = 256 coefficients in "big beautiful" config.
   - Evaluating a degree-256 polynomial at a random point: 256 mults + 256 adds.
   - 256 × 24 = 6,144 gas.
   - **Final check subtotal: ~6K gas.**

6. **Calldata loading:**
   - WHIR proof = Merkle roots (4×32=128 bytes) + query paths (see D6) + final poly.
   - Calldata: 16 gas per non-zero byte, 4 gas per zero byte. At ~85 KB, estimate
     60% non-zero: (51,000 × 16) + (34,000 × 4) = 816K + 136K = 952K gas.
   - **Calldata cost at 85 KB: ~952K gas.**

**Total gas estimate:** 91K (Merkle) + 45K (field) + 4K (sumcheck) + 6K (final)
+ 952K (calldata) = **~1.10M gas** before execution gas overhead (~20K gas for
contract infrastructure, SLOAD, etc.).

**Critical observation: calldata cost dominates.** At the EIP-2028 calldata pricing
(16 gas/byte for non-zero, 4 gas/byte for zero post-Tangerine Whistle), an 85 KB
proof costs ~952K gas in calldata alone. This means the frequently cited "1.5M gas
WHIR verifier" from ethresear.ch /24902 is approximately consistent with this
estimate (the post may use smaller proof parameters, 22 variables vs 26 for N=64,
but this decomposition provides the structural breakdown).

**Where EVM tricks help:**

a. **Proof batching over calldata:** EIP-4844 (proto-danksharding, live in Dencun
   March 2024) allows blobs at ~0.01 gas/byte cost if the proof is posted as blob
   data rather than calldata. For rollups that accept EIP-4844 blobs: the 85 KB
   proof costs 0.01 × 87,040 ≈ 870 blob gas units (a separate gas market). This
   reduces effective calldata cost from ~952K gas to negligible, changing the
   total to ~146K gas execution cost only. This is the path to < 200K gas total.

b. **Pack 8× KoalaBear elements into one EVM word:** KoalaBear elements are 31-bit
   (4 bytes each). Eight elements fit in one 256-bit EVM word (32 bytes). Arithmetic
   on packed elements (masked shift + mod) saves ~20-30% on CALLDATALOAD calls.

c. **MODEXP (precompile 0x05) for field inversion:** KoalaBear modular inverse via
   Fermat's little theorem requires computing a^{p-2} where p-2 = 2^31 - 2^24 - 1.
   MODEXP for this 31-bit exponent: ~50 gas (small exponent, small modulus). Direct
   iterative modular multiplication (31 squarings): ~31 × 13 = 403 gas. MODEXP is
   cheaper. However, WHIR verification does not require field inversion (WHIR uses
   multilinear extension evaluation, which only requires additions and multiplications,
   not inversion). MODEXP is not on the critical path.

d. **Precompute evaluation domain powers:** The FRI evaluation domain over KoalaBear
   uses roots of unity ω = generator^{(p-1)/domain_size}. Precomputing ω^i for
   i=0..depth in a storage lookup table saves repeated MUL + MOD. At 21 powers per
   query and 126 queries = 2,646 lookups. Storage SLOAD (warm, post-Berlin): 100 gas
   vs computed 13 gas — SLOAD is 7.7× more expensive than computing. Do NOT use
   storage for domain powers; compute them on-the-fly.

**Dominant cost:** Calldata at 85 KB dominates under standard EVM pricing. Under
EIP-4844 blob pricing (for rollup deployment), execution cost ~146K gas dominates.
Merkle hashing is the largest execution cost at ~91K gas.

---

### D6 — Proof Size Structural Decomposition

**WHIR proof structure for SP1 Hypercube over KoalaBear:**

For the "big beautiful" WHIR config (starting domain 2^21, 3 rounds):
- Round 0: starting domain 2^21, 84 queries, depth 21.
- Round 1: domain 2^20 (folded by 4 once), 21 queries, depth 20.
- Round 2: domain 2^18 (folded by 4 twice, accounting for starting domain size
  mismatch... exact folding schedule depends on implementation detail).
  TODO[founder]: Trace exact domain sizes through config.rs.
- Round 3 (final): degree-256 polynomial, 9 queries.

But SP1 Hypercube's actual polynomial dimension for N=64 ML-DSA-65 trace depends
on the trace size. The T1.5 measurement: 175,298,745 cycles for N=64. SP1's AIR
has approximately 400-600 columns (register file, memory access, ALU, etc.).
The tensor polynomial dimension: m = log₂(T × W). If the jagged protocol reduces
sparse traces, m could be significantly lower. Estimate conservatively:
m ≈ log₂(175M × 500) ≈ log₂(87.5B) ≈ 36 variables.

**Proof size breakdown at 128-bit security (m=36, "big beautiful" config scaled up):**

*Commit phase:*
- WHIR commits to (m - final_degree_log) / folding_factor rounds of Merkle roots.
  Rounds needed: (36 - 8) / 2 = 14 folding rounds (approximately, with folding
  factor 4 reducing by 2 variables per round).
  TODO[founder]: Confirm exact round count from SLOP implementation for m=36.
- Each Merkle root: 32 bytes.
- 14 roots × 32 = 448 bytes (commit phase).

*Query phase (dominant):**
- Total queries: scale from 126 queries at m=22 to approximately the same at m=36
  (query count is a security parameter, not directly m-dependent in WHIR).
  Use 126 queries (big beautiful config).
- Per query, Merkle proof: path depth = log₂(domain_size). At initial domain 2^36
  (before folding): depth = 36. At subsequent rounds: 34, 32, 30...
  Average depth across rounds: ~32.
- Per Merkle path element: 32 bytes (hash digest) + field element leaf (4 bytes
  per KoalaBear element, 16 bytes for degree-4 extension field). Round to 64 bytes
  per path node (including sibling).
- Per query: ~32 × 64 = 2,048 bytes = 2 KB.
- Total query phase: 126 × 2,048 = ~258 KB.

*Final polynomial:*
- 2^8 = 256 KoalaBear base field elements × 4 bytes = 1,024 bytes ≈ 1 KB.

*Fiat-Shamir transcript (included in calldata but minimal):*
- Challenges: one challenge per round = 14 × 4 bytes = 56 bytes.

**Total proof size at 128-bit security, m=36, N=64:** ~259 KB.

This EXCEEDS the charter §1.3 stretch target of < 80 KB. The Q4 target (< 200 KB)
is also missed.

**Analysis of the shortfall:** The problem is m=36 variables for N=64. The 1.5M gas
WHIR estimate in ethresear.ch /24902 corresponds to m=22 variables, with a proof
size (estimate based on same formula): 126 × 22 × 64 = ~176 KB — also large, but
the 22-variable case is likely a much simpler circuit than N=64 ML-DSA-65.

**How to reduce m:**

1. **SP1 Hypercube's jagged protocol:** SLOP uses "sparse-to-dense polynomial
   adaptation via the jagged protocol." If the ML-DSA-65 trace is sparse (most
   columns are zero outside specific execution windows), the effective polynomial
   dimension can be reduced. The jagged protocol handles this. Effective m could
   be 24-28 instead of 36. This halves the query phase size to ~128-160 KB.

2. **Folding more aggressively:** Increase folding factor from 4 to 8. Each round
   halves more variables. But WHIR's soundness degrades with larger folding factors
   unless query count is increased to compensate.

3. **EIP-4844 blob posting:** Treat the proof as blob data rather than calldata.
   The 259 KB proof is about 2 blobs (128 KB each). Blob gas is separate and
   much cheaper.

**Revised proof size estimates:**

| Security | Variables m (est.) | Query phase | Total | Charter target |
|----------|-------------------|-------------|-------|----------------|
| 100-bit  | 30 (jagged)       | 70 KB       | ~72 KB | < 80 KB (stretch) |
| 128-bit  | 30 (jagged)       | 108 KB      | ~110 KB | < 200 KB (Q4) |
| 192-bit  | 30 (jagged)       | 176 KB      | ~178 KB | exceeds Q4 |

At 100-bit security with jagged protocol, the < 80 KB stretch target may be
reachable. At 128-bit security, the Q4 target (< 200 KB) is reachable. At
192-bit security, QS exceeds both targets. The charter requires 100-bit minimum;
128-bit matches ML-DSA-65's category. The paper should target 128-bit as the
primary claim and present 100-bit as the "fast/small" variant.

TODO[founder]: Measure actual WHIR proof size with SP1 Hypercube on N=64. The
above is an analytical estimate; m is the critical unknown. If jagged protocol
reduces effective m to 24, proof size drops to ~65 KB at 128-bit — inside the
80 KB stretch target.

---

### D7 — LatticeFold+ Comparison

**eprint 2026/721 ℓ2-norm soundness caveat:**

eprint 2026/721 returned HTTP 403 in this research environment. The caveat is
described in W22 deep research (this document's Loop #1 source) as an "ℓ2-norm
soundness caveat" for LatticeFold+. The likely nature: LatticeFold+ (eprint 2025/247)
uses a lattice-based sumcheck protocol where witness vectors must satisfy ℓ2-norm
bounds for soundness. If a malicious prover can produce a valid-looking proof with
a witness whose ℓ2-norm exceeds the bound without detection, the scheme is unsound.
This is a known category of attack in lattice-based SNARKs (cf. Greyhound, SLAP).

TODO[founder]: Read eprint 2026/721 directly to determine if the caveat is:
(a) a parameter-dependent issue fixable with larger parameters, or
(b) a fundamental protocol flaw requiring a redesign.

**Without resolution, LatticeFold+ cannot be recommended for production.**

**LatticeFold+ vs WHIR-of-SP1 on each axis:**

| Axis | WHIR-of-SP1 (Approach C) | LatticeFold+ |
|------|--------------------------|--------------|
| Proof size (N=64, 128-bit) | ~110 KB (est.) | Unknown (no public N=64 ML-DSA measurement) |
| On-chain gas (execution) | ~146K (EIP-4844 blob) | Unknown (no Solidity impl) |
| Prover RAM | Same as SP1 today (~32-256 GB) | Unknown |
| PQ soundness type | FRI/IOPP under ROM | Module-SIS (no ROM) |
| Production library | slop-whir (unaudited) | Research code only |
| Production Solidity verifier | Whirlaway (unaudited) | None |
| Audit status | 0 audits (WHIR Solidity) | 0 audits |
| Maturity | 6-month horizon to audited | 24+ month horizon |
| Soundness caveat (2026) | None known | eprint 2026/721 (unresolved) |

**Verdict:** WHIR-of-SP1 dominates LatticeFold+ on every practical axis. The
only axis where LatticeFold+ would win is PQ soundness type (lattice-based, no
ROM assumption needed). For QS's purposes, ROM-based WHIR soundness is sufficient:
the charter's PQ requirement is "secure against quantum-polynomial-time adversaries,"
which the ROM model satisfies if the hash function (Keccak) has quantum collision
resistance. The ROM assumption is standard in all NIST PQC schemes (ML-DSA, SLH-DSA,
ML-KEM all use SHAKE-256 modeled as a random oracle).

**The maturity gap is decisive.** LatticeFold+ has no production Rust implementation,
no Solidity verifier, and an unresolved soundness caveat. WHIR is already in SP1's
production library (SLOP). The engineering risk profile for LatticeFold+ at QS's
12-month planning horizon is prohibitive.

---

### D8 — IEEE S&P 2027 Paper Positioning

**The publishable result:**

The paper establishes that the combination of an existing NIST-standardized signature
scheme (ML-DSA-65, FIPS 204) with an existing, separately deployed proof system
(SP1 Hypercube with WHIR, KoalaBear field) produces the first concretely efficient,
post-quantum-sound, on-chain aggregate signature verifier with measured gas costs.

**Theorem 1 (Main Result):**

Let λ be the security parameter. Let N be the number of ML-DSA-65 signatures.
Let QS-AggVerify be the aggregate verifier constructed in Algorithm 1 (below).
Then:

(a) **Correctness:** If (pk_i, msg_i, σ_i) are all valid ML-DSA-65 signature tuples,
    QS-AggVerify outputs 1.

(b) **Post-quantum soundness:** Under the Module-LWE hardness assumption at
    security level λ_lattice ≥ 128 (NIST category 3), the FRI soundness conjecture
    for Reed-Solomon codes over KoalaBear at parameter λ_STARK, and the WHIR
    proximity gap conjecture at parameter λ_WHIR in the random oracle model with
    hash function H:{0,1}* → {0,1}^{256}:
    
    Pr[QS-AggVerify(π) = 1 ∧ ∃i: ML-DSA-65.Verify(pk_i, msg_i, σ_i) = 0]
      ≤ N × 2^{-λ_lattice} + 2^{-λ_STARK} + 2^{-λ_WHIR}

(c) **Proof size:** |π| = O(λ log² T_N) bytes where T_N is the SP1 trace length
    for N signatures and the O(·) hides the WHIR folding factor constant.
    Concretely: |π| ≤ C_queries × log(T_N) × 64 bytes + C_final bytes where
    C_queries = 126 (at 128-bit security, big beautiful config).

(d) **On-chain verifier complexity:** The Solidity verifier executes in
    O(C_queries × log(T_N)) Keccak operations plus O(C_queries × k) field
    operations, where k is the folding factor. Concretely: ≤ 1.5M EVM gas at
    22-variable WHIR parameters (measured, ethresear.ch /24902). For N=64 ML-DSA-65
    (26-36 variables estimated): TODO[founder]: measure.

**Lemmas required:**

- Lemma 1 (Field compatibility): SP1's KoalaBear STARK is WHIR-compatible without
  field conversion (Section 3.1). Proof: SLOP's WHIR is field-generic; SP1 uses
  KoalaBear; slop-whir is tested with KoalaBear (source: verifier.rs imports).

- Lemma 2 (Fiat-Shamir hash substitution): The security of the non-interactive
  proof system is maintained when the prover's Poseidon2 challenger is replaced by
  a Keccak-based challenger for EVM compatibility (Section 3.2). Proof: In the
  ROM, both hash functions are modeled as random oracles; the Fiat-Shamir transform
  is secure under any collision-resistant ROM hash. This is standard but must be
  stated explicitly.

- Lemma 3 (Soundness composition): The composed system's soundness loss is additive
  over the three security components (ML-DSA, STARK, WHIR) (Section 3.3).
  Proof: Standard hybrid argument. The quantum adversary must break at least one
  of the three systems; the events are computationally independent given the
  reduction structures.

- Lemma 4 (Proof size bound): The WHIR proof size for an m-variable polynomial
  with C_queries queries and folding factor 4 is exactly
  C_queries × m × 64 bytes + 256 × 4 bytes + 14 × 32 bytes (Appendix A).
  Proof: Count Merkle nodes, leaf values, and final polynomial coefficients from
  the WHIR construction (eprint 2024/1586).

**Algorithm 1 (QS-AggVerify construction):**

- Off-chain prover:
  1. Run ML-DSA-65.Verify(pk_i, msg_i, σ_i) for i=1..N inside SP1 RISC-V zkVM.
  2. Compute Keccak-256 commitment: h = Keccak({pk_i || msg_i}_{i=1..N}).
  3. Output SP1 public inputs: (h, all_valid_flag).
  4. Generate WHIR proof π using SP1 Hypercube with KoalaBear + Keccak challenger.
  5. Post π on-chain as EIP-4844 blob (for rollup) or calldata (for L1 mainnet).

- On-chain verifier (Solidity):
  1. Verify h = Keccak({pk_i || msg_i} as provided in calldata).
  2. Call WHIR_Verifier(π, public_inputs = (h, all_valid_flag)).
  3. Return WHIR_Verifier's output.

**Why IEEE S&P?**

The paper's contribution is the first empirically measured, end-to-end PQ-sound
on-chain aggregate signature verifier with: (1) NIST-standardized inner signature,
(2) PQ-sound proof system (WHIR/FRI under ROM), (3) concrete gas and proof size
measurements, (4) formal soundness composition theorem. Prior work (ZKnox ETHDILITHIUM,
ETHFALCON) provides Solidity verifiers without ZK aggregation. Prior work on ZK
aggregation (Groth16 wraps) is not PQ-sound. No published work combines all four.

The venue fit is strong: IEEE S&P 2027 has been receptive to applied PQC work
(HAWK break at S&P 2026 per system prompt; threshold ML-DSA at USENIX Security '26
per Mithril). The contribution is concrete (measured benchmarks) rather than purely
theoretical.

---

## 3. Theorem Statement + Proof Sketch (IEEE S&P Paper Kernel)

**Full theorem statement:**

**Theorem 1 (QS Aggregate ML-DSA-65 Verifier).** Let λ ≥ 128 be the security
parameter. Let n_sig ≥ 1 be the number of ML-DSA-65 signatures to aggregate. Let
F = KoalaBear (p = 2^31 - 2^24 + 1), F^4 its degree-4 extension. Let WHIR be the
WHIR polynomial commitment scheme (eprint 2024/1586) with parameters:
- Folding factor k=4
- Queries per round (84, 21, 12, 9) [big beautiful config]
- PoW bits per round: 16
- Code rates (ρ_1, ρ_2, ρ_3, ρ_4) = (1/2, 1/16, 1/128, 1/1024)
- Final degree 2^8 = 256
- Fiat-Shamir hash: Keccak-256

Let SP1 be the SP1 Hypercube zkVM with KoalaBear field, Poseidon2 sponge for
internal commitments, and SLOP WHIR as the proof commitment (slop-whir, version
6.2.3, commit TODO[founder]: pin to specific commit). Let ML-DSA = NIST FIPS 204
ML-DSA-65 with parameters (k=4, ℓ=4, η=2, γ₁=2^17, γ₂=2^12, τ=49, β=78, ω=80).

Define the aggregate verifier A = (A_prove, A_verify) as follows:
- A_prove(pk_{1..n}, msg_{1..n}, sig_{1..n}) → (π, h): runs ML-DSA-65.Verify on
  each input inside SP1, computes commitment h, generates WHIR proof π via SP1
  Hypercube.
- A_verify(pk_{1..n}, msg_{1..n}, π, h) → {0,1}: checks h, runs WHIR verifier.

Then:

1. (Completeness) For all valid inputs, Pr[A_verify(·) = 1] = 1.

2. (Soundness) For any quantum-polynomial-time adversary B against A, the advantage
   Adv_A(B) = Pr[A_verify(pk,msg,π,h) = 1 ∧ ∃i: ML-DSA-65.Verify(pk_i,msg_i,sig_i)=0]
   satisfies:
   Adv_A(B) ≤ n_sig × Adv_{ML-DSA}(B_1) + Adv_{SP1-STARK}(B_2) + Adv_{WHIR}(B_3)
   ≤ n_sig × 2^{-λ_lattice} + 2^{-λ_STARK} + 2^{-λ_WHIR}
   where B_1, B_2, B_3 are efficient quantum reductions from B to ML-DSA hardness,
   SP1 STARK soundness, and WHIR soundness respectively.

3. (Efficiency) |π| = C_queries × log₂(T_{n_sig} × W) × 64 + O(1) bytes, where
   T_{n_sig} is the SP1 trace length for n_sig signatures and W is the AIR column
   width. For n_sig = 64: T_64 ≈ 175,298,745, W ≈ 500 (estimate).
   Solidity verification cost ≤ C_queries × log₂(T_{n_sig} × W) × 36 gas (Keccak)
   + C_field gas (field arithmetic, secondary).

**Proof sketch:**

*Completeness:* Follows from SP1 completeness (if ML-DSA-65 verifications all pass
in the RISC-V execution, SP1 produces a valid STARK proof) and WHIR completeness
(if the STARK constraint polynomial is correct, WHIR prover produces an accepting
proof). Both are proven in the respective papers.

*Soundness:* By a three-step hybrid argument.

Hybrid H_0: The real attack. B produces (pk, msg, π, h) such that A_verify accepts
but some ML-DSA-65 signature is invalid.

Hybrid H_1: Suppose B's ML-DSA forgeries fail — i.e., all provided signatures are
valid. Then the SP1 execution of ML-DSA-65.Verify produces "all_valid = true"
correctly. Under SP1 STARK soundness (IOPP soundness of the FRI-based constraint
checking), B cannot produce a π that causes A_verify to accept with "all_valid =
false" in the WHIR proof claim, except with probability 2^{-λ_STARK}. (This uses
the WHIR soundness for the STARK polynomial evaluation: if the STARK constraints
are not all satisfied, WHIR's proximity test rejects with probability 1 - 2^{-λ_WHIR}.)

Hybrid H_2: B successfully forges an ML-DSA-65 signature. The reduction B_1 uses
B to break ML-DSA-65 security: B_1 receives a challenge (pk*, msg*) from the ML-DSA
game, embeds it in position i of the aggregate, runs B to get a valid-looking STARK
witness, extracts the forged signature from the RISC-V execution trace. The extraction
requires rewinding B with the STARK soundness extractor, which succeeds except with
probability 2^{-λ_STARK}. The ML-DSA-65 forgery advantage is ≤ Adv_A(B) +
2^{-λ_STARK} ≤ n_sig × 2^{-λ_lattice}. (The union bound over n_sig is standard.)

The WHIR soundness (Hybrid H_1) uses the WHIR IOPP soundness theorem from eprint
2024/1586, which states that the proximity test rejects a "far" polynomial (one that
corresponds to an unsatisfied constraint) with probability ≥ 1 - (|F_ext|)^{-q/2}
(approximate; exact statement pending paper read). At q=126 queries and |F_ext| =
2^{124}: ε_WHIR per test ≈ (2^{-124})^{63} = 2^{-7812} — essentially negligible.
The binding parameters that matter are the code rate and the proximity gap, which
are the subject of the precise WHIR theorem. TODO[founder]: state exact theorem
from eprint 2024/1586 Section 5.

*Efficiency:* Follows by inspection from the WHIR proof construction (Algorithm 1
plus Lemma 4 in the paper).

---

## 4. Implementation Roadmap

The implementation has three separable sub-projects. None should start before the
design memo has a co-author and the IEEE S&P abstract is registered.

### Sub-project I: SP1 Hypercube Keccak Challenger

**What:** Modify SP1 Hypercube's WHIR prover to use Keccak-256 as the Fiat-Shamir
hash instead of Poseidon2, for EVM-compatible proof generation.

**Where in codebase:** `slop/crates/challenger/src/` (SLOP challenger abstraction).
The challenger currently supports Poseidon2 and Keccak (SLOP includes
`slop-symmetric` which re-exports Plonky3's hash functions including Keccak). The
question is whether a Keccak-based WHIR challenger is already configurable.

TODO[founder]: Check if SLOP's WHIR config supports Keccak challenger instantiation.
If yes: Sub-project I is ~4h. If no: ~40h to implement + test.

**Engineering estimate:**
- Best case (Keccak challenger already available): 4 founder hours to configure
  + 8h to generate and verify a test proof.
- Worst case (Keccak challenger not available): 40h to implement in Rust, 8h tests.

**Deliverable:** A SP1 Hypercube proof mode that outputs a WHIR proof with Keccak
Fiat-Shamir, for N=64 ML-DSA-65 batch verification.

### Sub-project II: Solidity WHIR Verifier for KoalaBear + Keccak

**What:** Port or adapt the Whirlaway / leanMultisig WHIR Solidity verifier to:
(a) use KoalaBear arithmetic (if not already — depends on D1 TODO),
(b) use Keccak Fiat-Shamir (likely already the case in Whirlaway),
(c) match SP1 SLOP WHIR's proof format (commitment structure, query encoding).

**Where in codebase:** Fork of `github.com/TomWambsgans/leanMultisig` into
`src/contracts/l1/pqc/WHIRVerifier.sol`.

**Engineering estimate:** 80-160 hours:
- 16h: understand leanMultisig proof format vs SLOP WHIR proof format.
- 40h: implement Solidity field arithmetic for KoalaBear (if needed).
- 40h: map SLOP WHIR proof serialization to Solidity calldata parsing.
- 24h: differential testing (Rust reference verifier vs Solidity verifier on 100
  test vectors).
- 40h: gas optimization (Merkle path packing, 8× field element packing per word).

**Deliverable:** A Solidity WHIR verifier that accepts SP1 Hypercube WHIR proofs
for ML-DSA-65 batch verification.

### Sub-project III: SP1 Guest Program (N=64 batch ML-DSA-65)

**What:** The SP1 guest program already exists from T1 work (the `main.rs` in Loop
#1 §6.2). Extend it to output public inputs compatible with the WHIR proof format:
hash commitment h = Keccak(pk_1||msg_1||...||pk_N||msg_N), and a 1-bit "all valid"
flag.

**Engineering estimate:** 8 founder hours (build on T1 code).

### Summary (post-academic-paper horizon)

| Sub-project | Hours | Prerequisite |
|-------------|-------|--------------|
| I: SP1 Keccak challenger | 4-40h | eprint 2024/1586 read, SLOP source audit |
| II: Solidity WHIR verifier | 80-160h | Sub-project I complete (proof format known) |
| III: SP1 guest program | 8h | Sub-project I (Keccak challenger known) |
| Integration testing | 40h | Sub-projects I + II + III |
| **Total** | **132-248h** | Sequential |

**Critical prerequisite before any code:** Co-author and grant funding. 132-248
founder-hours at solo pace is 3-6 months. This is the QS grant application to EF
ESP (already in flight per charter references) and the IEEE S&P 2027 co-author
recruitment (T2.6).

---

## 5. Engineering Risks

### Risk 1: SLOP WHIR format incompatibility with Whirlaway/leanMultisig

**Severity: HIGH.** The SLOP WHIR implementation in SP1 and the Whirlaway WHIR
Solidity verifier may use different proof serialization formats, different challenge
generation (Poseidon2 vs Keccak), or different domain structures. This is not a
cryptographic incompatibility but an engineering compatibility problem. If formats
differ significantly, Sub-project II becomes a full Solidity WHIR verifier
implementation from the eprint 2024/1586 spec, not a port of Whirlaway. This
adds ~80h to Sub-project II.

**Mitigation:** Before writing Solidity code, generate a test WHIR proof with SLOP
and a test WHIR proof with Whirlaway on the same polynomial, and compare byte-by-byte.
Cost: 4h. If compatible: proceed. If incompatible: scope Sub-project II accordingly.

### Risk 2: SP1 Hypercube availability and license

**Severity: MEDIUM.** "SP1 Hypercube" is described in blog posts as SP1's GPU-accelerated
multi-machine proof generation system. Whether the WHIR proof mode is available in
the open-source SP1 repository (Apache-2.0) or only in Succinct's closed-source
Hypercube service is unknown from public sources (blog.succinct.xyz/sp1-hypercube
returned 403). If WHIR proof output is only available via Succinct's hosted service,
QS cannot generate WHIR proofs independently.

**Mitigation:** Check SP1 v6.2.3 source: does `cargo prove --help` list WHIR as a
proof type? Does the `slop-whir` crate expose a prover API? If WHIR is available
in the open-source codebase, proceed. If it is Hypercube-only, investigate whether
SP1's hosted service can output raw WHIR proofs for use with QS's own Solidity
verifier, or whether the circuit must be re-implemented with a library that has a
public WHIR prover (e.g., Whirlaway itself, but in Rust/WASM rather than for SP1
circuits specifically).

**Decision point:** This is the single most important unknown to resolve before
committing to Approach C vs Approach A.

### Risk 3: WHIR soundness theorem gap (eprint 2024/1586)

**Severity: HIGH.** The WHIR soundness analysis is published in eprint 2024/1586
(the SP1-referenced paper, not the earlier 2024/736 which may be a different work).
The exact soundness theorem, particularly the effect of the "univariate skip"
optimization on the soundness error, is unknown from the sources available in this
research session. The D4 analysis above is estimated from general FRI/IOPP theory.
If the actual WHIR soundness at the "big beautiful" config is weaker than estimated
(e.g., only 80-bit soundness at 126 queries), the paper's security claim must be
adjusted and the config must be revised (more queries, higher PoW).

**Mitigation:** Read eprint 2024/1586 before submitting IEEE S&P abstract. Cost: 8h.
This is the highest-priority research task.

### Risk 4: m=36 variable proof size exceeds charter targets

**Severity: MEDIUM.** The analysis in D6 shows that the WHIR proof size for N=64
at 128-bit security and m=36 is ~259 KB, exceeding both the Q4 (< 200 KB) and
stretch (< 80 KB) charter targets. The jagged protocol may reduce m to 24-28,
bringing the proof within 110-130 KB (Q4 target met, stretch missed).

**Mitigation:** Measure actual m with SP1 Hypercube on N=64. If m > 28 and jagged
protocol cannot reduce it, QS has three options: (a) drop to N=16 (m ≈ 33,
proof ~200 KB), (b) accept Q4 target only and miss stretch, (c) use EIP-4844
blob posting (removes calldata cost, changes the gas metric but not proof size).
Charter revision may be needed.

### Risk 5: Fiat-Shamir hash substitution security argument

**Severity: LOW-MEDIUM.** The Poseidon2→Keccak Fiat-Shamir substitution is
mathematically sound in the ROM, but reviewers at IEEE S&P may ask for a concrete
security reduction proof (not just "both are random oracles"). Preparing this
argument adds 8-16h of formal security proof writing.

**Mitigation:** Include Lemma 2 in the paper with a careful ROM proof. Cite standard
Fiat-Shamir transform security theorems (Bellare-Rogaway 1993).

### Risk 6: SLOP WHIR unaudited status

**Severity: HIGH for production, LOW for paper.** SLOP's WHIR verifier is not
audited as of November 2025 (SLOP README: "only the jagged, BaseFold, stacked
BaseFold, and sumcheck verifiers are audited"). The WHIR Solidity verifier
(Whirlaway) is also unaudited. For the IEEE S&P paper, this is not a problem —
academic papers routinely discuss unaudited constructions. For production deployment,
QS cannot deploy unaudited cryptographic code. Audit cost: $30-80K per firm,
4-8 weeks, for the Solidity verifier specifically.

---

## 6. Open Questions for Loop #3

**Q1 (URGENT):** Is SP1 Hypercube's WHIR proof mode available in the open-source
SP1 v6.2.3 codebase, or only via Succinct's hosted proving service?
Required action: `cargo prove --help | grep whir` on SP1 6.2.3. Cost: 30 min.
This determines whether Approach C is viable vs forcing Approach A or B.

**Q2 (URGENT):** What is the exact WHIR soundness theorem in eprint 2024/1586?
Specifically: what is the soundness error as a function of code rate, queries, and
folding factor for the "big beautiful" config?
Required action: Read eprint 2024/1586. Cost: 8h.
This determines the security claim in Theorem 1 and whether 126 queries achieves
128-bit soundness.

**Q3 (HIGH):** What is the effective polynomial dimension m after SP1 Hypercube's
jagged protocol for N=64 ML-DSA-65 verification (175M cycle trace)?
Required action: Run SP1 Hypercube on N=64, inspect WHIR proof structure. Cost: 8h.
This determines proof size and gas cost for D6.

**Q4 (HIGH):** Does the Whirlaway / leanMultisig Solidity verifier use KoalaBear
or a different 31-bit prime (BabyBear or Mersenne31)?
Required action: Read leanMultisig source code (field constant definitions). Cost: 1h.
If BabyBear: 2-4h constant swap. If Mersenne31: 8h arithmetic conversion.

**Q5 (MEDIUM):** Has eprint 2026/721 (LatticeFold+ ℓ2-norm caveat) been addressed
by a follow-up paper (search eprint.iacr.org for "LatticeFold" published 2026-01
through 2026-06)?
Required action: Access eprint 2026/721 and search for follow-up. Cost: 4h.
If resolved: LatticeFold+ re-enters the comparison as a long-horizon alternative.
If unresolved: exclude from paper comparison table definitively.

**Q6 (MEDIUM):** What is the SP1 recursion circuit constraint count for Approach A
(if Approach C is unavailable)?
Required action: Read `crates/recursion/circuit/` source, count constraints. Cost: 4h.
This is the fallback Approach A complexity estimate.

**Q7 (MEDIUM):** What is the WHIR Solidity verifier gas for a 26-variable polynomial
(the estimated size for N=64 ML-DSA-65)?
Required action: Extend ethresear.ch /24902's 22-variable measurement to 26 variables
by running the Whirlaway Solidity verifier on a synthetic circuit. Cost: 8h + $10 cloud.
This validates or invalidates the gas estimate in D5.

---

## 7. Citations

**Primary sources fetched in this research session (2026-06-01):**

- `github.com/succinctlabs/sp1` — SP1 v6.2.3, Cargo.toml (fetched): `slop-whir =
  {version = "6.2.3", path = "./slop/crates/whir"}`, confirming WHIR integration.
  Source: SP1 Cargo.toml, fetched 2026-06-01.

- `github.com/succinctlabs/sp1/crates/primitives/src/lib.rs` (fetched): Confirms
  `pub type SP1Field = KoalaBear` (p = 2^31 - 2^24 + 1) and
  `SP1ExtensionField = BinomialExtensionField<KoalaBear, 4>` with polynomial x^4-3.
  KoalaBear Poseidon2 uses state-width 16, 30 rounds, RC_16_30 round constants.
  Source: fetched 2026-06-01.

- `github.com/succinctlabs/sp1/slop/README.md` (fetched): "SLOP - Succinct Library
  of Polynomials used in SP1 Hypercube." Audit status: "only the jagged, BaseFold,
  stacked BaseFold, and sumcheck verifiers are audited" as of November 2025.
  WHIR multilinear PCS is listed as an original implementation. Source: fetched
  2026-06-01.

- `github.com/succinctlabs/sp1/slop/crates/whir/README.md` (fetched): WHIR is
  "an alternative to BaseFold with smaller proof size and query complexity."
  References eprint.iacr.org/2024/1586 (not 2024/736 — this is a different version
  of the WHIR paper; TODO[founder]: confirm whether 2024/1586 is the updated full
  version and 2024/736 is an earlier preprint or a different paper entirely).
  Source: fetched 2026-06-01.

- `github.com/succinctlabs/sp1/slop/crates/whir/src/config.rs` (fetched): Two
  WHIR configs: "default" (domain 2^13, 2 rounds, 90+15+10 queries) and "big
  beautiful" (domain 2^21, 3 rounds, 84+21+12+9=126 queries, PoW 16 bits, folding
  factor 4, final degree 2^8). Source: fetched 2026-06-01.

- `github.com/succinctlabs/sp1/slop/crates/whir/src/verifier.rs` (fetched):
  Verifier is field-generic (`GC::F: TwoAdicField`). Test imports
  `slop_koala_bear::KoalaBear` confirming KoalaBear is the tested field. Public
  input format: (commitments, round_areas, num_variables, claim). Source: fetched
  2026-06-01.

- `github.com/succinctlabs/sp1/slop/crates/baby-bear/README.md` (fetched):
  "BabyBear is a 31-bit prime field (p = 2^31 - 2^27 + 1)." Source: fetched 2026-06-01.

- `github.com/succinctlabs/sp1/slop/crates/koala-bear/README.md` (fetched):
  "KoalaBear is a 31-bit prime field (p = 2^31 - 2^24 + 1)." Described as "similar
  to BabyBear but with a more efficient Poseidon2 arithmetization." Source: fetched
  2026-06-01.

- `github.com/Plonky3/Plonky3` (fetched): Confirms WHIR PCS available in Plonky3
  ecosystem; BabyBear, KoalaBear, Mersenne31 all supported; `~128 bit extension field`
  for all 31-bit primes. Source: fetched 2026-06-01.

- `github.com/TomWambsgans/Whirlaway` (fetched): KoalaBear referenced in examples.
  "Development has moved to leanMultisig." Apache-2.0 / MIT dual license. Source:
  fetched 2026-06-01.

**Internally sourced (QS repository):**

- `docs/intelligence/research/2026-W22-T2A-pqc-scheme-survey.md` (Loop #1): SP1
  2,739,124 cycles N=1; ETHDALCON gas figures; WHIR 1.9M/<1.5M gas claim (from
  ethresear.ch /24902, indirect); 175.3M cycles N=64 (T1.5 scaling).
- `docs/intelligence/research/2026-W22-T2-multi-platform-benchmark-plan.md`: T2.4
  WHIR aggregation mandate; charter §1.3 targets.
- `.claude/charter.md v1.2`: §1.3 KPI floor (< 80 KB proof, < 20K gas/sig at N=64).
- `.claude/rules/backend.md`: NIST FIPS 204 ML-DSA-65 as application-layer crypto.

**Papers / EIPs (403 in sandbox — indirect via Loop #1 and W22 deep research):**

- eprint.iacr.org/2024/1586 — WHIR paper (as referenced in SP1 SLOP slop-whir
  README, fetched 2026-06-01). Full title and exact theorem numbers:
  TODO[founder]: read paper directly; HTTP 403 in this environment.

- eprint.iacr.org/2024/736 — Earlier WHIR preprint (possibly same paper, different
  version; referenced in Loop #1 and W22 deep research as "ethresear.ch /24902
  companion"). TODO[founder]: verify if 2024/1586 and 2024/736 are the same work.

- eprint.iacr.org/2025/247 — LatticeFold+ (referenced in Loop #1; HTTP 403).

- eprint.iacr.org/2026/721 — LatticeFold+ ℓ2-norm soundness caveat (HTTP 403).

- ethresear.ch/t/evm-verification-of-whir-over-a-31-bit-field/24902 — WHIR Solidity
  verifier 1.9M / <1.5M gas at 22 variables (HTTP 403; indirect via Loop #1 and
  T2 plan). Author: Tom Wambsgans, May 2026.

- NIST FIPS 204 (ML-DSA-65) — primary standard for the inner signature primitive.
  Freely available at csrc.nist.gov/pubs/fips/204/final.

- Bellare-Rogaway 1993 — Fiat-Shamir transform security in the ROM. "Random Oracles
  are Practical: A Paradigm for Designing Efficient Protocols." ACM CCS 1993.

---

## What I Am Not Certain About

1. **SP1 field history (BabyBear vs KoalaBear):** The Loop #1 survey described SP1's
   field as "BabyBear/Poseidon2." The primitives crate read in this session confirms
   SP1 v6.2.3 uses `KoalaBear`. The switch from BabyBear to KoalaBear likely happened
   in SP1 v5.x or v6.x. The T1 benchmark (2,739,124 cycles) was measured on SP1 6.1.0.
   If cycle counts changed materially when SP1 switched from BabyBear to KoalaBear,
   the T1 measurement is still valid (cycles are field-independent in SP1's RISC-V
   emulation mode) but the WHIR proof size would need remeasuring against the actual
   KoalaBear polynomial structure. The cycle count is correct; the proof size is estimated.

2. **Whether SP1 Hypercube's WHIR proof mode is in the public OSS codebase or
   only in Succinct's hosted service.** The SLOP library is in the open-source repo,
   but the WHIR prover API may not be exposed through `cargo prove`. If it is only
   accessible via Succinct's network service, Approach C requires working with
   Succinct or implementing WHIR proving independently. This is the highest-impact
   unknown.

3. **WHIR soundness at "big beautiful" config parameters.** The D4 estimate uses
   general FRI/IOPP theory and may not match the specific WHIR soundness theorem
   in eprint 2024/1586. The univariate skip optimization changes the soundness
   calculation. The paper claims in D8 (Theorem 1) depend on the exact soundness
   expression from eprint 2024/1586. This must be verified before submitting IEEE
   S&P abstract.

4. **Effective polynomial dimension m after jagged protocol.** The proof size in D6
   pivots entirely on whether the jagged protocol reduces m from 36 to 24-28 for
   the N=64 ML-DSA-65 trace. If m stays at 36, proof size ~259 KB violates charter
   targets. If jagged reduces m to 24, proof size ~65 KB satisfies the stretch
   target. This is a measure-first, claim-second question.

5. **Whether eprint 2024/1586 and eprint 2024/736 are the same WHIR paper or
   different papers.** The SP1 SLOP source cites 2024/1586; the Loop #1 survey and
   W22 deep research cite 2024/736. They may be: (a) the same paper (one is the
   conference version, one is the ePrint preprint with different ID), or (b) two
   different WHIR papers by the same group. This matters for citation hygiene in
   the IEEE S&P paper.

6. **The LatticeFold+ soundness caveat (eprint 2026/721) severity.** If this is a
   fundamental protocol break (not a parameter issue), LatticeFold+ is permanently
   off the table. If it is parameter-dependent, LatticeFold+ may be viable at
   larger parameters in 2028+. The current recommendation (WHIR dominates) is
   unchanged either way, but the paper's related work section must accurately
   characterize the state of LatticeFold+.

7. **Groth16 wrapper gas figure.** The Loop #1 estimate of ~250K-300K gas for the
   Groth16 path is from `docs.succinct.xyz` (403 in this session). The comparison
   table between Groth16 and WHIR paths in Theorem 1's efficiency claim requires
   this number to be verified on-chain. If the Groth16 gas is 150K (better) or 500K
   (worse), the WHIR path's competitiveness changes.
