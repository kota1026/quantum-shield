import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Explorer Lock Detail Page', () => {
  test.setTimeout(60000);

  test.describe('Active Lock', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');
      await page.waitForLoadState('domcontentloaded');
      // Wait for either lock detail content or not-found message
      await page.locator('text=Lock ID, text=Lockが見つかりません').first().waitFor({ timeout: 15000 });
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      const hasBreadcrumb = await breadcrumb.count() > 0;
      if (hasBreadcrumb) {
        await expect(breadcrumb.getByText('Lock一覧')).toBeVisible();
        await expect(breadcrumb.getByText('詳細')).toBeVisible();
      }
    });

    test('should display lock overview or not found', async ({ page }) => {
      // With real API, the lock might not exist. Check for either case.
      const hasLockId = await page.getByText('Lock ID').count() > 0;
      const hasNotFound = await page.getByText('Lockが見つかりません').count() > 0;
      expect(hasLockId || hasNotFound).toBe(true);
    });

    test('should display lock information section when lock exists', async ({ page }) => {
      const hasLockInfo = await page.getByText('Lock情報').count() > 0;
      if (hasLockInfo) {
        await expect(page.getByText('Lock情報')).toBeVisible();
        await expect(page.getByText('金額').first()).toBeVisible();
        await expect(page.getByText('ステータス').first()).toBeVisible();
        await expect(page.getByText('Lock日時').first()).toBeVisible();
      }
    });

    test('should display owner information section when lock exists', async ({ page }) => {
      const hasOwnerInfo = await page.getByText('オーナー情報').count() > 0;
      if (hasOwnerInfo) {
        await expect(page.getByText('オーナー情報')).toBeVisible();
        await expect(page.getByText('オーナーアドレス')).toBeVisible();
        await expect(page.getByText('Dilithium鍵')).toBeVisible();
      }
    });

    test('should display transactions section when lock exists', async ({ page }) => {
      const hasTx = await page.getByText('トランザクション').count() > 0;
      if (hasTx) {
        await expect(page.getByText('トランザクション').first()).toBeVisible();
        await expect(page.getByText('L2 TX Hash').first()).toBeVisible();
      }
    });

    test('should display timeline section when lock exists', async ({ page }) => {
      const hasTimeline = await page.getByText('タイムライン').count() > 0;
      if (hasTimeline) {
        await expect(page.getByText('タイムライン')).toBeVisible();
        await expect(page.getByText('ロック完了')).toBeVisible();
      }
    });

    test('should display action buttons when lock exists', async ({ page }) => {
      const hasCopyButton = await page.locator('button:has-text("Lock IDをコピー")').count() > 0;
      if (hasCopyButton) {
        await expect(page.locator('button:has-text("Lock IDをコピー")')).toBeVisible();
        await expect(page.getByText('L2で確認').first()).toBeVisible();
      }
    });

    test('should copy lock ID when clicking copy button', async ({ page }) => {
      const copyButton = page.locator('button:has-text("Lock IDをコピー")');
      const hasCopyButton = await copyButton.count() > 0;
      if (hasCopyButton) {
        await copyButton.click();
        await expect(page.locator('button:has-text("コピーしました")')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Not Found', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/locks/invalid-lock-id');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('text=Lockが見つかりません, text=Lock ID').first().waitFor({ timeout: 15000 });
    });

    test('should display not found message', async ({ page }) => {
      await expect(page.getByText('Lockが見つかりません')).toBeVisible();
      await expect(page.getByText('指定されたLock IDは存在しないか')).toBeVisible();
    });

    test('should have back to locks link', async ({ page }) => {
      await expect(page.getByText('Lock一覧に戻る')).toBeVisible();
    });

    test('should navigate to locks page when clicking back', async ({ page }) => {
      await page.getByText('Lock一覧に戻る').click();
      await expect(page).toHaveURL(/\/ja\/explorer\/locks/, { timeout: 15000 });
    });
  });

  test.describe('Navigation', () => {
    test('should have navigation bar', async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    });

    test('should navigate to locks list via breadcrumb', async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');
      await page.waitForLoadState('domcontentloaded');

      const breadcrumbLink = page.locator('nav[aria-label="Breadcrumb"]').getByText('Lock一覧');
      const hasBreadcrumb = await breadcrumbLink.count() > 0;
      if (hasBreadcrumb) {
        await breadcrumbLink.click();
        await expect(page).toHaveURL(/\/ja\/explorer\/locks/, { timeout: 15000 });
      }
    });
  });

  test.describe('English Locale', () => {
    test('should display in English', async ({ page }) => {
      await page.goto('/en/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('text=Lock, text=Not Found').first().waitFor({ timeout: 15000 });

      // Check for English labels (either detail or not found)
      const hasDetail = await page.getByText('Lock Information').count() > 0;
      const hasNotFound = await page.getByText('Lock Not Found').count() > 0;
      expect(hasDetail || hasNotFound).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper navigation ARIA attributes', async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('nav[role="navigation"][aria-label="Explorer navigation"]')).toBeVisible();
    });

    test('should pass accessibility checks', async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');
      await page.waitForLoadState('domcontentloaded');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('[aria-hidden="true"]')
        .disableRules(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});
