/**
 * QS Admin Observer Management E2E Tests (Phase 8-E)
 *
 * ## Coverage
 * - Screen 07-10: Observer List, Detail, Application Review
 *
 * ## BE Rules Compliance
 * - BE-001: Real API endpoints (no stubs)
 * - BE-002: No test-specific modifications
 * - BE-003: All API calls logged
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Observer Management', () => {
  test.describe('Observer List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/observers');
    });

    test('should display observer list page', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /Observer.*管理|Management/i, level: 1 })).toBeVisible();

      // Stats
      await expect(page.getByText(/Active|アクティブ/)).toBeVisible();

      console.log(`[TEST LOG] Observer list loaded, API calls: ${apiLogs.length}`);
    });

    test('should display observer table', async ({ page }) => {
      await expect(page.getByText(/Observer ID|ID/i)).toBeVisible();
      await expect(page.getByText(/Status|ステータス/i)).toBeVisible();

      const tableRows = page.locator('tbody tr');
      await expect(tableRows.first()).toBeVisible();
    });

    test('should filter observers', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: /Status|ステータス/i });
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('active');
        await expect(page.locator('tbody tr').first()).toBeVisible();
      }
    });

    test('should navigate to observer detail', async ({ page }) => {
      const observerRow = page.locator('tbody tr').first();
      await observerRow.click();
      await expect(page).toHaveURL(/\/qs-admin\/observers\/[\w-]+/);
    });
  });

  test.describe('Observer Detail', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/observers/observer-001');
    });

    test('should display observer detail page', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/Observer ID|ID/i)).toBeVisible();
      await expect(page.getByText(/Status|ステータス/i)).toBeVisible();
    });

    test('should display performance metrics', async ({ page }) => {
      await expect(page.getByText(/Challenge Success Rate|チャレンジ成功率/i)).toBeVisible();
      await expect(page.getByText(/Earnings|収益/i)).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Suspend|停止/i })).toBeVisible();
    });
  });

  test.describe('Application Review', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/observers/applications');
    });

    test('should display application list', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Application|申請/i, level: 1 })).toBeVisible();
    });

    test('should have approve/reject buttons', async ({ page }) => {
      const applicationRow = page.locator('[data-testid="application-row"]').first();
      if (await applicationRow.isVisible()) {
        await applicationRow.click();
        await expect(page.getByRole('button', { name: /Approve|承認/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Reject|却下/i })).toBeVisible();
      }
    });
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/qs-admin/observers');
      await expect(page.getByRole('heading', { name: 'Observer Management', level: 1 })).toBeVisible();
    });
  });
});
