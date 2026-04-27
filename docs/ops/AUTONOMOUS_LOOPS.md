# Autonomous Improvement Loops

Quantum Shield runs three autonomous Claude-powered loops that scan the
external environment, propose strategy changes, and patch CI failures.
Together they make up the **half-autonomous improvement system** — Claude
proposes, a human approves before anything ships.

```
┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│  Layer 1               │    │  Layer 2               │    │  Layer A (Auto-Fix)    │
│  Daily Research        │    │  Weekly Strategy       │    │  CI Failure Auto-Fix   │
│  (Haiku 4.5, daily)    │    │  (Sonnet 4.6, weekly)  │    │  (Sonnet 4.6, on fail) │
│                        │    │                        │    │                        │
│  Scans world, scores,  │ →  │  Synthesises 7 days,   │ →  │  Reads failed CI logs, │
│  files high-sig Issues │    │  opens roadmap PR      │    │  proposes Draft PR     │
└────────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

## Workflows

| Workflow file | Trigger | Model | Output |
|---------------|---------|-------|--------|
| `.github/workflows/daily-research.yml`  | cron `0 0 * * *` (00:00 UTC) | Haiku 4.5 | `docs/intelligence/daily/<date>.md` + Issue when score ≥ 7 |
| `.github/workflows/weekly-research.yml` | cron `0 9 * * 1` (Mon 09:00 UTC) | Sonnet 4.6 | `docs/intelligence/<date>-weekly.md` + PR |
| `.github/workflows/ci-autofix.yml`      | `workflow_run` after CI failure on a PR | Sonnet 4.6 | Draft PR with fix, OR Issue if no safe fix |
| `.github/workflows/bug-hunter.yml`      | cron `0 9 * * 0` (Sun 09:00 UTC) | Sonnet 4.6 | Issue with adversarial findings, rotates through 9 sequences |
| `.github/workflows/prod-error-sync.yml` | `repository_dispatch` from Sentry **(skeleton — not yet active)** | Sonnet 4.6 | Triage Issue with reproduction + fix direction |

## Required Secrets

All three loops require these GitHub Actions secrets on `kota1026/quantum-shield`:

- `ANTHROPIC_API_KEY` — billing key. Cap with a monthly limit in the Anthropic
  Console (recommended: $200/month cap during pilot).
- `SLACK_WEBHOOK_URL` *(optional)* — sends notifications for high-significance
  daily reports and weekly digests.

The default `${{ github.token }}` is enough for Issue/PR creation.

## Cost Envelope

| Loop | Runs | Tokens (in+out) | Cost per run | Monthly |
|------|------|-----------------|--------------|---------|
| Daily research | 30/mo | ~3k + 4k | ~$0.04 | ~$1.20 |
| Weekly research | 4/mo | ~3k + 8k | ~$0.20 | ~$0.80 |
| CI auto-fix | ~30/mo (assume 1/day on PR-active days) | varies, capped 15min | ~$1-3 | ~$30-90 |
| Bug Hunter | 4/mo | full code-read, ~30k + 6k | ~$0.50-1.00 | ~$2-4 |
| Prod error sync | event-driven (skeleton off) | varies | ~$0.20-0.50 | $0 until activated |

**Total monthly target: $35-110**. Add a hard `max_spend` alert in the Anthropic
console to cut off runaway loops.

## Safety Rules

### What the bots may NOT touch

`ci-autofix.yml` enforces an allow-list. The bot will NEVER edit:

- `src/crypto/**` — NIST FIPS 204 / 205 implementation. Safety-critical.
- `src/contracts/**` and `src/l1/**` — on-chain code. Mistakes lose user funds.
- `src/api/api/migrations/**` — DB schema. Mistakes corrupt data.
- `src/api/api/src/middleware/auth*` — authentication. Mistakes are CVEs.

PRs touching these paths get a comment ("auto-fix disabled because protected
paths") and a human is on the hook.

### Bypass switches

- Add label `no-autofix` on a PR → CI Auto-Fix never triggers for that PR.
- Add label `pivot-alert` on an Issue → Founder review required before any
  implementation work begins.
- Add label `priority-high` on an Issue → escalates in weekly strategy review.

### Always Draft, never auto-merge

Every PR opened by these loops is a **Draft** with an explicit
"Reviewer checklist". Auto-merge is forbidden by policy. If a reviewer
suspects the bot is silencing errors rather than fixing them, run
`silent-failure-hunter` and reject.

## Operating the Loops

### First-run smoke test

```bash
# Daily research — manual trigger
gh workflow run daily-research.yml -R kota1026/quantum-shield

# Weekly research — manual trigger
gh workflow run weekly-research.yml -R kota1026/quantum-shield

# CI auto-fix — manual trigger on a specific PR
gh workflow run ci-autofix.yml -R kota1026/quantum-shield -f pr_number=139

# Bug Hunter — manual trigger, optionally pin to a specific sequence (1-9)
gh workflow run bug-hunter.yml -R kota1026/quantum-shield -f focus_index=1

# Prod error sync (workflow_dispatch path, since repository_dispatch needs Sentry)
gh workflow run prod-error-sync.yml -R kota1026/quantum-shield \
  -f fingerprint="example::route::handler:42" \
  -f message="test panic"
```

> Bug Hunter rotation: the bot picks the focus sequence from the ISO week
> number modulo 9. Week 1, 10, 19, ... → Consumer Lock. Week 2, 11, 20, ... →
> Normal Unlock. And so on through the 9 sequences in `docs/core/SEQUENCES.md`.

After each run, verify:

1. The expected file landed in `docs/intelligence/` (research loops only)
2. The Issue/PR was created with the right labels
3. No protected paths were modified

### Weekly review ritual (Founder, every Monday)

1. Read the week's `docs/intelligence/daily/*.md` reports
2. Triage Issues with label `research`: close noise, promote actionable ones
3. Review any `pivot-alert` Issues and decide: act, defer, or close
4. Review the Weekly Research PR; merge or extract action items
5. Triage open `autofix` Draft PRs: merge the good ones, close the bad ones
6. Read Sunday's `bug-hunt` Issue; triage findings into the backlog (or close
   as false positives — track ratio over time as a quality signal)

### Pausing the loops

```bash
# Disable a workflow without deleting it
gh workflow disable daily-research.yml -R kota1026/quantum-shield
gh workflow disable ci-autofix.yml   -R kota1026/quantum-shield
```

## Why this design

- **Half-autonomous, not fully autonomous.** Production bugs in autonomous code
  changes have killed projects (cf. Moonwell). Humans must stay in the loop on
  merge decisions until the loops have a 6-month track record.
- **Cheap models do the bulk work.** Haiku 4.5 daily scans for $0.04/run is
  effectively free. Sonnet 4.6 reserved for synthesis and code edits where
  capability matters.
- **Layered defense for the auto-fix bot.** Path allow-list + Draft-only PRs +
  `no-autofix` opt-out + post-hoc human review = four independent ways to
  catch a bad fix before it ships.

## Future expansions (not yet built)

- **Auto-implement bot** — picks an Issue with label `auto-implementable` and
  writes an implementation PR. Higher risk; gated behind 4 weeks of clean
  CI auto-fix track record.
- **UX regression hunter** — Playwright + Claude vision: take screenshots,
  diff against baseline, file Issues for visual regressions or a11y violations.
- **Activate prod-error-sync.yml** — flip `if: false` to `if: true` once Sentry
  (or Axiom) is configured to dispatch `production_error` events.

These are documented in `docs/INTEGRATION_METHODOLOGY_v2.md` for sequencing.
