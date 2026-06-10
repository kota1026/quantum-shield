---
agent: qs-cto
meeting: 2026-W24 (2026-06-10)
model: sonnet (via Fable 5 orchestrator)
---

# W24 CTO Position Paper — Quantum Shield Technical Leverage

**Date:** 2026-06-10 | **Charter:** v1.2 | **KPI floor:** §1.3 benchmark numbers

**Headline verification:** SP1 workspace confirmed unchanged — no `slop-keccak-challenger` crate exists as of v6.2.4 (June 8, 2026). The 31-crate list matches the Loop #4 count exactly. Approach A's premises hold.

---

### 1. Position: The Single Highest-Leverage Point Right Now

The serialization boundary between the Rust prover and the Solidity verifier is the load-bearing technical risk for the entire 198-hour Approach A plan. Everything else — KeccakIopCtx, the sumcheck verifier, gas optimization — is downstream of whether `[KoalaBear; 8]` packed as `[u8; 32]` means exactly the same thing on both sides of the EVM boundary.

The kickoff plan's S0-first sequencing is correct in principle, but the current S0 spec description is still too abstract: it names the outputs (endianness, Montgomery normalization, rejection-sampling rule) without committing to a single canonical vector format that can be dropped into a Foundry test TODAY. The asymmetric bet is this: 8 hours of S0 work, done right, makes 160 hours of S2 Solidity work deterministic. Done wrong or skipped, any bug surfaces only at S4 integration — which is 13 weeks and ~168 hours later.

Secondary leverage: SP1 v6.2.4 (2026-06-08, four days ago) contains no breaking changes to slop-whir's IopCtx architecture. There is no ecosystem development that invalidates the plan.

---

### 2. Three Concrete Actions (ranked, spike-shaped)

**Action 1 (this week, ~6h) — Execute the serialization vector spike before writing any S0 prose.**

Rather than writing the spec document first, write the vectors first. In a throwaway Rust file: implement two competing encodings — 4-byte little-endian canonical form and 4-byte little-endian Montgomery form — for a set of 20 fixed KoalaBear values (include 0, 1, PRIME-1, a mid-range value, and the 8 digest-slot boundary values). Then write a matching Foundry test that reads the same 20 hex strings and asserts field arithmetic identity. This is the actual de-risk for the KoalaBear byte-encoding mismatch that Loop #4 identified as the silent completeness failure risk. Success metric: both Rust and Foundry tests agree on all 20 vectors with one specific encoding; the encoding is then codified as S0 canonical. The output is the JSON vector file and a passing `forge test`, not a prose document.

This answers (a): S0-first is correct, but the cheaper de-risk is to produce the vectors empirically rather than reason about the spec abstractly. Write the test fixture before writing the markdown.

**Action 2 (week 2, ~10h) — KeccakIopCtx CanObserve + CanSample skeleton, no GrindingChallenger yet.**

Implement items 1-5 from the Loop #4 task list and connect them to the S0 vector fixture from Action 1. Success metric: a Rust unit test that feeds the S0 fixture values through CanObserve, calls CanSample, and produces a KoalaBear output that matches a hand-computed Keccak256 digest. This validates the field-to-byte bridge — the architecturally novel piece — in isolation, before committing to the full 40-hour S1 scope. If this spike fails, it surfaces a scope-increase signal 10 hours into S1 rather than 30 hours in.

This answers (b): the single spike that most reduces the 198h estimate's variance is the CanObserve/CanSample bridge, because it tests the only genuinely novel type-system junction in S1. GrindingChallenger is mechanical (serial PoW loop, well-precedented by the MultiField32Challenger 28-line impl). The byte-to-field bridging is the variance source.

**Action 3 (week 2, ~3h) — Run the m-measurement runbook (pre-flight P3) and pin the N=64 proof-size claim.**

At 15h/week, entering S2 (120h) without knowing whether m is 24 or 40 is a planning error: if m > 36, the charter §1.3 "proof < 200 KB" KPI is at risk, and the design needs to fall back to N=16 before 120 hours are sunk on a verifier sized for N=64. Run the runbook at the KoalaBearDegree4Duplex baseline. Success metric: a single recorded measurement `m = [value]` committed to `docs/engineering/specs/`.

---

### 3. One Technical Risk: The Undischarged Theorem 4.8 Conditional

If the WHIR paper's list-decoding soundness branch in Theorem 4.8 rests on the proximity gap conjecture rather than the unconditional Johnson bound, the RWC 2027 paper claim weakens to "assuming conjecture X." This is not a build risk — the verifier works regardless — but it is a citation risk. The Theorem 4.8 checklist (T4.8-2) must be discharged before the RWC submission (2026-11-16), and the founder is the only path to the paper because the sandbox cannot reach eprint.iacr.org.

---

### 4. One Non-Obvious Opportunity: The leanMultisig Encoding Convention as a Moat

If QS's Action 1 spike produces a confirmed encoding fixture that matches leanMultisig, QS becomes the canonical source for how KoalaBear field elements cross the EVM ABI boundary. No competitor is doing this today — ZKnox works in BLS12-381, PSE works in BabyBear/Goldilocks, PQShield has no on-chain verifier. The 20-vector JSON fixture, published as a standalone permissively-licensed repository, becomes a reference that any team building a WHIR Solidity verifier must cite. A citation moat that costs nothing extra.

---

### 5. Position Summary — Top 3 Actions Ranked

| Rank | Action | Time | Success Metric | Week |
|------|--------|------|---------------|------|
| 1 | Serialization vector spike: 20 KoalaBear test vectors, Rust + Foundry both green | 6h | `forge test` passes; encoding committed as JSON | W24 |
| 2 | KeccakIopCtx CanObserve/CanSample skeleton, validated against vector fixture | 10h | Unit test: Keccak(observed field elements) matches hand-computed digest | W25 |
| 3 | m-measurement runbook execution at KoalaBearDegree4Duplex baseline | 3h | Single `m = [value]` data point committed; N=64 vs N=16 decision made | W25 |
