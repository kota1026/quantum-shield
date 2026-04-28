# UX Orchestrator — 11-Role Manifest

Roles in execution order. The 11 count includes 8 LLM agents, 1
deterministic process (Capturer), 1 human gate (DesignerGate), and 1
final archiver — mirroring how Anthropic's own engineering process
distinguishes "agent decisions" from "process steps" from "human
checkpoints" (see `docs/strategy/COUNCIL_2026-04-28.md` for the
research that fed this design).

| # | Role | Model | Stage | Type | Auto-applies fixes? |
|---|---|---|---|---|---|
| 1 | Planner | Haiku 4.5 | 1 | LLM | No |
| 2 | Capturer | — (Playwright) | 2 | Process | No |
| 3 | AccessibilityReviewer | Sonnet 4.6 | 3 | LLM | No |
| 4 | VisualReviewer | Sonnet 4.6 (vision) | 3 | LLM | No |
| 5 | CopyReviewer | Sonnet 4.6 | 3 | LLM | No |
| 6 | PerformanceReviewer | Sonnet 4.6 | 3 | LLM | No |
| 7 | Judge | Haiku 4.5 | 4 | LLM | No |
| 8 | Healer | Sonnet 4.6 | 5 | LLM | Test code only, not React components |
| 9 | DesignerGate | — (human) | 6 | Manifest | Approves visual-baseline changes |
| 10 | FinalVerifier | Haiku 4.5 | 7 | LLM | No |
| 11 | Archiver | Haiku 4.5 | 8 | LLM | Updates baselines, posts PR comments |

## Why these 11

The selection follows three rules learned from the backend
orchestrator and the Anthropic verify-loop research:

1. **Diverse-perspective rule** (DMAD pattern, ICLR 2025): each
   reviewer must reason on a distinct axis. Visual / a11y / copy /
   perf are mutually orthogonal — a regression in one rarely shows
   in another, so panel diversity = recall.
2. **Generator-verifier ring** (Anthropic Coordination Framework,
   April 2026): runners and verifiers must NOT be the same agent.
   The Capturer produces evidence; the 4 reviewers verify it; the
   Judge synthesizes; the Healer proposes; the FinalVerifier
   re-checks.
3. **Self-healing is unidirectional** (Playwright 1.56+, Microsoft
   2026): the Healer can fix test code (selectors, timing,
   storageState) but NEVER fixes the application code. The
   DesignerGate is the human checkpoint for "the UI changed
   on purpose, accept the new baseline."

## Why the ratio is 4 Sonnet : 4 Haiku

The Stage 3 reviewers and the Healer reason about subtle pixel /
copy / a11y semantics — Sonnet's accuracy materially exceeds Haiku
on these. The Planner / Judge / FinalVerifier / Archiver are
information-routing rather than judgment — Haiku is sufficient and
~5x cheaper. This ratio matches the backend orchestrator's (4 Sonnet
strategy seats : 5 Haiku layer-runners).

## Failure modes already considered

- **VisualReviewer disagrees with PerformanceReviewer about whether
  a 200ms LCP increase is a regression**: the Judge is the tie-breaker.
  If Judge confidence is below 0.7, the verdict escalates to
  `unresolved` and the run blocks.
- **Healer proposes a fix that itself breaks the spec**: FinalVerifier
  re-runs Stages 3–4 on the patched state. If the new verdict is
  worse, the patch is reverted and the issue is escalated.
- **Capturer fails to load a route** (network, server down, CSP
  block): the route is marked `skipped`, not `failed`. The orchestrator
  does NOT manufacture a regression from infra noise.

## What this orchestrator does NOT do

- It does not auto-modify React components, CSS, or TypeScript
  application code. The Healer is scoped to test code only.
- It does not approve visual baselines on its own. Visual changes
  marked as intentional require a human (the DesignerGate manifest).
- It does not run a full Lighthouse audit on every page on every
  run. PerformanceReviewer reads cached metrics from the Capturer's
  most recent baseline; full Lighthouse runs are weekly, not per-PR.
- It does not replace the existing
  `src/frontend/web/e2e/visual-regression/` system — it consumes it
  as Stage 2.

## See also

- `src/agents/e2e-orchestrator/AGENTS.md` — backend sibling
- `prompts/*.md` — full role definitions
- `docs/strategy/COUNCIL_2026-04-28.md` — strategy context
