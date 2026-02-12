import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Rewards', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/rewards');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: '報酬' })).toBeVisible();
    });

    test('should display page subtitle', async ({ page }) => {
      await expect(page.getByText('veQSホルダーとしての報酬を確認・請求')).toBeVisible();
    });

    test('should display back to dashboard link', async ({ page }) => {
      await expect(page.getByText('← ダッシュボードに戻る')).toBeVisible();
    });
  });

  test.describe('Claim Banner', () => {
    test('should display claimable label', async ({ page }) => {
      await expect(page.getByText('請求可能な報酬')).toBeVisible();
    });

    test('should display QS amount', async ({ page }) => {
      await expect(page.getByText(/QS$/).first()).toBeVisible();
    });

    test('should display claim button', async ({ page }) => {
      await expect(page.getByText('報酬を請求')).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display stats section', async ({ page }) => {
      const statsSection = page.locator('[aria-label="報酬統計"]');
      await expect(statsSection).toBeVisible();
    });

    test('should display total earned label', async ({ page }) => {
      await expect(page.getByText('累計獲得（全期間）')).toBeVisible();
    });

    test('should display weekly average label', async ({ page }) => {
      await expect(page.getByText('週平均')).toBeVisible();
    });

    test('should display current APY label', async ({ page }) => {
      await expect(page.getByText('現在のAPY')).toBeVisible();
    });

    test('should display next reward label', async ({ page }) => {
      await expect(page.getByText('次回報酬')).toBeVisible();
    });
  });

  test.describe('Rewards History', () => {
    test('should display history heading', async ({ page }) => {
      await expect(page.getByText('報酬履歴')).toBeVisible();
    });

    test('should display view all link', async ({ page }) => {
      await expect(page.getByText('すべて見る')).toBeVisible();
    });

    test('should display history list', async ({ page }) => {
      const list = page.getByRole('list', { name: /報酬履歴リスト/ });
      await expect(list).toBeVisible();
    });

    test('should display weekly reward items', async ({ page }) => {
      await expect(page.getByText('週次報酬請求').first()).toBeVisible();
    });
  });

  test.describe('Reward Breakdown', () => {
    test('should display breakdown heading', async ({ page }) => {
      await expect(page.getByText('報酬内訳')).toBeVisible();
    });

    test('should display breakdown items', async ({ page }) => {
      await expect(page.getByText('veQS保有報酬')).toBeVisible();
      await expect(page.getByText('投票参加ボーナス')).toBeVisible();
      await expect(page.getByText('委任ボーナス')).toBeVisible();
    });
  });

  test.describe('Epoch Box', () => {
    test('should display epoch title', async ({ page }) => {
      await expect(page.getByText('現在のエポック')).toBeVisible();
    });

    test('should display epoch progress bar', async ({ page }) => {
      const progressBar = page.getByRole('progressbar').first();
      await expect(progressBar).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer links', async ({ page }) => {
      await expect(page.getByText('利用規約')).toBeVisible();
      await expect(page.getByText('プライバシーポリシー')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/本サービスは投資助言ではありません/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have stats section with aria-label', async ({ page }) => {
      await expect(page.locator('[aria-label="報酬統計"]')).toBeVisible();
    });

    test('should have progressbar with ARIA attributes', async ({ page }) => {
      const progressBar = page.getByRole('progressbar').first();
      await expect(progressBar).toBeVisible();
    });
  });
});
