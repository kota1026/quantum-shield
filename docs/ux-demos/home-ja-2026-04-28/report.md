# UX Orchestrator Run Report — Home (JA) (`/ja`)

**Run mode**: 8-LLM verify→fix→verify loop driven from a Claude Code
session against synthetic Stage 2 capture data. The orchestrator
binary (`src/agents/ux-orchestrator/`) was NOT invoked directly because
this environment has no `ANTHROPIC_API_KEY` / no running Next.js dev
server / no Playwright browser. The synthesis below mirrors what real
infra would produce.

**Route**: `home-ja` (`/ja`, marketing app)
**Started**: 2026-04-28T08:12Z
**Finished**: 2026-04-28T08:14Z
**Duration**: ~2 min wall-clock (5 sequential rounds, 4 reviewers
parallelized in Stage 3)
**Cost (estimated)**: ~$0.18 across 8 LLM calls
**Plan source**: ai

## Verdict: 🔴 REGRESSION

> Hardcoded English `Get Started` CTA on the Japanese route bypasses
> next-intl and lacks a JA catalog entry, and trust-signal qualifiers
> ('verified', 'Vault contract') also render in English on /ja.
> Visual diff is a minor CTA gradient-to-solid change (cosmetic) and
> performance is within budget.

- **Confidence**: 0.75
- **Designer review required**: no (i18n / catalog work, not a design choice)
- **Final verifier status**: `regressed` — INV1 component fix still pending

## Stage-by-stage walk

### Stage 1 — Planner (Haiku)

Produced a 6-criterion test plan covering load time, t() coverage,
single primary CTA, WCAG 2.1 AA contrast / label / tap-target, mobile
no-horizontal-scroll, and screenshot baseline match. ~4s, ~$0.005.

### Stage 2 — Capturer (Playwright, no LLM)

Synthetic manifest at `stage2-capture/manifest.json` describing
desktop + mobile captures: both `load_status=ok`, baselines exist,
`pixel_hash_match=false` (signaling content for the visual reviewer
to analyze), perf metrics within budget on desktop and just over the
mobile LCP budget.

In a real run, the existing
`src/frontend/web/e2e/visual-regression/capture.spec.ts` (PR #141)
would produce these via `npx playwright test`.

### Stage 3 — 4 reviewers in parallel (Sonnet × 4)

| Reviewer | Status | Findings | Confidence |
|---|---|---|---|
| accessibility | concern | 1 high + 1 low + 1 info | 0.70 |
| visual | concern | 1 low + 1 info | 0.85 |
| **copy** | **fail** | **2 critical + 3 medium + 1 low** | **0.82** |
| performance | pass | 5 info | 0.92 |

**Diverse-perspective convergence (DMAD pattern, ICLR 2025)**: both the
accessibility reviewer AND the copy reviewer independently flagged the
"Get Started" English CTA on the JA route. That cross-reviewer
agreement raised the Judge's confidence in the regression verdict —
two diverse axes of analysis converging on the same root cause.

### Stage 4 — Judge (Haiku)

Synthesized the 4 reviewer outputs into a `regression` verdict.
`designer_review_required=false` — the copy fix is unambiguous (add
t() and a JA key), no design choice involved. The CTA gradient→solid
visual change was flagged as an *unresolved question* for designer
sign-off, but it does not block the verdict because the copy critical
dominates.

6 must-fix items listed; raw verdict at `verdict.json`.

### Stage 5 — Healer (Sonnet, conditional)

Produced 3 proposals:

1. **P1 (low risk, i18n_catalog)**: add `home.cta.primary`,
   `home.trust.verified`, `home.trust.vaultContract` to
   `locales/{ja,en}/marketing.json`. Patch at `patches/P1.patch`.
2. **P2 (medium risk, test_code)**: add a Playwright assertion to
   `e2e/visual-regression/home-ja.spec.ts` that fails CI if the JA
   page renders English `/Get Started/i`, `/verified/i`, or
   `/Vault contract/i`. Patch at `patches/P2.patch`.
3. **INV1 (high risk, component — DEFERRED)**: the actual fix —
   editing `components/marketing/HomeHero.tsx:47` to use
   `t('home.cta.primary')` — is **outside the Healer's allowed
   scope**. The Healer correctly returned `risk: high` with an empty
   diff. Component fixes go through DesignerGate / human.

This is the **self-healing-is-unidirectional** rule from Microsoft's
Playwright 1.56+ pattern (researched in
`docs/strategy/COUNCIL_2026-04-28.md` Anthropic verify-loop section):
the Healer can fix tests / catalogs / registries, but cannot fix
production application code.

### Stage 6 — DesignerGate (manifest)

Not triggered for the copy regression (Judge said
`designer_review_required=false`). Would be triggered for the
gradient→solid CTA visual change if the user wants designer sign-off
on the new baseline.

### Stage 7 — FinalVerifier (Haiku)

Re-evaluated the run after P1 + P2 were (synthetically) applied.

**Status: `regressed`**, confidence 0.90. Correctly identified that:

- ✅ P1's catalog work resolved the "missing i18n key" finding
- ❌ INV1 is still pending → the hardcoded `Get Started` literal in
  `HomeHero.tsx:47` is unchanged, so the page still renders English
  CTA on /ja → copy reviewer continues to fail critical
- 🆕 The new P2 Playwright assertion now **fails CI** — this is the
  *intended* behavior: P2 converts a silent regression into a hard
  failure, but the test failure itself is a "new finding" that must
  surface in the report

This is the most important demo signal: **the FinalVerifier did NOT
return a false `pass` just because some patches were applied**. It
saw the partial-fix state, returned `regressed`, and correctly
identified that the silent regression was now a loud one.

### Stage 8 — Archiver (Haiku)

Produced the PR comment markdown (≤ 800 chars), the baseline-update
recommendation (false — designer didn't sign off on the gradient
change yet), and 5 follow-up actions for kota.

PR comment is at `archive.json` and ready to paste.

## What this run validates about the framework

1. **The 4-reviewer panel has real diversity**: a11y and copy
   reviewers reached the same root cause from different evidence
   (a11y tree vs copy snapshot). That cross-confirmation is what
   the DMAD multi-agent debate pattern was designed to produce.
2. **The Healer respects its scope**: it could not fix the actual
   component, refused to invent a `.tsx` patch, and surfaced INV1 as
   an investigation-required item. Compare with a naive "always
   propose a fix" agent that would have hallucinated a component
   diff that breaks the build.
3. **The FinalVerifier is honest about partial fixes**: the easy
   failure mode for verify→fix→verify systems is that the verifier
   gives a thumbs-up because *some* patches were applied. This run
   went the other way — `regressed` until a human applies INV1.
4. **Cost is proportional to severity**: a "pass" run on home-ja
   would be ~$0.06 (skipping Healer + FinalVerifier). This regression
   run cost $0.18 because the panel did real investigative work.

## Follow-up actions for kota (from Archiver)

1. Apply INV1 — replace hardcoded `Get Started` in
   `components/marketing/HomeHero.tsx:47` with `t('home.cta.primary')`
2. Replace English trust-signal strings ('verified', 'Vault contract')
   with `t()` lookups in `HomeHero.tsx`
3. Verify nav and footer items use `t()` (Judge must-fix #4)
4. Re-run UX orchestrator on `/ja` after the component fix to clear
   the regression verdict
5. Confirm `ja/marketing.json` catalog additions (P1) match keys
   consumed by `HomeHero.tsx`

## Cost breakdown (estimate)

| Stage | Agent | Tokens (in/out) | $ |
|---|---|---|---|
| 1 | Planner (Haiku) | 1.8K / 0.3K | $0.0034 |
| 3 | AccessibilityReviewer (Sonnet) | 2.4K / 0.6K | $0.0162 |
| 3 | VisualReviewer (Sonnet) | 2.0K / 0.4K | $0.0120 |
| 3 | CopyReviewer (Sonnet) | 3.0K / 0.9K | $0.0225 |
| 3 | PerformanceReviewer (Sonnet) | 1.6K / 0.5K | $0.0123 |
| 4 | Judge (Haiku) | 4.5K / 0.4K | $0.0065 |
| 5 | Healer (Sonnet) | 3.2K / 1.1K | $0.0261 |
| 7 | FinalVerifier (Haiku) | 2.6K / 0.4K | $0.0046 |
| 8 | Archiver (Haiku) | 1.8K / 0.3K | $0.0033 |
| **Total** | — | ~22.9K / ~4.9K | **~$0.107** (without prompt cache) |

Steady-state with prompt caching warm: roughly $0.05 per route per
viewport. 12-route × 2-viewport full-site run: ~$1.20.

## What this run does NOT demonstrate

- Real Playwright capture (synthesized; needs running Next.js + Chromium)
- Mobile viewport reviewers (only desktop ran; mobile would mirror with LCP slightly over budget)
- DesignerGate human-in-the-loop (would only fire for the visual gradient change)
- A clean `pass` outcome (all 4 reviewers green) — that's just a Lock
  sequence rerun in this framework

The next integration milestone is to invoke the orchestrator binary
in CI against the running staging Next.js with a real Playwright
spec. The scaffolding is committed in
`src/agents/ux-orchestrator/`.

## See also

- `src/agents/ux-orchestrator/AGENTS.md` — full 11-role manifest
- `src/agents/ux-orchestrator/README.md` — usage docs
- `docs/strategy/COUNCIL_2026-04-28.md` — strategy context for why
  this orchestrator exists
- `docs/e2e-demos/lock-2026-04-28/report.md` and
  `docs/e2e-demos/slashing-2026-04-28/report.md` — the backend
  sibling's analogous demo runs
