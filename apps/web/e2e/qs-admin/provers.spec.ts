/**
 * QS Admin Prover Management E2E Tests
 *
 * Tests prover pages:
 * - /ja/qs-admin/prover (dashboard)
 * - /ja/qs-admin/prover/list
 * - /ja/qs-admin/prover/requests
 * Note: /ja/qs-admin/provers does NOT exist - the route is /ja/qs-admin/prover
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Prover Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/prover');
  });

  test('should load prover dashboard', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const cards = page.locator('[class*="card"], .grid > div');
    expect(await cards.count()).toBeGreaterThan(0);
  });
});

test.describe('QS Admin Prover List', () => {
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
});

test.describe('QS Admin Prover Requests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/prover/requests');
  });

  test('should load prover requests page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display requests content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const content = page.locator('table, [class*="card"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
