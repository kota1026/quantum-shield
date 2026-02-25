import { test, expect } from '@playwright/test';

test.describe('Enterprise Report Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/reports/compliance');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'コンプライアンスレポート' })).toBeVisible();
    });

    test('should display back link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /レポート一覧に戻る/ })).toBeVisible();
    });

    test('should display download button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /PDFをダウンロード/ })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'コンプライアンスレポート詳細' })).toBeVisible();
    });
  });

  test.describe('Report Meta', () => {
    test('should display report period', async ({ page }) => {
      await expect(page.getByText('レポート期間')).toBeVisible();
      await expect(page.getByText('2025年12月')).toBeVisible();
    });

    test('should display generated date', async ({ page }) => {
      await expect(page.getByText('生成日')).toBeVisible();
    });

    test('should display report ID', async ({ page }) => {
      await expect(page.getByText('レポートID')).toBeVisible();
      await expect(page.getByText('CR-2026-001')).toBeVisible();
    });
  });

  test.describe('Compliance Score', () => {
    test('should display compliance score', async ({ page }) => {
      await expect(page.getByText('90%')).toBeVisible();
    });

    test('should display score label', async ({ page }) => {
      await expect(page.getByText('コンプライアンススコア')).toBeVisible();
    });

    test('should display score status', async ({ page }) => {
      await expect(page.getByText('優秀')).toBeVisible();
    });
  });

  test.describe('Security Controls', () => {
    test('should display security controls section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'セキュリティコントロール' })).toBeVisible();
    });

    test('should display passed count', async ({ page }) => {
      await expect(page.getByText('4/4 合格')).toBeVisible();
    });

    test('should display security items', async ({ page }) => {
      await expect(page.getByText('二要素認証')).toBeVisible();
      await expect(page.getByText('IP許可リスト')).toBeVisible();
      await expect(page.getByText('セッション管理')).toBeVisible();
      await expect(page.getByText('監査ログ')).toBeVisible();
    });
  });

  test.describe('Operational Compliance', () => {
    test('should display operational compliance section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '運用コンプライアンス' })).toBeVisible();
    });

    test('should display passed count with warning', async ({ page }) => {
      await expect(page.getByText('3/4 合格')).toBeVisible();
    });

    test('should display operational items', async ({ page }) => {
      await expect(page.getByText('トランザクション監視')).toBeVisible();
      await expect(page.getByText('データ暗号化')).toBeVisible();
      await expect(page.getByText('バックアップ検証')).toBeVisible();
      await expect(page.getByText('インシデント対応計画')).toBeVisible();
    });

    test('should display schedule action for warning item', async ({ page }) => {
      await expect(page.getByRole('button', { name: /今すぐスケジュール/ })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      expect(await h2s.count()).toBeGreaterThanOrEqual(2);
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Enterprise Report Detail - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/reports/compliance');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Compliance Report' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Security Controls' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Operational Compliance' })).toBeVisible();
  });

  test('should display English score status', async ({ page }) => {
    await expect(page.getByText('Excellent')).toBeVisible();
  });
});
