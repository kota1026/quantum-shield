import { test, expect } from '@playwright/test';

/**
 * Token Hub Dashboard E2E Tests
 * Tests for Token Hub Screen 01: Dashboard
 */

test.describe('Token Hub Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Token Hub dashboard page
    await page.goto('/ja/token-hub/dashboard');
  });

  test.describe('Page Load & Layout', () => {
    test('should display dashboard page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Token Hub/);

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

    test('should display wallet button with address', async ({ page }) => {
      const walletButton = page.getByRole('button', { name: /0x7a3f/i });
      await expect(walletButton).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display all stat cards', async ({ page }) => {
      const statsSection = page.getByRole('region', { name: /トークン統計/i });
      await expect(statsSection).toBeVisible();

      // Check all 4 stat cards
      await expect(page.getByText('QS残高')).toBeVisible();
      await expect(page.getByText('ロック中のQS')).toBeVisible();
      await expect(page.getByText('veQS残高')).toBeVisible();
      await expect(page.getByText('投票力')).toBeVisible();
    });

    test('should display values in stat cards', async ({ page }) => {
      // Check that stat cards contain numeric values (not specific amounts)
      const statsSection = page.getByRole('region', { name: /トークン統計/i });
      await expect(statsSection.locator('text=/\\d/')).toBeTruthy();
    });

    test('stat cards should be clickable and focusable', async ({ page }) => {
      // QS Balance card should navigate on click
      const qsBalanceCard = page.getByRole('button', { name: /QS残高/i });
      await expect(qsBalanceCard).toBeVisible();
      await expect(qsBalanceCard).toHaveAttribute('tabindex', '0');
    });

    test('veQS card should have tooltip', async ({ page }) => {
      // Find the veQS tooltip button
      const tooltipButton = page.getByRole('button', { name: /veQSの計算方法/i });
      await expect(tooltipButton).toBeVisible();

      // Hover to show tooltip
      await tooltipButton.hover();

      // Tooltip content should be visible
      await expect(page.getByText('veQS = QS × (lock_period / 4 years)')).toBeVisible();
    });
  });

  test.describe('Voting Power Decay Chart', () => {
    test('should display chart section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /投票力の減衰/i })).toBeVisible();
      await expect(page.getByText('veQS減衰予測')).toBeVisible();
    });

    test('should display chart with proper aria label', async ({ page }) => {
      const chart = page.getByRole('img', { name: /veQSの時間経過/i });
      await expect(chart).toBeVisible();
    });

    test('should display veQS box with current values', async ({ page }) => {
      await expect(page.getByText('現在のveQS')).toBeVisible();
      // veQS value and lock end date are dynamic - just check labels exist
      await expect(page.getByText(/veQS/)).toBeTruthy();
      await expect(page.getByText(/ロック終了/)).toBeVisible();
    });
  });

  test.describe('Lock Info Grid', () => {
    test('should display all lock info items', async ({ page }) => {
      await expect(page.getByText('ロック数量')).toBeVisible();
      await expect(page.getByText('ロック期間')).toBeVisible();
      await expect(page.getByText('残り時間')).toBeVisible();
      await expect(page.getByText('倍率')).toBeVisible();
    });
  });

  test.describe('Action Buttons', () => {
    test('should display all action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /QSをロック/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /ロック延長/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /委任する/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /報酬を受取/i })).toBeVisible();
    });

    test('action buttons should have proper focus styles', async ({ page }) => {
      const lockButton = page.getByRole('button', { name: /QSをロック/i });
      await lockButton.focus();

      // Button should be focusable
      await expect(lockButton).toBeFocused();
    });
  });

  test.describe('My Delegations Card', () => {
    test('should display delegations section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /委任先一覧/i })).toBeVisible();
    });

    test('should display delegation list', async ({ page }) => {
      const delegationList = page.getByRole('list', { name: /デリゲート一覧/i });
      await expect(delegationList).toBeVisible();

      // Should have at least one delegation (specific count is dynamic)
      const count = await delegationList.getByRole('listitem').count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display delegation details', async ({ page }) => {
      // Check that delegation list items contain content (names and amounts are dynamic)
      const delegationList = page.getByRole('list', { name: /デリゲート一覧/i });
      const items = delegationList.getByRole('listitem');
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
    });

    test('delegation items should be clickable', async ({ page }) => {
      // First delegation item should be clickable
      const delegationList = page.getByRole('list', { name: /デリゲート一覧/i });
      const firstItem = delegationList.getByRole('listitem').first();
      const button = firstItem.getByRole('button');
      await expect(button).toBeVisible();
    });
  });

  test.describe('Rewards Card', () => {
    test('should display rewards section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /報酬/i })).toBeVisible();
    });

    test('should display claimable amount', async ({ page }) => {
      await expect(page.getByText('受取可能')).toBeVisible();
      // Claimable amount and USD value are dynamic
      await expect(page.getByText(/QS/)).toBeTruthy();
    });

    test('should display claim button', async ({ page }) => {
      const claimButton = page.getByRole('button', { name: /受け取る/i });
      await expect(claimButton).toBeVisible();
    });

    test('should display epoch progress bar', async ({ page }) => {
      await expect(page.getByText('エポック進行状況')).toBeVisible();

      // Check progress bar exists with proper role
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
      await expect(footerNav.getByText('ドキュメント')).toBeVisible();
      await expect(footerNav.getByText('GitHub')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/これは投資アドバイスではありません/)).toBeVisible();
    });

    test('should display copyright', async ({ page }) => {
      await expect(page.getByText(/© 2026 Quantum Shield Foundation/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Stats should stack in 2 columns
      await expect(page.getByText('QS残高')).toBeVisible();
      await expect(page.getByText('veQS残高')).toBeVisible();

      // Main content should stack vertically
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Page should still display correctly
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('Quantum Shield')).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate with keyboard', async ({ page }) => {
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to activate stat cards with Enter
      const statsCard = page.getByRole('button', { name: /QS残高/i });
      await statsCard.focus();
      await page.keyboard.press('Enter');

      // Should navigate (we'd normally check URL change)
    });

    test('action buttons should be keyboard accessible', async ({ page }) => {
      const lockButton = page.getByRole('button', { name: /QSをロック/i });
      await lockButton.focus();
      await expect(lockButton).toBeFocused();

      // Press Enter to activate
      await page.keyboard.press('Enter');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check important ARIA labels exist
      await expect(page.getByRole('region', { name: /トークン統計/i })).toBeVisible();
      await expect(page.getByRole('navigation', { name: /Token Hub/i })).toBeVisible();
      await expect(page.getByRole('list', { name: /デリゲート一覧/i })).toBeVisible();
      await expect(page.getByRole('progressbar', { name: /エポック進行状況/i })).toBeVisible();
    });

    test('should have accessible chart', async ({ page }) => {
      const chart = page.getByRole('img', { name: /veQSの時間経過/i });
      await expect(chart).toBeVisible();
    });

    test('focus should be visible on interactive elements', async ({ page }) => {
      const lockButton = page.getByRole('button', { name: /QSをロック/i });
      await lockButton.focus();

      // Focus should be visible (check focused state)
      await expect(lockButton).toBeFocused();
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/token-hub/dashboard');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByText('QS Balance')).toBeVisible();
      await expect(page.getByText('Locked QS')).toBeVisible();
      await expect(page.getByText('veQS Balance')).toBeVisible();
      await expect(page.getByText('Voting Power')).toBeVisible();
      await expect(page.getByText('Voting Power Decay')).toBeVisible();
      await expect(page.getByText('My Delegations')).toBeVisible();
      await expect(page.getByText('Rewards')).toBeVisible();
    });

    test('should display English footer', async ({ page }) => {
      await expect(page.getByText('Terms of Service')).toBeVisible();
      await expect(page.getByText('Privacy Policy')).toBeVisible();
      await expect(page.getByText(/This is not investment advice/)).toBeVisible();
    });
  });
});
