import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('Admin Audit Log Page', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/audit');
  });

  test('should display page header with title', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Audit Log');
  });

  test('should display subtitle', async ({ page }) => {
    await expect(page.locator('text=全操作ログ・セキュリティイベント監査').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    await expect(page.locator('[role="tab"]').first()).toBeVisible();
    await expect(page.locator('text=All Logs').first()).toBeVisible();
    await expect(page.locator('text=User Activity').first()).toBeVisible();
    await expect(page.locator('text=Security Events').first()).toBeVisible();
    await expect(page.locator('text=System Events').first()).toBeVisible();
  });

  test('should show All Logs tab as active by default', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: 'All Logs' });
    await expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch tabs on click', async ({ page }) => {
    const userTab = page.getByRole('tab', { name: 'User Activity' });
    await userTab.click();
    await expect(userTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display logs table', async ({ page }) => {
    const table = page.locator('table');
    await expect(table.first()).toBeVisible();
  });

  test('should display table column headers', async ({ page }) => {
    await expect(page.locator('th:has-text("Time")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Type")').first()).toBeVisible();
    await expect(page.locator('th:has-text("User")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Action")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Details")').first()).toBeVisible();
  });

  test('should display log entries in table', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('should display log type badges', async ({ page }) => {
    // These come from i18n admin.audit.logType
    await expect(page.locator('text=User').first()).toBeVisible();
  });

  test('should display Recent Logs card title', async ({ page }) => {
    await expect(page.locator('text=Recent Logs').first()).toBeVisible();
  });

  test('should have keyboard accessible log rows', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toHaveAttribute('role', 'button');
    await expect(firstRow).toHaveAttribute('tabindex', '0');
  });
});
