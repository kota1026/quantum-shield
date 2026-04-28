# Quantum Shield UX Orchestrator

11-role autonomous **verify → fix → verify** loop for the browser side
of Quantum Shield. Mirrors the backend `e2e-orchestrator/` topology
but for the four UX concerns the council and the Anthropic research
identified as agent-tractable: **visual regression, copy/i18n,
accessibility, and performance.**

Built on top of `src/frontend/web/e2e/visual-regression/` (PR #141 —
Playwright capture + Claude vision-based diff classification). The
visual-regression hunter is one stage; this orchestrator wraps it
with a full multi-agent panel + automated healer + designer-gated
re-verify.

## Why this exists separately from `e2e-orchestrator/`

- Backend orchestrator: Rust + cargo + cast + psql. Agents reason about
  test stdout, JSON reports, on-chain state.
- UX orchestrator: Playwright + screenshots + a11y trees + Lighthouse
  metrics. Agents reason about pixels, accessibility-tree semantics,
  and i18n translation completeness.

The two share the same architectural pattern (TS driver, prompt-cached
Anthropic API calls, generator-verifier rings) but their inputs and
prompts diverge enough that fusing them would lose more clarity than
it would save.

## 11 roles

Inspired by Anthropic's coordination framework (April 2026) and the
DMAD multi-agent debate pattern. Stages run sequentially; agents
within a stage run in parallel.

```
Stage 1 (1 LLM)         Planner        — read routes + i18n catalogs, produce plan
Stage 2 (1 process)     Capturer       — Playwright screenshots, a11y tree, copy, perf
Stage 3 (4 LLM, ‖)      AccessibilityReviewer (Sonnet)
                        VisualReviewer        (Sonnet 4.6, vision)
                        CopyReviewer          (Sonnet)
                        PerformanceReviewer   (Sonnet)
Stage 4 (1 LLM)         Judge          — synthesize 4 reviewer outputs, verdict
Stage 5 (1 LLM, cond)   Healer         — propose fix to test/UI code if regression
Stage 6 (1 manifest)    DesignerGate   — human-required for visual-fix approval
Stage 7 (1 LLM)         FinalVerifier  — re-run minimal verification post-fix
Stage 8 (1 LLM)         Archiver       — log results, update baselines, comment
```

11 roles in total: 8 LLM agents + 1 deterministic process (Capturer)
+ 1 manifest gate (DesignerGate) + 1 archiver. Per Anthropic SDK
constraints, sub-agents cannot spawn sub-agents — this orchestrator
is a TypeScript Node process driving direct Anthropic API calls.

## Cost / latency profile

Steady-state run with prompt caching enabled, single route × 2 viewports:

| Stage | Model | Tokens | $ | Wall-clock |
|---|---|---|---|---|
| 1 Planner | Haiku 4.5 | ~3K | $0.005 | 4s |
| 2 Capturer | (Playwright, no LLM) | — | — | 8s |
| 3 4 reviewers ‖ | Sonnet 4.6 | ~12K each | $0.18 | 15s |
| 4 Judge | Haiku 4.5 | ~5K | $0.01 | 5s |
| 5 Healer (cond) | Sonnet 4.6 | ~8K | $0.05 | 10s |
| 7 FinalVerifier | Haiku 4.5 | ~3K | $0.005 | 4s |
| 8 Archiver | Haiku 4.5 | ~2K | $0.005 | 3s |
| **Total** | — | ~50K | **~$0.26** | **~50s** |

12 routes × 2 viewports × $0.26 ≈ **$6.24 per full run**. Acceptable
for nightly CI; cache breakpoints on system prompts cut steady-state
to ~$2.

## Verify → fix → verify loop semantics

1. **Verify**: Stages 1–4 produce a verdict (`none|cosmetic|regression|broken`).
2. **Fix**: if verdict is `regression` or `broken`:
   - The Healer proposes a unified diff against the test file (or
     against `routes.ts` if the route was renamed) — never against
     the React component itself.
   - If verdict is `regression` and the cause is a UI change (not a
     test brittleness), the DesignerGate flags it for a human:
     either approve the new baseline or revert the UI change. The
     orchestrator does NOT auto-modify React components.
3. **Verify (re-run)**: FinalVerifier runs a tightened version of
   Stages 1–4 against the patched state. If the new verdict is
   `cosmetic` or `none`, the run completes; otherwise it is escalated.

This mirrors the Playwright 1.56+ Healer pattern (Microsoft, 2026):
self-healing is unidirectional — fix the test, not the product.

## Usage

```bash
cd src/agents/ux-orchestrator
pnpm install

export ANTHROPIC_API_KEY=sk-ant-...
export QS_BASE_URL=https://quantum-shield.xyz

# Verify a single route across viewports
pnpm verify --route home-ja

# Verify everything (12 routes × N viewports)
pnpm verify --route all

# Verify with auto-apply for low-risk healer fixes
pnpm verify --route all --auto-fix
```

## Output

```
reports/<route>-<timestamp>/
├── plan.json                # Stage 1 plan
├── stage2-capture/          # screenshots / a11y trees / copy snapshots
│   ├── desktop.png
│   ├── desktop.a11y.json
│   └── desktop.copy.txt
├── stage3-reviews.json      # 4 reviewer outputs
├── verdict.json             # Judge synthesis
├── patches/                 # Healer's proposed test-file diffs
└── report.md                # Human-readable summary
```

## Where this fits the strategy

The COUNCIL_2026-04-28.md "no" ledger included **"no new Claude Code
automation this week"** — the strategy assumed `e2e-orchestrator` was
overbuilt and we'd cool off. That rule was reopened by an explicit
2026-04-29 user override scoped specifically to UX coverage, with the
constraint that this is the **last** automation addition this quarter.

The `docs/security/PRE_SHERLOCK_BLOCKERS.md` follow-ups (Slashing
must-fix) target the backend orchestrator. This UX orchestrator is
the front-end mirror used as a pre-Sherlock release-readiness gate
for the Public Beta.

## See also

- `AGENTS.md` — full role manifest
- `src/agents/e2e-orchestrator/` — backend/contract sibling
- `src/frontend/web/e2e/visual-regression/` — the Capturer's
  underlying Playwright + Claude vision implementation, in scope as
  Stage 2 of this orchestrator.
- `docs/strategy/COUNCIL_2026-04-28.md` — strategy context
