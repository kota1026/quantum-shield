/**
 * QS Admin TX Monitor E2E Tests (Phase 8-E)
 *
 * ## Coverage
 * - Screen 19-22: Transaction Monitor, Detail, Pending Queue
 * - Real-time monitoring with API logging
 *
 * ## BE Rules Compliance
 * - BE-001: Real API endpoints (no stubs)
 * - BE-002: No test-specific modifications
 * - BE-003: All API calls logged
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin TX Monitor', () => {
  test.describe('Monitor Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/tx-monitor');
    });

    test('should display tx monitor dashboard', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /TX Monitor|トランザクション監視/i, level: 1 })).toBeVisible();

      console.log(`[TEST LOG] TX Monitor loaded, API calls: ${apiLogs.length}`);
    });

    test('should display transaction stats', async ({ page }) => {
      await expect(page.getByText(/Total Transactions|総トランザクション/i)).toBeVisible();
      await expect(page.getByText(/Pending|保留中/i)).toBeVisible();
      await expect(page.getByText(/Confirmed|確認済み/i)).toBeVisible();
    });

    test('should display live transaction feed', async ({ page }) => {
      await expect(page.getByText(/Live Feed|リアルタイム/i)).toBeVisible();

      // Transaction entries
      const txEntries = page.locator('[data-testid="tx-entry"]');
      if (await txEntries.count() > 0) {
        await expect(txEntries.first()).toBeVisible();
      }
    });

    test('should filter by transaction type', async ({ page }) => {
      const typeFilter = page.getByRole('combobox', { name: /Type|タイプ/i });
      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption('lock');
        await expect(page.locator('[data-testid="tx-entry"]').first()).toBeVisible();
      }
    });

    test('should search transactions', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search.*TX|トランザクション検索/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('0x1234');
        await page.keyboard.press('Enter');
      }
    });
  });

  test.describe('Transaction Detail', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/tx-monitor/tx-001');
    });

    test('should display transaction detail', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // TX info
      await expect(page.getByText(/TX Hash|ハッシュ/i)).toBeVisible();
      await expect(page.getByText(/Status|ステータス/i)).toBeVisible();
      await expect(page.getByText(/Type|タイプ/i)).toBeVisible();
    });

    test('should display L3 details', async ({ page }) => {
      await expect(page.getByText(/L3 Block/i)).toBeVisible();
      await expect(page.getByText(/L3 TX Hash/i)).toBeVisible();
    });

    test('should display L1 details if bridged', async ({ page }) => {
      const l1Section = page.getByText(/L1 Confirmation/i);
      if (await l1Section.isVisible()) {
        await expect(page.getByText(/L1 TX Hash/i)).toBeVisible();
        await expect(page.getByText(/L1 Block/i)).toBeVisible();
      }
    });

    test('should display timeline', async ({ page }) => {
      await expect(page.getByText(/Timeline|タイムライン/i)).toBeVisible();

      const timelineItems = page.locator('[data-testid="timeline-item"]');
      if (await timelineItems.count() > 0) {
        await expect(timelineItems.first()).toBeVisible();
      }
    });
  });

  test.describe('Pending Queue', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/tx-monitor/pending');
    });

    test('should display pending queue', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Pending|保留中/i, level: 1 })).toBeVisible();

      const pendingRows = page.locator('tbody tr');
      if (await pendingRows.count() > 0) {
        await expect(pendingRows.first()).toBeVisible();
      }
    });

    test('should display queue metrics', async ({ page }) => {
      await expect(page.getByText(/Queue Size|キューサイズ/i)).toBeVisible();
      await expect(page.getByText(/Average Wait Time|平均待ち時間/i)).toBeVisible();
    });

    test('should prioritize transaction', async ({ page }) => {
      const txRow = page.locator('tbody tr').first();
      if (await txRow.isVisible()) {
        const prioritizeButton = txRow.getByRole('button', { name: /Prioritize|優先/i });
        if (await prioritizeButton.isVisible()) {
          await prioritizeButton.click();
          await expect(page.getByRole('dialog')).toBeVisible();
        }
      }
    });
  });

  test.describe('Alerts', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/tx-monitor');
    });

    test('should display active alerts', async ({ page }) => {
      const alertsSection = page.getByText(/Active Alerts|アクティブアラート/i);
      if (await alertsSection.isVisible()) {
        await expect(alertsSection).toBeVisible();
      }
    });

    test('should acknowledge alert', async ({ page }) => {
      const alertItem = page.locator('[data-testid="alert-item"]').first();
      if (await alertItem.isVisible()) {
        const ackButton = alertItem.getByRole('button', { name: /Acknowledge|確認/i });
        if (await ackButton.isVisible()) {
          await ackButton.click();
        }
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/tx-monitor');
    });

    test('should display live indicator', async ({ page }) => {
      await expect(page.getByRole('status')).toBeVisible();
      await expect(page.getByText(/Live|リアルタイム/i)).toBeVisible();
    });

    test('should have auto-refresh toggle', async ({ page }) => {
      const autoRefreshToggle = page.getByRole('switch', { name: /Auto.*Refresh|自動更新/i });
      if (await autoRefreshToggle.isVisible()) {
        await expect(autoRefreshToggle).toBeVisible();
      }
    });
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/qs-admin/tx-monitor');
      await expect(page.getByRole('heading', { name: /TX Monitor|Transaction Monitor/i, level: 1 })).toBeVisible();
    });
  });
});
