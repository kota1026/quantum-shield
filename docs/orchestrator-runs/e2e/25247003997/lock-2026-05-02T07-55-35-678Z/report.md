# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-05-02T07:55:35.678Z
**Finished**: 2026-05-02T07:57:25.384Z
**Duration**: 109.7s
**Plan source**: ai 
**Cost**: $0.2589 (input 76203, cached 0, output 5464)

## Verdict: BLOCKED

> The Consumer Lock sequence has a critical cross-layer silent-failure: the backend and frontend layers both exit 0 and the DB row is created with valid pk_dilithium (1952 bytes), but l1_tx_hash is NULL because the L1 anchor was never submitted — most likely due to QS__L1_PRIVATE_KEY being absent from the environment. The failure is architectural: the lock creation API commits the DB row and returns a success response even when L1 submission is impossible, making unanchored locks indistinguishable from valid ones in the Explorer UI (totalLocks incremented 32→33 for an orphan lock). No fixer proposals were received for evaluation, and the root cause touches the core lock-creation control flow and potentially L1 submission code under src/contracts/l1/, both of which require human review before any auto-apply.

- **Confidence**: 0.65
- **Fixer recommendation**: review_required
- **Must fix before merge**:
- L1 anchor submission silently no-ops when QS__L1_PRIVATE_KEY is absent — lock creation must hard-fail or service must refuse to start without signing key
- Lock creation API returns HTTP 200 and commits DB row before L1 anchor is confirmed — either make L1 submission synchronous-and-required or gate the success response on anchor submission
- Orphaned locks (l1_tx_hash IS NULL, status=pending) are surfaced as valid locks in Explorer and totalLocks counter — add distinct status (e.g. anchor_failed/unanchored) and filter from healthy counts
- No application-level error log or alarm raised when L1 submission is skipped — add startup key-presence check and submission-failure alerting in backend
- **Unresolved questions**:
- Is QS__L1_PRIVATE_KEY genuinely absent in this CI environment (infra misconfiguration) or does the backend code contain an unconditional Ok(()) / warn-and-continue path that would silently skip L1 even when the key is present under certain error conditions?
- Does the lock creation handler spawn L1 submission as a background/fire-and-forget task (explaining why backend exits 0 while L1 never fires), and if so, is there any mechanism to roll back or invalidate the DB row on anchor failure?
- The fixer_proposals field contains no actual patches — it is unclear whether a fixer agent ran and produced no proposals, or whether proposals are pending; verdict cannot be downgraded to FIXABLE without reviewed patches.

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | pass | 0 | 821ms | 0.95 | 1 |
| frontend | pass | 0 | 34816ms | 0.99 | 0 |
| db | pass | 0 | 252ms | 0.95 | 1 |
| l1 | fail | 1 | 864ms | 0.95 | 2 |

## Quality findings (Stage 3)

Counts by severity: critical=2, high=1, info=2

- **[critical] L1 anchoring silently skipped — lock exists in DB with no l1_tx_hash, sequence completes with exit 0 on all non-L1 layers** (_bug-hunter_) — The Consumer Lock sequence produces a fully-formed DB row (status=pending, pk_dilithium=1952 bytes) and the backend+frontend layers both exit 0, creating a false impression of success. The L1 layer reveals the anchor was never submitted: l1_tx_hash IS NULL. The L1 script itself diagnoses the likely cause as 'QS__L1_PRIVATE_KEY may be unset', meaning the submission path silently short-circuits when the key is absent rather than hard-failing the lock creation. This matches silent-failure pattern #5 (Ok(()) swallowing background task errors) and pattern #13 (best-effort L1 calls that warn-and-continue on failure). A lock that is never anchored on L1 is not a valid Quantum Shield lock — it cannot be settled, slashed, or verified — yet it is indistinguishable from a valid lock to the consumer and the Explorer UI (which confirmed totalLocks incremented). The vault's totalLocked() returns 120000000000000000 wei unchanged, confirming no value moved on-chain.
- **[critical] Lock creation API returns 200 and increments Explorer totalLocks when L1 anchor has not been submitted — consumer cannot distinguish valid from orphan locks** (_bug-hunter_) — The Explorer endpoint GET /v1/explorer/locks and the totalLocks counter both reflect the new lock (frontend test confirms 'totalLocks: 32 -> 33'), and the lock status is 'pending' rather than an error state. Because L1 anchoring is a post-condition of a valid lock, a lock that exists only in the DB with status=pending and a NULL l1_tx_hash should either (a) not be created at all until L1 submission succeeds, or (b) be placed in a distinct 'anchor_failed' / 'unanchored' status that the API and Explorer surface differently. As it stands, consumers who query GET /v1/explorer/locks or check the returned lock_id+SR_0 have no way to know the lock was never anchored. This is a cross-layer silent failure: backend passes, frontend passes, DB passes, L1 fails — but the system presents a unified green face to all consumers.
- **[high] QS__L1_PRIVATE_KEY absence causes silent no-op in anchor submission rather than hard failure at lock creation time** (_bug-hunter_) — The L1 script explicitly hypothesises 'QS__L1_PRIVATE_KEY may be unset'. If the private key env-var is absent and the code path silently skips L1 submission (returning Ok(()) or equivalent), this is a deployment misconfiguration that goes completely undetected at the API layer — the lock endpoint returns a success response, the DB row is committed, and no alarm is raised. The correct behaviour is to reject the lock creation request (or at minimum refuse to start the service) when the signing key required for L1 submission is absent. This is a regression risk for the pattern described in item #5 of the silent-failure history.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — No prior green run exists for sequence 'Consumer Lock' (SEQUENCES.md §1). This run has failing layers (l1, db) so it will NOT become the baseline. A green run requires all layers to pass before a baseline is recorded.
- **[info] Recording first baseline** (_performance-monitor_) — seq-1 baseline established: backend 821ms, frontend 34816ms, db 252ms, l1 864ms; total orchestrator cost $0.0237

## Fixer proposals (Stage 4)

- **[high] P1: Fail lock creation at startup/request time when QS__L1_PRIVATE_KEY is absent** — files: src/api/api/src/main.rs, src/api/api/src/config.rs, src/api/api/src/routes/locks.rs, src/api/api/src/l1/mod.rs
- **[high] P2: Introduce 'unanchored' lock status and reject 200 responses for locks with NULL l1_tx_hash** — files: src/api/api/src/routes/locks.rs, src/api/api/src/db/migrations/, src/api/api/src/models/lock.rs, src/frontend/web/src/components/ExplorerLockList.tsx
- **[high] P3: Investigation required — locate and eliminate Ok(())-swallowing in L1 anchor submission path** — files: src/api/api/src/l1/mod.rs, src/api/api/src/routes/locks.rs, src/api/api/src/services/anchor.rs
- **[medium] P4: Add service-startup environment variable validation with hard exit on missing L1 key** — files: src/api/api/src/main.rs, src/api/api/src/config.rs
- **[low] P5: Add integration test asserting lock creation returns 4xx/5xx when L1 submission fails** — files: src/api/api/tests/integration/locks_l1_anchor_test.rs

## Acceptance criteria (from Stage 1 plan)

- Backend integration test (seq1_lock) exits 0 with stdout confirming SR_0 computation and L1 submission
- Playwright lock.integration.spec.ts exits 0 with zero failed tests in the JSON report
- A locks row created within the last 5 minutes exists with status in {pending, locked, confirmed}, length(pk_dilithium) == 1952, and l1_tx_hash IS NOT NULL
- The L1 transaction referenced by l1_tx_hash has receipt status == 0x1 on Sepolia — a reverted or missing receipt is a hard failure
- L1 Vault totalLocked is non-zero after the lock is anchored, confirming assets are held by the Vault
- No silent fallback or hardcoded address appears in any layer's execution trace

---
_Generated by quantum-shield-e2e-orchestrator_
