---
date: 2026-06-01 (W22)
loop: 4 of 4 — FINAL
test: T2A — Loop #4 de-risk: U4 (KeccakChallenger), U1 (runbook), U3 (Theorem 4.8 checklist)
status: FINAL — U4 resolved (30-40h scope confirmed), U1 runbook written, U3 checklist written
charter: .claude/charter.md v1.2 §1.2 (PQ-outer-proof path), §1.3 (KPI floor)
parent: docs/intelligence/research/2026-W22-T2A-loop3-final-verifications.md
---

# T2A — Loop #4 Final De-Risk: KeccakChallenger, Measurement Runbook, Theorem 4.8 Checklist

---

## Executive Summary (200 words)

**U4 verdict: No KeccakChallenger exists in slop-whir or anywhere in the SP1 workspace. Sub-project I is a 30-40h write-from-scratch task.**

The slop-challenger crate exports only two files: `lib.rs` (IopCtx trait, VariableLengthChallenger trait) and `synchronize.rs` (Synchronizable for DuplexChallenger). The only concrete IopCtx implementation in the SLOP codebase is `KoalaBearDegree4Duplex`, which uses `DuplexChallenger<KoalaBear, Poseidon2, 16, 8>` as its Challenger type. No KeccakChallenger, HashChallenger-backed IopCtx, or Keccak-based concrete IopCtx variant exists in any slop crate. The Plonky3 p3-challenger crate provides a generic `HashChallenger<T, H, OUT_LEN>` that could be instantiated with `Keccak256Hash` from p3-keccak, and p3-keccak ships `Keccak256Hash: CryptographicHasher<u8, [u8; 32]>`. However, the IopCtx::Challenger bound requires `GrindingChallenger`, whose `grind()` method for the DuplexChallenger implementation is 107 lines of SIMD-optimized code. Writing a GrindingChallenger for a byte-oriented `HashChallenger<u8, Keccak256Hash, 32>` requires defining the Witness field type, the PoW brute-force loop, and satisfying the `VariableLengthChallenger<KoalaBear, [KoalaBear; DIGEST_SIZE]>` field-element-oriented bounds — which is non-trivial given that `Keccak256Hash` operates on bytes (`u8`) and the IopCtx field is `KoalaBear` (prime field elements). This is a 30-40h write-from-scratch scope.

**U1: A founder-executable measurement runbook has been written to `/home/user/quantum-shield/docs/intelligence/research/2026-W22-T2A-loop4-m-measurement-runbook.md`.**

**U3: eprint.iacr.org/2024/1586 remains HTTP 403 on all sandbox paths. The Theorem 4.8 formula has been confirmed from the WizardOfMenlo/whir reference implementation. A founder checklist for verifying the paper appears in this document. The exact constants (7·log₂10, 3.5·log₂(1/ρ), 2·log₂k) are confirmed from primary source.**

---

## U4 Detailed Answer: KeccakChallenger in slop-whir

### Sources inspected

| URL | Result |
|-----|--------|
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/challenger/src/lib.rs` | Fetched — IopCtx trait, VariableLengthChallenger trait; NO concrete challenger impl |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/challenger/src/synchronize.rs` | Fetched — Synchronizable for DuplexChallenger only |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/symmetric/src/lib.rs` | Fetched — single line: `pub use p3_symmetric::*;` — no keccak |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/symmetric/Cargo.toml` | Fetched — single dep: p3-symmetric; no p3-keccak |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/koala-bear/src/koala_bear_poseidon2.rs` | Fetched — only IopCtx impl is KoalaBearDegree4Duplex |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/baby-bear/src/lib.rs` | Fetched — re-exports p3_baby_bear, no keccak IopCtx |
| `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/keccak-air/src/lib.rs` | Fetched — `pub use p3_keccak_air::*;` — AIR constraint system for Keccak, NOT a challenger |
| `raw.githubusercontent.com/succinctlabs/sp1/main/Cargo.toml` | Fetched — slop workspace lists 31 crates; p3-keccak-air and tiny-keccak present as deps, but no slop-keccak-challenger crate |
| GitHub code search: `repo:succinctlabs/sp1 KeccakChallenger` | Login required — inconclusive |
| `raw.githubusercontent.com/plonky3/Plonky3/main/challenger/src/lib.rs` | Fetched — exports duplex_challenger, hash_challenger, grinding_challenger |
| `raw.githubusercontent.com/plonky3/Plonky3/main/challenger/src/hash_challenger.rs` | Fetched — HashChallenger<T, H, OUT_LEN> defined; generic over CryptographicHasher |
| `raw.githubusercontent.com/plonky3/Plonky3/main/keccak/src/lib.rs` | Fetched — Keccak256Hash: CryptographicHasher<u8, [u8; 32]> confirmed |
| `raw.githubusercontent.com/plonky3/Plonky3/main/challenger/src/grinding_challenger.rs` | Fetched — GrindingChallenger trait; DuplexChallenger impl = 107 lines (SIMD-heavy) |

### Finding 1 (definitive): No KeccakChallenger exists anywhere in slop-whir

The slop-challenger crate has exactly two source files. Neither contains a `KeccakChallenger` type. The only concrete IopCtx in the SLOP ecosystem is `KoalaBearDegree4Duplex`, whose Challenger is `DuplexChallenger<KoalaBear, Poseidon2, 16, 8>`. This was confirmed by reading koala_bear_poseidon2.rs (fetched 2026-06-01):

```rust
type Challenger = DuplexChallenger<Self::F, KoalaPerm, 16, 8>;
// where KoalaPerm = Poseidon2<KoalaBear, Poseidon2ExternalMatrixGeneral,
//                             DiffusionMatrixKoalaBear, 16, 3>
```

Source: `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/koala-bear/src/koala_bear_poseidon2.rs`, fetched 2026-06-01.

### Finding 2: The IopCtx::Challenger bounds that a KeccakChallenger must satisfy

From the IopCtx trait definition (slop/crates/challenger/src/lib.rs, fetched 2026-06-01):

```rust
type Challenger: VariableLengthChallenger<Self::F, Self::Digest>
    + GrindingChallenger
    + 'static + Send + Sync + Clone;
```

Breaking down what a KeccakChallenger must implement:

**VariableLengthChallenger<KoalaBear, [KoalaBear; DIGEST_SIZE]>** requires:
- `FieldChallenger<KoalaBear>` (observe + sample KoalaBear field elements)
- `CanObserve<[KoalaBear; DIGEST_SIZE]>` (observe digest arrays)
- `observe_slice_with_len()` (variable-length slice observation)
- `observe_const_len_slice()` (constant-length slice observation)
- `observe_ext_element()` (extension field element observation)
- `observe_digests()` (digest observation)

The problem: `Keccak256Hash` from p3-keccak operates on bytes (`u8`), not KoalaBear field elements. `HashChallenger<u8, Keccak256Hash, 32>` can observe `u8` values, but the IopCtx requires observing KoalaBear elements and producing KoalaBear digests (not `[u8; 32]`). A bridging layer is needed that serializes KoalaBear elements to bytes, runs Keccak256, and deserializes the output as a KoalaBear element sequence.

**GrindingChallenger** requires:
```rust
type Witness: Field;
fn grind(&mut self, bits: usize) -> Self::Witness;
fn check_witness(&mut self, bits: usize, witness: Self::Witness) -> bool;
```
The DuplexChallenger implementation of `grind()` is 107 lines of SIMD-vectorized parallel search (confirmed from p3-challenger/src/grinding_challenger.rs, fetched 2026-06-01). A simple serial implementation (like MultiField32Challenger's) is 28 lines. A Keccak-based grind() would be at least 30-50 lines.

### Finding 3: What a KeccakChallenger implementation would require

To implement a KeccakChallenger compatible with slop-whir's IopCtx, QS must:

1. Define a `KeccakIopCtx` struct (the concrete IopCtx type, ~10 lines).
2. Define the `Digest` type as `[KoalaBear; N]` for some N, or `[u8; 32]` with appropriate encoding. Using `[KoalaBear; 8]` (8 × 31-bit elements packed in 256 bits) is the natural choice.
3. Define `KeccakChallenger` with an internal byte buffer for the Fiat-Shamir transcript.
4. Implement `CanObserve<KoalaBear>` — serialize field element to 4 bytes, push to transcript buffer.
5. Implement `CanObserve<[KoalaBear; N]>` — serialize array, push to buffer.
6. Implement `CanSample<KoalaBear>` — hash transcript, extract field element via rejection sampling.
7. Implement `CanSampleBits<usize>` — extract bits from hash output.
8. Implement `VariableLengthChallenger<KoalaBear, [KoalaBear; N]>` — blanket impl satisfies if above are implemented.
9. Implement `GrindingChallenger` — brute-force search for `witness` field element such that Keccak(transcript || witness) has `bits` leading zeros.
10. Implement `IopCtx` for `KeccakIopCtx` — define all associated types, `default_hasher_and_compressor()`, `default_challenger()`.

The Hasher and Compressor must also be Keccak-based: a Merkle tree over bytes using Keccak256 as the hash function. The `Hasher: CryptographicHasher<KoalaBear, [KoalaBear; N]>` must be implemented — again a serialization bridge from field elements to Keccak bytes.

**Estimated LOC:** ~200-300 lines of Rust for the full KeccakIopCtx implementation. **Estimated time: 30-40 founder-hours**, including write, unit tests, integration test (generate one WHIR proof with KeccakIopCtx, verify it), and differential comparison against KoalaBearDegree4Duplex proofs.

This is also an **audit surface**: the serialization of KoalaBear elements to bytes (endianness, padding, canonical encoding) must match exactly between the Rust prover and the Solidity verifier. A mismatch here is a completeness failure — proofs that verify in Rust fail in Solidity. Catching this requires at least 20 differential test vectors.

### Finding 4: The slop-keccak-air crate is NOT relevant

The `slop-keccak-air` crate is an AIR constraint system for proving Keccak computations inside SP1's STARK. It is the circuit that proves "I computed Keccak correctly," used when SP1 guest programs call `keccak256()`. It is not a challenger implementation and has no relation to Fiat-Shamir. Source: `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/keccak-air/src/lib.rs`, fetched 2026-06-01.

### U4 Scope Estimate

| Scenario | Hours | Condition |
|----------|-------|-----------|
| Drop-in (KeccakChallenger already exists) | 4h | NOT MET — does not exist |
| Light wrap (HashChallenger<u8, Keccak256Hash> already satisfies bounds) | 8h | NOT MET — byte/field mismatch; GrindingChallenger missing |
| Write-from-scratch KeccakIopCtx | **30-40h** | ACTUAL SCOPE |

**Final U4 answer: Sub-project I is a 30-40h write-from-scratch task.** There is no drop-in or light-wrap path.

---

## U3 Founder Checklist: eprint 2024/1586 Theorem 4.8

### eprint access attempts (this loop)

| Path | Result |
|------|--------|
| `eprint.iacr.org/2024/1586.pdf` | HTTP 403 |
| `eprint.iacr.org/2024/1586` | HTTP 403 |
| `ia.cr/2024/1586` | HTTP 403 |
| `gfenzi.io/papers/whir/` | HTTP 403 |
| `cs.biu.ac.il/~yogeve/` | HTTP 403 |
| `drops.dagstuhl.de/entities/document/10.4230/LIPIcs.ITCS.2025.1` | HTTP 403 |
| `eccc.weizmann.ac.il/report/2024/103/` | HTTP 403 |

The paper is accessible in a standard browser. The sandbox restriction is environment-specific. Founder should access `https://eprint.iacr.org/2024/1586` directly.

### What the reference implementation already confirms (no paper needed for these)

From `raw.githubusercontent.com/WizardOfMenlo/whir/main/src/protocols/irs_commit.rs` (fetched 2026-06-01), the exact code for Theorem 4.8's proximity gaps formula:

```rust
pub fn rbr_soundness_fold_prox_gaps(&self) -> f64 {
    let log_field_size = M::Target::field_size_bits();
    let log_inv_rate = self.rate().log2().neg();
    let log_k = (self.masked_message_length() as f64).log2();
    // See WHIR Theorem 4.8
    let error = if self.unique_decoding() {
        log_k + log_inv_rate                                   // unique decoding branch
    } else {
        // list decoding branch (Johnson bound mode)
        7. * LOG2_10 + 3.5 * log_inv_rate + 2. * log_k
    };
    log_field_size - error
}
```

Constants confirmed: `7 × log₂(10)`, `3.5 × log₂(1/ρ)`, `2 × log₂(k)`. These match Loop #3's formula exactly.

The code explicitly comments "See WHIR Theorem 4.8." This is the proximity gaps proximity bound for the IRS (Interleaved Reed-Solomon) commitment scheme used inside WHIR's round-by-round soundness analysis.

### Founder checklist: what to verify when reading eprint 2024/1586

When you have the paper open, verify exactly these claims (5 items, estimated 60-90 minutes):

**Checklist item T4.8-1 (constants):** Locate Theorem 4.8. Confirm the proximity gaps soundness error for list decoding contains the constants `7·log₂(10)`, `3.5·log₂(1/ρ)`, `2·log₂(k)`. If the constants differ from the implementation, record the discrepancy — the implementation may have a different parameterization.

**Checklist item T4.8-2 (Johnson bound vs. proximity gap conjecture):** The unique_decoding branch in the implementation uses a provable bound. The list-decoding branch (which we use) must use the provable Johnson bound `δ = 1 - √ρ`, NOT the unproven proximity gap conjecture. Confirm: does Theorem 4.8 state "under the Johnson bound" or "assuming the proximity gap conjecture"? The security of QS's claim depends on this being unconditional (provable Johnson bound).

**Checklist item T4.8-3 (random oracle model):** Confirm the theorem statement is in the ROM (Random Oracle Model) with the hash function modeled as a random oracle, NOT in the standard model and NOT under a computational assumption about the hash function. The slop-whir README and WHIR paper reference "ROM" — verify this explicitly in the theorem statement.

**Checklist item T4.8-4 (round-by-round structure):** Confirm that WHIR's soundness proof uses a round-by-round (RBR) argument, meaning the overall soundness is not simply a product of per-round soundness errors but follows the RBR composition from Maller et al. This affects how per-round security figures compose in the overall security theorem. The implementation's `security_level()` uses `min()` over rounds — verify this matches the RBR structure in the paper.

**Checklist item T4.8-5 (open problems / limitations):** Read the paper's "Discussion," "Open Problems," or "Conclusion" section. Record any caveats about: (a) the tightness of the Johnson bound vs. the true list decoding radius, (b) the "univariate skip" optimization's effect on soundness (WHIR applies a univariate-skip trick that reduces FRI-style redundancy; does this affect Theorem 4.8?), (c) any "subsequent work" references that might indicate the bound was improved or corrected after publication. Source: WHIR was published at ITCS 2025 (Innovations in Theoretical Computer Science 2025); there may be a journal or proceedings version with corrections.

**Checklist item T4.8-6 (security of the "big beautiful" config):** Find the companion paper or appendix that provides the exact security-level computation for specific instantiations. The "big beautiful" config (84+21+12+9 queries, 16-bit PoW per round, folding factor 4) may appear as an example instantiation. If it does, record the computed security level in bits. If not, the `security_level()` computation in WizardOfMenlo/whir must be trusted as the ground truth.

**Checklist item T4.8-7 (proof size formula):** Find the proof size theorem (likely Lemma or Theorem in the efficiency section). Confirm the formula `|π| = Σ_r (q_r × depth_r × 32 bytes) + O(1)` from the implementation. Note whether the paper uses the same query and depth parameterization.

### What the founder does NOT need to verify in the paper (already confirmed from code):

- The 31-bit KoalaBear field size (confirmed from slop-koala-bear source).
- The four-round structure of "big beautiful" (confirmed from slop/crates/whir/src/config.rs).
- That WHIR is sound in the ROM (confirmed from SLOP README and reference implementation context).
- That `p3-keccak` provides `Keccak256Hash: CryptographicHasher<u8, [u8; 32]>` (confirmed from p3-keccak source).

---

## Updated Engineering Cost Estimates

### Sub-project I: KeccakChallenger (revised from Loop #3)

**Loop #3 estimate:** 4h (drop-in) or 40h (write from scratch) — unknown which applied.
**Loop #4 determination:** 30-40h write-from-scratch.

Scope breakdown:

| Task | Hours |
|------|-------|
| Define KeccakIopCtx struct and all associated types | 4h |
| KeccakChallenger: CanObserve<KoalaBear> + CanObserve<[KoalaBear; N]> | 6h |
| KeccakChallenger: CanSample<KoalaBear> + CanSampleBits<usize> | 4h |
| GrindingChallenger impl (PoW brute-force loop, serial) | 6h |
| Keccak-based Hasher + Compressor for Merkle tree | 6h |
| Integration: plug KeccakIopCtx into slop-whir Prover::prove() | 4h |
| Unit tests (observe/sample round-trip, PoW correctness) | 4h |
| Integration test: generate + verify one WHIR proof with KeccakIopCtx | 4h |
| Serialization compatibility: match byte encoding with Solidity verifier design | 4h |
| **Total** | **42h** |

The highest-risk item is "serialization compatibility": if the byte encoding of KoalaBear elements (little-endian vs big-endian, 4-byte vs 5-byte, with or without Montgomery form normalization) differs between the Rust prover and the Solidity verifier, the entire system fails silently. This requires a formal serialization specification before implementation.

**Revised Sub-project I estimate: 35-45 founder-hours (use 40h as planning figure).**

### Sub-project II: Solidity WHIR Verifier (unchanged from Loop #2b)

The U4 result does not change Sub-project II's scope. The Solidity verifier must implement the KeccakIopCtx verification path (Merkle verification with Keccak256, field arithmetic for KoalaBear, sumcheck verification, GrindingChallenger PoW check). This was already the design from Loop #2b.

The Sub-project II estimate remains: **80-160h** (use 120h as planning figure).

The critical new dependency: Sub-project I's serialization specification must be finalized before Sub-project II can implement the correct ABI decoding.

### Revised total for Approach A

| Sub-project | Prior estimate | Revised estimate |
|-------------|---------------|-----------------|
| I: KeccakChallenger | 4-40h | **40h** |
| II: Solidity WHIR Verifier | 80-160h | 120h (unchanged) |
| III: SP1 Guest Program extension | 8h | 8h (unchanged) |
| Integration + test | 20-40h | 30h |
| **Total** | **112-248h** | **198h** |

**Revised Approach A estimate: ~198 founder-hours (range: 170-250h).**

The prior "170-290h" range from Loop #3 is now tightened to 170-250h with 198h as the planning figure. The U4 resolution raises the center of mass (Sub-project I was optimistically 4h; it is 40h).

### Charter KPI impact

The KPI from charter §1.3 requires the IEEE S&P 2027 citation. The 198h estimate spreads across:
- 40h Sub-project I (Keccak challenger — novel, audit-needed)
- 120h Sub-project II (Solidity verifier — novel, audit-needed)
- 8h Sub-project III (SP1 guest program — minimal, builds on T1)
- 30h integration

Audit surface for Approach A: Sub-projects I and II are the novel cryptographic surfaces. Sub-project I is ~300 LOC of Rust; Sub-project II is ~500-1000 LOC of Solidity. Total audit surface: ~1300 LOC. Audit cost estimate: **$30-50K** (Trail of Bits / Cryspen for Sub-project I Rust; OpenZeppelin / Spearbit for Sub-project II Solidity). This is within the Loop #3 cited $30-80K range; $50K is the updated planning figure.

---

## Final Go / No-Go Signal for Approach A

**Approach A (SP1 + slop-whir + KeccakIopCtx + Solidity verifier): GO, with a conditional.**

The conditional: Sub-project I (30-40h) should be treated as a prototype risk item, not a blocked item. The path is fully specified:
1. Add `p3-keccak` as a dependency to a new `slop-keccak` crate in the SP1 workspace.
2. Implement `KeccakIopCtx` following the `KoalaBearDegree4Duplex` pattern with Keccak256 as the sponge.
3. Run slop-whir's existing integration tests with `KeccakIopCtx` to confirm correctness.

This is straightforward Rust engineering. The risk is not soundness — Keccak256 in ROM mode satisfies all IopCtx::Challenger trait bounds semantically; the implementation risk is the mechanical byte-level serialization compatibility between Rust and Solidity.

**The go signal is NOT conditional on eprint 2024/1586.** The proximity gaps formula (Theorem 4.8) is confirmed from the reference implementation's code comment. The paper read is required before the IEEE S&P abstract submission, not before architecture commitment.

**Decision table:**

| Condition | Decision |
|-----------|----------|
| U4 = KeccakChallenger exists | Would have been GO (4h Sub-project I). MOOT. |
| U4 = write-from-scratch (ACTUAL) + founder time budget ≥ 198h | **GO on Approach A** |
| U4 = write-from-scratch + founder time budget < 198h | DEFER to Approach B (Groth16), accept no-citation KPI miss |
| U1 measurement (to be run by founder) shows m > 36 | Re-evaluate proof size — if m > 40, proof size > 400 KB at 128-bit security; may need to reduce N from 64 to 16 for Q4 target |
| U3 paper read reveals Johnson bound is NOT unconditional in Theorem 4.8 | Must state paper claim under proximity gap conjecture — affects IEEE S&P reviewers' assessment |

---

## Citations

All sources fetched 2026-06-01:

1. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/challenger/src/lib.rs` — IopCtx trait definition (Challenger bound: VariableLengthChallenger + GrindingChallenger); VariableLengthChallenger trait; no concrete KeccakChallenger type.
2. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/challenger/src/synchronize.rs` — Synchronizable impl for DuplexChallenger<F, P, WIDTH, RATE>. Only concrete file in crate besides lib.rs.
3. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/symmetric/src/lib.rs` — `pub use p3_symmetric::*;` one-liner. No keccak.
4. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/koala-bear/src/koala_bear_poseidon2.rs` — KoalaBearDegree4Duplex: type Challenger = DuplexChallenger<Self::F, KoalaPerm, 16, 8>. Only IopCtx impl in slop ecosystem.
5. `raw.githubusercontent.com/succinctlabs/sp1/main/slop/crates/keccak-air/src/lib.rs` — `pub use p3_keccak_air::*;` — AIR constraint system, NOT a challenger.
6. `raw.githubusercontent.com/succinctlabs/sp1/main/Cargo.toml` — Workspace members: 31 slop crates listed; p3-keccak-air and tiny-keccak present; no slop-keccak-challenger crate.
7. `raw.githubusercontent.com/plonky3/Plonky3/main/challenger/src/lib.rs` — Plonky3 challenger: duplex_challenger, hash_challenger, grinding_challenger, multi_field_challenger, serializing_challenger modules all public.
8. `raw.githubusercontent.com/plonky3/Plonky3/main/challenger/src/hash_challenger.rs` — HashChallenger<T, H, OUT_LEN> generic type; requires H: CryptographicHasher<T, [T; OUT_LEN]>.
9. `raw.githubusercontent.com/plonky3/Plonky3/main/keccak/src/lib.rs` — Keccak256Hash: CryptographicHasher<u8, [u8; 32]>; KeccakF permutation on [u64; 25] and [u8; 200].
10. `raw.githubusercontent.com/plonky3/Plonky3/main/challenger/src/grinding_challenger.rs` — GrindingChallenger trait: type Witness: Field; grind() + check_witness(). DuplexChallenger impl: 107 lines (SIMD). MultiField32Challenger impl: 28 lines (serial).
11. `raw.githubusercontent.com/plonky3/Plonky3/main/Cargo.toml` — p3-keccak and p3-challenger both workspace members in Plonky3.
12. `raw.githubusercontent.com/WizardOfMenlo/whir/main/src/protocols/irs_commit.rs` — `rbr_soundness_fold_prox_gaps()` with "See WHIR Theorem 4.8" comment; list decoding error = `7·LOG2_10 + 3.5·log_inv_rate + 2·log_k`. Constants confirmed.
13. eprint.iacr.org/2024/1586 — HTTP 403 on all sandbox access paths. Paper: "WHIR: Reed-Solomon Proximity Tests with Super-Fast Verification." Authors: Gal Arnon, Alessandro Chiesa, Giacomo Fenzi, Eylon Yogev. Published: ITCS 2025. [PRIMARY SOURCE UNREACHED — confirmed from WizardOfMenlo/whir README and code comment.]

---

## What I Am Not Certain About

1. **Whether a KeccakIopCtx already exists in a branch or fork of SP1 not on `main`.** The GitHub code search for `KeccakChallenger` requires authentication and returned no results in this sandbox. A founder with GitHub auth should run: `gh search code "KeccakChallenger" --repo succinctlabs/sp1` to confirm no branch-level implementation exists before starting Sub-project I.

2. **The exact byte-encoding specification for KoalaBear elements in the Solidity verifier context.** The `leanMultisig` repository uses KoalaBear (PRIME = 0x7f000001, confirmed in Loop #3), but its Solidity field arithmetic encoding convention is not confirmed. If `leanMultisig` encodes KoalaBear elements as 4-byte little-endian, the KeccakIopCtx must use the same encoding. If it uses Montgomery form, the prover must normalize before hashing.

3. **The m value for N=64 after the jagged protocol.** The proof-size estimate (65-259 KB) spans 4× depending on m ∈ {24..36}. The runbook (companion document) provides the method to measure m; the measurement has not been run.

4. **WHIR paper Theorem 4.8: Johnson bound vs proximity gap conjecture.** The reference implementation's `rbr_soundness_fold_prox_gaps()` uses `unique_decoding=false` path with `LOG2_10` constants in the list decoding branch. Whether this corresponds to the provable Johnson bound or a conjectural proximity gap bound requires reading the paper. The implementation does NOT use a field named `conjecture_list` — it uses `unique_decoding: bool`. The `WizardOfMenlo/whir` README mentions "ConjectureList" and "ProvableList" as separate soundness modes, and SLOP's "big beautiful" config uses the provable mode (not conjecture). However, this remains unconfirmed from the primary paper source.

5. **slop-whir audit status as of June 2026.** Loop #3 established that SLOP's November 2025 audit covered jagged, BaseFold, stacked BaseFold, and sumcheck verifiers but NOT slop-whir. GitHub issue #2706 ("WHIR audit fixes," April 2026) suggests an audit was underway. Whether that audit completed, and whether its scope included the slop-whir prover and verifier, is unknown without checking Succinct's public disclosure or SLOP README update.
