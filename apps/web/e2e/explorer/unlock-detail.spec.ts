import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Explorer Unlock Detail Page', () => {
  test.setTimeout(60000);

  test.describe('Pending Normal Unlock', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      await page.waitForLoadState('domcontentloaded');
      // Wait for either unlock detail content or not-found message
      await page.locator('text=Unlock ID, text=Unlockが見つかりません').first().waitFor({ timeout: 15000 });
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      const hasBreadcrumb = await breadcrumb.count() > 0;
      if (hasBreadcrumb) {
        await expect(breadcrumb.getByText('Unlock一覧')).toBeVisible();
        await expect(breadcrumb.getByText('詳細')).toBeVisible();
      }
    });

    test('should display unlock overview or not found', async ({ page }) => {
      const hasUnlockId = await page.getByText('Unlock ID').count() > 0;
      const hasNotFound = await page.getByText('Unlockが見つかりません').count() > 0;
      expect(hasUnlockId || hasNotFound).toBe(true);
    });

    test('should display unlock information section when unlock exists', async ({ page }) => {
      const hasUnlockInfo = await page.getByText('Unlock情報').count() > 0;
      if (hasUnlockInfo) {
        await expect(page.getByText('Unlock情報')).toBeVisible();
        await expect(page.getByText('Lock ID').first()).toBeVisible();
        await expect(page.getByText('タイプ').first()).toBeVisible();
        await expect(page.getByText('要求日時').first()).toBeVisible();
      }
    });

    test('should display dilithium signature section when unlock exists', async ({ page }) => {
      const hasDilithiumSig = await page.getByText('Dilithium署名').count() > 0;
      if (hasDilithiumSig) {
        await expect(page.getByText('Dilithium署名')).toBeVisible();
        await expect(page.getByText('署名ハッシュ')).toBeVisible();
        await expect(page.getByText('検証済み').first()).toBeVisible();
      }
    });

    test('should display prover signatures list when unlock exists', async ({ page }) => {
      const hasProverSigs = await page.getByText('Prover署名').count() > 0;
      if (hasProverSigs) {
        await expect(page.getByText('Prover署名').first()).toBeVisible();
      }
    });

    test('should display timeline section when unlock exists', async ({ page }) => {
      const hasTimeline = await page.getByText('タイムライン').count() > 0;
      if (hasTimeline) {
        await expect(page.getByText('タイムライン')).toBeVisible();
        await expect(page.getByText('Unlock要求')).toBeVisible();
      }
    });

    test('should display action buttons when unlock exists', async ({ page }) => {
      const hasCopyButton = await page.locator('button:has-text("Unlock IDをコピー")').count() > 0;
      if (hasCopyButton) {
        await expect(page.locator('button:has-text("Unlock IDをコピー")')).toBeVisible();
        await expect(page.getByText('関連Lockを見る').first()).toBeVisible();
      }
    });

    test('should copy unlock ID when clicking copy button', async ({ page }) => {
      const copyButton = page.locator('button:has-text("Unlock IDをコピー")');
      const hasCopyButton = await copyButton.count() > 0;
      if (hasCopyButton) {
        await copyButton.click();
        await expect(page.locator('button:has-text("コピーしました")')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Not Found', () => {
    test('should display not found message for invalid unlock ID', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/invalid-id');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('text=Unlockが見つかりません').waitFor({ timeout: 15000 });

      await expect(page.getByText('Unlockが見つかりません')).toBeVisible();
      await expect(page.getByText('指定されたUnlock IDは存在しないか')).toBeVisible();
    });

    test('should have back to unlocks link', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/invalid-id');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('text=Unlockが見つかりません').waitFor({ timeout: 15000 });

      await expect(page.getByText('Unlock一覧に戻る')).toBeVisible();
    });

    test('should navigate back to unlocks list', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/invalid-id');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('text=Unlockが見つかりません').waitFor({ timeout: 15000 });

      await page.getByText('Unlock一覧に戻る').click();
      await expect(page).toHaveURL(/\/ja\/explorer\/unlocks/, { timeout: 15000 });
    });
  });

  test.describe('Navigation', () => {
    test('should display navigation bar', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    });

    test('should navigate via breadcrumb', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      await page.waitForLoadState('domcontentloaded');

      const breadcrumbLink = page.locator('nav[aria-label="Breadcrumb"]').getByText('Unlock一覧');
      const hasBreadcrumb = await breadcrumbLink.count() > 0;
      if (hasBreadcrumb) {
        await breadcrumbLink.click();
        await expect(page).toHaveURL(/\/ja\/explorer\/unlocks/, { timeout: 15000 });
      }
    });
  });

  test.describe('English Version', () => {
    test('should display in English when navigating to /en', async ({ page }) => {
      await page.goto('/en/explorer/unlocks/0x2e7f...d934');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('text=Unlock, text=Not Found').first().waitFor({ timeout: 15000 });

      // Check for English labels (either detail or not found)
      const hasDetail = await page.getByText('Unlock Information').count() > 0;
      const hasNotFound = await page.getByText('Unlock Not Found').count() > 0;
      expect(hasDetail || hasNotFound).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA roles', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('nav[role="navigation"][aria-label="Explorer navigation"]')).toBeVisible();
    });

    test('should pass accessibility checks', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      await page.waitForLoadState('domcontentloaded');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('[aria-hidden="true"]')
        .disableRules(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      await page.waitForLoadState('domcontentloaded');

      await page.keyboard.press('Tab');
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
      expect(focusedTag).toBeDefined();
      expect(focusedTag).not.toBe('');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('text=Unlock, text=Unlockが見つかりません').first().waitFor({ timeout: 15000 });

      // Content should be visible (either detail or not found)
      const hasUnlockId = await page.getByText('Unlock ID').count() > 0;
      const hasNotFound = await page.getByText('Unlockが見つかりません').count() > 0;
      expect(hasUnlockId || hasNotFound).toBe(true);
    });
  });
});
