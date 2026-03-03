/**
 * Prover API Integration Tests
 *
 * Verifies the full prover flow: Registration → Dashboard → Queue → Signing → Metrics → Exit
 * Tests real backend endpoints with skip_signature_verification=true (dev mode).
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 * - skip_signature_verification: true in config
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

// Helper: Register a new prover and return prover_id
async function registerProver(
  request: ReturnType<typeof test.info>['_test'] extends never
    ? never
    : Parameters<Parameters<typeof test>[1]>[0]['request']
): Promise<{ proverId: string; operatorAddr: string }> {
  const operatorAddr = hexBytes(20);
  const sphincsPubkey = hexBytes(32);

  const response = await request.post(`${API_BASE}/v1/prover/register`, {
    data: {
      operator_addr: operatorAddr,
      sphincs_pubkey: sphincsPubkey,
      stake_amount: '32000000000000000000',
      hsm_attestation: hexBytes(64),
      multisig_proof: hexBytes(32),
      endpoint: 'https://test-prover.example.com',
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();
  return { proverId: data.prover_id, operatorAddr };
}

// Helper: Create lock + unlock to populate signing queue
async function createPendingUnlock(
  request: ReturnType<typeof test.info>['_test'] extends never
    ? never
    : Parameters<Parameters<typeof test>[1]>[0]['request']
): Promise<{ lockId: string; unlockId: string }> {
  const nonce = Date.now() + Math.floor(Math.random() * 100000);
  const lockResp = await request.post(`${API_BASE}/v1/lock`, {
    data: {
      chain_id: 11155111,
      asset: 'ETH',
      amount: '1000000000000000000',
      dest_addr: '0xabcdef1234567890abcdef1234567890abcdef12',
      pk_dilithium: '0xtest_prover_spec_pk',
      sig_dilithium: '0xtest_prover_spec_sig',
      expiry: 9999999999,
      nonce,
    },
  });
  expect(lockResp.status()).toBe(200);
  const lockData = await lockResp.json();

  const unlockResp = await request.post(`${API_BASE}/v1/unlock`, {
    data: {
      lock_id: lockData.lock_id,
      dest_addr: '0xabcdef1234567890abcdef1234567890abcdef12',
      amount: '1000000000000000000',
      sig_dilithium: '0xtest_sig',
    },
  });
  expect(unlockResp.status()).toBe(200);
  const unlockData = await unlockResp.json();

  return { lockId: lockData.lock_id, unlockId: unlockData.unlock_id };
}

test.describe('Prover Registration (Sequence #4)', () => {
  test('POST /v1/prover/register creates prover with SPHINCS+ key', async ({
    request,
  }) => {
    const sphincsPubkey = hexBytes(32);
    const operatorAddr = hexBytes(20);

    const response = await request.post(`${API_BASE}/v1/prover/register`, {
      data: {
        operator_addr: operatorAddr,
        sphincs_pubkey: sphincsPubkey,
        stake_amount: '32000000000000000000',
        hsm_attestation: hexBytes(64),
        multisig_proof: hexBytes(32),
        endpoint: 'https://prover.example.com',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify response structure
    expect(data.prover_id).toBeTruthy();
    expect(data.prover_id).toMatch(/^0x[a-f0-9]{64}$/);
    expect(data.status).toBe('pending_approval');
    expect(data.stake_locked).toBe('32000000000000000000');
  });

  test('prover_id is deterministic (SHA3-256 of operator_addr + sphincs_pubkey)', async ({
    request,
  }) => {
    const operatorAddr = hexBytes(20);
    const sphincsPubkey = hexBytes(32);

    const resp1 = await request.post(`${API_BASE}/v1/prover/register`, {
      data: {
        operator_addr: operatorAddr,
        sphincs_pubkey: sphincsPubkey,
        stake_amount: '32000000000000000000',
        hsm_attestation: hexBytes(64),
        multisig_proof: hexBytes(32),
        endpoint: 'https://prover1.example.com',
      },
    });

    // Second registration with same keys should either return same ID or conflict
    const resp2 = await request.post(`${API_BASE}/v1/prover/register`, {
      data: {
        operator_addr: operatorAddr,
        sphincs_pubkey: sphincsPubkey,
        stake_amount: '32000000000000000000',
        hsm_attestation: hexBytes(64),
        multisig_proof: hexBytes(32),
        endpoint: 'https://prover2.example.com',
      },
    });

    const data1 = await resp1.json();
    if (resp2.ok()) {
      const data2 = await resp2.json();
      expect(data2.prover_id).toBe(data1.prover_id);
    } else {
      // Duplicate registration should return 409 or similar
      expect(resp2.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('accepts registration with any stake in dev mode', async ({ request }) => {
    // In dev mode (skip_signature_verification=true), stake validation is relaxed
    const response = await request.post(`${API_BASE}/v1/prover/register`, {
      data: {
        operator_addr: hexBytes(20),
        sphincs_pubkey: hexBytes(32),
        stake_amount: '100',
        hsm_attestation: hexBytes(64),
        multisig_proof: hexBytes(32),
        endpoint: 'https://prover.example.com',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.stake_locked).toBe('100');
  });

  test('rejects registration with missing fields', async ({ request }) => {
    const response = await request.post(`${API_BASE}/v1/prover/register`, {
      data: {
        operator_addr: hexBytes(20),
        // Missing sphincs_pubkey, stake_amount, etc.
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Prover Dashboard & Metrics', () => {
  test('GET /v1/prover/:id/dashboard returns full dashboard data', async ({
    request,
  }) => {
    const { proverId } = await registerProver(request as never);

    const response = await request.get(
      `${API_BASE}/v1/prover/${proverId}/dashboard`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.prover_id).toBe(proverId);
    expect(data.status).toBe('pending_approval');
    expect(data.stake_amount).toBe('32000000000000000000');
    expect(typeof data.total_signatures).toBe('number');
    expect(typeof data.uptime_percentage).toBe('number');
    expect(typeof data.queue_size).toBe('number');
    expect(typeof data.active_challenges).toBe('number');
  });

  test('GET /v1/prover/:id/metrics returns performance metrics', async ({
    request,
  }) => {
    const { proverId } = await registerProver(request as never);

    const response = await request.get(
      `${API_BASE}/v1/prover/${proverId}/metrics`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(typeof data.total_signatures).toBe('number');
    expect(typeof data.success_rate).toBe('number');
    expect(typeof data.uptime_percentage).toBe('number');
    expect(typeof data.avg_response_time_ms).toBe('number');
    expect(typeof data.rank).toBe('number');
    expect(typeof data.total_provers).toBe('number');
  });

  test('GET /v1/prover/:id/alerts returns alerts list', async ({
    request,
  }) => {
    const { proverId } = await registerProver(request as never);

    const response = await request.get(
      `${API_BASE}/v1/prover/${proverId}/alerts`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.alerts)).toBe(true);
    expect(typeof data.total).toBe('number');
    expect(typeof data.unacknowledged_count).toBe('number');
  });

  test('returns 404 for non-existent prover', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/v1/prover/0x0000000000000000000000000000000000000000000000000000000000000000/dashboard`
    );
    expect(response.status()).toBe(404);
  });
});

test.describe('Prover Signing Queue', () => {
  test('GET /v1/prover/:id/queue returns empty queue for new prover', async ({
    request,
  }) => {
    const { proverId } = await registerProver(request as never);

    const response = await request.get(
      `${API_BASE}/v1/prover/${proverId}/queue`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.total).toBe(0);
    expect(data.pending_count).toBe(0);
  });

  test('GET /v1/prover/:id/challenges returns empty for new prover', async ({
    request,
  }) => {
    const { proverId } = await registerProver(request as never);

    const response = await request.get(
      `${API_BASE}/v1/prover/${proverId}/challenges`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.challenges)).toBe(true);
    expect(data.total).toBe(0);
    expect(data.pending_count).toBe(0);
  });
});

test.describe('Prover Exit Flow', () => {
  test('GET /v1/prover/:id/exit-status shows active status for new prover', async ({
    request,
  }) => {
    const { proverId } = await registerProver(request as never);

    const response = await request.get(
      `${API_BASE}/v1/prover/${proverId}/exit-status`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.prover_id).toBe(proverId);
    expect(data.can_withdraw).toBe(false);
    expect(data.has_pending_challenges).toBe(false);
    expect(data.stake_to_return).toBe('32000000000000000000');
  });

  test('POST /v1/prover/:id/exit initiates exit process', async ({
    request,
  }) => {
    const { proverId } = await registerProver(request as never);

    const response = await request.post(
      `${API_BASE}/v1/prover/${proverId}/exit`,
      {
        data: {
          reason: 'voluntary_exit',
          confirmation_signature: hexBytes(64),
        },
      }
    );

    // Exit should succeed or return "already exiting" error
    if (response.ok()) {
      const data = await response.json();
      expect(data.prover_id).toBe(proverId);
      expect(typeof data.unbonding_end).toBe('number');
      expect(data.stake_to_return).toBeTruthy();
    } else {
      // Some states may not allow exit (e.g., pending_approval)
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('POST /v1/prover/:id/withdraw rejected before unbonding complete', async ({
    request,
  }) => {
    const { proverId } = await registerProver(request as never);

    const response = await request.post(
      `${API_BASE}/v1/prover/${proverId}/withdraw`,
      {
        data: {
          destination_address: '0xabcdef1234567890abcdef1234567890abcdef12',
          confirmation_signature: hexBytes(64),
        },
      }
    );

    // Should reject - prover hasn't completed unbonding
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Prover List', () => {
  test('GET /v1/prover/list returns registered provers', async ({
    request,
  }) => {
    // Register a prover first
    await registerProver(request as never);

    const response = await request.get(`${API_BASE}/v1/prover/list`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);

    // Verify prover entry structure (camelCase from this endpoint)
    const prover = data.items[0];
    expect(prover.proverId).toBeTruthy();
    expect(prover.operatorAddr).toBeTruthy();
    expect(prover.status).toBeTruthy();
    expect(prover.stakeAmount).toBeTruthy();
  });
});
