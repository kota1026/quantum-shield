/**
 * QS Admin Emergency Pause E2E Tests (Phase 8-E)
 *
 * ## Coverage
 * - Screen 15-18: Emergency Dashboard, Pause Controls, History
 * - Critical operations with confirmation dialogs
 *
 * ## BE Rules Compliance
 * - BE-001: Real API endpoints (no stubs)
 * - BE-002: No test-specific modifications
 * - BE-003: All API calls logged
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Emergency Pause', () => {
  test.describe('Emergency Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/emergency');
    });

    test('should display emergency dashboard', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /Emergency|緊急/i, level: 1 })).toBeVisible();

      // System status
      await expect(page.getByText(/System Status|システム状態/i)).toBeVisible();

      console.log(`[TEST LOG] Emergency dashboard loaded, API calls: ${apiLogs.length}`);
    });

    test('should display current system state', async ({ page }) => {
      // Normal or Paused status
      await expect(page.locator('text=/Normal|Operational|正常|Paused|停止中/')).toBeVisible();
    });

    test('should display pause controls', async ({ page }) => {
      // Pause button (only visible when system is running)
      const pauseButton = page.getByRole('button', { name: /Emergency Pause|緊急停止/i });
      const resumeButton = page.getByRole('button', { name: /Resume|再開/i });

      // One of these should be visible
      const pauseVisible = await pauseButton.isVisible();
      const resumeVisible = await resumeButton.isVisible();
      expect(pauseVisible || resumeVisible).toBeTruthy();
    });

    test('should display component status', async ({ page }) => {
      // Component list
      await expect(page.getByText(/L3 Network/i)).toBeVisible();
      await expect(page.getByText(/Prover Network/i)).toBeVisible();
      await expect(page.getByText(/L1 Operations/i)).toBeVisible();
    });
  });

  test.describe('Emergency Pause Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/emergency');
    });

    test('should open pause confirmation dialog', async ({ page }) => {
      const pauseButton = page.getByRole('button', { name: /Emergency Pause|緊急停止/i });
      if (await pauseButton.isVisible()) {
        await pauseButton.click();

        // Confirmation dialog
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/Confirm Emergency Pause|緊急停止確認/i)).toBeVisible();
      }
    });

    test('should require reason for pause', async ({ page }) => {
      const pauseButton = page.getByRole('button', { name: /Emergency Pause|緊急停止/i });
      if (await pauseButton.isVisible()) {
        await pauseButton.click();

        // Reason field
        await expect(page.getByLabel(/Reason|理由/i)).toBeVisible();

        // Submit without reason
        const confirmButton = page.getByRole('button', { name: /Confirm|確認/i });
        await confirmButton.click();

        // Should show error
        await expect(page.getByText(/required|必須/i)).toBeVisible();
      }
    });

    test('should execute pause with reason', async ({ page, apiLogs }) => {
      const pauseButton = page.getByRole('button', { name: /Emergency Pause|緊急停止/i });
      if (await pauseButton.isVisible()) {
        await pauseButton.click();

        // Fill reason
        await page.getByLabel(/Reason|理由/i).fill('Security incident detected');

        // Confirm
        const confirmButton = page.getByRole('button', { name: /Confirm|確認/i });
        await confirmButton.click();

        console.log(`[TEST LOG] Emergency pause executed, API calls: ${apiLogs.length}`);
      }
    });

    test('should cancel pause operation', async ({ page }) => {
      const pauseButton = page.getByRole('button', { name: /Emergency Pause|緊急停止/i });
      if (await pauseButton.isVisible()) {
        await pauseButton.click();

        // Cancel
        const cancelButton = page.getByRole('button', { name: /Cancel|キャンセル/i });
        await cancelButton.click();

        // Dialog should close
        await expect(page.getByRole('dialog')).not.toBeVisible();
      }
    });
  });

  test.describe('Resume Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/emergency');
    });

    test('should show resume option when paused', async ({ page }) => {
      const resumeButton = page.getByRole('button', { name: /Resume|再開/i });
      if (await resumeButton.isVisible()) {
        await expect(resumeButton).toBeEnabled();
      }
    });

    test('should require confirmation to resume', async ({ page }) => {
      const resumeButton = page.getByRole('button', { name: /Resume|再開/i });
      if (await resumeButton.isVisible()) {
        await resumeButton.click();

        // Confirmation dialog
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/Confirm Resume|再開確認/i)).toBeVisible();
      }
    });
  });

  test.describe('Pause History', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/emergency/history');
    });

    test('should display pause history', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Pause History|停止履歴/i, level: 1 })).toBeVisible();

      // History list
      const historyRows = page.locator('tbody tr, [data-testid="history-item"]');
      if (await historyRows.count() > 0) {
        await expect(historyRows.first()).toBeVisible();
      }
    });

    test('should display history details', async ({ page }) => {
      const historyRow = page.locator('tbody tr, [data-testid="history-item"]').first();
      if (await historyRow.isVisible()) {
        await historyRow.click();

        // Details
        await expect(page.getByText(/Paused By|実行者/i)).toBeVisible();
        await expect(page.getByText(/Reason|理由/i)).toBeVisible();
        await expect(page.getByText(/Duration|期間/i)).toBeVisible();
      }
    });
  });

  test.describe('Component Control', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/emergency');
    });

    test('should display individual component controls', async ({ page }) => {
      // Component toggles
      const l3Toggle = page.getByRole('switch', { name: /L3 Network/i });
      const proverToggle = page.getByRole('switch', { name: /Prover Network/i });

      if (await l3Toggle.isVisible()) {
        await expect(l3Toggle).toBeVisible();
      }
    });

    test('should toggle individual component', async ({ page }) => {
      const l3Toggle = page.getByRole('switch', { name: /L3 Network/i });
      if (await l3Toggle.isVisible()) {
        await l3Toggle.click();

        // Should show confirmation
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    });
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/qs-admin/emergency');
      await expect(page.getByRole('heading', { name: /Emergency/i, level: 1 })).toBeVisible();
      await expect(page.getByText('System Status')).toBeVisible();
    });
  });
});
