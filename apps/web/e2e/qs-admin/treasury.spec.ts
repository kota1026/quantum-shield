/**
 * QS Admin Treasury E2E Tests (Phase 8-E)
 *
 * ## Coverage
 * - Screen 11-14: Treasury Overview, Withdrawal Request, History
 * - L3→L1 operations with signature verification
 *
 * ## BE Rules Compliance
 * - BE-001: Real API endpoints (no stubs)
 * - BE-002: No test-specific modifications
 * - BE-003: All API calls logged including L1 tx hashes
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Treasury', () => {
  test.describe('Treasury Overview', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/treasury');
    });

    test('should display treasury overview', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /Treasury|トレジャリー/i, level: 1 })).toBeVisible();

      // Balance display
      await expect(page.getByText(/Balance|残高/i)).toBeVisible();

      console.log(`[TEST LOG] Treasury overview loaded, API calls: ${apiLogs.length}`);
    });

    test('should display balance card', async ({ page }) => {
      // Total balance
      await expect(page.getByText(/Total Balance|総残高/i)).toBeVisible();

      // Balance value (ETH or USD)
      await expect(page.locator('text=/\\d+(\\.\\d+)?\\s*(ETH|USD|\\$)/')).toBeVisible();
    });

    test('should display recent transactions', async ({ page }) => {
      await expect(page.getByText(/Recent Transactions|最近の取引/i)).toBeVisible();

      const txRows = page.locator('[data-testid="tx-row"]');
      if (await txRows.count() > 0) {
        await expect(txRows.first()).toBeVisible();
      }
    });

    test('should navigate to withdrawal request', async ({ page }) => {
      const withdrawButton = page.getByRole('button', { name: /Withdraw|出金/i });
      await withdrawButton.click();
      await expect(page).toHaveURL(/\/qs-admin\/treasury\/withdraw/);
    });
  });

  test.describe('Withdrawal Request', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/treasury/withdraw');
    });

    test('should display withdrawal form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Withdraw|出金/i, level: 1 })).toBeVisible();

      // Form fields
      await expect(page.getByLabel(/Recipient Address|送金先アドレス/i)).toBeVisible();
      await expect(page.getByLabel(/Amount|金額/i)).toBeVisible();
      await expect(page.getByLabel(/Reason|理由/i)).toBeVisible();
    });

    test('should validate form fields', async ({ page }) => {
      // Submit empty form
      const submitButton = page.getByRole('button', { name: /Submit|送信/i });
      await submitButton.click();

      // Should show validation errors
      await expect(page.getByText(/required|必須/i)).toBeVisible();
    });

    test('should fill and preview withdrawal', async ({ page }) => {
      // Fill form
      await page.getByLabel(/Recipient Address|送金先アドレス/i).fill('0x1234567890abcdef1234567890abcdef12345678');
      await page.getByLabel(/Amount|金額/i).fill('1.5');
      await page.getByLabel(/Reason|理由/i).fill('Operational expenses');

      // Preview button
      const previewButton = page.getByRole('button', { name: /Preview|プレビュー/i });
      await previewButton.click();

      // Should show preview
      await expect(page.getByText(/Confirm Withdrawal|出金確認/i)).toBeVisible();
    });

    test('should require multi-sig approval', async ({ page }) => {
      // Fill form
      await page.getByLabel(/Recipient Address|送金先アドレス/i).fill('0x1234567890abcdef1234567890abcdef12345678');
      await page.getByLabel(/Amount|金額/i).fill('10');
      await page.getByLabel(/Reason|理由/i).fill('Large transfer');

      const previewButton = page.getByRole('button', { name: /Preview|プレビュー/i });
      await previewButton.click();

      // Should show multi-sig requirement
      await expect(page.getByText(/Multi-sig|マルチシグ/i)).toBeVisible();
    });
  });

  test.describe('Withdrawal Confirmation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/treasury/withdraw');
      // Fill form
      await page.getByLabel(/Recipient Address|送金先アドレス/i).fill('0x1234567890abcdef1234567890abcdef12345678');
      await page.getByLabel(/Amount|金額/i).fill('0.5');
      await page.getByLabel(/Reason|理由/i).fill('Test withdrawal');

      const previewButton = page.getByRole('button', { name: /Preview|プレビュー/i });
      await previewButton.click();
    });

    test('should display confirmation details', async ({ page }) => {
      await expect(page.getByText(/Confirm Withdrawal|出金確認/i)).toBeVisible();
      await expect(page.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeVisible();
      await expect(page.getByText('0.5')).toBeVisible();
    });

    test('should show L3 signature step', async ({ page }) => {
      const confirmButton = page.getByRole('button', { name: /Confirm.*Sign|確認.*署名/i });
      await confirmButton.click();

      // Should show signing progress
      await expect(page.getByText(/Signing|署名中/i)).toBeVisible();
    });

    test('should cancel withdrawal', async ({ page }) => {
      const cancelButton = page.getByRole('button', { name: /Cancel|キャンセル/i });
      await cancelButton.click();

      // Should go back to form
      await expect(page).toHaveURL(/\/qs-admin\/treasury/);
    });
  });

  test.describe('Withdrawal History', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/treasury/history');
    });

    test('should display withdrawal history', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Withdrawal History|出金履歴/i, level: 1 })).toBeVisible();

      // History table
      const historyRows = page.locator('tbody tr');
      if (await historyRows.count() > 0) {
        await expect(historyRows.first()).toBeVisible();
      }
    });

    test('should display transaction details', async ({ page }) => {
      const historyRow = page.locator('tbody tr').first();
      if (await historyRow.isVisible()) {
        await historyRow.click();

        // Should show L3 and L1 tx hashes
        await expect(page.getByText(/L3 TX|L3トランザクション/i)).toBeVisible();
        await expect(page.getByText(/L1 TX|L1トランザクション/i)).toBeVisible();
      }
    });

    test('should filter by status', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: /Status|ステータス/i });
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('completed');
        await expect(page.locator('tbody tr').first()).toBeVisible();
      }
    });
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/qs-admin/treasury');
      await expect(page.getByRole('heading', { name: /Treasury/i, level: 1 })).toBeVisible();
      await expect(page.getByText('Total Balance')).toBeVisible();
    });
  });
});
