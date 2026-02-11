import { test, expect } from '@playwright/test';

test.describe('Explorer Locks Page', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/locks');
    await page.waitForLoadState('networkidle');
    // Wait for the page header to confirm the page has rendered
    await page.locator('h1').filter({ hasText: '全Lock' }).waitFor({ state: 'visible', timeout: 15000 });
  });

  test('should display the page header', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: '全Lock' })).toBeVisible();
  });

  test('should display statistics labels', async ({ page }) => {
    // Check for i18n label text only (actual values depend on API/fallback data)
    await expect(page.getByText('総Lock数')).toBeVisible();
    await expect(page.getByText('総ロック額')).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    // Status filter - aria-label comes from t('locks.table.status') = "ステータス"
    const statusFilter = page.locator('select[aria-label="ステータス"]');
    await expect(statusFilter).toBeVisible();

    // Sort filter
    const sortFilter = page.locator('select[aria-label="Sort order"]');
    await expect(sortFilter).toBeVisible();

    // Search input
    const searchInput = page.locator('input[aria-label="Lock IDまたはアドレスで絞り込み..."]');
    await expect(searchInput).toBeVisible();
  });

  test('should display the locks table with headers', async ({ page }) => {
    // Check that the table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check table headers
    await expect(page.locator('th').filter({ hasText: 'Lock ID' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'オーナー' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: '金額' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Lock日時' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'ステータス' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'L2 TX' })).toBeVisible();
  });

  test('should show empty state or lock rows', async ({ page }) => {
    // FALLBACK data is empty array; if backend API returns data, rows will appear.
    const emptyState = page.getByText('Lockがありません');
    const dataRows = page.locator('tr[role="button"]');

    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const rowCount = await dataRows.count();

    if (hasEmpty) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByText('現在表示できるLockがありません')).toBeVisible();
    } else {
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  test('should display status badges when data exists', async ({ page }) => {
    const dataRows = page.locator('tr[role="button"]');
    const rowCount = await dataRows.count();

    if (rowCount === 0) {
      // No data - verify empty state instead
      await expect(page.getByText('Lockがありません')).toBeVisible();
      return;
    }

    // At least one status badge should be visible (アクティブ, Unlock中, or 完了)
    const hasActive = await page.getByText('アクティブ').first().isVisible().catch(() => false);
    const hasUnlocking = await page.getByText('Unlock中').first().isVisible().catch(() => false);
    const hasComplete = await page.getByText('完了').first().isVisible().catch(() => false);

    expect(hasActive || hasUnlocking || hasComplete).toBe(true);
  });

  test('should filter locks by status', async ({ page }) => {
    const statusFilter = page.locator('select[aria-label="ステータス"]');
    await expect(statusFilter).toBeVisible();

    // Select "unlocking" option
    await statusFilter.selectOption('unlocking');
    await page.waitForTimeout(500);

    // After filtering, either empty state or only unlocking rows should show
    const hasEmpty = await page.getByText('Lockがありません').isVisible().catch(() => false);

    if (!hasEmpty) {
      // If rows exist, verify no "アクティブ" badges in the table body
      const activeBadgesInBody = page.locator('tbody').getByText('アクティブ');
      await expect(activeBadgesInBody).toHaveCount(0);
    }
  });

  test('should accept search input', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Lock IDまたはアドレスで絞り込み..."]');
    await expect(searchInput).toBeVisible();

    // Type a search query and verify it was accepted
    await searchInput.fill('0x1234');
    await page.waitForTimeout(500);
    await expect(searchInput).toHaveValue('0x1234');
  });

  test('should open detail panel when clicking a lock row', async ({ page }) => {
    const dataRows = page.locator('tr[role="button"]');
    const rowCount = await dataRows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await dataRows.first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.getByText('Lock詳細')).toBeVisible();
  });

  test('should display lock details in the panel', async ({ page }) => {
    const dataRows = page.locator('tr[role="button"]');
    const rowCount = await dataRows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await dataRows.first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check detail section headings
    await expect(page.getByText('Lock情報')).toBeVisible();
    await expect(page.getByText('トランザクション')).toBeVisible();

    // Check detail fields inside the dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText('Lock ID')).toBeVisible();
    await expect(dialog.getByText('ブロック番号')).toBeVisible();
    await expect(dialog.getByText('Dilithium鍵')).toBeVisible();
  });

  test('should close detail panel with close button', async ({ page }) => {
    const dataRows = page.locator('tr[role="button"]');
    const rowCount = await dataRows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await dataRows.first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Close button has aria-label from t('locks.detail.close') = "閉じる"
    await page.locator('[role="dialog"] button[aria-label="閉じる"]').click();
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test('should close detail panel with Escape key', async ({ page }) => {
    const dataRows = page.locator('tr[role="button"]');
    const rowCount = await dataRows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await dataRows.first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test('should close detail panel when clicking overlay', async ({ page }) => {
    const dataRows = page.locator('tr[role="button"]');
    const rowCount = await dataRows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await dataRows.first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click the overlay background
    await page.locator('.fixed.inset-0.bg-black\/70').click({ force: true });
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test('should show pagination only when data exists', async ({ page }) => {
    const dataRows = page.locator('tr[role="button"]');
    const rowCount = await dataRows.count();

    if (rowCount === 0) {
      // With no data, pagination should not be rendered
      await expect(page.getByRole('button', { name: '前へ' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '次へ' })).not.toBeVisible();
    } else {
      // With data, pagination controls should be visible
      await expect(page.getByRole('button', { name: '前へ' })).toBeVisible();
      await expect(page.getByRole('button', { name: '次へ' })).toBeVisible();
    }
  });

  test('should sort locks when data exists', async ({ page }) => {
    const dataRows = page.locator('tr[role="button"]');
    const rowCount = await dataRows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    const sortFilter = page.locator('select[aria-label="Sort order"]');
    await sortFilter.selectOption('amountHigh');
    await page.waitForTimeout(500);

    // Verify rows still exist after sorting
    const newRowCount = await page.locator('tr[role="button"]').count();
    expect(newRowCount).toBeGreaterThan(0);
  });

  test('should copy lock ID when clicking copy button', async ({ page }) => {
    const dataRows = page.locator('tr[role="button"]');
    const rowCount = await dataRows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    await dataRows.first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click copy button - text from t('locks.detail.actions.copyLockId') = "Lock IDをコピー"
    const copyButton = page.locator('[role="dialog"]').getByText('Lock IDをコピー');
    if (await copyButton.isVisible().catch(() => false)) {
      await copyButton.click();
      await expect(page.locator('[role="dialog"]').getByText('Copied!')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should have proper ARIA roles for accessibility', async ({ page }) => {
    // Check navigation
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();

    // Check table with aria-label
    const table = page.locator('table[aria-label="Lock一覧テーブル"]');
    await expect(table).toBeVisible();

    // Check scope on headers (6 columns: Lock ID, Owner, Amount, Lock Time, Status, L2 TX)
    const headers = page.locator('th[scope="col"]');
    await expect(headers).toHaveCount(6);
  });

  test('should display navigation links', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    await expect(nav.getByText('概要')).toBeVisible();
    await expect(nav.getByText('Lock')).toBeVisible();
    await expect(nav.getByText('Unlock')).toBeVisible();
  });

  test('should have Locks tab as current page', async ({ page }) => {
    const locksLink = page.locator('nav[role="navigation"] a[aria-current="page"]');
    await expect(locksLink).toBeVisible();
    await expect(locksLink).toHaveText('Lock');
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/locks');
    await page.waitForLoadState('networkidle');
    await page.locator('h1').filter({ hasText: 'All Locks' }).waitFor({ state: 'visible', timeout: 15000 });

    await expect(page.locator('h1').filter({ hasText: 'All Locks' })).toBeVisible();
    await expect(page.getByText('Total Locks')).toBeVisible();
    await expect(page.getByText('Total Value')).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Lock ID' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Owner' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Amount' })).toBeVisible();
  });
});
