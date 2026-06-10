---
agent: qs-cfo
meeting: 2026-W24 (2026-06-10)
model: sonnet (via Fable 5 orchestrator)
---

# W24 Funding Position Paper — qs-cfo — 2026-06-10

### Critical Finding Before Everything Else: EF ESP Was NOT Submitted

The T-1 checklist (`docs/grants/EF_ESP_T_MINUS_1_CHECKLIST.md`) targeted submission 2026-05-11 at 09:00 JST. No `SUBMISSION_LOG.md` exists. No `docs/grants/submitted/` directory exists. No confirmation screenshot exists. All checklist items remain unchecked. The pipeline died 2026-05-09 — the day before the prep window opened. The ESP application, representing a $150K ask with rolling admission (no hard deadline), is 30 days overdue and costs nothing to submit today. **This is the single highest-leverage action in the entire funding stack.**

### 1. Position: What to Prioritise This Week

Priority axis for W24–W36: cover the $50K audit cost and the agentic ops burn before S4 integration completes (~W36).

**P0 — EF ESP Track A + Track B (this week).** Rolling admission. The application draft is complete and supplement-updated through 2026-04-28. The v1.2 pivot to "ML-DSA-65 on-chain verification primitive" strengthens the fit — the SP1/WHIR/Solidity verifier from Approach A is a direct match for the EF PQ Security team's empirical-benchmark mandate. Submitting now with an honest "Phase 2 under active build" framing is stronger than waiting for S4.

**P1 — JST CREST or PRESTO (2026-Q3 call, typically July–September intake).** Government grants take 6–12 months to disburse; apply in July to receive funds by Q2 2027 (post-audit territory). A Japan-based solo founder building NIST FIPS 204 on-chain verification has rare dual legitimacy: Ethereum ecosystem credibility plus alignment with Japanese government PQC mandates (NISC 2027 transition target).

**P2 — Arbitrum Foundation grants or OP RetroPGF Round 5.** QS already has contracts on Arbitrum Sepolia (421614). Worth a one-page LOI in W27–W28 once S1 is done. RetroPGF assesses retroactive impact; apply after S4 benchmarks are published.

### 2. Three Concrete Actions

**Action A — EF ESP Track A submit (P0, this week, ~8 hours).** The draft is done. Incremental work is operational: 60-second Loom demo of lock/unlock, Sepolia Etherscan screenshot, paste into esp.ethereum.foundation form, screenshot confirmation. $/hour: $150,000 × 20% probability = $30,000 EV / 8h = **$3,750/hour** (7.5x the $500/h skip threshold). Note: application body uses legacy "custody protocol" framing — add one paragraph mapping to v1.2 primitive positioning.

**Action B — EF PQ Security Research Prize direct outreach (P0, same week, ~2 hours).** Thomas Coratger is named with email in the checklist; template written in `SUBMISSION_CHECKLIST.md`. The $2M prize pool is separate from the ESP grant. EV: $50K–$100K allocation × 15% = **$3,750–$7,500/hour**. Do not wait. (Synergy with qs-pm finding: Coratger co-authored EIP-8288 AND EIP-8292 this week — the outreach email now has a perfect hook.)

**Action C — JST PRESTO application prep (P1, target W28–W30, ~60 hours).** ¥30M–¥40M (~$200K–$270K) over 3 years. JP-resident founder building production NIST PQC infrastructure has a stronger pitch to JST than any non-JP team. Typical July intake — founder must verify the open call on jst.go.jp (WebFetch blocked this session). EV: ~**$970/hour**. Warm intro paths: RIKEN RQC, Keio quantum group, NTT CIS Lab.

### 3. One Funding-Side Risk

The agentic operating model itself is now a documented burn-rate liability. Both the OAuth quota and API credits hit zero simultaneously, silently, for 32 days across the entire v1.2 re-pivot period. Any institutional grant reviewer will ask about infrastructure sustainability. An ops model that can't sustain $30/month of API credits without silently dying is a red flag in due diligence. **The specific risk: accepting grant money into a burn-rate structure with no circuit-breaker accelerates the same failure mode.** The $50K Trail of Bits audit requires uninterrupted ops during a multi-month engagement; pipeline failures during an active audit are professional-reputation events.

### 4. One Non-Obvious Opportunity

**NEDO 量子技術イノベーション戦略 / Blockchain × PQC track.** NEDO's quantum program has included practical PQC applications in financial infrastructure. Frame Approach A's Solidity verifier as critical national financial infrastructure research targeting the JFSA's informal 2027 PQC-readiness discussion for crypto exchanges (aligned with NISC strategy). Typical award ¥50M–¥200M for applied research consortia; solo founders may need a Japanese university lab partner (Waseda IMS, Osaka U ICS). Infrastructure-provider framing, not DeFi-protocol framing.

### 5. Ops-Budget Guardrail — Minimal Circuit Breaker

- **Level 1 (P0, ~15 min):** Anthropic console spending alert at $20. Do today alongside the credit top-up.
- **Level 2 (P0, ~1 hour):** Pre-flight step in `daily-plan.yml` checking remaining credits, Slack alert below $10. Fail loudly, never consume to zero silently.
- **Level 3 (P1, ongoing):** Fixed monthly ops line: $30 API + $15 Actions = $45/month, mapped into every grant budget's infrastructure line (ESP application already budgets $15K/12mo infrastructure — the ops cost is grant-fundable).

### Summary Table

| Action | Amount | Deadline | $/hour EV | Priority |
|---|---|---|---|---|
| EF ESP Track A submit | $150,000 ask | Rolling (submit this week) | $3,750 | P0 |
| EF PQ Security Prize outreach | $50K–$100K est. | Rolling (same week) | $3,750–$7,500 | P0 |
| Anthropic spend alert + workflow guard | $0 | This week | Existential | P0 |
| JST PRESTO prep | ¥30–40M | ~2026-07-01 (verify) | ~$970 | P1 |
| Arbitrum Foundation LOI | $50K–$150K est. | None current | ~$800 | P2 |
| OP RetroPGF R5 | Variable | Post-S4 | Too early | P2 |

**Unverified deadlines (WebFetch blocked):** JST PRESTO 2026 intake, Arbitrum current cycle, OP RetroPGF R5 open date, NEDO 2026 call. Founder must verify all four before committing prep hours.

**KPI status:** Zero grants submitted against the ≥2/quarter target. ESP Track A + Track B before 2026-06-30 clears the Q2 floor.
