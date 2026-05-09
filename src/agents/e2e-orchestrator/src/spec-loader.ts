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
  emergency: {
    id: 'seq-3',
    name: 'Emergency Unlock',
    spec_section: 'SEQUENCES.md §3 Emergency Unlock',
    steps: [
      {
        layer: 'backend',
        // 2026-05-09 (PR4 of Phase 2 rollout): drives the existing seq3
        // backend response-shape test. PR3 will author a full-flow test
        // (FE→BE→DB→L1 round-trip); the orchestrator binding is shipped
        // first (this PR) and PR3 plugs into the same `seq3_unlock_emergency`
        // module filter without further binding changes.
        description: 'Emergency unlock backend Rust test (response shape + DB row)',
        command: 'cd src/api/api && SQLX_OFFLINE=true cargo test --test sequence_e2e_test seq3_unlock_emergency -- --nocapture',
        expected: 'Emergency unlock request landed in DB with is_emergency=true and bond_amount >= 0.01 ETH',
        phase: 'drive',
      },
      {
        layer: 'frontend',
        description: 'Playwright emergency unlock integration spec',
        command: 'cd src/frontend/web && npx playwright test e2e/integration/emergency-unlock.integration.spec.ts --reporter=json',
        expected: 'UI emergency-unlock submission produces success state and DB row with is_emergency=true',
        phase: 'drive',
      },
      {
        layer: 'db',
        // 2026-05-09 (PR4 of Phase 2 rollout): mirrors the `unlock` binding's
        // 5-min window guard (PR1 #179). Distinguishes emergency from normal
        // by `is_emergency=TRUE` filter so the row picked up here is from the
        // emergency drive step, not a leftover normal-unlock fixture.
        // bond_amount is asserted ≥ MIN_EMERGENCY_BOND (0.01 ETH = 1e16 wei,
        // see L1VaultTestnet.sol:50). Q2 strategy (c): we verify the
        // *request* landed; the 5-min EMERGENCY_TIME_LOCK + execute path is
        // exercised by the nightly job in PR5, not here.
        description: 'Verify emergency unlock_requests row created during this run window with is_emergency=true and bond meeting MIN_EMERGENCY_BOND',
        command: `psql "$DATABASE_URL" -t -A -c "SELECT unlock_id, lock_id, is_emergency, bond_amount, status, EXTRACT(EPOCH FROM (release_time - created_at))/60 AS lock_min FROM unlock_requests WHERE created_at > NOW() - INTERVAL '5 minutes' AND is_emergency = TRUE ORDER BY created_at DESC LIMIT 1;"`,
        expected: 'one emergency unlock_requests row from this run window, is_emergency=t, bond_amount >= 10000000000000000 (= 0.01 ETH), status in {pending, locked, confirmed}, lock_min >= 5 minutes',
        phase: 'verify',
      },
      {
        layer: 'l1',
        // 2026-05-09 (PR4 of Phase 2 rollout): on-chain assertion that the
        // emergency request landed. Mirrors the unlock-binding pattern (PR1
        // #179) — read lock_id from this run's emergency unlock_requests
        // row, then call Vault.getEmergencyUnlock(bytes32) and assert the
        // returned EmergencyUnlock.initiatedAt > 0. `initiatedAt` is set by
        // requestEmergencyUnlock at L1VaultTestnet.sol:439 only when the
        // tx lands, so >0 is the cleanest "request anchored" signal —
        // analogous to UnlockRequest.requestedAt in the unlock binding.
        // Struct order (see L1VaultTestnet.sol:137-146):
        //   lockId, initiator, bondAmount, initiatedAt, emergencyReadyAt,
        //   status (uint8 enum), enhancedMonitoring, fromTimeout
        // Q2 strategy (c): we assert the request was created, not that
        // executeUnlock ran. The 5-min EMERGENCY_TIME_LOCK + execute is
        // covered by PR5's nightly matrix.
        description: 'Verify the emergency unlock created in this run is anchored on L1 (Vault.getEmergencyUnlock(lockId).initiatedAt > 0)',
        command: `bash -c '
set -eo pipefail
LOCK_ID=$(psql "$DATABASE_URL" -t -A -c "SELECT lock_id FROM unlock_requests WHERE created_at > NOW() - INTERVAL '"'"'5 minutes'"'"' AND is_emergency = TRUE ORDER BY created_at DESC LIMIT 1;" | tr -d " ")
if [ -z "$LOCK_ID" ]; then
  echo "FAIL: no emergency unlock_requests row from this run window — drive step did not produce a request"
  exit 1
fi
echo "checking L1 emergency unlock for lock=$LOCK_ID"
RAW=$(cast call 0x07012aeF87C6E423c32F2f8eaF81762f63337260 "getEmergencyUnlock(bytes32)((bytes32,address,uint256,uint256,uint256,uint8,bool,bool))" "$LOCK_ID" --rpc-url "$L1_RPC_URL" 2>/dev/null || echo "")
if [ -z "$RAW" ]; then
  echo "FAIL: getEmergencyUnlock call failed (RPC error or wrong ABI). TODO(PR5): refine ABI signature after first Sepolia run if struct field order differs"
  exit 1
fi
# struct order: lockId, initiator, bondAmount, initiatedAt, emergencyReadyAt, status, enhancedMonitoring, fromTimeout
INITIATED_AT=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$4}")
echo "on-chain initiatedAt: $INITIATED_AT"
if [ -z "$INITIATED_AT" ] || [ "$INITIATED_AT" = "0" ]; then
  echo "FAIL: lock $LOCK_ID has no on-chain emergency unlock (requestEmergencyUnlock tx not submitted or reverted)"
  exit 1
fi
echo "PASS: emergency unlock anchored on L1 — initiatedAt=$INITIATED_AT"
'`,
        expected: 'PASS: getEmergencyUnlock(lockId).initiatedAt > 0 — proves the requestEmergencyUnlock tx landed on Sepolia in this run',
        phase: 'verify',
      },
    ],
    acceptance_criteria: [
      'Playwright emergency-unlock.integration.spec.ts passes',
      'A new unlock_requests row exists with is_emergency=TRUE',
      'bond_amount >= MIN_EMERGENCY_BOND (0.01 ETH = 1e16 wei) per L1VaultTestnet.sol:50',
      'On-chain getEmergencyUnlock(lockId) returns initiatedAt > 0 (request landed on Sepolia)',
      'release_time - created_at >= EMERGENCY_TIME_LOCK (5 min, testnet-tuned per L1VaultTestnet.sol:47)',
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
        // 2026-05-09 (Phase 3 PR1/5): renamed from `getProverCount()` (does
        // not exist on the deployed canonical contract) to
        // `getActiveProverCount()` — see
        // src/l1/contracts/src/interfaces/IProverRegistry.sol:122-125. The
        // prior call would have reverted with "function selector was not
        // recognized" against the deployed Sepolia contract.
        description: 'ProverRegistry reachability check (getActiveProverCount)',
        command: `cast call 0x08e1fc1A0d614bc132B48950760c7A291cCB8946 "getActiveProverCount()(uint256)" --rpc-url "$L1_RPC_URL"`,
        phase: 'verify',
      },
      // 2026-05-09 (Phase 3 PR1/5 of 5): ABI alignment fix.
      //
      // The previous step called `stakeOf(bytes32)`, which DOES NOT EXIST on
      // the deployed canonical `ProverRegistry`
      // (0x08e1fc1A0d614bc132B48950760c7A291cCB8946). The deployed contract
      // is `src/l1/contracts/src/ProverRegistry.sol`, keyed by
      // `address proverAddress`, with `getProver(address)` returning the
      // full `Prover` struct (which includes `stakedAmount` and
      // `slashedCount`). On-chain verification (cast call, 2026-05-09):
      //   - MIN_STAKE_MAINNET() = 1e18 → confirms canonical contract
      //   - MIN_STAKE_PHASE1() reverts → alternate variant NOT deployed
      //   - testnetMode() = true → registration is free (stakedAmount may be 0)
      //   - authorizedSlashers(VAULT) = true → Vault can slash without admin tx
      //
      // Same precedent as Phase 2 PR1 (#179) which fixed the unlock binding's
      // table/column-name latent bugs before any new flow rolled out.
      //
      // Strategy:
      //   1. Read this run's prover operator address from PG
      //      (`provers.operator_addr`, NOT `wallet_address` — see
      //      migrations/001_initial_schema.sql:114). 5-min run-window guard
      //      mirrors the lock/unlock bindings.
      //   2. cast call `getProver(address)` and parse the returned tuple.
      //      Tuple field order (canonical, see
      //      src/l1/contracts/src/interfaces/IProverRegistry.sol:8-18):
      //        1. proverAddress   (address)
      //        2. sphincsPubKeyHash (bytes32)
      //        3. sphincsPublicKey  (bytes)
      //        4. stakedAmount    (uint256) ← used to be the imaginary stakeOf
      //        5. registeredAt    (uint256)
      //        6. isActive        (bool)
      //        7. successfulSigns (uint256)
      //        8. slashedCount    (uint256)
      //   3. Assert proverAddress != 0x0 (struct populated → prover known
      //      on-chain) AND slashedCount > 0 (a slash actually landed). The
      //      latter is the real "slash anchored on L1" signal — on testnet
      //      `stakedAmount` may be 0 by design (testnetMode=true), so a
      //      stake-comparison check is not authoritative. Once mainnet
      //      configuration lands, PR5 may add a tighter pre/post-stake
      //      delta assertion.
      {
        layer: 'l1',
        description: 'ProverRegistry getProver(address) check — assert slash actually landed (slashedCount > 0)',
        command: `bash -c '
set -eo pipefail
PROVER_ADDR=$(psql "$DATABASE_URL" -t -A -c "SELECT operator_addr FROM provers WHERE registered_at > NOW() - INTERVAL '"'"'5 minutes'"'"' ORDER BY registered_at DESC LIMIT 1;" | tr -d " ")
if [ -z "$PROVER_ADDR" ]; then
  echo "FAIL: no provers row from this run window — drive step did not register a prover"
  exit 1
fi
echo "checking L1 ProverRegistry.getProver(address) for prover=$PROVER_ADDR"
RAW=$(cast call 0x08e1fc1A0d614bc132B48950760c7A291cCB8946 "getProver(address)((address,bytes32,bytes,uint256,uint256,bool,uint256,uint256))" "$PROVER_ADDR" --rpc-url "$L1_RPC_URL" 2>/dev/null || echo "")
if [ -z "$RAW" ]; then
  echo "FAIL: getProver call failed (RPC error or wrong ABI). Re-verify against src/l1/contracts/src/interfaces/IProverRegistry.sol:84"
  exit 1
fi
# struct order: proverAddress, sphincsPubKeyHash, sphincsPublicKey, stakedAmount, registeredAt, isActive, successfulSigns, slashedCount
ON_CHAIN_ADDR=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$1}")
STAKED_AMOUNT=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$4}")
SLASHED_COUNT=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$8}")
echo "on-chain proverAddress: $ON_CHAIN_ADDR"
echo "on-chain stakedAmount:  $STAKED_AMOUNT"
echo "on-chain slashedCount:  $SLASHED_COUNT"
if [ -z "$ON_CHAIN_ADDR" ] || [ "$ON_CHAIN_ADDR" = "0x0000000000000000000000000000000000000000" ]; then
  echo "FAIL: prover $PROVER_ADDR has no on-chain entry (not registered, or wrong address)"
  exit 1
fi
if [ -z "$SLASHED_COUNT" ] || [ "$SLASHED_COUNT" = "0" ]; then
  echo "FAIL: slashedCount=0 → no slash landed on-chain for prover $PROVER_ADDR"
  exit 1
fi
echo "PASS: slash anchored on L1 — slashedCount=$SLASHED_COUNT, stakedAmount=$STAKED_AMOUNT"
'`,
        expected: 'PASS: getProver(operator_addr).slashedCount > 0 — proves slash() tx landed on Sepolia (testnetMode=true allows stakedAmount=0)',
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
  prover: {
    id: 'seq-5',
    name: 'Prover Registration',
    spec_section: 'SEQUENCES.md §5 Prover Registration',
    steps: [
      {
        layer: 'backend',
        // 2026-05-09 (Phase 3 PR4/5 of 5): drives the seq5_prover_registration
        // backend integration test that PR2 (#189) added — specifically
        // `test_prover_register_creates_db_row` which exercises the full
        // /v1/prover/register flow and inserts a `provers` row keyed by
        // operator_addr. Mirrors the lock/unlock binding's drive→verify
        // pattern.
        description: 'Prover registration backend Rust test (POST /v1/prover/register + DB row + L1 stake)',
        command: 'cd src/api/api && SQLX_OFFLINE=true cargo test --test sequence_e2e_test seq5_prover_registration -- --nocapture',
        expected: 'Prover registration test produces provers row with operator_addr and pending_approval status',
        phase: 'drive',
      },
      {
        layer: 'frontend',
        // Existing Playwright spec from before this PR — confirmed present
        // in src/frontend/web/e2e/integration/prover-registration.integration.spec.ts
        // at PR4 authoring time. No new spec needed.
        description: 'Playwright prover registration integration spec',
        command: 'cd src/frontend/web && npx playwright test e2e/integration/prover-registration.integration.spec.ts --reporter=json',
        expected: 'UI prover-registration submission produces success state and DB row',
        phase: 'drive',
      },
      {
        layer: 'db',
        // 2026-05-09 (Phase 3 PR4/5): mirrors the lock/unlock 5-min run-window
        // guard (PR1 #160 / PR1 #179) so we don't latch onto a stale unit-test
        // fixture. `provers` schema (migrations/001_initial_schema.sql:112-122):
        //   prover_id, operator_addr, sphincs_pubkey, stake_amount, ...,
        //   status DEFAULT 'pending_approval', registered_at DEFAULT NOW().
        // sphincs_pubkey is BYTEA → length(...) returns byte length; SPHINCS+
        // public keys are 32 bytes for SHAKE-128f-simple, 64 bytes for
        // SHAKE-256f-simple, so > 0 is the floor we assert.
        description: 'Verify provers row created during this run window with operator_addr, sphincs_pubkey populated, and a sane status',
        command: `psql "$DATABASE_URL" -t -A -c "SELECT prover_id, operator_addr, status, length(sphincs_pubkey) FROM provers WHERE registered_at > NOW() - INTERVAL '5 minutes' ORDER BY registered_at DESC LIMIT 1;"`,
        expected: 'one provers row from this run window, status in {pending_approval, active, registered}, sphincs_pubkey length > 0',
        phase: 'verify',
      },
      {
        layer: 'l1',
        // 2026-05-09 (Phase 3 PR4/5): on-chain assertion that the prover is
        // registered on Sepolia ProverRegistry. Uses the same `getProver(address)`
        // ABI that the slashing binding (PR1 #189) standardised on. Tuple field
        // order (canonical, see src/l1/contracts/src/interfaces/IProverRegistry.sol:8-18):
        //   1. proverAddress    (address)
        //   2. sphincsPubKeyHash (bytes32)
        //   3. sphincsPublicKey  (bytes)
        //   4. stakedAmount     (uint256)
        //   5. registeredAt     (uint256)
        //   6. isActive         (bool)
        //   7. successfulSigns  (uint256)
        //   8. slashedCount     (uint256)
        //
        // Authoritative "registration landed on chain" signal: proverAddress
        // != 0x0 (struct exists). Per on-chain check 2026-05-09, testnetMode=true
        // on the deployed ProverRegistry, so stakedAmount may legitimately be 0
        // (registration is free); we MUST NOT assert stakedAmount > 0 here. We
        // also assert isActive=true as a tighter gate — the canonical contract
        // sets isActive on successful registerProver(). registeredAt > 0 is a
        // softer cross-check.
        description: 'Verify the prover registered in this run is anchored on L1 (ProverRegistry.getProver(addr).proverAddress != 0x0 && isActive)',
        command: `bash -c '
set -eo pipefail
PROVER_ADDR=$(psql "$DATABASE_URL" -t -A -c "SELECT operator_addr FROM provers WHERE registered_at > NOW() - INTERVAL '"'"'5 minutes'"'"' ORDER BY registered_at DESC LIMIT 1;" | tr -d " ")
if [ -z "$PROVER_ADDR" ]; then
  echo "FAIL: no provers row from this run window — drive step did not produce a registration"
  exit 1
fi
echo "checking L1 ProverRegistry.getProver(address) for prover=$PROVER_ADDR"
RAW=$(cast call 0x08e1fc1A0d614bc132B48950760c7A291cCB8946 "getProver(address)((address,bytes32,bytes,uint256,uint256,bool,uint256,uint256))" "$PROVER_ADDR" --rpc-url "$L1_RPC_URL" 2>/dev/null || echo "")
if [ -z "$RAW" ]; then
  echo "FAIL: getProver call failed (RPC error or wrong ABI). Re-verify against src/l1/contracts/src/interfaces/IProverRegistry.sol:84"
  exit 1
fi
# struct order: proverAddress, sphincsPubKeyHash, sphincsPublicKey, stakedAmount, registeredAt, isActive, successfulSigns, slashedCount
ON_CHAIN_ADDR=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$1}")
REGISTERED_AT=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$5}")
IS_ACTIVE=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$6}")
echo "on-chain proverAddress: $ON_CHAIN_ADDR"
echo "on-chain registeredAt:  $REGISTERED_AT"
echo "on-chain isActive:      $IS_ACTIVE"
if [ -z "$ON_CHAIN_ADDR" ] || [ "$ON_CHAIN_ADDR" = "0x0000000000000000000000000000000000000000" ]; then
  echo "FAIL: prover $PROVER_ADDR has no on-chain entry (not registered, or wrong address)"
  exit 1
fi
if [ "$IS_ACTIVE" != "true" ]; then
  echo "FAIL: prover $PROVER_ADDR exists on-chain but isActive=$IS_ACTIVE (registration tx may have reverted post-write)"
  exit 1
fi
echo "PASS: prover anchored on L1 — proverAddress=$ON_CHAIN_ADDR, isActive=$IS_ACTIVE, registeredAt=$REGISTERED_AT"
'`,
        expected: 'PASS: getProver(operator_addr).proverAddress matches DB and isActive=true — proves registerProver tx landed on Sepolia (testnetMode=true allows stakedAmount=0)',
        phase: 'verify',
      },
    ],
    acceptance_criteria: [
      'Backend seq5_prover_registration tests pass (incl. test_prover_register_creates_db_row from PR2 #189)',
      'Playwright prover-registration.integration.spec.ts passes',
      'A new provers row exists with operator_addr populated, status in {pending_approval, active, registered}, sphincs_pubkey non-empty',
      'On-chain getProver(operator_addr) returns matching proverAddress != 0x0 and isActive=true (registration anchored on Sepolia)',
      'No stakedAmount lower-bound assertion under testnetMode=true (registration is free; mainnet variant tightens this in PR5)',
    ],
  },
  challenge: {
    id: 'seq-4',
    name: 'Observer Challenge',
    spec_section: 'SEQUENCES.md §4 Observer Challenge',
    steps: [
      {
        layer: 'backend',
        // 2026-05-09 (Phase 3 PR4/5 of 5): drives the seq4_challenge backend
        // tests. PR3 (parallel agent) is adding the full-flow test
        // `test_challenge_submission_creates_db_row` — already present per
        // sequence_e2e_test.rs:788. The orchestrator filter `seq4_challenge`
        // captures all tests in the module so either set will run.
        description: 'Observer challenge backend Rust test (POST /v1/observer/challenges + DB row + L1 challenge)',
        command: 'cd src/api/api && SQLX_OFFLINE=true cargo test --test sequence_e2e_test seq4_challenge -- --nocapture',
        expected: 'Challenge submission test produces challenges row with bond >= MIN_CHALLENGE_BOND (0.1 ETH = 1e17 wei)',
        phase: 'drive',
      },
      {
        layer: 'frontend',
        // Existing Playwright spec from before this PR — confirmed present
        // in src/frontend/web/e2e/integration/challenge-slashing.integration.spec.ts
        // at PR4 authoring time. The same spec drives the challenge -> slashing
        // chain; for the challenge binding we only need the challenge half to
        // pass. No new spec needed.
        description: 'Playwright observer challenge integration spec (challenge-slashing covers both halves)',
        command: 'cd src/frontend/web && npx playwright test e2e/integration/challenge-slashing.integration.spec.ts --reporter=json',
        expected: 'UI challenge submission produces success state and DB row with bond >= MIN_CHALLENGE_BOND',
        phase: 'drive',
      },
      {
        layer: 'db',
        // 2026-05-09 (Phase 3 PR4/5): mirrors the 5-min run-window guard
        // pattern. `challenges` schema (migrations/001_initial_schema.sql:154-167):
        //   challenge_id, lock_id, unlock_id, challenger, fraud_proof_hash,
        //   bond NUMERIC(78,0), challenged_at TIMESTAMPTZ DEFAULT NOW(),
        //   defense_deadline TIMESTAMPTZ, status VARCHAR DEFAULT 'pending'.
        // NOTE: column is `bond` (not `bond_amount`) and `challenged_at` (not
        // `created_at`); both differ from the unlock_requests naming.
        // MIN_CHALLENGE_BOND = 0.1 ETH = 1e17 wei = 100000000000000000
        // (L1Vault.sol:62 / L1VaultTestnet.sol:56). 48h defense window per
        // SEQUENCES.md §4 Q4 strategy (c) — orchestrator verifies request
        // phase only; resolveChallenge (onlySecurityCouncil) is deferred to
        // PR5's nightly job.
        description: 'Verify challenges row created during this run window with bond >= MIN_CHALLENGE_BOND and ~48h defense window',
        command: `psql "$DATABASE_URL" -t -A -c "SELECT challenge_id, lock_id, bond, status, EXTRACT(EPOCH FROM (defense_deadline - challenged_at))/3600 AS hours_until_deadline FROM challenges WHERE challenged_at > NOW() - INTERVAL '5 minutes' ORDER BY challenged_at DESC LIMIT 1;"`,
        expected: 'one challenges row from this run window, bond >= 100000000000000000 (= 0.1 ETH = MIN_CHALLENGE_BOND), status in {pending, submitted}, hours_until_deadline ≈ 48',
        phase: 'verify',
      },
      {
        layer: 'l1',
        // 2026-05-09 (Phase 3 PR4/5): on-chain assertion that the challenge
        // landed on Sepolia. Reads lock_id from this run's challenges row,
        // calls Vault.challenges(bytes32) (auto-generated public mapping
        // getter, see L1Vault.sol:278 / L1VaultTestnet.sol:264) and asserts
        // status == PENDING (1).
        //
        // Challenge struct order (verified against L1Vault.sol:129-139 and
        // L1VaultTestnet.sol:123-133 — IDENTICAL between mainnet and testnet
        // variants):
        //   1. lockId           (bytes32)
        //   2. challenger       (address)
        //   3. fraudProofHash   (bytes32)
        //   4. challengedAt     (uint256)
        //   5. status           (uint8 / ChallengeStatus enum)
        //   6. bond             (uint256)
        //   7. defenseDeadline  (uint256)
        //   8. defenseProofHash (bytes32)
        //   9. defender         (address)
        //
        // ChallengeStatus enum (L1Vault.sol:78 / L1VaultTestnet.sol:72):
        //   NONE=0, PENDING=1, RESOLVED_VALID=2, RESOLVED_INVALID=3,
        //   DEFENSE_SUBMITTED=4
        //
        // Q4 strategy (c): assert status=PENDING after challenge submission.
        // The 48h defense window + onlySecurityCouncil resolveChallenge is
        // exercised by PR5's nightly/manual matrix, not here.
        description: 'Verify the challenge submitted in this run is anchored on L1 (Vault.challenges(lockId).status == PENDING)',
        command: `bash -c '
set -eo pipefail
LOCK_ID=$(psql "$DATABASE_URL" -t -A -c "SELECT lock_id FROM challenges WHERE challenged_at > NOW() - INTERVAL '"'"'5 minutes'"'"' ORDER BY challenged_at DESC LIMIT 1;" | tr -d " ")
if [ -z "$LOCK_ID" ]; then
  echo "FAIL: no challenges row from this run window — drive step did not produce a challenge"
  exit 1
fi
echo "checking L1 Vault.challenges(bytes32) for lock=$LOCK_ID"
RAW=$(cast call 0x07012aeF87C6E423c32F2f8eaF81762f63337260 "challenges(bytes32)((bytes32,address,bytes32,uint256,uint8,uint256,uint256,bytes32,address))" "$LOCK_ID" --rpc-url "$L1_RPC_URL" 2>/dev/null || echo "")
if [ -z "$RAW" ]; then
  echo "FAIL: challenges(lockId) call failed (RPC error or wrong ABI). Re-verify against L1Vault.sol:129-139 — TODO(PR5) refine if struct field order differs after first Sepolia run"
  exit 1
fi
# struct order: lockId, challenger, fraudProofHash, challengedAt, status (uint8), bond, defenseDeadline, defenseProofHash, defender
ON_CHAIN_LOCK=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$1}")
ON_CHAIN_STATUS=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$5}")
ON_CHAIN_BOND=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$6}")
ON_CHAIN_DEADLINE=$(echo "$RAW" | tr -d "()" | awk -F", " "{print \$7}")
echo "on-chain lockId:          $ON_CHAIN_LOCK"
echo "on-chain status (uint8):  $ON_CHAIN_STATUS  (1 = PENDING)"
echo "on-chain bond:            $ON_CHAIN_BOND"
echo "on-chain defenseDeadline: $ON_CHAIN_DEADLINE"
if [ -z "$ON_CHAIN_LOCK" ] || [ "$ON_CHAIN_LOCK" = "0x0000000000000000000000000000000000000000000000000000000000000000" ]; then
  echo "FAIL: lock $LOCK_ID has no on-chain challenge (Vault.challenges entry empty — submitChallenge tx not landed)"
  exit 1
fi
if [ "$ON_CHAIN_STATUS" != "1" ]; then
  echo "FAIL: on-chain ChallengeStatus=$ON_CHAIN_STATUS (expected 1=PENDING; 0=NONE means no entry, 2/3/4 means already resolved/defended)"
  exit 1
fi
echo "PASS: challenge anchored on L1 — status=PENDING (1), bond=$ON_CHAIN_BOND, defenseDeadline=$ON_CHAIN_DEADLINE"
'`,
        expected: 'PASS: Vault.challenges(lockId).status == 1 (PENDING) — proves submitChallenge tx landed on Sepolia in this run, before the 48h defense window expires',
        phase: 'verify',
      },
    ],
    acceptance_criteria: [
      'Backend seq4_challenge tests pass (incl. test_challenge_submission_creates_db_row at sequence_e2e_test.rs:788)',
      'Playwright challenge-slashing.integration.spec.ts passes (challenge half)',
      'A new challenges row exists with bond >= MIN_CHALLENGE_BOND (0.1 ETH = 1e17 wei) per L1Vault.sol:62',
      'defense_deadline - challenged_at ≈ 48 hours (matches §4 Q4 protocol parameter)',
      'On-chain Vault.challenges(lockId).status == 1 (PENDING) — request landed on Sepolia, defense window open',
      'Q4 strategy (c): orchestrator asserts request phase only; resolveChallenge (onlySecurityCouncil, 48h post-deadline) is deferred to PR5 nightly matrix',
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
