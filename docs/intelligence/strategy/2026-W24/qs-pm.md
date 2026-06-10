---
agent: qs-pm
meeting: 2026-W24 (2026-06-10)
model: sonnet (via Fable 5 orchestrator)
---

# QS-PM Position Paper — W24, 2026-06-10

## Caveat on signal quality

The autonomous intelligence pipeline was dark for 32 days (2026-05-09 to today). Most live sources blocked WebFetch with 403. The two productive spot-checks yielded one genuinely significant finding (detailed below). Everything else labeled "W22" is sourced from `docs/intelligence/research/2026-06-01-W22-90day-deep-research.md`. Treat W23/W24 signal coverage as incomplete; restore the pipeline before the next strategy meeting.

## 1. Position

The demand landscape for a PQC on-chain verification primitive shifted materially in the 32-day gap. The highest-value signal from the spot-check: two Ethereum EIP pull requests opened in the last week of May / first days of June 2026 — **EIP-8288** ("Frame type for PQ sig and STARK aggregation," authored by Vitalik Buterin and Thomas Coratger, opened 2026-06-05) and **EIP-8292** ("Post-Quantum Attestation Aggregators," opened 2026-06-08 with Justin Drake, Thomas Coratger, and six co-authors) — together signal that Ethereum's core research layer has moved from PQC as a vague future concern to PQC as an active protocol-design target. Both proposals converge on the same architecture QS is building: prove post-quantum signatures in a succinct recursive proof, aggregate them, verify cheaply on L1. That is Approach A's entire value proposition. The W22 finding that PQ EIPs were absent from ACDE #236/#237 is now stale; the research layer has accelerated. Simultaneously, the GitHub search for published ML-DSA + SP1 proof repositories returned zero results, confirming that no one has published benchmark numbers yet. The benchmark whitespace that W22 identified as a pre-emption opportunity is still open as of today.

## 2. Three concrete actions — next 7 days

**P0 — Read EIP-8288 and EIP-8292 in full and map them to Approach A's architecture.**
Both proposals use EIP-8141's `VERIFY frame` as their settlement layer and require a recursive STARK or succinct proof over ML-DSA signatures. The SP1 + WHIR + Keccak transcript stack in Approach A is architecturally compatible. The founder should spend 3 hours this week reading the two PR bodies and comments, then write a 1-page internal memo at `docs/intelligence/strategy/2026-W24-eip8288-8292-compat.md` noting (a) whether QS S4 output is already the proof artifact these EIPs expect as input, (b) whether the verifier interface overlaps with EIP-8141's frame type, and (c) whether either proposal's author list is reachable for a benchmark co-publication offer. If the answer to (a) or (b) is yes, the RWC 2027 paper gains a concrete deployment context — which dramatically improves acceptance probability. Time cost: 3 founder-hours this week. Does not touch the Approach A build schedule; S0 proceeds in parallel.

**P1 — Restore the daily-plan pipeline before W25.**
The three founder actions in the outage diagnosis take ~15 minutes combined. A W25 strategy meeting with another 32-day hole in intelligence coverage is not acceptable during the 13-week Approach A build window. EIP-8288 and EIP-8292 are the kind of signal the daily pipeline should have surfaced within 48 hours of being filed. It did not, because the pipeline was dead.

**P1 — Do not cold-outreach BitGo, Fireblocks, or KISA this week.**
W22 recommended this (P0.1, P1.1, P1.6). The recommendation stands in principle, but cold outreach to institutional custodians with no benchmark numbers to show yields no signal. Right sequencing: publish benchmark numbers first (W34-W37), then outreach. One exception: if the EIP-8288/8292 review identifies a named author actively designing the on-chain ML-DSA verification interface, that is a warm contact worth 1 email this week because the timing is optimal.

## 3. One demand-side risk

EIP-8288 and EIP-8292 move faster than expected and a PSE or 0xPARC team produces a reference SP1 + ML-DSA benchmark to accompany the EIP specification before QS reaches S4 in W34-W37. This would not kill QS — first-published benchmarks are citable, not permanently binding — but it would erase the "no published benchmark" whitespace that is currently the clearest demand-side wedge. Signal to watch: a repository appearing in the EIP-8292 PR body linking to cycle numbers. The daily-plan pipeline, once restored, should monitor both PR threads weekly. If a competitor benchmark appears before W28, QS should consider publishing the S1 intermediate result (KeccakIopCtx cycle count, N=1) immediately rather than waiting for S4 N=64 aggregated numbers.

## 4. One non-obvious opportunity

EIP-8292 has eight co-authors including Justin Drake and Thomas Coratger; Coratger also co-authored EIP-8288 with Vitalik. Both proposals converge on exactly the proof artifact that Approach A produces. The non-obvious move: frame the RWC 2027 paper not as "here is a standalone ML-DSA zkVM verifier" but as "**here is the reference implementation and benchmark suite for the proof artifact required by EIP-8288 / EIP-8292**." That reframe turns the paper from an independent research contribution into a standards-accompanying artifact — a category RWC program committees prioritize, and that simultaneously creates a credible integration story for every wallet, agent runtime, and validator client that will eventually implement these EIPs. This window exists only because the two EIPs were filed this week while Approach A's interface is still malleable (S0 not yet committed). The window to align the S0 spec to the EIPs' proof format is roughly W24-W26 before S1 code hardens.

## 5. Position summary — top 3 actions ranked

1. **P0: Map EIP-8288 and EIP-8292 to Approach A's S0 interface spec.** (3h, this week, before S0 is committed.) If the proof format is compatible, the RWC paper converts from academic to standards-adjacent. Irreversible if missed.
2. **P0: Restore the daily-plan pipeline.** (15 min founder admin.) Two material EIPs were filed during the outage and were only discovered by manual spot-check today.
3. **P1: No institutional outreach until benchmark numbers exist.** (Negative action — budget protection.) Every hour not on Approach A is schedule risk; outreach without numbers produces no signal.
