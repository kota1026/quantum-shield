import { test, expect } from '@playwright/test';

test.describe('Key Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/key-management');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('鍵管理');
    });

    test('should display back button', async ({ page }) => {
      const backButton = page.locator('a[aria-label="設定に戻る"]');
      await expect(backButton).toBeVisible();
    });

    test('should display warning box', async ({ page }) => {
      await expect(
        page.getByText('秘密鍵は絶対に他人と共有しないでください')
      ).toBeVisible();
      await expect(
        page.getByText(
          '秘密鍵を紛失すると資産へのアクセスができなくなります'
        )
      ).toBeVisible();
    });
  });

  test.describe('Public Key Card', () => {
    test('should display public key with active badge', async ({ page }) => {
      await expect(page.getByText('Dilithium 公開鍵')).toBeVisible();
      await expect(page.getByText('アクティブ')).toBeVisible();
    });

    test('should display truncated public key', async ({ page }) => {
      await expect(page.getByText(/0x7a3f.*\.\.\./)).toBeVisible();
    });

    test('should copy public key when copy button clicked', async ({ page }) => {
      const copyButton = page.locator(
        'button[aria-label="公開鍵をクリップボードにコピー"]'
      );
      await expect(copyButton).toBeVisible();

      // Click copy button
      await copyButton.click();

      // Should show "コピーしました" text
      await expect(page.getByText('コピーしました')).toBeVisible();

      // After 2 seconds, should revert to "コピー"
      await page.waitForTimeout(2100);
      await expect(page.getByText('コピー')).toBeVisible();
    });
  });

  test.describe('Key Management Actions', () => {
    test('should display management section label', async ({ page }) => {
      await expect(page.getByText('鍵の管理')).toBeVisible();
    });

    test('should display backup download item', async ({ page }) => {
      await expect(page.getByText('バックアップをダウンロード')).toBeVisible();
      await expect(
        page.getByText('暗号化されたバックアップファイル')
      ).toBeVisible();
    });

    test('should display show secret key item', async ({ page }) => {
      await expect(page.getByText('秘密鍵を表示')).toBeVisible();
      await expect(page.getByText('秘密鍵を確認（注意が必要）')).toBeVisible();
    });

    test('should display regenerate keys item with danger styling', async ({
      page,
    }) => {
      await expect(page.getByText('鍵を再生成')).toBeVisible();
      await expect(page.getByText('現在の鍵は無効になります')).toBeVisible();
    });
  });

  test.describe('Key History', () => {
    test('should display history section label', async ({ page }) => {
      await expect(page.getByText('鍵の履歴')).toBeVisible();
    });

    test('should display created date', async ({ page }) => {
      await expect(page.getByText('生成日時')).toBeVisible();
      await expect(page.getByText('2026-01-01 10:00:00')).toBeVisible();
    });

    test('should display last backup date', async ({ page }) => {
      await expect(page.getByText('最終バックアップ')).toBeVisible();
      await expect(page.getByText('2026-01-01 10:05:32')).toBeVisible();
    });
  });

  test.describe('Backup Modal', () => {
    test('should open backup modal when backup item clicked', async ({
      page,
    }) => {
      const backupButton = page.locator(
        'button[aria-label="暗号化されたバックアップをダウンロード"]'
      );
      await backupButton.click();

      // Modal should be visible
      await expect(
        page.locator('div[role="dialog"][aria-modal="true"]')
      ).toBeVisible();
      await expect(
        page.locator('#backup-modal-title').getByText('バックアップをダウンロード')
      ).toBeVisible();
    });

    test('should close backup modal with close button', async ({ page }) => {
      const backupButton = page.locator(
        'button[aria-label="暗号化されたバックアップをダウンロード"]'
      );
      await backupButton.click();

      // Close modal
      const closeButton = page.locator('button[aria-label="閉じる"]').first();
      await closeButton.click();

      // Modal should not be visible
      await expect(
        page.locator('div[role="dialog"][aria-modal="true"]')
      ).not.toBeVisible();
    });

    test('should close backup modal with Escape key', async ({ page }) => {
      const backupButton = page.locator(
        'button[aria-label="暗号化されたバックアップをダウンロード"]'
      );
      await backupButton.click();

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should not be visible
      await expect(
        page.locator('div[role="dialog"][aria-modal="true"]')
      ).not.toBeVisible();
    });

    test('should disable download button until checkbox checked', async ({
      page,
    }) => {
      const backupButton = page.locator(
        'button[aria-label="暗号化されたバックアップをダウンロード"]'
      );
      await backupButton.click();

      // Download button should be disabled
      const downloadButton = page.getByRole('button', { name: 'ダウンロード' });
      await expect(downloadButton).toHaveClass(/cursor-not-allowed/);

      // Check the checkbox
      const checkbox = page.locator('input[type="checkbox"]');
      await checkbox.check();

      // Download button should be enabled
      await expect(downloadButton).not.toHaveClass(/cursor-not-allowed/);
    });
  });

  test.describe('Export/Reveal Secret Key Modal', () => {
    test('should open export modal when item clicked', async ({ page }) => {
      const exportButton = page.locator(
        'button[aria-label="秘密鍵を表示する"]'
      );
      await exportButton.click();

      // Modal should be visible
      await expect(
        page.locator('div[role="dialog"][aria-modal="true"]')
      ).toBeVisible();
      await expect(
        page.locator('#export-modal-title').getByText('秘密鍵を表示')
      ).toBeVisible();
    });

    test('should display warning in export modal', async ({ page }) => {
      const exportButton = page.locator(
        'button[aria-label="秘密鍵を表示する"]'
      );
      await exportButton.click();

      await expect(page.getByText('注意')).toBeVisible();
      await expect(
        page.getByText('秘密鍵を他人に見せないでください')
      ).toBeVisible();
    });

    test('should blur secret key by default', async ({ page }) => {
      const exportButton = page.locator(
        'button[aria-label="秘密鍵を表示する"]'
      );
      await exportButton.click();

      // Secret key should be blurred
      const secretKeyDisplay = page.locator('.blur-sm');
      await expect(secretKeyDisplay).toBeVisible();
    });

    test('should reveal secret key after confirmation', async ({ page }) => {
      const exportButton = page.locator(
        'button[aria-label="秘密鍵を表示する"]'
      );
      await exportButton.click();

      // Reveal button should be disabled
      const revealButton = page.getByRole('button', { name: '表示する' });
      await expect(revealButton).toBeDisabled();

      // Check confirmation
      const checkbox = page.locator('input[type="checkbox"]');
      await checkbox.check();

      // Reveal button should be enabled
      await expect(revealButton).toBeEnabled();

      // Click reveal
      await revealButton.click();

      // Button should change to "表示中"
      await expect(page.getByRole('button', { name: '表示中' })).toBeVisible();

      // Secret key should no longer be blurred
      await expect(page.locator('.blur-sm')).not.toBeVisible();
    });
  });

  test.describe('Regenerate Keys Modal', () => {
    test('should open regenerate modal when item clicked', async ({ page }) => {
      const regenerateButton = page.locator(
        'button[aria-label="鍵を再生成する（危険な操作）"]'
      );
      await regenerateButton.click();

      // Modal should be visible
      await expect(
        page.locator('div[role="dialog"][aria-modal="true"]')
      ).toBeVisible();
      await expect(
        page.locator('#regenerate-modal-title').getByText('鍵を再生成')
      ).toBeVisible();
    });

    test('should display danger warning in regenerate modal', async ({
      page,
    }) => {
      const regenerateButton = page.locator(
        'button[aria-label="鍵を再生成する（危険な操作）"]'
      );
      await regenerateButton.click();

      await expect(page.getByText('危険な操作')).toBeVisible();
      await expect(
        page.getByText(
          '鍵を再生成すると、現在の鍵は永久に無効になります'
        )
      ).toBeVisible();
    });

    test('should require both confirmations to enable regenerate', async ({
      page,
    }) => {
      const regenerateButton = page.locator(
        'button[aria-label="鍵を再生成する（危険な操作）"]'
      );
      await regenerateButton.click();

      const regenerateSubmitButton = page.getByRole('button', {
        name: '鍵を再生成',
      });
      await expect(regenerateSubmitButton).toBeDisabled();

      // Check only first checkbox
      const checkboxes = page.locator('input[type="checkbox"]');
      await checkboxes.first().check();
      await expect(regenerateSubmitButton).toBeDisabled();

      // Check second checkbox
      await checkboxes.nth(1).check();
      await expect(regenerateSubmitButton).toBeEnabled();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to settings when back button clicked', async ({
      page,
    }) => {
      const backButton = page.locator('a[aria-label="設定に戻る"]');
      await backButton.click();

      await expect(page).toHaveURL(/\/consumer\/settings/);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should be able to tab through interactive elements', async ({
      page,
    }) => {
      // Start from back button
      await page.locator('a[aria-label="設定に戻る"]').focus();

      // Tab to copy button
      await page.keyboard.press('Tab');
      const copyButton = page.locator(
        'button[aria-label="公開鍵をクリップボードにコピー"]'
      );
      await expect(copyButton).toBeFocused();

      // Tab to backup action
      await page.keyboard.press('Tab');
      const backupButton = page.locator(
        'button[aria-label="暗号化されたバックアップをダウンロード"]'
      );
      await expect(backupButton).toBeFocused();
    });

    test('should open modal with Enter key', async ({ page }) => {
      const backupButton = page.locator(
        'button[aria-label="暗号化されたバックアップをダウンロード"]'
      );
      await backupButton.focus();
      await page.keyboard.press('Enter');

      await expect(
        page.locator('div[role="dialog"][aria-modal="true"]')
      ).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText('鍵管理');
    });

    test('should have alert role on warning boxes', async ({ page }) => {
      const alerts = page.locator('[role="alert"]');
      await expect(alerts).toHaveCount(1);
    });

    test('should have aria-live on copy button', async ({ page }) => {
      const copyButton = page.locator('[aria-live="polite"]');
      await expect(copyButton).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Header should be visible
      await expect(page.locator('h1')).toBeVisible();

      // All sections should be visible
      await expect(page.getByText('Dilithium 公開鍵')).toBeVisible();
      await expect(page.getByText('鍵の管理')).toBeVisible();
      await expect(page.getByText('鍵の履歴')).toBeVisible();
    });
  });
});

test.describe('Key Management Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/key-management');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Key Management');

    await expect(page.getByText('Dilithium Public Key')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
    await expect(page.getByText('Key Management').last()).toBeVisible();
    await expect(page.getByText('Key History')).toBeVisible();
  });

  test('should display actions in English', async ({ page }) => {
    await expect(page.getByText('Download Backup')).toBeVisible();
    await expect(page.getByText('Show Secret Key')).toBeVisible();
    await expect(page.getByText('Regenerate Keys')).toBeVisible();
  });

  test('should display warning in English', async ({ page }) => {
    await expect(
      page.getByText('Never share your secret key with anyone')
    ).toBeVisible();
  });
});
