/**
 * Auto-Claim Integration Tests (Sequence #2 Final Step)
 *
 * Verifies the auto-claim background service correctly detects unlocks whose
 * timelock has expired and transitions them to 'released' status.
 *
 * Flow:
 * 1. POST /v1/lock           → Create lock (status: pending)
 * 2. POST /v1/unlock          → Request unlock (status: unlock_pending, release_time: +24h)
 *    OR POST /v1/unlock/emergency → Emergency unlock (status: emergency_pending, release_time: +7d)
 * 3. DB UPDATE                → Set release_time to past (bypass timelock wait)
 * 4. Poll status              → Wait for auto-claim to pick up (polls every 60s)
 * 5. Verify                   → Lock status = 'released'
 *
 * Note: Normal unlocks require 2 prover signatures in unlock_prover_signatures.
 * Emergency unlocks skip the signature requirement (signatures = vec![]).
 *
 * Prerequisites:
 * - Backend running on localhost:8080 with auto_claim.enabled: true
 * - Docker services: postgres, redis, rabbitmq, l3-node
 * - skip_signature_verification: true in config
 * - auto_claim.poll_interval_secs: 60 (default)
 *
 * Spec References:
 * - SEQUENCES #2: Normal Unlock (24h timelock → auto-claim → released)
 * - SEQUENCES #3: Emergency Unlock (7d timelock → auto-claim → released)
 * - auto_claim.rs: find_claimable_unlocks() + claim_single_unlock()
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { execSync } from 'child_process';

const API_BASE = 'http://localhost:8080';
const DOCKER_PSQL = 'docker exec qs-postgres psql -U quantum -d quantum_shield';

// Auto-claim polls every 60s; allow up to 3 cycles + margin
const AUTO_CLAIM_TIMEOUT_MS = 200_000;
const POLL_INTERVAL_MS = 5_000;

/** Generate random hex bytes */
function hexBytes(n: number): string {
  return (
    '0x' +
    Array.from({ length: n }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
    ).join('')
  );
}

/** Create a lock via API and return lock_id + metadata */
async function createLock(
  request: APIRequestContext,
  opts?: { amount?: string }
) {
  const nonce = Date.now() + Math.floor(Math.random() * 1000000);
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const amount = opts?.amount ?? '1000000000000000000'; // 1 ETH
  const dest_addr = hexBytes(20);

  const response = await request.post(`${API_BASE}/v1/lock`, {
    data: {
      chain_id: 11155111,
      asset: 'ETH',
      amount,
      dest_addr,
      pk_dilithium: hexBytes(32),
      sig_dilithium: hexBytes(64),
      expiry,
      nonce,
    },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  return { lock_id: data.lock_id as string, sr_0: data.sr_0 as string, dest_addr, amount };
}

/** Request emergency unlock via API */
async function requestEmergencyUnlock(
  request: APIRequestContext,
  lockId: string,
  destAddr: string,
  amount: string
) {
  const response = await request.post(`${API_BASE}/v1/unlock/emergency`, {
    data: {
      lock_id: lockId,
      dest_addr: destAddr,
      amount,
      sig_dilithium: hexBytes(64),
    },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  return {
    unlock_id: data.unlock_id as string,
    release_time: data.release_time as number,
    status: data.status as string,
  };
}

/** Request normal unlock via API */
async function requestNormalUnlock(
  request: APIRequestContext,
  lockId: string,
  destAddr: string,
  amount: string
) {
  const response = await request.post(`${API_BASE}/v1/unlock`, {
    data: {
      lock_id: lockId,
      dest_addr: destAddr,
      amount,
      sig_dilithium: hexBytes(64),
    },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  return {
    unlock_id: data.unlock_id as string,
    release_time: data.release_time as number,
    status: data.status as string,
  };
}

/** Update release_time in DB to the past via docker exec psql */
function setReleaseTimeToPast(lockId: string): void {
  const sql = `UPDATE unlock_requests SET release_time = NOW() - INTERVAL '1 hour' WHERE lock_id = '${lockId}'`;
  execSync(`${DOCKER_PSQL} -c "${sql}"`, {
    timeout: 10_000,
    stdio: 'pipe',
  });
}

/**
 * Insert mock prover signatures for a normal unlock.
 * Auto-claim requires at least 2 valid signatures for non-emergency unlocks.
 */
function insertMockProverSignatures(unlockId: string, sr0: string): void {
  for (let i = 0; i < 2; i++) {
    const sigId = hexBytes(32);
    const proverId = hexBytes(32);
    const sr1 = hexBytes(32);
    // sig_sphincs needs to be bytea - use decode for hex bytes
    const sql = `INSERT INTO unlock_prover_signatures (signature_id, unlock_id, prover_id, sig_sphincs, sr_0, sr_1, is_valid) VALUES ('${sigId}', '${unlockId}', '${proverId}', decode('${'ab'.repeat(64)}', 'hex'), '${sr0}', '${sr1}', true)`;
    execSync(`${DOCKER_PSQL} -c "${sql}"`, {
      timeout: 10_000,
      stdio: 'pipe',
    });
  }
}

/** Poll lock status until it matches expected value or timeout */
async function pollLockStatus(
  request: APIRequestContext,
  lockId: string,
  expectedStatus: string,
  timeoutMs: number = AUTO_CLAIM_TIMEOUT_MS
): Promise<string> {
  const start = Date.now();
  let lastStatus = '';

  while (Date.now() - start < timeoutMs) {
    const response = await request.get(
      `${API_BASE}/v1/status/${lockId}`
    );

    if (response.status() === 200) {
      const data = await response.json();
      lastStatus = data.status;

      if (lastStatus === expectedStatus) {
        return lastStatus;
      }
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return lastStatus;
}

test.describe('Auto-Claim Integration (Sequence #2 Final Step)', () => {
  // These tests depend on the auto-claim background service running
  // with a 60s polling interval. Set generous timeout.
  test.setTimeout(AUTO_CLAIM_TIMEOUT_MS + 30_000);

  test('health check confirms backend with auto-claim is ready', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/health`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('auto-claim processes emergency unlock after timelock expiry', async ({
    request,
  }) => {
    // Emergency unlock does NOT require prover signatures → cleanest auto-claim test

    // Step 1: Create lock
    const { lock_id, dest_addr, amount } = await createLock(request);

    // Verify lock created with pending status
    const lockStatus = await request.get(`${API_BASE}/v1/status/${lock_id}`);
    expect(lockStatus.status()).toBe(200);
    const lockData = await lockStatus.json();
    expect(lockData.status).toBe('pending');

    // Step 2: Request emergency unlock (7d timelock + bond)
    const unlockResult = await requestEmergencyUnlock(
      request,
      lock_id,
      dest_addr,
      amount
    );
    expect(unlockResult.status).toBe('emergency_pending');
    expect(unlockResult.release_time).toBeGreaterThan(
      Math.floor(Date.now() / 1000)
    );

    // Verify lock status changed to emergency_pending
    const emergencyStatus = await request.get(`${API_BASE}/v1/status/${lock_id}`);
    expect(emergencyStatus.status()).toBe(200);
    const emergencyData = await emergencyStatus.json();
    expect(emergencyData.status).toBe('emergency_pending');

    // Step 3: Manipulate DB - set release_time to past
    setReleaseTimeToPast(lock_id);

    // Step 4: Poll until auto-claim processes it (up to ~200s)
    const finalStatus = await pollLockStatus(request, lock_id, 'released');

    // Step 5: Verify released
    expect(finalStatus).toBe('released');
  });

  test('auto-claim processes normal unlock with prover signatures', async ({
    request,
  }) => {
    // Normal unlock requires 2 prover signatures in DB

    // Step 1: Create lock
    const { lock_id, sr_0, dest_addr, amount } = await createLock(request);

    // Step 2: Request normal unlock
    const unlockResult = await requestNormalUnlock(
      request,
      lock_id,
      dest_addr,
      amount
    );
    expect(unlockResult.status).toBe('pending_signatures');

    // Step 3: Insert 2 mock prover signatures (auto-claim requires >= 2)
    insertMockProverSignatures(unlockResult.unlock_id, sr_0);

    // Step 4: Set release_time to past
    setReleaseTimeToPast(lock_id);

    // Step 5: Poll until auto-claim processes it
    const finalStatus = await pollLockStatus(request, lock_id, 'released');

    // Step 6: Verify released
    expect(finalStatus).toBe('released');
  });

  test('auto-claim does NOT process unlock before timelock expiry', async ({
    request,
  }) => {
    // Create lock + emergency unlock (release_time is 7d in the future)
    const { lock_id, dest_addr, amount } = await createLock(request);
    await requestEmergencyUnlock(request, lock_id, dest_addr, amount);

    // Do NOT manipulate release_time

    // Wait for 2 auto-claim cycles (120s) + margin
    // The lock should remain in emergency_pending because release_time is 7d away
    await new Promise((resolve) => setTimeout(resolve, 130_000));

    const statusResp = await request.get(`${API_BASE}/v1/status/${lock_id}`);
    expect(statusResp.status()).toBe(200);

    const data = await statusResp.json();
    // Should still be emergency_pending (NOT released)
    expect(data.status).toBe('emergency_pending');
  });

  test('auto-claim handles multiple expired unlocks in same cycle', async ({
    request,
  }) => {
    // Create 3 locks, emergency-unlock all, expire all
    const locks: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { lock_id, dest_addr, amount } = await createLock(request);
      await requestEmergencyUnlock(request, lock_id, dest_addr, amount);
      locks.push(lock_id);
    }

    // Set all release_times to past
    for (const lockId of locks) {
      setReleaseTimeToPast(lockId);
    }

    // Poll all 3 until released
    const results = await Promise.all(
      locks.map((lockId) => pollLockStatus(request, lockId, 'released'))
    );

    // All 3 should be released
    for (const status of results) {
      expect(status).toBe('released');
    }
  });
});

test.describe('Auto-Claim DB Verification', () => {
  test.setTimeout(AUTO_CLAIM_TIMEOUT_MS + 30_000);

  test('released lock has correct final DB state', async ({ request }) => {
    // Create lock + emergency unlock + expire + wait for auto-claim
    const { lock_id, dest_addr, amount } = await createLock(request);
    await requestEmergencyUnlock(request, lock_id, dest_addr, amount);
    setReleaseTimeToPast(lock_id);

    const finalStatus = await pollLockStatus(request, lock_id, 'released');
    expect(finalStatus).toBe('released');

    // Verify via API that lock data is consistent
    const statusResp = await request.get(`${API_BASE}/v1/status/${lock_id}`);
    expect(statusResp.status()).toBe(200);

    const data = await statusResp.json();
    expect(data.lock_id).toBe(lock_id);
    expect(data.status).toBe('released');
    expect(data.amount).toBe(amount);
  });

  test('DB unlock_requests record tracks the release', async ({ request }) => {
    const { lock_id, dest_addr, amount } = await createLock(request);
    const unlockResult = await requestEmergencyUnlock(
      request,
      lock_id,
      dest_addr,
      amount
    );
    setReleaseTimeToPast(lock_id);

    await pollLockStatus(request, lock_id, 'released');

    // Verify unlock_request exists in DB with correct data
    const result = execSync(
      `${DOCKER_PSQL} -t -A -c "SELECT lock_id, is_emergency FROM unlock_requests WHERE unlock_id = '${unlockResult.unlock_id}'"`,
      { timeout: 10_000, encoding: 'utf-8' }
    ).trim();

    // Should have lock_id|true (emergency unlock)
    expect(result).toContain(lock_id);
    expect(result).toContain('t'); // is_emergency = true
  });
});
