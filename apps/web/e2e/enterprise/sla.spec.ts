import { test, expect } from '@playwright/test';

test.describe('Enterprise SLA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/sla');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'サービスレベル契約（SLA）' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'SLA詳細ページ' })).toBeVisible();
    });

    test('should display last updated date', async ({ page }) => {
      await expect(page.getByText(/最終更新日:/)).toBeVisible();
    });
  });

  test.describe('SLA Overview', () => {
    test('should display overview section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'SLA概要' })).toBeVisible();
    });
  });

  test.describe('Service Metrics', () => {
    test('should display metrics section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'サービス指標' })).toBeVisible();
    });

    test('should display uptime metric', async ({ page }) => {
      await expect(page.getByText('99.9%')).toBeVisible();
      await expect(page.getByText('稼働率保証')).toBeVisible();
    });

    test('should display response time metric', async ({ page }) => {
      await expect(page.getByText('<2時間')).toBeVisible();
      await expect(page.getByText('応答時間')).toBeVisible();
    });

    test('should display resolution time metric', async ({ page }) => {
      await expect(page.getByText('<24時間')).toBeVisible();
      await expect(page.getByText('解決時間')).toBeVisible();
    });
  });

  test.describe('SLA Sections', () => {
    test('should display availability section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '1. サービス可用性' })).toBeVisible();
    });

    test('should display support section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '2. サポート対応時間' })).toBeVisible();
    });

    test('should display credits section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '3. サービスクレジット' })).toBeVisible();
    });

    test('should display exclusions section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '4. 除外事項' })).toBeVisible();
    });

    test('should display reporting section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '5. インシデント報告' })).toBeVisible();
    });

    test('should display monitoring section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '6. 監視と通知' })).toBeVisible();
    });

    test('should display contact section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'お問い合わせ' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      expect(await h2s.count()).toBeGreaterThanOrEqual(7);
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Enterprise SLA - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/sla');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Service Level Agreement (SLA)' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'SLA Overview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Service Metrics' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '1. Service Availability' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '3. Service Credits' })).toBeVisible();
  });

  test('should display English metrics', async ({ page }) => {
    await expect(page.getByText('Uptime Guarantee')).toBeVisible();
    await expect(page.getByText('Response Time')).toBeVisible();
    await expect(page.getByText('Resolution Time')).toBeVisible();
  });
});
