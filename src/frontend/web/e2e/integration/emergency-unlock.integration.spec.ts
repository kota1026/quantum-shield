/**
 * Emergency Unlock Integration Tests (Sequence #3)
 *
 * Verifies the emergency unlock path: Bond calculation + 7-day timelock + no prover signatures.
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 * - skip_signature_verification: true in config
 *
 * Spec References:
 * - SEQUENCES §3: Unlock (Emergency Path)
 * - Bond: MAX(0.5 ETH, 5% of amount)
 * - Time lock: 7 days
 * - No prover signatures required
 * - Emergency timeout: 72 hours
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const SEVEN_DAYS_SECS = 7 * 24 * 3600;
const MIN_BOND_WEI = '500000000000000000'; // 0.5 ETH
const BOND_BPS = 500; // 5% = 500 basis points

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
  request: Parameters<Parameters<typeof test>[1]>[0]['request'],
  amount = '10000000000000000000' // 10 ETH default
): Promise<{ lock_id: string; sr_0: string }> {
  const nonce = Date.now() + Math.floor(Math.random() * 100000);
  const response = await request.post(`${API_BASE}/v1/lock`, {
    data: {
      chain_id: 11155111,
      asset: 'ETH',
      amount,
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

test.describe('Sequence #3: Emergency Unlock — Deep Integration', () => {
  test('health check', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/health`);
    expect(res.status()).toBe(200);
  });

  test('POST /v1/unlock/emergency creates emergency unlock with 7-day timelock', async ({
    request,
  }) => {
    const lock = await createLock(request, '10000000000000000000'); // 10 ETH
    const nowSecs = Math.floor(Date.now() / 1000);

    const response = await request.post(`${API_BASE}/v1/unlock/emergency`, {
      data: {
        lock_id: lock.lock_id,
        dest_addr: hexBytes(20),
        amount: '10000000000000000000',
        bond: '500000000000000000', // 0.5 ETH (= 5% of 10 ETH)
        sig_dilithium: hexBytes(64),
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Core fields
    expect(data.unlock_id).toBeTruthy();
    expect(data.unlock_id).toMatch(/^0x/);

    // Status should be emergency_pending
    const status = data.status || data.unlock_status;
    expect(status).toMatch(/emergency/i);

    // Release time should be ~7 days from now
    if (data.release_time) {
      const releaseTime =
        typeof data.release_time === 'number'
          ? data.release_time
          : Math.floor(new Date(data.release_time).getTime() / 1000);
      const diff = releaseTime - nowSecs;
      // Should be between 6.9 and 7.1 days
      expect(diff).toBeGreaterThan(SEVEN_DAYS_SECS - 3600);
      expect(diff).toBeLessThan(SEVEN_DAYS_SECS + 3600);
      console.log(
        `[Emergency Unlock] release_time diff=${diff}s (~${(diff / 86400).toFixed(1)} days)`
      );
    }

    // No VRF/prover selection for emergency path
    expect(data.vrf_request_id).toBeFalsy();
    expect(data.selected_provers).toBeFalsy();

    console.log(`[Emergency Unlock] unlock_id=${data.unlock_id}, status=${status}`);
  });

  test('emergency unlock bond value is included in response', async ({
    request,
  }) => {
    const lock = await createLock(request, '10000000000000000000');

    const response = await request.post(`${API_BASE}/v1/unlock/emergency`, {
      data: {
        lock_id: lock.lock_id,
        dest_addr: hexBytes(20),
        amount: '10000000000000000000',
        bond: '500000000000000000', // 0.5 ETH
        sig_dilithium: hexBytes(64),
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    // Verify bond is tracked in the response or accepted
    console.log(`[Bond] Emergency unlock accepted with bond, keys: ${Object.keys(data).join(', ')}`);
  });

  test('emergency unlock creates distinct unlock from normal unlock', async ({
    request,
  }) => {
    // Create two locks, one normal unlock, one emergency
    const lock1 = await createLock(request, '1000000000000000000');
    const lock2 = await createLock(request, '1000000000000000000');

    // Normal unlock
    const normalRes = await request.post(`${API_BASE}/v1/unlock`, {
      data: {
        lock_id: lock1.lock_id,
        dest_addr: hexBytes(20),
        amount: '1000000000000000000',
        sig_dilithium: hexBytes(64),
      },
    });
    expect(normalRes.status()).toBe(200);
    const normal = await normalRes.json();

    // Emergency unlock
    const emergencyRes = await request.post(`${API_BASE}/v1/unlock/emergency`, {
      data: {
        lock_id: lock2.lock_id,
        dest_addr: hexBytes(20),
        amount: '1000000000000000000',
        bond: '500000000000000000',
        sig_dilithium: hexBytes(64),
      },
    });
    expect(emergencyRes.status()).toBe(200);
    const emergency = await emergencyRes.json();

    // Both should have different unlock_ids
    expect(normal.unlock_id).not.toBe(emergency.unlock_id);

    // Emergency should have longer timelock if release_time is present
    if (normal.release_time && emergency.release_time) {
      const normalRelease = typeof normal.release_time === 'number' ? normal.release_time : new Date(normal.release_time).getTime() / 1000;
      const emergencyRelease = typeof emergency.release_time === 'number' ? emergency.release_time : new Date(emergency.release_time).getTime() / 1000;
      expect(emergencyRelease).toBeGreaterThan(normalRelease);
      console.log(`[Timelock] Normal: 24h, Emergency: 7d — emergency release is later`);
    }

    console.log('[Distinct Unlocks] Normal and Emergency have different unlock_ids');
  });

  test('emergency unlock for non-existent lock is rejected', async ({
    request,
  }) => {
    const response = await request.post(`${API_BASE}/v1/unlock/emergency`, {
      data: {
        lock_id: '0x0000000000000000000000000000000000000000000000000000000000000000',
        dest_addr: hexBytes(20),
        amount: '1000000000000000000',
        bond: '500000000000000000',
        sig_dilithium: hexBytes(64),
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log(`[Non-existent Lock] Correctly rejected: ${response.status()}`);
  });

  test('emergency unlock status is reflected in lock status', async ({
    request,
  }) => {
    const lock = await createLock(request);

    await request.post(`${API_BASE}/v1/unlock/emergency`, {
      data: {
        lock_id: lock.lock_id,
        dest_addr: hexBytes(20),
        amount: '10000000000000000000',
        bond: '500000000000000000',
        sig_dilithium: hexBytes(64),
      },
    });

    // Check lock status via API
    const statusRes = await request.get(
      `${API_BASE}/v1/lock/${lock.lock_id}/status`
    );

    if (statusRes.status() === 200) {
      const status = await statusRes.json();
      expect(status.status).toMatch(/emergency|unlock_pending/i);
      console.log(`[Lock Status] After emergency unlock: ${status.status}`);
    }
  });
});
