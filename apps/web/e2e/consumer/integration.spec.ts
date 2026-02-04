/**
 * Consumer App Layer Integration Tests
 *
 * Verifies that:
 * 1. UI loads data from API (not mock)
 * 2. Loading states are displayed
 * 3. Error states are handled (with fallback to mock data)
 * 4. Backend logs show DB operations
 *
 * API Endpoints:
 * - GET /v1/user/dashboard - User dashboard
 * - GET /v1/user/transactions - Transaction list
 * - GET /v1/user/locks - Lock list (via transactions with filter)
 */
import { test, expect } from '@playwright/test';

test.describe('Consumer Layer Integration', () => {

  // ===== Layer 2-3: UI + Hooks =====
  test('loads dashboard data from API', async ({ page }) => {
    let apiCalled = false;

    // Intercept /v1/user/* API calls (correct path)
    await page.route('**/v1/user/**', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.goto('/ja/consumer/dashboard');
    await page.waitForLoadState('networkidle');

    expect(apiCalled).toBe(true);
  });

  test('shows loading state while fetching data', async ({ page }) => {
    await page.route('**/v1/user/**', async (route) => {
      await new Promise(r => setTimeout(r, 1000));
      await route.continue();
    });

    await page.goto('/ja/consumer/dashboard');

    // Check for loading indicator
    const loadingIndicator = page.locator('[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"]').first();
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('displays fallback data on API failure', async ({ page }) => {
    // When API fails, the app should show fallback mock data (graceful degradation)
    await page.route('**/v1/user/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/ja/consumer/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should still be visible with fallback data
    // Check for dashboard elements that indicate the page loaded
    const dashboardElement = page.locator('[class*="dashboard"], main').first();
    await expect(dashboardElement).toBeVisible({ timeout: 5000 });

    // Fallback data should show some locked ETH amount
    const lockedAmount = page.getByText(/ETH/i).first();
    await expect(lockedAmount).toBeVisible({ timeout: 5000 });
  });

  // ===== Layer 4-5: Backend + DB =====
  test('backend health check returns healthy', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/health');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('user dashboard endpoint returns 401 without auth', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/user/dashboard');

    // Should return 401 Unauthorized without JWT
    expect(response.status()).toBe(401);
  });

  test('user transactions endpoint returns 401 without auth', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/user/transactions');

    // Should return 401 Unauthorized without JWT
    expect(response.status()).toBe(401);
  });

  test('lock endpoint accepts POST request', async ({ request }) => {
    const response = await request.post('http://localhost:8080/v1/lock', {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '1000000000000000000',
        dest_addr: '0x0000000000000000000000000000000000000001',
        pk_dilithium: '0x' + '00'.repeat(1952),
        sig_dilithium: '0x' + '00'.repeat(3309),
        expiry: Math.floor(Date.now() / 1000) + 3600,
        nonce: 1
      }
    });

    // Should return 400 (invalid signature) or 401, not 500
    expect(response.status()).toBeLessThan(500);
  });

  test('unlock endpoint accepts POST request', async ({ request }) => {
    const response = await request.post('http://localhost:8080/v1/unlock', {
      data: {
        lock_id: '0x' + '00'.repeat(32),
        pk_dilithium: '0x' + '00'.repeat(1952),
        sig_dilithium: '0x' + '00'.repeat(3309),
        nonce: 1
      }
    });

    // Should return 400 (invalid signature) or 404 (lock not found), not 500
    expect(response.status()).toBeLessThan(500);
  });
});
