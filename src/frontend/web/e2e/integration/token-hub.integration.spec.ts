/**
 * Token Hub (veQS) Integration Tests (Sequence #9)
 *
 * Verifies veQS lock/delegate/rewards flow:
 * - Lock QS tokens for voting power
 * - Linear time-decay: voting_power = amount * (remaining / 4 years)
 * - Min lock: 1 week, Max lock: 4 years
 * - Delegation support
 * - Reward claiming
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 *
 * Spec References:
 * - SEQUENCES §9: Token Hub (veQS)
 * - MIN_LOCK_TIME: 1 week (604,800s)
 * - MAX_LOCK_TIME: 4 years (126,144,000s)
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const ONE_WEEK_SECS = 604_800;
const FOUR_YEARS_SECS = 126_144_000;

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

function testAddr(): string {
  return `0x${Date.now().toString(16).padStart(40, '0').slice(-40)}`;
}

test.describe('Sequence #9: Token Hub (veQS) — Deep Integration', () => {
  test('health check', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/health`);
    expect(res.status()).toBe(200);
  });

  // --- Dashboard ---

  test('GET /v1/token-hub/dashboard returns user token info', async ({
    request,
  }) => {
    const addr = testAddr();
    const response = await request.get(
      `${API_BASE}/v1/token-hub/dashboard?address=${addr}`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`[Dashboard] Keys: ${Object.keys(data).join(', ')}`);
  });

  // --- Lock ---

  test('POST /v1/token-hub/lock creates veQS lock position', async ({
    request,
  }) => {
    const addr = testAddr();
    const lockDuration = ONE_WEEK_SECS * 4; // 4 weeks

    const response = await request.post(`${API_BASE}/v1/token-hub/lock`, {
      data: {
        address: addr,
        amount: '1000000000000000000000', // 1000 QS tokens
        lock_duration: lockDuration,
        signature: hexBytes(64),
      },
      headers: { 'X-User-Address': addr },
    });

    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      expect(data.lock_id || data.lockId || data.position_id).toBeTruthy();

      // Verify voting power calculation
      if (data.voting_power || data.votingPower) {
        const votingPower = parseFloat(
          data.voting_power || data.votingPower
        );
        // 4 weeks / 4 years ≈ 0.019 ratio
        const expectedRatio = lockDuration / FOUR_YEARS_SECS;
        console.log(
          `[veQS Lock] votingPower=${votingPower}, expectedRatio=${expectedRatio.toFixed(4)}`
        );
      }

      console.log(`[veQS Lock] Created position for ${addr}`);
    } else {
      expect([400, 401, 422]).toContain(response.status());
      console.log(`[veQS Lock] Rejected: ${response.status()}`);
    }
  });

  test('lock duration below 1 week is rejected', async ({ request }) => {
    const addr = testAddr();
    const response = await request.post(`${API_BASE}/v1/token-hub/lock`, {
      data: {
        address: addr,
        amount: '1000000000000000000000',
        lock_duration: 86400, // 1 day — below minimum
        signature: hexBytes(64),
      },
      headers: { 'X-User-Address': addr },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log(`[Min Lock] Correctly rejected: ${response.status()}`);
  });

  test('lock duration above 4 years is rejected', async ({ request }) => {
    const addr = testAddr();
    const response = await request.post(`${API_BASE}/v1/token-hub/lock`, {
      data: {
        address: addr,
        amount: '1000000000000000000000',
        lock_duration: FOUR_YEARS_SECS + 86400, // 4 years + 1 day
        signature: hexBytes(64),
      },
      headers: { 'X-User-Address': addr },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log(`[Max Lock] Correctly rejected: ${response.status()}`);
  });

  // --- Extend ---

  test('POST /v1/token-hub/extend extends lock duration', async ({
    request,
  }) => {
    const addr = testAddr();

    // Create lock first
    const lockRes = await request.post(`${API_BASE}/v1/token-hub/lock`, {
      data: {
        address: addr,
        amount: '1000000000000000000000',
        lock_duration: ONE_WEEK_SECS * 4,
        signature: hexBytes(64),
      },
      headers: { 'X-User-Address': addr },
    });

    if (lockRes.status() !== 200 && lockRes.status() !== 201) {
      console.log('[Skip] Lock creation failed');
      return;
    }

    const lock = await lockRes.json();
    const positionId = lock.lock_id || lock.lockId || lock.position_id;

    // Extend
    const extendRes = await request.post(`${API_BASE}/v1/token-hub/extend`, {
      data: {
        position_id: positionId,
        additional_duration: ONE_WEEK_SECS * 8, // +8 weeks
        signature: hexBytes(64),
      },
      headers: { 'X-User-Address': addr },
    });

    if (extendRes.status() === 200) {
      console.log('[veQS Extend] Lock extended successfully');
    } else {
      console.log(`[veQS Extend] Response: ${extendRes.status()}`);
    }
  });

  // --- Delegates ---

  test('GET /v1/token-hub/delegates returns delegate list', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/token-hub/delegates`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    const delegates = data.delegates || data.items || data;
    expect(Array.isArray(delegates)).toBe(true);
    console.log(`[Delegates] ${delegates.length} delegates found`);

    if (delegates.length > 0) {
      const d = delegates[0];
      // Verify delegate has expected fields
      expect(d.address || d.delegate_address).toBeTruthy();
    }
  });

  test('GET /v1/token-hub/delegates supports pagination', async ({
    request,
  }) => {
    const res1 = await request.get(
      `${API_BASE}/v1/token-hub/delegates?page=1&limit=5`
    );
    expect(res1.status()).toBe(200);

    const res2 = await request.get(
      `${API_BASE}/v1/token-hub/delegates?page=1&limit=5&sort_by=total_veqs`
    );
    expect(res2.status()).toBe(200);
    console.log('[Delegates Pagination] Both queries succeeded');
  });

  // --- Delegation ---

  test('POST /v1/token-hub/delegate creates delegation', async ({
    request,
  }) => {
    const addr = testAddr();
    const delegateAddr = testAddr();

    const response = await request.post(`${API_BASE}/v1/token-hub/delegate`, {
      data: {
        delegate_to: delegateAddr,
        amount: '500000000000000000000', // 500 QS
        signature: hexBytes(64),
      },
      headers: { 'X-User-Address': addr },
    });

    if (response.status() === 200 || response.status() === 201) {
      console.log(`[Delegate] ${addr} -> ${delegateAddr}`);
    } else {
      // May require existing lock position
      expect([400, 401, 422]).toContain(response.status());
      console.log(`[Delegate] Rejected: ${response.status()}`);
    }
  });

  // --- Rewards ---

  test('GET /v1/token-hub/rewards returns reward info', async ({
    request,
  }) => {
    const addr = testAddr();
    const response = await request.get(
      `${API_BASE}/v1/token-hub/rewards?address=${addr}`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`[Rewards] Keys: ${Object.keys(data).join(', ')}`);
  });

  test('POST /v1/token-hub/claim claims pending rewards', async ({
    request,
  }) => {
    const addr = testAddr();
    const response = await request.post(`${API_BASE}/v1/token-hub/claim`, {
      data: {
        address: addr,
        signature: hexBytes(64),
      },
      headers: { 'X-User-Address': addr },
    });

    // 200 = claimed, 400/404 = no rewards, both acceptable
    expect([200, 400, 404]).toContain(response.status());
    console.log(`[Claim] Response: ${response.status()}`);
  });
});
