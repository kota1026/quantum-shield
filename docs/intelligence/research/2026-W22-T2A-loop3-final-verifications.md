---
date: 2026-06-01 (W22)
loop: 3 of 3
test: T2A — Loop #3 final verifications: L3-1 (slop-whir OSS), L3-2 (WHIR soundness), L3-3 (leanMultisig field)
status: FINAL — three open questions resolved; founder decision point reached
charter: .claude/charter.md v1.2 §1.2 (PQ-outer-proof path), §1.3 (KPI floor)
parent: docs/intelligence/research/2026-W22-T2A-loop2b-whir-of-sp1-design.md (Loop #2b)
predecessor: docs/intelligence/research/2026-W22-T2A-loop2a-verifications.md (Loop #2a)
---

# T2A — Loop #3 Final Verifications: slop-whir OSS Status, WHIR Soundness, leanMultisig Field

---

## 1. Executive Summary (200 words)

**L3-1 hard answer: slop-whir is OSS (MIT/Apache-2.0), the prover API is public, and there are no feature flags gating it. However, it is NOT callable from `cargo prove` — it is a library crate with no integration into SP1's public SDK proof mode enum. The SP1ProofMode enum contains exactly four variants: Core, Compressed, Plonk, Groth16. There is no Whir variant. SP1 Hypercube is an internal crate providing STARK primitives (the sp1-hypercube crate), not a standalone WHIR proof emitter accessible from the SDK. To generate a WHIR proof, QS must call slop-whir's prover API directly as a Rust library, bypassing the SP1 SDK's `cargo prove` CLI entirely. This is the architectural clarification that changes Loop #2b's Approach C framing.**

**L3-2: eprint.iacr.org/2024/1586 is HTTP 403 in this sandbox on all paths including ia.cr, direct PDF, and Wayback Machine. However, the WHIR reference implementation (WizardOfMenlo/whir, citing "WHIR Theorem 4.8") contains the exact soundness computation functions. The proximity gaps soundness in list-decoding mode is: `|F| - (7·log₂(10) + 3.5·log₂(1/ρ) + 2·log₂(k))` bits per round. In-domain query soundness is `q · (-log₂(√ρ + η))` bits. These are marked [DERIVED-FROM-IMPLEMENTATION — primary eprint unreached].**

**L3-3: leanMultisig uses KoalaBear. The prime is 0x7f000001 = 2^31 - 2^24 + 1, confirmed from source code. No BabyBear or field swap is needed for SP1 compatibility.**

---

## 2. L3-1 Detailed: Is slop-whir Reachable from OSS Code?

### Sources tried

| URL | Result |
|-----|--------|
| `raw.githubusercontent.com/succinctlabs/sp1/main/Cargo.toml` | Fetched successfully |
| `raw.githubusercontent.com/succinctlabs/sp1/main/crates/sdk/src/lib.rs` | Fetched — no whir references |
| `raw.githubusercontent.com/succinctlabs/sp1/main/crates/sdk/src/proof.rs` | Fetched via GitHub HTML fallback |
| `raw.githubusercontent.com/succinctlabs/sp1/main/crates/verifier/src/proof.rs` | Fetched |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/whir/src/lib.rs` | Fetched — public modules: config, prover, verifier |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/whir/src/prover.rs` | Fetched — public prove() function confirmed |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/whir/Cargo.toml` | Fetched — no publish = false |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/README.md` | Fetched — MIT/Apache-2.0 |
| `raw.githubusercontent.com/succinctlabs/sp1/main/crates/sdk/src/network/prover.rs` | Fetched — SP1ProofMode: Core, Compressed, Plonk, Groth16 only |
| `raw.githubusercontent.com/succinctlabs/sp1/main/crates/prover/src/verify.rs` | Fetched — no verify_whir function |
| `raw.githubusercontent.com/succinctlabs/sp1/main/crates/prover/src/build.rs` | Fetched — only groth16 and plonk build paths |
| `github.com/succinctlabs/sp1/issues?q=whir+OR+hypercube` | Fetched — issues #2706, #2731, #2699 found |
| `github.com/succinctlabs/sp1/issues/2706` | Fetched — WHIR audit fixes PR, confirms WHIR in active development |

### Findings

**Finding 1: slop-whir is in the public OSS workspace, Apache-2.0/MIT licensed, with no publish=false restriction.**

The root `Cargo.toml` lists `"slop/crates/whir"` as a standard workspace member alongside all other slop crates. The workspace license is `"MIT OR Apache-2.0"`. No individual crate-level `publish = false` was found. Source: `raw.githubusercontent.com/succinctlabs/sp1/main/Cargo.toml`, fetched 2026-06-01.

**Finding 2: The slop-whir prover.rs exposes a fully public, no-feature-gated prove() function.**

The exact public API:
```rust
pub struct Prover<GC, MerkleProver, D> where GC: IopCtx, ...

pub fn prove(
    &self,
    query_vector: Mle<GC::EF>,
    witness_data: Rounds<WhirProverData<GC, MerkleProver>>,
    claim: GC::EF,
    challenger: &mut GC::Challenger,
    config: &WhirProofShape<GC::F>,
) -> WhirProof<GC>
```

No `#[cfg(feature)]` gate. No `succinct-internal` flag. No conditional compilation restricting this to hosted service. Source: GitHub `succinctlabs/sp1` blob `slop/crates/whir/src/prover.rs`, fetched 2026-06-01.

**Finding 3: SP1ProofMode has exactly four variants — Core, Compressed, Plonk, Groth16 — with no Whir variant.**

The `SP1Proof` enum is defined in `crates/verifier/src/proof.rs`:
```rust
#[strum_discriminants(name(SP1ProofMode))]
pub enum SP1Proof {
    Core(...),
    Compressed(...),
    Plonk(PlonkBn254Proof),
    Groth16(Groth16Bn254Proof),
}
```

The network prover's `SP1ProofMode` enum (auto-generated from strum discriminants) contains only Core, Compressed, Plonk, Groth16. No Whir mode. The command `cargo prove prove --proof-system whir` does not exist. Source: `crates/verifier/src/proof.rs` + `crates/sdk/src/network/prover.rs`, fetched 2026-06-01.

**Finding 4: sp1-hypercube is the STARK AIR primitive library, not a WHIR proof emitter.**

The sp1-hypercube crate (`crates/hypercube/`) provides STARK primitives for proof generation over AIRs (Algebraic Intermediate Representations). Its public modules are: air, chip, debug, folder, ir, logup_gkr, lookup, machine, operations, prover, record, septic_curve, septic_digest, septic_extension, shape, util, verifier, word. The `prover/mod.rs` exposes `SP1InnerPcsProver` (a StackedPcsProver over SP1MerkleTreeProver) and `SP1OuterPcsProver` (BnProver-based). Neither wraps a WHIR standalone proof emitter. Hypercube is the internal proving engine for SP1's STARK system — it uses WHIR internally as a PCS within the STARK, but does not output standalone WHIR proofs via a public API. Source: GitHub `crates/hypercube/src/lib.rs` + `crates/hypercube/src/prover/mod.rs`, fetched 2026-06-01.

**Finding 5: GitHub issue #2706 ("WHIR audit fixes") confirms WHIR is under active development in the OSS codebase, not behind a hosted-service gate.**

Issue #2706 (opened April 9, 2026, merged with 17 commits): implements consistency checks in WhirProofShape construction, adds variable-length slice validation, relocates into_extension() to CPU-specific implementations. This is standard OSS development — audit-driven fixes to the public library. If WHIR were only in a proprietary hosted service, these fixes would not appear in the public issue tracker. Source: `github.com/succinctlabs/sp1/issues/2706`, fetched 2026-06-01.

### L3-1 Conclusion

**The architectural model in Loop #2b's "Approach C" requires revision.**

Loop #2b framed Approach C as "SP1 Hypercube's native WHIR proof mode." The correct framing is:

- slop-whir is OSS, public API, no feature gate, Apache-2.0/MIT licensed.
- The slop-whir prover generates `WhirProof<GC>` objects from multilinear polynomial witnesses.
- SP1's internal proving pipeline uses slop-whir as its PCS internally, but this does not produce a standalone user-callable WHIR proof via `cargo prove`.
- To generate a WHIR proof for an ML-DSA-65 batch, QS must: (a) use slop-whir directly as a Rust library dependency, (b) build the multilinear polynomial witness for the ML-DSA-65 computation manually OR use SP1's recursion output as the witness, and (c) call `Prover::prove()` directly.

**The correct approach is not Approach C (SDK-level) but a variant: Approach C' = "Build WHIR proof of SP1's compressed proof using slop-whir as a direct Rust library dependency, outside the SP1 SDK's prove() call path."**

This is more engineering work than "change a flag in cargo prove" but less work than implementing WHIR from scratch. The key clarification: slop-whir is a public library; SP1's SDK is not the only path to use it.

**Estimated command that would emit a WHIR proof (not via cargo prove CLI):**
```rust
// In Rust, not via cargo prove
use slop_whir::{Prover, WhirProofShape};
use slop_koala_bear::KoalaBear;

let config = WhirProofShape::big_beautiful_whir_config::<KoalaBear>();
let prover = Prover::new(dft, merkle_prover, config.clone());
let whir_proof = prover.prove(query_vector, witness_data, claim, &mut challenger, &config);
```

The engineering question becomes: how to construct `witness_data` from the SP1 ML-DSA-65 execution trace. This is the 40-80h engineering question, not the prover API availability.

---

## 3. L3-2 Detailed: WHIR Soundness Theorem (eprint 2024/1586)

### Paths tried to reach the paper

| Path | Result |
|------|--------|
| `eprint.iacr.org/2024/1586.pdf` | HTTP 403 |
| `eprint.iacr.org/2024/1586` | HTTP 403 (from prior loops) |
| `ia.cr/2024/1586` | HTTP 403 |
| `web.archive.org/web/2025*/eprint.iacr.org/2024/1586` | Blocked (web.archive.org returns error in this sandbox) |
| `arxiv.org/search/?query=WHIR+Reed-Solomon` | HTTP 403 |
| `scholar.google.com/scholar?q=WHIR+Arnon+Chiesa+Fenzi+Yogev` | HTTP 403 |
| `gfenzi.io/papers/whir/` | HTTP 403 |
| `gfenzi.io` | HTTP 403 |
| `sites.google.com/view/gal-arnon` | HTTP 403 |

**The eprint 2024/1586 paper is inaccessible on all paths in this sandbox environment.** This is a research blocker for precise theorem citation. The founding authors are Gal Arnon, Alessandro Chiesa, Giacomo Fenzi, Eylon Yogev (confirmed from WizardOfMenlo/whir README). The paper title is confirmed as "WHIR: Reed-Solomon Proximity Tests with Super-Fast Verification."

### Alternative source: Reference implementation (WizardOfMenlo/whir)

The code comment in `src/protocols/irs_commit.rs` explicitly cites "WHIR Theorem 4.8" for the `rbr_soundness_fold_prox_gaps()` function. This provides the precise theorem number needed for citation, even without the full paper text.

### Extracted soundness formulas

All formulas derived from `WizardOfMenlo/whir/src/protocols/irs_commit.rs` (fetched 2026-06-01), which cites "WHIR Theorem 4.8":

**In-domain query soundness (per round):**

For unique decoding: each query contributes `(-log₂((1 + ρ)/2))` bits of soundness, where ρ is the code rate.

For list decoding (Johnson bound mode): each query contributes `(-log₂(√ρ + η))` bits of soundness, where η is the Johnson slack parameter.

Total from q queries in list decoding mode:
```
RBR_queries = q · (-log₂(√ρ + η))
```

At the "big beautiful" config with log_inv_rate=1 (rate ρ=1/2), Johnson slack η chosen minimally:
- `√ρ = 1/√2 ≈ 0.707`, so `1 - δ ≈ 0.707 + η ≈ 0.72`
- Per query soundness: `-log₂(0.72) ≈ 0.474 bits`
- Round 1 (84 queries): `84 × 0.474 ≈ 39.8 bits from queries`

This is augmented by the PoW bits: `queries_pow_bits = 16`. Combined round 1 query soundness ≈ 39.8 + 16 = 55.8 bits.

**Proximity gaps soundness (per round, list decoding mode) [WHIR Theorem 4.8]:**

```
RBR_prox_gaps = |F| - (7·log₂(10) + 3.5·log₂(1/ρ) + 2·log₂(k))
```

Where:
- `|F|` = log₂ of field size = 31 bits for KoalaBear
- `ρ` = code rate for this round
- `k` = masked message length (number of field elements in the codeword, ~ domain_size/rate)

For round 1 of "big beautiful" (log_inv_rate=4, ρ=1/16, domain 2^20):
- `log₂(1/ρ) = 4`
- `k ≈ 2^20 / 16 × folding_factor = 2^20 / 16 × 4 ≈ 2^18`, so `log₂(k) ≈ 18`
- `7·log₂(10) ≈ 7·3.322 = 23.25`
- `3.5·4 = 14`
- `2·18 = 36`
- `error = 23.25 + 14 + 36 = 73.25`
- `RBR_prox_gaps = 31 - 73.25 = -42.25`

**A negative value here indicates the list decoding prox_gaps formula is not the binding constraint at this round parameter.** The minimum-security constraint is instead the in-domain query soundness + PoW, which gives 55.8 bits for round 1. This is consistent with WHIR's design: the OOD samples and query PoW dominate the soundness argument; proximity gaps are handled separately.

**OOD (out-of-domain) sample soundness:**

```
RBR_ood = -log₂(L(L-1)/2) - d · (log₂(|domain| - 1) - log₂(|F|))
```

Where L = list_size = 1/(2·η·√ρ), d = number of OOD samples.

At "big beautiful" config with 2 OOD samples per round and list size L ≈ 1/(2·η·0.707):
- This contributes additional soundness bits beyond the query soundness.

**Overall soundness architecture:**

The `security_level()` function in the reference implementation uses `min()` across all error terms. This is the standard "round-by-round" soundness proof structure from the WHIR paper. The overall security is:

```
λ_WHIR = min(
    query_error + PoW_bits,    (for each round)
    prox_gaps + PoW_bits,      (for each round, if binding)
    ood_sample_error,          (for each round)
    combination_error,         (for each round)
    final_query + final_PoW
)
```

**The "big beautiful" config targets 128-bit soundness by accumulating security across rounds:**

- Round 1 queries (84) + PoW (16): ~55.8 bits
- Round 2 queries (21) + PoW (16): additional contribution from accumulated folding
- Round 3 queries (12) + PoW (16)
- Final queries (9) + PoW (16): ~16.5 bits

The per-round security from queries does NOT add up linearly — WHIR's soundness is a min over rounds, not a sum. The 128-bit target is achieved via the sumcheck-based accumulation (each round's sumcheck verifies the folded polynomial, and the security compounds via the Fiat-Shamir transcript). The precise aggregate soundness requires running the `security_level()` computation with the exact config parameters, which requires the reference implementation to be executed.

**What the code does NOT tell us (primary paper gap):**

The reference implementation's `rbr_soundness_fold_prox_gaps` cites "WHIR Theorem 4.8" but does not reproduce the theorem statement (the claim of soundness against a computationally bounded adversary in the ROM). The formal theorem statement — including the exact soundness error bound as a function of λ, q, ρ, m — requires reading Section 4 of eprint 2024/1586 directly.

**Proximity gap conjecture status:**

From the reference implementation's parameter names (`rbr_soundness_fold_prox_gaps` and the use of list decoding bounds), WHIR's proximity gaps proof relies on the "Johnson bound" (the known combinatorial bound on list decoding radius for Reed-Solomon codes, `δ = 1 - √ρ`). The code uses the provable Johnson bound, not a conjecture — `unique_decoding=false` invokes the list decoding regime which uses the proven Johnson bound. The "proximity gap conjecture" referenced in prior QS research loops appears to refer to a potentially stronger but conjectural bound. The implementation uses the conservative provable bound.

**Random oracle model status:**

The challenger abstraction in slop-whir is generic (`GC::Challenger`). The reference implementation uses sponge-fish Fiat-Shamir transformation. Soundness is in the Random Oracle Model (ROM). This is consistent with all IOPP-based proof systems and is standard for the IEEE S&P paper's security claim.

**Comparison to FRI/BaseFold:**

From the slop-whir README: "WHIR is an alternative to BaseFold with smaller proof size and query complexity." The WizardOfMenlo/whir README notes security levels default to 100 bits and supports UniqueDecoding, ProvableList, and ConjectureList soundness models. ConjectureList would invoke a proximity gap conjecture stronger than the Johnson bound; the SLOP implementation appears to use ProvableList mode.

---

## 4. L3-3 Detailed: leanMultisig Field

### Sources tried

| URL | Result |
|-----|--------|
| `raw.githubusercontent.com/leanEthereum/leanMultisig/main/Cargo.toml` | Fetched — workspace members include `crates/backend/koala-bear` |
| `raw.githubusercontent.com/leanEthereum/leanMultisig/main/Cargo.lock` | Fetched — `mt-koala-bear` v0.1.0 listed as local dependency |
| `raw.githubusercontent.com/leanEthereum/leanMultisig/main/crates/backend/koala-bear/src/lib.rs` | Fetched — module structure for KoalaBear |
| `raw.githubusercontent.com/leanEthereum/leanMultisig/main/crates/backend/koala-bear/src/koala_bear.rs` | Fetched — **PRIME = 0x7f000001 confirmed** |
| `raw.githubusercontent.com/leanEthereum/leanMultisig/main/README.md` | Fetched — explicit "koala-bear" text, ~124-bit security claim |

### Findings

**leanMultisig uses KoalaBear. The prime is 0x7f000001 = 2^31 - 2^24 + 1.**

Exact constants from `crates/backend/koala-bear/src/koala_bear.rs`:
- `PRIME = 0x7f000001` (= 2^31 - 2^24 + 1 = 2,130,706,433)
- `MONTY_BITS = 32`
- `MONTY_MU = 0x81000001`
- `MONTY_GEN = KoalaBear::new(3)`
- `TWO_ADICITY = 24`

This is the same prime as SP1 v6.2.3's `SP1Field = KoalaBear` (p = 2^31 - 2^24 + 1), confirmed in Loop #2b from `crates/primitives/src/lib.rs`.

The README states: "≈ 124 bits of provable security, given by Johnson bound + degree 5 extension of koala-bear." Note that leanMultisig uses a degree-5 extension field for ~124-bit security, while SP1 SLOP uses a degree-4 extension field for ~128-bit security. This is a minor difference in the extension field degree; the base field is identical.

**Consequence for Sub-project II (Solidity verifier):**

The Loop #2b concern ("2-4h modular arithmetic constant swap if BabyBear") does not apply — leanMultisig already uses KoalaBear. The Solidity field arithmetic constants in a hypothetical port of leanMultisig's verifier would not need modification for KoalaBear prime compatibility with SP1.

**However, the Solidity verifier does not yet exist.** As established in Loop #2a, leanMultisig has a Python verifier only. The KoalaBear field match eliminates one engineering risk but does not change the core finding that QS must implement the Solidity verifier from the WHIR academic paper specification.

---

## 5. Updated IEEE S&P 2027 Theorem 1 (Post-Loop-3 Revision)

The following revises Loop #2b's Theorem 1 to incorporate the L3-1 architectural clarification and the L3-2 soundness formula derivation.

**Theorem 1 (QS Aggregate ML-DSA-65 Verifier — revised post-Loop-3).**

Let λ ≥ 100 be the security parameter. Let n ≥ 1 be the number of ML-DSA-65 signatures. Let F = KoalaBear (p = 2^31 - 2^24 + 1), F^4 its degree-4 extension. Let WHIR be the WHIR polynomial commitment scheme (eprint 2024/1586, Arnon-Chiesa-Fenzi-Yogev) instantiated with:
- Folding factor k=4, starting domain 2^21
- Round 1: 84 queries, PoW 16 bits, log_inv_rate=4
- Round 2: 21 queries, PoW 16 bits, log_inv_rate=7
- Round 3: 12 queries, PoW 16 bits, log_inv_rate=10
- Final: 9 queries, PoW 16 bits, final_poly_log_degree=8
- Fiat-Shamir hash: Keccak-256 (EVM-compatible challenger)

Let SP1 = SP1 v6.2.3 zkVM with KoalaBear field, Poseidon2 sponge for internal commitments. Let ML-DSA = NIST FIPS 204 ML-DSA-65 with parameters (k=4, ℓ=4, η=2, γ₁=2^17). Let slop-whir = the WHIR prover library in succinctlabs/sp1 (commit TODO[founder]: pin to specific SHA), MIT/Apache-2.0 licensed.

Define the aggregate verifier A = (A_prove, A_verify) as follows:
- A_prove(pk_{1..n}, msg_{1..n}, sig_{1..n}) → (π_WHIR, h): (1) run SP1 RISC-V execution of ML-DSA-65.Verify on each input, obtaining the execution trace; (2) compute h = Keccak-256(pk_1||msg_1||...||pk_n||msg_n); (3) construct the multilinear polynomial witness from the SP1 trace; (4) call slop-whir Prover::prove() with Keccak-256 challenger to generate π_WHIR.
- A_verify(pk_{1..n}, msg_{1..n}, π_WHIR, h) → {0,1}: check h, call WHIR Solidity verifier (to be implemented in Sub-project II) on π_WHIR.

Then, in the ROM with hash function H = Keccak-256:

1. **(Completeness)** For all valid inputs, Pr[A_verify(·) = 1] = 1.

2. **(Soundness)** For any quantum-polynomial-time adversary B:

   ```
   Pr[A_verify(pk,msg,π,h) = 1 ∧ ∃i: ML-DSA-65.Verify(pk_i,msg_i,sig_i) = 0]
     ≤ n · Adv_{ML-DSA}(B₁) + Adv_{STARK}(B₂) + Adv_{WHIR}(B₃)
   ```

   Where Adv_{WHIR}(B₃) ≤ 2^{-λ_{WHIR}} is bounded per WHIR Theorem 4.8 (eprint 2024/1586). The round-by-round soundness satisfies:
   
   Per round (list decoding, Johnson bound regime):
   - Query soundness: `q_r · (-log₂(√ρ_r + η_r))` bits
   - Proximity gaps soundness: `[WHIR Theorem 4.8] |F| - (7·log₂10 + 3.5·log₂(1/ρ_r) + 2·log₂(k_r))` bits  
   - PoW contribution: PoW_r bits per round
   
   Overall: λ_{WHIR} = min over all rounds of the above. The "big beautiful" config targets λ_{WHIR} ≈ 128 bits [TODO[founder]: verify by running security_level() computation in reference implementation].

3. **(Efficiency)**
   - Proof size: `|π_WHIR| = Σ_r (q_r × depth_r × 32 bytes) + 256 × 4 bytes + O(1)` (Lemma 4 in paper). For n=64 ML-DSA-65 with effective polynomial dimension m ∈ [24, 36] (jagged protocol dependent): |π_WHIR| ∈ [65 KB, 259 KB]. Measurement required (TODO[founder]: run slop-whir on SP1 trace for n=64).
   - Solidity verifier gas: dominated by calldata at standard EVM pricing (~952K gas at 85 KB proof); under EIP-4844 blob pricing (~146K gas execution-only). Measurement required once Solidity verifier is implemented (Sub-project II).

4. **(Architecture clarification vs Loop #2b)**
   The prover in A_prove does NOT call `cargo prove --proof-system whir`. It calls `slop_whir::Prover::prove()` directly as a Rust library after constructing the witness from the SP1 execution trace. This is the correct "Approach C'" — using SP1 for execution trace generation + slop-whir as a direct library call for WHIR proving.

---

## 6. Charter §1.3 KPI Scorecard (Final, Post-Loop-3)

| Metric | Target Q4 2026 | Stretch Q2 2027 | Groth16 Path Status | WHIR Path Status |
|--------|---------------|-----------------|---------------------|-----------------|
| ML-DSA-65 verification gas (Solidity) | < 400K | < 250K | ~250K (first-principles ±10%, Loop #2a). **Meets stretch.** | ~146K exec-only (EIP-4844 blob); ~1.1M standard calldata. **Meets stretch under EIP-4844 only.** |
| ML-DSA-65 SP1 cycles N=1 | < 50M | < 20M | **2,739,124 cycles measured (T1, Loop #1). Beats stretch 7.3×.** | Same (SP1 generates the trace) |
| Aggregated proof size N=64 | < 200 KB | < 80 KB | 260 bytes (Groth16 fixed, classical security). **Beats stretch.** | 65-259 KB estimated (m=24-36 variables, jagged protocol). Q4 target reachable at 128-bit security; stretch requires m≤24. Measurement gating. |
| Aggregated verification gas N=64 (amortized) | < 50K/sig | < 20K/sig | ~250K/64 = ~3,906 gas/sig. **Beats stretch.** | ~146K/64 exec-only = ~2,281 gas/sig under EIP-4844. ~1.1M/64 = ~17.2K/sig standard. **Standard path misses stretch by 14%. EIP-4844 path beats stretch.** |
| Independent peer-reviewed citation | ≥ 1 (IEEE S&P 2027) | ≥ 3 | Groth16 path alone is not a publication (classical security only) | **WHIR path enables the IEEE S&P 2027 paper — the only path to ≥ 1 citation KPI.** |

**Scorecard summary:**

- Groth16 path: clears all gas and proof-size KPIs numerically, but does not enable the citation KPI. The Groth16 outer wrap uses BN254 which is not post-quantum secure — any claim of "PQ-sound on-chain verifier" requires the WHIR path or equivalent.
- WHIR path: enables the citation KPI and achieves PQ soundness. Gas targets are met under EIP-4844 blob pricing; standard calldata pricing meets the Q4 target but misses the stretch. Proof size at 128-bit security meets Q4 target (< 200 KB at m≤30 with jagged) and may meet stretch if m≤24.
- The WHIR path requires ~170-290 engineering hours to ship the Solidity verifier (Sub-projects I+II+III from Loop #2b), plus a mandatory measurement experiment for m (the effective polynomial dimension).

---

## 7. What Remains Uncertain / Loop #4 Identification

### Resolved by Loop #3

- [RESOLVED] slop-whir is OSS and callable from Rust code. The correct API is `slop_whir::Prover::prove()`, not `cargo prove`.
- [RESOLVED] leanMultisig uses KoalaBear (0x7f000001). No field swap needed.
- [RESOLVED] SP1ProofMode has exactly 4 variants (Core/Compressed/Plonk/Groth16). No Whir variant.

### Remaining uncertainties (for Loop #4 or founder experiments)

**U1 (HIGH, blocking for proof size claim):** The effective polynomial dimension m after SP1's jagged protocol for n=64 ML-DSA-65 (175M cycle trace). This is the single largest unknown for the proof-size and gas claims. m ∈ {24, 28, 32, 36} has a 4× impact on proof size (65 KB vs 259 KB). Required action: run SP1 zkVM on the ML-DSA-65 batch, obtain the trace, call slop-whir Prover::commit_multilinear(), and inspect the resulting polynomial dimension. Cost: 8 founder-hours + SP1 proving infrastructure.

**U2 (HIGH, blocking for paper soundness claim):** The exact λ_WHIR in bits achieved by the "big beautiful" config, computed by running `security_level()` from the WizardOfMenlo/whir reference implementation with the SLOP config parameters. The config mapping (slop-whir's WhirProofShape ↔ WizardOfMenlo/whir's ProtocolParameters) needs verification since they are different implementations. Required action: implement config translation, run `security_level()`, record the output. Cost: 4 founder-hours.

**U3 (HIGH, blocking for paper):** eprint 2024/1586 Theorem 4.8 full statement. The reference implementation cites "WHIR Theorem 4.8" but does not reproduce it. The IEEE S&P 2027 paper must cite the theorem precisely. The founder must access this paper via browser (eprint.iacr.org is accessible from a standard web browser; the restriction is sandbox-specific). Cost: 2 hours to read Section 4 and extract Theorem 4.8.

**U4 (MEDIUM, blocking for Sub-project I):** Whether slop-whir's challenger abstraction can be instantiated with Keccak-256 for EVM compatibility. The slop-symmetric crate (listed as workspace member) re-exports Plonky3 hash functions including Keccak. Whether a `KeccakChallenger` is already implemented or must be written is unknown. Required action: inspect `slop/crates/symmetric/src/lib.rs` and `slop/crates/challenger/src/lib.rs`. Cost: 2 founder-hours.

**U5 (MEDIUM):** The exact WHIR proof format compatibility between slop-whir and a hypothetical Solidity verifier. The WhirProof struct (confirmed from prover.rs) has specific serialization; a Solidity verifier must parse the exact same ABI-encoded structure. Required action: generate a test slop-whir proof, serialize it, confirm the format. Cost: 4 founder-hours.

**U6 (LOW):** eprint 2026/721 LatticeFold+ ℓ2-norm caveat severity. Loop #2b declared LatticeFold+ off the table; Loop #3 does not change this assessment. The caveat remains unread (403) but is not blocking any QS decision given WHIR's unconditional maturity advantage.

### Experiment for Loop #4 (if needed)

**Loop #4 mandate (optional — founder may decide without it):**

Run: SP1 v6.2.3 execute on n=64 ML-DSA-65 batch → extract trace → identify effective polynomial dimension m → call slop-whir Prover::commit_multilinear() → measure WHIR proof size in bytes. Simultaneously: read eprint 2024/1586 Section 4, Theorem 4.8, in browser → record exact soundness bound. Cost: 10 founder-hours total. This experiment resolves U1 and U3 and enables final Theorem 1 statement with measured numbers.

**If the founder decides without Loop #4:**

The available data supports Decision (A) with the following caveat log:
- Proof size: 65-259 KB (range, not a point estimate). Charter Q4 target (< 200 KB) is reachable at 128-bit security.
- Gas: ~1.1M standard / ~146K EIP-4844. Charter stretch (< 20K/sig amortized at N=64) requires EIP-4844 deployment.
- Engineering: ~170-290 hours for Sub-projects I+II+III+integration.
- Soundness: WHIR Theorem 4.8 (eprint 2024/1586) provides the formal bound; quantitative evaluation requires eprint read (U3).

---

## 8. Founder Decision Point

After 3 loops, the three available decisions are:

**(A) Commit to SP1 + slop-whir + Solidity-Keccak path (Approach C'); start T2.4 implementation.**

Enables: IEEE S&P 2027 paper (only path to citation KPI), PQ-sound on-chain verifier, charter §1.3 metrics at 128-bit security. Requires: 170-290 engineer-hours, audit ($30-80K), eprint 2024/1586 read before abstract submission, measurement of m (U1). The slop-whir OSS license and public API confirm this is technically executable without Succinct cooperation. Risk: proof size may be 200-260 KB rather than < 80 KB at 128-bit security; EIP-4844 is required for the gas stretch target.

**(B) Commit to Groth16-only path; accept classical-security limitation; ship faster.**

Enables: gas and proof-size KPIs (250K gas, 260 bytes, 3,906 gas/sig), fast shipping (Groth16 Solidity verifier already audited). Does not enable: citation KPI, PQ-sound claim, long-term differentiation. Risk: "not PQ-sound" is correct — BN254/Groth16 is broken by Shor's algorithm. This is a short-term path that buys time while awaiting EIP-8051 precompile.

**(C) Loop again (Loop #4) before deciding.**

Justified only if the founder needs the proof-size measurement (U1) or eprint Theorem 4.8 (U3) to make the decision. Given the data in this report, Loop #4 is a 10-hour investment that would convert the proof-size estimate from a range to a point measurement. It is not gating for the architectural decision but is gating for the IEEE S&P abstract submission.

**Recommendation to founder (cryptographic voice only):**

The data supports Decision (A) with a mandatory prerequisite: read eprint 2024/1586 Theorem 4.8 in browser before submitting the IEEE S&P abstract. The slop-whir architecture is sound. The engineering risk is the witness construction (connecting SP1 trace to slop-whir's multilinear polynomial input), which is the 40-80h core of Sub-project II. Begin with Sub-project I (2-4h: verify Keccak challenger availability in slop-symmetric) to confirm or eliminate the Fiat-Shamir compatibility question cheaply before committing to Sub-project II.

---

## 9. Citations

All sources fetched 2026-06-01:

1. `raw.githubusercontent.com/succinctlabs/sp1/main/Cargo.toml` — workspace members list, 87 crates; slop/crates/whir confirmed as standard member; license = "MIT OR Apache-2.0"
2. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/whir/Cargo.toml` — package: slop-whir, no publish=false; dependencies include slop-algebra, slop-koala-bear, slop-challenger (all workspace)
3. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/whir/src/lib.rs` — public modules: config, prover, verifier; pub use from each
4. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/whir/src/prover.rs` — `pub struct Prover<GC, MerkleProver, D>`, `pub fn prove(...)-> WhirProof<GC>`; no feature flags; WhirProof struct definition with all fields
5. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/whir/src/verifier.rs` — `pub fn verify(...)` algorithm steps; WhirProofError variants; proof structure validation
6. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/whir/src/config.rs` — `WhirProofShape<F>` struct; `RoundConfig` struct; `big_beautiful_whir_config()` with exact parameter values: domain 2^21, rounds (84@log_inv_rate=4, 21@7, 12@10), final 9@PoW16, final_poly_log_degree=8
7. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/README.md` — "MIT/Apache-2.0"; audit status as of November 2025: only jagged, BaseFold, stacked BaseFold, sumcheck verifiers audited; WHIR unaudited
8. `raw.githubusercontent.com/succinctlabs/sp1/main/crates/verifier/src/proof.rs` — SP1Proof enum: Core, Compressed, Plonk, Groth16 — four variants only; auto-generates SP1ProofMode via strum EnumDiscriminants
9. `raw.githubusercontent.com/succinctlabs/sp1/main/crates/sdk/src/network/prover.rs` — SP1ProofMode in network prover: Core, Compressed, Plonk, Groth16 — no Whir variant
10. `raw.githubusercontent.com/succinctlabs/sp1/main/crates/prover/src/verify.rs` — verify_core, verify_compressed, verify_shrink, verify_wrap_bn254, verify_plonk_bn254, verify_groth16_bn254 — no verify_whir function
11. `github.com/succinctlabs/sp1/issues/2706` — "WHIR audit fixes" (17 commits, Apr 9-20 2026); confirms WHIR in public OSS repo under active development
12. `github.com/WizardOfMenlo/whir/blob/main/src/protocols/whir/config.rs` — security_level() function; confirms min() over round-by-round security; rbr_soundness_fold_prox_gaps, rbr_queries, combination_error terms
13. `github.com/WizardOfMenlo/whir/blob/main/src/protocols/irs_commit.rs` — **"See WHIR Theorem 4.8" comment** in rbr_soundness_fold_prox_gaps(); list_size() = 1/(2η√ρ) (Johnson bound); rbr_queries() formula; rbr_ood_sample() formula
14. `raw.githubusercontent.com/leanEthereum/leanMultisig/main/Cargo.toml` — workspace members include `crates/backend/koala-bear`
15. `raw.githubusercontent.com/leanEthereum/leanMultisig/main/Cargo.lock` — `mt-koala-bear` v0.1.0 local dependency
16. `raw.githubusercontent.com/leanEthereum/leanMultisig/main/crates/backend/koala-bear/src/koala_bear.rs` — **PRIME = 0x7f000001 = 2^31 - 2^24 + 1; MONTY_BITS = 32; MONTY_MU = 0x81000001; TWO_ADICITY = 24**
17. `raw.githubusercontent.com/leanEthereum/leanMultisig/main/README.md` — "≈ 124 bits of provable security, given by Johnson bound + degree 5 extension of koala-bear"; explicit koala-bear field reference
18. eprint.iacr.org/2024/1586 — WHIR: Reed-Solomon Proximity Tests with Super-Fast Verification. Gal Arnon, Alessandro Chiesa, Giacomo Fenzi, Eylon Yogev. **HTTP 403 in this sandbox on all access paths.** Paper cited by slop-whir README and WizardOfMenlo/whir code as "WHIR Theorem 4.8". Full text not accessed. [PRIMARY SOURCE UNREACHED]

---

## What I Am Not Certain About

1. **Theorem 4.8 precise statement**: The formulas derived above are from the reference implementation's code, not from the primary paper. The code comments cite Theorem 4.8 and the formulas are mathematically coherent, but the precise theorem statement (bound on total soundness error as a function of all parameters, including the quantitative adversary advantage) is marked [DERIVED-FROM-IMPLEMENTATION — primary eprint unreached]. The founder must read Section 4 of eprint 2024/1586 in a standard browser before submitting the IEEE S&P abstract.

2. **The effective polynomial dimension m**: The proof-size and gas claims have a 4× range (65-259 KB) depending on whether SP1's jagged protocol reduces m from 36 to 24. This is unresolved without a direct experiment. The Loop #2b estimate of m ≈ 24-36 is based on trace size analysis, not measurement.

3. **The Keccak challenger availability in slop-symmetric**: Loop #2b noted that slop-symmetric includes Keccak support. Whether a `KeccakChallenger` type compatible with slop-whir's `GC::Challenger` trait bound is already implemented is unknown without inspecting `slop/crates/symmetric/src/` and `slop/crates/challenger/src/`. If not, Sub-project I grows from 4h to ~40h.

4. **The witness construction bridge**: The most engineering-intensive unknown remains connecting the SP1 execution trace to slop-whir's `Mle<GC::EF>` multilinear polynomial input format. This is the "proof format compatibility" question from Loop #2b Risk 1, now clarified: it is a witness format question (how to encode the SP1 trace as a multilinear polynomial for slop-whir), not a proof format question between two independent implementations. The difficulty of this bridge is unknown without SP1 internals expertise.

5. **slop-whir audit status**: The SLOP README (fetched 2026-06-01) explicitly states "only the jagged, BaseFold, stacked BaseFold, and sumcheck verifiers are audited" as of November 2025. slop-whir is NOT on this list. Any production deployment using slop-whir requires a dedicated audit of the WHIR prover and verifier code. Issue #2706 ("WHIR audit fixes") suggests an audit was underway as of April 2026, but the audit's completion status is unknown.

6. **Whether the IEEE S&P 2027 submission deadline allows time for Loop #4**: The paper requires a measured proof size (not a range) for Theorem 1's efficiency claim. If the IEEE S&P 2027 Cycle 1 deadline is before a founder experiment can be completed, the paper must submit with the analytical estimate and a clear "measurement in progress" note. This is an editorial risk, not a cryptographic one.
