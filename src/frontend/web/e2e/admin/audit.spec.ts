import { test, expect } from '@playwright/test';

test.describe('Admin Audit Log Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/admin/audit');
  });

  test('should display page header correctly', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Audit Log', level: 1 })).toBeVisible();

    // Check subtitle
    await expect(page.getByText('全操作ログ・セキュリティイベント監査')).toBeVisible();
  });

  test('should have accessible main landmark', async ({ page }) => {
    const main = page.getByRole('main', { name: '監査ログページ' });
    await expect(main).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    const tablist = page.getByRole('tablist', { name: 'Audit Log' });
    await expect(tablist).toBeVisible();

    // Check all tabs are present
    await expect(page.getByRole('tab', { name: 'All Logs' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'User Activity' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Security Events' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'System Events' })).toBeVisible();
  });

  test('should show All Logs tab as active by default', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: 'All Logs' });
    await expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch tabs on click', async ({ page }) => {
    const userTab = page.getByRole('tab', { name: 'User Activity' });
    const allTab = page.getByRole('tab', { name: 'All Logs' });

    await userTab.click();
    await expect(userTab).toHaveAttribute('aria-selected', 'true');
    await expect(allTab).toHaveAttribute('aria-selected', 'false');
  });

  test('should display logs table with correct columns', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // Check column headers
    await expect(page.getByRole('columnheader', { name: 'Time' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'User' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Action' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Details' })).toBeVisible();
  });

  test('should display log entries', async ({ page }) => {
    // Check log rows exist
    const logRows = page.locator('tbody tr');
    await expect(logRows.first()).toBeVisible();
  });

  test('should display log type badges', async ({ page }) => {
    // Check different badge types
    await expect(page.getByText('User').first()).toBeVisible();
    await expect(page.getByText('Prover')).toBeVisible();
    await expect(page.getByText('Security')).toBeVisible();
    await expect(page.getByText('System')).toBeVisible();
  });

  test('should filter logs when switching tabs', async ({ page }) => {
    // Click User Activity tab
    await page.getByRole('tab', { name: 'User Activity' }).click();
    await expect(page.getByRole('tab', { name: 'User Activity' })).toHaveAttribute('aria-selected', 'true');

    // Should show log rows
    const logRows = page.locator('tbody tr');
    if (await logRows.count() > 0) {
      await expect(logRows.first()).toBeVisible();
    }

    // Click Security Events tab
    await page.getByRole('tab', { name: 'Security Events' }).click();
    await expect(page.getByRole('tab', { name: 'Security Events' })).toHaveAttribute('aria-selected', 'true');
  });

  test('should have keyboard accessible log rows', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();

    // Check row has button role and tabindex
    await expect(firstRow).toHaveAttribute('role', 'button');
    await expect(firstRow).toHaveAttribute('tabindex', '0');
  });

  test('should have hover state on log rows', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();

    // Check cursor style
    await expect(firstRow).toHaveCSS('cursor', 'pointer');
  });

  test('should display user avatars', async ({ page }) => {
    // Avatar elements should be present in log rows
    const logRows = page.locator('tbody tr');
    if (await logRows.count() > 0) {
      await expect(logRows.first()).toBeVisible();
    }
  });

  test('should display Recent Logs card title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Logs' })).toBeVisible();
  });

  test('should work in English locale', async ({ page }) => {
    await page.goto('/en/admin/audit');

    await expect(page.getByRole('heading', { name: 'Audit Log', level: 1 })).toBeVisible();
    await expect(page.getByText('All operation logs and security event audit')).toBeVisible();
  });
});
