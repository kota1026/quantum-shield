# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-05-02T05:16:38.839Z
**Finished**: 2026-05-02T05:18:21.759Z
**Duration**: 102.9s
**Plan source**: ai 
**Cost**: $0.2374 (input 71740, cached 0, output 4611)

## Verdict: BLOCKED

> All four layer agents individually report pass, but two high-severity silent-failure patterns detected by bug-hunter invalidate that green. The most recently created lock has l1_tx_hash=NULL (l1_submitted=f), meaning the Consumer Lock sequence's core security guarantee — anchoring the lock on the L1 Vault — was never fulfilled during this run. Compounding this, the frontend test asserts status=active for a lock that the DB and backend both record as status=pending, indicating the frontend test is either hitting a different row or the explorer API returns a status inconsistent with canonical DB state — a ghost-pass that masks a broken state-transition path. The L1 layer's pass is vacuously uninformative because it performs no before/after delta measurement; the 1.2e17 wei totalLocked() value predates this run entirely.

- **Confidence**: 0.65
- **Fixer recommendation**: review_required
- **Must fix before merge**:
- l1_tx_hash NULL / L1 submission never attempted — lock exists only in DB, not anchored on-chain (critical path failure for Consumer Lock §1)
- Frontend test ghost-pass: status=active asserted against a lock the DB records as status=pending — test must query canonical DB state or assert against backend truth, not explorer endpoint
- L1 layer test must record totalLocked() before and after the test run and assert a positive delta, not a vacuous > 0 check
- **Unresolved questions**:
- Why is l1_tx_hash NULL for the most recent lock — is the L1 submission code path disabled, misconfigured, or silently swallowed an error? No error appears in any layer's stderr.
- Does the explorer API (/v1/explorer/locks) return a synthetic status=active independent of the DB status column, or is it reading from a different table/cache? The discrepancy between frontend-observed status=active and DB status=pending is unexplained.
- Is the 120000000000000000 wei totalLocked() value entirely from prior state (i.e., no lock in this run ever reached the vault), or is there a race condition where L1 submission occurs asynchronously after the DB query window?

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | pass | 0 | 841ms | 0.95 | 1 |
| frontend | pass | 0 | 36519ms | 1.00 | 0 |
| db | pass | 0 | 264ms | 0.95 | 0 |
| l1 | pass | 0 | 377ms | 0.98 | 0 |

## Quality findings (Stage 3)

Counts by severity: high=2, medium=1, info=2

- **[high] Frontend reports lock status=active but DB and backend both show status=pending** (_bug-hunter_) — The frontend integration test at lock.integration.spec.ts line 175 logs '[Lock Persisted] lock_id=0x8cdf071e..., status=active', asserting the lock is active after persistence. However, the DB query result shows the most recent lock has status=pending, and the backend sequence response also contains '"status": "pending"'. Either the frontend test is querying a stale/different row and passing incorrectly (a ghost-pass), or the API is returning 'active' in the explorer endpoint while the canonical DB state is 'pending'. In both cases this represents a silent inconsistency: the frontend test passes while the actual state does not match what it claims to verify. This could mask a broken state-transition where locks never advance from pending to active on L1 confirmation.
- **[high] l1_tx_hash is NULL (l1_submitted=false) — lock never anchored to L1 Vault, but all layers report pass** (_bug-hunter_) — The DB layer explicitly queries 'l1_tx_hash IS NOT NULL AS l1_submitted' and returns 'f'. This means the lock exists in the database in 'pending' state with no corresponding L1 transaction hash. The Consumer Lock sequence (§1) requires that a lock be submitted to the L1 Vault contract. The L1 layer's cast call returns a non-zero totalLocked() value, but there is no before/after delta measurement, so it is impossible to confirm the test's lock contributed to that total — the 1.2e17 wei could be entirely from prior state. All four layers individually report pass, creating a false green: the lock exists only in the DB but has not been anchored on-chain, which is the core security guarantee of Quantum Shield's Consumer Lock sequence.
- **[medium] L1 totalLocked() checked without before/after delta — L1 layer pass is uninformative** (_bug-hunter_) — The L1 layer test only calls totalLocked() once and checks it is greater than zero (120000000000000000 wei). It does not record the value before the test run and compare after, so it cannot confirm that the lock created during this sequence run contributed to the on-chain total at all. Given that l1_submitted=false in the DB, the L1 'pass' is vacuously true and masks the absence of an actual on-chain lock for this sequence. This is a test-coverage gap that allows regressions in the L1 submission path to go undetected.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — No prior green run exists for sequence 'Consumer Lock' (SEQUENCES.md §1). This run's results (backend: pass 841ms, frontend: pass 36519ms, db: pass 264ms, l1: pass 377ms) will serve as the baseline for future regression comparisons.
- **[info] Recording first baseline** (_performance-monitor_) — Baseline metrics null. Storing current run as reference: backend=841ms, frontend=36519ms, db=264ms, l1=377ms. Total orchestrator cost=$0.022011.

## Fixer proposals (Stage 4)

- **[high] P1: Investigation required — lock never transitions from pending to active and l1_tx_hash is never written** — files: src/api/api/src/routes/, src/frontend/web/tests/lock.integration.spec.ts, src/api/api/src/
- **[medium] P2: Investigation required — frontend lock status assertion reads wrong row or wrong field** — files: src/frontend/web/tests/lock.integration.spec.ts
- **[medium] P3: Investigation required — add before/after delta check to L1 layer test to make it non-vacuous** — files: src/contracts/l1/

## Acceptance criteria (from Stage 1 plan)

- Backend integration test (seq1_lock) exits with code 0 and output confirms SR_0 computation and L1 lockWithSR0 submission — no skips or fallbacks
- Playwright lock.integration.spec.ts exits with code 0 and all test cases report status: 'passed' in JSON output
- A locks row exists in the DB created within the last 5 minutes with status in {pending, locked, confirmed}, pk_dilithium length exactly equal to 1952 bytes, and l1_tx_hash IS NOT NULL
- Sepolia Vault totalLocked() returns a value strictly greater than 0 wei
- No silent fallback or hardcoded address appears anywhere in the execution trace across all layers

---
_Generated by quantum-shield-e2e-orchestrator_
