import { test, expect } from '@playwright/test';

/**
 * QS Admin Dashboard E2E Tests
 * Tests for Screen 01: Dashboard
 */

test.describe('QS Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard page
    await page.goto('/ja/admin/dashboard');
  });

  test.describe('Page Load & Layout', () => {
    test('should display dashboard page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Dashboard.*QS Admin/);

      // Check main elements are visible
      await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title and subtitle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
      await expect(page.getByText(/Quantum Shield.*監視|Monitoring/)).toBeVisible();
    });

    test('should display live indicator', async ({ page }) => {
      await expect(page.getByRole('status')).toBeVisible();
      await expect(page.getByText('Live Updates')).toBeVisible();
    });

    test('should display emergency pause button', async ({ page }) => {
      const emergencyButton = page.getByRole('link', { name: /Emergency Pause/i });
      await expect(emergencyButton).toBeVisible();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('should display sidebar with logo', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByText('QS Admin')).toBeVisible();
      await expect(sidebar.getByText('Internal Dashboard')).toBeVisible();
    });

    test('should display all navigation sections', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });

      // Overview section
      await expect(sidebar.getByText('Dashboard')).toBeVisible();
      await expect(sidebar.getByText('Emergency Pause')).toBeVisible();

      // Operations section
      await expect(sidebar.getByText(/Prover.*管理|Management/)).toBeVisible();
      await expect(sidebar.getByText('TX Monitor')).toBeVisible();
      await expect(sidebar.getByText('L3 Nodes')).toBeVisible();

      // Management section
      await expect(sidebar.getByText(/パラメータ|Parameters/)).toBeVisible();
      await expect(sidebar.getByText(/エンタープライズ|Enterprise/)).toBeVisible();
      await expect(sidebar.getByText(/コミュニティ|Community/)).toBeVisible();
    });

    test('should highlight active navigation item', async ({ page }) => {
      const dashboardLink = page.getByRole('navigation', { name: /QS Admin/i })
        .getByRole('link', { name: 'Dashboard' });
      await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    test('should display user info in footer', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await expect(sidebar.getByText('松本さん')).toBeVisible();
      await expect(sidebar.getByText('Senior Engineer')).toBeVisible();
      await expect(sidebar.getByText('Super Admin')).toBeVisible();
    });

    test('should display badge for items with notifications', async ({ page }) => {
      const proverLink = page.getByRole('navigation', { name: /QS Admin/i })
        .getByRole('link', { name: /Prover.*管理|Management/i });
      const badge = proverLink.locator('[aria-label*="items requiring attention"]');
      await expect(badge).toBeVisible();
      await expect(badge).toContainText('3');
    });
  });

  test.describe('Stats Cards', () => {
    test('should display all stat cards', async ({ page }) => {
      await expect(page.getByText('Total Value Locked')).toBeVisible();
      await expect(page.getByText('Active Provers')).toBeVisible();
      await expect(page.getByText('Pending Unlocks')).toBeVisible();
      await expect(page.getByText('Active Alerts')).toBeVisible();
    });

    test('should display stat values', async ({ page }) => {
      await expect(page.getByText('$847.2M')).toBeVisible();
      await expect(page.getByText('127/127')).toBeVisible();
      await expect(page.getByText('23')).toBeVisible();
      await expect(page.getByText('5')).toBeVisible();
    });

    test('should display stat changes', async ({ page }) => {
      await expect(page.getByText(/12\.4%.*24h/)).toBeVisible();
      await expect(page.getByText(/100%.*Healthy/)).toBeVisible();
    });
  });

  test.describe('System Status', () => {
    test('should display system status card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /System Status/i })).toBeVisible();
      await expect(page.getByText('All Systems Operational')).toBeVisible();
    });

    test('should display all system items', async ({ page }) => {
      await expect(page.getByText('L3 Aegis Network')).toBeVisible();
      await expect(page.getByText('Prover Network')).toBeVisible();
      await expect(page.getByText('L1 Vault')).toBeVisible();
      await expect(page.getByText('Observer Network')).toBeVisible();
      await expect(page.getByText('API Gateway')).toBeVisible();
      await expect(page.getByText('Security Monitors')).toBeVisible();
    });

    test('should display system metrics', async ({ page }) => {
      // L3 Network metrics
      await expect(page.getByText(/Block.*1,234,567/)).toBeVisible();
      await expect(page.getByText(/TPS.*245/)).toBeVisible();

      // API Gateway metrics
      await expect(page.getByText(/Latency.*45ms/)).toBeVisible();
      await expect(page.getByText(/RPS.*1\.2k/)).toBeVisible();
    });
  });

  test.describe('Recent Activity', () => {
    test('should display recent activity card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Recent Activity/i })).toBeVisible();
    });

    test('should display activity items', async ({ page }) => {
      // Check for activity texts
      await expect(page.getByText(/Lock:.*ETH.*from/)).toBeVisible();
      await expect(page.getByText(/Prover.*signed.*Unlock/)).toBeVisible();
      await expect(page.getByText(/Unlock completed/)).toBeVisible();
    });

    test('should display activity times', async ({ page }) => {
      await expect(page.getByText(/\d+ minutes ago/)).toBeVisible();
    });
  });

  test.describe('Active Alerts', () => {
    test('should display alerts card with badge', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Active Alerts/i })).toBeVisible();
    });

    test('should display alert items', async ({ page }) => {
      await expect(page.getByText(/Prover.*SLA Warning/)).toBeVisible();
      await expect(page.getByText(/Large Unlock Request/)).toBeVisible();
      await expect(page.getByText(/New Prover Application/)).toBeVisible();
      await expect(page.getByText(/Gas price spike/)).toBeVisible();
      await expect(page.getByText(/Scheduled maintenance/)).toBeVisible();
    });

    test('should display alert severity badges', async ({ page }) => {
      const highBadges = page.locator('text=High');
      await expect(highBadges.first()).toBeVisible();
    });

    test('alert items should be interactive', async ({ page }) => {
      const alertItem = page.getByRole('button', { name: /Prover.*SLA Warning/i });
      await expect(alertItem).toBeVisible();
      await expect(alertItem).toBeEnabled();
    });
  });

  test.describe('Quick Actions', () => {
    test('should display quick actions card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Quick Actions/i })).toBeVisible();
    });

    test('should display all quick action buttons', async ({ page }) => {
      await expect(page.getByRole('link', { name: /Review Provers/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /TX Monitor/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Daily Report/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Audit Log/i })).toBeVisible();
    });

    test('quick actions should link to correct pages', async ({ page }) => {
      const reviewProversLink = page.getByRole('link', { name: /Review Provers/i });
      await expect(reviewProversLink).toHaveAttribute('href', /\/admin\/provers/);

      const txMonitorLink = page.getByRole('link', { name: /TX Monitor/i });
      await expect(txMonitorLink).toHaveAttribute('href', /\/admin\/tx-monitor/);
    });
  });

  test.describe('Navigation Links', () => {
    test('emergency pause button should link to emergency page', async ({ page }) => {
      const emergencyButton = page.getByRole('link', { name: /Emergency Pause/i }).first();
      await expect(emergencyButton).toHaveAttribute('href', /\/admin\/emergency/);
    });

    test('sidebar navigation should link to correct pages', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });

      // Check various navigation links
      const proverLink = sidebar.getByRole('link', { name: /Prover.*管理|Management/i });
      await expect(proverLink).toHaveAttribute('href', /\/admin\/provers/);

      const reportsLink = sidebar.getByRole('link', { name: /レポート|Reports/i });
      await expect(reportsLink).toHaveAttribute('href', /\/admin\/reports/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Sidebar should still be visible
      await expect(page.getByRole('navigation', { name: /QS Admin/i })).toBeVisible();

      // Main content should adjust
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('stats grid should stack on smaller screens', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 });

      // Stats should still be visible
      await expect(page.getByText('Total Value Locked')).toBeVisible();
      await expect(page.getByText('Active Provers')).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate sidebar with keyboard', async ({ page }) => {
      // Focus first sidebar link
      await page.keyboard.press('Tab');

      // Should be able to navigate through sidebar links
      const dashboardLink = page.getByRole('navigation', { name: /QS Admin/i })
        .getByRole('link', { name: 'Dashboard' });
      await dashboardLink.focus();
      await expect(dashboardLink).toBeFocused();

      // Tab to next link
      await page.keyboard.press('Tab');
    });

    test('alert buttons should be focusable', async ({ page }) => {
      const alertItem = page.getByRole('button', { name: /Prover.*SLA Warning/i });
      await alertItem.focus();
      await expect(alertItem).toBeFocused();
    });

    test('quick action links should be keyboard accessible', async ({ page }) => {
      const quickAction = page.getByRole('link', { name: /Review Provers/i });
      await quickAction.focus();
      await expect(quickAction).toBeFocused();

      // Enter should activate the link
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/admin\/provers/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Navigation
      await expect(page.getByRole('navigation', { name: /QS Admin/i })).toBeVisible();

      // Main content
      await expect(page.getByRole('main', { name: /QS Admin.*ダッシュボード|Dashboard/i })).toBeVisible();

      // Live status
      await expect(page.getByRole('status')).toBeVisible();
    });

    test('stat cards should have accessible labels', async ({ page }) => {
      const statArticles = page.locator('article').filter({ hasText: 'Total Value Locked' });
      await expect(statArticles.first()).toHaveAttribute('aria-label', /Total Value Locked/);
    });

    test('activity items should be properly labeled', async ({ page }) => {
      const activityArticles = page.locator('article').filter({ hasText: /Lock:.*ETH/ });
      await expect(activityArticles.first()).toHaveAttribute('aria-label', /Lock transaction/);
    });

    test('focus indicators should be visible', async ({ page }) => {
      // Focus on an interactive element
      const quickAction = page.getByRole('link', { name: /Review Provers/i });
      await quickAction.focus();

      // The element should have focus ring styles (checked via visual appearance)
      await expect(quickAction).toBeFocused();
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/admin/dashboard');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
      await expect(page.getByText('Quantum Shield System Monitoring')).toBeVisible();
      await expect(page.getByText('Live Updates')).toBeVisible();
      await expect(page.getByText('All Systems Operational')).toBeVisible();
    });

    test('should display English navigation labels', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await expect(sidebar.getByText('Overview')).toBeVisible();
      await expect(sidebar.getByText('Operations')).toBeVisible();
      await expect(sidebar.getByText('Management')).toBeVisible();
      await expect(sidebar.getByText('System')).toBeVisible();
    });
  });
});
