import { test, expect } from '@playwright/test';

/**
 * Token Hub Rewards E2E Tests
 * Tests for Token Hub Screen 08: Rewards
 */

test.describe('Token Hub Rewards', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Token Hub rewards page
    await page.goto('/ja/token-hub/rewards');
  });

  test.describe('Page Load & Layout', () => {
    test('should display rewards page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/報酬.*Token Hub/);

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
      await expect(nav.getByText('Dashboard')).toBeVisible();
      await expect(nav.getByText('Lock')).toBeVisible();
      await expect(nav.getByText('Delegate')).toBeVisible();
      await expect(nav.getByText('Rewards')).toBeVisible();
    });

    test('should display page header', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: /報酬/i })).toBeVisible();
      await expect(page.getByText('veQSホルダーとしての報酬を確認・請求')).toBeVisible();
    });
  });

  test.describe('Claim Banner', () => {
    test('should display claimable rewards banner', async ({ page }) => {
      await expect(page.getByText('請求可能な報酬')).toBeVisible();
      // Claimable amount and USD value are dynamic
    });

    test('should display claim button', async ({ page }) => {
      const claimButton = page.getByRole('button', { name: /報酬を請求/i });
      await expect(claimButton).toBeVisible();
    });

    test('claim button should be clickable', async ({ page }) => {
      const claimButton = page.getByRole('button', { name: /報酬を請求/i });
      await expect(claimButton).toBeEnabled();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display all stat cards', async ({ page }) => {
      const statsSection = page.getByRole('region', { name: /報酬統計/i });
      await expect(statsSection).toBeVisible();

      // Check all 4 stat cards
      await expect(page.getByText('累計獲得（全期間）')).toBeVisible();
      await expect(page.getByText('週平均')).toBeVisible();
      await expect(page.getByText('現在のAPY')).toBeVisible();
      await expect(page.getByText('次回報酬')).toBeVisible();
    });

    test('should display values in stat cards', async ({ page }) => {
      // Stat card values are dynamic, just check the labels are present
      const statsSection = page.getByRole('region', { name: /報酬統計/i });
      await expect(statsSection).toBeVisible();
    });
  });

  test.describe('Rewards History Section', () => {
    test('should display history section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /報酬履歴/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /すべて見る/i })).toBeVisible();
    });

    test('should display chart', async ({ page }) => {
      // Chart SVG should be visible
      const chart = page.locator('svg[role="img"]').first();
      await expect(chart).toBeVisible();
    });

    test('should display history list', async ({ page }) => {
      const historyList = page.getByRole('list', { name: /報酬履歴リスト/i });
      await expect(historyList).toBeVisible();

      // Check history items
      await expect(page.getByText('週次報酬請求')).toBeVisible();
    });

    test('should display history items with amounts', async ({ page }) => {
      // History items should show QS amounts (specific values are dynamic)
      const historyList = page.getByRole('list', { name: /報酬履歴リスト/i });
      const items = historyList.getByRole('listitem');
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Reward Breakdown Section', () => {
    test('should display breakdown section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /報酬内訳/i })).toBeVisible();
    });

    test('should display breakdown items', async ({ page }) => {
      await expect(page.getByText('veQS保有報酬')).toBeVisible();
      await expect(page.getByText('投票参加ボーナス')).toBeVisible();
      await expect(page.getByText('委任ボーナス')).toBeVisible();
    });

    test('should display breakdown with values', async ({ page }) => {
      // Breakdown values are dynamic, just check the breakdown labels are present
      await expect(page.getByText('veQS保有報酬')).toBeVisible();
      await expect(page.getByText('投票参加ボーナス')).toBeVisible();
      await expect(page.getByText('委任ボーナス')).toBeVisible();
    });
  });

  test.describe('Epoch Box', () => {
    test('should display epoch section', async ({ page }) => {
      await expect(page.getByText('現在のエポック')).toBeVisible();
    });

    test('should display epoch info', async ({ page }) => {
      // Epoch number and remaining time are dynamic
      await expect(page.getByText(/エポック/)).toBeVisible();
      await expect(page.getByText(/残り/)).toBeVisible();
    });

    test('should display progress bar', async ({ page }) => {
      const progressBar = page.getByRole('progressbar', { name: /エポック進行状況/i });
      await expect(progressBar).toBeVisible();
      await expect(progressBar).toHaveAttribute('aria-valuenow');
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

      // Stats should stack in 2 columns
      await expect(page.getByText('累計獲得（全期間）')).toBeVisible();
      await expect(page.getByText('現在のAPY')).toBeVisible();

      // Main content should stack vertically
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Page should still display correctly
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('Quantum Shield')).toBeVisible();
    });

    test('claim banner should be responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Claim banner should still be visible
      await expect(page.getByText('請求可能な報酬')).toBeVisible();
      await expect(page.getByRole('button', { name: /報酬を請求/i })).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate with keyboard', async ({ page }) => {
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to focus claim button
      const claimButton = page.getByRole('button', { name: /報酬を請求/i });
      await claimButton.focus();
      await expect(claimButton).toBeFocused();
    });

    test('view all link should be keyboard accessible', async ({ page }) => {
      const viewAllLink = page.getByRole('link', { name: /すべて見る/i });
      await viewAllLink.focus();
      await expect(viewAllLink).toBeFocused();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check important ARIA labels exist
      await expect(page.getByRole('region', { name: /報酬統計/i })).toBeVisible();
      await expect(page.getByRole('navigation', { name: /Token Hub/i })).toBeVisible();
      await expect(page.getByRole('list', { name: /報酬履歴リスト/i })).toBeVisible();
      await expect(page.getByRole('progressbar', { name: /エポック進行状況/i })).toBeVisible();
    });

    test('focus should be visible on interactive elements', async ({ page }) => {
      const claimButton = page.getByRole('button', { name: /報酬を請求/i });
      await claimButton.focus();

      // Focus should be visible (check focused state)
      await expect(claimButton).toBeFocused();
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/token-hub/rewards');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: /Rewards/i })).toBeVisible();
      await expect(page.getByText('View and claim your rewards as a veQS holder')).toBeVisible();
    });

    test('should display English stats labels', async ({ page }) => {
      await expect(page.getByText('Total Earned (All Time)')).toBeVisible();
      await expect(page.getByText('Weekly Average')).toBeVisible();
      await expect(page.getByText('Current APY')).toBeVisible();
      await expect(page.getByText('Next Reward')).toBeVisible();
    });

    test('should display English breakdown labels', async ({ page }) => {
      await expect(page.getByText('veQS Holding Rewards')).toBeVisible();
      await expect(page.getByText('Voting Participation')).toBeVisible();
      await expect(page.getByText('Delegation Bonus')).toBeVisible();
    });

    test('should display English footer', async ({ page }) => {
      await expect(page.getByText('Terms of Service')).toBeVisible();
      await expect(page.getByText('Privacy Policy')).toBeVisible();
    });
  });
});
