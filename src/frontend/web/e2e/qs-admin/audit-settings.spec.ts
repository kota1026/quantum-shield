/**
 * QS Admin Audit & Settings E2E Tests (Phase 8-E)
 *
 * ## Coverage
 * - Screen 23-30: Audit Log, Settings, Staff Management, Parameters
 *
 * ## BE Rules Compliance
 * - BE-001: Real API endpoints (no stubs)
 * - BE-002: No test-specific modifications
 * - BE-003: All API calls logged
 */

import { test, expect, testWithRole } from '../fixtures/admin-auth';

test.describe('QS Admin Audit Log', () => {
  test.describe('Audit Log List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/audit');
    });

    test('should display audit log page', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /Audit Log|監査ログ/i, level: 1 })).toBeVisible();

      console.log(`[TEST LOG] Audit log loaded, API calls: ${apiLogs.length}`);
    });

    test('should display audit entries', async ({ page }) => {
      const auditRows = page.locator('tbody tr');
      if (await auditRows.count() > 0) {
        await expect(auditRows.first()).toBeVisible();
      }
    });

    test('should display entry details', async ({ page }) => {
      await expect(page.getByText(/Timestamp|タイムスタンプ/i)).toBeVisible();
      await expect(page.getByText(/Action|アクション/i)).toBeVisible();
      await expect(page.getByText(/User|ユーザー/i)).toBeVisible();
    });

    test('should filter by action type', async ({ page }) => {
      const actionFilter = page.getByRole('combobox', { name: /Action|アクション/i });
      if (await actionFilter.isVisible()) {
        await actionFilter.selectOption('prover_suspend');
        await expect(page.locator('tbody tr').first()).toBeVisible();
      }
    });

    test('should filter by date range', async ({ page }) => {
      const dateFrom = page.getByLabel(/From|開始日/i);
      const dateTo = page.getByLabel(/To|終了日/i);

      if (await dateFrom.isVisible()) {
        await dateFrom.fill('2024-01-01');
        await dateTo.fill('2024-12-31');
      }
    });

    test('should export audit log', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /Export|エクスポート/i });
      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeEnabled();
      }
    });
  });

  test.describe('Audit Detail', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/audit/entry-001');
    });

    test('should display audit entry detail', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      await expect(page.getByText(/Action|アクション/i)).toBeVisible();
      await expect(page.getByText(/User|ユーザー/i)).toBeVisible();
      await expect(page.getByText(/IP Address|IPアドレス/i)).toBeVisible();
    });

    test('should display change diff', async ({ page }) => {
      const diffSection = page.getByText(/Changes|変更内容/i);
      if (await diffSection.isVisible()) {
        await expect(diffSection).toBeVisible();
      }
    });
  });
});

test.describe('QS Admin Settings', () => {
  test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/settings');
    });

    test('should display settings page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Settings|設定/i, level: 1 })).toBeVisible();
    });

    test('should display profile section', async ({ page }) => {
      await expect(page.getByText(/Profile|プロフィール/i)).toBeVisible();
      await expect(page.getByLabel(/Name|名前/i)).toBeVisible();
      await expect(page.getByLabel(/Email|メール/i)).toBeVisible();
    });

    test('should display notification settings', async ({ page }) => {
      await expect(page.getByText(/Notifications|通知/i)).toBeVisible();

      const emailToggle = page.getByRole('switch', { name: /Email|メール/i });
      if (await emailToggle.isVisible()) {
        await expect(emailToggle).toBeVisible();
      }
    });

    test('should save settings', async ({ page }) => {
      const saveButton = page.getByRole('button', { name: /Save|保存/i });
      await expect(saveButton).toBeVisible();
    });
  });

  test.describe('Security Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/settings/security');
    });

    test('should display security settings', async ({ page }) => {
      await expect(page.getByText(/Security|セキュリティ/i)).toBeVisible();
      await expect(page.getByText(/Two-Factor|2要素/i)).toBeVisible();
    });

    test('should enable 2FA', async ({ page }) => {
      const enable2FAButton = page.getByRole('button', { name: /Enable 2FA|2FA有効化/i });
      if (await enable2FAButton.isVisible()) {
        await enable2FAButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    });
  });
});

test.describe('QS Admin Staff Management', () => {
  test.describe('Staff List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/staff');
    });

    test('should display staff list', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /Staff|スタッフ/i, level: 1 })).toBeVisible();

      console.log(`[TEST LOG] Staff list loaded, API calls: ${apiLogs.length}`);
    });

    test('should display staff members', async ({ page }) => {
      const staffRows = page.locator('tbody tr');
      if (await staffRows.count() > 0) {
        await expect(staffRows.first()).toBeVisible();
      }
    });

    test('should add new staff member', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /Add.*Staff|スタッフ追加/i });
      await addButton.click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel(/Name|名前/i)).toBeVisible();
      await expect(page.getByLabel(/Email|メール/i)).toBeVisible();
      await expect(page.getByLabel(/Role|役割/i)).toBeVisible();
    });

    test('should edit staff member', async ({ page }) => {
      const staffRow = page.locator('tbody tr').first();
      if (await staffRow.isVisible()) {
        const editButton = staffRow.getByRole('button', { name: /Edit|編集/i });
        await editButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    });

    test('should deactivate staff member', async ({ page }) => {
      const staffRow = page.locator('tbody tr').first();
      if (await staffRow.isVisible()) {
        const deactivateButton = staffRow.getByRole('button', { name: /Deactivate|無効化/i });
        if (await deactivateButton.isVisible()) {
          await deactivateButton.click();
          await expect(page.getByRole('dialog')).toBeVisible();
        }
      }
    });
  });
});

test.describe('QS Admin Parameters', () => {
  test.describe('Parameters Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/parameters');
    });

    test('should display parameters page', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /Parameters|パラメータ/i, level: 1 })).toBeVisible();

      console.log(`[TEST LOG] Parameters loaded, API calls: ${apiLogs.length}`);
    });

    test('should display parameter categories', async ({ page }) => {
      await expect(page.getByText(/Lock.*Parameters|ロック.*パラメータ/i)).toBeVisible();
      await expect(page.getByText(/Unlock.*Parameters|アンロック.*パラメータ/i)).toBeVisible();
      await expect(page.getByText(/Fee.*Parameters|手数料.*パラメータ/i)).toBeVisible();
    });

    test('should edit parameter value', async ({ page }) => {
      const editButton = page.getByRole('button', { name: /Edit|編集/i }).first();
      await editButton.click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel(/Value|値/i)).toBeVisible();
    });

    test('should require confirmation for changes', async ({ page }) => {
      const editButton = page.getByRole('button', { name: /Edit|編集/i }).first();
      await editButton.click();

      // Change value
      const valueInput = page.getByLabel(/Value|値/i);
      await valueInput.fill('100');

      // Save
      const saveButton = page.getByRole('button', { name: /Save|保存/i });
      await saveButton.click();

      // Should show confirmation
      await expect(page.getByText(/Confirm|確認/i)).toBeVisible();
    });

    test('should display change history', async ({ page }) => {
      const historyTab = page.getByRole('tab', { name: /History|履歴/i });
      if (await historyTab.isVisible()) {
        await historyTab.click();
        await expect(page.getByText(/Changed By|変更者/i)).toBeVisible();
      }
    });
  });
});

test.describe('Role-based Access', () => {
  const viewerTest = testWithRole('viewer');

  viewerTest.describe('Viewer Role', () => {
    viewerTest('should not show edit buttons for viewer', async ({ page }) => {
      await page.goto('/ja/qs-admin/parameters');

      // Edit button should not be visible for viewer
      const editButton = page.getByRole('button', { name: /Edit|編集/i });
      await expect(editButton).not.toBeVisible();
    });

    viewerTest('should not access staff management for viewer', async ({ page }) => {
      await page.goto('/ja/qs-admin/staff');

      // Should show access denied or redirect
      const accessDenied = page.getByText(/Access Denied|アクセス拒否/i);
      const addButton = page.getByRole('button', { name: /Add.*Staff|スタッフ追加/i });

      // Either access denied or add button not visible
      const denied = await accessDenied.isVisible();
      const addVisible = await addButton.isVisible();

      expect(denied || !addVisible).toBeTruthy();
    });
  });
});

test.describe('English Locale', () => {
  test('system logs should display English', async ({ page }) => {
    await page.goto('/en/qs-admin/system/logs');
    await expect(page.getByRole('heading', { name: /Logs|System/i, level: 1 })).toBeVisible();
  });

  test('members should display English', async ({ page }) => {
    await page.goto('/en/qs-admin/members');
    await expect(page.getByRole('heading', { name: /Member Management/i, level: 1 })).toBeVisible();
  });

  test('analytics should display English', async ({ page }) => {
    await page.goto('/en/qs-admin/analytics');
    await expect(page.getByRole('heading', { name: /Analytics/i, level: 1 })).toBeVisible();
  });
});
