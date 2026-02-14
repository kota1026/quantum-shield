import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Help', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/token-hub/help');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'ヘルプ' })).toBeVisible();
    });

    test('should display back to settings link', async ({ page }) => {
      const backLink = page.locator('a[href*="token-hub/settings"]').first();
      await expect(backLink).toBeVisible();
    });
  });

  test.describe('Search', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]');
      await expect(searchInput).toBeVisible();
    });

    test('should accept search input', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]');
      await searchInput.fill('veQS');
      await expect(searchInput).toHaveValue('veQS');
    });
  });

  test.describe('Quick Links', () => {
    test('should display quick links heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'クイックリンク' })).toBeVisible();
    });

    test('should display tokenomics quick link', async ({ page }) => {
      await expect(page.getByText('トークノミクスを学ぶ')).toBeVisible();
    });

    test('should display locking quick link', async ({ page }) => {
      await expect(page.getByText('QSをロックする')).toBeVisible();
    });

    test('should display governance quick link', async ({ page }) => {
      await expect(page.getByText('ガバナンス参加')).toBeVisible();
    });

    test('should display rewards quick link', async ({ page }) => {
      await expect(page.getByText('報酬を確認')).toBeVisible();
    });
  });

  test.describe('Resources', () => {
    test('should display resources heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'リソース' })).toBeVisible();
    });

    test('should display FAQ resource', async ({ page }) => {
      await expect(page.getByText('FAQ').first()).toBeVisible();
    });

    test('should display Get QS resource', async ({ page }) => {
      await expect(page.getByText('QSを入手')).toBeVisible();
    });

    test('should display docs resource', async ({ page }) => {
      await expect(page.getByText('ドキュメント')).toBeVisible();
    });

    test('should display system status resource', async ({ page }) => {
      await expect(page.getByText('システム状態')).toBeVisible();
    });
  });

  test.describe('Tutorial CTA', () => {
    test('should display tutorial section', async ({ page }) => {
      await expect(page.getByText('はじめてのToken Hub')).toBeVisible();
    });

    test('should display tutorial button', async ({ page }) => {
      await expect(page.getByText('チュートリアルを見る')).toBeVisible();
    });
  });

  test.describe('Consumer App Link', () => {
    test('should display Consumer App section', async ({ page }) => {
      await expect(page.getByText('Consumer Appを探していますか？')).toBeVisible();
    });

    test('should display Consumer App button', async ({ page }) => {
      await expect(page.getByText('Consumer Appへ')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'ヘルプ' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have sections with aria-labelledby', async ({ page }) => {
      await expect(page.locator('[aria-labelledby="quick-links-heading"]')).toBeVisible();
      await expect(page.locator('[aria-labelledby="resources-heading"]')).toBeVisible();
    });

    test('should have accessible search input', async ({ page }) => {
      const searchInput = page.locator('input[type="search"][aria-label]');
      await expect(searchInput).toBeVisible();
    });
  });
});
