import { test, expect } from '@playwright/test';

/**
 * Token Hub Unlock E2E Tests
 * Tests for Token Hub Screen 10: Unlock QS
 */

test.describe('Token Hub Unlock', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Token Hub unlock page
    await page.goto('/ja/token-hub/unlock');
  });

  test.describe('Page Load & Layout', () => {
    test('should display unlock page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/ロック解除|Unlock/);

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

    test('should display page title and subtitle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /ロック解除/i })).toBeVisible();
      await expect(page.getByText(/ロック期間が終了したQSトークンを引き出せます/)).toBeVisible();
    });
  });

  test.describe('Summary Stats Section', () => {
    test('should display all stats cards', async ({ page }) => {
      const statsSection = page.locator('section[aria-label="ロック統計"]');
      await expect(statsSection).toBeVisible();

      await expect(page.getByText('総ロック量')).toBeVisible();
      await expect(page.getByText('現在のveQS')).toBeVisible();
      await expect(page.getByText('ポジション数')).toBeVisible();
      await expect(page.getByText('解除可能')).toBeVisible();
    });

    test('should display total locked amount', async ({ page }) => {
      // Check that total locked label exists with QS suffix (specific value is dynamic)
      await expect(page.getByText('総ロック量')).toBeVisible();
    });

    test('should display veQS value', async ({ page }) => {
      // veQS value should be displayed (specific value is dynamic)
      await expect(page.getByText('現在のveQS')).toBeVisible();
    });

    test('should display position count', async ({ page }) => {
      // Position count label is displayed (specific count is dynamic)
      await expect(page.getByText('ポジション数')).toBeVisible();
    });
  });

  test.describe('Notice Section', () => {
    test('should display no early unlock warning', async ({ page }) => {
      await expect(
        page.getByText(/ロック期間中はトークンを引き出すことができません/)
      ).toBeVisible();
    });

    test('should have link to FAQ', async ({ page }) => {
      const faqLink = page.getByRole('link', { name: /FAQ/i });
      await expect(faqLink).toBeVisible();
    });
  });

  test.describe('Locked Positions List', () => {
    test('should display positions list title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /ロックポジション/i })).toBeVisible();
    });

    test('should display about unlocking tooltip button', async ({ page }) => {
      const tooltipButton = page.getByRole('button', { name: /ロック解除について詳しく見る/i });
      await expect(tooltipButton).toBeVisible();
    });

    test('should display locked positions', async ({ page }) => {
      const positionsList = page.getByRole('list', { name: /ロックポジション一覧/i });
      await expect(positionsList).toBeVisible();

      // Should have at least one position (specific count is dynamic)
      const items = positionsList.getByRole('listitem');
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display position details', async ({ page }) => {
      // Check that position details are shown
      await expect(page.getByText('現在のveQS')).toBeVisible();
      await expect(page.getByText('ロック日')).toBeVisible();
      await expect(page.getByText('解除可能日')).toBeVisible();
      await expect(page.getByText('残り時間')).toBeVisible();
    });

    test('should display locked status indicator', async ({ page }) => {
      // At least one position should show "ロック中" status
      await expect(page.getByText('ロック中').first()).toBeVisible();
    });

    test('should display progress bars for locked positions', async ({ page }) => {
      // Progress bars should be visible
      const progressBars = page.locator('[role="progressbar"]');
      await expect(progressBars.first()).toBeVisible();
    });
  });

  test.describe('Position Actions', () => {
    test('locked positions should show locked button', async ({ page }) => {
      // Locked positions show disabled "ロック中" button
      const lockedButton = page.getByText('ロック中').filter({ has: page.locator('svg') });
      await expect(lockedButton.first()).toBeVisible();
    });

    test('unlockable positions should show withdraw button (if any)', async ({ page }) => {
      // Note: This depends on demo data having an unlockable position
      // If there's an unlockable position, check for withdraw button
      const withdrawButton = page.getByRole('button', { name: /引き出す/i });

      // Count can be 0 if no positions are unlockable
      const count = await withdrawButton.count();
      if (count > 0) {
        await expect(withdrawButton.first()).toBeEnabled();
      }
    });
  });

  test.describe('CTA Section', () => {
    test('should display CTA section', async ({ page }) => {
      await expect(page.getByText('もっとロックしますか？')).toBeVisible();
      await expect(
        page.getByText(/追加のQSをロックしてveQS残高を増やし/)
      ).toBeVisible();
    });

    test('should display lock more button', async ({ page }) => {
      const lockMoreLink = page.getByRole('link', { name: /追加でロック/i });
      await expect(lockMoreLink).toBeVisible();
    });

    test('should display view dashboard button', async ({ page }) => {
      const dashboardLink = page.getByRole('link', { name: /ダッシュボードを見る/i });
      await expect(dashboardLink).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer with links', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: /フッターナビゲーション/i });
      await expect(footerNav).toBeVisible();

      await expect(footerNav.getByText('利用規約')).toBeVisible();
      await expect(footerNav.getByText('プライバシーポリシー')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/本サービスは投資助言ではありません/)).toBeVisible();
    });
  });

  test.describe('Tooltip Interactions', () => {
    test('unlock tooltip should show on click', async ({ page }) => {
      const tooltipButton = page.getByRole('button', { name: /ロック解除について詳しく見る/i });
      await tooltipButton.click();

      // Tooltip content should be visible
      await expect(page.getByText('ロック解除の仕組み')).toBeVisible();
      await expect(
        page.getByText(/QSトークンは、選択したロック期間が終了するまで引き出すことができません/)
      ).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Page should still display correctly
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: /ロック解除/i })).toBeVisible();

      // Stats cards should stack
      await expect(page.getByText('総ロック量')).toBeVisible();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Page should still display correctly
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('Quantum Shield')).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should be fully keyboard navigable', async ({ page }) => {
      // Start tabbing through the page
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to reach various interactive elements
      const activeElement = page.locator(':focus');
      await expect(activeElement).toBeVisible();
    });

    test('tooltip should be keyboard accessible', async ({ page }) => {
      const tooltipButton = page.getByRole('button', { name: /ロック解除について詳しく見る/i });
      await tooltipButton.focus();
      await expect(tooltipButton).toBeFocused();

      // Press Enter to open tooltip
      await page.keyboard.press('Enter');

      // Tooltip should be expanded
      await expect(tooltipButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper main landmark', async ({ page }) => {
      const main = page.getByRole('main', { name: /QSトークンのロック解除ページ/i });
      await expect(main).toBeVisible();
    });

    test('should have proper section labels', async ({ page }) => {
      // Stats section should have aria-label
      await expect(page.locator('section[aria-label="ロック統計"]')).toBeVisible();

      // Positions section should have aria-labelledby
      await expect(page.locator('section[aria-labelledby="positions-heading"]')).toBeVisible();
    });

    test('should have proper list role', async ({ page }) => {
      const positionsList = page.getByRole('list', { name: /ロックポジション一覧/i });
      await expect(positionsList).toBeVisible();

      const items = positionsList.getByRole('listitem');
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
    });

    test('progress bars should have proper aria attributes', async ({ page }) => {
      const progressBar = page.locator('[role="progressbar"]').first();
      await expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      await expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    test('icons should be hidden from screen readers', async ({ page }) => {
      // Check that decorative elements have aria-hidden
      const icon = page.locator('svg[aria-hidden="true"]').first();
      await expect(icon).toBeVisible();
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/token-hub/unlock');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Unlock QS/i })).toBeVisible();
      await expect(page.getByText('Total Locked')).toBeVisible();
      await expect(page.getByText('Current veQS')).toBeVisible();
      await expect(page.getByText('Positions')).toBeVisible();
      await expect(page.getByText('Unlockable')).toBeVisible();
    });

    test('should display English position details', async ({ page }) => {
      await expect(page.getByText('Lock Date')).toBeVisible();
      await expect(page.getByText('Unlock Date')).toBeVisible();
      await expect(page.getByText('Remaining')).toBeVisible();
    });

    test('should display English CTA', async ({ page }) => {
      await expect(page.getByText('Want to Lock More?')).toBeVisible();
      await expect(page.getByRole('link', { name: /Lock More/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /View Dashboard/i })).toBeVisible();
    });

    test('should display English footer', async ({ page }) => {
      await expect(page.getByText('Terms of Service')).toBeVisible();
      await expect(page.getByText('Privacy Policy')).toBeVisible();
    });
  });
});
