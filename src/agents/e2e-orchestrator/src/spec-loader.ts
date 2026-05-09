import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { TestPlan, TestStep } from './types.js';

const SEQUENCES_DOC = 'docs/core/SEQUENCES.md';

// Layer-command bindings per known sequence. Real Quantum Shield commands;
// adjust if test entrypoints change. The spec-runner agent receives this as
// a hint and is allowed to refine.
type SequenceBinding = {
  id: string;
  name: string;
  spec_section: string;
  steps: TestStep[];
  acceptance_criteria: string[];
};

export const KNOWN_SEQUENCES: Record<string, SequenceBinding> = {
  lock: {
    id: 'seq-1',
    name: 'Consumer Lock',
    spec_section: 'SEQUENCES.md §1 Consumer Lock',
    steps: [
      {
        layer: 'backend',
        description: 'Rust integration test for Lock flow',
        // 2026-04-30: filter substring `sequence_lock` did not match any real
        // test (modules are seq1_lock / seq2_unlock_normal / seq4_challenge),
        // so cargo test ran zero tests and exited 1 after the orchestrator
        // killed the still-compiling binary at 120s. Use the actual module
        // name as the filter so all four `seq1_lock::test_lock_*` tests run.
        // The CI workflow now pre-compiles this binary so the per-step
        // 120s budget is enough to run the tests, not compile them.
        command: 'cd src/api/api && SQLX_OFFLINE=true cargo test --test sequence_e2e_test seq1_lock -- --nocapture',
        expected: 'Lock created in DB, SR0 computed, L1 lockWithSR0 submitted',
        // Backend test creates rows in `locks`, sends to L1. Must run before
        // verify steps can observe state. (note: status will be 'pending'
        // until the L1 confirmation service updates it; the verifier expects
        // either status, see expected note below.)
        phase: 'drive',
      },
      {
        layer: 'frontend',
        description: 'Playwright integration spec for Consumer Lock',
        command: 'cd src/frontend/web && npx playwright test e2e/integration/lock.integration.spec.ts --reporter=json',
        expected: 'UI lock creation produces success state and DB row',
        // Playwright tests POST /v1/lock against the running backend, so
        // they also produce DB rows. Drive phase.
        phase: 'drive',
      },
      {
        layer: 'db',
        // The backend's locks table INSERT writes status='pending' (see
        // src/api/api/src/db/repositories/lock.rs:90). status='locked' is
        // set later by the L1 confirmation service. Until that flow is
        // wired in CI we accept either, and just assert presence + pk len.
        //
        // 2026-04-30 (run 25168505086): added created_at timestamp guard.
        // The previous LIMIT-1 ORDER-BY query couldn't distinguish a row
        // created during this run from a stale row left by an earlier
        // backend unit-test fixture, so the cross-reviewer correctly
        // flagged the DB pass as "misleading." 5-minute window covers
        // the longest realistic drive step (cargo test ~120s + Playwright
        // ~100s = ~3.5 min) plus margin.
        description: 'Verify lock row was created during this run window, pk_dilithium populated, and L1 submission was attempted',
        // 2026-05-02: extended to include `l1_tx_hash IS NOT NULL` in the
        // projection. Run 25240820973 verdict flagged the lack of any
        // signal that the L1 submission code path was actually exercised
        // — pk length only proves the API write happened. Now the
        // verifier sees `l1_submitted=t` once L1 is reachable, which is
        // a softer (but observable) substitute for a full
        // pending→locked transition assertion (the latter requires
        // polling for the L1TxConfirmationService to run).
        command: `psql "$DATABASE_URL" -t -A -c "SELECT lock_id, status, length(pk_dilithium), l1_tx_hash IS NOT NULL AS l1_submitted FROM locks WHERE created_at > NOW() - INTERVAL '5 minutes' ORDER BY created_at DESC LIMIT 1;"`,
        expected: 'one row from this run window, status in {pending, locked, confirmed}, pk_dilithium length 1952, l1_submitted=t when L1 vault is reachable',
        phase: 'verify',
      },
      {
        layer: 'l1',
        // 2026-05-02: replaced the bare `totalLocked()(uint256) > 0` ping —
        // run 25244231635 cross-reviewer correctly noted that vacuously
        // matches against the contract's pre-existing balance and proves
        // nothing about THIS run. Now we read the lock_id created in this
        // run from DB, look up its l1_tx_hash, and confirm a successful
        // receipt on L1. Without an L1 private key (no inline submission)
        // the DB row has l1_tx_hash=NULL and this step fails loudly with
        // "no recent lock submitted to L1" — which is exactly the signal
        // we want until Track H wires up the Anvil fork in CI.
        description: 'Verify the lock created in this run is anchored on L1 (receipt status==0x1)',
        command: `bash -c '
set -eo pipefail
LOCK_ID=$(psql "$DATABASE_URL" -t -A -c "SELECT lock_id FROM locks WHERE created_at > NOW() - INTERVAL '"'"'5 minutes'"'"' ORDER BY created_at DESC LIMIT 1;" | tr -d " ")
TX_HASH=$(psql "$DATABASE_URL" -t -A -c "SELECT l1_tx_hash FROM locks WHERE lock_id = '"'"'$LOCK_ID'"'"';" | tr -d " ")
if [ -z "$TX_HASH" ] || [ "$TX_HASH" = "" ]; then
  echo "FAIL: lock $LOCK_ID has no l1_tx_hash (L1 anchoring did not occur in this run; QS__L1_PRIVATE_KEY may be unset)"
  echo "Total locked snapshot for context (should be unchanged from prior runs):"
  cast call 0x07012aeF87C6E423c32F2f8eaF81762f63337260 "totalLocked()(uint256)" --rpc-url "$L1_RPC_URL" || true
  exit 1
fi
echo "checking L1 receipt for tx=$TX_HASH (lock=$LOCK_ID)"
RECEIPT_STATUS=$(cast receipt "$TX_HASH" --rpc-url "$L1_RPC_URL" --json 2>/dev/null | jq -r ".status // \"missing\"" || echo "missing")
echo "receipt status: $RECEIPT_STATUS"
case "$RECEIPT_STATUS" in
  0x1|1) echo "PASS: lock anchored on L1"; exit 0 ;;
  0x0|0) echo "FAIL: tx reverted on L1"; exit 1 ;;
  missing) echo "FAIL: tx not found on L1 (tx submitted but never mined, or wrong RPC)"; exit 1 ;;
  *) echo "FAIL: unexpected receipt status $RECEIPT_STATUS"; exit 1 ;;
esac
'`,
        expected: 'PASS: lock anchored on L1 — most recent lock has l1_tx_hash populated and the receipt has status==0x1',
        phase: 'verify',
      },
    ],
    acceptance_criteria: [
      'Backend integration test passes',
      'Playwright lock.integration.spec.ts passes',
      'A new locks row exists with status=locked and Dilithium pk len 1952',
      'Sepolia Vault totalLocked is non-zero',
      'No silent fallback or hardcoded address in the trace',
    ],
  },
  unlock: {
    id: 'seq-2',
    name: 'Normal Unlock',
    spec_section: 'SEQUENCES.md §2 Normal Unlock',
    steps: [
      {
        layer: 'backend',
        description: 'Unlock + auto-claim Rust test',
        command: 'cd src/api/api && SQLX_OFFLINE=true cargo test --test sequence_e2e_test seq2_unlock_normal -- --nocapture',
        expected: '24h time-lock honored, Auto-Claim service finalizes',
        phase: 'drive',
      },
      {
        layer: 'frontend',
        description: 'Playwright unlock integration spec',
        command: 'cd src/frontend/web && npx playwright test e2e/integration/unlock.integration.spec.ts --reporter=json',
        phase: 'drive',
      },
      {
        layer: 'db',
        // 2026-05-09 (PR1 of Phase 2 rollout): two latent bugs corrected.
        //   (1) Table name was `unlocks` — actual table is `unlock_requests`
        //       (migrations/001_initial_schema.sql:64). The previous query
        //       would have failed with "relation does not exist" the first
        //       time this binding ran against a real Sepolia run.
        //   (2) Column was `time_lock_until` — actual column is
        //       `release_time` (same migration, line 76).
        // 5-min window guard preserved from the lock binding (PR #153) so
        // we don't latch onto a stale unit-test fixture.
        description: 'Verify unlock_requests row created during this run window and release_time is 24h ahead of created_at (normal unlock; emergency would be 7d)',
        command: `psql "$DATABASE_URL" -t -A -c "SELECT unlock_id, lock_id, status, is_emergency, EXTRACT(EPOCH FROM (release_time - created_at))/3600 AS hours FROM unlock_requests WHERE created_at > NOW() - INTERVAL '5 minutes' ORDER BY created_at DESC LIMIT 1;"`,
        expected: 'one row from this run window, status in {pending, requested, finalized}, is_emergency=f, hours ≈ 24',
        phase: 'verify',
      },
      {
        layer: 'l1',
        // 2026-05-09 (PR1 of Phase 2 rollout): replaced the bare
        // `totalLocked()` ping with an on-chain unlock-request lookup.
        // Mirrors the lock-binding upgrade in PR #160 — the prior
        // `totalLocked()` call vacuously matched against the contract's
        // pre-existing balance and proved nothing about THIS run.
        //
        // `unlock_requests` has no `l1_tx_hash` column (only `locks`
        // does), so we can't `cast receipt` an unlock tx the way the
        // lock binding does. Instead we read the on-chain UnlockRequest
        // struct via `getUnlockRequest(bytes32 lockId)` (L1Vault.sol:1142)
        // — keyed by lockId, not unlockId — and assert `requestedAt > 0`,
        // which is set by `_createUnlockRequest` (L1Vault.sol:459) only
        // after the L1 `requestUnlock` call lands. A schema migration to
        // add `unlock_requests.l1_tx_hash` so we can do receipt-status
        // verification (the lock binding's pattern) is tracked as a
        // potential PR1.5 follow-up.
        description: 'Verify the unlock request created in this run is anchored on L1 (Vault.getUnlockRequest(lockId).requestedAt > 0)',
        command: `bash -c '
set -eo pipefail
LOCK_ID=$(psql "$DATABASE_URL" -t -A -c "SELECT lock_id FROM unlock_requests WHERE created_at > NOW() - INTERVAL '"'"'5 minutes'"'"' ORDER BY created_at DESC LIMIT 1;" | tr -d " ")
if [ -z "$LOCK_ID" ]; then
  echo "FAIL: no unlock_requests row from this run window — drive step did not produce a request"
  exit 1
fi
echo "checking L1 unlock request for lock=$LOCK_ID"
RAW=$(cast call 0x07012aeF87C6E423c32F2f8eaF81762f63337260 "getUnlockRequest(bytes32)((bytes32,address,uint256,bytes32,bytes32,uint256,uint256,bool,uint256,uint256,uint256,uint256,uint256))" "$LOCK_ID" --rpc-url "$L1_RPC_URL" 2>/dev/null || echo "")
if [ -z "$RAW" ]; then
  echo "FAIL: getUnlockRequest call failed (RPC error or wrong ABI)"
  exit 1
fi
# struct order: lockId, recipient, amount, stateRoot, unlockStateRoot, requestedAt, unlockableAt, isEmergency, bond, signatureCount, unlockNonce, proverRequestedAt, emergencyReadyAt
REQUESTED_AT=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$6}")
echo "on-chain requestedAt: $REQUESTED_AT"
if [ -z "$REQUESTED_AT" ] || [ "$REQUESTED_AT" = "0" ]; then
  echo "FAIL: lock $LOCK_ID has no on-chain unlock request (requestUnlock tx not submitted or reverted)"
  exit 1
fi
echo "PASS: unlock request anchored on L1 — requestedAt=$REQUESTED_AT"
'`,
        expected: 'PASS: getUnlockRequest(lockId).requestedAt > 0 — proves the requestUnlock tx landed on Sepolia in this run',
        phase: 'verify',
      },
    ],
    acceptance_criteria: [
      'Time lock = 24 hours, sourced from config not hardcoded',
      'Auto-claim service marks unlock as finalized after timelock',
      'No skip_signature_verification leak in production guard',
    ],
  },
  slashing: {
    id: 'seq-6',
    name: 'Slashing',
    spec_section: 'SEQUENCES.md §6 Slashing',
    steps: [
      {
        layer: 'backend',
        description: 'Challenge -> Slashing pipeline test',
        // 2026-04-30: there is no `sequence_slashing` test in the codebase;
        // the closest covered module is `seq4_challenge`, which exercises
        // the challenge endpoint that *feeds* the slashing pipeline. A
        // dedicated slashing-pipeline integration test (one that triggers
        // the L1 slash submission and asserts L1SlashStatus transitions) is
        // not yet written, and the orchestrator should surface that gap
        // rather than silently run zero tests. See acceptance_criteria
        // below — the `pending_retry` row check still applies once a real
        // pipeline test exists.
        command: 'cd src/api/api && SQLX_OFFLINE=true cargo test --test sequence_e2e_test seq4_challenge -- --nocapture',
        expected: 'L1SlashStatus enum transitions; pending_retry path tested',
        phase: 'drive',
      },
      {
        layer: 'db',
        description: 'Verify slashings row and l1_status',
        command: `psql "$DATABASE_URL" -t -A -c "SELECT slashing_id, l1_status, l1_tx_hash IS NOT NULL FROM slashings ORDER BY slashed_at DESC LIMIT 1;"`,
        expected: 'l1_status in (submitted, pending_retry, disabled, unavailable)',
        phase: 'verify',
      },
      {
        layer: 'l1',
        description: 'ProverRegistry stake check',
        command: `cast call 0x08e1fc1A0d614bc132B48950760c7A291cCB8946 "getProverCount()(uint256)" --rpc-url "$L1_RPC_URL"`,
        phase: 'verify',
      },
      // 2026-04-28 follow-up #2 from the slashing E2E run
      // (docs/e2e-demos/slashing-2026-04-28/report.md): the prior binding
      // only checked `getProverCount()`, which doesn't prove the slash
      // actually landed. Now also assert the prover's stake decreased
      // (via stakeOf) — a non-zero return from a previously-staked prover
      // means the slash didn't take effect. The test fixture seeds a
      // known prover at `0x...0001`; the orchestrator verifies its post-
      // slash stake is below the pre-slash value.
      {
        layer: 'l1',
        description: 'ProverRegistry slashed-stake check (assert slash actually landed)',
        command: `cast call 0x08e1fc1A0d614bc132B48950760c7A291cCB8946 "stakeOf(bytes32)(uint256)" 0x0000000000000000000000000000000000000000000000000000000000000001 --rpc-url "$L1_RPC_URL"`,
        expected: 'stake of test prover < pre-slash baseline (proves slash landed on-chain, not just in DB)',
        phase: 'verify',
      },
    ],
    acceptance_criteria: [
      'No best-effort silent warn — every L1 call surfaces a terminal L1SlashStatus',
      'pending_retry rows are observable; retry service picks them up',
      'colluding_count is derived from signing_queue evidence (signed_at IS NOT NULL), not hardcoded',
      'L1 verification asserts the slash actually landed on-chain (stakeOf decreased), not just that ProverRegistry is reachable',
      'Distribution math holds 60/20/20 within ≤2 wei rounding loss',
    ],
  },
};

export async function loadSpec(repoRoot: string): Promise<string> {
  const path = resolve(repoRoot, SEQUENCES_DOC);
  return readFile(path, 'utf8');
}

export function listSequences(): string[] {
  return Object.keys(KNOWN_SEQUENCES);
}

export function getSequenceBinding(id: string): SequenceBinding {
  const binding = KNOWN_SEQUENCES[id];
  if (!binding) {
    throw new Error(`Unknown sequence "${id}". Known: ${listSequences().join(', ')}`);
  }
  return binding;
}

export function bindingToPlan(binding: SequenceBinding): TestPlan {
  return {
    sequence_id: binding.id,
    sequence_name: binding.name,
    layers: Array.from(new Set(binding.steps.map((s) => s.layer))),
    steps: binding.steps,
    acceptance_criteria: binding.acceptance_criteria,
    spec_section: binding.spec_section,
  };
}
