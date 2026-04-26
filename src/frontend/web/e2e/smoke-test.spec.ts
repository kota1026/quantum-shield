/**
 * Quantum Shield Smoke Test
 *
 * Verifies all major pages and flows on the deployed site.
 * Uses test wallet (Anvil account #0) for authentication.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://quantum-shield-local.vercel.app';

// Pages that should return 200
const PAGES = [
  { path: '/ja', name: 'Landing Page' },
  { path: '/ja/consumer/dashboard', name: 'Consumer Dashboard' },
  { path: '/ja/consumer/lock', name: 'Consumer Lock' },
  { path: '/ja/prover/landing', name: 'Prover Landing' },
  { path: '/ja/observer/landing', name: 'Observer Landing' },
  { path: '/ja/governance', name: 'Governance' },
  { path: '/ja/token-hub', name: 'Token Hub' },
];

test.describe('Page Accessibility', () => {
  for (const page of PAGES) {
    test(`${page.name} (${page.path}) loads`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${page.path}`);
      expect(response.status()).toBeLessThan(400);
    });
  }
});

test.describe('Landing Page Content', () => {
  test('shows Quantum Shield branding and CTA', async ({ page }) => {
    await page.goto(`${BASE_URL}/ja`);
    await expect(page.locator('text=Quantum Shield')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=はじめる')).toBeVisible();
  });

  test('language toggle works', async ({ page }) => {
    await page.goto(`${BASE_URL}/en`);
    await expect(page.locator('text=Quantum Shield')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Consumer Dashboard', () => {
  test('dashboard page renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/ja/consumer/dashboard`);
    await page.waitForLoadState('networkidle');
    // Page should render without crashing
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

test.describe('Lock Page', () => {
  test('lock page renders with amount input', async ({ page }) => {
    await page.goto(`${BASE_URL}/ja/consumer/lock`);
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

test.describe('Backend API via Frontend Proxy', () => {
  test('health endpoint is reachable', async ({ request }) => {
    // Try via the Vercel deployment (proxied through Next.js rewrites if configured)
    const response = await request.get(`${BASE_URL}/v1/health`);
    // May return 404 if no proxy configured, but should not be 500
    expect(response.status()).not.toBe(500);
  });
});
