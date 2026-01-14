import { test, expect } from '@playwright/test';

test.describe('Unlock Sign Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/unlock-sign');
  });

  test('should display signature title', async ({ page }) => {
    await expect(page.getByText('署名が必要です')).toBeVisible();
  });

  test('should display subtitle', async ({ page }) => {
    await expect(
      page.getByText('Unlock要求を承認するためにDilithium署名を行います')
    ).toBeVisible();
  });

  test('should display unlock summary', async ({ page }) => {
    await expect(page.getByText('Unlock金額')).toBeVisible();
    await expect(page.getByText('10.00 ETH')).toBeVisible();
    await expect(page.getByText('Unlockタイプ')).toBeVisible();
    await expect(page.getByText('通常Unlock')).toBeVisible();
    await expect(page.getByText('待機時間')).toBeVisible();
    await expect(page.getByText('ガス代（概算）')).toBeVisible();
  });

  test('should display Dilithium info', async ({ page }) => {
    await expect(page.getByText(/Dilithium-III署名/)).toBeVisible();
    await expect(page.getByText(/量子コンピュータに対しても安全/)).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    await expect(page.getByText('キャンセル')).toBeVisible();
    await expect(page.getByText('署名してUnlock')).toBeVisible();
  });

  test('should show signing state when button clicked', async ({ page }) => {
    await page.getByText('署名してUnlock').click();
    await expect(page.getByText('署名中...')).toBeVisible();
  });

  test('should navigate to processing after signing', async ({ page }) => {
    await page.getByText('署名してUnlock').click();
    await expect(page).toHaveURL(/\/consumer\/unlock-processing/, { timeout: 3000 });
  });

  test('should have back button', async ({ page }) => {
    const backButton = page.locator('a[aria-label="戻る"]');
    await expect(backButton).toBeVisible();
  });
});

test.describe('Unlock Processing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/unlock-processing');
  });

  test('should display processing title', async ({ page }) => {
    await expect(page.getByText('Unlock処理中...')).toBeVisible();
  });

  test('should display subtitle', async ({ page }) => {
    await expect(page.getByText('Prover署名を待っています')).toBeVisible();
  });

  test('should display processing steps', async ({ page }) => {
    await expect(page.getByText('Dilithium署名を検証')).toBeVisible();
    await expect(page.getByText('Unlock要求を送信')).toBeVisible();
    await expect(page.getByText(/Prover署名を待機中/)).toBeVisible();
    await expect(page.getByText('Time Lock開始')).toBeVisible();
  });

  test('should have proper step list accessibility', async ({ page }) => {
    const stepList = page.locator('[role="list"]');
    await expect(stepList).toBeVisible();

    const listItems = page.locator('[role="listitem"]');
    expect(await listItems.count()).toBe(4);
  });

  test('should display time lock info', async ({ page }) => {
    await expect(page.getByText(/24時間のTime Lock/)).toBeVisible();
  });
});

test.describe('Unlock Success Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/unlock-success');
  });

  test('should display success title', async ({ page }) => {
    await expect(page.getByText('Time Lock開始！')).toBeVisible();
  });

  test('should display success subtitle', async ({ page }) => {
    await expect(
      page.getByText('24時間後にUnlockを実行できます')
    ).toBeVisible();
  });

  test('should display countdown timer', async ({ page }) => {
    await expect(page.getByText('Time Lock残り時間')).toBeVisible();
    // Countdown format: HH:MM:SS
    await expect(page.getByText(/\d{2}:\d{2}:\d{2}/)).toBeVisible();
  });

  test('should display unlock details', async ({ page }) => {
    await expect(page.getByText('Unlock金額')).toBeVisible();
    await expect(page.getByText('10.00 ETH')).toBeVisible();
    await expect(page.getByText('ステータス')).toBeVisible();
    await expect(page.getByText('Time Lock中')).toBeVisible();
    await expect(page.getByText('Unlock可能日時')).toBeVisible();
    await expect(page.getByText('TX Hash')).toBeVisible();
  });

  test('should display info box', async ({ page }) => {
    await expect(
      page.getByText(/Time Lock終了後、ダッシュボードからUnlockを完了できます/)
    ).toBeVisible();
  });

  test('should display navigation buttons', async ({ page }) => {
    await expect(page.getByText('ダッシュボードへ')).toBeVisible();
    await expect(page.getByText('履歴を見る')).toBeVisible();
  });

  test('should navigate to dashboard when button clicked', async ({ page }) => {
    await page.getByText('ダッシュボードへ').click();
    await expect(page).toHaveURL(/\/consumer\/dashboard/);
  });

  test('should navigate to history when button clicked', async ({ page }) => {
    await page.goto('/ja/consumer/unlock-success');
    await page.getByText('履歴を見る').click();
    await expect(page).toHaveURL(/\/consumer\/history/);
  });

  test('should have external link for TX hash', async ({ page }) => {
    const txLink = page.locator('a[target="_blank"]');
    await expect(txLink).toBeVisible();
    await expect(txLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should have progress bar', async ({ page }) => {
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
  });
});

test.describe('Unlock Flow (English)', () => {
  test('Unlock Sign should display in English', async ({ page }) => {
    await page.goto('/en/consumer/unlock-sign');
    await expect(page.getByText('Signature Required')).toBeVisible();
    await expect(page.getByText('Sign and Unlock')).toBeVisible();
  });

  test('Unlock Processing should display in English', async ({ page }) => {
    await page.goto('/en/consumer/unlock-processing');
    await expect(page.getByText('Processing Unlock...')).toBeVisible();
    await expect(page.getByText('Verifying Dilithium signature')).toBeVisible();
  });

  test('Unlock Success should display in English', async ({ page }) => {
    await page.goto('/en/consumer/unlock-success');
    await expect(page.getByText('Time Lock Started!')).toBeVisible();
    await expect(page.getByText('Go to Dashboard')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('Unlock Sign should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/ja/consumer/unlock-sign');

    // Key visual should have aria-label
    const visual = page.locator('[role="img"]');
    await expect(visual).toBeVisible();

    // Summary region should be accessible
    const summaryRegion = page.locator('[role="region"]');
    await expect(summaryRegion).toBeVisible();
  });

  test('Unlock Processing should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/ja/consumer/unlock-processing');

    // Processing visual should have aria-label
    const visual = page.locator('[role="img"]');
    await expect(visual).toBeVisible();

    // Step list should be accessible
    const stepList = page.locator('[role="list"]');
    await expect(stepList).toHaveAttribute('aria-label');
  });

  test('Unlock Success should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/ja/consumer/unlock-success');

    // Timer should have role="timer"
    const timer = page.locator('[role="timer"]');
    await expect(timer).toBeVisible();

    // Progress bar should be accessible
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toHaveAttribute('aria-valuenow');
  });
});

test.describe('Responsive Design', () => {
  test('Unlock Sign should display on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/consumer/unlock-sign');

    await expect(page.getByText('署名が必要です')).toBeVisible();
    await expect(page.getByText('署名してUnlock')).toBeVisible();
  });

  test('Unlock Processing should display on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/consumer/unlock-processing');

    await expect(page.getByText('Unlock処理中...')).toBeVisible();
    await expect(page.getByText('Dilithium署名を検証')).toBeVisible();
  });

  test('Unlock Success should display on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/consumer/unlock-success');

    await expect(page.getByText('Time Lock開始！')).toBeVisible();
    await expect(page.getByText('ダッシュボードへ')).toBeVisible();
  });
});
