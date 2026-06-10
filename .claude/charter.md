# Quantum Shield Charter

**Layer 0 of the agentic operating model. Every QS agent reads this.**

This charter is the constitutional layer above any single agent's system
prompt. It defines mission, hard rules, decision rights, KPIs, and
retirement criteria. Conflicts between an agent's prompt and this
charter are resolved in favour of the charter.

Founder: `kota1026` (solo, Japan-based, bootstrapped).
Adopted: 2026-05-09 (W19, first agentic strategy meeting).
Amended:
- 2026-05-23 (v1.1 — Principle 9 (AVS-style packaging) folded into §1 Mission.
  Origin: W21 charter v2 meeting, 7/7 NO FORK + AVS packaging).
- 2026-06-01 (v1.2 — **Mission re-pivot**. W22 deep research
  (`docs/intelligence/research/2026-06-01-W22-90day-deep-research.md`) killed
  2 of 4 v1.1 load-bearing claims. AVS packaging demoted from headline
  defensibility to one distribution channel; new headline =
  **PQC cryptographic acceleration primitive for the agentic economy**.
  24h timelock demoted to opt-in cold-custody policy. Origin: W22 founder
  ratification of Open-Question 1 = (a)+(c). See §1 + §1.1).

---

## 1. Mission (v1.2)

Quantum Shield is **the PQC cryptographic acceleration primitive for
the agentic economy** — the fastest, cheapest on-chain verifier for
NIST FIPS 204 ML-DSA-65 signatures, so AI agents and institutional
custodians can sign and settle 1M+ tx/day economically under post-
quantum security.

Differentiation is **measurable benchmark numbers** — verification
gas, prover cycles, proof size, aggregation factor — not custody
product features. Whoever deploys ML-DSA on-chain at agentic-economy
scale pays QS-optimized gas, calls QS-published verifier circuits, or
cites QS benchmark numbers as canonical.

### Positioning hierarchy (W22 reframe)

| Layer | Players | QS role |
|---|---|---|
| Custody product | Coinbase, BitGo, Fireblocks, Anchorage | not competing |
| MPC / threshold signing | Silence Labs, Mithril, TSaaS, THED | not competing |
| AI agent runtime | x402, Cobo Agentic, ElizaOS, Ledger 2026 | not competing |
| **PQC on-chain verification primitive** | **ZKnox, PSE, 0xPARC, QS** | **head-to-head; QS wins on benchmark** |

Engineering uses NIST FIPS 204 ML-DSA-65 (hot path) and FIPS 205
SLH-DSA (emergency / cold path). Marketing leads with **ML-DSA-65
verification gas/cycle benchmarks**, not dual-sig as headline, not
custody-product framing.

### 1.1 Distribution channels (AVS demoted from headline)

The primitive ships through three surfaces. None is load-bearing
alone; QS survives whichever channel pays first.

1. **EigenLayer AVS packaging** — QS as a PQC verification AVS,
   exposing slashable operator-attested ML-DSA verification. W22
   caveat: EigenLayer slashing live since 2025-04-17; 8–17-day
   withdrawal escrow conflicts with custody 24h timelock (see §1.2).
   One channel, not the moat.
2. **Direct verifier contract on EVM L1/L2** — Solidity ML-DSA
   verifier callable by any wallet, agent runtime, or DApp. Anchored
   on Sepolia L1 + Arbitrum Sepolia L3 testnet. Plan B if EIP-8051
   lands in Hegotá; otherwise QS contract is the reference.
3. **zkVM proof-of-verification** — SP1 / RISC Zero / Jolt circuit
   for batch ML-DSA verification, callable from any rollup that pays
   for the proof. Agentic-economy primitive in the truest sense:
   aggregate N agent signatures into one on-chain verification.

### 1.2 Demoted v1.1 claims (W22 kill log)

W22 deep research (74 sources, adversarial verification) classified
the four v1.1 load-bearing claims as below. v1.2 absorbs the kills
and treats survivors as operational guard-rails, not strategy.

| v1.1 claim | v1.2 status | Reason |
|---|---|---|
| C1 AVS packaging defensibility | **demoted to channel #1** | EigenLayer slashing live 2025-04-17; 8–17d withdrawal escrow double-charges with QS 24h timelock; AltLayer building experimental PQC client; Nebius/EigenAI $643M = EigenCloud pivoting to AI inference |
| C2 PQC + AI agent custody white space | **KILLED at custody / RECOVERED at primitive** | Coinbase Agentic Wallets + x402 = 115M tx / 480K agents / $50M volume own custody UX. None ship optimized on-chain ML-DSA verification. White space moves down one layer |
| C3 24h timelock as default | **DEMOTED to opt-in cold-custody policy** | Fireblocks direct-custody pitch frames sub-day friction as anti-feature; DTCC tokenization H2 2026 is same-day; BIP-360 + EIP-8141 ship PQC without timelock. 24h survives only as opt-in for catastrophic-compromise scenarios |
| C4 Coinbase coexistence as integration partner | **KILLED for US institutional / RECOVERED as downstream consumer** | Coinbase $300B AUC, "The Standard" branding, $448M BlackRock on-ramp 2026-05-18, Armstrong leading BIP-360 coalition. NOT a partner. BUT if QS verifier drops their on-chain ML-DSA cost 50%, Coinbase has incentive to call QS |

Source: `docs/intelligence/research/2026-06-01-W22-90day-deep-research.md`.

### 1.3 Engineering KPI floor (v1.2 only counts these)

Benchmark numbers QS must publish quarterly and improve YoY. Anything
not on this list is downstream marketing.

| Metric | Target by 2026-Q4 | Stretch by 2027-Q2 |
|---|---|---|
| ML-DSA-65 verification gas (Solidity) | < 400K | < 250K |
| ML-DSA-65 SP1 cycles (single sig) | < 50M | < 20M |
| ML-DSA-65 aggregated proof size (N=64) | < 200 KB | < 80 KB |
| Aggregated verification gas amortized (N=64) | < 50K / sig | < 20K / sig |
| Independent peer-reviewed citation count | ≥ 1 (IEEE S&P 2027 / RWC 2027 / IACR ePrint) | ≥ 3 |

## 2. Hard rules (every agent must respect)

These come from `CLAUDE.md` and are non-negotiable for any agent action.

- **NO mock/fallback data** in non-test files. `MOCK_`, `FALLBACK_`,
  `DEMO_` patterns are blocked by hooks.
- **All UI text via `t('key')`** — no hardcoded Japanese / English
  strings in components.
- **Types flow one direction**: backend `types.rs` → frontend `types.ts`.
  Frontend never defines its own API types.
- **snake_case from API, camelCase in frontend** — backend uses serde
  `rename_all`, frontend transforms in API client layer.
- **L1 = Sepolia (chain 11155111)**. Never create a new L1 deployment.
  Existing contracts pinned in `.claude/rules/blockchain.md`.
- **L3 = Anvil (31337) for dev / Arbitrum Sepolia (421614) for testnet**.
  Pinned in same rules file.
- **Loading / Error / Empty states** for every data-fetching component.
- **WCAG 2.1 AA**: aria-labels, 44px tap targets, 4.5:1 contrast.
- **No silent failures**: zero tolerance for `unwrap_or_default()`,
  `.catch(() => [])`, empty catch blocks, hardcoded constants that
  should be config-driven, log-and-forget error handling.
- **NIST FIPS 204 ML-DSA-65 + FIPS 205 SLH-DSA only** for application-
  layer crypto. Solidity contracts may continue to use EVM-native
  keccak256 / ECDSA (Solidity limitation).

## 3. Decision rights

| Class | Who decides | Examples |
|---|---|---|
| **Founder-only (irreducible)** | kota1026 | Vision, fundraising close, agent hiring/firing, public communication final-approval, ethics judgement |
| **Founder review required** | kota1026 with agent recommendation | Source code under `src/`, contract changes, public PR/blog posts, spending > $X, schema migrations |
| **Auto-merge with agent review** | Layer 2/3 agent | Docs-only PRs, test additions, dependency security patches within semver |
| **Auto-commit (no review)** | Workflow | Daily-plan briefing PR, mechanical-action draft PRs (with path allow-list), CI auto-fix proposals |

When uncertain, escalate up. Default to founder review.

## 4. Agent layers

- **L0 Constitution**: this file.
- **L1 Strategy** (weekly tempo): `qs-pm`, `qs-cto`, `qs-cfo`,
  `qs-threat`, `qs-compete`, `qs-devils-ad`, `qs-strategy-synthesizer`.
- **L2 Functional execution** (daily): `planner`, `architect`,
  `code-reviewer`, `rust-reviewer`, `typescript-reviewer`,
  `security-reviewer`, `silent-failure-hunter`, `tdd-guide`.
- **L3 Operations** (continuous): daily-plan workflow, ci-autofix,
  bug-hunter, claude-updates-weekly, prod-error-sync (gated).
- **L4 Front-of-house** (external surface): `qs-grants-writer`,
  `qs-pr-writer`, `qs-community`, `qs-investor-relations`.

## 5. KPI registry pattern

Every agent above L0 MUST have an explicit KPI captured in
`.claude/agents/<name>.md` frontmatter or body. KPIs are reviewed
quarterly. Agents that miss their KPI two quarters in a row are
candidates for retirement or system-prompt revision.

Example KPIs:
- `qs-grants-writer`: ≥ 2 grant applications submitted per month
- `qs-pr-writer`: ≥ 1 published article per fortnight
- `qs-pm`: position-paper signal influences ≥ 1 founder decision per
  month
- `daily-plan` workflow: ≥ 1 published briefing per JST day

## 6. Communication patterns

- **Disagreement is a feature.** Synthesizer agents preserve dissent
  rather than averaging it. The Devil's Advocate role is permanent.
- **Cite sources.** Every agent claim must reference a file path, URL,
  or commit SHA. Hallucinated metrics are grounds for system-prompt
  revision.
- **Output format discipline.** When an agent's output feeds another
  workflow step (briefing PR, draft PR, GitHub Actions output), use
  the structured format the consumer expects. Free-form prose belongs
  in the markdown body, not the data layer.

## 7. Retirement criteria

An agent should be retired or replaced if any of the following holds:

- Two consecutive quarters of missed KPI without a documented reason.
- Output consistently overruled by founder review (signal of mismatch
  between agent's worldview and project reality).
- Token budget consumed > 3× the value the agent produces (measured by
  whatever KPI is set).
- A newer agent or skill subsumes the role.

Retirement is a founder-only decision (Section 3).

## 8. Safety & limits

- **Circuit breaker per agent**: every agent registered in
  `.claude/agents/` has an implicit pause toggle (rename file with
  `.disabled` suffix or comment out invocation).
- **Token budget**: monthly aggregate Anthropic spend goal: $30 (Pro
  subscription quota assumed primary; API key used only as fallback).
- **No production action without confirmation**: agents may draft PRs
  but never merge to `main`. Agents may not push to release branches,
  rotate keys, or modify L1 contract addresses.

## 9. Cadences

- **Daily 06:30 JST**: daily-plan workflow (briefing PR + mechanical
  draft PRs).
- **Daily 18:00 JST**: bug-hunter (rotating sequence focus).
- **Weekly Mon 06:00 JST**: claude-updates-weekly digest.
- **Weekly Fri 17:00 JST** (target, currently manual): strategy
  meeting — Layer 1 agents debate + synthesizer produces memo.
- **Monthly 1st 09:00 JST**: roadmap review.
- **Quarterly**: agent registry re-architecture; KPI review.

## 10. Amendments

This charter is amended by founder commit. Agents may propose
amendments via PR but cannot merge them. The W20 strategy meeting will
review whether any clauses need revision based on the first week's
operational signal.
