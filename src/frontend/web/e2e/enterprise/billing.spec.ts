import { test, expect } from '@playwright/test';

test.describe('Enterprise Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/billing');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: '請求管理' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: '請求管理ダッシュボード' })).toBeVisible();
    });

    test('should display view invoices button', async ({ page }) => {
      await expect(page.getByRole('link', { name: '請求書一覧' })).toBeVisible();
    });
  });

  test.describe('Current Plan Section', () => {
    test('should display current plan title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '現在のプラン' })).toBeVisible();
    });

    test('should display Enterprise plan', async ({ page }) => {
      await expect(page.getByText('Enterprise')).toBeVisible();
    });

    test('should display monthly fee', async ({ page }) => {
      await expect(page.getByText('$2,500.00')).toBeVisible();
    });

    test('should display next billing date', async ({ page }) => {
      await expect(page.getByText('2026-01-01')).toBeVisible();
    });

    test('should display payment method', async ({ page }) => {
      await expect(page.getByText('**** 4242')).toBeVisible();
    });

    test('should display update payment button', async ({ page }) => {
      await expect(page.getByRole('button', { name: '支払い方法を更新' })).toBeVisible();
    });
  });

  test.describe('Usage Section', () => {
    test('should display usage title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '今月の使用状況' })).toBeVisible();
    });

    test('should display API calls usage', async ({ page }) => {
      await expect(page.getByText('API コール数')).toBeVisible();
    });

    test('should display transactions usage', async ({ page }) => {
      await expect(page.getByText('トランザクション数')).toBeVisible();
    });

    test('should display storage usage', async ({ page }) => {
      await expect(page.getByText('ストレージ使用量')).toBeVisible();
    });
  });

  test.describe('Recent Charges Section', () => {
    test('should display recent charges title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '最近の請求' })).toBeVisible();
    });

    test('should display charges table headers', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: '日付' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '内容' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '金額' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'ステータス' })).toBeVisible();
    });

    test('should display charge entries', async ({ page }) => {
      await expect(page.getByText('2025-12-01')).toBeVisible();
      await expect(page.getByText('Enterprise Plan - December 2025')).toBeVisible();
    });

    test('should display download receipt links', async ({ page }) => {
      const downloadLinks = page.getByRole('button', { name: '領収書をダウンロード' });
      expect(await downloadLinks.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to invoices page', async ({ page }) => {
      await page.getByRole('link', { name: '請求書一覧' }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/enterprise\/invoices/);
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
  });
});

test.describe('Enterprise Billing - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Billing' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Current Plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Current Usage' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Charges' })).toBeVisible();
  });

  test('should display English usage labels', async ({ page }) => {
    await expect(page.getByText('API Calls')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
    await expect(page.getByText('Storage Usage')).toBeVisible();
  });
});
