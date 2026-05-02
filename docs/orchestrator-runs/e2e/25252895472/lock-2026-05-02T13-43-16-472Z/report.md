# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-05-02T13:43:16.472Z
**Finished**: 2026-05-02T13:45:24.631Z
**Duration**: 128.2s
**Plan source**: ai 
**Cost**: $0.2773 (input 77248, cached 0, output 6506)

## Verdict: BLOCKED

> The Consumer Lock sequence has a critical, cross-layer silent-failure: the lock is created successfully in the DB (status=pending, pk_dilithium=1952 bytes) but the L1 anchoring step never executed — l1_tx_hash is NULL, l1_submitted=false, and the L1Vault totalLocked() value is unchanged at 1.2e17 wei. The backend lock endpoint returned HTTP 200 and the backend/frontend test suites both reported all-green despite zero L1 anchoring, because neither test asserts on l1_tx_hash or the post-submission vault state. Root cause is most likely QS__L1_PRIVATE_KEY being unset in the CI environment, but the deeper protocol defect is that the lock API swallows the L1 submission error and returns success anyway. No fixer proposals were provided; the required fixes touch L1 submission logic and test acceptance criteria, which require human review before any automated application.

- **Confidence**: 0.65
- **Fixer recommendation**: review_required
- **Must fix before merge**:
- L1 submission error silently swallowed — lock endpoint returns HTTP 200 when QS__L1_PRIVATE_KEY is unset or L1 anchoring fails; must surface error to caller
- QS__L1_PRIVATE_KEY not set in CI environment — L1 anchoring cannot execute without a funded signing key; secret must be provisioned or test environment must gate on its presence
- Backend e2e test test_lock_creates_successfully does not assert l1_tx_hash is non-null — test passes even when L1 anchoring is entirely absent
- Frontend integration test treats status=pending as a terminal success state — spec requires l1_tx_hash non-null and Locked event emitted before a lock is considered complete
- L1Vault totalLocked() did not increase — acceptance criterion #5 (totalLocked non-zero after run) unmet for this run
- **Unresolved questions**:
- Is QS__L1_PRIVATE_KEY intentionally absent in this CI environment (e.g., a secrets-gated deploy pipeline) or is this an accidental omission? The distinction determines whether the fix is env config alone or also requires code changes.
- Is the L1 submission path designed to be synchronous (block until mined) or asynchronous (fire-and-forget background task)? The answer determines the correct API contract change (synchronous error vs. 202+polling) and which code path to fix.
- The L1 layer script checks the Vault address 0x07012aeF87C6E423c32F2f8eaF81762f63337260 for totalLocked() but the plan's expected output references L1 Vault 0x6F889C00a5e674ab0b9403AfBa0fBEbe30511c67 for the Locked event — are these the same contract at different addresses or two different contracts, and which is authoritative?

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | pass | 0 | 912ms | 0.95 | 0 |
| frontend | pass | 0 | 36607ms | 0.99 | 0 |
| db | pass | 0 | 315ms | 0.92 | 1 |
| l1 | fail | 1 | 566ms | 0.95 | 2 |

## Quality findings (Stage 3)

Counts by severity: critical=2, high=2, info=2

- **[critical] Lock persisted as 'pending' but never anchored on L1 — silent protocol stall** (_bug-hunter_) — The Consumer Lock sequence requires a full round-trip: DB row created → L1 Vault anchored → status transitions away from 'pending'. Here, the DB row exists (status=pending, l1_tx_hash IS NULL, l1_submitted=false) and the backend/frontend layers both report pass, creating a false impression of success. The lock is permanently stalled: no L1 Locked event will ever fire, downstream sequences (proof generation, redemption) cannot proceed, and no error surfaced to the caller. This is a cross-layer silent failure: backend returned 200, frontend validated 200, DB has a row, but the vault state is unchanged. The L1 layer's totalLocked() confirms no new value was anchored (120000000000000000 wei, unchanged). This matches silent-failure pattern #5 ('Ok(()) swallowing background task errors') — the L1 submission task almost certainly errored internally but the lock endpoint returned success anyway.
- **[critical] L1 submission error swallowed — lock endpoint returns 200 when L1 anchoring fails** (_bug-hunter_) — The lock creation API returns HTTP 200 and a well-formed JSON response (lock_id, sr_0, status=pending, smt_proof) even when the background L1 submission task either was never started or silently errored. This is a direct instance of silent-failure pattern #5: a background task that fails but returns Ok(())/success to the caller. The caller (consumer client or frontend) has no way to know the lock is incomplete. Per the spec (SEQUENCES.md §1), a lock is only valid once anchored on L1; returning 200 before that condition is met is incorrect. The lock should either: (a) synchronously submit to L1 before responding, or (b) return a 202/pending status with a documented polling contract and fail loudly if L1 submission subsequently fails. Currently neither happens.
- **[high] Backend e2e test does not assert l1_tx_hash — success criterion is too weak** (_bug-hunter_) — The backend test test_lock_creates_successfully passes with zero assertion on l1_tx_hash or L1 anchoring. The test only checks that the HTTP response is 200 and the body contains a lock_id and sr_0. This means the test can pass even when L1 anchoring is entirely missing, which is exactly what happened in this run. The test therefore provides false confidence and does not cover the critical success path defined in SEQUENCES.md §1. A regression in L1 submission would be invisible to this test suite.
- **[high] Frontend integration tests validate 'pending' status as terminal success — spec violation** (_bug-hunter_) — The frontend test 'lock is persisted in DB and visible via GET /v1/explorer/locks' asserts status=pending and marks the test as passed. Under the protocol spec, 'pending' is a transitional state, not a success state; a lock is only complete once l1_tx_hash is non-null and the Locked event has been emitted. By treating 'pending' as the expected final state, the frontend test suite is incapable of detecting the L1 anchoring silent failure. This is a cross-layer inconsistency: frontend passes, L1 fails, but no alarm was raised.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — last_green_run is null for sequence 'Consumer Lock' (SEQUENCES.md §1). This run cannot be compared against a prior green run. Note: this run has a failing l1 layer (exit_code=1, L1 anchoring did not occur) and will NOT be recorded as the green baseline.
- **[info] Recording first baseline** (_performance-monitor_) — Baseline metrics are null. Current run (seq-1) establishes the baseline: backend 912ms, frontend 36607ms, db 315ms, l1 566ms. Total orchestrator cost: $0.0242.

## Fixer proposals (Stage 4)

- **[medium] P1: Propagate L1 submission failure — return 500 instead of swallowing the error** — files: src/api/api/src/routes/locks.rs
- **[high] P1-detail: Investigation required — locate and fix silent L1 submission swallow in lock route handler** — files: src/api/api/src/routes/locks.rs, src/api/api/src/services/l1_client.rs
- **[medium] P2: Investigation required — validate QS__L1_PRIVATE_KEY at startup and fail fast** — files: src/api/api/src/main.rs, src/api/api/src/config.rs
- **[low] P3: Strengthen backend lock test to assert l1_tx_hash is non-null after creation** — files: src/api/api/tests/seq1_lock.rs
- **[low] P4: Fix frontend test to assert l1_tx_hash non-null rather than accepting 'pending' as terminal** — files: src/frontend/web/tests/lock.test.ts

## Acceptance criteria (from Stage 1 plan)

- Backend integration test seq1_lock passes with exit code 0 and no FAILED assertions — Dilithium signature verified, nonce accepted, expiry checked, SR_0 computed correctly, lock_id issued
- Playwright lock.integration.spec.ts passes with exit code 0 and 0 failed test cases — UI flow reaches success state and DB row is created
- A locks row exists with created_at within the last 5 minutes, status is one of {pending, locked, confirmed}, length(pk_dilithium) equals exactly 1952, and l1_tx_hash IS NOT NULL
- The l1_tx_hash stored in the locks row resolves to a transaction receipt with status==0x1 on the configured L1 RPC — a reverted or missing transaction is a hard failure
- L1 Vault totalLocked is non-zero after the run, confirming assets were actually received by the contract
- No silent fallback or hardcoded address appears in the execution trace — all addresses must be sourced from environment configuration

---
_Generated by quantum-shield-e2e-orchestrator_
