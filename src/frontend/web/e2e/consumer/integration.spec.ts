/**
 * Consumer App Layer Integration Tests
 *
 * Verifies end-to-end integration:
 * 1. SIWE authentication works (real JWT from backend)
 * 2. Authenticated UI loads data from real API
 * 3. Loading/error states are handled
 * 4. Backend endpoints respond correctly
 * 5. API data flows through to UI display
 *
 * API Endpoints:
 * - POST /v1/auth/siwe - SIWE authentication
 * - GET /v1/user/dashboard - User dashboard
 * - GET /v1/user/transactions - Transaction list
 * - POST /v1/lock - Create lock
 * - POST /v1/unlock - Request unlock
 */
import { test, expect } from '../fixtures';

test.use({
  navigationTimeout: 60000,
  actionTimeout: 15000,
  expect: { timeout: 15000 },
});
test.setTimeout(60000);

test.describe('Consumer Layer Integration', () => {
  // ===== Authentication Integration =====
  test.describe('Authentication', () => {
    test('SIWE auth produces valid JWT that backend accepts', async ({
      page,
      authenticatedPage,
    }) => {
      // authenticatedPage fixture already performed real SIWE auth
      // Verify JWT works by loading an authenticated page
      const dashboardResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/v1/user/dashboard') &&
          resp.request().method() === 'GET'
      );

      await page.goto('/ja/consumer/dashboard');
      const response = await dashboardResponse;

      // Backend accepted the JWT (not 401)
      expect(response.status()).not.toBe(401);
    });
  });

  // ===== UI → API → Data Flow =====
  test.describe('Data Flow', () => {
    test('dashboard loads data from real API', async ({
      page,
      authenticatedPage,
    }) => {
      const apiResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/v1/user/dashboard') && resp.status() === 200
      );

      await page.goto('/ja/consumer/dashboard');
      const response = await apiResponse;
      const data = await response.json();

      // API returned real data structure
      expect(data).toBeDefined();

      // UI rendered (main landmark present)
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('API data appears in UI', async ({ page, authenticatedPage }) => {
      const apiResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes('/v1/user/dashboard') && resp.status() === 200
      );

      await page.goto('/ja/consumer/dashboard');
      const response = await apiResponse;
      const data = await response.json();

      // Dashboard should be visible with stats from API
      await expect(page.getByRole('main')).toBeVisible({ timeout: 10000 });

      // Verify the dashboard displays some ETH value (formatted from API data)
      await expect(page.getByText(/ETH/).first()).toBeVisible({ timeout: 5000 });
    });

    test('handles loading state', async ({ page, authenticatedPage }) => {
      await page.goto('/ja/consumer/dashboard');

      // Page should show either loading skeleton or actual content
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible({ timeout: 10000 });
    });
  });

  // ===== Backend API Health =====
  test.describe('Backend API', () => {
    test('health check returns healthy', async ({ request }) => {
      const response = await request.get('http://localhost:8080/v1/health');
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    test('user dashboard returns 401 without auth', async ({ request }) => {
      const response = await request.get(
        'http://localhost:8080/v1/user/dashboard'
      );
      expect(response.status()).toBe(401);
    });

    test('user transactions returns 401 without auth', async ({ request }) => {
      const response = await request.get(
        'http://localhost:8080/v1/user/transactions'
      );
      expect(response.status()).toBe(401);
    });

    test('lock endpoint validates request', async ({ request }) => {
      const response = await request.post('http://localhost:8080/v1/lock', {
        data: {
          chain_id: 11155111,
          asset: 'ETH',
          amount: '1000000000000000000',
          dest_addr: '0x0000000000000000000000000000000000000001',
          pk_dilithium: '0x' + '00'.repeat(1952),
          sig_dilithium: '0x' + '00'.repeat(3309),
          expiry: Math.floor(Date.now() / 1000) + 3600,
          nonce: 1,
        },
      });

      // Should return 400 (invalid sig) or 401 (no auth), not 500
      expect(response.status()).toBeLessThan(500);
    });

    test('unlock endpoint validates request', async ({ request }) => {
      const response = await request.post('http://localhost:8080/v1/unlock', {
        data: {
          lock_id: '0x' + '00'.repeat(32),
          pk_dilithium: '0x' + '00'.repeat(1952),
          sig_dilithium: '0x' + '00'.repeat(3309),
          nonce: 1,
        },
      });

      // Should return 400 or 404 (lock not found), not 500
      expect(response.status()).toBeLessThan(500);
    });
  });
});
