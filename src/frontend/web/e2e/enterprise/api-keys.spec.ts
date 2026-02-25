import { test, expect } from '@playwright/test';

test.describe('Enterprise API Keys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/api-keys');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'APIキー' })).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.getByRole('link', { name: /使用状況/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /Webhooks/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /APIキーを作成/ })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'APIキー管理ダッシュボード' })).toBeVisible();
    });
  });

  test.describe('Statistics Cards', () => {
    test('should display API key statistics', async ({ page }) => {
      await expect(page.getByText('総APIキー数')).toBeVisible();
      await expect(page.getByText('アクティブキー')).toBeVisible();
      await expect(page.getByText('本日のAPI呼び出し')).toBeVisible();
      await expect(page.getByText('レート制限')).toBeVisible();
    });

    test('should display stat values', async ({ page }) => {
      const statsSection = page.locator('[aria-label="APIキー統計"]');
      await expect(statsSection).toBeVisible();
    });
  });

  test.describe('Expiring Key Alert', () => {
    test('should display expiring key alert', async ({ page }) => {
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText('APIキーの有効期限が近づいています')).toBeVisible();
    });

    test('should display rotate key button in alert', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'キーをローテーション' })).toBeVisible();
    });
  });

  test.describe('API Keys List', () => {
    test('should display API keys card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'APIキー' })).toBeVisible();
    });

    test('should display production keys', async ({ page }) => {
      await expect(page.getByText('Production Key #1')).toBeVisible();
      await expect(page.getByText('Production Key #2')).toBeVisible();
    });

    test('should display test keys', async ({ page }) => {
      await expect(page.getByText('Test Key #1')).toBeVisible();
    });

    test('should display environment badges', async ({ page }) => {
      await expect(page.getByText('PRODUCTION').first()).toBeVisible();
      await expect(page.getByText('TEST').first()).toBeVisible();
    });

    test('should display masked key values', async ({ page }) => {
      await expect(page.getByText(/qs_live_.*7a3f/)).toBeVisible();
      await expect(page.getByText(/qs_test_.*4b2a/)).toBeVisible();
    });

    test('should display key metadata', async ({ page }) => {
      await expect(page.getByText(/作成日:.*2025-12-01/)).toBeVisible();
      await expect(page.getByText(/有効期限:.*2026-01-18/)).toBeVisible();
    });

    test('should display key actions', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'ローテーション' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: '無効化' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'コピー' }).first()).toBeVisible();
    });

    test('should display inactive key with delete button', async ({ page }) => {
      await expect(page.getByText('Legacy Key (Deprecated)')).toBeVisible();
      await expect(page.getByRole('button', { name: '削除' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      await expect(h2s.first()).toBeVisible();
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('should have accessible alert', async ({ page }) => {
      await expect(page.getByRole('alert')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { name: 'APIキー' })).toBeVisible();
    });

    test('should stack columns for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { level: 1, name: 'APIキー' })).toBeVisible();
    });
  });
});

test.describe('Enterprise API Keys - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/api-keys');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'API Keys' })).toBeVisible();
  });

  test('should display English action buttons', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Usage/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Webhooks/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Create API Key/ })).toBeVisible();
  });

  test('should display English statistics labels', async ({ page }) => {
    await expect(page.getByText('Total API Keys')).toBeVisible();
    await expect(page.getByText('Active Keys')).toBeVisible();
    await expect(page.getByText('API Calls (Today)')).toBeVisible();
    await expect(page.getByText('Rate Limit')).toBeVisible();
  });

  test('should display English alert', async ({ page }) => {
    await expect(page.getByText('API Key Expiring Soon')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rotate Key' })).toBeVisible();
  });

  test('should display English key actions', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Rotate' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Revoke' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' }).first()).toBeVisible();
  });
});
