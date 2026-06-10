---
date: 2026-06-01 (W22 Mon JST)
test: T2 — multi-platform ML-DSA-65 verification benchmark plan
status: PLAN (drafted under charter v1.2)
charter: .claude/charter.md §1.3 Engineering KPI floor
parent: docs/intelligence/research/2026-06-01-W22-90day-deep-research.md
predecessors:
  - docs/intelligence/research/2026-W21-T1-sp1-results.md (N=1 SP1 baseline, 2,739,124 cycles)
  - docs/intelligence/research/2026-W21-T15-cycle-scaling.md (N=1,4,16,64,128 scaling)
  - docs/intelligence/research/2026-W21-T1-cycle-count-context.md (comparables)
---

# T2 — Multi-Platform ML-DSA-65 Verification Benchmark Plan

## Headline

Charter v1.2 makes ML-DSA-65 verification **gas, cycles, proof size,
aggregation factor** the KPI floor (§1.3). T2 measures QS's primitive on
the four production-relevant substrates head-to-head, against the
published ZKnox ETHDILITHIUM Solidity baseline, and publishes the result
under W23–W24 as the input artefact for the IEEE S&P 2027 Cycle 1
paper draft.

## Measurement targets (charter §1.3 mapping)

| Metric | Substrate(s) measured | Charter Q4 target | Stretch Q2-27 target |
|---|---|---|---|
| ML-DSA-65 verification gas | Solidity (QS) vs ZKnox ETHDILITHIUM | < 400K | < 250K |
| ML-DSA-65 zkVM cycles, N=1 | SP1, RISC Zero, Jolt | < 50M | < 20M |
| Aggregated proof size, N=64 | SP1 + WHIR (KoalaBear), SP1 + Groth16 | < 200 KB | < 80 KB |
| Aggregated verification gas amortized, N=64 | Solidity verifier of WHIR proof, on-chain | < 50K / sig | < 20K / sig |
| Peer-reviewed citations | IEEE S&P 2027 / RWC 2027 / IACR ePrint | ≥ 1 by 2026-Q4 | ≥ 3 by 2027-Q2 |

## Substrate matrix

### S1. Solidity verifier (head-to-head with ZKnox ETHDILITHIUM)

- **Baseline**: ZKnox ETHDILITHIUM (last commit 2026-03-24), reported
  ML-DSA-65 verify gas (need to re-measure on Sepolia fork — exact
  number not in charter; W21 pulse cites NTT precompile would cut
  73.4% gas in ETHFALCON, ML-DSA-65 ETHDILITHIUM number TODO).
- **QS implementation**: fork ZKnox ETHDILITHIUM, drop in (a) optimised
  NTT (EIP-7885 spec or equivalent in pure Solidity), (b) packed
  hint encoding, (c) batched sig verification when N>1.
- **Measurement harness**: `forge test --gas-report` against Anvil fork
  of Sepolia, 3-run median.
- **Honesty rule**: if QS gas ≥ ZKnox baseline, publish the result
  anyway and treat the gap as the W23–W26 engineering backlog. No
  fudging.

### S2. SP1 (Succinct) zkVM

- **N=1 baseline (already measured in T1)**: 2,739,124 RISC-V cycles
  on sandbox, founder-hardware wall-clock pending.
- **T2 extends to N=4, 16, 64, 128** (T1.5 covered cycle scaling;
  T2 adds the **proof size + wall-clock + RAM** numbers per N).
- **SP1 v6.1.0** with `succinct-1.93.0-64bit` toolchain (same as T1).
- **Compress + Groth16 wrap** for on-chain verification — measure proof
  size and Solidity verify gas of the wrapped SNARK.

### S3. RISC Zero zkVM

- **Why**: RISC Zero is the largest non-SP1 production zkVM, used by
  Bonsol / Boundless. Independent benchmark is required to claim
  "fastest" — else SP1-only number is self-selected.
- **Setup**: RISC Zero `risc0-zkvm` 2.x with `fips204` 0.4.6 ported
  (same crate as T1; RISC Zero's std-less env should accept it).
- **Same N=1, 4, 16, 64, 128** matrix.

### S4. Jolt zkVM

- **Why**: a16z `jolt-sdk` is the newest entrant. If Jolt benchmarks
  better than SP1 on ML-DSA-65, that's a finding QS should publish
  fast — and align upstream rather than fight.
- **Caveat**: Jolt's std support is incomplete as of W22; `fips204`
  porting may require N=1 only at first.

### S5. WHIR over KoalaBear (PCS for aggregated proofs)

- **Why**: W22 ethresear.ch /24902 follow-up showed WHIR Solidity
  verifier hits **1.9M gas at 100-bit / 22-vars**, **<1.5M gas at more
  aggressive parameters**. Aggregating N=64 ML-DSA verifications into
  one WHIR proof is QS's main path to the §1.3 stretch target of
  **< 20K gas / sig amortized**.
- **Implementation source**: `github.com/TomWambsgans/Whirlaway` and
  `hackmd.io/@clientsideproving/pq-snark-verifier`.
- **Measurement**: prove time, verify time, proof size, on-chain
  Solidity verify gas, for N=64 aggregation.

## Phase plan

### Phase T2.0 — environment prep (W22 残り, ~$5 cloud)

- Provision an EC2 r6i.4xlarge (32 GB RAM) or equivalent for SP1 prove
  wall-clock — T1 OOM'd at sandbox 16 GB. Charter §8 token budget is
  separate; T2 cloud spend is engineering, not agent budget.
- Pin toolchains: SP1 6.1.0, RISC Zero 2.x, Jolt latest tagged.
- Fork ZKnox ETHDILITHIUM into `src/contracts/l1/experiments/`.
- Smoke-test `fips204` 0.4.6 cross-compile to each target.

### Phase T2.1 — S1 Solidity head-to-head (W23 first half)

- Re-measure ZKnox ETHDILITHIUM ML-DSA-65 verify on Sepolia fork
  (`forge test --gas-report`, 3-run median).
- QS variant 1: optimised NTT loop unrolling.
- QS variant 2: packed hint encoding.
- Publish gas-per-sig table for N=1 only at this phase.
- Commit raw `forge` output as `docs/intelligence/research/T2-S1-raw/`.

### Phase T2.2 — S2 SP1 + S3 RISC Zero scaling (W23 second half)

- Re-run T1 N=1 on founder hardware (T1 unresolved item — wall-clock).
- Extend to N=4, 16, 64, 128 on the same hardware.
- Port `fips204` to RISC Zero, repeat matrix.
- Capture proof size + wall-clock + RAM per cell, not just cycles.

### Phase T2.3 — S4 Jolt N=1 (W24)

- Best-effort port. If Jolt blocks at std requirement, document the
  block and move on — don't burn W24 on porting work that doesn't
  ship to charter §1.3.

### Phase T2.4 — S5 WHIR N=64 aggregation (W24–W25)

- Implement WHIR-over-KoalaBear PCS for aggregated ML-DSA verify.
- Measure proof size + on-chain verify gas.
- This is the load-bearing benchmark for the §1.3 stretch targets.
  If WHIR aggregation hits **< 50K gas / sig amortized at N=64**,
  charter v1.2 thesis is empirically validated. If it doesn't, charter
  v1.2 needs another revision before any external publication.

### Phase T2.5 — IEEE S&P 2027 Cycle 1 paper draft (W23–W24, parallel)

- Title (working): "QS-ML-DSA: optimized on-chain verification of
  NIST FIPS 204 ML-DSA-65 for agentic-economy scale".
- Bibliography seeds: ZKnox ETHDILITHIUM (March 2026), Apple
  corecrypto (May 22 2026), eprint 2026/814 TSaaS, 2026/472 ML-DSA
  side-channel, 2026/721 LatticeFold+ ℓ2-norm, 2026/575 RoKoko,
  ethresear.ch /24902 WHIR.
- Abstract registration: **2026-06-05 (W23 Fri)**.
- Full paper deadline: **2026-06-11 (W23 Thu+1)**.
- Founder 30h budget. Skip-fork decision: if T2.1–T2.2 numbers are
  not in hand by W23 Wed, abstract submit anyway and target Cycle 2.

### Phase T2.6 — academic co-author outreach (W23, parallel)

- Targets (in order, charter §1.3 KPI = peer-reviewed citation):
  1. **京大 Sako** (electronic voting + lattice signatures). Voting
     use-case for aggregated ML-DSA is a clean joint story.
  2. **東大 Tanaka** (lattice cryptography). NTT / Karatsuba /
     AVX-512 mathematical optimality + Eurocrypt pipeline.
  3. **NICT Yamada** (PQC migration). CRYPTREC / public-doc citation
     path; weakest research synergy, strongest regulator path.
- One cold email each, 24h apart, with T2.0 numbers attached when
  available.
- Founder time: 2h drafting, 1h follow-up per reply.

## Honesty + replicability rules

- All raw `forge` and `cargo prove` output committed to
  `docs/intelligence/research/T2-{S1..S5}-raw/`.
- Hardware spec disclosed per measurement (T1 lesson: sandbox vs
  founder hardware diverges).
- 3-run median for every gas / time number.
- If a substrate beats QS, **publish the loss** — peer-reviewed
  credibility relies on this more than on winning.
- No marketing-only `headline` numbers separated from the raw data.

## What T2 does NOT cover

- Threshold ML-DSA (eprint 2026/814 TSaaS, 2026/638 THED) — out of
  scope; if Silence Labs publishes a benchmark first, QS reacts in T3.
- SLH-DSA (FIPS 205) — emergency-path only, no agentic-economy
  hot-path use case.
- Falcon (FIPS 206) — final standard not yet published; benchmark
  becomes meaningful only after NIST FIPS 206 final.
- Side-channel hardening (eprint 2026/472, 056) — Prover-node HSM /
  TEE policy is a separate engineering track (T3).

## Cost estimate (founder time + cloud)

| Phase | Founder h | Cloud $ | Calendar |
|---|---|---|---|
| T2.0 environment | 4 | 5 | W22 残り |
| T2.1 Solidity | 12 | 0 | W23 前半 |
| T2.2 SP1 + RISC Zero | 16 | 25 (32 GB EC2 ~2 days) | W23 後半 |
| T2.3 Jolt N=1 | 4 | 5 | W24 |
| T2.4 WHIR N=64 | 24 | 30 | W24–W25 |
| T2.5 IEEE S&P paper draft | 30 | 0 | W23 並行 |
| T2.6 academic outreach | 5 | 0 | W23 並行 |
| **Total** | **95** | **~$65** | **W22–W25** |

Charter §8 token budget unchanged; cloud spend is engineering.

## Decision gates

- **W22 Sun end**: T2.0 environment green — go/no-go for T2.1.
- **W23 Mon**: IEEE S&P abstract registration draft ready.
- **W23 Wed**: T2.1 Solidity numbers in hand; if QS gas > ZKnox,
  publish the loss and ship T2.2 anyway.
- **W23 Fri**: abstract submitted (Cycle 1) OR commit to Cycle 2.
- **W24 Wed**: WHIR aggregation N=64 first cut — if < 50K gas/sig
  amortized, charter v1.2 §1.3 stretch target empirically reachable;
  if not, founder reviews charter v1.2 again.
- **W25 Fri**: full T2 result memo committed; IEEE S&P paper either
  submitted (Cycle 1) or queued for Cycle 2.

## Open engineering risks

1. **ZKnox ETHDILITHIUM ML-DSA-65 actual gas number unknown to us**
   — W21 pulse cited 73.4% reduction figure was for ETHFALCON, not
   ETHDILITHIUM. Must re-measure on Sepolia fork before claiming any
   delta.
2. **Apple corecrypto OSS license** (2026-05-22 release) — Apple
   Public Source License is not GPL-compatible. T2 must not import
   Apple code; it can only reference Apple numbers as a benchmark
   comparable.
3. **WHIR Solidity verifier implementation maturity** — public
   implementation announced 2026-05-12 (ethresear.ch /24902); T2.4
   may need to upstream fixes.
4. **EIP-8051 surprise inclusion in Hegotá** — if Ethereum core devs
   suddenly accept ML-DSA precompile in H2 2026, T2.1 Solidity work
   is partially redundant. Monitor ACDE notes (Christine Kim) and
   `github.com/ethereum/EIPs` weekly through T2.

## Charter v1.2 link

This plan operationalises charter v1.2 §1.3 (Engineering KPI floor).
Every T2 phase output is auditable against the charter targets.
If T2.4 WHIR aggregation fails to hit the §1.3 stretch target, that
is a charter-level signal and triggers founder review, not a quiet
backlog item.
