/**
 * QS Admin Challenge Transactions Integration Tests
 *
 * Tests the challenge transactions page integration.
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Challenge Transactions - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/transactions/challenge');
  });

  test('should load challenge transactions page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display challenge transactions table', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display transaction rows', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    const rows = page.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should display stats section', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const cards = page.locator('[class*="card"], .grid > div');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/api/admin/transactions/challenges/**', (route) => {
      route.abort('failed');
    });
    await page.goto('/ja/qs-admin/transactions/challenge');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});
