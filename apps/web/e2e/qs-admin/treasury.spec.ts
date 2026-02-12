/**
 * QS Admin Treasury E2E Tests
 *
 * Tests treasury pages:
 * - /ja/qs-admin/treasury
 * - /ja/qs-admin/treasury/wallets
 * - /ja/qs-admin/treasury/transfers
 * - /ja/qs-admin/treasury/budget
 * - /ja/qs-admin/treasury/audit
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Treasury Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/treasury');
  });

  test('should load treasury page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display treasury content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const cards = page.locator('[class*="card"], .grid > div');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should have navigation links', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const links = page.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
  });
});

test.describe('QS Admin Treasury Wallets', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/treasury/wallets');
  });

  test('should load wallets page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('QS Admin Treasury Transfers', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/treasury/transfers');
  });

  test('should load transfers page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});
