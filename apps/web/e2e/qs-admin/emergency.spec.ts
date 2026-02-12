/**
 * QS Admin Emergency Transactions E2E Tests
 *
 * Tests the emergency transactions page at /ja/qs-admin/transactions/emergency
 * Note: /ja/qs-admin/emergency does NOT exist as a route.
 * The actual emergency page is at /ja/qs-admin/transactions/emergency
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Emergency Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/transactions/emergency');
  });

  test('should load emergency transactions page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display page content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    // Should have some content (table or cards)
    const content = page.locator('table, [class*="card"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('should have navigation back link', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const links = page.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
  });
});
