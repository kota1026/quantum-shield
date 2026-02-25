import { test, expect } from '@playwright/test';

/**
 * Token Hub Rewards History E2E Tests
 * Tests for Token Hub Screen 09: Rewards History
 */

test.describe('Token Hub Rewards History', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Token Hub rewards history page
    await page.goto('/ja/token-hub/rewards/history');
  });

  test.describe('Page Load & Layout', () => {
    test('should display rewards history page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/報酬履歴.*Token Hub/);

      // Check main elements are visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display header with navigation', async ({ page }) => {
      // Check logo
      await expect(page.getByText('Quantum Shield')).toBeVisible();
      await expect(page.getByText('Token Hub')).toBeVisible();

      // Check navigation
      const nav = page.getByRole('navigation', { name: /Token Hub/i });
      await expect(nav).toBeVisible();
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: /パンくずリスト/i });
      await expect(breadcrumb).toBeVisible();

      // Check breadcrumb items
      await expect(page.getByRole('link', { name: /報酬/i })).toBeVisible();
      await expect(page.getByText('履歴', { exact: true })).toHaveAttribute('aria-current', 'page');
    });

    test('should display page header with export button', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: /報酬履歴/i })).toBeVisible();
      await expect(page.getByText('過去の報酬履歴を確認・分析')).toBeVisible();
      await expect(page.getByRole('button', { name: /エクスポート/i })).toBeVisible();
    });
  });

  test.describe('Stats Summary', () => {
    test('should display all stat cards', async ({ page }) => {
      const statsSection = page.getByRole('region', { name: /報酬統計サマリー/i });
      await expect(statsSection).toBeVisible();

      // Check all 6 stat cards
      await expect(page.getByText('請求済み合計')).toBeVisible();
      await expect(page.getByText('未請求')).toBeVisible();
      await expect(page.getByText('週平均')).toBeVisible();
      await expect(page.getByText('最高週')).toBeVisible();
      await expect(page.getByText('最低週')).toBeVisible();
      await expect(page.getByText('参加エポック数')).toBeVisible();
    });

    test('should display stat values', async ({ page }) => {
      await expect(page.getByText('1,599 QS')).toBeVisible(); // Total claimed
      await expect(page.getByText('847 QS')).toBeVisible(); // Pending
      await expect(page.getByText('156 QS')).toBeVisible(); // Avg per week
      await expect(page.getByText('175 QS')).toBeVisible(); // Highest
      await expect(page.getByText('130 QS')).toBeVisible(); // Lowest
      await expect(page.getByText('42')).toBeVisible(); // Total epochs
    });
  });

  test.describe('Chart Section', () => {
    test('should display chart section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /報酬推移/i })).toBeVisible();
    });

    test('should display time view toggle', async ({ page }) => {
      const tablist = page.getByRole('tablist', { name: /期間表示切替/i });
      await expect(tablist).toBeVisible();

      await expect(page.getByRole('tab', { name: /週次/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /月次/i })).toBeVisible();
    });

    test('should switch between weekly and monthly view', async ({ page }) => {
      // Click monthly tab
      await page.getByRole('tab', { name: /月次/i }).click();

      // Monthly tab should be selected
      await expect(page.getByRole('tab', { name: /月次/i })).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tab', { name: /週次/i })).toHaveAttribute('aria-selected', 'false');

      // Click weekly tab
      await page.getByRole('tab', { name: /週次/i }).click();

      // Weekly tab should be selected
      await expect(page.getByRole('tab', { name: /週次/i })).toHaveAttribute('aria-selected', 'true');
    });

    test('should display chart', async ({ page }) => {
      const chartPanel = page.locator('#rewards-chart');
      await expect(chartPanel).toBeVisible();

      // Chart SVG should be visible
      const chart = chartPanel.locator('svg[role="img"]');
      await expect(chart).toBeVisible();
    });
  });

  test.describe('History List Section', () => {
    test('should display history section with filter', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /報酬明細/i })).toBeVisible();

      const filterTablist = page.getByRole('tablist', { name: /報酬種別フィルター/i });
      await expect(filterTablist).toBeVisible();
    });

    test('should display filter options', async ({ page }) => {
      await expect(page.getByRole('tab', { name: /すべて/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /保有報酬/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /投票報酬/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /委任報酬/i })).toBeVisible();
    });

    test('should filter history items', async ({ page }) => {
      // Initially "All" is selected
      await expect(page.getByRole('tab', { name: /すべて/i })).toHaveAttribute('aria-selected', 'true');

      // Click on "Holding" filter
      await page.getByRole('tab', { name: /保有報酬/i }).click();
      await expect(page.getByRole('tab', { name: /保有報酬/i })).toHaveAttribute('aria-selected', 'true');
    });

    test('should display history list', async ({ page }) => {
      const historyList = page.getByRole('list', { name: /報酬履歴リスト/i });
      await expect(historyList).toBeVisible();

      // Check history items
      await expect(page.getByText('週次報酬請求').first()).toBeVisible();
    });

    test('should display epoch badges', async ({ page }) => {
      await expect(page.getByText(/エポック #42/)).toBeVisible();
      await expect(page.getByText(/エポック #41/)).toBeVisible();
    });

    test('should display breakdown info', async ({ page }) => {
      await expect(page.getByText(/保有:/).first()).toBeVisible();
      await expect(page.getByText(/投票:/).first()).toBeVisible();
      await expect(page.getByText(/委任:/).first()).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      await expect(page.getByRole('button', { name: /前のページ/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /次のページ/i })).toBeVisible();
      await expect(page.getByText(/1.*\/.*2.*ページ/)).toBeVisible();
    });

    test('should navigate between pages', async ({ page }) => {
      // Click next page
      await page.getByRole('button', { name: /次のページ/i }).click();
      await expect(page.getByText(/2.*\/.*2.*ページ/)).toBeVisible();

      // Previous button should now be enabled
      await expect(page.getByRole('button', { name: /前のページ/i })).toBeEnabled();

      // Click previous page
      await page.getByRole('button', { name: /前のページ/i }).click();
      await expect(page.getByText(/1.*\/.*2.*ページ/)).toBeVisible();
    });

    test('previous button should be disabled on first page', async ({ page }) => {
      await expect(page.getByRole('button', { name: /前のページ/i })).toBeDisabled();
    });
  });

  test.describe('Back Link', () => {
    test('should display back link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /報酬ページに戻る/i })).toBeVisible();
    });

    test('back link should navigate to rewards page', async ({ page }) => {
      await page.getByRole('link', { name: /報酬ページに戻る/i }).click();
      await expect(page).toHaveURL(/\/ja\/token-hub\/rewards$/);
    });
  });

  test.describe('Footer', () => {
    test('should display footer with links', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: /フッターナビゲーション/i });
      await expect(footerNav).toBeVisible();

      await expect(footerNav.getByText('利用規約')).toBeVisible();
      await expect(footerNav.getByText('プライバシーポリシー')).toBeVisible();
      await expect(footerNav.getByText('セキュリティ')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/投資助言ではありません/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Stats should stack
      await expect(page.getByText('請求済み合計')).toBeVisible();
      await expect(page.getByText('週平均')).toBeVisible();

      // Main content should still display
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('Quantum Shield')).toBeVisible();
    });

    test('pagination should be responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByRole('button', { name: /前のページ/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /次のページ/i })).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate with keyboard', async ({ page }) => {
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Elements should be focusable
      await expect(page.locator(':focus')).toBeVisible();
    });

    test('time view tabs should be keyboard accessible', async ({ page }) => {
      const weeklyTab = page.getByRole('tab', { name: /週次/i });
      await weeklyTab.focus();
      await expect(weeklyTab).toBeFocused();
    });

    test('filter tabs should be keyboard accessible', async ({ page }) => {
      const allTab = page.getByRole('tab', { name: /すべて/i });
      await allTab.focus();
      await expect(allTab).toBeFocused();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check important ARIA labels exist
      await expect(page.getByRole('region', { name: /報酬統計サマリー/i })).toBeVisible();
      await expect(page.getByRole('navigation', { name: /Token Hub/i })).toBeVisible();
      await expect(page.getByRole('navigation', { name: /パンくずリスト/i })).toBeVisible();
      await expect(page.getByRole('list', { name: /報酬履歴リスト/i })).toBeVisible();
    });

    test('should have proper tabpanel roles', async ({ page }) => {
      await expect(page.locator('#rewards-chart[role="tabpanel"]')).toBeVisible();
      await expect(page.locator('#rewards-history-list[role="tabpanel"]')).toBeVisible();
    });

    test('focus should be visible on interactive elements', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /エクスポート/i });
      await exportButton.focus();
      await expect(exportButton).toBeFocused();
    });

    test('breadcrumb should indicate current page', async ({ page }) => {
      const currentItem = page.locator('[aria-current="page"]');
      await expect(currentItem).toBeVisible();
      await expect(currentItem).toHaveText('履歴');
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/token-hub/rewards/history');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: /Rewards History/i })).toBeVisible();
      await expect(page.getByText('View and analyze your past rewards history')).toBeVisible();
    });

    test('should display English stats labels', async ({ page }) => {
      await expect(page.getByText('Total Claimed')).toBeVisible();
      await expect(page.getByText('Pending')).toBeVisible();
      await expect(page.getByText('Weekly Average')).toBeVisible();
      await expect(page.getByText('Highest Week')).toBeVisible();
      await expect(page.getByText('Lowest Week')).toBeVisible();
      await expect(page.getByText('Epochs Participated')).toBeVisible();
    });

    test('should display English chart section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Rewards Trend/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Weekly/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Monthly/i })).toBeVisible();
    });

    test('should display English filter labels', async ({ page }) => {
      await expect(page.getByRole('tab', { name: /All/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Holding/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Voting/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Delegation/i })).toBeVisible();
    });

    test('should display English footer', async ({ page }) => {
      await expect(page.getByText('Terms of Service')).toBeVisible();
      await expect(page.getByText('Privacy Policy')).toBeVisible();
    });
  });
});
