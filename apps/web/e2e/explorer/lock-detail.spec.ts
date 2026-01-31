import { test, expect } from '@playwright/test';

test.describe('Explorer Lock Detail Page', () => {
  test.describe('Active Lock', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      await expect(page.locator('text=Lock一覧')).toBeVisible();
      await expect(page.locator('text=詳細')).toBeVisible();
    });

    test('should display lock overview card', async ({ page }) => {
      // Check Lock ID is displayed
      await expect(page.locator('text=Lock ID').first()).toBeVisible();

      // Check amount
      await expect(page.locator('text=125.5')).toBeVisible();
      await expect(page.locator('text=ETH').first()).toBeVisible();

      // Check block number
      await expect(page.locator('text=18,234,567')).toBeVisible();

      // Check lock time
      await expect(page.locator('text=2026-01-10 14:32:18 UTC')).toBeVisible();
    });

    test('should display active status badge', async ({ page }) => {
      await expect(page.locator('.bg-gold\\/10:has-text("アクティブ")').first()).toBeVisible();
    });

    test('should display lock information section', async ({ page }) => {
      await expect(page.locator('text=Lock情報')).toBeVisible();
      await expect(page.locator('text=金額')).toBeVisible();
      await expect(page.locator('text=ステータス')).toBeVisible();
      await expect(page.locator('text=Lock日時')).toBeVisible();
    });

    test('should display owner information section', async ({ page }) => {
      await expect(page.locator('text=オーナー情報')).toBeVisible();
      await expect(page.locator('text=オーナーアドレス')).toBeVisible();
      await expect(page.locator('text=Dilithium鍵')).toBeVisible();
    });

    test('should display transactions section', async ({ page }) => {
      await expect(page.locator('text=トランザクション')).toBeVisible();
      await expect(page.locator('text=L2 TX Hash')).toBeVisible();
      await expect(page.locator('text=L1 TX Hash')).toBeVisible();
    });

    test('should display timeline section', async ({ page }) => {
      await expect(page.locator('text=タイムライン')).toBeVisible();
      await expect(page.locator('text=ロック完了')).toBeVisible();
    });

    test('should have tooltips for technical terms', async ({ page }) => {
      // Check tooltip triggers exist
      const tooltipButtons = page.locator('button:has(svg.lucide-help-circle)');
      await expect(tooltipButtons.first()).toBeVisible();
    });

    test('should copy lock ID when clicking copy button', async ({ page }) => {
      const copyButton = page.locator('button:has-text("Lock IDをコピー")');
      await copyButton.click();

      // Button should show "コピーしました"
      await expect(page.locator('button:has-text("コピーしました")')).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.locator('button:has-text("Lock IDをコピー")')).toBeVisible();
      await expect(page.locator('text=L2で確認')).toBeVisible();
      await expect(page.locator('text=オーナーを見る')).toBeVisible();
    });

    test('should navigate to owner page', async ({ page }) => {
      await page.locator('a:has-text("オーナーを見る")').click();
      await expect(page).toHaveURL(/\/ja\/explorer\/address\//);
    });
  });

  test.describe('Unlocking Lock', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x4d8e9f0a1b2c3d...a923b4c5');
    });

    test('should display unlocking status badge', async ({ page }) => {
      await expect(page.locator('.bg-foreground-tertiary\\/10:has-text("Unlock中")').first()).toBeVisible();
    });

    test('should display full timeline with pending steps', async ({ page }) => {
      await expect(page.locator('text=ロック完了')).toBeVisible();
      await expect(page.locator('text=Unlock要求')).toBeVisible();
      await expect(page.locator('text=Time Lock開始')).toBeVisible();
      await expect(page.locator('text=Prover承認')).toBeVisible();
      await expect(page.locator('text=Unlock完了')).toBeVisible();
    });

    test('should display related unlock link', async ({ page }) => {
      await expect(page.locator('a:has-text("関連Unlockを見る")')).toBeVisible();
    });
  });

  test.describe('Unlocked Lock', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x8c3d4e5f6a7b8c...b156c2d3');
    });

    test('should display complete status badge', async ({ page }) => {
      await expect(page.locator('.bg-success\\/10:has-text("完了")').first()).toBeVisible();
    });

    test('should display completed timeline', async ({ page }) => {
      await expect(page.locator('text=ロック完了')).toBeVisible();
      await expect(page.locator('text=Unlock完了')).toBeVisible();
    });

    test('should show larger amount', async ({ page }) => {
      await expect(page.locator('text=320.0')).toBeVisible();
    });
  });

  test.describe('Not Found', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/locks/invalid-lock-id');
    });

    test('should display not found message', async ({ page }) => {
      await expect(page.locator('text=Lockが見つかりません')).toBeVisible();
      await expect(page.locator('text=指定されたLock IDは存在しないか')).toBeVisible();
    });

    test('should have back to locks button', async ({ page }) => {
      await expect(page.locator('button:has-text("Lock一覧に戻る")')).toBeVisible();
    });

    test('should navigate to locks page when clicking back button', async ({ page }) => {
      await page.locator('a:has(button:has-text("Lock一覧に戻る"))').click();
      await expect(page).toHaveURL(/\/ja\/explorer\/locks/);
    });
  });

  test.describe('Navigation', () => {
    test('should have correct navigation active state', async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');

      const locksLink = page.locator('nav[role="navigation"] a[aria-current="page"]');
      await expect(locksLink).toHaveText('Lock');
    });

    test('should navigate to locks list via breadcrumb', async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');

      await page.locator('a:has-text("Lock一覧")').click();
      await expect(page).toHaveURL(/\/ja\/explorer\/locks$/);
    });
  });

  test.describe('English Locale', () => {
    test('should display in English', async ({ page }) => {
      await page.goto('/en/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');

      // Check English labels
      await expect(page.locator('text=All Locks')).toBeVisible();
      await expect(page.locator('text=Details')).toBeVisible();
      await expect(page.locator('text=Lock Information')).toBeVisible();
      await expect(page.locator('text=Owner Information')).toBeVisible();
      await expect(page.locator('text=Transactions')).toBeVisible();
      await expect(page.locator('text=Timeline')).toBeVisible();
    });

    test('should display English status badge', async ({ page }) => {
      await page.goto('/en/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');

      await expect(page.locator('.bg-gold\\/10:has-text("Active")').first()).toBeVisible();
    });

    test('should display English action buttons', async ({ page }) => {
      await page.goto('/en/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');

      await expect(page.locator('button:has-text("Copy Lock ID")')).toBeVisible();
      await expect(page.locator('text=View on L2')).toBeVisible();
      await expect(page.locator('text=View Owner')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper navigation ARIA attributes', async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');

      await expect(page.locator('nav[role="navigation"][aria-label="Explorer navigation"]')).toBeVisible();
      await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/ja/explorer/locks/0x7a3f8b2c4d5e6f...e821d4f9');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to focus and activate buttons
      const copyButton = page.locator('button:has-text("Lock IDをコピー")');
      await copyButton.focus();
      await page.keyboard.press('Enter');

      await expect(page.locator('button:has-text("コピーしました")')).toBeVisible();
    });
  });
});
