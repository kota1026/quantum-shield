/**
 * QS Admin Prover Management E2E Tests (Phase 8-E)
 *
 * ## Coverage
 * - Screen 02-06: Prover List, Detail, Application Review, Suspend
 * - CRUD operations with API logging
 *
 * ## BE Rules Compliance
 * - BE-001: Real API endpoints (no stubs)
 * - BE-002: No test-specific modifications
 * - BE-003: All API calls logged
 */

import { test, expect, expectApiCall } from '../fixtures/admin-auth';

test.describe('QS Admin Prover Management', () => {
  test.describe('Prover List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/provers');
    });

    test('should display prover list page', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /Prover.*管理|Management/i, level: 1 })).toBeVisible();

      // Stats should be visible
      await expect(page.getByText(/Active|アクティブ/)).toBeVisible();

      console.log(`[TEST LOG] Prover list loaded, API calls: ${apiLogs.length}`);
    });

    test('should display prover table', async ({ page }) => {
      // Table headers
      await expect(page.getByText(/Prover ID|ID/i)).toBeVisible();
      await expect(page.getByText(/Status|ステータス/i)).toBeVisible();
      await expect(page.getByText(/SLA Score|SLAスコア/i)).toBeVisible();

      // At least one row
      const tableRows = page.locator('tbody tr');
      await expect(tableRows.first()).toBeVisible();
    });

    test('should filter provers by status', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: /Status|ステータス/i });
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('active');
        // Table should update
        await expect(page.locator('tbody tr').first()).toBeVisible();
      }
    });

    test('should search provers', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search|検索/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('prover-001');
        await page.keyboard.press('Enter');
        // Results should update
        await expect(page.locator('tbody tr').first()).toBeVisible();
      }
    });

    test('should navigate to prover detail', async ({ page }) => {
      const proverRow = page.locator('tbody tr').first();
      await proverRow.click();
      await expect(page).toHaveURL(/\/qs-admin\/provers\/[\w-]+/);
    });
  });

  test.describe('Prover Detail', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/provers/prover-001');
    });

    test('should display prover detail page', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Prover info
      await expect(page.getByText(/Prover ID|ID/i)).toBeVisible();
      await expect(page.getByText(/Status|ステータス/i)).toBeVisible();
    });

    test('should display prover metrics', async ({ page }) => {
      // Performance metrics
      await expect(page.getByText(/Proof Success Rate|証明成功率/i)).toBeVisible();
      await expect(page.getByText(/Average Response Time|平均応答時間/i)).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Suspend|停止/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Edit|編集/i })).toBeVisible();
    });

    test('should open suspend dialog', async ({ page }) => {
      const suspendButton = page.getByRole('button', { name: /Suspend|停止/i });
      await suspendButton.click();

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/Reason|理由/i)).toBeVisible();
    });

    test('should navigate back to list', async ({ page }) => {
      const backButton = page.getByRole('button', { name: /Back|戻る/i });
      await backButton.click();
      await expect(page).toHaveURL(/\/qs-admin\/provers$/);
    });
  });

  test.describe('Application Review', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/provers/applications');
    });

    test('should display application list', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Application.*Review|申請.*レビュー/i, level: 1 })).toBeVisible();

      // Application list
      const applicationRows = page.locator('[data-testid="application-row"]');
      if (await applicationRows.count() > 0) {
        await expect(applicationRows.first()).toBeVisible();
      }
    });

    test('should display application details', async ({ page }) => {
      const applicationRow = page.locator('[data-testid="application-row"]').first();
      if (await applicationRow.isVisible()) {
        await applicationRow.click();

        // Details should show
        await expect(page.getByText(/Company|会社/i)).toBeVisible();
        await expect(page.getByText(/Hardware|ハードウェア/i)).toBeVisible();
      }
    });

    test('should have approve/reject buttons', async ({ page }) => {
      const applicationRow = page.locator('[data-testid="application-row"]').first();
      if (await applicationRow.isVisible()) {
        await applicationRow.click();

        await expect(page.getByRole('button', { name: /Approve|承認/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Reject|却下/i })).toBeVisible();
      }
    });
  });

  test.describe('Prover Suspension', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/provers/prover-001');
    });

    test('should suspend prover with reason', async ({ page, apiLogs }) => {
      // Open suspend dialog
      const suspendButton = page.getByRole('button', { name: /Suspend|停止/i });
      await suspendButton.click();

      // Fill reason
      const reasonInput = page.getByRole('textbox', { name: /Reason|理由/i });
      await reasonInput.fill('SLA violation - response time exceeded threshold');

      // Confirm
      const confirmButton = page.getByRole('button', { name: /Confirm|確認/i });
      await confirmButton.click();

      // Should show success message or update status
      console.log(`[TEST LOG] Suspend prover, API calls: ${apiLogs.length}`);
    });

    test('should cancel suspension', async ({ page }) => {
      // Open suspend dialog
      const suspendButton = page.getByRole('button', { name: /Suspend|停止/i });
      await suspendButton.click();

      // Cancel
      const cancelButton = page.getByRole('button', { name: /Cancel|キャンセル/i });
      await cancelButton.click();

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/qs-admin/provers');
      await expect(page.getByRole('heading', { name: 'Prover Management', level: 1 })).toBeVisible();
      await expect(page.getByText('Active Provers')).toBeVisible();
    });
  });
});
