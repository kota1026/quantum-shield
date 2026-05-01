# E2E Orchestrator Run Report

**Sequence**: seq-1
**Started**: 2026-05-01T08:24:04.696Z
**Finished**: 2026-05-01T08:26:28.170Z
**Duration**: 143.5s
**Plan source**: ai 
**Cost**: $0.3176 (input 94875, cached 0, output 6313)

## Verdict: FIXABLE

> The Consumer Lock sequence has two concrete failures: (1) the frontend Playwright spec crashes at import time because the installed @noble/post-quantum package does not export the './ml-dsa' subpath — zero tests ran, the ML-DSA signature path is entirely unverified by CI; (2) the L1 layer could not call totalLocked() due to an HTTP 522 RPC timeout on rpc.sepolia.org, which is a transient infrastructure outage (override rule 2 applied: downgrading this from a blocking failure to a retriable infra issue). The backend passed cleanly (4/4 tests, SR0 computed, exit 0), and the DB confirms a lock row with status='pending' and pk_dilithium=1952 bytes within the 5-minute window. The frontend package version bug is deterministic and will reproduce every run until corrected; the L1 failure should be retried with a healthy RPC endpoint.

- **Confidence**: 0.65
- **Fixer recommendation**: review_required
- **Must fix before merge**:
- Upgrade or pin @noble/post-quantum to a version that exports './ml-dsa' subpath (≥0.2.0) and commit the updated lockfile — frontend suite is completely dead without this
- Verify and fix ML-DSA-65 signature generation and submission path in the frontend lock flow, which has never been exercised by CI in this run
- Replace all six `let body: Value = resp.json().await.unwrap_or_default()` dead-variable patterns in sequence_e2e_test.rs with actual assertions on the response body to eliminate silent API failure masking
- Retry L1 totalLocked() verification against a healthy Sepolia RPC endpoint to confirm vault balance increased and stranded-pending fix is effective
- Confirm DB lock status transitions from 'pending' to 'locked' after L1 confirmation — stranded-pending fix from the merge commit cannot be validated until L1 RPC is reachable
- **Unresolved questions**:
- What exact version of @noble/post-quantum is currently pinned in package.json and package-lock.json, and why was it not updated when the ml-dsa import was introduced?
- Is the stranded-pending background confirmation task actually fixed, or does it swallow errors silently (Ok(()) pattern)? Cannot confirm from this run because L1 RPC was unreachable.
- Does the API have a skip_signature_verification environment variable or stub path that could accept unsigned/incorrectly-signed lock requests — the frontend signature path has never been validated by CI?

## Layer execution

| Layer | Status | Exit | Duration | Analyzer confidence | Issues |
|---|---|---|---|---|---|
| backend | pass | 0 | 928ms | 0.95 | 2 |
| frontend | fail | 1 | 27694ms | 0.95 | 2 |
| db | pass | 0 | 278ms | 0.92 | 1 |
| l1 | fail | 1 | 39670ms | 0.95 | 1 |

## Quality findings (Stage 3)

Counts by severity: critical=1, high=2, medium=1, info=2

- **[critical] Frontend ML-DSA signature test suite completely dead — real signature verification bypassed in E2E** (_bug-hunter_) — The frontend E2E integration test for the Consumer Lock sequence fails before a single test runs due to `'@noble/post-quantum/ml-dsa'` not being exported by the installed package version. This means the ML-DSA signature that should be constructed and verified as part of the lock flow has NEVER been exercised by CI in this run. The backend passed and the DB row exists with `pk_dilithium` length 1952 — but the cross-layer contract that the frontend actually generates a valid ML-DSA-65 signature over the correct payload, submits it to the API, and the API verifies it, is untested. This is a direct path to silent signature-bypass: if the API's signature verification has a latent bug (e.g. skip_signature_verification env override, or the verification stub pattern from high-priority item #8), it would never be caught here. The 'real ML-DSA' fix referenced in the merge commit subject (`fix(e2e): close 3 follow-on findings … real ML-DSA`) is the exact feature that is now broken.
- **[high] unwrap_or_default() on resp.json() silently masks API response deserialization failures in E2E tests** (_bug-hunter_) — Six locations in the E2E test suite use `let body: Value = resp.json().await.unwrap_or_default()` where the variable `body` is then never read. This matches high-priority silent-failure pattern #3 (`unwrap_or_default()` hiding parse errors). If the API returns a malformed JSON body (e.g. due to an internal error that still produces HTTP 200), the test will silently succeed with an empty `Value::Null` body and assert nothing. In the Consumer Lock sequence this is particularly dangerous: step completions, lock IDs, and status fields returned from the API are never validated against the actual response body in these code paths. The compiler itself flagged all six instances as unused variables.
- **[high] L1 vault state unverifiable — DB shows pending lock but on-chain totalLocked() confirmation is missing** (_bug-hunter_) — The DB layer confirms a lock row exists with status='pending' and pk_dilithium=1952 bytes, but the L1 layer could not execute `totalLocked()` on the correct vault address (0x07012aeF87C6E423c32F2f8eaF81762f63337260) due to RPC timeout. The cross-layer invariant for Consumer Lock requires: DB row created → L1 vault balance increased → status transitions to 'locked'. With L1 unreachable, the full sequence cannot be validated and the lock may be permanently stranded in 'pending'. This is not merely an infra flap — the merge commit explicitly references fixing 'stranded-pending' as one of three regressions, and that fix cannot be verified here. If the background confirmation task swallows errors (`Ok(())` pattern, high-priority item #5), stranded-pending locks would accumulate silently.
- **[medium] @noble/post-quantum package version missing ml-dsa export — wrong package version pinned** (_bug-hunter_) — The installed version of `@noble/post-quantum` in the frontend does not export the `./ml-dsa` subpath. The `@noble/post-quantum` package only added named subpath exports (including `ml-dsa`) in version 0.2.0+. The currently installed version appears to predate this. Since the merge commit claims to have introduced 'real ML-DSA' support, the package was either not upgraded, or was upgraded but `package-lock.json` / the lockfile was not committed correctly. This is a dependency pinning bug, not a transient failure.
- **[info] No baseline — first green run will be recorded as baseline.** (_regression-sentinel_) — No prior green run exists for sequence 'Consumer Lock' (SEQUENCES.md §1). This run cannot be green due to the frontend layer failure and l1 layer failure. Once those are resolved and a fully passing run completes, it will become the baseline for future regression comparisons.
- **[info] Recording first baseline** (_performance-monitor_) — seq-1: backend 928ms, frontend 27694ms, db 278ms, l1 39670ms. Total orchestrator cost: $0.0295. No baseline to compare against.

## Fixer proposals (Stage 4)

- **[medium] P1: Fix @noble/post-quantum package version to expose ml-dsa subpath export** — files: src/frontend/web/package.json, src/frontend/web/package-lock.json
- **[low] P2: Replace silent unwrap_or_default() on response bodies with explicit error propagation in E2E tests** — files: src/api/api/tests/sequence_e2e_test.rs
- **[high] P3: Investigation required — verify stranded-pending lock confirmation task does not swallow errors** — files: 

## Acceptance criteria (from Stage 1 plan)

- Backend integration test (seq1_lock) exits with code 0 and stdout confirms SR0 computed and L1 lockWithSR0 submitted
- Playwright lock.integration.spec.ts reports zero failed tests and the UI lock flow reaches success state
- A locks row exists created within the last 5 minutes with status equal to 'locked' and pk_dilithium length equal to exactly 1952 bytes
- Sepolia Vault totalLocked() returns a value strictly greater than 0 wei
- No silent fallback or hardcoded address appears anywhere in the execution trace

---
_Generated by quantum-shield-e2e-orchestrator_
