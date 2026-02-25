import { test, expect } from '@playwright/test';

test.describe('Enterprise Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/support');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'サポートポータル' })).toBeVisible();
    });

    test('should display new ticket button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /サポートチケットを作成/ })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'サポートポータルダッシュボード' })).toBeVisible();
    });
  });

  test.describe('Support Hero', () => {
    test('should display hero section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'エンタープライズサポート' })).toBeVisible();
    });

    test('should display SLA stats', async ({ page }) => {
      await expect(page.getByText('99.9%')).toBeVisible();
      await expect(page.getByText('稼働率SLA')).toBeVisible();
      await expect(page.getByText('<2時間')).toBeVisible();
      await expect(page.getByText('応答時間')).toBeVisible();
      await expect(page.getByText('24/7')).toBeVisible();
      await expect(page.getByText('対応可能')).toBeVisible();
    });
  });

  test.describe('Documentation', () => {
    test('should display documentation section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'ドキュメント' })).toBeVisible();
    });

    test('should display documentation items', async ({ page }) => {
      await expect(page.getByText('APIリファレンス')).toBeVisible();
      await expect(page.getByText('インテグレーションガイド')).toBeVisible();
      await expect(page.getByText('セキュリティホワイトペーパー')).toBeVisible();
      await expect(page.getByText('コンプライアンスドキュメント')).toBeVisible();
    });
  });

  test.describe('FAQ', () => {
    test('should display FAQ section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'よくある質問' })).toBeVisible();
    });

    test('should display FAQ questions', async ({ page }) => {
      await expect(page.getByText('APIキーをローテーションする方法は？')).toBeVisible();
      await expect(page.getByText('緊急アンロック時に何が起こりますか？')).toBeVisible();
      await expect(page.getByText('IPアドレスを許可リストに追加する方法は？')).toBeVisible();
    });

    test('should expand FAQ answer when clicked', async ({ page }) => {
      await page.getByText('APIキーをローテーションする方法は？').click();
      await expect(page.getByText(/新しいキーが生成され/)).toBeVisible();
    });
  });

  test.describe('Contact Support', () => {
    test('should display contact section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'サポートに連絡' })).toBeVisible();
    });

    test('should display contact information', async ({ page }) => {
      await expect(page.getByText('enterprise@quantumshield.io')).toBeVisible();
      await expect(page.getByText('+81-3-1234-5678')).toBeVisible();
      await expect(page.getByText('#acme-qs-support')).toBeVisible();
    });
  });

  test.describe('SLA Information', () => {
    test('should display SLA section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'あなたのSLA' })).toBeVisible();
    });

    test('should display SLA badge', async ({ page }) => {
      await expect(page.getByText('エンタープライズプラン有効')).toBeVisible();
    });

    test('should display SLA details', async ({ page }) => {
      await expect(page.getByText('応答時間:')).toBeVisible();
      await expect(page.getByText('稼働率SLA:')).toBeVisible();
      await expect(page.getByText('専任CSM:')).toBeVisible();
      await expect(page.getByText('契約期限:')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      expect(await h2s.count()).toBeGreaterThanOrEqual(4);
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have accessible FAQ buttons', async ({ page }) => {
      const faqButtons = page.locator('button[aria-expanded]');
      expect(await faqButtons.count()).toBeGreaterThanOrEqual(1);
    });
  });
});

test.describe('Enterprise Support - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/support');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Support Portal' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Enterprise Support' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Documentation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contact Support' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your SLA' })).toBeVisible();
  });

  test('should display English SLA stats', async ({ page }) => {
    await expect(page.getByText('Uptime SLA')).toBeVisible();
    await expect(page.getByText('Response Time')).toBeVisible();
    await expect(page.getByText('Availability')).toBeVisible();
  });
});
