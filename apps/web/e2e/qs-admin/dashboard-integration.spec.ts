/**
 * QS Admin Dashboard Integration Tests
 *
 * Tests the dashboard page integration with API hooks.
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Dashboard - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/dashboard');
  });

  test('should load dashboard with heading', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const cards = page.locator('[class*="card"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should display chart sections', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    // Charts or grid content should be visible
    const gridContent = page.locator('.grid > div');
    expect(await gridContent.count()).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/api/admin/dashboard/**', (route) => {
      route.abort('failed');
    });
    await page.goto('/ja/qs-admin/dashboard');
    // Should still display fallback data
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should log API calls', async ({ page, apiLogs }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    console.log(`[INTEGRATION] Dashboard API calls: ${apiLogs.length}`);
  });
});
