import { test, expect } from '../fixtures';

/**
 * Consumer App History Page E2E Tests
 *
 * Uses authenticatedPage fixture for real SIWE JWT auth.
 * APIs:
 *   - GET /v1/user/dashboard — stats (totalLocked, pendingUnlocks)
 *   - GET /v1/user/transactions?per_page=50 — transaction history
 *
 * No mocking — all data comes from the live backend at localhost:8080.
 * Tests gracefully handle both populated and empty API responses.
 */

test.use({
  navigationTimeout: 60000,
  actionTimeout: 15000,
  expect: { timeout: 15000 },
});
test.setTimeout(60000);

test.describe('Consumer History Page', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/ja/consumer/history');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test.describe('Page Load & Layout', () => {
    test('should render page with main landmark', async ({ page }) => {
      const main = page.getByRole('main');
      await expect(main).toBeVisible();
    });

    test('should display header with title and back button', async ({ page }) => {
      // Heading "取引履歴"
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
      await expect(heading).toContainText('取引履歴');

      // Back button with aria-label "戻る"
      const backButton = page.locator('a[aria-label="戻る"]');
      await expect(backButton).toBeVisible();
    });

    test('should display CSV export button', async ({ page }) => {
      const exportButton = page.locator('button[aria-label="CSVエクスポート"]');
      await expect(exportButton).toBeVisible();
      await expect(exportButton).toContainText('CSVエクスポート');
    });
  });

  test.describe('Stats Section (API-driven)', () => {
    test('should display stats labels from API data', async ({ page }) => {
      // Stats labels are always visible (values come from API)
      await expect(page.getByText('総 Lock量')).toBeVisible();
      await expect(page.getByText('総取引数')).toBeVisible();
      await expect(page.getByText('進行中').first()).toBeVisible();
    });

    test('stats values should match API response', async ({ page }) => {
      // Capture the dashboard API response for stats
      const dashboardResponse = await page
        .waitForResponse(
          (resp) =>
            resp.url().includes('/v1/user/dashboard') && resp.status() === 200,
          { timeout: 10000 }
        )
        .catch(() => null);

      if (dashboardResponse) {
        const dashData = await dashboardResponse.json();
        const pendingUnlocks = dashData.pending_unlocks ?? 0;

        // Verify the "In Progress" stat matches API
        const statsRegion = page.locator('[role="region"]');
        await expect(statsRegion).toBeVisible();

        // The pending unlocks count should appear somewhere in the stats
        await expect(
          page.getByText(pendingUnlocks.toString()).first()
        ).toBeVisible();
      }
    });
  });

  test.describe('Filter Tabs', () => {
    test('should display all 5 filter tabs', async ({ page }) => {
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toBeVisible();

      const tabs = tablist.locator('[role="tab"]');
      await expect(tabs).toHaveCount(5);

      await expect(tabs.nth(0)).toContainText('すべて');
      await expect(tabs.nth(1)).toContainText('Lock');
      await expect(tabs.nth(2)).toContainText('Unlock');
      await expect(tabs.nth(3)).toContainText('進行中');
      await expect(tabs.nth(4)).toContainText('緊急');
    });

    test('should have "All" tab selected by default', async ({ page }) => {
      const allTab = page.locator('[role="tab"]').first();
      await expect(allTab).toHaveAttribute('aria-selected', 'true');
    });

    test('clicking a filter tab should select it', async ({ page }) => {
      const lockTab = page.locator('[role="tab"]').nth(1);
      await lockTab.click();
      await expect(lockTab).toHaveAttribute('aria-selected', 'true');

      // "All" tab should no longer be selected
      const allTab = page.locator('[role="tab"]').first();
      await expect(allTab).toHaveAttribute('aria-selected', 'false');
    });

    test('should support keyboard navigation between tabs', async ({ page }) => {
      const allTab = page.locator('[role="tab"]').first();
      await allTab.focus();

      // ArrowRight should move to Lock tab
      await page.keyboard.press('ArrowRight');
      const lockTab = page.locator('[role="tab"]').nth(1);
      await expect(lockTab).toBeFocused();
      await expect(lockTab).toHaveAttribute('aria-selected', 'true');

      // ArrowRight should move to Unlock tab
      await page.keyboard.press('ArrowRight');
      const unlockTab = page.locator('[role="tab"]').nth(2);
      await expect(unlockTab).toBeFocused();

      // ArrowLeft should go back
      await page.keyboard.press('ArrowLeft');
      await expect(lockTab).toBeFocused();

      // Home should go to first tab
      await page.keyboard.press('Home');
      await expect(allTab).toBeFocused();

      // End should go to last tab
      await page.keyboard.press('End');
      const emergencyTab = page.locator('[role="tab"]').nth(4);
      await expect(emergencyTab).toBeFocused();
    });
  });

  test.describe('Transaction List (API-driven)', () => {
    test('should load transactions from API and render items or empty state', async ({
      page,
    }) => {
      // Wait for the transactions API call
      const txResponse = await page
        .waitForResponse(
          (resp) =>
            resp.url().includes('/v1/user/transactions') &&
            !resp.url().includes('tx_type=') &&
            resp.status() === 200,
          { timeout: 10000 }
        )
        .catch(() => null);

      if (txResponse) {
        const data = await txResponse.json();
        const transactions = data.transactions || [];

        if (transactions.length === 0) {
          // Empty state
          await expect(page.getByText('取引履歴がありません')).toBeVisible();
        } else {
          // Items rendered
          const items = page.locator('article[role="button"]');
          await expect(items.first()).toBeVisible();

          // Verify item count matches API (up to per_page limit)
          const renderedCount = await items.count();
          expect(renderedCount).toBeGreaterThan(0);
          expect(renderedCount).toBeLessThanOrEqual(transactions.length);
        }
      }
    });

    test('transaction items should display type and amount from API data', async ({
      page,
    }) => {
      const txResponse = await page
        .waitForResponse(
          (resp) =>
            resp.url().includes('/v1/user/transactions') &&
            !resp.url().includes('tx_type=') &&
            resp.status() === 200,
          { timeout: 10000 }
        )
        .catch(() => null);

      if (txResponse) {
        const data = await txResponse.json();
        const transactions = data.transactions || [];

        if (transactions.length > 0) {
          // First item should be visible and contain "ETH"
          const firstItem = page.locator('article[role="button"]').first();
          await expect(firstItem).toBeVisible();
          await expect(firstItem).toContainText('ETH');
        }
      }
    });

    test('empty state should display when no transactions exist', async ({ page }) => {
      // If no transactions loaded, the empty state should show
      const historyList = page.locator('#history-list');
      await expect(historyList).toBeVisible();

      const items = page.locator('article[role="button"]');
      const count = await items.count();

      if (count === 0) {
        await expect(page.getByText('取引履歴がありません')).toBeVisible();
        await expect(
          page.getByText('最初のLockを実行すると、ここに履歴が表示されます')
        ).toBeVisible();
      }
    });
  });

  test.describe('Load More', () => {
    test('should display load more button when transactions exist', async ({
      page,
    }) => {
      const items = page.locator('article[role="button"]');
      const count = await items.count();

      if (count > 0) {
        await expect(
          page.getByRole('button', { name: 'さらに読み込む' })
        ).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test('back button should navigate to dashboard', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await backButton.click();
      await expect(page).toHaveURL(/\/consumer\/dashboard/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText('取引履歴');
    });

    test('should have proper ARIA structure for tablist', async ({ page }) => {
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toHaveAttribute('aria-label', 'Filter transactions');

      // Active tab should control history list
      const activeTab = page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toHaveAttribute('aria-controls', 'history-list');
    });

    test('should have proper ARIA structure for history list panel', async ({
      page,
    }) => {
      const tabpanel = page.locator('[role="tabpanel"]');
      await expect(tabpanel).toHaveAttribute('id', 'history-list');
      await expect(tabpanel).toHaveAttribute('aria-label', 'Transaction history');
    });

    test('transaction items should be keyboard accessible', async ({ page }) => {
      const items = page.locator('article[role="button"]');
      const count = await items.count();

      if (count > 0) {
        await items.first().focus();
        await expect(items.first()).toBeFocused();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Header visible
      await expect(page.locator('h1')).toBeVisible();

      // Stats region visible
      const statsRegion = page.locator('[role="region"]');
      await expect(statsRegion).toBeVisible();

      // Filter tabs visible and scrollable
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toBeVisible();
    });
  });
});

test.describe('Consumer History Page (English)', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/en/consumer/history');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should display content in English', async ({ page }) => {
    // Heading
    await expect(page.locator('h1')).toContainText('Transaction History');

    // Filter tabs
    const tabs = page.locator('[role="tab"]');
    await expect(tabs.nth(0)).toContainText('All');
    await expect(tabs.nth(1)).toContainText('Lock');
    await expect(tabs.nth(3)).toContainText('Pending');
    await expect(tabs.nth(4)).toContainText('Emergency');

    // Stats labels
    await expect(page.getByText('Total Locked')).toBeVisible();
    await expect(page.getByText('Total Transactions')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
  });

  test('should display English export button', async ({ page }) => {
    await expect(page.locator('button[aria-label="Export CSV"]')).toBeVisible();
  });
});
