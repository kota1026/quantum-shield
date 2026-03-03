/**
 * Token Hub Integration Tests (Sequence #9)
 *
 * Verifies the token hub flow: Dashboard → Lock → Delegate → Rewards
 * Tests real backend endpoints and frontend L/E/E states.
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 *
 * Spec References:
 * - SEQUENCES §9: Token Hub (veQS)
 * - L3 contracts: veQS, RewardRouter
 */
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080';

test.describe('Token Hub API Integration (Sequence #9)', () => {
  test('health check confirms backend is ready', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/health`);
    expect(response.status()).toBe(200);
  });

  test('GET /v1/token-hub/dashboard returns dashboard data', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/token-hub/dashboard`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();

    // Dashboard should include key metrics
    expect(
      typeof data.total_locked !== 'undefined' ||
        typeof data.totalLocked !== 'undefined' ||
        typeof data.tvl !== 'undefined'
    ).toBe(true);
  });

  test('GET /v1/token-hub/locks returns token locks', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/token-hub/locks`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    const locks = data.locks || data.items || data;
    expect(Array.isArray(locks)).toBe(true);
  });

  test('GET /v1/token-hub/delegates returns delegate list', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/token-hub/delegates`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    const delegates = data.delegates || data.items || data;
    expect(Array.isArray(delegates)).toBe(true);

    // If delegates exist, verify structure
    if (delegates.length > 0) {
      const delegate = delegates[0];
      expect(delegate.address || delegate.wallet_address || delegate.walletAddress).toBeTruthy();
    }
  });

  test('GET /v1/token-hub/rewards returns rewards data', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/token-hub/rewards`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test('GET /v1/token-hub/rewards/summary returns rewards summary', async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE}/v1/token-hub/rewards/summary`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test('GET /v1/token-hub/epoch returns current epoch info', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/token-hub/epoch`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
    expect(
      typeof data.current_epoch !== 'undefined' ||
        typeof data.currentEpoch !== 'undefined' ||
        typeof data.epoch !== 'undefined'
    ).toBe(true);
  });

  test('POST /v1/token-hub/lock creates a token lock', async ({ request }) => {
    const response = await request.post(`${API_BASE}/v1/token-hub/lock`, {
      data: {
        amount: '1000000000000000000', // 1 QS token
        duration: 7776000, // 90 days in seconds
        user_address: '0xabcdef1234567890abcdef1234567890abcdef12',
      },
    });

    // Should succeed or fail with validation (not 500)
    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeTruthy();
    }
  });

  test('POST /v1/token-hub/delegate delegates voting power', async ({
    request,
  }) => {
    const response = await request.post(`${API_BASE}/v1/token-hub/delegate`, {
      data: {
        delegate_to: '0x1234567890abcdef1234567890abcdef12345678',
        user_address: '0xabcdef1234567890abcdef1234567890abcdef12',
      },
    });

    // Should succeed or fail with validation (not 500)
    expect(response.status()).toBeLessThan(500);
  });

  test('POST /v1/token-hub/claim claims rewards', async ({ request }) => {
    const response = await request.post(`${API_BASE}/v1/token-hub/claim`, {
      data: {
        user_address: '0xabcdef1234567890abcdef1234567890abcdef12',
      },
    });

    // Should succeed or return "nothing to claim" (not 500)
    expect(response.status()).toBeLessThan(500);
  });

  test('GET /v1/token-hub/balance returns user balance', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/token-hub/balance`, {
      headers: {
        'X-User-Address': '0xabcdef1234567890abcdef1234567890abcdef12',
      },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test('GET /v1/token-hub/rewards/claimable returns claimable amount', async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE}/v1/token-hub/rewards/claimable`,
      {
        headers: {
          'X-User-Address': '0xabcdef1234567890abcdef1234567890abcdef12',
        },
      }
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test('GET /v1/token-hub/rewards/history returns reward history', async ({
    request,
  }) => {
    const response = await request.get(
      `${API_BASE}/v1/token-hub/rewards/history`,
      {
        headers: {
          'X-User-Address': '0xabcdef1234567890abcdef1234567890abcdef12',
        },
      }
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    const history = data.history || data.items || data;
    expect(Array.isArray(history)).toBe(true);
  });
});

test.describe('Token Hub Frontend L/E/E States', () => {
  test('shows loading state while fetching dashboard', async ({ page }) => {
    await page.route('**/v1/token-hub/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.continue();
    });

    await page.goto('/ja/token-hub/dashboard');

    const loadingIndicator = page
      .locator(
        '[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"], [role="status"]'
      )
      .first();
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/v1/token-hub/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/ja/token-hub/dashboard');
    await page.waitForLoadState('networkidle');

    const errorIndicator = page.getByText(/error|エラー|失敗/i);
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
  });

  test('dashboard page calls real API endpoints', async ({ page }) => {
    const apiCalls: string[] = [];

    await page.route('**/v1/token-hub/**', async (route) => {
      apiCalls.push(route.request().url());
      await route.continue();
    });

    await page.goto('/ja/token-hub/dashboard');
    await page.waitForLoadState('networkidle');

    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('lock page loads and makes API calls', async ({ page }) => {
    let apiCalled = false;

    await page.route('**/v1/token-hub/**', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.goto('/ja/token-hub/lock');
    await page.waitForLoadState('networkidle');

    expect(apiCalled).toBe(true);
  });

  test('rewards page loads and displays data', async ({ page }) => {
    let rewardsCalled = false;

    await page.route('**/v1/token-hub/rewards**', async (route) => {
      rewardsCalled = true;
      await route.continue();
    });

    await page.goto('/ja/token-hub/rewards');
    await page.waitForLoadState('networkidle');

    expect(rewardsCalled).toBe(true);
  });

  test('delegate page loads delegates list', async ({ page }) => {
    let delegateCalled = false;

    await page.route('**/v1/token-hub/delegate**', async (route) => {
      delegateCalled = true;
      await route.continue();
    });

    await page.goto('/ja/token-hub/delegate');
    await page.waitForLoadState('networkidle');

    expect(delegateCalled).toBe(true);
  });
});
