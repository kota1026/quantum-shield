import { test, expect } from '@playwright/test';

test.describe('Explorer Unlock Detail Page', () => {
  test.describe('Pending Normal Unlock', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb.locator('text=Unlock一覧')).toBeVisible();
      await expect(breadcrumb.locator('text=詳細')).toBeVisible();
    });

    test('should display unlock ID in overview card', async ({ page }) => {
      await expect(page.locator('text=Unlock ID')).toBeVisible();
      await expect(page.locator('text=0x2e7f8d9a1b2c3d4e')).toBeVisible();
    });

    test('should display status and type badges', async ({ page }) => {
      await expect(page.locator('.bg-foreground-tertiary\\/10:has-text("保留中")')).toBeVisible();
      await expect(page.locator('.bg-background-secondary:has-text("通常")')).toBeVisible();
    });

    test('should display time lock progress bar', async ({ page }) => {
      await expect(page.locator('text=Time Lock進捗')).toBeVisible();
      // Check progress bar exists
      const progressBar = page.locator('.h-2.bg-background-tertiary.rounded-full');
      await expect(progressBar).toBeVisible();
    });

    test('should display amount and prover signatures in overview', async ({ page }) => {
      await expect(page.locator('text=125.5')).toBeVisible();
      await expect(page.locator('text=ETH').first()).toBeVisible();
      await expect(page.locator('text=3/5')).toBeVisible();
    });

    test('should display unlock information section', async ({ page }) => {
      await expect(page.locator('text=Unlock情報')).toBeVisible();
      await expect(page.locator('text=Lock ID')).toBeVisible();
      await expect(page.locator('text=0x7a3f...e821')).toBeVisible();
      await expect(page.locator('text=タイプ')).toBeVisible();
      await expect(page.locator('text=要求日時')).toBeVisible();
      await expect(page.locator('text=Time Lock終了')).toBeVisible();
    });

    test('should display dilithium signature section', async ({ page }) => {
      await expect(page.locator('text=Dilithium署名')).toBeVisible();
      await expect(page.locator('text=署名ハッシュ')).toBeVisible();
      await expect(page.locator('text=検証済み')).toBeVisible();
      await expect(page.locator('text=L2 TX Hash')).toBeVisible();
    });

    test('should display prover signatures list', async ({ page }) => {
      await expect(page.locator('h2:has-text("Prover署名 (3/5)")')).toBeVisible();
      await expect(page.locator('text=Prover Alpha')).toBeVisible();
      await expect(page.locator('text=Prover Beta')).toBeVisible();
      await expect(page.locator('text=Prover Gamma')).toBeVisible();
      await expect(page.locator('text=署名済み').first()).toBeVisible();
    });

    test('should display timeline section', async ({ page }) => {
      await expect(page.locator('h2:has-text("タイムライン")')).toBeVisible();
      await expect(page.locator('text=Unlock要求')).toBeVisible();
      await expect(page.locator('text=Time Lock開始')).toBeVisible();
      await expect(page.locator('text=Prover承認')).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.locator('button:has-text("Unlock IDをコピー")')).toBeVisible();
      await expect(page.locator('text=関連Lockを見る')).toBeVisible();
      await expect(page.locator('text=L2で確認')).toBeVisible();
    });

    test('should copy unlock ID when clicking copy button', async ({ page }) => {
      const copyButton = page.locator('button:has-text("Unlock IDをコピー")');
      await copyButton.click();
      await expect(page.locator('button:has-text("コピーしました")')).toBeVisible();
    });

    test('should navigate to lock detail when clicking view lock', async ({ page }) => {
      await page.locator('a:has-text("関連Lockを見る")').click();
      await expect(page).toHaveURL(/\/ja\/explorer\/locks\//);
    });

    test('should have tooltips for technical terms', async ({ page }) => {
      // Type tooltip
      const typeTooltip = page.locator('button:near(:text("タイプ"))').first();
      await typeTooltip.hover();
      await expect(page.locator('text=通常のアンロック（24時間待機）か緊急アンロック')).toBeVisible();

      // Time Lock End tooltip
      const timeLockTooltip = page.locator('button:near(:text("Time Lock終了"))').first();
      await timeLockTooltip.hover();
      await expect(page.locator('text=この時刻を過ぎると資産の引き出しが可能')).toBeVisible();
    });
  });

  test.describe('Emergency Unlock', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x5c9a...e127');
    });

    test('should display emergency type badge', async ({ page }) => {
      await expect(page.locator('.bg-warning\\/10:has-text("緊急")')).toBeVisible();
    });

    test('should show all 5 provers signed', async ({ page }) => {
      await expect(page.locator('text=5/5')).toBeVisible();
    });
  });

  test.describe('Completed Unlock', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x3b1d...f842');
    });

    test('should display complete status', async ({ page }) => {
      await expect(page.locator('.bg-success\\/10:has-text("完了")')).toBeVisible();
    });

    test('should not show time lock progress bar', async ({ page }) => {
      await expect(page.locator('text=Time Lock進捗')).not.toBeVisible();
    });

    test('should show executed in timeline', async ({ page }) => {
      await expect(page.locator('text=Unlock実行')).toBeVisible();
    });
  });

  test.describe('Challenged Unlock', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x7d4e...a563');
    });

    test('should display challenged status', async ({ page }) => {
      await expect(page.locator('.bg-warning\\/10:has-text("Challenge中")')).toBeVisible();
    });

    test('should display challenge information section', async ({ page }) => {
      await expect(page.locator('text=Challenge情報')).toBeVisible();
      await expect(page.locator('text=Challenge ID')).toBeVisible();
      await expect(page.locator('text=Challenger')).toBeVisible();
      await expect(page.locator('text=Bond')).toBeVisible();
      await expect(page.locator('text=防御期限')).toBeVisible();
    });

    test('should display challenge in timeline', async ({ page }) => {
      await expect(page.locator('text=Challenge発生')).toBeVisible();
    });

    test('should show view challenge button', async ({ page }) => {
      await expect(page.locator('a:has-text("Challengeを見る")')).toBeVisible();
    });

    test('should navigate to challenge when clicking view challenge', async ({ page }) => {
      await page.locator('a:has-text("Challengeを見る")').click();
      await expect(page).toHaveURL(/\/ja\/explorer\/challenges\//);
    });
  });

  test.describe('Not Found', () => {
    test('should display not found message for invalid unlock ID', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/invalid-id');
      await expect(page.locator('text=Unlockが見つかりません')).toBeVisible();
      await expect(page.locator('text=指定されたUnlock IDは存在しないか')).toBeVisible();
    });

    test('should have back to unlocks button', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/invalid-id');
      const backButton = page.locator('button:has-text("Unlock一覧に戻る")');
      await expect(backButton).toBeVisible();
    });

    test('should navigate back to unlocks list', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/invalid-id');
      await page.locator('a:has-text("Unlock一覧に戻る")').click();
      await expect(page).toHaveURL('/ja/explorer/unlocks');
    });
  });

  test.describe('Navigation', () => {
    test('should display navigation bar', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();
      await expect(page.locator('nav[role="navigation"] >> text=概要')).toBeVisible();
      await expect(page.locator('nav[role="navigation"] >> text=Lock')).toBeVisible();
      await expect(page.locator('nav[role="navigation"] >> text=Unlock')).toBeVisible();
    });

    test('should have Unlocks tab as current page', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      const unlocksLink = page.locator('nav[role="navigation"] a[aria-current="page"]');
      await expect(unlocksLink).toHaveText('Unlock');
    });

    test('should navigate via breadcrumb', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');
      await page.locator('nav[aria-label="Breadcrumb"] >> text=Unlock一覧').click();
      await expect(page).toHaveURL('/ja/explorer/unlocks');
    });
  });

  test.describe('English Version', () => {
    test('should display in English when navigating to /en', async ({ page }) => {
      await page.goto('/en/explorer/unlocks/0x2e7f...d934');

      await expect(page.locator('text=All Unlocks')).toBeVisible();
      await expect(page.locator('text=Details')).toBeVisible();
      await expect(page.locator('text=Unlock Information')).toBeVisible();
      await expect(page.locator('text=Dilithium Signature')).toBeVisible();
      await expect(page.locator('text=Prover Signatures')).toBeVisible();
      await expect(page.locator('text=Timeline')).toBeVisible();
    });

    test('should display English status badges', async ({ page }) => {
      await page.goto('/en/explorer/unlocks/0x2e7f...d934');
      await expect(page.locator('text=Pending')).toBeVisible();
      await expect(page.locator('text=Normal')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA roles', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');

      // Navigation
      await expect(page.locator('nav[role="navigation"][aria-label="Explorer navigation"]')).toBeVisible();

      // Breadcrumb
      await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');

      // Tab to copy button
      const copyButton = page.locator('button:has-text("Unlock IDをコピー")');
      await copyButton.focus();
      await page.keyboard.press('Enter');

      await expect(page.locator('button:has-text("コピーしました")')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/ja/explorer/unlocks/0x2e7f...d934');

      // Content should still be visible
      await expect(page.locator('text=Unlock ID')).toBeVisible();
      await expect(page.locator('text=Unlock情報')).toBeVisible();
      await expect(page.locator('button:has-text("Unlock IDをコピー")')).toBeVisible();
    });
  });
});
