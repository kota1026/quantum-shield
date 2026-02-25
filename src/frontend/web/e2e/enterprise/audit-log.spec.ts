import { test, expect } from '@playwright/test';

test.describe('Enterprise Audit Log', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/audit-log');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: '監査ログ' })).toBeVisible();
    });

    test('should display export button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /CSVエクスポート/ })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: '監査ログダッシュボード' })).toBeVisible();
    });
  });

  test.describe('Filter Section', () => {
    test('should display filter controls', async ({ page }) => {
      await expect(page.getByText('カテゴリ:')).toBeVisible();
      await expect(page.getByText('ユーザー:')).toBeVisible();
      await expect(page.getByText('期間:')).toBeVisible();
    });

    test('should display category filter options', async ({ page }) => {
      const categorySelect = page.locator('select').first();
      await expect(categorySelect).toBeVisible();
      await categorySelect.selectOption('auth');
    });

    test('should display search input', async ({ page }) => {
      await expect(page.getByPlaceholder('アクションを検索...')).toBeVisible();
    });

    test('should display apply button', async ({ page }) => {
      await expect(page.getByRole('button', { name: '適用' })).toBeVisible();
    });
  });

  test.describe('Audit Log List', () => {
    test('should display audit log card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'アクティビティログ' })).toBeVisible();
    });

    test('should display event count', async ({ page }) => {
      await expect(page.getByText(/1,234 件/)).toBeVisible();
    });

    test('should display audit events', async ({ page }) => {
      await expect(page.getByText('佐藤 太郎')).toBeVisible();
      await expect(page.getByText('API')).toBeVisible();
      await expect(page.getByText('System')).toBeVisible();
    });

    test('should display event actions', async ({ page }) => {
      await expect(page.getByText('ログイン')).toBeVisible();
    });

    test('should display event details', async ({ page }) => {
      await expect(page.getByText(/Browser: Chrome/)).toBeVisible();
    });

    test('should display timestamps', async ({ page }) => {
      await expect(page.getByText(/2026-01-11/).first()).toBeVisible();
    });

    test('should display IP addresses', async ({ page }) => {
      await expect(page.getByText(/203\.0\.113/).first()).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      await expect(page.getByRole('navigation', { name: 'ページネーション' })).toBeVisible();
    });

    test('should display showing count', async ({ page }) => {
      await expect(page.getByText(/1 - 20 件を表示/)).toBeVisible();
    });

    test('should display page buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: '← 前へ' })).toBeVisible();
      await expect(page.getByRole('button', { name: '次へ →' })).toBeVisible();
    });

    test('should highlight current page', async ({ page }) => {
      const currentPageButton = page.getByRole('button', { name: '1' });
      await expect(currentPageButton).toHaveAttribute('aria-current', 'page');
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

    test('should have accessible filter section', async ({ page }) => {
      await expect(page.locator('[aria-label="フィルター"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { name: '監査ログ' })).toBeVisible();
    });

    test('should stack columns for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { level: 1, name: '監査ログ' })).toBeVisible();
    });
  });
});

test.describe('Enterprise Audit Log - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/audit-log');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Audit Log' })).toBeVisible();
  });

  test('should display English filter labels', async ({ page }) => {
    await expect(page.getByText('Category:')).toBeVisible();
    await expect(page.getByText('User:')).toBeVisible();
    await expect(page.getByText('Period:')).toBeVisible();
  });

  test('should display English action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Export CSV/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible();
  });

  test('should display English pagination', async ({ page }) => {
    await expect(page.getByRole('button', { name: '← Previous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next →' })).toBeVisible();
  });
});
