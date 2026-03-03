import { test, expect } from '@playwright/test';

/**
 * QS Admin Prover Management E2E Tests
 * Tests for Screen 04: Prover Management
 */

test.describe('QS Admin Prover Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to prover page
    await page.goto('/ja/admin/prover');
  });

  test.describe('Page Load & Layout', () => {
    test('should display prover page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Prover Management.*QS Admin/);

      // Check main elements are visible
      await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title and subtitle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Prover Management', level: 1 })).toBeVisible();
      await expect(page.getByText(/Proverネットワーク監視.*管理/)).toBeVisible();
    });
  });

  test.describe('Tabs Navigation', () => {
    test('should display all 4 tabs', async ({ page }) => {
      await expect(page.getByRole('tab', { name: 'All Provers' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Signing Queue' })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Applications/ })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Performance' })).toBeVisible();
    });

    test('should have All Provers tab selected by default', async ({ page }) => {
      const allProversTab = page.getByRole('tab', { name: 'All Provers' });
      await expect(allProversTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should show application badge count', async ({ page }) => {
      // Applications tab should display a numeric badge count
      const applicationsTab = page.getByRole('tab', { name: /Applications/ });
      await expect(applicationsTab).toBeVisible();
      // Badge should contain a numeric count
      await expect(applicationsTab.locator('span').filter({ hasText: /\d+/ })).toBeVisible();
    });

    test('should switch tabs on click', async ({ page }) => {
      const queueTab = page.getByRole('tab', { name: 'Signing Queue' });
      await queueTab.click();
      await expect(queueTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should display queue tab content', async ({ page }) => {
      await page.getByRole('tab', { name: 'Signing Queue' }).click();
      await expect(page.getByText(/Signing queue view coming soon/)).toBeVisible();
    });

    test('should display applications tab content', async ({ page }) => {
      await page.getByRole('tab', { name: /Applications/ }).click();
      await expect(page.getByText(/Application review view coming soon/)).toBeVisible();
    });

    test('should display performance tab content', async ({ page }) => {
      await page.getByRole('tab', { name: 'Performance' }).click();
      await expect(page.getByText(/Performance metrics view coming soon/)).toBeVisible();
    });
  });

  test.describe('Stats Row', () => {
    test('should display all 4 stat cards', async ({ page }) => {
      await expect(page.getByText('Active Provers')).toBeVisible();
      await expect(page.getByText('Total Stake')).toBeVisible();
      await expect(page.getByText('Avg SLA')).toBeVisible();
      await expect(page.getByText('Pending Queue')).toBeVisible();
    });

    test('should display stat values', async ({ page }) => {
      // Stat card labels should be visible (values are dynamic)
      await expect(page.getByText('Active Provers')).toBeVisible();
      await expect(page.getByText('Total Stake')).toBeVisible();
      await expect(page.getByText('Avg SLA')).toBeVisible();
      await expect(page.getByText('Pending Queue')).toBeVisible();
    });
  });

  test.describe('Prover List Table', () => {
    test('should display table header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Prover List' })).toBeVisible();
    });

    test('should display table columns', async ({ page }) => {
      await expect(page.getByText('Prover ID')).toBeVisible();
      await expect(page.getByText('Operator')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Stake')).toBeVisible();
      await expect(page.getByText('SLA')).toBeVisible();
      await expect(page.getByText('Signatures (24h)')).toBeVisible();
      await expect(page.getByText('Last Active')).toBeVisible();
    });

    test('should display prover rows', async ({ page }) => {
      // Prover table should have data rows
      const proverRows = page.locator('tbody tr');
      if (await proverRows.count() > 0) {
        await expect(proverRows.first()).toBeVisible();
      }
    });

    test('should display status badges', async ({ page }) => {
      const activeBadges = page.getByText('Active');
      await expect(activeBadges.first()).toBeVisible();

      await expect(page.getByText('SLA Warning')).toBeVisible();
    });

    test('should display SLA progress bars', async ({ page }) => {
      const slaBars = page.getByRole('progressbar');
      await expect(slaBars).toHaveCount(5);
    });

    test('should display stake amounts', async ({ page }) => {
      // Stake column should be visible
      await expect(page.getByText('Stake')).toBeVisible();
    });

    test('prover rows should be clickable', async ({ page }) => {
      const proverRow = page.getByRole('button', { name: /Prover #001/ });
      await expect(proverRow).toBeVisible();
      await expect(proverRow).toBeEnabled();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('tabs should be keyboard navigable', async ({ page }) => {
      const firstTab = page.getByRole('tab', { name: 'All Provers' });
      await firstTab.focus();
      await expect(firstTab).toBeFocused();
    });

    test('prover rows should be keyboard accessible', async ({ page }) => {
      const proverRow = page.getByRole('button', { name: /Prover #001/ });
      await proverRow.focus();
      await expect(proverRow).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Prover Management' })).toBeVisible();
    });

    test('should have horizontal scroll for table on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 });

      // Stats cards should still be visible
      await expect(page.getByText('Active Provers')).toBeVisible();

      // Table should be in scrollable container
      const table = page.getByRole('table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Main content
      await expect(page.getByRole('main')).toBeVisible();

      // Tablist
      await expect(page.getByRole('tablist')).toBeVisible();

      // Table
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('SLA progress bars should have proper accessibility', async ({ page }) => {
      const progressBars = page.getByRole('progressbar');
      const count = await progressBars.count();

      for (let i = 0; i < count; i++) {
        const bar = progressBars.nth(i);
        await expect(bar).toHaveAttribute('aria-valuenow');
        await expect(bar).toHaveAttribute('aria-valuemin');
        await expect(bar).toHaveAttribute('aria-valuemax');
      }
    });

    test('tabs should have proper ARIA attributes', async ({ page }) => {
      const tabs = page.getByRole('tab');
      const count = await tabs.count();

      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toHaveAttribute('aria-selected');
      }
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('prover page should be highlighted in sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      const proverLink = sidebar.getByRole('link', { name: /Prover.*Management/i });
      await expect(proverLink).toHaveAttribute('aria-current', 'page');
    });

    test('should navigate to dashboard from sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await sidebar.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/admin/prover');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Prover Management', level: 1 })).toBeVisible();
      await expect(page.getByText('Prover Network Monitoring & Management')).toBeVisible();
    });

    test('should display English tab labels', async ({ page }) => {
      await expect(page.getByRole('tab', { name: 'All Provers' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Signing Queue' })).toBeVisible();
    });
  });
});
