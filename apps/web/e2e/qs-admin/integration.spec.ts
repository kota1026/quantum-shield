/**
 * QS Admin Layer Integration Tests
 *
 * Basic integration tests verifying pages load correctly.
 */

import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Layer Integration', () => {
  test('loads dashboard page', async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/dashboard');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('shows content on dashboard', async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/dashboard');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    // Should have cards or content
    const cards = page.locator('[class*="card"], .grid > div');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('shows fallback data when API fails', async ({ page }) => {
    await page.route('**/api/admin/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await gotoAndWaitForApp(page, '/ja/qs-admin/dashboard');

    // Should still show some content (fallback data)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('transactions page loads', async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/transactions');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('prover page loads', async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/prover');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});
