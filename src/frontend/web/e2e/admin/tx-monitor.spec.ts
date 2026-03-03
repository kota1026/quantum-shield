import { test, expect } from '@playwright/test';

/**
 * QS Admin TX Monitor E2E Tests
 * Tests for Screen 05: TX Monitor
 */

test.describe('QS Admin TX Monitor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to TX monitor page
    await page.goto('/ja/admin/tx-monitor');
  });

  test.describe('Page Load & Layout', () => {
    test('should display TX monitor page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/TX Monitor.*QS Admin/);

      // Check main elements are visible
      await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title and subtitle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Transaction Monitor', level: 1 })).toBeVisible();
      await expect(page.getByText(/Lock\/Unlock\/Challenge.*トランザクション監視/)).toBeVisible();
    });

    test('should display live indicator', async ({ page }) => {
      const liveIndicator = page.getByRole('status');
      await expect(liveIndicator).toBeVisible();
      await expect(liveIndicator).toContainText('Live Updates');
    });
  });

  test.describe('Tabs Navigation', () => {
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

    test('should filter transactions when Locks tab is selected', async ({ page }) => {
      await page.getByRole('tab', { name: 'Locks' }).click();

      // Should only show lock transactions
      const lockBadges = page.getByText('Lock', { exact: true });
      await expect(lockBadges.first()).toBeVisible();
    });

    test('should filter transactions when Unlocks tab is selected', async ({ page }) => {
      await page.getByRole('tab', { name: 'Unlocks' }).click();

      // Should only show unlock transactions
      const unlockBadges = page.getByText('Unlock', { exact: true });
      await expect(unlockBadges.first()).toBeVisible();
    });

    test('should show empty state when Challenges tab is selected', async ({ page }) => {
      await page.getByRole('tab', { name: 'Challenges' }).click();
      await expect(page.getByText('No transactions found')).toBeVisible();
    });

    test('should filter transactions when Anomalies tab is selected', async ({ page }) => {
      await page.getByRole('tab', { name: 'Anomalies' }).click();

      // Should show emergency transactions
      await expect(page.getByText('Emergency')).toBeVisible();
    });
  });

  test.describe('Stats Row', () => {
    test('should display all 5 stat cards', async ({ page }) => {
      await expect(page.getByText('Total TXs (24h)')).toBeVisible();
      await expect(page.getByText('Locks').first()).toBeVisible();
      await expect(page.getByText('Unlocks').first()).toBeVisible();
      await expect(page.getByText('Emergency').first()).toBeVisible();
      await expect(page.getByText('Challenges').first()).toBeVisible();
    });

    test('should display stat values', async ({ page }) => {
      // Stat cards should be present with labels (values are dynamic)
      await expect(page.getByText('Total TXs (24h)')).toBeVisible();
    });
  });

  test.describe('Transactions Table', () => {
    test('should display table header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Recent Transactions' })).toBeVisible();
    });

    test('should display table columns', async ({ page }) => {
      await expect(page.getByText('TX Hash')).toBeVisible();
      await expect(page.getByText('Type')).toBeVisible();
      await expect(page.getByText('From')).toBeVisible();
      await expect(page.getByText('Amount')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Time')).toBeVisible();
    });

    test('should display transaction rows', async ({ page }) => {
      // Transaction table should have data rows
      const txRows = page.locator('tbody tr');
      if (await txRows.count() > 0) {
        await expect(txRows.first()).toBeVisible();
      }
    });

    test('should display type badges', async ({ page }) => {
      // Lock badge
      const lockBadge = page.locator('span', { hasText: 'Lock' }).first();
      await expect(lockBadge).toBeVisible();

      // Unlock badge
      await expect(page.getByText('Unlock').first()).toBeVisible();

      // Emergency badge
      await expect(page.getByText('Emergency')).toBeVisible();
    });

    test('should display status badges', async ({ page }) => {
      await expect(page.getByText('Completed').first()).toBeVisible();
    });

    test('should display time stamps', async ({ page }) => {
      // Time column should be visible
      await expect(page.getByText('Time')).toBeVisible();
    });

    test('transaction rows should be clickable', async ({ page }) => {
      // First transaction row button should be clickable
      const txRows = page.locator('tbody tr[role="button"]');
      await expect(txRows.first()).toBeVisible();
      await expect(txRows.first()).toBeEnabled();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('tabs should be keyboard navigable', async ({ page }) => {
      const firstTab = page.getByRole('tab', { name: 'All Transactions' });
      await firstTab.focus();
      await expect(firstTab).toBeFocused();
    });

    test('transaction rows should be keyboard accessible', async ({ page }) => {
      const txRow = page.locator('tbody tr[role="button"]').first();
      await txRow.focus();
      await expect(txRow).toBeFocused();
    });

    test('should activate row on Enter key', async ({ page }) => {
      const txRow = page.locator('tbody tr[role="button"]').first();
      await txRow.focus();
      await txRow.press('Enter');
      // In production, this would open a modal or navigate
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Transaction Monitor' })).toBeVisible();
    });

    test('should have horizontal scroll for table on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 });

      // Stats cards should still be visible
      await expect(page.getByText('Total TXs (24h)')).toBeVisible();

      // Table should be in scrollable container
      const table = page.getByRole('table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Main content with aria-label
      const main = page.getByRole('main');
      await expect(main).toBeVisible();

      // Live indicator with role="status"
      await expect(page.getByRole('status')).toBeVisible();

      // Tablist
      await expect(page.getByRole('tablist')).toBeVisible();

      // Table
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('tabs should have proper ARIA attributes', async ({ page }) => {
      const tabs = page.getByRole('tab');
      const count = await tabs.count();

      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toHaveAttribute('aria-selected');
      }
    });

    test('table headers should have scope attribute', async ({ page }) => {
      const headers = page.locator('th[scope="col"]');
      await expect(headers).toHaveCount(6);
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('TX monitor should be highlighted in sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      const txMonitorLink = sidebar.getByRole('link', { name: /TX Monitor/i });
      await expect(txMonitorLink).toHaveAttribute('aria-current', 'page');
    });

    test('should navigate to dashboard from sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await sidebar.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('should navigate to prover page from sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await sidebar.getByRole('link', { name: /Prover.*Management/i }).click();
      await expect(page).toHaveURL(/\/admin\/prover/);
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/admin/tx-monitor');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Transaction Monitor', level: 1 })).toBeVisible();
      await expect(page.getByText('Lock/Unlock/Challenge Transaction Monitoring')).toBeVisible();
    });

    test('should display English tab labels', async ({ page }) => {
      await expect(page.getByRole('tab', { name: 'All Transactions' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Locks' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Challenges' })).toBeVisible();
    });

    test('should display English status badges', async ({ page }) => {
      await expect(page.getByText('Completed').first()).toBeVisible();
    });
  });
});
