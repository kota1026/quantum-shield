/**
 * QS Admin Prover Detail Integration Tests
 *
 * Tests the prover detail page at /ja/qs-admin/prover/list/PV-001
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Prover Detail - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/prover/list/PV-001');
  });

  test('should load prover detail page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display prover info', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const content = page.locator('[class*="card"], .rounded-lg').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('should display back link', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const links = page.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/api/admin/provers/**', (route) => {
      route.abort('failed');
    });
    await page.goto('/ja/qs-admin/prover/list/PV-001');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});
