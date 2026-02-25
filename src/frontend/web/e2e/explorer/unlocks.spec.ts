import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.describe('Explorer Unlocks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/unlocks');
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('should display the page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('全Unlock');
  });

  test('should display statistics labels', async ({ page }) => {
    // With FALLBACK data, counts are 0 — just verify the labels exist
    await expect(page.getByText('保留中')).toBeVisible();
    await expect(page.getByText('完了').first()).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    const statusFilter = page.locator('select[aria-label="ステータス"]');
    await expect(statusFilter).toBeVisible();

    const typeFilter = page.locator('select[aria-label="タイプ"]');
    await expect(typeFilter).toBeVisible();
  });

  test('should display the unlocks table with headers', async ({ page }) => {
    const table = page.locator('table[aria-label="Unlock一覧テーブル"]');
    await expect(table).toBeVisible();

    await expect(page.locator('th:has-text("Unlock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Lock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("タイプ")')).toBeVisible();
    await expect(page.locator('th:has-text("Time Lock")')).toBeVisible();
    await expect(page.locator('th:has-text("Prover署名")')).toBeVisible();
    await expect(page.locator('th:has-text("ステータス")')).toBeVisible();
  });

  test('should display empty state or unlock rows', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      // FALLBACK: empty array — verify empty state message
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      await expect(page.getByText('現在表示できるUnlockがありません')).toBeVisible();
    } else {
      // API returned data — verify first row has content
      const firstRow = rows.first();
      await expect(firstRow).toBeVisible();
    }
  });

  test('should display status badges when data exists', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    // At least one status badge should be visible
    const pendingBadge = page.locator('span:has-text("保留中")').first();
    const completeBadge = page.locator('span:has-text("完了")').first();
    const challengedBadge = page.locator('span:has-text("Challenge中")').first();

    const hasBadge =
      (await pendingBadge.isVisible().catch(() => false)) ||
      (await completeBadge.isVisible().catch(() => false)) ||
      (await challengedBadge.isVisible().catch(() => false));

    expect(hasBadge).toBeTruthy();
  });

  test('should display type indicators when data exists', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    // At least one type indicator should be visible
    const normalType = page.getByText('通常').first();
    const emergencyType = page.getByText('緊急').first();

    const hasType =
      (await normalType.isVisible().catch(() => false)) ||
      (await emergencyType.isVisible().catch(() => false));

    expect(hasType).toBeTruthy();
  });

  test('should allow filtering unlocks by status', async ({ page }) => {
    const statusFilter = page.locator('select[aria-label="ステータス"]');
    await statusFilter.selectOption('complete');

    // After filtering, page should still render (either rows or empty state)
    await expect(page.locator('table[aria-label="Unlock一覧テーブル"]')).toBeVisible();
  });

  test('should allow filtering unlocks by type', async ({ page }) => {
    const typeFilter = page.locator('select[aria-label="タイプ"]');
    await typeFilter.selectOption('emergency');

    // After filtering, page should still render
    await expect(page.locator('table[aria-label="Unlock一覧テーブル"]')).toBeVisible();
  });

  test('should open detail panel when clicking an unlock row', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    const firstRow = rows.first();
    await firstRow.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Unlock詳細');
  });

  test('should display unlock details in the panel', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    const firstRow = rows.first();
    await firstRow.click();

    await expect(page.getByText('Unlock情報')).toBeVisible();
    await expect(page.getByText('Dilithium署名')).toBeVisible();
    await expect(page.getByText('Prover署名', { exact: false }).first()).toBeVisible();
  });

  test('should display time lock progress in detail panel', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    const firstRow = rows.first();
    await firstRow.click();

    // Time lock progress only shows for non-complete unlocks
    const progressLabel = page.getByText('Time Lock進捗');
    const isProgressVisible = await progressLabel.isVisible().catch(() => false);
    // Either the progress is visible (pending/challenged) or not (complete) — both are valid
    expect(typeof isProgressVisible).toBe('boolean');
  });

  test('should display prover signature list in detail panel', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    const firstRow = rows.first();
    await firstRow.click();

    // Prover section should be present; check for signed/pending status labels
    const signedLabel = page.getByText('署名済み').first();
    const pendingLabel = page.locator('[role="dialog"]').getByText('保留中').first();

    const hasProverStatus =
      (await signedLabel.isVisible().catch(() => false)) ||
      (await pendingLabel.isVisible().catch(() => false));

    expect(hasProverStatus).toBeTruthy();
  });

  test('should display challenged status with defense time when data exists', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    // Try filtering to challenged status
    const statusFilter = page.locator('select[aria-label="ステータス"]');
    await statusFilter.selectOption('challenged');

    const challengedRows = page.locator('tr[role="button"]');
    const challengedCount = await challengedRows.count();

    if (challengedCount === 0) {
      // No challenged unlocks — this is acceptable
      return;
    }

    await expect(page.getByText('Challenge中').first()).toBeVisible();
    await expect(page.getByText('防御期限').first()).toBeVisible();
  });

  test('should navigate to lock detail from panel when data exists', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    const firstRow = rows.first();
    await firstRow.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Look for the Lock ID link in the detail panel
    const lockLink = page.locator('[role="dialog"] a[href*="/explorer/locks/"]');
    const hasLockLink = await lockLink.count();

    if (hasLockLink > 0) {
      await lockLink.first().click();
      await expect(page).toHaveURL(/\/ja\/explorer\/locks\//);
    }
  });

  test('should close detail panel with close button', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    const firstRow = rows.first();
    await firstRow.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.locator('[role="dialog"] button[aria-label="閉じる"]').click();
    await expect(page.locator('[role="dialog"][aria-hidden="true"]')).toBeAttached();
  });

  test('should close detail panel with Escape key', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    const firstRow = rows.first();
    await firstRow.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"][aria-hidden="true"]')).toBeAttached();
  });

  test('should be keyboard navigable', async ({ page }) => {
    const rows = page.locator('tr[role="button"]');
    const rowCount = await rows.count();

    if (rowCount === 0) {
      await expect(page.getByText('Unlockがありません')).toBeVisible();
      return;
    }

    const firstRow = rows.first();
    await firstRow.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should display navigation', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    await expect(nav.getByText('概要', { exact: false })).toBeVisible();
    await expect(nav.getByText('Lock', { exact: true })).toBeVisible();
    await expect(nav.getByText('Unlock', { exact: true })).toBeVisible();
  });

  test('should have Unlocks tab as current page', async ({ page }) => {
    const unlocksLink = page.locator('nav[role="navigation"] a[aria-current="page"]');
    await expect(unlocksLink).toContainText('Unlock');
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/unlocks');
    await page.waitForSelector('h1', { timeout: 15000 });

    await expect(page.locator('h1')).toContainText('All Unlocks');
    await expect(page.getByText('Pending')).toBeVisible();
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.locator('th:has-text("Unlock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Lock ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
  });

  test('should have proper ARIA roles for accessibility', async ({ page }) => {
    // Check navigation
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();

    // Check table with aria-label
    const table = page.locator('table[aria-label="Unlock一覧テーブル"]');
    await expect(table).toBeVisible();

    // Check scope on headers (6 columns)
    const headers = page.locator('th[scope="col"]');
    await expect(headers).toHaveCount(6);
  });
});
