# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-04-28T12:53:54.103Z
**Finished**: 2026-04-28T13:00:23.427Z
**Duration**: 389.3s
**Plan source**: fallback (⚠ AI-refined plan unavailable; static binding used)
**Cost**: $0.2385 (input 57313, cached 0, output 7264)

## Verdict: BLOCKED

> The Consumer Lock sequence failed across three of four layers with no single fixable root-cause patch covering all issues. The backend test binary timed out at exactly 300 s (killed by the runner) without emitting any test output, and the DB independently confirms zero lock rows were written — meaning the full creation path (SR0 computation, Dilithium key storage, L1 submission) never executed. The frontend is broken due to missing node_modules (@playwright/test not installed), and the L1 layer is unverifiable due to a Cloudflare 522 RPC outage on rpc.sepolia.org; while the L1 failure is infrastructure-only and would normally permit a downgrade, the backend hang and empty DB are code-level failures that cannot be auto-resolved. No fixer proposals were produced, so there is nothing to apply.

- **Confidence**: 0.65
- **Fixer recommendation**: reject
- **Must fix before merge**:
- Backend test binary hangs for 5 minutes and is killed — identify and fix blocking resource acquisition (DB pool, RabbitMQ, or L1 RPC call) in test setup or add explicit timeouts
- Zero rows in locks table — Consumer Lock creation path is entirely non-functional; lock row, SR0, and pk_dilithium are never written
- pk_dilithium storage path unverified — once write path is restored, assert column is exactly 1952 bytes and not zero-filled (guard against unwrap_or_default / hex_to_bytes32_or_zero silent failures)
- Frontend node_modules not installed — @playwright/test missing; run npm install in src/frontend/web before any Playwright test execution
- L1 vault address correctness unverifiable — RPC outage prevents confirming totalLocked() > 0 and that no hardcoded wrong address (0x...0002 placeholder) is present in backend submission path; code-search required as compensating control
- Backend test timeout suggests silent-swallowed error in async setup — audit for Ok(()) returns in background tasks and ensure all setup errors propagate and fail-fast
- **Unresolved questions**:
- What specific resource is the backend test binary blocking on during setup that causes it to hang for exactly 300 s before being killed — DB connection pool exhaustion, RabbitMQ unavailability, or an outbound L1 RPC call in test initialization?
- Is the L1 vault submission address in the backend code actually 0x07012aeF87C6E423c32F2f8eaF81762f63337260 (correct) or a placeholder — cannot be confirmed from test output alone and RPC outage prevents runtime verification?
- The db layer reports exit_code=0 (pass) but returned zero rows — is this a pre-existing empty test database or evidence that a prior run partially succeeded and cleaned up, or has the locks table never been populated in this environment?

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | fail | 1 | 300032ms | 0.95 | 2 |
| frontend | fail | 1 | 6087ms | 0.95 | 2 |
| db | pass | 0 | 329ms | 0.95 | 2 |
| l1 | fail | 1 | 19883ms | 0.95 | 1 |

## Quality findings (Stage 3)

Counts by severity: critical=2, high=4, info=2

- **[critical] Cross-layer silent failure: backend test crashed with no output AND DB is empty — lock was never created** (_bug-hunter_) — The backend test exited with code 1 and produced zero stdout. The DB layer independently confirmed zero rows in the locks table. Together these prove the Consumer Lock creation path failed entirely — not merely a test-harness flake. Because the DB query itself succeeded (exit 0) but returned no rows, the failure is in the application code or its setup, not in the query. The L1 call could not be verified due to RPC outage (HTTP 522), but the DB emptiness alone is sufficient to conclude that SR0 was never computed and `lockWithSR0` was never submitted.
- **[critical] Backend test binary never executed — likely panic or link failure in test setup, not a test assertion failure** (_bug-hunter_) — A normal cargo test failure (assertion mismatch, timeout, etc.) still prints 'test result: FAILED' to stdout. Here stdout is completely empty despite compilation succeeding. This matches one of three silent-failure patterns: (a) the test binary panicked during global/async setup before any test ran, (b) a background task swallowed an error via `Ok(())` or similar and the test harness received a non-zero exit from the runtime, or (c) a `unwrap_or_default()` / silent fallback silently corrupted state before the first assertion. All three are on the Quantum Shield silent-failure watch-list (items 5, 3, 4). The duration of 300 032 ms (exactly 5 minutes) strongly suggests a timeout — the test binary hung waiting for a resource (DB connection pool, RabbitMQ, or an L1 RPC call that also timed out) and was killed by the test runner.
- **[high] L1 RPC outage masks whether vault address regression exists — cannot clear item #1 from silent-failure checklist** (_bug-hunter_) — The vault address `0x07012aeF87C6E423c32F2f8eaF81762f63337260` is the correct known-good address and was correctly used in the cast call. However, because the RPC returned HTTP 522, we have no confirmation that `totalLocked()` is non-zero. Combined with the DB being empty, it is impossible to rule out that a hardcoded wrong address or `0x...0002` placeholder (silent-failure items #1 and #2) is present in the backend code path and the lock call silently went to the wrong contract. This must be verified by a code search before this sequence is marked green.
- **[high] Frontend test environment is broken — `@playwright/test` not installed, lock UI flow completely unverified** (_bug-hunter_) — The frontend layer failed before running a single test because `@playwright/test` is not installed in `src/frontend/web/node_modules`. This is not merely a CI inconvenience: it means the entire UI lock-creation flow (button state, wallet connection, success/error display) is unverified for this sequence run. Critically, it also means frontend-side bugs such as `SAMPLE_PROPOSALS` hardcoding (silent-failure item #12) or `wallet_address = 'caller'` (item #7) in the lock path cannot be detected by this layer.
- **[high] pk_dilithium cryptographic material never written — Dilithium key storage path may be silently broken** (_bug-hunter_) — The DB query specifically checks `length(pk_dilithium)` and the expected value is 1952 bytes (Dilithium-3 public key). The table is empty, so we cannot confirm the key was generated or stored. However, this column is a known regression target: if `hex_to_bytes32_or_zero` (silent-failure item #4) or `unwrap_or_default()` (item #3) is used anywhere in the Dilithium key serialization path, a bad key would be stored as zeroes rather than raising an error. With zero rows the failure is upstream, but when the write path is fixed, this specific column must be asserted to be exactly 1952 bytes — not merely non-null and not zero-filled.
- **[high] Backend layer exceeds 5-minute threshold** (_performance-monitor_) — backend layer consumed 300.032s (5.0 minutes), approaching practical developer tolerance. Sequential runs of this sequence will accumulate friction.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — No prior green run exists for sequence 'Consumer Lock' (SEQUENCES.md §1). All findings in this run are initial observations, not regressions. Current run has 3 failing layers (backend, frontend, l1) and 1 passing layer (db, though it returned no rows).
- **[info] Recording first baseline** (_performance-monitor_) — Baseline established for seq-1: backend 300.032s, frontend 6.087s, db 0.329s, l1 19.883s. Total orchestrator cost $0.020.

## Fixer proposals (Stage 4)

- **[medium] P1: Add startup-probe timeout and propagate connection errors instead of hanging in test setup** — files: src/api/api/tests/sequence_e2e_test.rs, src/api/api/src/db/pool.rs, src/api/api/src/rpc/client.rs
- **[medium] P2: Remove silent unwrap_or_default in DB pool creation and propagate errors with context** — files: src/api/api/src/db/pool.rs, src/api/api/src/main.rs
- **[medium] P3: Assert pk_dilithium is exactly 1952 bytes and non-zero-filled after lock creation** — files: src/api/api/tests/sequence_e2e_test.rs
- **[medium] P4: Install @playwright/test (not playwright) as a dev dependency and add pre-test install step** — files: src/frontend/web/package.json
- **[high] P5: Investigation required — vault address and L1 submission code path cannot be verified without RPC connectivity** — files: 

## Acceptance criteria (from Stage 1 plan)

- Backend integration test passes
- Playwright lock.integration.spec.ts passes
- A new locks row exists with status=locked and Dilithium pk len 1952
- Sepolia Vault totalLocked is non-zero
- No silent fallback or hardcoded address in the trace

---
_Generated by quantum-shield-e2e-orchestrator_
