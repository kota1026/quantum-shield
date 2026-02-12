/**
 * QS Admin Audit & System E2E Tests
 *
 * Note: /ja/qs-admin/audit, /ja/qs-admin/settings, /ja/qs-admin/staff,
 * /ja/qs-admin/parameters do NOT exist as routes.
 *
 * Existing routes tested:
 * - /ja/qs-admin/treasury/audit (audit log)
 * - /ja/qs-admin/system (system dashboard)
 * - /ja/qs-admin/system/logs
 * - /ja/qs-admin/members (staff/members)
 * - /ja/qs-admin/analytics
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Treasury Audit Log', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/treasury/audit');
  });

  test('should load audit log page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display audit content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const content = page.locator('table, [class*="card"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

test.describe('QS Admin System', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/system');
  });

  test('should load system page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('QS Admin System Logs', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/system/logs');
  });

  test('should load system logs page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('QS Admin Members', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/members');
  });

  test('should load members page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display members content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const content = page.locator('table, [class*="card"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

test.describe('QS Admin Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/analytics');
  });

  test('should load analytics page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});
