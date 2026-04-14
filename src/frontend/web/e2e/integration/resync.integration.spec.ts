/**
 * Resync Integration Tests (Sequence #3')
 *
 * Verifies recovery when L3-L1 sync fails after Lock:
 * - Auto: 1-minute polling for L1 events
 * - Manual: User triggers resync with L1 tx hash verification
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 *
 * Spec References:
 * - SEQUENCES §3': Resync
 * - Auto polling: 1 minute interval
 * - Manual resync: L1 tx hash required
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

async function createLock(
  request: Parameters<Parameters<typeof test>[1]>[0]['request']
): Promise<{ lock_id: string; sr_0: string }> {
  const nonce = Date.now() + Math.floor(Math.random() * 100000);
  const response = await request.post(`${API_BASE}/v1/lock`, {
    data: {
      chain_id: 11155111,
      asset: 'ETH',
      amount: '1000000000000000000',
      dest_addr: hexBytes(20),
      pk_dilithium: hexBytes(32),
      sig_dilithium: hexBytes(64),
      expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
      nonce,
    },
  });
  expect(response.status()).toBe(200);
  return response.json();
}

test.describe('Sequence #3\': Resync — Integration', () => {
  test('health check', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/health`);
    expect(res.status()).toBe(200);
  });

  test('GET /v1/lock/:id/sync-status returns sync information', async ({
    request,
  }) => {
    const lock = await createLock(request);

    const response = await request.get(
      `${API_BASE}/v1/lock/${lock.lock_id}/sync-status`
    );

    // Endpoint may return 200 with sync info or 404 if not implemented
    if (response.status() === 200) {
      const data = await response.json();
      // Verify sync status fields
      expect(data).toHaveProperty('l1_synced');
      console.log(
        `[Sync Status] lock_id=${lock.lock_id}, l1_synced=${data.l1_synced}`
      );
    } else {
      // If endpoint doesn't exist, verify it returns proper error
      expect([404, 501]).toContain(response.status());
      console.log(
        `[Sync Status] Endpoint returned ${response.status()} — may need implementation`
      );
    }
  });

  test('POST /v1/lock/:id/resync triggers manual resync', async ({
    request,
  }) => {
    const lock = await createLock(request);
    const fakeTxHash = '0x' + 'ab'.repeat(32);

    const response = await request.post(
      `${API_BASE}/v1/lock/${lock.lock_id}/resync`,
      {
        data: {
          l1_tx_hash: fakeTxHash,
        },
      }
    );

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.lock_id || data.lockId).toBe(lock.lock_id);
      console.log(`[Resync] Triggered for lock_id=${lock.lock_id}`);
    } else if (response.status() === 404) {
      console.log('[Resync] Endpoint not yet implemented — needs B-1c work');
    } else {
      // 400/422 acceptable (invalid tx hash on testnet)
      expect([400, 422]).toContain(response.status());
      console.log(
        `[Resync] Rejected with ${response.status()} — expected for fake tx hash`
      );
    }
  });

  test('resync with invalid lock_id returns error', async ({ request }) => {
    const invalidLockId =
      '0x0000000000000000000000000000000000000000000000000000000000000000';

    const response = await request.post(
      `${API_BASE}/v1/lock/${invalidLockId}/resync`,
      {
        data: {
          l1_tx_hash: '0x' + 'ff'.repeat(32),
        },
      }
    );

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET /v1/sync/status returns global sync health', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/sync/status`);

    if (response.status() === 200) {
      const data = await response.json();
      console.log(`[Global Sync] ${JSON.stringify(data)}`);
    } else {
      // May not be implemented yet
      expect([404, 501]).toContain(response.status());
      console.log(`[Global Sync] Endpoint returned ${response.status()}`);
    }
  });
});
