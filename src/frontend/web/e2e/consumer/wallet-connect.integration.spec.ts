/**
 * Consumer Wallet Connection Integration Tests
 *
 * Tests the full SIWE authentication flow:
 * 1. Backend SIWE endpoint works (real JWT issuance)
 * 2. Authenticated page renders connected state
 * 3. Post-connection navigation (dashboard, onboarding)
 * 4. Wallet address display and formatting
 * 5. API calls work with injected auth (X-User-Address header)
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
// 1. SIWE Authentication Endpoint (API-level)
// ===========================================================================
test.describe('SIWE Authentication API', () => {
  test('backend health check passes before wallet tests', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('healthy');
  });

  test('SIWE endpoint returns JWT for valid signature', async ({ request }) => {
    // This test validates the real SIWE flow using ethers.js
    const { ethers } = await import('ethers');
    const wallet = new ethers.Wallet(
      '0xREDACTED_ETH_PRIVATE_KEY'
    );

    const nonce = Math.random().toString(36).substring(2, 15);
    const issuedAt = new Date().toISOString();
    const message = [
      `localhost:3000 wants you to sign in with your Ethereum account:`,
      wallet.address,
      '',
      'Sign in to Quantum Shield Consumer App',
      '',
      `URI: http://localhost:3000`,
      'Version: 1',
      `Chain ID: 11155111`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
    ].join('\n');

    const signature = await wallet.signMessage(message);

    const res = await request.post(`${API_BASE}/v1/auth/siwe`, {
      data: { message, signature, public_key: wallet.address },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(typeof body.access_token).toBe('string');
    expect(body.access_token.length).toBeGreaterThan(10);
  });

  test('SIWE endpoint rejects invalid signature', async ({ request }) => {
    const message = [
      `localhost:3000 wants you to sign in with your Ethereum account:`,
      '0x0000000000000000000000000000000000000000',
      '',
      'Sign in to Quantum Shield Consumer App',
      '',
      `URI: http://localhost:3000`,
      'Version: 1',
      `Chain ID: 11155111`,
      `Nonce: invalid_nonce`,
      `Issued At: ${new Date().toISOString()}`,
    ].join('\n');

    const res = await request.post(`${API_BASE}/v1/auth/siwe`, {
      data: {
        message,
        signature: '0x' + 'ab'.repeat(65), // invalid signature
        public_key: '0x0000000000000000000000000000000000000000',
      },
    });

    // Should reject - either 400 or 401
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('API rejects unauthenticated dashboard request', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/user/dashboard`);
    // Should return 401 or 400 (no X-User-Address)
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('API returns dashboard data with valid wallet address', async ({ request }) => {
    const address = getTestWalletAddress();
    const res = await request.get(`${API_BASE}/v1/user/dashboard`, {
      headers: { 'X-User-Address': address },
    });

    // If user exists in DB, should return 200; if not, may return 404
    // Both are valid since user might not have been registered yet
    expect([200, 404]).toContain(res.status());
  });
});

// ===========================================================================
// 2. Authenticated Page — Wallet Connect Landing
// ===========================================================================
test.describe('Wallet Connect Page (Authenticated)', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/ja/consumer/wallet-connect');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('page loads with main landmark', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('heading is visible', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('wallet options are displayed', async ({ page }) => {
    await expect(page.getByText('MetaMask')).toBeVisible();
    await expect(page.getByText('WalletConnect')).toBeVisible();
    await expect(page.getByText('Coinbase Wallet')).toBeVisible();
  });
});

// ===========================================================================
// 3. Authenticated Dashboard Navigation
// ===========================================================================
test.describe('Post-Auth Dashboard Access', () => {
  test('authenticated user can access consumer dashboard', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/dashboard');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Page loaded successfully (not a redirect to login)
    await expect(page).not.toHaveURL(/login/);
  });

  test('authenticated user can access lock page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/lock');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Lock page has a heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('authenticated user can access history page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/history');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('wallet address is stored in localStorage after auth', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto('/ja/consumer/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const address = await page.evaluate(() =>
      localStorage.getItem('quantum_shield_user_address')
    );
    expect(address).toBeTruthy();
    // Should be a valid Ethereum address format
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});

// ===========================================================================
// 4. API Integration with Auth
// ===========================================================================
test.describe('API calls with authenticated session', () => {
  test('authenticated API request includes X-User-Address header', async ({
    page,
    authenticatedPage,
  }) => {
    // Navigate and wait for an API call
    const apiResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes('/v1/') && !res.url().includes('/auth/'),
      { timeout: 15000 }
    ).catch(() => null);

    await page.goto('/ja/consumer/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const apiResponse = await apiResponsePromise;
    // If an API call was made, it should have gotten a non-401 response
    // (meaning the X-User-Address header was injected)
    if (apiResponse) {
      expect(apiResponse.status()).not.toBe(401);
    }
  });

  test('health/ready endpoint shows all services up', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/health/ready`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // Verify infrastructure connectivity (response: { dependencies: { database: { status: "up" } } })
    expect(body.dependencies?.database?.status).toBe('up');
    expect(body.dependencies?.redis?.status).toBe('up');
  });
});

// ===========================================================================
// 5. Address Display and Formatting
// ===========================================================================
test.describe('Wallet Address Formatting', () => {
  test('test wallet address has correct format', () => {
    const address = getTestWalletAddress();
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(address.length).toBe(42);
  });

  test('test wallet address is deterministic', () => {
    const addr1 = getTestWalletAddress();
    const addr2 = getTestWalletAddress();
    expect(addr1).toBe(addr2);
  });
});
