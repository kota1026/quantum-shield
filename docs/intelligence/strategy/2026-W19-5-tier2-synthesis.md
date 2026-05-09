---
status: TIER-2 SYNTHESIS — final memo before Phase 2.4 meeting + founder decision
date: 2026-05-09 Sat JST
parent: docs/intelligence/strategy/2026-W19-5-architecture-audit.md
inputs:
  - docs/intelligence/research/2026-W19-eth-pqc-problem-space.md (Phase 2.1: ETH community problem space)
  - docs/intelligence/research/2026-W19-pqc-primitive-landscape.md (Phase 2.2: 2026 primitive inventory)
  - docs/intelligence/research/2026-W19-architecture-alternatives.md (Phase 2.3: 5 alternative architectures)
  - docs/intelligence/research/2026-W19-ef-pqc-grant-alignment.md (Phase 2.1b: EF problem-statement alignment)
agent_cost: ~$1.20 across 4 research agents
---

# QS Architecture Tier-2 Synthesis (W19.5 Path A Decision Memo)

## TL;DR

Tier-2 cryptographic + ecosystem audit consolidates 4 research streams. **The founder's instinct that Nov-Dec 2025 premises are stale is correct in 5+ specific places**. Most consequential: (1) EIP-8051 / EIP-8052 / EIP-8141 in motion for Hegotia (2H-2026) collapse the SR_0/SR_1 split rationale; (2) Mithril threshold-ML-DSA paper (USENIX '26) + published Rust crate retire the W19.5 Finding E "FROST structurally invalid" verdict; (3) **EF's revealed preference is migration-tooling and AA-native registries — NOT custody products**. Coinbase / Fireblocks / Anchorage own custody in EF's mental model.

**The narrowest clear path is A+C hybrid**: thin AttestationRegistry on EIP-8141/8051 (Architecture A, EF-aligned, 11-15 weeks, lowest cost) **plus** a Migration-vehicle module (Architecture C, 3 STRONG EF problem-statement matches, larger market). They are not mutually exclusive. Architectures B/D/E lose EF alignment and require different funding pipelines (Coinbase Custody ICA, Fireblocks MPC standards, lattice cryptographer hire respectively).

**Recommended decision shape for Phase 2.4 meeting**: pick A as v1 architecture (low risk, fast ship, EF-aligned), prepare C as v2 module (concurrent ERC drafting + ethresear.ch engagement), defer B/D/E unless a different non-EF funding source materializes.

---

## What changed since Nov-Dec 2025 (cumulative delta)

The Nov-Dec 2025 architecture decisions were rational under the constraints visible at decision time. Five specific premises that were valid then are not valid now:

| Premise (Nov 2025) | 2026-05 reality | Source |
|---|---|---|
| ML-DSA-65 verify on-chain costs ~15.5M gas → SR_0/SR_1 split is necessary | EIP-8051 draft proposes ~3k gas precompile for ML-DSA-44; EIP-8052 ~3k gas for Falcon-512; ETHFALCON does Falcon in 1.5M gas (Solidity, not precompile); NTT precompile (`0x15`) shipped on devnets | Phase 2.2 |
| Threshold-Dilithium / FROST is "structurally invalid" (W19.5 Finding E) | Mithril (eprint 2026/013, USENIX Sec '26): FIPS-204-compatible threshold ML-DSA-65, 3 online rounds, ≤6 parties, ≤1 MB comms/party. `threshold-ml-dsa` Rust crate published. **Finding E is now explicitly retired** | Phase 2.1, 2.2 |
| MPC vendors will integrate (buy from QS) rather than build internally | Fireblocks issued public "Standardizing MPC Cryptography" cross-industry call. Coinbase committed to in-house quantum-proof custody by EOY 2026. Evidence skews BUILD, not buy | Phase 2.1, prior W19 job-posting survey |
| Account Abstraction (EIP-8141) is orthogonal to QS | EIP-8141 explicitly defines per-account verification frame for ML-DSA / Falcon. QS's L1Vault `lock(msg.sender, dilithiumPubKey)` ABI is incompatible with EIP-8141's EntryPoint-as-msg.sender flow. **Not orthogonal — competing for the same surface** | Phase 2.1, W19.5 audit |
| EF interest in "PQC custody" is the natural QS fit | EF funds primitives (ZKnox verifier), specs (EIPs), aggregation infra (leanXMSS), research (PSE). **No dedicated PQ custody RFP exists**. Custody is treated as incumbent territory (Coinbase, Fireblocks, Anchorage) | Phase 2.1b |

Two premises emerged in 2026 that have NO Nov-2025 analog (i.e., these are entirely new problems):

- **Legacy EOA migration via ZK-hidden-pubkey** (eprint 2026/352 Kiraz & Kardas; ethresear.ch 24754) — published in 2026, did not exist as a community topic in Nov-Dec 2025
- **BIP32 HD-wallet derivation in lattice-land** (eprint 2026/380, Feb 2026) — first practical construction; QS does not address

The Nov-2025 architecture is not just stale on a few points — it is solving a different problem set than the community is currently working on.

---

## EF revealed preference (the funding-fit lens)

Phase 2.1b mapped what EF actively funds vs what it does not. The picture is sharper than "EF likes PQC":

**EF actively funds**:
- Per-account algorithm-agility specs (EIP-7693, EIP-7932, EIP-8141, EIP-8051, EIP-8052) — the migration-vehicle problem
- ZKnox PQC verifier (precompile / Solidity) — primitive-level work
- leanXMSS / leanMultisig (hash-based aggregation at validator layer) — operational infrastructure
- PSE research projects (Falcon implementations, until LaBRADOR went into "monitored for bug fixes" mode)
- $20M Protocol Snarkification — ZK proof-system formal verification
- Vitalik / Drake Q-day reasoning at 2029 working assumption — protocol-layer migration

**EF explicitly does NOT fund**:
- Custody products (treated as Coinbase / Fireblocks / Anchorage incumbent territory)
- MPC infrastructure (Fireblocks-led, not EF)
- Bespoke decentralized prover quorums for cryptographic verification (deprecated by precompile work)

**EF "revealed preference" anti-claims** (Phase 2.1b found these by absence):
- No dedicated PQ custody RFP exists.
- No 0xPARC PQC fellowship has been confirmed via search.
- The "April 2026 advisory paper" the founder recalled is **Coinbase's** Independent Quantum Advisory Council, with Justin Drake (EF) as co-author. **Not an EF publication.** Any internal QS note referencing it as EF-published needs correction.
- The Proximity Prize that has been mentioned in adjacent discussions is Reed-Solomon coding theory for ZK-SNARK foundations, **not PQC**. Do not cite as PQC alignment.

**The strongest founder-recollection match**: dormant-wallet governance is the EF "unsolved political problem" — referenced in Coinbase Council recommendations and in PQTS Breakout discussion. This is QS Architecture C territory directly. Migration-vehicle framing is what EF is publicly asking for, not custody framing.

---

## Architecture × EF alignment × audit-readiness summary

Combining Phases 2.3 and 2.1b:

| Architecture | EF alignment | Audit-readiness of primitives | Calendar weeks | Defensible against W19.5 audit findings | Survives Hegotia slip |
|---|---|---|---|---|---|
| **A** EIP-native registry | **3 STRONG** | medium (EIP-8051 spec unaudited) | **11-15** | yes (resolves A-vs-C contradiction) | NO (Hegotia-dependent) |
| **B** Threshold-ML-DSA | **0 STRONG** from EF | low (`threshold-ml-dsa` unaudited) | 21-27 | yes (reframes C as threshold) | yes |
| **C** Migration vehicle | **3 STRONG** | medium-low (STARK circuit novel) | 26-35 | yes (removes both A and C) | partially |
| **D** ZKVM-attested | medium (Snarkification narrative) | medium (zkVMs audited, ML-DSA circuit not) | 23-32 | yes (removes C) | yes |
| **E** Aggregator (LaBRADOR) | **negative** (PSE LaBRADOR maintenance mode) | very low (research only) | 26-35+ | reframes C as aggregator | yes |

**The two architectures with EF problem-statement support (A and C) cluster together**. Phase 2.1b's most actionable finding: **A and C are technically not mutually exclusive**. A v1 deployment (registry on Hegotia) can carry C as a v2 module (migration-vehicle on top of the same registry). This is the path that minimizes risk while maximizing EF-alignment density.

---

## Architecture × W19 founder-decision implications

The W19 binding memo committed to 9 founder decisions. Tier 2 forces revisions to several:

| W19 Decision | Original commit | Tier 2 implication |
|---|---|---|
| #1 Submit ESP Mon 5/11 | YES | Already deferred per W19.5 audit. Path A rebuild target ~6 months → ESP body must be substantially rewritten before re-submission |
| #5 Threshold-Dilithium / FROST asymmetric bet | YES | **Reactivated** under Architecture B framing (Mithril). Was deferred in W19.5 Q2; can return as v3 module after A+C ship |
| #6 Drop dual-sig as marketing centerpiece | YES | Stands. None of the 5 architectures lead with dual-sig |
| #2 Freeze new agent infra 7 days | YES | Stands. The agentic infra performed exactly its intended job here (4 research agents → 1.20$ → architecture clarity) |
| W19 wedge: composable PQC layer for MPC custodians | YES | **Dies** under Architectures A and C. Reframe required: QS becomes ERC author + reference implementation, not custodian-integration vendor. (This is W19.5 Path C — same conclusion via different evidence) |

---

## The hardest steelman objections (from Phase 2.3 + 2.1b)

For Phase 2.4 meeting input:

1. **"If EIP-8141 ships with 8051 precompile, the AttestationRegistry is 200 lines of Solidity that any wallet team will write themselves in an afternoon. QS's defensibility under Architecture A is zero."** Counter: ERC authorship + Japan-FSA citation + reference-implementation maintainership are real moats, but they are *not* software-product moats. Founder must accept business model shift from product to spec.

2. **"Migration-vehicle (Architecture C) lifespan is exactly pre-Hegotia → Hegotia. The moment EIP-8141 specifies its own canonical migration receipt, QS's bespoke MigrationRegistry gets swept aside."** Counter: co-design relationship with EF (the goal is to be cited *by* the EIP, not sidelined by it). Requires founder to enter ethresear.ch thread 24754 + eprint 2026/352 conversation as collaborator, not competitor. The W19.5 audit identified this credential gap as real.

3. **"Threshold-ML-DSA (Architecture B) is what Fireblocks will ship in 2026 with 200 engineers. QS as 1 founder with 6 months cannot beat them to a production-grade reference implementation, and even if it does, custodians prefer their own internal implementation over an external one for institutional risk reasons."** Counter: open standard wins regulatory citation (DORA Art. 28, JCMVP, JFSA) even if not adopted as code. But this is a slow play (12-24 months to compounding citation value), not a runway-friendly play.

4. **"PSE LaBRADOR is in maintenance mode. PSE itself has not productionized lattice-SNARK aggregation. A solo founder shipping production LaBRADOR is implausible at any reasonable cost."** Counter: there is no counter to this. Architecture E should not be pursued without a contracted lattice cryptographer and a custodian partner — both are non-engineering preconditions.

5. **"ZKVM-attested (Architecture D) is over-engineered transition technology. EIP-8051 ships → multi-minute ZK proof of an operation a 3k-gas precompile does is theatre."** Counter: useful only as the gap-window architecture (now → Hegotia). After Hegotia, A subsumes D.

---

## What I recommend (synthesizer position, founder may overrule)

**Decision shape**: A as v1, C as v2 module, both pursued in parallel.

**Sequencing for the 26-week budget the founder has implicitly been operating against**:

| Weeks | Workstream | Deliverable |
|---|---|---|
| W21-22 (May 12-25) | ERC drafting (A's AttestationRegistry leaf format) + ethresear.ch engagement on thread 24754 (C's BIP39→PQ STARK proof, Kiraz & Kardas) | 2 ERCs in DRAFT status; founder visible in 1 active research thread |
| W23-26 (Jun-Jul) | A v1 contracts implementation (parallel deployment to existing Vault, not replacement) | New AttestationRegistry contract on Sepolia; old Vault stays as legacy |
| W27-32 (Jul-Aug) | A v1 audit + frontend rewire | Audited registry; UX migration |
| W29-36 (Aug-Sep, overlapping) | C v2 module implementation: MigrationRegistry + STARK circuit | Migration wizard prototype |
| W37-44 (Oct-Nov) | C v2 audit + ESP re-submission with both architectures | Audited; ESP body fully rewritten; re-submit |

**Critical preconditions for this plan**:

1. **Hegotia confirms EIP-8141 + EIP-8051 inclusion by 2026-Q3**. If they are removed from Hegotia, Architecture A loses its host fork and the plan needs revision. Watch the All-Core-Devs calls through 2026-Q3.

2. **Founder enters ethresear.ch thread 24754 as a collaborator** within W21. If the founder cannot establish credentials in the migration-vehicle conversation, Architecture C becomes harder.

3. **ESP must be re-framed before re-submission**. The current ESP body claims composable-MPC custody — none of the 5 architectures support that framing. Architecture A pitch: "We are building the reference implementation of EIP-8141's attestation registry, with explicit FIPS-204 compliance suitable for Japan FSA citation." Architecture C pitch: "We are building the migration vehicle for legacy EOAs to PQ schemes, co-designed with the ethresear.ch 24754 working group."

4. **Founder must concede the MPC-vendor wedge** explicitly. The W19 thesis "composable layer for MPC custodians" does not survive any of the 5 architectures. The new wedge is "EF-aligned ERC author + Japan FSA-citation reference implementation". This is a business-model shift, not just architecture.

---

## What Phase 2.4 (agent meeting) needs to settle

The Phase 2.4 meeting should not redo Tier-2 research — it should **stress-test the A+C hybrid recommendation against the 6 strategic-agent lenses**:

1. **qs-pm**: does the A+C hybrid actually capture the buyer signal the W19 wedge was chasing, or is it a strategic retreat dressed up as standards play?
2. **qs-cto**: is the 26-week sequencing realistic given solo-founder bandwidth + audit dependencies?
3. **qs-cfo**: does the budget survive 26 weeks of rebuild before any revenue-positive event?
4. **qs-threat**: does the regulatory framing (FIPS-204, DORA Art. 28, JFSA) survive A+C reframing?
5. **qs-compete**: with custody wedge dead, what is QS's actual market position vs Fireblocks / Coinbase / QRL?
6. **qs-devils-ad**: what is the sharpest objection to A+C that this synthesis missed?

The meeting should also flag whether **Architecture B (Threshold-ML-DSA)** should be pursued as a *parallel* track for non-EF funding (Coinbase Custody ICA citation, Fireblocks MPC standards body engagement) — Phase 2.1b found this is the only architecture with strong custodian-industry pull but zero EF pull.

---

## Founder decisions queued for Phase 2.4 + post-meeting

1. **A+C hybrid as Path A architecture: confirm or overrule**?
2. **Hegotia confidence**: am I willing to bet 12 weeks on Hegotia confirming EIP-8141 by 2026-Q3? If not, what's the fallback?
3. **MPC-vendor wedge concession**: am I willing to publicly walk back the W19 "composable layer for MPC custodians" framing in ESP body + ethresear.ch + arxiv?
4. **ethresear.ch thread 24754 engagement**: can I commit founder time (1-2 hours/week) to being visible in this conversation for the next 12 weeks?
5. **ESP re-submission target**: 2026-Q3 or 2026-Q4? (Drives W21-W32 sequencing)
6. **Architecture B as parallel non-EF track**: yes / no / decide later?

---

## Audit cost vs value (W19.5 + Tier-2 cumulative)

- W19.5 5-lens audit: ~$0.50, 25 minutes, prevented public commitment to code-unbacked claims
- Tier-2 4-stream research: ~$1.20, ~3 hours, surfaced 5 specific Nov-2025 premises that were stale + identified A+C hybrid as the EF-aligned path
- Total: ~$1.70 / ~3.5 hours of agent work
- **Outcome**: clear architectural path vs. continuing to publish credibility content built on stale premises

The agentic infrastructure has now justified its construction cost twice in one weekend. The founder's instinct to pause and audit before committing to Path A engineering was the highest-EV decision of the W19.5 + Tier-2 process.

---

**Next**: Phase 2.4 6-agent meeting (~$0.60, ~10 min wall-time). Recommend launching Sun evening when founder back from Yamanashi + has time to read this synthesis first.
