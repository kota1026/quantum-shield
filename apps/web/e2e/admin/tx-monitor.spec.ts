import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('QS Admin TX Monitor', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/tx-monitor');
  });

  test('should display page header with title', async ({ page }) => {
    // i18n: admin.txMonitor.title = "Transaction Monitor"
    await expect(page.locator('h1').first()).toContainText('Transaction Monitor');
  });

  test('should display subtitle', async ({ page }) => {
    // i18n: admin.txMonitor.subtitle = "Lock/Unlock/Challenge トランザクション監視"
    await expect(page.locator('text=Lock/Unlock/Challenge').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display live indicator', async ({ page }) => {
    const liveIndicator = page.getByRole('status');
    await expect(liveIndicator).toBeVisible();
    // i18n: admin.txMonitor.liveIndicator = "Live Updates"
    await expect(liveIndicator).toContainText('Live Updates');
  });

  test('should display all 5 tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'All Transactions' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Locks' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Unlocks' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Challenges' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Anomalies' })).toBeVisible();
  });

  test('should have All Transactions tab selected by default', async ({ page }) => {
    const allTxTab = page.getByRole('tab', { name: 'All Transactions' });
    await expect(allTxTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch tabs on click', async ({ page }) => {
    const locksTab = page.getByRole('tab', { name: 'Locks' });
    await locksTab.click();
    await expect(locksTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display stat labels', async ({ page }) => {
    await expect(page.locator('text=Total TXs (24h)').first()).toBeVisible();
  });

  test('should display Recent Transactions table', async ({ page }) => {
    // i18n: admin.txMonitor.table.title = "Recent Transactions"
    await expect(page.locator('text=Recent Transactions').first()).toBeVisible();
  });

  test('should display table column headers', async ({ page }) => {
    await expect(page.locator('th:has-text("TX Hash")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Type")').first()).toBeVisible();
    await expect(page.locator('th:has-text("From")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Amount")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Status")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Time")').first()).toBeVisible();
  });

  test('should display transaction rows', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('should show empty state for Challenges tab', async ({ page }) => {
    await page.getByRole('tab', { name: 'Challenges' }).click();
    // i18n: admin.txMonitor.table.empty = "No transactions found"
    await expect(page.locator('text=No transactions found').first()).toBeVisible();
  });

  test('should have proper tab ARIA attributes', async ({ page }) => {
    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected');
    }
  });

  test('table headers should have scope attribute', async ({ page }) => {
    const headers = page.locator('th[scope="col"]');
    const count = await headers.count();
    expect(count).toBe(6);
  });
});
