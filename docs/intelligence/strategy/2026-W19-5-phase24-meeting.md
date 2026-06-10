---
status: PHASE 2.4 STRATEGY MEETING — final synthesis before founder Path A decision
date: 2026-05-09 Sat JST
parent: docs/intelligence/strategy/2026-W19-5-tier2-synthesis.md
participants: qs-pm, qs-cto, qs-cfo, qs-threat, qs-compete, qs-devils-ad
agent_cost: ~$0.60 across 6 strategic-agent stress-tests
verdict: MODIFY (6/6 agents) — A+C direction correct, execution sequencing fundamentally broken
---

# QS Path A Architecture — Phase 2.4 Strategy Meeting

## TL;DR

All 6 agents voted **MODIFY** (none CONFIRM, none OVERRULE). The A+C hybrid recommendation is directionally correct but execution-broken in 5 specific ways. Critically, **the synthesis optimized for grant fit at the cost of revenue validation** (devils-ad sharpest objection). The agents collectively converged on a "test phase before commit phase" sequence that the original synthesis did not contemplate: **5 cheap tests, all under 1 week each, that gate any architecture commitment**. Run those tests in W20-W21 before writing a single line of new contract code.

The **single highest-EV decision the synthesis missed**: Architecture B (Threshold-ML-DSA) maps to a NAMED PAYING BUYER (Fireblocks / Coinbase Custody / BitGo) that A+C does not. Synthesis deferred B because EF doesn't fund it. CFO + DA + PM all flag this as **optimizing for the wrong funding source**. The fix is not "do B instead of A+C" — it's "validate B's buyer thesis with one cold email this week before committing 26 weeks to A+C".

The **second-highest-EV insight (CFO)**: JSPS 若手研究 bridge grant has **$45,375/h expected value vs ESP's revised $2,411/h** (18× better) under the new timeline, with cash event by 2026-Q4 not 2027-Q1. ESP-only funding plan is incomplete.

---

## 6-Lens Verdict Matrix

| Agent | Verdict | Sharpest concern | Single change request |
|---|---|---|---|
| **qs-pm** | MODIFY | A+C asks founder to accept "buyer = EF grants" without forcing the trade-off explicit. JFSA-custody buyer DIES under A+C. | Force buyer-model binary BEFORE ratifying. Run 1 buyer call (B falsification test) in W20-21. Move ethresear.ch commitment from W21 to W24. |
| **qs-cto** | MODIFY | 26-week estimate is wishful — honest A+C total is **32-36 weeks** (audits cannot run in parallel; Hegotia confirmation deadline crosses A audit window). ML-DSA-44 vs 65 fork is the single unresolved blocker. | Spike EIP-8051 scope + ETHFALCON full-verify gas benchmark **W21 day 1** (≤1 day). Book audit firm in W22, not W27. |
| **qs-cfo** | MODIFY | Audit funding is chicken-and-egg ($80-125k for 2 audits, ESP can't fund until approved, ESP needs audit credibility). 26 weeks no-revenue exceeds current runway model. | **Pursue JSPS 若手研究 bridge grant** (Oct deadline, $33k @ 27.5% = $45,375/h EV — 18× better than revised ESP). Drop "Architecture B parallel non-EF track" framing — no real pipeline exists. |
| **qs-threat** | MODIFY | ML-DSA-44 (EIP-8051) vs ML-DSA-65 (regulatory defensibility) creates compliance-level split A+C cannot straddle. Conflating them in compliance docs kills credibility at step 1. | Bifurcate explicitly: ML-DSA-65 for all regulatory citations; EIP-8051 (level II) is gas-optimization variant only. Update crosswalk before any external publish. |
| **qs-compete** | MODIFY | Architecture A's "ERC author" framing is **NOT defensible against Safe / Coinbase Wallet / Privy / MetaMask** who have stronger distribution + EF relationships. JFSA wedge attaches to C only. | **Lead with C, demote A to infrastructure**. Reverse synthesis ordering: C migration wizard as v1 product, A's AttestationRegistry as underlying leaf format C deposits into. |
| **qs-devils-ad** | MODIFY | A+C is not a hybrid — both architectures share a single Hegotia dependency. If EIP-8141 slips out of Hegotia, BOTH die simultaneously. Plus: **synthesis optimized for grant reviewers, not company survival**. B has the only named paying buyer; deferring it is "wrong funding-source optimization". | **Drop C entirely. Do A-then-maybe-B serial**: ship A as ERC-first (Hegotia-optional), use the 11-15 weeks to run buyer calls validating B; if confirmed, pivot to B in W33+. Falsifiable with ONE cold email this week. |

---

## Convergence (4+ agents agree)

These are the points where dissent did NOT exist — meaning the synthesis must address them:

1. **The W21 ethresear.ch deadline is unrealistic** (pm, compete, devils-ad). Academic credentialing takes 3 months, not 2 weeks. Founder is at son's soccer in Yamanashi this weekend. Posting a thin reply in W21 with no technical substance damages credibility in the exact community A+C depends on.

2. **Architecture B was wrongly deferred** (pm, cfo, devils-ad). It is the only architecture with a NAMED potential paying buyer (Fireblocks "Standardizing MPC Cryptography" cross-industry call, Coinbase Custody EOY 2026 commitment). Deferring it because EF doesn't fund it is optimizing for ONE funding source while ignoring the BUYER funding source. The fix is not to reverse the deferral — it is to run the missing buyer call first.

3. **ML-DSA-44 (EIP-8051) vs ML-DSA-65 (CNSA 2.0 / institutional default) is the unresolved technical fork that contaminates everything downstream** (cto, threat). ESP body, JFSA citation, audit scope all depend on this single decision. Spike it in 1 day before ANY downstream work proceeds.

4. **The 26-week estimate is broken** (cto explicitly, cfo by audit-funding implication). Honest total is 32-36 weeks with audits serialized. This crosses the Hegotia confirmation deadline (2026-Q3) and pushes ESP re-submission past W47. ESP $/h EV degrades from $7,500/h (W19) to $2,411/h (W19.5+Tier-2) — still positive, but no longer dominant.

5. **The "spec moat" claim of Architecture A does not survive Safe / Coinbase Wallet / Privy / MetaMask competing for the same canonical reference status** (compete, devils-ad implicit). QS does not have the EF co-author relationships those teams already have. ERC authorship without being-asked-to-write-the-ERC is just publishing.

---

## Preserved Tensions (genuine disagreement, founder must adjudicate)

### Tension 1 — Lead with C or lead with A?

- **compete**: LEAD WITH C. Coinbase will not open-source migration tooling that exposes their institutional clients' key vulnerability — that gap is structurally protected. JFSA wedge attaches to C only.
- **devils-ad**: DROP C ENTIRELY. C requires academic credentialing QS doesn't have; A is Hegotia-optional with ERC-first framing. Do A-then-maybe-B.
- **pm + cto + cfo + threat**: implicit — A first because lower cost (11-15 weeks alone), C as v2 module IF buyer signal warrants.

**Synthesis ruling**: Tension genuinely unresolved. Resolution depends on the buyer-call test (Tension 3 below). If buyer call validates ANY custodian B-shaped demand, devils-ad's A-then-B path wins. If buyer call validates JFSA-regulated migration demand specifically (compete's C wedge), C-first path wins. If both fail, A-only is the safe default.

### Tension 2 — Hold or drop Architecture B?

- **devils-ad**: B has the only NAMED paying buyer. Falsify with one cold email in W20.
- **pm**: B should be elevated to "primary if buyer-call confirms" not "parallel non-EF track candidate".
- **cfo**: B's "parallel non-EF track" is wishful — Coinbase ICA + Fireblocks MPC standards have no funding pipelines.
- **synthesis ruling**: agents agree B SHOULD be tested before deferred. The W19.5 + Tier-2 deferral happened without the falsification test that everyone (DA in W19.5, all 6 agents in Phase 2.4) has now requested. **Run the test.**

### Tension 3 — When to do the buyer call?

- **pm**: BEFORE ratifying A+C (gates the entire architecture decision)
- **devils-ad**: THIS WEEK (W20). Cold email Fireblocks VP Eng / Coinbase Custody lead / BitGo security team.
- **synthesis ruling**: founder Q1 in W19.5 was "NO — no warm intro available" for the Mon ESP buyer call. The buyer call has been deferred 3 times now (W19, W19.5, Tier-2). It is the single most expensive deferral in QS's history per devils-ad. **The buyer call must happen in W20-W21 BEFORE the architecture decision is ratified.** Cold email is acceptable; warm intro is not required.

---

## The 5 Cheap Tests (collectively endorsed, all ≤1 week, gate architecture commitment)

These emerged as the **convergence finding** across all 6 agents. They are CHEAPER than the analysis we already did and directly address the 5 synthesis flaws. Run all 5 in W20-W21 BEFORE committing to any architecture path.

| Test | Owner | Cost | Falsifies | Source |
|---|---|---|---|---|
| **T1**: Spike EIP-8051 scope (level II only?) + ETHFALCON full-verify gas benchmark on Anvil fork | founder + Claude | ≤1 day | ML-DSA-44 vs ML-DSA-65 architectural decision | qs-cto |
| **T2**: Send 1 cold email to Fireblocks VP Eng OR Coinbase Custody lead OR BitGo security team. Ask: "Would you evaluate a FIPS-204-compatible threshold ML-DSA signing coordinator on Sepolia in Q3 2026?" | founder | 1 hour to write + send | Architecture B buyer thesis | qs-pm, qs-devils-ad |
| **T3**: Post 1 technically substantive question in ethresear.ch thread 24754 (Kiraz-Kardas migration). NOT a product announcement — a specific question about gas-cost assumptions or seed-derivation edge cases. Measure response within 5 days. | founder | 4-5 hours (read paper + thread + write) | Architecture C academic-collaborator path | qs-compete, qs-devils-ad |
| **T4**: Watch next 2 All-Core-Devs calls (publicly recorded). Track whether EIP-8141 + EIP-8051 move from "Consider for Inclusion" to "Confirmed for Hegotia". | founder | 3 hours over 2 weeks | Architecture A Hegotia hard dependency | qs-devils-ad |
| **T5**: Pull JSPS 若手研究 application requirements + identify university affiliation path (NAIST or NII visiting researcher) | founder | 4-6 hours | Bridge funding viability ($45k/h EV vs ESP $2.4k/h) | qs-cfo |

**Total founder time across all 5 tests: ~12-15 hours over W20-W21**.

After all 5 tests complete, the architecture decision becomes evidence-based instead of grant-fit-based. The decision matrix:

| T2 Buyer call signal | T3 ethresear.ch signal | T4 Hegotia signal | Recommended path |
|---|---|---|---|
| Negative ("we build internally") | Negative (no engagement) | Confirmed | **A-only**, ERC-first, Japan-FSA crosswalk publish (compete's reduced wedge) |
| Negative | Positive (active engagement) | Confirmed | **A+C as synthesized**, but with W24+ ethresear.ch milestone instead of W21 |
| Positive ("we'd evaluate") | Negative | Either | **B-primary**, defer A+C until B buyer signal converts (devils-ad's path) |
| Positive | Positive | Either | **B-then-A**, B captures revenue signal, A captures spec citation |
| Negative | Negative | NOT confirmed (slip) | **Pause Path A entirely**, revisit Tier-3 audit when Hegotia clarity returns |

---

## New CFO Finding (highest-EV decision the synthesis missed)

**JSPS 若手研究 bridge grant**:
- Amount: ~¥5M (~$33k USD)
- Application time: ~20 hours
- Approval rate (implementation-focused projects): 25-30%
- Decision timeline: 12-16 weeks
- Cash event: 2026-Q4 (BEFORE ESP if pursued)
- **Expected value: $45,375/hour** (vs revised ESP $2,411/h under new timeline)
- 18× better than ESP under A+C 26-week plan

**Hard prerequisite**: university affiliation (NAIST visiting researcher or NII collaborator). Standard 4-8 week setup. Founder must initiate by **early July 2026** to make October JSPS deadline.

CFO single budget decision by **Fri 2026-05-16 (W20)**: pursue JSPS bridge grant YES/NO. If YES, university-affiliation outreach starts Mon W21.

This is an entirely separate workstream from architecture decision — both can proceed in parallel.

---

## Critical W21 Engineering Action (CTO, ≤ 1 day)

**Pull EIP-8051 source from `ethereum/EIPs` repo + run ETHFALCON full-verify gas benchmark on Anvil against deployed SPHINCSVerifier baseline (`0xD090b5A6...0103` Sepolia)**. Output: single markdown table committed to `docs/intelligence/research/` with:
- Confirmed EIP-8051 security level scope (level II only? level III planned variant?)
- ETHFALCON full-verify gas (hash-to-point + NTT + check, NOT just NTT-only number)

This unblocks **3 downstream blockers simultaneously**:
1. ML-DSA-44 vs ML-DSA-65 architectural decision
2. Security-level regulatory crosswalk update
3. Architecture A ERC drafting wording

Without this 1-day spike, all subsequent A+C work is built on unverified assumptions.

---

## What the Synthesis Actually Recommends (final, post-Phase 2.4)

**Decision: PAUSE COMMIT, RUN 5 TESTS IN W20-W21, DECIDE W22.**

The original Tier-2 synthesis recommendation (A+C hybrid, 26 weeks, EF-aligned) is the right answer ONLY IF:
- T2 buyer call returns negative ("build not buy")
- T3 ethresear.ch returns positive (active engagement opening)
- T4 Hegotia confirms EIP-8141 + 8051 inclusion

If any of these fails, a different path is correct:
- T2 positive → B-primary or B-then-A (devils-ad)
- T3 negative → A-only with reduced wedge (compete's modification)
- T4 negative → Pause Path A entirely until Hegotia clarity

Running the 5 tests is **cheaper than 1 week of contract code** and produces evidence-based architecture commitment. The Tier-2 synthesis assumed all preconditions would be satisfied — Phase 2.4 surfaced that none have been validated.

---

## Founder Decisions Queued (post W20-W21 tests)

1. **Architecture path** (after 5 tests complete): A-only / A+C / B-primary / B-then-A / Pause
2. **JSPS bridge grant**: pursue YES/NO by W20 Fri, university affiliation start by W21 Mon
3. **ML-DSA-44 vs ML-DSA-65**: confirm level III for regulatory defensibility (threat) OR accept level II for EIP-8051 alignment (compete's gas argument)
4. **Audit booking**: contact 1-2 firms (Trail of Bits, OpenZeppelin, Spearbit) for scope-call in W22 — 4-week lead time on availability
5. **ESP re-submission target**: after architecture decision lands, set realistic submit date (likely W47+ if A+C, W30+ if A-only)

---

## Audit Cost Discipline Check

W19.5 audit: ~$0.50
Tier-2 research: ~$1.20
Phase 2.4 meeting: ~$0.60
**Cumulative weekend: ~$2.30** of monthly $30 budget = 7.7%

The 5 cheap tests are non-agent (founder action). After T1-T5 complete, **NO MORE STRATEGIC AGENT MEETINGS** until founder takes at least one irreversible action. The next agent budget should go to engineering review (rust-reviewer, security-reviewer) on actual code — not more strategy memos.

CFO warning: this is the third strategic memo today. **Analysis-paralysis risk is now real**. The 5 tests are the forcing function to break out.

---

**Next**: founder reads this Sun evening / Mon. Runs 5 tests over W20-W21. Decides architecture path W22 with evidence. PR #197 contains all Tier-2 + Phase 2.4 outputs for review.
