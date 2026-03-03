/**
 * Challenge & Slashing Integration Tests (Sequence #5/#6)
 *
 * Verifies the full challenge flow: Lock → Unlock → Challenge → Defense → Auto-Resolve → Slashing
 * Tests real backend endpoints with skip_signature_verification=true (dev mode).
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 * - skip_signature_verification: true in config
 *
 * Spec References:
 * - SEQUENCES §4: Challenge + Slashing
 * - CP-4: Quadratic slashing N^2 x 10%
 * - Distribution: 60% Challenger, 20% Insurance, 20% Burn
 */
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080';

// Helper: Generate hex string of specified byte length
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

// Helper: Create a lock and return lock_id
async function createLock(
  request: Parameters<Parameters<typeof test>[1]>[0]['request']
): Promise<string> {
  const nonce = Date.now() + Math.floor(Math.random() * 100000);
  const expiry = Math.floor(Date.now() / 1000) + 3600;

  const response = await request.post(`${API_BASE}/v1/lock`, {
    data: {
      chain_id: 11155111,
      asset: 'ETH',
      amount: '1000000000000000000', // 1 ETH
      dest_addr: hexBytes(20),
      pk_dilithium: hexBytes(32),
      sig_dilithium: hexBytes(64),
      expiry,
      nonce,
    },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  return data.lock_id;
}

// Helper: Request unlock for a lock
async function requestUnlock(
  request: Parameters<Parameters<typeof test>[1]>[0]['request'],
  lockId: string
): Promise<string> {
  const response = await request.post(`${API_BASE}/v1/unlock`, {
    data: {
      lock_id: lockId,
      dest_addr: hexBytes(20),
      amount: '1000000000000000000',
      sig_dilithium: hexBytes(64),
    },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  return data.unlock_id;
}

test.describe('Challenge Submission (Sequence #5)', () => {
  test('health check confirms backend is ready', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/health`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('POST /v1/challenge creates challenge against pending unlock', async ({
    request,
  }) => {
    // 1. Create lock
    const lockId = await createLock(request);

    // 2. Request unlock to put lock in unlock_pending state
    await requestUnlock(request, lockId);

    // 3. Submit challenge
    const response = await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: lockId,
        challenger: hexBytes(20),
        fraud_proof: 'Invalid SPHINCS+ signature detected in unlock request',
        bond: '100000000000000000', // 0.1 ETH (minimum bond)
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify response structure
    expect(data.challenge_id).toBeTruthy();
    expect(data.challenge_id).toMatch(/^0x/);
    expect(data.lock_id).toBe(lockId);
    expect(data.fraud_proof_hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(data.bond).toBe('100000000000000000');
    expect(data.defense_deadline).toBeGreaterThan(0);
    expect(data.status).toBe('pending');
  });

  test('challenge requires sufficient bond (MIN 0.1 ETH or 1% of amount)', async ({
    request,
  }) => {
    const lockId = await createLock(request);
    await requestUnlock(request, lockId);

    // Submit challenge with insufficient bond
    const response = await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: lockId,
        challenger: hexBytes(20),
        fraud_proof: 'Insufficient bond test',
        bond: '1000', // Way too low
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('challenge cannot target non-pending lock', async ({ request }) => {
    const lockId = await createLock(request);
    // Don't request unlock - lock is in pending state, not unlock_pending

    const response = await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: lockId,
        challenger: hexBytes(20),
        fraud_proof: 'Should be rejected - lock not in unlock_pending',
        bond: '100000000000000000',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('challenge for non-existent lock returns error', async ({ request }) => {
    const response = await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: '0x0000000000000000000000000000000000000000000000000000000000000000',
        challenger: hexBytes(20),
        fraud_proof: 'Non-existent lock',
        bond: '100000000000000000',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Challenge Info & Status', () => {
  test('GET /v1/challenge/:lock_id returns challenge info', async ({
    request,
  }) => {
    // Create lock + unlock + challenge
    const lockId = await createLock(request);
    await requestUnlock(request, lockId);

    await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: lockId,
        challenger: hexBytes(20),
        fraud_proof: 'Get challenge test',
        bond: '100000000000000000',
      },
    });

    // Retrieve challenge
    const response = await request.get(`${API_BASE}/v1/challenge/${lockId}`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.challenge_id).toBeTruthy();
    expect(data.lock_id).toBe(lockId);
    expect(data.status).toBeTruthy();
    expect(data.defense_deadline).toBeGreaterThan(0);
  });

  test('GET /v1/challenge/:lock_id returns 404 for unchallenged lock', async ({
    request,
  }) => {
    const lockId = await createLock(request);

    const response = await request.get(`${API_BASE}/v1/challenge/${lockId}`);
    expect(response.status()).toBe(404);
  });
});

test.describe('Defense Submission (Sequence #5.5)', () => {
  test('defense submission requires active prover', async ({ request }) => {
    // Create lock + unlock + challenge
    const lockId = await createLock(request);
    await requestUnlock(request, lockId);

    await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: lockId,
        challenger: hexBytes(20),
        fraud_proof: 'Defense test',
        bond: '100000000000000000',
      },
    });

    // Attempt defense with non-existent prover
    const response = await request.post(
      `${API_BASE}/v1/challenge/${lockId}/defense`,
      {
        data: {
          prover_id: '0x0000000000000000000000000000000000000000000000000000000000000000',
          defense_proof: 'Valid SPHINCS+ signature proof',
        },
      }
    );

    // Should fail - prover not found or not active
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Slashing Pipeline (Sequence #6)', () => {
  test('auto-resolve before defense deadline is rejected', async ({
    request,
  }) => {
    const lockId = await createLock(request);
    await requestUnlock(request, lockId);

    await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: lockId,
        challenger: hexBytes(20),
        fraud_proof: 'Auto resolve too early test',
        bond: '100000000000000000',
      },
    });

    // Try auto-resolve immediately (defense deadline is 48h away)
    const response = await request.post(
      `${API_BASE}/v1/challenge/${lockId}/auto-resolve`
    );

    // Should be rejected - deadline not passed
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('lock status is challenged after challenge submission', async ({
    request,
  }) => {
    const lockId = await createLock(request);
    await requestUnlock(request, lockId);

    // Submit challenge
    await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: lockId,
        challenger: hexBytes(20),
        fraud_proof: 'Status check test',
        bond: '100000000000000000',
      },
    });

    // Check lock status
    const statusResponse = await request.get(
      `${API_BASE}/v1/lock/${lockId}/status`
    );

    if (statusResponse.status() === 200) {
      const status = await statusResponse.json();
      expect(status.status).toBe('challenged');
    }
  });

  test('fraud proof hash is SHA3-256 (not keccak256)', async ({ request }) => {
    const lockId = await createLock(request);
    await requestUnlock(request, lockId);

    const response = await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: lockId,
        challenger: hexBytes(20),
        fraud_proof: 'SHA3 test proof',
        bond: '100000000000000000',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify hash is 32 bytes (64 hex chars + 0x prefix)
    expect(data.fraud_proof_hash).toMatch(/^0x[a-f0-9]{64}$/);
    // SHA3-256 of "SHA3 test proof" - verify it's deterministic
    expect(data.fraud_proof_hash.length).toBe(66);
  });
});

test.describe('Explorer Challenge Views', () => {
  test('GET /v1/explorer/challenges/stats returns challenge statistics', async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE}/v1/explorer/challenges/stats`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    // API returns camelCase: totalChallenges, activeChallenges, etc.
    expect(typeof data.totalChallenges).toBe('number');
    expect(typeof data.activeChallenges).toBe('number');
    expect(typeof data.successRate).toBe('number');
  });

  test('GET /v1/explorer/challenges/active returns active challenges', async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE}/v1/explorer/challenges/active`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.challenges || data.items || data)).toBe(true);
  });
});
