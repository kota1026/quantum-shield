import { test, expect } from '@playwright/test';

test.describe('Enterprise Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/invoices');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: '請求書一覧' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: '請求書一覧' })).toBeVisible();
    });

    test('should display back to billing link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /請求管理に戻る/ })).toBeVisible();
    });

    test('should display download all button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /すべてダウンロード/ })).toBeVisible();
    });
  });

  test.describe('Invoice Table', () => {
    test('should display table headers', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: '請求書ID' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '期間' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '金額' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'ステータス' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible();
    });

    test('should display invoice entries', async ({ page }) => {
      await expect(page.getByText('INV-2025-012')).toBeVisible();
      await expect(page.getByText('2025年12月')).toBeVisible();
      await expect(page.getByText('$2,500.00').first()).toBeVisible();
    });

    test('should display paid status badges', async ({ page }) => {
      const paidBadges = page.getByText('支払い済み');
      expect(await paidBadges.count()).toBeGreaterThanOrEqual(1);
    });

    test('should display download links for each invoice', async ({ page }) => {
      const downloadLinks = page.getByRole('button', { name: 'ダウンロード' });
      expect(await downloadLinks.count()).toBeGreaterThanOrEqual(1);
    });

    test('should display view links for each invoice', async ({ page }) => {
      const viewLinks = page.getByRole('button', { name: '表示' });
      expect(await viewLinks.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to billing page', async ({ page }) => {
      await page.getByRole('link', { name: /請求管理に戻る/ }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/enterprise\/billing/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);
    });

    test('should have accessible table', async ({ page }) => {
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Enterprise Invoices - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/invoices');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Invoice List' })).toBeVisible();
  });

  test('should display English table headers', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Invoice ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Period' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
  });

  test('should display English status badges', async ({ page }) => {
    const paidBadges = page.getByText('Paid');
    expect(await paidBadges.count()).toBeGreaterThanOrEqual(1);
  });

  test('should display English back link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Back to Billing/ })).toBeVisible();
  });
});
