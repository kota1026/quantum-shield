import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Get QS', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/token-hub/get-qs');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'QSトークンの入手方法' })).toBeVisible();
    });

    test('should display header badge', async ({ page }) => {
      await expect(page.getByText('トークン取得')).toBeVisible();
    });

    test('should display header with navigation', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').first()).toBeVisible();
    });
  });

  test.describe('Breadcrumb', () => {
    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: 'パンくずリストナビゲーション' });
      await expect(breadcrumb).toBeVisible();
    });

    test('should display current page in breadcrumb', async ({ page }) => {
      const current = page.locator('[aria-current="page"]');
      await expect(current).toBeVisible();
    });
  });

  test.describe('Acquisition Methods', () => {
    test('should display DEX purchase method', async ({ page }) => {
      await expect(page.getByText('DEXで購入')).toBeVisible();
    });

    test('should display protocol rewards method', async ({ page }) => {
      await expect(page.getByText('プロトコル報酬を獲得')).toBeVisible();
    });

    test('should display airdrop method', async ({ page }) => {
      await expect(page.getByText('エアドロップ')).toBeVisible();
    });

    test('should display staking rewards method', async ({ page }) => {
      await expect(page.getByText('ステーキング報酬')).toBeVisible();
    });

    test('should display recommended badge on DEX', async ({ page }) => {
      await expect(page.getByText('おすすめ')).toBeVisible();
    });
  });

  test.describe('DEX Section', () => {
    test('should display DEX section heading', async ({ page }) => {
      await expect(page.getByText('分散型取引所で購入')).toBeVisible();
    });

    test('should display Uniswap option', async ({ page }) => {
      await expect(page.getByText('Uniswap')).toBeVisible();
    });

    test('should display SushiSwap option', async ({ page }) => {
      await expect(page.getByText('SushiSwap')).toBeVisible();
    });

    test('should display trading pairs', async ({ page }) => {
      await expect(page.getByText('QS/ETH').first()).toBeVisible();
      await expect(page.getByText('QS/USDC')).toBeVisible();
    });

    test('should display how to buy steps', async ({ page }) => {
      await expect(page.getByText('QSの購入方法')).toBeVisible();
    });
  });

  test.describe('Contract Info', () => {
    test('should display contract section heading', async ({ page }) => {
      await expect(page.getByText('公式トークンコントラクト')).toBeVisible();
    });

    test('should display Ethereum Mainnet', async ({ page }) => {
      await expect(page.getByText('Ethereum Mainnet')).toBeVisible();
    });

    test('should display security warning', async ({ page }) => {
      await expect(page.getByText('公式コントラクトアドレスのみを使用してください')).toBeVisible();
    });
  });

  test.describe('CTA Section', () => {
    test('should display CTA heading', async ({ page }) => {
      await expect(page.getByText('QSをロックする準備はできましたか？')).toBeVisible();
    });

    test('should display lock button', async ({ page }) => {
      await expect(page.getByText('今すぐQSをロック')).toBeVisible();
    });

    test('should display learn more button', async ({ page }) => {
      await expect(page.getByText('veQSについてもっと学ぶ')).toBeVisible();
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
      await expect(page.getByRole('heading', { name: 'QSトークンの入手方法' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have breadcrumb with aria-label', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: 'パンくずリストナビゲーション' });
      await expect(breadcrumb).toBeVisible();
    });

    test('should have external links with proper attributes', async ({ page }) => {
      const externalLinks = page.locator('a[target="_blank"]');
      const count = await externalLinks.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});
