/**
 * QS Admin Prover List Integration Tests
 *
 * Tests the prover list page at /ja/qs-admin/prover/list
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Prover List - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/prover/list');
  });

  test('should load prover list page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display prover table', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display prover rows', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    const rows = page.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should display table headers', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const headers = page.locator('th');
    expect(await headers.count()).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/api/admin/provers/**', (route) => {
      route.abort('failed');
    });
    await page.goto('/ja/qs-admin/prover/list');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});
