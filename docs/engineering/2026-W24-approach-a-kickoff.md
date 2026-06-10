---
date: 2026-06-10 (W24)
type: engineering kickoff plan
status: ACTIVE — Approach A GO ratified (T2A Loop #4, 2026-06-01)
charter: .claude/charter.md v1.2 §1.1 channel #3, §1.3 KPI floor
parent: docs/intelligence/research/2026-W22-T2A-loop4-final-derisk.md
runbook: docs/intelligence/research/2026-W22-T2A-loop4-m-measurement-runbook.md
---

# Approach A Kickoff — SP1 + slop-whir + KeccakIopCtx + Solidity WHIR Verifier

**Planning figure: 198 founder-hours (range 170–250h).**
End state: batch ML-DSA-65 verification proven in SP1, wrapped in a WHIR
proof with a Keccak-based Fiat-Shamir transcript, verified by a Solidity
contract — end-to-end PQ-sound (no classical SNARK wrap).

## 0. Pre-flight checklist (founder, ~4h, BEFORE any code)

| # | Item | Time | Source |
|---|------|------|--------|
| P1 | `gh search code "KeccakChallenger" --repo succinctlabs/sp1` — confirm no branch/fork implementation exists (sandbox could not auth) | 10 min | Loop #4 uncertainty 1 |
| P2 | Read eprint 2024/1586 against the 7-item Theorem 4.8 checklist (esp. T4.8-2: Johnson bound vs proximity-gap conjecture) | 60–90 min | Loop #4 §U3 |
| P3 | Run the m-measurement runbook → if m > 36, re-evaluate N=64 proof size; if m > 40, consider N=16 | 2h | Loop #4 decision table |
| P4 | Check slop-whir audit status (SP1 issue #2706 "WHIR audit fixes", Succinct disclosure page) | 20 min | Loop #4 uncertainty 5 |
| P5 | Confirm leanMultisig KoalaBear byte-encoding convention (LE vs BE, Montgomery normalization) | 30 min | Loop #4 uncertainty 2 |

P2 and P3 gate the **paper claim**, not the build. P1 and P5 gate
Sub-project I. Start S0 (below) in parallel with pre-flight.

## 1. Sequencing (critical path)

```
S0 Serialization spec (8h)  ──┬──> S1 KeccakIopCtx (40h) ──┐
                              └──> S2 Solidity verifier     ├──> S4 Integration (30h)
S3 SP1 guest program (8h) ────────  (120h, ABI decode       │
                                     blocked on S0) ────────┘
```

**S0 must come first.** Loop #4's highest-risk finding: a byte-encoding
mismatch between Rust prover and Solidity verifier is a *silent
completeness failure* — proofs verify in Rust and fail on-chain. Spec
before code, ≥20 differential test vectors as the contract between S1/S2.

### S0 — KoalaBear↔bytes serialization spec (8h) ← START HERE

Deliverable: `docs/engineering/specs/koalabear-serialization.md` defining:
- Canonical (non-Montgomery) form mandatory before hashing.
  **W24 crypto-research finding: Plonky3's `MontyField31` Serde impl
  serializes Montgomery form BY DEFAULT.** Every observe path must call
  `as_canonical_u32()` explicitly; test vectors must be generated from
  that path, never from default Serde.
- Endianness + width (default proposal: 4-byte little-endian, value < 0x7f000001; align to leanMultisig per pre-flight P5)
- Digest layout: `[KoalaBear; 8]` packed in 256 bits, mapping to/from `[u8; 32]`
- **Transcript message-type map**: byte prefixes distinguishing root
  observations, OOD answers, sumcheck partial sums, PoW witnesses
  (slop-whir separates by length only — insufficient for the PQ-sound
  audit surface)
- **Config-at-F-S-instantiation**: replicate the March 2026 slop fix
  ("observe config at F-S instantiation") in KeccakIopCtx's
  `default_challenger()` or prover/verifier transcripts diverge
- Rejection-sampling rule pinned to an IETF-style hash-to-field
  construction (RFC 9380 §5.2 adapted): byte grouping per attempt,
  max-rejections-then-rehash with domain-separated counter
  (~50% rejection rate at p = 0x7f000001; naive loops are grindable)
- 20+ test vectors (hex in, field elements out) committed as JSON, consumed by both Rust unit tests and Foundry tests
- **Method (qs-cto W24): vectors-first.** Write the 20 vectors + Rust/Foundry
  dual green test (6h spike) before the spec prose; codify the winning
  encoding afterwards.

### S1 — Sub-project I: KeccakIopCtx (40h)

New `slop-keccak` crate in an SP1 workspace fork, following the
`KoalaBearDegree4Duplex` pattern. Task breakdown from Loop #4 (42h raw):

| Task | h |
|------|---|
| KeccakIopCtx struct + associated types | 4 |
| CanObserve<KoalaBear> + CanObserve<[KoalaBear; N]> | 6 |
| CanSample<KoalaBear> + CanSampleBits<usize> | 4 |
| GrindingChallenger (serial PoW loop, ~30–50 LOC; model: MultiField32Challenger 28-line impl) | 6 |
| Keccak-based Hasher + Compressor (Merkle) | 6 |
| Plug into slop-whir Prover::prove() | 4 |
| Unit tests (observe/sample round-trip, PoW) | 4 |
| Integration test: 1 WHIR proof generate+verify with KeccakIopCtx | 4 |
| Serialization conformance vs S0 vectors | 4 |

Exit gate: slop-whir's existing integration tests pass under KeccakIopCtx;
differential run vs KoalaBearDegree4Duplex (same trace, both prove+verify).

### S2 — Sub-project II: Solidity WHIR verifier (120h, range 80–160h)

Merkle verification (Keccak256), KoalaBear field arithmetic, sumcheck
verification, PoW (grinding) check, "big beautiful" config
(84+21+12+9 queries, 16-bit PoW/round, fold 4). ABI decoding blocked on
S0; internals can start immediately. Foundry tests consume S0 vectors +
proof fixtures emitted by S1.

### S3 — Sub-project III: SP1 guest program (8h)

Extend the T1 spike (N=1..128 ML-DSA-65, `cc1871d`/`33241be`) to emit the
public-values layout the verifier expects. Builds on existing code.

### S4 — Integration + test (30h)

End-to-end: N=64 batch → SP1 prove → WHIR wrap (KeccakIopCtx) → Solidity
verify on Anvil fork → gas measurement against charter §1.3 KPI floor
(amortized < 50K gas/sig @ N=64; proof < 200 KB).

## 2. Calendar (KPI floor: publish benchmarks by 2026-Q4)

At a sustainable 15 founder-h/week, 198h ≈ 13 weeks → **finishing ~W37
(mid-Sep)**, leaving Q4 margin. At 20h/week: 10 weeks → ~W34.

| Window | Milestone |
|--------|-----------|
| W24–W25 | Pre-flight + S0 spec + S3 guest program |
| W26–W28 | S1 KeccakIopCtx complete (exit gate green) |
| W28–W33 | S2 Solidity verifier |
| W34–W36 | S4 integration, gas numbers, KPI table draft |
| 2026-11-16 | **RWC 2027 submission deadline** — realistic citation target (IEEE S&P 2027 R1 closed 2026-06-11; unreachable) |

## 3. Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Serialization mismatch Rust↔Solidity | Silent completeness failure | S0 spec + 20 differential vectors before S1/S2 code |
| m > 36 (proof size blowout) | KPI proof-size miss at N=64 | Pre-flight P3; fall back to N=16 |
| Theorem 4.8 list-decoding bound is conjectural | Weakens paper claim, not the build | Pre-flight P2; state assumption explicitly if so |
| slop-whir unaudited at ship time | Audit cost on QS (~$50K incl. S1+S2 surfaces, ~1300 LOC) | Pre-flight P4; budget line in qs-cfo planning |
| Founder time < 15h/week sustained | Schedule slip past Q4 | Weekly burn-down review in strategy meeting (qs-delivery agent) |
| SP1 workspace fork drift | Rebase pain over 13 weeks | Pin SP1 commit at v6.2.4 (2026-06-08) at S1 start; one mid-project rebase max |
| **Succinct ships first-party KeccakIopCtx before S1 completes** (W24 devils-ad) | S1 novelty collapses; RWC claim weakens to "verified what Succinct built" | Watch SP1 issue #2706 + slop commits weekly via restored daily-plan; if it lands, pivot S1 hours to S2 and reframe paper around the Solidity verifier + benchmark suite |
| PSE/0xPARC publishes SP1+ML-DSA benchmark for EIP-8288/8292 before W28 (W24 pm) | Erases "no published benchmark" whitespace | Monitor both EIP PR threads weekly; if competitor benchmark appears, publish S1 intermediate result (N=1 cycle count) immediately |

## 4. Budget interlocks

- Audit: ~$50K planning figure (Loop #4) — qs-cfo to map to grant timing
  (EF ESP). Audit is post-S4, pre-mainnet-claim; NOT needed for RWC paper.
- Compute: S4 proving runs (N=64) feasible on a single large EC2 box or
  SP1 prover network; cost decision deferred to S4 entry.

## 5. Burn-down ledger (qs-delivery W24 — artifact-based, no self-reporting)

One line per working session. Hours count only when the artifact SHA exists.
No artifact by Sunday = 0h that week.

| Date | Sub-project | Hours | Artifact (commit SHA / file) |
|------|-------------|-------|------------------------------|
| — | — | 0 / 198 | plan committed 2026-06-10 (`871f530`) |
