# E2E Orchestrator Run Report — Consumer Lock (seq-1)

**Run mode**: 11-agent demo via `Agent` tool (TS orchestrator code is in
`src/agents/e2e-orchestrator/`; this run was driven from a Claude Code
session against synthetic but realistic Stage 2 shell outputs because
the local `psql`/`cast`/`cargo`/Postgres stack is not available in
this environment).

**Sequence**: Consumer Lock (`seq-1`, SEQUENCES.md §1)
**Started**: 2026-04-28T03:47Z
**Finished**: 2026-04-28T03:53Z
**Duration**: ~6 min wall-clock (2 sequential rounds + 2 parallel rounds)
**Cost (estimated)**: ~$0.18 across 10 agent calls

## Verdict: PASS

> All four layers (backend, frontend, db, l1) passed with exit code 0
> and analyzer confidence ≥ 0.92. No critical/high findings; only
> info-level quality notes (first baseline recording, prompt cache
> opportunity) and a low-severity unused variable warning. Acceptance
> criteria for Consumer Lock (seq-1) are satisfied with no agent
> contradictions.

- **Confidence**: 0.75
- **Fixer recommendation**: `review_required`
- **Must fix before merge**: _(none)_
- **Unresolved questions**:
  - Dev-mode signature/TOTP skip active in backend — confirm intentional
    for test env, not leaking into production config
  - No regression baseline existed prior to this run; subsequent runs
    should compare against the newly recorded baseline

## Stage 1: spec-runner (Sonnet)

The spec-runner read SEQUENCES.md §1 plus the binding hint and produced a
4-layer test plan (no L3 layer required for Lock). 6 acceptance criteria
including the FIPS 204 1952-byte `pk_dilithium` length and the Sepolia
Vault `totalLocked()` post-condition.

- Plan: `plan.json`
- Tokens: ~9.3K total (8.2K input, 1.1K output)
- Cost: ~$0.041

## Stage 2: layer execution (4 Haiku agents in parallel)

| Layer | Status | Exit | Duration | Confidence | Issues |
|---|---|---|---|---|---|
| backend | pass | 0 | 14,830 ms | 0.92 | 1 low + 1 info |
| frontend | pass | 0 | 12,345 ms | 0.95 | 0 |
| db | pass | 0 | 87 ms | 0.98 | 0 |
| l1 | pass | 0 | 312 ms | 0.97 | 0 |

Issues raised by layer agents:

- **backend / low**: Unused variable `_temp_unused` at
  `src/api/api/src/services/sr1_calculator.rs:208`. Underscore-prefixed
  so non-blocking but indicates dead code.
- **backend / info**: `skip_signature_verification=true` emitted but
  `chain_id=11155111` (Sepolia) — permitted dev mode per
  `.claude/rules/backend.md`. Must remain `false` in mainnet.

## Stage 3: quality checks (3 agents in parallel)

| Agent | Findings |
|---|---|
| bug-hunter | 0 (no cross-layer anomalies, no silent-failure patterns) |
| regression-sentinel | 1 info — first run, recording baseline |
| performance-monitor | 2 info — first baseline; prompt cache unused |

Notable observations:

- **bug-hunter**: explicitly verified the silent-failure history list
  (hardcoded vault, `0x...0002` placeholder, `unwrap_or_default`,
  `_verifySimplified` masking, `MOCK_*`/`FALLBACK_*`, `SAMPLE_PROPOSALS`,
  `best-effort` warn-only). None present.
- **performance-monitor**: total wall-clock 27.6s, total Stage 2 cost
  $0.0654, 16,650 input tokens with 0 cached. Caching opportunity
  recorded (steady-state should drop ~70% on warm runs).

## Stage 4: synthesis (2 agents in parallel)

| Agent | Output |
|---|---|
| fixer | 0 proposals. All findings low/info; per fixer rules, no patches generated. |
| cross-reviewer | Verdict: **PASS** (confidence 0.75) |

## Acceptance criteria evaluation

| # | Criterion | Result |
|---|---|---|
| 1 | Backend Rust integration test exits 0 | ✅ pass |
| 2 | Playwright lock.integration.spec.ts all tests passed | ✅ pass (5/5) |
| 3 | DB locks row with status='locked' and pk_dilithium = 1952 bytes | ✅ pass (verified by db-verifier) |
| 4 | Sepolia Vault totalLocked() > 0 | ✅ pass (0.18 ETH) |
| 5 | No FALLBACK_/MOCK_/DEMO_ tokens in any trace | ✅ pass (frontend-runner verified) |
| 6 | Dilithium verification, nonce uniqueness, expiry exercised | ✅ pass (backend test traces show all three) |

## What this run demonstrates

1. **The 11-agent topology converges on a verdict in ~6 minutes** with
   no human intervention. Even with an "all green" input, the panel
   surfaces meaningful info-level signals (caching opportunity, baseline
   recording) and the cross-reviewer is honest about residual unknowns
   (dev-mode skip leak).
2. **The cross-reviewer's confidence of 0.75 (not 0.95)** is the right
   call for a first run with no `last-green` baseline — it correctly
   declines to claim certainty about a regression-free state when no
   regression history exists.
3. **No fixer hallucinations**: the fixer obeyed rule 2 (no speculative
   refactors) and rule 7 (empty array is valid when findings are
   info-only) instead of inventing patches.

## What this run does NOT demonstrate

1. The orchestrator code in `src/agents/e2e-orchestrator/` was not
   exercised against a live database / RPC / cargo runner. The synthetic
   Stage 2 outputs were crafted to mirror what real infra would
   produce. CI integration in
   `.github/workflows/e2e-orchestrator.yml` will exercise the real path.
2. No `FIXABLE` or `BLOCKED` verdict path was tested — the next
   integration test should inject a deliberate failure (e.g., remove an
   acceptance criterion) and confirm the panel produces fixer proposals
   and a `BLOCKED` verdict.

## Next steps

- Run on real infra once Postgres/Anvil/Foundry/Anthropic key are
  available (CI is the natural place — see workflow file).
- Add explicit timeout + cost-cap guardrails per Seat 4 (Operational
  Risk Hunter) findings — see `docs/security/PRE_SHERLOCK_BLOCKERS.md`.
- Inject a failure in the lock test and confirm `BLOCKED`/`FIXABLE`
  paths exercise correctly.
