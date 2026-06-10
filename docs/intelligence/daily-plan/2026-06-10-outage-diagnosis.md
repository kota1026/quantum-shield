---
date: 2026-06-10 (W24)
type: incident diagnosis
status: PARTIALLY FIXED — code-side hardening done; 3 founder actions required
---

# Daily-Plan Pipeline Outage — Diagnosis (2026-05-09 → 2026-06-10)

The autonomous intelligence pipeline has produced **zero output for 32 days**.
Last briefing: `docs/intelligence/daily-plan/2026-05-09.md`.

## Findings

### F1 — Root cause of the 2026-05-09 failures: Anthropic credit exhaustion

Run #8 (2026-05-09T09:36Z) log, both auth paths failed:

```
[daily-plan] OAuth path failed (claude CLI exit 1: Credit balance is too low); falling back to API key.
[daily-plan] FAILED: Anthropic API error: Your credit balance is too low to access the Anthropic API.
```

7 of 8 runs on 2026-05-09 failed; the only success was run #6 (08:24Z).
The dual-auth fallback (OAuth → API key) did not help because **both**
accounts were out of quota/credits simultaneously.

### F2 — Repo-wide cron failure: NO scheduled workflow has ever fired

All 8 daily-plan runs were `push`-triggered (the self-test trigger).
Zero `schedule` events — and the same is true for
`claude-updates-weekly.yml` (checked 2026-06-10: 0 scheduled runs).
7 workflows carry cron schedules; none fire.

Workflow state via API: `"active"` — so this is **not** the 60-day
inactivity auto-disable. Most likely causes (founder must check, in order):

1. **GitHub Actions spending limit reached** (private repo minutes) —
   Settings → Billing → Actions. Scheduled runs are silently not queued
   when the limit is hit.
2. Repository Settings → Actions → "Disable actions" or restricted policy.
3. Account-level flag (free-plan private repo restrictions).

### F3 — Silent failure by design (now fixed)

The Slack headline post lives inside `scripts/run-daily-plan.js` — when the
script fails, no notification fires. A month of silence followed.
**Fixed 2026-06-10**: `daily-plan.yml` now has a workflow-level
`if: failure()` Slack alert step.

### F4 — Node 24 forcing (now fixed)

Since 2026-06-02, GitHub runners force JavaScript actions to Node 24;
`actions/checkout@v4` / `setup-node@v4` are deprecated.
**Fixed 2026-06-10**: bumped both to `@v5` in `daily-plan.yml`.
Other workflows still on v4 — mechanical follow-up, fits the
daily-plan-action allow-list once the pipeline is back.

## Founder actions (blocking, ~15 min total)

| # | Action | Where |
|---|--------|-------|
| 1 | Top up Anthropic API credits AND check Claude Pro/Max OAuth quota | console.anthropic.com → Plans & Billing |
| 2 | Check Actions spending limit / policy | github.com/kota1026/quantum-shield → Settings → Actions; account Billing |
| 3 | After 1+2: manually dispatch `daily-plan.yml` once to confirm green | Actions tab → Daily Plan → Run workflow |

## Note on the cost of this outage

The agentic operating model (charter §4) assumed L3 daily tempo was running.
It was not, for 32 days, spanning the entire v1.2 re-pivot period. Any
process that can fail silently for a month is not autonomous — it is
unattended. The W24 strategy meeting should treat "pipeline observability"
as a first-class agenda item.
