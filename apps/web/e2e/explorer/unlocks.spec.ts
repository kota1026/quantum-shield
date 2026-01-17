import { test, expect } from '@playwright/test';

test.describe('Explorer Unlocks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/unlocks');
  });

  test('should display the page header', async ({ page }) => {
    await expect(page.locator('h1:has-text("全Unlock")')).toBeVisible();
  });

  test('should display statistics', async ({ page }) => {
    // Check pending count
    await expect(page.locator('text=127')).toBeVisible();
    await expect(page.locator('text=保留中')).toBeVisible();

    // Check completed count
    await expect(page.locator('text=8,234')).toBeVisible();
    await expect(page.locator('text=完了').first()).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    // Status filter
    const statusFilter = page.locator('select[aria-label="ステータス"]');
    await expect(statusFilter).toBeVisible();

    // Type filter
    const typeFilter = page.locator('select[aria-label="タイプ"]');
    await expect(typeFilter).toBeVisible();
  });

  test('should display the unlocks table', async ({ page }) => {
    // Check table headers
    await expect(page.locator('th:has-text("Unlock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Lock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("タイプ")')).toBeVisible();
    await expect(page.locator('th:has-text("Time Lock")')).toBeVisible();
    await expect(page.locator('th:has-text("Prover署名")')).toBeVisible();
    await expect(page.locator('th:has-text("ステータス")')).toBeVisible();
  });

  test('should display unlock rows with data', async ({ page }) => {
    // Check for unlock data
    await expect(page.locator('text=0x2e7f...d934')).toBeVisible();
    await expect(page.locator('text=0x7a3f...e821')).toBeVisible();
    await expect(page.locator('text=3/5').first()).toBeVisible();
  });

  test('should display status badges', async ({ page }) => {
    // Check for pending status
    await expect(page.locator('.bg-foreground-tertiary\\/10:has-text("保留中")').first()).toBeVisible();

    // Check for complete status
    await expect(page.locator('.bg-success\\/10:has-text("完了")').first()).toBeVisible();
  });

  test('should display type indicators', async ({ page }) => {
    // Normal type
    await expect(page.locator('text=通常').first()).toBeVisible();

    // Emergency type (warning color)
    await expect(page.locator('.text-warning:has-text("緊急")')).toBeVisible();
  });

  test('should filter unlocks by status', async ({ page }) => {
    const statusFilter = page.locator('select[aria-label="ステータス"]');

    // Filter by complete
    await statusFilter.selectOption('complete');

    // Should only show complete unlocks
    await expect(page.locator('.bg-success\\/10:has-text("完了")').first()).toBeVisible();
  });

  test('should filter unlocks by type', async ({ page }) => {
    const typeFilter = page.locator('select[aria-label="タイプ"]');

    // Filter by emergency
    await typeFilter.selectOption('emergency');

    // Should only show emergency unlocks
    await expect(page.locator('.text-warning:has-text("緊急")')).toBeVisible();
  });

  test('should open detail panel when clicking an unlock row', async ({ page }) => {
    // Click on the first unlock row
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();

    // Detail panel should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Unlock詳細")')).toBeVisible();
  });

  test('should display unlock details in the panel', async ({ page }) => {
    // Click on the first unlock row
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();

    // Check detail sections
    await expect(page.locator('text=Unlock情報')).toBeVisible();
    await expect(page.locator('text=Dilithium署名')).toBeVisible();
    await expect(page.locator('text=Prover署名')).toBeVisible();
  });

  test('should display time lock progress bar', async ({ page }) => {
    // Click on the first unlock row (pending status)
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();

    // Check time lock progress
    await expect(page.locator('text=Time Lock進捗')).toBeVisible();
  });

  test('should display prover signature list', async ({ page }) => {
    // Click on first row
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();

    // Check prover list
    await expect(page.locator('text=Prover Alpha')).toBeVisible();
    await expect(page.locator('text=Prover Beta')).toBeVisible();
    await expect(page.locator('text=署名済み').first()).toBeVisible();
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

  test('should have pagination controls', async ({ page }) => {
    // Check pagination info
    await expect(page.locator('text=/\\d+-\\d+件/')).toBeVisible();

    // Check pagination buttons
    await expect(page.locator('button:has-text("前へ")')).toBeVisible();
    await expect(page.locator('button:has-text("次へ")')).toBeVisible();
  });

  test('should display navigation', async ({ page }) => {
    // Check navigation links
    await expect(page.locator('nav[role="navigation"] >> text=概要')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=Lock')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=Unlock')).toBeVisible();
  });

  test('should have Unlocks tab as current page', async ({ page }) => {
    const unlocksLink = page.locator('nav[role="navigation"] a[aria-current="page"]');
    await expect(unlocksLink).toHaveText('Unlock');
  });

  test('should navigate to lock detail from panel', async ({ page }) => {
    // Open detail panel
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.click();

    // Click on lock ID link
    await page.locator('[role="dialog"] a:has-text("0x7a3f")').click();

    // Should navigate to lock detail
    await expect(page).toHaveURL(/\/ja\/explorer\/locks\//);
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/unlocks');

    // Check English labels
    await expect(page.locator('h1:has-text("All Unlocks")')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('th:has-text("Unlock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Lock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
  });

  test('should display challenged status with defense time', async ({ page }) => {
    // Check for challenged unlock
    await expect(page.locator('.bg-warning\\/10:has-text("Challenge中")').first()).toBeVisible();
    await expect(page.locator('text=防御期限').first()).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to first row and open with Enter
    const firstRow = page.locator('tr[role="button"]').first();
    await firstRow.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should have proper ARIA roles for accessibility', async ({ page }) => {
    // Check navigation
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();

    // Check table
    const table = page.locator('table[aria-label="Unlock一覧テーブル"]');
    await expect(table).toBeVisible();

    // Check scope on headers
    const headers = page.locator('th[scope="col"]');
    await expect(headers).toHaveCount(6);
  });
});
