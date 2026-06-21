import { test, expect } from '@playwright/test';

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/history');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('取引履歴');
    });

    test('should display back button with proper aria-label', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await expect(backButton).toBeVisible();
    });

    test('should display export CSV button', async ({ page }) => {
      const exportButton = page.locator('button[aria-label="CSVエクスポート"]');
      await expect(exportButton).toBeVisible();
      await expect(exportButton).toContainText('CSVエクスポート');
    });
  });

  test.describe('Stats Section', () => {
    test('should display all stats cards', async ({ page }) => {
      // Total Locked
      await expect(page.getByText('総 Lock量')).toBeVisible();
      await expect(page.getByText('24.85')).toBeVisible();

      // Total Transactions
      await expect(page.getByText('総取引数')).toBeVisible();
      await expect(page.getByText('15')).toBeVisible();

      // In Progress
      await expect(page.getByText('進行中')).toBeVisible();
    });
  });

  test.describe('Filter Tabs', () => {
    test('should display all filter tabs', async ({ page }) => {
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toBeVisible();

      const tabs = tablist.locator('[role="tab"]');
      await expect(tabs).toHaveCount(5);

      // Verify tab labels
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

    test('should filter transactions when Lock tab is clicked', async ({ page }) => {
      const lockTab = page.locator('[role="tab"]').nth(1);
      await lockTab.click();

      await expect(lockTab).toHaveAttribute('aria-selected', 'true');

      // Should only show Lock transactions
      const historyItems = page.locator('article[role="button"]');
      const count = await historyItems.count();

      for (let i = 0; i < count; i++) {
        await expect(historyItems.nth(i)).toContainText('Lock');
      }
    });

    test('should filter transactions when Pending tab is clicked', async ({ page }) => {
      const pendingTab = page.locator('[role="tab"]').nth(3);
      await pendingTab.click();

      await expect(pendingTab).toHaveAttribute('aria-selected', 'true');

      // Should only show pending transactions (Normal Unlock)
      const historyItems = page.locator('article[role="button"]');
      await expect(historyItems).toHaveCount(1);
      await expect(historyItems.first()).toContainText('Normal Unlock');
    });

    test('should filter transactions when Emergency tab is clicked', async ({ page }) => {
      const emergencyTab = page.locator('[role="tab"]').nth(4);
      await emergencyTab.click();

      await expect(emergencyTab).toHaveAttribute('aria-selected', 'true');

      // Should only show emergency transactions
      const historyItems = page.locator('article[role="button"]');
      await expect(historyItems).toHaveCount(1);
      await expect(historyItems.first()).toContainText('Emergency Unlock');
    });

    test('should support keyboard navigation between tabs', async ({ page }) => {
      const allTab = page.locator('[role="tab"]').first();
      await allTab.focus();

      // Press ArrowRight to move to Lock tab
      await page.keyboard.press('ArrowRight');
      const lockTab = page.locator('[role="tab"]').nth(1);
      await expect(lockTab).toBeFocused();
      await expect(lockTab).toHaveAttribute('aria-selected', 'true');

      // Press ArrowRight to move to Unlock tab
      await page.keyboard.press('ArrowRight');
      const unlockTab = page.locator('[role="tab"]').nth(2);
      await expect(unlockTab).toBeFocused();
      await expect(unlockTab).toHaveAttribute('aria-selected', 'true');

      // Press ArrowLeft to go back
      await page.keyboard.press('ArrowLeft');
      await expect(lockTab).toBeFocused();

      // Press Home to go to first tab
      await page.keyboard.press('Home');
      await expect(allTab).toBeFocused();

      // Press End to go to last tab
      await page.keyboard.press('End');
      const emergencyTab = page.locator('[role="tab"]').nth(4);
      await expect(emergencyTab).toBeFocused();
    });
  });

  test.describe('History List', () => {
    test('should display history items with correct structure', async ({ page }) => {
      const historyItems = page.locator('article[role="button"]');
      await expect(historyItems.first()).toBeVisible();

      // First item should be a Lock
      const firstItem = historyItems.first();
      await expect(firstItem).toContainText('Lock');
      await expect(firstItem).toContainText('5.00 ETH');
      await expect(firstItem).toContainText('完了');
      await expect(firstItem).toContainText('0x7a3f...9c2d');
    });

    test('should display pending unlock with remaining time', async ({ page }) => {
      const pendingItem = page.locator('article[role="button"]').filter({
        hasText: 'Normal Unlock',
      });
      await expect(pendingItem).toContainText('24h待機中');
      await expect(pendingItem).toContainText('残り');
      await expect(pendingItem).toContainText('2.50 ETH');
    });

    test('should display emergency unlock with bond info', async ({ page }) => {
      const emergencyItem = page.locator('article[role="button"]').filter({
        hasText: 'Emergency Unlock',
      });
      await expect(emergencyItem).toContainText('7日待機中');
      await expect(emergencyItem).toContainText('Bond:');
      await expect(emergencyItem).toContainText('0.75 ETH');
    });

    test('should display unlock complete with block confirmation', async ({ page }) => {
      const unlockItem = page.locator('article[role="button"]').filter({
        hasText: 'Unlock Complete',
      });
      await expect(unlockItem).toContainText('完了');
      await expect(unlockItem).toContainText('ブロック確認済');
      await expect(unlockItem).toContainText('1.25 ETH');
    });

    test('should be keyboard accessible', async ({ page }) => {
      const firstItem = page.locator('article[role="button"]').first();
      await firstItem.focus();
      await expect(firstItem).toBeFocused();

      // Tab to next item
      await page.keyboard.press('Tab');
      const secondItem = page.locator('article[role="button"]').nth(1);
      await expect(secondItem).toBeFocused();
    });

    test('should handle Enter key press on item', async ({ page }) => {
      // Listen for console.log (our click handler logs)
      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        if (msg.text().includes('Transaction clicked')) {
          consoleMessages.push(msg.text());
        }
      });

      const firstItem = page.locator('article[role="button"]').first();
      await firstItem.focus();
      await page.keyboard.press('Enter');

      await expect(() => {
        expect(consoleMessages.length).toBeGreaterThan(0);
      }).toPass({ timeout: 2000 });
    });
  });

  test.describe('Load More Button', () => {
    test('should display load more button', async ({ page }) => {
      const loadMoreButton = page.getByRole('button', { name: 'さらに読み込む' });
      await expect(loadMoreButton).toBeVisible();
    });

    test('should show alert when clicked (demo behavior)', async ({ page }) => {
      const loadMoreButton = page.getByRole('button', { name: 'さらに読み込む' });

      // Listen for dialog
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('開発中');
        await dialog.accept();
      });

      await loadMoreButton.click();
    });
  });

  test.describe('Export CSV Button', () => {
    test('should show alert when export is clicked (demo behavior)', async ({ page }) => {
      const exportButton = page.locator('button[aria-label="CSVエクスポート"]');

      // Listen for dialog
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('開発中');
        await dialog.accept();
      });

      await exportButton.click();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to dashboard when back button is clicked', async ({
      page,
    }) => {
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

    test('should have proper ARIA structure for filter tabs', async ({ page }) => {
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toHaveAttribute('aria-label', 'Filter transactions');

      const activeTab = page.locator('[role="tab"][aria-selected="true"]');
      await expect(activeTab).toHaveAttribute('aria-controls', 'history-list');
    });

    test('should have proper ARIA structure for history list', async ({ page }) => {
      const tabpanel = page.locator('[role="tabpanel"]');
      await expect(tabpanel).toHaveAttribute('id', 'history-list');
      await expect(tabpanel).toHaveAttribute('aria-label', 'Transaction history');
    });

    test('should have visible focus indicators', async ({ page }) => {
      const exportButton = page.locator('button[aria-label="CSVエクスポート"]');
      await exportButton.focus();

      // Check that focus is visible (button has focus styles)
      await expect(exportButton).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Header should be visible
      await expect(page.locator('h1')).toBeVisible();

      // Stats should stack on mobile
      const statsRegion = page.locator('[role="region"]');
      await expect(statsRegion).toBeVisible();

      // Filter tabs should be scrollable
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toBeVisible();

      // History items should be visible
      const historyItems = page.locator('article[role="button"]');
      await expect(historyItems.first()).toBeVisible();
    });
  });
});

test.describe('History Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/history');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Transaction History');

    // Filter tabs in English
    const tabs = page.locator('[role="tab"]');
    await expect(tabs.nth(0)).toContainText('All');
    await expect(tabs.nth(1)).toContainText('Lock');
    await expect(tabs.nth(3)).toContainText('Pending');
    await expect(tabs.nth(4)).toContainText('Emergency');

    // Stats in English
    await expect(page.getByText('Total Locked')).toBeVisible();
    await expect(page.getByText('Total Transactions')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
  });

  test('should display status badges in English', async ({ page }) => {
    await expect(page.getByText('Complete').first()).toBeVisible();
    await expect(page.getByText('24h Pending')).toBeVisible();
    await expect(page.getByText('7 Days Pending')).toBeVisible();
  });
});
