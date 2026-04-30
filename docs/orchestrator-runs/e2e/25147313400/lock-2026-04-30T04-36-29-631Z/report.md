# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-04-30T04:36:29.631Z
**Finished**: 2026-04-30T04:40:13.252Z
**Duration**: 223.6s
**Plan source**: ai 
**Cost**: $0.2890 (input 72987, cached 0, output 8080)

## Verdict: FIXABLE

> The Consumer Lock sequence fails at the backend and db layers: the Rust integration test exited after exactly 120 s with no test output (likely a timeout/hang), and the locks table is empty confirming no write occurred. The frontend's 40/40 pass result is against a test-double that diverges from the real backend, making it misleading rather than a true signal. The L1 layer failure is an infrastructure outage (HTTP 522 from rpc.sepolia.org) and not a code defect — per override rule 2 this is downgraded to FIXABLE rather than BLOCKED. No fixer proposals were received, so the recommendation is review_required pending human diagnosis of the backend hang.

- **Confidence**: 0.65
- **Fixer recommendation**: review_required
- **Must fix before merge**:
- Backend Rust test hangs/panics at 120 s — root cause hidden by output truncation; actual error must be surfaced and resolved
- Lock write path broken — zero rows in locks table after full sequence run; DB INSERT never executes or is silently swallowed
- pk_dilithium column unverified — 1952-byte Dilithium key storage cannot be confirmed until backend writes a real row
- Frontend integration tests target a stub/mock backend, not the real service — test isolation must be corrected so Playwright hits the real API
- L1 RPC endpoint (rpc.sepolia.org) is down (HTTP 522) — switch to a reliable fallback RPC before retrying L1 verification
- **Unresolved questions**:
- What is the actual panic/error inside the backend test? The 2507-byte stderr was truncated before any test output appeared — the real failure message is invisible.
- Is the Playwright suite intentionally configured to hit a mock server, or is this an accidental misconfiguration? The 'lock is persisted in DB and visible via GET /v1/explorer/locks' test returned status=active yet the DB is empty — these cannot both be true against the same real backend.
- Did the backend test timeout because of a missing environment variable (e.g. DATABASE_URL not set despite SQLX_OFFLINE=true), a network dependency on the Sepolia RPC that also timed out, or an internal deadlock?

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | fail | 1 | 120018ms | 0.95 | 4 |
| frontend | pass | 0 | 76985ms | 0.98 | 0 |
| db | pass | 0 | 325ms | 0.95 | 1 |
| l1 | fail | 1 | 39837ms | 0.95 | 1 |

## Quality findings (Stage 3)

Counts by severity: critical=2, high=2, info=2, medium=1

- **[critical] Frontend passes all 40 tests but DB contains zero rows — lock is never persisted** (_bug-hunter_) — The frontend integration suite reports 'POST /v1/lock creates lock with valid SR_0 and lock_id' as passed and 'lock is persisted in DB and visible via GET /v1/explorer/locks' as passed, yet the DB layer query returned an empty result set (stdout_excerpt is empty, zero rows). This is a classic cross-layer silent failure: the mock/stub backend that the Playwright tests hit is returning well-formed 200 responses and fabricated lock_ids/SR_0s without ever writing to the real database. The backend Rust test suite failed (exit_code=1), which confirms the real backend path is broken; the frontend is testing against a test-double that diverges from the real implementation. This means the lock sequence produces a plausible-looking lock_id (e.g. '0x049904a89315a6cd24fa92c01cc47aae1537b68a4a527b333ce127421cdfc4d4') that has no corresponding DB row and will never be submitted to L1.
- **[critical] Backend test failure root cause hidden by output truncation — lock write path completely unverified** (_bug-hunter_) — The backend Rust test (`sequence_lock`) exited with code 1 after a 120-second run, but the entire stderr excerpt (2507 bytes truncated) contains only dependency compilation lines with zero test execution output. The stdout_excerpt is empty. This means: (1) the actual panic/assertion/error that caused exit_code=1 is invisible; (2) no log evidence exists for lock_id assignment, SR_0 computation (SHA3-256(QS_LOCK_V1 || ...)), or the `lockWithSR0` call to the L1Vault. The 120-second duration (timeout threshold) strongly suggests the test hung or panicked early rather than completing normally, which is consistent with the DB showing zero rows. Without the actual error, the silent-failure patterns from items 3, 4, and 5 in the priority list (unwrap_or_default, hex_to_bytes32_or_zero, Ok(()) swallowing errors) cannot be ruled out.
- **[high] L1 totalLocked state unverifiable — lock sequence cannot be confirmed end-to-end** (_bug-hunter_) — The L1 verification step against the canonical vault address (0x07012aeF87C6E423c32F2f8eaF81762f63337260) returned HTTP 522 from rpc.sepolia.org. Combined with the backend failure and the empty DB, there is no evidence that any `lockWithSR0` transaction was submitted to L1. The frontend test '[Explorer] totalLocks: 30 -> 31' only reflects the off-chain explorer counter, not the on-chain vault state. The sequence is therefore unverified at every real layer (backend, db, L1); only the frontend stub layer reports success.
- **[high] pk_dilithium column presence unverified — Dilithium key storage regression possible** (_bug-hunter_) — The DB query explicitly selects `length(pk_dilithium)` to verify the 1952-byte Dilithium public key is stored with each lock. Because the query returned zero rows, it is impossible to know whether the INSERT code path even attempts to populate this column. If the backend is silently inserting a row without the pk_dilithium field (e.g. via unwrap_or_default on key generation), the column would be NULL or zero-length and the cryptographic binding between the consumer's lock and their post-quantum key would be broken. This cannot be confirmed or denied from the current evidence.
- **[medium] Sequence execution time exceeds developer tolerance** (_performance-monitor_) — Total wall-clock time is 237.2 seconds (3m 57s). Developers are unlikely to run sequences >5 minutes, but this is close. Monitor for further slowdown.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — No prior green run exists for sequence 'Consumer Lock' (SEQUENCES.md §1). This run is not green (backend and db layers are failing), so no baseline will be recorded yet. The findings below document the current failure state for tracking purposes.
- **[info] Recording first baseline** (_performance-monitor_) — No baseline exists for seq-1. Current metrics established as baseline: backend 120.0s, frontend 77.0s, db 0.3s, L1 39.8k gas, total agent cost $0.0227.

## Fixer proposals (Stage 4)

_(none)_

## Acceptance criteria (from Stage 1 plan)

- Backend integration test exits with code 0 and stdout confirms SR_0 computed and lockWithSR0 submitted — no FAILED or panic lines present
- Playwright lock.integration.spec.ts reports zero failed tests and the JSON output contains status: 'passed' for every test case
- The most recent row in the locks table has status = 'locked' and length(pk_dilithium) = 1952 exactly
- Sepolia Vault totalLocked() returns a value strictly greater than 0 wei
- No silent fallback or hardcoded address appears in any layer's trace or log output

---
_Generated by quantum-shield-e2e-orchestrator_
