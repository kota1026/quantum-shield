/**
 * QS Admin Dashboard E2E Tests
 *
 * Tests the dashboard page at /ja/qs-admin/dashboard
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/dashboard');
  });

  test('should load dashboard page with heading', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display sidebar navigation', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('QS Admin').first()).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    // Stats cards should be present
    const cards = page.locator('[class*="card"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should have interactive elements', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const links = page.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
  });
});
