import { test, expect } from '@playwright/test';

test.describe('Explorer Locks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/locks');
  });

  test('should display the page header', async ({ page }) => {
    await expect(page.locator('h1:has-text("全Lock")')).toBeVisible();
  });

  test('should display statistics', async ({ page }) => {
    // Check total locks count
    await expect(page.locator('text=24,891')).toBeVisible();
    await expect(page.locator('text=総Lock数')).toBeVisible();

    // Check total value
    await expect(page.locator('text=$847.2M')).toBeVisible();
    await expect(page.locator('text=総ロック額')).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    // Status filter
    const statusFilter = page.locator('select[aria-label="ステータス"]');
    await expect(statusFilter).toBeVisible();

    // Sort filter
    const sortFilter = page.locator('select[aria-label="Sort order"]');
    await expect(sortFilter).toBeVisible();

    // Search input
    const searchInput = page.locator('input[aria-label="Lock IDまたはアドレスで絞り込み..."]');
    await expect(searchInput).toBeVisible();
  });

  test('should display the locks table', async ({ page }) => {
    // Check table headers
    await expect(page.locator('th:has-text("Lock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("オーナー")')).toBeVisible();
    await expect(page.locator('th:has-text("金額")')).toBeVisible();
    await expect(page.locator('th:has-text("Lock日時")')).toBeVisible();
    await expect(page.locator('th:has-text("ステータス")')).toBeVisible();
    await expect(page.locator('th:has-text("L2 TX")')).toBeVisible();
  });

  test('should display lock rows with data', async ({ page }) => {
    // Check for lock data
    await expect(page.locator('text=0x7a3f...e821')).toBeVisible();
    await expect(page.locator('text=125.5').first()).toBeVisible();
    await expect(page.locator('text=ETH').first()).toBeVisible();
  });

  test('should display status badges', async ({ page }) => {
    // Check for status badges
    await expect(page.locator('.bg-gold\\/10:has-text("アクティブ")').first()).toBeVisible();
  });

  test('should filter locks by status', async ({ page }) => {
    const statusFilter = page.locator('select[aria-label="ステータス"]');

    // Filter by unlocking
    await statusFilter.selectOption('unlocking');

    // Should only show unlocking locks
    await expect(page.locator('.bg-foreground-tertiary\\/10:has-text("Unlock中")')).toBeVisible();
  });

  test('should filter locks by search query', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Lock IDまたはアドレスで絞り込み..."]');

    // Search for a specific lock
    await searchInput.fill('0x7a3f');

    // Should show matching results
    await expect(page.locator('text=0x7a3f...e821')).toBeVisible();
  });

  test('should open detail panel when clicking a lock row', async ({ page }) => {
    // Click on the first lock row
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();

    // Detail panel should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Lock詳細")')).toBeVisible();
  });

  test('should display lock details in the panel', async ({ page }) => {
    // Click on the first lock row
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();

    // Check detail sections
    await expect(page.locator('text=Lock情報')).toBeVisible();
    await expect(page.locator('text=オーナー').nth(1)).toBeVisible();
    await expect(page.locator('text=トランザクション')).toBeVisible();

    // Check detail fields
    await expect(page.locator('[role="dialog"] >> text=Lock ID')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=ブロック番号')).toBeVisible();
    await expect(page.locator('[role="dialog"] >> text=Dilithium鍵')).toBeVisible();
  });

  test('should close detail panel with close button', async ({ page }) => {
    // Open detail panel
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Close with button
    await page.locator('[role="dialog"] button[aria-label="閉じる"]').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should close detail panel with Escape key', async ({ page }) => {
    // Open detail panel
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should close detail panel when clicking overlay', async ({ page }) => {
    // Open detail panel
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click overlay (the dark background)
    await page.locator('.bg-black\\/70').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should have pagination controls', async ({ page }) => {
    // Check pagination info
    await expect(page.locator('text=/\\d+-\\d+件/')).toBeVisible();

    // Check pagination buttons
    await expect(page.locator('button:has-text("前へ")')).toBeVisible();
    await expect(page.locator('button:has-text("次へ")')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to first interactive element (navigation)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Tab through to the filter controls
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Eventually reach a table row and press Enter to open detail
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should display navigation', async ({ page }) => {
    // Check navigation links
    await expect(page.locator('nav[role="navigation"] >> text=概要')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=Lock')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=Unlock')).toBeVisible();
  });

  test('should have Locks tab as current page', async ({ page }) => {
    const locksLink = page.locator('nav[role="navigation"] a[aria-current="page"]');
    await expect(locksLink).toHaveText('Lock');
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/locks');

    // Check English labels
    await expect(page.locator('h1:has-text("All Locks")')).toBeVisible();
    await expect(page.locator('text=Total Locks')).toBeVisible();
    await expect(page.locator('text=Total Value')).toBeVisible();
    await expect(page.locator('th:has-text("Lock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Owner")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
  });

  test('should copy lock ID when clicking copy button', async ({ page }) => {
    // Open detail panel
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();

    // Click copy button
    const copyButton = page.locator('[role="dialog"] button:has-text("Lock IDをコピー")');
    await copyButton.click();

    // Button should show "Copied!"
    await expect(page.locator('[role="dialog"] button:has-text("Copied!")')).toBeVisible();
  });

  test('should sort locks by amount', async ({ page }) => {
    const sortFilter = page.locator('select[aria-label="Sort order"]');

    // Sort by highest amount
    await sortFilter.selectOption('amountHigh');

    // First lock should have highest amount (320.0)
    const firstAmount = page.locator('tbody tr').first().locator('text=/\\d+\\.\\d+/').first();
    await expect(firstAmount).toHaveText('320.0');
  });

  test('should have proper ARIA roles for accessibility', async ({ page }) => {
    // Check navigation
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();

    // Check table
    const table = page.locator('table[aria-label="Lock一覧テーブル"]');
    await expect(table).toBeVisible();

    // Check scope on headers
    const headers = page.locator('th[scope="col"]');
    await expect(headers).toHaveCount(6);
  });
});
