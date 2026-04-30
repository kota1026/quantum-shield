# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-04-30T13:56:25.280Z
**Finished**: 2026-04-30T14:01:14.929Z
**Duration**: 289.6s
**Plan source**: ai 
**Cost**: $0.2848 (input 93353, cached 0, output 4537)

## Verdict: FIXABLE

> The Consumer Lock sequence has two real failures and two infrastructure-related failures. The frontend Playwright suite fails deterministically (25/40 tests, all retries exhausted) because the live API returns HTTP 400 for valid positive-path lock creation requests — a live request-validation code path that the SQLX_OFFLINE backend unit tests do not exercise. The L1 layer failure is a transient RPC infrastructure timeout (HTTP 522 from rpc.sepolia.org), not a contract or code regression, and is downgraded per Override Rule 2. The DB 'pass' is misleading: the single row found almost certainly originates from the backend unit-test fixture, not from any successful e2e call, so end-to-end persistence is unconfirmed. No fixer proposals were received; all fixes require human review given the API validation root cause and the unconfirmed e2e write path.

- **Confidence**: 0.65
- **Fixer recommendation**: review_required
- **Must fix before merge**:
- Frontend/API: live POST /v1/lock returns HTTP 400 for valid requests — identify and fix the request-body deserialization or validation middleware divergence between SQLX_OFFLINE unit-test path and live API path (25 deterministic failures, all retries exhausted)
- DB verification: add timestamp/row-count guard to DB check so it validates rows created during the e2e run window, not pre-existing unit-test fixture rows — current LIMIT 1 query cannot distinguish origins
- Test: replace unwrap_or_default() on resp.json() with explicit error propagation at 6 locations in sequence_e2e_test.rs (lines 671, 1217, 1235, 1479, 1499, 1517) to prevent silent masking of body-parse failures
- L1 RPC: rerun l1 verification layer once rpc.sepolia.org recovers (HTTP 522 transient timeout); ensure at least one confirmed on-chain totalLocked > 0 reading before baseline is recorded
- L1 submission health: audit background L1 submission task error handling to confirm 'pending' lock rows are not silently stranded when the RPC endpoint is unavailable
- **Unresolved questions**:
- What specific request-body field or validation rule causes the live API to return 400 for the Playwright lock creation payloads that the SQLX_OFFLINE tests accept — is it a content-type header, a field name mismatch, a nonce format difference, or a middleware ordering issue?
- Is the single DB row (lock_id 0xaaf8a180..., status=pending, created_at unknown) from the backend unit-test fixture or from a real consumer request — and if the former, has any e2e-originated lock ever been persisted to this DB?
- Is the L1 RPC timeout (HTTP 522 on rpc.sepolia.org) transient or persistent — and if persistent, are background L1 submission tasks for existing 'pending' rows also failing silently?

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | pass | 0 | 1108ms | 0.95 | 2 |
| frontend | fail | 1 | 100902ms | 0.95 | 3 |
| db | pass | 0 | 268ms | 1.00 | 0 |
| l1 | fail | 1 | 40251ms | 0.95 | 1 |

## Quality findings (Stage 3)

Counts by severity: high=2, medium=2, info=2

- **[high] Cross-layer inconsistency: backend passes 4/4 but frontend lock-creation tests fail with HTTP 400 across all retries** (_bug-hunter_) — The backend unit/integration tests (SQLX_OFFLINE mode) pass cleanly, and the DB layer confirms a valid lock row was written (lock_id present, pk_dilithium=1952 bytes, status=pending). However, the Playwright e2e tests that hit the live API endpoint consistently receive HTTP 400 for valid positive-path lock creation requests — both the 'duplicate nonce prevents replay' test (line 172) and the 'multiple locks create distinct lock_ids and SR_0s' test (line 234) fail on every retry across every browser project. The backend tests pass because they exercise a mocked/offline path (SQLX_OFFLINE=true), meaning the real request-handling pipeline — including request parsing, body deserialization, or a validation middleware layer — differs from what the unit tests cover. The 400 is returned before any DB write can occur for those requests. This is a classic backend-pass + frontend-fail split: the offline test harness does not exercise the same validation code path as the live API.
- **[high] DB row presence does not confirm e2e lock success — single row may be stale from unit test run, masking zero e2e writes** (_bug-hunter_) — The DB check queries 'ORDER BY created_at DESC LIMIT 1' and finds exactly one row with status=pending. But the backend tests run first (SQLX_OFFLINE=true, duration 1108ms) and the frontend e2e tests run separately and fail with 400s. The single DB row is most likely written by the backend unit test fixture, not by any successful e2e call. Because the e2e requests return 400, no new rows are written during the Playwright run. This means the DB 'pass' verdict is misleading: it is validating a pre-existing row, not confirming that the e2e consumer lock flow actually persists data. A correct cross-layer check would assert row count increased after the e2e suite, or compare created_at timestamps against the e2e run window (2026-04-30T13:56:40 – 13:58:58).
- **[medium] unwrap_or_default() on response JSON body hides parse/deserialization errors in test assertions** (_bug-hunter_) — Six separate locations in sequence_e2e_test.rs use the pattern 'let body: Value = resp.json().await.unwrap_or_default()'. This matches silent-failure pattern #3: unwrap_or_default() on a fallback that can mask real errors. If the API returns a non-JSON body (e.g., a plain-text error, an empty body on 400/422, or a binary response), the parse failure is silently converted to Value::Null (the default). Because 'body' is then also unused (triggering the compiler warnings), the test neither inspects nor asserts on the response body for those code paths. Any body-level error — wrong content-type, truncated JSON, error message schema — goes completely undetected. This is especially dangerous in the invalid-signature and nonce-replay rejection paths where the error payload should be inspected.
- **[medium] L1 vault state unverifiable — lock marked 'pending' in DB with no confirmed L1 write, and RPC is down** (_bug-hunter_) — The Consumer Lock sequence requires that a successful lock eventually results in a state change on the L1 vault contract at 0x07012aeF87C6E423c32F2f8eaF81762f63337260 (totalLocked incremented). The DB row is correctly in 'pending' status, meaning the L1 submission has not yet been confirmed. However, the L1 layer check failed with HTTP 522 (RPC endpoint timeout), so there is no way to verify whether any prior lock transactions have actually landed on-chain. While the 522 is an infrastructure issue, the combination of: (a) all e2e lock POSTs returning 400, (b) DB showing only one pending row of uncertain origin, and (c) L1 RPC being unreachable means the end-to-end Consumer Lock sequence has zero confirmed successful paths in this run. If the RPC timeout is persistent (not transient), background L1 submission tasks may also be silently failing — and per silent-failure pattern #5, if those tasks use Ok(()) error swallowing, failures will not surface.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — No prior green run exists for sequence 'Consumer Lock' (SEQUENCES.md §1). This run cannot be evaluated as a regression; it establishes the reference point once it goes green. Current run has a failing frontend layer (25 unexpected tests) and a failing l1 layer (RPC 522 timeout), so this run will NOT be recorded as the green baseline.
- **[info] Recording first baseline** (_performance-monitor_) — No baseline exists for seq-1. Current metrics recorded as baseline for future comparison.

## Fixer proposals (Stage 4)

_(none)_

## Acceptance criteria (from Stage 1 plan)

- Backend integration test exits with code 0 and stdout confirms SR_0 computation and L1 submission with no FAILED or panic output
- Playwright lock.integration.spec.ts reports all tests passed with zero failures and zero skips
- A row exists in the locks table with status equal to 'locked' and pk_dilithium byte length equal to exactly 1952
- Sepolia Vault totalLocked() returns a value strictly greater than 0 wei
- No silent fallback or hardcoded address appears in the execution trace

---
_Generated by quantum-shield-e2e-orchestrator_
