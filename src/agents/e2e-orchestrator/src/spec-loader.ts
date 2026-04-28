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
        command: 'cd src/api/api && SQLX_OFFLINE=true cargo test --test sequence_e2e_test sequence_lock -- --nocapture',
        expected: 'Lock created in DB, SR0 computed, L1 lockWithSR0 submitted',
      },
      {
        layer: 'frontend',
        description: 'Playwright integration spec for Consumer Lock',
        command: 'cd src/frontend/web && npx playwright test e2e/integration/lock.integration.spec.ts --reporter=json',
        expected: 'UI lock creation produces success state and DB row',
      },
      {
        layer: 'db',
        description: 'Verify lock row was created and pk_dilithium populated',
        command: `psql "$DATABASE_URL" -t -A -c "SELECT lock_id, status, length(pk_dilithium) FROM locks ORDER BY created_at DESC LIMIT 1;"`,
        expected: 'one row, status=locked, pk_dilithium length=1952',
      },
      {
        layer: 'l1',
        description: 'Verify totalLocked increased on Sepolia Vault',
        command: `cast call 0x07012aeF87C6E423c32F2f8eaF81762f63337260 "totalLocked()(uint256)" --rpc-url "$L1_RPC_URL"`,
        expected: 'value > 0 wei',
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
        command: 'cd src/api/api && SQLX_OFFLINE=true cargo test --test sequence_e2e_test sequence_unlock_normal -- --nocapture',
        expected: '24h time-lock honored, Auto-Claim service finalizes',
      },
      {
        layer: 'frontend',
        description: 'Playwright unlock integration spec',
        command: 'cd src/frontend/web && npx playwright test e2e/integration/unlock.integration.spec.ts --reporter=json',
      },
      {
        layer: 'db',
        description: 'Verify unlocks row and time_lock_until is 24h ahead of created_at',
        command: `psql "$DATABASE_URL" -t -A -c "SELECT unlock_id, status, EXTRACT(EPOCH FROM (time_lock_until - created_at))/3600 FROM unlocks ORDER BY created_at DESC LIMIT 1;"`,
        expected: 'status=requested or finalized, hours = 24',
      },
      {
        layer: 'l1',
        description: 'Verify L1 lock is unlocked or scheduled',
        command: `cast call 0x07012aeF87C6E423c32F2f8eaF81762f63337260 "totalLocked()(uint256)" --rpc-url "$L1_RPC_URL"`,
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
        command: 'cd src/api/api && SQLX_OFFLINE=true cargo test --test sequence_e2e_test sequence_slashing -- --nocapture',
        expected: 'L1SlashStatus enum transitions; pending_retry path tested',
      },
      {
        layer: 'db',
        description: 'Verify slashings row and l1_status',
        command: `psql "$DATABASE_URL" -t -A -c "SELECT slashing_id, l1_status, l1_tx_hash IS NOT NULL FROM slashings ORDER BY slashed_at DESC LIMIT 1;"`,
        expected: 'l1_status in (submitted, pending_retry, disabled, unavailable)',
      },
      {
        layer: 'l1',
        description: 'ProverRegistry stake check',
        command: `cast call 0x08e1fc1A0d614bc132B48950760c7A291cCB8946 "getProverCount()(uint256)" --rpc-url "$L1_RPC_URL"`,
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
