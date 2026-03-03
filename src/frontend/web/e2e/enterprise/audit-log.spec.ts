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

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: '監査ログダッシュボード' })).toBeVisible();
    });

    test('should display enterprise navigation', async ({ page }) => {
      await expect(page.getByRole('navigation').first()).toBeVisible();
    });

    test('should display top bar with search and user menu', async ({ page }) => {
      await expect(page.getByRole('banner')).toBeVisible();
      await expect(page.getByRole('searchbox', { name: '検索' })).toBeVisible();
      await expect(page.getByRole('link', { name: '通知を表示' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'ユーザーメニューを開く' })).toBeVisible();
    });
  });

  test.describe('Saved Searches', () => {
    test('should display saved searches button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /保存した検索/ })).toBeVisible();
    });

    test('should display save current search button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /現在の検索を保存/ })).toBeVisible();
    });
  });

  test.describe('Advanced Search', () => {
    test('should display search input with placeholder', async ({ page }) => {
      await expect(
        page.getByRole('textbox', { name: '高度な検索' })
      ).toBeVisible();
      await expect(
        page.getByPlaceholder('アクション、ユーザー、詳細を検索...')
      ).toBeVisible();
    });

    test('should display advanced filter toggle button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /詳細フィルター/ })).toBeVisible();
    });

    test('should display search button', async ({ page }) => {
      await expect(page.getByRole('button', { name: '検索', exact: true })).toBeVisible();
    });

    test('should allow typing in search input', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: '高度な検索' });
      await searchInput.fill('ログイン');
      await expect(searchInput).toHaveValue('ログイン');
    });

    test('should toggle advanced filters panel', async ({ page }) => {
      const filterButton = page.getByRole('button', { name: /詳細フィルター/ });
      await filterButton.click();
      // After expanding, date inputs and severity options should appear
      await expect(page.getByText(/期間/)).toBeVisible();
      await expect(page.getByText(/重要度/)).toBeVisible();
    });
  });

  test.describe('Activity Log List', () => {
    test('should display activity log heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'アクティビティログ' })).toBeVisible();
    });

    test('should display event count with period', async ({ page }) => {
      await expect(page.getByText(/過去30日/)).toBeVisible();
      await expect(page.getByText(/件のイベント/)).toBeVisible();
    });

    test('should display activity log list element', async ({ page }) => {
      // The list element exists even when empty (0 events)
      await expect(page.getByRole('list', { name: 'アクティビティログ' })).toBeAttached();
    });

    test('should handle empty state when no events exist', async ({ page }) => {
      // The list exists but may be empty (0 events)
      const eventCount = page.getByText(/0 件のイベント/);
      const hasEvents = page.locator('li').first();
      // Either empty state text is shown or list items exist - both are valid
      const isEmpty = await eventCount.isVisible().catch(() => false);
      if (isEmpty) {
        // No list items should be present when 0 events
        await expect(page.getByRole('list', { name: 'アクティビティログ' }).locator('li')).toHaveCount(0);
      } else {
        // If events exist, at least one list item should be visible
        await expect(hasEvents).toBeVisible();
      }
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination navigation', async ({ page }) => {
      await expect(
        page.getByRole('navigation', { name: '監査ログページネーション' })
      ).toBeVisible();
    });

    test('should display showing count text', async ({ page }) => {
      await expect(page.getByText(/件中.*件を表示/)).toBeVisible();
    });

    test('should display previous and next buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /← 前へ/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /次へ →/ })).toBeVisible();
    });

    test('should display page number buttons', async ({ page }) => {
      const paginationNav = page.getByRole('navigation', { name: '監査ログページネーション' });
      // Page 1 button should exist and be the current page
      const page1Button = paginationNav.getByRole('button', { name: '1' });
      await expect(page1Button).toBeVisible();
      await expect(page1Button).toHaveAttribute('aria-current', 'page');
    });
  });

  test.describe('Accessibility', () => {
    test('should have exactly one h1 heading', async ({ page }) => {
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    });

    test('should have proper heading hierarchy with h2', async ({ page }) => {
      const h2s = page.locator('h2');
      await expect(h2s.first()).toBeVisible();
    });

    test('should have accessible main landmark', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have accessible banner landmark', async ({ page }) => {
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('should have accessible navigation landmarks', async ({ page }) => {
      // Multiple navigation elements exist (sidebar, pagination)
      const navElements = page.getByRole('navigation');
      const navCount = await navElements.count();
      expect(navCount).toBeGreaterThanOrEqual(2);
    });

    test('should have accessible search input with aria-label', async ({ page }) => {
      await expect(page.getByRole('textbox', { name: '高度な検索' })).toBeVisible();
    });

    test('should have accessible pagination with aria-current on active page', async ({ page }) => {
      const paginationNav = page.getByRole('navigation', { name: '監査ログページネーション' });
      await expect(paginationNav).toBeVisible();
      const currentPage = paginationNav.locator('[aria-current="page"]');
      await expect(currentPage).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { level: 1, name: '監査ログ' })).toBeVisible();
      await expect(page.getByRole('main', { name: '監査ログダッシュボード' })).toBeVisible();
    });

    test('should display content for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { level: 1, name: '監査ログ' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'アクティビティログ' })).toBeVisible();
    });
  });
});

test.describe('Enterprise Audit Log - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/audit-log');
    await page.waitForLoadState('networkidle');
  });

  test('should display English page title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Audit Log' })).toBeVisible();
  });

  test('should display English main content area', async ({ page }) => {
    await expect(page.getByRole('main', { name: 'Audit log dashboard' })).toBeVisible();
  });

  test('should display English search input', async ({ page }) => {
    await expect(
      page.getByPlaceholder('Search actions, users, details...')
    ).toBeVisible();
  });

  test('should display English advanced filter button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Advanced Filters/ })).toBeVisible();
  });

  test('should display English search button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeVisible();
  });

  test('should display English saved searches button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Saved Searches/ })).toBeVisible();
  });

  test('should display English activity log heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Activity Log' })).toBeVisible();
  });

  test('should display English event count with period', async ({ page }) => {
    await expect(page.getByText(/Last 30 days/)).toBeVisible();
    await expect(page.getByText(/\d+ events/).first()).toBeVisible();
  });

  test('should display English pagination controls', async ({ page }) => {
    await expect(
      page.getByRole('navigation', { name: 'Audit log pagination' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /← Previous/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Next →/ })).toBeVisible();
  });

  test('should display English showing count', async ({ page }) => {
    await expect(page.getByText(/Showing .* of .* events/)).toBeVisible();
  });
});
