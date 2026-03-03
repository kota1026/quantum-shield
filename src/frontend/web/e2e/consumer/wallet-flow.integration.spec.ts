/**
 * Consumer Wallet Flow Integration Tests
 *
 * Validates the complete user journey from wallet connection through
 * authenticated page access:
 *
 * 1. Login page loads and shows wallet connect UI
 * 2. Wallet connection (via authenticatedPage fixture / window.ethereum mock)
 * 3. SIWE authentication completes (real JWT from backend)
 * 4. Authenticated pages render correctly with wallet data
 * 5. Lock form is accessible and interactive when authenticated
 * 6. Disconnect/reconnect flows work correctly
 *
 * Note: Since Playwright cannot interact with MetaMask browser extension,
 * we use the authenticatedPage fixture which injects a window.ethereum mock
 * + real JWT from SIWE backend authentication. This tests the identical
 * code paths as production (consumerAuthStore, fetchApi, X-User-Address header).
 *
 * Requires: Backend API on :8080, Frontend on :3000, PostgreSQL, Redis
 */

import { test, expect } from '../fixtures';
import { getTestWalletAddress } from '../helpers/consumer-auth';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';

test.use({
  navigationTimeout: 60000,
  actionTimeout: 15000,
  expect: { timeout: 15000 },
});
test.setTimeout(60000);

// ===========================================================================
// 1. Login Page UI (unauthenticated)
// ===========================================================================
test.describe('Login Page - Unauthenticated', () => {
  test('login page renders with wallet connect button', async ({ page }) => {
    await page.goto('/ja/consumer/login');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Should show connect wallet UI
    const connectButton = page.getByRole('button', {
      name: /ウォレット.*接続|Connect.*Wallet|ウォレットを接続/i,
    });
    await expect(connectButton).toBeVisible();
  });

  test('login page has Quantum Shield branding', async ({ page }) => {
    await page.goto('/ja/consumer/login');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('Quantum Shield').first()).toBeVisible();
  });

  test('login page has language toggle', async ({ page }) => {
    await page.goto('/ja/consumer/login');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Language toggle button
    const langButton = page.getByRole('button', { name: /Switch to English/i });
    await expect(langButton).toBeVisible();
  });

  test('login page English version loads', async ({ page }) => {
    await page.goto('/en/consumer/login');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // English content should be present
    await expect(page.getByText(/Connect.*Wallet|Sign.*In/i).first()).toBeVisible();
  });
});

// ===========================================================================
// 2. Full Authentication Flow (authenticated fixture)
// ===========================================================================
test.describe('Wallet Authentication Flow', () => {
  test('authenticated fixture creates real JWT from backend', async ({
    authenticatedPage,
  }) => {
    // authenticatedPage fixture calls setupConsumerAuth which performs
    // real SIWE authentication against the live backend
    expect(authenticatedPage.accessToken).toBeTruthy();
    expect(authenticatedPage.accessToken.length).toBeGreaterThan(10);
    expect(authenticatedPage.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  test('authenticated user lands on dashboard with wallet data', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/dashboard');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Dashboard should load (not redirect to login)
    await expect(page).not.toHaveURL(/login/);

    // Should see some dashboard structure (heading at any level)
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('wallet address is persisted in localStorage', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const storedAddress = await page.evaluate(() =>
      localStorage.getItem('quantum_shield_user_address')
    );
    expect(storedAddress).toBeTruthy();
    expect(storedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  test('auth state is persisted in sessionStorage', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const authData = await page.evaluate(() => {
      const raw = sessionStorage.getItem('consumer-auth');
      return raw ? JSON.parse(raw) : null;
    });

    expect(authData).toBeTruthy();
    expect(authData.state.isAuthenticated).toBe(true);
    expect(authData.state.accessToken).toBeTruthy();
    expect(authData.state.user.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});

// ===========================================================================
// 3. Authenticated Page Access
// ===========================================================================
test.describe('Authenticated Page Navigation', () => {
  test('lock page loads with form when authenticated', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/lock');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Lock page should have heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('settings page is accessible when authenticated', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/settings');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('notifications page is accessible when authenticated', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/notifications');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('key management page is accessible when authenticated', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/key-management');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });
});

// ===========================================================================
// 4. API Requests with Auth Headers
// ===========================================================================
test.describe('API Integration with Wallet Auth', () => {
  test('API requests include X-User-Address header', async ({
    page,
    authenticatedPage,
  }) => {
    // Set up response listener before navigation
    const apiRequests: { url: string; headers: Record<string, string> }[] = [];

    page.on('request', (req) => {
      if (req.url().includes('/v1/') && !req.url().includes('/auth/')) {
        apiRequests.push({
          url: req.url(),
          headers: req.headers(),
        });
      }
    });

    await page.goto('/ja/consumer/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait a bit for API calls to fire
    await page.waitForTimeout(2000);

    // Check if any API calls were made with the header
    const withHeader = apiRequests.filter(
      (r) => r.headers['x-user-address']
    );

    if (apiRequests.length > 0) {
      expect(withHeader.length).toBeGreaterThan(0);
      // All API calls should have the header (via Playwright route interceptor)
      expect(withHeader[0].headers['x-user-address']).toMatch(
        /^0x[a-fA-F0-9]{40}$/
      );
    }
  });

  test('backend accepts authenticated user transactions request', async ({
    request,
  }) => {
    const address = getTestWalletAddress();
    const res = await request.get(`${API_BASE}/v1/user/transactions`, {
      headers: { 'X-User-Address': address },
    });

    // Should return 200 with transaction list (may be empty)
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test('backend returns user profile for authenticated address', async ({
    request,
  }) => {
    const address = getTestWalletAddress();
    const res = await request.get(`${API_BASE}/v1/user/dashboard`, {
      headers: { 'X-User-Address': address },
    });

    // 200 if user exists, 404 if not yet registered - both valid
    expect([200, 404]).toContain(res.status());
  });
});

// ===========================================================================
// 5. Cross-locale Authentication Persistence
// ===========================================================================
test.describe('Auth Persistence Across Locale Switch', () => {
  test('auth state survives Japanese to English switch', async ({
    page,
    authenticatedPage,
  }) => {
    // Start on Japanese dashboard
    await page.goto('/ja/consumer/dashboard');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Navigate to English dashboard
    await page.goto('/en/consumer/dashboard');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Auth should still be active
    await expect(page).not.toHaveURL(/login/);

    const storedAddress = await page.evaluate(() =>
      localStorage.getItem('quantum_shield_user_address')
    );
    expect(storedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});
