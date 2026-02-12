/**
 * QS Admin Members Integration Tests
 *
 * Tests members pages integration:
 * - /ja/qs-admin/members
 * - /ja/qs-admin/members/roles
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Members Dashboard - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/members');
  });

  test('should load members dashboard', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display stat cards', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const cards = page.locator('.grid > div');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
  });

  test('should display members table', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display member rows', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const rows = page.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should display table headers', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const headers = page.locator('th');
    expect(await headers.count()).toBeGreaterThan(0);
  });
});

test.describe('QS Admin Roles Management - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/members/roles');
  });

  test('should load roles management page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display roles content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const content = page.locator('table, [class*="card"], .grid > div').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('should display permissions table', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });
});
