/**
 * QS Admin TX Monitor E2E Tests
 *
 * Note: /ja/qs-admin/tx-monitor does NOT exist as a route.
 * Transaction monitoring is done through /ja/qs-admin/transactions
 * This test file tests the transactions overview page instead.
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Transactions Monitor', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/transactions');
  });

  test('should load transactions page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display transaction content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const content = page.locator('table, [class*="card"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('should have navigation links', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const links = page.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
  });
});
