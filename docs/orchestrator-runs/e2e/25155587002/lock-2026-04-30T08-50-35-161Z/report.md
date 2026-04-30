# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-04-30T08:50:35.161Z
**Finished**: 2026-04-30T08:53:34.635Z
**Duration**: 179.5s
**Plan source**: ai 
**Cost**: $0.3509 (input 93110, cached 0, output 8853)

## Verdict: BLOCKED

> The Consumer Lock sequence has two critical cryptographic failures that together eliminate all post-quantum security guarantees: (1) the lock endpoint accepts requests carrying invalid Dilithium signatures and returns HTTP 200 instead of rejecting them, and (2) the Dilithium public key is stored as only 32 bytes instead of the required 1952 bytes, indicating the key is being truncated or hashed before persistence. These are not test harness issues — the production endpoint is provably bypassing signature enforcement, and the stored key material is not a valid Dilithium key. Additionally, the DB layer agent reports pk_dilithium length=32 while the spec mandates exactly 1952 bytes, and the L1 RPC is unreachable (HTTP 522) making on-chain state unverifiable; the frontend passing all 40 tests provides no cover because it never exercised the invalid-signature code path. No fixer proposals were received, so auto-apply is not possible; human review and production-safe fixes are required before merge.

- **Confidence**: 0.45
- **Fixer recommendation**: reject
- **Must fix before merge**:
- Signature validation bypassed: lock endpoint accepts invalid Dilithium signatures with HTTP 200 — enforce signature verification before any state mutation
- Dilithium public key truncated to 32 bytes: pk_dilithium must be stored as full 1952-byte Dilithium3 key — identify and fix the write path (likely hex_to_bytes32_or_zero truncation)
- DB acceptance criterion violated: pk_dilithium length must equal exactly 1952 bytes per spec and acceptance criteria
- status inconsistency between DB layer ('pending') and explorer API ('active') for freshly created locks — clarify canonical state machine and fix the inconsistent field
- Six test locations use unwrap_or_default() on response JSON and discard the body variable — replace with explicit assertions to prevent silent parse-error masking
- L1 RPC endpoint (rpc.sepolia.org) returning HTTP 522: rerun L1 verification against a healthy RPC endpoint to confirm on-chain totalLocked > 0 and lockWithSR0 submission
- **Unresolved questions**:
- Is pk_dilithium being truncated to 32 bytes by a hex_to_bytes32_or_zero call, or is it storing only a commitment/hash of the key? The code path must be audited to determine the exact write site.
- Does the lock endpoint have any signature validation code that is conditionally compiled out, feature-flagged off, or short-circuited by a middleware bypass? The HTTP 200 response to an invalid signature suggests validation is either absent or skipped entirely.
- The DB layer reports the most recent lock as status='pending' while the frontend explorer API reports a different lock_id (created in the same run) as status='active': is 'active' a legitimate initial state for some code path, or is the explorer reading a stale/cached/derived field? This must be resolved against SEQUENCES.md §1.
- The L1 layer queried address 0x07012aeF87C6E423c32F2f8eaF81762f63337260 but the canonical Vault address per the spec and acceptance criteria is 0x6F889C00a5e674ab0b9403AfBa0fBEbe30511c67 — these differ; the test plan's L1 step and the spec address must be reconciled before the L1 verification can be considered valid.
- No fixer proposals were received ('awaiting parallel fixer output'): are fixes in progress, and if so, do any touch src/contracts/l1/ or migrations?

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | fail | 101 | 829ms | 0.95 | 3 |
| frontend | pass | 0 | 33862ms | 0.99 | 0 |
| db | pass | 0 | 316ms | 0.98 | 1 |
| l1 | fail | 1 | 39553ms | 0.95 | 1 |

## Quality findings (Stage 3)

Counts by severity: critical=2, high=2, medium=1, info=2

- **[critical] Signature validation completely bypassed — invalid signatures accepted with HTTP 200** (_bug-hunter_) — The lock endpoint accepts requests carrying an invalid Dilithium signature and returns HTTP 200 OK instead of rejecting them. This is not merely a test assertion failure: it means any attacker can submit a lock request with a forged or malformed signature and the backend will process it as legitimate. The backend layer test panicked with 'Invalid signature should be rejected, got 200' (line 218), and the frontend layer tests all passed — meaning the frontend integration tests never exercised the invalid-signature path, leaving the production endpoint silently open. This violates the core Quantum Shield protocol invariant that every lock must carry a valid post-quantum signature before state is mutated.
- **[critical] Dilithium public key stored as 32 bytes instead of 1952 bytes — cryptographic key truncated** (_bug-hunter_) — The DB layer query returned `length(pk_dilithium) = 32` for the most recently created lock. The standard Dilithium2 public key is 1312 bytes; Dilithium3 is 1952 bytes; neither is 32 bytes. 32 bytes is the size of a SHA-256 hash or a bytes32 field — strongly suggesting the code is either (a) storing only a hash/commitment of the key rather than the key itself, (b) calling `hex_to_bytes32_or_zero` (silent-failure pattern #4) and truncating the key to a 32-byte zero-padded value, or (c) writing to the wrong column. Because the signature validation endpoint already fails to reject invalid signatures (finding above), and the stored public key is not a valid Dilithium key, the system cannot perform any real post-quantum verification at any layer. The combination of these two bugs means the entire cryptographic security guarantee of the Consumer Lock flow is absent.
- **[high] DB status recorded as 'pending' but frontend explorer shows lock as 'active' — state inconsistency** (_bug-hunter_) — The DB layer query against the most recent lock row returns `status = pending`. However, the frontend integration test for 'lock is persisted in DB and visible via GET /v1/explorer/locks' logs '[Lock Persisted] lock_id=..., status=active'. These are different rows (different lock_ids), but both were created during the same test run without any intervening release/confirmation step. If the explorer endpoint is reading a derived or cached status field rather than the canonical DB column, or if the status transition logic promotes some locks to 'active' and not others non-deterministically, this is a silent data-consistency failure. The spec (SEQUENCES.md §1) must clarify whether newly created locks are 'pending' or 'active'; if 'pending' is correct, the explorer API is returning stale/wrong state.
- **[high] unwrap_or_default() on response JSON silently swallows parse errors in 6 test locations** (_bug-hunter_) — Six locations in sequence_e2e_test.rs use the pattern `let body: Value = resp.json().await.unwrap_or_default()` and then never use `body`. This matches silent-failure pattern #3 from the high-priority regression list. If the server returns a non-JSON body (e.g., an HTML error page, a 500 with plain text, or a truncated response), `unwrap_or_default()` silently substitutes `Value::Null` and the test continues without ever inspecting the response body. Tests that should catch malformed server responses will pass green while the server is broken. The `body` variable being unused (compiler warnings at lines 671, 1217, 1235, 1479, 1499, 1517) compounds this: even if parsing succeeded, nothing asserts on the content.
- **[medium] L1 Vault state unverifiable — lock accepted by backend+DB but on-chain totalLocked unconfirmable** (_bug-hunter_) — The L1 layer failed with HTTP 522 (RPC endpoint timeout), so it is impossible to confirm whether the on-chain Vault at 0x07012aeF87C6E423c32F2f8eaF81762f63337260 actually recorded the lock. The frontend reported 'totalLocks: 33 -> 34', but this counter is served by the backend/explorer, not read directly from the chain. If the backend increments an off-chain counter independently of the on-chain call (or if the on-chain call is fire-and-forget with `Ok(())` swallowing errors — silent-failure pattern #5), the UI can show a successful lock increment while the Vault state never moved. The RPC failure prevents ruling this out for this run.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — No prior green run exists for sequence 'Consumer Lock' (SEQUENCES.md §1). This run is not green (backend layer failed due to signature validation bug, db layer shows dilithium key truncation, l1 layer has RPC connectivity failure). No baseline will be recorded until a fully passing run is achieved.
- **[info] Recording first baseline** (_performance-monitor_) — No baseline exists for seq-1. Current metrics recorded: backend 829ms, frontend 33862ms, db 316ms, l1 39553ms. Total orchestrator cost $0.029 USD.

## Fixer proposals (Stage 4)

- **[high] P1: Enforce Dilithium signature validation in the lock endpoint** — files: src/api/api/src/routes/locks.rs
- **[high] P2: Store the full Dilithium public key instead of a 32-byte hash** — files: src/api/api/src/db/locks.rs, src/api/api/src/models/lock.rs
- **[low] P3: Fix unwrap_or_default() on response JSON in tests — propagate parse errors** — files: src/api/api/tests/sequence_e2e_test.rs
- **[high] P4: Investigation required — DB status 'pending' vs explorer 'active' state inconsistency** — files: 
- **[high] P5: Investigation required — L1 on-chain lock confirmation not verifiable due to fire-and-forget RPC call** — files: 

## Acceptance criteria (from Stage 1 plan)

- Backend integration test (seq1_lock) exits with code 0 and stdout confirms SR_0 was computed and lockWithSR0 was submitted to L1
- Playwright lock.integration.spec.ts reports 0 failed tests and the UI lock creation flow reaches a success state
- The most recent row in the locks table has status equal to 'locked' or 'pending' — not null, not error
- The most recent row in the locks table has length(pk_dilithium) equal to exactly 1952 bytes
- cast call to Sepolia Vault totalLocked() returns a value strictly greater than 0 wei
- No hardcoded bypass, stub response, or silent fallback is present in the backend trace — the Dilithium signature must be verified and nonce must be checked before lock_id is issued
- The L1 Vault address used in all steps resolves to 0x6F889C00a5e674ab0b9403AfBa0fBEbe30511c67 (canonical Sepolia deployment per SEQUENCES.md §Architecture)

---
_Generated by quantum-shield-e2e-orchestrator_
