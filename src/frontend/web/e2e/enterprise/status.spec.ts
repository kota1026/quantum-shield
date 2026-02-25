import { test, expect } from '@playwright/test';

test.describe('Enterprise Status Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/status');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'システムステータス' })).toBeVisible();
    });

    test('should display the sidebar navigation', async ({ page }) => {
      await expect(page.getByRole('navigation', { name: 'エンタープライズ管理ナビゲーション' })).toBeVisible();
    });

    test('should highlight Status in sidebar as active', async ({ page }) => {
      const statusLink = page.locator('a[href="/enterprise/status"]');
      await expect(statusLink).toHaveAttribute('aria-current', 'page');
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'システムステータスダッシュボード' })).toBeVisible();
    });
  });

  test.describe('Overall Status Badge', () => {
    test('should display overall status badge', async ({ page }) => {
      await expect(page.getByRole('status')).toBeVisible();
      await expect(page.getByText('全システム稼働中')).toBeVisible();
    });

    test('should have live region for status updates', async ({ page }) => {
      const statusBadge = page.getByRole('status');
      await expect(statusBadge).toHaveAttribute('aria-live', 'polite');
    });
  });

  test.describe('Core Services', () => {
    test('should display core services card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'コアサービス' })).toBeVisible();
    });

    test('should display API Gateway status', async ({ page }) => {
      await expect(page.getByText('APIゲートウェイ')).toBeVisible();
      await expect(page.getByText('稼働中').first()).toBeVisible();
    });

    test('should display Smart Contract status', async ({ page }) => {
      await expect(page.getByText('スマートコントラクト')).toBeVisible();
    });

    test('should display Database status', async ({ page }) => {
      await expect(page.getByText('データベース')).toBeVisible();
    });

    test('should display Cache Layer status', async ({ page }) => {
      await expect(page.getByText('キャッシュレイヤー')).toBeVisible();
    });
  });

  test.describe('External Connections', () => {
    test('should display external connections card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '外部接続' })).toBeVisible();
    });

    test('should display Ethereum Mainnet status', async ({ page }) => {
      await expect(page.getByText('Ethereum メインネット')).toBeVisible();
      await expect(page.getByText('接続中')).toBeVisible();
    });

    test('should display Prover Network status', async ({ page }) => {
      await expect(page.getByText('Prover ネットワーク')).toBeVisible();
      await expect(page.getByText('127ノード')).toBeVisible();
    });

    test('should display Webhooks status', async ({ page }) => {
      await expect(page.getByText('Webhook')).toBeVisible();
      await expect(page.getByText('稼働率99.9%')).toBeVisible();
    });

    test('should display Price Oracle status', async ({ page }) => {
      await expect(page.getByText('価格オラクル')).toBeVisible();
      await expect(page.getByText('2秒前に更新')).toBeVisible();
    });
  });

  test.describe('Performance Metrics', () => {
    test('should display performance card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'パフォーマンス' })).toBeVisible();
    });

    test('should display API Latency', async ({ page }) => {
      await expect(page.getByText('APIレイテンシ')).toBeVisible();
      await expect(page.getByText('平均45ms')).toBeVisible();
    });

    test('should display TX Confirmation time', async ({ page }) => {
      await expect(page.getByText('TX確認時間')).toBeVisible();
      await expect(page.getByText('平均12秒')).toBeVisible();
    });

    test('should display Error Rate', async ({ page }) => {
      await expect(page.getByText('エラー率')).toBeVisible();
      await expect(page.getByText('0.01%')).toBeVisible();
    });

    test('should display Uptime', async ({ page }) => {
      await expect(page.getByText('稼働率(30日)')).toBeVisible();
      await expect(page.getByText('99.99%')).toBeVisible();
    });
  });

  test.describe('Recent Incidents', () => {
    test('should display incidents card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '最近のインシデント' })).toBeVisible();
    });

    test('should display no incidents message', async ({ page }) => {
      await expect(page.getByText('過去30日間にインシデントはありません')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      await expect(h2s).toHaveCount(4);
    });

    test('should have accessible navigation landmarks', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('should have accessible service lists', async ({ page }) => {
      const lists = page.getByRole('list');
      await expect(lists).toHaveCount(3);
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt grid for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { name: 'コアサービス' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '外部接続' })).toBeVisible();
    });

    test('should stack cards for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText('全システム稼働中')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'コアサービス' })).toBeVisible();
    });
  });
});

test.describe('Enterprise Status Dashboard - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/status');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'System Status' })).toBeVisible();
    await expect(page.getByText('All Systems Operational')).toBeVisible();
  });

  test('should display English service names', async ({ page }) => {
    await expect(page.getByText('API Gateway')).toBeVisible();
    await expect(page.getByText('Smart Contract')).toBeVisible();
    await expect(page.getByText('Database')).toBeVisible();
    await expect(page.getByText('Ethereum Mainnet')).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Core Services' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'External Connections' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Incidents' })).toBeVisible();
  });
});
