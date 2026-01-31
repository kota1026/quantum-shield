import { test, expect } from '@playwright/test';

test.describe('Enterprise Help', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/help');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'ヘルプセンター' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'ヘルプセンターダッシュボード' })).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
      await expect(page.getByPlaceholder('ヘルプトピックを検索...')).toBeVisible();
    });
  });

  test.describe('Getting Started Section', () => {
    test('should display getting started section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'はじめに' })).toBeVisible();
    });

    test('should display getting started items', async ({ page }) => {
      await expect(page.getByText('セットアップガイド')).toBeVisible();
      await expect(page.getByText('APIキー管理')).toBeVisible();
      await expect(page.getByText('インテグレーション')).toBeVisible();
      await expect(page.getByText('セキュリティ設定')).toBeVisible();
    });
  });

  test.describe('Popular Topics Section', () => {
    test('should display topics section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '人気のトピック' })).toBeVisible();
    });

    test('should display topic items', async ({ page }) => {
      await expect(page.getByText('トランザクション管理')).toBeVisible();
      await expect(page.getByText('ユーザー管理')).toBeVisible();
      await expect(page.getByText('Webhook設定')).toBeVisible();
      await expect(page.getByText('レポート作成')).toBeVisible();
    });
  });

  test.describe('Resources Section', () => {
    test('should display resources section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'リソース' })).toBeVisible();
    });

    test('should display resource items', async ({ page }) => {
      await expect(page.getByText('APIドキュメント')).toBeVisible();
      await expect(page.getByText('サポート')).toBeVisible();
      await expect(page.getByText('更新履歴')).toBeVisible();
      await expect(page.getByText('システム状態')).toBeVisible();
    });
  });

  test.describe('Contact CTA', () => {
    test('should display contact section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'お困りですか？' })).toBeVisible();
    });

    test('should display contact button', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'サポートに連絡' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      expect(await h2s.count()).toBeGreaterThanOrEqual(3);
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have accessible search', async ({ page }) => {
      const search = page.getByRole('searchbox');
      await expect(search).toBeVisible();
    });
  });
});

test.describe('Enterprise Help - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/help');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Help Center' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Popular Topics' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Need Help?' })).toBeVisible();
  });

  test('should display English search placeholder', async ({ page }) => {
    await expect(page.getByPlaceholder('Search help topics...')).toBeVisible();
  });
});
