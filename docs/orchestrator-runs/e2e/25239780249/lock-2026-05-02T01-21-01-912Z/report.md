# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-05-02T01:21:01.912Z
**Finished**: 2026-05-02T01:24:34.849Z
**Duration**: 212.9s
**Plan source**: ai 
**Cost**: $0.2973 (input 80046, cached 0, output 7357)

## Verdict: BLOCKED

> The Consumer Lock sequence has two corroborated high-severity silent-failure patterns that prevent a passing verdict: (1) the L1 RPC timeout is swallowed by the backend — the API returns success (exit 0) despite never confirming on-chain, leaving the lock permanently in 'pending' state with no error surfaced to the caller; (2) the explorer endpoint serves 'active' status to the frontend while the raw DB column reads 'pending', meaning users see confirmed locks that are not confirmed. These are not infrastructure-only issues — the backend's error-handling contract is broken. The L1 layer failure also cannot be downgraded to a simple infra rerun because the backend's own behavior under that failure (silent success) is the finding under test. No fixer proposals were received, so no auto-apply path exists.

- **Confidence**: 0.65
- **Fixer recommendation**: reject
- **Must fix before merge**:
- Backend must propagate L1 RPC failure — lock creation must return an error (not 200/success) when the L1 Vault submission times out or fails; no silent warn-and-continue
- DB status never transitions from 'pending' to 'locked' — the state-machine commit or background task that finalises the lock after L1 confirmation must either complete durably or roll back the lock row; currently the row is orphaned in 'pending'
- Explorer endpoint status mismatch — GET /v1/explorer/locks must read the actual status column (not infer 'active' from row existence or a cache); returning 'active' for a 'pending' lock is a user-visible correctness bug
- Test suite: remove unwrap_or_default() silent swallowing of response bodies — six locations in sequence_e2e_test.rs parse and discard response bodies, providing false coverage confidence
- **Unresolved questions**:
- Does the backend's L1 submission path catch the RPC timeout with Ok(()) / warn!() and continue, or is the pending→locked transition driven by a separate background task that silently failed? The fix strategy differs significantly between these two cases.
- The DB query and the frontend explorer test reference different lock_ids (0xd8f4fd75... vs 0x313fbe60...) — are these the same logical lock created in the same run window, or did the frontend test create an earlier lock whose status was already promoted while the DB query caught a later still-pending lock? This ambiguity must be resolved to confirm whether the status mismatch is universal or race-conditional.
- No fixer proposals were received — were proposals suppressed because the fixer could not locate patch targets, or because the parallel agent did not run? A human reviewer must confirm before any fix attempt.

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | pass | 0 | 810ms | 0.95 | 2 |
| frontend | pass | 0 | 34080ms | 0.98 | 0 |
| db | pass | 0 | 330ms | 0.95 | 1 |
| l1 | fail | 1 | 90275ms | 0.95 | 1 |

## Quality findings (Stage 3)

Counts by severity: high=2, medium=2, info=2

- **[high] Lock status stuck at 'pending' — DB state never transitions to 'locked' after successful lock creation** (_bug-hunter_) — The backend tests pass (4/4), the frontend reports a lock as 'active' in the explorer (stdout: '[Lock Persisted] lock_id=..., status=active'), but the DB layer query returns status='pending' for the most recently created lock. This is a three-way cross-layer inconsistency: (1) backend says lock created successfully, (2) frontend explorer endpoint reports status='active', (3) raw DB shows status='pending'. One of two silent failures is occurring: either the GET /v1/explorer/locks endpoint is returning a stale/cached 'active' status without reading the real DB column, or the post-creation state-machine transition that flips 'pending' → 'locked'/'active' is not being committed (e.g., swallowed in a background task with Ok(()) error handling). Either way, the on-chain confirmation step and/or the DB commit that finalises the lock is not completing, yet no error is surfaced to the caller.
- **[high] L1 RPC timeout silently ignored — lock accepted as successful with no on-chain confirmation** (_bug-hunter_) — The Consumer Lock sequence is designed to atomically create a lock and register it on-chain in the L1 Vault. The L1 layer failed with a network timeout ('operation timed out' against https://rpc.sepolia.org/), yet the backend returned success (exit 0, all tests green) and the frontend accepted the lock as created. This matches the known 'best-effort L1 calls that warn-and-continue on failure' regression pattern (item 13 in the silent-failure history). If the backend's L1 submission path catches the RPC error and continues rather than failing hard, the lock record in DB will remain 'pending' indefinitely with no retry or alert, and the consumer will believe their assets are locked when they are not. The DB status='pending' finding corroborates that the L1 commitment never completed.
- **[medium] unwrap_or_default() on response bodies in tests silently masks JSON parse failures and bad API responses** (_bug-hunter_) — Six test locations in sequence_e2e_test.rs parse the HTTP response body with `resp.json().await.unwrap_or_default()` and then never use the resulting `body` variable (compiler warns it is unused). This is a direct instance of silent-failure pattern #3 ('unwrap_or_default() on hex inputs hiding parse errors') applied to API response bodies. If the API returns a non-JSON body (e.g., a 500 error page, a malformed payload, or an empty response), `unwrap_or_default()` will silently yield `Value::Null` and the test will continue to pass. The unused variable means no assertion is ever made on the response content. The backend test suite therefore provides false confidence: it confirms HTTP status codes but not response body correctness.
- **[medium] Frontend explorer reports lock status='active' but DB has status='pending' — explorer endpoint serving stale or computed state** (_bug-hunter_) — The frontend test for 'lock is persisted in DB and visible via GET /v1/explorer/locks' passed and logged status='active', but a direct DB query milliseconds later shows status='pending'. The explorer endpoint is either (a) computing/inferring 'active' from the mere existence of the row rather than reading the actual status column, (b) reading from a read replica or cache that has not received the update, or (c) mapping 'pending' to 'active' in its serialisation layer. In any case, the explorer is presenting incorrect state to users — a lock that has not been confirmed on L1 and is still pending is being shown as active.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — No prior green run exists for sequence 'Consumer Lock' (SEQUENCES.md §1). This run's results will serve as the baseline for future regression comparisons. Notable state at baseline: backend 4/4 pass (810ms), frontend 40/40 pass (34080ms), db layer shows lock status='pending' (medium issue flagged), l1 layer failed due to RPC timeout on https://rpc.sepolia.org/.
- **[info] Recording first baseline** (_performance-monitor_) — Baseline metrics captured for seq-1. Backend: 810ms, Frontend: 34080ms, DB: 330ms, L1: 90275 gas. Total orchestrator cost: $0.0271.

## Fixer proposals (Stage 4)

- **[high] P1: Propagate L1 RPC errors as hard failures instead of silently continuing** — files: src/api/api/src/services/lock_service.rs, src/api/api/src/routes/locks.rs
- **[medium] P2: Add L1Unavailable variant to AppError** — files: src/api/api/src/errors.rs
- **[medium] P3: Fix explorer endpoint to read status column instead of inferring 'active' from row existence** — files: src/api/api/src/routes/explorer.rs
- **[low] P4: Replace unwrap_or_default() on response bodies in e2e tests with explicit assertions** — files: src/api/api/tests/sequence_e2e_test.rs
- **[high] P5: Investigation required — no automatic fix proposed for redis/sqlx future-incompatibility warnings** — files: 

## Acceptance criteria (from Stage 1 plan)

- Backend integration test exits code 0 with stdout confirming SR_0 computation and L1 submission — no fallback or mock path taken
- Playwright lock.integration.spec.ts reports zero failed tests and the UI reaches a success/confirmed lock state
- A locks row exists with created_at within the last 5 minutes, status='locked', and pk_dilithium length=1952
- Sepolia Vault totalLocked() returns a value strictly greater than 0 wei
- No silent fallback or hardcoded non-spec address appears anywhere in the captured trace

---
_Generated by quantum-shield-e2e-orchestrator_
