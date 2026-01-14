import { test, expect } from '@playwright/test';

test.describe('Lock Processing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/lock-processing');
  });

  test('should display processing title', async ({ page }) => {
    await expect(page.getByText('Lock処理中...')).toBeVisible();
  });

  test('should display subtitle warning', async ({ page }) => {
    await expect(
      page.getByText('しばらくお待ちください。このページを閉じないでください。')
    ).toBeVisible();
  });

  test('should display processing steps', async ({ page }) => {
    await expect(page.getByText('Dilithium署名を生成')).toBeVisible();
    await expect(page.getByText('トランザクションを作成')).toBeVisible();
    await expect(page.getByText(/ブロックチェーンに送信中/)).toBeVisible();
    await expect(page.getByText('確認を待機')).toBeVisible();
  });

  test('should have proper step list accessibility', async ({ page }) => {
    const stepList = page.locator('[role="list"]');
    await expect(stepList).toBeVisible();

    const listItems = page.locator('[role="listitem"]');
    expect(await listItems.count()).toBe(4);
  });

  test('should show TX hash after delay', async ({ page }) => {
    // Initially TX hash might not be visible
    // Wait for it to appear
    await expect(page.getByText(/TX:/)).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Lock Success Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/lock-success');
  });

  test('should display success title', async ({ page }) => {
    await expect(page.getByText('Lock完了！')).toBeVisible();
  });

  test('should display success subtitle', async ({ page }) => {
    await expect(
      page.getByText('資産は量子耐性暗号で安全に保護されています')
    ).toBeVisible();
  });

  test('should display lock details', async ({ page }) => {
    await expect(page.getByText('Lock金額')).toBeVisible();
    await expect(page.getByText('5.00 ETH')).toBeVisible();
    await expect(page.getByText('ステータス')).toBeVisible();
    await expect(page.getByText('Locked')).toBeVisible();
    await expect(page.getByText('日時')).toBeVisible();
    await expect(page.getByText('TX Hash')).toBeVisible();
    await expect(page.getByText('ガス代')).toBeVisible();
  });

  test('should display info box', async ({ page }) => {
    await expect(
      page.getByText(/Unlockには24時間のTime Lock/)
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
    await page.goto('/ja/consumer/lock-success');
    await page.getByText('履歴を見る').click();
    await expect(page).toHaveURL(/\/consumer\/history/);
  });

  test('should have external link for TX hash', async ({ page }) => {
    const txLink = page.locator('a[target="_blank"]');
    await expect(txLink).toBeVisible();
    await expect(txLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

test.describe('Lock Flow (English)', () => {
  test('Lock Processing should display in English', async ({ page }) => {
    await page.goto('/en/consumer/lock-processing');
    await expect(page.getByText('Processing Lock...')).toBeVisible();
    await expect(page.getByText('Generating Dilithium signature')).toBeVisible();
  });

  test('Lock Success should display in English', async ({ page }) => {
    await page.goto('/en/consumer/lock-success');
    await expect(page.getByText('Lock Complete!')).toBeVisible();
    await expect(page.getByText('Lock Amount')).toBeVisible();
    await expect(page.getByText('Go to Dashboard')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('Lock Processing should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/ja/consumer/lock-processing');

    // Processing visual should have aria-label
    const visual = page.locator('[role="img"]');
    await expect(visual).toBeVisible();

    // Step list should be accessible
    const stepList = page.locator('[role="list"]');
    await expect(stepList).toHaveAttribute('aria-label');
  });

  test('Lock Success should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/ja/consumer/lock-success');

    // Success icon should have aria-label
    const successIcon = page.locator('[role="img"]');
    await expect(successIcon).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('Lock Processing should display on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/consumer/lock-processing');

    await expect(page.getByText('Lock処理中...')).toBeVisible();
    await expect(page.getByText('Dilithium署名を生成')).toBeVisible();
  });

  test('Lock Success should display on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/consumer/lock-success');

    await expect(page.getByText('Lock完了！')).toBeVisible();
    await expect(page.getByText('ダッシュボードへ')).toBeVisible();
  });
});
