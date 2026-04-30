# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-04-30T06:06:05.219Z
**Finished**: 2026-04-30T06:10:34.404Z
**Duration**: 269.2s
**Plan source**: ai 
**Cost**: $0.3020 (input 73803, cached 0, output 8724)

## Verdict: BLOCKED

> Three independent critical failures prevent merge: (1) the pk_dilithium column stores only 32 bytes instead of the required 1952 bytes, indicating the Dilithium public key is being silently truncated or hashed before persistence; (2) the backend Rust e2e test binary exited with code 1 and produced no stdout, meaning all server-side invariants (SR_0 computation, lock_id assignment, L1 submission) are entirely unverified; (3) the frontend reports lock status='active' while the DB shows 'pending' and L1 is unreachable, suggesting the system is marking locks active in-memory without on-chain confirmation — a known critical silent-failure pattern. The L1 failure is an infra/RPC outage (HTTP 522 from rpc.sepolia.org) and alone would be downgraded, but it cannot be separated from finding #3 which depends on L1 state to resolve. No fixer proposals were received; human review is mandatory.

- **Confidence**: 0.45
- **Fixer recommendation**: reject
- **Must fix before merge**:
- pk_dilithium silently truncated to 32 bytes — full 1952-byte Dilithium public key is lost on write (DB critical)
- Backend Rust e2e test binary fails entirely (exit code 1, empty stdout) — SR_0, lock_id, and L1 submission invariants unverified
- Status divergence: API/explorer reports status='active' while DB shows 'pending' and L1 is unconfirmed — possible warn-and-continue on L1 failure
- L1 Vault totalLocked() unverifiable due to rpc.sepolia.org HTTP 522 outage — rerun required after RPC recovery to confirm on-chain state
- **Unresolved questions**:
- Is pk_dilithium being truncated by a BYTEA column size constraint, a bytes32 coercion in the ORM/write path, or a hash substitution before INSERT? Root cause must be identified before any patch.
- Why did the backend Rust test binary produce no stdout and exit 1 — is this a linker failure, a runtime panic at startup, or a missing environment variable (DATABASE_URL, L1_RPC_URL) that causes early exit before any test runs?
- Is the status='active' returned by GET /v1/explorer/locks sourced from an in-memory cache or event queue rather than the DB, and if so, is there a guaranteed reconciliation path that will update the DB once L1 confirms?
- Does the system have a hard-fail circuit-breaker on L1 submission failures, or does it warn-and-continue (silent-failure pattern #13)? The DB status='pending' with frontend showing 'active' is consistent with warn-and-continue.
- The frontend lock_id persisted in DB (0xeecabb8d50365c6ad8afa53b8e2392dd325c86ee4a707ac441fcbd4e66c23d4d) differs from the lock_id the frontend test logged as 'active' (0x7bf4c1a9be4fe66b3a9067f7e3e7960182268ed4f6448d70755c1cba32bd59a9) — are these the same run's locks, and does the DB query reflect the correct row?

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | fail | 1 | 120043ms | 0.95 | 3 |
| frontend | pass | 0 | 84222ms | 0.99 | 0 |
| db | pass | 0 | 500ms | 0.99 | 1 |
| l1 | fail | 1 | 40128ms | 0.95 | 1 |

## Quality findings (Stage 3)

Counts by severity: critical=3, high=1, info=2

- **[critical] pk_dilithium stored as 32 bytes instead of expected 1952 bytes — full key material silently lost** (_bug-hunter_) — The DB layer reports `length(pk_dilithium) = 32` for the most-recently written lock row. A Dilithium-2/3/5 public key is 1312–1952 bytes; 32 bytes is exactly the size of a SHA-256/SHA3-256 hash or a truncated bytes32 field. This is a textbook instance of silent-failure pattern #4 (`hex_to_bytes32_or_zero` / a bytes32 coercion eating the real key). The write path is almost certainly either (a) hashing or truncating the key to 32 bytes before storage, or (b) a BYTEA column that was accidentally defined as CHAR(32)/BYTEA with a 32-byte limit. Because the frontend tests pass and the backend Rust tests fail to produce any output, no layer caught this at runtime — the row was written silently with wrong data. Downstream signature-verification against this stored key will either always fail (locking users out) or, if verification is skipped on the 'no key found' path, always pass — both are security-critical outcomes.
- **[critical] Cross-layer inconsistency: frontend reports lock status='active' but DB shows status='pending' for same sequence run** (_bug-hunter_) — The frontend test 'lock is persisted in DB and visible via GET /v1/explorer/locks' explicitly logs `status=active` for lock_id `0x7bf4c1a9be4fe66b3a9067f7e3e7960182268ed4f6448d70755c1cba32bd59a9`. However, the DB query returns `status=pending` for the most-recently written lock (`0xeecabb8d50365c6ad8afa53b8e2392dd325c86ee4a707ac441fcbd4e66c23d4d`). While these are different lock_ids (the DB query shows the last inserted row from the multi-lock test batch), the spec requires that a successfully created lock transitions to or is stored as 'active' once the L1 Vault call is enqueued/confirmed. The presence of 'pending' in the DB suggests the L1 submission step either never ran or silently failed and the status was never updated — consistent with the L1 RPC being unreachable (HTTP 522). If the system is designed to write 'pending' first and update to 'active' only after L1 confirmation, then the 'active' status returned by the API/explorer endpoint is being read from an in-memory or cached state rather than ground-truth DB state, which means the API is lying about lock finality.
- **[critical] Backend Rust e2e test binary fails entirely (exit code 1, empty stdout) — all server-side invariant checks are unverified** (_bug-hunter_) — The backend test command exited with code 1 and produced zero stdout. The stderr contains only compilation traces with no `test result:` line, meaning the test binary either panicked before running any test, failed to link, or encountered a runtime startup error. This is not merely a test-environment issue: the Consumer Lock sequence spec requires verification of SR_0 computation (`SHA3-256('QS_LOCK_V1' || ...)`), lock_id assignment, and L1 Vault transaction submission. None of these were verified. The frontend and DB layers ran against a live backend that may be in a broken state — the frontend's 40/40 pass rate cannot be trusted as proof of correctness when the backend's own test suite cannot execute. This also means silent-failure patterns (unwrap_or_default, hex_to_bytes32_or_zero, Ok(()) swallowing) in the lock path were not exercised by any automated check this run.
- **[high] L1 Vault state unverifiable while frontend claims successful lock commits — no circuit-breaker or fallback guard detected** (_bug-hunter_) — The L1 check against the correct vault address `0x07012aeF87C6E423c32F2f8eaF81762f63337260` returned HTTP 522 (RPC timeout). The frontend simultaneously reports `totalLocks: 30 -> 31` and locks with `status=active`. If the system increments the explorer counter and marks locks active without waiting for L1 confirmation (or without a reliable retry/queue mechanism), then user-facing state diverges from on-chain state silently. Per the Quantum Shield silent-failure history, item #13 ('best-effort L1 calls that warn-and-continue'), this pattern — where an L1 call failure causes a warn-and-continue rather than a hard failure — is a known critical regression. The DB status='pending' on the last lock row is a weak signal that the L1 path may already be in warn-and-continue mode: the lock was accepted and counted by the explorer but never confirmed on-chain.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — No prior green run exists for sequence 'Consumer Lock' (SEQUENCES.md §1). This run is not green (backend layer failed, db layer has a critical issue, l1 layer failed due to RPC timeout). A baseline will only be recorded once a fully green run completes.
- **[info] Recording first baseline** (_performance-monitor_) — Baseline metrics captured for seq-1. Backend: 120043ms, Frontend: 84222ms, DB: 500ms, L1: 40128ms. Total orchestrator cost: $0.0303.

## Fixer proposals (Stage 4)

_(none)_

## Acceptance criteria (from Stage 1 plan)

- Backend integration test exits with code 0 and stdout confirms SR_0 computation and L1 lockWithSR0 submission
- Playwright lock.integration.spec.ts reports all cases as passed with zero failures
- A row exists in the locks table with status='locked' and pk_dilithium byte length exactly equal to 1952
- Sepolia Vault totalLocked() returns a value strictly greater than 0 wei
- No silent fallback or hardcoded address appears in any layer's execution trace

---
_Generated by quantum-shield-e2e-orchestrator_
