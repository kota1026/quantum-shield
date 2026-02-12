import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/dashboard');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display header with Quantum Shield branding', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').first()).toBeVisible();
      await expect(page.getByText('Token Hub').first()).toBeVisible();
    });

    test('should display navigation with menu items', async ({ page }) => {
      const nav = page.getByRole('navigation', { name: 'Token Hub ナビゲーション' });
      await expect(nav).toBeVisible();
      await expect(nav.getByText('ダッシュボード')).toBeVisible();
      await expect(nav.getByText('ロック')).toBeVisible();
      await expect(nav.getByText('委任')).toBeVisible();
      await expect(nav.getByText('報酬')).toBeVisible();
    });

    test('should display wallet connect button', async ({ page }) => {
      const walletBtn = page.getByRole('button', { name: /ウォレット接続/i });
      await expect(walletBtn).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display stats section with all 4 cards', async ({ page }) => {
      await expect(page.getByText('QS残高')).toBeVisible();
      await expect(page.getByText('ロック中のQS')).toBeVisible();
      await expect(page.getByText('veQS残高')).toBeVisible();
      await expect(page.getByText('投票力')).toBeVisible();
    });

    test('should display QS text in stat values', async ({ page }) => {
      const qsTexts = page.locator('text=QS');
      await expect(qsTexts.first()).toBeVisible();
    });

    test('stat cards should be interactive with tabindex', async ({ page }) => {
      const cards = page.locator('[role="button"][tabindex="0"]');
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('Getting Started Section', () => {
    test('should display getting started section', async ({ page }) => {
      await expect(page.getByText('はじめての方へ').first()).toBeVisible();
    });

    test('should display onboarding card', async ({ page }) => {
      await expect(page.getByText('仕組みを理解する')).toBeVisible();
    });

    test('should display get QS card', async ({ page }) => {
      await expect(page.getByText('QSを手に入れる')).toBeVisible();
    });

    test('should display FAQ card', async ({ page }) => {
      await expect(page.getByText('よくある質問').first()).toBeVisible();
    });

    test('should display view all link', async ({ page }) => {
      await expect(page.getByText('すべて見る')).toBeVisible();
    });
  });

  test.describe('Voting Power Decay Chart', () => {
    test('should display chart section heading', async ({ page }) => {
      await expect(page.getByText('投票力の減衰')).toBeVisible();
    });

    test('should display veQS decay subtitle', async ({ page }) => {
      await expect(page.getByText('veQS減衰予測')).toBeVisible();
    });

    test('should display current veQS box', async ({ page }) => {
      await expect(page.getByText('現在のveQS')).toBeVisible();
    });
  });

  test.describe('Lock Info Grid', () => {
    test('should display lock info labels', async ({ page }) => {
      await expect(page.getByText('ロック数量')).toBeVisible();
      await expect(page.getByText('ロック期間')).toBeVisible();
      await expect(page.getByText('残り時間')).toBeVisible();
      await expect(page.getByText('ロック比率')).toBeVisible();
    });
  });

  test.describe('Action Buttons', () => {
    test('should display all 4 action buttons', async ({ page }) => {
      await expect(page.getByText('QSをロック').first()).toBeVisible();
      await expect(page.getByText('ロック延長')).toBeVisible();
      await expect(page.getByText('委任する')).toBeVisible();
      await expect(page.getByText('報酬を受取')).toBeVisible();
    });

    test('lock button should be keyboard focusable', async ({ page }) => {
      const lockButton = page.getByRole('button', { name: 'QSをロック' });
      await lockButton.focus();
      await expect(lockButton).toBeFocused();
    });
  });

  test.describe('Delegations Card', () => {
    test('should display delegations heading', async ({ page }) => {
      await expect(page.getByText('委任先一覧')).toBeVisible();
    });

    test('should display delegation list', async ({ page }) => {
      const list = page.getByRole('list', { name: /デリゲート一覧/i });
      await expect(list).toBeVisible();
    });
  });

  test.describe('Rewards Card', () => {
    test('should display rewards heading', async ({ page }) => {
      const rewardsHeadings = page.getByText('報酬');
      await expect(rewardsHeadings.first()).toBeVisible();
    });

    test('should display claimable label', async ({ page }) => {
      await expect(page.getByText('受取可能')).toBeVisible();
    });

    test('should display claim button', async ({ page }) => {
      await expect(page.getByText('受け取る')).toBeVisible();
    });

    test('should display epoch progress', async ({ page }) => {
      await expect(page.getByText('エポック進行状況')).toBeVisible();
      const progressBar = page.getByRole('progressbar').first();
      await expect(progressBar).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer navigation', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: 'フッターナビゲーション' });
      await expect(footerNav).toBeVisible();
    });

    test('should display footer links', async ({ page }) => {
      await expect(page.getByText('利用規約')).toBeVisible();
      await expect(page.getByText('プライバシーポリシー')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/これは投資アドバイスではありません/)).toBeVisible();
    });

    test('should display copyright', async ({ page }) => {
      await expect(page.getByText(/© 2026 Quantum Shield Foundation/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('QS残高')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Token Hub ナビゲーション' })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'フッターナビゲーション' })).toBeVisible();
    });

    test('should have stats section with aria-label', async ({ page }) => {
      const statsSection = page.locator('[aria-label="トークン統計"]');
      await expect(statsSection).toBeVisible();
    });

    test('should have progressbar with ARIA attributes', async ({ page }) => {
      const progressBar = page.getByRole('progressbar').first();
      await expect(progressBar).toBeVisible();
    });
  });
});
