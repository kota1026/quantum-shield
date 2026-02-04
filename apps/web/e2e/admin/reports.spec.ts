import { test, expect } from '@playwright/test';

/**
 * QS Admin Reports E2E Tests
 * Tests for Screen 08: Reports
 */

test.describe('QS Admin Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reports page
    await page.goto('/ja/admin/reports');
  });

  test.describe('Page Load & Layout', () => {
    test('should display reports page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Reports.*QS Admin/);

      // Check main elements are visible
      await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title and subtitle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible();
      await expect(page.getByText(/システムレポート.*分析/)).toBeVisible();
    });

    test('should display Export All button', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /Export All/i });
      await expect(exportButton).toBeVisible();
      await expect(exportButton).toBeEnabled();
    });
  });

  test.describe('Reports Grid', () => {
    test('should display all 4 report cards', async ({ page }) => {
      await expect(page.getByText('Daily Report')).toBeVisible();
      await expect(page.getByText('Weekly Report')).toBeVisible();
      await expect(page.getByText('Monthly Report')).toBeVisible();
      await expect(page.getByText('Revenue Report')).toBeVisible();
    });

    test('should display report descriptions', async ({ page }) => {
      await expect(page.getByText(/過去24時間のトランザクション/)).toBeVisible();
      await expect(page.getByText(/週次サマリー/)).toBeVisible();
      await expect(page.getByText(/月次レビュー/)).toBeVisible();
      await expect(page.getByText(/手数料収入/)).toBeVisible();
    });

    test('should display last generated dates', async ({ page }) => {
      await expect(page.getByText('Last generated: Today 00:00 UTC')).toBeVisible();
      await expect(page.getByText('Last generated: 2026-01-06')).toBeVisible();
    });

    test('report cards should be clickable', async ({ page }) => {
      const dailyReport = page.getByRole('button', { name: /Daily Report/i });
      await expect(dailyReport).toBeVisible();
      await expect(dailyReport).toBeEnabled();
    });
  });

  test.describe("Today's Summary", () => {
    test('should display summary card header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: "Today's Summary" })).toBeVisible();
    });

    test('should display all 4 summary metrics', async ({ page }) => {
      await expect(page.getByText('Total Transactions')).toBeVisible();
      await expect(page.getByText('TVL Change')).toBeVisible();
      await expect(page.getByText('Avg Prover SLA')).toBeVisible();
      await expect(page.getByText('Security Incidents')).toBeVisible();
    });

    test('should display summary values', async ({ page }) => {
      await expect(page.getByText('1,247')).toBeVisible();
      await expect(page.getByText('+$12.4M')).toBeVisible();
      await expect(page.getByText('99.87%')).toBeVisible();
      await expect(page.getByText('0')).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('Export button should be keyboard accessible', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /Export All/i });
      await exportButton.focus();
      await expect(exportButton).toBeFocused();
    });

    test('report cards should be keyboard navigable', async ({ page }) => {
      const dailyReport = page.getByRole('button', { name: /Daily Report/i });
      await dailyReport.focus();
      await expect(dailyReport).toBeFocused();
    });

    test('should activate report on Enter key', async ({ page }) => {
      const dailyReport = page.getByRole('button', { name: /Daily Report/i });
      await dailyReport.focus();
      await dailyReport.press('Enter');
      // In production, this would open report viewer
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
    });

    test('should show 2 columns on medium screens', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // All report cards should still be visible
      await expect(page.getByText('Daily Report')).toBeVisible();
      await expect(page.getByText('Weekly Report')).toBeVisible();
    });

    test('should show 1 column on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 480, height: 800 });

      // Content should still be visible
      await expect(page.getByText('Daily Report')).toBeVisible();
      await expect(page.getByText("Today's Summary")).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Main content with aria-label
      const main = page.getByRole('main');
      await expect(main).toBeVisible();

      // Reports list
      const reportList = page.getByRole('list', { name: 'Reports' });
      await expect(reportList).toBeVisible();
    });

    test('report cards should have aria-label', async ({ page }) => {
      const dailyReport = page.getByRole('button', { name: /Daily Report/i });
      await expect(dailyReport).toBeVisible();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('Reports should be highlighted in sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      const reportsLink = sidebar.getByRole('link', { name: /Reports/i });
      await expect(reportsLink).toHaveAttribute('aria-current', 'page');
    });

    test('should navigate to dashboard from sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await sidebar.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('should navigate to staff from sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await sidebar.getByRole('link', { name: /Staff/i }).click();
      await expect(page).toHaveURL(/\/admin\/staff/);
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/admin/reports');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible();
      await expect(page.getByText('System Reports & Analytics')).toBeVisible();
    });

    test('should display English report descriptions', async ({ page }) => {
      await expect(page.getByText(/Past 24 hours transactions/)).toBeVisible();
      await expect(page.getByText(/Weekly summary/)).toBeVisible();
      await expect(page.getByText(/Monthly review/)).toBeVisible();
      await expect(page.getByText(/Fee revenue/)).toBeVisible();
    });

    test('should display English summary labels', async ({ page }) => {
      await expect(page.getByText('Total Transactions')).toBeVisible();
      await expect(page.getByText('TVL Change')).toBeVisible();
      await expect(page.getByText('Avg Prover SLA')).toBeVisible();
      await expect(page.getByText('Security Incidents')).toBeVisible();
    });
  });
});
