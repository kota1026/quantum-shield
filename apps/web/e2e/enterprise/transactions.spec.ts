import { test, expect } from '@playwright/test';

test.describe('Enterprise Transaction List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/transactions');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'トランザクション一覧' })).toBeVisible();
    });

    test('should display the sidebar navigation', async ({ page }) => {
      await expect(page.getByRole('navigation', { name: 'エンタープライズ管理ナビゲーション' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'トランザクション一覧ダッシュボード' })).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.getByRole('link', { name: /分析/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /エクスポート/ })).toBeVisible();
    });
  });

  test.describe('Filters', () => {
    test('should display filter controls', async ({ page }) => {
      await expect(page.getByRole('search', { name: 'トランザクションフィルター' })).toBeVisible();
    });

    test('should display type filter', async ({ page }) => {
      await expect(page.getByLabel('種別:')).toBeVisible();
      const typeSelect = page.locator('#filter-type');
      await expect(typeSelect).toBeVisible();
    });

    test('should display status filter', async ({ page }) => {
      await expect(page.getByLabel('ステータス:')).toBeVisible();
      const statusSelect = page.locator('#filter-status');
      await expect(statusSelect).toBeVisible();
    });

    test('should display date range filters', async ({ page }) => {
      await expect(page.getByLabel('開始日')).toBeVisible();
      await expect(page.getByLabel('終了日')).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
      await expect(page.getByPlaceholder('TXハッシュ、アドレスで検索...')).toBeVisible();
    });

    test('should display apply filters button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'フィルター適用' })).toBeVisible();
    });
  });

  test.describe('Transaction Table', () => {
    test('should display table with transactions', async ({ page }) => {
      await expect(page.getByRole('grid', { name: 'トランザクションテーブル' })).toBeVisible();
    });

    test('should display table headers', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: 'TXハッシュ' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '種別' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '金額' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '送信元' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'ステータス' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '時間' })).toBeVisible();
    });

    test('should display transaction rows', async ({ page }) => {
      await expect(page.getByText('0x7a3f...9c2d')).toBeVisible();
      await expect(page.getByText('5.00 ETH')).toBeVisible();
    });

    test('should display type badges', async ({ page }) => {
      await expect(page.getByText('ロック').first()).toBeVisible();
      await expect(page.getByText('アンロック').first()).toBeVisible();
    });

    test('should display status badges', async ({ page }) => {
      await expect(page.getByText('完了').first()).toBeVisible();
    });

    test('should have clickable TX hash links', async ({ page }) => {
      const txLink = page.getByRole('link', { name: '0x7a3f...9c2d' });
      await expect(txLink).toBeVisible();
      await expect(txLink).toHaveAttribute('href', /\/enterprise\/transactions\//);
    });

    test('should have view buttons', async ({ page }) => {
      await expect(page.getByRole('link', { name: '詳細' }).first()).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      await expect(page.getByRole('navigation', { name: 'トランザクションページネーション' })).toBeVisible();
    });

    test('should display pagination info', async ({ page }) => {
      await expect(page.getByText(/件中.*件を表示/)).toBeVisible();
    });

    test('should display previous/next buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: '前へ' })).toBeVisible();
      await expect(page.getByRole('button', { name: '次へ' })).toBeVisible();
    });

    test('should have current page highlighted', async ({ page }) => {
      const currentPage = page.getByRole('button', { name: '1ページ' });
      await expect(currentPage).toHaveAttribute('aria-current', 'page');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);
    });

    test('should have accessible table', async ({ page }) => {
      await expect(page.getByRole('grid')).toBeVisible();
    });

    test('should have accessible navigation landmarks', async ({ page }) => {
      await expect(page.getByRole('navigation')).toHaveCount(2); // sidebar + pagination
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('should have keyboard accessible filters', async ({ page }) => {
      const typeSelect = page.locator('#filter-type');
      await typeSelect.focus();
      await expect(typeSelect).toBeFocused();
    });

    test('should have checkbox accessibility', async ({ page }) => {
      const selectAllCheckbox = page.getByLabel('すべてのトランザクションを選択');
      await expect(selectAllCheckbox).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { name: 'トランザクション一覧' })).toBeVisible();
    });

    test('should adapt layout for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { name: 'トランザクション一覧' })).toBeVisible();
    });
  });
});

test.describe('Enterprise Transaction List - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/transactions');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Transaction List' })).toBeVisible();
  });

  test('should display English filter labels', async ({ page }) => {
    await expect(page.getByLabel('Type:')).toBeVisible();
    await expect(page.getByLabel('Status:')).toBeVisible();
  });

  test('should display English table headers', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'TX Hash' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
  });

  test('should display English action buttons', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Analytics/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Export/ })).toBeVisible();
  });
});
