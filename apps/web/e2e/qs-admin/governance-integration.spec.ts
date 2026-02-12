/**
 * QS Admin Governance Integration Tests
 *
 * Tests governance pages integration:
 * - /ja/qs-admin/governance
 * - /ja/qs-admin/governance/proposals
 * - /ja/qs-admin/governance/voting
 */

import { test, expect } from '../fixtures/admin-auth';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('QS Admin Governance Dashboard - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/governance');
  });

  test('should load governance dashboard', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display stat cards', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const cards = page.locator('.grid > div');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
  });

  test('should display proposals table', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display proposal rows', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const rows = page.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });
});

test.describe('QS Admin Proposals List - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/governance/proposals');
  });

  test('should load proposals list page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display proposals table', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display table headers', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const headers = page.locator('th');
    expect(await headers.count()).toBeGreaterThan(0);
  });
});

test.describe('QS Admin Voting Status - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-admin/governance/voting');
  });

  test('should load voting status page', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display stat cards', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    const cards = page.locator('.grid > div');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
  });

  test('should display voting content', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    // Should have cards or content beyond stats
    const content = page.locator('[class*="card"], .grid > div');
    expect(await content.count()).toBeGreaterThan(0);
  });
});
