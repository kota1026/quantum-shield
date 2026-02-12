/**
 * QS Admin Treasury Wallets Integration Tests
 *
 * Tests the treasury wallets page at /ja/qs-admin/treasury/wallets
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Treasury Wallets - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/treasury/wallets');
  });

  test('should load treasury wallets page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display wallets content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const content = page.locator('[class*="card"], [class*="border"], .rounded-lg').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const cards = page.locator('.grid > div');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should display back link', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const links = page.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
  });
});
